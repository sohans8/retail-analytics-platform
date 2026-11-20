
-- =====================================================
-- ADVANCED RETAIL ANALYTICS
-- =====================================================

-- 1. MONTH-OVER-MONTH REVENUE GROWTH

CREATE OR REPLACE VIEW vw_revenue_growth AS

WITH monthly AS (
    SELECT
        DATE_TRUNC('month', date)::DATE AS month,
        SUM(sales) AS revenue
    FROM sales
    WHERE is_open = TRUE
    GROUP BY DATE_TRUNC('month', date)
)

SELECT
    month,
    revenue,
    LAG(revenue) OVER (ORDER BY month) AS previous_month_revenue,

    ROUND(
        100.0 * (
            revenue - LAG(revenue) OVER (ORDER BY month)
        ) / NULLIF(
            LAG(revenue) OVER (ORDER BY month), 0
        ),
        2
    ) AS growth_percentage

FROM monthly;


-- 2. CUSTOMER SPENDING ANALYSIS

CREATE OR REPLACE VIEW vw_customer_spending AS

SELECT
    store_id,
    SUM(sales) AS total_revenue,
    SUM(customers) AS total_customers,

    ROUND(
        SUM(sales)::NUMERIC /
        NULLIF(SUM(customers), 0),
        2
    ) AS revenue_per_customer

FROM sales
WHERE is_open = TRUE
GROUP BY store_id;


-- 3. STORE REVENUE RANKING

CREATE OR REPLACE VIEW vw_store_ranking AS

SELECT
    store_id,
    store_type,
    total_revenue,

    RANK() OVER (
        ORDER BY total_revenue DESC
    ) AS revenue_rank

FROM vw_store_performance;


-- 4. PROMOTION REVENUE LIFT

CREATE OR REPLACE VIEW vw_promotion_lift AS

WITH promotion_data AS (

    SELECT
        promo,
        AVG(sales) AS average_sales
    FROM sales
    WHERE is_open = TRUE
    GROUP BY promo

)

SELECT
    MAX(CASE WHEN promo = TRUE
        THEN average_sales END) AS promo_average_sales,

    MAX(CASE WHEN promo = FALSE
        THEN average_sales END) AS non_promo_average_sales,

    ROUND(
        100.0 * (
            MAX(CASE WHEN promo = TRUE
                THEN average_sales END) -
            MAX(CASE WHEN promo = FALSE
                THEN average_sales END)
        ) / NULLIF(
            MAX(CASE WHEN promo = FALSE
                THEN average_sales END), 0
        ),
        2
    ) AS promotion_lift_percentage

FROM promotion_data;


-- 5. STORE TYPE REVENUE CONTRIBUTION

CREATE OR REPLACE VIEW vw_store_type_contribution AS

SELECT
    store_type,
    total_revenue,

    ROUND(
        100.0 * total_revenue /
        NULLIF(SUM(total_revenue) OVER (), 0),
        2
    ) AS revenue_contribution_percentage

FROM vw_store_type_analysis;


-- 6. CUSTOMER TRAFFIC BY MONTH

CREATE OR REPLACE VIEW vw_monthly_customer_traffic AS

SELECT
    DATE_TRUNC('month', date)::DATE AS month,
    SUM(customers) AS total_customers,
    ROUND(AVG(customers), 2) AS average_daily_customers

FROM sales
WHERE is_open = TRUE
GROUP BY DATE_TRUNC('month', date);


-- =====================================================
-- ADVANCED ANALYTICS COMPLETE
-- =====================================================
