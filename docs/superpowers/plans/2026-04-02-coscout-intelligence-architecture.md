---
title: CoScout Intelligence Architecture (ADR-060) Implementation Plan
---

# CoScout Intelligence Architecture (ADR-060) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform CoScout from a context-summarizing assistant into a knowledge-grounded investigation partner with five pillars: hot context quality, investigation retrieval, external document KB, question interaction, and mode-aware question completion.

> **Note (Apr 2026):** CoScout context (hot context pillar) includes SuspectedCause hubs — evidence strength, validation status, Problem Statement fragments, and linked improvement ideas — so CoScout can reason about the current investigation at the cause level rather than just the finding level. See [Investigation Workspace Reframing](../specs/2026-04-03-investigation-workspace-reframing-design.md).

**Architecture:** Three-layer knowledge system (hot/warm/cold) using Foundry IQ for hybrid BM25+vector search. Investigation artifacts serialized to Blob Storage, auto-indexed by Foundry IQ. `KnowledgeAdapter` interface abstracts search backend with fallback chain.

**Tech Stack:** TypeScript, React, Vitest, Azure Blob Storage, Azure AI Search + Foundry IQ, Azure OpenAI (text-embedding-3-small), Express (server.js)

**Spec:** `docs/superpowers/specs/2026-04-02-coscout-intelligence-architecture-design.md`

---

## Phase 1: Hot Context Quality (Pillar 1)

No infrastructure changes. Pure TypeScript/React — immediate CoScout improvement.

### Task 1: Add New Fields to AIContext Interface

**Files:**

- Modify: `packages/core/src/ai/types.ts:99-174`
- Test: `packages/core/src/ai/__tests__/types.test.ts` (compile check)

- [ ] **Step 1: Add enriched findings fields to AIContext**

In `packages/core/src/ai/types.ts`, extend the `findings` field (around line 99):

```typescript
findings?: {
  total: number;
  byStatus: Record<string, number>;
  keyDrivers: string[];
  coscoutInsights?: Array<{ text: string; status: string }>;
  // NEW: enriched summaries for top findings
  topFindings?: Array<{
    id: string;
    text: string;
    status: string;
    commentCount: number;
    outcome?: { effective: 'yes' | 'no' | 'partial'; cpkDelta?: number };
  }>;
  // NEW: overdue actions
  overdueActions?: Array<{
    text: string;
    assignee?: string;
    daysOverdue: number;
    findingId: string;
  }>;
};
```

- [ ] **Step 2: Add investigation context fields**

In the same file, extend the `investigation` field (around line 107):

```typescript
investigation?: {
  // existing fields...
  issueStatement?: string;
  // NEW: Problem statement (Watson's 3 questions)
  problemStatement?: {
    measure?: string;
    direction?: string;
    scope?: string;
    fullText?: string;
  };
  // NEW: focused question
  focusedQuestionId?: string;
  focusedQuestionText?: string;
  // existing allQuestions, but enriched:
  allQuestions?: Array<{
    id: string;
    text: string;
    status: string;
    contribution?: number;
    questionSource?: string;
    causeRole?: string;
    manualNote?: string;        // NEW: why answered/ruled-out
    linkedFindingIds?: string[];  // NEW: supporting findings
    ideas?: Array<{
      text: string;
      selected?: boolean;
      projection?: { meanDelta: number; sigmaDelta: number };
      direction?: string;       // NEW: prevent/detect/simplify/eliminate
      timeframe?: string;       // NEW: just-do/days/weeks/months
      riskLevel?: string;       // NEW: low/medium/high
    }>;
  }>;
  // rest of existing fields...
};
```

- [ ] **Step 3: Verify compilation**

Run: `pnpm --filter @variscout/core build`
Expected: Clean build with no type errors.

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/ai/types.ts
git commit -m "feat(core): enrich AIContext with problem statement, findings, and question fields (ADR-060 Pillar 1)"
```

### Task 2: Wire Problem Statement into buildAIContext

**Files:**

- Modify: `packages/core/src/ai/buildAIContext.ts:105-200`
- Test: `packages/core/src/ai/__tests__/buildAIContext.test.ts`

- [ ] **Step 1: Write failing test for problem statement**

```typescript
import { buildAIContext } from '../buildAIContext';

