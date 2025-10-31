import { Request, Response } from 'express';
import { testConnection as testDbConnection } from '../config/database';
import { testRedisConnection } from '../config/redis';
import { HealthCheckResponse } from '../types';

const startTime = Date.now();

export class HealthController {
  async check(req: Request, res: Response): Promise<void> {
    const dbStatus = await testDbConnection();
    const redisStatus = await testRedisConnection();

    const response: HealthCheckResponse = {
      status: dbStatus && redisStatus ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
      services: {
        database: dbStatus ? 'connected' : 'disconnected',
        redis: redisStatus ? 'connected' : 'disconnected',
      },
    };

    const statusCode = response.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(response);
  }
}

export const healthController = new HealthController();

