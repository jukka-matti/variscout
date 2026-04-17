---
status: archived
title: Interaction Effects UI Wiring Plan
---

# Interaction Effects UI Wiring Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire interaction screening results from the core engine into the UI: CoScout context, question templates, equation display, and edge detail card.

**Architecture:** All four tasks consume `InteractionScreenResult` from `@variscout/core/stats`. Changes flow through hooks → UI components. No new packages or architectural changes.

**Tech Stack:** TypeScript, React, Vitest

**Spec:** `docs/superpowers/specs/2026-04-07-interaction-effects-design.md` (sections 7-10)

---

### Task 1: Enrich CoScout AI context with interaction data

**Files:**

- Modify: `packages/core/src/ai/types.ts`
- Modify: `packages/core/src/ai/prompts/coScout/context/investigation.ts`

- [ ] **Step 1: Extend the interactionEffects type in AIContext**

In `packages/core/src/ai/types.ts`, replace the current `interactionEffects` shape (around line 245-251) with the enriched version from the spec:

```typescript
    interactionEffects?: Array<{
      factors: [string, string];
      pattern: 'ordinal' | 'disordinal';
      deltaRSquaredAdj: number;
      pValue: number;
      plainLanguage: string;
    }>;
```

- [ ] **Step 2: Add interaction effects formatter to investigation context**

In `packages/core/src/ai/prompts/coScout/context/investigation.ts`, find where causal links are formatted into the prompt string. After that block, add an interaction effects block:

```typescript
// Interaction effects
if (investigation.interactionEffects?.length) {
  const significant = investigation.interactionEffects.filter(ie => ie.deltaRSquaredAdj > 0.02);
  if (significant.length > 0) {
    parts.push('Interaction effects detected:');
    for (const ie of significant) {
      parts.push(
        `- ${ie.factors[0]} × ${ie.factors[1]}: ${ie.plainLanguage} (ΔR²adj=${(ie.deltaRSquaredAdj * 100).toFixed(1)}%, p=${ie.pValue.toFixed(3)})`
      );
    }
  }
}
```

- [ ] **Step 3: Update any consumers that build the interactionEffects field**

Search for places that populate `investigation.interactionEffects` (likely in `packages/hooks/src/useAIOrchestration.ts` or `useCoScoutProps.ts`). Update them to pass the new enriched shape. If the field is currently populated from `computeInteractionEffects()` results, map the old `InteractionResult` to the new shape. If it's populated from `InteractionScreenResult` (from best subsets Pass 2), map directly.

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @variscout/core test -- --run`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/ai/types.ts packages/core/src/ai/prompts/coScout/context/investigation.ts
git commit -m "feat(ai): enrich CoScout context with interaction pattern and plain language"
```

---

### Task 2: Add directional question templates from screening results

**Files:**

- Modify: `packages/hooks/src/useQuestionGeneration.ts`
- Modify: `packages/core/src/stats/factorEffects.ts`

- [ ] **Step 1: Extend generateFollowUpQuestions to accept InteractionScreenResult**

In `packages/core/src/stats/factorEffects.ts`, update `generateFollowUpQuestions()` to optionally accept `InteractionScreenResult[]` (from Pass 2) in addition to the existing `InteractionEffectsResult`. When screen results are provided, use directional templates:

```typescript
export function generateFollowUpQuestions(
  mainEffects: MainEffectsResult | null,
  interactions: InteractionEffectsResult | null,
  options?: {
    minEtaSquared?: number;
    screenResults?: InteractionScreenResult[];
  }
): GeneratedQuestion[] {
```

In the Layer 3 section, if `options?.screenResults` is provided, use directional templates instead of the generic "do these factors interact?" text:

```typescript
  // Layer 3: if screen results available, use directional templates
  if (options?.screenResults) {
    for (const sr of options.screenResults) {
      if (!sr.isSignificant) continue;
      const text = sr.pattern === 'disordinal'
        ? `${sr.factors[0]} and ${sr.factors[1]} — the ranking flips across ${sr.plotSeries} levels. What's different about them?`
        : `${sr.factors[0]} and ${sr.factors[1]} — the gap between ${sr.plotSeries} levels changes at different ${sr.plotXAxis} values. Worth checking why.`;

      questions.push({
        text,
        factors: [...sr.factors],
        rSquaredAdj: sr.deltaRSquaredAdj,
        autoAnswered: false,
        source: 'factor-intel',
        type: 'interaction',
      });
    }
  } else if (interactions && mainEffects && mainEffects.significantCount >= 2) {
    // Existing generic interaction question generation
    ...
  }
