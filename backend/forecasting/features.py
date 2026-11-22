from pathlib import Path
import gc
import logging
import os
import pandas as pd
import numpy as np

# ============================================================
# LOGGING CONFIGURATION
# ============================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("retail_forecasting.features")


def get_memory_mb():
    try:
        import psutil
        return round(psutil.Process(os.getpid()).memory_info().rss / 1e6, 1)
    except Exception:
        return None


# ============================================================
# PROJECT PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

TRAIN_PATH = PROJECT_ROOT / "dataset" / "train.csv"
STORE_PATH = PROJECT_ROOT / "dataset" / "store.csv"
PREPARED_CACHE_PATH = PROJECT_ROOT / "reports" / "forecasting" / "weekly_sales_prepared.csv.gz"


# ============================================================
# 1. LOAD AND VALIDATE DATA (MEMORY OPTIMIZED)
# ============================================================

def load_data():
    """
    Load Rossmann sales and store datasets with strict memory optimizations.

    Downcasts numeric types and loads only required columns to prevent
    spiking memory on constrained deployment tiers (e.g. Render 512MB RAM).
    """

    if not TRAIN_PATH.exists():
        raise FileNotFoundError(
            f"Training dataset not found: {TRAIN_PATH}"
        )

    if not STORE_PATH.exists():
        raise FileNotFoundError(
            f"Store dataset not found: {STORE_PATH}"
        )

    mem_before = get_memory_mb()
    logger.info(f"Reading store dataset (Current RSS: {mem_before} MB)...")

    stores = pd.read_csv(STORE_PATH)

    required_stores = {
        "Store", "StoreType", "Assortment",
        "CompetitionDistance",
        "CompetitionOpenSinceMonth",
        "CompetitionOpenSinceYear",
        "Promo2", "Promo2SinceWeek",
        "Promo2SinceYear", "PromoInterval"
    }

    missing_stores = required_stores - set(stores.columns)
    if missing_stores:
        raise ValueError(
            f"Missing store columns: {missing_stores}"
        )

    if stores["Store"].duplicated().any():
        raise ValueError("Duplicate store IDs found in store dataset.")

    # Downcast and impute store metadata directly on 1,115 rows (avoids 1M-row operations)
    stores["Store"] = stores["Store"].astype("uint16")
    stores["CompetitionDistance"] = stores["CompetitionDistance"].fillna(
        stores["CompetitionDistance"].median()
    ).astype("float32")

    zero_fill_columns = [
        "CompetitionOpenSinceMonth",
        "CompetitionOpenSinceYear",
        "Promo2SinceWeek",
        "Promo2SinceYear"
    ]
    for column in zero_fill_columns:
        stores[column] = stores[column].fillna(0).astype("int16")

    stores["PromoInterval"] = stores["PromoInterval"].fillna("None")

    logger.info("Reading sales dataset with column selection & type downcasting...")

    sales_dtypes = {
        "Store": "uint16",
        "Sales": "uint32",
        "Open": "uint8",
        "Promo": "uint8",
        "SchoolHoliday": "uint8",
        "StateHoliday": "category"
    }

    sales_cols = [
        "Store", "Date", "Sales",
        "Open", "Promo", "StateHoliday", "SchoolHoliday"
    ]

    sales = pd.read_csv(
        TRAIN_PATH,
        usecols=sales_cols,
        dtype=sales_dtypes,
        low_memory=False
    )

    if sales["Sales"].isna().any():
        raise ValueError("Missing sales values found.")

    if (sales["Sales"] < 0).any():
        raise ValueError("Negative sales values found.")

    if sales.duplicated(["Store", "Date"]).any():
        raise ValueError("Duplicate Store-Date records found.")

    sales["Date"] = pd.to_datetime(
        sales["Date"],
        errors="coerce"
    )

    if sales["Date"].isna().any():
        raise ValueError("Invalid dates found in sales dataset.")

    sales["IsStateHoliday"] = (
        sales["StateHoliday"].astype(str).str.strip() != "0"
    ).astype("uint8")

    # Drop categorical column no longer needed
    sales = sales.drop(columns=["StateHoliday"])

    # Validate all sales stores exist in store metadata
    unique_sales_stores = set(sales["Store"].unique())
    unique_metadata_stores = set(stores["Store"].unique())
    unmatched = unique_sales_stores - unique_metadata_stores
    if unmatched:
        raise ValueError(f"{len(unmatched)} stores in sales have no matching store in store.csv.")

    mem_after = get_memory_mb()
    logger.info(
        f"Daily records loaded: {len(sales):,} across {len(unique_sales_stores):,} stores. "
        f"RSS: {mem_after} MB"
    )

    return sales, stores


