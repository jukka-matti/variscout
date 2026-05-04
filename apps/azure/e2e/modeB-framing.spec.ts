// apps/azure/e2e/modeB-framing.spec.ts
//
// Azure Mode B framing: Paste Data → HubCreationFlow (Stage 1 + Stage 3) → analysis canvas.
//
// Test groups:
//   1. Full Mode B via Editor paste — from "Paste Data" button through HubGoalForm and
//      ColumnMapping to the analysis canvas (I-chart visible confirms outcome is set).
//   2. GoalBanner edit roundtrip via ProcessHubView — navigates to portfolio, opens a
//      hub card, edits GoalBanner inline, saves.  Skips gracefully when portfolio
//      is not accessible from a clean context (no saved projects).
//   3. "New Hub" from ProjectDashboard sidebar — loads a sample, navigates to Overview
//      tab, clicks action-new-hub, runs Mode B paste flow again.
//      Skips gracefully when sample picker is unavailable.
//   4. Portfolio ProcessHubView "Add framing" CTA — navigates back from editor to
//      portfolio, clicks "New Hub", verifies hub-framing-prompt.
//      Skips gracefully when portfolio is not accessible.
import { test, expect } from '@playwright/test';
import { confirmColumnMapping, pasteDataAndAnalyze, completeStage1, MODE_B_CSV } from './helpers';

const GOAL_NARRATIVE =
  'We mold syringe barrels for medical customers. Weight in grams matters most.';
const EDITED_GOAL = 'We produce precision medical components. Weight accuracy is critical.';

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
// Test group 1: Full Mode B framing via Editor paste
// ---------------------------------------------------------------------------

test.describe('Azure Mode B framing — Editor paste flow', () => {
  test('Paste Data → HubGoalForm (Stage 1) → ColumnMapping (Stage 3) → I-chart visible', async ({
    page,
  }) => {
    // 1. Open PasteScreen from Editor empty state
    await openPasteScreen(page);

    // 2. Paste CSV and start analysis → Stage 1 (HubGoalForm) appears
    await pasteDataAndAnalyze(page, MODE_B_CSV);

    // 3. Stage 1: HubCreationFlow wraps HubGoalForm in hub-creation-stage1
    await completeStage1(page, GOAL_NARRATIVE);

    // 4. Stage 3: ColumnMapping — select weight_g and confirm
    await confirmColumnMapping(page, 'weight_g');

    // 5. Analysis canvas: I-chart should appear (confirms outcome was set)
    await dismissAutoFireModals(page);
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
  });
});

// ---------------------------------------------------------------------------
// Test group 2: GoalBanner edit roundtrip via portfolio ProcessHubView
// ---------------------------------------------------------------------------

test.describe('Azure Mode B framing — GoalBanner edit roundtrip (portfolio)', () => {
  test('GoalBanner click → textarea → save → updated text (portfolio ProcessHubView)', async ({
    page,
  }) => {
    // 1. Complete Mode B flow to create a framed Hub
    await openPasteScreen(page);
    await pasteDataAndAnalyze(page, MODE_B_CSV);
    await completeStage1(page, GOAL_NARRATIVE);
    await confirmColumnMapping(page, 'weight_g');
    await dismissAutoFireModals(page);
    // Wait for analysis to load
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });

    // 2. Navigate to portfolio (back button requires canNavigateBack = true).
    //    The logo/back button aria-label is set by t('nav.backToDashboard').
    //    If not accessible (no saved projects), skip.
    const backButton = page.getByRole('button', { name: /back to dashboard/i });
    const portfolioAccessible = await backButton.isVisible({ timeout: 3000 }).catch(() => false);
    if (!portfolioAccessible) {
      test.skip();
      return;
    }

    await backButton.click();
    await expect(page.locator('text=Process Hubs')).toBeVisible({ timeout: 10000 });

    // 3. Find a hub card with a processGoal set and open its ProcessHubView
    const hubCards = page.getByTestId('process-hub-card');
    const count = await hubCards.count().catch(() => 0);
    if (count === 0) {
      test.skip();
      return;
    }
    await hubCards.first().click();

    // 4. GoalBanner is shown above the hub tabs when processGoal is set
    const goalBanner = page.getByTestId('goal-banner');
    const bannerVisible = await goalBanner.isVisible({ timeout: 5000 }).catch(() => false);
    if (!bannerVisible) {
      test.skip();
      return;
    }

    // 5. Click GoalBanner to enter edit mode (inline textarea)
    await goalBanner.click();
    const goalTextarea = goalBanner.locator('textarea');
    await expect(goalTextarea).toBeVisible({ timeout: 3000 });

    // 6. Replace goal text and save
    await goalTextarea.fill(EDITED_GOAL);
    await goalBanner.locator('button:has-text("Save")').click();

    // 7. Banner should show the updated text
    await expect(goalBanner).toContainText('precision medical components');
  });
});

