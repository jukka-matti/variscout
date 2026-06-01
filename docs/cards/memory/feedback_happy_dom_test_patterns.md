---
title: 'happy-dom-test-patterns'
description: 'Cross-DOM-impl test patterns that work in both jsdom and happy-dom. Use these by default — they improve robustness regardless of which DOM impl a package uses. Also a checklist when adopting happy-dom on a new package.'
purpose: remember
tier: card
status: active
date: 2026-05-28
topic: [memory, feedback]
related: []
verified-against-commit: ca45f469
last-verified: 2026-05-28
source-hash: 1c008c566758be88
origin-session-id: 85311cf8-0c99-4970-931f-5c1424d24b9e
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_happy_dom_test_patterns.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

**Rule**: when writing tests that touch browser globals (clipboard, storage, dialogs, mouse/wheel events, SVG transforms), use the cross-DOM-impl patterns below — not the jsdom-coupled patterns that look natural but only work in jsdom.

**Why**: jsdom and happy-dom diverge on subtle API details (writability, prototype chains, constructor option handling, format normalization). Tests written for one often break in the other. Cross-impl patterns improve robustness regardless of which DOM the package uses, and unlock happy-dom's 2.5x perf win when packages migrate.

**How to apply** — the 5 durable patterns surfaced during the 2026-05-25 vitest pool tuning (PR #208):

1. **`navigator.clipboard` mocking**: use `Object.defineProperty(navigator, 'clipboard', { value, configurable: true })` — NOT `Object.assign(navigator, { clipboard: ... })`. happy-dom marks `navigator.clipboard` as getter-only; `Object.assign` throws there. defineProperty works in both.

2. **Storage spies**: spy on the INSTANCE (`vi.spyOn(window.localStorage, 'getItem')`), not on `Storage.prototype`. happy-dom's localStorage doesn't share the same prototype chain as jsdom's, so prototype-level spies don't intercept.

3. **"Blocked storage" mock**: when the test needs ALL storage methods to throw, use `vi.stubGlobal('sessionStorage', { getItem: throwingFn, setItem: throwingFn, removeItem: throwingFn, ... })` + `vi.unstubAllGlobals()` at the end — NOT individual `vi.spyOn(...).mockImplementation(() => throw)` calls. happy-dom doesn't cleanly restore instance-spies via `restoreAllMocks`, causing cross-test pollution; `vi.stubGlobal` swaps the whole object and restores reliably.

4. **Inline color assertions**: use `normalizeColor()` from `packages/ui/src/test-utils/color.ts` to normalize hex→rgb before comparing. jsdom normalizes `#hex → rgb(r,g,b)` on read; happy-dom preserves the source format. `expect(el.style.color).toBe('rgb(...)')` against a `#hex` source value only works in jsdom.

5. **`window.confirm` / `MouseEvent` / `WheelEvent` / `SVGPoint`**: these are polyfilled in shared `test/setup.ts`. Don't duplicate the polyfills per-test; rely on the shared setup. If a NEW happy-dom gap surfaces, add the polyfill to `test/setup.ts` (gated behind `typeof X !== 'undefined'` so jsdom-mode takes the real impl).

**Migrating a new package to happy-dom**: change `vitest.config.ts` to `environment: 'happy-dom'` + `pool: 'threads'`, run tests, expect 1–20 failures, look at the actual error messages BEFORE assuming the package can't migrate (see [[investigate-failures-before-scoping-down]]). The 5 patterns above resolve the vast majority.

**Referenced fixes** (PR #208):

- `test/setup.ts` — shared polyfills for `window.confirm`, `SVGPoint.matrixTransform` (with both DOMMatrix a/b/c/d aliases AND m11/m21/m12/m22 canonical), `MouseEvent`/`WheelEvent` constructor patch (happy-dom 20.x silently drops `clientX`/`clientY` from init options).
- `packages/ui/src/test-utils/color.ts` — `normalizeColor()` helper.

Related: [[investigate-failures-before-scoping-down]], [[prefer-pragmatic-over-formal]], [[vi.mock partial-import pattern when adding store imports]] (different mock concern but same vitest-patterns space).
