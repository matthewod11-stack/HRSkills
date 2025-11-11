/**
 * Standardized API Error Handling
 *
 * Provides consistent error response formats, logging, and HTTP status codes
 * across all API routes in the HR Command Center.
 */

import { NextResponse } from 'next/server';

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  success: false;
  error: string;
  details?: string | Record<string, any>;
  timestamp: string;
  path?: string;
}

/**
 * Standard success response structure
 */
export interface SuccessResponse<T = any> {
  success: true;
  data?: T;
  message?: string;
  timestamp: string;
}

/**
 * HTTP Status Codes
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Common error types for better categorization
 */
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}

/**
 * Structured error logging
 */
export function logError(
  error: Error | unknown,
  context: {
    endpoint: string;
    method?: string;
    userId?: string;
    requestBody?: any;
  }
): void {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error(
    JSON.stringify(
      {
        timestamp,
        level: 'ERROR',
        endpoint: context.endpoint,
        method: context.method || 'UNKNOWN',
        userId: context.userId || 'ANONYMOUS',
        error: errorMessage,
        stack: errorStack,
        requestBody: context.requestBody
          ? JSON.stringify(context.requestBody).substring(0, 500)
          : undefined,
      },
      null,
      2
    )
  );
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: string,
  statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
  details?: string | Record<string, any>,
  path?: string
): NextResponse<ErrorResponse> {
  const response: ErrorResponse = {
    success: false,
    error,
    details,
    timestamp: new Date().toISOString(),
    path,
  };

  return NextResponse.json(response, { status: statusCode });
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(
  data?: T,
  message?: string,
  statusCode: number = HttpStatus.OK
): NextResponse<SuccessResponse<T>> {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response, { status: statusCode });
}

/**
 * Handle errors in API routes with automatic logging and response formatting
 */
export function handleApiError(
  error: Error | unknown,
  context: {
    endpoint: string;
    method?: string;
    userId?: string;
    requestBody?: any;
  }
): NextResponse<ErrorResponse> {
  // Log the error with context
  logError(error, context);

  // Determine error type and status code
  let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
  let errorMessage = 'An unexpected error occurred';
  let details: string | undefined;

  if (error instanceof Error) {
    errorMessage = error.message;
    details = process.env.NODE_ENV === 'development' ? error.stack : undefined;

    // Map common error patterns to appropriate status codes
    if (error.message.includes('not found') || error.message.includes('does not exist')) {
      statusCode = HttpStatus.NOT_FOUND;
    } else if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      statusCode = HttpStatus.CONFLICT;
    } else if (error.message.includes('invalid') || error.message.includes('required')) {
      statusCode = HttpStatus.BAD_REQUEST;
    } else if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
      statusCode = HttpStatus.UNAUTHORIZED;
    } else if (error.message.includes('forbidden') || error.message.includes('permission')) {
      statusCode = HttpStatus.FORBIDDEN;
    }
  }

  return createErrorResponse(errorMessage, statusCode, details, context.endpoint);
}

/**
 * Validation error helper
 */
export function validationError(
  message: string,
  details?: Record<string, any>
): NextResponse<ErrorResponse> {
  return createErrorResponse(message, HttpStatus.BAD_REQUEST, details);
}

/**
 * Not found error helper
 */
export function notFoundError(resource: string = 'Resource'): NextResponse<ErrorResponse> {
  return createErrorResponse(`${resource} not found`, HttpStatus.NOT_FOUND);
}

/**
 * Unauthorized error helper
 */
export function unauthorizedError(
  message: string = 'Authentication required'
): NextResponse<ErrorResponse> {
  return createErrorResponse(message, HttpStatus.UNAUTHORIZED);
}

/**
 * Forbidden error helper
 */
export function forbiddenError(
  message: string = 'Insufficient permissions'
): NextResponse<ErrorResponse> {
  return createErrorResponse(message, HttpStatus.FORBIDDEN);
}

/**
 * Conflict error helper
 */
export function conflictError(message: string): NextResponse<ErrorResponse> {
  return createErrorResponse(message, HttpStatus.CONFLICT);
}

/**
 * Internal server error helper
 */
export function internalError(
  message: string = 'Internal server error'
): NextResponse<ErrorResponse> {
  return createErrorResponse(message, HttpStatus.INTERNAL_SERVER_ERROR);
}
