-- Phase 2 Migration: Core Analytics & KPI Structures
-- Creates base tables and materialized view for executive dashboard KPIs
-- Safe to re-run (IF NOT EXISTS guards). Assumes PostgreSQL.

BEGIN;

-- Daily aggregated KPIs (one row per day)
CREATE TABLE IF NOT EXISTS kpi_daily (
    kpi_date DATE PRIMARY KEY,
    eggs_collected INTEGER DEFAULT 0,
    egg_yield_pct NUMERIC(6,2),                -- (eggs_collected / (hen_days)) * 100
    feed_used_kg NUMERIC(12,3),
    feed_waste_kg NUMERIC(12,3),
    feed_consumption_per_bird NUMERIC(12,5),   -- feed_used_kg / average_birds
    mortality_count INTEGER DEFAULT 0,
    mortality_rate_pct NUMERIC(6,3),           -- (mortality_count / average_birds)*100
    fcr NUMERIC(10,4),                         -- feed conversion ratio if weight gain tracked
    revenue NUMERIC(14,2) DEFAULT 0,
    expenses NUMERIC(14,2) DEFAULT 0,
    profit NUMERIC(14,2) GENERATED ALWAYS AS (revenue - expenses) STORED,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Hourly (or intra-day) operational metrics for near-real-time dashboard widgets
CREATE TABLE IF NOT EXISTS kpi_hourly (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hour_ts TIMESTAMP NOT NULL,                -- truncated to hour (date_trunc('hour', NOW()))
    section VARCHAR(100),                      -- optional farm section
    eggs_collected INTEGER DEFAULT 0,
    feed_used_kg NUMERIC(12,3),
    feed_waste_kg NUMERIC(12,3),
    mortality_count INTEGER DEFAULT 0,
    water_consumption_liters NUMERIC(12,3),
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kpi_hourly_hour_ts ON kpi_hourly(hour_ts);
CREATE INDEX IF NOT EXISTS idx_kpi_hourly_section ON kpi_hourly(section);

-- Production metrics by section (granular aggregation source for daily rollups)
CREATE TABLE IF NOT EXISTS production_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_date DATE NOT NULL,
    section VARCHAR(100) NOT NULL,
    eggs_collected INTEGER DEFAULT 0,
    cracked_eggs INTEGER DEFAULT 0,
    avg_eggs_per_bird NUMERIC(8,4),
    feed_used_kg NUMERIC(12,3),
    feed_waste_kg NUMERIC(12,3),
    mortality_count INTEGER DEFAULT 0,
    average_birds INTEGER,                     -- estimated average bird count for the day in section
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_production_metrics_date ON production_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_production_metrics_section ON production_metrics(section);

-- Materialized view for fast executive dashboard queries
-- Aggregates last 30 days plus today; can be extended as needed
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_kpi_dashboard AS
SELECT
    d.kpi_date,
    d.eggs_collected,
    d.egg_yield_pct,
    d.feed_used_kg,
    d.feed_waste_kg,
    d.feed_consumption_per_bird,
    d.mortality_count,
    d.mortality_rate_pct,
    d.fcr,
    d.revenue,
    d.expenses,
    d.profit,
    -- 7 day moving averages (window functions)
    AVG(d.eggs_collected) OVER (ORDER BY d.kpi_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS eggs_collected_ma7,
    AVG(d.mortality_rate_pct) OVER (ORDER BY d.kpi_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS mortality_rate_ma7,
    AVG(d.feed_used_kg) OVER (ORDER BY d.kpi_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS feed_used_ma7,
    NOW() AS refreshed_at
FROM kpi_daily d
WHERE d.kpi_date >= (CURRENT_DATE - INTERVAL '30 days');

-- Index on materialized view (requires CREATE UNIQUE INDEX separately if needed)
-- Example: CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_kpi_dashboard_date ON mv_kpi_dashboard(kpi_date);

-- Refresh helper function (optional)
CREATE OR REPLACE FUNCTION refresh_mv_kpi_dashboard() RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_kpi_dashboard;
END;$$;

-- Permissions / future notes:
-- Consider GRANT SELECT ON mv_kpi_dashboard TO readonly_role;

COMMIT;

-- Manual maintenance commands (run separately when needed):
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_kpi_dashboard;
-- SELECT * FROM mv_kpi_dashboard ORDER BY kpi_date DESC LIMIT 7;
