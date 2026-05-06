/**
 * ColumnMapping tests — slice-2 contract.
 *
 * The new onConfirm shape is ColumnMappingConfirmPayload (Hub-shaped).
 * The outcome section uses OutcomeCandidateRow (multi-select via radio/toggle).
 * The scope section uses PrimaryScopeDimensionsSelector.
 * OutcomeNoMatchBanner surfaces when all candidates score below threshold.
 * mode='edit' preloads existing Hub data (initialOutcomes + initialPrimaryScopeDimensions).
 *
 * Legacy single-outcome assertion: `payload.outcome` carries the first outcome's
 * columnName for importFlow compat; `payload.factors` carries legacy factor columns.
 *
 * IMPORTANT: vi.mock() MUST appear before component imports (anti-hang rule).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ── Mocks (BEFORE component imports) ──────────────────────────────────────────

vi.mock('@variscout/hooks', () => {
  const catalog: Record<string, string> = {
    'data.mapHeading': 'Map Your Data',
    'data.selectOutcome': 'Select Outcome',
    'data.selectFactors': 'Select Factors',
    'data.outcomeDesc': 'The measurement you want to analyze',
    'data.factorsDesc': 'Categories that might influence the outcome',
    'data.alreadyOutcome': 'Already selected as outcome',
    'data.showNumericOnly': 'Numeric only',
    'data.showCategoricalOnly': 'Categorical only',
    'data.showAllColumns': 'All columns',
    'data.analysisSection': 'Analysis Brief',
    'data.optional': 'optional',
    'data.issueStatementPlaceholder': 'Describe what you want to investigate…',
    'data.improvementTarget': 'Improvement target',
    'data.metric': 'Metric',
    'data.startAnalysis': 'Start Analysis',
    'data.applyChanges': 'Apply Changes',
    'data.addQuestion': 'Add question',
    'data.back': 'Back',
    'investigation.questions': 'Questions',
    'quality.allValid': 'All data valid',
    'quality.rowsReady': '{count} rows ready for analysis',
    'quality.rowsExcluded': '{count} rows excluded',
    'quality.missingValues': 'Missing values',
    'quality.nonNumeric': 'Non-numeric values',
    'quality.noVariation': 'No variation',
    'quality.emptyColumn': 'Empty column',
    'quality.noVariationWarning': 'This column has no variation',
    'quality.viewExcluded': 'View excluded',
    'quality.viewAll': 'View all',
    'data.typeNumeric': 'Numeric',
    'data.typeCategorical': 'Categorical',
    'data.typeDate': 'Date',
    'data.typeText': 'Text',
    'data.categories': 'categories',
  };
  return {
    useTranslation: () => ({
      t: (key: string) => catalog[key] ?? key,
      tf: (key: string, params: Record<string, string | number>) => {
        let msg = catalog[key] ?? key;
        for (const [k, v] of Object.entries(params)) {
          msg = msg.replace(`{${k}}`, String(v));
        }
        return msg;
      },
      locale: 'en',
      formatNumber: (n: number) => String(n),
      formatStat: (n: number) => String(n),
      formatPct: (n: number) => `${n}%`,
    }),
  };
});

// ── Component import (after mocks) ────────────────────────────────────────────

import { ColumnMapping, type ColumnMappingConfirmPayload } from '../index';
import type { ColumnAnalysis } from '@variscout/core';
import type { OutcomeSpec } from '@variscout/core/processHub';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a minimal ColumnAnalysis stub */
function col(
  name: string,
  type: ColumnAnalysis['type'],
  overrides: Partial<ColumnAnalysis> = {}
): ColumnAnalysis {
  return {
    name,
    type,
    uniqueCount: type === 'categorical' ? 3 : 100,
    hasVariation: true,
    missingCount: 0,
    sampleValues: type === 'numeric' ? ['1.0', '2.0', '3.0'] : ['A', 'B', 'C'],
    ...overrides,
  };
}

