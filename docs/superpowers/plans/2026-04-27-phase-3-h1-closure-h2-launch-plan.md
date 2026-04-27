---
title: Phase 3 — H1 Closure + H2 Launch — Implementation Plan
status: draft
---

# Phase 3 — H1 Closure + H2 Launch — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining H1 capability (team notes on state items) and launch H2 (general Evidence Source for any CSV/Excel) in three sequenced PRs.

**Architecture:** All three PRs follow the V2 pattern: pure types + helpers in `@variscout/core`, props-based components in `@variscout/ui`, Azure-only wiring in `apps/azure`. PR #1 + PR #2 extend `ProcessHubCurrentStatePanel` with new required contracts (notes, then a refactored evidence contract). PR #3 adds a new `DataProfileDefinition` to the registry + extends `ProcessHubEvidencePanel` with profile-picker + mapping-confirmation UI.

**Tech Stack:** TypeScript • React + Vitest + RTL • Tailwind v4 • App Insights browser SDK • pnpm workspaces / Turbo

**Spec:** `docs/superpowers/specs/2026-04-27-phase-3-h1-closure-h2-launch-design.md` (commit `9adaba0c` on main)

---

## Implementation Reality Notes (read before starting)

Three concrete deviations from the spec that the implementer MUST honor — the spec sketches code at a design level; these are the actual interfaces the codebase exposes. Prefer the actual signatures over the spec's prose.

1. **`DataProfileDefinition` interface signature differs from spec.** Actual interface in `packages/core/src/evidenceSources.ts:61-68`:

   ```ts
   export interface DataProfileDefinition {
     id: string;
     version: number;
     label: string; // single 'label' field — NOT separate 'name' + 'description'
     detect(rows: DataRow[]): DataProfileDetection | null;
     validate(rows: DataRow[], mapping: Record<string, string>): EvidenceValidationResult;
     apply(rows: DataRow[], mapping: Record<string, string>): ProfileApplication;
   }
   ```

   - `detect()` takes `DataRow[]` only (no separate `headers` param — get headers from `Object.keys(rows[0])`).
   - `DataProfileDetection.confidence` is the enum `'high' | 'medium' | 'low'` (NOT a number 0-1 as the spec sketched).
   - `validate()` returns `EvidenceValidationResult = { ok: boolean; errors: string[]; warnings: string[] }` (NOT `{ valid, issues }`).
   - `apply()` returns the full `ProfileApplication = { profileId, profileVersion, mapping, validation, derivedColumns, derivedRows }` — NOT just `{ derivedRows, derivedColumns }`.
   - PR #3's `GENERIC_TABULAR_PROFILE` MUST conform to the actual interface. See Task PR #3 / Task 2 below for the correct skeleton.

2. **`EvidenceCadence` enum values:** `'manual' | 'hourly' | 'shiftly' | 'daily' | 'weekly'` (defined at `packages/core/src/evidenceSources.ts:3`). The spec mentioned a `'monthly'` cadence; that does NOT exist in the type. PR #3's cadence selector uses the existing 5 values. If `'monthly'` is genuinely needed, that's a separate type-extension PR — out of scope.

3. **Spec→plan back-link in the spec file uses plain-text path** (`docs/superpowers/plans/2026-04-27-phase-3-h1-closure-h2-launch-plan.md`) because at spec-write time the plan file did not exist (cross-ref check would fail). Once this plan file is committed to the same branch as a spec edit, the spec can be updated to use Markdown link syntax. **Last task of PR #1** includes that spec update.

---

## File Map

### PR #1 — Team notes (~250-350 LOC)

**Create:**

- `packages/core/src/processStateNote.ts` — `ProcessStateNote` interface + `ProcessStateNoteKind` type + `PROCESS_STATE_NOTE_KINDS` const + helper.
- `packages/core/src/__tests__/processStateNote.test.ts` — ~5 tests.
- `apps/azure/src/components/StateItemNotesDrawer.tsx` — inline drawer component (~150 LOC).
- `apps/azure/src/components/__tests__/StateItemNotesDrawer.test.tsx` — ~7 RTL tests.

**Modify:**

