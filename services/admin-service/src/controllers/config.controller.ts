import { Response } from 'express';
import {
  AdminRequest,
  CreateSystemConfigRequest,
  UpdateSystemConfigRequest,
} from '../types';
import { configService } from '../services/config.service';
import { auditService } from '../services/audit.service';

export class ConfigController {
  async createConfig(req: AdminRequest, res: Response): Promise<void> {
    const data: CreateSystemConfigRequest = req.body;
    const user = req.user;

    const config = await configService.createConfig(data, user?.id);

    // Log audit
    await auditService.createAuditLog({
      user_id: user?.id,
      action: 'create',
      resource_type: 'system_config',
      resource_id: config.id,
      details: { key: config.key, category: config.category },
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
    });

    res.status(201).json({
      message: 'Configuration created successfully',
      data: config,
    });
  }

  async getConfigs(req: AdminRequest, res: Response): Promise<void> {
    const category = req.query.category as string | undefined;

    const configs = await configService.findAll(category);

    res.json({
      message: 'Configurations retrieved successfully',
      data: configs,
    });
  }

  async getConfig(req: AdminRequest, res: Response): Promise<void> {
    const { key } = req.params;
    const config = await configService.findByKey(key);

    if (!config) {
      res.status(404).json({
        error: {
          message: 'Configuration not found',
          code: 'NOT_FOUND',
          statusCode: 404,
        },
      });
      return;
    }

    res.json({
      message: 'Configuration retrieved successfully',
      data: config,
    });
  }

  async updateConfig(req: AdminRequest, res: Response): Promise<void> {
    const { key } = req.params;
    const updates: UpdateSystemConfigRequest = req.body;
    const user = req.user;

    const updatedConfig = await configService.updateConfig(key, updates, user?.id);

    // Log audit
    await auditService.createAuditLog({
      user_id: user?.id,
      action: 'update',
      resource_type: 'system_config',
      details: { key, updates },
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
    });

    res.json({
      message: 'Configuration updated successfully',
      data: updatedConfig,
    });
  }

  async deleteConfig(req: AdminRequest, res: Response): Promise<void> {
    const { key } = req.params;
    const user = req.user;

    await configService.deleteConfig(key);

    // Log audit
    await auditService.createAuditLog({
      user_id: user?.id,
      action: 'delete',
      resource_type: 'system_config',
      details: { key },
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
    });

    res.json({
      message: 'Configuration deleted successfully',
    });
  }
}

export const configController = new ConfigController();

