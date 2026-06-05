---
tier: living
purpose: design
title: 'PO-8a · Schema hardening — sub-plan (v1 freeze + hydrate-seam validation + viewState strip)'
audience: human
status: delivered
date: 2026-06-05
last-reviewed: 2026-06-05
layer: spec
topic:
  [persistence, document-snapshot, vrs, schema-policy, viewstate, sub-plan, process-as-operations]
related:
  - docs/superpowers/plans/2026-06-04-process-ops-extraction-master-plan.md
  - docs/superpowers/specs/2026-06-04-process-ops-extraction-entity-disposition-design.md
  - docs/07-decisions/adr-091-two-tier-persistence-model.md
---

# PO-8a Schema Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Freeze the post-PO-7 `DocumentSnapshot` shape as schema v1, install loud typed validation at the shared hydrate seam (covering Azure blob, Azure Dexie, and `.vrs` import uniformly), and strip per-user `viewState` from the shared snapshot.

**Architecture:** A new `packages/stores/src/documentSnapshotValidation.ts` module owns `CURRENT_DOCUMENT_SCHEMA_VERSION`, two typed errors (`DocumentSnapshotVersionMismatchError` / `DocumentSnapshotCorruptError`), and `validateDocumentSnapshot`. `hydrateDocumentSnapshot` strict-asserts at entry — this is the single seam every load path flows through (`useProjectActions.loadProject:71` + `importProject:122` + PWA `App.tsx:723`). The `.vrs` parser re-wires onto the same validation. `viewState` leaves `buildProjectSnapshot` and `SerializedProject`; it survives as in-memory session state (`ProjectState.viewState` + `setViewState`, no longer marking unsaved).

**Tech Stack:** TypeScript, Zustand, Vitest. No Dexie version bump (the data shape changes inside the `data` blob; no index changes — azure stays v17, pwa v15). No new dependencies.

**Scope authority:** Spec §16 (the 2026-06-05 owner-ratified amendment) supersedes §9.3's three-way-branch/read-only/migration-seam items. **CUT:** read-only mode, "saved by a newer version" warning machinery, `migrateVn→Vn+1` seam (dev-phase no-compat principle — decision-log 2026-06-05, ADR-091 Amendment). **No field-level deepening** of validation (ADR-091 silent-drop design — the PO-7 legacy-scope documented-by-test must stay green).

**Grounded facts the implementer inherits (verified 2026-06-05):**

