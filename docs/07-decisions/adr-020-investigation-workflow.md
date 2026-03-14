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

### Modified Files

- `packages/core/src/findings.ts` — Hypothesis type, FindingProjection, createHypothesis()
- `packages/core/src/ai/types.ts` — ProcessContext extension, TargetMetric, AIContext.investigation
- `packages/core/src/ai/buildAIContext.ts` — Investigation context assembly
- `packages/core/src/ai/suggestedQuestions.ts` — Investigation-scoped questions
- `packages/hooks/src/types.ts` — AnalysisState.hypotheses
- `packages/hooks/src/useFindings.ts` — linkHypothesis, setProjection (replaces setSuspectedCause)
- `packages/ui/src/components/FindingsLog/` — Hypothesis display/link UI
- `packages/ui/src/components/FindingsPanel/` — Updated props
