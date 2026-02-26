/**
 * ErrorBoundary wrapper for Azure app
 *
 * Re-exports the shared ErrorBoundary from @variscout/ui.
 * Uses default semantic-token-based color scheme.
 */
import React from 'react';
import { ErrorBoundary as SharedErrorBoundary, type ErrorBoundaryProps } from '@variscout/ui';

const ErrorBoundary = (props: Omit<ErrorBoundaryProps, 'colorScheme'>) => (
  <SharedErrorBoundary {...props} />
);

export default ErrorBoundary;
