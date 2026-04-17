---
title: CoScout Cognitive Redesign
status: delivered
date: 2026-04-05
related:
  [
    adr-019,
    adr-029,
    adr-047,
    adr-049,
    adr-053,
    adr-054,
    adr-060,
    adr-064,
    adr-065,
    adr-066,
    adr-067,
  ]
---

# CoScout Cognitive Redesign

## Context

CoScout's system prompt (1,691 lines in `coScout.ts`) was built across 10 ADRs, each adding a feature layer without holistic redesign. The result: contradictions between layers, redundant instructions, invisible capabilities (best model equation, drill scope, Evidence Map topology computed but never surfaced), dual suspected cause systems, and phase coaching that appears twice. Every analyst gets 1,691 lines regardless of phase.

This spec redesigns CoScout's cognitive architecture from scratch — one coherent mental model per phase × mode, with every coaching instruction grounded in visible data.

## Principles

1. **Phase-adaptive prompts** — FRAME gets ~200 lines, INVESTIGATE gets ~500. No analyst sees all 1,691.
2. **Every instruction grounded** — if the prompt says "look for convergence," the topology summary is right there.
3. **One system, no layers** — suspected causes = hubs only. Phase coaching = one block. Mode terminology = one block.
4. **Tool-based KB search** — CoScout decides when to search (ADR-060). No auto-injection.
5. **7 interaction surfaces, 1 model** — Full panel, Quick Ask, Context Click, Chart Insight, Document Analysis, Knowledge Retrieval, Inline CoScout — each gets a tailored slice.

---

## Pillar 1: Modular Prompt Architecture

### Current

Single file `packages/core/src/ai/prompts/coScout.ts` (1,691 lines).

### Target

```
packages/core/src/ai/prompts/coScout/
├── index.ts                — assembleCoScoutPrompt(phase, mode, context) orchestrator
├── role.ts                 — core identity, principles, confidence calibration, security
├── glossary.ts             — mode-filtered glossary injection (exists, extract)
├── tools/
│   ├── registry.ts         — typed tool definitions (Pillar 2)
│   ├── readTools.ts        — chart_data, stats, KB search, factors, compare, attachment
│   └── actionTools.ts      — filter, finding, question, hub, causal link, improvement
├── phases/
│   ├── frame.ts            — chart reading guidance, issue formulation
│   ├── scout.ts            — drill by evidence metric, create findings
│   ├── investigate.ts      — question tree, Evidence Map, hub synthesis, validation
│   └── improve.ts          — HMW brainstorm, PDCA, verification, staged comparison
├── modes/
│   ├── standard.ts         — SPC workflow (I-Chart → Boxplot → Pareto → Stats)
│   ├── capability.ts       — centering vs spread, subgroup stability
│   ├── performance.ts      — channel ranking, worst-channel focus
│   └── yamazumi.ts         — lean workflow (takt, waste, VA ratio, kaizen)
├── context/
│   ├── investigation.ts    — format investigation state (questions, hubs, evidence map)
│   ├── dataContext.ts      — format stats summary (top factors, model equation, scope)
│   └── knowledgeContext.ts — format KB results + citation instructions
└── surfaces/
    ├── fullPanel.ts        — 12K budget, all tools, full history
    ├── quickAsk.ts         — 2K budget, no tools, single-turn
    ├── contextClick.ts     — 12K budget, focus injection, opens panel
    ├── chartInsight.ts     — 1K budget, deterministic + AI enhancement
    ├── inlineCoScout.ts    — 4K budget, scoped to finding/question
    └── narration.ts        — 2K budget, dashboard summary (exists, extract)
```

### Assembly logic

```typescript
function assembleCoScoutPrompt(options: {
  phase: InvestigationPhase;
  mode: AnalysisMode;
  surface: CoScoutSurface;
  context: AIContext;
}): CoScoutPromptTiers {
  return {
    tier1Static: [buildRole(), buildGlossary(options.mode)].join('\n'),

    tier2SemiStatic: [
      buildPhaseCoaching(options.phase, options.mode),
      buildModeWorkflow(options.mode, options.phase),
      buildInvestigationContext(options.context),
      buildDataContext(options.context),
      buildKnowledgeContext(options.context),
    ].join('\n'),

    tier3Dynamic: buildSurfaceContext(options.surface, options.context),

    tools: buildToolsForPhase(options.phase, options.mode),
  };
}
```

---

## Pillar 2: Typed Tool Registry

### Current

Tool schemas in `coScout.ts` prompts. Handlers in `actionToolHandlers.ts` + `readToolHandlers.ts`. No compile-time contract between them.

### Target

```typescript
interface ToolDefinition<TName extends string, TParams> {
  name: TName;
  description: string;
  parameters: { type: 'object'; properties: Record<string, unknown>; required: string[] };
  classification: 'read' | 'action';
  phases: InvestigationPhase[];
  modes?: AnalysisMode[];
  condition?: (ctx: AIContext) => boolean;
}
```

All tools defined once in `registry.ts`. Prompt generation and handler routing both derive from the same source. Compile-time error if a tool has no handler or vice versa.

### Full tool inventory

- **Read tools (always available):** `get_chart_data`, `get_statistical_summary`, `search_knowledge_base`, `get_available_factors`, `compare_categories`, `get_finding_attachment`, `search_project`
- **SCOUT+ action tools:** `apply_filter`, `switch_factor`, `clear_filters`, `create_finding`, `navigate_to`
- **INVESTIGATE+ action tools:** `create_question`, `answer_question`, `suggest_suspected_cause`, `connect_hub_evidence`, `suggest_improvement_idea`, `suggest_action`, `spark_brainstorm`, `suggest_causal_link`, `highlight_map_pattern`
- **Team-only tools:** `notify_action_owners` — gated by `tier: 'team'` in registry

