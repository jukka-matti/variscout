---
title: 'Validate architecture before implementing'
description: 'User wants CTO/AI expert perspective on design decisions before committing to implementation'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_validate_architecture.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Before implementing multi-component features, validate the architecture from a CTO/AI expert perspective — check for redundancy, anti-patterns, and whether the proposed approach is the simplest correct solution.

**Why:** In the Evidence Map completeness work, initial plan proposed syncing full computed topology through a Zustand store. CTO-level review revealed: (1) 5 of 8 topology fields were redundant with existing AI context, (2) syncing computed data through stores is an anti-pattern (user-created data → stores, computed data → local useMemo), (3) the enrichment logic in buildAIContext was dead code (computed but never serialized to prompts). This saved significant wasted effort and produced a cleaner solution.

**How to apply:** When a design touches multiple layers (data → hooks → stores → AI context), pause and ask: Is this the simplest path? Is the data redundant? Does it follow existing patterns? The user appreciates this level of rigor and will explicitly ask for it when needed.
