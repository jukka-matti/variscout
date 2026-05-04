---
title: Production-Line-Glance — C1 Data Layer + Hub Capability Tab Implementation Plan
audience: [engineer, architect]
category: implementation
status: delivered
related:
  [
    production-line-glance-surface-wiring-design,
    production-line-glance-design,
    production-line-glance-charts,
    production-line-glance-engine,
  ]
date: 2026-04-28
---

# Production-Line-Glance — C1 Data Layer + Hub Capability Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the shared data layer and the first surface (Process Hub Capability tab in azure-app) for the production-line-glance dashboard. Land pure derivation utilities, React data hooks, URL-persisted filter state, the B0 migration banner + mapping modal, and the new Capability tab in the Process Hub view. Close the chrome-walk validation deferred from Plan B T3 (CapabilityBoxplot overlay alignment).

**Architecture:** Pure derivation in `@variscout/core/stats` (distinct-value enumeration, step-error rollup). React derivation hooks in `@variscout/hooks` (slot-input projection, URL-state filter, B0 enumeration). Pure presentational components in `@variscout/ui` (migration banner, mapping modal). Azure-app glue layer (`useHubProvision`) projects Dexie/Blob data into hook inputs, then mounts `ProductionLineGlanceDashboard mode='full'` inside a new "Capability" tab next to the existing flat `ProcessHubReviewPanel`. Per `core → hooks → ui → apps` (ADR-045) and customer-owned-data (ADR-059) — nothing leaves the tenant.

**Tech Stack:** TypeScript, React, Vitest, React Testing Library. Skills: `editing-statistics` (T1, T2), `editing-azure-storage-auth` (T8), `writing-tests`. Hard rules from `packages/core/CLAUDE.md` (no NaN, three-boundary safety, no `Math.random`), `packages/charts/CLAUDE.md` (no hex literals — N/A here, charts already done), `packages/ui/CLAUDE.md` (semantic Tailwind tokens, functional components only, props named `{ComponentName}Props`).

**Spec reference:** `docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md` — sections "Data layer", "B0 migration UX", "Three surfaces / 2. Process Hub view (Capability tab)".

**Critical existing entry points:**

- `packages/core/src/stats/nodeCapability.ts` — `calculateNodeCapability`, `NodeCapabilityResult`, `CalculateNodeCapabilitySource`
- `packages/core/src/stats/sampleConfidence.ts` — `sampleConfidenceFor`, `SAMPLE_CONFIDENCE_THRESHOLDS`
- `packages/core/src/stats/specRuleLookup.ts` — `lookupSpecRule`, `ruleMatches`
- `packages/core/src/stats/nodeCapabilityMigration.ts` — `isLegacyInvestigation`, `suggestNodeMappings`
- `packages/core/src/stats/safeMath.ts` — `safeDivide`, `finiteOrUndefined`
- `packages/core/src/processHub.ts:151` — `ProcessHubInvestigation` interface
- `packages/core/src/processHub.ts:728` — `buildProcessHubCadence`
- `packages/core/src/types.ts` — `DataRow`, `SpecLookupContext`, `SpecRule`, `SpecLimits`, `IChartDataPoint`, `StatsResult`
- `packages/core/src/defect/` — `mapDefectColumnRows`, `DefectColumnConfig` (used by T2)
- `packages/core/src/stats/basic.ts` — `calculateStats`
- `packages/core/src/stats/movingRange.ts` — moving-range sigma helpers (used by T3 cpkTrend computation)
- `packages/charts/src/types.ts` — `IChartDataPoint`
- `packages/ui/src/components/ProductionLineGlanceDashboard/` — Plan B dashboard (consumer of T3 output)
- `apps/azure/src/components/ProcessHubReviewPanel.tsx` — current Hub review surface (T9 wraps it)
- `apps/azure/src/db/schema.ts` — Dexie schema for hub/investigation/data-row reads
- `apps/azure/src/lib/processHubRoutes.ts` — `resolveInvestigationForNode` (used for drill-from-step)

**Out of scope for C1:**

- LayeredProcessView Operations band (Plan C2)
- FRAME workspace right-hand drawer (Plan C3)
- Cross-hub context-filtered view (Plan D)
- PWA Process Hub view (separate plan; out of Plan C entirely per spec)
- LayeredProcessView snapshot mode (deferred to H3)

---

## File structure (lock decisions before tasks)

### `packages/core/src/stats/` — new files

- `contextValueOptions.ts` — `distinctContextValues(rows, column): string[]` (sorted, deduped, capped at 50, null/empty excluded)
- `stepErrorAggregation.ts` — `rollupStepErrors(input): StepErrorParetoStep[]` (per-node defect counts via `mapDefectColumnRows`, optionally narrowed by `contextFilter`)
- `__tests__/contextValueOptions.test.ts`
- `__tests__/stepErrorAggregation.test.ts`

### `packages/core/src/stats/index.ts` — modified

- Re-export `distinctContextValues`, `rollupStepErrors`, `StepErrorRollupInput` (the second function is the type-only export; the value lives in @variscout/charts already as `StepErrorParetoStep`).

### `packages/hooks/src/` — new files

- `useProductionLineGlanceData.ts` — composes the four slot inputs from (hub, members, rowsByInvestigation, contextFilter, defectColumns).
- `useProductionLineGlanceFilter.ts` — URL-search-param synchronizer for filter state.
- `useB0InvestigationsInHub.ts` — enumerates unmapped investigations excluding dismissed.
- `__tests__/useProductionLineGlanceData.test.ts`
- `__tests__/useProductionLineGlanceFilter.test.tsx`
- `__tests__/useB0InvestigationsInHub.test.ts`

### `packages/hooks/src/index.ts` — modified

- Re-export the three new hooks + their input/return types.

### `packages/ui/src/components/ProductionLineGlanceMigration/` — new directory

- `ProductionLineGlanceMigrationBanner.tsx` — presentational banner (count + primary action). Pure props.
- `ProductionLineGlanceMigrationModal.tsx` — accordion-style mapping modal: lists each B0 investigation with its measurement column(s) and suggested node mappings; per-row Save / Skip / Decline.
- `index.ts` — barrel.
- `__tests__/ProductionLineGlanceMigrationBanner.test.tsx`
- `__tests__/ProductionLineGlanceMigrationModal.test.tsx`

### `packages/ui/src/index.ts` — modified

- Re-export the banner and modal + their prop types.

### `apps/azure/src/features/processHub/` — new directory

- `useHubProvision.ts` — Dexie/Blob → `{ hub, members, rowsByInvestigation }` (the hook consumed by `useProductionLineGlanceData`).
- `useHubMigrationState.ts` — wires `useB0InvestigationsInHub` to `migrationDeclinedAt` updates in Dexie.
- `index.ts` — barrel.

### `apps/azure/src/components/` — modified files

- `ProcessHubView.tsx` (new) — tab container ("Status" / "Capability") wrapping `ProcessHubReviewPanel`. Replaces direct mounts of `ProcessHubReviewPanel` from pages.
- `ProcessHubCapabilityTab.tsx` (new) — composes `ProductionLineGlanceFilterStrip` + `ProductionLineGlanceDashboard mode='full'` + the migration banner + modal. Reads from `useHubProvision` + `useProductionLineGlanceData` + `useProductionLineGlanceFilter` + `useB0InvestigationsInHub`.
- `ProcessHubReviewPanel.tsx` — minor: factor out the existing flat layout so it renders inside the "Status" tab without behavior change.

### `apps/azure/src/pages/Dashboard.tsx` — modified

- Replace direct `<ProcessHubReviewPanel rollup={…} />` mount with `<ProcessHubView rollup={…} />`.

---

## Task 1: `distinctContextValues` in `@variscout/core/stats`

**Files:**

- Create: `packages/core/src/stats/contextValueOptions.ts`
- Create: `packages/core/src/stats/__tests__/contextValueOptions.test.ts`
- Modify: `packages/core/src/stats/index.ts`

- [ ] **Step 1: Write failing test**

Create `packages/core/src/stats/__tests__/contextValueOptions.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { distinctContextValues } from '../contextValueOptions';
import type { DataRow } from '../../types';

describe('distinctContextValues', () => {
  const rows: DataRow[] = [
    { product: 'Coke 12oz', shift: 'A', value: 1 },
    { product: 'Coke 16oz', shift: 'B', value: 2 },
    { product: 'Coke 12oz', shift: 'A', value: 3 },
    { product: 'Sprite 12oz', shift: '', value: 4 }, // empty shift
    { product: null as unknown as string, shift: 'C', value: 5 }, // null product
  ];

  it('returns distinct values for a column, sorted lexicographically', () => {
    expect(distinctContextValues(rows, 'product')).toEqual([
      'Coke 12oz',
      'Coke 16oz',
      'Sprite 12oz',
    ]);
  });

  it('excludes null and empty values', () => {
    expect(distinctContextValues(rows, 'shift')).toEqual(['A', 'B', 'C']);
  });

  it('returns empty array for absent column', () => {
    expect(distinctContextValues(rows, 'absent')).toEqual([]);
  });

  it('returns empty array for empty input', () => {
    expect(distinctContextValues([], 'product')).toEqual([]);
  });

  it('caps cardinality at 50 (returns first 50 sorted)', () => {
    const many: DataRow[] = Array.from({ length: 100 }, (_, i) => ({
      k: `v${String(i).padStart(3, '0')}`,
    }));
    const result = distinctContextValues(many, 'k');
    expect(result.length).toBe(50);
    expect(result[0]).toBe('v000');
    expect(result[49]).toBe('v049');
  });

  it('treats numeric values as strings (uses String() coercion)', () => {
    const numericRows: DataRow[] = [
      { batch: 1, value: 'a' },
      { batch: 2, value: 'b' },
      { batch: 1, value: 'c' },
    ];
    expect(distinctContextValues(numericRows, 'batch')).toEqual(['1', '2']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/core test contextValueOptions`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `contextValueOptions.ts`**

Create `packages/core/src/stats/contextValueOptions.ts`:

```typescript
import type { DataRow } from '../types';

const MAX_DISTINCT_VALUES = 50;

/**
 * Enumerate the distinct values present in a column across rows. Excludes
 * null, undefined, and empty-string values. Sorted lexicographically. Caps
 * cardinality at 50 — beyond that, the dimension is being abused as an
 * identifier rather than a context filter and the analyst should split into
 * multiple hubs.
 *
 * Used by `useProductionLineGlanceData` to populate the filter strip's
 * per-column chip options.
 */
export function distinctContextValues(rows: readonly DataRow[], column: string): string[] {
  const seen = new Set<string>();
  for (const row of rows) {
    const raw = row[column];
    if (raw === null || raw === undefined) continue;
    const str = String(raw);
    if (str === '') continue;
    seen.add(str);
  }
  const sorted = [...seen].sort();
  return sorted.slice(0, MAX_DISTINCT_VALUES);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @variscout/core test contextValueOptions`
Expected: PASS — 6/6.

- [ ] **Step 5: Re-export from `packages/core/src/stats/index.ts`**

Add (near the existing `nodeCapability`/`specRuleLookup` exports around line 205):

```typescript
export { distinctContextValues } from './contextValueOptions';
```

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/stats/contextValueOptions.ts \
        packages/core/src/stats/__tests__/contextValueOptions.test.ts \
        packages/core/src/stats/index.ts
git commit -m "$(cat <<'EOF'
feat(core): add distinctContextValues for filter-strip options

Pure derivation: enumerates the distinct values present in a column
across rows (excludes null/empty, sorted lexicographically, capped at
50). Used by useProductionLineGlanceData to populate the filter strip's
per-column chip options.

See spec docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md
section "Data layer".

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

## Task 2: `rollupStepErrors` in `@variscout/core/stats`

**Files:**

- Create: `packages/core/src/stats/stepErrorAggregation.ts`
- Create: `packages/core/src/stats/__tests__/stepErrorAggregation.test.ts`
- Modify: `packages/core/src/stats/index.ts`

- [ ] **Step 1: Read existing defect helpers**

Run: `grep -n "export\|interface" packages/core/src/defect/index.ts | head -30`

Identify `mapDefectColumnRows` (or similar) — the function that classifies each row in a defect column as pass/fail. The rollup walks per-investigation rows, applies the investigation's `nodeMappings`, and sums non-pass values per node.

If `mapDefectColumnRows` does NOT exist in the form needed, T2 implementer should add it inline as a private helper inside `stepErrorAggregation.ts` rather than expanding the public defect API. Plan only ships what the spec needs.

- [ ] **Step 2: Write failing test**

