
import os
from pathlib import Path

import pandas as pd
import psycopg2
import matplotlib.pyplot as plt
from dotenv import load_dotenv


# --------------------------------------------------
# PROJECT CONFIGURATION
# --------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[2]

REPORT_DIR = PROJECT_ROOT / "reports" / "eda"
REPORT_DIR.mkdir(parents=True, exist_ok=True)

# Load environment variables from project root
load_dotenv(PROJECT_ROOT / ".env")

DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "database": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD")
}


# --------------------------------------------------
# DATABASE CONNECTION
# --------------------------------------------------

def get_connection():
    required_variables = [
        "DB_HOST",
        "DB_NAME",
        "DB_USER",
        "DB_PASSWORD"
    ]

    missing = [
        variable for variable in required_variables
        if not os.getenv(variable)
    ]

    if missing:
        raise ValueError(
            f"Missing environment variables in .env: {', '.join(missing)}"
        )

    return psycopg2.connect(**DB_CONFIG)


def fetch_data(connection, query):
    return pd.read_sql_query(query, connection)


# --------------------------------------------------
# SAVE REPORTS
# --------------------------------------------------

def save_csv(dataframe, filename):
    path = REPORT_DIR / filename
    dataframe.to_csv(path, index=False)
    print(f"Saved: {path}")


def save_chart(filename):
    path = REPORT_DIR / filename
    plt.tight_layout()
    plt.savefig(path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"Chart saved: {path}")


# --------------------------------------------------
# 1. BUSINESS OVERVIEW
# --------------------------------------------------

def business_overview(connection):
    print("\n1. BUSINESS OVERVIEW")

    query = """
        SELECT
            COUNT(*) AS total_records,
            COUNT(DISTINCT store_id) AS total_stores,
            MIN(date) AS first_date,
            MAX(date) AS last_date,
            SUM(sales) AS total_sales,
            ROUND(AVG(sales)::NUMERIC, 2) AS average_sales,
            SUM(customers) AS total_customers,
            ROUND(AVG(customers)::NUMERIC, 2) AS average_customers,
            SUM(CASE WHEN is_open THEN 1 ELSE 0 END) AS open_records,
            SUM(CASE WHEN promo THEN 1 ELSE 0 END) AS promotion_records
        FROM sales;
    """

    df = fetch_data(connection, query)
    save_csv(df, "business_overview.csv")
    print(df.to_string(index=False))


# --------------------------------------------------
# 2. MONTHLY SALES ANALYSIS
# --------------------------------------------------

def monthly_sales(connection):
    print("\n2. MONTHLY SALES ANALYSIS")

    query = """
        SELECT
            DATE_TRUNC('month', date)::DATE AS month,
            SUM(sales) AS total_sales,
            ROUND(AVG(sales)::NUMERIC, 2) AS average_sales
        FROM sales
        WHERE is_open = TRUE
        GROUP BY DATE_TRUNC('month', date)
        ORDER BY month;
    """

    df = fetch_data(connection, query)
    save_csv(df, "monthly_sales.csv")

    df["month"] = pd.to_datetime(df["month"])

    plt.figure(figsize=(12, 5))
    plt.plot(df["month"], df["total_sales"], marker="o")
    plt.title("Monthly Retail Sales")
    plt.xlabel("Month")
    plt.ylabel("Total Sales")
    plt.xticks(rotation=45)
    save_chart("monthly_sales.png")


# --------------------------------------------------
# 3. TOP 10 STORES
# --------------------------------------------------

def top_stores(connection):
    print("\n3. TOP 10 STORES")

    query = """
        SELECT
            store_id,
            SUM(sales) AS total_sales,
            SUM(customers) AS total_customers
        FROM sales
        WHERE is_open = TRUE
        GROUP BY store_id
        ORDER BY total_sales DESC
        LIMIT 10;
    """

    df = fetch_data(connection, query)
    save_csv(df, "top_10_stores.csv")

    plt.figure(figsize=(10, 5))
    plt.bar(
        df["store_id"].astype(str),
        df["total_sales"]
    )
    plt.title("Top 10 Stores by Revenue")
    plt.xlabel("Store ID")
    plt.ylabel("Total Sales")
    save_chart("top_10_stores.png")


# --------------------------------------------------
# 4. PROMOTION ANALYSIS
# --------------------------------------------------

