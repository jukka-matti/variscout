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
});
