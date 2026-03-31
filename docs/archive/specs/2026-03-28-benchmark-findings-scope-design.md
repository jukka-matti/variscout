---
title: 'Phase 3: Benchmark Finding + Findings as Project Scope'
---

# Phase 3: Benchmark Finding + Findings as Project Scope

**Date:** 2026-03-28
**Status:** Design approved
**Parent spec:** `2026-03-28-process-health-projection-toolbar-design.md` (Phase 3)
**Depends on:** Phase 2 (Projection Engine) — implemented

## Problem

Phase 2 delivers complement-based projection ("if this subset matched everything else"). But the complement is just the average of remaining data — not necessarily good. Analysts need to:

1. Pin an aspirational target from the best-performing subset they discover during drill-down
2. Define which findings constitute the improvement project scope
3. See cumulative projection from all scoped findings in the toolbar

## Design

### 1. Types & Data Model

Extend `Finding` in `packages/core/src/findings/types.ts`:

```typescript
export type FindingRole = 'observation' | 'benchmark';

export interface BenchmarkStats {
  mean: number;
  stdDev: number;
  cpk?: number;
  count: number;
}

// On Finding interface:
role?: FindingRole;           // default: 'observation'
benchmarkStats?: BenchmarkStats; // snapshot when pinned as benchmark
scoped?: boolean;             // explicit scope override (undefined = auto from status)
```

Extend `AnalysisState` in `packages/hooks/src/types.ts`:

```typescript
benchmarkFindingId?: string;  // ID of the active benchmark finding
```

One benchmark per project. Pinning a new benchmark clears the previous one.

### 2. Scope Resolution

Pure function in `@variscout/core/findings`:

```typescript
function isFindingScoped(finding: Finding): boolean {
  if (finding.scoped !== undefined) return finding.scoped;
  return finding.status === 'investigating' || finding.status === 'analyzed';
}

function getScopedFindings(findings: Finding[]): Finding[] {
  return findings.filter(f => f.role !== 'benchmark' && isFindingScoped(f));
}
```

Auto-scope: findings in `investigating` or `analyzed` status are automatically in scope. Manual override: `scoped: true` forces in (e.g., an `observed` finding the analyst wants to include), `scoped: false` forces out (e.g., an `analyzed` finding the analyst wants to exclude from the project).

Benchmark findings are never included in scope — they define the target, not a fixable subset.

### 3. Projection Engine

New function in `packages/core/src/variation/projection.ts`:

**`computeBenchmarkProjection(subsetStats, benchmarkStats, complementStats, specs, benchmarkLabel)`**

- Uses `simulateOverallImpact()` with `projectedSubsetStats = benchmarkStats` (instead of complement)
- Answers: "If all subsets performed like the benchmark → Cpk X"
- Returns `ProcessProjection` with label `"benchmark: {benchmarkLabel}"`

**Priority update in `useProcessProjection`:**

```
activeProjection priority:
  1. cumulative (2+ scoped findings) — uses benchmark stats as target when available
  2. benchmark projection (benchmark pinned, drilling)
  3. drill complement ("if fixed") — existing Phase 2 behavior
  4. null → centering opportunity shown separately
```

When a benchmark is set AND there are scoped findings, cumulative projection uses benchmark stats as the "fix" target instead of complement stats.

### 4. useFindings Hook Extensions

Add to `packages/hooks/src/useFindings.ts`:

- `setBenchmark(id: string, benchmarkStats: BenchmarkStats)` — sets `role: 'benchmark'`, captures stats snapshot, clears previous benchmark finding's role
- `clearBenchmark(id: string)` — reverts `role` to `'observation'`, removes `benchmarkStats`
- `toggleScope(id: string)` — cycles: `undefined` (auto) → `true` (forced in) → `false` (forced out) → `undefined`

### 5. Toolbar Display States

