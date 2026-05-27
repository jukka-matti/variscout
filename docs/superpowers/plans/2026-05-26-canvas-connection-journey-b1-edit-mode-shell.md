# PR-CCJ-B1 · EditModeShell + State/Edit toggle wiring — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce the Process tab Edit-mode authoring container (`EditModeShell`) as an empty 3-zone placeholder shell, relabel the existing canvas mode toggle to Spec 2 vocabulary (`Edit map` / `Done`), and gate Edit-mode entry behind `canAccess(..., 'edit')` from PR-CCJ-A2.

**Architecture:** Reuse the existing `CanvasAuthoringMode = 'author' | 'read'` infrastructure (already wired in `Canvas` + `CanvasWorkspace` + `CanvasModeToggle`). In `'author'` mode, `CanvasWorkspace` wraps the existing canvas chrome inside a new `EditModeShell` that renders 3 zone placeholders (Palette · Outcomes & Factors · Process structure). The shell's `Done` button calls the existing `onModeChange('read')`. A `canEditCanvas?: boolean` prop on `CanvasWorkspace` controls toggle visibility and forces `'read'` when access is denied (Member/Sponsor case). Azure computes the prop from active-project membership via `canAccess(userId, members, 'edit')`; PWA passes `true` (no membership model). No back-compat fallback for empty `members[]` (per `feedback_wedge_v1_no_migration_no_backcompat` — no users yet, so a project missing a Lead simply has the gate closed).

**Tech Stack:** React 18, TypeScript, Tailwind v4 semantic tokens (`bg-surface-*`, `text-content-*`, `border-edge`), Vitest + happy-dom (per `packages/charts`/`hooks`/`ui` pool tuning V2), `@variscout/core/projectMembership#canAccess` (PR-CCJ-A2).

---

## Context & invariants

- **Spec source:** `docs/superpowers/specs/2026-05-26-canvas-connection-journey-design.md` §2.3 (State/Edit split), §6 (mode integration), §7 (ACL).
- **Master plan source:** `docs/superpowers/plans/2026-05-26-canvas-connection-journey-master-plan.md` § "PR-CCJ-B1".
- **Wedge invariant — no migration/back-compat** (`feedback_wedge_v1_no_migration_no_backcompat`): no users yet. Update label defaults directly; no compatibility shim.
- **Hidden vs disabled CTA** (`feedback_hidden_vs_disabled_cta`): when a user lacks `'edit'` access, **hide** the mode toggle entirely; don't render it disabled. No back-compat fallback for empty `members[]` — per `feedback_wedge_v1_no_migration_no_backcompat`, there are no users yet; a project with no members has no Lead, and the gate stays closed.
- **Component naming** (`packages/ui/CLAUDE.md`): `EditModeShell` is the canonical primitive in `@variscout/ui` (props-based, no app logic, no store reads). App-specific membership wiring lives in each app's `FrameView`.
- **No new top-level Tailwind classes** outside the semantic tokens listed above.
- **Test fixtures** (`packages/ui/CLAUDE.md` § test fixtures): use factories like `createTestProjectMember()` if available; otherwise inline-build a `ProjectMember` literal in the test (acceptable for new types — no factory required yet by PR-WV1-1).

## File structure

**New:**

- `packages/ui/src/components/Canvas/EditMode/EditModeShell.tsx` — props-only shell with header (title + `Done`) and 3 zone placeholders; renders `children` in the right zone for B2+ canvas embedding.
- `packages/ui/src/components/Canvas/EditMode/index.ts` — re-exports `EditModeShell` + `EditModeShellProps`.
- `packages/ui/src/components/Canvas/EditMode/__tests__/EditModeShell.test.tsx` — unit tests for shell rendering + `onDone` callback.

**Modified:**

- `packages/ui/src/components/Canvas/index.tsx` — re-export `EditModeShell` from `./EditMode`.
- `packages/ui/src/components/Canvas/CanvasWorkspace.tsx` — accept `canEditCanvas?: boolean`; in `'author'` mode AND when `canEditCanvas !== false`, wrap the canvas in `<EditModeShell>`; force `'read'` and hide toggle when `canEditCanvas === false`.
- `packages/ui/src/components/CanvasModeToggle/index.tsx` — update default labels: `Lock canvas` → `Done`, `Edit canvas` → `Edit map`. Icon defaults preserved.
- `packages/ui/src/index.ts` — verify `EditModeShell` is reachable for app consumers (if barrel re-exports the Canvas module, no extra work; otherwise add).
- `apps/azure/src/components/editor/FrameView.tsx` — derive `canEditCanvas` from active-project `members[]` + `currentUserId`; pass to `CanvasWorkspace`.
- `apps/pwa/src/components/views/FrameView.tsx` — pass `canEditCanvas={true}` (PWA has no membership model; education tier).

