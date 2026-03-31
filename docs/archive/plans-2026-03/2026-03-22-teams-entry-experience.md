---
title: 'Teams Entry Experience Implementation Plan'
---

# Teams Entry Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the VariScout entry experience: Portfolio (rich project cards) → Overview tab (what's new + status) → Analysis tab, with ID-based deep links, metadata sidecar, and full mobile/non-Teams support.

**Architecture:** Four layers — (1) metadata sidecar written on save for lightweight project health data, (2) enriched Portfolio replacing the flat table, (3) Overview tab integrating "what's new" and "other projects" into existing Project Dashboard, (4) ID-based deep links with expanded targets. Each layer delivers independently testable value.

**Tech Stack:** TypeScript, React, Zustand, Vitest, Graph API (OneDrive/SharePoint), IndexedDB

**Spec:** `docs/superpowers/specs/2026-03-22-teams-entry-experience-design.md`

---

## File Structure

### New files

| File                                                           | Responsibility                                                  |
| -------------------------------------------------------------- | --------------------------------------------------------------- |
| `packages/core/src/projectMetadata.ts`                         | `ProjectMetadata` type + `buildProjectMetadata()` pure function |
| `packages/core/src/__tests__/projectMetadata.test.ts`          | Tests for metadata builder                                      |
| `apps/azure/src/components/ProjectCard.tsx`                    | Rich project card for Portfolio                                 |
| `apps/azure/src/components/WhatsNewSection.tsx`                | "What's new since last visit" with timestamp diff               |
| `apps/azure/src/components/OtherProjectsList.tsx`              | Compact project list for Overview tab                           |
| `apps/azure/src/components/SampleDataPicker.tsx`               | Sample dataset selection modal/dropdown                         |
| `apps/azure/src/components/__tests__/ProjectCard.test.tsx`     | Portfolio card tests                                            |
| `apps/azure/src/components/__tests__/WhatsNewSection.test.tsx` | What's new tests                                                |
| `packages/core/src/ai/prompts/whatsNew.ts`                     | Extend dashboard prompt with "what's new" context               |
| `docs/07-decisions/adr-043-teams-entry-experience.md`          | ADR                                                             |

### Modified files

| File                                             | Change                                                                               |
| ------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `packages/core/src/index.ts`                     | Export ProjectMetadata type + buildProjectMetadata                                   |
| `apps/azure/src/services/storage.ts`             | Write `.meta.json` sidecar on save, read on list                                     |
| `apps/azure/src/services/deepLinks.ts`           | ID-based links, expanded targets (hypothesis, improvement, tab=overview), validation |
| `apps/azure/src/pages/Dashboard.tsx`             | Replace flat table with ProjectCard list, add sample picker, wire file open button   |
| `apps/azure/src/components/ProjectDashboard.tsx` | Integrate WhatsNewSection + OtherProjectsList                                        |
| `apps/azure/src/App.tsx`                         | Deep link validation, hypothesis/improvement routing, tab= parameter                 |
| `apps/azure/src/hooks/useTeamsShare.ts`          | New link builders for expanded targets                                               |
| `apps/azure/src/teams/TeamsTabConfig.tsx`        | Channel-specific entityId                                                            |

---

## Task 1: ProjectMetadata Type + Builder

Pure logic in `@variscout/core` — no React, no storage concerns.

**Files:**

- Create: `packages/core/src/projectMetadata.ts`
- Create: `packages/core/src/__tests__/projectMetadata.test.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/core/src/__tests__/projectMetadata.test.ts`. Test `buildProjectMetadata()`:

- Returns correct phase from findings/hypotheses (use same logic as `useJourneyPhase`: no data=frame, no findings=scout, findings but no actions=investigate, has actions=improve)
- Counts findings by status correctly
- Counts hypotheses by status correctly
- Counts actions (total, completed, overdue based on `dueDate < Date.now()`)
- Returns `assignedTaskCount` and `hasOverdueTasks` for a given userId
- Handles empty inputs (no findings, no hypotheses)

Read `packages/core/src/findings.ts` for Finding/Hypothesis types and `packages/hooks/src/useJourneyPhase.ts` for phase detection logic. The builder should replicate the phase detection as a pure function (no React hooks).

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/core test -- --run projectMetadata`

- [ ] **Step 3: Implement `buildProjectMetadata()`**

```typescript
import type { Finding, Hypothesis } from './findings';
import type { JourneyPhase } from './ai/types'; // reuse existing type, do NOT redeclare

