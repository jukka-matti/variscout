---
tier: ephemeral
purpose: build
title: 'ER-5b — Count-shaped-Y auto-detection + Pareto promotion (sub-plan)'
audience: agent
status: active
date: 2026-06-13
layer: spec
topic: [explore, defect, pareto, factor-strip, analysis-mode, wedge-v1]
related:
  - docs/superpowers/specs/2026-06-10-explore-redesign-design.md
  - docs/superpowers/plans/2026-06-10-explore-redesign-master-plan.md
implements:
  - docs/03-features/workflows/analysis-flow.md
---

# ER-5b — Count-shaped-Y auto-detection + Pareto promotion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`). One worktree (`.worktrees/er-5b-count-y`), TDD per task, per-category commits. **Right-size:** standard TDD against named files — Sonnet/Fable implementer; the data-shape dispatch judgment lives in this plan, not the implementer.

**Goal:** Make count/event-log-shaped Y dispatch to defect handling automatically by data-shape (retiring the blocking `DefectDetectedModal` gate in favour of auto-apply + a one-click-correctable banner), and switch the factor strip to a level-native defect-rate-share variant when in that dispatch — all within the existing 4-slot dashboard contract.

**Architecture:** Two cohesive halves on one branch. **(A) Auto-dispatch:** the ingestion handlers (`usePasteImportFlow`/PWA, `useEditorDataFlow`/Azure) already call `detectDefectFormat()`; today they fan a `DEFECT_DETECTED` event into a blocking modal. Change high-confidence detection to **auto-apply the suggested mapping + set defect dispatch silently** and surface a dismissible `DefectDispatchBanner` (`⌖ Detected count data — analyzing defect rates · [adjust columns ▾] · [use as standard data]`). The existing `DefectDetectedModal` is retained but demoted to the "adjust columns" affordance opened from the banner — never an entry gate. **(B) Defect-rate-share strip:** mirror the ER-5a membership pattern exactly — a pure-core `computeDefectRateShares()` (ADR-088 level-native rate contribution), a `useDefectRateModel()` hook packaging typed chips, and a third `variant: 'defect-rate-share'` on `FactorStripBase` fed by a `defectRateChips` prop. The `computeDefectRates`-before-stats boundary and `AnalysisMode` persistence are **untouchable**.

**Tech Stack:** TypeScript (pure-core stats), React hooks, Vitest + RTL, Tailwind v4, Zustand (read-only), i18n (32-catalog all-or-nothing).

## Hard constraints (gates, not steps)

