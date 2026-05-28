---
tier: ephemeral
purpose: build
title: PR-LV1-0 — Remove yamazumi mode (atomic deletion sweep)
status: active
date: 2026-05-28
layer: spec
---

# PR-LV1-0 — Remove yamazumi mode (atomic deletion sweep)

> **For agentic workers:** ONE Opus implementer dispatch with internal Architect → Migration → Validator phases per `feedback_atomic_sweep_one_dispatch`. NOT split into many bite-sized tasks (multiplies orchestration cost without buying review depth for tsc-wide cascading deletions).

**Parent spec:** [`docs/superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md`](../specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md) §6.1
**Master plan:** [`./2026-05-28-linked-views-phase-1-master-plan.md`](./2026-05-28-linked-views-phase-1-master-plan.md) PR-LV1-0

**Goal:** Delete all yamazumi-specific code, types, components, hooks, mode strategy entries, detection wiring, persistence, i18n keys, and tests. Mark ADR-034 superseded; amend ADR-047; archive companion use-case doc. Modes go from 6 to 5 (`standard`, `capability`, `performance`, `defect`, `process-flow`).

**Rationale recap** (from spec §6.1):

1. Process-flow mode covers the flow-analysis use case (yamazumi was the deeper cut on the same data)
2. Activity-typed time-study data has a different gathering workflow not aligned with wedge V1 paste-and-analyze
3. Future pivot-table capability covers the activity-decomposition residual

**Architecture:** Three internal phases for the single Opus dispatch.

- **Architect** (~15 min): map the deletion graph + consumer-impact surface. Identify every file that imports yamazumi types, components, or hooks. Build a dependency-ordered removal sequence so the codebase never enters a tsc-broken intermediate state mid-sweep.
- **Migration** (~60–90 min): execute the removal in dependency order — leaf files first (chart components, hooks), then types + strategy entries + mode unions, then auto-detection wiring, then docs + ADRs + archive. Per-category commits as you go (e.g., one commit for chart-side, one for core types, one for app wiring, one for docs).
- **Validator** (~15 min): grep for residual yamazumi references; verify all builds + tests; smoke-check the dashboard renders standard/capability/performance/defect/process-flow modes correctly.

---

## Files to delete

**`packages/core/src/yamazumi/`** — entire directory:

- `types.ts` (`YamazumiColumnMapping`, `ActivityType`, `YamazumiBarData`, etc.)
- `detection.ts` (`detectYamazumiFormat`)
- `aggregation.ts` (`computeYamazumiData`)
- `classification.ts` (`classifyActivityType`)
- `index.ts` (barrel)
- `__tests__/` (all yamazumi tests)

**`packages/charts/src/YamazumiChart.tsx`** + its test file in `packages/charts/src/__tests__/`

**Yamazumi dashboard components in apps** (find via grep — at least):

- `apps/azure/src/components/YamazumiDashboard.tsx` (if exists at this path)
- `apps/azure/src/components/YamazumiWrapper.tsx`
- `apps/pwa/src/components/YamazumiDashboard.tsx`
- Hooks: `useYamazumiChartData`, `useYamazumiIChartData`, `useYamazumiParetoData`
- Any `YamazumiSummaryBar`, `YamazumiPareto` components in either app
- All yamazumi-related test files

---

## Files to modify

| File                                                                 | Change                                                                                                            |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `packages/core/src/types.ts` (line ~335)                             | Drop `'yamazumi'` from `AnalysisMode` union                                                                       |
| `packages/core/src/analysisStrategy.ts` (line 6 + strategy entries)  | Drop `'yamazumi'` from `ResolvedMode`; remove yamazumi strategy entry; simplify `resolveMode()` if needed         |
| `packages/charts/src/index.ts`                                       | Remove `YamazumiChart` export                                                                                     |
| `apps/azure/src/components/Dashboard.tsx` (lines ~81–93, imports)    | Drop yamazumi from `modeTabs`; remove yamazumi imports                                                            |
| `apps/azure/src/pages/Editor.tsx` (lines ~456–458, ~930)             | Remove `onYamazumiDetected`, `setYamazumiMapping`, `setAnalysisMode('yamazumi')` wiring                           |
| `packages/stores/src/projectStore.ts` (search for `yamazumiMapping`) | Remove `yamazumiMapping` field + related actions; tighten `analysisMode` type to exclude `'yamazumi'`             |
| `packages/core/src/i18n/messages/en.ts`                              | Remove yamazumi-specific keys (if any — grep for `yamazumi`)                                                      |
| `docs/07-decisions/adr-034-yamazumi-analysis-mode.md`                | Add `## Amendment — 2026-05-28` block; change status to `superseded`; banner at top pointing to 2026-05-28 spec   |
| `docs/07-decisions/adr-047-analysis-mode-strategy-pattern.md`        | `## Amendment — 2026-05-28` block noting yamazumi removed from `AnalysisMode` + `ResolvedMode` unions             |
| `docs/01-vision/methodology.md`                                      | Drop yamazumi from mode list ("six modes" → "five modes" or similar phrasing)                                     |
| `docs/OVERVIEW.md`                                                   | Mode-list update                                                                                                  |
| `docs/02-journeys/use-cases/USER-JOURNEYS-YAMAZUMI.md`               | Archive: move to `docs/archive/use-cases/2026-05-28-USER-JOURNEYS-YAMAZUMI.md` with top banner explaining archive |
| `docs/superpowers/specs/index.md`                                    | Mark yamazumi-related spec rows as Archived/Superseded; archive their files if not already                        |
| Any pwa equivalent of Editor.tsx                                     | Equivalent yamazumi wiring removal                                                                                |

