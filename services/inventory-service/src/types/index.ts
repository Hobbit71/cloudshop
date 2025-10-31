export interface InventoryItem {
  id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  barcode?: string;
  location?: string;
  reorder_point: number;
  max_stock?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Reservation {
  id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  order_id?: string;
  session_id?: string;
  expires_at: Date;
  status: 'pending' | 'confirmed' | 'released' | 'expired';
  created_at: Date;
  updated_at: Date;
}

export interface Transfer {
  id: string;
  product_id: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
  quantity: number;
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  requested_by?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
}

export interface LowStockAlert {
  id: string;
  product_id: string;
  warehouse_id: string;
  current_quantity: number;
  reorder_point: number;
  status: 'active' | 'acknowledged' | 'resolved';
  notified_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface InventoryHistory {
  id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  change_type: 'sale' | 'restock' | 'transfer_in' | 'transfer_out' | 'adjustment' | 'reservation' | 'release';
  quantity_change: number;
  reference_id?: string;
  notes?: string;
  created_at: Date;
}

export interface CreateInventoryRequest {
  product_id: string;
  warehouse_id: string;
  quantity: number;
  barcode?: string;
  location?: string;
  reorder_point?: number;
  max_stock?: number;
}

export interface UpdateInventoryRequest {
  quantity?: number;
  barcode?: string;
  location?: string;
  reorder_point?: number;
  max_stock?: number;
}

export interface ReserveInventoryRequest {
  product_id: string;
  warehouse_id: string;
  quantity: number;
  order_id?: string;
  session_id?: string;
  expires_in?: number; // seconds
}

export interface TransferInventoryRequest {
  product_id: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
  quantity: number;
  requested_by?: string;
  notes?: string;
}

export interface InventoryForecast {
  product_id: string;
  warehouse_id: string;
  forecasted_quantity: number;
  days_until_stockout: number;
  recommended_order_quantity: number;
  confidence: number; // 0-1
}

export interface ExpressRequest extends Express.Request {
  user?: {
    id: string;
    email: string;
  };
}

