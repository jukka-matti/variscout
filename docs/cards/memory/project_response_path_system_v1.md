---
title: 'Response Path System V1 — SHIPPED 2026-05-13 (10 of 10 PRs)'
description: '18 locked decisions; all 10 PRs SHIPPED 2026-05-09→2026-05-13 (#144/#147/#148/#149/#150/#151/#152/#153/#154/#155); spec+plan delivered; ADR-080 documents Sustainment auto-fire pattern'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: 4dc98d7b-6a43-414c-8387-61555905cfc7
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_response_path_system_v1.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Unified system-level design for VariScout's 5 response paths from canvas-card drill-down (Quick Action / Focused Investigation / Improvement Project / Sustainment / Handoff). Replaces the piecewise IP V1 design with one architectural backbone.

**Spec:** `docs/superpowers/specs/2026-05-09-response-path-system-v1-design.md` (status: **delivered** 2026-05-13).
**Plan:** `docs/superpowers/plans/2026-05-09-response-path-system-v1.md` (status: **delivered**; **10 of 10 PRs SHIPPED** 2026-05-09→2026-05-13).
**ADR-080:** [[adr-080-sustainment-auto-fire-pattern]] — captures the Sustainment-shaped lifecycle pattern (auto-fire + Inbox prompt + signoff-gated finalize). Cite from future response-path lifecycles instead of re-deriving.
**Branch:** `response-path-system-v1` (re-cut from main per PR — branches deleted post-merge).

**Supersedes:**
- `docs/superpowers/specs/2026-05-08-improvement-project-v1-design.md` (status: superseded; retained as historical record)
- `docs/superpowers/plans/2026-05-08-improvement-project-v1.md` (status: superseded; retained)

## 18 locked decisions (D1–D18)

- **D1** 5 response paths from vision §2.4 (Quick Action / Focused Investigation / IP / Sustainment / Handoff)
- **D2** Drop DMAIC / QC Story / Toyota TBP methodology bridges; use VariScout-native vocabulary
- **D3** 3-altitude framing: macro Hub cadence loop / Survey cross-phase / per-response micro lifecycles
- **D4** 8-station canonical journey arc
- **D5** Survey is the cross-phase methodology layer (per `docs/01-vision/methodology.md` §256)
- **D6** "Improvement Project" canonical name; `ProcessHub.improvementProjects: ImprovementProject[]`
- **D7** IP ↔ Focused Investigation = separate response paths, FK-linked, peers
- **D8** 6-section IP shape: Project metadata + Background + Goal (multi-level) + Investigation lineage + Approach + Outcome reference
- **D9** Multi-level goals — `outcomeGoal` (Y, required) + `factorControls[]` (X) + `mechanismGoals[]` (x)
- **D10** World-class hybrid chain: A canvas-card prerequisite + B Hub-overview always-active + C Survey-Inbox prompts. Concrete signals: `hasIntervention` = closed IP + selected idea + done action; `sustainmentConfirmed` = manual review OR N=4 ticks
- **D11** Survey UI Pattern X — dual surface (inline + Inbox)
- **D12** Wall vision V1 = Detective-pack (mini-charts + brush-to-pin + 5th status; defer best-subsets-inline V2)
- **D13** Cross-surface navigation = context badges + bidirectional links + single-level back
- **D14** Quick Action = orphan ActionItem (no new entity); dual flavor "Done now" / "Assign to"
- **D15** Naming reconciliation: SuspectedCause → Hypothesis (rename + 5-state HypothesisStatus + remove MechanismBranchStatus + remove WallStatus + remove MechanismBranchReadiness)
- **D16** Hypothesis grouping = lightweight `themeTags?: string[]` V1; HypothesisGroup entity + Fishbone V2
- **D17** Wall package re-home `packages/charts/src/InvestigationWall/` → `packages/ui/src/components/InvestigationWall/`
- **D18** Per-section live-document state machine (reactive for projections + snapshot+drift for narratives)

