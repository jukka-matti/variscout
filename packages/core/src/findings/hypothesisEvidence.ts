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
 * `true` when at least one disconfirmation attempt is recorded with a
 * `pending` verdict — i.e. a falsification test has been opened but not yet
 * resolved. Survey rules surface this as a "1 step away" hint on the Wall.
 */
export function hasUnresolvedDisconfirmation(h: Hypothesis): boolean {
  return (h.disconfirmationAttempts ?? []).some(a => a.verdict === 'pending');
}