### Entry scenario routing

Current entry scenario routing (problem / exploration / routine) moves to `surfaces/fullPanel.ts` as initial-turn context injection.

---

## Pillar 3: Prompt Tier Types

### Target

```typescript
interface CoScoutPromptTiers {
  tier1Static: string; // CACHED (>1024 tokens, stable across session)
  tier2SemiStatic: string; // SEMI-CACHED (stable across turns)
  tier3Dynamic: string; // NOT CACHED (changes every turn)
  tools: ToolDefinition[];
}
```

Tiers map to Responses API: tier1 → first system message (cached prefix), tier2 → second system message, tier3 → third system message, tools → tools array.

Unit test: verify no dynamic data in tier1.

---

## Pillar 4: Context Enrichment + Grounding

### Currently invisible to CoScout

- Best model equation, cumulative drill scope, active chart, Evidence Map topology summary, problem statement stage, question priority ranking, focus context from clicks

### Currently omitted

- Finding comments, outcomes, improvement idea details, action item assignees

### Target: Grounded Data Context block (Tier 2)

```
── Data Context ──
Problem: "Fill weight exceeds USL on night shifts" (actionable, with causes)
Active chart: Boxplot — Machine factor (4 categories)
Drill scope: 35% of total variation (Machine → Shift)
Top factors: Machine η²=45%, Shift η²=23%, Operator η²=12%
Best model: {Machine, Shift} → R²adj=0.61, worst case: Machine C + Night = +12.3g
Evidence Map: 5 factor nodes, 3 relationships, 1 convergence point (Machine → 3 incoming links)
Questions: 8 open, 5 answered, 2 ruled-out (priority: Q3 η²=45%, Q7 η²=23%)
```

### Contradiction resolutions

1. **Suspected causes**: Deprecate `causeRole` on questions. Use ONLY `SuspectedCause` hubs.
2. **Brainstorm vs tool schema**: Add `brainstormMode` flag — timeframe/cost/risk become optional.
3. **Confidence vs staged**: Staged comparison respects sample size.
4. **Phase instructions**: Merge two blocks into one per-phase instruction set.
5. **Mode terminology**: One block per mode, no redundant hints.
6. **REF markers**: Consolidate all citation guidance into `role.ts`.
7. **Legacy KB path**: Remove deprecated findings knowledge path.

### Token budget strategy

Phase-adaptive trimming replaces single 8-level priority:

| Phase       | Protect                          | Trim first                     | Trim last                        |
| ----------- | -------------------------------- | ------------------------------ | -------------------------------- |
| FRAME       | Role, glossary                   | (rarely hits budget)           | —                                |
| SCOUT       | Role, top factors, active chart  | History                        | Findings                         |
| INVESTIGATE | Role, question tree, hub names   | History → KB → finding details | Question tree, hub synthesis     |
| IMPROVE     | Role, actions, verification data | History → KB                   | Hub synthesis, staged comparison |

### PWA scope

PWA has NO CoScout. Entire redesign scoped to `apps/azure/`.

---

## Pillar 5: Complete Question Pipeline

- Wire yamazumi generator (`packages/core/src/yamazumi/questions.ts`) into `useQuestionGeneration`
- Implement performance channel ranking generator
- Evidence sorting driven by `strategy.questionStrategy.evidenceMetric`
- Question priority rank injected into CoScout context (top 3 highlighted)

---

## Pillar 6: Proactive Coaching

**Phase transitions announced:** Phase detection returns `{ phase, previousPhase, transitionReason }`.

**Evidence sufficiency checks:** Coverage per hub computed, flagged if < 25%.

**Proactive synthesis:** Answered questions grouped by converging factor, surfaced when ≥ 3 converge.

**Refined reasoning effort:**

| Sub-phase              | Reasoning | Why                  |
| ---------------------- | --------- | -------------------- |
| frame                  | low       | Simple chart reading |
| scout/diverging        | low       | Explore hypotheses   |
| investigate/validating | medium    | Assess evidence      |
| investigate/converging | high      | Synthesize causes    |
| improve/do             | low       | Execute actions      |
| improve/check          | high      | Verify outcomes      |

---

## Pillar 7: Knowledge Integration Wiring

Per ADR-060, tool-based on-demand retrieval (CoScout decides when to search):

1. Wire investigation serializer to data mutations
2. Implement `search_knowledge_base` tool handler
3. Implement `answer_question` tool handler
4. Implement `get_finding_attachment` tool handler
5. Per-phase coaching on when to search KB

---

## Verification

### Prompt regression scenarios

| #   | Phase                  | Mode        | Surface       | Verifies                                             |
| --- | ---------------------- | ----------- | ------------- | ---------------------------------------------------- |
| 1   | frame                  | standard    | fullPanel     | No tools, chart reading, confidence calibration      |
| 2   | scout                  | standard    | fullPanel     | Drill tools, η² ranking, findings creation           |
| 3   | investigate/diverging  | standard    | fullPanel     | Question tree, Evidence Map, low reasoning           |
| 4   | investigate/converging | standard    | fullPanel     | Hub synthesis proactive, high reasoning, sufficiency |
| 5   | improve                | standard    | fullPanel     | PDCA coaching, staged comparison, verification       |
| 6   | investigate            | yamazumi    | fullPanel     | Lean terminology, takt coaching, waste questions     |
| 7   | investigate            | performance | fullPanel     | Channel ranking, worst-channel focus                 |
| 8   | scout                  | standard    | quickAsk      | 2K budget, no tools, single-turn                     |
| 9   | investigate            | standard    | contextClick  | Focus injection, targeted response                   |
| 10  | investigate            | standard    | inlineCoScout | 4K budget, scoped to finding, no tools               |
