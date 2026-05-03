/**
 * Tests for XPickerSection — FRAME b0 X-picker UI.
 *
 * Critical test rule (per .claude/rules/testing.md): vi.mock() BEFORE component
 * imports — this file uses no mocks (English i18n is statically bundled in
 * @variscout/core, so getMessage('en', ...) works without locale loader setup).
 *
 * Selector convention: data-testid attributes (text changes with i18n).
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import type { ColumnAnalysis } from '@variscout/core';
import { XPickerSection, type XCandidate } from '../XPickerSection';

function numericColumn(name: string, overrides: Partial<ColumnAnalysis> = {}): ColumnAnalysis {
  return {
    name,
    type: 'numeric',
    uniqueCount: 100,
    hasVariation: true,
    missingCount: 0,
    sampleValues: ['1', '2', '3'],
    ...overrides,
  };
}

function categoricalColumn(name: string, levelCount = 3): ColumnAnalysis {
  return {
    name,
    type: 'categorical',
    uniqueCount: levelCount,
    hasVariation: true,
    missingCount: 0,
    sampleValues: ['A', 'B', 'C'].slice(0, levelCount),
  };
}

function numericCandidate(name: string, values: number[] = [1, 2, 3]): XCandidate {
  return { column: numericColumn(name), numericValues: values };
}

function categoricalCandidate(
  name: string,
  levels: ReadonlyArray<{ label: string; count: number }> = [
    { label: 'A', count: 5 },
    { label: 'B', count: 4 },
    { label: 'C', count: 3 },
  ]
): XCandidate {
  return { column: categoricalColumn(name, levels.length), levels };
}

const defaultCandidates: XCandidate[] = [
  numericCandidate('Input_Quantity_kg', [114, 113, 115, 116, 112]),
  categoricalCandidate('Material_Type', [
    { label: 'A', count: 5000 },
    { label: 'B', count: 4500 },
    { label: 'C', count: 3500 },
  ]),
  numericCandidate('Operator_ID', [1, 2, 3, 4]),
];

describe('XPickerSection', () => {
  it('renders headline and hint via i18n', () => {
    render(<XPickerSection candidates={defaultCandidates} selectedXs={[]} onToggleX={vi.fn()} />);
    expect(screen.getByTestId('x-picker-headline').textContent).toBe('What might be affecting it?');
    expect(screen.getByTestId('x-picker-hint').textContent).toBe("your X's / inputs");
  });

  it('renders one chip per candidate, all idle when nothing selected', () => {
    render(<XPickerSection candidates={defaultCandidates} selectedXs={[]} onToggleX={vi.fn()} />);
    const chips = screen.getAllByTestId('column-candidate-chip');
    expect(chips).toHaveLength(3);
    for (const chip of chips) {
      expect(chip.getAttribute('data-state')).toBe('idle');
    }
    // No selected subsection rendered when no selection.
    expect(screen.queryByTestId('x-picker-selected-row')).toBeNull();
  });

  it('clicking a chip fires onToggleX with the column name', () => {
    const onToggleX = vi.fn();
    render(<XPickerSection candidates={defaultCandidates} selectedXs={[]} onToggleX={onToggleX} />);
    const availableRow = screen.getByTestId('x-picker-available-row');
    const inputChip = within(availableRow).getByText('Input_Quantity_kg').closest('button');
    expect(inputChip).not.toBeNull();
    fireEvent.click(inputChip!);
    expect(onToggleX).toHaveBeenCalledWith('Input_Quantity_kg');
    expect(onToggleX).toHaveBeenCalledTimes(1);
  });

  it('renders a selected chip in selected-as-X state when in selectedXs', () => {
    render(
      <XPickerSection
        candidates={defaultCandidates}
        selectedXs={['Material_Type']}
        onToggleX={vi.fn()}
      />
    );
    const selectedRow = screen.getByTestId('x-picker-selected-row');
    const selectedChips = within(selectedRow).getAllByTestId('column-candidate-chip');
    expect(selectedChips).toHaveLength(1);
    expect(selectedChips[0].getAttribute('data-state')).toBe('selected-as-X');
    expect(selectedChips[0].getAttribute('aria-pressed')).toBe('true');

    // Other chips remain in the available row, idle.
    const availableRow = screen.getByTestId('x-picker-available-row');
    const availableChips = within(availableRow).getAllByTestId('column-candidate-chip');
    expect(availableChips).toHaveLength(2);
    for (const chip of availableChips) {
      expect(chip.getAttribute('data-state')).toBe('idle');
    }
  });

  it('selected subsection appears above available subsection (DOM order)', () => {
    render(
      <XPickerSection
        candidates={defaultCandidates}
        selectedXs={['Input_Quantity_kg']}
        onToggleX={vi.fn()}
      />
    );
    const section = screen.getByTestId('x-picker-section');
    const selected = screen.getByTestId('x-picker-selected-row');
    const available = screen.getByTestId('x-picker-available-row');
    const children = Array.from(section.querySelectorAll('[data-testid]'));
    const selectedIdx = children.indexOf(selected);
    const availableIdx = children.indexOf(available);
    expect(selectedIdx).toBeGreaterThanOrEqual(0);
    expect(availableIdx).toBeGreaterThan(selectedIdx);
  });

  it('shows run-order hint with column name interpolated when runOrderColumn provided', () => {
    render(
      <XPickerSection
        candidates={defaultCandidates}
        selectedXs={[]}
        onToggleX={vi.fn()}
        runOrderColumn="Lot_Start_DateTime"
      />
    );
    const hint = screen.getByTestId('x-picker-run-order-hint');
    expect(hint.textContent).toBe('(run order: Lot_Start_DateTime)');
  });

  it('does NOT show run-order hint when runOrderColumn is null', () => {
    render(
      <XPickerSection
        candidates={defaultCandidates}
        selectedXs={[]}
        onToggleX={vi.fn()}
        runOrderColumn={null}
      />
    );
    expect(screen.queryByTestId('x-picker-run-order-hint')).toBeNull();
  });

  it('does NOT show run-order hint when runOrderColumn is undefined', () => {
    render(<XPickerSection candidates={defaultCandidates} selectedXs={[]} onToggleX={vi.fn()} />);
    expect(screen.queryByTestId('x-picker-run-order-hint')).toBeNull();
  });

  it('renders empty-state hint via i18n when candidates is empty', () => {
    render(<XPickerSection candidates={[]} selectedXs={[]} onToggleX={vi.fn()} />);
    const empty = screen.getByTestId('x-picker-empty');
    // English i18n round-trip — guards against accidental hardcoding in JSX.
    expect(empty.textContent).toBe(
      'No X candidates — once you pick a Y, factor candidates appear here.'
    );
    // Headline still anchors the section.
    expect(screen.getByTestId('x-picker-headline')).toBeInTheDocument();
    // No chips, no selected row, no available row.
    expect(screen.queryAllByTestId('column-candidate-chip')).toHaveLength(0);
    expect(screen.queryByTestId('x-picker-selected-row')).toBeNull();
    expect(screen.queryByTestId('x-picker-available-row')).toBeNull();
  });

  it('clicking a selected chip again fires onToggleX (toggle behavior at callback level)', () => {
    const onToggleX = vi.fn();
    render(
      <XPickerSection
        candidates={defaultCandidates}
        selectedXs={['Material_Type']}
        onToggleX={onToggleX}
      />
    );
    const selectedRow = screen.getByTestId('x-picker-selected-row');
    const selectedChip = within(selectedRow).getByTestId('column-candidate-chip');
    fireEvent.click(selectedChip);
    expect(onToggleX).toHaveBeenCalledWith('Material_Type');
    expect(onToggleX).toHaveBeenCalledTimes(1);
  });

  it('renders both numeric and categorical candidates with type-appropriate previews', () => {
    const mixed: XCandidate[] = [
      numericCandidate('Numeric_Col', [10, 20, 30, 40, 50]),
      categoricalCandidate('Categorical_Col', [
        { label: 'X', count: 3 },
        { label: 'Y', count: 2 },
      ]),
    ];
    render(<XPickerSection candidates={mixed} selectedXs={[]} onToggleX={vi.fn()} />);
    const chips = screen.getAllByTestId('column-candidate-chip');
    expect(chips).toHaveLength(2);

    // Numeric chip: stats line should include n=5 (deterministic count).
    const numericChip = chips.find(c => c.textContent?.includes('Numeric_Col'));
    expect(numericChip).toBeDefined();
    expect(numericChip!.textContent).toContain('n=5');

    // Categorical chip: stats line should include level labels and total count.
    const categoricalChip = chips.find(c => c.textContent?.includes('Categorical_Col'));
    expect(categoricalChip).toBeDefined();
    expect(categoricalChip!.textContent).toContain('X');
    expect(categoricalChip!.textContent).toContain('Y');
    expect(categoricalChip!.textContent).toContain('n=5');
  });
});
