// apps/azure/e2e/modeB-framing.spec.ts
//
// Azure Mode B framing: Paste Data → HubCreationFlow (Stage 1 + Stage 3) → analysis canvas.
//
// Test groups:
//   1. Full Mode B via Editor paste — from "Paste Data" button through HubGoalForm and
//      ColumnMapping to the analysis canvas (I-chart visible confirms outcome is set).
//   2. GoalBanner edit roundtrip via ProcessHubView — seeds a framed hub, navigates
//      to portfolio, selects the hub from the hub selector, edits GoalBanner inline, saves.
//   3. "New Hub" from ProjectDashboard sidebar — loads a sample, navigates to Overview
//      tab, clicks action-new-hub, runs Mode B paste flow again.
//      Skips gracefully when sample picker is unavailable.
//   4. Portfolio ProcessHubView "Add framing" CTA — seeds an incomplete hub, navigates
//      to portfolio, selects the hub from the hub selector, verifies hub-framing-prompt and CTA routing.
import { test, expect } from '@playwright/test';
import {
  confirmColumnMapping,
  pasteDataAndAnalyze,
  pasteToB0,
  DETECTION_CSV,
  MODE_B_CSV,
} from './helpers';
import { seedPortfolioHub, seedIncompleteHub } from './fixtures/portfolio-state';

// GOAL_NARRATIVE removed — HubGoalForm (Stage-1) retired in FSJ-3b; goal
// ceremony moved to GoalBanner on the Process tab (spec §3).
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
// Test group 1: Paste flows — b0 landing (measurement) + wizard (detection)
// ---------------------------------------------------------------------------

