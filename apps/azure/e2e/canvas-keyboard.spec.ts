import { expect, test } from '@playwright/test';
import { pasteToB0 } from './helpers';

const CANVAS_CSV = [
  'weight_g,bake_time,machine,timestamp',
  '4.5,30,A,2026-05-01T08:00:00.000Z',
  '4.4,31,A,2026-05-01T08:01:00.000Z',
  '4.6,29,B,2026-05-01T08:02:00.000Z',
  '4.5,32,B,2026-05-01T08:03:00.000Z',
  '4.4,28,A,2026-05-01T08:04:00.000Z',
].join('\n');

async function openPasteScreen(page: import('@playwright/test').Page) {
  await page.goto('/');
  await expect(
    page
      .locator('text=Start Your Analysis')
      .or(page.locator('[data-testid="chart-ichart"]'))
      .or(page.locator('[data-testid="project-dashboard"]'))
  ).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'Paste Data' }).first().click();
  await expect(page.getByTestId('paste-textarea')).toBeVisible({ timeout: 8000 });
}

// FSJ-3b (spec §4.1): measurement pastes skip the mapping vestibule and land at
// frame-view-b0. The ProcessStepsExpander (with chip-rail) is part of the b0
// view — no need to navigate away from the Process tab.
async function completeModeBToCanvas(page: import('@playwright/test').Page) {
  await openPasteScreen(page);
  // pasteToB0 fills + submits CANVAS_CSV and asserts frame-view-b0 is visible.
  await pasteToB0(page, CANVAS_CSV);

  await expect(page.getByTestId('process-steps-expander-header')).toBeVisible({ timeout: 15000 });
  await page.getByTestId('process-steps-expander-header').click();
  await expect(page.getByTestId('chip-rail')).toBeVisible({ timeout: 5000 });
}

test.describe('Canvas keyboard authoring (Azure)', () => {
  test('keyboard chip placement, undo, and E mode toggle', async ({ page }) => {
    await completeModeBToCanvas(page);

    await page
      .getByRole('button', { name: /add step/i })
      .first()
      .click();
    const step = page.locator('[data-testid^="process-map-step-"]').first();
    await expect(step).toBeVisible({ timeout: 5000 });

    const chip = page.getByTestId('chip-rail-item-bake_time');
    await chip.focus();
    await page.keyboard.press('Enter');
    await step.focus();
    await page.keyboard.press('Enter');

    await expect(page.getByTestId('chip-rail-item-bake_time')).toBeHidden({ timeout: 5000 });

    await page.keyboard.press('ControlOrMeta+Z');
    await expect(page.getByTestId('chip-rail-item-bake_time')).toBeVisible({ timeout: 5000 });

    await page.keyboard.press('E');
    await expect(page.getByTestId('chip-rail')).toBeHidden({ timeout: 5000 });
    await page.keyboard.press('E');
    await expect(page.getByTestId('chip-rail')).toBeVisible({ timeout: 5000 });
  });
});
