---
tier: ephemeral
purpose: build
title: PR-CCJ-G1 — Probability plot inflection binning
audience: human
category: implementation-plan
status: active
layer: spec
date: 2026-05-28
related:
  - docs/superpowers/specs/2026-05-26-canvas-connection-journey-design.md
  - docs/superpowers/plans/2026-05-26-canvas-connection-journey-master-plan.md
  - docs/decision-log.md
implements:
  - docs/superpowers/specs/2026-05-26-canvas-connection-journey-design.md
delivered-by: <TBD G1 PR>
---

# PR-CCJ-G1 — Probability plot inflection binning

**Goal:** Ship the inflection-point binning workflow on the Probability lens. A bimodal numeric column gets an auto-detection button; the algorithm finds the gap between clusters; the analyst inspects a segment table, optionally renames the levels, and commits a `BinnedFactorBinding` that persists on the active IP. The resulting `{source}_bin` column appears in the palette under `DERIVED FROM BINNING` and as a selectable factor in Boxplot + Probability lenses.

**Branch:** `worktree-feat-wedge-v1-ccj-g-1-inflection-binning`

---

## Context

Master plan §G1 (Phase G) describes an "inflection-point detection on numeric column in probability plot" feature. The 2026-05-28 decision-log entry (see `docs/decision-log.md`) refines §3.5 and §3.5.1 of the canvas connection journey spec after a three-round brainstorm that crossed external SPC vendor benchmarks, the VariScout methodology doc, and the Phase C roadmap card.

The brainstorm resolved seven design decisions:

1. Algorithm = gap-ratio detection + Anderson-Darling whole-sample pre-check + piecewise linear regression RSS confidence reporting (NOT the spec-time PWL+AD-segments).
2. Findings flow skipped — the bin column IS the persistent artifact.
3. No transient `pendingBinningSession` in panelsStore — proposing state is component-local `useReducer`.
4. Direct manipulation in State B (committed) — no second confirm step.
5. Once-per-session detection banner trigger.
6. Numeric-range default labels with per-segment stats inline.
7. Task #46 (Boxplot + Probability factor pickers consume `categoricalValuesByColumn`) absorbed into G1 Task 4.

**Spec:** `docs/superpowers/specs/2026-05-26-canvas-connection-journey-design.md` §3.5 + §3.5.1.

**Decision-log:** `docs/decision-log.md` 2026-05-28 entry (Spec §3.5 / §3.5.1 inflection-point binning refined for G1 ship).

---

## What shipped

8 tasks executed sequentially (inline, no subagent dispatch — scope was self-contained and well-specified):

