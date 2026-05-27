import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SystemHintBanner } from '../SystemHintBanner';

describe('SystemHintBanner', () => {
  it('renders with role="region" and aria-label="System hint"', () => {
    render(
      <SystemHintBanner
        kind="batch"
        message="💡 Batch data detected"
        ctaLabel="Calculate yield ratios →"
        onCta={vi.fn()}
      />
    );
    const region = screen.getByRole('region', { name: 'System hint' });
    expect(region).toBeInTheDocument();
  });

  it('renders message text', () => {
    render(<SystemHintBanner kind="batch" message="💡 Batch data detected" />);
    expect(screen.getByText('💡 Batch data detected')).toBeInTheDocument();
  });

  it('renders CTA button and calls onCta when clicked', () => {
    const onCta = vi.fn();
    render(
      <SystemHintBanner
        kind="batch"
        message="💡 Batch data detected"
        ctaLabel="Calculate yield ratios →"
        onCta={onCta}
      />
    );
    const cta = screen.getByTestId('system-hint-banner-batch-cta');
    expect(cta).toBeInTheDocument();
    fireEvent.click(cta);
    expect(onCta).toHaveBeenCalledTimes(1);
  });

  it('time variant container has cyan class (not emerald or amber)', () => {
    render(
      <SystemHintBanner
        kind="time"
        message="💡 6 time columns detected"
        ctaLabel="Use as factors →"
        onCta={vi.fn()}
      />
    );
    const banner = screen.getByTestId('system-hint-banner-time');
    expect(banner.className).toContain('cyan');
    expect(banner.className).not.toContain('emerald');
    expect(banner.className).not.toContain('amber');
  });

  it('parsing variant container has amber class and uses ⚠ icon', () => {
    render(<SystemHintBanner kind="parsing" message="Column needs attention" />);
    const banner = screen.getByTestId('system-hint-banner-parsing');
    expect(banner.className).toContain('amber');
    expect(banner.className).not.toContain('cyan');
    expect(banner.className).not.toContain('emerald');
    // ⚠ icon should be present (aria-hidden span)
    const icon = banner.querySelector('[aria-hidden="true"]');
    expect(icon).not.toBeNull();
    expect(icon?.textContent).toBe('⚠');
  });

  it('batch and time variants use 💡 icon', () => {
    const { rerender } = render(<SystemHintBanner kind="batch" message="msg" />);
    let icon = screen.getByTestId('system-hint-banner-batch').querySelector('[aria-hidden="true"]');
    expect(icon?.textContent).toBe('💡');

    rerender(<SystemHintBanner kind="time" message="msg" />);
    icon = screen.getByTestId('system-hint-banner-time').querySelector('[aria-hidden="true"]');
    expect(icon?.textContent).toBe('💡');
  });

  it('does not render CTA button when ctaLabel is omitted', () => {
    render(<SystemHintBanner kind="batch" message="💡 Batch data detected" />);
    expect(screen.queryByTestId('system-hint-banner-batch-cta')).toBeNull();
  });

  it('renders dismiss button and calls onDismiss when clicked', () => {
    const onDismiss = vi.fn();
    render(
      <SystemHintBanner kind="batch" message="💡 Batch data detected" onDismiss={onDismiss} />
    );
    const dismiss = screen.getByTestId('system-hint-banner-batch-dismiss');
    expect(dismiss).toBeInTheDocument();
    fireEvent.click(dismiss);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not render dismiss button when onDismiss is not provided', () => {
    render(<SystemHintBanner kind="batch" message="💡 Batch data detected" />);
    expect(screen.queryByTestId('system-hint-banner-batch-dismiss')).toBeNull();
  });

  it('has data-kind attribute matching the kind prop', () => {
    render(<SystemHintBanner kind="batch" message="msg" />);
    const banner = screen.getByTestId('system-hint-banner-batch');
    expect(banner.getAttribute('data-kind')).toBe('batch');
  });

  it('data-testid matches kind for each variant', () => {
    const { rerender } = render(<SystemHintBanner kind="batch" message="msg" />);
    expect(screen.getByTestId('system-hint-banner-batch')).toBeInTheDocument();

    rerender(<SystemHintBanner kind="time" message="msg" />);
    expect(screen.getByTestId('system-hint-banner-time')).toBeInTheDocument();

    rerender(<SystemHintBanner kind="parsing" message="msg" />);
    expect(screen.getByTestId('system-hint-banner-parsing')).toBeInTheDocument();
  });

  it('CTA and dismiss can coexist; clicking one does not trigger the other', () => {
    const onCta = vi.fn();
    const onDismiss = vi.fn();
    render(
      <SystemHintBanner
        kind="batch"
        message="msg"
        ctaLabel="Go →"
        onCta={onCta}
        onDismiss={onDismiss}
      />
    );
    const cta = screen.getByTestId('system-hint-banner-batch-cta');
    const dismiss = screen.getByTestId('system-hint-banner-batch-dismiss');
    expect(cta).toBeInTheDocument();
    expect(dismiss).toBeInTheDocument();

    fireEvent.click(cta);
    expect(onCta).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();

    fireEvent.click(dismiss);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onCta).toHaveBeenCalledTimes(1); // still only 1
  });

  it('no dark: Tailwind classes in rendered output', () => {
    const { container } = render(
      <SystemHintBanner
        kind="batch"
        message="msg"
        ctaLabel="Go →"
        onCta={vi.fn()}
        onDismiss={vi.fn()}
      />
    );
    expect(container.innerHTML).not.toContain('dark:');
  });

  it('icon span has aria-hidden="true" so screen readers skip it', () => {
    render(<SystemHintBanner kind="batch" message="msg" />);
    const banner = screen.getByTestId('system-hint-banner-batch');
    const icon = banner.querySelector('[aria-hidden="true"]');
    expect(icon).not.toBeNull();
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
  });
});
