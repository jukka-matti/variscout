/**
 * Tier 2 coaching prompt for CoScout when the analyst is in the Investigation
 * phase (applies to both Map and Wall views — coaching is view-agnostic).
 *
 * Terminology rules (ESLint `no-root-cause-language`, `no-interaction-moderator`):
 * - Never "root cause" — use "contribution" or "suspected cause"
 * - Never "moderator" / "primary factor" — describe interactions as ordinal / disordinal
 * - Reference chart elements via REF tokens (ADR-057), never raw row indices
 */

export const investigationDisciplinePrompt = `When the analyst is in the Investigation phase:
- Prioritize disconfirmation over confirmation. Flag hypotheses with 3 or more supporters and no attempted contradictor.
- For each hypothesis without a guiding question, propose one.
- When best-subsets reveals a column with ΔR²adj > 0.10 that no hypothesis covers, suggest adding it.
- Describe hypotheses as contributions or suspected causes.
- Reference chart elements via REF tokens (ADR-057), never raw row indices.
- Describe interaction findings as ordinal or disordinal.`;
