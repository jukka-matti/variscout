---
tier: living
purpose: build
title: 'Explore redesign — master plan'
audience: human
status: active
date: 2026-06-10
layer: spec
topic: [explore, ichart, factor-strip, conditions, findings, capability, pareto, wedge-v1]
related:
  - docs/superpowers/specs/2026-06-10-explore-redesign-design.md
  - docs/superpowers/plans/2026-06-08-analyze-wall-redesign-master-plan.md
  - docs/superpowers/plans/2026-06-10-control-closure-master-plan.md
implements:
  - docs/03-features/workflows/analysis-flow.md
  - docs/03-features/workflows/drill-down-workflow.md
---

# Explore Redesign — Master Plan

> **For agentic workers:** this is a **master plan** (the PR roadmap), not a single bite-sized task plan. Each PR below gets its **own sub-plan authored at build time** via the VariScout loop: **grounding workflow → sub-plan → subagent build (TDD) → adversarial gate/review → `gh pr merge --merge --delete-branch`**. One worktree per PR. REQUIRED SUB-SKILL for each PR's sub-plan: `superpowers:writing-plans`; for execution: `superpowers:subagent-driven-development`. Steps in sub-plans use checkbox (`- [ ]`) syntax.

**Goal:** Rebuild the Explore tab around the spec's locked principles — chart-as-hero (2 chrome rows), the η²-ranked factor strip with the model drawer behind it, the condition/scope loop (capture → drill → membership → hypothesis), the findings drawer + product-wide drawer grammar, and honest Y/spec/Pareto semantics — **PWA first, Azure parity per shared component**.

**Architecture:** Almost everything is re-homing + wiring of shipped machinery: `computeMainEffects`/`computeBestSubsets`/`perFactorDeltaR2` (ADR-067 engine), `FactorIntelligencePanel`/`EquationDisplay`/`BestSubsetsCard` (PI panel components), `ProblemStatementScope` + `ConditionLeaf`/`HypothesisCondition` + `deriveConditionFromFindingSource` (zero live callers today), `analysisScopeStore` + the categorical Explore handoff (AW §8 prototype). Net-new core surface: coefficient SE/covariance exposure from the GLM, the ω²-style adjustment, a membership-separation ranking, and the LTTB call-site activation. **Canonical wireframe for every reviewer pair:** `docs/02-journeys/wireframes/assets/explore-redesign-mockup-2026-06-10.html`.

**Spec:** [2026-06-10-explore-redesign-design.md](../specs/2026-06-10-explore-redesign-design.md) — section/decision references below (§/D numbers) point there.

**Verification baseline (all PRs):** `bash scripts/pr-ready-check.sh` green · app test suites run (not builds only — deletion-cascade lesson) · `claude --chrome` walk of the touched surface against the wireframe · doc propagation per Apply-phase discipline at delivery, not batch.

---

## Sequencing & collision guard

```
ER-0 (trust fixes + A1 glyphs)  ──────────────────────────────┐
ER-1 (chrome + skeletons)  →  ER-2 (strip v1 + A3 seeding)  →  ER-3 (model drawer + A2 Model toggle)  →  ER-6 (strip v2 + interaction)
                                      │
                                      └→  ER-4 (condition loop)  →  ER-5a (membership/composition/binning)  →  ER-5b (count-Y auto-detect + Pareto)
ER-7 (findings drawer + hypothesis wiring + D4 assignee)  — after ER-4
ER-8 (Y-model + specs everywhere)              — parallel-safe after ER-1
ER-9 (Frame→Explore contract + ingestion fixes) — parallel-safe; ER-2 consumes "seed-not-gate"
ER-11 (Report truthfulness for findings)        — parallel-safe; small
ER-10 (I-Chart at scale + capability lens)      — ⛔ WAITS for ALL Control-closure PRs incl. CC-7/CC-DOC (CC touched the phase I-Chart + Report); rebase-ground first
```

Codex CC PRs were merging throughout the design session (CC-2…CC-6 merged 2026-06-10; CC-7/CC-DOC pending at write time) — **every ER sub-plan's grounding step must re-ground against current main**, especially anything near `packages/charts/src/IChart.tsx`, `ReportView`, and Control surfaces.

