import { Request, Response } from 'express';
import { testConnection } from '../config/database';
import { testRedisConnection } from '../config/redis';

export class HealthController {
  async check(req: Request, res: Response): Promise<void> {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'inventory-service',
      checks: {
        database: await testConnection(),
        redis: await testRedisConnection(),
      },
    };

    const allHealthy = Object.values(health.checks).every((check) => check === true);

    res.status(allHealthy ? 200 : 503).json(health);
  }
}

export const healthController = new HealthController();