| Context                  | Display                                         | Color |
| ------------------------ | ----------------------------------------------- | ----- |
| No drill, no benchmark   | `Cpk 0.26 /1.33 → Cp 1.01 by centering`         | amber |
| No drill, benchmark set  | `Cpk 0.26 /1.33 → 1.85 (benchmark: Bed A, AM)`  | green |
| Drilling, no benchmark   | `Cpk -1.15 /1.33 → 1.25 if fixed`               | green |
| Drilling, benchmark set  | `Cpk -1.15 /1.33 → 1.85 (benchmark: Bed A, AM)` | green |
| Multiple findings scoped | `Cpk 0.26 /1.33 → 1.62 (3 scoped)`              | green |
| Scoped + benchmark       | `Cpk 0.26 /1.33 → 1.62 (3 scoped, benchmark)`   | green |

### 6. UI: Pin as Benchmark

**Toolbar pin button** (existing "Pin as finding"):

- Currently creates an observation finding from current filter state on click
- Extended: click still pins as observation (no behavior change). A small dropdown chevron next to the pin icon opens a menu:
  - **Pin as observation** (default, existing behavior)
  - **Pin as benchmark** — creates finding with `role: 'benchmark'`, captures current stats as `benchmarkStats`
- PWA: pin as observation only (benchmark is Azure-only, requires findings persistence)

**FindingCard promotion:**

- Any existing finding can be promoted to benchmark via context menu → "Set as benchmark"
- Captures stats from `finding.context.stats` into `benchmarkStats`

### 7. Scope Toggle in FindingCard

Each finding card in the Findings panel shows a scope indicator next to the status badge:

- **Auto-scoped** (status-based, `scoped: undefined`): subtle scope icon, muted color
- **Manually scoped in** (`scoped: true`): filled scope icon + "Scoped" label
- **Manually excluded** (`scoped: false`): crossed-out scope icon + "Excluded"
- Click to cycle through states

Benchmark findings show a star icon instead of scope toggle.

### 8. Files to Modify/Create

| File                                                               | Change                                                     |
| ------------------------------------------------------------------ | ---------------------------------------------------------- |
| `packages/core/src/findings/types.ts`                              | Add `FindingRole`, `BenchmarkStats`, extend `Finding`      |
| `packages/core/src/findings/helpers.ts`                            | Add `isFindingScoped()`, `getScopedFindings()`             |
| `packages/core/src/variation/projection.ts`                        | Add `computeBenchmarkProjection()`                         |
| `packages/core/src/variation/types.ts`                             | No new types needed (reuse `ProcessProjection`)            |
| `packages/hooks/src/useFindings.ts`                                | Add `setBenchmark()`, `clearBenchmark()`, `toggleScope()`  |
| `packages/hooks/src/types.ts`                                      | Add `benchmarkFindingId` to `AnalysisState`                |
| `packages/hooks/src/useProcessProjection.ts`                       | Add benchmark priority, pass benchmark to cumulative       |
| `packages/ui/src/components/ProcessHealthBar/ProcessHealthBar.tsx` | No changes (already renders `activeProjection.label`)      |
| `packages/ui/src/components/ProcessHealthBar/types.ts`             | No changes needed                                          |
| `apps/pwa/src/components/Dashboard.tsx`                            | Pass benchmark to `useProcessProjection`                   |
| `apps/azure/src/components/Dashboard.tsx`                          | Pass benchmark + scoped findings to `useProcessProjection` |

### 9. Testing

- `projection.test.ts`: Add tests for `computeBenchmarkProjection()` — benchmark better than complement, null when no specs, null when benchmark count < 2
- `useFindings.test.ts`: Add tests for `setBenchmark`, `clearBenchmark`, `toggleScope`
- `helpers.test.ts`: Add tests for `isFindingScoped`, `getScopedFindings`
- `useProcessProjection.test.ts`: Test benchmark priority override
- Dashboard tests: Mock updated hook returns
- Visual: Chrome verification of all toolbar display states
