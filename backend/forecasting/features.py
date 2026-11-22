
from pathlib import Path

import pandas as pd


# ============================================================
# PROJECT PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

TRAIN_PATH = PROJECT_ROOT / "dataset" / "train.csv"
STORE_PATH = PROJECT_ROOT / "dataset" / "store.csv"


# ============================================================
# 1. LOAD AND VALIDATE DATA
# ============================================================

def load_data():
    """
    Load Rossmann sales and store datasets.

    Validate required columns, dates, sales values,
    and store metadata before merging.
    """

    if not TRAIN_PATH.exists():
        raise FileNotFoundError(
            f"Training dataset not found: {TRAIN_PATH}"
        )

    if not STORE_PATH.exists():
        raise FileNotFoundError(
            f"Store dataset not found: {STORE_PATH}"
        )

    print("Reading sales dataset...")

    sales = pd.read_csv(
        TRAIN_PATH,
        low_memory=False
    )

    print("Reading store dataset...")

    stores = pd.read_csv(STORE_PATH)

    required_sales = {
        "Store", "Date", "Sales", "Customers",
        "Open", "Promo", "StateHoliday", "SchoolHoliday"
    }

    required_stores = {
        "Store", "StoreType", "Assortment",
        "CompetitionDistance",
        "CompetitionOpenSinceMonth",
        "CompetitionOpenSinceYear",
        "Promo2", "Promo2SinceWeek",
        "Promo2SinceYear", "PromoInterval"
    }

    missing_sales = required_sales - set(sales.columns)
    missing_stores = required_stores - set(stores.columns)

    if missing_sales:
        raise ValueError(
            f"Missing sales columns: {missing_sales}"
        )

    if missing_stores:
        raise ValueError(
            f"Missing store columns: {missing_stores}"
        )

    # Clean data types
    sales["Date"] = pd.to_datetime(
        sales["Date"],
        errors="coerce"
    )

    sales["StateHoliday"] = (
        sales["StateHoliday"].astype(str).str.strip()
    )

    if sales["Date"].isna().any():
        raise ValueError("Invalid dates found in sales dataset.")

    if sales["Sales"].isna().any():
        raise ValueError("Missing sales values found.")

    if (sales["Sales"] < 0).any():
        raise ValueError("Negative sales values found.")

    if sales.duplicated(["Store", "Date"]).any():
        raise ValueError("Duplicate Store-Date records found.")

    if stores["Store"].duplicated().any():
        raise ValueError("Duplicate store IDs found in store dataset.")

    # Merge sales and store metadata
    data = sales.merge(
        stores,
        on="Store",
        how="left",
        validate="many_to_one",
        indicator=True
    )

    unmatched = (data["_merge"] != "both").sum()

    if unmatched:
        raise ValueError(
            f"{unmatched} sales records have no matching store."
        )

    data = data.drop(columns=["_merge"])

    # Handle missing store attributes
    data["CompetitionDistance"] = (
        data["CompetitionDistance"].fillna(
            data["CompetitionDistance"].median()
        )
    )

    zero_fill_columns = [
        "CompetitionOpenSinceMonth",
        "CompetitionOpenSinceYear",
        "Promo2SinceWeek",
        "Promo2SinceYear"
    ]

    for column in zero_fill_columns:
        data[column] = data[column].fillna(0)

    data["PromoInterval"] = (
        data["PromoInterval"].fillna("None")
    )

    print(f"Daily records loaded: {len(data):,}")
    print(f"Unique stores: {data['Store'].nunique():,}")

    return data


# ============================================================
# 2. WEEKLY SALES AGGREGATION
# ============================================================

