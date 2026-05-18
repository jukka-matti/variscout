---
title: 'F4 Data-Flow Foundation SHIPPED (PR #136, merge commit `00924f86`)'
purpose: decide
tier: card
status: active
date: 2026-05-07
topic: ['decisions', 'canvas', 'investigation', 'wall']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---
> **Decision card** — extracted from `docs/decision-log.md` §1 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# F4 Data-Flow Foundation SHIPPED (PR #136, merge commit `00924f86`)

Operationalizes Data-Flow Foundation §3 D5 ("three-layer state — Document / Annotation / View"). Every Zustand store in `packages/stores/` now belongs to exactly one layer, enforced by `packages/stores/src/__tests__/layerBoundary.test.ts`.

  **Locked decisions D1–D8:** (D1) Physical store separation — View state lands in `useViewStore` (no persist middleware); per-user Annotation lands in `usePreferencesStore` (idb-keyval persistence, key `'variscout-preferences'`); Document state continues in `projectStore` / `investigationStore` / `canvasStore` (each carries `STORE_LAYER = 'document'`). (D2) `useSessionStore` split: 11 persisted fields divided; transient fields (expanded-ids, focused UI state) → `useViewStore`; durable per-user fields (workspace tab, panel toggles, AI preferences, time lens, riskAxisConfig, budgetConfig) → `usePreferencesStore`. Old `useSessionStore` fully deleted. (D3) `useImprovementStore` deleted: `riskAxisConfig` + `budgetConfig` → preferences (now persist for the first time — intentional UX fix); `activeView` + `highlightedIdeaId` → view (transient, never persisted). (D4) `selectedPoints` / `selectionIndexMap` + 4 rich selection actions relocated from `projectStore` → `useViewStore`. (D5) `focusedQuestionId` relocated from `investigationStore` → `useViewStore`. (D6) `STORE_LAYER` constant (`'document' | 'annotation-per-user' | 'annotation-per-investigation' | 'view'`) added to all 6 stores. (D7) `layerBoundary.test.ts` enforces: no `persist` middleware on view stores; mandatory `persist` on annotation-per-user; no `persist` on document stores; all stores export `STORE_LAYER`; no `useSessionStore` import anywhere. (D8) `DocumentSnapshot` intersection type pre-positioned in `packages/stores/src/types/DocumentSnapshot.ts` — intersection of `ProjectStore`, `InvestigationStore`, `CanvasStore` document fields; ready for future `.vrs` export envelope.

  **Behaviour delta:** `riskAxisConfig` + `budgetConfig` now survive page reload (previously reset because `improvementStore` had no persist middleware). This is the only user-visible behaviour change; intentional per spec D2. **Storage migration:** legacy `'variscout-session'` IDB blob dropped; `usePreferencesStore` writes `'variscout-preferences'`. Acceptable per `feedback_no_backcompat_clean_architecture` (pre-production). Existing users see defaults until first interaction populates the new key. **Test count:** stores package 286 → 250 (sessionStore.test.ts removed; store count is now 6: projectStore + investigationStore + canvasStore + wallLayoutStore + useViewStore + usePreferencesStore). All packages green; `pnpm build` green. **F-series progression:** F1 → F2 → F3 → F3.5 → F3.6-β → F4 → F5 (sustainment/handoff dispatch coverage, named-future) → F6 (multi-investigation lifecycle, named-future). _Pinned 2026-05-07._
