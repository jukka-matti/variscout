import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColumnMapping } from '../index';

const defaultProps = {
  availableColumns: ['Value', 'Machine', 'Shift', 'Operator', 'Line', 'Product', 'Batch'],
  initialOutcome: 'Value',
  initialFactors: ['Machine'],
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

/** Click a factor toggle button by name (factor buttons are <button> elements) */
function clickFactor(name: string) {
  // Factor items are <button> elements; outcome items are <label> elements
  const matches = screen.getAllByText(name);
  const btn = matches.find(el => el.closest('button'));
  if (!btn) throw new Error(`Factor button "${name}" not found`);
  fireEvent.click(btn.closest('button')!);
}

describe('ColumnMapping', () => {
  describe('maxFactors prop', () => {
    it('defaults to 3 factor limit', () => {
      render(<ColumnMapping {...defaultProps} />);

      expect(screen.getByText('1/3 selected')).toBeTruthy();
      expect(screen.getByText(/Choose up to 3/)).toBeTruthy();
    });

    it('respects maxFactors=5', () => {
      render(<ColumnMapping {...defaultProps} maxFactors={5} />);

      expect(screen.getByText('1/5 selected')).toBeTruthy();
      expect(screen.getByText(/Choose up to 5/)).toBeTruthy();
    });

    it('respects maxFactors=6', () => {
      render(<ColumnMapping {...defaultProps} maxFactors={6} />);

      expect(screen.getByText('1/6 selected')).toBeTruthy();
      expect(screen.getByText(/Choose up to 6/)).toBeTruthy();
    });

    it('allows selecting up to maxFactors columns', () => {
      render(<ColumnMapping {...defaultProps} initialFactors={[]} maxFactors={3} />);

      // Select 3 factors
      clickFactor('Machine');
      clickFactor('Shift');
      clickFactor('Operator');

      // Count is updated
      expect(screen.getByText('3/3 selected')).toBeTruthy();

      // Clicking a 4th shouldn't add it (still at 3/3)
      clickFactor('Line');
      expect(screen.getByText('3/3 selected')).toBeTruthy();
    });

    it('allows selecting more than 3 when maxFactors is raised', () => {
      render(<ColumnMapping {...defaultProps} initialFactors={[]} maxFactors={6} />);

      // Select 4 factors (would be blocked with default of 3)
      clickFactor('Machine');
      clickFactor('Shift');
      clickFactor('Operator');
      clickFactor('Line');

      expect(screen.getByText('4/6 selected')).toBeTruthy();
    });
  });

  describe('optional specs section', () => {
    it('shows collapsed specs section by default', () => {
      render(<ColumnMapping {...defaultProps} />);

      expect(screen.getByText('Set Specification Limits')).toBeTruthy();
      // Specs inputs should not be visible yet
      expect(screen.queryByTestId('specs-section')).toBeNull();
    });

    it('expands specs section on click', () => {
      render(<ColumnMapping {...defaultProps} />);

      fireEvent.click(screen.getByText('Set Specification Limits'));

      // Specs section should now be visible
      expect(screen.getByTestId('specs-section')).toBeTruthy();
      expect(screen.getByLabelText('Target specification')).toBeTruthy();
      expect(screen.getByLabelText('LSL specification')).toBeTruthy();
      expect(screen.getByLabelText('USL specification')).toBeTruthy();
    });

    it('passes specs to onConfirm when values are entered', () => {
      const onConfirm = vi.fn();
      render(<ColumnMapping {...defaultProps} onConfirm={onConfirm} />);

      // Expand specs
      fireEvent.click(screen.getByText('Set Specification Limits'));

      // Enter spec values
      fireEvent.change(screen.getByLabelText('Target specification'), { target: { value: '10' } });
      fireEvent.change(screen.getByLabelText('LSL specification'), { target: { value: '8' } });
      fireEvent.change(screen.getByLabelText('USL specification'), { target: { value: '12' } });

      // Click Start Analysis
      fireEvent.click(screen.getByText('Start Analysis'));

      expect(onConfirm).toHaveBeenCalledWith('Value', ['Machine'], { target: 10, lsl: 8, usl: 12 });
    });

    it('passes undefined specs when no values entered', () => {
      const onConfirm = vi.fn();
      render(<ColumnMapping {...defaultProps} onConfirm={onConfirm} />);

      // Click Start Analysis without entering specs
      fireEvent.click(screen.getByText('Start Analysis'));

      expect(onConfirm).toHaveBeenCalledWith('Value', ['Machine'], undefined);
    });

    it('passes partial specs when only some values entered', () => {
      const onConfirm = vi.fn();
      render(<ColumnMapping {...defaultProps} onConfirm={onConfirm} />);

      // Expand specs and enter only target
      fireEvent.click(screen.getByText('Set Specification Limits'));
      fireEvent.change(screen.getByLabelText('Target specification'), {
        target: { value: '10.5' },
      });

      fireEvent.click(screen.getByText('Start Analysis'));

      expect(onConfirm).toHaveBeenCalledWith('Value', ['Machine'], { target: 10.5 });
    });
  });
});
