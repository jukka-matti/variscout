---
title: 'CoScout Cognitive Redesign — Phase 1: Foundation'
---

# CoScout Cognitive Redesign — Phase 1: Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the monolithic `coScout.ts` (1,691 lines) with a modular `coScout/` directory, typed tool registry, and prompt tier types — the structural foundation for all subsequent CoScout improvements.

**Architecture:** Decompose `coScout.ts` into ~20 focused files organized by responsibility (role, tools, phases, modes, context formatters, surfaces). Create a typed tool registry that ensures compile-time handler completeness. Enforce the 3-tier prompt caching architecture in code via `CoScoutPromptTiers` type.

**Tech Stack:** TypeScript, Vitest, `@variscout/core/ai` sub-path

**Design Spec:** `docs/superpowers/specs/2026-04-05-coscout-cognitive-redesign-design.md`

---

### Task 1: Create coScout/ directory scaffold with assembler

**Files:**

- Create: `packages/core/src/ai/prompts/coScout/index.ts`
- Create: `packages/core/src/ai/prompts/coScout/types.ts`
- Modify: `packages/core/src/ai/prompts/index.ts` (update re-exports)
- Test: `packages/core/src/ai/__tests__/coScoutAssembler.test.ts`

This task creates the directory structure and the assembler function that will replace the monolithic `buildCoScoutSystemPrompt`. The assembler initially delegates to the OLD function — a strangler fig pattern so everything keeps working during migration.

- [ ] **Step 1: Create types file**

```typescript
// packages/core/src/ai/prompts/coScout/types.ts
import type { ToolDefinition } from '../../responsesApi';
import type { AnalysisMode, InvestigationPhase, JourneyPhase } from '../../types';
import type { AIContext } from '../../types';

/** Interaction surface determines token budget, tool availability, and context depth */
export type CoScoutSurface =
  | 'fullPanel'
  | 'quickAsk'
  | 'contextClick'
  | 'chartInsight'
  | 'inlineCoScout'
  | 'narration';

/** Enforced prompt tier separation — each tier has different caching behavior */
export interface CoScoutPromptTiers {
  /** Role + glossary + principles + security — CACHED (>1024 tokens, stable across session) */
  tier1Static: string;
  /** Phase coaching + mode workflow + investigation state — SEMI-CACHED (stable across turns) */
  tier2SemiStatic: string;
  /** Current stats + active chart + drill scope + history — NOT CACHED (changes every turn) */
  tier3Dynamic: string;
  /** Available tools for current phase × mode */
  tools: ToolDefinition[];
}

/** Options for prompt assembly */
export interface AssembleCoScoutPromptOptions {
  phase: JourneyPhase;
  investigationPhase?: InvestigationPhase;
  mode: AnalysisMode;
  surface: CoScoutSurface;
  context: AIContext;
  isTeamPlan?: boolean;
}
```

- [ ] **Step 2: Create assembler with delegation to old function**

```typescript
// packages/core/src/ai/prompts/coScout/index.ts
export type { CoScoutSurface, CoScoutPromptTiers, AssembleCoScoutPromptOptions } from './types';

// Re-export everything from the old monolith during migration
// These will be removed one by one as modules are extracted
export {
  buildCoScoutSystemPrompt,
  buildCoScoutMessages,
  buildCoScoutInput,
  buildCoScoutTools,
  formatKnowledgeContext,
} from './legacy';
export type { BuildCoScoutSystemPromptOptions, BuildCoScoutToolsOptions } from './legacy';

// New assembler — initially wraps old functions
import type { AssembleCoScoutPromptOptions, CoScoutPromptTiers } from './types';
import { buildCoScoutSystemPrompt } from './legacy';
import { buildCoScoutTools } from './legacy';

export function assembleCoScoutPrompt(options: AssembleCoScoutPromptOptions): CoScoutPromptTiers {
  // Phase 1: delegate to legacy builders
  // Phase 2 will replace with modular assembly
  const systemPrompt = buildCoScoutSystemPrompt({
    investigation: options.context.investigation,
    teamContributors: options.context.teamContributors,
    sampleCount: options.context.stats?.n,
    stagedComparison: options.context.stagedComparison,
    phase: options.phase,
    hasActionTools: options.phase !== 'frame',
    analysisMode: options.mode,
    findings: options.context.findings,
    capabilityStability: options.context.capabilityStability,
    coscoutInsights: options.context.findings?.coscoutInsights,
  });

  const tools = buildCoScoutTools({
    phase: options.phase,
    investigationPhase: options.investigationPhase,
    isTeamPlan: options.isTeamPlan,
    existingHubs: options.context.investigation?.suspectedCauseHubs as any,
  });

  return {
    tier1Static: systemPrompt, // Will be split in Task 3
    tier2SemiStatic: '', // Will be populated in Phase 2
    tier3Dynamic: '', // Will be populated in Phase 2
    tools,
  };
}
```

