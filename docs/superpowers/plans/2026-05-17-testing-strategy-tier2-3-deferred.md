---
title: 'Testing Strategy — Tier 2 + Tier 3 (Deferred)'
audience: [developer]
category: implementation
status: deferred
date: 2026-05-17
related: [testing, vitest, projects, ci, playwright]
---

# Testing Strategy — Tier 2 + Tier 3 (Deferred Work)

**Status:** Planned, not scheduled. Surfaced 2026-05-17 during the wedge V1 post-launch testing audit. Tier 1 shipped as PR #198 (`9f7d731b`). Tier 2 + Tier 3 below preserved here so they're discoverable when the right window opens.

**See also:** [Tier 1 PR #198](https://github.com/jukka-matti/variscout/pull/198) · [docs/05-technical/implementation/testing.md](../../05-technical/implementation/testing.md) (current canonical testing doc)

---

## Context

PR #197 (wedge V1 post-launch cleanup) included a Canvas.test.tsx hang fix that surfaced the broader question: **is the rest of our testing infrastructure similarly fragile?** A focused audit + 2026 best-practice research produced a 3-tier plan:

- **Tier 1 — Tighten what's already there** → SHIPPED (PR #198): Math.random retirement + ESLint guard + fake-indexeddb trap docs + local TDD cheatsheet
- **Tier 2 — Consolidate via Vitest Projects** → DEFERRED (this doc)
- **Tier 3 — Restructure** → DEFERRED (this doc)

The audit found **solid fundamentals** (uniform Vitest 4.1.5 across 5 packages, consistent `vi.mock` patterns, 570 tests, architecture-test tripwires). The deferred work is opportunistic, not corrective.

---

## Tier 2 — Migrate to Vitest Projects (Workspaces successor)

**Estimated effort:** 3–5h, single PR, medium risk.
**Trigger for execution:** when a refactor needs to run a cross-package subset (e.g. "test ui + hooks only after a shared-types change"), OR when the per-package config drift becomes painful, OR when Vitest 5+ ships and deprecates the per-package pattern entirely.

### What changes

Replace the 5 separate `vitest.config.ts` files (one per package) with a single root `vitest.config.ts` that defines projects per package. Each per-package config stays but extends the root shared options.

### Why

- **Single source-of-truth** for shared options (pool, isolate, setupFiles, environment defaults). Cuts duplication.
- **Per-project overrides** only where they differ (e.g. `stores` keeps its custom setup; `core` uses `node` env; everyone else uses `jsdom`).
- **Local cross-package runs**: `pnpm vitest --project=ui --project=hooks` runs a subset in one command.
- **Coverage merges automatically** into one report when run from root.
- **Future-proofs**: Vitest 5+ further deprecates per-package configs.

### Migration shape

```ts
// vitest.config.ts (root, new)
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    projects: [
      './packages/core/vitest.config.ts',
      './packages/charts/vitest.config.ts',
      './packages/ui/vitest.config.ts',
      './packages/stores/vitest.config.ts',
      './packages/hooks/vitest.config.ts',
    ],
  },
});
```

Each per-package `vitest.config.ts` continues to exist (Turbo's per-package cache hashing needs them as inputs) but can import shared options from a root `vitest.shared.ts` if helpful.

### Files to touch

- `vitest.config.ts` (new at root) — define projects array
- `packages/{core,charts,ui,stores,hooks}/vitest.config.ts` — convert to project files; consider extracting shared options to `vitest.shared.ts`
- `turbo.json` — verify the `test` task `inputs` still includes each package's `vitest.config.ts` so per-package caching is preserved

### Validation

- `pnpm test` exit code + test count unchanged from baseline
- `pnpm vitest --project=ui --project=hooks` runs exactly those two packages
- Turbo cache hit-rate not degraded (per-package configs still hashed as inputs)

### Reference

[Vitest Projects (Workspaces successor)](https://vitest.dev/guide/projects) — 2026 monorepo pattern

---

## Tier 3 — Restructure (Larger / Future Asks)

Three independent items. Re-evaluate after Tier 2 lands.

### Tier 3a — Branded-type architecture guards

**Estimated effort:** 3–5h, separate PR.
**Trigger for execution:** next time someone tries to add a cross-investigation aggregation primitive (e.g. `aggregateCpk`); the current `architecture.noCrossInvestigationAggregation.test.ts` denylist catches obvious naming patterns but admits semantic cheating (a function named `unifiedQualityIndex()` doing the forbidden aggregation would pass).

#### What changes

Promote `packages/core/src/__tests__/architecture.noCrossInvestigationAggregation.test.ts` from substring-denylist tripwire to type-level enforcement. Follow the `ProcessHubId` pattern from PR #168 — opaque branded type + factory + predicate.

Sketch:

```ts
// packages/core/src/capability/branded.ts
declare const __cpkBrand: unique symbol;
export type Cpk<Scope extends 'investigation' | 'channel'> = number & {
  [__cpkBrand]: Scope;
};
export function asInvestigationCpk(n: number): Cpk<'investigation'> {
  return n as Cpk<'investigation'>;
}
// no asCrossInvestigationCpk function — the type makes the aggregation unutterable
```

#### Files to touch

- `packages/core/src/capability/` — new branded Cpk type + factories
- Existing Cpk consumers in `packages/core/src/stats/` — update signatures to use the branded type at boundaries
- `architecture.noCrossInvestigationAggregation.test.ts` — keep as defense-in-depth, or retire if the branded type makes the denylist redundant

#### Why this is bigger than it looks

Adding a branded type to a numeric primitive cascades through every stats function that produces/consumes Cpk. Worth the durability gain, but it's an "atomic-sweep" change per `feedback_atomic_sweep_one_dispatch` — one Opus implementer with Architect → Migration → Validator phases, not split into bite-sized tasks.

**Reference:** logged in `docs/investigations.md` as "Branded Cpk type as durable replacement" follow-up.

---

### Tier 3b — Profile + tune Vitest pool

**Estimated effort:** 1–2h investigation + decision; potentially 30min implementation.
**Trigger for execution:** when full `pnpm test` runtime crosses an annoyance threshold (e.g. >2min on the dev machine, blocks pre-push hooks too long).

#### What changes

Measure `pool: 'threads'` vs the default `pool: 'forks'` across the full suite. If `threads` is ≥20% faster with no flake regression, switch. Otherwise stay on `forks`.

#### How to investigate

```bash
# Baseline: pool=forks (current default)
time pnpm test 2>&1 | tee /tmp/test-forks.log

# Try threads
# In root vitest.config.ts (after Tier 2 lands, or in each per-package config):
# test: { pool: 'threads' }
time pnpm test 2>&1 | tee /tmp/test-threads.log

# Compare runtime + flake count (re-run each 3x to spot intermittents)
```

Risk: `forks` is the default because it's safer for compatibility (hanging process, segfaults). `threads` is faster for large suites but has caveats with native modules. Our suite uses jsdom + Dexie/IndexedDB; both work with either pool, but Dexie-heavy tests under threads may surface concurrency races that `forks` hides.

#### Decision data, not decision yet

This is an investigation, not a foregone conclusion. Worth profiling before committing to a switch.

**Reference:** [Vitest Improving Performance](https://vitest.dev/guide/improving-performance) · [Vitest pool config](https://vitest.dev/config/pool)

---

### Tier 3c — CI integration (scheduled nightly Playwright + optional coverage)

**Status:** explicitly deferred by user 2026-05-17 ("for ci, we want to keep it local for now"). Documented here for when the policy changes.

**Estimated effort:** 2–4h, separate PR.
**Trigger for execution:** when manual `claude --chrome` walks become too costly for the volume of PRs OR when test drift is missed in a way that costs more than the CI compute.

#### What would change

1. **Scheduled nightly Playwright** — add `.github/workflows/nightly-e2e.yml` running `apps/pwa` + `apps/azure` Playwright suites on `cron: '0 6 * * *'` UTC. **Non-blocking** (informational only). Finally exercises the existing E2E suite that's currently dark in CI.

2. **Optional coverage collection** — add `--coverage` step to the existing `deploy-azure-staging.yml` test job. Upload as build artifact. Non-blocking, just visibility. Existing per-package coverage thresholds (defined in each vitest config) become aspirational targets. A future PR could gate.

3. **(Much later)** — gate PRs on Playwright smoke run + coverage threshold compliance. This is the "we've outgrown the manual gate" milestone, not imminent.

#### Files to touch

- `.github/workflows/nightly-e2e.yml` (new)
- `.github/workflows/deploy-azure-staging.yml` (optional `--coverage` step)

#### Why deferred

Current gate is manual `claude --chrome` walks + the `bash scripts/pr-ready-check.sh` local check. The workflow trades CI speed for developer friction. The deferral honors the user's preference for keeping the CI footprint minimal until pain forces the change.

---

## Sequence (when execution starts)

Recommended order if all three Tier 3 items eventually ship:

1. **Tier 2 first** — Projects migration creates the single-root-config foundation that makes subsequent changes (pool tuning, branded-type test impacts) easier to apply uniformly.
2. **Tier 3b second** — Pool profiling is cheap and answers "do we even need pool changes" before committing further work.
3. **Tier 3a third** — Branded-type guards are the most impactful but also the highest-risk change. Land after Tier 2 + 3b so the test infra is at its most observable.
4. **Tier 3c last** — CI integration is policy-gated, not technical-gated. Comes when the team's preference shifts.

Each item is independent enough to ship out of order if priorities change.

---

## When to revisit this doc

- A test infrastructure regression (hang, flake, missing coverage) costs significant debug time
- The team starts running across-package test subsets often
- Vitest 5+ ships and deprecates the per-package config pattern
- A new contributor sneaks a `Math.random()` or `aggregateCpk` past code review (signal that the current guards are tripwires, not walls)
- CI preferences change

If none of those trigger, this doc can sit happily — Tier 1 closed the most urgent gaps.
