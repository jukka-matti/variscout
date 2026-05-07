---
title: Canvas PR8 sub-PR 8b — Drift indicator + time-series mini-chart
audience: [engineer]
category: implementation-plan
status: active
last-reviewed: 2026-05-07
related:
  - docs/superpowers/plans/2026-05-07-canvas-pr8-vision-alignment-master.md
  - docs/superpowers/specs/2026-05-03-variscout-vision-design.md
  - docs/superpowers/specs/2026-05-04-canvas-migration-design.md
  - docs/investigations.md
---

# Canvas PR8 sub-PR 8b — Drift indicator + time-series mini-chart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close two unmet vision §5.2 commitments on canvas step cards in one PR: render a per-step **drift indicator** (↑ / ↓ / → arrow + magnitude % on the capability badge) and a third **time-series mini-chart branch** (sparkline) for high-cardinality numeric columns. Closes the two `docs/investigations.md` entries pinned 2026-05-06 ("Canvas mini-chart: time-series for high-cardinality columns missing" + "Canvas drift indicator missing"). Free + paid tier both render — visualization, not gating; layer-neutral per F4 (hook output, not store).

**Architecture:** Two independent additions on the same surface. (1) **Drift**: pure `computeStepDrift` helper in `@variscout/core/canvas/stepDrift.ts` with a locked sign convention (`direction: 'up' | 'down' | 'flat'` where `up` = direction-of-improvement per `MeasureSpec.characteristicType`, `down` = degradation, `flat` = within ±5%). `useCanvasStepCards` accepts a new optional `priorStepStats?: ReadonlyMap<stepId, StepCapabilityStamp>` arg and stamps `card.drift?: DriftResult` per card; `CanvasStepCard` renders an inline arrow chip next to the capability pill. (2) **Time-series**: `useCanvasStepCards` adds a deterministic `numericRenderHint: 'histogram' | 'time-series'` per numeric card based on a `NUMERIC_TIME_SERIES_DISTINCT_THRESHOLD = 30` rule, plus pre-computed `timeSeriesPoints?: ReadonlyArray<{ x: number; y: number }>` ordered by parser-detected `timeColumn` (fallback: row-index). LTTB downsamples >100 pts via the existing `lttb` helper in `@variscout/core/stats`. `CanvasStepMiniChart` adds a third branch rendering an inline-SVG sparkline.

A new `EvidenceSnapshot.stepCapabilities?: ReadonlyArray<StepCapabilityStamp>` field carries the prior values. **Producer wiring is deferred** per `feedback_partial_integration_policy` — slice 4 ships the consumer (engine + hook + UI + app read path); a follow-up slice stamps `stepCapabilities` at snapshot-create time, at which point the drift indicator activates without further code changes. The histogram branch's "first-12-raw-values" pseudo-binning is **not** rebuilt here — Sturges/Scott binning is deferred to its own follow-up entry.

**Tech Stack:** TypeScript, React 18, Vitest, React Testing Library, Tailwind v4, `@variscout/core/canvas` sub-path, `@variscout/core/stats` (existing `lttb`), `@variscout/core/parser` (existing `detectColumns().timeColumn`), `@variscout/core/time` (existing `parseTimeValue`), `@variscout/charts` (`chartColors` for theme-aware styling).

---

## Locked decisions

### D1. Direction-of-improvement sign convention

`direction: 'up' | 'down' | 'flat'`.

- `'up'` ALWAYS means **improvement** — the canvas paints it green (positive signal). Visual: ▲.
- `'down'` ALWAYS means **degradation** — the canvas paints it red (negative signal). Visual: ▼.
- `'flat'` means **|relativeChange| < threshold** — neutral. Visual: → (right arrow / em-dash equivalent).

Mapping by metric:

| Metric                                    | `characteristicType` | "up" condition                                          |
| ----------------------------------------- | -------------------- | ------------------------------------------------------- | --------------------- | --- | ------------------- | ------------------------------------------- |
| `cpk` (preferred when both sides have it) | any                  | `cpk_current > cpk_prior` (higher Cpk is always better) |
| `mean`                                    | `'larger'`           | `mean_current > mean_prior`                             |
| `mean`                                    | `'smaller'`          | `mean_current < mean_prior`                             |
| `mean`                                    | `'nominal'`          | `                                                       | mean_current − target | <   | mean_prior − target | `(target required; if absent, return`null`) |

Metric selection: **Cpk first; mean second; otherwise return `null`** (no drift rendered). Sigma is NOT a fallback metric for canvas drift — it's directionless without a reference point. The sigma-fallback in the legacy `findings/drift.ts` is a Finding-window concern and stays scoped to that file.

### D2. Threshold

`STEP_DRIFT_DEFAULT_THRESHOLD = 0.05` (±5%) constant exported from `@variscout/core/canvas`. User-configurable later via per-Hub setting; **out of scope for slice 4** — apps pass nothing and the default applies.

`relativeChange = (currentVal − beforeVal) / beforeVal`. `flat` when `|relativeChange| < threshold`.

If `beforeVal === 0` (or undefined / NaN), `direction = 'flat'`, `magnitude = 0`. The step has no prior baseline to drift against.

### D3. Cardinality threshold for time-series mini-chart

`NUMERIC_TIME_SERIES_DISTINCT_THRESHOLD = 30` constant exported from `@variscout/core/canvas`. When `metricKind === 'numeric'` AND the count of distinct values exceeds 30, the card renders a sparkline; otherwise the card keeps the current numeric histogram-stub branch. Distinct-count is computed once per card alongside `values` in `buildCanvasStepCards`.

### D4. Time-axis source for sparkline

Order points by parser-detected `timeColumn` when present; **fallback** to original row index when absent or all parses fail. `parseTimeValue` from `@variscout/core/time` is the parser. Order is ascending by time (or by index). Document the fallback in the hook's JSDoc so reviewers see it.

### D5. LTTB threshold

`SPARKLINE_LTTB_THRESHOLD = 100`. Above 100 input points, the hook downsamples to 100 via the existing `lttb` helper in `@variscout/core/stats`. Below 100, points pass through verbatim.

### D6. EvidenceSnapshot type extension shipped this PR; producer deferred

The `stepCapabilities?: ReadonlyArray<StepCapabilityStamp>` field is added to `EvidenceSnapshot` in slice 4. The runtime producer (stamping per-step Cpk / mean / sigma at snapshot-create time, which requires the canvas process map + measureSpecs to be available at the call site) is **DEFERRED** to a separate follow-up slice. Slice 4's app wiring reads `evidenceSnapshots.listByHub(hubId)`, picks the most-recent live snapshot's `stepCapabilities` if present, and passes a Map to `CanvasWorkspace`. Until the producer lands, `stepCapabilities` is `undefined` on every snapshot → `priorStepStats` is an empty Map → drift indicator stays inert. This is the explicit partial-integration policy — bake the consumer surface, drop a follow-up entry in `docs/investigations.md`, ship.

### D7. Histogram fix (Sturges / Scott binning) is OUT OF SCOPE

Per master plan §4 8b summary: "Bonus: replace current 'first-12-raw-values' pseudo-histogram with proper Sturges/Scott binning" — **deferred to its own follow-up entry**. The current histogram branch in `CanvasStepMiniChart.tsx` stays untouched. Slice 4 is drift + time-series only.

---

## File Structure

**Create:**

- `packages/core/src/canvas/stepDrift.ts` — `computeStepDrift()` + `DriftResult` + threshold constant
- `packages/core/src/canvas/__tests__/stepDrift.test.ts`
- `packages/ui/src/components/Canvas/internal/CanvasStepDriftIndicator.tsx` — inline arrow chip
- `packages/ui/src/components/Canvas/internal/__tests__/CanvasStepDriftIndicator.test.tsx`

**Modify:**

- `packages/core/src/evidenceSources.ts` — add `StepCapabilityStamp` + extend `EvidenceSnapshot`
- `packages/core/src/__tests__/evidenceSources.test.ts` — JSON round-trip test for the new field
- `packages/core/src/canvas/index.ts` — re-export `computeStepDrift`, `DriftResult`, threshold + cardinality constants
- `packages/hooks/src/useCanvasStepCards.ts` — extend args + outputs
- `packages/hooks/src/__tests__/useCanvasStepCards.test.ts` — drift + time-series cases
- `packages/ui/src/components/Canvas/internal/CanvasStepMiniChart.tsx` — third branch (sparkline)
- `packages/ui/src/components/Canvas/internal/CanvasStepCard.tsx` — render `<CanvasStepDriftIndicator>` next to capability pill
- `packages/ui/src/components/Canvas/CanvasWorkspace.tsx` — thread `priorStepStats` prop through
- `packages/ui/src/components/Canvas/index.tsx` — accept `priorStepStats` on `CanvasProps` (forward to `CanvasStepCard`); accept `priorStepStats` on `CanvasStepCardProps`
- `apps/pwa/src/components/views/FrameView.tsx` — fetch + pass `priorStepStats`
- `apps/pwa/src/components/views/__tests__/FrameView.test.tsx` (create or modify)
- `apps/azure/src/components/editor/FrameView.tsx` — fetch + pass `priorStepStats`
- `apps/azure/src/components/editor/__tests__/FrameView.test.tsx` (create or modify)
- `docs/investigations.md` — mark both 8b entries `[RESOLVED 2026-05-XX]`; add follow-up entries for (a) producer-side `stepCapabilities` stamping and (b) Sturges/Scott histogram fix

---

## Self-review checklist (run AFTER plan execution, before final review)

- [ ] No `Math.random()` introduced anywhere (seeded PRNG only — `.claude/rules/stats.md`)
- [ ] No `.toFixed()` on stats output — `formatStatistic()` for display
- [ ] Stats functions return `number | undefined`, never `NaN` / `Infinity` (`safeMath.ts` primitives)
- [ ] No emoji in source / test / docs
- [ ] No new top-level directory under `apps/` (FSD)
- [ ] `packages/core` does NOT import React / visx / UI (still pure TS)
- [ ] All `vi.mock(...)` calls in tests are ABOVE their component imports (top of file)
- [ ] Float assertions use `toBeCloseTo(expected, precision)`
- [ ] All new copy lives in i18n message catalog (no hardcoded user-facing strings)
- [ ] Two `docs/investigations.md` 8b entries marked `[RESOLVED YYYY-MM-DD]`
- [ ] Two follow-up `docs/investigations.md` entries dropped (producer-stamping + Sturges/Scott)
- [ ] Per-card test asserts drift renders `flat` when prior absent (defensive default)
- [ ] PR description cites "Advances vision §5.2"

---

## Task 1: Engine — `computeStepDrift` helper + constants

**Files:**

