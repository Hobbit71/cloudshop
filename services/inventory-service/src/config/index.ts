import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  env: string;
  port: number;
  host: string;
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    poolMin: number;
    poolMax: number;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  socketio: {
    corsOrigin: string[];
  };
  inventory: {
    reservationTtl: number;
    lowStockThreshold: number;
    forecastingLookbackDays: number;
  };
  cors: {
    origin: string[];
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value || defaultValue || '';
};

const getEnvNumber = (key: string, defaultValue?: number): number => {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value ? parseInt(value, 10) : (defaultValue || 0);
};

export const config: Config = {
  env: getEnvVar('NODE_ENV', 'development'),
  port: getEnvNumber('PORT', 3003),
  host: getEnvVar('HOST', '0.0.0.0'),
  database: {
    host: getEnvVar('DB_HOST', 'localhost'),
    port: getEnvNumber('DB_PORT', 5432),
    name: getEnvVar('DB_NAME', 'cloudshop'),
    user: getEnvVar('DB_USER', 'cloudshop'),
    password: getEnvVar('DB_PASSWORD', 'cloudshop'),
    poolMin: getEnvNumber('DB_POOL_MIN', 2),
    poolMax: getEnvNumber('DB_POOL_MAX', 10),
  },
  redis: {
    host: getEnvVar('REDIS_HOST', 'localhost'),
    port: getEnvNumber('REDIS_PORT', 6379),
    password: process.env.REDIS_PASSWORD,
    db: getEnvNumber('REDIS_DB', 1),
  },
  socketio: {
    corsOrigin: getEnvVar('SOCKET_IO_CORS_ORIGIN', 'http://localhost:5173').split(','),
  },
  inventory: {
    reservationTtl: getEnvNumber('RESERVATION_TTL', 1800),
    lowStockThreshold: getEnvNumber('LOW_STOCK_THRESHOLD', 10),
    forecastingLookbackDays: getEnvNumber('FORECASTING_LOOKBACK_DAYS', 90),
  },
  cors: {
    origin: getEnvVar('CORS_ORIGIN', 'http://localhost:5173').split(','),
  },
  rateLimit: {
    windowMs: getEnvNumber('RATE_LIMIT_WINDOW_MS', 900000),
    maxRequests: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),
  },
};

