---
title: 'vi.mock factory must wrap top-level mocks in a closure'
description: 'Direct assignment `mock: myFn` in a vi.mock factory throws "Cannot access X before initialization" because vi.mock is hoisted; wrap as `mock: (...args) => myFn(...args)` instead'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: eab0a1531f21dc3e
origin-session-id: 67258c96-ac52-477b-af98-4fd0734d1510
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_vi_mock_hoist_closure.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When a `vi.mock()` factory references a top-level `vi.fn()` mock variable, the factory body must reference the mock through a closure (function call), not by direct assignment. Direct assignment breaks at hoist time.

**Why:** `vi.mock()` is hoisted to the very top of the file before any `const` declarations run. When the factory returns `{ name: mockFn }`, the lookup of `mockFn` happens at the moment the factory executes — which is before `const mockFn = vi.fn()` initializes the binding. Result: `ReferenceError: Cannot access 'mockFn' before initialization`.

The closure form `name: (...args) => mockFn(...args)` defers the lookup until call time, when the const has been initialized.

**How to apply:** When mocking a module export with a vi.fn() declared at the top of the test file:

```ts
// ❌ Breaks at hoist
vi.mock('../foo', () => ({
  bar: mockBar,
}));

// ✅ Works — closure defers the lookup
vi.mock('../foo', () => ({
  bar: (...args: unknown[]) => mockBar(...args),
}));

// ✅ Also works — vi.hoisted lifts the declaration
const { mockBar } = vi.hoisted(() => ({ mockBar: vi.fn() }));
vi.mock('../foo', () => ({ bar: mockBar }));
```

Other tests in this repo (e.g. `Editor.sustainment.test.tsx`) use the closure pattern for `useStorage`. Match that pattern when adding new module mocks.

Hit during PR #94 (F-7) when mocking `getEasyAuthUser`. Initial direct assignment failed; closure form fixed it.