- Create: `packages/core/src/canvas/stepDrift.ts`
- Create: `packages/core/src/canvas/__tests__/stepDrift.test.ts`
- Modify: `packages/core/src/canvas/index.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// packages/core/src/canvas/__tests__/stepDrift.test.ts
import { describe, expect, it } from 'vitest';
import {
  computeStepDrift,
  STEP_DRIFT_DEFAULT_THRESHOLD,
  type DriftResult,
  type StepCapabilityStamp,
} from '../stepDrift';

const stamp = (partial: Partial<StepCapabilityStamp>): StepCapabilityStamp => ({
  stepId: 's',
  n: 30,
  ...partial,
});

describe('computeStepDrift', () => {
  describe('threshold + flat detection', () => {
    it('exports default threshold of 0.05', () => {
      expect(STEP_DRIFT_DEFAULT_THRESHOLD).toBe(0.05);
    });

    it('returns flat when relative change is below default threshold', () => {
      const result = computeStepDrift({
        current: stamp({ cpk: 1.3 }),
        prior: stamp({ cpk: 1.32 }),
        characteristicType: 'nominal',
      });
      expect(result?.direction).toBe('flat');
      expect(result?.metric).toBe('cpk');
    });

    it('respects a caller-supplied threshold', () => {
      const result = computeStepDrift({
        current: stamp({ cpk: 1.3 }),
        prior: stamp({ cpk: 1.32 }),
        characteristicType: 'nominal',
        threshold: 0.001,
      });
      expect(result?.direction).toBe('down');
    });
  });

  describe('cpk metric (always: higher is better)', () => {
    it('returns up when cpk increases past threshold', () => {
      const result = computeStepDrift({
        current: stamp({ cpk: 1.5 }),
        prior: stamp({ cpk: 1.3 }),
        characteristicType: 'larger',
      });
      expect(result).toMatchObject<Partial<DriftResult>>({
        direction: 'up',
        metric: 'cpk',
      });
      expect(result?.magnitude).toBeCloseTo(0.1538, 3); // (1.50−1.30)/1.30
    });

    it('returns down when cpk decreases past threshold', () => {
      const result = computeStepDrift({
        current: stamp({ cpk: 1.1 }),
        prior: stamp({ cpk: 1.3 }),
        characteristicType: 'smaller',
      });
      expect(result?.direction).toBe('down');
      expect(result?.magnitude).toBeCloseTo(0.1538, 3);
    });
  });

  describe('mean metric — direction-of-improvement aware', () => {
    it("'larger' (larger-is-better): mean increase = up", () => {
      const result = computeStepDrift({
        current: stamp({ mean: 110 }),
        prior: stamp({ mean: 100 }),
        characteristicType: 'larger',
      });
      expect(result?.direction).toBe('up');
      expect(result?.metric).toBe('mean');
    });

    it("'larger': mean decrease = down", () => {
      const result = computeStepDrift({
        current: stamp({ mean: 90 }),
        prior: stamp({ mean: 100 }),
        characteristicType: 'larger',
      });
      expect(result?.direction).toBe('down');
    });

    it("'smaller' (smaller-is-better): mean decrease = up", () => {
      const result = computeStepDrift({
        current: stamp({ mean: 90 }),
        prior: stamp({ mean: 100 }),
        characteristicType: 'smaller',
      });
      expect(result?.direction).toBe('up');
    });

    it("'smaller': mean increase = down", () => {
      const result = computeStepDrift({
        current: stamp({ mean: 110 }),
        prior: stamp({ mean: 100 }),
        characteristicType: 'smaller',
      });
      expect(result?.direction).toBe('down');
    });

    it("'nominal': moving toward target = up", () => {
      // Target = 100. Prior was 110 (off by 10). Current is 102 (off by 2).
      // |2| < |10|, so we improved → up.
      const result = computeStepDrift({
        current: stamp({ mean: 102 }),
        prior: stamp({ mean: 110 }),
        characteristicType: 'nominal',
        target: 100,
      });
      expect(result?.direction).toBe('up');
      expect(result?.metric).toBe('mean');
      // magnitude = |Δ(distance)| / |prior distance| = |2−10|/|10| = 0.8
      expect(result?.magnitude).toBeCloseTo(0.8, 5);
    });

    it("'nominal': moving away from target = down", () => {
      const result = computeStepDrift({
        current: stamp({ mean: 120 }),
        prior: stamp({ mean: 110 }),
        characteristicType: 'nominal',
        target: 100,
      });
      expect(result?.direction).toBe('down');
    });

    it("'nominal' without a target returns null (cannot evaluate)", () => {
      const result = computeStepDrift({
        current: stamp({ mean: 110 }),
        prior: stamp({ mean: 100 }),
        characteristicType: 'nominal',
        // target intentionally omitted
      });
      expect(result).toBeNull();
    });

    it("'nominal' with prior exactly on target returns flat (no baseline distance to compare)", () => {
      const result = computeStepDrift({
        current: stamp({ mean: 105 }),
        prior: stamp({ mean: 100 }),
        characteristicType: 'nominal',
        target: 100,
      });
      expect(result?.direction).toBe('flat');
      expect(result?.magnitude).toBe(0);
    });
  });

  describe('metric selection precedence', () => {
    it('prefers cpk over mean when both available', () => {
      const result = computeStepDrift({
        current: stamp({ cpk: 1.5, mean: 90 }),
        prior: stamp({ cpk: 1.3, mean: 100 }),
        characteristicType: 'smaller',
      });
      expect(result?.metric).toBe('cpk');
    });

    it('falls back to mean when cpk missing on either side', () => {
      const result = computeStepDrift({
        current: stamp({ mean: 90 }),
        prior: stamp({ cpk: 1.3, mean: 100 }),
        characteristicType: 'smaller',
      });
      expect(result?.metric).toBe('mean');
    });

    it('returns null when neither cpk nor mean is available on both sides', () => {
      const result = computeStepDrift({
        current: stamp({}),
        prior: stamp({ mean: 100 }),
        characteristicType: 'larger',
      });
      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('returns flat with magnitude 0 when prior cpk is 0', () => {
      const result = computeStepDrift({
        current: stamp({ cpk: 1.5 }),
        prior: stamp({ cpk: 0 }),
        characteristicType: 'larger',
      });
      expect(result).toMatchObject({ direction: 'flat', magnitude: 0, metric: 'cpk' });
    });

    it('returns flat with magnitude 0 when prior mean is 0 (smaller)', () => {
      const result = computeStepDrift({
        current: stamp({ mean: 5 }),
        prior: stamp({ mean: 0 }),
        characteristicType: 'smaller',
      });
      expect(result?.direction).toBe('flat');
      expect(result?.magnitude).toBe(0);
    });

    it('threshold field on result reflects the threshold actually used', () => {
      const result = computeStepDrift({
        current: stamp({ cpk: 1.5 }),
        prior: stamp({ cpk: 1.3 }),
        characteristicType: 'larger',
        threshold: 0.1,
      });
      expect(result?.threshold).toBe(0.1);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/core test stepDrift
```

Expected: FAIL — `Cannot find module '../stepDrift'` or similar.

- [ ] **Step 3: Implement `stepDrift.ts`**

```typescript
// packages/core/src/canvas/stepDrift.ts
import type { CharacteristicType } from '../types';

/**
 * Per-step capability stamp persisted on EvidenceSnapshot for drift comparison.
 * Optional fields reflect what the producer stamped at snapshot-create time.
 *
 * Drift consumer picks the metric: cpk first, then mean.
 */
export interface StepCapabilityStamp {
  stepId: string;
  /** Sample size at stamp time. */
  n: number;
  /** Step mean of the metric column. */
  mean?: number;
  /** Step within-subgroup sigma. */
  sigma?: number;
  /** Process capability index (Cpk). */
  cpk?: number;
}

export interface DriftResult {
  /** Visual direction. `up` = improvement (green); `down` = degradation (red); `flat` = within threshold. */
  direction: 'up' | 'down' | 'flat';
  /** Absolute relative change as a non-negative decimal (e.g. 0.07 = 7%). */
  magnitude: number;
  /** Threshold that was applied. |relativeChange| < threshold ⇒ flat. */
  threshold: number;
  /** Metric the comparison used. `null` from `computeStepDrift` if neither cpk nor mean is comparable. */
  metric: 'cpk' | 'mean';
}

/**
 * Default drift threshold. ±5% relative change triggers `up` / `down`;
 * smaller changes are reported as `flat`. User-configurable later.
 */
export const STEP_DRIFT_DEFAULT_THRESHOLD = 0.05;

export interface ComputeStepDriftArgs {
  current: StepCapabilityStamp;
  prior: StepCapabilityStamp;
  /** From the step's MeasureSpec — drives direction-of-improvement for the mean fallback. */
  characteristicType: CharacteristicType;
  /** Required when characteristicType === 'nominal' AND mean fallback is used. */
  target?: number;
  /** Override of STEP_DRIFT_DEFAULT_THRESHOLD. */
  threshold?: number;
}

/**
 * Compute per-step drift between a current stat snapshot and a prior one.
 *
 * Sign convention (locked):
 *   - `direction: 'up'` — process improved (green arrow)
 *   - `direction: 'down'` — process degraded (red arrow)
 *   - `direction: 'flat'` — |relativeChange| < threshold (gray arrow / em-dash)
 *
 * Metric selection: prefer `cpk` when both sides have it; otherwise fall back to
 * `mean` (direction interpreted via `characteristicType`); otherwise return `null`.
 *
 * Returns `null` when:
 *   - Neither `cpk` nor `mean` is available on both sides.
 *   - `characteristicType === 'nominal'` and `target` is absent.
 */
export function computeStepDrift(args: ComputeStepDriftArgs): DriftResult | null {
  const { current, prior, characteristicType } = args;
  const threshold = args.threshold ?? STEP_DRIFT_DEFAULT_THRESHOLD;

  // Cpk first — directionless type rule (higher is always better).
  if (isFiniteNumber(current.cpk) && isFiniteNumber(prior.cpk)) {
    return cpkDrift(current.cpk, prior.cpk, threshold);
  }

  // Mean fallback — direction interpreted via characteristicType.
  if (isFiniteNumber(current.mean) && isFiniteNumber(prior.mean)) {
    return meanDrift(current.mean, prior.mean, characteristicType, args.target, threshold);
  }

  return null;
}

function isFiniteNumber(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function cpkDrift(currentCpk: number, priorCpk: number, threshold: number): DriftResult {
  if (priorCpk === 0) {
    return { direction: 'flat', magnitude: 0, threshold, metric: 'cpk' };
  }
  const relative = (currentCpk - priorCpk) / priorCpk;
  const magnitude = Math.abs(relative);
  if (magnitude < threshold) {
    return { direction: 'flat', magnitude, threshold, metric: 'cpk' };
  }
  // Higher Cpk = improvement. relative > 0 ⇒ up.
  return { direction: relative > 0 ? 'up' : 'down', magnitude, threshold, metric: 'cpk' };
}

function meanDrift(
  currentMean: number,
  priorMean: number,
  characteristicType: CharacteristicType,
  target: number | undefined,
  threshold: number
): DriftResult | null {
  if (characteristicType === 'nominal') {
    if (target === undefined || !Number.isFinite(target)) return null;
    return nominalMeanDrift(currentMean, priorMean, target, threshold);
  }

  if (priorMean === 0) {
    return { direction: 'flat', magnitude: 0, threshold, metric: 'mean' };
  }

  const relative = (currentMean - priorMean) / priorMean;
  const magnitude = Math.abs(relative);
  if (magnitude < threshold) {
    return { direction: 'flat', magnitude, threshold, metric: 'mean' };
  }

  // 'larger': increase = up; 'smaller': decrease = up.
  const improving = characteristicType === 'larger' ? relative > 0 : relative < 0;
  return { direction: improving ? 'up' : 'down', magnitude, threshold, metric: 'mean' };
}

function nominalMeanDrift(
  currentMean: number,
  priorMean: number,
  target: number,
  threshold: number
): DriftResult {
  const priorDistance = Math.abs(priorMean - target);
  const currentDistance = Math.abs(currentMean - target);

  if (priorDistance === 0) {
    // Prior was exactly on target — no baseline distance to compare against.
    return { direction: 'flat', magnitude: 0, threshold, metric: 'mean' };
  }

  const relative = (currentDistance - priorDistance) / priorDistance;
  const magnitude = Math.abs(relative);
  if (magnitude < threshold) {
    return { direction: 'flat', magnitude, threshold, metric: 'mean' };
  }

  // Smaller distance = improvement. relative < 0 ⇒ up.
  return { direction: relative < 0 ? 'up' : 'down', magnitude, threshold, metric: 'mean' };
}
```

