import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NoActiveProjectGuidance } from '../NoActiveProjectGuidance';

describe('NoActiveProjectGuidance', () => {
  it('renders the "No active project" heading + body copy', () => {
    render(<NoActiveProjectGuidance onGoHome={() => {}} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /no active project/i })).toBeInTheDocument();
    expect(
      screen.getByText(/improvement work happens inside a chartered project/i)
    ).toBeInTheDocument();
  });

  it('renders a "Go to Home" button', () => {
    render(<NoActiveProjectGuidance onGoHome={() => {}} />);
    expect(screen.getByRole('button', { name: /go to home/i })).toBeInTheDocument();
  });

  it('calls onGoHome when the button is clicked', () => {
    const onGoHome = vi.fn();
    render(<NoActiveProjectGuidance onGoHome={onGoHome} />);
    fireEvent.click(screen.getByRole('button', { name: /go to home/i }));
    expect(onGoHome).toHaveBeenCalledTimes(1);
  });

  // E1 T6: optional copy overrides let the Process tab reuse this empty state
  // with its own description (Improve consumer continues to rely on defaults).
  it('renders the override heading when provided', () => {
    render(<NoActiveProjectGuidance onGoHome={() => {}} heading="Process tab is project-scoped" />);
    expect(
      screen.getByRole('heading', { name: /process tab is project-scoped/i })
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /no active project/i })).not.toBeInTheDocument();
  });

  it('renders the override description when provided', () => {
    render(
      <NoActiveProjectGuidance
        onGoHome={() => {}}
        description="Process work happens inside a project. Pick a project from Home, or create a new one to start editing the Canvas."
      />
    );
    expect(screen.getByText(/process work happens inside a project\./i)).toBeInTheDocument();
    expect(
      screen.queryByText(/improvement work happens inside a chartered project/i)
    ).not.toBeInTheDocument();
  });

  it('renders the override CTA label when provided', () => {
    render(<NoActiveProjectGuidance onGoHome={() => {}} ctaLabel="Open Home" />);
    expect(screen.getByRole('button', { name: /open home/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^go to home$/i })).not.toBeInTheDocument();
  });

  it('renders defaults when overrides are absent', () => {
    render(<NoActiveProjectGuidance onGoHome={() => {}} />);
    expect(screen.getByRole('heading', { name: /no active project/i })).toBeInTheDocument();
    expect(
      screen.getByText(/improvement work happens inside a chartered project/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go to home/i })).toBeInTheDocument();
  });
});
