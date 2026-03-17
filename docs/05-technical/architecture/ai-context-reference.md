---
title: AI Context Pipeline Reference
audience: [developer]
category: reference
status: stable
related: [ai-architecture, ai-context-engineering, ai-data-flow, aix-design-system]
---

# AI Context Pipeline Reference

Quick-reference for the AI context assembly and delivery pipeline. For design rationale, see the cross-references at the end.

## 1. Pipeline Overview

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
promptTemplates             -- system/user prompt construction
  |
  v
aiService                   -- provider detection, auth, fetch, caching
  |
  v
Azure AI Foundry            -- OpenAI or Anthropic (auto-detected from endpoint URL)
```

## 2. Module Map

| File                                         | Package                | Responsibility                                                                          |
| -------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------- |
| `packages/core/src/ai/types.ts`              | `@variscout/core`      | `AIContext`, `CoScoutMessage`, `ProcessContext`, `InvestigationPhase` type definitions  |
| `packages/core/src/ai/buildAIContext.ts`     | `@variscout/core`      | `buildAIContext()` assembly + `detectInvestigationPhase()`                              |
| `packages/core/src/ai/promptTemplates.ts`    | `@variscout/core`      | All prompt builders: narration, CoScout, chart insight, report, KB formatting           |
| `packages/core/src/ai/chartInsights.ts`      | `@variscout/core`      | Deterministic insight builders per chart type (`buildIChartInsight`, etc.)              |
| `packages/core/src/ai/suggestedQuestions.ts` | `@variscout/core`      | `buildSuggestedQuestions()` -- context-aware question generation                        |
| `packages/core/src/ai/hash.ts`               | `@variscout/core`      | `djb2Hash()` -- shared hash for cache keys and dedup                                    |
| `packages/core/src/ai/index.ts`              | `@variscout/core`      | Barrel re-exports for the AI module                                                     |
| `packages/hooks/src/useAIContext.ts`         | `@variscout/hooks`     | React hook wrapping `buildAIContext()` with `useMemo`                                   |
| `packages/hooks/src/useNarration.ts`         | `@variscout/hooks`     | Narration lifecycle: debounce, rate limit, in-memory cache, abort                       |
| `packages/hooks/src/useChartInsights.ts`     | `@variscout/hooks`     | Per-chart deterministic insight + optional AI enhancement with fallback                 |
| `packages/hooks/src/useAICoScout.ts`         | `@variscout/hooks`     | CoScout conversation state, streaming, retry, abort                                     |
| `apps/azure/src/hooks/useAIDerivedState.ts`  | `@variscout/azure-app` | Computes violations, variation contributions, selected finding, team, staged comparison |
| `apps/azure/src/hooks/useEditorAI.ts`        | `@variscout/azure-app` | Top-level AI orchestration -- composes all AI hooks + service wiring                    |
| `apps/azure/src/services/aiService.ts`       | `@variscout/azure-app` | HTTP transport: provider detection, auth, retry, localStorage cache                     |

## 3. Key Function Signatures

### buildAIContext

```typescript
function buildAIContext(options: BuildAIContextOptions): AIContext;
```

Assembles `AIContext` from raw analysis state. Derives glossary fragment (category-aware, token-budgeted), maps filters to categories, builds investigation context with hypothesis tree, detects investigation phase, and attaches staged comparison. Pure function, no side effects.

### buildCoScoutSystemPrompt

```typescript
function buildCoScoutSystemPrompt(options?: BuildCoScoutSystemPromptOptions): string;

interface BuildCoScoutSystemPromptOptions {
  glossaryFragment?: string;
  investigation?: AIContext['investigation'];
  teamContributors?: AIContext['teamContributors'];
  sampleCount?: number;
  stagedComparison?: AIContext['stagedComparison'];
  locale?: Locale;
}
```

Builds the system prompt with static glossary prefix (for Azure AI Foundry prompt caching), IDEOI phase-aware instructions, confidence calibration by sample size, team collaboration awareness, and locale hint.

### buildCoScoutMessages

```typescript
function buildCoScoutMessages(
  context: AIContext,
  history: CoScoutMessage[],
  userMessage: string
): Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
```

Returns the full messages array: system prompt (with glossary) + context summary + Knowledge Base results (if available) + recent history (last 10) + user message.

### detectInvestigationPhase

```typescript
function detectInvestigationPhase(
  hypotheses: Hypothesis[],
  findings?: Finding[]
): InvestigationPhase;
// Returns: 'initial' | 'diverging' | 'validating' | 'converging' | 'acting'
```

Deterministic phase detection based on hypothesis tree state: no hypotheses = initial; has children + mostly untested = diverging; some tested + some untested = validating; more tested than untested = converging; any finding has actions = acting.

## 4. Data Flow: Narration

```
AIContext changes
  |
  v