- [ ] **Step 3: Rename old coScout.ts to legacy.ts**

```bash
cd packages/core/src/ai/prompts
mv coScout.ts coScout/legacy.ts
```

Update internal imports in `legacy.ts` — change any relative imports (e.g., `'./shared'` → `'../shared'`, `'../../types'` → `'../../../types'`).

- [ ] **Step 4: Update prompts/index.ts to import from new location**

```typescript
// packages/core/src/ai/prompts/index.ts
// Change:
//   export { ... } from './coScout';
//   export type { ... } from './coScout';
// To:
export {
  buildCoScoutSystemPrompt,
  buildCoScoutMessages,
  buildCoScoutInput,
  buildCoScoutTools,
  formatKnowledgeContext,
  assembleCoScoutPrompt,
} from './coScout';
export type {
  BuildCoScoutSystemPromptOptions,
  BuildCoScoutToolsOptions,
  CoScoutSurface,
  CoScoutPromptTiers,
  AssembleCoScoutPromptOptions,
} from './coScout';

// Keep other exports unchanged
export { buildLocaleHint, TERMINOLOGY_INSTRUCTION } from './shared';
export { buildNarrationSystemPrompt, buildSummaryPrompt } from './narration';
export type { ChartInsightData } from './chartInsights';
export { buildChartInsightSystemPrompt, buildChartInsightPrompt } from './chartInsights';
export { buildReportSystemPrompt, buildReportPrompt } from './reports';
export { buildDashboardSummaryPrompt } from './dashboardSummary';
```

- [ ] **Step 5: Write test for assembler**

```typescript
// packages/core/src/ai/__tests__/coScoutAssembler.test.ts
import { describe, it, expect } from 'vitest';
import { assembleCoScoutPrompt } from '../prompts/coScout';
import type { AIContext } from '../types';

const MINIMAL_CONTEXT: AIContext = {
  stats: null,
  filters: {},
  variationContributions: [],
  drillPath: [],
};

describe('assembleCoScoutPrompt', () => {
  it('returns all four tier fields', () => {
    const result = assembleCoScoutPrompt({
      phase: 'frame',
      mode: 'standard',
      surface: 'fullPanel',
      context: MINIMAL_CONTEXT,
    });
    expect(result).toHaveProperty('tier1Static');
    expect(result).toHaveProperty('tier2SemiStatic');
    expect(result).toHaveProperty('tier3Dynamic');
    expect(result).toHaveProperty('tools');
    expect(typeof result.tier1Static).toBe('string');
    expect(Array.isArray(result.tools)).toBe(true);
  });

  it('returns no action tools in frame phase', () => {
    const result = assembleCoScoutPrompt({
      phase: 'frame',
      mode: 'standard',
      surface: 'fullPanel',
      context: MINIMAL_CONTEXT,
    });
    const actionTools = result.tools.filter(
      (t: any) => t.name === 'apply_filter' || t.name === 'create_finding'
    );
    expect(actionTools).toHaveLength(0);
  });

  it('returns action tools in scout phase', () => {
    const result = assembleCoScoutPrompt({
      phase: 'scout',
      mode: 'standard',
      surface: 'fullPanel',
      context: MINIMAL_CONTEXT,
    });
    const hasFilter = result.tools.some((t: any) => t.name === 'apply_filter');
    expect(hasFilter).toBe(true);
  });

  it('tier1Static is non-empty string', () => {
    const result = assembleCoScoutPrompt({
      phase: 'investigate',
      mode: 'standard',
      surface: 'fullPanel',
      context: MINIMAL_CONTEXT,
    });
    expect(result.tier1Static.length).toBeGreaterThan(100);
  });
});
```

- [ ] **Step 6: Run tests**

Run: `pnpm --filter @variscout/core test`
Expected: All tests pass (existing `promptTemplates.test.ts` + new `coScoutAssembler.test.ts`)

- [ ] **Step 7: Build verification**

Run: `pnpm build`
Expected: All packages build (the re-exports maintain backward compatibility)

- [ ] **Step 8: Commit**

```bash
git add packages/core/src/ai/prompts/coScout/
git add packages/core/src/ai/prompts/index.ts
git add packages/core/src/ai/__tests__/coScoutAssembler.test.ts
git commit -m "refactor(ai): create coScout/ directory with assembler + legacy delegation"
```

---

### Task 2: Create typed tool registry

**Files:**

- Create: `packages/core/src/ai/prompts/coScout/tools/registry.ts`
- Create: `packages/core/src/ai/prompts/coScout/tools/index.ts`
- Test: `packages/core/src/ai/__tests__/toolRegistry.test.ts`

- [ ] **Step 1: Write failing tests for tool registry**

