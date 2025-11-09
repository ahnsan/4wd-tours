/**
 * Structured Logging Utility
 * Provides consistent logging across the application
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  stack?: string
}

class Logger {
  private isDevelopment: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production'
  }

  /**
   * Format log entry as JSON
   */
  private formatLog(level: LogLevel, message: string, context?: LogContext, error?: Error): string {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    }

    if (context && Object.keys(context).length > 0) {
      entry.context = context
    }

    if (error) {
      entry.stack = error.stack
    }

    return JSON.stringify(entry)
  }

  /**
   * Log debug message (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatLog('debug', message, context))
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    console.log(this.formatLog('info', message, context))
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    console.warn(this.formatLog('warn', message, context))
  }

  /**
   * Log error message
   */
  error(message: string, contextOrError?: LogContext | Error, maybeError?: Error): void {
    let context: LogContext | undefined
    let error: Error | undefined

    if (contextOrError instanceof Error) {
      error = contextOrError
    } else {
      context = contextOrError
      error = maybeError
    }

    console.error(this.formatLog('error', message, context, error))
  }

  /**
   * Create a child logger with predefined context
   */
  child(defaultContext: LogContext): Logger {
    const childLogger = new Logger()
    const originalMethods = {
      debug: childLogger.debug.bind(childLogger),
      info: childLogger.info.bind(childLogger),
      warn: childLogger.warn.bind(childLogger),
      error: childLogger.error.bind(childLogger),
    }

    childLogger.debug = (message: string, context?: LogContext) => {
      originalMethods.debug(message, { ...defaultContext, ...context })
    }

    childLogger.info = (message: string, context?: LogContext) => {
      originalMethods.info(message, { ...defaultContext, ...context })
    }

    childLogger.warn = (message: string, context?: LogContext) => {
      originalMethods.warn(message, { ...defaultContext, ...context })
    }

    childLogger.error = (message: string, contextOrError?: LogContext | Error, maybeError?: Error) => {
      if (contextOrError instanceof Error) {
        originalMethods.error(message, { ...defaultContext }, contextOrError)
      } else {
        originalMethods.error(message, { ...defaultContext, ...contextOrError }, maybeError)
      }
    }

    return childLogger
  }
}

// Export singleton instance
export const logger = new Logger()

// Export types
export type { LogLevel, LogContext }
