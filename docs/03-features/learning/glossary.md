---
title: Glossary & Knowledge Model
audience: [analyst, engineer]
category: learning
status: stable
related: [glossary, terminology, help-tooltips, knowledge-model]
---

# Glossary & Knowledge Model

Contextual term definitions and methodology concepts throughout the application.

---

## Purpose

Help users understand statistical terms and VariScout methodology without leaving their analysis. The knowledge model also grounds AI (CoScout) responses in VariScout's own framework.

---

## Architecture

The knowledge model is a unified registry of **terms** (vocabulary) and **concepts** (methodology). See [Knowledge Model Architecture](../../05-technical/architecture/knowledge-model.md) for the full technical spec.

```
KnowledgeEntry = GlossaryTerm | Concept
```

---

## Implementation

Terms are defined in `packages/core/src/glossary/terms.ts` and accessed via the `useGlossary` hook.

```typescript
import { useGlossary } from '@variscout/ui';

const { getTerm, hasTerm } = useGlossary();

const cpkTerm = getTerm('cpk');
// { id: 'cpk', label: 'Cpk', definition: '...', description: '...' }
```

Methodology concepts are defined in `packages/core/src/glossary/concepts.ts` and accessed via the unified knowledge API:

```typescript
import { getEntry, getRelated, getConcept } from '@variscout/core';

const fourLenses = getConcept('fourLenses');
// { id: 'fourLenses', label: 'Four Lenses', conceptCategory: 'framework', ... }

const related = getRelated('fourLenses');
// Returns: [iChart, boxplot, paretoChart, capabilityAnalysis, twoVoices]
```

---

## Term Structure

```typescript
interface GlossaryTerm {
  id: string; // Unique identifier
  label: string; // Display label
  definition: string; // Short definition
  description: string; // Detailed explanation
  category: string; // Grouping category
  learnMorePath?: string; // Link to deeper content
  relatedTerms?: string[]; // Related term IDs
}

interface Concept {
  id: string; // Unique identifier
  label: string; // Display label
  definition: string; // Short definition
  description?: string; // Extended explanation
  conceptCategory: 'framework' | 'phase' | 'principle';
  learnMorePath?: string;
  relations: KnowledgeRelation[];
}
```

---

## Term Categories

| Category       | Terms                                                                                                                                                                                                                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| control-limits | UCL, LCL, USL, LSL, Target                                                                                                                                                                                                                                                                   |
| capability     | Cp, Cpk, Pass Rate, Rejected                                                                                                                                                                                                                                                                 |
| statistics     | Mean, Median, Std Dev, F-Statistic, p-value, η², Sum of Squares, Between/Within Variation                                                                                                                                                                                                    |
| methodology    | Special Cause, Common Cause, Nelson Rule 2/3, In-Control, Staged Analysis, Characteristic Type, Probability Plot, Control vs Spec, Natural Variation, Process Stability, Out of Control, Rational Subgrouping, Stratification, Step Distribution, Side-by-Side Hub View, Investigation Scope |
| investigation  | Root Cause Analysis, Corrective Action, Preventive Action, Finding, Investigation Status, Key Driver, Action Item, Finding Outcome, Process Context, Hypothesis                                                                                                                              |
| charts         | I-Chart, Boxplot, Pareto Chart, Capability Analysis, Violin Plot                                                                                                                                                                                                                             |

## Concept Categories

| Category  | Concepts                                                                      |
| --------- | ----------------------------------------------------------------------------- |
| framework | Four Lenses (teaching shorthand), Two Voices, Parallel Views                  |
| principle | Progressive Stratification, Contribution Not Causation, Iterative Exploration |
| phase     | Initial, Diverging, Validating, Converging                                    |

---

## Glossary Expansion Plan (AI Readiness)

The glossary currently contains 25 terms across 5 categories. For AI Phase 1 (ADR-019), the glossary needs expansion to ~40-50 terms to serve as the primary hallucination-reduction strategy via `buildGlossaryPrompt()`. See AI Readiness Review for the strategic rationale.

### Current Terms (25)

