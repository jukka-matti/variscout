---
title: Projects Tab + IP Detail Page Foundation — Implementation Plan
audience: [engineer]
category: implementation
status: active
last-reviewed: 2026-05-14
spec: docs/superpowers/specs/2026-05-14-projects-tab-design.md
related:
  - docs/superpowers/specs/2026-05-14-projects-tab-design.md
  - docs/superpowers/specs/2026-05-14-variscout-coherence-design.md
  - docs/superpowers/specs/2026-05-09-response-path-system-v1-design.md
---

# Projects Tab + IP Detail Page Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the new top-level **Projects** tab with a working IP detail (Lifecycle) page — Charter / Approach / Sustainment / Handoff stage tabs + Overview/Sections segmented toggle + 280px right-rail team workspace — across PWA + Azure. Legacy **Improve** tab stays untouched.

**Architecture:** Add a new `'projects'` value to `panelsStore.activeView` enum (coexists with the existing `'improvement' | 'charter' | 'sustainment' | 'handoff'` peer values; the latter three eventually retire but stay during the transition). Project Lead picks an IP from the new Projects list view → routes to a new `IPDetailPage` component which composes a `IPDetailHeader` + `IPDetailStageTabs` + `IPDetailModeToggle` + per-stage Overview/Sections panels + 280px right rail team workspace. Per-stage UI lives in `packages/ui/src/components/IPDetail/` for cross-app sharing. PWA + Azure both get thin per-app shells (~30 LOC) that wire the new component into their `activeView === 'projects'` branch.

**Tech Stack:** Vite + React 19 + TypeScript 6 + Zustand 5 + Vitest + Playwright (E2E). Tailwind v4 with semantic tokens. The IP entity (`@variscout/core/improvementProject`) already exists per RPS V1 — this plan extends it with one optional `reflection?: string` field and reuses the existing `ImprovementProjectForm` for Sections mode. No new Dexie tables.

**Scope:** This is Plan 1 of 4 (foundation). Plans 2-4 (Home active-IP launchpad + IP-context cascade / Team rail V1 details / Report tab IP-scoped) ship after this plan delivers a usable list-and-detail surface.

---

## File Structure

### New files

**`packages/core/src/improvementProject/types.ts` (modify)** — add `reflection?: string` to `ImprovementProject` interface.

**`packages/ui/src/components/IPDetail/` (new directory)** — cross-app shared components for the IP detail page.

