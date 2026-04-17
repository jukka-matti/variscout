---
name: editing-coscout-prompts
description: Use when editing CoScout AI prompts or packages/core/src/ai/prompts/. Modular architecture, assembleCoScoutPrompt() entry point (tier1/tier2/tier3 structure, replaces deprecated buildCoScoutSystemPrompt()), 25-tool registry with phase/mode/tier gating, mode-aware methodology coaching, visual grounding markers, investigation context wiring.
---

# Editing CoScout Prompts

## When this skill applies

Use this skill when editing anything under `packages/core/src/ai/prompts/coScout/` or
when modifying CoScout's behavior — prompt content, tool definitions, context wiring, or
mode-specific coaching language.

## Modular prompt architecture (ADR-068)

`assembleCoScoutPrompt()` in `packages/core/src/ai/prompts/coScout/index.ts` is the
canonical entry point. It accepts `AssembleCoScoutPromptOptions` and returns
`CoScoutPromptTiers`:

```typescript
interface CoScoutPromptTiers {
  tier1Static: string;    // Cacheable role + glossary prefix
  tier2SemiStatic: string; // Phase + mode + investigation context
  tier3Dynamic: string;   // Reserved — empty in current implementation
  tools: ToolDefinition[]; // Phase/mode/tier-gated tool definitions
}
```

**Tier 1 (Static)** holds the role definition (`buildRole()`), the `TERMINOLOGY_INSTRUCTION`
enforcement block, an optional locale hint, and an optional glossary fragment injected by
the app layer. This tier is session-invariant and serves as the prompt-cacheable prefix
for Azure AI Foundry (requires ≥1,024 tokens).

**Tier 2 (Semi-static)** holds phase coaching (`buildPhaseCoaching()`), mode workflow
guidance (`buildModeWorkflow()`), and the investigation/data/knowledge context blocks
(`formatInvestigationContext`, `formatDataContext`, `formatKnowledgeContext`). It
regenerates on navigation events — phase transitions, mode switches, and drill path changes.

**Tier 3 (Dynamic)** is reserved for future surface-specific context (e.g., chart data
for a right-click "Ask CoScout" contextClick surface). The current implementation always
returns an empty string here.

**Deprecated:** `buildCoScoutSystemPrompt()` in `legacy.ts`. It remains in the codebase
only for test backward-compatibility. Do not call it from new production code. New work
uses `assembleCoScoutPrompt()` exclusively.

## Directory structure

```
packages/core/src/ai/prompts/coScout/
├── index.ts          — assembleCoScoutPrompt() entry point + barrel exports
├── role.ts           — Tier 1: CoScout identity, investigation principles, security, REF markers
├── types.ts          — CoScoutPromptTiers, CoScoutSurface, AssembleCoScoutPromptOptions
├── messages.ts       — buildCoScoutMessageInput() — Responses API input array builder
├── legacy.ts         — Original monolith (deprecated, test-only backward compat)
├── tools/
│   ├── index.ts      — Barrel: TOOL_REGISTRY, getToolsForPhase(), ToolRegistryEntry, ToolName
│   └── registry.ts   — 25 tools with phase/mode/tier gating + dynamic condition functions
├── phases/
│   ├── index.ts      — buildPhaseCoaching() dispatcher + barrel exports
│   ├── frame.ts      — FRAME coaching: problem framing, measure selection
│   ├── scout.ts      — SCOUT coaching: pattern identification, chart reading
│   ├── investigate.ts — INVESTIGATE coaching dispatcher → sub-phase modules
│   └── improve.ts    — IMPROVE coaching: PDCA, action planning, kaizen verification
├── modes/
│   ├── index.ts      — buildModeWorkflow() dispatcher + barrel exports
│   ├── standard.ts   — SPC terminology, Cpk workflow, factor-driven investigation
│   ├── performance.ts — Multi-channel terminology, worst-channel Cpk, channel ranking
│   ├── yamazumi.ts   — Lean terminology, VA ratio, waste categories, bottleneck identification
│   ├── capability.ts — Capability-focused coaching (centering vs spread diagnostic)
│   └── defect.ts     — Defect terminology, failure modes, containment vs prevention
└── context/
    ├── index.ts      — Barrel: formatInvestigationContext, formatDataContext, formatKnowledgeContext
    ├── investigation.ts — Problem statement, question tree, hubs, causal links, findings
    ├── dataContext.ts   — Active chart, drill scope, top factors, stats snapshot, violations
    └── knowledgeContext.ts — KB documents, knowledge results formatting
```

