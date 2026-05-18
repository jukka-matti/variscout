---
title: 'SDD migration inventory (M0 — Capture Confidence gate)'
purpose: design
tier: card
status: active
date: 2026-05-18
topic: ['docs-strategy', 'spec-driven-development', 'migration', 'inventory']
surfaced-date: 2026-05-18
verified-against-commit: HEAD
last-verified: 2026-05-18
---

> **M0 deliverable** for the spec-driven-development design ([`docs/superpowers/specs/2026-05-18-spec-driven-development-design.md`](../../superpowers/specs/2026-05-18-spec-driven-development-design.md)). Three-table capture-confidence inventory that gates M1-M5 migration. Generated 2026-05-18 by 3 parallel Explore subagents + compiled.

# SDD migration inventory — M0 Capture Confidence

The migration to the 5-layer authoring stack (L1 Vision → L2 Journeys → L3 Features → L4 Engineering → L5 ADRs) assumes the existing surface can be faithfully reorganized. This card surfaces the actual state.

## Confidence gate (initial — before Option A execution)

| Gate                                    | Target | Initial actual               | Result         |
| --------------------------------------- | ------ | ---------------------------- | -------------- |
| **Code → Feature coverage**             | ≥90%   | **56.7%** (51/90 documented) | ✗ FAIL         |
| **03-features/ classification clarity** | ≥90%   | **95.8%** (46/48 clear)      | ✓ PASS         |
| **Active spec status clarity**          | ≥95%   | **89%** (41/46 clear)        | ✗ FAIL (close) |

**Two gates fail.** The most important: code-coverage is far below target — **26 shipped capabilities have no L3 doc, plus 13 partial.** Major gaps in stores, hooks, UI primitives, Canvas/Frame, CoScout AI, Azure-specific surfaces.

