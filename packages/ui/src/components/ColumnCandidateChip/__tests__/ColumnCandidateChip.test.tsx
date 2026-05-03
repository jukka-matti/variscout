import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ColumnAnalysis } from '@variscout/core';
import { ColumnCandidateChip } from '../ColumnCandidateChip';

// Helper builders -----------------------------------------------------------

function numericColumn(overrides: Partial<ColumnAnalysis> = {}): ColumnAnalysis {
  return {
    name: 'Down_Content_%',
    type: 'numeric',
    uniqueCount: 200,
    hasVariation: true,
    missingCount: 0,
    sampleValues: ['22.4', '21.9', '23.1'],
    ...overrides,
  };
}

function categoricalColumn(overrides: Partial<ColumnAnalysis> = {}): ColumnAnalysis {
  return {
    name: 'Material_Type',
    type: 'categorical',
    uniqueCount: 3,
    hasVariation: true,
    missingCount: 0,
    sampleValues: ['A', 'B', 'C'],
    ...overrides,
  };
}

function dateColumn(overrides: Partial<ColumnAnalysis> = {}): ColumnAnalysis {
  return {
    name: 'Timestamp',
    type: 'date',
    uniqueCount: 13000,
    hasVariation: true,
    missingCount: 0,
    sampleValues: ['2024-01-01', '2024-12-31'],
    ...overrides,
  };
}

function textColumn(overrides: Partial<ColumnAnalysis> = {}): ColumnAnalysis {
  return {
    name: 'Operator_Note',
    type: 'text',
    uniqueCount: 42,
    hasVariation: true,
    missingCount: 0,
    sampleValues: ['note 1', 'note 2'],
    ...overrides,
  };
}

// Tests ---------------------------------------------------------------------

