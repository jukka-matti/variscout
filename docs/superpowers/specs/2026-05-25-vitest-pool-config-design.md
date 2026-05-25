---
tier: living
purpose: design
title: Vitest pool config tuning — 2x dev test loop on the slow packages
audience: human
category: design-spec
status: draft
last-reviewed: 2026-05-25
implements:
  - docs/05-technical/implementation/testing.md
related:
  - docs/superpowers/plans/2026-05-25-vitest-pool-config-tuning.md
  - docs/ephemeral/investigations.md
  - packages/hooks/CLAUDE.md
  - test/setup.ts
---

# Vitest pool config tuning — 2x dev test loop

## Context

`pnpm test` on the slow `@variscout/*` packages spends most of its wall-clock in jsdom environment setup, not in actual test logic. Observed numbers from PR #117's `pr-ready-check` run on a clean tree (vitest 4.1.7, `forks` pool, jsdom):

| Package             | Tests | Wall  | Env time (sum across workers) | tests time |
| ------------------- | ----- | ----- | ----------------------------- | ---------- |
| `@variscout/charts` | 170   | 30.5s | 86s                           | 4s         |
| `@variscout/hooks`  | 1213  | 74.8s | **295s**                      | 6.6s       |
| `@variscout/ui`     | 2140  | 86.6s | 177s                          | 24s        |

`packages/hooks/CLAUDE.md` already documents a symptom: _"Flaky test watch: `packages/hooks/src/__tests__/index.test.ts` can timeout under concurrent Turbo load; passes when run alone."_ Same root cause — per-file JSDOM init contending under turbo's parallelism.

This spec scopes a benchmark-driven tuning round to land the **2x dev-loop improvement** approved by the user. Apps (`apps/azure`, `apps/pwa`) are deliberately deferred — they have explicit `pool: 'forks', fileParallelism: false` tuning with unknown rationale (memory pressure suspected per `apps/azure/vite.config.ts` `execArgv: ['--max-old-space-size=4096']`); changing apps requires `git blame` archaeology first and lives in a follow-up PR.

## Goals + non-goals

**In scope (this spec):**

- Benchmark 4 pool/DOM variants against the 3 slow jsdom packages (`charts`, `hooks`, `ui`).
- Adopt the winner per-package, with explicit adoption rules.
- Document outcomes + the durable test-perf playbook.

**Out of scope (this spec, tracked elsewhere):**

- `apps/azure` + `apps/pwa` vitest tuning (separate follow-up after the apps-vs-package archaeology).
- `@variscout/core` and `@variscout/stores` — already `environment: 'node'`, baseline is cheap.
- Vitest Projects migration (Tier 2 of `docs/ephemeral/investigations.md` § "Testing strategy — Tier 2 + Tier 3 deferred work").
- CI runtime gains — assumption is they're proportional to local; not measured.

## Approach — pool + DOM swap, benchmark first

**Recommended: Approach B (per brainstorm, 2026-05-25).** `pool: 'threads'` + `environment: 'happy-dom'` for the slow packages, gated on benchmark + zero-regression test runs. Vitest's official 2026 guidance recommends `threads` over `forks` for performance ("`vmThreads` is slowest on initial run — use `threads` instead"). happy-dom is ~2.5x faster than jsdom in published benchmarks; React Testing Library works seamlessly with both ("no library changes needed when switching" — Vitest discussion #1607).

Skipped approaches:

- **`pool: 'vmThreads'`** — official Vitest docs say slower on first run; not worth measuring.
- **`isolate: false`** — measured but not adopted by default. Defeats per-file isolation that `fake-indexeddb/auto` + Zustand `setState(initial)` patterns assume. Past incident (`feedback_pr_ready_check_vitest_hang` memory) shows we've eaten unexplained vitest hangs; paying for that again to save a few seconds isn't worth it.

## Experiment matrix

| ID  | pool              | environment | isolate          | Notes                                                    |
| --- | ----------------- | ----------- | ---------------- | -------------------------------------------------------- |
| V0  | `forks` (default) | `jsdom`     | `true` (default) | Baseline — current state                                 |
| V1  | `threads`         | `jsdom`     | `true`           | Pure pool swap, lowest risk                              |
| V2  | `threads`         | `happy-dom` | `true`           | Pool + DOM swap (recommended adoption)                   |
| V3  | `threads`         | `happy-dom` | `false`          | Aggressive — data-gathering only, not adopted by default |

