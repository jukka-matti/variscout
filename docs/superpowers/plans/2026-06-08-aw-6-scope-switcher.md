# AW-6 Scope Switcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reframe the Analyze Wall scope UI from a broad rail/trail into a compact current-scope + flat sibling switcher, with PWA and Azure parity.

**Architecture:** Keep scope state in `useAnalyzeStore` and transient drill filters in `useAnalysisScopeStore`; do not add lineage recursion or new persisted scope metadata. `@variscout/ui` owns the shared switcher presentation, while each app derives active sibling scopes and rewrites categorical drill filters when the user switches scope.

**Tech Stack:** React + TypeScript, Zustand stores, `@variscout/core` condition helpers, Vitest + RTL, Tailwind v4.

---

## Grounding

- Master plan: `docs/superpowers/plans/2026-06-08-analyze-wall-redesign-master-plan.md` → AW-6.
- Canonical spec: `docs/superpowers/specs/2026-06-08-analyze-wall-redesign-design.md` §7.5.
- Current state:
  - Azure already derives `railScopes`, `activeScope`, `handleScopeSelect`, and `handleScopeArchive` in `apps/azure/src/components/editor/AnalyzeWorkspace.tsx`.
  - PWA derives `activeScope` but does not derive sibling scopes, does not mount `ScopeRail`, and passes `scopeBranchCount={0}` to `OverallProblemHeader`.
  - `packages/ui/src/components/AnalyzeWall/ScopeRail.tsx` is still named and documented as a multi-scope rail/breadcrumb. It renders all chips horizontally and archive buttons, but does not make the current scope the prominent anchor/switcher.

## Acceptance

- The Wall shows the current scope prominently when one is active.
- A compact switcher lets the user switch among flat sibling scopes for the same project/outcome.
- No broad-to-narrow lineage trail language or recursive scope behavior is introduced.
- PWA and Azure both mount the shared switcher on the Wall canvas.
- Existing archive behavior remains available and soft-deletes a scope.
- Switching scope rewrites categorical drill filters so the active `ProblemConditionCard`, scoped findings, and model-builder scope label re-anchor to the selected scope.

## Files

- Modify: `packages/ui/src/components/AnalyzeWall/ScopeRail.tsx`
- Modify: `packages/ui/src/components/AnalyzeWall/__tests__/ScopeRail.test.tsx`
- Modify: `apps/azure/src/components/editor/AnalyzeWorkspace.tsx`
- Modify: `apps/azure/src/components/editor/__tests__/AnalyzeWorkspace.mapwall.test.tsx`
- Modify: `apps/pwa/src/components/views/AnalyzeView.tsx`
- Modify: `apps/pwa/src/components/views/__tests__/AnalyzeView.mapwall.test.tsx`
- Modify: `docs/superpowers/plans/2026-06-08-analyze-wall-redesign-master-plan.md`

## Task 1: Reframe the Shared Scope UI

**Files:**
- Modify: `packages/ui/src/components/AnalyzeWall/ScopeRail.tsx`
- Modify: `packages/ui/src/components/AnalyzeWall/__tests__/ScopeRail.test.tsx`

- [ ] **Step 1: Write failing UI tests for current-scope prominence**

Add tests to `ScopeRail.test.tsx` that assert:

```tsx
it('shows the active scope as the current scope anchor', () => {
  render(<ScopeRail {...makeProps({ activeScopeId: scopeB.id })} />);
  expect(screen.getByTestId('scope-current-anchor')).toHaveTextContent('Current scope');
  expect(screen.getByTestId('scope-current-anchor')).toHaveTextContent('Machine = B');
  expect(screen.getByTestId('scope-current-anchor')).toHaveTextContent('Product = X');
});

it('labels flat siblings without lineage wording', () => {
  render(<ScopeRail {...makeProps({ scopes: [scopeA, scopeB, scopeC], activeScopeId: scopeA.id })} />);
  expect(screen.getByTestId('scope-switcher')).toHaveTextContent('3 scopes');
  expect(screen.queryByText(/lineage/i)).toBeNull();
  expect(screen.queryByText(/breadcrumb/i)).toBeNull();
  expect(screen.queryByText(/parent/i)).toBeNull();
});
```

- [ ] **Step 2: Run the focused UI test and verify RED**

