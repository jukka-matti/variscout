import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ControlRecord, ControlReview, ProcessHub } from '@variscout/core';
import type { UseControlPanelModelReturn } from '@variscout/hooks';
import { useControlPanelModel } from '@variscout/hooks';
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

vi.mock('@variscout/hooks', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/hooks')>();
  return {
    ...actual,
    useControlPanelModel: vi.fn(),
  };
});

vi.mock('../../persistence', () => ({
  azureHubRepository: {
    dispatch: vi.fn(),
    controlRecords: {
      listByHub: vi.fn(),
    },
    controlReviews: {
      listByRecord: vi.fn(),
    },
  },
}));

const mockUseControlPanelModel = vi.mocked(useControlPanelModel);

function makeHub(): ProcessHub {
  return {
    id: 'hub-1',
    name: 'Paint line',
    createdAt: 1_714_000_000_000,
    deletedAt: null,
  };
}

function makeRecord(): ControlRecord {
  return {
    id: 'sr-1',
    hubId: 'hub-1',
    projectId: 'inv-1',
    status: 'verifying',
    title: 'Existing sustainment',
    lastEvaluatedSnapshotId: undefined,
    improvementDate: '2026-06-01T00:00:00.000Z',
    baseline: {
      capturedAt: 1_714_000_000_000,
      window: {
        startISO: '2026-04-01T00:00:00.000Z',
        endISO: '2026-05-31T23:59:59.999Z',
      },
      measure: 'fill_weight',
      n: 42,
      mean: 100.2,
      sigma: 0.8,
    },
    ladder: [7, 30, 90, 180],
    ladderStep: 0,
    nextCheckSuggestedAt: '2026-06-08T00:00:00.000Z',
    createdAt: 1_714_000_000_000,
    updatedAt: 1_714_000_000_000,
    deletedAt: null,
  };
}

function makeModel(
  overrides: Partial<UseControlPanelModelReturn> = {}
): UseControlPanelModelReturn {
  return {
    records: [],
    selectedRecord: null,
    reviews: [],
    error: null,
    isLoadingRecords: false,
    heading: 'Paint line',
    selectRecord: vi.fn(),
    updateSelectedRecord: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseControlPanelModel.mockReturnValue(makeModel());
});

describe('ControlPanel (Azure)', () => {
  it('passes the app repository and target id into the shared model hook', () => {
    const activeHub = makeHub();

    render(<ControlPanel activeHub={activeHub} targetId="ip-1" onBack={vi.fn()} />);

    expect(mockUseControlPanelModel).toHaveBeenCalledWith({
      activeHub,
      targetId: 'ip-1',
      repository: azureHubRepository,
    });
    expect(screen.getByText('Paint line')).toBeInTheDocument();
  });

  it('renders the shared model state and forwards ControlForm patches', () => {
    const updateSelectedRecord = vi.fn();
    mockUseControlPanelModel.mockReturnValue(
      makeModel({
        selectedRecord: makeRecord(),
        reviews: [{ id: 'review-1' } as ControlReview],
        updateSelectedRecord,
      })
    );

    render(<ControlPanel activeHub={makeHub()} onBack={vi.fn()} />);

    expect(screen.getByTestId('sustainment-form')).toHaveTextContent('Existing sustainment');
    expect(screen.getByTestId('sustainment-form')).toHaveTextContent('Reviews 1');

    fireEvent.click(screen.getByRole('button', { name: 'Update target' }));

    expect(updateSelectedRecord).toHaveBeenCalledWith({ targetSummary: 'Updated target' });
  });
});
