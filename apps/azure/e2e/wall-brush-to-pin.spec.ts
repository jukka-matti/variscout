/**
 * Wall brush-to-pin Finding flow — DEFERRED until analyze-state seeding is feasible.
 *
 * See docs/decision-log.md 2026-05-09 entry for context.
 *
 * What this test SHOULD do once unblocked:
 *  1. seedPortfolioHub with hypotheses + EvidenceSnapshot rows
 *  2. Navigate portfolio → editor → Analyze tab
 *  3. Find a HypothesisCard with a populated MiniIChart
 *  4. Drag-select a region (pointerdown → pointermove → pointerup)
 *  5. Click "Pin" in the BrushToFindingFlow confirmation dialog
 *  6. Assert Finding count incremented in the analyze store
 *  7. Assert hypothesis status badge advanced (proposed → evidenced)
 *
 * Until then, coverage lives in:
 *   - packages/ui/src/components/AnalyzeWall/__tests__/BrushToFindingFlow.test.tsx
 *   - packages/hooks/src/__tests__/useIChartBrush.test.tsx
 *   - packages/hooks/src/__tests__/useBoxplotSelect.test.tsx
 *   - packages/ui/src/components/AnalyzeWall/__tests__/MiniIChart.test.tsx
 *   - packages/ui/src/components/AnalyzeWall/__tests__/MiniBoxplot.test.tsx
 */
import { test } from '@playwright/test';

test.skip('Wall brush-to-pin Finding flow — analyze-state seeding required', () => {
  // Implementation pending: window.__VARISCOUT_TEST__ store hook OR HubRepository persistence
  // for hypotheses + findings.
});
