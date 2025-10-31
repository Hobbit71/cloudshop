import { Request, Response, NextFunction } from 'express';
import { AdminRequest } from '../types';
import { AuthorizationError } from '../utils/errors';
import { UserRole } from '../types';

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const adminReq = req as AdminRequest;

    if (!adminReq.user) {
      res.status(401).json({
        error: {
          message: 'Authentication required',
          code: 'AUTHENTICATION_ERROR',
          statusCode: 401,
        },
      });
      return;
    }

    const userRole = adminReq.user.role || UserRole.USER;

    if (!allowedRoles.includes(userRole)) {
      const error = new AuthorizationError();
      res.status(403).json({
        error: {
          message: error.message,
          code: error.code,
          statusCode: error.statusCode,
        },
      });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole(UserRole.ADMIN);
export const requireModerator = requireRole(UserRole.ADMIN, UserRole.MODERATOR);

