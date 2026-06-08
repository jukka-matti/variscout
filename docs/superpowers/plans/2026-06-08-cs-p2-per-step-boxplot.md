---
tier: ephemeral
purpose: build
title: 'PR-CS-P2 — Connected per-step boxplot'
status: active
date: 2026-06-08
layer: spec
related:
  - 2026-06-02-connective-surface-model-master-plan
  - 2026-06-02-connective-surface-model-design
  - 2026-06-07-demo-readiness-master-plan
---

# CS-P2 Per-Step Boxplot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development. Red test first for every task; one commit per task. Steps use checkbox (`- [ ]`) syntax. Use `superpowers:subagent-driven-development` or an internal adversarial review pass before final gates.

**Goal:** Lift the per-step capability view out of the portfolio Dashboard 2x2 and into the shared editor Process canvas as a connected per-step boxplot with a Values/Capability toggle and spec-aware own-values scaling.

**Architecture:** Current main is post-CS-P1 and post-PO extraction: `ProcessHubReviewPanel` and cadence engines are gone, `ProcessHubView` is only a temporary Dashboard host, and `ProcessHubCapabilityTab` holds the old 2x2. CS-P2 moves the surviving capability spatial row into `CanvasWorkspace`, where both Azure and PWA already share the same editor surface. Data comes from the live editor tuple: `processContext.processMap` + active `ImprovementProject` + `rawData`.

**Tech Stack:** React 18, TypeScript, Tailwind v4 semantic tokens, Vitest + RTL, `@variscout/{core,hooks,ui,charts,stores}` plus Azure/PWA app shells.

**Branch/worktree:** `feat/cs-p2-per-step-boxplot` in `.worktrees/feat-cs-p2-per-step-boxplot`, based on latest `origin/main`.

---

## Constraints

- Honor ADR-073: never force a sortable Cpk rank when a node has heterogeneous per-context specs; use the per-context distribution.
- No leaderboard and no "worst step" rank text. The answer is visual: boxplot + eye; step node flags may call attention without ranking.
- Keep `StepErrorPareto` as a secondary count-based view.
- CS-P3 authoring remains out of scope; consume existing `ctqColumn`/`capabilityScope.specRules` and test fixtures.
- CS-P4 cycle-time visualization remains out of scope, but Values-mode scaling must support the time baseline rule.
- Both apps must get the same behavior through shared `CanvasWorkspace`; app-specific wiring should stay minimal.
- If new i18n keys are introduced, update `packages/core/src/i18n/types.ts` and all 32 catalogs. Prefer local non-catalog labels only if matching nearby Canvas practice.

## File Structure

| File                                                                                         | Responsibility                                                                                       |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `packages/hooks/src/buildEditorCapabilitySource.ts`                                          | Pure seam from editor inputs to `{ hub, members, rowsByAnalyze }` for `useProductionLineGlanceData`. |
| `packages/hooks/src/__tests__/buildEditorCapabilitySource.test.ts`                           | Red/green seam tests for active IP rows, mapping derivation, and empty safe output.                  |
| `packages/ui/src/components/ConnectedStepCapability/deriveConnectedStepCapability.ts`        | Pure ordered view model, capability flags, values-mode box stats, and spec-aware scaling.            |
| `packages/ui/src/components/ConnectedStepCapability/ConnectedStepCapabilityView.tsx`         | Shared Canvas L2 connected flow + capability strip + Values/Capability control + Pareto region.      |
| `packages/ui/src/components/ConnectedStepCapability/__tests__/*`                             | Pure model and component tests.                                                                      |
| `packages/ui/src/components/Canvas/CanvasWorkspace.tsx`                                      | Build editor capability source, pass data to Canvas, remove fake empty preview source.               |
| `packages/ui/src/components/Canvas/index.tsx`                                                | Render connected view above the step card surface.                                                   |
| `packages/ui/src/index.ts`                                                                   | Export the connected view only if needed outside Canvas tests.                                       |
| `apps/azure/src/pages/Dashboard.tsx` and tests                                               | Retire the temporary Dashboard 2x2 host.                                                             |
| `apps/azure/src/components/ProcessHubView.tsx`, `ProcessHubCapabilityTab.tsx`, related tests | Delete if no longer mounted after Dashboard retirement.                                              |

---

### Task 1: Commit this contract

**Files:**

- Create: `docs/superpowers/plans/2026-06-08-cs-p2-per-step-boxplot.md`

- [ ] **Step 1: Write the plan file** with current-main grounding, constraints, tasks, tests, and gates.
- [ ] **Step 2: Branch guard**

Run:

```bash
pwd
git rev-parse --abbrev-ref HEAD
```

