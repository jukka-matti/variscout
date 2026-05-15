import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dirname = path.dirname(fileURLToPath(import.meta.url));

test.describe.configure({ mode: 'serial' });

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
  await expect(page.getByText('Reporting on: Fill Cpk lift')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Overview' }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Executive summary' }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: "What's next" }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Technical' }).first().click();
  await expect(
    page.getByText(
      'Turtiainen 2019 / Watson lineage, NIST-validated OLS QR solver (ADR-067), three-boundary numeric safety (ADR-069), customer-owned data (ADR-059, ADR-078).'
    )
  ).toBeVisible();

  await reportChip.getByRole('button', { name: 'Exit IP' }).click();
  await expect(chip).toHaveCount(0);
  await expect(page.getByTestId('active-ip-scope-ribbon')).toHaveCount(0);
  await expect(page.getByText('Reporting on: Hub portfolio')).toBeVisible();
  await expect(page.getByText('Hub portfolio').first()).toBeVisible();
});

test('Projects detail shows team rail and supports invite happy path', async ({ page }) => {
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
  await page.getByRole('button', { name: /switch ip/i }).click();
  await page.getByRole('button', { name: /fill cpk lift/i }).click();

  await page.getByTestId('phase-tab-projects').click();
  await expect(page.getByRole('heading', { name: /fill cpk lift/i })).toBeVisible();

  const rail = page.getByRole('complementary', { name: 'Team workspace' }).first();
  await expect(rail).toBeVisible();
  await expect(rail.getByText(/team ·/i)).toBeVisible();
  await expect(rail.getByTestId('ip-activity-feed')).toBeVisible();
  await expect(rail.getByText('SIGNOFF')).toBeVisible();

  await page.getByRole('button', { name: /\+ invite/i }).click();
  const dialog = page.getByRole('dialog', { name: 'Invite team member' });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Name').fill('Riley Reviewer');
  await dialog.getByLabel('Email').fill('riley@example.com');
  await dialog.getByLabel('Role').selectOption('processOwner');
  await dialog.getByLabel('RACI assignment').selectOption('A');
  await dialog.getByRole('button', { name: 'Save invite' }).click();

  await expect(rail.getByText('Riley Reviewer')).toBeVisible();
  await expect(rail.getByText('Process owner')).toBeVisible();
});
