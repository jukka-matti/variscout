import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProcessHubView } from '../ProcessHubView';
import type { ProcessHubRollup, ProcessHubInvestigation, ProcessHub } from '@variscout/core';

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
});
