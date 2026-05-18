---
title: 'PR-RPS-4 Wall brush-to-pin: automated Playwright E2E deferred'
purpose: decide
tier: card
status: active
date: 2026-05-09
topic: ['decisions', 'canvas', 'investigation', 'wall']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---
> **Decision card** — extracted from `docs/decision-log.md` §1 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# PR-RPS-4 Wall brush-to-pin: automated Playwright E2E deferred

Master-plan Task 20 called for `apps/azure/e2e/wall-brush-to-pin.spec.ts` exercising the full
  drag→confirm→Finding-count flow. Investigation state (`useInvestigationStore`) is session-only
  with no IndexedDB persistence and no `window` test hook. A UI-drive variant would require a
  30+-step CSV-upload→parse→frame→hypothesize→brush flow, brittle and slow. Unit + integration
  test coverage is comprehensive (6 cases on BrushToFindingFlow + MiniIChart/MiniBoxplot gesture
  tests + WallCanvas panel tests); manual `--chrome` walk covers UX. Re-evaluate when investigation
  state lands a HubRepository.dispatch path or a test-hook becomes available.
  A `test.skip` future-anchor lives at `apps/azure/e2e/wall-brush-to-pin.spec.ts`. _Logged 2026-05-09._