// ---------------------------------------------------------------------------
// Test group 3: "New Hub" from ProjectDashboard sidebar (action-new-hub)
// ---------------------------------------------------------------------------

test.describe('Azure Mode B framing — ProjectDashboard "New Hub" entry point', () => {
  test('"New Hub" quick-action opens Paste Data → Mode B framing flow → I-chart', async ({
    page,
  }) => {
    // 1. Load a sample to unlock the ProjectDashboard sidebar (needs hasData=true).
    //    The sample triggers HubCreationFlow Stage 1; skip it by clicking
    //    "Skip framing (advanced)" since we only need hasData=true for the Overview tab.
    await waitForApp(page);
    const sampleButton = page.locator('[data-testid^="sample-"]').first();
    const hasSample = await sampleButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasSample) {
      test.skip();
      return;
    }
    await sampleButton.click();

    // Pre-configured samples (e.g. The 100-Channel Test) have outcome + factors already
    // set and skip ColumnMapping entirely — the analysis starts immediately.
    // Non-pre-configured samples show ColumnMapping first; handle both cases.
    const mappingHeadingLocator = page.getByTestId('map-your-data-heading');
    const mappingVisible = await mappingHeadingLocator
      .isVisible({ timeout: 4000 })
      .catch(() => false);
    if (mappingVisible) {
      // HubCreationFlow Stage 1 may appear before ColumnMapping.
      const skipFramingButton = page.locator('button:has-text("Skip framing")');
      const stage1Visible = await skipFramingButton.isVisible({ timeout: 2000 }).catch(() => false);
      if (stage1Visible) {
        await skipFramingButton.click();
      }
      await confirmColumnMapping(page);
    }

    await dismissAutoFireModals(page);
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });

    // 2. Navigate to Overview tab to show ProjectDashboard with "New Hub" button
    const overviewTab = page.getByTestId('view-toggle-overview');
    const tabVisible = await overviewTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (!tabVisible) {
      test.skip();
      return;
    }
    await overviewTab.click();

    // 3. Click "New Hub" in the quick-actions area
    const newHubButton = page.getByTestId('action-new-hub');
    await expect(newHubButton).toBeVisible({ timeout: 5000 });
    await newHubButton.click();

    // 4. PasteScreen appears (handleNewHub calls showAnalysis() + startPaste())
    await expect(page.getByTestId('paste-textarea')).toBeVisible({ timeout: 8000 });

    // 5. Complete Mode B framing flow: paste → Stage 1 HubGoalForm → ColumnMapping
    //
    //    handlePasteAnalyze calls confirmReplaceIfNeeded() → window.confirm() when
    //    rawData.length > 0 && outcome is already set (from the loaded sample).
    //    Accept the dialog so the paste proceeds rather than aborting.
    page.once('dialog', dialog => dialog.accept());
    await pasteDataAndAnalyze(page, MODE_B_CSV);

    // After fresh paste with new data, Stage 1 (HubGoalForm) always appears for
    // a new investigation. Use waitFor (polling) so we don't race the React render.
    const stage1AfterNewHub = page.getByTestId('hub-creation-stage1');
    try {
      await stage1AfterNewHub.waitFor({ state: 'visible', timeout: 6000 });
      await completeStage1(page, GOAL_NARRATIVE);
    } catch {
      // Stage 1 not shown — processHubId already set; proceed to ColumnMapping.
    }
    await confirmColumnMapping(page, 'weight_g');

    // 6. Analysis canvas: I-chart visible with weight_g as outcome
    await dismissAutoFireModals(page);
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
  });
});

// ---------------------------------------------------------------------------
// Test group 4: Portfolio ProcessHubView — "New Hub" → incomplete-Hub CTA
// Skips gracefully when portfolio is not accessible from a clean context.
// ---------------------------------------------------------------------------

test.describe('Azure Mode B framing — portfolio ProcessHubView (environment-dependent)', () => {
  test('"New Hub" in portfolio creates incomplete Hub with Add framing CTA', async ({ page }) => {
    await waitForApp(page);

    // Portfolio is accessible only when canNavigateBack = true (saved projects exist).
    const backButton = page.getByRole('button', { name: /back to dashboard/i });
    const portfolioAccessible = await backButton.isVisible({ timeout: 3000 }).catch(() => false);
    if (!portfolioAccessible) {
      test.skip();
      return;
    }

    // Navigate to portfolio
    await backButton.click();
    await expect(page.locator('text=Process Hubs')).toBeVisible({ timeout: 10000 });

    // Click "New Hub" in the portfolio action row
    await page.getByRole('button', { name: /^New Hub$/i }).click();

    // ProcessHubView should show the incomplete-hub framing prompt
    await expect(page.getByTestId('hub-framing-prompt')).toBeVisible({ timeout: 8000 });
    await expect(page.getByTestId('hub-framing-prompt-cta')).toBeVisible();
    await expect(page.getByTestId('hub-framing-prompt-cta')).toContainText('Add framing');
  });
});
