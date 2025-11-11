/**
 * API Request Validation Helpers
 *
 * Provides utilities for validating request bodies, query parameters,
 * and common data patterns.
 */

import { NextRequest } from 'next/server';
import { validationError } from './error-handler';

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  body: Record<string, any>,
  requiredFields: string[]
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      missing.push(field);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate that value is a positive number
 */
export function isPositiveNumber(value: any): boolean {
  return typeof value === 'number' && value > 0 && !isNaN(value);
}

/**
 * Validate that value is a non-negative number
 */
export function isNonNegativeNumber(value: any): boolean {
  return typeof value === 'number' && value >= 0 && !isNaN(value);
}

/**
 * Validate array field
 */
export function isValidArray(value: any, minLength: number = 0): boolean {
  return Array.isArray(value) && value.length >= minLength;
}

/**
 * Validate date string (ISO 8601 format)
 */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Validate that a string is one of allowed values
 */
export function isOneOf(value: string, allowedValues: string[]): boolean {
  return allowedValues.includes(value);
}

/**
 * Parse and validate JSON request body
 */
export async function parseRequestBody<T = any>(
  request: NextRequest
): Promise<
  { success: true; data: T } | { success: false; error: ReturnType<typeof validationError> }
> {
  try {
    const body = await request.json();
    return { success: true, data: body };
  } catch (error) {
    return {
      success: false,
      error: validationError('Invalid JSON in request body'),
    };
  }
}

/**
 * Validate and parse query parameters
 */
export function getQueryParam(
  request: NextRequest,
  paramName: string,
  options?: {
    required?: boolean;
    default?: string;
    validate?: (value: string) => boolean;
  }
): string | null {
  const value = request.nextUrl.searchParams.get(paramName);

  if (value === null) {
    if (options?.required) {
      throw new Error(`Missing required query parameter: ${paramName}`);
    }
    return options?.default || null;
  }

  if (options?.validate && !options.validate(value)) {
    throw new Error(`Invalid value for query parameter: ${paramName}`);
  }

  return value;
}

/**
 * Validate employee ID format
 */
export function isValidEmployeeId(id: string): boolean {
  // Basic validation - adjust based on your ID format
  return typeof id === 'string' && id.length > 0 && id.length <= 50;
}

/**
 * Sanitize string input (remove dangerous characters)
 */
export function sanitizeString(input: string): string {
  // Remove any potential script tags or dangerous HTML
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(
  page?: string | null,
  limit?: string | null
): { page: number; limit: number; skip: number } {
  const pageNum = parseInt(page || '1', 10);
  const limitNum = parseInt(limit || '20', 10);

  if (isNaN(pageNum) || pageNum < 1) {
    throw new Error('Invalid page number');
  }

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    throw new Error('Invalid limit (must be between 1 and 100)');
  }

  return {
    page: pageNum,
    limit: limitNum,
    skip: (pageNum - 1) * limitNum,
  };
}

/**
 * Validate sort parameters
 */
export function validateSortParams(
  sortBy?: string | null,
  sortOrder?: string | null,
  allowedFields: string[] = []
): { sortBy: string | null; sortOrder: 'asc' | 'desc' } {
  if (sortBy && allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
    throw new Error(`Invalid sort field. Allowed fields: ${allowedFields.join(', ')}`);
  }

  const order = sortOrder?.toLowerCase() === 'desc' ? 'desc' : 'asc';

  return {
    sortBy: sortBy || null,
    sortOrder: order,
  };
}
