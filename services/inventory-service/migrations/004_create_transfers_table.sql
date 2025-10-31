-- Create transfers table for multi-warehouse inventory transfers
CREATE TABLE IF NOT EXISTS transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    from_warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    to_warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'completed', 'cancelled')),
    requested_by UUID,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transfers_product_id ON transfers(product_id);
CREATE INDEX IF NOT EXISTS idx_transfers_from_warehouse ON transfers(from_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to_warehouse ON transfers(to_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON transfers(status);

-- Trigger to update updated_at
CREATE TRIGGER transfers_updated_at
    BEFORE UPDATE ON transfers
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_updated_at();