Note: there is no `process-flow` mode file yet — Process Flow mode is design-only as of
Apr 2026 and has no prompt module.

## 25-tool registry

`packages/core/src/ai/prompts/coScout/tools/registry.ts` is the canonical registry.
Verified tool count: **25 tools** (grep `^  [a-z_]*: {$` returns 25 entries).

Each tool is defined once as a `ToolRegistryEntry`:

```typescript
interface ToolRegistryEntry {
  definition: ToolDefinition;  // Responses API function schema
  classification: 'read' | 'action'; // read = auto-execute; action = user confirmation required
  phases: JourneyPhase[];      // Journey phases where available
  modes?: AnalysisMode[];      // Optional: restrict to specific modes
  tier?: 'team';               // Optional: restrict to team-tier customers
  condition?: (ctx) => boolean; // Optional: dynamic availability at runtime
}
```

`getToolsForPhase(phase, mode, options)` filters the registry by all four gates and
returns `ToolDefinition[]` for the Responses API.

**Tool categories:**

| Category | Tools | Available from |
|----------|-------|----------------|
| Read (always) | `get_chart_data`, `get_statistical_summary`, `search_knowledge_base`, `get_available_factors`, `compare_categories`, `get_finding_attachment` | FRAME |
| SCOUT+ action | `apply_filter`, `switch_factor`, `clear_filters`, `create_finding`, `search_project`, `navigate_to` | SCOUT |
| INVESTIGATE+ action | `create_question`, `answer_question`, `suggest_suspected_cause`, `connect_hub_evidence`, `suggest_improvement_idea`, `suggest_action`, `spark_brainstorm_ideas`, `suggest_save_finding` | INVESTIGATE |
| Evidence Map | `suggest_causal_link`, `highlight_map_pattern` | INVESTIGATE |
| Team-only | `share_finding`, `publish_report`, `notify_action_owners` | INVESTIGATE (notify: IMPROVE only) |

**Adding a new tool:** register in `registry.ts` with full gate metadata — phases, optional
modes, optional tier, optional condition. Without all applicable gates, tools leak into
wrong contexts (e.g., a team-only tool appearing in the PWA free tier).

## Mode-aware methodology coaching

The strategy pattern (ADR-047) couples mode resolution to CoScout coaching. Each analysis
mode carries methodology hints consumed by `buildModeWorkflow()` in tier 2:

- **Standard** — classic SPC language: Cpk, Cp, control limits, factor-driven stratification,
  ANOVA η² ranking. Entry point for most investigations.
- **Performance** — multi-channel thinking: worst-channel drill, per-channel Cpk comparison,
  channel ranking. Suited for fill heads, nozzles, cavities.
- **Yamazumi** — lean language: VA ratio, NVA-required, waste, wait time, takt time,
  bottleneck isolation, kaizen event framing.
- **Capability** — capability-focused: centering vs spread split, Cp potential vs Cpk
  actual, spec limit positioning.
- **Defect** — defect rate language: defect rate per time unit, PPM, Pareto of failure
  modes, event→rate transform awareness, containment vs prevention framing.

Phase coaching in `phases/` also varies per mode — see the Phase × Mode matrix in
`coscout-prompt-architecture.md`. Mode coaching lives in `modes/` only; do not hardcode
mode-specific language in `role.ts` or `phases/`.

See the `editing-analysis-modes` skill for mode-specific statistical and transform detail.

## Context wiring

`assembleCoScoutPrompt()` accepts an `AIContext` object that flows into the tier 2
context formatters:

- `context.investigation` → `formatInvestigationContext()` — problem statement, question
  tree, SuspectedCause hubs, causal links, findings summary
- `context` (full) → `formatDataContext()` — active chart, drill scope, top factors by
  η², stats snapshot, spec violations
- `context.knowledgeResults` + `context.knowledgeDocuments` → `formatKnowledgeContext()`
  — KB documents, past findings from other projects

In the Azure app, this context is assembled by
`apps/azure/src/features/ai/useAIOrchestration.ts`. It reads `causalLinks` and
`suspectedCauses` from `useInvestigationStore` and wires `evidenceMapTopology` as a
prop. Changing the `AIContext` shape requires updating **both** the hook **and** the
relevant formatter in `packages/core/src/ai/prompts/coScout/context/`.

