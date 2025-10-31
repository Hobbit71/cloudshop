-- Create reservations table for checkout stock reservations
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    order_id UUID,
    session_id VARCHAR(255),
    expires_at TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'released', 'expired')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reservations_product_id ON reservations(product_id);
CREATE INDEX IF NOT EXISTS idx_reservations_warehouse_id ON reservations(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_reservations_order_id ON reservations(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reservations_session_id ON reservations(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reservations_expires_at ON reservations(expires_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);

-- Trigger to update updated_at
CREATE TRIGGER reservations_updated_at
    BEFORE UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_updated_at();

