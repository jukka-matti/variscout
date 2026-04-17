---
title: 'ADR-053: Question-Driven Investigation'
audience: [developer, architect]
category: architecture
status: stable
related: [investigation, eda-mental-model, factor-intelligence, question-driven-eda]
---

# ADR-053: Question-Driven Investigation

**Status:** Accepted
**Date:** 2026-03-30
**Decision Makers:** Development team
**Tags:** investigation, eda-mental-model, findings, questions, factor-intelligence

## Context

The current investigation model is hypothesis-first: analysts create a formal hypothesis, build a tree of sub-hypotheses, and validate each with data/gemba/expert evidence. This creates a gap between FRAME (where the analyst enters an issue statement and upfront hypotheses) and INVESTIGATE (where hypotheses are formally structured).

Key problems:

1. **No "Analysis Planning" step** — the Analysis Brief context isn't synthesized into actionable questions
2. **Findings are standalone observations** — they don't link to the questions that motivated them
3. **The hypothesis tree requires formal theory creation before sufficient evidence exists** — the analyst creates a hypothesis then works backward to validate it
4. **Only one primary cause allowed per tree** — `causeRole: 'primary'` enforces a single root cause, but real investigations often identify multiple contributing causes
5. **The "problem statement" is static input** — it's text entered once during FRAME, not an evolving understanding that sharpens through analysis

The design is grounded in Turtiainen (2019) _"Mental Model for Exploratory Data Analysis Applications for Structured Problem-Solving"_ (LUT University), validated by 9 Lean Six Sigma Master Black Belt experts.

## Decision

Adopt a question-driven investigation model:

### 1. Issue Statement replaces Problem Statement as input

