---
title: 'AI Context Engineering & Pipeline Reference'
scope: Prompt tiers, context layers, token budgets, phase-aware filtering, caching
audience: [developer]
category: architecture
status: stable
related: [ai-architecture, ai-journey-integration, aix-design-system]
points_to:
  - ai-architecture.md (system architecture, data flow, hook composition)
  - aix-design-system.md (governance, tone, confidence calibration)
---

# AI Context Engineering & Pipeline Reference

> **Scope:** Prompt construction, context assembly, token budgets, and caching pipeline. For the journey-organized AI overview, see [AI Journey Integration](ai-journey-integration.md). For confidence calibration and tone rules, see [AIX Design System](aix-design-system.md).

How VariScout constructs AI prompts and the module-level pipeline that delivers context from analysis state to AI responses.

---

## 1. Three-Tier Prompt Architecture

VariScout structures AI prompts in three tiers, ordered from most static to most dynamic. This aligns with Azure AI Foundry's automatic prompt caching (≥1,024 tokens of static prefix are cached server-side).

### Tier 1 — Static: Role + Methodology + Glossary

Placed first in the system prompt for maximum cache hit rate.

| Content                        | Source                                         | Tokens (~) |
| ------------------------------ | ---------------------------------------------- | ---------- |
| CoScout role definition        | `buildCoScoutSystemPrompt()`                   | ~150       |
| Tools + questions + principles | Hardcoded in prompt template                   | ~200       |
| Glossary terms                 | `buildGlossaryPrompt(categories, maxTerms)`    | ~400       |
| Methodology concepts           | `buildGlossaryPrompt({includeConcepts: true})` | ~200       |
| **Total static prefix**        |                                                | **~950**   |

The static prefix exceeds 1,024 tokens when glossary + concepts are both included, enabling Azure AI Foundry prompt caching.

### Tier 2 — Semi-Static: Investigation State + Ideas

Changes when the investigation progresses (new hypotheses, status changes, ideas added).

| Content                     | Source                                          | Tokens (~) |
| --------------------------- | ----------------------------------------------- | ---------- |
| Problem statement           | `ProcessContext.problemStatement`               | ~20        |
| Hypothesis tree             | `AIContext.investigation.hypothesisTree`        | ~50-200    |
| Improvement ideas           | `AIContext.investigation.allHypotheses[].ideas` | ~30-100    |
| Phase-specific instructions | Phase detection in prompt template              | ~50        |
| Investigation categories    | `AIContext.investigation.categories`            | ~30        |

### Tier 3 — Dynamic: Stats + Filters

Changes on every filter drill or data update. Placed in a separate system message.

| Content             | Source                       | Tokens (~) |
| ------------------- | ---------------------------- | ---------- |
| Current statistics  | `AIContext.stats`            | ~30        |
| Active filters      | `AIContext.filters`          | ~20-50     |
| Violations          | `AIContext.violations`       | ~20        |
| Findings summary    | `AIContext.findings`         | ~30        |
| Process description | `ProcessContext.description` | ~20        |

---

## 2. Phase-Aware Context Filtering

The CoScout system prompt includes phase-specific instructions based on deterministic phase detection (`detectInvestigationPhase()`):

| Phase      | Instruction Focus                                                                                                |
| ---------- | ---------------------------------------------------------------------------------------------------------------- |
| Initial    | Help identify which chart to examine first and what patterns to look for                                         |
| Diverging  | Encourage exploring hypotheses across different factor categories                                                |
| Validating | Help interpret η² — contribution, not causation                                                                  |
| Converging | Help evaluate suspected root cause. Brainstorm improvements. Compare effort vs impact. Reference existing ideas. |

> **Note:** The code type `InvestigationPhase` includes `'acting'` for the IMPROVE phase. During IMPROVE, CoScout shifts to monitoring Cpk and suggesting corrective actions (PDCA cycle).

When converging with supported hypotheses that have improvement ideas, the prompt includes the existing ideas and instructs CoScout to build on them or suggest alternatives.

---

## 3. Token Budget Management

| Consumer             | Max Context | Model Tier |
| -------------------- | ----------- | ---------- |
| NarrativeBar         | ~2K tokens  | fast       |
| ChartInsightChip     | ~1K tokens  | fast       |
| CoScout conversation | ~8K tokens  | reasoning  |