export interface ProjectMetadata {
  phase: JourneyPhase;
  findingCounts: Record<string, number>;
  hypothesisCounts: Record<string, number>;
  actionCounts: { total: number; completed: number; overdue: number };
  assignedTaskCount: number;
  hasOverdueTasks: boolean;
  lastViewedAt: Record<string, number>;
}

export function buildProjectMetadata(
  findings: Finding[],
  hypotheses: Hypothesis[],
  hasData: boolean,
  userId: string,
  existingLastViewedAt?: Record<string, number>
): ProjectMetadata { ... }
```

Phase detection logic (replicate from useJourneyPhase without React):

- `!hasData` → 'frame'
- `findings.length === 0` → 'scout'
- `findings.some(f => f.actions?.length > 0)` → 'improve'
- else → 'investigate'

- [ ] **Step 4: Export from barrel**

Add to `packages/core/src/index.ts`.

- [ ] **Step 5: Run tests, verify pass**

Run: `pnpm --filter @variscout/core test -- --run`

- [ ] **Step 6: Commit**

```
feat(core): add ProjectMetadata type and buildProjectMetadata() builder
```

---

## Task 2: Metadata Sidecar in Storage Layer

Write `.meta.json` alongside `.vrs` on save, read it on list.

**Files:**

- Modify: `apps/azure/src/services/storage.ts`

- [ ] **Step 1: Read storage.ts fully**

Understand `saveProject()` (lines 630-750) and `listProjects()` (lines 819-865). Note how files are written to OneDrive/SharePoint via Graph API and to IndexedDB locally.

- [ ] **Step 2: Add sidecar write to `saveProject()`**

After saving the `.vrs` file, write a `<name>.meta.json` file to the same location:

- For IndexedDB: store metadata in a separate `projectMeta` object store (or as a field on the project record)
- For OneDrive/SharePoint: write `<name>.meta.json` via the same Graph API `saveToCustomLocation()` / PUT pattern

Import `buildProjectMetadata` from `@variscout/core`. Call it with the current findings, hypotheses, and user ID from EasyAuth.

- [ ] **Step 3: Add sidecar read to `listProjects()`**

After listing projects, read `.meta.json` for each project in parallel:

- For IndexedDB: read from the `projectMeta` store
- For OneDrive/SharePoint: batch-fetch `.meta.json` files via Graph API

Merge metadata into the returned `CloudProject` objects. Add a `metadata?: ProjectMetadata` field to `CloudProject`.

- [ ] **Step 4: Handle backward compat**

If `.meta.json` doesn't exist (old projects), `metadata` is `undefined` on the CloudProject. The Portfolio card handles this gracefully (shows basic info only).

- [ ] **Step 5: Add `lastViewedAt` update**

When the user views the Overview tab, update `lastViewedAt[userId]` in the metadata and write it back. This can be triggered from the ProjectDashboard component via a callback prop.

- [ ] **Step 6: Run tests, verify no regressions**

Run: `pnpm --filter @variscout/azure-app test -- --run`

- [ ] **Step 7: Commit**

```
feat(azure): write/read project metadata sidecar on save/list
```

---

## Task 3: Deep Links — ID-Based + Expanded Targets

**Files:**

- Modify: `apps/azure/src/services/deepLinks.ts`
- Modify: `apps/azure/src/services/__tests__/deepLinks.test.ts` (or create if doesn't exist)

- [ ] **Step 1: Read existing deepLinks.ts and tests**

Note the current `DeepLinkParams` interface, parser, and builders.

- [ ] **Step 2: Write failing tests for new functionality**

Test:

- `parseDeepLink` with `hypothesis=` parameter
- `parseDeepLink` with `mode=improvement`
- `parseDeepLink` with `tab=overview`
- `buildHypothesisLink()` produces correct URL
- `buildImprovementLink()` produces correct URL
- `buildOverviewLink()` uses `tab=` not `view=`
- Backward compat: name-based `?project=` still parses correctly
- Validation: `validateDeepLink()` returns error for invalid project

- [ ] **Step 3: Update DeepLinkParams + add new types**

```typescript
export type DeepLinkChart = 'ichart' | 'boxplot' | 'pareto' | 'stats';
export type DeepLinkMode = 'report' | 'improvement';
export type DeepLinkTab = 'overview';

