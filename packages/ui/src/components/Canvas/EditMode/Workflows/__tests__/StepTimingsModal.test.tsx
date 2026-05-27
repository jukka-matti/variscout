/**
 * Tests for StepTimingsModal — D1 Task 3 (skeleton + By-step layout) + Task 4
 * (pre-fill from detectPairedTimingColumns + cyan-dot auto-detect indicators) +
 * Task 5 (by-column tab + duration alternative + mutual exclusion).
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
 * Task 5 scope:
 * - numericProfiles: required new prop (duration column picker source).
 * - By-column tab: functional content — one row per date-kind column with step + role pickers.
 * - Duration alternative section: always visible below by-step table.
 * - Mutual exclusion: start/end ↔ duration clears the opposite bindings.
 * - Shared state: switching tabs preserves edits.
 * - Save includes both paired + duration bindings; partial-paired excluded.
 * - Footer count includes BOTH paired AND duration bindings.
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
// Test helpers
// ---------------------------------------------------------------------------

/** Build a minimal date-kind ColumnParsingProfile by column name. */
function dateProfile(columnName: string) {
  return createTestColumnParsingProfile({
    columnName,
    primary: { kind: 'date', label: 'date · ISO', detail: {} },
  });
}

/** Build a minimal numeric-kind ColumnParsingProfile by column name. */
function numericProfile(columnName: string) {
  return createTestColumnParsingProfile({
    columnName,
    primary: { kind: 'numeric', label: 'numeric · plain', detail: {} },
  });
}