Budget is managed by:

- `maxGlossaryTerms` parameter (default 40) limits glossary size
- History truncation (last 10 messages for CoScout)
- Category-based glossary filtering (only include relevant categories)

---

## 4. Prompt Caching Alignment

Azure AI Foundry caches the longest matching prefix of the system prompt. VariScout maximizes cache hits by:

1. Placing static content (role + methodology + glossary) first in the system message
2. Placing variable content (stats, filters) in a separate system message
3. Keeping the static prefix stable across requests (>1,024 tokens)
4. Using `prompt_cache_key` on all Responses API requests for explicit server-side caching

This means the first ~950 tokens of every CoScout request are served from cache after the first call, reducing latency and cost.

### `prompt_cache_key` Usage

All Responses API requests include a `prompt_cache_key` for explicit server-side system prompt caching:

| Feature        | Cache Key             | Tier      |
| -------------- | --------------------- | --------- |
| Narration      | `variscout-narration` | fast      |
| Chart Insights | `variscout-chip`      | fast      |
| CoScout        | `variscout-coscout`   | reasoning |
| Report         | `variscout-report`    | reasoning |

### System Prompt Token Threshold Verification

Dev-only diagnostics warn if system prompts fall below the 1,024-token caching threshold:

```typescript
// Emitted in dev mode by buildCoScoutSystemPrompt() and buildNarrationSystemPrompt()
console.warn(
  `[VariScout AI] CoScout system prompt ~${estTokens} tokens. Prompt caching requires ≥1,024.`
);
```

Unit tests verify the CoScout system prompt with a realistic glossary exceeds the threshold. Narration prompts are intentionally compact; caching relies on `store: true` and `prompt_cache_key`.

---

## 5. Extended Dynamic Context Fields

### `activeChart` (Tier 3 — Dynamic)

- **Type:** `'ichart' | 'boxplot' | 'pareto' | 'capability' | 'stats' | undefined`
- **Source:** Carousel view state (mobile) or focused chart (desktop)
- **Purpose:** CoScout knows which chart the user is currently viewing/asking about

### `variationContributions` (Tier 3 — Dynamic)

- **Type:** `Array<{ factor: string; etaSquared: number; category?: string }>`
- **Source:** `useVariationTracking` output (η² per factor); `category` auto-derived from `InvestigationCategory[]`
- **Purpose:** CoScout can answer "Which factor matters most?" with data-backed responses

### `factorRoles` (Tier 3 — Dynamic)

- **Type:** `Array<{ factor: string; role: string }>` (derived, not persisted)
- **Source:** Built at context-build time by `buildAIContext()`
- **Purpose:** Gives CoScout domain awareness of what each factor represents in the process

### `drillPath` (Tier 3 — Dynamic)

- **Type:** `string[]` — ordered factor names from filterStack
- **Purpose:** CoScout understands the analyst's reasoning trajectory through the data

### `focusContext` (Between Tier 2 and Tier 3)

Populated by "Ask CoScout about this" actions. Injected as an additional system message to preserve Tier 1 prompt caching.

```typescript
focusContext?: {
  chartType?: 'ichart' | 'boxplot' | 'pareto' | 'capability' | 'stats';
  category?: { name: string; mean?: number; contributionPct?: number };
  finding?: { text: string; status: string; hypothesis?: string };
}
```

### `selectedFinding` (Tier 2 — Investigation)

Already typed in `AIContext.investigation`. Populated from FindingsPanel active selection. Used by `buildSuggestedQuestions()` and `buildCoScoutSystemPrompt()`.

### `teamContributors` (Teams Context)

- **Type:** `{ count: number; hypothesisAreas: string[] }`
- **Purpose:** CoScout coordinates multi-investigator Teams scenarios
- **Note:** Only populated in Azure Team plan when findings have author metadata

---

## 6. Locale-Aware Prompting

Prompts stay in English to preserve prompt caching. Only the response language switches. See [ADR-025](../../07-decisions/adr-025-internationalization.md).

### `buildLocaleHint()`

Prepends a `LANGUAGE: Respond in [locale]...` directive to system prompts. When locale is `en`, no hint is emitted. Token impact: ~15 tokens per non-English locale.

### Bilingual Glossary