Expected: path ends in `.worktrees/feat-cs-p2-per-step-boxplot`; branch is `feat/cs-p2-per-step-boxplot`.

- [ ] **Step 3: Commit and push**

```bash
git add docs/superpowers/plans/2026-06-08-cs-p2-per-step-boxplot.md
git commit -m "docs(cs-p2): author per-step boxplot implementation contract"
git push -u origin feat/cs-p2-per-step-boxplot
```

### Task 2: Editor capability data seam

**Files:**

- Create: `packages/hooks/src/buildEditorCapabilitySource.ts`
- Test: `packages/hooks/src/__tests__/buildEditorCapabilitySource.test.ts`
- Modify: `packages/hooks/src/index.ts`

- [ ] **Step 1: Write failing tests** proving:
  - active IP + map + rows returns one member and a `rowsByAnalyze` entry keyed by active IP id;
  - mappings derive from each node's `ctqColumn`;
  - nodes without `ctqColumn` do not produce mappings;
  - missing active IP or missing map returns an empty source with no rows.
- [ ] **Step 2: Run red**

```bash
pnpm --filter @variscout/hooks test -- buildEditorCapabilitySource
```

- [ ] **Step 3: Implement** a pure helper:

```ts
buildEditorCapabilitySource({
  hubId,
  hubName,
  processMap,
  activeIP,
  rows,
}): { hub: ProcessHub; members: ProcessStepCapabilityMember[]; rowsByAnalyze: Map<string, readonly DataRow[]> }
```

Use `activeIP.id` as member id and `metadata.processHubId`, derive `nodeMappings` from `processMap.nodes[].ctqColumn`, and set `hub.canonicalProcessMap = processMap`.

- [ ] **Step 4: Run green**

```bash
pnpm --filter @variscout/hooks test -- buildEditorCapabilitySource
```

- [ ] **Step 5: Commit**

```bash
git add packages/hooks/src/buildEditorCapabilitySource.ts packages/hooks/src/__tests__/buildEditorCapabilitySource.test.ts packages/hooks/src/index.ts
git commit -m "feat(cs-p2): build editor capability source for Canvas"
```

### Task 3: Connected per-step view model and scaling

**Files:**

- Create: `packages/ui/src/components/ConnectedStepCapability/deriveConnectedStepCapability.ts`
- Test: `packages/ui/src/components/ConnectedStepCapability/__tests__/deriveConnectedStepCapability.test.ts`

- [ ] **Step 1: Write failing tests** covering:
  - step order follows `ProcessMapNode.order`;
  - Capability mode uses per-context Cpk values and does not require `result.cpk`;
  - Values mode keeps raw values in labels/stats;
  - two-sided specs normalize to a common visual spec window;
  - one-sided specs start from 0;
  - time-like mode can use the same zero baseline rule;
  - no returned field exposes rank or ordinal worst-step ordering.
- [ ] **Step 2: Run red**

```bash
pnpm --filter @variscout/ui test -- deriveConnectedStepCapability
```

- [ ] **Step 3: Implement** pure derivation:
  - `ConnectedStepCapabilityMode = 'capability' | 'values'`;
  - per-step flag states: `none | no-data | no-specs | review | capable | watch`;
  - `normalization.baselineKind = 'spec-window' | 'zero'`;
  - `scaled` values used only for layout, with raw values retained.
- [ ] **Step 4: Run green**
- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/ConnectedStepCapability/
git commit -m "feat(cs-p2): derive connected step capability model"
```

### Task 4: Connected Canvas UI

**Files:**

- Create: `packages/ui/src/components/ConnectedStepCapability/ConnectedStepCapabilityView.tsx`
- Create: `packages/ui/src/components/ConnectedStepCapability/index.ts`
- Test: `packages/ui/src/components/ConnectedStepCapability/__tests__/ConnectedStepCapabilityView.test.tsx`
- Modify: `packages/ui/src/components/Canvas/index.tsx`
- Test: `packages/ui/src/components/Canvas/__tests__/Canvas.test.tsx`

- [ ] **Step 1: Write failing component tests** asserting:
  - `Values` and `Capability` buttons toggle `aria-pressed`;
  - flow rail and boxplot strip render the same ordered step ids;
  - hovering/focusing a step coordinates highlight between node and box;
  - branching maps render linked views marker instead of implying a linear-only axis;
  - `StepErrorPareto` remains mounted;
  - no ranking text is rendered.
- [ ] **Step 2: Run red**

```bash
pnpm --filter @variscout/ui test -- ConnectedStepCapabilityView Canvas.test.tsx
```

- [ ] **Step 3: Implement**:
  - a compact full-width Canvas L2 band above `canvas-card-surface`;
  - SVG or div-based box glyphs with stable dimensions;
  - light node flags using semantic status colors;
  - `StepErrorPareto` in a secondary area;
  - no nested card-in-card layout and no leaderboard.
- [ ] **Step 4: Run green**
- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/ConnectedStepCapability packages/ui/src/components/Canvas/index.tsx packages/ui/src/components/Canvas/__tests__/Canvas.test.tsx
git commit -m "feat(cs-p2): render connected per-step capability on Canvas"
```