Run:

```bash
pnpm --filter @variscout/ui test -- src/components/AnalyzeWall/__tests__/ScopeRail.test.tsx
```

Expected: the new tests fail because `scope-current-anchor` and `scope-switcher` do not exist yet.

- [ ] **Step 3: Implement the current-scope + switcher rendering**

Update `ScopeRail.tsx` so it keeps the existing props but renders:

```tsx
const activeScope = scopes.find(scope => scope.id === activeScopeId) ?? scopes[0];
const activeConditionText = activeScope ? formatConditionLeaves(activeScope.predicates) : null;
const scopeCountLabel = `${scopes.length} scope${scopes.length === 1 ? '' : 's'}`;
```

Render a compact container with:
- `data-testid="scope-current-anchor"` for the active condition.
- `data-testid="scope-switcher"` wrapping the sibling scope buttons.
- Existing `scope-chip-${scope.id}` buttons for switching.
- Existing `scope-archive-${scope.id}` buttons for archive.

Keep the callback contract:

```tsx
onClick={() => {
  if (!isActive) onScopeSelect(scope.id);
}}
```

Use copy such as `Current scope`, `Switch scope`, and `N scopes`. Do not add lineage, breadcrumb, parent, or child wording.

- [ ] **Step 4: Run focused UI tests and verify GREEN**

Run:

```bash
pnpm --filter @variscout/ui test -- src/components/AnalyzeWall/__tests__/ScopeRail.test.tsx
```

Expected: all `ScopeRail` tests pass.

- [ ] **Step 5: Commit shared UI changes**

Branch guard first:

```bash
pwd
git rev-parse --abbrev-ref HEAD
```

Expected: `.worktrees/feat-aw-6-scope-switcher` and `feat/aw-6-scope-switcher`.

Commit:

```bash
git add packages/ui/src/components/AnalyzeWall/ScopeRail.tsx packages/ui/src/components/AnalyzeWall/__tests__/ScopeRail.test.tsx
git commit -m "feat(ui): reframe scope rail as current scope switcher"
```

## Task 2: Wire Azure to the Reframed Switcher

**Files:**
- Modify: `apps/azure/src/components/editor/AnalyzeWorkspace.tsx`
- Modify: `apps/azure/src/components/editor/__tests__/AnalyzeWorkspace.mapwall.test.tsx`

- [ ] **Step 1: Update Azure seam tests**

In the existing `AnalyzeWorkspace ScopeRail seam` describe block, update labels to AW-6 and add:

```tsx
it('renders the current scope switcher above the Wall canvas', () => {
  render(<AnalyzeWorkspace {...makeMinimalProps()} />);
  expect(screen.getByTestId('scope-current-anchor')).toHaveTextContent('Machine = B');
  expect(screen.getByTestId('scope-switcher')).toHaveTextContent('2 scopes');
});
```

Keep the existing switch and archive tests; they prove the re-anchor behavior remains load-bearing.

- [ ] **Step 2: Run the Azure focused test and verify RED/GREEN appropriately**

Run:

```bash
pnpm --filter @variscout/azure-app test -- src/components/editor/__tests__/AnalyzeWorkspace.mapwall.test.tsx
```

Expected before Task 1 implementation: fails on missing switcher test ids. Expected after Task 1: passes unless Azure mount copy/test selectors need adjustment.

- [ ] **Step 3: Rename comments/copy away from lineage rail**

In `AnalyzeWorkspace.tsx`, update only comments around the mount from "multi-scope rail" / "rail" to "current scope switcher". Keep variable names if changing them would create churn, but prefer `switcherScopes` for local aliases if the change stays small.

- [ ] **Step 4: Run Azure focused test**

Run:

```bash
pnpm --filter @variscout/azure-app test -- src/components/editor/__tests__/AnalyzeWorkspace.mapwall.test.tsx
```

Expected: all tests pass.

- [ ] **Step 5: Commit Azure wiring**

Branch guard first:

```bash
pwd
git rev-parse --abbrev-ref HEAD
```

Commit:

```bash
git add apps/azure/src/components/editor/AnalyzeWorkspace.tsx apps/azure/src/components/editor/__tests__/AnalyzeWorkspace.mapwall.test.tsx
git commit -m "feat(azure): show current scope switcher on analyze wall"
```

