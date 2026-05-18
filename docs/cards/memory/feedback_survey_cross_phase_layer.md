---
title: 'Survey is the cross-phase methodology layer with 6 V1 rule categories + dual UI surface'
description: 'Per docs/01-vision/methodology.md §256 — Survey runs cross-phase, asking "what evidence is enough? what''s missing? collect what next?". 6 rule categories. Dual UI: inline + Inbox.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: c2dee32c9e159962
origin-session-id: 4dc98d7b-6a43-414c-8387-61555905cfc7
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_survey_cross_phase_layer.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Survey is **VariScout's cross-phase methodology layer** — the layer that asks *"what evidence is enough? what's missing? collect or check what next?"* across FRAME, SCOUT, INVESTIGATE, IMPROVE, IP, Sustainment, Handoff. It's the methodology-grounded answer to "the system should help process owners remember + nudge + flag missing evidence."

**Why:** Per `docs/01-vision/methodology.md` §256: Survey is *"not a fifth phase and not a standalone statistical mode. It is a readiness check that can run in FRAME, SCOUT, INVESTIGATE, IMPROVE, REPORT, and Process Hub cadence reviews."* Existing data model has `SurveyStatus` + `ProcessHubSurveyReadinessSummary` but no first-class user-visible Survey UX surface yet (pre-RPS V1).

Per RPS V1 D5 + D11: Survey gets a first-class V1 surface.

## 6 V1 rule categories

| # | Category | Examples | Renders at |
|---|---|---|---|
| 1 | **Status derivation** | Auto-derive `needs-disconfirmation` (≥2 evidence types but no falsification attempt); auto-promote `evidenced` → `confirmed` when triangulation passes | Hypothesis status badge on Wall + IP Section 4 |
| 2 | **Data-collection prompts** | *"H1 has data only — needs gemba walk to triangulate"* | Wall missing-evidence panel + per-hypothesis card hints + IP Section 4 |
| 3 | **Triangulation readiness** | *"1 STEP AWAY — adding one expert observation OR closing the disconfirmation task would promote H1 from evidenced to confirmed"* | Per-hypothesis card "1 step away" badge + IP Section 4 |
| 4 | **Power / sample-size warnings** | *"H2 boxplot has n=4 in category B — ANOVA may be unstable"* | Inline on Wall mini-charts + IP Section 2 |
| 5 | **Drift detection** | *"Sustainment Mix-temp control: tick 3 of 4 below target"* | Inbox digest + Sustainment form + IP Section 6 |
| 6 | **Lifecycle gaps** | *"IP active but no ImprovementIdea selected"* | Inbox digest + IP Section 6 + Handoff form |

## Pattern X — dual UI surface

- **Inline** (active analyst working): Survey hints render contextually at every form/surface. Wall's "MISSING EVIDENCE — THE DETECTIVE MOVE NOBODY SHIPS" panel + per-hypothesis "1 STEP AWAY" badge are exactly Survey rendering inline (vision slides 3+4).
- **Inbox digest** (passive process owner during cadence review): Hub-overview top aggregates cross-cutting prompts ("3 things need attention this cycle").

Both serve different jobs — inline for mid-thought nudges; Inbox for forgetfulness during weekly check-ins.

## Why Wall vision UX gaps are Survey

Wall vision V1 Detective-pack closes 3 of 4 gaps from vision slide 3 (mini-charts + brush-to-pin + 5th status). All 4 are **Survey rendered inline on the Wall:**
- Mini-charts inside HypothesisCard = Survey-rendered evidence preview
- Brush-to-pin gesture = Survey-driven action affordance
- 5th status `needs-disconfirmation` = Survey readiness state (status derivation rule)
- Best-subsets inline (deferred V2) = Survey-rendered "what factor would strengthen the model?"

Treating them as 4 separate features misses the unifying methodology. Treating them as Survey-rendered-on-Wall makes them one design effort.

## How to apply

- When designing a new surface (any artifact form, any drill-down, any cadence view), ask: which of the 6 Survey rule categories are relevant here?
- Design space for Survey hints inline at the surface. Don't bury Survey state in backend computation — make it user-visible.
- For cross-cutting prompts (chain transitions, retrospective reminders), use the Inbox digest pattern.
- Survey rules live in `packages/core/src/survey/` per-domain (`wall.ts`, `improvementProject.ts`, `sustainment.ts`, `handoff.ts`, `inbox.ts`) + shared engine in `index.ts`. Each rule: `(context: SurveyContext) => SurveyHint[]`.

Related:
- `project_response_path_system_v1` — RPS V1 spec where Survey is locked as cross-phase layer (D5, D11, §5)
- `project_investigation_wall_vision_ui_mock` — vision slides 3+4 showing inline Survey UX
