import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { getPool } from '../config/database';
import { MFASecret } from '../types';
import { config } from '../config';
import { NotFoundError, ValidationError } from '../utils/errors';
import { userService } from './user.service';

export class MFAService {
  async setupMFA(userId: string): Promise<{ secret: string; qrCodeUrl: string }> {
    const user = await userService.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const secret = speakeasy.generateSecret({
      name: `${config.mfa.issuer} (${user.email})`,
      issuer: config.mfa.issuer,
      length: 32,
    });

    const pool = getPool();
    await pool.query(
      `INSERT INTO mfa_secrets (user_id, secret, is_enabled)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) 
       DO UPDATE SET secret = $2, is_enabled = $3, updated_at = CURRENT_TIMESTAMP`,
      [userId, secret.base32, false]
    );

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    return {
      secret: secret.base32 || '',
      qrCodeUrl,
    };
  }

  async verifyMFA(userId: string, token: string): Promise<boolean> {
    const mfaSecret = await this.getMFASecret(userId);
    if (!mfaSecret) {
      throw new ValidationError('MFA not set up for this user');
    }

    if (!mfaSecret.is_enabled) {
      throw new ValidationError('MFA is not enabled for this user');
    }

    const verified = speakeasy.totp.verify({
      secret: mfaSecret.secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps before/after current time
    });

    return verified === true;
  }

  async enableMFA(userId: string, token: string): Promise<void> {
    const mfaSecret = await this.getMFASecret(userId);
    if (!mfaSecret) {
      throw new ValidationError('MFA not set up. Please set up MFA first.');
    }

    const isValid = speakeasy.totp.verify({
      secret: mfaSecret.secret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!isValid) {
      throw new ValidationError('Invalid MFA code');
    }

    const pool = getPool();
    await pool.query(
      'UPDATE mfa_secrets SET is_enabled = $1 WHERE user_id = $2',
      [true, userId]
    );
  }

  async disableMFA(userId: string): Promise<void> {
    const pool = getPool();
    await pool.query(
      'UPDATE mfa_secrets SET is_enabled = $1 WHERE user_id = $2',
      [false, userId]
    );
  }

  async getMFASecret(userId: string): Promise<MFASecret | null> {
    const pool = getPool();
    const result = await pool.query<MFASecret>(
      'SELECT * FROM mfa_secrets WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] || null;
  }

  async isMFAEnabled(userId: string): Promise<boolean> {
    const mfaSecret = await this.getMFASecret(userId);
    return mfaSecret?.is_enabled === true;
  }
}

export const mfaService = new MFAService();