**Out of scope for B1** (deferred to later phases):

- Palette UI / column chips → PR-CCJ-B2.
- Outcomes / Factors / Process step authoring zones → Phase C.
- Sidebar drawers / context menus → Phase D+.
- ACL gating for `'edit-contributions'` actions (findings, notes) — that's covered by per-surface gates in IPDetail (PR-WV1-1), not by the canvas toggle.

---

## Task 1: Relabel `CanvasModeToggle` to Spec 2 vocabulary

**Why first:** The existing toggle becomes the discoverable entry point into Edit mode. Renaming first means downstream tests (in the EditModeShell wrap-step) can match against the final copy without re-running.

**Files:**

- Modify: `packages/ui/src/components/CanvasModeToggle/index.tsx`

- [ ] **Step 1.1: Read the current toggle implementation**

Run: `cat packages/ui/src/components/CanvasModeToggle/index.tsx`
Confirm current labels are `Lock canvas` (when in author) / `Edit canvas` (when in read), and announcements are `Canvas authoring affordances visible/hidden`.

- [ ] **Step 1.2: Locate existing tests for `CanvasModeToggle`**

Run: `find packages/ui/src -path '*CanvasModeToggle*' -name '*.test.tsx' -o -path '*CanvasModeToggle*' -name '*.test.ts'`

If a test file exists, the renaming task must update its expected strings; if no file exists, proceed without adding one (B1 covers the integration test at the Canvas/Workspace layer).

- [ ] **Step 1.3: Update the label + announcement strings**

Edit `packages/ui/src/components/CanvasModeToggle/index.tsx`:

```typescript
import { Lock, Unlock } from 'lucide-react';
import type { CanvasAuthoringMode } from '../Canvas';

export interface CanvasModeToggleProps {
  mode: CanvasAuthoringMode;
  onChange: (next: CanvasAuthoringMode) => void;
  disabled?: boolean;
}

export function CanvasModeToggle({ mode, onChange, disabled }: CanvasModeToggleProps) {
  const isAuthor = mode === 'author';
  const Icon = isAuthor ? Unlock : Lock;
  const nextMode: CanvasAuthoringMode = isAuthor ? 'read' : 'author';
  const label = isAuthor ? 'Done' : 'Edit map';
  const announcement = isAuthor
    ? 'Edit mode active'
    : 'State mode active';

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={label}
        aria-pressed={isAuthor}
        disabled={disabled}
        onClick={() => onChange(nextMode)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-edge bg-surface-primary text-content-secondary transition-colors hover:bg-surface-tertiary hover:text-content disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Icon aria-hidden="true" size={16} />
      </button>
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}
```

- [ ] **Step 1.4: Search for callers depending on the old strings**

