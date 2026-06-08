---
tier: ephemeral
purpose: build
title: 'PR-CS-P4 - Cycle-time visualization'
status: active
date: 2026-06-08
layer: spec
related:
  - 2026-06-02-connective-surface-model-master-plan
  - 2026-06-02-connective-surface-model-design
  - 2026-06-08-cs-p2-per-step-boxplot
---

# CS-P4 Cycle-Time Visualization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development. Red test first for every task; one commit per task. Run an internal adversarial review before final gates.

**Goal:** Add the Process canvas time axis and a light bottleneck constraint highlight on top of shipped `StepTimingBinding`, `computeOutputRate`, and `computeBottleneck` behavior.

**Architecture:** CS-P2 moved the per-step Values/Capability view into `ConnectedStepCapabilityView` on the shared editor canvas. CS-P4 extends that existing axis switch with a third `Time` axis only when framed step timings have finite per-step data. The time model is pure UI derivation: it computes per-step duration distributions, calls the shipped throughput engine for paired timestamp rows, and renders the engine's bottleneck output distinctly from capability flags.

**Tech Stack:** React 18, TypeScript, Tailwind v4 semantic tokens, Vitest + RTL, `@variscout/{core,hooks,ui}`, Azure app browser verification.

**Branch/worktree:** `feat/cs-p4-cycle-time-viz` in `.worktrees/feat-cs-p4-cycle-time-viz`, based on latest `origin/main`.

---

## Grounding

