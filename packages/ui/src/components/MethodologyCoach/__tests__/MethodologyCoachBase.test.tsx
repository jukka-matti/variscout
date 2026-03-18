import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MethodologyCoachBase } from '../MethodologyCoachBase';

describe('MethodologyCoachBase', () => {
  const defaultProps = {
    journeyPhase: 'frame' as const,
    collapsed: true,
    onToggle: vi.fn(),
  };

  it('renders with data-testid="methodology-coach"', () => {
    render(<MethodologyCoachBase {...defaultProps} />);
    expect(screen.getByTestId('methodology-coach')).toBeDefined();
  });

  it('renders collapsed state (toggle button visible)', () => {
    render(<MethodologyCoachBase {...defaultProps} collapsed={true} />);
    expect(screen.getByTestId('methodology-coach')).toBeDefined();
    expect(screen.getByTestId('methodology-coach-toggle')).toBeDefined();
  });

  it('renders frame phase content with checklist when expanded', () => {
    render(
      <MethodologyCoachBase
        {...defaultProps}
        journeyPhase="frame"
        collapsed={false}
        frameChecklist={{
          dataLoaded: true,
          outcomeSelected: false,
          factorsMapped: 2,
          totalFactors: 3,
          specsSet: false,
        }}
      />
    );
    expect(screen.getByTestId('journey-phase-indicator')).toBeDefined();
    expect(screen.getByText('Data loaded')).toBeDefined();
  });

  it('renders scout phase content when expanded', () => {
    render(<MethodologyCoachBase {...defaultProps} journeyPhase="scout" collapsed={false} />);
    expect(screen.getByTestId('journey-phase-indicator')).toBeDefined();
  });

  it('renders investigate phase with diamond map when expanded', () => {
    render(<MethodologyCoachBase {...defaultProps} journeyPhase="investigate" collapsed={false} />);
    expect(screen.getByTestId('diamond-phase-map')).toBeDefined();
  });

  it('renders improve phase with PDCA progress when expanded', () => {
    render(
      <MethodologyCoachBase
        {...defaultProps}
        journeyPhase="improve"
        collapsed={false}
        findings={[
          {
            id: 'f-1',
            text: 'Test',
            createdAt: 1000,
            context: { activeFilters: {}, cumulativeScope: null },
            status: 'improving' as const,
            comments: [],
            statusChangedAt: 1000,
            actions: [{ id: 'a-1', text: 'Fix it', createdAt: 2000 }],
          },
        ]}
      />
    );
    expect(screen.getByTestId('pdca-progress')).toBeDefined();
  });

  it('toggle button calls onToggle', () => {
    const onToggle = vi.fn();
    render(<MethodologyCoachBase {...defaultProps} onToggle={onToggle} />);
    fireEvent.click(screen.getByTestId('methodology-coach-toggle'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
