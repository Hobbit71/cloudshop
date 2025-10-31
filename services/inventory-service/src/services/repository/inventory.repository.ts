import { Pool } from 'pg';
import logger from '../../config/logger';
import {
  InventoryItem,
  CreateInventoryRequest,
  UpdateInventoryRequest,
  InventoryHistory,
} from '../../types';
import { NotFoundError } from '../../utils/errors';

export class InventoryRepository {
  constructor(private pool: Pool) {}

  async findById(id: string): Promise<InventoryItem | null> {
    const result = await this.pool.query(
      'SELECT * FROM inventory WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByProductAndWarehouse(
    productId: string,
    warehouseId: string
  ): Promise<InventoryItem | null> {
    const result = await this.pool.query(
      'SELECT * FROM inventory WHERE product_id = $1 AND warehouse_id = $2',
      [productId, warehouseId]
    );
    return result.rows[0] || null;
  }

  async findByProductId(productId: string): Promise<InventoryItem[]> {
    const result = await this.pool.query(
      'SELECT * FROM inventory WHERE product_id = $1',
      [productId]
    );
    return result.rows;
  }

  async findByBarcode(barcode: string): Promise<InventoryItem | null> {
    const result = await this.pool.query(
      'SELECT * FROM inventory WHERE barcode = $1 LIMIT 1',
      [barcode]
    );
    return result.rows[0] || null;
  }

  async create(data: CreateInventoryRequest): Promise<InventoryItem> {
    const result = await this.pool.query(
      `INSERT INTO inventory (
        product_id, warehouse_id, quantity, barcode, location, reorder_point, max_stock
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        data.product_id,
        data.warehouse_id,
        data.quantity,
        data.barcode || null,
        data.location || null,
        data.reorder_point || 0,
        data.max_stock || null,
      ]
    );
    return result.rows[0];
  }

  async update(
    productId: string,
    warehouseId: string,
    data: UpdateInventoryRequest
  ): Promise<InventoryItem> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.quantity !== undefined) {
      updates.push(`quantity = $${paramIndex++}`);
      values.push(data.quantity);
    }
    if (data.barcode !== undefined) {
      updates.push(`barcode = $${paramIndex++}`);
      values.push(data.barcode || null);
    }
    if (data.location !== undefined) {
      updates.push(`location = $${paramIndex++}`);
      values.push(data.location || null);
    }
    if (data.reorder_point !== undefined) {
      updates.push(`reorder_point = $${paramIndex++}`);
      values.push(data.reorder_point);
    }
    if (data.max_stock !== undefined) {
      updates.push(`max_stock = $${paramIndex++}`);
      values.push(data.max_stock || null);
    }

    if (updates.length === 0) {
      const existing = await this.findByProductAndWarehouse(productId, warehouseId);
      if (!existing) {
        throw new NotFoundError('Inventory item not found');
      }
      return existing;
    }

    values.push(productId, warehouseId);
    const result = await this.pool.query(
      `UPDATE inventory 
       SET ${updates.join(', ')} 
       WHERE product_id = $${paramIndex++} AND warehouse_id = $${paramIndex++}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Inventory item not found');
    }

    return result.rows[0];
  }

  async reserveStock(
    productId: string,
    warehouseId: string,
    quantity: number
  ): Promise<InventoryItem> {
    const result = await this.pool.query(
      `UPDATE inventory 
       SET reserved_quantity = reserved_quantity + $1
       WHERE product_id = $2 AND warehouse_id = $3 
         AND (quantity - reserved_quantity) >= $1
       RETURNING *`,
      [quantity, productId, warehouseId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Insufficient stock or inventory not found');
    }

    return result.rows[0];
  }

  async releaseReservation(
    productId: string,
    warehouseId: string,
    quantity: number
  ): Promise<InventoryItem> {
    const result = await this.pool.query(
      `UPDATE inventory 
       SET reserved_quantity = GREATEST(0, reserved_quantity - $1)
       WHERE product_id = $2 AND warehouse_id = $3
       RETURNING *`,
      [quantity, productId, warehouseId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Inventory item not found');
    }

    return result.rows[0];
  }

  async addHistory(history: {
    product_id: string;
    warehouse_id: string;
    quantity: number;
    change_type: string;
    quantity_change: number;
    reference_id?: string;
    notes?: string;
  }): Promise<InventoryHistory> {
    const result = await this.pool.query(
      `INSERT INTO inventory_history (
        product_id, warehouse_id, quantity, change_type, quantity_change, reference_id, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        history.product_id,
        history.warehouse_id,
        history.quantity,
        history.change_type,
        history.quantity_change,
        history.reference_id || null,
        history.notes || null,
      ]
    );
    return result.rows[0];
  }

  async getLowStockItems(
    threshold?: number,
    warehouseId?: string
  ): Promise<InventoryItem[]> {
    let query = `
      SELECT * FROM inventory 
      WHERE available_quantity <= COALESCE($1, reorder_point)
    `;
    const params: unknown[] = [threshold || null];

    if (warehouseId) {
      query += ' AND warehouse_id = $2';
      params.push(warehouseId);
    }

    query += ' ORDER BY available_quantity ASC';

    const result = await this.pool.query(query, params);
    return result.rows;
  }
}