def build_weekly_dataset(data):
    """
    Aggregate daily records into store-level weekly sales.

    Week definition: Monday to Sunday.

    Only complete seven-day calendar weeks are retained.
    """

    data = data.copy()

    # Monday-Sunday week identifier
    data["WeekStart"] = (
        data["Date"]
        .dt.to_period("W-SUN")
        .dt.start_time
    )

    # Holiday indicator
    data["IsStateHoliday"] = (
        data["StateHoliday"] != "0"
    ).astype(int)

    # Weekly aggregation
    weekly = (
        data.groupby(
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

    # Exclude incomplete calendar weeks
    weekly = weekly[
        weekly["ObservedDays"] == 7
    ].copy()

    # Store-level attributes
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

    store_info = (
        data[store_columns]
        .drop_duplicates(subset=["Store"])
    )

    weekly = weekly.merge(
        store_info,
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

    # Sort records
    weekly = (
        weekly.sort_values(
            ["Store", "WeekStart"]
        )
        .reset_index(drop=True)
    )

    return weekly


# ============================================================
# 3. HISTORICAL SALES FEATURES
# ============================================================

def add_lag_features(weekly):
    """
    Generate historical sales features using exact calendar weeks.

    Missing store-week observations remain NaN.
    Lag features never jump across missing calendar weeks.

    The current week's sales are never used as its own feature.
    """

    weekly = weekly.copy()

    weekly["WeekStart"] = pd.to_datetime(
        weekly["WeekStart"]
    )

    weekly = weekly.sort_values(
        ["Store", "WeekStart"]
    ).reset_index(drop=True)

    # Create the complete calendar across the dataset.
    all_weeks = pd.date_range(
        start=weekly["WeekStart"].min(),
        end=weekly["WeekStart"].max(),
        freq="7D"
    )

    feature_frames = []

    # Process each store independently
    for store_id, group in weekly.groupby(
        "Store",
        sort=False
    ):

        # Reindex to all calendar weeks.
        # Missing weeks receive NaN, never artificial zero sales.
        history = (
            group.set_index("WeekStart")
            .reindex(all_weeks)
        )

        sales = history["WeeklySales"]

        features = pd.DataFrame(
            index=all_weeks
        )

        features["Store"] = store_id

        # Exact historical calendar-week lags
        features["Sales_Lag_1"] = sales.shift(1)
        features["Sales_Lag_2"] = sales.shift(2)
        features["Sales_Lag_4"] = sales.shift(4)
        features["Sales_Lag_8"] = sales.shift(8)

        # Rolling averages based only on previous weeks
        previous_sales = sales.shift(1)

        features["Sales_Rolling_Mean_4"] = (
            previous_sales.rolling(
                window=4,
                min_periods=4
            ).mean()
        )

        features["Sales_Rolling_Mean_8"] = (
            previous_sales.rolling(
                window=8,
                min_periods=8
            ).mean()
        )

        features.index.name = "WeekStart"

        feature_frames.append(
            features.reset_index()
        )

    # Combine historical features from all stores
    historical_features = pd.concat(
        feature_frames,
        ignore_index=True
    )

    # Merge features into original weekly dataset
    weekly = weekly.merge(
        historical_features,
        on=["Store", "WeekStart"],
        how="left",
        validate="one_to_one"
    )

    return (
        weekly.sort_values(
            ["Store", "WeekStart"]
        )
        .reset_index(drop=True)
    )


# ============================================================
# 4. COMPLETE FORECASTING DATA PREPARATION
# ============================================================

def prepare_forecasting_data():
    """
    Execute the complete forecasting data preparation pipeline.
    """

    print("\n" + "=" * 60)
    print("RETAIL SALES FORECASTING - DATA PREPARATION")
    print("=" * 60)

    # Load data
    print("\nSTEP 1: Loading datasets")

    daily_data = load_data()

    # Aggregate weekly sales
    print("\nSTEP 2: Aggregating weekly sales")

    weekly_data = build_weekly_dataset(daily_data)

    # Historical features
    print("\nSTEP 3: Creating historical features")

    weekly_data = add_lag_features(weekly_data)

    # Summary
    print("\n" + "=" * 60)
    print("DATA PREPARATION SUMMARY")
    print("=" * 60)

    print(f"Daily records: {len(daily_data):,}")
    print(f"Weekly records: {len(weekly_data):,}")
    print(f"Unique stores: {weekly_data['Store'].nunique():,}")

    print(
        "Date range:",
        weekly_data["WeekStart"].min(),
        "to",
        weekly_data["WeekStart"].max()
    )

    print(
        "Complete weeks:",
        weekly_data["WeekStart"].nunique()
    )

    lag_columns = [
        "Sales_Lag_1",
        "Sales_Lag_2",
        "Sales_Lag_4",
        "Sales_Lag_8",
        "Sales_Rolling_Mean_4",
        "Sales_Rolling_Mean_8"
    ]

    print("\nMissing historical feature values:")

    print(
        weekly_data[lag_columns]
        .isna()
        .sum()
        .to_string()
    )

    print("\nWeekly dataset preview:")

    print(
        weekly_data.head(10).to_string(index=False)
    )

    # Additional data quality checks
    print("\nDATA QUALITY CHECKS")

    duplicate_count = weekly_data.duplicated(
        ["Store", "WeekStart"]
    ).sum()

    print(
        f"Duplicate Store-Week records: {duplicate_count}"
    )

    print(
        "Stores with incomplete weekly history:",
        int((weekly_data.groupby("Store").size() < len(
            weekly_data["WeekStart"].unique()
        )).sum())
    )

    print("\nData preparation completed successfully.")

    return weekly_data


# ============================================================
# 5. SCRIPT ENTRY POINT
# ============================================================

if __name__ == "__main__":

    forecasting_data = prepare_forecasting_data()

    print("\nFinal dataset shape:")
    print(forecasting_data.shape)

    print("\nAvailable columns:")
    print(forecasting_data.columns.tolist())