Create `packages/core/src/stats/__tests__/stepErrorAggregation.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { rollupStepErrors } from '../stepErrorAggregation';
import type {
  ProcessHub,
  ProcessHubInvestigation,
  ProcessHubInvestigationMetadata,
} from '../../processHub';
import type { ProcessMap } from '../../frame/types';
import type { DataRow } from '../../types';

const map: ProcessMap = {
  version: 1,
  nodes: [
    { id: 'n1', name: 'Mix', type: 'process', position: { x: 0, y: 0 }, ctqColumn: 'mixCpk' },
    { id: 'n2', name: 'Fill', type: 'process', position: { x: 1, y: 0 }, ctqColumn: 'fillCpk' },
  ],
  tributaries: [],
};

const hub: ProcessHub = {
  id: 'hub-1',
  name: 'Line A',
  canonicalProcessMap: map,
  canonicalMapVersion: '2026-04-28',
};

function makeMember(opts: {
  id: string;
  rows: DataRow[];
  nodeMappings: ProcessHubInvestigationMetadata['nodeMappings'];
}): ProcessHubInvestigation {
  return {
    id: opts.id,
    name: `Investigation ${opts.id}`,
    processHubId: 'hub-1',
    metadata: {
      processHubId: 'hub-1',
      nodeMappings: opts.nodeMappings,
      canonicalMapVersion: '2026-04-28',
    },
    rows: opts.rows,
    reviewSignal: { ok: 0, review: 0, alarm: 0 },
  } as ProcessHubInvestigation;
}

describe('rollupStepErrors', () => {
  it('counts non-pass rows per node from the configured defect column', () => {
    const m1 = makeMember({
      id: 'i1',
      rows: [
        { mixCpk: 1.4, defect: 'pass' },
        { mixCpk: 1.0, defect: 'crack' },
        { mixCpk: 0.8, defect: 'crack' },
        { mixCpk: 1.5, defect: 'pass' },
      ],
      nodeMappings: [{ nodeId: 'n1', measurementColumn: 'mixCpk' }],
    });
    const m2 = makeMember({
      id: 'i2',
      rows: [
        { fillCpk: 1.2, defect: 'pass' },
        { fillCpk: 0.9, defect: 'short-fill' },
      ],
      nodeMappings: [{ nodeId: 'n2', measurementColumn: 'fillCpk' }],
    });
    const result = rollupStepErrors({
      hub,
      members: [m1, m2],
      defectColumns: ['defect'],
    });
    // Sorted descending by errorCount in the chart, but rollup returns one per
    // mapped node regardless of order (caller sorts).
    expect(result.find(s => s.nodeId === 'n1')?.errorCount).toBe(2);
    expect(result.find(s => s.nodeId === 'n2')?.errorCount).toBe(1);
    expect(result.find(s => s.nodeId === 'n1')?.label).toBe('Mix');
  });

  it('respects contextFilter — only counts rows matching the filter', () => {
    const m = makeMember({
      id: 'i1',
      rows: [
        { mixCpk: 1.0, defect: 'crack', product: 'A' },
        { mixCpk: 1.0, defect: 'crack', product: 'B' },
        { mixCpk: 1.0, defect: 'crack', product: 'A' },
      ],
      nodeMappings: [{ nodeId: 'n1', measurementColumn: 'mixCpk' }],
    });
    const result = rollupStepErrors({
      hub,
      members: [m],
      defectColumns: ['defect'],
      contextFilter: { product: 'A' },
    });
    expect(result.find(s => s.nodeId === 'n1')?.errorCount).toBe(2);
  });

  it('returns 0 errorCount for nodes that have no defect data', () => {
    const m = makeMember({
      id: 'i1',
      rows: [{ mixCpk: 1.4 }, { mixCpk: 1.5 }], // no defect column
      nodeMappings: [{ nodeId: 'n1', measurementColumn: 'mixCpk' }],
    });
    const result = rollupStepErrors({
      hub,
      members: [m],
      defectColumns: ['defect'],
    });
    expect(result.find(s => s.nodeId === 'n1')?.errorCount).toBe(0);
  });

  it('aggregates across multiple investigations mapped to the same node', () => {
    const m1 = makeMember({
      id: 'i1',
      rows: [
        { mixCpk: 1.0, defect: 'crack' },
        { mixCpk: 1.0, defect: 'crack' },
      ],
      nodeMappings: [{ nodeId: 'n1', measurementColumn: 'mixCpk' }],
    });
    const m2 = makeMember({
      id: 'i2',
      rows: [{ mixCpk: 1.0, defect: 'crack' }],
      nodeMappings: [{ nodeId: 'n1', measurementColumn: 'mixCpk' }],
    });
    const result = rollupStepErrors({
      hub,
      members: [m1, m2],
      defectColumns: ['defect'],
    });
    expect(result.find(s => s.nodeId === 'n1')?.errorCount).toBe(3);
  });

  it('skips investigations from a different hub', () => {
    const otherHub = makeMember({
      id: 'other',
      rows: [{ mixCpk: 1.0, defect: 'crack' }],
      nodeMappings: [{ nodeId: 'n1', measurementColumn: 'mixCpk' }],
    });
    (otherHub as any).processHubId = 'hub-2';
    if (otherHub.metadata) (otherHub.metadata as any).processHubId = 'hub-2';
    const result = rollupStepErrors({
      hub,
      members: [otherHub],
      defectColumns: ['defect'],
    });
    expect(result.find(s => s.nodeId === 'n1')?.errorCount).toBe(0);
  });

  it('returns empty array when hub has no canonicalProcessMap', () => {
    const noMapHub: ProcessHub = { ...hub, canonicalProcessMap: undefined };
    const result = rollupStepErrors({ hub: noMapHub, members: [], defectColumns: ['defect'] });
    expect(result).toEqual([]);
  });

  it('handles empty defectColumns by returning all nodes with errorCount=0', () => {
    const m = makeMember({
      id: 'i1',
      rows: [{ mixCpk: 1.0, defect: 'crack' }],
      nodeMappings: [{ nodeId: 'n1', measurementColumn: 'mixCpk' }],
    });
    const result = rollupStepErrors({ hub, members: [m] }); // no defectColumns
    expect(result.every(s => s.errorCount === 0)).toBe(true);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter @variscout/core test stepErrorAggregation`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `stepErrorAggregation.ts`**

Create `packages/core/src/stats/stepErrorAggregation.ts`:

```typescript
import type {
  ProcessHub,
  ProcessHubInvestigation,
  ProcessHubInvestigationMetadata,
} from '../processHub';
import type { ProcessMap, ProcessMapNode } from '../frame/types';
import type { DataRow, SpecLookupContext } from '../types';

/**
 * Per-step error rollup input.
 *
 * `defectColumns`: which row columns to read as defect indicators. Rows where
 * any defect column is non-empty AND not equal to a "pass" sentinel
 * ('pass' / 'ok' / '0' / 'false') count as one error for the row's mapped node.
 *
 * `contextFilter`: optional row-level filter; only rows whose values match
 * every key in the filter contribute to the rollup.
 */
export interface StepErrorRollupInput {
  hub: ProcessHub;
  members: readonly ProcessHubInvestigation[];
  defectColumns?: readonly string[];
  contextFilter?: SpecLookupContext;
}

export interface StepErrorRollupResult {
  nodeId: string;
  label: string;
  errorCount: number;
}

const PASS_SENTINELS = new Set(['pass', 'ok', '0', 'false', 'no', '-', '']);

function isPass(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  return PASS_SENTINELS.has(String(value).toLowerCase().trim());
}

function rowMatchesFilter(row: DataRow, filter: SpecLookupContext | undefined): boolean {
  if (!filter) return true;
  for (const [key, expected] of Object.entries(filter)) {
    if (expected === undefined || expected === null) continue;
    const actual = row[key];
    if (actual === undefined || actual === null) return false;
    if (String(actual) !== String(expected)) return false;
  }
  return true;
}

function rowHasDefect(row: DataRow, defectColumns: readonly string[]): boolean {
  for (const col of defectColumns) {
    if (!isPass(row[col])) return true;
  }
  return false;
}

/**
 * Roll up per-step error counts across hub-member investigations.
 *
 * Each investigation contributes its rows for each mapped node; rows whose
 * any defect-column value is non-pass count once toward that node's error
 * total. Non-member investigations (different `processHubId`) are skipped.
 */
export function rollupStepErrors(input: StepErrorRollupInput): StepErrorRollupResult[] {
  const { hub, members, defectColumns = [], contextFilter } = input;
  const map: ProcessMap | undefined = hub.canonicalProcessMap;
  if (!map) return [];

  const counts = new Map<string, number>();
  for (const node of map.nodes) {
    counts.set(node.id, 0);
  }

  for (const member of members) {
    if ((member as { processHubId?: string }).processHubId !== hub.id) continue;
    const meta = (member as { metadata?: ProcessHubInvestigationMetadata }).metadata;
    if (!meta || !meta.nodeMappings) continue;
    const rows = (member as { rows?: readonly DataRow[] }).rows ?? [];
    if (rows.length === 0) continue;

    const mappedNodeIds = new Set(meta.nodeMappings.map(m => m.nodeId));

    for (const row of rows) {
      if (!rowMatchesFilter(row, contextFilter)) continue;
      if (defectColumns.length === 0) continue;
      if (!rowHasDefect(row, defectColumns)) continue;
      // Each row contributes once to every node it maps to.
      for (const nodeId of mappedNodeIds) {
        counts.set(nodeId, (counts.get(nodeId) ?? 0) + 1);
      }
    }
  }

  return map.nodes.map((node: ProcessMapNode) => ({
    nodeId: node.id,
    label: node.name,
    errorCount: counts.get(node.id) ?? 0,
  }));
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @variscout/core test stepErrorAggregation`
Expected: PASS — 7/7.

If the test fails because `ProcessHubInvestigation`'s actual shape (rows, processHubId, metadata) differs from the test fixture, READ `packages/core/src/processHub.ts:151` and adjust both the implementation and the test fixture to match the real interface. Don't silence type errors with `as any` beyond the small scope needed for hub-id override.

- [ ] **Step 6: Re-export from `packages/core/src/stats/index.ts`**

Add:

```typescript
export { rollupStepErrors } from './stepErrorAggregation';
export type { StepErrorRollupInput, StepErrorRollupResult } from './stepErrorAggregation';
```

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/stats/stepErrorAggregation.ts \
        packages/core/src/stats/__tests__/stepErrorAggregation.test.ts \
        packages/core/src/stats/index.ts
git commit -m "$(cat <<'EOF'
feat(core): add rollupStepErrors for per-step defect counting

Walks per-member investigation rows, applies nodeMappings, counts non-pass
values from the configured defect columns per canonical-map node. Honors
contextFilter for hub-level / tributary-attached context dimensions and
skips investigations from a different hub.

Returns one result per canonical-map node (errorCount=0 for nodes with no
mapped data). Consumed by useProductionLineGlanceData.

See spec docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md
section "Data layer".

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

## Task 3: `useProductionLineGlanceData` in `@variscout/hooks`

The keystone derivation hook. Takes hub + members + their data rows + filter, returns the four slot inputs for `ProductionLineGlanceDashboard`.

**Files:**

- Create: `packages/hooks/src/useProductionLineGlanceData.ts`
- Create: `packages/hooks/src/__tests__/useProductionLineGlanceData.test.ts`
- Modify: `packages/hooks/src/index.ts`

- [ ] **Step 1: Write failing test**

