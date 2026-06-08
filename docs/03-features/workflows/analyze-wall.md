---
tier: living
purpose: design
title: 'Investigation Wall'
audience: both
status: active
last-verified: 2026-06-08
verified-against-commit: 027927efe
related:
  [
    investigation-surface,
    evidence-map,
    problem-statement-scope,
    hypothesis,
    adr-085,
    adr-086,
    adr-088,
  ]
layer: L3
kind: ui
serves:
  - docs/02-journeys/personas/lead.md
  - docs/02-journeys/personas/member.md
---

# Investigation Wall

> Delivered update 2026-06-08 — Analyze now lands on the canvas-first Wall with Wall/Causes lenses, current-scope switching, and two drawers. ADR-066's Map-default decision is superseded by its 2026-06-08 amendment.

The Investigation Wall is the **default Analyze-tab canvas** and the hypothesis-centric render of the investigation graph — the surface for the spine in [investigation-surface.md](investigation-surface.md). Where the Evidence Map is now an advanced/report graph projection, the Wall is the daily working surface for _"which suspected causes do we hold, what evidence backs each, what counts against each, and what should we test next?"_ Both project the same `ProblemStatementScope + Hypothesis + CausalLink + Finding` graph ([ADR-085](../../07-decisions/adr-085-drop-question-problem-statement-scope.md), [ADR-086](../../07-decisions/adr-086-unified-investigation-canvas.md)).

## What the Wall does

It turns suspected causes into **disconfirmable claims**, not labels, and surfaces gaps proactively (missing disconfirmation, orphan findings, uncovered high-contribution factors). The "missing evidence" critique strip is the load-bearing move — it nudges the analyst toward what would _contradict_ a hypothesis, not only what supports it.

## What's on it — the bands

| Band                       | Contents                                                                                                                                                                                                                                 |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Model-builder**          | On-demand vital-few overlay in the factor zone — pre-selects the fewest factors within 1pt of max R²adj (each `p < .15`); surfaces **adjusted R² + per-factor p only**; O(1) toggle; conclude → capture-as-Finding (§Model-builder band) |
| **Problem (scope anchor)** | The current scope's compound WHERE + live Cpk + **HOLDS N/M** + **What-If Cpk** + coverage %; includes a compact switcher across flat sibling scopes (§Scope anchor)                                                                     |
| **Waterline**              | Dashed labelled divider                                                                                                                                                                                                                  |
| **Hypothesis**             | Cards with status-tinted borders, mini-charts, the **test-plan triad**, and the disconfirmation gesture; AND/OR/NOT gate nodes (§Test-plan triad, §Disconfirmation)                                                                      |
| **Evidence**               | Finding/gemba chips tethered to their hub — **Supports** (left) and **Counts-against** (right, loud) (§Evidence band)                                                                                                                    |
| **Contributing factors**   | Live factor chip row; each labelled by column + referencing hypotheses (derived); orphan factors dimmed                                                                                                                                  |

The canvas owns the screen. The thin Overall Problem Header sits above it; compact Wall/Causes controls, minimap, model toggle, and missing-evidence nudge float around the canvas instead of pushing it down. The redesign tracks **"% of viewport that is canvas"** as an acceptance metric (target: roughly 85%+ on the Analyze tab). Per-hypothesis warning badges are the main gap signal.

## Intent diagram

