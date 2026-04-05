# CoScout Cognitive Redesign — Phase 2: Intelligence + Integration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the cognitive redesign by surfacing invisible data, adding proactive coaching, wiring knowledge integration, migrating consumers from legacy, and documenting the new architecture.

**Architecture:** Build on Phase 1's modular `coScout/` directory. Enrich context formatters with computed-but-invisible data. Add phase transition tracking and evidence sufficiency to investigation context. Wire investigation serializer to domain store mutations. Migrate `useAICoScout.ts` from legacy builders to `assembleCoScoutPrompt`.

**Tech Stack:** TypeScript, Vitest, `@variscout/core/ai`, `@variscout/hooks`, `apps/azure/src/features/ai`

**Design Spec:** `docs/superpowers/specs/2026-04-05-coscout-cognitive-redesign-design.md`
**Phase 1 (complete):** `docs/superpowers/plans/2026-04-05-coscout-cognitive-redesign-phase1.md`

**Pre-requisites verified:** Question generators (yamazumi, performance, standard) already wired. search_knowledge_base and answer_question tool handlers already implemented.

---

### Task 1: Surface bestModelEquation in data context

**Files:**

- Modify: `packages/core/src/ai/prompts/coScout/context/dataContext.ts`
- Test: `packages/core/src/ai/__tests__/coScoutContext.test.ts` (extend)

The `bestModelEquation` field is computed in `buildAIContext.ts` (lines 591-638) with factors, rSquaredAdj, levelEffects, worstCase, bestCase — but never surfaced in any context formatter.

- [ ] **Step 1: Add test for model equation in data context**

```typescript
it('includes best model equation when present', () => {
  const result = formatDataContext({
    ...emptyContext,
    bestModelEquation: {
      factors: ['Machine', 'Shift'],
      rSquaredAdj: 0.61,
      levelEffects: { Machine: { A: -2.1, B: 3.4 }, Shift: { Day: -1.2, Night: 1.2 } },
      worstCase: { levels: { Machine: 'B', Shift: 'Night' }, predicted: 53.4 },
      bestCase: { levels: { Machine: 'A', Shift: 'Day' }, predicted: 47.9 },
    },
  } as any);
  expect(result).toContain('Best model');
  expect(result).toContain('R²adj');
  expect(result).toContain('0.61');
  expect(result).toContain('Machine');
});

it('omits model equation when not present', () => {
  const result = formatDataContext(emptyContext as any);
  expect(result).not.toContain('Best model');
});
```

- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement model equation formatting in dataContext.ts**

Add to `formatDataContext()`:

```typescript
if (context.bestModelEquation) {
  const eq = context.bestModelEquation;
  const factorList = eq.factors.join(', ');
  lines.push(`Best model: {${factorList}} → R²adj=${eq.rSquaredAdj.toFixed(2)}`);
  if (eq.worstCase && eq.bestCase) {
    const worst = Object.entries(eq.worstCase.levels)
      .map(([f, v]) => `${f}=${v}`)
      .join(' + ');
    const best = Object.entries(eq.bestCase.levels)
      .map(([f, v]) => `${f}=${v}`)
      .join(' + ');
    lines.push(`  Worst case: ${worst} → ${eq.worstCase.predicted.toFixed(1)}`);
    lines.push(`  Best case: ${best} → ${eq.bestCase.predicted.toFixed(1)}`);
  }
}
```

- [ ] **Step 4: Run tests, verify pass**
- [ ] **Step 5: Commit**

```bash
git commit -m "feat(ai): surface bestModelEquation in data context formatter"
```

---

### Task 2: Surface focusContext and activeChart

**Files:**

- Modify: `packages/core/src/ai/prompts/coScout/context/dataContext.ts`
- Modify: `packages/core/src/ai/buildAIContext.ts` (wire focusContext)
- Test: `packages/core/src/ai/__tests__/coScoutContext.test.ts` (extend)

`focusContext` (from "Ask CoScout" clicks) is accepted as an option in buildAIContext but not propagated. `activeChart` is propagated but not formatted in the data context.

- [ ] **Step 1: Write tests**

```typescript
it('includes active chart when present', () => {
  const result = formatDataContext({
    ...emptyContext,
    activeChart: 'boxplot',
  } as any);
  expect(result).toContain('Active chart');
  expect(result).toContain('boxplot');
});

it('includes focus context when present', () => {
  const result = formatDataContext({
    ...emptyContext,
    focusContext: { type: 'chart-element', chart: 'boxplot', factor: 'Machine', value: 'B' },
  } as any);
  expect(result).toContain('Focus');
  expect(result).toContain('Machine');
});
```

- [ ] **Step 2: Implement in dataContext.ts**

Add `activeChart` and `focusContext` formatting. For focusContext, format as: "Focus: Analyst clicked Machine=B on boxplot".

- [ ] **Step 3: Wire focusContext in buildAIContext.ts**

Find where `options.focusContext` is accepted but not propagated (around line 455). Add it to the context object.

