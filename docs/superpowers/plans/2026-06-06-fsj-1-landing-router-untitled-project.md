---
tier: ephemeral
purpose: build
title: 'FSJ-1 — PWA landing router + Untitled project'
status: active
layer: spec
audience: human
related:
  - docs/superpowers/plans/2026-06-06-first-session-journey-master-plan.md
  - docs/superpowers/specs/2026-06-06-first-session-journey-design.md
---

# FSJ-1: PWA Landing Router + Untitled Project Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fresh data entry in the PWA (sample / `.vrs` / manual) lands on the Process tab with an auto-created, auto-activated Untitled project — the altitude-rule landing (spec §1) with the E1 T6 gate dissolved by construction.

**Architecture:** A pure helper (`ensureSessionProject`) guarantees every session hub carries a live `ImprovementProject`; thin App.tsx wiring calls it at each fresh-entry point, auto-activates via the existing `useActiveIPContext`, and routes `panels.showFrame()` unless embed mode. The canvas already self-routes b0 (no map) vs b2 (map) via `detectScopeFromMap` — we route to the tab, never to a sub-state. Paste is untouched in this PR (FSJ-2). The Bottleneck sample gains a seeded `processMap` so the flagship demo lands at L2.

**Tech Stack:** React + Zustand (PWA app shell), `@variscout/core` factories, Vitest + RTL (happy-dom patterns per `writing-tests` skill).

**Branch:** `feat/fsj-1-landing-untitled-project` in own worktree `.worktrees/feat-fsj-1-landing-untitled-project/`.

**Read first:** spec §1 (landing rule + applicability), §3 (Untitled model), §4.1; wireframe `docs/02-journeys/wireframes/b0-landing.md`; `apps/pwa/CLAUDE.md` (R6d session-only — do NOT add persistence); `packages/stores/CLAUDE.md`.

---

### Task 1: Shared `PWA_USER_ID` constant

**Files:**

- Create: `apps/pwa/src/lib/pwaUser.ts`
- Modify: `apps/pwa/src/components/ProjectsTabView.tsx:12`, `apps/pwa/src/components/views/ImprovementView.tsx:26`

- [ ] **Step 1: Create the constant module**

```ts
// apps/pwa/src/lib/pwaUser.ts
/**
 * The PWA has no AD identity (free tier, ADR-012 browser-only).
 * One synthetic local analyst id, shared by every surface that needs a
 * `currentUserId` (project membership Lead, Wall comments, IP factory).
 * Previously duplicated as local consts in ProjectsTabView + ImprovementView.
 */
export const PWA_USER_ID = 'analyst@local';
```

- [ ] **Step 2: Replace the two local duplicates with imports**

In `apps/pwa/src/components/ProjectsTabView.tsx` delete line 12 (`const PWA_USER_ID = 'analyst@local';`) and add to imports: `import { PWA_USER_ID } from '../lib/pwaUser';`
In `apps/pwa/src/components/views/ImprovementView.tsx` delete line 26 and add: `import { PWA_USER_ID } from '../../lib/pwaUser';`

- [ ] **Step 3: Verify the touched suites pass**

Run: `pnpm --filter @variscout/pwa test -- --run src/components/ProjectsTabView src/components/views/ImprovementView`
Expected: PASS (rename-only).

- [ ] **Step 4: Commit**

```bash
git add apps/pwa/src/lib/pwaUser.ts apps/pwa/src/components/ProjectsTabView.tsx apps/pwa/src/components/views/ImprovementView.tsx
git commit -m "refactor(pwa): lift PWA_USER_ID to shared lib/pwaUser"
```

---

### Task 2: `ensureSessionProject` — the pure Untitled-project guarantee

**Files:**

- Create: `apps/pwa/src/lib/ensureSessionProject.ts`
- Test: `apps/pwa/src/lib/__tests__/ensureSessionProject.test.ts`

The PWA session hub may be `null` (sample/manual entry today) or exist without an `improvementProject` (quick analysis). After this helper, the hub exists and carries a live IP — which makes `useActiveIPContext(sessionHub)` non-null and dissolves the `FrameView.tsx:430` E1 T6 gate **by construction** (do NOT touch the gate; it stays as the bootstrap fallback per the E1 T5 comment at `FrameView.tsx:424-429`).

- [ ] **Step 1: Write the failing tests**