**Measurement protocol** per `(package, variant)`:

- 3 runs each: 1 cold (`rm -rf packages/<pkg>/node_modules/.vite` first), 2 warm.
- Record: total wall-clock, env time, transform time, import time, test time (vitest 4.x reports these phases on the `Duration ... (transform Xs, setup Ys, ...)` line).
- Record: pass/fail count + any new failures vs baseline.
- Run isolated: `pnpm --filter <pkg> test -- --run` (no turbo, no other packages running concurrently).

Total: 4 variants × 3 packages × 3 runs = **36 measurements**, ~1.5h end-to-end including compile + analysis.

## Benchmark harness — `scripts/bench-vitest.sh`

Thin shell script. Reasons against a proper bench framework: 36 measurements fit in a CSV; output format is stable vitest 4.x phase lines; we're not building regression infrastructure.

**Behavior:**

1. Reads variant definitions (4 inline templates for V0–V3 inside the script).
2. For each `(package, variant)`:
   - Back up `packages/<pkg>/vitest.config.ts` to a `.bak`.
   - Write the variant config into place.
   - Cold run (delete `.vite` cache first): `time pnpm --filter <pkg> test -- --run`.
   - Two warm runs (no cache delete).
   - Parse vitest output; append a row to `/tmp/bench-vitest.csv`: `pkg, variant, run_kind, total_ms, env_ms, transform_ms, import_ms, tests_ms, pass_count, fail_count`.
   - Restore original config from `.bak`.
3. After all runs: print a summary table to stdout grouped by package, variants sorted by warm-run median total.

**Safety guarantees:**

- `trap EXIT` always restores the original config from `.bak` (handles SIGINT, errors).
- Skip a variant if test count drops (likely indicates a regression masquerading as a perf win).
- Hard timeout per run (240s); if a variant deadlocks, log and continue with the next variant.

## Adoption decision rules

After benchmark CSV is in hand, apply per-package:

1. **No variant beats baseline by ≥30%** → ship nothing for that package. Document in this spec under "Outcomes" why (already optimal, or other bottleneck dominates).
2. **V1 (pool-only) wins by 30–80%** → adopt V1.
3. **V2 (pool + happy-dom) wins by ≥80% AND tests pass unchanged** → adopt V2.
4. **V2 wins but ≤5 happy-dom-edge-case failures (specific selector / focus event)** → patch the failing tests + adopt V2.
5. **V2 wins but >5 failures OR any failures are unclear** → fall back to V1.
6. **V3 (`isolate: false`) wins by ≥150% AND tests pass unchanged** → document the win, open follow-up investigation card, **do NOT adopt by default**.

**Cross-package consistency note:** the ideal is all 3 jsdom packages land on the same variant. If they diverge (e.g., ui works on V2 but hooks needs V1), document the divergence reason per-package — the inconsistency is a code smell worth flagging.

**Per-package config change pattern** (when adopting V1 or V2):

```ts
// Rationale: see docs/superpowers/specs/2026-05-25-vitest-pool-config-design.md
export default defineConfig({
  test: {
    pool: 'threads', // V1+V2
    environment: 'happy-dom', // V2 only
    // ... rest unchanged
  },
});
```

## Verification + rollback

**Pre-flight (before any config edits):**

- Capture main's `pr-ready-check` timing as the durable baseline (one clean run, recorded under "Outcomes" below).
- Smoke-test the smallest jsdom package (`charts`) under each variant to confirm `fake-indexeddb/auto` still installs cleanly.

**Shipping shape:** one PR for all 3 packages, with 3 commits inside (one per package — `charts` → `hooks` → `ui`, in increasing-risk order). Single PR keeps the spec→benchmark→adoption story coherent for review; per-package commits keep the rollback surgical if a regression surfaces later.

**Per-package adoption gate:**

1. `pnpm --filter <pkg> test -- --run` — all tests pass, count matches baseline.
2. `pnpm --filter <pkg> test -- --run` × 5 in a row — no flakes.
3. `pnpm --filter <pkg> build` — types still compile.
4. Commit per-package change to the branch.

**Whole-branch gate (before PR review):**

1. `pnpm build` — full monorepo green.
2. `bash scripts/pr-ready-check.sh` — green end-to-end.
3. Capture before/after `pr-ready-check` timing in the PR description.
4. Opus code-reviewer subagent dispatched per `feedback_subagent_driven_default` + `feedback_code_review_subagent_must_checkout_pr_branch`.