describe('ColumnCandidateChip', () => {
  it('renders a numeric chip with sparkline + mean/σ/n', () => {
    render(
      <ColumnCandidateChip
        column={numericColumn()}
        numericValues={[20, 21, 22, 23, 24]}
        state="idle"
      />
    );
    const btn = screen.getByTestId('column-candidate-chip');
    expect(btn).toBeInTheDocument();
    expect(btn.tagName).toBe('BUTTON');
    expect(screen.getByText('Down_Content_%')).toBeInTheDocument();
    // Stats line includes "n=5"
    expect(btn.textContent ?? '').toContain('n=5');
    // formatStatistic delegates to Intl.NumberFormat — assert leading digits only,
    // not exact decimal-separator-formatted output, so the test stays locale-stable.
    expect(btn.textContent ?? '').toContain('22');
    expect(btn.textContent ?? '').toMatch(/1[.,]4/);
    // Sparkline SVG present
    expect(btn.querySelector('svg')).not.toBeNull();
  });

  it('renders a categorical chip with one dot per level + n=sum', () => {
    render(
      <ColumnCandidateChip
        column={categoricalColumn()}
        levels={[
          { label: 'A', count: 5 },
          { label: 'B', count: 3 },
        ]}
        state="idle"
      />
    );
    const btn = screen.getByTestId('column-candidate-chip');
    // Two filled dots — selectable via rounded-full + bg color classes.
    const dots = btn.querySelectorAll('span.rounded-full');
    expect(dots.length).toBe(2);
    // Labels and total count visible.
    expect(btn.textContent ?? '').toContain('A');
    expect(btn.textContent ?? '').toContain('B');
    expect(btn.textContent ?? '').toContain('n=8');
  });

  it('caps categorical dots and shows +N overflow when levels exceed truncate threshold', () => {
    // 7 levels — should show 4 dots + "+3" overflow indicator. Without the cap,
    // the palette would cycle and dot 1 (blue) would re-appear at index 5,
    // misleadingly implying "blue dot 1 = blue dot 6".
    render(
      <ColumnCandidateChip
        column={categoricalColumn()}
        levels={[
          { label: 'A', count: 1 },
          { label: 'B', count: 1 },
          { label: 'C', count: 1 },
          { label: 'D', count: 1 },
          { label: 'E', count: 1 },
          { label: 'F', count: 1 },
          { label: 'G', count: 1 },
        ]}
        state="idle"
      />
    );
    const btn = screen.getByTestId('column-candidate-chip');
    const dots = btn.querySelectorAll('span.rounded-full');
    expect(dots.length).toBe(4);
    expect(btn.textContent ?? '').toContain('+3');
  });

  it('renders a date chip with range + calendar glyph', () => {
    render(<ColumnCandidateChip column={dateColumn()} state="idle" />);
    const btn = screen.getByTestId('column-candidate-chip');
    expect(btn.textContent ?? '').toContain('📅');
    expect(btn.textContent ?? '').toContain('2024-01-01');
    expect(btn.textContent ?? '').toContain('2024-12-31');
  });

  it('renders a text chip with Aa glyph + uniqueCount', () => {
    render(<ColumnCandidateChip column={textColumn({ uniqueCount: 42 })} state="idle" />);
    const btn = screen.getByTestId('column-candidate-chip');
    expect(btn.textContent ?? '').toContain('Aa');
    expect(btn.textContent ?? '').toContain('unique=42');
  });

  it('fires onClick when state=idle', () => {
    const onClick = vi.fn();
    render(
      <ColumnCandidateChip
        column={numericColumn()}
        numericValues={[1, 2, 3]}
        state="idle"
        onClick={onClick}
      />
    );
    fireEvent.click(screen.getByTestId('column-candidate-chip'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does NOT fire onClick when state=disabled-not-applicable', () => {
    const onClick = vi.fn();
    render(
      <ColumnCandidateChip
        column={numericColumn()}
        numericValues={[1, 2, 3]}
        state="disabled-not-applicable"
        disabledReason="constant column"
        onClick={onClick}
      />
    );
    fireEvent.click(screen.getByTestId('column-candidate-chip'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('marks aria-pressed=true when state=selected-as-Y', () => {
    render(
      <ColumnCandidateChip
        column={numericColumn()}
        numericValues={[1, 2, 3]}
        state="selected-as-Y"
      />
    );
    const btn = screen.getByTestId('column-candidate-chip');
    expect(btn.getAttribute('aria-pressed')).toBe('true');
    expect(btn.getAttribute('data-state')).toBe('selected-as-Y');
  });

  it('selected-as-Y and selected-as-X both press but render distinct classes', () => {
    const { unmount } = render(
      <ColumnCandidateChip
        column={numericColumn()}
        numericValues={[1, 2, 3]}
        state="selected-as-Y"
      />
    );
    const yClass = screen.getByTestId('column-candidate-chip').className;
    expect(screen.getByTestId('column-candidate-chip').getAttribute('aria-pressed')).toBe('true');
    unmount();

    render(
      <ColumnCandidateChip
        column={numericColumn()}
        numericValues={[1, 2, 3]}
        state="selected-as-X"
      />
    );
    const xClass = screen.getByTestId('column-candidate-chip').className;
    expect(screen.getByTestId('column-candidate-chip').getAttribute('aria-pressed')).toBe('true');
    expect(yClass).not.toBe(xClass);
  });

  it('decimates large numeric series before bucketing the sparkline', () => {
    // 1000 values — must be downsampled to ≤200 before bucketing into ≤24 bars.
    const big = Array.from({ length: 1000 }, (_, i) => i);
    render(<ColumnCandidateChip column={numericColumn()} numericValues={big} state="idle" />);
    const svg = screen.getByTestId('column-candidate-chip').querySelector('svg');
    expect(svg).not.toBeNull();
    // Sparkline buckets into at most SPARK_BARS (24) rects, never one per raw point.
    const rects = svg!.querySelectorAll('rect');
    expect(rects.length).toBeLessThanOrEqual(200);
    expect(rects.length).toBeLessThanOrEqual(24);
  });

  it('falls back to a default aria-label that includes the column name + state', () => {
    render(
      <ColumnCandidateChip
        column={numericColumn({ name: 'Pressure' })}
        numericValues={[1, 2, 3]}
        state="selected-as-Y"
      />
    );
    const btn = screen.getByTestId('column-candidate-chip');
    const label = btn.getAttribute('aria-label') ?? '';
    expect(label).toContain('Pressure');
    expect(label.toLowerCase()).toContain('selected');
  });
});
