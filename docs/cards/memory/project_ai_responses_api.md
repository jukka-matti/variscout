---
title: 'Responses API Migration'
description: 'ADR-028 — AI stack modernized to Responses API only, OpenAI only, with function calling and structured outputs'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 0728c532381140fe
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_ai_responses_api.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

AI stack modernized per ADR-028 (2026-03-19):
- Anthropic provider + Chat Completions API fully removed from aiService.ts
- Single API path through `responsesApi.ts` (`sendResponsesTurn`, `streamResponsesWithToolLoop`)
- Structured outputs: `narrationResponseSchema`, `chartInsightResponseSchema` in `schemas.ts`
- Function calling: `suggest_knowledge_search` tool for LLM-driven KB intent detection
- All CoScout tools use `strict: true` + `additionalProperties: false`
- `VITE_USE_RESPONSES_API` feature flag removed — always on
- `useAICoScout` takes `responsesApiConfig` + `toolHandlers` (no more `fetchResponse`/`fetchStreamingResponse`)
- `useEditorAI` constructs `toolHandlers` map with `get_chart_data`, `get_statistical_summary`, `suggest_knowledge_search`
- Cache check moved before `getResponsesApiConfig()` in `fetchNarration`/`fetchChartInsight` (avoids unnecessary auth on cache hit)

**Why:** Dual-provider + dual-API complexity added ~345 lines of unused Anthropic code and feature flag branching. Responses API provides better cache utilization (40-80%), guaranteed schemas, server-side conversation state.

**How to apply:** All AI service code goes through `responsesApi.ts`. No Chat Completions references. Provider is always Azure OpenAI.
