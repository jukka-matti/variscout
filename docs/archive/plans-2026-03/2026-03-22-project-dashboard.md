---
title: 'Project Dashboard + CoScout Navigation Implementation Plan'
---

# Project Dashboard + CoScout Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent Project Dashboard view for saved projects with CoScout search/navigation tools, enabling users to orient themselves, track hypothesis progress, and ask "have we checked X?" questions.

**Architecture:** Three layers — (1) `searchProjectArtifacts()` pure function in `@variscout/core`, (2) Zustand store extensions for dashboard state and navigation targets, (3) Azure-only dashboard components with AI summary. CoScout gets two new tools: `search_project` (read, auto-execute) and `navigate_to` (hybrid: auto-execute for views, proposal for filter restoration).

**Tech Stack:** TypeScript, React, Zustand, Vitest, Azure OpenAI Responses API (gpt-5.4-nano for summary)

**Spec:** `docs/superpowers/specs/2026-03-22-project-dashboard-design.md`

---

## File Structure

### New files

| File                                                              | Responsibility                                                                                     |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `packages/core/src/ai/searchProject.ts`                           | `searchProjectArtifacts()` pure function — text search across findings, hypotheses, ideas, actions |
| `packages/core/src/ai/__tests__/searchProject.test.ts`            | Tests for search function                                                                          |
| `packages/core/src/ai/prompts/dashboardSummary.ts`                | `buildDashboardSummaryPrompt()` — prompt for AI summary card                                       |
| `packages/core/src/ai/prompts/__tests__/dashboardSummary.test.ts` | Tests for dashboard prompt                                                                         |
| `apps/azure/src/components/ProjectDashboard.tsx`                  | Full dashboard view component                                                                      |
| `apps/azure/src/components/ProjectStatusCard.tsx`                 | Status summary (findings, hypotheses, actions)                                                     |
| `apps/azure/src/components/DashboardSummaryCard.tsx`              | AI summary + "Ask CoScout..." input                                                                |
| `apps/azure/src/components/__tests__/ProjectDashboard.test.tsx`   | Dashboard component tests                                                                          |
| `docs/07-decisions/adr-042-project-dashboard.md`                  | ADR for the feature                                                                                |

### Modified files

| File                                                                     | Change                                                          |
| ------------------------------------------------------------------------ | --------------------------------------------------------------- |
| `packages/core/src/ai/actionTools.ts`                                    | Add tool type unions for `search_project` + `navigate_to`       |
| `packages/hooks/src/types.ts`                                            | Add `activeView` to `ViewState`                                 |
| `apps/azure/src/features/panels/panelsStore.ts`                          | Add `activeView` field + actions                                |
| `apps/azure/src/features/panels/__tests__/panelsStore.test.ts`           | Tests for new state                                             |
| `apps/azure/src/features/findings/findingsStore.ts`                      | Add `statusFilter` field + action                               |
| `apps/azure/src/features/investigation/investigationStore.ts`            | Add `expandedHypothesisId` + action                             |
| `apps/azure/src/features/ai/aiStore.ts`                                  | Add `pendingDashboardQuestion` field                            |
| `packages/core/src/ai/prompts/coScout.ts`                                | Add new tools to `buildCoScoutTools()`                          |
| `apps/azure/src/features/ai/useAIOrchestration.ts`                       | Wire search_project + navigate_to handlers                      |
| `apps/azure/src/components/Editor.tsx`                                   | Conditional render: Dashboard vs analysis                       |
| `packages/ui/src/components/InvestigationSidebar/HypothesisTreeView.tsx` | Read `expandedHypothesisId` from store, auto-scroll + highlight |

---

## Task 1: `searchProjectArtifacts()` — Pure Function

**Files:**

- Create: `packages/core/src/ai/searchProject.ts`
- Create: `packages/core/src/ai/__tests__/searchProject.test.ts`
- Modify: `packages/core/src/ai/index.ts` (add export)

- [ ] **Step 1: Write failing tests**