```typescript
// packages/core/src/ai/__tests__/toolRegistry.test.ts
import { describe, it, expect } from 'vitest';
import { TOOL_REGISTRY, getToolsForPhase, type ToolName } from '../prompts/coScout/tools';

describe('TOOL_REGISTRY', () => {
  it('contains all expected read tools', () => {
    const readTools: ToolName[] = [
      'get_chart_data',
      'get_statistical_summary',
      'search_knowledge_base',
      'get_available_factors',
      'compare_categories',
      'get_finding_attachment',
      'search_project',
    ];
    for (const name of readTools) {
      expect(TOOL_REGISTRY[name]).toBeDefined();
      expect(TOOL_REGISTRY[name].classification).toBe('read');
    }
  });

  it('contains all expected SCOUT+ action tools', () => {
    const scoutTools: ToolName[] = [
      'apply_filter',
      'switch_factor',
      'clear_filters',
      'create_finding',
      'navigate_to',
    ];
    for (const name of scoutTools) {
      expect(TOOL_REGISTRY[name]).toBeDefined();
      expect(TOOL_REGISTRY[name].classification).toBe('action');
      expect(TOOL_REGISTRY[name].phases).toContain('scout');
    }
  });

  it('contains all expected INVESTIGATE+ action tools', () => {
    const investigateTools: ToolName[] = [
      'create_question',
      'answer_question',
      'suggest_suspected_cause',
      'connect_hub_evidence',
      'suggest_improvement_idea',
      'suggest_action',
      'spark_brainstorm',
      'suggest_causal_link',
      'highlight_map_pattern',
    ];
    for (const name of investigateTools) {
      expect(TOOL_REGISTRY[name]).toBeDefined();
      expect(TOOL_REGISTRY[name].phases).toContain('investigate');
    }
  });

  it('gates team-only tools by tier', () => {
    expect(TOOL_REGISTRY.notify_action_owners.tier).toBe('team');
  });
});

describe('getToolsForPhase', () => {
  it('returns only read tools for frame phase', () => {
    const tools = getToolsForPhase('frame', 'standard');
    const actionTools = tools.filter(
      t => TOOL_REGISTRY[t.name as ToolName]?.classification === 'action'
    );
    expect(actionTools).toHaveLength(0);
  });

  it('returns action tools for scout phase', () => {
    const tools = getToolsForPhase('scout', 'standard');
    const hasFilter = tools.some(t => t.name === 'apply_filter');
    expect(hasFilter).toBe(true);
  });

  it('returns investigation tools for investigate phase', () => {
    const tools = getToolsForPhase('investigate', 'standard');
    const hasQuestion = tools.some(t => t.name === 'create_question');
    expect(hasQuestion).toBe(true);
  });

  it('excludes team tools when isTeamPlan is false', () => {
    const tools = getToolsForPhase('investigate', 'standard', { isTeamPlan: false });
    const hasNotify = tools.some(t => t.name === 'notify_action_owners');
    expect(hasNotify).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/core test -- --reporter=verbose toolRegistry`
Expected: FAIL — module not found

- [ ] **Step 3: Implement tool registry**

Create `packages/core/src/ai/prompts/coScout/tools/registry.ts` — extract all tool definitions from `legacy.ts` (lines 45-742) into typed objects. Each tool gets `name`, `description`, `parameters`, `classification`, `phases`, and optional `tier` and `condition` fields.

This is a large extraction. The implementer should read `legacy.ts` lines 45-742, identify each tool's JSON schema, and create the corresponding registry entry. The `getToolsForPhase()` function filters the registry by phase, mode, tier, and dynamic conditions.

Create `packages/core/src/ai/prompts/coScout/tools/index.ts` as barrel export.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @variscout/core test -- --reporter=verbose toolRegistry`
Expected: All pass

- [ ] **Step 5: Wire assembler to use registry**

Update `packages/core/src/ai/prompts/coScout/index.ts`:

- Change `assembleCoScoutPrompt` to call `getToolsForPhase()` from the registry instead of `buildCoScoutTools()` from legacy
- Keep `buildCoScoutTools()` exported from legacy for backward compatibility (consumers still use it)

- [ ] **Step 6: Run full test suite**

Run: `pnpm --filter @variscout/core test`
Expected: All tests pass (existing + new)

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/ai/prompts/coScout/tools/
git add packages/core/src/ai/__tests__/toolRegistry.test.ts
git add packages/core/src/ai/prompts/coScout/index.ts
git commit -m "feat(ai): add typed tool registry with phase/mode/tier gating"
```

---

### Task 3: Extract role.ts (core identity, principles, security)

**Files:**

- Create: `packages/core/src/ai/prompts/coScout/role.ts`
- Test: `packages/core/src/ai/__tests__/coScoutRole.test.ts`

