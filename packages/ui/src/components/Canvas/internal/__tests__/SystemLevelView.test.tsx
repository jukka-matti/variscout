import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ProcessMap } from '@variscout/core/frame';
import type { DataRow, Finding, Hypothesis, Question } from '@variscout/core';
import { SystemLevelView } from '../SystemLevelView';

const map: ProcessMap = {
  version: 1,
  ctsColumn: 'Fill Weight',
  nodes: [
    { id: 'mix', name: 'Mix', order: 0 },
    { id: 'fill', name: 'Fill', order: 1 },
  ],
  tributaries: [],
  createdAt: '2026-05-13T00:00:00.000Z',
  updatedAt: '2026-05-13T00:00:00.000Z',
};

const rows: DataRow[] = [
  { 'Fill Weight': 99.8, Timestamp: 1 },
  { 'Fill Weight': 100.1, Timestamp: 2 },
  { 'Fill Weight': 100.4, Timestamp: 3 },
  { 'Fill Weight': 101.3, Timestamp: 4 },
  { 'Fill Weight': 99.9, Timestamp: 5 },
];

const findings = [
  {
    id: 'finding-1',
    createdAt: 1,
    deletedAt: null,
    text: 'High fill variation',
    context: { activeFilters: {}, cumulativeScope: null },
    evidenceType: 'data',
    status: 'observed',
    comments: [],
    statusChangedAt: 1,
    investigationId: 'inv-1',
  },
  {
    id: 'finding-2',
    createdAt: 2,
    deletedAt: null,
    text: 'Mixer setup stable',
    context: { activeFilters: {}, cumulativeScope: null },
    evidenceType: 'data',
    status: 'analyzed',
    comments: [],
    statusChangedAt: 2,
    investigationId: 'inv-1',
  },
] as Finding[];

const question = (id: string, status: Question['status']): Question => ({
  id,
  createdAt: 1,
  deletedAt: null,
  text: `${id}?`,
  status,
  linkedFindingIds: [],
  updatedAt: 1,
  investigationId: 'inv-1',
});

const hypothesis = (id: string, status: Hypothesis['status']): Hypothesis => ({
  id,
  createdAt: 1,
  deletedAt: null,
  name: id,
  synthesis: 'Candidate mechanism',
  questionIds: [],
  findingIds: [],
  updatedAt: 1,
  investigationId: 'inv-1',
  status,
});

const questions = [
  question('question-1', 'open'),
  question('question-2', 'investigating'),
  question('question-3', 'answered'),
];
const hypotheses = [
  hypothesis('hypothesis-1', 'proposed'),
  hypothesis('hypothesis-2', 'evidenced'),
  hypothesis('hypothesis-3', 'refuted'),
];

describe('SystemLevelView', () => {
  it('renders the hub outcome panel from the hub outcome series without response-path CTAs', () => {
    render(
      <SystemLevelView
        hubId="hub-fill"
        map={map}
        rows={rows}
        specLimits={{ lsl: 99, usl: 101, target: 100, cpkTarget: 1.33 }}
        questions={questions}
        hypotheses={hypotheses}
        findings={findings}
      />
    );

    expect(screen.getByText('hub-fill')).toBeInTheDocument();
    expect(screen.getByText('Fill Weight')).toBeInTheDocument();
    expect(screen.getByTestId('outcome-distribution')).toHaveTextContent('n=5');
    expect(screen.getByTestId('drift-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('outcome-time-series')).toBeInTheDocument();
    expect(screen.getByTestId('outcome-capability')).toHaveTextContent('Cp');
    expect(screen.getByTestId('outcome-capability')).toHaveTextContent('Cpk');
    expect(screen.getByTestId('outcome-capability')).toHaveTextContent('Pp');
    expect(screen.getByTestId('outcome-capability')).toHaveTextContent('Ppk');
    expect(screen.getByTestId('inbox-digest')).toHaveTextContent('1 prompt');
    expect(screen.getByTestId('active-investigations-summary')).toHaveTextContent(
      '2 open questions'
    );
    expect(screen.getByTestId('active-investigations-summary')).toHaveTextContent(
      '2 active hypotheses'
    );
    expect(screen.getByTestId('active-investigations-summary')).toHaveTextContent('1 open finding');
    expect(screen.getByRole('button', { name: /Open SCOUT/i })).toBeDisabled();
    expect(screen.queryByText('Quick Action')).not.toBeInTheDocument();
    expect(screen.queryByText('Focused Investigation')).not.toBeInTheDocument();
    expect(screen.queryByText('Improvement Project')).not.toBeInTheDocument();
    expect(screen.queryByText('Sustainment')).not.toBeInTheDocument();
    expect(screen.queryByText('Handoff')).not.toBeInTheDocument();
  });

  it('falls back when no outcome is selected and calls the optional SCOUT callback', async () => {
    const onOpenScout = vi.fn();
    render(
      <SystemLevelView
        hubId="hub-unframed"
        map={{ ...map, ctsColumn: undefined }}
        rows={rows}
        questions={[]}
        hypotheses={[]}
        findings={[]}
        onOpenScout={onOpenScout}
      />
    );

    expect(screen.getByText('Outcome not selected')).toBeInTheDocument();
    expect(screen.getByTestId('outcome-distribution')).toHaveTextContent('No numeric outcome');

    fireEvent.click(screen.getByRole('button', { name: /Open SCOUT/i }));

    expect(onOpenScout).toHaveBeenCalledWith('hub-unframed');
  });
});
