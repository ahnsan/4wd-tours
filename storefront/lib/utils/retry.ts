/**
 * Retry Utility for Medusa Payment Operations
 *
 * Implements exponential backoff retry logic for payment operations
 * with Medusa v2-specific idempotency guarantees and safety checks.
 *
 * CRITICAL REQUIREMENTS:
 * - Maximum 3 retry attempts with exponential backoff
 * - Only retry on network errors (NOT 4xx validation/client errors)
 * - Idempotent operations - safe to retry without duplicate charges
 * - Detailed telemetry logging for monitoring and debugging
 *
 * Medusa v2 Idempotency Guarantees:
 * - Payment collections: Can be created multiple times for same cart (checks existence first)
 * - Payment sessions: Medusa handles duplicate session initialization gracefully
 * - Cart completion: Medusa tracks cart state, prevents duplicate order creation
 *
 * Official Docs: https://docs.medusajs.com/resources/storefront-development/checkout/payment
 */

import { ErrorLogger } from './errorLogger';
import { isNetworkError, isClientError, isServerError, getErrorType, getErrorMessage } from './apiErrorHandler';

/**
 * Retry configuration options
 */
export interface RetryOptions {
  /**
   * Maximum number of retry attempts
   * Default: 3 (as per requirements)
   */
  maxAttempts?: number;

  /**
   * Base delay in milliseconds before first retry
   * Default: 1000ms (1 second)
   */
  baseDelay?: number;

  /**
   * Whether to use exponential backoff
   * If true: delay = baseDelay * 2^attempt
   * If false: delay = baseDelay (constant)
   * Default: true
   */
  exponential?: boolean;

  /**
   * Operation name for logging
   */
  operationName?: string;

  /**
   * Custom function to determine if error should be retried
   * Default: Only retry network errors and 5xx server errors
   */
  shouldRetry?: (error: any, attempt: number) => boolean;

  /**
   * Callback function called before each retry attempt
   */
  onRetry?: (error: any, attempt: number, delay: number) => void;

  /**
   * Callback function called when all retries are exhausted
   */
  onFailure?: (error: any, totalAttempts: number) => void;
}

/**
 * Retry result with telemetry data
 */
export interface RetryResult<T> {
  /**
   * The successful result from the operation
   */
  data: T;

  /**
   * Total number of attempts made (including initial attempt)
   */
  attempts: number;

  /**
   * Total time taken in milliseconds
   */
  totalTime: number;

  /**
   * Whether any retries were performed
   */
  retriesPerformed: boolean;

  /**
   * Errors encountered during retries
   */
  errors: Array<{
    attempt: number;
    error: any;
    errorType: string;
    timestamp: number;
  }>;
}

/**
 * Default retry predicate - only retry on network and server errors
 * DO NOT retry on client errors (4xx) as these are validation/business logic errors
 */
function defaultShouldRetry(error: any, attempt: number): boolean {
  // Never retry on client errors (4xx) - these are validation errors
  if (isClientError(error)) {
    return false;
  }

  // Retry on network errors (connection failures, timeouts)
  if (isNetworkError(error)) {
    return true;
  }

  // Retry on server errors (5xx) - these are transient backend issues
  if (isServerError(error)) {
    return true;
  }

  // Don't retry on unknown errors
  return false;
}

