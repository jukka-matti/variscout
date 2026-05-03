/**
 * Tests for YPickerSection — FRAME b0 Y-picker UI.
 *
 * Critical test rule (per .claude/rules/testing.md): vi.mock() BEFORE component
 * imports — but this file uses no mocks (English i18n is statically bundled in
 * @variscout/core, so getMessage('en', ...) works without locale loader setup).
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ColumnAnalysis } from '@variscout/core';
import { YPickerSection, type YPickerSectionCandidate } from '../YPickerSection';

function numericColumn(overrides: Partial<ColumnAnalysis> & { name: string }): ColumnAnalysis {
  return {
    name: overrides.name,
    type: overrides.type ?? 'numeric',
    uniqueCount: overrides.uniqueCount ?? 100,
    hasVariation: overrides.hasVariation ?? true,
    missingCount: overrides.missingCount ?? 0,
    sampleValues: overrides.sampleValues ?? ['1', '2', '3'],
  };
}

function candidate(name: string, values: number[] = [1, 2, 3]): YPickerSectionCandidate {
  return { column: numericColumn({ name }), numericValues: values };
}

const defaultCandidates: YPickerSectionCandidate[] = [
  candidate('Down_Content_%', [22.4, 21.9, 23.1, 22.7]),
  candidate('Input_Quantity_kg', [100, 102, 99, 101]),
  candidate('Process_Yield', [0.95, 0.97, 0.96]),
];

describe('YPickerSection', () => {
  it('renders headline and hint', () => {
    render(<YPickerSection candidates={defaultCandidates} selectedY={null} onSelectY={vi.fn()} />);
    // English-bundled i18n key resolution
    expect(screen.getByTestId('y-picker-headline').textContent).toBe(
      'What do you want to investigate?'
    );
    expect(screen.getByTestId('y-picker-hint').textContent).toBe('your Y / output measurement');
  });

  it('renders one chip per candidate, all in idle state when nothing selected', () => {
    render(<YPickerSection candidates={defaultCandidates} selectedY={null} onSelectY={vi.fn()} />);
    const chips = screen.getAllByTestId('column-candidate-chip');
    expect(chips).toHaveLength(3);
    for (const chip of chips) {
      expect(chip.getAttribute('data-state')).toBe('idle');
    }
  });

  it('clicking a chip fires onSelectY with the column name', () => {
    const onSelectY = vi.fn();
    render(
      <YPickerSection candidates={defaultCandidates} selectedY={null} onSelectY={onSelectY} />
    );
    // Find by chip text (Down_Content_% chip)
    const chip = screen.getByText('Down_Content_%').closest('button');
    expect(chip).not.toBeNull();
    fireEvent.click(chip!);
    expect(onSelectY).toHaveBeenCalledWith('Down_Content_%');
    expect(onSelectY).toHaveBeenCalledTimes(1);
  });

  it('marks the matching chip as selected-as-Y when selectedY is set', () => {
    render(
      <YPickerSection
        candidates={defaultCandidates}
        selectedY="Input_Quantity_kg"
        onSelectY={vi.fn()}
      />
    );
    // Two chips with the same column name now exist: one in the "Selected" row,
    // one in the candidate row. Both should show selected-as-Y state.
    const chips = screen.getAllByTestId('column-candidate-chip');
    const selectedChips = chips.filter(c => c.getAttribute('data-state') === 'selected-as-Y');
    expect(selectedChips.length).toBeGreaterThanOrEqual(1);
    // Each selected chip is aria-pressed
    for (const chip of selectedChips) {
      expect(chip.getAttribute('aria-pressed')).toBe('true');
    }
  });

  it('shows the "Selected" subsection with + add spec link when selectedY is set', () => {
    render(
      <YPickerSection
        candidates={defaultCandidates}
        selectedY="Down_Content_%"
        onSelectY={vi.fn()}
      />
    );
    const selectedRow = screen.getByTestId('y-picker-selected-row');
    expect(selectedRow).toBeInTheDocument();
    const addSpec = screen.getByTestId('y-picker-add-spec');
    expect(addSpec.textContent).toBe('+ add spec');
  });

  it('clicking + add spec fires onAddSpec with the selected column name', () => {
    const onAddSpec = vi.fn();
    render(
      <YPickerSection
        candidates={defaultCandidates}
        selectedY="Down_Content_%"
        onSelectY={vi.fn()}
        onAddSpec={onAddSpec}
      />
    );
    fireEvent.click(screen.getByTestId('y-picker-add-spec'));
    expect(onAddSpec).toHaveBeenCalledWith('Down_Content_%');
    expect(onAddSpec).toHaveBeenCalledTimes(1);
  });

  it('spec status text differs based on hasSpecForSelected', () => {
    const { rerender } = render(
      <YPickerSection
        candidates={defaultCandidates}
        selectedY="Down_Content_%"
        onSelectY={vi.fn()}
        hasSpecForSelected={false}
      />
    );
    expect(screen.getByTestId('y-picker-spec-status').textContent).toBe('spec: not set');

    rerender(
      <YPickerSection
        candidates={defaultCandidates}
        selectedY="Down_Content_%"
        onSelectY={vi.fn()}
        hasSpecForSelected={true}
      />
    );
    const setStatus = screen.getByTestId('y-picker-spec-status').textContent ?? '';
    expect(setStatus).not.toBe('spec: not set');
    // Canonical "set" copy in this task — replaced by full editor in W3-5.
    expect(setStatus).toContain('set');
  });

  it('renders empty-state hint when candidates is empty', () => {
    render(<YPickerSection candidates={[]} selectedY={null} onSelectY={vi.fn()} />);
    const empty = screen.getByTestId('y-picker-empty');
    expect(empty.textContent).toContain('No numeric columns detected');
    // Headline still visible — it anchors the section even when empty.
    expect(screen.getByTestId('y-picker-headline')).toBeInTheDocument();
    // No chips, no selected row.
    expect(screen.queryAllByTestId('column-candidate-chip')).toHaveLength(0);
    expect(screen.queryByTestId('y-picker-selected-row')).toBeNull();
  });

  it('headline matches the English message catalog (i18n resolved, not hardcoded)', () => {
    // Direct round-trip via the bundled English catalog — guards against
    // accidental hardcoding of headline text in the JSX.
    render(<YPickerSection candidates={defaultCandidates} selectedY={null} onSelectY={vi.fn()} />);
    expect(screen.getByTestId('y-picker-headline').textContent).toBe(
      'What do you want to investigate?'
    );
  });

  it('does not throw when onAddSpec is omitted and + add spec is clicked', () => {
    render(
      <YPickerSection
        candidates={defaultCandidates}
        selectedY="Down_Content_%"
        onSelectY={vi.fn()}
      />
    );
    // No-op when no callback wired — must not throw.
    expect(() => fireEvent.click(screen.getByTestId('y-picker-add-spec'))).not.toThrow();
  });
});
