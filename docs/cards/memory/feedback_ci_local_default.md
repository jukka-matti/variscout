---
title: 'feedback-ci-local-default'
description: 'User prefers local-only test/quality work; CI changes are an explicit ask, never the default — and PR ''green'' is Vercel-only, NOT proof tests passed'
purpose: remember
tier: card
status: active
date: 2026-06-09
topic: [memory, feedback]
related: []
verified-against-commit: 020c49afb
last-verified: 2026-06-09
source-hash: 76041de73e61bb16
origin-session-id: dc7020a5-b53d-48d3-81d6-5423c126385e
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_ci_local_default.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When proposing test infrastructure, quality gates, or developer-tooling improvements: **default to local-only changes**. CI work (`.github/workflows/`, coverage gates, scheduled Playwright, etc.) is out of scope unless the user explicitly requests it.

**Why:** User responded to a 3-tier testing-strategy proposal that included CI coverage + nightly E2E with "for ci, we want to keep it local for now" (2026-05-17). Their stated preference is to keep the CI footprint minimal until pain forces the change — current gate is manual `claude --chrome` walks + `bash scripts/pr-ready-check.sh` + local turbo. The trade is "developer friction for CI speed" and they've chosen it consciously.

**How to apply:**
- When auditing test/quality infra, flag CI gaps as observations but don't propose CI fixes as default work
- When tiering a quality plan, put any CI changes in the deferred / "trigger required" bucket — never in Tier 1
- When the audit's "best practice" answer involves CI, present the local-equivalent option first and the CI option as "if/when policy changes"
- Don't auto-bundle a small CI improvement (e.g. adding `--coverage` to an existing test step) into an otherwise-local PR; surface it as a separate question
- Re-evaluate only if user signals a policy shift, e.g. "let's add CI gates" or "PR drift is costing us"
- **A consequence: never merge on "checks green" alone.** `.github/workflows/` is only `deploy-azure-staging.yml`, `docs-steward.yml` (weekly), `release.yml` — there is **no test/build CI on push or PR**. A PR's green checks mean only Vercel preview-built; `pnpm test`/`pnpm build` never ran. Pull the branch and run `pr-ready-check.sh` locally before merging — especially **dependabot** dep bumps (they rewrite `pnpm-lock.yaml`; a break has no CI to catch it). Instance 2026-06-09: 4 stale dependabot PRs (#309/#310/#311/#248, 100–650 commits behind) — owner deferred to post-demo; revive plan = `@dependabot recreate` then local validate. (Also fixed that session: the Docs Steward 422 — its weekly issue body outgrew GitHub's 65 KB cap, `737cf839b`.)

Related: [[feedback_tiered_audit_then_plan]] (tiered plans put CI in the deferred tier by default for this user), [[project_docs_strategy_2026]] (similar local-first preference for docs validation).
