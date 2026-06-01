---
title: 'investigate-failures-before-scoping-down'
description: 'When a runtime/DOM/dep change surfaces multiple test failures, investigate the actual error messages BEFORE deciding to fall back or narrow scope. Failure COUNT misleads — many "scary" failure counts collapse to a handful of test-quality patterns once you read the errors.'
purpose: remember
tier: card
status: active
date: 2026-05-28
topic: [memory, feedback]
related: []
verified-against-commit: ca45f469
last-verified: 2026-05-28
source-hash: 17a2cc7a83ef5f51
origin-session-id: 85311cf8-0c99-4970-931f-5c1424d24b9e
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_investigate_failures_before_scoping_down.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

**Rule**: when a perf-tuning / dep-upgrade / runtime-swap change surfaces N test failures (where N looks scary), read the actual error messages for at least 3-4 failures across different files BEFORE deciding to fall back or narrow scope. The right scope decision needs root cause data, not failure count.

**Why**: failure counts are misleading proxies for scope. A single beforeEach-level bug can produce dozens of test-name-level failures from one file. Counting failures and scoping based on the count leads to premature retreats.

**How to apply**: 

- If the controller proposes "X failures > threshold, fall back" — pause and dispatch one diagnostic pass per failure pattern first. Categorize: test-quality issue / API gap / real regression.
- Common categories to look for: (a) brittle assertions tied to one implementation's behavior; (b) shared beforeEach setup using an API the new runtime doesn't support; (c) cross-test pollution from spies that don't restore cleanly. None of these scale with N; they scale with "number of distinct patterns".
- Estimate fix time as `patterns × ~15min`, not `failures × time-per-failure`.

**Concrete example** (PR #208 vitest happy-dom adoption, 2026-05-25):
- @variscout/hooks switched to happy-dom → 30 failures across 5 test files. My instinct: fall back to V1 (jsdom + threads).
- User pushed back: "could we fix them?"
- Investigation: all 30 failures came from ONE beforeEach pattern (`Object.assign(navigator, { clipboard: {...} })` — getter-only in happy-dom).
- 1-line fix (`Object.defineProperty` instead): all 30 failures resolved.
- @variscout/ui surfaced 8 failures across 4 patterns; investigated each, polyfilled 3, fixed 2 as test quality, deferred 0. All 2140 tests now pass.

**Related**: [[happy-dom-test-patterns]] (the specific patterns from this case), [[systemic-fixes-over-patching]] (industry-standards orientation), [[prefer-pragmatic-over-formal]] (counterpoint — don't over-investigate when industry consensus is strong).