describe('buildAIContext — ADR-060 Pillar 1', () => {
  it('includes problemStatement from processContext', () => {
    const ctx = buildAIContext({
      process: {
        issueStatement: 'Parts are late',
        problemStatement: 'Reduce cycle time of step 2 by 15% for product A',
      },
      findings: [],
      questions: [],
    });
    expect(ctx.investigation?.problemStatement?.fullText).toBe(
      'Reduce cycle time of step 2 by 15% for product A'
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/core test -- --run buildAIContext`
Expected: FAIL — `problemStatement` not populated.

- [ ] **Step 3: Wire problemStatement in buildAIContext**

In `packages/core/src/ai/buildAIContext.ts`, in the section where `investigation` is assembled (around line 290+), add:

```typescript
// Wire problem statement from ProcessContext
const problemStatement = options.process?.problemStatement
  ? { fullText: options.process.problemStatement }
  : undefined;

// Add to investigation object:
investigation: {
  ...existingFields,
  problemStatement,
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @variscout/core test -- --run buildAIContext`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/ai/buildAIContext.ts packages/core/src/ai/__tests__/buildAIContext.test.ts
git commit -m "feat(core): wire problemStatement into buildAIContext (ADR-060)"
```

### Task 3: Wire Enriched Finding Summaries

**Files:**

- Modify: `packages/core/src/ai/buildAIContext.ts`
- Test: `packages/core/src/ai/__tests__/buildAIContext.test.ts`

- [ ] **Step 1: Write failing test for topFindings**

```typescript
it('includes top-5 enriched finding summaries by recency', () => {
  const findings = Array.from({ length: 8 }, (_, i) => ({
    id: `f${i}`,
    text: `Finding ${i}`,
    status: i < 2 ? 'resolved' : 'observed',
    createdAt: Date.now() - (7 - i) * 1000, // f7 is most recent
    comments: i === 7 ? [{ text: 'test comment', createdAt: Date.now() }] : [],
    outcome: i === 0 ? { effective: 'yes', cpkBefore: 0.8, cpkAfter: 1.4 } : undefined,
  }));

  const ctx = buildAIContext({ findings, questions: [] });

  expect(ctx.findings?.topFindings).toHaveLength(5);
  expect(ctx.findings?.topFindings?.[0].id).toBe('f7'); // most recent first
  expect(ctx.findings?.topFindings?.[0].commentCount).toBe(1);
});

it('includes outcome cpkDelta for resolved findings', () => {
  const findings = [
    {
      id: 'f1',
      text: 'Resolved',
      status: 'resolved',
      createdAt: Date.now(),
      comments: [],
      outcome: { effective: 'yes', cpkBefore: 0.8, cpkAfter: 1.4 },
    },
  ];

  const ctx = buildAIContext({ findings, questions: [] });
  const top = ctx.findings?.topFindings?.find(f => f.id === 'f1');
  expect(top?.outcome?.effective).toBe('yes');
  expect(top?.outcome?.cpkDelta).toBeCloseTo(0.6);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/core test -- --run buildAIContext`
Expected: FAIL

- [ ] **Step 3: Implement topFindings assembly**

In `buildAIContext.ts`, replace the findings summarization section (around lines 265-284):

```typescript
// Enriched finding summaries — top 5 by recency
const sortedFindings = [...(options.findings ?? [])].sort(
  (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)
);
const topFindings = sortedFindings.slice(0, 5).map(f => ({
  id: f.id,
  text: f.text,
  status: f.status,
  commentCount: f.comments?.length ?? 0,
  outcome: f.outcome
    ? {
        effective: f.outcome.effective,
        cpkDelta:
          f.outcome.cpkAfter != null && f.outcome.cpkBefore != null
            ? f.outcome.cpkAfter - f.outcome.cpkBefore
            : undefined,
      }
    : undefined,
}));
```

Add `topFindings` to the returned `findings` object.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @variscout/core test -- --run buildAIContext`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/ai/buildAIContext.ts packages/core/src/ai/__tests__/buildAIContext.test.ts
git commit -m "feat(core): add enriched finding summaries to AIContext (ADR-060)"
```

### Task 4: Wire Overdue Actions and Focused Question

**Files:**

- Modify: `packages/core/src/ai/buildAIContext.ts`
- Test: `packages/core/src/ai/__tests__/buildAIContext.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
it('includes top-3 overdue actions', () => {
  const findings = [
    {
      id: 'f1',
      text: 'Test',
      status: 'improving',
      createdAt: Date.now(),
      comments: [],
      actions: [
        { id: 'a1', text: 'Fix nozzle', assignee: { displayName: 'Pekka' }, dueDate: '2026-03-01' },
        { id: 'a2', text: 'Calibrate', dueDate: '2026-03-15' },
        { id: 'a3', text: 'Train ops', dueDate: '2026-04-01' },
        { id: 'a4', text: 'Done one', dueDate: '2026-03-01', completedAt: '2026-03-02' },
      ],
    },
  ];
  const ctx = buildAIContext({ findings, questions: [] });
  expect(ctx.findings?.overdueActions).toHaveLength(3); // a4 completed, excluded
  expect(ctx.findings?.overdueActions?.[0].assignee).toBe('Pekka');
});

it('includes focusedQuestionId and text', () => {
  const questions = [{ id: 'q1', text: 'Does Shift affect Cpk?', status: 'open' }];
  const ctx = buildAIContext({
    findings: [],
    questions,
    focusedQuestionId: 'q1',
  });
  expect(ctx.investigation?.focusedQuestionId).toBe('q1');
  expect(ctx.investigation?.focusedQuestionText).toBe('Does Shift affect Cpk?');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/core test -- --run buildAIContext`
Expected: FAIL

- [ ] **Step 3: Implement overdue actions extraction**

```typescript
// Overdue actions — top 3, sorted by most overdue first
const now = Date.now();
const allActions = (options.findings ?? []).flatMap(f =>
  (f.actions ?? [])
    .filter(a => !a.completedAt && a.dueDate && new Date(a.dueDate).getTime() < now)
    .map(a => ({
      text: a.text,
      assignee: a.assignee?.displayName,
      daysOverdue: Math.floor((now - new Date(a.dueDate!).getTime()) / 86_400_000),
      findingId: f.id,
    }))
);
const overdueActions = allActions.sort((a, b) => b.daysOverdue - a.daysOverdue).slice(0, 3);
```

- [ ] **Step 4: Implement focusedQuestion lookup**

Add `focusedQuestionId?: string` to `BuildAIContextOptions` interface, then:

```typescript
const focusedQuestion = options.focusedQuestionId
  ? (options.questions ?? []).find(q => q.id === options.focusedQuestionId)
  : undefined;

// Add to investigation:
focusedQuestionId: options.focusedQuestionId,
focusedQuestionText: focusedQuestion?.text,
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter @variscout/core test -- --run buildAIContext`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/ai/buildAIContext.ts packages/core/src/ai/__tests__/buildAIContext.test.ts
git commit -m "feat(core): add overdue actions and focused question to AIContext (ADR-060)"
```

### Task 5: Wire Question Answer Visibility (manualNote + linkedFindingIds)

**Files:**

- Modify: `packages/core/src/ai/buildAIContext.ts`
- Test: `packages/core/src/ai/__tests__/buildAIContext.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
it('includes manualNote and linkedFindingIds in allQuestions', () => {
  const questions = [
    {
      id: 'q1',
      text: 'Does Shift matter?',
      status: 'answered',
      manualNote: 'Night shift has 23% higher defect rate',
      linkedFindingIds: ['f1', 'f2'],
    },
  ];
  const ctx = buildAIContext({ findings: [], questions });
  const q = ctx.investigation?.allQuestions?.find(q => q.id === 'q1');
  expect(q?.manualNote).toBe('Night shift has 23% higher defect rate');
  expect(q?.linkedFindingIds).toEqual(['f1', 'f2']);
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `pnpm --filter @variscout/core test -- --run buildAIContext`

- [ ] **Step 3: Add manualNote and linkedFindingIds to allQuestions mapping**

In `buildAIContext.ts`, in the `allQuestions` mapping (around line 312-329), add the new fields:

```typescript
allQuestions: questions.map(q => ({
  id: q.id,
  text: q.text,
  status: q.status,
  questionSource: q.questionSource,
  causeRole: q.causeRole,
  manualNote: q.manualNote,               // NEW
  linkedFindingIds: q.linkedFindingIds,    // NEW
  ideas: q.ideas?.map(idea => ({
    text: idea.text,
    selected: idea.selected,
    projection: idea.projection,
    direction: idea.direction,             // NEW (was 'category')
    timeframe: idea.timeframe,             // NEW
    riskLevel: idea.risk?.computed,         // NEW
  })),
})),
```

- [ ] **Step 4: Run test — expect PASS**

Run: `pnpm --filter @variscout/core test -- --run buildAIContext`

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/ai/buildAIContext.ts packages/core/src/ai/__tests__/buildAIContext.test.ts
git commit -m "feat(core): add manualNote and linkedFindingIds to question context (ADR-060)"
```

### Task 6: Position-Aware Context Rendering

**Files:**

- Modify: `packages/core/src/ai/prompts/coScout.ts:637-850`
- Test: `packages/core/src/ai/__tests__/promptTemplates.test.ts`

- [ ] **Step 1: Write failing test for position-aware ordering**

```typescript
it('renders problem statement before finding summaries in system prompt', () => {
  const prompt = buildCoScoutSystemPrompt({
    investigation: {
      problemStatement: { fullText: 'Reduce cycle time by 15%' },
      allQuestions: [{ id: 'q1', text: 'Does Shift?', status: 'open' }],
    },
  });
  const problemIdx = prompt.indexOf('Reduce cycle time by 15%');
  const questionsIdx = prompt.indexOf('Does Shift?');
  expect(problemIdx).toBeGreaterThan(-1);
  expect(problemIdx).toBeLessThan(questionsIdx);
});

it('renders overdue actions after finding summaries', () => {
  // Test that overdue actions appear after investigation questions
  // and near the end of the context
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `pnpm --filter @variscout/core test -- --run promptTemplates`

- [ ] **Step 3: Implement position-aware rendering in buildCoScoutSystemPrompt**

In `coScout.ts`, update the investigation context rendering section. Order:

1. **Start**: Problem statement + suspected causes + focused question
2. **Middle**: Finding summaries + question tree + improvement ideas
3. **End**: Overdue actions + outcome summaries

Add problem statement rendering:

```typescript
// Position 1: Problem statement (start — highest attention)
if (investigation?.problemStatement?.fullText) {
  sections.push(`**Problem Statement:** ${investigation.problemStatement.fullText}`);
}

// Position 2: Focused question
if (investigation?.focusedQuestionId) {
  sections.push(`**Currently investigating:** ${investigation.focusedQuestionText}`);
}
```

Add overdue actions at end:

```typescript
// Position N (end — second-highest attention): Overdue actions
if (findings?.overdueActions?.length) {
  const actionLines = findings.overdueActions.map(
    a => `⚠ "${a.text}" (${a.assignee ?? 'unassigned'}, ${a.daysOverdue}d overdue)`
  );
  sections.push(`**Overdue actions:**\n${actionLines.join('\n')}`);
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `pnpm --filter @variscout/core test -- --run promptTemplates`

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/ai/prompts/coScout.ts packages/core/src/ai/__tests__/promptTemplates.test.ts
git commit -m "feat(core): position-aware context rendering in CoScout prompt (ADR-060)"
```

### Task 7: Wire focusedQuestionId from Orchestration

**Files:**

- Modify: `apps/azure/src/features/ai/useAIOrchestration.ts`
- Modify: `apps/azure/src/features/investigation/investigationStore.ts` (read focusedQuestionId)

- [ ] **Step 1: Pass focusedQuestionId through to buildAIContext**

In `useAIOrchestration.ts`, read `focusedQuestionId` from the investigation store and pass it to `buildAIContext`:

```typescript
const focusedQuestionId = useInvestigationStore(s => s.expandedQuestionId);

// In buildAIContext call:
buildAIContext({
  ...existingOptions,
  focusedQuestionId,
});
```

- [ ] **Step 2: Verify build compiles**

Run: `pnpm --filter @variscout/azure-app build`
Expected: Clean build.

- [ ] **Step 3: Commit**

```bash
git add apps/azure/src/features/ai/useAIOrchestration.ts
git commit -m "feat(azure): wire focusedQuestionId to AI context (ADR-060)"
```

---

## Phase 2: Question Interaction + Mode Completion (Pillars 4 + 5)

### Task 8: Add answer_question Action Tool

**Files:**

- Modify: `packages/core/src/ai/prompts/coScout.ts:289-457` (INVESTIGATE+ tools section)
- Modify: `packages/core/src/ai/actionTools.ts` (ActionToolName)
- Test: `packages/core/src/ai/__tests__/promptTemplates.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
it('includes answer_question tool in INVESTIGATE phase', () => {
  const tools = buildCoScoutTools({ phase: 'investigate' });
  const answerTool = tools.find(t => t.name === 'answer_question');
  expect(answerTool).toBeDefined();
  expect(answerTool?.parameters?.properties).toHaveProperty('question_id');
  expect(answerTool?.parameters?.properties).toHaveProperty('status');
  expect(answerTool?.parameters?.properties).toHaveProperty('note');
});

it('excludes answer_question in SCOUT phase', () => {
  const tools = buildCoScoutTools({ phase: 'scout' });
  expect(tools.find(t => t.name === 'answer_question')).toBeUndefined();
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `pnpm --filter @variscout/core test -- --run promptTemplates`

- [ ] **Step 3: Add answer_question tool definition**

In `coScout.ts`, in the INVESTIGATE+ tools section (after `suggest_save_finding`, around line 457):

```typescript
{
  type: 'function' as const,
  name: 'answer_question',
  description: 'Propose marking an investigation question as answered or ruled-out based on evidence. The analyst will review and confirm before the status changes.',
  parameters: {
    type: 'object' as const,
    properties: {
      question_id: { type: 'string' as const, description: 'ID of the question to answer' },
      status: { type: 'string' as const, enum: ['answered', 'ruled-out'], description: 'Proposed status' },
      note: { type: 'string' as const, description: 'Evidence-based explanation for the answer' },
      finding_id: { type: 'string' as const, description: 'ID of supporting finding (recommended when evidence exists)' },
    },
    required: ['question_id', 'status', 'note'],
    additionalProperties: false,
  },
  strict: true,
},
```

- [ ] **Step 4: Add to ActionToolName**

In `actionTools.ts`, add `'answer_question'` to the action tool name union type.

- [ ] **Step 5: Run tests — expect PASS**

Run: `pnpm --filter @variscout/core test -- --run promptTemplates`

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/ai/prompts/coScout.ts packages/core/src/ai/actionTools.ts packages/core/src/ai/__tests__/promptTemplates.test.ts
git commit -m "feat(core): add answer_question action tool to CoScout (ADR-060 Pillar 4)"
```

### Task 9: Implement answer_question Tool Handler

**Files:**

- Modify: `apps/azure/src/features/ai/actionToolHandlers.ts` (or wherever action handlers live)
- Test: `apps/azure/src/features/ai/__tests__/actionToolHandlers.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
it('answer_question returns proposal with question text and note', () => {
  const handler = buildActionToolHandlers({
    questions: [{ id: 'q1', text: 'Does Shift affect Cpk?', status: 'open' }],
    // ...other deps
  });

  const result = await handler.answer_question({
    question_id: 'q1',
    status: 'answered',
    note: 'ANOVA shows η²=0.23 for Shift',
  });

  const parsed = JSON.parse(result);
  expect(parsed.questionText).toBe('Does Shift affect Cpk?');
  expect(parsed.proposedStatus).toBe('answered');
  expect(parsed.note).toBe('ANOVA shows η²=0.23 for Shift');
});
```

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Implement handler**

```typescript
answer_question: async (args) => {
  const questionId = args.question_id as string;
  const status = args.status as 'answered' | 'ruled-out';
  const note = args.note as string;
  const findingId = args.finding_id as string | undefined;

  const question = questions.find(q => q.id === questionId);
  if (!question) return JSON.stringify({ error: 'Question not found' });

  return JSON.stringify({
    questionText: question.text,
    proposedStatus: status,
    note,
    findingId,
    currentStatus: question.status,
  });
},
```

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/features/ai/actionToolHandlers.ts apps/azure/src/features/ai/__tests__/actionToolHandlers.test.ts
git commit -m "feat(azure): implement answer_question tool handler (ADR-060)"
```

### Task 10: Wire Yamazumi Question Generator

**Files:**

- Modify: `packages/hooks/src/useQuestionGeneration.ts:80-113`
- Test: `packages/hooks/src/__tests__/useQuestionGeneration.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
it('calls generateYamazumiQuestions when mode is yamazumi', () => {
  // Render hook with mode='yamazumi' and yamazumiData
  // Assert that questions have questionSource='factor-intel' and
  // waste-related text (e.g., "Which waste type dominates?")
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `pnpm --filter @variscout/hooks test -- --run useQuestionGeneration`

- [ ] **Step 3: Add mode routing in useQuestionGeneration**

In `useQuestionGeneration.ts`, around line 98, add mode check:

```typescript
import { generateYamazumiQuestions } from '@variscout/core/yamazumi';

// Inside the useEffect:
let generated: GeneratedQuestion[];
if (mode === 'yamazumi' && yamazumiData) {
  generated = generateYamazumiQuestions(yamazumiData, taktTime);
} else {
  generated = generateQuestionsFromRanking(bestSubsets, { mode });
}
```

Add `yamazumiData` and `taktTime` as hook parameters (passed from the app).

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add packages/hooks/src/useQuestionGeneration.ts packages/hooks/src/__tests__/useQuestionGeneration.test.ts
git commit -m "feat(hooks): wire yamazumi question generator into pipeline (ADR-060 Pillar 5)"
```

### Task 11: Implement Performance Channel Ranking Questions

**Files:**

- Create: `packages/core/src/stats/channelQuestions.ts`
- Test: `packages/core/src/stats/__tests__/channelQuestions.test.ts`
- Modify: `packages/hooks/src/useQuestionGeneration.ts`

- [ ] **Step 1: Write failing test**

```typescript
import { generateChannelRankingQuestions } from '../channelQuestions';

describe('generateChannelRankingQuestions', () => {
  it('generates questions ranked by worst Cpk first', () => {
    const channels = [
      { name: 'Channel 1', cpk: 1.8 },
      { name: 'Channel 7', cpk: 0.83 },
      { name: 'Channel 3', cpk: 1.2 },
    ];
    const questions = generateChannelRankingQuestions(channels);
    expect(questions[0].text).toContain('Channel 7');
    expect(questions[0].evidence?.channelCpk).toBe(0.83);
  });

  it('auto-rules-out channels with Cpk > 1.67', () => {
    const channels = [
      { name: 'Channel 1', cpk: 1.8 },
      { name: 'Channel 7', cpk: 0.83 },
    ];
    const questions = generateChannelRankingQuestions(channels);
    const ch1 = questions.find(q => q.text.includes('Channel 1'));
    expect(ch1?.autoAnswered).toBe(true);
    expect(ch1?.autoStatus).toBe('ruled-out');
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `pnpm --filter @variscout/core test -- --run channelQuestions`

- [ ] **Step 3: Implement generateChannelRankingQuestions**

```typescript
import type { GeneratedQuestion } from './bestSubsets';

interface ChannelInput {
  name: string;
  cpk: number;
}

const CpkExcellent = 1.67;

export function generateChannelRankingQuestions(channels: ChannelInput[]): GeneratedQuestion[] {
  return [...channels]
    .sort((a, b) => a.cpk - b.cpk) // worst first
    .map(ch => ({
      text: `Why does ${ch.name} have Cpk=${ch.cpk.toFixed(2)}?`,
      factors: [ch.name],
      evidence: { channelCpk: ch.cpk },
      autoAnswered: ch.cpk > CpkExcellent,
      autoStatus: ch.cpk > CpkExcellent ? ('ruled-out' as const) : undefined,
      source: 'factor-intel' as const,
      type: 'single-factor' as const,
    }));
}
```

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Wire into useQuestionGeneration**

Add `mode === 'performance'` branch alongside yamazumi:

```typescript
if (mode === 'yamazumi' && yamazumiData) {
  generated = generateYamazumiQuestions(yamazumiData, taktTime);
} else if (mode === 'performance' && channelData) {
  generated = generateChannelRankingQuestions(channelData);
} else {
  generated = generateQuestionsFromRanking(bestSubsets, { mode });
}
```

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/stats/channelQuestions.ts packages/core/src/stats/__tests__/channelQuestions.test.ts packages/hooks/src/useQuestionGeneration.ts
git commit -m "feat(core): implement performance channel ranking questions (ADR-060 Pillar 5)"
```

### Task 12: Mode-Aware Evidence Sorting

**Files:**

- Modify: `packages/ui/src/components/ProcessIntelligencePanel/QuestionsTabView.tsx:112-119`
- Test: `packages/ui/src/components/ProcessIntelligencePanel/__tests__/QuestionsTabView.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
it('sorts questions by evidenceMetric prop instead of hardcoded rSquaredAdj', () => {
  const { result } = renderHook(() => /* render QuestionsTabView with evidenceMetric='wasteContribution' */);
  // Assert sorting uses wasteContribution, not rSquaredAdj
});
```

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Add evidenceMetric prop and fix sorting**

In `QuestionsTabView.tsx`, add prop:

```typescript
interface QuestionsTabViewProps {
  // existing props...
  evidenceMetric?: string; // NEW: from strategy.questionStrategy.evidenceMetric
}
```

Replace hardcoded sorting (lines 112-119):

```typescript
// Before:
const aR = a.evidence?.rSquaredAdj ?? -1;
const bR = b.evidence?.rSquaredAdj ?? -1;

// After:
const metric = evidenceMetric ?? 'rSquaredAdj';
const aR = (a.evidence as Record<string, number | undefined>)?.[metric] ?? -1;
const bR = (b.evidence as Record<string, number | undefined>)?.[metric] ?? -1;
```

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/ProcessIntelligencePanel/QuestionsTabView.tsx packages/ui/src/components/ProcessIntelligencePanel/__tests__/QuestionsTabView.test.tsx
git commit -m "feat(ui): mode-aware evidence sorting in QuestionsTabView (ADR-060 Pillar 5)"
```

### Task 13: CoScout Validation Method Awareness

**Files:**

- Modify: `packages/core/src/ai/prompts/coScout.ts:925-990`
- Test: `packages/core/src/ai/__tests__/promptTemplates.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
it('includes validation method coaching for yamazumi mode', () => {
  const prompt = buildCoScoutSystemPrompt({
    analysisMode: 'yamazumi',
  });
  expect(prompt).toContain('taktCompliance');
  expect(prompt).toContain('Waste %');
});
```

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Add strategy-aware coaching to system prompt**

In `coScout.ts`, in the mode-aware section (around line 925), add after mode terminology coaching:

```typescript
import { getStrategy } from '@variscout/core/strategy';

// After existing mode coaching:
const strategy = getStrategy(options.analysisMode ?? 'standard');
const qs = strategy.questionStrategy;
sections.push(
  `For this analysis mode, the primary evidence metric is ${qs.evidenceLabel}. ` +
    `Questions are validated using ${qs.validationMethod}. ` +
    `Focus on: ${qs.questionFocus}`
);
```

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/ai/prompts/coScout.ts packages/core/src/ai/__tests__/promptTemplates.test.ts
git commit -m "feat(core): add validation method awareness to CoScout prompt (ADR-060 Pillar 5)"
```

---

## Phase 3: Knowledge Base Infrastructure (Pillar 3) — Outline

Infrastructure phase. Requires Azure AI Search deployment and Foundry IQ configuration.

### Task 14: Create KnowledgeAdapter Interface

**Files:**

- Create: `packages/core/src/ai/knowledgeAdapter.ts`
- Test: `packages/core/src/ai/__tests__/knowledgeAdapter.test.ts`

Interface definition with types: `KnowledgeAdapter`, `SearchOptions`, `SearchResult`, `DocumentEntry`, `ChunkWithMetadata`, `SourceType`. Pure types — no implementation yet.

### Task 15: Add Azure AI Search to ARM Template

**Files:**

- Modify: `infra/modules/search.bicep` (create)
- Modify: `infra/main.bicep`
- Modify: `infra/mainTemplate.json` (recompile)

Deploy Azure AI Search Basic (Team tier only) with semantic ranker enabled. Add `text-embedding-3-small` deployment to existing Azure OpenAI resource.

### Task 16: Implement Server.js KB Endpoints

**Files:**

- Modify: `apps/azure/server.js`
- Test: Manual endpoint testing

Add four endpoints: `/api/kb-upload` (POST), `/api/kb-search` (POST), `/api/kb-list` (GET), `/api/kb-delete` (DELETE). All endpoints compute `projectId` filter from EasyAuth bearer token.

### Task 17: Implement FoundryIQKnowledgeAdapter

**Files:**

- Create: `apps/azure/src/services/foundryIQAdapter.ts`
- Test: `apps/azure/src/services/__tests__/foundryIQAdapter.test.ts`

Implements `KnowledgeAdapter` interface using Foundry IQ REST API (`2025-11-01-preview`). Handles knowledge base creation, blob knowledge source connection, and `retrieve` queries.

### Task 18: Build Knowledge Tab UI

**Files:**

- Create: `packages/ui/src/components/KnowledgeTab/KnowledgeTabView.tsx`
- Create: `packages/ui/src/components/KnowledgeTab/DocumentRow.tsx`
- Create: `packages/ui/src/components/KnowledgeTab/DocumentPreview.tsx`
- Modify: `packages/ui/src/components/ProcessIntelligencePanel/` (add Knowledge to overflow)

Upload button, document list with metadata, preview/download/delete actions. Added to PI panel overflow menu alongside Data and What-If.

### Task 19: Rewire search_knowledge_base Tool

**Files:**

- Modify: `apps/azure/src/features/ai/readToolHandlers.ts:75-81`
- Modify: `packages/hooks/src/useKnowledgeSearch.ts`
- Modify: `apps/azure/src/services/searchService.ts`

Replace `suggest_knowledge_search` (Foundry IQ remote SharePoint) with `search_knowledge_base` (Foundry IQ unified index). Update `useKnowledgeSearch` to call new `/api/kb-search` endpoint.

---

## Phase 4: Investigation Retrieval (Pillar 2) — Outline

### Task 20: Blob Serialization for Investigation Artifacts

**Files:**

- Create: `apps/azure/src/services/investigationSerializer.ts`
- Test: `apps/azure/src/services/__tests__/investigationSerializer.test.ts`

Serialize findings, answered questions, ideas, conclusions to JSONL format. Debounced 5s, async, non-blocking. Uses existing `blobClient.ts` for Blob Storage writes.

### Task 21: Wire Serialization to Orchestration Hooks

**Files:**

- Modify: `apps/azure/src/features/findings/useFindingsOrchestration.ts`
- Modify: `apps/azure/src/features/investigation/useInvestigationOrchestration.ts`

Piggyback on `onFindingsChange` / `onQuestionsChange` callbacks to trigger Blob serialization alongside IndexedDB persistence.

---

## Phase 5: Upload Paths + Document Management — Outline

### Task 22: CoScout Panel File Attachment

**Files:**

- Modify: `packages/ui/src/components/CoScoutPanel/CoScoutPanelBase.tsx`
- Create: `packages/ui/src/components/CoScoutPanel/FileAttachButton.tsx`

Add drag/drop and attach button to CoScout input area. Files uploaded to Blob via `/api/kb-upload`, auto-indexed by Foundry IQ.

### Task 23: Finding Comment KB Wiring

**Files:**

- Modify: `apps/azure/src/features/findings/useFindingsOrchestration.ts`

When file attachments are added to finding comments, also upload to `documents/` folder in Blob for Foundry IQ indexing.

### Task 24: Document Preview and Download

**Files:**

- Modify: `packages/ui/src/components/KnowledgeTab/DocumentPreview.tsx`

Fetch original file from Blob Storage via SAS token. Render preview (PDF viewer, text display, spreadsheet table). Download button for original file.

---

## Phase 6: Documentation Updates — Outline

### Task 25: ADR Lifecycle Updates

**Files:**

- Create: `docs/07-decisions/adr-060-coscout-intelligence-architecture.md`
- Modify: `docs/07-decisions/adr-022-knowledge-layer-architecture.md` (status → Superseded)
- Modify: `docs/07-decisions/adr-026-knowledge-base-sharepoint-first.md` (status → Superseded)
- Modify: `docs/07-decisions/adr-049-coscout-context-and-memory.md` (add Extended note)
- Modify: `docs/07-decisions/index.md` (add ADR-060, update statuses)

### Task 26: Architecture Doc Updates

**Files:**

- Modify: `docs/05-technical/architecture/ai-architecture.md`
- Modify: `docs/05-technical/architecture/ai-journey-integration.md`
- Modify: `docs/05-technical/architecture/ai-context-engineering.md`
- Modify: `docs/03-features/workflows/knowledge-base-search.md` (full rewrite)

### Task 27: Product Doc Updates

**Files:**

- Modify: `docs/08-products/feature-parity.md`
- Modify: `docs/08-products/azure/blob-storage-sync.md`
- Modify: `docs/08-products/azure/arm-template.md`

### Task 28: Spec and Routing Updates

**Files:**

- Modify: `docs/superpowers/specs/index.md`
- Modify: `docs/superpowers/specs/2026-04-02-web-first-implementation-design.md`
- Modify: `docs/superpowers/specs/2026-03-19-knowledge-base-folder-search-design.md`
- Modify: `docs/superpowers/specs/2026-03-24-coscout-knowledge-catalyst-design.md`
- Modify: `CLAUDE.md`
- Modify: `docs/03-features/workflows/question-driven-investigation.md`

---

## Run All Tests

After each phase, verify:

```bash
pnpm test                    # All vitest tests
pnpm build                   # Full monorepo build
pnpm docs:check              # Documentation health
```
