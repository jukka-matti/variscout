---
title: 'AI Integration Status'
description: 'Complete AI integration status — Phases 1-3 fully delivered (Mar 2026), knowledge layer shipped behind preview gate'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_ai_status.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

AI integration implemented across Phases 1-3 (Mar 2026). ADR-019 status: Accepted.

## Phase 1-2.5: Client-Side (Complete)

### Core (`@variscout/core/ai/`)
- `buildAIContext()` — structured context from analysis state (stats-only, no raw data)
- `prompts/` — modular prompt modules (coScout, narration, chartInsights, reports, dashboardSummary, shared); governed by `aix-design-system.md`. Old `promptTemplates.ts` barrel deleted Apr 2026.
- `chartInsights.ts` — 4 deterministic builders (I-Chart, Boxplot, Pareto, Stats)
- `suggestedQuestions.ts` — context-aware CoScout question builder + `formatForMobile()` (wired to UI chips Apr 2026)
- `ProcessContext` + `FactorRole` types; `inferFactorRole()` in parser/keywords.ts

### Hooks (`@variscout/hooks`)
- `useAIContext` — memoized context assembly from DataContext
- `useNarration` — lifecycle (idle→loading→ready→error), debounce 2s, rate limit 5s, abort
- `useChartInsights` — deterministic + AI-enhanced per-chart, debounced 3s, session dismiss
- `useAICoScout` — conversation state, streaming, abort, retry, initial narrative seed
- `useKnowledgeSearch` — Knowledge Base search wrapper (state, searchFn injection, enabled flag)

### UI (`@variscout/ui`)
- `NarrativeBar` — shimmer, text, (cached)/(AI) labels, Ask button, error+retry
- `ChartInsightChip` — suggestion/warning/info styles, sparkle+AI label when AI-enhanced, dismiss
- `CoScoutPanelBase` — streaming, suggested questions, overflow menu, copy response
- `FindingsExportMenu` — dropdown (copy text, CSV, JSON, AI report)

## Phase 3: Knowledge Layer (March 2026, Complete)

### Azure Infrastructure
- ARM template: AI Services (OpenAI S0), gpt-4o-mini + gpt-4o deployments, AI Search (basic SKU, semantic ranking)
- Runtime config endpoint (`/config` on server.js) — solves VITE_* build-time baking for Marketplace
- `runtimeConfig.ts` — fetches /config once at startup, consumers fall back to import.meta.env
- Model-agnostic AI service — auto-detects OpenAI vs Anthropic from endpoint URL
- CSP headers updated for AI + Search endpoints

### Findings Indexer
- `infra/functions/index-findings/` — Azure Function, HTTP trigger, tenant isolation via bearer token
- `infra/search-index-schema.json` — 17-field schema with semantic config
- `indexService.ts` — client-side trigger, 5s debounce, fire-and-forget after cloud save

### Findings Export
- `generateFindingsCSV()`, `generateFindingsJSON()` in core/export.ts
- `downloadFindingsCSV()`, `downloadFindingsJSON()` — browser downloads
- `buildReportSystemPrompt()`, `buildReportPrompt()` — AI report generation
- `fetchFindingsReport()` in aiService.ts

### Tests
- ~2,733 vitest tests + 21 Azure Function (Jest) tests all passing

## Not Yet Implemented
- Factor role badges in ColumnMapping UI
- Dual-model routing (fast/reasoning tier)
- Usage tracking / token metrics

## Evidence Map Graph Context (Apr 5 2026)
- `evidenceMapTopology` added to `buildAIContext` — CoScout now sees factor graph structure
- Fields: factorNodes (R²adj, explored, questionCount, findingCount), relationships (5 types + strength), convergencePoints (hubName, hubStatus)
- Enables: unexplored factor detection, topology-based suggestions, convergence recognition, cycle validation

## ADR-060 Updates (Apr 2 2026)
- SharePoint connector REPLACED by Foundry IQ + Blob Storage (ADR-060 supersedes ADR-022/026)
- Knowledge Base now implemented: Document Shelf UI, 4 KB endpoints, KnowledgeAdapter interface
- CoScout tools: 20 total (was 18) — added `answer_question` + renamed `search_knowledge_base`
- `buildAIContext()` enriched with problemStatement, topFindings, overdueActions, focusedQuestion
- Mode-aware question generation completed (yamazumi + performance wired)
- See `project_coscout_intelligence.md` for full ADR-060 details

## Architecture Notes
- Prompt caching: glossary in system prompt (static prefix ≥1,024 tokens) for Azure AI Foundry
- AI transparency: "AI" text label on all AI-generated content (EU AI Act Art. 50 prep)
- Knowledge Base features preview-gated via `isPreviewEnabled('knowledge-base')`
- Model provider auto-detected from endpoint URL (`.openai.azure.com` → OpenAI, `.services.ai.azure.com` → Anthropic)

**Why:** ADR-019 accepted. AI augments quality professionals' analysis. Knowledge layer enables cross-project learning.

**How to apply:** AI UI gated by `AI_ENDPOINT` env var (runtime config) or `VITE_AI_ENDPOINT` (dev). PWA = deterministic chips only. Azure = full AI when endpoint configured + user toggle ON. Knowledge Base = Team AI plan + preview toggle.
