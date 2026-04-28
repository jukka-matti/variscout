import { describe, it, expect } from 'vitest';
import { lookupSpecRule, ruleMatches, ruleSpecificity } from '../specRuleLookup';
import type { SpecRule, SpecLookupContext } from '../../types';

describe('ruleMatches', () => {
  it('matches when every `when` entry matches the context', () => {
    const rule: SpecRule = { when: { product: 'A' }, specs: { usl: 1, lsl: 0 } };
    expect(ruleMatches(rule, { product: 'A' })).toBe(true);
    expect(ruleMatches(rule, { product: 'B' })).toBe(false);
  });

  it('matches when `when` is absent (default rule)', () => {
    const rule: SpecRule = { specs: { usl: 1, lsl: 0 } };
    expect(ruleMatches(rule, { product: 'A' })).toBe(true);
    expect(ruleMatches(rule, {})).toBe(true);
  });

  it('null in `when` matches null/undefined/empty in context', () => {
    const rule: SpecRule = { when: { supplier: null }, specs: { usl: 1, lsl: 0 } };
    expect(ruleMatches(rule, { supplier: null })).toBe(true);
    expect(ruleMatches(rule, { supplier: undefined })).toBe(true);
    expect(ruleMatches(rule, {})).toBe(true);
    expect(ruleMatches(rule, { supplier: 'TightCorp' })).toBe(false);
  });

  it('treats unspecified keys in `when` as wildcards', () => {
    const rule: SpecRule = { when: { product: 'A' }, specs: { usl: 1, lsl: 0 } };
    expect(ruleMatches(rule, { product: 'A', supplier: 'X' })).toBe(true);
  });
});

describe('ruleSpecificity', () => {
  it('counts the number of specific (non-null, non-absent) constraints in `when`', () => {
    expect(ruleSpecificity({ specs: { usl: 1 } })).toBe(0);
    expect(ruleSpecificity({ when: {}, specs: { usl: 1 } })).toBe(0);
    expect(ruleSpecificity({ when: { product: 'A' }, specs: { usl: 1 } })).toBe(1);
    expect(ruleSpecificity({ when: { product: 'A', supplier: 'X' }, specs: { usl: 1 } })).toBe(2);
    // null is a specific constraint (matches absent/empty only)
    expect(ruleSpecificity({ when: { supplier: null }, specs: { usl: 1 } })).toBe(1);
  });
});

describe('lookupSpecRule', () => {
  const rules: SpecRule[] = [
    { specs: { usl: 10, lsl: 0 } }, // default
    { when: { product: 'A' }, specs: { usl: 5, lsl: 1 } },
    { when: { product: 'A', supplier: 'TightCorp' }, specs: { usl: 4, lsl: 2 } },
  ];

  it('returns the most-specific matching rule', () => {
    const ctx: SpecLookupContext = { product: 'A', supplier: 'TightCorp' };
    expect(lookupSpecRule(rules, ctx)?.specs).toEqual({ usl: 4, lsl: 2 });
  });

  it('falls back to less-specific rule when more-specific does not match', () => {
    const ctx: SpecLookupContext = { product: 'A', supplier: 'WideCorp' };
    expect(lookupSpecRule(rules, ctx)?.specs).toEqual({ usl: 5, lsl: 1 });
  });

  it('falls back to default rule when no specific rule matches', () => {
    const ctx: SpecLookupContext = { product: 'B' };
    expect(lookupSpecRule(rules, ctx)?.specs).toEqual({ usl: 10, lsl: 0 });
  });

  it('returns undefined when no rule matches and no default exists', () => {
    const noDefault: SpecRule[] = [{ when: { product: 'A' }, specs: { usl: 5 } }];
    expect(lookupSpecRule(noDefault, { product: 'B' })).toBeUndefined();
  });

  it('returns undefined for empty rule list', () => {
    expect(lookupSpecRule([], { product: 'A' })).toBeUndefined();
  });
});
