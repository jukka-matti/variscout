// apps/pwa/e2e/modeB.e2e.spec.ts
//
// Framing layer Mode B (PWA): paste → b0 landing journey (FSJ-2).
//
// Three describe blocks:
//   1. Full Mode B happy path: measurement-shaped paste lands at b0 directly.
//   2. Multi-outcome confirm path: "+ track another outcome" opens ColumnMapping wizard.
//   3. Cryptic (all-categorical) column names: wizard auto-surfaces, cancel keeps data,
//      OutcomeNoMatchBanner surfaces inside the ColumnMapping wizard.
//   4. .vrs Import: HomeScreen → Hub + data restored (GoalBanner + OutcomePin visible).
import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Shared CSV payloads
// ---------------------------------------------------------------------------

/** 10-row syringe-barrel CSV — numeric outcome, two categoricals, one ID column.
 *  Measurement-shaped: numeric Y (weight_g) inferable, not defect/wide-shaped,
 *  detection confidence ≠ 'low' → skips wizard, lands at b0 picker directly. */
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
 * (non-numeric columns default to 0.05) → detection confidence is 'low' →
 * ColumnMapping wizard auto-surfaces; OutcomeNoMatchBanner appears inside wizard.
 */
const ALL_TEXT_CSV = [
  'category,label,code',
  'apple,red,A1',
  'banana,yellow,B2',
  'cherry,red,C3',
  'date,brown,D4',
  'elderberry,dark,E5',
].join('\n');

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
// Test 1: Full Mode B happy path — measurement-shaped paste → b0 landing
// ---------------------------------------------------------------------------

