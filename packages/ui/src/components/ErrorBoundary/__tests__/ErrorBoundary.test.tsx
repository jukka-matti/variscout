import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary, { azureColorScheme } from '../ErrorBoundary';

// Mock the error service
vi.mock('../../../services', () => ({
  errorService: {
    handleBoundaryError: vi.fn(),
    logError: vi.fn(),
  },
}));

// Import the mock after vi.mock
import { errorService } from '../../../services';

// Component that throws on command
function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Test error');
  return <div>Child content</div>;
}

// Suppress console.error for expected error boundary logs
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.clearAllMocks();
});

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Hello</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Hello')).toBeDefined();
  });

  it('shows fallback UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeDefined();
    expect(screen.getByText('Test error')).toBeDefined();
  });

  it('shows component name in error heading', () => {
    render(
      <ErrorBoundary componentName="I-Chart">
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('I-Chart Error')).toBeDefined();
  });

  it('"Try Again" button resets error state', () => {
    // Use a ref to control throwing behavior without remounting
    let shouldThrow = true;
    function ControlledChild() {
      if (shouldThrow) throw new Error('Test error');
      return <div>Child content</div>;
    }

    render(
      <ErrorBoundary>
        <ControlledChild />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeDefined();

    // Stop throwing, then click retry
    shouldThrow = false;
    fireEvent.click(screen.getByText('Try Again'));
    expect(screen.getByText('Child content')).toBeDefined();
  });

  it('calls errorService.handleBoundaryError on error', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(errorService.handleBoundaryError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });

  it('calls errorService.logError with component name', () => {
    render(
      <ErrorBoundary componentName="Boxplot">
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(errorService.logError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ component: 'Boxplot', action: 'render' })
    );
  });

  it('applies custom colorScheme classes', () => {
    const { container } = render(
      <ErrorBoundary colorScheme={azureColorScheme}>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    );
    const fallbackDiv = container.querySelector('.bg-slate-800\\/50');
    expect(fallbackDiv).not.toBeNull();
  });

  it('re-renders children after retry when error is resolved', () => {
    let shouldThrow = true;
    function ControlledChild() {
      if (shouldThrow) throw new Error('Test error');
      return <div>Child content</div>;
    }

    render(
      <ErrorBoundary>
        <ControlledChild />
      </ErrorBoundary>
    );
    expect(screen.queryByText('Child content')).toBeNull();

    // Stop throwing, then retry
    shouldThrow = false;
    fireEvent.click(screen.getByText('Try Again'));
    expect(screen.getByText('Child content')).toBeDefined();
    expect(screen.queryByText('Something went wrong')).toBeNull();
  });
});