### Task 5: Wire CanvasWorkspace and both app parity

**Files:**

- Modify: `packages/ui/src/components/Canvas/CanvasWorkspace.tsx`
- Test: `packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx`
- Test/app checks: Azure and PWA FrameView focused tests if existing assertions need update.

- [ ] **Step 1: Write failing tests** proving `CanvasWorkspace` calls `useProductionLineGlanceData` with non-empty member + rows for an active IP and map.
- [ ] **Step 2: Run red**

```bash
pnpm --filter @variscout/ui test -- CanvasWorkspace.test.tsx -t "capability source"
```

- [ ] **Step 3: Implement** by replacing the fake `previewSource` with `buildEditorCapabilitySource`.
- [ ] **Step 4: Run green**

```bash
pnpm --filter @variscout/ui test -- CanvasWorkspace.test.tsx
pnpm --filter @variscout/azure-app test -- FrameView
pnpm --filter @variscout/pwa test -- FrameView
```

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/CanvasWorkspace.tsx packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx apps/azure/src/components/editor/__tests__ apps/pwa/src/components/views/__tests__
git commit -m "feat(cs-p2): feed live editor data into per-step capability"
```

### Task 6: Retire Dashboard 2x2 host

**Files:**

- Modify: `apps/azure/src/pages/Dashboard.tsx`
- Delete if unused: `apps/azure/src/components/ProcessHubView.tsx`, `apps/azure/src/components/ProcessHubCapabilityTab.tsx`, related tests.
- Modify: `apps/azure/src/pages/__tests__/Dashboard.processHub.test.tsx`, `Dashboard.editFraming.test.tsx`, `apps/azure/e2e/modeB-framing.spec.ts` if selectors reference retired host.

- [ ] **Step 1: Write failing/negative tests**:
  - Dashboard no longer renders `process-hub-surface`;
  - hub selector and evidence panel still behave;
  - `Add framing` path remains reachable through the surviving Dashboard flow or is explicitly moved to Home/Project if no Dashboard host remains.
- [ ] **Step 2: Run red**

```bash
pnpm --filter @variscout/azure-app test -- Dashboard.processHub Dashboard.editFraming
```

- [ ] **Step 3: Implement** retirement:
  - remove `ProcessHubView` import and mount from Dashboard;
  - keep hub selector and `ProcessHubEvidencePanel`;
  - remove `handleHubCpkTargetCommit` and `handleHubGoalChange` only if no remaining caller;
  - delete the temporary host components/tests only after `rg` proves no remaining production mount.
- [ ] **Step 4: Run green**
- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/pages/Dashboard.tsx apps/azure/src/pages/__tests__/Dashboard.processHub.test.tsx apps/azure/src/pages/__tests__/Dashboard.editFraming.test.tsx apps/azure/e2e/modeB-framing.spec.ts apps/azure/src/components
git commit -m "feat(cs-p2): retire Dashboard per-step capability host"
```

### Task 7: Final review and gates

- [ ] Run internal adversarial diff review focused on ADR-073, no leaderboard, parity, and Dashboard retirement.
- [ ] Run targeted builds/tests:

```bash
pnpm --filter @variscout/ui build
pnpm --filter @variscout/hooks test -- buildEditorCapabilitySource
pnpm --filter @variscout/ui test -- ConnectedStepCapability Canvas.test.tsx CanvasWorkspace.test.tsx
pnpm --filter @variscout/azure-app test -- Dashboard.processHub Dashboard.editFraming FrameView
pnpm --filter @variscout/pwa test -- FrameView
```

- [ ] Run final gate:

```bash
bash scripts/pr-ready-check.sh
```

- [ ] Browser verify Azure app at 13-15 inch viewport:
  - multi-step sample loads;
  - connected step boxes are visible on Process canvas;
  - Values/Capability toggle changes the band;
  - heterogeneous Values scaling is visually comparable by spec window;
  - no Cpk rank/leaderboard;
  - Dashboard no longer shows the 2x2 host.
- [ ] Open PR with screenshot evidence, per-task commits, and "Phase 2P / CS-P2, demo-readiness master plan".
- [ ] Merge:

```bash
gh pr merge --merge --delete-branch
```