def promotion_analysis(connection):
    print("\n4. PROMOTION ANALYSIS")

    query = """
        SELECT
            promo,
            COUNT(*) AS total_records,
            ROUND(AVG(sales)::NUMERIC, 2) AS average_sales,
            ROUND(AVG(customers)::NUMERIC, 2) AS average_customers
        FROM sales
        WHERE is_open = TRUE
        GROUP BY promo
        ORDER BY promo;
    """

    df = fetch_data(connection, query)
    save_csv(df, "promotion_analysis.csv")

    plt.figure(figsize=(7, 5))
    plt.bar(
        df["promo"].astype(str),
        df["average_sales"]
    )
    plt.title("Average Sales: Promotion vs No Promotion")
    plt.xlabel("Promotion (0 = No, 1 = Yes)")
    plt.ylabel("Average Sales")
    save_chart("promotion_analysis.png")


# --------------------------------------------------
# 5. WEEKDAY SALES ANALYSIS
# --------------------------------------------------

def weekday_analysis(connection):
    print("\n5. WEEKDAY SALES ANALYSIS")

    query = """
        SELECT
            day_of_week,
            ROUND(AVG(sales)::NUMERIC, 2) AS average_sales,
            ROUND(AVG(customers)::NUMERIC, 2) AS average_customers
        FROM sales
        WHERE is_open = TRUE
        GROUP BY day_of_week
        ORDER BY day_of_week;
    """

    df = fetch_data(connection, query)
    save_csv(df, "weekday_analysis.csv")

    plt.figure(figsize=(9, 5))
    plt.bar(
        df["day_of_week"].astype(str),
        df["average_sales"]
    )
    plt.title("Average Sales by Day of Week")
    plt.xlabel("Day of Week (1 = Monday)")
    plt.ylabel("Average Sales")
    save_chart("weekday_analysis.png")


# --------------------------------------------------
# 6. STORE TYPE ANALYSIS
# --------------------------------------------------

def store_type_analysis(connection):
    print("\n6. STORE TYPE ANALYSIS")

    query = """
        SELECT
            st.store_type,
            COUNT(DISTINCT st.store_id) AS total_stores,
            SUM(s.sales) AS total_sales,
            ROUND(AVG(s.sales)::NUMERIC, 2) AS average_sales
        FROM stores st
        JOIN sales s
            ON st.store_id = s.store_id
        WHERE s.is_open = TRUE
        GROUP BY st.store_type
        ORDER BY total_sales DESC;
    """

    df = fetch_data(connection, query)
    save_csv(df, "store_type_analysis.csv")

    plt.figure(figsize=(8, 5))
    plt.bar(
        df["store_type"].astype(str),
        df["total_sales"]
    )
    plt.title("Revenue by Store Type")
    plt.xlabel("Store Type")
    plt.ylabel("Total Sales")
    save_chart("store_type_analysis.png")


# --------------------------------------------------
# 7. HOLIDAY ANALYSIS
# --------------------------------------------------

def holiday_analysis(connection):
    print("\n7. HOLIDAY ANALYSIS")

    query = """
        SELECT
            state_holiday,
            school_holiday,
            COUNT(*) AS total_records,
            ROUND(AVG(sales)::NUMERIC, 2) AS average_sales,
            ROUND(AVG(customers)::NUMERIC, 2) AS average_customers
        FROM sales
        WHERE is_open = TRUE
        GROUP BY state_holiday, school_holiday
        ORDER BY state_holiday, school_holiday;
    """

    df = fetch_data(connection, query)
    save_csv(df, "holiday_analysis.csv")

    print(df.to_string(index=False))


# --------------------------------------------------
# MAIN EXECUTION
# --------------------------------------------------

def main():
    print("=" * 55)
    print("RETAIL ANALYTICS - EXPLORATORY DATA ANALYSIS")
    print("=" * 55)

    connection = None

    try:
        connection = get_connection()
        print("\nPostgreSQL connection successful!")

        business_overview(connection)
        monthly_sales(connection)
        top_stores(connection)
        promotion_analysis(connection)
        weekday_analysis(connection)
        store_type_analysis(connection)
        holiday_analysis(connection)

        print("\n" + "=" * 55)
        print("EDA COMPLETED SUCCESSFULLY!")
        print(f"Reports generated at: {REPORT_DIR}")
        print("=" * 55)

    except Exception as error:
        print("\nEDA FAILED!")
        print(f"Error: {error}")
        raise

    finally:
        if connection:
            connection.close()
            print("\nDatabase connection closed.")


if __name__ == "__main__":
    main()
