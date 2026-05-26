import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProcessHub, SustainmentRecord, SustainmentReview } from '@variscout/core';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import SustainmentPanel from '../SustainmentPanel';
import { pwaHubRepository } from '../../persistence';

vi.mock('@variscout/ui', async () => {
  const React = await import('react');
  return {
    SustainmentForm: (props: {
      record: SustainmentRecord;
      reviews?: SustainmentReview[];
      onRecordChange?: (patch: Partial<SustainmentRecord>) => void;
    }) =>
      React.createElement(
        'section',
        { 'data-testid': 'sustainment-form' },
        React.createElement('h3', null, props.record.title),
        React.createElement('p', null, props.record.goal?.freeText ?? 'No goal'),
        React.createElement('p', null, `Reviews ${props.reviews?.length ?? 0}`),
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => props.onRecordChange?.({ title: 'Updated sustainment' }),
          },
          'Rename'
        )
      ),
  };
});

vi.mock('../../persistence', () => ({
  pwaHubRepository: {
    dispatch: vi.fn().mockResolvedValue(undefined),
    sustainmentRecords: {
      listByHub: vi.fn().mockResolvedValue([]),
    },
    sustainmentReviews: {
      listByRecord: vi.fn().mockResolvedValue([]),
    },
  },
}));

function makeProject(overrides: Partial<ImprovementProject> = {}): ImprovementProject {
  return {
    id: 'ip-1',
    hubId: 'hub-1',
    status: 'closed',
    metadata: { title: 'Reduce defects', investigationId: 'inv-1' },
    goal: {
      outcomeGoals: [{ outcomeSpecId: 'outcome-1', target: 98 }],
      freeText: 'Hold first pass yield at 98%.',
    },
    sections: {
      background: {},
      investigationLineage: {},
      approach: { actionItemIds: ['action-1'] },
      outcomeReference: {},
    },
    createdAt: 1714000000000,
    updatedAt: 1714000000000,
    deletedAt: null,
    ...overrides,
  };
}

function makeHub(projects: ImprovementProject[] = [makeProject()]): ProcessHub {
  return {
    id: 'hub-1',
    name: 'Paint line',
    createdAt: 1714000000000,
    deletedAt: null,
    improvementProjects: projects,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(pwaHubRepository.dispatch).mockResolvedValue(undefined);
  vi.mocked(pwaHubRepository.sustainmentRecords.listByHub).mockResolvedValue([]);
  vi.mocked(pwaHubRepository.sustainmentReviews.listByRecord).mockResolvedValue([]);
});

describe('SustainmentPanel (PWA)', () => {
  it('creates a sustainment record for the active hub and carries forward the first closed project goal', async () => {
    render(<SustainmentPanel activeHub={makeHub()} onBack={vi.fn()} />);

    await waitFor(() => expect(pwaHubRepository.dispatch).toHaveBeenCalledTimes(1));
    expect(pwaHubRepository.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'SUSTAINMENT_RECORD_CREATE',
        hubId: 'hub-1',
        record: expect.objectContaining({
          hubId: 'hub-1',
          investigationId: 'inv-1',
          improvementProjectId: 'ip-1',
          title: 'Sustain Reduce defects',
          goal: expect.objectContaining({ freeText: 'Hold first pass yield at 98%.' }),
        }),
      })
    );
    expect(await screen.findByTestId('sustainment-form')).toHaveTextContent(
      'Hold first pass yield at 98%.'
    );
  });

  it('selects an existing live record, reads reviews through the repository, and persists edits by dispatch', async () => {
    const record: SustainmentRecord = {
      id: 'sr-1',
      hubId: 'hub-1',
      investigationId: 'inv-1',
      status: 'pending',
      title: 'Existing sustainment',
      consecutiveOnTargetTicks: 1,
      hasOverride: false,
      lastEvaluatedSnapshotId: undefined,
      cadence: 'monthly',
      createdAt: 1714000000000,
      updatedAt: 1714000000000,
      deletedAt: null,
    };
    vi.mocked(pwaHubRepository.sustainmentRecords.listByHub).mockResolvedValue([record]);
    vi.mocked(pwaHubRepository.sustainmentReviews.listByRecord).mockResolvedValue([
      {
        id: 'review-1',
        recordId: 'sr-1',
        hubId: 'hub-1',
        investigationId: 'inv-1',
        reviewedAt: 1714000000000,
        reviewer: { displayName: 'Reviewer' },
        verdict: 'holding',
        createdAt: 1714000000000,
        deletedAt: null,
      },
    ]);

    render(<SustainmentPanel activeHub={makeHub()} onBack={vi.fn()} />);

    await waitFor(() =>
      expect(screen.getByTestId('sustainment-form')).toHaveTextContent('Reviews 1')
    );
    expect(pwaHubRepository.dispatch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Rename' }));

    await waitFor(() =>
      expect(pwaHubRepository.dispatch).toHaveBeenCalledWith({
        kind: 'SUSTAINMENT_RECORD_UPDATE',
        recordId: 'sr-1',
        patch: { title: 'Updated sustainment' },
      })
    );
  });

  it('creates for the prompted closed project when a target id is supplied', async () => {
    const first = makeProject({
      id: 'ip-first',
      metadata: { title: 'First', investigationId: 'inv-1' },
    });
    const second = makeProject({
      id: 'ip-second',
      metadata: { title: 'Second', investigationId: 'inv-2' },
      goal: {
        outcomeGoals: [{ outcomeSpecId: 'outcome-2', target: 99 }],
        freeText: 'Hold the second target.',
      },
    });

    render(
      <SustainmentPanel
        activeHub={makeHub([first, second])}
        targetId="ip-second"
        onBack={vi.fn()}
      />
    );

    await waitFor(() =>
      expect(pwaHubRepository.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          record: expect.objectContaining({
            improvementProjectId: 'ip-second',
            investigationId: 'inv-2',
            title: 'Sustain Second',
            targetSummary: 'Hold the second target.',
          }),
        })
      )
    );
  });
});
