import { userService } from './user.service';
import { mfaService } from './mfa.service';
import { sessionService } from './session.service';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt';
import { TokenPair, LoginRequest, User } from '../types';
import { ValidationError, AuthenticationError } from '../utils/errors';

export class AuthService {
  async register(email: string, password: string, firstName: string, lastName: string): Promise<TokenPair> {
    const user = await userService.createUser({
      email,
      password,
      first_name: firstName,
      last_name: lastName,
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await sessionService.createSession(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }

  async login(data: LoginRequest): Promise<TokenPair> {
    const user = await userService.authenticateUser(data.email, data.password);

    // Check if MFA is enabled
    const isMFAEnabled = await mfaService.isMFAEnabled(user.id);

    if (isMFAEnabled) {
      if (!data.mfaCode) {
        throw new ValidationError('MFA code is required');
      }

      const isValidMFA = await mfaService.verifyMFA(user.id, data.mfaCode);
      if (!isValidMFA) {
        throw new AuthenticationError('Invalid MFA code');
      }
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await sessionService.createSession(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    await sessionService.deleteSession(userId, refreshToken);
  }

  async logoutAll(userId: string): Promise<void> {
    await sessionService.deleteAllUserSessions(userId);
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    try {
      const payload = verifyToken(refreshToken);

      if (payload.type !== 'refresh') {
        throw new AuthenticationError('Invalid token type');
      }

      // Check if session exists
      const session = await sessionService.getSession(payload.userId, refreshToken);
      if (!session) {
        throw new AuthenticationError('Session not found or expired');
      }

      // Get user
      const user = await userService.findById(payload.userId);
      if (!user) {
        throw new AuthenticationError('User not found');
      }

      // Generate new tokens
      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      // Update session
      await sessionService.refreshSession(payload.userId, refreshToken, newRefreshToken);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('expired')) {
        throw new AuthenticationError('Refresh token expired');
      }
      throw error;
    }
  }

  async getUserProfile(userId: string): Promise<User> {
    const user = await userService.findById(userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Remove password_hash from response
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }
}

export const authService = new AuthService();

