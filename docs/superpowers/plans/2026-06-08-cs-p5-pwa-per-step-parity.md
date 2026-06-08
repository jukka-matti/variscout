---
tier: ephemeral
purpose: build
title: 'PR-CS-P5 - PWA per-step parity'
status: active
date: 2026-06-08
layer: spec
related:
  - 2026-06-02-connective-surface-model-master-plan
  - 2026-06-02-connective-surface-model-design
  - 2026-06-08-cs-p2-per-step-boxplot
  - 2026-06-08-cs-p4-cycle-time-viz
---

# CS-P5 PWA Per-Step Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development. Red test first for every task; one commit per task. Run an internal adversarial review before final gates.

**Goal:** Bring the Process-tab per-step Values / Capability / Time surface to the PWA at parity with Azure, reusing the shared CS-P2/CS-P4 components.

**Architecture:** `CanvasWorkspace` is the shared app wrapper that owns the Process canvas and connected per-step mount. `ConnectedStepCapabilityView` owns the Values / Capability / Time switch and the CS-P4 constraint highlight. PWA work is limited to app-shell wiring and regression coverage so the PWA passes the same rows, process map, active project timings, and spec state into the shared surface without adding PWA-specific visualization code.

**Tech Stack:** React 18, TypeScript, Tailwind v4 semantic tokens, Vitest + RTL, `@variscout/{core,hooks,ui}`, PWA app at `localhost:5173`.

**Branch/worktree:** `feat/cs-p5-pwa-per-step-parity` in `.worktrees/feat-cs-p5-pwa-per-step-parity`, based on latest `origin/main` containing PR #335.

---

## Grounding

- PR-CS-P5 in the master plan brings the Process-tab per-step capability view to PWA; cadence/Status rollups do not come along.
- CS-P2 (#334) shipped the shared `ConnectedStepCapabilityView` with Values / Capability, spec-aware scaling, connected step rail, and error Pareto.
- CS-P4 (#335) extended that same component with `rows`, `stepTimings`, `Time`, `deriveConnectedStepTime`, and the `Constraint` highlight.
- `CanvasWorkspace` already mounts `ConnectedStepCapabilityView` and passes `rawData`, `stepCards`, `capabilityNodes`, `errorSteps`, `valueRolesByStepId`, and `stepTimings`.
- PWA `FrameView` is project-scoped via `useActiveIPContext`; `NoActiveProjectGuidance` remains the correct guard when no active project exists.
- PWA has no AI, cloud collaboration, audit, or document-save identity. This task must not add those capabilities.

## Constraints

- Parity, not reinvention: do not fork or reimplement CS-P2/CS-P4 visuals in `apps/pwa`.
- Respect PWA mount gating: the Process tab remains project-scoped and guarded by `NoActiveProjectGuidance`.
- Test fixtures use factories, especially `createTestIP()` and `createTestStepTiming()`.
- PWA durability remains export/import only; do not add browser-save or reload promises.
- `pnpm --filter @variscout/pwa build` is a required gate.

## File Structure

| File                                                         | Responsibility                                                                                                                                          |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/pwa/src/components/views/__tests__/FrameView.test.tsx` | PWA app-shell regression tests proving active IP timings, persistence callback, hub id, rows/context/specs, and guard behavior reach `CanvasWorkspace`. |
| `apps/pwa/src/lib/landing.ts` and its tests                  | Keep sample landing step timings attached to the active IP; change only if the red test exposes a real gap.                                             |
| `apps/pwa/src/components/views/FrameView.tsx`                | Thin PWA wiring into shared `CanvasWorkspace`; change only if tests expose a gap.                                                                       |

## Tasks

### Task 1: Commit this contract

- [ ] Branch guard:

```bash
pwd
git rev-parse --abbrev-ref HEAD
```

Expected: path ends in `.worktrees/feat-cs-p5-pwa-per-step-parity`; branch is `feat/cs-p5-pwa-per-step-parity`.

- [ ] Commit:

```bash
git add docs/superpowers/plans/2026-06-08-cs-p5-pwa-per-step-parity.md
git commit -m "docs(cs-p5): author PWA per-step parity contract"
```

### Task 2: PWA Canvas wiring regression

- [ ] Write failing tests in `apps/pwa/src/components/views/__tests__/FrameView.test.tsx` proving:
  - the active IP comes from `createTestIP()` with `createTestStepTiming()` timings;
  - `CanvasWorkspace` receives that `activeIP`, `onPersistCanvasState`, `canEditCanvas={true}`, `canvasViewportHubId`, `rawData`, `processContext`, and `measureSpecs`;
  - the no-active-project guard still renders `NoActiveProjectGuidance` and does not call `CanvasWorkspace`.
- [ ] Run red:

```bash
pnpm --filter @variscout/pwa test -- FrameView.test.tsx
```

- [ ] Implement the smallest PWA shell change only if needed.
- [ ] Run green:

```bash
pnpm --filter @variscout/pwa test -- FrameView.test.tsx
```

- [ ] Commit:

```bash
git add apps/pwa/src/components/views/FrameView.tsx apps/pwa/src/components/views/__tests__/FrameView.test.tsx
git commit -m "test(cs-p5): cover PWA per-step Canvas wiring"
```

### Task 3: Bottleneck sample landing regression

- [ ] Locate the PWA landing tests and add a failing test proving `landOnProcess()` preserves `sample.config.stepTimings` on the active IP when loading `Case: The Bottleneck`.
- [ ] Run red:

```bash
pnpm --filter @variscout/pwa test -- landing
```

- [ ] Implement the smallest landing change only if needed.
- [ ] Run green:

```bash
pnpm --filter @variscout/pwa test -- landing
```

- [ ] Commit:

```bash
git add apps/pwa/src/lib/landing.ts apps/pwa/src/**/__tests__/*
git commit -m "test(cs-p5): preserve timed sample bindings in PWA landing"
```

### Task 4: Review polish and gates

- [ ] Run internal adversarial review for: no duplicated per-step UI, Process guard retained, no PWA persistence expansion, no forbidden vocabulary, and PWA/Azure differences limited to AI/cloud/collab/audit.
- [ ] Commit review fixes if needed:

```bash
git add <review-fix-files>
git commit -m "fix(cs-p5): address PWA parity review gaps"
```

- [ ] Run targeted parity checks:

```bash
pnpm --filter @variscout/pwa test -- FrameView.test.tsx
pnpm --filter @variscout/pwa test -- landing
pnpm --filter @variscout/ui test -- ConnectedStepCapabilityView deriveConnectedStepTime CanvasWorkspace.test.tsx
```

- [ ] Run required build:

```bash
pnpm --filter @variscout/pwa build
```

- [ ] Run final gate:

```bash
bash scripts/pr-ready-check.sh
```

- [ ] Browser verify PWA:
  - run PWA at `localhost:5173`;
  - load `Case: The Bottleneck`;
  - confirm the Process tab renders per-step capability;
  - confirm Values / Capability / Time controls render;
  - switch to Time and confirm the constraint highlight appears;
  - capture screenshot evidence for the PR body.

- [ ] Push, open PR with screenshot evidence, then merge:

```bash
git push -u origin feat/cs-p5-pwa-per-step-parity
gh pr merge --merge --delete-branch
```