- [ ] **Step 4: Re-export from `canvas/index.ts`**

```typescript
// packages/core/src/canvas/index.ts (append to existing exports)
export {
  computeStepDrift,
  STEP_DRIFT_DEFAULT_THRESHOLD,
  type DriftResult,
  type StepCapabilityStamp,
  type ComputeStepDriftArgs,
} from './stepDrift';
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
pnpm --filter @variscout/core test stepDrift
```

Expected: PASS — all 16 cases green.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/canvas/stepDrift.ts \
        packages/core/src/canvas/__tests__/stepDrift.test.ts \
        packages/core/src/canvas/index.ts
git commit -m "feat(core/canvas): add computeStepDrift helper for canvas step drift indicator

Pure direction-of-improvement-aware drift calculator. Sign convention:
'up' = improvement, 'down' = degradation, 'flat' = within threshold (default 0.05).
Cpk-first metric selection; mean fallback is characteristicType-aware (larger /
smaller / nominal-with-target). Returns null when neither metric is comparable
or when 'nominal' lacks a target.

Advances vision §5.2 — drift indicator engine layer."
```

---

## Task 2: Type — `EvidenceSnapshot.stepCapabilities`

**Files:**

- Modify: `packages/core/src/evidenceSources.ts`
- Modify: `packages/core/src/__tests__/evidenceSources.test.ts`

- [ ] **Step 1: Write the failing test**

Add at the bottom of `packages/core/src/__tests__/evidenceSources.test.ts`:

```typescript
import type { EvidenceSnapshot, StepCapabilityStamp } from '../evidenceSources';
// (StepCapabilityStamp also re-exported from '../canvas' — both forms must compile.)