`buildGlossaryPrompt({ locale })` produces bilingual sub-lines when a non-English locale is active:

```
**UCL**: Upper Control Limit — 3σ above the process mean
  DE: **OKG**: Obere Kontrollgrenze — 3σ über dem Prozessmittelwert
```

Token impact: ~30% increase in the glossary section for non-English locales.

### AI Component Locale Behavior

| Component        | Locale Flow                                                 |
| ---------------- | ----------------------------------------------------------- |
| NarrativeBar     | Via `AIContext.locale` → `buildSummaryPrompt()`             |
| ChartInsightChip | Explicit `locale` parameter on `fetchChartInsight()`        |
| CoScout          | Via `buildCoScoutMessages()` → `buildCoScoutSystemPrompt()` |

Deterministic insight builders are locale-unaware (static English strings); only the AI enhancement layer respects locale.

---

## 7. Staged Comparison Context

When the analysis is in staged/verification mode:

```typescript
stagedComparison?: {
  stageNames: [string, string];
  deltas: {
    mean: number;
    sigma: number;
    cpkBefore: number | null;
    cpkAfter: number | null;
    colorCoding: 'improved' | 'degraded' | 'unchanged';
  };
}
```

- **`buildSummaryPrompt()`** — Switches to verification-focused directive
- **`buildCoScoutSystemPrompt()`** — Replaces acting-phase instruction with verification context

---

## 8. Knowledge Documents Context

When the Knowledge Base is available (Azure Team AI plan):

```typescript
knowledgeDocuments?: Array<{
  title: string;
  snippet: string;       // max 300 characters
  source: string;
  url?: string;
}>;
```

`formatKnowledgeContext()` transforms documents into `[From: <source>]` prefixed blocks. Typical token cost: ~50-150 tokens.

---

## 9. Pipeline Overview

```
Editor (analysis state)
  |
  v
useAIDerivedState          -- violations, contributions, selected finding, team, staged
  |
  v
useAIContext                -- memoized assembly via buildAIContext()
  |
  v
buildAIContext()            -- structured AIContext with glossary, investigation, staged
  |
  +---> useNarration        -- summary narration (debounce + cache + rate limit)
  +---> useAICoScout        -- conversational CoScout (streaming + KB injection)
  +---> useChartInsights    -- per-chart insight chips (deterministic + AI enhancement)
  |
  v
prompts/                    -- modular prompt construction (shared, narration, coScout, chartInsights, reports)
  |
  v
aiService                   -- auth, fetch, caching (single path via responsesApi.ts)
  |
  v
Azure AI Foundry            -- Azure OpenAI only (ADR-028; Responses API)
```

## 10. Module Map

