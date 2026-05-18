---
title: 'Branch staleness guardrails (PR'
description: 'Long-lived feature branches on this repo drift fast due to ungrouped Dependabot PRs. Check behindness before pushing + bundling drive-bys.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: a2f3fc03c598d7ae
origin-session-id: 5fcf8467-3732-4079-854b-f2c769a85d44
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_branch_staleness_guardrails.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

# Check branch freshness before pushing

On 2026-04-24 `feature/wall-phase-11` (PR #76) drifted 56 commits behind `main` over 5 days. A drive-by i18n fix bundled per the "bundle pre-merge followups" rule immediately hit CONFLICTING state because main had parallel Wall i18n work.

**Why:** Repo receives ~14 ungrouped Dependabot PRs per week. Each lockfile change invalidates every open feature branch. No freshness signal existed anywhere in the workflow before this incident.

**How to apply:**
1. Before pushing to any feature branch, run `git fetch && git log HEAD..origin/main | wc -l`. If ≥10, merge main first. This is now codified in `CLAUDE.md` Workflow section + the advisory banner in `scripts/pr-ready-check.sh` (fires at ≥10 behind).
2. The "bundle pre-merge followups" rule has an **age exception** (see `feedback_bundle_followups_pre_merge.md`): PRs >3 days old OR ≥15 commits behind send drive-bys to main directly, not the stale branch.
3. `scripts/check-git-hygiene.sh` (SessionStart hook) now warns per-branch when ≥20 commits behind — pay attention to these warnings.
4. `.github/dependabot.yml` now uses `groups:` for npm (dev vs prod) + github-actions — one weekly grouped PR per ecosystem replaces the cascade that caused this drift.
