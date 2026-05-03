// apps/pwa/e2e/modeB.e2e.spec.ts
//
// Framing layer Mode B (PWA): paste → goal narrative → outcome confirm → canvas first paint.
//
// NOTE: This test is currently skipped pending full integration of the framing-layer
// flow (HubGoalForm injection between paste and column-mapping, plus canvas
// GoalBanner/OutcomePin first-paint composition). Slice 1 wires SessionProvider +
// Mode A.1 reopen end-to-end; the multi-stage paste→goal→mapping→canvas Mode B flow
// requires the column-mapping refactor that is out of scope for slice 1.
//
// Re-enable in the slice that delivers Stage 1/3 routing inside App.tsx.
import { test, expect } from '@playwright/test';

test.describe('Framing layer Mode B (PWA)', () => {
  test.skip('paste → goal narrative → outcome confirm → canvas first paint', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Paste from Excel');
    await page
      .getByRole('textbox', { name: /paste data/i })
      .fill('weight_g,oven_temp\n4.5,178\n4.4,180\n4.6,180\n4.5,179\n4.4,178');
    await page.click('text=Parse');

    // Stage 1: goal narrative
    await page
      .getByRole('textbox', { name: /process goal/i })
      .fill('We mold barrels for medical customers.');
    await page.click('text=Continue');

    // Stage 3: outcome auto-selected via goal context
    await expect(page.getByRole('radio', { name: /weight_g/i })).toBeChecked();
    await page.click('text=Confirm');

    // Stage 4: canvas first paint
    await expect(page.getByTestId('goal-banner')).toContainText('We mold barrels');
    await expect(page.getByTestId('outcome-pin')).toContainText('weight_g');
  });
});