Create `packages/core/src/ai/__tests__/searchProject.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { searchProjectArtifacts } from '../searchProject';
import type { Finding, Hypothesis } from '../../findings';

// ── Helpers ──────────────────────────────────────────────────────

function makeFinding(overrides: Partial<Finding> & { id: string; text: string }): Finding {
  return {
    createdAt: Date.now(),
    status: 'observed',
    comments: [],
    statusChangedAt: Date.now(),
    context: { activeFilters: {}, cumulativeScope: null },
    ...overrides,
  } as Finding;
}

function makeHypothesis(overrides: Partial<Hypothesis> & { id: string; text: string }): Hypothesis {
  return {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'untested',
    linkedFindingIds: [],
    ...overrides,
  } as Hypothesis;
}

// ── Tests ────────────────────────────────────────────────────────

describe('searchProjectArtifacts', () => {
  const findings: Finding[] = [
    makeFinding({
      id: 'f1',
      text: 'Night Shift operators show higher spread',
      status: 'investigating',
      tag: 'key-driver',
    }),
    makeFinding({ id: 'f2', text: 'Machine A has drift', status: 'observed' }),
    makeFinding({ id: 'f3', text: 'Material batch 42 is off-spec', status: 'analyzed' }),
  ];

  const hypotheses: Hypothesis[] = [
    makeHypothesis({
      id: 'h1',
      text: 'Operator training causes variation',
      factor: 'Operator',
      status: 'supported',
    }),
    makeHypothesis({
      id: 'h2',
      text: 'Material supplier batch variation',
      factor: 'Supplier',
      status: 'contradicted',
    }),
    makeHypothesis({
      id: 'h3',
      text: 'Machine calibration drift',
      factor: 'Machine',
      status: 'untested',
    }),
  ];

  describe('text matching', () => {
    it('returns empty array when no match', () => {
      const results = searchProjectArtifacts({ query: 'nonexistent', findings, hypotheses });
      expect(results).toEqual([]);
    });

    it('matches finding text case-insensitively', () => {
      const results = searchProjectArtifacts({ query: 'night shift', findings, hypotheses });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('f1');
      expect(results[0].type).toBe('finding');
    });

    it('matches hypothesis text', () => {
      const results = searchProjectArtifacts({ query: 'material supplier', findings, hypotheses });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('h2');
      expect(results[0].type).toBe('hypothesis');
    });

    it('matches across findings and hypotheses', () => {
      const results = searchProjectArtifacts({ query: 'machine', findings, hypotheses });
      expect(results.length).toBeGreaterThanOrEqual(2);
    });

    it('caps results at 5', () => {
      const manyFindings = Array.from({ length: 20 }, (_, i) =>
        makeFinding({ id: `f${i}`, text: `Finding about topic ${i}` })
      );
      const results = searchProjectArtifacts({
        query: 'topic',
        findings: manyFindings,
        hypotheses: [],
      });
      expect(results).toHaveLength(5);
    });
  });

  describe('artifact_type filter', () => {
    it('filters to findings only', () => {
      const results = searchProjectArtifacts({
        query: 'machine',
        findings,
        hypotheses,
        artifactType: 'finding',
      });
      expect(results.every(r => r.type === 'finding')).toBe(true);
    });

    it('filters to hypotheses only', () => {
      const results = searchProjectArtifacts({
        query: 'machine',
        findings,
        hypotheses,
        artifactType: 'hypothesis',
      });
      expect(results.every(r => r.type === 'hypothesis')).toBe(true);
    });
  });

  describe('status filters', () => {
    it('filters findings by finding_status', () => {
      const results = searchProjectArtifacts({
        query: '',
        findings,
        hypotheses,
        findingStatus: 'investigating',
      });
      const findingResults = results.filter(r => r.type === 'finding');
      expect(findingResults.every(r => r.status === 'investigating')).toBe(true);
    });

    it('filters hypotheses by hypothesis_status', () => {
      const results = searchProjectArtifacts({
        query: '',
        findings,
        hypotheses,
        hypothesisStatus: 'supported',
      });
      const hypothesisResults = results.filter(r => r.type === 'hypothesis');
      expect(hypothesisResults.every(r => r.status === 'supported')).toBe(true);
    });

    it('finding_status does not exclude hypotheses when artifact_type is all', () => {
      const results = searchProjectArtifacts({
        query: 'machine',
        findings,
        hypotheses,
        findingStatus: 'investigating',
      });
      // Hypotheses should still be included (unfiltered)
      expect(results.some(r => r.type === 'hypothesis')).toBe(true);
    });
  });

  describe('result shape', () => {
    it('includes hypothesis-specific fields', () => {
      const results = searchProjectArtifacts({ query: 'operator training', findings, hypotheses });
      const h = results.find(r => r.id === 'h1');
      expect(h).toBeDefined();
      expect(h!.factor).toBe('Operator');
      expect(h!.status).toBe('supported');
    });

    it('includes finding-specific fields', () => {
      const results = searchProjectArtifacts({ query: 'night shift', findings, hypotheses });
      const f = results.find(r => r.id === 'f1');
      expect(f).toBeDefined();
      expect(f!.tag).toBe('key-driver');
      expect(f!.status).toBe('investigating');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/core test -- --run searchProject`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `searchProjectArtifacts()`**

Create `packages/core/src/ai/searchProject.ts`:

