import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dirname = path.dirname(fileURLToPath(import.meta.url));

test.describe.configure({ mode: 'serial' });

test('attached Workspace Project persists across tabs without switch or exit controls', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('home-paste-button')).toBeVisible({ timeout: 10000 });

  const fixturePath = path.join(dirname, 'fixtures', 'workspace-project-hub.vrs');
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByTestId('vrs-import-button').click(),
  ]);
  await fileChooser.setFiles(fixturePath);

  await expect(page.getByTestId('goal-banner')).toBeVisible({ timeout: 10000 });
  await page.getByTestId('workflow-tab-home').click();
  await expect(page.getByText('Workspace').first()).toBeVisible();
  await expect(page.getByRole('button', { name: /switch workspace/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /exit workspace/i })).toHaveCount(0);

  const chip = page.getByTestId('workspace-project-chip');
  await expect(chip).toContainText('Workspace Project:');
  await expect(chip).toContainText('Fill Cpk lift');

  await page.getByTestId('workflow-tab-analyze').click();
  await expect(chip).toContainText('Fill Cpk lift');
  await expect(page.getByRole('region', { name: 'Overall problem' })).toContainText(
    'Fill Cpk lift'
  );
  // Tombstone: the ribbon was deleted in ER-1 — this guards against reintroduction, not tab behavior.
  await expect(page.getByTestId('workspace-project-scope-ribbon')).toHaveCount(0);
  await page.getByRole('button', { name: 'Findings' }).click();
  await expect(chip).toContainText('Fill Cpk lift');

  await page.getByTestId('workflow-tab-report').click();
  const reportChip = page.getByTestId('workspace-project-chip').last();
  await expect(reportChip).toContainText('Fill Cpk lift');
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

  await expect(reportChip.getByRole('button', { name: /exit workspace/i })).toHaveCount(0);
  await expect(reportChip).toContainText('Fill Cpk lift');
  await expect(page.getByText('Reporting on: Fill Cpk lift')).toBeVisible();
});

test('Project tab keeps the attached Workspace Project while enforcing membership access', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('home-paste-button')).toBeVisible({ timeout: 10000 });

  const fixturePath = path.join(dirname, 'fixtures', 'workspace-project-hub.vrs');
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByTestId('vrs-import-button').click(),
  ]);
  await fileChooser.setFiles(fixturePath);

  await expect(page.getByTestId('goal-banner')).toBeVisible({ timeout: 10000 });
  await page.getByTestId('workflow-tab-home').click();
  await expect(page.getByTestId('workspace-project-chip')).toContainText('Fill Cpk lift');

  await page.getByTestId('workflow-tab-project').click();
  await expect(page.getByTestId('workspace-project-chip')).toContainText('Fill Cpk lift');
  await expect(page.getByRole('heading', { name: 'No access' })).toBeVisible();
  await expect(page.getByText('Ask the project Lead for an invitation.')).toBeVisible();
});