Run: `git grep -nE 'Lock canvas|Edit canvas|Canvas authoring affordances' -- 'packages' 'apps'`
Expected: zero matches in product code. If any match exists (e.g., in tests that aren't `CanvasModeToggle.test.tsx`), update them to the new strings. Document any non-test caller you find as a NEEDS_CONTEXT escalation.

- [ ] **Step 1.5: Run the ui package tests + build**

Run: `pnpm --filter @variscout/ui test -- --run CanvasModeToggle && pnpm --filter @variscout/ui build`
Expected: tests PASS; build PASS.

- [ ] **Step 1.6: Commit**

```bash
git add packages/ui/src/components/CanvasModeToggle/index.tsx
git commit -m "refactor(ui): rename CanvasModeToggle labels to Spec 2 vocabulary (Edit map / Done)"
```

---

## Task 2: Create `EditModeShell` primitive (empty placeholder zones)

**Files:**

- Create: `packages/ui/src/components/Canvas/EditMode/EditModeShell.tsx`
- Create: `packages/ui/src/components/Canvas/EditMode/index.ts`
- Create: `packages/ui/src/components/Canvas/EditMode/__tests__/EditModeShell.test.tsx`

- [ ] **Step 2.1: Write the failing tests for `EditModeShell`**

Create `packages/ui/src/components/Canvas/EditMode/__tests__/EditModeShell.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditModeShell } from '../EditModeShell';

describe('EditModeShell', () => {
  it('renders the three zone placeholders by name', () => {
    render(
      <EditModeShell onDone={() => undefined}>
        <div data-testid="canvas-slot">canvas</div>
      </EditModeShell>
    );
    expect(screen.getByTestId('edit-mode-shell')).toBeInTheDocument();
    expect(screen.getByTestId('edit-mode-zone-palette')).toBeInTheDocument();
    expect(screen.getByTestId('edit-mode-zone-outcomes-factors')).toBeInTheDocument();
    expect(screen.getByTestId('edit-mode-zone-process')).toBeInTheDocument();
  });

  it('renders provided children inside the process zone', () => {
    render(
      <EditModeShell onDone={() => undefined}>
        <div data-testid="canvas-slot">canvas</div>
      </EditModeShell>
    );
    const processZone = screen.getByTestId('edit-mode-zone-process');
    expect(processZone).toContainElement(screen.getByTestId('canvas-slot'));
  });

  it('exposes a Done button that calls onDone when clicked', () => {
    const onDone = vi.fn();
    render(
      <EditModeShell onDone={onDone}>
        <div>canvas</div>
      </EditModeShell>
    );
    const doneButton = screen.getByRole('button', { name: 'Done' });
    fireEvent.click(doneButton);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('renders the Edit map header title', () => {
    render(
      <EditModeShell onDone={() => undefined}>
        <div>canvas</div>
      </EditModeShell>
    );
    expect(screen.getByText('Edit map')).toBeInTheDocument();
  });

  it('labels palette and outcomes-factors zones as B2/C-phase placeholders', () => {
    render(
      <EditModeShell onDone={() => undefined}>
        <div>canvas</div>
      </EditModeShell>
    );
    expect(screen.getByTestId('edit-mode-zone-palette')).toHaveTextContent(/Palette/);
    expect(screen.getByTestId('edit-mode-zone-outcomes-factors')).toHaveTextContent(
      /Outcomes.*Factors/
    );
  });
});
```

- [ ] **Step 2.2: Run the test to verify it fails**

Run: `pnpm --filter @variscout/ui test -- --run EditModeShell`
Expected: FAIL with `Cannot find module '../EditModeShell'`.

- [ ] **Step 2.3: Implement `EditModeShell`**

Create `packages/ui/src/components/Canvas/EditMode/EditModeShell.tsx`:

```typescript
import React from 'react';

export interface EditModeShellProps {
  /** Called when the user clicks Done to exit Edit mode (returns to State mode). */
  onDone: () => void;
  /** Process-structure zone content. In B1 this receives the existing canvas chrome
   *  (StructuralToolbar + ProcessMapBase via Canvas/CanvasWorkspace). C3 will replace
   *  it with the dedicated process-zone authoring surface. */
  children: React.ReactNode;
}

export const EditModeShell: React.FC<EditModeShellProps> = ({ onDone, children }) => {
  return (
    <section
      data-testid="edit-mode-shell"
      className="flex min-h-0 flex-1 flex-col"
      aria-label="Edit mode"
    >
      <header className="flex items-center justify-between border-b border-edge bg-surface-secondary px-4 py-2">
        <div className="flex flex-col">
          <h2 className="text-sm font-semibold text-content">Edit map</h2>
          <p className="text-xs text-content-secondary">
            Connect your data to the process structure.
          </p>
        </div>
        <button
          type="button"
          onClick={onDone}
          className="rounded-md border border-edge bg-surface-primary px-3 py-1.5 text-xs font-medium text-content hover:bg-surface-tertiary"
        >
          Done
        </button>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 md:grid-cols-[14rem_18rem_minmax(0,1fr)]">
        <aside
          data-testid="edit-mode-zone-palette"
          className="flex flex-col rounded-md border border-dashed border-edge bg-surface-primary p-3"
          aria-label="Palette zone"
        >
          <h3 className="text-xs font-semibold uppercase tracking-wide text-content-tertiary">
            Palette
          </h3>
          <p className="mt-2 text-xs text-content-secondary">
            Column chips arrive in B2.
          </p>
        </aside>

        <aside
          data-testid="edit-mode-zone-outcomes-factors"
          className="flex flex-col rounded-md border border-dashed border-edge bg-surface-primary p-3"
          aria-label="Outcomes and Factors zone"
        >
          <h3 className="text-xs font-semibold uppercase tracking-wide text-content-tertiary">
            Outcomes &amp; Factors
          </h3>
          <p className="mt-2 text-xs text-content-secondary">
            Outcome and factor zones arrive in Phase C.
          </p>
        </aside>

        <section
          data-testid="edit-mode-zone-process"
          className="flex min-h-0 flex-col rounded-md border border-edge bg-surface-primary"
          aria-label="Process structure zone"
        >
          {children}
        </section>
      </div>
    </section>
  );
};

export default EditModeShell;
```

- [ ] **Step 2.4: Create the barrel export**

Create `packages/ui/src/components/Canvas/EditMode/index.ts`:

```typescript
export { EditModeShell } from './EditModeShell';
export type { EditModeShellProps } from './EditModeShell';
```

- [ ] **Step 2.5: Run the tests to verify they pass**

Run: `pnpm --filter @variscout/ui test -- --run EditModeShell`
Expected: PASS — 5 tests green.

- [ ] **Step 2.6: Confirm the ui package builds cleanly**

Run: `pnpm --filter @variscout/ui build`
Expected: tsc PASS (catches type drift per `feedback_ui_build_before_merge`).

- [ ] **Step 2.7: Commit**

```bash
git add packages/ui/src/components/Canvas/EditMode/
git commit -m "feat(ui): add EditModeShell — Process tab Edit-mode authoring container with 3 placeholder zones"
```

---

## Task 3: Re-export `EditModeShell` from `Canvas` barrel

**Files:**

- Modify: `packages/ui/src/components/Canvas/index.tsx`

- [ ] **Step 3.1: Add the re-export**

In `packages/ui/src/components/Canvas/index.tsx`, after the existing `export type { CanvasAuthoringMode, CanvasL3Archetype } from './internal/CanvasLevelRouter';` (currently line 93), add:

```typescript
export { EditModeShell } from './EditMode';
export type { EditModeShellProps } from './EditMode';
```

- [ ] **Step 3.2: Run ui build to confirm the barrel resolves**

Run: `pnpm --filter @variscout/ui build`
Expected: PASS.

- [ ] **Step 3.3: Confirm consumers can resolve `EditModeShell` from `@variscout/ui`**

Run: `git grep -n "from '@variscout/ui/Canvas'" -- 'apps' 'packages'`
If consumers import from `@variscout/ui/Canvas` (sub-path export), check `packages/ui/package.json#exports` for a `./Canvas` entry. If absent, ensure the import path used by `EditModeShell` consumers is `'@variscout/ui'` (top-level barrel) — verify by spot-checking how `CanvasWorkspace` is imported in apps:

Run: `git grep -nE "import \\{[^}]*CanvasWorkspace" -- 'apps'`
Expected: `import { CanvasWorkspace, ... } from '@variscout/ui';` — confirms top-level barrel pattern. EditModeShell consumers will follow the same.

If the top-level barrel `packages/ui/src/index.ts` doesn't already re-export the Canvas subdir, add the EditModeShell export there too:

```typescript
export { CanvasWorkspace, EditModeShell } from './components/Canvas';
export type { EditModeShellProps } from './components/Canvas';
```

(Only add the lines that are missing — don't duplicate existing exports.)

- [ ] **Step 3.4: Commit**

```bash
git add packages/ui/src/components/Canvas/index.tsx packages/ui/src/index.ts
git commit -m "feat(ui): re-export EditModeShell from Canvas barrel + top-level ui index"
```

---

## Task 4: Wire `EditModeShell` into `CanvasWorkspace` with `canEditCanvas` gate

**Files:**

- Modify: `packages/ui/src/components/Canvas/CanvasWorkspace.tsx`

- [ ] **Step 4.1: Write the failing tests for the workspace wiring**

Locate the existing `CanvasWorkspace.test.tsx` (if any) or create a new test file at `packages/ui/src/components/Canvas/__tests__/CanvasWorkspaceEditModeShell.test.tsx`.

Run: `find packages/ui/src/components/Canvas -name '*.test.tsx' | xargs grep -l CanvasWorkspace 2>/dev/null`

If a workspace test exists, add the new cases inside it (preserve the existing test setup helpers). Otherwise, create a focused new test file:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CanvasWorkspace } from '../CanvasWorkspace';

// Minimal props builder — keep fixtures local; CanvasWorkspace touches many subsystems
// so we mock only what's needed for shell visibility logic.
function renderWorkspace(overrides: Partial<React.ComponentProps<typeof CanvasWorkspace>> = {}) {
  const setProcessContext = vi.fn();
  return render(
    <CanvasWorkspace
      rawData={[{ Y: 1 }, { Y: 2 }, { Y: 3 }]}
      outcome={null}
      factors={[]}
      measureSpecs={{}}
      processContext={null}
      setOutcome={vi.fn()}
      setFactors={vi.fn()}
      setMeasureSpec={vi.fn()}
      setProcessContext={setProcessContext}
      onSeeData={vi.fn()}
      {...overrides}
    />
  );
}

describe('CanvasWorkspace · EditModeShell wiring', () => {
  it('renders EditModeShell when in author mode and canEditCanvas is undefined (default permissive)', () => {
    renderWorkspace();
    // Empty map auto-defaults to author per existing CanvasWorkspace logic.
    expect(screen.getByTestId('edit-mode-shell')).toBeInTheDocument();
  });

  it('hides EditModeShell when canEditCanvas is false', () => {
    renderWorkspace({ canEditCanvas: false });
    expect(screen.queryByTestId('edit-mode-shell')).not.toBeInTheDocument();
  });

  it('hides the mode toggle when canEditCanvas is false', () => {
    renderWorkspace({ canEditCanvas: false });
    expect(screen.queryByRole('button', { name: 'Edit map' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Done' })).not.toBeInTheDocument();
  });

  it('clicking Done in the shell switches to read mode and hides the shell', () => {
    renderWorkspace();
    const doneButton = screen.getByRole('button', { name: 'Done' });
    fireEvent.click(doneButton);
    expect(screen.queryByTestId('edit-mode-shell')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 4.2: Run the new tests to verify they fail**

Run: `pnpm --filter @variscout/ui test -- --run CanvasWorkspaceEditModeShell`
Expected: FAIL — `canEditCanvas` prop unknown; `edit-mode-shell` testid not found.

- [ ] **Step 4.3: Add the `canEditCanvas` prop and shell wrapping in `CanvasWorkspace.tsx`**

At the props interface (`CanvasWorkspaceProps`, around line 52–90), add:

```typescript
/** When false, hides the Edit/State toggle and forces State mode.
 *  When undefined or true, the toggle is shown and Edit mode is reachable.
 *  Azure derives this from canAccess(currentUserId, members, 'edit');
 *  PWA passes true (no membership model). */
canEditCanvas?: boolean;
```

In the component destructuring (around line 188–221), add `canEditCanvas` after `actionItems = []`.

Locate the existing `authoringMode` state (around line 458):

```typescript
const [authoringMode, setAuthoringMode] = React.useState<CanvasAuthoringMode>(() =>
  map.nodes.length > 0 && chips.length === 0 ? 'read' : 'author'
);
```

Replace with:

```typescript
const [authoringMode, setAuthoringMode] = React.useState<CanvasAuthoringMode>(() =>
  map.nodes.length > 0 && chips.length === 0 ? 'read' : 'author'
);

// When access is revoked at runtime, snap back to State mode so the user
// is never stranded in Edit mode without the Done affordance.
React.useEffect(() => {
  if (canEditCanvas === false && authoringMode === 'author') {
    setAuthoringMode('read');
  }
}, [authoringMode, canEditCanvas]);

const effectiveAuthoringMode: CanvasAuthoringMode =
  canEditCanvas === false ? 'read' : authoringMode;
const handleAuthoringModeChange = React.useCallback(
  (next: CanvasAuthoringMode) => {
    if (canEditCanvas === false) return;
    setAuthoringMode(next);
  },
  [canEditCanvas]
);
```

Update `l3Archetype` derivation (line 461) to use `effectiveAuthoringMode`:

```typescript
const l3Archetype: CanvasL3Archetype = effectiveAuthoringMode === 'author' ? 'b1' : 'b0';
```

In the `<Canvas>` JSX (around line 609–611), change:

```typescript
mode = { authoringMode };
l3Archetype = { l3Archetype };
onModeChange = { setAuthoringMode };
```

to:

```typescript
mode={effectiveAuthoringMode}
l3Archetype={l3Archetype}
onModeChange={canEditCanvas === false ? undefined : handleAuthoringModeChange}
```

(Setting `onModeChange={undefined}` causes the `Canvas` chrome to hide `CanvasModeToggle` per its existing guard at line 591: `{onModeChange ? <CanvasModeToggle ... /> : null}`. That's the no-permission path.)

- [ ] **Step 4.4: Wrap the canvas in `EditModeShell` when in author mode**

Find the final `return` block (around line 650–660 in the original file, the `else` branch that renders the b1 wrapper):

```typescript
return (
  <div className="flex-1 overflow-auto" data-testid="frame-view">
    <div className="mx-auto max-w-6xl">
      <header className="px-4 pt-4">
        <h2 className="text-lg font-semibold text-content">{t('frame.b1.heading')}</h2>
        <p className="text-sm text-content-secondary">{t('frame.b1.description')}</p>
      </header>
      {canvasNode}
    </div>
  </div>
);
```

Replace with:

```typescript
const handleShellDone = React.useCallback(() => {
  if (canEditCanvas === false) return;
  setAuthoringMode('read');
}, [canEditCanvas]);

const showEditShell = effectiveAuthoringMode === 'author' && canEditCanvas !== false;

return (
  <div className="flex-1 overflow-auto" data-testid="frame-view">
    <div className="mx-auto max-w-6xl">
      <header className="px-4 pt-4">
        <h2 className="text-lg font-semibold text-content">{t('frame.b1.heading')}</h2>
        <p className="text-sm text-content-secondary">{t('frame.b1.description')}</p>
      </header>
      {showEditShell ? (
        <EditModeShell onDone={handleShellDone}>{canvasNode}</EditModeShell>
      ) : (
        canvasNode
      )}
    </div>
  </div>
);
```

Add the import at the top of the file (after the existing `import { Canvas, type CanvasAuthoringMode, type CanvasL3Archetype } from './index';` on line 34):

```typescript
import { EditModeShell } from './EditMode';
```

(Use the local `./EditMode` path inside the same package, not the `@variscout/ui` barrel — that would be a circular reference.)

- [ ] **Step 4.5: Run the new tests to verify they pass**

Run: `pnpm --filter @variscout/ui test -- --run CanvasWorkspaceEditModeShell`
Expected: PASS — 4 tests green.

- [ ] **Step 4.6: Run the full ui test suite to catch regressions**

Run: `pnpm --filter @variscout/ui test`
Expected: full PASS. If any existing `CanvasWorkspace` test now sees `edit-mode-shell` in its output, update the assertion to be tolerant (existing tests may not have anticipated the shell wrapper).

If existing tests fail, fix them by either:

- Updating the assertion to `expect(within(screen.getByTestId('edit-mode-zone-process')).getByTestId('layered-process-view')).toBeInTheDocument()` for tests that previously queried `layered-process-view` directly, OR
- Passing `canEditCanvas={false}` in the test props to suppress the shell when the test isn't about Edit mode.

Pick the option that preserves the original test intent.

- [ ] **Step 4.7: Confirm the ui package builds**

Run: `pnpm --filter @variscout/ui build`
Expected: PASS.

- [ ] **Step 4.8: Commit**

```bash
git add packages/ui/src/components/Canvas/CanvasWorkspace.tsx packages/ui/src/components/Canvas/__tests__/CanvasWorkspaceEditModeShell.test.tsx
git commit -m "feat(ui): CanvasWorkspace wraps canvas in EditModeShell when author mode + canEditCanvas gate"
```

---

## Task 5: Wire `canEditCanvas` in Azure (Editor.tsx → FrameView prop)

**Why this shape:** Azure's `FrameView` is currently a zero-prop component (rendered as `<FrameView />` from `Editor.tsx:1851`). The active-project membership context (`activeIPContext.activeIP.metadata.members`) and `currentUser?.email` live in `Editor.tsx` (see lines 565–585). The cleanest path is to compute `canEditCanvas` in `Editor.tsx` where the data already exists, and pass it as a new prop to `FrameView`. This avoids duplicating the active-IP discovery logic.

**Files:**

- Modify: `apps/azure/src/components/editor/FrameView.tsx` — add `canEditCanvas?: boolean` prop, thread to `CanvasWorkspace`.
- Modify: `apps/azure/src/pages/Editor.tsx` — compute `canEditCanvas` from `activeIPContext.activeIP.metadata.members` + `currentUser?.email`; pass to `<FrameView>`.

- [ ] **Step 5.1: Add the `canEditCanvas` prop to FrameView**

In `apps/azure/src/components/editor/FrameView.tsx`:

Change the component signature from:

```typescript
const FrameView: React.FC = () => {
```

to:

```typescript
interface FrameViewProps {
  /** Lead-only Edit mode gate. Computed in Editor.tsx from canAccess(currentUserId, members, 'edit').
   *  When omitted, the workspace defaults to permissive (used by tests + non-membership callers like PWA). */
  canEditCanvas?: boolean;
}

const FrameView: React.FC<FrameViewProps> = ({ canEditCanvas }) => {
```

Thread the prop into the `<CanvasWorkspace>` call site (around line 327):

```typescript
<CanvasWorkspace
  rawData={rawData}
  // ... existing props unchanged ...
  canEditCanvas={canEditCanvas}
  actionItems={actionItems}
/>
```

Place `canEditCanvas={canEditCanvas}` immediately above `actionItems={actionItems}` for diff readability.

- [ ] **Step 5.2: Compute `canEditCanvas` in Editor.tsx and pass to FrameView**

In `apps/azure/src/pages/Editor.tsx`, add the import (alongside other `@variscout/core` imports near the top):

```typescript
import { canAccess } from '@variscout/core/projectMembership';
```

Locate `activeIPContext` (line 585: `const activeIPContext = useActiveIPContext(activeHub, currentUser?.email);`). Immediately after that line, add:

```typescript
const canEditCanvas = React.useMemo(() => {
  const userId = currentUser?.email;
  if (!userId) return false; // Pre-auth (user still loading) — gate is closed.
  const members = activeIPContext.activeIP?.metadata.members ?? [];
  // Wedge V1: no back-compat fallback. An empty members[] has no Lead, so canAccess
  // returns false and the gate stays closed (per feedback_wedge_v1_no_migration_no_backcompat).
  return canAccess(userId, members, 'edit');
}, [activeIPContext.activeIP, currentUser?.email]);
```

Update the `<FrameView />` render site (line 1851) to:

```typescript
<FrameView canEditCanvas={canEditCanvas} />
```

- [ ] **Step 5.3: Run azure-app tests + build**

Run: `pnpm --filter @variscout/azure-app test`
Run: `pnpm --filter @variscout/azure-app build`
Expected: PASS.

If existing `FrameView` tests instantiate `<FrameView />` directly (zero-prop), they continue to work because `canEditCanvas` is optional (`undefined` → permissive default per Task 4). Verify by grepping `git grep -n "<FrameView" apps/azure/src/` — there should be exactly two callers: `Editor.tsx:1851` (updated) and any FrameView test file. Update test renders only if a test explicitly asserts on the canEditCanvas-gated UI.

- [ ] **Step 5.4: Commit**

```bash
git add apps/azure/src/components/editor/FrameView.tsx apps/azure/src/pages/Editor.tsx
git commit -m "feat(azure-app): gate CanvasWorkspace Edit mode behind canAccess(..., 'edit') in Editor.tsx"
```

---

## Task 6: Pass `canEditCanvas={true}` in PWA FrameView

**Why explicit:** PWA has no membership model (`apps/pwa/CLAUDE.md` — session-only, education tier). Passing the prop explicitly documents the intent and prevents future drift if the default flips.

**Files:**

- Modify: `apps/pwa/src/components/views/FrameView.tsx`

- [ ] **Step 6.1: Add the explicit prop**

In `apps/pwa/src/components/views/FrameView.tsx` (around line 347), add `canEditCanvas={true}`:

```typescript
<CanvasWorkspace
  canvasViewportHubId={canvasViewportHubId}
  // ... existing props ...
  canEditCanvas={true}
  actionItems={actionItems}
/>
```

Add an inline rationale comment immediately above the prop:

```typescript
// PWA has no project-membership model (education tier per apps/pwa/CLAUDE.md);
// Edit mode is always reachable. Azure derives this from canAccess(..., 'edit').
canEditCanvas={true}
```

- [ ] **Step 6.2: Run pwa tests + build**

Run: `pnpm --filter @variscout/pwa test`
Run: `pnpm --filter @variscout/pwa build`
Expected: PASS.

- [ ] **Step 6.3: Commit**

```bash
git add apps/pwa/src/components/views/FrameView.tsx
git commit -m "feat(pwa): pass canEditCanvas={true} explicitly (no membership model in education tier)"
```

---

## Task 7: Final integration sweep

**Files:** none new — verification only.

- [ ] **Step 7.1: Repo-wide build**

Run: `pnpm build`
Expected: all packages + apps build clean. tsc surfaces any cross-package type mismatch missed by per-package tests (per `feedback_ui_build_before_merge`).

- [ ] **Step 7.2: Repo-wide test**

Run: `pnpm test`
Expected: all packages green. If anything fails, root-cause it — do not skip or quarantine.

- [ ] **Step 7.3: Verify the new tests run**

Run: `pnpm --filter @variscout/ui test -- --run EditModeShell CanvasModeToggle CanvasWorkspaceEditModeShell`
Expected: all three suites green.

- [ ] **Step 7.4: Search for orphan references to the old toggle copy**

Run: `git grep -nE "Lock canvas|Edit canvas|Canvas authoring affordances visible|Canvas authoring affordances hidden" -- 'packages' 'apps' 'docs'`
Expected: zero matches in product code. Doc matches are fine if they're historical (`docs/archive/**`, ADR descriptions); flag any active doc that uses the old copy and update if it's a canonical anchor (`docs/02-journeys/**`, `docs/03-features/**`).

- [ ] **Step 7.5: Confirm the wedge `feedback_no_backcompat_clean_architecture` pattern**

Verify that:

- No compatibility shim was added for the old toggle labels.
- No `canEditCanvas` default flips to `false` anywhere (default is `undefined`, which preserves the open path).
- No new feature flag was introduced (`canEditCanvas` is the gate, not a flag).

- [ ] **Step 7.6: Run pr-ready-check (controller-level)**

Run: `bash scripts/pr-ready-check.sh`
Expected: green. If it hangs (per `feedback_pr_ready_check_vitest_hang`), bisect to the specific package; the EditMode tests should not introduce a new hang since they don't import from `Canvas.test.tsx` (the previously-quarantined file).

---

## Verification (final acceptance)

After all 6 task commits land on the branch:

1. **Toggle vocabulary**: `git grep -n "Edit map" packages/ui/src/components/CanvasModeToggle/index.tsx` returns the new label; the old `Lock canvas` / `Edit canvas` strings are gone from product code.

2. **Shell visibility logic**:
   - In Azure with a Lead user: clicking the canvas toggle enters Edit mode, `EditModeShell` renders with 3 zones + `Done`. Clicking `Done` returns to State mode (existing L1/L2/L3 views).
   - In Azure with a Member/Sponsor user (members present, role ≠ `'lead'`): the toggle is hidden; the canvas renders in `'read'` mode with no Edit affordance.
   - In Azure with no current user or an IP missing a Lead in `members[]`: the toggle is hidden (gate stays closed per wedge no-back-compat).
   - In PWA: the toggle is visible (no membership model); shell behaves identically to the Azure-Lead path.

3. **Shell content**: the empty placeholders for Palette + Outcomes&Factors render with the B2/Phase C placeholder copy. The Process zone embeds the existing canvas chrome (StructuralToolbar + ProcessMapBase via `Canvas`).

4. **No regression**: all existing `Canvas` / `CanvasWorkspace` tests pass. The b0 path (`scope === 'b0'`) is unchanged.

5. **No backwards-compat**: there is no "Edit mode V2" feature flag, no `migrateAuthoringMode()` helper, no fallback to the old label strings. Direct cutover per `feedback_wedge_v1_no_migration_no_backcompat`.

## Out of scope — explicitly deferred

- Column chips / palette content → PR-CCJ-B2 (next sub-plan; bundled with this PR per per-phase bundling decision OR split per `feedback_slice_size_cap` — orchestrator decides at execution time).
- Outcome chips, specs popover, factor zones, process-step authoring → Phase C (PR-CCJ-C1, C2, C3).
- Time-as-factors, calc workflow → Phase D.
- Charter modal + 5 entry points → Phase E (PR-CCJ-E1).
- Updating `docs/02-journeys/ia-nav-model.md` or `docs/USER-JOURNEYS.md` Edit-mode copy — Phase B is empty shell only; journey docs update when functional zones land (Phase C+).
- ADR for `canEditCanvas` prop — the prop is a one-line API surface gated by an existing decision (PR-CCJ-A2's `canAccess` + ADR-082); no new ADR required.

---

## Self-review

**Spec coverage** (against `docs/superpowers/specs/2026-05-26-canvas-connection-journey-design.md`):

- §2.3 State/Edit mode split → Tasks 2 + 4 (shell + workspace wiring).
- §6 Edit configures what State renders → Tasks 2 + 4 (shell wraps the canvas; toggle uses existing `onModeChange` → existing L1/L2/L3 surface).
- §7 ACL — Lead-only Edit access → Tasks 4 + 5 (`canEditCanvas` prop + Azure `canAccess('edit')` wiring).
- §2.3 entry/exit copy: `Edit map` + `Done` → Task 1.
- §5 Hub creation note "first paint defaults to Edit mode" → Task 4 (preserves existing `map.nodes.length > 0 && chips.length === 0 ? 'read' : 'author'` default).

**Placeholder scan:** all steps include concrete code or concrete commands; no `TBD` / `TODO` / "add appropriate error handling". The B2/Phase C placeholders inside `EditModeShell` are intentional product copy ("Column chips arrive in B2"), not plan placeholders.

**Type consistency:** `canEditCanvas?: boolean` is the single new prop, threaded identically through `CanvasWorkspace` (declaration + use) and both `FrameView` callers. `EditModeShellProps { onDone, children }` matches between the component, the barrel, and the workspace consumer.

**Decisions to verify at execution time** (escalate as NEEDS_CONTEXT if blocked):

1. Existing `useActiveIPContext` / `useCurrentUser` accessor names in `apps/azure/src/` — Task 5.1 confirms via grep before editing.
2. Whether `packages/ui/src/index.ts` already re-exports the Canvas subdir — Task 3.3 confirms via grep.
3. Whether `CanvasWorkspace.test.tsx` exists and if so, where — Task 4.1 chooses between extending an existing file vs creating a new focused one.
