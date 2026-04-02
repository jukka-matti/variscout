---
title: Mental Model Hierarchy
audience: [developer, analyst]
category: architecture
status: stable
related: [methodology, journey, investigation, ai, report]
---

# The Journey Model

> **Canonical architecture reference** for the journey model. For the analyst-facing visual guide with flowcharts and decision points, see [Analysis Journey Map](../../03-features/workflows/analysis-journey-map.md).

VariScout has **one mental model: the journey**. Each phase has its own method. Everything else is either a method within a phase, an orthogonal dimension, or a product concern.

---

## The Journey

```
Project List → Dashboard (saved projects) → Editor
             └→ Editor directly (new project or deep link)

FRAME → SCOUT → INVESTIGATE → IMPROVE

FRAME (Blue #3b82f6)
  Goal: Parse data, map columns, set specs, capture process context
  Method: Data validation, column type detection, factor role inference
  No AI active · Seeds AI context for later phases
  Investigation thread: issue statement + upfront questions captured in analysis brief (Azure)
  Exit: Analysis ready to explore

SCOUT (Green #22c55e)
  Goal: Discover where variation lives
  Method: Watson's EDA — I-Chart → Boxplot → Pareto → Capability
         Progressive drill-down using η² (Total SS contribution)
  AI: NarrativeBar, ChartInsightChips, CoScout active
  Factor Intelligence: generates evidence-ranked questions from R²adj
  Investigation thread: questions from Factor Intelligence + upfront questions; drill to answer
  Exit: Variation drivers quantified, findings pinned (or: process fine → done)

INVESTIGATE (Amber #f59e0b)
  Goal: Build understanding through structured learning
  Method: Investigation Diamond (4 phases)
    Initial → Diverging → Validating → Converging
  Tools: Question tree, auto-validation (η²), gemba tasks, expert input
  AI: Phase-aware diamond prompts in CoScout
  Investigation thread: questions answered, follow-ups spawned, multiple suspected causes identified
  Exit: Suspected causes identified, Problem Statement formulated

IMPROVE (Purple #8b5cf6)
  Goal: Improve to target through PDCA
  Method: Synthesis → Plan (Ideate + Select) → Do → Check → Act
    Synthesis: Weave findings into a suspected cause narrative (max 500 chars)
    Plan: Brainstorm improvements (Four Directions: Prevent, Detect, Simplify, Eliminate)
    Do: Implement improvement actions
    Check: Staged analysis (before vs after)
    Act: Standardize fix or loop (new PDCA cycle / re-investigate)
  Investigation thread: suspected causes drive improvement ideas (multiple targets)
  Exit: Outcome verified, finding resolved

× 3 ENTRY PATHS (modify each phase's behavior)
  Problem to Solve | Hypothesis to Check | Routine Check

+ TWO VOICES (orthogonal statistical concept)
  Voice of Process (control limits) | Voice of Customer (spec limits)

+ AI ADAPTATION (per phase + entry path)
  Phase-specific coaching, deterministic-first insights
```

---

## Investigation Thread

The investigation flows through all 4 phases as a continuous thread, driven by questions rather than hypotheses:

| Phase       | Investigation Thread Role                                                                                                         |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------- |
| FRAME       | Analyst captures issue statement + upfront questions in analysis brief (Azure) or enters with prior knowledge                     |
| SCOUT       | Factor Intelligence generates evidence-ranked questions from R²adj; analyst answers questions through drill-down                  |
| INVESTIGATE | Questions from SCOUT seed the question tree. Tree grows with follow-up questions, answers accumulate, suspected causes identified |
| IMPROVE     | Multiple suspected causes drive improvement ideas. Confirmation only comes when the fix works (outcome-based)                     |

The thread is not always linear — Routine Check entries may never reach INVESTIGATE, and Discovery entries generate questions during SCOUT rather than before.

**Issue Statement vs. Problem Statement:** The issue statement (vague concern) is the INPUT captured during FRAME. The problem statement (precise: what measure, how to change, what scope) is the OUTPUT that emerges when enough questions are answered during SCOUT/INVESTIGATE. See [EDA Mental Model](../../01-vision/eda-mental-model.md) for details.

