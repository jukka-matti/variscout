// apply-phase-sensor.mjs — Apply-phase doc-propagation sensor (Play 2b extension, 2026-06-02).
//
// The SDD Propose→Apply→Archive lifecycle requires that when a design spec is
// marked `status: delivered` (its code shipped), the L1/L2/L3 docs it lists in
// `implements:` were updated as part of delivery. The systemic failure mode this
// catches: a spec ships as delivered while its target docs are never touched
// (see docs/superpowers/specs/2026-06-02-documentation-alignment-design.md §1).
//
// Pure + injectable (the resolver is passed in) so it is unit-testable without
// touching the filesystem. Signal: a delivered design spec whose `implements:`
// target carries no `last-verified` ≥ the spec's date is treated as un-applied.
// This is a WARN, not a HARD-FAIL — it is a forward guard ("don't mark a spec
// delivered until its docs are applied"), and a heuristic (a target edited for
// unrelated reasons can clear it; a target legitimately applied in the same
// commit carries an equal/newer last-verified and is not flagged).

function asArray(v) {
  return Array.isArray(v) ? v : v == null ? [] : [v];
}

/**
 * @param {string} rel - spec path relative to repo root (e.g. docs/superpowers/specs/x-design.md)
 * @param {object|null} fm - parsed frontmatter of the spec
 * @param {(targetRel: string) => (object|null)} readTargetFm - returns a target's parsed
 *   frontmatter, or null if the target is missing/unreadable (handled by the broken-implements check)
 * @returns {string[]} warning messages (empty if none)
 */
export function checkApplyPhase(rel, fm, readTargetFm) {
  const out = [];
  const isDesignSpec = rel.startsWith('docs/superpowers/specs/') && !rel.endsWith('/index.md');
  if (!isDesignSpec) return out;
  if (fm == null || fm.status !== 'delivered') return out;

  const specDate = String(fm.date ?? fm['last-verified'] ?? '');
  for (const target of asArray(fm.implements).filter(Boolean)) {
    const tRel = String(target);
    const tfm = readTargetFm(tRel);
    if (tfm == null) continue; // missing/unreadable target → broken-implements check owns it
    const tv = String(tfm['last-verified'] ?? '');
    const unapplied = !tv || (specDate && tv < specDate);
    if (unapplied) {
      out.push(
        `${rel}: delivered spec's implements target '${tRel}' shows no Apply-phase update ` +
          `(last-verified ${tv || 'missing'} vs spec date ${specDate || 'unknown'}). ` +
          `Doc propagation may not have run. See docs/agent-context/doc-discipline.md.`,
      );
    }
  }
  return out;
}
