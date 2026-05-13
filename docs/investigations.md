---
title: VariScout — Things to Investigate
audience: [engineer, designer, analyst]
category: living-index
status: living
last-reviewed: 2026-05-03
---

# VariScout — Things to Investigate

Code-level smells, UX follow-ups, and architectural questions surfaced during work that are **not yet decisions**. Lighter than `decision-log.md` (Open Questions are decisions waiting to happen); heavier than a TODO comment (these deserve to outlive a single PR).

**When to add an entry:** while shipping fix A you notice problem B that's adjacent / related / surfaced by the same change. B isn't blocking A and you don't want to inflate scope, but it's worth not losing.

**When to remove an entry:**

- It became a decision → move to `decision-log.md` (Open Questions or Replayed Decisions).
- It became a spec → link to `docs/superpowers/specs/...` and remove.
- It became an ADR → link and remove.
- It was fixed → remove (the diff is the record).
- It was tried and rejected → move to `decision-log.md` Replayed Decisions with rationale.

**Each entry:** short title; one-paragraph description; surfaced-by (date / PR / session); possible directions; promotion path.

---

## Active investigations

### Orphan detection: duplicate-basename pairs may hide true orphans

**Surfaced by:** PR2 (`chore/hooks-perf`) final review, 2026-05-13.

**Description:** `scripts/check-diagram-health.sh` decides a doc is orphaned iff neither its basename nor its `docs/`-relative path appears as a substring of any indexed link target. The basename check is intentionally loose — a `capability.md` link target clears any file of that name anywhere in the tree. The repo currently has ~10 duplicate-basename pairs (`capability.md`, `pareto.md`, `storage.md`, `glossary.md`, etc.). If the same basename is linked once in the tree, both siblings pass orphan detection even if one has no inbound links.

This is **not a regression** from PR2's rewrite — the old `grep -rl "$basename"` had the same ambiguity. Current orphan count (12) matches the baseline.

**Possible directions:**

- Require relpath-match for files whose basename is non-unique; fall back to basename only when unique.
- Force fully-qualified links throughout `docs/` (`grep`-based lint that flags bare-basename links).
- Live with the limit (12 orphans flagged today is enough signal for the current scale).

**Promotion path:** if a true orphan ships to `main` and is missed, escalate to a script tightening. Otherwise leave as-is.

---

### Advisory ADR/spec frontmatter checks no longer fire mid-edit

**Surfaced by:** PR2 T6 (`chore/hooks-perf`), 2026-05-13.

**Description:** PR2 dropped `scripts/advisory-adr-frontmatter.sh` and `scripts/advisory-spec-frontmatter.sh` from `.claude/settings.json` PreToolUse (they imposed ~1.5 s × every Edit call without blocking). Both scripts have been deleted. The structural checks they encoded — `last-reviewed:` frontmatter presence on ADRs and lowercase `status:` enum on ADRs/specs — are still caught at push time by `scripts/check-doc-frontmatter.mjs` (invoked from `check-doc-health.sh` → `pnpm docs:check`). The DX regression is: a developer authoring a new ADR with `status: Accepted` no longer sees a mid-edit nudge; the issue surfaces on `git push`.

**Possible directions:**

- Fold the two checks into `check-diagram-health.sh`'s frontmatter section (already O(N) over `docs/`, marginal cost).
- Re-introduce them as periodic `SessionStart` sweep rather than per-Edit.
- Live with the push-time catch.

**Promotion path:** if push-time catches start producing painful rework, fold into `check-diagram-health.sh`. Otherwise leave as-is.

---

### Stats-bar "Set specs →" link reads project-wide specs only

**Surfaced by:** FRAME b0 spec wiring fixes, 2026-05-03 (branch `feature/full-vision-frame-b0`).

**Description:** The Analysis tab's stats-bar shows a "Set specs →" link even after the user has saved per-column specs via FRAME b0's `+ add spec` editor. Same root cause as the I-Chart bug fixed in this batch: the link reads `useProjectStore(s => s.specs)` (project-wide) rather than `measureSpecs[outcome]` (per-column).

**Possible directions:**

- Mirror the I-Chart fix locally: derive an effective spec object from `measureSpecs[outcome] ?? specs` at the consumer.
- Sweep all consumers of `s.specs` and apply the same fallback uniformly.
- Address the root cause via the parallel-stores investigation below.

**Promotion path:** trivial fix (one consumer) → ship in a follow-up PR. Wide sweep → audit task in `decision-log.md` Open Questions.

---

### Cpk badge in standard (Measurements) I-Chart mode

**Surfaced by:** FRAME b0 walkthrough, 2026-05-03.

**Description:** Once a spec is saved, the I-Chart in Measurements mode draws USL/LSL/target lines but shows no Cpk readout. Cpk is only surfaced when the user flips to "Cpk stability" / capability mode. Natural user expectation after spec save: a Cpk number visible somewhere alongside the trend chart.

**Possible directions:**

- Cpk badge in the stats-bar next to `x̄ | σ | n | Set specs →`.
- Cpk readout on the I-Chart's right-edge labels (alongside USL / Mean / LSL).
- Per-mode placement: Performance mode already has a `ProcessHealthBar` chip — generalize for the standard I-Chart.

