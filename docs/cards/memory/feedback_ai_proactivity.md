---
title: 'AI Proactivity Approach'
description: 'Prefer minimal nudges over proactive AI interruptions. Trust the model with good data rather than adding more prompt instructions. Cross-project memory deferred due to architectural complexity.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 4274c6028871f761
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_ai_proactivity.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Don't over-engineer AI proactivity. Trust the model to use context data naturally rather than adding explicit cross-referencing instructions. One minimal nudge is better than verbose proactive behavior.

**Why:** Research (ProAgentBench 2026) confirms poorly timed interruptions impose cognitive costs. Quality analysts in flow state shouldn't be interrupted. The question tree data is already in CoScout's context — a capable model will use it organically. Adding more prompt instructions risks making CoScout over-eager.

**How to apply:** When considering new CoScout prompt additions, ask: "Is this data already in the context? Would the model naturally use it?" If yes, skip the instruction. Only add a nudge when the model consistently misses something important (like ruled-out question evidence for stakeholders). Prefer "activate what exists" over "build new infrastructure."

Also: C3 cross-project memory is the right vision but deferred — the no-backend constraint makes IndexedDB cross-store queries and Foundry IQ indexing architecturally complex. Don't propose it as a quick win.
