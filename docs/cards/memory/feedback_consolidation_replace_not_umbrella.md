---
title: 'When the problem is scatter, replace+archive — don''t umbrella'
description: 'Doc consolidation tactic preference. When multiple overlapping specs / docs exist and the problem is "we have too many sources of truth," prefer aggressive consolidation (one new spec replaces N old ones, old ones move to archive/) over umbrella/north-star (one new spec sits on top of N old ones, all surviving). Adding another doc to fix scatter is wrong.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 6e3629c8f6cfafce
origin-session-id: d634a930-572b-46ae-aa5c-97fe4d2db39f
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_consolidation_replace_not_umbrella.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When the user surfaces "we have scattered plans / overlapping specs," the natural-feeling fix is to write one new "umbrella" or "north-star" doc that points at the existing N specs. **This is wrong.** It adds another doc to maintain alongside the N already there, doesn't force any pruning, and the underlying scatter persists.

Prefer **replace + archive** instead: write the canonical doc, move superseded specs to `docs/archive/specs/` with `status: superseded` + forward pointer, update inbound + outbound + index references in the same commit. Forces a real decision about what's true and what's not.

**Why:** During the 2026-05-03 vision-spec brainstorm the user explicitly chose the most aggressive option ("Replace and archive") over umbrella + reference and north-star layer above. Both umbrella alternatives were rejected as "doesn't solve the underlying problem we just diagnosed — adds *another* doc to maintain." The replace-and-archive move took 3 commit attempts as doc-health hooks caught broken cross-refs progressively, but the result is one canonical doc plus archived predecessors — no scatter persists.

**How to apply:**
- When the user's problem statement is "scatter" or "overlapping specs" or "multiple sources of truth," push toward replace+archive in the consolidation question. Make it the recommended option.
- Don't propose "one new doc that points at existing N" as the safe middle. It's neither safe nor middle — it's the same scatter plus a new layer.
- The disruption tax is real but bounded: every spec being archived needs (a) its own frontmatter updated to `status: superseded` + `superseded-by:`, (b) inbound refs from other docs updated to point to the new spec, (c) outbound refs from the archived spec updated to point at sibling files via the archive's relative path, (d) `specs/index.md` rows updated to reflect the archive path + Superseded status. Doc-health hooks will catch all four iteratively — expect ~2-3 commit attempts.
- The decision-log gets a new "Replayed Decisions" pin documenting the supersession, so future sessions don't re-litigate.
- Memory entries that referenced the now-archived specs by name need a quick edit to point at the new canonical spec; the originSession-pinned timestamp on the memory file is enough to disclaim "this was true when written."
