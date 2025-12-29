import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional fallback component name for error message */
  componentName?: string;
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
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { componentName } = this.props;
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[200px] bg-slate-800/50 rounded-xl border border-slate-700 p-6 text-center">
          <div className="p-3 bg-red-500/10 rounded-full mb-4">
            <AlertTriangle size={32} className="text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {componentName ? `${componentName} Error` : 'Something went wrong'}
          </h3>
          <p className="text-sm text-slate-400 mb-4 max-w-xs">
            {this.state.error?.message ||
              'An unexpected error occurred while rendering this component.'}
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
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
