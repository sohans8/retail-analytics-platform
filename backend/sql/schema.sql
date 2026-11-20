
-- =====================================================
-- RETAIL ANALYTICS PLATFORM
-- DATABASE SCHEMA
-- =====================================================

-- 1. STORES TABLE
CREATE TABLE IF NOT EXISTS stores (
    store_id INTEGER PRIMARY KEY,
    store_type VARCHAR(10),
    assortment VARCHAR(10),
    competition_distance DOUBLE PRECISION,
    competition_open_since_month INTEGER,
    competition_open_since_year INTEGER,
    promo2 BOOLEAN,
    promo2_since_week INTEGER,
    promo2_since_year INTEGER,
    promo_interval VARCHAR(100)
);


-- 2. SALES TABLE
CREATE TABLE IF NOT EXISTS sales (
    store_id INTEGER NOT NULL,
    date DATE NOT NULL,
    day_of_week SMALLINT,
    sales INTEGER,
    customers INTEGER,
    is_open BOOLEAN,
    promo BOOLEAN,
    state_holiday VARCHAR(1),
    school_holiday BOOLEAN,

    PRIMARY KEY (store_id, date),

    CONSTRAINT fk_sales_store
        FOREIGN KEY (store_id)
        REFERENCES stores(store_id)
);


-- 3. INDEXES FOR ANALYTICS QUERIES

CREATE INDEX IF NOT EXISTS idx_sales_date
ON sales(date);

CREATE INDEX IF NOT EXISTS idx_sales_store
ON sales(store_id);

CREATE INDEX IF NOT EXISTS idx_sales_promo
ON sales(promo);


-- =====================================================
-- SCHEMA CREATION COMPLETE
-- =====================================================

SELECT 'Retail Analytics Schema Created Successfully!' AS status;