Extract the "always present" content from `legacy.ts`: CoScout identity, three investigation principles (correlation ≠ causation, progressive stratification, iterative exploration), confidence calibration by sample size, security instructions (never invent data), and consolidated REF marker guidance.

- [ ] **Step 1: Write tests**

```typescript
// packages/core/src/ai/__tests__/coScoutRole.test.ts
import { describe, it, expect } from 'vitest';
import { buildRole } from '../prompts/coScout/role';

describe('buildRole', () => {
  const role = buildRole();

  it('includes CoScout identity', () => {
    expect(role).toContain('CoScout');
    expect(role).toContain('quality engineering');
  });

  it('includes three investigation principles', () => {
    expect(role).toContain('correlation');
    expect(role).toContain('causation');
    expect(role).toContain('stratification');
    expect(role).toContain('iterative');
  });

  it('includes confidence calibration', () => {
    expect(role).toContain('observations');
  });

  it('includes security instructions', () => {
    expect(role).toContain('never invent');
  });

  it('includes consolidated REF marker guidance', () => {
    expect(role).toContain('[REF:');
  });

  it('does NOT contain dynamic data (tier1 safety)', () => {
    expect(role).not.toMatch(/η²\s*=\s*\d/);
    expect(role).not.toMatch(/Cpk\s*=\s*\d/);
    expect(role).not.toMatch(/R²adj\s*=\s*\d/);
    expect(role).not.toContain('filter');
  });
});
```

- [ ] **Step 2: Implement role.ts**

Extract from `legacy.ts`: lines 880-902 (role + principles), lines 1156-1172 (confidence calibration), security instructions, and REF marker guidance (consolidating the two duplicate locations). Export as `buildRole(): string`.

- [ ] **Step 3: Run tests, verify pass**

Run: `pnpm --filter @variscout/core test -- --reporter=verbose coScoutRole`

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/ai/prompts/coScout/role.ts
git add packages/core/src/ai/__tests__/coScoutRole.test.ts
git commit -m "refactor(ai): extract role.ts — identity, principles, confidence, security"
```

---

### Task 4: Extract phase coaching modules

**Files:**

- Create: `packages/core/src/ai/prompts/coScout/phases/frame.ts`
- Create: `packages/core/src/ai/prompts/coScout/phases/scout.ts`
- Create: `packages/core/src/ai/prompts/coScout/phases/investigate.ts`
- Create: `packages/core/src/ai/prompts/coScout/phases/improve.ts`
- Create: `packages/core/src/ai/prompts/coScout/phases/index.ts`
- Test: `packages/core/src/ai/__tests__/coScoutPhases.test.ts`

Merge the two duplicate phase instruction blocks (lines 975-998 + 1289-1305 in legacy.ts) into one coherent instruction set per phase. Each file exports `buildPhaseCoaching(mode: AnalysisMode): string`.

- [ ] **Step 1: Write tests**

```typescript
// packages/core/src/ai/__tests__/coScoutPhases.test.ts
import { describe, it, expect } from 'vitest';
import { buildPhaseCoaching } from '../prompts/coScout/phases';

describe('buildPhaseCoaching', () => {
  it('frame phase guides chart reading', () => {
    const coaching = buildPhaseCoaching('frame', 'standard');
    expect(coaching).toContain('chart');
    expect(coaching).not.toContain('create_question');
  });

  it('scout phase guides drilling by evidence metric', () => {
    const coaching = buildPhaseCoaching('scout', 'standard');
    expect(coaching).toContain('drill');
    expect(coaching).toContain('finding');
  });

  it('investigate phase guides question tree and validation', () => {
    const coaching = buildPhaseCoaching('investigate', 'standard');
    expect(coaching).toContain('question');
    expect(coaching).toContain('evidence');
  });

  it('improve phase guides PDCA', () => {
    const coaching = buildPhaseCoaching('improve', 'standard');
    expect(coaching).toContain('improvement');
  });

  it('investigate phase uses lean terminology for yamazumi mode', () => {
    const coaching = buildPhaseCoaching('investigate', 'yamazumi');
    expect(coaching).toContain('waste');
  });

  it('each phase produces non-empty output', () => {
    for (const phase of ['frame', 'scout', 'investigate', 'improve'] as const) {
      const result = buildPhaseCoaching(phase, 'standard');
      expect(result.length).toBeGreaterThan(50);
    }
  });
});
```

- [ ] **Step 2: Implement four phase files**

Extract from `legacy.ts`:

- `frame.ts` — lines ~970-974 (initial phase guidance)
- `scout.ts` — lines ~975-980 + entry scenario routing
- `investigate.ts` — lines ~981-1029 (diverging/validating/converging sub-phases, hub synthesis coaching, evidence map coaching from lines 1326-1333)
- `improve.ts` — lines ~985-997 + 1031-1042 (PDCA, staged comparison override, verification)

Each exports `buildPhaseCoaching(mode: AnalysisMode): string`. The `index.ts` barrel dispatches by phase:

```typescript
// packages/core/src/ai/prompts/coScout/phases/index.ts
import type { AnalysisMode, JourneyPhase } from '../../../types';
import { buildFrameCoaching } from './frame';
import { buildScoutCoaching } from './scout';
import { buildInvestigateCoaching } from './investigate';
import { buildImproveCoaching } from './improve';

