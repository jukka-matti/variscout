import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HandoffOverview, { type HandoffChecklistInputs } from '../HandoffOverview';

const allDone: HandoffChecklistInputs = {
  controlPlanDocumented: true,
  trainingDelivered: true,
  cadenceAssigned: true,
  processOwnerAcknowledged: true,
};

const pendingAck: HandoffChecklistInputs = {
  ...allDone,
  processOwnerAcknowledged: false,
};

describe('HandoffOverview', () => {
  it('shows 4 of 4 complete when all done', () => {
    render(
      <HandoffOverview
        inputs={allDone}
        onOpenReport={() => {}}
        onExportPdf={() => {}}
        onNudgeOwner={() => {}}
      />
    );
    expect(screen.getByText(/4 of 4 items complete/i)).toBeInTheDocument();
  });

  it('shows 3 of 4 complete when one item is pending', () => {
    render(
      <HandoffOverview
        inputs={pendingAck}
        onOpenReport={() => {}}
        onExportPdf={() => {}}
        onNudgeOwner={() => {}}
      />
    );
    expect(screen.getByText(/3 of 4 items complete/i)).toBeInTheDocument();
  });

  it('calls onNudgeOwner when nudge clicked on pending ack', () => {
    const onNudge = vi.fn();
    render(
      <HandoffOverview
        inputs={pendingAck}
        onOpenReport={() => {}}
        onExportPdf={() => {}}
        onNudgeOwner={onNudge}
      />
    );
    fireEvent.click(screen.getByTestId('handoff-nudge-owner'));
    expect(onNudge).toHaveBeenCalled();
  });
});