/**
 * Execute a function with exponential backoff retry logic
 *
 * SAFETY GUARANTEES:
 * - Only retries network and server errors (5xx)
 * - Never retries validation errors (4xx) to prevent duplicate charges
 * - Implements exponential backoff to reduce backend load
 * - Provides detailed telemetry for monitoring
 *
 * @param fn - Async function to execute with retry logic
 * @param options - Retry configuration options
 * @returns Promise with the result and telemetry data
 *
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   () => createPaymentCollectionForCart(cartId),
 *   {
 *     operationName: 'Create Payment Collection',
 *     maxAttempts: 3,
 *     baseDelay: 1000
 *   }
 * );
 * console.log(`Operation completed in ${result.attempts} attempts`);
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    exponential = true,
    operationName = 'Operation',
    shouldRetry = defaultShouldRetry,
    onRetry,
    onFailure
  } = options;

  const startTime = Date.now();
  const errors: RetryResult<T>['errors'] = [];
  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Log attempt
      if (attempt === 1) {
        ErrorLogger.info(`[Retry] Starting ${operationName} (attempt 1/${maxAttempts})`);
      } else {
        ErrorLogger.info(`[Retry] Retrying ${operationName} (attempt ${attempt}/${maxAttempts})`);
      }

      // Execute the function
      const data = await fn();

      // Success!
      const totalTime = Date.now() - startTime;
      const retriesPerformed = attempt > 1;

      if (retriesPerformed) {
        ErrorLogger.info(
          `[Retry] ${operationName} succeeded after ${attempt} attempts in ${totalTime}ms`,
          { attempts: attempt, totalTime, errors: errors.length }
        );
      } else {
        ErrorLogger.info(
          `[Retry] ${operationName} succeeded on first attempt in ${totalTime}ms`
        );
      }

      return {
        data,
        attempts: attempt,
        totalTime,
        retriesPerformed,
        errors
      };

    } catch (error) {
      lastError = error;
      const errorType = getErrorType(error);
      const errorMessage = getErrorMessage(error);

      // Record error for telemetry
      errors.push({
        attempt,
        error,
        errorType,
        timestamp: Date.now()
      });

      // Log error details
      ErrorLogger.error(
        `[Retry] ${operationName} failed on attempt ${attempt}/${maxAttempts}: ${errorMessage}`,
        error instanceof Error ? error : new Error(String(error)),
        {
          attempt,
          maxAttempts,
          errorType,
          errorMessage,
          willRetry: attempt < maxAttempts && shouldRetry(error, attempt)
        }
      );

      // Check if we should retry
      const canRetry = attempt < maxAttempts;
      const willRetry = canRetry && shouldRetry(error, attempt);

      if (!willRetry) {
        if (!canRetry) {
          // Exhausted all retries
          ErrorLogger.error(
            `[Retry] ${operationName} failed after ${attempt} attempts`,
            error instanceof Error ? error : new Error(String(error)),
            { attempts: attempt, totalTime: Date.now() - startTime, errors: errors.length }
          );
          onFailure?.(error, attempt);
        } else {
          // Error is not retryable (e.g., validation error)
          ErrorLogger.warn(
            `[Retry] ${operationName} failed with non-retryable error: ${errorType}`,
            { attempt, errorType, errorMessage }
          );
        }
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = exponential
        ? baseDelay * Math.pow(2, attempt - 1)
        : baseDelay;

      // Log retry details
      ErrorLogger.info(
        `[Retry] Waiting ${delay}ms before retry ${attempt + 1}/${maxAttempts}`,
        { delay, nextAttempt: attempt + 1, errorType }
      );

      // Call onRetry callback
      onRetry?.(error, attempt, delay);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError;
}

/**
 * Wrapper for Medusa payment collection creation with retry logic
 *
 * IDEMPOTENCY GUARANTEE:
 * - Medusa v2 allows checking if payment collection exists before creation
 * - Our implementation in cart-service.ts checks for existing payment collection
 * - Safe to retry - will reuse existing collection if already created
 *
 * @param fn - Function that creates payment collection
 * @param cartId - Cart ID for logging purposes
 * @returns Promise with result and telemetry
 */
export async function retryPaymentCollectionCreation<T>(
  fn: () => Promise<T>,
  cartId: string
): Promise<RetryResult<T>> {
  return retryWithBackoff(fn, {
    operationName: `Create Payment Collection for cart ${cartId}`,
    maxAttempts: 3,
    baseDelay: 1000,
    exponential: true,
    onRetry: (error, attempt, delay) => {
      ErrorLogger.info(
        `[Payment Collection] Retrying creation for cart ${cartId} after ${delay}ms`,
        { cartId, attempt, delay, errorType: getErrorType(error) }
      );
    },
    onFailure: (error, attempts) => {
      ErrorLogger.error(
        `[Payment Collection] Failed to create payment collection for cart ${cartId} after ${attempts} attempts`,
        error,
        { cartId, attempts }
      );
    }
  });
}

/**
 * Wrapper for Medusa payment session initialization with retry logic
 *
 * IDEMPOTENCY GUARANTEE:
 * - Medusa handles duplicate payment session initialization gracefully
 * - Payment provider APIs are designed to be idempotent
 * - Safe to retry - will return existing session if already initialized
 *
 * @param fn - Function that initializes payment sessions
 * @param cartId - Cart ID for logging purposes
 * @returns Promise with result and telemetry
 */