hashContext() via djb2Hash  -- stable key from stats + filters + violations + staged + locale
  |
  +--> cache hit? --------> display immediately (isCached = true)
  |
  v
debounce (2s default)
  |
  v
rate limit (5s min interval)
  |
  v
fetchNarration()            -- aiService: system prompt + user prompt, max_tokens=200, temp=0.3
  |                            retry with exponential backoff (3 attempts)
  v
cache result (in-memory Map in useNarration + localStorage 24h TTL in aiService)
  |
  v
NarrativeBar UI
```

The `useNarration` hook aborts in-flight requests when context changes. The `activeHash` ref prevents re-fetch on React re-renders when context content is unchanged.

## 5. Data Flow: CoScout

```
User message
  |
  v
onBeforeSend (if KB enabled) -- searchRelatedFindings() + searchDocuments()
  |                              results injected into context.knowledgeResults / knowledgeDocuments
  v
buildCoScoutMessages()       -- system + context summary + KB context + history (last 10) + user msg
  |
  v
fetchCoScoutStreamingResponse()  -- SSE stream, max_tokens=800, temp=0.4
  |                                  falls back to fetchCoScoutResponse() on stream error
  v
onChunk() updates placeholder message in real-time
  |
  v
CoScoutPanel UI
```

No caching for CoScout (conversations are contextual). Single retry on 429. Abort controller cancels in-flight requests on new send or unmount.

## 6. Data Flow: Chart Insights

```
Analysis state changes
  |
  v
Deterministic insight (synchronous)  -- buildIChartInsight / buildBoxplotInsight / etc.
  |
  +--> priority <= 1? -----> display deterministic only (skip AI call)
  |
  v
debounce (3s)
  |
  v
buildChartInsightPrompt()    -- chart-specific data + AIContext
  |
  v
fetchChartInsight()           -- aiService: max_tokens=80, temp=0.2, single attempt, no retry
  |
  +--> error? ------> fall back to deterministic text (no error UI for chips)
  |
  v
AI-enhanced chip text
  |
  v
ChartInsightChip UI
```

Low-priority insights (e.g., "Cpk meets target") skip the AI call entirely to save API budget. Dismiss state is session-only, tracked per insight key.

## 7. Caching Strategy

Two independent cache layers, both keyed via `djb2Hash` from `@variscout/core`:

| Layer         | Location                    | Scope               | TTL      | Used By                                                   |
| ------------- | --------------------------- | ------------------- | -------- | --------------------------------------------------------- |
| Hook-level    | In-memory `Map` (React ref) | Per-component mount | Session  | `useNarration`                                            |
| Service-level | `localStorage`              | Cross-session       | 24 hours | `aiService.fetchNarration`, `aiService.fetchChartInsight` |

Cache key composition:

- **Narration (hook):** `djb2Hash(JSON.stringify({ locale, stats subset, filters, violations, stagedComparison }))`
- **Narration (service):** `djb2Hash("${locale}:${userPrompt}")`
- **Chart insight (service):** `"chip-" + djb2Hash("${locale}:${userPrompt}")`

CoScout responses are never cached.

### djb2Hash

```typescript
function djb2Hash(str: string): string;
```

Standard DJB2 hash returning a numeric string. Defined in `packages/core/src/ai/hash.ts`, exported from `@variscout/core`.

## 8. Cross-References

- [AI Architecture](ai-architecture.md) -- high-level design, provider strategy, tier gating
- [AI Context Engineering](ai-context-engineering.md) -- context assembly principles, token budgeting, glossary strategy
- [AI Data Flow](ai-data-flow.md) -- end-to-end data flow diagrams
- [AIX Design System](aix-design-system.md) -- prompt governance, terminology rules, confidence calibration
