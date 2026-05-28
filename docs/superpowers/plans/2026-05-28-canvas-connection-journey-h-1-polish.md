---
tier: ephemeral
purpose: build
title: PR-CCJ-H1 — Empty states + system hints + polish
audience: human
category: implementation-plan
status: active
layer: spec
date: 2026-05-28
related:
  - docs/superpowers/specs/2026-05-26-canvas-connection-journey-design.md
  - docs/superpowers/plans/2026-05-26-canvas-connection-journey-master-plan.md
  - docs/decision-log.md
implements:
  - docs/superpowers/specs/2026-05-26-canvas-connection-journey-design.md
delivered-by: <TBD H1 PR>
---

# PR-CCJ-H1 — Empty states + system hints + polish

**Goal:** Polish the wedge V1 Canvas Connection Journey surface — wire the missing system-hint and ghost-suggested DETECTION logic (primitives + render slots already in place from B2/D2/D3), polish G1's inflection-binning UX (N<30 guard, cyan-guide fade animation, aria-describedby on the side panel), and ship a reusable `<ConfirmDialog>` primitive in `@variscout/ui` that retires two `window.confirm` callers (InflectionSidePanel + CoScoutPanelBase). No new features.

**Branch:** `worktree-feat-wedge-v1-ccj-h-1-polish`

---

## Context

Master plan §H1 (Phase H) describes a "polish + empty states + final polish" tail PR for the Canvas Connection Journey. The 2026-05-28 brainstorm scoped H1 to pure polish + G1 carry-overs and carved F1's deferred §4.5 rows 5–6 (multi-outcome Y-tabs + per-step view switcher) to a new H2 PR — those are substantial Explore-tab feature work that needs its own brainstorm (row 6 blocks on Task #45). See decision-log 2026-05-28 entry "H1 scope locked".

**Three brainstorm-time insights:**

1. **System-hint + ghost-suggested primitives + render slots were already in place** (shipped during B2/D2/D3) but the DETECTION logic to fire them was missing. H1's contribution is the wiring: `useSystemHints` reuses existing `detectBatchData` + `detectTimeColumns` from `@variscout/core`; `useGhostSuggestions` is greenfield + adds outcome-name regex + numeric-confidence heuristic.
2. **G1's `window.confirm` was a placeholder** flagged at G1 ship time. H1 retires it via a small audited `<ConfirmDialog>` primitive in `@variscout/ui` (focus trap + ESC + `role="alertdialog"`). CoScoutPanelBase had the same anti-pattern; bundled in the same PR per `feedback_bundle_followups_pre_merge`.
3. **CSS transition for commit animation** was sufficient — no framer-motion, no d3 transitions. One Tailwind class on the InflectionOverlay `<line>` elements.

---

## What shipped

| #   | Description                                                                                              | Key files                                                                                         |
| --- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1   | `useSystemHints` hook + CanvasWorkspace wire (with detectBatchData/detectTimeColumns reuse fix)          | `packages/ui/src/components/Canvas/EditMode/hooks/useSystemHints.ts`                              |
| 2   | `useGhostSuggestions` hook + Palette wire                                                                | `packages/ui/src/components/Canvas/EditMode/hooks/useGhostSuggestions.ts`                         |
| 3   | Palette empty-state CTA + ExploreExitButton cyan hint pill                                               | `packages/ui/src/components/Canvas/EditMode/Palette/index.tsx`, `ExploreExitButton.tsx`           |
| 4   | InflectionSidePanel N<30 guard (`MIN_TOTAL_POINTS` exported from core)                                   | `packages/ui/src/components/Explore/Probability/InflectionBinning/`, `packages/core/src/binning/` |
| 5   | InflectionOverlay commit fade transition (Tailwind CSS)                                                  | `packages/charts/src/InflectionOverlay.tsx`                                                       |
| 6   | InflectionSidePanel `aria-describedby` + table-aware × button aria-label                                 | `packages/ui/src/components/Explore/Probability/InflectionBinning/InflectionSidePanel.tsx`        |
| 7   | `<ConfirmDialog>` primitive in `@variscout/ui` (native `<dialog role="alertdialog">` + focus trap + ESC) | `packages/ui/src/components/ConfirmDialog/`                                                       |
| 8   | Wire ConfirmDialog into InflectionSidePanel + CoScoutPanelBase + update G1 e2e + this sub-plan           | (this task)                                                                                       |

## Algorithm / wiring decisions

- **System-hint reuse vs reinvent.** Initial Task 1 implementation reinvented batch/time detection heuristics inside the hook. Fix subagent restored use of existing `detectBatchData` + `detectTimeColumns` exports. The hook is the centralized hint synthesizer; detection primitives stay in `@variscout/core`.
- **Time-suppression rule** is "ALL detected date columns have a binding" (not "ANY binding exists"). Per-column-decomposed check matches D3's contract.
- **`canDetect` derived signal** is exposed by `useInflectionBinningState` so the SidePanel can suppress the Detect banner cleanly without duplicating the algorithm's internal `MIN_TOTAL_POINTS = 30` guard.
- **ConfirmDialog focus trap is native** — `<dialog>` provides focus trap + focus restoration on close. Backdrop click → `onCancel` via `event.target === dialog` check. ESC → `onCancel` via native `cancel` event.

## What is NOT in H1 (carved to H2)

- §4.5 routing row 5: Multi-outcome Y-tabs in Explore
- §4.5 routing row 6: Per-step view switcher (blocked on Task #45 — State/Edit mode rethink)

Tracking: Task #47 (PR-CCJ-H2) — needs separate brainstorm + plan; blocked by Task #45.

## V2 / H3 deferrals

- Animated arrow visual on no-outcome hint pointing to OutcomeZone (cyan pill copy alone is V1)
- D3-style smooth transition on inflection guide commit (CSS transition is enough)
- Multiple ConfirmDialog stacking
- Promise-based ConfirmDialog API (`await confirm(opts)`) — declarative `isOpen` matches existing AddActionDialog precedent

## Related

- Master plan (amended): `docs/superpowers/plans/2026-05-26-canvas-connection-journey-master-plan.md` §H1 + new §H2
- Decision log: `docs/decision-log.md` — 2026-05-28 "H1 scope locked" entry
- G1 sub-plan (precedent): `docs/superpowers/plans/2026-05-28-canvas-connection-journey-g-1-inflection-binning.md`
- F1 sub-plan (precedent): `docs/superpowers/plans/2026-05-28-canvas-connection-journey-f-1-explore-exit.md`

## Closes

- Task #36: PR-CCJ-H1
- Spawns: Task #47 (PR-CCJ-H2) — blocked by Task #45
