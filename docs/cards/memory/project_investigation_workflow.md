---
title: 'Investigation Workflow — Question-Driven EDA'
description: 'ADR-020 + ADR-053 + Investigation Spine (Apr 4) — question-driven EDA with regression equation, hub UX, EDA heartbeat, two-tier question model'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_investigation_workflow.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Investigation workflow now uses **question-driven EDA model** (ADR-053, Mar 2026) layered on top of ADR-020 infrastructure.

## ADR-053 Changes (2026-03-31)
- "Problem Statement" → "Issue Statement" throughout UI and i18n
- Hypotheses reframed as **Questions** with lifecycle: `generateInitialQuestions()`, `answerQuestion()`
- **Factor Intelligence** generates ranked questions from ANOVA eta-squared
- Findings auto-link to questions via `questionId` parameter on `addFinding()`
- `showOnChart: false` default for question-linked findings (keeps charts clean)
- **QuestionChecklist** component in Investigation sidebar tracks answer progress
- CoScout prompts updated for question-driven semantics
- Types extended: `Question` type, `questionId` on Finding, `issueStatement` on Investigation
- **Fluent UI card pattern** for accessible cards (replaces nested button violations)
- Report: `ReportInvestigationSummary` component with semantic theme tokens

## End-to-End Pipeline Wiring (2026-04-01)
Building blocks existed but were not connected to apps. Four gaps closed:

- **useQuestionGeneration hook** (`@variscout/hooks`) — shared hook computes bestSubsets, calls `generateQuestionsFromRanking()` → `generateInitialQuestions()`. Uses fingerprint-based dedup + persistence check. Mode-aware via strategy pattern.
- **QuestionChecklist in inline FindingsPanelBase** — question-related props added to `FindingsPanelBase`. Renders checklist with coverage metric between header and FindingsLog when questions exist. Wired in both Azure (EditorDashboardView) and PWA (App.tsx).
- **Question click → dashboard factor switch** — `factorRequest` (counter/seq pattern, no setTimeout) passed to Dashboard's `requestedFactor` prop. Dashboard effect applies `setBoxplotFactor` + `setParetoFactor`.
- **Layer 2-3 follow-up spawning** — when L1 question answered as 'supported', `generateFollowUpQuestions()` auto-generates L2 (X-level target) and L3 (interaction) questions. Dedup uses factor+level structural matching (not text matching).
- Azure StatsPanel accepts `precomputedBestSubsets` to avoid double computation.

## Original ADR-020 Implementation (complete, 2026-03-15)
Complete Problem -> Hypothesis -> Evidence -> Projection -> Action -> Verification cycle.

**Why:** VariScout analysis finds WHERE variation lives but lacked framing (WHY) and tracking (progress toward targets). Unifies disconnected features (findings, What-If, AI) into coherent workflow.

**How to apply:** Check ADR-020 for design decisions. Key types: Hypothesis, FindingProjection, ImprovementProgress, TargetMetric.

## Implementation Status (2026-03-15) — ALL STEPS COMPLETE

### Steps 1-3, 5, 7, 9 (previously completed)
- Core types, useHypotheses hook, FindingCard hypothesis UI, progress computation, CoScout investigation context, Azure DataContext wiring, ADR-020 docs

### Step 4: ColumnMapping Brief Fields (2026-03-15)
- **AnalysisBrief** type exported from @variscout/ui (problemStatement, hypotheses[], target)
- Azure: `showBrief={true}` — full brief section (problem, hypothesis with factor/level dropdowns, target metric/direction/value)
- PWA: simple problem statement textarea (showBrief=false, always shown in setup mode)
- onConfirm signature extended with 5th arg: `brief?: AnalysisBrief`
- Azure Editor: brief → ProcessContext + hypothesesState.addHypothesis on confirm
- Tests: 6 new tests in ColumnMapping.test.tsx

### Step 6: What-If → Finding Projection UI (2026-03-15)
- **ProjectionSection** in FindingCard — shows mean/sigma/cpk before→after, age indicator
- **"Project improvement" button** — visible on key-driver findings without projection, in analyzed/improving status
- Props: `onProjectImprovement`, `hasSpecs` on FindingCard and FindingsLog
- Tests: 3 new tests in FindingsLog.test.tsx

### Step 8: Investigation Page (2026-03-15)
- **BriefHeader** component — collapsible header with problem statement, target progress bar, hypothesis summary counts
- **FindingDetailPanel** component — right-side detail panel reusing FindingCard with full callbacks
- **FindingsWindow** evolved to 3-zone layout: BriefHeader + Board/List + Detail Panel
- Board is default view; clicking a finding opens detail panel
- Wide (>1200px): side-by-side; narrow: detail slides over
- PopoutSyncOptions extended: hypotheses, processContext, currentValue
- Popout window widened to 960px

### Step 10: AI Prompt Templates (2026-03-15)
- **buildCoScoutSystemPrompt** — accepts investigation context, adds problem statement, hypotheses list, target + progress, phase-specific instructions
- **buildSummaryPrompt** — includes problem statement when present
- **buildCoScoutMessages** — passes investigation context to system prompt
- **useAIContext** — accepts hypotheses, passes to buildAIContext
- Azure Editor: hypotheses wired to useAIContext
- Tests: 6 new tests in promptTemplates.test.ts

