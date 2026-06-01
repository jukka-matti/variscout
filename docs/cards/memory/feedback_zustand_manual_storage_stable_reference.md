---
title: 'feedback-zustand-manual-storage-stable-reference'
description: 'When mirroring the activeIPStore manual-localStorage pattern, every "no data" fallback MUST return a stable reference (frozen singleton / null), not a fresh allocation. Zustand snapshot equality is by reference; a fresh `[]` on every render causes React infinite-render loops.'
purpose: remember
tier: card
status: active
date: 2026-05-28
topic: [memory, feedback]
related: []
verified-against-commit: ca45f469
last-verified: 2026-05-28
source-hash: c35b1add00405478
origin-session-id: a3802373-c94c-4af4-9a9e-1ba0c66067a7
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_zustand_manual_storage_stable_reference.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When mirroring the `activeIPStore` "manual localStorage with per-user/per-scope key" pattern in another Zustand store, **every "no data" fallback must return a stable reference**, never a fresh array/object literal.

**Why:** Zustand's snapshot equality check is reference equality. A selector that returns `get().byKey[k] ?? []` produces a NEW `[]` on every render when the key is absent — Zustand sees "value changed" and re-renders, the render calls the selector again, gets another fresh `[]`, etc. React caps at "Maximum update depth exceeded" and crashes. The `activeIPStore` precedent avoids this by returning `null` (a stable reference) when no scope is found: `get().activeIPs[key] ?? null`. PR #209 hit this trap — `getPendingInvites` returned fresh `[]` → infinite loop in PWA + Azure mount; fixed via `EMPTY_INVITES = Object.freeze([])` singleton mirroring activeIPStore's stable-null shape.

**How to apply:** Whenever a new store mirrors this manual-storage pattern (caller-supplied scope/userId per call, encoded into the localStorage key), audit every reader for the no-data branch. If the natural return type can be `null`, use `null`. If it must be an empty collection (e.g., a UI expects to map over it), declare a `const EMPTY: readonly T[] = Object.freeze([])` at the module top and return that. Confirm by mounting the store in a real component test that exercises the empty case — package-only tests miss the React-render-loop because they call selectors imperatively, not through `useStore`. The Opus reviewer also flagged a sibling discipline gap on the same PR: when adding `rehydrate*` to the manual pattern, every consumer needs a `useEffect(() => rehydrate(scope), [scope, rehydrate])` mount-effect mirroring `useActiveIPContext`'s rehydrate hookup — without it, persistence is write-only (in-memory starts empty, first write reads `{} ?? []`, appends, and clobbers any persisted value). See `packages/stores/src/activeIPStore.ts` + `apps/azure/src/hooks/useActiveIPContext.ts` for the canonical shape both halves should mirror together.

Related: [[feedback_subagent_driven_default]], [[feedback_implementer_long_bash_pitfall]], [[feedback_verify_subagent_staging_gap]].
