/**
 * API Helper Utilities
 *
 * Centralized exports for all API helper functions including
 * error handling, validation, and response formatting.
 */

// Error handling
export {
  conflictError,
  createErrorResponse,
  createSuccessResponse,
  type ErrorResponse,
  ErrorType,
  forbiddenError,
  HttpStatus,
  handleApiError,
  internalError,
  logError,
  notFoundError,
  type SuccessResponse,
  unauthorizedError,
  validationError,
} from './error-handler';

// Validation
export {
  getQueryParam,
  isNonNegativeNumber,
  isOneOf,
  isPositiveNumber,
  isValidArray,
  isValidDate,
  isValidEmail,
  isValidEmployeeId,
  parseRequestBody,
  sanitizeString,
  validatePaginationParams,
  validateRequiredFields,
  validateSortParams,
} from './validation';
