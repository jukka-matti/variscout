---
tier: ephemeral
purpose: build
title: 'Post-Phase-6 Refactoring Evaluation'
status: active
date: 2026-06-01
layer: spec
related:
  - 2026-05-31-refactoring-roadmap
  - adr-078-pwa-azure-architecture-alignment
---

# Post-Phase-6 Refactoring Evaluation

> **For agentic workers:** This is a read-only evaluation plan, not a code cleanup plan. Do not edit product code while executing this plan. Use explorer subagents where available, merge findings into a ranked recommendation table, then update the refactoring roadmap only after evidence is classified.

**Goal:** Decide which refactoring or cleanup slices should follow the active Phase 6 closeout without treating audit findings as pre-approved implementation work.

**Architecture:** Phase 6 remains current. R6e/R6f are the only Phase 6 labels in this plan. Non-Phase-6 candidates use neutral `Eval-*` labels until a later roadmap decision promotes them into a real implementation slice.

**Tech Stack:** TypeScript monorepo, pnpm, Turbo, Vitest, Vite, Zustand, Dexie/IDB, `@variscout/{core,data,stores,hooks,charts,ui}`, `apps/{pwa,azure}`.

---

## Evaluation Rules

- Run read-only. Do not apply patches to product code.
- Treat every finding as a hypothesis until the owning lane verifies it against current `main`.
- Classify each candidate as: safe cleanup now, decision-gated refactor, intentional PWA/Azure difference, accidental drift, or no action.
- PWA/Azure differences are bugs only when they violate ADR-078, R6d, or current V1 workflow intent.
- Keep R7/R8/R9 as later decision-gated horizons unless this evaluation promotes a specific part into immediate work.

## Explorer Lanes

1. **R6 persistence/access residue**
   - Verify snapshot-only `.vrs` and save/load behavior, PWA export-only semantics, Azure Save/Save As/conflict behavior, stale persistence docs/comments, and direct Dexie/localDb allow-listing.
   - Treat Azure server/SAS access enforcement as the main R6e risk.

2. **Large-file responsibility boundaries**
   - Evaluate large files by responsibility mixing, not LOC alone.
   - First targets: Azure `Editor.tsx`, PWA `App.tsx`, `CanvasWorkspace.tsx`, `AnalyzeWorkspace.tsx`, `analyzeStore.ts`, `WallCanvas.tsx`, `HypothesisCardWithPlans.tsx`, Azure `useEditorDataFlow.ts`, and Azure `storage.ts`.

3. **PWA/Azure intentional-vs-accidental divergence**
   - Classify differences as capability policy, persistence policy, accidental drift, or product decision needed.
   - First targets: Process `FrameView` parity, linked chart scope behavior, dashboard/report split, app header shell affordances, data ingestion limits, thin repository-adapter panels, and surviving byte-identical infra.

4. **Legacy/test cleanup and fixture debt**
   - Identify cleanup that can be executed safely without design debate.
   - First targets: duplicate stale PWA browser-save tests, `ProcessMapBase` legacy fallback mutators, stored-vs-derived hypothesis status, dual `CharacteristicType` vocabulary, stale Azure PI `questions` tab state, and brittle test fixtures.

## Ranked Recommendation Template

For each candidate, produce one row with:

| Rank | Label | Candidate | Classification | Risk | Evidence anchors | Verification | Decision                                             |
| ---- | ----- | --------- | -------------- | ---- | ---------------- | ------------ | ---------------------------------------------------- |
| 1    | R6e   | Example   | R6 closeout    | high | `path/file.ts`   | command/test | execute now / design first / defer / do not refactor |

## Seed Candidates From 2026-06-01 Audit

1. **R6e — Azure access-boundary hardening.** R6c/R6d model access correctly, but `apps/azure/server.js` still mints authenticated container-wide `rwl` SAS tokens, so document access metadata may remain advisory once a user has a SAS. Verify `apps/azure/src/services/{storage,cloudSync,blobClient,localDb}.ts` and `apps/azure/server.js`. Decision: execute or explicitly record launch blocker.

2. **R6f — Persistence residue sweep.** Confirm snapshot-only runtime and clean stale guidance. Earlier audit found no active `AnalysisState` under `apps/` or `packages/`, but stale docs/comments may still describe `.vrs` as full hub blob/rawData or mention optimistic merge/last-write-wins. Decision: execute after R6e terminology is settled.

3. **Eval-A — Safe post-R6 cleanup.** Verify whether stale PWA browser-save regression helpers can be de-duplicated and whether `ProcessMapBase` legacy fallback mutators can be removed. Decision: execute only after deletion-proof tests are named.

4. **Eval-B — Large-file boundary design.** Decide whether app shell responsibilities should move behind document/capability boundary hooks. Decision: design first; do not big-bang split `App.tsx` or `Editor.tsx`.

5. **Eval-C — Canvas and Analyze Wall model/render split.** Target pure view-model extraction before UI component reshaping. Decision: design first because shared UI and store responsibilities overlap.

6. **Eval-D — PWA/Azure divergence matrix.** Separate intentional capability/persistence policy from accidental drift. Decision: design first for Process/Explore and Report/dashboard surfaces.

7. **Eval-E — Test fixture hardening.** Migrate brittle literals and loose row fixtures to typed factories before the next domain-model churn. Decision: low-risk cleanup if package test/build verification is explicit.

## Acceptance Criteria

- The evaluation output contains one ranked table with no duplicate recommendations.
- Every candidate has evidence anchors, classification, risk, verification, and a decision.
- R6e/R6f remain first while Phase 6 is active.
- Eval-A through Eval-E remain neutral evaluation labels unless promoted by a later roadmap update.
- The master roadmap points to this plan instead of duplicating the full evaluation detail.

## Verification

- `pnpm docs:check:frontmatter`
- `pnpm docs:check`
- `git diff --check`