```typescript
import type { Finding, Hypothesis } from '../findings';

export interface SearchProjectOptions {
  query: string;
  findings: Finding[];
  hypotheses: Hypothesis[];
  artifactType?: 'finding' | 'hypothesis' | 'idea' | 'action' | 'all';
  findingStatus?: string;
  hypothesisStatus?: string;
}

export interface SearchResult {
  type: 'finding' | 'hypothesis' | 'idea' | 'action';
  id: string;
  text: string;
  status: string;
  etaSquared?: number;
  factor?: string;
  linkedFindingCount?: number;
  causeRole?: 'primary' | 'contributing';
  childCount?: number;
  tag?: 'key-driver' | 'low-impact';
  filterContext?: string;
  parentHypothesisText?: string;
  timeframe?: string;
  dueDate?: string;
  completed?: boolean;
  parentFindingText?: string;
}

const MAX_RESULTS = 5;

export function searchProjectArtifacts(options: SearchProjectOptions): SearchResult[] {
  const {
    query,
    findings,
    hypotheses,
    artifactType = 'all',
    findingStatus,
    hypothesisStatus,
  } = options;

  const q = query.toLowerCase();
  const results: SearchResult[] = [];

  // Search findings
  if (artifactType === 'all' || artifactType === 'finding') {
    for (const f of findings) {
      if (findingStatus && findingStatus !== 'any' && f.status !== findingStatus) continue;
      if (q && !f.text.toLowerCase().includes(q)) continue;
      results.push({
        type: 'finding',
        id: f.id,
        text: f.text,
        status: f.status,
        tag: f.tag,
        filterContext: formatFilterContext(f.context?.activeFilters),
      });
    }
  // Search hypotheses
  if (artifactType === 'all' || artifactType === 'hypothesis') {
    for (const h of hypotheses) {
      if (hypothesisStatus && hypothesisStatus !== 'any' && h.status !== hypothesisStatus) continue;
      if (q && !h.text.toLowerCase().includes(q)) continue;
      results.push({
        type: 'hypothesis',
        id: h.id,
        text: h.text,
        status: h.status,
        factor: h.factor,
        linkedFindingCount: h.linkedFindingIds?.length ?? 0,
        causeRole: h.causeRole,
        childCount: 0, // Caller can compute from tree
      });
    }
  }

  // Search improvement ideas (nested in hypotheses)
  if (artifactType === 'all' || artifactType === 'idea') {
    for (const h of hypotheses) {
      for (const idea of h.ideas ?? []) {
        if (q && !idea.text.toLowerCase().includes(q)) continue;
        results.push({
          type: 'idea',
          id: idea.id,
          text: idea.text,
          status: idea.selected ? 'selected' : 'proposed',
          parentHypothesisText: h.text,
          timeframe: idea.timeframe,
        });
      }
    }
  }

  // Search actions (nested in findings)
  if (artifactType === 'all' || artifactType === 'action') {
    for (const f of findings) {
      for (const action of f.actions ?? []) {
        if (q && !action.text.toLowerCase().includes(q)) continue;
        results.push({
          type: 'action',
          id: action.id,
          text: action.text,
          status: action.completedAt ? 'completed' : 'pending',
          completed: !!action.completedAt,
          dueDate: action.dueDate,
          parentFindingText: f.text,
        });
      }
    }
  }

  // Sort: exact match > starts-with > contains, then by recency (newest first)
  results.sort((a, b) => {
    if (!q) return 0;
    const aLower = a.text.toLowerCase();
    const bLower = b.text.toLowerCase();
    const aExact = aLower === q;
    const bExact = bLower === q;
    if (aExact !== bExact) return aExact ? -1 : 1;
    const aStarts = aLower.startsWith(q);
    const bStarts = bLower.startsWith(q);
    if (aStarts !== bStarts) return aStarts ? -1 : 1;
    return 0;
  });

  return results.slice(0, MAX_RESULTS);
}

function formatFilterContext(filters?: Record<string, (string | number)[]>): string | undefined {
  if (!filters) return undefined;
  const parts = Object.entries(filters)
    .filter(([, values]) => values.length > 0)
    .map(([factor, values]) => `${factor} → ${values.join(', ')}`);
  return parts.length > 0 ? parts.join(', ') : undefined;
}
```

- [ ] **Step 4: Export from barrel**

Add to `packages/core/src/ai/index.ts`:

```typescript
export { searchProjectArtifacts } from './searchProject';
export type { SearchProjectOptions, SearchResult } from './searchProject';
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter @variscout/core test -- --run searchProject`
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/ai/searchProject.ts packages/core/src/ai/__tests__/searchProject.test.ts packages/core/src/ai/index.ts
git commit -m "feat(core): add searchProjectArtifacts() for CoScout project search"
```

---

## Task 2: Tool Type Definitions in actionTools.ts

**Files:**

- Modify: `packages/core/src/ai/actionTools.ts` (lines 20-38)

- [ ] **Step 1: Add `search_project` and `navigate_to` to type unions**

In `packages/core/src/ai/actionTools.ts`, update the type unions:

```typescript
// After line 30 (end of ActionToolName), add navigate_to:
export type ActionToolName =
  | 'apply_filter'
  | 'clear_filters'
  | 'switch_factor'
  | 'create_hypothesis'
  | 'create_finding'
  | 'suggest_action'
  | 'suggest_improvement_idea'
  | 'share_finding'
  | 'publish_report'
  | 'notify_action_owners'
  | 'navigate_to'; // NEW: hybrid — auto-execute for views, proposal for filter restoration

