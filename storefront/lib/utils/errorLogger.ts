/**
 * Error Logger Utility
 *
 * Comprehensive error logging system for tracking and reporting errors across the application.
 * Supports console logging (development) and server logging (production).
 */

interface ErrorLogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  context?: Record<string, any>;
  url?: string;
  userId?: string;
}

interface ErrorDeduplicationEntry {
  message: string;
  timestamp: number;
  count: number;
}

class ErrorLoggerClass {
  private static instance: ErrorLoggerClass;
  private errorCache: Map<string, ErrorDeduplicationEntry> = new Map();
  private readonly DEDUPLICATION_WINDOW = 60000; // 1 minute
  private readonly MAX_CACHE_SIZE = 100;

  private constructor() {
    // Private constructor for singleton pattern
  }

  static getInstance(): ErrorLoggerClass {
    if (!ErrorLoggerClass.instance) {
      ErrorLoggerClass.instance = new ErrorLoggerClass();
    }
    return ErrorLoggerClass.instance;
  }

  /**
   * Main logging method
   */
  log(entry: ErrorLogEntry): void {
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Check for duplicate errors
    if (entry.level === 'error' && this.isDuplicateError(entry.message)) {
      return;
    }

    // Always log to console
    this.logToConsole(entry);

    // Log to server in production or if explicitly enabled
    if (!isDevelopment || process.env.NEXT_PUBLIC_ENABLE_ERROR_LOGGING === 'true') {
      this.logToServer(entry).catch((err) => {
        console.error('Failed to log error to server:', err);
      });
    }
  }

  /**
   * Log error with full context
   */
  error(message: string, error: Error, context?: any): void {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      stack: error.stack,
      context: {
        ...context,
        errorName: error.name,
        errorMessage: error.message,
      },
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    this.log(entry);
  }

  /**
   * Log warning
   */
  warn(message: string, context?: any): void {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      context,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    this.log(entry);
  }

  /**
   * Log info
   */
  info(message: string, context?: any): void {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      context,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    this.log(entry);
  }

  /**
   * Log to console with formatting
   */
  logToConsole(entry: ErrorLogEntry): void {
    const styles = {
      error: 'color: #ff4444; font-weight: bold',
      warn: 'color: #ffaa00; font-weight: bold',
      info: 'color: #4444ff; font-weight: bold',
    };

    const prefix = `[${entry.level.toUpperCase()}] ${entry.timestamp}`;

    console.group(`%c${prefix}`, styles[entry.level]);
    console.log('Message:', entry.message);

    if (entry.stack) {
      console.log('Stack:', entry.stack);
    }

    if (entry.context) {
      console.log('Context:', entry.context);
    }

    if (entry.url) {
      console.log('URL:', entry.url);
    }

    console.groupEnd();
  }

  /**
   * Log to server endpoint
   */
  async logToServer(entry: ErrorLogEntry): Promise<void> {
    try {
      // Only log errors and warnings to server
      if (entry.level === 'info') {
        return;
      }

      const response = await fetch('/api/log-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        throw new Error(`Server logging failed with status: ${response.status}`);
      }
    } catch (error) {
      // Silently fail - don't create infinite loop
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to log to server:', error);
      }
    }
  }

  /**
   * Capture React page errors
   */
  capturePageError(error: Error, errorInfo: any): void {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: `React Error: ${error.message}`,
      stack: error.stack,
      context: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      },
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    this.log(entry);
  }

  /**
   * Check if error is duplicate within deduplication window
   */
  private isDuplicateError(message: string): boolean {
    const now = Date.now();
    const existing = this.errorCache.get(message);

    if (existing) {
      const timeDiff = now - existing.timestamp;

      if (timeDiff < this.DEDUPLICATION_WINDOW) {
        // Update count for duplicate error
        existing.count++;
        return true;
      } else {
        // Outside window, reset
        this.errorCache.set(message, {
          message,
          timestamp: now,
          count: 1,
        });
        return false;
      }
    }

    // New error
    this.errorCache.set(message, {
      message,
      timestamp: now,
      count: 1,
    });

    // Cleanup old entries if cache is too large
    this.cleanupCache();

    return false;
  }

  /**
   * Clean up old cache entries
   */
  private cleanupCache(): void {
    if (this.errorCache.size <= this.MAX_CACHE_SIZE) {
      return;
    }

    const now = Date.now();
    const entriesToDelete: string[] = [];

    this.errorCache.forEach((entry, key) => {
      if (now - entry.timestamp > this.DEDUPLICATION_WINDOW) {
        entriesToDelete.push(key);
      }
    });

    entriesToDelete.forEach(key => this.errorCache.delete(key));

    // If still too large, remove oldest entries
    if (this.errorCache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.errorCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toRemove = entries.slice(0, this.errorCache.size - this.MAX_CACHE_SIZE);
      toRemove.forEach(([key]) => this.errorCache.delete(key));
    }
  }
}

// Export singleton instance
export const ErrorLogger = ErrorLoggerClass.getInstance();

// Export types
export type { ErrorLogEntry };