Create `packages/hooks/src/__tests__/useProductionLineGlanceData.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useProductionLineGlanceData } from '../useProductionLineGlanceData';
import type { ProcessHub, ProcessHubInvestigation, DataRow } from '@variscout/core';

const map = {
  version: 1 as const,
  nodes: [
    {
      id: 'n1',
      name: 'Mix',
      type: 'process' as const,
      position: { x: 0, y: 0 },
      ctqColumn: 'mixCpk',
      capabilityScope: {
        measurementColumn: 'mixCpk',
        specRules: [
          { specs: { lsl: 0, usl: 2, target: 1 } }, // default
        ],
      },
    },
    {
      id: 'n2',
      name: 'Fill',
      type: 'process' as const,
      position: { x: 1, y: 0 },
      ctqColumn: 'fillCpk',
      capabilityScope: {
        measurementColumn: 'fillCpk',
        specRules: [{ specs: { lsl: 0, usl: 2, target: 1 } }],
      },
    },
  ],
  tributaries: [],
};

const hub: ProcessHub = {
  id: 'hub-1',
  name: 'Line A',
  canonicalProcessMap: map,
  canonicalMapVersion: '2026-04-28',
  contextColumns: ['product'],
};

function makeMember(opts: {
  id: string;
  rows: DataRow[];
  nodeMappings: Array<{ nodeId: string; measurementColumn: string }>;
}): ProcessHubInvestigation {
  return {
    id: opts.id,
    name: `Inv ${opts.id}`,
    processHubId: 'hub-1',
    metadata: {
      processHubId: 'hub-1',
      nodeMappings: opts.nodeMappings,
      canonicalMapVersion: '2026-04-28',
    },
    rows: opts.rows,
    reviewSignal: { ok: 0, review: 0, alarm: 0 },
  } as ProcessHubInvestigation;
}

describe('useProductionLineGlanceData', () => {
  it('returns all four slot inputs for a hub with one mapped investigation', () => {
    const m = makeMember({
      id: 'i1',
      nodeMappings: [{ nodeId: 'n1', measurementColumn: 'mixCpk' }],
      rows: Array.from({ length: 30 }, (_, i) => ({
        mixCpk: 1.0 + (i % 7) * 0.1,
        product: 'A',
        defect: 'pass',
      })),
    });
    const rowsByInv = new Map([['i1', m.rows ?? []]]);
    const { result } = renderHook(() =>
      useProductionLineGlanceData({
        hub,
        members: [m],
        rowsByInvestigation: rowsByInv,
        contextFilter: {},
      })
    );
    expect(result.current.cpkTrend.data.length).toBeGreaterThan(0);
    expect(result.current.cpkGapTrend.series.length).toBeGreaterThanOrEqual(0);
    expect(result.current.capabilityNodes.length).toBeGreaterThanOrEqual(1);
    expect(result.current.errorSteps.map(s => s.nodeId).sort()).toEqual(['n1', 'n2']);
  });

  it('exposes hub-level context columns in availableContext.hubColumns', () => {
    const m = makeMember({ id: 'i1', nodeMappings: [], rows: [] });
    const { result } = renderHook(() =>
      useProductionLineGlanceData({
        hub,
        members: [m],
        rowsByInvestigation: new Map([['i1', []]]),
        contextFilter: {},
      })
    );
    expect(result.current.availableContext.hubColumns).toEqual(['product']);
  });

  it('populates contextValueOptions from member rows', () => {
    const rows = [
      { mixCpk: 1.2, product: 'Coke 12oz' },
      { mixCpk: 1.4, product: 'Sprite 12oz' },
      { mixCpk: 1.1, product: 'Coke 12oz' },
    ];
    const m = makeMember({
      id: 'i1',
      nodeMappings: [{ nodeId: 'n1', measurementColumn: 'mixCpk' }],
      rows,
    });
    const { result } = renderHook(() =>
      useProductionLineGlanceData({
        hub,
        members: [m],
        rowsByInvestigation: new Map([['i1', rows]]),
        contextFilter: {},
      })
    );
    expect(result.current.contextValueOptions.product).toEqual(['Coke 12oz', 'Sprite 12oz']);
  });

  it('honors contextFilter — capabilityNodes reflect filtered rows', () => {
    const rows = [
      { mixCpk: 1.0, product: 'A' },
      { mixCpk: 1.5, product: 'A' },
      { mixCpk: 0.5, product: 'B' },
      { mixCpk: 0.4, product: 'B' },
    ];
    const m = makeMember({
      id: 'i1',
      nodeMappings: [{ nodeId: 'n1', measurementColumn: 'mixCpk' }],
      rows,
    });
    const { result } = renderHook(() =>
      useProductionLineGlanceData({
        hub,
        members: [m],
        rowsByInvestigation: new Map([['i1', rows]]),
        contextFilter: { product: 'A' },
      })
    );
    const n1 = result.current.capabilityNodes.find(c => c.nodeId === 'n1');
    expect(n1).toBeTruthy();
    // With product=A filter, n=2 → sampleConfidence='insufficient' (n<10)
    expect(n1?.result.n).toBeLessThanOrEqual(2);
  });

  it('returns empty slot inputs for hub with no canonicalProcessMap', () => {
    const noMapHub: ProcessHub = { ...hub, canonicalProcessMap: undefined };
    const { result } = renderHook(() =>
      useProductionLineGlanceData({
        hub: noMapHub,
        members: [],
        rowsByInvestigation: new Map(),
        contextFilter: {},
      })
    );
    expect(result.current.capabilityNodes).toEqual([]);
    expect(result.current.errorSteps).toEqual([]);
  });

  it('errorSteps reflects defect counts when defectColumns provided', () => {
    const rows = [
      { mixCpk: 1.0, defect: 'pass' },
      { mixCpk: 1.0, defect: 'crack' },
      { mixCpk: 1.0, defect: 'crack' },
    ];
    const m = makeMember({
      id: 'i1',
      nodeMappings: [{ nodeId: 'n1', measurementColumn: 'mixCpk' }],
      rows,
    });
    const { result } = renderHook(() =>
      useProductionLineGlanceData({
        hub,
        members: [m],
        rowsByInvestigation: new Map([['i1', rows]]),
        contextFilter: {},
        defectColumns: ['defect'],
      })
    );
    expect(result.current.errorSteps.find(s => s.nodeId === 'n1')?.errorCount).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/hooks test useProductionLineGlanceData`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the hook**

Create `packages/hooks/src/useProductionLineGlanceData.ts`:

```typescript
import { useMemo } from 'react';
import {
  calculateNodeCapability,
  calculateStats,
  distinctContextValues,
  rollupStepErrors,
  type DataRow,
  type IChartDataPoint,
  type NodeCapabilityResult,
  type ProcessHub,
  type ProcessHubInvestigation,
  type SpecLookupContext,
  type StatsResult,
} from '@variscout/core';

export interface UseProductionLineGlanceDataInput {
  hub: ProcessHub;
  members: readonly ProcessHubInvestigation[];
  rowsByInvestigation: ReadonlyMap<string, readonly DataRow[]>;
  contextFilter: SpecLookupContext;
  defectColumns?: readonly string[];
}

export interface CapabilityBoxplotInputNode {
  nodeId: string;
  label: string;
  targetCpk?: number;
  result: NodeCapabilityResult;
}

export interface UseProductionLineGlanceDataResult {
  cpkTrend: {
    data: ReadonlyArray<IChartDataPoint>;
    stats: StatsResult | null;
    specs: { target?: number; usl?: number; lsl?: number };
  };
  cpkGapTrend: {
    series: ReadonlyArray<IChartDataPoint>;
    stats: StatsResult | null;
  };
  capabilityNodes: ReadonlyArray<CapabilityBoxplotInputNode>;
  errorSteps: ReadonlyArray<{ nodeId: string; label: string; errorCount: number }>;
  availableContext: {
    hubColumns: string[];
    tributaryGroups?: Array<{ tributaryLabel: string; columns: string[] }>;
  };
  contextValueOptions: Record<string, string[]>;
}

const EMPTY_RESULT: UseProductionLineGlanceDataResult = {
  cpkTrend: { data: [], stats: null, specs: {} },
  cpkGapTrend: { series: [], stats: null },
  capabilityNodes: [],
  errorSteps: [],
  availableContext: { hubColumns: [], tributaryGroups: [] },
  contextValueOptions: {},
};

function rowMatchesFilter(row: DataRow, filter: SpecLookupContext): boolean {
  for (const [k, v] of Object.entries(filter)) {
    if (v === null || v === undefined) continue;
    const actual = row[k];
    if (actual === undefined || actual === null) return false;
    if (String(actual) !== String(v)) return false;
  }
  return true;
}

export function useProductionLineGlanceData(
  input: UseProductionLineGlanceDataInput
): UseProductionLineGlanceDataResult {
  const { hub, members, rowsByInvestigation, contextFilter, defectColumns } = input;
  const map = hub.canonicalProcessMap;

  const allFilteredRows = useMemo<DataRow[]>(() => {
    const out: DataRow[] = [];
    for (const member of members) {
      if ((member as { processHubId?: string }).processHubId !== hub.id) continue;
      const rows = rowsByInvestigation.get(member.id) ?? [];
      for (const row of rows) {
        if (rowMatchesFilter(row, contextFilter)) out.push(row);
      }
    }
    return out;
  }, [hub.id, members, rowsByInvestigation, contextFilter]);

  const capabilityNodes = useMemo<CapabilityBoxplotInputNode[]>(() => {
    if (!map) return [];
    return map.nodes
      .map(node => {
        if (!node.capabilityScope) return null;
        // Run engine per (member × node) — collect first non-empty
        for (const member of members) {
          if ((member as { processHubId?: string }).processHubId !== hub.id) continue;
          const meta = (member as { metadata?: { nodeMappings?: Array<{ nodeId: string }> } })
            .metadata;
          if (!meta?.nodeMappings?.some(m => m.nodeId === node.id)) continue;
          const rows = rowsByInvestigation.get(member.id) ?? [];
          const filtered = rows.filter(r => rowMatchesFilter(r, contextFilter));
          if (filtered.length === 0) continue;
          const result = calculateNodeCapability(node.id, {
            kind: 'column',
            processMap: map,
            investigationMeta: (member as { metadata: never }).metadata,
            data: filtered,
            hubContextColumns: hub.contextColumns,
          });
          // Find target Cpk from default specRule (first one with no `when`)
          const defaultRule = node.capabilityScope.specRules.find(r => !r.when);
          const targetCpk = defaultRule?.specs.targetCpk;
          return { nodeId: node.id, label: node.name, targetCpk, result };
        }
        return null;
      })
      .filter((n): n is CapabilityBoxplotInputNode => n !== null);
  }, [map, members, rowsByInvestigation, contextFilter, hub.id, hub.contextColumns]);

  const errorSteps = useMemo(() => {
    return rollupStepErrors({
      hub,
      members,
      defectColumns,
      contextFilter,
    });
  }, [hub, members, defectColumns, contextFilter]);

  // cpkTrend: time series of overall Cpk per snapshot. V1 derivation —
  // take the average node-level Cpk per snapshot from the engine's
  // perContextResults, OR fall back to a per-row Cpk-vs-target trend
  // computed from filtered rows. Keep it bounded; full snapshot semantics
  // come in C2 (LayeredProcessView surface).
  const cpkTrend = useMemo(() => {
    const cpks = capabilityNodes
      .map(n => n.result.cpk)
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    if (cpks.length === 0) {
      return { data: [], stats: null, specs: { target: 1.33 } };
    }
    const data: IChartDataPoint[] = cpks.map((y, i) => ({ x: i, y, originalIndex: i }));
    const stats = calculateStats(cpks);
    return { data, stats, specs: { target: 1.33 } };
  }, [capabilityNodes]);

  const cpkGapTrend = useMemo(() => {
    const gaps = capabilityNodes
      .map(n => {
        const cp = n.result.cp;
        const cpk = n.result.cpk;
        if (typeof cp !== 'number' || typeof cpk !== 'number') return undefined;
        return cp - cpk;
      })
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    if (gaps.length === 0) {
      return { series: [], stats: null };
    }
    const series: IChartDataPoint[] = gaps.map((y, i) => ({ x: i, y, originalIndex: i }));
    const stats = calculateStats(gaps);
    return { series, stats };
  }, [capabilityNodes]);

  const availableContext = useMemo(() => {
    const hubColumns = [...(hub.contextColumns ?? [])];
    const tributaryGroups = (map?.tributaries ?? [])
      .filter(t => t.contextColumns && t.contextColumns.length > 0)
      .map(t => ({
        tributaryLabel: t.label ?? t.column,
        columns: [...(t.contextColumns ?? [])],
      }));
    return { hubColumns, tributaryGroups };
  }, [hub.contextColumns, map]);

  const contextValueOptions = useMemo(() => {
    const out: Record<string, string[]> = {};
    const allColumns = new Set<string>([
      ...availableContext.hubColumns,
      ...availableContext.tributaryGroups.flatMap(g => g.columns),
    ]);
    for (const col of allColumns) {
      out[col] = distinctContextValues(allFilteredRows, col);
    }
    return out;
  }, [availableContext, allFilteredRows]);

  if (!map) return EMPTY_RESULT;

  return {
    cpkTrend,
    cpkGapTrend,
    capabilityNodes,
    errorSteps,
    availableContext,
    contextValueOptions,
  };
}
```

NOTE: T3 implementer should verify each engine import resolves at the paths shown — `calculateStats` is from `@variscout/core/stats`, `calculateNodeCapability` from `@variscout/core/stats`, `distinctContextValues` from T1, `rollupStepErrors` from T2. If a re-export is missing from `@variscout/core` root barrel, use the explicit sub-path (`@variscout/core/stats`).

The cpkTrend / cpkGapTrend derivation here is **per-node Cpk indexed by node order, not per-snapshot time series**. Full snapshot-time-series wiring belongs to C2 / Plan D. For C1, this gives the dashboard a populated top row that visualizes node-Cpk distribution as a sequence; the chart is correct in shape and data, just labeled with positional X rather than temporal X. Plan B's component accepts this without modification.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @variscout/hooks test useProductionLineGlanceData`
Expected: PASS — 6/6.

- [ ] **Step 5: Re-export from `packages/hooks/src/index.ts`**

```typescript
export { useProductionLineGlanceData } from './useProductionLineGlanceData';
export type {
  UseProductionLineGlanceDataInput,
  UseProductionLineGlanceDataResult,
  CapabilityBoxplotInputNode,
} from './useProductionLineGlanceData';
```

- [ ] **Step 6: Commit**