---

## Per-category commits (suggested sequence)

The implementer should commit in dependency order — leaf files first so the codebase doesn't enter a broken intermediate state. Suggested commit chain:

1. `chore(wedge-v1): LV1-0 — delete yamazumi chart component` (chart-side leaf)
2. `chore(wedge-v1): LV1-0 — delete yamazumi dashboards + hooks in apps`
3. `chore(wedge-v1): LV1-0 — delete @variscout/core yamazumi package`
4. `chore(wedge-v1): LV1-0 — drop yamazumi from AnalysisMode + ResolvedMode + projectStore`
5. `chore(wedge-v1): LV1-0 — remove yamazumi auto-detection + UI wiring (Editor.tsx, Dashboard.tsx)`
6. `chore(wedge-v1): LV1-0 — remove yamazumi i18n keys + tests` (if any keys exist)
7. `chore(wedge-v1): LV1-0 — amend ADR-034 (superseded) + ADR-047 (mode union)`
8. `chore(wedge-v1): LV1-0 — archive USER-JOURNEYS-YAMAZUMI + update methodology/OVERVIEW + specs index`

Commit by category, not file-by-file. Adjust the sequence if tsc complains in any intermediate state.

---

## Validation gates (Validator phase)

Run all of these at the end before opening the PR:

1. **Grep zero hits** in source code:

   ```bash
   grep -rni "yamazumi" packages/core/src packages/ui/src packages/charts/src packages/stores/src packages/hooks/src apps/azure/src apps/pwa/src
   ```

   Expected: 0 hits. (Hits in `docs/` and `archive/` are fine — those are intentional archive/amendment references.)

2. **Per-package builds clean:**

   ```bash
   pnpm --filter @variscout/core build
   pnpm --filter @variscout/stores build
   pnpm --filter @variscout/charts build
   pnpm --filter @variscout/ui build
   pnpm --filter @variscout/azure-app build
   pnpm --filter @variscout/pwa-app build
   ```

3. **Full test suite:**

   ```bash
   pnpm test
   ```

4. **pr-ready-check:**

   ```bash
   bash scripts/pr-ready-check.sh
   ```

5. **Frontmatter validator:**
   ```bash
   node scripts/check-doc-frontmatter.mjs
   ```
   Expected: clean (or only the existing 2 transitional alias warnings).

If any gate fails, fix and re-run. Do NOT use `--no-verify` (per `feedback_subagent_no_verify`).

---

## Constraints forwarded to implementer

- **No migration helpers, no back-compat shims** per `feedback_wedge_v1_no_migration_no_backcompat` — no real users yet; drop fields directly
- **Never** `--no-verify` on commits (`feedback_subagent_no_verify`)
- **Operate ONLY in the assigned worktree**, never `cd` to main repo (`feedback_subagent_worktree_discipline`)
- **No `Math.random`** in any new code or tests (core hard rule)
- **No `.toFixed()`** on exported stat values (use `formatStatistic` from i18n)
- **Do NOT rename preserved identifiers** — see CLAUDE.md preserved-identifier list (AnalysisMode the TYPE is preserved; we are only narrowing its union members, not renaming the type itself)
- **Skip browser walks for wedge V1**
- **Implementer verification scoped to <90s** targeted runs per `feedback_implementer_long_bash_pitfall`; full pre-PR sweep is controller-level (this plan's Validator phase)
- **No emojis in new source files** (existing comment emojis unchanged)

---

## Execution model

- **Worktree:** `.worktrees/feat-wedge-v1-lv1-0-remove-yamazumi/` (created via `superpowers:using-git-worktrees`)
- **Branch:** `feat/wedge-v1-lv1-0-remove-yamazumi`
- **Implementer:** Opus, single dispatch with internal Architect → Migration → Validator phases
- **Reviewers:** Sonnet spec reviewer + Sonnet code-quality reviewer after implementer reports DONE
- **Merge:** `gh pr merge --merge --delete-branch` (NEVER `--squash` per `feedback_preserve_commit_history`)

---

## Acceptance signal

- `grep -rni "yamazumi" packages/ apps/` → 0 hits in source (docs/archive hits OK)
- All `pnpm --filter ... build` commands clean
- `pnpm test` green
- `bash scripts/pr-ready-check.sh` green
- ADR-034 status: `superseded`; ADR-047 has amendment block
- `docs/archive/use-cases/2026-05-28-USER-JOURNEYS-YAMAZUMI.md` exists with archive banner
- Mode list in `methodology.md` + `OVERVIEW.md` shows 5 modes
- PR description references this sub-plan + master plan + spec

---

## Related

- Spec: `../specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md` §6.1
- Master plan: `./2026-05-28-linked-views-phase-1-master-plan.md` PR-LV1-0
- ADR-034 (to be marked superseded): `docs/07-decisions/adr-034-yamazumi-analysis-mode.md`
- ADR-047 (to be amended): `docs/07-decisions/adr-047-analysis-mode-strategy-pattern.md`
- Memory: `feedback_atomic_sweep_one_dispatch`, `feedback_wedge_v1_no_migration_no_backcompat`, `feedback_subagent_worktree_discipline`, `feedback_preserve_commit_history`