- [ ] **Step 4: Run tests, verify pass**
- [ ] **Step 5: Commit**

```bash
git commit -m "feat(ai): surface activeChart and focusContext in data context"
```

---

### Task 3: Phase transition tracking

**Files:**

- Modify: `packages/core/src/ai/buildAIContext.ts`
- Modify: `packages/core/src/ai/prompts/coScout/context/investigation.ts`
- Test: `packages/core/src/ai/__tests__/coScoutContext.test.ts` (extend)

Currently `detectInvestigationPhase()` returns only the current phase. For proactive coaching (Pillar 6), the prompt needs to know when a transition happened.

- [ ] **Step 1: Write tests**

```typescript
it('includes phase transition announcement when phase changed', () => {
  const result = formatInvestigationContext({
    phase: 'validating',
    previousPhase: 'diverging',
    transitionReason: 'You answered 3 questions — evidence is accumulating',
    questionTree: [],
    suspectedCauseHubs: [],
  } as any);
  expect(result).toContain('Phase transition');
  expect(result).toContain('validating');
  expect(result).toContain('diverging');
});

it('no transition announcement when phase unchanged', () => {
  const result = formatInvestigationContext({
    phase: 'diverging',
    questionTree: [],
    suspectedCauseHubs: [],
  } as any);
  expect(result).not.toContain('Phase transition');
});
```

- [ ] **Step 2: Add previousPhase to investigation context type**

In `packages/core/src/ai/types.ts`, add `previousPhase?: InvestigationPhase` and `transitionReason?: string` to the investigation context type.

- [ ] **Step 3: Track previousPhase in buildAIContext**

Add a `previousPhase` parameter to `BuildAIContextOptions`. The caller (`useAIContext` or `useAIOrchestration`) tracks the last-known phase and passes it. When `phase !== previousPhase`, compute `transitionReason` based on the transition type.

- [ ] **Step 4: Format in investigation context**

In `formatInvestigationContext`, when `previousPhase` exists and differs from `phase`, prepend:

```
⚡ Phase transition: {previousPhase} → {phase}
{transitionReason}
```

- [ ] **Step 5: Run tests, verify pass**
- [ ] **Step 6: Commit**

```bash
git commit -m "feat(ai): track and announce phase transitions in investigation context"
```

---

### Task 4: Evidence sufficiency checks

**Files:**

- Modify: `packages/core/src/ai/prompts/coScout/context/investigation.ts`
- Test: `packages/core/src/ai/__tests__/coScoutContext.test.ts` (extend)

When a suspected cause hub explains < 25% of variation (R²adj), flag it in the investigation context.

- [ ] **Step 1: Write tests**

```typescript
it('flags low-coverage hub when R²adj < 25%', () => {
  const result = formatInvestigationContext({
    phase: 'converging',
    questionTree: [],
    suspectedCauseHubs: [
      {
        name: 'Nozzle Wear',
        status: 'suspected',
        evidence: { rSquaredAdj: 0.12 },
      },
    ],
    coveragePercent: 12,
  } as any);
  expect(result).toContain('low coverage');
});

it('does not flag hub with sufficient coverage', () => {
  const result = formatInvestigationContext({
    phase: 'converging',
    questionTree: [],
    suspectedCauseHubs: [
      {
        name: 'Machine Wear',
        status: 'confirmed',
        evidence: { rSquaredAdj: 0.45 },
      },
    ],
    coveragePercent: 45,
  } as any);
  expect(result).not.toContain('low coverage');
});
```

- [ ] **Step 2: Implement in investigation.ts**

After hub formatting, check `coveragePercent` or hub evidence. If < 25%, append:

```
⚠ Evidence coverage: {hub.name} explains only {pct}% of variation — significant sources may remain unexplored.
```

- [ ] **Step 3: Run tests, verify pass**
- [ ] **Step 4: Commit**

```bash
git commit -m "feat(ai): evidence sufficiency warning for low-coverage suspected cause hubs"
```

---

### Task 5: Evidence metric sorting in QuestionsTabView

**Files:**

- Modify: `packages/ui/src/components/QuestionsTabView/QuestionsTabView.tsx` (or equivalent)
- Modify: `packages/core/src/analysisStrategy.ts` (verify questionStrategy consumed)

Evidence sorting is currently hardcoded to R²adj. The strategy pattern has `questionStrategy.evidenceMetric` but it's not consumed for sort order.

- [ ] **Step 1: Find the hardcoded sort**

Search QuestionsTabView or QuestionChecklist for where questions are sorted. Look for `etaSquared` or `rSquaredAdj` sort comparisons.

- [ ] **Step 2: Replace with mode-aware evidence metric**

Use `getStrategy(mode).questionStrategy.evidenceMetric` to determine sort field:

- standard: R²adj
- yamazumi: waste contribution (VA ratio inverse)
- performance: channel Cpk

- [ ] **Step 3: Test and commit**

```bash
git commit -m "feat(ai): evidence metric sorting driven by analysis mode strategy"
```