| Category       | Existing Terms                                                                                                 |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| control-limits | UCL, LCL, USL, LSL, Target                                                                                     |
| capability     | Cp, Cpk, Pass Rate, Rejected                                                                                   |
| statistics     | Mean, Std Dev, F-Statistic, p-value, Eta-squared, Sum of Squares, Between/Within Variation                     |
| methodology    | Special Cause, Common Cause, Nelson Rule 2, In-Control, Staged Analysis, Characteristic Type, Probability Plot |
| charts         | Violin Plot                                                                                                    |

### Proposed New Terms (~25 additions)

Terms are organized by priority for AI Phase 1 launch. Each term will follow the existing `GlossaryTerm` interface with `id`, `label`, `definition`, `description`, `category`, `learnMorePath`, and `relatedTerms`.

#### Priority 1 — Required for AI Phase 1 (grounding AI narration and CoScout responses)

**Statistical/Quality foundations:**

| Term ID               | Label                       | One-Line Description                                                                                             | Category    |
| --------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------- |
| `controlVsSpec`       | Control Limit vs Spec Limit | The fundamental distinction: control limits describe the process voice; spec limits describe the customer voice. | methodology |
| `naturalVariation`    | Natural Process Variation   | The inherent spread of a stable process, measured as 6 standard deviations (6 sigma).                            | methodology |
| `processStability`    | Process Stability           | A process showing only common cause variation — predictable behavior over time.                                  | methodology |
| `outOfControl`        | Out-of-Control Signal       | A data point or pattern on a control chart indicating special cause variation is present.                        | methodology |
| `rationalSubgrouping` | Rational Subgrouping        | Grouping measurements so within-group variation represents only common causes.                                   | methodology |
| `stratification`      | Stratification              | Separating data into meaningful groups (by machine, shift, operator) to reveal hidden patterns.                  | methodology |

**Analysis methodology:**

| Term ID             | Label               | One-Line Description                                                                                                                                                                                                                                                                                                    | Category    |
| ------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `rootCauseAnalysis` | Root Cause Analysis | Systematic investigation to identify the fundamental reason for a variation or defect.                                                                                                                                                                                                                                  | methodology |
| `correctiveAction`  | Corrective Action   | Action taken to eliminate the cause of a detected problem and prevent recurrence.                                                                                                                                                                                                                                       | methodology |
| `preventiveAction`  | Preventive Action   | Action taken to eliminate potential causes of problems before they occur (CAPA).                                                                                                                                                                                                                                        | methodology |
| `measurementSystem` | Measurement System  | The complete process of obtaining measurements, including instruments, procedures, and operators. _Deferred — see ADR-073 framing: VariScout's "measurement system" refers to designed measures + evidence sources + cadence, not the AIAG MSA scope (Gage R&R, NDC, %Tolerance) which is itself deferred per ADR-010._ | methodology |

**Investigation workflow terms:**

| Term ID               | Label                | One-Line Description                                                                                                                                                                                                                                                                                                                                 | Category      |
| --------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `finding`             | Finding              | A documented observation during analysis — captures what was seen, where, and context.                                                                                                                                                                                                                                                               | investigation |
| `investigationStatus` | Investigation Status | The current state of a finding: observed, investigating, analyzed (PWA); Azure adds improving and resolved for closed-loop PDCA.                                                                                                                                                                                                                     | investigation |
| `keyDriver`           | Key Driver           | A factor or category confirmed through analysis as a significant contributor to variation.                                                                                                                                                                                                                                                           | investigation |
| `actionItem`          | Action Item          | A specific task assigned during investigation to address a finding's suspected cause.                                                                                                                                                                                                                                                                | investigation |
| `outcomeVerification` | Outcome Verification | Comparing process capability (Cpk) before and after corrective action to confirm improvement.                                                                                                                                                                                                                                                        | investigation |
| `suspectedCause`      | Suspected Cause      | A named mechanism connecting multiple evidence threads (answered questions, findings) into one coherent causal story. Created in the Investigation workspace during the Converging phase. Multiple suspected causes are the norm in real process investigations. Confirmation only happens when the corresponding improvement is verified effective. | investigation |

