/**
 * Tests for SeeTheDataCta — FRAME b0 primary action.
 *
 * Critical test rule (per .claude/rules/testing.md): vi.mock() BEFORE
 * component imports. This file uses no mocks (English i18n is statically
 * bundled in @variscout/core, so getMessage('en', ...) works without
 * locale loader setup) — but the import order convention is preserved.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SeeTheDataCta } from '../SeeTheDataCta';

const CTA = 'see-the-data-cta';

describe('SeeTheDataCta', () => {
  // ── 1. Renders with i18n label (presence-only) ─────────────────────────────
  it('renders with a non-empty translated label', () => {
    render(<SeeTheDataCta onClick={vi.fn()} />);
    const button = screen.getByTestId(CTA);
    expect(button.textContent).toBeTruthy();
    expect((button.textContent ?? '').length).toBeGreaterThan(0);
  });

  // ── 2. Click fires onClick when enabled ────────────────────────────────────
  it('fires onClick when enabled and clicked', () => {
    const onClick = vi.fn();
    render(<SeeTheDataCta onClick={onClick} />);
    fireEvent.click(screen.getByTestId(CTA));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  // ── 3. Click does NOT fire onClick when disabled ───────────────────────────
  it('does NOT fire onClick when disabled', () => {
    const onClick = vi.fn();
    render(<SeeTheDataCta onClick={onClick} disabled={true} />);
    fireEvent.click(screen.getByTestId(CTA));
    expect(onClick).not.toHaveBeenCalled();
  });

  // ── 4. disabled={true} sets HTML disabled + aria-disabled ──────────────────
  it('disabled={true} sets the HTML disabled attribute and aria-disabled="true"', () => {
    render(<SeeTheDataCta onClick={vi.fn()} disabled={true} />);
    const button = screen.getByTestId(CTA) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-disabled')).toBe('true');
  });

  // ── 5. disabledHint sets title only when disabled ──────────────────────────
  it('disabledHint sets title when disabled, but NOT when enabled', () => {
    const HINT = 'Pick a Y first';

    // Enabled + hint → no title.
    const { rerender } = render(
      <SeeTheDataCta onClick={vi.fn()} disabled={false} disabledHint={HINT} />
    );
    expect(screen.getByTestId(CTA).getAttribute('title')).toBeNull();

    // Disabled + hint → title is set.
    rerender(<SeeTheDataCta onClick={vi.fn()} disabled={true} disabledHint={HINT} />);
    expect(screen.getByTestId(CTA).getAttribute('title')).toBe(HINT);
  });

  // ── 6. data-testid + data-disabled correct in both states ──────────────────
  it('data-testid and data-disabled attributes are correct in both states', () => {
    const { rerender } = render(<SeeTheDataCta onClick={vi.fn()} />);
    let button = screen.getByTestId(CTA);
    expect(button.getAttribute('data-testid')).toBe('see-the-data-cta');
    expect(button.getAttribute('data-disabled')).toBe('false');

    rerender(<SeeTheDataCta onClick={vi.fn()} disabled={true} />);
    button = screen.getByTestId(CTA);
    expect(button.getAttribute('data-testid')).toBe('see-the-data-cta');
    expect(button.getAttribute('data-disabled')).toBe('true');
  });
});