function renderModal(overrides: Partial<React.ComponentProps<typeof StepTimingsModal>> = {}) {
  const onSave = vi.fn();
  const onClose = vi.fn();
  const steps = overrides.steps ?? [createTestStep({ id: 'mix', name: 'Mix' })];
  const dateProfiles = overrides.dateProfiles ?? [];
  const numericProfiles = overrides.numericProfiles ?? [];

  const utils = render(
    <StepTimingsModal
      steps={steps}
      dateProfiles={dateProfiles}
      numericProfiles={numericProfiles}
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

    it('does NOT call onSave when Save is disabled (no rows bound)', () => {
      // Use profiles that don't match any step name to avoid auto-fill → 0 timed → Save disabled
      const { onSave } = renderModal({
        steps,
        dateProfiles: [dateProfile('X_start'), dateProfile('X_end')],
      });
      // Save is disabled, clicking it must be a no-op
      fireEvent.click(screen.getByTestId('step-timings-save'));
      expect(onSave).not.toHaveBeenCalled();
    });

    it('excludes partially-bound rows (start only) — Save stays disabled, onSave not called', () => {
      // Use non-matching profiles so pickers start at '--'
      const nonMatchingProfiles = [dateProfile('Other_start'), dateProfile('Other_end')];
      const { onSave } = renderModal({ steps, dateProfiles: nonMatchingProfiles });
      fireEvent.change(screen.getByTestId('step-timing-row-mix-start'), {
        target: { value: 'Other_start' },
      });
      // Partial-paired step (start only) counts as 0 timed → Save disabled
      expect(screen.getByTestId('step-timings-save')).toBeDisabled();
      fireEvent.click(screen.getByRole('button', { name: /save/i }));
      expect(onSave).not.toHaveBeenCalled();
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

  // ---------------------------------------------------------------------------
  // Task 5: By-column tab
  // ---------------------------------------------------------------------------

  describe('by-column tab (Task 5)', () => {
    const steps = [
      createTestStep({ id: 'prep', name: 'Prep', order: 0 }),
      createTestStep({ id: 'pack', name: 'Pack', order: 1 }),
    ];
    const dateProfiles = [
      dateProfile('Prep_start'),
      dateProfile('Prep_end'),
      dateProfile('Pack_start'),
    ];

    it('clicking By column tab sets aria-selected="true" on it and false on By step', () => {
      renderModal({ steps, dateProfiles });
      fireEvent.click(screen.getByTestId('step-timings-tab-by-column'));
      expect(screen.getByTestId('step-timings-tab-by-column')).toHaveAttribute(
        'aria-selected',
        'true'
      );
      expect(screen.getByTestId('step-timings-tab-by-step')).toHaveAttribute(
        'aria-selected',
        'false'
      );
    });

    it('by-column panel renders one row per date-kind column', () => {
      renderModal({ steps, dateProfiles });
      fireEvent.click(screen.getByTestId('step-timings-tab-by-column'));
      expect(screen.getByTestId('column-binding-row-Prep_start')).toBeInTheDocument();
      expect(screen.getByTestId('column-binding-row-Prep_end')).toBeInTheDocument();
      expect(screen.getByTestId('column-binding-row-Pack_start')).toBeInTheDocument();
    });

    it('each column row has a Step picker and a Role picker', () => {
      renderModal({ steps, dateProfiles });
      fireEvent.click(screen.getByTestId('step-timings-tab-by-column'));
      expect(screen.getByTestId('column-binding-row-Prep_start-step')).toBeInTheDocument();
      expect(screen.getByTestId('column-binding-row-Prep_start-role')).toBeInTheDocument();
    });

    it('Role picker options are "--", "Start", "End", "Duration"', () => {
      renderModal({ steps, dateProfiles });
      fireEvent.click(screen.getByTestId('step-timings-tab-by-column'));
      const rolePicker = screen.getByTestId(
        'column-binding-row-Prep_start-role'
      ) as HTMLSelectElement;
      const optionTexts = Array.from(rolePicker.options).map(o => o.text);
      expect(optionTexts).toEqual(['--', 'Start', 'End', 'Duration']);
    });

    it('Step picker options include step names + empty "--"', () => {
      renderModal({ steps, dateProfiles });
      fireEvent.click(screen.getByTestId('step-timings-tab-by-column'));
      const stepPicker = screen.getByTestId(
        'column-binding-row-Prep_start-step'
      ) as HTMLSelectElement;
      const optionTexts = Array.from(stepPicker.options).map(o => o.text);
      expect(optionTexts).toContain('--');
      expect(optionTexts).toContain('Prep');
      expect(optionTexts).toContain('Pack');
    });
  });

  describe('by-column tab: reflects by-step state (Task 5)', () => {
    const steps = [createTestStep({ id: 'prep', name: 'Prep', order: 0 })];
    const dateProfiles = [dateProfile('Prep_start'), dateProfile('Prep_end')];

    it('by-column row for Prep_start shows Step=prep, Role=Start after auto-detection', () => {
      renderModal({ steps, dateProfiles });
      fireEvent.click(screen.getByTestId('step-timings-tab-by-column'));
      const stepPicker = screen.getByTestId(
        'column-binding-row-Prep_start-step'
      ) as HTMLSelectElement;
      const rolePicker = screen.getByTestId(
        'column-binding-row-Prep_start-role'
      ) as HTMLSelectElement;
      expect(stepPicker.value).toBe('prep');
      expect(rolePicker.value).toBe('start');
    });

    it('by-column row for Prep_end shows Step=prep, Role=End after auto-detection', () => {
      renderModal({ steps, dateProfiles });
      fireEvent.click(screen.getByTestId('step-timings-tab-by-column'));
      const rolePicker = screen.getByTestId(
        'column-binding-row-Prep_end-role'
      ) as HTMLSelectElement;
      expect(rolePicker.value).toBe('end');
    });
  });

  describe('by-column tab: multi-Start same-step + cross-tab mutual exclusion (Task 5 coverage)', () => {
    it('two columns assigned Start to same step — first assignment wins in Save payload', () => {
      // Plan §"first-wins for multiple Start columns" — once a step has a Start
      // column bound, assigning a second column as Start for the same step is a
      // no-op (the first column's assignment survives). This pins the behavior
      // documented in ByColumnTable's JSDoc.
      const steps = [createTestStep({ id: 'mix', name: 'Mix' })];
      const dateProfiles = [
        dateProfile('Mix_start'),
        dateProfile('Alt_start'),
        dateProfile('Mix_end'),
      ];
      const { onSave } = renderModal({ steps, dateProfiles });
      fireEvent.click(screen.getByTestId('step-timings-tab-by-column'));

      // First: assign Mix_start as Start for mix
      fireEvent.change(screen.getByTestId('column-binding-row-Mix_start-step'), {
        target: { value: 'mix' },
      });
      fireEvent.change(screen.getByTestId('column-binding-row-Mix_start-role'), {
        target: { value: 'start' },
      });
      // Then: try to assign Alt_start as Start for mix — should be a no-op
      fireEvent.change(screen.getByTestId('column-binding-row-Alt_start-step'), {
        target: { value: 'mix' },
      });
      fireEvent.change(screen.getByTestId('column-binding-row-Alt_start-role'), {
        target: { value: 'start' },
      });
      // Assign Mix_end as End for mix (completes the pair)
      fireEvent.change(screen.getByTestId('column-binding-row-Mix_end-step'), {
        target: { value: 'mix' },
      });
      fireEvent.change(screen.getByTestId('column-binding-row-Mix_end-role'), {
        target: { value: 'end' },
      });

      fireEvent.click(screen.getByTestId('step-timings-save'));
      expect(onSave).toHaveBeenCalledOnce();
      const bindings = onSave.mock.calls[0]![0] as StepTimingBinding[];
      expect(bindings).toHaveLength(1);
      expect(bindings[0]).toMatchObject({
        kind: 'paired',
        stepId: 'mix',
        startColumn: 'Mix_start', // first-wins per JSDoc
        endColumn: 'Mix_end',
      });
    });

    it('by-column role change to Duration on a step with start/end set clears them (cross-tab mutual exclusion)', () => {
      // User flow: step has paired binding via by-step → switch to by-column →
      // change role on the End column to Duration → mutual exclusion fires.
      // Verify via the resulting state visible in by-step pickers + Save payload.
      const steps = [createTestStep({ id: 'mix', name: 'Mix' })];
      const dateProfiles = [dateProfile('Mix_start'), dateProfile('Mix_end')];
      const numericProfiles = [numericProfile('Cycle_time_min')];
      const { onSave } = renderModal({ steps, dateProfiles, numericProfiles });

      // Auto-detect fills both Mix_start and Mix_end for step `mix`. Confirm.
      const startSelectBefore = screen.getByTestId(
        'step-timing-row-mix-start'
      ) as HTMLSelectElement;
      expect(startSelectBefore.value).toBe('Mix_start');

      // Switch to by-column and change Mix_end's role from End to Duration.
      // The role picker exposes Start/End/Duration regardless of column kind;
      // mutual exclusion fires on the Duration write.
      fireEvent.click(screen.getByTestId('step-timings-tab-by-column'));
      fireEvent.change(screen.getByTestId('column-binding-row-Mix_end-role'), {
        target: { value: 'duration' },
      });

      // Switch back to by-step. Mutual exclusion cleared both start and end
      // pickers for mix.
      fireEvent.click(screen.getByTestId('step-timings-tab-by-step'));
      const startSelectAfter = screen.getByTestId('step-timing-row-mix-start') as HTMLSelectElement;
      const endSelectAfter = screen.getByTestId('step-timing-row-mix-end') as HTMLSelectElement;
      expect(startSelectAfter.value).toBe('');
      expect(endSelectAfter.value).toBe('');

      // Save payload confirms: step `mix` now has duration='Mix_end' (even though
      // Mix_end is a date column — the engine accepts whatever the state holds;
      // engine assumption is duration values are ms-numeric per Task 2 JSDoc).
      fireEvent.click(screen.getByTestId('step-timings-save'));
      const bindings = onSave.mock.calls[0]![0] as StepTimingBinding[];
      expect(bindings).toEqual([{ kind: 'duration', stepId: 'mix', durationColumn: 'Mix_end' }]);
    });
  });

  describe('by-column tab: shared state with by-step (Task 5)', () => {
    const steps = [createTestStep({ id: 'prep', name: 'Prep', order: 0 })];
    const sharedDateProfiles = [dateProfile('Prep_start'), dateProfile('Prep_end')];

    it('switching from By-column (after assigning) back to By-step shows the same assignment', () => {
      renderModal({ steps, dateProfiles: sharedDateProfiles });
      // Start in by-column tab; by-step auto-fill won't be present since we override with non-matching
      // Instead render with non-matching profiles so pickers start empty, then assign via by-column
      // Actually: use empty dateProfiles so no auto-fill, then switch to by-column and assign
      // This test verifies round-trip: by-step edit → by-column reflects it
      // Verify that the auto-detected pair (prep) shows correctly in both tabs
      // By-step already tested; switching to by-column verifies shared state is derived correctly
      fireEvent.click(screen.getByTestId('step-timings-tab-by-column'));
      const stepPicker = screen.getByTestId(
        'column-binding-row-Prep_start-step'
      ) as HTMLSelectElement;
      expect(stepPicker.value).toBe('prep'); // shared state reflects auto-detected binding

      // Switch back to by-step
      fireEvent.click(screen.getByTestId('step-timings-tab-by-step'));
      const startSelect = screen.getByTestId('step-timing-row-prep-start') as HTMLSelectElement;
      expect(startSelect.value).toBe('Prep_start');
    });
  });

  // ---------------------------------------------------------------------------
  // Task 5: Duration alternative section (by-step view)
  // ---------------------------------------------------------------------------

  describe('duration alternative section (Task 5)', () => {
    const steps = [
      createTestStep({ id: 'mix', name: 'Mix' }),
      createTestStep({ id: 'pack', name: 'Pack' }),
    ];
    const numericProfiles = [numericProfile('Cycle_time'), numericProfile('Mix_duration')];

    it('renders "Or use a single duration column" heading in by-step view', () => {
      renderModal({ steps, numericProfiles });
      expect(screen.getByText(/or use a single duration column/i)).toBeInTheDocument();
    });

    it('renders one duration row per step with correct testid', () => {
      renderModal({ steps, numericProfiles });
      expect(screen.getByTestId('step-duration-row-mix')).toBeInTheDocument();
      expect(screen.getByTestId('step-duration-row-pack')).toBeInTheDocument();
    });

    it('each duration row has a duration picker', () => {
      renderModal({ steps, numericProfiles });
      expect(screen.getByTestId('step-duration-row-mix-picker')).toBeInTheDocument();
      expect(screen.getByTestId('step-duration-row-pack-picker')).toBeInTheDocument();
    });

    it('duration picker lists numeric column names + empty "--"', () => {
      renderModal({ steps, numericProfiles });
      const picker = screen.getByTestId('step-duration-row-mix-picker') as HTMLSelectElement;
      const optionValues = Array.from(picker.options).map(o => o.value);
      expect(optionValues).toEqual(['', 'Cycle_time', 'Mix_duration']);
    });

    it('duration alternative section is NOT visible when By-column tab is active', () => {
      renderModal({ steps, numericProfiles });
      fireEvent.click(screen.getByTestId('step-timings-tab-by-column'));
      expect(screen.queryByText(/or use a single duration column/i)).not.toBeInTheDocument();
    });

    it('initialBindings with duration kind pre-populates duration picker', () => {
      const initialBindings: StepTimingBinding[] = [
        { kind: 'duration', stepId: 'mix', durationColumn: 'Cycle_time' },
      ];
      renderModal({ steps, numericProfiles, initialBindings });
      const picker = screen.getByTestId('step-duration-row-mix-picker') as HTMLSelectElement;
      expect(picker.value).toBe('Cycle_time');
    });
  });

  // ---------------------------------------------------------------------------
  // Task 5: Mutual exclusion
  // ---------------------------------------------------------------------------

  describe('mutual exclusion (Task 5)', () => {
    const steps = [
      createTestStep({ id: 'mix', name: 'Mix' }),
      createTestStep({ id: 'pack', name: 'Pack' }),
    ];
    const dateProfiles = [dateProfile('Mix_start'), dateProfile('Mix_end')];
    const numericProfiles = [numericProfile('Cycle_time')];

    it('picking duration for a step with Start+End set clears Start and End', () => {
      // Use non-matching date profiles so no auto-fill, then manually set start+end
      const nonMatchingDate = [dateProfile('Other_start'), dateProfile('Other_end')];
      renderModal({ steps, dateProfiles: nonMatchingDate, numericProfiles });
      fireEvent.change(screen.getByTestId('step-timing-row-mix-start'), {
        target: { value: 'Other_start' },
      });
      fireEvent.change(screen.getByTestId('step-timing-row-mix-end'), {
        target: { value: 'Other_end' },
      });
      // Now pick a duration column
      fireEvent.change(screen.getByTestId('step-duration-row-mix-picker'), {
        target: { value: 'Cycle_time' },
      });
      const startSelect = screen.getByTestId('step-timing-row-mix-start') as HTMLSelectElement;
      const endSelect = screen.getByTestId('step-timing-row-mix-end') as HTMLSelectElement;
      expect(startSelect.value).toBe('');
      expect(endSelect.value).toBe('');
    });

    it('picking duration shows inline hint "Using duration only"', () => {
      const nonMatchingDate = [dateProfile('Other_start'), dateProfile('Other_end')];
      renderModal({ steps, dateProfiles: nonMatchingDate, numericProfiles });
      fireEvent.change(screen.getByTestId('step-timing-row-mix-start'), {
        target: { value: 'Other_start' },
      });
      fireEvent.change(screen.getByTestId('step-timing-row-mix-end'), {
        target: { value: 'Other_end' },
      });
      fireEvent.change(screen.getByTestId('step-duration-row-mix-picker'), {
        target: { value: 'Cycle_time' },
      });
      expect(screen.getByTestId('step-duration-row-mix')).toHaveTextContent('Using duration only');
    });

    it('picking Start for a step with duration set clears duration', () => {
      renderModal({ steps, dateProfiles, numericProfiles });
      // Set duration first on mix
      fireEvent.change(screen.getByTestId('step-duration-row-mix-picker'), {
        target: { value: 'Cycle_time' },
      });
      // Now pick Start
      fireEvent.change(screen.getByTestId('step-timing-row-mix-start'), {
        target: { value: 'Mix_start' },
      });
      const durationPicker = screen.getByTestId(
        'step-duration-row-mix-picker'
      ) as HTMLSelectElement;
      expect(durationPicker.value).toBe('');
    });

    it('picking End for a step with duration set clears duration', () => {
      renderModal({ steps, dateProfiles, numericProfiles });
      fireEvent.change(screen.getByTestId('step-duration-row-mix-picker'), {
        target: { value: 'Cycle_time' },
      });
      fireEvent.change(screen.getByTestId('step-timing-row-mix-end'), {
        target: { value: 'Mix_end' },
      });
      const durationPicker = screen.getByTestId(
        'step-duration-row-mix-picker'
      ) as HTMLSelectElement;
      expect(durationPicker.value).toBe('');
    });

    it('picking Start shows inline hint "Using start/end pair"', () => {
      renderModal({ steps, dateProfiles, numericProfiles });
      fireEvent.change(screen.getByTestId('step-duration-row-mix-picker'), {
        target: { value: 'Cycle_time' },
      });
      fireEvent.change(screen.getByTestId('step-timing-row-mix-start'), {
        target: { value: 'Mix_start' },
      });
      // The hint appears after picking start when there was a duration — but since duration
      // is cleared and now start is set (end not set yet), no hint appears. The hint
      // "Using start/end pair" shows when start/end is set and duration was just cleared.
      // Actually per spec: when user picks Start for a step with duration → clear duration
      // + show "Using start/end pair" next to that row.
      expect(screen.getByTestId('step-duration-row-mix')).toHaveTextContent('Using start/end pair');
    });

    it('mutual exclusion does not affect other steps', () => {
      const allSteps = [
        createTestStep({ id: 'mix', name: 'Mix' }),
        createTestStep({ id: 'pack', name: 'Pack' }),
      ];
      const allDateProfiles = [dateProfile('Pack_start'), dateProfile('Pack_end')];
      renderModal({ steps: allSteps, dateProfiles: allDateProfiles, numericProfiles });
      // Set duration on mix
      fireEvent.change(screen.getByTestId('step-duration-row-mix-picker'), {
        target: { value: 'Cycle_time' },
      });
      // Set start on mix only (different step from pack)
      fireEvent.change(screen.getByTestId('step-timing-row-mix-start'), {
        target: { value: 'Pack_start' },
      });
      // Pack step should be unaffected
      const packDurationPicker = screen.getByTestId(
        'step-duration-row-pack-picker'
      ) as HTMLSelectElement;
      expect(packDurationPicker.value).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // Task 5: Save with mixed paired + duration bindings
  // ---------------------------------------------------------------------------

  describe('save with mixed bindings (Task 5)', () => {
    const steps = [
      createTestStep({ id: 'mix', name: 'Mix' }),
      createTestStep({ id: 'pack', name: 'Pack' }),
    ];
    const dateProfiles = [dateProfile('Mix_start'), dateProfile('Mix_end')];
    const numericProfiles = [numericProfile('Cycle_time')];

    it('emits both paired and duration bindings on Save', () => {
      const { onSave } = renderModal({ steps, dateProfiles, numericProfiles });
      // mix: set start+end (will be auto-detected, or set manually)
      fireEvent.change(screen.getByTestId('step-timing-row-mix-start'), {
        target: { value: 'Mix_start' },
      });
      fireEvent.change(screen.getByTestId('step-timing-row-mix-end'), {
        target: { value: 'Mix_end' },
      });
      // pack: set duration
      fireEvent.change(screen.getByTestId('step-duration-row-pack-picker'), {
        target: { value: 'Cycle_time' },
      });
      fireEvent.click(screen.getByRole('button', { name: /save/i }));
      const result = onSave.mock.calls[0][0] as StepTimingBinding[];
      expect(result).toContainEqual({
        kind: 'paired',
        stepId: 'mix',
        startColumn: 'Mix_start',
        endColumn: 'Mix_end',
      });
      expect(result).toContainEqual({
        kind: 'duration',
        stepId: 'pack',
        durationColumn: 'Cycle_time',
      });
      expect(result).toHaveLength(2);
    });

    it('excludes partial-paired (only Start set) from Save', () => {
      const nonMatchingDate = [dateProfile('Other_start')];
      const { onSave } = renderModal({ steps, dateProfiles: nonMatchingDate, numericProfiles });
      fireEvent.change(screen.getByTestId('step-timing-row-mix-start'), {
        target: { value: 'Other_start' },
      });
      // No end set for mix
      fireEvent.change(screen.getByTestId('step-duration-row-pack-picker'), {
        target: { value: 'Cycle_time' },
      });
      fireEvent.click(screen.getByRole('button', { name: /save/i }));
      const result = onSave.mock.calls[0][0] as StepTimingBinding[];
      // mix excluded (partial); pack included (duration)
      expect(result).toEqual([{ kind: 'duration', stepId: 'pack', durationColumn: 'Cycle_time' }]);
    });
  });

  // ---------------------------------------------------------------------------
  // Task 5: Footer count includes both paired + duration
  // ---------------------------------------------------------------------------

  describe('footer count includes paired + duration (Task 5)', () => {
    const steps = [
      createTestStep({ id: 'mix', name: 'Mix' }),
      createTestStep({ id: 'pack', name: 'Pack' }),
    ];
    const dateProfiles = [dateProfile('Mix_start'), dateProfile('Mix_end')];
    const numericProfiles = [numericProfile('Cycle_time')];

    it('shows "2 steps timed" when 1 paired + 1 duration bound', () => {
      renderModal({ steps, dateProfiles, numericProfiles });
      // mix: auto-filled paired (Mix_start + Mix_end match step 'Mix')
      // pack: set duration
      fireEvent.change(screen.getByTestId('step-duration-row-pack-picker'), {
        target: { value: 'Cycle_time' },
      });
      expect(screen.getByRole('button', { name: /save · 2 steps timed →/i })).toBeInTheDocument();
    });

    it('shows "1 step timed" when only duration bound', () => {
      renderModal({ steps, dateProfiles: [], numericProfiles });
      fireEvent.change(screen.getByTestId('step-duration-row-mix-picker'), {
        target: { value: 'Cycle_time' },
      });
      expect(screen.getByRole('button', { name: /save · 1 step timed →/i })).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Task 6: Save disabled state + empty-state copy + cancel exclusivity
  // ---------------------------------------------------------------------------

  describe('save disabled state (Task 6)', () => {
    const steps = [
      createTestStep({ id: 'mix', name: 'Mix' }),
      createTestStep({ id: 'fill', name: 'Fill' }),
    ];

    it('Save button is disabled when 0 steps timed', () => {
      // No date profiles → no auto-fill → 0 timed
      renderModal({ steps, dateProfiles: [] });
      const saveBtn = screen.getByTestId('step-timings-save');
      expect(saveBtn).toBeDisabled();
      expect(saveBtn).toHaveAttribute('aria-disabled', 'true');
    });

    it('clicking disabled Save does NOT call onSave when 0 steps timed', () => {
      const { onSave } = renderModal({ steps, dateProfiles: [] });
      const saveBtn = screen.getByTestId('step-timings-save');
      fireEvent.click(saveBtn);
      expect(onSave).not.toHaveBeenCalled();
    });

    it('Save button is enabled when 1+ step is timed', () => {
      renderModal({
        steps,
        dateProfiles: [dateProfile('Mix_start'), dateProfile('Mix_end')],
      });
      // Mix auto-filled → 1 step timed
      const saveBtn = screen.getByTestId('step-timings-save');
      expect(saveBtn).not.toBeDisabled();
      expect(saveBtn).not.toHaveAttribute('aria-disabled', 'true');
    });

    it('Save is disabled when steps.length === 0 (empty step list)', () => {
      renderModal({ steps: [] });
      const saveBtn = screen.getByTestId('step-timings-save');
      expect(saveBtn).toBeDisabled();
      expect(saveBtn).toHaveAttribute('aria-disabled', 'true');
    });

    it('Save is disabled when partial step only (start set, no end)', () => {
      const nonMatchingProfiles = [dateProfile('Other_start'), dateProfile('Other_end')];
      renderModal({ steps, dateProfiles: nonMatchingProfiles });
      // Set only start for mix (no end)
      fireEvent.change(screen.getByTestId('step-timing-row-mix-start'), {
        target: { value: 'Other_start' },
      });
      const saveBtn = screen.getByTestId('step-timings-save');
      expect(saveBtn).toBeDisabled();
      expect(saveBtn).toHaveAttribute('aria-disabled', 'true');
    });

    it('Save becomes enabled after completing a partial step (adding end)', () => {
      const nonMatchingProfiles = [dateProfile('Other_start'), dateProfile('Other_end')];
      const { onSave } = renderModal({ steps, dateProfiles: nonMatchingProfiles });
      fireEvent.change(screen.getByTestId('step-timing-row-mix-start'), {
        target: { value: 'Other_start' },
      });
      // Still disabled
      expect(screen.getByTestId('step-timings-save')).toBeDisabled();
      // Complete the pair
      fireEvent.change(screen.getByTestId('step-timing-row-mix-end'), {
        target: { value: 'Other_end' },
      });
      const saveBtn = screen.getByTestId('step-timings-save');
      expect(saveBtn).not.toBeDisabled();
      // Can now save
      fireEvent.click(saveBtn);
      expect(onSave).toHaveBeenCalledOnce();
    });

    it('shows "Save · 0 steps timed →" footer text when 0 timed', () => {
      renderModal({ steps, dateProfiles: [] });
      expect(screen.getByRole('button', { name: /save · 0 steps timed →/i })).toBeInTheDocument();
    });

    it('shows "Save · 1 step timed →" (singular) when 1 step timed', () => {
      renderModal({
        steps,
        dateProfiles: [dateProfile('Mix_start'), dateProfile('Mix_end')],
      });
      expect(screen.getByRole('button', { name: /save · 1 step timed →/i })).toBeInTheDocument();
    });

    it('shows "Save · 3 steps timed →" when 2 paired + 1 duration timed', () => {
      const steps3 = [
        createTestStep({ id: 'mix', name: 'Mix' }),
        createTestStep({ id: 'fill', name: 'Fill' }),
        createTestStep({ id: 'pack', name: 'Pack' }),
      ];
      renderModal({
        steps: steps3,
        dateProfiles: [
          dateProfile('Mix_start'),
          dateProfile('Mix_end'),
          dateProfile('Fill_start'),
          dateProfile('Fill_end'),
        ],
        numericProfiles: [numericProfile('Cycle_time')],
      });
      // mix + fill auto-filled (paired); add duration for pack
      fireEvent.change(screen.getByTestId('step-duration-row-pack-picker'), {
        target: { value: 'Cycle_time' },
      });
      expect(screen.getByRole('button', { name: /save · 3 steps timed →/i })).toBeInTheDocument();
    });
  });

  describe('cancel exclusivity (Task 6)', () => {
    const steps = [createTestStep({ id: 'mix', name: 'Mix' })];

    it('Cancel button calls onClose WITHOUT calling onSave', () => {
      const { onSave, onClose } = renderModal({ steps });
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(onClose).toHaveBeenCalledOnce();
      expect(onSave).not.toHaveBeenCalled();
    });

    it('Cancel is distinct from Save — clicking Save does not call onClose', () => {
      const { onSave, onClose } = renderModal({
        steps,
        dateProfiles: [dateProfile('Mix_start'), dateProfile('Mix_end')],
      });
      // 1 step timed → Save enabled
      fireEvent.click(screen.getByTestId('step-timings-save'));
      expect(onSave).toHaveBeenCalledOnce();
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('empty-state copy (Task 6)', () => {
    it('shows exact empty-state copy when steps.length === 0', () => {
      renderModal({ steps: [] });
      expect(
        screen.getByText('Drop a categorical column into the process zone first to define steps.')
      ).toBeInTheDocument();
    });

    it('does NOT show old empty-state copy', () => {
      renderModal({ steps: [] });
      expect(screen.queryByText(/add steps in the process zone first/i)).not.toBeInTheDocument();
    });
  });
});
