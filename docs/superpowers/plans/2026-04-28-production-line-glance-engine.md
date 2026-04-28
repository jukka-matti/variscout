# Production-Line-Glance — Engine Layer (Plan A)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the engine layer for the production-line-glance dashboard — types, spec-rule lookup, `calculateNodeCapability()` for both single-investigation and hub-aggregated sources, and sample-confidence integration. No charts, no UI surfaces yet.

**Architecture:** Extends existing canonical types (`ProcessMapNode`, `ProcessMapTributary`, `ProcessHub`, investigation metadata) with bounded fields. Single new function `calculateNodeCapability()` is the only capability-aggregation API. Cross-investigation Cp/Cpk arithmetic is preserved by structural absence — no `meanCapability()` or `aggregateCpk()` is added. Reuses existing `SpecLimits`, `SubgroupCapabilityResult`, and the `safeMath` primitives.

**Tech Stack:** TypeScript, `@variscout/core`, Vitest, deterministic counter-based PRNG (no `Math.random`). Skill: `editing-statistics`.

**Spec reference:** `docs/superpowers/specs/2026-04-28-production-line-glance-design.md`

**Critical existing files:**

- `packages/core/src/types.ts:121-132` — `SpecLimits`, `CharacteristicType`, `inferCharacteristicType()`
- `packages/core/src/frame/types.ts:27-35` — `ProcessMapNode` (already has `ctqColumn`)
- `packages/core/src/frame/types.ts:38-48` — `ProcessMapTributary`
- `packages/core/src/frame/types.ts:77-99` — `ProcessMap` (`version: 1`)
- `packages/core/src/processHub.ts:51-58` — `ProcessHub`
- `packages/core/src/processHub.ts:66-94` — `ProcessHubInvestigationMetadata`
- `packages/core/src/stats/subgroupCapability.ts:30-46` — `SubgroupCapabilityResult` (per-subgroup Cp/Cpk; we will reuse the calculation primitives, not duplicate)
- `packages/core/src/stats/safeMath.ts` — `finiteOrUndefined`, `safeDivide`
- `.claude/rules/stats.md` — three-boundary safety, no NaN, no `Math.random`

---

## Task 1: Add `SpecRule` and `SpecLookupContext` types

**Files:**

- Modify: `packages/core/src/types.ts` (append after `SpecLimits` block, line ~132)
- Test: `packages/core/src/__tests__/types.specRule.test.ts` (new)

- [ ] **Step 1: Write failing test for type shape**

Create `packages/core/src/__tests__/types.specRule.test.ts`:

```typescript
import { describe, it, expectTypeOf } from 'vitest';
import type { SpecRule, SpecLookupContext, SpecLimits } from '../types';

describe('SpecRule type', () => {
  it('has optional `when` record and required `specs`', () => {
    expectTypeOf<SpecRule>().toMatchTypeOf<{
      when?: Record<string, string | null>;
      specs: SpecLimits;
    }>();
  });

  it('SpecLookupContext is a plain context tuple', () => {
    expectTypeOf<SpecLookupContext>().toMatchTypeOf<Record<string, string | null | undefined>>();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/core test types.specRule -t 'SpecRule type'`
Expected: FAIL — types not yet exported.

- [ ] **Step 3: Add types to `packages/core/src/types.ts`**

Append after line 132 (after `SpecLimits`):

```typescript
/**
 * A single specification-rule entry. Looked up by matching the row's context
 * tuple against `when`. Sparse: missing keys in `when` mean "any value matches".
 * `null` value in `when` means "default / no specific value" (use when the row's
 * column for that dimension is absent or empty).
 */
export interface SpecRule {
  /**
   * Context-column → context-value map. Missing keys are wildcards. `null`
   * matches rows where that column is absent or empty. Most-specific match
   * wins (more keys = more specific).
   */
  when?: Record<string, string | null>;
  /** The specs to apply when this rule matches. */
  specs: SpecLimits;
}

/**
 * The context tuple extracted from a single data row, used to look up the
 * matching `SpecRule`. Keys are context-column names; values are the row's
 * value for that column (or `null` / `undefined` if absent).
 */
export type SpecLookupContext = Record<string, string | null | undefined>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @variscout/core test types.specRule -t 'SpecRule type'`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/types.ts packages/core/src/__tests__/types.specRule.test.ts
git commit -m "feat(core): add SpecRule and SpecLookupContext types

Foundation for per-(node × context-tuple) capability spec lookup
in the production-line-glance dashboard. See spec
docs/superpowers/specs/2026-04-28-production-line-glance-design.md."
```

---

## Task 2: Implement `lookupSpecRule()` with most-specific-match semantics

**Files:**

- Create: `packages/core/src/stats/specRuleLookup.ts`
- Test: `packages/core/src/stats/__tests__/specRuleLookup.test.ts`

- [ ] **Step 1: Write failing test**

Create `packages/core/src/stats/__tests__/specRuleLookup.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/core test specRuleLookup`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `packages/core/src/stats/specRuleLookup.ts`:

```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @variscout/core test specRuleLookup`
Expected: PASS (all 9 cases).

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/stats/specRuleLookup.ts packages/core/src/stats/__tests__/specRuleLookup.test.ts
git commit -m "feat(core): add lookupSpecRule with most-specific-match semantics

Sparse SpecRule lookup over a context tuple, used to resolve specs
for per-(node x context) capability calculation. Pure function;
no math; no randomness."
```

---

## Task 3: Extend `ProcessMapNode` with `capabilityScope`

**Files:**

- Modify: `packages/core/src/frame/types.ts:27-35`
- Test: `packages/core/src/frame/__tests__/types.capabilityScope.test.ts` (new — co-located with frame tests)

- [ ] **Step 1: Write failing test**

Create `packages/core/src/frame/__tests__/types.capabilityScope.test.ts`:

```typescript
import { describe, it, expect, expectTypeOf } from 'vitest';
import type { ProcessMapNode } from '../types';
import type { SpecRule } from '../../types';

describe('ProcessMapNode.capabilityScope', () => {
  it('is optional and contains specRules', () => {
    expectTypeOf<NonNullable<ProcessMapNode['capabilityScope']>>().toMatchTypeOf<{
      specRules: SpecRule[];
    }>();
  });

  it('does not break the existing minimal shape', () => {
    const minimal: ProcessMapNode = { id: 'n1', name: 'Mix', order: 0 };
    expect(minimal.capabilityScope).toBeUndefined();
    expect(minimal.ctqColumn).toBeUndefined();
  });

  it('accepts a node with capabilityScope set', () => {
    const node: ProcessMapNode = {
      id: 'n1',
      name: 'Mix',
      order: 0,
      ctqColumn: 'mix_weight',
      capabilityScope: {
        specRules: [
          { specs: { usl: 10, lsl: 0 } },
          { when: { product: 'A' }, specs: { usl: 5, lsl: 1 } },
        ],
      },
    };
    expect(node.capabilityScope?.specRules).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/core test types.capabilityScope`
Expected: FAIL — `capabilityScope` not on `ProcessMapNode`.

- [ ] **Step 3: Modify `packages/core/src/frame/types.ts`**

Replace lines 27-35 (the existing `ProcessMapNode` interface):