---

## Per-Phase Detail

### FRAME

| Aspect   | Detail                                                                                      |
| -------- | ------------------------------------------------------------------------------------------- |
| Goal     | Define the problem space — parse data, map columns, set specs, capture process context      |
| AI       | Not active (no analysed data yet). Seeds AI context for later phases                        |
| Key Code | `useDataIngestion`, `useDataState`, `ColumnMapping`, `parser.ts`, `ProcessDescriptionField` |
| Exit     | `AnalysisState` populated: data parsed, columns mapped, specs set                           |

FRAME contains significant deterministic engines: data parsing and validation, column type detection, factor role keyword inference (equipment/temporal/operator/material/location), investigation category auto-grouping, and characteristic type selection. Process context and analysis brief (Azure) become the AI's grounding context in subsequent phases.

### SCOUT

| Aspect   | Detail                                                                                  |
| -------- | --------------------------------------------------------------------------------------- |
| Goal     | Discover variation patterns using Watson's EDA chart sequence                           |
| Method   | I-Chart (stability) → Boxplot (factor comparison) → Pareto (ranking) → Capability (Cpk) |
| AI       | NarrativeBar summarizes state; ChartInsightChips per chart; CoScout available           |
| Key Code | `useFilterNavigation`, `useVariationTracking`, `useChartScale`, chart data hooks        |
| Exit     | Variation drivers quantified, findings pinned                                           |

The Four Lenses (CHANGE/FLOW/FAILURE/VALUE) are pedagogical labels for the chart sequence — useful for teaching and marketing. Code uses chart names directly.

#### Analysis Modes (SCOUT)

The standard Four Lenses dashboard can be augmented with alternative analysis modes:

- **Performance Mode** — Multi-channel Cpk comparison (wide-format data)
- **Yamazumi Mode** — Lean time study (stacked activity bars)
- **Capability Mode** — I-Chart view toggle showing per-subgroup Cp/Cpk ("Are we meeting our Cpk target?")

Each mode is a view configuration, not a separate workflow. The analyst switches freely and all modes share the same findings, drill-down, and investigation infrastructure.

### INVESTIGATE

| Aspect   | Detail                                                                                          |
| -------- | ----------------------------------------------------------------------------------------------- |
| Goal     | Understand why — structured learning through question answering in the investigation diamond    |
| Method   | Investigation Diamond: Initial → Diverging → Validating → Converging (see detail below)         |
| AI       | Phase-aware diamond prompts in CoScout; investigation sidebar with uncovered factor suggestions |
| Key Code | `useFindings`, `useHypotheses`, `FindingsLog`, `FindingBoardView`, `InvestigationPhaseBadge`    |
| Exit     | Multiple suspected causes identified, finding marked `analyzed`                                 |

**Knowledge Base (Mode 3):** "Search Knowledge Base?" button in CoScout triggers Foundry IQ (Remote SharePoint via Azure AI Search). Returns folder-scoped documents using the user's own token (per-user security). Results injected as Layer 4 context for CoScout re-synthesis.

### IMPROVE

| Aspect   | Detail                                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Goal     | Fix the process through PDCA cycle                                                                                             |
| Method   | Plan (ideate + select with What-If) → Do (actions) → Check (staged analysis) → Act (standardize)                               |
| AI       | Suggests improvement actions; assists What-If; summarizes before/after comparison                                              |
| Key Code | `ImprovementWorkspaceBase`, `ImprovementContextPanel`, `PrioritizationMatrix`, `TrackView`, `WhatIfSimulator`, `simulation.ts` |
| Exit     | Outcome verified, finding `resolved`                                                                                           |

Finding status progression in IMPROVE: `improving` (actions assigned) → actions completed → verification passed → `resolved` (outcome recorded). The Improvement workspace provides a single hub for the full PDCA cycle: Plan view (prioritization + ideas) and Track view (actions + verification + outcome) without requiring the analyst to switch workspaces.

See [Improvement Workspace](../../03-features/workflows/improvement-workspace.md) for the full feature doc.

