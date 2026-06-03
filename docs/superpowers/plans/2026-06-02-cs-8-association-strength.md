---
tier: ephemeral
purpose: build
title: 'PR-CS-8 — Best-subsets attention-guide: per-scope association strength (ΔR²)'
status: draft
date: 2026-06-02
layer: spec
serves: docs/superpowers/specs/2026-06-02-connective-surface-model-design.md
---

# PR-CS-8 — Association Strength (ΔR²) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface each factor's **semipartial R² ("association strength, ΔR²")** in the scope-level `ModelBuilderBand` so the analyst sees _which factor uniquely accounts for the most spread inside the drilled scope_ — as an association magnitude, never a cause verdict.

**Architecture:** The per-scope re-rank already works (drill → `scopeRows` → `ModelBuilderBand` re-runs `computeBestSubsets`). This PR adds the **magnitude + framing** the spec calls for: a new pure-core helper `perFactorDeltaR2` (O(1) reads off the already-enumerated subset index — _no_ new regression), an i18n relabel to "association strength", per-factor ΔR² bars in the band, the missing per-scope-re-rank integration test, and one coherence-doc note. No engine change; no cross-app blast radius.

**Tech Stack:** TypeScript monorepo (pnpm/turbo); `@variscout/core` pure stats; `@variscout/ui` React band; Vitest (core = node env; ui = happy-dom, pool threads).

**Grounding basis (verified against code 2026-06-03):**

- `ModelBuilderBand.tsx` already re-ranks on `scopeRows`, has toggle + snap-back + capture-as-Finding, shows `R²adj` + per-factor `p`. It does **not** show any ΔR² / "association strength" surface.
- `perFactorPValues` (modelBuilder.ts:194) already computes `r2S − r2Reduced` for the nested-F partial test — **that delta _is_ the semipartial R².**
- The barrel `packages/core/src/stats/index.ts` exports `buildSubsetIndex`, `lookupSubset`, `perFactorPValues` (add `perFactorDeltaR2` there).
- ESLint `no-root-cause-language` bans only `/root[\s_-]?cause/i` in `core/src/i18n/**` — bare "cause" is allowed, but new copy here is phrased verdict-negating and apostrophe-typographic (file already uses `²` / `—`).
- LOCKED #2 ("R²adj + per-factor p ONLY — no Cp/BIC") lives in `modelBuilder.ts:16` + `ModelBuilderBand.tsx:16` + the 2026-05-31 factors-evaluation design. ΔR² is an _effect size_ (not a model-selection criterion), so this PR **refines** LOCKED #2 — logged in Task 5, not done silently.

**Out of scope (tracked follow-ups, do NOT build here):**

- Recording the full `perFactorDeltaR2` map onto the captured Finding's `modelContext` (cross-app: `findings/types.ts` + both app handlers). Follow-up — fold into CS-9 or a thin PR. (This PR _does_ re-point `topFactor` to the highest-ΔR² kept factor, which is in-band and grounded.)
- The **global** best-subsets "watch these factors" guide (§12 Q6) — separate, design-note-gated, lives in the Process-tab orient view, not Analyze.
- Any new "Explore this factor" CTA from the band — that's the crossing-back, PR-CS-13.

---

## File Structure

