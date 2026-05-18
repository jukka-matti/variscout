---
title: 'Improvement Workspace PDCA Extension'
description: 'Full PDCA wired — Actions, Verification, Outcome. HMW brainstorm upstream (ADR-061). SuspectedCause hubs drive HMW sessions.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 06a7bbb4d54f5e5e
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_improvement_pdca.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Improvement workspace PDCA fully wired. HMW brainstorm modal (ADR-061) completes the upstream ideation layer.

**Investigation → Improvement flow (updated Apr 3 2026):**
- SuspectedCause hubs (not individual causeRole questions) drive HMW brainstorm sessions
- Each hub = one HMW brainstorm → one set of improvement ideas
- `selectedForImprovement` flag on SuspectedCause — analyst picks which hubs to act on
- Unselected hubs are "parked" (known, for later)
- Hub evidence: mode-aware `SuspectedCauseEvidence` with contribution from Best Subsets R²adj (statistical) or waste % (yamazumi)

**Three projection levels:**
1. **Improvement potential** (end of INVESTIGATE) — R²adj of all suspected causes combined
2. **Improvement scope** (hub selection) — R²adj of selected causes
3. **Idea projection** (What-If per idea) — existing, unchanged

**Data pipeline FULLY WIRED:**
- `toVerificationData()` bridge: `StagedComparison` → `VerificationData`
- `useImprovementOrchestration` computes verificationData + focusFinding + outcome state
- OutcomeSection → auto-transitions `improving` → `resolved` when all actions done

**Key files:**
- Improvement workspace: `packages/ui/src/components/ImprovementPlan/`
- Orchestration: `apps/azure/src/features/improvement/useImprovementOrchestration.ts`
- Hub store: `apps/azure/src/features/investigation/investigationStore.ts` (suspectedCauses state)
- Brainstorm: `packages/ui/src/components/ImprovementPlan/BrainstormModal.tsx`