---

## ER-0 — Numbers you can trust (independent bug cluster; can ship first, smallest)

**Sub-plan:** [`2026-06-10-er-0-trust-fixes.md`](2026-06-10-er-0-trust-fixes.md).

Standalone correctness fixes; every item already grounded with file pointers in the 2026-06-10 investigations entries.

1. **Finding card condition-n** — the bug is in the ROWS argument, not a missing metadata field: `buildFindingContext(filters, filteredData, …)` (`packages/hooks/src/findingCreation.ts`) computes `context.stats` over the dashboard's current `filteredData` while the FILTERS argument carries the draft's condition — so the persisted stats ignore the condition the card's own chips claim. Fix: at the capture call sites (`apps/pwa/src/App.tsx:680-686` `handleAddChartObservation`; Azure mirror `useFindingsOrchestration.ts:208-214`), compute the condition-scoped rows at capture time (apply the draft's condition/brush range to the data) and pass THOSE rows to `buildFindingContext` — never the unconditioned view data. The capture-options type is imported in `App.tsx:30` (ground its exact home at sub-plan time). Acceptance: dialog n=404 → saved card n=404, mean/Cpk equally condition-scoped.
2. **What-If bindings** — `apps/pwa/src/components/WhatIfPage.tsx:35` binds `useAnalysisScopeStore.boxplotFactor` (mirror Azure's `viewState?.boxplotFactor`); specs resolve `measureSpecs[outcome] ?? specs` (adopt the orphaned `packages/hooks/src/useSpecsForMeasure.ts`); guard `findBestSubgroup`'s nominal-no-target fallback (`packages/core/src/variation/bestSubgroup.ts:37-41`) so "best" presets suppress/caveat without a direction (spec §9, §11).
3. **Natural category order** — weekday/month detection in `sortBoxplotData`'s name branch (`packages/core/src/stats/boxplot.ts:107`), exporting `DAY_ABBR`/`MONTH_ABBR` from `packages/core/src/time.ts`; same ordering rule for stage order ("Auto order" currently renders Afternoon→Morning→Evening).
4. **Violin crash** — fix the `BoxplotBase` invalid-element render error behind the violin toggle (Explore sweep addendum item 1).
5. **Histogram spec lines + Stats-panel Cpk** (interim, pre-ER-1): draw USL/Tgt on the distribution; show Cpk in the summary when specs exist (spec §11; both retire into the redesigned surfaces later but are demo-facing now).
6. **Wall factor glyphs render black (A1, orphaned by AW's completion)** — `packages/ui/src/components/AnalyzeWall/FactorGlyph.tsx:72` uses `fill-surface-primary`, a token that does not exist in the Tailwind v4 `@theme` block (Tailwind silently skips unknown candidates → SVG default black). Fix: `fill-surface` at the glyph + add a `--color-surface-primary` alias in `packages/ui/src/styles/theme.css` (repairs ~20 latent `bg-surface-primary` users). Affects both apps.

Model sizing: Sonnet implementers; mechanical-to-standard tasks against named files.

## ER-1 — Chrome consolidation (§3, D1)

**Sub-plan:** [`2026-06-10-er-1-chrome-consolidation.md`](2026-06-10-er-1-chrome-consolidation.md).

One-row header (promote the compact responsive variant; icon-only tools w/ tooltips + Findings badge) · context line replaces the stats strip (clickable Cpk stub → ER-10's lens; red-below-target) · delete the scope ribbon · **gate the framing toolbar to the Process tab** (`apps/pwa/src/App.tsx:1327-1377` + Azure twin `EditorViewSwitch.tsx:77-92`) with Export relocated to the context line and Edit framing into the scope-chip menu · chart-generous heights become the default (the scroll-layout geometry; the grid/scroll toggle retires) · **render-feedback states**: skeletons for the chart panels on tab return and maximize (today: 3-5s blank with no feedback — Explore sweep item 3). Acceptance: ≤2 persistent chrome rows; the I-Chart plot band ≥3× its current default height at 1440×900; no blank-without-skeleton render windows; nothing from the old strips becomes unreachable (per-strip relocation table in §3).

## ER-2 — Factor strip v1 (§5 v1, D2/D3, §13.1)

**Sub-plan:** [`2026-06-11-er-2-factor-strip.md`](2026-06-11-er-2-factor-strip.md).

New `@variscout/ui` strip component fed by an ω²-adjusted `computeMainEffects` variant in `packages/core/src/stats/factorEffects.ts` (formula in spec §5; extend the existing function additively — ground its signature at sub-plan time). **Mounting:** the strip is a new band in `packages/ui/src/components/DashboardBase/DashboardLayoutBase.tsx` between the I-Chart slot and the bottom panels (NOT a 5th chart slot — it is chrome/guidance, outside the 4-slot contract); it absorbs the Variation Sources panel's `Factor:` dropdown (lives in that panel's header inside `DashboardLayoutBase` — ground exact lines at sub-plan). Ranks **all candidate factors** (framing selection = prominence, unselected collapse under "also screened (+N)" — D13 seed-not-gate); honesty copy verbatim from the spec; examined-✓ state; what-if hover via `computeCumulativeProjection` (write-through to `ProblemStatementScope.whatIfProjection` when a scope exists); clicking a chip rebinds the comparison panel. Strip recomputes on Y switch and within categorical scopes ("within this condition" retitle). Provenance exclusion for Y-derived columns (D11). The "ANOVA details" link lands on a drawer stub until ER-3. **Same PR, same ranking engine:** fix the misleading "Seed 3 from Factor Intelligence" handlers (`apps/pwa/src/components/views/AnalyzeView.tsx:371-376`, `apps/azure/src/components/editor/AnalyzeWorkspace.tsx:946-950` — today literally `factors.slice(0,3)`) to seed from this ranking (walkthrough finding A3).

## ER-3 — The model drawer (§6, D5)

**Sub-plan:** [`2026-06-11-er-3-model-drawer.md`](2026-06-11-er-3-model-drawer.md).

Core: expose coefficient SE/covariance from the ADR-067 GLM/QR solver (NIST tests extended — never weaken thresholds). UI: the drawer (summary · equation · coefficients · ANOVA · best-subsets ladder · predict widget), re-homing `EquationDisplay` + `BestSubsetsCard` content; mounted from the strip link **and** wired to the Analyze tab's Model toggle. **This PR owns the Model-toggle geometry bug outright** (the AW plan is delivered and never shipped this fix — walkthrough finding A2): `WallCanvas.tsx` mounts `ModelBuilderBand` inside the SVG at the factor-band row (y≈960) while the populated `readableWallContentBBox` crops to ≈y768, so the toggle changes zero pixels. The drawer replaces the in-SVG band as the Model surface (screen-space HTML, never viewBox-cropped); add the missing populated-branch geometry assertion to `WallCanvas.modelBuilder.seam.test.tsx`.

## ER-4 — The condition loop (§7.1–7.2, D6)

**Sub-plan:** [`2026-06-11-er-4-condition-loop.md`](2026-06-11-er-4-condition-loop.md).

Generalize the scope carry to **range predicates** (the named "remaining design crack"): brush pill (capture + view-as-condition) on the I-Chart · the scope bar (condition · n of N · clear · persistent "Take it to Analyze →") · per-chart tier defaults (I-Chart highlights via the full-data + members-emphasized render; comparisons filter; probability = regime check) · wire drill→`ProblemStatementScope` creation (its zero-live-caller state ends here) with `Finding.scopeId` linkage (coordinate with AW's "wire scopeId as a reader"). Esc-clearable transient click-highlight (tier 2) across charts.

## ER-5a — Membership analysis + composition view + binning reframe (§7.3, §10, D7/D11)

**Sub-plan:** [`2026-06-11-er-5a-membership.md`](2026-06-11-er-5a-membership.md).

Core: a membership-separation ranking (factor vs binary membership; statistic choice at build per §16) + composition data (per-level share-in vs share-out + lift). UI: the membership strip variant ("What distinguishes these calls?") and the composition view (paired bars, lift annotation, ⊕ minting compound conditions, **count ⇄ lift toggle** = the freed Pareto's condition half, D12). Inflection binning re-output: segment commits as a **condition** with the "what distinguishes these calls?" follow-up; bin columns carry `derivedFrom` provenance.

## ER-5b — Count-shaped-Y auto-detection + Pareto promotion (§12, D12's other half — split from 5a; touches `resolveMode()`)

`resolveMode()`/`detectColumns` recognize event-log/count Y's automatically (replacing the user-facing defect-mode entry); the Pareto takes a primary slot by data-shape right (**within the existing 4-slot contract — a slot's content changes, no 5th slot ever**); the strip switches to the defect-rate-share variant (ADR-088 level-native). The `computeDefectRates`-before-stats boundary is untouchable; `AnalysisMode` persistence untouched (entity-surgery owns its fate); no mode switcher appears in the redesigned chrome. This slice is deliberately separate: it modifies the mode dispatch point (`core/src/analysisStrategy.ts` hard rule) and deserves its own adversarial review.

## ER-6 — Strip v2: in-model upgrade + the interaction chip (§5 v2, D2/D4)

Chips upgrade marginal→ΔR² when best subsets completes (visible state change, caption flips to "in the model"); the ⚡ interaction chip with its conclusion on the face; clicking it renders the paired `A × {focal level, rest}` comparison (focal level = largest coefficient in the winning term); pattern label via `classifyInteractionPattern()`.

## ER-7 — Findings drawer + finding→hypothesis wiring (§7.4, §8, D8/D9)

Left findings drawer (cards with condition chips + condition-scoped evidence + the **FindingStatus lifecycle** chip (observed→…; never the Hypothesis Suspected/Supported/Ruled-out vocabulary — different entity) + note + evidence angle; Journal tab relocated; Export/Take-to-Analyze footer; push-not-overlay) · PI panel retires on Explore (Data Table → overflow) · CoScout right-drawer slot (Azure mount; PWA upgrade hint) · "What might cause this?" wires `deriveConditionFromFindingSource` into `createHubFromFinding` — **note: this means rewriting the store action itself** (`packages/stores/src/analyzeStore.ts:841` today builds the hypothesis from `finding.text.slice(0,80)` only and never sets `Hypothesis.condition`; the change is in the store, not a call-site wrapper) + the one mechanism prompt · "support / counts-against" actions surfacing `connectFindingToHub`/`counterFindingIds` on cards · **task-assignee capture (walkthrough D4, orphaned by AW's completion):** add the member select to the Wall task form (`HypothesisCardWithPlans.tsx:1152-1193`) and thread the existing `addHypothesisAction(…, assignee)` param through both app handlers (the JSDoc already claims it; the signature drops it). The AW plan is delivered — this PR grounds against shipped main, no cross-plan coordination remains.

Sub-plan: [ER-7 Findings Drawer + Hypothesis Wiring Implementation Plan](2026-06-11-er-7-findings-drawer-hypothesis-wiring.md).

## ER-8 — The Y-model + specs everywhere (§9, §11, D10)

Grouped Y-switcher (tracked-with-spec-badges first, other numerics after; inline "track this outcome?" promotion) replacing the raw `availableOutcomes` dropdown (`DashboardLayoutBase.tsx:322`); sever "+ track another outcome"→wizard (`apps/pwa/src/components/views/FrameView.tsx:860`); findings stamp their Y; spec popover echoes the inferred direction; spec lines on every chart of the measure.

Sub-plan: [ER-8 — Y-model and Specs Everywhere Implementation Plan](2026-06-11-er-8-y-model-specs-everywhere.md).

## ER-9 — Frame→Explore contract + ingestion fixes (§13, D13)

Vocabulary symmetry copy on both surfaces · auto-X dedup gate in `augmentWithTimeColumns` (`packages/core/src/time.ts`) + seed-cap/keyword rethink in `detection.ts:189-206` (now non-load-bearing but still wrong) · steps→stages auto-bind + step badges · goal/AnalysisBrief.target vs spec story implemented per D13.4 (goal lives with the Issue, feeds Report's "what we aimed for").

Sub-plan: [ER-9 — Frame to Explore Contract Implementation Plan](2026-06-11-er-9-frame-explore-contract.md).

## ER-10 — I-Chart at scale + the capability lens (§4, D14) — ⛔ after ALL CC PRs land

Nelson 2/3 lift to the full-data hooks layer (correctness prerequisite) → LTTB activation with a marker-aware threshold (`IChartWrapper/index.tsx:145` + Azure ReportView call site) → marker policy (size-by-n, violations-only, line-under-points) → signals digest chip honoring the Subgroup lens → the capability lens: **a within-slot identity change of the I-Chart slot — never a 5th slot** (the 4-slot contract is mechanically enforced); title/axis/marks change per D14; Cpk-number entry from the context line; the legacy "Cpk stability" toggle (today a silent no-op even with specs+stages — Explore sweep item 2) is replaced by this lens, with a legible disabled state naming its prerequisites when unmet; share the Cpk-trajectory component with Control's CC-4 band. Amend ADR-039 + `packages/charts/CLAUDE.md`. Re-ground hard: CC rewrote parts of this surface.

## ER-11 — Report truthfulness for findings (walkthrough D3 — small, parallel-safe)

Findings captured without a hypothesis currently have NO Report destination (`selectIPReportScope`, `packages/core/src/report/ipReport.ts:82-93`, admits findings only via hypothesis/goal links) and "What we found + what we did" renders an empty body under a **hardcoded green checkmark** (`apps/pwa/src/components/views/ReportView.tsx:201` + Azure mirror). Fix: an empty-state fallback line for the section; decide + implement the orphan-finding destination (e.g., "findings not yet attached to a suspected cause"); derive section status from content instead of `status:'done'`. Re-ground against RPT-1/CC-7's merged Report changes first.

## ER-DOC — Apply-phase doc propagation (a REQUIRED task in every ER sub-plan, not a trailing batch)

Per the project's doc discipline (wireframes-in-spec; Apply-phase propagation **per-initiative at delivery**): every ER PR's sub-plan MUST contain an explicit doc task, reviewed by the same reviewer pair. Per-slice targets:

| Slice      | Doc targets                                                                                                                                                                   |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ER-0       | investigations.md `[RESOLVED]` markers (finding-n, What-If bindings, ordering, violin, A1 glyphs); `packages/ui/CLAUDE.md` color-discipline note if the theme alias lands     |
| ER-1       | `docs/03-features/workflows/analysis-flow.md` (also owes its 5-verb rewrite — fold in); journey/wireframe pointers to the canonical mockup; `apps/pwa/CLAUDE.md` chrome note  |
| ER-2/ER-6  | `analysis-flow.md` + `drill-down-workflow.md` strip sections; `packages/core/CLAUDE.md` (factorEffects addition); supersession note on the PI-panel docs                      |
| ER-3       | ADR-067 amendment (SE exposure); AW workflow doc's Model-toggle paragraph                                                                                                     |
| ER-4/ER-5a | `drill-down-workflow.md` + `findings-hypotheses.md` (condition loop, membership); CS-3b disposition note (decision-log); ADR-066 supersession check (AW spec §7.8 carry-over) |
| ER-5b      | ADR-047 amendment note (auto-dispatch), `packages/core/CLAUDE.md` strategy section; mode-switcher retirement note in `ia-nav-model.md` if it mentions modes                   |
| ER-7       | `findings-hypotheses.md` (seed-not-become, one-question dialog); `packages/stores/CLAUDE.md` (createHubFromFinding change)                                                    |
| ER-8       | `analysis-flow.md` Y-model section; spec-editor docs                                                                                                                          |
| ER-9       | `docs/02-journeys/` Process→Explore flow docs; `docs/DATA-FLOW.md` if ingestion dedup changes shapes                                                                          |
| ER-10      | **ADR-039 amendment** (LTTB reality); `packages/charts/CLAUDE.md` invariant correction; capability-lens docs shared with Control's                                            |
| ER-11      | Report workflow doc; PO-5/RPT-1 cross-reference note                                                                                                                          |

Investigations entries from 2026-06-10 get `[RESOLVED …]` markers as their items ship; this spec + plan flip to `delivered` at closeout.

---

## Out of scope (tracked elsewhere)

Condition entity unification + `AnalysisMode` persistence fate (entity-surgery brainstorm) · Wall composition surfaces (AW master plan) · Control surfaces (CC master plan) · PWA session durability (top first-session risk, logged) · two-Y trade-off lens (post multi-Y).
