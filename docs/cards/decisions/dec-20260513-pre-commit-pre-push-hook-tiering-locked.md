---
title: 'Pre-commit / pre-push hook tiering locked'
purpose: decide
tier: card
status: active
date: 2026-05-13
topic: ['decisions', 'wall']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---
> **Decision card** — extracted from `docs/decision-log.md` §1 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# Pre-commit / pre-push hook tiering locked

Measured pre-commit wall time was
  ~4 minutes (3:35 from `pnpm docs:check` + 24 s from `bash scripts/check-dead-links.sh`). Both
  are full-repo doc-graph walks; the orphan-detection loop in
  [`scripts/check-diagram-health.sh`](../scripts/check-diagram-health.sh) lines 137–198 is O(N²)
  over `docs/`. Industry baseline (husky/lint-staged 2026, Thoughtworks trunk-based dev guidance):
  pre-commit should be seconds — reserve graph walks for pre-push / CI. **Decision:** pre-commit
  reserved for fast checks (<5 s typical); slow doc-graph checks moved to [`.husky/pre-push`](../.husky/pre-push).
  A docs-touched short-circuit in [`.husky/pre-commit`](../.husky/pre-commit) re-runs the slow checks
  at commit time when staged paths match `docs/**/*.md`, `CLAUDE.md`, `**/CLAUDE.md`, or
  `packages/*/src/index.ts` — so orphan/broken-link detection still fires on every commit that
  touches doc inputs, and unconditionally on every push. **Not in scope this round:** GitHub Actions
  CI gate (backstop is local pre-push + `bash scripts/pr-ready-check.sh` before merge); Phase B
  (incremental doc-graph mode) and Phase C (Claude Code hook trim) queued for a follow-up PR.
  Full measurement log and rationale in plan file
  `~/.claude/plans/i-would-like-us-eventual-sloth.md`. _Logged 2026-05-13._
