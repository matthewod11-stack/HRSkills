import { ErrorInfo } from 'react';

/**
 * Error severity levels for categorization and prioritization
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Error context information for better debugging
 */
export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp?: string;
  url?: string;
  userAgent?: string;
  additionalData?: Record<string, unknown>;
}

/**
 * Structured error log entry
 */
export interface ErrorLog {
  error: Error;
  errorInfo?: ErrorInfo;
  severity: ErrorSeverity;
  context: ErrorContext;
}

/**
 * Error logging service class
 * Handles error collection, formatting, and forwarding to monitoring services
 */
class ErrorLoggingService {
  private isProduction: boolean;
  private logs: ErrorLog[] = [];

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  /**
   * Log an error with context and severity
   */
  logError(
    error: Error,
    errorInfo?: ErrorInfo,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: Partial<ErrorContext> = {}
  ): void {
    const enrichedContext: ErrorContext = {
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      ...context,
    };

    const errorLog: ErrorLog = {
      error,
      errorInfo,
      severity,
      context: enrichedContext,
    };

    // Store in memory (last 100 errors)
    this.logs.push(errorLog);
    if (this.logs.length > 100) {
      this.logs.shift();
    }

    // Log to console in development
    if (!this.isProduction) {
      this.logToConsole(errorLog);
    }

    // Send to monitoring service in production
    if (this.isProduction) {
      this.sendToMonitoringService(errorLog);
    }

    // Always log critical errors
    if (severity === ErrorSeverity.CRITICAL) {
      this.handleCriticalError(errorLog);
    }
  }

  /**
   * Console logging with color coding
   */
  private logToConsole(errorLog: ErrorLog): void {
    const { error, errorInfo, severity, context } = errorLog;

    const colors = {
      [ErrorSeverity.LOW]: '#3b82f6', // blue
      [ErrorSeverity.MEDIUM]: '#f59e0b', // orange
      [ErrorSeverity.HIGH]: '#ef4444', // red
      [ErrorSeverity.CRITICAL]: '#dc2626', // dark red
    };

    console.group(
      `%c[${severity.toUpperCase()}] Error in ${context.component || 'Unknown Component'}`,
      `color: ${colors[severity]}; font-weight: bold;`
    );
    console.error('Error:', error);
    if (errorInfo) {
      console.error('Component Stack:', errorInfo.componentStack);
    }
    console.log('Context:', context);
    console.groupEnd();
  }

  /**
   * Send error to external monitoring service
   * TODO: Integrate with Sentry, LogRocket, Datadog, etc.
   */
  private sendToMonitoringService(errorLog: ErrorLog): void {
    // Example integration structure:
    //
    // if (window.Sentry) {
    //   window.Sentry.captureException(errorLog.error, {
    //     level: this.mapSeverityToSentryLevel(errorLog.severity),
    //     contexts: {
    //       react: {
    //         componentStack: errorLog.errorInfo?.componentStack
    //       },
    //       custom: errorLog.context
    //     }
    //   });
    // }

    // Placeholder: Log that we would send to monitoring service
    console.log('[ErrorLogging] Would send to monitoring service:', {
      message: errorLog.error.message,
      severity: errorLog.severity,
      component: errorLog.context.component,
    });
  }

  /**
   * Handle critical errors with immediate notification
   */
  private handleCriticalError(errorLog: ErrorLog): void {
    // In production, this could:
    // 1. Send immediate Slack/email notification
    // 2. Create incident ticket
    // 3. Trigger alerting system

    console.error('[CRITICAL ERROR]', errorLog);

    // Example: Send to alert endpoint
    // fetch('/api/alerts/critical', {
    //   method: 'POST',
    //   body: JSON.stringify(errorLog)
    // });
  }

  /**
   * Get recent error logs (useful for support/debugging)
   */
  getRecentLogs(count: number = 10): ErrorLog[] {
    return this.logs.slice(-count);
  }

  /**
   * Clear error logs
   */
  clearLogs(): void {
    this.logs = [];
  }
}

// Export singleton instance
export const errorLogger = new ErrorLoggingService();

/**
 * Convenience function to log errors from ErrorBoundary
 */
export function logComponentError(
  error: Error,
  errorInfo: ErrorInfo,
  componentName?: string
): void {
  errorLogger.logError(error, errorInfo, ErrorSeverity.HIGH, {
    component: componentName,
    action: 'component_render',
  });
}

/**
 * Log API/fetch errors
 */
export function logApiError(error: Error, endpoint: string, method: string = 'GET'): void {
  errorLogger.logError(error, undefined, ErrorSeverity.MEDIUM, {
    action: 'api_call',
    additionalData: { endpoint, method },
  });
}

/**
 * Log user action errors
 */
export function logUserActionError(
  error: Error,
  action: string,
  context?: Record<string, unknown>
): void {
  errorLogger.logError(error, undefined, ErrorSeverity.LOW, {
    action,
    additionalData: context,
  });
}
