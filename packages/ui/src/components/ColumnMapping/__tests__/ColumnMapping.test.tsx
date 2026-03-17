import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColumnMapping } from '../index';
import type { ColumnAnalysis, InvestigationCategory } from '@variscout/core';

// --- Helpers ---

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

/** Legacy props using plain column names */
const legacyProps = {
  availableColumns: ['Value', 'Machine', 'Shift', 'Operator', 'Line', 'Product', 'Batch'],
  initialOutcome: 'Value',
  initialFactors: ['Machine'],
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

/** Click a factor toggle by name */
function clickFactor(name: string) {
  // Factor cards render as <div role="button"> (ColumnCard Wrapper for factor role)
  const matches = screen.getAllByText(name);
  const card = matches.find(el => el.closest('[role="button"]'));
  if (!card) throw new Error(`Factor card "${name}" not found`);
  fireEvent.click(card.closest('[role="button"]')!);
}

/** Assert the 4th arg of onConfirm is categories with expected shape */
function expectCategories(
  onConfirm: ReturnType<typeof vi.fn>,
  expected: Array<{ name: string; factorNames: string[] }>
) {
  const categories = onConfirm.mock.calls[0][3] as InvestigationCategory[];
  expect(categories).toBeDefined();
  expect(categories.length).toBe(expected.length);
  for (let i = 0; i < expected.length; i++) {
    expect(categories[i].name).toBe(expected[i].name);
    expect(categories[i].factorNames).toEqual(expected[i].factorNames);
    expect(categories[i].id).toBeTruthy();
    expect(categories[i].color).toBeTruthy();
  }
}

describe('ColumnMapping', () => {
  describe('backwards compatibility (availableColumns)', () => {
    it('renders all columns in both sections with stub analysis', () => {
      render(<ColumnMapping {...legacyProps} />);

      // All column names should appear (in both Y and X sections)
      expect(screen.getAllByText('Value').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Machine').length).toBeGreaterThanOrEqual(1);
    });

    it('defaults to 3 factor limit', () => {
      render(<ColumnMapping {...legacyProps} />);

      expect(screen.getByText('1/3 selected')).toBeTruthy();
      expect(screen.getByText(/Choose up to 3/)).toBeTruthy();
    });

    it('passes categories to onConfirm when values are entered', () => {
      const onConfirm = vi.fn();
      render(<ColumnMapping {...legacyProps} onConfirm={onConfirm} />);

      fireEvent.click(screen.getByText('Set Specification Limits'));
      fireEvent.change(screen.getByLabelText('Target specification'), { target: { value: '10' } });
      fireEvent.change(screen.getByLabelText('LSL specification'), { target: { value: '8' } });
      fireEvent.change(screen.getByLabelText('USL specification'), { target: { value: '12' } });
      fireEvent.click(screen.getByText('Start Analysis'));

      expect(onConfirm).toHaveBeenCalledWith(
        'Value',
        ['Machine'],
        { target: 10, lsl: 8, usl: 12 },
        expect.any(Array),
        undefined
      );
      expectCategories(onConfirm, [{ name: 'Equipment', factorNames: ['Machine'] }]);
    });
  });

  describe('rich columnAnalysis', () => {
    it('renders type badges for columns', () => {
      render(<ColumnMapping {...richProps} />);

      expect(screen.getByTestId('type-badge-Value').textContent).toBe('Numeric');
      expect(screen.getByTestId('type-badge-Machine').textContent).toBe('Categorical');
    });

    it('shows sample values in cards', () => {
      render(<ColumnMapping {...richProps} />);

      // Numeric sample values for Value
      expect(screen.getByText(/23\.5/)).toBeTruthy();
      // Categorical sample values for Machine
      expect(screen.getByText(/M1, M2, M3/)).toBeTruthy();
    });

    it('shows unique count summary', () => {
      render(<ColumnMapping {...richProps} />);

      expect(screen.getByText(/847 unique/)).toBeTruthy();
      // Multiple columns have 3 categories, so use getAllByText
      expect(screen.getAllByText(/3 categories/).length).toBeGreaterThanOrEqual(1);
    });

    it('shows missing warning when missingCount > 0', () => {
      const analysisWithMissing = [
        col('Value', 'numeric', { missingCount: 5 }),
        col('Machine', 'categorical'),
      ];
      render(
        <ColumnMapping {...richProps} columnAnalysis={analysisWithMissing} initialFactors={[]} />
      );

      expect(screen.getByTestId('missing-warning-Value')).toBeTruthy();
    });

    it('separates numeric columns into Y section and categorical into X section', () => {
      render(<ColumnMapping {...richProps} initialFactors={[]} />);

      // Value (numeric) should only appear in Y section initially
      // Machine (categorical) should only appear in X section initially
      // With type separation, Value should not appear as a factor option by default
      const factorCards = screen
        .getAllByText('Machine')
        .filter(el => el.closest('[role="button"]'));
      expect(factorCards.length).toBeGreaterThanOrEqual(1);
    });

    it('shows "Show all columns" toggle', () => {
      render(<ColumnMapping {...richProps} />);

      // The toggle should be present for both sections
      expect(screen.getByTestId('show-all-outcome')).toBeTruthy();
      expect(screen.getByTestId('show-all-factors')).toBeTruthy();
    });

    it('reveals all columns when "Show all" is clicked for factors', () => {
      render(<ColumnMapping {...richProps} initialFactors={[]} />);

      // Value is numeric — should not be in factor section by default
      const factorSectionBefore = screen.getByTestId('show-all-factors');

      // Click to show all columns in factor section
      fireEvent.click(factorSectionBefore);

      // Now Value should appear in factor section too (numeric as factor edge case)
      const allMatches = screen.getAllByText('Value');
      // Should appear in both outcome and factor sections now
      expect(allMatches.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('maxFactors prop', () => {
    it('defaults to 3 factor limit', () => {
      render(<ColumnMapping {...richProps} />);

      expect(screen.getByText('1/3 selected')).toBeTruthy();
      expect(screen.getByText(/Choose up to 3/)).toBeTruthy();
    });

    it('respects maxFactors=5', () => {
      render(<ColumnMapping {...richProps} maxFactors={5} />);

      expect(screen.getByText('1/5 selected')).toBeTruthy();
      expect(screen.getByText(/Choose up to 5/)).toBeTruthy();
    });

    it('respects maxFactors=6', () => {
      render(<ColumnMapping {...richProps} maxFactors={6} />);

      expect(screen.getByText('1/6 selected')).toBeTruthy();
      expect(screen.getByText(/Choose up to 6/)).toBeTruthy();
    });

    it('allows selecting up to maxFactors columns', () => {
      render(<ColumnMapping {...richProps} initialFactors={[]} maxFactors={3} />);

      clickFactor('Machine');
      clickFactor('Shift');
      clickFactor('Operator');

      expect(screen.getByText('3/3 selected')).toBeTruthy();

      // Clicking a 4th shouldn't add it
      clickFactor('Line');
      expect(screen.getByText('3/3 selected')).toBeTruthy();
    });

    it('allows selecting more than 3 when maxFactors is raised', () => {
      render(<ColumnMapping {...richProps} initialFactors={[]} maxFactors={6} />);

      clickFactor('Machine');
      clickFactor('Shift');
      clickFactor('Operator');
      clickFactor('Line');

      expect(screen.getByText('4/6 selected')).toBeTruthy();
    });
  });

  describe('optional specs section', () => {
    it('shows collapsed specs section by default', () => {
      render(<ColumnMapping {...richProps} />);

      expect(screen.getByText('Set Specification Limits')).toBeTruthy();
      expect(screen.queryByTestId('specs-section')).toBeNull();
    });

    it('expands specs section on click', () => {
      render(<ColumnMapping {...richProps} />);

      fireEvent.click(screen.getByText('Set Specification Limits'));

      expect(screen.getByTestId('specs-section')).toBeTruthy();
      expect(screen.getByLabelText('Target specification')).toBeTruthy();
      expect(screen.getByLabelText('LSL specification')).toBeTruthy();
      expect(screen.getByLabelText('USL specification')).toBeTruthy();
    });

    it('passes categories to onConfirm when specs are entered', () => {
      const onConfirm = vi.fn();
      render(<ColumnMapping {...richProps} onConfirm={onConfirm} />);

      fireEvent.click(screen.getByText('Set Specification Limits'));
      fireEvent.change(screen.getByLabelText('Target specification'), { target: { value: '10' } });
      fireEvent.change(screen.getByLabelText('LSL specification'), { target: { value: '8' } });
      fireEvent.change(screen.getByLabelText('USL specification'), { target: { value: '12' } });
      fireEvent.click(screen.getByText('Start Analysis'));

      expect(onConfirm).toHaveBeenCalledWith(
        'Value',
        ['Machine'],
        { target: 10, lsl: 8, usl: 12 },
        expect.any(Array),
        undefined
      );
      expectCategories(onConfirm, [{ name: 'Equipment', factorNames: ['Machine'] }]);
    });

    it('passes categories when no specs entered', () => {
      const onConfirm = vi.fn();
      render(<ColumnMapping {...richProps} onConfirm={onConfirm} />);

      fireEvent.click(screen.getByText('Start Analysis'));

      expect(onConfirm).toHaveBeenCalledWith(
        'Value',
        ['Machine'],
        undefined,
        expect.any(Array),
        undefined
      );
      expectCategories(onConfirm, [{ name: 'Equipment', factorNames: ['Machine'] }]);
    });

    it('passes partial specs when only some values entered', () => {
      const onConfirm = vi.fn();
      render(<ColumnMapping {...richProps} onConfirm={onConfirm} />);

      fireEvent.click(screen.getByText('Set Specification Limits'));
      fireEvent.change(screen.getByLabelText('Target specification'), {
        target: { value: '10.5' },
      });
      fireEvent.click(screen.getByText('Start Analysis'));

      expect(onConfirm).toHaveBeenCalledWith(
        'Value',
        ['Machine'],
        { target: 10.5 },
        expect.any(Array),
        undefined
      );
      expectCategories(onConfirm, [{ name: 'Equipment', factorNames: ['Machine'] }]);
    });
  });

  describe('investigation categories', () => {
    it('renders CategoryBadge with dynamic category name', () => {
      render(<ColumnMapping {...richProps} />);

      // Machine should infer "Equipment" category
      const badge = screen.getByTestId('category-badge');
      expect(badge.textContent).toContain('Equipment');
    });

    it('groups multiple factors under same inferred category', () => {
      const onConfirm = vi.fn();
      // Machine and Line both match "equipment" keywords
      render(
        <ColumnMapping {...richProps} initialFactors={['Machine', 'Line']} onConfirm={onConfirm} />
      );

      fireEvent.click(screen.getByText('Start Analysis'));

      // Both should be grouped under "Equipment" category
      expectCategories(onConfirm, [{ name: 'Equipment', factorNames: ['Machine', 'Line'] }]);
    });

    it('creates separate categories for different inferred roles', () => {
      const onConfirm = vi.fn();
      // Machine → Equipment, Shift → Temporal, Operator → People
      render(
        <ColumnMapping
          {...richProps}
          initialFactors={['Machine', 'Shift', 'Operator']}
          onConfirm={onConfirm}
        />
      );

      fireEvent.click(screen.getByText('Start Analysis'));

      const categories = onConfirm.mock.calls[0][3] as InvestigationCategory[];
      expect(categories.length).toBe(3);
      const names = categories.map(c => c.name).sort();
      expect(names).toEqual(['Equipment', 'People', 'Temporal']);
    });

    it('preserves initialCategories when passed', () => {
      const onConfirm = vi.fn();
      const existingCategories: InvestigationCategory[] = [
        { id: 'cat-1', name: 'Machinery', factorNames: ['Machine'], color: '#ff0000' },
      ];
      render(
        <ColumnMapping
          {...richProps}
          initialCategories={existingCategories}
          onConfirm={onConfirm}
        />
      );

      fireEvent.click(screen.getByText('Start Analysis'));

      const categories = onConfirm.mock.calls[0][3] as InvestigationCategory[];
      expect(categories.length).toBe(1);
      expect(categories[0].name).toBe('Machinery');
      expect(categories[0].id).toBe('cat-1'); // preserved
      expect(categories[0].color).toBe('#ff0000'); // preserved
    });

    it('passes undefined categories when no factors have inferred categories', () => {
      const onConfirm = vi.fn();
      // "Product" doesn't match any keyword group
      render(<ColumnMapping {...richProps} initialFactors={['Product']} onConfirm={onConfirm} />);

      fireEvent.click(screen.getByText('Start Analysis'));

      expect(onConfirm.mock.calls[0][3]).toBeUndefined();
    });

    it('dismisses category badge on X click', () => {
      render(<ColumnMapping {...richProps} />);

      expect(screen.getByTestId('category-badge')).toBeTruthy();

      // Dismiss the badge
      fireEvent.click(screen.getByLabelText('Dismiss Equipment category'));

      expect(screen.queryByTestId('category-badge')).toBeNull();
    });
  });

  describe('column renaming', () => {
    it('calls onColumnRename when rename is completed', () => {
      const onColumnRename = vi.fn();
      render(<ColumnMapping {...richProps} onColumnRename={onColumnRename} />);

      // Find and click the rename button for Machine (there may be 2 — one in each section if showing all)
      const renameBtns = screen.getAllByLabelText('Rename Machine');
      fireEvent.click(renameBtns[0]);

      // Should show input — find the input element specifically
      const input = screen
        .getAllByLabelText('Rename Machine')
        .find(el => el.tagName === 'INPUT') as HTMLInputElement;
      expect(input).toBeTruthy();
      fireEvent.change(input, { target: { value: 'Equipment' } });
      fireEvent.blur(input);

      expect(onColumnRename).toHaveBeenCalledWith('Machine', 'Equipment');
    });

    it('shows alias with original name subtitle', () => {
      render(<ColumnMapping {...richProps} columnAliases={{ Machine: 'Equipment' }} />);

      expect(screen.getAllByText('Equipment').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('(Machine)').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('analysis brief', () => {
    it('shows problem statement field in non-brief mode (PWA)', () => {
      render(<ColumnMapping {...richProps} />);

      expect(screen.getByTestId('problem-statement-simple')).toBeTruthy();
      expect(screen.getByPlaceholderText(/What are you investigating/)).toBeTruthy();
    });

    it('shows full brief section when showBrief=true', () => {
      render(<ColumnMapping {...richProps} showBrief={true} />);

      expect(screen.getByTestId('analysis-brief')).toBeTruthy();
      expect(screen.queryByTestId('problem-statement-simple')).toBeNull();
    });

    it('expands brief and shows hypothesis/target fields', () => {
      render(<ColumnMapping {...richProps} showBrief={true} />);

      fireEvent.click(screen.getByTestId('brief-toggle'));

      expect(screen.getByTestId('brief-fields')).toBeTruthy();
      expect(screen.getByTestId('brief-problem-statement')).toBeTruthy();
      expect(screen.getByTestId('brief-add-hypothesis')).toBeTruthy();
      expect(screen.getByTestId('brief-target-metric')).toBeTruthy();
    });

    it('passes brief data through onConfirm', () => {
      const onConfirm = vi.fn();
      render(<ColumnMapping {...richProps} showBrief={true} onConfirm={onConfirm} />);

      fireEvent.click(screen.getByTestId('brief-toggle'));
      fireEvent.change(screen.getByTestId('brief-problem-statement'), {
        target: { value: 'Cpk is below target' },
      });
      fireEvent.click(screen.getByText('Start Analysis'));

      const brief = onConfirm.mock.calls[0][4];
      expect(brief).toBeDefined();
      expect(brief.problemStatement).toBe('Cpk is below target');
    });

    it('passes undefined brief when no fields filled', () => {
      const onConfirm = vi.fn();
      render(<ColumnMapping {...richProps} showBrief={true} onConfirm={onConfirm} />);

      fireEvent.click(screen.getByText('Start Analysis'));

      const brief = onConfirm.mock.calls[0][4];
      expect(brief).toBeUndefined();
    });

    it('pre-fills problem statement from initialProblemStatement', () => {
      render(
        <ColumnMapping
          {...richProps}
          showBrief={true}
          initialProblemStatement="Customer complaints up"
        />
      );

      // Brief should auto-expand when initial problem statement provided
      expect(screen.getByTestId('brief-fields')).toBeTruthy();
      const textarea = screen.getByTestId('brief-problem-statement') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Customer complaints up');
    });
  });

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
});
