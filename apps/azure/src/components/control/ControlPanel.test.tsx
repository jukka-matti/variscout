import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProcessHub, ControlRecord, ControlReview } from '@variscout/core';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import ControlPanel from './ControlPanel';
import { azureHubRepository } from '../../persistence';

vi.mock('@variscout/ui', async () => {
  const React = await import('react');
  return {
    ControlForm: (props: {
      record: ControlRecord;
      reviews?: ControlReview[];
      onRecordChange?: (patch: Partial<ControlRecord>) => void;
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
            onClick: () => props.onRecordChange?.({ targetSummary: 'Updated target' }),
          },
          'Update target'
        )
      ),
  };
});

vi.mock('../../persistence', () => ({
  azureHubRepository: {
    dispatch: vi.fn().mockResolvedValue(undefined),
    controlRecords: {
      listByHub: vi.fn().mockResolvedValue([]),
    },
    controlReviews: {
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
  vi.mocked(azureHubRepository.dispatch).mockResolvedValue(undefined);
  vi.mocked(azureHubRepository.controlRecords.listByHub).mockResolvedValue([]);
  vi.mocked(azureHubRepository.controlReviews.listByRecord).mockResolvedValue([]);
});

describe('ControlPanel (Azure)', () => {
  it('creates a sustainment record for the active hub and carries forward the first closed project goal', async () => {
    render(<ControlPanel activeHub={makeHub()} onBack={vi.fn()} />);

    await waitFor(() => expect(azureHubRepository.dispatch).toHaveBeenCalledTimes(1));
    expect(azureHubRepository.dispatch).toHaveBeenCalledWith(
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
    const record: ControlRecord = {
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
    vi.mocked(azureHubRepository.controlRecords.listByHub).mockResolvedValue([record]);
    vi.mocked(azureHubRepository.controlReviews.listByRecord).mockResolvedValue([
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

    render(<ControlPanel activeHub={makeHub()} onBack={vi.fn()} />);

    await waitFor(() =>
      expect(screen.getByTestId('sustainment-form')).toHaveTextContent('Reviews 1')
    );
    expect(azureHubRepository.dispatch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Update target' }));

    await waitFor(() =>
      expect(azureHubRepository.dispatch).toHaveBeenCalledWith({
        kind: 'SUSTAINMENT_RECORD_UPDATE',
        recordId: 'sr-1',
        patch: { targetSummary: 'Updated target' },
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
      <ControlPanel activeHub={makeHub([first, second])} targetId="ip-second" onBack={vi.fn()} />
    );

    await waitFor(() =>
      expect(azureHubRepository.dispatch).toHaveBeenCalledWith(
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
