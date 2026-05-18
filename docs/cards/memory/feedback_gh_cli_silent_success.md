---
title: 'gh CLI 502 ≠ failure — verify state before retrying'
description: 'GitHub''s REST/GraphQL endpoints sometimes return 502 Bad Gateway *after* a write succeeds. Check actual PR/branch state before retrying destructive ops.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: 3fa06315-7568-413a-a36a-972fdda2ca4f
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_gh_cli_silent_success.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When `gh pr create`, `gh pr merge`, or `git push` returns `502 Bad Gateway` or appears to fail with no output, **do not blindly retry**. The operation often succeeded server-side and only the response was lost. Retrying can either be benign (push) or actively harmful (creating duplicate PRs, double-merging).

**Why:** observed three times in one session 2026-05-04 across PR #123 + #124 + slice-3 push:
- `git push -u origin <branch>` → "remote rejected" with no specific reason → retry succeeded with "* [new branch]" (the first call had actually pushed; the response failed).
- `gh pr create` → `HTTP 502: 502 Bad Gateway` → retry reported "a pull request for branch already exists" with the URL of the PR the first attempt silently created.
- `gh pr merge --squash` → empty output then `502 Bad Gateway` → `gh pr view --json state,mergedAt` showed `state: MERGED, mergedAt: <real timestamp>` from the original call.

**How to apply:**
1. After any 502 / silent-failure / cryptic-rejection / non-zero exit from `gh` or `git push`, **immediately verify state** before retrying:
   - PR create → `gh pr view <head-ref>` or `gh pr list --head <branch>`
   - PR merge → `gh pr view <num> --json state,mergedAt`
   - Push → `git ls-remote origin <branch>` to confirm the ref landed
2. If state shows the op succeeded, treat it as done and move on.
3. Only retry if state confirms the op did NOT happen.
4. The same pattern likely applies to other GitHub-flavored API surfaces (issue create, comment, label) — verify before retrying any write.

**Worktree-conflict variant (observed 2026-05-06, F1+F2 PR #132):** `gh pr merge 132 --squash --delete-branch` exited with `fatal: 'main' is already used by worktree at <repo-root>` from gh's POST-merge local cleanup step (gh tries to checkout main locally to delete the branch, hits the worktree). Server-side merge had ALREADY succeeded — `gh pr view 132 --json state,mergedAt,mergeCommit` showed `state: MERGED, mergedAt: <real timestamp>, mergeCommit: <real SHA>`. Same lesson: exit-1 from gh is NOT a merge failure; it can be local-cleanup error after a successful remote write. Always verify before retrying or worrying.
