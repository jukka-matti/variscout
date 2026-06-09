---
tier: ephemeral
purpose: build
title: 'Project tab V1 redesign implementation plan'
status: active
last-reviewed: 2026-06-09
related:
  - docs/superpowers/specs/2026-06-09-project-tab-v1-redesign.md
  - docs/01-vision/product-overview.md
  - docs/02-journeys/ia-nav-model.md
layer: spec
---

# Project Tab V1 Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Project tab into a formal V1 Project dossier with light live status signals, current Analyze/Wall vocabulary, read-only Sponsor visibility, and jump-outs to the workflow tabs.

**Architecture:** Keep `@variscout/ui` as the shared Project-detail rendering layer and pass read-only project overview signals from PWA/Azure wrappers. Do not rename internal `IPDetail*` files in this slice; visible copy and ARIA use Project. Apply L1/L2/L3 documentation deltas before code.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, Tailwind semantic tokens, `@variscout/core` pure helpers, `@variscout/ui` shared components, PWA/Azure app wrappers.

---

## File Structure

- Modify `docs/superpowers/specs/2026-06-09-project-tab-v1-redesign.md`: flip `status` to `active` when applying.
- Modify `docs/01-vision/product-overview.md`: active Project context wording.
- Modify `docs/02-journeys/ia-nav-model.md`: user-facing active Project context, with internal active-IP store note only where needed.
- Modify `docs/02-journeys/personas/lead.md`: active Project context and Project selection wording.
- Modify `docs/02-journeys/personas/member.md`: Project Dashboard link language.
- Modify `docs/02-journeys/personas/sponsor.md`: Project read-only visibility.
- Modify `docs/03-features/workflows/project-dashboard.md`: current Project tab dossier contract.
- Modify `docs/03-features/workflows/collaboration.md`: active Project context wording.
- Create `packages/ui/src/components/IPDetail/projectOverviewSignals.ts`: shared read-only signal types and count helpers.
- Create `packages/ui/src/components/IPDetail/ProjectSignalChips.tsx`: compact dot/count chips local to Project detail.
- Modify `packages/ui/src/components/IPDetail/IPDetailHeader.tsx`: visible Project wording.
- Modify `packages/ui/src/components/IPDetail/IPDetailStageTabs.tsx`: Project lifecycle ARIA.
- Modify `packages/ui/src/components/IPDetail/IPDetailPage.tsx`: pass signals, remove Sponsor Report-only branch, gate Sponsor read-only callbacks.
- Modify `packages/ui/src/components/IPDetail/stages/CharterOverview.tsx`: live chips and Analyze Wall vocabulary.
- Modify `packages/ui/src/components/IPDetail/stages/ApproachOverview.tsx`: live chips and route labels.
- Modify `packages/ui/src/components/IPDetail/stages/ControlOverview.tsx`: Control closeout copy and closure chips.
- Modify `packages/ui/src/components/IPDetail/index.ts`: export signal type if needed by apps.
- Modify `apps/pwa/src/components/ProjectsTabView.tsx`: derive basic signals from `approachInputs`, `actions`, project members.
- Modify `apps/azure/src/components/ProjectsTabView.tsx`: derive basic signals from `approachInputs`, `actions`, project members.
- Modify focused tests in `packages/ui`, `apps/pwa`, and `apps/azure`.

## Task 1: Apply Documentation Deltas

**Files:**

- Modify: `docs/superpowers/specs/2026-06-09-project-tab-v1-redesign.md`
- Modify: `docs/01-vision/product-overview.md`
- Modify: `docs/02-journeys/ia-nav-model.md`
- Modify: `docs/02-journeys/personas/lead.md`
- Modify: `docs/02-journeys/personas/member.md`
- Modify: `docs/02-journeys/personas/sponsor.md`
- Modify: `docs/03-features/workflows/project-dashboard.md`
- Modify: `docs/03-features/workflows/collaboration.md`

- [ ] **Step 1: Update spec lifecycle**

Change frontmatter in `docs/superpowers/specs/2026-06-09-project-tab-v1-redesign.md`:

```yaml
status: active
last-reviewed: 2026-06-09
```

- [ ] **Step 2: Apply active Project context wording**

Edit docs so user-facing text says active Project context instead of active-IP cascade. Keep code-internal names only in explicit implementation notes, for example:

```markdown
The user-facing model is **active Project context**: the user selects a Project, and Process / Explore / Analyze / Improve read that Project as their scope. Some internal stores still use `activeIP` names; those are implementation names, not UI vocabulary.
```

- [ ] **Step 3: Verify docs**

Run:

```bash
pnpm docs:check:frontmatter
pnpm docs:check
```

Expected: both commands exit 0.

- [ ] **Step 4: Commit docs apply**

Run:

```bash
git add docs/superpowers/specs/2026-06-09-project-tab-v1-redesign.md docs/01-vision/product-overview.md docs/02-journeys/ia-nav-model.md docs/02-journeys/personas/lead.md docs/02-journeys/personas/member.md docs/02-journeys/personas/sponsor.md docs/03-features/workflows/project-dashboard.md docs/03-features/workflows/collaboration.md
git commit -m "docs(project): apply active Project context"
```

