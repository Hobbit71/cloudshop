import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AuthRequest } from '../types';
import { AuthenticationError } from '../utils/errors';
import { userService } from '../services/user.service';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (payload.type !== 'access') {
      throw new AuthenticationError('Invalid token type');
    }

    const user = await userService.findById(payload.userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    (req as AuthRequest).user = user;
    (req as AuthRequest).token = token;

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      res.status(401).json({
        error: {
          message: error.message,
          code: error.code,
          statusCode: error.statusCode,
        },
      });
      return;
    }

    res.status(401).json({
      error: {
        message: 'Authentication failed',
        code: 'AUTHENTICATION_ERROR',
        statusCode: 401,
      },
    });
  }
};