export async function retryPaymentSessionInitialization<T>(
  fn: () => Promise<T>,
  cartId: string
): Promise<RetryResult<T>> {
  return retryWithBackoff(fn, {
    operationName: `Initialize Payment Session for cart ${cartId}`,
    maxAttempts: 3,
    baseDelay: 1000,
    exponential: true,
    onRetry: (error, attempt, delay) => {
      ErrorLogger.info(
        `[Payment Session] Retrying initialization for cart ${cartId} after ${delay}ms`,
        { cartId, attempt, delay, errorType: getErrorType(error) }
      );
    },
    onFailure: (error, attempts) => {
      ErrorLogger.error(
        `[Payment Session] Failed to initialize payment session for cart ${cartId} after ${attempts} attempts`,
        error,
        { cartId, attempts }
      );
    }
  });
}

/**
 * Wrapper for Medusa cart completion with retry logic
 *
 * IDEMPOTENCY GUARANTEE:
 * - Medusa tracks cart state and prevents duplicate order creation
 * - Cart can only be completed once (has completed_at timestamp)
 * - If cart is already completed, Medusa returns existing order
 * - Safe to retry - will not create duplicate charges or orders
 *
 * IMPORTANT: Medusa's completeCartWorkflow is idempotent by design:
 * - Checks if cart is already completed
 * - Validates payment authorization before creating order
 * - Prevents duplicate charges through payment provider idempotency
 *
 * @param fn - Function that completes cart
 * @param cartId - Cart ID for logging purposes
 * @returns Promise with result and telemetry
 */
export async function retryCartCompletion<T>(
  fn: () => Promise<T>,
  cartId: string
): Promise<RetryResult<T>> {
  return retryWithBackoff(fn, {
    operationName: `Complete Cart ${cartId}`,
    maxAttempts: 3,
    baseDelay: 1000,
    exponential: true,
    shouldRetry: (error, attempt) => {
      // Use default retry logic for network and server errors
      const shouldRetry = defaultShouldRetry(error, attempt);

      // Additional check: Don't retry if cart completion returned a cart with error
      // This indicates a business logic issue, not a transient error
      if (error.message && error.message.includes('returned a cart instead of an order')) {
        ErrorLogger.warn(
          `[Cart Completion] Cart ${cartId} completion returned cart, not retrying`,
          { cartId, errorMessage: error.message }
        );
        return false;
      }

      return shouldRetry;
    },
    onRetry: (error, attempt, delay) => {
      ErrorLogger.info(
        `[Cart Completion] Retrying completion for cart ${cartId} after ${delay}ms`,
        { cartId, attempt, delay, errorType: getErrorType(error) }
      );
    },
    onFailure: (error, attempts) => {
      ErrorLogger.error(
        `[Cart Completion] Failed to complete cart ${cartId} after ${attempts} attempts`,
        error,
        { cartId, attempts }
      );
    }
  });
}

/**
 * Test utility to simulate network failures for retry logic validation
 *
 * @param fn - Function to execute
 * @param failureCount - Number of times to fail before succeeding
 * @returns Wrapped function that fails specified number of times
 */
export function simulateNetworkFailure<T>(
  fn: () => Promise<T>,
  failureCount: number
): () => Promise<T> {
  let attempts = 0;

  return async () => {
    attempts++;
    if (attempts <= failureCount) {
      // Simulate network error
      const error: any = new Error('Simulated network failure');
      error.code = 'ECONNREFUSED';
      error.name = 'NetworkError';
      throw error;
    }
    return fn();
  };
}

/**
 * Test utility to simulate server errors (5xx) for retry logic validation
 *
 * @param fn - Function to execute
 * @param failureCount - Number of times to fail before succeeding
 * @returns Wrapped function that fails specified number of times
 */
export function simulateServerError<T>(
  fn: () => Promise<T>,
  failureCount: number
): () => Promise<T> {
  let attempts = 0;

  return async () => {
    attempts++;
    if (attempts <= failureCount) {
      // Simulate server error
      const error: any = new Error('Internal Server Error');
      error.status = 503;
      error.response = { status: 503, statusText: 'Service Unavailable' };
      throw error;
    }
    return fn();
  };
}
