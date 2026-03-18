import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JourneyPhaseStrip } from '../JourneyPhaseStrip';

describe('JourneyPhaseStrip', () => {
  it('renders nothing when phase is frame', () => {
    const { container } = render(<JourneyPhaseStrip phase="frame" />);
    expect(container.querySelector('[data-testid="journey-phase-strip"]')).toBeNull();
  });

  it('renders strip with scout phase', () => {
    render(<JourneyPhaseStrip phase="scout" />);
    expect(screen.getByTestId('journey-phase-strip')).toBeDefined();
    expect(screen.getByText('Scout')).toBeDefined();
  });

  it('renders strip with investigate phase', () => {
    render(<JourneyPhaseStrip phase="investigate" />);
    expect(screen.getByText('Investigate')).toBeDefined();
  });

  it('renders strip with improve phase', () => {
    render(<JourneyPhaseStrip phase="improve" />);
    expect(screen.getByText('Improve')).toBeDefined();
  });

  it('opens popover on click (desktop)', () => {
    const renderPopover = vi.fn(({ onClose }: { onClose: () => void }) => (
      <div data-testid="test-popover">
        <button onClick={onClose}>Close</button>
      </div>
    ));
    render(<JourneyPhaseStrip phase="scout" renderPopover={renderPopover} />);
    fireEvent.click(screen.getByTestId('journey-phase-strip-button'));
    expect(screen.getByTestId('test-popover')).toBeDefined();
  });

  it('calls onOpenCoach when clicked', () => {
    const onOpenCoach = vi.fn();
    render(<JourneyPhaseStrip phase="scout" onOpenCoach={onOpenCoach} />);
    fireEvent.click(screen.getByTestId('journey-phase-strip-button'));
    expect(onOpenCoach).toHaveBeenCalledTimes(1);
  });
});
