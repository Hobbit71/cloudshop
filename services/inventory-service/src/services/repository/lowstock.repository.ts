import { Pool } from 'pg';
import logger from '../../config/logger';
import { LowStockAlert } from '../../types';

export class LowStockAlertRepository {
  constructor(private pool: Pool) {}

  async create(data: {
    product_id: string;
    warehouse_id: string;
    current_quantity: number;
    reorder_point: number;
  }): Promise<LowStockAlert> {
    // Deactivate existing active alerts for this product/warehouse
    await this.pool.query(
      `UPDATE low_stock_alerts 
       SET status = 'resolved', updated_at = CURRENT_TIMESTAMP
       WHERE product_id = $1 AND warehouse_id = $2 AND status = 'active'`,
      [data.product_id, data.warehouse_id]
    );

    const result = await this.pool.query(
      `INSERT INTO low_stock_alerts (
        product_id, warehouse_id, current_quantity, reorder_point
      ) VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [
        data.product_id,
        data.warehouse_id,
        data.current_quantity,
        data.reorder_point,
      ]
    );
    return result.rows[0];
  }

  async findActive(
    warehouseId?: string
  ): Promise<LowStockAlert[]> {
    let query = `
      SELECT * FROM low_stock_alerts 
      WHERE status = 'active'
    `;
    const params: unknown[] = [];

    if (warehouseId) {
      query += ' AND warehouse_id = $1';
      params.push(warehouseId);
    }

    query += ' ORDER BY current_quantity ASC';

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async updateStatus(
    id: string,
    status: 'active' | 'acknowledged' | 'resolved'
  ): Promise<LowStockAlert> {
    const result = await this.pool.query(
      `UPDATE low_stock_alerts 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  }
}

