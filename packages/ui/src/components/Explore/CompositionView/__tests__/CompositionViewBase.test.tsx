/**
 * Tests for CompositionViewBase (ER-5a — "What distinguishes these rows?").
 *
 * The composition view is props-based and store-free. It renders paired share
 * bars per level (share-in vs share-out), lift annotation on the leading level,
 * a count ⇄ lift toggle (local UI state), and per-level ⊕ buttons.
 *
 * Tests are unconditional assertions — no soft-skip `if` around expectations
 * (ER-3 lesson). i18n is exercised against the REAL English catalog.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { en } from '@variscout/core/i18n';
import { formatStatistic } from '@variscout/core/i18n';
import type { MembershipLevelComposition } from '@variscout/core';

// ---- Mock useTranslation BEFORE the component import ----
vi.mock('@variscout/hooks', () => {
  const interpolate = (key: string, params?: Record<string, string | number>) => {
    let msg = (en as unknown as Record<string, string>)[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        msg = msg.replaceAll(`{${k}}`, String(v));
      }
    }
    return msg;
  };
  return {
    useTranslation: () => ({
      t: (key: string) => (en as unknown as Record<string, string>)[key] ?? key,
      tf: (key: string, params: Record<string, string | number>) => interpolate(key, params),
      locale: 'en',
      formatStat: (value: number, decimals = 2) => formatStatistic(value, 'en', decimals),
      formatNumber: (value: number, decimals = 2) => formatStatistic(value, 'en', decimals),
      formatPct: (value: number, decimals = 1) => formatStatistic(value, 'en', decimals),
    }),
  };
});

import { CompositionViewBase } from '../CompositionViewBase';

// ── Level factory ─────────────────────────────────────────────────────────────

function makeLevel(over: Partial<MembershipLevelComposition> = {}): MembershipLevelComposition {
  return {
    level: 'Billing',
    nIn: 45,
    nOut: 30,
    shareIn: 0.45,
    shareOut: 0.3,
    lift: 1.5,
    ...over,
  };
}

// A ranked level set: Billing (top lift) > Returns (moderate) > General (below 1)
function rankedLevels(): MembershipLevelComposition[] {
  return [
    makeLevel({ level: 'Billing', nIn: 45, nOut: 30, shareIn: 0.45, shareOut: 0.3, lift: 2.8 }),
    makeLevel({ level: 'Returns', nIn: 20, nOut: 30, shareIn: 0.2, shareOut: 0.3, lift: 0.67 }),
    makeLevel({ level: 'General', nIn: 10, nOut: 80, shareIn: 0.1, shareOut: 0.8, lift: 0.125 }),
  ];
}

const baseProps = {
  nIn: 100,
  nOut: 140,
  factorLabel: 'Queue',
  levels: rankedLevels(),
};

describe('CompositionViewBase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Testid presence ────────────────────────────────────────────────────
  it('renders the composition-view container', () => {
    render(<CompositionViewBase {...baseProps} />);
    expect(screen.getByTestId('composition-view')).toBeDefined();
  });

  // ── Default: lift view ─────────────────────────────────────────────────
  it('renders in lift mode by default — paired bars for in-condition and out', () => {
    render(<CompositionViewBase {...baseProps} />);
    // Default lift view: in-condition bar + out-of-condition bar for each level
    for (const level of rankedLevels()) {
      expect(screen.getByTestId(`composition-bar-in-${level.level}`)).toBeDefined();
      expect(screen.getByTestId(`composition-bar-out-${level.level}`)).toBeDefined();
    }
  });

  // ── Lift annotations ───────────────────────────────────────────────────
  it('renders lift annotations (×N.N) for each level in lift mode', () => {
    render(<CompositionViewBase {...baseProps} />);
    // Each level should have a lift annotation
    expect(screen.getByTestId('composition-lift-Billing')).toBeDefined();
    // The Billing level has lift=2.8 → "×2.8"
    expect(screen.getByTestId('composition-lift-Billing').textContent).toContain('×2.8');
  });

  // ── Infinity lift → "only in condition" label ──────────────────────────
  it('renders the "only in condition" label when lift is Infinity', () => {
    const levels = [
      makeLevel({ level: 'Billing', nIn: 40, nOut: 0, shareIn: 1.0, shareOut: 0, lift: Infinity }),
    ];
    render(<CompositionViewBase {...baseProps} levels={levels} />);
    const liftEl = screen.getByTestId('composition-lift-Billing');
    expect(liftEl.textContent).toContain('only in condition');
    expect(liftEl.textContent).not.toContain('∞');
  });

  // ── Toggle switches sort order and bar semantics ───────────────────────
  it('switching to count view re-sorts levels by nIn descending and hides out-bars', () => {
    // Provide levels with a clear nIn order different from lift order
    const levels = [
      makeLevel({ level: 'Billing', nIn: 45, nOut: 30, shareIn: 0.45, shareOut: 0.3, lift: 2.8 }),
      makeLevel({ level: 'Returns', nIn: 80, nOut: 30, shareIn: 0.2, shareOut: 0.3, lift: 0.67 }),
    ];
    render(<CompositionViewBase {...baseProps} levels={levels} />);

    // Switch to count view
    fireEvent.click(screen.getByTestId('composition-toggle-count'));

    // In count view: only in-bars, no out-bars
    expect(screen.getByTestId('composition-bar-in-Billing')).toBeDefined();
    expect(screen.queryByTestId('composition-bar-out-Billing')).toBeNull();

    // Count annotations visible
    expect(screen.getByTestId('composition-count-Returns').textContent).toContain('80');
  });

  it('switching back to lift mode shows paired bars again', () => {
    render(<CompositionViewBase {...baseProps} />);
    fireEvent.click(screen.getByTestId('composition-toggle-count'));
    fireEvent.click(screen.getByTestId('composition-toggle-lift'));
    // Back to lift view: out-bars visible
    expect(screen.getByTestId('composition-bar-out-Billing')).toBeDefined();
  });

  // ── ⊕ button present when handler provided ─────────────────────────────
  it('renders ⊕ button for each level when onAddToCondition is provided', () => {
    const onAdd = vi.fn();
    render(<CompositionViewBase {...baseProps} onAddToCondition={onAdd} />);
    for (const level of rankedLevels()) {
      expect(screen.getByTestId(`composition-add-${level.level}`)).toBeDefined();
    }
  });

  // ── ⊕ fires with the level ────────────────────────────────────────────
  it('calls onAddToCondition with the level label when ⊕ is clicked', () => {
    const onAdd = vi.fn();
    render(<CompositionViewBase {...baseProps} onAddToCondition={onAdd} />);
    fireEvent.click(screen.getByTestId('composition-add-Billing'));
    expect(onAdd).toHaveBeenCalledWith('Billing');
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('calls onAddToCondition with the correct level for different levels', () => {
    const onAdd = vi.fn();
    render(<CompositionViewBase {...baseProps} onAddToCondition={onAdd} />);
    fireEvent.click(screen.getByTestId('composition-add-Returns'));
    expect(onAdd).toHaveBeenCalledWith('Returns');
  });

  // ── ⊕ absent without handler ──────────────────────────────────────────
  it('does NOT render ⊕ buttons when onAddToCondition is absent', () => {
    render(<CompositionViewBase {...baseProps} />);
    for (const level of rankedLevels()) {
      expect(screen.queryByTestId(`composition-add-${level.level}`)).toBeNull();
    }
  });

  // ── Empty / degenerate state ───────────────────────────────────────────
  it('renders the empty state when levels array is empty', () => {
    render(<CompositionViewBase {...baseProps} levels={[]} />);
    const view = screen.getByTestId('composition-view');
    expect(view.textContent).toContain('No composition data');
  });

  it('renders the empty state when nIn and nOut are both zero', () => {
    render(<CompositionViewBase {...baseProps} nIn={0} nOut={0} />);
    const view = screen.getByTestId('composition-view');
    expect(view.textContent).toContain('No composition data');
  });

  // ── Toggle accessible ─────────────────────────────────────────────────
  it('toggle renders with composition-toggle testid', () => {
    render(<CompositionViewBase {...baseProps} />);
    expect(screen.getByTestId('composition-toggle')).toBeDefined();
  });

  it('lift toggle button has aria-pressed=true by default', () => {
    render(<CompositionViewBase {...baseProps} />);
    expect(screen.getByTestId('composition-toggle-lift').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('composition-toggle-count').getAttribute('aria-pressed')).toBe(
      'false'
    );
  });

  it('after switching to count, count has aria-pressed=true', () => {
    render(<CompositionViewBase {...baseProps} />);
    fireEvent.click(screen.getByTestId('composition-toggle-count'));
    expect(screen.getByTestId('composition-toggle-count').getAttribute('aria-pressed')).toBe(
      'true'
    );
    expect(screen.getByTestId('composition-toggle-lift').getAttribute('aria-pressed')).toBe(
      'false'
    );
  });

  // ── Heading displays factorLabel ──────────────────────────────────────
  it('renders the heading with the factor label', () => {
    render(<CompositionViewBase {...baseProps} factorLabel="Queue" />);
    expect(screen.getByText('Composition by Queue')).toBeDefined();
  });
});
