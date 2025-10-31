import { getPool } from '../config/database';
import { ApiQuota, CreateApiQuotaRequest, UpdateApiQuotaRequest } from '../types';
import { NotFoundError, ConflictError } from '../utils/errors';

export class QuotaService {
  async createQuota(data: CreateApiQuotaRequest): Promise<ApiQuota> {
    const pool = getPool();

    // Check if quota already exists for user or merchant
    if (data.user_id) {
      const existing = await this.findByUserId(data.user_id);
      if (existing) {
        throw new ConflictError('Quota already exists for this user');
      }
    }
    if (data.merchant_id) {
      const existing = await this.findByMerchantId(data.merchant_id);
      if (existing) {
        throw new ConflictError('Quota already exists for this merchant');
      }
    }

    const result = await pool.query<ApiQuota>(
      `INSERT INTO api_quotas (user_id, merchant_id, daily_limit, monthly_limit, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.user_id || null,
        data.merchant_id || null,
        data.daily_limit || 10000,
        data.monthly_limit || 300000,
        data.is_active !== undefined ? data.is_active : true,
      ]
    );

    return result.rows[0];
  }

  async findByUserId(userId: string): Promise<ApiQuota | null> {
    const pool = getPool();
    const result = await pool.query<ApiQuota>('SELECT * FROM api_quotas WHERE user_id = $1', [
      userId,
    ]);
    return result.rows[0] || null;
  }

  async findByMerchantId(merchantId: string): Promise<ApiQuota | null> {
    const pool = getPool();
    const result = await pool.query<ApiQuota>('SELECT * FROM api_quotas WHERE merchant_id = $1', [
      merchantId,
    ]);
    return result.rows[0] || null;
  }

  async findById(id: string): Promise<ApiQuota | null> {
    const pool = getPool();
    const result = await pool.query<ApiQuota>('SELECT * FROM api_quotas WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async findAll(page: number = 1, limit: number = 20): Promise<{ quotas: ApiQuota[]; total: number }> {
    const pool = getPool();
    const offset = (page - 1) * limit;

    const [quotasResult, countResult] = await Promise.all([
      pool.query<ApiQuota>(
        `SELECT * FROM api_quotas 
         ORDER BY created_at DESC 
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      pool.query<{ count: string }>('SELECT COUNT(*) as count FROM api_quotas'),
    ]);

    return {
      quotas: quotasResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  async updateQuota(id: string, updates: UpdateApiQuotaRequest): Promise<ApiQuota> {
    const pool = getPool();
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (updates.daily_limit !== undefined) {
      fields.push(`daily_limit = $${paramCount++}`);
      values.push(updates.daily_limit);
    }
    if (updates.monthly_limit !== undefined) {
      fields.push(`monthly_limit = $${paramCount++}`);
      values.push(updates.monthly_limit);
    }
    if (updates.is_active !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(updates.is_active);
    }

    if (fields.length === 0) {
      const quota = await this.findById(id);
      if (!quota) {
        throw new NotFoundError('API Quota');
      }
      return quota;
    }

    values.push(id);
    const query = `UPDATE api_quotas SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query<ApiQuota>(query, values);
    if (result.rows.length === 0) {
      throw new NotFoundError('API Quota');
    }

    return result.rows[0];
  }

  async deleteQuota(id: string): Promise<void> {
    const pool = getPool();
    const result = await pool.query('DELETE FROM api_quotas WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      throw new NotFoundError('API Quota');
    }
  }

  async incrementUsage(userId?: string, merchantId?: string): Promise<void> {
    const pool = getPool();
    let query = 'UPDATE api_quotas SET current_daily_count = current_daily_count + 1, current_monthly_count = current_monthly_count + 1 WHERE ';

    if (userId) {
      query += 'user_id = $1';
      await pool.query(query, [userId]);
    } else if (merchantId) {
      query += 'merchant_id = $1';
      await pool.query(query, [merchantId]);
    }
  }

  async resetDailyCounts(): Promise<void> {
    const pool = getPool();
    await pool.query(
      `UPDATE api_quotas 
       SET current_daily_count = 0, reset_daily_at = CURRENT_DATE + INTERVAL '1 day'
       WHERE reset_daily_at <= CURRENT_TIMESTAMP`
    );
  }

  async resetMonthlyCounts(): Promise<void> {
    const pool = getPool();
    await pool.query(
      `UPDATE api_quotas 
       SET current_monthly_count = 0, reset_monthly_at = date_trunc('month', CURRENT_TIMESTAMP) + INTERVAL '1 month'
       WHERE reset_monthly_at <= CURRENT_TIMESTAMP`
    );
  }

  async checkQuota(userId?: string, merchantId?: string): Promise<{
    allowed: boolean;
    quota?: ApiQuota;
    remainingDaily?: number;
    remainingMonthly?: number;
  }> {
    let quota: ApiQuota | null = null;

    if (userId) {
      quota = await this.findByUserId(userId);
    } else if (merchantId) {
      quota = await this.findByMerchantId(merchantId);
    }

    if (!quota || !quota.is_active) {
      return { allowed: true }; // No quota restrictions
    }

    // Reset counts if needed
    const now = new Date();
    if (new Date(quota.reset_daily_at) <= now) {
      await this.resetDailyCounts();
      quota = userId ? await this.findByUserId(userId) : await this.findByMerchantId(merchantId!);
      if (!quota) {
        return { allowed: true };
      }
    }

    if (new Date(quota.reset_monthly_at) <= now) {
      await this.resetMonthlyCounts();
      quota = userId ? await this.findByUserId(userId) : await this.findByMerchantId(merchantId!);
      if (!quota) {
        return { allowed: true };
      }
    }

    const remainingDaily = quota.daily_limit - quota.current_daily_count;
    const remainingMonthly = quota.monthly_limit - quota.current_monthly_count;

    return {
      allowed: remainingDaily > 0 && remainingMonthly > 0,
      quota,
      remainingDaily,
      remainingMonthly,
    };
  }
}

export const quotaService = new QuotaService();