// After line 38 (end of ReadToolName), add search_project:
export type ReadToolName =
  | 'get_chart_data'
  | 'get_statistical_summary'
  | 'suggest_knowledge_search'
  | 'get_available_factors'
  | 'compare_categories'
  | 'search_project'; // NEW: search findings, hypotheses, ideas, actions
```

- [ ] **Step 2: Run existing tests to verify no regressions**

Run: `pnpm --filter @variscout/core test -- --run actionTools`
Expected: All existing tests PASS

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/ai/actionTools.ts
git commit -m "feat(core): add search_project and navigate_to tool type definitions"
```

---

## Task 3: Add `activeView` to ViewState + panelsStore

**Files:**

- Modify: `packages/hooks/src/types.ts` (ViewState interface, line 158)
- Modify: `apps/azure/src/features/panels/panelsStore.ts`
- Modify: `apps/azure/src/features/panels/__tests__/panelsStore.test.ts`

- [ ] **Step 1: Add `activeView` to ViewState in types.ts**

In `packages/hooks/src/types.ts`, find the `ViewState` interface (line 158) and add:

```typescript
interface ViewState {
  activeView?: 'dashboard' | 'editor'; // NEW
  activeTab?: 'analysis' | 'performance' | 'yamazumi';
  // ... rest unchanged
}
```

- [ ] **Step 2: Write failing tests for panelsStore dashboard state**

Add to `apps/azure/src/features/panels/__tests__/panelsStore.test.ts`:

```typescript
describe('activeView (dashboard/editor)', () => {
  it('defaults to editor', () => {
    expect(usePanelsStore.getState().activeView).toBe('editor');
  });

  it('showDashboard sets activeView to dashboard', () => {
    usePanelsStore.getState().showDashboard();
    expect(usePanelsStore.getState().activeView).toBe('dashboard');
  });

  it('showEditor sets activeView to editor', () => {
    usePanelsStore.getState().showDashboard();
    usePanelsStore.getState().showEditor();
    expect(usePanelsStore.getState().activeView).toBe('editor');
  });

  it('showDashboard closes report and presentation', () => {
    usePanelsStore.setState({ isReportOpen: true, isPresentationMode: true });
    usePanelsStore.getState().showDashboard();
    const s = usePanelsStore.getState();
    expect(s.activeView).toBe('dashboard');
    expect(s.isReportOpen).toBe(false);
    expect(s.isPresentationMode).toBe(false);
  });

  it('initFromViewState restores activeView', () => {
    usePanelsStore.getState().initFromViewState({ activeView: 'dashboard' });
    expect(usePanelsStore.getState().activeView).toBe('dashboard');
  });

  it('initFromViewState defaults to editor when activeView missing', () => {
    usePanelsStore.getState().initFromViewState({});
    expect(usePanelsStore.getState().activeView).toBe('editor');
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm --filter @variscout/azure-app test -- --run panelsStore`
Expected: FAIL — `showDashboard` not defined

- [ ] **Step 4: Implement panelsStore changes**

In `apps/azure/src/features/panels/panelsStore.ts`:

Add to `PanelsState` interface:

```typescript
activeView: 'dashboard' | 'editor';
```

Add to `PanelsActions` interface:

```typescript
showDashboard: () => void;
showEditor: () => void;
```

Add to initial state:

```typescript
activeView: 'editor',
```

Add action implementations:

```typescript
showDashboard: () =>
  set(() => ({
    activeView: 'dashboard',
    isReportOpen: false,
    isPresentationMode: false,
  })),
showEditor: () =>
  set(() => ({
    activeView: 'editor',
  })),
```

Update `initFromViewState` to include:

```typescript
activeView: viewState?.activeView ?? 'editor',
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter @variscout/azure-app test -- --run panelsStore`
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add packages/hooks/src/types.ts apps/azure/src/features/panels/panelsStore.ts apps/azure/src/features/panels/__tests__/panelsStore.test.ts
git commit -m "feat(azure): add activeView to panelsStore for dashboard/editor toggle"
```

---

## Task 4: Store Extensions — findingsStore, investigationStore, aiStore

**Files:**

- Modify: `apps/azure/src/features/findings/findingsStore.ts`
- Modify: `apps/azure/src/features/investigation/investigationStore.ts`
- Modify: `apps/azure/src/features/ai/aiStore.ts`

- [ ] **Step 1: Add `statusFilter` to findingsStore**

In `findingsStore.ts`, add to state interface:

```typescript
statusFilter: string | null;
```

Add to actions interface:

```typescript
setStatusFilter: (status: string | null) => void;
```

Add to initial state:

```typescript
statusFilter: null,
```

Add action:

```typescript
setStatusFilter: (status) => set({ statusFilter: status }),
```

- [ ] **Step 2: Add `expandedHypothesisId` to investigationStore**

In `investigationStore.ts`, add to state interface:

```typescript
expandedHypothesisId: string | null;
```

Add to actions interface:

```typescript
expandToHypothesis: (id: string | null) => void;
```

Add to initial state:

```typescript
expandedHypothesisId: null,
```

Add action:

```typescript
expandToHypothesis: (id) => set({ expandedHypothesisId: id }),
```

- [ ] **Step 3: Add `pendingDashboardQuestion` to aiStore**

In `aiStore.ts`, add to state interface:

```typescript
pendingDashboardQuestion: string | null;
```

Add to actions interface:

```typescript
setPendingDashboardQuestion: (question: string | null) => void;
```

Add to initial state:

```typescript
pendingDashboardQuestion: null,
```

Add action:

```typescript
setPendingDashboardQuestion: (question) => set({ pendingDashboardQuestion: question }),
```

- [ ] **Step 4: Run all store tests**

Run: `pnpm --filter @variscout/azure-app test -- --run`
Expected: All PASS (no regressions)

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/features/findings/findingsStore.ts apps/azure/src/features/investigation/investigationStore.ts apps/azure/src/features/ai/aiStore.ts
git commit -m "feat(azure): add dashboard navigation fields to feature stores"
```

