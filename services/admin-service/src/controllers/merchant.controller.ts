import { Response } from 'express';
import { AdminRequest, CreateMerchantRequest, UpdateMerchantRequest } from '../types';
import { merchantService } from '../services/merchant.service';
import { auditService } from '../services/audit.service';

export class MerchantController {
  async createMerchant(req: AdminRequest, res: Response): Promise<void> {
    const data: CreateMerchantRequest = req.body;
    const user = req.user;

    const merchant = await merchantService.createMerchant(data, user?.id);

    // Log audit
    await auditService.createAuditLog({
      user_id: user?.id,
      action: 'create',
      resource_type: 'merchant',
      resource_id: merchant.id,
      details: { name: merchant.name, email: merchant.email },
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
    });

    res.status(201).json({
      message: 'Merchant created successfully',
      data: merchant,
    });
  }

  async getMerchants(req: AdminRequest, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;

    const result = await merchantService.findAll(page, limit, status);

    res.json({
      message: 'Merchants retrieved successfully',
      data: result.merchants,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
    });
  }

  async getMerchant(req: AdminRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const merchant = await merchantService.findById(id);

    if (!merchant) {
      res.status(404).json({
        error: {
          message: 'Merchant not found',
          code: 'NOT_FOUND',
          statusCode: 404,
        },
      });
      return;
    }

    res.json({
      message: 'Merchant retrieved successfully',
      data: merchant,
    });
  }

  async updateMerchant(req: AdminRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const updates: UpdateMerchantRequest = req.body;
    const user = req.user;

    const updatedMerchant = await merchantService.updateMerchant(id, updates);

    // Log audit
    await auditService.createAuditLog({
      user_id: user?.id,
      action: 'update',
      resource_type: 'merchant',
      resource_id: id,
      details: updates,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
    });

    res.json({
      message: 'Merchant updated successfully',
      data: updatedMerchant,
    });
  }

  async deleteMerchant(req: AdminRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const user = req.user;

    await merchantService.deleteMerchant(id);

    // Log audit
    await auditService.createAuditLog({
      user_id: user?.id,
      action: 'delete',
      resource_type: 'merchant',
      resource_id: id,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
    });

    res.json({
      message: 'Merchant deleted successfully',
    });
  }
}

export const merchantController = new MerchantController();

