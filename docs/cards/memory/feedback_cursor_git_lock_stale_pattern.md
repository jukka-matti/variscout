---
title: 'cursor-git-lock-stale-pattern'
description: 'Cursor IDE''s git worker leaves stale 0-byte .git/index.lock files. Verify with lsof, then rm safely — don''t sit in until-loops waiting for nothing.'
purpose: remember
tier: card
status: active
date: 2026-05-28
topic: [memory, feedback]
related: []
verified-against-commit: ca45f469
last-verified: 2026-05-28
source-hash: ce8ac228c7b64cc6
origin-session-id: 92fc33ef-814c-4acd-844b-f15042e00987
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_cursor_git_lock_stale_pattern.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When `git add` / `git commit` fails with `fatal: Unable to create '.git/index.lock': File exists.`, the lock is often a stale 0-byte file left by **Cursor IDE's git worker** (`Cursor Helper (Plugin) ... gitWorker.js`), not an active git operation.

**Recovery (safe when all of these hold):**
1. `ls -la .git/index.lock` — confirm 0 bytes
2. `lsof .git/index.lock` — confirm NO process holds it (empty output)
3. `ps -ef | grep gitWorker` — Cursor workers from past sessions are zombie tells, not active holders
4. Then: `rm .git/index.lock` and retry

**Why:** Cursor's git extension polls the repo for status frequently; if it's killed mid-poll (laptop sleep, IDE crash, force-quit), the lock can stick. A 0-byte lock with no holder is by definition stale — no transaction state to corrupt.

**Anti-pattern:** Don't `until ! [ -f .git/index.lock ]; do sleep 1; done` — when the lock is stale, that loop waits forever. Always verify the lock has an actual holder (`lsof`) before sleeping.

**Why this matters here:** User runs Cursor + Claude Code in parallel on the same repo. Hit during PR #212 staging; cost ~30s of investigation that should have been ~5s.

Companion to [[feedback_ruflo_cli_lock]] which covers a different process-lock case.
