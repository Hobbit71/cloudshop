import { Response } from 'express';
import { AdminRequest, AuditLogQuery } from '../types';
import { auditService } from '../services/audit.service';

export class AuditController {
  async getAuditLogs(req: AdminRequest, res: Response): Promise<void> {
    const query: AuditLogQuery = {
      user_id: req.query.user_id as string,
      action: req.query.action as string,
      resource_type: req.query.resource_type as string,
      status: req.query.status as string,
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };

    const result = await auditService.findAll(query);

    res.json({
      message: 'Audit logs retrieved successfully',
      data: result.logs,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 20,
        total: result.total,
        pages: Math.ceil(result.total / (query.limit || 20)),
      },
    });
  }

  async getAuditLog(req: AdminRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const log = await auditService.findById(id);

    if (!log) {
      res.status(404).json({
        error: {
          message: 'Audit log not found',
          code: 'NOT_FOUND',
          statusCode: 404,
        },
      });
      return;
    }

    res.json({
      message: 'Audit log retrieved successfully',
      data: log,
    });
  }

  async getAuditStats(req: AdminRequest, res: Response): Promise<void> {
    const stats = await auditService.getAuditStats();

    res.json({
      message: 'Audit statistics retrieved successfully',
      data: stats,
    });
  }
}

export const auditController = new AuditController();

