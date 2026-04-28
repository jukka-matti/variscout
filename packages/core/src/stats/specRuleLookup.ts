import type { SpecRule, SpecLookupContext } from '../types';

/**
 * True when this rule's `when` constraints all match the given context.
 *
 * Semantics:
 * - Missing/empty `when` → matches anything (default rule).
 * - For each key in `when`: if value is `null`, matches when context lacks
 *   the key OR has `null` / `undefined` / empty string. If value is a string,
 *   matches when context has the same string.
 * - Keys absent from `when` are wildcards.
 */
export function ruleMatches(rule: SpecRule, context: SpecLookupContext): boolean {
  if (!rule.when) return true;
  const keys = Object.keys(rule.when);
  if (keys.length === 0) return true;
  for (const key of keys) {
    const constraint = rule.when[key];
    const value = context[key];
    if (constraint === null) {
      // "absent or empty" matcher
      if (value === null || value === undefined || value === '') continue;
      return false;
    }
    // string equality
    if (value !== constraint) return false;
  }
  return true;
}

/**
 * Number of specific constraints in this rule's `when`. Used as the tie-break
 * for most-specific-match. Both string and `null` values count; only absent
 * keys are wildcards.
 */
export function ruleSpecificity(rule: SpecRule): number {
  if (!rule.when) return 0;
  return Object.keys(rule.when).length;
}

/**
 * Find the most-specific matching `SpecRule` for a given context. Returns
 * `undefined` if no rule matches.
 *
 * - Iterates all rules, keeps those that match.
 * - Returns the matching rule with the highest specificity. Ties resolve to
 *   the first one in input order (caller-controlled determinism).
 */
export function lookupSpecRule(
  rules: readonly SpecRule[],
  context: SpecLookupContext
): SpecRule | undefined {
  let best: SpecRule | undefined;
  let bestSpecificity = -1;
  for (const rule of rules) {
    if (!ruleMatches(rule, context)) continue;
    const s = ruleSpecificity(rule);
    if (s > bestSpecificity) {
      best = rule;
      bestSpecificity = s;
    }
  }
  return best;
}