```bash
git add packages/hooks/src/useProductionLineGlanceData.ts \
        packages/hooks/src/__tests__/useProductionLineGlanceData.test.ts \
        packages/hooks/src/index.ts
git commit -m "$(cat <<'EOF'
feat(hooks): add useProductionLineGlanceData

Composes the four slot inputs (cpkTrend, cpkGapTrend, capabilityNodes,
errorSteps) plus availableContext and contextValueOptions for
ProductionLineGlanceDashboard. Pure given inputs — no fetching, no I/O.
Filter context narrows row population per slot.

cpkTrend / cpkGapTrend derivation in C1 plots per-node Cpk as a sequence;
full snapshot-time-series wiring belongs to C2.

See spec docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md
section "Data layer".

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

## Task 4: `useProductionLineGlanceFilter` in `@variscout/hooks`

URL-search-param synchronizer for the filter strip's `value` + `onChange`.

**Files:**

- Create: `packages/hooks/src/useProductionLineGlanceFilter.ts`
- Create: `packages/hooks/src/__tests__/useProductionLineGlanceFilter.test.tsx`
- Modify: `packages/hooks/src/index.ts`

- [ ] **Step 1: Read existing URL-state pattern**

Run: `cat packages/hooks/src/useFilterNavigation.ts | head -180`

Match its conventions: read on mount via `URLSearchParams(window.location.search)`, write via `history.replaceState` (not push — filter state is incremental, not a navigation event), debounce or coalesce updates.

- [ ] **Step 2: Write failing test**

Create `packages/hooks/src/__tests__/useProductionLineGlanceFilter.test.tsx`:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProductionLineGlanceFilter } from '../useProductionLineGlanceFilter';

const setLocation = (search: string) => {
  // jsdom allows direct mutation; in modern jsdom we use history.replaceState
  window.history.replaceState(null, '', `/test${search ? `?${search}` : ''}`);
};

describe('useProductionLineGlanceFilter', () => {
  beforeEach(() => setLocation(''));
  afterEach(() => setLocation(''));

  it('returns empty filter when URL has no relevant params', () => {
    const { result } = renderHook(() => useProductionLineGlanceFilter());
    expect(result.current.value).toEqual({});
  });

  it('reads filter values from URL on mount', () => {
    setLocation('product=Coke12oz&supplier=TightCorp');
    const { result } = renderHook(() => useProductionLineGlanceFilter());
    expect(result.current.value).toEqual({
      product: 'Coke12oz',
      supplier: 'TightCorp',
    });
  });

  it('writes filter changes back to URL via replaceState', () => {
    const { result } = renderHook(() => useProductionLineGlanceFilter());
    act(() => result.current.onChange({ product: 'Coke12oz' }));
    expect(window.location.search).toContain('product=Coke12oz');
  });

  it('removes URL params when value is cleared', () => {
    setLocation('product=Coke12oz');
    const { result } = renderHook(() => useProductionLineGlanceFilter());
    act(() => result.current.onChange({}));
    expect(window.location.search).not.toContain('product=');
  });

  it('preserves other URL params (e.g. ?ops=full) untouched', () => {
    setLocation('ops=full&product=Coke12oz');
    const { result } = renderHook(() => useProductionLineGlanceFilter());
    act(() => result.current.onChange({ product: 'Sprite' }));
    expect(window.location.search).toContain('ops=full');
    expect(window.location.search).toContain('product=Sprite');
    expect(window.location.search).not.toContain('Coke12oz');
  });

  it('does not push history entries (uses replaceState)', () => {
    const initialLength = window.history.length;
    const { result } = renderHook(() => useProductionLineGlanceFilter());
    act(() => result.current.onChange({ product: 'A' }));
    act(() => result.current.onChange({ product: 'B' }));
    act(() => result.current.onChange({ product: 'C' }));
    // replaceState shouldn't grow history.length
    expect(window.history.length).toBe(initialLength);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter @variscout/hooks test useProductionLineGlanceFilter`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement the hook**

Create `packages/hooks/src/useProductionLineGlanceFilter.ts`:

```typescript
import { useCallback, useEffect, useState } from 'react';
import type { SpecLookupContext } from '@variscout/core';

/**
 * Reserved (non-filter) URL search params. The hub-level filter must not
 * overwrite these on write-back. Add new entries here as new search-param
 * conventions are introduced (e.g. C2's `ops=full` for progressive reveal).
 */
const RESERVED_PARAMS = new Set<string>(['ops']);

function readFromURL(): SpecLookupContext {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const out: SpecLookupContext = {};
  params.forEach((value, key) => {
    if (RESERVED_PARAMS.has(key)) return;
    out[key] = value;
  });
  return out;
}

function writeToURL(value: SpecLookupContext): void {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  // Remove all non-reserved params first
  const toDelete: string[] = [];
  params.forEach((_, key) => {
    if (!RESERVED_PARAMS.has(key)) toDelete.push(key);
  });
  toDelete.forEach(k => params.delete(k));
  // Then write the new filter values
  for (const [k, v] of Object.entries(value)) {
    if (v === null || v === undefined) continue;
    params.set(k, String(v));
  }
  const next = params.toString();
  const url = `${window.location.pathname}${next ? `?${next}` : ''}${window.location.hash}`;
  window.history.replaceState(null, '', url);
}

export interface UseProductionLineGlanceFilterResult {
  value: SpecLookupContext;
  onChange: (next: SpecLookupContext) => void;
}

/**
 * URL-search-param state for the production-line-glance dashboard's filter
 * strip. Per-hub by virtue of the URL route. Reload-with-URL is the only
 * persistence path (no localStorage); reserved params (e.g. `ops=full`) are
 * preserved on write-back.
 */
export function useProductionLineGlanceFilter(): UseProductionLineGlanceFilterResult {
  const [value, setValue] = useState<SpecLookupContext>(() => readFromURL());

  // Listen for back/forward navigation so the filter syncs.
  useEffect(() => {
    const onPop = () => setValue(readFromURL());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const onChange = useCallback((next: SpecLookupContext) => {
    setValue(next);
    writeToURL(next);
  }, []);

  return { value, onChange };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @variscout/hooks test useProductionLineGlanceFilter`
Expected: PASS — 6/6.

- [ ] **Step 6: Re-export from `packages/hooks/src/index.ts`**

```typescript
export { useProductionLineGlanceFilter } from './useProductionLineGlanceFilter';
export type { UseProductionLineGlanceFilterResult } from './useProductionLineGlanceFilter';
```

- [ ] **Step 7: Commit**

```bash
git add packages/hooks/src/useProductionLineGlanceFilter.ts \
        packages/hooks/src/__tests__/useProductionLineGlanceFilter.test.tsx \
        packages/hooks/src/index.ts
git commit -m "$(cat <<'EOF'
feat(hooks): add useProductionLineGlanceFilter (URL state)

URL-search-param state synchronizer for the production-line-glance
dashboard's filter strip. Reads on mount, writes via replaceState (not
push — filter changes are incremental, not navigation events). Preserves
reserved params (e.g. ops=full for C2 progressive reveal) on write-back.

See spec docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md
section "Filter strip semantics".

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

## Task 5: `useB0InvestigationsInHub` in `@variscout/hooks`

Enumerates unmapped + non-dismissed investigations for the migration banner.

**Files:**

- Create: `packages/hooks/src/useB0InvestigationsInHub.ts`
- Create: `packages/hooks/src/__tests__/useB0InvestigationsInHub.test.ts`
- Modify: `packages/hooks/src/index.ts`

- [ ] **Step 1: Write failing test**

Create `packages/hooks/src/__tests__/useB0InvestigationsInHub.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useB0InvestigationsInHub } from '../useB0InvestigationsInHub';
import type { ProcessHubInvestigation } from '@variscout/core';

function inv(opts: {
  id: string;
  hubId: string;
  nodeMappings: unknown[];
  declined?: string;
}): ProcessHubInvestigation {
  return {
    id: opts.id,
    name: opts.id,
    processHubId: opts.hubId,
    metadata: {
      processHubId: opts.hubId,
      nodeMappings: opts.nodeMappings,
      migrationDeclinedAt: opts.declined,
    } as never,
    rows: [],
    reviewSignal: { ok: 0, review: 0, alarm: 0 },
  } as ProcessHubInvestigation;
}

