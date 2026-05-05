import { expect, test } from '@playwright/test';

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
  await expect(page.getByTestId('home-paste-button')).toBeVisible({ timeout: 10000 });
  await page.getByTestId('home-paste-button').click();
  await expect(page.getByTestId('paste-textarea')).toBeVisible({ timeout: 5000 });
}

async function completeModeBToCanvas(page: import('@playwright/test').Page) {
  await openPasteScreen(page);
  await page.getByTestId('paste-textarea').fill(CANVAS_CSV);
  await page.getByTestId('paste-start-analysis').click();

  await expect(page.getByTestId('hub-goal-form')).toBeVisible({ timeout: 8000 });
  await page.getByRole('textbox', { name: /process goal/i }).fill('Reduce weight variation.');
  await page.getByRole('button', { name: /Continue/i }).click();

  await expect(page.getByTestId('map-your-data-heading')).toBeVisible({ timeout: 8000 });
  const weightCheckbox = page
    .getByTestId('outcome-candidate-list')
    .locator('input[type="checkbox"][aria-label="weight_g"]');
  if (!(await weightCheckbox.isChecked().catch(() => false))) {
    await weightCheckbox.click();
  }
  await page.locator('button:has-text("Start Analysis")').first().click();

  await expect(page.getByTestId('process-steps-expander-header')).toBeVisible({ timeout: 10000 });
  await page.getByTestId('process-steps-expander-header').click();
  await expect(page.getByTestId('chip-rail')).toBeVisible({ timeout: 5000 });
}

test.describe('Canvas keyboard authoring (PWA)', () => {
  test('keyboard chip placement, undo, and E mode toggle', async ({ page }) => {
    await completeModeBToCanvas(page);

    await page
      .getByRole('button', { name: /add step/i })
      .first()
      .click();
    const step = page.locator('[data-testid^="process-map-step-"]').first();
    await expect(step).toBeVisible({ timeout: 5000 });

    const chip = page.getByTestId('chip-rail-item-bake_time');
    await expect(chip).toBeVisible({ timeout: 5000 });
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
