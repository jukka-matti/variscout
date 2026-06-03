import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Finding, Hypothesis } from '@variscout/core/findings';
import { ImprovementProjectForm } from '../ImprovementProjectForm';
import { AnalyzeLineageSection } from '../sections/AnalyzeLineageSection';

const makeHypothesis = (
  overrides: Partial<Hypothesis> & Pick<Hypothesis, 'id' | 'name' | 'status'>
): Hypothesis =>
  ({
    createdAt: 1,
    deletedAt: null,
    synthesis: '',
    questionIds: [],
    findingIds: [],
    updatedAt: 1,
    investigationId: 'inv-1',
    ...overrides,
  }) as Hypothesis;

const makeFinding = (overrides: Partial<Finding> & Pick<Finding, 'id' | 'text'>): Finding =>
  ({
    createdAt: 1,
    deletedAt: null,
    context: { type: 'chart', chartId: 'chart-1' },
    evidenceType: 'data',
    status: 'observed',
    comments: [],
    statusChangedAt: 1,
    investigationId: 'inv-1',
    ...overrides,
  }) as Finding;

describe('AnalyzeLineageSection', () => {
  it('renders hypothesis chips with name, status, synthesis, and theme metadata', () => {
    render(
      <AnalyzeLineageSection
        hypotheses={[
          makeHypothesis({
            id: 'h-1',
            name: 'Night shift setup drift',
            status: 'evidence-survived-test',
            synthesis: 'Setup standards vary after handoff.',
            themeTags: ['handoff', 'setup'],
          }),
        ]}
      />
    );

    const chip = screen.getByText('Night shift setup drift').closest('article');

    expect(chip).toHaveTextContent('Night shift setup drift');
    expect(chip).toHaveTextContent('evidence survived test');
    expect(chip).toHaveTextContent('Setup standards vary after handoff.');
    expect(chip).toHaveTextContent('handoff');
    expect(chip).toHaveTextContent('setup');
  });

  it('renders finding chips with text, evidence type, and status metadata', () => {
    render(
      <AnalyzeLineageSection
        findings={[
          makeFinding({
            id: 'f-1',
            text: 'Setup time spikes on night shift.',
            evidenceType: 'gemba',
            status: 'analyzed',
          }),
        ]}
      />
    );

    const chip = screen.getByText('Setup time spikes on night shift.').closest('article');

    expect(chip).toHaveTextContent('Setup time spikes on night shift.');
    expect(chip).toHaveTextContent('gemba');
    expect(chip).toHaveTextContent('analyzed');
  });

  it('clicking hypothesis and finding chips fires onNavigate with the correct target', () => {
    const onNavigate = vi.fn();

    render(
      <AnalyzeLineageSection
        hypotheses={[makeHypothesis({ id: 'h-1', name: 'Nozzle wear', status: 'evidenced' })]}
        findings={[makeFinding({ id: 'f-1', text: 'Scrap rises after 2 PM' })]}
        onNavigate={onNavigate}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /nozzle wear/i }));
    fireEvent.click(screen.getByRole('button', { name: /scrap rises after 2 pm/i }));

    expect(onNavigate).toHaveBeenNthCalledWith(1, { kind: 'hypothesis', id: 'h-1' });
    expect(onNavigate).toHaveBeenNthCalledWith(2, { kind: 'finding', id: 'f-1' });
  });

  it('does not render a textbox or narrative editor', () => {
    render(
      <AnalyzeLineageSection
        hypotheses={[makeHypothesis({ id: 'h-1', name: 'Nozzle wear', status: 'evidenced' })]}
        findings={[makeFinding({ id: 'f-1', text: 'Scrap rises after 2 PM' })]}
      />
    );

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('renders non-interactive chips when no navigation callback is provided', () => {
    render(
      <AnalyzeLineageSection
        hypotheses={[makeHypothesis({ id: 'h-1', name: 'Nozzle wear', status: 'evidenced' })]}
        findings={[makeFinding({ id: 'f-1', text: 'Scrap rises after 2 PM' })]}
      />
    );

    expect(screen.queryByRole('button', { name: /nozzle wear/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /scrap rises after 2 pm/i })
    ).not.toBeInTheDocument();
  });

  it('uses unique heading ids when multiple lineage sections render', () => {
    render(
      <div>
        <AnalyzeLineageSection />
        <AnalyzeLineageSection />
      </div>
    );

    const hypothesisHeadingIds = screen
      .getAllByRole('heading', { name: 'Linked hypotheses' })
      .map(heading => heading.id);
    const findingHeadingIds = screen
      .getAllByRole('heading', { name: 'Linked findings' })
      .map(heading => heading.id);

    expect(new Set(hypothesisHeadingIds).size).toBe(hypothesisHeadingIds.length);
    expect(new Set(findingHeadingIds).size).toBe(findingHeadingIds.length);
  });

  it('renders empty states for no linked hypotheses and no linked findings', () => {
    render(<AnalyzeLineageSection />);

    expect(screen.getByText(/no linked hypotheses yet/i)).toBeInTheDocument();
    expect(screen.getByText(/no linked findings yet/i)).toBeInTheDocument();
  });
});

describe('ImprovementProjectForm investigation lineage integration', () => {
  it('renders AnalyzeLineageSection in section four when lineage props are provided', () => {
    render(
      <ImprovementProjectForm
        lineageProps={{
          hypotheses: [
            makeHypothesis({
              id: 'h-1',
              name: 'Night shift setup drift',
              status: 'evidence-survived-test',
            }),
          ],
          findings: [makeFinding({ id: 'f-1', text: 'Setup time spikes on night shift.' })],
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Investigation lineage' }));

    const section = screen.getByRole('region', { name: 'Investigation lineage' });
    expect(within(section).getByText('Night shift setup drift')).toBeInTheDocument();
    expect(within(section).getByText('Setup time spikes on night shift.')).toBeInTheDocument();
  });

  it('keeps sectionContent lineage override ahead of lineage props', () => {
    render(
      <ImprovementProjectForm
        lineageProps={{
          hypotheses: [
            makeHypothesis({
              id: 'h-1',
              name: 'Night shift setup drift',
              status: 'evidence-survived-test',
            }),
          ],
        }}
        sectionContent={{
          lineage: <div>Custom lineage override</div>,
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Investigation lineage' }));

    expect(screen.getByText('Custom lineage override')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /night shift setup drift/i })
    ).not.toBeInTheDocument();
  });
});
