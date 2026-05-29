---
tier: ephemeral
purpose: build
title: PR-LV1-B — F1 pendingExploreIntent → analysisScopeStore mirror
status: active
date: 2026-05-28
layer: spec
---

# PR-LV1-B — F1 `pendingExploreIntent` → `analysisScopeStore` mirror Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Dispatch **Sonnet implementer** per task (mechanical wiring; well-specified); spec compliance reviewer (Sonnet) + code quality reviewer (Sonnet) after each implementer reports DONE.

**Goal:** Extend Dashboard.tsx's existing F1 `pendingExploreIntent` apply-effect to ALSO dispatch `useAnalysisScopeStore.getState().setBoxplotFactor(intent.boxplotFactor)` alongside the existing local `setBoxplotFactor` write. No user-visible behavioral change; the dual write unblocks downstream PRs (LV1-E scope chrome, LV1-G canvas viz) to subscribe to the scope store.

**Architecture:** Single-file change in `apps/azure/src/components/Dashboard.tsx`: one import addition + one dispatch line inside the existing useEffect at lines 432–440. Local Dashboard `useState` for `boxplotFactor` stays — LV1-E retires it later. Tests extend the existing `describe('pendingExploreIntent consumer', ...)` block in `apps/azure/src/components/__tests__/Dashboard.test.tsx:637`.

