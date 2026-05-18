---
title: 'HMW Brainstorm Modal + Collaborative Sessions'
description: 'ADR-061 — diverge/converge separation, HMW prompts, SSE collaborative sessions, CoScout creative partner, anonymous voting'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: afeb31d2fe87ca65
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_brainstorm_collaborative.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

HMW Brainstorm Modal merged to main (2026-04-03). ADR-061.

**What:** Dedicated brainstorm modal upstream of the existing IdeaGroupCard evaluate → prioritize → track pipeline. Separates divergent (creative) from convergent (evaluative) thinking.

**Key components:**
- `BrainstormModal` — 2×2 HMW grid (desktop) / swipeable tabs (mobile) + select (dot-vote) step
- `BrainstormQuadrant` — single direction section with inline editing
- `VoteButton` — anonymous star toggle with count
- `generateHMWPrompts()` — auto-generates 4 HMW questions from cause + problem statement
- `spark_brainstorm_ideas` — new CoScout tool (text + direction only, no evaluation metadata)
- Brainstorm coaching prompt section with silence rules (silent during Select, silent while typing)

**Collaborative sessions (Team plan only):**
- 4 Express endpoints: `/api/brainstorm/create`, `/idea`, `/stream` (SSE), `/active`
- In-memory session storage with 24h TTL auto-cleanup
- `useBrainstormSession` hook — SSE client, create/join/add/edit/disconnect
- `useBrainstormDetect` hook — polls every 30s, shows join toast for active sessions
- Anonymous voting — server tracks voter IDs but only exposes counts to client
- First real-time collaboration feature in VariScout

**Design decisions:**
- Feasibility criteria → CoScout coaching, not UI checklist (scale-aware: lean for quick wins, business case for investments)
- Ideas belong to the group — no authorship, only ✨ for CoScout-generated
- Parked ideas (unselected) shown dimmed in IdeaGroupCard, promotable later
- Static "Four Directions hint" removed from ImprovementWorkspaceBase

**Why:** Four Ideation Directions were underutilized as dropdown values. Design thinking shows separating diverge/converge produces better ideas.

**How to apply:** Spec at `docs/superpowers/specs/2026-04-03-hmw-brainstorm-modal-design.md`. Components in `packages/ui/src/components/ImprovementPlan/`. Hooks in `packages/hooks/src/`. Server endpoints in `apps/azure/server.js`.
