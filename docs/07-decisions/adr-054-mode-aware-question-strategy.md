---
title: 'ADR-054: Mode-Aware Question Strategy'
audience: [developer, architect]
category: architecture
status: stable
related: [question-driven-eda, factor-intelligence, strategy-pattern, yamazumi, capability]
---

# ADR-054: Mode-Aware Question Strategy

**Status:** Accepted
**Date:** 2026-03-31
**Extends:** [ADR-053](adr-053-question-driven-investigation.md) (Question-Driven Investigation), [ADR-047](adr-047-analysis-mode-strategy.md) (Strategy Pattern)

## Context

[ADR-053](adr-053-question-driven-investigation.md) introduced question-driven EDA with two question sources: Factor Intelligence (deterministic, R²adj-based) and CoScout heuristics. [ADR-052](adr-052-factor-intelligence.md) defined a 3-layer factor analysis system using best subsets regression.

Both assume a **single analytical model**: continuous outcome variable measured per row, analyzed via ANOVA/regression. This works for Standard and Performance modes but **breaks for Yamazumi** and **under-serves Capability**:

1. **Yamazumi mode** uses aggregated time composition by activity type — not a continuous outcome suitable for regression. R²adj-based questions ("Does [Factor] explain variation?") are meaningless. Lean practitioners ask about waste, takt compliance, and activity composition.

2. **Capability mode** uses Cpk/Cp metrics against specification limits. While the same data model works (ANOVA applies), questions should reference specs: "Which factor affects Cpk?" rather than "Which factor explains variation?"

3. **Performance mode** ranks channels by Cpk. Questions should focus on worst-channel identification and channel-level diagnostics.

4. **CoScout coaching** (in `buildCoScoutSystemPrompt()`) already adapts terminology and investigation workflow per mode via `getStrategy().aiToolSet`. But the deterministic question pipeline upstream is mode-blind.

**No competitor tool** (Minitab, JMP, Tableau) generates mode-specific investigation questions. This is a differentiation opportunity.

### Functions Currently Lacking Mode Awareness

| Function                         | Location                      | Issue                          |
| -------------------------------- | ----------------------------- | ------------------------------ |
| `generateQuestionsFromRanking()` | `core/stats/bestSubsets.ts`   | Hardcoded question templates   |
| `generateFollowUpQuestions()`    | `core/stats/factorEffects.ts` | Generic follow-up wording      |
| `computeMainEffects()`           | `core/stats/factorEffects.ts` | Uses eta-squared for all modes |
| `generateInitialQuestions()`     | `hooks/useHypotheses.ts`      | No mode filtering              |
| `useJourneyPhase()`              | `hooks/useJourneyPhase.ts`    | Phase detection mode-blind     |
| `buildCoScoutTools()`            | `core/ai/prompts/coScout.ts`  | Tool descriptions generic      |

## Decision

### 1. Extend AnalysisModeStrategy with questionStrategy

