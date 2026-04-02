/**
 * Tests for CauseSummaryCards component
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CauseSummaryCards } from '../CauseSummaryCards';
import type { CauseSummaryCardData, CauseSummaryCardsProps } from '../CauseSummaryCards';

const makeCause = (overrides: Partial<CauseSummaryCardData> = {}): CauseSummaryCardData => ({
  id: 'cause-1',
  factor: 'Shift (Night)',
  evidence: 'R²adj 34%',
  color: '#ef4444',
  ideaCount: 3,
  quickWinCount: 2,
  avgProjectedCpk: 1.27,
  ...overrides,
});

const defaultProps: CauseSummaryCardsProps = {
  causes: [
    makeCause({ id: 'cause-1', factor: 'Shift (Night)', evidence: 'R²adj 34%' }),
    makeCause({
      id: 'cause-2',
      factor: 'Nozzle (Head 5-8)',
      evidence: 'R²adj 22%',
      color: '#3b82f6',
      ideaCount: 2,
      quickWinCount: 0,
      avgProjectedCpk: 1.32,
    }),
  ],
};

describe('CauseSummaryCards', () => {
  it('renders all cause cards', () => {
    render(<CauseSummaryCards {...defaultProps} />);
    expect(screen.getByTestId('cause-card-cause-1')).toBeTruthy();
    expect(screen.getByTestId('cause-card-cause-2')).toBeTruthy();
  });

  it('shows factor name for each card', () => {
    render(<CauseSummaryCards {...defaultProps} />);
    expect(screen.getByTestId('cause-factor-cause-1').textContent).toBe('Shift (Night)');
    expect(screen.getByTestId('cause-factor-cause-2').textContent).toBe('Nozzle (Head 5-8)');
  });

  it('shows evidence text for each card', () => {
    render(<CauseSummaryCards {...defaultProps} />);
    expect(screen.getByTestId('cause-evidence-cause-1').textContent).toBe('R²adj 34%');
    expect(screen.getByTestId('cause-evidence-cause-2').textContent).toBe('R²adj 22%');
  });

  it('shows idea count and quick win count', () => {
    render(<CauseSummaryCards {...defaultProps} />);
    expect(screen.getByTestId('cause-idea-count-cause-1').textContent).toContain('3');
    expect(screen.getByTestId('cause-quick-wins-cause-1').textContent).toContain('2');

    expect(screen.getByTestId('cause-idea-count-cause-2').textContent).toContain('2');
    expect(screen.getByTestId('cause-quick-wins-cause-2').textContent).toContain('0');
  });

  it('shows average Cpk with green color when provided', () => {
    render(<CauseSummaryCards {...defaultProps} />);
    const cpkEl = screen.getByTestId('cause-avg-cpk-cause-1');
    expect(cpkEl.textContent).toContain('1.27');
    expect(cpkEl.className).toContain('text-green-400');
  });

  it('shows muted dash when avgProjectedCpk is undefined', () => {
    render(
      <CauseSummaryCards causes={[makeCause({ id: 'cause-3', avgProjectedCpk: undefined })]} />
    );
    const cpkEl = screen.getByTestId('cause-avg-cpk-cause-3');
    expect(cpkEl.textContent).toContain('—');
    expect(cpkEl.className).toContain('text-content-muted');
  });

  it('calls onViewIdeas with correct causeId when button is clicked', () => {
    const onViewIdeas = vi.fn();
    render(<CauseSummaryCards {...defaultProps} onViewIdeas={onViewIdeas} />);

    fireEvent.click(screen.getByTestId('cause-view-ideas-cause-1'));
    expect(onViewIdeas).toHaveBeenCalledWith('cause-1');

    fireEvent.click(screen.getByTestId('cause-view-ideas-cause-2'));
    expect(onViewIdeas).toHaveBeenCalledWith('cause-2');
  });

  it('does not render view-ideas buttons when onViewIdeas is not provided', () => {
    render(<CauseSummaryCards causes={defaultProps.causes} />);
    expect(screen.queryByTestId('cause-view-ideas-cause-1')).toBeNull();
    expect(screen.queryByTestId('cause-view-ideas-cause-2')).toBeNull();
  });

  it('renders nothing when causes array is empty', () => {
    const { container } = render(<CauseSummaryCards causes={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('applies cause color as inline style on dot', () => {
    render(<CauseSummaryCards causes={[makeCause({ id: 'cause-1', color: '#ef4444' })]} />);
    const dot = screen.getByTestId('cause-dot-cause-1') as HTMLElement;
    expect(dot.style.backgroundColor).toBe('rgb(239, 68, 68)');
  });

  it('renders the scroll container with snap classes', () => {
    render(<CauseSummaryCards {...defaultProps} />);
    const container = screen.getByTestId('cause-summary-cards');
    expect(container.className).toContain('overflow-x-auto');
    expect(container.className).toContain('snap-x');
  });
});
