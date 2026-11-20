
import os
from pathlib import Path
from datetime import timedelta

import streamlit as st
import pandas as pd
import psycopg2
import plotly.express as px
from dotenv import load_dotenv


# --------------------------------------------------
# PROJECT CONFIGURATION
# --------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[2]

load_dotenv(PROJECT_ROOT / ".env")


# --------------------------------------------------
# PAGE CONFIGURATION
# --------------------------------------------------

st.set_page_config(
    page_title="Retail Analytics Dashboard",
    page_icon="📊",
    layout="wide"
)

st.title("📊 Retail Analytics Dashboard")
st.caption("Rossmann Store Sales | Business Intelligence Platform")


# --------------------------------------------------
# DATABASE CONFIGURATION
# --------------------------------------------------

DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "database": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD")
}


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


def load_data(query, params=None):
    connection = get_connection()

    try:
        return pd.read_sql_query(
            query,
            connection,
            params=params
        )
    finally:
        connection.close()


# --------------------------------------------------
# LOAD INITIAL DATA
# --------------------------------------------------

try:
    date_info = load_data("""
        SELECT MIN(date) AS min_date, MAX(date) AS max_date
        FROM sales;
    """)

    min_date = pd.to_datetime(
        date_info.iloc[0]["min_date"]
    ).date()

    max_date = pd.to_datetime(
        date_info.iloc[0]["max_date"]
    ).date()

    store_info = load_data("""
        SELECT store_id, store_type
        FROM stores
        ORDER BY store_id;
    """)

    store_options = store_info["store_id"].tolist()

    store_type_options = sorted(
        store_info["store_type"].dropna().unique().tolist()
    )

except Exception as error:
    st.error(f"Database connection failed: {error}")
    st.stop()


# --------------------------------------------------
# SIDEBAR FILTERS
# --------------------------------------------------

st.sidebar.header("Dashboard Filters")

selected_dates = st.sidebar.date_input(
    "Select Date Range",
    value=(min_date, max_date),
    min_value=min_date,
    max_value=max_date
)

if (
    not isinstance(selected_dates, (tuple, list))
    or len(selected_dates) != 2
):
    st.warning("Please select both a start date and an end date.")
    st.stop()

start_date, end_date = selected_dates

if start_date > end_date:
    st.error("Start date cannot be after end date.")
    st.stop()


selected_store_types = st.sidebar.multiselect(
    "Select Store Type",
    options=store_type_options,
    default=[],
    help="Leave empty to include all store types."
)

selected_stores = st.sidebar.multiselect(
    "Select Stores",
    options=store_options,
    default=[],
    help="Leave empty to include all matching stores."
)

selected_promotion = st.sidebar.selectbox(
    "Promotion Status",
    options=[
        "All Promotions",
        "Promotion Active",
        "No Promotion"
    ],
    index=0
)


# --------------------------------------------------
# COMBINE STORE FILTERS
# --------------------------------------------------

filtered_stores = store_info.copy()

if selected_store_types:
    filtered_stores = filtered_stores[
        filtered_stores["store_type"].isin(selected_store_types)
    ]

if selected_stores:
    filtered_stores = filtered_stores[
        filtered_stores["store_id"].isin(selected_stores)
    ]

effective_store_ids = filtered_stores["store_id"].tolist()

if not effective_store_ids:
    st.warning("No stores match your selected filters.")
    st.stop()


if selected_promotion == "Promotion Active":
    promotion_filter = True
elif selected_promotion == "No Promotion":
    promotion_filter = False
else:
    promotion_filter = None


params = (
    start_date,
    end_date,
    effective_store_ids,
    promotion_filter,
    promotion_filter
)


# --------------------------------------------------
# BUSINESS KPI CALCULATIONS
# --------------------------------------------------

kpi_query = """
    SELECT
        COALESCE(
            SUM(sales) FILTER (WHERE is_open = TRUE), 0
        ) AS total_revenue,

        COALESCE(
            SUM(customers) FILTER (WHERE is_open = TRUE), 0
        ) AS customer_visits,

        COUNT(DISTINCT store_id) AS total_stores,

        COUNT(*) FILTER (WHERE is_open = TRUE) AS open_records,

        ROUND(
            AVG(sales) FILTER (WHERE is_open = TRUE)::NUMERIC, 2
        ) AS average_sales,

        ROUND(
            AVG(customers) FILTER (WHERE is_open = TRUE)::NUMERIC, 2
        ) AS average_customers

    FROM sales
    WHERE date BETWEEN %s AND %s
      AND store_id = ANY(%s::INTEGER[])
      AND (
          %s::BOOLEAN IS NULL
          OR promo = %s::BOOLEAN
      );
"""