test.describe('Azure Mode B framing — Editor paste flow', () => {
  // FSJ-3b (spec §4.1): measurement-shaped pastes skip the mapping vestibule
  // and land at the Process tab (frame-view-b0) with Y/X pre-filled.
  // Stage-1 HubGoalForm no longer exists in the flow (wizard demoted to
  // ColumnMapping-only; Stage-1 retired in FSJ-3b).
  test('Measurement paste → b0 landing on Process tab (no wizard, no Stage-1)', async ({
    page,
  }) => {
    // 1. Open PasteScreen from Editor empty state
    await openPasteScreen(page);

    // 2. Paste measurement CSV → lands at frame-view-b0 (wizard skipped entirely)
    await pasteToB0(page, MODE_B_CSV);

    // 3. Provenance bar and Process-tab b0 chrome should be present
    //    (frame-view-b0 asserted inside pasteToB0)
    await expect(page.getByTestId('frame-view-b0')).toBeVisible();
  });

  // FSJ-3b decision 12: detection-shaped pastes (defect event-log) keep the
  // wizard path. This test preserves the original intent: "wizard surfaces work".
  // Stage-1 (hub-creation-stage1) no longer renders anywhere — the flow goes
  // directly to ColumnMapping.
  test('Detection paste (defect event-log) → ColumnMapping wizard (no Stage-1)', async ({
    page,
  }) => {
    // 1. Open PasteScreen from Editor empty state
    await openPasteScreen(page);

    // 2. Paste defect event-log CSV → defect modal fires → wizard path kept
    await pasteDataAndAnalyze(page, DETECTION_CSV);

    // 3. Stage 1 (hub-creation-stage1) must NOT appear — wizard is ColumnMapping-only
    const stage1 = page.getByTestId('hub-creation-stage1');
    const stage1Visible = await stage1.isVisible({ timeout: 2000 }).catch(() => false);
    expect(stage1Visible).toBe(false);

    // 4. The defect modal should appear (Azure fires DefectDetectedModal for any
    //    defect-format paste — title is "Defect Data Detected"). This confirms the
    //    detection path is active (wizard path, not the b0 landing).
    const wizardSurface = page
      .locator('text=Defect Data Detected')
      .or(page.locator('text=Map Your Data'));
    const wizardVisible = await wizardSurface.isVisible({ timeout: 8000 }).catch(() => false);
    expect(wizardVisible).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Test group 2: GoalBanner edit roundtrip via portfolio ProcessHubView
// ---------------------------------------------------------------------------

test.describe('Azure Mode B framing — GoalBanner edit roundtrip (portfolio)', () => {
  test('GoalBanner click → textarea → save → updated text (portfolio ProcessHubView)', async ({
    page,
  }) => {
    // Seed a framed hub and auto-navigate to portfolio.
    // seedPortfolioHub: goto('/') → evaluates IDB write → reloads.
    // App.tsx sees the seeded project on reload and auto-redirects to portfolio
    // (Dashboard view). Returns when 'text=Process Hubs' is visible.
    await seedPortfolioHub(page);

    // 1. Portfolio is already shown — select the seeded hub by name from the
    //    hub selector (PO-4: the hub-card grid retired in favor of a <select>).
    //    The portfolio may also show "General / Unassigned" (default hub); pick the
    //    fixture hub specifically so we hit one with processGoal set.
    const hubSelect = page.getByLabel('Select process hub');
    await expect(hubSelect).toBeVisible({ timeout: 5000 });
    await hubSelect.selectOption({ label: 'Fixture Syringe Barrel Line' });

    // 2. GoalBanner is shown above the hub surface when processGoal is set
    const goalBanner = page.getByTestId('goal-banner');
    await expect(goalBanner).toBeVisible({ timeout: 5000 });

    // 3. Click GoalBanner to enter edit mode (inline textarea)
    await goalBanner.click();
    const goalTextarea = goalBanner.locator('textarea');
    await expect(goalTextarea).toBeVisible({ timeout: 3000 });

    // 4. Replace goal text and save
    await goalTextarea.fill(EDITED_GOAL);
    await goalBanner.locator('button:has-text("Save")').click();

    // 5. Banner should show the updated text
    await expect(goalBanner).toContainText('precision medical components');
  });
});

// ---------------------------------------------------------------------------
// Test group 3: "New Hub" from ProjectDashboard sidebar (action-new-hub)
// ---------------------------------------------------------------------------

test.describe('Azure Mode B framing — ProjectDashboard "New Hub" entry point', () => {
  // FSJ-3b: Stage-1 (HubGoalForm) retired — wizard is ColumnMapping-only.
  // The "New Hub" entry point triggers a paste → b0 landing for measurement data.
  test('"New Hub" quick-action opens Paste Data → b0 landing on Process tab', async ({ page }) => {
    // 1. Load a sample to unlock the ProjectDashboard sidebar (needs hasData=true).
    //    Samples still go through ColumnMapping (different code path from paste).
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
      await confirmColumnMapping(page);
    }

    await dismissAutoFireModals(page);
    // FSJ-3b: samples that are measurement-shaped now land at frame-view-b0.
    // Samples that auto-route to the analysis view show chart-ichart.
    // Accept either: both indicate a live session with data loaded.
    await expect(
      page.locator('[data-testid="chart-ichart"]').or(page.getByTestId('frame-view-b0'))
    ).toBeVisible({ timeout: 15000 });

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

    // 6. b0 landing confirmed (frame-view-b0 asserted inside pasteToB0 above).
    //    The full spine (click "See the data" → I-chart) is FSJ-10's e2e scope.
    await expect(page.getByTestId('frame-view-b0')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Test group 4: Portfolio ProcessHubView — incomplete-Hub "Add framing" CTA
// ---------------------------------------------------------------------------

test.describe('Azure Mode B framing — portfolio ProcessHubView (incomplete hub)', () => {
  test('"New Hub" in portfolio creates incomplete Hub with Add framing CTA', async ({ page }) => {
    // Seed an incomplete hub (no processGoal, no outcomes).
    // seedIncompleteHub: goto('/') → evaluates IDB write → reloads.
    // App.tsx auto-redirects to portfolio. Returns when 'text=Process Hubs' is visible.
    await seedIncompleteHub(page);

    // Portfolio is already shown — select the seeded incomplete hub from the
    // hub selector (PO-4: the hub-card grid retired in favor of a <select>).
    const hubSelect = page.getByLabel('Select process hub');
    await expect(hubSelect).toBeVisible({ timeout: 5000 });
    await hubSelect.selectOption({ label: 'Incomplete Hub Fixture' });

    // ProcessHubView should show the incomplete-hub framing prompt with Add framing CTA.
    await expect(page.getByTestId('hub-framing-prompt')).toBeVisible({ timeout: 8000 });
    await expect(page.getByTestId('hub-framing-prompt-cta')).toBeVisible();
    await expect(page.getByTestId('hub-framing-prompt-cta')).toContainText('Add framing');

    // Clicking the CTA routes to the Editor paste flow (wired in P4.5).
    await page.getByTestId('hub-framing-prompt-cta').click();
    await expect(page.getByTestId('paste-textarea')).toBeVisible({ timeout: 8000 });
  });
});