```typescript
/** One process step on the SIPOC spine. Ordered left→right by `order`. */
export interface ProcessMapNode {
  id: string;
  /** Display name of the step (e.g. "Mix", "Fill", "Seal"). */
  name: string;
  /** 0-based left→right order. Monotonic. */
  order: number;
  /** Optional column measured at this step (a CTQ — Critical-to-Quality). */
  ctqColumn?: string;
  /**
   * Per-step capability scope. When set, enables the production-line-glance
   * dashboard to compute Cp/Cpk for this step using `ctqColumn` and looking
   * up specs from `specRules` by the row's context tuple.
   *
   * See spec: docs/superpowers/specs/2026-04-28-production-line-glance-design.md
   */
  capabilityScope?: {
    /** Sparse SpecRule list. Most-specific match wins. */
    specRules: SpecRule[];
  };
}
```

Add an `import type { SpecRule } from '../types';` near the top of the file (under existing imports if any; otherwise add after the file-level docblock).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @variscout/core test types.capabilityScope`
Expected: PASS.

Also re-run the full frame test suite to ensure backward compatibility:

Run: `pnpm --filter @variscout/core test frame`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/frame/types.ts packages/core/src/frame/__tests__/types.capabilityScope.test.ts
git commit -m "feat(core): extend ProcessMapNode with capabilityScope.specRules

Per-step specs as a sparse SpecRule list. ctqColumn (already
existing) carries the measurement; capabilityScope.specRules
indexes the spec lookup by context tuple. Backward compatible —
field is optional."
```

---

## Task 4: Extend `ProcessMapTributary` with `contextColumns`

**Files:**

- Modify: `packages/core/src/frame/types.ts:38-48`
- Test: `packages/core/src/frame/__tests__/types.contextColumns.test.ts` (new)

- [ ] **Step 1: Write failing test**

Create `packages/core/src/frame/__tests__/types.contextColumns.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type { ProcessMapTributary } from '../types';

describe('ProcessMapTributary.contextColumns', () => {
  it('is optional', () => {
    const minimal: ProcessMapTributary = {
      id: 't1',
      stepId: 'n1',
      column: 'steel_grade',
    };
    expect(minimal.contextColumns).toBeUndefined();
  });

  it('accepts a tributary with input-attached context columns', () => {
    const trib: ProcessMapTributary = {
      id: 't1',
      stepId: 'n1',
      column: 'steel_grade',
      role: 'supplier',
      contextColumns: ['steel_supplier', 'steel_lot'],
    };
    expect(trib.contextColumns).toEqual(['steel_supplier', 'steel_lot']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/core test types.contextColumns`
Expected: FAIL — `contextColumns` not on `ProcessMapTributary`.

- [ ] **Step 3: Modify `packages/core/src/frame/types.ts`**

Replace lines 37-48 (the existing `ProcessMapTributary` interface):

```typescript
/** A tributary — an x (factor) branching into a process step. */
export interface ProcessMapTributary {
  id: string;
  /** The step this tributary feeds into. */
  stepId: string;
  /** Source column in the dataset (the "x"). */
  column: string;
  /** Friendly label (defaults to column name if omitted). */
  label?: string;
  /** Role classification (informational; used for UX affordances, not math). */
  role?: TributaryRole;
  /**
   * Input-attached context dimensions. Columns in the dataset that describe
   * properties of THIS tributary's input (e.g., `['steel_supplier']` on a
   * Steel tributary, `['paint_class']` on a Paint tributary). Engine treats
   * these uniformly with hub-level context columns at SpecRule lookup time;
   * declaration here is UX metadata so filter chips group sensibly.
   *
   * See spec: docs/superpowers/specs/2026-04-28-production-line-glance-design.md
   */
  contextColumns?: string[];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @variscout/core test types.contextColumns`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/frame/types.ts packages/core/src/frame/__tests__/types.contextColumns.test.ts
git commit -m "feat(core): add contextColumns to ProcessMapTributary

Input-attached context dimensions for the production-line-glance
dashboard. Engine-agnostic; declaration location is UX metadata
for filter chip grouping."
```

---

## Task 5: Extend `ProcessHub` with canonical map and context columns

**Files:**

- Modify: `packages/core/src/processHub.ts:51-58`
- Test: `packages/core/src/__tests__/processHub.canonical.test.ts` (new)

- [ ] **Step 1: Write failing test**

Create `packages/core/src/__tests__/processHub.canonical.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type { ProcessHub } from '../processHub';
import type { ProcessMap } from '../frame/types';

