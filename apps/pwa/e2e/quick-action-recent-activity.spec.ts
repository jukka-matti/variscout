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

  await expect(page.getByTestId('stage-five-modal')).toBeVisible({ timeout: 10000 });
  await page.getByTestId('stage-five-skip').click();
  await expect(page.getByTestId('stage-five-modal')).toBeHidden({ timeout: 5000 });

  await expect(page.getByTestId('phase-tab-frame')).toBeVisible({ timeout: 10000 });
  await page.getByTestId('phase-tab-frame').click();
  await expect(page.getByTestId('process-steps-expander-header')).toBeVisible({ timeout: 10000 });
  await page.getByTestId('process-steps-expander-header').click();
  await expect(page.getByTestId('chip-rail')).toBeVisible({ timeout: 5000 });
}

test.describe('Quick action recent activity (PWA)', () => {
  test('logs a card Quick Action and shows it in Recent activity', async ({ page }) => {
    const actionText = 'Check oven gasket seating';

    await completeModeBToCanvas(page);

    await page
      .getByRole('button', { name: /add step/i })
      .first()
      .click();
    const processStep = page.locator('[data-testid^="process-map-step-"]').first();
    await expect(processStep).toBeVisible({ timeout: 5000 });

    const chip = page.getByTestId('chip-rail-item-bake_time');
    await expect(chip).toBeVisible({ timeout: 5000 });
    await chip.focus();
    await page.keyboard.press('Enter');
    await processStep.focus();
    await page.keyboard.press('Enter');

    const card = page.locator('[data-testid^="canvas-step-card-"]').first();
    await expect(card).toBeVisible({ timeout: 5000 });
    await card.click();

    await expect(page.getByTestId('canvas-step-overlay')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('canvas-cta-quick-action').click();

    const logActionDialog = page.getByRole('dialog', { name: /Log action/i });
    await expect(logActionDialog).toBeVisible({ timeout: 5000 });
    await logActionDialog.getByLabel('What').fill(actionText);
    await logActionDialog.getByRole('button', { name: 'Log action' }).click();

    await expect(page.getByRole('dialog', { name: /Log action/i })).toBeHidden({ timeout: 5000 });
    await page.getByText('Recent activity').click();
    await expect(page.getByText(actionText)).toBeVisible({ timeout: 5000 });
  });
});
