import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProcessHubView } from '../ProcessHubView';
import type {
  ProcessHubRollup,
  ProcessHubInvestigation,
  ProcessHub,
  OutcomeSpec,
} from '@variscout/core';

vi.mock('../ProcessHubReviewPanel', () => ({
  default: () => <div data-testid="mock-process-hub-review-panel" />,
}));

vi.mock('../ProcessHubCapabilityTab', () => ({
  ProcessHubCapabilityTab: () => <div data-testid="mock-process-hub-capability-tab" />,
  default: () => <div data-testid="mock-process-hub-capability-tab" />,
}));

const hub: ProcessHub = { id: 'h1', name: 'Line A' } as ProcessHub;
const rollup = {
  hub,
  investigations: [],
  evidenceSnapshots: [],
} as unknown as ProcessHubRollup<ProcessHubInvestigation>;

const noop = vi.fn();
const baseProps = {
  rollup,
  onOpenInvestigation: noop,
  onStartInvestigation: noop,
  onSetupSustainment: noop,
  onLogReview: noop,
  onRecordHandoff: noop,
  onResponsePathAction: noop,
  onRequestAddNote: noop,
  onRequestEditNote: noop,
  onDeleteNote: noop,
  currentUserId: 'user-1',
  loadFindingsForItem: vi.fn().mockResolvedValue([]),
  onChipClick: noop,
  onFindingSelect: noop,
  persistInvestigation: vi.fn(),
  onHubCpkTargetCommit: vi.fn(),
} as const;

describe('ProcessHubView', () => {
  it('renders Status tab as default', () => {
    render(<ProcessHubView {...baseProps} />);
    expect(screen.getByRole('tab', { name: /status/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('switches to Capability tab on click', () => {
    render(<ProcessHubView {...baseProps} />);
    fireEvent.click(screen.getByRole('tab', { name: /capability/i }));
    expect(screen.getByRole('tab', { name: /capability/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('renders the Status tab panel by default', () => {
    render(<ProcessHubView {...baseProps} />);
    expect(screen.getByTestId('process-hub-status-tab-panel')).toBeInTheDocument();
  });

  it('renders the Capability tab panel when selected', () => {
    render(<ProcessHubView {...baseProps} />);
    fireEvent.click(screen.getByRole('tab', { name: /capability/i }));
    expect(screen.getByTestId('process-hub-capability-tab-panel')).toBeInTheDocument();
  });

  it('renders the GoalBanner above the tab container when hub.processGoal is set', () => {
    const goalHub: ProcessHub = {
      id: 'h2',
      name: 'Line B',
      processGoal: 'We mold barrels for medical customers.',
    } as ProcessHub;
    const goalRollup = {
      hub: goalHub,
      investigations: [],
      evidenceSnapshots: [],
    } as unknown as ProcessHubRollup<ProcessHubInvestigation>;
    render(<ProcessHubView {...baseProps} rollup={goalRollup} />);
    expect(screen.getByTestId('goal-banner')).toBeInTheDocument();
  });

  it('does not render the GoalBanner when hub.processGoal is absent', () => {
    render(<ProcessHubView {...baseProps} />);
    expect(screen.queryByTestId('goal-banner')).not.toBeInTheDocument();
  });

  it('wires GoalBanner onChange to onHubGoalChange with hubId', () => {
    const onHubGoalChange = vi.fn();
    const goalHub: ProcessHub = {
      id: 'h2',
      name: 'Line B',
      processGoal: 'Initial goal.',
    } as ProcessHub;
    const goalRollup = {
      hub: goalHub,
      investigations: [],
      evidenceSnapshots: [],
    } as unknown as ProcessHubRollup<ProcessHubInvestigation>;
    render(<ProcessHubView {...baseProps} rollup={goalRollup} onHubGoalChange={onHubGoalChange} />);
    // GoalBanner enters edit mode on click; saves via Save button
    fireEvent.click(screen.getByTestId('goal-banner'));
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Updated goal.' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onHubGoalChange).toHaveBeenCalledWith('h2', 'Updated goal.');
  });

  it('shows the framing prompt when hub is incomplete and onEditFraming is provided', () => {
    // hub has no processGoal and no outcomes → isProcessHubComplete returns false
    const onEditFraming = vi.fn();
    render(<ProcessHubView {...baseProps} onEditFraming={onEditFraming} />);
    expect(screen.getByTestId('hub-framing-prompt')).toBeInTheDocument();
  });

  it('hides the framing prompt when hub is complete', () => {
    const completeOutcome: OutcomeSpec = { columnName: 'FillWeight' } as OutcomeSpec;
    const completeHub: ProcessHub = {
      id: 'h3',
      name: 'Line C',
      processGoal: 'Reduce fill weight variation.',
      outcomes: [completeOutcome],
    } as ProcessHub;
    const completeRollup = {
      hub: completeHub,
      investigations: [],
      evidenceSnapshots: [],
    } as unknown as ProcessHubRollup<ProcessHubInvestigation>;
    const onEditFraming = vi.fn();
    render(<ProcessHubView {...baseProps} rollup={completeRollup} onEditFraming={onEditFraming} />);
    expect(screen.queryByTestId('hub-framing-prompt')).not.toBeInTheDocument();
  });

  it('hides the framing prompt when onEditFraming is absent even if hub is incomplete', () => {
    // No onEditFraming passed, hub is incomplete (no processGoal)
    render(<ProcessHubView {...baseProps} />);
    expect(screen.queryByTestId('hub-framing-prompt')).not.toBeInTheDocument();
  });

  it('calls onEditFraming with hubId when Add framing CTA is clicked', () => {
    const onEditFraming = vi.fn();
    render(<ProcessHubView {...baseProps} onEditFraming={onEditFraming} />);
    fireEvent.click(screen.getByTestId('hub-framing-prompt-cta'));
    expect(onEditFraming).toHaveBeenCalledWith('h1');
  });

  // ── OutcomePin per outcome ──────────────────────────────────────────────────

  it('renders no OutcomePin for an incomplete hub', () => {
    // base rollup hub has no processGoal and no outcomes → incomplete
    render(<ProcessHubView {...baseProps} />);
    expect(screen.queryByTestId('outcome-pin-row')).not.toBeInTheDocument();
    expect(screen.queryByTestId('outcome-pin')).not.toBeInTheDocument();
  });

  it('renders one OutcomePin per outcome for a complete hub', () => {
    const outcome1: OutcomeSpec = { columnName: 'FillWeight' } as OutcomeSpec;
    const outcome2: OutcomeSpec = { columnName: 'CycleTime' } as OutcomeSpec;
    const completeHub: ProcessHub = {
      id: 'h4',
      name: 'Line D',
      processGoal: 'Reduce fill weight variation.',
      outcomes: [outcome1, outcome2],
    } as ProcessHub;
    const completeRollup = {
      hub: completeHub,
      investigations: [],
      evidenceSnapshots: [],
    } as unknown as ProcessHubRollup<ProcessHubInvestigation>;
    render(<ProcessHubView {...baseProps} rollup={completeRollup} />);
    const pins = screen.getAllByTestId('outcome-pin');
    expect(pins).toHaveLength(2);
  });
});
