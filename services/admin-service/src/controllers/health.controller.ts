import { Request, Response } from 'express';
import { testConnection as testDbConnection } from '../config/database';
import { HealthCheckResponse } from '../types';

const startTime = Date.now();

export class HealthController {
  async check(_req: Request, res: Response): Promise<void> {
    const dbStatus = await testDbConnection();

    const response: HealthCheckResponse = {
      status: dbStatus ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
      services: {
        database: dbStatus ? 'connected' : 'disconnected',
      },
    };

    const statusCode = response.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(response);
  }
}

export const healthController = new HealthController();

