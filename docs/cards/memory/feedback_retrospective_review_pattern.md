---
title: 'Retrospective review pattern when implementations bypass brainstorm + PR workflow'
description: 'When implementations land via direct-to-main / no-brainstorm / no-PR-review (e.g., autonomous agent racing ahead), the response is 3-reviewer retrospective + retroactive specs documenting what shipped + Vision Alignment phase for unmet commitments — don''t revert.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: f9cf13bb5f25aa59
origin-session-id: 906cccde-0cd3-4d5a-bbda-f82a5855e4cc
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_retrospective_review_pattern.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When implementations land that bypass the proper workflow (no brainstorm before implementation; direct-to-main for product code; no PR-time subagent code review), the response pattern is:

1. **Three parallel retrospective reviewers:** architecture (against locked ADRs/specs), design (against vision spec commitments), code quality (against project rules + accessibility).
2. **Retroactive specs documenting what shipped — not what should have been designed.** When design choices were made implicitly, write descriptive specs that open with *"this is a retroactive spec capturing what shipped"* so future readers know the design wasn't brainstormed-then-implemented. Different category from prescriptive specs.
3. **Bundle unmet commitments as a "Vision Alignment" phase** in the project's migration/feature sequence. Each unmet item becomes an `investigations.md` entry with a promotion path to a sub-PR.
4. **Don't revert the work.** If the architecture is intact and the bugs are fixable, the right response is: document + complete + clean up. Reverting throws away functioning code; documenting + finishing closes the loop.

**Why:** VariScout's canvas PR4c-PR6 (commits `a2f88d60`, `2c010f29`, `36727ad0`, `2820afb1`, `8b4aad68`) shipped direct-to-main on 2026-05-05 without brainstorming Spec 3 or Spec 4. Three retrospective reviewers (2026-05-06) found: architecture intact (three-layer state, ADR-073/074/078 honored, CRDT readiness, Wall destination preserved); one critical bug (`onUngroupSubStep` silently dropped); 11 palette-color rule violations; 6 unmet vision-spec commitments. Plan: Tier 1 fixes in a focused PR; Tier 3 retroactive Spec 3 + Spec 4 docs; Tier 2 unmet items as PR8 Vision Alignment sub-phases (8a-8f). The canvas migration sequence grew from 8 PRs to 9 PRs honestly (PR8 Vision Alignment + PR9 cleanup, renumbered from PR8). See `docs/superpowers/plans/2026-05-06-canvas-pr4c-pr6-followup.md` + `docs/decision-log.md` 2026-05-06 entry.

**How to apply:**

- **First, run the 3-reviewer retrospective.** Don't conclude anything until all three reports are in. Architecture review verifies the locked decisions hold; design review captures the implicit choices; code-quality review surfaces project-rule violations.
- **Catalog what shipped vs what was committed-to.** The vision spec / locked ADRs are the bar. Each unmet commitment gets an investigations.md entry with possible directions + promotion path.
- **Decide tier:** must-fix (project rule violations, critical bugs) → focused PR now. Retroactive design docs → small docs PR. Unmet commitments → named-future Vision Alignment phase.
- **Update the migration / feature sequence honestly.** Insert a "Vision Alignment" phase between current work and final cleanup. Renumber subsequent phases. Don't pretend the work was on track if it wasn't.
- **Process commitment going forward.** A decision-log entry recording the bypass pattern + reaffirming the workflow rule for future PRs (don't retroactively re-branch the bypassed commits).

**Trade-off:** retrospective review is more expensive than at-PR-time review (no diff context, no incremental PRs, harder to scope). Worth it when the work is shipped + working but un-validated. NOT a substitute for at-PR-time review — the goal is to use this pattern rarely.

**Generalizes to:** any project where autonomous agents (Codex, subagents) run ahead of the design + review process. The pattern doesn't require the bypass to be malicious — most often it's "the agent kept going because the path was clear and there was no mid-step gate."
