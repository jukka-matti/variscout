---
tier: living
purpose: build
title: 'AW-8 CoScout right drawer slot'
audience: human
status: active
date: 2026-06-08
layer: plan
topic: [analyze, wall, coscout, drawer, azure]
related:
  - docs/superpowers/specs/2026-06-08-analyze-wall-redesign-design.md
  - docs/superpowers/plans/2026-06-08-analyze-wall-redesign-master-plan.md
---

# AW-8 CoScout Right Drawer Slot

## Goal

Reserve CoScout's Analyze Wall home in Azure: a canvas-first right drawer with a slim closed handle, object-scoped header, Coach / Evidence / Actions tabs, and an explicit `[REF]` activation hook. CoScout content behavior remains the existing `CoScoutPanelBase`; richer CS-14 content and cross-tab highlight behavior stay out of scope.

## Grounding

- Master plan AW-8 requires Azure only; PWA has no CoScout.
- Spec §7.7 defines the two-drawer model: left object detail / right CoScout; CoScout is optional and never owns manual controls.
- AW-7 already added `ObjectDetailDrawer` and `selectedWallObject` state in `AnalyzeWorkspace`.
- Existing Azure CoScout wiring is centralized in `apps/azure/src/components/editor/CoScoutSection.tsx`.
- `panelsStore.isCoScoutOpen` already owns CoScout open state and is toggled from `AppHeader`.
- `useCoScoutProps` already exposes `onRefActivate`, wired through `useVisualGrounding`; this is the `[REF]` hook to preserve.
- `CoScoutPanelBase` owns the chat, suggested questions, action proposal cards, save insight flows, and CS-10 behavior; AW-8 should wrap it, not fork it.

## Scope

In:

- Add a shared Analyze Wall CoScout drawer shell in `@variscout/ui`.
- Right drawer states: slim handle when closed, panel when open.
- Tabs: Coach / Evidence / Actions as scaffold chrome.
- Object-scoped header from selected Wall object (cause or finding).
- `[REF]` activation hook exposed by the shell and passed to `CoScoutPanelBase`.
- Re-home Azure `CoScoutSection` into the drawer shell on desktop Analyze Wall.
- Keep phone behavior as the existing full-screen CoScout overlay.

Out:

- New CoScout content, new prompt logic, or CS-14 coaching behavior.
- Cross-tab canvas highlight beyond existing `onRefActivate`.
- Any status-setting path from CoScout.
- PWA changes.

## Implementation Tasks

- [ ] RED: add a focused UI test for the right drawer shell: closed handle, open panel, tabs, selected-object header, and REF activation.
- [ ] Implement `CoScoutRightDrawer` in `packages/ui/src/components/AnalyzeWall/` and export it.
- [ ] RED: add/extend Azure AnalyzeWorkspace tests so the Wall passes selected object context to `CoScoutSection`.
- [ ] Update `CoScoutSection` props to accept selected Wall object context and optional drawer mode; keep close-prompt/session behavior intact.
- [ ] Mount desktop Azure CoScout through the new right drawer shell; keep phone overlay unchanged.
- [ ] Verify `onRefActivate` still reaches `CoScoutPanelBase` and the drawer-level hook.
- [ ] Run focused UI + Azure tests.
- [ ] Run browser smoke for Azure Wall: closed handle, open CoScout drawer, select cause, header scopes, tabs visible.
- [ ] Run `bash scripts/pr-ready-check.sh`, open PR, wait for checks, merge with a merge commit.

## Acceptance

- On desktop Azure Analyze Wall, CoScout is a right drawer with a slim handle when closed.
- Opening CoScout shows Coach / Evidence / Actions tabs and embeds the existing CoScout panel.
- Selecting a Wall cause scopes the drawer header to that object.
- Clicking a `[REF]` marker still calls the existing visual-grounding path.
- CoScout remains optional and never sets a cause/finding status.
- PWA remains unchanged.
