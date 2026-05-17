---
title: Projects Tab Plan 2 — Active-IP Launchpad + Context Cascade
audience: [engineer]
category: implementation
status: active
last-reviewed: 2026-05-15
spec: docs/superpowers/specs/2026-05-14-projects-tab-design.md
related:
  - docs/superpowers/specs/2026-05-14-projects-tab-design.md
  - docs/archive/plans/2026-05-14-projects-tab-foundation.md
  - docs/superpowers/specs/2026-05-14-variscout-coherence-design.md
---

# Projects Tab Plan 2 — Active-IP Launchpad + Context Cascade

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Home as Mira's active Improvement Project launchpad and make that active-IP context visible and reversible across all workspace tabs.

**Architecture:** Add `useActiveIPStore` to `@variscout/stores` as an ADR-078 Annotation-layer store backed by `localStorage` keys shaped `variscout:activeIP:{hubId}:{userId}`. Add shared `@variscout/ui` primitives for the Home launchpad card and IP-context chip, then wire thin PWA/Azure shells to derive the active IP from the current hub + user. Cross-tab scope is explicit and reversible: each tab keeps its free-roaming branch when no active IP is set and switches to an IP-scoped branch only while the chip is present.

**Tech Stack:** Vite + React 19 + TypeScript 6 + Zustand 5 + Vitest + Playwright. Tailwind v4 with semantic tokens, except the §5.1 indigo chip's required raw rgba/hex values.

**Scope:** This is Plan 2 of 4. It does not redesign Pat/Chen/Fred Home variants, does not change the legacy `'improvement'` activeView value, and does not add Document-layer active-IP data or Dexie tables.

---

## File Structure

### New files

- `packages/stores/src/activeIPStore.ts` — Annotation-layer active-IP store, localStorage helpers, key builder, and typed actions.
- `packages/stores/src/__tests__/activeIPStore.test.ts` — store tests for key shape, rehydrate, set, clear, bad payloads, and hub/user isolation.
- `packages/ui/src/components/ActiveIP/ActiveIPLaunchpadCard.tsx` — shared Home primary card for the Project Lead launchpad.
- `packages/ui/src/components/ActiveIP/IPContextChip.tsx` — shared header chip used by both apps.
- `packages/ui/src/components/ActiveIP/activeIPPresentation.ts` — pure helpers for stage label, day counter, urgent line, and activity fallback rows.
- `packages/ui/src/components/ActiveIP/__tests__/ActiveIPLaunchpadCard.test.tsx`
- `packages/ui/src/components/ActiveIP/__tests__/IPContextChip.test.tsx`
- `packages/ui/src/components/ActiveIP/__tests__/activeIPPresentation.test.ts`
- `packages/ui/src/components/ActiveIP/index.ts`
- `apps/pwa/src/hooks/useActiveIPContext.ts`
- `apps/azure/src/hooks/useActiveIPContext.ts`
- `apps/pwa/e2e/active-ip-context.spec.ts`

### Modified files

- `packages/stores/src/index.ts` — export active-IP store API.
- `packages/stores/src/__tests__/layerBoundary.test.ts` — include `activeIPStore.ts` and allow localStorage-backed Annotation store behavior.
- `packages/ui/src/index.ts` — export ActiveIP UI primitives.
- `apps/pwa/src/components/HomeScreen.tsx` and `apps/pwa/src/App.tsx` — render Project Lead active-IP card after data load, add minimal Home workspace access if needed, and wire active-IP scope into header + Projects selection.
- `apps/pwa/src/components/layout/AppHeader.tsx` — add shared `IPContextChip` slot in the utility row.
- `apps/pwa/src/components/ProjectsTabView.tsx` — setting/selecting a project sets active IP and detail selection.
- `apps/azure/src/pages/Editor.tsx` — derive active-IP context from hub + EasyAuth/local user, pass scope to tabs/header.
- `apps/azure/src/components/AppHeader.tsx` — add shared `IPContextChip` slot in desktop and phone header utility areas.
- `apps/azure/src/components/ProjectsTabView.tsx` — setting/selecting a project sets active IP and detail selection.
- `docs/decision-log.md` — add one entry after each merged PR.

---

## PR Slicing

| PR          | Scope                                                                   | Tasks | Depends on     |
| ----------- | ----------------------------------------------------------------------- | ----- | -------------- |
| **PR-PT-6** | Active-IP store, Home launchpad, Projects selection, shared header chip | 8     | Plan 1 merged  |
| **PR-PT-7** | Per-tab free-roaming/IP-scoped cascade + E2E                            | 8     | PR-PT-6 merged |

