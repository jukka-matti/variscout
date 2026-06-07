import { expect, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ESM-compatible __dirname equivalent
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Complete the permanent Fix data / multi-outcome wizard hatch.
 *
 * First-session E2E should not use this helper as its default spine. Normal
 * journeys go paste/sample -> b0 -> See the data; this helper remains only for
 * explicit ColumnMapping hatch coverage.
 */
export async function confirmColumnMapping(page: Page, outcomeName?: string) {
  await expect(page.locator('text=Map Your Data')).toBeVisible({ timeout: 5000 });

  // If a specific outcome was requested, select it via the checkbox input with
  // the matching aria-label on the OutcomeCandidateRow.
  if (outcomeName) {
    const outcomeCheckbox = page.locator(
      `[data-testid="outcome-candidate-list"] input[type="checkbox"][aria-label="${outcomeName}"]`
    );
    const isVisible = await outcomeCheckbox.isVisible().catch(() => false);
    if (isVisible) {
      const isChecked = await outcomeCheckbox.isChecked().catch(() => false);
      if (!isChecked) {
        await outcomeCheckbox.click();
      }
    }
  }

  // Click Start Analysis / Apply Changes (whichever is present)
  await page
    .locator('button:has-text("Start Analysis"), button:has-text("Apply Changes")')
    .first()
    .click();
}

export async function startNewAnalysis(page: Page) {
  await page.goto('/');
  await expect(
    page
      .locator('text=Start Your Analysis')
      .or(page.getByRole('button', { name: 'New Analysis' }).first())
  ).toBeVisible({ timeout: 10000 });

  if (
    await page
      .locator('text=Start Your Analysis')
      .isVisible({ timeout: 1000 })
      .catch(() => false)
  ) {
    return;
  }

  await page.getByRole('button', { name: 'New Analysis' }).first().click();
  await expect(page.locator('text=Start Your Analysis')).toBeVisible({ timeout: 5000 });
}

export async function resetToFreshAnalysis(page: Page) {
  await page.goto('/');
  await page.evaluate(async () => {
    window.localStorage?.clear();
    window.sessionStorage?.clear();

    if (indexedDB.databases) {
      const databases = await indexedDB.databases();
      await Promise.all(
        databases.map(
          database =>
            database.name &&
            new Promise<void>(resolve => {
              const request = indexedDB.deleteDatabase(database.name);
              request.onsuccess = request.onerror = request.onblocked = () => resolve();
            })
        )
      );
    }
  });
  await page.goto('/');
  await expect(page.locator('text=Start Your Analysis')).toBeVisible({ timeout: 10000 });
}

export async function openPasteData(page: Page) {
  const textarea = page.getByTestId('paste-textarea');
  if (await textarea.isVisible({ timeout: 1000 }).catch(() => false)) {
    return;
  }

  await page.getByRole('button', { name: 'Paste Data' }).first().click();
  await expect(textarea).toBeVisible({ timeout: 8000 });
}

export async function seeB0Data(page: Page) {
  const chart = page.locator('[data-testid="chart-ichart"]');
  if (await chart.isVisible({ timeout: 1000 }).catch(() => false)) {
    return;
  }

  await expect(page.getByTestId('frame-view-b0')).toBeVisible({ timeout: 15000 });
  const acceptedPerformanceSeeData = page.getByTestId('b0-performance-accepted-see-data');
  if (await acceptedPerformanceSeeData.isVisible({ timeout: 500 }).catch(() => false)) {
    await acceptedPerformanceSeeData.click();
  } else {
    await page.getByTestId('see-the-data-cta').click();
  }
  await expect(chart).toBeVisible({ timeout: 15000 });
}

export async function expectChartSummaryStats(page: Page) {
  await expect(page.locator('text=/x̄\\d/').first()).toBeVisible({ timeout: 5000 });
  await expect(page.locator('text=/σ\\d/').first()).toBeVisible({ timeout: 5000 });
  await expect(page.locator('text=/n\\d/').first()).toBeVisible({ timeout: 5000 });
}

export async function pasteToCharts(page: Page, csv: string = MODE_B_CSV): Promise<void> {
  await pasteToB0(page, csv);
  await seeB0Data(page);
}

export async function loadSampleToB0(page: Page, sampleTestId?: string): Promise<void> {
  const sampleButton = sampleTestId
    ? page.getByTestId(sampleTestId)
    : page.locator('[data-testid^="sample-"]').first();
  await expect(sampleButton).toBeVisible({ timeout: 5000 });
  await sampleButton.click();
  await expect(page.getByTestId('frame-view-b0')).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId('map-your-data-heading')).toHaveCount(0);
}