describe('EvidenceSnapshot.stepCapabilities (slice 4 — consumer surface only)', () => {
  it('round-trips through JSON.stringify when the field is populated', () => {
    const stamps: StepCapabilityStamp[] = [
      { stepId: 'mix', n: 32, mean: 100.4, sigma: 1.2, cpk: 1.45 },
      { stepId: 'fill', n: 28, mean: 50.1, sigma: 0.8 },
    ];
    const snap: EvidenceSnapshot = {
      id: 'snap-1',
      hubId: 'hub-1',
      sourceId: 'src-1',
      capturedAt: '2026-05-07T00:00:00.000Z',
      rowCount: 60,
      origin: 'paste:hub-1',
      importedAt: 1746576000000,
      createdAt: 1746576000000,
      deletedAt: null,
      stepCapabilities: stamps,
    };
    const round = JSON.parse(JSON.stringify(snap)) as EvidenceSnapshot;
    expect(round.stepCapabilities).toEqual(stamps);
  });

  it('round-trips when the field is undefined (omitted) — preserves backwards compatibility', () => {
    const snap: EvidenceSnapshot = {
      id: 'snap-2',
      hubId: 'hub-1',
      sourceId: 'src-1',
      capturedAt: '2026-05-07T00:00:00.000Z',
      rowCount: 0,
      origin: 'paste:hub-1',
      importedAt: 1746576000000,
      createdAt: 1746576000000,
      deletedAt: null,
    };
    const round = JSON.parse(JSON.stringify(snap)) as EvidenceSnapshot;
    expect(round.stepCapabilities).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/core test evidenceSources
```

Expected: FAIL — type error or runtime mismatch on `stepCapabilities`.

- [ ] **Step 3: Add field on `EvidenceSnapshot` (single source of truth — re-import the type)**

`StepCapabilityStamp` is the canonical type, defined in `canvas/stepDrift.ts` (Task 1). `evidenceSources.ts` **imports** it; do NOT redeclare. At the top of `packages/core/src/evidenceSources.ts`, add:

```typescript
import type { StepCapabilityStamp } from './canvas/stepDrift';
// Optional re-export so external callers can write `import type { StepCapabilityStamp } from '@variscout/core/evidenceSources';`
export type { StepCapabilityStamp } from './canvas/stepDrift';
```

Then, inside the `EvidenceSnapshot` interface declaration, add the field at the end (just before the closing `}`):

```typescript
  /**
   * Per-step capability stamps for canvas drift comparison.
   *
   * Optional. Producer-side wiring is DEFERRED — slice 4 (canvas PR8 8b) ships
   * the consumer surface only. Until a follow-up slice stamps this field at
   * snapshot-create time, every snapshot carries `stepCapabilities === undefined`,
   * and the canvas drift indicator stays inert.
   *
   * Read shape: `ReadonlyArray<StepCapabilityStamp>`. Writers should deep-copy
   * if mutability is needed at the persistence layer.
   *
   * JSON-safe — round-trips cleanly through JSON.stringify / JSON.parse.
   */
  stepCapabilities?: ReadonlyArray<StepCapabilityStamp>;
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm --filter @variscout/core test evidenceSources
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/evidenceSources.ts \
        packages/core/src/__tests__/evidenceSources.test.ts
git commit -m "feat(core): add EvidenceSnapshot.stepCapabilities for canvas drift consumer

Optional ReadonlyArray<StepCapabilityStamp> on EvidenceSnapshot. Slice 4 ships
the consumer surface only; producer-side stamping is deferred to a follow-up
slice (partial-integration policy, feedback_partial_integration_policy).

Field is JSON-safe and backwards-compatible (undefined preserved).

Advances vision §5.2 — drift indicator type layer."
```

---

## Task 3: Hook — `useCanvasStepCards` extension (drift + numericRenderHint + timeSeriesPoints)

**Files:**

- Modify: `packages/hooks/src/useCanvasStepCards.ts`
- Modify: `packages/hooks/src/__tests__/useCanvasStepCards.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `packages/hooks/src/__tests__/useCanvasStepCards.test.ts`:

```typescript
import { buildCanvasStepCards } from '../useCanvasStepCards';
import {
  NUMERIC_TIME_SERIES_DISTINCT_THRESHOLD,
  SPARKLINE_LTTB_THRESHOLD,
} from '@variscout/core/canvas';
import type { StepCapabilityStamp } from '@variscout/core';

describe('drift integration', () => {
  const measureSpecs: Record<string, SpecLimits> = {
    Temperature: { lsl: 95, usl: 105, target: 100, characteristicType: 'nominal' },
  };

  it('does not stamp drift when priorStepStats is undefined', () => {
    const cards = buildCanvasStepCards({
      map: baseMap(),
      rows,
      measureSpecs,
    });
    expect(cards[0].drift).toBeUndefined();
  });

  it('does not stamp drift when priorStepStats has no entry for the step', () => {
    const cards = buildCanvasStepCards({
      map: baseMap(),
      rows,
      measureSpecs,
      priorStepStats: new Map(),
    });
    expect(cards[0].drift).toBeUndefined();
  });

  it('stamps drift when the step has a prior stat AND the metric is comparable', () => {
    // Force the step's current cpk to be ≈1.50 by using a tight spread.
    const tightRows: DataRow[] = Array.from({ length: 30 }, (_, i) => ({
      Temperature: 100 + (i % 2 === 0 ? 0.5 : -0.5),
      Pressure: 50,
      Machine: 'A',
      Operator: 'Jill',
    }));
    const prior = new Map<string, StepCapabilityStamp>([
      ['mix', { stepId: 'mix', n: 30, mean: 110, cpk: 1.1 }],
    ]);
    const cards = buildCanvasStepCards({
      map: baseMap(),
      rows: tightRows,
      measureSpecs,
      priorStepStats: prior,
    });
    expect(cards[0].drift).toBeDefined();
    expect(cards[0].drift?.metric).toBe('cpk');
    expect(['up', 'down', 'flat']).toContain(cards[0].drift?.direction);
  });
});

describe('numeric render hint + time-series points', () => {
  it('exports a distinct-count threshold of 30', () => {
    expect(NUMERIC_TIME_SERIES_DISTINCT_THRESHOLD).toBe(30);
  });

  it('exports an LTTB threshold of 100', () => {
    expect(SPARKLINE_LTTB_THRESHOLD).toBe(100);
  });

  it('marks numeric cards with ≤30 distinct values as histogram', () => {
    // baseMap rows have ≤6 distinct values per column — well under 30.
    const cards = buildCanvasStepCards({
      map: baseMap(),
      rows,
      measureSpecs: {},
    });
    expect(cards[0].metricKind).toBe('numeric');
    expect(cards[0].numericRenderHint).toBe('histogram');
    expect(cards[0].timeSeriesPoints).toBeUndefined();
  });

  it('marks numeric cards with >30 distinct values as time-series', () => {
    const wideRows: DataRow[] = Array.from({ length: 40 }, (_, i) => ({
      Temperature: 100 + i * 0.1, // 40 distinct values
      Pressure: 50,
      Machine: 'A',
      Operator: 'Jill',
    }));
    const cards = buildCanvasStepCards({
      map: baseMap(),
      rows: wideRows,
      measureSpecs: {},
    });
    expect(cards[0].numericRenderHint).toBe('time-series');
    expect(cards[0].timeSeriesPoints).toBeDefined();
    expect(cards[0].timeSeriesPoints!.length).toBe(40);
  });

  it('orders time-series points by parser-detected time column when present', () => {
    const timestampRows: DataRow[] = [
      {
        Timestamp: '2026-01-03T00:00:00Z',
        Temperature: 102.3,
        Pressure: 50,
        Machine: 'A',
        Operator: 'Jill',
      },
      {
        Timestamp: '2026-01-01T00:00:00Z',
        Temperature: 100.1,
        Pressure: 50,
        Machine: 'A',
        Operator: 'Jill',
      },
      {
        Timestamp: '2026-01-02T00:00:00Z',
        Temperature: 101.2,
        Pressure: 50,
        Machine: 'A',
        Operator: 'Jill',
      },
    ];
    // Make Temperature high-cardinality.
    const wide: DataRow[] = [
      ...timestampRows,
      ...Array.from({ length: 35 }, (_, i) => ({
        Timestamp: `2026-01-${String(i + 4).padStart(2, '0')}T00:00:00Z`,
        Temperature: 100 + i * 0.1,
        Pressure: 50,
        Machine: 'A',
        Operator: 'Jill',
      })),
    ];
    const cards = buildCanvasStepCards({
      map: baseMap(),
      rows: wide,
      measureSpecs: {},
    });
    const points = cards[0].timeSeriesPoints!;
    // First three rows out-of-order should be re-sorted ascending by parsed time.
    expect(points[0].y).toBeCloseTo(100.1, 5);
    expect(points[1].y).toBeCloseTo(101.2, 5);
    expect(points[2].y).toBeCloseTo(102.3, 5);
  });

  it('falls back to row-index ordering when no time column is detected', () => {
    const wideRows: DataRow[] = Array.from({ length: 40 }, (_, i) => ({
      Temperature: 100 + i * 0.1,
      Pressure: 50,
      Machine: 'A',
      Operator: 'Jill',
    }));
    const cards = buildCanvasStepCards({
      map: baseMap(),
      rows: wideRows,
      measureSpecs: {},
    });
    const points = cards[0].timeSeriesPoints!;
    expect(points[0].x).toBe(0);
    expect(points[1].x).toBe(1);
    expect(points[39].x).toBe(39);
    expect(points[0].y).toBeCloseTo(100, 5);
    expect(points[39].y).toBeCloseTo(103.9, 5);
  });

  it('downsamples to 100 points when input >100 via LTTB', () => {
    const wideRows: DataRow[] = Array.from({ length: 250 }, (_, i) => ({
      Temperature: 100 + Math.sin(i / 5) * 5,
      Pressure: 50,
      Machine: 'A',
      Operator: 'Jill',
    }));
    const cards = buildCanvasStepCards({
      map: baseMap(),
      rows: wideRows,
      measureSpecs: {},
    });
    expect(cards[0].timeSeriesPoints!.length).toBeLessThanOrEqual(100);
    expect(cards[0].timeSeriesPoints!.length).toBeGreaterThanOrEqual(98);
  });

  it('does not compute timeSeriesPoints when render hint is histogram', () => {
    const cards = buildCanvasStepCards({
      map: baseMap(),
      rows,
      measureSpecs: {},
    });
    expect(cards[0].numericRenderHint).toBe('histogram');
    expect(cards[0].timeSeriesPoints).toBeUndefined();
  });

  it('does not assign a render hint for non-numeric cards', () => {
    const categoricalCards = buildCanvasStepCards({
      map: {
        ...baseMap(),
        assignments: { Operator: 'pack' },
      },
      rows,
      measureSpecs: {},
    });
    const packCard = categoricalCards.find(c => c.stepId === 'pack')!;
    expect(packCard.metricKind).toBe('categorical');
    expect(packCard.numericRenderHint).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter @variscout/hooks test useCanvasStepCards
```

Expected: FAIL — `numericRenderHint`, `timeSeriesPoints`, `drift`, `priorStepStats`, `NUMERIC_TIME_SERIES_DISTINCT_THRESHOLD`, `SPARKLINE_LTTB_THRESHOLD` all unrecognized.

- [ ] **Step 3: Add constants to `@variscout/core/canvas`**

Append to `packages/core/src/canvas/index.ts`:

```typescript
export const NUMERIC_TIME_SERIES_DISTINCT_THRESHOLD = 30;
export const SPARKLINE_LTTB_THRESHOLD = 100;
```

- [ ] **Step 4: Extend `useCanvasStepCards` types + builder**

Edit `packages/hooks/src/useCanvasStepCards.ts`:

```typescript
// Update top-of-file imports:
import { useMemo } from 'react';
import {
  calculateStats,
  type DataRow,
  type SpecLimits,
  type StatsResult,
  inferCharacteristicType,
} from '@variscout/core';
import { gradeCpk, type CpkGrade } from '@variscout/core/capability';
import { lttb, sampleConfidenceFor } from '@variscout/core/stats';
import {
  NUMERIC_TIME_SERIES_DISTINCT_THRESHOLD,
  SPARKLINE_LTTB_THRESHOLD,
  computeStepDrift,
  type DriftResult,
  type StepCapabilityStamp,
} from '@variscout/core/canvas';
import { detectColumns } from '@variscout/core/parser';
import { parseTimeValue } from '@variscout/core/time';
import type { ProcessMap } from '@variscout/core/frame';
```

Extend `CanvasStepCardModel`:

```typescript
export interface CanvasStepCardModel {
  stepId: string;
  stepName: string;
  parentStepId?: string | null;
  assignedColumns: string[];
  metricColumn?: string;
  metricKind: CanvasStepMetricKind;
  values: number[];
  distribution: CanvasStepCategory[];
  stats?: StatsResult;
  specs?: SpecLimits;
  capability: CanvasStepCapability;
  capabilityNode?: CanvasCapabilityNodeProjection;
  defectCount?: number;

  /** Drift vs the most-recent prior snapshot. Undefined when no prior stamp exists for this step. */
  drift?: DriftResult;

  /**
   * Render-hint for numeric cards. `'histogram'` for low-cardinality (≤30 distinct
   * values); `'time-series'` for high-cardinality. Undefined for non-numeric cards.
   */
  numericRenderHint?: 'histogram' | 'time-series';

  /**
   * Pre-computed sparkline points, only populated when `numericRenderHint === 'time-series'`.
   * Ordered ascending by parser-detected `timeColumn` when present; row-index fallback
   * otherwise. LTTB-downsampled to ≤100 points.
   */
  timeSeriesPoints?: ReadonlyArray<{ x: number; y: number }>;
}
```

Extend args:

```typescript
export interface BuildCanvasStepCardsArgs {
  map: ProcessMap;
  rows: readonly DataRow[];
  measureSpecs: Record<string, SpecLimits>;
  capabilityNodes?: readonly CanvasCapabilityNodeProjection[];
  errorSteps?: readonly CanvasStepErrorProjection[];
  /**
   * Per-step prior-snapshot capability stamps for drift comparison. When absent or
   * empty, no card receives a `drift` field. Producer-side stamping deferred to a
   * separate slice (partial-integration policy).
   */
  priorStepStats?: ReadonlyMap<string, StepCapabilityStamp>;
}
```

Add helpers BELOW the existing `valuesForColumn` helper:

```typescript
function distinctCountForColumn(rows: readonly DataRow[], column: string): number {
  const seen = new Set<unknown>();
  for (const row of rows) {
    const v = row[column];
    if (v === null || v === undefined || v === '') continue;
    const n = typeof v === 'number' ? v : Number(v);
    if (Number.isFinite(n)) seen.add(n);
  }
  return seen.size;
}

/**
 * Build (x, y) sparkline points ordered by parser-detected `timeColumn` when
 * present; row-index fallback otherwise. Downsampled to ≤ SPARKLINE_LTTB_THRESHOLD
 * points via LTTB.
 */
function buildTimeSeriesPoints({
  rows,
  metricColumn,
  timeColumn,
}: {
  rows: readonly DataRow[];
  metricColumn: string;
  timeColumn: string | null;
}): ReadonlyArray<{ x: number; y: number }> {
  const raw: { x: number; y: number; originalIndex: number }[] = [];

  rows.forEach((row, index) => {
    const yRaw = row[metricColumn];
    const y = typeof yRaw === 'number' ? yRaw : Number(yRaw);
    if (!Number.isFinite(y)) return;

    if (timeColumn) {
      const date = parseTimeValue(row[timeColumn]);
      const x = date ? date.getTime() : NaN;
      if (Number.isFinite(x)) {
        raw.push({ x, y, originalIndex: index });
        return;
      }
    }
    // Fallback: row-index ordering.
    raw.push({ x: index, y, originalIndex: index });
  });

  raw.sort((a, b) => a.x - b.x);

  if (raw.length <= SPARKLINE_LTTB_THRESHOLD) {
    return raw.map(({ x, y }) => ({ x, y }));
  }

  const sampled = lttb(raw, SPARKLINE_LTTB_THRESHOLD);
  return sampled.map(({ x, y }) => ({ x, y }));
}

function characteristicTypeFor(
  specs: SpecLimits | undefined
): ReturnType<typeof inferCharacteristicType> {
  if (!specs) return 'nominal'; // matches inferCharacteristicType empty-spec fallback
  return inferCharacteristicType(specs);
}
```

Replace the body of `buildCanvasStepCards` to thread the new fields:

```typescript
export function buildCanvasStepCards({
  map,
  rows,
  measureSpecs,
  capabilityNodes = [],
  errorSteps = [],
  priorStepStats,
}: BuildCanvasStepCardsArgs): CanvasStepCardModel[] {
  const assignedByStep = columnsByStep(map);
  const detected = rows.length > 0 ? detectColumns([...rows]) : null;
  const timeColumn = detected?.timeColumn ?? null;

  return [...map.nodes]
    .sort((a, b) => a.order - b.order)
    .map(node => {
      const assignedColumns = assignedByStep.get(node.id) ?? [];
      const metricColumn = metricColumnFor({ ctqColumn: node.ctqColumn, assignedColumns, rows });
      const values = metricColumn ? valuesForColumn(rows, metricColumn) : [];
      const metricKind: CanvasStepMetricKind =
        metricColumn === undefined ? 'empty' : values.length > 0 ? 'numeric' : 'categorical';
      const specs = metricColumn ? measureSpecs[metricColumn] : undefined;
      const stats =
        metricKind === 'numeric' ? calculateStats(values, specs?.usl, specs?.lsl) : undefined;
      const distribution =
        metricKind === 'categorical' && metricColumn
          ? distributionForColumn(rows, metricColumn)
          : [];
      const capabilityNode = capabilityNodes.find(entry => entry.nodeId === node.id);
      const defectCount = errorSteps.find(entry => entry.nodeId === node.id)?.errorCount;

      // Numeric render hint + sparkline points.
      let numericRenderHint: CanvasStepCardModel['numericRenderHint'];
      let timeSeriesPoints: CanvasStepCardModel['timeSeriesPoints'];
      if (metricKind === 'numeric' && metricColumn) {
        const distinctCount = distinctCountForColumn(rows, metricColumn);
        if (distinctCount > NUMERIC_TIME_SERIES_DISTINCT_THRESHOLD) {
          numericRenderHint = 'time-series';
          timeSeriesPoints = buildTimeSeriesPoints({ rows, metricColumn, timeColumn });
        } else {
          numericRenderHint = 'histogram';
        }
      }

      // Drift stamp.
      let drift: DriftResult | undefined;
      const priorStamp = priorStepStats?.get(node.id);
      if (priorStamp && stats) {
        const characteristicType = characteristicTypeFor(specs);
        const result = computeStepDrift({
          current: {
            stepId: node.id,
            n: values.length,
            mean: stats.mean,
            sigma: stats.stdDev,
            cpk: stats.cpk,
          },
          prior: priorStamp,
          characteristicType,
          target: specs?.target,
        });
        if (result) drift = result;
      }

      return {
        stepId: node.id,
        stepName: node.name,
        parentStepId: node.parentStepId,
        assignedColumns,
        metricColumn,
        metricKind,
        values,
        distribution,
        stats,
        specs,
        capability: capabilityFor({ values, stats, specs }),
        capabilityNode,
        defectCount,
        drift,
        numericRenderHint,
        timeSeriesPoints,
      };
    });
}
```

Update the `useCanvasStepCards` hook deps:

```typescript
export function useCanvasStepCards(args: UseCanvasStepCardsArgs): UseCanvasStepCardsResult {
  const cards = useMemo(
    () => buildCanvasStepCards(args),
    [
      args.map,
      args.rows,
      args.measureSpecs,
      args.capabilityNodes,
      args.errorSteps,
      args.priorStepStats,
    ]
  );

  return { cards };
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
pnpm --filter @variscout/core test
pnpm --filter @variscout/hooks test useCanvasStepCards
```

Expected: PASS — original tests + new drift / render-hint cases.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/canvas/index.ts \
        packages/hooks/src/useCanvasStepCards.ts \
        packages/hooks/src/__tests__/useCanvasStepCards.test.ts
git commit -m "feat(hooks): wire drift + numericRenderHint + timeSeriesPoints on canvas step cards

useCanvasStepCards now accepts an optional priorStepStats Map and stamps
card.drift via computeStepDrift. For numeric cards, the hook also computes
numericRenderHint ('histogram' | 'time-series') based on distinct-count > 30,
and pre-builds LTTB-downsampled timeSeriesPoints ordered by parser-detected
timeColumn (row-index fallback).

Constants exposed at @variscout/core/canvas:
- NUMERIC_TIME_SERIES_DISTINCT_THRESHOLD = 30
- SPARKLINE_LTTB_THRESHOLD = 100

Advances vision §5.2 — drift indicator + time-series mini-chart hook layer."
```

---

## Task 4: UI — `CanvasStepDriftIndicator` component

**Files:**

- Create: `packages/ui/src/components/Canvas/internal/CanvasStepDriftIndicator.tsx`
- Create: `packages/ui/src/components/Canvas/internal/__tests__/CanvasStepDriftIndicator.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// packages/ui/src/components/Canvas/internal/__tests__/CanvasStepDriftIndicator.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { DriftResult } from '@variscout/core';
import { CanvasStepDriftIndicator } from '../CanvasStepDriftIndicator';

const drift = (overrides: Partial<DriftResult>): DriftResult => ({
  direction: 'up',
  magnitude: 0.07,
  threshold: 0.05,
  metric: 'cpk',
  ...overrides,
});

describe('CanvasStepDriftIndicator', () => {
  it('renders nothing when drift is undefined', () => {
    const { container } = render(<CanvasStepDriftIndicator drift={undefined} stepLabel="Mix" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders an up arrow with magnitude % when direction is up', () => {
    render(<CanvasStepDriftIndicator drift={drift({ direction: 'up', magnitude: 0.07 })} stepLabel="Mix" />);
    const node = screen.getByTestId('canvas-step-drift-indicator-Mix');
    expect(node).toHaveTextContent('▲');
    expect(node).toHaveTextContent('7%');
    expect(node.getAttribute('aria-label')).toMatch(/improv/i);
  });

  it('renders a down arrow when direction is down', () => {
    render(<CanvasStepDriftIndicator drift={drift({ direction: 'down', magnitude: 0.12 })} stepLabel="Mix" />);
    const node = screen.getByTestId('canvas-step-drift-indicator-Mix');
    expect(node).toHaveTextContent('▼');
    expect(node).toHaveTextContent('12%');
    expect(node.getAttribute('aria-label')).toMatch(/degrad/i);
  });

  it('renders a flat indicator with no magnitude when direction is flat', () => {
    render(<CanvasStepDriftIndicator drift={drift({ direction: 'flat', magnitude: 0.01 })} stepLabel="Mix" />);
    const node = screen.getByTestId('canvas-step-drift-indicator-Mix');
    expect(node).toHaveTextContent('→');
    expect(node).not.toHaveTextContent('%');
  });

  it('uses status-pass styling for up', () => {
    render(<CanvasStepDriftIndicator drift={drift({ direction: 'up' })} stepLabel="Mix" />);
    const node = screen.getByTestId('canvas-step-drift-indicator-Mix');
    expect(node.className).toMatch(/status-pass/);
  });

  it('uses status-fail styling for down', () => {
    render(<CanvasStepDriftIndicator drift={drift({ direction: 'down' })} stepLabel="Mix" />);
    const node = screen.getByTestId('canvas-step-drift-indicator-Mix');
    expect(node.className).toMatch(/status-fail/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test CanvasStepDriftIndicator
```

Expected: FAIL — `Cannot find module '../CanvasStepDriftIndicator'`.

- [ ] **Step 3: Implement the component**

```typescript
// packages/ui/src/components/Canvas/internal/CanvasStepDriftIndicator.tsx
import React from 'react';
import type { DriftResult } from '@variscout/core';

interface CanvasStepDriftIndicatorProps {
  drift: DriftResult | undefined;
  stepLabel: string;
}

const ARROW_BY_DIRECTION: Record<DriftResult['direction'], string> = {
  up: '▲',
  down: '▼',
  flat: '→',
};

const STYLE_BY_DIRECTION: Record<DriftResult['direction'], string> = {
  up: 'bg-status-pass-soft text-status-pass',
  down: 'bg-status-fail-soft text-status-fail',
  flat: 'bg-surface-secondary text-content-secondary',
};

const ARIA_BY_DIRECTION: Record<DriftResult['direction'], string> = {
  up: 'improving',
  down: 'degrading',
  flat: 'stable',
};

export const CanvasStepDriftIndicator: React.FC<CanvasStepDriftIndicatorProps> = ({
  drift,
  stepLabel,
}) => {
  if (!drift) return null;

  const arrow = ARROW_BY_DIRECTION[drift.direction];
  const styles = STYLE_BY_DIRECTION[drift.direction];
  const ariaState = ARIA_BY_DIRECTION[drift.direction];

  // Format magnitude as integer % at the display boundary (B3 of three-boundary
  // numeric safety). We don't go through formatStatistic here because magnitude
  // is already a non-negative finite decimal in the engine's contract.
  const showMagnitude = drift.direction !== 'flat';
  const magnitudePercent = Math.round(drift.magnitude * 100);

  return (
    <span
      data-testid={`canvas-step-drift-indicator-${stepLabel}`}
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${styles}`}
      aria-label={`${stepLabel} ${ariaState}${showMagnitude ? ` ${magnitudePercent}%` : ''}`}
      title={`${ariaState}${showMagnitude ? ` (${magnitudePercent}%)` : ''} via ${drift.metric}`}
    >
      <span aria-hidden="true">{arrow}</span>
      {showMagnitude ? <span>{magnitudePercent}%</span> : null}
    </span>
  );
};
```

- [ ] **Step 4: Wire it into `CanvasStepCard.tsx`**

In `packages/ui/src/components/Canvas/internal/CanvasStepCard.tsx`:

Top imports:

```typescript
import { CanvasStepDriftIndicator } from './CanvasStepDriftIndicator';
```

Inside the card render, in the badge row that currently renders the capability pill (right after the `{showCapability ? ...}` block), add:

```typescript
        {showCapability ? (
          <CanvasStepDriftIndicator drift={card.drift} stepLabel={card.stepName} />
        ) : null}
```

(Place it AFTER the existing capability `<span>` element so it sits next to the capability pill.)

- [ ] **Step 5: Run tests to verify they pass**

```bash
pnpm --filter @variscout/ui test CanvasStepDriftIndicator
pnpm --filter @variscout/ui test CanvasStepCard
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/components/Canvas/internal/CanvasStepDriftIndicator.tsx \
        packages/ui/src/components/Canvas/internal/__tests__/CanvasStepDriftIndicator.test.tsx \
        packages/ui/src/components/Canvas/internal/CanvasStepCard.tsx
git commit -m "feat(ui/canvas): render per-step drift arrow next to capability badge

CanvasStepDriftIndicator renders ▲ / ▼ / → with magnitude % and status-pass /
status-fail / muted styling. Arrow shape is the primary signal; color is
secondary (avoids color-only signaling per H6).

Mounted in CanvasStepCard alongside the capability pill, gated on the same
showCapability condition so cadence + capability lenses both see drift while
defect-only views suppress it.

Advances vision §5.2 — drift indicator UI."
```

---

## Task 5: UI — Sparkline branch on `CanvasStepMiniChart`

**Files:**

- Modify: `packages/ui/src/components/Canvas/internal/CanvasStepMiniChart.tsx`
- Create: `packages/ui/src/components/Canvas/internal/__tests__/CanvasStepMiniChart.test.tsx` (if absent)

- [ ] **Step 1: Write the failing test**

```typescript
// packages/ui/src/components/Canvas/internal/__tests__/CanvasStepMiniChart.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CanvasStepCardModel } from '@variscout/hooks';
import { CanvasStepMiniChart } from '../CanvasStepMiniChart';

const numericCard = (overrides: Partial<CanvasStepCardModel> = {}): CanvasStepCardModel => ({
  stepId: 'mix',
  stepName: 'Mix',
  assignedColumns: ['Temperature'],
  metricColumn: 'Temperature',
  metricKind: 'numeric',
  values: [99, 100, 101],
  distribution: [],
  capability: { state: 'no-specs', n: 3, canAddSpecs: true },
  ...overrides,
});

describe('CanvasStepMiniChart — time-series branch', () => {
  it('renders the histogram branch when numericRenderHint is histogram', () => {
    render(
      <CanvasStepMiniChart
        card={numericCard({ numericRenderHint: 'histogram' })}
      />
    );
    expect(screen.getByTestId('canvas-step-mini-chart-mix')).toBeInTheDocument();
    expect(screen.queryByTestId('canvas-step-mini-chart-mix-sparkline')).not.toBeInTheDocument();
  });

  it('renders an SVG polyline sparkline when numericRenderHint is time-series', () => {
    const points = Array.from({ length: 40 }, (_, i) => ({ x: i, y: 100 + i * 0.1 }));
    render(
      <CanvasStepMiniChart
        card={numericCard({ numericRenderHint: 'time-series', timeSeriesPoints: points })}
      />
    );
    const sparkline = screen.getByTestId('canvas-step-mini-chart-mix-sparkline');
    expect(sparkline).toBeInTheDocument();
    const polyline = sparkline.querySelector('polyline');
    expect(polyline).not.toBeNull();
    // 40 points, x in viewBox should span 0..100 (or 0..1, depending on impl).
    const pointsAttr = polyline?.getAttribute('points') ?? '';
    expect(pointsAttr.split(/\s+/).filter(Boolean).length).toBe(40);
  });

  it('renders a friendly empty branch when numericRenderHint is time-series but timeSeriesPoints is empty', () => {
    render(
      <CanvasStepMiniChart
        card={numericCard({ numericRenderHint: 'time-series', timeSeriesPoints: [] })}
      />
    );
    expect(screen.getByTestId('canvas-step-mini-chart-mix')).toHaveTextContent(/no.*points/i);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter @variscout/ui test CanvasStepMiniChart
```

Expected: FAIL — sparkline branch absent.

- [ ] **Step 3: Add the third branch**

Replace the entire body of `packages/ui/src/components/Canvas/internal/CanvasStepMiniChart.tsx`:

```typescript
import React from 'react';
import { chartColors } from '@variscout/charts';
import type { CanvasStepCardModel } from '@variscout/hooks';

interface CanvasStepMiniChartProps {
  card: CanvasStepCardModel;
}

const SPARK_WIDTH = 100; // viewBox width — semantic units, not pixels
const SPARK_HEIGHT = 32;

function numericBars(values: readonly number[]): number[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return values.slice(0, 12).map(() => 0.5);
  return values.slice(0, 12).map(value => (value - min) / (max - min));
}

function sparklinePoints(points: ReadonlyArray<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const xRange = maxX - minX || 1;
  const yRange = maxY - minY || 1;

  // 1px top/bottom padding inside the SVG viewBox so peaks aren't clipped.
  const yPad = 1;
  const yPlot = SPARK_HEIGHT - yPad * 2;

  return points
    .map(p => {
      const sx = ((p.x - minX) / xRange) * SPARK_WIDTH;
      // Invert y — SVG y grows downward.
      const sy = yPad + yPlot - ((p.y - minY) / yRange) * yPlot;
      return `${sx.toFixed(2)},${sy.toFixed(2)}`;
    })
    .join(' ');
}

export const CanvasStepMiniChart: React.FC<CanvasStepMiniChartProps> = ({ card }) => {
  // Time-series branch — high-cardinality numeric column.
  if (card.metricKind === 'numeric' && card.numericRenderHint === 'time-series') {
    const points = card.timeSeriesPoints ?? [];
    if (points.length === 0) {
      return (
        <div
          className="flex h-10 items-center text-xs text-content-muted"
          data-testid={`canvas-step-mini-chart-${card.stepId}`}
        >
          No time-series points
        </div>
      );
    }
    return (
      <div
        className="flex h-10 items-center"
        aria-label={`${card.stepName} time-series sparkline`}
        data-testid={`canvas-step-mini-chart-${card.stepId}`}
      >
        <svg
          viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`}
          width="100%"
          height={SPARK_HEIGHT}
          preserveAspectRatio="none"
          data-testid={`canvas-step-mini-chart-${card.stepId}-sparkline`}
          role="img"
        >
          <polyline
            fill="none"
            stroke={chartColors.mean}
            strokeWidth={1}
            points={sparklinePoints(points)}
          />
        </svg>
      </div>
    );
  }

  // Histogram branch (existing). Sturges/Scott binning improvement deferred.
  if (card.metricKind === 'numeric') {
    const bars = numericBars(card.values);
    return (
      <div
        className="flex h-10 items-end gap-0.5"
        aria-label={`${card.stepName} numeric distribution`}
        data-testid={`canvas-step-mini-chart-${card.stepId}`}
      >
        {bars.length > 0 ? (
          bars.map((height, index) => (
            <span
              key={`${card.stepId}-bar-${index}`}
              className="w-full rounded-sm"
              style={{
                backgroundColor: `${chartColors.mean}99`,
                height: `${Math.max(15, height * 100)}%`,
              }}
            />
          ))
        ) : (
          <span className="text-xs text-content-muted">No numeric values</span>
        )}
      </div>
    );
  }

  if (card.metricKind === 'categorical') {
    const max = Math.max(1, ...card.distribution.map(item => item.count));
    return (
      <div
        className="flex h-10 flex-col justify-end gap-1"
        aria-label={`${card.stepName} categorical distribution`}
        data-testid={`canvas-step-mini-chart-${card.stepId}`}
      >
        {card.distribution.slice(0, 3).map(item => (
          <div key={item.label} className="flex items-center gap-1 text-[11px] text-content-muted">
            <span className="w-12 truncate">{item.label}</span>
            <span
              className="h-1.5 rounded-full"
              style={{
                backgroundColor: `${chartColors.warning}b3`,
                width: `${Math.max(12, (item.count / max) * 72)}px`,
              }}
            />
            <span>{item.count}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="flex h-10 items-center text-xs text-content-muted"
      data-testid={`canvas-step-mini-chart-${card.stepId}`}
    >
      No mapped metric
    </div>
  );
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm --filter @variscout/ui test CanvasStepMiniChart
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/internal/CanvasStepMiniChart.tsx \
        packages/ui/src/components/Canvas/internal/__tests__/CanvasStepMiniChart.test.tsx
git commit -m "feat(ui/canvas): add time-series sparkline branch to CanvasStepMiniChart

Third render branch for high-cardinality numeric columns: inline SVG polyline
sparkline using LTTB-downsampled timeSeriesPoints. Theme-aware via chartColors.
Histogram branch (Sturges/Scott binning) intentionally untouched — deferred to
its own follow-up entry.

Advances vision §5.2 — time-series mini-chart UI."
```

---

## Task 6: Thread `priorStepStats` through `CanvasWorkspace` + `Canvas`

**Files:**

- Modify: `packages/ui/src/components/Canvas/CanvasWorkspace.tsx`
- Modify: `packages/ui/src/components/Canvas/index.tsx`
- Modify: `packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx`

- [ ] **Step 1: Write the failing test**

Open `packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx` and read the existing top-of-file fixture (the rows + map currently used by passing tests in this file). Reuse those exact fixtures when adding the new case below. If the file does NOT already define a fixture builder, inline the props as-shown.

Append (with `import type { StepCapabilityStamp } from '@variscout/core';` near the top imports if not already present):

```typescript
it('passes priorStepStats through and renders the drift indicator on a matching step', () => {
  const rawData = Array.from({ length: 30 }, (_, i) => ({
    Temperature: 100 + (i % 2 === 0 ? 0.4 : -0.4),
    Pressure: 50,
    Machine: 'A',
    Operator: 'Jill',
  }));
  const measureSpecs = {
    Temperature: { lsl: 95, usl: 105, target: 100, characteristicType: 'nominal' as const },
  };
  const processContext = {
    processMap: {
      version: 1 as const,
      nodes: [
        { id: 'mix', name: 'Mix', order: 0, ctqColumn: 'Temperature' },
      ],
      tributaries: [],
      assignments: { Machine: 'mix' },
      createdAt: '2026-05-07T00:00:00.000Z',
      updatedAt: '2026-05-07T00:00:00.000Z',
    },
  };
  const priorStepStats = new Map<string, StepCapabilityStamp>([
    ['mix', { stepId: 'mix', n: 30, mean: 110, cpk: 0.30 }],
  ]);

  const noop = () => {};
  render(
    <CanvasWorkspace
      rawData={rawData}
      outcome="Temperature"
      factors={[]}
      measureSpecs={measureSpecs}
      processContext={processContext}
      setOutcome={noop}
      setFactors={noop}
      setMeasureSpec={noop}
      setProcessContext={noop}
      onSeeData={noop}
      signals={{ hasIntervention: false, sustainmentConfirmed: false }}
      priorStepStats={priorStepStats}
    />
  );

  expect(screen.queryByTestId('canvas-step-drift-indicator-Mix')).not.toBeNull();
});
```

If a `baseProps()` (or similar) helper already exists in this file, prefer it: spread it and only override `processContext`, `measureSpecs`, `rawData`, and pass `priorStepStats`. The point of the test is exactly that — that the prop reaches `useCanvasStepCards` and produces a drift chip in the DOM.

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test CanvasWorkspace
```

Expected: FAIL — `priorStepStats` prop unrecognized; no drift chip in DOM.

- [ ] **Step 3: Add the prop on `CanvasWorkspaceProps`**

In `packages/ui/src/components/Canvas/CanvasWorkspace.tsx`, extend the imports + props:

```typescript
import type { StepCapabilityStamp /* ...existing... */ } from '@variscout/core';

export interface CanvasWorkspaceProps {
  // ... existing ...
  /**
   * Per-step prior-snapshot capability stamps for canvas drift rendering. Apps
   * fetch this via their HubRepository.evidenceSnapshots.listByHub and pick the
   * most-recent live snapshot's stepCapabilities. Empty / undefined Map ⇒ no
   * drift renders. Layer-neutral — pure render input, never persisted from here.
   */
  priorStepStats?: ReadonlyMap<string, StepCapabilityStamp>;
}
```

In the component body, destructure the new prop and forward it to `useCanvasStepCards`:

```typescript
export const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({
  // ... existing destructure ...
  priorStepStats,
}) => {
  // ...

  const { cards: stepCards } = useCanvasStepCards({
    map,
    rows: rawData,
    measureSpecs,
    capabilityNodes: data.capabilityNodes,
    errorSteps: data.errorSteps,
    priorStepStats,
  });

  // ...
};
```

(No change needed in `<Canvas>` — `<Canvas>` consumes pre-built `stepCards`. The drift / sparkline data already lives on each card model. `CanvasStepCard` already receives the card via its props.)

- [ ] **Step 4: Verify `<Canvas>` props don't need a parallel addition**

Search:

```bash
grep -n "priorStepStats" packages/ui/src/components/Canvas/index.tsx
```

If the result is empty, no change to `<Canvas>` is needed. (`stepCards: CanvasStepCardModel[]` is already the data carrier.) If `<Canvas>` exposes its own `useCanvasStepCards` call, thread `priorStepStats` there too.

- [ ] **Step 5: Run tests**

```bash
pnpm --filter @variscout/ui test CanvasWorkspace
pnpm --filter @variscout/ui test CanvasStepCard
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/components/Canvas/CanvasWorkspace.tsx \
        packages/ui/src/components/Canvas/index.tsx \
        packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx
git commit -m "feat(ui/canvas): thread priorStepStats prop through CanvasWorkspace to drift hook

CanvasWorkspaceProps gains an optional ReadonlyMap<string, StepCapabilityStamp>.
The hook receives it; cards stamp drift; CanvasStepCard renders the indicator.
No-op when undefined or empty (pre-producer state).

Advances vision §5.2 — wires drift consumer surface end-to-end."
```

---

## Task 7: App wiring — PWA + Azure FrameView read prior snapshots

**Files:**

- Modify: `apps/pwa/src/components/views/FrameView.tsx`
- Create: `apps/pwa/src/components/views/__tests__/FrameView.test.tsx` (or modify if exists)
- Modify: `apps/azure/src/components/editor/FrameView.tsx`
- Create: `apps/azure/src/components/editor/__tests__/FrameView.test.tsx` (or modify if exists)
- Modify: `docs/investigations.md`

- [ ] **Step 1: Write the failing PWA test**

Drop a `vi.mock` of the repository at the top of `apps/pwa/src/components/views/__tests__/FrameView.test.tsx` (or add a new test file in line with PWA test conventions — look at neighboring test files for the i18n loader registration boilerplate this repo expects):

```typescript
import { vi } from 'vitest';

vi.mock('../../../persistence/PwaHubRepository', () => ({
  pwaHubRepository: {
    evidenceSnapshots: {
      listByHub: vi.fn(),
    },
  },
}));

import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';
import { pwaHubRepository } from '../../../persistence/PwaHubRepository';
// ... project store + investigation store seed helpers per neighboring test files ...
import FrameView from '../FrameView';

describe('FrameView — prior snapshot read for drift', () => {
  beforeEach(() => {
    vi.mocked(pwaHubRepository.evidenceSnapshots.listByHub).mockReset();
    // Seed stores per existing helper (raw data + active hub).
    seedPwaStoresForCanvas({
      hubId: 'hub-1',
      // ... raw rows, process map with 'mix' step, etc. ...
    });
  });

  it('does not call listByHub when no active hub is set', async () => {
    seedPwaStoresForCanvas({ hubId: null /* no hub */ });
    render(<FrameView />);
    expect(pwaHubRepository.evidenceSnapshots.listByHub).not.toHaveBeenCalled();
  });

  it('reads listByHub on mount and surfaces priorStepStats from the most-recent live snapshot', async () => {
    vi.mocked(pwaHubRepository.evidenceSnapshots.listByHub).mockResolvedValue([
      {
        id: 'snap-2', hubId: 'hub-1', sourceId: 'src-1',
        capturedAt: '2026-05-06T00:00:00Z',
        rowCount: 30, origin: 'paste', importedAt: 1, createdAt: 1, deletedAt: null,
        stepCapabilities: [{ stepId: 'mix', n: 30, mean: 110, cpk: 1.10 }],
      },
      {
        id: 'snap-1', hubId: 'hub-1', sourceId: 'src-1',
        capturedAt: '2026-05-04T00:00:00Z',
        rowCount: 30, origin: 'paste', importedAt: 1, createdAt: 1, deletedAt: null,
        stepCapabilities: [{ stepId: 'mix', n: 30, mean: 100, cpk: 1.50 }],
      },
    ]);

    render(<FrameView />);

    await waitFor(() => {
      // The most-recent snapshot's stepCapabilities (snap-2) should reach the canvas.
      expect(screen.queryByTestId('canvas-step-drift-indicator-Mix')).not.toBeNull();
    });
  });

  it('passes empty priorStepStats when the most-recent snapshot lacks stepCapabilities (pre-producer)', async () => {
    vi.mocked(pwaHubRepository.evidenceSnapshots.listByHub).mockResolvedValue([
      {
        id: 'snap-1', hubId: 'hub-1', sourceId: 'src-1',
        capturedAt: '2026-05-04T00:00:00Z',
        rowCount: 30, origin: 'paste', importedAt: 1, createdAt: 1, deletedAt: null,
        // No stepCapabilities — pre-producer.
      },
    ]);
    render(<FrameView />);
    await waitFor(() => {
      expect(pwaHubRepository.evidenceSnapshots.listByHub).toHaveBeenCalled();
    });
    // Drift indicator should be absent — no producer ⇒ no priorStepStats ⇒ no drift.
    expect(screen.queryByTestId('canvas-step-drift-indicator-Mix')).toBeNull();
  });
});
```

(`seedPwaStoresForCanvas` is illustrative — adapt to whatever helper / store-reset pattern exists in neighboring `apps/pwa/src/.../__tests__/*.test.tsx` files. If no helper exists, inline the store seeding using `useProjectStore.setState` / `useSession` setters per `.claude/rules/testing.md` and `editing-evidence-map`.)

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/pwa test FrameView
```

Expected: FAIL — `priorStepStats` not threaded; drift indicator absent.

- [ ] **Step 3: Wire `priorStepStats` in PWA `FrameView`**

Edit `apps/pwa/src/components/views/FrameView.tsx`:

```typescript
import React from 'react';
import { CanvasWorkspace } from '@variscout/ui';
import { useInvestigationStore, useProjectStore } from '@variscout/stores';
import type { CanvasInvestigationFocus } from '@variscout/hooks';
import type { StepCapabilityStamp, WorkflowReadinessSignals } from '@variscout/core';
import { pwaHubRepository } from '../../persistence/PwaHubRepository';
import { useSession } from '../../store/sessionStore';
import { usePanelsStore } from '../../features/panels/panelsStore';
import { useInvestigationFeatureStore } from '../../features/investigation/investigationStore';

const EMPTY_PRIOR_STEP_STATS: ReadonlyMap<string, StepCapabilityStamp> = new Map();

const FrameView: React.FC = () => {
  // ... existing store reads ...
  const { hub: sessionHub } = useSession();
  const activeHubId = sessionHub?.id ?? null;

  const [priorStepStats, setPriorStepStats] = React.useState<
    ReadonlyMap<string, StepCapabilityStamp>
  >(EMPTY_PRIOR_STEP_STATS);

  React.useEffect(() => {
    if (!activeHubId) {
      setPriorStepStats(EMPTY_PRIOR_STEP_STATS);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const snapshots = await pwaHubRepository.evidenceSnapshots.listByHub(activeHubId);
        if (cancelled) return;
        // Most-recent live snapshot wins. listByHub already filters deletedAt.
        const sorted = [...snapshots].sort((a, b) =>
          (b.capturedAt ?? '').localeCompare(a.capturedAt ?? '')
        );
        const mostRecent = sorted[0];
        const stamps = mostRecent?.stepCapabilities;
        if (!stamps || stamps.length === 0) {
          setPriorStepStats(EMPTY_PRIOR_STEP_STATS);
          return;
        }
        const map = new Map<string, StepCapabilityStamp>();
        for (const stamp of stamps) map.set(stamp.stepId, stamp);
        setPriorStepStats(map);
      } catch {
        // Repository read failure is non-fatal for canvas render.
        if (!cancelled) setPriorStepStats(EMPTY_PRIOR_STEP_STATS);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeHubId]);

  // ... existing handlers ...

  return (
    <CanvasWorkspace
      // ... all existing props ...
      priorStepStats={priorStepStats}
    />
  );
};

export default FrameView;
```

- [ ] **Step 4: Mirror the change in Azure `FrameView.tsx`**

Edit `apps/azure/src/components/editor/FrameView.tsx` — drop in the same effect pattern, swapping the repository import. Concrete code:

```typescript
import React from 'react';
import { CanvasWorkspace } from '@variscout/ui';
import { useInvestigationStore, useProjectStore } from '@variscout/stores';
import type { CanvasInvestigationFocus } from '@variscout/hooks';
import type { StepCapabilityStamp, WorkflowReadinessSignals } from '@variscout/core';
import { azureHubRepository } from '../../persistence/AzureHubRepository';
import { usePanelsStore } from '../../features/panels/panelsStore';
import { useInvestigationFeatureStore } from '../../features/investigation/investigationStore';

const EMPTY_PRIOR_STEP_STATS: ReadonlyMap<string, StepCapabilityStamp> = new Map();

const FrameView: React.FC = () => {
  const rawData = useProjectStore(s => s.rawData);
  const outcome = useProjectStore(s => s.outcome);
  const factors = useProjectStore(s => s.factors);
  const setOutcome = useProjectStore(s => s.setOutcome);
  const setFactors = useProjectStore(s => s.setFactors);
  const measureSpecs = useProjectStore(s => s.measureSpecs);
  const setMeasureSpec = useProjectStore(s => s.setMeasureSpec);
  const processContext = useProjectStore(s => s.processContext);
  const setProcessContext = useProjectStore(s => s.setProcessContext);
  const findings = useInvestigationStore(s => s.findings);
  const questions = useInvestigationStore(s => s.questions);
  const suspectedCauses = useInvestigationStore(s => s.suspectedCauses);
  const causalLinks = useInvestigationStore(s => s.causalLinks);
  const activeHubId = useProjectStore(s => s.processContext?.processHub?.id ?? null);
  // ^ If Azure tracks the active hub differently (e.g. via a feature store),
  //   adapt this read to whatever the existing Azure pattern is. The contract
  //   is `string | null`. A grep for `activeHubId` / `useActiveHub` in
  //   apps/azure/src/ before writing should reveal the canonical reader.

  const [priorStepStats, setPriorStepStats] = React.useState<
    ReadonlyMap<string, StepCapabilityStamp>
  >(EMPTY_PRIOR_STEP_STATS);

  React.useEffect(() => {
    if (!activeHubId) {
      setPriorStepStats(EMPTY_PRIOR_STEP_STATS);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const snapshots = await azureHubRepository.evidenceSnapshots.listByHub(activeHubId);
        if (cancelled) return;
        const sorted = [...snapshots].sort((a, b) =>
          (b.capturedAt ?? '').localeCompare(a.capturedAt ?? '')
        );
        const stamps = sorted[0]?.stepCapabilities;
        if (!stamps || stamps.length === 0) {
          setPriorStepStats(EMPTY_PRIOR_STEP_STATS);
          return;
        }
        const map = new Map<string, StepCapabilityStamp>();
        for (const stamp of stamps) map.set(stamp.stepId, stamp);
        setPriorStepStats(map);
      } catch {
        if (!cancelled) setPriorStepStats(EMPTY_PRIOR_STEP_STATS);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeHubId]);

  const signals: WorkflowReadinessSignals = React.useMemo(
    () => ({ hasIntervention: false, sustainmentConfirmed: false }),
    []
  );

  const handleSeeData = React.useCallback(() => {
    usePanelsStore.getState().showAnalysis();
  }, []);
  const handleQuickAction = React.useCallback(() => {
    usePanelsStore.getState().showImprovement();
  }, []);
  const handleFocusedInvestigation = React.useCallback(() => {
    usePanelsStore.getState().showInvestigation();
  }, []);
  const handleOpenInvestigationFocus = React.useCallback((focus: CanvasInvestigationFocus) => {
    if (focus.questionId)
      useInvestigationFeatureStore.getState().expandToQuestion(focus.questionId);
    usePanelsStore.getState().showInvestigation();
  }, []);
  const handleCharter = React.useCallback(() => {
    usePanelsStore.getState().showCharter();
  }, []);
  const handleSustainment = React.useCallback(() => {
    usePanelsStore.getState().showSustainment();
  }, []);
  const handleHandoff = React.useCallback(() => {
    usePanelsStore.getState().showHandoff();
  }, []);

  return (
    <CanvasWorkspace
      rawData={rawData}
      outcome={outcome}
      factors={factors}
      setOutcome={setOutcome}
      setFactors={setFactors}
      measureSpecs={measureSpecs}
      setMeasureSpec={setMeasureSpec}
      processContext={processContext}
      setProcessContext={setProcessContext}
      onSeeData={handleSeeData}
      onQuickAction={handleQuickAction}
      onFocusedInvestigation={handleFocusedInvestigation}
      findings={findings}
      questions={questions}
      suspectedCauses={suspectedCauses}
      causalLinks={causalLinks}
      onOpenInvestigationFocus={handleOpenInvestigationFocus}
      signals={signals}
      onCharter={handleCharter}
      onSustainment={handleSustainment}
      onHandoff={handleHandoff}
      priorStepStats={priorStepStats}
    />
  );
};

export default FrameView;
```

**Note on `activeHubId` reader:** before pasting verbatim, grep `apps/azure/src/` for the canonical hub-id reader. Azure may keep it on a feature store rather than `processContext`. Adjust the one line that derives `activeHubId` to whatever pattern Azure already uses; everything else stays as-is.

- [ ] **Step 5: Mirror the test for Azure FrameView**

Mirror the PWA test in `apps/azure/src/components/editor/__tests__/FrameView.test.tsx`, mocking `azureHubRepository.evidenceSnapshots.listByHub` instead.

- [ ] **Step 6: Run tests**

```bash
pnpm --filter @variscout/pwa test FrameView
pnpm --filter @variscout/azure-app test FrameView
```

Expected: PASS in both.

- [ ] **Step 7: Update `docs/investigations.md`**

Mark the two 8b entries `[RESOLVED 2026-05-XX]` (use today's date when running):

In the entry titled `### Canvas mini-chart: time-series for high-cardinality columns missing (vision §5.2)`, change the heading to:

```markdown
### Canvas mini-chart: time-series for high-cardinality columns missing (vision §5.2) [RESOLVED 2026-05-XX]
```

Add a `**Resolution:**` paragraph at the end:

```markdown
**Resolution:** PR8-8b — `useCanvasStepCards` adds `numericRenderHint` ('histogram' | 'time-series') based on `NUMERIC_TIME_SERIES_DISTINCT_THRESHOLD = 30`. New sparkline branch in `CanvasStepMiniChart`; LTTB-downsampled to ≤100 points via existing `@variscout/core/stats#lttb`; ordered by parser-detected `timeColumn` (row-index fallback). Sturges/Scott histogram improvement deferred to its own follow-up entry below.
```

In the entry titled `### Canvas drift indicator missing (vision §5.2)`, change the heading similarly and add:

```markdown
**Resolution:** PR8-8b — `computeStepDrift` engine in `@variscout/core/canvas`, direction-of-improvement-aware (cpk first, then mean per `MeasureSpec.characteristicType`), default ±5% threshold. `CanvasStepCardModel.drift?` populated when `priorStepStats` Map is supplied. PWA + Azure FrameView read `evidenceSnapshots.listByHub`, pick the most-recent live snapshot's `stepCapabilities`, and pass through. **Producer-side stamping** of `EvidenceSnapshot.stepCapabilities` at snapshot-create time is **deferred** to a separate slice — until that lands, the indicator stays inert (partial-integration policy).
```

Add two new entries at the bottom of `docs/investigations.md`:

```markdown
### Producer-side stamping of EvidenceSnapshot.stepCapabilities

**Surfaced by:** Canvas PR8-8b plan (2026-05-07) — partial-integration policy.

**Description:** PR8-8b shipped the consumer surface for canvas drift (engine + hook + UI + app read path). The producer side — stamping `EvidenceSnapshot.stepCapabilities` at snapshot-create time so prior values are available for drift comparison — is deferred. Today every snapshot lands with `stepCapabilities === undefined`, so `priorStepStats` is always an empty Map and the drift indicator stays inert.

**Possible directions:**

- Identify the right call site: snapshot creation lives in `apps/pwa/src/hooks/usePasteImportFlow.ts` (and the Azure equivalent), but the canvas process map + `measureSpecs` aren't necessarily complete at paste time. Likely the stamp lands later — when the user authors the canvas (process map first complete) OR on snapshot persistence after the canvas is mounted.
- Pure helper: `stampStepCapabilities({ map, rows, measureSpecs }) → StepCapabilityStamp[]` in `@variscout/core/canvas`.
- Trigger: a domain action `EVIDENCE_STAMP_STEP_CAPABILITIES { snapshotId, stamps }` dispatched after canvas first authoring completes for a snapshot.

**Promotion path:** small follow-up PR after PR8-8b merges. ~3 tasks.

---

### CanvasStepMiniChart histogram still uses "first-12-raw-values" pseudo-binning (vision §5.2)

**Surfaced by:** Canvas PR5 retrospective design review, 2026-05-06 (carried forward to PR8-8b plan).

**Description:** The histogram branch in `CanvasStepMiniChart.tsx` plots the first 12 raw values normalized to the local min/max — not a true histogram. PR8-8b intentionally left this as-is to keep the slice scoped (drift + time-series only).

**Possible directions:**

- Sturges' rule: `bins = ⌈log₂(n) + 1⌉`. Cheap, well-known.
- Scott's rule (more accurate): `binWidth = 3.49 σ n^(-1/3)`.
- Implementation: a small helper in `@variscout/core/stats` (`computeHistogramBins(values, rule)`) returning `{ bins: { x0, x1, count }[] }`. Mini-chart binds to bin counts.

**Promotion path:** small follow-up PR. ~2 tasks (helper + UI swap).
```

- [ ] **Step 8: Final commit**

```bash
git add apps/pwa/src/components/views/FrameView.tsx \
        apps/pwa/src/components/views/__tests__/FrameView.test.tsx \
        apps/azure/src/components/editor/FrameView.tsx \
        apps/azure/src/components/editor/__tests__/FrameView.test.tsx \
        docs/investigations.md
git commit -m "feat(apps): wire prior-snapshot read for canvas drift in PWA + Azure

PWA + Azure FrameView fetch evidenceSnapshots.listByHub on activeHub change,
pick the most-recent live snapshot's stepCapabilities, and pass a Map keyed by
stepId through CanvasWorkspace.priorStepStats. Until producer-side stamping
lands (deferred follow-up entry in docs/investigations.md), every snapshot
arrives with stepCapabilities undefined → drift indicator stays inert without
breaking the page.

Closes two docs/investigations.md entries (drift + time-series mini-chart) for
PR8-8b. Two new follow-up entries dropped: stepCapabilities producer + Sturges/
Scott histogram fix.

Advances vision §5.2 — drift + mini-chart consumer surface complete."
```

---

## Validation gate (run before requesting review)

- [ ] All packages build:

```bash
pnpm build
```

- [ ] Full test suite green:

```bash
pnpm test
```

- [ ] `pr-ready-check` passes:

```bash
bash scripts/pr-ready-check.sh
```

- [ ] Self-review checklist (above) walked top-to-bottom; all boxes ticked.
- [ ] Visual verification with `claude --chrome`:
  - Boot `pnpm dev`, paste seeded showcase data, mount a hub, author the canvas → verify (a) high-cardinality numeric columns render sparkline mini-chart; (b) drift indicator is ABSENT (pre-producer expected behavior); (c) low-cardinality columns still render the existing histogram bars.
  - Toggle `data-theme="dark"` → verify sparkline + drift styling adapts (theme-aware via `chartColors`/semantic Tailwind).
- [ ] Two `docs/investigations.md` 8b entries marked `[RESOLVED YYYY-MM-DD]`.
- [ ] Two new follow-up entries present at the bottom of `docs/investigations.md`.

---

## Closure

PR8-8b closes when:

1. PR merges to `main` via squash-merge (single sub-PR — small enough per master plan §3 D6 to skip per-task Opus review; final-branch reviewer is sufficient).
2. Both `docs/investigations.md` entries marked `[RESOLVED YYYY-MM-DD]` reflect the merge date.
3. Two new follow-up entries (producer stamping + Sturges/Scott binning) live in `docs/investigations.md`.
4. `docs/superpowers/plans/2026-05-07-canvas-pr8-vision-alignment-master.md` §4 8b row gains a "Status: delivered (PR #NNN)" line.

After 8b lands, the master plan unblocks 8d brainstorm per §5 sequencing (8a + 8b precede 8d).

---

## References

- **Master plan:** [`2026-05-07-canvas-pr8-vision-alignment-master.md`](2026-05-07-canvas-pr8-vision-alignment-master.md) §4 (8b summary), §3 D3 (layer-neutral parallel-with-8a)
- **Vision spec §5.2:** [`docs/superpowers/specs/2026-05-03-variscout-vision-design.md`](../specs/2026-05-03-variscout-vision-design.md) — drift + mini-chart commitments
- **Canvas migration spec:** [`docs/superpowers/specs/2026-05-04-canvas-migration-design.md`](../specs/2026-05-04-canvas-migration-design.md) §6 PR8 row
- **Investigations:** [`docs/investigations.md`](../../investigations.md) — two pinned 2026-05-06 entries (mini-chart + drift indicator)
- **Existing engine reference:** [`packages/core/src/findings/drift.ts`](../../../packages/core/src/findings/drift.ts) — `computeFindingWindowDrift` (Finding-window drift; same shape pattern, different scope)
- **LTTB helper:** [`packages/core/src/stats/lttb.ts`](../../../packages/core/src/stats/lttb.ts) — already public, reused verbatim
- **Workflow rules:**
  - `feedback_partial_integration_policy` — D6 producer deferral pattern
  - `feedback_subagent_driven_default` — Sonnet workhorse + per-task reviewers
  - `feedback_no_backcompat_clean_architecture` — internal-API default-required props (StepCapabilityStamp, ComputeStepDriftArgs)
  - `feedback_one_worktree_per_agent` — `.worktrees/canvas-pr8-8b-drift-time-series/` for any parallel writer
  - `feedback_branch_staleness_guardrails` — fetch + drift check before push
  - `feedback_doc_validation_hooks` — markdown links above use real syntax (this is a published plan, not embedded markdown-in-quotes)