---

## Task 5: `buildDashboardSummaryPrompt()` — Prompt Builder

**Files:**

- Create: `packages/core/src/ai/prompts/dashboardSummary.ts`
- Create: `packages/core/src/ai/prompts/__tests__/dashboardSummary.test.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/core/src/ai/prompts/__tests__/dashboardSummary.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { buildDashboardSummaryPrompt } from '../dashboardSummary';
import type { AIContext } from '../../types';

function makeContext(overrides?: Partial<AIContext>): AIContext {
  return {
    process: { description: 'Coffee machine fill weight' },
    stats: { mean: 10.5, stdDev: 0.3, samples: 500, cpk: 1.2, cp: 1.4, passRate: 98 },
    filters: [],
    violations: {},
    findings: { total: 0, byStatus: {}, keyDrivers: [] },
    investigation: { phase: 'initial', allHypotheses: [], hypothesisTree: [] },
    ...overrides,
  } as AIContext;
}

describe('buildDashboardSummaryPrompt', () => {
  it('includes stats summary', () => {
    const prompt = buildDashboardSummaryPrompt(makeContext());
    expect(prompt).toContain('500');
    expect(prompt).toContain('Cpk');
  });

  it('includes findings count when present', () => {
    const prompt = buildDashboardSummaryPrompt(
      makeContext({
        findings: {
          total: 7,
          byStatus: { investigating: 3, observed: 2, analyzed: 1, improving: 1 },
          keyDrivers: ['f1'],
        },
      })
    );
    expect(prompt).toContain('7');
    expect(prompt).toContain('finding');
  });

  it('includes hypothesis summary when present', () => {
    const prompt = buildDashboardSummaryPrompt(
      makeContext({
        investigation: {
          phase: 'validating',
          allHypotheses: [
            { text: 'Operator', status: 'supported' },
            { text: 'Material', status: 'contradicted' },
          ],
          hypothesisTree: [],
        },
      } as Partial<AIContext>)
    );
    expect(prompt).toContain('supported');
    expect(prompt).toContain('Operator');
  });

  it('includes instruction for 1-3 sentence summary', () => {
    const prompt = buildDashboardSummaryPrompt(makeContext());
    expect(prompt).toContain('1-3 sentence');
  });

  it('handles empty project gracefully', () => {
    const prompt = buildDashboardSummaryPrompt(
      makeContext({
        findings: { total: 0, byStatus: {}, keyDrivers: [] },
        investigation: { phase: 'initial', allHypotheses: [], hypothesisTree: [] },
      })
    );
    expect(prompt).toBeTruthy();
    expect(prompt.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/core test -- --run dashboardSummary`
Expected: FAIL — module not found

- [ ] **Step 3: Implement prompt builder**

Create `packages/core/src/ai/prompts/dashboardSummary.ts`:

```typescript
import type { AIContext } from '../types';

/**
 * Build the user prompt for the dashboard AI summary card.
 * Uses existing AIContext — no new context collection needed.
 * Fast tier (gpt-5.4-nano, reasoning: none).
 */
export function buildDashboardSummaryPrompt(context: AIContext): string {
  const parts: string[] = [];

  parts.push('Generate a 1-3 sentence project status summary for a returning analyst.');
  parts.push('Be concise and actionable. Highlight what matters most right now.');
  parts.push('');

  // Stats
  if (context.stats) {
    const { samples, cpk, mean } = context.stats;
    const cpkStr = cpk != null ? `, Cpk=${cpk.toFixed(2)}` : '';
    parts.push(`Current analysis: ${samples} samples, mean=${mean.toFixed(2)}${cpkStr}`);
  }

  // Findings
  if (context.findings && context.findings.total > 0) {
    const { total, byStatus, keyDrivers } = context.findings;
    const statusParts: string[] = [];
    for (const [status, count] of Object.entries(byStatus)) {
      if (count > 0) statusParts.push(`${count} ${status}`);
    }
    parts.push(
      `Findings: ${total} total (${statusParts.join(', ')}). ${keyDrivers?.length ?? 0} key drivers identified.`
    );
  }

  // Hypotheses
  if (context.investigation?.allHypotheses?.length > 0) {
    const hyps = context.investigation.allHypotheses;
    const supported = hyps.filter(h => h.status === 'supported');
    const untested = hyps.filter(h => h.status === 'untested');
    const contradicted = hyps.filter(h => h.status === 'contradicted');

    let hypSummary = `Hypotheses: ${hyps.length} total`;
    if (supported.length > 0)
      hypSummary += `, ${supported.length} supported (${supported.map(h => h.text).join(', ')})`;
    if (untested.length > 0) hypSummary += `, ${untested.length} untested`;
    if (contradicted.length > 0) hypSummary += `, ${contradicted.length} contradicted`;
    parts.push(hypSummary);
  }

  // Investigation phase
  if (context.investigation?.phase) {
    parts.push(`Investigation phase: ${context.investigation.phase}`);
  }

  // Actions
  const actionFindings = context.findings?.keyDrivers ?? [];
  if (actionFindings.length > 0) {
    parts.push(
      'Focus: Highlight overdue actions, stalled investigations, or suggested next steps.'
    );
  } else {
    parts.push('Focus: Suggest what the analyst should examine next based on the data.');
  }

  return parts.join('\n');
}
```

- [ ] **Step 4: Export from prompts barrel**

Add to `packages/core/src/ai/prompts/index.ts` (or wherever prompts are exported):

```typescript
export { buildDashboardSummaryPrompt } from './dashboardSummary';
```

- [ ] **Step 5: Run tests**

Run: `pnpm --filter @variscout/core test -- --run dashboardSummary`
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/ai/prompts/dashboardSummary.ts packages/core/src/ai/prompts/__tests__/dashboardSummary.test.ts
git commit -m "feat(core): add buildDashboardSummaryPrompt() for project dashboard AI summary"
```

---

## Task 6: Add Tools to CoScout System Prompt

**Files:**

- Modify: `packages/core/src/ai/prompts/coScout.ts` (in `buildCoScoutTools()`)

- [ ] **Step 1: Add `search_project` and `navigate_to` tool definitions**

In `packages/core/src/ai/prompts/coScout.ts`, find `buildCoScoutTools()` function. Add new tools in the SCOUT+ section (after the existing `compare_categories` tool, around line 184):

```typescript
// search_project — read tool, available SCOUT+
// Note: strict mode requires ALL properties in `required`. Model sends 'all'/'any' for unused fields.
{
  type: 'function' as const,
  name: 'search_project',
  description: 'Search findings, hypotheses, improvement ideas, and actions in the current project by text and optional filters. Use when the user asks about past analysis, whether something was investigated, or what was found.',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search text (matched against text content of findings, hypotheses, ideas, actions, and comments)' },
      artifact_type: { type: 'string', enum: ['finding', 'hypothesis', 'idea', 'action', 'all'], description: 'Type of artifact to search. Use "all" for all types.' },
      finding_status: { type: 'string', enum: ['observed', 'investigating', 'analyzed', 'improving', 'resolved', 'any'], description: 'Filter findings by status. Use "any" for no filter. Only applies to findings.' },
      hypothesis_status: { type: 'string', enum: ['untested', 'supported', 'contradicted', 'partial', 'any'], description: 'Filter hypotheses by validation status. Use "any" for no filter. Only applies to hypotheses.' },
    },
    required: ['query', 'artifact_type', 'finding_status', 'hypothesis_status'],
    additionalProperties: false,
  },
  strict: true,
},

// navigate_to — hybrid tool, available SCOUT+
// Note: strict mode requires ALL properties in `required`. Model sends empty string/false for unused fields.
// Handler treats empty target_id/chart_type/factor as undefined.
{
  type: 'function' as const,
  name: 'navigate_to',
  description: 'Navigate to a specific finding, hypothesis, chart view, or workspace. Auto-executes for panel navigation. When restore_filters is true, shows a proposal card for user confirmation.',
  parameters: {
    type: 'object',
    properties: {
      target: { type: 'string', enum: ['finding', 'hypothesis', 'chart', 'improvement_workspace', 'report', 'dashboard'], description: 'What to navigate to' },
      target_id: { type: 'string', description: 'ID of the finding or hypothesis. Empty string if not applicable.' },
      chart_type: { type: 'string', enum: ['ichart', 'boxplot', 'pareto', 'capability', 'stats', 'none'], description: 'Which chart to focus. Use "none" if not applicable.' },
      restore_filters: { type: 'boolean', description: 'Restore the filter context from when the finding was created. When true, requires user confirmation.' },
      factor: { type: 'string', description: 'Factor context to restore. Empty string if not applicable.' },
    },
    required: ['target', 'target_id', 'chart_type', 'restore_filters', 'factor'],
    additionalProperties: false,
  },
  strict: true,
},
```

- [ ] **Step 2: Run existing prompt tests**

Run: `pnpm --filter @variscout/core test -- --run coScout`
Expected: All PASS (existing tests should not break)

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/ai/prompts/coScout.ts
git commit -m "feat(core): add search_project and navigate_to to CoScout tool definitions"
```

