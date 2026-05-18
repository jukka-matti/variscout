---
title: 'CoScout Cognitive Redesign'
description: 'Apr 5 2026 — monolithic coScout.ts (1,691 lines) replaced by modular coScout/ directory. 17 commits, 151 new tests, 2 code reviews, ADR-068.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 055183d368d688ff
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_coscout_cognitive_redesign.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

## What Changed

**Problem:** CoScout prompt built across 10 ADRs with geological layers. Contradictions (dual suspected cause systems, brainstorm vs tool schema), redundancies (phase instructions ×2, mode terminology ×3), invisible capabilities (best model equation, drill scope, Evidence Map topology computed but never surfaced).

**Solution:** Full cognitive redesign — one coherent mental model per phase × mode.

### Phase 1: Foundation (10 commits)
- `coScout/` directory with `assembleCoScoutPrompt(phase, mode, surface, context)` → `CoScoutPromptTiers`
- Typed tool registry: 25 tools in `tools/registry.ts`, phase/mode/tier gated, `getToolsForPhase()`
- Extracted modules: `role.ts`, `phases/` (4 files), `modes/` (4 files), `context/` (3 formatters)
- Prompt tier types enforced: tier1Static (cached), tier2SemiStatic, tier3Dynamic
- Sub-phase reasoning effort: converging=high, validating=medium, verification=high
- Tier safety regression tests

### Phase 2: Intelligence + Integration (7 commits)
- Surfaced invisible data: bestModelEquation, activeChart, focusContext in data context
- Phase transitions announced with transition reason
- Evidence sufficiency: hubs <25% coverage flagged (`EVIDENCE_SUFFICIENCY_THRESHOLD`)
- Legacy migration: `useAICoScout.ts` → `assembleCoScoutPrompt`, legacy barrel exports removed
- `buildCoScoutMessageInput` extracted for conversation formatting
- Documentation: coscout-prompt-architecture.md, ai-context-engineering.md updated, CLAUDE.md updated

### Already implemented (found during exploration)
- Question generators (yamazumi, performance) already wired in `useQuestionGeneration.ts`
- `search_knowledge_base` + `answer_question` tool handlers already implemented
- Investigation serializer already wired in Editor.tsx
- Evidence metric sorting already correct (universal R²adj carrier pattern)

## Key Architecture

```
packages/core/src/ai/prompts/coScout/
├── index.ts          — assembleCoScoutPrompt() entry point
├── types.ts          — CoScoutPromptTiers, CoScoutSurface
├── role.ts           — Tier 1: identity, principles, security
├── messages.ts       — Conversation message formatting
├── legacy.ts         — Original monolith (test-only)
├── tools/registry.ts — 25 typed tool definitions
├── phases/           — frame, scout, investigate, improve
├── modes/            — standard, capability, performance, yamazumi
└── context/          — investigation, dataContext, knowledgeContext
```

**Why:** Geological ADR layers created contradictions and invisible capabilities. Phase-adaptive prompts reduce token usage (~430 lines vs 1,691) and improve prompt caching.

**How to apply:** Use `assembleCoScoutPrompt()` for all CoScout requests. Add new tools to `tools/registry.ts`. Add phase coaching to `phases/*.ts`. Add mode coaching to `modes/*.ts`. Context data goes in `context/*.ts` formatters.
