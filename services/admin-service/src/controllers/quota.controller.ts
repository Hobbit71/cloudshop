import { Response } from 'express';
import { AdminRequest, CreateApiQuotaRequest, UpdateApiQuotaRequest } from '../types';
import { quotaService } from '../services/quota.service';
import { auditService } from '../services/audit.service';

export class QuotaController {
  async createQuota(req: AdminRequest, res: Response): Promise<void> {
    const data: CreateApiQuotaRequest = req.body;
    const user = req.user;

    const quota = await quotaService.createQuota(data);

    // Log audit
    await auditService.createAuditLog({
      user_id: user?.id,
      action: 'create',
      resource_type: 'api_quota',
      resource_id: quota.id,
      details: {
        user_id: quota.user_id,
        merchant_id: quota.merchant_id,
        daily_limit: quota.daily_limit,
        monthly_limit: quota.monthly_limit,
      },
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
    });

    res.status(201).json({
      message: 'API quota created successfully',
      data: quota,
    });
  }

  async getQuotas(req: AdminRequest, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await quotaService.findAll(page, limit);

    res.json({
      message: 'API quotas retrieved successfully',
      data: result.quotas,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
    });
  }

  async getQuota(req: AdminRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const quota = await quotaService.findById(id);

    if (!quota) {
      res.status(404).json({
        error: {
          message: 'API quota not found',
          code: 'NOT_FOUND',
          statusCode: 404,
        },
      });
      return;
    }

    res.json({
      message: 'API quota retrieved successfully',
      data: quota,
    });
  }

  async updateQuota(req: AdminRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const updates: UpdateApiQuotaRequest = req.body;
    const user = req.user;

    const updatedQuota = await quotaService.updateQuota(id, updates);

    // Log audit
    await auditService.createAuditLog({
      user_id: user?.id,
      action: 'update',
      resource_type: 'api_quota',
      resource_id: id,
      details: updates,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
    });

    res.json({
      message: 'API quota updated successfully',
      data: updatedQuota,
    });
  }

  async deleteQuota(req: AdminRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const user = req.user;

    await quotaService.deleteQuota(id);

    // Log audit
    await auditService.createAuditLog({
      user_id: user?.id,
      action: 'delete',
      resource_type: 'api_quota',
      resource_id: id,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
    });

    res.json({
      message: 'API quota deleted successfully',
    });
  }
}

export const quotaController = new QuotaController();

