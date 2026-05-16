---
tier: ephemeral
purpose: build
title: Projects Tab Plan 3 — Team Workspace Right Rail V1
audience: human
category: implementation
status: draft
last-reviewed: 2026-05-15
related:
  - docs/superpowers/specs/2026-05-14-projects-tab-design.md
---

# Team Workspace Right Rail V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship PR-PT-8, the Projects tab Plan 3 team workspace right rail, as one PR from `projects-tab-pt-8-team-rail`.

**Architecture:** Fill the existing `IPDetailTeamRail` shell with roster, activity, and signoff components while keeping data mutation in the app shells through existing HubAction dispatch. Activity derivation is a pure function over explicit entity inputs. Tablet rail preference lives in `usePreferencesStore`; mobile uses a drawer opened from the IP detail header.

**Tech Stack:** React, TypeScript, Zustand, Vitest, Playwright, Codex Browser visual verification.

---

## PR-PT-8 Tasks

### Task 1: Worktree and Plan File

**Files:**

- Create: `docs/superpowers/plans/2026-05-14-projects-tab-team-rail.md`

- [x] Create `.worktrees/projects-tab-pt-plan3` from `origin/main` on branch `projects-tab-pt-8-team-rail`.
- [x] Run `pnpm install` in the worktree.
- [x] Save this plan file.

### Task 2: Roster and Invite Modal

**Files:**

- Modify/Create under `packages/ui/src/components/IPDetail/`
- Modify app `ProjectsTabView` call sites only as needed for callback wiring.

- [x] Extract the deterministic avatar helper from `IPDetailHeader.tsx` into a shared IP-detail primitive and reuse it in both header and rail.
- [x] Render `metadata.team[]` in the rail as compact rows: avatar, display name, role label, and RACI chip.
- [x] Add an Invite modal opened by the existing `+ Invite` header affordance; fields: name, optional email, role, RACI assignment.
- [x] Save invite changes by replacing the full `metadata.team[]` array through an `onTeamChange` callback; app shells dispatch `IMPROVEMENT_PROJECT_UPDATE`.
- [x] Add component tests for empty roster, populated roster, and invite submit validation.

### Task 3: Activity Feed

**Files:**

- Create a pure derivation module near IP detail UI or core improvement-project code.
- Add isolated unit tests.

- [x] Add minimal optional audit timestamp fields needed by §6.1.2: section `updatedAt?`, `ImprovementIdea.updatedAt?`, and `ActionItem.updatedAt?`.
- [x] Implement a pure activity derivation function over explicit inputs: `ip`, linked `SustainmentRecord`, linked `ControlHandoff`, ideas, actions, and optional `now`.
- [x] Derive V1 events for section edits, goal/project changes, hypothesis links, selected ideas, action status changes, and signoff requested/approved.
- [x] Render last five events in the rail.
- [x] Add “View all activity” modal/drawer with the full chronological log.
- [x] Test event ordering, event copy, fixed `now`, and absence of store access.

### Task 4: Signoff Card

**Files:**

- Modify `IPDetailTeamRail.tsx` or a focused signoff child component.
- Wire callbacks through `IPDetailPage` and app shells.

- [x] Render no-request, pending, and approved signoff states from `ip.signoff`.
- [x] Wire Request approval, Nudge, and Approve callbacks.
- [x] Use `isPaidTier()` from `@variscout/core/tier`; gate only signoff actions, not the rail surface.
- [x] Free tier shows lock + tooltip for Request approval.
- [x] Paid tier enables actions when callbacks exist.
- [x] Show Pat’s Approve CTA only when `activeHub.processOwner` matches the pending process-owner approval context.
- [x] Add tests for the signoff state matrix, tier gates, and Process Owner match.

### Task 5: Responsive Rail

**Files:**

- Modify `IPDetailPage.tsx`, `IPDetailHeader.tsx`, `IPDetailTeamRail.tsx`.
- Modify `packages/stores/src/preferencesStore.ts` and tests.

- [x] Desktop `>=1024px`: 280px rail visible.
- [x] Tablet `768-1023px`: rail collapsed by default, expandable via chevron, persisted in `usePreferencesStore`.
- [x] Mobile `<768px`: rail becomes a drawer opened by a team button in the page header.
- [x] Keep page content first and drawer content last in tab order.
- [x] Add tests for preference default/persistence and drawer open/close.

### Task 6: PWA and Azure Wiring

**Files:**

- Modify `apps/pwa/src/components/ProjectsTabView.tsx`
- Modify `apps/azure/src/components/ProjectsTabView.tsx`
- Modify shell call sites in `apps/pwa/src/App.tsx` and `apps/azure/src/pages/Editor.tsx`

- [x] Pass active hub, ideas/actions, linked sustainment/handoff records, and mutation callbacks into `IPDetailPage`.
- [x] Dispatch `IMPROVEMENT_PROJECT_UPDATE` for team and signoff changes.
- [x] Keep webhook/EngagementEvent as a callback boundary.
- [x] Do not build §6.2 V2 features.

### Task 7: Verification

**Files:**

- Add one PWA Playwright happy-path spec if practical.
- Update tests near touched code.

- [x] Add PWA Playwright happy-path E2E from `active-ip-hub.vrs`.
- [x] Run targeted Vitest suites.
- [x] Run PWA E2E for the new happy path.
- [x] Run Codex Browser visual verification across desktop/tablet/mobile breakpoints, including console-error checks and screenshots.
- [x] Run `pnpm docs:check`, `pnpm build`, and `bash scripts/pr-ready-check.sh`.

### Task 8: Review, Merge, Cleanup

- [x] Use subagent-driven development per task with implementer, spec reviewer, and quality reviewer.
- [x] Dispatch final code-review subagent with STEP 0: `git fetch && git checkout projects-tab-pt-8-team-rail && git branch --show-current`.
- [ ] Open PR-PT-8, squash-merge after green checks and review.
- [ ] Add `docs/decision-log.md` amendment recording PR-PT-8 shipped.
- [ ] Remove `.worktrees/projects-tab-pt-plan3` after merge.

## Test Plan

- Unit: activity derivation, roster append, signoff state matrix, tier gate, preference persistence.
- Component: `IPDetailPage` and `IPDetailTeamRail` desktop/tablet/mobile behavior.
- App integration: PWA and Azure `ProjectsTabView` wiring.
- E2E: PWA Projects detail happy path.
- Visual: Codex Browser desktop/tablet/mobile walkthrough.

## Assumptions

- No §6.2 V2 work ships in PR-PT-8: no threaded comments, @-mentions, signoff queue, per-section RACI, or change notifications UI.
- Minimal optional audit timestamp fields are acceptable Plan 3 schema additions because current types lack fields needed for §6.1.2 event derivation.
- If full `@variscout/ui` Vitest still hangs on the known Canvas runner issue, document targeted passing suites and the known pre-existing hang in PR notes, matching Plan 2 precedent.