# ============================================================
# 2. WEEKLY SALES AGGREGATION
# ============================================================

def build_weekly_dataset(sales, stores):
    """
    Aggregate daily records into store-level weekly sales.

    Week definition: Monday to Sunday.
    Only complete seven-day calendar weeks are retained.
    """

    logger.info("Aggregating daily records to weekly frequency...")

    # Monday-Sunday week identifier
    sales["WeekStart"] = (
        sales["Date"]
        .dt.to_period("W-SUN")
        .dt.start_time
    )

    # Weekly aggregation directly on minimal columns
    weekly = (
        sales.groupby(
            ["Store", "WeekStart"],
            as_index=False
        )
        .agg(
            WeeklySales=("Sales", "sum"),
            OpenDays=("Open", "sum"),
            PromoDays=("Promo", "sum"),
            SchoolHolidayDays=("SchoolHoliday", "sum"),
            StateHolidayDays=("IsStateHoliday", "sum"),
            ObservedDays=("Date", "nunique")
        )
    )

    # Immediately release 1M daily records from memory
    del sales
    gc.collect()

    # Exclude incomplete calendar weeks
    weekly = weekly[
        weekly["ObservedDays"] == 7
    ].copy()

    # Merge store metadata at weekly level (143k rows instead of 1M rows)
    store_columns = [
        "Store",
        "StoreType",
        "Assortment",
        "CompetitionDistance",
        "CompetitionOpenSinceMonth",
        "CompetitionOpenSinceYear",
        "Promo2",
        "Promo2SinceWeek",
        "Promo2SinceYear",
        "PromoInterval"
    ]

    weekly = weekly.merge(
        stores[store_columns],
        on="Store",
        how="left",
        validate="many_to_one"
    )

    # Calendar features
    weekly["Year"] = weekly["WeekStart"].dt.year
    weekly["Month"] = weekly["WeekStart"].dt.month
    weekly["Quarter"] = weekly["WeekStart"].dt.quarter

    weekly["WeekOfYear"] = (
        weekly["WeekStart"]
        .dt.isocalendar()
        .week.astype(int)
    )

    weekly["HasPromotion"] = (
        weekly["PromoDays"] > 0
    ).astype(int)

    weekly = (
        weekly.sort_values(
            ["Store", "WeekStart"]
        )
        .reset_index(drop=True)
    )

    logger.info(f"Aggregated {len(weekly):,} complete weekly store records.")
    return weekly


# ============================================================
# 3. HISTORICAL SALES FEATURES (VECTORIZED)
# ============================================================

