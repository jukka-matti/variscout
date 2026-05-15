import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dirname = path.dirname(fileURLToPath(import.meta.url));

test('Home pick IP, chip persists across tabs, Exit IP clears chip', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('home-paste-button')).toBeVisible({ timeout: 10000 });

  const fixturePath = path.join(dirname, 'fixtures', 'active-ip-hub.vrs');
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByTestId('vrs-import-button').click(),
  ]);
  await fileChooser.setFiles(fixturePath);

  await expect(page.getByTestId('goal-banner')).toBeVisible({ timeout: 10000 });
  await page.getByTestId('phase-tab-home').click();
  await expect(page.getByText('Active Improvement Project')).toBeVisible();

  await page.getByRole('button', { name: /switch ip/i }).click();
  await page.getByRole('button', { name: /fill cpk lift/i }).click();

  const chip = page.getByTestId('ip-context-chip');
  await expect(chip).toContainText('Working in IP:');
  await expect(chip).toContainText('Fill Cpk lift');

  await page.getByTestId('phase-tab-analysis').click();
  await expect(chip).toContainText('Fill Cpk lift');
  await expect(page.getByTestId('active-ip-scope-ribbon')).toContainText(
    'Analyze scoped to Fill Cpk lift'
  );
  await expect(page.getByTestId('active-ip-scope-ribbon')).toContainText('Factor: shift');

  await page.getByTestId('phase-tab-investigation').click();
  await expect(chip).toContainText('Fill Cpk lift');
  await expect(page.getByTestId('active-ip-scope-ribbon')).toContainText(
    'Investigation scoped to Fill Cpk lift'
  );

  await page.getByTestId('phase-tab-report').click();
  const reportChip = page.getByTestId('ip-context-chip').last();
  await expect(reportChip).toContainText('Fill Cpk lift');
  await expect(page.getByTestId('active-ip-scope-ribbon')).toContainText(
    'Report scoped to Fill Cpk lift'
  );

  await reportChip.getByRole('button', { name: 'Exit IP' }).click();
  await expect(chip).toHaveCount(0);
  await expect(page.getByTestId('active-ip-scope-ribbon')).toHaveCount(0);
});
