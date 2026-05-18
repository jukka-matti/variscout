---
title: 'IMPROVE Phase Workspace'
description: 'IMPROVE phase UX — base delivered Mar 2026, HMW brainstorm modal + collaborative sessions added Apr 3 2026'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 10a6248bde1d3e2c
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_improve_workspace.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

IMPROVE phase UX delivered in two phases:

**Phase 1 (Mar 2026):** Base workspace — synthesis, ideas, prioritization matrix, What-If, actions, verification, outcome.
- `ImprovementWorkspaceBase`, `SynthesisCard`, `IdeaGroupCard`, `ImprovementSummaryBar`
- `PrioritizationMatrix` (4 presets), `RiskPopover`, `ImprovementContextPanel`
- `TrackView`: `ActionTrackerSection`, `VerificationSection`, `OutcomeSection`
- What-If round-trip, idea selection, action conversion, popout sync

**Phase 2 (Apr 3 2026, ADR-061):** HMW Brainstorm Modal — diverge/converge separation.
- `BrainstormModal` — 2×2 HMW grid (desktop) / swipeable tabs (mobile) + select step
- `BrainstormQuadrant`, `VoteButton` — direction sections + anonymous voting
- `generateHMWPrompts()` — auto-generates 4 HMW questions per cause
- `spark_brainstorm_ideas` CoScout tool + brainstorm coaching mode
- `useBrainstormSession` (SSE client) + `useBrainstormDetect` (30s poll) hooks
- Collaborative sessions: 4 server endpoints, Team plan only
- Parked ideas section in IdeaGroupCard
- Static "Four Directions hint" removed (replaced by modal)

**Why:** Separates divergent thinking (brainstorm) from convergent thinking (evaluate). Design thinking research shows this produces better ideas.

**How to apply:** Base spec at `docs/superpowers/specs/2026-03-19-improve-phase-ux-design.md`. Brainstorm spec at `docs/superpowers/specs/2026-04-03-hmw-brainstorm-modal-design.md`. Components in `packages/ui/src/components/ImprovementPlan/`.
