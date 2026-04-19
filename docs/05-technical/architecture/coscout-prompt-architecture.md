---
title: CoScout Prompt Architecture
audience: [developer]
category: architecture
status: stable
related: [ai-context-engineering, ai-architecture, adr-060, adr-049]
---

# CoScout Prompt Architecture

> **Scope:** Modular directory structure, assembler pipeline, type contracts, tool registry, and phase × mode coaching matrix. For token budgets and caching strategy, see [AI Context Engineering](ai-context-engineering.md).

## Overview

The CoScout prompt system uses a modular, phase-adaptive architecture introduced in the cognitive redesign (Phase 2). The monolithic `buildCoScoutSystemPrompt()` function (now in `legacy.ts`) has been replaced by `assembleCoScoutPrompt()`, which composes from focused sub-modules. Each module has a single responsibility, making the system testable, extensible, and easier to reason about.

## Directory Structure

```
packages/core/src/ai/prompts/coScout/
├── index.ts          — assembleCoScoutPrompt() entry point + barrel exports
├── role.ts           — Tier 1: CoScout identity, investigation principles, security, REF markers
├── types.ts          — CoScoutPromptTiers, CoScoutSurface, AssembleCoScoutPromptOptions
├── messages.ts       — buildCoScoutMessageInput() — Responses API input array builder
├── legacy.ts         — Original monolith functions (deprecated, test-only backward compat)
├── tools/
│   ├── index.ts      — Barrel: TOOL_REGISTRY, getToolsForPhase(), ToolRegistryEntry, ToolName
│   └── registry.ts   — 27 tools defined once with phase/mode/tier gating + condition functions
├── phases/
│   ├── index.ts      — buildPhaseCoaching() dispatcher + barrel exports
│   ├── frame.ts      — FRAME phase coaching (problem framing, measure selection)
│   ├── scout.ts      — SCOUT phase coaching (pattern identification, chart reading)
│   ├── investigate.ts— INVESTIGATE coaching dispatcher → sub-phase modules
│   └── improve.ts    — IMPROVE coaching (PDCA, action planning, kaizen verification)
├── modes/
│   ├── index.ts      — buildModeWorkflow() dispatcher + barrel exports
│   ├── standard.ts   — SPC terminology, Cpk workflow, factor-driven investigation
│   ├── performance.ts— Multi-channel terminology, worst-channel Cpk, channel ranking
│   ├── yamazumi.ts   — Lean terminology, VA ratio, waste categories, bottleneck identification
│   ├── capability.ts — Capability-focused coaching (centering vs spread diagnostic)
│   └── defect.ts     — Defect terminology, failure modes, containment vs prevention, Pareto principle
└── context/
    ├── index.ts      — Barrel: formatInvestigationContext, formatDataContext, formatKnowledgeContext
    ├── investigation.ts — Problem statement, question tree, hubs, causal links, findings
    ├── dataContext.ts   — Active chart, drill scope, top factors, stats snapshot, violations
    └── knowledgeContext.ts — KB documents, knowledge results formatting
```

## Prompt Assembly Pipeline

`assembleCoScoutPrompt(options)` → `CoScoutPromptTiers`

```
AssembleCoScoutPromptOptions
  { phase, investigationPhase, mode, surface, context, isTeamPlan }
         │
         ├── Tier 1 (Static, cacheable prefix)
         │     buildLocaleHint(context.locale)       → locale hint (non-English only)
         │     buildRole()                           → identity, principles, security, REF markers
         │     TERMINOLOGY_INSTRUCTION               → term enforcement rules
         │     context.glossaryFragment              → bilingual glossary (app-injected)
         │
         ├── Tier 2 (Semi-static, changes on navigation)
         │     buildPhaseCoaching(phase, mode, investigationPhase, entryScenario)
         │     buildModeWorkflow(mode, phase)
         │     formatInvestigationContext(context.investigation)
         │     formatDataContext(context)
         │     formatKnowledgeContext(context.knowledgeResults, context.knowledgeDocuments)
         │
         ├── Tier 3 (Dynamic, reserved — Phase 2 surface-specific context)
         │     (empty string in current implementation)
         │
         └── Tools
               getToolsForPhase(phase, mode, { isTeamPlan, investigationPhase, existingHubs })
```

## Tier Architecture

| Tier                 | Content                                                               | Stability                                                    | Cache Strategy                                              |
| -------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------- |
| Tier 1 (Static)      | Role + principles + security + terminology + glossary                 | Session-invariant                                            | Serves as Azure AI Foundry cacheable prefix (≥1,024 tokens) |
| Tier 2 (Semi-static) | Phase coaching + mode workflow + investigation/data/knowledge context | Changes on navigation (phase transition, mode switch, drill) | Not cached — regenerated on navigation events               |
| Tier 3 (Dynamic)     | Surface-specific context (chart data, history summary)                | Changes per turn                                             | Not cached — reserved for future enhancement                |

## Type Contracts