## 10-PR slice plan + status

| PR | Status | Slice | Tasks |
|---|---|---|---|
| **PR-RPS-1** | ✓ **SHIPPED 2026-05-09** (PR #144) | Naming + Wall re-home | 6 ✓ |
| **PR-RPS-2** | ✓ **SHIPPED 2026-05-09** (PR #147) | Wall Detective-pack: 5th status + confirm-gate Survey rule | 3 ✓ |
| **PR-RPS-3** | ✓ **SHIPPED 2026-05-09** (PR #148) | Wall Detective-pack: mini-charts inside HypothesisCard | 5 ✓ |
| **PR-RPS-4** | ✓ **SHIPPED 2026-05-09** (PR #149) | Wall Detective-pack: brush-to-pin + missing-evidence panel | 5 ✓ |
| **PR-RPS-5** | ✓ **SHIPPED 2026-05-10** (PR #150) | IP V1 engine: types + HubAction + PWA/Azure persistence + store + .vrs + D18 primitives | 7 ✓ |
| **PR-RPS-6 + PR-RPS-7** | ✓ **SHIPPED 2026-05-10** (PR #152) — bundled | IP V1: 6-section UI + multi-level Goal + per-app shells + cross-surface badges. Stacking sub-PR #151 (codex/pr-rps-6 → response-path-system-v1) rolled into PR-RPS-7's #152 (response-path-system-v1 → main) | 7+5 ✓ |
| **PR-RPS-8** | ✓ **SHIPPED 2026-05-10** (PR #153) | Quick Action surface (LogActionModal + RecentActivityPanel) + canvas-card wiring | 4 ✓ |
| **PR-RPS-9** | ✓ **SHIPPED 2026-05-13** (PR #154, `5f95e6fd`) | Sustainment V1: `SUSTAINMENT_*` HubAction kinds + auto-fire on IP→Sustain transition + drift survey rules + Inbox digest. Subsumes F5 sustainment work. ADR-080 authored as pattern reference. | 6 ✓ |
| **PR-RPS-10** | ✓ **SHIPPED 2026-05-13** (PR #155, `12e1257b`) | Handoff V1: `CONTROL_HANDOFF_*` HubAction kinds + `HandoffForm` + per-app `HandoffPanel` + sponsor signoff (visible-with-lock free / active paid per D9) + 8-station E2E (`apps/azure/e2e/full-lifecycle.spec.ts`). **Closes RPS V1.** | 5 ✓ |

Total: 54 tasks, ~6-8 weeks. Subagent-driven per `feedback_subagent_driven_default`.

## PR-RPS-1 ship details (2026-05-09)

- **PR #144** squash-merged as commit `2a6e3114 RPS V1 PR1: Naming reconciliation + Wall package re-home (#144)`
- Codex with superpowers executed the 6 tasks across 8 commits (each task → its own commit + a final cascade commit propagating renames through `apps/azure` + `apps/pwa` consumers)
- Code review caught 2 small follow-ups (applied in additional commits before merge):
  1. **`HYPOTHESIS_UPDATE.patch` type tightened** from `Partial<Hypothesis>` to `Partial<Omit<Hypothesis, 'id' | 'createdAt' | 'deletedAt'>>` — closes immutable-field footgun before PR-RPS-5 wires real persistence
  2. **Legacy-value migration shim removed** per spec D15 (no backward compat) — replaced silent `'suspected' → 'proposed'` / `'not-confirmed' → 'refuted'` mapping with strict assertion that throws `Invalid HypothesisStatus encountered during deserialization` on any unknown value
- All ~7027 tests green at merge (`@variscout/core` 3285 + `@variscout/charts` 167 + `@variscout/ui` 1807 + `@variscout/stores` 238 + `@variscout/pwa` 291 + `@variscout/azure-app` 1239)

## PR-RPS-2 ship details (2026-05-09)

- **PR #147** squash-merged as commit `45e25c9e RPS V1 PR2: Wall Detective-pack — 5th status + confirm-gate Survey rule (#147)`
- 6 commits (3 tasks + 3 review fixups). Subagent-driven with Sonnet implementer + Sonnet per-task reviewers + Opus final-pass review.
- **Plan-grounding gap closed at Task 7**: plan TDD code referenced `Finding.evidenceType` and `Finding.refutes` which didn't exist on `Finding` (only on `CausalLink`). Per spec §5 row 396 + §6 row 3, evidence-type tagging belongs on Finding. Added `Finding.evidenceType: 'data' | 'gemba' | 'expert'` (required) + `Finding.refutes?: boolean` (optional) + `createFinding()` defaults `evidenceType: 'data'`. Cascade: 46 mechanical fixture one-liners + 3 substantive files (types.ts, factories.ts, `apps/azure/src/services/merge.ts`). NOT collapsed with existing `validationStatus?: 'supports' | 'contradicts' | 'inconclusive'` — both fields coexist (may diverge later).
- **Survey module dual API surface**: existing `evaluateSurvey()` (data-affordance Possibility/Power/Trust) coexists with new rule registry (`surveyWallRules`, `deriveHypothesisStatus`). Module-level doc comment in `survey/index.ts` makes the dual-surface explicit; `survey/types.ts` extended (not overwritten) with new rule-layer types (`SurveyHint`, `SurveyRule`, `SurveyContext`, `SurveyHintKind`).
- **5-state derivation per spec §6 row 3**: refuted-wins (any `f.refutes`) → `proposed` (no findings) → `evidenced` (<2 distinct types) → `needs-disconfirmation` (≥2 types, no `survived` attempt) → `confirmed` (≥2 types + `survived` attempt).
- **`OneStepAwayBadge` UI**: replaces `openChecksLabel` text slot at full LOD when `displayStatus === 'needs-disconfirmation'` (initially placed inside body rect → caused text overlap with `openChecksLabel`; second-pass fix: badge replaces openChecksLabel as the next-action signal). i18n key `wall.card.oneStepAway` added to all 32 locales.
- **Pre-merge gate flake observed**: `architecture.noCrossInvestigationAggregation.test.ts` (regex-grep over all TS files) timed out at 5s under turbo concurrent load on first run; passed cleanly (2.74s) in isolation and on second `pr-ready-check.sh` invocation. This is the same "known flaky under concurrent Turbo load" pattern as `packages/hooks/src/__tests__/index.test.ts` from `.claude/rules/testing.md`. Retry once before treating as a real failure.
- All tests green at merge: core 3303, hooks 1143, ui 1811, azure 1239, pwa 291.

## PR-RPS-3 ship details (2026-05-09)

- **PR #148** squash-merged as commit `d0ad3d48 RPS V1 PR3: Wall Detective-pack — mini-charts inside HypothesisCard (#148)`
- 8 branch commits (5 tasks + 3 review fixups including a tributary-frame visual fix). Subagent-driven with Sonnet implementer + Sonnet per-task reviewers + Opus final-pass review.
- **Plan-vs-code reconciliation done in plan-mode** (4 gaps closed before any subagent dispatch): (1) no empty chart slot at line 170 → grow CARD_H 228→288 with 80px slot at top of body; (2) `'continuous-x'` doesn't exist in parser union → reuse `'numeric' | 'categorical' | 'date' | 'text'` and **drop MiniScatter from V1**; (3) `Hypothesis.outcomeColumn` doesn't exist → don't add it; investigation-level outcome via `WallCanvas.outcomeColumn?: string` prop sourced from `useProjectStore.outcome`; (4) plan code referenced `theme.colors.line` / `theme.colors.accent` which don't exist → use `colors.mean` for line, `colors.control` for boxplot, `chrome.labelMuted` for centerline.
- **Holistic outcome model:** I-Chart plots the FACTOR (predicate column) — no outcome needed (matches vision slide 2 H1 brushed-temp pattern). Boxplot plots OUTCOME by FACTOR — outcome required, falls back to "Set outcome to enable chart" placeholder when missing. Per holistic vision: investigation has ONE Y, hypotheses propose different Xs.
- **Architecture:** pure helper `deriveMiniChartConfig` (`packages/core/src/findings/miniChart.ts`) → `useMiniChartData` hook (`packages/hooks`) → `MiniIChart` / `MiniBoxplot` SVG components (`packages/ui/.../InvestigationWall/`) → `<ChartSlot>` inner component in `HypothesisCard` rendering `<foreignObject>` at full LOD only.
- **Determinism preserved:** `MiniBoxplot` dots-fallback (n<7) uses inline mulberry32 PRNG seeded by FNV-1a hash of category — never `Math.random`. Determinism unit test asserts identical innerHTML across unmount+remount cycles.
- **`.toFixed()` ESLint rule honored** per ADR-069 — all SVG coordinate rounding uses `Math.round(val * 10) / 10` instead.
- **Tributary frame fix bundled pre-merge** per `feedback_bundle_followups_pre_merge` — final Opus review caught that the dashed group frame `height={260}` clipped the new 288px cards by 68px when `groupByTributary=true`. Fixed to `height={348}` (CARD_H + 60).
- **Display-only V1**: no brushing, no highlights, no interaction. Brush-to-pin gesture comes in PR-RPS-4. Mini-chart placeholders surface clear actionable copy when factor type or outcome is missing.
- **Open follow-up:** placeholder copy strings (`'Set outcome to enable chart'`, `'+ Add condition'`, etc.) are hard-coded English; should route through `getMessage()` like the rest of `HypothesisCard`. Other recent Wall PRs also have inline strings — broader pattern to clean up later.
- All tests green at merge: 1239 across all packages (full suite). UI build clean. pr-ready-check green.

## PR-RPS-4 ship details (2026-05-09)

- **PR #149** squash-merged as commit `f2d42fee RPS V1 PR4: Wall Detective-pack — brush-to-pin + missing-evidence panel (#149)`
- 13 branch commits (5 tasks + 4 review fixups + 2 quality follow-ups + 1 final cleanup + 1 plan-mode worktree setup). Subagent-driven with Sonnet implementer + Sonnet per-task reviewers + Opus final cross-cutting review.
- **3 architectural refinements over the master plan** (locked in plan-mode before any subagent dispatch, per `feedback_check_shipped_patterns_first`):
  1. **Polymorphic gesture pattern** — I-Chart drag→range vs Boxplot tap→category. Master plan called for one `useBrushGesture` hook; refined to two hooks (`useIChartBrush` + `useBoxplotSelect`) unified by a `ChartSelection` discriminated union (`packages/core/src/findings/chartSelection.ts`). Different gestures match different data-type semantics.
  2. **Store-direct `addFinding` over FINDING_ADD HubAction** — verified via `feedback_plan_call_site_reachability` that `applyAction.ts` FINDING_ADD branch is a documented no-op in both PWA + Azure (`// F5 will wire this`). Existing CoScout + AnalysisPanel pattern calls `useInvestigationStore.getState().addFinding(text, context, source)` directly; mirror that in `BrushToFindingFlow`. Inline F5 comment marks the future-normalization seam.
  3. **MissingEvidenceDigest deletion (not extension)** — the digest's `gaps`/`gapsByHubId` props were empty in production (gapDetector lives in FRAME workspace, not Wall). Per vision slide 3 + spec §5 D11 + `feedback_consolidation_replace_not_umbrella`: ONE rule-driven `MissingEvidencePanel` consuming `SurveyHint[]` filtered to data-collection + triangulation-readiness. WallCanvas computes `surveyHints` internally; both prop pairs removed; `hasGap` derives from data-collection hints; PWA + Azure consumers refactored same-PR.
- **`SurveyContext.hub` typed optional** — JSDoc said "fields are optional" but `hub` was wrongly required, blocking `pnpm exec tsc --noEmit` in `packages/ui` after Task 19. Critical fix caught by Sonnet reviewer (per `feedback_subagent_driven_catches_bugs`). Wall is the only survey rule today; no consumer reads `ctx.hub`.
- **`FindingSource.ichart.brushedRange`** — additive optional `{ startIdx: number; endIdx: number }`. Migration (`packages/core/src/findings/migration.ts`) preserves the field across schema migrations when present and well-formed. Existing `ichart` consumers unchanged.
- **a11y dialog wiring** — `BrushToFindingFlow.tsx` dialog has `role="dialog" aria-modal="true" tabIndex={-1}` + `useEffect`-driven autofocus + Escape cancel. Caught by Sonnet reviewer that the original implementation only worked in JSDOM by accident (real browser would not fire Escape because dialog wasn't focusable).
- **E2E deferred** to follow-up — investigation state (`useInvestigationStore`) is session-only with no IndexedDB persistence and no `window.__VARISCOUT_TEST__` test hook. A UI-drive E2E would be 30+ steps and brittle. Future-anchor `apps/azure/e2e/wall-brush-to-pin.spec.ts` with `test.skip` documents the unblock criteria. Decision-log entry covers rationale.
- **9 i18n keys** added (7 for confirm dialog: `wall.brush.*`; 2 for panel collapse: `wall.missing.collapsed`/`expanded`); propagated across 32 locale files with English fallback.
- **3 decision-log entries** added in same PR per `feedback_bundle_followups_pre_merge`: brushedRange addition, MissingEvidencePanel supersession, E2E deferral.
- All tests green at merge: core 3334, hooks 1156, ui 1843. UI build clean. pr-ready-check all checks passed.

## PR-RPS-5 ship details (2026-05-10)

- **PR #150** opened off branch `response-path-system-v1` from latest main. 11 branch commits across 7 tasks (engine-only PR, no UI). Subagent-driven with Sonnet implementer + Sonnet reviewer per task + Opus final cross-cutting review.
- **Engine architecture (durable layout):**
  - `packages/core/src/improvementProject/{types.ts,index.ts,snapshot.ts}` (sub-path: `@variscout/core/improvementProject`)
  - `packages/core/src/actions/improvementProjectActions.ts` — 3 kinds CREATE / UPDATE / ARCHIVE
  - `ProcessHub.improvementProjects?: import('./improvementProject').ImprovementProject[]` (inline `import()` type-only to break the cycle)
  - `apps/pwa/src/db/schema.ts` — `improvementProjects` table appended to v1 stores (`'&id, hubId, deletedAt, status, updatedAt'`)
  - `apps/azure/src/db/schema.ts` — bumped to **v10** with new empty `improvementProjects` table (`'id, hubId, deletedAt, status, updatedAt'` — no `&` per Azure convention; no upgrade callback)
  - Both `applyAction.ts` files carry the 3 case branches with byte-for-byte symmetric deep-merge logic
  - `AzureHubRepository.dispatch` HUB_PERSIST_SNAPSHOT branch decomposes IP from hub blob within a single Dexie `'rw'` transaction (mirrors PWA pattern); `hubs.get` / `hubs.list` hydrate
  - `packages/stores/src/improvementProjectStore.ts` — Document-layer (`STORE_LAYER='document'`, no `persist` middleware), 4-method API: `setProjectsForHub` / `getProjectsForHub` / `upsertProject` / `removeProject`; `projectsByHub: Record<hubId, IP[]>`
  - `packages/hooks/src/useLiveProjection.ts` — memoized `useMemo` FK→entity batch projection (D18)
  - `computeSourceHash` + `shouldShowDrift` in `improvementProject/snapshot.ts` (pure logic; D18 primitives for live-document state machine)
- **Locked deep-merge contract** for `IMPROVEMENT_PROJECT_UPDATE` (JSDoc on the action type, replicated identically PWA + Azure):
  - Patch type: `Partial<Omit<ImprovementProject, 'id' | 'createdAt' | 'hubId' | 'updatedAt' | 'deletedAt'>> & { sections?: Partial<ImprovementProject['sections']> }` — lifecycle fields excluded; sections deeply optional
  - Objects shallow-merge one level: `metadata`, `goal`, `sections` (per sub-section key, missing keys preserved), `signoff`
  - Nested objects also shallow-merge: `metadata.financialImpact`, `goal.outcomeGoal`
  - Arrays REPLACE wholesale: `metadata.team[]`, `goal.factorControls[]`, `goal.mechanismGoals[]`, FK arrays inside `sections.*`
  - `updatedAt` set by handler to `Date.now()` (NOT caller-controllable)
- **HUB_PERSIST_SNAPSHOT decomposition pattern** (PWA + Azure both follow): destructure hydrated optional fields out of the hub blob, write the rest of the hub via the existing path, write the dedicated entity rows via stale-row-delete-then-bulkPut within a single transaction. Dispatch tests must include the decomposed field in fixtures or they pass vacuously.
- **Two design fixes during the PR** (caught by reviewers, fixed pre-merge):
  1. Initial UPDATE patch type was `Partial<Omit<IP, 'id'|'createdAt'|'hubId'>>` — allowed `updatedAt` and `deletedAt` to be caller-set, contradicting JSDoc. Fixed to also Omit those.
  2. Initial PWA HUB_PERSIST_SNAPSHOT didn't strip `improvementProjects` from the hub blob → embedded copy ended up in the hubs row alongside the dedicated table. Fixed to decompose + bulk-put.
  3. Azure dispatch test passed vacuously (fixture lacked `improvementProjects`); fixture tightened + new real-Dexie integration test added (`AzureHubRepository.snapshot.test.ts`).
  4. Final-pass Opus review caught that vitest passes but `tsc && vite build` failed (PWA + Azure builds broke). Two patch-type test fixtures supplied partial-section patches that the type forbade. Fixed by making `sections` deeply optional in the patch type — codifies the documented contract at the type level.
- **No-back-compat honored** per spec §8/§9 — Azure v9 → v10 is a clean break (no upgrade callback; pre-prod dev DBs get the new empty table on next open). PWA stays on v1 (additive table on existing version block).
- All tests green at PR open: core 3347, stores 248, hooks 1160, pwa 301, azure-app 1253. `bash scripts/pr-ready-check.sh` + `pnpm --filter @variscout/ui build` both green.
- **PR-RPS-6 unblocked:** UI consumers can now import `useImprovementProjectStore` from `@variscout/stores` and dispatch `IMPROVEMENT_PROJECT_*` via `pwaHubRepository.dispatch` / `azureHubRepository.dispatch`. The 6-section form lands in PR-RPS-6 per plan §Task 28+.

## PR-RPS-6 + PR-RPS-7 ship details (2026-05-10, bundled)

- **Stacking pattern**: PR #151 `codex/pr-rps-6 → response-path-system-v1` first merged the IP V1 6-section UI (PR-RPS-6) into the feature branch, then PR #152 `response-path-system-v1 → main` rolled BOTH PR-RPS-6 + PR-RPS-7 (per-app shells + canvas-card pickers + cross-surface badges) into main as a single squash commit `bec29c78 Implement response path improvement project UI (#152)`.
- This is a valid pattern when PR-RPS-7 directly consumes PR-RPS-6's UI primitives — bundling the squash avoids forcing main to ship UI primitives that nothing yet renders.
- `git log origin/main` shows only `bec29c78` for these PRs; the internal stacking commit `94625cdc feat(ui): add improvement project primitives (#151)` lives in the merged-feature-branch history but never directly hit main.
- See PR #151 + #152 GitHub thread for review depth + per-task commits. This memory entry intentionally light on detail since neither PR was reviewed in this session — defer deep mining to when surfaces hit user testing.

## PR-RPS-8 ship details (2026-05-10)

- **PR #153** squash-merged as commit `8234c757 feat: Quick Action surface (LogActionModal + RecentActivityPanel) + canvas-card wiring (#153)`.
- Implements path 1 of 5 per spec D14: orphan ActionItem (no new entity); dual flavor "Done now" / "Assign to"; Recent activity panel on canvas card; no Survey auto-detect (deferred V2).
- See PR #153 GitHub thread for review depth + per-task commits.

## Key principles enforced

- **No backward compatibility** per design phase (D15) — clean breaks throughout. Strict-assert > silent migration when stored data shape changes.
- **Survey is first-class user-visible UX** (D11), not just backend computation
- **5 entities, 2 status enums** after rename: Question / Hypothesis / GateNode / Finding / CausalLink + QuestionStatus (4) + HypothesisStatus (5)
- **Hypothesis structure preserved** — `Hypothesis.condition: HypothesisCondition` predicate tree captures specific contextual scope
- **Worktree-per-agent honored** — Codex worked in `.worktrees/response-path-system-v1/` so the main repo stayed untouched

## Commit hashes (chronological)

- `93e3f74c` — initial RPS V1 spec (2026-05-09)
- `de02a53a` — spec additions (Hypothesis structure section + 6 Survey rule categories + 7 OQs resolved)
- `824c0598` — RPS V1 implementation plan
- `2a6e3114` — **PR #144 squash-merge** (PR-RPS-1 implementation)
- `3ed1721d` — roadmap update marking PR-RPS-1 SHIPPED + RPS V1 sequence as next-up
- `45e25c9e` — **PR #147 squash-merge** (PR-RPS-2 implementation)
- `d0ad3d48` — **PR #148 squash-merge** (PR-RPS-3 implementation)
- `f2d42fee` — **PR #149 squash-merge** (PR-RPS-4 implementation)
- `29ff5a87` — **PR #150 squash-merge** (PR-RPS-5 implementation — IP V1 engine, 2026-05-10)
- `94625cdc` — PR #151 merge into feature branch (PR-RPS-6 sub-PR; never directly on main)
- `bec29c78` — **PR #152 squash-merge** (PR-RPS-6 + PR-RPS-7 bundled — IP V1 6-section UI + per-app shells, 2026-05-10)
- `8234c757` — **PR #153 squash-merge** (PR-RPS-8 implementation — Quick Action surface, 2026-05-10)
- `5f95e6fd` — **PR #154 squash-merge** (PR-RPS-9 implementation — Sustainment V1 + Inbox digest, 2026-05-13)
- `12e1257b` — **PR #155 squash-merge** (PR-RPS-10 implementation — Handoff V1 + sponsor signoff + 8-station E2E, 2026-05-13) — **RPS V1 COMPLETE**

## How to apply

When starting any RPS V1 PR:
1. `git fetch && git checkout -b response-path-system-v1 origin/main` (re-cut from latest main)
2. Read the spec + plan section for that PR
3. Use `superpowers:subagent-driven-development`
4. Honor the no-backward-compat rule
5. Run `bash scripts/pr-ready-check.sh` + `pnpm --filter @variscout/ui build` before opening PR
6. Per-PR Opus code-reviewer pass before squash-merge per `feedback_subagent_driven_default`
7. After merge: clean up local worktree (`git worktree remove .worktrees/response-path-system-v1`); `git branch -D response-path-system-v1`; `git fetch --prune`; rebase any local doc commits onto main with `git pull --rebase origin main`
