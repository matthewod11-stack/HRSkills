/**
 * API Helper Utilities
 *
 * Centralized exports for all API helper functions including
 * error handling, validation, and response formatting.
 */

// Error handling
export {
  createErrorResponse,
  createSuccessResponse,
  handleApiError,
  logError,
  validationError,
  notFoundError,
  unauthorizedError,
  forbiddenError,
  conflictError,
  internalError,
  HttpStatus,
  ErrorType,
  type ErrorResponse,
  type SuccessResponse,
} from './error-handler';

// Validation
export {
  validateRequiredFields,
  isValidEmail,
  isPositiveNumber,
  isNonNegativeNumber,
  isValidArray,
  isValidDate,
  isOneOf,
  parseRequestBody,
  getQueryParam,
  isValidEmployeeId,
  sanitizeString,
  validatePaginationParams,
  validateSortParams,
} from './validation';