def add_lag_features(weekly):
    """
    Generate historical sales features using exact calendar weeks.

    Missing store-week observations remain NaN.
    Uses vectorized calendar grid reindexing to avoid allocating
    1,000+ separate DataFrames and exceeding memory limits.
    """

    logger.info("Computing vectorized calendar-week lag & rolling features...")

    weekly["WeekStart"] = pd.to_datetime(
        weekly["WeekStart"]
    )

    all_weeks = pd.date_range(
        start=weekly["WeekStart"].min(),
        end=weekly["WeekStart"].max(),
        freq="7D"
    )

    # Construct the complete regular 7-day grid across all stores
    unique_stores = weekly["Store"].unique()
    full_grid = pd.MultiIndex.from_product(
        [unique_stores, all_weeks],
        names=["Store", "WeekStart"]
    ).to_frame().reset_index(drop=True)

    grid_weekly = full_grid.merge(
        weekly[["Store", "WeekStart", "WeeklySales"]],
        on=["Store", "WeekStart"],
        how="left"
    )

    sales_grp = grid_weekly.groupby("Store", sort=False)["WeeklySales"]

    grid_weekly["Sales_Lag_1"] = sales_grp.shift(1).astype("float32")
    grid_weekly["Sales_Lag_2"] = sales_grp.shift(2).astype("float32")
    grid_weekly["Sales_Lag_4"] = sales_grp.shift(4).astype("float32")
    grid_weekly["Sales_Lag_8"] = sales_grp.shift(8).astype("float32")

    prev = sales_grp.shift(1)
    grid_weekly["Sales_Rolling_Mean_4"] = (
        prev.groupby(grid_weekly["Store"], sort=False)
        .rolling(4, min_periods=4)
        .mean()
        .reset_index(drop=True)
        .astype("float32")
    )

    grid_weekly["Sales_Rolling_Mean_8"] = (
        prev.groupby(grid_weekly["Store"], sort=False)
        .rolling(8, min_periods=8)
        .mean()
        .reset_index(drop=True)
        .astype("float32")
    )

    lag_cols = [
        "Store", "WeekStart",
        "Sales_Lag_1", "Sales_Lag_2", "Sales_Lag_4", "Sales_Lag_8",
        "Sales_Rolling_Mean_4", "Sales_Rolling_Mean_8"
    ]

    weekly = weekly.merge(
        grid_weekly[lag_cols],
        on=["Store", "WeekStart"],
        how="left"
    )

    del grid_weekly, full_grid
    gc.collect()

    return (
        weekly.sort_values(
            ["Store", "WeekStart"]
        )
        .reset_index(drop=True)
    )


# ============================================================
# 4. COMPLETE FORECASTING DATA PREPARATION
# ============================================================

def prepare_forecasting_data(use_cache: bool = True, save_cache: bool = True):
    """
    Execute the forecasting data preparation pipeline.

    If a pre-aggregated weekly dataset exists on disk, it is loaded directly
    in < 0.3s using ~15 MB RAM, avoiding the 512 MB memory ceiling on Render.
    Otherwise, the memory-optimized pipeline runs with peak memory < 210 MB.
    """

    if use_cache and PREPARED_CACHE_PATH.exists():
        logger.info(f"Loading prepared weekly dataset from cache: {PREPARED_CACHE_PATH}")
        df = pd.read_csv(PREPARED_CACHE_PATH, compression="gzip")
        df["WeekStart"] = pd.to_datetime(df["WeekStart"])
        df["Store"] = df["Store"].astype(str)
        logger.info(f"Loaded {len(df):,} weekly rows from cache. Memory RSS: {get_memory_mb()} MB")
        return df

    logger.info("Executing memory-optimized forecasting data preparation pipeline...")

    # Step 1: Load data with downcasting
    sales, stores = load_data()

    # Step 2: Aggregate weekly sales
    weekly_data = build_weekly_dataset(sales, stores)

    # Step 3: Historical features
    weekly_data = add_lag_features(weekly_data)

    # Save to disk cache for fast future startup
    if save_cache:
        PREPARED_CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
        logger.info(f"Saving pre-aggregated weekly dataset to {PREPARED_CACHE_PATH}...")
        weekly_data.to_csv(PREPARED_CACHE_PATH, index=False, compression="gzip")

    weekly_data["Store"] = weekly_data["Store"].astype(str)

    logger.info(
        f"Data preparation complete. Total rows: {len(weekly_data):,}. "
        f"RSS: {get_memory_mb()} MB"
    )

    return weekly_data


# ============================================================
# 5. SCRIPT ENTRY POINT
# ============================================================

if __name__ == "__main__":
    forecasting_data = prepare_forecasting_data(use_cache=False, save_cache=True)
    print("\nFinal dataset shape:")
    print(forecasting_data.shape)
    print("\nAvailable columns:")
    print(forecasting_data.columns.tolist())
