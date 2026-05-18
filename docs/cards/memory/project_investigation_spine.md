---
title: 'Investigation Spine'
description: 'Three-thread five-sentence investigation experience — regression equation, hub UX, EDA heartbeat, lean What-If, CoScout tools (Apr 4 2026)'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 3a3313e47ac3d61c
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_investigation_spine.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

## Investigation Spine — IMPLEMENTED (Apr 4 2026)

Design spec: `docs/superpowers/specs/2026-04-04-investigation-spine-design.md` (13 sections)

### The Model

Three threads (narrative/evidence/projection) × five sentences (concern → direction → scope → mechanisms → confirmed) × three surfaces (PI panel / Investigation workspace / Improvement workspace).

**Key insight: the chart is the primary artifact.** Questions are chart navigation bookmarks. Findings are chart snapshots + comments. Hubs are curated chains of chart snapshots. The equation summarizes what the charts show.

### What Was Built (6 phases, 86 files, +5,002 lines)

**Phase 1: Regression Equation from Best Subsets**
- `computeSubsetSS()` now returns cell means + per-factor level effects (data was already computed, just discarded)
- `predictFromModel()` — predict outcome for factor level changes using the equation
- `computeHubProjection()` — equation-driven projection per SuspectedCause hub
- `detectEvidenceClusters()` — find question clusters that could form hubs
- `computeCoverage()` — R²adj-weighted investigation coverage %
- Characteristic-type-aware: nominal picks closest-to-zero, smaller picks lowest, larger picks highest

**Phase 2: Equation Display + SCOUT Surfaces**
- `EquationDisplay` component — compact `Y = 12.1 + Shift(Day −0.3, Night +0.8)` in PI panel
- BestSubsetsCard level effects on each ranking row
- Chart insights with effect magnitude ("Night adds +0.8g")
- Problem Statement includes effect size when Q3 answered
- AI context carries `bestModelEquation` (for NarrativeBar + CoScout)

**Phase 3: Hub Creation UX**
- `HubComposer` — inline (not modal), name-first, evidence pre-connected, live evidence badge
- `HubCard` — status badge, evidence, projection, edit/select/brainstorm actions
- `SynthesisPrompt` — appears when `detectEvidenceClusters()` finds uncovered clusters
- Wired in Azure InvestigationWorkspace, Editor, EditorDashboardView
- ConclusionCard updated for hub-based display in PI panel

**Phase 4: EDA Heartbeat**
- Follow-up generation gated at η² ≥ 5% (L2 main-effect, L3 interaction when ≥2 sig)
- Critical fix: `useQuestions` wasn't writing `etaSquared` to evidence field — downstream watcher never triggered
- "← next" highlight with 3-tier priority (new follow-ups → highest R²adj → oldest)
- Coverage progress bar with convergence signal at 80%
- Follow-up badges on auto-generated child questions

**Phase 5: Lean What-If (Yamazumi)**
- `LeanWhatIfSimulator` — analyst selects ANY activity (VA/NVA/Waste), one slider reduces time
- `LeanDistributionPreview` — stacked bar SVG with takt line
- 4 contextual presets: Eliminate, Match best, Reach takt, Halve
- Mode dispatch in `WhatIfPageBase`

**Phase 6: CoScout Tools**
- `suggest_suspected_cause` action tool (phase-gated to validating/converging)
- `connect_hub_evidence` action tool (gated to existing hubs)
- Phase-specific coaching prompts (initial/diverging/validating/converging × mode)
- Enriched AI context: hubs, coverage %, PS stage, equation summary

**P4 Additive:**
- ProcessHealthBar model projection (equation-driven, hedged "Model suggests")
- ProcessHealthBar lean variant (CT + takt instead of Cpk + yield)
- ImprovementSummaryBar lean variant (projected CT + takt)
- 24 component tests for HubComposer (8), HubCard (8), SynthesisPrompt (4), EquationDisplay (8)

### Two-Tier Question Model

- **SCOUT questions** = "look at this chart" (chart navigation bookmarks, auto-answerable from Factor Intel)
- **INVESTIGATE questions** = "why is this happening?" (mechanism questions, require gemba/expert/deeper analysis)
- The equation enriches SCOUT ("Night +0.8g" alongside boxplot) and powers INVESTIGATE projections

### MBB-Validated Safeguards

1. Interaction flag when L3 ΔR² > 2%
2. R²adj alongside every model projection
3. Cell sample counts (flag n < 5)
4. Hedged language: "Model suggests" not "will be"
5. Coverage ≠ completeness tooltip

### Key Files

- `packages/core/src/stats/bestSubsets.ts` — regression equation, predictFromModel, computeCoverage
- `packages/core/src/findings/helpers.ts` — computeHubProjection, detectEvidenceClusters
- `packages/ui/src/components/InvestigationConclusion/` — HubComposer, HubCard, SynthesisPrompt
- `packages/ui/src/components/ProcessIntelligencePanel/EquationDisplay.tsx`
- `packages/ui/src/components/WhatIfSimulator/LeanWhatIfSimulator.tsx`
- `packages/hooks/src/useProcessProjection.ts` — model + lean projection paths
- `packages/core/src/ai/prompts/coScout.ts` — phase coaching + new tool definitions

**Why:** Implements the holistic investigation experience designed in the brainstorming session. Connects FRAME → SCOUT → INVESTIGATE → IMPROVE → RESOLVE as one continuous story with the regression equation as the mathematical bridge between evidence and projection.

**How to apply:** When working on investigation features, the spine spec is the primary reference. Hub creation, equation display, EDA heartbeat, lean What-If, and CoScout tools are all implemented and wired.
