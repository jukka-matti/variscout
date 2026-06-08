import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createFinding, createHypothesis, type DisconfirmationAttempt } from '@variscout/core';
import type { Finding, Hypothesis } from '@variscout/core';
import type { MeasurementPlan } from '@variscout/core/measurementPlan';
import { CausesMatrix } from '../CausesMatrix';

const MONDAY = Date.UTC(2026, 5, 1, 12, 0, 0);
const NEXT_MONDAY = Date.UTC(2026, 5, 8, 12, 0, 0);

function finding(text: string, evidenceType: Finding['evidenceType']): Finding {
  return { ...createFinding(text, {}, null), evidenceType, createdAt: MONDAY };
}

function hub(name: string, findings: Finding[], overrides: Partial<Hypothesis> = {}): Hypothesis {
  return {
    ...createHypothesis(
      name,
      '',
      findings.map(f => f.id)
    ),
    createdAt: MONDAY,
    updatedAt: MONDAY,
    ...overrides,
  };
}

function survivedAttempt(overrides: Partial<DisconfirmationAttempt> = {}): DisconfirmationAttempt {
  return {
    id: 'da-survived',
    attemptedAt: new Date(MONDAY).toISOString(),
    attemptedBy: { userId: 'lead', displayName: 'Lead' },
    description: 'Try the opposite shift explanation',
    verdict: 'survived',
    linkedFindingIds: [],
    ...overrides,
  };
}

function plan(overrides: Partial<MeasurementPlan> = {}): MeasurementPlan {
  return {
    id: 'mp1',
    hypothesisId: 'h1',
    outcome: 'CycleTime',
    primaryFactor: 'Shift',
    neededFactors: [],
    sampleSize: 12,
    method: 'gemba-walk',
    owner: 'lead',
    status: 'planned',
    scope: [],
    processLocation: '',
    linkedFindingIds: [],
    dueDate: '2026-06-12',
    createdAt: MONDAY,
    deletedAt: null,
    ...overrides,
  };
}

describe('<CausesMatrix />', () => {
  it('renders all suspected causes with evidence angles, break attempts, in-flight activity, verdicts, and digest totals', () => {
    const data = finding('CycleTime high on Line B', 'data');
    const gemba = finding('Jig sticks during changeover', 'gemba');
    const expert = finding('Buyer reports batch substitution', 'expert');
    const refuting = { ...finding('Maintenance schedule does not align', 'data'), refutes: true };

    const verified = hub('Equipment diff A to B', [data, gemba], {
      id: 'h-verified',
      disconfirmationAttempts: [survivedAttempt()],
    });
    const inFlight = hub('Night shift staffing', [expert], { id: 'h-in-flight' });
    const stalled = hub('Material batch', [], {
      id: 'h-stalled',
      status: 'needs-disconfirmation',
      updatedAt: MONDAY,
    });
    const ruledOut = hub('Maintenance schedule', [refuting], { id: 'h-ruled-out' });

    render(
      <CausesMatrix
        hubs={[verified, inFlight, stalled, ruledOut]}
        findings={[data, gemba, expert, refuting]}
        plans={[plan({ id: 'mp-night', hypothesisId: 'h-in-flight', primaryFactor: 'Staffing' })]}
        now={NEXT_MONDAY}
        onFocusHub={vi.fn()}
      />
    );

    expect(
      screen.getByText('4 causes · 1 verified · 1 in flight · 1 stalled · 1 ruled out')
    ).toBeInTheDocument();

    const verifiedRow = screen.getByRole('row', { name: /Equipment diff A to B/i });
    expect(within(verifiedRow).getByText('Data')).toBeInTheDocument();
    expect(within(verifiedRow).getByText('Gemba')).toBeInTheDocument();
    expect(within(verifiedRow).getByText('1 survived')).toBeInTheDocument();
    expect(within(verifiedRow).getByText('Verified')).toBeInTheDocument();

    const inFlightRow = screen.getByRole('row', { name: /Night shift staffing/i });
    expect(within(inFlightRow).getByText('Expert')).toBeInTheDocument();
    expect(within(inFlightRow).getByText(/Staffing/)).toBeInTheDocument();
    expect(within(inFlightRow).getByText('Suspected')).toBeInTheDocument();

    const stalledRow = screen.getByRole('row', { name: /Material batch/i });
    expect(within(stalledRow).getByText('stalled 5d')).toBeInTheDocument();
    expect(within(stalledRow).getByText('Suspected')).toBeInTheDocument();

    const ruledOutRow = screen.getByRole('row', { name: /Maintenance schedule/i });
    expect(within(ruledOutRow).getByText('Ruled out')).toBeInTheDocument();
  });

  it('renders an empty read-only matrix state', () => {
    render(<CausesMatrix hubs={[]} findings={[]} plans={[]} now={NEXT_MONDAY} />);

    expect(screen.getByText('0 causes · 0 verified · 0 in flight · 0 stalled · 0 ruled out'));
    expect(screen.getByText(/No suspected causes yet/i)).toBeInTheDocument();
  });

  it('calls onFocusHub with the clicked row id without writing anything else', () => {
    const f = finding('Operator notes night-shift gap', 'gemba');
    const h = hub('Night shift staffing', [f], { id: 'h-night' });
    const onFocusHub = vi.fn();

    render(
      <CausesMatrix
        hubs={[h]}
        findings={[f]}
        plans={[]}
        now={NEXT_MONDAY}
        onFocusHub={onFocusHub}
      />
    );

    fireEvent.click(screen.getByRole('row', { name: /Night shift staffing/i }));

    expect(onFocusHub).toHaveBeenCalledWith('h-night');
  });
});
