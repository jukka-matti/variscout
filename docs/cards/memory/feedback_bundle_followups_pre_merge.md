---
title: 'Bundle pre-merge followups into the open PR'
description: 'When a large PR is still open (e.g. chrome walk deferred) and the reviewer produced both blockers and non-blocking concerns, bundle the concerns into the same PR rather than opening followup PRs.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: 735256b7-0b83-49c5-b7fb-9407f6d02899
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_bundle_followups_pre_merge.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

# Bundle small followups into the open PR, don't chase

When a large feature PR is still open (chrome walk deferred, awaiting final merge) and a reviewer flagged both merge-blockers and smaller non-blocking concerns, user wants the non-blockers bundled **into the same PR** before merge — not left for post-merge followup PRs.

**Why:** On PR #76 Investigation Wall (2026-04-24), after the 3 blockers were pushed, user said: *"so are we ready for these: Post-merge follow-ups — the 4 non-blocking concerns the reviewer raised…"* The list was short (4 concerns), all scoped to the Wall feature, and the PR wasn't merged yet. Opening followup PRs would have been merge ceremony overhead with no benefit — one PR is one review surface, one squash commit, one chrome walk.

**How to apply:**
1. When a reviewer returns blocker + concern lists and the PR is still open, plan to address both tiers in the same PR.
2. Split commits by tier: one commit for blockers (merge-critical), a second for concerns (polish). Makes the diff reviewable even when bundled.
3. Track the "chrome walk" as the only post-merge gate, not a parade of followup tickets.
4. Exceptions: if a concern would require significant new design work or expands scope beyond the feature, split it out. Default is bundle.

**Age exception (added 2026-04-24 after PR #76 drift incident):** If the PR is **>3 days old or ≥15 commits behind `origin/main`**, drive-by fixes go to main directly (or a fresh branch off main), NOT onto the stale branch. Bundling onto a stale PR compounds conflicts — the PR #76 chrome walk added an `excel.ts` fix + `wall.missing.processMap` i18n onto a 56-commits-behind branch and immediately hit CONFLICTING state against parallel main work. Run `git fetch && git log HEAD..origin/main | wc -l` before bundling; if ≥15, stop and re-plan.

Contrast: *after* a PR merges, small issues go into followup PRs or the backlog — not amend-and-force-push.
