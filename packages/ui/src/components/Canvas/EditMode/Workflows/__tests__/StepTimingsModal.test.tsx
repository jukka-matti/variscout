/**
 * Tests for StepTimingsModal — D1 Task 3 (skeleton + By-step layout).
 *
 * Scope of this task:
 * - FocusTrap shell with backdrop + Escape/click close (mirror AddActionDialog).
 * - role="dialog" + aria-label="Capture step timings".
 * - Header copy.
 * - Tabs: "By step" (default, aria-selected="true") + "By column" (present, deferred).
 * - One row per step. Each row: name + Start ▾ <select> + End ▾ <select> + Duration cell.
 * - Save returns only fully-bound (start+end set) rows; bindings carry kind: 'paired'.
 * - Footer copy: "Save · N step(s) timed →".
 *
 * Task 4 wires pre-fill; Task 5 wires the By-column tab content + duration alternative;
 * Task 6 polishes the footer. Not in scope here.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { StepTimingBinding } from '@variscout/core';
import { StepTimingsModal } from '../StepTimingsModal';
import { createTestStep } from '../../../../../test-utils/step';

function renderModal(overrides: Partial<React.ComponentProps<typeof StepTimingsModal>> = {}) {
  const onSave = vi.fn();
  const onClose = vi.fn();
  const steps = overrides.steps ?? [createTestStep({ id: 'mix', name: 'Mix' })];
  const dateColumns = overrides.dateColumns ?? [];

  const utils = render(
    <StepTimingsModal
      steps={steps}
      dateColumns={dateColumns}
      onSave={onSave}
      onClose={onClose}
      {...overrides}
    />
  );

  return { ...utils, onSave, onClose };
}

describe('StepTimingsModal', () => {
  describe('shell + accessibility', () => {
    it('renders inside FocusTrap with backdrop, dialog role + aria-label', () => {
      renderModal();
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-label', 'Capture step timings');
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
    const dateColumns = ['Mix_start', 'Mix_end', 'Fill_start'];

    it('renders one row per step', () => {
      renderModal({ steps, dateColumns });
      // Each step row carries a testid for unambiguous lookup
      expect(screen.getByTestId('step-timing-row-mix')).toBeInTheDocument();
      expect(screen.getByTestId('step-timing-row-fill')).toBeInTheDocument();
    });

    it('shows step name in each row', () => {
      renderModal({ steps, dateColumns });
      const mixRow = screen.getByTestId('step-timing-row-mix');
      const fillRow = screen.getByTestId('step-timing-row-fill');
      expect(mixRow).toHaveTextContent('Mix');
      expect(fillRow).toHaveTextContent('Fill');
    });

    it('renders Start ▾ and End ▾ pickers in each row', () => {
      renderModal({ steps, dateColumns });
      expect(screen.getByTestId('step-timing-row-mix-start')).toBeInTheDocument();
      expect(screen.getByTestId('step-timing-row-mix-end')).toBeInTheDocument();
      expect(screen.getByTestId('step-timing-row-fill-start')).toBeInTheDocument();
      expect(screen.getByTestId('step-timing-row-fill-end')).toBeInTheDocument();
    });

    it('renders a Duration preview cell in each row', () => {
      renderModal({ steps, dateColumns });
      expect(screen.getByTestId('step-timing-row-mix-duration')).toBeInTheDocument();
      expect(screen.getByTestId('step-timing-row-fill-duration')).toBeInTheDocument();
    });

    it('Start picker options list only date columns + an empty "--" option', () => {
      renderModal({ steps, dateColumns });
      const startSelect = screen.getByTestId('step-timing-row-mix-start') as HTMLSelectElement;
      const optionValues = Array.from(startSelect.options).map(o => o.value);
      expect(optionValues).toEqual(['', 'Mix_start', 'Mix_end', 'Fill_start']);
    });

    it('End picker options list only date columns + an empty "--" option', () => {
      renderModal({ steps, dateColumns });
      const endSelect = screen.getByTestId('step-timing-row-mix-end') as HTMLSelectElement;
      const optionValues = Array.from(endSelect.options).map(o => o.value);
      expect(optionValues).toEqual(['', 'Mix_start', 'Mix_end', 'Fill_start']);
    });

    it('handles empty steps gracefully (no warnings, no rows)', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      renderModal({ steps: [], dateColumns });
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
    const dateColumns = ['Mix_start', 'Mix_end', 'Fill_start', 'Fill_end'];

    it('calls onSave with empty array when no rows are bound', () => {
      const { onSave } = renderModal({ steps, dateColumns });
      fireEvent.click(screen.getByRole('button', { name: /save/i }));
      expect(onSave).toHaveBeenCalledOnce();
      expect(onSave).toHaveBeenCalledWith([]);
    });

    it('excludes partially-bound rows (start only)', () => {
      const { onSave } = renderModal({ steps, dateColumns });
      fireEvent.change(screen.getByTestId('step-timing-row-mix-start'), {
        target: { value: 'Mix_start' },
      });
      fireEvent.click(screen.getByRole('button', { name: /save/i }));
      expect(onSave).toHaveBeenCalledWith([]);
    });

    it('includes only fully-bound rows in the onSave payload', () => {
      const { onSave } = renderModal({ steps, dateColumns });
      fireEvent.change(screen.getByTestId('step-timing-row-mix-start'), {
        target: { value: 'Mix_start' },
      });
      fireEvent.change(screen.getByTestId('step-timing-row-mix-end'), {
        target: { value: 'Mix_end' },
      });
      // Fill row only has start set → excluded
      fireEvent.change(screen.getByTestId('step-timing-row-fill-start'), {
        target: { value: 'Fill_start' },
      });
      fireEvent.click(screen.getByRole('button', { name: /save/i }));
      const expected: StepTimingBinding[] = [
        { kind: 'paired', stepId: 'mix', startColumn: 'Mix_start', endColumn: 'Mix_end' },
      ];
      expect(onSave).toHaveBeenCalledWith(expected);
    });

    it('includes all fully-bound rows when every row has start + end', () => {
      const { onSave } = renderModal({ steps, dateColumns });
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
    const dateColumns = ['Mix_start', 'Mix_end', 'Fill_start', 'Fill_end'];

    it('shows "0 steps timed" when no rows are bound', () => {
      renderModal({ steps, dateColumns });
      expect(screen.getByRole('button', { name: /save · 0 steps timed →/i })).toBeInTheDocument();
    });

    it('shows "1 step timed" when one row is fully bound', () => {
      renderModal({ steps, dateColumns });
      fireEvent.change(screen.getByTestId('step-timing-row-mix-start'), {
        target: { value: 'Mix_start' },
      });
      fireEvent.change(screen.getByTestId('step-timing-row-mix-end'), {
        target: { value: 'Mix_end' },
      });
      expect(screen.getByRole('button', { name: /save · 1 step timed →/i })).toBeInTheDocument();
    });

    it('shows "2 steps timed" when two rows are fully bound', () => {
      renderModal({ steps, dateColumns });
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
      expect(screen.getByRole('button', { name: /save · 2 steps timed →/i })).toBeInTheDocument();
    });
  });

  describe('initialBindings', () => {
    it('pre-populates pickers from paired initialBindings', () => {
      const steps = [createTestStep({ id: 'mix', name: 'Mix' })];
      const dateColumns = ['Mix_start', 'Mix_end'];
      const initialBindings: StepTimingBinding[] = [
        { kind: 'paired', stepId: 'mix', startColumn: 'Mix_start', endColumn: 'Mix_end' },
      ];
      renderModal({ steps, dateColumns, initialBindings });
      const startSelect = screen.getByTestId('step-timing-row-mix-start') as HTMLSelectElement;
      const endSelect = screen.getByTestId('step-timing-row-mix-end') as HTMLSelectElement;
      expect(startSelect.value).toBe('Mix_start');
      expect(endSelect.value).toBe('Mix_end');
    });
  });
});