**Rollback plan:**

- Each per-package config change is a 2-line revert — independent, not coupled.
- If a package's tests start flaking on main after a few days, revert that package's config and open an investigation card; leave other packages on the new config.
- Worst case: revert all 3 packages (single commit, ~6 lines).

**Risks accepted by this design:**

- happy-dom may surface 1–2 test failures requiring narrow patches. Acceptable cost.
- We don't measure CI runtime gains — assumption is they're proportional to local.
- `apps/azure` + `apps/pwa` are deferred. The benchmark harness can be re-run against them in a follow-up PR once we have archaeology context on their existing `fileParallelism: false` tuning.

## Outcomes (delivered 2026-05-25)

**Per-package isolated wall-clock (before → after):**

| Package             | Baseline (V0) | Adopted                  | After | Speedup   |
| ------------------- | ------------- | ------------------------ | ----- | --------- |
| `@variscout/charts` | ~5s           | V2 (threads + happy-dom) | 3.5s  | **~30%**  |
| `@variscout/hooks`  | ~75s          | V2 (threads + happy-dom) | 28.7s | **~2.6x** |
| `@variscout/ui`     | ~86s          | V2 (threads + happy-dom) | 30.4s | **~2.8x** |

**Cross-package consistency:** all 3 jsdom packages adopted V2 (threads + happy-dom). Apps deferred per spec scope.

**Adoption path was iterative, not bench-driven:** the user pivoted away from the formal 36-measurement bench during execution (the per-run pnpm/turbo wrapper overhead made the bench ~50 min/package, not the 5–8 min the spec estimated). Switched to direct-apply + per-package isolated runs. Same end signal (config works + perf wins), faster wall-clock to validate.

**Happy-dom compatibility fixes shipped in this PR** (test-quality improvements that work in both DOM impls):

- `test/setup.ts` polyfills: `window.confirm` stub, `SVGPoint.matrixTransform` (with DOMMatrix a/b/c/d aliases AND m11/m21 canonical), `MouseEvent`/`WheelEvent` constructor patch (happy-dom 20.x silently drops `clientX`/`clientY`)
- `packages/ui/src/test-utils/color.ts`: shared `normalizeColor()` helper for hex→rgb (jsdom normalizes on read, happy-dom preserves source format)
- Per-test patterns: `Object.assign(navigator, {clipboard:...})` → `Object.defineProperty(...)`; `vi.spyOn(Storage.prototype, ...)` → `vi.spyOn(window.localStorage, ...)`; `vi.stubGlobal('sessionStorage', ...)` for the "blocked storage" test (happy-dom doesn't cleanly restore instance-spies via `restoreAllMocks`)

**Failures discovered + resolved:** 38 initial failures across hooks (30) + ui (8). Every failure traced to a test-quality issue (jsdom-coupled assertion, instance-spy pattern, missing constructor option in happy-dom). Final state: 0 failures on V2.

**Retired flaky-test note in `packages/hooks/CLAUDE.md`:** deferred — needs 3 consecutive clean turbo runs of `pr-ready-check.sh` on the post-merge main before retiring. First clean run captured in this PR; revisit on 2026-05-26+ after 2 more.

**V3 (`isolate: false`) not measured** — per spec rule, not adopted regardless; the failure-fixing investment proved V2 sufficient.

## Lesson logged

The formal benchmark-then-decide framework in this spec (Section "Experiment matrix") was over-engineered for the actual problem. Industry consensus on `pool: 'threads'` + happy-dom is strong (per the 2026 Vitest docs + happy-dom benchmarks cited in research); the meaningful question was always whether OUR specific suite tolerates happy-dom. Direct-apply + per-package isolated runs answered that in less time than the bench harness would have produced. Captured as a process lesson — for future perf-tuning specs, favor direct experimentation over formal benchmark harness when the published evidence is strong.

## Follow-ups (separate PRs)

- **Apps tuning** — `git blame apps/*/vite.config.ts` for the rationale behind `fileParallelism: false`. If the rationale is stale (the underlying bug got fixed), re-enable + re-benchmark. If load-bearing, document it.
- **Vitest Projects migration** — Tier 2 of `docs/ephemeral/investigations.md` § "Testing strategy — Tier 2 + Tier 3 deferred work". Larger refactor; only worth doing if the per-package tuning here doesn't deliver enough.