- `packages/core/src/stats/modelBuilder.ts` — **add** `perFactorDeltaR2(keptFactors, factors, index)`. Pure, O(1) per factor, raw-R² semipartial, clamp ≥ 0.
- `packages/core/src/stats/index.ts` — **export** `perFactorDeltaR2` from the existing `./modelBuilder` block.
- `packages/core/src/stats/__tests__/modelBuilder.test.ts` — **add** a `describe('perFactorDeltaR2')` block.
- `packages/core/src/i18n/messages/en.ts` — **add** 4 keys (`associationStrength`, `deltaR2`, `notAVerdict`, `deltaR2Caption`); leave existing keys intact.
- `packages/ui/src/components/AnalyzeWall/ModelBuilderBand.tsx` — compute `deltaR2`, sort kept + candidates by ΔR² desc, render a ΔR² bar + value per factor, add the framing line + caption, re-point `topFactor` to highest-ΔR².
- `packages/ui/src/components/AnalyzeWall/__tests__/ModelBuilderBand.test.tsx` — **add** ΔR²-render assertions + the **per-scope re-rank integration test**.
- `docs/superpowers/specs/2026-05-31-factors-evaluation-design.md` + `docs/decision-log.md` + the two source-header comments — **log** the LOCKED #2 → effect-size-with-p refinement.

---

## Task 1: Core — `perFactorDeltaR2` helper

**Files:**

- Modify: `packages/core/src/stats/modelBuilder.ts` (append after `perFactorPValues`, ~line 249)
- Modify: `packages/core/src/stats/index.ts` (add to the `./modelBuilder` export block, ~line 131)
- Test: `packages/core/src/stats/__tests__/modelBuilder.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `packages/core/src/stats/__tests__/modelBuilder.test.ts` (reuse the file's existing `computeBestSubsets`/`buildSubsetIndex` imports; add `perFactorDeltaR2`):

```ts
import { perFactorDeltaR2 } from '../modelBuilder';

/** Deterministic: Shift dominates Y, Machine adds a little, Noise is junk. */
function buildRerankData(): DataRow[] {
  const shiftEffect: Record<string, number> = { A: 0, B: 10, C: 20 };
  const machineEffect: Record<string, number> = { X: 0, Y: 2 };
  const rows: DataRow[] = [];
  let i = 0;
  for (const s of ['A', 'B', 'C']) {
    for (const m of ['X', 'Y']) {
      for (const nz of ['p', 'q']) {
        for (let r = 0; r < 3; r++) {
          const wobble = ((i * 7) % 5) - 2; // deterministic -2..2
          rows.push({
            Shift: s,
            Machine: m,
            Noise: nz,
            Y: shiftEffect[s] + machineEffect[m] + wobble,
          });
          i++;
        }
      }
    }
  }
  return rows;
}

