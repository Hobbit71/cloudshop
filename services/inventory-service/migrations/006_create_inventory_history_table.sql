-- Create inventory history table for forecasting
CREATE TABLE IF NOT EXISTS inventory_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    change_type VARCHAR(50) NOT NULL CHECK (change_type IN ('sale', 'restock', 'transfer_in', 'transfer_out', 'adjustment', 'reservation', 'release')),
    quantity_change INTEGER NOT NULL,
    reference_id UUID,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for forecasting queries
CREATE INDEX IF NOT EXISTS idx_inventory_history_product_id ON inventory_history(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_history_warehouse_id ON inventory_history(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_history_created_at ON inventory_history(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_history_product_warehouse_date ON inventory_history(product_id, warehouse_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_history_change_type ON inventory_history(change_type);

