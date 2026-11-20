
import os
import pandas as pd
import psycopg2

from pathlib import Path
from io import StringIO
from dotenv import load_dotenv


# =====================================================
# PROJECT CONFIGURATION
# =====================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATA_DIR = PROJECT_ROOT / "dataset"

TRAIN_FILE = DATA_DIR / "train.csv"
STORE_FILE = DATA_DIR / "store.csv"

# Load environment variables from project root
load_dotenv(PROJECT_ROOT / ".env")

DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "database": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
}

CHUNK_SIZE = 100_000


# =====================================================
# DATABASE CONNECTION
# =====================================================

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


# =====================================================
# 1. LOAD AND TRANSFORM STORE DATA
# =====================================================

def load_stores(conn):

    print("\n[1/3] Loading store metadata...")

    stores = pd.read_csv(STORE_FILE)

    stores = stores.rename(columns={
        "Store": "store_id",
        "StoreType": "store_type",
        "Assortment": "assortment",
        "CompetitionDistance": "competition_distance",
        "CompetitionOpenSinceMonth": "competition_open_since_month",
        "CompetitionOpenSinceYear": "competition_open_since_year",
        "Promo2": "promo2",
        "Promo2SinceWeek": "promo2_since_week",
        "Promo2SinceYear": "promo2_since_year",
        "PromoInterval": "promo_interval",
    })

    # Convert store ID to integer
    stores["store_id"] = stores["store_id"].astype(int)

    # Convert nullable integer columns
    integer_columns = [
        "competition_open_since_month",
        "competition_open_since_year",
        "promo2_since_week",
        "promo2_since_year"
    ]

    for col in integer_columns:
        stores[col] = (
            pd.to_numeric(stores[col], errors="coerce")
            .astype("Int64")
        )

    # Convert Promo2 to boolean
    stores["promo2"] = stores["promo2"].fillna(0).astype(bool)

    # Prepare data for PostgreSQL COPY
    buffer = StringIO()

    stores.to_csv(
        buffer,
        index=False,
        header=False,
        na_rep="\\N"
    )

    buffer.seek(0)

    copy_sql = """
        COPY stores (
            store_id,
            store_type,
            assortment,
            competition_distance,
            competition_open_since_month,
            competition_open_since_year,
            promo2,
            promo2_since_week,
            promo2_since_year,
            promo_interval
        )
        FROM STDIN WITH (FORMAT CSV, NULL '\\N')
    """

    with conn.cursor() as cursor:
        cursor.copy_expert(copy_sql, buffer)

    conn.commit()

    print(f"Loaded {len(stores):,} stores successfully.")


# =====================================================
# 2. LOAD SALES DATA IN CHUNKS
# =====================================================

def load_sales(conn):

    print("\n[2/3] Loading sales data...")

    total_loaded = 0

    copy_sql = """
        COPY sales (
            store_id,
            date,
            day_of_week,
            sales,
            customers,
            is_open,
            promo,
            state_holiday,
            school_holiday
        )
        FROM STDIN WITH (FORMAT CSV, NULL '\\N')
    """

    for chunk in pd.read_csv(
        TRAIN_FILE,
        chunksize=CHUNK_SIZE
    ):

        # Rename columns
        chunk = chunk.rename(columns={
            "Store": "store_id",
            "DayOfWeek": "day_of_week",
            "Date": "date",
            "Sales": "sales",
            "Customers": "customers",
            "Open": "is_open",
            "Promo": "promo",
            "StateHoliday": "state_holiday",
            "SchoolHoliday": "school_holiday",
        })

        # Convert date
        chunk["date"] = pd.to_datetime(
            chunk["date"]
        ).dt.strftime("%Y-%m-%d")

        # Convert boolean columns
        chunk["is_open"] = chunk["is_open"].eq(1)
        chunk["promo"] = chunk["promo"].eq(1)
        chunk["school_holiday"] = chunk["school_holiday"].eq(1)

        # Preserve state holiday values
        chunk["state_holiday"] = (
            chunk["state_holiday"].fillna("0").astype(str)
        )

        # Reorder columns
        chunk = chunk[
            [
                "store_id",
                "date",
                "day_of_week",
                "sales",
                "customers",
                "is_open",
                "promo",
                "state_holiday",
                "school_holiday",
            ]
        ]

        # Convert data to CSV buffer
        buffer = StringIO()

        chunk.to_csv(
            buffer,
            index=False,
            header=False,
            na_rep="\\N"
        )

        buffer.seek(0)

        with conn.cursor() as cursor:
            cursor.copy_expert(copy_sql, buffer)

        total_loaded += len(chunk)

        print(
            f"Loaded {total_loaded:,} sales records..."
        )

    conn.commit()

    print(
        f"\nTotal sales records loaded: {total_loaded:,}"
    )


