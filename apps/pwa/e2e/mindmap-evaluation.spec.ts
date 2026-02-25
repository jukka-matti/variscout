import { test, expect, Page } from '@playwright/test';

/**
 * Chrome Evaluation: Mindmap with Bottleneck & Hospital Ward
 *
 * This evaluation script verifies how the Mindmap panel performs
 * with both case study datasets, documenting what works, gaps, and bugs.
 *
 * Screenshots are saved to apps/pwa/e2e/screenshots/mindmap-eval/
 */

const SCREENSHOT_DIR = 'e2e/screenshots/mindmap-eval';

// Helper: open the Investigation/Mindmap panel
async function openMindmapPanel(page: Page) {
  const btn = page.getByRole('button', { name: /Show Investigation/i });
  if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await btn.click();
  } else {
    const mobileBtn = page.locator('button[title="Show Investigation"]');
    if (await mobileBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await mobileBtn.click();
    }
  }
  // Wait for the panel slide-in animation
  await page.waitForTimeout(500);
}

// Helper: click an SVG mindmap node by finding the circle associated with a label.
// The mindmap renders <g> groups with: <circle>, <text>(label), <text>(contribution%).
// We use page.evaluate to get the circle's bounding box, then click it.
async function clickMindmapNode(page: Page, label: string) {
  // Get the bounding rect of the circle whose sibling <text> matches the label
  const circleRect = await page.evaluate(labelText => {
    // Search all SVG <g> groups for one whose first <text> matches
    const groups = document.querySelectorAll('svg g');
    for (const g of groups) {
      const texts = g.querySelectorAll(':scope > text');
      const circle = g.querySelector(':scope > circle');
      if (texts.length >= 2 && circle) {
        const nodeLabel = texts[0].textContent?.trim();
        if (nodeLabel === labelText) {
          const rect = circle.getBoundingClientRect();
          return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        }
      }
    }
    return null;
  }, label);

  if (!circleRect) {
    throw new Error(`Mindmap node with label "${label}" not found`);
  }

  await page.mouse.click(circleRect.x, circleRect.y);
}

// Helper: select a category from the CategoryPopover
async function selectCategory(page: Page, factorName: string, categoryValue: string) {
  const listbox = page.getByRole('listbox', { name: new RegExp(factorName, 'i') });
  await expect(listbox).toBeVisible({ timeout: 5000 });

  const option = listbox.getByRole('option').filter({ hasText: categoryValue });
  await expect(option).toBeVisible({ timeout: 3000 });
  await option.click();
}

// Helper: get contribution % text from popover options.
// Each option has two <span> children: value text + pct text.
async function getPopoverContributions(page: Page, factorName: string) {
  const listbox = page.getByRole('listbox', { name: new RegExp(factorName, 'i') });
  await expect(listbox).toBeVisible({ timeout: 5000 });

  return await page.evaluate(factorPattern => {
    const listboxes = document.querySelectorAll('[role="listbox"]');
    for (const lb of listboxes) {
      const label = lb.getAttribute('aria-label') || '';
      if (new RegExp(factorPattern, 'i').test(label)) {
        const options = lb.querySelectorAll('[role="option"]');
        const results: { value: string; pct: string }[] = [];
        for (const opt of options) {
          const spans = opt.querySelectorAll('span');
          if (spans.length >= 2) {
            results.push({
              value: spans[0].textContent?.trim() || '',
              pct: spans[1].textContent?.trim() || '',
            });
          }
        }
        return results;
      }
    }
    return [];
  }, factorName);
}

// Helper: get all node contribution percentages from the mindmap SVG
async function getNodeContributions(page: Page) {
  return await page.evaluate(() => {
    const results: { label: string; contribution: string; state: string }[] = [];
    const groups = document.querySelectorAll('svg g');
    for (const g of groups) {
      const texts = g.querySelectorAll(':scope > text');
      const circle = g.querySelector(':scope > circle');
      if (texts.length >= 2 && circle) {
        const label = texts[0].textContent?.trim() || '';
        const contribution = texts[1].textContent?.trim() || '';
        if (label === 'Start' || !contribution.includes('%')) continue;
        const hasPulse = circle.classList.contains('mindmap-pulse');
        const fill = circle.getAttribute('fill') || '';
        const isActive = fill === '#3b82f6';
        results.push({
          label,
          contribution,
          state: isActive ? 'active' : hasPulse ? 'suggested' : 'available',
        });
      }
    }
    return results;
  });
}