The existing `problemStatement` field becomes `issueStatement` — a vague concern that evolves. The Problem Statement becomes an OUTPUT formulated when enough questions are answered (Watson's 3 elements: measure, direction, scope).

**Example sharpening:**

1. Start: _"Fill weight on line 3 is too variable"_
2. After Shift finding: _"Fill weight variation on line 3 is driven by night shift"_
3. After Head finding: _"...night shift, heads 5-8"_
4. After capability check: _"...Cpk 0.62, target 1.33"_

### 2. Questions generated from Factor Intelligence + context

Factor Intelligence Layer 1 (Best Subsets R²adj) generates evidence-ranked questions automatically (deterministic, works without AI). CoScout adds heuristic questions from issue text, upfront hypotheses, and factor roles (AI layer). Layers 2-3 generate follow-up questions when gated by evidence.

**Two question sources:**

| Source                 | Availability              | Question Types                                                                   |
| ---------------------- | ------------------------- | -------------------------------------------------------------------------------- |
| Factor Intelligence L1 | All tiers (deterministic) | Factor/combination R²adj rankings, auto-ruled-out low-evidence factors           |
| CoScout heuristics     | Azure with CoScout        | NLP from issue text, upfront hypotheses, factor roles, spec-based, pattern-based |

### 3. Findings = answers to questions

Findings link to the question they answer. Each finding sharpens the issue statement. Follow-up questions spawn from answered questions (the thesis's inner PDCA loop: Analysis Planning → Data Organizing → Exploratory Analysis → Evaluation).

**Auto-link mechanism:** When a finding is created while a question is "in focus" (last clicked in the question checklist), the finding automatically links to that question. No explicit "answer" button — the question model is invisible infrastructure, not a user-facing action. Chart annotations from question-linked findings are opt-in via "Show on chart" toggle.

### 4. Hypothesis tree → Question tree

Same data model (`parentId`, `linkedFindingIds`, `factor`/`level`, validation types), different semantics. Questions have states: `open`, `answered`, `auto-answered`, `ruled-out`.

### 5. Multiple suspected causes allowed

Remove the one-primary-per-tree constraint. Multiple questions can be marked as `suspected-cause`. The problem statement synthesizes all of them ranked by evidence (η²/R²adj).

### 6. Investigation Panel

The Findings panel evolves to house the full question-driven workflow: issue statement, question checklist, findings linked to questions, question tree, problem statement, suspected causes.

### 7. Works without AI

Factor Intelligence is deterministic — PWA and Azure without CoScout get evidence-ranked questions, auto-answered questions, and clickable answers. CoScout adds the natural language layer.

## Consequences

### Positive

- Aligns with established quality methodology (Turtiainen 2019, Watson's EDA process)
- Questions are evidence-ranked (Factor Intelligence) rather than heuristic-only
- Multiple suspected causes reflect real-world investigation outcomes
- Negative learnings (ruled-out factors) captured automatically
- Question checklist serves as presentation tool (clickable answers show dashboard evidence)
- Works across all tiers (PWA free → Azure Team)

### Negative

- Significant documentation update needed (15+ docs across 4 priority tiers)
- Semantic reframe of hypothesis tree may confuse existing users familiar with hypothesis terminology
- Migration path needed for existing projects with hypothesis trees

### Neutral

- Tree data structures largely unchanged (`parentId`, `linkedFindingIds`, validation types)
- CoScout prompt updates needed but architecture stays the same (3-tier prompt, phase-aware)
- Factor Intelligence is already implemented — question generation is a new consumer, not a new engine

## Mode Awareness

> Extended by [ADR-054: Mode-Aware Question Strategy](adr-054-mode-aware-question-strategy.md)

The current implementation covers **Standard mode** — questions generated from R²adj ranking, validated by ANOVA η². ADR-054 extends the question pipeline to adapt across all analysis modes:

| Mode            | Question Source                       | Evidence Metric      | Validation       | Status          |
| --------------- | ------------------------------------- | -------------------- | ---------------- | --------------- |
| **Standard**    | Factor Intelligence L1 (best subsets) | R²adj                | ANOVA η²         | Implemented     |
| **Capability**  | Best subsets + spec-aware adapter     | Cpk impact           | ANOVA η² + specs | ADR-054 Phase 1 |
| **Yamazumi**    | Waste composition generator           | Waste contribution % | Takt compliance  | ADR-054 Phase 2 |
| **Performance** | Channel ranking                       | Channel Cpk          | ANOVA η²         | ADR-054 Phase 3 |

**Key principle:** Questions must match the terminology and metrics users see in charts and reports for the active mode. In Yamazumi mode, "Which factor explains variation?" is replaced by "Which step has the most waste?"

## Implementation Status

| Component                                | File                                                              | Status   |
| ---------------------------------------- | ----------------------------------------------------------------- | -------- |
| Issue Statement field                    | `packages/hooks/src/useHypotheses.ts`                             | Complete |
| Question generation (Standard)           | `packages/core/src/stats/bestSubsets.ts`                          | Complete |
| Auto-link mechanism                      | `packages/hooks/src/useHypotheses.ts`                             | Complete |
| Question tree (reframed hypothesis tree) | `packages/hooks/src/useHypotheses.ts`                             | Complete |
| Multiple suspected causes                | `packages/hooks/src/useHypotheses.ts`                             | Complete |
| QuestionChecklist UI                     | `packages/ui/src/components/FindingsWindow/QuestionChecklist.tsx` | Complete |
| Investigation Panel wiring               | `packages/ui/src/components/FindingsWindow/`                      | Complete |
| Mode-aware question generation           | See [ADR-054](adr-054-mode-aware-question-strategy.md)            | Planned  |

## Amendment: Investigation Reframing (Apr 2026)

**Extended by:** Investigation Workspace Reframing design spec (Apr 2026)

Three clarifications added after implementation experience:

1. **SuspectedCause hub entities replace causeRole tagging.** Suspected causes are now `SuspectedCauseHub` entities that connect multiple evidence threads (questions, findings) into one named mechanism story. The `causeRole: 'primary' | 'contributing'` field on `Hypothesis` is deprecated. Multiple hubs per investigation are the norm, each driving its own HMW brainstorm in IMPROVE.

2. **Problem Statement forms at FRAME + SCOUT Loop 1, not at investigation end.** Q1 (measure) and Q2 (direction) are answered when the analyst maps data and sets characteristic type during FRAME. Q3 (scope) fills in when the first SuspectedCause hub is created. The Problem Statement is a live view, not a button-triggered output.

3. **The Investigation Diamond = finding the WHY, not forming the Problem Statement.** The diamond's Converging phase is for creating SuspectedCause hubs and linking evidence — the Problem Statement assembles itself from hub data. The diamond closes when hubs are named; the Problem Statement is a consequence, not the goal of convergence.

See: [Investigation Workspace Reframing Design](../superpowers/specs/2026-04-03-investigation-workspace-reframing-design.md)

## Amendment: Standard ANOVA Metrics (ADR-062)

Since **ADR-062** (Apr 2026), the label "Contribution %" has been replaced by the standard statistical term **η²** (eta-squared) throughout the UI and documentation. Findings, filter chips, and the question checklist evidence badge all use η² and n=X notation. The VariationBar component was removed. The underlying metric (eta-squared) is unchanged; only the display label was standardized.

## References

- Turtiainen, J-M. (2019). _Mental Model for Exploratory Data Analysis Applications for Structured Problem-Solving._ LUT University.
- Watson, G.H. (2019a). _The DNA of Strategy Execution._
- [Design spec: Question-Driven EDA](../archive/specs/2026-03-30-question-driven-eda-design.md)
- [Investigation Workspace Reframing Design](../superpowers/specs/2026-04-03-investigation-workspace-reframing-design.md)
- [Thesis reference](../01-vision/references/turtiainen-2019-eda-mental-model.md)
- [ADR-020: Investigation Workflow](adr-020-investigation-workflow.md)
- [ADR-029: AI Action Tools](adr-029-ai-action-tools.md)
- [ADR-049: CoScout Knowledge Catalyst](adr-049-coscout-context-and-memory.md)
- [ADR-052: Factor Intelligence](adr-052-factor-intelligence.md)
- [ADR-062: Standard ANOVA Metrics](adr-062-standard-anova-metrics.md)
