---
title: 'Cap implementation slices at ~6–8 tasks per PR'
description: 'Plans larger than ~10 tasks compress budget on late phases — review loops shortcut, partials accumulate, --chrome walk skipped. Sequence as multi-PR off one branch.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 57a236c7aab7c850
origin-session-id: 906cccde-0cd3-4d5a-bbda-f82a5855e4cc
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_slice_size_cap.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Implementation plans should aim for ~6–8 tasks per squash-merged PR. When a slice's natural scope exceeds ~10 tasks, sequence it as multiple mergeable PRs sharing one branch instead of bundling everything.

**Why:** VariScout slice 4 (PR #125) was 22 tasks / 23 commits / 5 phases / one PR. Late-phase quality measurably degraded:

- 3 partials shipped DONE_WITH_CONCERNS (P3.6 session-local persist, P4.2 wrapper-only wiring, P4.3 E2E deferred).
- Spec+quality reviewer dispatches shortcut on ~10 of 22 tasks (small mechanical changes — defensible individually but collectively erodes the safety net).
- Manual `claude --chrome` walk skipped before opening PR (caught in retro per `feedback_verify_before_push`).
- 3 new `docs/investigations.md` entries for deferred follow-ups; these accumulate across slices (slice 2/3/4 each pushed work forward).

A natural split was 4 PRs: P0+P1 (foundation: existingRange + Pareto registry/picker), P2 (defect anchoring), P3+P4 (filter chips + make-scope), P5 (close-out). Each ~5–7 tasks, ~1 day. Tighter review-merge-verify rhythm; less budget compression at the tail; partials become deliberate phase-boundary deferrals rather than mid-PR improvisations.

**How to apply:**
- During `superpowers:writing-plans` Phase 4 (Final Plan), if the task count exceeds ~10, restructure §"Sequencing" as multi-PR (P0 → merge → P1 → merge → ...) on a single branch (`framing-layer-v1-slice-N`). Slice 3's plan (`~/.claude/plans/lets-plan-the-implementation-buzzing-wand.md`) already used phase-letter mergeable PRs as a precedent.
- Each phase opens its own PR off `main`; squash-merge → next phase rebases onto fresh main.
- `feedback_full_vision_spec` still applies — the SPEC stays whole; only DELIVERY sequencing fragments.
- Trade-off: more PR overhead (5 PRs > 1 PR for review reading). Worth it when the slice has independent phases that don't all depend on each other.

**Counter-signal — when single-PR is right:** when phases are truly atomic (one phase's correctness depends on a later phase's wiring) OR the slice is genuinely small (<8 tasks). Don't fragment for fragmentation's sake.

**Important carve-out — atomic deletion-cascade sweeps (added 2026-05-17):** This cap applies to feature work where complexity grows nonlinearly. It does **NOT** apply to mechanical deletion cascades forced by a public-API change that breaks tsc across many consumers. For those, the work is one transformation pass, not a slice with phases. See [[feedback_atomic_sweep_one_dispatch]] for the research-backed shape (one Opus implementer, Architect → Migration → Validator internal phases, per-category commits) and the reasoning (Anthropic 2026 + Augment multi-vs-single-agent research + Martin Fowler on codemods all converge: single-agent wins for sequential same-worktree mechanical sweeps where subagents wouldn't need to communicate). Splitting an atomic cascade into 6-8 sub-dispatches multiplies orchestration cost without buying review depth — each sub-reviewer sees only a slice and can't catch cross-category drift.