// Helper: get pulse state for a specific node
async function getNodePulseState(page: Page, label: string) {
  return await page.evaluate(labelText => {
    const groups = document.querySelectorAll('svg g');
    for (const g of groups) {
      const texts = g.querySelectorAll(':scope > text');
      const circle = g.querySelector(':scope > circle');
      if (texts.length >= 2 && circle) {
        if (texts[0].textContent?.trim() === labelText) {
          return {
            hasPulse: circle.classList.contains('mindmap-pulse'),
            fill: circle.getAttribute('fill'),
            stroke: circle.getAttribute('stroke'),
          };
        }
      }
    }
    return null;
  }, label);
}

// Helper: get drill path text
async function getDrillPathText(page: Page) {
  const drillPathLabel = page.getByText('Drill Path');
  if (!(await drillPathLabel.isVisible({ timeout: 2000 }).catch(() => false))) {
    return null;
  }
  const container = drillPathLabel.locator('..');
  return await container.textContent();
}

// Helper: get progress footer text from SVG
async function getProgressText(page: Page) {
  const focusedText = page.locator('svg text').filter({ hasText: /Focused on/ });
  if (await focusedText.isVisible({ timeout: 2000 }).catch(() => false)) {
    return await focusedText.textContent();
  }
  return null;
}

// ============================================================================
// SCENARIO 1: BOTTLENECK DATASET + MINDMAP
// ============================================================================

