---
title: 'Bring world-class design critique, not neutral structure'
description: 'User explicitly asks "what would world-class designer think?" Expects opinionated craft critique, not just structural decisions.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: f9ffd881364c7d6b
origin-session-id: 4795770b-7d21-4aff-8dc8-58d3458f8e0e
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_world_class_critique.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When a design question is on the table, bring a world-class designer's critique — strong opinions, ready to be wrong. Don't default to neutral "here are three structural options."

**Why:** During Investigation Wall brainstorming, the user asked *"what would world-class desgner think?"* multiple times — for the right rail, the empty state, the toolbar grouping, the missing-evidence strip. They're a Six Sigma MBB and a careful designer; they expect craft-level analysis, not feature-flag structuring.

**What world-class critique looks like in practice:**
- Name anti-patterns explicitly ("tutorial-as-chrome," "fake presence without collab infra," "onboarding copy disguised as UI")
- Offer a single recommended move, not a comparative menu
- Design for middle and late game, not happy-path early state (a 3-hub mockup hides what 30-hub investigations need: LOD, search, clustering, minimap)
- Recognize deck rhetoric vs production UI (Claude Design mockups often explain the intent in rail copy; production removes the copy and teaches through interaction)

**How to apply:**
- When a user asks *"what would world-class X think?"* — answer with the critique first, options menu second.
- Don't neutralize opinions into "Option A vs Option B" unless the user specifically wants options.
- If the mockup is obviously deck-scaffolding (explanatory labels, mockup-grade presence panels) — say so and propose the production-lite alternative.
- Name one clear recommendation per critique. User's response pattern is to accept or redirect, not pick from a menu.
