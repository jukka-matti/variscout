---
title: 'carry-threads-to-done-don-t-accumulate-followups'
description: 'User pushes to close investigations.md entries and ship lingering followups rather than leaving open threads after merge. "Everything in main."'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 45d6cfa3f7eacb3d
origin-session-id: bbce0a7a-08d3-438c-aa40-25890442fc69
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_close_threads_to_done.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Once a multi-PR initiative is mostly shipped, the user defaults to **finishing the open threads**, not deferring them to "later." Open items in `docs/investigations.md` from the same session are candidates to close (with a real decision logged) or ship (with a small follow-up PR), not to inherit.

**Why:** During the 2026-05-13 hooks evaluation, after PR1 + PR2 merged, two minor items remained in `docs/investigations.md`. The user asked *"should we still do this: duplicate-basename pairs..."* and then, on the second item, *"should we decide what to do with this also?"* — and after I recommended closing, *"yes!"*. The signal: lingering items are debt. The user wants every thread from the session resolved on `main` before the session ends. Even small fixes (~10 lines) are worth shipping in a fresh PR rather than parking in the log.

**How to apply:**

1. At the end of a multi-PR initiative, **enumerate the open `docs/investigations.md` entries surfaced during the session** and treat each as a decision: ship a follow-up PR, close as accepted trade-off (with rationale), or keep open with a concrete trigger condition.
2. Closing an item is a real action: edit the file, write the rationale in the commit message, push. Don't just declare it closed in chat.
3. Bias toward shipping the fix when it's small (≤30 lines, single file). A small fresh PR is cheaper than a one-line backlog item that ages.
4. If the user says *"everything in main"* (or similar), treat that as a hard requirement — including post-merge cleanup, not just the headline PRs.
5. Complement to [[feedback_bundle_followups_pre_merge]]: that one is about *pre-merge* concerns folded into the open PR. This one is about *post-merge* threads addressed before declaring the initiative done.

**Counter-signal:** if a deferred item depends on data we don't have yet (e.g. waiting on a real failure to inform a fix), leaving it open with a clear trigger is correct. Default to closing only when the trigger is "if X starts happening" and X hasn't started.
