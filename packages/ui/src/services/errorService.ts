/**
 * Unified Error Service
 *
 * Provides structured error logging and user-facing error notifications.
 * This service centralizes error handling across all VariScout apps.
 */

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface ErrorContext {
  /** Component or module where the error occurred */
  component?: string;
  /** Action being performed when the error occurred */
  action?: string;
  /** Additional metadata for debugging */
  metadata?: Record<string, unknown>;
}

export interface ErrorLogEntry {
  timestamp: string;
  severity: ErrorSeverity;
  message: string;
  error?: Error;
  context?: ErrorContext;
}

/** Callback type for error notifications */
export type ErrorNotificationHandler = (message: string, severity: ErrorSeverity) => void;

/** Max number of errors to keep in memory */
const MAX_ERROR_LOG_SIZE = 100;

class ErrorService {
  private errorLog: ErrorLogEntry[] = [];
  private notificationHandler: ErrorNotificationHandler | null = null;

  /**
   * Set the notification handler for user-facing error messages
   * This is typically set by the app's notification system (toast, snackbar, etc.)
   */
  setNotificationHandler(handler: ErrorNotificationHandler): void {
    this.notificationHandler = handler;
  }

  /**
   * Log an error with optional context
   * This is for internal logging, not for showing to users
   */
  logError(error: Error, context?: ErrorContext): void {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      severity: 'error',
      message: error.message,
      error,
      context,
    };

    this.addToLog(entry);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorService]', error.message, context);
    }
  }

  /**
   * Log a warning message
   */
  logWarning(message: string, context?: ErrorContext): void {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      severity: 'warning',
      message,
      context,
    };

    this.addToLog(entry);

    if (process.env.NODE_ENV === 'development') {
      console.warn('[ErrorService]', message, context);
    }
  }

  /**
   * Log an info message
   */
  logInfo(message: string, context?: ErrorContext): void {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      severity: 'info',
      message,
      context,
    };

    this.addToLog(entry);

    if (process.env.NODE_ENV === 'development') {
      console.info('[ErrorService]', message, context);
    }
  }

  /**
   * Show an error message to the user
   * Uses the notification handler if set, falls back to console
   */
  showUserError(message: string): void {
    if (this.notificationHandler) {
      this.notificationHandler(message, 'error');
    } else if (process.env.NODE_ENV === 'development') {
      console.error('[User Error]', message);
    }
  }

  /**
   * Show a warning message to the user
   */
  showUserWarning(message: string): void {
    if (this.notificationHandler) {
      this.notificationHandler(message, 'warning');
    } else if (process.env.NODE_ENV === 'development') {
      console.warn('[User Warning]', message);
    }
  }

  /**
   * Show an info message to the user
   */
  showUserInfo(message: string): void {
    if (this.notificationHandler) {
      this.notificationHandler(message, 'info');
    } else if (process.env.NODE_ENV === 'development') {
      console.info('[User Info]', message);
    }
  }

  /**
   * Capture an exception for future error tracking integration
   * Currently logs locally, but can be extended to send to error tracking services
   */
  captureException(error: Error, context?: ErrorContext): void {
    this.logError(error, context);

    // Future: integrate with error tracking services like Sentry
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error, { extra: context });
    // }
  }

  /**
   * Get the error log (useful for debugging)
   */
  getErrorLog(): ErrorLogEntry[] {
    return [...this.errorLog];
  }

  /**
   * Clear the error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Handle an error from an ErrorBoundary
   * This method is designed to be called from React error boundaries
   */
  handleBoundaryError(error: Error, errorInfo: { componentStack?: string }): void {
    this.captureException(error, {
      component: 'ErrorBoundary',
      metadata: {
        componentStack: errorInfo.componentStack,
      },
    });
  }

  private addToLog(entry: ErrorLogEntry): void {
    this.errorLog.push(entry);

    // Keep log size bounded
    if (this.errorLog.length > MAX_ERROR_LOG_SIZE) {
      this.errorLog = this.errorLog.slice(-MAX_ERROR_LOG_SIZE);
    }
  }
}

// Singleton instance
export const errorService = new ErrorService();
