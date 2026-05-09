/**
 * Helpers for reasoning about evidence on a Hypothesis.
 *
 * Used by Survey rules (spec §5 categories 1+3) to triangulate evidence types
 * across linked findings and to detect unresolved falsification attempts.
 */
import type { Finding, FindingEvidenceType, Hypothesis } from './types';

/**
 * Return the distinct evidence types contributed by the findings linked to
 * `h.findingIds`. Findings whose ids do not appear in `findings` are silently
 * skipped — callers are expected to pass the active investigation's findings.
 */
export function evidenceTypesForHypothesis(
  h: Hypothesis,
  findings: Finding[]
): Set<FindingEvidenceType> {
  const linkedFindings = findings.filter(f => h.findingIds.includes(f.id));
  return new Set(linkedFindings.map(f => f.evidenceType));
}

/**
 * `true` when at least one disconfirmation attempt exists with a `pending` verdict
 * (falsification test opened but not yet resolved). Covers the "attempt in progress"
 * half of the `needs-disconfirmation` trigger; the "no attempts at all" half is checked
 * by `deriveHypothesisStatus` in `survey/wall.ts` (Task 8).
 */
export function hasUnresolvedDisconfirmation(h: Hypothesis): boolean {
  return (h.disconfirmationAttempts ?? []).some(a => a.verdict === 'pending');
}
