---
tier: ephemeral
purpose: build
title: 'L-4 — Wall fit-to-content + Fit control'
status: active
date: 2026-06-07
layer: spec
related:
  - docs/superpowers/specs/2026-06-07-analyze-wall-legibility-design.md
  - docs/superpowers/plans/2026-06-07-demo-readiness-master-plan.md
---

# L-4: Wall Fit-to-Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development. Red test first for every task; one commit per task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** The populated Analyze Wall fills the available viewport on cold start and can be recentered with `F` or a visible `⌖ Fit` control.

**Architecture:** Add pure bbox math to `wallLayout.ts`, using the existing deterministic `WallLayout` position maps as the authority for hubs, findings, factor glyphs, and the scope anchor. `WallCanvas` uses that bbox as the populated SVG `viewBox`, extending the existing zero-hub crop pattern. Both apps wire the existing `useWallKeyboard` `onFit` hook and a desktop Fit button to reset Wall zoom/pan to the fitted view.

**Tech Stack:** TypeScript, React, Zustand canvas viewport store, Vitest + RTL, Playwright/browser verification.

**Worktree/branch:** `feat/l4-wall-fit-to-content` from latest `origin/main`.

---

## Constraints

- Use a dedicated worktree: `.worktrees/feat/l4-wall-fit-to-content/`.
- Keep processing browser-only and do not touch domain persistence.
- Do not implement Snap-river, band-anchored relayout, or process-map ordering. This PR only fits the existing layout.
- Fit must work with zero process-map bindings; orphan hubs/findings must still be included.
- Tests must use factories for domain fixtures, never bare literals.
- Both apps must land in parity: PWA and Azure both wire `F` and the visible `⌖ Fit` control.
- `pnpm --filter @variscout/ui build` is a required gate.

## Scope Fence

IN: pure content bbox utility, populated Wall viewBox crop, keyboard `F` tests, PWA/Azure Fit control wiring, browser verification.

OUT: Snap-river, semantic zoom clustering, matrix lens, right narrator rail, vocabulary/status changes, evidence-angle work.

---

### Task 0: Branch + Contract Commit

**Files:**

- Create: `docs/superpowers/plans/2026-06-07-l4-wall-fit-to-content.md`

- [ ] **Step 1: Create the worktree**

```bash
git fetch origin
git worktree add .worktrees/feat/l4-wall-fit-to-content -b feat/l4-wall-fit-to-content origin/main
cd .worktrees/feat/l4-wall-fit-to-content
pnpm install
```

- [ ] **Step 2: Save this plan at the path above**

- [ ] **Step 3: Branch guard before commit**

```bash
pwd
git rev-parse --abbrev-ref HEAD
```

Expected: path ends in `.worktrees/feat/l4-wall-fit-to-content`; branch is `feat/l4-wall-fit-to-content`.

- [ ] **Step 4: Commit and push the contract**

```bash
git add docs/superpowers/plans/2026-06-07-l4-wall-fit-to-content.md
git commit -m "docs: plan L-4 wall fit to content"
git push -u origin feat/l4-wall-fit-to-content
```

- [ ] **Step 5: STOP for plan review**

### Task 1: Pure Wall Content Bbox

**Files:**

- Modify: `packages/ui/src/components/AnalyzeWall/wallLayout.ts`
- Test: `packages/ui/src/components/AnalyzeWall/__tests__/wallLayout.test.ts`

- [ ] **Step 1: Write failing tests**

Add tests for:

- hub card bounds from `hubPositions`
- linked and orphan finding chip bounds from `findingPositions`
- factor glyph bounds from `factorPositions`
- scope anchor bounds from `scopeAnchor`
- empty layout fallback to full canvas

Example assertions:

```ts
const layout = computeWallLayout(
  baseArgs({
    hubs: [{ id: 'h1', findingIds: ['f1'], counterFindingIds: [] }],
    findings: [{ id: 'f1' }, { id: 'orphan-1' }],
    factors: [{ key: 'Shift', contribution: 0.8 }],
  })
);
const bbox = computeWallContentBBox(layout);
expect(bbox.x).toBeLessThanOrEqual(-30); // orphan chip at x=80, width=220
expect(bbox.y).toBeLessThanOrEqual(40); // scope anchor
expect(bbox.width).toBeGreaterThan(0);
expect(bbox.height).toBeGreaterThan(0);
```