kpi = load_data(kpi_query, params).iloc[0]


# --------------------------------------------------
# REVENUE GROWTH CALCULATION
# --------------------------------------------------

period_days = (end_date - start_date).days + 1

previous_end_date = start_date - timedelta(days=1)

previous_start_date = previous_end_date - timedelta(
    days=period_days - 1
)

previous_revenue_query = """
    SELECT
        COALESCE(SUM(sales), 0) AS previous_revenue
    FROM sales
    WHERE is_open = TRUE
      AND date BETWEEN %s AND %s
      AND store_id = ANY(%s::INTEGER[])
      AND (
          %s::BOOLEAN IS NULL
          OR promo = %s::BOOLEAN
      );
"""

previous_params = (
    previous_start_date,
    previous_end_date,
    effective_store_ids,
    promotion_filter,
    promotion_filter
)

previous_data = load_data(
    previous_revenue_query,
    previous_params
)

previous_revenue = float(
    previous_data.iloc[0]["previous_revenue"]
)

current_revenue = float(kpi["total_revenue"])

if previous_revenue > 0:
    revenue_growth = (
        (current_revenue - previous_revenue)
        / previous_revenue
    ) * 100
else:
    revenue_growth = None


# --------------------------------------------------
# PROMOTION IMPACT CALCULATION
# --------------------------------------------------

promotion_impact_query = """
    SELECT
        AVG(sales) FILTER (WHERE promo = TRUE) AS promo_sales,
        AVG(sales) FILTER (WHERE promo = FALSE) AS non_promo_sales
    FROM sales
    WHERE is_open = TRUE
      AND date BETWEEN %s AND %s
      AND store_id = ANY(%s::INTEGER[]);
"""

promotion_impact_data = load_data(
    promotion_impact_query,
    (start_date, end_date, effective_store_ids)
).iloc[0]

promo_sales = promotion_impact_data["promo_sales"]
non_promo_sales = promotion_impact_data["non_promo_sales"]

if (
    pd.notna(promo_sales)
    and pd.notna(non_promo_sales)
    and non_promo_sales > 0
):
    promotion_impact = (
        (promo_sales - non_promo_sales)
        / non_promo_sales
    ) * 100
else:
    promotion_impact = None


# --------------------------------------------------
# BUSINESS OVERVIEW - KPI CARDS
# --------------------------------------------------

st.subheader("Business Overview")

col1, col2, col3, col4 = st.columns(4)

col1.metric("Total Revenue", f"€{current_revenue:,.0f}")
col2.metric("Customer Visits", f"{kpi['customer_visits']:,.0f}")
col3.metric("Total Stores", f"{kpi['total_stores']:,.0f}")
col4.metric("Open Store Records", f"{kpi['open_records']:,.0f}")


# --------------------------------------------------
# ADVANCED BUSINESS KPIs
# --------------------------------------------------

st.subheader("Advanced Business Insights")

col5, col6, col7, col8 = st.columns(4)

col5.metric(
    "Average Sales",
    f"€{kpi['average_sales']:,.2f}"
    if pd.notna(kpi["average_sales"]) else "N/A"
)

col6.metric(
    "Revenue Growth",
    f"{revenue_growth:+.2f}%"
    if revenue_growth is not None else "N/A",
    help="Compared with the immediately preceding period of equal length."
)

col7.metric(
    "Promotion Impact",
    f"{promotion_impact:+.2f}%"
    if promotion_impact is not None else "N/A",
    help="Difference in average sales between promoted and non-promoted open records. Independent of the promotion filter."
)

col8.metric(
    "Average Customers",
    f"{kpi['average_customers']:,.2f}"
    if pd.notna(kpi["average_customers"]) else "N/A"
)

st.caption(
    "Revenue Growth compares the selected period with the preceding "
    "period of equal length. Promotion Impact is an observational "
    "comparison, not proof of causation."
)

st.divider()


# --------------------------------------------------
# YEAR-OVER-YEAR REVENUE COMPARISON
# --------------------------------------------------

st.subheader("Year-over-Year Revenue Comparison")

yoy_query = """
    SELECT
        EXTRACT(YEAR FROM date)::INTEGER AS year,
        EXTRACT(MONTH FROM date)::INTEGER AS month,
        SUM(sales) AS revenue
    FROM sales
    WHERE is_open = TRUE
      AND date BETWEEN %s AND %s
      AND store_id = ANY(%s::INTEGER[])
      AND (
          %s::BOOLEAN IS NULL
          OR promo = %s::BOOLEAN
      )
    GROUP BY
        EXTRACT(YEAR FROM date),
        EXTRACT(MONTH FROM date)
    ORDER BY year, month;
"""

