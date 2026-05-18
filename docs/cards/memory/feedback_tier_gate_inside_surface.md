---
title: 'Tier-gate inside each surface, not at surface-entry CTAs'
description: 'When defining a tier model (free vs paid), gate at the team-collaboration features INSIDE each surface (signoff buttons, audit trail, alerts, RACI), not at the surface-entry CTA / button. Document authoring + structured workflow surfaces serve free-tier pedagogy + .vrs export use cases; team workflow is the paid-tier feature.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 3188636e62e1175b
origin-session-id: 906cccde-0cd3-4d5a-bbda-f82a5855e4cc
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_tier_gate_inside_surface.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When defining a tier model that gates features by subscription (free vs paid, basic vs pro, etc.), the gate should sit at the **team-collaboration / cross-user / longitudinal-monitoring features INSIDE each surface**, not at the **entry-CTA button** that opens the surface.

**Why:** in VariScout's PR8 8a canvas response-path CTAs (Charter / Sustainment / Handoff buttons), the original plan tier-gated the entry buttons — free-tier users saw them as "Upgrade to unlock" tooltips on the buttons themselves. Plan review (2026-05-07) reframed: per `feedback_pwa_philosophy` ("same analysis everywhere"), document authoring + structured workflow surfaces should serve PWA's pedagogy + `.vrs` export use cases (LSSGB students learn DMAIC by writing charters; trainers package model charters in `.vrs` scenarios; consultants draft charters in PWA before bringing to clients). The actual paid-tier value isn't "can you write a charter?" — it's signoff workflow, audit trail, alerts, RACI tracking, change notifications, cross-team sharing. Those features live inside the Charter / Sustainment / Handoff surface components and tier-gate via `useTier()` AT that level, not at the entry button.

**How to apply:**

1. **Distinguish two questions when scoping a tier-gate:**
   - "Can the user open this surface?" → usually free-tier-active (let them learn / draft / export)
   - "Can the user invoke this team-collaboration feature?" → tier-gated (signoff, alerts, audit, RACI, multi-user sync)
2. **Surface entry CTAs are pedagogy + conversion signals**, not gating boundaries. Showing a Charter button to a free-tier user lets them experience the feature shape; tier-locking the "Request team approval" button INSIDE the Charter form is the conversion moment with concrete value framing.
3. **Free-tier surface implementations are stub-friendly** when the full data model isn't ready. Ship a one-paragraph "what this is + what it'll do" placeholder behind the entry CTA so the button isn't dead-ended. Pedagogy continues even before the form is wired.
4. **Tier-gated features use `isPaidTier()` per ADR-078 D5** at the consumer level (button render, action handler), NOT at compile time or via conditional imports across apps.

**Counter-case:** features that are GENUINELY impossible in the free-tier (cloud-sync, multi-user state, server-side compute, hosted authentication) don't fit this rule. Those gate at the surface-entry level because there's no meaningful free-tier shape. Distinguish "team-collaboration on top of solo content" (gate inside) from "fundamentally tier-only feature" (gate at entry).

**Generalizes to:** any product with a tier model where the paid tier adds collaboration / longitudinal / cross-team / hosted-infrastructure features on top of solo workflows. Notion (free for solo, paid for teams), Figma (free for personal, paid for org), Linear (free for small teams, paid for orgs) — all share this shape.

**See also:** `feedback_pwa_philosophy` (same analysis everywhere); ADR-078 D5 (tier-gating uses `isPaidTier()` at mount); ADR-078 D2 (state shapes tier-agnostic; persistence is the only tier gate at the storage layer).
