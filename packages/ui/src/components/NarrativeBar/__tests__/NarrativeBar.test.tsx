import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NarrativeBar from '../NarrativeBar';

describe('NarrativeBar', () => {
  it('renders nothing when no narrative and not loading', () => {
    const { container } = render(
      <NarrativeBar narrative={null} isLoading={false} isCached={false} error={null} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders shimmer when loading', () => {
    render(<NarrativeBar narrative={null} isLoading={true} isCached={false} error={null} />);
    expect(screen.getByTestId('narrative-shimmer')).toBeTruthy();
  });

  it('renders narrative text when ready', () => {
    render(
      <NarrativeBar
        narrative="Process is stable with Cpk 1.3"
        isLoading={false}
        isCached={false}
        error={null}
      />
    );
    expect(screen.getByText(/Process is stable/)).toBeTruthy();
  });

  it('shows cached label when from cache', () => {
    render(
      <NarrativeBar narrative="Cached result" isLoading={false} isCached={true} error={null} />
    );
    expect(screen.getByText('(cached)')).toBeTruthy();
  });

  it('renders Ask button when onAsk provided', () => {
    const onAsk = vi.fn();
    render(
      <NarrativeBar
        narrative="Some text"
        isLoading={false}
        isCached={false}
        error={null}
        onAsk={onAsk}
      />
    );
    const askButton = screen.getByTestId('narrative-ask-button');
    fireEvent.click(askButton);
    expect(onAsk).toHaveBeenCalledTimes(1);
  });

  it('renders error with retry', () => {
    const onRetry = vi.fn();
    render(
      <NarrativeBar
        narrative={null}
        isLoading={false}
        isCached={false}
        error="Network error"
        onRetry={onRetry}
      />
    );
    expect(screen.getByText('Network error')).toBeTruthy();
    fireEvent.click(screen.getByText('Retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('has data-testid on the bar', () => {
    render(<NarrativeBar narrative="Test" isLoading={false} isCached={false} error={null} />);
    expect(screen.getByTestId('narrative-bar')).toBeTruthy();
  });
});