**Promotion path:** UX decision → design slice → ADR if it changes Cpk presentation policy across modes; otherwise spec + implementation.

---

### Parallel spec sources of truth: `specs` vs `measureSpecs[outcome]`

**Surfaced by:** FRAME b0 spec wiring fixes, 2026-05-03.

**Description:** `projectStore` exposes two distinct spec fields: `specs: SpecLimits` (legacy project-wide single spec) and `measureSpecs: Record<string, SpecLimits>` (per-column, the newer Phase B model per `packages/ui/CLAUDE.md`). Writers branch on whether an outcome is set: with outcome → `setMeasureSpec(outcome, ...)`; without → `setSpecs(...)`. Readers are inconsistent: `resolveCpkTarget` already prefers per-column, but several other consumers read `specs` directly (the I-Chart wrapper was one — fixed locally; the stats-bar link, see above, is another). The asymmetry guarantees drift between "spec is set" indicators and the chart actually drawing the spec lines.

**Possible directions:**

- **Status quo + sweep:** keep both fields, sweep all consumers to use the per-column-first fallback. Cheapest now, leaves the smell.
- **Make `specs` derived:** treat `specs` as a computed view (`specs = outcome ? (measureSpecs[outcome] ?? {}) : projectWideFallback`). Eliminates the asymmetry without removing the field; readers don't change.
- **Unify on `measureSpecs`:** retire `specs`, route all reads / writes through `measureSpecs[outcome]`. Cleanest, biggest blast radius (legacy consumers, persistence shape, possibly Azure app).
- **ADR:** if the issue keeps biting, write an ADR that picks one of the above and locks it.

**Promotion path:** ADR-worthy if it bites again. Could also be folded into a Phase B follow-up spec, since per-characteristic specs (`SpecEditor`, `setMeasureSpec`) are the documented intent.

---

### P2.5 deferral: per-step mini-Pareto chips on LayeredProcessView step cards

**Surfaced by:** slice 4 task P2.5, 2026-05-04 (branch `framing-layer-v1-slice-4`).

**Description:** Slice 4 ships `useStepDefectPareto` (data hook) and `StepDefectIndicator` (visual primitive) but defers visual mounting onto `ProcessMapBase` nodes / tributary chips. The Operations band currently shows `ProductionLineGlanceDashboard` (a 2×2 grid with a `StepErrorPareto` slot) — feeding `useStepDefectPareto` output into `errorSteps` is the simplest mounting path and can be done without node-rendering surgery. Per-node-card chip mounting requires `ProcessMapBase` to expose an injectable slot per node, which is out of slice 4 budget. Spec acceptance §9.2 "per-step mini-Pareto" is considered partially met by the data + primitive availability.

**Possible directions:**

- **Operations-band slot wiring (low cost):** pass `useStepDefectPareto(perStep).data` as the `errorSteps` prop on the existing `StepErrorPareto` chart inside `ProductionLineGlanceDashboard`. No node-card surgery needed.
- **Per-node chip (higher cost):** extend `ProcessMapBase` to accept a `nodeDecorator?: (stepKey: string) => ReactNode` slot; mount `StepDefectIndicator` from there. Gives inline-per-step chips as originally envisioned.
- **Hybrid:** wire the Operations-band slot first (quick win), then layer the per-node chip in a dedicated follow-up task.

**Promotion path:** Operations-band slot wiring → carry into a P3.x or standalone follow-up task. Per-node chip → design task + ADR-check on ProcessMapBase extension if the slot pattern is reused for other decorators.

---

### Canvas-filter app-level integration + E2E (slice 4 P3.6 / P4.2 / P4.3 follow-up)

**Surfaced by:** slice 4 tasks P3.6, P4.2, P4.3, 2026-05-04 (branch `framing-layer-v1-slice-4`).

**Description:** Slice 4 shipped the canvas-filter primitives end-to-end at the package level: `ScopeFilter` type on `ProcessHubInvestigationMetadata`, `useCanvasFilters` hook (`@variscout/hooks`), `CanvasFilterChips` component, `LayeredProcessView.canvasFilterChips` slot, Pareto bar-click `onScopeFilterClick` propagation through `ParetoChartWrapperBase`, `ParetoMakeScopeButton` component, and the `onMakeInvestigationScope` prop. App-level integration is partial:

- **PWA + Azure FrameView mount (P3.6):** uses session-local `useState<ProcessHubInvestigationMetadata>` rather than a real `ProcessHubInvestigation` because FrameView is the canonical-map authoring surface and has no investigation entity in scope. Chips render correctly when state is set programmatically (verified in tests) but state does not roundtrip through any real persistence path. Reload clears.
- **Pareto bar-click → scopeFilter writers:** the `onScopeFilterClick` prop on `ParetoChartWrapperBase` is wired (P3.5) but no production consumer in the Operations band passes a writer. The `ProductionLineGlanceDashboard`'s `StepErrorPareto` is mounted directly (not via `ParetoChartWrapper`), so bar clicks there don't currently route through the wrapper. PerformancePareto's migration via P1.4 left the picker but didn't surface a make-scope wiring there either.
- **`ParetoMakeScopeButton` → `StageFiveModal` opener (P4.2):** the wrapper-level wiring exists (`onMakeInvestigationScope` prop), but no app currently passes a callback that opens StageFiveModal with the brief. Investigation creation requires app-state plumbing (modal `open` state + investigation-store writer).
- **E2E coverage (P4.3):** deferred. With production writers absent, an E2E test would primarily exercise the test-only programmatic-state path. Postpone E2E until the writers above are wired.

