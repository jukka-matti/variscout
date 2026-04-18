/**
 * Gap detection for the FRAME workspace — the third FRAME job.
 *
 * The Process Map declares what the methodology wants (CTS, CTQ per step,
 * xs/tributaries, time/batch axis, spec limits). The user's uploaded data
 * declares what they have. A gap is what's missing between the two.
 *
 * The output drives:
 *   - inline warning glyphs on unfilled map nodes
 *   - a compact gap strip at the bottom of the FRAME view
 *   - a measurement plan the user takes back to the line
 *
 * Pure function. No side effects. Testable in isolation.
 *
 * See `docs/07-decisions/adr-070-frame-workspace.md` and
 *     `docs/superpowers/specs/2026-04-18-frame-process-map-design.md`.
 */

import type { Gap, GapDetectorInput } from './types';

/** Does a value look like a meaningful spec limit (finite number)? */
function hasFiniteSpec(value: number | undefined): boolean {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Detect gaps between the Process Map and the available data.
 *
 * Severity:
 *   - 'required'    — without this, the methodology can't execute
 *                     (e.g. no CTS, no spec limits).
 *   - 'recommended' — the methodology can execute but loses depth
 *                     (e.g. no time axis, no per-step CTQ).
 *
 * Ordering: required gaps first; then step-scoped gaps in step order;
 * then remaining recommendations.
 */
export function detectGaps(input: GapDetectorInput = {}): Gap[] {
  const { processMap, outcomeColumn, timeColumn, specs, columns = [], columnKinds = {} } = input;
  const required: Gap[] = [];
  const recommended: Gap[] = [];

  // ── required ──────────────────────────────────────────────────────────
  // No Customer-to-Satisfaction measure anywhere — neither on the map nor declared.
  const ctsFromMap = processMap?.ctsColumn;
  const hasAnyCts = Boolean(ctsFromMap || outcomeColumn);
  if (!hasAnyCts) {
    required.push({
      kind: 'missing-cts',
      severity: 'required',
      message:
        'No customer-felt outcome (CTS). Pick the column that captures what the customer experiences.',
    });
  }

  // No spec limits — capability view is meaningless without LSL or USL.
  const hasSpec = !!specs && (hasFiniteSpec(specs.lsl) || hasFiniteSpec(specs.usl));
  if (!hasSpec) {
    required.push({
      kind: 'missing-spec-limits',
      severity: 'required',
      message:
        'No specification limits. Set at least LSL or USL so Cpk stability can be evaluated.',
    });
  }

  // ── recommended ───────────────────────────────────────────────────────

  // Rational-subgroup axis missing — I-chart can still work, but Cpk stability can't.
  if (processMap) {
    const axes = processMap.subgroupAxes ?? [];
    const tributaryIds = new Set(processMap.tributaries.map(t => t.id));
    const validAxes = axes.filter(id => tributaryIds.has(id));
    if (validAxes.length === 0) {
      recommended.push({
        kind: 'missing-subgroup-axis',
        severity: 'recommended',
        message:
          'No rational-subgroup axis picked. Choose a tributary (e.g. machine / shift / lot) to see how capability drifts across it.',
      });
    }
  }

  // Time/batch axis missing — I-chart is limited without chronological order.
  if (!timeColumn) {
    const hasDateColumn = columns.some(c => columnKinds[c] === 'date');
    if (!hasDateColumn) {
      recommended.push({
        kind: 'missing-time-axis',
        severity: 'recommended',
        message:
          'No time or batch axis. I-chart ordering will fall back to row order — patterns over time may be misread.',
      });
    }
  }

  // Step-scoped gaps — walk the map in order.
  if (processMap) {
    const stepsInOrder = [...processMap.nodes].sort((a, b) => a.order - b.order);
    for (const step of stepsInOrder) {
      if (!step.ctqColumn) {
        recommended.push({
          kind: 'missing-ctq-at-step',
          severity: 'recommended',
          message: `No CTQ at "${step.name}". Add an in-process measure to track what changes through this step.`,
          stepId: step.id,
        });
      }
      const inbound = processMap.tributaries.filter(t => t.stepId === step.id);
      if (inbound.length === 0) {
        recommended.push({
          kind: 'step-without-tributaries',
          severity: 'recommended',
          message: `Step "${step.name}" has no tributaries. Add the factors (xs) that feed this step to use it as a rational-subgroup axis.`,
          stepId: step.id,
        });
      }
    }
  }

  return [...required, ...recommended];
}

/** Convenience re-export. */
export type { Gap, GapDetectorInput, GapKind, GapSeverity } from './types';
