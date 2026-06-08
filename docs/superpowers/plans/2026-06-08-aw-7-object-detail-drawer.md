---
tier: ephemeral
purpose: build
title: 'AW-7 Object Detail Drawer implementation sub-plan'
audience: human
status: active
date: 2026-06-08
layer: spec
topic: [analyze, wall, drawer, object-detail, comments, wedge-v1]
related:
  - docs/superpowers/plans/2026-06-08-analyze-wall-redesign-master-plan.md
  - docs/superpowers/specs/2026-06-08-analyze-wall-redesign-design.md
  - docs/superpowers/plans/2026-06-08-aw-6-scope-switcher.md
implements:
  - docs/03-features/workflows/analyze-wall.md
---

# AW-7 Object Detail Drawer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Selecting a Wall cause or finding opens a deterministic left object-detail drawer with Evidence, Comments, and Activity tabs in both Azure and PWA.

**Architecture:** Add a shared `ObjectDetailDrawer` in `@variscout/ui` and keep app shells responsible for resolving a selected Wall object id into a cause or finding. Reuse existing `HypothesisComments` and `FindingComments` instead of creating a new comment system; reuse existing store callbacks for comment add/edit/delete. The drawer is closed/collapsed by default and overlays the left edge of the Wall canvas so the canvas-first layout remains intact; CoScout stays out of scope for AW-8.

**Tech Stack:** React + TypeScript, Zustand-backed app stores, `@variscout/core` Finding/Hypothesis types, Vitest + Testing Library, Tailwind v4.

---

## Grounding

- Master plan: `docs/superpowers/plans/2026-06-08-analyze-wall-redesign-master-plan.md` → AW-7.
- Canonical spec: `docs/superpowers/specs/2026-06-08-analyze-wall-redesign-design.md` §7.7.
- Baseline: `pnpm test` passed from `.worktrees/feat-aw-7-object-detail-drawer`.
- Existing seams:
  - `WallCanvas` already exposes `onSelectHub?: (id: string) => void`.
  - `HypothesisCard` calls `onSelect(hub.id)`.
  - `FindingChip` calls the same callback with `finding.id`.
  - Azure already wires hub comment add/edit/delete through `enrichedPlanningProps`.
  - PWA already has `addFindingComment`, `editFindingComment`, and `deleteFindingComment` in `useAnalyzeStore`.

## Acceptance

- Closed Wall canvas shows a slim left detail handle on desktop.
- Selecting a cause opens the drawer and shows the cause name, Evidence / Comments / Activity tabs, supporting/counter findings, the hypothesis comment thread, and action/activity rows.
- Selecting a finding opens the drawer and shows the finding text, evidence metadata, the finding comment thread, and finding actions/status activity.
- Comments add/edit/delete through the drawer in the same store paths as existing card/log comments.
- PWA and Azure both mount the shared drawer on the Wall canvas.
- No CoScout content or right-drawer behavior is introduced.

## Files

- Create: `packages/ui/src/components/AnalyzeWall/ObjectDetailDrawer.tsx`
- Create: `packages/ui/src/components/AnalyzeWall/__tests__/ObjectDetailDrawer.test.tsx`
- Modify: `packages/ui/src/components/AnalyzeWall/index.ts`
- Modify: `apps/azure/src/components/editor/AnalyzeWorkspace.tsx`
- Modify: `apps/azure/src/components/editor/__tests__/AnalyzeWorkspace.mapwall.test.tsx`
- Modify: `apps/pwa/src/components/views/AnalyzeView.tsx`
- Modify: `apps/pwa/src/components/views/__tests__/AnalyzeView.mapwall.test.tsx`
- Modify: `docs/superpowers/plans/2026-06-08-analyze-wall-redesign-master-plan.md`

## Task 1: Shared Object Detail Drawer

**Files:**

- Create: `packages/ui/src/components/AnalyzeWall/ObjectDetailDrawer.tsx`
- Create: `packages/ui/src/components/AnalyzeWall/__tests__/ObjectDetailDrawer.test.tsx`
- Modify: `packages/ui/src/components/AnalyzeWall/index.ts`

- [ ] **Step 1: Write failing drawer tests**

Add tests that cover the closed handle, cause selection, finding selection, and comment callback reuse:

```tsx
it('renders a slim left handle when closed', () => {
  render(<ObjectDetailDrawer {...makeProps({ isOpen: false, selectedObject: null })} />);
  expect(screen.getByTestId('object-detail-handle')).toHaveTextContent('Details');
  expect(screen.queryByTestId('object-detail-drawer')).toBeNull();
});

it('opens on a selected cause with the expected tabs', () => {
  render(<ObjectDetailDrawer {...makeProps({ selectedObject: { kind: 'cause', id: 'h1' } })} />);
  expect(screen.getByTestId('object-detail-drawer')).toHaveTextContent('Suspected cause');
  expect(screen.getByTestId('object-detail-title')).toHaveTextContent('Nozzle runs hot');
  expect(screen.getByRole('tab', { name: 'Evidence' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Comments' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Activity' })).toBeInTheDocument();
});

it('shows supporting and counter evidence for a cause', () => {
  render(<ObjectDetailDrawer {...makeProps({ selectedObject: { kind: 'cause', id: 'h1' } })} />);
  expect(screen.getByTestId('object-detail-evidence')).toHaveTextContent('Supports');
  expect(screen.getByTestId('object-detail-evidence')).toHaveTextContent('Temperature spike');
  expect(screen.getByTestId('object-detail-evidence')).toHaveTextContent('Counts against');
  expect(screen.getByTestId('object-detail-evidence')).toHaveTextContent('Jig checked OK');
});

it('uses the hypothesis comment callbacks for cause comments', async () => {
  const onAddHubComment = vi.fn();
  render(
    <ObjectDetailDrawer
      {...makeProps({
        selectedObject: { kind: 'cause', id: 'h1' },
        onAddHubComment,
      })}
    />
  );
  await userEvent.click(screen.getByRole('tab', { name: 'Comments' }));
  await userEvent.click(screen.getByRole('button', { name: /add comment/i }));
  await userEvent.type(screen.getByLabelText(/finding.note/i), 'Drawer comment');
  await userEvent.click(screen.getByRole('button', { name: /save/i }));
  expect(onAddHubComment).toHaveBeenCalledWith('h1', 'Drawer comment', undefined);
});

it('uses the finding comment callbacks for finding comments', async () => {
  const onAddFindingComment = vi.fn();
  render(
    <ObjectDetailDrawer
      {...makeProps({
        selectedObject: { kind: 'finding', id: 'f1' },
        onAddFindingComment,
      })}
    />
  );
  await userEvent.click(screen.getByRole('tab', { name: 'Comments' }));
  await userEvent.click(screen.getByRole('button', { name: /add comment/i }));
  await userEvent.type(screen.getByLabelText(/finding.note/i), 'Finding drawer comment');
  await userEvent.click(screen.getByRole('button', { name: /save/i }));
  expect(onAddFindingComment).toHaveBeenCalledWith('f1', 'Finding drawer comment', undefined);
});
```

- [ ] **Step 2: Run UI test and verify RED**

Run:

```bash
pnpm --filter @variscout/ui test -- src/components/AnalyzeWall/__tests__/ObjectDetailDrawer.test.tsx
```

Expected: fails because `ObjectDetailDrawer` does not exist yet.

- [ ] **Step 3: Implement `ObjectDetailDrawer`**

Create a controlled component with:

- `selectedObject: { kind: 'cause' | 'finding'; id: string } | null`
- `isOpen`, `onOpenChange`, `hubs`, `findings`
- project member/current user props for `HypothesisComments`
- hub comment callbacks matching `WallCanvasPlanningProps`
- finding comment callbacks matching `FindingComments`

Render a closed handle when `!isOpen`; render the drawer when open. Resolve selected cause by `hubs.find(h => h.id === selectedObject.id)` and selected finding by `findings.find(f => f.id === selectedObject.id)`. Do not invent persisted drawer state in `@variscout/stores`.

- [ ] **Step 4: Export the drawer**

Update `packages/ui/src/components/AnalyzeWall/index.ts`:

```ts
export { ObjectDetailDrawer } from './ObjectDetailDrawer';
export type { ObjectDetailDrawerProps, ObjectDetailSelection } from './ObjectDetailDrawer';
```

- [ ] **Step 5: Run UI test and verify GREEN**

Run:

```bash
pnpm --filter @variscout/ui test -- src/components/AnalyzeWall/__tests__/ObjectDetailDrawer.test.tsx
```

Expected: all drawer tests pass.

- [ ] **Step 6: Commit shared drawer**

Run branch guard first:

```bash
pwd
git rev-parse --abbrev-ref HEAD
```

Expected: `.worktrees/feat-aw-7-object-detail-drawer` and `feat/aw-7-object-detail-drawer`.

Commit:

```bash
git add packages/ui/src/components/AnalyzeWall/ObjectDetailDrawer.tsx packages/ui/src/components/AnalyzeWall/__tests__/ObjectDetailDrawer.test.tsx packages/ui/src/components/AnalyzeWall/index.ts
git commit -m "feat(ui): add analyze wall object detail drawer"
```

## Task 2: Azure Wall Drawer Mount

**Files:**

- Modify: `apps/azure/src/components/editor/AnalyzeWorkspace.tsx`
- Modify: `apps/azure/src/components/editor/__tests__/AnalyzeWorkspace.mapwall.test.tsx`

- [ ] **Step 1: Write failing Azure seam test**

Add a test that renders the Wall sample, clicks a cause card, and asserts the drawer opens with the selected cause. Then switch to the Comments tab and verify the drawer can call the same hub comment path as the Wall card comments.

- [ ] **Step 2: Run Azure mapwall test and verify RED**

Run:

```bash
pnpm --filter @variscout/azure-app test -- src/components/editor/__tests__/AnalyzeWorkspace.mapwall.test.tsx
```

Expected: the new drawer assertions fail because the drawer is not mounted yet.

- [ ] **Step 3: Wire Azure selection state**

In `AnalyzeWorkspace.tsx`, add local state:

```ts
const [selectedWallObject, setSelectedWallObject] = useState<ObjectDetailSelection | null>(null);
const [objectDetailOpen, setObjectDetailOpen] = useState(false);
```

Add a resolver callback:

```ts
const handleSelectWallObject = useCallback(
  (id: string) => {
    const kind = hubs.some(hub => hub.id === id)
      ? 'cause'
      : scopedFindings.some(f => f.id === id)
        ? 'finding'
        : null;
    if (!kind) return;
    setSelectedWallObject({ kind, id });
    setObjectDetailOpen(true);
  },
  [hubs, scopedFindings]
);
```

Pass `onSelectHub={handleSelectWallObject}` to `WallCanvas`.

- [ ] **Step 4: Mount the drawer in the Wall canvas shell**

Mount `ObjectDetailDrawer` as an absolute left overlay sibling to `WallCanvas`, desktop only. Pass `hubs`, `scopedFindings`, `members`, `userId`, enriched hub comment callbacks, and finding comment callbacks:

```tsx
<ObjectDetailDrawer
  selectedObject={selectedWallObject}
  isOpen={objectDetailOpen}
  onOpenChange={setObjectDetailOpen}
  hubs={hubs}
  findings={scopedFindings}
  members={members}
  currentUserId={userId}
  onAddHubComment={enrichedPlanningProps?.onAddHubComment}
  onEditHubComment={enrichedPlanningProps?.onEditHubComment}
  onDeleteHubComment={enrichedPlanningProps?.onDeleteHubComment}
  onAddFindingComment={(id, text, attachment) => handleAddCommentWithAuthor(id, text, attachment)}
  onEditFindingComment={findingsState.editFindingComment}
  onDeleteFindingComment={findingsState.deleteFindingComment}
  showAuthors={members.length > 0}
/>
```

- [ ] **Step 5: Run Azure mapwall test and verify GREEN**

Run:

```bash
pnpm --filter @variscout/azure-app test -- src/components/editor/__tests__/AnalyzeWorkspace.mapwall.test.tsx
```

Expected: the new drawer seam and existing mapwall tests pass.

- [ ] **Step 6: Commit Azure mount**

Run branch guard first, then:

```bash
git add apps/azure/src/components/editor/AnalyzeWorkspace.tsx apps/azure/src/components/editor/__tests__/AnalyzeWorkspace.mapwall.test.tsx
git commit -m "feat(azure): mount analyze wall object detail drawer"
```

## Task 3: PWA Wall Drawer Mount

**Files:**