describe('useB0InvestigationsInHub', () => {
  it('returns investigations with empty nodeMappings', () => {
    const members = [
      inv({ id: 'a', hubId: 'h1', nodeMappings: [] }),
      inv({ id: 'b', hubId: 'h1', nodeMappings: [{ nodeId: 'n1', measurementColumn: 'c' }] }),
    ];
    const { result } = renderHook(() => useB0InvestigationsInHub({ hubId: 'h1', members }));
    expect(result.current.unmapped.map(i => i.id)).toEqual(['a']);
    expect(result.current.count).toBe(1);
  });

  it('excludes investigations with migrationDeclinedAt set', () => {
    const members = [
      inv({ id: 'a', hubId: 'h1', nodeMappings: [], declined: '2026-04-28T10:00:00Z' }),
      inv({ id: 'b', hubId: 'h1', nodeMappings: [] }),
    ];
    const { result } = renderHook(() => useB0InvestigationsInHub({ hubId: 'h1', members }));
    expect(result.current.unmapped.map(i => i.id)).toEqual(['b']);
  });

  it('skips investigations belonging to a different hub', () => {
    const members = [
      inv({ id: 'a', hubId: 'h1', nodeMappings: [] }),
      inv({ id: 'b', hubId: 'h2', nodeMappings: [] }),
    ];
    const { result } = renderHook(() => useB0InvestigationsInHub({ hubId: 'h1', members }));
    expect(result.current.unmapped.map(i => i.id)).toEqual(['a']);
  });

  it('returns empty result for empty members', () => {
    const { result } = renderHook(() => useB0InvestigationsInHub({ hubId: 'h1', members: [] }));
    expect(result.current.count).toBe(0);
    expect(result.current.unmapped).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test, expect fail**

Run: `pnpm --filter @variscout/hooks test useB0InvestigationsInHub`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the hook**

Create `packages/hooks/src/useB0InvestigationsInHub.ts`:

```typescript
import { useMemo } from 'react';
import type { ProcessHubInvestigation } from '@variscout/core';

export interface UseB0InvestigationsInHubInput {
  hubId: string;
  members: readonly ProcessHubInvestigation[];
}

export interface UseB0InvestigationsInHubResult {
  unmapped: readonly ProcessHubInvestigation[];
  count: number;
}

/**
 * Enumerate hub-member investigations that are not yet mapped to canonical
 * map nodes (`nodeMappings` empty/absent) AND have not been dismissed
 * (`migrationDeclinedAt` unset). Drives the migration banner count.
 */
export function useB0InvestigationsInHub(
  input: UseB0InvestigationsInHubInput
): UseB0InvestigationsInHubResult {
  const { hubId, members } = input;
  return useMemo(() => {
    const unmapped = members.filter(m => {
      if ((m as { processHubId?: string }).processHubId !== hubId) return false;
      const meta = (m as { metadata?: { nodeMappings?: unknown[]; migrationDeclinedAt?: string } })
        .metadata;
      if (!meta) return true;
      const mappings = meta.nodeMappings ?? [];
      if (mappings.length > 0) return false;
      if (meta.migrationDeclinedAt) return false;
      return true;
    });
    return { unmapped, count: unmapped.length };
  }, [hubId, members]);
}
```

- [ ] **Step 4: Run test, expect pass**

Run: `pnpm --filter @variscout/hooks test useB0InvestigationsInHub`
Expected: PASS — 4/4.

- [ ] **Step 5: Re-export from `packages/hooks/src/index.ts`**

```typescript
export { useB0InvestigationsInHub } from './useB0InvestigationsInHub';
export type {
  UseB0InvestigationsInHubInput,
  UseB0InvestigationsInHubResult,
} from './useB0InvestigationsInHub';
```

- [ ] **Step 6: Commit**

```bash
git add packages/hooks/src/useB0InvestigationsInHub.ts \
        packages/hooks/src/__tests__/useB0InvestigationsInHub.test.ts \
        packages/hooks/src/index.ts
git commit -m "$(cat <<'EOF'
feat(hooks): add useB0InvestigationsInHub

Enumerates hub-member investigations that are not yet mapped to canonical
map nodes AND have not been dismissed. Drives the migration banner count.

See spec docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md
section "B0 migration UX".

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

## Task 6: `ProductionLineGlanceMigrationBanner` in `@variscout/ui`

Pure presentational banner. Pop-up notification under the page header.

**Files:**

- Create: `packages/ui/src/components/ProductionLineGlanceMigration/ProductionLineGlanceMigrationBanner.tsx`
- Create: `packages/ui/src/components/ProductionLineGlanceMigration/__tests__/ProductionLineGlanceMigrationBanner.test.tsx`

- [ ] **Step 1: Write failing test**

Create `packages/ui/src/components/ProductionLineGlanceMigration/__tests__/ProductionLineGlanceMigrationBanner.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductionLineGlanceMigrationBanner } from '../ProductionLineGlanceMigrationBanner';

describe('ProductionLineGlanceMigrationBanner', () => {
  it('renders count + primary action when count > 0', () => {
    render(
      <ProductionLineGlanceMigrationBanner count={3} onMapClick={vi.fn()} />
    );
    expect(screen.getByText(/3/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /map columns/i })).toBeInTheDocument();
  });

  it('renders nothing when count === 0', () => {
    const { container } = render(
      <ProductionLineGlanceMigrationBanner count={0} onMapClick={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('fires onMapClick when primary action is clicked', () => {
    const onMapClick = vi.fn();
    render(
      <ProductionLineGlanceMigrationBanner count={3} onMapClick={onMapClick} />
    );
    fireEvent.click(screen.getByRole('button', { name: /map columns/i }));
    expect(onMapClick).toHaveBeenCalledOnce();
  });

  it('uses singular wording for count=1', () => {
    render(
      <ProductionLineGlanceMigrationBanner count={1} onMapClick={vi.fn()} />
    );
    expect(screen.getByText(/1 investigation is not yet mapped/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test, expect fail**

Run: `pnpm --filter @variscout/ui test ProductionLineGlanceMigrationBanner`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the banner**

Create `packages/ui/src/components/ProductionLineGlanceMigration/ProductionLineGlanceMigrationBanner.tsx`:

```typescript
/**
 * ProductionLineGlanceMigrationBanner — pure presentational banner.
 *
 * Surfaces unmapped (B0) investigations that won't appear in capability
 * views until mapped. Primary action opens the mapping modal. State
 * (count, dismissals) is owned by the consumer.
 *
 * See spec docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md
 * section "B0 migration UX".
 */
import React from 'react';

export interface ProductionLineGlanceMigrationBannerProps {
  /** Number of unmapped, non-dismissed investigations in this hub. */
  count: number;
  /** Click handler — opens the mapping modal. */
  onMapClick: () => void;
}

export const ProductionLineGlanceMigrationBanner: React.FC<ProductionLineGlanceMigrationBannerProps> = ({
  count,
  onMapClick,
}) => {
  if (count <= 0) return null;
  const isPlural = count !== 1;
  const message = isPlural
    ? `${count} investigations are not yet mapped to canonical map nodes. They won't appear in capability views until mapped.`
    : `1 investigation is not yet mapped to canonical map nodes. It won't appear in capability views until mapped.`;
  return (
    <div
      role="status"
      data-testid="production-line-glance-migration-banner"
      className="flex flex-wrap items-center justify-between gap-3 border-b border-edge bg-surface-secondary px-4 py-3"
    >
      <p className="text-sm text-content">{message}</p>
      <button
        type="button"
        onClick={onMapClick}
        className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
      >
        Map columns
      </button>
    </div>
  );
};

export default ProductionLineGlanceMigrationBanner;
```

- [ ] **Step 4: Run test, expect pass**

Run: `pnpm --filter @variscout/ui test ProductionLineGlanceMigrationBanner`
Expected: PASS — 4/4.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/ProductionLineGlanceMigration/ProductionLineGlanceMigrationBanner.tsx \
        packages/ui/src/components/ProductionLineGlanceMigration/__tests__/ProductionLineGlanceMigrationBanner.test.tsx
git commit -m "$(cat <<'EOF'
feat(ui): add ProductionLineGlanceMigrationBanner

Pure presentational banner for the B0 migration flow. Surfaces unmapped
investigations that won't appear in capability views until mapped.
Primary action opens the mapping modal (consumer-owned state).

See spec docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md
section "B0 migration UX".

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

## Task 7: `ProductionLineGlanceMigrationModal` in `@variscout/ui`

Accordion-style mapping modal. Lists each B0 investigation with its measurement column(s) and `suggestNodeMappings` suggestions.

**Files:**

- Create: `packages/ui/src/components/ProductionLineGlanceMigration/ProductionLineGlanceMigrationModal.tsx`
- Create: `packages/ui/src/components/ProductionLineGlanceMigration/index.ts`
- Create: `packages/ui/src/components/ProductionLineGlanceMigration/__tests__/ProductionLineGlanceMigrationModal.test.tsx`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1: Write failing test**

Create `packages/ui/src/components/ProductionLineGlanceMigration/__tests__/ProductionLineGlanceMigrationModal.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductionLineGlanceMigrationModal } from '../ProductionLineGlanceMigrationModal';
import type { ProductionLineGlanceMigrationModalEntry } from '../ProductionLineGlanceMigrationModal';

const entries: ProductionLineGlanceMigrationModalEntry[] = [
  {
    investigationId: 'i1',
    investigationName: 'Coffee Moisture',
    measurementColumn: 'moisture',
    suggestions: [
      { nodeId: 'n1', label: 'Mix', confidence: 0.92 },
      { nodeId: 'n2', label: 'Fill', confidence: 0.31 },
    ],
  },
  {
    investigationId: 'i2',
    investigationName: 'Mill Hardness',
    measurementColumn: 'hardness',
    suggestions: [{ nodeId: 'n3', label: 'Cast', confidence: 0.81 }],
  },
];

describe('ProductionLineGlanceMigrationModal', () => {
  it('does not render when isOpen=false', () => {
    const { container } = render(
      <ProductionLineGlanceMigrationModal
        isOpen={false}
        entries={entries}
        onSave={vi.fn()}
        onDecline={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders one row per entry', () => {
    render(
      <ProductionLineGlanceMigrationModal
        isOpen
        entries={entries}
        onSave={vi.fn()}
        onDecline={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Coffee Moisture')).toBeInTheDocument();
    expect(screen.getByText('Mill Hardness')).toBeInTheDocument();
  });

  it('shows suggestions for each entry, with the highest-confidence one preselected', () => {
    render(
      <ProductionLineGlanceMigrationModal
        isOpen
        entries={entries}
        onSave={vi.fn()}
        onDecline={vi.fn()}
        onClose={vi.fn()}
      />
    );
    // Highest-confidence suggestion for entry 1 is 'Mix' (0.92).
    const mixOption = screen.getByRole('radio', { name: /Mix/i }) as HTMLInputElement;
    expect(mixOption.checked).toBe(true);
  });

  it('fires onSave with selected node mapping on Save', () => {
    const onSave = vi.fn();
    render(
      <ProductionLineGlanceMigrationModal
        isOpen
        entries={entries}
        onSave={onSave}
        onDecline={vi.fn()}
        onClose={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onSave).toHaveBeenCalledWith([
      { investigationId: 'i1', nodeId: 'n1', measurementColumn: 'moisture' },
      { investigationId: 'i2', nodeId: 'n3', measurementColumn: 'hardness' },
    ]);
  });

  it('fires onDecline with investigationId when a per-row "Skip" is clicked', () => {
    const onDecline = vi.fn();
    render(
      <ProductionLineGlanceMigrationModal
        isOpen
        entries={entries}
        onSave={vi.fn()}
        onDecline={onDecline}
        onClose={vi.fn()}
      />
    );
    const skipButtons = screen.getAllByRole('button', { name: /skip/i });
    fireEvent.click(skipButtons[0]);
    expect(onDecline).toHaveBeenCalledWith('i1');
  });

  it('fires onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <ProductionLineGlanceMigrationModal
        isOpen
        entries={entries}
        onSave={vi.fn()}
        onDecline={vi.fn()}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test, expect fail**

Run: `pnpm --filter @variscout/ui test ProductionLineGlanceMigrationModal`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the modal**

Create `packages/ui/src/components/ProductionLineGlanceMigration/ProductionLineGlanceMigrationModal.tsx`:

```typescript
/**
 * ProductionLineGlanceMigrationModal — accordion-style B0 mapping modal.
 *
 * Lists each unmapped (B0) investigation with its measurement column(s)
 * and suggested node mappings (from suggestNodeMappings in @variscout/core).
 * Per-row Save / Skip / Decline. Pure presentational; consumer owns
 * persistence.
 *
 * See spec docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md
 * section "B0 migration UX".
 */
import React, { useEffect, useState } from 'react';

export interface ProductionLineGlanceMigrationSuggestion {
  nodeId: string;
  label: string;
  confidence: number;
}

export interface ProductionLineGlanceMigrationModalEntry {
  investigationId: string;
  investigationName: string;
  measurementColumn: string;
  suggestions: ReadonlyArray<ProductionLineGlanceMigrationSuggestion>;
}

export interface ProductionLineGlanceMigrationModalProps {
  isOpen: boolean;
  entries: ReadonlyArray<ProductionLineGlanceMigrationModalEntry>;
  onSave: (
    mappings: Array<{ investigationId: string; nodeId: string; measurementColumn: string }>
  ) => void;
  onDecline: (investigationId: string) => void;
  onClose: () => void;
}

function preselectFromSuggestions(
  entries: ReadonlyArray<ProductionLineGlanceMigrationModalEntry>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const e of entries) {
    if (e.suggestions.length === 0) continue;
    const top = [...e.suggestions].sort((a, b) => b.confidence - a.confidence)[0];
    out[e.investigationId] = top.nodeId;
  }
  return out;
}

export const ProductionLineGlanceMigrationModal: React.FC<ProductionLineGlanceMigrationModalProps> = ({
  isOpen,
  entries,
  onSave,
  onDecline,
  onClose,
}) => {
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    preselectFromSuggestions(entries)
  );

  useEffect(() => {
    if (isOpen) setSelected(preselectFromSuggestions(entries));
  }, [isOpen, entries]);

  if (!isOpen) return null;

  const handleSave = () => {
    const mappings = entries
      .filter(e => selected[e.investigationId])
      .map(e => ({
        investigationId: e.investigationId,
        nodeId: selected[e.investigationId],
        measurementColumn: e.measurementColumn,
      }));
    onSave(mappings);
  };

  return (
    <div
      role="dialog"
      aria-label="Map measurement columns to canonical nodes"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-surface shadow-xl">
        <header className="flex items-center justify-between border-b border-edge px-4 py-3">
          <h2 className="text-base font-semibold text-content">
            Map columns to canonical nodes
          </h2>
          <button
            type="button"
            aria-label="close"
            onClick={onClose}
            className="rounded p-1 text-content-secondary hover:bg-surface-tertiary hover:text-content"
          >
            ✕
          </button>
        </header>

        <div className="space-y-4 p-4">
          {entries.map(entry => (
            <section
              key={entry.investigationId}
              data-testid={`migration-row-${entry.investigationId}`}
              className="rounded-md border border-edge bg-surface-secondary p-3"
            >
              <header className="mb-2 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-content">
                    {entry.investigationName}
                  </h3>
                  <p className="text-xs text-content-secondary">
                    Column: <span className="font-mono">{entry.measurementColumn}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onDecline(entry.investigationId)}
                  className="text-xs text-content-secondary hover:text-content"
                >
                  Skip
                </button>
              </header>

              {entry.suggestions.length === 0 ? (
                <p className="text-xs text-content-muted italic">
                  No node-mapping suggestions available.
                </p>
              ) : (
                <ul className="space-y-1">
                  {entry.suggestions.map(s => (
                    <li key={s.nodeId} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`mapping-${entry.investigationId}`}
                        id={`mapping-${entry.investigationId}-${s.nodeId}`}
                        value={s.nodeId}
                        checked={selected[entry.investigationId] === s.nodeId}
                        onChange={() =>
                          setSelected(prev => ({ ...prev, [entry.investigationId]: s.nodeId }))
                        }
                      />
                      <label
                        htmlFor={`mapping-${entry.investigationId}-${s.nodeId}`}
                        className="flex-1 text-sm text-content"
                      >
                        {s.label}
                        <span className="ml-2 text-xs text-content-muted">
                          ({Math.round(s.confidence * 100)}% match)
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-edge px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-3 py-1.5 text-sm text-content-secondary hover:bg-surface-tertiary hover:text-content"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
          >
            Save
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ProductionLineGlanceMigrationModal;
```

- [ ] **Step 4: Run test, expect pass**

Run: `pnpm --filter @variscout/ui test ProductionLineGlanceMigrationModal`
Expected: PASS — 6/6.

- [ ] **Step 5: Create barrel + wire @variscout/ui exports**

Create `packages/ui/src/components/ProductionLineGlanceMigration/index.ts`:

```typescript
export {
  ProductionLineGlanceMigrationBanner,
  default as ProductionLineGlanceMigrationBannerDefault,
} from './ProductionLineGlanceMigrationBanner';
export type { ProductionLineGlanceMigrationBannerProps } from './ProductionLineGlanceMigrationBanner';
export {
  ProductionLineGlanceMigrationModal,
  default as ProductionLineGlanceMigrationModalDefault,
} from './ProductionLineGlanceMigrationModal';
export type {
  ProductionLineGlanceMigrationModalProps,
  ProductionLineGlanceMigrationModalEntry,
  ProductionLineGlanceMigrationSuggestion,
} from './ProductionLineGlanceMigrationModal';
```

In `packages/ui/src/index.ts`, append:

```typescript
export {
  ProductionLineGlanceMigrationBanner,
  ProductionLineGlanceMigrationModal,
} from './components/ProductionLineGlanceMigration';
export type {
  ProductionLineGlanceMigrationBannerProps,
  ProductionLineGlanceMigrationModalProps,
  ProductionLineGlanceMigrationModalEntry,
  ProductionLineGlanceMigrationSuggestion,
} from './components/ProductionLineGlanceMigration';
```

- [ ] **Step 6: Run full UI test suite + typecheck**

```
pnpm --filter @variscout/ui test
pnpm --filter @variscout/ui tsc --noEmit
```

Expect: PASS, no new tsc errors.

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/components/ProductionLineGlanceMigration/ \
        packages/ui/src/index.ts
git commit -m "$(cat <<'EOF'
feat(ui): add ProductionLineGlanceMigrationModal

Accordion-style B0 mapping modal. Lists each unmapped investigation with
its measurement column and suggested node mappings (highest-confidence
preselected). Per-row Save / Skip / Decline. Pure presentational; the
consumer owns persistence.

See spec docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md
section "B0 migration UX".

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

## Task 8: `useHubProvision` in azure-app

App-side selector: read `hub`, `members`, `rowsByInvestigation` from azure-app's data layer (Dexie + Blob). The hook is the bridge between app-store data and `useProductionLineGlanceData`.

**Files:**

- Create: `apps/azure/src/features/processHub/useHubProvision.ts`
- Create: `apps/azure/src/features/processHub/__tests__/useHubProvision.test.ts`
- Create: `apps/azure/src/features/processHub/index.ts`

- [ ] **Step 1: Read existing data-access pattern**

Run: `grep -rn "rollup\|useLiveQuery\|db\\.investigations" apps/azure/src/features/ apps/azure/src/components/ProcessHubReviewPanel.tsx | head -15`

Identify how `ProcessHubReviewPanel` currently receives `rollup: ProcessHubRollup<ProcessHubInvestigation>`. Trace upward to see where the rollup comes from. The implementer's job in T8 is to provide a hook that returns the same `hub`/`members` data plus a `rowsByInvestigation: Map<string, DataRow[]>` map.

If the rollup already contains `rows` per member (per the test fixtures earlier in this plan), then T8's hook just unpacks those and extracts the rows map:

```typescript
const rowsByInvestigation = new Map(rollup.investigations.map(inv => [inv.id, inv.rows ?? []]));
```

If rows are NOT yet on the rollup (separate Dexie tables), T8 fetches them via `useLiveQuery` (a Dexie-React hook used elsewhere in this codebase — verify by `grep`).

- [ ] **Step 2: Write failing test**

Create `apps/azure/src/features/processHub/__tests__/useHubProvision.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHubProvision } from '../useHubProvision';
import type { ProcessHubRollup, ProcessHubInvestigation, ProcessHub } from '@variscout/core';

const hub: ProcessHub = { id: 'h1', name: 'Line A' };
const m1: ProcessHubInvestigation = {
  id: 'i1',
  name: 'I1',
  processHubId: 'h1',
  metadata: { processHubId: 'h1', nodeMappings: [] } as never,
  rows: [{ a: 1 }, { a: 2 }] as never,
  reviewSignal: { ok: 0, review: 0, alarm: 0 },
} as ProcessHubInvestigation;

describe('useHubProvision', () => {
  it('returns hub, members, rowsByInvestigation from rollup', () => {
    const rollup: ProcessHubRollup<ProcessHubInvestigation> = {
      hub,
      investigations: [m1],
    } as ProcessHubRollup<ProcessHubInvestigation>;
    const { result } = renderHook(() => useHubProvision({ rollup }));
    expect(result.current.hub).toBe(hub);
    expect(result.current.members).toEqual([m1]);
    expect(result.current.rowsByInvestigation.get('i1')).toEqual(m1.rows);
  });

  it('returns empty map for rollup with no investigations', () => {
    const rollup: ProcessHubRollup<ProcessHubInvestigation> = {
      hub,
      investigations: [],
    } as ProcessHubRollup<ProcessHubInvestigation>;
    const { result } = renderHook(() => useHubProvision({ rollup }));
    expect(result.current.rowsByInvestigation.size).toBe(0);
  });

  it('handles investigations without rows (treats as empty array)', () => {
    const noRows = { ...m1, rows: undefined } as ProcessHubInvestigation;
    const rollup: ProcessHubRollup<ProcessHubInvestigation> = {
      hub,
      investigations: [noRows],
    } as ProcessHubRollup<ProcessHubInvestigation>;
    const { result } = renderHook(() => useHubProvision({ rollup }));
    expect(result.current.rowsByInvestigation.get('i1')).toEqual([]);
  });
});
```

- [ ] **Step 3: Run test, expect fail**

Run: `pnpm --filter @variscout/azure-app test useHubProvision`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement the hook**

Create `apps/azure/src/features/processHub/useHubProvision.ts`:

```typescript
/**
 * useHubProvision — selects hub + members + rowsByInvestigation from the
 * azure-app data layer (Dexie + Blob).
 *
 * V1 implementation reads from `ProcessHubRollup` which already aggregates
 * the data. Future iterations may wire `useLiveQuery` for streaming Dexie
 * updates if rows are split across tables.
 */
import { useMemo } from 'react';
import type {
  DataRow,
  ProcessHub,
  ProcessHubInvestigation,
  ProcessHubRollup,
} from '@variscout/core';

export interface UseHubProvisionInput {
  rollup: ProcessHubRollup<ProcessHubInvestigation>;
}

export interface UseHubProvisionResult {
  hub: ProcessHub;
  members: readonly ProcessHubInvestigation[];
  rowsByInvestigation: ReadonlyMap<string, readonly DataRow[]>;
}

export function useHubProvision(input: UseHubProvisionInput): UseHubProvisionResult {
  const { rollup } = input;
  return useMemo<UseHubProvisionResult>(() => {
    const rowsByInvestigation = new Map<string, readonly DataRow[]>();
    for (const inv of rollup.investigations) {
      const rows = (inv as { rows?: readonly DataRow[] }).rows ?? [];
      rowsByInvestigation.set(inv.id, rows);
    }
    return {
      hub: rollup.hub,
      members: rollup.investigations,
      rowsByInvestigation,
    };
  }, [rollup]);
}
```

- [ ] **Step 5: Create barrel `index.ts`**

```typescript
export { useHubProvision } from './useHubProvision';
export type { UseHubProvisionInput, UseHubProvisionResult } from './useHubProvision';
```

- [ ] **Step 6: Run test, expect pass**

Run: `pnpm --filter @variscout/azure-app test useHubProvision`
Expected: PASS — 3/3.

- [ ] **Step 7: Commit**

```bash
git add apps/azure/src/features/processHub/
git commit -m "$(cat <<'EOF'
feat(azure): add useHubProvision

App-side selector: projects ProcessHubRollup into hub + members +
rowsByInvestigation. Bridge between azure-app data layer (Dexie + Blob)
and the data-derivation hooks in @variscout/hooks.

V1 reads rows from ProcessHubInvestigation directly. Future iterations
may wire useLiveQuery for streaming Dexie updates.

See spec docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md
section "Fetching boundary — apps".

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

## Task 9: `ProcessHubView` tab container in azure-app

Wraps `ProcessHubReviewPanel` (existing flat layout) and the new `ProcessHubCapabilityTab` (T10) in a tab container with two tabs: "Status" (default) + "Capability".

**Files:**

- Create: `apps/azure/src/components/ProcessHubView.tsx`
- Create: `apps/azure/src/components/__tests__/ProcessHubView.test.tsx`
- Modify: `apps/azure/src/pages/Dashboard.tsx` — replace direct mounts of `<ProcessHubReviewPanel>` with `<ProcessHubView>`.

T10 will fill in the actual `ProcessHubCapabilityTab` content; T9 builds the shell so the tab structure is in place.

- [ ] **Step 1: Write failing test**

Create `apps/azure/src/components/__tests__/ProcessHubView.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProcessHubView } from '../ProcessHubView';
import type { ProcessHubRollup, ProcessHubInvestigation, ProcessHub } from '@variscout/core';

const hub: ProcessHub = { id: 'h1', name: 'Line A' };
const rollup: ProcessHubRollup<ProcessHubInvestigation> = {
  hub,
  investigations: [],
} as ProcessHubRollup<ProcessHubInvestigation>;

describe('ProcessHubView', () => {
  it('renders Status tab as default', () => {
    render(<ProcessHubView rollup={rollup} />);
    expect(screen.getByRole('tab', { name: /status/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('switches to Capability tab on click', () => {
    render(<ProcessHubView rollup={rollup} />);
    fireEvent.click(screen.getByRole('tab', { name: /capability/i }));
    expect(screen.getByRole('tab', { name: /capability/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('renders the existing ProcessHubReviewPanel inside the Status tab', () => {
    render(<ProcessHubView rollup={rollup} />);
    // ProcessHubReviewPanel renders ProcessHubCurrentStatePanel; presence asserts it mounted
    expect(screen.getByTestId('process-hub-status-tab-panel')).toBeInTheDocument();
  });

  it('renders ProcessHubCapabilityTab inside the Capability tab when selected', () => {
    render(<ProcessHubView rollup={rollup} />);
    fireEvent.click(screen.getByRole('tab', { name: /capability/i }));
    expect(screen.getByTestId('process-hub-capability-tab-panel')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test, expect fail**

Run: `pnpm --filter @variscout/azure-app test ProcessHubView`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the tab container**

Create `apps/azure/src/components/ProcessHubView.tsx`:

```typescript
/**
 * ProcessHubView — tab container around ProcessHubReviewPanel.
 *
 * Two tabs: "Status" (the existing flat layout, default) and "Capability"
 * (the production-line-glance dashboard). Plan C1 — see spec
 * docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md.
 */
import React, { useState } from 'react';
import type { ProcessHubInvestigation, ProcessHubRollup } from '@variscout/core';
import ProcessHubReviewPanel from './ProcessHubReviewPanel';
import { ProcessHubCapabilityTab } from './ProcessHubCapabilityTab';

export interface ProcessHubViewProps {
  rollup: ProcessHubRollup<ProcessHubInvestigation>;
}

type TabKey = 'status' | 'capability';

export const ProcessHubView: React.FC<ProcessHubViewProps> = ({ rollup }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('status');

  const tabClass = (key: TabKey) =>
    activeTab === key
      ? 'border-b-2 border-blue-600 px-4 py-2 text-sm font-medium text-content'
      : 'border-b-2 border-transparent px-4 py-2 text-sm text-content-secondary hover:text-content';

  return (
    <div className="flex h-full flex-col">
      <div role="tablist" aria-label="Process Hub view" className="flex border-b border-edge bg-surface">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'status'}
          aria-controls="process-hub-status-tab-panel"
          onClick={() => setActiveTab('status')}
          className={tabClass('status')}
        >
          Status
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'capability'}
          aria-controls="process-hub-capability-tab-panel"
          onClick={() => setActiveTab('capability')}
          className={tabClass('capability')}
        >
          Capability
        </button>
      </div>

      {activeTab === 'status' ? (
        <div
          role="tabpanel"
          id="process-hub-status-tab-panel"
          data-testid="process-hub-status-tab-panel"
          className="flex-1 overflow-y-auto"
        >
          <ProcessHubReviewPanel rollup={rollup} />
        </div>
      ) : (
        <div
          role="tabpanel"
          id="process-hub-capability-tab-panel"
          data-testid="process-hub-capability-tab-panel"
          className="flex-1 overflow-y-auto"
        >
          <ProcessHubCapabilityTab rollup={rollup} />
        </div>
      )}
    </div>
  );
};

export default ProcessHubView;
```

NOTE: `ProcessHubCapabilityTab` is implemented in T10. For T9, create a minimal placeholder version that just renders an empty `<div data-testid="process-hub-capability-tab-panel" />` so this task's tests pass; T10 replaces the placeholder with the real implementation.

To unblock T9 tests, also create `apps/azure/src/components/ProcessHubCapabilityTab.tsx` with this stub:

```typescript
import React from 'react';
import type { ProcessHubInvestigation, ProcessHubRollup } from '@variscout/core';

export interface ProcessHubCapabilityTabProps {
  rollup: ProcessHubRollup<ProcessHubInvestigation>;
}

export const ProcessHubCapabilityTab: React.FC<ProcessHubCapabilityTabProps> = () => {
  return (
    <div className="flex items-center justify-center p-8 text-sm text-content-secondary">
      Capability dashboard wiring lands in T10.
    </div>
  );
};

export default ProcessHubCapabilityTab;
```

- [ ] **Step 4: Run test, expect pass**

Run: `pnpm --filter @variscout/azure-app test ProcessHubView`
Expected: PASS — 4/4.

- [ ] **Step 5: Update `apps/azure/src/pages/Dashboard.tsx`**

Find the existing direct mount of `<ProcessHubReviewPanel rollup={…} />` in `Dashboard.tsx` and replace with `<ProcessHubView rollup={…} />`. Update the import accordingly. Read the file first; the mount is around the section that wraps the rollup-loaded scenario.

- [ ] **Step 6: Run azure tests**

```
pnpm --filter @variscout/azure-app test
```

Expect no regressions. Tests that asserted ProcessHubReviewPanel content still pass because ProcessHubView renders it inside the Status tab (default).

- [ ] **Step 7: Commit**

```bash
git add apps/azure/src/components/ProcessHubView.tsx \
        apps/azure/src/components/ProcessHubCapabilityTab.tsx \
        apps/azure/src/components/__tests__/ProcessHubView.test.tsx \
        apps/azure/src/pages/Dashboard.tsx
git commit -m "$(cat <<'EOF'
feat(azure): wrap ProcessHubReviewPanel in tab container

Adds ProcessHubView with two tabs — Status (default, existing flat layout)
and Capability (placeholder for the production-line-glance dashboard).
Dashboard.tsx now mounts ProcessHubView in place of direct
ProcessHubReviewPanel mounts.

Capability tab content is a placeholder; T10 wires the real dashboard.

See spec docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md
section "Three surfaces / 2. Process Hub view (Capability tab)".

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

## Task 10: Wire dashboard + filter strip into Capability tab

Replace the T9 placeholder with the real dashboard composition.

**Files:**

- Modify: `apps/azure/src/components/ProcessHubCapabilityTab.tsx`
- Create: `apps/azure/src/components/__tests__/ProcessHubCapabilityTab.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `apps/azure/src/components/__tests__/ProcessHubCapabilityTab.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProcessHubCapabilityTab } from '../ProcessHubCapabilityTab';
import type {
  ProcessHubInvestigation,
  ProcessHubRollup,
  ProcessHub,
  DataRow,
} from '@variscout/core';

const map = {
  version: 1 as const,
  nodes: [
    {
      id: 'n1',
      name: 'Mix',
      type: 'process' as const,
      position: { x: 0, y: 0 },
      ctqColumn: 'mixCpk',
      capabilityScope: {
        measurementColumn: 'mixCpk',
        specRules: [{ specs: { lsl: 0, usl: 2, target: 1, targetCpk: 1.33 } }],
      },
    },
  ],
  tributaries: [],
};
const hub: ProcessHub = {
  id: 'h1',
  name: 'Line A',
  canonicalProcessMap: map,
  canonicalMapVersion: '2026-04-28',
  contextColumns: ['product'],
};
const member: ProcessHubInvestigation = {
  id: 'i1',
  name: 'I1',
  processHubId: 'h1',
  metadata: {
    processHubId: 'h1',
    nodeMappings: [{ nodeId: 'n1', measurementColumn: 'mixCpk' }],
    canonicalMapVersion: '2026-04-28',
  } as never,
  rows: Array.from({ length: 30 }, (_, i) => ({
    mixCpk: 1.0 + (i % 7) * 0.1,
    product: i < 15 ? 'Coke' : 'Sprite',
  })) as DataRow[] as never,
  reviewSignal: { ok: 0, review: 0, alarm: 0 },
} as ProcessHubInvestigation;

const rollup: ProcessHubRollup<ProcessHubInvestigation> = {
  hub,
  investigations: [member],
} as ProcessHubRollup<ProcessHubInvestigation>;

describe('ProcessHubCapabilityTab', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/test');
  });

  it('renders the dashboard with Mix node visible', () => {
    render(<ProcessHubCapabilityTab rollup={rollup} />);
    expect(screen.getByText('Mix')).toBeInTheDocument();
  });

  it('renders the filter strip with hub-level chips populated from data', () => {
    render(<ProcessHubCapabilityTab rollup={rollup} />);
    expect(screen.getByText('product')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Coke/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sprite/ })).toBeInTheDocument();
  });

  it('renders empty-state hint when no mapped investigations', () => {
    const emptyRollup: ProcessHubRollup<ProcessHubInvestigation> = {
      hub,
      investigations: [],
    } as ProcessHubRollup<ProcessHubInvestigation>;
    render(<ProcessHubCapabilityTab rollup={emptyRollup} />);
    expect(screen.getByText(/no mapped/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test, expect fail (placeholder still there)**

Run: `pnpm --filter @variscout/azure-app test ProcessHubCapabilityTab`
Expected: FAIL — assertions don't match the placeholder content.

- [ ] **Step 3: Replace the placeholder with real implementation**

Replace `apps/azure/src/components/ProcessHubCapabilityTab.tsx` with:

```typescript
/**
 * ProcessHubCapabilityTab — Process Hub view's Capability tab content.
 *
 * Composes the production-line-glance dashboard (full 2×2) with its filter
 * strip, scoped to the hub's data via useHubProvision +
 * useProductionLineGlanceData + useProductionLineGlanceFilter.
 *
 * Migration banner + modal are wired in T11 (separate file: hub-level
 * composition).
 *
 * See spec docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md.
 */
import React from 'react';
import {
  ProductionLineGlanceDashboard,
  ProductionLineGlanceFilterStrip,
} from '@variscout/ui';
import {
  useProductionLineGlanceData,
  useProductionLineGlanceFilter,
} from '@variscout/hooks';
import { useHubProvision } from '../features/processHub';
import type {
  ProcessHubInvestigation,
  ProcessHubRollup,
} from '@variscout/core';

export interface ProcessHubCapabilityTabProps {
  rollup: ProcessHubRollup<ProcessHubInvestigation>;
}

export const ProcessHubCapabilityTab: React.FC<ProcessHubCapabilityTabProps> = ({
  rollup,
}) => {
  const provision = useHubProvision({ rollup });
  const filter = useProductionLineGlanceFilter();
  const data = useProductionLineGlanceData({
    hub: provision.hub,
    members: provision.members,
    rowsByInvestigation: provision.rowsByInvestigation,
    contextFilter: filter.value,
  });

  return (
    <div className="flex h-full flex-col">
      <ProductionLineGlanceFilterStrip
        availableContext={data.availableContext}
        contextValueOptions={data.contextValueOptions}
        value={filter.value}
        onChange={filter.onChange}
      />
      <div className="flex-1 min-h-0">
        <ProductionLineGlanceDashboard
          cpkTrend={data.cpkTrend}
          cpkGapTrend={data.cpkGapTrend}
          capabilityNodes={data.capabilityNodes}
          errorSteps={data.errorSteps}
        />
      </div>
    </div>
  );
};

export default ProcessHubCapabilityTab;
```

- [ ] **Step 4: Run tests, expect pass**

Run: `pnpm --filter @variscout/azure-app test ProcessHubCapabilityTab`
Expected: PASS — 3/3.

The test relies on real chart components rendering; if visx ResizeObserver issues surface, copy the `beforeAll`/`afterAll` polyfill block from `packages/ui/src/components/ProductionLineGlanceDashboard/__tests__/integration.test.tsx` into the test file.

- [ ] **Step 5: Run full azure tests**

Run: `pnpm --filter @variscout/azure-app test`
Expect no regressions.

- [ ] **Step 6: Commit**

```bash
git add apps/azure/src/components/ProcessHubCapabilityTab.tsx \
        apps/azure/src/components/__tests__/ProcessHubCapabilityTab.test.tsx
git commit -m "$(cat <<'EOF'
feat(azure): wire ProductionLineGlanceDashboard into Process Hub Capability tab

Composes the full 2x2 dashboard with its filter strip, scoped to the hub's
data via useHubProvision + useProductionLineGlanceData +
useProductionLineGlanceFilter. URL-persisted filter state via
useProductionLineGlanceFilter.

Migration banner + modal wiring lands in T11 at hub-page level.

See spec docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md
section "Three surfaces / 2. Process Hub view (Capability tab)".

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

## Task 11: Wire migration banner + modal at hub level

Adds the banner above the Hub view and the modal as overlay; persists `migrationDeclinedAt` and `nodeMappings` updates back to the hub data layer.

**Files:**

- Modify: `apps/azure/src/components/ProcessHubView.tsx` (add banner + modal at the top)
- Create: `apps/azure/src/features/processHub/useHubMigrationState.ts`
- Create: `apps/azure/src/features/processHub/__tests__/useHubMigrationState.test.ts`

- [ ] **Step 1: Read the existing investigation persistence path**

Run: `grep -rn "updateInvestigation\|saveInvestigation\|investigations.put" apps/azure/src/db apps/azure/src/services apps/azure/src/features/investigation 2>/dev/null | head -10`

Identify the function that persists investigation metadata changes (e.g., `db.investigations.put(...)` or a service method). T11's hook calls this after the user saves mappings or skips an investigation.

- [ ] **Step 2: Write failing test for `useHubMigrationState`**

Create `apps/azure/src/features/processHub/__tests__/useHubMigrationState.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHubMigrationState } from '../useHubMigrationState';
import type { ProcessHubInvestigation } from '@variscout/core';

const member = (id: string, mapping: unknown[] = [], declined?: string): ProcessHubInvestigation =>
  ({
    id,
    name: id,
    processHubId: 'h1',
    metadata: { processHubId: 'h1', nodeMappings: mapping, migrationDeclinedAt: declined } as never,
    rows: [],
    reviewSignal: { ok: 0, review: 0, alarm: 0 },
  }) as ProcessHubInvestigation;

describe('useHubMigrationState', () => {
  it('isModalOpen toggles via openModal / closeModal', () => {
    const { result } = renderHook(() =>
      useHubMigrationState({ hubId: 'h1', members: [member('a')], persistInvestigation: vi.fn() })
    );
    expect(result.current.isModalOpen).toBe(false);
    act(() => result.current.openModal());
    expect(result.current.isModalOpen).toBe(true);
    act(() => result.current.closeModal());
    expect(result.current.isModalOpen).toBe(false);
  });

  it('count reflects unmapped + non-dismissed', () => {
    const { result } = renderHook(() =>
      useHubMigrationState({
        hubId: 'h1',
        members: [member('a'), member('b', [], '2026-04-28T10:00:00Z'), member('c', [{ x: 1 }])],
        persistInvestigation: vi.fn(),
      })
    );
    expect(result.current.count).toBe(1);
  });

  it('handleSave calls persistInvestigation with merged nodeMappings per row', () => {
    const persist = vi.fn();
    const { result } = renderHook(() =>
      useHubMigrationState({
        hubId: 'h1',
        members: [member('a'), member('b')],
        persistInvestigation: persist,
      })
    );
    act(() =>
      result.current.handleSave([
        { investigationId: 'a', nodeId: 'n1', measurementColumn: 'mix' },
        { investigationId: 'b', nodeId: 'n2', measurementColumn: 'fill' },
      ])
    );
    expect(persist).toHaveBeenCalledTimes(2);
    expect(persist).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'a',
        metadata: expect.objectContaining({
          nodeMappings: [{ nodeId: 'n1', measurementColumn: 'mix' }],
        }),
      })
    );
  });

  it('handleDecline persists migrationDeclinedAt for a single investigation', () => {
    const persist = vi.fn();
    const { result } = renderHook(() =>
      useHubMigrationState({
        hubId: 'h1',
        members: [member('a')],
        persistInvestigation: persist,
      })
    );
    act(() => result.current.handleDecline('a'));
    expect(persist).toHaveBeenCalledOnce();
    expect(persist.mock.calls[0][0]).toMatchObject({
      id: 'a',
      metadata: expect.objectContaining({ migrationDeclinedAt: expect.any(String) }),
    });
  });
});
```

- [ ] **Step 3: Run test, expect fail**

Run: `pnpm --filter @variscout/azure-app test useHubMigrationState`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement the hook**

Create `apps/azure/src/features/processHub/useHubMigrationState.ts`:

```typescript
import { useCallback, useState } from 'react';
import { useB0InvestigationsInHub, type UseB0InvestigationsInHubResult } from '@variscout/hooks';
import {
  suggestNodeMappings,
  type ProcessHubInvestigation,
  type ProcessHubInvestigationMetadata,
  type ProcessMap,
} from '@variscout/core';
import type { ProductionLineGlanceMigrationModalEntry } from '@variscout/ui';

export interface UseHubMigrationStateInput {
  hubId: string;
  members: readonly ProcessHubInvestigation[];
  /** Optional canonical map for suggestion-engine seeding. */
  canonicalMap?: ProcessMap;
  /** Persist updated investigation back to the data layer. */
  persistInvestigation: (next: ProcessHubInvestigation) => void;
}

export interface UseHubMigrationStateResult extends UseB0InvestigationsInHubResult {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  modalEntries: ReadonlyArray<ProductionLineGlanceMigrationModalEntry>;
  handleSave: (
    mappings: ReadonlyArray<{ investigationId: string; nodeId: string; measurementColumn: string }>
  ) => void;
  handleDecline: (investigationId: string) => void;
}

export function useHubMigrationState(input: UseHubMigrationStateInput): UseHubMigrationStateResult {
  const { hubId, members, canonicalMap, persistInvestigation } = input;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const b0 = useB0InvestigationsInHub({ hubId, members });

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const modalEntries = b0.unmapped.map<ProductionLineGlanceMigrationModalEntry>(inv => {
    const meta = (inv as { metadata?: ProcessHubInvestigationMetadata }).metadata;
    const measurementColumn = meta?.legacyMeasurementColumn ?? '';
    const suggestions = canonicalMap
      ? (suggestNodeMappings({ canonicalMap, measurementColumn }) ?? [])
      : [];
    return {
      investigationId: inv.id,
      investigationName: inv.name,
      measurementColumn,
      suggestions: suggestions.map(s => ({
        nodeId: s.nodeId,
        label: s.label,
        confidence: s.confidence,
      })),
    };
  });

  const handleSave = useCallback(
    (
      mappings: ReadonlyArray<{
        investigationId: string;
        nodeId: string;
        measurementColumn: string;
      }>
    ) => {
      const byId = new Map(mappings.map(m => [m.investigationId, m]));
      for (const inv of members) {
        const m = byId.get(inv.id);
        if (!m) continue;
        const next: ProcessHubInvestigation = {
          ...inv,
          metadata: {
            ...((inv as { metadata?: ProcessHubInvestigationMetadata }).metadata ?? {}),
            processHubId: hubId,
            nodeMappings: [{ nodeId: m.nodeId, measurementColumn: m.measurementColumn }],
          } as ProcessHubInvestigationMetadata,
        };
        persistInvestigation(next);
      }
      setIsModalOpen(false);
    },
    [hubId, members, persistInvestigation]
  );

  const handleDecline = useCallback(
    (investigationId: string) => {
      const inv = members.find(m => m.id === investigationId);
      if (!inv) return;
      const next: ProcessHubInvestigation = {
        ...inv,
        metadata: {
          ...((inv as { metadata?: ProcessHubInvestigationMetadata }).metadata ?? {}),
          processHubId: hubId,
          migrationDeclinedAt: new Date().toISOString(),
        } as ProcessHubInvestigationMetadata,
      };
      persistInvestigation(next);
    },
    [hubId, members, persistInvestigation]
  );

  return {
    ...b0,
    isModalOpen,
    openModal,
    closeModal,
    modalEntries,
    handleSave,
    handleDecline,
  };
}
```

NOTE: T11 implementer should verify (a) `suggestNodeMappings` actual signature in `packages/core/src/stats/nodeCapabilityMigration.ts` — adjust the call accordingly; (b) `legacyMeasurementColumn` field name on `ProcessHubInvestigationMetadata` — fall back to `inv.measurementColumn` or whatever the existing field is. The test fixture above uses `''` for the unmapped case; that's fine for V1 as long as the modal UX shows "(none detected)" gracefully (the modal already does this when `entries[i].suggestions.length === 0`).

- [ ] **Step 5: Run test, expect pass**

Run: `pnpm --filter @variscout/azure-app test useHubMigrationState`
Expected: PASS — 4/4.

- [ ] **Step 6: Wire banner + modal into ProcessHubView**

Modify `apps/azure/src/components/ProcessHubView.tsx`:

```typescript
import React, { useState, useCallback } from 'react';
import type { ProcessHubInvestigation, ProcessHubRollup } from '@variscout/core';
import {
  ProductionLineGlanceMigrationBanner,
  ProductionLineGlanceMigrationModal,
} from '@variscout/ui';
import ProcessHubReviewPanel from './ProcessHubReviewPanel';
import { ProcessHubCapabilityTab } from './ProcessHubCapabilityTab';
import { useHubMigrationState } from '../features/processHub/useHubMigrationState';

export interface ProcessHubViewProps {
  rollup: ProcessHubRollup<ProcessHubInvestigation>;
  /** Persist a mutated investigation to the data layer. */
  persistInvestigation?: (next: ProcessHubInvestigation) => void;
}

type TabKey = 'status' | 'capability';

export const ProcessHubView: React.FC<ProcessHubViewProps> = ({
  rollup,
  persistInvestigation,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('status');

  const noopPersist = useCallback(() => {
    /* no-op when persistInvestigation prop is omitted (e.g. read-only contexts) */
  }, []);

  const migration = useHubMigrationState({
    hubId: rollup.hub.id,
    members: rollup.investigations,
    canonicalMap: rollup.hub.canonicalProcessMap,
    persistInvestigation: persistInvestigation ?? noopPersist,
  });

  // ...remaining JSX from T9, plus migration banner + modal at top:
  return (
    <div className="flex h-full flex-col">
      <ProductionLineGlanceMigrationBanner
        count={migration.count}
        onMapClick={migration.openModal}
      />
      <ProductionLineGlanceMigrationModal
        isOpen={migration.isModalOpen}
        entries={migration.modalEntries}
        onSave={migration.handleSave}
        onDecline={migration.handleDecline}
        onClose={migration.closeModal}
      />
      {/* ...tablist + tabpanels from T9 unchanged... */}
    </div>
  );
};

export default ProcessHubView;
```

The original T9 tablist + tabpanels JSX continues below the banner/modal lines.

- [ ] **Step 7: Update Dashboard.tsx to pass `persistInvestigation`**

In `apps/azure/src/pages/Dashboard.tsx`, find where `ProcessHubView` is mounted and pass a `persistInvestigation` prop hooked into the existing investigation-update path (Dexie `db.investigations.put` or service-layer wrapper, per Step 1).

If the persistence path is more involved than a single function (e.g., requires triggering Blob sync), wire it as a callback that delegates appropriately. Don't reinvent persistence; reuse the existing path.

- [ ] **Step 8: Run all azure tests**

```
pnpm --filter @variscout/azure-app test
```

Update T9's `ProcessHubView.test.tsx` fixtures if needed — the new banner is in the DOM but with `count=0` (no B0 in those fixtures), so it renders nothing. T9 tests should still pass.

- [ ] **Step 9: Commit**

```bash
git add apps/azure/src/features/processHub/useHubMigrationState.ts \
        apps/azure/src/features/processHub/__tests__/useHubMigrationState.test.ts \
        apps/azure/src/features/processHub/index.ts \
        apps/azure/src/components/ProcessHubView.tsx \
        apps/azure/src/pages/Dashboard.tsx
git commit -m "$(cat <<'EOF'
feat(azure): wire B0 migration banner + modal at Hub view level

ProcessHubView now hosts the migration banner above its tablist and the
modal as a portal-style overlay. useHubMigrationState glues the @variscout/hooks
B0 enumerator to the modal entries (with suggestNodeMappings suggestions)
and to persistence callbacks for save / decline.

Dashboard.tsx forwards a persistInvestigation prop hooked into the existing
investigation-update path.

See spec docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md
section "B0 migration UX".

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

## Task 12: Workspace verification + chrome walk

End-to-end gates + the deferred Plan B T3 visual validation.

- [ ] **Step 1: Run full workspace tests**

```
pnpm test
```

Expect: 9/9 turbo tasks green.

If any package regresses, diagnose. Pre-existing failures (per `feedback_doc_validation_hooks.md` — frontmatter warnings, etc.) are non-blocking.

- [ ] **Step 2: Run full workspace build**

```
pnpm build
```

Expect: package builds green. The known pre-existing `@variscout/docs` build failure (unrelated to Plan C; documented as not-introduced-by-this-PR in PR description) does not block.

- [ ] **Step 3: Run pr-ready-check**

```
bash scripts/pr-ready-check.sh
```

Expect: green.

- [ ] **Step 4: Chrome walk (closes Plan B T3 deferred + validates C1 surface)**

Per `feedback_verify_before_push.md` — visual validation is required before push for UI changes.

Procedure:

1. Start dev server: `pnpm --filter @variscout/azure-app dev`. Note the localhost URL.
2. Use `claude --chrome` to open the dashboard route.
3. Seed a hub with the existing showcase investigation (or use a real hub if available). The showcase fixtures in `packages/core/src/__tests__/fixtures/` may have one.
4. Navigate to the Process Hub view. Click the **Capability** tab.
5. Visually verify:
   - All four chart slots render (top-left IChart, top-right Δ-trend, bottom-left CapabilityBoxplot, bottom-right StepErrorPareto).
   - **Plan B T3 carry-over**: per-node target ticks in the CapabilityBoxplot align with the box columns visually (ticks span the box width, sit at the targetCpk Y-coordinate).
   - n-confidence badges appear on boxes with `n<30` and look proportionate (small, near the X-axis).
   - The filter strip renders at the top with chips populated from the data.
   - Click a chip → URL updates with `?product=<value>`; charts re-render with filtered data.
   - Click again → chip clears, URL param removed.
6. If a B0 investigation exists in the hub: verify the migration banner appears above the tablist with the correct count. Click "Map columns" → modal opens with one row per B0 investigation, suggestions visible, Save/Skip available.
7. Capture before/after screenshots of (a) Capability tab populated, (b) filter active, (c) migration banner + modal.

If any visual issue surfaces (target ticks misaligned, badges off-position, filter strip overflow), file a follow-up commit on the same branch. Do not merge with known visual regressions.

- [ ] **Step 5: Commit any chrome-walk fixes** (if needed) + capture findings in PR description.

---

## Task 13: PR + final code review + merge

- [ ] **Step 1: Push branch**

```bash
git push -u origin feat/plan-c1-data-and-hub-capability-tab
```

- [ ] **Step 2: Open PR**

```bash
gh pr create --title "feat: Plan C1 data layer + Process Hub Capability tab" --body "$(cat <<'EOF'
## Summary

- Pure derivation utilities in @variscout/core/stats (`distinctContextValues`, `rollupStepErrors`).
- Three derivation hooks in @variscout/hooks (`useProductionLineGlanceData`, `useProductionLineGlanceFilter`, `useB0InvestigationsInHub`).
- Two presentational components in @variscout/ui (`ProductionLineGlanceMigrationBanner`, `ProductionLineGlanceMigrationModal`).
- New "Capability" tab in the Process Hub view (azure-app), composing the Plan B dashboard with URL-persisted filter state.
- B0 migration banner + accordion-style mapping modal wired to azure-app data layer.
- Closes Plan B T3 deferred chrome-walk visual validation of CapabilityBoxplot overlay alignment.

Plan C1 is the first of three sub-plans for the surface-wiring design at `docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md`. C2 (LayeredProcessView Operations band with progressive reveal) and C3 (FRAME workspace right-hand drawer) follow.

## Test plan

- [ ] `pnpm --filter @variscout/core test` green
- [ ] `pnpm --filter @variscout/hooks test` green
- [ ] `pnpm --filter @variscout/ui test` green
- [ ] `pnpm --filter @variscout/azure-app test` green
- [ ] `pnpm test` workspace-wide green
- [ ] `pnpm build` workspace-wide green (pre-existing `@variscout/docs` failure documented and not introduced by this PR)
- [ ] `bash scripts/pr-ready-check.sh` green
- [ ] Chrome walk: filter, target ticks, n-badges, B0 banner + modal — all verified
- [ ] Independent code review from feature-dev:code-reviewer subagent

## Spec

`docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md` — sections "Data layer", "Three surfaces / 2. Process Hub view (Capability tab)", "B0 migration UX".

🤖 Generated with [ruflo](https://github.com/ruvnet/ruflo)
EOF
)"
```

- [ ] **Step 3: Dispatch final code-reviewer subagent**

Per `feedback_subagent_driven_default.md`, run a `feature-dev:code-reviewer` subagent against the full PR. Focus areas:

- Watson aggregation safety: no new arithmetic across investigations or hubs (grep `meanCapability|aggregateCpk|sumCpk|portfolioCpk|combineCpk` returns zero hits).
- Hard rules: no hex literals; no manual `React.memo()`; props named `{ComponentName}Props`; semantic Tailwind tokens in UI components; no `Math.random`; no `as never` / `as unknown` masking real type issues.
- Dependency flow: `core → hooks → ui → apps`. No upward leaks.
- Test discipline: `vi.mock()` BEFORE component imports; deterministic data; tests verify behavior not mock behavior.
- Spec coverage: each spec section maps to a task that implements it (data layer, filter strip, B0 migration, Capability tab — all covered; LayeredProcessView and FRAME are explicitly out of scope for C1).
- API stability for downstream sub-plans: the contracts that C2 and C3 will consume (the dashboard's `mode` prop, the data hooks' input/output shapes) should be stable, not provisional.
- No `--no-verify` evidence; pre-commit hooks ran on each commit.

- [ ] **Step 4: Address review findings** in follow-up commits (per `feedback_bundle_followups_pre_merge.md`).

- [ ] **Step 5: Verify drift before merge**

`git fetch && git log HEAD..origin/main` — if ≥10 commits drift, merge `main` first.

- [ ] **Step 6: Squash-merge**

```bash
gh pr merge --squash --delete-branch
```

Don't `--admin` unless an emergency.

---

## Self-review (run before claiming the plan is complete)

**Spec coverage check (from `docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md`):**

- ✅ "Data layer / Pure derivation utilities" — Tasks 1, 2.
- ✅ "Data layer / React derivation hooks" — Tasks 3, 4, 5.
- ✅ "Data layer / Fetching boundary — apps" — Task 8.
- ✅ "Filter strip semantics / URL state" — Task 4.
- ✅ "B0 migration UX / Banner + modal" — Tasks 6, 7, 11.
- ✅ "Three surfaces / 2. Process Hub view (Capability tab)" — Tasks 9, 10.
- ⚠️ "The dashboard's three forms / mode='spatial' | 'full'" — DEFERRED to C2 (only `mode='full'` is exercised in C1).
- ⚠️ "Three surfaces / 1. LayeredProcessView Operations band" — DEFERRED to C2.
- ⚠️ "Three surfaces / 3. FRAME workspace right-hand drawer" — DEFERRED to C3.
- ⚠️ "Performance mode coexistence / drill from step → investigation editor" — wiring is left to C2 (when LayeredProcessView's click-to-step is implemented). C1 ships the Capability tab without click-drill; the StepErrorPareto's `onStepClick` prop is ready and unconnected at the dashboard level.

No spec gaps within C1's stated scope.

**Placeholder scan:** No `TODO`/`TBD`/"implement later"/"add appropriate handling" without code. Each task shows the full code or command.

**Type consistency:**

- `SpecLookupContext` — imported from `@variscout/core/types` in T4 hook, `@variscout/core` root in T3 fixture. Both paths resolve to the same type. Consistent with Plan B's prior usage.
- `ProcessHubInvestigation`, `ProcessHubRollup`, `ProcessHub` — imported from `@variscout/core` root barrel throughout.
- `CapabilityBoxplotInputNode` (T3 export) shape matches Plan B's `CapabilityBoxplotNode`. Consumer assignment in T10 (`capabilityNodes={data.capabilityNodes}`) requires the structural match — verify by running tsc.
- `StepErrorRollupResult` shape (T2) is a structural match for Plan B's `StepErrorParetoStep` (`{ nodeId, label, errorCount, errorCategories? }`). T2's result omits `errorCategories` (V1 doesn't compute breakdown); the optional field stays absent, structurally compatible.

**Risk reminders:**

- Verify `suggestNodeMappings` signature (T11) before relying on the assumed shape; the engine plan (PR #103) shipped it, but the exact return shape may differ from the modal's expected `{ nodeId, label, confidence }`.
- The `useHubProvision` hook assumes rows are on the rollup's investigations; if azure-app reads rows from a separate Dexie table, T8 implementer must wire `useLiveQuery` instead.
- The Dashboard.tsx mount change (T9 step 5, T11 step 7) needs to preserve other Dashboard.tsx behaviors. Read the file in full before editing.
- visx `ResizeObserver` polyfill (T10 step 4 fallback) — if the integration-style ProcessHubCapabilityTab tests need it, copy the pattern from Plan B's integration test, do NOT modify the global `test/setup.ts`.
- Don't use `--no-verify` per `feedback_subagent_no_verify.md`.
- `git log HEAD..origin/main` before push (`feedback_branch_staleness_guardrails.md`).