export interface DeepLinkParams {
  project?: string; // project ID (or name for backward compat)
  findingId?: string;
  hypothesisId?: string; // NEW
  chart?: DeepLinkChart;
  mode?: DeepLinkMode; // expanded: + 'improvement'
  tab?: DeepLinkTab; // NEW: 'overview' (uses tab= not view=)
}
```

- [ ] **Step 4: Update parser and add builders**

Update `parseDeepLink()` to handle `hypothesis`, `mode=improvement`, `tab=overview`.

Add new builders:

- `buildProjectLink(baseUrl, projectId)` — base project link (NEW)
- `buildHypothesisLink(baseUrl, projectId, hypothesisId)`
- `buildImprovementLink(baseUrl, projectId)`
- `buildOverviewLink(baseUrl, projectId)` — uses `tab=overview`

Update existing builders to use the same pattern.

- [ ] **Step 5: Add `validateDeepLink()`**

```typescript
export interface DeepLinkValidation {
  valid: boolean;
  error?: 'project-not-found' | 'target-not-found';
  errorMessage?: string;
  isStandardPlan?: boolean; // for plan-aware error messages
}
```

- [ ] **Step 6: Run tests, verify pass**

Run: `pnpm --filter @variscout/azure-app test -- --run deepLinks`

- [ ] **Step 7: Commit**

```
feat(azure): expand deep links with ID-based routing, hypothesis/improvement/overview targets
```

---

## Task 4: ProjectCard Component

Rich project card for the Portfolio.

**Files:**

- Create: `apps/azure/src/components/ProjectCard.tsx`
- Create: `apps/azure/src/components/__tests__/ProjectCard.test.tsx`

- [ ] **Step 1: Read ProjectStatusCard.tsx for patterns**

Follow the same code style, Tailwind classes, status colors, phase config.

- [ ] **Step 2: Write failing tests**

Test:

- Renders project name and location
- Renders phase badge with correct color
- Renders finding counts when metadata present
- Renders "Your tasks" section when assigned tasks > 0
- Hides "Your tasks" when no assigned tasks
- Shows overdue flag with amber accent
- Calls onClick when clicked
- Handles missing metadata gracefully (shows basic card)
- Shows "who updated + when" text

- [ ] **Step 3: Implement ProjectCard**

```typescript
interface ProjectCardProps {
  project: CloudProject; // extended with metadata?: ProjectMetadata
  currentUserId: string;
  onClick: () => void;
}
```

Layout:

- Left border accent (amber if overdue tasks, transparent otherwise)
- Header: project name + phase badge (right-aligned)
- Subtitle: channel/location + "who updated + when"
- "Your tasks" section (conditional): indigo background, lists assigned items
- Footer: finding/hypothesis/action counts as compact badges

Use semantic Tailwind: `bg-surface-secondary`, `text-content`, `border-edge`.

- [ ] **Step 4: Run tests, verify pass**

Run: `pnpm --filter @variscout/azure-app test -- --run ProjectCard`

- [ ] **Step 5: Commit**

```
feat(azure): add ProjectCard component for Portfolio
```

---

## Task 5: WhatsNewSection Component

"What's new since last visit" using timestamp diff.

**Files:**

- Create: `apps/azure/src/components/WhatsNewSection.tsx`
- Create: `apps/azure/src/components/__tests__/WhatsNewSection.test.tsx`

- [ ] **Step 1: Write failing tests**

Test:

- Computes new findings since `lastViewedAt`
- Computes hypothesis status changes since `lastViewedAt`
- Computes completed actions since `lastViewedAt`
- Computes new comments since `lastViewedAt`
- Handles Hypothesis ISO string timestamps (Date.parse)
- Shows empty state when nothing new
- Shows items in chronological order (newest first)

- [ ] **Step 2: Implement WhatsNewSection**

```typescript
interface WhatsNewSectionProps {
  findings: Finding[];
  hypotheses: Hypothesis[];
  lastViewedAt: number; // epoch ms
}
```

Compute changes:

- Findings with `createdAt > lastViewedAt` or `statusChangedAt > lastViewedAt`
- Hypotheses with `Date.parse(updatedAt) > lastViewedAt` (ISO string!)
- Actions with `completedAt > lastViewedAt`
- Comments with `createdAt > lastViewedAt`

Render as a compact list with indigo background. Empty state: "All caught up" with checkmark.

- [ ] **Step 3: Run tests, verify pass**

- [ ] **Step 4: Commit**

```
feat(azure): add WhatsNewSection component for project dashboard
```

---

## Task 6: OtherProjectsList + SampleDataPicker

Two small components.

**Files:**

- Create: `apps/azure/src/components/OtherProjectsList.tsx`
- Create: `apps/azure/src/components/SampleDataPicker.tsx`

- [ ] **Step 1: Implement OtherProjectsList**

```typescript
interface OtherProjectsListProps {
  projects: CloudProject[]; // all projects except current
  currentProjectId: string;
  maxVisible?: number; // default 5
}
```

Compact cards: name, phase badge, last updated. Click opens project in new tab via `window.open()` with `?project=<id>`.

- [ ] **Step 2: Implement SampleDataPicker**

```typescript
interface SampleDataPickerProps {
  onSelectSample: (sample: SampleDataset) => void;
  isOpen: boolean;
  onClose: () => void;
}
```

Import `SAMPLES` from `@variscout/data`. Render as a modal/dropdown with sample name + description. On select, call `onSelectSample(sample)`.

Check existing sample loading logic in Editor empty state (EditorEmptyState or similar) — reuse if possible.

- [ ] **Step 3: Run tests, verify pass**

- [ ] **Step 4: Commit**

```
feat(azure): add OtherProjectsList and SampleDataPicker components
```

---

## Task 7: Dashboard.tsx Refactor — Portfolio

Replace the flat project table with rich ProjectCard list.

**Files:**

- Modify: `apps/azure/src/pages/Dashboard.tsx`

- [ ] **Step 1: Read Dashboard.tsx fully**

Note the existing table rendering (lines 196-269), action buttons, search, sync status.

- [ ] **Step 2: Replace table rows with ProjectCard**

Replace the `<table>` rendering with a vertical list of `<ProjectCard>` components. Pass `project` (with metadata), `currentUserId` from EasyAuth, and `onClick` handler.

- [ ] **Step 3: Sort projects by priority**

Projects sorted by: has your tasks (with overdue first) → recently modified → rest.

- [ ] **Step 4: Add SampleDataPicker**

Add "Try a Sample" button in the action row. Wire it to `SampleDataPicker` component.

- [ ] **Step 5: Wire "Open from..." button**

- Team plan: Use existing `useFilePicker` / `FileBrowseButton` for SharePoint
- Standard plan: Native file input for `.vrs`, `.csv`, `.xlsx`
- The `onLoadProjectFile` prop may already support this — check and wire it up

- [ ] **Step 6: Mobile layout**

Cards stack full-width. Action row: primary button full-width, secondary buttons in overflow. Phase badge below name on mobile.

- [ ] **Step 7: Run tests, verify pass**

Run: `pnpm --filter @variscout/azure-app test -- --run`

- [ ] **Step 8: Commit**

```
feat(azure): replace project table with rich ProjectCard Portfolio
```

---

## Task 8: ProjectDashboard.tsx Update — Overview Integration

Integrate WhatsNewSection + OtherProjectsList into existing ProjectDashboard.

**Files:**

- Modify: `apps/azure/src/components/ProjectDashboard.tsx`

- [ ] **Step 1: Read current ProjectDashboard.tsx**

Note existing layout, data sources, props.

- [ ] **Step 2: Add WhatsNewSection**

Import WhatsNewSection. Compute `lastViewedAt` from metadata. Render above the existing status section.

- [ ] **Step 3: Add OtherProjectsList**

Import OtherProjectsList. Need project list data — add a `projects?: CloudProject[]` prop or fetch via `useStorage().listProjects()` inside the component (lightweight call if metadata sidecar is available).

Render in the right column below the AI summary card. On mobile, collapsed behind "See other projects" expandable.

- [ ] **Step 4: Add `onUpdateLastViewed` callback**

When the Overview tab is shown, call back to update `lastViewedAt` in the metadata sidecar. Add prop: `onUpdateLastViewed?: () => void`. Editor.tsx will wire this to the storage layer.

- [ ] **Step 5: Extend AI summary with "what's new" context**

Import/create `buildWhatsNewPrompt()` that extends the dashboard summary prompt with "what's new" items. Feed this to the AI summary card so CoScout's greeting references recent changes.

- [ ] **Step 6: Run tests, verify pass**

Run: `pnpm --filter @variscout/azure-app test -- --run`

- [ ] **Step 7: Commit**

```
feat(azure): integrate WhatsNewSection and OtherProjectsList into Overview tab
```

---

## Task 9: App.tsx — Deep Link Routing

Update deep link parsing and routing in the main app.

**Files:**

- Modify: `apps/azure/src/App.tsx`
- Modify: `apps/azure/src/hooks/useTeamsShare.ts`
- Modify: `apps/azure/src/teams/TeamsTabConfig.tsx`

- [ ] **Step 1: Update deep link parsing in App.tsx**

The `deepLink` memo (line 76-81) uses `parseDeepLink()` which now returns expanded params. Update the auto-navigate effect to handle:

- `hypothesisId` → pass to Editor as `initialHypothesisId` prop
- `mode=improvement` → pass to Editor as `initialMode` prop
- `tab=overview` → set `activeView` to dashboard (Overview tab)

- [ ] **Step 2: Add deep link validation**

Before navigating, call `validateDeepLink()`. If invalid, show error UI instead of navigating:

- "This project may have been moved or deleted" (Team plan)
- "This project was not found locally..." (Standard plan)

- [ ] **Step 3: Update useTeamsShare.ts**

Add new link builders to the share hook:

- `buildHypothesisLink()`, `buildImprovementLink()`, `buildOverviewLink()`
- Update `setDeepLink()` calls to use `buildSubPageId()` with new targets

- [ ] **Step 4: Update TeamsTabConfig.tsx**

Change `entityId` from hardcoded `'variscout-channel'` to `'variscout-${channelId}'` using Teams context.

- [ ] **Step 5: Run tests, verify pass**

Run: `pnpm --filter @variscout/azure-app test -- --run`

- [ ] **Step 6: Commit**

```
feat(azure): expand deep link routing with validation and Teams updates
```

---

## Task 10: Documentation

**Files:**

- Create: `docs/07-decisions/adr-043-teams-entry-experience.md`
- Modify: `docs/07-decisions/index.md`
- Modify: `docs/03-features/workflows/project-dashboard.md`
- Modify: `docs/02-journeys/flows/project-reopen.md`
- Modify: `docs/06-design-system/patterns/navigation.md`
- Modify: `docs/08-products/feature-parity.md`
- Modify: `CLAUDE.md`
- Modify: `.claude/rules/monorepo.md`

- [ ] **Step 1: Write ADR-043**

Status: Accepted. Date: 2026-03-22.
Context: Entry experience lacks project health visibility, deep links fragile, no "what's new".
Decision: Portfolio with rich cards, metadata sidecar, ID-based deep links, timestamp diff.
Consequences: New components, storage changes, expanded deep link targets.

- [ ] **Step 2: Update ADR index**

Add ADR-043 to `docs/07-decisions/index.md`.

- [ ] **Step 3: Update feature docs**

Update `project-dashboard.md` with "what's new", "other projects", Portfolio integration.
Update `project-reopen.md` with Portfolio as entry point.
Update `navigation.md` with Portfolio → Overview → Analysis pattern.
Update `feature-parity.md` with Portfolio row.
Update `CLAUDE.md` task-to-doc table.
Update `.claude/rules/monorepo.md` component listing.

- [ ] **Step 4: Commit**

```
docs: add ADR-043 Teams Entry Experience, update feature and architecture docs
```

---

## Task 11: Final Verification

- [ ] **Step 1: Run full test suite**

```bash
pnpm test
```

- [ ] **Step 2: Build all packages**

```bash
pnpm build
```

- [ ] **Step 3: Manual verification**

Start dev server: `pnpm --filter @variscout/azure-app dev`

1. Portfolio shows rich project cards with status
2. Cards with assigned tasks show "Your tasks" section
3. Click project → Overview tab with "what's new"
4. Overview shows other projects in compact list
5. Click "Analysis" tab → full editor
6. Click "← Portfolio" → returns to Portfolio
7. "Try a Sample" → sample picker opens
8. Deep link with `?hypothesis=<id>` → correct target
9. Mobile viewport: cards stack, single-column Overview
10. Non-Teams: same flow, no channel name, "Open from Computer"
