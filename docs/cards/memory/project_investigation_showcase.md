---
title: 'Seeded showcase samples'
description: 'Two pre-populated demo investigations plus the SampleConfig extensions that make full-journey seeding possible'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: 0ae19f95-e263-4761-a944-87c150a32a2f
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_investigation_showcase.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

VariScout now has TWO seeded showcase investigations that auto-populate findings, questions, hubs, causal links, and PDCA ideas on load. Both live under `packages/data/src/samples/`.

**1. Fill-weight showcase (Apr 2026)** — `investigation-showcase.ts`
- 216 rows, 4 factors (Line, Shift, Material_Batch, Operator)
- 6 questions, 5 findings, 1 hub, 2 improvement ideas
- Story: Line 2 nozzle wear (key driver η²=0.25), night shift fatigue contributing, batch/operator ruled out
- Doc: `docs/04-cases/investigation-showcase/README.md`

**2. Syringe-barrel-weight showcase (Apr 18 2026, PR #65)** — `syringe-barrel-weight.ts`
- 300 rows, 6 factors (Lot_ID, Hold_Pressure_bar, Cavity, Operator, Shift, Defect_Type)
- 9 questions, 7 findings, 1 hub, 4 causal links, 3 PDCA ideas
- Story: Green Belt-calibrated — disordinal Lot × Pressure interaction, Cavity main effect, Underweight-dominated defect Pareto, plus rational n=5 subgroups so the capability view actually renders
- URL: `?sample=syringe-barrel-weight`
- Purpose: end-to-end RDMAIC walkthrough for trainees / evaluators

**How samples seed state** (extended in PR #65):
- `SampleConfig.investigation` — `{ findings, questions, suspectedCauses, causalLinks, categories }` (all optional)
- `SampleConfig.subgroupConfig` — rational subgrouping (e.g. `{method:'fixed-size', size:5}`). Default is size=1 which makes capability view useless.
- `SampleConfig.displayOptions` — merged with current; use `standardIChartMetric:'measurement'` to land on raw-value I-chart not capability view
- `SampleConfig.separateParetoData` — pre-aggregated defect counts; when present `paretoMode` switches to 'separate'
- `useDataIngestion.loadSample` pipes all of them via actions: `setFindings/setQuestions/setCategories/setSuspectedCauses/setCausalLinks/setSubgroupConfig/setDisplayOptions/setSeparateParetoData+setParetoMode`

**Pre-existing gap fixed in PR #65:** the fill-weight showcase built `suspectedCauses` in its config but PWA never loaded them (Azure did via Editor.tsx:730). Both apps now pipe hubs + causalLinks through the shared ingestion hook.

**When adding a new seeded sample:** mirror the literal-typed-object pattern with stable string IDs (not factory calls) so cross-references (question.linkedFindingIds → finding.id) resolve deterministically. Tests are not required per `packages/data/CLAUDE.md` — browser verification (+`--chrome`) is the convention.