Both PRs are developed from branch `projects-tab-pt-plan2`. Each task uses a fresh implementer plus spec and quality reviewers. Before the final code-review subagent for each PR, STEP 0 in that subagent prompt must run:

```bash
git fetch && git checkout projects-tab-pt-plan2 && git branch --show-current
```

---

## PR-PT-6: Active-IP Store + Home Launchpad

**Goal:** Active-IP state exists, Home can set/switch/clear it for Mira, Projects list clicks set it, and the shared header chip appears in PWA + Azure.

### Task PR-PT-6.1: Add the active-IP Annotation store

**Files:**

- Create: `packages/stores/src/activeIPStore.ts`
- Create: `packages/stores/src/__tests__/activeIPStore.test.ts`

- [ ] Write failing tests for `activeIPStorageKey`, `setActiveIP`, `getActiveIP`, `rehydrateActiveIP`, `clearActiveIP`, corrupt JSON recovery, hub isolation, and user isolation.
- [ ] Run `pnpm --filter @variscout/stores test -- activeIPStore.test` and confirm the tests fail because the store does not exist.
- [ ] Implement `STORE_LAYER = 'annotation-per-user' as const`, types `ActiveIPState` and `ActiveIPScope`, encoded key helper, and a Zustand store with actions:

```ts
getActiveIP(scope): ActiveIPState | null
setActiveIP(scope, ipId, setAt = Date.now()): void
clearActiveIP(scope): void
rehydrateActiveIP(scope): void
```

- [ ] Store state may keep an in-memory `activeByKey: Record<string, ActiveIPState | null>` cache; localStorage is the persistence authority.
- [ ] On corrupt/non-object payload, remove that localStorage key and return `null`.
- [ ] Run the test command again and confirm it passes.

### Task PR-PT-6.2: Export store and lock ADR-078 layer behavior

**Files:**

- Modify: `packages/stores/src/index.ts`
- Modify: `packages/stores/src/__tests__/layerBoundary.test.ts`
- Modify: `packages/stores/CLAUDE.md`

- [ ] Add a failing test expectation that `activeIPStore.ts` is included in the store-file list.
- [ ] Adjust layer-boundary assertions so `activeIPStore.ts` is allowed as Annotation-layer localStorage state and remains excluded from Document-layer persistence constraints.
- [ ] Export `useActiveIPStore`, `activeIPStorageKey`, and related types from `packages/stores/src/index.ts`.
- [ ] Update the store table in `packages/stores/CLAUDE.md` to list `useActiveIPStore` as Annotation user/hub-scoped UI state with localStorage key `variscout:activeIP:{hubId}:{userId}`.
- [ ] Run `pnpm --filter @variscout/stores test -- layerBoundary.test activeIPStore.test`.

### Task PR-PT-6.3: Add shared Active-IP UI primitives

**Files:**

- Create: `packages/ui/src/components/ActiveIP/*`
- Modify: `packages/ui/src/index.ts`

- [ ] Write failing UI/helper tests for 0 IP, 1 IP auto-active affordance, multiple-IP dropdown, Switch IP, Free roaming, Exit IP, "+ New Improvement Project", chip title click, and chip Exit click.
- [ ] Implement `activeIPPresentation.ts` helpers:
  - stage label derived from IP status + section readiness
  - day counter from `createdAt`
  - urgent line per §4.1 with deterministic fallbacks
  - recent activity fallback rows when no real activity feed exists
- [ ] Implement `ActiveIPLaunchpadCard` with props-only callbacks: `onSelectIP`, `onExitIP`, `onStartNewIP`.
- [ ] Implement `IPContextChip` with exact §5.1 inline style values, title button, and Exit button. Do not nest interactive elements.
- [ ] Export from `packages/ui/src/index.ts`.
- [ ] Run `pnpm --filter @variscout/ui test -- ActiveIP`.

### Task PR-PT-6.4: Wire PWA Home launchpad and active-IP scope

**Files:**

- Modify: `apps/pwa/src/App.tsx`
- Modify: `apps/pwa/src/components/HomeScreen.tsx`
- Create: `apps/pwa/src/hooks/useActiveIPContext.ts`

