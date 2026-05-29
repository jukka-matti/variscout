---
tier: ephemeral
purpose: build
title: PR-LV1-C — Retire authoringMode + EditModeShell + CanvasModeToggle + Done button
status: active
date: 2026-05-28
layer: spec
---

# PR-LV1-C — Retire `authoringMode` + `EditModeShell` + `CanvasModeToggle` + Done button

> **For agentic workers:** ONE Opus implementer dispatch with internal Architect → Migration → Validator phases per `feedback_atomic_sweep_one_dispatch`. NOT split into many bite-sized tasks (multiplies orchestration cost without buying review depth for a tsc-wide cascading deletion). After the implementer reports DONE, spec compliance reviewer (Sonnet) + code quality reviewer (Sonnet) on the FULL branch. Final-branch Opus review before merge.

**Parent spec:** [`docs/superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md`](../specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md) §3 D1 (Kill State/Edit binary) + D3 (Done button retires)
**Master plan:** [`./2026-05-28-linked-views-phase-1-master-plan.md`](./2026-05-28-linked-views-phase-1-master-plan.md) PR-LV1-C
**Atomic-sweep precedent:** [`./2026-05-28-pr-lv1-0-remove-yamazumi-mode.md`](./2026-05-28-pr-lv1-0-remove-yamazumi-mode.md) — same structural pattern; LV1-C is a smaller, more contained cascade.

**Goal:** Delete the `authoringMode` state machine, `EditModeShell` component, `CanvasModeToggle` toggle UI, `CanvasAuthoringMode` type, and Done button. Inline EditModeShell's chrome (Header sans Done + EditModeToolbar + 3-zone grid + DndContext wrapper) directly into `CanvasWorkspace`. Canvas becomes always-editable subject to the surviving `canEditCanvas` permission. `l3Archetype` derives from `canEditCanvas` instead of `effectiveAuthoringMode`. No user-visible behavior change for edit affordances; the toggle and Done buttons simply disappear.

**Rationale recap (spec §3 D1 + D3):**

- **D1 — Kill the State/Edit binary.** Old State/Edit binary inherited from a retired Process Owner / continuous-monitoring workflow. Wedge V1 doesn't need mode ceremony — canvas is always directly editable subject to the existing `canEditCanvas` permission. Edit affordances appear contextually (hover/click). No transition ceremony.
- **D3 — Done button retires.** No mode to exit. Delete the Done button + its `handleShellDone` callback + the `setAuthoringMode('read')` paths.

**Architecture:** Three internal phases for the single Opus dispatch.

- **Architect** (~15 min): map the deletion graph + render-shape decisions. Read `CanvasWorkspace.tsx`, `EditModeShell.tsx`, `CanvasLevelRouter.tsx`, `CanvasModeToggle/index.tsx` end-to-end. Decide where in CanvasWorkspace's b1 render path the inlined chrome lives (Header at top, EditModeToolbar below, 3-zone grid as the main body, DndContext wrapping). Verify CanvasWorkspace does not already have a DndContext wrapping the b1 path (if it does, merge EditModeShell's drag handlers into the existing one).
- **Migration** (~60-90 min): execute the deletion in dependency order. Inline EditModeShell's chrome into CanvasWorkspace FIRST (no breakage; new render path coexists with the old EditModeShell mount temporarily). Then remove the EditModeShell mount + `handleShellDone`. Then delete `EditModeShell.tsx` + its tests. Then remove `authoringMode` useState + safety effect + `effectiveAuthoringMode` + `handleAuthoringModeChange` from CanvasWorkspace; rewrite `l3Archetype` to derive from `canEditCanvas`. Then remove `CanvasAuthoringMode` type from `CanvasLevelRouter.tsx` + the router's `mode`/`onModeChange` props. Then delete `CanvasModeToggle/` directory. Then clean barrel exports. Then delete the obsolete `CanvasWorkspaceEditModeShell.test.tsx`. Per-category commits as you go.
- **Validator** (~15 min): acceptance grep returns 0 hits in source; per-package builds clean; full test suite green; pr-ready-check.sh green (modulo known pre-existing ControlEditors flake).

---

## Files to delete

**`packages/ui/src/components/Canvas/EditMode/EditModeShell.tsx`** (254 LOC) — entire file.

