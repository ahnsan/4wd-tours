'use client';

/**
 * Tour Page Error Boundary Component
 *
 * Specialized error boundary for tour detail pages that:
 * - Catches errors in tour rendering components
 * - Shows user-friendly tour-specific error messages
 * - Logs tour-specific context for debugging
 * - Provides recovery options (back to tours, reload)
 * - Prevents 500 errors from crashing the page
 */

import React, { Component, ReactNode } from 'react';
import { ErrorLogger } from '@/lib/utils/errorLogger';

interface Props {
  children: ReactNode;
  tourHandle?: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class TourPageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error with tour-specific context
    ErrorLogger.error(
      'Tour page rendering error',
      error,
      {
        tourHandle: this.props.tourHandle,
        componentStack: errorInfo.componentStack,
        errorBoundary: 'TourPageErrorBoundary',
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      }
    );

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Update state
    this.setState({
      errorInfo,
    });
  }

  handleBackToTours = (): void => {
    if (typeof window !== 'undefined') {
      window.location.href = '/tours';
    }
  };

  handleReload = (): void => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Tour-specific error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              {/* Error Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              {/* Error Title */}
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Unable to Load Tour
              </h1>

              {/* Error Description */}
              <p className="text-lg text-gray-600 mb-6">
                We encountered a problem loading this tour page.
                This could be due to missing information or a temporary issue.
              </p>

              {/* Tour Handle Info */}
              {this.props.tourHandle && (
                <div className="mb-6 p-4 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-700">
                    <strong>Tour:</strong>{' '}
                    <code className="bg-gray-200 px-2 py-1 rounded">
                      {this.props.tourHandle}
                    </code>
                  </p>
                </div>
              )}

              {/* Development Mode Details */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 text-left">
                  <details className="bg-red-50 rounded-md p-4 border border-red-200">
                    <summary className="cursor-pointer font-medium text-gray-900 mb-2">
                      Error Details (Development Only)
                    </summary>
                    <div className="text-sm text-gray-700 space-y-3">
                      <div>
                        <strong className="text-red-700">Error Type:</strong>
                        <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto border border-red-200">
                          {this.state.error.name}
                        </pre>
                      </div>
                      <div>
                        <strong className="text-red-700">Error Message:</strong>
                        <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto border border-red-200">
                          {this.state.error.message}
                        </pre>
                      </div>
                      {this.state.error.stack && (
                        <div>
                          <strong className="text-red-700">Stack Trace:</strong>
                          <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto whitespace-pre-wrap border border-red-200 max-h-64 overflow-y-auto">
                            {this.state.error.stack}
                          </pre>
                        </div>
                      )}
                      {this.state.errorInfo?.componentStack && (
                        <div>
                          <strong className="text-red-700">Component Stack:</strong>
                          <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto whitespace-pre-wrap border border-red-200 max-h-64 overflow-y-auto">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
                <button
                  onClick={this.handleBackToTours}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Back to All Tours
                </button>
                <button
                  onClick={this.handleReload}
                  className="px-6 py-3 bg-gray-200 text-gray-900 rounded-md hover:bg-gray-300 transition-colors font-medium"
                >
                  Reload Page
                </button>
                {process.env.NODE_ENV === 'development' && (
                  <button
                    onClick={this.handleReset}
                    className="px-6 py-3 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors font-medium"
                  >
                    Try Again (Dev)
                  </button>
                )}
              </div>

              {/* Support Info */}
              <div className="text-sm text-gray-500 space-y-2">
                <p>
                  If this problem continues, please{' '}
                  <a
                    href="/contact"
                    className="text-blue-600 hover:text-blue-700 underline font-medium"
                  >
                    contact our support team
                  </a>
                </p>
                <p className="text-xs text-gray-400">
                  Error ID: {Date.now().toString(36)}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC to wrap tour components with error boundary
 */
export function withTourErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  tourHandle?: string
): React.FC<P> {
  return function WithTourErrorBoundary(props: P) {
    return (
      <TourPageErrorBoundary tourHandle={tourHandle}>
        <Component {...props} />
      </TourPageErrorBoundary>
    );
  };
}