- [ ] Write failing PWA tests for Home rendering the launchpad when a hub has IPs, selecting an IP setting store state, and Exit clearing the store.
- [ ] Implement PWA scope as `{ hubId: sessionHub.id, userId: 'local' }`.
- [ ] Render the launchpad only for the current Project Lead/Mira default path; do not alter Pat/Chen/Fred future Home shapes.
- [ ] If no post-data Home active view exists, add the minimal `'home'` activeView/nav branch needed to reach Home after data load.
- [ ] One-IP edge case auto-activates on session start; zero-IP shows "+ Start your first Improvement Project".
- [ ] Run targeted PWA tests for Home/App integration.

### Task PR-PT-6.5: Wire Azure Home launchpad and active-IP scope

**Files:**

- Modify: `apps/azure/src/pages/Editor.tsx`
- Create: `apps/azure/src/hooks/useActiveIPContext.ts`

- [ ] Write failing Azure tests for active-IP scope using the current EasyAuth/local user email and clearing invalid/deleted active IPs.
- [ ] Implement Azure scope as `{ hubId: activeHub.id, userId: currentUser.email }`, falling back to `'local'` only for local-dev/no-user test paths.
- [ ] Render the same shared launchpad in the Azure editor Home path or dashboard landing path used for Project Lead work.
- [ ] Do not add cloud sync for active-IP state in this plan.
- [ ] Run targeted Azure tests for Editor/Home integration.

### Task PR-PT-6.6: Wire Projects selection to set active IP

**Files:**

- Modify: `apps/pwa/src/components/ProjectsTabView.tsx`
- Modify: `apps/azure/src/components/ProjectsTabView.tsx`

- [ ] Write failing tests that clicking an IP card both opens detail and sets active IP.
- [ ] In both apps, pass active-IP callbacks from the shell rather than importing app stores inside shared UI.
- [ ] If `selectedProjectId` and active IP disagree, active IP wins only for IP-scoped mode; explicit "All Improvement Projects"/free-roaming clears selected project.
- [ ] Run ProjectsTabView tests in both apps.

### Task PR-PT-6.7: Add shared IP-context chip to PWA and Azure headers

**Files:**

- Modify: `apps/pwa/src/components/layout/AppHeader.tsx`
- Modify: `apps/azure/src/components/AppHeader.tsx`

- [ ] Write failing header tests that the chip appears with `◆ Working in IP: [title] · Exit IP`, title click navigates to Projects detail, and Exit clears scope.
- [ ] Add an optional `activeIPChip` or explicit `activeIPContext` prop to each header and render it in the header utility row while keeping existing toolbar layout stable.
- [ ] Wire title click to `showProjects(activeIP.id)` and Exit to `clearActiveIP(scope)` without changing the current tab unless the current tab needs a free-roaming selectedProject reset.
- [ ] Run PWA and Azure header tests.

### Task PR-PT-6.8: PR-PT-6 verification and review

- [ ] Run:

```bash
pnpm --filter @variscout/stores test
pnpm --filter @variscout/ui test
pnpm --filter @variscout/pwa test
pnpm --filter @variscout/azure-app test
pnpm build
bash scripts/pr-ready-check.sh
```

- [ ] Walk the Home + chip flow with `claude --chrome`.
- [ ] Dispatch final code-review subagent for PR-PT-6 with the required STEP 0 checkout command.
- [ ] Open PR-PT-6 against `main`; squash-merge after review approval.
- [ ] Add a `docs/decision-log.md` entry recording PR-PT-6 as merged.

---

## PR-PT-7: Per-Tab IP Context Cascade

**Goal:** Every tab has free-roaming and IP-scoped behavior, driven by `useActiveIPStore`, without changing the legacy `'improvement'` activeView value.

### Task PR-PT-7.1: Add active-IP resolver behavior

**Files:**

- Modify: `apps/pwa/src/hooks/useActiveIPContext.ts`
- Modify: `apps/azure/src/hooks/useActiveIPContext.ts`

- [ ] Write failing tests for resolver output `{ activeIP, scope, isIPScoped }`.
- [ ] Clear active state when the stored IP id is missing or points to a deleted IP.
- [ ] Rehydrate when hub/user changes and clear the previous hub's active state on hub switch per §5.4.
- [ ] Run hook tests.

### Task PR-PT-7.2: Scope Process tab

**Files:**

- Modify PWA/Azure process/canvas shell files that route `activeView === 'frame'`/Process.