**`packages/ui/src/components/Canvas/EditMode/__tests__/EditModeShell.test.tsx`** — entire file. Decision: delete outright rather than rehome. The ~28 surviving zone/composition tests assert internal structure (Palette renders, OutcomeZone renders, FactorZone renders, ProcessStructureZone renders, drag handlers fire) that is REDUNDANT with the existing `CanvasWorkspace.test.tsx` coverage once the chrome inlines. Per `feedback_subagent_driven_catches_bugs` + zone-component tests already exist in their respective subfolders, deleting the wrapper-component test file is cleaner than migrating. Document the deletion + new coverage gaps (if any) in the PR description.

**`packages/ui/src/components/Canvas/__tests__/CanvasWorkspaceEditModeShell.test.tsx`** — entire file. Its 3 tests gate EditModeShell mount on `canEditCanvas`; post-LV1-C the chrome is unconditional within the b1 archetype, so this file is structurally obsolete.

**`packages/ui/src/components/CanvasModeToggle/`** — entire directory:

- `index.tsx` (the toggle component)
- `__tests__/CanvasModeToggle.test.tsx` (or equivalent — verify at Architect phase)

---

## Files to modify

| File                                                                              | Change                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/ui/src/components/Canvas/internal/CanvasLevelRouter.tsx`                | Delete `CanvasAuthoringMode` type (line 33). Remove `mode`/`onModeChange` props from the router's props interface + their consumers. Simplify L3 render to drop mode-toggle rendering.                                                                                                                                                                                                         |
| `packages/ui/src/components/Canvas/CanvasWorkspace.tsx`                           | Delete `authoringMode` useState (lines 532-534), safety effect (lines 1021-1025), `effectiveAuthoringMode` (lines 1027-1028), `handleAuthoringModeChange` (lines 1029-1035), `handleShellDone` (lines 1203-1206), `showEditShell` conditional (line 1208), EditModeShell mount (line 1247). Inline the chrome. Rewrite `l3Archetype = canEditCanvas !== false ? 'b1' : 'b0'` (line 1037 area). |
| `packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx`            | Fixture cleanup: remove `authoringMode` from rendered props in every test. Delete tests that assert mode-switching behavior. Keep tests that assert canEditCanvas-gated b0/b1 routing.                                                                                                                                                                                                         |
| `packages/ui/src/components/Canvas/internal/__tests__/CanvasLevelRouter.test.tsx` | Remove `authoringMode: 'read' as const` mock prop (line 111). Update or delete the `authoringMode="read"` test render at line 208.                                                                                                                                                                                                                                                             |
| `packages/ui/src/index.ts`                                                        | Remove `CanvasAuthoringMode`, `EditModeShell`, `EditModeShellProps`, `CanvasModeToggle` exports (lines 683-685 area — verify at Architect phase).                                                                                                                                                                                                                                              |
| `packages/ui/src/components/Canvas/index.tsx`                                     | Remove `CanvasAuthoringMode` import (line 55) + `EditModeShell` re-exports (lines 93-95).                                                                                                                                                                                                                                                                                                      |
| `packages/ui/src/components/Canvas/EditMode/index.ts`                             | Remove `EditModeShell` + `EditModeShellProps` exports (lines 1-2).                                                                                                                                                                                                                                                                                                                             |

**App-side read-only checks (no edits expected):**

- `apps/azure/src/pages/Editor.tsx` — verify no `authoringMode` prop passed to FrameView. Apps prop-drill `canEditCanvas` only.
- `apps/azure/src/components/editor/FrameView.tsx` — verify only `canEditCanvas` threaded to CanvasWorkspace.
- `apps/pwa/src/components/views/FrameView.tsx` — verify `canEditCanvas={true}` hardcode survives.

If any app DOES pass `authoringMode` (Explore agent said NO), drop the prop in the same PR per `feedback_no_backcompat_clean_architecture`.

---

## Per-category commits (suggested chain)

The implementer should commit in dependency order so the codebase doesn't enter a tsc-broken intermediate state. Suggested commits:

1. `feat(wedge-v1): LV1-C — inline EditModeShell chrome into CanvasWorkspace b1 render`
2. `feat(wedge-v1): LV1-C — drop EditModeShell mount + handleShellDone from CanvasWorkspace`
3. `chore(wedge-v1): LV1-C — delete EditModeShell.tsx + EditModeShell.test.tsx`
4. `feat(wedge-v1): LV1-C — drop authoringMode state machine; rewrite l3Archetype from canEditCanvas`
5. `feat(wedge-v1): LV1-C — drop CanvasAuthoringMode type + router mode/onModeChange props`
6. `chore(wedge-v1): LV1-C — delete CanvasModeToggle component + obsolete EditModeShell-mount test file`
7. `chore(wedge-v1): LV1-C — clean retired-symbol barrel exports`

Commit by category, not file-by-file. Adjust the sequence if tsc complains in any intermediate state.

---

## Validation gates (Validator phase)

Run all of these at the end before opening the PR:

1. **Acceptance grep — zero hits in source:**

   ```bash
   grep -rn "authoringMode\|EditModeShell\|handleShellDone\|CanvasModeToggle\|CanvasAuthoringMode" packages/*/src apps/*/src
   ```

   Expected: 0 hits. Hits in `docs/`, `docs/archive/`, and the present plan file itself are fine — those are intentional historical/planning references.

2. **Per-package builds clean:**

   ```bash
   pnpm --filter @variscout/ui build
   pnpm --filter @variscout/azure-app build
   pnpm --filter @variscout/pwa-app build
   ```

   The `@variscout/ui` build is the critical one — it catches cross-package type drift that per-package vitest misses (`feedback_ui_build_before_merge`).

3. **Full UI test suite:**

   ```bash
   pnpm --filter @variscout/ui test
   ```

4. **pr-ready-check:**

   ```bash
   bash scripts/pr-ready-check.sh
   ```

   Pre-existing `ControlEditors.test.tsx` flake recurs on every LV1 PR. Confirm structural unrelation via `git diff --stat main..HEAD -- apps/azure/src/components/ControlEditors* apps/azure/src/services/*` returning empty + document in PR description.

5. **Frontmatter validator (if any docs touched):**

   ```bash
   node scripts/check-doc-frontmatter.mjs
   ```

   Expected: clean (or only the existing 2 transitional alias warnings).

If any gate fails, fix in place and re-run. Do NOT use `--no-verify` (per `feedback_subagent_no_verify`).

---

## Constraints forwarded to implementer

- **No migration helpers, no back-compat shims** per `feedback_wedge_v1_no_migration_no_backcompat` — no real users yet; drop fields directly
- **Never** `--no-verify` on commits (`feedback_subagent_no_verify`)
- **Operate ONLY in the assigned worktree**, never `cd` to main repo (`feedback_subagent_worktree_discipline`)
- **No `Math.random`** in any new code or tests (core hard rule)
- **No `.toFixed()`** on stat values — irrelevant here
- **No `dark:` Tailwind variants** (wedge V1 no-dark-mode invariant)
- **No `Pp` / `Ppk`** (use `Cpk` only) per `feedback_no_pp_ppk_only_cp_cpk`
- **No `"root cause"`** in any comment / docstring (P5 amended)
- **Do NOT rename preserved identifiers** — see CLAUDE.md preserved-identifier list. We are deleting `CanvasAuthoringMode` (NOT preserved) + `EditModeShell` (NOT preserved) + `CanvasModeToggle` (NOT preserved). Keep `CanvasWorkspace.tsx`, `Dashboard.tsx`, `AnalysisMode`, `ProcessStateLens`, `DashboardTab` union, ADR-074 timing concepts.
- **Use semantic Tailwind classes only** (`bg-surface-secondary`, `text-content`, `border-edge`) per `packages/ui/CLAUDE.md`
- **Skip browser walks** for wedge V1 (`feedback_wedge_v1_no_migration_no_backcompat`)
- **Implementer verification scoped to <90s** per intermediate check (`feedback_implementer_long_bash_pitfall`); full pre-PR sweep is controller-level (this plan's Validator phase)
- **No emojis in new source files** (existing comment emojis unchanged)
- **Per-category commits**, not file-by-file. Adjust the suggested chain if tsc complains in any intermediate state.
- **DndContext re-wiring:** EditModeShell's DndContext lifts UP into CanvasWorkspace. If CanvasWorkspace already has a DndContext wrapping the b1 render path, MERGE drag handlers into the existing one (do NOT nest contexts).
- **`l3Archetype` derivation:** Use `canEditCanvas !== false ? 'b1' : 'b0'` (not `=== true`) to default-allow when undefined. Read existing CanvasWorkspace tests for archetype assertions to confirm the new derivation matches every fixture.

---

## Execution model

- **Worktree:** `.worktrees/lv1-c-retire-authoring-mode/` (created via `EnterWorktree`)
- **Branch:** auto-named `worktree-lv1-c-retire-authoring-mode` (per LV1-0/A/B/H precedent)
- **Implementer:** Opus, single dispatch with internal Architect → Migration → Validator phases
- **Reviewers:** After implementer reports DONE — Sonnet spec compliance reviewer + Sonnet code quality reviewer on the FULL branch (not per-commit). Then Opus final-branch reviewer (STEP 0: `git fetch + git checkout + git branch --show-current` per `feedback_code_review_subagent_must_checkout_pr_branch`).
- **Merge:** `gh pr merge --merge --delete-branch` (NEVER `--squash` per `feedback_preserve_commit_history`).
- **Known local-cleanup issue:** `gh pr merge` may fail with "main is already used by worktree at..." (recurred on LV1-0/A/B/H). Verify on GitHub via `gh pr view <num> --json state,mergedAt,mergeCommit` and proceed to `ExitWorktree`.

---

## Acceptance signal

- `grep -rn "authoringMode\|EditModeShell\|handleShellDone\|CanvasModeToggle\|CanvasAuthoringMode" packages/*/src apps/*/src` → 0 hits in source
- `pnpm --filter @variscout/ui build` clean
- `pnpm --filter @variscout/ui test` green
- `pnpm --filter @variscout/azure-app build` + `pnpm --filter @variscout/pwa-app build` clean
- `bash scripts/pr-ready-check.sh` green (modulo known ControlEditors flake — document structurally)
- Canvas renders identically when `canEditCanvas !== false`; no Done button; no toggle UI; b1 archetype rendered with inlined chrome
- Read-only viewers (`canEditCanvas === false`) continue to see the b0 archetype unchanged
- PR description references this sub-plan + master plan + spec §3 D1 + D3 + the LV1-0 precedent

---

## Why this deviates from the master plan's Sonnet/4-6-tasks recommendation

The master plan suggested Sonnet + 4-6 bite-sized tasks. Grounding (Phase 1 Explore findings in the planning file) revealed the deletion graph is tightly coupled across `authoringMode` state → `effectiveAuthoringMode` derivation → `l3Archetype` → `showEditShell` → EditModeShell mount → `handleShellDone` → `CanvasLevelRouter` mode/onModeChange props → `CanvasAuthoringMode` type → `CanvasModeToggle` component → barrel exports → tests. There is no clean intermediate state where a sub-task can leave the tsc-tree green; splitting into 5-6 tasks would force each sub-task to either tolerate tsc-broken intermediate states (unprincipled) or duplicate compensating shims that get immediately deleted (`feedback_wedge_v1_no_migration_no_backcompat` violation). Per `feedback_atomic_sweep_one_dispatch`: "Splitting an atomic cascade into 6-8 sub-dispatches multiplies orchestration cost without buying review depth (each sub-reviewer sees only a slice)." Same pattern that justified LV1-0's atomic-sweep treatment.

---

## Related

- Spec: `../specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md` §3 D1 + D3
- Master plan: `./2026-05-28-linked-views-phase-1-master-plan.md` PR-LV1-C
- LV1-0 precedent: `./2026-05-28-pr-lv1-0-remove-yamazumi-mode.md` (atomic-sweep structural twin)
- LV1-A precedent (most recent foundation PR): `./2026-05-28-pr-lv1-a-analysis-scope-store.md`
- LV1-B precedent: `./2026-05-28-pr-lv1-b-pending-explore-intent-migration.md`
- LV1-H precedent (most recent UI PR): `./2026-05-28-pr-lv1-h-outcome-summary-pill.md`
- Memory: `feedback_atomic_sweep_one_dispatch`, `feedback_wedge_v1_no_migration_no_backcompat`, `feedback_subagent_worktree_discipline`, `feedback_preserve_commit_history`, `feedback_ui_build_before_merge`, `feedback_subagent_no_verify`, `feedback_implementer_long_bash_pitfall`, `feedback_no_backcompat_clean_architecture`