---

## Task 7: Wire Tool Handlers in useAIOrchestration

**Files:**

- Modify: `apps/azure/src/features/ai/useAIOrchestration.ts`

- [ ] **Step 1: Import searchProjectArtifacts and add handlers**

In `useAIOrchestration.ts`, import the search function and add handlers for both new tools in the tool handler setup section (around line 258):

```typescript
import { searchProjectArtifacts } from '@variscout/core';

// In the tool handlers object:
search_project: async (args: Record<string, unknown>) => {
  const results = searchProjectArtifacts({
    query: (args.query as string) ?? '',
    findings,
    hypotheses,
    artifactType: (args.artifact_type as string) ?? 'all',
    findingStatus: (args.finding_status as string) ?? 'any',
    hypothesisStatus: (args.hypothesis_status as string) ?? 'any',
  });
  return JSON.stringify({ results });
},

navigate_to: async (args: Record<string, unknown>) => {
  const target = args.target as string;
  const targetId = args.target_id as string | undefined;
  const restoreFilters = args.restore_filters as boolean ?? false;

  if (restoreFilters) {
    // Return as proposal — will be rendered as ActionProposalCard
    return JSON.stringify({
      proposal: true,
      target,
      targetId,
      restoreFilters: true,
      factor: args.factor,
    });
  }

  // Auto-execute navigation
  const { usePanelsStore } = await import('../panels/panelsStore');
  const panels = usePanelsStore.getState();

  switch (target) {
    case 'dashboard':
      panels.showDashboard();
      return JSON.stringify({ navigated: 'dashboard' });
    case 'finding':
      panels.showEditor();
      panels.setFindingsOpen(true);
      if (targetId) {
        const { useFindingsStore } = await import('../findings/findingsStore');
        useFindingsStore.getState().setHighlightedFindingId(targetId);
      }
      return JSON.stringify({ navigated: 'finding', id: targetId });
    case 'hypothesis':
      panels.showEditor();
      panels.setFindingsOpen(true); // Investigation sidebar is part of findings
      if (targetId) {
        const { useInvestigationStore } = await import('../investigation/investigationStore');
        useInvestigationStore.getState().expandToHypothesis(targetId);
      }
      return JSON.stringify({ navigated: 'hypothesis', id: targetId });
    case 'chart':
      panels.showEditor();
      // Note: focusedChart state lives in ViewState/DataContext, not panelsStore
      // The Editor component will need to handle this via a callback
      return JSON.stringify({ navigated: 'chart', type: args.chart_type });
    case 'improvement_workspace':
      panels.showEditor();
      panels.setImprovementOpen(true);
      return JSON.stringify({ navigated: 'improvement_workspace' });
    case 'report':
      panels.showEditor();
      panels.openReport();
      return JSON.stringify({ navigated: 'report' });
    default:
      return JSON.stringify({ error: `Unknown target: ${target}` });
  }
},
```

- [ ] **Step 2: Run tests**

Run: `pnpm --filter @variscout/azure-app test -- --run`
Expected: All PASS

- [ ] **Step 3: Commit**

```bash
git add apps/azure/src/features/ai/useAIOrchestration.ts
git commit -m "feat(azure): wire search_project and navigate_to tool handlers"
```

---

## Task 8: ProjectDashboard Components

**Files:**

- Create: `apps/azure/src/components/ProjectStatusCard.tsx`
- Create: `apps/azure/src/components/DashboardSummaryCard.tsx`
- Create: `apps/azure/src/components/ProjectDashboard.tsx`

- [ ] **Step 1: Create ProjectStatusCard**

Create `apps/azure/src/components/ProjectStatusCard.tsx` — renders findings by status, hypothesis tree summary, action progress. All clickable. Read the spec for full layout details. Uses DataContext for findings/hypotheses, `detectInvestigationPhase()` for journey phase.

Key props: `onNavigate: (target: string, targetId?: string) => void`

- [ ] **Step 2: Create DashboardSummaryCard**

Create `apps/azure/src/components/DashboardSummaryCard.tsx` — AI summary + "Ask CoScout..." input. Uses `fetchNarration()` with `buildDashboardSummaryPrompt()`. Shows loading shimmer, hides when AI unavailable.

Key props: `onAskCoScout: (question: string) => void`, `isAIAvailable: boolean`

- [ ] **Step 3: Create ProjectDashboard**

Create `apps/azure/src/components/ProjectDashboard.tsx` — composes `ProjectStatusCard` + `DashboardSummaryCard` + Quick Actions. Handles navigation callbacks that set store state and call `panelsStore.showEditor()`.

