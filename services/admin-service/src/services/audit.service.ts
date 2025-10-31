import { getPool } from '../config/database';
import { AuditLog, AuditLogQuery } from '../types';

export class AuditService {
  async createAuditLog(data: {
    user_id?: string;
    action: string;
    resource_type: string;
    resource_id?: string;
    details?: Record<string, unknown>;
    ip_address?: string;
    user_agent?: string;
    status?: 'success' | 'failure' | 'error';
    error_message?: string;
  }): Promise<AuditLog> {
    const pool = getPool();

    const result = await pool.query<AuditLog>(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent, status, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        data.user_id || null,
        data.action,
        data.resource_type,
        data.resource_id || null,
        data.details ? JSON.stringify(data.details) : null,
        data.ip_address || null,
        data.user_agent || null,
        data.status || 'success',
        data.error_message || null,
      ]
    );

    const log = result.rows[0];
    // Parse JSON details
    if (log.details && typeof log.details === 'string') {
      log.details = JSON.parse(log.details);
    }

    return log;
  }

  async findById(id: string): Promise<AuditLog | null> {
    const pool = getPool();
    const result = await pool.query<AuditLog>('SELECT * FROM audit_logs WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const log = result.rows[0];
    // Parse JSON details
    if (log.details && typeof log.details === 'string') {
      log.details = JSON.parse(log.details as string);
    }

    return log;
  }

  async findAll(query: AuditLogQuery): Promise<{ logs: AuditLog[]; total: number }> {
    const pool = getPool();
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramCount = 1;

    if (query.user_id) {
      conditions.push(`user_id = $${paramCount++}`);
      params.push(query.user_id);
    }

    if (query.action) {
      conditions.push(`action = $${paramCount++}`);
      params.push(query.action);
    }

    if (query.resource_type) {
      conditions.push(`resource_type = $${paramCount++}`);
      params.push(query.resource_type);
    }

    if (query.status) {
      conditions.push(`status = $${paramCount++}`);
      params.push(query.status);
    }

    if (query.start_date) {
      conditions.push(`created_at >= $${paramCount++}`);
      params.push(query.start_date);
    }

    if (query.end_date) {
      conditions.push(`created_at <= $${paramCount++}`);
      params.push(query.end_date);
    }

    const whereClause = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';
    const queryStr = `SELECT * FROM audit_logs${whereClause} ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    const countQuery = `SELECT COUNT(*) as count FROM audit_logs${whereClause}`;

    params.push(limit, offset);

    const [logsResult, countResult] = await Promise.all([
      pool.query<AuditLog>(queryStr, params),
      pool.query<{ count: string }>(countQuery, params.slice(0, -2)),
    ]);

    // Parse JSON details for each log
    const logs = logsResult.rows.map((log) => {
      if (log.details && typeof log.details === 'string') {
        log.details = JSON.parse(log.details as string);
      }
      return log;
    });

    return {
      logs,
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  async getAuditStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byAction: Record<string, number>;
    recentActivity: AuditLog[];
  }> {
    const pool = getPool();

    const [totalResult, statusResult, actionResult, recentResult] = await Promise.all([
      pool.query<{ count: string }>('SELECT COUNT(*) as count FROM audit_logs'),
      pool.query<{ status: string; count: string }>(
        'SELECT status, COUNT(*) as count FROM audit_logs GROUP BY status'
      ),
      pool.query<{ action: string; count: string }>(
        'SELECT action, COUNT(*) as count FROM audit_logs GROUP BY action ORDER BY count DESC LIMIT 10'
      ),
      pool.query<AuditLog>(
        'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10'
      ),
    ]);

    const byStatus: Record<string, number> = {};
    statusResult.rows.forEach((row) => {
      byStatus[row.status] = parseInt(row.count, 10);
    });

    const byAction: Record<string, number> = {};
    actionResult.rows.forEach((row) => {
      byAction[row.action] = parseInt(row.count, 10);
    });

    const recentActivity = recentResult.rows.map((log) => {
      if (log.details && typeof log.details === 'string') {
        log.details = JSON.parse(log.details as string);
      }
      return log;
    });

    return {
      total: parseInt(totalResult.rows[0].count, 10),
      byStatus,
      byAction,
      recentActivity,
    };
  }
}

export const auditService = new AuditService();