## Task 2: Add Failing Project Signal Tests

**Files:**

- Create: `packages/ui/src/components/IPDetail/__tests__/projectOverviewSignals.test.ts`
- Modify: `packages/ui/src/components/IPDetail/__tests__/IPDetailHeader.test.tsx`
- Modify: `packages/ui/src/components/IPDetail/__tests__/IPDetailStageTabs.test.tsx`
- Modify: `packages/ui/src/components/IPDetail/stages/__tests__/CharterOverview.test.tsx`
- Create: `packages/ui/src/components/IPDetail/stages/__tests__/ApproachOverview.test.tsx`
- Modify: `packages/ui/src/components/IPDetail/stages/__tests__/ControlOverview.test.tsx`
- Modify: `packages/ui/src/components/IPDetail/__tests__/IPDetailPage.test.tsx`

- [ ] **Step 1: Write helper tests**

Create tests for a `summarizeProjectOverviewSignals()` helper:

```ts
expect(summary.team).toEqual({ lead: 1, member: 1, sponsor: 1 });
expect(summary.hypotheses.proposed).toBe(1);
expect(summary.plans['in-progress']).toBe(1);
expect(summary.actions.done).toBe(1);
```

- [ ] **Step 2: Write visible vocabulary tests**

Add assertions:

```ts
expect(screen.getByTestId('ip-detail-back')).toHaveTextContent('All Projects');
expect(screen.getByRole('tablist', { name: /project lifecycle stages/i })).toBeInTheDocument();
expect(screen.queryByText('All Improvement Projects')).not.toBeInTheDocument();
```

- [ ] **Step 3: Write Charter overview tests**

Assert Charter renders:

```ts
expect(screen.getByText('Analyze Wall')).toBeInTheDocument();
expect(screen.getByTestId('project-signal-team')).toHaveTextContent('Lead 1');
expect(screen.getByTestId('project-signal-wall')).toHaveTextContent('Proposed 1');
expect(screen.queryByText('Investigation')).not.toBeInTheDocument();
```

- [ ] **Step 4: Write Approach overview tests**

Assert Approach renders status chips and modern jump labels:

```ts
expect(screen.getByTestId('project-signal-actions')).toHaveTextContent('Done 1');
expect(screen.getByText('Analyze Wall')).toBeInTheDocument();
expect(screen.getByText('Process map')).toBeInTheDocument();
```

- [ ] **Step 5: Write Control overview tests**

Assert Control no longer says Handoff:

```ts
expect(screen.getByTestId('sustainment-start-closeout')).toHaveTextContent('Prepare closeout');
expect(screen.queryByText(/Handoff/i)).not.toBeInTheDocument();
expect(screen.getByTestId('project-signal-control')).toHaveTextContent('4 ticks');
```

- [ ] **Step 6: Write Sponsor visibility test**

Change Sponsor test to expect read-only Project tabs:

```ts
expect(screen.getByRole('tab', { name: /charter/i })).toBeInTheDocument();
expect(screen.getByRole('tab', { name: /approach/i })).toBeInTheDocument();
expect(screen.getByRole('tab', { name: /control/i })).toBeInTheDocument();
expect(screen.queryByTestId('sponsor-report-panel')).not.toBeInTheDocument();
expect(screen.queryByRole('button', { name: /invite team/i })).not.toBeInTheDocument();
```

- [ ] **Step 7: Verify RED**

Run:

```bash
pnpm --filter @variscout/ui test -- IPDetail
```

Expected: FAIL because the helper/components/labels are not implemented yet.

## Task 3: Implement Shared Signals and Project Vocabulary

**Files:**

- Create: `packages/ui/src/components/IPDetail/projectOverviewSignals.ts`
- Create: `packages/ui/src/components/IPDetail/ProjectSignalChips.tsx`
- Modify: `packages/ui/src/components/IPDetail/index.ts`
- Modify: `packages/ui/src/components/IPDetail/IPDetailHeader.tsx`
- Modify: `packages/ui/src/components/IPDetail/IPDetailStageTabs.tsx`

- [ ] **Step 1: Implement signal helper**

Create `ProjectOverviewSignals` and `summarizeProjectOverviewSignals()` that counts:

```ts
team: {
  lead: number;
  member: number;
  sponsor: number;
}
hypotheses: Record<HypothesisStatus, number>;
plans: Record<MeasurementPlanStatus, number>;
actions: Record<ActionItemStatus, number>;
findings: Record<FindingStatus, number>;
```

Use `groupHypothesesByStatus()` and initialize every status key to zero.

- [ ] **Step 2: Implement chip component**

Create `ProjectSignalChips.tsx` with semantic Tailwind classes, dot + label + count, and `data-testid={chip.testId}`.

- [ ] **Step 3: Update header and stage tabs**

Change visible text to `All Projects` and ARIA to `Project lifecycle stages`.

- [ ] **Step 4: Verify GREEN subset**

Run:

```bash
pnpm --filter @variscout/ui test -- projectOverviewSignals IPDetailHeader IPDetailStageTabs
```

Expected: PASS.

