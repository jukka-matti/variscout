// apps/pwa/e2e/modeB.e2e.spec.ts
//
// Framing layer Mode B (PWA): paste → goal narrative → outcome confirm → canvas first paint.
//
// Three tests:
//   1. Full Mode B happy path + Save-to-browser + Mode A.1 reload restoration.
//   2. Cryptic (all-text) column names → OutcomeNoMatchBanner surfaces.
//   3. .vrs Import on HomeScreen → Hub + data restored (GoalBanner + OutcomePin visible).
import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Shared CSV payloads
// ---------------------------------------------------------------------------

/** 10-row syringe-barrel CSV — numeric outcome, two categoricals, one ID column */
const SYRINGE_CSV = [
  'weight_g,product,shift,batch_id',
  '4.5,A,morning,B1',
  '4.4,A,morning,B1',
  '4.6,B,evening,B2',
  '4.5,B,evening,B2',
  '4.4,A,morning,B3',
  '4.5,A,morning,B3',
  '4.6,B,evening,B4',
  '4.3,A,morning,B4',
  '4.7,B,evening,B5',
  '4.5,A,morning,B5',
].join('\n');

/**
 * All-categorical CSV — no numeric columns.
 * All candidates score below the 0.1 noMatchThreshold in buildOutcomeCandidates
 * (non-numeric columns default to 0.05) → OutcomeNoMatchBanner should surface.
 */
const ALL_TEXT_CSV = [
  'category,label,code',
  'apple,red,A1',
  'banana,yellow,B2',
  'cherry,red,C3',
  'date,brown,D4',
  'elderberry,dark,E5',
].join('\n');

const GOAL_NARRATIVE =
  'We mold syringe barrels for medical customers. Weight in grams matters most.';

// ---------------------------------------------------------------------------
// Helper: navigate to PasteScreen from HomeScreen
// ---------------------------------------------------------------------------
async function openPasteScreen(page: import('@playwright/test').Page) {
  await page.goto('/');
  // Wait for HomeScreen
  await expect(page.getByTestId('home-paste-button')).toBeVisible({ timeout: 10000 });
  await page.getByTestId('home-paste-button').click();
  // PasteScreen
  await expect(page.getByTestId('paste-textarea')).toBeVisible({ timeout: 5000 });
}

// ---------------------------------------------------------------------------
// Test 1: Full Mode B happy path
// ---------------------------------------------------------------------------

