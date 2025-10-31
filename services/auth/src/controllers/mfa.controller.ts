import { Response } from 'express';
import { AuthRequest } from '../types';
import { mfaService } from '../services/mfa.service';
import { userService } from '../services/user.service';
import { AuthenticationError, ValidationError } from '../utils/errors';

export class MFAController {
  async setup(req: AuthRequest, res: Response): Promise<void> {
    const user = req.user;
    if (!user) {
      throw new AuthenticationError('User not authenticated');
    }

    const { password } = req.body;

    // Verify password
    const isValid = await userService.verifyPassword(user, password);
    if (!isValid) {
      throw new ValidationError('Invalid password');
    }

    const { secret, qrCodeUrl } = await mfaService.setupMFA(user.id);

    res.json({
      message: 'MFA setup initiated',
      data: {
        secret,
        qrCodeUrl,
      },
    });
  }

  async verify(req: AuthRequest, res: Response): Promise<void> {
    const user = req.user;
    if (!user) {
      throw new AuthenticationError('User not authenticated');
    }

    const { code, password } = req.body;

    // Verify password
    const isValid = await userService.verifyPassword(user, password);
    if (!isValid) {
      throw new ValidationError('Invalid password');
    }

    // Verify MFA code and enable
    await mfaService.enableMFA(user.id, code);

    res.json({
      message: 'MFA enabled successfully',
    });
  }

  async disable(req: AuthRequest, res: Response): Promise<void> {
    const user = req.user;
    if (!user) {
      throw new AuthenticationError('User not authenticated');
    }

    await mfaService.disableMFA(user.id);

    res.json({
      message: 'MFA disabled successfully',
    });
  }

  async status(req: AuthRequest, res: Response): Promise<void> {
    const user = req.user;
    if (!user) {
      throw new AuthenticationError('User not authenticated');
    }

    const isEnabled = await mfaService.isMFAEnabled(user.id);

    res.json({
      message: 'MFA status retrieved',
      data: {
        enabled: isEnabled,
      },
    });
  }
}

export const mfaController = new MFAController();