Add a `questionStrategy` field to the strategy registry in `analysisStrategy.ts`, keeping all mode logic centralized (ADR-047's intent):

```typescript
interface QuestionStrategy {
  generator: 'bestSubsets' | 'bestSubsetsWithSpecs' | 'wasteComposition' | 'channelRanking';
  evidenceMetric: 'rSquaredAdj' | 'cpkImpact' | 'wasteContribution' | 'channelCpk';
  evidenceLabel: string; // "R²adj" | "Cpk impact" | "Waste %" | "Channel Cpk"
  validationMethod: 'anova' | 'anovaWithSpecs' | 'taktCompliance';
  questionFocus: string; // Mode-specific question framing
}
```

### 2. Question Strategy per Mode

| Mode            | Generator            | Evidence             | Validation       | Question Focus                          |
| --------------- | -------------------- | -------------------- | ---------------- | --------------------------------------- |
| **standard**    | bestSubsets          | R²adj                | ANOVA η²         | "Which factor explains most variation?" |
| **capability**  | bestSubsetsWithSpecs | Cpk impact           | ANOVA η² + specs | "Which factor most affects Cpk?"        |
| **yamazumi**    | wasteComposition     | waste contribution % | takt compliance  | "Which step has the most waste?"        |
| **performance** | channelRanking       | channel Cpk          | ANOVA η²         | "Which channel performs worst?"         |

### 3. Mode-Specific Investigation Workflows

**Standard** — Variation decomposition (existing):
R²adj ranking → "Does [Factor] explain variation?" → ANOVA η² validation → drill-down

**Capability** — Centering vs spread diagnostic:
Low Cpk + high Cp = centering drift → "Which factor shifts process center from target?"
Low Cpk + low Cp = excess spread → "Which factor increases process spread?"
Subgroup drill-down → "Why is Cpk lower in [Factor=Level]?"

**Yamazumi** — Waste elimination (lean):

1. Takt compliance scan → "Which steps exceed takt time?"
2. Waste composition → "Is the bottleneck value-adding work or waste?"
3. Waste driver ranking → "Which waste type dominates?"
4. Temporal stability → "Is waste increasing over time?"
5. Kaizen targeting → "Where should kaizen focus first?"

Prioritization by **impact on flow** (steps above takt first), not R²adj.

**Performance** — Channel health:
"Which channel has worst Cpk?" → "Is worst channel a centering or spread problem?" → "Is the problem intermittent or systematic?"

### 4. New Module: Yamazumi Question Generator

Create `packages/core/src/yamazumi/questions.ts`:

- Input: `YamazumiBarData[]` + optional `taktTime`
- Output: `GeneratedQuestion[]` with `evidence.wasteContribution` instead of `evidence.rSquaredAdj`
- 5 question templates from the lean investigation workflow above
- Validation: takt compliance check (boolean), not ANOVA regression

### 5. Capability Question Adapter

Wrap existing `generateQuestionsFromRanking()`:

- When specs are present, reword "variation" → "Cpk"
- Add centering-vs-spread diagnostic question when both Cp and Cpk are available
- Generate subgroup drill-down questions from `SubgroupCapabilityResult`

### 6. Wire Mode into Pipeline

Pass `analysisMode` (optional) to `generateInitialQuestions()` in `useHypotheses`:

- Use `getStrategy(resolveMode(mode)).questionStrategy.generator` to route
- Standard/Capability/Performance → existing best subsets (with adapter)
- Yamazumi → new waste composition generator

### 7. Evidence Badge Adaptation

`QuestionChecklist` shows mode-appropriate evidence:

- Standard: R²adj badge
- Capability: "Cpk impact" badge
- Yamazumi: "Waste %" badge
- Performance: "Channel Cpk" badge

## Consequences

### Positive

- Questions match mode-specific terminology users see in charts and reports
- Yamazumi gets proper lean investigation flow instead of meaningless regression questions
- Capability questions leverage specification limits when available
- Deterministic questions align with CoScout coaching (already mode-aware in `coScout.ts:926-959`)
- Unique differentiation — no competitor generates adaptive investigation questions

### Negative

- 6 function signatures gain optional `analysisMode` parameter
- New question generator module for Yamazumi (`yamazumi/questions.ts`)
- QuestionChecklist needs mode-aware evidence rendering

### Neutral

- All changes are additive — existing Standard mode behavior is untouched
- Strategy pattern already has the infrastructure; this extends it

## Implementation Sequence

1. **Capability adapter** (easiest — same data model, reword questions when specs present)
2. **Yamazumi generator** (new analytical model — waste composition from `YamazumiBarData[]`)
3. **Performance adapter** (channel-first ranking from `ChannelResult[]`)
4. **Evidence badge** in QuestionChecklist (mode-aware rendering)
5. **Finding outcome extension** — optional `vaRatioBefore/After`, `taktComplianceBefore/After` fields

## Implementation Status

### Key Files to Create

| File                                      | Purpose                     |
| ----------------------------------------- | --------------------------- |
| `packages/core/src/yamazumi/questions.ts` | Yamazumi question generator |

### Key Files to Modify

| File                                                              | Change                                                          |
| ----------------------------------------------------------------- | --------------------------------------------------------------- |
| `packages/core/src/analysisStrategy.ts`                           | Add `questionStrategy` to `AnalysisModeStrategy`                |
| `packages/core/src/stats/bestSubsets.ts`                          | Add optional `analysisMode` to `generateQuestionsFromRanking()` |
| `packages/core/src/stats/factorEffects.ts`                        | Add optional `analysisMode` to `computeMainEffects()`           |
| `packages/core/src/findings/types.ts`                             | Add optional `vaRatioBefore/After` to `FindingOutcome`          |
| `packages/hooks/src/useHypotheses.ts`                             | Wire `analysisMode` to `generateInitialQuestions()`             |
| `packages/ui/src/components/FindingsWindow/QuestionChecklist.tsx` | Mode-aware evidence badge                                       |

## Note: Standard ANOVA Metrics (ADR-062)

Since **ADR-062** (Apr 2026), the "Category Total SS %" metric for Standard/Capability/Performance modes is removed. Those modes use η² and R²adj directly. The Yamazumi "waste contribution %" (a lean domain metric, not an ANOVA metric) is unaffected and remains as specified here.

## References

- [ADR-053: Question-Driven Investigation](adr-053-question-driven-investigation.md) — base question model
- [ADR-052: Factor Intelligence](adr-052-factor-intelligence.md) — 3-layer factor analysis
- [ADR-047: Analysis Mode Strategy Pattern](adr-047-analysis-mode-strategy.md) — strategy registry
- [ADR-034: Yamazumi Analysis Mode](adr-034-yamazumi-analysis-mode.md) — Yamazumi data model
- [ADR-062: Standard ANOVA Metrics](adr-062-standard-anova-metrics.md)
- [EDA Mental Model](../01-vision/eda-mental-model.md) — Turtiainen 2019 methodology
- [AI Context Engineering](../05-technical/architecture/ai-context-engineering.md) — CoScout mode coaching
