---
title: Canvas PR8 sub-PR 8a — Mode-aware response-path CTAs
audience: [engineer]
category: implementation-plan
status: active
last-reviewed: 2026-05-07
related:
  - docs/superpowers/plans/2026-05-07-canvas-pr8-vision-alignment-master.md
  - docs/superpowers/specs/2026-05-03-variscout-vision-design.md
  - docs/investigations.md
---

# Canvas PR8 sub-PR 8a — Mode-aware response-path CTAs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded `disabled` state on the Charter / Sustainment / Handoff CTAs in `CanvasStepOverlay` with a mode-and-tier-aware state machine, so the drill-down honors vision §5.3 ("Cadence-mode shows all five active; first-time / no-Hub mode shows Quick action + Focused investigation active; Sustainment / Charter / Handoff dimmed with a tier-upgrade hint") and §2.4's five-response-path commitment.

**Architecture:** Two pure helpers + prop-threading. `computeHubMode()` lives in `@variscout/core` (deterministic from `assignmentsComplete && stepsAuthored && hasPriorSnapshot`, with `'demo'` as an explicit override apps can pass for seeded showcases). `computeCtaState()` lives in `packages/ui/src/components/Canvas/internal/` (deterministic from `(path, hubMode, isPaid, hasHandler)`). `CanvasStepOverlay` consumes both via props and renders one of four CTA states: `active` / `tier-locked` / `hub-immature` / `awaiting-impl`. No new persistent state — pure UI logic; layer-neutral per master plan §3 D3 (no F4 dependency). Quick action and Focused investigation stay always-active (subject to handler presence). Charter / Sustainment / Handoff are tier-gated for free tier and hub-gated for first-time. `'demo'` mode bypasses both gates so seeded showcases demonstrate the full surface.

**Tech Stack:** TypeScript, React 18, Vitest, React Testing Library, Tailwind v4, `@variscout/core/i18n` (typed message catalog), `@variscout/hooks` `useTier`.

---

## ⚠️ AMENDMENT 2026-05-07 — supersedes the tier model + charter gating below

**Read this before implementing.** Two product decisions during plan review override significant portions of the original plan. The original plan structure (file paths, task ordering, helper _placement_) stays valid; what changes is the **gating logic**, the **state set**, the **prop shape**, and the **scope of `computeHubMode`**.

### Why amended