yoy_data = load_data(yoy_query, params)

if not yoy_data.empty:
    month_order = [
        "Jan", "Feb", "Mar", "Apr",
        "May", "Jun", "Jul", "Aug",
        "Sep", "Oct", "Nov", "Dec"
    ]

    yoy_data["month_name"] = pd.to_datetime(
        yoy_data["month"],
        format="%m"
    ).dt.strftime("%b")

    fig = px.line(
        yoy_data,
        x="month_name",
        y="revenue",
        color="year",
        markers=True,
        category_orders={"month_name": month_order},
        title="Monthly Revenue Comparison Across Years"
    )

    fig.update_layout(
        xaxis_title="Month",
        yaxis_title="Revenue (€)",
        legend_title="Year",
        hovermode="x unified"
    )

    st.plotly_chart(fig, width="stretch")

    if yoy_data["year"].nunique() < 2:
        st.info(
            "Select a date range containing multiple years "
            "to compare year-over-year revenue."
        )
else:
    st.info("No year-over-year revenue data available.")

st.divider()


# --------------------------------------------------
# MONTHLY REVENUE TREND
# --------------------------------------------------

st.subheader("Revenue Trend")

monthly_query = """
    SELECT
        DATE_TRUNC('month', date)::DATE AS month,
        SUM(sales) AS revenue
    FROM sales
    WHERE is_open = TRUE
      AND date BETWEEN %s AND %s
      AND store_id = ANY(%s::INTEGER[])
      AND (
          %s::BOOLEAN IS NULL
          OR promo = %s::BOOLEAN
      )
    GROUP BY DATE_TRUNC('month', date)
    ORDER BY month;
"""

monthly = load_data(monthly_query, params)

if not monthly.empty:
    fig = px.line(
        monthly,
        x="month",
        y="revenue",
        markers=True,
        title="Monthly Revenue"
    )

    fig.update_layout(
        xaxis_title="Month",
        yaxis_title="Revenue (€)"
    )

    st.plotly_chart(fig, width="stretch")
else:
    st.info("No revenue data available for this selection.")

st.divider()


# --------------------------------------------------
# MONTHLY SALES HEATMAP
# --------------------------------------------------

st.subheader("Monthly Sales Heatmap")

heatmap_query = """
    SELECT
        EXTRACT(YEAR FROM date)::INTEGER AS year,
        EXTRACT(MONTH FROM date)::INTEGER AS month,
        SUM(sales) AS revenue
    FROM sales
    WHERE is_open = TRUE
      AND date BETWEEN %s AND %s
      AND store_id = ANY(%s::INTEGER[])
      AND (
          %s::BOOLEAN IS NULL
          OR promo = %s::BOOLEAN
      )
    GROUP BY
        EXTRACT(YEAR FROM date),
        EXTRACT(MONTH FROM date)
    ORDER BY year, month;
"""

heatmap_data = load_data(heatmap_query, params)

if not heatmap_data.empty:
    heatmap_pivot = heatmap_data.pivot(
        index="year",
        columns="month",
        values="revenue"
    )

    heatmap_pivot = heatmap_pivot.reindex(columns=range(1, 13))

    month_labels = [
        "Jan", "Feb", "Mar", "Apr",
        "May", "Jun", "Jul", "Aug",
        "Sep", "Oct", "Nov", "Dec"
    ]

    fig = px.imshow(
        heatmap_pivot,
        x=month_labels,
        y=heatmap_pivot.index.astype(str),
        aspect="auto",
        color_continuous_scale="Blues",
        labels={
            "x": "Month",
            "y": "Year",
            "color": "Revenue (€)"
        },
        title="Revenue Distribution by Year and Month"
    )

    st.plotly_chart(fig, width="stretch")
else:
    st.info("No monthly sales data available.")

st.divider()


# --------------------------------------------------
# STORE PERFORMANCE AND PROMOTION ANALYSIS
# --------------------------------------------------

left, right = st.columns(2)

with left:
    st.subheader("Top 10 Stores")

    store_query = """
        SELECT
            store_id,
            SUM(sales) AS total_sales
        FROM sales
        WHERE is_open = TRUE
          AND date BETWEEN %s AND %s
          AND store_id = ANY(%s::INTEGER[])
          AND (
              %s::BOOLEAN IS NULL
              OR promo = %s::BOOLEAN
          )
        GROUP BY store_id
        ORDER BY total_sales DESC
        LIMIT 10;
    """

    stores = load_data(store_query, params)

    if not stores.empty:
        fig = px.bar(
            stores.sort_values("total_sales"),
            x="total_sales",
            y="store_id",
            orientation="h",
            title="Top Stores by Revenue"
        )

        fig.update_layout(
            xaxis_title="Revenue (€)",
            yaxis_title="Store ID"
        )

        st.plotly_chart(fig, width="stretch")
    else:
        st.info("No store data available.")