Run:

```bash
pnpm --filter @variscout/ui test -- wallLayout.test.ts -t "content bbox"
```

Expected: FAIL because `computeWallContentBBox` does not exist.

- [ ] **Step 2: Implement the utility**

Add exported types/functions in `wallLayout.ts`:

```ts
export interface WallContentBBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const HUB_CARD_W = 280;
const HUB_CARD_H = 288;
const FINDING_CHIP_W = 220;
const FINDING_CHIP_H = 70; // includes orphan propose affordance clearance
const FACTOR_GLYPH_W = 180; // includes focused explore button clearance
const FACTOR_GLYPH_H = 64;
const SCOPE_CARD_W = 320;
const SCOPE_CARD_H = 160;
const CONTENT_PADDING = 80;

export function computeWallContentBBox(layout: WallLayout): WallContentBBox {
  const boxes: Array<{ left: number; top: number; right: number; bottom: number }> = [];

  boxes.push({
    left: layout.scopeAnchor.x - SCOPE_CARD_W / 2,
    top: layout.scopeAnchor.y,
    right: layout.scopeAnchor.x + SCOPE_CARD_W / 2,
    bottom: layout.scopeAnchor.y + SCOPE_CARD_H,
  });

  for (const pos of layout.hubPositions.values()) {
    boxes.push({
      left: pos.x - HUB_CARD_W / 2,
      top: pos.y,
      right: pos.x + HUB_CARD_W / 2,
      bottom: pos.y + HUB_CARD_H,
    });
  }

  for (const pos of layout.findingPositions.values()) {
    boxes.push({
      left: pos.x - FINDING_CHIP_W / 2,
      top: pos.y,
      right: pos.x + FINDING_CHIP_W / 2,
      bottom: pos.y + FINDING_CHIP_H,
    });
  }

  for (const pos of layout.factorPositions.values()) {
    boxes.push({
      left: pos.x - FACTOR_GLYPH_W / 2,
      top: pos.y - FACTOR_GLYPH_H / 2,
      right: pos.x + FACTOR_GLYPH_W / 2,
      bottom: pos.y + FACTOR_GLYPH_H / 2,
    });
  }

  if (boxes.length === 0) return { x: 0, y: 0, width: 2000, height: 1400 };

  const left = Math.min(...boxes.map(b => b.left)) - CONTENT_PADDING;
  const top = Math.min(...boxes.map(b => b.top)) - CONTENT_PADDING;
  const right = Math.max(...boxes.map(b => b.right)) + CONTENT_PADDING;
  const bottom = Math.max(...boxes.map(b => b.bottom)) + CONTENT_PADDING;

  return { x: left, y: top, width: right - left, height: bottom - top };
}

export function formatWallViewBox(bbox: WallContentBBox): string {
  return `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`;
}
```

- [ ] **Step 3: Run tests**

```bash
pnpm --filter @variscout/ui test -- wallLayout.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/components/AnalyzeWall/wallLayout.ts packages/ui/src/components/AnalyzeWall/__tests__/wallLayout.test.ts
git commit -m "feat(ui): compute wall content bounds"
```

### Task 2: Populated Wall Uses Fitted ViewBox

**Files:**

- Modify: `packages/ui/src/components/AnalyzeWall/WallCanvas.tsx`
- Test: `packages/ui/src/components/AnalyzeWall/__tests__/WallCanvas.test.tsx`

- [ ] **Step 1: Write failing tests**

Add tests that render with factory-created hubs/findings/factors and assert the populated SVG `viewBox` is no longer `0 0 2000 1400`.

