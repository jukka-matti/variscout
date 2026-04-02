/**
 * Tests for TrackView and PlanRecap components
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TrackView } from '../TrackView';
import { PlanRecap } from '../PlanRecap';
import type { SelectedIdea } from '../PlanRecap';
import type { TrackedAction } from '../ActionTrackerSection';

const NOW = Date.now();

function makeAction(overrides: Partial<TrackedAction> = {}): TrackedAction {
  return {
    id: 'a1',
    text: 'Standardize SOP',
    findingId: 'f1',
    createdAt: NOW - 1000,
    ...overrides,
  };
}

const defaultIdeas: SelectedIdea[] = [
  { id: 'i1', text: 'Standardize SOP', causeColor: '#22c55e', projectedCpk: 1.35 },
  { id: 'i2', text: 'Add checklist', projectedCpk: 1.28 },
];

const defaultActions: TrackedAction[] = [
  makeAction({ id: 'a1', text: 'Train operators' }),
  makeAction({ id: 'a2', text: 'Update documentation' }),
];

function renderTrackView(overrides = {}) {
  return render(
    <TrackView
      selectedIdeas={defaultIdeas}
      actions={defaultActions}
      onToggleComplete={vi.fn()}
      hasVerification={false}
      {...overrides}
    />
  );
}

describe('TrackView', () => {
  it('renders the track view container', () => {
    renderTrackView();
    expect(screen.getByTestId('track-view')).toBeTruthy();
  });

  it('renders back-to-plan link when onBackToPlan provided', () => {
    renderTrackView({ onBackToPlan: vi.fn() });
    expect(screen.getByTestId('track-view-back-btn')).toBeTruthy();
  });

  it('does not render back-to-plan link when onBackToPlan not provided', () => {
    renderTrackView();
    expect(screen.queryByTestId('track-view-back-btn')).toBeNull();
  });

  it('calls onBackToPlan when back link is clicked', () => {
    const onBackToPlan = vi.fn();
    renderTrackView({ onBackToPlan });
    fireEvent.click(screen.getByTestId('track-view-back-btn'));
    expect(onBackToPlan).toHaveBeenCalledOnce();
  });

  it('renders PlanRecap with selected ideas', () => {
    renderTrackView();
    expect(screen.getByTestId('plan-recap')).toBeTruthy();
    expect(screen.getByTestId('plan-recap-badge-i1')).toBeTruthy();
    expect(screen.getByTestId('plan-recap-badge-i2')).toBeTruthy();
  });

  it('renders ActionTrackerSection', () => {
    renderTrackView();
    expect(screen.getByTestId('action-tracker-section')).toBeTruthy();
    expect(screen.getByTestId('action-text-a1')).toBeTruthy();
    expect(screen.getByTestId('action-text-a2')).toBeTruthy();
  });

  it('renders VerificationSection', () => {
    renderTrackView();
    expect(screen.getByTestId('verification-section')).toBeTruthy();
  });

  it('renders OutcomeSection', () => {
    renderTrackView();
    expect(screen.getByTestId('outcome-section')).toBeTruthy();
  });

  it('passes verification data to VerificationSection', () => {
    const verification = {
      cpkBefore: 0.8,
      cpkAfter: 1.4,
      passRateBefore: 85,
      passRateAfter: 98,
      meanShift: 0.12,
      sigmaRatio: 0.75,
      dataDate: '2024-07-01',
    };
    renderTrackView({ verification, hasVerification: true });
    expect(screen.getByTestId('verification-data')).toBeTruthy();
  });

  it('passes hasVerification=true to OutcomeSection enabling outcome buttons', () => {
    renderTrackView({ hasVerification: true });
    // When hasVerification is true, outcome buttons are shown
    expect(screen.getByTestId('outcome-buttons')).toBeTruthy();
  });

  it('passes hasVerification=false to OutcomeSection showing dimmed message', () => {
    renderTrackView({ hasVerification: false });
    expect(screen.getByTestId('outcome-dimmed-message')).toBeTruthy();
  });

  it('passes onEditSelection to PlanRecap', () => {
    const onEditSelection = vi.fn();
    renderTrackView({ onEditSelection });
    expect(screen.getByTestId('plan-recap-edit-btn')).toBeTruthy();
  });
});

describe('PlanRecap', () => {
  it('renders selected improvements header', () => {
    render(<PlanRecap selectedIdeas={defaultIdeas} />);
    expect(screen.getByTestId('plan-recap')).toBeTruthy();
    expect(screen.getByText('Selected Improvements')).toBeTruthy();
  });

  it('renders badges for each selected idea', () => {
    render(<PlanRecap selectedIdeas={defaultIdeas} />);
    expect(screen.getByTestId('plan-recap-badge-i1')).toBeTruthy();
    expect(screen.getByTestId('plan-recap-badge-i2')).toBeTruthy();
  });

  it('renders idea text in each badge', () => {
    render(<PlanRecap selectedIdeas={defaultIdeas} />);
    expect(screen.getByTestId('plan-recap-text-i1').textContent).toBe('Standardize SOP');
    expect(screen.getByTestId('plan-recap-text-i2').textContent).toBe('Add checklist');
  });

  it('renders cause color dot when causeColor provided', () => {
    render(<PlanRecap selectedIdeas={defaultIdeas} />);
    const dot = screen.getByTestId('plan-recap-dot-i1');
    const style = dot.getAttribute('style') ?? '';
    expect(style).toMatch(/background-color:\s*(#22c55e|rgb\(34,\s*197,\s*94\))/i);
  });

  it('does not render cause dot when causeColor not provided', () => {
    render(<PlanRecap selectedIdeas={defaultIdeas} />);
    expect(screen.queryByTestId('plan-recap-dot-i2')).toBeNull();
  });

  it('renders projected Cpk when provided', () => {
    render(<PlanRecap selectedIdeas={defaultIdeas} />);
    expect(screen.getByTestId('plan-recap-cpk-i1').textContent).toContain('1.35');
    expect(screen.getByTestId('plan-recap-cpk-i2').textContent).toContain('1.28');
  });

  it('shows "Edit selection" link when onEditSelection provided', () => {
    const onEditSelection = vi.fn();
    render(<PlanRecap selectedIdeas={defaultIdeas} onEditSelection={onEditSelection} />);
    expect(screen.getByTestId('plan-recap-edit-btn')).toBeTruthy();
    expect(screen.getByTestId('plan-recap-edit-btn').textContent).toContain('Edit selection');
  });

  it('calls onEditSelection when edit link clicked', () => {
    const onEditSelection = vi.fn();
    render(<PlanRecap selectedIdeas={defaultIdeas} onEditSelection={onEditSelection} />);
    fireEvent.click(screen.getByTestId('plan-recap-edit-btn'));
    expect(onEditSelection).toHaveBeenCalledOnce();
  });

  it('does not render edit link when onEditSelection not provided', () => {
    render(<PlanRecap selectedIdeas={defaultIdeas} />);
    expect(screen.queryByTestId('plan-recap-edit-btn')).toBeNull();
  });

  it('shows empty state when no ideas selected', () => {
    render(<PlanRecap selectedIdeas={[]} />);
    expect(screen.getByTestId('plan-recap-empty')).toBeTruthy();
  });

  it('does not render badges container when ideas array is empty', () => {
    render(<PlanRecap selectedIdeas={[]} />);
    expect(screen.queryByTestId('plan-recap-badges')).toBeNull();
  });
});