- Spec §2A.2 defines two different per-step questions: cycle-time bottleneck is a flow constraint; worst-capability step is a quality/capability read. They must never be conflated.
- Spec §2A.4 says `StepTimingBinding` and `computeOutputRate` / `computeBottleneck` are already built; the missing work is visualization, not engine math.
- CS-P2 (#334) shipped `ConnectedStepCapabilityView`, `deriveConnectedStepCapability`, `valueRolesByStepId`, and the Values/Capability segmented control on the Canvas.
- `StepTimingBinding` lives in `packages/core/src/derived/types.ts` and is carried on `ImprovementProject.stepTimings`; `CanvasWorkspace` already reads it from `activeIP?.stepTimings`.
- `computeOutputRate` and `computeBottleneck` live in `packages/core/src/throughput/aggregation.ts`. `computeBottleneck` returns ranks internally, but CS-P4 must not render ranking or leaderboard copy.

## Constraints

- No new stats math. The UI may derive durations from bindings, then call shipped throughput functions.
- No per-step time specs, no Cpk-of-time, and no time target authoring.
- The `Time` axis is hidden when framed data has no finite timing values.
- The bottleneck highlight is a light constraint highlight and must be visually distinct from capability flags.
- Test fixtures use factories, including `packages/ui/src/test-utils/stepTiming.ts`.
- New status copy, if any, uses the ladder `Suspected` / `Supported` / `Ruled out`.
- Run `pnpm --filter @variscout/ui build` as a required gate.

## File Structure

| File                                                                                  | Responsibility                                                                      |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `packages/ui/src/components/ConnectedStepCapability/deriveConnectedStepTime.ts`       | Pure ordered per-step time model from map, rows, and step timings.                  |
| `packages/ui/src/components/ConnectedStepCapability/deriveConnectedStepCapability.ts` | Extend mode type to include `time` without mixing capability and time semantics.    |
| `packages/ui/src/components/ConnectedStepCapability/ConnectedStepCapabilityView.tsx`  | Add conditional Time axis, time boxplots, rate summaries, and bottleneck highlight. |
| `packages/ui/src/components/Canvas/CanvasWorkspace.tsx`                               | Pass `rawData` and `stepTimings` into the connected view.                           |
| `packages/ui/src/components/Canvas/index.tsx`                                         | Pass optional time-model inputs through the non-workspace Canvas host.              |
| `packages/ui/src/test-utils/stepTiming.ts`                                            | Add fixture helpers for paired/duration timing tests.                               |

## Tasks

### Task 1: Commit this contract

- [ ] Create this plan file.
- [ ] Branch guard:

```bash
pwd
git rev-parse --abbrev-ref HEAD
```

Expected: path ends in `.worktrees/feat-cs-p4-cycle-time-viz`; branch is `feat/cs-p4-cycle-time-viz`.

- [ ] Commit:

```bash
git add docs/superpowers/plans/2026-06-08-cs-p4-cycle-time-viz.md
git commit -m "docs(cs-p4): author cycle-time visualization contract"
```

### Task 2: Pure time model

- [ ] Write failing tests in `deriveConnectedStepTime.test.ts` covering:
  - ordered steps follow `ProcessMapNode.order`;
  - paired bindings derive finite per-row durations and call output-rate/bottleneck using paired end timestamps;
  - duration bindings derive distributions but do not invent bucketed output-rate when no timestamp exists;
  - exactly one step has `isConstraint` when rates are available;
  - serialized UI-facing model contains no `worst` language.
- [ ] Run red:

```bash
pnpm --filter @variscout/ui test -- deriveConnectedStepTime
```

- [ ] Implement `deriveConnectedStepTime.ts` and fixture helpers.
- [ ] Run green:

```bash
pnpm --filter @variscout/ui test -- deriveConnectedStepTime
```

- [ ] Commit:

```bash
git add packages/ui/src/components/ConnectedStepCapability/deriveConnectedStepTime.ts packages/ui/src/components/ConnectedStepCapability/__tests__/deriveConnectedStepTime.test.ts packages/ui/src/test-utils/stepTiming.ts
git commit -m "feat(cs-p4): derive per-step time constraint model"
```

### Task 3: Connected view axis

- [ ] Write failing component tests covering:
  - `Time` control is absent without finite time data;
  - `Time` control appears with finite time data and toggles `aria-pressed`;
  - time mode renders `data-testid="connected-step-time-axis"`;
  - bottleneck node and box expose `data-constraint="true"`;
  - capability `Watch` flag can appear on a different step from the time constraint.
- [ ] Run red:

```bash
pnpm --filter @variscout/ui test -- ConnectedStepCapabilityView
```

- [ ] Implement the conditional axis and time rendering in `ConnectedStepCapabilityView`.
- [ ] Run green:

```bash
pnpm --filter @variscout/ui test -- ConnectedStepCapabilityView
```

- [ ] Commit:

```bash
git add packages/ui/src/components/ConnectedStepCapability/
git commit -m "feat(cs-p4): render time axis and bottleneck highlight"
```

### Task 4: Canvas wiring

- [ ] Write failing tests in `CanvasWorkspace.test.tsx` and, if needed, `Canvas.test.tsx` proving `rawData` and `stepTimings` reach `ConnectedStepCapabilityView`.
- [ ] Run red:

```bash
pnpm --filter @variscout/ui test -- CanvasWorkspace.test.tsx Canvas.test.tsx
```

- [ ] Pass `rows` and `stepTimings` through `CanvasWorkspace` and `Canvas`.
- [ ] Keep the existing inline timing badge unless the new model fully replaces it without broadening scope.
- [ ] Run green:

```bash
pnpm --filter @variscout/ui test -- CanvasWorkspace.test.tsx Canvas.test.tsx
```

- [ ] Commit:

```bash
git add packages/ui/src/components/Canvas/CanvasWorkspace.tsx packages/ui/src/components/Canvas/index.tsx packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx packages/ui/src/components/Canvas/__tests__/Canvas.test.tsx
git commit -m "feat(cs-p4): wire framed step timings into Canvas"
```

### Task 5: Review polish and gates

- [ ] Run internal adversarial review for: no time specs, no new stats math, no conflation with capability, no forbidden wording, no leaderboard, and status copy ladder.
- [ ] Commit review fixes if needed:

```bash
git add <review-fix-files>
git commit -m "fix(cs-p4): address cycle-time review gaps"
```

- [ ] Run targeted tests:

```bash
pnpm --filter @variscout/ui test -- deriveConnectedStepTime
pnpm --filter @variscout/ui test -- ConnectedStepCapabilityView
pnpm --filter @variscout/ui test -- CanvasWorkspace.test.tsx Canvas.test.tsx
```

- [ ] Run required build:

```bash
pnpm --filter @variscout/ui build
```

- [ ] Run final gate:

```bash
bash scripts/pr-ready-check.sh
```

- [ ] Browser verify Azure app:
  - load a sample/project with framed paired step timings;
  - confirm Time axis appears;
  - confirm per-step time view renders;
  - confirm bottleneck is highlighted;
  - confirm the bottleneck highlight is visibly distinct from a different worst-capability step;
  - capture screenshot evidence for PR body.

- [ ] Push, open PR with screenshot evidence, then merge:

```bash
git push -u origin feat/cs-p4-cycle-time-viz
gh pr merge --merge --delete-branch
```