```tsx
const { container } = render(
  <WallCanvas
    hubs={[createHypothesis('Nozzle runs hot', '', ['f1'])]}
    findings={[createFinding('obs 32-58 elevated', {}, null)]}
    processMap={processMap}
    problemCpk={0.78}
    eventsPerWeek={42}
    modelBuilderProps={{
      candidateFactors: ['Shift'],
      scopeLabel: 'All data',
      scopeRows: [{ Shift: 'Night', CycleTime: 12 }],
    }}
    outcomeColumn="CycleTime"
    rows={[{ Shift: 'Night', CycleTime: 12 }]}
  />
);
expect(container.querySelector('svg')?.getAttribute('viewBox')).not.toBe('0 0 2000 1400');
```

Also add a regression that mobile destination rendering still uses `MobileCardList`, and overlay mode still keeps the full static viewBox.

Run:

```bash
pnpm --filter @variscout/ui test -- WallCanvas.test.tsx -t "viewBox"
```

Expected: FAIL because populated viewBox is still full-canvas.

- [ ] **Step 2: Implement**

Import the bbox helpers:

```ts
import {
  computeWallLayout,
  buildWallLayoutArgs,
  computeWallContentBBox,
  formatWallViewBox,
} from './wallLayout';
```

Add:

```ts
const populatedViewBox = useMemo(
  () => formatWallViewBox(computeWallContentBBox(wallLayout)),
  [wallLayout]
);
```

Change only the populated destination SVG:

```tsx
<svg
  ref={svgRef}
  viewBox={populatedViewBox}
  preserveAspectRatio="xMidYMid meet"
  className="bg-background text-content flex-1"
  role="img"
  aria-label={getMessage(locale, 'wall.canvas.ariaLabel')}
>
```

Do not change overlay mode’s defensive full-canvas SVG or the existing zero-hub `coldStartViewBox` branch.

- [ ] **Step 3: Run tests**

```bash
pnpm --filter @variscout/ui test -- WallCanvas.test.tsx
pnpm --filter @variscout/ui build
```

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/components/AnalyzeWall/WallCanvas.tsx packages/ui/src/components/AnalyzeWall/__tests__/WallCanvas.test.tsx
git commit -m "feat(ui): fit populated wall viewbox to content"
```

### Task 3: Keyboard Fit Contract

**Files:**

- Modify: `packages/ui/src/components/AnalyzeWall/__tests__/useWallKeyboard.test.tsx`

- [ ] **Step 1: Add tests for the existing `F` stub**

```ts
it('calls onFit for F', () => {
  const onFit = vi.fn();
  renderHook(() => useWallKeyboard({ onFit }));
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }));
  expect(onFit).toHaveBeenCalledTimes(1);
});

it('does not call onFit while typing in an input', () => {
  const onFit = vi.fn();
  renderHook(() => useWallKeyboard({ onFit }));
  const input = document.createElement('input');
  document.body.appendChild(input);
  input.focus();
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', bubbles: true }));
  expect(onFit).not.toHaveBeenCalled();
  input.remove();
});
```

Run:

```bash
pnpm --filter @variscout/ui test -- useWallKeyboard.test.tsx
```

Expected: PASS unless the existing stub regressed.

- [ ] **Step 2: Commit**

```bash
git add packages/ui/src/components/AnalyzeWall/__tests__/useWallKeyboard.test.tsx
git commit -m "test(ui): pin wall fit shortcut"
```

### Task 4: PWA Fit Wiring

**Files:**

- Modify: `apps/pwa/src/components/views/AnalyzeView.tsx`

- [ ] **Step 1: Add app-level fit callback**

Near the pan/zoom store selectors:

```ts
const fitWallToContent = useCallback(() => {
  useCanvasViewportStore.getState().fitToContent(wallHubId, 'l2', {
    zoom: 1,
    pan: { x: 0, y: 0 },
  });
}, [wallHubId]);
```

- [ ] **Step 2: Wire keyboard**

```ts
useWallKeyboard({
  onSearch: () => {
    if (wallViewMode === 'wall' && !wallIsMobile) setPaletteOpen(true);
  },
  onFit: () => {
    if (wallViewMode === 'wall' && !wallIsMobile) fitWallToContent();
  },
});
```

- [ ] **Step 3: Add visible desktop Fit button near sibling Wall controls**

Inside the existing `!wallIsMobile` sibling controls block, before the minimap:

```tsx
<button
  type="button"
  onClick={fitWallToContent}
  aria-label="Fit Wall to content"
  title="Fit Wall to content"
  className="absolute bottom-4 right-40 rounded border border-edge bg-surface-secondary px-2.5 py-1 text-xs font-medium text-content shadow-sm hover:bg-surface-tertiary focus:outline-none focus:ring-2 focus:ring-ring"
