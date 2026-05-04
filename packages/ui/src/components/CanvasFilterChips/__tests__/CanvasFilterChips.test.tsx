import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ScopeFilter, TimelineWindow } from '@variscout/core';
import { CanvasFilterChips } from '../index';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const rollingWindow: TimelineWindow = { kind: 'rolling', windowDays: 30 };
const fixedWindow: TimelineWindow = {
  kind: 'fixed',
  startISO: '2026-01-01T00:00:00Z',
  endISO: '2026-03-31T23:59:59Z',
};
const cumulativeWindow: TimelineWindow = { kind: 'cumulative' };
const openEndedWindow: TimelineWindow = {
  kind: 'openEnded',
  startISO: '2026-04-01T00:00:00Z',
};

const scopeFilter: ScopeFilter = {
  factor: 'product_id',
  values: ['ProductC', 'ProductD'],
};

const emptyScopeFilter: ScopeFilter = {
  factor: 'product_id',
  values: [],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CanvasFilterChips', () => {
  // 1. All filters absent → renders nothing
  it('renders nothing when all filters are absent', () => {
    const { container } = render(<CanvasFilterChips />);
    expect(container.firstChild).toBeNull();
  });

  // 2. cumulative window → no window chip even when window prop is provided
  it('renders nothing when timelineWindow.kind is cumulative', () => {
    const { container } = render(<CanvasFilterChips timelineWindow={cumulativeWindow} />);
    expect(container.firstChild).toBeNull();
  });

  // 3. Time window chip renders for non-cumulative window; uses formatTimelineWindow when provided
  it('renders time window chip with formatTimelineWindow label when window is active', () => {
    const format = (_w: TimelineWindow) => 'Last 30 days';
    render(<CanvasFilterChips timelineWindow={rollingWindow} formatTimelineWindow={format} />);
    expect(screen.getByTestId('filter-chip-window')).toBeDefined();
    expect(screen.getByText('Last 30 days')).toBeDefined();
  });

  // 3b. Falls back to "Time window" when formatTimelineWindow is not provided
  it('falls back to "Time window" label when formatTimelineWindow is absent', () => {
    render(<CanvasFilterChips timelineWindow={rollingWindow} />);
    expect(screen.getByText('Time window')).toBeDefined();
  });

  // 3c. Fixed window also triggers the chip
  it('renders time window chip for a fixed window kind', () => {
    render(<CanvasFilterChips timelineWindow={fixedWindow} />);
    expect(screen.getByTestId('filter-chip-window')).toBeDefined();
  });

  // 4. Scope filter chip renders; label format is "{factor}: {values joined}"
  it('renders scope filter chip with correct label', () => {
    render(<CanvasFilterChips scopeFilter={scopeFilter} />);
    const chip = screen.getByTestId('filter-chip-scope');
    expect(chip).toBeDefined();
    expect(chip.textContent).toContain('product_id: ProductC, ProductD');
  });

  // 5. Empty values array → no scope chip
  it('renders nothing when scopeFilter.values is empty', () => {
    const { container } = render(<CanvasFilterChips scopeFilter={emptyScopeFilter} />);
    expect(container.firstChild).toBeNull();
  });

  // 6. Pareto group-by chip renders; label is "Pareto by {factor}"
  it('renders Pareto group-by chip with correct label', () => {
    render(<CanvasFilterChips paretoGroupBy="lot_id" />);
    const chip = screen.getByTestId('filter-chip-groupby');
    expect(chip).toBeDefined();
    expect(chip.textContent).toContain('Pareto by lot_id');
  });

  // 7. Empty paretoGroupBy string → no chip
  it('renders nothing when paretoGroupBy is empty string', () => {
    const { container } = render(<CanvasFilterChips paretoGroupBy="" />);
    expect(container.firstChild).toBeNull();
  });

  // 8. All three chips render when all three states are active; in correct order
  it('renders all three chips in correct order (purple/blue/amber) when all filters active', () => {
    const format = (_w: TimelineWindow) => 'Last 30 days';
    render(
      <CanvasFilterChips
        timelineWindow={rollingWindow}
        formatTimelineWindow={format}
        scopeFilter={scopeFilter}
        paretoGroupBy="lot_id"
      />
    );
    const container = screen.getByTestId('canvas-filter-chips');
    const chips = container.querySelectorAll('[data-testid]');
    const testIds = Array.from(chips).map(el => el.getAttribute('data-testid'));
    expect(testIds).toEqual(['filter-chip-window', 'filter-chip-scope', 'filter-chip-groupby']);
  });

  // 9. Clear button fires the correct callback
  it('calls onClearTimelineWindow when window chip clear button is clicked', () => {
    const onClearTimelineWindow = vi.fn();
    render(
      <CanvasFilterChips
        timelineWindow={rollingWindow}
        onClearTimelineWindow={onClearTimelineWindow}
      />
    );
    const clearBtn = screen.getByRole('button', { name: /clear time window/i });
    fireEvent.click(clearBtn);
    expect(onClearTimelineWindow).toHaveBeenCalledTimes(1);
  });

  it('calls onClearScopeFilter when scope chip clear button is clicked', () => {
    const onClearScopeFilter = vi.fn();
    render(<CanvasFilterChips scopeFilter={scopeFilter} onClearScopeFilter={onClearScopeFilter} />);
    const clearBtn = screen.getByRole('button', { name: /clear product_id/i });
    fireEvent.click(clearBtn);
    expect(onClearScopeFilter).toHaveBeenCalledTimes(1);
  });

  it('calls onClearParetoGroupBy when group-by chip clear button is clicked', () => {
    const onClearParetoGroupBy = vi.fn();
    render(
      <CanvasFilterChips paretoGroupBy="lot_id" onClearParetoGroupBy={onClearParetoGroupBy} />
    );
    const clearBtn = screen.getByRole('button', { name: /clear pareto by lot_id/i });
    fireEvent.click(clearBtn);
    expect(onClearParetoGroupBy).toHaveBeenCalledTimes(1);
  });

  // 10. Clear button absent when callback not provided
  it('does not render clear button when onClearTimelineWindow is absent', () => {
    render(<CanvasFilterChips timelineWindow={rollingWindow} />);
    // chip renders but no button inside it
    expect(screen.getByTestId('filter-chip-window')).toBeDefined();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('does not render clear button when onClearScopeFilter is absent', () => {
    render(<CanvasFilterChips scopeFilter={scopeFilter} />);
    expect(screen.getByTestId('filter-chip-scope')).toBeDefined();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('does not render clear button when onClearParetoGroupBy is absent', () => {
    render(<CanvasFilterChips paretoGroupBy="lot_id" />);
    expect(screen.getByTestId('filter-chip-groupby')).toBeDefined();
    expect(screen.queryByRole('button')).toBeNull();
  });

  // 11. className prop appended to container
  it('appends className to the outer container', () => {
    render(<CanvasFilterChips timelineWindow={rollingWindow} className="my-custom-class" />);
    const container = screen.getByTestId('canvas-filter-chips');
    expect(container.className).toContain('my-custom-class');
  });

  // 12. aria-label on clear buttons reflects the chip's label
  it('sets aria-label on clear button matching the chip label', () => {
    const onClear = vi.fn();
    render(
      <CanvasFilterChips
        timelineWindow={openEndedWindow}
        formatTimelineWindow={() => 'Since Apr 2026'}
        onClearTimelineWindow={onClear}
      />
    );
    const btn = screen.getByRole('button', { name: 'Clear Since Apr 2026' });
    expect(btn).toBeDefined();
  });

  it('sets aria-label on scope clear button matching the chip label', () => {
    const onClear = vi.fn();
    render(<CanvasFilterChips scopeFilter={scopeFilter} onClearScopeFilter={onClear} />);
    const btn = screen.getByRole('button', {
      name: 'Clear product_id: ProductC, ProductD',
    });
    expect(btn).toBeDefined();
  });

  it('sets aria-label on group-by clear button matching the chip label', () => {
    const onClear = vi.fn();
    render(<CanvasFilterChips paretoGroupBy="lot_id" onClearParetoGroupBy={onClear} />);
    const btn = screen.getByRole('button', { name: 'Clear Pareto by lot_id' });
    expect(btn).toBeDefined();
  });

  // Color class sanity check
  it('applies violet color class to window chip', () => {
    render(<CanvasFilterChips timelineWindow={rollingWindow} />);
    const chip = screen.getByTestId('filter-chip-window');
    expect(chip.className).toContain('bg-violet-500/10');
  });

  it('applies blue color class to scope chip', () => {
    render(<CanvasFilterChips scopeFilter={scopeFilter} />);
    const chip = screen.getByTestId('filter-chip-scope');
    expect(chip.className).toContain('bg-blue-500/10');
  });

  it('applies amber color class to group-by chip', () => {
    render(<CanvasFilterChips paretoGroupBy="lot_id" />);
    const chip = screen.getByTestId('filter-chip-groupby');
    expect(chip.className).toContain('bg-amber-500/10');
  });
});