- **`resolveMode()` / `getStrategy()` stay structurally intact.** ER-5b does NOT move data-shape detection _into_ `resolveMode()` (it is a pure fn with no dataset access). Auto-dispatch happens at **ingestion** by auto-applying mapping + `setAnalysisMode('defect')`; `resolveMode('defect')` already returns `'defect'`. Touching the hard-rule file beyond comments requires explicit justification in the PR body.
- **Exactly 4 chart slots** in every strategy. The defect strategy already gives Pareto `slot3`; ER-5b must NOT add a 5th slot. "Pareto promotion" = confirm/keep Pareto's primary slot by data-shape right; if any reorder is made, it is a within-`chartSlots` swap with a test.
- **`computeDefectRates()` runs BEFORE stats** — never call the stats engine on raw event-log rows. The new `computeDefectRateShares()` consumes the already-transformed working dataset, not raw rows.
- **`AnalysisMode` (`'standard' | 'performance' | 'defect'`) persistence untouched.** No new persisted enum value; no mode switcher in the redesigned Explore chrome.
- **Statistical honesty (P5 / ADR-069):** defect-rate share is a level-native rate contribution (ADR-088), NOT a variance share — never label it "% of variation". Raw numbers from core; formatting in UI via `formatStatistic` (never `.toFixed`).
- **i18n:** every new key lands in `i18n/types.ts` `MessageCatalog` + ALL 32 catalogs (English placeholder convention) or `tsc` breaks.
- **Both apps:** shared `@variscout/ui`/`@variscout/hooks`/`@variscout/core` are edited once; PWA + Azure `Dashboard.tsx` + ingestion handlers are wired per-app (still two trees post-#388).
- **Verification baseline:** `bash scripts/pr-ready-check.sh` green · app test suites RUN (not builds only) · `claude --chrome` walk of count-data ingestion + the defect-rate strip against the wireframe.

---

## Grounded file map (verified against main @ ff8f34935, 2026-06-13)

| Concern                         | File:anchor                                                                                                                                                                                                                                    | Current state                                                             |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Mode dispatch (hard rule)       | `packages/core/src/analysisStrategy.ts:85-93` (`resolveMode`), `:171-192` (defect strategy, `slot3:'pareto'`, `paretoYOptions('count','time','cost')`)                                                                                         | Pure fn; defect strategy already routes `computeDefectRates`.             |
| Detection engine                | `packages/core/src/defect/detection.ts:128` (`detectDefectFormat`) → `DefectDetection{isDefectFormat,confidence,dataShape,suggestedMapping}`                                                                                                   | Returns high/medium/low confidence + suggested mapping. No change needed. |
| Defect transform (boundary)     | `packages/core/src/defect/transform.ts` (`computeDefectRates`)                                                                                                                                                                                 | UNTOUCHABLE. Consume its output.                                          |
| PWA ingestion detect→modal      | `packages/hooks/src/useDataIngestion.ts:222-238` (fires `onDefectDetected`), `apps/pwa/src/App.tsx:340`, `apps/pwa/src/hooks/usePasteImportFlow.ts:811` (`dispatch DEFECT_DETECTED`)                                                           | Modal-gated today.                                                        |
| Azure ingestion detect→modal    | `apps/azure/src/features/data-flow/useEditorDataFlow.ts:409` (`handleDefectDetectedFromIngestion`), `apps/azure/src/pages/Editor.tsx:334`                                                                                                      | Modal-gated today.                                                        |
| Modal (demote, don't delete)    | `packages/ui/src/components/DefectDetectedModal/index.tsx` (`onEnable(mapping)`/`onDismiss`)                                                                                                                                                   | Becomes the "adjust columns" affordance.                                  |
| Strip variant pattern to mirror | `packages/ui/src/components/FactorStrip/FactorStripBase.tsx:39-57` (`variant?: 'magnitude'\|'membership'`, `membershipChips?`), `packages/hooks/src/useMembershipModel.ts`, `packages/hooks/src/useFactorStripModel.ts:45` (`FactorStripChip`) | Two variants today; add a third.                                          |
| Strip mount (both apps)         | `apps/pwa/src/components/Dashboard.tsx:~1111-1157`, `apps/azure/src/components/Dashboard.tsx` (membership-vs-magnitude selection)                                                                                                              | Add defect-rate branch.                                                   |
| ADR refs                        | ADR-088 (level-native contribution), ADR-047 (mode strategy)                                                                                                                                                                                   | Amend per ER-DOC.                                                         |

---

## Task 1 (core) — `computeDefectRateShares()` level-native rate contribution

**Files:** Create `packages/core/src/defect/rateShares.ts`; export from `packages/core/src/defect/index.ts` + barrel `packages/core/src/index.ts`; Test `packages/core/src/defect/__tests__/rateShares.test.ts`.

**Outcome:** Given the `computeDefectRates`-transformed working dataset + a candidate factor list + the resolved defect outcome column, rank each factor by how much its levels concentrate the defect rate (ADR-088 level-native: per-level defect rate vs. the overall rate, weighted by level exposure). Return raw `DefectRateShare[]` (factor, perLevel `{level, rate, share, n}`, a factor-level `concentration` statistic for ranking, significance flag). **Honesty:** these are rate shares, not variance shares — mirror the `MembershipChip` JSDoc honesty block.

- [ ] Write failing tests: (a) a 2-factor fixture where one factor perfectly separates defect rate (high concentration) and one is flat (≈0) — assert ranking order + that the flat factor's concentration ≈ 0; (b) `Number.isFinite` guards — empty data / single-level factor return safe values, never `NaN`/`Infinity`; (c) deterministic (no `Math.random`); (d) Y-derived columns excluded (reuse `excludeYDerivedFactors`).
- [ ] Run → fail. Implement minimal pure-TS using `safeMath`. Run → pass. Commit `feat(core): level-native defect-rate shares (ADR-088)`.

## Task 2 (hooks) — `useDefectRateModel()`

**Files:** Create `packages/hooks/src/useDefectRateModel.ts`; export from `packages/hooks/src/index.ts`; Test `packages/hooks/src/__tests__/useDefectRateModel.test.ts`.

**Outcome:** Mirror `useMembershipModel` exactly — memoised on (workingRows, allFactors, defectOutcome, bindings); no store reads; drops Y-derived factors; returns `DefectRateChip[]` (raw numbers, UI formats). Package `computeDefectRateShares` output into chips with the fields `FactorStripBase` needs to render bars + the over-concentrated level annotation.

- [ ] Failing test (RTL `renderHook`): chips ranked DESC by concentration; empty → `null`; locale loader registered. Run → fail → implement → pass. Commit `feat(hooks): useDefectRateModel`.

## Task 3 (ui) — `FactorStripBase` third variant `'defect-rate-share'`

**Files:** Modify `packages/ui/src/components/FactorStrip/FactorStripBase.tsx` (add `'defect-rate-share'` to the `variant` union + a `defectRateChips?: DefectRateChip[]` prop + a render branch); add i18n keys (strip title "What drives the defect rate?", per-level/over-concentrated copy, honesty subtitle) to `MessageCatalog` + all 32 catalogs; Test `packages/ui/src/components/FactorStrip/__tests__/FactorStripBase.defectRate.test.tsx`.

**Outcome:** When `variant='defect-rate-share'`, render the same parallel-bar chip grammar as magnitude/membership but driven by `defectRateChips` — per-factor bar = rate concentration, chip face shows the most over-concentrated level (`Queue — Billing 14.2%`), honesty subtitle present, ★ on the largest significant share with "largest share" copy (never "strongest"). **The magnitude + membership paths stay byte-identical** (snapshot guard).

- [ ] Failing test: variant renders defect-rate chips, honesty subtitle present, magnitude snapshot unchanged. Run → fail → implement → pass. Commit `feat(ui): defect-rate-share strip variant`.

## Task 4 (ui) — `DefectDispatchBanner` + demote the modal

**Files:** Create `packages/ui/src/components/DefectDispatchBanner/index.tsx` (+ barrel export); add i18n keys; Test `packages/ui/src/components/DefectDispatchBanner/__tests__/index.test.tsx`.

**Outcome:** A dismissible, non-blocking banner: `⌖ Detected count data — analyzing defect rates` with `[adjust columns ▾]` (fires `onAdjust` → opens the existing `DefectDetectedModal` for mapping correction) and `[use as standard data]` (fires `onUseStandard` → reverts to standard dispatch). Props-based, store-free, all copy i18n. Never auto-dismisses; closing is explicit.

- [ ] Failing test: renders detection summary; `onAdjust`/`onUseStandard`/`onDismiss` fire. Run → fail → implement → pass. Commit `feat(ui): DefectDispatchBanner (auto-apply correction affordance)`.

## Task 5 (apps) — Auto-apply at ingestion (retire the modal gate)

**Files:** Modify `apps/pwa/src/hooks/usePasteImportFlow.ts` (`handleDefectDetected` + reducer), `apps/pwa/src/App.tsx:340` + Dashboard banner mount; Modify `apps/azure/src/features/data-flow/useEditorDataFlow.ts:409` + `apps/azure/src/pages/Editor.tsx:334` + Azure Dashboard banner mount. Update existing modal-flow tests.

**Outcome:** On **high-confidence** detection, auto-apply `suggestedMapping` (call the existing enable path: `setDefectMapping(mapping)` + `setAnalysisMode('defect')`) WITHOUT opening the modal, and set banner state. **Medium-confidence** keeps the prior confirm behaviour (open the modal — detection is less sure, so don't silently transform). `[use as standard data]` clears defect mapping + `setAnalysisMode('standard')`; `[adjust columns]` opens the demoted modal. No regression to the standard/performance ingestion paths.

- [ ] Update the PWA + Azure ingestion tests to assert auto-apply on high confidence + banner state + the standard-revert path; remove modal-as-gate assertions. Run app suites → green. Commit `feat(pwa,azure): auto-apply defect dispatch + correctable banner`.

## Task 6 (apps) — Wire the defect-rate strip variant + confirm Pareto slot

**Files:** Modify `apps/pwa/src/components/Dashboard.tsx` + `apps/azure/src/components/Dashboard.tsx` (select `variant='defect-rate-share'` + feed `useDefectRateModel` when the resolved mode is `'defect'`, else the existing magnitude/membership selection). Add a strategy test confirming the defect strategy keeps Pareto in a primary slot (`packages/core/src/__tests__/analysisStrategy.test.ts` or the nearest existing strategy test).

**Outcome:** In defect dispatch the strip shows defect-rate-share; otherwise unchanged. Pareto remains a primary slot by data-shape right within the 4-slot contract (assert `getStrategy('defect').chartSlots` contains `'pareto'` in slot1–3; no 5th slot).

- [ ] Strategy slot test + Dashboard wiring. Run suites → green. Commit `feat(pwa,azure): mount defect-rate strip + assert Pareto primary slot`.

## Task 7 (ER-DOC) — doc propagation (REQUIRED, reviewed with the slice)

**Files:** ADR-088 note (level-native defect-rate share now consumed by the strip) + ADR-047 auto-dispatch note; `packages/core/CLAUDE.md` strategy section (data-shape dispatch is automatic at ingestion, not in `resolveMode`); `docs/03-features/workflows/analysis-flow.md` Pareto/defect section; mode-switcher-retirement note in `docs/.../ia-nav-model.md` if it mentions modes; `docs/ephemeral/investigations.md` `[RESOLVED]` markers for any 2026-06-10 defect/Pareto entries this closes (add an entry first if none exists, then resolve).

- [ ] Apply doc edits. Commit `docs(er-5b): auto-dispatch + defect-rate-share propagation`.

---

## Self-review checklist (run before requesting review)

- Spec §12 / D12 coverage: auto-detect ✓ (Task 5), Pareto primary slot ✓ (Task 6), defect-rate-share strip ✓ (Tasks 1–3,6), no mode switcher in chrome ✓ (no switcher added), `computeDefectRates`-before-stats untouched ✓.
- Fork honoured: auto-apply + correctable banner, NOT silent, NOT modal-gated (Tasks 4–5).
- Honesty: rate share ≠ variance share (Task 1 JSDoc + Task 3 subtitle).
- No 5th slot; `resolveMode` structurally intact; `AnalysisMode` enum unchanged.
- i18n all-32 for every new key.
