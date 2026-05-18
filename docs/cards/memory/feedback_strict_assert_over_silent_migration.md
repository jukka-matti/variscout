---
title: 'Strict-assert > silent migration when stored-data shape changes'
description: 'When a rename / schema change ships and old data shape is still readable, prefer a strict throw on unknown values over a silent value translation. Loud failure beats silent translation.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: e3572ac4380ddd7c
origin-session-id: 4dc98d7b-6a43-414c-8387-61555905cfc7
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_strict_assert_over_silent_migration.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When you ship a rename or schema change that affects values stored in IndexedDB / Dexie / .vrs files / persistence layers, and pre-rename data may still be in dev fixtures or browser storage, **prefer a strict assertion that throws on unknown values over a silent migration shim that translates old → new**.

**Why:** Per RPS V1 PR-RPS-1 review + follow-up fix (2026-05-09) — Codex's initial implementation included a migration shim mapping legacy stored values (`'suspected'` → `'proposed'`, `'not-confirmed'` → `'refuted'`) for backward-compat with pre-rename data. The reviewer flagged this as contradicting RPS V1 D15 ("no backward compatibility per design phase"). The follow-up fix replaced the shim with `assertHypothesisStatus()` that throws `Invalid HypothesisStatus encountered during deserialization: <value>` on any value not in the canonical 5-state set. The corresponding test was rewritten from `'migrates legacy hypothesis status values on load'` to `'throws on unknown hypothesis status values (no silent migration per RPS V1 D15)'`.

**Why strict-assert is better than silent migration:**

1. **Loud failure surfaces stale dev data immediately** — developer sees the error, runs `pnpm dev:reset`, gets clean state. Silent migration hides the staleness behind seemingly-working UI that might subtly differ from the new model's semantics.
2. **No drift between asserted contract and stored contract** — the assertion IS the contract; if it passes, you have valid data; if it fails, you know exactly what's wrong and where.
3. **Migration shims accumulate as design phases iterate** — by V3 you've got 5 layers of shims for 5 generations of stored values. Strict-assert keeps the codebase free of this debris.
4. **Easier to remove** — when you eventually want to delete the old shape entirely, an assertion is one line to delete; a migration is a code path that may have unknown coupling.
5. **Honors design-phase commitments** — when the spec says "no backward compatibility" (per `feedback_no_backcompat_clean_architecture` + RPS V1 D15), strict-assert is the implementation faithful to the commitment.

**When silent migration IS appropriate:**

- Live customer data with no dev:reset escape hatch (production migrations)
- Multi-version coexistence requirements (paid SaaS where users update at different cadences)
- Schema changes that are intentionally backward-compatible (e.g., adding optional fields)

In design phase with no live customers — never. Strict-assert always.

**How to apply:**

Implementation pattern (TypeScript):

```ts
const VALID_VALUES = new Set<MyType>(['proposed', 'evidenced', 'confirmed', 'refuted', 'needs-disconfirmation']);

function assertMyType(value: unknown, context: string): MyType {
  if (typeof value === 'string' && VALID_VALUES.has(value as MyType)) {
    return value as MyType;
  }
  throw new Error(`Invalid MyType encountered during ${context}: ${JSON.stringify(value)}`);
}
```

Use at the deserialization boundary. Pair with a test that asserts the throw:

```ts
it('throws on unknown values (no silent migration per spec D15)', () => {
  expect(() => deserialize({ field: 'legacyValue' })).toThrow(/Invalid MyType/);
});
```

**Related:**
- `feedback_no_backcompat_clean_architecture` — internal package APIs: required props by default, refactor consumers in same PR
- `project_response_path_system_v1` D15 — spec commits to no backward compatibility in design phase
- `feedback_three_boundary_safety` — fail loud at boundaries (parser B1 / stats B2 / display B3)
