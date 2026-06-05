import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ControlHandoff, ControlRecord } from '@variscout/core';
import { ImprovementProjectForm } from '../ImprovementProjectForm';
import { OutcomeReferenceSection } from '../sections/OutcomeReferenceSection';

const makeControlRecord = (
  overrides: Partial<ControlRecord & { title?: string }> & Pick<ControlRecord, 'id' | 'cadence'>
): ControlRecord & { title?: string } =>
  ({
    createdAt: 1,
    deletedAt: null,
    updatedAt: 1,
    projectId: 'inv-1',
    hubId: 'hub-1',
    ...overrides,
  }) as ControlRecord & { title?: string };

const makeHandoff = (
  overrides: Partial<ControlHandoff> & Pick<ControlHandoff, 'id' | 'surface' | 'systemName'>
): ControlHandoff =>
  ({
    createdAt: 1,
    deletedAt: null,
    projectId: 'inv-1',
    hubId: 'hub-1',
    operationalOwner: { displayName: 'Process Owner' },
    handoffDate: Date.UTC(2026, 5, 15),
    description: 'Control transferred to operating system.',
    retainControlReview: true,
    recordedBy: { displayName: 'Improvement Lead' },
    ...overrides,
  }) as ControlHandoff;

describe('OutcomeReferenceSection', () => {
  it('renders the required empty state when no sustainment record is linked', () => {
    render(<OutcomeReferenceSection />);

    expect(
      screen.getByText('Control: not yet started - set up after Improvement closes.')
    ).toBeInTheDocument();
  });

  it('renders sustainment summary metadata and clicking calls onNavigate with its target', () => {
    const onNavigate = vi.fn();

    render(
      <OutcomeReferenceSection
        controlRecord={makeControlRecord({
          id: 'sr-1',
          title: 'Mix temperature sustainment',
          cadence: 'monthly',
          latestVerdict: 'holding',
          nextReviewDue: '2026-07-01T00:00:00.000Z',
          owner: { displayName: 'Avery Owner' },
        })}
        onNavigate={onNavigate}
      />
    );

    const card = screen.getByRole('button', { name: /mix temperature sustainment/i });

    expect(card).toHaveTextContent('Mix temperature sustainment');
    expect(card).toHaveTextContent('holding');
    expect(card).toHaveTextContent('monthly');
    expect(card).toHaveTextContent('Next review 2026-07-01');
    expect(card).toHaveTextContent('Avery Owner');

    fireEvent.click(card);

    expect(onNavigate).toHaveBeenCalledWith({ kind: 'controlRecord', id: 'sr-1' });
  });

  it('renders handoff summary metadata and clicking calls onNavigate with its target', () => {
    const onNavigate = vi.fn();

    render(
      <OutcomeReferenceSection
        controlHandoff={makeHandoff({
          id: 'handoff-1',
          surface: 'qms-procedure',
          systemName: 'QMS-42',
          operationalOwner: { displayName: 'Jordan Ops' },
          handoffDate: Date.UTC(2026, 6, 2),
        })}
        onNavigate={onNavigate}
      />
    );

    const card = screen.getByRole('button', { name: /qms-42/i });

    expect(card).toHaveTextContent('qms procedure');
    expect(card).toHaveTextContent('QMS-42');
    expect(card).toHaveTextContent('Jordan Ops');
    expect(card).toHaveTextContent('Effective 2026-07-02');

    fireEvent.click(card);

    expect(onNavigate).toHaveBeenCalledWith({ kind: 'controlHandoff', id: 'handoff-1' });
  });

  it('does not render focusable no-op buttons when onNavigate is omitted', () => {
    render(
      <OutcomeReferenceSection
        controlRecord={makeControlRecord({
          id: 'sr-1',
          title: 'Mix temperature sustainment',
          cadence: 'weekly',
        })}
        controlHandoff={makeHandoff({
          id: 'handoff-1',
          surface: 'work-instruction',
          systemName: 'WI-900',
        })}
      />
    );

    expect(
      screen.queryByRole('button', { name: /mix temperature sustainment/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /wi-900/i })).not.toBeInTheDocument();
  });

  it('does not render editable form fields', () => {
    const { container } = render(
      <OutcomeReferenceSection
        controlRecord={makeControlRecord({
          id: 'sr-1',
          title: 'Mix temperature sustainment',
          cadence: 'weekly',
        })}
        controlHandoff={makeHandoff({
          id: 'handoff-1',
          surface: 'work-instruction',
          systemName: 'WI-900',
        })}
      />
    );

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(container.querySelector('input, textarea, select')).toBeNull();
  });
});

describe('ImprovementProjectForm outcome reference integration', () => {
  it('renders OutcomeReferenceSection in section six when outcome reference props are provided', () => {
    render(
      <ImprovementProjectForm
        outcomeReferenceProps={{
          controlRecord: makeControlRecord({
            id: 'sr-1',
            title: 'Mix temperature sustainment',
            cadence: 'monthly',
            latestVerdict: 'holding',
          }),
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Outcome reference' }));

    const section = screen.getByRole('region', { name: 'Outcome reference' });
    expect(within(section).getByText('Mix temperature sustainment')).toBeInTheDocument();
    expect(within(section).getByText('holding')).toBeInTheDocument();
  });

  it('keeps sectionContent outcome override ahead of outcome reference props', () => {
    render(
      <ImprovementProjectForm
        outcomeReferenceProps={{
          controlRecord: makeControlRecord({
            id: 'sr-1',
            title: 'Mix temperature sustainment',
            cadence: 'monthly',
          }),
        }}
        sectionContent={{
          outcome: <div>Custom outcome override</div>,
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Outcome reference' }));

    expect(screen.getByText('Custom outcome override')).toBeInTheDocument();
    expect(screen.queryByText('Mix temperature sustainment')).not.toBeInTheDocument();
  });
});
