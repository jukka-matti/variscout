/**
 * Tests for ImprovementContextPanel component
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ImprovementContextPanel } from '../ImprovementContextPanel';
import type { ImprovementContextPanelProps, CauseSummary } from '../ImprovementContextPanel';

const sampleCauses: CauseSummary[] = [
  {
    id: 'cause-1',
    factor: 'Machine Type',
    evidence: 'R²adj 34%',
    role: 'suspected-cause',
    ideaCount: 3,
    actionCount: 1,
    color: '#ef4444',
  },
  {
    id: 'cause-2',
    factor: 'Shift',
    evidence: 'η² 12%',
    role: 'contributing',
    ideaCount: 2,
    actionCount: 0,
    color: '#f59e0b',
  },
  {
    id: 'cause-3',
    factor: 'Operator',
    evidence: 'p = 0.12',
    role: 'ruled-out',
    ideaCount: 0,
    actionCount: 0,
    color: '#94a3b8',
  },
];

const defaultProps: ImprovementContextPanelProps = {
  problemStatement: 'Fill weight variation exceeds ±2g tolerance on Line 3.',
  targetCpk: 1.33,
  currentCpk: 0.87,
  causes: sampleCauses,
  synthesis: 'Focus improvement efforts on Machine Type and Shift scheduling.',
};

describe('ImprovementContextPanel', () => {
  it('renders the panel container', () => {
    render(<ImprovementContextPanel {...defaultProps} />);
    expect(screen.getByTestId('improvement-context-panel')).toBeTruthy();
  });

  describe('Problem Statement section', () => {
    it('renders the problem statement text', () => {
      render(<ImprovementContextPanel {...defaultProps} />);
      const el = screen.getByTestId('context-problem-statement');
      expect(el.textContent).toBe(defaultProps.problemStatement);
    });

    it('renders a placeholder when problem statement is absent', () => {
      render(<ImprovementContextPanel {...defaultProps} problemStatement={undefined} />);
      const section = screen.getByTestId('context-problem-statement-section');
      expect(section.textContent).toContain('No problem statement');
    });
  });

  describe('Improvement Target section', () => {
    it('renders the target Cpk value', () => {
      render(<ImprovementContextPanel {...defaultProps} />);
      const el = screen.getByTestId('context-target-cpk');
      expect(el.textContent).toBe('1.33');
    });

    it('renders the current Cpk value', () => {
      render(<ImprovementContextPanel {...defaultProps} />);
      const el = screen.getByTestId('context-current-cpk');
      expect(el.textContent).toBe('0.87');
    });

    it('does not render the target section when both values are absent', () => {
      render(
        <ImprovementContextPanel {...defaultProps} targetCpk={undefined} currentCpk={undefined} />
      );
      expect(screen.queryByTestId('context-improvement-target-section')).toBeNull();
    });

    it('renders only target Cpk when current is absent', () => {
      render(<ImprovementContextPanel {...defaultProps} currentCpk={undefined} />);
      expect(screen.getByTestId('context-target-cpk')).toBeTruthy();
      expect(screen.queryByTestId('context-current-cpk')).toBeNull();
    });
  });

  describe('Suspected Causes section', () => {
    it('renders all cause rows', () => {
      render(<ImprovementContextPanel {...defaultProps} />);
      expect(screen.getByTestId('context-cause-cause-1')).toBeTruthy();
      expect(screen.getByTestId('context-cause-cause-2')).toBeTruthy();
      expect(screen.getByTestId('context-cause-cause-3')).toBeTruthy();
    });

    it('shows idea counts for causes with ideas', () => {
      render(<ImprovementContextPanel {...defaultProps} />);
      const ideasEl = screen.getByTestId('context-cause-ideas-cause-1');
      expect(ideasEl.textContent).toContain('3');
    });

    it('shows action counts for causes with actions', () => {
      render(<ImprovementContextPanel {...defaultProps} />);
      const actionsEl = screen.getByTestId('context-cause-actions-cause-1');
      expect(actionsEl.textContent).toContain('1');
    });

    it('does not render causes section when causes array is empty', () => {
      render(<ImprovementContextPanel {...defaultProps} causes={[]} />);
      expect(screen.queryByTestId('context-causes-section')).toBeNull();
    });

    it('renders cause factor names', () => {
      render(<ImprovementContextPanel {...defaultProps} />);
      const section = screen.getByTestId('context-causes-section');
      expect(section.textContent).toContain('Machine Type');
      expect(section.textContent).toContain('Shift');
      expect(section.textContent).toContain('Operator');
    });

    it('renders cause evidence text', () => {
      render(<ImprovementContextPanel {...defaultProps} />);
      const cause1 = screen.getByTestId('context-cause-cause-1');
      expect(cause1.textContent).toContain('R²adj 34%');
    });
  });

  describe('Synthesis section', () => {
    it('renders the synthesis text', () => {
      render(<ImprovementContextPanel {...defaultProps} />);
      const el = screen.getByTestId('context-synthesis');
      expect(el.textContent).toBe(defaultProps.synthesis);
    });

    it('does not render synthesis section when synthesis is absent', () => {
      render(<ImprovementContextPanel {...defaultProps} synthesis={undefined} />);
      expect(screen.queryByTestId('context-synthesis-section')).toBeNull();
    });
  });

  it('renders with minimal props (only required causes)', () => {
    render(<ImprovementContextPanel causes={[]} />);
    expect(screen.getByTestId('improvement-context-panel')).toBeTruthy();
  });
});
