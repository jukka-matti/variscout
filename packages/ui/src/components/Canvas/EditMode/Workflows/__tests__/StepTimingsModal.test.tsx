/**
 * Tests for StepTimingsModal — D1 Task 3 (skeleton + By-step layout) + Task 4
 * (pre-fill from detectPairedTimingColumns + cyan-dot auto-detect indicators).
 *
 * Task 3 scope:
 * - FocusTrap shell with backdrop + Escape/click close (mirror AddActionDialog).
 * - role="dialog" + aria-labelledby pointing at the heading.
 * - Header copy.
 * - Tabs: "By step" (default, aria-selected="true") + "By column" (present, deferred).
 * - One row per step. Each row: name + Start ▾ <select> + End ▾ <select> + Duration cell.
 * - Save returns only fully-bound (start+end set) rows; bindings carry kind: 'paired'.
 * - Footer copy: "Save · N step(s) timed →".
 *
 * Task 4 scope:
 * - Prop API: `dateColumns` replaced by `dateProfiles: ColumnParsingProfile[]`.
 * - detectPairedTimingColumns pre-fills Start/End pickers (matchedStepId !== null only).
 * - Cyan-dot indicators (data-testid + aria-label="Auto-detected") on auto-filled pickers.
 * - Manual override clears ONLY that picker's dot; sibling dot remains.
 * - initialBindings take precedence over auto-detection; no dot shown for those pickers.
 * - useMemo-based detection (runs on mount + when dateProfiles/steps change).
 *
 * Task 5 wires the By-column tab content + duration alternative + mutual exclusion;
 * Task 6 polishes the footer. Not in scope here.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { StepTimingBinding } from '@variscout/core';
import { StepTimingsModal } from '../StepTimingsModal';
import { createTestStep } from '../../../../../test-utils/step';
import { createTestStepTiming } from '../../../../../test-utils/stepTiming';
import { createTestColumnParsingProfile } from '../../../../../test-utils/columnParsingProfile';

// ---------------------------------------------------------------------------
// Test helper: build a minimal date-kind ColumnParsingProfile by column name.
// Re-uses the existing factory from test-utils/columnParsingProfile.ts, which
// defaults to a numeric primary. We override `primary` to kind:'date' since
// detectPairedTimingColumns filters by p.primary?.kind === 'date'.
// ---------------------------------------------------------------------------
function dateProfile(columnName: string) {
  return createTestColumnParsingProfile({
    columnName,
    primary: { kind: 'date', label: 'date · ISO', detail: {} },
  });
}

function renderModal(overrides: Partial<React.ComponentProps<typeof StepTimingsModal>> = {}) {
  const onSave = vi.fn();
  const onClose = vi.fn();
  const steps = overrides.steps ?? [createTestStep({ id: 'mix', name: 'Mix' })];
  const dateProfiles = overrides.dateProfiles ?? [];

  const utils = render(
    <StepTimingsModal
      steps={steps}
      dateProfiles={dateProfiles}
      onSave={onSave}
      onClose={onClose}
      {...overrides}
    />
  );

  return { ...utils, onSave, onClose };
}

describe('StepTimingsModal', () => {
  describe('shell + accessibility', () => {
    it('renders inside FocusTrap with backdrop, dialog role + aria-labelledby pointing at the heading', () => {
      renderModal();
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      // ARIA accessible name comes from the visible heading via aria-labelledby
      // (single source of truth — preferred over aria-label per WCAG).
      const labelId = dialog.getAttribute('aria-labelledby');
      expect(labelId).toBe('step-timings-modal-title');
      expect(document.getElementById(labelId!)).toHaveTextContent('Capture step timings');
      // Backdrop testid present for click-outside close
      expect(screen.getByTestId('step-timings-backdrop')).toBeInTheDocument();
    });

    it('calls onClose when Escape is pressed', () => {
      const { onClose } = renderModal();
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('calls onClose when backdrop is clicked', () => {
      const { onClose } = renderModal();
      fireEvent.click(screen.getByTestId('step-timings-backdrop'));
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('renders header copy: "Capture step timings"', () => {
      renderModal();
      expect(screen.getByRole('heading', { name: 'Capture step timings' })).toBeInTheDocument();
    });
  });

  describe('tabs', () => {
    it('renders "By step" tab as selected by default', () => {
      renderModal();
      const byStepTab = screen.getByRole('tab', { name: /by step/i });
      expect(byStepTab).toHaveAttribute('aria-selected', 'true');
    });

    it('renders "By column" tab (not selected by default)', () => {
      renderModal();
      const byColumnTab = screen.getByRole('tab', { name: /by column/i });
      expect(byColumnTab).toBeInTheDocument();
      expect(byColumnTab).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('by-step table layout', () => {
    const steps = [
      createTestStep({ id: 'mix', name: 'Mix' }),
      createTestStep({ id: 'fill', name: 'Fill' }),
    ];
    const dateProfiles = [
      dateProfile('Mix_start'),
      dateProfile('Mix_end'),
      dateProfile('Fill_start'),
    ];

    it('renders one row per step', () => {
      renderModal({ steps, dateProfiles });
      // Each step row carries a testid for unambiguous lookup
      expect(screen.getByTestId('step-timing-row-mix')).toBeInTheDocument();
      expect(screen.getByTestId('step-timing-row-fill')).toBeInTheDocument();
    });

    it('shows step name in each row', () => {
      renderModal({ steps, dateProfiles });
      const mixRow = screen.getByTestId('step-timing-row-mix');
      const fillRow = screen.getByTestId('step-timing-row-fill');
      expect(mixRow).toHaveTextContent('Mix');
      expect(fillRow).toHaveTextContent('Fill');
    });

    it('renders Start ▾ and End ▾ pickers in each row', () => {
      renderModal({ steps, dateProfiles });
      expect(screen.getByTestId('step-timing-row-mix-start')).toBeInTheDocument();
      expect(screen.getByTestId('step-timing-row-mix-end')).toBeInTheDocument();
      expect(screen.getByTestId('step-timing-row-fill-start')).toBeInTheDocument();
      expect(screen.getByTestId('step-timing-row-fill-end')).toBeInTheDocument();
    });

    it('renders a Duration preview cell in each row', () => {
      renderModal({ steps, dateProfiles });
      expect(screen.getByTestId('step-timing-row-mix-duration')).toBeInTheDocument();
      expect(screen.getByTestId('step-timing-row-fill-duration')).toBeInTheDocument();
    });

    it('Start picker options list only date columns + an empty "--" option', () => {
      renderModal({ steps, dateProfiles });
      const startSelect = screen.getByTestId('step-timing-row-mix-start') as HTMLSelectElement;
      const optionValues = Array.from(startSelect.options).map(o => o.value);
      expect(optionValues).toEqual(['', 'Mix_start', 'Mix_end', 'Fill_start']);
    });

    it('End picker options list only date columns + an empty "--" option', () => {
      renderModal({ steps, dateProfiles });
      const endSelect = screen.getByTestId('step-timing-row-mix-end') as HTMLSelectElement;
      const optionValues = Array.from(endSelect.options).map(o => o.value);
      expect(optionValues).toEqual(['', 'Mix_start', 'Mix_end', 'Fill_start']);
    });

    it('handles empty steps gracefully (no warnings, no rows)', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      renderModal({ steps: [], dateProfiles });
      expect(screen.queryByTestId(/^step-timing-row-/)).not.toBeInTheDocument();
      expect(warn).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
      warn.mockRestore();
      error.mockRestore();
    });
  });

  describe('save behavior', () => {
    const steps = [
      createTestStep({ id: 'mix', name: 'Mix' }),
      createTestStep({ id: 'fill', name: 'Fill' }),
    ];
    const dateProfiles = [
      dateProfile('Mix_start'),
      dateProfile('Mix_end'),
      dateProfile('Fill_start'),
      dateProfile('Fill_end'),
    ];

    it('calls onSave with empty array when no rows are bound', () => {
      // Use profiles that don't match any step name to avoid auto-fill
      const { onSave } = renderModal({
        steps,
        dateProfiles: [dateProfile('X_start'), dateProfile('X_end')],
      });
      fireEvent.click(screen.getByRole('button', { name: /save/i }));
      expect(onSave).toHaveBeenCalledOnce();
      expect(onSave).toHaveBeenCalledWith([]);
    });

    it('excludes partially-bound rows (start only)', () => {
      // Use non-matching profiles so pickers start at '--'
      const nonMatchingProfiles = [dateProfile('Other_start'), dateProfile('Other_end')];
      const { onSave } = renderModal({ steps, dateProfiles: nonMatchingProfiles });
      fireEvent.change(screen.getByTestId('step-timing-row-mix-start'), {
        target: { value: 'Other_start' },
      });
      fireEvent.click(screen.getByRole('button', { name: /save/i }));
      expect(onSave).toHaveBeenCalledWith([]);
    });

    it('includes only fully-bound rows in the onSave payload', () => {
      // Use non-matching profiles so pickers start at '--', then user manually selects
      const nonMatchingProfiles = [
        dateProfile('Other_start'),
        dateProfile('Other_end'),
        dateProfile('Another_start'),
        dateProfile('Another_end'),
      ];
      const { onSave } = renderModal({ steps, dateProfiles: nonMatchingProfiles });
      fireEvent.change(screen.getByTestId('step-timing-row-mix-start'), {
        target: { value: 'Other_start' },
      });
      fireEvent.change(screen.getByTestId('step-timing-row-mix-end'), {
        target: { value: 'Other_end' },
      });
      // Fill row only has start set → excluded
      fireEvent.change(screen.getByTestId('step-timing-row-fill-start'), {
        target: { value: 'Another_start' },
      });
      fireEvent.click(screen.getByRole('button', { name: /save/i }));
      const expected: StepTimingBinding[] = [
        { kind: 'paired', stepId: 'mix', startColumn: 'Other_start', endColumn: 'Other_end' },
      ];
      expect(onSave).toHaveBeenCalledWith(expected);
    });

    it('includes all fully-bound rows when every row has start + end', () => {
      const { onSave } = renderModal({ steps, dateProfiles });
      fireEvent.change(screen.getByTestId('step-timing-row-mix-start'), {
        target: { value: 'Mix_start' },
      });
      fireEvent.change(screen.getByTestId('step-timing-row-mix-end'), {
        target: { value: 'Mix_end' },
      });
      fireEvent.change(screen.getByTestId('step-timing-row-fill-start'), {
        target: { value: 'Fill_start' },
      });
      fireEvent.change(screen.getByTestId('step-timing-row-fill-end'), {
        target: { value: 'Fill_end' },
      });
      fireEvent.click(screen.getByRole('button', { name: /save/i }));
      const expected: StepTimingBinding[] = [
        { kind: 'paired', stepId: 'mix', startColumn: 'Mix_start', endColumn: 'Mix_end' },
        { kind: 'paired', stepId: 'fill', startColumn: 'Fill_start', endColumn: 'Fill_end' },
      ];
      expect(onSave).toHaveBeenCalledWith(expected);
    });
  });

  describe('footer copy', () => {
    const steps = [
      createTestStep({ id: 'mix', name: 'Mix' }),
      createTestStep({ id: 'fill', name: 'Fill' }),
    ];

    it('shows "0 steps timed" when no rows are bound', () => {
      // Non-matching profiles so no auto-fill
      renderModal({ steps, dateProfiles: [] });
      expect(screen.getByRole('button', { name: /save · 0 steps timed →/i })).toBeInTheDocument();
    });

    it('shows "1 step timed" when one row is fully bound', () => {
      renderModal({
        steps,
        dateProfiles: [dateProfile('Mix_start'), dateProfile('Mix_end')],
      });
      // Mix is auto-filled → fully bound
      expect(screen.getByRole('button', { name: /save · 1 step timed →/i })).toBeInTheDocument();
    });

    it('shows "2 steps timed" when two rows are fully bound', () => {
      renderModal({
        steps,
        dateProfiles: [
          dateProfile('Mix_start'),
          dateProfile('Mix_end'),
          dateProfile('Fill_start'),
          dateProfile('Fill_end'),
        ],
      });
      // Both rows auto-filled → 2 steps timed
      expect(screen.getByRole('button', { name: /save · 2 steps timed →/i })).toBeInTheDocument();
    });
  });

  describe('initialBindings', () => {
    it('pre-populates pickers from paired initialBindings', () => {
      const steps = [createTestStep({ id: 'mix', name: 'Mix' })];
      const dateProfiles = [dateProfile('Mix_start'), dateProfile('Mix_end')];
      const initialBindings: StepTimingBinding[] = [
        createTestStepTiming({
          kind: 'paired',
          stepId: 'mix',
          startColumn: 'Mix_start',
          endColumn: 'Mix_end',
        }),
      ];
      renderModal({ steps, dateProfiles, initialBindings });
      const startSelect = screen.getByTestId('step-timing-row-mix-start') as HTMLSelectElement;
      const endSelect = screen.getByTestId('step-timing-row-mix-end') as HTMLSelectElement;
      expect(startSelect.value).toBe('Mix_start');
      expect(endSelect.value).toBe('Mix_end');
    });
  });

  // ---------------------------------------------------------------------------
  // Task 4: auto-detection pre-fill + cyan-dot indicators
  // ---------------------------------------------------------------------------

  describe('auto-detection pre-fill (Task 4)', () => {
    const steps = [
      createTestStep({ id: 'prep', name: 'Prep', order: 0 }),
      createTestStep({ id: 'pack', name: 'Pack', order: 1 }),
    ];
    const allProfiles = [
      dateProfile('Prep_start'),
      dateProfile('Prep_end'),
      dateProfile('Pack_start'),
      dateProfile('Pack_end'),
    ];

    it('pre-selects Start picker with detected start column on open', () => {
      renderModal({ steps, dateProfiles: allProfiles });
      const prepStart = screen.getByTestId('step-timing-row-prep-start') as HTMLSelectElement;
      expect(prepStart.value).toBe('Prep_start');
    });

    it('pre-selects End picker with detected end column on open', () => {
      renderModal({ steps, dateProfiles: allProfiles });
      const prepEnd = screen.getByTestId('step-timing-row-prep-end') as HTMLSelectElement;
      expect(prepEnd.value).toBe('Prep_end');
    });

    it('pre-selects Pack Start and End pickers', () => {
      renderModal({ steps, dateProfiles: allProfiles });
      const packStart = screen.getByTestId('step-timing-row-pack-start') as HTMLSelectElement;
      const packEnd = screen.getByTestId('step-timing-row-pack-end') as HTMLSelectElement;
      expect(packStart.value).toBe('Pack_start');
      expect(packEnd.value).toBe('Pack_end');
    });

    it('renders cyan-dot for auto-detected Prep Start picker', () => {
      renderModal({ steps, dateProfiles: allProfiles });
      const dot = screen.getByTestId('step-timing-row-prep-start-auto-dot');
      expect(dot).toBeInTheDocument();
      expect(dot).toHaveAttribute('aria-label', 'Auto-detected');
    });

    it('renders cyan-dot for auto-detected Prep End picker', () => {
      renderModal({ steps, dateProfiles: allProfiles });
      const dot = screen.getByTestId('step-timing-row-prep-end-auto-dot');
      expect(dot).toBeInTheDocument();
      expect(dot).toHaveAttribute('aria-label', 'Auto-detected');
    });

    it('renders cyan-dot for auto-detected Pack Start picker', () => {
      renderModal({ steps, dateProfiles: allProfiles });
      const dot = screen.getByTestId('step-timing-row-pack-start-auto-dot');
      expect(dot).toBeInTheDocument();
      expect(dot).toHaveAttribute('aria-label', 'Auto-detected');
    });

    it('renders cyan-dot for auto-detected Pack End picker', () => {
      renderModal({ steps, dateProfiles: allProfiles });
      const dot = screen.getByTestId('step-timing-row-pack-end-auto-dot');
      expect(dot).toBeInTheDocument();
      expect(dot).toHaveAttribute('aria-label', 'Auto-detected');
    });

    it('does NOT render dots when dateProfiles produce no matches', () => {
      const steps2 = [createTestStep({ id: 'mix', name: 'Mix' })];
      // Non-matching profiles (no _start/_end pair)
      renderModal({ steps: steps2, dateProfiles: [dateProfile('Unrelated_col')] });
      expect(screen.queryByTestId(/auto-dot/)).not.toBeInTheDocument();
    });

    it('ignores pairs with matchedStepId null (prefix does not match any step name)', () => {
      const steps2 = [createTestStep({ id: 'mix', name: 'Mix' })];
      // Profiles pair correctly but prefix 'Other' doesn't match step 'Mix'
      renderModal({
        steps: steps2,
        dateProfiles: [dateProfile('Other_start'), dateProfile('Other_end')],
      });
      const startSelect = screen.getByTestId('step-timing-row-mix-start') as HTMLSelectElement;
      expect(startSelect.value).toBe('');
      expect(screen.queryByTestId(/auto-dot/)).not.toBeInTheDocument();
    });
  });

  describe('auto-detection: user override clears dot for that picker only (Task 4)', () => {
    const steps = [
      createTestStep({ id: 'prep', name: 'Prep', order: 0 }),
      createTestStep({ id: 'pack', name: 'Pack', order: 1 }),
    ];
    const allProfiles = [
      dateProfile('Prep_start'),
      dateProfile('Prep_end'),
      dateProfile('Pack_start'),
      dateProfile('Pack_end'),
    ];

    it('removes cyan-dot for overridden Prep End picker after user change', () => {
      renderModal({ steps, dateProfiles: allProfiles });
      // Override Prep End
      fireEvent.change(screen.getByTestId('step-timing-row-prep-end'), {
        target: { value: 'Pack_end' },
      });
      expect(screen.queryByTestId('step-timing-row-prep-end-auto-dot')).not.toBeInTheDocument();
    });

    it('keeps cyan-dot for Prep Start after Prep End override', () => {
      renderModal({ steps, dateProfiles: allProfiles });
      fireEvent.change(screen.getByTestId('step-timing-row-prep-end'), {
        target: { value: 'Pack_end' },
      });
      // Start dot should still be present
      expect(screen.getByTestId('step-timing-row-prep-start-auto-dot')).toBeInTheDocument();
    });

    it('emits the user-overridden value (not the auto-detected one) on Save', () => {
      const { onSave } = renderModal({ steps, dateProfiles: allProfiles });
      fireEvent.change(screen.getByTestId('step-timing-row-prep-end'), {
        target: { value: 'Pack_end' },
      });
      fireEvent.click(screen.getByRole('button', { name: /save/i }));
      // Check the Prep binding uses the overridden end column
      const calls = onSave.mock.calls[0][0] as StepTimingBinding[];
      const prepBinding = calls.find(b => b.stepId === 'prep');
      expect(prepBinding).toBeDefined();
      expect((prepBinding as Extract<StepTimingBinding, { kind: 'paired' }>).endColumn).toBe(
        'Pack_end'
      );
    });
  });

  describe('auto-detection: initialBindings take precedence (Task 4)', () => {
    it('uses initialBindings value over auto-detected value when both exist for same step', () => {
      const steps = [createTestStep({ id: 'prep', name: 'Prep', order: 0 })];
      // Profiles would auto-detect Prep_start / Prep_end
      const allProfiles = [dateProfile('Prep_start'), dateProfile('Prep_end')];
      // But initialBindings provides explicit values
      const initialBindings: StepTimingBinding[] = [
        createTestStepTiming({
          kind: 'paired',
          stepId: 'prep',
          startColumn: 'Prep_start',
          endColumn: 'Prep_end',
        }),
      ];
      renderModal({ steps, dateProfiles: allProfiles, initialBindings });
      // Values are set (from initialBindings)
      const startSelect = screen.getByTestId('step-timing-row-prep-start') as HTMLSelectElement;
      const endSelect = screen.getByTestId('step-timing-row-prep-end') as HTMLSelectElement;
      expect(startSelect.value).toBe('Prep_start');
      expect(endSelect.value).toBe('Prep_end');
      // But NO cyan dots — because the value came from saved binding, not auto-detection
      expect(screen.queryByTestId('step-timing-row-prep-start-auto-dot')).not.toBeInTheDocument();
      expect(screen.queryByTestId('step-timing-row-prep-end-auto-dot')).not.toBeInTheDocument();
    });
  });
});