with right:
    st.subheader("Promotion Analysis")

    promo_query = """
        SELECT
            promo,
            ROUND(AVG(sales)::NUMERIC, 2) AS average_sales,
            ROUND(AVG(customers)::NUMERIC, 2) AS average_customers
        FROM sales
        WHERE is_open = TRUE
          AND date BETWEEN %s AND %s
          AND store_id = ANY(%s::INTEGER[])
          AND (
              %s::BOOLEAN IS NULL
              OR promo = %s::BOOLEAN
          )
        GROUP BY promo
        ORDER BY promo;
    """

    promo = load_data(promo_query, params)

    if not promo.empty:
        promo["promotion_status"] = promo["promo"].map({
            False: "No Promotion",
            True: "Promotion Active"
        })

        fig = px.bar(
            promo,
            x="promotion_status",
            y="average_sales",
            title="Average Sales: Promotion vs No Promotion"
        )

        fig.update_layout(
            xaxis_title="Promotion Status",
            yaxis_title="Average Sales (€)"
        )

        st.plotly_chart(fig, width="stretch")
    else:
        st.info("No promotion data available.")

st.divider()


# --------------------------------------------------
# STORE PERFORMANCE RANKING
# --------------------------------------------------

st.subheader("Store Performance Ranking")

ranking_query = """
    WITH store_revenue AS (
        SELECT
            store_id,
            SUM(sales) AS total_revenue,
            SUM(customers) AS total_customers
        FROM sales
        WHERE is_open = TRUE
          AND date BETWEEN %s AND %s
          AND store_id = ANY(%s::INTEGER[])
          AND (
              %s::BOOLEAN IS NULL
              OR promo = %s::BOOLEAN
          )
        GROUP BY store_id
    )

    SELECT
        RANK() OVER (ORDER BY total_revenue DESC) AS rank,
        store_id,
        total_revenue,
        total_customers
    FROM store_revenue
    ORDER BY rank;
"""

ranking = load_data(ranking_query, params)

if not ranking.empty:
    ranking["total_revenue"] = ranking["total_revenue"].round(2)

    ranking["total_customers"] = (
        ranking["total_customers"].fillna(0).astype(int)
    )

    top_ranked = ranking.head(20).sort_values(
        "total_revenue",
        ascending=True
    )

    fig = px.bar(
        top_ranked,
        x="total_revenue",
        y="store_id",
        orientation="h",
        color="total_revenue",
        title="Top 20 Stores by Revenue",
        labels={
            "total_revenue": "Revenue (€)",
            "store_id": "Store ID"
        }
    )

    st.plotly_chart(fig, width="stretch")

    st.subheader("Complete Store Ranking")

    st.dataframe(
        ranking,
        width="stretch",
        hide_index=True
    )
else:
    st.info("No store ranking data available.")

st.divider()


# --------------------------------------------------
# CUSTOMER TRAFFIC
# --------------------------------------------------

st.subheader("Customer Traffic Analysis")

customer_query = """
    SELECT
        DATE_TRUNC('month', date)::DATE AS month,
        SUM(customers) AS total_customers
    FROM sales
    WHERE is_open = TRUE
      AND date BETWEEN %s AND %s
      AND store_id = ANY(%s::INTEGER[])
      AND (
          %s::BOOLEAN IS NULL
          OR promo = %s::BOOLEAN
      )
    GROUP BY DATE_TRUNC('month', date)
    ORDER BY month;
"""

customers = load_data(customer_query, params)

if not customers.empty:
    fig = px.area(
        customers,
        x="month",
        y="total_customers",
        title="Monthly Customer Visits"
    )

    fig.update_layout(
        xaxis_title="Month",
        yaxis_title="Customer Visits"
    )

    st.plotly_chart(fig, width="stretch")
else:
    st.info("No customer data available.")

st.divider()


# --------------------------------------------------
# WEEKDAY SALES ANALYSIS
# --------------------------------------------------

st.subheader("Weekday Sales Analysis")

