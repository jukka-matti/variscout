---
title: 'vi.mock partial-import pattern when adding store imports'
description: 'When adding `useCanvasStore` / `useProjectStore` / similar `@variscout/stores` imports to a hook, downstream test files mocking `@variscout/core` with a flat factory will break — `usePreferencesStore` reads `DEFAULT_TIME_LENS` etc. at module init. Switch consumer tests to the `vi.mock(import(''@variscout/core''), async (importOriginal) => { const actual = await importOriginal(); return { ...actual, ... } })` partial-mock pattern.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: f166dec4e59b0e88
origin-session-id: 9b1399c5-d8ba-4e26-8ce7-810d3c156d4b
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_vi_mock_import_original.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When adding new domain-store imports (`useCanvasStore`, `useProjectStore`, `usePreferencesStore`, etc. from `@variscout/stores`) to a hook or component that has consumer tests mocking `@variscout/core`, the flat `vi.mock('@variscout/core', () => ({ ... }))` factory will break. `usePreferencesStore` reads `DEFAULT_TIME_LENS` + `DEFAULT_RISK_AXIS_CONFIG` from `@variscout/core` at module init; if the test's mock factory doesn't return them, store creation crashes with `No "DEFAULT_TIME_LENS" export is defined on the "@variscout/core" mock`.

**Why:** VariScout's domain stores (`@variscout/stores`) read constants from `@variscout/core` at top-level. Adding a new store import to a hook expands the test's transitive module graph — but vi.mock factories are static. A flat factory that only returned parser shims (because the original hook only used parser exports) suddenly has to return every constant any transitively-imported store reads at init.

This trapped Canvas Polish v1 T2: adding `useCanvasStore` + `useProjectStore` to `useEditorDataFlow.ts` for snapshot stamping caused `apps/azure/src/hooks/__tests__/useEditorDataFlow.test.ts` to fail on a `DEFAULT_TIME_LENS`-missing error — a test the implementer had not modified.

**How to apply:**

When extending a hook with new `@variscout/stores` imports, also audit consumer test files for `vi.mock('@variscout/core', () => ({ ... }))` patterns. Convert them to the partial-mock form:

```ts
vi.mock('@variscout/core', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/core')>();
  return {
    ...actual,
    parseText: vi.fn(),
    detectColumns: vi.fn(),
    // ...other shims
  };
});
```

This keeps unrelated exports resolving normally so transitively-imported stores can initialize.

**Detection signal:** "No `<EXPORT>` export is defined on the `<package>` mock" when running tests after adding store imports. The export name in the error tells you what the transitively-imported module needs from `@variscout/core`.

**Compatible with `feedback_vi_mock_hoist_closure`:** the closure rule applies to top-level mock variables; the `importOriginal` partial-mock pattern is orthogonal — both can coexist on the same `vi.mock()` call.
