---
title: 'ADR-020: Investigation Workflow Enhancement'
---

# ADR-020: Investigation Workflow Enhancement

**Status:** Accepted
**Date:** 2026-03-14
**Supersedes:** N/A
**Related:** ADR-015 (Investigation Board), ADR-019 (AI Integration)

## Context

VariScout's variation analysis (eta-squared drill-down, Four Lenses, What-If simulator) excels at finding WHERE variation lives. But the tool lacked the framing layer connecting analysis to action: no place to state WHY an analysis is being done, no way to declare and validate hypotheses, no connection between What-If projections and findings, and no progress tracking toward improvement targets.

## Decision

Implement a complete Problem -> Hypothesis -> Evidence -> Projection -> Action -> Verification cycle within VariScout, unifying concepts that previously existed as disconnected features (findings, What-If, AI narration) into a coherent investigation workflow.

### Key Design Choices

1. **Hypothesis as shared entity** — Hypotheses are standalone objects in `AnalysisState`, not embedded in findings. Multiple findings can link to the same hypothesis (many-to-one). This enables building evidence for or against a causal theory across multiple drill-down paths.

2. **Auto-validation via eta-squared** — When a hypothesis links to a factor, its status automatically updates based on ANOVA eta-squared thresholds:
   - > = 15%: supported
   - < 5%: contradicted
   - 5-15%: partial
   - No factor: untested

3. **Finding projections** — What-If simulation results attach directly to findings as `FindingProjection`, capturing baseline and projected stats. This enables progress tracking by aggregating projections across key-driver findings.

4. **Sequential estimation** — Progress computation uses sigma cascade: findings ordered by largest improvement, each subsequent finding operates on the tighter post-improvement baseline.

5. **ProcessContext extension** — Added `problemStatement`, `targetMetric`, `targetValue`, `targetDirection` to the existing ProcessContext. Progressive disclosure: fields are optional and never block workflow.

6. **Clean break from suspectedCause** — Removed `Finding.suspectedCause` field entirely. Replaced with `hypothesisId` linking to a Hypothesis entity. No migration needed.

7. **Everything works without AI** — The entire flow is deterministic math + manual input. AI enhances each step (hypothesis text parsing, suggested questions, investigation narration) but is never required.

8. **parentId and sub-hypothesis tree** — Hypotheses gain a `parentId` field (nullable) enabling tree structures. Root hypotheses have `parentId: null`; sub-hypotheses reference their parent. Tree constraints prevent runaway complexity: max depth 3, max children per parent 8, max total per finding 30. Status propagation flows upward — when all children are tested, the parent status is derived from children's states (all contradicted = contradicted, any supported = supported, mix = partial).

9. **validationType: data/gemba/expert** — Not all hypotheses can be validated with data. The `validationType` field distinguishes between automatic data validation (ANOVA eta-squared, existing behavior), gemba validation (physical inspection task), and expert validation (domain knowledge assessment). Data validation is automatic; gemba and expert validation require manual status setting after task completion.

10. **Gemba task completion flow** — Gemba and expert hypotheses carry optional `validationTask` (what to check), `taskCompleted` (boolean), and `manualNote` (what was found) fields. The flow is: define task, perform inspection/consultation, mark complete, record findings, set status. No due dates on tasks — keeping it simple. Tasks are binary (done/not done).

11. **HypothesisTreeView UI** — When a finding has sub-hypotheses, the flat hypothesis display is replaced by `HypothesisTreeView` — an indented tree with status dots, factor badges, validation type icons, and collapsible children. Contradicted nodes are rendered at 50% opacity with strikethrough text. FindingsLog gains a third view mode (Tree) alongside List and Board. Tree view shows one finding at a time with full hypothesis tree.

12. **CoScout investigation phase detection** — The investigation phase (initial, diverging, validating, converging, acting) is automatically detected from hypothesis tree state and included in `buildAIContext`. CoScout adapts suggested questions to the phase and highlights uncovered factor role categories (equipment, temporal, operator, material, location) to nudge broader investigation. The popout FindingsWindow gains a collapsible CoScout sidebar showing phase and suggestions.