Layout: Two-column on desktop (`lg:flex-row`), single-column on mobile.

- [ ] **Step 4: Write component tests**

Create `apps/azure/src/components/__tests__/ProjectDashboard.test.tsx`:

- Test renders with mock findings/hypotheses
- Test status counts display correctly
- Test click on hypothesis calls onNavigate
- Test "Ask CoScout..." input stores question
- Test quick actions render based on project state

- [ ] **Step 5: Run tests**

Run: `pnpm --filter @variscout/azure-app test -- --run ProjectDashboard`
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add apps/azure/src/components/ProjectStatusCard.tsx apps/azure/src/components/DashboardSummaryCard.tsx apps/azure/src/components/ProjectDashboard.tsx apps/azure/src/components/__tests__/ProjectDashboard.test.tsx
git commit -m "feat(azure): add ProjectDashboard, ProjectStatusCard, DashboardSummaryCard components"
```

---

## Task 9: Editor.tsx — Dashboard/Editor Toggle

**Files:**

- Modify: `apps/azure/src/components/Editor.tsx`

- [ ] **Step 1: Import and wire ProjectDashboard**

In `Editor.tsx`:

1. Import `ProjectDashboard`
2. Add `activeView` selector from panelsStore
3. Add navigation handler that sets store state and switches to editor
4. Conditionally render: `activeView === 'dashboard'` → `<ProjectDashboard />`, else existing Editor content
5. Set `activeView` to `'dashboard'` on project load (when project has data and no deep link)
6. Add tab bar for Overview/Edit switching

- [ ] **Step 2: Handle deep link bypass**

When `initialFindingId` or `initialChart` props are provided, skip dashboard — set `activeView` to `'editor'` immediately.

- [ ] **Step 3: Handle pending CoScout question**

When switching from dashboard to editor with a pending question, check `aiStore.pendingDashboardQuestion`. If set, open CoScout panel and auto-send the question.

- [ ] **Step 4: Run full test suite**

Run: `pnpm test`
Expected: All tests PASS across all packages

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/components/Editor.tsx
git commit -m "feat(azure): add dashboard/editor view toggle in Editor"
```

---

## Task 10: Documentation

**Files:**

- Create: `docs/07-decisions/adr-042-project-dashboard.md`
- Create: `docs/03-features/workflows/project-dashboard.md`
- Create: `docs/02-journeys/flows/project-reopen.md`
- Modify: `docs/07-decisions/index.md`
- Modify: `docs/05-technical/architecture/ai-architecture.md`
- Modify: `docs/02-journeys/traceability.md`
- Modify: `CLAUDE.md`
- Modify: `.claude/rules/monorepo.md`

- [ ] **Step 1: Write ADR-042**

Create `docs/07-decisions/adr-042-project-dashboard.md` with:

- Status: Accepted
- Context: Users lack orientation when reopening projects
- Decision: Persistent Project Dashboard, two new CoScout tools, hybrid navigate_to
- Consequences: New view, 13→15 tools, activeView in ViewState

- [ ] **Step 2: Add to ADR index**

Add entry to `docs/07-decisions/index.md`

- [ ] **Step 3: Write feature doc**

Create `docs/03-features/workflows/project-dashboard.md` covering the dashboard layout, navigation model, CoScout search, persona mapping.

- [ ] **Step 4: Write user flow doc**

Create `docs/02-journeys/flows/project-reopen.md` expanding Flow 5: Return Visitor.

- [ ] **Step 5: Update architecture docs**

Update `docs/05-technical/architecture/ai-architecture.md`:

- Add `search_project` + `navigate_to` to tool table
- Update hook composition diagram

- [ ] **Step 6: Update CLAUDE.md and monorepo rules**

- Add Project Dashboard to task-to-documentation table in CLAUDE.md
- Add new components to `.claude/rules/monorepo.md`

- [ ] **Step 7: Commit all docs**

```bash
git add docs/ CLAUDE.md .claude/rules/monorepo.md
git commit -m "docs: add ADR-042 Project Dashboard, feature docs, journey flow, architecture updates"
```

---

## Task 11: Final Verification

- [ ] **Step 1: Run full test suite**

```bash
pnpm test
```

Expected: All ~3,572+ tests PASS

- [ ] **Step 2: Build all packages**

```bash
pnpm build
```

Expected: Clean build, no TypeScript errors

- [ ] **Step 3: Manual verification**

Start dev server: `pnpm --filter @variscout/azure-app dev`

1. Open a saved project → dashboard appears
2. Verify status counts match actual findings/hypotheses
3. Click a hypothesis → editor opens with investigation sidebar
4. Click "Overview" tab → returns to dashboard
5. Type in "Ask CoScout..." → switches to editor with CoScout open
6. In CoScout, ask "have we checked the material?" → search_project fires
7. Verify deep link (add `?findingId=xxx`) bypasses dashboard
8. Test mobile viewport — single column layout

- [ ] **Step 4: Commit any fixes from manual testing**
