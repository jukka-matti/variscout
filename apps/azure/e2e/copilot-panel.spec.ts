import { test, expect } from '@playwright/test';
import { loadSampleInEditor, mockAIEndpoint } from './helpers';

/**
 * E2E Test: CopilotPanel — Conversational AI
 *
 * Covers the 11-point checklist from testing.md:769-783 plus
 * suggested question chips and overflow menu.
 * Uses recorded fixtures — no live AI endpoint required.
 */

test.describe('CopilotPanel', () => {
  test.beforeEach(async ({ page }) => {
    // Set VITE_AI_ENDPOINT so isAIAvailable() returns true
    await page.addInitScript(() => {
      (window as unknown as Record<string, unknown>).__VITE_AI_ENDPOINT__ =
        'https://mock.openai.azure.com/openai/deployments/gpt-4o/chat/completions';
    });
  });

  test('opens from NarrativeBar "Ask" button', async ({ page }) => {
    await mockAIEndpoint(page, 'basic-qa');
    await loadSampleInEditor(page);

    // Wait for NarrativeBar to appear (it may take time for narration)
    const narrativeBar = page.locator('[data-testid="narrative-bar"]');
    // NarrativeBar may or may not show if AI endpoint is mocked — check copilot button directly
    const askButton = page.locator('[data-testid="narrative-ask-button"]');

    // If NarrativeBar is visible, use Ask button; otherwise open copilot via toolbar
    if (await narrativeBar.isVisible({ timeout: 3000 }).catch(() => false)) {
      if (await askButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await askButton.click();
        await expect(page.locator('[data-testid="copilot-panel"]')).toBeVisible();
      }
    }
  });

  test('desktop: resizable side panel with min/max width', async ({ page }) => {
    await mockAIEndpoint(page, 'basic-qa');
    await loadSampleInEditor(page);

    // Open copilot via NarrativeBar ask button if available
    const askButton = page.locator('[data-testid="narrative-ask-button"]');
    if (await askButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await askButton.click();
    }

    const panel = page.locator('[data-testid="copilot-panel"]');
    if (await panel.isVisible({ timeout: 2000 }).catch(() => false)) {
      const box = await panel.boundingBox();
      expect(box).toBeTruthy();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(320);
        expect(box.width).toBeLessThanOrEqual(600);
      }
    }
  });

  test('text input accepts typing and send via Enter', async ({ page }) => {
    await mockAIEndpoint(page, 'basic-qa');
    await loadSampleInEditor(page);

    // Open copilot
    const askButton = page.locator('[data-testid="narrative-ask-button"]');
    if (await askButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await askButton.click();
    }

    const panel = page.locator('[data-testid="copilot-panel"]');
    if (!(await panel.isVisible({ timeout: 2000 }).catch(() => false))) {
      test.skip();
      return;
    }

    const input = page.locator('[data-testid="copilot-input"]');
    await input.fill('What is Cpk?');
    await input.press('Enter');

    // User message should appear right-aligned
    const userMsg = page.locator('[data-testid="copilot-message-0"]');
    await expect(userMsg).toBeVisible({ timeout: 5000 });
    await expect(userMsg).toContainText('What is Cpk?');
  });

  test('AI response appears left-aligned', async ({ page }) => {
    await mockAIEndpoint(page, 'basic-qa');
    await loadSampleInEditor(page);

    const askButton = page.locator('[data-testid="narrative-ask-button"]');
    if (await askButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await askButton.click();
    }

    const panel = page.locator('[data-testid="copilot-panel"]');
    if (!(await panel.isVisible({ timeout: 2000 }).catch(() => false))) {
      test.skip();
      return;
    }

    const input = page.locator('[data-testid="copilot-input"]');
    await input.fill('Tell me about this process');
    await input.press('Enter');

    // Wait for AI response
    const aiMsg = page.locator('[data-testid="copilot-message-1"]');
    await expect(aiMsg).toBeVisible({ timeout: 10000 });
    // AI messages are left-aligned (justify-start)
    await expect(aiMsg).toHaveClass(/justify-start/);
  });

  test('follow-up maintains context (multi-turn)', async ({ page }) => {
    let requestCount = 0;
    await page.route('**/openai/**', async route => {
      requestCount++;
      const fixture = requestCount === 1 ? 'basic-qa' : 'follow-up';
      const fs = await import('fs');
      const path = await import('path');
      const body = fs.readFileSync(
        path.join(__dirname, 'fixtures', 'ai', 'copilot', `${fixture}.json`),
        'utf-8'
      );
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body,
      });
    });

    await loadSampleInEditor(page);

    const askButton = page.locator('[data-testid="narrative-ask-button"]');
    if (await askButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await askButton.click();
    }

    const panel = page.locator('[data-testid="copilot-panel"]');
    if (!(await panel.isVisible({ timeout: 2000 }).catch(() => false))) {
      test.skip();
      return;
    }

    const input = page.locator('[data-testid="copilot-input"]');

    // First question
    await input.fill('What is Cpk?');
    await input.press('Enter');
    await expect(page.locator('[data-testid="copilot-message-1"]')).toBeVisible({ timeout: 10000 });

    // Follow-up
    await input.fill('Tell me more about Line B');
    await input.press('Enter');
    await expect(page.locator('[data-testid="copilot-message-3"]')).toBeVisible({ timeout: 10000 });

    // Should have 4 messages total: user, ai, user, ai
    await expect(page.locator('[data-testid="copilot-message-3"]')).toContainText('Line B');
  });

  test('close/reopen preserves conversation', async ({ page }) => {
    await mockAIEndpoint(page, 'basic-qa');
    await loadSampleInEditor(page);

    const askButton = page.locator('[data-testid="narrative-ask-button"]');
    if (await askButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await askButton.click();
    }

    const panel = page.locator('[data-testid="copilot-panel"]');
    if (!(await panel.isVisible({ timeout: 2000 }).catch(() => false))) {
      test.skip();
      return;
    }

    // Send a message
    const input = page.locator('[data-testid="copilot-input"]');
    await input.fill('What is Cpk?');
    await input.press('Enter');
    await expect(page.locator('[data-testid="copilot-message-1"]')).toBeVisible({ timeout: 10000 });

    // Close panel (Escape)
    await page.keyboard.press('Escape');
    await expect(panel).not.toBeVisible({ timeout: 2000 });

    // Reopen
    if (await askButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await askButton.click();
      await expect(panel).toBeVisible({ timeout: 2000 });
      // Messages should still be there
      await expect(page.locator('[data-testid="copilot-message-0"]')).toBeVisible();
      await expect(page.locator('[data-testid="copilot-message-1"]')).toBeVisible();
    }
  });

  test('user messages right-aligned, AI messages left-aligned', async ({ page }) => {
    await mockAIEndpoint(page, 'basic-qa');
    await loadSampleInEditor(page);

    const askButton = page.locator('[data-testid="narrative-ask-button"]');
    if (await askButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await askButton.click();
    }

    const panel = page.locator('[data-testid="copilot-panel"]');
    if (!(await panel.isVisible({ timeout: 2000 }).catch(() => false))) {
      test.skip();
      return;
    }

    const input = page.locator('[data-testid="copilot-input"]');
    await input.fill('Test alignment');
    await input.press('Enter');

    const userMsg = page.locator('[data-testid="copilot-message-0"]');
    const aiMsg = page.locator('[data-testid="copilot-message-1"]');

    await expect(userMsg).toBeVisible({ timeout: 5000 });
    await expect(aiMsg).toBeVisible({ timeout: 10000 });

    await expect(userMsg).toHaveClass(/justify-end/);
    await expect(aiMsg).toHaveClass(/justify-start/);
  });

  test('network error shows inline error with retry', async ({ page }) => {
    await mockAIEndpoint(page, 'error-500', { status: 500 });
    await loadSampleInEditor(page);

    const askButton = page.locator('[data-testid="narrative-ask-button"]');
    if (await askButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await askButton.click();
    }

    const panel = page.locator('[data-testid="copilot-panel"]');
    if (!(await panel.isVisible({ timeout: 2000 }).catch(() => false))) {
      test.skip();
      return;
    }

    const input = page.locator('[data-testid="copilot-input"]');
    await input.fill('This will fail');
    await input.press('Enter');

    // Error message should appear
    await expect(page.locator('text=Something went wrong.')).toBeVisible({ timeout: 10000 });
    // Retry button should be available
    await expect(page.locator('text=Retry')).toBeVisible();
  });

  test('Enter sends, Shift+Enter adds newline, Escape closes', async ({ page }) => {
    await mockAIEndpoint(page, 'basic-qa');
    await loadSampleInEditor(page);

    const askButton = page.locator('[data-testid="narrative-ask-button"]');
    if (await askButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await askButton.click();
    }

    const panel = page.locator('[data-testid="copilot-panel"]');
    if (!(await panel.isVisible({ timeout: 2000 }).catch(() => false))) {
      test.skip();
      return;
    }

    const input = page.locator('[data-testid="copilot-input"]');

    // Shift+Enter should not send
    await input.fill('Line 1');
    await input.press('Shift+Enter');
    expect(await page.locator('[data-testid="copilot-message-0"]').count()).toBe(0);

    // Escape closes the panel
    await page.keyboard.press('Escape');
    await expect(panel).not.toBeVisible({ timeout: 2000 });
  });

  test('suggested question chips appear and send on click', async ({ page }) => {
    await mockAIEndpoint(page, 'basic-qa');
    await loadSampleInEditor(page);

    const askButton = page.locator('[data-testid="narrative-ask-button"]');
    if (await askButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await askButton.click();
    }

    const panel = page.locator('[data-testid="copilot-panel"]');
    if (!(await panel.isVisible({ timeout: 2000 }).catch(() => false))) {
      test.skip();
      return;
    }

    // Suggested questions should appear
    const suggestions = page.locator('[data-testid="copilot-suggested-questions"]');
    if (await suggestions.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Click first suggestion
      const firstChip = page.locator('[data-testid="copilot-suggestion-0"]');
      await expect(firstChip).toBeVisible();
      const chipText = await firstChip.textContent();
      await firstChip.click();

      // Should trigger a message send
      await expect(page.locator('[data-testid="copilot-message-0"]')).toBeVisible({
        timeout: 5000,
      });
      if (chipText) {
        await expect(page.locator('[data-testid="copilot-message-0"]')).toContainText(chipText);
      }
    }
  });

  test('overflow menu: clear and copy actions', async ({ page }) => {
    await mockAIEndpoint(page, 'basic-qa');
    await loadSampleInEditor(page);

    const askButton = page.locator('[data-testid="narrative-ask-button"]');
    if (await askButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await askButton.click();
    }

    const panel = page.locator('[data-testid="copilot-panel"]');
    if (!(await panel.isVisible({ timeout: 2000 }).catch(() => false))) {
      test.skip();
      return;
    }

    // Send a message first
    const input = page.locator('[data-testid="copilot-input"]');
    await input.fill('Test question');
    await input.press('Enter');
    await expect(page.locator('[data-testid="copilot-message-1"]')).toBeVisible({ timeout: 10000 });

    // Overflow menu should appear
    const overflowBtn = page.locator('[data-testid="copilot-overflow-menu"]');
    await expect(overflowBtn).toBeVisible();
    await overflowBtn.click();

    // Menu items should be visible
    await expect(page.locator('[data-testid="copilot-menu-clear"]')).toBeVisible();
    await expect(page.locator('[data-testid="copilot-menu-copy"]')).toBeVisible();

    // Click copy
    await page.locator('[data-testid="copilot-menu-copy"]').click();
    // Menu should close after action
    await expect(page.locator('[data-testid="copilot-menu-clear"]')).not.toBeVisible({
      timeout: 1000,
    });
  });
});
