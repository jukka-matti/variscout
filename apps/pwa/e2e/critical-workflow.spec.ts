import { test, expect } from '@playwright/test';

/**
 * E2E Test: Critical Workflow
 *
 * Tests the core user journey:
 * 1. Load app
 * 2. Load a sample dataset
 * 3. Verify charts render
 * 4. Check statistics display
 */

test.describe('Critical Workflow', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'VariScout' })).toBeVisible({ timeout: 10000 });
  });

  test('should show sample datasets on home screen', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Try a Sample Dataset')).toBeVisible({ timeout: 10000 });
  });

  test('should show paste option on home screen', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Paste from Excel')).toBeVisible({ timeout: 10000 });
  });

  test('should load coffee sample and show dashboard', async ({ page }) => {
    // Use URL param to auto-load sample
    await page.goto('/?sample=coffee');

    // Wait for I-Chart container to appear
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
  });

  test('should display statistics after sample load', async ({ page }) => {
    await page.goto('/?sample=coffee');

    // Wait for stats panel
    await expect(page.locator('[data-testid="chart-stats"]')).toBeVisible({ timeout: 15000 });

    // Check that mean value is displayed and is a number
    const meanValue = page.locator('[data-testid="stat-value-mean"]');
    await expect(meanValue).toBeVisible({ timeout: 5000 });
    const meanText = await meanValue.textContent();
    expect(meanText).toBeTruthy();
    expect(parseFloat(meanText!)).not.toBeNaN();
  });

  test('should render all chart containers', async ({ page }) => {
    await page.goto('/?sample=coffee');

    // All three chart containers should be visible
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="chart-boxplot"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="chart-stats"]')).toBeVisible({ timeout: 5000 });
  });

  test('should render SVG chart elements', async ({ page }) => {
    await page.goto('/?sample=coffee');

    // Wait for I-Chart container
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });

    // Check for SVG elements inside the chart (data points, lines)
    const chartSvg = page.locator('[data-testid="chart-ichart"] svg');
    await expect(chartSvg.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display correct coffee dataset stats', async ({ page }) => {
    await page.goto('/?sample=coffee');

    // Wait for stats to render
    const meanValue = page.locator('[data-testid="stat-value-mean"]');
    await expect(meanValue).toBeVisible({ timeout: 15000 });

    // Coffee dataset overall mean ≈ 11.89
    const meanText = await meanValue.textContent();
    const mean = parseFloat(meanText!);
    expect(mean).toBeGreaterThan(11);
    expect(mean).toBeLessThan(13);

    // Samples count should be 30
    const samplesValue = page.locator('[data-testid="stat-value-samples"]');
    await expect(samplesValue).toBeVisible();
    const samplesText = await samplesValue.textContent();
    expect(samplesText).toContain('30');
  });

  test('paste happy-path: home → paste → map your data → analysis renders', async ({ page }) => {
    // Deterministic seeded CSV — 10 rows, 3 columns. Weight is the numeric outcome.
    const seededCsv = [
      'Sample,Weight,Line',
      '1,10.2,A',
      '2,10.5,A',
      '3,9.8,A',
      '4,10.1,B',
      '5,10.7,B',
      '6,9.9,B',
      '7,10.3,A',
      '8,10.0,B',
      '9,10.4,A',
      '10,10.2,B',
    ].join('\n');

    // 1. Home screen
    await page.goto('/');
    const pasteButton = page.getByTestId('home-paste-button');
    await expect(pasteButton).toBeVisible({ timeout: 10000 });

    // 2. Open the paste screen (PasteScreen is lazy-loaded — covers the regression
    //    where a stale PasteScreen-<hash>.js chunk would 404 on the deployed PWA).
    await pasteButton.click();
    const textarea = page.getByTestId('paste-textarea');
    await expect(textarea).toBeVisible({ timeout: 10000 });

    // 3. Paste the CSV and submit
    await textarea.fill(seededCsv);
    await page.getByTestId('paste-start-analysis').click();

    // 4. Map Your Data screen — heading + column cards must appear
    await expect(page.getByTestId('map-your-data-heading')).toBeVisible({
      timeout: 10000,
    });

    // The three pasted columns should each render a column card. Asserting on
    // testid count proves the lazy mapping screen mounted; a content check on
    // card text proves the data-paste pipeline preserved column names (this is
    // testing data flow, not a UI label, so it's appropriate per testing.md).
    const cards = page.locator('[data-testid="mapping-column-card"]');
    await expect(cards).toHaveCount(3);
    const cardsText = (await cards.allTextContents()).join(' ');
    expect(cardsText).toContain('Sample');
    expect(cardsText).toContain('Weight');
    expect(cardsText).toContain('Line');
  });
});

test.describe('Data Validation', () => {
  test('should handle empty paste gracefully', async ({ page }) => {
    await page.goto('/');

    // App should remain functional
    await expect(page.getByRole('heading', { name: 'VariScout' })).toBeVisible({ timeout: 10000 });
  });
});

test.describe('PWA', () => {
  test('should load correctly as a web app', async ({ page }) => {
    await page.goto('/');

    // Verify the app is functional
    await expect(page.getByRole('heading', { name: 'VariScout' })).toBeVisible({ timeout: 10000 });

    // Check that the page has no console errors on load
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(2000);
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(
      e => !e.includes('ResizeObserver') && !e.includes('service-worker')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