13. **Improvement Ideation** — Supported hypotheses unlock an "Improvement Ideas" section on the finding. Ideas are stored as `ImprovementIdea[]` on the Hypothesis entity:

    ```typescript
    interface ImprovementIdea {
      id: string;
      text: string; // What the improvement involves
      effort: 'low' | 'medium' | 'high'; // Rough implementation cost
      impactOverride?: number; // Manual Cpk impact (overrides computed)
      projection?: FindingProjection; // What-If simulation result
      selected: boolean; // Marked for conversion to actions
      notes?: string; // Additional context
      createdAt: number;
    }
    ```

    Relationship: `Hypothesis.ideas?: ImprovementIdea[]`. Ideas belong to the hypothesis that identified the root cause.

    Impact computation via `computeIdeaImpact(idea)`: if a What-If projection is attached, impact is derived from `projection.projected.cpk - projection.baseline.cpk`. If `impactOverride` is set, it takes precedence (for cases where the analyst has domain knowledge beyond the simulation). Ideas without projection or override show "–" for impact.

    What-If integration: the analyst opens What-If Simulator, configures mean shift / variation reduction, then attaches the resulting projection to an idea. This reuses the existing `FindingProjection` type — no new simulation engine. Multiple ideas can have different projections, enabling side-by-side comparison of improvement strategies before committing to actions. Selected ideas (`selected: true`) flow into the corrective actions list when the finding transitions to "improving" status.

### Platform Scope

- **Azure App:** Full implementation (brief, hypotheses, projections, progress tracking, investigation page)
- **PWA:** Problem statement only (teaches the discipline of framing before analyzing)

## Consequences

### Positive

- Analysts can track the full investigation lifecycle in one tool
- Hypotheses create testable, traceable causal theories
- Progress tracking quantifies improvement toward targets
- AI context is richer for investigation-scoped CoScout conversations

### Negative

- Breaking change: `suspectedCause` removed from Finding type
- Increased complexity in state management (hypotheses + projections)
- Investigation page adds significant UI surface area

### Risks

- Sequential estimation is an approximation; factor interactions may affect actual results
- Eta-squared thresholds (5%/15%) may need tuning for specific domains

## Implementation

### New Files

- `packages/core/src/variation/progress.ts` — Progress computation
- `packages/hooks/src/useHypotheses.ts` — Hypothesis CRUD + auto-validation

### New Files (Improvement Ideation)

- `packages/core/src/variation/ideation.ts` — `computeIdeaImpact()`, idea validation helpers

### Modified Files

- `packages/core/src/findings.ts` — Hypothesis type (parentId, validationType, validationTask, taskCompleted, manualNote), FindingProjection, createHypothesis()
- `packages/core/src/ai/types.ts` — ProcessContext extension, TargetMetric, InvestigationPhase, AIContext.investigation
- `packages/core/src/ai/buildAIContext.ts` — Investigation context assembly, phase detection, uncovered factor suggestions
- `packages/core/src/ai/suggestedQuestions.ts` — Investigation-scoped and phase-aware questions
- `packages/hooks/src/types.ts` — AnalysisState.hypotheses
- `packages/hooks/src/useFindings.ts` — linkHypothesis, setProjection (replaces setSuspectedCause)
- `packages/hooks/src/useHypotheses.ts` — Tree operations (addChild, setValidationType, setTask, completeTask, setNote), constraints, status propagation
- `packages/ui/src/components/FindingsLog/` — Hypothesis display/link UI, tree view mode
- `packages/ui/src/components/FindingsLog/HypothesisTreeView.tsx` — New: hypothesis tree view with collapsible nodes
- `packages/ui/src/components/FindingsLog/HypothesisNode.tsx` — New: individual tree node with status, badges, validation type
- `packages/ui/src/components/FindingsLog/FindingsWindow.tsx` — Problem brief header, CoScout sidebar
- `packages/ui/src/components/FindingsPanel/` — Updated props
- `packages/core/src/findings.ts` — ImprovementIdea type, Hypothesis.ideas field
- `packages/hooks/src/useHypotheses.ts` — addIdea, updateIdea, removeIdea, selectIdea, attachProjection operations
