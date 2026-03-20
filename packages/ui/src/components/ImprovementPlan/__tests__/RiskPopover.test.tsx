/**
 * Tests for RiskPopover component
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@variscout/hooks', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    tf: (key: string, _params: Record<string, unknown>) => key,
  }),
}));

vi.mock('@variscout/core', async () => {
  const actual = await vi.importActual<typeof import('@variscout/core')>('@variscout/core');
  return actual;
});

import { render, screen, fireEvent } from '@testing-library/react';
import { RiskPopover } from '../RiskPopover';
import type { RiskAxisConfig, IdeaRiskAssessment } from '@variscout/core';

const defaultAxisConfig: RiskAxisConfig = {
  axis1: 'process',
  axis2: 'safety',
};

const defaultProps = {
  axisConfig: defaultAxisConfig,
  onRiskChange: vi.fn(),
  onClose: vi.fn(),
};

describe('RiskPopover', () => {
  it('renders 9 grid cells (3x3)', () => {
    render(<RiskPopover {...defaultProps} />);
    // Each cell contains a risk label key: risk.low, risk.medium, risk.high, risk.veryHigh
    const buttons = screen.getAllByRole('button');
    // 9 grid cells + axis label buttons (axis1 vertical + axis2 horizontal)
    // Grid cells have title attributes with axis info
    const gridCells = buttons.filter(btn => btn.getAttribute('title'));
    expect(gridCells).toHaveLength(9);
  });

  it('renders correct risk labels in the grid based on the risk matrix', () => {
    render(<RiskPopover {...defaultProps} />);
    const gridCells = screen.getAllByRole('button').filter(btn => btn.getAttribute('title'));

    // Matrix layout (rows top-to-bottom: axis1=3,2,1; cols left-to-right: axis2=1,2,3):
    // Row axis1=3: high, high, very-high
    // Row axis1=2: medium, medium, high
    // Row axis1=1: low, medium, high
    const expectedLabels = [
      'risk.high',
      'risk.high',
      'risk.veryHigh', // axis1=3
      'risk.medium',
      'risk.medium',
      'risk.high', // axis1=2
      'risk.low',
      'risk.medium',
      'risk.high', // axis1=1
    ];

    gridCells.forEach((cell, i) => {
      expect(cell.textContent).toBe(expectedLabels[i]);
    });
  });

  it('calls onRiskChange with correct axis values and computed level when a cell is clicked', () => {
    const onRiskChange = vi.fn();
    render(<RiskPopover {...defaultProps} onRiskChange={onRiskChange} />);

    const gridCells = screen.getAllByRole('button').filter(btn => btn.getAttribute('title'));

    // Click top-right cell (axis1=3, axis2=3) => very-high
    fireEvent.click(gridCells[2]);
    expect(onRiskChange).toHaveBeenCalledWith({
      axis1: 3,
      axis2: 3,
      computed: 'very-high',
    });

    onRiskChange.mockClear();

    // Click bottom-left cell (axis1=1, axis2=1) => low
    fireEvent.click(gridCells[6]);
    expect(onRiskChange).toHaveBeenCalledWith({
      axis1: 1,
      axis2: 1,
      computed: 'low',
    });

    onRiskChange.mockClear();

    // Click middle cell (axis1=2, axis2=2) => medium
    fireEvent.click(gridCells[4]);
    expect(onRiskChange).toHaveBeenCalledWith({
      axis1: 2,
      axis2: 2,
      computed: 'medium',
    });
  });

  it('highlights the currently selected cell', () => {
    const risk: IdeaRiskAssessment = { axis1: 2, axis2: 3, computed: 'high' };
    render(<RiskPopover {...defaultProps} risk={risk} />);

    const gridCells = screen.getAllByRole('button').filter(btn => btn.getAttribute('title'));
    // axis1=2 is in the second row (index 3,4,5); axis2=3 is column 3 => index 5
    const selectedCell = gridCells[5];
    expect(selectedCell.className).toContain('ring-2');
    expect(selectedCell.className).toContain('ring-blue-500');

    // Other cells should not have the ring
    const otherCell = gridCells[0];
    expect(otherCell.className).not.toContain('ring-2');
  });

  it('renders "Not Set" text when no risk is provided', () => {
    render(<RiskPopover {...defaultProps} risk={undefined} />);
    // The result bar shows t('risk.notSet') when risk is undefined
    expect(screen.getByText('risk.notSet')).toBeTruthy();
  });

  it('renders the computed risk label in the result bar when risk is set', () => {
    const risk: IdeaRiskAssessment = { axis1: 1, axis2: 1, computed: 'low' };
    render(<RiskPopover {...defaultProps} risk={risk} />);
    // Result bar contains risk.label text followed by the computed level
    // The font-semibold span in the result bar holds the computed label
    const resultSpans = document.querySelectorAll('.font-semibold');
    const riskLabelSpan = Array.from(resultSpans).find(el => el.textContent === 'risk.low');
    expect(riskLabelSpan).toBeTruthy();
  });

  it('renders axis preset labels from the config', () => {
    render(<RiskPopover {...defaultProps} />);
    // axis1 = process => t('risk.preset.process'), axis2 = safety => t('risk.preset.safety')
    expect(screen.getAllByText('risk.preset.process').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('risk.preset.safety').length).toBeGreaterThanOrEqual(1);
  });

  it('renders Y-axis level labels (severe, significant, small)', () => {
    render(<RiskPopover {...defaultProps} />);
    expect(screen.getByText('risk.severe')).toBeTruthy();
    expect(screen.getByText('risk.significant')).toBeTruthy();
    expect(screen.getByText('risk.small')).toBeTruthy();
  });

  it('renders X-axis level labels (none, possible, immediate)', () => {
    render(<RiskPopover {...defaultProps} />);
    expect(screen.getByText('risk.none')).toBeTruthy();
    expect(screen.getByText('risk.possible')).toBeTruthy();
    expect(screen.getByText('risk.immediate')).toBeTruthy();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(<RiskPopover {...defaultProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