- The Azure blob→Dexie→hydrate path has ZERO validation today; only `.vrs` parse validates. All three load paths converge on `hydrateDocumentSnapshot` (`packages/hooks/src/useProjectActions.ts:71,122`; `apps/pwa/src/App.tsx:723`). Azure's Editor loads via `projectActions.loadProject` → `azurePersistenceAdapter.loadProject` → `loadProjectLocally` (Dexie); the cloud fetch (`storage.ts:438` `loadProject`) caches into Dexie and the same hydrate seam consumes it.
- `viewState` serializes at `packages/stores/src/documentSnapshot.ts:96`; build-time `schemaVersion: 1` at `:158`; interface member at `:47` (spec's `:95/:157` cites are off-by-one; `processHub.ts:433 schemaVersion` is a PHANTOM — do not touch `processHub.ts`).
- The existing "rejects malformed documentSnapshot payloads" test (`documentSnapshotVrs.test.ts:133-142`) rejects on SHAPE, not version (its `schemaVersion: 2` fixture omits required facets; `&&` short-circuit). It gets split, not flipped.
- Hydration of absent `viewState` is safe (`projectStore.ts:353` defaults `?? null`; consumers optional-chain; `panelsStore.initFromViewState` defaults `activeView` to `'explore'`).
- App-test `viewState` references in `Editor.test.tsx` / `WhatIfPage.test.tsx` / `ProjectDashboard.test.tsx` seed **ProjectState** (which keeps the field) — they do NOT break. Only `SerializedProject` literals break (one test in `projectStore.test.ts`).
- Azure `importFromFile` (`apps/azure/src/lib/persistence.ts:163` area) currently swallows parse errors into a generic `new Error('Invalid file format')` — must preserve typed errors. The Dashboard "Open from SharePoint" button is currently unmounted (`onLoadProjectFile` never passed) — no live Azure import UI, but the plumbing must be honest for when it revives.
- PWA `VrsImportButton` shows `window.alert('Could not import .vrs: ' + err.message)` — the typed error's user-facing message flows through with NO component change; tests assert the copy.
- Package filters: `@variscout/stores`, `@variscout/hooks`, `@variscout/azure-app` (NOT `@variscout/azure`), `@variscout/pwa`.
- `packages/stores` tests are tsc-INVISIBLE to its build tsconfig, but **apps' tsc covers their test files** — acceptance greps are the guard for stores; the turbo build is the guard for apps.
- Locate review targets by symbol/test name, never by cited line number (lines drift mid-PR).

**Worktree:** `.worktrees/feat-po-8a-schema-hardening` on branch `feat/po-8a-schema-hardening`. Commit this plan file on the branch first.

**Per-task verification budget:** scope test runs to the touched package (`pnpm --filter @variscout/stores test` ≈ fast). Full `pr-ready-check.sh` + both app suites are CONTROLLER-level (Task 8), not implementer-level.

---

### Task 1: Validation module — typed errors + `validateDocumentSnapshot` + v1 shape freeze (TDD)

**Model:** Sonnet.

**Files:**

- Create: `packages/stores/src/documentSnapshotValidation.ts`
- Create: `packages/stores/src/__tests__/documentSnapshotValidation.test.ts`
- Modify: `packages/stores/src/index.ts` (exports)

- [ ] **Step 1: Write the failing tests**

`packages/stores/src/__tests__/documentSnapshotValidation.test.ts`:

```typescript
import { beforeEach, describe, expect, it } from 'vitest';
import type { ProcessHub } from '@variscout/core';
import { buildDocumentSnapshot } from '../documentSnapshot';
import {
  CURRENT_DOCUMENT_SCHEMA_VERSION,
  DocumentSnapshotCorruptError,
  DocumentSnapshotVersionMismatchError,
  validateDocumentSnapshot,
} from '../documentSnapshotValidation';
import { getAnalyzeInitialState, useAnalyzeStore } from '../analyzeStore';
import { useCanvasStore } from '../canvasStore';
import {
  getImprovementProjectInitialState,
  useImprovementProjectStore,
} from '../improvementProjectStore';
import { getProjectInitialState, useProjectStore } from '../projectStore';

const now = 1_714_000_000_000;

const hub: ProcessHub = {
  id: 'hub-1',
  name: 'Barrel molding',
  processGoal: 'Reduce molding scrap.',
  createdAt: now,
  deletedAt: null,
  outcomes: [],
  primaryScopeDimensions: [],
};

function resetStores() {
  useProjectStore.setState(getProjectInitialState());
  useAnalyzeStore.setState(getAnalyzeInitialState());
  useCanvasStore.setState(useCanvasStore.getInitialState());
  useImprovementProjectStore.setState(getImprovementProjectInitialState());
}

beforeEach(() => {
  resetStores();
});

describe('validateDocumentSnapshot — the PO-8a loud hydrate-seam validation', () => {
  it('accepts a freshly built current-version snapshot (negative control: loading stays possible)', () => {
    useProjectStore.setState({
      ...getProjectInitialState(),
      rawData: [{ yield: 91 }],
      outcome: 'yield',
    });
    const snapshot = buildDocumentSnapshot({ activeHub: hub });
    expect(() => validateDocumentSnapshot(snapshot)).not.toThrow();
    expect(validateDocumentSnapshot(snapshot)).toBe(snapshot);
  });

  it('throws DocumentSnapshotVersionMismatchError for a WELL-FORMED snapshot with a different numeric schemaVersion', () => {
    const snapshot = JSON.parse(JSON.stringify(buildDocumentSnapshot({ activeHub: hub })));
    snapshot.schemaVersion = 2; // full valid shape — ONLY the version differs
    expect(() => validateDocumentSnapshot(snapshot)).toThrow(DocumentSnapshotVersionMismatchError);
    expect(() => validateDocumentSnapshot(snapshot)).toThrow(/different version/i);
    expect(() => validateDocumentSnapshot(snapshot)).toThrow(/refresh/i);
    try {
      validateDocumentSnapshot(snapshot);
    } catch (err) {
      expect((err as DocumentSnapshotVersionMismatchError).foundVersion).toBe(2);
    }
  });

  it('throws DocumentSnapshotCorruptError for shape failures (missing facets, non-records, missing version)', () => {
    // current version but missing required facets
    expect(() => validateDocumentSnapshot({ schemaVersion: 1, hubId: 'hub-1' })).toThrow(
      DocumentSnapshotCorruptError
    );
    // not a record at all
    expect(() => validateDocumentSnapshot('garbage')).toThrow(DocumentSnapshotCorruptError);
    expect(() => validateDocumentSnapshot(null)).toThrow(DocumentSnapshotCorruptError);
    // schemaVersion absent / non-numeric → corrupt, NOT version-mismatch
    const snapshot = JSON.parse(JSON.stringify(buildDocumentSnapshot({ activeHub: hub })));
    delete snapshot.schemaVersion;
    expect(() => validateDocumentSnapshot(snapshot)).toThrow(DocumentSnapshotCorruptError);
    snapshot.schemaVersion = '2';
    expect(() => validateDocumentSnapshot(snapshot)).toThrow(DocumentSnapshotCorruptError);
  });

  it('corrupt message names documentSnapshot (kept assertable by the .vrs parser tests)', () => {
    expect(() => validateDocumentSnapshot({ schemaVersion: 1 })).toThrow(
      /invalid.*documentSnapshot/i
    );
  });
});

describe('PO-8a v1 shape freeze — the post-PO-7 cleaned shape IS schema v1', () => {
  it('the canonical snapshot carries exactly the frozen top-level keys', () => {
    const snapshot = buildDocumentSnapshot({ activeHub: hub });
    expect(Object.keys(snapshot).sort()).toEqual([
      'analyze',
      'canvas',
      'hub',
      'hubId',
      'improvementProject',
      'project',
      'schemaVersion',
    ]);
    expect(snapshot.schemaVersion).toBe(CURRENT_DOCUMENT_SCHEMA_VERSION);
    expect(Object.keys(snapshot.analyze).sort()).toEqual([
      'categories',
      'causalLinks',
      'findings',
      'hypotheses',
      'scopes',
    ]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/stores test -- documentSnapshotValidation`
Expected: FAIL — `Cannot find module '../documentSnapshotValidation'`

- [ ] **Step 3: Write the implementation**

`packages/stores/src/documentSnapshotValidation.ts`:

```typescript
/**
 * PO-8a loud validation at the document hydrate seam (ADR-091 "loud validation
 * is PO-8a"; spec §16). Covers ALL load paths uniformly — Azure blob, Azure
 * Dexie cache, and .vrs import — because every path converges on
 * hydrateDocumentSnapshot.
 *
 * Dev-phase no-compat principle (spec §16, decision-log 2026-06-05): no
 * migration machinery, no newer-than-reader read-only mode. A version mismatch
 * is a stale-tab/stale-cache event in an evergreen web deployment — the remedy
 * is a refresh, so the error message says so.
 *
 * Deliberately SHALLOW: structural shape only, never field-level assertions
 * (ADR-091 codifies silent-drop for unknown/renamed member keys — the PO-7
 * legacy-scope documentation-by-test depends on this staying shallow).
 */
import type { DocumentSnapshot } from './documentSnapshot';

export const CURRENT_DOCUMENT_SCHEMA_VERSION = 1;

/** A structurally valid snapshot whose schemaVersion differs from this build's. */
export class DocumentSnapshotVersionMismatchError extends Error {
  readonly foundVersion: number;

  constructor(foundVersion: number) {
    super(
      `This project was saved by a different version of VariScout ` +
        `(schema v${foundVersion}; this app reads v${CURRENT_DOCUMENT_SCHEMA_VERSION}). ` +
        `Refresh the app to update, then try again.`
    );
    this.name = 'DocumentSnapshotVersionMismatchError';
    this.foundVersion = foundVersion;
  }
}

/** Malformed / structurally invalid snapshot data — fails loudly, never hydrates. */
export class DocumentSnapshotCorruptError extends Error {
  constructor(message = 'Invalid documentSnapshot payload.') {
    super(message);
    this.name = 'DocumentSnapshotCorruptError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function hasDocumentSnapshotShape(value: Record<string, unknown>): boolean {
  const analyze = value.analyze;
  return (
    'hubId' in value &&
    (isRecord(value.hub) || value.hub === null) &&
    isRecord(value.project) &&
    isRecord(analyze) &&
    Array.isArray(analyze.findings) &&
    Array.isArray(analyze.categories) &&
    Array.isArray(analyze.hypotheses) &&
    Array.isArray(analyze.causalLinks) &&
    Array.isArray(analyze.scopes) &&
    isRecord(value.canvas) &&
    'improvementProject' in value
  );
}

/**
 * Strict-assert that a value is a loadable current-version DocumentSnapshot.
 * Throws DocumentSnapshotVersionMismatchError for a numeric non-current
 * schemaVersion (diagnosed BEFORE shape — a foreign-version shape can't be
 * judged against this build's expectations), DocumentSnapshotCorruptError
 * for everything else. Returns the (narrowed) input on success.
 */
export function validateDocumentSnapshot(value: unknown): DocumentSnapshot {
  if (!isRecord(value)) {
    throw new DocumentSnapshotCorruptError();
  }
  if (
    typeof value.schemaVersion === 'number' &&
    value.schemaVersion !== CURRENT_DOCUMENT_SCHEMA_VERSION
  ) {
    throw new DocumentSnapshotVersionMismatchError(value.schemaVersion);
  }
  if (value.schemaVersion !== CURRENT_DOCUMENT_SCHEMA_VERSION || !hasDocumentSnapshotShape(value)) {
    throw new DocumentSnapshotCorruptError();
  }
  return value as unknown as DocumentSnapshot;
}

/** Boolean companion for callers that branch instead of throwing. */
export function isDocumentSnapshot(value: unknown): value is DocumentSnapshot {
  try {
    validateDocumentSnapshot(value);
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Export from the package index**

In `packages/stores/src/index.ts`, after the `./documentSnapshot` value-export block (locate the `export { buildDocumentSnapshot, ... } from './documentSnapshot';` statement), add:

```typescript
export {
  CURRENT_DOCUMENT_SCHEMA_VERSION,
  DocumentSnapshotCorruptError,
  DocumentSnapshotVersionMismatchError,
  isDocumentSnapshot,
  validateDocumentSnapshot,
} from './documentSnapshotValidation';
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter @variscout/stores test -- documentSnapshotValidation`
Expected: PASS (all new tests green)

- [ ] **Step 6: Commit**

```bash
git add packages/stores/src/documentSnapshotValidation.ts packages/stores/src/__tests__/documentSnapshotValidation.test.ts packages/stores/src/index.ts
git commit -m "feat(po-8a): documentSnapshotValidation — typed errors + strict-assert + v1 shape freeze"
```

---

### Task 2: Re-wire the `.vrs` parser onto the shared validation; split the conflated malformed test (TDD)

**Model:** Sonnet.

**Files:**

- Modify: `packages/stores/src/documentSnapshotVrs.ts`
- Modify: `packages/stores/src/__tests__/documentSnapshotVrs.test.ts`

- [ ] **Step 1: Rewrite the conflated test + add the well-formed-version-mismatch test**

In `documentSnapshotVrs.test.ts`, REPLACE the test `'rejects malformed documentSnapshot payloads'` (locate by test name — its fixture is `documentSnapshot: { schemaVersion: 2, hubId: 'hub-1' }`) with these two, and add the envelope test (add the import of the two error classes from `'../documentSnapshotValidation'` at the top):

```typescript
it('a WELL-FORMED .vrs with a different documentSnapshot.schemaVersion throws the version-mismatch error (spec §16: refused with refresh hint, never silently loaded)', () => {
  // Build a real full-shape file, then bump ONLY the version.
  useProjectStore.setState({
    ...getProjectInitialState(),
    rawData: [{ yield: 91 }],
    outcome: 'yield',
  });
  const file = JSON.parse(buildDocumentSnapshotVrs({ activeHub: hub }));
  file.documentSnapshot.schemaVersion = 2;

  expect(() => parseDocumentSnapshotVrs(JSON.stringify(file))).toThrow(
    DocumentSnapshotVersionMismatchError
  );
  expect(() => parseDocumentSnapshotVrs(JSON.stringify(file))).toThrow(/refresh/i);
});

it('a current-version .vrs with a shape-malformed documentSnapshot throws the corrupt error (the OLD :133 fixture, version conflation removed)', () => {
  const malformed = JSON.stringify({
    kind: 'variscout.document',
    version: 1,
    exportedAt: '2026-06-01T00:00:00.000Z',
    documentSnapshot: { schemaVersion: 1, hubId: 'hub-1' }, // missing facets, CURRENT version
  });

  expect(() => parseDocumentSnapshotVrs(malformed)).toThrow(DocumentSnapshotCorruptError);
  expect(() => parseDocumentSnapshotVrs(malformed)).toThrow(/invalid.*documentSnapshot/i);
});

it('a different numeric ENVELOPE version (co-versioned with schemaVersion) also throws version-mismatch; legacy string versions stay corrupt', () => {
  useProjectStore.setState({
    ...getProjectInitialState(),
    rawData: [{ yield: 91 }],
    outcome: 'yield',
  });
  const file = JSON.parse(buildDocumentSnapshotVrs({ activeHub: hub }));
  file.version = 2;
  expect(() => parseDocumentSnapshotVrs(JSON.stringify(file))).toThrow(
    DocumentSnapshotVersionMismatchError
  );
  // legacy pre-snapshot files carry STRING versions — they are invalid format, not version-mismatched
  expect(() =>
    parseDocumentSnapshotVrs(
      JSON.stringify({ kind: 'variscout.document', version: '1.0', exportedAt: 'x' })
    )
  ).toThrow(/invalid file format/i);
});
```

- [ ] **Step 2: Run to verify the new tests fail**

Run: `pnpm --filter @variscout/stores test -- documentSnapshotVrs`
Expected: FAIL — the well-formed v2 file currently throws the generic `'Invalid .vrs documentSnapshot payload.'` (not the typed mismatch error); envelope `version: 2` throws `'Invalid file format.'`

- [ ] **Step 3: Re-wire the parser**

In `packages/stores/src/documentSnapshotVrs.ts`:

1. Replace the local `isRecord` + `isDocumentSnapshot` functions with imports (delete both local functions):

```typescript
import {
  CURRENT_DOCUMENT_SCHEMA_VERSION,
  DocumentSnapshotCorruptError,
  DocumentSnapshotVersionMismatchError,
  isDocumentSnapshot,
  validateDocumentSnapshot,
} from './documentSnapshotValidation';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
```

(Keep a local `isRecord` — it is envelope-level plumbing; `isDocumentSnapshot` now comes from the validation module and includes the version check, preserving `isDocumentSnapshotVrsFile`'s boolean semantics.)

2. Replace `parseDocumentSnapshotVrs` with:

```typescript
export function parseDocumentSnapshotVrs(json: string): DocumentSnapshotVrsFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new DocumentSnapshotCorruptError('Invalid file format.');
  }

  if (!isRecord(parsed) || parsed.kind !== 'variscout.document') {
    throw new DocumentSnapshotCorruptError('Invalid file format.');
  }

  // Envelope version is co-versioned with documentSnapshot.schemaVersion (always
  // written together — see buildDocumentSnapshotVrs). A different NUMERIC version
  // is a version mismatch (refresh hint); anything else is invalid format.
  if (typeof parsed.version === 'number' && parsed.version !== CURRENT_DOCUMENT_SCHEMA_VERSION) {
    throw new DocumentSnapshotVersionMismatchError(parsed.version);
  }
  if (parsed.version !== CURRENT_DOCUMENT_SCHEMA_VERSION) {
    throw new DocumentSnapshotCorruptError('Invalid file format.');
  }

  if ('hub' in parsed || 'rawData' in parsed) {
    throw new DocumentSnapshotCorruptError('Invalid file format.');
  }

  validateDocumentSnapshot(parsed.documentSnapshot);

  return parsed as unknown as DocumentSnapshotVrsFile;
}
```

3. Update `buildDocumentSnapshotVrs`'s envelope literal `version: 1` to `version: CURRENT_DOCUMENT_SCHEMA_VERSION` and the `DocumentSnapshotVrsFile` interface member stays `version: 1` (the const is typed `1`-compatible; if tsc complains, keep the literal `1` in the build return — the interface is the freeze).

- [ ] **Step 4: Run the full stores suite**

Run: `pnpm --filter @variscout/stores test`
Expected: PASS — including the UNTOUCHED tests: `'parses only snapshot .vrs files'` (legacy string-version → invalid format), `'rejects top-level rawData project-state JSON'`, `'rejects snapshot files that still use top-level hub/rawData fields'`, and the PO-7 `'a pre-rename .vrs scope … yields projectId === undefined'` documented-by-test (shallow validation MUST keep it green).

- [ ] **Step 5: Commit**

```bash
git add packages/stores/src/documentSnapshotVrs.ts packages/stores/src/__tests__/documentSnapshotVrs.test.ts
git commit -m "feat(po-8a): .vrs parser on shared validation — typed version-mismatch vs corrupt; conflated test split"
```

---

### Task 3: Strict-assert at the hydrate seam (TDD)

**Model:** Sonnet.

**Files:**

- Modify: `packages/stores/src/documentSnapshot.ts` (`hydrateDocumentSnapshot`)
- Modify: `packages/stores/src/__tests__/documentSnapshotValidation.test.ts` (add seam tests)

- [ ] **Step 1: Write the failing tests** (append to `documentSnapshotValidation.test.ts`; add `hydrateDocumentSnapshot` to the existing `../documentSnapshot` import)

```typescript
describe('hydrateDocumentSnapshot — the seam strict-asserts (covers blob/Dexie/.vrs uniformly)', () => {
  it('refuses to hydrate a version-mismatched snapshot — stores stay untouched (closes the silent-downgrade hazard)', () => {
    useProjectStore.setState({
      ...getProjectInitialState(),
      rawData: [{ yield: 91 }],
      outcome: 'yield',
    });
    const foreign = JSON.parse(JSON.stringify(buildDocumentSnapshot({ activeHub: hub })));
    foreign.schemaVersion = 2;
    foreign.project.outcome = 'scrap';

    resetStores();
    expect(() => hydrateDocumentSnapshot(foreign)).toThrow(DocumentSnapshotVersionMismatchError);
    // negative control: nothing hydrated — the foreign outcome never reached the store
    expect(useProjectStore.getState().outcome).toBeNull();
  });

  it('refuses to hydrate corrupt data loudly', () => {
    expect(() => hydrateDocumentSnapshot({ schemaVersion: 1, hubId: 'x' } as never)).toThrow(
      DocumentSnapshotCorruptError
    );
  });

  it('hydrates a valid current-version snapshot (negative control: the gate does not over-reject)', () => {
    useProjectStore.setState({
      ...getProjectInitialState(),
      rawData: [{ yield: 91 }],
      outcome: 'yield',
    });
    const snapshot = buildDocumentSnapshot({ activeHub: hub });
    resetStores();
    expect(() => hydrateDocumentSnapshot(snapshot)).not.toThrow();
    expect(useProjectStore.getState().outcome).toBe('yield');
  });
});
```

- [ ] **Step 2: Run to verify the first two fail**

Run: `pnpm --filter @variscout/stores test -- documentSnapshotValidation`
Expected: FAIL — `hydrateDocumentSnapshot` currently hydrates anything without checking

- [ ] **Step 3: Implement**

In `packages/stores/src/documentSnapshot.ts`, add the import and the assert as the FIRST line of `hydrateDocumentSnapshot`:

```typescript
import { validateDocumentSnapshot } from './documentSnapshotValidation';
```

```typescript
export function hydrateDocumentSnapshot(snapshot: DocumentSnapshot): void {
  // PO-8a (spec §16): the single loud validation seam — every load path
  // (Azure blob, Azure Dexie cache, .vrs import) converges here.
  validateDocumentSnapshot(snapshot);

  const { entryScenario, processContext, ...project } = cloneJson(snapshot.project);
  // ... (rest unchanged)
```

- [ ] **Step 4: Run the full stores suite + hooks suite** (hooks' `useProjectActions` tests exercise the seam)

Run: `pnpm --filter @variscout/stores test && pnpm --filter @variscout/hooks test`
Expected: PASS. If a hooks/app test hydrates a hand-built PARTIAL snapshot fixture, it will now throw `DocumentSnapshotCorruptError` — fix the FIXTURE to full shape (use `buildDocumentSnapshot` from seeded stores), never weaken the validator.

- [ ] **Step 5: Commit**

```bash
git add packages/stores/src/documentSnapshot.ts packages/stores/src/__tests__/documentSnapshotValidation.test.ts
git commit -m "feat(po-8a): hydrateDocumentSnapshot strict-asserts — loud validation at the one shared seam"
```

---

### Task 4: viewState strip — out of the shared snapshot, session-only in memory (TDD)

**Model:** Sonnet.

**Files:**

- Modify: `packages/stores/src/documentSnapshot.ts` (build + type)
- Modify: `packages/stores/src/projectStore.ts` (`SerializedProject`, `loadProject`, `setViewState`)
- Modify: `packages/stores/src/__tests__/projectStore.test.ts` (flip 2 tests)
- Modify: `packages/stores/src/__tests__/documentSnapshot.test.ts` (anti-hijack + fingerprint tests)

- [ ] **Step 1: Write the failing tests**

In `documentSnapshot.test.ts`, append to the existing `documentSnapshotFingerprint` describe (reuse the file's existing `seedProjectStore`/`makeHub`/`resetStores` helpers):

```typescript
it('PO-8a: viewState never enters the snapshot and never moves the fingerprint (negative control: durable content still does)', () => {
  seedProjectStore();
  const activeHub = makeHub('hub-1');
  const baseline = documentSnapshotFingerprint(buildDocumentSnapshot({ activeHub }));

  // a tab/chart switch is NOT a document change
  useProjectStore.getState().setViewState({ activeView: 'report', focusedChart: 'boxplot' });
  const snapshot = buildDocumentSnapshot({ activeHub });
  expect(snapshot.project).not.toHaveProperty('viewState');
  expect(documentSnapshotFingerprint(snapshot)).toBe(baseline);

  // negative control: a durable content change DOES move the fingerprint
  useProjectStore.getState().setOutcome('scrap');
  expect(documentSnapshotFingerprint(buildDocumentSnapshot({ activeHub }))).not.toBe(baseline);
});

it('PO-8a anti-hijack: hydrating a legacy snapshot that still carries viewState does NOT adopt the saver working context', () => {
  seedProjectStore();
  const activeHub = makeHub('hub-1');
  const legacy = JSON.parse(JSON.stringify(buildDocumentSnapshot({ activeHub })));
  legacy.project.viewState = { activeView: 'report', focusedChart: 'pareto' }; // a teammate's saved context

  resetStores();
  hydrateDocumentSnapshot(legacy);
  // the importer's working context is their own — never the saver's
  expect(useProjectStore.getState().viewState).toBeNull();
  // negative control: durable content DID hydrate
  expect(useProjectStore.getState().rawData.length).toBeGreaterThan(0);
});
```

In `projectStore.test.ts`, REPLACE the two tests (locate by test name):

`'setViewState updates viewState and marks unsaved'` →

```typescript
it('setViewState updates viewState WITHOUT marking unsaved (PO-8a: view changes are not document changes)', () => {
  useProjectStore.getState().setViewState({ activeView: 'analyze', isFindingsOpen: true });
  expect(useProjectStore.getState().viewState).toEqual({
    activeView: 'analyze',
    isFindingsOpen: true,
  });
  expect(useProjectStore.getState().hasUnsavedChanges).toBe(false);
});
```

`'loadProject restores viewState'` →

```typescript
it('loadProject resets viewState to null — even when a legacy payload still carries one (PO-8a strip)', () => {
  useProjectStore.getState().setViewState({ activeView: 'analyze' });
  const legacyPayload = {
    projectId: 'p1',
    projectName: 'Test',
    rawData: [],
    outcome: null,
    factors: [],
    specs: {},
    analysisMode: 'standard',
    viewState: { activeView: 'report' }, // legacy field — no longer in SerializedProject
  };
  useProjectStore.getState().loadProject(legacyPayload as never);
  expect(useProjectStore.getState().viewState).toBeNull();
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm --filter @variscout/stores test -- "projectStore|documentSnapshot"`
Expected: FAIL — snapshot still carries viewState; setViewState still marks unsaved; loadProject still restores viewState

- [ ] **Step 3: Implement the strip**

In `packages/stores/src/documentSnapshot.ts`:

1. Add `'viewState'` to the `ProjectDocumentSnapshot` Omit list:

```typescript
export type ProjectDocumentSnapshot = Omit<
  SerializedProject,
  'findings' | 'categories' | 'hypotheses' | 'causalLinks' | 'processContext' | 'entryScenario'
> &
  Pick<ProjectState, 'entryScenario' | 'processContext'>;
```

(After step 2 below removes `viewState` from `SerializedProject`, no Omit change is needed — verify the type no longer carries it via the Step 5 grep instead. If `SerializedProject` keeps the member for any reason, add `| 'viewState'` to the Omit. The END state is: `ProjectDocumentSnapshot` has NO `viewState`.)

2. Delete the line `viewState: state.viewState,` from `buildProjectSnapshot` (currently `documentSnapshot.ts:96`).

In `packages/stores/src/projectStore.ts`:

3. Delete the member `viewState?: ViewState | null;` from `SerializedProject` (currently `:93`). `ProjectState.viewState: ViewState | null` STAYS (in-memory session state), as does the `ViewState` import.

4. In `loadProject`, change `viewState: serialized.viewState ?? null,` (currently `:353`) to:

```typescript
      viewState: null, // PO-8a: per-user session state — never adopted from a document
```

5. Change the setter (currently `:428`) from `setViewState: setAndMark(set, 'viewState'),` to:

```typescript
  // PO-8a: view changes are session-only — they no longer dirty the document
  setViewState: value => set(() => ({ viewState: value })),
```

- [ ] **Step 4: Run the stores suite**

Run: `pnpm --filter @variscout/stores test`
Expected: PASS

- [ ] **Step 5: Acceptance greps (the tsc-invisible guard for the stores package)**

```bash
grep -n "viewState" packages/stores/src/documentSnapshot.ts
# Expected: ZERO hits
grep -n "serialized.viewState" packages/stores/src/projectStore.ts
# Expected: ZERO hits
grep -rn "project\.viewState\|\.project\.viewState" packages apps --include="*.ts" --include="*.tsx" | grep -v __tests__ | grep -v "useProjectStore\|projectStore"
# Expected: ZERO hits (no consumer reads viewState OFF A SNAPSHOT; store reads are fine)
```

- [ ] **Step 6: Commit**

```bash
git add packages/stores/src/documentSnapshot.ts packages/stores/src/projectStore.ts packages/stores/src/__tests__/projectStore.test.ts packages/stores/src/__tests__/documentSnapshot.test.ts
git commit -m "feat(po-8a): viewState strip — session-only, never serialized; tab switches no longer dirty the document"
```

---

### Task 5: Azure error surfacing — load-path messages + import error preservation (TDD)

**Model:** Sonnet.

**Files:**

- Modify: `apps/azure/src/hooks/useProjectLoader.ts`
- Modify: `apps/azure/src/lib/persistence.ts` (`importFromFile`)
- Create: `apps/azure/src/hooks/__tests__/useProjectLoader.test.ts`

- [ ] **Step 1: Write the failing test**

`apps/azure/src/hooks/__tests__/useProjectLoader.test.ts`:

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  DocumentSnapshotCorruptError,
  DocumentSnapshotVersionMismatchError,
} from '@variscout/stores';
import { useProjectLoader } from '../useProjectLoader';

vi.mock('../../services/storage', () => ({
  classifySyncError: vi.fn(() => ({ category: 'unknown' })),
}));

function baseOptions(loadProject: (id: string) => Promise<void>) {
  return {
    projectId: 'proj-1',
    hasData: false,
    isLoadingProject: false,
    startProjectLoad: vi.fn(),
    projectLoaded: vi.fn(),
    loadProject,
    onBack: vi.fn(),
  };
}

describe('useProjectLoader — PO-8a typed persistence errors', () => {
  it('a version-mismatched document surfaces the refresh-hint error with a Refresh action', async () => {
    const { result } = renderHook(() =>
      useProjectLoader(
        baseOptions(() => Promise.reject(new DocumentSnapshotVersionMismatchError(2)))
      )
    );
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current?.code).toBe('version-mismatch');
    expect(result.current?.message).toMatch(/different version/i);
    expect(result.current?.message).toMatch(/refresh/i);
    expect(result.current?.action?.label).toBe('Refresh');
  });

  it('a corrupt document surfaces the loud corrupt error', async () => {
    const { result } = renderHook(() =>
      useProjectLoader(baseOptions(() => Promise.reject(new DocumentSnapshotCorruptError())))
    );
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current?.code).toBe('corrupt');
    expect(result.current?.message).toMatch(/invalid or corrupted/i);
  });

  it('negative control: a successful load produces no error', async () => {
    const projectLoaded = vi.fn();
    const options = { ...baseOptions(() => Promise.resolve()), projectLoaded };
    const { result } = renderHook(() => useProjectLoader(options));
    await waitFor(() => expect(projectLoaded).toHaveBeenCalled());
    expect(result.current).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @variscout/azure-app test -- useProjectLoader`
Expected: FAIL — codes `'version-mismatch'`/`'corrupt'` don't exist; classified as `'unknown'`

- [ ] **Step 3: Implement**

In `apps/azure/src/hooks/useProjectLoader.ts`:

1. Add the import:

```typescript
import {
  DocumentSnapshotCorruptError,
  DocumentSnapshotVersionMismatchError,
} from '@variscout/stores';
```

2. Extend the code union + messages:

```typescript
type LoadErrorCode =
  | 'not-found'
  | 'forbidden'
  | 'plan-mismatch'
  | 'offline'
  | 'auth'
  | 'version-mismatch'
  | 'corrupt'
  | 'unknown';
```

```typescript
  'version-mismatch':
    'This project was saved by a different version of VariScout. Refresh the app to update, then try again.',
  corrupt: "This project's saved data is invalid or corrupted and cannot be opened.",
```

(add both entries to `ERROR_MESSAGES`.)

3. At the TOP of the `.catch(error => { ... })` body, before `classifySyncError`:

```typescript
if (error instanceof DocumentSnapshotVersionMismatchError) {
  setLoadError({
    code: 'version-mismatch',
    message: ERROR_MESSAGES['version-mismatch'],
    action: { label: 'Refresh', onClick: () => window.location.reload() },
  });
  return;
}
if (error instanceof DocumentSnapshotCorruptError) {
  setLoadError({
    code: 'corrupt',
    message: ERROR_MESSAGES.corrupt,
    action: { label: 'Go to Dashboard', onClick: onBack },
  });
  return;
}
```

In `apps/azure/src/lib/persistence.ts`, in `importFromFile`, change the catch so typed errors survive the promise boundary (locate the `reject(new Error('Invalid file format'))` line):

```typescript
try {
  const content = e.target?.result as string;
  resolve({ kind: 'document-snapshot', file: parseDocumentSnapshotVrs(content) });
} catch (err) {
  reject(err instanceof Error ? err : new Error('Invalid file format'));
}
```

- [ ] **Step 4: Run the test + the azure suite**

Run: `pnpm --filter @variscout/azure-app test -- useProjectLoader`
Expected: PASS
Then: `pnpm --filter @variscout/azure-app test`
Expected: PASS (if any Azure test hydrates a partial snapshot fixture and now throws — fix the fixture to full shape, never the validator)

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/hooks/useProjectLoader.ts apps/azure/src/hooks/__tests__/useProjectLoader.test.ts apps/azure/src/lib/persistence.ts
git commit -m "feat(po-8a): Azure load errors — version-mismatch refresh hint + corrupt message; import preserves typed errors"
```

---

### Task 6: PWA import decline messages (TDD — component change expected to be NIL)

**Model:** Sonnet.

**Files:**

- Modify: `apps/pwa/src/components/__tests__/VrsButtons.test.tsx`
- Possibly modify: `apps/pwa/src/components/VrsImportButton.tsx` (only if the tests prove a change is needed)

- [ ] **Step 1: Write the tests** (append to the existing `VrsImportButton` describe in `VrsButtons.test.tsx`; follow the file's existing import-button test idiom for firing the file input — locate the existing import test for the pattern)

```typescript
it('PO-8a: a version-mismatched .vrs is DECLINED with the refresh-hint message; onImport never fires', async () => {
  const onImport = vi.fn();
  const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
  render(<VrsImportButton onImport={onImport} />);

  useProjectStore.setState({ ...getProjectInitialState(), rawData: [{ x: 1 }], outcome: 'x' });
  const fileJson = JSON.parse(buildDocumentSnapshotVrs({ activeHub: hub }));
  fileJson.documentSnapshot.schemaVersion = 2;
  const file = new File([JSON.stringify(fileJson)], 'newer.vrs', { type: 'application/json' });

  const input = screen.getByTestId('vrs-import-input');
  fireEvent.change(input, { target: { files: [file] } });

  await waitFor(() => expect(alertSpy).toHaveBeenCalled());
  expect(alertSpy.mock.calls[0][0]).toMatch(/different version/i);
  expect(alertSpy.mock.calls[0][0]).toMatch(/refresh/i);
  expect(onImport).not.toHaveBeenCalled(); // decline = no partial load
  alertSpy.mockRestore();
});

it('PO-8a: a corrupt .vrs is declined with the invalid-format message', async () => {
  const onImport = vi.fn();
  const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
  render(<VrsImportButton onImport={onImport} />);

  const file = new File(['{"not":"a vrs"}'], 'corrupt.vrs', { type: 'application/json' });
  fireEvent.change(screen.getByTestId('vrs-import-input'), { target: { files: [file] } });

  await waitFor(() => expect(alertSpy).toHaveBeenCalled());
  expect(alertSpy.mock.calls[0][0]).toMatch(/invalid file format/i);
  expect(onImport).not.toHaveBeenCalled();
  alertSpy.mockRestore();
});
```

- [ ] **Step 2: Run**

Run: `pnpm --filter @variscout/pwa test -- VrsButtons`
Expected: PASS already — the typed error's user-facing message flows through the existing `window.alert('Could not import .vrs: ' + err.message)`. These tests are the load-bearing PROOF of the decline UX (`feedback_load_bearing_tests`: onImport-not-called is the negative control). If they fail, fix `VrsImportButton`'s catch minimally — do NOT add new UI machinery (spec §16).

- [ ] **Step 3: Run the PWA suite**

Run: `pnpm --filter @variscout/pwa test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/pwa/src/components/__tests__/VrsButtons.test.tsx
git commit -m "test(po-8a): PWA .vrs decline messages — version-mismatch refresh hint + corrupt, onImport negative controls"
```

---

### Task 7: Doc propagation (on-branch)

**Model:** Haiku.

**Files:**

- Modify: `packages/stores/CLAUDE.md`
- Modify: `docs/superpowers/plans/2026-06-04-process-ops-extraction-master-plan.md` (PO-8a row — add the Sub-plan link line)

- [ ] **Step 1: stores CLAUDE.md** — in the `## Investigation domain` section's persistence bullet (the one starting "Persistence: the analyze snapshot"), append two sentences:

```
`hydrateDocumentSnapshot` strict-asserts via `validateDocumentSnapshot` (PO-8a): version mismatch and corrupt shape throw typed errors (`DocumentSnapshotVersionMismatchError` / `DocumentSnapshotCorruptError`) — validation is deliberately SHALLOW (structural only, no field-level assertions; ADR-091). `viewState` is per-user session state: it lives in `ProjectState` but NEVER serializes into `DocumentSnapshot`, and `setViewState` does not mark unsaved (PO-8a strip).
```

- [ ] **Step 2: master plan** — at the START of the PR-PO-8a section body (before the `- **Goal:**` line), add:

```markdown
- **Sub-plan:** [`2026-06-05-po-8a-schema-hardening.md`](2026-06-05-po-8a-schema-hardening.md).
```

- [ ] **Step 3: Commit**

```bash
git add packages/stores/CLAUDE.md docs/superpowers/plans/2026-06-04-process-ops-extraction-master-plan.md
git commit -m "docs(po-8a): stores CLAUDE.md persistence notes + master-plan sub-plan link"
```

---

### Task 8: Controller gate (NOT an implementer task)

- [ ] Acceptance greps (repeat Task 4 Step 5 set) all clean
- [ ] `bash scripts/pr-ready-check.sh` green (full turbo build is the only sweep covering every package's build tsconfig — ui/apps cover their test files)
- [ ] `pnpm --filter @variscout/azure-app test` AND `pnpm --filter @variscout/pwa test` green (deletion-cascade lesson: app suites, not just builds)
- [ ] `--chrome` verify (per the amended chrome matrix): PWA import of a hand-built `schemaVersion: 2` `.vrs` → alert carries the refresh-hint copy; corrupt `.vrs` → invalid-format alert; Azure (if reachable without the known native-dialog walls): switch tabs/charts in an open document → Save state does NOT go dirty; make a durable edit → dirty appears
- [ ] Final adversarial Opus branch review (non-negotiable — attack surfaces: validator over-rejection of legitimate quick-analysis/hub-less snapshots; the PO-7 documented-by-test still green for the RIGHT reason; fixture full-shape fixes that quietly weaken assertions; any remaining snapshot-facet viewState reference; the co-versioned envelope decision recorded)
- [ ] PR → `gh pr merge --merge --delete-branch` → DELIVERED flips on main (master-plan row + decision-log + memory)

---

## Verification summary (spec §13 as amended by §16)

| Acceptance criterion                                                       | Proven by                                                           |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Version-mismatched document refused with refresh-hint message              | Task 1/2/3 mismatch tests; Task 5 loader test; Task 6 PWA test      |
| Negative control: current-version document loads normally + stays editable | Task 1 accept test; Task 3 hydrate-valid test; Task 5 no-error test |
| Corrupt document throws loudly at the shared seam                          | Task 1/3 corrupt tests; Task 5 corrupt loader test                  |
| Teammate's import no longer adopts saver's tabs/charts                     | Task 4 anti-hijack test (legacy-viewState hydrate → null)           |
| Negative control: durable content still round-trips                        | Task 4 anti-hijack test (rawData hydrated)                          |
| Tab/chart switch no longer dirties; durable change still does              | Task 4 fingerprint test                                             |
| No field-level deepening (ADR-091)                                         | PO-7 legacy-scope documented-by-test stays green (Task 2 Step 4)    |
| Gate + both app suites green                                               | Task 8                                                              |