```text
┌───────────────────────────────────────────────────────────────────────┐
│ Top bar       │ Issue · Outcome · current scope · Wall/Causes · drawers  │
├───────────────────────────────────────────────────────────────────────┤
│ Problem scope │ WHERE machine=B ∩ shift=night · Cpk 0.74 · HOLDS 9/12  │
│               │ What-If Cpk 1.21 (coverage 38%)                        │
├───────────────────────────────────────────────────────────────────────┤
│ Waterline ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│ Hypothesis  ┌───────────────┐         ┌───────────────┐      ⚠ gap     │
│             │ Nozzle wear   │  ──AND──│ Shift handover│               │
│             │ [mini I-Chart]│         │ [mini boxplot]│               │
│             │ triad: tool✓  │         │ HOLDS 1/3     │               │
│             │ Supported     │         │ needs-disconf.│               │
│             └──────┬────────┘         └──────┬────────┘               │
│ Evidence    Supports F#12 ─┘     gemba ─┘   Counts-against F#19 (loud) │
├───────────────────────────────────────────────────────────────────────┤
│ Contributing factors │ machine │ shift │ operator(dim) │ material      │
└───────────────────────────────────────────────────────────────────────┘
  Focus lens (click to dim by distance) · Model ▾ · Missing-evidence ▾
```

## Bipartite layout authority

`computeWallLayout` (`packages/ui/src/components/AnalyzeWall/wallLayout.ts`) is the **single source of truth for every node position** — hubs, findings, factors, the scope anchor, orphans — in one coordinate space. The Minimap and pan-to-node consume the same `buildWallLayoutArgs`, so there is no position drift. The canvas is a **bipartite factor↔hypothesis** layout (one surface, not two components): ranked factors on one side, hypothesis cards on the other, typed support/refute edges between.

## Model-builder band

A scope-level **vital-few** selector (`packages/core/src/stats/modelBuilder.ts`, `selectVitalFew`): the fewest factors whose best-subset R²adj is within 1pt of the max where each factor's **partial** `p < .15` (screening — the lower bar of the two-α split). The header surfaces **adjusted R² + per-factor p only** (Cp/BIC are internal picker metrics, never on the surface). Toggling a candidate across the line is an O(1) `lookupSubset` (no recompute). Ambient honesty cues: a "fit-only estimate" dot (overfit / low obs-per-predictor) and a redundancy hint ("removing X barely changed the model — redundant, not irrelevant"). Concluding a model is **capture-as-Finding** (view-state while exploring; persisted only as a Finding), never a stored selection field.

## Scope anchor — current scope + switcher + HOLDS

