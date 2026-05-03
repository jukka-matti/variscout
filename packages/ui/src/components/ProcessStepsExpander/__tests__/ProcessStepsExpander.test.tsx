/**
 * Tests for ProcessStepsExpander — FRAME b0 disclosure widget.
 *
 * Critical test rule (per .claude/rules/testing.md): vi.mock() BEFORE
 * component imports. This file uses no mocks (English i18n is statically
 * bundled in @variscout/core, so getMessage('en', ...) works without
 * locale loader setup) — but the import order convention is preserved.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProcessStepsExpander } from '../ProcessStepsExpander';

const HEADER = 'process-steps-expander-header';
const PANEL = 'process-steps-expander-panel';

function renderChild(label = 'CHILD_CONTENT') {
  return <div data-testid="expander-child">{label}</div>;
}

describe('ProcessStepsExpander', () => {
  // ── 1. Uncontrolled — defaults to closed; children NOT in DOM ──────────────
  it('uncontrolled: defaults to closed and does not render children', () => {
    render(<ProcessStepsExpander>{renderChild()}</ProcessStepsExpander>);
    expect(screen.queryByTestId(PANEL)).toBeNull();
    expect(screen.queryByTestId('expander-child')).toBeNull();
    // Header is always present, with aria-expanded=false.
    expect(screen.getByTestId(HEADER).getAttribute('aria-expanded')).toBe('false');
  });

  // ── 2. Uncontrolled — defaultOpen={true} renders children initially ────────
  it('uncontrolled: defaultOpen={true} renders children on first paint', () => {
    render(<ProcessStepsExpander defaultOpen={true}>{renderChild()}</ProcessStepsExpander>);
    expect(screen.getByTestId(PANEL)).toBeInTheDocument();
    expect(screen.getByTestId('expander-child')).toBeInTheDocument();
    expect(screen.getByTestId(HEADER).getAttribute('aria-expanded')).toBe('true');
  });

  // ── 3. Click header toggles open state in uncontrolled mode ────────────────
  it('uncontrolled: clicking the header toggles children in/out of the DOM', () => {
    render(<ProcessStepsExpander>{renderChild()}</ProcessStepsExpander>);
    const header = screen.getByTestId(HEADER);

    // Initially closed.
    expect(screen.queryByTestId('expander-child')).toBeNull();

    // First click → open.
    fireEvent.click(header);
    expect(screen.getByTestId('expander-child')).toBeInTheDocument();
    expect(header.getAttribute('aria-expanded')).toBe('true');

    // Second click → closed again.
    fireEvent.click(header);
    expect(screen.queryByTestId('expander-child')).toBeNull();
    expect(header.getAttribute('aria-expanded')).toBe('false');
  });

  // ── 4. Click header fires onOpenChange with new state ──────────────────────
  it('fires onOpenChange with the new open value on each toggle', () => {
    const onOpenChange = vi.fn();
    render(
      <ProcessStepsExpander onOpenChange={onOpenChange}>{renderChild()}</ProcessStepsExpander>
    );
    const header = screen.getByTestId(HEADER);

    fireEvent.click(header);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);

    fireEvent.click(header);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);

    expect(onOpenChange).toHaveBeenCalledTimes(2);
  });

  // ── 5. Controlled — open prop drives visibility ────────────────────────────
  it('controlled: open={true} shows children; open={false} hides them', () => {
    const { rerender } = render(
      <ProcessStepsExpander open={true} onOpenChange={vi.fn()}>
        {renderChild()}
      </ProcessStepsExpander>
    );
    expect(screen.getByTestId('expander-child')).toBeInTheDocument();
    expect(screen.getByTestId(HEADER).getAttribute('aria-expanded')).toBe('true');

    rerender(
      <ProcessStepsExpander open={false} onOpenChange={vi.fn()}>
        {renderChild()}
      </ProcessStepsExpander>
    );
    expect(screen.queryByTestId('expander-child')).toBeNull();
    expect(screen.getByTestId(HEADER).getAttribute('aria-expanded')).toBe('false');
  });

  // ── 6. Controlled — clicking fires onOpenChange but does NOT mutate state ──
  it('controlled: header click fires onOpenChange but does not mutate state on its own', () => {
    const onOpenChange = vi.fn();
    render(
      <ProcessStepsExpander open={false} onOpenChange={onOpenChange}>
        {renderChild()}
      </ProcessStepsExpander>
    );

    const header = screen.getByTestId(HEADER);
    fireEvent.click(header);

    // Callback fired with the *requested* next state.
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(onOpenChange).toHaveBeenCalledTimes(1);

    // BUT: parent never re-rendered with new open prop, so children stay hidden
    // and aria-expanded stays false. This is the controlled-mode contract.
    expect(screen.queryByTestId('expander-child')).toBeNull();
    expect(header.getAttribute('aria-expanded')).toBe('false');
  });

  // ── 7. Header has aria-expanded + aria-controls referencing panel id ───────
  it('header exposes aria-expanded and aria-controls referencing the panel id', () => {
    render(<ProcessStepsExpander defaultOpen={true}>{renderChild()}</ProcessStepsExpander>);
    const header = screen.getByTestId(HEADER);
    const panel = screen.getByTestId(PANEL);

    expect(header.getAttribute('aria-expanded')).toBe('true');
    const ariaControls = header.getAttribute('aria-controls');
    expect(ariaControls).toBeTruthy();
    expect(ariaControls).toBe(panel.getAttribute('id'));
  });

  // ── 8. Panel has matching id + aria-labelledby referencing header id ───────
  it('panel exposes role="region", id, and aria-labelledby referencing the header id', () => {
    render(<ProcessStepsExpander defaultOpen={true}>{renderChild()}</ProcessStepsExpander>);
    const header = screen.getByTestId(HEADER);
    const panel = screen.getByTestId(PANEL);

    expect(panel.getAttribute('role')).toBe('region');
    const labelledBy = panel.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    expect(labelledBy).toBe(header.getAttribute('id'));
  });
});