```

- [ ] **Step 2: Wire screen results into useQuestionGeneration hook**

In `packages/hooks/src/useQuestionGeneration.ts`, where `interactionEffects` is computed (around line 138), also check if best subsets has `interactionScreenResults`. If so, pass them to `generateFollowUpQuestions`:

```typescript
const l3FollowUps =
  allAnsweredL1WithEvidence.length >= 2
    ? generateFollowUpQuestions(null, interactionEffects, {
        screenResults: bestSubsets?.subsets[0]?.interactionScreenResults,
      })
    : [];
```

- [ ] **Step 3: Run tests**

Run: `pnpm --filter @variscout/core test -- --run` and `pnpm --filter @variscout/hooks test -- --run`
Expected: ALL PASS

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/stats/factorEffects.ts packages/hooks/src/useQuestionGeneration.ts
git commit -m "feat(hooks): directional interaction question templates from screening results"
```

---

### Task 3: EquationDisplay interaction chip + qualification badge

**Files:**

- Modify: `packages/ui/src/components/ProcessIntelligencePanel/EquationDisplay.tsx`

- [ ] **Step 1: Add interaction case to predictor chip rendering**

In `EquationDisplay.tsx`, find `buildFactorChips()` (around line 274). After the continuous and categorical branches, add an interaction case:

```typescript
// Interaction predictors
const interactionPredictors = predictors.filter(p => p.type === 'interaction');
for (const pred of interactionPredictors) {
  if (!pred.sourceFactors) continue;
  chips.push({
    label: `${pred.sourceFactors[0]} × ${pred.sourceFactors[1]}`,
    magnitude: Math.abs(pred.coefficient),
    sign: pred.coefficient >= 0 ? '+' : '−',
    type: 'interaction' as const,
    tooltip: `Interaction coefficient: ${pred.coefficient.toFixed(4)} (p=${pred.pValue.toFixed(3)})`,
  });
}
```

Render interaction chips with a × glyph and a distinct styling (e.g., `border-purple-500/30` to match the Evidence Map 'interactive' edge color).

- [ ] **Step 2: Add qualification badge when interactions are in the model**

Find the warnings/badge section. Add a qualification message when any interaction predictors exist:

```typescript
  const hasInteractionTerms = predictors?.some(p => p.type === 'interaction');

  // In the warnings/badge rendering:
  {hasInteractionTerms && (
    <div className="text-xs text-content-secondary mt-1">
      Model includes factor interactions — predictions account for combined effects.
    </div>
  )}
```

- [ ] **Step 3: Run tests**

Run: `pnpm --filter @variscout/ui test -- --run`
Expected: ALL PASS (existing EquationDisplay tests should not break since new fields are optional)

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/components/ProcessIntelligencePanel/EquationDisplay.tsx
git commit -m "feat(ui): EquationDisplay interaction chip with × glyph and qualification badge"
```

---

### Task 4: EdgeDetailCard interaction-specific content

**Files:**

- Modify: `packages/ui/src/components/EvidenceMap/EdgeDetailCard.tsx`

- [ ] **Step 1: Add interaction pattern props**

Extend `EdgeDetailCardProps` to accept interaction metadata:

```typescript
  /** Interaction pattern classification */
  interactionPattern?: 'ordinal' | 'disordinal';
  /** Cell sample counts for the interaction */
  cellCounts?: Array<{ levelA: string; levelB: string; n: number }>;
```

- [ ] **Step 2: Render interaction-specific guidance**

When `relationshipType === 'interactive'` and `interactionPattern` is provided, replace the generic guidance text with pattern-specific text:

```typescript
const interactionGuidance =
  interactionPattern === 'disordinal'
    ? `The ranking of ${factorB} levels reverses across ${factorA} values.`
    : `The gap between ${factorB} levels changes across ${factorA} values.`;
```

- [ ] **Step 3: Add cell count display**

When `cellCounts` is provided, show a compact table below the stats row showing sample sizes per cell combination. This addresses Dr. Makela's caveat 2 (cell n counts). Flag cells with n < 5:

```typescript
  {cellCounts && cellCounts.length > 0 && (
    <div className="px-3 pb-2 text-xs">
      <div className="text-content-secondary mb-1">Cell sample sizes:</div>
      <div className="flex flex-wrap gap-1">
        {cellCounts.map(cell => (
          <span key={`${cell.levelA}-${cell.levelB}`}
            className={cell.n < 5 ? 'text-amber-500' : 'text-content-secondary'}>
            {cell.levelA}×{cell.levelB}: n={cell.n}
          </span>
        ))}
      </div>
    </div>
  )}
```

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @variscout/ui test -- --run`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/EvidenceMap/EdgeDetailCard.tsx
git commit -m "feat(ui): EdgeDetailCard interaction pattern guidance and cell counts"
```