- `IPDetailPage.tsx` — top-level component composing header + stage tabs + mode toggle + body + right rail
- `IPDetailHeader.tsx` — back-link / status pill / title / goal summary / team avatars + Invite
- `IPDetailStageTabs.tsx` — Charter / Approach / Sustainment / Handoff with stage-state derivation
- `IPDetailModeToggle.tsx` — Overview/Sections segmented control (Pattern #2)
- `IPDetailTeamRail.tsx` — 280px right rail container (V1: roster + activity feed + signoff card)
- `stages/CharterOverview.tsx` — Charter stage Overview content
- `stages/CharterSections.tsx` — Charter stage Sections content (wraps existing `ImprovementProjectForm`)
- `stages/ApproachOverview.tsx` — Approach stage Overview content (per-cause cards)
- `stages/ApproachSections.tsx` — Approach stage Sections content (per-cause read-mode workbench)
- `stages/ApproachCauseCard.tsx` — per-SuspectedCause card primitive
- `stages/SustainmentOverview.tsx` — cadence ticks + Cpk chart + per-cause in-control
- `stages/SustainmentSections.tsx` — linked SustainmentRecord form
- `stages/HandoffOverview.tsx` — operationalization checklist
- `stages/HandoffSections.tsx` — linked ControlHandoff form
- `stageState.ts` — pure function deriving `{ charter, approach, sustainment, handoff }` state from an `ImprovementProject` + linked Sustainment/Handoff records
- `__tests__/stageState.test.ts` — unit tests for stage-state derivation
- `__tests__/IPDetailPage.test.tsx` — component test for the top-level composition
- `__tests__/ApproachCauseCard.test.tsx` — per-cause card test
- `index.ts` — barrel export

**`apps/pwa/src/components/ProjectsTabView.tsx` (new)** — PWA route shell for `activeView === 'projects'`. Renders IP list view OR IPDetailPage based on `selectedProjectId`.

**`apps/azure/src/components/ProjectsTabView.tsx` (new)** — Azure equivalent.

### Modified files

**`packages/core/src/improvementProject/types.ts`** — add `reflection?: string`.

**`packages/core/src/improvementProject/__tests__/types.test.ts`** — extend test to cover new field.

**`apps/pwa/src/features/panels/panelsStore.ts`** — add `'projects'` to `activeView` union + `showProjects` action + `selectedProjectId` field.

**`apps/pwa/src/features/panels/__tests__/panelsStore.test.ts`** — test new action + field.

**`apps/pwa/src/hooks/useAppPanels.ts`** — surface `showProjects` + `selectedProjectId` in the return interface.

**`apps/pwa/src/App.tsx`** — add `activeView === 'projects'` branch rendering `ProjectsTabView`. Add Projects tab button to the nav. Rename the existing Improvement tab button to "Improve" (the underlying `activeView === 'improvement'` value stays).

**`apps/azure/src/features/panels/panelsStore.ts`** (or equivalent) — mirror PWA changes.

**`apps/azure/src/components/AppHeader.tsx`** — add Projects tab button + rename Improvement to Improve.

**`apps/azure/src/pages/Editor.tsx`** (or equivalent route file) — add `activeView === 'projects'` branch.

---

## PR Slicing

| PR          | Scope                                                                                                        | Tasks | Depends on |
| ----------- | ------------------------------------------------------------------------------------------------------------ | ----- | ---------- |
| **PR-PT-1** | Foundation: `reflection` field + panelsStore extension + Projects route shell + nav button                   | 7     | —          |
| **PR-PT-2** | IP detail page anatomy: header + stage tabs row + mode toggle + right rail skeleton + stage-state derivation | 7     | PR-PT-1    |
| **PR-PT-3** | Charter stage Overview + Sections                                                                            | 6     | PR-PT-2    |
| **PR-PT-4** | Approach stage SuspectedCause-anchored Overview + Sections                                                   | 7     | PR-PT-2    |
| **PR-PT-5** | Sustainment + Handoff stages Overview + Sections                                                             | 7     | PR-PT-2    |

All PRs off branch `projects-tab-foundation`. Each PR uses `superpowers:subagent-driven-development` with Sonnet as workhorse (≥70% per `feedback_subagent_driven_default`); Opus for final PR review.

**Partial-integration policy:** PR-PT-1 stands alone (engine + skeleton route; the route renders an empty list). PR-PT-2 mounts on dev pages without app integration (UI primitive). PR-PT-3/4/5 integrate progressively — each PR delivers a working stage subset.

---

## PR-PT-1: Foundation

**Goal:** Add `reflection` to the IP type, extend `panelsStore` with `'projects'` activeView + `selectedProjectId` field, add a Projects route shell that renders a placeholder list, and add a Projects tab button to the nav.

**Files:**

- Modify: `packages/core/src/improvementProject/types.ts`
- Modify: `packages/core/src/improvementProject/__tests__/types.test.ts`
- Modify: `apps/pwa/src/features/panels/panelsStore.ts`
- Modify: `apps/pwa/src/features/panels/__tests__/panelsStore.test.ts`
- Modify: `apps/pwa/src/hooks/useAppPanels.ts`
- Create: `apps/pwa/src/components/ProjectsTabView.tsx`
- Modify: `apps/pwa/src/App.tsx`
- Modify: `apps/azure/src/components/AppHeader.tsx`
- Modify (or equivalent): `apps/azure/src/pages/Editor.tsx`
- Create: `apps/azure/src/components/ProjectsTabView.tsx`

### Task PR-PT-1.1: Add `reflection?: string` to ImprovementProject type

**Files:**

- Modify: `packages/core/src/improvementProject/types.ts`
- Test: `packages/core/src/improvementProject/__tests__/types.test.ts`

- [ ] **Step 1: Write the failing test** — append to `__tests__/types.test.ts`:

```typescript
it('accepts optional reflection narrative field', () => {
  const ip: ImprovementProject = {
    id: 'ip-1',
    hubId: 'hub-1',
    createdAt: 0,
    deletedAt: null,
    status: 'closed',
    metadata: { title: 'Heads 5-8 lift' },
    goal: {
      outcomeGoal: { outcomeSpecId: 'outcome-1', target: 1.33 },
    },
    sections: {
      background: {},
      investigationLineage: {},
      approach: {},
      outcomeReference: {},
    },
    updatedAt: 0,
    reflection:
      'The mid-shift thermal cycle drift was invisible until the SCOUT subgroup analysis. Future cadence will include a routine subgroup-by-hour check.',
  };
  expect(ip.reflection).toContain('SCOUT subgroup analysis');
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/core test -- types.test
```

Expected: FAIL with `Property 'reflection' does not exist on type 'ImprovementProject'`.

- [ ] **Step 3: Add the field to the interface** in `packages/core/src/improvementProject/types.ts`, insert after `signoff?: ImprovementProjectSignoff;`:

```typescript
  /** Optional analyst-authored lessons-learned narrative. Authored in
   *  Sections mode (Sustainment or Handoff stages typically); surfaces in
   *  the Report Overview "What we standardized + learned" section. */
  reflection?: string;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @variscout/core test -- types.test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/improvementProject/types.ts packages/core/src/improvementProject/__tests__/types.test.ts
git commit -m "feat(core): add optional ImprovementProject.reflection field"
```

### Task PR-PT-1.2: Extend `panelsStore` with `'projects'` activeView + `selectedProjectId`

**Files:**

- Modify: `apps/pwa/src/features/panels/panelsStore.ts`
- Test: `apps/pwa/src/features/panels/__tests__/panelsStore.test.ts`

- [ ] **Step 1: Write the failing test** — append to `__tests__/panelsStore.test.ts`:

```typescript
describe('Projects tab', () => {
  it('showProjects sets activeView to projects with no selectedProjectId', () => {
    usePanelsStore.getState().showProjects();
    const s = usePanelsStore.getState();
    expect(s.activeView).toBe('projects');
    expect(s.selectedProjectId).toBeNull();
  });

  it('showProjects(projectId) sets activeView to projects with selected id', () => {
    usePanelsStore.getState().showProjects('ip-42');
    const s = usePanelsStore.getState();
    expect(s.activeView).toBe('projects');
    expect(s.selectedProjectId).toBe('ip-42');
  });

  it('initial state has selectedProjectId null', () => {
    expect(usePanelsStore.getState().selectedProjectId).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/pwa test -- panelsStore.test
```

Expected: FAIL with `Property 'showProjects' does not exist`.

- [ ] **Step 3: Add `'projects'` to `activeView` union + add `selectedProjectId` field + add `showProjects` action.**

In `apps/pwa/src/features/panels/panelsStore.ts`, update the `activeView` type union (lines 8-16) to include `'projects'`:

```typescript
  activeView:
    | 'frame'
    | 'analysis'
    | 'investigation'
    | 'improvement'
    | 'projects'
    | 'report'
    | 'charter'
    | 'sustainment'
    | 'handoff';
```

Add `selectedProjectId: string | null;` to the `PanelsState` interface alongside other nullable fields.

Add `showProjects: (projectId?: string) => void;` to `PanelsActions`.

Update `initialPanelsState` to include `selectedProjectId: null,`.

Add the action implementation in the store body (next to `showImprovement`):

```typescript
  showProjects: projectId =>
    set({ activeView: 'projects', selectedProjectId: projectId ?? null }),
```

Apply the same change to the `activeView` union type in `apps/pwa/src/hooks/useAppPanels.ts:17-25`.

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @variscout/pwa test -- panelsStore.test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/features/panels/panelsStore.ts apps/pwa/src/features/panels/__tests__/panelsStore.test.ts apps/pwa/src/hooks/useAppPanels.ts
git commit -m "feat(pwa): add 'projects' activeView + selectedProjectId to panelsStore"
```

### Task PR-PT-1.3: Surface `showProjects` + `selectedProjectId` through useAppPanels

**Files:**

- Modify: `apps/pwa/src/hooks/useAppPanels.ts`

- [ ] **Step 1: Add field to the return interface.** In `useAppPanels.ts` interface `UseAppPanelsReturn`, add:

```typescript
  showProjects: (projectId?: string) => void;
  selectedProjectId: string | null;
```

- [ ] **Step 2: Wire selector in the hook body.** In the field-selector section (after `handoffTargetId`):

```typescript
const selectedProjectId = usePanelsStore(s => s.selectedProjectId);
```

In the action selector section (after `showImprovement`):

```typescript
const showProjects = usePanelsStore(s => s.showProjects);
```

- [ ] **Step 3: Add to the return object.** In the return statement (after `showImprovement`):

```typescript
    showProjects,
    selectedProjectId,
```

- [ ] **Step 4: Run all panels tests to confirm no regression**

```bash
pnpm --filter @variscout/pwa test -- panelsStore
```

Expected: PASS, including the new Projects-tab block from Task PR-PT-1.2.

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/hooks/useAppPanels.ts
git commit -m "feat(pwa): expose showProjects + selectedProjectId via useAppPanels"
```

### Task PR-PT-1.4: Create `ProjectsTabView` skeleton (PWA)

**Files:**

- Create: `apps/pwa/src/components/ProjectsTabView.tsx`
- Test: `apps/pwa/src/components/__tests__/ProjectsTabView.test.tsx`

- [ ] **Step 1: Write the failing test** — create `apps/pwa/src/components/__tests__/ProjectsTabView.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProjectsTabView from '../ProjectsTabView';
import type { ProcessHub } from '@variscout/core';

const baseHub: ProcessHub = {
  id: 'hub-1',
  name: 'Filling Line 3',
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  outcomes: [],
  improvementProjects: [],
};

describe('ProjectsTabView', () => {
  it('renders an empty-state CTA when the hub has no IPs', () => {
    render(<ProjectsTabView activeHub={baseHub} selectedProjectId={null} onSelectProject={() => {}} />);
    expect(screen.getByText(/start your first improvement project/i)).toBeInTheDocument();
  });

  it('renders a list of IP cards when projects exist', () => {
    const hub: ProcessHub = {
      ...baseHub,
      improvementProjects: [
        {
          id: 'ip-1',
          hubId: 'hub-1',
          createdAt: 0,
          updatedAt: 0,
          deletedAt: null,
          status: 'active',
          metadata: { title: 'Heads 5-8 Cpk shortfall' },
          goal: { outcomeGoal: { outcomeSpecId: 'outcome-1', target: 1.33 } },
          sections: { background: {}, investigationLineage: {}, approach: {}, outcomeReference: {} },
        },
      ],
    };
    render(<ProjectsTabView activeHub={hub} selectedProjectId={null} onSelectProject={() => {}} />);
    expect(screen.getByText('Heads 5-8 Cpk shortfall')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/pwa test -- ProjectsTabView
```

Expected: FAIL — file doesn't exist.

- [ ] **Step 3: Create the component** at `apps/pwa/src/components/ProjectsTabView.tsx`:

```typescript
import React from 'react';
import type { ProcessHub } from '@variscout/core';
import type { ImprovementProject } from '@variscout/core/improvementProject';

interface ProjectsTabViewProps {
  activeHub?: ProcessHub;
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
}

function liveProjects(hub: ProcessHub | undefined): ImprovementProject[] {
  return (hub?.improvementProjects ?? []).filter(p => p.deletedAt === null);
}

const ProjectsTabView: React.FC<ProjectsTabViewProps> = ({
  activeHub,
  selectedProjectId,
  onSelectProject,
}) => {
  const projects = liveProjects(activeHub);

  if (!activeHub) {
    return (
      <div className="p-4 text-sm text-content-secondary">
        Create or select a Process Hub before opening Projects.
      </div>
    );
  }

  // Selected project → detail page (wired in PR-PT-2)
  if (selectedProjectId) {
    return (
      <div data-testid="ip-detail-placeholder" className="p-4">
        <p className="text-content-secondary">IP detail page for {selectedProjectId} (wired in PR-PT-2)</p>
      </div>
    );
  }

  // No selection → list view
  if (projects.length === 0) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-lg font-semibold text-content">No Improvement Projects yet</h2>
        <p className="mt-2 text-sm text-content-secondary">
          Start your first Improvement Project from a canvas card drill-down, or click below to draft one.
        </p>
        <button
          type="button"
          className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Start your first Improvement Project
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-content">Improvement Projects</h2>
        <button
          type="button"
          className="text-sm text-indigo-600 hover:text-indigo-700"
        >
          + New Improvement Project
        </button>
      </div>
      <ul className="space-y-2">
        {projects.map(project => (
          <li key={project.id}>
            <button
              type="button"
              onClick={() => onSelectProject(project.id)}
              className="w-full rounded-md border border-edge bg-surface p-3 text-left hover:bg-surface-secondary"
            >
              <div className="font-medium text-content">{project.metadata.title}</div>
              <div className="mt-1 text-xs text-content-secondary">
                {project.status.toUpperCase()}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProjectsTabView;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @variscout/pwa test -- ProjectsTabView
```

Expected: PASS (both empty-state and list tests).

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/components/ProjectsTabView.tsx apps/pwa/src/components/__tests__/ProjectsTabView.test.tsx
git commit -m "feat(pwa): add ProjectsTabView skeleton with list + empty state"
```

### Task PR-PT-1.5: Wire ProjectsTabView into PWA App.tsx + add "Improvement Projects" tab button

**Files:**

- Modify: `apps/pwa/src/App.tsx`

- [ ] **Step 1: Add lazy import.** Near the other `lazyWithRetry` imports (around line 111):

```typescript
const ProjectsTabView = lazyWithRetry(() => import('./components/ProjectsTabView'));
```

- [ ] **Step 2: Add the `activeView === 'projects'` branch** in the JSX switch (around line 1093, where `activeView === 'improvement'` branch lives). Insert a new branch BEFORE the `'improvement'` branch:

```typescript
            ) : panels.activeView === 'projects' ? (
              <ProjectsTabView
                activeHub={activeHub}
                selectedProjectId={panels.selectedProjectId}
                onSelectProject={panels.showProjects}
              />
```

- [ ] **Step 3: Find the nav button row** (search for the existing `Improvement` button — search `data-testid="nav-improvement"` or the button text "Improvement"). Add a new button **AFTER** the Improvement button and **BEFORE** the Report button:

```tsx
<button
  type="button"
  data-testid="nav-projects"
  className={navButtonClass(panels.activeView === 'projects')}
  onClick={() => panels.showProjects()}
>
  Projects
</button>
```

Where `navButtonClass(active: boolean): string` is the existing helper that returns the active/inactive nav button styling (locate the existing usage on the Improvement button and reuse the same expression).

Also rename the existing Improvement button label from "Improvement" to "Improve":

```tsx
{
  /* was: "Improvement" — renamed per coherence amendment 2026-05-14 */
}
Improve;
```

- [ ] **Step 4: Verify in browser via `claude --chrome`.**

```bash
pnpm --filter @variscout/pwa dev
```

In the browser (running `claude --chrome` session): confirm tab buttons read `Home | Process | Analyze | Investigation | Improve | Projects | Report`. Clicking Projects shows the empty-state CTA when no IPs exist; with seeded data shows the list view.

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/App.tsx
git commit -m "feat(pwa): wire Projects tab into App.tsx + rename Improvement → Improve"
```

### Task PR-PT-1.6: Mirror Projects tab into Azure app

**Files:**

- Create: `apps/azure/src/components/ProjectsTabView.tsx`
- Modify: `apps/azure/src/components/AppHeader.tsx`
- Modify (whichever route file owns `activeView` switching, likely): `apps/azure/src/pages/Editor.tsx`
- Modify: `apps/azure/src/features/panels/panelsStore.ts` (or wherever Azure's panels store lives) — apply the same `'projects'` activeView + `selectedProjectId` + `showProjects` changes from PR-PT-1.2

- [ ] **Step 1: Discover Azure's panels store location.**

```bash
grep -r "showImprovement\b" apps/azure/src 2>&1 | head -10
```

Open the file that defines the activeView enum + actions. Apply the same shape changes as PR-PT-1.2: add `'projects'` to the union, `selectedProjectId: string | null` to state, `showProjects: (projectId?: string) => void` to actions, with the implementation `set({ activeView: 'projects', selectedProjectId: projectId ?? null })`.

- [ ] **Step 2: Create the Azure-side ProjectsTabView.**

Create `apps/azure/src/components/ProjectsTabView.tsx`. Body is identical to the PWA version EXCEPT the import path for the Azure persistence layer if needed (V1 doesn't reach into persistence here — the component reads `activeHub.improvementProjects` directly).

Copy the PWA implementation verbatim from PR-PT-1.4 Step 3.

- [ ] **Step 3: Add Projects tab button to AppHeader.**

In `apps/azure/src/components/AppHeader.tsx`, find the existing nav buttons. Add a `Projects` button between Improvement and Report (apply the same nav button class pattern Azure uses). Rename "Improvement" label → "Improve".

- [ ] **Step 4: Add `activeView === 'projects'` branch to the Editor route.**

In whichever file routes the Azure activeView (likely `apps/azure/src/pages/Editor.tsx` or `apps/azure/src/pages/Dashboard.tsx`), insert a `activeView === 'projects'` branch before `activeView === 'improvement'`:

```tsx
{
  activeView === 'projects' && (
    <ProjectsTabView
      activeHub={activeHub}
      selectedProjectId={selectedProjectId}
      onSelectProject={showProjects}
    />
  );
}
```

- [ ] **Step 5: Verify Azure dev server**

```bash
pnpm --filter @variscout/azure-app dev
```

Confirm tab nav reads with Improve + Projects; clicking Projects renders the same list/empty-state surface as PWA.

- [ ] **Step 6: Commit**

```bash
git add apps/azure/src/components/ProjectsTabView.tsx apps/azure/src/components/AppHeader.tsx apps/azure/src/pages/Editor.tsx apps/azure/src/features/panels/panelsStore.ts
git commit -m "feat(azure): mirror Projects tab into Azure app"
```

### Task PR-PT-1.7: PR-PT-1 review + push

- [ ] **Step 1: Run pr-ready-check across the workspace.**

```bash
bash scripts/pr-ready-check.sh
```

Expected: green.

- [ ] **Step 2: Push branch + open PR.**

```bash
git push -u origin projects-tab-foundation
gh pr create --title "feat(projects): PR-PT-1 foundation — reflection field + Projects tab routing" --body "$(cat <<'EOF'
## Summary
- Adds optional `ImprovementProject.reflection?: string` per Projects-tab spec D14
- Extends `panelsStore` with `'projects'` activeView + `selectedProjectId` + `showProjects` action (PWA + Azure)
- Adds `ProjectsTabView` skeleton in both apps — empty state + list view; selected-project case falls through to placeholder (wired in PR-PT-2)
- Adds Projects tab button to nav between Improve and Report; renames "Improvement" label → "Improve"

## Test plan
- [ ] `pnpm --filter @variscout/core test` — green
- [ ] `pnpm --filter @variscout/pwa test` — green
- [ ] `pnpm --filter @variscout/azure-app test` — green
- [ ] `claude --chrome` walk in PWA: Improve + Projects tabs visible; clicking Projects shows empty-state CTA on a 0-IP hub and list view on a seeded hub
- [ ] `claude --chrome` walk in Azure: parity with PWA
EOF
)"
```

- [ ] **Step 3: Dispatch final code-review subagent on the PR branch** per `feedback_code_review_subagent_must_checkout_pr_branch`.

---

## PR-PT-2: IP detail page anatomy

**Goal:** Build the IP detail (Lifecycle) page skeleton — header / stage tabs / Overview-Sections toggle / 280px right rail — with stage-state derivation. Each stage's body renders placeholder copy; PR-PT-3/4/5 fill them in.

**Files:**

- Create: `packages/ui/src/components/IPDetail/IPDetailPage.tsx`
- Create: `packages/ui/src/components/IPDetail/IPDetailHeader.tsx`
- Create: `packages/ui/src/components/IPDetail/IPDetailStageTabs.tsx`
- Create: `packages/ui/src/components/IPDetail/IPDetailModeToggle.tsx`
- Create: `packages/ui/src/components/IPDetail/IPDetailTeamRail.tsx`
- Create: `packages/ui/src/components/IPDetail/stageState.ts`
- Create: `packages/ui/src/components/IPDetail/__tests__/stageState.test.ts`
- Create: `packages/ui/src/components/IPDetail/__tests__/IPDetailPage.test.tsx`
- Create: `packages/ui/src/components/IPDetail/index.ts`
- Modify: `packages/ui/src/index.ts` — export `IPDetailPage`
- Modify: `packages/ui/package.json` — add `./ipDetail` sub-path if barrel re-export not preferred
- Modify: `apps/pwa/src/components/ProjectsTabView.tsx` — wire the new component into the selected-project case
- Modify: `apps/azure/src/components/ProjectsTabView.tsx` — same

### Task PR-PT-2.1: Stage-state derivation (pure function + tests)

**Files:**

- Create: `packages/ui/src/components/IPDetail/stageState.ts`
- Test: `packages/ui/src/components/IPDetail/__tests__/stageState.test.ts`

- [ ] **Step 1: Write the failing test** — create `__tests__/stageState.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { deriveStageState, type StageStateMap } from '../stageState';
import type { ImprovementProject } from '@variscout/core/improvementProject';

const baseIP: ImprovementProject = {
  id: 'ip-1',
  hubId: 'hub-1',
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  status: 'draft',
  metadata: { title: 'X' },
  goal: { outcomeGoal: { outcomeSpecId: 'o-1', target: 1.33 } },
  sections: { background: {}, investigationLineage: {}, approach: {}, outcomeReference: {} },
};

describe('deriveStageState', () => {
  it('charter is current when IP is draft with no investigation linked', () => {
    const state: StageStateMap = deriveStageState(baseIP);
    expect(state.charter).toBe('current');
    expect(state.approach).toBe('not-started');
    expect(state.sustainment).toBe('locked');
    expect(state.handoff).toBe('locked');
  });

  it('approach becomes current when IP is active', () => {
    const ip: ImprovementProject = { ...baseIP, status: 'active' };
    const state = deriveStageState(ip);
    expect(state.charter).toBe('done');
    expect(state.approach).toBe('current');
    expect(state.sustainment).toBe('locked');
  });

  it('sustainment unlocks when IP is closed', () => {
    const ip: ImprovementProject = { ...baseIP, status: 'closed' };
    const state = deriveStageState(ip);
    expect(state.charter).toBe('done');
    expect(state.approach).toBe('done');
    expect(state.sustainment).toBe('current');
    expect(state.handoff).toBe('locked');
  });

  it('handoff unlocks when sustainmentConfirmed flag passed', () => {
    const ip: ImprovementProject = { ...baseIP, status: 'closed' };
    const state = deriveStageState(ip, { sustainmentConfirmed: true });
    expect(state.sustainment).toBe('done');
    expect(state.handoff).toBe('current');
  });

  it('all stages done when handoff is operational', () => {
    const ip: ImprovementProject = { ...baseIP, status: 'closed' };
    const state = deriveStageState(ip, { sustainmentConfirmed: true, handoffOperational: true });
    expect(state.handoff).toBe('done');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test -- stageState
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `stageState.ts`:**

```typescript
import type { ImprovementProject } from '@variscout/core/improvementProject';

export type StageState = 'done' | 'current' | 'not-started' | 'locked';

export interface StageStateMap {
  charter: StageState;
  approach: StageState;
  sustainment: StageState;
  handoff: StageState;
}

export interface StageStateInputs {
  /** True when the linked SustainmentRecord has reached confirmed-sustained status. */
  sustainmentConfirmed?: boolean;
  /** True when the linked ControlHandoff has reached operational status. */
  handoffOperational?: boolean;
}

/**
 * Pure derivation of the 4-stage state from an ImprovementProject + optional
 * linked-artifact signals. Used by IPDetailStageTabs to render the visual
 * state (✓ done / current with underline / ○ not-started / ⏸ locked).
 */
export function deriveStageState(
  ip: ImprovementProject,
  inputs: StageStateInputs = {}
): StageStateMap {
  const { sustainmentConfirmed = false, handoffOperational = false } = inputs;

  if (handoffOperational) {
    return { charter: 'done', approach: 'done', sustainment: 'done', handoff: 'done' };
  }

  if (sustainmentConfirmed) {
    return { charter: 'done', approach: 'done', sustainment: 'done', handoff: 'current' };
  }

  if (ip.status === 'closed') {
    return { charter: 'done', approach: 'done', sustainment: 'current', handoff: 'locked' };
  }

  if (ip.status === 'active') {
    return { charter: 'done', approach: 'current', sustainment: 'locked', handoff: 'locked' };
  }

  // draft
  return { charter: 'current', approach: 'not-started', sustainment: 'locked', handoff: 'locked' };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @variscout/ui test -- stageState
```

Expected: PASS — all 5 cases green.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/IPDetail/stageState.ts packages/ui/src/components/IPDetail/__tests__/stageState.test.ts
git commit -m "feat(ui): add IP detail stage-state derivation function"
```

### Task PR-PT-2.2: IPDetailHeader component

**Files:**

- Create: `packages/ui/src/components/IPDetail/IPDetailHeader.tsx`

- [ ] **Step 1: Create the component:**

```typescript
import React from 'react';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import type { ProcessParticipantRef } from '@variscout/core/processHub';

interface IPDetailHeaderProps {
  ip: ImprovementProject;
  onBackToList: () => void;
  onInviteClick?: () => void;
  /** Day counter — computed by caller (typically Math.floor((now - createdAt) / DAY_MS)). */
  dayCounter?: number;
}

const STATUS_COLORS: Record<ImprovementProject['status'], string> = {
  draft: 'bg-slate-100 text-slate-700',
  active: 'bg-green-100 text-green-800',
  closed: 'bg-indigo-100 text-indigo-700',
};

function avatarColor(name: string): string {
  // deterministic, no random
  const palette = ['bg-amber-200', 'bg-green-200', 'bg-blue-200', 'bg-rose-200', 'bg-purple-200'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length] ?? palette[0]!;
}

function initial(person: ProcessParticipantRef): string {
  const name = (person as { displayName?: string }).displayName ?? person.id;
  return name.slice(0, 1).toUpperCase();
}

const IPDetailHeader: React.FC<IPDetailHeaderProps> = ({
  ip,
  onBackToList,
  onInviteClick,
  dayCounter,
}) => {
  const team = ip.metadata.team ?? [];
  const visible = team.slice(0, 5);
  const overflow = team.length - visible.length;

  const goalSummary = (() => {
    const Ytarget = ip.goal.outcomeGoal.target;
    const baseline = ip.goal.outcomeGoal.baseline;
    if (baseline !== undefined) {
      return `Lift outcome from ${baseline} → ${Ytarget}`;
    }
    return `Target ${Ytarget}`;
  })();

  return (
    <div className="border-b border-edge bg-surface px-6 py-4">
      <div className="flex items-center gap-2 text-xs text-content-secondary">
        <button
          type="button"
          onClick={onBackToList}
          className="hover:text-content"
          data-testid="ip-detail-back"
        >
          ← All Improvement Projects
        </button>
        <span>·</span>
        <span
          className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[ip.status]}`}
        >
          {ip.status.toUpperCase()}
        </span>
      </div>

      <div className="mt-2 flex items-start gap-4">
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-content" data-testid="ip-detail-title">
            {ip.metadata.title}
          </h1>
          <div className="mt-1 text-xs text-content-secondary">
            {goalSummary}
            {dayCounter !== undefined ? ` · Day ${dayCounter}` : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex">
            {visible.map((member, idx) => (
              <div
                key={member.person.id}
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface text-xs font-semibold text-content ${avatarColor(member.person.id)} ${idx > 0 ? '-ml-2' : ''}`}
                title={(member.person as { displayName?: string }).displayName ?? member.person.id}
              >
                {initial(member.person)}
              </div>
            ))}
            {overflow > 0 ? (
              <div className="-ml-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface bg-slate-200 text-xs font-semibold text-content">
                +{overflow}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onInviteClick}
            className="text-xs text-indigo-600 hover:text-indigo-700"
            data-testid="ip-detail-invite"
          >
            + Invite
          </button>
        </div>
      </div>
    </div>
  );
};

export default IPDetailHeader;
```

- [ ] **Step 2: Add a test** at `__tests__/IPDetailHeader.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import IPDetailHeader from '../IPDetailHeader';
import type { ImprovementProject } from '@variscout/core/improvementProject';

const ip: ImprovementProject = {
  id: 'ip-1',
  hubId: 'hub-1',
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  status: 'active',
  metadata: { title: 'Heads 5-8 Cpk shortfall' },
  goal: { outcomeGoal: { outcomeSpecId: 'o-1', baseline: 0.61, target: 1.33 } },
  sections: { background: {}, investigationLineage: {}, approach: {}, outcomeReference: {} },
};

describe('IPDetailHeader', () => {
  it('renders title + status + goal summary', () => {
    render(<IPDetailHeader ip={ip} onBackToList={() => {}} />);
    expect(screen.getByTestId('ip-detail-title')).toHaveTextContent('Heads 5-8 Cpk shortfall');
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getByText(/0\.61.*1\.33/)).toBeInTheDocument();
  });

  it('calls onBackToList when back button clicked', () => {
    const onBack = vi.fn();
    render(<IPDetailHeader ip={ip} onBackToList={onBack} />);
    fireEvent.click(screen.getByTestId('ip-detail-back'));
    expect(onBack).toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run test**

```bash
pnpm --filter @variscout/ui test -- IPDetailHeader
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/components/IPDetail/IPDetailHeader.tsx packages/ui/src/components/IPDetail/__tests__/IPDetailHeader.test.tsx
git commit -m "feat(ui): add IPDetailHeader component"
```

### Task PR-PT-2.3: IPDetailStageTabs component

**Files:**

- Create: `packages/ui/src/components/IPDetail/IPDetailStageTabs.tsx`
- Test: `packages/ui/src/components/IPDetail/__tests__/IPDetailStageTabs.test.tsx`

- [ ] **Step 1: Write the failing test:**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import IPDetailStageTabs from '../IPDetailStageTabs';
import type { StageStateMap } from '../stageState';

const stages: StageStateMap = {
  charter: 'done',
  approach: 'current',
  sustainment: 'locked',
  handoff: 'locked',
};

describe('IPDetailStageTabs', () => {
  it('renders all 4 stage tabs with state-specific icons', () => {
    render(<IPDetailStageTabs stages={stages} active="approach" onStageChange={() => {}} />);
    expect(screen.getByTestId('stage-tab-charter')).toHaveTextContent('Charter');
    expect(screen.getByTestId('stage-tab-charter')).toHaveTextContent('✓');
    expect(screen.getByTestId('stage-tab-sustainment')).toHaveTextContent('⏸');
  });

  it('does not call onStageChange when locked stage clicked', () => {
    const onChange = vi.fn();
    render(<IPDetailStageTabs stages={stages} active="approach" onStageChange={onChange} />);
    fireEvent.click(screen.getByTestId('stage-tab-sustainment'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('calls onStageChange with the clicked stage name', () => {
    const onChange = vi.fn();
    render(<IPDetailStageTabs stages={stages} active="approach" onStageChange={onChange} />);
    fireEvent.click(screen.getByTestId('stage-tab-charter'));
    expect(onChange).toHaveBeenCalledWith('charter');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test -- IPDetailStageTabs
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `IPDetailStageTabs.tsx`:**

```typescript
import React from 'react';
import type { StageStateMap, StageState } from './stageState';

export type StageName = 'charter' | 'approach' | 'sustainment' | 'handoff';

interface IPDetailStageTabsProps {
  stages: StageStateMap;
  active: StageName;
  onStageChange: (stage: StageName) => void;
}

const ICON: Record<StageState, string> = {
  'done': '✓',
  'current': '',
  'not-started': '○',
  'locked': '⏸',
};

const LABEL: Record<StageName, string> = {
  charter: 'Charter',
  approach: 'Approach',
  sustainment: 'Sustainment',
  handoff: 'Handoff',
};

const STAGE_ORDER: StageName[] = ['charter', 'approach', 'sustainment', 'handoff'];

function stageClass(state: StageState, isActive: boolean): string {
  if (isActive) return 'border-b-2 border-indigo-500 text-indigo-600 font-semibold';
  if (state === 'done') return 'text-content-secondary border-b-2 border-transparent';
  if (state === 'locked') return 'text-content-tertiary cursor-not-allowed border-b-2 border-transparent';
  return 'text-content-secondary border-b-2 border-transparent';
}

const IPDetailStageTabs: React.FC<IPDetailStageTabsProps> = ({
  stages,
  active,
  onStageChange,
}) => {
  return (
    <div className="flex gap-0" role="tablist" aria-label="IP lifecycle stages">
      {STAGE_ORDER.map(stage => {
        const state = stages[stage];
        const isActive = active === stage;
        const isLocked = state === 'locked';
        const icon = ICON[state];

        return (
          <button
            key={stage}
            type="button"
            role="tab"
            aria-selected={isActive}
            data-testid={`stage-tab-${stage}`}
            disabled={isLocked}
            onClick={() => !isLocked && onStageChange(stage)}
            className={`px-4 py-2 text-sm transition-colors ${stageClass(state, isActive)}`}
          >
            {icon ? <span className="mr-1">{icon}</span> : null}
            {LABEL[stage]}
          </button>
        );
      })}
    </div>
  );
};

export default IPDetailStageTabs;
```

- [ ] **Step 4: Run test**

```bash
pnpm --filter @variscout/ui test -- IPDetailStageTabs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/IPDetail/IPDetailStageTabs.tsx packages/ui/src/components/IPDetail/__tests__/IPDetailStageTabs.test.tsx
git commit -m "feat(ui): add IPDetailStageTabs with state-aware locking"
```

### Task PR-PT-2.4: IPDetailModeToggle component (Overview/Sections segmented control)

**Files:**

- Create: `packages/ui/src/components/IPDetail/IPDetailModeToggle.tsx`
- Test: `packages/ui/src/components/IPDetail/__tests__/IPDetailModeToggle.test.tsx`

- [ ] **Step 1: Write the failing test:**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import IPDetailModeToggle from '../IPDetailModeToggle';

describe('IPDetailModeToggle', () => {
  it('marks the active mode visually', () => {
    render(<IPDetailModeToggle mode="overview" onModeChange={() => {}} />);
    expect(screen.getByTestId('mode-overview')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('mode-sections')).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onModeChange when toggle clicked', () => {
    const onChange = vi.fn();
    render(<IPDetailModeToggle mode="overview" onModeChange={onChange} />);
    fireEvent.click(screen.getByTestId('mode-sections'));
    expect(onChange).toHaveBeenCalledWith('sections');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test -- IPDetailModeToggle
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create the component:**

```typescript
import React from 'react';

export type IPDetailMode = 'overview' | 'sections';

interface IPDetailModeToggleProps {
  mode: IPDetailMode;
  onModeChange: (mode: IPDetailMode) => void;
}

const IPDetailModeToggle: React.FC<IPDetailModeToggleProps> = ({ mode, onModeChange }) => {
  return (
    <div className="inline-flex gap-0.5 rounded-lg bg-slate-100 p-0.5" role="group">
      <button
        type="button"
        data-testid="mode-overview"
        aria-pressed={mode === 'overview'}
        onClick={() => onModeChange('overview')}
        className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
          mode === 'overview'
            ? 'bg-white text-content shadow-sm'
            : 'text-content-secondary hover:text-content'
        }`}
      >
        Overview
      </button>
      <button
        type="button"
        data-testid="mode-sections"
        aria-pressed={mode === 'sections'}
        onClick={() => onModeChange('sections')}
        className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
          mode === 'sections'
            ? 'bg-white text-content shadow-sm'
            : 'text-content-secondary hover:text-content'
        }`}
      >
        Sections
      </button>
    </div>
  );
};

export default IPDetailModeToggle;
```

- [ ] **Step 4: Run test**

```bash
pnpm --filter @variscout/ui test -- IPDetailModeToggle
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/IPDetail/IPDetailModeToggle.tsx packages/ui/src/components/IPDetail/__tests__/IPDetailModeToggle.test.tsx
git commit -m "feat(ui): add IPDetailModeToggle Overview/Sections segmented control"
```

### Task PR-PT-2.5: IPDetailTeamRail skeleton (V1 placeholder)

**Files:**

- Create: `packages/ui/src/components/IPDetail/IPDetailTeamRail.tsx`

- [ ] **Step 1: Create the skeleton.** Full V1 implementation lives in Plan 3 (Team workspace rail); this PR adds only the column container + heading placeholders so the layout grid works:

```typescript
import React from 'react';
import type { ImprovementProject } from '@variscout/core/improvementProject';

interface IPDetailTeamRailProps {
  ip: ImprovementProject;
}

const IPDetailTeamRail: React.FC<IPDetailTeamRailProps> = ({ ip }) => {
  const teamCount = (ip.metadata.team ?? []).length;
  return (
    <aside
      className="hidden w-[280px] flex-shrink-0 border-l border-edge bg-slate-50 p-4 text-xs lg:block"
      data-testid="ip-detail-team-rail"
      aria-label="Team workspace"
    >
      <div className="uppercase tracking-wide text-content-tertiary">Team · {teamCount}</div>
      <p className="mt-2 text-content-secondary">
        Team roster + activity feed + signoff ship in Plan 3.
      </p>
    </aside>
  );
};

export default IPDetailTeamRail;
```

- [ ] **Step 2: Run package test suite to ensure nothing regressed**

```bash
pnpm --filter @variscout/ui test
```

Expected: green.

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/components/IPDetail/IPDetailTeamRail.tsx
git commit -m "feat(ui): add IPDetailTeamRail skeleton (V1 full impl in Plan 3)"
```

### Task PR-PT-2.6: IPDetailPage top-level composition

**Files:**

- Create: `packages/ui/src/components/IPDetail/IPDetailPage.tsx`
- Create: `packages/ui/src/components/IPDetail/index.ts`
- Test: `packages/ui/src/components/IPDetail/__tests__/IPDetailPage.test.tsx`
- Modify: `packages/ui/src/index.ts` — re-export `IPDetailPage`
- Modify: `packages/ui/package.json` — add `./ipDetail` sub-path export
- Modify: `tsconfig.json` (root) — add corresponding path mapping

- [ ] **Step 1: Write the failing test:**

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import IPDetailPage from '../IPDetailPage';
import type { ImprovementProject } from '@variscout/core/improvementProject';

const ip: ImprovementProject = {
  id: 'ip-1',
  hubId: 'hub-1',
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  status: 'active',
  metadata: { title: 'Heads 5-8 Cpk shortfall' },
  goal: { outcomeGoal: { outcomeSpecId: 'o-1', baseline: 0.61, target: 1.33 } },
  sections: { background: {}, investigationLineage: {}, approach: {}, outcomeReference: {} },
};

describe('IPDetailPage', () => {
  it('renders header + stage tabs + mode toggle + team rail', () => {
    render(<IPDetailPage ip={ip} onBackToList={() => {}} />);
    expect(screen.getByTestId('ip-detail-title')).toHaveTextContent('Heads 5-8 Cpk shortfall');
    expect(screen.getByTestId('stage-tab-charter')).toBeInTheDocument();
    expect(screen.getByTestId('mode-overview')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('ip-detail-team-rail')).toBeInTheDocument();
  });

  it('defaults to the current stage when one is set', () => {
    render(<IPDetailPage ip={ip} onBackToList={() => {}} />);
    expect(screen.getByTestId('stage-tab-approach')).toHaveAttribute('aria-selected', 'true');
  });

  it('renders stage placeholder body until Plan 1 PRs 3-5 fill in content', () => {
    render(<IPDetailPage ip={ip} onBackToList={() => {}} />);
    expect(screen.getByTestId('stage-body-approach')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test -- IPDetailPage
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `IPDetailPage.tsx`:**

```typescript
import React, { useMemo, useState } from 'react';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import IPDetailHeader from './IPDetailHeader';
import IPDetailStageTabs, { type StageName } from './IPDetailStageTabs';
import IPDetailModeToggle, { type IPDetailMode } from './IPDetailModeToggle';
import IPDetailTeamRail from './IPDetailTeamRail';
import { deriveStageState, type StageStateInputs } from './stageState';

export interface IPDetailPageProps {
  ip: ImprovementProject;
  onBackToList: () => void;
  /** Optional stage-state inputs (derived from linked SustainmentRecord + ControlHandoff at the caller). */
  stageStateInputs?: StageStateInputs;
  /** Optional invite handler (Plan 3 wires this). */
  onInviteClick?: () => void;
  /** Optional day counter passed to header. */
  dayCounter?: number;
}

function defaultActiveStage(stages: ReturnType<typeof deriveStageState>): StageName {
  if (stages.handoff === 'current') return 'handoff';
  if (stages.sustainment === 'current') return 'sustainment';
  if (stages.approach === 'current') return 'approach';
  return 'charter';
}

const IPDetailPage: React.FC<IPDetailPageProps> = ({
  ip,
  onBackToList,
  stageStateInputs,
  onInviteClick,
  dayCounter,
}) => {
  const stages = useMemo(() => deriveStageState(ip, stageStateInputs), [ip, stageStateInputs]);
  const [activeStage, setActiveStage] = useState<StageName>(() => defaultActiveStage(stages));
  const [mode, setMode] = useState<IPDetailMode>('overview');

  return (
    <div className="flex h-full min-h-0 flex-col">
      <IPDetailHeader
        ip={ip}
        onBackToList={onBackToList}
        onInviteClick={onInviteClick}
        dayCounter={dayCounter}
      />

      <div className="flex items-center justify-between border-b border-edge bg-surface px-6 py-2">
        <IPDetailStageTabs
          stages={stages}
          active={activeStage}
          onStageChange={setActiveStage}
        />
        <IPDetailModeToggle mode={mode} onModeChange={setMode} />
      </div>

      <div className="flex flex-1 min-h-0 overflow-auto">
        <main className="flex-1 p-6" data-testid={`stage-body-${activeStage}`}>
          <p className="text-sm text-content-secondary">
            {mode === 'overview' ? 'Overview' : 'Sections'} content for the{' '}
            <strong>{activeStage}</strong> stage ships in PR-PT-
            {activeStage === 'charter' ? '3' : activeStage === 'approach' ? '4' : '5'}.
          </p>
        </main>
        <IPDetailTeamRail ip={ip} />
      </div>
    </div>
  );
};

export default IPDetailPage;
```

- [ ] **Step 4: Create the barrel** `packages/ui/src/components/IPDetail/index.ts`:

```typescript
export { default as IPDetailPage } from './IPDetailPage';
export type { IPDetailPageProps } from './IPDetailPage';
export type { StageName } from './IPDetailStageTabs';
export type { IPDetailMode } from './IPDetailModeToggle';
export type { StageState, StageStateMap, StageStateInputs } from './stageState';
export { deriveStageState } from './stageState';
```

- [ ] **Step 5: Wire the barrel into the package public API.**

In `packages/ui/src/index.ts`, add:

```typescript
export * from './components/IPDetail';
```

In `packages/ui/package.json`, add to the `"exports"` map:

```json
"./ipDetail": {
  "types": "./dist/components/IPDetail/index.d.ts",
  "default": "./dist/components/IPDetail/index.js"
},
```

In the root `tsconfig.json`, mirror the path under `compilerOptions.paths`:

```json
"@variscout/ui/ipDetail": ["packages/ui/src/components/IPDetail/index.ts"],
```

(Per CLAUDE.md invariant: sub-path exports need BOTH `package.json#exports` AND `tsconfig.json#paths` updated together.)

- [ ] **Step 6: Run test**

```bash
pnpm --filter @variscout/ui test -- IPDetailPage
```

Expected: PASS.

- [ ] **Step 7: Build the ui package to confirm sub-path export resolves**

```bash
pnpm --filter @variscout/ui build
```

Expected: green; `dist/components/IPDetail/index.d.ts` present.

- [ ] **Step 8: Commit**

```bash
git add packages/ui/src/components/IPDetail/ packages/ui/src/index.ts packages/ui/package.json tsconfig.json
git commit -m "feat(ui): add IPDetailPage composition with stage tabs + mode toggle + team rail skeleton"
```

### Task PR-PT-2.7: Wire IPDetailPage into PWA + Azure ProjectsTabView, ship PR-PT-2

**Files:**

- Modify: `apps/pwa/src/components/ProjectsTabView.tsx`
- Modify: `apps/azure/src/components/ProjectsTabView.tsx`

- [ ] **Step 1: Update PWA `ProjectsTabView.tsx`** to render the IPDetailPage when a project is selected. Replace the `selectedProjectId` placeholder branch (added in PR-PT-1.4) with:

```typescript
import { IPDetailPage } from '@variscout/ui/ipDetail';
import type { ImprovementProject } from '@variscout/core/improvementProject';
```

Replace:

```typescript
  if (selectedProjectId) {
    return (
      <div data-testid="ip-detail-placeholder" className="p-4">
        <p className="text-content-secondary">IP detail page for {selectedProjectId} (wired in PR-PT-2)</p>
      </div>
    );
  }
```

With:

```typescript
  if (selectedProjectId) {
    const selected: ImprovementProject | undefined = projects.find(p => p.id === selectedProjectId);
    if (!selected) {
      return (
        <div className="p-4 text-sm text-content-secondary" role="alert">
          Improvement Project {selectedProjectId} not found on this hub.
        </div>
      );
    }
    const dayCounter = Math.floor((Date.now() - selected.createdAt) / (24 * 60 * 60 * 1000));
    return (
      <IPDetailPage
        ip={selected}
        onBackToList={() => onSelectProject('')}
        dayCounter={dayCounter}
      />
    );
  }
```

Update the `onSelectProject` prop signature in the interface to accept the empty string (sentinel for "deselect"):

```typescript
  onSelectProject: (projectId: string) => void; // pass '' to deselect
```

In `apps/pwa/src/App.tsx`, the `panels.showProjects` callback signature already takes an optional `projectId?: string` — change the wiring to:

```typescript
                onSelectProject={id => panels.showProjects(id === '' ? undefined : id)}
```

- [ ] **Step 2: Mirror the same change in `apps/azure/src/components/ProjectsTabView.tsx`.** Same imports, same code.

- [ ] **Step 3: Verify in browser**

```bash
pnpm --filter @variscout/pwa dev
```

`claude --chrome` walk:

1. Click Projects tab on a hub with at least one IP.
2. Confirm list renders with IP cards.
3. Click an IP card → confirm IPDetailPage renders with header + stage tabs + Overview toggle + team rail skeleton.
4. Click "← All Improvement Projects" → confirm return to list.

- [ ] **Step 4: Run pr-ready-check**

```bash
bash scripts/pr-ready-check.sh
```

Expected: green.

- [ ] **Step 5: Push + open PR**

```bash
git add apps/pwa/src/components/ProjectsTabView.tsx apps/azure/src/components/ProjectsTabView.tsx apps/pwa/src/App.tsx
git commit -m "feat(apps): wire IPDetailPage into ProjectsTabView (PWA + Azure)"
git push
gh pr create --title "feat(projects): PR-PT-2 IP detail page anatomy" --body "Header / stage tabs / Overview-Sections toggle / 280px team rail skeleton + stage-state derivation. Stage bodies render placeholders until PR-PT-3/4/5."
```

- [ ] **Step 6: Dispatch final code-review subagent per `feedback_code_review_subagent_must_checkout_pr_branch`.**

---

## PR-PT-3: Charter stage Overview + Sections

**Goal:** Fill in the Charter stage body — Overview shows the checklist-shape KPI strip (Issue / Goal / Investigation) + jump-outs to scoped Investigation + Analyze; Sections renders the existing `ImprovementProjectForm` with sections 1-4 expanded by default.

**Files:**

- Create: `packages/ui/src/components/IPDetail/stages/CharterOverview.tsx`
- Create: `packages/ui/src/components/IPDetail/stages/CharterSections.tsx`
- Create: `packages/ui/src/components/IPDetail/stages/__tests__/CharterOverview.test.tsx`
- Modify: `packages/ui/src/components/IPDetail/IPDetailPage.tsx` — render `CharterOverview` / `CharterSections` when `activeStage === 'charter'`
- Modify: `packages/ui/src/components/IPDetail/index.ts` — export Charter stage components if needed externally

### Task PR-PT-3.1: CharterOverview KPI strip

**Files:**

- Create: `packages/ui/src/components/IPDetail/stages/CharterOverview.tsx`
- Test: `__tests__/CharterOverview.test.tsx`

- [ ] **Step 1: Write the failing test:**

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CharterOverview from '../CharterOverview';
import type { ImprovementProject } from '@variscout/core/improvementProject';

const baseIP: ImprovementProject = {
  id: 'ip-1', hubId: 'hub-1', createdAt: 0, updatedAt: 0, deletedAt: null,
  status: 'draft',
  metadata: { title: 'X' },
  goal: { outcomeGoal: { outcomeSpecId: 'o-1', target: 1.33 } },
  sections: { background: {}, investigationLineage: {}, approach: {}, outcomeReference: {} },
};

describe('CharterOverview', () => {
  it('shows Goal status as set when outcomeGoal has a target', () => {
    render(<CharterOverview ip={baseIP} onOpenInvestigation={() => {}} onOpenAnalyze={() => {}} />);
    expect(screen.getByTestId('kpi-goal')).toHaveTextContent(/1\.33/);
  });

  it('shows Goal as pending when freeText is empty and no Y target', () => {
    const ip: ImprovementProject = { ...baseIP, goal: { outcomeGoal: { outcomeSpecId: '', target: 0 } } };
    render(<CharterOverview ip={ip} onOpenInvestigation={() => {}} onOpenAnalyze={() => {}} />);
    expect(screen.getByTestId('kpi-goal')).toHaveTextContent(/not yet set/i);
  });

  it('counts hypotheses + findings linked', () => {
    const ip: ImprovementProject = {
      ...baseIP,
      sections: {
        ...baseIP.sections,
        investigationLineage: { hypothesisIds: ['h1', 'h2'], findingIds: ['f1', 'f2', 'f3'] },
      },
    };
    render(<CharterOverview ip={ip} onOpenInvestigation={() => {}} onOpenAnalyze={() => {}} />);
    expect(screen.getByTestId('kpi-investigation')).toHaveTextContent(/2 hypotheses · 3 findings/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test -- CharterOverview
```

Expected: FAIL.

- [ ] **Step 3: Create `CharterOverview.tsx`:**

```typescript
import React from 'react';
import type { ImprovementProject } from '@variscout/core/improvementProject';

interface CharterOverviewProps {
  ip: ImprovementProject;
  onOpenInvestigation: () => void;
  onOpenAnalyze: () => void;
  /** Optional Survey hint to display in stage-current banner (Plan 4 wires this from real survey). */
  surveyHint?: string;
  onSetGoal?: () => void;
}

function isGoalSet(ip: ImprovementProject): boolean {
  return ip.goal.outcomeGoal.target > 0 && ip.goal.outcomeGoal.outcomeSpecId !== '';
}

const CharterOverview: React.FC<CharterOverviewProps> = ({
  ip,
  onOpenInvestigation,
  onOpenAnalyze,
  surveyHint,
  onSetGoal,
}) => {
  const issueSnapshot = ip.sections.background.snapshotText ?? '—';
  const goalSet = isGoalSet(ip);
  const hypoCount = ip.sections.investigationLineage.hypothesisIds?.length ?? 0;
  const findingCount = ip.sections.investigationLineage.findingIds?.length ?? 0;

  return (
    <div className="space-y-5">
      <div className="rounded-r-md border-l-4 border-indigo-500 bg-slate-50 px-4 py-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
          Framing in progress
        </div>
        <div className="mt-1 text-sm text-content">
          {surveyHint ?? 'Capture the Issue, set the Goal, link the lead Hypothesis before moving to Approach.'}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-md border border-edge p-3" data-testid="kpi-issue">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-content-tertiary">
            Issue
          </div>
          <div className="mt-1 text-xs text-content">{issueSnapshot}</div>
        </div>

        <div
          className={`rounded-md border p-3 ${goalSet ? 'border-edge' : 'border-amber-300 bg-amber-50'}`}
          data-testid="kpi-goal"
        >
          <div className="text-[10px] font-semibold uppercase tracking-wide text-content-tertiary">
            Goal
          </div>
          {goalSet ? (
            <div className="mt-1 font-mono text-sm text-content">
              Target {ip.goal.outcomeGoal.target}
            </div>
          ) : (
            <>
              <div className="mt-1 text-xs text-amber-800">⏳ Not yet set</div>
              <button
                type="button"
                onClick={onSetGoal}
                className="mt-2 rounded-md bg-amber-400 px-2 py-1 text-[10px] font-medium text-white hover:bg-amber-500"
                data-testid="kpi-goal-set-cta"
              >
                Set goal →
              </button>
            </>
          )}
        </div>

        <div className="rounded-md border border-edge p-3" data-testid="kpi-investigation">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-content-tertiary">
            Investigation
          </div>
          <div className="mt-1 text-xs text-content">
            {hypoCount} hypotheses · {findingCount} findings
          </div>
        </div>
      </div>

      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-content-tertiary">
          Continue in
        </div>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={onOpenInvestigation}
            className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-100"
            data-testid="charter-continue-investigation"
          >
            Investigation · {hypoCount} hypotheses
          </button>
          <button
            type="button"
            onClick={onOpenAnalyze}
            className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-100"
            data-testid="charter-continue-analyze"
          >
            Analyze · capability check
          </button>
        </div>
      </div>
    </div>
  );
};

export default CharterOverview;
```

- [ ] **Step 4: Run test**

```bash
pnpm --filter @variscout/ui test -- CharterOverview
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/IPDetail/stages/CharterOverview.tsx packages/ui/src/components/IPDetail/stages/__tests__/CharterOverview.test.tsx
git commit -m "feat(ui): add Charter Overview KPI strip + jump-outs"
```

### Task PR-PT-3.2: CharterSections wraps existing ImprovementProjectForm

**Files:**

- Create: `packages/ui/src/components/IPDetail/stages/CharterSections.tsx`

- [ ] **Step 1: Create `CharterSections.tsx`** — for V1, this is a thin wrapper that mounts the existing `ImprovementProjectForm` and lets the caller pass through props:

```typescript
import React from 'react';
import { ImprovementProjectForm, type ImprovementProjectFormProps } from '../../ImprovementProject/ImprovementProjectForm';

/**
 * Charter stage Sections renders the existing 6-section form with sections 1-4
 * (metadata + background + goal + lineage) expanded by default.
 *
 * V1 reuses ImprovementProjectForm verbatim. PR-PT-4 will add stage-aware
 * expansion defaults; for V1 this is sufficient because the caller controls
 * which props are passed in.
 */
const CharterSections: React.FC<ImprovementProjectFormProps> = props => (
  <ImprovementProjectForm {...props} />
);

export default CharterSections;
```

- [ ] **Step 2: Wire `CharterOverview` + `CharterSections` into `IPDetailPage.tsx`** — replace the placeholder body for the `charter` stage:

In `IPDetailPage.tsx`, replace the `<main>` body with:

```typescript
        <main className="flex-1 p-6" data-testid={`stage-body-${activeStage}`}>
          {activeStage === 'charter' && mode === 'overview' && (
            <CharterOverview
              ip={ip}
              onOpenInvestigation={() => onJumpOut?.('investigation')}
              onOpenAnalyze={() => onJumpOut?.('analyze')}
            />
          )}
          {activeStage === 'charter' && mode === 'sections' && (
            <CharterSections {...(charterFormProps ?? {})} />
          )}
          {activeStage !== 'charter' && (
            <p className="text-sm text-content-secondary">
              {mode === 'overview' ? 'Overview' : 'Sections'} content for{' '}
              <strong>{activeStage}</strong> ships in PR-PT-
              {activeStage === 'approach' ? '4' : '5'}.
            </p>
          )}
        </main>
```

Add the new props to the interface:

```typescript
export interface IPDetailPageProps {
  ip: ImprovementProject;
  onBackToList: () => void;
  stageStateInputs?: StageStateInputs;
  onInviteClick?: () => void;
  dayCounter?: number;
  /** Jump-out handler — called from per-stage "Continue in" buttons. */
  onJumpOut?: (
    target: 'investigation' | 'analyze' | 'process' | 'improve-workbench' | 'report'
  ) => void;
  /** Props for Charter Sections (Sections-mode form). */
  charterFormProps?: import('../ImprovementProject/ImprovementProjectForm').ImprovementProjectFormProps;
}
```

Add the imports at the top:

```typescript
import CharterOverview from './stages/CharterOverview';
import CharterSections from './stages/CharterSections';
```

- [ ] **Step 3: Update IPDetailPage tests** — extend `IPDetailPage.test.tsx`:

```typescript
  it('renders CharterOverview when activeStage = charter and mode = overview', () => {
    const charterIP: ImprovementProject = { ...ip, status: 'draft' };
    render(<IPDetailPage ip={charterIP} onBackToList={() => {}} />);
    expect(screen.getByTestId('kpi-issue')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-goal')).toBeInTheDocument();
  });
```

- [ ] **Step 4: Run all IP detail tests**

```bash
pnpm --filter @variscout/ui test -- IPDetail
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/IPDetail/stages/CharterSections.tsx packages/ui/src/components/IPDetail/IPDetailPage.tsx packages/ui/src/components/IPDetail/__tests__/IPDetailPage.test.tsx
git commit -m "feat(ui): wire Charter Overview/Sections into IPDetailPage"
```

### Task PR-PT-3.3: Wire jump-outs in PWA + Azure ProjectsTabView

**Files:**

- Modify: `apps/pwa/src/components/ProjectsTabView.tsx`
- Modify: `apps/azure/src/components/ProjectsTabView.tsx`

- [ ] **Step 1: Pass `onJumpOut` to IPDetailPage** in `apps/pwa/src/components/ProjectsTabView.tsx`. Add a prop `onJumpOut?: (target: ...) => void` to `ProjectsTabViewProps` and forward it:

```typescript
interface ProjectsTabViewProps {
  activeHub?: ProcessHub;
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onJumpOut?: (
    target: 'investigation' | 'analyze' | 'process' | 'improve-workbench' | 'report'
  ) => void;
  charterFormProps?: import('@variscout/ui').ImprovementProjectFormProps;
}
```

Pass it through to the `IPDetailPage`:

```typescript
      <IPDetailPage
        ip={selected}
        onBackToList={() => onSelectProject('')}
        dayCounter={dayCounter}
        onJumpOut={onJumpOut}
        charterFormProps={charterFormProps}
      />
```

- [ ] **Step 2: Wire jump-outs in PWA `App.tsx`** where `ProjectsTabView` is rendered:

```typescript
              <ProjectsTabView
                activeHub={activeHub}
                selectedProjectId={panels.selectedProjectId}
                onSelectProject={id => panels.showProjects(id === '' ? undefined : id)}
                onJumpOut={target => {
                  if (target === 'investigation') panels.showInvestigation();
                  else if (target === 'analyze') panels.showAnalysis();
                  else if (target === 'process') panels.showFrame();
                  else if (target === 'improve-workbench') panels.showImprovement();
                  else if (target === 'report') panels.showReport();
                }}
              />
```

- [ ] **Step 3: Mirror in Azure.** Same change in `apps/azure/src/components/ProjectsTabView.tsx` + the corresponding wiring in the Azure route file.

- [ ] **Step 4: Verify in browser**

`claude --chrome` walk:

1. Open a draft IP on the Projects tab.
2. Confirm Charter Overview renders with KPI strip.
3. Click "Investigation · N hypotheses" jump-out → switches to Investigation tab.
4. Click back to Projects → IP detail still on Charter stage.

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/components/ProjectsTabView.tsx apps/pwa/src/App.tsx apps/azure/src/components/ProjectsTabView.tsx
git commit -m "feat(apps): wire IP-detail jump-outs to existing tab routers"
```

### Task PR-PT-3.4: PR-PT-3 review + push

- [ ] **Step 1: Run pr-ready-check**

```bash
bash scripts/pr-ready-check.sh
```

Expected: green.

- [ ] **Step 2: Push + PR**

```bash
git push
gh pr create --title "feat(projects): PR-PT-3 Charter stage Overview + Sections" --body "Charter Overview (KPI strip + stage-current banner + jump-outs) + Charter Sections (wraps existing ImprovementProjectForm). PWA + Azure jump-out wiring to Investigation/Analyze/Process/Improve/Report tabs."
```

- [ ] **Step 3: Final code-review subagent.**

---

## PR-PT-4: Approach stage SuspectedCause-anchored Overview + Sections

**Goal:** Build the per-SuspectedCause hierarchy as the visual unit of the Approach stage. Overview renders per-cause cards (selected idea + action progress + projected impact). Sections renders per-cause read-mode workbench with "Open in Improve workbench" jump-out per cause.

**Files:**

- Create: `packages/ui/src/components/IPDetail/stages/ApproachCauseCard.tsx`
- Create: `packages/ui/src/components/IPDetail/stages/ApproachOverview.tsx`
- Create: `packages/ui/src/components/IPDetail/stages/ApproachSections.tsx`
- Create: `packages/ui/src/components/IPDetail/stages/causeProjection.ts` — pure function projecting `factorControls[]` + `improvementIdeaIds[]` + `actionItemIds[]` into the per-cause view model
- Create tests: `__tests__/causeProjection.test.ts`, `__tests__/ApproachCauseCard.test.tsx`, `__tests__/ApproachOverview.test.tsx`
- Modify: `IPDetailPage.tsx` — render Approach stage components

### Task PR-PT-4.1: Per-cause projection (pure function)

**Files:**

- Create: `packages/ui/src/components/IPDetail/stages/causeProjection.ts`
- Test: `__tests__/causeProjection.test.ts`

- [ ] **Step 1: Write the failing test:**

```typescript
import { describe, it, expect } from 'vitest';
import { projectCauses, type CauseRow } from '../causeProjection';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import type { Hypothesis, ImprovementIdea, ActionItem } from '@variscout/core/findings/types';

const ip: ImprovementProject = {
  id: 'ip-1',
  hubId: 'hub-1',
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  status: 'active',
  metadata: { title: 'X' },
  goal: {
    outcomeGoal: { outcomeSpecId: 'o-1', target: 1.33 },
    factorControls: [
      { factor: 'NOZZLE.TEMP', targetCondition: 'in control 95±2°C', linkedHypothesisId: 'h-1' },
      { factor: 'VISCOSITY', targetCondition: 'in spec all lots', linkedHypothesisId: 'h-2' },
    ],
  },
  sections: {
    background: {},
    investigationLineage: { hypothesisIds: ['h-1', 'h-2'] },
    approach: { improvementIdeaIds: ['idea-1', 'idea-2'], actionItemIds: ['a-1', 'a-2'] },
    outcomeReference: {},
  },
};

const hypotheses: Hypothesis[] = [
  {
    id: 'h-1',
    name: 'Nozzle temp drift',
    status: 'confirmed',
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
  } as Hypothesis,
  {
    id: 'h-2',
    name: 'Material viscosity',
    status: 'confirmed',
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
  } as Hypothesis,
];

const ideas: ImprovementIdea[] = [
  {
    id: 'idea-1',
    name: 'PID retune',
    selected: true,
    linkedHypothesisId: 'h-1',
  } as ImprovementIdea,
  {
    id: 'idea-2',
    name: 'Switch supplier',
    selected: false,
    linkedHypothesisId: 'h-2',
  } as ImprovementIdea,
];

const actions: ActionItem[] = [
  { id: 'a-1', name: 'Retune Heads 5-8', status: 'done', linkedIdeaId: 'idea-1' } as ActionItem,
  {
    id: 'a-2',
    name: 'Operator training',
    status: 'in-progress',
    linkedIdeaId: 'idea-1',
  } as ActionItem,
];

describe('projectCauses', () => {
  it('produces one row per factorControl', () => {
    const rows: CauseRow[] = projectCauses(ip, { hypotheses, ideas, actions });
    expect(rows).toHaveLength(2);
    expect(rows[0]!.factor).toBe('NOZZLE.TEMP');
  });

  it('matches selected idea via linkedHypothesisId', () => {
    const rows = projectCauses(ip, { hypotheses, ideas, actions });
    expect(rows[0]!.selectedIdea?.id).toBe('idea-1');
  });

  it('matches actions to selected idea via linkedIdeaId', () => {
    const rows = projectCauses(ip, { hypotheses, ideas, actions });
    expect(rows[0]!.actions).toHaveLength(2);
    expect(rows[0]!.actions[0]!.status).toBe('done');
  });

  it('classifies cause status as resolved when all actions done', () => {
    const allDoneActions: ActionItem[] = actions.map(a => ({ ...a, status: 'done' as const }));
    const rows = projectCauses(ip, { hypotheses, ideas, actions: allDoneActions });
    expect(rows[0]!.causeStatus).toBe('resolved');
  });

  it('classifies cause status as pending when no idea selected', () => {
    const rows = projectCauses(ip, { hypotheses, ideas, actions });
    expect(rows[1]!.causeStatus).toBe('pending-idea');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test -- causeProjection
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `causeProjection.ts`:**

```typescript
import type {
  ImprovementProject,
  ImprovementProjectFactorControl,
} from '@variscout/core/improvementProject';
import type { Hypothesis, ImprovementIdea, ActionItem } from '@variscout/core/findings/types';

export type CauseStatus = 'pending-idea' | 'in-progress' | 'resolved' | 'ruled-out';

export interface CauseRow {
  factor: string;
  targetCondition: string;
  hypothesis?: Hypothesis;
  /** All ideas linked to this cause's hypothesis. */
  ideas: ImprovementIdea[];
  /** The selected idea (max 1 per RPS V1 D9). */
  selectedIdea?: ImprovementIdea;
  /** Actions linked to the selected idea. */
  actions: ActionItem[];
  /** Derived status pill state. */
  causeStatus: CauseStatus;
}

export interface CauseProjectionInputs {
  hypotheses: readonly Hypothesis[];
  ideas: readonly ImprovementIdea[];
  actions: readonly ActionItem[];
}

function classify(selectedIdea: ImprovementIdea | undefined, actions: ActionItem[]): CauseStatus {
  if (!selectedIdea) return 'pending-idea';
  if (actions.length === 0) return 'in-progress';
  const allDone = actions.every(a => a.status === 'done');
  if (allDone) return 'resolved';
  return 'in-progress';
}

export function projectCauses(ip: ImprovementProject, inputs: CauseProjectionInputs): CauseRow[] {
  const factorControls: ImprovementProjectFactorControl[] = ip.goal.factorControls ?? [];

  return factorControls.map(fc => {
    const hypothesis = inputs.hypotheses.find(h => h.id === fc.linkedHypothesisId);
    const allIdeas = inputs.ideas.filter(
      i =>
        'linkedHypothesisId' in i &&
        (i as { linkedHypothesisId?: string }).linkedHypothesisId === fc.linkedHypothesisId
    );
    const selectedIdea = allIdeas.find(i => (i as { selected?: boolean }).selected === true);
    const actions = selectedIdea
      ? inputs.actions.filter(
          a =>
            'linkedIdeaId' in a && (a as { linkedIdeaId?: string }).linkedIdeaId === selectedIdea.id
        )
      : [];

    return {
      factor: fc.factor,
      targetCondition: fc.targetCondition,
      hypothesis,
      ideas: allIdeas,
      selectedIdea,
      actions,
      causeStatus: classify(selectedIdea, actions),
    };
  });
}
```

- [ ] **Step 4: Run test**

```bash
pnpm --filter @variscout/ui test -- causeProjection
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/IPDetail/stages/causeProjection.ts packages/ui/src/components/IPDetail/stages/__tests__/causeProjection.test.ts
git commit -m "feat(ui): add per-SuspectedCause projection for IP Approach stage"
```

### Task PR-PT-4.2: ApproachCauseCard component (per-cause unit)

**Files:**

- Create: `packages/ui/src/components/IPDetail/stages/ApproachCauseCard.tsx`
- Test: `__tests__/ApproachCauseCard.test.tsx`

- [ ] **Step 1: Write the failing test:**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ApproachCauseCard from '../ApproachCauseCard';
import type { CauseRow } from '../causeProjection';

const causeResolved: CauseRow = {
  factor: 'NOZZLE.TEMP',
  targetCondition: 'in control 95±2°C',
  hypothesis: { id: 'h-1', name: 'Nozzle temp drift' } as any,
  ideas: [],
  selectedIdea: { id: 'idea-1', name: 'PID retune' } as any,
  actions: [{ id: 'a-1', status: 'done' } as any],
  causeStatus: 'resolved',
};

describe('ApproachCauseCard', () => {
  it('shows the selected idea name + action progress', () => {
    render(<ApproachCauseCard cause={causeResolved} onOpenWorkbench={() => {}} />);
    expect(screen.getByText('NOZZLE.TEMP')).toBeInTheDocument();
    expect(screen.getByText('PID retune')).toBeInTheDocument();
    expect(screen.getByText(/RESOLVED/i)).toBeInTheDocument();
  });

  it('shows "Pending idea" + Open workbench CTA when status = pending-idea', () => {
    const pending: CauseRow = { ...causeResolved, selectedIdea: undefined, actions: [], causeStatus: 'pending-idea' };
    render(<ApproachCauseCard cause={pending} onOpenWorkbench={() => {}} />);
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });

  it('calls onOpenWorkbench with the cause when CTA clicked', () => {
    const onOpen = vi.fn();
    const pending: CauseRow = { ...causeResolved, selectedIdea: undefined, actions: [], causeStatus: 'pending-idea' };
    render(<ApproachCauseCard cause={pending} onOpenWorkbench={onOpen} />);
    fireEvent.click(screen.getByTestId('cause-open-workbench'));
    expect(onOpen).toHaveBeenCalledWith(pending);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test -- ApproachCauseCard
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `ApproachCauseCard.tsx`:**

```typescript
import React from 'react';
import type { CauseRow, CauseStatus } from './causeProjection';

interface ApproachCauseCardProps {
  cause: CauseRow;
  onOpenWorkbench: (cause: CauseRow) => void;
}

const STATUS_LABEL: Record<CauseStatus, string> = {
  'pending-idea': 'PENDING',
  'in-progress': 'IN PROGRESS',
  'resolved': 'RESOLVED',
  'ruled-out': 'RULED OUT',
};

const STATUS_PILL: Record<CauseStatus, string> = {
  'pending-idea': 'bg-amber-100 text-amber-800',
  'in-progress': 'bg-amber-100 text-amber-800',
  'resolved': 'bg-green-100 text-green-800',
  'ruled-out': 'bg-slate-100 text-slate-600',
};

function actionSummary(actions: CauseRow['actions']): string {
  if (actions.length === 0) return 'No actions yet';
  const done = actions.filter(a => a.status === 'done').length;
  const inProgress = actions.filter(a => a.status === 'in-progress').length;
  return `${done} done · ${inProgress} in progress · ${actions.length - done - inProgress} pending`;
}

const ApproachCauseCard: React.FC<ApproachCauseCardProps> = ({ cause, onOpenWorkbench }) => {
  return (
    <div
      className={`rounded-md border p-4 ${
        cause.causeStatus === 'pending-idea'
          ? 'border-amber-300 bg-amber-50'
          : 'border-edge bg-slate-50'
      }`}
      data-testid={`cause-card-${cause.factor}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="font-medium text-content">{cause.factor}</div>
          <div className="mt-1 text-xs text-content-secondary">
            {cause.hypothesis?.name ?? '—'} · target: {cause.targetCondition}
          </div>
        </div>
        <span
          className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${STATUS_PILL[cause.causeStatus]}`}
        >
          {STATUS_LABEL[cause.causeStatus]}
        </span>
      </div>

      {cause.selectedIdea ? (
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-content-tertiary">Selected idea</div>
            <div className="mt-0.5 text-content">{cause.selectedIdea.name}</div>
          </div>
          <div className="text-right">
            <div className="text-content-tertiary">Actions</div>
            <div className="mt-0.5 font-mono text-content">{actionSummary(cause.actions)}</div>
          </div>
        </div>
      ) : (
        <div className="mt-3 text-xs text-amber-900">
          Pending idea — brainstorm in the Improve workbench.
        </div>
      )}

      <button
        type="button"
        onClick={() => onOpenWorkbench(cause)}
        className="mt-3 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs text-indigo-600 hover:bg-indigo-100"
        data-testid="cause-open-workbench"
      >
        Open in Improve workbench →
      </button>
    </div>
  );
};

export default ApproachCauseCard;
```

- [ ] **Step 4: Run test**

```bash
pnpm --filter @variscout/ui test -- ApproachCauseCard
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/IPDetail/stages/ApproachCauseCard.tsx packages/ui/src/components/IPDetail/stages/__tests__/ApproachCauseCard.test.tsx
git commit -m "feat(ui): add ApproachCauseCard per-SuspectedCause card primitive"
```

### Task PR-PT-4.3: ApproachOverview + ApproachSections composition

**Files:**

- Create: `packages/ui/src/components/IPDetail/stages/ApproachOverview.tsx`
- Create: `packages/ui/src/components/IPDetail/stages/ApproachSections.tsx`

- [ ] **Step 1: Create ApproachOverview.tsx:**

```typescript
import React, { useMemo, useState } from 'react';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import { projectCauses, type CauseProjectionInputs, type CauseRow } from './causeProjection';
import ApproachCauseCard from './ApproachCauseCard';

interface ApproachOverviewProps {
  ip: ImprovementProject;
  causeInputs: CauseProjectionInputs;
  onOpenWorkbench: (cause: CauseRow) => void;
  onOpenWall: () => void;
  onOpenAnalyze: () => void;
  onOpenProcess: () => void;
  surveyHint?: string;
}

const ApproachOverview: React.FC<ApproachOverviewProps> = ({
  ip,
  causeInputs,
  onOpenWorkbench,
  onOpenWall,
  onOpenAnalyze,
  onOpenProcess,
  surveyHint,
}) => {
  const allCauses = useMemo(() => projectCauses(ip, causeInputs), [ip, causeInputs]);
  const [showRuledOut, setShowRuledOut] = useState(false);
  const visible = allCauses.filter(c => showRuledOut || c.causeStatus !== 'ruled-out');
  const ruledOutCount = allCauses.length - allCauses.filter(c => c.causeStatus !== 'ruled-out').length;

  const resolvedCount = allCauses.filter(c => c.causeStatus === 'resolved').length;
  const total = allCauses.filter(c => c.causeStatus !== 'ruled-out').length;

  return (
    <div className="space-y-5">
      <div className="rounded-r-md border-l-4 border-indigo-500 bg-slate-50 px-4 py-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
          Approach in progress · {resolvedCount} of {total} causes addressed
        </div>
        {surveyHint ? <div className="mt-1 text-sm text-content">{surveyHint}</div> : null}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-md border border-edge p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-content-tertiary">
            Goal · Y
          </div>
          <div className="mt-1 font-mono text-sm text-content">
            {ip.goal.outcomeGoal.baseline ?? '—'} → {ip.goal.outcomeGoal.target}
          </div>
        </div>
        <div className="rounded-md border border-edge p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-content-tertiary">
            Survey
          </div>
          <div className="mt-1 text-xs text-content">{surveyHint ?? 'No active hints'}</div>
        </div>
        <div className="rounded-md border border-edge p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-content-tertiary">
            Next milestone
          </div>
          <div className="mt-1 text-xs text-content">
            {ip.goal.outcomeGoal.deadline ?? '—'}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {visible.map(cause => (
          <ApproachCauseCard key={cause.factor} cause={cause} onOpenWorkbench={onOpenWorkbench} />
        ))}
        {ruledOutCount > 0 && !showRuledOut && (
          <button
            type="button"
            onClick={() => setShowRuledOut(true)}
            className="w-full rounded-md border border-edge px-3 py-2 text-xs text-content-secondary hover:bg-slate-50"
            data-testid="show-ruled-out"
          >
            Show ruled out · {ruledOutCount}
          </button>
        )}
      </div>

      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-content-tertiary">
          Continue in
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenWall}
            className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-100"
            data-testid="approach-continue-wall"
          >
            Wall · {ip.sections.investigationLineage.hypothesisIds?.length ?? 0} hypotheses
          </button>
          <button
            type="button"
            onClick={onOpenAnalyze}
            className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-100"
            data-testid="approach-continue-analyze"
          >
            Analyze · Flow Focus
          </button>
          <button
            type="button"
            onClick={onOpenProcess}
            className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-100"
            data-testid="approach-continue-process"
          >
            Process · L2 Flow View
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApproachOverview;
```

- [ ] **Step 2: Create ApproachSections.tsx** — V1 is the same read-mode workbench layout (full Sections-mode authoring lives in Plan 1 PR-PT-5 + future plans; V1 ships a read summary with per-cause workbench jump-out):

```typescript
import React, { useMemo } from 'react';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import { projectCauses, type CauseProjectionInputs, type CauseRow } from './causeProjection';
import ApproachCauseCard from './ApproachCauseCard';

interface ApproachSectionsProps {
  ip: ImprovementProject;
  causeInputs: CauseProjectionInputs;
  onOpenWorkbench: (cause: CauseRow) => void;
}

const ApproachSections: React.FC<ApproachSectionsProps> = ({ ip, causeInputs, onOpenWorkbench }) => {
  const causes = useMemo(() => projectCauses(ip, causeInputs), [ip, causeInputs]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
          Approach workbench · {causes.length} suspected {causes.length === 1 ? 'cause' : 'causes'}
        </div>
        <button
          type="button"
          className="rounded-md border border-indigo-200 bg-white px-3 py-1 text-xs text-indigo-600 hover:bg-indigo-50"
          data-testid="approach-add-cause"
        >
          + Add another suspected cause
        </button>
      </div>

      <div className="space-y-3">
        {causes.map(cause => (
          <ApproachCauseCard key={cause.factor} cause={cause} onOpenWorkbench={onOpenWorkbench} />
        ))}
      </div>

      <p className="rounded-md bg-slate-50 p-3 text-xs text-content-secondary">
        Brainstorming, idea selection, and action assignment happen in the Improve workbench.
        Use "Open in Improve workbench" on any cause above. The FK lists update automatically.
      </p>
    </div>
  );
};

export default ApproachSections;
```

- [ ] **Step 3: Wire into `IPDetailPage.tsx`.** Replace the placeholder body for the `approach` stage:

```typescript
import ApproachOverview from './stages/ApproachOverview';
import ApproachSections from './stages/ApproachSections';
import type { CauseProjectionInputs, CauseRow } from './stages/causeProjection';
```

Extend props:

```typescript
  approachInputs?: CauseProjectionInputs;
  onOpenCauseWorkbench?: (cause: CauseRow) => void;
```

Replace the main body's stage switch with:

```typescript
{activeStage === 'approach' && mode === 'overview' && approachInputs && (
  <ApproachOverview
    ip={ip}
    causeInputs={approachInputs}
    onOpenWorkbench={cause => onOpenCauseWorkbench?.(cause)}
    onOpenWall={() => onJumpOut?.('investigation')}
    onOpenAnalyze={() => onJumpOut?.('analyze')}
    onOpenProcess={() => onJumpOut?.('process')}
  />
)}
{activeStage === 'approach' && mode === 'sections' && approachInputs && (
  <ApproachSections
    ip={ip}
    causeInputs={approachInputs}
    onOpenWorkbench={cause => onOpenCauseWorkbench?.(cause)}
  />
)}
```

- [ ] **Step 4: Run all IPDetail tests**

```bash
pnpm --filter @variscout/ui test -- IPDetail
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/IPDetail/stages/ApproachOverview.tsx packages/ui/src/components/IPDetail/stages/ApproachSections.tsx packages/ui/src/components/IPDetail/IPDetailPage.tsx
git commit -m "feat(ui): add Approach Overview + Sections with SuspectedCause hierarchy"
```

### Task PR-PT-4.4: Wire Approach inputs from PWA + Azure

**Files:**

- Modify: `apps/pwa/src/components/ProjectsTabView.tsx`
- Modify: `apps/azure/src/components/ProjectsTabView.tsx`

- [ ] **Step 1: PWA wiring.** In `apps/pwa/src/components/ProjectsTabView.tsx`, accept the cause inputs as props + forward them. Add to interface:

```typescript
  approachInputs?: import('@variscout/ui').CauseProjectionInputs;
  onOpenCauseWorkbench?: (cause: import('@variscout/ui').CauseRow) => void;
```

(If those types don't re-export from `@variscout/ui` yet, add them to `packages/ui/src/components/IPDetail/index.ts` and the package barrel.)

Pass through to `IPDetailPage`:

```typescript
approachInputs = { approachInputs };
onOpenCauseWorkbench = { onOpenCauseWorkbench };
```

In `apps/pwa/src/App.tsx`, where `<ProjectsTabView>` is rendered, source the inputs from the existing investigation + findings stores:

```typescript
              <ProjectsTabView
                activeHub={activeHub}
                selectedProjectId={panels.selectedProjectId}
                onSelectProject={id => panels.showProjects(id === '' ? undefined : id)}
                onJumpOut={target => {
                  if (target === 'investigation') panels.showInvestigation();
                  else if (target === 'analyze') panels.showAnalysis();
                  else if (target === 'process') panels.showFrame();
                  else if (target === 'improve-workbench') panels.showImprovement();
                  else if (target === 'report') panels.showReport();
                }}
                approachInputs={{
                  hypotheses: hypotheses ?? [],
                  ideas: improvementIdeas ?? [],
                  actions: actionItems ?? [],
                }}
                onOpenCauseWorkbench={cause => {
                  // Best-effort: jump to Improve workbench. Plan 2's IP-context cascade
                  // will scope the workbench to the cause's hypothesis automatically.
                  panels.showImprovement();
                  void cause;
                }}
              />
```

Where `hypotheses` / `improvementIdeas` / `actionItems` are sourced from `useInvestigationStore` + `useImprovementProjectStore` (or whatever stores those live in — pull them via the existing selectors used elsewhere in App.tsx).

- [ ] **Step 2: Mirror in Azure** `apps/azure/src/components/ProjectsTabView.tsx`.

- [ ] **Step 3: Verify in browser via `claude --chrome`.**

Confirm Approach Overview renders per-cause cards when an `active` IP with `factorControls[]` and `improvementIdeaIds[]` is open. Click "Open in Improve workbench" → Improve tab opens.

- [ ] **Step 4: Commit**

```bash
git add apps/pwa/src/components/ProjectsTabView.tsx apps/pwa/src/App.tsx apps/azure/src/components/ProjectsTabView.tsx
git commit -m "feat(apps): wire Approach stage cause inputs from investigation+findings stores"
```

### Task PR-PT-4.5: PR-PT-4 review + push

- [ ] **Step 1: Run pr-ready-check**

```bash
bash scripts/pr-ready-check.sh
```

Expected: green.

- [ ] **Step 2: Push + PR**

```bash
git push
gh pr create --title "feat(projects): PR-PT-4 Approach stage SuspectedCause hierarchy" --body "Per-cause projection + ApproachCauseCard primitive + ApproachOverview/Sections compositions. PWA + Azure wired with hypothesis/idea/action inputs from investigation stores. \"Open in Improve workbench\" jump-out per cause."
```

- [ ] **Step 3: Final code-review subagent.**

---

## PR-PT-5: Sustainment + Handoff stages

**Goal:** Fill in the remaining two stages — Sustainment Overview (cadence ticks + Cpk-over-time + per-cause in-control) and Sections (linked SustainmentRecord form); Handoff Overview (operationalization checklist) and Sections (linked ControlHandoff form). Both wired in PWA + Azure.

**Files:**

- Create: `packages/ui/src/components/IPDetail/stages/SustainmentOverview.tsx`
- Create: `packages/ui/src/components/IPDetail/stages/SustainmentSections.tsx`
- Create: `packages/ui/src/components/IPDetail/stages/HandoffOverview.tsx`
- Create: `packages/ui/src/components/IPDetail/stages/HandoffSections.tsx`
- Create tests for each: `__tests__/SustainmentOverview.test.tsx`, `__tests__/HandoffOverview.test.tsx`
- Modify: `IPDetailPage.tsx` — render Sustainment + Handoff bodies
- Modify: `apps/pwa/src/components/ProjectsTabView.tsx` + Azure equivalent — pass linked records through

### Task PR-PT-5.1: SustainmentOverview component

**Files:**

- Create: `packages/ui/src/components/IPDetail/stages/SustainmentOverview.tsx`
- Test: `__tests__/SustainmentOverview.test.tsx`

- [ ] **Step 1: Write the failing test:**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SustainmentOverview from '../SustainmentOverview';
import type { SustainmentRecord } from '@variscout/core/sustainment';

const record: SustainmentRecord = {
  id: 'sr-1',
  hubId: 'hub-1',
  investigationId: 'inv-1',
  improvementProjectId: 'ip-1',
  status: 'pending',
  title: 'Sustain Heads 5-8',
  cadence: 'weekly',
  consecutiveOnTargetTicks: 4,
  hasOverride: false,
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
} as SustainmentRecord;

describe('SustainmentOverview', () => {
  it('renders 4 cadence tick pills matching consecutiveOnTargetTicks', () => {
    render(<SustainmentOverview record={record} onStartHandoff={() => {}} onOpenProcess={() => {}} onOpenAnalyze={() => {}} />);
    expect(screen.getAllByTestId(/^cadence-tick-/)).toHaveLength(4);
  });

  it('enables Start Handoff CTA when consecutiveOnTargetTicks >= 4', () => {
    render(<SustainmentOverview record={record} onStartHandoff={() => {}} onOpenProcess={() => {}} onOpenAnalyze={() => {}} />);
    expect(screen.getByTestId('sustainment-start-handoff')).not.toBeDisabled();
  });

  it('disables Start Handoff CTA when fewer than 4 ticks', () => {
    const r2: SustainmentRecord = { ...record, consecutiveOnTargetTicks: 2 };
    render(<SustainmentOverview record={r2} onStartHandoff={() => {}} onOpenProcess={() => {}} onOpenAnalyze={() => {}} />);
    expect(screen.getByTestId('sustainment-start-handoff')).toBeDisabled();
  });

  it('calls onStartHandoff when CTA clicked', () => {
    const onStart = vi.fn();
    render(<SustainmentOverview record={record} onStartHandoff={onStart} onOpenProcess={() => {}} onOpenAnalyze={() => {}} />);
    fireEvent.click(screen.getByTestId('sustainment-start-handoff'));
    expect(onStart).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test -- SustainmentOverview
```

Expected: FAIL.

- [ ] **Step 3: Create `SustainmentOverview.tsx`:**

```typescript
import React from 'react';
import type { SustainmentRecord } from '@variscout/core/sustainment';

interface SustainmentOverviewProps {
  record: SustainmentRecord;
  onStartHandoff: () => void;
  onOpenProcess: () => void;
  onOpenAnalyze: () => void;
  /** Optional: per-cause in-control rows from caller (Plan 4 wires real data). */
  perCauseRows?: Array<{ factor: string; inControl: boolean; observation?: string }>;
}

const SUSTAINMENT_THRESHOLD = 4;

const SustainmentOverview: React.FC<SustainmentOverviewProps> = ({
  record,
  onStartHandoff,
  onOpenProcess,
  onOpenAnalyze,
  perCauseRows = [],
}) => {
  const ticks = Math.max(0, record.consecutiveOnTargetTicks);
  const visibleTicks = Math.min(ticks, 8);
  const canHandoff = ticks >= SUSTAINMENT_THRESHOLD && record.status !== 'drifted';

  return (
    <div className="space-y-5">
      <div
        className={`rounded-r-md border-l-4 px-4 py-3 ${
          record.status === 'drifted'
            ? 'border-amber-400 bg-amber-50'
            : 'border-green-500 bg-green-50'
        }`}
      >
        <div className="text-xs font-semibold uppercase tracking-wide text-green-700">
          {record.status === 'drifted'
            ? 'Drift detected · last tick failed'
            : `Sustained · ${ticks} of ${ticks} ticks on target`}
        </div>
      </div>

      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-content-tertiary">
          Cadence tick history
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {Array.from({ length: visibleTicks }, (_, i) => (
            <span
              key={i}
              data-testid={`cadence-tick-${i}`}
              className="rounded-sm bg-green-100 px-2 py-0.5 text-[10px] font-mono text-green-800"
            >
              Wk {i + 1} ✓
            </span>
          ))}
        </div>
      </div>

      {perCauseRows.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-content-tertiary">
            Per-cause in-control evidence
          </div>
          {perCauseRows.map(row => (
            <div
              key={row.factor}
              className="rounded-md border border-edge p-2 text-xs"
            >
              <div className="font-medium text-content">{row.factor}</div>
              <div className={`mt-0.5 ${row.inControl ? 'text-green-700' : 'text-amber-700'}`}>
                {row.inControl ? '✓' : '⚠'} {row.observation ?? (row.inControl ? 'in control' : 'drift detected')}
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-content-tertiary">
          Continue in
        </div>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={onOpenProcess}
            className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-100"
          >
            Process · monitor drift
          </button>
          <button
            type="button"
            onClick={onOpenAnalyze}
            className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-100"
          >
            Analyze · capability latest
          </button>
          <button
            type="button"
            onClick={onStartHandoff}
            disabled={!canHandoff}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            data-testid="sustainment-start-handoff"
          >
            → Start Handoff
          </button>
        </div>
      </div>
    </div>
  );
};

export default SustainmentOverview;
```

- [ ] **Step 4: Run test**

```bash
pnpm --filter @variscout/ui test -- SustainmentOverview
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/IPDetail/stages/SustainmentOverview.tsx packages/ui/src/components/IPDetail/stages/__tests__/SustainmentOverview.test.tsx
git commit -m "feat(ui): add Sustainment Overview with cadence ticks + Start Handoff CTA"
```

### Task PR-PT-5.2: SustainmentSections thin wrapper

**Files:**

- Create: `packages/ui/src/components/IPDetail/stages/SustainmentSections.tsx`

- [ ] **Step 1: Create the wrapper** — V1 mounts the existing `SustainmentForm` from `@variscout/ui` if available, else renders a "coming soon" placeholder. Confirm the form exists with:

```bash
grep -r "export.*SustainmentForm" packages/ui/src 2>&1 | head -5
```

Then create `SustainmentSections.tsx`:

```typescript
import React from 'react';
import type { SustainmentRecord, SustainmentRecordChangePatch } from '@variscout/core/sustainment';

interface SustainmentSectionsProps {
  record: SustainmentRecord;
  onChange?: (patch: SustainmentRecordChangePatch) => void;
}

const SustainmentSections: React.FC<SustainmentSectionsProps> = ({ record, onChange }) => {
  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
        Sustainment record · {record.title}
      </div>
      <p className="rounded-md bg-slate-50 p-3 text-xs text-content-secondary">
        The Sustainment authoring form (cadence picker, override toggle, latest review)
        is reachable today via the legacy Sustainment activeView. This Sections-mode
        embedding will inline the same form in a follow-up plan; for V1 we link out.
      </p>
      <button
        type="button"
        className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-100"
        data-testid="sustainment-open-legacy"
        onClick={() => onChange?.({})}
      >
        Open legacy Sustainment panel
      </button>
    </div>
  );
};

export default SustainmentSections;
```

- [ ] **Step 2: Commit**

```bash
git add packages/ui/src/components/IPDetail/stages/SustainmentSections.tsx
git commit -m "feat(ui): add Sustainment Sections shim (links to legacy panel for V1)"
```

### Task PR-PT-5.3: HandoffOverview operationalization checklist

**Files:**

- Create: `packages/ui/src/components/IPDetail/stages/HandoffOverview.tsx`
- Test: `__tests__/HandoffOverview.test.tsx`

- [ ] **Step 1: Write the failing test:**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HandoffOverview, { type HandoffChecklistInputs } from '../HandoffOverview';

const allDone: HandoffChecklistInputs = {
  controlPlanDocumented: true,
  trainingDelivered: true,
  cadenceAssigned: true,
  processOwnerAcknowledged: true,
};

const pendingAck: HandoffChecklistInputs = {
  ...allDone,
  processOwnerAcknowledged: false,
};

describe('HandoffOverview', () => {
  it('shows 4 of 4 complete when all done', () => {
    render(<HandoffOverview inputs={allDone} onOpenReport={() => {}} onExportPdf={() => {}} onNudgeOwner={() => {}} />);
    expect(screen.getByText(/4 of 4 items complete/i)).toBeInTheDocument();
  });

  it('shows 3 of 4 complete when one item is pending', () => {
    render(<HandoffOverview inputs={pendingAck} onOpenReport={() => {}} onExportPdf={() => {}} onNudgeOwner={() => {}} />);
    expect(screen.getByText(/3 of 4 items complete/i)).toBeInTheDocument();
  });

  it('calls onNudgeOwner when nudge button clicked on pending acknowledgment', () => {
    const onNudge = vi.fn();
    render(<HandoffOverview inputs={pendingAck} onOpenReport={() => {}} onExportPdf={() => {}} onNudgeOwner={onNudge} />);
    fireEvent.click(screen.getByTestId('handoff-nudge-owner'));
    expect(onNudge).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test -- HandoffOverview
```

Expected: FAIL.

- [ ] **Step 3: Create `HandoffOverview.tsx`:**

```typescript
import React from 'react';

export interface HandoffChecklistInputs {
  controlPlanDocumented: boolean;
  trainingDelivered: boolean;
  cadenceAssigned: boolean;
  processOwnerAcknowledged: boolean;
  /** Optional summaries to display under each item. */
  controlPlanRef?: string;
  trainingRef?: string;
  cadenceOwner?: string;
  acknowledgmentReminder?: string;
}

interface HandoffOverviewProps {
  inputs: HandoffChecklistInputs;
  onOpenReport: () => void;
  onExportPdf: () => void;
  onNudgeOwner: () => void;
}

interface ChecklistItem {
  key: keyof HandoffChecklistInputs;
  label: string;
  description: (i: HandoffChecklistInputs) => string;
}

const ITEMS: ChecklistItem[] = [
  {
    key: 'controlPlanDocumented',
    label: 'Control plan documented',
    description: i => i.controlPlanRef ?? 'No control plan linked',
  },
  {
    key: 'trainingDelivered',
    label: 'Training materials delivered',
    description: i => i.trainingRef ?? 'No training acknowledgments on file',
  },
  {
    key: 'cadenceAssigned',
    label: 'Monitoring cadence assigned',
    description: i => i.cadenceOwner ?? 'No owner assigned',
  },
  {
    key: 'processOwnerAcknowledged',
    label: 'Process Owner acknowledgment',
    description: i => i.acknowledgmentReminder ?? 'Pending — not yet acknowledged',
  },
];

const HandoffOverview: React.FC<HandoffOverviewProps> = ({ inputs, onOpenReport, onExportPdf, onNudgeOwner }) => {
  const completed = ITEMS.filter(it => inputs[it.key] === true).length;

  return (
    <div className="space-y-5">
      <div className="rounded-r-md border-l-4 border-indigo-500 bg-slate-50 px-4 py-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
          Handoff readiness · {completed} of {ITEMS.length} items complete
        </div>
      </div>

      <div className="space-y-2">
        {ITEMS.map(item => {
          const done = inputs[item.key] === true;
          return (
            <div
              key={String(item.key)}
              className={`rounded-md border p-3 ${done ? 'border-edge bg-white' : 'border-amber-300 bg-amber-50'}`}
            >
              <div className="flex items-start gap-2">
                <span className={done ? 'text-green-600' : 'text-amber-600'}>
                  {done ? '✓' : '⏳'}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-content">{item.label}</div>
                  <div className="mt-0.5 text-xs text-content-secondary">
                    {item.description(inputs)}
                  </div>
                </div>
                {!done && item.key === 'processOwnerAcknowledged' && (
                  <button
                    type="button"
                    onClick={onNudgeOwner}
                    className="rounded-md bg-indigo-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-indigo-700"
                    data-testid="handoff-nudge-owner"
                  >
                    Nudge
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-content-tertiary">
          Continue in
        </div>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={onOpenReport}
            className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-100"
          >
            Report · final summary
          </button>
          <button
            type="button"
            onClick={onExportPdf}
            className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-100"
          >
            Export PDF for audit
          </button>
        </div>
      </div>
    </div>
  );
};

export default HandoffOverview;
```

- [ ] **Step 4: Run test**

```bash
pnpm --filter @variscout/ui test -- HandoffOverview
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/IPDetail/stages/HandoffOverview.tsx packages/ui/src/components/IPDetail/stages/__tests__/HandoffOverview.test.tsx
git commit -m "feat(ui): add Handoff Overview operationalization checklist"
```

### Task PR-PT-5.4: HandoffSections thin wrapper

**Files:**

- Create: `packages/ui/src/components/IPDetail/stages/HandoffSections.tsx`

- [ ] **Step 1: Create** with the same shim pattern as `SustainmentSections.tsx`:

```typescript
import React from 'react';
import type { ControlHandoff } from '@variscout/core/sustainment';

interface HandoffSectionsProps {
  handoff: ControlHandoff;
  onOpenLegacy?: () => void;
}

const HandoffSections: React.FC<HandoffSectionsProps> = ({ handoff, onOpenLegacy }) => {
  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
        Control handoff · {handoff.title ?? '—'}
      </div>
      <p className="rounded-md bg-slate-50 p-3 text-xs text-content-secondary">
        The Handoff authoring form (control plan text, owner FK, training FK, acknowledgment toggle)
        is reachable today via the legacy Handoff activeView. This Sections-mode embedding will
        inline the same form in a follow-up plan; for V1 we link out.
      </p>
      <button
        type="button"
        onClick={onOpenLegacy}
        className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-100"
        data-testid="handoff-open-legacy"
      >
        Open legacy Handoff panel
      </button>
    </div>
  );
};

export default HandoffSections;
```

- [ ] **Step 2: Commit**

```bash
git add packages/ui/src/components/IPDetail/stages/HandoffSections.tsx
git commit -m "feat(ui): add Handoff Sections shim (links to legacy panel for V1)"
```

### Task PR-PT-5.5: Wire Sustainment + Handoff stages into IPDetailPage

**Files:**

- Modify: `packages/ui/src/components/IPDetail/IPDetailPage.tsx`

- [ ] **Step 1: Extend props.**

```typescript
import SustainmentOverview from './stages/SustainmentOverview';
import SustainmentSections from './stages/SustainmentSections';
import HandoffOverview, { type HandoffChecklistInputs } from './stages/HandoffOverview';
import HandoffSections from './stages/HandoffSections';
import type { SustainmentRecord, ControlHandoff } from '@variscout/core/sustainment';
```

Extend `IPDetailPageProps`:

```typescript
  /** Linked Sustainment record (Plan 5 follow-up may compute this from FK). */
  sustainmentRecord?: SustainmentRecord;
  /** Linked Handoff record. */
  controlHandoff?: ControlHandoff;
  /** Inputs for Handoff checklist (derived from controlHandoff). */
  handoffInputs?: HandoffChecklistInputs;
  /** Per-cause in-control rows (derived from cadence inputs by caller). */
  sustainmentPerCauseRows?: Array<{ factor: string; inControl: boolean; observation?: string }>;
  /** "Open legacy Sustainment panel" handler. */
  onOpenLegacySustainment?: () => void;
  /** "Open legacy Handoff panel" handler. */
  onOpenLegacyHandoff?: () => void;
  /** "Nudge owner" handler (Plan 3 wires actual notification). */
  onNudgeProcessOwner?: () => void;
```

- [ ] **Step 2: Replace placeholders for `sustainment` and `handoff` stages** in the main body:

```typescript
{activeStage === 'sustainment' && mode === 'overview' && sustainmentRecord && (
  <SustainmentOverview
    record={sustainmentRecord}
    onStartHandoff={() => {/* PR-PT-5.6 final wiring */}}
    onOpenProcess={() => onJumpOut?.('process')}
    onOpenAnalyze={() => onJumpOut?.('analyze')}
    perCauseRows={sustainmentPerCauseRows}
  />
)}
{activeStage === 'sustainment' && mode === 'sections' && sustainmentRecord && (
  <SustainmentSections record={sustainmentRecord} onChange={() => onOpenLegacySustainment?.()} />
)}
{activeStage === 'sustainment' && !sustainmentRecord && (
  <p className="text-sm text-content-secondary">
    No Sustainment record linked yet. Close the IP (Approach stage) to auto-create one per ADR-080.
  </p>
)}

{activeStage === 'handoff' && mode === 'overview' && handoffInputs && (
  <HandoffOverview
    inputs={handoffInputs}
    onOpenReport={() => onJumpOut?.('report')}
    onExportPdf={() => {/* Plan 4 wires PDF export */}}
    onNudgeOwner={() => onNudgeProcessOwner?.()}
  />
)}
{activeStage === 'handoff' && mode === 'sections' && controlHandoff && (
  <HandoffSections handoff={controlHandoff} onOpenLegacy={() => onOpenLegacyHandoff?.()} />
)}
{activeStage === 'handoff' && (!handoffInputs || !controlHandoff) && (
  <p className="text-sm text-content-secondary">
    No Handoff record linked yet. Confirm Sustainment (4 consecutive on-target ticks) to start Handoff.
  </p>
)}
```

- [ ] **Step 3: Run all tests**

```bash
pnpm --filter @variscout/ui test -- IPDetail
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/components/IPDetail/IPDetailPage.tsx
git commit -m "feat(ui): wire Sustainment + Handoff stages into IPDetailPage"
```

### Task PR-PT-5.6: Wire Sustainment + Handoff inputs from PWA + Azure

**Files:**

- Modify: `apps/pwa/src/components/ProjectsTabView.tsx`
- Modify: `apps/azure/src/components/ProjectsTabView.tsx`
- Modify: `apps/pwa/src/App.tsx` — pass sustainment + handoff records into ProjectsTabView

- [ ] **Step 1: Source linked records in PWA App.tsx.**

```bash
grep -n "sustainmentRecords\|controlHandoffs" apps/pwa/src/App.tsx 2>&1 | head -5
```

Locate the existing selectors (e.g., `useSustainmentStore`, `useControlHandoffStore`). Pass into `ProjectsTabView`:

```typescript
const sustainmentRecord = sustainmentRecords.find(
  r => r.improvementProjectId === panels.selectedProjectId && r.deletedAt === null
);
const controlHandoff = controlHandoffs.find(
  h => h.improvementProjectId === panels.selectedProjectId && h.deletedAt === null
);
const handoffInputs: HandoffChecklistInputs | undefined = controlHandoff
  ? {
      controlPlanDocumented: Boolean(controlHandoff.controlPlanText),
      trainingDelivered: Boolean(controlHandoff.trainingRef),
      cadenceAssigned: Boolean(controlHandoff.cadenceOwner),
      processOwnerAcknowledged: controlHandoff.status !== 'pending',
      controlPlanRef: controlHandoff.controlPlanText?.slice(0, 60),
      trainingRef: controlHandoff.trainingRef,
      cadenceOwner: controlHandoff.cadenceOwner,
    }
  : undefined;
```

(Field names depend on the actual `ControlHandoff` shape — confirm against `packages/core/src/sustainment.ts` and adjust.)

- [ ] **Step 2: Extend `ProjectsTabView` props** to accept `sustainmentRecord`, `controlHandoff`, `handoffInputs`, `onOpenLegacySustainment`, `onOpenLegacyHandoff`, `onNudgeProcessOwner` — pass through to `IPDetailPage`.

- [ ] **Step 3: Wire legacy panel handlers in App.tsx:**

```typescript
                onOpenLegacySustainment={() => panels.showSustainment(panels.selectedProjectId ?? undefined)}
                onOpenLegacyHandoff={() => panels.showHandoff(panels.selectedProjectId ?? undefined)}
                onNudgeProcessOwner={() => {
                  // Plan 1 no-op; Plan 3 (team workspace) will emit EngagementEvent webhook.
                  console.info('[handoff] Nudge process owner — Plan 3 will wire EngagementEvent');
                }}
```

- [ ] **Step 4: Mirror in Azure.**

- [ ] **Step 5: Verify in browser.**

`claude --chrome` walk:

1. Open a closed IP with a SustainmentRecord → confirm Sustainment Overview renders with cadence ticks.
2. Click "Open legacy Sustainment panel" → confirms legacy `SustainmentPanel` opens.
3. Same for Handoff.

- [ ] **Step 6: Commit**

```bash
git add apps/pwa/src/components/ProjectsTabView.tsx apps/pwa/src/App.tsx apps/azure/src/components/ProjectsTabView.tsx
git commit -m "feat(apps): wire Sustainment + Handoff records into ProjectsTabView"
```

### Task PR-PT-5.7: PR-PT-5 review + push

- [ ] **Step 1: pr-ready-check.**

```bash
bash scripts/pr-ready-check.sh
```

- [ ] **Step 2: Push + PR.**

```bash
git push
gh pr create --title "feat(projects): PR-PT-5 Sustainment + Handoff stages" --body "Cadence-tick Sustainment Overview + checklist Handoff Overview. Sections-mode V1 shims link to legacy panels. PWA + Azure wired with linked SustainmentRecord + ControlHandoff."
```

- [ ] **Step 3: Final code-review subagent.**

---

## Plan-level verification

After all 5 PRs merge, the Projects tab is end-to-end functional:

| Verification                                                                                                  | Expected |
| ------------------------------------------------------------------------------------------------------------- | -------- |
| Tab nav reads `[Home] [Process] [Analyze] [Investigation] [Improve] [Projects] [Report]` in PWA + Azure       | ✓        |
| Clicking Projects on a hub with 0 IPs shows empty-state CTA                                                   | ✓        |
| Clicking Projects on a hub with N IPs shows list of cards                                                     | ✓        |
| Clicking an IP card opens IPDetailPage with stage tabs + Overview/Sections toggle + team rail skeleton        | ✓        |
| Stage tabs show ✓ done / current (indigo underline) / ○ not-started / ⏸ locked per `deriveStageState`         | ✓        |
| Charter Overview renders KPI strip + jump-outs; Charter Sections wraps existing form                          | ✓        |
| Approach Overview renders per-SuspectedCause cards; clicking "Open in Improve workbench" jumps to Improve tab | ✓        |
| Sustainment Overview renders cadence ticks; "Start Handoff" disables until 4 consecutive on-target ticks      | ✓        |
| Handoff Overview renders operationalization checklist; "Nudge Pat" triggers handler                           | ✓        |
| `ImprovementProject.reflection?` field type-checks and round-trips through `.vrs` (existing serializer)       | ✓        |
| All new tests pass; existing test suite green                                                                 | ✓        |
| `bash scripts/pr-ready-check.sh` exits 0 on the merge                                                         | ✓        |

**Manual chrome walk** (using `claude --chrome`): create a hub with 1 IP → walk through Charter → Approach → Sustainment → Handoff stages, click each stage tab, toggle Overview/Sections, click each jump-out and confirm it navigates correctly.

---

## What ships next (Plans 2-4)

- **Plan 2:** Home active-IP launchpad + IP-context cascade across Process/Analyze/Investigation/Improve/Report tabs (2 PRs).
- **Plan 3:** Team workspace rail V1 — full roster + activity feed + signoff status card (1 PR).
- **Plan 4:** Report tab IP-scoped + Overview/Technical audience toggle + 7-section QC-Story narrative arc + per-cause auto-chart selection + PDF export (1 PR).

Each plan can be drafted via `superpowers:writing-plans` when ready to execute.
