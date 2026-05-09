/**
 * Survey rules for the Investigation Wall surface.
 *
 * Implements spec §5 Survey rule categories 1 (status-derivation), 2
 * (data-collection prompts), and 3 (triangulation-readiness / "1 step away"
 * hints).
 */
import type { Hypothesis, HypothesisStatus, Finding, FindingEvidenceType } from '../findings/types';
import { evidenceTypesForHypothesis } from '../findings';
import type { SurveyHint, SurveyRule } from './types';

/**
 * Pure status-derivation per spec §5 rule category 1.
 *
 * Priority order:
 * 1. `refuted` — any linked finding with `refutes: true` wins immediately.
 * 2. `proposed` — no linked findings at all.
 * 3. `evidenced` — fewer than 2 distinct evidence types.
 * 4. `needs-disconfirmation` — ≥2 distinct evidence types but no survived
 *    disconfirmation attempt yet.
 * 5. `confirmed` — ≥2 distinct evidence types AND ≥1 survived disconfirmation
 *    attempt.
 */
export function deriveHypothesisStatus(h: Hypothesis, findings: Finding[]): HypothesisStatus {
  const linkedFindings = findings.filter(f => h.findingIds.includes(f.id));

  // 1. Refuted: any refuting finding short-circuits the decision tree
  if (linkedFindings.some(f => f.refutes)) return 'refuted';

  // 2. Proposed: no linked findings
  if (h.findingIds.length === 0) return 'proposed';

  // 3. Count distinct evidence types (FindingEvidenceType is already constrained
  // to 'data' | 'gemba' | 'expert' — no further filter needed).
  const distinctTypes = evidenceTypesForHypothesis(h, findings);

  if (distinctTypes.size < 2) return 'evidenced';

  // 4 & 5. ≥2 evidence types — check disconfirmation
  const hasResolvedDisconfirmation = (h.disconfirmationAttempts ?? []).some(
    a => a.verdict === 'survived'
  );

  return hasResolvedDisconfirmation ? 'confirmed' : 'needs-disconfirmation';
}

/**
 * Survey rule for the Wall surface.
 *
 * Derives the auto-status for every hypothesis in context and emits a
 * "1 step away" hint (category 3 — triangulation-readiness) for each
 * hypothesis whose derived status is `needs-disconfirmation`.
 *
 * One hint per hypothesis — no over-emission.
 */
export const surveyWallRules: SurveyRule = ctx => {
  const hints: SurveyHint[] = [];
  const hypotheses = ctx.hypotheses ?? [];
  const findings = ctx.findings ?? [];

  for (const h of hypotheses) {
    const derivedStatus = deriveHypothesisStatus(h, findings);

    if (derivedStatus === 'evidenced') {
      // Category 2 (data-collection): hypothesis has exactly 1 evidence type;
      // surface the missing types so analyst can triangulate.
      const types = evidenceTypesForHypothesis(h, findings);
      const present = [...types][0]; // status='evidenced' guarantees types.size === 1
      const allTypes: FindingEvidenceType[] = ['data', 'gemba', 'expert'];
      const missing = allTypes.filter(t => !types.has(t));
      hints.push({
        kind: 'data-collection',
        surface: 'wall',
        targetEntityId: h.id,
        message: `${h.name} has ${present} only — needs ${missing.join(' or ')} to triangulate`,
        severity: 'info',
        action: { label: `Try ${missing[0]} evidence` },
      });
    }

    if (derivedStatus === 'needs-disconfirmation') {
      hints.push({
        kind: 'triangulation-readiness',
        surface: 'wall',
        targetEntityId: h.id,
        message:
          '1 step away — running a disconfirmation test would promote this from evidenced to confirmed',
        severity: 'info',
        action: { label: 'Try disconfirmation' },
      });
    }
  }

  return hints;
};