1. **DMAIC reality check.** Project Charter is the **first step** of the Define phase, not a late-stage workflow gate ([SixSigma Institute](https://www.sixsigma-institute.org/Six_Sigma_DMAIC_Process_Define_Phase_Six_Sigma_Project_Charter.php), [DMAIC.com](https://www.dmaic.com/faq/project-charter/), [SixSigma.us — Charter and Define Are Inseparable](https://www.6sigma.us/project-management/the-project-charter-and-define-phase-are-inseparable/), [GoLeanSixSigma](https://goleansixsigma.com/dmaic-five-basic-phases-of-lean-six-sigma/)). Charter is the _artifact_ that scopes the problem at project start, NOT something gated by accumulated cadence. The original plan's `'first-time' → hub-immature` for Charter is methodologically wrong — a paid-tier user with a brand-new ProcessHub charters a project on day 1, not after months.

2. **Tier reframe (per `feedback_pwa_philosophy` "same analysis everywhere").** All five response paths are now **tier-active in PWA + Azure**. The collaboration / signoff / audit-trail / alerting / RACI features that justify paid-tier are _inside each surface_ (Charter form's "Request team approval" button; Sustainment's continuous-monitoring infrastructure), NOT at the response-path-button level. Document authoring and structured workflow surfaces serve PWA's pedagogy + `.vrs` export use cases (LSSGB students learn DMAIC by writing charters; trainers package model charters in `.vrs` scenarios; consultants draft charters in PWA before bringing to clients). 8a punts the team-features tier-gate inside each surface to its own future slice.

### What this changes

#### 1. Drop "cadence" / "first-time" / "demo" mode entirely from these CTAs

`computeHubMode` was conflating two orthogonal gates: subscription tier AND workflow position. Per Q2 (all 5 free-tier-active), there is no tier gate at this layer. Per Q1 (Charter has no workflow prerequisite), the workflow gate doesn't apply to Charter either. Sustainment + Handoff still have workflow prerequisites — but those are _prerequisite-based_, not _cadence-based_.

**Replace** the `'cadence' | 'first-time' | 'demo'` enum + `assignmentsComplete && stepsAuthored && hasPriorSnapshot` signal with **per-path workflow-readiness checks**:

```ts
// packages/core/src/responsePathReadiness.ts (renamed from hubMaturity.ts)
export interface WorkflowReadinessSignals {
  /** Whether this hub has at least one improvement intervention recorded */
  hasIntervention: boolean;
  /** Whether sustainment monitoring confirms gains held */
  sustainmentConfirmed: boolean;
  /** Apps may force readiness (bypass all prerequisite gates) for seeded showcases */
  isDemo?: boolean;
}

export function isCharterReady(signals: WorkflowReadinessSignals): boolean {
  return true; // Charter is the START of a project (DMAIC Define) — no prerequisite
}

export function isSustainmentReady(signals: WorkflowReadinessSignals): boolean {
  return signals.isDemo === true || signals.hasIntervention;
}

export function isHandoffReady(signals: WorkflowReadinessSignals): boolean {
  return signals.isDemo === true || signals.sustainmentConfirmed;
}
```

#### 2. Replace 4-state CTA machine with 2-state

`computeCtaState` simplifies. **Drop `tier-locked` and `awaiting-impl` as user-visible states.** The new shape:

```ts
export type ResponsePathCtaState =
  | { kind: 'active' }
  | { kind: 'prerequisite-locked'; reason: 'no-intervention' | 'no-sustainment-confirmed' };

export function computeCtaState({
  path,
  signals,
  hasHandler,
}: {
  path: ResponsePathKind;
  signals: WorkflowReadinessSignals;
  hasHandler: boolean;
}): ResponsePathCtaState | { kind: 'hidden' } {
  // Quick action / Focused investigation / Charter — never gated post-amendment.
  if (path === 'quick-action' || path === 'focused-investigation' || path === 'charter') {
    return hasHandler ? { kind: 'active' } : { kind: 'hidden' };
  }
  if (path === 'sustainment') {
    if (!isSustainmentReady(signals))
      return { kind: 'prerequisite-locked', reason: 'no-intervention' };
    return hasHandler ? { kind: 'active' } : { kind: 'hidden' };
  }
  if (path === 'handoff') {
    if (!isHandoffReady(signals))
      return { kind: 'prerequisite-locked', reason: 'no-sustainment-confirmed' };
    return hasHandler ? { kind: 'active' } : { kind: 'hidden' };
  }
  // assertNever fallback for type exhaustiveness
}
```

**Why `'hidden'` instead of `'awaiting-impl'`:** the prior `'awaiting-impl'` state was a feature-flag-disguised-as-UX-state. Showing "Coming soon" buttons to a user who has met all prerequisites erodes confidence. **If a CTA's handler isn't wired yet, hide it entirely** — don't tease unfinished features. The button reappears as `'active'` when the handler lands.

The exception: 8a explicitly ships **stub destinations** for Charter / Sustainment / Handoff — see (4) below — so these buttons are NEVER hidden in the as-shipped state. They always render as `'active'` (Charter) or `'active' | 'prerequisite-locked'` (Sustainment, Handoff), with their handlers pointing at stub views that say "Charter editor — coming soon" with a brief description of the surface.

#### 3. Drop `isPaid` / `upgradeUrl` props from `CanvasStepOverlay`, `Canvas`, `CanvasWorkspace`

The five response-path CTAs are no longer tier-gated at this layer. Drop `isPaid` and `upgradeUrl` from prop signatures of `CanvasStepOverlay` / `Canvas` / `CanvasWorkspace`. The team-features tier-gate that DOES apply (signoff buttons, alerts setup, etc.) lives inside Charter / Sustainment / Handoff surface components and reads `useTier()` directly there — separate concern from 8a.

i18n key `'frame.canvasOverlay.cta.tierLocked.tooltip'` and `.badge` are no longer used and should not be added in Task 3. Replace with per-path `prerequisite-locked` reason copy:

```ts
'frame.canvasOverlay.cta.sustainment.notReady':
  "Available after you've implemented a process change to monitor",
'frame.canvasOverlay.cta.handoff.notReady':
  'Available after sustainment monitoring confirms gains',
```

#### 4. Stub destinations for Charter / Sustainment / Handoff

Until the data-model + form slice for each ships, the click handlers point at minimal stub views per app. Each stub renders the path name + a one-paragraph description of what the full surface will do (LSSGB pedagogy continues even before the feature is complete). Concrete in 8a:

- `apps/pwa/src/components/CharterPanel.tsx` (NEW) — single-component placeholder; reads charter list from `processContext.charters` if present, else "no charter yet" empty state. Renders the description from `@variscout/core/i18n` (e.g., _"A Charter formalizes a process improvement project: problem statement, goals, scope, team, timeline. Authoring UI ships in [next slice]."_).
- `apps/pwa/src/components/SustainmentPanel.tsx` + `apps/pwa/src/components/HandoffPanel.tsx` — same shape.
- `apps/azure/src/components/charter/CharterPanel.tsx` etc. — mirror copies (per ADR-078 D4 — extract to `@variscout/ui` when both apps render the same component shape; for stubs, in-app duplication is acceptable since the surfaces will diverge once forms ship).
- `usePanelsStore` gains `showCharter`, `showSustainment`, `showHandoff` actions; `FrameView` wires `handleCharter` / `handleSustainment` / `handleHandoff` callbacks pointing at them.

#### 5. Charter entity is hub-level, multiple per Hub (data model commitment)

`ProcessHub.charters: Charter[]` (Q1 confirmed). Charter type lives in `@variscout/core/processHub.ts`. Per F4: Document layer (Charter is content the recipient needs to reproduce the analysis). Per F-series: Charter eventually gets its own normalized Dexie table + `.vrs` envelope inclusion. **8a does NOT ship the `Charter` type or table** — it only commits to the data-model location for future work. The stub `CharterPanel` reads `processHub.charters ?? []` and shows the empty state.

#### 6. Carry-forward items to log in `docs/investigations.md` during Task 7

Add these entries (replacing the original plan's `[RESOLVED]` close-out content with a more honest "partially resolved" form):

> **Charter authoring V1** — new slice when prioritized. Hub-level `Charter` entity (multiple per Hub per Q1). Data model + form + `.vrs` round-trip. Free-tier-active per Q2 (PWA can author + export `.vrs`; team signoff/audit features paid-only inside the surface). Surfaced 2026-05-07 during 8a amendment review.
>
> **Sustainment workflow V1** — when prioritized. Workflow signal "intervention exists for this hub" needs concrete definition (likely tied to a future `Intervention` entity OR derived from existing `ImprovementIdea` + `ActionItem` data). Surfaced 2026-05-07.
>
> **Handoff workflow V1** — when prioritized. Workflow signal "sustainment confirmed" needs concrete definition (likely `SustainmentRecord.latestReviewId` populated AND review marked confirmed-sustained). Surfaced 2026-05-07.
>
> **Team-collaboration features inside Charter/Sustainment/Handoff surfaces** — tier-gated layer (signoff, audit trail, alerts, RACI, change notifications). Lives inside each surface's components, NOT on the response-path CTAs. Defer until the surface forms ship. Surfaced 2026-05-07.

The original investigations.md entry "Canvas response-path CTAs hardcoded as disabled instead of mode-aware (vision §5.3 + §2.4)" gets `[RESOLVED 2026-05-07]` per the original plan, with the resolution note reading: "_PR #NNN — `computeCtaState` helper + 2-state CTA rendering (`active` / `prerequisite-locked`). All five paths free-tier-active per Q2. Charter has no workflow prerequisite per DMAIC Define-phase research. Stub destinations ship; full surfaces deferred to per-path slices listed above._"

### Task-by-task amendment summary

| Original                                                                                              | Status under amendment                                                                                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Task 1: `computeHubMode` in `hubMaturity.ts`                                                          | **REPLACE** with `responsePathReadiness.ts` containing `WorkflowReadinessSignals` + `isCharterReady` / `isSustainmentReady` / `isHandoffReady`. Drop `'cadence' \| 'first-time' \| 'demo'` enum. Keep `isDemo` field on signals as bypass.                                                                                        |
| Task 2: `computeCtaState` (4 states)                                                                  | **REPLACE** with 2-state machine `'active' \| 'prerequisite-locked' \| 'hidden'` per code block above. Drop `isPaid` and `upgradeUrl` from inputs.                                                                                                                                                                                |
| Task 3: i18n keys for tier-locked / hub-immature / awaiting-impl tooltips                             | **REPLACE** with `sustainment.notReady` + `handoff.notReady` copy per (3) above. Drop `tierLocked.tooltip`, `tierLocked.badge`, `hubImmature.tooltip`, `awaitingImpl.tooltip`.                                                                                                                                                    |
| Task 4: `CanvasStepOverlay` 4-state render                                                            | **SIMPLIFY** to 2-state render (`active` button OR `prerequisite-locked` disabled button with per-path tooltip; `hidden` returns `null`). Drop `<a href={upgradeUrl}>` tier-locked branch.                                                                                                                                        |
| Task 5: thread `hubMode` / `isPaid` / `upgradeUrl` + 3 callbacks through `Canvas` + `CanvasWorkspace` | **MODIFY** — drop `hubMode` / `isPaid` / `upgradeUrl` props; ADD `signals: WorkflowReadinessSignals` prop. Keep the 3 callbacks (`onCharter` / `onSustainment` / `onHandoff`).                                                                                                                                                    |
| Task 6: PWA + Azure FrameView wiring                                                                  | **MODIFY** — drop `computeHubMode` call; compute `signals: WorkflowReadinessSignals` directly (intervention + sustainment-confirmed booleans, both `false` for now in 8a — surfaces will populate them when their data models land). Drop `useTier` import (not needed at this level). ADD stub-destination wiring per (4) above. |
| Task 7: investigations.md close-out + chrome walk                                                     | **MODIFY** investigations.md note + add 4 new carry-forward entries per (6) above. Chrome walk verifies: all 5 buttons visible; Charter is always active; Sustainment + Handoff are `prerequisite-locked` until their signals flip; clicking active buttons opens the appropriate stub view.                                      |

### What stays unchanged

- TDD discipline + per-task commit cadence
- File paths for created files (just rename `hubMaturity.ts` → `responsePathReadiness.ts`)
- Subagent-driven execution flow (`feedback_subagent_driven_default`)
- Pre-merge gate (`pr-ready-check.sh`, both apps' `--chrome` walk, code reviewer dispatch)
- `feedback_no_backcompat_clean_architecture` — new props remain required on internal APIs; both apps refactored in same PR; no transitional defaults

### Sources

- [Six Sigma Institute — DMAIC Define Phase Project Charter](https://www.sixsigma-institute.org/Six_Sigma_DMAIC_Process_Define_Phase_Six_Sigma_Project_Charter.php)
- [DMAIC.com — Project Charter](https://www.dmaic.com/faq/project-charter/)
- [SixSigma.us — Project Charter and Define Phase Are Inseparable](https://www.6sigma.us/project-management/the-project-charter-and-define-phase-are-inseparable/)
- [GoLeanSixSigma — DMAIC Five Phases](https://goleansixsigma.com/dmaic-five-basic-phases-of-lean-six-sigma/)
- [ASQ — DMAIC Process](https://asq.org/quality-resources/dmaic)

---

> **Below this line:** the original plan content. Implementers MUST follow the amendment above when its instructions conflict with the original plan. The original is preserved as historical record.

---

## Context: what's hardcoded today

`packages/ui/src/components/Canvas/internal/CanvasStepOverlay.tsx:259-295` renders the five CTAs. Quick action (line 260-266) and Focused investigation (line 267-273) wire `onQuickAction` / `onFocusedInvestigation`. Charter (274-280), Sustainment (281-287), and Handoff (288-294) are hardcoded `<button disabled>` with no props, no callbacks, no tier check, no copy explaining why they're disabled. The investigation entry at `docs/investigations.md:150` describes the failure mode: "users see 'permanently broken' instead of 'tier-gated, here's why.'"

Both `apps/pwa/src/components/views/FrameView.tsx` and `apps/azure/src/components/editor/FrameView.tsx` already wire `onQuickAction` and `onFocusedInvestigation` via `usePanelsStore`. Neither wires Charter / Sustainment / Handoff (those response-path actions are not yet implemented; F5 may unify them per master plan §10).

**Action wiring is OUT OF SCOPE.** This sub-PR is about CTA _rendering_ states, not about implementing what each CTA does when clicked. The `awaiting-impl` state covers paid + cadence + no handler, so Azure's first paint after this lands shows Charter / Sustainment / Handoff dimmed with "Coming soon" — accurate, not deceptive.

---

## File Structure

**Create:**

- `packages/core/src/hubMaturity.ts` — `HubMode` type + `HubMaturitySignals` interface + `computeHubMode()` pure helper.
- `packages/core/src/__tests__/hubMaturity.test.ts` — unit tests for the helper.
- `packages/ui/src/components/Canvas/internal/responsePathCta.ts` — `ResponsePathKind` + `ResponsePathCtaState` + `computeCtaState()` pure helper.
- `packages/ui/src/components/Canvas/internal/__tests__/responsePathCta.test.ts` — unit tests.
- `packages/ui/src/components/Canvas/internal/__tests__/CanvasStepOverlay.test.tsx` — render-state tests for the four CTA states (new file; existing coverage is via `CanvasWorkspace.test.tsx` only).

**Modify:**

- `packages/core/src/processHub.ts` — re-export `HubMode` + `computeHubMode` (keeps the `@variscout/core/processHub` sub-path canonical).
- `packages/core/src/index.ts` — re-export from barrel (so apps can `import { computeHubMode } from '@variscout/core'`).
- `packages/core/src/i18n/messages/en.ts` — add four new message keys (tooltip + badge copy).
- `packages/core/src/i18n/messages/da.ts`, `de.ts`, `nb.ts`, `zhHans.ts`, `ar.ts` — same keys with English fallback (don't translate; matches existing pattern of partial localization for dev-flow strings — verify per file when editing).
- `packages/ui/src/components/Canvas/internal/CanvasStepOverlay.tsx` — add `hubMode`, `isPaid`, `upgradeUrl` (required), and `onCharter`, `onSustainment`, `onHandoff` (optional) props; replace hardcoded `<button disabled>` with state-driven render via `computeCtaState`.
- `packages/ui/src/components/Canvas/index.tsx` — add the same five new props to `CanvasProps`; thread through to `CanvasStepOverlay`.
- `packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx` — supply the new required props (or update the test mock setup) so existing assertions still pass.
- `packages/ui/src/components/Canvas/CanvasWorkspace.tsx` — add `hubMode`, `isPaid`, `upgradeUrl` (required), `onCharter`, `onSustainment`, `onHandoff` (optional) to `CanvasWorkspaceProps`; pass through to `Canvas`.
- `apps/pwa/src/components/views/FrameView.tsx` — call `computeHubMode` + `useTier()`; pass derived props to `CanvasWorkspace`. PWA always free, so `hasPriorSnapshot=false`; the gates collapse to "tier-locked" for the three new CTAs regardless of hub state.
- `apps/azure/src/components/editor/FrameView.tsx` — same wiring, but read snapshot count from project store / dashboard scope so `hasPriorSnapshot` reflects reality. (Charter/Sustainment/Handoff handlers stay undefined; they render `awaiting-impl` until F5 lands.)
- `apps/pwa/src/components/views/__tests__/FrameView.test.tsx`, `apps/azure/src/components/editor/__tests__/FrameView.test.tsx` — supply the new required props in the `CanvasWorkspace` mock or assert the wiring (depending on what the existing mocks check).

**No-back-compat policy** (per `feedback_no_backcompat_clean_architecture`): the new props on `CanvasWorkspace`, `Canvas`, and `CanvasStepOverlay` are required (not optional). Both consuming apps must update in this same PR. No transitional defaults.

---

## Task 1: Define `HubMode` + `computeHubMode` in `@variscout/core`

**Files:**

- Create: `packages/core/src/hubMaturity.ts`
- Create: `packages/core/src/__tests__/hubMaturity.test.ts`
- Modify: `packages/core/src/processHub.ts` (add re-export)
- Modify: `packages/core/src/index.ts` (add barrel export)

- [ ] **Step 1: Write the failing test**

Create `packages/core/src/__tests__/hubMaturity.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { computeHubMode, type HubMaturitySignals } from '../hubMaturity';

describe('computeHubMode', () => {
  const baseSignals: HubMaturitySignals = {
    assignmentsComplete: false,
    stepsAuthored: false,
    hasPriorSnapshot: false,
  };

  it("returns 'demo' when isDemo is true regardless of other signals", () => {
    expect(computeHubMode({ ...baseSignals, isDemo: true })).toBe('demo');
    expect(
      computeHubMode({
        assignmentsComplete: true,
        stepsAuthored: true,
        hasPriorSnapshot: true,
        isDemo: true,
      })
    ).toBe('demo');
  });

  it("returns 'cadence' only when assignments + steps + prior snapshot all hold", () => {
    expect(
      computeHubMode({
        assignmentsComplete: true,
        stepsAuthored: true,
        hasPriorSnapshot: true,
      })
    ).toBe('cadence');
  });

  it("returns 'first-time' when any of the three signals is missing", () => {
    expect(
      computeHubMode({
        assignmentsComplete: false,
        stepsAuthored: true,
        hasPriorSnapshot: true,
      })
    ).toBe('first-time');
    expect(
      computeHubMode({
        assignmentsComplete: true,
        stepsAuthored: false,
        hasPriorSnapshot: true,
      })
    ).toBe('first-time');
    expect(
      computeHubMode({
        assignmentsComplete: true,
        stepsAuthored: true,
        hasPriorSnapshot: false,
      })
    ).toBe('first-time');
  });

  it("returns 'first-time' for a fully empty hub", () => {
    expect(computeHubMode(baseSignals)).toBe('first-time');
  });

  it('isDemo: false is equivalent to omitting it', () => {
    expect(
      computeHubMode({
        assignmentsComplete: true,
        stepsAuthored: true,
        hasPriorSnapshot: true,
        isDemo: false,
      })
    ).toBe('cadence');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/core test hubMaturity`
Expected: FAIL — `Cannot find module '../hubMaturity'`.

- [ ] **Step 3: Write the implementation**

Create `packages/core/src/hubMaturity.ts`:

```typescript
/**
 * Hub-maturity helper — projects three boolean signals into a `HubMode`
 * used by the canvas drill-down to gate which response-path CTAs are
 * surfaced as active vs. dimmed-with-hint.
 *
 * Vision spec: docs/superpowers/specs/2026-05-03-variscout-vision-design.md §5.3
 * Master plan: docs/superpowers/plans/2026-05-07-canvas-pr8-vision-alignment-master.md §4
 */

export type HubMode = 'cadence' | 'first-time' | 'demo';

export interface HubMaturitySignals {
  /** At least one column has been placed onto a step in the canonical map. */
  assignmentsComplete: boolean;
  /** At least one step exists in the canonical map. */
  stepsAuthored: boolean;
  /** The hub has at least one prior `EvidenceSnapshot` in its history. */
  hasPriorSnapshot: boolean;
  /** Apps may force `'demo'` for seeded showcase scenarios. */
  isDemo?: boolean;
}

export function computeHubMode(signals: HubMaturitySignals): HubMode {
  if (signals.isDemo) return 'demo';
  if (signals.assignmentsComplete && signals.stepsAuthored && signals.hasPriorSnapshot) {
    return 'cadence';
  }
  return 'first-time';
}
```

- [ ] **Step 4: Wire re-exports**

Edit `packages/core/src/processHub.ts` — append to the existing `export {…}` block at the top (around line 32, where `buildReviewItem` is re-exported):

```typescript
export { computeHubMode } from './hubMaturity';
export type { HubMode, HubMaturitySignals } from './hubMaturity';
```

Edit `packages/core/src/index.ts` — add to the existing barrel (find the section that re-exports tier helpers around line 183 — `isPaidTier` is already there — and add a sibling line):

```typescript
export { computeHubMode } from './hubMaturity';
export type { HubMode, HubMaturitySignals } from './hubMaturity';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @variscout/core test hubMaturity`
Expected: PASS — 5 tests green.

Run: `pnpm --filter @variscout/core build`
Expected: clean tsc.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/hubMaturity.ts \
        packages/core/src/__tests__/hubMaturity.test.ts \
        packages/core/src/processHub.ts \
        packages/core/src/index.ts
git commit -m "PR8-8a: add computeHubMode helper to @variscout/core"
```

---

## Task 2: Define `ResponsePathCtaState` + `computeCtaState`

**Files:**

- Create: `packages/ui/src/components/Canvas/internal/responsePathCta.ts`
- Create: `packages/ui/src/components/Canvas/internal/__tests__/responsePathCta.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/ui/src/components/Canvas/internal/__tests__/responsePathCta.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { computeCtaState, type ResponsePathKind } from '../responsePathCta';

const UPGRADE_URL = 'https://example.com/upgrade';

const ALWAYS_ACTIVE: ResponsePathKind[] = ['quick-action', 'focused-investigation'];
const PAID_GATED: ResponsePathKind[] = ['charter', 'sustainment', 'handoff'];

describe('computeCtaState — quick-action and focused-investigation are never gated', () => {
  for (const path of ALWAYS_ACTIVE) {
    it(`${path} is active when handler exists, regardless of mode/tier`, () => {
      expect(
        computeCtaState({
          path,
          hubMode: 'first-time',
          isPaid: false,
          upgradeUrl: UPGRADE_URL,
          hasHandler: true,
        })
      ).toEqual({ kind: 'active' });

      expect(
        computeCtaState({
          path,
          hubMode: 'cadence',
          isPaid: true,
          upgradeUrl: UPGRADE_URL,
          hasHandler: true,
        })
      ).toEqual({ kind: 'active' });
    });

    it(`${path} is awaiting-impl when no handler is wired`, () => {
      expect(
        computeCtaState({
          path,
          hubMode: 'cadence',
          isPaid: true,
          upgradeUrl: UPGRADE_URL,
          hasHandler: false,
        })
      ).toEqual({ kind: 'awaiting-impl' });
    });
  }
});

describe('computeCtaState — charter/sustainment/handoff are tier-gated then hub-gated', () => {
  for (const path of PAID_GATED) {
    it(`${path} is tier-locked on free tier (regardless of hub mode)`, () => {
      expect(
        computeCtaState({
          path,
          hubMode: 'cadence',
          isPaid: false,
          upgradeUrl: UPGRADE_URL,
          hasHandler: true,
        })
      ).toEqual({ kind: 'tier-locked', upgradeUrl: UPGRADE_URL });

      expect(
        computeCtaState({
          path,
          hubMode: 'first-time',
          isPaid: false,
          upgradeUrl: UPGRADE_URL,
          hasHandler: true,
        })
      ).toEqual({ kind: 'tier-locked', upgradeUrl: UPGRADE_URL });
    });

    it(`${path} is hub-immature on paid tier + first-time mode`, () => {
      expect(
        computeCtaState({
          path,
          hubMode: 'first-time',
          isPaid: true,
          upgradeUrl: UPGRADE_URL,
          hasHandler: true,
        })
      ).toEqual({ kind: 'hub-immature' });
    });

    it(`${path} is awaiting-impl on paid tier + cadence + no handler`, () => {
      expect(
        computeCtaState({
          path,
          hubMode: 'cadence',
          isPaid: true,
          upgradeUrl: UPGRADE_URL,
          hasHandler: false,
        })
      ).toEqual({ kind: 'awaiting-impl' });
    });

    it(`${path} is active on paid tier + cadence + handler wired`, () => {
      expect(
        computeCtaState({
          path,
          hubMode: 'cadence',
          isPaid: true,
          upgradeUrl: UPGRADE_URL,
          hasHandler: true,
        })
      ).toEqual({ kind: 'active' });
    });
  }
});

describe('computeCtaState — demo mode bypasses tier and hub gates', () => {
  for (const path of PAID_GATED) {
    it(`${path} is active in demo mode + handler wired (even on free tier)`, () => {
      expect(
        computeCtaState({
          path,
          hubMode: 'demo',
          isPaid: false,
          upgradeUrl: UPGRADE_URL,
          hasHandler: true,
        })
      ).toEqual({ kind: 'active' });
    });

    it(`${path} is awaiting-impl in demo mode + no handler`, () => {
      expect(
        computeCtaState({
          path,
          hubMode: 'demo',
          isPaid: false,
          upgradeUrl: UPGRADE_URL,
          hasHandler: false,
        })
      ).toEqual({ kind: 'awaiting-impl' });
    });
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/ui test responsePathCta`
Expected: FAIL — `Cannot find module '../responsePathCta'`.

- [ ] **Step 3: Write the implementation**

Create `packages/ui/src/components/Canvas/internal/responsePathCta.ts`:

```typescript
/**
 * Pure helper that maps `(path, hubMode, isPaid, hasHandler)` to a
 * `ResponsePathCtaState`. Used by `CanvasStepOverlay` to render each of the
 * five response-path CTAs in vision §5.3 with the correct tier/mode/wiring
 * affordance.
 *
 * Decision matrix:
 *  - quick-action / focused-investigation: never tier-gated, never hub-gated.
 *    `active` if handler wired, else `awaiting-impl`.
 *  - charter / sustainment / handoff:
 *      free tier               -> tier-locked
 *      paid + first-time       -> hub-immature
 *      paid + cadence + handler -> active
 *      paid + cadence + no handler -> awaiting-impl
 *      demo (any tier)         -> active if handler wired, else awaiting-impl
 *
 * No state, no React, no i18n — copy lives in CanvasStepOverlay.
 */

import type { HubMode } from '@variscout/core';

export type ResponsePathKind =
  | 'quick-action'
  | 'focused-investigation'
  | 'charter'
  | 'sustainment'
  | 'handoff';

export type ResponsePathCtaState =
  | { kind: 'active' }
  | { kind: 'tier-locked'; upgradeUrl: string }
  | { kind: 'hub-immature' }
  | { kind: 'awaiting-impl' };

export interface ComputeCtaStateInput {
  path: ResponsePathKind;
  hubMode: HubMode;
  isPaid: boolean;
  upgradeUrl: string;
  hasHandler: boolean;
}

export function computeCtaState({
  path,
  hubMode,
  isPaid,
  upgradeUrl,
  hasHandler,
}: ComputeCtaStateInput): ResponsePathCtaState {
  if (path === 'quick-action' || path === 'focused-investigation') {
    return hasHandler ? { kind: 'active' } : { kind: 'awaiting-impl' };
  }
  if (hubMode === 'demo') {
    return hasHandler ? { kind: 'active' } : { kind: 'awaiting-impl' };
  }
  if (!isPaid) {
    return { kind: 'tier-locked', upgradeUrl };
  }
  if (hubMode === 'first-time') {
    return { kind: 'hub-immature' };
  }
  return hasHandler ? { kind: 'active' } : { kind: 'awaiting-impl' };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @variscout/ui test responsePathCta`
Expected: PASS — all groups green.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/Canvas/internal/responsePathCta.ts \
        packages/ui/src/components/Canvas/internal/__tests__/responsePathCta.test.ts
git commit -m "PR8-8a: add computeCtaState helper for response-path gating"
```

---

## Task 3: Add i18n message keys for tooltip + badge copy

**Files:**

- Modify: `packages/core/src/i18n/messages/en.ts` (add four keys)
- Modify: `packages/core/src/i18n/messages/da.ts`, `de.ts`, `nb.ts`, `zhHans.ts`, `ar.ts` (mirror keys with English fallback so the type stays exhaustive)

- [ ] **Step 1: Add English keys**

Edit `packages/core/src/i18n/messages/en.ts` — find the `'frame.b1.heading': 'Frame the investigation',` entry (around line 988) and add the following four keys nearby (group with other `frame.canvas*` keys if they exist, otherwise insert immediately after `'frame.b1.heading'`):

```typescript
  'frame.canvasOverlay.cta.tierLocked.tooltip': 'Available with VariScout Enterprise',
  'frame.canvasOverlay.cta.tierLocked.badge': 'Enterprise',
  'frame.canvasOverlay.cta.hubImmature.tooltip': 'Available once your Hub has cadence',
  'frame.canvasOverlay.cta.awaitingImpl.tooltip': 'Coming soon',
```

- [ ] **Step 2: Mirror keys in non-English catalogs**

For each of `da.ts`, `de.ts`, `nb.ts`, `zhHans.ts`, `ar.ts` — open the file, find the same insertion point (look for `'frame.b1.heading'`), and add the four keys with the **English copy as the value** (untranslated):

```typescript
  'frame.canvasOverlay.cta.tierLocked.tooltip': 'Available with VariScout Enterprise',
  'frame.canvasOverlay.cta.tierLocked.badge': 'Enterprise',
  'frame.canvasOverlay.cta.hubImmature.tooltip': 'Available once your Hub has cadence',
  'frame.canvasOverlay.cta.awaitingImpl.tooltip': 'Coming soon',
```

This matches the existing pattern (all message catalogs share the same key set; localization fills in over time). If any catalog already has overrides for sibling `frame.*` keys, just add the new keys without disturbing surrounding entries.

- [ ] **Step 3: Run i18n type check**

Run: `pnpm --filter @variscout/core build`
Expected: clean tsc — the typed message catalog ensures every key is present in every locale file.

If the build complains about a missing key in any catalog, add the key with the English fallback in that file too.

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/i18n/messages/
git commit -m "PR8-8a: i18n keys for response-path CTA gating copy"
```

---

## Task 4: Update `CanvasStepOverlay` to render the four CTA states

**Files:**

- Modify: `packages/ui/src/components/Canvas/internal/CanvasStepOverlay.tsx`
- Create: `packages/ui/src/components/Canvas/internal/__tests__/CanvasStepOverlay.test.tsx`

- [ ] **Step 1: Write the failing render-state test**

Create `packages/ui/src/components/Canvas/internal/__tests__/CanvasStepOverlay.test.tsx`. **vi.mock and locale registration MUST come before component imports per `.claude/rules/testing.md`.**

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { registerLocaleLoaders, preloadLocale } from '@variscout/core/i18n';
import type { CanvasStepCardModel } from '@variscout/hooks';

// Register locale loaders BEFORE importing any component that calls useTranslation.
registerLocaleLoaders(
  import.meta.glob('../../../../../../core/src/i18n/messages/*.ts', { eager: false })
);

// Now safe to import the component (uses i18n via t()).
import { CanvasStepOverlay } from '../CanvasStepOverlay';

beforeAll(async () => {
  await preloadLocale('en');
});

const baseCard: CanvasStepCardModel = {
  stepId: 'step-1',
  stepName: 'Bake step',
  metricKind: 'numeric',
  metricColumn: 'Bake_Time',
  assignedColumns: ['Bake_Time'],
  capability: { state: 'no-specs', n: 12 },
  distribution: [],
  defectCount: undefined,
  stats: { mean: 1.0, stdDev: 0.1 },
};

const UPGRADE_URL = 'https://example.com/upgrade';

function renderOverlay(overrides: Partial<React.ComponentProps<typeof CanvasStepOverlay>> = {}) {
  return render(
    <CanvasStepOverlay
      card={baseCard}
      onClose={() => undefined}
      hubMode="first-time"
      isPaid={false}
      upgradeUrl={UPGRADE_URL}
      onQuickAction={() => undefined}
      onFocusedInvestigation={() => undefined}
      {...overrides}
    />
  );
}

describe('CanvasStepOverlay — response-path CTA rendering', () => {
  it('renders Quick action and Focused investigation as enabled when handlers wired', () => {
    renderOverlay();
    expect(screen.getByTestId('canvas-cta-quick-action')).not.toBeDisabled();
    expect(screen.getByTestId('canvas-cta-focused-investigation')).not.toBeDisabled();
  });

  it('free tier renders Charter / Sustainment / Handoff as tier-locked with upgrade link', () => {
    renderOverlay({ hubMode: 'cadence', isPaid: false });
    for (const path of ['charter', 'sustainment', 'handoff']) {
      const cta = screen.getByTestId(`canvas-cta-${path}`);
      expect(cta).toHaveAttribute('data-cta-state', 'tier-locked');
      // Tier-locked CTAs are anchors so the click opens the upgrade page.
      expect(cta).toHaveAttribute('href', UPGRADE_URL);
      expect(cta.getAttribute('title')).toMatch(/Enterprise/i);
    }
  });

  it('paid + first-time renders Charter / Sustainment / Handoff as hub-immature (disabled with cadence hint)', () => {
    renderOverlay({ hubMode: 'first-time', isPaid: true });
    for (const path of ['charter', 'sustainment', 'handoff']) {
      const cta = screen.getByTestId(`canvas-cta-${path}`);
      expect(cta).toHaveAttribute('data-cta-state', 'hub-immature');
      expect(cta).toBeDisabled();
      expect(cta.getAttribute('title')).toMatch(/cadence/i);
    }
  });

  it('paid + cadence + no handler renders Charter / Sustainment / Handoff as awaiting-impl (disabled with coming-soon hint)', () => {
    renderOverlay({ hubMode: 'cadence', isPaid: true });
    for (const path of ['charter', 'sustainment', 'handoff']) {
      const cta = screen.getByTestId(`canvas-cta-${path}`);
      expect(cta).toHaveAttribute('data-cta-state', 'awaiting-impl');
      expect(cta).toBeDisabled();
      expect(cta.getAttribute('title')).toMatch(/Coming soon/i);
    }
  });

  it('paid + cadence + handlers wired renders Charter / Sustainment / Handoff as active', () => {
    renderOverlay({
      hubMode: 'cadence',
      isPaid: true,
      onCharter: () => undefined,
      onSustainment: () => undefined,
      onHandoff: () => undefined,
    });
    for (const path of ['charter', 'sustainment', 'handoff']) {
      const cta = screen.getByTestId(`canvas-cta-${path}`);
      expect(cta).toHaveAttribute('data-cta-state', 'active');
      expect(cta).not.toBeDisabled();
    }
  });

  it('demo mode bypasses tier-locked even on free tier', () => {
    renderOverlay({
      hubMode: 'demo',
      isPaid: false,
      onCharter: () => undefined,
      onSustainment: () => undefined,
      onHandoff: () => undefined,
    });
    for (const path of ['charter', 'sustainment', 'handoff']) {
      const cta = screen.getByTestId(`canvas-cta-${path}`);
      expect(cta).toHaveAttribute('data-cta-state', 'active');
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/ui test CanvasStepOverlay`
Expected: FAIL — `data-testid="canvas-cta-quick-action"` not present (current overlay doesn't have testids); also TS error on `hubMode`/`isPaid`/`upgradeUrl` props that don't exist on `CanvasStepOverlayProps`.

- [ ] **Step 3: Update `CanvasStepOverlay` props**

Edit `packages/ui/src/components/Canvas/internal/CanvasStepOverlay.tsx`. Replace the existing `import` block (lines 1-8) with:

```typescript
import React from 'react';
import FocusTrap from 'focus-trap-react';
import { formatStatistic, useTranslation } from '@variscout/core/i18n';
import type { HubMode } from '@variscout/core';
import type {
  CanvasInvestigationFocus,
  CanvasStepCardModel,
  CanvasStepInvestigationOverlay,
} from '@variscout/hooks';
import {
  computeCtaState,
  type ResponsePathKind,
  type ResponsePathCtaState,
} from './responsePathCta';
```

Then replace the existing `interface CanvasStepOverlayProps {…}` block (lines 19-27) with:

```typescript
interface CanvasStepOverlayProps {
  card: CanvasStepCardModel;
  anchorRect?: CanvasOverlayAnchorRect | null;
  onClose: () => void;
  hubMode: HubMode;
  isPaid: boolean;
  upgradeUrl: string;
  onQuickAction?: (stepId: string) => void;
  onFocusedInvestigation?: (stepId: string) => void;
  onCharter?: (stepId: string) => void;
  onSustainment?: (stepId: string) => void;
  onHandoff?: (stepId: string) => void;
  investigationOverlay?: CanvasStepInvestigationOverlay;
  onOpenInvestigationFocus?: (focus: CanvasInvestigationFocus) => void;
}
```

- [ ] **Step 4: Replace the hardcoded CTA block with state-driven rendering**

In `packages/ui/src/components/Canvas/internal/CanvasStepOverlay.tsx`, replace the existing `<div className="mt-4 grid gap-2 sm:grid-cols-2">…</div>` block (lines 259-295) with the following. Also add the new destructured props (`hubMode`, `isPaid`, `upgradeUrl`, `onCharter`, `onSustainment`, `onHandoff`) into the component's props destructure (currently lines 84-92 — the existing destructure block):

```tsx
export const CanvasStepOverlay: React.FC<CanvasStepOverlayProps> = ({
  card,
  anchorRect,
  onClose,
  hubMode,
  isPaid,
  upgradeUrl,
  onQuickAction,
  onFocusedInvestigation,
  onCharter,
  onSustainment,
  onHandoff,
  investigationOverlay,
  onOpenInvestigationFocus,
}) => {
  const { t } = useTranslation();
  // ...all existing code from `const touchStartY = …` through the Linked
  // investigations <div>…</div> block stays unchanged...
```

Add a small render helper just above the `return` statement of the component (after the `panelClassName` declaration, around line 122):

```tsx
const ctaLabels: Record<ResponsePathKind, string> = {
  'quick-action': 'Quick action',
  'focused-investigation': 'Focused investigation',
  charter: 'Charter',
  sustainment: 'Sustainment',
  handoff: 'Handoff',
};

const ctaHandlers: Record<ResponsePathKind, ((stepId: string) => void) | undefined> = {
  'quick-action': onQuickAction,
  'focused-investigation': onFocusedInvestigation,
  charter: onCharter,
  sustainment: onSustainment,
  handoff: onHandoff,
};

const renderCta = (path: ResponsePathKind, extraClass = ''): React.ReactNode => {
  const handler = ctaHandlers[path];
  const state: ResponsePathCtaState = computeCtaState({
    path,
    hubMode,
    isPaid,
    upgradeUrl,
    hasHandler: typeof handler === 'function',
  });
  const label = ctaLabels[path];
  const testId = `canvas-cta-${path}`;
  const baseClass =
    'rounded-md border border-edge bg-surface-secondary px-3 py-2 text-sm font-medium';

  if (state.kind === 'active') {
    return (
      <button
        key={path}
        type="button"
        data-testid={testId}
        data-cta-state="active"
        onClick={() => handler?.(card.stepId)}
        className={`${baseClass} text-content hover:bg-surface-tertiary ${extraClass}`}
      >
        {label}
      </button>
    );
  }

  if (state.kind === 'tier-locked') {
    // Anchor (not button) so click opens the upgrade page in a new tab and
    // the tier-locked CTA stays informative rather than dead.
    return (
      <a
        key={path}
        href={state.upgradeUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-testid={testId}
        data-cta-state="tier-locked"
        title={t('frame.canvasOverlay.cta.tierLocked.tooltip')}
        className={`${baseClass} flex items-center justify-between text-content-muted opacity-60 hover:opacity-80 ${extraClass}`}
      >
        <span>{label}</span>
        <span className="ml-2 rounded border border-edge px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
          {t('frame.canvasOverlay.cta.tierLocked.badge')}
        </span>
      </a>
    );
  }

  if (state.kind === 'hub-immature') {
    return (
      <button
        key={path}
        type="button"
        data-testid={testId}
        data-cta-state="hub-immature"
        disabled
        title={t('frame.canvasOverlay.cta.hubImmature.tooltip')}
        className={`${baseClass} text-content-muted opacity-60 ${extraClass}`}
      >
        {label}
      </button>
    );
  }

  // awaiting-impl
  return (
    <button
      key={path}
      type="button"
      data-testid={testId}
      data-cta-state="awaiting-impl"
      disabled
      title={t('frame.canvasOverlay.cta.awaitingImpl.tooltip')}
      className={`${baseClass} text-content-muted opacity-60 ${extraClass}`}
    >
      {label}
    </button>
  );
};

// Replace the hardcoded CTA block with this:
// <div className="mt-4 grid gap-2 sm:grid-cols-2">
//   {renderCta('quick-action')}
//   {renderCta('focused-investigation')}
//   {renderCta('charter')}
//   {renderCta('sustainment')}
//   {renderCta('handoff', 'sm:col-span-2')}
// </div>
```

Then replace the JSX block (lines 259-295 of the original file) with:

```tsx
<div className="mt-4 grid gap-2 sm:grid-cols-2">
  {renderCta('quick-action')}
  {renderCta('focused-investigation')}
  {renderCta('charter')}
  {renderCta('sustainment')}
  {renderCta('handoff', 'sm:col-span-2')}
</div>
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @variscout/ui test CanvasStepOverlay`
Expected: PASS — six render-state tests green.

If the i18n `useTranslation` hook causes test failures, double-check that `registerLocaleLoaders` ran with the correct glob path. The relative path from the test file is six levels up to `packages/core` (`../../../../../../core/src/i18n/messages/*.ts`).

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/components/Canvas/internal/CanvasStepOverlay.tsx \
        packages/ui/src/components/Canvas/internal/__tests__/CanvasStepOverlay.test.tsx
git commit -m "PR8-8a: render response-path CTAs by mode/tier/handler state"
```

---

## Task 5: Thread props through `Canvas` and `CanvasWorkspace`

**Files:**

- Modify: `packages/ui/src/components/Canvas/index.tsx`
- Modify: `packages/ui/src/components/Canvas/CanvasWorkspace.tsx`
- Modify: `packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx`

- [ ] **Step 1: Update `Canvas` props**

Edit `packages/ui/src/components/Canvas/index.tsx`. Add an import for `HubMode` near the top:

```typescript
import type { HubMode } from '@variscout/core';
```

In the `CanvasProps` interface (currently around lines 95-133), add the five new props alongside the existing `onQuickAction` / `onFocusedInvestigation` (those stay):

```typescript
  hubMode: HubMode;
  isPaid: boolean;
  upgradeUrl: string;
  onCharter?: (stepId: string) => void;
  onSustainment?: (stepId: string) => void;
  onHandoff?: (stepId: string) => void;
```

In the component's destructure block (currently around lines 135-185), add the same five names. In the `CanvasStepOverlay` JSX (currently around lines 439-448), pass them through:

```tsx
{
  activeStepCard ? (
    <CanvasStepOverlay
      card={activeStepCard}
      anchorRect={stepOverlayAnchor}
      onClose={handleCloseStepOverlay}
      hubMode={hubMode}
      isPaid={isPaid}
      upgradeUrl={upgradeUrl}
      onQuickAction={onQuickAction}
      onFocusedInvestigation={onFocusedInvestigation}
      onCharter={onCharter}
      onSustainment={onSustainment}
      onHandoff={onHandoff}
      investigationOverlay={activeStepInvestigationOverlay}
      onOpenInvestigationFocus={onOpenInvestigationFocus}
    />
  ) : null;
}
```

- [ ] **Step 2: Update `CanvasWorkspace` props**

Edit `packages/ui/src/components/Canvas/CanvasWorkspace.tsx`. Add the import:

```typescript
import type { HubMode } from '@variscout/core';
```

In the `CanvasWorkspaceProps` interface (currently lines 36-54), add:

```typescript
  hubMode: HubMode;
  isPaid: boolean;
  upgradeUrl: string;
  onCharter?: (stepId: string) => void;
  onSustainment?: (stepId: string) => void;
  onHandoff?: (stepId: string) => void;
```

In the component's destructure block (currently lines 136-154), add the same names. In the `<Canvas …/>` JSX (currently lines 421-465), pass them through alongside the existing handlers:

```tsx
hubMode = { hubMode };
isPaid = { isPaid };
upgradeUrl = { upgradeUrl };
onCharter = { onCharter };
onSustainment = { onSustainment };
onHandoff = { onHandoff };
```

- [ ] **Step 3: Update existing `CanvasWorkspace.test.tsx`**

Open `packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx`. Find the place(s) where the test renders `<CanvasWorkspace … />` directly (search for `<CanvasWorkspace`). Add the three required props to every render call. Pick safe defaults that match the test's intent — for tests that don't otherwise care, use:

```tsx
        hubMode="first-time"
        isPaid={false}
        upgradeUrl="https://example.com/upgrade"
```

If a test specifically asserts CTA wiring, choose `hubMode="cadence"` + `isPaid={true}` so the active state is reachable and the test can pass handlers.

- [ ] **Step 4: Verify @variscout/ui builds clean**

Per `feedback_ui_build_before_merge`, ui's tsc catches cross-package type export gaps that per-package vitest misses. Run:

```bash
pnpm --filter @variscout/ui build
```

Expected: clean tsc — no errors about `HubMode` not being exported, `computeCtaState` mismatched signatures, or props missing.

- [ ] **Step 5: Run @variscout/ui tests**

Run: `pnpm --filter @variscout/ui test`
Expected: PASS — full ui suite green, including the existing `CanvasWorkspace.test.tsx`, the new `CanvasStepOverlay.test.tsx`, and the new `responsePathCta.test.ts`.

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/components/Canvas/index.tsx \
        packages/ui/src/components/Canvas/CanvasWorkspace.tsx \
        packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx
git commit -m "PR8-8a: thread hubMode/isPaid/upgradeUrl + cta handlers through Canvas + CanvasWorkspace"
```

---

## Task 6: Wire signals in PWA + Azure FrameViews

**Files:**

- Modify: `apps/pwa/src/components/views/FrameView.tsx`
- Modify: `apps/pwa/src/components/views/__tests__/FrameView.test.tsx`
- Modify: `apps/azure/src/components/editor/FrameView.tsx`
- Modify: `apps/azure/src/components/editor/__tests__/FrameView.test.tsx`

- [ ] **Step 1: Update PWA `FrameView`**

Edit `apps/pwa/src/components/views/FrameView.tsx`. Replace the existing implementation with:

```tsx
/**
 * FrameView — PWA FRAME workspace shell.
 *
 * CanvasWorkspace owns the shared b0/b1 canvas composition. The PWA shell only
 * reads app/store state and wires the app-specific Analysis navigation.
 */
import React from 'react';
import { CanvasWorkspace } from '@variscout/ui';
import { computeHubMode, getUpgradeUrl } from '@variscout/core';
import { useInvestigationStore, useProjectStore } from '@variscout/stores';
import { useTier, type CanvasInvestigationFocus } from '@variscout/hooks';
import { usePanelsStore } from '../../features/panels/panelsStore';
import { useInvestigationFeatureStore } from '../../features/investigation/investigationStore';

const FrameView: React.FC = () => {
  const rawData = useProjectStore(s => s.rawData);
  const outcome = useProjectStore(s => s.outcome);
  const factors = useProjectStore(s => s.factors);
  const setOutcome = useProjectStore(s => s.setOutcome);
  const setFactors = useProjectStore(s => s.setFactors);
  const measureSpecs = useProjectStore(s => s.measureSpecs);
  const setMeasureSpec = useProjectStore(s => s.setMeasureSpec);
  const processContext = useProjectStore(s => s.processContext);
  const setProcessContext = useProjectStore(s => s.setProcessContext);
  const findings = useInvestigationStore(s => s.findings);
  const questions = useInvestigationStore(s => s.questions);
  const suspectedCauses = useInvestigationStore(s => s.suspectedCauses);
  const causalLinks = useInvestigationStore(s => s.causalLinks);

  const { isPaid } = useTier();

  // PWA is session-only by default; snapshot history not surfaced through this
  // view today. `hasPriorSnapshot=false` is the conservative read — combined
  // with `isPaid=false` it means Charter/Sustainment/Handoff render
  // tier-locked, which is the desired vision-aligned UX for free tier.
  const hubMode = React.useMemo(() => {
    const map = processContext?.processMap;
    return computeHubMode({
      assignmentsComplete: map !== undefined && Object.keys(map.assignments ?? {}).length > 0,
      stepsAuthored: (map?.nodes ?? []).length > 0,
      hasPriorSnapshot: false,
    });
  }, [processContext]);

  const upgradeUrl = React.useMemo(() => getUpgradeUrl(), []);

  const handleSeeData = React.useCallback(() => {
    usePanelsStore.getState().showAnalysis();
  }, []);

  const handleQuickAction = React.useCallback(() => {
    usePanelsStore.getState().showImprovement();
  }, []);

  const handleFocusedInvestigation = React.useCallback(() => {
    usePanelsStore.getState().showInvestigation();
  }, []);

  const handleOpenInvestigationFocus = React.useCallback((focus: CanvasInvestigationFocus) => {
    if (focus.questionId)
      useInvestigationFeatureStore.getState().expandToQuestion(focus.questionId);
    usePanelsStore.getState().showInvestigation();
  }, []);

  return (
    <CanvasWorkspace
      rawData={rawData}
      outcome={outcome}
      factors={factors}
      setOutcome={setOutcome}
      setFactors={setFactors}
      measureSpecs={measureSpecs}
      setMeasureSpec={setMeasureSpec}
      processContext={processContext}
      setProcessContext={setProcessContext}
      onSeeData={handleSeeData}
      hubMode={hubMode}
      isPaid={isPaid}
      upgradeUrl={upgradeUrl}
      onQuickAction={handleQuickAction}
      onFocusedInvestigation={handleFocusedInvestigation}
      findings={findings}
      questions={questions}
      suspectedCauses={suspectedCauses}
      causalLinks={causalLinks}
      onOpenInvestigationFocus={handleOpenInvestigationFocus}
    />
  );
};

export default FrameView;
```

(Charter / Sustainment / Handoff handlers stay unwired — `awaiting-impl` for paid + cadence cases is the correct rendering until F5. PWA never reaches `active` state for those CTAs because `isPaid=false` always wins.)

- [ ] **Step 2: Update Azure `FrameView`**

Edit `apps/azure/src/components/editor/FrameView.tsx`. Replace with:

```tsx
/**
 * FrameView (Azure) — FRAME workspace shell.
 *
 * CanvasWorkspace owns the shared b0/b1 canvas composition. The Azure shell
 * only reads app/store state and wires the app-specific Analysis navigation.
 */
import React from 'react';
import { CanvasWorkspace } from '@variscout/ui';
import { computeHubMode, getUpgradeUrl } from '@variscout/core';
import { useInvestigationStore, useProjectStore } from '@variscout/stores';
import { useTier, type CanvasInvestigationFocus } from '@variscout/hooks';
import { usePanelsStore } from '../../features/panels/panelsStore';
import { useInvestigationFeatureStore } from '../../features/investigation/investigationStore';

const FrameView: React.FC = () => {
  const rawData = useProjectStore(s => s.rawData);
  const outcome = useProjectStore(s => s.outcome);
  const factors = useProjectStore(s => s.factors);
  const setOutcome = useProjectStore(s => s.setOutcome);
  const setFactors = useProjectStore(s => s.setFactors);
  const measureSpecs = useProjectStore(s => s.measureSpecs);
  const setMeasureSpec = useProjectStore(s => s.setMeasureSpec);
  const processContext = useProjectStore(s => s.processContext);
  const setProcessContext = useProjectStore(s => s.setProcessContext);
  const findings = useInvestigationStore(s => s.findings);
  const questions = useInvestigationStore(s => s.questions);
  const suspectedCauses = useInvestigationStore(s => s.suspectedCauses);
  const causalLinks = useInvestigationStore(s => s.causalLinks);

  const { isPaid } = useTier();

  // Azure has snapshot history, but FrameView's scope doesn't currently
  // surface a per-hub snapshot count. `hasPriorSnapshot=false` is the
  // conservative read for now — paid + first-time renders Charter / Sustainment
  // / Handoff as `hub-immature` ("Available once your Hub has cadence"), which
  // is the correct UX until F5 wires snapshot-count surfacing through this
  // shell. (Promotion to `cadence` happens automatically once the prop reads
  // `true`; no further code change needed.)
  const hubMode = React.useMemo(() => {
    const map = processContext?.processMap;
    return computeHubMode({
      assignmentsComplete: map !== undefined && Object.keys(map.assignments ?? {}).length > 0,
      stepsAuthored: (map?.nodes ?? []).length > 0,
      hasPriorSnapshot: false,
    });
  }, [processContext]);

  const upgradeUrl = React.useMemo(() => getUpgradeUrl(), []);

  const handleSeeData = React.useCallback(() => {
    usePanelsStore.getState().showAnalysis();
  }, []);

  const handleQuickAction = React.useCallback(() => {
    usePanelsStore.getState().showImprovement();
  }, []);

  const handleFocusedInvestigation = React.useCallback(() => {
    usePanelsStore.getState().showInvestigation();
  }, []);

  const handleOpenInvestigationFocus = React.useCallback((focus: CanvasInvestigationFocus) => {
    if (focus.questionId)
      useInvestigationFeatureStore.getState().expandToQuestion(focus.questionId);
    usePanelsStore.getState().showInvestigation();
  }, []);

  return (
    <CanvasWorkspace
      rawData={rawData}
      outcome={outcome}
      factors={factors}
      setOutcome={setOutcome}
      setFactors={setFactors}
      measureSpecs={measureSpecs}
      setMeasureSpec={setMeasureSpec}
      processContext={processContext}
      setProcessContext={setProcessContext}
      onSeeData={handleSeeData}
      hubMode={hubMode}
      isPaid={isPaid}
      upgradeUrl={upgradeUrl}
      onQuickAction={handleQuickAction}
      onFocusedInvestigation={handleFocusedInvestigation}
      findings={findings}
      questions={questions}
      suspectedCauses={suspectedCauses}
      causalLinks={causalLinks}
      onOpenInvestigationFocus={handleOpenInvestigationFocus}
    />
  );
};

export default FrameView;
```

- [ ] **Step 3: Update PWA + Azure FrameView tests**

For each of `apps/pwa/src/components/views/__tests__/FrameView.test.tsx` and `apps/azure/src/components/editor/__tests__/FrameView.test.tsx`:

1. Find the `vi.mock('@variscout/ui', …)` block that exposes `CanvasWorkspace` as a stub (around line 50 — `CanvasWorkspace: (props: {…}) => …`).
2. If the mock asserts on the prop set or types props, extend the prop type to include `hubMode`, `isPaid`, `upgradeUrl` (string), and the optional callback trio. If the mock just spreads through, no change needed.
3. If the test asserts the value of `isPaid` or `hubMode`, ensure the mock for `useTier` (or `tier.ts`) returns the expected value. Add a `vi.mock('@variscout/hooks', …)` partial mock if needed:

   ```typescript
   vi.mock('@variscout/hooks', async importOriginal => {
     const actual = await importOriginal<typeof import('@variscout/hooks')>();
     return {
       ...actual,
       useTier: () => ({ ...actual.useTier(), isPaid: false }),
     };
   });
   ```

   Adjust per app: PWA expects `isPaid: false`; Azure expects `isPaid: true`. Use `vi.fn()` overrides, not full hand-rolls — the existing `useTier` already returns the right value when the tier is configured (`configureTier('enterprise')` for Azure; default for PWA).

   If the test setup doesn't already configure tier, add one line in `beforeEach`:

   ```typescript
   import { configureTier } from '@variscout/core';
   beforeEach(() => configureTier(/* 'enterprise' for Azure, null/'free' for PWA */));
   ```

- [ ] **Step 4: Run app tests**

Run: `pnpm --filter @variscout/pwa test FrameView`
Expected: PASS.

Run: `pnpm --filter @variscout/azure-app test FrameView`
Expected: PASS.

- [ ] **Step 5: Type-check both apps**

Run: `pnpm --filter @variscout/pwa build` and `pnpm --filter @variscout/azure-app build` (or `pnpm build` from the root for the full monorepo build).
Expected: clean tsc + Vite bundle.

- [ ] **Step 6: Commit**

```bash
git add apps/pwa/src/components/views/FrameView.tsx \
        apps/pwa/src/components/views/__tests__/FrameView.test.tsx \
        apps/azure/src/components/editor/FrameView.tsx \
        apps/azure/src/components/editor/__tests__/FrameView.test.tsx
git commit -m "PR8-8a: PWA + Azure FrameView wire hubMode + tier signals into CanvasWorkspace"
```

---

## Task 7: Verification + investigations.md close-out

**Files:**

- Modify: `docs/investigations.md` (mark the 8a entry resolved)

- [ ] **Step 1: Run the full pre-merge gate**

Run: `bash scripts/pr-ready-check.sh`
Expected: green — tests, lint, build, docs:check all pass.

- [ ] **Step 2: Chrome walk — PWA**

Per `feedback_verify_before_push` and `feedback_know_your_tools`. Start `claude --chrome` (or the running browser session if one is up) and:

1. `pnpm dev` in one terminal (PWA at :5173).
2. Open `http://localhost:5173`, paste any seeded sample, advance to FRAME workspace.
3. Click any step card to open the drill-down.
4. Verify:
   - Quick action + Focused investigation render full-color and clickable.
   - Charter, Sustainment, Handoff render dimmed (opacity-60), each with an "Enterprise" badge in the corner.
   - Hover reveals the title attribute "Available with VariScout Enterprise".
   - Clicking a tier-locked CTA opens the upgrade page in a new tab.
5. Esc closes the overlay; original card visible.

- [ ] **Step 3: Chrome walk — Azure**

In a second tab:

1. `pnpm --filter @variscout/azure-app dev` (Azure app on its dev port).
2. Sign in via EasyAuth, open a hub with mapped columns + steps but no snapshot history (or the default empty hub).
3. Click any step card.
4. Verify:
   - Quick action + Focused investigation render full-color and clickable.
   - Charter, Sustainment, Handoff render dimmed without the Enterprise badge.
   - Hover reveals "Available once your Hub has cadence".
   - Disabled state (no click navigation).
5. (Optional, if a hub with snapshot history exists) verify those CTAs flip to `awaiting-impl` (still dimmed, tooltip "Coming soon") — this confirms the cadence-mode wiring even though no handler is yet connected. Skip this if no qualifying hub is at hand; the unit tests cover the state machine.

- [ ] **Step 4: Mark investigations.md entry resolved**

Edit `docs/investigations.md`. Find `### Canvas response-path CTAs hardcoded as disabled instead of mode-aware (vision §5.3 + §2.4)` (around line 150). Append `[RESOLVED 2026-05-07]` (or the actual merge date) to the heading line:

```markdown
### Canvas response-path CTAs hardcoded as disabled instead of mode-aware (vision §5.3 + §2.4) [RESOLVED YYYY-MM-DD]
```

Add a one-line note at the bottom of the entry (after the existing **Promotion path** line) describing the resolution:

```markdown
**Resolution:** PR #NNN — `computeHubMode` + `computeCtaState` helpers + four-state CTA rendering (`active` / `tier-locked` / `hub-immature` / `awaiting-impl`). PWA renders all three paid CTAs as tier-locked with upgrade link; Azure renders them as hub-immature pending snapshot history surfacing in `FrameView`. Action wiring (Charter / Sustainment / Handoff handlers) deferred to F5 / 8d follow-ups.
```

- [ ] **Step 5: Final commit + push**

```bash
git add docs/investigations.md
git commit -m "PR8-8a: mark response-path CTA gating entry resolved"

# Per workflow rule: branch -> PR -> pr-ready-check green -> code-reviewer pair -> squash-merge.
# Push the branch and open a PR. Title:
#   PR8-8a: mode-aware response-path CTAs in canvas drill-down
# Body should reference docs/superpowers/plans/2026-05-07-canvas-pr8-vision-alignment-master.md §4
# and link this plan file.
```

- [ ] **Step 6: Subagent code review**

Per workflow: dispatch a final code-reviewer subagent (Opus per `feedback_subagent_driven_default` only if branch is large; this sub-PR is small, Sonnet is fine for the review). Pass:

- The plan (this file)
- The PR diff
- Vision §5.3 + §2.4 + master plan §4 D3 (no F4 dependency, layer-neutral)
- The four-state CTA decision matrix above

Expected output: any blockers folded back into this PR (per `feedback_bundle_followups_pre_merge`); non-blocking nits noted in the PR thread.

---

## Self-review

**Spec coverage:**

| Spec / Master plan claim                                                                                    | Task                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Replace hardcoded `disabled` on Charter/Sustainment/Handoff (`CanvasStepOverlay.tsx:276–294`)               | Task 4                                                                                                               |
| Thread `mode: 'cadence' \| 'first-time' \| 'demo'` through `CanvasWorkspace → Canvas → CanvasStepOverlay`   | Tasks 4 + 5                                                                                                          |
| Compute hub-maturity from `assignmentsComplete && stepsAuthored && hasPriorSnapshot`                        | Task 1 + Task 6                                                                                                      |
| Tier-gate via `isPaidTier()` per ADR-078 D5                                                                 | Task 2 + Task 6                                                                                                      |
| Render with a tier-upgrade hint instead of `disabled` for free tier                                         | Task 4                                                                                                               |
| Separate "mode" (drill-down content) from "tier" (paid feature gating)                                      | Task 2 (`computeCtaState` keeps the two axes orthogonal)                                                             |
| Honor "first-time / no-Hub mode shows Quick action + Focused investigation active"                          | Task 2 + Task 4 (always-active rule on those two paths)                                                              |
| `'demo'` mode bypasses both gates so seeded showcases demonstrate full surface                              | Task 2 (`computeCtaState` demo branch) + Task 1 (`isDemo` signal)                                                    |
| Layer-neutral: no new persistent state (master plan D3)                                                     | Confirmed — all state is prop-derived; no Zustand changes                                                            |
| Investigations.md close-out per master plan D5                                                              | Task 7                                                                                                               |
| `feedback_no_backcompat_clean_architecture`: required props on internal APIs, refactor consumers in same PR | Tasks 5 + 6 (`CanvasWorkspace`, `Canvas`, `CanvasStepOverlay` all gain required props; both apps updated in same PR) |
| `feedback_ui_build_before_merge`: ui's tsc must pass                                                        | Task 5 step 4                                                                                                        |
| `feedback_verify_before_push`: chrome walk both apps                                                        | Task 7 steps 2 + 3                                                                                                   |
| `feedback_subagent_driven_default`: Sonnet workhorse + final code review                                    | Task 7 step 6 + execution handoff below                                                                              |

**Placeholder scan:** every code block above is concrete. No "TBD", no "implement later", no "similar to Task N." Per-task commit commands include exact paths.

**Type consistency:**

- `HubMode` is consistently spelled across Tasks 1–6 (`'cadence' | 'first-time' | 'demo'`).
- `ResponsePathKind` is consistent: `'quick-action' | 'focused-investigation' | 'charter' | 'sustainment' | 'handoff'`.
- `ResponsePathCtaState`'s four kinds (`'active' | 'tier-locked' | 'hub-immature' | 'awaiting-impl'`) match between the helper, the test, and the component render.
- `ComputeCtaStateInput` shape matches the test usage.
- `HubMaturitySignals` shape matches between the helper, the test, and the FrameView callsites.
- New i18n keys are spelled identically (Tasks 3 and 4).
- Required vs optional prop annotations match across `CanvasStepOverlay`, `Canvas`, and `CanvasWorkspace` (`hubMode`, `isPaid`, `upgradeUrl` required; `onCharter`, `onSustainment`, `onHandoff` optional).

---

## Execution handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-07-canvas-pr8-8a-mode-aware-ctas.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. Sonnet workhorse for implementer + per-task spec/quality reviewers; final code-reviewer pass at the end (Sonnet is fine — sub-PR is small).

**2. Inline Execution** — Execute tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints.

**Which approach?**
