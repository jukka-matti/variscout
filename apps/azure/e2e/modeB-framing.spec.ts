// apps/azure/e2e/modeB-framing.spec.ts
//
// Azure Mode B framing: Paste Data → b0 → analysis canvas.
//
// Test groups:
//   1. Full Mode B via Editor paste — from "Paste Data" through b0's selected
//      Y/X handoff to the analysis canvas.
//   2. "New Hub" from ProjectDashboard sidebar — loads a sample, navigates to Overview
//      tab, clicks action-new-hub, runs Mode B paste flow again.
//      Skips gracefully when sample picker is unavailable.
import { test, expect } from '@playwright/test';
import {
  pasteDataAndAnalyze,
  pasteToB0,
  seeB0Data,
  selectB0Outcome,
  openFixDataWizard,
  loadSampleToCharts,
  DETECTION_CSV,
  MODE_B_CSV,
} from './helpers';

const TWO_Y_CSV = [
  'weight_g,cycle_time_sec,product,shift',
  '4.5,24.5,A,morning',
  '4.4,25.1,A,morning',
  '4.6,24.8,B,evening',
  '4.5,26.3,B,evening',
  '4.4,26.8,A,morning',
  '4.5,26.1,A,morning',
  '4.6,23.0,B,evening',
  '4.3,22.5,A,morning',
  '4.7,23.2,B,evening',
  '4.5,24.0,A,morning',
].join('\n');

// ---------------------------------------------------------------------------
// Helper: wait for the Azure app to finish loading.
// On localhost auth auto-resolves (isLocalDev → LOCAL_USER).  The first stable
// anchor is the Editor empty-state heading or the analysis tab when a project
// is already loaded.
// ---------------------------------------------------------------------------
async function waitForApp(page: import('@playwright/test').Page) {
  await page.goto('/');
  await expect(
    page
      .locator('text=Start Your Analysis')
      .or(page.locator('[data-testid="chart-ichart"]'))
      .or(page.locator('[data-testid="project-dashboard"]'))
  ).toBeVisible({ timeout: 15000 });
}

// ---------------------------------------------------------------------------
// Helper: open PasteScreen from the Editor empty state.
// ---------------------------------------------------------------------------
async function openPasteScreen(page: import('@playwright/test').Page) {
  await waitForApp(page);
  // "Paste Data" is the button in EditorEmptyState.
  await page.getByRole('button', { name: 'Paste Data' }).first().click();
  await expect(page.getByTestId('paste-textarea')).toBeVisible({ timeout: 8000 });
}