## Visual grounding (ADR-057)

CoScout references chart elements using REF markers, not raw data values. REF markers
identify elements by chart type and ID, for example:

```
REF:boxplot:productLine   — references the productLine factor in the Boxplot
REF:ichart:point:42       — references a specific I-Chart point by index
REF:pareto:category:NightShift — references a Pareto bar
```

REF markers are rendered as clickable highlights in the UI. This approach upholds the
customer-owned data principle (data does not leave the browser embedded in AI responses)
and aligns with the "contribution not causation" framing — CoScout points to evidence, it
does not assert values.

The REF marker system is defined in `role.ts` (tier 1). Do not reference raw data rows or
computed statistics directly in prompt text.

## Sub-phase reasoning effort

`getCoScoutReasoningEffort()` in `packages/core/src/ai/reasoningConfig.ts` routes effort
by phase and sub-phase:

| Phase / sub-phase | Effort | Rationale |
|---|---|---|
| FRAME | low | Quick orientation |
| SCOUT | low | Pattern exploration |
| INVESTIGATE / initial | low | Exploration mode |
| INVESTIGATE / diverging | low | Hypothesis generation |
| INVESTIGATE / validating | medium | Hypothesis validation |
| INVESTIGATE / converging | **high** | Synthesis of evidence |
| IMPROVE (no staged data) | low | Action planning |
| IMPROVE (with staged data) | **high** | Verification and impact assessment |

## Gotchas

- **Using `buildCoScoutSystemPrompt()` for new work** — it is deprecated. New code uses
  `assembleCoScoutPrompt()`. The deprecated function remains only for existing test
  fixtures; do not add new callers.
- **Forgetting to gate a new tool** in `tools/registry.ts` — tools without explicit
  phase/mode/tier metadata are visible in every context. Always set `phases`, and set
  `tier: 'team'` for any tool that requires Azure Team features.
- **Including raw data rows in prompts** — violates the customer-owned data principle
  AND CoScout's contribution-not-causation framing (P5). Reference chart elements using
  REF markers, not data values or computed statistics embedded in strings.
- **Writing "root cause" in any prompt string** — use "contribution" or "contributing
  factor". The constitution's P5 principle is enforced in prompt content. ANOVA shows
  contribution (η²), not proof of causation. This applies everywhere: role.ts, phases/,
  modes/, context formatters, and tool descriptions.
- **Tier boundaries matter for caching** — tier 1 is prompt-cacheable across sessions
  (session-invariant content only). Tier 3 changes per conversation turn. Moving content
  from tier 1 → tier 3 breaks the cache hit rate. Moving content from tier 3 → tier 1
  can embed ephemeral investigation state into a supposedly stable prefix.
- **Mode coaching lives in `modes/` only** — do not hardcode mode-specific language in
  `role.ts` or `phases/`. The strategy pattern exists so each mode carries its own
  coaching; inline mode ternaries in shared files defeat that design.
- **`legacy.ts` still calls `buildCoScoutSystemPrompt()` internally** — this is correct
  for test backward-compatibility. Do not replicate this pattern in new code.

## Reference

- ADR-047 `docs/07-decisions/adr-047-analysis-mode-strategy.md` — strategy pattern + mode coaching
- ADR-049 `docs/07-decisions/adr-049-coscout-context-and-memory.md` — knowledge catalyst, context
- ADR-057 `docs/07-decisions/adr-057-visual-grounding.md` — REF markers
- ADR-060 `docs/07-decisions/adr-060-coscout-intelligence-architecture.md` — 5-pillar architecture
- ADR-068 `docs/07-decisions/adr-068-coscout-cognitive-redesign.md` — modular redesign, tier enforcement
- `docs/05-technical/architecture/coscout-prompt-architecture.md` — canonical architecture doc
- `packages/core/src/ai/prompts/coScout/` — source of truth
- `packages/core/src/ai/prompts/coScout/tools/registry.ts` — 25-tool registry
- `packages/core/src/ai/prompts/coScout/legacy.ts` — deprecated `buildCoScoutSystemPrompt()`
- `apps/azure/src/features/ai/useAIOrchestration.ts` — context wiring hook