# =====================================================
# 3. VALIDATE DATABASE
# =====================================================

def validate_data(conn):

    print("\n[3/3] Validating database...")

    with conn.cursor() as cursor:

        cursor.execute("SELECT COUNT(*) FROM stores;")
        store_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM sales;")
        sales_count = cursor.fetchone()[0]

        cursor.execute("""
            SELECT MIN(date), MAX(date)
            FROM sales;
        """)

        date_range = cursor.fetchone()

        cursor.execute("""
            SELECT COUNT(*)
            FROM sales
            WHERE sales < 0;
        """)

        negative_sales = cursor.fetchone()[0]

        cursor.execute("""
            SELECT COUNT(*)
            FROM sales s
            LEFT JOIN stores st
                ON s.store_id = st.store_id
            WHERE st.store_id IS NULL;
        """)

        orphan_records = cursor.fetchone()[0]

        cursor.execute("""
            SELECT COUNT(*)
            FROM sales
            WHERE is_open = TRUE
              AND sales = 0;
        """)

        open_zero_sales = cursor.fetchone()[0]

    print("\n" + "=" * 55)
    print("       DATABASE VALIDATION REPORT")
    print("=" * 55)

    print(f"Stores loaded:       {store_count:,}")
    print(f"Sales records:       {sales_count:,}")
    print(f"Date range:          {date_range[0]} to {date_range[1]}")
    print(f"Negative sales:      {negative_sales:,}")
    print(f"Orphan records:      {orphan_records:,}")
    print(f"Open, zero sales:    {open_zero_sales:,}")

    print("=" * 55)

    # Validation checks
    if store_count != 1115:
        raise ValueError(
            f"Expected 1115 stores, found {store_count}"
        )

    if sales_count != 1017209:
        raise ValueError(
            f"Expected 1017209 sales records, found {sales_count}"
        )

    if negative_sales != 0:
        raise ValueError("Negative sales validation failed!")

    if orphan_records != 0:
        raise ValueError("Foreign key validation failed!")

    print("\nDATA LOAD SUCCESSFUL!")
    print("All validation checks passed.")


# =====================================================
# 4. MAIN EXECUTION
# =====================================================

def main():

    print("\nRETAIL ANALYTICS ETL PIPELINE")
    print("=" * 55)

    # Check dataset files
    if not TRAIN_FILE.exists():
        raise FileNotFoundError(
            f"Sales dataset not found: {TRAIN_FILE}"
        )

    if not STORE_FILE.exists():
        raise FileNotFoundError(
            f"Store dataset not found: {STORE_FILE}"
        )

    conn = get_connection()

    try:

        # Start with clean tables
        with conn.cursor() as cursor:
            cursor.execute(
                "TRUNCATE TABLE sales, stores CASCADE;"
            )

        conn.commit()

        load_stores(conn)

        load_sales(conn)

        validate_data(conn)

    except Exception as error:

        conn.rollback()

        print("\nETL FAILED!")
        print(f"Error: {error}")

        raise

    finally:

        conn.close()

        print("\nDatabase connection closed.")


if __name__ == "__main__":
    main()