The Problem-condition card renders the active `ProblemStatementScope`: the compound WHERE (`predicates`), live Cpk over the data window, **HOLDS N/M** (rows matching the scope's `gateNode` via `runAndCheck`), and the **What-If projected Cpk + coverage %** (`computeScopeWhatIfProjection` / `computeConditionCoverage`, `packages/core/src/variation/scopeContribution.ts`) — the "if-fixed" simulation, **never summed** across hypotheses. The `ScopeRail` is a current-scope + switcher surface across flat sibling scopes, not a broad-to-narrow lineage trail and not child-scope recursion. With no active scope it falls back to the global problem card.

## Test-plan triad on hypothesis cards

Each card carries a derived read-model (no new stored field): **Claim** (hub name) × **Relevant factors** (derived: condition columns ∪ linked findings' columns ∪ naming CausalLinks) × **Tool** (auto-suggested by data type — categorical → boxplot + 2-sample; continuous → scatter + regression; spread → Cp/Cpk) × **Data-readiness** (have it / gap → Measurement Plan). One-tap **Evaluate** runs the test → a typed Finding: `p < .05` + significant → **Supports**; `p ≥ .05` → **inconclusive** (not-tested, never silently supporting). Engine: `packages/core/src/findings/hypothesisTestPlan.ts`.

## Disconfirmation recording

Recording an attempt is a first-class write (`HYPOTHESIS_RECORD_DISCONFIRMATION` → `disconfirmationAttempts[]`); `onRecordDisconfirmation` is threaded to the card. The **"Try to break it"** gesture runs the evaluate engine under a wrongness prediction and the **engine grades** the verdict: significant → **survived**; not-significant with adequate power (≥20 rows / ≥10 per group) → **refuted**; below the power floor → **pending** ("too few rows", never a false refute). A hypothesis is **Supported** only with ≥2 evidence types **AND** a survived attempt (`deriveHypothesisStatus`, `packages/core/src/survey/wall.ts`).

## Evidence band — Supports / Counts-against

Per hub, a **GateBadge** (HOLDS) plus tethered **FindingChip**s climb to the band: **Supports** on the left, **Counts-against** on the right rendered **loud** (warning colour) — counter-evidence is never visually buried. Positions and edges come from the layout authority.

## Focus lens

Clicking any node focuses it; the rest of the canvas **dims by degree-of-interest** — a BFS graph-distance over tethers (`wallDegreeOfInterest`, `wallFocus.ts`): focused = vivid (1.0), adjacent = mid (0.55), distant = dim (0.25). Clicking empty canvas clears focus (`viewStore.focusedWallEntityId`). The lens **only dims** — it never changes a node's `CanvasLevel` or the model metrics.

## Object detail and CoScout drawers

Selecting a Wall object opens the left object-detail drawer. The drawer is deterministic and no-AI: Evidence, Comments, and Activity tabs for the selected finding / suspected cause / scope / plan. It absorbs the old conclusions rail so the canvas remains the working surface.

In Azure, CoScout lives in the right drawer. The closed state is a slim handle; the open drawer is scoped to the selected object and has Coach / Evidence / Actions tabs plus a `[REF]` hook for future visual grounding. CoScout is optional context and never sets status.

## How it sits alongside the Evidence Map

Analyze lands on the Wall. The everyday Analyze lenses are **Wall** (spatial hypothesis canvas) and **Causes** (tabular scan); Findings remains available as the finding list/board. The Evidence Map is no longer the Analyze default and is no longer in the main Wall/Causes toggle. It stays available as an advanced/read-only graph projection, especially in Report, and both surfaces still read the same graph.

| Surface            | Lens               | Best for                                                            |
| ------------------ | ------------------ | ------------------------------------------------------------------- |
| Investigation Wall | Hypothesis-centric | "What hypotheses do we hold, what backs each, what contradicts it?" |
| Causes matrix      | Tabular scan       | "Which suspected causes need evidence, tests, or next actions?"     |
| Evidence Map       | Graph narrative    | "How did the investigation graph evolve across factors and links?"  |

> **Note (ADR-085):** there is no third "Question" projection — `Question` is retired; question generation is transient factor-node metadata. The Wall subsumes the completeness-tracking the question checklist once played.

## Interactions

- **Drag-to-arrange** — cards reposition via @dnd-kit; layout persists per project.
- **Focus** — click a node to dim by distance; click empty canvas to clear.
- **Command palette** (`Cmd/Ctrl-K`) — jump to hub, create hypothesis, run HOLDS-check.
- **Minimap** — orientation when zoomed; reads the layout authority.
- **Explore handoff** — opening a factor from the Wall carries the categorical WHERE into Explore as both the visible scope chip and chart filters.
- **Mobile** — phone widths render a vertical `MobileCardList` (the model-builder band is desktop-only — focus-only mobile, [ADR-086](../../07-decisions/adr-086-unified-investigation-canvas.md)).

## Tier availability

The Wall is shared between PWA and Azure. Azure adds the right CoScout drawer and cloud/team context; PWA keeps the no-AI Wall, Causes, scope, findings, and Explore handoff.

## Not yet built (do not document as live)

Child-scope recursion (V1 scopes are flat), the re-ingest auto-link cascade (post-IM-4), live presence/cursors, factor-family LOD + edge bundling, numeric range handoff into chart filters, and full CoScout drawer content beyond the shell. The ACH (argument/counter-argument) matrix was **dropped**, not deferred.

## See also

- [investigation-surface.md](investigation-surface.md) — the spine + entity model the Wall renders.
- [Unified investigation canvas spec](../../superpowers/specs/2026-05-30-investigation-wall-unified-canvas-design.md) · [Factors & Evaluation spec](../../superpowers/specs/2026-05-31-factors-evaluation-design.md).
- [measurement-plan-dcp.md](measurement-plan-dcp.md) — the DCP that captures evidence gaps.
- [Methodology — two projections](../../01-vision/methodology.md).
