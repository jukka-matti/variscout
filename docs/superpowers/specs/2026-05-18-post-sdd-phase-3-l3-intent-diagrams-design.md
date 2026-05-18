---
title: 'Post-SDD Phase 3 — L3 intent diagrams + knowledge-base-search fill'
purpose: design
tier: living
status: draft
audience: human
layer: spec
implements:
  - docs/03-features/ai/coscout.md
  - docs/03-features/ai/visual-grounding.md
  - docs/03-features/analysis/anova.md
  - docs/03-features/analysis/boxplot.md
  - docs/03-features/analysis/capability-boxplot.md
  - docs/03-features/analysis/capability-gap-trend-chart.md
  - docs/03-features/analysis/capability-histogram.md
  - docs/03-features/analysis/capability.md
  - docs/03-features/analysis/characteristic-types.md
  - docs/03-features/analysis/defect-analysis.md
  - docs/03-features/analysis/i-chart.md
  - docs/03-features/analysis/pareto.md
  - docs/03-features/analysis/performance-mode.md
  - docs/03-features/analysis/scatter-fit.md
  - docs/03-features/analysis/stats-panel.md
  - docs/03-features/analysis/step-error-pareto.md
  - docs/03-features/analysis/subgroup-capability.md
  - docs/03-features/analysis/timeline-window-investigations.md
  - docs/03-features/analysis/variation-decomposition.md
  - docs/03-features/data/embedded-mode.md
  - docs/03-features/data/evidence-sources.md
  - docs/03-features/data/export.md
  - docs/03-features/ui/chart-source-bar.md
  - docs/03-features/ui/filter-bar.md
  - docs/03-features/ui/health-bar.md
  - docs/03-features/ui/perf-setup-panel.md
  - docs/03-features/ui/spec-editor.md
  - docs/03-features/user-guide.md
  - docs/03-features/workflows/hub-creation.md
  - docs/03-features/workflows/improvement-prioritization.md
  - docs/03-features/workflows/investigation-to-action.md
  - docs/03-features/workflows/investigation-wall.md
  - docs/03-features/workflows/knowledge-base-search.md
  - docs/03-features/workflows/process-maps.md
  - docs/03-features/workflows/quick-check.md
  - docs/03-features/workflows/sustainment.md
last-reviewed: 2026-05-18
---

# Post-SDD Phase 3 — L3 intent diagrams + knowledge-base-search fill

## Context

Phase 3 closes the **36 intent-diagram WARN bucket** that has been flagged by the validator since SDD M5 enforcement go-live. Per the new L3 contract (intent diagram mandatory per `kind:`), every L3 doc with `kind: ui | workflow | engine` must carry a `\`\`\`mermaid` block OR an ASCII-art block.

Today: 36 docs fall short of this heuristic. Mix of:

- **19 L3 stubs** created in PR-SDD-0 (bodies mostly "TBD" — diagrams are core content)
- **17 existing L3 docs** with substantive prose (lack only the visual surface — diagrams complete them)

Plus `knowledge-base-search.md` (98 lines, genuinely partial per Explore audit) gets a deeper fill — Problem / Capability / Mermaid + Acceptance signals / User workflow.

## Deltas

For each of the 36 docs, add an intent diagram appropriate to its `kind:`:

- **`kind: ui`** (21 docs) — Mermaid `flowchart`/`graph` of layout intent, or ASCII wireframe of the key surface
- **`kind: workflow`** (12 docs) — Mermaid `sequenceDiagram` or `flowchart` of the workflow steps
- **`kind: engine`** (4 docs) — Mermaid `flowchart` or `stateDiagram` of the compute path

Each diagram: small (5-25 lines). Grounded against actual shipped code where applicable (per `feedback_subagent_grounding_catches_drift`). Don't fabricate — read the source if the doc body doesn't already describe the flow.

Special: `knowledge-base-search.md` — the only doc Explore audit flagged as genuinely partial. Fill its body to L3 contract: Problem / Capability claim / Intent diagram / Acceptance signals / Out-of-scope / Links.

## Out of scope

- Touching the 5 `kind: infrastructure` stubs (`stores-overview`, `hooks-overview`, `etag-concurrency`, `cloud-sync`, `acl`) — they carry "no surface — see L4 design doc" disclosure per the L3 contract.
- Component renames or behavior changes — only doc edits.
- Filling other partials (M0 inventory's "Evidence Map context menus", "PI Panel", "Timeline Picker", "Dashboard Layout", "Finding creation + HMW Brainstorm" — Explore audit showed these are either adequate already or out of L3 scope).

## Acceptance signals

- `pnpm docs:check` reports **0 intent-diagram WARNs** (was 36)
- `knowledge-base-search.md` has all 6 L3 sections (Problem / Capability / Intent diagram / Acceptance / Out-of-scope / Links)
- `pnpm docs:check` green; no new HARD-FAILs or broken cross-refs

## Approach

4 parallel coder subagents, each handling ~9 docs:

- **Batch A** (10 analysis): anova, boxplot, capability, capability-boxplot, capability-gap-trend-chart, capability-histogram, characteristic-types, scatter-fit, stats-panel, step-error-pareto
- **Batch B** (9 analysis + ui): defect-analysis, i-chart, pareto, performance-mode, subgroup-capability, timeline-window-investigations, variation-decomposition; ui/chart-source-bar, ui/filter-bar
- **Batch C** (8 ui + ai): ui/health-bar, ui/perf-setup-panel, ui/spec-editor; ai/coscout, ai/visual-grounding; user-guide.md; data/embedded-mode, data/evidence-sources
- **Batch D** (9 workflow + data): data/export; workflows/hub-creation, improvement-prioritization, investigation-to-action, investigation-wall, knowledge-base-search (DEEP fill), process-maps, quick-check, sustainment

Each subagent reads the existing doc body + relevant source code, adds a small Mermaid block in the "Intent diagram" section (or replaces existing TBD), commits no files (working tree only).

## Dogfood note

This is the largest Phase to date (36 files). The SDD lifecycle still applies: spec lands with `implements:` listing all 36 targets, subagents apply, validate, commit, archive spec.