export function buildPhaseCoaching(phase: JourneyPhase, mode: AnalysisMode): string {
  switch (phase) {
    case 'frame':
      return buildFrameCoaching(mode);
    case 'scout':
      return buildScoutCoaching(mode);
    case 'investigate':
      return buildInvestigateCoaching(mode);
    case 'improve':
      return buildImproveCoaching(mode);
    default:
      return buildFrameCoaching(mode);
  }
}
```

- [ ] **Step 3: Run tests, verify pass**
- [ ] **Step 4: Commit**

```bash
git add packages/core/src/ai/prompts/coScout/phases/
git add packages/core/src/ai/__tests__/coScoutPhases.test.ts
git commit -m "refactor(ai): extract phase coaching modules — one file per phase, zero duplication"
```

---

### Task 5: Extract mode coaching modules

**Files:**

- Create: `packages/core/src/ai/prompts/coScout/modes/standard.ts`
- Create: `packages/core/src/ai/prompts/coScout/modes/capability.ts`
- Create: `packages/core/src/ai/prompts/coScout/modes/performance.ts`
- Create: `packages/core/src/ai/prompts/coScout/modes/yamazumi.ts`
- Create: `packages/core/src/ai/prompts/coScout/modes/index.ts`
- Test: `packages/core/src/ai/__tests__/coScoutModes.test.ts`

Consolidate the three redundant mode blocks (terminology + hints + coaching) into one focused module per mode.

- [ ] **Step 1: Write tests**

```typescript
// packages/core/src/ai/__tests__/coScoutModes.test.ts
import { describe, it, expect } from 'vitest';
import { buildModeWorkflow } from '../prompts/coScout/modes';

describe('buildModeWorkflow', () => {
  it('standard mode uses SPC terminology', () => {
    const workflow = buildModeWorkflow('standard', 'investigate');
    expect(workflow).toContain('Cpk');
    expect(workflow).toContain('control limit');
  });

  it('yamazumi mode uses lean terminology', () => {
    const workflow = buildModeWorkflow('yamazumi', 'investigate');
    expect(workflow).toContain('takt');
    expect(workflow).toContain('waste');
    expect(workflow).not.toContain('Cpk');
  });

  it('performance mode uses channel terminology', () => {
    const workflow = buildModeWorkflow('performance', 'investigate');
    expect(workflow).toContain('channel');
  });

  it('capability mode uses centering/spread terminology', () => {
    const workflow = buildModeWorkflow('capability', 'investigate');
    expect(workflow).toContain('centering');
  });

  it('each mode produces non-empty output', () => {
    for (const mode of ['standard', 'capability', 'performance', 'yamazumi'] as const) {
      expect(buildModeWorkflow(mode, 'investigate').length).toBeGreaterThan(50);
    }
  });
});
```

- [ ] **Step 2: Implement four mode files**

Extract from `legacy.ts`:

- `standard.ts` — SPC workflow steps, I-Chart → Boxplot → Pareto → Stats
- `yamazumi.ts` — lines 1215-1248 (lean terminology), consolidated with hints from 1309-1323
- `performance.ts` — lines 1251-1273 (channel terminology), consolidated with hints
- `capability.ts` — lines 1174-1208 (centering vs spread, subgroup stability)

Each exports `buildModeWorkflow(phase: JourneyPhase): string`.

- [ ] **Step 3: Run tests, verify pass**
- [ ] **Step 4: Commit**

```bash
git add packages/core/src/ai/prompts/coScout/modes/
git add packages/core/src/ai/__tests__/coScoutModes.test.ts
git commit -m "refactor(ai): extract mode coaching modules — one file per mode, zero redundancy"
```

---

### Task 6: Extract context formatters

**Files:**

- Create: `packages/core/src/ai/prompts/coScout/context/investigation.ts`
- Create: `packages/core/src/ai/prompts/coScout/context/dataContext.ts`
- Create: `packages/core/src/ai/prompts/coScout/context/knowledgeContext.ts`
- Create: `packages/core/src/ai/prompts/coScout/context/index.ts`
- Test: `packages/core/src/ai/__tests__/coScoutContext.test.ts`

Extract investigation state formatting, data context (top factors, model equation, scope), and knowledge context formatting from `legacy.ts` and `buildAIContext.ts`.

- [ ] **Step 1: Write tests**

```typescript
// packages/core/src/ai/__tests__/coScoutContext.test.ts
import { describe, it, expect } from 'vitest';
import {
  formatInvestigationContext,
  formatDataContext,
  formatKnowledgeContext,
} from '../prompts/coScout/context';