| File                                         | Package                | Responsibility                                                                                                                                                                                    |
| -------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/core/src/ai/types.ts`              | `@variscout/core`      | `AIContext`, `CoScoutMessage`, `ProcessContext`, `InvestigationPhase` type definitions                                                                                                            |
| `packages/core/src/ai/buildAIContext.ts`     | `@variscout/core`      | `buildAIContext()` assembly + `detectInvestigationPhase()`                                                                                                                                        |
| `packages/core/src/ai/prompts/`              | `@variscout/core`      | Modular prompt builders: `shared.ts`, `narration.ts`, `coScout.ts`, `chartInsights.ts`, `reports.ts`                                                                                              |
| `packages/core/src/ai/promptTemplates.ts`    | `@variscout/core`      | Thin re-export barrel for backward compatibility                                                                                                                                                  |
| `packages/core/src/ai/responsesApi.ts`       | `@variscout/core`      | Sole API client — Azure AI Foundry Responses API. `sendResponsesTurn()` (structured outputs) and `streamResponsesWithToolLoop()` (streaming + tool loop). Chat Completions API removed (ADR-028). |
| `packages/core/src/ai/tracing.ts`            | `@variscout/core`      | AI observability: `traceAICall` wrapper, `getTraceStats`                                                                                                                                          |
| `packages/core/src/ai/chartInsights.ts`      | `@variscout/core`      | Deterministic insight builders per chart type                                                                                                                                                     |
| `packages/core/src/ai/suggestedQuestions.ts` | `@variscout/core`      | `buildSuggestedQuestions()` — context-aware question generation                                                                                                                                   |
| `packages/core/src/ai/hash.ts`               | `@variscout/core`      | `djb2Hash()` — shared hash for cache keys and dedup                                                                                                                                               |
| `packages/hooks/src/useAIContext.ts`         | `@variscout/hooks`     | React hook wrapping `buildAIContext()` with `useMemo`                                                                                                                                             |
| `packages/hooks/src/useNarration.ts`         | `@variscout/hooks`     | Narration lifecycle: debounce, rate limit, cache, abort                                                                                                                                           |
| `packages/hooks/src/useChartInsights.ts`     | `@variscout/hooks`     | Per-chart deterministic + optional AI enhancement                                                                                                                                                 |
| `packages/hooks/src/useAICoScout.ts`         | `@variscout/hooks`     | CoScout conversation state, streaming, retry, abort                                                                                                                                               |
| `apps/azure/src/hooks/useAIDerivedState.ts`  | `@variscout/azure-app` | Violations, variation contributions, selected finding, team, staged                                                                                                                               |
| `apps/azure/src/hooks/useEditorAI.ts`        | `@variscout/azure-app` | Top-level AI orchestration — composes all AI hooks                                                                                                                                                |
| `apps/azure/src/services/aiService.ts`       | `@variscout/azure-app` | HTTP transport: auth, retry, localStorage cache. Provider detection removed (ADR-028); delegates to `responsesApi.ts`.                                                                            |

## 11. Key Function Signatures

### buildAIContext

```typescript
function buildAIContext(options: BuildAIContextOptions): AIContext;
```

Assembles `AIContext` from raw analysis state. Pure function, no side effects.

### buildCoScoutSystemPrompt

```typescript
function buildCoScoutSystemPrompt(options?: BuildCoScoutSystemPromptOptions): string;
```

Builds the system prompt with static glossary prefix, investigation-phase-aware instructions, confidence calibration, team awareness, and locale hint.

### buildCoScoutMessages

```typescript
function buildCoScoutMessages(
  context: AIContext,
  history: CoScoutMessage[],
  userMessage: string
): Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
```

Returns system prompt + context summary + KB results + recent history (last 10) + user message.

### detectInvestigationPhase

```typescript
function detectInvestigationPhase(
  hypotheses: Hypothesis[],
  findings?: Finding[]
): InvestigationPhase;
// Returns: 'initial' | 'diverging' | 'validating' | 'converging' | 'improving'
```

## 12. Data Flow Details

### Narration

```
AIContext changes → hashContext() → cache hit? → display immediately
                                  → debounce (2s) → rate limit (5s) → fetchNarration()
                                  → cache result (in-memory + localStorage 24h TTL) → NarrativeBar UI
```

### CoScout

```
User message → buildCoScoutMessages() → fetchCoScoutStreamingResponse() (SSE)
             → onChunk() updates message → CoScoutPanel UI
```

No caching (conversations are contextual). Single retry on 429.

### Chart Insights

```
Analysis changes → deterministic insight (sync) → priority ≤ 1? → display only
                                                → debounce (3s) → fetchChartInsight()
                                                → error? → fall back to deterministic
                                                → ChartInsightChip UI
```

## 13. Caching Strategy

| Layer         | Location      | TTL      | Used By                       |
| ------------- | ------------- | -------- | ----------------------------- |
| Hook-level    | In-memory Map | Session  | `useNarration`                |
| Service-level | localStorage  | 24 hours | `aiService` (narration/chips) |

Cache keys use `djb2Hash` from `@variscout/core`.

---

## References

- [Effective Context Engineering — Anthropic](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Azure AI Foundry Prompt Caching — Microsoft Learn](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/prompt-caching)
- [AI Architecture](ai-architecture.md) — system architecture, data flow, hook composition
- [AI Journey Integration](ai-journey-integration.md) — entry point for AI × journey overview
- [AIX Design System](aix-design-system.md) — governance, tone, confidence calibration
- [Knowledge Model](knowledge-model.md)
- [ADR-019: AI Integration](../../07-decisions/adr-019-ai-integration.md)
- [ADR-027: AI Collaborator Evolution](../../07-decisions/adr-027-ai-collaborator-evolution.md)
- [ADR-019: AI Integration](../../07-decisions/adr-019-ai-integration.md)
