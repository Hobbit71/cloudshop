import { Response } from 'express';
import { AdminRequest } from '../types';
import { dashboardService } from '../services/dashboard.service';

export class DashboardController {
  async getMetrics(req: AdminRequest, res: Response): Promise<void> {
    const metrics = await dashboardService.getMetrics();

    res.json({
      message: 'Dashboard metrics retrieved successfully',
      data: metrics,
    });
  }
}

export const dashboardController = new DashboardController();

