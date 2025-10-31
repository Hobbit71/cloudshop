import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role?: UserRole;
  email_verified?: boolean;
  created_at: Date;
  updated_at?: Date;
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

export interface MFASecret {
  user_id: string;
  secret: string;
  is_enabled: boolean;
  created_at: Date;
  updated_at?: Date;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload extends JwtPayload {
  userId: string;
  email: string;
  role?: UserRole;
  type: 'access' | 'refresh';
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface MFASetupRequest {
  password: string;
}

export interface MFAVerifyRequest {
  code: string;
  password: string;
}

export interface AuthRequest extends Request {
  user?: User;
  token?: string;
}

export interface Session {
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
  details?: unknown;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    database: 'connected' | 'disconnected';
    redis: 'connected' | 'disconnected';
  };
}