- [ ] Write failing tests proving free-roaming Process still opens whole-Hub canvas and IP-scoped Process applies the active IP focus.
- [ ] Derive focus level from IP fields if no explicit `focusLevel` exists: outcome-only -> L1, `factorControls` -> L2, `mechanismGoals` -> L3.
- [ ] Use existing canvas viewport/store primitives; do not add Document-layer fields.
- [ ] Run targeted Process/canvas tests.

### Task PR-PT-7.3: Scope Analyze tab

**Files:**

- Modify PWA/Azure dashboard/analysis shells.

- [ ] Write failing tests that free-roaming Analyze keeps current chart grid and IP-scoped Analyze renders visible context/filter chips.
- [ ] Apply outcome, linked factor(s), and timeline-since-IP-started display context without permanently mutating `useProjectStore` Document data.
- [ ] Use project `createdAt` as timeline fallback when active-IP `setAt` cannot support data filtering.
- [ ] Run targeted dashboard tests.

### Task PR-PT-7.4: Scope Investigation tab

**Files:**

- Modify PWA `InvestigationView` shell and Azure `InvestigationWorkspace` shell.

- [ ] Write failing tests for filtering to active IP `sections.investigationLineage.hypothesisIds` and `findingIds`.
- [ ] Preserve free-roaming Wall + Evidence Map behavior when no active IP exists.
- [ ] Render an empty scoped state when an IP has no linked hypotheses/findings instead of falling back to all Hub data.
- [ ] Run targeted investigation tests.

### Task PR-PT-7.5: Scope Improve tab without changing legacy value

**Files:**

- Modify PWA/Azure improvement orchestration consumers.

- [ ] Write failing tests that `activeView === 'improvement'` remains unchanged.
- [ ] Free-roaming Improve continues to show all Hub-level PDCA work.
- [ ] IP-scoped Improve filters to the active IP's linked hypotheses/findings and keeps per-cause workbench jump-outs reachable from Projects Approach.
- [ ] Run targeted improvement tests.

### Task PR-PT-7.6: Scope Projects and Report tabs

**Files:**

- Modify PWA/Azure `ProjectsTabView` and Report view shells.

- [ ] Write failing tests that Projects free-roaming shows the list, while IP-scoped Projects opens the active IP detail directly.
- [ ] Write failing tests that Report free-roaming keeps Hub/current portfolio behavior, while IP-scoped Report labels/renders the active IP report using existing Report primitives.
- [ ] Keep deep Report redesign for Plan 4.
- [ ] Run Projects and Report tests.

### Task PR-PT-7.7: Add Playwright active-IP cascade E2E

**Files:**

- Create: `apps/pwa/e2e/active-ip-context.spec.ts`

- [ ] Add a fixture or use an existing sample that contains at least two Improvement Projects.
- [ ] Exercise: Home -> pick IP -> chip appears -> switch tabs -> chip persists -> Exit IP -> chip gone.
- [ ] Assert Projects opens active IP detail in scoped mode and returns to list after Exit IP.
- [ ] Run the new Playwright spec.

### Task PR-PT-7.8: PR-PT-7 verification, review, merge, cleanup

- [ ] Run:

```bash
pnpm --filter @variscout/stores test
pnpm --filter @variscout/ui test
pnpm --filter @variscout/pwa test
pnpm --filter @variscout/azure-app test
pnpm --filter @variscout/pwa test:e2e -- active-ip-context.spec.ts
pnpm build
bash scripts/pr-ready-check.sh
```

- [ ] Walk the cascade with `claude --chrome`.
- [ ] Dispatch final code-review subagent for PR-PT-7 with the required STEP 0 checkout command.
- [ ] Open PR-PT-7 against `main`; squash-merge after review approval.
- [ ] Add a `docs/decision-log.md` entry recording PR-PT-7 as merged.
- [ ] Clean up:

```bash
cd /Users/jukka-mattiturtiainen/Projects/VariScout_lite
git worktree remove .worktrees/projects-tab-pt-plan2
```

---

## Acceptance Criteria

- Active-IP state is localStorage-backed, per hub, per user, and exported only through `@variscout/stores`.
- Home gives Mira a primary Active Improvement Project card with switch, exit, recent activity fallback, and start-new affordances.
- `IPContextChip` is shared UI and appears across all 7 tabs while scoped.
- Every tab keeps its current free-roaming branch and gains a clear IP-scoped branch.
- Legacy Improve tab remains `activeView === 'improvement'`.
- At least one Playwright spec covers the Home-to-chip-to-tabs-to-exit journey.
- Both PRs pass `bash scripts/pr-ready-check.sh` before merge.