| #   | Description                                                                                                                                                                        | Key files                                                                            |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 1   | `@variscout/core/binning` sub-path — `detectInflectionPoints()` algorithm + `SegmentStats` + `BinnedFactorBinding` types                                                           | `packages/core/src/binning/`                                                         |
| 2   | `BinnedFactorBinding` field on `ImprovementProject` + `computeBinnedFactorColumn()` helper                                                                                         | `packages/core/src/improvementProject/types.ts`, `packages/core/src/derived/bins.ts` |
| 3   | Palette renders bin chips under `DERIVED FROM BINNING` + CanvasWorkspace hydration from existing bindings                                                                          | `packages/ui/src/components/Canvas/EditMode/Palette/`, `CanvasWorkspace.tsx`         |
| 4   | Factor pickers consume `categoricalValuesByColumn` (closes Task #46) + filter-alignment bug fix                                                                                    | `packages/ui/src/components/Explore/Probability/`, Boxplot factor selector           |
| 5   | `<InflectionOverlay>` chart primitive + `ProbabilityPlot` overlay slot                                                                                                             | `packages/charts/src/components/InflectionOverlay/`, `ProbabilityPlot.tsx`           |
| 6   | `useInflectionBinningState` hook (idle → proposing → committed state machine) + `<InflectionSidePanel>` + `<InflectionSidePanelView>` (controller-based variant)                   | `packages/ui/src/components/Explore/Probability/InflectionBinning/`                  |
| 7   | Dashboard wiring — overlay rendered on both Probability paths + side panel adjacent to VerificationCard + lift hook to share state + `sourceColumn` keying + per-segment × tooltip | `apps/azure/src/components/Dashboard.tsx`                                            |
| 8   | E2E integration test + master plan amendment + this sub-plan doc + algorithm-pivot doc alignment                                                                                   | `apps/azure/src/__tests__/g1-inflection-binning-flow.test.tsx`, doc amendments       |

**Brainstorm-vs-ship algorithm pivot:** The spec-time algorithm was piecewise linear regression + Anderson-Darling on segments (PWL+AD-segments). During Task 1 implementation it became clear that PWL+AD-segments false-positives on skewed unimodal lognormal data (PWL always absorbs curvature via two-line fit). The shipped algorithm is gap-ratio detection + AD whole-sample pre-check + PWL-RSS confidence, which is invariant to within-cluster spread and directly captures the "kink in the probability plot" the analyst sees. See "Algorithm shipped" section below.

---

## Algorithm shipped

The detection runs in three stages:

**Stage 0 — Pre-check (Anderson-Darling on whole sample):**
If the sample is already approximately normal (Anderson-Darling p > `NORMALITY_P = 0.05`), no inflection exists and detection short-circuits immediately. This defends against applying the gap test to already-normal data where a Gaussian's tail outlier could otherwise look like a structural break.

**Stage 1 — Gap-ratio detection:**
After trimming the first/last `EDGE_TRIM_FRACTION = 0.1` of candidate breakpoints (to suppress tail-outlier dominance), the algorithm finds the index with the largest `gap[i] / medianGap` ratio. The candidate is accepted iff the ratio exceeds `GAP_RATIO_THRESHOLD = 20`. Bimodal/trimodal Gaussian mixtures with means several σ apart show ratios of 100x or more; unimodal Gaussian/lognormal data tops out at ~10x.

**Stage 2 — PWL-RSS confidence:**
Confidence is reported as the relative RSS reduction (%) achieved by fitting two lines on the `(value, normalQuantile)` probability-plot point cloud at the accepted cut versus a single-line baseline. This is the "how strong is the inflection?" signal the analyst reads in the side panel.

**Recursion:**
After the first cut, the algorithm recurses on the larger of the two sub-segments (up to `maxBreakpoints = 2`) with its own AD pre-check and gap-ratio scan. V1 caps at 2 cuts (3 segments).

**Why gap-ratio + AD-on-whole rather than PWL-RSS alone:**

- PWL-RSS reduction always exceeds the threshold for skewed unimodal data (lognormal, etc.) because a two-line fit absorbs systemic curvature — false positives.
- AD-on-segments depends on absolute p-value thresholds that are noisy at n≈50; a clean N(50, 3) draw of 50 points can yield AD p ≈ 0.01 by chance — false negatives.
- Gap ratio is invariant to within-cluster spread and to the unit of measurement. It directly captures the "kink in the probability plot" the analyst sees.

**Constants:**

```
NORMALITY_P = 0.05
GAP_RATIO_THRESHOLD = 20
EDGE_TRIM_FRACTION = 0.1
MIN_TOTAL_POINTS = 30
MIN_SEGMENT_POINTS = 5
```

These are documented in the `detectInflectionPoints.ts` module docstring and pinned by calibration tests in `packages/core/src/binning/__tests__/detectInflectionPoints.test.ts` (borderline bimodal + overlapping bimodal tests).

---

## Architecture decisions made during execution

**Task 4 — filter-alignment bug:**
While wiring `categoricalValuesByColumn` into the Boxplot factor picker, a filter-alignment bug was discovered: derived columns were not mapped through the active filter when extracting values for factor grouping. The fix was implemented in the same PR (per `feedback_bundle_followups_pre_merge`).

**Task 6 — IMPORTANT items resolved in Task 7:**

- `patchBindings` sync contract: the hook calls `patchBindings(next)` synchronously; the caller (Dashboard in Task 7) MUST update upstream React state in the same tick via plain `setState`. Async persistence (Dexie / Blob sync) is the caller's concern — wrap it so domain store updates immediately and async write fires in the background, otherwise the state machine races with itself.
- `sourceColumn` keying: the state machine initialises from `existingBindings.find(b => b.sourceColumn === sourceColumn)`. When the analyst switches the outcome column without unmounting Dashboard, the `reset()` action is called on `sourceColumn` change via `useEffect`. This prevents the old column's committed state from bleeding into the new column's idle state.
- Per-segment × button semantics: segment K's × removes cut K-1 (merges segment with its left neighbor). When ≥ 2 cuts exist, the button gets an explanatory `title` so the merge direction is explicit.

**Task 7 — `InflectionSidePanelView` controller variant:**
Dashboard.tsx needed both the `InflectionOverlay` (rendered inside ProbabilityPlot via render-prop) and `InflectionSidePanelView` (adjacent to VerificationCard) to share the same `state.cuts` instance. Two separate `useInflectionBinningState` hooks would mean two diverging state machines. The solution was a controller-based API: `useInflectionBinningState` is lifted to Dashboard; both components receive the same controller via props. This is documented in `packages/ui/src/components/Explore/Probability/InflectionBinning/InflectionSidePanel.tsx`.

**Task 4 closes Task #46:**
The Boxplot and Probability factor pickers now consume `categoricalValuesByColumn` keys, which means the `{source}_bin` column appears as a selectable factor immediately after commit without requiring an additional derived-column pass. This was the core requirement of Task #46 (carved from PR-CCJ-F1 Task 5b).

---

## What is NOT in G1 (V2 deferrals)

| Item                                             | Rationale                                                            |
| ------------------------------------------------ | -------------------------------------------------------------------- |
| Manual cut drawing (click-empty-x to add)        | Purple vs cyan color discipline requires separate design pass        |
| 3+ breakpoints (V1 capped at 2)                  | UX for 4+ segments (labeling, segment table layout) needs validation |
| Multiple parallel binnings of same source column | Ambiguous UX when two binnings with different cuts co-exist          |
| KDE-valley as alternate detection method         | Operates in density space, loses prob-plot intuition                 |
| Re-detection from refreshed data                 | Requires clear UX signal about what changed; deferred                |
| Confidence-ribbon overlay                        | Additional visual complexity; legend/tooltip design needed           |
| Manual drag of cuts on the probability plot      | Requires SVG interaction layer; no drag primitive exists yet         |

---

## What is deferred to H1

| Item                                                           | Notes                                                                                                                              |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Empty-state copy when N < 30                                   | Currently shows no banner + no detect button (correct behavior); copy improvements in H1                                           |
| Visual polish on cyan guides (commit animation)                | Transition from dashed ghost to solid on commit                                                                                    |
| `aria-describedby` for side panel a11y                         | Segment table + stats need proper ARIA relationship markup                                                                         |
| Replace `window.confirm` on "Remove binning" with proper modal | `window.confirm` is used as a placeholder in the committed state's Remove action; H1 replaces with `@variscout/ui` modal primitive |

---

## Related

- Master plan (amended): `docs/superpowers/plans/2026-05-26-canvas-connection-journey-master-plan.md` §G1
- Spec: `docs/superpowers/specs/2026-05-26-canvas-connection-journey-design.md` §3.5, §3.5.1
- Decision log: `docs/decision-log.md` — 2026-05-28 entry refining §3.5/§3.5.1 algorithm + design decisions
- Algorithm module: `packages/core/src/binning/detectInflectionPoints.ts` (module docstring)
- F1 sub-plan precedent: `docs/superpowers/plans/2026-05-28-canvas-connection-journey-f-1-explore-exit.md`
- D3 sub-plan precedent: `docs/superpowers/plans/2026-05-27-canvas-connection-journey-d-3-time-as-factors.md`

---

## Closes

- Task #35: PR-CCJ-G1 — Probability plot inflection binning
- Task #46: PR-CCJ-F1 Task 5b — Boxplot factor picker consumes `categoricalValuesByColumn` (absorbed into G1 Task 4)