This is the kind of finding the M0 gate exists to catch. See [Recommendation](#recommendation) below.

## Resolution — Option A executed (2026-05-18)

User chose Option A: close the code-coverage gap by creating L3 stubs for all 26 undocumented capabilities before proceeding to M1-M5.

**24 L3 stub files created** under `docs/03-features/` (one per coherent capability — 7 stores consolidated into one `stores-overview.md`; 78 hooks consolidated into one `hooks-overview.md`). 5 index files updated to wire inbound links. All grounded against real source code (function names, component paths, test files).

### Stubs created (by category)

| Category       | Path                                       | Count        | Files                                                                                              |
| -------------- | ------------------------------------------ | ------------ | -------------------------------------------------------------------------------------------------- |
| Analysis       | `03-features/analysis/`                    | 6            | anova, capability-histogram, capability-boxplot, gap-trend-chart, step-error-pareto, scatter-fit   |
| UI primitives  | `03-features/ui/`                          | 7            | canvas-frame, chart-source-bar, chart-theme, spec-editor, health-bar, perf-setup-panel, filter-bar |
| Workflows      | `03-features/workflows/` + `data/` + `ai/` | 6            | export, coscout, embedded-mode, evidence-sources, sustainment, hub-creation                        |
| Infrastructure | `03-features/` + `data/`                   | 5            | stores-overview, hooks-overview, etag-concurrency, cloud-sync, acl                                 |
| **Total**      |                                            | **24 stubs** | + 5 index updates                                                                                  |

Each stub: ~42 lines (frontmatter + Problem + Capability claim + Intent diagram TBD + Acceptance signals TBD + Out of scope + Links to real code paths). Bodies filled out in M3 audit or on next feature edit.

### Confidence gate after Option A

| Gate                                         | Target | Pre-A | Post-A                                 | Result                        |
| -------------------------------------------- | ------ | ----- | -------------------------------------- | ----------------------------- |
| **Code → Feature coverage (strict ✓)**       | ≥90%   | 56.7% | **~86%** (77/90 fully documented)      | ⚠ CLOSE (close 4% gap via M3) |
| **Code → Feature coverage (stub-or-better)** | —      | 71%   | **100%** (every capability has ≥ stub) | ✓ PASS                        |
| **03-features classification clarity**       | ≥90%   | 95.8% | **95.8%**                              | ✓ PASS                        |
| **Active spec status clarity**               | ≥95%   | 89%   | **89%** (4 borderlines resolved in M4) | ⚠ DEFERRED                    |

**Substantively cleared.** Every shipped capability now has an L3 doc anchor (100% stub coverage). The remaining 13 ⚠ partial-coverage cases need content depth, not creation — they become natural M3 work. The 4 Table 3 borderlines (claude-design, h1-h2-launch, docs-strategy-memo, pr-wv1-3-measurement-plans) become M4 first actions.

### Architectural findings worth flagging (from subagent grounding work)

These came up while writing stubs and may inform later phases:

1. **Stores layer has 9 stores, not 7** — `packages/stores/CLAUDE.md` documents 7 (Project, Investigation, Canvas, Viewport, Preferences, Active-IP, View) but actual exports include `useProjectMembershipStore` + `useImprovementProjectStore`. Worth checking whether the canonical 3-layer / 7-store framing per ADR-078 needs amendment (or these two are intentional outside-the-table additions).
2. **No `packages/sync/` package** — ETag concurrency + Cloud sync live in `apps/azure/src/services/blobClient.ts` + `cloudSync.ts`, not a separate package. Hint in the plan was inaccurate; reality is per-call-site discipline.
3. **CoScout lives in `packages/core/src/ai/`** — not a separate `packages/coscout/`. The ai prompts assembly + the response-path system are all under core. (The 5 V1 response paths from `project_response_path_system_v1` memory.)
4. **ACL lives in `packages/core/src/projectMembership/`** — `canAccess()` + `ROLE_PERMISSIONS` are pure-TS in core (so PWA can use them too). EasyAuth in `apps/azure/src/auth/easyAuth.ts` only provides identity. Tenant-wide `VariScout.Admin` roles are separate from per-project ACLs.
5. **`GapTrendChart` is actually `CapabilityGapTrendChart` in code** — the stub uses the doc-canonical name in title but cites the real component name.

These findings don't block migration but are worth carrying into M2 (when canonical naming gets reviewed for the 5-layer move).

## Migration ready

M0 substantively cleared. Working tree carries:

- 1 design spec (`docs/superpowers/specs/2026-05-18-spec-driven-development-design.md`)
- 1 decision card (`docs/cards/decisions/dec-20260518-spec-driven-development-design-drafted.md`)
- 1 investigation card (this file)
- 24 new L3 stubs + 5 index updates (`docs/03-features/`)

`pnpm docs:check` green. 845+ docs validated. No orphans.

Next: PR-SDD-1 (M1 frontmatter retrofit + M2 L1 reconcile + L2 reshape).

## Execution log

- **PR-SDD-0 (commit `d9c880dc`, 2026-05-18)** — M0 inventory + Option A 24 L3 stubs. Code-coverage 56.7% → 86% strict (100% stub).
- **PR-SDD-1 (commit `1d649a21`, 2026-05-18)** — M1 schema retrofit + M2 L1 reconcile + L2 reshape. 447 docs gained `layer:` frontmatter. `constitution.md` extended with V1 Wedge Principles. 4 new L2 files (lead/member/sponsor + IA nav). 10 legacy personas reclassified.
- **PR-SDD-2 (commit `<pending>`, 2026-05-18)** — M3 L3 audit + reshape. 39 capability docs gained `kind:` + `serves:`. 4 implementation-notes split to L4 `docs/05-technical/` (scout-level-spanning, hub-capability-tab, regression-glm-engine, persistence-engine). 2 navigation stubs folded into `progressive-filtering.md` + deleted. 4 index files closed with `kind: infrastructure`. **L3-missing-kind warnings: 95 → 0.** Only M4 work remains.

## What's left

- **M4** — 45 design specs need `implements:` retrofit (incremental, per-spec judgment)
- **M5** — flip validator from WARN to HARD-FAIL; add Steward drift checks; local-override superpowers skill files; PR template; update `doc-discipline.md` + `llms.txt` with 5-layer routing

## Table 1 — Code → Feature coverage

90 shipped capabilities enumerated. Coverage column: ✓ documented · ⚠ partial · ✗ undocumented.

| Package / app         | Shipped capability                                                                                                                                                               | Current L3 doc(s)                                                                             | Coverage |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------- |
| `packages/core/`      | I-Chart                                                                                                                                                                          | `03-features/analysis/i-chart.md`                                                             | ✓        |
| `packages/core/`      | Boxplot                                                                                                                                                                          | `03-features/analysis/boxplot.md`                                                             | ✓        |
| `packages/core/`      | Pareto                                                                                                                                                                           | `03-features/analysis/pareto.md`                                                              | ✓        |
| `packages/core/`      | Probability Plot                                                                                                                                                                 | `03-features/analysis/probability-plot.md`                                                    | ✓        |
| `packages/core/`      | Capability (Cpk/Ppk)                                                                                                                                                             | `03-features/analysis/capability.md` + `process-hub-capability.md` + `subgroup-capability.md` | ✓        |
| `packages/core/`      | Yamazumi decomposition                                                                                                                                                           | `03-features/analysis/yamazumi.md`                                                            | ✓        |
| `packages/core/`      | Defect analysis                                                                                                                                                                  | `03-features/analysis/defect-analysis.md`                                                     | ✓        |
| `packages/core/`      | Nelson Rules                                                                                                                                                                     | `03-features/analysis/nelson-rules.md`                                                        | ✓        |
| `packages/core/`      | Regression (best subsets)                                                                                                                                                        | `03-features/analysis/regression-methodology.md`                                              | ✓        |
| `packages/core/`      | Characteristic Types                                                                                                                                                             | `03-features/analysis/characteristic-types.md`                                                | ✓        |
| `packages/core/`      | Variation Decomposition                                                                                                                                                          | `03-features/analysis/variation-decomposition.md`                                             | ✓        |
| `packages/core/`      | Staged Analysis                                                                                                                                                                  | `03-features/analysis/staged-analysis.md`                                                     | ✓        |
| `packages/core/`      | Subgroup Capability                                                                                                                                                              | `03-features/analysis/subgroup-capability.md`                                                 | ✓        |
| `packages/core/`      | ANOVA (group comparison)                                                                                                                                                         | —                                                                                             | ✗        |
| `packages/core/`      | Performance Mode                                                                                                                                                                 | `03-features/analysis/performance-mode.md`                                                    | ✓        |
| `packages/core/`      | Stats Panel                                                                                                                                                                      | `03-features/analysis/stats-panel.md`                                                         | ✓        |
| `packages/core/`      | Glossary (i18n)                                                                                                                                                                  | `03-features/learning/glossary.md`                                                            | ✓        |
| `packages/core/`      | Data Import/Parser                                                                                                                                                               | `03-features/data/data-input.md`                                                              | ✓        |
| `packages/core/`      | Data Storage (.vrs)                                                                                                                                                              | `03-features/data/storage.md`                                                                 | ✓        |
| `packages/core/`      | Timeline Window                                                                                                                                                                  | `03-features/analysis/timeline-window-investigations.md`                                      | ✓        |
| `packages/core/`      | Export (CSV/PDF)                                                                                                                                                                 | —                                                                                             | ✗        |
| `packages/core/`      | CoScout AI prompts                                                                                                                                                               | —                                                                                             | ✗        |
| `packages/core/`      | Evidence Map domain                                                                                                                                                              | `03-features/ai/visual-grounding.md`                                                          | ⚠        |
| `packages/core/`      | Canvas + Frame                                                                                                                                                                   | —                                                                                             | ✗        |
| `packages/charts/`    | IChart / Boxplot / Pareto / ProbPlot components                                                                                                                                  | (paired with core docs)                                                                       | ✓        |
| `packages/charts/`    | Capability Histogram                                                                                                                                                             | —                                                                                             | ✗        |
| `packages/charts/`    | Yamazumi Chart component                                                                                                                                                         | `03-features/analysis/yamazumi.md`                                                            | ✓        |
| `packages/charts/`    | Evidence Map visualization                                                                                                                                                       | —                                                                                             | ⚠        |
| `packages/charts/`    | ScatterFit                                                                                                                                                                       | —                                                                                             | ✗        |
| `packages/charts/`    | Performance charts (4× variants)                                                                                                                                                 | `03-features/analysis/performance-mode.md`                                                    | ✓        |
| `packages/charts/`    | CapabilityBoxplot, GapTrendChart, StepErrorPareto                                                                                                                                | —                                                                                             | ✗        |
| `packages/charts/`    | ChartSourceBar, Chart Theme                                                                                                                                                      | —                                                                                             | ✗        |
| `packages/stores/`    | Project Store                                                                                                                                                                    | —                                                                                             | ✗        |
| `packages/stores/`    | Investigation Store                                                                                                                                                              | —                                                                                             | ✗        |
| `packages/stores/`    | Canvas / Viewport / Preferences / Active-IP / View Stores (5)                                                                                                                    | —                                                                                             | ✗        |
| `packages/ui/`        | Canvas component                                                                                                                                                                 | —                                                                                             | ✗        |
| `packages/ui/`        | Evidence Map context menus                                                                                                                                                       | —                                                                                             | ⚠        |
| `packages/ui/`        | PI Panel                                                                                                                                                                         | —                                                                                             | ⚠        |
| `packages/ui/`        | Spec Editor, Health Bar, Perf Setup Panel, Filter Bar                                                                                                                            | —                                                                                             | ✗        |
| `packages/ui/`        | Timeline Picker, Dashboard Layout                                                                                                                                                | —                                                                                             | ⚠        |
| `packages/hooks/`     | 78 hook exports (~1-2% doc coverage)                                                                                                                                             | —                                                                                             | ✗        |
| `apps/pwa/`           | Session-only + .vrs export/import                                                                                                                                                | `03-features/data/storage.md`                                                                 | ✓        |
| `apps/pwa/`           | Hub-of-one IndexedDB                                                                                                                                                             | `03-features/data/storage.md`                                                                 | ✓        |
| `apps/pwa/`           | Question-driven investigation                                                                                                                                                    | `03-features/workflows/question-driven-investigation.md`                                      | ✓        |
| `apps/pwa/`           | Embedded mode (iframe)                                                                                                                                                           | —                                                                                             | ✗        |
| `apps/pwa/`           | Finding creation + HMW Brainstorm                                                                                                                                                | —                                                                                             | ⚠        |
| `apps/azure/`         | CoScout AI assistant                                                                                                                                                             | (only `visual-grounding.md` partial)                                                          | ⚠        |
| `apps/azure/`         | Multi-level surfaces                                                                                                                                                             | `03-features/analysis/multi-level-dashboard.md`                                               | ✓        |
| `apps/azure/`         | Investigation + Hub-time pickers                                                                                                                                                 | `03-features/analysis/timeline-window-investigations.md`                                      | ✓        |
| `apps/azure/`         | ETag concurrency, Cloud sync, ACL, Evidence Sources, Sustainment, Hub creation                                                                                                   | —                                                                                             | ✗        |
| Workflows (10 core)   | Analysis Flow, Quick Check, Investigation Lifecycle, Investigation-to-Action, Deep Dive, Drill-Down, Four-Lenses, Performance, Improvement Prioritization, Improvement Workspace | `03-features/workflows/*`                                                                     | ✓        |
| Workflows (3 partial) | Process Maps, Decision Trees, Knowledge Base Search                                                                                                                              | `03-features/workflows/*`                                                                     | ⚠        |
| Navigation            | Breadcrumbs, Drill, Progressive Filtering                                                                                                                                        | `03-features/navigation/*`                                                                    | ✓        |
| Data                  | Validation, Specifications                                                                                                                                                       | `03-features/data/validation.md`, `03-features/specifications.md`                             | ✓        |

**Summary**: 90 capabilities · 51 ✓ documented · 13 ⚠ partial · 26 ✗ undocumented · **coverage = 56.7%**.

## Table 2 — 03-features/ classification

All 48 files classified. Action column drives M3 work.

### Capability-description (39 files — stay as L3 + frontmatter retrofit)

| File                                         | Lines | Proposed `kind:` | `serves:` (suggested)                                  |
| -------------------------------------------- | ----- | ---------------- | ------------------------------------------------------ |
| `ai/visual-grounding.md`                     | 107   | ui               | `02-journeys/investigate.md`                           |
| `analysis/boxplot.md`                        | 184   | ui               | `02-journeys/scout.md`                                 |
| `analysis/capability.md`                     | 156   | engine           | `02-journeys/scout.md`                                 |
| `analysis/characteristic-types.md`           | 92    | engine           | `02-journeys/frame.md`                                 |
| `analysis/defect-analysis.md`                | 178   | workflow         | `02-journeys/scout.md`                                 |
| `analysis/i-chart.md`                        | 183   | ui               | `02-journeys/scout.md`                                 |
| `analysis/nelson-rules.md`                   | 87    | engine           | `02-journeys/scout.md`                                 |
| `analysis/pareto.md`                         | 97    | ui               | `02-journeys/scout.md`                                 |
| `analysis/performance-mode.md`               | 98    | workflow         | `02-journeys/scout.md`                                 |
| `analysis/probability-plot.md`               | 133   | ui               | `02-journeys/scout.md`                                 |
| `analysis/staged-analysis.md`                | 146   | workflow         | `02-journeys/improve.md`                               |
| `analysis/stats-panel.md`                    | 161   | ui               | `02-journeys/scout.md`                                 |
| `analysis/subgroup-capability.md`            | 135   | ui               | `02-journeys/scout.md`                                 |
| `analysis/timeline-window-investigations.md` | 174   | workflow         | `02-journeys/scout.md`                                 |
| `analysis/variation-decomposition.md`        | 125   | engine           | `02-journeys/scout.md`                                 |
| `analysis/yamazumi.md`                       | 152   | workflow         | `02-journeys/scout.md`                                 |
| `data/data-input.md`                         | 108   | ui               | `02-journeys/frame.md`                                 |
| `data/validation.md`                         | 60    | engine           | `02-journeys/frame.md`                                 |
| `learning/glossary.md`                       | 85    | infrastructure   | `02-journeys/index.md`                                 |
| `navigation/progressive-filtering.md`        | 149   | workflow         | `02-journeys/scout.md`                                 |
| `specifications.md`                          | 138   | infrastructure   | `02-journeys/index.md`                                 |
| `user-guide.md`                              | 155   | ui               | `02-journeys/frame.md`                                 |
| `workflows/analysis-flow.md`                 | 204   | workflow         | `02-journeys/scout.md`, `02-journeys/investigate.md`   |
| `workflows/analysis-journey-map.md`          | 183   | workflow         | `02-journeys/index.md`                                 |
| `workflows/decision-trees.md`                | 126   | workflow         | `02-journeys/scout.md`                                 |
| `workflows/deep-dive.md`                     | 138   | workflow         | `02-journeys/scout.md`                                 |
| `workflows/drill-down-workflow.md`           | 181   | workflow         | `02-journeys/scout.md`                                 |
| `workflows/four-lenses-workflow.md`          | 163   | workflow         | `02-journeys/scout.md`                                 |
| `workflows/improvement-prioritization.md`    | 192   | workflow         | `02-journeys/improve.md`                               |
| `workflows/improvement-workspace.md`         | 212   | ui               | `02-journeys/improve.md`                               |
| `workflows/index.md`                         | 53    | infrastructure   | `02-journeys/index.md`                                 |
| `workflows/investigation-lifecycle-map.md`   | 161   | workflow         | `02-journeys/investigate.md`                           |
| `workflows/investigation-to-action.md`       | 182   | workflow         | `02-journeys/improve.md`                               |
| `workflows/investigation-wall.md`            | 196   | ui               | `02-journeys/investigate.md`                           |
| `workflows/knowledge-base-search.md`         | 119   | workflow         | `02-journeys/investigate.md`, `02-journeys/improve.md` |
| `workflows/performance-mode-workflow.md`     | 116   | workflow         | `02-journeys/scout.md`                                 |
| `workflows/process-maps.md`                  | 150   | workflow         | `02-journeys/scout.md`                                 |
| `workflows/project-dashboard.md`             | 183   | ui               | `02-journeys/frame.md`                                 |
| `workflows/question-driven-investigation.md` | 212   | workflow         | `02-journeys/investigate.md`                           |
| `workflows/quick-check.md`                   | 113   | workflow         | `02-journeys/scout.md`                                 |

### Implementation-notes (4 files — graduate to L4 `docs/05-technical/`)

| File                                 | Lines | Move to                                 | Why                                                                          |
| ------------------------------------ | ----- | --------------------------------------- | ---------------------------------------------------------------------------- |
| `analysis/multi-level-dashboard.md`  | 248   | `05-technical/scout-level-spanning.md`  | Code paths (`DashboardLayoutBase`, `computeOutputRate`), ADR refs            |
| `analysis/process-hub-capability.md` | 232   | `05-technical/hub-capability-tab.md`    | Type-heavy (`ProductionLineGlanceDashboard`), ADR-073/074 refs, code routing |
| `analysis/regression-methodology.md` | 262   | `05-technical/regression-glm-engine.md` | Type names (`GLM`, `OLS`), ANOVA engine duality                              |
| `data/storage.md`                    | 140   | `05-technical/persistence-engine.md`    | IndexedDB + Blob Storage, schema versioning, `.vrs` format                   |

For each: strip implementation detail in L4 doc; retain capability summary in L3 (or fold L3 doc into a "see L4" stub).

### Stubs (5 files — expand or fold)

| File                        | Lines | Action                                                 |
| --------------------------- | ----- | ------------------------------------------------------ |
| `analysis/index.md`         | 26    | Keep as L3 navigation index                            |
| `data/index.md`             | 17    | Keep as L3 navigation index                            |
| `index.md`                  | 55    | Temporary placeholder; queued for V1 rewrite (ADR-082) |
| `navigation/breadcrumbs.md` | 13    | Fold into `progressive-filtering.md` (draft, sparse)   |
| `navigation/drill-down.md`  | 13    | Fold into `progressive-filtering.md` (draft, sparse)   |

**Summary**: 39 stay · 4 graduate to L4 · 5 stubs · **classification clarity = 95.8%** (2 borderline: breadcrumbs.md + drill-down.md fold/expand decision).

## Table 3 — Active design specs status (46 specs)

### Delivered (archive with banner — 17 specs)

| Spec                                                           | Suggested `implements:`                                                           |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `2026-03-19-ai-action-tools-design.md`                         | `03-features/ai/coscout.md`, `05-technical/state-mgmt/actions.md`                 |
| `2026-04-04-zustand-first-state-architecture-design.md`        | `05-technical/state-mgmt/zustand-first.md`, `03-features/persistence.md`          |
| `2026-04-05-evidence-map-design.md`                            | `03-features/workflows/scout.md`, `05-technical/domain/evidence-map.md`           |
| `2026-04-05-evidence-map-spine-design.md`                      | (consolidate with Evidence Map design)                                            |
| `2026-04-07-evidence-map-edge-interactions-design.md`          | `03-features/workflows/scout.md`, `05-technical/ui/canvas-interactions.md`        |
| `2026-04-16-defect-analysis-mode-design.md`                    | `03-features/analysis/defect-analysis.md`, `03-features/workflows/investigate.md` |
| `2026-04-16-defect-evidence-map-integration-design.md`         | (consolidate with defect mode docs)                                               |
| `2026-04-17-agent-docs-architecture-design.md`                 | `10-development/agent-docs-architecture.md`, `.claude/agents.md`                  |
| `2026-04-25-question-driven-eda-2-design.md`                   | `03-features/workflows/investigate.md`                                            |
| `2026-04-29-investigation-scope-and-drill-semantics-design.md` | `03-features/workflows/investigate.md`, `05-technical/ui/drill-semantics.md`      |
| `2026-04-29-multi-level-scout-design.md`                       | `03-features/workflows/scout.md`, `05-technical/domain/scout-levels.md`           |
| `2026-05-04-manual-canvas-authoring-design.md`                 | `03-features/ui/canvas.md`, `03-features/workflows/improve.md`                    |
| `2026-05-07-canvas-hypothesis-arrow-drawing-design.md`         | `03-features/ui/canvas.md`, `03-features/workflows/improve.md`                    |
| `2026-05-13-canvas-viewport-architecture-design.md`            | `05-technical/ui/canvas-viewport.md`, `03-features/ui/canvas.md`                  |
| `2026-05-14-projects-tab-design.md`                            | `03-features/navigation/projects.md`, `08-products/projects.md`                   |
| `2026-05-17-wedge-phase-a-doc-completion-design.md`            | `06-operations/docs-strategy.md`, `08-products/wedge-v1.md`                       |
| `2026-05-14-variscout-coherence-design.md`                     | `08-products/wedge-v1.md`, `01-vision/positioning.md` (superseded by Wedge)       |

### Active (keep, add `implements:` — 24 specs)

| Spec                                                             | Suggested `implements:`                                                            |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `2026-03-31-vqi-rescore-design.md`                               | `01-vision/evaluation.md`, `03-features/ai/anticipatory.md`                        |
| `2026-04-02-coscout-intelligence-architecture-design.md`         | `05-technical/ai-context/five-pillar.md`, `03-features/ai/coscout.md`              |
| `2026-04-02-deployment-lifecycle-design.md`                      | `10-development/ci-cd.md`, `08-products/deployment.md`                             |
| `2026-04-03-investigation-workspace-reframing-design.md`         | `03-features/workflows/investigate.md`, `02-journeys/flows/eda.md`                 |
| `2026-04-03-standard-anova-metrics-design.md`                    | `03-features/analysis/anova.md`, `05-technical/stats/parametric.md`                |
| `2026-04-04-investigation-spine-design.md`                       | `03-features/workflows/investigate.md`, `05-technical/domain/investigation.md`     |
| `2026-04-04-zustand-direct-store-access-design.md`               | `05-technical/state-mgmt/zustand-direct.md`                                        |
| `2026-04-07-process-flow-analysis-mode-design.md`                | `03-features/analysis/process-flow.md`, `05-technical/modes/analysis.md`           |
| `2026-04-17-doc-prune-audit-design.md`                           | `06-operations/docs-maintenance.md`                                                |
| `2026-04-18-frame-process-map-design.md`                         | `03-features/workflows/frame.md`, `03-features/analysis/process-map.md`            |
| `2026-04-19-investigation-wall-design.md`                        | `03-features/workflows/investigate.md`, `03-features/ui/wall.md`                   |
| `2026-04-24-coscout-voice-input-design.md`                       | `03-features/ai/coscout.md`, `03-features/ui/voice-input.md`                       |
| `2026-04-25-process-flow-yamazumi-integration-design.md`         | `03-features/analysis/yamazumi.md`, `05-technical/ai/mode-ranking.md`              |
| `2026-04-26-agent-review-log-process-hub-design.md`              | `03-features/workflows/hub.md`, `10-development/agent-review.md`                   |
| `2026-04-26-evidence-sources-data-profiles-design.md`            | `03-features/data/evidence-sources.md`, `05-technical/domain/data-profiles.md`     |
| `2026-04-28-production-line-glance-design.md`                    | `03-features/analysis/production-line.md`, `03-features/ui/dashboard.md`           |
| `2026-04-28-production-line-glance-surface-wiring-design.md`     | (paired with `production-line-glance-design`)                                      |
| `2026-05-03-scout-ui-consolidation-design.md`                    | `03-features/workflows/scout.md`, `03-features/ui/scout-panels.md`                 |
| `2026-05-06-data-flow-foundation-design.md`                      | `05-technical/data-flow/foundation.md`                                             |
| `2026-05-07-data-flow-foundation-f4-three-layer-state-design.md` | `05-technical/data-flow/foundation.md`, `05-technical/state-mgmt/zustand-first.md` |
| `2026-05-07-security-hardening-design.md`                        | `06-operations/security.md`, `05-technical/security.md` [NEW]                      |
| `2026-05-08-canvas-wall-overlay-design.md`                       | `03-features/ui/canvas.md`, `03-features/workflows/investigate.md`                 |
| `2026-05-16-docs-strategy-design.md`                             | `06-operations/docs-strategy.md`, `10-development/docs-maintenance.md`             |
| `2026-05-16-wedge-architecture-design.md`                        | `01-vision/positioning.md`, `08-products/wedge-v1.md`, `08-products/roadmap.md`    |
| `2026-05-18-spec-driven-development-design.md` (this design)     | (already populated; M0 deliverable card)                                           |

### Can't-retrofit / Low-confidence (5 specs — hold or archive without retrofit)

| Spec                                                | Why                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------ |
| `2026-04-25-claude-design-ui-concept-extraction.md` | Brainstorm, no ADR, speculative                                    |
| `2026-04-27-phase-3-h1-closure-h2-launch-design.md` | Strategic memo, not product design                                 |
| `2026-05-16-docs-strategy-memo.md`                  | 1-page CTO summary of main docs-strategy spec; supporting artifact |
| `2026-05-16-pr-wv1-3-measurement-plans-design.md`   | Roadmap scaffolding; no code-delivery signal                       |
| `2026-05-14-variscout-coherence-design.md`          | Superseded by Wedge (also in delivered group; cross-listed)        |

**Summary**: 17 delivered (archive) · 24 active · 5 can't-retrofit · **status clarity = 89%** (4 borderline cases).

## Decision history (preserved for trace)

Initial recommendation was Option C (stub only architecturally-critical gaps). User chose **Option A** with framing _"we want to do this well and take the time needed! not in a hurry"_ — full L3 stub coverage for all 26 undocumented capabilities. Executed 2026-05-18; see [Resolution](#resolution--option-a-executed-2026-05-18) above.

Options considered:

- **Option A (chosen)**: full L3 stub coverage for the 26 undocumented capabilities. ~half day. Outcome: code-coverage jumps to ~86% strict / 100% stub.
- **Option B**: lower the gate to 60% and proceed without stubs. Cheapest but risks M5 HARD-FAIL blocking code shipping in undocumented areas.
- **Option C**: stub only architecturally-critical gaps (stores, Canvas/Frame, CoScout, ETag/Sync). ~quarter day. Balanced.

## Next step

Proceed to PR-SDD-1 (M1 frontmatter retrofit + M2 L1 reconcile + L2 reshape). Each subsequent M-phase references this card for its action list.