```ts
// apps/pwa/src/lib/__tests__/ensureSessionProject.test.ts
import { describe, it, expect } from 'vitest';
import { ensureSessionProject } from '../ensureSessionProject';
import type { ProcessHub } from '@variscout/core/processHub';

const NOW = () => 1_750_000_000_000;

describe('ensureSessionProject', () => {
  it('creates a hub + Untitled project when no hub exists', () => {
    const hub = ensureSessionProject(null, 'Case: The Bottleneck', NOW);
    expect(hub.id).toBeTruthy();
    expect(hub.improvementProject).toBeTruthy();
    expect(hub.improvementProject!.metadata.title).toBe('Case: The Bottleneck');
    expect(hub.improvementProject!.hubId).toBe(hub.id);
    expect(hub.improvementProject!.deletedAt).toBeNull();
    // Lead member is the local analyst
    expect(hub.improvementProject!.metadata.members[0]).toMatchObject({
      role: 'lead',
      userId: 'analyst@local',
    });
  });

  it('adds an IP to an existing hub without touching other hub fields', () => {
    const existing = {
      id: 'hub-1',
      name: 'My hub',
      createdAt: 1,
      deletedAt: null,
      processGoal: 'reduce cycle time',
    } as unknown as ProcessHub;
    const hub = ensureSessionProject(existing, 'Untitled project', NOW);
    expect(hub.id).toBe('hub-1');
    expect(hub.name).toBe('My hub');
    expect(hub.processGoal).toBe('reduce cycle time');
    expect(hub.improvementProject!.hubId).toBe('hub-1');
  });

  it('is a no-op when a live IP already exists (reconstruct-not-create, spec §1)', () => {
    const withIP = ensureSessionProject(null, 'Imported scenario', NOW);
    const again = ensureSessionProject(withIP, 'SHOULD NOT APPLY', NOW);
    expect(again).toBe(withIP); // referential no-op
    expect(again.improvementProject!.metadata.title).toBe('Imported scenario');
  });

  it('replaces a soft-deleted IP with a fresh one', () => {
    const withIP = ensureSessionProject(null, 'Old', NOW);
    const softDeleted = {
      ...withIP,
      improvementProject: { ...withIP.improvementProject!, deletedAt: 123 },
    } as ProcessHub;
    const hub = ensureSessionProject(softDeleted, 'Fresh', NOW);
    expect(hub.improvementProject!.deletedAt).toBeNull();
    expect(hub.improvementProject!.metadata.title).toBe('Fresh');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @variscout/pwa test -- --run src/lib/__tests__/ensureSessionProject`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// apps/pwa/src/lib/ensureSessionProject.ts
import { createNewIP } from '@variscout/core';
import type { ProcessHub } from '@variscout/core/processHub';
import { PWA_USER_ID } from './pwaUser';

/**
 * The Untitled-project guarantee (first-session spec §3): every data entry
 * yields a session hub carrying a live ImprovementProject, auto-named for
 * the entry (sample name / .vrs envelope name / 'Untitled project').
 * Pure: returns the input hub unchanged (same reference) when a live IP
 * already exists — .vrs imports reconstruct, never re-wrap (spec §1).
 * Session-only per R6d: nothing here persists.
 */
export function ensureSessionProject(
  hub: ProcessHub | null,
  title: string,
  now: () => number = Date.now
): ProcessHub {
  if (hub?.improvementProject && hub.improvementProject.deletedAt === null) {
    return hub;
  }
  const base = hub ?? {
    id: crypto.randomUUID(),
    name: '',
    createdAt: now(),
    deletedAt: null as null,
  };
  const ip = createNewIP({
    hubId: base.id,
    title,
    currentUserId: PWA_USER_ID,
    now,
  });
  return { ...base, improvementProject: ip, updatedAt: now() } as ProcessHub;
}
```

NOTE for the implementer: verify the exact import path for `createNewIP` (`packages/core/src/improvementProject/factories.ts:54`) — it may be exported from the core barrel or a sub-path; check `packages/core/package.json#exports` and match existing usage (`grep -rn "createNewIP" apps/ packages/ui`). Verify `ProcessHub.improvementProject` is the field name used at `App.tsx:1287` (it is: `sessionHub?.improvementProject`). If `createNewIP`'s `CreateNewIPInput` requires fields beyond those shown (read `factories.ts:20-54`), supply minimal honest values — never invent ceremony content.

- [ ] **Step 4: Run tests to verify pass**