## Task 4: Implement Stage Overviews and Sponsor Read-Only Project View

**Files:**

- Modify: `packages/ui/src/components/IPDetail/IPDetailPage.tsx`
- Modify: `packages/ui/src/components/IPDetail/stages/CharterOverview.tsx`
- Modify: `packages/ui/src/components/IPDetail/stages/ApproachOverview.tsx`
- Modify: `packages/ui/src/components/IPDetail/stages/ControlOverview.tsx`

- [ ] **Step 1: Extend props**

Add `overviewSignals?: ProjectOverviewSignals` to `IPDetailPage` and pass summary sections to each overview.

- [ ] **Step 2: Replace Sponsor placeholder**

Remove the Sponsor Report-only early return. Compute read-only booleans:

```ts
const viewerRole = hasIdentity ? members.find(m => m.userId === currentUserId)?.role : undefined;
const isSponsor = viewerRole === 'sponsor';
const canEditProject = !isSponsor;
const canManageMembership = !isSponsor && onMembersChange !== undefined;
```

Pass edit callbacks only when allowed.

- [ ] **Step 3: Update Charter overview**

Render signal chips for team, Wall, plans, and actions when present. Rename `onOpenInvestigation` prop to optional internal `onOpenWall` or leave prop name internal but visible button text must be `Analyze Wall`.

- [ ] **Step 4: Update Approach overview**

Render hypothesis, plan, action, and cause status chips. Use `Analyze Wall`, `Analyze evidence`, and `Process map`.

- [ ] **Step 5: Update Control overview**

Rename user-facing Handoff CTA to `Prepare closeout`; update test ID to `sustainment-start-closeout` while preserving the callback name if wider rename is not worth the churn.

- [ ] **Step 6: Verify GREEN UI suite**

Run:

```bash
pnpm --filter @variscout/ui test -- IPDetail
```

Expected: PASS.

## Task 5: Thread Signals from PWA and Azure

**Files:**

- Modify: `apps/pwa/src/components/ProjectsTabView.tsx`
- Modify: `apps/azure/src/components/ProjectsTabView.tsx`
- Modify: `apps/pwa/src/components/__tests__/ProjectsTabView.test.tsx`
- Modify: `apps/azure/src/components/__tests__/ProjectsTabView.test.tsx`

- [ ] **Step 1: Add failing app-wrapper assertions**

Assert Project detail receives enough data to render action/hypothesis chips from `approachInputs`.

- [ ] **Step 2: Verify RED**

Run:

```bash
pnpm --filter @variscout/pwa test -- ProjectsTabView
pnpm --filter @variscout/azure-app test -- ProjectsTabView
```

Expected: FAIL on missing signal chips.

- [ ] **Step 3: Derive and pass signals**

In both wrappers:

```ts
const overviewSignals = summarizeProjectOverviewSignals({
  members: selected.metadata.members ?? [],
  hypotheses: approachInputs?.hypotheses ?? [],
  actions: approachInputs?.actions ?? [],
});
```

Pass `overviewSignals={overviewSignals}` to `IPDetailPage`.

- [ ] **Step 4: Verify GREEN app wrappers**

Run:

```bash
pnpm --filter @variscout/pwa test -- ProjectsTabView
pnpm --filter @variscout/azure-app test -- ProjectsTabView
```

Expected: PASS.

## Task 6: Final Verification and Commit

**Files:**

- All modified source/test/doc files.

- [ ] **Step 1: Run focused checks**

Run:

```bash
pnpm --filter @variscout/ui test -- IPDetail
pnpm --filter @variscout/pwa test -- ProjectsTabView
pnpm --filter @variscout/azure-app test -- ProjectsTabView
pnpm --filter @variscout/ui build
pnpm docs:check
```

Expected: all exit 0.

- [ ] **Step 2: Scan forbidden vocabulary in touched Project files**

Run:

```bash
rg -n "root cause|All Improvement Projects|IP lifecycle stages|Start Handoff|> Start Handoff|\\bInvestigation\\b" packages/ui/src/components/IPDetail apps/pwa/src/components/ProjectsTabView.tsx apps/azure/src/components/ProjectsTabView.tsx docs/01-vision/product-overview.md docs/02-journeys/ia-nav-model.md docs/02-journeys/personas/lead.md docs/02-journeys/personas/member.md docs/02-journeys/personas/sponsor.md docs/03-features/workflows/project-dashboard.md docs/03-features/workflows/collaboration.md
```

Expected: no hits except acceptable historical/code-internal references reviewed manually.

- [ ] **Step 3: Commit implementation**

Run branch guard first:

```bash
git rev-parse --abbrev-ref HEAD
pwd
```

Expected branch: `codex/project-tab-v1-redesign`.
Expected cwd: `/Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/project-tab-v1-redesign`.

Then:

```bash
git add docs packages/ui apps/pwa/src/components/ProjectsTabView.tsx apps/pwa/src/components/__tests__/ProjectsTabView.test.tsx apps/azure/src/components/ProjectsTabView.tsx apps/azure/src/components/__tests__/ProjectsTabView.test.tsx
git commit -m "feat(project): align Project tab with V1 dossier model"
```
