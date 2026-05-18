---
title: 'AI Action Tools'
description: 'ADR-029 — CoScout action tools (proposal pattern, phase-gating, 15 action tools total)'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_ai_action_tools.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

ADR-029: AI Action Tools for CoScout — delivered 2026-03-19.

**What**: Extended CoScout from 3 read-only tools to 21 total (6 read + 15 action).
Action tools use a "proposal pattern" — compute preview, return to LLM which embeds
`[ACTION:tool:params]` markers, UI renders ActionProposalCard for user confirmation.
No state mutation during tool loop.

**Apr 3 2026**: Added `spark_brainstorm_ideas` tool (ADR-061) — text + direction only, no evaluation metadata. Used in brainstorm modal creative partner mode. CoScout gets `brainstormSessionActive` flag for coaching mode switch.

**Apr 4 2026**: Added 2 investigation hub tools (Investigation Spine):
- `suggest_suspected_cause` — proposes hub with name, synthesis, questionIds, findingIds. Phase-gated to validating/converging.
- `connect_hub_evidence` — adds questions/findings to existing hub. Gated to existing hubs > 0.
Both use ActionProposal pattern. Phase-specific coaching prompts added to system prompt (4 phases × mode).

**Apr 5 2026**: Added 2 Evidence Map tools + graph-aware context:
- `suggest_causal_link` — proposes directed link between factors (mechanism, direction, evidence type). Cycle-validated.
- `highlight_map_pattern` — draws attention to convergence, gap, interaction, or redundancy patterns.
- `evidenceMapTopology` added to AIContext — CoScout sees factor nodes (R²adj), relationships (5 types + strength), convergence points (hub-linked). Enables graph-aware reasoning. **Note:** Only lightweight fallback is populated (η² contributions); full bestSubsets data (factor types, optima, relationship shapes) never passed through. See `project_evidence_map_gaps.md` #3.

**Why:** Analysts had to manually apply every filter and record every observation even when
CoScout already identified the pattern. "AI suggests; analyst confirms" philosophy.

**How to apply:**
- `packages/core/src/ai/actionTools.ts` — types, parsing, preview computation
- `packages/core/src/ai/prompts/coScout.ts` — `buildCoScoutTools({ phase, isTeamPlan })` with phase-gating
- `packages/hooks/src/useAICoScout.ts` — `toolsOptions` prop for phase-gating
- `packages/ui/src/components/CoScoutPanel/ActionProposalCard.tsx` — inline confirmation UI
- `apps/azure/src/hooks/useEditorAI.ts` — 10 new tool handlers
- `apps/azure/src/pages/Editor.tsx` — proposal state + execution dispatch

**Phase-gating**: FRAME=read only, SCOUT=+filters+findings, INVESTIGATE=+hypothesis+actions+sharing, IMPROVE=+notifications. Team plan gates sharing tools.

**Entry scenario routing**: `entryScenario` (problem/hypothesis/routine) now flows through `AIContext` → system prompt → tool routing guidance.
