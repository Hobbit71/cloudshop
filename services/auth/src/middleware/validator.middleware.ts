import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ValidationError } from '../utils/errors';

export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new ValidationError('Validation failed', errors.array());
    res.status(400).json({
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
      },
    });
    return;
  }

  next();
};

export const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number'),
  body('first_name').trim().notEmpty().isLength({ min: 1, max: 100 }).withMessage('First name is required'),
  body('last_name').trim().notEmpty().isLength({ min: 1, max: 100 }).withMessage('Last name is required'),
  validate,
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('mfaCode').optional().isString().isLength({ min: 6, max: 6 }).withMessage('MFA code must be 6 digits'),
  validate,
];

export const refreshTokenValidation = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  validate,
];

export const mfaSetupValidation = [
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

export const mfaVerifyValidation = [
  body('code').isString().isLength({ min: 6, max: 6 }).withMessage('MFA code must be 6 digits'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

