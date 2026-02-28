import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { errorService } from '../../services';

/**
 * Color scheme for ErrorBoundary component
 * Allows customization for different app themes (PWA vs Azure)
 */
export interface ErrorBoundaryColorScheme {
  /** Container background class */
  container: string;
  /** Border class */
  border: string;
  /** Secondary text class */
  secondaryText: string;
  /** Button classes */
  button: string;
}

/**
 * Default color scheme using PWA semantic tokens
 */
export const defaultColorScheme: ErrorBoundaryColorScheme = {
  container: 'bg-surface-secondary/50',
  border: 'border-edge',
  secondaryText: 'text-content-secondary',
  button: 'bg-surface-tertiary hover:bg-surface-elevated',
};

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional fallback component name for error message */
  componentName?: string;
  /** Color scheme for styling (defaults to PWA semantic tokens) */
  colorScheme?: ErrorBoundaryColorScheme;
  /** Called when an error is caught — use to notify external systems (e.g. Teams) */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component that catches JavaScript errors in child components
 * and displays a fallback UI instead of crashing the entire application.
 *
 * @example
 * <ErrorBoundary componentName="I-Chart">
 *   <IChart />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log to error service for centralized tracking
    errorService.handleBoundaryError(error, {
      componentStack: errorInfo.componentStack ?? undefined,
    });

    if (this.props.componentName) {
      errorService.logError(error, {
        component: this.props.componentName,
        action: 'render',
      });
    }

    // Notify external systems (e.g. Teams host)
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { componentName, colorScheme = defaultColorScheme } = this.props;
      return (
        <div
          className={`flex flex-col items-center justify-center h-full min-h-[200px] ${colorScheme.container} rounded-xl border ${colorScheme.border} p-6 text-center`}
        >
          <div className="p-3 bg-red-500/10 rounded-full mb-4">
            <AlertTriangle size={32} className="text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {componentName ? `${componentName} Error` : 'Something went wrong'}
          </h3>
          <p className={`text-sm ${colorScheme.secondaryText} mb-4 max-w-xs`}>
            {this.state.error?.message ||
              'An unexpected error occurred while rendering this component.'}
          </p>
          <button
            onClick={this.handleRetry}
            className={`flex items-center gap-2 px-4 py-2 ${colorScheme.button} text-white text-sm font-medium rounded-lg transition-colors`}
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
