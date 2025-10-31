import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role?: UserRole;
  email_verified?: boolean;
  created_at: Date;
  updated_at?: Date;
}

export interface Merchant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  postal_code?: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  business_type?: string;
  tax_id?: string;
  created_by?: string;
  created_at: Date;
  updated_at?: Date;
}

export interface SystemConfig {
  id: string;
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  category: string;
  description?: string;
  is_encrypted: boolean;
  updated_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  status: 'success' | 'failure' | 'error';
  error_message?: string;
  created_at: Date;
}

export interface ApiQuota {
  id: string;
  user_id?: string;
  merchant_id?: string;
  daily_limit: number;
  monthly_limit: number;
  current_daily_count: number;
  current_monthly_count: number;
  reset_daily_at: Date;
  reset_monthly_at: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface JWTPayload extends JwtPayload {
  userId: string;
  email: string;
  role?: UserRole;
  type: 'access' | 'refresh';
}

export interface AdminRequest extends Request {
  user?: User;
  token?: string;
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
  };
}

export interface DashboardMetrics {
  totalUsers: number;
  totalMerchants: number;
  activeMerchants: number;
  pendingMerchants: number;
  totalAuditLogs: number;
  recentAuditLogs: AuditLog[];
  apiQuotaUsage: {
    dailyUsage: number;
    monthlyUsage: number;
  };
}

export interface CreateMerchantRequest {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  business_type?: string;
  tax_id?: string;
}

export interface UpdateMerchantRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  status?: 'active' | 'inactive' | 'suspended' | 'pending';
  business_type?: string;
  tax_id?: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: UserRole;
}

export interface UpdateUserRequest {
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: UserRole;
  email_verified?: boolean;
}

export interface CreateSystemConfigRequest {
  key: string;
  value: string;
  type?: 'string' | 'number' | 'boolean' | 'json';
  category?: string;
  description?: string;
  is_encrypted?: boolean;
}

export interface UpdateSystemConfigRequest {
  value?: string;
  type?: 'string' | 'number' | 'boolean' | 'json';
  category?: string;
  description?: string;
  is_encrypted?: boolean;
}

export interface CreateApiQuotaRequest {
  user_id?: string;
  merchant_id?: string;
  daily_limit?: number;
  monthly_limit?: number;
  is_active?: boolean;
}

export interface UpdateApiQuotaRequest {
  daily_limit?: number;
  monthly_limit?: number;
  is_active?: boolean;
}

export interface AuditLogQuery {
  user_id?: string;
  action?: string;
  resource_type?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

