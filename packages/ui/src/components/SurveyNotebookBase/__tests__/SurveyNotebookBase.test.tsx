import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SurveyNotebookBase } from '../SurveyNotebookBase';
import type { SurveyEvaluation } from '@variscout/core/survey';

const evaluation: SurveyEvaluation = {
  possibility: {
    overallStatus: 'can-do-with-caution',
    items: [
      {
        id: 'standard-four-lenses',
        instrument: 'Standard / Four Lenses',
        status: 'can-do-now',
        requiredColumns: ['outcome', 'one or more factors'],
        nextUnlock: 'Use the mapped outcome and factors.',
        detail: 'Outcome and factors are mapped.',
        mode: 'standard',
      },
    ],
  },
  power: {
    overallStatus: 'ask-for-next',
    items: [
      {
        id: 'time-subgroup-coverage',
        check: 'Time and subgroup coverage',
        status: 'ask-for-next',
        currentPowerState: 'Time/batch context is missing.',
        blindSpot: 'A shift effect could be invisible overall.',
        nextLever: 'Add a batch axis.',
      },
    ],
  },
  trust: {
    overallStatus: 'can-do-with-caution',
    items: [
      {
        id: 'outcome-signal',
        signal: 'Fill_Weight',
        status: 'can-do-with-caution',
        archetype: 'unknown',
        trustLabel: 'Advisory',
        weakLink: 'No persisted Signal Card exists yet.',
        operationalDefinition: 'Define how Fill_Weight is measured.',
      },
    ],
  },
  recommendations: [
    {
      id: 'mapping:time-batch-axis',
      kind: 'add-time-batch-axis',
      title: 'Add a time or batch axis',
      detail: 'Chronology is missing.',
      actionText: 'Add sample time, production time, lot, run, or batch sequence.',
      status: 'ask-for-next',
      priority: 60,
      source: 'data-affordance',
      target: { type: 'column' },
    },
  ],
  diagnostics: {
    rowCount: 24,
    columns: ['Fill_Weight', 'Machine'],
    selected: {
      outcomeColumn: 'Fill_Weight',
      factorColumns: ['Machine'],
    },
    detectedColumns: {
      outcome: 'Fill_Weight',
      factors: ['Machine'],
      timeColumn: null,
      confidence: 'high',
      columnAnalysis: [],
    },
    wideFormat: {
      isWideFormat: false,
      channels: [],
      metadataColumns: ['Fill_Weight', 'Machine'],
      confidence: 'low',
      reason: 'Only one numeric column found.',
    },
    yamazumi: {
      isYamazumiFormat: false,
      confidence: 'low',
      suggestedMapping: {},
      reason: 'No activity type values found.',
    },
    defect: {
      isDefectFormat: false,
      confidence: 'low',
      dataShape: 'event-log',
      suggestedMapping: {},
    },
    inferredMode: {
      mode: 'standard',
      reason: 'No mode-specific structure declared.',
      rulesSatisfied: ['standard.fallback'],
    },
    gaps: [],
  },
};

describe('SurveyNotebookBase', () => {
  it('renders Possibility, Power, and Trust tabs', () => {
    render(<SurveyNotebookBase evaluation={evaluation} />);

    expect(screen.getByTestId('survey-tab-possibility')).toBeDefined();
    expect(screen.getByTestId('survey-tab-power')).toBeDefined();
    expect(screen.getByTestId('survey-tab-trust')).toBeDefined();
    expect(screen.getByText('Standard / Four Lenses')).toBeDefined();
  });

  it('switches between notebook tabs', () => {
    render(<SurveyNotebookBase evaluation={evaluation} />);

    fireEvent.click(screen.getByTestId('survey-tab-power'));
    expect(screen.getByText('Time and subgroup coverage')).toBeDefined();

    fireEvent.click(screen.getByTestId('survey-tab-trust'));
    expect(screen.getByText('Fill_Weight')).toBeDefined();
  });

  it('renders the same content in compact mode', () => {
    render(<SurveyNotebookBase evaluation={evaluation} compact />);

    expect(screen.getByTestId('survey-notebook-compact')).toBeDefined();
    expect(screen.getByText('Standard / Four Lenses')).toBeDefined();

    fireEvent.click(screen.getByTestId('survey-tab-power'));
    expect(screen.getByText('Add a batch axis.')).toBeDefined();
  });

  it('calls onAcceptRecommendation with the selected recommendation', () => {
    const onAcceptRecommendation = vi.fn();
    render(
      <SurveyNotebookBase evaluation={evaluation} onAcceptRecommendation={onAcceptRecommendation} />
    );

    fireEvent.click(screen.getByRole('button', { name: /accept next move/i }));
    expect(onAcceptRecommendation).toHaveBeenCalledWith(evaluation.recommendations[0]);
  });
});