- `packages/core/src/processHub.ts:65-87` — extend `ProcessHubInvestigationMetadata` with `stateNotes?: ProcessStateNote[]`.
- `packages/core/src/index.ts` — export `ProcessStateNote`, `ProcessStateNoteKind`, `PROCESS_STATE_NOTE_KINDS`.
- `packages/ui/src/components/ProcessHubCurrentStatePanel/ProcessHubCurrentStatePanel.tsx` — add required `notes` prop with new `ProcessHubNotesContract`; render `[+ note]` affordance + notes list under each card.
- `packages/ui/src/components/ProcessHubCurrentStatePanel/__tests__/ProcessHubCurrentStatePanel.test.tsx` — extend `makeNotes()` helper + ~5 new note-behavior tests + rewire 20 existing tests to pass `notes={makeNotes()}`.
- `apps/azure/src/components/ProcessHubReviewPanel.tsx` — add `onAddNote/onEditNote/onDeleteNote/currentUserId` prop pass-through; build `notesFor()` from `rollup.investigations[*].metadata.stateNotes`.
- `apps/azure/src/pages/Dashboard.tsx` — wire `handleAddNote/handleEditNote/handleDeleteNote` via `loadProject → mutate → saveProject` chain with `safeTrackEvent`.
- `apps/azure/src/components/__tests__/Dashboard.processHub.test.tsx` — extend with note-flow integration tests (find existing file).
- `docs/superpowers/specs/2026-04-27-phase-3-h1-closure-h2-launch-design.md` — convert spec→plan back-link from plain-text to real Markdown link (last commit of PR #1).

### PR #2 — Full EvidenceSheet (~300-400 LOC)

**Create:**

- `apps/azure/src/components/EvidenceSheet.tsx` — bottom sheet (~120 LOC).
- `apps/azure/src/components/__tests__/EvidenceSheet.test.tsx` — ~6 tests.

**Modify:**

- `packages/ui/src/components/ProcessHubCurrentStatePanel/ProcessHubCurrentStatePanel.tsx` — refactor `ProcessHubEvidenceContract` to `{ countFor, loadFindingsFor, onChipClick, onFindingSelect }`. Remove the `findings: readonly Finding[]` parameter from chip render path; chip uses `countFor` synchronously.
- `packages/ui/src/components/ProcessHubCurrentStatePanel/__tests__/ProcessHubCurrentStatePanel.test.tsx` — rewire all 20 tests' `makeEvidence()` helper for the new contract; add ~3 new tests for the count vs load split.
- `apps/azure/src/components/ProcessHubReviewPanel.tsx` — REPLACE the synthetic-Finding `findingsFor` (lines 105-127 of current file) with the new contract:
  - `countFor(item)` derives the count from `findingCounts` (same arithmetic, no synthetic objects).
  - `loadFindingsFor(item)` async-loads via `useStorage().loadProject()` for each linked investigation, runs them through `linkFindingsToStateItems`, returns real `Finding[]`.
  - `onChipClick(item)` and `onFindingSelect(item, finding)` replace the old sync `handleChipClick`.
- `apps/azure/src/pages/Dashboard.tsx` — manage `sheetState`; render `<EvidenceSheet>`; navigate on `onFindingSelect` to `/editor/:investigationId#finding-:findingId` (use existing `onOpenProject` plus URL hash).
- `apps/azure/src/components/__tests__/Dashboard.processHub.test.tsx` — extend with sheet open + finding-select tests.

### PR #3 — General Evidence Source (~600-800 LOC)

**Create:**

- `packages/core/src/__tests__/evidenceSources.generic.test.ts` — ~8 tests for `GENERIC_TABULAR_PROFILE` + `detectDataProfiles` multi-match behavior.
- `apps/azure/src/components/__tests__/ProcessHubEvidencePanel.generic.test.tsx` — ~8 RTL tests.

**Modify:**

- `packages/core/src/evidenceSources.ts` — add `GENERIC_TABULAR_PROFILE` const after `AGENT_REVIEW_LOG_PROFILE`; add it to `DATA_PROFILE_REGISTRY`.
- `apps/azure/src/components/ProcessHubEvidencePanel.tsx:37-240` — extend with:
  - profile picker UI (visible when `detectDataProfiles()` returns >1 match).
  - mapping confirmation form (column dropdowns, pre-filled from `recommendedMapping`).
  - cadence selector (5-radio: manual/hourly/shiftly/daily/weekly).
  - telemetry on save: `process_hub.evidence_source_created`.

---

## PR #1 — Team notes on state items

**Branch:** `phase-3/pr-1-team-notes`
**Estimated diff:** ~250-350 LOC
**Independent of PR #2 + #3.**

### Task 1: Branch from main, sync state

**Files:** none (git only)

- [ ] **Step 1: Verify main is clean and synced**

```bash
git status
git fetch origin
git log HEAD..origin/main --oneline
```

Expected: clean working tree (the existing `docs/06-design-system/claude desing/` untracked dir is OK), no commits behind.

- [ ] **Step 2: Create branch**

```bash
git checkout -b phase-3/pr-1-team-notes main
```

Expected: `Switched to a new branch 'phase-3/pr-1-team-notes'`

### Task 2: Add `ProcessStateNote` types in core (TDD)

**Files:**

- Create: `packages/core/src/processStateNote.ts`
- Test: `packages/core/src/__tests__/processStateNote.test.ts`

- [ ] **Step 1: Write the failing test file**

```ts
import { describe, expect, it } from 'vitest';
import {
  PROCESS_STATE_NOTE_KINDS,
  isProcessStateNoteKind,
  type ProcessStateNote,
  type ProcessStateNoteKind,
} from '../processStateNote';

describe('PROCESS_STATE_NOTE_KINDS', () => {
  it('contains exactly 4 kinds in stable order', () => {
    expect(PROCESS_STATE_NOTE_KINDS).toEqual(['question', 'gemba', 'data-gap', 'decision']);
  });

  it('is a readonly tuple (length stable)', () => {
    expect(PROCESS_STATE_NOTE_KINDS).toHaveLength(4);
  });
});

describe('isProcessStateNoteKind', () => {
  it('returns true for all 4 valid kinds', () => {
    for (const kind of PROCESS_STATE_NOTE_KINDS) {
      expect(isProcessStateNoteKind(kind)).toBe(true);
    }
  });

  it('returns false for invalid strings', () => {
    expect(isProcessStateNoteKind('idea')).toBe(false);
    expect(isProcessStateNoteKind('')).toBe(false);
    expect(isProcessStateNoteKind('QUESTION')).toBe(false);
  });

  it('narrows the type when used as a predicate', () => {
    const candidate: string = 'question';
    if (isProcessStateNoteKind(candidate)) {
      // candidate is ProcessStateNoteKind here — verify by passing to a typed slot
      const note: ProcessStateNote = {
        id: 'n-1',
        itemId: 'item-1',
        kind: candidate,
        text: 'hello',
        author: 'tester',
        createdAt: '2026-04-27T00:00:00.000Z',
      };
      expect(note.kind).toBe('question');
    } else {
      throw new Error('predicate should have narrowed');
    }
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

```bash
pnpm --filter @variscout/core exec vitest run src/__tests__/processStateNote.test.ts
```

Expected: FAIL with module-not-found.

- [ ] **Step 3: Write the implementation**

```ts
// packages/core/src/processStateNote.ts

/**
 * The 4 kinds of team notes a user can attach to a current-state item.
 * Order is stable — used for UI rendering and telemetry classification.
 */
export type ProcessStateNoteKind = 'question' | 'gemba' | 'data-gap' | 'decision';

export const PROCESS_STATE_NOTE_KINDS: readonly ProcessStateNoteKind[] = [
  'question',
  'gemba',
  'data-gap',
  'decision',
] as const;

const KIND_SET: ReadonlySet<string> = new Set(PROCESS_STATE_NOTE_KINDS);

/**
 * Type guard: true if `value` is one of the 4 valid kinds. Used at storage
 * boundaries (loaded JSON may contain stale or hand-edited values).
 */
export function isProcessStateNoteKind(value: string): value is ProcessStateNoteKind {
  return KIND_SET.has(value);
}

/**
 * A single team note attached to a `ProcessStateItem`.
 *
 * Notes are stored on `ProcessHubInvestigationMetadata.stateNotes[]` and
 * round-trip through Blob Storage with the rest of the project metadata.
 */
export interface ProcessStateNote {
  /** Unique ID — generated client-side, e.g. `note-{timestamp}-{counter}`. */
  id: string;
  /** The `ProcessStateItem.id` this note is attached to. */
  itemId: string;
  kind: ProcessStateNoteKind;
  /** Plain text. No markdown rendering in v1. */
  text: string;
  /** EasyAuth display name (or 'Anonymous' in local dev). */
  author: string;
  /** ISO 8601 timestamp. */
  createdAt: string;
  /** Present only when the note has been edited. */
  updatedAt?: string;
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
pnpm --filter @variscout/core exec vitest run src/__tests__/processStateNote.test.ts
```

Expected: PASS, 5 tests pass.

- [ ] **Step 5: Add exports to `packages/core/src/index.ts`**

Find the section near other process\* exports (around line 199 where `processReviewSignal` is exported) and add directly after:

```ts
export { PROCESS_STATE_NOTE_KINDS, isProcessStateNoteKind } from './processStateNote';
export type { ProcessStateNote, ProcessStateNoteKind } from './processStateNote';
```

- [ ] **Step 6: Verify @variscout/core tsc clean**

```bash
pnpm --filter @variscout/core exec tsc --noEmit
```

Expected: clean exit.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/processStateNote.ts packages/core/src/__tests__/processStateNote.test.ts packages/core/src/index.ts
git commit -m "feat(core): add ProcessStateNote types + isProcessStateNoteKind guard

Pure types for team notes attached to ProcessStateItem. 4 kinds in
stable order (question / gemba / data-gap / decision); type guard at
storage boundary protects against hand-edited or stale JSON.

Phase 3 PR #1, Task 2.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

### Task 3: Extend `ProcessHubInvestigationMetadata` with `stateNotes`

**Files:**

- Modify: `packages/core/src/processHub.ts:65-87`

- [ ] **Step 1: Add the import + field**

At the top of `processHub.ts`, after the existing `import type { HubReviewSignal } from './processReviewSignal';` line, add:

```ts
import type { ProcessStateNote } from './processStateNote';
```

In the `ProcessHubInvestigationMetadata` interface (line 65), add the field near `nextMove?` (around line 78):

```ts
export interface ProcessHubInvestigationMetadata {
  // ... existing fields ...
  nextMove?: string;
  reviewSignal?: HubReviewSignal;
  /**
   * Team notes attached to current-state items. Persisted per-investigation
   * via the existing Blob-Storage round-trip on project metadata.
   * Re-rendered by Dashboard on mount via the rollup.
   */
  stateNotes?: ProcessStateNote[];
  // ... rest of existing fields ...
}
```

- [ ] **Step 2: Verify @variscout/core builds**

```bash
pnpm --filter @variscout/core exec tsc --noEmit
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/processHub.ts
git commit -m "feat(core): add stateNotes field to ProcessHubInvestigationMetadata

Notes round-trip through the existing per-investigation Blob-Storage
cycle. No new storage paths.

Phase 3 PR #1, Task 3.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

### Task 4: Add `ProcessHubNotesContract` + `[+ note]` affordance to panel (TDD)

**Files:**

- Modify: `packages/ui/src/components/ProcessHubCurrentStatePanel/ProcessHubCurrentStatePanel.tsx`
- Modify: `packages/ui/src/components/ProcessHubCurrentStatePanel/__tests__/ProcessHubCurrentStatePanel.test.tsx`

- [ ] **Step 1: Read the existing panel file to understand current structure**

Required reading: `packages/ui/src/components/ProcessHubCurrentStatePanel/ProcessHubCurrentStatePanel.tsx`. The panel currently takes 3 required props: `state`, `actions`, `evidence`. The `StateItemCard` subcomponent renders item content + pill + evidence chip. After this task, the panel takes a 4th required prop `notes`, and `StateItemCard` gains a `[+ note]` affordance + child notes list.

**Important:** This task only adds the affordance + counts; the actual drawer (form for adding notes) lives in apps/azure as `StateItemNotesDrawer`. The panel exposes `onOpenNotes(item)` callback for the consumer to render the drawer.

- [ ] **Step 2: Write failing tests for the notes contract + affordance**

In the existing test file, add the `Finding` import already there + add `ProcessStateNote, ProcessStateNoteKind` imports. Add a `makeNotes()` helper near the existing `makeActions()` and `makeEvidence()`:

```ts
import type { ProcessStateNote, ProcessStateNoteKind } from '@variscout/core';

function makeNotes(
  overrides: { notesFor?: (item: ProcessStateItem) => readonly ProcessStateNote[] } = {}
) {
  const notesFor = overrides.notesFor ?? (() => []);
  const onAddNote = vi.fn();
  const onEditNote = vi.fn();
  const onDeleteNote = vi.fn();
  return {
    notesFor,
    onAddNote,
    onEditNote,
    onDeleteNote,
    currentUserId: 'tester',
  };
}

const sampleNote = (overrides: Partial<ProcessStateNote> = {}): ProcessStateNote => ({
  id: 'note-1',
  itemId: 'item-1',
  kind: 'question',
  text: 'Are we sure?',
  author: 'tester',
  createdAt: '2026-04-27T14:00:00.000Z',
  ...overrides,
});
```

Update each of the existing 20 `render(<ProcessHubCurrentStatePanel ...>)` calls to pass `notes={makeNotes()}` as a 4th required prop.

Add a new `describe` block at the end of the test file:

```ts
describe('ProcessHubCurrentStatePanel — notes', () => {
  it('renders a [+ note] affordance on each state-item card', () => {
    const item = buildItem({ id: 'item-1' });
    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items: [item] })}
        actions={makeActions()}
        evidence={makeEvidence()}
        notes={makeNotes()}
      />
    );
    expect(screen.getByTestId('current-state-add-note')).toBeInTheDocument();
  });

  it('does NOT show edit/delete affordances on notes by other authors', () => {
    const item = buildItem({ id: 'item-1' });
    const note = sampleNote({ author: 'someone-else' });
    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items: [item] })}
        actions={makeActions()}
        evidence={makeEvidence()}
        notes={makeNotes({ notesFor: () => [note] })}
      />
    );
    expect(screen.queryByTestId(`current-state-note-edit-${note.id}`)).not.toBeInTheDocument();
    expect(screen.queryByTestId(`current-state-note-delete-${note.id}`)).not.toBeInTheDocument();
  });

  it('shows edit + delete affordances on own notes', () => {
    const item = buildItem({ id: 'item-1' });
    const note = sampleNote({ author: 'tester' });
    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items: [item] })}
        actions={makeActions()}
        evidence={makeEvidence()}
        notes={makeNotes({ notesFor: () => [note] })}
      />
    );
    expect(screen.getByTestId(`current-state-note-edit-${note.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`current-state-note-delete-${note.id}`)).toBeInTheDocument();
  });

  it('renders all notes for the item with kind label and text', () => {
    const item = buildItem({ id: 'item-1' });
    const notes = [
      sampleNote({ id: 'n-1', kind: 'question', text: 'First note' }),
      sampleNote({ id: 'n-2', kind: 'gemba', text: 'Second note' }),
    ];
    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items: [item] })}
        actions={makeActions()}
        evidence={makeEvidence()}
        notes={makeNotes({ notesFor: () => notes })}
      />
    );
    expect(screen.getByText('First note')).toBeInTheDocument();
    expect(screen.getByText('Second note')).toBeInTheDocument();
  });

  it('omits the notes list when notesFor returns empty', () => {
    const item = buildItem({ id: 'item-1' });
    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items: [item] })}
        actions={makeActions()}
        evidence={makeEvidence()}
        notes={makeNotes({ notesFor: () => [] })}
      />
    );
    expect(screen.queryByTestId('current-state-notes-list')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
pnpm --filter @variscout/ui exec vitest run src/components/ProcessHubCurrentStatePanel
```

Expected: FAIL — TS errors (existing tests now pass an unknown 4th prop) + the 5 new tests fail.

- [ ] **Step 4: Refactor `ProcessHubCurrentStatePanel.tsx`**

Add imports:

```ts
import type { ProcessStateNote, ProcessStateNoteKind } from '@variscout/core';
```

Add the new contract interface near the existing contracts:

```ts
export interface ProcessHubNotesContract {
  notesFor: (item: ProcessStateItem) => readonly ProcessStateNote[];
  onAddNote: (item: ProcessStateItem, kind: ProcessStateNoteKind, text: string) => void;
  onEditNote: (item: ProcessStateItem, noteId: string, text: string) => void;
  onDeleteNote: (item: ProcessStateItem, noteId: string) => void;
  currentUserId: string;
}
```

Update the panel props interface:

```ts
export interface ProcessHubCurrentStatePanelProps {
  state: CurrentProcessState;
  actions: ProcessHubActionsContract;
  evidence: ProcessHubEvidenceContract;
  notes: ProcessHubNotesContract; // NEW required
}
```

Update the panel body destructure to include `notes`:

```ts
export const ProcessHubCurrentStatePanel: React.FC<ProcessHubCurrentStatePanelProps> = ({
  state, actions, evidence, notes,
}) => {
  // ... existing body ...
  // pass `notes` down to StateItemCard:
  <StateItemCard
    key={item.id}
    item={item}
    action={actions.actionFor(item)}
    onInvoke={actions.onInvoke}
    findings={evidence.findingsFor(item)}
    onChipClick={evidence.onChipClick}
    notes={notes.notesFor(item)}
    currentUserId={notes.currentUserId}
    onAddNote={(kind, text) => notes.onAddNote(item, kind, text)}
    onEditNote={(noteId, text) => notes.onEditNote(item, noteId, text)}
    onDeleteNote={(noteId) => notes.onDeleteNote(item, noteId)}
  />
```

Extend `StateItemCard` props + body. Add 5 new props (`notes`, `currentUserId`, `onAddNote`, `onEditNote`, `onDeleteNote`). Inside the card body, after the existing pill + chip row, add a `[+ note]` button + a notes list.

The `[+ note]` button opens an inline drawer (the actual drawer component lives in apps/azure; the panel renders only the affordance and the visible notes list). The drawer is opened via callback — but for the panel-level test, we only verify that the `[+ note]` button renders.

Minimal panel-side notes section (additive after the existing flex row):

```tsx
{
  /* Notes affordance + list */
}
<div className="mt-2">
  <button
    type="button"
    data-testid="current-state-add-note"
    className="text-xs font-medium text-content-secondary hover:text-content"
    onClick={event => {
      event.stopPropagation();
      // The panel doesn't manage drawer state — the consumer renders a
      // drawer in response to this affordance. This callback is invoked
      // via the existing onAddNote prop with kind='question' as a default,
      // OR — better — we expose a separate onOpenNotes callback and let
      // the consumer render a drawer with kind picker.
      // For now: the affordance just signals click; consumer wires drawer.
    }}
  >
    + note
  </button>
  {notes.length > 0 && (
    <ul data-testid="current-state-notes-list" className="mt-2 space-y-1">
      {notes.map(note => (
        <li key={note.id} className="text-xs text-content-secondary">
          <span className="font-semibold">[{note.kind}]</span> <span>{note.author}</span>{' '}
          <span>· {new Date(note.createdAt).toLocaleString()}</span> <span>· {note.text}</span>
          {note.author === currentUserId && (
            <>
              {' '}
              <button
                type="button"
                data-testid={`current-state-note-edit-${note.id}`}
                onClick={e => {
                  e.stopPropagation(); /* open edit drawer */
                }}
                className="text-blue-400 hover:underline"
              >
                Edit
              </button>{' '}
              <button
                type="button"
                data-testid={`current-state-note-delete-${note.id}`}
                onClick={e => {
                  e.stopPropagation();
                  onDeleteNote(note.id);
                }}
                className="text-rose-400 hover:underline"
              >
                Delete
              </button>
            </>
          )}
        </li>
      ))}
    </ul>
  )}
</div>;
```

**Note on architecture:** The actual drawer (with kind selector + textarea + save) lives in apps/azure as `StateItemNotesDrawer`. The panel-level "+ note" button is a **signaling affordance** — clicking it doesn't open a drawer in the panel; it dispatches a callback that the consumer (ProcessHubReviewPanel) wires to its own drawer-state management. For PR #1, we expose `onAddNote` such that the consumer can pop a drawer + collect input + invoke `onAddNote(item, kind, text)` when the user saves.

To make the affordance dispatch cleanly, add an `onRequestAddNote` field to the contract:

```ts
export interface ProcessHubNotesContract {
  notesFor: (item: ProcessStateItem) => readonly ProcessStateNote[];
  /** Consumer opens its own drawer/dialog when this fires. */
  onRequestAddNote: (item: ProcessStateItem) => void;
  /** Consumer opens edit drawer/dialog when this fires. */
  onRequestEditNote: (item: ProcessStateItem, note: ProcessStateNote) => void;
  /** Direct delete — consumer may show confirm before invoking. */
  onDeleteNote: (item: ProcessStateItem, noteId: string) => void;
  currentUserId: string;
}
```

Then the actual `onAddNote(item, kind, text)` signature lives on `StateItemNotesDrawer`'s own props in apps/azure — the consumer wires the drawer's "Save" callback to the storage handler.

Update `makeNotes()` in the test to match this contract (rename `onAddNote` → `onRequestAddNote`, `onEditNote` → `onRequestEditNote`, keep `onDeleteNote`).

- [ ] **Step 5: Run panel tests, expect all 25 pass (20 existing rewired + 5 new)**

```bash
pnpm --filter @variscout/ui exec vitest run src/components/ProcessHubCurrentStatePanel
```

Expected: PASS, 25/25.

- [ ] **Step 6: Run @variscout/ui build**

```bash
pnpm --filter @variscout/ui build
```

Expected: clean tsc + vite build.

- [ ] **Step 7: Verify Azure tsc fails on missing required prop**

```bash
pnpm --filter @variscout/azure-app exec tsc --noEmit 2>&1 | head -10
```

Expected: tsc error in `ProcessHubReviewPanel.tsx` complaining `notes` prop is missing — that's fixed by Task 5 next.

- [ ] **Step 8: Commit**

```bash
git add packages/ui/src/components/ProcessHubCurrentStatePanel/ProcessHubCurrentStatePanel.tsx \
        packages/ui/src/components/ProcessHubCurrentStatePanel/__tests__/ProcessHubCurrentStatePanel.test.tsx
git commit -m "refactor(ui): require notes contract on ProcessHubCurrentStatePanel

Adds ProcessHubNotesContract as the 4th required prop. Each StateItemCard
gains a [+ note] affordance (signaling — consumer opens its own drawer)
and renders the notes list with edit/delete on own notes. Existing 20
tests rewired to pass notes={makeNotes()}; 5 new note-behavior tests added.

The actual drawer (kind selector + textarea) is a separate component
in apps/azure (next task) — the panel exposes onRequestAddNote /
onRequestEditNote callbacks that the consumer wires to drawer state.

Phase 3 PR #1, Task 4.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

### Task 5: Build `StateItemNotesDrawer.tsx` in apps/azure (TDD)

**Files:**

- Create: `apps/azure/src/components/StateItemNotesDrawer.tsx`
- Create: `apps/azure/src/components/__tests__/StateItemNotesDrawer.test.tsx`

- [ ] **Step 1: Write the failing test file**

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import StateItemNotesDrawer, { type StateItemNotesDrawerProps } from '../StateItemNotesDrawer';

const baseProps: StateItemNotesDrawerProps = {
  open: true,
  initialKind: 'question',
  initialText: '',
  onSave: vi.fn(),
  onCancel: vi.fn(),
};

describe('StateItemNotesDrawer', () => {
  it('renders nothing when open is false', () => {
    render(<StateItemNotesDrawer {...baseProps} open={false} />);
    expect(screen.queryByTestId('state-item-notes-drawer')).not.toBeInTheDocument();
  });

  it('renders 4 kind buttons matching PROCESS_STATE_NOTE_KINDS', () => {
    render(<StateItemNotesDrawer {...baseProps} />);
    expect(screen.getByRole('button', { name: /question/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /gemba/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /data.gap/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /decision/i })).toBeInTheDocument();
  });

  it('disables Save when text is empty', () => {
    render(<StateItemNotesDrawer {...baseProps} initialText="" />);
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });

  it('enables Save when text has non-whitespace content', () => {
    render(<StateItemNotesDrawer {...baseProps} initialText="hello" />);
    expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled();
  });

  it('fires onSave with current kind + trimmed text', () => {
    const onSave = vi.fn();
    render(<StateItemNotesDrawer {...baseProps} initialText="  hello  " onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onSave).toHaveBeenCalledWith('question', 'hello');
  });

  it('fires onCancel when Cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<StateItemNotesDrawer {...baseProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('switches active kind when a different kind button is clicked', () => {
    const onSave = vi.fn();
    render(<StateItemNotesDrawer {...baseProps} initialText="hi" onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: /gemba/i }));
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onSave).toHaveBeenCalledWith('gemba', 'hi');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter @variscout/azure-app exec vitest run src/components/__tests__/StateItemNotesDrawer.test.tsx
```

Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement `StateItemNotesDrawer.tsx`**

```tsx
// apps/azure/src/components/StateItemNotesDrawer.tsx
import React from 'react';
import { PROCESS_STATE_NOTE_KINDS, type ProcessStateNoteKind } from '@variscout/core';

const KIND_LABELS: Record<ProcessStateNoteKind, string> = {
  question: 'Question',
  gemba: 'Gemba',
  'data-gap': 'Data Gap',
  decision: 'Decision',
};

export interface StateItemNotesDrawerProps {
  open: boolean;
  initialKind: ProcessStateNoteKind;
  initialText: string;
  onSave: (kind: ProcessStateNoteKind, text: string) => void;
  onCancel: () => void;
}

const StateItemNotesDrawer: React.FC<StateItemNotesDrawerProps> = ({
  open,
  initialKind,
  initialText,
  onSave,
  onCancel,
}) => {
  const [kind, setKind] = React.useState<ProcessStateNoteKind>(initialKind);
  const [text, setText] = React.useState<string>(initialText);

  // Reset internal state when drawer is reopened with new initial values
  React.useEffect(() => {
    if (open) {
      setKind(initialKind);
      setText(initialText);
    }
  }, [open, initialKind, initialText]);

  if (!open) return null;

  const trimmed = text.trim();
  const canSave = trimmed.length > 0;

  return (
    <div
      data-testid="state-item-notes-drawer"
      className="mt-3 rounded-md border border-edge bg-surface p-3"
    >
      <div className="flex flex-wrap gap-2">
        {PROCESS_STATE_NOTE_KINDS.map(k => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={
              k === kind
                ? 'rounded-sm border border-blue-500 bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400'
                : 'rounded-sm border border-edge px-2 py-0.5 text-xs font-medium text-content-secondary hover:bg-surface-hover'
            }
          >
            {KIND_LABELS[k]}
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Add a team note…"
        className="mt-2 w-full rounded-md border border-edge bg-surface px-2 py-1 text-sm text-content focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={3}
      />
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-edge px-3 py-1 text-xs font-medium text-content-secondary hover:bg-surface-hover"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!canSave}
          onClick={() => onSave(kind, trimmed)}
          className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default StateItemNotesDrawer;
```

- [ ] **Step 4: Run drawer tests, verify pass**

```bash
pnpm --filter @variscout/azure-app exec vitest run src/components/__tests__/StateItemNotesDrawer.test.tsx
```

Expected: PASS, 7/7.

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/components/StateItemNotesDrawer.tsx apps/azure/src/components/__tests__/StateItemNotesDrawer.test.tsx
git commit -m "feat(azure): add StateItemNotesDrawer for adding/editing team notes

Inline drawer with 4 kind buttons + textarea + save/cancel. Save
disabled when text is empty/whitespace. Onsave fires with current kind
and trimmed text; onCancel fires no-op. State resets when drawer is
reopened with new initial values.

Phase 3 PR #1, Task 5.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

### Task 6: Wire ProcessHubReviewPanel + Dashboard for notes

**Files:**

- Modify: `apps/azure/src/components/ProcessHubReviewPanel.tsx`
- Modify: `apps/azure/src/pages/Dashboard.tsx`

This task adds the `notes` contract to ProcessHubReviewPanel and wires Dashboard handlers (load → mutate → save chain via existing `useStorage()`).

- [ ] **Step 1: Extend `ProcessHubReviewPanelProps` in `ProcessHubReviewPanel.tsx`**

Add 4 new required props:

```ts
import type { ProcessStateNote } from '@variscout/core';

interface ProcessHubReviewPanelProps {
  // ... existing props ...
  onResponsePathAction: (item: ProcessStateItem, action: ResponsePathAction, hubId: string) => void;
  /** Notes wiring */
  onRequestAddNote: (item: ProcessStateItem, hubId: string) => void;
  onRequestEditNote: (item: ProcessStateItem, note: ProcessStateNote, hubId: string) => void;
  onDeleteNote: (item: ProcessStateItem, noteId: string, hubId: string) => void;
  currentUserId: string;
}
```

- [ ] **Step 2: Build `notesFor` from rollup metadata in the panel body**

After the existing `findingsFor` definition (around line 105):

```ts
// Aggregate stateNotes from all linked investigations for an item.
// Per-investigation items use item.investigationIds; aggregate items pull
// from all hub investigations.
const notesFor = React.useCallback(
  (item: ProcessStateItem): readonly ProcessStateNote[] => {
    const investigationIds =
      item.investigationIds && item.investigationIds.length > 0
        ? item.investigationIds
        : rollup.investigations.map(inv => inv.id);
    const all: ProcessStateNote[] = [];
    for (const invId of investigationIds) {
      const inv = rollup.investigations.find(i => i.id === invId);
      const notes = inv?.metadata?.stateNotes ?? [];
      for (const note of notes) {
        if (note.itemId === item.id) all.push(note);
      }
    }
    // Sort by createdAt asc so older notes appear first
    return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },
  [rollup.investigations]
);
```

- [ ] **Step 3: Pass the new contract to the panel**

Replace the existing `<ProcessHubCurrentStatePanel>` JSX:

```tsx
<ProcessHubCurrentStatePanel
  state={currentState}
  actions={{
    actionFor,
    onInvoke: (item, action) => onResponsePathAction(item, action, rollup.hub.id),
  }}
  evidence={{ findingsFor, onChipClick: handleChipClick }}
  notes={{
    notesFor,
    onRequestAddNote: item => onRequestAddNote(item, rollup.hub.id),
    onRequestEditNote: (item, note) => onRequestEditNote(item, note, rollup.hub.id),
    onDeleteNote: (item, noteId) => onDeleteNote(item, noteId, rollup.hub.id),
    currentUserId,
  }}
/>
```

- [ ] **Step 4: Verify Azure tsc — should now fail at Dashboard.tsx (missing the 4 new props)**

```bash
pnpm --filter @variscout/azure-app exec tsc --noEmit 2>&1 | head -10
```

Expected: tsc errors in `Dashboard.tsx` at the `<ProcessHubReviewPanel>` render site — those are the 4 new required props not yet wired. Fixed in next step.

- [ ] **Step 5: Wire Dashboard handlers**

Open `apps/azure/src/pages/Dashboard.tsx`. Add imports near other type imports:

```ts
import type { ProcessStateNote } from '@variscout/core';
```

Find the section where other handlers (like `handleResponsePathAction`) are defined. Add three new useCallback handlers + drawer state + currentUserId derivation:

```tsx
const [notesDrawerState, setNotesDrawerState] = React.useState<
  | { mode: 'add'; item: ProcessStateItem; hubId: string }
  | { mode: 'edit'; item: ProcessStateItem; note: ProcessStateNote; hubId: string }
  | null
>(null);

// EasyAuth provides current user; derive a stable identifier. Falls back
// to 'Anonymous' in local dev where /api/me may not be wired.
const currentUserId = useAuthUserId(); // assume an existing hook OR replace with actual logic

const handleRequestAddNote = React.useCallback((item: ProcessStateItem, hubId: string) => {
  setNotesDrawerState({ mode: 'add', item, hubId });
}, []);

const handleRequestEditNote = React.useCallback(
  (item: ProcessStateItem, note: ProcessStateNote, hubId: string) => {
    setNotesDrawerState({ mode: 'edit', item, note, hubId });
  },
  []
);

const handleSaveNote = React.useCallback(
  async (kind: ProcessStateNoteKind, text: string) => {
    if (!notesDrawerState) return;
    const { item, hubId } = notesDrawerState;
    const targetInvestigationId =
      item.investigationIds?.[0] ?? rollups.find(r => r.hub.id === hubId)?.investigations[0]?.id;
    if (!targetInvestigationId) {
      setNotesDrawerState(null);
      return;
    }
    const project = await loadProject(targetInvestigationId, 'personal');
    if (!project) {
      setNotesDrawerState(null);
      return;
    }
    const existingNotes = project.processContext?.metadata?.stateNotes ?? [];
    const nowIso = new Date().toISOString();

    let nextNotes: ProcessStateNote[];
    if (notesDrawerState.mode === 'add') {
      const newNote: ProcessStateNote = {
        id: `note-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
        itemId: item.id,
        kind,
        text,
        author: currentUserId,
        createdAt: nowIso,
      };
      nextNotes = [...existingNotes, newNote];
      safeTrackEvent('process_hub.state_note_added', {
        hubId,
        kind,
        severity: item.severity,
        lens: item.lens,
      });
    } else {
      // mode === 'edit'
      const noteId = notesDrawerState.note.id;
      nextNotes = existingNotes.map(n =>
        n.id === noteId ? { ...n, text, kind, updatedAt: nowIso } : n
      );
      safeTrackEvent('process_hub.state_note_edited', { hubId, kind });
    }

    const nextProject = {
      ...project,
      processContext: {
        ...(project.processContext ?? {}),
        metadata: {
          ...(project.processContext?.metadata ?? {}),
          stateNotes: nextNotes,
        },
      },
    };
    await saveProject(nextProject, project.name, 'personal');
    setNotesDrawerState(null);
    // Trigger a rollup refresh — depends on existing reload mechanism
    refreshRollups(); // assume an existing function; rename to actual
  },
  [notesDrawerState, loadProject, saveProject, currentUserId, rollups, refreshRollups]
);

const handleDeleteNote = React.useCallback(
  async (item: ProcessStateItem, noteId: string, hubId: string) => {
    const targetInvestigationId =
      item.investigationIds?.[0] ?? rollups.find(r => r.hub.id === hubId)?.investigations[0]?.id;
    if (!targetInvestigationId) return;
    const project = await loadProject(targetInvestigationId, 'personal');
    if (!project) return;
    const existingNotes = project.processContext?.metadata?.stateNotes ?? [];
    const note = existingNotes.find(n => n.id === noteId);
    if (!note) return;
    const nextNotes = existingNotes.filter(n => n.id !== noteId);
    const nextProject = {
      ...project,
      processContext: {
        ...(project.processContext ?? {}),
        metadata: {
          ...(project.processContext?.metadata ?? {}),
          stateNotes: nextNotes,
        },
      },
    };
    await saveProject(nextProject, project.name, 'personal');
    safeTrackEvent('process_hub.state_note_deleted', { hubId, kind: note.kind });
    refreshRollups();
  },
  [loadProject, saveProject, rollups, refreshRollups]
);
```

Add the new props to the existing `<ProcessHubReviewPanel>` render:

```tsx
<ProcessHubReviewPanel
  rollup={rollup}
  // ... existing props ...
  onResponsePathAction={handleResponsePathAction}
  onRequestAddNote={handleRequestAddNote}
  onRequestEditNote={handleRequestEditNote}
  onDeleteNote={handleDeleteNote}
  currentUserId={currentUserId}
/>
```

Render the drawer at the Dashboard level (so it overlays the panel):

```tsx
{
  notesDrawerState && (
    <StateItemNotesDrawer
      open={true}
      initialKind={notesDrawerState.mode === 'edit' ? notesDrawerState.note.kind : 'question'}
      initialText={notesDrawerState.mode === 'edit' ? notesDrawerState.note.text : ''}
      onSave={handleSaveNote}
      onCancel={() => setNotesDrawerState(null)}
    />
  );
}
```

Add the drawer import at the top:

```ts
import StateItemNotesDrawer from '../components/StateItemNotesDrawer';
```

**IMPORTANT — adapt to actual code:**

- `useAuthUserId` may not exist; if not, use the EasyAuth pattern visible in `apps/azure/src/auth/getCurrentUser.ts` (already in the test inventory). Inline a simple hook if needed; the user ID can be the EasyAuth `displayName` field.
- `refreshRollups` may not be a discrete function — adapt to whatever pattern Dashboard uses to refresh after a project save (it might be automatic via the storage hook).
- `Math.random` in the note ID is used here at the **app layer** (apps/azure), NOT in tests, NOT in @variscout/core. The hard rule is for tests + core stats. Generating client-side IDs in app code is fine.

- [ ] **Step 6: Verify all checks pass**

```bash
pnpm --filter @variscout/azure-app exec tsc --noEmit
pnpm --filter @variscout/azure-app exec vitest run
pnpm --filter @variscout/ui exec vitest run
pnpm --filter @variscout/ui build
```

Expected: tsc clean; tests all pass.

If existing tests fail (`Dashboard.processHub.test.tsx`), they need to be updated to mock the new `useStorage` return values OR provide stub `notes` props. Read each failing test and update minimally.

- [ ] **Step 7: Commit**

```bash
git add apps/azure/src/components/ProcessHubReviewPanel.tsx \
        apps/azure/src/pages/Dashboard.tsx
git commit -m "feat(azure): wire team notes through ProcessHubReviewPanel + Dashboard

ProcessHubReviewPanel takes 4 new required props (onRequestAddNote,
onRequestEditNote, onDeleteNote, currentUserId) and builds notesFor()
from rollup.investigations[*].metadata.stateNotes (filtered by item.id).

Dashboard manages drawer state (add/edit modes), wires the StateItemNotesDrawer,
and persists notes via the existing useStorage().loadProject/saveProject chain
on the per-investigation processContext.metadata.stateNotes[] field.

Telemetry: process_hub.state_note_{added,edited,deleted} with non-PII payloads
(hubId from rollup.hub.id, kind, severity, lens). Note text + author are NEVER
logged.

Phase 3 PR #1, Task 6.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

### Task 7: Update spec → plan back-link to real Markdown link

**Files:**

- Modify: `docs/superpowers/specs/2026-04-27-phase-3-h1-closure-h2-launch-design.md`

The spec currently has a plain-text reference because the plan file did not exist at spec-write time. Now that the plan is in main (this branch), upgrade to a real Markdown link.

- [ ] **Step 1: Update the back-link**

Find this line in the spec:

```
> **Implementation plan (forthcoming):** `docs/superpowers/plans/2026-04-27-phase-3-h1-closure-h2-launch-plan.md` — TDD breakdown for PR #1 (team notes), PR #2 (full EvidenceSheet), PR #3 (general Evidence Source). Plain-text path used until the plan file is written by `superpowers:writing-plans`.
```

Replace with:

```
> **Implementation plan:** [`2026-04-27-phase-3-h1-closure-h2-launch-plan.md`](../plans/2026-04-27-phase-3-h1-closure-h2-launch-plan.md) — TDD breakdown for PR #1 (team notes), PR #2 (full EvidenceSheet), PR #3 (general Evidence Source).
```

- [ ] **Step 2: Verify docs:check passes (no broken cross-refs)**

```bash
pnpm docs:check 2>&1 | tail -10
```

Expected: All checks passed.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-04-27-phase-3-h1-closure-h2-launch-design.md
git commit -m "docs: upgrade Phase 3 spec→plan back-link to Markdown link

The plan file now exists at docs/superpowers/plans/, so the spec can
reference it with real link syntax. Previous plain-text path was a
workaround for the cross-ref check during spec-first writing.

Phase 3 PR #1, Task 7.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

### Task 8: Final verification + push + PR + review + merge

**Files:** none (workflow)

- [ ] **Step 1: Run full pr-ready-check**

```bash
bash scripts/pr-ready-check.sh
```

Expected: All checks passed.

- [ ] **Step 2: Push branch**

```bash
git push -u origin phase-3/pr-1-team-notes
```

- [ ] **Step 3: Open PR**

```bash
gh pr create --base main --head phase-3/pr-1-team-notes \
  --title "feat: team notes on state items (Phase 3 PR #1)" \
  --body "$(cat <<'EOF'
## Summary
- Closes the H1 capability "team notes on state items" (roadmap line 144).
- New `ProcessStateNote` types in `@variscout/core` (4 kinds: question / gemba / data-gap / decision).
- `ProcessHubInvestigationMetadata.stateNotes` field — round-trips through existing Blob-Storage cycle.
- `ProcessHubCurrentStatePanel` takes a 4th required `notes` contract; renders [+ note] affordance + notes list per state-item card.
- `StateItemNotesDrawer` (apps/azure) — inline form with kind selector + textarea + save/cancel.
- Dashboard manages drawer state, wires save via `useStorage().loadProject/saveProject` chain with App Insights telemetry (no PII per ADR-059).

## Test plan
- [ ] Core: 5 new tests in `processStateNote.test.ts`
- [ ] UI: 25 panel tests pass (20 existing rewired + 5 new for notes)
- [ ] Azure: 7 new drawer tests + Dashboard integration tests pass
- [ ] `pnpm --filter @variscout/ui build` clean
- [ ] `bash scripts/pr-ready-check.sh` green
- [ ] `claude --chrome` walk: add a Question note, reload, verify it persists with author + timestamp

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 4: Subagent code review of the full PR diff**

Dispatch `feature-dev:code-reviewer` per `feedback_subagent_driven_catches_bugs`.

- [ ] **Step 5: Squash-merge after review approves**

```bash
gh pr merge <PR-NUMBER> --squash --delete-branch
git checkout main
git pull --ff-only origin main
```

---

## PR #2 — Full EvidenceSheet rendering

**Branch:** `phase-3/pr-2-evidence-sheet`
**Estimated diff:** ~300-400 LOC
**Depends on:** PR #1 merged.

### Task 1: Branch from main

```bash
git fetch origin && git checkout -b phase-3/pr-2-evidence-sheet origin/main
```

### Task 2: Refactor `ProcessHubEvidenceContract` in panel (TDD — breaking change)

**Files:**

- Modify: `packages/ui/src/components/ProcessHubCurrentStatePanel/ProcessHubCurrentStatePanel.tsx`
- Modify: `packages/ui/src/components/ProcessHubCurrentStatePanel/__tests__/ProcessHubCurrentStatePanel.test.tsx`

The current contract is:

```ts
interface ProcessHubEvidenceContract {
  findingsFor: (item) => readonly Finding[];
  onChipClick: (item, findings: readonly Finding[]) => void;
}
```

Replace with:

```ts
interface ProcessHubEvidenceContract {
  countFor: (item: ProcessStateItem) => number;
  loadFindingsFor: (item: ProcessStateItem) => Promise<readonly Finding[]>;
  onChipClick: (item: ProcessStateItem) => void;
  onFindingSelect: (item: ProcessStateItem, finding: Finding) => void;
}
```

- [ ] **Step 1: Update `makeEvidence()` helper in test file**

```ts
function makeEvidence(
  overrides: {
    countFor?: (item: ProcessStateItem) => number;
    loadFindingsFor?: (item: ProcessStateItem) => Promise<readonly Finding[]>;
  } = {}
) {
  return {
    countFor: overrides.countFor ?? (() => 0),
    loadFindingsFor: overrides.loadFindingsFor ?? (async () => []),
    onChipClick: vi.fn(),
    onFindingSelect: vi.fn(),
  };
}
```

Existing tests that asserted `findingsFor` / `onChipClick(item, findings)` semantics need to be updated to use `countFor` + the new sync `onChipClick(item)`.

Specifically the existing chip tests need to be rewritten:

- `'shows the chip with finding count when findingsFor returns non-empty'` → use `countFor: () => 3` and assert chip shows '3 findings'.
- `'shows singular text for one finding'` → use `countFor: () => 1`.
- `'omits the chip when findingsFor returns empty'` → use `countFor: () => 0`.
- `'fires onChipClick with item + findings on chip click and stops card propagation'` → split into two tests: one verifies `onChipClick(item)` fires (no findings arg), one verifies card click is not fired.
- `'renders chip on Planned/unsupported cards too (chip independent of action support)'` → use `countFor: () => 1`.

Add 3 new tests for the count vs. load split:

```ts
it('does not call loadFindingsFor when only the count is needed for the chip', () => {
  const loadFindingsFor = vi.fn();
  const item = buildItem();
  render(
    <ProcessHubCurrentStatePanel
      state={buildState({ items: [item] })}
      actions={makeActions()}
      evidence={makeEvidence({ countFor: () => 5, loadFindingsFor })}
      notes={makeNotes()}
    />
  );
  expect(loadFindingsFor).not.toHaveBeenCalled();
});

it('exposes onChipClick(item) — sheet load is the consumer concern', () => {
  const onChipClick = vi.fn();
  const item = buildItem({ id: 'x' });
  render(
    <ProcessHubCurrentStatePanel
      state={buildState({ items: [item] })}
      actions={makeActions()}
      evidence={{
        countFor: () => 2,
        loadFindingsFor: async () => [],
        onChipClick,
        onFindingSelect: vi.fn(),
      }}
      notes={makeNotes()}
    />
  );
  fireEvent.click(screen.getByTestId('current-state-evidence-chip'));
  expect(onChipClick).toHaveBeenCalledWith(item);
});

it('exposes onFindingSelect on the contract for consumer-side sheet wiring', () => {
  // Type-level test — ensures the contract has onFindingSelect callable shape.
  const evidence = makeEvidence();
  expect(typeof evidence.onFindingSelect).toBe('function');
});
```

- [ ] **Step 2: Run tests, expect failures**

```bash
pnpm --filter @variscout/ui exec vitest run src/components/ProcessHubCurrentStatePanel
```

Expected: existing chip tests fail (TS errors on the new prop shapes); new tests fail (the panel still uses the old contract).

- [ ] **Step 3: Refactor the panel**

In `ProcessHubCurrentStatePanel.tsx`, replace the `ProcessHubEvidenceContract` interface with:

```ts
import type { Finding } from '@variscout/core';

export interface ProcessHubEvidenceContract {
  countFor: (item: ProcessStateItem) => number;
  loadFindingsFor: (item: ProcessStateItem) => Promise<readonly Finding[]>;
  onChipClick: (item: ProcessStateItem) => void;
  onFindingSelect: (item: ProcessStateItem, finding: Finding) => void;
}
```

Update `StateItemCard` to take `count` + `onChipClick(item)` instead of `findings + onChipClick(item, findings)`:

```ts
const StateItemCard: React.FC<{
  item: ProcessStateItem;
  action: ResponsePathAction;
  onInvoke: (item: ProcessStateItem, action: ResponsePathAction) => void;
  count: number;
  onChipClick: () => void;
  // ... notes props from PR #1 ...
}> = ({ item, action, onInvoke, count, onChipClick, /* notes props */ }) => {
  // ...
  // chip JSX:
  {count > 0 && (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onChipClick(); }}
      data-testid="current-state-evidence-chip"
      // ... existing classes ...
    >
      ⓘ {count} {count === 1 ? 'finding' : 'findings'}
    </button>
  )}
};
```

Update the panel body to thread the new contract:

```tsx
<StateItemCard
  // ... existing props ...
  count={evidence.countFor(item)}
  onChipClick={() => evidence.onChipClick(item)}
/>
```

- [ ] **Step 4: Run panel tests, verify pass**

```bash
pnpm --filter @variscout/ui exec vitest run src/components/ProcessHubCurrentStatePanel
```

Expected: PASS, all panel tests pass with new contract.

- [ ] **Step 5: Run @variscout/ui build**

```bash
pnpm --filter @variscout/ui build
```

Expected: clean.

- [ ] **Step 6: Verify Azure tsc fails (consumer hasn't been refactored yet)**

```bash
pnpm --filter @variscout/azure-app exec tsc --noEmit 2>&1 | head -10
```

Expected: tsc errors in `ProcessHubReviewPanel.tsx` — the `evidence={...}` prop no longer matches the new contract. Fixed in next task.

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/components/ProcessHubCurrentStatePanel/ProcessHubCurrentStatePanel.tsx \
        packages/ui/src/components/ProcessHubCurrentStatePanel/__tests__/ProcessHubCurrentStatePanel.test.tsx
git commit -m "refactor(ui): split ProcessHubEvidenceContract into countFor + loadFindingsFor

Replaces the synthetic-Finding placeholder pattern from PR #99 with a
clean separation of concerns: countFor (sync, for chip badge) and
loadFindingsFor (async, for sheet rendering). Sheet management stays
on the consumer side; panel just exposes onChipClick(item) and
onFindingSelect(item, finding) callbacks.

Eliminates the 'as unknown as readonly Finding[]' cast.

Phase 3 PR #2, Task 2.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

### Task 3: Build `EvidenceSheet.tsx` in apps/azure (TDD)

**Files:**

- Create: `apps/azure/src/components/EvidenceSheet.tsx`
- Create: `apps/azure/src/components/__tests__/EvidenceSheet.test.tsx`

- [ ] **Step 1: Write the failing test file**

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Finding, ProcessStateItem } from '@variscout/core';
import EvidenceSheet from '../EvidenceSheet';

const buildItem = (overrides: Partial<ProcessStateItem> = {}): ProcessStateItem => ({
  id: 'item-1',
  lens: 'outcome',
  severity: 'amber',
  responsePath: 'monitor',
  source: 'review-signal',
  label: 'Capability gap',
  ...overrides,
});

const buildFinding = (id: string, status: Finding['status'], text = 'A finding'): Finding =>
  ({
    id,
    text,
    createdAt: 1714000000000,
    context: {} as Finding['context'],
    status,
    comments: [],
    statusChangedAt: 1714000000000,
  }) as Finding;

describe('EvidenceSheet', () => {
  it('renders nothing when item is null', () => {
    render(<EvidenceSheet item={null} findings={[]} onSelectFinding={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByTestId('evidence-sheet')).not.toBeInTheDocument();
  });

  it('shows a loading state when findings is null', () => {
    render(
      <EvidenceSheet
        item={buildItem()}
        findings={null}
        onSelectFinding={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows empty-state placeholder when findings is empty', () => {
    render(
      <EvidenceSheet item={buildItem()} findings={[]} onSelectFinding={vi.fn()} onClose={vi.fn()} />
    );
    expect(screen.getByText(/no findings recorded/i)).toBeInTheDocument();
  });

  it('renders finding labels + statuses', () => {
    const findings = [
      buildFinding('f-1', 'analyzed', 'First'),
      buildFinding('f-2', 'resolved', 'Second'),
    ];
    render(
      <EvidenceSheet
        item={buildItem()}
        findings={findings}
        onSelectFinding={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByText(/analyzed/i)).toBeInTheDocument();
    expect(screen.getByText(/resolved/i)).toBeInTheDocument();
  });

  it('fires onSelectFinding when a finding row is clicked', () => {
    const finding = buildFinding('f-1', 'analyzed', 'Click me');
    const onSelectFinding = vi.fn();
    render(
      <EvidenceSheet
        item={buildItem()}
        findings={[finding]}
        onSelectFinding={onSelectFinding}
        onClose={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('Click me'));
    expect(onSelectFinding).toHaveBeenCalledWith(finding);
  });

  it('fires onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <EvidenceSheet item={buildItem()} findings={[]} onSelectFinding={vi.fn()} onClose={onClose} />
    );
    fireEvent.click(screen.getByLabelText(/close/i));
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests, verify failure**

```bash
pnpm --filter @variscout/azure-app exec vitest run src/components/__tests__/EvidenceSheet.test.tsx
```

Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement `EvidenceSheet.tsx`**

```tsx
// apps/azure/src/components/EvidenceSheet.tsx
import React from 'react';
import { X } from 'lucide-react';
import type { Finding, ProcessStateItem } from '@variscout/core';

export interface EvidenceSheetProps {
  /** When null, sheet is hidden. */
  item: ProcessStateItem | null;
  /** Null while loading; empty array when no findings. */
  findings: readonly Finding[] | null;
  onSelectFinding: (finding: Finding) => void;
  onClose: () => void;
}

const STATUS_LABELS: Record<Finding['status'], string> = {
  observed: 'Observed',
  investigating: 'Investigating',
  analyzed: 'Analyzed',
  improving: 'Improving',
  resolved: 'Resolved',
};

const EvidenceSheet: React.FC<EvidenceSheetProps> = ({
  item,
  findings,
  onSelectFinding,
  onClose,
}) => {
  React.useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [item, onClose]);

  if (!item) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} aria-hidden />
      <div
        data-testid="evidence-sheet"
        className="fixed inset-x-0 bottom-0 z-50 max-h-[60vh] overflow-y-auto rounded-t-lg border-t border-edge bg-surface p-4 shadow-lg"
        role="dialog"
        aria-label="Findings linked to state item"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-content">{item.label}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-content-secondary hover:bg-surface-hover"
          >
            <X size={16} />
          </button>
        </div>

        {findings === null ? (
          <p className="py-6 text-center text-sm text-content-secondary">Loading findings…</p>
        ) : findings.length === 0 ? (
          <p className="py-6 text-center text-sm text-content-secondary">
            No findings recorded for this item yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {findings.map(finding => (
              <li
                key={finding.id}
                className="cursor-pointer rounded-md border border-edge p-2 hover:bg-surface-hover"
                onClick={() => onSelectFinding(finding)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-content">{finding.text}</span>
                  <span className="rounded-sm border border-current px-2 py-0.5 text-xs font-medium text-content-secondary">
                    {STATUS_LABELS[finding.status]}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};

export default EvidenceSheet;
```

- [ ] **Step 4: Run sheet tests, verify pass**

```bash
pnpm --filter @variscout/azure-app exec vitest run src/components/__tests__/EvidenceSheet.test.tsx
```

Expected: PASS, 6/6.

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/components/EvidenceSheet.tsx apps/azure/src/components/__tests__/EvidenceSheet.test.tsx
git commit -m "feat(azure): add EvidenceSheet bottom sheet for finding click-thru

Lightweight sheet listing findings (label + status badge + click-thru).
Renders nothing when item is null; loading state when findings is null;
empty state for zero findings. Esc key, click-outside, and close button
all fire onClose.

Phase 3 PR #2, Task 3.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

### Task 4: Refactor ProcessHubReviewPanel + Dashboard for new evidence contract

**Files:**

- Modify: `apps/azure/src/components/ProcessHubReviewPanel.tsx`
- Modify: `apps/azure/src/pages/Dashboard.tsx`

- [ ] **Step 1: Replace synthetic-Finding `findingsFor` in ProcessHubReviewPanel**

Open `apps/azure/src/components/ProcessHubReviewPanel.tsx`. Find lines 105-127 (the `findingsFor` callback with the synthetic placeholder) and lines 129-147 (`handleChipClick`). Replace BOTH with:

```ts
// countFor: cheap derivation from rollup metadata.
const countFor = React.useCallback(
  (item: ProcessStateItem): number => {
    const investigationIds = investigationIdResolver(item);
    let total = 0;
    for (const invId of investigationIds) {
      const inv = rollup.investigations.find(i => i.id === invId);
      const counts = inv?.metadata?.findingCounts ?? {};
      total += (counts.analyzed ?? 0) + (counts.improving ?? 0) + (counts.resolved ?? 0);
    }
    return total;
  },
  [rollup.investigations, investigationIdResolver]
);

// loadFindingsFor: async load via the existing useStorage chain. Called
// only when the user clicks a chip (consumer side, in Dashboard).
// Promotes from this panel's scope by exposing as a prop.
```

`loadFindingsFor` and the actual sheet management lives on the **Dashboard** because it owns `useStorage` access. So `ProcessHubReviewPanel` only exposes pass-through props for these:

Add 4 new required props on `ProcessHubReviewPanelProps`:

```ts
import type { Finding } from '@variscout/core';

interface ProcessHubReviewPanelProps {
  // ... existing props ...
  /** Async finding loader for the sheet — Dashboard owns useStorage. */
  loadFindingsForItem: (item: ProcessStateItem, hubId: string) => Promise<readonly Finding[]>;
  /** Fired when chip is clicked — Dashboard opens sheet. */
  onChipClick: (item: ProcessStateItem, hubId: string) => void;
  /** Fired when user selects a finding in the sheet. */
  onFindingSelect: (item: ProcessStateItem, finding: Finding, hubId: string) => void;
}
```

Replace the `evidence={{ findingsFor, onChipClick: handleChipClick }}` with the new contract:

```tsx
evidence={{
  countFor,
  loadFindingsFor: (item) => loadFindingsForItem(item, rollup.hub.id),
  onChipClick: (item) => onChipClick(item, rollup.hub.id),
  onFindingSelect: (item, finding) => onFindingSelect(item, finding, rollup.hub.id),
}}
```

Delete the now-unused old `handleChipClick` callback and the synthetic-Finding `findingsFor`. Delete the `Finding` import at the top if not used elsewhere (re-add if `loadFindingsForItem` still references it).

- [ ] **Step 2: Wire Dashboard with sheet state + async load**

Open `apps/azure/src/pages/Dashboard.tsx`. Add imports:

```ts
import EvidenceSheet from '../components/EvidenceSheet';
import { linkFindingsToStateItems } from '@variscout/core';
import type { Finding } from '@variscout/core';
```

Add sheet state:

```ts
const [sheetState, setSheetState] = React.useState<{
  item: ProcessStateItem;
  hubId: string;
  findings: readonly Finding[] | null;
} | null>(null);
```

Add the async loader + handlers:

```ts
const loadFindingsForItem = React.useCallback(
  async (item: ProcessStateItem, hubId: string): Promise<readonly Finding[]> => {
    const rollup = rollups.find(r => r.hub.id === hubId);
    if (!rollup) return [];
    const investigationIds =
      item.investigationIds && item.investigationIds.length > 0
        ? item.investigationIds
        : rollup.investigations.map(i => i.id);
    const findingsByInv = new Map<string, readonly Finding[]>();
    await Promise.all(
      investigationIds.map(async invId => {
        const inv = rollup.investigations.find(i => i.id === invId);
        if (!inv) return;
        const project = await loadProject(inv.name, 'personal');
        if (project?.findings) findingsByInv.set(invId, project.findings);
      })
    );
    const result = linkFindingsToStateItems([item], findingsByInv, () => investigationIds);
    return result.byItemId.get(item.id) ?? [];
  },
  [rollups, loadProject]
);

const handleChipClick = React.useCallback(
  async (item: ProcessStateItem, hubId: string) => {
    safeTrackEvent('process_hub.evidence_sheet_opened', {
      hubId,
      responsePath: item.responsePath,
      lens: item.lens,
      evidenceCount: 0, // we don't have the count here; consumer-side telemetry counts what's loaded
    });
    setSheetState({ item, hubId, findings: null });
    const findings = await loadFindingsForItem(item, hubId);
    // Race guard: only apply if same item is still selected
    setSheetState(prev => (prev?.item.id === item.id ? { ...prev, findings } : prev));
  },
  [loadFindingsForItem]
);

const handleFindingSelect = React.useCallback(
  (item: ProcessStateItem, finding: Finding, hubId: string) => {
    safeTrackEvent('process_hub.evidence_sheet_finding_clicked', {
      hubId,
      lens: item.lens,
      findingStatus: finding.status,
    });
    setSheetState(null);
    // Resolve target investigation: search rollups for the inv that owns this finding.
    // Falls back to the item's first linked investigation.
    const rollup = rollups.find(r => r.hub.id === hubId);
    let investigationId: string | undefined;
    for (const inv of rollup?.investigations ?? []) {
      // We don't have a direct way to know which investigation owns this
      // finding without re-loading projects. Use item.investigationIds[0]
      // as the best heuristic. The fragment lets the editor scroll to the
      // correct finding.
    }
    investigationId = item.investigationIds?.[0] ?? rollup?.investigations[0]?.id;
    if (investigationId) {
      // Use the existing onOpenProject + window location hash pattern.
      onOpenProject(investigationId);
      // After navigation completes, the editor honors the URL fragment.
      // For now, set the hash here:
      setTimeout(() => {
        window.location.hash = `finding-${finding.id}`;
      }, 100);
    }
  },
  [rollups, onOpenProject]
);
```

Pass the new props to `<ProcessHubReviewPanel>`:

```tsx
<ProcessHubReviewPanel
  rollup={rollup}
  // ... existing props from PR #1 ...
  loadFindingsForItem={loadFindingsForItem}
  onChipClick={handleChipClick}
  onFindingSelect={handleFindingSelect}
/>
```

Render the sheet at the Dashboard level:

```tsx
{
  sheetState && (
    <EvidenceSheet
      item={sheetState.item}
      findings={sheetState.findings}
      onSelectFinding={finding => handleFindingSelect(sheetState.item, finding, sheetState.hubId)}
      onClose={() => setSheetState(null)}
    />
  );
}
```

- [ ] **Step 3: Run all verification**

```bash
pnpm --filter @variscout/azure-app exec tsc --noEmit
pnpm --filter @variscout/azure-app exec vitest run
pnpm --filter @variscout/ui exec vitest run
pnpm --filter @variscout/ui build
```

Expected: tsc clean; tests pass.

- [ ] **Step 4: Commit**

```bash
git add apps/azure/src/components/ProcessHubReviewPanel.tsx \
        apps/azure/src/pages/Dashboard.tsx
git commit -m "feat(azure): wire EvidenceSheet with lazy finding load on chip click

Replaces PR #99's synthetic-Finding placeholder with a real async load
through the existing useStorage().loadProject() chain. Sheet state is
managed at Dashboard level; ProcessHubReviewPanel passes through the
contract callbacks. Race-condition guard ensures a fast chip-toggle
doesn't apply stale findings to the wrong item.

Telemetry: process_hub.evidence_sheet_{opened,finding_clicked} with
non-PII payloads (hubId, lens, responsePath, findingStatus enum).

Resolves the TODO(evidence-sheet-pr) cast comment from PR #99.

Phase 3 PR #2, Task 4.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

### Task 5: Final verification + push + PR + review + merge

(Same workflow as PR #1 Task 8. Branch name: `phase-3/pr-2-evidence-sheet`. PR title: `feat: full EvidenceSheet rendering (Phase 3 PR #2)`. Body summarizes the contract refactor + sheet + lazy load + PII-safe telemetry.)

---

## PR #3 — General Evidence Source for CSV/Excel

**Branch:** `phase-3/pr-3-general-evidence-source`
**Estimated diff:** ~600-800 LOC
**Independent of PR #1 + #2.** Can be developed in parallel; merge after both.

### Task 1: Branch from main

```bash
git fetch origin && git checkout -b phase-3/pr-3-general-evidence-source origin/main
```

### Task 2: Add `GENERIC_TABULAR_PROFILE` to core (TDD)

**Files:**

- Modify: `packages/core/src/evidenceSources.ts`
- Create: `packages/core/src/__tests__/evidenceSources.generic.test.ts`

- [ ] **Step 1: Write the failing test file**

Use the actual interface from `evidenceSources.ts:61-68` — NOT the spec's sketch.

```ts
import { describe, expect, it } from 'vitest';
import type { DataRow } from '../types';
import {
  AGENT_REVIEW_LOG_PROFILE,
  DATA_PROFILE_REGISTRY,
  detectDataProfiles,
  GENERIC_TABULAR_PROFILE,
} from '../evidenceSources';

const numericRow = (overrides: DataRow = {}): DataRow => ({
  Timestamp: '2026-04-27T00:00:00Z',
  Value: 12.5,
  Channel: 'A',
  ...overrides,
});

describe('GENERIC_TABULAR_PROFILE', () => {
  it('has id, version, label set', () => {
    expect(GENERIC_TABULAR_PROFILE.id).toBe('generic-tabular');
    expect(GENERIC_TABULAR_PROFILE.version).toBe(1);
    expect(GENERIC_TABULAR_PROFILE.label).toMatch(/generic/i);
  });

  it('detect returns null on empty rows', () => {
    expect(GENERIC_TABULAR_PROFILE.detect([])).toBeNull();
  });

  it('detect returns a result for tabular data with at least one numeric column', () => {
    const rows = [numericRow(), numericRow({ Value: 13 }), numericRow({ Value: 14 })];
    const result = GENERIC_TABULAR_PROFILE.detect(rows);
    expect(result).not.toBeNull();
    expect(result?.profileId).toBe('generic-tabular');
    expect(result?.profileVersion).toBe(1);
  });

  it('detect returns medium or high confidence when most columns are numeric', () => {
    const rows = [
      { A: 1, B: 2, C: 3 },
      { A: 4, B: 5, C: 6 },
    ];
    const result = GENERIC_TABULAR_PROFILE.detect(rows);
    expect(result?.confidence === 'medium' || result?.confidence === 'high').toBe(true);
  });

  it('detect returns low confidence when only a small fraction of columns are numeric', () => {
    const rows = [
      { A: 1, B: 'text', C: 'text', D: 'text', E: 'text' },
      { A: 2, B: 'text', C: 'text', D: 'text', E: 'text' },
    ];
    const result = GENERIC_TABULAR_PROFILE.detect(rows);
    expect(result?.confidence).toBe('low');
  });

  it('validate rejects empty rows', () => {
    const result = GENERIC_TABULAR_PROFILE.validate([], {});
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('validate accepts non-empty rows', () => {
    const rows = [numericRow()];
    const result = GENERIC_TABULAR_PROFILE.validate(rows, {});
    expect(result.ok).toBe(true);
  });

  it('apply returns identity ProfileApplication', () => {
    const rows = [numericRow(), numericRow({ Value: 99 })];
    const mapping = { outcome: 'Value' };
    const application = GENERIC_TABULAR_PROFILE.apply(rows, mapping);
    expect(application.profileId).toBe('generic-tabular');
    expect(application.profileVersion).toBe(1);
    expect(application.derivedRows).toEqual(rows);
    expect(application.validation.ok).toBe(true);
  });
});

describe('DATA_PROFILE_REGISTRY (Phase 3)', () => {
  it('contains both AGENT_REVIEW_LOG_PROFILE and GENERIC_TABULAR_PROFILE', () => {
    const ids = DATA_PROFILE_REGISTRY.map(p => p.id);
    expect(ids).toContain('agent-review-log');
    expect(ids).toContain('generic-tabular');
  });

  it('detectDataProfiles returns generic-tabular for purely numeric data', () => {
    const rows = [
      { Value: 1, Other: 2 },
      { Value: 3, Other: 4 },
    ];
    const matches = detectDataProfiles(rows);
    expect(matches.some(m => m.profileId === 'generic-tabular')).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests, verify failure**

```bash
pnpm --filter @variscout/core exec vitest run src/__tests__/evidenceSources.generic.test.ts
```

Expected: FAIL because `GENERIC_TABULAR_PROFILE` doesn't exist yet.

- [ ] **Step 3: Implement `GENERIC_TABULAR_PROFILE` in `evidenceSources.ts`**

Open `packages/core/src/evidenceSources.ts`. After the existing `AGENT_REVIEW_LOG_PROFILE` constant (near line 200) and before `DATA_PROFILE_REGISTRY`, add:

```ts
function isNumericValueLoose(value: unknown): boolean {
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'string' && value.trim() !== '') {
    return Number.isFinite(Number(value));
  }
  return false;
}

function classifyColumnNumeric(rows: DataRow[], col: string): boolean {
  // A column is "numeric" if at least 70% of non-empty values parse as finite numbers.
  let total = 0;
  let numeric = 0;
  for (const row of rows) {
    const value = row[col];
    if (value === undefined || value === null || value === '') continue;
    total += 1;
    if (isNumericValueLoose(value)) numeric += 1;
  }
  if (total === 0) return false;
  return numeric / total >= 0.7;
}

function genericTabularConfidence(numericRatio: number): DataProfileConfidence {
  if (numericRatio >= 0.6) return 'high';
  if (numericRatio >= 0.3) return 'medium';
  return 'low';
}

export const GENERIC_TABULAR_PROFILE: DataProfileDefinition = {
  id: 'generic-tabular',
  version: 1,
  label: 'Generic tabular',

  detect(rows: DataRow[]): DataProfileDetection | null {
    if (rows.length === 0) return null;
    const cols = columns(rows);
    if (cols.length === 0) return null;

    const numericCols = cols.filter(col => classifyColumnNumeric(rows, col));
    if (numericCols.length === 0) return null;

    const ratio = numericCols.length / cols.length;
    const confidence = genericTabularConfidence(ratio);

    // Recommended mapping: pick the first numeric column as the outcome candidate.
    // The user is expected to confirm/correct in the mapping form.
    const recommendedMapping: Record<string, string> = {
      outcome: numericCols[0],
    };

    return {
      profileId: 'generic-tabular',
      profileVersion: 1,
      confidence,
      recommendedMapping,
      reasons: [
        `Detected ${numericCols.length} numeric column${numericCols.length === 1 ? '' : 's'} of ${cols.length} total.`,
      ],
    };
  },

  validate(rows: DataRow[], _mapping: Record<string, string>): EvidenceValidationResult {
    if (rows.length === 0) {
      return validation(false, ['Snapshot has zero rows.']);
    }
    return validation(true);
  },

  apply(rows: DataRow[], mapping: Record<string, string>): ProfileApplication {
    // Identity transform — no derived signals for generic tabular.
    return {
      profileId: 'generic-tabular',
      profileVersion: 1,
      mapping,
      validation: validation(true),
      derivedColumns: [],
      derivedRows: rows,
    };
  },
};
```

Then update `DATA_PROFILE_REGISTRY` to include the new profile:

```ts
export const DATA_PROFILE_REGISTRY: DataProfileDefinition[] = [
  AGENT_REVIEW_LOG_PROFILE,
  GENERIC_TABULAR_PROFILE,
];
```

- [ ] **Step 4: Run tests, verify pass**

```bash
pnpm --filter @variscout/core exec vitest run src/__tests__/evidenceSources.generic.test.ts
```

Expected: PASS, 11/11 (or however many tests are written).

- [ ] **Step 5: Verify @variscout/core builds**

```bash
pnpm --filter @variscout/core exec tsc --noEmit
```

Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/evidenceSources.ts packages/core/src/__tests__/evidenceSources.generic.test.ts
git commit -m "feat(core): add GENERIC_TABULAR_PROFILE for CSV/Excel evidence sources

First H2 capability — any CSV/Excel with at least one numeric column
becomes a recurring evidence source via this profile. Detection scales
confidence from low → high based on numeric-column ratio. Validate
rejects empty snapshots. Apply is identity (no derived signals).

DATA_PROFILE_REGISTRY now contains both agent-review-log and generic-tabular;
detectDataProfiles returns multi-match results for files matching both.

Phase 3 PR #3, Task 2.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

### Task 3: Extend `ProcessHubEvidencePanel` for profile picker + mapping form (TDD)

**Files:**

- Modify: `apps/azure/src/components/ProcessHubEvidencePanel.tsx`
- Create: `apps/azure/src/components/__tests__/ProcessHubEvidencePanel.generic.test.tsx`

This task is the largest in PR #3 (~300-400 LOC of UI). The existing panel auto-applies `AGENT_REVIEW_LOG_PROFILE` on upload; this task introduces a 4-step flow: upload → detect → confirm mapping → cadence → save.

**Implementer guidance:**

1. Read the existing `ProcessHubEvidencePanel.tsx` (~240 LOC) to understand its structure: it has a file upload input, calls `parseText` + `AGENT_REVIEW_LOG_PROFILE.detect()` directly, and saves via `useStorage()`. The new flow REPLACES this auto-apply path with a multi-step UI.

2. Use a finite-state machine pattern (`React.useState` with a discriminated union) for the steps: `'idle' | 'detecting' | 'picking-profile' | 'confirming-mapping' | 'choosing-cadence' | 'saving' | 'success' | 'error'`. Each step renders different UI.

3. Reuse:
   - `parseText` for CSV
   - `parseExcel` for Excel
   - `detectDataProfiles(rows)` (already exported from `@variscout/core`)
   - `useStorage().saveEvidenceSource()` + `saveEvidenceSnapshot()` (already there)

4. Telemetry: emit `process_hub.evidence_source_created` on successful save with `{hubId, profileId, columnCount, rowCount, cadence}`. Call `safeTrackEvent` from `../lib/appInsights`.

5. The mapping form is a list of column-name dropdowns, one per detected role (outcome, factor, time, channel). Pre-fill from `recommendedMapping`. Save button gathers the user-confirmed mapping into a `Record<string, string>` and calls `profile.apply(rows, mapping)`.

6. Cadence selector: 5 radio buttons (`manual`, `hourly`, `shiftly`, `daily`, `weekly` — per the actual `EvidenceCadence` type, NOT the spec's `monthly`).

This task is large enough that the implementer should consider splitting their work into:

- Sub-task A: state machine + step routing (~50 LOC)
- Sub-task B: profile picker UI + tests (~80 LOC)
- Sub-task C: mapping form + tests (~150 LOC)
- Sub-task D: cadence selector + save handler + telemetry (~100 LOC)

Each sub-task can have its own commit.

**Tests to write at `__tests__/ProcessHubEvidencePanel.generic.test.tsx` (~8 tests):**

1. Upload non-review-log CSV → state advances to `'confirming-mapping'` (single match) and skips picker.
2. Upload review-log CSV → both profiles detected → state advances to `'picking-profile'`.
3. Picking generic from picker → advances to `'confirming-mapping'`.
4. Mapping form pre-fills outcome from `recommendedMapping`.
5. User can edit each mapping field.
6. Cadence radio defaults to `'manual'`.
7. Save calls `saveEvidenceSource` then `saveEvidenceSnapshot` in order.
8. On save success, `safeTrackEvent` is called with `process_hub.evidence_source_created` and the right payload.

Mock `useStorage()` and `safeTrackEvent` per test. Use `vi.mock()` BEFORE imports per the testing rule.

- [ ] **Step 1: Write all 8 failing tests in a new test file** (full code as above; ~250 LOC of test scaffolding)
- [ ] **Step 2: Run tests, verify failure**
- [ ] **Step 3: Implement step-by-step (sub-tasks A-D), running tests after each sub-task**
- [ ] **Step 4: Final verification — all tests pass**
- [ ] **Step 5: Commit per sub-task or one final commit (implementer's call)**

(This task is intentionally less-scripted than earlier tasks — 300-400 LOC of UI doesn't decompose into a single dispatch. The subagent should treat it as a focused mini-spec and follow TDD per sub-task. Status `DONE_WITH_CONCERNS` if scope creeps; the controller can split into multiple subagent dispatches.)

### Task 4: Final verification + push + PR + review + merge

(Same workflow as PR #1 Task 8. Branch: `phase-3/pr-3-general-evidence-source`. PR title: `feat: General Evidence Source for CSV/Excel (Phase 3 PR #3)`. Body explains the H2 launch significance, the new profile, the mapping/cadence flow, and the actual `EvidenceCadence` enum used.)

---

## Self-Review Checklist (run after writing the plan)

- [x] **Spec coverage:** Every section in the spec has at least one task. (PR #1 covers ProcessStateNote types + ProcessHubInvestigationMetadata.stateNotes + ProcessHubNotesContract + StateItemNotesDrawer + Dashboard wiring + spec back-link upgrade. PR #2 covers contract refactor + EvidenceSheet + lazy load + sheet state. PR #3 covers GENERIC_TABULAR_PROFILE + multi-step UI + telemetry.)
- [x] **Placeholder scan:** No "TBD"/"TODO"/"implement later" in tasks. PR #3 Task 3 is intentionally less-scripted but the implementer is told to treat it as a focused mini-spec with TDD per sub-task — not a placeholder.
- [x] **Type consistency:** `ProcessHubNotesContract` uses `onRequestAddNote/onRequestEditNote` (signaling) NOT `onAddNote/onEditNote` (which would imply panel manages drawer state). `ProcessHubEvidenceContract` (PR #2) uses `countFor + loadFindingsFor + onChipClick + onFindingSelect` consistently. `GENERIC_TABULAR_PROFILE` uses the actual `DataProfileDefinition` interface from `evidenceSources.ts:61-68`, NOT the spec's incorrect sketch.
- [x] **Implementation Reality Notes flag the 3 spec deviations** (DataProfileDefinition signature, EvidenceCadence values, spec back-link upgrade timing).
- [x] **No dispatch parallelization:** PR #1 → PR #2 → PR #3 strict sequence (PR #1 contract change touches the panel that PR #2 also refactors).

---

## Workflow conventions (per CLAUDE.md + memories)

- Branch → PR → `bash scripts/pr-ready-check.sh` green → subagent code review → squash-merge.
- No `gh pr merge --admin` unless emergency.
- No `--no-verify` on commits.
- No back-compat optionality on internal package APIs (per `feedback_no_backcompat_clean_architecture`).
- `pnpm --filter @variscout/ui build` before merge (per `feedback_ui_build_before_merge`).
- Strict no-PII per ADR-059 — telemetry payloads use `hubId` (from `rollup.hub.id`), enum values, and integers only. NEVER finding labels, note text, column names, or investigation IDs.
- @variscout/core hard rule: no `Math.random` in tests; sequential counter for fixture IDs. (apps/azure can use `Math.random` for client-side ID generation in non-test code.)
- apps/azure FSD rule: no new top-level dirs (use `features/`, `hooks/`, `components/`, `services/`, `auth/`, `db/`, `lib/`).
- Subagent-driven-development per `feedback_subagent_driven_catches_bugs` — dispatch spec + code-quality reviewer per task.

## References

- Spec: `docs/superpowers/specs/2026-04-27-phase-3-h1-closure-h2-launch-design.md`
- Parent V2 spec: `docs/superpowers/specs/2026-04-27-actionable-current-process-state-panel-design.md`
- Roadmap: `docs/superpowers/specs/2026-04-27-product-method-roadmap-design.md` (H1 line 144, H2 line 181)
- Operating model: `docs/superpowers/specs/2026-04-27-process-learning-operating-model-design.md`
- Evidence Sources spec: `docs/superpowers/specs/2026-04-26-evidence-sources-data-profiles-design.md`
- Memory: `feedback_no_backcompat_clean_architecture`
- Memory: `feedback_ui_build_before_merge`
- Memory: `feedback_subagent_driven_catches_bugs`
- Memory: `feedback_doc_validation_hooks`
- Memory: `project_phase_2_v2_closure`