test.describe('Framing layer Mode B (PWA) — happy path', () => {
  test('paste → b0 landing → Y pre-selected → See the data → framing-toolbar + .vrs export visible', async ({
    page,
  }) => {
    // 1. Open PWA
    await openPasteScreen(page);

    // 2. Paste measurement-shaped CSV (numeric Y, high-confidence inference)
    await page.getByTestId('paste-textarea').fill(SYRINGE_CSV);
    await page.getByTestId('paste-start-analysis').click();

    // 3. FSJ-2: measurement-shaped paste skips goal form AND ColumnMapping wizard.
    //    Lands directly at the b0 picker on the Process tab.
    await expect(page.getByTestId('frame-view-b0')).toBeVisible({ timeout: 10000 });

    // 4. Provenance top bar is present (filename · rows · columns).
    await expect(page.getByTestId('b0-provenance')).toBeVisible({ timeout: 5000 });

    // 5. Pre-selected Y chip: weight_g was auto-detected. A column-candidate-chip
    //    with name "weight_g" should be visible (the selected chip renders inside YPickerSection).
    await expect(
      page.getByTestId('frame-view-b0').getByTestId('column-candidate-chip').first()
    ).toBeVisible({ timeout: 5000 });

    // 6. "See the data →" CTA is enabled and clickable (Y was pre-selected).
    const seeCta = page.getByTestId('see-the-data-cta');
    await expect(seeCta).toBeVisible({ timeout: 5000 });
    await expect(seeCta).not.toBeDisabled();
    await seeCta.click();

    // 7. After CTA click we land on Explore (analysisScope seeded with Y).
    //    The framing-toolbar with OutcomePin and .vrs export should now be visible
    //    (rawData > 0 + sessionHub + not in paste/mapping mode).
    await expect(page.getByTestId('framing-toolbar')).toBeVisible({ timeout: 10000 });

    // 8. No browser-save affordances (PWA is export-only per R6d).
    await expect(page.getByTestId('save-to-browser-button')).toHaveCount(0);
    await expect(page.getByTestId('save-to-browser-saved')).toHaveCount(0);

    // 9. .vrs export button is present (export-only durability path).
    await expect(page.getByRole('button', { name: /export.*\.vrs/i })).toBeVisible({
      timeout: 5000,
    });
  });

  test('reload without .vrs import returns to HomeScreen without startup hydration', async ({
    page,
  }) => {
    // 1. Land on b0 via measurement-shaped paste
    await openPasteScreen(page);
    await page.getByTestId('paste-textarea').fill(SYRINGE_CSV);
    await page.getByTestId('paste-start-analysis').click();
    await expect(page.getByTestId('frame-view-b0')).toBeVisible({ timeout: 10000 });

    // Navigate to Explore via the CTA so we leave b0
    await page.getByTestId('see-the-data-cta').click();
    await expect(page.getByTestId('framing-toolbar')).toBeVisible({ timeout: 10000 });

    // 2. Reload — PWA startup is export-only; no browser snapshot hydrates.
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 3. After reload: no framing toolbar, no b0 — back to HomeScreen.
    await expect(page.getByTestId('framing-toolbar')).toHaveCount(0);
    await expect(page.getByTestId('home-paste-button')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('vrs-import-button')).toBeVisible({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// Test: Multi-outcome confirm path
// FSJ-2: b0 lands with pre-selected Y → "+ track another outcome" opens
// ColumnMapping in re-edit mode → select 2 outcomes → confirm → 2 OutcomePins.
// ---------------------------------------------------------------------------

const TWO_OUTCOME_CSV = [
  'weight_g,length_mm,product,shift',
  '4.5,12.1,A,morning',
  '4.4,11.9,A,morning',
  '4.6,12.3,B,evening',
  '4.5,12.0,B,evening',
  '4.4,11.8,A,morning',
].join('\n');

test.describe('Framing layer Mode B (PWA) — multi-outcome confirm', () => {
  test('paste → b0 → track another outcome → ColumnMapping → 2 checkboxes → 2 OutcomePins', async ({
    page,
  }) => {
    await openPasteScreen(page);

    await page.getByTestId('paste-textarea').fill(TWO_OUTCOME_CSV);
    await page.getByTestId('paste-start-analysis').click();

    // Land at b0 (measurement-shaped — two numeric columns inferable)
    await expect(page.getByTestId('frame-view-b0')).toBeVisible({ timeout: 10000 });

    // Click "+ track another outcome" hatch → opens ColumnMapping in re-edit mode
    await expect(page.getByTestId('b0-track-another-outcome')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('b0-track-another-outcome').click();

    // ColumnMapping (re-edit mode) surfaces
    await expect(page.getByTestId('map-your-data-heading')).toBeVisible({ timeout: 8000 });
    await expect(page.getByTestId('outcome-candidate-list')).toBeVisible({ timeout: 5000 });

    // Select weight_g checkbox
    const weightCheckbox = page
      .getByTestId('outcome-candidate-list')
      .locator('input[type="checkbox"][aria-label="weight_g"]');
    const weightChecked = await weightCheckbox.isChecked().catch(() => false);
    if (!weightChecked) {
      await weightCheckbox.click();
    }

    // Select length_mm checkbox
    const lengthCheckbox = page
      .getByTestId('outcome-candidate-list')
      .locator('input[type="checkbox"][aria-label="length_mm"]');
    await expect(lengthCheckbox).toBeVisible({ timeout: 5000 });
    const lengthChecked = await lengthCheckbox.isChecked().catch(() => false);
    if (!lengthChecked) {
      await lengthCheckbox.click();
    }

    // Confirm — start analysis / apply changes
    await page
      .locator('button:has-text("Start Analysis"), button:has-text("Apply Changes")')
      .first()
      .click();

    // Close the StageFive modal if it appears (it may prompt for hypothesis after mapping)
    const stageFiveSkip = page.getByTestId('stage-five-skip');
    if (await stageFiveSkip.isVisible({ timeout: 3000 }).catch(() => false)) {
      await stageFiveSkip.click();
    }

    // Workspace framing-toolbar should show 2 OutcomePins
    await expect(page.getByTestId('framing-toolbar')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('outcome-pin')).toHaveCount(2, { timeout: 10000 });
  });
});

// ---------------------------------------------------------------------------
// Test: Cryptic (all-categorical) column names → wizard auto-surfaces
// ---------------------------------------------------------------------------
// All-categorical data has detection confidence 'low' (no numeric Y inferable)
// → ColumnMapping wizard auto-surfaces (not skipped to b0).
// Intent: verify (a) OutcomeNoMatchBanner appears inside the wizard,
//          (b) cancelling the wizard keeps data (no return to empty home screen),
//          (c) Skip outcome → Start Analysis disabled.
// ---------------------------------------------------------------------------

test.describe('Framing layer Mode B (PWA) — cryptic column names (all-categorical)', () => {
  test('all-categorical paste → wizard auto-surfaces → OutcomeNoMatchBanner visible', async ({
    page,
  }) => {
    await openPasteScreen(page);

    // Paste all-categorical CSV (no numeric columns → confidence 'low' → wizard path)
    await page.getByTestId('paste-textarea').fill(ALL_TEXT_CSV);
    await page.getByTestId('paste-start-analysis').click();

    // Stage 1 (goal form) is gone. ColumnMapping wizard auto-surfaces directly.
    await expect(page.getByTestId('map-your-data-heading')).toBeVisible({ timeout: 8000 });

    // OutcomeNoMatchBanner should be visible inside the ColumnMapping wizard
    // (role=alert, text starts with "No clear outcome match")
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('alert')).toContainText('No clear outcome match');
  });

  test('cancel wizard → data survives (no return to empty home screen)', async ({ page }) => {
    await openPasteScreen(page);

    await page.getByTestId('paste-textarea').fill(ALL_TEXT_CSV);
    await page.getByTestId('paste-start-analysis').click();

    // Wizard auto-surfaces
    await expect(page.getByTestId('map-your-data-heading')).toBeVisible({ timeout: 8000 });

    // Cancel (Back button in ColumnMapping footer)
    await page.getByRole('button', { name: /back/i }).click();

    // Assert: we did NOT return to the empty home screen.
    // The home-paste-button only renders on HomeScreen; its absence proves data survived.
    await expect(page.getByTestId('home-paste-button')).toHaveCount(0, { timeout: 3000 });
  });

  test('OutcomeNoMatchBanner Skip → Start Analysis disabled (no outcome selected)', async ({
    page,
  }) => {
    await openPasteScreen(page);

    await page.getByTestId('paste-textarea').fill(ALL_TEXT_CSV);
    await page.getByTestId('paste-start-analysis').click();

    // Wizard auto-surfaces — banner should appear
    await expect(page.getByTestId('map-your-data-heading')).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 8000 });

    // Click "Skip outcome" — clears all selected outcomes
    await page.getByRole('button', { name: /Skip outcome/i }).click();

    // Start Analysis should now be disabled (no outcome selected)
    const startBtn = page.locator('button:has-text("Start Analysis")').first();
    await expect(startBtn).toBeDisabled({ timeout: 3000 });
  });

  // ---------------------------------------------------------------------------
  // spec §4.1 no-Y floor journey: cancel wizard → navigate to Process tab
  //
  // Architecture note (T6 review fix): After all-categorical paste + wizard cancel,
  // rawData is set but NO active IP was created (landPasteOnProcess / showFrame are
  // never called for low-confidence pastes — the wizard path skips onFreshPasteLanded).
  // FrameView (apps/pwa/src/components/views/FrameView.tsx:504) guards with
  // `if (activeIP == null) return NoActiveProjectGuidance`. So Process tab shows
  // "No active project" (NoActiveProjectGuidance, role=alert), NOT frame-view-b0.
  //
  // The b0 no-Y floor (OutcomeNoMatchBanner at frame-view-b0) IS implemented
  // (FrameViewB0.tsx:176, noYBanner slot) and unit-tested in FrameView.b0.integration.test,
  // but is not reachable via a standard E2E paste flow because:
  //   - high-confidence paste → b0 WITH a detected numeric Y (yCandidates > 0 → no banner)
  //   - low-confidence paste → wizard (not b0)
  // The no-Y floor is a defensive guard for edge cases (e.g. data re-mapping leaving
  // Y empty), not a standard first-session path. Chrome walk (T7) verifies the b0
  // surface live, including the noYBanner via FrameView.b0.integration.test coverage.
  // ---------------------------------------------------------------------------
  test('cancel wizard → Process tab → NoActiveProjectGuidance (no active project, spec §4.1 boundary)', async ({
    page,
  }) => {
    await openPasteScreen(page);

    await page.getByTestId('paste-textarea').fill(ALL_TEXT_CSV);
    await page.getByTestId('paste-start-analysis').click();

    // Wizard auto-surfaces
    await expect(page.getByTestId('map-your-data-heading')).toBeVisible({ timeout: 8000 });

    // Cancel the wizard (data survives — proven by prior test)
    await page.getByRole('button', { name: /back/i }).click();

    // Navigate to Process tab (workflow-tab-process pattern per active-ip-cascade.spec)
    await page.getByTestId('workflow-tab-process').click();

    // No active IP was created (low-confidence paste skips onFreshPasteLanded).
    // FrameView renders NoActiveProjectGuidance — not frame-view-b0.
    // role=alert is used by NoActiveProjectGuidance (NoActiveProjectGuidance.tsx:34).
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('alert')).toContainText('No active project');

    // frame-view-b0 is NOT shown (no active project means no canvas rendering).
    await expect(page.getByTestId('frame-view-b0')).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// Test: .vrs Import on HomeScreen → GoalBanner + OutcomePin
// ---------------------------------------------------------------------------
// FSJ-1 landed .vrs import on Process tab (landVrsOnProcess → showFrame).
// The fixture carries processGoal + outcome → GoalBanner and OutcomePin render.
// ---------------------------------------------------------------------------

test.describe('Framing layer Mode B (PWA) — .vrs Import', () => {
  test('import .vrs fixture → Process tab (frame-view-b0) + GoalBanner + OutcomePin visible', async ({
    page,
  }) => {
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

    // FSJ-1: .vrs import lands on the Process tab (showFrame) — frame-view-b0 renders.
    // The fixture has outcome=weight_g + processGoal set → GoalBanner and OutcomePin visible.
    await expect(page.getByTestId('frame-view-b0')).toBeVisible({ timeout: 10000 });

    // GoalBanner should contain the fixture's processGoal.
    await expect(page.getByTestId('goal-banner')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('goal-banner')).toContainText('We mold syringe barrels');

    // OutcomePin for weight_g should be visible in the framing toolbar
    // (rawData was also restored from the fixture → sessionHub.outcomes is populated).
    await expect(page.getByTestId('outcome-pin').first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByTestId('outcome-pin').first()).toContainText('weight_g');
  });
});
