---
title: 'React `setState-in-render` warning fires from `AppMain` across canvas transitions'
purpose: remember
tier: card
status: archived
date: 2026-05-14
topic: ['investigation', 'resolved']
surfaced-by-pr: 166
surfaced-date: 2026-05-14
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> **Archived investigation card** — closed 2026-05-14 (resolved); extracted from `docs/investigations.md` on 2026-05-18. Live queue: [`ephemeral/investigations.md`](../../ephemeral/investigations.md). Card index: [`cards/investigations/`](../investigations/).

# React `setState-in-render` warning fires from `AppMain` across canvas transitions

**Surfaced by:** `--chrome` walk of PR #166 (canvas-viewport-8f-followups) on 2026-05-14.

**Description:** Console error repeats on every Frame-tab activation, LOD transition (L1↔L2↔L3 via wheel-zoom), and `Lock canvas` mode toggle: `Cannot update a component (AppMain) while rendering a different component (AppMain). To locate the bad setState() call inside AppMain, follow the stack trace as described in https://react.dev/link/setstate-in-render`. Fires multiple times per interaction (8+ instances captured during a 9-minute walk). `apps/pwa/src/App.tsx` is NOT touched on the `canvas-viewport-8f-followups` branch (`git log origin/main..HEAD -- apps/pwa/src/App.tsx` empty), so this is pre-existing — likely predates 8f or was introduced by `feat(8f): PR1 Foundation` (commit `57c48a26`). `AppMain` has 70+ Zustand selectors and several derived-data hooks (`useFilteredData`, `useStatsWorker`, `useAnalysisStats`, `useDefectTransform`, `useDefectSummary`); one of them is calling `setState` during render of another.

**Suspected mechanism:** A derived-data hook (likely `useStatsWorker` or `useAnalysisStats`) computes a result during render and writes it back to a store, triggering a re-render mid-render. Or a `useCanvasViewportStore` selector returns a new reference each render. Strict-mode escalates the warning to an error in dev.

**Why it matters:** noisy console drowns out real errors; possible silent state desync; potential infinite-loop risk if a future change adds another store-driven derivation. Not user-visible today but a real React-correctness violation.

**Possible directions:** Open in React DevTools profiler during a canvas transition; identify which component logs the violation; replace render-time setState with a `useEffect`, or memoize the selector return reference.

**Resolution (2026-05-14, PR cleanup/setstate-appmain, commit `6c5bc1a7`):** Static analysis of all five named suspects (`useFilteredData`, `useStatsWorker`, `useAnalysisStats`, `useDefectTransform`, `useDefectSummary`) confirmed they are clean (pure `useMemo` or `useEffect`-gated). The actual violation was a bare `const store = usePanelsStore()` whole-store subscription in `apps/pwa/src/hooks/useAppPanels.ts` — directly violating the `packages/stores/CLAUDE.md:18` rule "Never bare `useStore()`" (cites ADR-041). In React 19 Strict Mode + Zustand 5 (`useSyncExternalStore`), a whole-store subscription causes tearing detection to re-invoke the snapshot function, which in turn re-processes the store reference, triggering the warning on every `panelsStore` update (including panel-state transitions co-incident with LOD switches and frame-tab activation). Fix: rewrote `useAppPanels.ts` to use 24 individual `usePanelsStore(s => s.field)` selectors — one per state field and action. `useEffect` dependency arrays cleaned accordingly. Regression test added in `apps/pwa/src/__tests__/App.test.tsx`.
