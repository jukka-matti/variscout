# ADR-028: Responses API Migration

**Status**: Accepted

**Date**: 2026-03-19

## Context

VariScout's AI stack had dual-provider support (OpenAI + Anthropic) and dual API paths (Chat Completions + Responses API). The Responses API path was already fully implemented but feature-flagged via `VITE_USE_RESPONSES_API`. This created maintenance overhead:

- ~345 lines of provider detection and dual-format request/response parsing in `aiService.ts`
- ~115 lines of dual-path branching in `useAICoScout.ts`
- Two streaming implementations (Chat Completions SSE + Responses API SSE)
- Feature flag gating on every AI code path
- Anthropic Messages API support that was never deployed to production

The OpenAI Responses API offers significant advantages:

- Server-side conversation state via `previous_response_id` (eliminates client-side message array management)
- 40-80% better prompt cache utilization (automatic server-side caching)
- Structured outputs with JSON Schema validation (guaranteed response format)
- Native function calling with tool call loop
- Assistants API deprecated August 2026 — Responses API is the future path

## Decision

1. **Remove Anthropic provider support** — never deployed, adds complexity
2. **Remove Chat Completions API path** — replaced by Responses API
3. **Remove `VITE_USE_RESPONSES_API` feature flag** — Responses API is the only path
4. **Use structured outputs** for narration (`narrationResponseSchema`) and chart insights (`chartInsightResponseSchema`)
5. **Use function calling** for Knowledge Base intent detection via `suggest_knowledge_search` tool
6. **Add tool call loop** (`streamResponsesWithToolLoop`) for automatic multi-round tool execution

### Tool Definitions

CoScout exposes three tools via `buildCoScoutTools()`:

- `get_chart_data` — Read current chart data (I-Chart, Boxplot, Pareto, Capability)
- `get_statistical_summary` — Get current stats (mean, σ, Cpk, Cp, violations)
- `suggest_knowledge_search` — Search SharePoint Knowledge Base (replaces keyword-based intent detection)

All tools use `strict: true` and `additionalProperties: false` for guaranteed parameter schemas.

## Consequences

### Positive

- **~240 lines removed** net across the codebase
- **Single API path** — easier to maintain and debug
- **Guaranteed response schemas** — structured outputs eliminate parsing failures
- **Better cache utilization** — 40-80% improvement via server-side prompt caching
- **LLM-driven knowledge search** — model decides when to search, not keyword heuristics
- **Foundation for future action tools** — `set_filter`, `compare_categories`, etc.

### Negative

- **OpenAI vendor lock-in** — switching providers requires re-implementing the API layer
- **Azure AI Foundry dependency** — Responses API requires specific Azure deployment configuration

### Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  useEditorAI │────▶│  useAICoScout    │────▶│  responsesApi.ts │
│  (wiring)    │     │  (state mgmt)    │     │  (API client)    │
└─────────────┘     └──────────────────┘     └──────────────────┘
       │                    │                         │
       │              ┌─────┴─────┐             ┌─────┴─────┐
       │              │ toolHandlers│             │ streamWith │
       │              │ (injected)  │             │ ToolLoop  │
       │              └─────┬─────┘             └───────────┘
       │                    │
       ▼                    ▼
┌─────────────┐     ┌──────────────────┐
│  aiService   │     │  Tool Handlers   │
│  (narration, │     │  - get_chart_data│
│   insights,  │     │  - get_stats     │
│   reports)   │     │  - suggest_kb    │
└─────────────┘     └──────────────────┘
```

## Future

Action tools for agentic investigation (Phase 2 — documented but not yet built):

- `set_filter` — Apply category filter to narrow analysis
- `compare_categories` — Compare two categories side-by-side
- `create_finding` — Record an observation as a finding
