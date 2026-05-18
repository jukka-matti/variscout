---
title: 'CoScout Intelligence Architecture'
description: 'ADR-060 — five-pillar knowledge architecture with Foundry IQ, implemented Apr 2 2026 on feature/adr-060-coscout-intelligence branch (23 commits)'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_coscout_intelligence.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

ADR-060: CoScout Intelligence Architecture — comprehensive redesign of how CoScout accesses and uses investigation knowledge.

**Why:** Context pipeline audit revealed CoScout operates on ~15-25% of investigation knowledge. Finding comments, outcomes, problem statement (dead code), and overdue actions were completely absent. External documents (SOPs, FMEAs) inaccessible. Mode-aware question generation 70% complete.

**How to apply:** Five pillars, all implemented on `feature/adr-060-coscout-intelligence` branch:

**Pillar 1 — Hot Context Quality (IMPLEMENTED):**
- `buildAIContext()` enriched: problemStatement (Watson's 3 Qs), topFindings (top-5 with outcomes), overdueActions (top-3), focusedQuestionId/Text, manualNote, linkedFindingIds, enriched ideas (direction, timeframe, riskLevel)
- Position-aware prompt ordering: start (problem + causes + focused Q), middle (findings + questions), end (overdue + outcomes)
- ~420 additional tokens within 12K budget

**Pillar 2 — Investigation Retrieval (IMPLEMENTED):**
- `investigationSerializer.ts` serializes findings, answered questions, ideas to JSONL in Blob Storage
- Debounced 5s, async, piggybacked on `onFindingsChange`/`onQuestionsChange` callbacks
- `useInvestigationIndexing` hook wired in Editor.tsx alongside orchestration
- Foundry IQ auto-indexes JSONL files for on-demand retrieval

**Pillar 3 — External Document KB (IMPLEMENTED):**
- Foundry IQ with Blob Storage knowledge source (auto-chunking, auto-vectorization, hybrid BM25+vector+RRF)
- server.js migrated to Express; 4 new endpoints: `/api/kb-upload`, `/api/kb-search`, `/api/kb-list`, `/api/kb-delete`
- `KnowledgeAdapter` interface in `@variscout/core/ai` with `FoundryIQKnowledgeAdapter` primary, `AISearchKnowledgeAdapter` and `BlobKnowledgeAdapter` fallbacks
- Document Shelf ("Docs" tab) in PI panel — conditional 4th primary tab (Team tier only)
- `useDocumentShelf` hook: upload, delete, download, client-side filter, alphabetical sort
- Drop zone on top, filter input, scrollable list, auto-index summary footer
- ARM template: text-embedding-3-small deployment, knowledge-base search index, app settings
- Beta positioning via existing `isPreviewEnabled('knowledge-base')` gate
- Cost: ~€70/month added to Team tier

**Pillar 4 — Question ↔ CoScout Interaction (IMPLEMENTED):**
- `focusedQuestionId` + `focusedQuestionText` wired from investigationStore → AI context
- `answer_question` action tool (INVESTIGATE+ phase-gated, proposal pattern) — 20th CoScout tool
- manualNote and linkedFindingIds in allQuestions context
- Question answer documents feed KB automatically

**Pillar 5 — Mode-Aware Question Completion (IMPLEMENTED):**
- Yamazumi question generator wired into `useQuestionGeneration` pipeline (was orphaned)
- Performance channel ranking questions implemented (`generateChannelRankingQuestions`)
- Evidence sorting uses `rSquaredAdj` as universal carrier (all generators store their metric there)
- CoScout validation method awareness: strategy's evidenceLabel, validationMethod, questionFocus in system prompt

**CoScout Inline Citation Preview (IMPLEMENTED):**
- `KnowledgeCitationCard` — 3 variants: document (blue), finding (amber), answer (blue-light)
- `[REF:document:id]` and `[REF:answer:id]` markers extend ADR-057 visual grounding
- Click toggles inline preview card below CoScout message, auto-expand first per message

**Implementation status (Apr 2 2026):**
- Pillars 1, 4, 5: FULLY FUNCTIONAL end-to-end
- Pillar 2: Code complete, needs Foundry IQ infra to verify auto-indexing
- Pillar 3: Endpoints + UI wired, missing FoundryIQKnowledgeAdapter (needs Azure AI Search deployed)
- Document Shelf: WIRED in Azure app (EditorDashboardView → ProcessIntelligencePanel → PIPanelBase)
- Evidence sorting: rSquaredAdj confirmed as universal carrier, documented with evidenceMetric prop
- ~85% code complete, ~55% functional end-to-end

**Supersedes:** ADR-022 (Knowledge Layer), ADR-026 (SharePoint KB)
**Extends:** ADR-049 (Knowledge Catalyst — 7 capabilities preserved), ADR-054 (Mode-Aware Questions — completed)

**Key files:**
- Types: `packages/core/src/ai/types.ts`, `packages/core/src/ai/knowledgeAdapter.ts`
- Context: `packages/core/src/ai/buildAIContext.ts`, `packages/core/src/ai/prompts/coScout.ts`
- Tools: `packages/core/src/ai/actionTools.ts` (20 tools), `apps/azure/src/features/ai/actionToolHandlers.ts`
- Questions: `packages/hooks/src/useQuestionGeneration.ts`, `packages/core/src/stats/channelQuestions.ts`
- KB: `apps/azure/server.js` (Express, 7 endpoints), `apps/azure/src/services/investigationSerializer.ts`
- UI: `packages/ui/src/components/DocumentShelf/`, `packages/ui/src/components/CoScoutPanel/KnowledgeCitationCard.tsx`
- Infra: `infra/modules/search.bicep`, `infra/modules/ai-services.bicep`, `infra/mainTemplate.json`
- Hooks: `packages/hooks/src/useDocumentShelf.ts`, `apps/azure/src/features/ai/useInvestigationIndexing.ts`