>
  ⌖ Fit
</button>
```

- [ ] **Step 4: Compile smoke**

```bash
pnpm --filter @variscout/pwa build
```

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/components/views/AnalyzeView.tsx
git commit -m "feat(pwa): wire wall fit control"
```

### Task 5: Azure Fit Wiring

**Files:**

- Modify: `apps/azure/src/components/editor/AnalyzeWorkspace.tsx`

- [ ] **Step 1: Mirror PWA callback**

```ts
const fitWallToContent = useCallback(() => {
  useCanvasViewportStore.getState().fitToContent(wallHubId, 'l2', {
    zoom: 1,
    pan: { x: 0, y: 0 },
  });
}, [wallHubId]);
```

- [ ] **Step 2: Wire keyboard**

```ts
useWallKeyboard({
  onSearch: () => {
    if (wallViewMode === 'wall' && !wallIsMobile) setWallPaletteOpen(true);
  },
  onFit: () => {
    if (wallViewMode === 'wall' && !wallIsMobile) fitWallToContent();
  },
});
```

- [ ] **Step 3: Add matching Fit button**

Inside the existing desktop sibling controls block before the minimap:

```tsx
<button
  type="button"
  onClick={fitWallToContent}
  aria-label="Fit Wall to content"
  title="Fit Wall to content"
  className="absolute bottom-4 right-40 rounded border border-edge bg-surface-secondary px-2.5 py-1 text-xs font-medium text-content shadow-sm hover:bg-surface-tertiary focus:outline-none focus:ring-2 focus:ring-ring"
>
  ⌖ Fit
</button>
```

- [ ] **Step 4: Compile smoke**

```bash
pnpm --filter @variscout/azure-app build
```

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/components/editor/AnalyzeWorkspace.tsx
git commit -m "feat(azure): wire wall fit control"
```

### Task 6: Verification + Internal Review

**Files:**

- No expected source edits unless review finds a defect.

- [ ] **Step 1: Run targeted checks**

```bash
pnpm --filter @variscout/ui test -- wallLayout.test.ts WallCanvas.test.tsx useWallKeyboard.test.tsx
pnpm --filter @variscout/ui build
pnpm --filter @variscout/pwa build
pnpm --filter @variscout/azure-app build
```

- [ ] **Step 2: Internal adversarial review**

Check:

- bbox covers all `wallLayout` maps plus `scopeAnchor`
- no Snap-river or process-map ordering logic was added
- orphan findings work without process-map bindings
- overlay/mobile branches are unchanged
- both apps use identical fit behavior

- [ ] **Step 3: Full self-merge gate**

```bash
bash scripts/pr-ready-check.sh
```

Expected: green.

- [ ] **Step 4: Browser verification**

Run the PWA:

```bash
pnpm dev
```

Browser path:

1. Load the app.
2. Load the “The Bottleneck” sample.
3. Capture two findings.
4. Promote one finding to a suspected cause so the Wall is populated.
5. Enter the Wall and confirm cards are centered, legible, and not microscopic.
6. Pan away.
7. Click `⌖ Fit`; confirm Wall recenters.
8. Pan away again.
9. Press `F`; confirm Wall recenters.
10. Capture screenshot evidence for the PR body.

- [ ] **Step 5: PR and merge**

```bash
git push
gh pr create --fill --body-file /tmp/l4-wall-fit-to-content-pr.md
gh pr merge --merge --delete-branch
```

Never use `--squash`.
