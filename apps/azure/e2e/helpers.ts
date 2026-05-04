import { expect, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ESM-compatible __dirname equivalent
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Complete the ColumnMapping step after loading data.
 *
 * After a sample is loaded (or data pasted/uploaded), the app shows
 * the "Map Your Data" ColumnMapping screen (Stage 3). The refactored
 * ColumnMapping uses OutcomeCandidateRow for multi-select. Sample
 * datasets auto-detect the outcome column, so the initialOutcome
 * prop pre-selects a row — the "Start Analysis" button becomes enabled
 * when at least one candidate row is selected.
 *
 * @param outcomeName - Optional column name to explicitly select as the
 *   outcome. If omitted, relies on the pre-selected initialOutcome.
 */
export async function confirmColumnMapping(page: Page, outcomeName?: string) {
  await expect(page.locator('text=Map Your Data')).toBeVisible({ timeout: 5000 });

  // If a specific outcome was requested, select it via the radio input with
  // the matching aria-label on the OutcomeCandidateRow.
  if (outcomeName) {
    const outcomeRadio = page.locator(
      `[data-testid="outcome-candidate-list"] input[type="radio"][aria-label="${outcomeName}"]`
    );
    const isVisible = await outcomeRadio.isVisible().catch(() => false);
    if (isVisible) {
      const isChecked = await outcomeRadio.isChecked().catch(() => false);
      if (!isChecked) {
        await outcomeRadio.click();
      }
    }
  }

  // Click Start Analysis / Apply Changes (whichever is present)
  await page
    .locator('button:has-text("Start Analysis"), button:has-text("Apply Changes")')
    .first()
    .click();
}

/**
 * Navigate to editor, load the first sample, confirm mapping, and wait for charts.
 */
export async function loadSampleInEditor(page: Page) {
  await page.goto('/');
  await expect(page.locator('text=VariScout Team')).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'New Analysis' }).first().click();
  await expect(page.locator('text=Start Your Analysis')).toBeVisible({ timeout: 5000 });

  const sampleButton = page.locator('[data-testid^="sample-"]').first();
  await sampleButton.click();

  await confirmColumnMapping(page);
  await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
}

/**
 * Load the large-scale performance-mode sample and confirm mapping.
 */
export async function loadPerformanceSample(page: Page) {
  await page.goto('/');
  await expect(page.locator('text=VariScout Team')).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'New Analysis' }).first().click();
  await expect(page.locator('text=Start Your Analysis')).toBeVisible({ timeout: 5000 });

  await page.locator('[data-testid="sample-large-scale"]').click();

  await confirmColumnMapping(page);
  await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
}

// ── Mode B helpers ────────────────────────────────────────────────────────────

/** CSV data with a clear numeric outcome (weight_g) + two categoricals */
export const MODE_B_CSV = [
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
 * Paste CSV data into the PasteScreen (data-testid="paste-textarea") and
 * click Start Analysis.
 */
export async function pasteDataAndAnalyze(page: Page, csv: string = MODE_B_CSV): Promise<void> {
  await expect(page.getByTestId('paste-textarea')).toBeVisible({ timeout: 8000 });
  await page.getByTestId('paste-textarea').fill(csv);
  await page.getByTestId('paste-start-analysis').click();
}

/**
 * Complete Stage 1 (HubGoalForm) in HubCreationFlow.
 * Waits for the hub-creation-stage1 container, fills the goal narrative,
 * and clicks Continue.
 */
export async function completeStage1(page: Page, narrative: string): Promise<void> {
  await expect(page.getByTestId('hub-creation-stage1')).toBeVisible({ timeout: 8000 });
  await page.getByRole('textbox', { name: /process goal/i }).fill(narrative);
  await page.getByRole('button', { name: /Continue/i }).click();
}

/**
 * Mock the AI endpoint with a fixture response.
 * Intercepts requests to the AI endpoint and returns fixture data.
 *
 * @param fixtureName - Name of fixture file (without extension) in e2e/fixtures/ai/coscout/
 * @param options - Optional: status code override, streaming mode
 */
export async function mockAIEndpoint(
  page: Page,
  fixtureName: string,
  options?: { status?: number; streaming?: boolean }
): Promise<void> {
  const fixturesDir = path.join(__dirname, 'fixtures', 'ai', 'coscout');

  await page.route('**/openai/**', async route => {
    const status = options?.status ?? 200;

    if (options?.streaming || fixtureName === 'streaming') {
      const body = fs.readFileSync(
        path.join(fixturesDir, fixtureName.endsWith('.txt') ? fixtureName : `${fixtureName}.txt`),
        'utf-8'
      );
      await route.fulfill({
        status,
        headers: { 'Content-Type': 'text/event-stream' },
        body,
      });
    } else {
      const body = fs.readFileSync(
        path.join(fixturesDir, fixtureName.endsWith('.json') ? fixtureName : `${fixtureName}.json`),
        'utf-8'
      );
      await route.fulfill({
        status,
        headers: { 'Content-Type': 'application/json' },
        body,
      });
    }
  });

  // Also mock /.auth/me for dev mode (no auth)
  await page.route('**/.auth/me', async route => {
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ access_token: 'mock-token' }]),
    });
  });
}