describe('formatInvestigationContext', () => {
  it('returns empty string when no investigation', () => {
    expect(formatInvestigationContext(undefined)).toBe('');
  });

  it('includes question summary when questions exist', () => {
    const result = formatInvestigationContext({
      phase: 'diverging',
      questionTree: [{ id: 'q1', text: 'Does Machine matter?', status: 'open', children: [] }],
      suspectedCauseHubs: [],
    } as any);
    expect(result).toContain('question');
  });

  it('uses ONLY hub-based suspected causes (not legacy causeRole)', () => {
    const result = formatInvestigationContext({
      phase: 'converging',
      questionTree: [],
      suspectedCauseHubs: [{ name: 'Nozzle Wear', status: 'confirmed' }],
      suspectedCauses: [{ name: 'Legacy Cause' }], // legacy field — should be ignored
    } as any);
    expect(result).toContain('Nozzle Wear');
    expect(result).not.toContain('Legacy Cause');
  });
});

describe('formatDataContext', () => {
  it('returns empty string when no stats', () => {
    expect(formatDataContext({ stats: null } as any)).toBe('');
  });

  it('includes top factors when variation contributions exist', () => {
    const result = formatDataContext({
      stats: { n: 100, mean: 50 },
      variationContributions: [{ factor: 'Machine', etaSquared: 0.45 }],
    } as any);
    expect(result).toContain('Machine');
    expect(result).toContain('45%');
  });
});
```

- [ ] **Step 2: Implement context formatters**

Extract `formatInvestigationContext` from legacy.ts (investigation context building sections). Extract `formatDataContext` as NEW — formats top factors, best model equation, drill scope, active chart, problem statement stage into the grounded data context block shown in the design spec. Move existing `formatKnowledgeContext` from legacy.ts.

Key change: `formatInvestigationContext` uses ONLY `suspectedCauseHubs`, ignoring legacy `suspectedCauses` from question `causeRole` (contradiction resolution #1).

- [ ] **Step 3: Run tests, verify pass**
- [ ] **Step 4: Commit**

```bash
git add packages/core/src/ai/prompts/coScout/context/
git add packages/core/src/ai/__tests__/coScoutContext.test.ts
git commit -m "refactor(ai): extract context formatters — investigation, data, knowledge"
```

---

### Task 7: Wire assembler to use extracted modules

**Files:**

- Modify: `packages/core/src/ai/prompts/coScout/index.ts`
- Test: `packages/core/src/ai/__tests__/coScoutAssembler.test.ts` (extend)

Update `assembleCoScoutPrompt` to compose from the extracted modules instead of delegating to legacy. This is the integration task.

- [ ] **Step 1: Extend assembler tests**

```typescript
// Add to coScoutAssembler.test.ts

it('tier1Static contains role but NOT investigation data', () => {
  const result = assembleCoScoutPrompt({
    phase: 'investigate',
    mode: 'standard',
    surface: 'fullPanel',
    context: { ...MINIMAL_CONTEXT, investigation: { phase: 'diverging' } as any },
  });
  expect(result.tier1Static).toContain('CoScout');
  expect(result.tier1Static).not.toContain('diverging');
});

it('tier2SemiStatic contains phase coaching', () => {
  const result = assembleCoScoutPrompt({
    phase: 'investigate',
    mode: 'standard',
    surface: 'fullPanel',
    context: MINIMAL_CONTEXT,
  });
  expect(result.tier2SemiStatic).toContain('question');
});

it('yamazumi mode uses lean terminology in tier2', () => {
  const result = assembleCoScoutPrompt({
    phase: 'investigate',
    mode: 'yamazumi',
    surface: 'fullPanel',
    context: MINIMAL_CONTEXT,
  });
  expect(result.tier2SemiStatic).toContain('takt');
});
```

- [ ] **Step 2: Wire assembler**

```typescript
// packages/core/src/ai/prompts/coScout/index.ts — update assembleCoScoutPrompt

import { buildRole } from './role';
import { buildPhaseCoaching } from './phases';
import { buildModeWorkflow } from './modes';
import { formatInvestigationContext, formatDataContext, formatKnowledgeContext } from './context';
import { getToolsForPhase } from './tools';
import { buildGlossaryFragment } from './glossary'; // extract or reuse existing

