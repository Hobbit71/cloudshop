import { Response } from 'express';
import { AuthRequest } from '../types';
import { authService } from '../services/auth.service';
import { AuthenticationError } from '../utils/errors';

export class AuthController {
  async register(req: AuthRequest, res: Response): Promise<void> {
    const { email, password, first_name, last_name } = req.body;

    const tokens = await authService.register(email, password, first_name, last_name);

    res.status(201).json({
      message: 'User registered successfully',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  }

  async login(req: AuthRequest, res: Response): Promise<void> {
    const { email, password, mfaCode } = req.body;

    const tokens = await authService.login({
      email,
      password,
      mfaCode,
    });

    res.json({
      message: 'Login successful',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  }

  async logout(req: AuthRequest, res: Response): Promise<void> {
    const user = req.user;
    if (!user) {
      throw new AuthenticationError('User not authenticated');
    }

    const authHeader = req.headers.authorization;
    const refreshToken = req.body.refreshToken || (authHeader ? authHeader.substring(7) : null);

    if (refreshToken) {
      await authService.logout(user.id, refreshToken);
    }

    res.json({
      message: 'Logout successful',
    });
  }

  async logoutAll(req: AuthRequest, res: Response): Promise<void> {
    const user = req.user;
    if (!user) {
      throw new AuthenticationError('User not authenticated');
    }

    await authService.logoutAll(user.id);

    res.json({
      message: 'Logged out from all devices',
    });
  }

  async refreshToken(req: AuthRequest, res: Response): Promise<void> {
    const { refreshToken } = req.body;

    const tokens = await authService.refreshTokens(refreshToken);

    res.json({
      message: 'Token refreshed successfully',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  }

  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    const user = req.user;
    if (!user) {
      throw new AuthenticationError('User not authenticated');
    }

    const profile = await authService.getUserProfile(user.id);

    // Remove sensitive data
    const { password_hash, ...safeProfile } = profile as any;

    res.json({
      message: 'Profile retrieved successfully',
      data: safeProfile,
    });
  }
}

export const authController = new AuthController();

