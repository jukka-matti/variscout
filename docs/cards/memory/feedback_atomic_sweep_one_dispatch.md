---
title: 'atomic-deletion-cascade-sweeps-stay-one-opus-dispatch-with-internal-architect-migration-validator-phases'
description: 'For mechanical breaking-API deletion cascades that force a single atomic PR (tsc fails until every consumer updates), dispatch ONE bigger Opus implementer with internal phases + per-category commits — not 6-8 small sub-dispatches.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 3da927dc2c3a3e1a
origin-session-id: dc7020a5-b53d-48d3-81d6-5423c126385e
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_atomic_sweep_one_dispatch.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When implementation work is (a) mechanical text substitution / deletion cascade, (b) forced into one atomic PR by a public-API change that breaks `tsc` across all consumers, and (c) wouldn't need inter-agent coordination — dispatch ONE Opus implementer covering the full sweep. Do NOT split into per-category sub-dispatches.

**Why:** Industry research from 2026 + Anthropic's own subagent guidance converges:

- **Anthropic** ([Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices); [Subagents PDF](https://resources.anthropic.com/hubfs/Claude%20Code%20Advanced%20Patterns_%20Subagents,%20MCP,%20and%20Scaling%20to%20Real%20Codebases.pdf)): "For sequential tasks, same-file edits, or work with tight dependencies, a single session or subagent patterns are more cost-effective." "If workers don't need to communicate with each other, the overhead of an Agent Team isn't worth it."
- **Augment** ([single vs multi-agent](https://www.augmentcode.com/guides/single-agent-vs-multi-agent-ai)): "Single-agent workflows win when state must stay coherent across steps; multi-agent workflows win when subtasks can run independently in parallel."
- **Martin Fowler** ([Codemods for API refactoring](https://martinfowler.com/articles/codemods-api-refactoring.html)) + **Codemod 2.0**: API-rename / API-delete cascades are handled as one transformation pass, not split across PRs. Atomicity is forced by the API change itself.
- Research on 15,000+ AI refactorings: agents excel at routine cleanup; they handle multi-file mechanical patterns in one pass.

Splitting an atomic cascade into 6-8 sub-dispatches multiplies orchestration cost (~6× implementer + ~12× reviewer) without buying review depth — each sub-reviewer sees only a slice and can't catch cross-category drift (e.g., a missed consumer of a deleted symbol that surfaces only in the final zero-ref grep). The Anthropic skill's hard rule against parallel implementer dispatches in shared worktrees forces sequential anyway, so splitting just adds context-loading overhead.

**How to apply:** When a task meets the three conditions above, dispatch ONE Opus implementer with internal phases borrowed from the 2026 codemod multi-agent reference architecture:

1. **Architect phase** — implementer first produces a complete file-by-category map (grep + classify). Commits it as a working note (first commit's message body, or a tracking file) before any edits. This is "evidence before claims" applied at planning time.
2. **Migration phase** — one commit per category, with the category name in the commit subject (e.g., `feat(wedge): A-class pure-deletion sweep`, `feat(wedge): B-class canAccess rewires`). Preserves rollback granularity even in a big dispatch.
3. **Validator phase** — after each category commit: fresh `tsc --noEmit` for the affected packages + targeted `pnpm --filter <pkg> test --run`. Numbers reported in the status message. No "I think this works" — fresh verification each category.
4. **End** — single two-stage Opus review pair (spec + quality). Reviewers walk the commits per-category, not the diff as one blob.

**Counter-signals (revert to split dispatches when):**

- Categories require materially different domain expertise (security audit + DB migration + frontend a11y → split for specialist subagents).
- Some categories are independent enough to run in parallel worktrees (the actual multi-agent advantage case — coordinated via shared workspace).
- The work is feature development where complexity grows nonlinearly with task count → [[feedback_slice_size_cap]] applies, not this carve-out.

Related: [[feedback_slice_size_cap]] (the previous over-correction this nuances), [[feedback_subagent_driven_default]] (model selection per task), [[feedback_one_worktree_per_agent]] (worktree discipline), [[feedback_check_prior_plans_first]] (look for prior decisions before relitigating).