Run: `pnpm --filter @variscout/pwa test -- --run src/lib/__tests__/ensureSessionProject`
Expected: 4 PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/lib/ensureSessionProject.ts apps/pwa/src/lib/__tests__/ensureSessionProject.test.ts
git commit -m "feat(pwa): ensureSessionProject — the Untitled-project guarantee (spec §3)"
```

---

### Task 3: Landing on sample load (incl. `?sample=` deep link) + embed exemption

**Files:**

- Modify: `apps/pwa/src/App.tsx` (the `HomeScreen` wiring at `:1282`, the `?sample=` effect at `:494-499`)
- Test: `apps/pwa/src/__tests__/sampleLanding.integration.test.tsx` (create — model the harness on `apps/pwa/src/components/views/__tests__/FrameView.b0.integration.test.tsx`; read it FIRST and reuse its provider/mock setup verbatim)

- [ ] **Step 1: Add the landing handler in `AppMain` (App.tsx, near `handleImportVrs` ~:720)**

```tsx
// First-session landing (spec §1): fresh data entry lands on the Process tab.
// The canvas self-routes b0 (no map) vs b2 (seeded map) via detectScopeFromMap —
// we route to the TAB only. Embed mode is exempt (spec §1 applicability):
// course-page iframes want the chart, never the journey spine.
const handleLoadSample = useCallback(
  (sample: SampleDataset) => {
    ingestion.loadSample(sample);
    const hub = ensureSessionProject(sessionHub, sample.name);
    setSessionHub(hub);
    activeIPContext.setActiveIP(hub.improvementProject!.id);
    if (!isEmbedMode) panels.showFrame();
  },
  [ingestion, sessionHub, setSessionHub, activeIPContext, isEmbedMode, panels]
);
```

Add the import: `import { ensureSessionProject } from './lib/ensureSessionProject';`
NOTE: `isEmbedMode` is the existing flag set at `App.tsx:482-484`; `activeIPContext` exists at `App.tsx:181`. `SampleDataset` type is already imported (the `?sample=` effect uses it). If `setActiveIP`'s scope isn't yet established when the hub was just created, follow the call order above (set hub FIRST) — `useActiveIPContext(sessionHub)` re-derives on the next render and `setActiveIP` writes through `useActiveIPStore` keyed by hub id; verify against `packages/hooks/src/useActiveIPContext.ts:52-100` and adjust to pass the new hub id if the hook exposes a scoped setter.

- [ ] **Step 2: Wire it — HomeScreen + deep link**

At `App.tsx:1282` change `onLoadSample={ingestion.loadSample}` → `onLoadSample={handleLoadSample}`.
In the `?sample=` effect (`App.tsx:494-499`) replace the `ingestion.loadSample(sample)` call with `handleLoadSample(sample)` (the embed guard inside the handler keeps `?embed=true&sample=…` on the chart surface). Check the effect's dependency array — add `handleLoadSample`.

- [ ] **Step 3: Write the integration test**

```tsx
// apps/pwa/src/__tests__/sampleLanding.integration.test.tsx
// Harness: copy the provider/mock scaffolding from
// src/components/views/__tests__/FrameView.b0.integration.test.tsx (read it first).
// Assert the three landing behaviors:
import { describe, it, expect, beforeEach } from 'vitest';
import { usePanelsStore } from '../features/panels/panelsStore';

describe('sample landing (first-session spec §1)', () => {
  beforeEach(() => {
    usePanelsStore.setState({ activeView: 'explore' }); // store reset per writing-tests skill
  });

  it('loading a sample routes to the Process tab (frame view)', async () => {
    // render AppMain via the harness, click data-testid `sample-featured-bottleneck`
    // (SampleSection.tsx:96 convention), then:
    expect(usePanelsStore.getState().activeView).toBe('frame');
  });

  it('creates + activates the Untitled project named after the sample', async () => {
    // after the same click: sessionHub.improvementProject.metadata.title === 'Case: The Bottleneck'
    // and the FrameView E1 T6 guidance ("Process work happens inside a project")
    // is NOT in the document.
  });

  it('?embed=true keeps the chart surface (no frame routing)', async () => {
    // render with embed flag forced (see App.tsx:482-484 for how the flag is read;
    // the harness can set window.location.search before render per existing
    // embed tests — grep "embed" in src/__tests__ for the established pattern)
    expect(usePanelsStore.getState().activeView).not.toBe('frame');
  });
});
```

Flesh the bodies out against the real harness — these are load-bearing assertions, not presence checks (`feedback_load_bearing_tests`): the embed test is the negative control.

- [ ] **Step 4: Run the new + adjacent suites**

Run: `pnpm --filter @variscout/pwa test -- --run src/__tests__/sampleLanding src/components/views/__tests__/FrameView`
Expected: PASS, including the untouched FrameView suites (the gate dissolves by construction — no gate edits).

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/App.tsx apps/pwa/src/__tests__/sampleLanding.integration.test.tsx
git commit -m "feat(pwa): sample entry lands on Process tab with auto-activated Untitled project (spec §1, §3)"
```