export function assembleCoScoutPrompt(options: AssembleCoScoutPromptOptions): CoScoutPromptTiers {
  const { phase, investigationPhase, mode, surface, context, isTeamPlan } = options;

  return {
    tier1Static: [buildRole(), buildGlossaryFragment(mode)].join('\n\n'),

    tier2SemiStatic: [
      buildPhaseCoaching(phase, mode),
      buildModeWorkflow(mode, phase),
      formatInvestigationContext(context.investigation),
      formatDataContext(context),
      formatKnowledgeContext(context),
    ]
      .filter(Boolean)
      .join('\n\n'),

    tier3Dynamic: '', // Phase 2 will add surface-specific dynamic context

    tools: getToolsForPhase(phase, mode, {
      isTeamPlan,
      investigationPhase,
      existingHubs: context.investigation?.suspectedCauseHubs,
    }),
  };
}
```

- [ ] **Step 3: Run ALL tests**

Run: `pnpm --filter @variscout/core test`
Expected: All pass

- [ ] **Step 4: Run full build**

Run: `pnpm build`
Expected: All packages build

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/ai/prompts/coScout/index.ts
git add packages/core/src/ai/__tests__/coScoutAssembler.test.ts
git commit -m "feat(ai): wire assembler to use modular prompt modules"
```

---

### Task 8: Update reasoningConfig for sub-phase routing

**Files:**

- Modify: `packages/core/src/ai/reasoningConfig.ts`
- Test: `packages/core/src/ai/__tests__/reasoningConfig.test.ts` (create)

- [ ] **Step 1: Write tests**

```typescript
// packages/core/src/ai/__tests__/reasoningConfig.test.ts
import { describe, it, expect } from 'vitest';
import { getCoScoutReasoningEffort } from '../reasoningConfig';

describe('getCoScoutReasoningEffort', () => {
  it('frame = low', () => {
    expect(getCoScoutReasoningEffort('frame')).toBe('low');
  });

  it('scout = low', () => {
    expect(getCoScoutReasoningEffort('scout')).toBe('low');
  });

  it('investigate with validating = medium', () => {
    expect(getCoScoutReasoningEffort('investigate', 'validating')).toBe('medium');
  });

  it('investigate with converging = high', () => {
    expect(getCoScoutReasoningEffort('investigate', 'converging')).toBe('high');
  });

  it('improve without staged data = low', () => {
    expect(getCoScoutReasoningEffort('improve')).toBe('low');
  });

  it('improve with staged data (check) = high', () => {
    expect(getCoScoutReasoningEffort('improve', undefined, true)).toBe('high');
  });

  it('defaults to low', () => {
    expect(getCoScoutReasoningEffort(undefined)).toBe('low');
  });
});
```

- [ ] **Step 2: Update reasoningConfig.ts**

```typescript
export function getCoScoutReasoningEffort(
  phase?: JourneyPhase,
  investigationPhase?: InvestigationPhase,
  hasStagedData?: boolean
): 'none' | 'low' | 'medium' | 'high' {
  if (phase === 'improve' && hasStagedData) return 'high'; // PDCA Check
  if (phase === 'investigate') {
    switch (investigationPhase) {
      case 'converging':
        return 'high';
      case 'validating':
        return 'medium';
      default:
        return 'low'; // initial, diverging
    }
  }
  return 'low'; // frame, scout, improve (Do), default
}
```

- [ ] **Step 3: Update useAICoScout.ts caller**

The caller at `packages/hooks/src/useAICoScout.ts:161` currently passes only `phase`. Update to also pass `investigationPhase` and `hasStagedData`:

```typescript
reasoning: {
  effort: getCoScoutReasoningEffort(
    toolsOptions?.phase,
    toolsOptions?.investigationPhase,
    !!context.stagedComparison
  ),
},
```

- [ ] **Step 4: Run tests, verify pass**
- [ ] **Step 5: Commit**

```bash
git add packages/core/src/ai/reasoningConfig.ts
git add packages/core/src/ai/__tests__/reasoningConfig.test.ts
git add packages/hooks/src/useAICoScout.ts
git commit -m "feat(ai): sub-phase reasoning effort — high for converging + verification"
```

---

### Task 9: Prompt tier regression tests + ADR-068

**Files:**

- Create: `packages/core/src/ai/__tests__/promptTierSafety.test.ts`
- Create: `docs/07-decisions/adr-068-coscout-cognitive-redesign.md`

- [ ] **Step 1: Write tier safety tests**