**Tech Stack:** TypeScript 6 · React 19 · Zustand 5 · Vitest 4 · happy-dom (Azure app's test env via setup). No new dependencies.

**Parent spec:** [`docs/superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md`](../specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md) §5.6 (Migration of F1's pendingExploreIntent) · §3 D8.1 (focusedChart stays on F1 exit-button path)
**Master plan:** [`./2026-05-28-linked-views-phase-1-master-plan.md`](./2026-05-28-linked-views-phase-1-master-plan.md) PR-LV1-B row

---

## Grounded facts (already verified — sub-plan is locked to these)

1. **Apply-effect line range** in `apps/azure/src/components/Dashboard.tsx` is **430–440**, NOT 437–447 (master plan line numbers were stale).
2. **`PendingExploreIntent.boxplotFactor` already exists** in `apps/azure/src/features/panels/panelsStore.ts:5-8`. No type change needed.
3. **`setBoxplotFactor` in the effect (line 436) is LOCAL `useState`**, not the scope store. LV1-B ADDS a parallel scope-store dispatch; it does NOT replace the local write.
4. **PWA is OUT OF SCOPE** — F1 Task 6 documented the PWA does not consume `pendingExploreIntent`. LV1-B inherits the same scope (Azure-only).
5. **Real apply-side test file is `apps/azure/src/components/__tests__/Dashboard.test.tsx`** at the `pendingExploreIntent consumer` describe (line 637). The e2e file `f1-explore-exit-flow.test.tsx` tests the writer side only — its own header comment confirms this.
6. **Dashboard.test.tsx already imports `useProjectStore` from `@variscout/stores`** (line 5) without a `vi.mock` for that module — so we can import `useAnalysisScopeStore` from the same path without mocking the store.

---

## File structure

**Modify:**

- `apps/azure/src/components/Dashboard.tsx` — line 12 (add `useAnalysisScopeStore` to existing `@variscout/stores` import) + lines 432–440 (add scope-store dispatch + 3-line WHY comment inside the existing conditional).
- `apps/azure/src/components/__tests__/Dashboard.test.tsx` — line 5 (extend existing `@variscout/stores` import) + line 555 `beforeEach` (reset scope store) + line 637 describe block (add 2 new `it()` cases: positive scope mirror + negative gate).

**No changes:**

- `apps/azure/src/features/panels/panelsStore.ts` — type already correct
- `packages/stores/src/analysisScopeStore.ts` — LV1-A delivered the action
- `packages/ui/src/components/Canvas/EditMode/ExploreExitButton.tsx` — writer side untouched
- `apps/pwa/` — out of scope per Grounded fact #4

---

## Constraints forwarded to implementer

- **NEVER** `--no-verify` on commits (`feedback_subagent_no_verify`)
- **No `Math.random`** anywhere (core hard rule)
- **No `dark:` Tailwind variants** — not relevant here (no UI), listed for safety
- **Operate ONLY in the assigned worktree**, never `cd` to main repo (`feedback_subagent_worktree_discipline`)
- **Implementer verification scoped to <90s** per task (`feedback_implementer_long_bash_pitfall`) — use `pnpm --filter @variscout/azure-app test -- Dashboard --run`, NOT full `pnpm test`
- **`pnpm` needs `--` to forward args to vitest** (discovered in LV1-A): `pnpm --filter @variscout/azure-app test -- <pattern> --run`
- **Use direct `useAnalysisScopeStore.getState().setBoxplotFactor(...)` inside the effect**, NOT a React subscription — this is a one-shot dispatch on mount, mirroring the same `getState()` pattern used elsewhere for `panelsStore`
- **Preserve the existing `setBoxplotFactor` local-state call** — LV1-B is dual-write; LV1-E retires the local one
- **Preserve the existing `// eslint-disable-next-line react-hooks/exhaustive-deps` comment** on the effect — the dep set does not change
- **No emojis** in source code
- **No migration helpers / back-compat shims** (`feedback_wedge_v1_no_migration_no_backcompat`)
- **Bundle reviewer-flagged followups pre-merge** (`feedback_bundle_followups_pre_merge`)
- **Skip browser walks for wedge V1** (covered by `feedback_wedge_v1_no_migration_no_backcompat`)

---

## Task 1: Failing test — scope store receives `boxplotFactor` on intent apply

**Files:**

- Modify: `apps/azure/src/components/__tests__/Dashboard.test.tsx` (imports at line 5, beforeEach at line 555, describe block at line 637)

- [ ] **Step 1: Extend the `@variscout/stores` import**

Edit `apps/azure/src/components/__tests__/Dashboard.test.tsx` line 5 — current:

```typescript
import { useProjectStore } from '@variscout/stores';
```

Replace with:

```typescript
import {
  useProjectStore,
  useAnalysisScopeStore,
  getAnalysisScopeInitialState,
} from '@variscout/stores';
```

- [ ] **Step 2: Add scope-store reset to the existing `beforeEach`**

Locate the `beforeEach` at line 555 (currently resets `chartSetterSpies` + `usePanelsStore`). After the existing `usePanelsStore.setState({ pendingExploreIntent: null });` line (around line 564), append:

```typescript
// LV1-B: reset the linked-views scope store between tests so the mirror
// assertions can't see leftover state from a prior test's apply-effect.
useAnalysisScopeStore.setState(getAnalysisScopeInitialState());
```

The full beforeEach end region after this edit should read approximately:

```typescript
    chartSetterSpies.setBoxplotFactor.mockClear();
    chartSetterSpies.setFocusedChart.mockClear();
    usePanelsStore.setState({ pendingExploreIntent: null });
    // LV1-B: reset the linked-views scope store between tests so the mirror
    // assertions can't see leftover state from a prior test's apply-effect.
    useAnalysisScopeStore.setState(getAnalysisScopeInitialState());
  });
```

- [ ] **Step 3: Add the failing positive-mirror test**

Inside the existing `describe('pendingExploreIntent consumer', ...)` block at line 637, after the existing `it('applies intent with focusedChart + boxplotFactor on mount', ...)` test (which ends around line 649), add a new `it()` block:

```typescript
    it('LV1-B: mirrors intent.boxplotFactor into useAnalysisScopeStore on mount', () => {
      usePanelsStore.setState({
        pendingExploreIntent: { focusedChart: 'boxplot', boxplotFactor: 'Vessel' },
      });

      render(<Dashboard />);

      // LV1-B contract (spec §5.6): the apply-effect mirrors boxplotFactor
      // into the linked-views scope store alongside the local Dashboard
      // setState write. Downstream PRs (LV1-E scope chrome, LV1-G canvas viz)
      // subscribe to this store; LV1-E will retire the local-state write.
      expect(useAnalysisScopeStore.getState().boxplotFactor).toBe('Vessel');
    });
```

- [ ] **Step 4: Run test to verify it fails**

Run: `pnpm --filter @variscout/azure-app test -- Dashboard --run`

Expected: the new `LV1-B: mirrors intent.boxplotFactor into useAnalysisScopeStore on mount` test FAILS with `expected undefined to be 'Vessel'` (Dashboard.tsx hasn't been wired yet). All other Dashboard tests should remain green.

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/components/__tests__/Dashboard.test.tsx
git commit -m "$(cat <<'EOF'
test(wedge-v1): LV1-B — failing test for scope-store mirror in apply-effect

Asserts useAnalysisScopeStore.getState().boxplotFactor === 'Vessel' after
the F1 pendingExploreIntent apply-effect fires. Extends the existing
pendingExploreIntent consumer describe block in Dashboard.test.tsx; adds
scope-store reset to the shared beforeEach.

Fails until Task 2 wires Dashboard.tsx to dispatch the mirror.

Refs: docs/superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md §5.6
EOF
)"
```

---

## Task 2: Implementation — dispatch to `useAnalysisScopeStore` in the apply-effect

**Files:**

- Modify: `apps/azure/src/components/Dashboard.tsx` (line 12 import + lines 432–440 effect body)

- [ ] **Step 1: Extend the `@variscout/stores` import in Dashboard.tsx**

Edit `apps/azure/src/components/Dashboard.tsx` line 12 — current:

```typescript
import { useProjectStore, useViewStore } from '@variscout/stores';
```

Replace with:

```typescript
import { useProjectStore, useViewStore, useAnalysisScopeStore } from '@variscout/stores';
```

- [ ] **Step 2: Add the scope-store dispatch inside the existing conditional**

Locate the apply-effect at lines 432–440. Current body:

```typescript
useEffect(() => {
  if (!pendingExploreIntent) return;
  setFocusedChart(pendingExploreIntent.focusedChart);
  if (pendingExploreIntent.boxplotFactor) {
    setBoxplotFactor(pendingExploreIntent.boxplotFactor);
  }
  clearPendingExploreIntent();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- single-use intent: only fire when intent transitions to non-null
}, [pendingExploreIntent]);
```

Replace with:

```typescript
useEffect(() => {
  if (!pendingExploreIntent) return;
  setFocusedChart(pendingExploreIntent.focusedChart);
  if (pendingExploreIntent.boxplotFactor) {
    setBoxplotFactor(pendingExploreIntent.boxplotFactor);
    // LV1-B: mirror boxplotFactor into the linked-views scope store so
    // downstream consumers (LV1-E scope chrome, LV1-G canvas viz) can
    // subscribe. The local setState above retires when LV1-E ships.
    useAnalysisScopeStore.getState().setBoxplotFactor(pendingExploreIntent.boxplotFactor);
  }
  clearPendingExploreIntent();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- single-use intent: only fire when intent transitions to non-null
}, [pendingExploreIntent]);
```

- [ ] **Step 3: Run test to verify it passes**

Run: `pnpm --filter @variscout/azure-app test -- Dashboard --run`

Expected: `LV1-B: mirrors intent.boxplotFactor into useAnalysisScopeStore on mount` now PASSES. All other Dashboard tests still pass — in particular the existing `applies focusedChart-only intent without setting boxplotFactor` test should remain green (the conditional gate is preserved; the new mirror sits inside the same `if` block).

- [ ] **Step 4: Commit**

```bash
git add apps/azure/src/components/Dashboard.tsx
git commit -m "$(cat <<'EOF'
feat(wedge-v1): LV1-B — mirror boxplotFactor into analysisScopeStore on intent apply

F1 pendingExploreIntent apply-effect now dispatches to
useAnalysisScopeStore alongside the existing local setBoxplotFactor.
Dual write is intentional: LV1-E (Explore scope chrome) will retire the
local Dashboard state once downstream charts subscribe to the store.

No user-visible behavioral change. Unblocks LV1-E / LV1-G consumers.

Refs: docs/superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md §5.6
EOF
)"
```

---

## Task 3: Negative test — intent without `boxplotFactor` leaves scope untouched

**Files:**

- Modify: `apps/azure/src/components/__tests__/Dashboard.test.tsx` (add one `it()` inside the existing describe at line 637)

- [ ] **Step 1: Add the negative-gate test**

Inside the same `describe('pendingExploreIntent consumer', ...)` block, after the Task 1 test, add:

```typescript
    it('LV1-B: focusedChart-only intent leaves scope.boxplotFactor undefined', () => {
      usePanelsStore.setState({
        pendingExploreIntent: { focusedChart: 'ichart' },
      });

      render(<Dashboard />);

      // The mirror sits inside the same `if (pendingExploreIntent.boxplotFactor)`
      // guard as the local setBoxplotFactor write. When the intent omits the
      // factor, the scope-store stays at its initial state.
      expect(useAnalysisScopeStore.getState().boxplotFactor).toBeUndefined();
    });
```

- [ ] **Step 2: Run the full Dashboard test file to confirm no regressions**

Run: `pnpm --filter @variscout/azure-app test -- Dashboard --run`

Expected: all tests PASS, including:

- The new Task 1 positive-mirror test
- The new Task 3 negative-gate test
- The original four `pendingExploreIntent consumer` tests (`applies intent with focusedChart + boxplotFactor on mount`, `applies focusedChart-only intent without setting boxplotFactor`, `does nothing when pendingExploreIntent is null on mount`, `intent overrides persisted initialViewState.focusedChart`)
- All other Dashboard tests untouched

- [ ] **Step 3: Commit**

```bash
git add apps/azure/src/components/__tests__/Dashboard.test.tsx
git commit -m "$(cat <<'EOF'
test(wedge-v1): LV1-B — negative-gate test for scope-store mirror

Asserts useAnalysisScopeStore.getState().boxplotFactor stays undefined
when the intent omits boxplotFactor (focusedChart-only path). Locks the
contract that the mirror lives inside the same conditional guard as the
existing local setBoxplotFactor write.

Refs: docs/superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md §5.6
EOF
)"
```

---

## Acceptance signal (end-of-PR, pre-final-review)

- `pnpm --filter @variscout/azure-app test -- Dashboard --run` — all green (existing 4 consumer tests + 2 new LV1-B tests).
- `pnpm --filter @variscout/azure-app build` — clean (no new tsc errors from the import or dispatch).
- `bash scripts/pr-ready-check.sh` — green (controller-level pre-PR sweep). If `ControlEditors.test.tsx` surfaces a flake, confirm pre-existing via `git diff --stat main..HEAD -- apps/azure/src/components/ControlEditors` returning empty + document in PR description (same handling as LV1-0 / LV1-A).
- Branch contains exactly 3 commits (test → impl → negative test) — preserve via `gh pr merge --merge --delete-branch`, never `--squash` (`feedback_preserve_commit_history`).
- F1 → Explore manual flow not required (wedge V1 no-browser-walk policy).

---

## Why this plan (and not a bigger one)

LV1-B is a 2-line code change (1 import addition + 1 dispatch line + a 3-line WHY comment) plus 2 test cases. The smallest viable migration that unblocks LV1-E (scope chrome subscribes to store) and LV1-G (canvas viz subscribes to store). Folding LV1-C (binary retire) here would couple two unrelated concerns; the master plan separated them intentionally.

The local Dashboard `setBoxplotFactor` state is NOT retired in this PR — its retirement is contingent on the Explore scope chrome (LV1-E) reading from the store. LV1-B keeps the dual write deliberately to satisfy spec §5.6's "no behavioral change" guarantee.

---

## Related

- Parent spec §5.6: `docs/superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md`
- Master plan PR-LV1-B row: `docs/superpowers/plans/2026-05-28-linked-views-phase-1-master-plan.md`
- LV1-A precedent (scope store): `docs/superpowers/plans/2026-05-28-pr-lv1-a-analysis-scope-store.md`
- F1 sub-plan (writer side): `docs/superpowers/plans/2026-05-28-canvas-connection-journey-f-1-explore-exit.md`
- Memory: `feedback_subagent_no_verify`, `feedback_subagent_worktree_discipline`, `feedback_implementer_long_bash_pitfall`, `feedback_wedge_v1_no_migration_no_backcompat`, `feedback_bundle_followups_pre_merge`, `feedback_preserve_commit_history`