**Possible directions:**

- **Investigation-bound mount:** identify where the active `ProcessHubInvestigation` entity is reachable in PWA / Azure (probably the Dashboard or PI Panel after Mode B confirms — not FrameView), and move the `useCanvasFilters` mount there. Wire `onChange` to whatever existing `persistInvestigationMetadata` flow already supports `timelineWindow` updates.
- **Operations-band Pareto bar-click writer:** route `StepErrorPareto`'s bar-click in `ProductionLineGlanceDashboard` through a thin adapter that calls `setScopeFilter` from `useCanvasFilters`. Either pass the setter as a prop or use a small store.
- **StageFiveModal opener:** add a small app-level state slice (e.g., `useState<AnalysisBrief | null>` for "brief pending Stage 5") that the `onMakeInvestigationScope` prop writes to; the modal opens when non-null.
- **E2E spec:** once any one writer above is wired, add a Playwright spec covering: paste defect data → click Pareto bar → assert blue scope chip appears → click "Make this the investigation scope" → assert StageFiveModal opens with pre-filled `issueStatement`.

**Promotion path:** when the writers land (likely as a single focused follow-up PR titled "wire canvas-filter writers in PWA + Azure" or similar), close this entry, ship the E2E in the same PR, and update the framing-layer spec verification §16 with the green checkboxes.

---

### Canvas mini-chart: time-series for high-cardinality columns missing (vision §5.2) [RESOLVED 2026-05-07]

**Surfaced by:** Canvas PR5 retrospective design review, 2026-05-06 (commits `2c010f29` / `36727ad0` / `2820afb1`).

**Description:** Vision §5.2 commits to **three mini-chart types per step card**: histogram for measurements, distribution for categoricals, and **time-series for high-cardinality columns**. `CanvasStepMiniChart` (`packages/ui/src/components/Canvas/internal/CanvasStepMiniChart.tsx`) implements only two — the time-series branch is absent. For process data ordered by run number / batch, the mini-time-series is methodologically meaningful (trend vs distributional shape).

**Possible directions:**

- Add a time-series branch with a cardinality threshold (e.g. `column.type === 'numeric' && distinct > 30`).
- Use the column-detection time column (per `parser/detection.ts`) when present; fall back to row-index ordering. Document the fallback explicitly.
- Algorithm: sparkline / mini-line; LTTB downsampling for >100 points (existing `@variscout/charts` convention).
- Bonus: replace the current "first-12-raw-values" pseudo-histogram with proper Sturges/Scott binning.

**Promotion path:** PR8b of the canvas migration sequence (Vision Alignment phase). Bundles into a small `CanvasStepMiniChart` extension PR.

**Resolution:** PR8-8b — `useCanvasStepCards` adds `numericRenderHint` (`'histogram' | 'time-series'`) based on `NUMERIC_TIME_SERIES_DISTINCT_THRESHOLD = 30`. New sparkline branch in `CanvasStepMiniChart`; LTTB-downsampled to at most 100 points via existing `@variscout/core/stats#lttb`; ordered by parser-detected `timeColumn` only when all metric rows parse, otherwise row-index fallback. Sturges/Scott histogram improvement deferred to its own follow-up entry below.

---

### Canvas drift indicator missing (vision §5.2) [RESOLVED 2026-05-07]

**Surfaced by:** Canvas PR5 retrospective design review, 2026-05-06.