```typescript
// packages/core/src/ai/__tests__/promptTierSafety.test.ts
import { describe, it, expect } from 'vitest';
import { assembleCoScoutPrompt } from '../prompts/coScout';
import type { AIContext } from '../types';

const RICH_CONTEXT: AIContext = {
  stats: { n: 100, mean: 50.3, sigma: 2.1, cp: 1.5, cpk: 1.2 } as any,
  filters: { Machine: ['A', 'B'] },
  variationContributions: [{ factor: 'Machine', etaSquared: 0.45 }],
  drillPath: [{ factor: 'Machine', value: 'A' }],
  investigation: {
    phase: 'validating',
    questionTree: [{ id: 'q1', text: 'Test?', status: 'answered', children: [] }],
    suspectedCauseHubs: [{ name: 'Hub1', status: 'suspected' }],
  } as any,
};

describe('Prompt tier safety', () => {
  it('tier1Static NEVER contains stats values', () => {
    const result = assembleCoScoutPrompt({
      phase: 'investigate',
      mode: 'standard',
      surface: 'fullPanel',
      context: RICH_CONTEXT,
    });
    expect(result.tier1Static).not.toContain('50.3');
    expect(result.tier1Static).not.toContain('2.1');
    expect(result.tier1Static).not.toContain('1.2');
  });

  it('tier1Static NEVER contains filter state', () => {
    const result = assembleCoScoutPrompt({
      phase: 'investigate',
      mode: 'standard',
      surface: 'fullPanel',
      context: RICH_CONTEXT,
    });
    expect(result.tier1Static).not.toContain('Machine');
    expect(result.tier1Static).not.toContain('Filter');
  });

  it('tier1Static NEVER contains finding text', () => {
    const result = assembleCoScoutPrompt({
      phase: 'investigate',
      mode: 'standard',
      surface: 'fullPanel',
      context: RICH_CONTEXT,
    });
    expect(result.tier1Static).not.toContain('Hub1');
    expect(result.tier1Static).not.toContain('answered');
  });

  it('tier2SemiStatic contains investigation context when present', () => {
    const result = assembleCoScoutPrompt({
      phase: 'investigate',
      mode: 'standard',
      surface: 'fullPanel',
      context: RICH_CONTEXT,
    });
    expect(result.tier2SemiStatic).toContain('question');
  });

  it('tier1Static is stable across different contexts', () => {
    const result1 = assembleCoScoutPrompt({
      phase: 'investigate',
      mode: 'standard',
      surface: 'fullPanel',
      context: { stats: null, filters: {}, variationContributions: [], drillPath: [] },
    });
    const result2 = assembleCoScoutPrompt({
      phase: 'investigate',
      mode: 'standard',
      surface: 'fullPanel',
      context: RICH_CONTEXT,
    });
    expect(result1.tier1Static).toBe(result2.tier1Static);
  });
});
```

- [ ] **Step 2: Run tests, verify pass**

- [ ] **Step 3: Write ADR-068**

Create `docs/07-decisions/adr-068-coscout-cognitive-redesign.md`:

```markdown
# ADR-068: CoScout Cognitive Redesign

**Status:** Accepted
**Date:** 2026-04-05

## Context

CoScout's system prompt grew to 1,691 lines across 10 ADRs, creating contradictions, redundancies, and invisible capabilities. Phase coaching appeared twice, mode terminology three times, and two parallel suspected cause systems competed.

## Decision

Replace the monolithic `coScout.ts` with a modular `coScout/` directory. Phase-adaptive prompts assembled by `assembleCoScoutPrompt(phase, mode, surface, context)`. Typed tool registry with compile-time handler completeness. Three-tier prompt caching enforced in code.

## Consequences

- Phase × mode coaching is one coherent block, not accumulated layers
- Every coaching instruction grounded in visible data context
- Tool definitions are single source of truth (registry.ts)
- Sub-phase reasoning effort (converging=high, validating=medium)
- Suspected causes: hubs only (causeRole deprecated on questions)
- 7 interaction surfaces with tailored token budgets

## Implementation

Phase 1: Foundation (modular prompts, tool registry, tier types, reasoning config)
Phase 2: Intelligence (context enrichment, question pipeline, proactive coaching, KB wiring)
```

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/ai/__tests__/promptTierSafety.test.ts
git add docs/07-decisions/adr-068-coscout-cognitive-redesign.md
git commit -m "docs: add ADR-068 CoScout Cognitive Redesign + tier safety tests"
```

---

### Task 10: Full verification + cleanup

- [ ] **Step 1: Run full build**

Run: `pnpm build`
Expected: All packages build successfully

- [ ] **Step 2: Run full test suite**

Run: `pnpm test`
Expected: All ~5,266+ tests pass

- [ ] **Step 3: Verify legacy still works**

Check that existing consumers (`useAICoScout.ts`) still work via the legacy re-exports. The old `buildCoScoutSystemPrompt`, `buildCoScoutInput`, `buildCoScoutTools` are still exported and functional.

- [ ] **Step 4: Grep verification**

```bash
grep -r "Keep in sync\|reproduced here" packages/
```

Expected: Zero results

- [ ] **Step 5: Update ADR index**

Add ADR-068 to `docs/07-decisions/index.md`

- [ ] **Step 6: Commit**

```bash
git commit -m "chore: Phase 1 complete — modular CoScout prompt architecture"
```
