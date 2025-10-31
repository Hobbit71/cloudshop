import { Pool } from 'pg';
import logger from '../../config/logger';
import { Transfer } from '../../types';
import { NotFoundError } from '../../utils/errors';

export class TransferRepository {
  constructor(private pool: Pool) {}

  async create(data: {
    product_id: string;
    from_warehouse_id: string;
    to_warehouse_id: string;
    quantity: number;
    requested_by?: string;
    notes?: string;
  }): Promise<Transfer> {
    const result = await this.pool.query(
      `INSERT INTO transfers (
        product_id, from_warehouse_id, to_warehouse_id, quantity, requested_by, notes
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        data.product_id,
        data.from_warehouse_id,
        data.to_warehouse_id,
        data.quantity,
        data.requested_by || null,
        data.notes || null,
      ]
    );
    return result.rows[0];
  }

  async findById(id: string): Promise<Transfer | null> {
    const result = await this.pool.query(
      'SELECT * FROM transfers WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async updateStatus(
    id: string,
    status: 'pending' | 'in_transit' | 'completed' | 'cancelled'
  ): Promise<Transfer> {
    const updates: string[] = ['status = $1', 'updated_at = CURRENT_TIMESTAMP'];
    const values: unknown[] = [status];
    let paramIndex = 2;

    if (status === 'completed') {
      updates.push(`completed_at = CURRENT_TIMESTAMP`);
    }

    values.push(id);

    const result = await this.pool.query(
      `UPDATE transfers 
       SET ${updates.join(', ')} 
       WHERE id = $${paramIndex++}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Transfer not found');
    }

    return result.rows[0];
  }
}