test.describe('Mindmap Evaluation: Bottleneck Dataset', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?sample=bottleneck');
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
  });

  test('1.1 Initial mindmap state — node contributions and suggestion', async ({ page }) => {
    await openMindmapPanel(page);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/bottleneck-01-initial.png`, fullPage: true });

    const nodes = await getNodeContributions(page);
    console.log('Bottleneck initial nodes:', JSON.stringify(nodes, null, 2));

    const stepNode = nodes.find(n => n.label === 'Step');
    expect(stepNode).toBeTruthy();
    console.log(`Step contribution: ${stepNode?.contribution}, state: ${stepNode?.state}`);

    const shiftNode = nodes.find(n => n.label === 'Shift');
    expect(shiftNode).toBeTruthy();
    console.log(`Shift contribution: ${shiftNode?.contribution}, state: ${shiftNode?.state}`);

    // Verify one of the nodes is suggested (green pulse)
    const suggestedNode = nodes.find(n => n.state === 'suggested');
    expect(suggestedNode).toBeTruthy();
    console.log(`Suggested node: ${suggestedNode?.label} (${suggestedNode?.contribution})`);

    // Suggestion ranking uses η² (factor-level metric), which correctly identifies
    // Step as the more analytically interesting factor over Shift.
    expect(suggestedNode?.label).toBe('Step');

    const progress = await getProgressText(page);
    console.log(`Progress: ${progress}`);
  });

  test('1.2 CategoryPopover for Step — shows all 5 steps with contribution %', async ({ page }) => {
    await openMindmapPanel(page);

    // Click the Step node circle
    await clickMindmapNode(page, 'Step');
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/bottleneck-02-step-popover.png`,
      fullPage: true,
    });

    const contributions = await getPopoverContributions(page, 'Step');
    console.log('Step CategoryPopover:', JSON.stringify(contributions, null, 2));

    // Should have 5 steps
    expect(contributions.length).toBe(5);

    // Step 2 should have notable contribution (highest variance in bottleneck data)
    // With Total SS formula, this is non-zero even when Step 2's mean equals the overall mean
    const step2 = contributions.find(c => c.value.includes('Step 2'));
    console.log(`Step 2 contribution: ${step2?.pct}`);
    expect(step2).toBeTruthy();

    // Step 2 should show non-zero contribution (was 0% with old between-group formula)
    const step2Pct = parseFloat(step2!.pct);
    expect(step2Pct).toBeGreaterThan(0);

    // All contributions should sum to ~100% (Total SS partitioning)
    let totalPct = 0;
    for (const c of contributions) {
      console.log(`  ${c.value}: ${c.pct}`);
      totalPct += parseFloat(c.pct);
    }
    expect(totalPct).toBeGreaterThan(90); // Allow rounding tolerance
  });

  test('1.3 CategoryPopover for Shift — shows contribution %', async ({ page }) => {
    await openMindmapPanel(page);

    // Click Shift node (the suggested one)
    await clickMindmapNode(page, 'Shift');
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/bottleneck-03-shift-popover.png`,
      fullPage: true,
    });

    const contributions = await getPopoverContributions(page, 'Shift');
    console.log('Shift CategoryPopover:', JSON.stringify(contributions, null, 2));

    for (const c of contributions) {
      console.log(`  ${c.value}: ${c.pct}`);
    }
  });

  test('1.4 Drill into Step 2 — filter, node state, dead-end', async ({ page }) => {
    await openMindmapPanel(page);

    // Click Step node to open popover
    await clickMindmapNode(page, 'Step');
    await page.waitForTimeout(500);

    // Select Step 2
    await selectCategory(page, 'Step', 'Step 2');
    await page.waitForTimeout(700);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/bottleneck-04-step2-drilled.png`,
      fullPage: true,
    });

    // Verify filter chip appeared
    const filterChip = page.locator('[data-testid^="filter-chip-"]');
    await expect(filterChip.first()).toBeVisible({ timeout: 5000 });
    const chipText = await filterChip.first().textContent();
    console.log(`Filter chip text: ${chipText}`);

    // Get updated node states
    const nodes = await getNodeContributions(page);
    console.log('After Step 2 drill:', JSON.stringify(nodes, null, 2));

    const stepNode = nodes.find(n => n.label === 'Step');
    console.log(`Step state: ${stepNode?.state}`);

    const shiftNode = nodes.find(n => n.label === 'Shift');
    console.log(`Shift state: ${shiftNode?.state}, contribution: ${shiftNode?.contribution}`);

    // Dead-end evaluation: does Shift pulse after the drill?
    const shiftPulse = await getNodePulseState(page, 'Shift');
    if (shiftPulse && !shiftPulse.hasPulse) {
      console.log('DEAD-END: Shift does NOT pulse after Step 2 drill — implicit dead-end signal.');
      console.log('  Q: Is this obvious enough? No explicit "dead end" text or icon.');
    } else if (shiftPulse?.hasPulse) {
      console.log('FINDING: Shift STILL pulses after drill — suggests further investigation.');
    }

    // Drill path footer
    const drillPath = await getDrillPathText(page);
    console.log(`Drill path: ${drillPath}`);

    // Progress footer
    const progress = await getProgressText(page);
    console.log(`Progress: ${progress}`);
  });

  test('1.5 Step 2 vs Step 3 I-Chart contrast via mindmap drill', async ({ page }) => {
    await openMindmapPanel(page);

    // Drill Step 2
    await clickMindmapNode(page, 'Step');
    await page.waitForTimeout(500);
    await selectCategory(page, 'Step', 'Step 2');
    await page.waitForTimeout(700);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/bottleneck-05-step2-ichart.png`,
      fullPage: true,
    });

    const step2StdDev = page.locator('[data-testid="stat-value-std-dev"]');
    await expect(step2StdDev).toBeVisible({ timeout: 5000 });
    const step2Std = parseFloat((await step2StdDev.textContent())!);
    console.log(`Step 2 Std Dev: ${step2Std}`);

    // Close mindmap panel first (backdrop blocks filter chip buttons)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Remove filter
    const removeButton = page.locator('[data-testid^="filter-chip-remove-"]').first();
    await removeButton.click();
    await page.waitForTimeout(700);

    // Reopen mindmap panel and drill Step 3
    await openMindmapPanel(page);
    await clickMindmapNode(page, 'Step');
    await page.waitForTimeout(500);
    await selectCategory(page, 'Step', 'Step 3');
    await page.waitForTimeout(700);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/bottleneck-06-step3-ichart.png`,
      fullPage: true,
    });

    const step3StdDev = page.locator('[data-testid="stat-value-std-dev"]');
    await expect(step3StdDev).toBeVisible({ timeout: 5000 });
    const step3Std = parseFloat((await step3StdDev.textContent())!);
    console.log(`Step 3 Std Dev: ${step3Std}`);

    console.log(
      `CONTRAST: Step 2 σ=${step2Std} vs Step 3 σ=${step3Std} (ratio: ${(step2Std / step3Std).toFixed(1)}x)`
    );
  });
});

// ============================================================================
// SCENARIO 2: HOSPITAL WARD DATASET + MINDMAP
// ============================================================================