export async function loadSampleToCharts(page: Page, sampleTestId?: string): Promise<void> {
  await loadSampleToB0(page, sampleTestId);
  await seeB0Data(page);
}

export async function selectB0Outcome(page: Page, outcomeName: string): Promise<void> {
  const candidate = page
    .getByTestId('frame-view-b0')
    .getByText(outcomeName, { exact: true })
    .first();
  await expect(candidate).toBeVisible({ timeout: 5000 });
  await candidate.click();
  await expect(page.getByTestId('y-picker-selected-row')).toContainText(outcomeName, {
    timeout: 5000,
  });
}

export async function openFixDataWizard(page: Page): Promise<void> {
  await expect(page.getByTestId('frame-view-b0')).toBeVisible({ timeout: 15000 });
  await page.getByTestId('b0-fix-data').click();
  await expect(page.locator('text=Map Your Data')).toBeVisible({ timeout: 5000 });
}

/**
 * Navigate to editor, load the first sample, confirm mapping, and wait for charts.
 */
export async function loadSampleInEditor(page: Page) {
  await startNewAnalysis(page);
  await loadSampleToCharts(page);
}

/**
 * Load the large-scale performance-mode sample and confirm mapping.
 */
export async function loadPerformanceSample(page: Page) {
  await startNewAnalysis(page);
  await loadSampleToCharts(page, 'sample-large-scale');
}

// ── Mode B helpers ────────────────────────────────────────────────────────────

/**
 * Measurement-shaped CSV: clear numeric outcome (weight_g) + two categoricals.
 * FSJ-3b: measurement-shaped pastes skip the mapping vestibule and land at b0
 * (frame-view-b0) on the Process tab.
 */
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
 * Detection-shaped CSV: defect event-log format (defect column, no continuous
 * numeric outcome). FSJ-6 lands this at b0 with the defect re-framing banner
 * rather than opening the retired defect modal or ColumnMapping path.
 */
export const DETECTION_CSV = [
  'date,line,defect,operator',
  '2026-01-01,A,scratch,Alice',
  '2026-01-01,A,dent,Bob',
  '2026-01-02,B,scratch,Charlie',
  '2026-01-02,A,contamination,Alice',
  '2026-01-03,B,scratch,Bob',
  '2026-01-03,A,dent,Charlie',
  '2026-01-04,B,scratch,Alice',
  '2026-01-04,A,contamination,Bob',
  '2026-01-05,B,dent,Charlie',
  '2026-01-05,A,scratch,Alice',
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
 * Paste measurement-shaped CSV and wait for the b0 landing on the Process tab.
 *
 * FSJ-3b (spec §4.1): measurement-shaped pastes skip ColumnMapping entirely
 * and land at frame-view-b0 with Y/X pre-filled by inference. Use this helper
 * when the test goal is "user sees the Process tab with data loaded" rather
 * than "user goes through the mapping wizard".
 *
 * The PasteScreen must already be open before calling this helper — call
 * `page.getByRole('button', { name: 'Paste Data' }).click()` first.
 *
 * @param tsv - Tab-separated or comma-separated measurement data. Defaults to
 *   MODE_B_CSV (weight_g outcome + two categoricals).
 */
export async function pasteToB0(page: Page, tsv: string = MODE_B_CSV): Promise<void> {
  await openPasteData(page);
  await page.getByTestId('paste-textarea').fill(tsv);
  await page.getByTestId('paste-start-analysis').click();
  // FSJ-10: fresh paste skips the wizard and lands at frame-view-b0.
  // hub-creation-stage1 and "Map Your Data" must NOT appear.
  await expect(page.getByTestId('frame-view-b0')).toBeVisible({ timeout: 15000 });
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
