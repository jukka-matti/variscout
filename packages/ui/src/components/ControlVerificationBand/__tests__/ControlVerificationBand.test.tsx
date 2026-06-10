import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ControlRecord, ControlReview, SustainmentComparison } from '@variscout/core';
import { ControlVerificationBand } from '../ControlVerificationBand';

vi.mock('@variscout/charts', () => ({
  IChartBase: (props: {
    data: unknown[];
    phaseSplit?: { atISO: string };
    phaseLimits?: unknown;
    eventFlags?: unknown[];
  }) => (
    <div
      data-testid="verification-ichart"
      data-points={props.data.length}
      data-phase={props.phaseSplit?.atISO}
      data-events={props.eventFlags?.length ?? 0}
    />
  ),
}));

function makeRecord(overrides: Partial<ControlRecord> = {}): ControlRecord {
  return {
    id: 'sr-1',
    hubId: 'hub-1',
    projectId: 'inv-1',
    status: 'verifying',
    title: 'Hold fill weight',
    lastEvaluatedSnapshotId: undefined,
    improvementDate: '2026-06-01T00:00:00.000Z',
    baseline: {
      capturedAt: Date.parse('2026-06-02T00:00:00.000Z'),
      window: {
        startISO: '2026-05-01T00:00:00.000Z',
        endISO: '2026-05-31T23:59:59.999Z',
      },
      measure: 'fill_weight',
      n: 2,
      mean: 100,
      sigma: 1,
    },
    ladder: [7, 30, 90],
    ladderStep: 0,
    createdAt: 1_714_000_000_000,
    updatedAt: 1_714_000_000_000,
    deletedAt: null,
    ...overrides,
  };
}

function makeComparison(overrides: Partial<SustainmentComparison> = {}): SustainmentComparison {
  return {
    before: { source: 'frozen', n: 2, mean: 100, sigma: 1 },
    after: { n: 2, mean: 101, sigma: 0.5 },
    phases: {
      afterLimits: {
        window: {
          startISO: '2026-06-02T00:00:00.000Z',
          endISO: '2026-06-03T00:00:00.000Z',
        },
        n: 2,
        centerLine: 101,
        ucl: 102,
        lcl: 100,
      },
    },
    deltas: { meanPct: 0.01, sigmaPct: -0.5 },
    defects: {
      before: [{ category: 'under', count: 1 }],
      after: [{ category: 'over', count: 2 }],
    },
    ...overrides,
  };
}

describe('ControlVerificationBand', () => {
  it('renders chart, frozen baseline, paired stats, defects, and re-check action', () => {
    const onLogReview = vi.fn();
    const reviews = [
      {
        id: 'review-1',
        recordId: 'sr-1',
        hubId: 'hub-1',
        projectId: 'inv-1',
        reviewedAt: Date.parse('2026-06-10T00:00:00.000Z'),
        verdict: 'holding',
        nowStats: {
          window: {
            startISO: '2026-06-01T00:00:00.000Z',
            endISO: '2026-06-10T00:00:00.000Z',
          },
          n: 2,
          mean: 101,
          sigma: 0.5,
        },
        dataStamp: { rowCount: 4 },
        createdAt: Date.parse('2026-06-10T00:00:00.000Z'),
        deletedAt: null,
      } as ControlReview,
    ];

    render(
      <ControlVerificationBand
        record={makeRecord()}
        comparison={makeComparison()}
        reviews={reviews}
        rawData={[
          { captured_at: '2026-05-01T00:00:00.000Z', fill_weight: 99 },
          { captured_at: '2026-06-02T00:00:00.000Z', fill_weight: 101 },
        ]}
        timeColumn="captured_at"
        onLogReview={onLogReview}
      />
    );

    expect(screen.getByTestId('verification-ichart')).toHaveAttribute('data-points', '2');
    expect(screen.getByTestId('verification-ichart')).toHaveAttribute('data-events', '1');
    expect(screen.getByText(/baseline snapshot ·/i)).toBeInTheDocument();
    expect(screen.getByText('Before')).toBeInTheDocument();
    expect(screen.getByText('After')).toBeInTheDocument();
    expect(screen.getByText('Defect mix before')).toBeInTheDocument();
    expect(screen.getByText('Defect mix after')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Log re-check/i }));

    expect(onLogReview).toHaveBeenCalledWith('sr-1');
  });

  it('asks for re-ingest when no post-improvement rows exist', () => {
    render(
      <ControlVerificationBand record={makeRecord()} comparison={makeComparison({ after: null })} />
    );

    expect(screen.getByText(/Re-ingest data after Jun 1, 2026 to verify/i)).toBeInTheDocument();
  });

  it('shows the closing suggestion after the ladder is walked', () => {
    render(
      <ControlVerificationBand
        record={makeRecord({ ladderStep: 2 })}
        comparison={makeComparison()}
      />
    );

    expect(screen.getByText(/consider confirming sustained & closing/i)).toBeInTheDocument();
  });
});
