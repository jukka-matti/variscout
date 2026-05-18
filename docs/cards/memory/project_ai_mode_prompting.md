---
title: 'AI Mode-Aware Prompting'
description: 'analysisMode wired from Editor to CoScout system prompt with methodology-specific coaching for yamazumi and performance modes'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_ai_mode_prompting.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

analysisMode is now threaded from Editor.tsx → useAIOrchestration → useAIContext → buildAIContext → buildCoScoutSystemPrompt (implemented Mar 2026).

**Why:** CoScout previously used SPC terminology in all modes. Yamazumi users heard "Cpk" instead of "VA ratio"; performance users got generic advice instead of channel-specific coaching.

**How to apply:** When modifying AI prompts or adding new analysis modes, update the mode-specific block in `packages/core/src/ai/prompts/coScout.ts`. Each mode block includes terminology mapping, chart interpretation guide, and numbered coaching workflow. See `ai-context-engineering.md §2b` for the architecture.

Mode-specific prompts are in Tier 1 (static prefix) of the three-tier prompt architecture, after glossary, before phase instructions.