```typescript
/** Surface where CoScout is rendered — affects prompt length and tone */
type CoScoutSurface =
  | 'fullPanel' // Main CoScout conversation panel
  | 'quickAsk' // NarrativeBar ask button
  | 'contextClick' // Right-click "Ask CoScout" from chart/map
  | 'chartInsight' // ChartInsightChip AI enhancement
  | 'inlineCoScout' // Inline CoScout in investigation workspace
  | 'narration'; // NarrativeBar narration generation

/** Tiered prompt structure returned by assembleCoScoutPrompt() */
interface CoScoutPromptTiers {
  tier1Static: string; // Cacheable role + glossary prefix
  tier2SemiStatic: string; // Phase + mode + investigation context
  tier3Dynamic: string; // Reserved for surface-specific context
  tools: ToolDefinition[]; // Phase/mode/tier-gated tool definitions
}

/** Options for the unified prompt assembler */
interface AssembleCoScoutPromptOptions {
  phase?: JourneyPhase; // 'frame' | 'scout' | 'investigate' | 'improve'
  investigationPhase?: InvestigationPhase; // 'initial' | 'diverging' | 'validating' | 'converging'
  mode?: AnalysisMode; // 'standard' | 'performance' | 'yamazumi' | 'capability'
  surface?: CoScoutSurface;
  context?: AIContext;
  isTeamPlan?: boolean;
}
```

## Tool Registry

27 tools defined once in `tools/registry.ts`, with phase/mode/tier gating via `ToolRegistryEntry`:

```typescript
interface ToolRegistryEntry {
  definition: ToolDefinition; // Responses API function schema
  classification: 'read' | 'action'; // Read = auto-execute; action = user confirmation required
  phases: JourneyPhase[]; // Journey phases where available
  modes?: AnalysisMode[]; // Optional mode restriction
  tier?: 'team'; // Optional team-tier-only restriction
  condition?: (ctx) => boolean; // Optional dynamic availability condition
}
```

`getToolsForPhase(phase, mode, ctx)` filters the registry and returns only the `ToolDefinition[]` array for a given phase/mode/tier combination.

## Phase × Mode Coaching Matrix

What varies per combination:

|                 | Standard                                  | Performance                                   | Yamazumi                                  | Capability                |
| --------------- | ----------------------------------------- | --------------------------------------------- | ----------------------------------------- | ------------------------- |
| **FRAME**       | Measure selection, spec definition        | Channel selection                             | Step selection, takt time                 | Spec definition focus     |
| **SCOUT**       | Cpk pattern reading, factor ranking       | Channel health overview                       | VA ratio overview, waste heatmap          | Cp vs Cpk diagnostic      |
| **INVESTIGATE** | η²-driven stratification, SPC terminology | Worst-channel drill, multi-channel comparison | Waste decomposition, bottleneck isolation | Centering vs spread split |
| **IMPROVE**     | Corrective action, PDCA                   | Channel-specific fix, maintenance             | Kaizen event, waste elimination           | Process centering actions |

## Sub-Phase Reasoning Effort Routing

Managed by `getCoScoutReasoningEffort()` in `packages/core/src/ai/reasoningConfig.ts`:

| Phase / Sub-phase          | Reasoning Effort | Rationale                          |
| -------------------------- | ---------------- | ---------------------------------- |
| FRAME                      | low              | Quick orientation                  |
| SCOUT                      | low              | Pattern exploration                |
| INVESTIGATE / initial      | low              | Exploration mode                   |
| INVESTIGATE / diverging    | low              | Hypothesis generation              |
| INVESTIGATE / validating   | medium           | Hypothesis validation              |
| INVESTIGATE / converging   | **high**         | Root cause synthesis               |
| IMPROVE (no staged data)   | low              | Action planning                    |
| IMPROVE (with staged data) | **high**         | Verification and impact assessment |

## Legacy Functions

`coScout/legacy.ts` preserves the original monolith for test backward-compatibility:

- `buildCoScoutSystemPrompt()` — flat string system prompt (deprecated, use `assembleCoScoutPrompt()`)
- `buildCoScoutInput()` — legacy Responses API input builder (use `buildCoScoutMessageInput()`)
- `buildCoScoutTools()` — legacy tool array builder (use `getToolsForPhase()`)

Do not call legacy functions from new production code. They exist only to avoid breaking existing tests during the migration period.

## References

- [AI Context Engineering](ai-context-engineering.md) — token budgets, caching, pipeline overview
- [AI Architecture](ai-architecture.md) — system architecture, data flow, hook composition
- [ADR-049: CoScout Knowledge Catalyst](../../07-decisions/adr-049-coscout-context-and-memory.md)
- [ADR-060: CoScout Intelligence Architecture](../../07-decisions/adr-060-coscout-intelligence-architecture.md)
- [ADR-029: AI Action Tools](../../07-decisions/adr-029-ai-action-tools.md)
- [ADR-047: Analysis Mode Strategy](../../07-decisions/adr-047-analysis-mode-strategy.md)
