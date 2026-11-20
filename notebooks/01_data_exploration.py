
from pathlib import Path

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# --------------------------------------------------
# 1. Project paths
# --------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "dataset"
OUTPUT_DIR = PROJECT_ROOT / "docs" / "eda_outputs"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# --------------------------------------------------
# 2. Load datasets
# --------------------------------------------------

train = pd.read_csv(DATA_DIR / "train.csv")
store = pd.read_csv(DATA_DIR / "store.csv")
test = pd.read_csv(DATA_DIR / "test.csv")

train["Date"] = pd.to_datetime(train["Date"])
test["Date"] = pd.to_datetime(test["Date"])

print("=" * 60)
print("RETAIL ANALYTICS - DATA EXPLORATION")
print("=" * 60)

# --------------------------------------------------
# 3. Dataset overview
# --------------------------------------------------

print("\n--- DATASET SHAPES ---")
print(f"Training data: {train.shape}")
print(f"Store data: {store.shape}")
print(f"Test data: {test.shape}")

print("\n--- TRAINING COLUMNS ---")
print(train.columns.tolist())

print("\n--- DATA TYPES ---")
print(train.dtypes)

print("\n--- FIRST 5 ROWS ---")
print(train.head())

# --------------------------------------------------
# 4. Missing values
# --------------------------------------------------

print("\n--- MISSING VALUES: TRAIN ---")
missing_train = train.isnull().sum()
print(missing_train[missing_train > 0])

print("\n--- MISSING VALUES: STORE ---")
missing_store = store.isnull().sum()
print(missing_store[missing_store > 0])

print("\n--- MISSING VALUES: TEST ---")
missing_test = test.isnull().sum()
print(missing_test[missing_test > 0])

# --------------------------------------------------
# 5. Duplicate records
# --------------------------------------------------

print("\n--- DUPLICATE RECORDS ---")
print("Train duplicates:", train.duplicated().sum())
print("Store duplicates:", store.duplicated().sum())
print("Test duplicates:", test.duplicated().sum())

print(
    "Duplicate Store-Date pairs:",
    train.duplicated(subset=["Store", "Date"]).sum()
)

# --------------------------------------------------
# 6. Sales statistics
# --------------------------------------------------

print("\n--- SALES STATISTICS ---")
print(train["Sales"].describe())

print("\nZero-sales records:", (train["Sales"] == 0).sum())
print("Closed-store records:", (train["Open"] == 0).sum())

open_stores = train[train["Open"] == 1]

print("\nAverage sales when store is open:")
print(open_stores["Sales"].mean())

print("\nMedian sales when store is open:")
print(open_stores["Sales"].median())

# --------------------------------------------------
# 7. Date range
# --------------------------------------------------

print("\n--- DATE RANGE ---")
print("Start:", train["Date"].min())
print("End:", train["Date"].max())

print("Unique stores:", train["Store"].nunique())
print("Unique dates:", train["Date"].nunique())

# --------------------------------------------------
# 8. Sales by weekday
# --------------------------------------------------

weekday_sales = (
    train[train["Open"] == 1]
    .groupby("DayOfWeek")
    .agg(
        avg_sales=("Sales", "mean"),
        total_sales=("Sales", "sum"),
        avg_customers=("Customers", "mean")
    )
    .round(2)
)

print("\n--- SALES BY WEEKDAY ---")
print(weekday_sales)

weekday_sales["avg_sales"].plot(
    kind="bar",
    figsize=(10, 5),
    title="Average Sales by Day of Week"
)

plt.xlabel("Day of Week (1 = Monday, 7 = Sunday)")
plt.ylabel("Average Sales")
plt.tight_layout()

plt.savefig(OUTPUT_DIR / "sales_by_weekday.png")
plt.close()

# --------------------------------------------------
# 9. Promotion analysis
# --------------------------------------------------

promo_analysis = (
    train[train["Open"] == 1]
    .groupby("Promo")
    .agg(
        avg_sales=("Sales", "mean"),
        avg_customers=("Customers", "mean"),
        total_sales=("Sales", "sum"),
        record_count=("Sales", "count")
    )
    .round(2)
)

print("\n--- PROMOTION ANALYSIS ---")
print(promo_analysis)

# --------------------------------------------------
# 10. Store performance
# --------------------------------------------------

store_performance = (
    train[train["Open"] == 1]
    .groupby("Store")
    .agg(
        total_sales=("Sales", "sum"),
        avg_sales=("Sales", "mean"),
        total_customers=("Customers", "sum"),
        avg_customers=("Customers", "mean")
    )
    .sort_values("total_sales", ascending=False)
    .round(2)
)

print("\n--- TOP 10 STORES BY REVENUE ---")
print(store_performance.head(10))

print("\n--- BOTTOM 10 STORES BY REVENUE ---")
print(store_performance.tail(10))

store_performance.to_csv(OUTPUT_DIR / "store_performance.csv")

# --------------------------------------------------
# 11. Monthly sales trends
# --------------------------------------------------

monthly_sales = (
    train[train["Open"] == 1]
    .set_index("Date")
    .resample("ME")["Sales"]
    .sum()
)

print("\n--- MONTHLY SALES ---")
print(monthly_sales)

monthly_sales.plot(
    figsize=(12, 5),
    title="Monthly Total Sales Trend"
)

plt.xlabel("Month")
plt.ylabel("Total Sales")
plt.tight_layout()

plt.savefig(OUTPUT_DIR / "monthly_sales_trend.png")
plt.close()

# --------------------------------------------------
# 12. Sales vs customers correlation
# --------------------------------------------------

correlation = train[["Sales", "Customers", "Promo"]].corr()

print("\n--- CORRELATION MATRIX ---")
print(correlation)

# --------------------------------------------------
# 13. Merge train with store information
# --------------------------------------------------

merged = train.merge(
    store,
    on="Store",
    how="left"
)

print("\n--- MERGED DATA ---")
print("Merged shape:", merged.shape)

print("\n--- SALES BY STORE TYPE ---")
store_type_analysis = (
    merged[merged["Open"] == 1]
    .groupby("StoreType")
    .agg(
        avg_sales=("Sales", "mean"),
        total_sales=("Sales", "sum"),
        avg_customers=("Customers", "mean"),
        store_count=("Store", "nunique")
    )
    .round(2)
)

print(store_type_analysis)

# --------------------------------------------------
# 14. Save analysis outputs
# --------------------------------------------------

weekday_sales.to_csv(OUTPUT_DIR / "weekday_analysis.csv")
promo_analysis.to_csv(OUTPUT_DIR / "promotion_analysis.csv")
monthly_sales.to_csv(OUTPUT_DIR / "monthly_sales.csv")
store_type_analysis.to_csv(OUTPUT_DIR / "store_type_analysis.csv")

print("\n" + "=" * 60)
print("EDA COMPLETE")
print(f"Output files saved in: {OUTPUT_DIR}")
print("=" * 60)
