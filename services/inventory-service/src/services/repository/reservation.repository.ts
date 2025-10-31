import { Pool } from 'pg';
import logger from '../../config/logger';
import { Reservation } from '../../types';
import { NotFoundError } from '../../utils/errors';

export class ReservationRepository {
  constructor(private pool: Pool) {}

  async create(data: {
    product_id: string;
    warehouse_id: string;
    quantity: number;
    order_id?: string;
    session_id?: string;
    expires_at: Date;
  }): Promise<Reservation> {
    const result = await this.pool.query(
      `INSERT INTO reservations (
        product_id, warehouse_id, quantity, order_id, session_id, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        data.product_id,
        data.warehouse_id,
        data.quantity,
        data.order_id || null,
        data.session_id || null,
        data.expires_at,
      ]
    );
    return result.rows[0];
  }

  async findById(id: string): Promise<Reservation | null> {
    const result = await this.pool.query(
      'SELECT * FROM reservations WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByOrderId(orderId: string): Promise<Reservation[]> {
    const result = await this.pool.query(
      'SELECT * FROM reservations WHERE order_id = $1',
      [orderId]
    );
    return result.rows;
  }

  async findBySessionId(sessionId: string): Promise<Reservation[]> {
    const result = await this.pool.query(
      'SELECT * FROM reservations WHERE session_id = $1 AND status = $2',
      [sessionId, 'pending']
    );
    return result.rows;
  }

  async updateStatus(
    id: string,
    status: 'pending' | 'confirmed' | 'released' | 'expired'
  ): Promise<Reservation> {
    const result = await this.pool.query(
      'UPDATE reservations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Reservation not found');
    }

    return result.rows[0];
  }

  async findExpired(): Promise<Reservation[]> {
    const result = await this.pool.query(
      `SELECT * FROM reservations 
       WHERE status = 'pending' AND expires_at < CURRENT_TIMESTAMP`,
      []
    );
    return result.rows;
  }

  async delete(id: string): Promise<void> {
    await this.pool.query('DELETE FROM reservations WHERE id = $1', [id]);
  }
}

