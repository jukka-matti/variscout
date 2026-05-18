---
title: 'stacked-pr-rebase-old-base-sha'
description: 'When rebasing a stacked PR after its parent squash-merges, use the ORIGINAL pre-rebase commit SHA of the old base, not the local branch tip (which has already been rebased). Got bit on PR #186 during wedge V1 stack merge.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: 13d849fb-ae7d-4093-90ea-a9bff40322cf
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_stacked_pr_rebase_old_base_sha.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When merging a stacked PR chain (parent → child → grandchild), each squash-merge collapses the parent's commits into a single new commit on main. The child PR's branch still contains the parent's original commits as history, so it must be rebased onto main with the parent's commits dropped.

The standard incantation is `git rebase --onto origin/main <OLD_BASE> <branch>`. **The trap:** if you've already rebased the parent branch locally (e.g., as part of the same stack-merge session), the parent's local branch tip has MOVED. Using the new (post-rebase) tip as `<OLD_BASE>` causes git to try replaying the parent's commits again, which produces add/add conflicts because main now has them in squashed form.

**Why:** `git rebase --onto NEW_BASE OLD_BASE branch` means "take commits in `OLD_BASE..branch` and replay them on `NEW_BASE`." If `OLD_BASE` no longer references the historical fork point (because that branch was rebased to a different SHA), the commit range expands to include commits that are already in main.

**How to apply:**

- Before rebasing the parent branch in a stack merge, capture each pre-rebase tip SHA: `git rev-parse feat/wedge-pr-wv1-2-improve-workspace` → save it.
- When rebasing the child, use that captured SHA literal as `OLD_BASE`: `git rebase --onto origin/main eb28ad60 feat/wedge-pr-wv1-3-measurement-plans`.
- If you hit conflicts on commits that are obviously already in main (e.g., feat commits from the parent PR), STOP — your `OLD_BASE` is wrong. `git rebase --abort` and use the original pre-rebase SHA.
- The merge-base technique (`git rebase --onto main $(git merge-base parent-branch child-branch) child-branch`) doesn't work here either if parent-branch has been rebased, because the merge-base is now main.

**Concrete: 2026-05-16 wedge V1 stack merge.** PR #183 → squash-merge, deleted upstream. PR #185 rebased locally onto main: `git rebase --onto origin/main feat/wedge-pr-wv1-1-project-membership feat/wedge-pr-wv1-2-improve-workspace` (this worked — the parent branch local ref still pointed at the pre-merge tip `7f7d21ea`). PR #185 → squash-merge. THEN for PR #186, I tried `git rebase --onto origin/main feat/wedge-pr-wv1-2-improve-workspace feat/wedge-pr-wv1-3-measurement-plans` — but `feat/wedge-pr-wv1-2-improve-workspace` had already been rebased to `a6bed5cc`, no longer at the historical `eb28ad60`. Result: conflicts on `projectMembership/types.ts` because git tried to replay PR #185's commits. Fix: `git rebase --abort && git rebase --onto origin/main eb28ad60 feat/wedge-pr-wv1-3-measurement-plans` — clean 28-commit replay.

Companion: [[gh-cli-silent-success]] (gh CLI errors after successful merges), [[bundle-followups-pre-merge]] (why we had the stack in the first place).
