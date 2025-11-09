/**
 * Centralized Error Handling Utility
 * Provides consistent error handling across the application
 */

import type { MedusaResponse } from "@medusajs/framework/http"

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'APIError'
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends APIError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends APIError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`
    super(message, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends APIError {
  constructor(message: string, details?: unknown) {
    super(message, 409, 'CONFLICT', details)
    this.name = 'ConflictError'
  }
}

export class UnauthorizedError extends APIError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends APIError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
    this.name = 'ForbiddenError'
  }
}

/**
 * Handle API errors and send appropriate response
 */
export function handleAPIError(error: unknown, res: MedusaResponse): void {
  // Handle known API errors
  if (error instanceof APIError) {
    res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
      details: error.details,
    })
    return
  }

  // Handle PostgreSQL errors
  if (isPostgresError(error)) {
    handlePostgresError(error, res)
    return
  }

  // Handle generic errors
  if (error instanceof Error) {
    // Log the full error for debugging
    console.error('Unexpected error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })

    res.status(500).json({
      error: 'An unexpected error occurred',
      code: 'INTERNAL_SERVER_ERROR',
    })
    return
  }

  // Handle unknown errors
  console.error('Unknown error type:', error)
  res.status(500).json({
    error: 'An unknown error occurred',
    code: 'UNKNOWN_ERROR',
  })
}

/**
 * Check if error is a PostgreSQL error
 */
function isPostgresError(error: unknown): error is { code: string; message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  )
}

/**
 * Handle PostgreSQL-specific errors
 */
function handlePostgresError(error: { code: string; message: string }, res: MedusaResponse): void {
  switch (error.code) {
    case '23505': // Unique constraint violation
      res.status(409).json({
        error: 'A record with this value already exists',
        code: 'DUPLICATE_ENTRY',
      })
      break

    case '23503': // Foreign key violation
      res.status(400).json({
        error: 'Referenced record does not exist',
        code: 'FOREIGN_KEY_VIOLATION',
      })
      break

    case '23502': // Not null violation
      res.status(400).json({
        error: 'Required field is missing',
        code: 'NOT_NULL_VIOLATION',
      })
      break

    default:
      console.error('PostgreSQL error:', error)
      res.status(500).json({
        error: 'Database operation failed',
        code: 'DATABASE_ERROR',
      })
  }
}

/**
 * Safely extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'Unknown error occurred'
}

/**
 * Type guard for checking if value is an Error
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error
}