describe('ProcessHub canonical map fields', () => {
  it('keeps the existing minimal shape', () => {
    const minimal: ProcessHub = {
      id: 'hub-1',
      name: 'Bottling Line A',
      createdAt: '2026-04-28T10:00:00.000Z',
    };
    expect(minimal.canonicalProcessMap).toBeUndefined();
    expect(minimal.canonicalMapVersion).toBeUndefined();
    expect(minimal.contextColumns).toBeUndefined();
  });

  it('accepts a hub with canonical map + version + context columns', () => {
    const map: ProcessMap = {
      version: 1,
      nodes: [{ id: 'n1', name: 'Fill', order: 0 }],
      tributaries: [],
      createdAt: '2026-04-28T10:00:00.000Z',
      updatedAt: '2026-04-28T10:00:00.000Z',
    };
    const hub: ProcessHub = {
      id: 'hub-1',
      name: 'Bottling Line A',
      createdAt: '2026-04-28T10:00:00.000Z',
      canonicalProcessMap: map,
      canonicalMapVersion: '2026-04-28T10:00:00Z',
      contextColumns: ['product', 'shift'],
    };
    expect(hub.canonicalProcessMap?.nodes).toHaveLength(1);
    expect(hub.canonicalMapVersion).toBe('2026-04-28T10:00:00Z');
    expect(hub.contextColumns).toEqual(['product', 'shift']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/core test processHub.canonical`
Expected: FAIL — fields not on `ProcessHub`.

- [ ] **Step 3: Modify `packages/core/src/processHub.ts`**

Replace lines 51-58 (the existing `ProcessHub` interface):

```typescript
export interface ProcessHub {
  id: string;
  name: string;
  description?: string;
  processOwner?: ProcessParticipantRef;
  createdAt: string;
  updatedAt?: string;
  /**
   * Hub-level canonical Process Map. Investigations within this hub inherit
   * structure (nodes, tributaries, capability scopes) by version-pinning to
   * `canonicalMapVersion`. Absent for hubs that haven't promoted a canonical
   * map yet.
   *
   * See spec: docs/superpowers/specs/2026-04-28-production-line-glance-design.md
   */
  canonicalProcessMap?: ProcessMap;
  /**
   * Version identifier for `canonicalProcessMap`. ISO 8601 timestamp by
   * default; semver allowed if the team adopts it. Investigations pin this
   * value at creation; pulling latest re-pins.
   */
  canonicalMapVersion?: string;
  /**
   * Hub-level context dimensions (e.g., `['product', 'shift']`). Combined
   * with tributary-attached `contextColumns` at lookup time; engine treats
   * both uniformly. Declaration location is UX metadata.
   */
  contextColumns?: string[];
}
```

Add `import type { ProcessMap } from './frame/types';` near the existing top-of-file imports.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @variscout/core test processHub.canonical`
Expected: PASS.

Re-run full processHub tests for backward compat:

Run: `pnpm --filter @variscout/core test processHub`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/processHub.ts packages/core/src/__tests__/processHub.canonical.test.ts
git commit -m "feat(core): add canonicalProcessMap, canonicalMapVersion, contextColumns to ProcessHub

Hub-level canonical map for the production-line-glance dashboard.
Investigations version-pin to inherit structure. Backward
compatible — all new fields optional."
```

---

## Task 6: Add `InvestigationNodeMapping` type and extend metadata

**Files:**

- Modify: `packages/core/src/processHub.ts:66-94` (extend `ProcessHubInvestigationMetadata`)
- Test: `packages/core/src/__tests__/processHub.nodeMappings.test.ts` (new)

- [ ] **Step 1: Write failing test**

Create `packages/core/src/__tests__/processHub.nodeMappings.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type { ProcessHubInvestigationMetadata, InvestigationNodeMapping } from '../processHub';

describe('InvestigationNodeMapping', () => {
  it('is a per-node mapping with optional spec override', () => {
    const m: InvestigationNodeMapping = {
      nodeId: 'n1',
      measurementColumn: 'mix_weight',
    };
    expect(m.specsOverride).toBeUndefined();
  });

  it('accepts a flagged spec override', () => {
    const m: InvestigationNodeMapping = {
      nodeId: 'n1',
      measurementColumn: 'mix_weight',
      specsOverride: { usl: 10, lsl: 0 },
    };
    expect(m.specsOverride).toEqual({ usl: 10, lsl: 0 });
  });
});

describe('ProcessHubInvestigationMetadata.nodeMappings', () => {
  it('is optional', () => {
    const minimal: ProcessHubInvestigationMetadata = {};
    expect(minimal.nodeMappings).toBeUndefined();
    expect(minimal.canonicalMapVersion).toBeUndefined();
  });

  it('accepts node mappings and version pin', () => {
    const meta: ProcessHubInvestigationMetadata = {
      processHubId: 'hub-1',
      canonicalMapVersion: '2026-04-28T10:00:00Z',
      nodeMappings: [
        { nodeId: 'n1', measurementColumn: 'mix_weight' },
        { nodeId: 'n2', measurementColumn: 'press_hardness' },
      ],
    };
    expect(meta.nodeMappings).toHaveLength(2);
    expect(meta.canonicalMapVersion).toBe('2026-04-28T10:00:00Z');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/core test processHub.nodeMappings`
Expected: FAIL — types not exported.

- [ ] **Step 3: Modify `packages/core/src/processHub.ts`**

Add (above the existing `ProcessHubInvestigationMetadata` interface near line 66):

```typescript
/**
 * Maps one canonical-map node onto a column in this investigation's data.
 * `nodeMappings.length === 1` is the B2 shape (investigation IS one step's
 * deep-dive). Length > 1 is the B1 shape (investigation covers multiple
 * steps). Absent/empty is the B0 shape (legacy investigation, falls back to
 * global investigation-level specs).
 *
 * `specsOverride`, when set, is a flagged local fork — UI shows divergence
 * from canonical for the analyst.
 *
 * See spec: docs/superpowers/specs/2026-04-28-production-line-glance-design.md
 */
export interface InvestigationNodeMapping {
  /** ID of the canonical-map node this mapping addresses. */
  nodeId: string;
  /** Column in this investigation's data carrying the per-step measurement. */
  measurementColumn: string;
  /** Optional flagged local spec override (forks from canonical). */
  specsOverride?: SpecLimits;
}
```

Then within the existing `ProcessHubInvestigationMetadata` interface (around line 66-94), append two fields before the closing brace:

```typescript
  /**
   * Pinned version of the hub's canonicalProcessMap at investigation
   * creation. Used by `pull-latest` to detect drift. Absent for legacy
   * investigations or hubs without canonical maps.
   */
  canonicalMapVersion?: string;
  /**
   * Per-node measurement-column mappings. Drives per-(node × context-tuple)
   * capability computation. See `InvestigationNodeMapping` above.
   */
  nodeMappings?: InvestigationNodeMapping[];
```

Add `import type { SpecLimits } from './types';` to the top of the file.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @variscout/core test processHub.nodeMappings`
Expected: PASS.

Re-run all `processHub` tests:

Run: `pnpm --filter @variscout/core test processHub`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/processHub.ts packages/core/src/__tests__/processHub.nodeMappings.test.ts
git commit -m "feat(core): add InvestigationNodeMapping + canonicalMapVersion + nodeMappings

Unifies B0/B1/B2 cardinalities (legacy, multi-node, single-node)
under one nodeMappings list. specsOverride enables flagged local
forks. All fields optional; backward compatible."
```

---

## Task 7: Add `SampleConfidence` type and threshold function

**Files:**

- Create: `packages/core/src/stats/sampleConfidence.ts`
- Test: `packages/core/src/stats/__tests__/sampleConfidence.test.ts`

- [ ] **Step 1: Write failing test**

Create `packages/core/src/stats/__tests__/sampleConfidence.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { sampleConfidenceFor, SAMPLE_CONFIDENCE_THRESHOLDS } from '../sampleConfidence';

describe('sampleConfidenceFor', () => {
  it('returns "insufficient" for n < 10', () => {
    expect(sampleConfidenceFor(0)).toBe('insufficient');
    expect(sampleConfidenceFor(1)).toBe('insufficient');
    expect(sampleConfidenceFor(9)).toBe('insufficient');
  });

  it('returns "review" for 10 <= n < 30', () => {
    expect(sampleConfidenceFor(10)).toBe('review');
    expect(sampleConfidenceFor(20)).toBe('review');
    expect(sampleConfidenceFor(29)).toBe('review');
  });

  it('returns "trust" for n >= 30', () => {
    expect(sampleConfidenceFor(30)).toBe('trust');
    expect(sampleConfidenceFor(100)).toBe('trust');
    expect(sampleConfidenceFor(10_000)).toBe('trust');
  });

  it('handles fractional n by flooring (defensive — should not occur in practice)', () => {
    expect(sampleConfidenceFor(29.9)).toBe('review');
    expect(sampleConfidenceFor(30.0)).toBe('trust');
  });

  it('exports thresholds for UI badge use', () => {
    expect(SAMPLE_CONFIDENCE_THRESHOLDS.insufficient).toBe(10);
    expect(SAMPLE_CONFIDENCE_THRESHOLDS.review).toBe(30);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/core test sampleConfidence`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `packages/core/src/stats/sampleConfidence.ts`:

```typescript
/**
 * Sample-size confidence band for a capability statistic.
 *
 * Watson's transcript: at n=25 ~10% extra uncertainty, n=20 ~40%, n=15 ~30%.
 * VariScout's deterministic engine refuses to publish Cpk for `insufficient`
 * (n<10), badges `review` (10≤n<30), and trusts `trust` (n≥30).
 *
 * See:
 *   docs/superpowers/specs/2026-04-28-production-line-glance-design.md
 *   ~/.claude/plans/i-would-need-to-drifting-hummingbird.md (objection A4)
 */

export type SampleConfidence = 'trust' | 'review' | 'insufficient';

/** Thresholds used for `sampleConfidenceFor`. Exported for UI badges. */
export const SAMPLE_CONFIDENCE_THRESHOLDS = {
  /** n < this is `insufficient`. */
  insufficient: 10,
  /** n >= this is `trust`; otherwise `review`. */
  review: 30,
} as const;

/**
 * Map a sample size to a confidence band. Pure function. Defensive against
 * fractional n via `Math.floor`. n must be non-negative; negative values
 * return `insufficient`.
 */
export function sampleConfidenceFor(n: number): SampleConfidence {
  const floored = Math.floor(n);
  if (floored < SAMPLE_CONFIDENCE_THRESHOLDS.insufficient) return 'insufficient';
  if (floored < SAMPLE_CONFIDENCE_THRESHOLDS.review) return 'review';
  return 'trust';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @variscout/core test sampleConfidence`
Expected: PASS (5 cases).

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/stats/sampleConfidence.ts packages/core/src/stats/__tests__/sampleConfidence.test.ts
git commit -m "feat(core): add sampleConfidenceFor for n<30 capability guard

Watson's sample-size guard as a pure function. Three bands:
insufficient (n<10), review (10≤n<30), trust (n≥30). Exported
thresholds for UI badge components."
```

---

## Task 8: Implement `calculateNodeCapability()` for `column` source

**Files:**

- Create: `packages/core/src/stats/nodeCapability.ts`
- Test: `packages/core/src/stats/__tests__/nodeCapability.column.test.ts`

This task implements the column-source path: one investigation, multiple nodes mapped via `nodeMappings`, capability computed per (node × context-tuple).

- [ ] **Step 1: Write failing test**

Create `packages/core/src/stats/__tests__/nodeCapability.column.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { calculateNodeCapability } from '../nodeCapability';
import type { DataRow } from '../../types';
import type { ProcessMap } from '../../frame/types';
import type { ProcessHubInvestigationMetadata, InvestigationNodeMapping } from '../../processHub';

// Deterministic counter-based noise — never Math.random per .claude/rules/stats.md
function deterministicNoise(i: number, scale: number): number {
  // Mulberry32-style hash on the integer index
  let h = (i + 0x9e3779b9) >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return ((h >>> 0) / 0xffffffff - 0.5) * 2 * scale;
}

const processMap: ProcessMap = {
  version: 1,
  nodes: [
    {
      id: 'n-fill',
      name: 'Fill',
      order: 0,
      capabilityScope: {
        specRules: [
          { specs: { usl: 360, lsl: 348, target: 354 } }, // default
          { when: { product: 'Coke 16oz' }, specs: { usl: 478, lsl: 468, target: 473 } },
        ],
      },
    },
  ],
  tributaries: [],
  createdAt: '2026-04-28T10:00:00.000Z',
  updatedAt: '2026-04-28T10:00:00.000Z',
};

const nodeMappings: InvestigationNodeMapping[] = [
  { nodeId: 'n-fill', measurementColumn: 'fill_volume' },
];

const investigationMeta: ProcessHubInvestigationMetadata = {
  processHubId: 'hub-1',
  canonicalMapVersion: '2026-04-28T10:00:00Z',
  nodeMappings,
};

function rowsForProduct(product: string, target: number, count: number, scale = 1): DataRow[] {
  const out: DataRow[] = [];
  for (let i = 0; i < count; i++) {
    out.push({ fill_volume: target + deterministicNoise(i, scale), product });
  }
  return out;
}

describe('calculateNodeCapability — column source', () => {
  it('computes cpk for the default rule when context does not match a specific rule', () => {
    const data = rowsForProduct('Coke 12oz', 354, 50, 1.5);
    const result = calculateNodeCapability('n-fill', {
      kind: 'column',
      processMap,
      investigationMeta,
      data,
    });
    expect(result.nodeId).toBe('n-fill');
    expect(result.source).toBe('column');
    expect(result.n).toBe(50);
    expect(result.sampleConfidence).toBe('trust');
    expect(result.cpk).toBeGreaterThan(0);
    // Per-context: one entry for ('Coke 12oz' → default rule).
    expect(result.perContextResults).toHaveLength(1);
    expect(result.perContextResults?.[0]?.contextTuple).toEqual({ product: 'Coke 12oz' });
  });

  it('computes cpk per product when both rules apply', () => {
    const data = [
      ...rowsForProduct('Coke 12oz', 354, 40, 1.0),
      ...rowsForProduct('Coke 16oz', 473, 40, 1.0),
    ];
    const result = calculateNodeCapability('n-fill', {
      kind: 'column',
      processMap,
      investigationMeta,
      data,
    });
    expect(result.perContextResults).toHaveLength(2);
    const products = result.perContextResults?.map(r => r.contextTuple.product).sort();
    expect(products).toEqual(['Coke 12oz', 'Coke 16oz']);
    // Both should have non-undefined cpk and 'trust' confidence.
    for (const r of result.perContextResults ?? []) {
      expect(r.cpk).toBeGreaterThan(0);
      expect(r.sampleConfidence).toBe('trust');
    }
  });

  it('badges insufficient when n<10', () => {
    const data = rowsForProduct('Coke 12oz', 354, 5);
    const result = calculateNodeCapability('n-fill', {
      kind: 'column',
      processMap,
      investigationMeta,
      data,
    });
    expect(result.n).toBe(5);
    expect(result.sampleConfidence).toBe('insufficient');
    expect(result.perContextResults?.[0]?.sampleConfidence).toBe('insufficient');
  });

  it('returns cpk undefined and n=0 when node has no measurementColumn mapping', () => {
    const result = calculateNodeCapability('n-fill', {
      kind: 'column',
      processMap,
      investigationMeta: {}, // no nodeMappings
      data: [{ fill_volume: 354, product: 'Coke 12oz' }],
    });
    expect(result.cpk).toBeUndefined();
    expect(result.n).toBe(0);
    expect(result.sampleConfidence).toBe('insufficient');
  });

  it('returns cpk undefined when node has no capabilityScope', () => {
    const mapWithoutScope: ProcessMap = {
      ...processMap,
      nodes: [{ id: 'n-fill', name: 'Fill', order: 0 }],
    };
    const result = calculateNodeCapability('n-fill', {
      kind: 'column',
      processMap: mapWithoutScope,
      investigationMeta,
      data: [{ fill_volume: 354, product: 'Coke 12oz' }],
    });
    expect(result.cpk).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/core test nodeCapability.column`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `packages/core/src/stats/nodeCapability.ts`:

```typescript
import type { DataRow, SpecLimits, SpecLookupContext } from '../types';
import { toNumericValue } from '../types';
import type { ProcessMap, ProcessMapNode } from '../frame/types';
import type {
  ProcessHubInvestigationMetadata,
  ProcessHub,
  ProcessHubInvestigation,
} from '../processHub';
import { lookupSpecRule } from './specRuleLookup';
import { sampleConfidenceFor, type SampleConfidence } from './sampleConfidence';
import { finiteOrUndefined, safeDivide } from './safeMath';

/**
 * Per-(canonical-node × context-tuple) capability result. Returned by
 * `calculateNodeCapability`. The ONLY capability function exposed at the
 * canonical-node level — there is intentionally no aggregator across
 * heterogeneous local processes (Watson G10/D3, structural absence).
 *
 * See spec: docs/superpowers/specs/2026-04-28-production-line-glance-design.md
 */
export interface NodeCapabilityResult {
  nodeId: string;
  /** Aggregate Cpk for this node — undefined when no rule matches or n=0. */
  cpk?: number;
  /** Aggregate Cp for this node — undefined when no rule matches or n=0. */
  cp?: number;
  /** Total measurement count across all contexts. */
  n: number;
  /** Confidence band derived from total `n`. */
  sampleConfidence: SampleConfidence;
  /** Source kind that produced this result. */
  source: 'column' | 'children' | 'mixed';
  /** Investigation IDs that contributed (only for `children` source). */
  contributingInvestigations?: string[];
  /** Per-context results — one row per distinct context tuple. */
  perContextResults?: Array<{
    contextTuple: SpecLookupContext;
    cpk?: number;
    cp?: number;
    n: number;
    sampleConfidence: SampleConfidence;
  }>;
}

export type CalculateNodeCapabilitySource =
  | {
      kind: 'column';
      processMap: ProcessMap;
      investigationMeta: ProcessHubInvestigationMetadata;
      data: readonly DataRow[];
    }
  | {
      kind: 'children';
      hub: ProcessHub;
      members: readonly ProcessHubInvestigation[];
    };

const EMPTY_INSUFFICIENT: NodeCapabilityResult = {
  nodeId: '',
  cpk: undefined,
  cp: undefined,
  n: 0,
  sampleConfidence: 'insufficient',
  source: 'column',
  perContextResults: [],
};

/**
 * Compute capability for a single canonical-map node. Two modes:
 *
 * - `kind: 'column'` — read measurements from one investigation's data,
 *   resolved via `investigationMeta.nodeMappings`. Per-context-tuple Cp/Cpk
 *   computed by looking up `SpecRule` from `node.capabilityScope.specRules`.
 *
 * - `kind: 'children'` — aggregate per-investigation `reviewSignal` values
 *   from `members` whose `processHubId === hub.id` and which are tagged for
 *   this node via their `nodeMappings`. (Implemented in Task 9.)
 */
export function calculateNodeCapability(
  nodeId: string,
  source: CalculateNodeCapabilitySource
): NodeCapabilityResult {
  if (source.kind === 'column') {
    return calculateFromColumn(nodeId, source);
  }
  // 'children' implementation lands in Task 9
  return { ...EMPTY_INSUFFICIENT, nodeId, source: 'children' };
}

// ============================================================================
// Column-source implementation
// ============================================================================

function findNode(processMap: ProcessMap, nodeId: string): ProcessMapNode | undefined {
  return processMap.nodes.find(n => n.id === nodeId);
}

function getMeasurementColumn(
  node: ProcessMapNode,
  meta: ProcessHubInvestigationMetadata
): string | undefined {
  const mapping = meta.nodeMappings?.find(m => m.nodeId === node.id);
  if (mapping?.measurementColumn) return mapping.measurementColumn;
  return node.ctqColumn;
}

function getEffectiveSpecRules(
  node: ProcessMapNode,
  meta: ProcessHubInvestigationMetadata
): readonly { when?: Record<string, string | null>; specs: SpecLimits }[] {
  const mapping = meta.nodeMappings?.find(m => m.nodeId === node.id);
  if (mapping?.specsOverride) {
    // Override replaces the rule list with a single default rule (flagged fork)
    return [{ specs: mapping.specsOverride }];
  }
  return node.capabilityScope?.specRules ?? [];
}

function gatherContextColumns(processMap: ProcessMap, hubColumns?: string[]): string[] {
  const set = new Set<string>(hubColumns ?? []);
  for (const trib of processMap.tributaries) {
    for (const c of trib.contextColumns ?? []) set.add(c);
  }
  return Array.from(set);
}

function rowContext(row: DataRow, contextColumns: readonly string[]): SpecLookupContext {
  const ctx: SpecLookupContext = {};
  for (const col of contextColumns) {
    const value = row[col];
    if (value === null || value === undefined || value === '') {
      ctx[col] = null;
    } else {
      ctx[col] = String(value);
    }
  }
  return ctx;
}

function contextKey(ctx: SpecLookupContext): string {
  // Stable key for grouping — sort entries to make order-independent.
  const entries = Object.entries(ctx)
    .map(([k, v]) => [k, v ?? ''] as const)
    .sort((a, b) => a[0].localeCompare(b[0]));
  return JSON.stringify(entries);
}

function computeCpCpk(values: readonly number[], specs: SpecLimits): { cp?: number; cpk?: number } {
  if (values.length === 0) return {};
  // Mean
  let sum = 0;
  for (const v of values) sum += v;
  const mean = sum / values.length;
  // Within-subgroup sigma via simple sample stdev — for V1 column-source we
  // treat the whole sample as one group. Subgroup-level computation already
  // exists (subgroupCapability.ts); per-step Cpk uses overall stdev.
  let ssq = 0;
  for (const v of values) {
    const d = v - mean;
    ssq += d * d;
  }
  const sigma = values.length > 1 ? Math.sqrt(ssq / (values.length - 1)) : 0;
  if (sigma === 0) return {};

  const { usl, lsl } = specs;
  // Cp requires both
  let cp: number | undefined;
  if (usl !== undefined && lsl !== undefined) {
    cp = finiteOrUndefined(safeDivide(usl - lsl, 6 * sigma));
  }
  // Cpk = min(Cpu, Cpl) when both present; else single-sided
  let cpk: number | undefined;
  const cpu = usl !== undefined ? finiteOrUndefined(safeDivide(usl - mean, 3 * sigma)) : undefined;
  const cpl = lsl !== undefined ? finiteOrUndefined(safeDivide(mean - lsl, 3 * sigma)) : undefined;
  if (cpu !== undefined && cpl !== undefined) cpk = Math.min(cpu, cpl);
  else cpk = cpu ?? cpl;
  return { cp, cpk };
}

function calculateFromColumn(
  nodeId: string,
  source: Extract<CalculateNodeCapabilitySource, { kind: 'column' }>
): NodeCapabilityResult {
  const { processMap, investigationMeta, data } = source;
  const node = findNode(processMap, nodeId);
  if (!node) return { ...EMPTY_INSUFFICIENT, nodeId };

  const measurementColumn = getMeasurementColumn(node, investigationMeta);
  const specRules = getEffectiveSpecRules(node, investigationMeta);
  if (!measurementColumn || specRules.length === 0) {
    return { ...EMPTY_INSUFFICIENT, nodeId, source: 'column', perContextResults: [] };
  }

  const contextColumns = gatherContextColumns(processMap /* hub-level columns merged at caller */);
  // Group rows by context tuple
  const groups = new Map<string, { ctx: SpecLookupContext; values: number[] }>();
  for (const row of data) {
    const v = toNumericValue(row[measurementColumn]);
    if (v === undefined) continue;
    const ctx = rowContext(row, contextColumns);
    const key = contextKey(ctx);
    let g = groups.get(key);
    if (!g) {
      g = { ctx, values: [] };
      groups.set(key, g);
    }
    g.values.push(v);
  }

  const perContextResults: NonNullable<NodeCapabilityResult['perContextResults']> = [];
  let totalN = 0;
  // For aggregate cpk/cp at the node level, take the *minimum* across contexts —
  // the worst-case capability is the methodologically correct summary when
  // contexts have different specs (you can only commit to the worst one).
  let aggregateCpk: number | undefined;
  let aggregateCp: number | undefined;

  for (const { ctx, values } of groups.values()) {
    const rule = lookupSpecRule(specRules, ctx);
    const { cp, cpk } = rule ? computeCpCpk(values, rule.specs) : {};
    perContextResults.push({
      contextTuple: ctx,
      cpk,
      cp,
      n: values.length,
      sampleConfidence: sampleConfidenceFor(values.length),
    });
    totalN += values.length;
    if (cpk !== undefined) {
      aggregateCpk = aggregateCpk === undefined ? cpk : Math.min(aggregateCpk, cpk);
    }
    if (cp !== undefined) {
      aggregateCp = aggregateCp === undefined ? cp : Math.min(aggregateCp, cp);
    }
  }

  return {
    nodeId,
    cpk: aggregateCpk,
    cp: aggregateCp,
    n: totalN,
    sampleConfidence: sampleConfidenceFor(totalN),
    source: 'column',
    perContextResults,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @variscout/core test nodeCapability.column`
Expected: PASS (5 cases).

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/stats/nodeCapability.ts packages/core/src/stats/__tests__/nodeCapability.column.test.ts
git commit -m "feat(core): implement calculateNodeCapability for column source

Per-(node x context-tuple) Cp/Cpk computation reading from one
investigation's data via nodeMappings. Aggregates per-context
results to a worst-case node-level summary. Uses safeMath; returns
number | undefined per ADR-069 boundary B2."
```

---

## Task 9: Implement `calculateNodeCapability()` for `children` source

**Files:**

- Modify: `packages/core/src/stats/nodeCapability.ts` (replace the `'children'` stub)
- Test: `packages/core/src/stats/__tests__/nodeCapability.children.test.ts`

This task implements aggregation across hub members tagged to the same canonical node — the B2 use case (each step is its own investigation).

- [ ] **Step 1: Write failing test**

Create `packages/core/src/stats/__tests__/nodeCapability.children.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { calculateNodeCapability } from '../nodeCapability';
import type { ProcessHub, ProcessHubInvestigation } from '../../processHub';

const hub: ProcessHub = {
  id: 'hub-1',
  name: 'Bottling Line A',
  createdAt: '2026-04-28T10:00:00.000Z',
};

function inv(
  id: string,
  nodeId: string,
  cpk: number | undefined,
  n: number
): ProcessHubInvestigation {
  return {
    id,
    name: `inv-${id}`,
    modified: '2026-04-28T10:00:00.000Z',
    metadata: {
      processHubId: 'hub-1',
      nodeMappings: nodeId ? [{ nodeId, measurementColumn: 'unused' }] : undefined,
      reviewSignal:
        cpk !== undefined
          ? {
              outcome: 'fill_volume',
              rowCount: n,
              latestTimeValue: undefined,
              capability: { cpk, cpkTarget: 1.33, cp: cpk + 0.1 },
            }
          : undefined,
    },
  };
}

describe('calculateNodeCapability — children source', () => {
  it('aggregates over investigations tagged to the same node', () => {
    const members: ProcessHubInvestigation[] = [
      inv('a', 'n-fill', 1.5, 100),
      inv('b', 'n-fill', 1.2, 80),
      inv('c', 'n-press', 1.8, 50), // different node — excluded
    ];
    const result = calculateNodeCapability('n-fill', { kind: 'children', hub, members });
    expect(result.source).toBe('children');
    expect(result.contributingInvestigations).toEqual(['a', 'b']);
    expect(result.n).toBe(180);
    // Aggregate cpk = worst-case across contributing investigations
    expect(result.cpk).toBe(1.2);
    expect(result.sampleConfidence).toBe('trust');
    expect(result.perContextResults).toHaveLength(2);
  });

  it('excludes investigations with no reviewSignal', () => {
    const members: ProcessHubInvestigation[] = [
      inv('a', 'n-fill', 1.5, 100),
      inv('b', 'n-fill', undefined, 0), // no signal
    ];
    const result = calculateNodeCapability('n-fill', { kind: 'children', hub, members });
    expect(result.contributingInvestigations).toEqual(['a']);
    expect(result.n).toBe(100);
  });

  it('returns insufficient when no contributors exist', () => {
    const members: ProcessHubInvestigation[] = [inv('a', 'n-press', 1.5, 100)];
    const result = calculateNodeCapability('n-fill', { kind: 'children', hub, members });
    expect(result.n).toBe(0);
    expect(result.cpk).toBeUndefined();
    expect(result.sampleConfidence).toBe('insufficient');
    expect(result.contributingInvestigations).toEqual([]);
  });

  it('excludes members from other hubs', () => {
    const otherHubInv: ProcessHubInvestigation = {
      ...inv('z', 'n-fill', 0.5, 100),
      metadata: {
        ...inv('z', 'n-fill', 0.5, 100).metadata,
        processHubId: 'hub-OTHER',
      },
    };
    const result = calculateNodeCapability('n-fill', {
      kind: 'children',
      hub,
      members: [inv('a', 'n-fill', 1.5, 100), otherHubInv],
    });
    expect(result.contributingInvestigations).toEqual(['a']);
    expect(result.cpk).toBe(1.5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/core test nodeCapability.children`
Expected: FAIL — children-source path returns the EMPTY_INSUFFICIENT stub.

- [ ] **Step 3: Replace the children-source stub in `packages/core/src/stats/nodeCapability.ts`**

Replace the comment and stub return with a function call. Find the line with the stub-comment `'children' implementation lands in Task 9` and the line `return { ...EMPTY_INSUFFICIENT, nodeId, source: 'children' };` immediately after it. Replace those two lines with:

```typescript
return calculateFromChildren(nodeId, source);
```

Then append at the bottom of the file:

```typescript
// ============================================================================
// Children-source implementation
// ============================================================================

function calculateFromChildren(
  nodeId: string,
  source: Extract<CalculateNodeCapabilitySource, { kind: 'children' }>
): NodeCapabilityResult {
  const { hub, members } = source;
  const contributing: NonNullable<NodeCapabilityResult['contributingInvestigations']> = [];
  const perContextResults: NonNullable<NodeCapabilityResult['perContextResults']> = [];
  let totalN = 0;
  let aggregateCpk: number | undefined;
  let aggregateCp: number | undefined;

  for (const member of members) {
    const meta = member.metadata;
    if (!meta) continue;
    if (meta.processHubId !== hub.id) continue;
    const tagged = meta.nodeMappings?.some(m => m.nodeId === nodeId) ?? false;
    if (!tagged) continue;
    const signal = meta.reviewSignal;
    if (!signal) continue;
    const cpk = signal.capability?.cpk;
    const cp = signal.capability?.cp;
    const n = signal.rowCount ?? 0;
    if (n <= 0) continue;
    contributing.push(member.id);
    totalN += n;
    if (cpk !== undefined) {
      aggregateCpk = aggregateCpk === undefined ? cpk : Math.min(aggregateCpk, cpk);
    }
    if (cp !== undefined) {
      aggregateCp = aggregateCp === undefined ? cp : Math.min(aggregateCp, cp);
    }
    // Each contributing investigation contributes one perContextResult row.
    // Context tuple is empty here — children aggregation does not stratify by
    // context columns; that's the column-source's job. (Future: aggregate
    // signal.capability.perContextResults if signals carry them.)
    perContextResults.push({
      contextTuple: { investigationId: member.id },
      cpk,
      cp,
      n,
      sampleConfidence: sampleConfidenceFor(n),
    });
  }

  return {
    nodeId,
    cpk: aggregateCpk,
    cp: aggregateCp,
    n: totalN,
    sampleConfidence: sampleConfidenceFor(totalN),
    source: 'children',
    contributingInvestigations: contributing,
    perContextResults,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @variscout/core test nodeCapability.children`
Expected: PASS (4 cases).

Re-run the column-source tests for regression:

Run: `pnpm --filter @variscout/core test nodeCapability`
Expected: PASS (all 9 cases).

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/stats/nodeCapability.ts packages/core/src/stats/__tests__/nodeCapability.children.test.ts
git commit -m "feat(core): implement calculateNodeCapability for children source

Aggregates per-investigation HubReviewSignal.capability across hub
members tagged to a canonical node via nodeMappings. Worst-case
node-level cpk; per-context rows carry investigationId. No cross-
investigation arithmetic beyond Min — methodologically equivalent
to picking the worst contributor."
```

---

## Task 10: Implement migration helper for legacy investigations

**Files:**

- Create: `packages/core/src/stats/nodeCapabilityMigration.ts`
- Test: `packages/core/src/stats/__tests__/nodeCapabilityMigration.test.ts`

- [ ] **Step 1: Write failing test**

Create `packages/core/src/stats/__tests__/nodeCapabilityMigration.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { isLegacyInvestigation, suggestNodeMappings } from '../nodeCapabilityMigration';
import type { ProcessHubInvestigationMetadata } from '../../processHub';
import type { ProcessMap } from '../../frame/types';

describe('isLegacyInvestigation', () => {
  it('returns true when nodeMappings is absent', () => {
    expect(isLegacyInvestigation({})).toBe(true);
    expect(isLegacyInvestigation({ processHubId: 'h' })).toBe(true);
  });

  it('returns true when nodeMappings is empty', () => {
    expect(isLegacyInvestigation({ nodeMappings: [] })).toBe(true);
  });

  it('returns false when at least one mapping is present', () => {
    const meta: ProcessHubInvestigationMetadata = {
      nodeMappings: [{ nodeId: 'n1', measurementColumn: 'col' }],
    };
    expect(isLegacyInvestigation(meta)).toBe(false);
  });
});

describe('suggestNodeMappings', () => {
  const map: ProcessMap = {
    version: 1,
    nodes: [
      { id: 'n-mix', name: 'Mix', order: 0, ctqColumn: 'mix_weight' },
      { id: 'n-press', name: 'Press', order: 1, ctqColumn: 'press_force' },
      { id: 'n-coat', name: 'Coat', order: 2 }, // no ctqColumn
    ],
    tributaries: [],
    createdAt: '',
    updatedAt: '',
  };

  it('returns a mapping for every node whose ctqColumn appears in the dataset columns', () => {
    const suggestions = suggestNodeMappings(map, ['mix_weight', 'press_force', 'unrelated']);
    expect(suggestions).toEqual([
      { nodeId: 'n-mix', measurementColumn: 'mix_weight' },
      { nodeId: 'n-press', measurementColumn: 'press_force' },
    ]);
  });

  it('skips nodes whose ctqColumn is missing from the dataset', () => {
    const suggestions = suggestNodeMappings(map, ['mix_weight']);
    expect(suggestions).toEqual([{ nodeId: 'n-mix', measurementColumn: 'mix_weight' }]);
  });

  it('returns empty list when no nodes match', () => {
    expect(suggestNodeMappings(map, ['nothing'])).toEqual([]);
    expect(suggestNodeMappings(map, [])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/core test nodeCapabilityMigration`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `packages/core/src/stats/nodeCapabilityMigration.ts`:

```typescript
import type { ProcessMap } from '../frame/types';
import type { ProcessHubInvestigationMetadata, InvestigationNodeMapping } from '../processHub';

/**
 * True when an investigation is in the B0 legacy state — no nodeMappings,
 * uses global investigation-level specs as fallback. Such investigations do
 * not appear in production-line-glance dashboards.
 */
export function isLegacyInvestigation(meta: ProcessHubInvestigationMetadata): boolean {
  if (!meta.nodeMappings) return true;
  return meta.nodeMappings.length === 0;
}

/**
 * Auto-suggest `nodeMappings` for a legacy investigation by matching each
 * canonical node's `ctqColumn` against the dataset's available columns.
 * Returns mappings only for nodes whose `ctqColumn` is set AND present in
 * the dataset. Caller surfaces these to the analyst for confirmation.
 */
export function suggestNodeMappings(
  canonicalMap: ProcessMap,
  datasetColumns: readonly string[]
): InvestigationNodeMapping[] {
  const columnSet = new Set(datasetColumns);
  const out: InvestigationNodeMapping[] = [];
  for (const node of canonicalMap.nodes) {
    if (!node.ctqColumn) continue;
    if (!columnSet.has(node.ctqColumn)) continue;
    out.push({ nodeId: node.id, measurementColumn: node.ctqColumn });
  }
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @variscout/core test nodeCapabilityMigration`
Expected: PASS (6 cases).

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/stats/nodeCapabilityMigration.ts packages/core/src/stats/__tests__/nodeCapabilityMigration.test.ts
git commit -m "feat(core): add legacy-investigation migration helpers

isLegacyInvestigation detects B0 fallback. suggestNodeMappings
auto-proposes mappings using existing ProcessMapNode.ctqColumn
field. Caller-surfaced; analyst confirms before persisting."
```

---

## Task 11: Architectural test — verify NO cross-investigation aggregation primitive exists

**Files:**

- Create: `packages/core/src/__tests__/architecture.noCrossInvestigationAggregation.test.ts`

This is a guard test that fails if anyone introduces a function aggregating capability across investigations. It enforces the structural-absence rule from the spec. Implementation uses pure Node `fs` (no shell) to walk the source tree and search for forbidden identifiers.

- [ ] **Step 1: Write the architectural test**

Create `packages/core/src/__tests__/architecture.noCrossInvestigationAggregation.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Forbidden identifier patterns: any name suggesting cross-investigation or
 * cross-hub Cp/Cpk aggregation. The production-line-glance design preserves
 * Watson's "Cpks are not additive across heterogeneous local processes"
 * rule by *structural absence* of such primitives.
 *
 * See: docs/superpowers/specs/2026-04-28-production-line-glance-design.md
 */
const FORBIDDEN_NAMES = [
  'aggregateCpkAcrossInvestigations',
  'aggregateCapabilityAcrossInvestigations',
  'meanCapability',
  'meanCpk',
  'sumCpk',
  'portfolioCpk',
  'crossHubCpk',
  'globalCpk',
];

const CORE_SRC = path.resolve(__dirname, '..');

function listTypeScriptFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip test directories (the test's own forbidden-list mention is OK)
      if (entry.name === '__tests__') continue;
      out.push(...listTypeScriptFiles(full));
      continue;
    }
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.ts') && !entry.name.endsWith('.tsx')) continue;
    if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.test.tsx')) continue;
    out.push(full);
  }
  return out;
}

function findHits(name: string, files: readonly string[]): string[] {
  // Whole-word match: name preceded by non-word char (or start of file) and
  // followed by non-word char (or end of file). Avoids false positives on
  // longer names that happen to contain a forbidden substring.
  const pattern = new RegExp(`(^|\\W)${name}(?=\\W|$)`);
  const hits: string[] = [];
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    if (pattern.test(text)) hits.push(file);
  }
  return hits;
}

describe('Architecture — no cross-investigation Cp/Cpk aggregation primitive', () => {
  const files = listTypeScriptFiles(CORE_SRC);

  for (const name of FORBIDDEN_NAMES) {
    it(`does not declare or reference "${name}" anywhere in @variscout/core (excluding tests)`, () => {
      const hits = findHits(name, files);
      expect(hits, `Forbidden name "${name}" appears in:\n  ${hits.join('\n  ')}`).toEqual([]);
    });
  }
});
```

- [ ] **Step 2: Run test to verify it passes immediately**

Since none of these forbidden names exist in non-test source, this test should PASS on first run:

Run: `pnpm --filter @variscout/core test architecture.noCrossInvestigationAggregation`
Expected: PASS (8 cases).

- [ ] **Step 3: Verify the test would fail if violated (manual sanity check, no commit of this step)**

Temporarily add a stub function to any non-test core file:

```typescript
// TEMPORARY — remove before committing
export function meanCpk() {}
```

Re-run the test. Expected: FAIL on `meanCpk`. Remove the stub. Re-run. Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/__tests__/architecture.noCrossInvestigationAggregation.test.ts
git commit -m "test(core): architectural guard against cross-investigation Cpk aggregation

Enforces the structural-absence rule from the production-line-glance
design spec: no function aggregates Cp/Cpk across investigations or
hubs. Watson G10/D3 preserved by absence, not by guard rule.
Implemented via fs-only directory walk (no shell)."
```

---

## Task 12: Export new APIs from `@variscout/core` sub-paths

**Files:**

- Modify: `packages/core/src/stats/index.ts` (or wherever `/stats` sub-path barrel lives)
- Test: `packages/core/src/__tests__/exports.nodeCapability.test.ts`

- [ ] **Step 1: Locate the stats barrel and write the export test**

Run: `cat packages/core/src/stats/index.ts | head -30`
Note the existing export pattern.

Create `packages/core/src/__tests__/exports.nodeCapability.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

describe('@variscout/core exports — nodeCapability surface', () => {
  it('exposes calculateNodeCapability via the stats sub-path', async () => {
    const stats = await import('@variscout/core/stats');
    expect(typeof stats.calculateNodeCapability).toBe('function');
    expect(typeof stats.lookupSpecRule).toBe('function');
    expect(typeof stats.sampleConfidenceFor).toBe('function');
    expect(typeof stats.isLegacyInvestigation).toBe('function');
    expect(typeof stats.suggestNodeMappings).toBe('function');
  });

  it('exposes thresholds and the helper surface', async () => {
    const stats = await import('@variscout/core/stats');
    expect(stats.SAMPLE_CONFIDENCE_THRESHOLDS.review).toBe(30);
    expect(typeof stats.ruleMatches).toBe('function');
    expect(typeof stats.ruleSpecificity).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/core test exports.nodeCapability`
Expected: FAIL — exports not added yet.

- [ ] **Step 3: Add re-exports to `packages/core/src/stats/index.ts`**

Append (or insert in sorted order — match the file's existing pattern):

```typescript
export {
  calculateNodeCapability,
  type NodeCapabilityResult,
  type CalculateNodeCapabilitySource,
} from './nodeCapability';
export { lookupSpecRule, ruleMatches, ruleSpecificity } from './specRuleLookup';
export {
  sampleConfidenceFor,
  SAMPLE_CONFIDENCE_THRESHOLDS,
  type SampleConfidence,
} from './sampleConfidence';
export { isLegacyInvestigation, suggestNodeMappings } from './nodeCapabilityMigration';
```

If the barrel uses a different export style (e.g., `export *`), match that style instead.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @variscout/core test exports.nodeCapability`
Expected: PASS.

- [ ] **Step 5: Build core to confirm exports resolve**

Run: `pnpm --filter @variscout/core build`
Expected: SUCCESS, no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/stats/index.ts packages/core/src/__tests__/exports.nodeCapability.test.ts
git commit -m "feat(core): export production-line-glance engine APIs from @variscout/core/stats

calculateNodeCapability, lookupSpecRule, sampleConfidenceFor, and
migration helpers are now part of the public sub-path API. Types
(NodeCapabilityResult, SampleConfidence, etc.) re-exported alongside."
```

---

## Final verification

- [ ] **Run the full core test suite**

Run: `pnpm --filter @variscout/core test`
Expected: ALL PASS, including the new tests added in this plan plus all existing tests (no regressions).

- [ ] **Run a build across the workspace**

Run: `pnpm build`
Expected: SUCCESS for all packages. Type errors anywhere downstream (`@variscout/hooks`, `@variscout/ui`, `@variscout/charts`, apps) would indicate a contract drift — fix before merging.

- [ ] **PR-ready check**

Run: `bash scripts/pr-ready-check.sh`
Expected: GREEN. If lint or docs:check flag anything (e.g., orphaned doc references), fix inline.

- [ ] **Subagent code review**

Per `CLAUDE.md` Workflow rule, before merging product-code PRs, dispatch the `feature-dev:code-reviewer` agent to review the diff against the spec.

---

## What this plan delivers

By the end of these 12 tasks:

- **Engine layer is complete**: types extended, spec-rule lookup, `calculateNodeCapability` for both column and children sources, sample-size confidence, migration helpers.
- **Architectural guard is in place**: structural absence of cross-investigation Cp/Cpk aggregation is enforced by a test that fails if anyone introduces such a primitive.
- **Public API is stable**: new APIs exported from `@variscout/core/stats`. Downstream packages (`@variscout/charts`, `@variscout/hooks`, apps) can build the dashboard on top.

## What this plan does NOT deliver (and why)

- **No charts** (W3 Δ-trend i-chart, per-step Cpk boxplot, per-step error Pareto): own plan (Plan B). Engine returns `NodeCapabilityResult[]`; charts consume it. Cleanly separable.
- **No UI surfaces** (Operations band wiring, Hub view panel, FRAME workspace live-preview): own plan (Plan C).
- **No cross-hub context-filtered view**: own plan (Plan D). Builds on the engine + charts.
- **No migration UX** (the dialogue that prompts an analyst when a legacy investigation joins a hub with a canonical map): own plan (Plan C, alongside FRAME workspace surfacing). The migration _helpers_ (Task 10) are here; the user-facing flow is not.
- **W4 (terminology drift), W5 (governance docs), W6 (ADR amendments), W7 (observed-vs-expected paragraph)**: separate work, not engine-coupled. Plans/PRs of their own.

## References

- Spec: `docs/superpowers/specs/2026-04-28-production-line-glance-design.md`
- Critique: `~/.claude/plans/i-would-need-to-drifting-hummingbird.md` (objections A2/A3/A4 → addressed by Tasks 8/2 and Task 7 respectively)
- Operating model: `docs/superpowers/specs/2026-04-27-process-learning-operating-model-design.md` (lines 274-276, 282-289, 291-293, 456)
- ADR-069 (three-boundary numeric safety): drives use of `safeMath`, `finiteOrUndefined`, `safeDivide` in Task 8.
- `.claude/rules/stats.md`: enforced — no `Math.random`, no NaN returns, deterministic PRNG for tests.
