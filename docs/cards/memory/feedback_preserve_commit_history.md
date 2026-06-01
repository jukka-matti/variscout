---
title: 'feedback-preserve-commit-history'
description: 'Use merge-commit (--merge) or rebase (--rebase) for product-code PRs to preserve granular per-commit history on main; not squash-merge'
purpose: remember
tier: card
status: active
date: 2026-05-28
topic: [memory, feedback]
related: []
verified-against-commit: ca45f469
last-verified: 2026-05-28
source-hash: ed9a9335f48cc35b
origin-session-id: 99006d69-683b-44e8-a807-7a81fd9d2a53
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_preserve_commit_history.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

For product-code PRs (`branch → PR → merge`), use **`gh pr merge --merge`** (creates a merge commit that preserves all branch commits as individual ancestors on main), NOT `--squash`. CLAUDE.md's earlier squash-merge default is overridden by this preference.

**Why:** Squash-merge collapses the implementer's per-category commits + spec/quality-review polish commits into one big commit on main, losing the granular history that helps with archaeology, bisecting, and reviewing the design rationale that lived in each commit message. The user prefers preservation. Bonus risk avoided: if doc commits were also locally on main but unpushed when the branch was created (the A2 mistake on 2026-05-26), squash bundles those commits into the PR commit, mis-attributing them in main's history under the feature PR's title. Merge-commit (or rebase-merge) avoids both problems.

**How to apply:**
- When merging a product-code PR: `gh pr merge <PR> --merge --delete-branch` (not `--squash`).
- Each commit on the feature branch remains an individual commit ancestor on main; the merge commit makes the PR boundary visible. Per-category commits + review polish commits stay legible.
- Alternative: `--rebase` for linear history without merge commits — also acceptable since per-commit identity is preserved. Choose `--merge` when PR-boundary visibility is valuable; `--rebase` when you want a flat linear log.
- **Push doc commits to main BEFORE branching for code work.** Otherwise doc commits ride along on the feature branch and get bundled into the eventual merge under the PR's commit message — A2 (PR #215) lost the 8 individual doc commits this way. Doc work belongs in main commits with descriptive messages; don't let it ride on a code branch.
- Avoid `--squash` for product-code work going forward. Use it ONLY if the PR is genuinely a single conceptual change with cluttered work-in-progress commits worth collapsing.

Companion to [[feedback_no_backcompat_clean_architecture]] (clean per-commit semantics matters more under no-backcompat regime) and [[feedback_atomic_sweep_one_dispatch]] (atomic sweeps already use per-category commits; squash defeats that discipline). Origin: 2026-05-26 PR-CCJ-A2 squash bundled 8 doc commits + 3 code commits into one main-line commit; user flagged the loss as unnecessary.
