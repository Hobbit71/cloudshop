import { getPool } from '../config/database';
import { Merchant, CreateMerchantRequest, UpdateMerchantRequest } from '../types';
import { ConflictError, NotFoundError } from '../utils/errors';

export class MerchantService {
  async createMerchant(data: CreateMerchantRequest, createdBy?: string): Promise<Merchant> {
    const pool = getPool();

    // Check if merchant with email already exists
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('Merchant with this email already exists');
    }

    const result = await pool.query<Merchant>(
      `INSERT INTO merchants (name, email, phone, address, city, state, country, postal_code, business_type, tax_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        data.name,
        data.email.toLowerCase(),
        data.phone || null,
        data.address || null,
        data.city || null,
        data.state || null,
        data.country || 'US',
        data.postal_code || null,
        data.business_type || null,
        data.tax_id || null,
        createdBy || null,
      ]
    );

    return result.rows[0];
  }

  async findById(id: string): Promise<Merchant | null> {
    const pool = getPool();
    const result = await pool.query<Merchant>('SELECT * FROM merchants WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async findByEmail(email: string): Promise<Merchant | null> {
    const pool = getPool();
    const result = await pool.query<Merchant>('SELECT * FROM merchants WHERE email = $1', [
      email.toLowerCase(),
    ]);
    return result.rows[0] || null;
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    status?: string
  ): Promise<{ merchants: Merchant[]; total: number }> {
    const pool = getPool();
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM merchants';
    let countQuery = 'SELECT COUNT(*) as count FROM merchants';
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (status) {
      conditions.push(`status = $${params.length + 1}`);
      params.push(status);
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const [merchantsResult, countResult] = await Promise.all([
      pool.query<Merchant>(query, params),
      pool.query<{ count: string }>(countQuery, params.slice(0, -2)),
    ]);

    return {
      merchants: merchantsResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  async updateMerchant(id: string, updates: UpdateMerchantRequest): Promise<Merchant> {
    const pool = getPool();
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.email !== undefined) {
      // Check if new email already exists
      const existing = await this.findByEmail(updates.email);
      if (existing && existing.id !== id) {
        throw new ConflictError('Merchant with this email already exists');
      }
      fields.push(`email = $${paramCount++}`);
      values.push(updates.email.toLowerCase());
    }
    if (updates.phone !== undefined) {
      fields.push(`phone = $${paramCount++}`);
      values.push(updates.phone);
    }
    if (updates.address !== undefined) {
      fields.push(`address = $${paramCount++}`);
      values.push(updates.address);
    }
    if (updates.city !== undefined) {
      fields.push(`city = $${paramCount++}`);
      values.push(updates.city);
    }
    if (updates.state !== undefined) {
      fields.push(`state = $${paramCount++}`);
      values.push(updates.state);
    }
    if (updates.country !== undefined) {
      fields.push(`country = $${paramCount++}`);
      values.push(updates.country);
    }
    if (updates.postal_code !== undefined) {
      fields.push(`postal_code = $${paramCount++}`);
      values.push(updates.postal_code);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(updates.status);
    }
    if (updates.business_type !== undefined) {
      fields.push(`business_type = $${paramCount++}`);
      values.push(updates.business_type);
    }
    if (updates.tax_id !== undefined) {
      fields.push(`tax_id = $${paramCount++}`);
      values.push(updates.tax_id);
    }

    if (fields.length === 0) {
      const merchant = await this.findById(id);
      if (!merchant) {
        throw new NotFoundError('Merchant');
      }
      return merchant;
    }

    values.push(id);
    const query = `UPDATE merchants SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query<Merchant>(query, values);
    if (result.rows.length === 0) {
      throw new NotFoundError('Merchant');
    }

    return result.rows[0];
  }

  async deleteMerchant(id: string): Promise<void> {
    const pool = getPool();
    const result = await pool.query('DELETE FROM merchants WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      throw new NotFoundError('Merchant');
    }
  }
}

export const merchantService = new MerchantService();