- Modify: `apps/pwa/src/components/views/AnalyzeView.tsx`
- Modify: `apps/pwa/src/components/views/__tests__/AnalyzeView.mapwall.test.tsx`

- [ ] **Step 1: Write failing PWA seam test**

Add a test that renders the PWA Wall sample, clicks a cause card, and asserts the drawer opens with the selected cause. Add a finding-chip selection case if the fixture exposes a chip in the visible DOM; otherwise keep finding selection covered in the shared UI test.

- [ ] **Step 2: Run PWA mapwall test and verify RED**

Run:

```bash
pnpm --filter @variscout/pwa test -- src/components/views/__tests__/AnalyzeView.mapwall.test.tsx
```

Expected: the new drawer assertion fails because the drawer is not mounted yet.

- [ ] **Step 3: Wire PWA selection state**

Mirror the Azure state and resolver in `AnalyzeView.tsx`, using `hubs` and `scopedFindings`. Pass the resolver to `WallCanvas` as `onSelectHub`.

- [ ] **Step 4: Mount the drawer in PWA**

Mount `ObjectDetailDrawer` in the PWA Wall shell. PWA has no project-member ACL surface here, so pass `members={[]}` and `currentUserId={null}`. Use `useAnalyzeStore.getState()` callbacks:

```tsx
<ObjectDetailDrawer
  selectedObject={selectedWallObject}
  isOpen={objectDetailOpen}
  onOpenChange={setObjectDetailOpen}
  hubs={hubs}
  findings={scopedFindings}
  members={[]}
  currentUserId={null}
  onAddHubComment={enrichedPlanningProps?.onAddHubComment}
  onEditHubComment={enrichedPlanningProps?.onEditHubComment}
  onDeleteHubComment={enrichedPlanningProps?.onDeleteHubComment}
  onAddFindingComment={(id, text) => useAnalyzeStore.getState().addFindingComment(id, text)}
  onEditFindingComment={useAnalyzeStore.getState().editFindingComment}
  onDeleteFindingComment={useAnalyzeStore.getState().deleteFindingComment}
/>
```

- [ ] **Step 5: Run PWA mapwall test and verify GREEN**

Run:

```bash
pnpm --filter @variscout/pwa test -- src/components/views/__tests__/AnalyzeView.mapwall.test.tsx
```

Expected: the new drawer seam and existing mapwall tests pass.

- [ ] **Step 6: Commit PWA mount**

Run branch guard first, then:

```bash
git add apps/pwa/src/components/views/AnalyzeView.tsx apps/pwa/src/components/views/__tests__/AnalyzeView.mapwall.test.tsx
git commit -m "feat(pwa): mount analyze wall object detail drawer"
```

## Task 4: Verification and PR

**Files:**

- Modify: `docs/superpowers/plans/2026-06-08-analyze-wall-redesign-master-plan.md`

- [ ] **Step 1: Link this sub-plan from the master plan**

Update the AW-7 row to link `2026-06-08-aw-7-object-detail-drawer.md`.

- [ ] **Step 2: Run focused test suite**

Run:

```bash
pnpm --filter @variscout/ui test -- src/components/AnalyzeWall/__tests__/ObjectDetailDrawer.test.tsx
pnpm --filter @variscout/azure-app test -- src/components/editor/__tests__/AnalyzeWorkspace.mapwall.test.tsx
pnpm --filter @variscout/pwa test -- src/components/views/__tests__/AnalyzeView.mapwall.test.tsx
```

- [ ] **Step 3: Browser smoke PWA and Azure**

Start PWA and Azure dev servers and verify `?sample=analyze-showcase` renders the Wall, selecting a cause opens the left drawer, and the drawer can be collapsed back to the handle.

- [ ] **Step 4: Run merge gate**

Run:

```bash
bash scripts/pr-ready-check.sh
```

Expected: all checks pass.

- [ ] **Step 5: Push, create PR, wait for checks, merge**

Use merge commit workflow:

```bash
git push -u origin feat/aw-7-object-detail-drawer
gh pr create --base main --head feat/aw-7-object-detail-drawer
gh pr checks <pr> --watch
gh pr merge <pr> --merge --delete-branch
```

After merge, verify the PR state is `MERGED`, delete the remote branch if needed, and remove the local worktree.