**Description:** Vision §5.2 commits each step card to display a **drift indicator** — recent vs prior, when snapshot history exists. `CanvasStepCardModel` (`packages/hooks/src/useCanvasStepCards.ts`) has no `drift` or `priorStats` field, and the card UI has no drift rendering. Drift is methodologically core (Watson's "did this process change?"); shipping cards without it leaves the cadence-read flow incomplete.

**Possible directions:**

- Data model extension: `drift?: { direction: 'up' | 'down' | 'flat'; magnitude: number; threshold: number }` on `CanvasStepCardModel`.
- Snapshot reference: read prior `EvidenceSnapshot` per-step capability (slice 3 shipped per-row provenance + snapshot stamping).
- UI: small ↑ / ↓ / → arrow + magnitude % near the capability badge; arrow shape avoids H6 color-only signaling.
- Threshold: ±5% default (rule TBD); user-configurable later.

**Promotion path:** PR8b of the canvas migration sequence. Requires `EvidenceSnapshot` history reader (mostly shipped); UI + model extension lands in one ~6-task PR.

**Resolution:** PR8-8b — `computeStepDrift` engine in `@variscout/core/canvas`, direction-of-improvement-aware (Cpk first, then mean per `MeasureSpec.characteristicType`), default 5% threshold. `CanvasStepCardModel.drift?` populates when a `priorStepStats` Map is supplied. PWA + Azure FrameView read `evidenceSnapshots.listByHub`, pick the most-recent live snapshot's `stepCapabilities`, and pass through. Producer-side stamping of `EvidenceSnapshot.stepCapabilities` at snapshot-create time is deferred to a separate slice; until that lands, the indicator stays inert.

---

### Canvas response-path CTAs hardcoded as disabled instead of mode-aware (vision §5.3 + §2.4) [RESOLVED 2026-05-07]

**Surfaced by:** Canvas PR5 retrospective design review, 2026-05-06 (`packages/ui/src/components/Canvas/internal/CanvasStepOverlay.tsx:276-294`).

**Description:** Vision §5.3 and §2.4 prescribe **five mode-aware response-path CTAs**: Quick action / Focused investigation / Charter / Sustainment / Handoff. Cadence-mode (mature Hub) shows all five active; first-time/no-Hub mode (PWA free tier) shows Quick action + Focused investigation active and dims the rest with a tier-upgrade hint. Codex hardcoded Charter / Sustainment / Handoff as **permanently `disabled`** — wrong UX signal: users see "permanently broken" instead of "tier-gated, here's why."

**Possible directions:**

- Hub-maturity signal: thread `mode: 'cadence' | 'first-time' | 'demo'` through `CanvasWorkspace` → `Canvas` → `CanvasStepOverlay`. Compute from `assignmentsComplete && stepsAuthored && hasPriorSnapshot`.
- Tier gate: check `isPaidTier()` per ADR-078 D5 for Charter / Sustainment / Handoff. Render with a tier-upgrade hint instead of `disabled` when free tier.
- First-time-Hub copy: dimmed CTAs with tooltip "Available once your Hub has cadence" (or similar).
- Mode boundary: separate "mode" (drill-down content) from "tier" (paid feature gating); they are conflated in the current code.

**Promotion path:** PR8a of the canvas migration sequence. ~5 tasks: thread mode signal, compute hub-maturity, replace `disabled` with tier-aware affordances + copy.

**Resolution:** PR8-8a — `computeCtaState` helper + 2-state CTA rendering (`active` / `prerequisite-locked`). All five paths free-tier-active per Q2 (tier reframe). Charter has no workflow prerequisite per DMAIC Define-phase research. Stub destinations ship for Charter / Sustainment / Handoff; full surfaces deferred to per-path slices listed below.

---

### Charter authoring V1 → Improvement Project V1 [PROMOTED 2026-05-08]

**Surfaced by:** PR8-8a amendment review, 2026-05-07.

**Description:** PR8-8a ships a Charter stub destination only. The full surface — hub-level entity (multiple per Hub per Q1), problem statement / goals / scope / team / timeline form, `.vrs` round-trip — is deferred. Free-tier-active per Q2 (PWA can author + export `.vrs`); team signoff features paid-only inside the surface.

**Resolution (2026-05-08, SUPERSEDED 2026-05-09):** Initial design spec [`docs/superpowers/specs/2026-05-08-improvement-project-v1-design.md`](superpowers/specs/2026-05-08-improvement-project-v1-design.md) + plan [`docs/superpowers/plans/2026-05-08-improvement-project-v1.md`](superpowers/plans/2026-05-08-improvement-project-v1.md) — both **SUPERSEDED 2026-05-09** by the unified Response Path System V1 design ([`docs/superpowers/specs/2026-05-09-response-path-system-v1-design.md`](superpowers/specs/2026-05-09-response-path-system-v1-design.md)) + plan ([`docs/superpowers/plans/2026-05-09-response-path-system-v1.md`](superpowers/plans/2026-05-09-response-path-system-v1.md), 54 tasks across 10 PRs). The superseding spec covers all 5 response paths (Quick Action / Focused Investigation / Improvement Project / Sustainment / Handoff) as a unified system + naming reconciliation (SuspectedCause → Hypothesis) + Wall package re-home + Wall vision Detective-pack + Survey UI dual-surface + Quick Action surface; ~8–10 PRs across ~6–8 weeks off branch `response-path-system-v1`. Brainstorm resulted in two key reframings beyond the original Q1/Q2 scope:

- **Methodology pivot — DMAIC dropped for QC Story / Toyota TBP.** VariScout's existing investigation spine (Issue Statement, SuspectedCause, Findings, ImprovementIdea, Sustainment) maps 1:1 to QC Story's 8-section narrative. The artifact reuses VariScout primitives via FK rather than duplicating in DMAIC vocabulary; methodology lineage is acknowledged in design docs but absent from UI copy.
- **Rename "Charter" → "Improvement Project."** Avoids DMAIC-coding the vocabulary, communicates living-document semantics, avoids `useProjectStore` collision while staying qualified. Vision §2.4 + §5.3 amended.
- **Audit trail dropped from V1 paid-tier scope.** Azure tenant logging (App Insights, Activity Log) handles compliance audit at platform level; V1 paid ships _only_ signoff workflow.

**Promotion path:** Implementation plan to follow per `superpowers:writing-plans` flow. Likely sequence: spec → plan → 6–8 tasks across `@variscout/core` (types + actions + .vrs serialization) + `@variscout/ui` (form + sections) + per-app shells (PWA + Azure) + persistence handlers.

---

### Sustainment workflow V1

**Surfaced by:** PR8-8a amendment review, 2026-05-07.

**Description:** PR8-8a ships a Sustainment stub destination only. The CTA's prerequisite signal (`hasIntervention`) is hardcoded `false` in FrameView until the data model lands. The full surface — continuous monitoring of a confirmed process change to verify the gain holds — is deferred.

**Possible directions:**

- "Intervention exists" signal: needs concrete definition. Likely tied to a future `Intervention` entity OR derived from existing `ImprovementIdea` + `ActionItem` data with status `implemented`.
- Monitoring infrastructure: schedule, alerts, control charts post-change; review-marked / auto-verified states.
- Free-tier vs paid-tier split: free can record sustainment manually; paid gets continuous monitoring + alerts.

**Promotion path:** Standalone slice when prioritized. Sequence after Charter authoring (charter formalizes the change being monitored).

---

### Handoff workflow V1

**Surfaced by:** PR8-8a amendment review, 2026-05-07.

**Description:** PR8-8a ships a Handoff stub destination only. The CTA's prerequisite signal (`sustainmentConfirmed`) is hardcoded `false` in FrameView until the data model lands. The full surface — transferring ownership of a confirmed-sustained improvement to the process owner with a control plan — is deferred.

**Possible directions:**

- "Sustainment confirmed" signal: needs concrete definition. Likely `SustainmentRecord.latestReviewId` populated AND review marked `confirmed-sustained`.
- Control plan: who owns the process post-handoff; what triggers escalation; reaction plan if metrics drift.
- Free-tier vs paid-tier split: free can document the handoff; paid gets RACI / signoff / change-notification flow.

**Promotion path:** Standalone slice when prioritized. Sequence after Sustainment workflow (handoff requires confirmed sustainment).

---

### Team-collaboration features inside Charter / Sustainment / Handoff surfaces

**Surfaced by:** PR8-8a amendment review, 2026-05-07.

**Description:** Per Q2 (tier reframe), the five response-path CTAs are tier-active in PWA + Azure. The team-collaboration tier-gate that DOES apply lives **inside** each surface: signoff buttons, audit trail, alerts setup, RACI, change notifications. PR8-8a defers wiring this layer until the surface forms ship.

**Possible directions:**

- Each surface component reads `useTier()` directly and renders team-features as paid-only controls (button-level gating, not surface-level).
- Shared pattern: a `<TeamFeatureGate feature="signoff">` wrapper component in `@variscout/ui` so the gating contract is uniform across surfaces.
- Telemetry: track tier-feature impressions to inform pricing.

**Promotion path:** Per-surface, ride along with each response-path's V1 form slice.

---

### Canvas hypothesis-arrow drawing affordance absent (vision §3.4) [RESOLVED 2026-05-08]

**Surfaced by:** Canvas PR6 retrospective design review, 2026-05-06.

**Description:** Vision §3.4 commits to user-authored hypothesis arrows: _"users may **optionally draw a hypothesis arrow** from one column (or one step) to another."_ Hypothesis arrows are first-class authoring; promoted (evidence-crossed-threshold) → node markers; draft → faint arrows. `useCanvasInvestigationOverlays` projects pre-existing `CausalLink` entities as faint dashed SVG arrows (read-side only). The user-facing **drawing gesture** does not exist anywhere on the canvas.

**Possible directions:**

- Drawing gesture: Mode 2 (structural authoring) toolbar gains a "Draw hypothesis" tool. Click source step/column → drag → release on target → opens a tiny inline form ("I suspect [X] affects [Y]" + free-text `because...`).
- Promoted vs draft visual distinction: drafts = faint dashed arrows (current); promoted = node markers ON the affected step (separate visual primitive — needs design).
- Suspected causes as node markers: Codex renders as inline badges inside step cards; spec calls for node markers. Either accept the badge pattern (document deviation) or rework.
- Storage: new draft hypotheses → `CausalLink` entities in `useInvestigationStore` (existing graph).

**Promotion path:** PR8d of the canvas migration sequence. Requires Spec 4 brainstorm extension covering the drawing-mode gesture (overlap with structural-arrow drawing — same primitive, different semantic), promoted-vs-draft visual, and column-vs-step source/target. ~8 tasks.

**Resolution:** PR8-8d ([PR #140](https://github.com/jukka-matti/variscout/pull/140)) — Canvas gains a dedicated draw-hypothesis tool, step/column endpoints, drag and keyboard authoring flows, a focused draft popover with optional question linking, causal-link store wiring in PWA/Azure shells, remove affordances on hypothesis links, and promoted suspected-cause node markers.

---

### Canvas Wall overlay is badge projection, not "same data, two views" mirror (vision §5.6) [RESOLVED 2026-05-08 — sub-PR 8e]

**Surfaced by:** Canvas PR6 retrospective design review, 2026-05-06.

**Description:** Vision §5.6 commits the Wall to be **dual-home**: _"It remains the canonical destination in the Investigation tab AND becomes one of the canvas overlays. **Same data, two views**."_ §5.4 even says: _"With overlays on, the canvas IS the Wall view."_ Codex's implementation is a lighter projection — per-step badge counts + linked item lists in the step overlay — not a mirror of the Wall's full graph. Defensible V1 (read-only cadence-scan) but unmet spec commitment.

**Possible directions:**

- Embed the Wall viewport: render `WallCanvas` (`packages/charts/src/InvestigationWall/`) inline as the canvas overlay layer. Same data, lighter chrome.
- Hybrid: keep badge-projection as cadence-scan; add an "expand to wall view" button in canvas chrome lifting the wall into a modal / right-rail.
- Status quo + spec amendment: accept badge-projection as V1 dual-home; amend §5.6 to say "destination = full graph; overlay = projected badges."

**Promotion path:** PR8e of the canvas migration sequence. Requires Spec 4 brainstorm extension to pick between embedded-wall vs badge-projection-as-canonical. ~6 tasks if embedded-wall is chosen; ~2 (just the spec amendment) if status quo.

**Resolution:** Sub-PR 8e embeds `WallCanvas` as the canvas Wall overlay with shared Wall viewport state and click-to-drill to the Investigation Wall destination; see `docs/superpowers/specs/2026-05-08-canvas-wall-overlay-design.md`.

---

### Canvas hypothesis-arrows visually obscured under Wall overlay when both active

**Surfaced by:** PR #141 (sub-PR 8e) final code review, 2026-05-08.

**Description:** Spec 4 ext §6 z-stack puts the Wall overlay (`z-[15]`) above per-step badge overlays (`z-10`). When a user activates both the `'hypotheses'` overlay and the `'wall'` overlay simultaneously, the persistent `<HypothesisArrowsLayer>` connector arrows render below the Wall SVG and are visually hidden. Behavior is correct per spec — the Wall is a richer view of the same causal data — but the side effect is undocumented in the spec and may surprise users who expect both overlays' visuals to compose.

**Possible directions:**

- Status quo: accept that Wall-on supersedes per-step arrows; rely on Wall's own arrow rendering for causal context. Document in the spec.
- Auto-toggle: when `'wall'` activates, suppress the `'hypotheses'` toggle in `CanvasOverlayPicker` (mutual exclusion in the picker) since Wall already encodes that data.
- Z-axis re-stack: hoist the per-step arrow layer above the Wall (`z-20`+) so arrows draw on top — but Wall pointer-events would still gate clicks, and the resulting visual is busy.

**Promotion path:** Spec 4 retroactive consolidation (Tier 3 followup) is the natural home for documenting the z-stack semantics. Promote to a decision-log Open Question only if user research surfaces confusion about the dual-overlay state.

**Resolution [2026-05-08]:** Status-quo + doc per the listed promotion path. Spec 4 ext (`2026-05-08-canvas-wall-overlay-design.md`) §6 now carries a §6.1 "Rendering z-stack" subsection documenting that Wall (`z-[15]`) supersedes per-step arrows (`z-10`) by design — the Wall is a richer projection of the same causal data. No code change; auto-mutual-exclusion in `CanvasOverlayPicker` was rejected (would imply the dual-active state is illegal — it isn't, just superseded). Promote to a decision-log Open Question only if user research surfaces confusion about the dual-overlay state.

---

### Canvas levels-as-pan/zoom architecture deferred without note (vision §5.4)

**Surfaced by:** Canvas PR5 retrospective design review, 2026-05-06.

**Description:** Vision §5.4 says levels (System / Process Flow / Local Mechanism) are _"expressed as a canvas pan/zoom, not a separate picker"_ — orthogonal to mode lenses. Codex shipped the lens picker correctly as a discrete control but **levels-as-pan/zoom is entirely deferred** — there is no canvas viewport at all (flat vertical scroll). This is a fundamental canvas architecture gap, not a feature gap.

**Possible directions:**

- Pan/zoom viewport: introduce a `react-flow`-style or hand-rolled SVG/CSS-transform viewport. Levels computed from zoom level.
- Discrete level picker (spec deviation): if pan/zoom too costly, ship a discrete picker; document the deviation in a retroactive ADR.
- Defer to V2: acknowledge the V1 canvas is single-level (Process Flow); revisit when use cases surface (e.g., 50+ nodes makes flat layout unscannable).

**Promotion path:** PR8f of the canvas migration sequence — but **large**; canvas viewport architecture is a multi-week effort and may warrant its own design spec rather than a sub-PR. Recommendation: defer to V2 with an explicit decision-log entry; revisit when triggered.

---

### `'general-unassigned'` sentinel as investigationId placeholder in test fixtures

**Surfaced by:** P1.4 review fixes, 2026-05-06 (branch `data-flow-foundation-f1-f2`).

**Description:** Several test fixtures inside `packages/stores/` and `packages/hooks/` that create `Question`, `Finding`, or `SuspectedCause` objects use `investigationId: 'inv-test-001'` (correct, deterministic) or similar per-test sentinels. However, the codebase also includes patterns where no investigation context is available at construction time — for example, `createQuestion` callers in pre-P1.4 code sometimes passed no `investigationId` at all (now a required arg). A related smell is that some places in production code (not tests) construct entities with a placeholder string like `'general-unassigned'` to satisfy the type when no real investigation FK is in scope. This deferred FK is an architectural liability: it bypasses cascade safety guarantees (a tombstoned investigation should stop queries against its entities, but entities with a placeholder FK are orphaned from that safety net).

**Possible directions:**

- Audit all production call sites of `createQuestion`, `createFinding`, and `createSuspectedCause` for non-real `investigationId` values (empty string, `'general-unassigned'`, `'unknown'`, etc.).
- Where a real investigationId is not in scope at construction time, either defer construction until it is (pass investigationId as a runtime param) or use a branded nominal type (`InvestigationId`) that prevents silent placeholder injection.
- Document any legitimately un-scoped entities (e.g., global template questions) as a typed variant rather than a placeholder string.

**Promotion path:** Low priority while investigations are single-tenant and not aggregated cross-investigation. Becomes a safety gap if multi-investigation queries or cascade deletes are added (see ADR-073 boundary policy). Log in `decision-log.md` as a named-future item when cascade-delete scope is tackled.

---

### Per-app feature-store overlap with `usePreferencesStore`

**Surfaced by:** F4 spec D7, 2026-05-07 (branch `worktree-f4-three-layer-state`).

**Description:** `apps/azure/src/features/panelsStore.ts` and `apps/pwa/src/features/panelsStore.ts` semantically duplicate `usePreferencesStore` on workspace tab selection + panel open/close toggles. F4 now owns those fields in `usePreferencesStore` (persisted, `'variscout-preferences'` key), but the per-app feature stores keep their own copies of analogous per-workspace toggle state. A decision is needed: either the per-app feature stores re-export their relevant slices from `usePreferencesStore`, or they remain independent (accepting duplication). Keeping them independent risks a user-visible inconsistency — reloading the app could restore `usePreferencesStore` fields but not the feature-store toggles if the two sets diverge.

**Possible directions:**

- **Unify:** move per-app feature-store panel state into `usePreferencesStore` as named sub-slices. Clean boundary; single persistence key.
- **Re-export shim:** feature stores expose getters that delegate to `usePreferencesStore`. Avoids consumer API change.
- **Status quo + audit:** accept duplication for now; document the divergence risk; revisit when a concrete user-reported inconsistency emerges.

**Promotion path:** revisit when feature-store unification becomes a priority (likely during the Canvas/Hub surface build-out, where panel state proliferates). Out of F4 scope.

---

### `wallLayoutStore.selection` Set/JSON Dexie round-trip

**Surfaced by:** F4 audit, 2026-05-07 (branch `worktree-f4-three-layer-state`).

**Description:** `wallLayoutStore.selection` is typed as `Set<NodeId>`. The store uses idb-keyval for persistence. JavaScript `Set` objects do not survive `JSON.stringify` / `JSON.parse` round-trips cleanly — `JSON.stringify(new Set([1,2]))` returns `'{}'`, meaning the persisted value will always be an empty object on reload. The `wallLayoutStore` `partialize` block should either convert to `string[]` before persist and back to `Set` on rehydration, or the `selection` field should be excluded from persistence entirely (treating selection as transient View state per F4's layer rule). F4 does not touch `wallLayoutStore` selection logic (wallLayoutStore is `STORE_LAYER = 'view'` per F4 — selection is correctly in the view layer) but the Dexie round-trip hazard remains if anything else tries to persist the store.

**Possible directions:**

- **Convert at partialize boundary:** `partialize: (s) => ({ ...s, selection: [...s.selection] })` and rehydrate with `new Set(raw.selection)` using a custom `merge` or `onRehydrateStorage` callback. Standard Zustand/idb-keyval pattern.
- **Exclude from persist:** confirm `selection` is pure View state (already labeled so by F4) and remove it from any persist `include` list.
- **Type change:** switch `selection: string[]` everywhere; simpler, loses Set lookup semantics.

**Promotion path:** low urgency (wallLayoutStore `STORE_LAYER = 'view'` per F4, so no persist middleware is expected). Becomes blocking if a future slice adds persist middleware to wallLayoutStore or reads selection from a persisted snapshot. Check before adding any persist to wallLayoutStore.

**Resolution [2026-05-08]:** Audit confirmed — `selection` was never in `WallLayoutSnapshot`; `persistWallLayout` and `rehydrateWallLayout` skip it intentionally. Locked with a regression test in `packages/stores/src/__tests__/wallLayoutStore.test.ts` (`selection persistence boundary` describe) and a clarifying docstring on `WallLayoutSnapshot` in `packages/stores/src/wallLayoutStore.ts` documenting the boundary + the Set→string[] conversion pattern any future author should use if persistent multi-select recall ever becomes a spec requirement. Note the original entry's "STORE_LAYER = 'view'" claim is slightly off — `wallLayoutStore` is `STORE_LAYER = 'annotation-per-project'` per F4; selection is the per-session view-state field within that store, and the persist boundary excludes it correctly.

---

### Azure `rowProvenance` Dexie table — deferred [RESOLVED 2026-05-07 — see decision-log F3.6-β SHIPPED entry]

**Status:** RESOLVED via F3.6-β (PR #135). Provenance now persists on Azure as an envelope facet on `EvidenceSnapshot` (D1; no separate `rowProvenance` table — `RowProvenanceTag[]` rides the snapshot record). Cloud-sync round-trips the facet through Blob Storage; ETag optimistic concurrency on `_snapshots.json` catalog handles concurrent-paste races. F3.5 D3 asymmetry closed.

**Surfaced by:** Data-Flow Foundation F3.5 plan + P2 implementation, 2026-05-06.

**Description:** F3.5's `EVIDENCE_ADD_SNAPSHOT` handler in Azure (`apps/azure/src/persistence/applyAction.ts`) persists snapshot only; provenance tracking stays session-only via the existing `setRowProvenance` prop callback in `apps/azure/src/features/data-flow/useEditorDataFlow.ts`. Asymmetric persistence vs PWA (which atomically writes provenance inside `db.transaction('rw', [evidenceSnapshots, rowProvenance], ...)`) is accepted for the F3.5 scope per locked decision D3. Adding a `rowProvenance` table to Azure requires:

- Azure Dexie schema bump (new table declaration with `&id, snapshotId` index)
- New cascade rule consumer (mirror PWA's bulkUpdate-on-archive pattern)
- Migration of any existing session-only provenance tracking surface to dispatch through the action layer
- Updates to `apps/azure/src/persistence/applyAction.ts` for both `EVIDENCE_ADD_SNAPSHOT` (atomic write) and `EVIDENCE_ARCHIVE_SNAPSHOT` (cascade soft-delete)

**Possible directions:**

- F3.6 (Azure normalization parity): A dedicated slice immediately after F3.5 — adds the table + atomic handler + cascade rule. Estimated 6-8 tasks.
- F4 (three-layer state codification): Folded into the broader Document/Annotation/View boundary work; provenance becomes part of the Annotation layer.
- Status quo: Accept asymmetric persistence indefinitely until cross-app provenance reconciliation becomes a feature need.

**Promotion path:** Recommendation is F3.6 if cloud-tier provenance becomes a paid-tier requirement (e.g., audit trail compliance for Six Sigma sessions); otherwise defer to F4 absorption. Logged 2026-05-06.

---

### Producer-side stamping of EvidenceSnapshot.stepCapabilities

**Surfaced by:** Canvas PR8-8b plan, 2026-05-07 — partial-integration policy.

**Description:** PR8-8b shipped the consumer surface for canvas drift (engine + hook + UI + app read path). The producer side — stamping `EvidenceSnapshot.stepCapabilities` at snapshot-create time so prior values are available for drift comparison — is deferred. Today snapshots can still land with `stepCapabilities === undefined`, so `priorStepStats` can be an empty Map and the drift indicator stays inert.

**Possible directions:**

- Identify the right call site: snapshot creation lives in `apps/pwa/src/hooks/usePasteImportFlow.ts` and the Azure equivalent, but the canvas process map + `measureSpecs` are not necessarily complete at paste time.
- Add a pure helper: `stampStepCapabilities({ map, rows, measureSpecs }) -> StepCapabilityStamp[]` in `@variscout/core/canvas`.
- Trigger a domain action after canvas authoring reaches a complete map for a snapshot, e.g. `EVIDENCE_STAMP_STEP_CAPABILITIES`.

**Promotion path:** small follow-up PR after PR8-8b merges. About 3 tasks.

**Resolution [2026-05-08]:** `stampStepCapabilities({ map, rows, measureSpecs })` helper added in `@variscout/core/canvas`; called inside the existing `EVIDENCE_ADD_SNAPSHOT` snapshot-construction sites in `apps/pwa/src/hooks/usePasteImportFlow.ts` and `apps/azure/src/features/data-flow/useEditorDataFlow.ts` so each new snapshot ships with `stepCapabilities` populated. No new action kind, no handler change. Empty maps at paste-time emit `[]` per the partial-integration policy in `docs/superpowers/plans/2026-05-08-canvas-polish-v1.md` — the drift indicator self-heals on the snapshot-after-canvas-authoring without further producer changes. Stamping uses the same rows variable that feeds `_proceedWithParsedData` (mirrors the existing `rowCount` source-of-truth per site).

---

### CanvasStepMiniChart histogram still uses first-12-raw-values pseudo-binning (vision §5.2)

**Surfaced by:** Canvas PR5 retrospective design review, 2026-05-06; carried forward to PR8-8b.

**Description:** The histogram branch in `CanvasStepMiniChart.tsx` plots the first 12 raw values normalized to the local min/max, not a true histogram. PR8-8b intentionally left this as-is to keep the slice scoped to drift + time-series.

**Possible directions:**

- Sturges' rule: `bins = ceil(log2(n) + 1)`. Cheap and well-known.
- Scott's rule: `binWidth = 3.49 * sigma * n^(-1/3)`. More statistically grounded.
- Add a small helper in `@variscout/core/stats`, e.g. `computeHistogramBins(values, rule)`, returning `{ x0, x1, count }[]`; bind `CanvasStepMiniChart` to bin counts.

**Promotion path:** small follow-up PR. About 2 tasks: helper + UI swap.

**Resolution [2026-05-08]:** `computeHistogramBins(values, rule?)` helper added in `@variscout/core/stats` (Sturges default, Scott option). `CanvasStepMiniChart` histogram branch now renders one bar per bin with bin counts as heights, replacing the first-12-raw-values normalization. Empty bins floor at 8% height so the bin axis stays legible — this replaces the prior 15% floor (which was tuned for 12 raw-value pseudo-bars; 8% reads more honestly when bin counts can legitimately be zero).

---
