import { getPool } from '../config/database';
import { DashboardMetrics, AuditLog } from '../types';
import { auditService } from './audit.service';
import { quotaService } from './quota.service';

export class DashboardService {
  async getMetrics(): Promise<DashboardMetrics> {
    const pool = getPool();

    const [
      usersResult,
      merchantsResult,
      activeMerchantsResult,
      pendingMerchantsResult,
      auditLogsResult,
      recentAuditLogsResult,
    ] = await Promise.all([
      pool.query<{ count: string }>('SELECT COUNT(*) as count FROM users'),
      pool.query<{ count: string }>('SELECT COUNT(*) as count FROM merchants'),
      pool.query<{ count: string }>(
        "SELECT COUNT(*) as count FROM merchants WHERE status = 'active'"
      ),
      pool.query<{ count: string }>(
        "SELECT COUNT(*) as count FROM merchants WHERE status = 'pending'"
      ),
      pool.query<{ count: string }>('SELECT COUNT(*) as count FROM audit_logs'),
      pool.query<AuditLog>(
        'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10'
      ),
    ]);

    // Calculate API quota usage
    const allQuotas = await quotaService.findAll(1, 1000);
    const totalDailyUsage = allQuotas.quotas.reduce(
      (sum, quota) => sum + quota.current_daily_count,
      0
    );
    const totalMonthlyUsage = allQuotas.quotas.reduce(
      (sum, quota) => sum + quota.current_monthly_count,
      0
    );

    // Parse JSON details for recent audit logs
    const recentAuditLogs = recentAuditLogsResult.rows.map((log) => {
      if (log.details && typeof log.details === 'string') {
        log.details = JSON.parse(log.details as string);
      }
      return log;
    });

    return {
      totalUsers: parseInt(usersResult.rows[0].count, 10),
      totalMerchants: parseInt(merchantsResult.rows[0].count, 10),
      activeMerchants: parseInt(activeMerchantsResult.rows[0].count, 10),
      pendingMerchants: parseInt(pendingMerchantsResult.rows[0].count, 10),
      totalAuditLogs: parseInt(auditLogsResult.rows[0].count, 10),
      recentAuditLogs,
      apiQuotaUsage: {
        dailyUsage: totalDailyUsage,
        monthlyUsage: totalMonthlyUsage,
      },
    };
  }
}

export const dashboardService = new DashboardService();

