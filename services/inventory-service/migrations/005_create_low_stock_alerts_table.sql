-- Create low stock alerts table
CREATE TABLE IF NOT EXISTS low_stock_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    current_quantity INTEGER NOT NULL,
    reorder_point INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
    notified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, warehouse_id, status) WHERE status = 'active'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_low_stock_product_id ON low_stock_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_low_stock_warehouse_id ON low_stock_alerts(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_low_stock_status ON low_stock_alerts(status);
CREATE INDEX IF NOT EXISTS idx_low_stock_active ON low_stock_alerts(product_id, warehouse_id) WHERE status = 'active';

-- Trigger to update updated_at
CREATE TRIGGER low_stock_alerts_updated_at
    BEFORE UPDATE ON low_stock_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_updated_at();