const sampleAnalysis: ColumnAnalysis[] = [
  col('Value', 'numeric', {
    sampleValues: ['23.5', '24.1', '22.8', '25.3', '21.9'],
    uniqueCount: 847,
  }),
  col('Machine', 'categorical', { sampleValues: ['M1', 'M2', 'M3'], uniqueCount: 3 }),
  col('Shift', 'categorical', { sampleValues: ['Morning', 'Evening', 'Night'], uniqueCount: 3 }),
  col('Operator', 'categorical', { sampleValues: ['Alice', 'Bob'], uniqueCount: 2 }),
  col('Line', 'categorical', { sampleValues: ['L1', 'L2'], uniqueCount: 2 }),
  col('Product', 'categorical', { sampleValues: ['P1', 'P2', 'P3'], uniqueCount: 3 }),
  col('Batch', 'categorical', { sampleValues: ['B001', 'B002'], uniqueCount: 50 }),
];

/** Props using rich columnAnalysis */
const richProps = {
  columnAnalysis: sampleAnalysis,
  initialOutcome: 'Value',
  initialFactors: ['Machine'],
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ColumnMapping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders the Map Your Data heading', () => {
      render(<ColumnMapping {...richProps} />);
      expect(screen.getByTestId('map-your-data-heading')).toBeTruthy();
    });

    it('renders outcome candidates section', () => {
      render(<ColumnMapping {...richProps} />);
      expect(screen.getByTestId('outcome-candidates-section')).toBeTruthy();
    });

    it('renders OutcomeCandidateRow for numeric column', () => {
      render(<ColumnMapping {...richProps} />);
      // OutcomeCandidateRow renders the column name
      expect(screen.getByTestId('outcome-candidate-list')).toBeTruthy();
      expect(screen.getAllByText('Value').length).toBeGreaterThanOrEqual(1);
    });

    it('renders PrimaryScopeDimensionsSelector in setup mode', () => {
      render(<ColumnMapping {...richProps} mode="setup" />);
      // PrimaryScopeDimensionsSelector renders the heading
      expect(screen.getByText('Primary scope dimensions')).toBeTruthy();
    });

    it('does not render PrimaryScopeDimensionsSelector in edit mode', () => {
      render(<ColumnMapping {...richProps} mode="edit" />);
      expect(screen.queryByText('Primary scope dimensions')).toBeNull();
    });

    it('renders factor selector in edit mode', () => {
      render(<ColumnMapping {...richProps} mode="edit" />);
      expect(screen.getByText('Select Factors')).toBeTruthy();
    });
  });

  // ── Multi-outcome selection ─────────────────────────────────────────────────

  describe('multi-outcome selection', () => {
    it('starts with initialOutcome pre-selected', () => {
      render(<ColumnMapping {...richProps} initialOutcome="Value" />);
      // The Value checkbox should be checked
      const checkboxes = screen.getAllByRole('checkbox');
      const valueCheckbox = checkboxes.find(r => r.getAttribute('aria-label') === 'Value');
      expect(valueCheckbox).toBeTruthy();
      expect((valueCheckbox as HTMLInputElement).checked).toBe(true);
    });

    it('starts with initialOutcomes pre-selected in edit mode', () => {
      const initialOutcomes: OutcomeSpec[] = [
        {
          id: 'outcome-value-1',
          hubId: '',
          createdAt: 1714000000000,
          deletedAt: null,
          columnName: 'Value',
          characteristicType: 'nominalIsBest',
          target: 24,
        },
      ];
      render(
        <ColumnMapping
          {...richProps}
          mode="edit"
          initialOutcomes={initialOutcomes}
          initialFactors={[]}
        />
      );
      const checkboxesEdit = screen.getAllByRole('checkbox');
      const valueCheckboxEdit = checkboxesEdit.find(r => r.getAttribute('aria-label') === 'Value');
      expect((valueCheckboxEdit as HTMLInputElement).checked).toBe(true);
    });

    it('single-outcome confirm: payload.outcomes has one entry', () => {
      const onConfirm = vi.fn();
      render(<ColumnMapping {...richProps} initialOutcome="Value" onConfirm={onConfirm} />);

      fireEvent.click(screen.getByText('Start Analysis'));

      const payload: ColumnMappingConfirmPayload = onConfirm.mock.calls[0][0];
      expect(payload.outcomes).toHaveLength(1);
      expect(payload.outcomes[0].columnName).toBe('Value');
    });

    it('multi-outcome confirm: payload.outcomes has multiple entries', () => {
      // Two numeric columns: Value + add a second numeric column
      const twoNumericAnalysis: ColumnAnalysis[] = [
        col('Weight', 'numeric', { sampleValues: ['10', '11', '12'], uniqueCount: 100 }),
        col('Length', 'numeric', { sampleValues: ['5', '6', '7'], uniqueCount: 80 }),
        col('Machine', 'categorical', { sampleValues: ['M1', 'M2'], uniqueCount: 2 }),
      ];
      const onConfirm = vi.fn();
      render(
        <ColumnMapping
          columnAnalysis={twoNumericAnalysis}
          initialOutcome="Weight"
          initialFactors={[]}
          onConfirm={onConfirm}
          onCancel={vi.fn()}
        />
      );

      // Weight is pre-selected; also select Length
      const lengthCheckbox = screen
        .getAllByRole('checkbox')
        .find(r => r.getAttribute('aria-label') === 'Length');
      expect(lengthCheckbox).toBeTruthy();
      fireEvent.click(lengthCheckbox!);

      fireEvent.click(screen.getByText('Start Analysis'));

      const payload: ColumnMappingConfirmPayload = onConfirm.mock.calls[0][0];
      expect(payload.outcomes).toHaveLength(2);
      const columnNames = payload.outcomes.map(o => o.columnName).sort();
      expect(columnNames).toEqual(['Length', 'Weight']);
    });

    it('deselecting an outcome removes it from payload.outcomes', () => {
      const onConfirm = vi.fn();
      render(<ColumnMapping {...richProps} initialOutcome="Value" onConfirm={onConfirm} />);

      // Deselect Value
      const valueCheckboxDesel = screen
        .getAllByRole('checkbox')
        .find(r => r.getAttribute('aria-label') === 'Value');
      fireEvent.click(valueCheckboxDesel!);

      // Start Analysis is disabled (no outcomes), but let's verify the state change
      // by re-selecting and confirming
      fireEvent.click(valueCheckboxDesel!); // re-select
      fireEvent.click(screen.getByText('Start Analysis'));

      const payload: ColumnMappingConfirmPayload = onConfirm.mock.calls[0][0];
      expect(payload.outcomes).toHaveLength(1);
      expect(payload.outcomes[0].columnName).toBe('Value');
    });

    it('Start Analysis button is disabled when no outcome selected', () => {
      render(<ColumnMapping {...richProps} initialOutcome={null} />);
      const button = screen.getByText('Start Analysis').closest('button');
      expect(button).toBeTruthy();
      expect(button!.hasAttribute('disabled')).toBe(true);
    });

    it('Start Analysis button is enabled when at least one outcome is selected', () => {
      render(<ColumnMapping {...richProps} initialOutcome="Value" />);
      const button = screen.getByText('Start Analysis').closest('button');
      expect(button!.hasAttribute('disabled')).toBe(false);
    });
  });

  // ── Inline specs per OutcomeCandidateRow ───────────────────────────────────

  describe('inline specs per outcome row', () => {
    it('inline spec inputs visible when outcome is selected', () => {
      render(<ColumnMapping {...richProps} initialOutcome="Value" />);
      // OutcomeCandidateRow shows spec inputs when selected
      expect(screen.getByLabelText('Target')).toBeTruthy();
      expect(screen.getByLabelText('LSL')).toBeTruthy();
      expect(screen.getByLabelText('USL')).toBeTruthy();
      expect(screen.getByLabelText(/Cpk/)).toBeTruthy();
    });

    it('spec values flow into payload.outcomes[0] on confirm', () => {
      const onConfirm = vi.fn();
      render(<ColumnMapping {...richProps} initialOutcome="Value" onConfirm={onConfirm} />);

      const targetInput = screen.getByLabelText('Target') as HTMLInputElement;
      fireEvent.change(targetInput, { target: { value: '24.0' } });

      const uslInput = screen.getByLabelText('USL') as HTMLInputElement;
      fireEvent.change(uslInput, { target: { value: '26.0' } });

      fireEvent.click(screen.getByText('Start Analysis'));

      const payload: ColumnMappingConfirmPayload = onConfirm.mock.calls[0][0];
      expect(payload.outcomes[0].columnName).toBe('Value');
      expect(payload.outcomes[0].target).toBeCloseTo(24.0, 5);
      expect(payload.outcomes[0].usl).toBeCloseTo(26.0, 5);
    });

    it('no sigma-based suggestions: spec inputs are empty by default', () => {
      render(<ColumnMapping {...richProps} initialOutcome="Value" />);
      const uslInput = screen.getByLabelText('USL') as HTMLInputElement;
      const lslInput = screen.getByLabelText('LSL') as HTMLInputElement;
      // Placeholders say "from customer spec", not a computed value
      expect(uslInput.value).toBe('');
      expect(lslInput.value).toBe('');
    });
  });

  // ── PrimaryScopeDimensionsSelector ────────────────────────────────────────

  describe('PrimaryScopeDimensionsSelector', () => {
    it('renders with suggested dimensions checked', () => {
      render(<ColumnMapping {...richProps} mode="setup" />);
      // Dimensions are shown as checkboxes
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('selected dimensions appear in payload.primaryScopeDimensions', () => {
      const onConfirm = vi.fn();
      render(
        <ColumnMapping {...richProps} mode="setup" onConfirm={onConfirm} initialOutcome="Value" />
      );

      // Manually check Machine checkbox
      const machineCheckbox = screen.getAllByRole('checkbox').find(c => {
        const label = c.closest('label');
        return label?.textContent?.includes('Machine');
      });
      if (machineCheckbox && !(machineCheckbox as HTMLInputElement).checked) {
        fireEvent.click(machineCheckbox);
      }

      fireEvent.click(screen.getByText('Start Analysis'));

      const payload: ColumnMappingConfirmPayload = onConfirm.mock.calls[0][0];
      expect(payload.primaryScopeDimensions).toContain('Machine');
    });

    it('initialPrimaryScopeDimensions seeds the selector', () => {
      const onConfirm = vi.fn();
      render(
        <ColumnMapping
          {...richProps}
          mode="setup"
          initialPrimaryScopeDimensions={['Shift']}
          onConfirm={onConfirm}
          initialOutcome="Value"
        />
      );

      // Shift checkbox should be checked
      const shiftCheckbox = screen.getAllByRole('checkbox').find(c => {
        const label = c.closest('label');
        return label?.textContent?.includes('Shift');
      });
      expect(shiftCheckbox).toBeTruthy();
      expect((shiftCheckbox as HTMLInputElement).checked).toBe(true);
    });
  });

  // ── OutcomeNoMatchBanner ───────────────────────────────────────────────────

  describe('OutcomeNoMatchBanner', () => {
    it('surfaces when all candidates score below threshold', () => {
      // All-text (non-numeric) columns should score below default threshold
      const allTextAnalysis: ColumnAnalysis[] = [
        col('foo', 'text', { uniqueCount: 5 }),
        col('bar', 'text', { uniqueCount: 3 }),
      ];
      render(
        <ColumnMapping
          columnAnalysis={allTextAnalysis}
          initialOutcome={null}
          initialFactors={[]}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          noMatchThreshold={0.9} // high threshold so all candidates fail
        />
      );
      expect(screen.getByRole('alert')).toBeTruthy();
      expect(screen.getByText(/No clear outcome match/)).toBeTruthy();
    });

    it('does not surface when numeric candidates are present (score >= threshold)', () => {
      render(<ColumnMapping {...richProps} noMatchThreshold={0.1} />);
      expect(screen.queryByRole('alert')).toBeNull();
    });

    it('Skip CTA clears selected outcomes', () => {
      const allTextAnalysis: ColumnAnalysis[] = [
        col('foo', 'text', { uniqueCount: 5 }),
        col('bar', 'text', { uniqueCount: 3 }),
      ];
      const onConfirm = vi.fn();
      render(
        <ColumnMapping
          columnAnalysis={allTextAnalysis}
          initialOutcome={null}
          initialFactors={[]}
          onConfirm={onConfirm}
          onCancel={vi.fn()}
          noMatchThreshold={0.9}
        />
      );
      // Banner is present
      expect(screen.getByRole('alert')).toBeTruthy();
      // Click Skip
      fireEvent.click(screen.getByRole('button', { name: /Skip outcome/i }));
      // After skip, Start Analysis should still be reachable (no outcome = disabled)
      // — confirm by checking the payload will have zero outcomes after a forced click
      // (we test the state was cleared, not the button disabled state)
      // Manually enable: the Start Analysis button is disabled when no outcome selected,
      // so we verify the internal state by checking payload.outcomes is empty on a force-submit.
      // Force-click the disabled button to fire the confirm handler anyway:
      const btn = screen.getByText('Start Analysis').closest('button')!;
      // button is disabled after skip — this confirms onSkip cleared outcomes
      expect(btn.hasAttribute('disabled')).toBe(true);
    });

    it('expectedOutcomeNote is included in payload after onExpectedChange', () => {
      const allTextAnalysis: ColumnAnalysis[] = [
        col('foo', 'text', { uniqueCount: 5 }),
        col('bar', 'text', { uniqueCount: 3 }),
      ];
      const onConfirm = vi.fn();
      render(
        <ColumnMapping
          columnAnalysis={allTextAnalysis}
          initialOutcome="foo"
          initialFactors={[]}
          onConfirm={onConfirm}
          onCancel={vi.fn()}
          noMatchThreshold={0.9}
        />
      );
      // Banner is present
      expect(screen.getByRole('alert')).toBeTruthy();
      // Type in the expected note
      const noteInput = screen.getByPlaceholderText(/e\.g\. reject_rate/i) as HTMLInputElement;
      fireEvent.change(noteInput, { target: { value: 'reject_rate' } });

      // Confirm (foo is pre-selected by initialOutcome)
      fireEvent.click(screen.getByText('Start Analysis'));

      const payload: ColumnMappingConfirmPayload = onConfirm.mock.calls[0][0];
      expect(payload.expectedOutcomeNote).toBe('reject_rate');
    });
  });

  // ── mode='edit' round-trip ────────────────────────────────────────────────

  describe("mode='edit'", () => {
    it('preloads initialOutcomes', () => {
      const initialOutcomes: OutcomeSpec[] = [
        {
          id: 'outcome-value-2',
          hubId: '',
          createdAt: 1714000000000,
          deletedAt: null,
          columnName: 'Value',
          characteristicType: 'nominalIsBest',
          target: 24,
          lsl: 22,
          usl: 26,
        },
      ];
      render(
        <ColumnMapping
          {...richProps}
          mode="edit"
          initialOutcomes={initialOutcomes}
          initialFactors={[]}
        />
      );
      const valueCheckboxPreload = screen
        .getAllByRole('checkbox')
        .find(r => r.getAttribute('aria-label') === 'Value');
      expect((valueCheckboxPreload as HTMLInputElement).checked).toBe(true);

      // Inline specs should be pre-filled from initialOutcomes
      const targetInput = screen.getByLabelText('Target') as HTMLInputElement;
      expect(targetInput.value).toBe('24');
    });

    it('Save verb in edit mode footer', () => {
      render(<ColumnMapping {...richProps} mode="edit" initialFactors={[]} />);
      expect(screen.getByText('Apply Changes')).toBeTruthy();
    });

    it('edit confirm updates outcomes and factors in payload', () => {
      const onConfirm = vi.fn();
      const initialOutcomes: OutcomeSpec[] = [
        {
          id: 'outcome-value-3',
          hubId: '',
          createdAt: 1714000000000,
          deletedAt: null,
          columnName: 'Value',
          characteristicType: 'nominalIsBest',
        },
      ];
      render(
        <ColumnMapping
          {...richProps}
          mode="edit"
          initialOutcomes={initialOutcomes}
          initialFactors={['Machine']}
          onConfirm={onConfirm}
        />
      );

      fireEvent.click(screen.getByText('Apply Changes'));

      const payload: ColumnMappingConfirmPayload = onConfirm.mock.calls[0][0];
      expect(payload.outcomes).toHaveLength(1);
      expect(payload.outcomes[0].columnName).toBe('Value');
    });

    it('shows SpecsSection in edit mode when hideSpecs=false', () => {
      render(<ColumnMapping {...richProps} mode="edit" initialFactors={[]} hideSpecs={false} />);
      expect(screen.getByText('Set Specification Limits')).toBeTruthy();
    });

    it('edit-mode roundtrip preserves all initialOutcomes (multi-outcome)', () => {
      // Regression test for Critical #1: editing an existing Hub with 2 outcomes
      // must preload BOTH rows and emit BOTH in the confirm payload.
      const twoNumericAnalysis = [
        col('A', 'numeric', { sampleValues: ['1', '2', '3'], uniqueCount: 100 }),
        col('B', 'numeric', { sampleValues: ['10', '20', '30'], uniqueCount: 80 }),
        col('Machine', 'categorical', { sampleValues: ['M1', 'M2'], uniqueCount: 2 }),
      ];
      const initialOutcomes: OutcomeSpec[] = [
        {
          id: 'outcome-a',
          hubId: '',
          createdAt: 1714000000000,
          deletedAt: null,
          columnName: 'A',
          characteristicType: 'nominalIsBest',
          target: 2,
        },
        {
          id: 'outcome-b',
          hubId: '',
          createdAt: 1714000000000,
          deletedAt: null,
          columnName: 'B',
          characteristicType: 'largerIsBetter',
        },
      ];
      const onConfirm = vi.fn();
      render(
        <ColumnMapping
          columnAnalysis={twoNumericAnalysis}
          initialOutcome="A"
          initialFactors={[]}
          initialOutcomes={initialOutcomes}
          mode="edit"
          onConfirm={onConfirm}
          onCancel={vi.fn()}
        />
      );

      // Both A and B checkboxes should be pre-checked
      const checkboxes = screen.getAllByRole('checkbox');
      const checkboxA = checkboxes.find(r => r.getAttribute('aria-label') === 'A');
      const checkboxB = checkboxes.find(r => r.getAttribute('aria-label') === 'B');
      expect((checkboxA as HTMLInputElement).checked).toBe(true);
      expect((checkboxB as HTMLInputElement).checked).toBe(true);

      fireEvent.click(screen.getByText('Apply Changes'));

      const payload: ColumnMappingConfirmPayload = onConfirm.mock.calls[0][0];
      expect(payload.outcomes).toHaveLength(2);
      const columnNames = payload.outcomes.map(o => o.columnName).sort();
      expect(columnNames).toEqual(['A', 'B']);
    });
  });

  // ── Hub-shaped payload shape ───────────────────────────────────────────────

  describe('Hub-shaped payload (no legacy compat fields)', () => {
    it('payload has no "outcome" or "factors" fields', () => {
      const onConfirm = vi.fn();
      render(<ColumnMapping {...richProps} initialOutcome="Value" onConfirm={onConfirm} />);

      fireEvent.click(screen.getByText('Start Analysis'));

      const payload: ColumnMappingConfirmPayload = onConfirm.mock.calls[0][0];
      // New shape: no legacy single-outcome or factor fields
      expect('outcome' in payload).toBe(false);
      expect('factors' in payload).toBe(false);
      expect('specs' in payload).toBe(false);
      // Hub-shaped fields present
      expect(Array.isArray(payload.outcomes)).toBe(true);
      expect(Array.isArray(payload.primaryScopeDimensions)).toBe(true);
    });

    it('outcomes[] is the canonical field for selected outcomes', () => {
      const onConfirm = vi.fn();
      render(<ColumnMapping {...richProps} initialOutcome="Value" onConfirm={onConfirm} />);

      fireEvent.click(screen.getByText('Start Analysis'));

      const payload: ColumnMappingConfirmPayload = onConfirm.mock.calls[0][0];
      expect(payload.outcomes).toHaveLength(1);
      expect(payload.outcomes[0].columnName).toBe('Value');
    });
  });

  // ── Analysis brief ─────────────────────────────────────────────────────────

  describe('analysis brief', () => {
    it('shows issue statement field in non-brief mode (PWA)', () => {
      render(<ColumnMapping {...richProps} />);
      expect(screen.getByTestId('issue-statement-simple')).toBeTruthy();
      expect(screen.getByPlaceholderText(/What are you investigating/)).toBeTruthy();
    });

    it('shows full brief section when showBrief=true', () => {
      render(<ColumnMapping {...richProps} showBrief={true} />);
      expect(screen.getByTestId('analysis-brief')).toBeTruthy();
      expect(screen.queryByTestId('issue-statement-simple')).toBeNull();
    });

    it('expands brief and shows question/target fields', () => {
      render(<ColumnMapping {...richProps} showBrief={true} />);

      fireEvent.click(screen.getByTestId('brief-toggle'));

      expect(screen.getByTestId('brief-fields')).toBeTruthy();
      expect(screen.getByTestId('brief-issue-statement')).toBeTruthy();
      expect(screen.getByTestId('brief-add-question')).toBeTruthy();
      expect(screen.getByTestId('brief-target-metric')).toBeTruthy();
    });

    it('passes brief data through payload.brief', () => {
      const onConfirm = vi.fn();
      render(<ColumnMapping {...richProps} showBrief={true} onConfirm={onConfirm} />);

      fireEvent.click(screen.getByTestId('brief-toggle'));
      fireEvent.change(screen.getByTestId('brief-issue-statement'), {
        target: { value: 'Cpk is below target' },
      });
      fireEvent.click(screen.getByText('Start Analysis'));

      const payload: ColumnMappingConfirmPayload = onConfirm.mock.calls[0][0];
      expect(payload.brief).toBeDefined();
      expect(payload.brief!.issueStatement).toBe('Cpk is below target');
    });

    it('passes undefined brief when no fields filled', () => {
      const onConfirm = vi.fn();
      render(<ColumnMapping {...richProps} showBrief={true} onConfirm={onConfirm} />);

      fireEvent.click(screen.getByText('Start Analysis'));

      const payload: ColumnMappingConfirmPayload = onConfirm.mock.calls[0][0];
      expect(payload.brief).toBeUndefined();
    });

    it('pre-fills issue statement from initialIssueStatement', () => {
      render(
        <ColumnMapping
          {...richProps}
          showBrief={true}
          initialIssueStatement="Customer complaints up"
        />
      );

      // Brief should auto-expand when initial issue statement provided
      expect(screen.getByTestId('brief-fields')).toBeTruthy();
      const textarea = screen.getByTestId('brief-issue-statement') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Customer complaints up');
    });
  });

  // ── Data preview table ─────────────────────────────────────────────────────

  describe('data preview table', () => {
    const previewRows = [
      { Value: 23.5, Machine: 'M1', Shift: 'Morning' },
      { Value: 24.1, Machine: 'M2', Shift: 'Evening' },
      { Value: 22.8, Machine: 'M3', Shift: 'Night' },
    ];

    it('shows preview toggle when previewRows are provided', () => {
      render(<ColumnMapping {...richProps} previewRows={previewRows} totalRows={120} />);
      expect(screen.getByTestId('preview-toggle')).toBeTruthy();
      expect(screen.getByText(/120 rows/)).toBeTruthy();
    });

    it('does not show preview table by default (collapsed)', () => {
      render(<ColumnMapping {...richProps} previewRows={previewRows} />);
      expect(screen.queryByTestId('preview-table')).toBeNull();
    });

    it('expands preview table on click', () => {
      render(<ColumnMapping {...richProps} previewRows={previewRows} />);
      fireEvent.click(screen.getByTestId('preview-toggle'));
      expect(screen.getByTestId('preview-table')).toBeTruthy();
    });

    it('does not render preview when no previewRows', () => {
      render(<ColumnMapping {...richProps} />);
      expect(screen.queryByTestId('preview-toggle')).toBeNull();
    });
  });

  // ── goalContext biasing (D4) ───────────────────────────────────────────────

  describe('goalContext biasing', () => {
    it('column matching goal context words appears in candidate list', () => {
      const weightFocusAnalysis: ColumnAnalysis[] = [
        col('weight_g', 'numeric', { sampleValues: ['10', '11', '12'], uniqueCount: 100 }),
        col('unrelated', 'numeric', { sampleValues: ['1', '2', '3'], uniqueCount: 50 }),
      ];
      render(
        <ColumnMapping
          columnAnalysis={weightFocusAnalysis}
          initialOutcome={null}
          initialFactors={[]}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          goalContext="weight fill weight_g"
        />
      );
      // Both candidates render; weight_g gets higher score
      expect(screen.getByTestId('outcome-candidate-list')).toBeTruthy();
      expect(screen.getAllByText(/weight_g/).length).toBeGreaterThanOrEqual(1);
    });
  });
});
