
-- =====================================================
-- RETAIL ANALYTICS PLATFORM
-- ANALYTICAL SQL LAYER
-- =====================================================

-- 1. BUSINESS OVERVIEW
CREATE OR REPLACE VIEW vw_business_overview AS
SELECT
    COUNT(*) AS total_records,
    COUNT(DISTINCT store_id) AS total_stores,
    SUM(sales) AS total_revenue,
    SUM(customers) AS total_customers,
    ROUND(AVG(sales), 2) AS average_daily_sales,
    ROUND(AVG(customers), 2) AS average_daily_customers
FROM sales;


-- 2. MONTHLY SALES
CREATE OR REPLACE VIEW vw_monthly_sales AS
SELECT
    DATE_TRUNC('month', date)::DATE AS month,
    SUM(sales) AS total_revenue,
    SUM(customers) AS total_customers,
    COUNT(*) AS sales_records
FROM sales
GROUP BY DATE_TRUNC('month', date);


-- 3. STORE PERFORMANCE
CREATE OR REPLACE VIEW vw_store_performance AS
SELECT
    st.store_id,
    st.store_type,
    st.assortment,
    SUM(s.sales) AS total_revenue,
    SUM(s.customers) AS total_customers,
    ROUND(AVG(s.sales), 2) AS average_sales,
    COUNT(*) AS operating_days
FROM stores st
JOIN sales s ON st.store_id = s.store_id
GROUP BY st.store_id, st.store_type, st.assortment;


-- 4. PROMOTION IMPACT
CREATE OR REPLACE VIEW vw_promotion_impact AS
SELECT
    promo,
    COUNT(*) AS total_records,
    SUM(sales) AS total_revenue,
    ROUND(AVG(sales), 2) AS average_sales,
    ROUND(AVG(customers), 2) AS average_customers
FROM sales
WHERE is_open = TRUE
GROUP BY promo;


-- 5. HOLIDAY ANALYSIS
CREATE OR REPLACE VIEW vw_holiday_analysis AS
SELECT
    state_holiday,
    school_holiday,
    COUNT(*) AS total_records,
    SUM(sales) AS total_revenue,
    ROUND(AVG(sales), 2) AS average_sales
FROM sales
WHERE is_open = TRUE
GROUP BY state_holiday, school_holiday;


-- 6. WEEKDAY PERFORMANCE
CREATE OR REPLACE VIEW vw_weekday_performance AS
SELECT
    day_of_week,
    COUNT(*) AS total_records,
    SUM(sales) AS total_revenue,
    ROUND(AVG(sales), 2) AS average_sales,
    ROUND(AVG(customers), 2) AS average_customers
FROM sales
WHERE is_open = TRUE
GROUP BY day_of_week
ORDER BY day_of_week;


-- 7. STORE TYPE ANALYSIS
CREATE OR REPLACE VIEW vw_store_type_analysis AS
SELECT
    st.store_type,
    COUNT(DISTINCT st.store_id) AS total_stores,
    SUM(s.sales) AS total_revenue,
    ROUND(AVG(s.sales), 2) AS average_sales,
    SUM(s.customers) AS total_customers
FROM stores st
JOIN sales s ON st.store_id = s.store_id
WHERE s.is_open = TRUE
GROUP BY st.store_type;


-- COMPLETE