## Task 3: Add PWA Scope Switcher Parity

**Files:**
- Modify: `apps/pwa/src/components/views/AnalyzeView.tsx`
- Modify: `apps/pwa/src/components/views/__tests__/AnalyzeView.mapwall.test.tsx`

- [ ] **Step 1: Write failing PWA seam tests**

Add a PWA scope-switcher describe block that seeds two scopes under `projectId: 'hub-test'` and `outcome: 'Fill Weight'`, then renders:

```tsx
it('renders the current scope switcher from flat sibling scopes', () => {
  useCanvasViewportStore.getState().setViewMode('wall');
  useProjectStore.setState({ ...getProjectInitialState(), outcome: 'Fill Weight' });
  useAnalysisScopeStore.setState({ categoricalFilters: [{ column: 'Shift', values: ['Night'] }] });
  useAnalyzeStore.setState({
    ...getAnalyzeInitialState(),
    scopes: [scopeNight, scopeDay],
  });

  render(<AnalyzeView {...makeMinimalProps({ outcome: 'Fill Weight' })} />);

  expect(screen.getByTestId('scope-current-anchor')).toHaveTextContent('Shift = Night');
  expect(screen.getByTestId('scope-switcher')).toHaveTextContent('2 scopes');
  expect(screen.getByTestId('overall-problem-header')).toHaveTextContent('2 open scope branches');
});
```

Add a switching test:

```tsx
it('switching a scope rewrites categorical filters', () => {
  render(<AnalyzeView {...makeMinimalProps({ outcome: 'Fill Weight' })} />);
  fireEvent.click(screen.getByTestId('scope-chip-scope-day'));
  expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
    { column: 'Shift', values: ['Day'] },
  ]);
});
```

- [ ] **Step 2: Run the PWA focused test and verify RED**

Run:

```bash
pnpm --filter @variscout/pwa test -- src/components/views/__tests__/AnalyzeView.mapwall.test.tsx
```

Expected: fails because PWA does not mount `ScopeRail` and still passes `scopeBranchCount={0}`.

- [ ] **Step 3: Implement PWA rail scope derivation**

In `AnalyzeView.tsx`, add a `railScopes` memo analogous to Azure:

```ts
const railScopes = useMemo(
  () =>
    scopes.filter(
      scope =>
        !scope.deletedAt &&
        scope.projectId === scopeProjectId &&
        scope.outcome === outcome
    ),
  [outcome, scopes, scopeProjectId]
);
```

Add callbacks:

```ts
const handleScopeSelect = useCallback(
  (scopeId: string) => {
    const scope = scopes.find(s => s.id === scopeId);
    if (!scope) return;
    const byColumn = new Map<string, Array<string | number>>();
    for (const leaf of scope.predicates) {
      if (leaf.kind === 'leaf' && leaf.op === 'eq') {
        const values = byColumn.get(leaf.column) ?? [];
        values.push(leaf.value as string | number);
        byColumn.set(leaf.column, values);
      }
    }
    const scopeStore = useAnalysisScopeStore.getState();
    scopeStore.clearScope();
    for (const [column, values] of byColumn) {
      scopeStore.setCategoricalValues(column, values);
    }
  },
  [scopes]
);

const handleScopeArchive = useCallback((scopeId: string) => {
  useAnalyzeStore.getState().archiveScope(scopeId);
}, []);
```

- [ ] **Step 4: Mount PWA `ScopeRail` on the Wall canvas**

Import `ScopeRail` from `@variscout/ui` if it is not already imported.

Change `OverallProblemHeader`:

```tsx
scopeBranchCount={railScopes.length}
```

Inside the `wallViewMode === 'wall'` canvas shell, before floating controls:

```tsx
{!wallIsMobile && railScopes.length > 0 && (
  <div className="border-edge bg-surface-secondary/40 border-b px-3 py-2">
    <ScopeRail
      scopes={railScopes}
      activeScopeId={activeScope?.id}
      onScopeSelect={handleScopeSelect}
      onScopeArchive={handleScopeArchive}
    />
  </div>
)}
```

- [ ] **Step 5: Run PWA focused test**

Run:

```bash
pnpm --filter @variscout/pwa test -- src/components/views/__tests__/AnalyzeView.mapwall.test.tsx
```

Expected: all tests pass.

- [ ] **Step 6: Commit PWA parity**

Branch guard first:

```bash
pwd
git rev-parse --abbrev-ref HEAD
```

Commit:

```bash
git add apps/pwa/src/components/views/AnalyzeView.tsx apps/pwa/src/components/views/__tests__/AnalyzeView.mapwall.test.tsx
git commit -m "feat(pwa): add analyze wall scope switcher"
```

## Task 4: Documentation and Verification Evidence

**Files:**
- Modify: `docs/superpowers/plans/2026-06-08-analyze-wall-redesign-master-plan.md`
- Create optional screenshots after browser verification:
  - `docs/superpowers/plans/2026-06-08-aw-6-pwa-scope-switcher.png`
  - `docs/superpowers/plans/2026-06-08-aw-6-azure-scope-switcher.png`

- [ ] **Step 1: Link this plan from the master plan**

In the AW-6 row/detail of `2026-06-08-analyze-wall-redesign-master-plan.md`, add a link to `2026-06-08-aw-6-scope-switcher.md`.

- [ ] **Step 2: Run targeted tests**

Run:

```bash
pnpm --filter @variscout/ui test -- src/components/AnalyzeWall/__tests__/ScopeRail.test.tsx
pnpm --filter @variscout/azure-app test -- src/components/editor/__tests__/AnalyzeWorkspace.mapwall.test.tsx
pnpm --filter @variscout/pwa test -- src/components/views/__tests__/AnalyzeView.mapwall.test.tsx
```

Expected: all pass.

- [ ] **Step 3: Browser smoke both apps**

Start dev servers:

```bash
npm run dev -- --host 127.0.0.1
pnpm --filter @variscout/azure-app dev --host 127.0.0.1 --port 5174
```

Use browser verification against:
- `http://127.0.0.1:5173/?sample=analyze-showcase`
- `http://127.0.0.1:5174/?sample=analyze-showcase`

Expected: Analyze → Wall renders the switcher when the sample has scopes; if the sample has no active drill scopes, use test coverage as the load-bearing proof and record the smoke as Wall render parity.

- [ ] **Step 4: Run full PR gate**

Run:

```bash
bash scripts/pr-ready-check.sh
```

Expected: exit 0 and `All checks passed — PR is ready to merge.`

- [ ] **Step 5: Commit documentation / evidence**

Branch guard first:

```bash
pwd
git rev-parse --abbrev-ref HEAD
```

Commit:

```bash
git add docs/superpowers/plans/2026-06-08-analyze-wall-redesign-master-plan.md docs/superpowers/plans/2026-06-08-aw-6-scope-switcher.md docs/superpowers/plans/2026-06-08-aw-6-*.png
git commit -m "docs(plan): add AW-6 scope switcher sub-plan"
```

If no screenshots are produced because the sample lacks multiple scopes, omit the PNG path from `git add` and state that explicitly in the PR body.

## Task 5: PR and Merge

- [ ] **Step 1: Push branch**

```bash
git push -u origin feat/aw-6-scope-switcher
```

- [ ] **Step 2: Create PR**

Create a ready PR summarizing:
- shared `ScopeRail` reframed as current-scope switcher
- Azure switcher seam preserved
- PWA parity added
- targeted tests + `pr-ready-check.sh`
- browser smoke evidence or sample limitation

- [ ] **Step 3: Wait for checks**

```bash
gh pr checks <PR_NUMBER> --watch
```

- [ ] **Step 4: Merge with merge commit**

```bash
gh pr merge <PR_NUMBER> --merge --delete-branch
```

If `gh` cannot delete the local branch because the branch is checked out in the worktree, verify the PR state is `MERGED`, delete the remote branch manually if needed, then remove the worktree from repo root.

## Self-Review Checklist

- §7.5 current scope prominent: Task 1 + Task 3.
- Flat sibling switcher: Task 1 + app switch tests.
- No lineage trail: Task 1 negative copy tests.
- PWA parity: Task 3.
- Azure parity: Task 2.
- No recursion: no store/model changes; switching rewrites categorical filters only.
- Scope findings from AW-5 remain scoped because `activeScope` drives `selectFindingsForScope`.
