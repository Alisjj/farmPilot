-- Migration 002: Create inventory_adjustments table
CREATE TABLE IF NOT EXISTS inventory_adjustments (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id VARCHAR NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    adjustment_type VARCHAR NOT NULL, -- 'restock' | 'consume'
    quantity NUMERIC(10,2) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_item_id ON inventory_adjustments(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_created_at ON inventory_adjustments(created_at);