### Step 11-12: Documentation, PWA (from earlier sessions)
- ADR-020, feature-parity, hypothesis spec all done
- PWA: problem statement field only (no hypotheses, no projections, no investigation page)

### IDEOI Bridge: Improvement Ideas on Hypotheses (2026-03-15)
- **ImprovementIdea** type in @variscout/core/findings.ts (id, text, effort, impactOverride, projection, selected, notes, createdAt)
- **Hypothesis.ideas?**: optional ImprovementIdea[] field (backward compatible)
- **createImprovementIdea()** factory in core
- **computeIdeaImpact()** in core/variation/progress.ts — projection+target (gap closure), projection only (sigma delta), manual fallback
- **useHypotheses** extended: addIdea, updateIdea, removeIdea, setIdeaProjection, selectIdea
- **ImprovementIdeasSection** in HypothesisNode.tsx — collapsible, visible for supported/partial, effort/impact badges, star selection, "Project" → What-If, "Ask CoScout"
- Props threaded: HypothesisTreeView → FindingsLog → FindingsPanelBase → Azure FindingsPanel
- **CoScout IDEOI prompts**: converging phase with supported hypotheses gets ideation-specific system prompt + suggested questions
- Azure Editor: ideaImpacts computed via useMemo + computeIdeaImpact, handleProjectIdea opens What-If, handleAskCoScoutFromIdeas sends question
- Tests: 4 core findings, 8 core progress, 7 hooks (all pass)
- Docs: investigation-to-action, hypothesis-investigation, ADR-020, ai-architecture, findings component spec, feature-parity all updated

### CoScout Inline in FindingsPanel (2026-03-15)
- **InvestigationPhaseBadge** — colored pill: initial=slate, diverging=amber, validating=blue, converging=purple, acting=green
- **CoScoutMessages** — extracted shared message rendering from CoScoutPanelBase (user/assistant bubbles, loading dots, error+retry)
- **CoScoutInline** — collapsible conversation in FindingsPanel: collapsed=phase badge+question chips+chevron; expanded=messages+input
- **FindingsPanelBase** — optional CoScout props (coScoutMessages, coScoutOnSend, etc.) → renders CoScoutInline between FindingsLog and drill path
- **FindingsLog** — root wrapper div with className prop for flex participation
- **useEditorPanels** — removed mutual exclusion (Findings + CoScout can be open simultaneously)
- **Editor.tsx** — CoScout props wired to both FindingsPanel instances (phone + desktop)
- **handleAskCoScoutFromFinding** — now opens findings panel instead of standalone CoScout (inline lives there)
- **FindingsWindow** — phase badge in header, suggested question chips (copy to clipboard) in popout
- **FindingsSyncData** extended: investigationPhase?, suggestedQuestions?
- Exports: CoScoutInline, CoScoutMessages, InvestigationPhaseBadge added to @variscout/ui
- Tests: 10 PhaseBadge + 8 CoScoutMessages + 22 CoScoutInline + 3 FindingsPanelBase CoScout + 5 updated reducer coexistence = 48 new/updated tests
- PWA unaffected (no CoScout props passed)

### Final wiring gaps closed (2026-03-15, commit 71103f2)
- Status propagation upward: parent status derived from children (bottom-up in validatedHypotheses useMemo)
- Gemba/expert task UI: ValidationTaskSection in HypothesisNode (3-state flow: input → checkbox → status buttons)
- Idea → action conversion: handleSetFindingStatus wrapper in Editor.tsx converts selected ideas to actions on improving transition
- Progress bar projected improvement: BriefHeader projectedValue prop, dashed segment, projectedFromIdeas computed in Editor.tsx

### E2E Loop Completion (2026-03-18)
Four stub/missing features completed to close the investigation workflow end-to-end:

1. **Idea→What-If Round-Trip**: projectionTarget state in Editor.tsx, WhatIfPageBase shows context banner ("Projecting: [idea] for [hypothesis]") and "Save to idea" button, captures FindingProjection back via onSaveProjection callback → setIdeaProjection
2. **Inline Sub-Hypothesis Input**: HypothesisNode "+" button opens inline form (text + optional factor dropdown + data/gemba/expert radios) replacing window.prompt() stub. onAddChild signature: (parentId, text, factor?, validationType?)
3. **Suspected Root Cause (causeRole)**: Hypothesis.causeRole?: 'primary' | 'contributing'. setCauseRole in useHypotheses (enforces single primary per root tree). HypothesisNode shows 🎯 cycle button + PRIMARY/CONTRIBUTING badges. FindingCard shows "Suspected cause" section. AI context includes suspectedCause, CoScout converging/improving prompts reference primary cause. Report Section 3 title uses primary cause text.
4. **WhatIfSimulator onSimulationChange**: New callback prop notifies parent of meanShift/variationReduction changes for external capture.