---

### Task 4: `.vrs` import — reconstruct-not-create + landing

**Files:**

- Modify: `apps/pwa/src/App.tsx:721-727` (`handleImportVrs`)
- Test: extend `apps/pwa/src/__tests__/sampleLanding.integration.test.tsx` (or the existing import test file if one covers `handleImportVrs` — `grep -rn "handleImportVrs\|ImportVrs" apps/pwa/src --include="*.test.tsx"` first; extend, don't duplicate)

- [ ] **Step 1: Extend the handler**

```tsx
// .vrs import: hydrate, reconstruct, land (spec §1 applicability).
// Reconstruct-not-create: the envelope's own project is the wrapper —
// only a project-less scenario gets an Untitled wrap. v1 envelope only
// (wedge no-back-compat; old .vrs versions are nobody's problem).
const handleImportVrs = useCallback(
  (imported: DocumentSnapshotVrsFile) => {
    hydrateDocumentSnapshot(imported.documentSnapshot);
    const reconstructed = reconstructProcessHubFromDocumentSnapshot(imported.documentSnapshot);
    const hub = ensureSessionProject(
      reconstructed,
      imported.documentSnapshot.project?.projectName ?? reconstructed?.name ?? 'Untitled project'
    );
    setSessionHub(hub);
    activeIPContext.setActiveIP(hub.improvementProject!.id);
    if (!isEmbedMode) panels.showFrame();
  },
  [setSessionHub, activeIPContext, isEmbedMode, panels]
);
```

NOTE: `ensureSessionProject` returns the reconstructed hub **unchanged** when the envelope carried a live IP (Task 2 no-op branch) — that IS reconstruct-not-create. Verify the exact optional-chain shape of `documentSnapshot.project?.projectName` against `packages/core/src/.../documentSnapshot.ts:215` and reuse its fallback order.

- [ ] **Step 2: Add the two tests**

(a) importing a `.vrs` whose snapshot carries an `improvementProject` keeps its id + title (no Untitled wrap) and lands on `frame`; (b) a project-less `.vrs` gets an Untitled project named from `projectName`. Build minimal `DocumentSnapshotVrsFile` fixtures — copy the smallest existing fixture from the documentSnapshot round-trip tests (`grep -rln "documentSnapshot" packages/core/src --include="*.test.ts"` and reuse their builders).

- [ ] **Step 3: Run + commit**

Run: `pnpm --filter @variscout/pwa test -- --run src/__tests__/sampleLanding`
Expected: PASS.

```bash
git add apps/pwa/src/App.tsx apps/pwa/src/__tests__/sampleLanding.integration.test.tsx
git commit -m "feat(pwa): .vrs import reconstructs its project and lands by the altitude rule (spec §1)"
```

---

### Task 5: Manual entry landing

**Files:**

- Modify: `apps/pwa/src/App.tsx` (the `ManualEntry` wiring at `:1276-1279`)

Manual entry already bypasses the wizard (`handleManualDataAnalyze` writes outcome/factors directly — `usePasteImportFlow.ts:623-656`); it just never routes. Wrap it:

- [ ] **Step 1: Add the wrapper next to `handleLoadSample`**

```tsx
const handleManualAnalyze = useCallback(
  (...args: Parameters<typeof importFlow.handleManualDataAnalyze>) => {
    importFlow.handleManualDataAnalyze(...args);
    const hub = ensureSessionProject(sessionHub, 'Untitled project');
    setSessionHub(hub);
    activeIPContext.setActiveIP(hub.improvementProject!.id);
    if (!isEmbedMode) panels.showFrame();
  },
  [importFlow, sessionHub, setSessionHub, activeIPContext, isEmbedMode, panels]
);
```

Wire at `:1277`: `onAnalyze={handleManualAnalyze}`. (Read `handleManualDataAnalyze`'s signature at `usePasteImportFlow.ts:623` and type the wrapper to match — `Parameters<>` keeps it honest.)

- [ ] **Step 2: One assertion added to the integration suite** (manual analyze → `activeView === 'frame'` + Untitled project exists), run it, then commit:

```bash
git add apps/pwa/src/App.tsx apps/pwa/src/__tests__/sampleLanding.integration.test.tsx
git commit -m "feat(pwa): manual entry lands on Process tab with Untitled project"
```

---

### Task 6: Seed The Bottleneck's process map

**Files:**

- Modify: `packages/data/src/samples/bottleneck.ts:43-60` (the `config` object)
- Test: `packages/data/src/samples/__tests__/bottleneck.test.ts` (create, or extend the existing samples test — `ls packages/data/src/**/__tests__/` first)

- [ ] **Step 1: Verify the Step factor's distinct values**

Run: `node -e "const {SAMPLES}=require('./packages/data/dist/index.cjs');" ` — OR simpler, read the data literal in `bottleneck.ts` and list distinct `Step` values. Expected: 5 values (the boxplot showed `Step 1`…`Step 5`, n=30 each). **Node names below MUST byte-match the data values** — this is what makes per-step drill work.

- [ ] **Step 2: Add the `processMap` to `config`** (shape verbatim from the shipped seeder contract — `analyze-showcase.ts:340-358` is the reference):

```ts
processMap: {
  version: 1,
  ctsColumn: 'Cycle_Time_sec',
  nodes: [
    { id: 'step-1', name: 'Step 1', order: 0, ctqColumn: 'Cycle_Time_sec' },
    { id: 'step-2', name: 'Step 2', order: 1, ctqColumn: 'Cycle_Time_sec' },
    { id: 'step-3', name: 'Step 3', order: 2, ctqColumn: 'Cycle_Time_sec' },
    { id: 'step-4', name: 'Step 4', order: 3, ctqColumn: 'Cycle_Time_sec' },
    { id: 'step-5', name: 'Step 5', order: 4, ctqColumn: 'Cycle_Time_sec' },
  ],
  tributaries: [
    { id: 'trib-shift', stepId: 'step-2', column: 'Shift', role: 'shift' },
  ],
  subgroupAxes: [],
  hunches: [
    { id: 'h-step2', text: 'Step 2 is the constraint — widest spread', tributaryId: 'trib-shift' },
  ],
  createdAt: '2026-06-06T00:00:00.000Z',
  updatedAt: '2026-06-06T00:00:00.000Z',
},
```

(Adjust node `name`s to the verified distinct values from Step 1. `loadSample` already seeds/clears this — `useDataIngestion.ts:439-447`; no seeder changes.)

- [ ] **Step 3: Test** — assert `bottleneck.config.processMap.nodes` has 5 nodes whose names equal the data's distinct `Step` values (compute from `sample.data` in the test — load-bearing, survives data edits), and `ctsColumn === config.outcome`. Run `pnpm --filter @variscout/data test -- --run`, expect PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/data/src/samples/bottleneck.ts packages/data/src/samples/__tests__/bottleneck.test.ts
git commit -m "feat(data): seed The Bottleneck process map — flagship sample lands at L2 (spec §4.1)"
```

---

### Task 7: Full verification + PR

- [ ] **Step 1: Targeted suites** — `pnpm --filter @variscout/pwa test -- --run` + `pnpm --filter @variscout/data test -- --run`. Expected: green. (Implementer scope ends here per `feedback_implementer_long_bash_pitfall` — the full sweep is controller-level.)
- [ ] **Step 2 (controller): `bash scripts/pr-ready-check.sh`** — green before PR.
- [ ] **Step 3 (controller): `--chrome` walk** — fresh PWA: (a) load The Bottleneck → lands on Process tab, **map visible at L2, no project gate**; header context shows the sample-named project; (b) load a map-less sample → lands at b0 with Y/X pre-confirmed; (c) `?sample=bottleneck&embed=true` → chart surface, no Process routing; (d) Explore/Analyze unaffected; (e) paste → **unchanged** (wizard path, FSJ-2's job).
- [ ] **Step 4: PR** — `gh pr create` (title `feat(fsj-1): PWA landing router + Untitled project`), spec+quality reviewer pair verifies against wireframes `b0-landing` + `altitude-model` (spec §11), then `gh pr merge --merge --delete-branch`.

---

## Self-review notes (done at plan-write)

- **Spec coverage (FSJ-1 slice):** §1 landing rule + applicability (T3/T4/T5 + embed in T3) ✓ · §3 auto-create/auto-activate (T2/T3) ✓ · §1 reconstruct-not-create (T2 no-op + T4) ✓ · §4.1 seeded maps (T6) ✓ · E1 T6 dissolve-by-construction (T2 note — no gate edits) ✓. Paste/hatch/no-Y/multi-outcome = FSJ-2 by design.
- **Known unknowns flagged inline** (not placeholders — verification steps with expected findings): `createNewIP` export path; `useActiveIPContext` scoped-setter shape; existing import-test file; `Step` distinct values.
- **Type consistency:** `ensureSessionProject(hub, title, now?)` used identically in T3/T4/T5; `PWA_USER_ID` from T1 used in T2.