// ---------------------------------------------------------------------------
// Helper: dismiss any auto-fire modals that appear after analysis confirms.
// - Factor Intelligence Preview → "Skip" button
// - Capability Suggestion ("Specification limits detected") → "Standard View"
// These modals auto-fire in fresh test contexts; dismiss before asserting canvas.
// ---------------------------------------------------------------------------
async function dismissAutoFireModals(page: import('@playwright/test').Page) {
  // Factor Intelligence Preview: "Skip" button
  const skipButton = page.locator('button:has-text("Skip")');
  const skipVisible = await skipButton.isVisible({ timeout: 3000 }).catch(() => false);
  if (skipVisible) {
    await skipButton.click();
    await skipButton.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
  }

  // Capability Suggestion modal: "Standard View" button (Specification limits detected)
  const standardViewButton = page.locator('button:has-text("Standard View")');
  const capVisible = await standardViewButton.isVisible({ timeout: 3000 }).catch(() => false);
  if (capVisible) {
    await standardViewButton.click();
    await standardViewButton.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
  }

  // Close any remaining dialog with an × button
  const closeButton = page.locator('button[aria-label="Close"], button:has-text("×")').first();
  const closeVisible = await closeButton.isVisible({ timeout: 1000 }).catch(() => false);
  if (closeVisible) {
    await closeButton.click().catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Test group 1: Paste flows — b0 landing for measurement and detection-shaped data
// ---------------------------------------------------------------------------

test.describe('Azure Mode B framing — Editor paste flow', () => {
  // FSJ-3b (spec §4.1): measurement-shaped pastes skip the mapping vestibule
  // and land at the Process tab (frame-view-b0) with Y/X pre-filled.
  // Stage-1 HubGoalForm no longer exists in the flow (wizard demoted to
  // ColumnMapping-only; Stage-1 retired in FSJ-3b).
  test('Measurement paste → b0 → charts in two interactions (no wizard)', async ({ page }) => {
    // 1. Open PasteScreen from Editor empty state
    await openPasteScreen(page);

    // 2. Paste measurement CSV → lands at frame-view-b0 (wizard skipped entirely)
    await pasteToB0(page, MODE_B_CSV);

    // 3. b0 is the handoff; "See the data" is the second interaction.
    await expect(page.getByTestId('frame-view-b0')).toBeVisible();
    await expect(page.getByTestId('map-your-data-heading')).toHaveCount(0);
    await seeB0Data(page);
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
  });

  test('Post-landing Y changes only through b0 before charts render', async ({ page }) => {
    await openPasteScreen(page);
    await pasteToB0(page, TWO_Y_CSV);

    await selectB0Outcome(page, 'cycle_time_sec');
    await expect(page.getByTestId('map-your-data-heading')).toHaveCount(0);
    await seeB0Data(page);

    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
  });

  // FSJ-6 (spec §4.2a): detection-shaped defect event-log pastes land at b0
  // with an inline re-framing banner. They no longer open the defect modal or
  // bypass b0 into ColumnMapping.
  test('Detection paste (defect event-log) → b0 defect re-framing banner', async ({ page }) => {
    // 1. Open PasteScreen from Editor empty state
    await openPasteScreen(page);

    // 2. Paste defect event-log CSV → lands at b0 with the loud re-framing banner
    await pasteDataAndAnalyze(page, DETECTION_CSV);

    // 3. Stage 1 and ColumnMapping must NOT appear — FSJ-6 keeps the analyst on b0.
    const stage1 = page.getByTestId('hub-creation-stage1');
    const stage1Visible = await stage1.isVisible({ timeout: 2000 }).catch(() => false);
    expect(stage1Visible).toBe(false);
    await expect(page.getByTestId('map-your-data-heading')).toHaveCount(0);

    // 4. b0 landing and inline defect proposal are the confirmation surface.
    await expect(page.getByTestId('frame-view-b0')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('b0-defect-banner')).toBeVisible();
    await expect(page.locator('text=Defect Data Detected')).toHaveCount(0);
  });

  test('Defect paste → derived metric picker → b0 pinned Y → charts', async ({ page }) => {
    await openPasteScreen(page);
    await pasteDataAndAnalyze(page, DETECTION_CSV);

    await page.getByTestId('b0-defect-expand').click();
    await expect(page.getByTestId('b0-defect-confirm-panel')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('b0-defect-accept').click();

    await expect(page.getByTestId('y-picker-selected-row')).toContainText('DefectCount', {
      timeout: 5000,
    });
    await seeB0Data(page);
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
  });

  test('Fix data and track-another-outcome hatches open ColumnMapping from b0', async ({
    page,
  }) => {
    await openPasteScreen(page);
    await pasteToB0(page, MODE_B_CSV);

    await openFixDataWizard(page);
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByTestId('frame-view-b0')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('b0-provenance')).toContainText('10 rows');

    await page.getByTestId('b0-track-another-outcome').click();
    await expect(page.locator('text=Map Your Data')).toBeVisible({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// Test group 2: "New Hub" from ProjectDashboard sidebar (action-new-hub)
// ---------------------------------------------------------------------------

test.describe('Azure Mode B framing — ProjectDashboard "New Hub" entry point', () => {
  // FSJ-3b: Stage-1 (HubGoalForm) retired — wizard is ColumnMapping-only.
  // The "New Hub" entry point triggers a paste → b0 landing for measurement data.
  test('"New Hub" quick-action opens Paste Data → b0 landing on Process tab', async ({ page }) => {
    // 1. Load a sample through the landing-era sample -> b0 -> charts spine to
    // unlock the ProjectDashboard sidebar (needs hasData=true).
    await waitForApp(page);
    const sampleButton = page.locator('[data-testid^="sample-"]').first();
    const hasSample = await sampleButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasSample) {
      test.skip();
      return;
    }
    await loadSampleToCharts(page);

    await dismissAutoFireModals(page);
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });

    // 2. Navigate to Home tab to show ProjectDashboard with "New Hub" button
    const homeTab = page.getByTestId('workflow-tab-home');
    const tabVisible = await homeTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (!tabVisible) {
      test.skip();
      return;
    }
    await homeTab.click();

    // 3. Click "New Hub" in the quick-actions area
    const newHubButton = page.getByTestId('action-new-hub');
    await expect(newHubButton).toBeVisible({ timeout: 5000 });
    await newHubButton.click();

    // 4. PasteScreen appears (handleNewHub calls showAnalysis() + startPaste())
    await expect(page.getByTestId('paste-textarea')).toBeVisible({ timeout: 8000 });

    // 5. Complete paste flow: measurement paste → b0 landing (Stage-1 retired,
    //    wizard demoted to ColumnMapping-only in FSJ-3b).
    //
    //    handlePasteAnalyze calls confirmReplaceIfNeeded() → window.confirm() when
    //    rawData.length > 0 && outcome is already set (from the loaded sample).
    //    Accept the dialog so the paste proceeds rather than aborting.
    page.once('dialog', dialog => dialog.accept());
    // FSJ-3b: measurement paste skips the wizard (hub-creation-stage1 + ColumnMapping)
    // and lands at frame-view-b0. Stage-1 never renders on this path.
    await pasteToB0(page, MODE_B_CSV);

    await expect(page.getByTestId('frame-view-b0')).toBeVisible();
    await seeB0Data(page);
  });
});