> **Deprecated term:** `causeRole` — the `causeRole: 'primary' | 'contributing'` field on the `Hypothesis` type was the previous mechanism for marking convergence. It is superseded by `SuspectedCauseHub` entities (Apr 2026). Existing projects using `causeRole` continue to display correctly via a read-only migration view. New investigations should use hub entities.

#### Priority 2 — Needed for AI Phase 2 (enriching CoScout conversation quality)

**AI-specific terms (accessible to quality professionals, not AI jargon):**

| Term ID              | Label                | One-Line Description                                                                                          | Category |
| -------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------- | -------- |
| `aiAssistedAnalysis` | AI-Assisted Analysis | Optional AI features that explain computed results in plain language — AI narrates, never calculates.         | ai       |
| `processContext`     | Process Context      | Structured metadata about your process (type, equipment, steps) that helps AI provide relevant suggestions.   | ai       |
| `narrativeInsight`   | Narrative Insight    | A plain-language summary of the current analysis state, generated from computed statistics.                   | ai       |
| `knowledgeBase`      | Knowledge Base       | Accumulated resolved findings that AI references for pattern recognition across investigations.               | ai       |
| `aiConfidence`       | AI Confidence Level  | Indicator of how well-grounded an AI suggestion is — higher when backed by past findings and process context. | ai       |

#### Priority 3 — Nice to have (reference methodology terms)

| Term ID          | Label                       | One-Line Description                                                                                                    | Category    |
| ---------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------- |
| `fishbone`       | Fishbone Diagram            | Cause-and-effect diagram (Ishikawa) organizing potential causes by category (6M). Referenced in investigation workflow. | methodology |
| `fiveWhys`       | 5 Whys                      | Root cause technique: repeatedly asking "why?" to move from symptom to fundamental cause.                               | methodology |
| `drillDown`      | Drill-Down                  | Progressive filtering through factor levels to isolate where variation originates.                                      | methodology |
| `paretoAnalysis` | Pareto Analysis             | Ranking categories by contribution to focus improvement on the vital few (80/20 principle).                             | methodology |
| `boxplot`        | Box-and-Whisker Plot        | Chart showing distribution summary: median, quartiles, range, and outliers per category.                                | charts      |
| `iChart`         | Individuals Chart (I-Chart) | Time-series control chart for individual measurements showing process behavior over time.                               | charts      |

### Implementation Notes

- New category `investigation` for finding/workflow terms — add to `GlossaryTerm['category']` union type in `packages/core/src/glossary/types.ts`
- New category `ai` for AI-specific terms — only populated when AI features are active
- `buildGlossaryPrompt()` in `@variscout/core` will serialize relevant terms into AI prompt context
- Priority 1 terms should be implemented before AI Phase 1 launch (ADR-019)
- Priority 2 terms can ship with AI Phase 2 (CoScout conversation improvements)
- Priority 3 terms are additive improvements with no AI dependency
- Total after expansion: ~50 terms (25 existing + 25 new)

---

## Mobile Tooltip Behavior

On phone (<640px), the HelpTooltip ⓘ icon uses touch-toggle interaction instead of hover.

| Interaction         | Behavior                                                |
| ------------------- | ------------------------------------------------------- |
| Tap ⓘ icon          | Toggles tooltip visibility (open → close, close → open) |
| Tap outside tooltip | Dismisses tooltip                                       |
| Scroll page         | Dismisses tooltip                                       |
| Tap ⓘ again         | Dismisses tooltip                                       |
| Position            | Bottom-anchored on phone to avoid viewport overflow     |
| Content             | Same as desktop: label, definition, "Learn more" link   |

Implementation uses `@media (hover: none)` to disable mouse enter/leave on touch devices. The component switches to click-to-toggle mode automatically.

---

## See Also

- [Help Tooltip](../../06-design-system/components/help-tooltip.md)
- [Knowledge Model Architecture](../../05-technical/architecture/knowledge-model.md) — How the system works
- [VariScout Methodology](../../01-vision/methodology.md) — Human-readable methodology reference
- [AI Context Engineering](../../05-technical/architecture/ai-context-engineering.md) — How knowledge feeds AI
- [AI Architecture — Glossary Grounding](../../05-technical/architecture/ai-architecture.md#layer-3--glossary-grounding)
- AI Readiness Review (archived)
