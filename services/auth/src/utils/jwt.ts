import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JWTPayload, User, UserRole } from '../types';

export const generateAccessToken = (user: User): string => {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role || UserRole.USER,
    type: 'access',
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessTokenExpiry,
  } as jwt.SignOptions);
};

export const generateRefreshToken = (user: User): string => {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role || UserRole.USER,
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshTokenExpiry,
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
};