test.describe('Framing layer Mode B (PWA) — happy path', () => {
  test('paste → goal narrative → outcome confirm → GoalBanner + OutcomePin + Save chip visible', async ({
    page,
  }) => {
    // 1. Open PWA
    await openPasteScreen(page);

    // 2. Paste CSV data
    await page.getByTestId('paste-textarea').fill(SYRINGE_CSV);
    await page.getByTestId('paste-start-analysis').click();

    // 3. Stage 1: HubGoalForm is shown before ColumnMapping
    await expect(page.getByTestId('hub-goal-form')).toBeVisible({ timeout: 8000 });
    await page.getByRole('textbox', { name: /process goal/i }).fill(GOAL_NARRATIVE);
    // Click Continue →
    await page.getByRole('button', { name: /Continue/i }).click();

    // 4. Stage 3: ColumnMapping appears (Map Your Data heading)
    await expect(page.getByTestId('map-your-data-heading')).toBeVisible({ timeout: 8000 });

    // weight_g should be a candidate in the list
    await expect(page.getByTestId('outcome-candidate-list')).toBeVisible({ timeout: 5000 });
    const weightRadio = page
      .getByTestId('outcome-candidate-list')
      .locator('input[type="radio"][aria-label="weight_g"]');
    await expect(weightRadio).toBeVisible({ timeout: 5000 });

    // Select weight_g if not already checked
    const alreadyChecked = await weightRadio.isChecked().catch(() => false);
    if (!alreadyChecked) {
      await weightRadio.click();
    }

    // Confirm — click "Start Analysis"
    await page.locator('button:has-text("Start Analysis")').first().click();

    // 5. Workspace assertions: GoalBanner + OutcomePin + framing toolbar
    await expect(page.getByTestId('goal-banner')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('goal-banner')).toContainText('We mold syringe barrels');

    await expect(page.getByTestId('outcome-pin').first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByTestId('outcome-pin').first()).toContainText('weight_g');

    // framing toolbar is visible (contains Save + Export + Edit framing)
    await expect(page.getByTestId('framing-toolbar')).toBeVisible({ timeout: 5000 });

    // Save-to-browser button visible (not yet opted in)
    await expect(page.getByTestId('save-to-browser-button')).toBeVisible({ timeout: 5000 });
  });

  test('Save to browser → opt-in → reload → Mode A.1 restores GoalBanner', async ({ page }) => {
    // 1. Open PWA and perform the full Mode B flow
    await openPasteScreen(page);
    await page.getByTestId('paste-textarea').fill(SYRINGE_CSV);
    await page.getByTestId('paste-start-analysis').click();
    await expect(page.getByTestId('hub-goal-form')).toBeVisible({ timeout: 8000 });
    await page.getByRole('textbox', { name: /process goal/i }).fill(GOAL_NARRATIVE);
    await page.getByRole('button', { name: /Continue/i }).click();
    await expect(page.getByTestId('map-your-data-heading')).toBeVisible({ timeout: 8000 });
    await page.locator('button:has-text("Start Analysis")').first().click();
    await expect(page.getByTestId('goal-banner')).toBeVisible({ timeout: 10000 });

    // 2. Click Save to browser
    await expect(page.getByTestId('save-to-browser-button')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('save-to-browser-button').click();
    // Button should change to the "Saved · Forget" variant
    await expect(page.getByTestId('save-to-browser-saved')).toBeVisible({ timeout: 5000 });

    // 3. Reload — Mode A.1 restoration: Hub (processGoal) is restored from IndexedDB.
    //    Raw data is NOT restored (session-only); the GoalBanner still shows above HomeScreen.
    await page.reload();
    await page.waitForLoadState('networkidle');

    // GoalBanner still shows the goal (Hub restored from IndexedDB)
    await expect(page.getByTestId('goal-banner')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('goal-banner')).toContainText('We mold syringe barrels');

    // HomeScreen is shown (no data loaded yet)
    await expect(page.getByTestId('home-paste-button')).toBeVisible({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// Test 2: Cryptic column names → OutcomeNoMatchBanner
// ---------------------------------------------------------------------------

test.describe('Framing layer Mode B (PWA) — cryptic column names', () => {
  test('all-text columns + vague goal → OutcomeNoMatchBanner surfaces', async ({ page }) => {
    await openPasteScreen(page);

    // Paste all-categorical CSV (no numeric columns → all candidates score 0.05 < 0.1 threshold)
    await page.getByTestId('paste-textarea').fill(ALL_TEXT_CSV);
    await page.getByTestId('paste-start-analysis').click();

    // Stage 1: HubGoalForm
    await expect(page.getByTestId('hub-goal-form')).toBeVisible({ timeout: 8000 });
    await page.getByRole('textbox', { name: /process goal/i }).fill('We make widgets.');
    await page.getByRole('button', { name: /Continue/i }).click();

    // Stage 3: ColumnMapping
    await expect(page.getByTestId('map-your-data-heading')).toBeVisible({ timeout: 8000 });

    // OutcomeNoMatchBanner should be visible (role=alert, text starts with "⚠ No clear outcome match")
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('alert')).toContainText('No clear outcome match');
  });
});

// ---------------------------------------------------------------------------
// Test 3: .vrs Import on HomeScreen → GoalBanner + OutcomePin
// ---------------------------------------------------------------------------

test.describe('Framing layer Mode B (PWA) — .vrs Import', () => {
  test('import .vrs fixture → Hub goal and outcome pin visible on canvas', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('home-paste-button')).toBeVisible({ timeout: 10000 });

    // The VrsImportButton is rendered on HomeScreen when onImportVrs is wired.
    // Use Playwright's file chooser API to upload the fixture.
    const fixturePath = path.join(__dirname, 'fixtures', 'sample-hub.vrs');

    // Click the "Choose .vrs file" button and intercept the file dialog
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByTestId('vrs-import-button').click(),
    ]);
    await fileChooser.setFiles(fixturePath);

    // After import, the app skips framing and goes straight to canvas with Hub state.
    // GoalBanner should contain the fixture's processGoal.
    await expect(page.getByTestId('goal-banner')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('goal-banner')).toContainText('We mold syringe barrels');

    // OutcomePin for weight_g should be visible (rawData was also restored from the fixture)
    await expect(page.getByTestId('outcome-pin').first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByTestId('outcome-pin').first()).toContainText('weight_g');
  });
});
