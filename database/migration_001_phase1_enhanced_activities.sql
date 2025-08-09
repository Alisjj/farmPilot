-- Phase 1 Migration: Enhanced Daily Activities and Alert System
-- Run this migration to add new columns and tables for enhanced activity tracking

BEGIN;

-- Add new columns to daily_activities table
ALTER TABLE daily_activities 
ADD COLUMN IF NOT EXISTS farm_section VARCHAR(100),
ADD COLUMN IF NOT EXISTS weather_temperature DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS weather_humidity DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS reviewer_id VARCHAR REFERENCES users(id),
ADD COLUMN IF NOT EXISTS review_notes TEXT;

-- Create alert_thresholds table
CREATE TABLE IF NOT EXISTS alert_thresholds (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    threshold_type VARCHAR(50) NOT NULL,
    threshold_value DECIMAL(10,2) NOT NULL,
    comparison_type VARCHAR(20) NOT NULL, -- 'greater_than', 'less_than', 'equals'
    alert_level VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    notification_channels JSONB, -- ['email', 'sms', 'dashboard'] 
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL, -- 'threshold_exceeded', 'deadline_missed', 'quality_concern'
    severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    activity_id VARCHAR REFERENCES daily_activities(id),
    user_id VARCHAR REFERENCES users(id),
    farm_section VARCHAR(100),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

-- Removed seeding of default alert thresholds to keep database empty after migration
-- (Previously inserted sample threshold rows here.)

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_activities_farm_section ON daily_activities(farm_section);
CREATE INDEX IF NOT EXISTS idx_daily_activities_status ON daily_activities(status);
CREATE INDEX IF NOT EXISTS idx_daily_activities_priority ON daily_activities(priority);
CREATE INDEX IF NOT EXISTS idx_daily_activities_due_date ON daily_activities(due_date);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);

COMMIT;

-- Verification queries (optional - run separately to check migration)
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'daily_activities' 
-- ORDER BY ordinal_position;

-- SELECT table_name, table_type 
-- FROM information_schema.tables 
-- WHERE table_name IN ('alert_thresholds', 'alerts');

-- SELECT * FROM alert_thresholds;