describe('perFactorDeltaR2', () => {
  const data = buildRerankData();
  const result = computeBestSubsets(data, 'Y', ['Shift', 'Machine', 'Noise'])!;
  const index = buildSubsetIndex(result);

  it('ranks the dominant factor highest and junk near zero, all >= 0', () => {
    const kept = ['Shift', 'Machine', 'Noise'];
    const d = perFactorDeltaR2(kept, ['Shift', 'Machine', 'Noise'], index);
    expect(d.get('Shift')!).toBeGreaterThan(d.get('Machine')!);
    expect(d.get('Machine')!).toBeGreaterThan(d.get('Noise')!);
    for (const v of d.values()) expect(v).toBeGreaterThanOrEqual(0);
  });

  it('for a KEPT factor returns the drop-on-remove (semipartial R²)', () => {
    const full = index.byKey.get(['Shift', 'Machine'].sort().join('\x00'))!;
    const reduced = index.byKey.get('Machine')!;
    const d = perFactorDeltaR2(['Shift', 'Machine'], ['Shift'], index);
    expect(d.get('Shift')!).toBeCloseTo(full.rSquared - reduced.rSquared, 10);
  });

  it('for a NON-KEPT candidate returns the gain-on-add', () => {
    const kept = ['Machine'];
    const augmented = index.byKey.get(['Machine', 'Shift'].sort().join('\x00'))!;
    const base = index.byKey.get('Machine')!;
    const d = perFactorDeltaR2(kept, ['Shift'], index);
    expect(d.get('Shift')!).toBeCloseTo(augmented.rSquared - base.rSquared, 10);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/core test -- modelBuilder`
Expected: FAIL — `perFactorDeltaR2 is not a function` (not yet exported).

- [ ] **Step 3: Write minimal implementation**

Append to `packages/core/src/stats/modelBuilder.ts` after `perFactorPValues` (after line 249):

```ts
// ============================================================================
// Per-factor association strength (semipartial R²)
// ============================================================================

/**
 * Per-factor **semipartial R²** ("association strength, ΔR²") for the current
 * model — the *unique* share of the spread each factor accounts for.
 *
 *   - KEPT factor `f`:   ΔR²_f = R²(kept) − R²(kept \ {f})  (drop-on-remove)
 *   - NON-KEPT factor `c`: ΔR²_c = R²(kept ∪ {c}) − R²(kept) (gain-on-add)
 *
 * Uses RAW R² (not adjusted), so values are always ≥ 0 and read on the
 * "share of the total spread" scale. The KEPT delta is the SAME numerator the
 * nested-F partial p in `perFactorPValues` is built on (p = significance,
 * ΔR² = magnitude). By design these do NOT sum to the model R²: under
 * collinearity the shared variance is attributed to no single factor (ADR-073 —
 * contribution, never a forced decomposition). Every value is an O(1) lookup in
 * the already-enumerated subset index; no regression is re-run. Returns 0 for a
 * factor whose required subset was not enumerated (defensive).
 */
export function perFactorDeltaR2(
  keptFactors: readonly string[],
  factors: readonly string[],
  index: SubsetIndex
): Map<string, number> {
  const out = new Map<string, number>();
  const kept = [...keptFactors];
  const keptSubset = lookupSubset(index, kept);
  const r2Kept = keptSubset?.rSquared ?? 0;

  for (const f of factors) {
    let delta: number;
    if (kept.includes(f)) {
      const reducedFactors = kept.filter(k => k !== f);
      const reduced = reducedFactors.length > 0 ? lookupSubset(index, reducedFactors) : null;
      const r2Reduced = reducedFactors.length === 0 ? 0 : (reduced?.rSquared ?? 0);
      delta = r2Kept - r2Reduced;
    } else {
      const augmented = lookupSubset(index, [...kept, f]);
      delta = (augmented?.rSquared ?? r2Kept) - r2Kept;
    }
    out.set(f, Math.max(0, delta));
  }
  return out;
}
```

Then add `perFactorDeltaR2,` to the `export { … } from './modelBuilder'` block in `packages/core/src/stats/index.ts` (the block at ~line 131 already lists `buildSubsetIndex`, `lookupSubset`, `perFactorPValues`).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @variscout/core test -- modelBuilder`
Expected: PASS (all three new cases + the pre-existing modelBuilder suite).

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/stats/modelBuilder.ts packages/core/src/stats/index.ts packages/core/src/stats/__tests__/modelBuilder.test.ts
git commit -m "feat(stats): perFactorDeltaR2 — per-factor semipartial R² (association strength)"
```

---

## Task 2: i18n — association-strength labels

**Files:**

- Modify: `packages/core/src/i18n/messages/en.ts` (the `wall.model.*` block, ~line 966–987)

- [ ] **Step 1: Add the keys**

Insert after `'wall.model.factorP': 'p {value}',` (line 972) in `packages/core/src/i18n/messages/en.ts`:

```ts
  'wall.model.associationStrength': 'Association strength',
  'wall.model.deltaR2': 'ΔR² {value}',
  'wall.model.notAVerdict':
    'Associated with the spread in this scope — a clue to investigate, not a verdict.',
  'wall.model.deltaR2Caption':
    'Each bar is a factor’s unique share of the spread; correlated factors overlap, so they need not sum to the model fit.',
```

(No apostrophe collides with the single-quote delimiter — `’` is U+2019, consistent with the file's existing `²`/`—`. ESLint `no-root-cause-language` matches only `root cause`; these strings pass.)

- [ ] **Step 2: Verify lint + types**

Run: `pnpm --filter @variscout/core lint && pnpm --filter @variscout/core build`
Expected: PASS (no `no-root-cause-language` violation; `MessageKey` union picks up the new keys).

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/i18n/messages/en.ts
git commit -m "feat(i18n): association-strength + ΔR² band labels"
```

---

## Task 3: UI — render per-factor ΔR² + framing, re-point topFactor

**Files:**

- Modify: `packages/ui/src/components/AnalyzeWall/ModelBuilderBand.tsx`
- Test: `packages/ui/src/components/AnalyzeWall/__tests__/ModelBuilderBand.test.tsx`

- [ ] **Step 1: Write the failing test**

Add to `packages/ui/src/components/AnalyzeWall/__tests__/ModelBuilderBand.test.tsx` (it already imports `render`, `screen`, and has `shiftDominatedRows()`):

```ts
it('shows a ΔR² (association strength) value for each kept factor', () => {
  render(
    <ModelBuilderBand
      rows={shiftDominatedRows()}
      candidateFactors={['Shift', 'Machine', 'Noise']}
      outcome="Y"
      scopeLabel="All data"
      x={0} y={0} width={320} height={260}
    />
  );
  // Shift is the vital few; its ΔR² magnitude renders.
  expect(screen.getByTestId('model-deltaR2-Shift')).toBeInTheDocument();
  expect(screen.getByTestId('model-deltaR2-Shift').textContent).toMatch(/ΔR²/);
});

it('shows the "association, not a verdict" framing', () => {
  render(
    <ModelBuilderBand
      rows={shiftDominatedRows()}
      candidateFactors={['Shift', 'Machine', 'Noise']}
      outcome="Y"
      scopeLabel="All data"
      x={0} y={0} width={320} height={260}
    />
  );
  expect(screen.getByTestId('model-not-a-verdict')).toHaveTextContent(/not a verdict/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/ui test -- ModelBuilderBand`
Expected: FAIL — `Unable to find element by: [data-testid="model-deltaR2-Shift"]`.

- [ ] **Step 3: Implement the render changes**

In `packages/ui/src/components/AnalyzeWall/ModelBuilderBand.tsx`:

(a) Add the import (line 22–32 block):

```ts
import {
  computeBestSubsets,
  buildSubsetIndex,
  lookupSubset,
  selectVitalFew,
  perFactorPValues,
  perFactorDeltaR2,
  isFitOnlyEstimate,
  redundancyHint,
  computeSubsetVIF,
  factorSetKey,
} from '@variscout/core/stats';
```

(b) Add the ΔR² memo after `keptVif` (after line 169):

```ts
// Per-factor association strength (semipartial R²) for kept + candidate
// factors. O(1) reads off the enumerated index (see perFactorDeltaR2).
const deltaR2 = useMemo<Map<string, number>>(() => {
  if (!engine) return new Map();
  return perFactorDeltaR2(kept, eligibleFactors, engine.index);
}, [engine, kept, eligibleFactors]);
```

(c) Re-point `topFactor` in `handleCapture` (lines 222–226) from lowest-p to highest-ΔR² (the most-explanatory association):

```ts
// top factor = the kept factor with the highest association strength (ΔR²).
const topFactor =
  kept.length > 0
    ? [...kept].sort((a, b) => (deltaR2.get(b) ?? 0) - (deltaR2.get(a) ?? 0))[0]
    : null;
```

and add `deltaR2` to the `handleCapture` dependency array (line 234): `}, [onCaptureModel, keptSubset, kept, keptP, scopeLabel, deltaR2]);`

(d) Sort the displayed lists by ΔR² desc — replace the render-derived `candidatesBelowLine` (line 237) and add a sorted kept list:

```ts
// ── Render ────────────────────────────────────────────────────────────────
const keptSorted = [...kept].sort((a, b) => (deltaR2.get(b) ?? 0) - (deltaR2.get(a) ?? 0));
const candidatesBelowLine = eligibleFactors
  .filter(f => !kept.includes(f))
  .sort((a, b) => (deltaR2.get(b) ?? 0) - (deltaR2.get(a) ?? 0));
```

(e) Add a `DeltaBar` inline render helper (above the component, after `fmtP`, ~line 87):

```ts
/** A small inline association-strength bar; width = ΔR² (0..1), honest scale. */
const DeltaBar: React.FC<{ value: number }> = ({ value }) => {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <span className="bg-surface-secondary inline-block h-1.5 w-10 overflow-hidden rounded-sm align-middle">
      <span className="block h-full bg-blue-300" style={{ width: `${pct}%` }} />
    </span>
  );
};
```

(f) In the KEPT `<li>` (replace the `kept.map(...)` at lines 293–321 to iterate `keptSorted` and add the ΔR² bar + value before the p value):

```tsx
<ul data-testid="model-kept" className="mb-1 space-y-0.5">
  {keptSorted.map(factor => (
    <li key={factor} className="flex items-center justify-between gap-2">
      <button
        type="button"
        data-no-wall-pan
        data-testid={`model-kept-factor-${factor}`}
        onClick={() => toggleFactor(factor)}
        aria-label={formatMessage(locale, 'wall.model.removeFromModel', { factor })}
        className="hover:bg-surface-secondary flex-1 rounded px-1 text-left"
      >
        {factor}
      </button>
      <span className="flex items-center gap-1.5">
        <DeltaBar value={deltaR2.get(factor) ?? 0} />
        <span
          data-testid={`model-deltaR2-${factor}`}
          title={formatMessage(locale, 'wall.model.deltaR2Caption')}
          className="text-content font-mono"
        >
          {formatMessage(locale, 'wall.model.deltaR2', {
            value: fmtR2(deltaR2.get(factor) ?? 0),
          })}
        </span>
        <span
          data-testid={`model-p-${factor}`}
          title={
            keptVif.get(factor) !== undefined
              ? formatMessage(locale, 'wall.model.vifTooltip', {
                  value: fmtR2(keptVif.get(factor)!),
                })
              : undefined
          }
          className="text-content-muted font-mono"
        >
          {formatMessage(locale, 'wall.model.factorP', {
            value: fmtP(keptP.get(factor) ?? 1),
          })}
        </span>
      </span>
    </li>
  ))}
</ul>
```

(g) In the CANDIDATES `<li>` (the `candidatesBelowLine.map(...)` at lines 339–352), add the ΔR² (gain-on-add) value after the button:

```tsx
{
  candidatesBelowLine.map(factor => (
    <li key={factor} className="flex items-center justify-between gap-2">
      <button
        type="button"
        data-no-wall-pan
        data-testid={`model-candidate-factor-${factor}`}
        onClick={() => toggleFactor(factor)}
        aria-label={formatMessage(locale, 'wall.model.addToModel', { factor })}
        className="hover:bg-surface-secondary flex-1 rounded px-1 text-left"
      >
        {factor}
      </button>
      <span data-testid={`model-deltaR2-${factor}`} className="text-content-muted font-mono">
        {formatMessage(locale, 'wall.model.deltaR2', {
          value: fmtR2(deltaR2.get(factor) ?? 0),
        })}
      </span>
    </li>
  ));
}
```

(h) Add the framing line just below the header block (after the header `</div>` at line 286, before the KEPT heading):

```tsx
<div data-testid="model-not-a-verdict" className="text-content-subtle mb-1 text-[10px] italic">
  {formatMessage(locale, 'wall.model.notAVerdict')}
</div>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @variscout/ui test -- ModelBuilderBand`
Expected: PASS (new ΔR² + framing tests + the pre-existing band suite, including snap-back/toggle/capture which are unchanged in behavior).

- [ ] **Step 5: Build (tsc) + commit**

Run: `pnpm --filter @variscout/ui build`
Expected: PASS (no type drift; `CapturedModelSnapshot` shape unchanged).

```bash
git add packages/ui/src/components/AnalyzeWall/ModelBuilderBand.tsx packages/ui/src/components/AnalyzeWall/__tests__/ModelBuilderBand.test.tsx
git commit -m "feat(analyze): render per-factor ΔR² association strength + no-verdict framing"
```

---

## Task 4: UI — the per-scope re-rank integration test (the coverage gap)

**Files:**

- Test: `packages/ui/src/components/AnalyzeWall/__tests__/ModelBuilderBand.test.tsx`

> Grounding flagged this: `useScopedModels` mocks the engine and the seam test never drills, so _nothing proves the re-rank actually changes the vital few when you drill_. This test closes that gap at the band level (the real engine, real re-rank).

- [ ] **Step 1: Write the failing test**

Add to `ModelBuilderBand.test.tsx`:

```ts
/**
 * Conditional structure: globally Region drives Y (0 vs 50); WITHIN Region A,
 * Machine drives the residual (X≈0 vs Y≈8), but Machine is flat in Region B.
 * → global vital few = [Region]; drill to Region=A (Region constant) → [Machine].
 */
function buildConditionalData(): DataRow[] {
  const rows: DataRow[] = [];
  let i = 0;
  const push = (Region: string, Machine: string, base: number, mEff: number) => {
    for (let r = 0; r < 6; r++) {
      const wobble = ((i * 3) % 3) - 1; // deterministic -1..1
      rows.push({ Region, Machine, Y: base + mEff + wobble });
      i++;
    }
  };
  // Region A: base 0, Machine matters a lot here
  push('A', 'X', 0, 0);
  push('A', 'Y', 0, 8);
  // Region B: base 50, Machine flat here
  push('B', 'X', 50, 0);
  push('B', 'Y', 50, 0);
  return rows;
}

it('re-ranks the vital few when the analyst drills into a scope', () => {
  const all = buildConditionalData();

  // Global view: Region is the vital few; Machine is below the line.
  const { unmount } = render(
    <ModelBuilderBand
      rows={all}
      candidateFactors={['Region', 'Machine']}
      outcome="Y"
      scopeLabel="All data"
      x={0} y={0} width={320} height={260}
    />
  );
  expect(screen.getByTestId('model-kept-factor-Region')).toBeInTheDocument();
  expect(screen.queryByTestId('model-kept-factor-Machine')).not.toBeInTheDocument();
  unmount();

  // Drilled to Region=A: Region is constant in scope → Machine becomes the vital few.
  const regionA = all.filter(r => r.Region === 'A');
  render(
    <ModelBuilderBand
      rows={regionA}
      candidateFactors={['Region', 'Machine']}
      outcome="Y"
      scopeLabel="Region = A"
      constantFactors={['Region']}
      x={0} y={0} width={320} height={260}
    />
  );
  expect(screen.getByTestId('model-kept-factor-Machine')).toBeInTheDocument();
  expect(screen.getByTestId('model-constant-factor-Region')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails (or passes) — then assert behavior**

Run: `pnpm --filter @variscout/ui test -- ModelBuilderBand`
Expected: PASS once Task 3 is in (the band already re-ranks; this test _locks the behavior in_). If it FAILS, the re-rank or constant-factor exclusion regressed — fix before proceeding (do not weaken the assertion). If the global view unexpectedly keeps Machine, tune `mEff`/`base` so Region clearly dominates globally (the structure, not the magnitudes, is the contract).

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/components/AnalyzeWall/__tests__/ModelBuilderBand.test.tsx
git commit -m "test(analyze): lock in per-scope vital-few re-rank on drill"
```

---

## Task 5: Docs — log the LOCKED #2 → effect-size refinement

**Files:**

- Modify: `docs/superpowers/specs/2026-05-31-factors-evaluation-design.md` (the §2/§3 "surface metrics = R²adj + per-factor p only" call)
- Modify: `docs/decision-log.md` (a one-line refinement entry)
- Modify: `packages/core/src/stats/modelBuilder.ts:16` and `packages/ui/src/components/AnalyzeWall/ModelBuilderBand.tsx:16` (the LOCKED #2 comment)

- [ ] **Step 1: Amend the comments**

In both source headers, change the LOCKED #2 line from:

```
 * Surface metrics = adjusted R² + per-factor p ONLY (LOCKED #2 — no Cp/BIC).
```

to:

```
 * Surface metrics = adjusted R² + per-factor p + per-factor ΔR² (semipartial R²,
 * "association strength") ONLY (LOCKED #2, refined CS-8 — no Cp/BIC; ΔR² is the
 * effect size behind the partial p, never a model-selection criterion).
```

- [ ] **Step 2: Log the decision**

Add to `docs/decision-log.md` under the appropriate section (a `Refined` entry): note that CS-8 refines LOCKED #2 to surface per-factor ΔR² (semipartial R²) as "association strength" — an effect size paired with the existing partial p; still no Cp/BIC; honors ADR-073 (the bars do not sum / no forced decomposition). Add the matching callout to the factors-evaluation design §2/§3 metric-surface paragraph.

- [ ] **Step 3: Commit**

```bash
git add docs/ packages/core/src/stats/modelBuilder.ts packages/ui/src/components/AnalyzeWall/ModelBuilderBand.tsx
git commit -m "docs(cs-8): refine LOCKED #2 to surface ΔR² association strength (effect-size-with-p)"
```

---

## Self-Review

**1. Spec coverage (§4.0 / §4.0a / master-plan PR-CS-8):**

- "drilling a scope re-ranks the vital-few for that scope" → already wired; **locked in by Task 4**. ✅
- "ΔR² ranking is association strength, not a verdict" → **Tasks 1–3** (per-factor semipartial R², "Association strength" label, sorted by ΔR², "not a verdict" framing). ✅
- "analyst controls the model (toggle / snap-back)" → pre-existing, unchanged (Task 3 preserves toggle/snap-back). ✅
- "no cause verdict language" → framing copy verdict-negating; ESLint `no-root-cause-language` clean (Task 2 Step 2). ✅
- ADR-073 (no forced decomposition) → `deltaR2Caption` + raw-R² non-summing semipartials. ✅

**2. Placeholder scan:** every code step has complete code; the only deferred items are explicitly out-of-scope follow-ups (capture-the-ΔR²-map onto the Finding; global guide; Explore CTA), not placeholders in this plan.

**3. Type consistency:** `perFactorDeltaR2(keptFactors, factors, index)` — same `SubsetIndex` type used by `lookupSubset`/`perFactorPValues`; `Map<string, number>` return matches `keptP`/`keptVif` usage; `CapturedModelSnapshot` shape **unchanged** (only `topFactor`'s _source_ changes). `fmtR2` reused for the ΔR² value. No signature drift.

**Right-sizing:** Tasks 1–4 are well-specified TDD against 1–2 files each → **Sonnet** implementers; Task 5 is docs → **Haiku/Sonnet**. The design judgment (semipartial R², effect-size-with-p) is pinned here, so no Opus task remains. Final-branch review = one code-reviewer subagent (Sonnet) per the per-PR protocol.

---

## Execution Handoff

Run via `superpowers:subagent-driven-development` (fresh implementer per task; spec + quality reviewer pair; right-sized model). Branch `feat/cs-8-association-strength` off `main`. Per the CLAUDE.md per-PR protocol: `bash scripts/pr-ready-check.sh` green → code-review subagent (STEP 0 = checkout the PR branch) → verify the band on a 13–15″ viewport with `--chrome` → `gh pr merge --merge --delete-branch`.
