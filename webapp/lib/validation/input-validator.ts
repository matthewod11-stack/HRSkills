/**
 * Input Validation Middleware
 *
 * Provides utilities for validating and sanitizing user input
 * to prevent injection attacks, XSS, and other security vulnerabilities
 */

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';

  // Remove potential script tags and dangerous characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate employee ID format
 */
export function isValidEmployeeId(id: string): boolean {
  // Allow alphanumeric, hyphens, underscores (typical employee ID formats)
  const idRegex = /^[a-zA-Z0-9_-]+$/;
  return idRegex.test(id) && id.length > 0 && id.length <= 50;
}

/**
 * Validate date string
 */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Validate number within range
 */
export function isValidNumber(value: any, min?: number, max?: number): boolean {
  const num = Number(value);
  if (isNaN(num)) return false;
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  return true;
}

/**
 * Validate enum value
 */
export function isValidEnum<T extends string>(
  value: string,
  validValues: readonly T[]
): value is T {
  return validValues.includes(value as T);
}

/**
 * Sanitize object by removing dangerous properties
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  allowedKeys: string[]
): Partial<T> {
  const sanitized: Partial<T> = {};

  for (const key of allowedKeys) {
    if (key in obj) {
      const value = obj[key];

      if (typeof value === 'string') {
        sanitized[key as keyof T] = sanitizeString(value) as T[keyof T];
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key as keyof T] = value as T[keyof T];
      } else if (value === null || value === undefined) {
        sanitized[key as keyof T] = value as T[keyof T];
      } else if (Array.isArray(value)) {
        // Recursively sanitize array elements
        sanitized[key as keyof T] = value.map((item) =>
          typeof item === 'string' ? sanitizeString(item) : item
        ) as T[keyof T];
      } else if (typeof value === 'object') {
        // Skip complex objects for now (can be expanded)
        sanitized[key as keyof T] = value as T[keyof T];
      }
    }
  }

  return sanitized;
}

/**
 * Validate query parameters
 */
export interface QueryValidationRule {
  type: 'string' | 'number' | 'boolean' | 'enum' | 'date';
  required?: boolean;
  min?: number;
  max?: number;
  enumValues?: readonly string[];
  pattern?: RegExp;
  maxLength?: number;
}

export interface QueryValidationRules {
  [key: string]: QueryValidationRule;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitized: Record<string, any>;
}

export function validateQueryParams(
  params: Record<string, any>,
  rules: QueryValidationRules
): ValidationResult {
  const errors: string[] = [];
  const sanitized: Record<string, any> = {};

  for (const [key, rule] of Object.entries(rules)) {
    const value = params[key];

    // Check required
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${key} is required`);
      continue;
    }

    // Skip if not required and not provided
    if (!rule.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Type validation
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`${key} must be a string`);
          break;
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(`${key} exceeds maximum length of ${rule.maxLength}`);
          break;
        }
        if (rule.pattern && !rule.pattern.test(value)) {
          errors.push(`${key} format is invalid`);
          break;
        }
        sanitized[key] = sanitizeString(value);
        break;

      case 'number':
        if (!isValidNumber(value, rule.min, rule.max)) {
          const range =
            rule.min !== undefined && rule.max !== undefined
              ? ` (${rule.min}-${rule.max})`
              : rule.min !== undefined
                ? ` (min: ${rule.min})`
                : rule.max !== undefined
                  ? ` (max: ${rule.max})`
                  : '';
          errors.push(`${key} must be a valid number${range}`);
          break;
        }
        sanitized[key] = Number(value);
        break;

      case 'boolean':
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
          errors.push(`${key} must be a boolean`);
          break;
        }
        sanitized[key] = value === true || value === 'true';
        break;

      case 'enum':
        if (!rule.enumValues) {
          errors.push(`Invalid enum rule for ${key}`);
          break;
        }
        if (!isValidEnum(value, rule.enumValues)) {
          errors.push(`${key} must be one of: ${rule.enumValues.join(', ')}`);
          break;
        }
        sanitized[key] = value;
        break;

      case 'date':
        if (!isValidDate(value)) {
          errors.push(`${key} must be a valid date`);
          break;
        }
        sanitized[key] = value;
        break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized,
  };
}

/**
 * Prevent SQL injection by escaping special characters
 * Note: This is a basic sanitizer. Use parameterized queries in production.
 */
export function escapeSqlString(input: string): string {
  return input.replace(/'/g, "''");
}

/**
 * Validate file upload
 */
export interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

export function validateFile(file: File, options: FileValidationOptions = {}): ValidationResult {
  const errors: string[] = [];

  // Check file size
  if (options.maxSize && file.size > options.maxSize) {
    errors.push(`File size exceeds maximum of ${options.maxSize / 1024 / 1024}MB`);
  }

  // Check file type
  if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
    errors.push(
      `File type ${file.type} is not allowed. Allowed types: ${options.allowedTypes.join(', ')}`
    );
  }

  // Check file extension
  if (options.allowedExtensions) {
    const ext = file.name.toLowerCase().split('.').pop();
    if (!ext || !options.allowedExtensions.includes(`.${ext}`)) {
      errors.push(
        `File extension .${ext} is not allowed. Allowed extensions: ${options.allowedExtensions.join(', ')}`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: {},
  };
}
