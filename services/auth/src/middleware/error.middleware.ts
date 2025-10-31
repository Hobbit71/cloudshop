import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import logger from '../config/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    logger.warn('Application error', {
      error: err.message,
      code: err.code,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
    });

    res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
        statusCode: err.statusCode,
        ...(process.env.NODE_ENV !== 'production' && err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      statusCode: 500,
      ...(process.env.NODE_ENV !== 'production' ? { details: err.message } : {}),
    },
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      code: 'NOT_FOUND',
      statusCode: 404,
    },
  });
};

