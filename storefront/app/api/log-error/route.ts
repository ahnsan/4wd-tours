/**
 * Error Logging API Route
 *
 * Accepts POST requests with error data and logs them.
 * Includes rate limiting to prevent spam.
 */

import { NextRequest, NextResponse } from 'next/server';

interface ErrorLogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  context?: Record<string, any>;
  url?: string;
  userId?: string;
}

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

/**
 * Check if request is rate limited
 */
function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return false;
  }

  if (now > record.resetTime) {
    // Reset window
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return false;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  record.count++;
  return false;
}

/**
 * Cleanup old rate limit entries
 */
function cleanupRateLimitMap(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];

  rateLimitMap.forEach((value, key) => {
    if (now > value.resetTime) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach(key => rateLimitMap.delete(key));
}

/**
 * Validate error log entry
 */
function validateErrorEntry(data: any): data is ErrorLogEntry {
  if (!data || typeof data !== 'object') {
    return false;
  }

  if (!data.timestamp || typeof data.timestamp !== 'string') {
    return false;
  }

  if (!data.level || !['error', 'warn', 'info'].includes(data.level)) {
    return false;
  }

  if (!data.message || typeof data.message !== 'string') {
    return false;
  }

  return true;
}

/**
 * Format error for logging
 */
function formatErrorLog(entry: ErrorLogEntry): string {
  const parts = [
    `[${entry.level.toUpperCase()}]`,
    entry.timestamp,
    entry.message,
  ];

  if (entry.url) {
    parts.push(`URL: ${entry.url}`);
  }

  if (entry.userId) {
    parts.push(`User: ${entry.userId}`);
  }

  if (entry.stack) {
    parts.push(`Stack: ${entry.stack}`);
  }

  if (entry.context) {
    parts.push(`Context: ${JSON.stringify(entry.context)}`);
  }

  return parts.join(' | ');
}

/**
 * POST handler for error logging
 */
export async function POST(request: NextRequest) {
  try {
    // Get client identifier for rate limiting (IP address)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip: string = (forwardedFor?.split(',')[0] ?? 'unknown');

    // Check rate limit
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate error entry
    if (!validateErrorEntry(body)) {
      return NextResponse.json(
        { error: 'Invalid error log entry' },
        { status: 400 }
      );
    }

    const entry: ErrorLogEntry = body;

    // Log to console (in production, this would go to your logging service)
    console.log(formatErrorLog(entry));

    // In production, you would send this to:
    // - Cloud logging service (CloudWatch, Stackdriver, etc.)
    // - Error tracking service (Sentry, Rollbar, etc.)
    // - Database for analytics
    // - File system for persistent logging

    // Example: Write to file (disabled by default)
    if (process.env.ENABLE_FILE_LOGGING === 'true') {
      await logToFile(entry);
    }

    // Example: Send to external service
    if (process.env.ERROR_LOGGING_WEBHOOK_URL) {
      await logToWebhook(entry, process.env.ERROR_LOGGING_WEBHOOK_URL);
    }

    // Cleanup rate limit map periodically
    if (Math.random() < 0.1) {
      // 10% chance
      cleanupRateLimitMap();
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error logging API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Log error to file (optional)
 */
async function logToFile(entry: ErrorLogEntry): Promise<void> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');

    const logDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logDir, `errors-${new Date().toISOString().split('T')[0]}.log`);

    // Ensure log directory exists
    try {
      await fs.mkdir(logDir, { recursive: true });
    } catch (err) {
      // Directory might already exist
    }

    // Append to log file
    const logLine = formatErrorLog(entry) + '\n';
    await fs.appendFile(logFile, logLine);
  } catch (error) {
    console.error('Failed to write error to file:', error);
  }
}

/**
 * Send error to webhook (optional)
 */
async function logToWebhook(entry: ErrorLogEntry, webhookUrl: string): Promise<void> {
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });
  } catch (error) {
    console.error('Failed to send error to webhook:', error);
  }
}

/**
 * GET handler - return method not allowed
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
