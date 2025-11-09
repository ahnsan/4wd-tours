/**
 * API Error Handler
 *
 * Utilities for handling API errors across the application.
 * Provides error classification, messaging, and logging integration.
 */

import { ErrorLogger } from './errorLogger';

/**
 * Handle API errors with logging and context
 */
export async function handleApiError(error: any, context: string): Promise<void> {
  const errorMessage = getErrorMessage(error);
  const errorType = getErrorType(error);

  const errorContext = {
    context,
    errorType,
    status: error?.response?.status || error?.status,
    statusText: error?.response?.statusText || error?.statusText,
    url: error?.config?.url || error?.url,
    method: error?.config?.method || error?.method,
  };

  // Log based on error severity
  if (is404Error(error)) {
    ErrorLogger.warn(`404 Error in ${context}: ${errorMessage}`, errorContext);
  } else if (isNetworkError(error)) {
    ErrorLogger.error(`Network Error in ${context}: ${errorMessage}`, error, errorContext);
  } else if (isServerError(error)) {
    ErrorLogger.error(`Server Error in ${context}: ${errorMessage}`, error, errorContext);
  } else if (isClientError(error)) {
    ErrorLogger.warn(`Client Error in ${context}: ${errorMessage}`, errorContext);
  } else {
    ErrorLogger.error(`Unknown Error in ${context}: ${errorMessage}`, error, errorContext);
  }
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false;

  // Check for common network error indicators
  return (
    error.message?.toLowerCase().includes('network') ||
    error.message?.toLowerCase().includes('failed to fetch') ||
    error.code === 'ECONNREFUSED' ||
    error.code === 'ENOTFOUND' ||
    error.code === 'ETIMEDOUT' ||
    error.code === 'ECONNRESET' ||
    error.name === 'NetworkError' ||
    (typeof error.status === 'undefined' && error.message)
  );
}

/**
 * Check if error is a 404 error
 */
export function is404Error(error: any): boolean {
  if (!error) return false;

  return (
    error.status === 404 ||
    error.response?.status === 404 ||
    error.statusCode === 404
  );
}

/**
 * Check if error is a server error (5xx)
 */
export function isServerError(error: any): boolean {
  if (!error) return false;

  const status = error.status || error.response?.status || error.statusCode;
  return status >= 500 && status < 600;
}

/**
 * Check if error is a client error (4xx)
 */
export function isClientError(error: any): boolean {
  if (!error) return false;

  const status = error.status || error.response?.status || error.statusCode;
  return status >= 400 && status < 500;
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: any): boolean {
  if (!error) return false;

  return (
    error.status === 400 ||
    error.response?.status === 400 ||
    error.name === 'ValidationError' ||
    error.type === 'validation'
  );
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: any): boolean {
  if (!error) return false;

  return (
    error.status === 401 ||
    error.response?.status === 401 ||
    error.status === 403 ||
    error.response?.status === 403
  );
}

/**
 * Get error type classification
 */
export function getErrorType(error: any): string {
  if (isNetworkError(error)) return 'NetworkError';
  if (is404Error(error)) return 'NotFoundError';
  if (isServerError(error)) return 'ServerError';
  if (isValidationError(error)) return 'ValidationError';
  if (isAuthError(error)) return 'AuthError';
  if (isClientError(error)) return 'ClientError';
  return 'UnknownError';
}

/**
 * Extract user-friendly error message
 */
export function getErrorMessage(error: any): string {
  if (!error) return 'An unknown error occurred';

  // Check for explicit error message
  if (typeof error === 'string') {
    return error;
  }

  if (error.message) {
    return error.message;
  }

  // Check for API response error message
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  // Status-based messages
  const status = error.status || error.response?.status || error.statusCode;

  if (status === 404) {
    return 'The requested resource was not found';
  }

  if (status === 401) {
    return 'Authentication required';
  }

  if (status === 403) {
    return 'Access forbidden';
  }

  if (status === 500) {
    return 'Internal server error';
  }

  if (status === 503) {
    return 'Service temporarily unavailable';
  }

  if (isNetworkError(error)) {
    return 'Network connection failed. Please check your internet connection.';
  }

  return 'An unexpected error occurred';
}

/**
 * Get user-friendly error message for display
 */
export function getUserFriendlyMessage(error: any): string {
  const errorType = getErrorType(error);

  switch (errorType) {
    case 'NetworkError':
      return 'Unable to connect to the server. Please check your internet connection and try again.';

    case 'NotFoundError':
      return 'The requested resource could not be found.';

    case 'ServerError':
      return 'A server error occurred. Please try again later.';

    case 'ValidationError':
      return error.response?.data?.message || 'Please check your input and try again.';

    case 'AuthError':
      return 'You need to be logged in to access this resource.';

    case 'ClientError':
      return getErrorMessage(error);

    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Create standardized error response
 */
export function createErrorResponse(error: any) {
  return {
    error: true,
    message: getUserFriendlyMessage(error),
    type: getErrorType(error),
    status: error.status || error.response?.status || 500,
    details: process.env.NODE_ENV === 'development' ? {
      originalMessage: getErrorMessage(error),
      stack: error.stack,
    } : undefined,
  };
}

/**
 * Retry a failed API call with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (except 429 rate limit)
      if (isClientError(error) && !is429Error(error)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries - 1) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Check if error is a rate limit error (429)
 */
function is429Error(error: any): boolean {
  return error.status === 429 || error.response?.status === 429;
}
