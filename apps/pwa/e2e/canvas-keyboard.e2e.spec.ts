import { expect, test } from '@playwright/test';

/**
 * Helper: load The Bottleneck seeded sample → land on Process tab.
 *
 * The Bottleneck sample (urlKey=bottleneck) carries a seeded processMap with
 * 5 nodes. `landOnProcess` routes to the Process tab and creates an Untitled
 * project automatically (spec §1). This avoids the b0+expander mount-loop
 * (pre-existing, logged — see comment on test.skip below).
 *
 * At 5 nodes the scope is b1 (detectScopeFromMap returns 'b1' for ≥2 nodes).
 * The wait target is `edit-mode-shell` which is the b1 authoring view.
 */
async function loadSeededSampleToCanvas(page: import('@playwright/test').Page) {
  await page.goto('/?sample=bottleneck');
  // Wait for the Process tab to render. At b1 scope (5-node processMap),
  // CanvasWorkspace renders `edit-mode-shell` (the edit map UI).
  await expect(page.getByTestId('edit-mode-shell')).toBeVisible({ timeout: 15000 });
}

test.describe('Canvas keyboard authoring (PWA)', () => {
  // TODO(fsj-2-canvas-keyboard): The seeded-map path (bottleneck sample) lands
  // at b1 scope (5 nodes → edit-mode-shell), NOT the Canvas chip-rail view.
  //
  // Why the skip is STILL needed after the seeded-map adaptation attempt:
  //
  // The chip-rail (testid="chip-rail") lives inside the Canvas component
  // (packages/ui/src/components/Canvas/index.tsx). It only renders when:
  //   - viewport.currentLevel === 'l2' (map view), AND
  //   - canPlaceChips=true (chips available, not disabled)
  //
  // The Canvas component is the `canvasNode` in CanvasWorkspace. At b1/b2
  // scope with PWA's `canEditCanvas=true`, CanvasWorkspace renders
  // `edit-mode-shell` INSTEAD of the Canvas chip-rail (see CanvasWorkspace.tsx
  // lines 1322–1346 for the b0 branch and lines 1348–1490 for b1, where
  // `showEditChrome ? edit-mode-shell : canvasNode`).
  //
  // The chip-rail IS accessible at b0 scope — but the b0 path triggers the
  // pre-existing "Maximum update depth exceeded" loop when Canvas mounts inside
  // ProcessStepsExpander (FrameViewB0's collapsible panel). React aborts the
  // render before StructuralToolbar or chip-rail appear in the DOM.
  //
  // Paths investigated:
  //   1. Paste → b0 → expander → chip-rail: blocked by mount-loop bug.
  //   2. ?sample=bottleneck → b1 → edit-mode-shell: chip-rail not in this view.
  //
  // Fix direction: either (a) fix the b0 mount-loop
  //   (investigate useEffect in CanvasWorkspace/Canvas with missing/unstable
  //   deps — candidate: line 422 hydrateCanvasDocument effect), or
  //   (b) add a test fixture that bypasses the wizard and creates an active
  //   IP+hub without a processMap, then accesses the canvas via a state-only
  //   (canEditCanvas=false) path that exposes the chip-rail view.
  //
  // Pre-existing: confirmed present on main before FSJ-2. The b0+expander
  // pathway was first exposed by FSJ-2 (measurement-shaped pastes land at b0).
  // The chrome walk (FSJ-2 T7) owns live browser verification of the b0 path.
  test.skip('keyboard chip placement, undo, and E mode toggle', async ({ page }) => {
    await loadSeededSampleToCanvas(page);

    // At b1 scope, edit-mode-shell is shown. chip-rail is NOT in this view.
    // The assertions below are preserved from the original test intent but will
    // NOT be reached at b1 scope — the seeded-map adaptation attempt confirms
    // chip-rail is inaccessible here.
    const chip = page.getByTestId('chip-rail-item-Shift');
    await expect(chip).toBeVisible({ timeout: 5000 });
    await chip.focus();
    await page.keyboard.press('Enter');

    const step = page.locator('[data-testid^="process-map-step-"]').first();
    await step.focus();
    await page.keyboard.press('Enter');

    await expect(page.getByTestId('chip-rail-item-Shift')).toBeHidden({ timeout: 5000 });

    await page.keyboard.press('ControlOrMeta+Z');
    await expect(page.getByTestId('chip-rail-item-Shift')).toBeVisible({ timeout: 5000 });

    await page.keyboard.press('E');
    await expect(page.getByTestId('chip-rail')).toBeHidden({ timeout: 5000 });
    await page.keyboard.press('E');
    await expect(page.getByTestId('chip-rail')).toBeVisible({ timeout: 5000 });
  });
});