weekday_query = """
    SELECT
        EXTRACT(ISODOW FROM date)::INTEGER AS weekday_number,
        SUM(sales) AS total_sales,
        ROUND(AVG(sales)::NUMERIC, 2) AS average_sales,
        SUM(customers) AS total_customers
    FROM sales
    WHERE is_open = TRUE
      AND date BETWEEN %s AND %s
      AND store_id = ANY(%s::INTEGER[])
      AND (
          %s::BOOLEAN IS NULL
          OR promo = %s::BOOLEAN
      )
    GROUP BY EXTRACT(ISODOW FROM date)
    ORDER BY weekday_number;
"""

weekday_data = load_data(weekday_query, params)

if not weekday_data.empty:
    weekday_names = {
        1: "Monday",
        2: "Tuesday",
        3: "Wednesday",
        4: "Thursday",
        5: "Friday",
        6: "Saturday",
        7: "Sunday"
    }

    weekday_data["weekday"] = weekday_data[
        "weekday_number"
    ].map(weekday_names)

    fig = px.bar(
        weekday_data,
        x="weekday",
        y="total_sales",
        color="total_sales",
        category_orders={
            "weekday": [
                "Monday", "Tuesday", "Wednesday",
                "Thursday", "Friday", "Saturday", "Sunday"
            ]
        },
        title="Total Revenue by Day of the Week",
        labels={
            "weekday": "Day",
            "total_sales": "Revenue (€)"
        }
    )

    st.plotly_chart(fig, width="stretch")

    st.subheader("Weekday Performance Details")

    st.dataframe(
        weekday_data[
            [
                "weekday",
                "total_sales",
                "average_sales",
                "total_customers"
            ]
        ].rename(columns={
            "weekday": "Weekday",
            "total_sales": "Total Revenue (€)",
            "average_sales": "Average Sales (€)",
            "total_customers": "Customer Visits"
        }),
        width="stretch",
        hide_index=True
    )
else:
    st.info("No weekday sales data available.")

st.divider()


# --------------------------------------------------
# STORE TYPE PERFORMANCE
# --------------------------------------------------

st.subheader("Revenue by Store Type")

store_type_query = """
    SELECT
        st.store_type,
        SUM(s.sales) AS total_sales
    FROM stores st
    JOIN sales s ON st.store_id = s.store_id
    WHERE s.is_open = TRUE
      AND s.date BETWEEN %s AND %s
      AND s.store_id = ANY(%s::INTEGER[])
      AND (
          %s::BOOLEAN IS NULL
          OR s.promo = %s::BOOLEAN
      )
    GROUP BY st.store_type
    ORDER BY total_sales DESC;
"""

store_types = load_data(store_type_query, params)

if not store_types.empty:
    fig = px.pie(
        store_types,
        names="store_type",
        values="total_sales",
        hole=0.45,
        title="Revenue Contribution by Store Type"
    )

    st.plotly_chart(fig, width="stretch")
else:
    st.info("No store type data available.")

st.divider()


# --------------------------------------------------
# DOWNLOAD FILTERED DASHBOARD DATA AS CSV
# --------------------------------------------------

st.subheader("Download Dashboard Data")

st.write(
    "Export the sales records matching your currently selected "
    "date range, store type, stores, and promotion filters."
)

export_filter_key = (
    str(start_date),
    str(end_date),
    tuple(sorted(effective_store_ids)),
    promotion_filter
)

if st.session_state.get("csv_filter_key") != export_filter_key:
    st.session_state.pop("csv_export_data", None)
    st.session_state["csv_filter_key"] = export_filter_key


if st.button("Prepare Filtered CSV", type="primary"):
    export_query = """
        SELECT
            date,
            store_id,
            sales,
            customers,
            is_open,
            promo
        FROM sales
        WHERE date BETWEEN %s AND %s
          AND store_id = ANY(%s::INTEGER[])
          AND (
              %s::BOOLEAN IS NULL
              OR promo = %s::BOOLEAN
          )
        ORDER BY date, store_id;
    """

    with st.spinner("Preparing your filtered sales data..."):
        export_data = load_data(export_query, params)

        st.session_state["csv_export_data"] = (
            export_data.to_csv(index=False).encode("utf-8")
        )

        st.session_state["csv_export_rows"] = len(export_data)


if "csv_export_data" in st.session_state:
    st.success(
        f"CSV ready: {st.session_state['csv_export_rows']:,} records."
    )

    st.download_button(
        label="Download CSV",
        data=st.session_state["csv_export_data"],
        file_name="retail_sales_filtered.csv",
        mime="text/csv"
    )

st.divider()


# --------------------------------------------------
# FOOTER
# --------------------------------------------------

st.caption(
    "Retail Analytics Platform | Powered by Python, "
    "Streamlit, Plotly and PostgreSQL"
)
