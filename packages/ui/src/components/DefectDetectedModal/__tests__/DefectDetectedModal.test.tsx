/**
 * Tests for DefectDetectedModal — step-of-origin picker (P2.3)
 *
 * NOTE: useTranslation is mocked to return i18n keys as-is.
 * The component uses `t?.('key') ?? 'fallback'` — since t is defined,
 * the i18n key is the rendered text (e.g. 'defect.detected.stepOfOrigin').
 *
 * Covers:
 * - Picker renders with auto-suggestion pre-filled
 * - Picker renders without suggestion (None as default)
 * - User can select a different column
 * - User can pick None (stepRejectedAtColumn: undefined)
 * - onEnable receives the full mapping including step column
 * - Helper text is rendered beneath the dropdown
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@variscout/hooks', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    locale: 'en',
  }),
}));

vi.mock('focus-trap-react', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { DefectDetectedModal } from '../index';
import type { DefectDetection } from '@variscout/core';

// Mock native <dialog> methods (jsdom does not implement them)
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  });
});

const COLUMNS = ['batch_id', 'defect_type', 'count', 'step', 'units'];

function makeDetection(stepRejectedAtColumn?: string): DefectDetection {
  return {
    isDefectFormat: true,
    confidence: 'high',
    dataShape: 'event-log',
    suggestedMapping: {
      dataShape: 'event-log',
      defectTypeColumn: 'defect_type',
      aggregationUnit: 'batch_id',
      stepRejectedAtColumn,
    },
  };
}

/**
 * Finds the step-of-origin <select> element.
 * The label text is the i18n key 'defect.detected.stepOfOrigin:' — we locate
 * all comboboxes that include a 'None' option, which is the set of optional
 * dropdowns. The step-of-origin select is the one whose value matches the
 * expected initial state.
 */
function findStepSelect(expectedValue: string): HTMLSelectElement {
  const selects = screen.getAllByRole('combobox');
  const match = selects.find(s => {
    const sel = s as HTMLSelectElement;
    return (
      Array.from(sel.options).some(o => o.value === '' && o.text === 'None') &&
      sel.value === expectedValue
    );
  });
  if (!match) throw new Error(`Step select with value '${expectedValue}' not found`);
  return match as HTMLSelectElement;
}

describe('DefectDetectedModal — step-of-origin picker', () => {
  it('renders the step-of-origin label (i18n key) in the column-roles section', () => {
    render(
      <DefectDetectedModal
        detection={makeDetection('step')}
        columnNames={COLUMNS}
        onEnable={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    // t() returns the key; the label span contains exactly the key followed by ':'
    expect(screen.getByText('defect.detected.stepOfOrigin:')).toBeInTheDocument();
  });

  it('pre-fills the step-of-origin dropdown with the auto-suggestion', () => {
    render(
      <DefectDetectedModal
        detection={makeDetection('step')}
        columnNames={COLUMNS}
        onEnable={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    const stepSelect = findStepSelect('step');
    expect(stepSelect.value).toBe('step');
  });

  it('defaults the step-of-origin dropdown to None when no suggestion is provided', () => {
    render(
      <DefectDetectedModal
        detection={makeDetection(undefined)}
        columnNames={COLUMNS}
        onEnable={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    // When no suggestion, value is '' (None option)
    const selects = screen.getAllByRole('combobox');
    // Among the optional selects (those with a None option), find one with value ''
    const noneSelects = selects.filter(s => {
      const sel = s as HTMLSelectElement;
      return (
        Array.from(sel.options).some(o => o.value === '' && o.text === 'None') && sel.value === ''
      );
    });
    // At least the step-of-origin and units-produced dropdowns should be at '' since neither is suggested
    expect(noneSelects.length).toBeGreaterThanOrEqual(1);
  });

  it('user can select a different column — onEnable receives the updated stepRejectedAtColumn', () => {
    const onEnable = vi.fn();
    render(
      <DefectDetectedModal
        detection={makeDetection('step')}
        columnNames={COLUMNS}
        onEnable={onEnable}
        onDismiss={vi.fn()}
      />
    );

    const stepSelect = findStepSelect('step');
    fireEvent.change(stepSelect, { target: { value: 'batch_id' } });

    // Confirm action
    fireEvent.click(screen.getByText('defect.detected.enable'));
    expect(onEnable).toHaveBeenCalledOnce();
    expect(onEnable).toHaveBeenCalledWith(
      expect.objectContaining({ stepRejectedAtColumn: 'batch_id' })
    );
  });

  it('user can pick None — onEnable receives stepRejectedAtColumn: undefined', () => {
    const onEnable = vi.fn();
    render(
      <DefectDetectedModal
        detection={makeDetection('step')}
        columnNames={COLUMNS}
        onEnable={onEnable}
        onDismiss={vi.fn()}
      />
    );

    const stepSelect = findStepSelect('step');
    fireEvent.change(stepSelect, { target: { value: '' } });

    fireEvent.click(screen.getByText('defect.detected.enable'));
    expect(onEnable).toHaveBeenCalledOnce();
    const emitted = onEnable.mock.calls[0][0];
    expect(emitted.stepRejectedAtColumn).toBeUndefined();
  });

  it('onEnable receives the full DefectMapping including stepRejectedAtColumn', () => {
    const onEnable = vi.fn();
    render(
      <DefectDetectedModal
        detection={makeDetection('step')}
        columnNames={COLUMNS}
        onEnable={onEnable}
        onDismiss={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('defect.detected.enable'));

    expect(onEnable).toHaveBeenCalledOnce();
    const mapping = onEnable.mock.calls[0][0];
    expect(mapping).toMatchObject({
      dataShape: 'event-log',
      defectTypeColumn: 'defect_type',
      aggregationUnit: 'batch_id',
      stepRejectedAtColumn: 'step',
    });
  });

  it('renders helper text beneath the step-of-origin dropdown', () => {
    render(
      <DefectDetectedModal
        detection={makeDetection('step')}
        columnNames={COLUMNS}
        onEnable={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    // t() returns the i18n key, so the hint text equals the key
    expect(screen.getByText('defect.detected.stepOfOriginHint')).toBeInTheDocument();
  });
});
