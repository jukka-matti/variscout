import React, { useMemo } from 'react';
import type { Finding, Hypothesis, HypothesisDisplayStatus } from '@variscout/core/findings';
import {
  deriveHypothesisActivity,
  displayHypothesisStatus,
  evidenceTypesForHypothesis,
  getHypothesisDisplayStatus,
} from '@variscout/core/findings';
import { deriveHypothesisStatus } from '@variscout/core/survey';
import type { MeasurementPlan } from '@variscout/core/measurementPlan';

export interface CausesMatrixProps {
  hubs: Hypothesis[];
  findings: Finding[];
  plans: MeasurementPlan[];
  now: number;
  onFocusHub?: (hubId: Hypothesis['id']) => void;
}

type EvidenceAngle = Finding['evidenceType'];

const EVIDENCE_ANGLES: Array<{ key: EvidenceAngle; label: string }> = [
  { key: 'data', label: 'Data' },
  { key: 'gemba', label: 'Gemba' },
  { key: 'expert', label: 'Expert' },
];

const VERDICT_CLASS: Record<HypothesisDisplayStatus, string> = {
  suspected: 'bg-amber-50 text-amber-700 border-amber-200',
  verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'ruled-out': 'bg-slate-100 text-slate-700 border-slate-200',
};

export function CausesMatrix({
  hubs,
  findings,
  plans,
  now,
  onFocusHub,
}: CausesMatrixProps): React.JSX.Element {
  const rows = useMemo(
    () =>
      hubs.map(hub => {
        const derivedStatus = deriveHypothesisStatus(hub, findings);
        const display = displayHypothesisStatus(derivedStatus);
        const displayStatus = getHypothesisDisplayStatus(derivedStatus);
        const evidenceTypes = evidenceTypesForHypothesis(hub, findings);
        const hubPlans = plans.filter(plan => plan.hypothesisId === hub.id);
        const activity = deriveHypothesisActivity({
          hub: { ...hub, status: derivedStatus },
          plans: hubPlans,
          now,
        });

        return {
          hub,
          display,
          displayStatus,
          evidenceTypes,
          activity,
          breakAttempts: summarizeBreakAttempts(hub),
          inFlight: summarizeInFlight(activity),
        };
      }),
    [findings, hubs, now, plans]
  );

  const digest = rows.reduce(
    (acc, row) => {
      if (row.displayStatus === 'verified') acc.verified += 1;
      if (row.displayStatus === 'ruled-out') acc.ruledOut += 1;
      if (row.activity.inFlightPlans.length > 0 || row.activity.pendingAttempts.length > 0) {
        acc.inFlight += 1;
      }
      if (row.activity.stalled.isStalled) acc.stalled += 1;
      return acc;
    },
    { verified: 0, inFlight: 0, stalled: 0, ruledOut: 0 }
  );

  const digestText = `${rows.length} causes · ${digest.verified} verified · ${digest.inFlight} in flight · ${digest.stalled} stalled · ${digest.ruledOut} ruled out`;

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-edge px-4 py-3">
        <h2 className="text-sm font-semibold text-content">Suspected causes</h2>
        <span className="text-xs text-content-tertiary">{digestText}</span>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-8 text-sm text-content-secondary">
          No suspected causes yet.
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto p-4">
          <table className="min-w-full border-separate border-spacing-0 text-left text-xs">
            <caption className="sr-only">Causes matrix</caption>
            <thead>
              <tr>
                <th className="sticky top-0 z-10 border-b border-edge bg-surface px-3 py-2 font-semibold text-content">
                  Suspected cause
                </th>
                <th className="sticky top-0 z-10 border-b border-edge bg-surface px-3 py-2 font-semibold text-content">
                  Data
                </th>
                <th className="sticky top-0 z-10 border-b border-edge bg-surface px-3 py-2 font-semibold text-content">
                  Gemba
                </th>
                <th className="sticky top-0 z-10 border-b border-edge bg-surface px-3 py-2 font-semibold text-content">
                  Expert
                </th>
                <th className="sticky top-0 z-10 border-b border-edge bg-surface px-3 py-2 font-semibold text-content">
                  Break attempts
                </th>
                <th className="sticky top-0 z-10 border-b border-edge bg-surface px-3 py-2 font-semibold text-content">
                  In flight
                </th>
                <th className="sticky top-0 z-10 border-b border-edge bg-surface px-3 py-2 font-semibold text-content">
                  Verdict
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr
                  key={row.hub.id}
                  tabIndex={onFocusHub ? 0 : undefined}
                  onClick={() => onFocusHub?.(row.hub.id)}
                  onKeyDown={event => {
                    if (!onFocusHub) return;
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onFocusHub(row.hub.id);
                    }
                  }}
                  className={
                    onFocusHub
                      ? 'cursor-pointer hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-ring'
                      : undefined
                  }
                >
                  <th className="border-b border-edge px-3 py-2 align-top font-medium text-content">
                    {row.hub.name}
                  </th>
                  {EVIDENCE_ANGLES.map(angle => (
                    <td
                      key={angle.key}
                      className="border-b border-edge px-3 py-2 align-top text-content-secondary"
                    >
                      {row.evidenceTypes.has(angle.key) ? angle.label : '—'}
                    </td>
                  ))}
                  <td className="border-b border-edge px-3 py-2 align-top text-content-secondary">
                    {row.breakAttempts}
                  </td>
                  <td className="border-b border-edge px-3 py-2 align-top text-content-secondary">
                    {row.inFlight}
                  </td>
                  <td className="border-b border-edge px-3 py-2 align-top">
                    <span
                      className={`inline-flex rounded border px-2 py-0.5 font-semibold ${VERDICT_CLASS[row.displayStatus]}`}
                    >
                      {row.display.label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function summarizeBreakAttempts(hub: Hypothesis): string {
  const attempts = hub.disconfirmationAttempts ?? [];
  if (attempts.length === 0) return 'none';

  const survived = attempts.filter(attempt => attempt.verdict === 'survived').length;
  const failed = attempts.filter(attempt => attempt.verdict === 'refuted').length;
  const pending = attempts.filter(attempt => attempt.verdict === 'pending').length;
  const parts: string[] = [];
  if (survived > 0) parts.push(`${survived} survived`);
  if (failed > 0) parts.push(`${failed} failed`);
  if (pending > 0) parts.push(`${pending} pending`);
  return parts.join(' · ');
}

function summarizeInFlight(activity: ReturnType<typeof deriveHypothesisActivity>): string {
  if (activity.stalled.isStalled) return `stalled ${activity.stalled.quietWorkingDays}d`;

  const planLabels = activity.inFlightPlans.map(plan => plan.primaryFactor);
  const pendingAttempts = activity.pendingAttempts.length;
  if (pendingAttempts > 0) {
    planLabels.push(`${pendingAttempts} pending break attempt${pendingAttempts === 1 ? '' : 's'}`);
  }

  return planLabels.length > 0 ? planLabels.join(' · ') : '—';
}