**Verification Evidence (Check phase):**

| Chart                | What it shows                                                             | Available when             |
| -------------------- | ------------------------------------------------------------------------- | -------------------------- |
| StagedComparisonCard | Mean shift, σ ratio, Cpk delta, pass rate delta (with color-coded arrows) | Staged comparison exists   |
| I-Chart              | Per-stage control limits + boundary lines, violation count reduction      | Staged stats exist         |
| Boxplot              | Dual-stage side-by-side sub-boxes per category                            | Factors + stage column set |
| Capability Histogram | Distribution overlay with `cpkBefore`/`cpkAfter` badges                   | Specs defined              |
| Pareto               | Rank change indicators (↑N/↓N) — "did anything else get worse?"           | Comparison data exists     |

`useVerificationCharts` controls which charts are available based on data state. `calculateStagedComparison()` computes all deltas.

---

## Investigation Diamond (4 Phases)

The diamond is a **structured learning** process within the INVESTIGATE phase, driven by questions:

| Phase      | Purpose                                                 | Analyst Activity                                                                                          |
| ---------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Initial    | Variation found, questions generated                    | Factor Intelligence generates ranked questions; upfront questions from FRAME seed the question tree       |
| Diverging  | Explore possible causes                                 | Answer questions, spawn follow-up questions — the question tree grows                                     |
| Validating | Gather evidence                                         | Answer each question — Data (ANOVA auto-validate), Gemba (go inspect), Expert input                       |
| Converging | Build understanding, identify multiple suspected causes | Rule out answered-no branches; mark causeRole (suspected-cause/contributing); formulate Problem Statement |

The diamond closes at Converging. What follows — improvement ideation, actions, implementation, and verification — belongs to the IMPROVE phase (PDCA).

**In code:** `InvestigationPhase` type (4 diamond phases + `'improving'` for IMPROVE), `InvestigationPhaseBadge` component, CoScout phase-aware prompts.

**Question answering** within the diamond uses `ValidationStatus`: `open → answered-yes / partial / ruled-out`. Auto-validation triggers when η² exceeds thresholds. Factor Intelligence auto-answers questions where R²adj < 5% as "ruled out."

---

## Finding Status as Journey Position

Finding status maps directly to which journey phase a finding is in:

| Diamond Phase | Finding Status | Journey Phase | Trigger                                      |
| ------------- | -------------- | ------------- | -------------------------------------------- |
| Initial       | observed       | INVESTIGATE   | Finding pinned from chart/filter             |
| Diverging     | investigating  | INVESTIGATE   | First hypothesis added                       |
| Validating    | investigating  | INVESTIGATE   | Validation evidence being gathered           |
| Converging    | analyzed       | INVESTIGATE   | Hypotheses resolved (supported/contradicted) |
| _(PDCA: Do)_  | improving      | IMPROVE       | Actions assigned                             |
| _(PDCA: Act)_ | resolved       | IMPROVE       | Outcome recorded                             |

The `improving` and `resolved` statuses map to IMPROVE's PDCA cycle, not the investigation diamond. The diamond closes at Converging (`analyzed`). The mapping exists in `useAIContext.ts` (phase detection from hypothesis tree state).

---

## Cross-Reference: Report Steps ↔ Journey Phases

The report uses **question-form labels** (story retelling) while the journey uses **verb-form labels** (user activity). FRAME is absent from the report because it's setup, not story.

| Report Step | Label                                                  | Journey Phase            | Journey Activity                          |
| ----------- | ------------------------------------------------------ | ------------------------ | ----------------------------------------- |
| Step 1      | Current Condition — "What does the process look like?" | SCOUT (initial overview) | Dashboard first look, key metrics         |
| Step 2      | Where Does Variation Come From?                        | SCOUT (drill-down)       | Progressive stratification, pin findings  |
| Step 3      | Why Is This Happening?                                 | INVESTIGATE              | Hypothesis tree, validation, convergence  |
| Step 4      | What Did We Do About It?                               | IMPROVE (actions)        | Action items, What-If projections         |
| Step 5      | Did It Work?                                           | IMPROVE (verification)   | Staged comparison, outcome recording      |
| —           | _(not in report)_                                      | FRAME                    | Data loading, column mapping, spec limits |