---

### Task 6: Wire investigation serializer to mutations

**Files:**

- Modify: `apps/azure/src/features/ai/useAIOrchestration.ts`

`useInvestigationIndexing` hook exists and exposes `onFindingsChange()` and `onQuestionsChange()`. It just needs to be called when findings/questions change.

- [ ] **Step 1: Add useEffect to call onFindingsChange**

In `useAIOrchestration.ts`, add:

```typescript
const { onFindingsChange, onQuestionsChange } = useInvestigationIndexing({
  projectId,
  enabled: isKnowledgeBaseAvailable(),
});

useEffect(() => {
  onFindingsChange(findings);
}, [findings, onFindingsChange]);

useEffect(() => {
  onQuestionsChange(questions);
}, [questions, onQuestionsChange]);
```

- [ ] **Step 2: Verify build passes**
- [ ] **Step 3: Commit**

```bash
git commit -m "feat(ai): wire investigation serializer to findings/questions mutations"
```

---

### Task 7: Migrate useAICoScout from legacy to assembleCoScoutPrompt

**Files:**

- Modify: `packages/hooks/src/useAICoScout.ts`
- Modify: `packages/core/src/ai/prompts/coScout/index.ts` (remove legacy re-exports)

The consumer `useAICoScout.ts` currently calls legacy `buildCoScoutInput()` and `buildCoScoutTools()`. Migrate to `assembleCoScoutPrompt()`.

- [ ] **Step 1: Update useAICoScout to use assembler**

Replace:

```typescript
const { instructions, input } = buildCoScoutInput(context, messages, text, options);
const tools = buildCoScoutTools(toolsOptions);
```

With:

```typescript
const tiers = assembleCoScoutPrompt({
  phase: toolsOptions?.phase ?? 'frame',
  investigationPhase: toolsOptions?.investigationPhase,
  mode: context.analysisMode ?? 'standard',
  surface: 'fullPanel',
  context,
  isTeamPlan: toolsOptions?.isTeamPlan,
});
```

Then pass `tiers.tier1Static + '\n\n' + tiers.tier2SemiStatic` as the system prompt and `tiers.tools` as tools to `streamResponsesWithToolLoop`.

Note: `buildCoScoutInput` also builds the conversation history (input array). That logic still needs to exist — either keep it as a utility or inline it. Read the function to understand what it does beyond prompt assembly.

- [ ] **Step 2: Remove legacy re-exports from coScout/index.ts**

Since backward compat is not needed, remove the `@deprecated` re-exports of `buildCoScoutSystemPrompt`, `buildCoScoutMessages`, `buildCoScoutInput`, `buildCoScoutTools`.

- [ ] **Step 3: Update prompts/index.ts**

Remove legacy function exports. Keep only the new API exports.

- [ ] **Step 4: Fix any broken imports**

Search for `buildCoScoutSystemPrompt`, `buildCoScoutInput`, `buildCoScoutTools` across the codebase. Update or remove.

- [ ] **Step 5: Run full test suite**

`pnpm test` — all packages must pass.

- [ ] **Step 6: Commit**

```bash
git commit -m "refactor(ai): migrate useAICoScout to assembleCoScoutPrompt, remove legacy exports"
```

---

### Task 8: Documentation

**Files:**

- Modify: `docs/05-technical/architecture/ai-context-engineering.md`
- Create: `docs/05-technical/architecture/coscout-prompt-architecture.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update ai-context-engineering.md**

Update to reflect:

- `CoScoutPromptTiers` type enforcement
- Modular `coScout/` directory structure
- Phase-aware `budgetContext()` trimming (per design spec)
- 7 interaction surfaces with budgets

- [ ] **Step 2: Create coscout-prompt-architecture.md**

New architecture reference document:

- Prompt assembly pipeline diagram (phase × mode × surface → tiers)
- Tool registry pattern (definitions → prompts + handlers)
- Grounded data context format
- Phase × mode coaching matrix
- Tier caching strategy

- [ ] **Step 3: Update CLAUDE.md AI sections**

Update the AI-related entries in CLAUDE.md Key Patterns and Key Entry Points to reference the new modular structure.

- [ ] **Step 4: Commit**

```bash
git commit -m "docs: update AI architecture docs for CoScout cognitive redesign"
```

---

### Task 9: Final verification

- [ ] **Step 1: Full build** — `pnpm build`
- [ ] **Step 2: Full test suite** — `pnpm test`
- [ ] **Step 3: Grep verification**

```bash
# No legacy function calls outside legacy.ts itself
grep -r "buildCoScoutSystemPrompt\|buildCoScoutInput\|buildCoScoutTools" packages/ apps/ --include="*.ts" --include="*.tsx" | grep -v legacy | grep -v __tests__ | grep -v node_modules
```

- [ ] **Step 4: Update MEMORY.md and ruflo memory**
- [ ] **Step 5: Commit**

```bash
git commit -m "chore: Phase 2 complete — CoScout cognitive redesign fully implemented"
```
