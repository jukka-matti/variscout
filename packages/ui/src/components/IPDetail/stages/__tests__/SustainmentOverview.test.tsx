import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { SustainmentRecord } from '@variscout/core';
import SustainmentOverview from '../SustainmentOverview';

const record: SustainmentRecord = {
  id: 'sr-1',
  createdAt: 0,
  deletedAt: null,
  updatedAt: 0,
  hubId: 'hub-1',
  investigationId: 'inv-1',
  improvementProjectId: 'ip-1',
  status: 'pending',
  title: 'Sustain Heads 5-8',
  cadence: 'weekly',
  consecutiveOnTargetTicks: 4,
  hasOverride: false,
  lastEvaluatedSnapshotId: undefined,
};

describe('SustainmentOverview', () => {
  it('renders 4 cadence tick pills matching consecutiveOnTargetTicks', () => {
    render(
      <SustainmentOverview
        record={record}
        onStartHandoff={() => {}}
        onOpenProcess={() => {}}
        onOpenAnalyze={() => {}}
      />
    );
    expect(screen.getAllByTestId(/^cadence-tick-/)).toHaveLength(4);
  });

  it('enables Start Handoff CTA when consecutiveOnTargetTicks >= 4', () => {
    render(
      <SustainmentOverview
        record={record}
        onStartHandoff={() => {}}
        onOpenProcess={() => {}}
        onOpenAnalyze={() => {}}
      />
    );
    expect(screen.getByTestId('sustainment-start-handoff')).not.toBeDisabled();
  });

  it('disables Start Handoff CTA when fewer than 4 ticks', () => {
    const r2: SustainmentRecord = { ...record, consecutiveOnTargetTicks: 2 };
    render(
      <SustainmentOverview
        record={r2}
        onStartHandoff={() => {}}
        onOpenProcess={() => {}}
        onOpenAnalyze={() => {}}
      />
    );
    expect(screen.getByTestId('sustainment-start-handoff')).toBeDisabled();
  });

  it('calls onStartHandoff when CTA clicked', () => {
    const onStart = vi.fn();
    render(
      <SustainmentOverview
        record={record}
        onStartHandoff={onStart}
        onOpenProcess={() => {}}
        onOpenAnalyze={() => {}}
      />
    );
    fireEvent.click(screen.getByTestId('sustainment-start-handoff'));
    expect(onStart).toHaveBeenCalled();
  });
});