test.describe('Mindmap Evaluation: Hospital Ward Dataset', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?sample=hospital-ward');
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });
  });

  test('2.1 Initial mindmap state — Time_Period dominant', async ({ page }) => {
    await openMindmapPanel(page);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/hospital-01-initial.png`,
      fullPage: true,
    });

    const nodes = await getNodeContributions(page);
    console.log('Hospital Ward initial nodes:', JSON.stringify(nodes, null, 2));

    const timePeriodNode = nodes.find(n => n.label === 'Time_Period' || n.label === 'Time Period');
    expect(timePeriodNode).toBeTruthy();
    console.log(`Time_Period: ${timePeriodNode?.contribution}, state: ${timePeriodNode?.state}`);

    const dayNode = nodes.find(n => n.label === 'Day_of_Week' || n.label === 'Day of Week');
    expect(dayNode).toBeTruthy();
    console.log(`Day_of_Week: ${dayNode?.contribution}, state: ${dayNode?.state}`);

    // Time_Period should be suggested
    expect(timePeriodNode?.state).toBe('suggested');

    const progress = await getProgressText(page);
    console.log(`Progress: ${progress}`);
  });

  test('2.2 CategoryPopover for Time_Period — Night and Afternoon contrast', async ({ page }) => {
    await openMindmapPanel(page);

    await clickMindmapNode(page, 'Time_Period');
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/hospital-02-timeperiod-popover.png`,
      fullPage: true,
    });

    const contributions = await getPopoverContributions(page, 'Time');
    console.log('Time_Period CategoryPopover:', JSON.stringify(contributions, null, 2));

    expect(contributions.length).toBe(4);

    const night = contributions.find(c => c.value.includes('Night'));
    const afternoon = contributions.find(c => c.value.includes('Afternoon'));
    const morning = contributions.find(c => c.value.includes('Morning'));
    const evening = contributions.find(c => c.value.includes('Evening'));

    console.log(
      `Night: ${night?.pct}, Afternoon: ${afternoon?.pct}, Morning: ${morning?.pct}, Evening: ${evening?.pct}`
    );
    console.log(
      'KEY QUESTION: Can analyst see Night and Afternoon contrast before drilling?',
      night && afternoon ? 'YES — both visible in popover' : 'NO'
    );
  });

  test('2.3 Drill into Night — crisis-level stats', async ({ page }) => {
    await openMindmapPanel(page);

    await clickMindmapNode(page, 'Time_Period');
    await page.waitForTimeout(500);
    await selectCategory(page, 'Time', 'Night');
    await page.waitForTimeout(700);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/hospital-03-night-drilled.png`,
      fullPage: true,
    });

    const meanValue = page.locator('[data-testid="stat-value-mean"]');
    const mean = parseFloat((await meanValue.textContent())!);
    console.log(`Night mean: ${mean}`);
    expect(mean).toBeGreaterThan(88);

    const nodes = await getNodeContributions(page);
    console.log('After Night drill:', JSON.stringify(nodes, null, 2));

    const dayNode = nodes.find(n => n.label === 'Day_of_Week' || n.label === 'Day of Week');
    console.log(
      `Day_of_Week after Night: state=${dayNode?.state}, contribution=${dayNode?.contribution}`
    );

    const dayPulse = await getNodePulseState(page, 'Day_of_Week');
    console.log(`Day_of_Week pulse: ${dayPulse?.hasPulse ? 'YES' : 'NO'}`);

    const drillPath = await getDrillPathText(page);
    console.log(`Drill path: ${drillPath}`);

    const progress = await getProgressText(page);
    console.log(`Progress: ${progress}`);
  });

  test('2.4 Drill into Afternoon — waste-level comparison', async ({ page }) => {
    await openMindmapPanel(page);

    await clickMindmapNode(page, 'Time_Period');
    await page.waitForTimeout(500);
    await selectCategory(page, 'Time', 'Afternoon');
    await page.waitForTimeout(700);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/hospital-04-afternoon-drilled.png`,
      fullPage: true,
    });

    const meanValue = page.locator('[data-testid="stat-value-mean"]');
    const mean = parseFloat((await meanValue.textContent())!);
    console.log(`Afternoon mean: ${mean}`);
    expect(mean).toBeLessThan(55);

    console.log(`AGGREGATION TRAP: Afternoon mean=${mean}, overall ~75`);

    // Check Day_of_Week state after drilling Afternoon
    const nodes = await getNodeContributions(page);
    const dayNode = nodes.find(n => n.label === 'Day_of_Week' || n.label === 'Day of Week');
    console.log(
      `Day_of_Week after Afternoon: state=${dayNode?.state}, contribution=${dayNode?.contribution}`
    );
  });

  test('2.5 Narrative mode — investigation trail after Night drill', async ({ page }) => {
    await openMindmapPanel(page);

    // Drill into Night
    await clickMindmapNode(page, 'Time_Period');
    await page.waitForTimeout(500);
    await selectCategory(page, 'Time', 'Night');
    await page.waitForTimeout(700);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/hospital-05-night-drilled-panel.png`,
      fullPage: true,
    });

    // Switch to Narrative mode
    const narrativeBtn = page.getByRole('button', { name: /Narrative/i });
    const narrativeEnabled = await narrativeBtn.isEnabled({ timeout: 2000 }).catch(() => false);
    console.log(`Narrative enabled after 1 drill: ${narrativeEnabled}`);

    if (narrativeEnabled) {
      await narrativeBtn.click();
      await page.waitForTimeout(500);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/hospital-06-narrative-mode.png`,
        fullPage: true,
      });

      const progress = await getProgressText(page);
      console.log(`Narrative progress: ${progress}`);
      console.log('FINDING: Narrative mode works after single drill.');
    } else {
      const ariaLabel = await narrativeBtn.getAttribute('aria-label');
      console.log(`Narrative disabled reason: ${ariaLabel}`);
      console.log('FINDING: Narrative requires 1+ drill — checking gate condition...');

      // Screenshot of disabled state
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/hospital-06-narrative-disabled.png`,
        fullPage: true,
      });
    }
  });
});

// ============================================================================
// CROSS-CUTTING EVALUATION
// ============================================================================

test.describe('Mindmap Evaluation: Cross-Cutting', () => {
  test('3.1 Mode toggle states with Bottleneck dataset', async ({ page }) => {
    await page.goto('/?sample=bottleneck');
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });

    await openMindmapPanel(page);

    const drilldownBtn = page.getByRole('button', { name: /Drilldown/i });
    const interactionsBtn = page.getByRole('button', { name: /Interactions/i });
    const narrativeBtn = page.getByRole('button', { name: /Narrative/i });

    console.log(
      `Initial — Drilldown: ${await drilldownBtn.isEnabled()}, Interactions: ${await interactionsBtn.isEnabled().catch(() => false)}, Narrative: ${await narrativeBtn.isEnabled().catch(() => false)}`
    );

    // Drill to enable narrative — click Shift (the suggested node)
    await clickMindmapNode(page, 'Shift');
    await page.waitForTimeout(500);

    // Check if Shift popover appeared (scope to listbox to avoid <select> options)
    const listbox = page.getByRole('listbox', { name: /Shift/i });
    const listboxVisible = await listbox.isVisible({ timeout: 2000 }).catch(() => false);
    console.log(`Shift popover appeared: ${listboxVisible}`);

    if (listboxVisible) {
      // Select first shift option within the listbox
      const firstOption = listbox.getByRole('option').first();
      const optionText = await firstOption.textContent();
      console.log(`Selecting Shift option: ${optionText}`);
      await firstOption.click();
      await page.waitForTimeout(700);

      console.log(
        `After drill — Narrative: ${await narrativeBtn.isEnabled().catch(() => false)}, Interactions: ${await interactionsBtn.isEnabled().catch(() => false)}`
      );
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/crosscut-01-mode-states.png`,
      fullPage: true,
    });
  });

  test('3.2 Panel close mechanisms', async ({ page }) => {
    await page.goto('/?sample=bottleneck');
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });

    // Open panel
    await openMindmapPanel(page);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/crosscut-02-panel-open.png`, fullPage: true });

    // Close via Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    const investigationHeading = page.locator('h2').filter({ hasText: 'Investigation' });
    console.log(
      `Panel visible after Escape: ${await investigationHeading.isVisible().catch(() => false)}`
    );

    // Reopen and close via close button
    await openMindmapPanel(page);
    const closeBtn = page.getByRole('button', { name: /Close investigation panel/i });
    await closeBtn.click();
    await page.waitForTimeout(300);

    console.log(
      `Panel visible after close button: ${await investigationHeading.isVisible().catch(() => false)}`
    );
  });

  test('3.3 InvestigationPrompt nudge after first drill (without mindmap)', async ({ page }) => {
    await page.goto('/?sample=bottleneck');
    await expect(page.locator('[data-testid="chart-ichart"]')).toBeVisible({ timeout: 15000 });

    // Drill via boxplot (not via mindmap)
    await page
      .locator('[data-testid="chart-boxplot"]')
      .getByRole('button', { name: /Select Step 2/ })
      .click();
    await page.waitForTimeout(500);

    // Check if InvestigationPrompt appears
    const promptLink = page.getByText('open the Investigation panel');
    const promptVisible = await promptLink.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Investigation prompt visible after boxplot drill: ${promptVisible}`);

    if (promptVisible) {
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/crosscut-03-investigation-prompt.png`,
        fullPage: true,
      });
      console.log(
        'FINDING: InvestigationPrompt nudge appears after first drill — good discoverability.'
      );
    } else {
      console.log(
        'FINDING: No InvestigationPrompt after boxplot drill — may already be dismissed from this session.'
      );
    }
  });
});