**Note:** `useReportSections` was built independently and invented its own structure. The two naming systems serve different purposes (storytelling vs activity framing) and both are valid.

---

## Entry-Path-Dependent Phase Goals

How the analyst entered the journey shapes what each phase needs to accomplish:

| Entry Scenario          | FRAME                     | SCOUT                    | INVESTIGATE                                             | IMPROVE                         |
| ----------------------- | ------------------------- | ------------------------ | ------------------------------------------------------- | ------------------------------- |
| **Problem to Solve**    | Define problem space      | Find variation drivers   | Understand why — build evidence for suspected cause     | Fix the process — Cpk to target |
| **Hypothesis to Check** | Record upfront hypothesis | Confirm/refute with data | If confirmed, understand mechanism; if refuted, diverge | Fix the confirmed cause         |
| **Routine Check**       | Load latest data          | Scan for new signals     | Only if a signal is found                               | Only if a cause is identified   |

This table is mirrored in [Analysis Journey Map § Entry-Path-Dependent Phase Goals](../../03-features/workflows/analysis-journey-map.md#entry-path-dependent-phase-goals).

**In code:** `EntryScenario` type in `@variscout/core/ai/types.ts`, detection via `detectEntryScenario()` in `@variscout/hooks` (flows to CoScout AI context).

---

## Five-Workspace Model

The analyst's cognitive task shifts across the journey. Five workspace tabs in the `ProjectHeader` match this:

| Workspace         | Purpose                        | Primary Phase         | Layout                   |
| ----------------- | ------------------------------ | --------------------- | ------------------------ |
| **Overview**      | Project orientation and status | All                   | Full page (landing)      |
| **Analysis**      | See data, discover patterns    | SCOUT, IMPROVE/Check  | Full page (main)         |
| **Investigation** | Build understanding of causes  | INVESTIGATE           | Full page (3-column)     |
| **Improvement**   | Plan, act, verify improvements | IMPROVE/Plan, Do, Act | Full page (3-column hub) |
| **Report**        | Share the story, export/PDF    | All                   | Full page                |

Navigation tabs in header: Overview | Analysis | Investigation | Improvement | Report. The Analysis tab has a dropdown for sub-modes (Standard / Performance / Yamazumi). Report is a workspace tab (not a modal overlay). Report/export/PDF actions live within the Report workspace. Journey phase dots remain separate (WHERE you are vs WHAT you're doing). Multi-screen via popout: `?view=findings`, `?view=improvement` URL params.

**In code:** `ProjectHeader` (single 44px header with 3 zones), `ImprovementWorkspaceBase` (3-column hub layout), `ImprovementContextPanel` (left panel: problem statement, target, causes), `PrioritizationMatrix` (Plan view: 4 axis presets, cause-colored dots), `TrackView` (Do/Check/Act: actions + verification + outcome), `SynthesisCard` (convergence narrative), `IdeaGroupCard` (hypothesis-grouped ideas), `ImprovementSummaryBar` (selection aggregation), `ReportViewBase` (workspace-aligned report). All in `@variscout/ui`. `useAutoSave` debounces saves on state changes. `activeImprovementView: 'plan' | 'track'` in `improvementStore`.

---

## Orthogonal Dimensions

These concepts apply across all journey phases — they are not phases themselves:

### Two Voices

**Voice of Process** (control limits, calculated from data) ↔ **Voice of Customer** (spec limits, entered by user)

Foundational statistical concept. In code: control limits are calculated; spec limits are user-entered. Both are always available across all phases.

### Three AI Modes

The journey behaves differently depending on which AI mode is active. Modes are orthogonal to phases — any mode works at any phase.

| Mode                    | Available On                                               | What Changes                                                                                                                                                     |
| ----------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **No AI**               | PWA (always), Azure without AI Foundry, or user toggle OFF | Dashboard shows deterministic insights only. All AI UI hidden with zero layout disruption.                                                                       |
| **AI Enabled**          | Azure Standard/Team with AI Foundry deployed               | NarrativeBar + ChartInsightChips + CoScout active from SCOUT onward. Phase-aware prompts. Actionable suggestions (drill, pin finding) with analyst confirmation. |
| **AI + Knowledge Base** | Azure Team (€199/month) only                               | Adds organizational document search (Foundry IQ) in CoScout from SCOUT onward (on-demand). Cross-project knowledge queries.                                      |

**Mode ≠ Tier:** AI is a horizontal capability, not tier-gated. A Standard customer who deploys AI Foundry gets Mode 2. Only the Knowledge Base (Mode 3) is Team exclusive.

**In code:** `showAI` visibility check, `aiEndpointConfigured` flag, `AdminKnowledgeSetup` preview gate.

#### Four AI Context Layers

| Layer   | What                | Source                                                | When                            |
| ------- | ------------------- | ----------------------------------------------------- | ------------------------------- |
| Layer 1 | Analysis state      | `buildAIContext()` from DataContext                   | Always (Mode 2+)                |
| Layer 2 | Process context     | User-entered description + auto-inferred factor roles | Optional (Mode 2+)              |
| Layer 3 | Knowledge grounding | ~47 glossary terms + 11 methodology concepts          | Always (Mode 2+)                |
| Layer 4 | Team documents      | Remote SharePoint via Foundry IQ                      | On-demand, SCOUT+ (Mode 3 only) |

Layers 1-3 are always in the prompt. Layer 4 is injected only when the user clicks "Search Knowledge Base?" in CoScout.

### Entry Paths

**Problem to Solve | Hypothesis to Check | Routine Check**

Entry paths describe WHY the analyst started. They modify the behavior and coaching text of each phase but don't change the phase sequence.

---

## Product Concerns (Not Mental Models)

These are product/business concepts that were previously listed as mental models. They are explicitly NOT part of the journey model:

| Concept             | What it is                                                                | Where it lives                                   |
| ------------------- | ------------------------------------------------------------------------- | ------------------------------------------------ |
| Value Levers        | Business capability tiers (L1–L5)                                         | `docs/01-vision/business-bible.md`               |
| Experience Spectrum | Product tiers (PWA → Standard → Team)                                     | `core/tier.ts`                                   |
| Two Speeds          | Quick Check (~5 min) / Deep Dive (~30 min)                                | Report auto-detection; absorbed by Entry Paths   |
| Three Contributions | Parallel Views, Progressive Stratification, Question-Driven Investigation | Marketing/methodology copy, not a separate model |
| Four Lenses         | CHANGE/FLOW/FAILURE/VALUE teaching labels                                 | Docs and marketing only (intentional)            |

---

## What's In Code

| Concept               | In Code? | Code Location                                                                                                |
| --------------------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| Journey Phases        | YES      | `JourneyPhase` type, `useJourneyPhase` (AI tool gating), [screen mapping](./journey-phase-screen-mapping.md) |
| Watson's EDA          | YES      | Chart components, stats engine                                                                               |
| Investigation Diamond | YES      | `InvestigationPhase` type (4 + `'improving'`), `InvestigationPhaseBadge`, CoScout prompts                    |
| Finding Status        | YES      | `FindingStatus` type, board columns, tier gating                                                             |
| AI Layers             | YES      | NarrativeBar, ChartInsightChip, CoScoutPanel                                                                 |
| Report Steps          | YES      | `useReportSections`, `ReportStepMarker`                                                                      |
| Two Voices            | YES      | Control limits (calculated) vs spec limits (user-entered)                                                    |
| Three Entry Paths     | YES      | `EntryScenario` type, `detectEntryScenario()` (AI context)                                                   |
| Question Validation   | YES      | `ValidationStatus` type (semantic: open/answered-yes/ruled-out/partial)                                      |
| Knowledge Layer       | YES      | `searchService.ts`, `useKnowledgeSearch`, `AdminKnowledgeSetup` (Team only, preview-gated)                   |
| Value Levers          | Indirect | Tier gating                                                                                                  |
| Four Lenses           | NO       | Teaching/marketing only (intentional)                                                                        |

---

## Known Gaps

### 1. Report Steps ≠ Journey Phases (Genuine Drift)

Report Steps were designed independently from the journey map and use question-form labels. Both are valid for their purpose. See the cross-reference table above.

### 2. Four Lenses Not In Code (Intentional)

The teaching shorthand (CHANGE/FLOW/FAILURE/VALUE) appears in docs and marketing but never in code. This is intentional and documented in methodology.md.

### 3. No Document Reference During FRAME or SCOUT

FRAME captures process context via a 500-character text field (`ProcessDescriptionField`). There is no way to upload, link, or reference structured process documents (SOPs, control plans, FMEA, equipment specs) during setup.

The Knowledge Layer (Foundry IQ) can search SharePoint docs, but only from INVESTIGATE onward — triggered on demand from CoScout. During SCOUT, when initial pattern interpretation would benefit most from process knowledge, the AI has no access to organizational documents.

A future enhancement could allow process document references during FRAME, so the AI context includes SOP knowledge from the earliest analysis phases. This was identified in the AI readiness review as a "Level 2 proactive extraction" capability.

### 4. Upfront Questions → Question Tree Connection (ADR-027, ADR-053)

The analysis brief captures upfront questions (formerly "upfront hypotheses") during FRAME. With the question-driven model (ADR-053), upfront questions merge with Factor Intelligence-generated questions into a ranked checklist during SCOUT. Factor Intelligence adds evidence (R²adj) to upfront questions when the factor matches, confirming or ruling out the analyst's initial intuition with data. This closes the gap between the brief and the question tree — upfront questions flow naturally into the investigation.

---

## Project Dashboard as Journey Entry Point

For **saved Azure projects**, the journey begins with the **Project Dashboard** rather than directly in the Editor:

```
Project List
    ↓ select saved project
loadProject() [hydrates AnalysisState from IndexedDB/OneDrive]
    ↓ has data?
    ├─ Yes (default) → Project Dashboard (activeView: 'dashboard')
    │                      → user navigates to Editor (any of: tab click, status item click, quick action)
    └─ No (new project) → Editor in FRAME mode
         └─ Deep link (Teams, ?finding=, ?chart=) → Editor at target directly (skip dashboard)
```

The dashboard is not a phase — it is an **orientation layer** before the phase journey begins (or resumes). It shows where the project stands across all phases without requiring the user to enter any specific phase view.

Key behavioral rules:

- **Default landing**: `panelsStore.activeView` set to `'dashboard'` after `loadProject()` when data exists
- **Deep link bypass**: `initialFindingId`, `initialChart`, or Teams task URLs set `activeView` to `'editor'` directly
- **Phase detection still runs**: Journey phase (SCOUT/INVESTIGATE/IMPROVE) is detected normally from `AnalysisState`; the dashboard simply reads and displays it without requiring the user to be "in" that phase view
- **Return mid-session**: User can return to the dashboard from the Editor at any time via the "Overview" tab; AI summary refreshes if project state changed

See [ADR-042](../../07-decisions/adr-042-project-dashboard.md) and [Journey Phase → Screen Mapping](./journey-phase-screen-mapping.md#project-dashboard-azure-only).

## See Also

- [Analysis Journey Map](../../03-features/workflows/analysis-journey-map.md) — canonical journey definition with decision points and loops
- [Methodology](../../01-vision/methodology.md) — Watson's EDA, Four Lenses, Investigation Diamond, Two Voices
- [AI Journey Integration](ai-journey-integration.md) — AI layers and experience spectrum
- [Business Bible](../../01-vision/business-bible.md) — Value Levers
- [Scouting Report Design](../../archive/specs/scouting-report-design.md) — Report Steps (archived)
- [Investigation to Action](../../03-features/workflows/investigation-to-action.md) — Finding Status, Hypothesis lifecycle
- [Journey Phase → Screen Mapping](./journey-phase-screen-mapping.md) — concrete code references per phase
- [Methodology Coach Design](../../archive/2026-03-18-methodology-coach-design.md) — UI implementation of journey awareness (archived, removed)
