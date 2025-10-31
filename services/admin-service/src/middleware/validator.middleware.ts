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

export const createUserValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number'),
  body('first_name').trim().notEmpty().isLength({ min: 1, max: 100 }).withMessage('First name is required'),
  body('last_name').trim().notEmpty().isLength({ min: 1, max: 100 }).withMessage('Last name is required'),
  body('role').optional().isIn(['user', 'admin', 'moderator']).withMessage('Invalid role'),
  validate,
];

export const updateUserValidation = [
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('first_name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('First name must be between 1 and 100 characters'),
  body('last_name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Last name must be between 1 and 100 characters'),
  body('role').optional().isIn(['user', 'admin', 'moderator']).withMessage('Invalid role'),
  body('email_verified').optional().isBoolean().withMessage('email_verified must be a boolean'),
  validate,
];

export const createMerchantValidation = [
  body('name').trim().notEmpty().isLength({ min: 1, max: 255 }).withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional().isString().isLength({ max: 50 }).withMessage('Phone must be a string with max 50 characters'),
  body('address').optional().isString().withMessage('Address must be a string'),
  body('city').optional().isString().isLength({ max: 100 }).withMessage('City must be a string with max 100 characters'),
  body('state').optional().isString().isLength({ max: 100 }).withMessage('State must be a string with max 100 characters'),
  body('country').optional().isString().isLength({ max: 100 }).withMessage('Country must be a string with max 100 characters'),
  body('postal_code').optional().isString().isLength({ max: 20 }).withMessage('Postal code must be a string with max 20 characters'),
  body('business_type').optional().isString().isLength({ max: 100 }).withMessage('Business type must be a string with max 100 characters'),
  body('tax_id').optional().isString().isLength({ max: 100 }).withMessage('Tax ID must be a string with max 100 characters'),
  validate,
];

export const updateMerchantValidation = [
  body('name').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Name must be between 1 and 255 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional().isString().isLength({ max: 50 }).withMessage('Phone must be a string with max 50 characters'),
  body('address').optional().isString().withMessage('Address must be a string'),
  body('city').optional().isString().isLength({ max: 100 }).withMessage('City must be a string with max 100 characters'),
  body('state').optional().isString().isLength({ max: 100 }).withMessage('State must be a string with max 100 characters'),
  body('country').optional().isString().isLength({ max: 100 }).withMessage('Country must be a string with max 100 characters'),
  body('postal_code').optional().isString().isLength({ max: 20 }).withMessage('Postal code must be a string with max 20 characters'),
  body('status').optional().isIn(['active', 'inactive', 'suspended', 'pending']).withMessage('Invalid status'),
  body('business_type').optional().isString().isLength({ max: 100 }).withMessage('Business type must be a string with max 100 characters'),
  body('tax_id').optional().isString().isLength({ max: 100 }).withMessage('Tax ID must be a string with max 100 characters'),
  validate,
];

export const createConfigValidation = [
  body('key').trim().notEmpty().isLength({ min: 1, max: 255 }).withMessage('Key is required'),
  body('value').notEmpty().withMessage('Value is required'),
  body('type').optional().isIn(['string', 'number', 'boolean', 'json']).withMessage('Invalid type'),
  body('category').optional().isString().isLength({ max: 100 }).withMessage('Category must be a string with max 100 characters'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('is_encrypted').optional().isBoolean().withMessage('is_encrypted must be a boolean'),
  validate,
];

export const updateConfigValidation = [
  body('value').optional().notEmpty().withMessage('Value cannot be empty'),
  body('type').optional().isIn(['string', 'number', 'boolean', 'json']).withMessage('Invalid type'),
  body('category').optional().isString().isLength({ max: 100 }).withMessage('Category must be a string with max 100 characters'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('is_encrypted').optional().isBoolean().withMessage('is_encrypted must be a boolean'),
  validate,
];

export const createQuotaValidation = [
  body('user_id').optional().isUUID().withMessage('user_id must be a valid UUID'),
  body('merchant_id').optional().isUUID().withMessage('merchant_id must be a valid UUID'),
  body('daily_limit').optional().isInt({ min: 0 }).withMessage('daily_limit must be a non-negative integer'),
  body('monthly_limit').optional().isInt({ min: 0 }).withMessage('monthly_limit must be a non-negative integer'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
  validate,
];

export const updateQuotaValidation = [
  body('daily_limit').optional().isInt({ min: 0 }).withMessage('daily_limit must be a non-negative integer'),
  body('monthly_limit').optional().isInt({ min: 0 }).withMessage('monthly_limit must be a non-negative integer'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
  validate,
];

