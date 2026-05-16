---
tier: ephemeral
purpose: build
title: Improvement Project V1 — Implementation Plan (SUPERSEDED 2026-05-09)
audience: human
category: implementation
status: superseded
superseded-by: docs/superpowers/specs/2026-05-09-response-path-system-v1-design.md
last-reviewed: 2026-05-09
related:
  - docs/superpowers/specs/2026-05-08-improvement-project-v1-design.md
  - docs/superpowers/specs/2026-05-03-variscout-vision-design.md
  - docs/superpowers/plans/2026-05-07-canvas-pr8-8a-mode-aware-ctas.md
---

# Improvement Project V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the canvas PR8-8a Charter stub destinations with a hub-level **Improvement Project** — a QC Story-shaped 8-section narrative form that doubles as the project's final report — free-tier-active in PWA + Azure, with V1 paid signoff workflow.

**Architecture:** New aggregate `ImprovementProject` lives in `@variscout/core/improvementProject` (sub-path export), persists via separate Dexie table per F3 (PWA + Azure both), HubAction-dispatched. Form UI is a single shared `@variscout/ui/components/ImprovementProject/` component composition (8 section components + form shell + progress indicator + signoff section), wired into both apps via thin per-app `ImprovementProjectPanel` shells (~30 LOC each). Sections reuse VariScout primitives (Issue Statement, OutcomeSpec, SuspectedCause, ImprovementIdea, SustainmentRecord) via FK rather than duplicating; auto-population is additive, manual entry always available.

**Tech Stack:** TypeScript 6, React 18, Vitest, React Testing Library, Tailwind v4, Dexie, Zustand 4, `@variscout/core/i18n` (typed message catalogs), `@variscout/hooks` `useTier`.

**Branch:** `improvement-project-v1` (3 PRs off this branch).

**Resolves spec §12 open questions inline:**

- **OQ1 Store ownership:** new `useImprovementProjectStore` (Zustand, document layer per F4) — separate from `useProjectStore`/`useInvestigationStore`. (Slice 1 Task 7.)
- **OQ2 Save semantics:** auto-save — every field change dispatches an `IMPROVEMENT_PROJECT_UPDATE` patch immediately. No explicit Save button. Matches Notion / Linear "always saved" pattern. Future work may add debouncing if write-amplification becomes an issue, but V1 ships unbatched dispatches (Dexie writes are fast; no measurable cost expected).
- **OQ3 Snapshot refresh affordance:** yes — "↻ Refresh from live" inline button next to Section 1 (Issue) and Section 3 (Problem Statement) when snapshot drifts from current `liveStatement` / `problemCondition.summary`. Drift detected by string comparison.
- **OQ4 Section 2 snapshot scope:** capability summary (mean/sigma/Cpk for the active outcome) + Pareto top-5 + recent findings (last 5 by `updatedAt`).
- **OQ5 Hub-overview placement:** new "Improvement Projects" section appended below investigations list in the Hub overview (PWA Dashboard / Azure HubComposer).
- **OQ6 List sort/filter:** default sort by `updatedAt` desc; status filter chips ("Drafts" / "Active" / "Closed") at the section header.

---

## Slice plan

| Slice               | PR     | Tasks | Scope                                                                                         |
| ------------------- | ------ | ----- | --------------------------------------------------------------------------------------------- |
| 1 — Core engine     | PR-IP1 | 1–7   | `@variscout/core` types/actions/store + PWA + Azure persistence handlers + .vrs verification  |
| 2 — UI primitives   | PR-IP2 | 8–14  | `@variscout/ui/components/ImprovementProject/` form shell + 8 section components + signoff    |
| 3 — App integration | PR-IP3 | 15–19 | Per-app shells, replace 8a stubs, Hub-overview entry, vision spec amendment, E2E verification |

**Partial-integration policy** (per `feedback_partial_integration_policy`):

- Slice 1 ships standalone — types + actions + persistence work without UI. PR-IP1 is mergeable to main on its own.
- Slice 2 mounts components on Storybook-equivalent dev pages or basic Vitest renders. PR-IP2 mergeable without app integration; consumer apps gain access to the components but don't yet wire them.
- Slice 3 wires Slice 2's components into per-app shells, replaces 8a stubs, adds Hub-overview entry. PR-IP3 is mergeable independently and produces the user-facing feature.

**Each PR uses `superpowers:subagent-driven-development`** per `feedback_subagent_driven_default`. Sonnet implementer + Sonnet spec/quality reviewers per task; Opus only for final-PR code-reviewer.

---

## Slice 1 — Core engine (Tasks 1–7, PR-IP1)

### Task 1: Create `ImprovementProject` types + sub-path export

**Files:**

- Create: `packages/core/src/improvementProject.ts`
- Create: `packages/core/src/__tests__/improvementProject.test.ts`
- Modify: `packages/core/package.json` (exports field — add `./improvementProject`)
- Modify: `packages/core/tsconfig.json` (paths — add `@variscout/core/improvementProject`)

- [ ] **Step 1: Write the failing test**

Create `packages/core/src/__tests__/improvementProject.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import type {
  ImprovementProject,
  ImprovementProjectStatus,
  ImprovementProjectMetadata,
  ImprovementProjectIssueSection,
  ImprovementProjectGoalSection,
} from '../improvementProject';

describe('ImprovementProject types', () => {
  it('compiles a minimal ImprovementProject with required fields only', () => {
    const status: ImprovementProjectStatus = 'draft';
    const metadata: ImprovementProjectMetadata = { title: 'Heads 5–8 Cpk lift Q3' };
    const project: ImprovementProject = {
      id: 'ip-1',
      hubId: 'hub-1',
      createdAt: 1_700_000_000_000,
      deletedAt: null,
      status,
      metadata,
      sections: {
        issue: {} as ImprovementProjectIssueSection,
        currentSituation: {},
        problemStatement: {},
        goal: {} as ImprovementProjectGoalSection,
        causeAnalysis: {},
        countermeasures: {},
        effectConfirmation: {},
        standardization: {},
      },
      updatedAt: 1_700_000_000_000,
    };
    expect(project.metadata.title).toBe('Heads 5–8 Cpk lift Q3');
    expect(project.status).toBe('draft');
  });

  it('accepts optional FK fields on sections', () => {
    const goal: ImprovementProjectGoalSection = {
      outcomeSpecId: 'outcome-1',
      baseline: 0.6,
      target: 1.33,
      deadline: '2026-09-30T00:00:00Z',
    };
    expect(goal.outcomeSpecId).toBe('outcome-1');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/core test improvementProject
```

Expected: FAIL — `Cannot find module '../improvementProject'`.

- [ ] **Step 3: Implement the type**

Create `packages/core/src/improvementProject.ts`:

```ts
import type { EntityBase } from './identity';
import type {
  ProcessHub,
  OutcomeSpec,
  ProcessParticipantRef,
  ProcessHubInvestigation,
} from './processHub';
import type { SuspectedCause, Finding, ImprovementIdea } from './findings/types';
import type { SustainmentRecord, ControlHandoff } from './sustainment';

export type ImprovementProjectStatus = 'draft' | 'active' | 'closed';

export interface ImprovementProjectMetadata {
  title: string;
  businessCase?: string;
  financialImpact?: { amount?: number; currency: string };
  team?: Array<{
    role: 'champion' | 'sponsor' | 'projectLead' | 'teamMember' | 'processOwner';
    person: ProcessParticipantRef;
  }>;
  investigationId?: ProcessHubInvestigation['id'];
}

export interface ImprovementProjectIssueSection {
  snapshotText?: string;
  manualText?: string;
  snapshottedAt?: string;
}

export interface ImprovementProjectCurrentSituationSection {
  narrative?: string;
}

export interface ImprovementProjectProblemStatementSection {
  snapshotText?: string;
  manualText?: string;
  snapshottedAt?: string;
}

export interface ImprovementProjectGoalSection {
  outcomeSpecId?: OutcomeSpec['id'];
  baseline?: number;
  target?: number;
  deadline?: string;
  freeText?: string;
}

export interface ImprovementProjectCauseAnalysisSection {
  suspectedCauseId?: SuspectedCause['id'];
  findingIds?: Finding['id'][];
  narrative?: string;
}

export interface ImprovementProjectCountermeasuresSection {
  improvementIdeaIds?: ImprovementIdea['id'][];
  narrative?: string;
}

export interface ImprovementProjectEffectConfirmationSection {
  verificationFindingIds?: Finding['id'][];
  confirmedAt?: string;
}

export interface ImprovementProjectStandardizationSection {
  sustainmentRecordId?: SustainmentRecord['id'];
  controlHandoffId?: ControlHandoff['id'];
  reflectionNarrative?: string;
}

export interface ImprovementProjectSignoff {
  requestedAt?: number;
  approvedAt?: number;
  approvedBy?: ProcessParticipantRef;
}

export interface ImprovementProject extends EntityBase {
  hubId: ProcessHub['id'];
  status: ImprovementProjectStatus;
  metadata: ImprovementProjectMetadata;
  sections: {
    issue: ImprovementProjectIssueSection;
    currentSituation: ImprovementProjectCurrentSituationSection;
    problemStatement: ImprovementProjectProblemStatementSection;
    goal: ImprovementProjectGoalSection;
    causeAnalysis: ImprovementProjectCauseAnalysisSection;
    countermeasures: ImprovementProjectCountermeasuresSection;
    effectConfirmation: ImprovementProjectEffectConfirmationSection;
    standardization: ImprovementProjectStandardizationSection;
  };
  updatedAt: number;
  signoff?: ImprovementProjectSignoff;
}
```

Add to `packages/core/package.json` `exports` field:

```json
"./improvementProject": "./src/improvementProject.ts"
```

Add to `packages/core/tsconfig.json` paths if applicable (check existing pattern — newer packages use exports field only).

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @variscout/core test improvementProject
```

Expected: PASS — both tests green.

- [ ] **Step 5: Commit**

```bash
git checkout -b improvement-project-v1
git add packages/core/src/improvementProject.ts packages/core/src/__tests__/improvementProject.test.ts packages/core/package.json
git commit -m "feat(core): add ImprovementProject type + sub-path export"
```

---

### Task 2: Add `ImprovementProjectAction` to `HubAction` union

**Files:**

- Create: `packages/core/src/actions/improvementProjectActions.ts`
- Modify: `packages/core/src/actions/HubAction.ts` (extend union)
- Modify: `packages/core/src/actions/__tests__/exhaustiveness.test.ts` (add new cases)

- [ ] **Step 1: Write the failing test**

Add to `packages/core/src/actions/__tests__/exhaustiveness.test.ts` (inside the existing `_exhaustive` switch, before the default `assertNever`):

```ts
    // Improvement Project
    case 'IMPROVEMENT_PROJECT_CREATE':
      return;
    case 'IMPROVEMENT_PROJECT_UPDATE':
      return;
    case 'IMPROVEMENT_PROJECT_ARCHIVE':
      return;
```

Also add an explicit assertion test:

```ts
import type { ImprovementProjectAction } from '../improvementProjectActions';

describe('ImprovementProjectAction', () => {
  it('discriminates by kind', () => {
    const create: ImprovementProjectAction = {
      kind: 'IMPROVEMENT_PROJECT_CREATE',
      hubId: 'hub-1',
      project: {} as never, // placeholder shape; full ImprovementProject in Task 1
    };
    const update: ImprovementProjectAction = {
      kind: 'IMPROVEMENT_PROJECT_UPDATE',
      projectId: 'ip-1',
      patch: { status: 'active' },
    };
    const archive: ImprovementProjectAction = {
      kind: 'IMPROVEMENT_PROJECT_ARCHIVE',
      projectId: 'ip-1',
    };
    expect([create.kind, update.kind, archive.kind]).toEqual([
      'IMPROVEMENT_PROJECT_CREATE',
      'IMPROVEMENT_PROJECT_UPDATE',
      'IMPROVEMENT_PROJECT_ARCHIVE',
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/core test exhaustiveness
```

Expected: FAIL — `Cannot find module '../improvementProjectActions'` and TS errors on the new case branches (no such kinds in union).

- [ ] **Step 3: Implement actions + extend union**

Create `packages/core/src/actions/improvementProjectActions.ts`:

```ts
import type { ProcessHub } from '../processHub';
import type { ImprovementProject } from '../improvementProject';

export type ImprovementProjectAction =
  | {
      kind: 'IMPROVEMENT_PROJECT_CREATE';
      hubId: ProcessHub['id'];
      project: ImprovementProject;
    }
  | {
      kind: 'IMPROVEMENT_PROJECT_UPDATE';
      projectId: ImprovementProject['id'];
      patch: Partial<Omit<ImprovementProject, 'id' | 'createdAt' | 'hubId'>>;
    }
  | {
      kind: 'IMPROVEMENT_PROJECT_ARCHIVE';
      projectId: ImprovementProject['id'];
    };
```

Modify `packages/core/src/actions/HubAction.ts`:

```ts
import type { OutcomeAction } from './outcomeActions';
import type { EvidenceAction } from './evidenceActions';
import type { EvidenceSourceAction } from './evidenceSourceActions';
import type { InvestigationAction } from './investigationActions';
import type { FindingAction } from './findingActions';
import type { QuestionAction } from './questionActions';
import type { CausalLinkAction } from './causalLinkActions';
import type { SuspectedCauseAction } from './suspectedCauseActions';
import type { HubMetaAction } from './hubMetaActions';
import type { CanvasAction } from './canvasActions';
import type { ImprovementProjectAction } from './improvementProjectActions';

export type HubAction =
  | OutcomeAction
  | EvidenceAction
  | EvidenceSourceAction
  | InvestigationAction
  | FindingAction
  | QuestionAction
  | CausalLinkAction
  | SuspectedCauseAction
  | HubMetaAction
  | CanvasAction
  | ImprovementProjectAction;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @variscout/core test exhaustiveness
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/actions/improvementProjectActions.ts packages/core/src/actions/HubAction.ts packages/core/src/actions/__tests__/exhaustiveness.test.ts
git commit -m "feat(core): add ImprovementProjectAction (CREATE/UPDATE/ARCHIVE) to HubAction union"
```

---

### Task 3: Extend `ProcessHub` with `improvementProjects?` field

**Files:**

- Modify: `packages/core/src/processHub.ts` (add optional field)
- Modify: `packages/core/src/__tests__/processHub.test.ts` (add field test)

- [ ] **Step 1: Write the failing test**

Add to `packages/core/src/__tests__/processHub.test.ts`:

```ts
import type { ImprovementProject } from '../improvementProject';

describe('ProcessHub.improvementProjects', () => {
  it('accepts an optional improvementProjects array', () => {
    const project: ImprovementProject = {
      id: 'ip-1',
      hubId: 'hub-1',
      createdAt: 1,
      deletedAt: null,
      status: 'draft',
      metadata: { title: 'Test' },
      sections: {
        issue: {},
        currentSituation: {},
        problemStatement: {},
        goal: {},
        causeAnalysis: {},
        countermeasures: {},
        effectConfirmation: {},
        standardization: {},
      },
      updatedAt: 1,
    };
    const hub: ProcessHub = {
      id: 'hub-1',
      name: 'Test',
      createdAt: 0,
      deletedAt: null,
      improvementProjects: [project],
    };
    expect(hub.improvementProjects).toHaveLength(1);
  });

  it('treats improvementProjects as optional (absent on existing hubs)', () => {
    const hub: ProcessHub = {
      id: 'hub-2',
      name: 'No improvements',
      createdAt: 0,
      deletedAt: null,
    };
    expect(hub.improvementProjects).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/core test processHub
```

Expected: FAIL — TS error: `Object literal may only specify known properties, and 'improvementProjects' does not exist in type 'ProcessHub'`.

- [ ] **Step 3: Implement field**

Modify `packages/core/src/processHub.ts` — add to `ProcessHub` interface (after `reviewSignal`):

```ts
  /**
   * In-memory hydrated projection of this Hub's Improvement Projects.
   * Persistence lives in a separate Dexie table; this field is populated
   * on Hub read and serialized on .vrs export. Absent in queries that
   * don't hydrate; default to [] when absent. See ADR + spec
   * `docs/superpowers/specs/2026-05-08-improvement-project-v1-design.md` D11/D12.
   */
  improvementProjects?: import('./improvementProject').ImprovementProject[];
```

Use the inline `import(...)` type to avoid creating a value cycle.

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @variscout/core test processHub
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/processHub.ts packages/core/src/__tests__/processHub.test.ts
git commit -m "feat(core): add ProcessHub.improvementProjects? hydrated projection field"
```

---

### Task 4: PWA persistence — Dexie schema + applyAction handlers

**Files:**

- Modify: `apps/pwa/src/db/schema.ts` (add `improvementProjects` table)
- Modify: `apps/pwa/src/persistence/applyAction.ts` (add 3 case branches)
- Modify: `apps/pwa/src/persistence/PwaHubRepository.ts` (hydrate `improvementProjects` on read)
- Create: `apps/pwa/src/persistence/__tests__/applyAction.improvementProject.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/pwa/src/persistence/__tests__/applyAction.improvementProject.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { PwaDatabase } from '../../db/schema';
import { applyAction } from '../applyAction';
import type { ImprovementProject } from '@variscout/core/improvementProject';

const PROJECT: ImprovementProject = {
  id: 'ip-1',
  hubId: 'hub-1',
  createdAt: 1,
  deletedAt: null,
  status: 'draft',
  metadata: { title: 'Test Project' },
  sections: {
    issue: {},
    currentSituation: {},
    problemStatement: {},
    goal: {},
    causeAnalysis: {},
    countermeasures: {},
    effectConfirmation: {},
    standardization: {},
  },
  updatedAt: 1,
};

describe('applyAction — IMPROVEMENT_PROJECT_*', () => {
  let db: PwaDatabase;
  beforeEach(() => {
    db = new PwaDatabase('test-db-' + Math.random());
  });

  it('CREATE inserts a new project row', async () => {
    await applyAction(db, {
      kind: 'IMPROVEMENT_PROJECT_CREATE',
      hubId: 'hub-1',
      project: PROJECT,
    });
    const rows = await db.improvementProjects.toArray();
    expect(rows).toEqual([PROJECT]);
  });

  it('UPDATE patches the existing row', async () => {
    await applyAction(db, {
      kind: 'IMPROVEMENT_PROJECT_CREATE',
      hubId: 'hub-1',
      project: PROJECT,
    });
    await applyAction(db, {
      kind: 'IMPROVEMENT_PROJECT_UPDATE',
      projectId: 'ip-1',
      patch: { status: 'active', metadata: { title: 'Updated Title' } },
    });
    const row = await db.improvementProjects.get('ip-1');
    expect(row?.status).toBe('active');
    expect(row?.metadata.title).toBe('Updated Title');
  });

  it('ARCHIVE soft-deletes the row', async () => {
    await applyAction(db, {
      kind: 'IMPROVEMENT_PROJECT_CREATE',
      hubId: 'hub-1',
      project: PROJECT,
    });
    await applyAction(db, { kind: 'IMPROVEMENT_PROJECT_ARCHIVE', projectId: 'ip-1' });
    const row = await db.improvementProjects.get('ip-1');
    expect(row?.deletedAt).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/pwa test applyAction.improvementProject
```

Expected: FAIL — `db.improvementProjects` undefined; `Unhandled action: IMPROVEMENT_PROJECT_CREATE`.

- [ ] **Step 3: Implement schema + handlers**

Modify `apps/pwa/src/db/schema.ts`:

Add to the row-types section:

```ts
import type { ImprovementProject } from '@variscout/core/improvementProject';
export type ImprovementProjectRow = ImprovementProject;
```

Add to `PwaDatabase` class (alongside other table declarations):

```ts
  improvementProjects!: Table<ImprovementProjectRow, ImprovementProject['id']>;
```

In the `version(1).stores({...})` definition, add:

```ts
  improvementProjects: 'id, hubId, deletedAt, status, updatedAt',
```

Modify `apps/pwa/src/persistence/applyAction.ts` — add cases inside the switch (before the final `assertNever`):

```ts
    // -----------------------------------------------------------------------
    // Improvement Project — separate Dexie table; UPDATE merges section/meta
    // patches with a `updatedAt = Date.now()` bump.
    // -----------------------------------------------------------------------

    case 'IMPROVEMENT_PROJECT_CREATE': {
      const { hubId } = action;
      const hub = await db.hubs.get(hubId);
      if (!hub) {
        throw new Error(
          `IMPROVEMENT_PROJECT_CREATE: hub '${hubId}' not found`
        );
      }
      await db.improvementProjects.add(action.project);
      return;
    }

    case 'IMPROVEMENT_PROJECT_UPDATE': {
      const existing = await db.improvementProjects.get(action.projectId);
      if (!existing) return; // idempotent on missing
      const merged = {
        ...existing,
        ...action.patch,
        // Deep-merge sections to avoid clobbering unspecified sections
        sections: action.patch.sections
          ? { ...existing.sections, ...action.patch.sections }
          : existing.sections,
        // Deep-merge metadata similarly
        metadata: action.patch.metadata
          ? { ...existing.metadata, ...action.patch.metadata }
          : existing.metadata,
        updatedAt: Date.now(),
      };
      await db.improvementProjects.put(merged);
      return;
    }

    case 'IMPROVEMENT_PROJECT_ARCHIVE': {
      const existing = await db.improvementProjects.get(action.projectId);
      if (!existing) return; // idempotent
      await db.improvementProjects.update(action.projectId, {
        deletedAt: Date.now(),
        updatedAt: Date.now(),
      });
      return;
    }
```

Modify `apps/pwa/src/persistence/PwaHubRepository.ts` — extend the hub-read path to hydrate `improvementProjects`. Find the `joinHub` (or equivalent) function and add:

```ts
const projects = await db.improvementProjects
  .where('hubId')
  .equals(hub.id)
  .filter(p => p.deletedAt === null)
  .toArray();
hub.improvementProjects = projects;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @variscout/pwa test applyAction.improvementProject
```

Expected: PASS — all 3 tests green.

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/db/schema.ts apps/pwa/src/persistence/applyAction.ts apps/pwa/src/persistence/PwaHubRepository.ts apps/pwa/src/persistence/__tests__/applyAction.improvementProject.test.ts
git commit -m "feat(pwa): persistence handlers for IMPROVEMENT_PROJECT_* actions"
```

---

### Task 5: Azure persistence — Dexie schema + applyAction handlers

**Files:**

- Modify: `apps/azure/src/db/schema.ts` (add `improvementProjects` table)
- Modify: `apps/azure/src/persistence/applyAction.ts` (add 3 case branches)
- Modify: `apps/azure/src/persistence/AzureHubRepository.ts` (hydrate on read)
- Create: `apps/azure/src/persistence/__tests__/applyAction.improvementProject.test.ts`

Mirror Task 4's pattern. The Azure schema bumps to its current version + 1 (check `apps/azure/src/db/schema.ts` for the current version number; F3.6-β shipped most recent change).

- [ ] **Step 1: Write the failing test**

Same shape as Task 4 step 1, but importing from Azure paths:

```ts
import { db } from '../../db/schema';
import { applyAction } from '../applyAction';
import type { ImprovementProject } from '@variscout/core/improvementProject';
// ... same PROJECT fixture, same 3 tests
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/azure-app test applyAction.improvementProject
```

Expected: FAIL.

- [ ] **Step 3: Implement schema + handlers**

Modify `apps/azure/src/db/schema.ts`:

Add to row types:

```ts
import type { ImprovementProject } from '@variscout/core/improvementProject';
export type ImprovementProjectRow = ImprovementProject;
```

Add to db class declaration:

```ts
improvementProjects!: Table<ImprovementProjectRow, ImprovementProject['id']>;
```

Bump to next version number with a `.stores()` extension. Example (replace `N` with current+1):

```ts
this.version(N).stores({
  improvementProjects: 'id, hubId, deletedAt, status, updatedAt',
});
```

Modify `apps/azure/src/persistence/applyAction.ts` — add the same 3 case branches as Task 4 step 3 (verbatim — just swap `db.improvementProjects` to use the imported `db` constant; Azure pattern uses `import { db } from '../db/schema'` rather than passing as parameter).

Modify `apps/azure/src/persistence/AzureHubRepository.ts` — extend hub-read path to hydrate `improvementProjects` (same pattern as PWA).

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @variscout/azure-app test applyAction.improvementProject
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/db/schema.ts apps/azure/src/persistence/applyAction.ts apps/azure/src/persistence/AzureHubRepository.ts apps/azure/src/persistence/__tests__/applyAction.improvementProject.test.ts
git commit -m "feat(azure): persistence handlers for IMPROVEMENT_PROJECT_* actions"
```

---

### Task 6: `.vrs` round-trip integration test

**Files:**

- Modify: `packages/core/src/serialization/__tests__/vrsRoundTrip.test.ts` (extend existing test file; create if absent)

The actual `vrsExport` / `vrsImport` functions don't change — they serialize the full `ProcessHub` already, and our type extension (Task 3) makes `improvementProjects?` flow through automatically. This task verifies the round-trip and confirms backward-compatibility (older .vrs files without the field deserialize correctly).

- [ ] **Step 1: Write the failing test**

Add to `packages/core/src/serialization/__tests__/vrsRoundTrip.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { vrsExport } from '../vrsExport';
import { vrsImport } from '../vrsImport';
import type { ProcessHub } from '../../processHub';
import type { ImprovementProject } from '../../improvementProject';

describe('.vrs round-trip — Improvement Projects', () => {
  it('serializes and deserializes improvementProjects field', () => {
    const project: ImprovementProject = {
      id: 'ip-1',
      hubId: 'hub-1',
      createdAt: 1,
      deletedAt: null,
      status: 'active',
      metadata: { title: 'Round-trip Test' },
      sections: {
        issue: { manualText: 'Test issue' },
        currentSituation: { narrative: 'Test situation' },
        problemStatement: {},
        goal: { target: 1.33 },
        causeAnalysis: {},
        countermeasures: {},
        effectConfirmation: {},
        standardization: {},
      },
      updatedAt: 1,
    };
    const hub: ProcessHub = {
      id: 'hub-1',
      name: 'Test Hub',
      createdAt: 0,
      deletedAt: null,
      improvementProjects: [project],
    };
    const json = vrsExport(hub);
    const parsed = vrsImport(json);
    expect(parsed.hub.improvementProjects).toEqual([project]);
  });

  it('imports a .vrs without improvementProjects field (backward-compatible)', () => {
    const legacyJson = JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      hub: {
        id: 'hub-legacy',
        name: 'Legacy Hub',
        createdAt: 0,
        deletedAt: null,
      },
    });
    const parsed = vrsImport(legacyJson);
    expect(parsed.hub.improvementProjects).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/core test vrsRoundTrip
```

Expected: PASS likely already (since types flow through), but verify. If file doesn't exist, FAIL on missing file.

- [ ] **Step 3: Implement (no code change needed — the type extension carries through)**

If both tests pass on the first run (because `vrsExport` JSON.stringify's the entire hub including the new field): no code change needed. Note this in the commit.

If the legacy backward-compat test fails: that means `vrsImport` is enforcing the absence somewhere. Inspect; likely no issue.

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @variscout/core test vrsRoundTrip
```

Expected: PASS — both tests green.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/serialization/__tests__/vrsRoundTrip.test.ts
git commit -m "test(core): .vrs round-trip preserves ProcessHub.improvementProjects"
```

---

### Task 7: `useImprovementProjectStore` Zustand store

**Files:**

- Create: `packages/stores/src/improvementProjectStore.ts`
- Create: `packages/stores/src/__tests__/improvementProjectStore.test.ts`
- Modify: `packages/stores/src/index.ts` (re-export)

- [ ] **Step 1: Write the failing test**

Create `packages/stores/src/__tests__/improvementProjectStore.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useImprovementProjectStore } from '../improvementProjectStore';
import type { ImprovementProject } from '@variscout/core/improvementProject';

const PROJECT: ImprovementProject = {
  id: 'ip-1',
  hubId: 'hub-1',
  createdAt: 1,
  deletedAt: null,
  status: 'draft',
  metadata: { title: 'Test' },
  sections: {
    issue: {},
    currentSituation: {},
    problemStatement: {},
    goal: {},
    causeAnalysis: {},
    countermeasures: {},
    effectConfirmation: {},
    standardization: {},
  },
  updatedAt: 1,
};

describe('useImprovementProjectStore', () => {
  beforeEach(() => {
    useImprovementProjectStore.setState({ projectsByHub: {} });
  });

  it('hydrates projects for a hub', () => {
    useImprovementProjectStore.getState().setProjectsForHub('hub-1', [PROJECT]);
    expect(useImprovementProjectStore.getState().projectsByHub['hub-1']).toEqual([PROJECT]);
  });

  it('selects projects by hubId', () => {
    useImprovementProjectStore.getState().setProjectsForHub('hub-1', [PROJECT]);
    const projects = useImprovementProjectStore.getState().getProjectsForHub('hub-1');
    expect(projects).toEqual([PROJECT]);
  });

  it('returns empty array for unknown hubId', () => {
    const projects = useImprovementProjectStore.getState().getProjectsForHub('hub-x');
    expect(projects).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/stores test improvementProjectStore
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement store**

Create `packages/stores/src/improvementProjectStore.ts`:

```ts
import { create } from 'zustand';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import type { ProcessHub } from '@variscout/core/processHub';

/**
 * Document-layer store for Improvement Projects per F4.
 * Persistence flows through pwaHubRepository / azureHubRepository (HubAction
 * dispatch); this store holds the in-memory hydrated projection for UI reads.
 *
 * @see docs/superpowers/specs/2026-05-08-improvement-project-v1-design.md
 */
interface ImprovementProjectStoreState {
  /** Projects indexed by hubId. Each entry is the live, non-archived list for that hub. */
  projectsByHub: Record<ProcessHub['id'], ImprovementProject[]>;
  setProjectsForHub: (hubId: ProcessHub['id'], projects: ImprovementProject[]) => void;
  getProjectsForHub: (hubId: ProcessHub['id']) => ImprovementProject[];
  /** Replace a single project in-place (after a dispatched UPDATE). */
  upsertProject: (project: ImprovementProject) => void;
  /** Soft-delete a project by id (after a dispatched ARCHIVE). */
  removeProject: (projectId: ImprovementProject['id']) => void;
}

export const useImprovementProjectStore = create<ImprovementProjectStoreState>((set, get) => ({
  projectsByHub: {},
  setProjectsForHub: (hubId, projects) =>
    set(state => ({ projectsByHub: { ...state.projectsByHub, [hubId]: projects } })),
  getProjectsForHub: hubId => get().projectsByHub[hubId] ?? [],
  upsertProject: project =>
    set(state => {
      const current = state.projectsByHub[project.hubId] ?? [];
      const idx = current.findIndex(p => p.id === project.id);
      const next =
        idx >= 0
          ? [...current.slice(0, idx), project, ...current.slice(idx + 1)]
          : [...current, project];
      return { projectsByHub: { ...state.projectsByHub, [project.hubId]: next } };
    }),
  removeProject: projectId =>
    set(state => {
      const next = { ...state.projectsByHub };
      for (const hubId of Object.keys(next)) {
        next[hubId] = next[hubId].filter(p => p.id !== projectId);
      }
      return { projectsByHub: next };
    }),
}));
```

Re-export from `packages/stores/src/index.ts`:

```ts
export { useImprovementProjectStore } from './improvementProjectStore';
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @variscout/stores test improvementProjectStore
```

Expected: PASS.

- [ ] **Step 5: Commit + push Slice 1**

```bash
git add packages/stores/src/improvementProjectStore.ts packages/stores/src/__tests__/improvementProjectStore.test.ts packages/stores/src/index.ts
git commit -m "feat(stores): useImprovementProjectStore Zustand store"
git push -u origin improvement-project-v1
```

**Open PR-IP1 (Slice 1 — Core engine).** Run `bash scripts/pr-ready-check.sh` first; require all green before merge. Subagent code-reviewer pass on Opus before squash-merge.

---

## Slice 2 — UI primitives (Tasks 8–14, PR-IP2)

> **PR-IP2 prerequisite:** PR-IP1 merged to `main`. Pull main into `improvement-project-v1` before starting Slice 2.

### Task 8: `ImprovementProjectForm` shell + ProgressIndicator + HeaderMetadata + CollapsibleSection

**Files:**

- Create: `packages/ui/src/components/ImprovementProject/ImprovementProjectForm.tsx`
- Create: `packages/ui/src/components/ImprovementProject/ProgressIndicator.tsx`
- Create: `packages/ui/src/components/ImprovementProject/HeaderMetadata.tsx`
- Create: `packages/ui/src/components/ImprovementProject/CollapsibleSection.tsx`
- Create: `packages/ui/src/components/ImprovementProject/__tests__/ImprovementProjectForm.test.tsx`
- Create: `packages/ui/src/components/ImprovementProject/__tests__/ProgressIndicator.test.tsx`
- Create: `packages/ui/src/components/ImprovementProject/__tests__/CollapsibleSection.test.tsx`
- Modify: `packages/ui/src/index.ts` (export the form)

- [ ] **Step 1: Write the failing tests**

Create `packages/ui/src/components/ImprovementProject/__tests__/ProgressIndicator.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProgressIndicator } from '../ProgressIndicator';

describe('ProgressIndicator', () => {
  it('renders 8 segments', () => {
    render(<ProgressIndicator filled={3} total={8} />);
    expect(screen.getAllByTestId('progress-segment')).toHaveLength(8);
  });

  it('marks the first N segments as filled', () => {
    render(<ProgressIndicator filled={5} total={8} />);
    const segments = screen.getAllByTestId('progress-segment');
    expect(segments.slice(0, 5).every(s => s.dataset.filled === 'true')).toBe(true);
    expect(segments.slice(5).every(s => s.dataset.filled === 'false')).toBe(true);
  });
});
```

Create `packages/ui/src/components/ImprovementProject/__tests__/ImprovementProjectForm.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ImprovementProjectForm } from '../ImprovementProjectForm';
import type { ImprovementProject } from '@variscout/core/improvementProject';

const PROJECT: ImprovementProject = {
  id: 'ip-1',
  hubId: 'hub-1',
  createdAt: 1,
  deletedAt: null,
  status: 'draft',
  metadata: { title: 'Test' },
  sections: {
    issue: {},
    currentSituation: {},
    problemStatement: {},
    goal: {},
    causeAnalysis: {},
    countermeasures: {},
    effectConfirmation: {},
    standardization: {},
  },
  updatedAt: 1,
};

describe('ImprovementProjectForm', () => {
  it('renders the form title', () => {
    render(<ImprovementProjectForm project={PROJECT} onPatch={() => {}} onBack={() => {}} />);
    expect(screen.getByText(/improvement project/i)).toBeInTheDocument();
  });

  it('renders the progress indicator', () => {
    render(<ImprovementProjectForm project={PROJECT} onPatch={() => {}} onBack={() => {}} />);
    expect(screen.getAllByTestId('progress-segment')).toHaveLength(8);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter @variscout/ui test ImprovementProject
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Implement scaffolding**

Create `packages/ui/src/components/ImprovementProject/ProgressIndicator.tsx`:

```tsx
interface ProgressIndicatorProps {
  filled: number;
  total: number;
}

/**
 * 8-segment progress bar above the Improvement Project form.
 * Filled segments indicate which sections have content beyond the auto-snapshot.
 */
export function ProgressIndicator({ filled, total }: ProgressIndicatorProps) {
  return (
    <div className="flex gap-1" role="progressbar" aria-valuenow={filled} aria-valuemax={total}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          data-testid="progress-segment"
          data-filled={String(i < filled)}
          className={`h-1 flex-1 rounded-sm ${i < filled ? 'bg-accent' : 'bg-edge'}`}
        />
      ))}
    </div>
  );
}
```

Create `packages/ui/src/components/ImprovementProject/HeaderMetadata.tsx`:

```tsx
import type { ImprovementProject } from '@variscout/core/improvementProject';

interface HeaderMetadataProps {
  metadata: ImprovementProject['metadata'];
  status: ImprovementProject['status'];
  onMetadataChange: (patch: Partial<ImprovementProject['metadata']>) => void;
  onStatusChange: (status: ImprovementProject['status']) => void;
}

export function HeaderMetadata({
  metadata,
  status,
  onMetadataChange,
  onStatusChange,
}: HeaderMetadataProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-edge pb-4">
      <input
        type="text"
        value={metadata.title}
        onChange={e => onMetadataChange({ title: e.target.value })}
        className="bg-transparent text-2xl font-semibold focus:outline-none"
        placeholder="Project title"
        aria-label="Project title"
      />
      <div className="flex items-center gap-2 text-sm">
        <select
          value={status}
          onChange={e => onStatusChange(e.target.value as ImprovementProject['status'])}
          className="border border-edge rounded px-2 py-0.5"
          aria-label="Status"
        >
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </select>
        <textarea
          value={metadata.businessCase ?? ''}
          onChange={e => onMetadataChange({ businessCase: e.target.value })}
          className="flex-1 border border-edge rounded px-2 py-1"
          placeholder="Business case (optional)"
          aria-label="Business case"
          rows={2}
        />
      </div>
      {/* Team + financial impact + linked investigation editors are simpler controls — implementation per design spec §4.1 */}
    </div>
  );
}
```

Create `packages/ui/src/components/ImprovementProject/ImprovementProjectForm.tsx`:

```tsx
import type { ImprovementProject } from '@variscout/core/improvementProject';
import { ProgressIndicator } from './ProgressIndicator';
import { HeaderMetadata } from './HeaderMetadata';

interface ImprovementProjectFormProps {
  project: ImprovementProject;
  onPatch: (patch: Partial<ImprovementProject>) => void;
  onBack: () => void;
  /** Optional — when provided, auto-population reads from these. */
  hubContext?: {
    issueStatementLive?: string;
    problemConditionLive?: string;
    // additional fields wired by section components in later tasks
  };
}

function countFilledSections(project: ImprovementProject): number {
  let filled = 0;
  if (project.sections.issue.manualText || project.sections.issue.snapshotText) filled++;
  if (project.sections.currentSituation.narrative) filled++;
  if (
    project.sections.problemStatement.manualText ||
    project.sections.problemStatement.snapshotText
  )
    filled++;
  if (
    project.sections.goal.outcomeSpecId ||
    project.sections.goal.target ||
    project.sections.goal.freeText
  )
    filled++;
  if (project.sections.causeAnalysis.suspectedCauseId || project.sections.causeAnalysis.narrative)
    filled++;
  if (
    project.sections.countermeasures.improvementIdeaIds?.length ||
    project.sections.countermeasures.narrative
  )
    filled++;
  if (project.sections.effectConfirmation.confirmedAt) filled++;
  if (
    project.sections.standardization.sustainmentRecordId ||
    project.sections.standardization.reflectionNarrative
  )
    filled++;
  return filled;
}

/**
 * Improvement Project form — 8-section narrative with progressive disclosure.
 * Section components are added in Tasks 9–13; this shell is the scaffold.
 */
export function ImprovementProjectForm({ project, onPatch, onBack }: ImprovementProjectFormProps) {
  const filled = countFilledSections(project);
  return (
    <div data-testid="improvement-project-form" className="flex flex-col gap-4 p-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-lg font-semibold">Improvement Project</h1>
        <button onClick={onBack} className="text-sm text-content-secondary underline">
          Back
        </button>
      </div>
      <p className="text-sm text-content-secondary">A problem-to-sustainment narrative</p>
      <ProgressIndicator filled={filled} total={8} />
      <HeaderMetadata
        metadata={project.metadata}
        status={project.status}
        onMetadataChange={patch => onPatch({ metadata: { ...project.metadata, ...patch } })}
        onStatusChange={status => onPatch({ status })}
      />
      {/* Sections 1-8 mounted in subsequent tasks */}
    </div>
  );
}
```

Create `packages/ui/src/components/ImprovementProject/CollapsibleSection.tsx`:

```tsx
import { useState, type ReactNode } from 'react';

interface CollapsibleSectionProps {
  /** Default open state on first render. */
  defaultOpen: boolean;
  /** Always-visible header label. */
  label: string;
  /** One-line collapsed-state placeholder describing what goes in this section. */
  collapsedPlaceholder: string;
  children: ReactNode;
}

/**
 * Progressive-disclosure wrapper per spec D6. Default open state is set per
 * section: 1-2 default open, 3-8 default collapsed. Click header to toggle.
 * Wrapped section components render their full content when open; the
 * collapsed-state shows just the header + a one-line placeholder.
 */
export function CollapsibleSection({
  defaultOpen,
  label,
  collapsedPlaceholder,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-edge pt-4">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-baseline gap-2 text-left"
      >
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-xs opacity-70">{open ? '▾' : '▸'}</span>
      </button>
      {open ? (
        <div className="mt-2">{children}</div>
      ) : (
        <p className="text-xs text-content-secondary italic mt-1">{collapsedPlaceholder}</p>
      )}
    </div>
  );
}
```

Add corresponding test in `__tests__/CollapsibleSection.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CollapsibleSection } from '../CollapsibleSection';

describe('CollapsibleSection', () => {
  it('shows children when defaultOpen is true', () => {
    render(
      <CollapsibleSection defaultOpen={true} label="L" collapsedPlaceholder="p">
        <div>contents</div>
      </CollapsibleSection>
    );
    expect(screen.getByText(/contents/)).toBeInTheDocument();
  });

  it('shows placeholder when defaultOpen is false', () => {
    render(
      <CollapsibleSection defaultOpen={false} label="L" collapsedPlaceholder="placeholder text">
        <div>contents</div>
      </CollapsibleSection>
    );
    expect(screen.queryByText(/contents/)).not.toBeInTheDocument();
    expect(screen.getByText(/placeholder text/)).toBeInTheDocument();
  });

  it('toggles open state on header click', () => {
    render(
      <CollapsibleSection defaultOpen={false} label="L" collapsedPlaceholder="p">
        <div>contents</div>
      </CollapsibleSection>
    );
    fireEvent.click(screen.getByRole('button', { name: /L/ }));
    expect(screen.getByText(/contents/)).toBeInTheDocument();
  });
});
```

Update `ImprovementProjectForm` to wrap each subsequent-task-mounted section with `CollapsibleSection`. Default-open logic per spec D6 + auto-expand-on-data:

```tsx
function defaultOpenFor(
  sectionKey: keyof ImprovementProject['sections'],
  project: ImprovementProject
): boolean {
  // Sections 1-2 default open per spec D6
  if (sectionKey === 'issue' || sectionKey === 'currentSituation') return true;
  // Other sections default closed but auto-open when they have data
  const s = project.sections[sectionKey];
  return Object.values(s).some(
    v => v !== undefined && v !== '' && (Array.isArray(v) ? v.length > 0 : true)
  );
}
```

Sections in subsequent tasks (9-13) wrap their content in CollapsibleSection at the form-mount site, e.g.:

```tsx
<CollapsibleSection
  defaultOpen={defaultOpenFor('issue', project)}
  label="Issue"
  collapsedPlaceholder="Write your Issue Statement, or finish FRAME — VariScout will autobuild it."
>
  <IssueSection ... />
</CollapsibleSection>
```

Add to `packages/ui/src/index.ts`:

```ts
export { ImprovementProjectForm } from './components/ImprovementProject/ImprovementProjectForm';
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm --filter @variscout/ui test ImprovementProject
```

Expected: PASS — ProgressIndicator, ImprovementProjectForm, CollapsibleSection tests all green.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/ImprovementProject/ packages/ui/src/index.ts
git commit -m "feat(ui): ImprovementProjectForm shell + ProgressIndicator + HeaderMetadata + CollapsibleSection (progressive disclosure)"
```

---

### Task 9: Section 1 (Issue) + Section 3 (Problem Statement) — snapshot+manual pattern

**Files:**

- Create: `packages/ui/src/components/ImprovementProject/sections/IssueSection.tsx`
- Create: `packages/ui/src/components/ImprovementProject/sections/ProblemStatementSection.tsx`
- Create: `packages/ui/src/components/ImprovementProject/sections/SnapshotPlusManualSection.tsx` (shared base)
- Create: `packages/ui/src/components/ImprovementProject/sections/__tests__/IssueSection.test.tsx`
- Modify: `packages/ui/src/components/ImprovementProject/ImprovementProjectForm.tsx` (mount these sections)

Sections 1 and 3 share the same shape: snapshot from VariScout (auto, refreshable) + manual text override. Extract a shared `SnapshotPlusManualSection` base.

- [ ] **Step 1: Write the failing test**

Create `packages/ui/src/components/ImprovementProject/sections/__tests__/IssueSection.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { IssueSection } from '../IssueSection';

describe('IssueSection', () => {
  it('renders the snapshot text from live source', () => {
    render(
      <IssueSection
        section={{ snapshotText: 'Live issue', snapshottedAt: '2026-05-08T00:00:00Z' }}
        liveText="Live issue"
        onChange={() => {}}
      />
    );
    expect(screen.getByText(/live issue/i)).toBeInTheDocument();
  });

  it('shows refresh button when snapshot drifts from live', () => {
    render(
      <IssueSection
        section={{ snapshotText: 'Old', snapshottedAt: '2026-04-01T00:00:00Z' }}
        liveText="New"
        onChange={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: /refresh from live/i })).toBeInTheDocument();
  });

  it('calls onChange with manual text when typed', () => {
    const onChange = vi.fn();
    render(<IssueSection section={{}} liveText={undefined} onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox', { name: /issue/i }), {
      target: { value: 'My manual text' },
    });
    expect(onChange).toHaveBeenCalledWith({ manualText: 'My manual text' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test IssueSection
```

Expected: FAIL.

- [ ] **Step 3: Implement sections**

Create `packages/ui/src/components/ImprovementProject/sections/SnapshotPlusManualSection.tsx`:

```tsx
import { useId } from 'react';

interface SnapshotPlusManualSectionProps {
  label: string;
  description: string;
  /** What's currently saved on the project */
  snapshot: { snapshotText?: string; snapshottedAt?: string; manualText?: string };
  /** Live text from VariScout (e.g., issueStatement.liveStatement). Undefined when no live source. */
  liveText: string | undefined;
  /** Section-specific placeholder when no snapshot AND no manual text exists */
  placeholder: string;
  onChange: (
    patch: Partial<{ snapshotText: string; snapshottedAt: string; manualText: string }>
  ) => void;
}

export function SnapshotPlusManualSection({
  label,
  description,
  snapshot,
  liveText,
  placeholder,
  onChange,
}: SnapshotPlusManualSectionProps) {
  const fieldId = useId();
  const hasSnapshot = !!snapshot.snapshotText;
  const drifted = hasSnapshot && liveText && snapshot.snapshotText !== liveText;
  const refreshable = !!liveText && (drifted || !hasSnapshot);

  return (
    <section className="flex flex-col gap-2 border-t border-edge pt-4">
      <header className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">{label}</h2>
        {refreshable && (
          <button
            type="button"
            onClick={() =>
              onChange({ snapshotText: liveText, snapshottedAt: new Date().toISOString() })
            }
            className="text-xs underline text-content-secondary"
          >
            ↻ Refresh from live
          </button>
        )}
      </header>
      {description && <p className="text-xs text-content-secondary">{description}</p>}
      {hasSnapshot && (
        <blockquote className="border-l-2 border-edge pl-3 text-sm text-content-secondary">
          <p>{snapshot.snapshotText}</p>
          {snapshot.snapshottedAt && (
            <p className="text-xs opacity-70 mt-1">
              Snapshot taken {new Date(snapshot.snapshottedAt).toLocaleDateString()}
            </p>
          )}
        </blockquote>
      )}
      <label className="flex flex-col gap-1">
        <span className="sr-only">{label}</span>
        <textarea
          id={fieldId}
          value={snapshot.manualText ?? ''}
          onChange={e => onChange({ manualText: e.target.value })}
          placeholder={placeholder}
          aria-label={label}
          rows={4}
          className="border border-edge rounded px-2 py-1 text-sm"
        />
      </label>
    </section>
  );
}
```

Create `packages/ui/src/components/ImprovementProject/sections/IssueSection.tsx`:

```tsx
import type { ImprovementProjectIssueSection } from '@variscout/core/improvementProject';
import { SnapshotPlusManualSection } from './SnapshotPlusManualSection';

interface IssueSectionProps {
  section: ImprovementProjectIssueSection;
  /** From useProblemStatement().liveStatement when investigation linked; undefined otherwise. */
  liveText: string | undefined;
  onChange: (patch: Partial<ImprovementProjectIssueSection>) => void;
}

export function IssueSection({ section, liveText, onChange }: IssueSectionProps) {
  return (
    <SnapshotPlusManualSection
      label="Issue"
      description="The trigger — what brought you here. Typically autobuilt from your output column + direction + first significant factor (Watson Q1/Q2/Q3)."
      snapshot={section}
      liveText={liveText}
      placeholder="Write your Issue Statement, or finish FRAME — VariScout will autobuild it from your output column + direction + first significant factor."
      onChange={onChange}
    />
  );
}
```

Create `packages/ui/src/components/ImprovementProject/sections/ProblemStatementSection.tsx`:

```tsx
import type { ImprovementProjectProblemStatementSection } from '@variscout/core/improvementProject';
import { SnapshotPlusManualSection } from './SnapshotPlusManualSection';

interface ProblemStatementSectionProps {
  section: ImprovementProjectProblemStatementSection;
  /** From processUnderstanding.problemCondition.summary; undefined when not yet defined. */
  liveText: string | undefined;
  onChange: (patch: Partial<ImprovementProjectProblemStatementSection>) => void;
}

export function ProblemStatementSection({
  section,
  liveText,
  onChange,
}: ProblemStatementSectionProps) {
  return (
    <SnapshotPlusManualSection
      label="Problem Statement"
      description="Refine the Issue with quantitative data — what specifically is wrong, by how much, where, when. Most teams fill this after reviewing the Current Situation."
      snapshot={section}
      liveText={liveText}
      placeholder="Refine the Issue with quantitative data — what specifically is wrong, by how much, where, when."
      onChange={onChange}
    />
  );
}
```

Mount in `ImprovementProjectForm.tsx` after `<HeaderMetadata />`:

```tsx
import { IssueSection } from './sections/IssueSection';
import { ProblemStatementSection } from './sections/ProblemStatementSection';

// ... inside the form return, after HeaderMetadata:
<IssueSection
  section={project.sections.issue}
  liveText={hubContext?.issueStatementLive}
  onChange={patch =>
    onPatch({ sections: { ...project.sections, issue: { ...project.sections.issue, ...patch } } })
  }
/>;
{
  /* Section 2 mounted in next task */
}
<ProblemStatementSection
  section={project.sections.problemStatement}
  liveText={hubContext?.problemConditionLive}
  onChange={patch =>
    onPatch({
      sections: {
        ...project.sections,
        problemStatement: { ...project.sections.problemStatement, ...patch },
      },
    })
  }
/>;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @variscout/ui test IssueSection
```

Expected: PASS — all 3 tests green.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/ImprovementProject/sections/
git commit -m "feat(ui): Issue + Problem Statement sections (snapshot+manual pattern)"
```

---

### Task 10: Section 2 (Current Situation) — snapshot panel + narrative

**Files:**

- Create: `packages/ui/src/components/ImprovementProject/sections/CurrentSituationSection.tsx`
- Create: `packages/ui/src/components/ImprovementProject/sections/CurrentSituationSnapshot.tsx`
- Create: `packages/ui/src/components/ImprovementProject/sections/__tests__/CurrentSituationSection.test.tsx`
- Modify: `packages/ui/src/components/ImprovementProject/ImprovementProjectForm.tsx` (mount)

- [ ] **Step 1: Write the failing test**

Create test:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CurrentSituationSection } from '../CurrentSituationSection';

describe('CurrentSituationSection', () => {
  it('renders the narrative textarea even with no snapshot', () => {
    render(<CurrentSituationSection section={{}} snapshot={undefined} onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders the snapshot panel when data is provided', () => {
    render(
      <CurrentSituationSection
        section={{}}
        snapshot={{
          capabilitySummary: 'Cpk 0.6 vs target 1.33',
          paretoTopFive: [{ category: 'Heads 5-8', count: 18 }],
          recentFindings: [{ id: 'f1', title: 'Variation high on night shift' }],
        }}
        onChange={() => {}}
      />
    );
    expect(screen.getByText(/cpk 0\.6/i)).toBeInTheDocument();
  });

  it('calls onChange when narrative is edited', () => {
    const onChange = vi.fn();
    render(<CurrentSituationSection section={{}} snapshot={undefined} onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'My interpretation' },
    });
    expect(onChange).toHaveBeenCalledWith({ narrative: 'My interpretation' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test CurrentSituationSection
```

Expected: FAIL.

- [ ] **Step 3: Implement section**

Create `packages/ui/src/components/ImprovementProject/sections/CurrentSituationSnapshot.tsx`:

```tsx
export interface CurrentSituationSnapshotData {
  capabilitySummary?: string;
  paretoTopFive?: Array<{ category: string; count: number }>;
  recentFindings?: Array<{ id: string; title: string }>;
}

interface CurrentSituationSnapshotProps {
  data: CurrentSituationSnapshotData;
}

export function CurrentSituationSnapshot({ data }: CurrentSituationSnapshotProps) {
  const hasAnything = !!(
    data.capabilitySummary ||
    data.paretoTopFive?.length ||
    data.recentFindings?.length
  );
  if (!hasAnything) return null;
  return (
    <div className="border border-edge rounded p-3 text-sm bg-surface-secondary">
      {data.capabilitySummary && (
        <p>
          <strong>Capability:</strong> {data.capabilitySummary}
        </p>
      )}
      {data.paretoTopFive && data.paretoTopFive.length > 0 && (
        <div className="mt-2">
          <p>
            <strong>Top categories:</strong>
          </p>
          <ul className="list-disc ml-5">
            {data.paretoTopFive.map(p => (
              <li key={p.category}>
                {p.category} ({p.count})
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.recentFindings && data.recentFindings.length > 0 && (
        <div className="mt-2">
          <p>
            <strong>Recent findings:</strong>
          </p>
          <ul className="list-disc ml-5">
            {data.recentFindings.map(f => (
              <li key={f.id}>{f.title}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

Create `packages/ui/src/components/ImprovementProject/sections/CurrentSituationSection.tsx`:

```tsx
import type { ImprovementProjectCurrentSituationSection } from '@variscout/core/improvementProject';
import {
  CurrentSituationSnapshot,
  type CurrentSituationSnapshotData,
} from './CurrentSituationSnapshot';

interface CurrentSituationSectionProps {
  section: ImprovementProjectCurrentSituationSection;
  snapshot: CurrentSituationSnapshotData | undefined;
  onChange: (patch: Partial<ImprovementProjectCurrentSituationSection>) => void;
}

export function CurrentSituationSection({
  section,
  snapshot,
  onChange,
}: CurrentSituationSectionProps) {
  return (
    <section className="flex flex-col gap-2 border-t border-edge pt-4">
      <h2 className="text-sm font-semibold">Current Situation</h2>
      <p className="text-xs text-content-secondary">
        Observed facts. The snapshot below auto-populates from your Hub when available; the
        narrative is yours to write.
      </p>
      {snapshot ? (
        <CurrentSituationSnapshot data={snapshot} />
      ) : (
        <p className="text-xs text-content-secondary italic">
          Add specs in FRAME to surface a capability snapshot here, or describe the current state
          manually below.
        </p>
      )}
      <textarea
        value={section.narrative ?? ''}
        onChange={e => onChange({ narrative: e.target.value })}
        placeholder="Describe what the data shows, in your own words"
        aria-label="Current Situation narrative"
        rows={4}
        className="border border-edge rounded px-2 py-1 text-sm"
      />
    </section>
  );
}
```

Mount in `ImprovementProjectForm.tsx` (between `<IssueSection />` and `<ProblemStatementSection />`):

```tsx
<CurrentSituationSection
  section={project.sections.currentSituation}
  snapshot={hubContext?.currentSituationSnapshot}
  onChange={patch =>
    onPatch({
      sections: {
        ...project.sections,
        currentSituation: { ...project.sections.currentSituation, ...patch },
      },
    })
  }
/>
```

Update `hubContext` shape on the form props to include `currentSituationSnapshot?: CurrentSituationSnapshotData`.

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @variscout/ui test CurrentSituationSection
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/ImprovementProject/sections/CurrentSituation*.tsx packages/ui/src/components/ImprovementProject/sections/__tests__/CurrentSituationSection.test.tsx packages/ui/src/components/ImprovementProject/ImprovementProjectForm.tsx
git commit -m "feat(ui): Current Situation section (snapshot panel + narrative)"
```

---

### Task 11: Section 4 (Goal) — OutcomeSpec picker + structured fields

**Files:**

- Create: `packages/ui/src/components/ImprovementProject/sections/GoalSection.tsx`
- Create: `packages/ui/src/components/ImprovementProject/sections/__tests__/GoalSection.test.tsx`
- Modify: `packages/ui/src/components/ImprovementProject/ImprovementProjectForm.tsx` (mount)

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GoalSection } from '../GoalSection';
import type { OutcomeSpec } from '@variscout/core/processHub';

const OUTCOMES: OutcomeSpec[] = [
  {
    id: 'outcome-1',
    hubId: 'hub-1',
    columnName: 'Thickness',
    characteristicType: 'nominalIsBest',
    target: 1.0,
    cpkTarget: 1.33,
    createdAt: 0,
    deletedAt: null,
  },
];

describe('GoalSection', () => {
  it('renders the OutcomeSpec picker with hub outcomes', () => {
    render(<GoalSection section={{}} hubOutcomes={OUTCOMES} onChange={() => {}} />);
    expect(screen.getByRole('combobox', { name: /outcome/i })).toBeInTheDocument();
    expect(screen.getByText(/thickness/i)).toBeInTheDocument();
  });

  it('shows free-text fallback when hub has no outcomes', () => {
    render(<GoalSection section={{}} hubOutcomes={[]} onChange={() => {}} />);
    expect(screen.getByRole('textbox', { name: /goal/i })).toBeInTheDocument();
  });

  it('emits patch when target is changed', () => {
    const onChange = vi.fn();
    render(
      <GoalSection
        section={{ outcomeSpecId: 'outcome-1' }}
        hubOutcomes={OUTCOMES}
        onChange={onChange}
      />
    );
    fireEvent.change(screen.getByLabelText(/target/i), { target: { value: '1.5' } });
    expect(onChange).toHaveBeenCalledWith({ target: 1.5 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test GoalSection
```

Expected: FAIL.

- [ ] **Step 3: Implement**

Create `packages/ui/src/components/ImprovementProject/sections/GoalSection.tsx`:

```tsx
import type { ImprovementProjectGoalSection } from '@variscout/core/improvementProject';
import type { OutcomeSpec } from '@variscout/core/processHub';

interface GoalSectionProps {
  section: ImprovementProjectGoalSection;
  hubOutcomes: OutcomeSpec[];
  onChange: (patch: Partial<ImprovementProjectGoalSection>) => void;
}

export function GoalSection({ section, hubOutcomes, onChange }: GoalSectionProps) {
  if (hubOutcomes.length === 0) {
    return (
      <section className="flex flex-col gap-2 border-t border-edge pt-4">
        <h2 className="text-sm font-semibold">Goal</h2>
        <p className="text-xs text-content-secondary">
          Pick an outcome from your Hub, or describe the target manually below.
        </p>
        <textarea
          value={section.freeText ?? ''}
          onChange={e => onChange({ freeText: e.target.value })}
          placeholder="Describe the goal — target value, deadline, units."
          aria-label="Goal"
          rows={3}
          className="border border-edge rounded px-2 py-1 text-sm"
        />
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-2 border-t border-edge pt-4">
      <h2 className="text-sm font-semibold">Goal</h2>
      <p className="text-xs text-content-secondary">
        Set the target value, deadline, and OutcomeSpec link.
      </p>
      <label className="flex items-center gap-2 text-sm">
        <span className="w-32">Outcome</span>
        <select
          value={section.outcomeSpecId ?? ''}
          onChange={e => onChange({ outcomeSpecId: e.target.value || undefined })}
          aria-label="Outcome"
          className="flex-1 border border-edge rounded px-2 py-1"
        >
          <option value="">— Select outcome —</option>
          {hubOutcomes.map(o => (
            <option key={o.id} value={o.id}>
              {o.columnName}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <span className="w-32">Baseline</span>
        <input
          type="number"
          value={section.baseline ?? ''}
          onChange={e =>
            onChange({ baseline: e.target.value ? Number(e.target.value) : undefined })
          }
          aria-label="Baseline"
          className="flex-1 border border-edge rounded px-2 py-1"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <span className="w-32">Target</span>
        <input
          type="number"
          value={section.target ?? ''}
          onChange={e => onChange({ target: e.target.value ? Number(e.target.value) : undefined })}
          aria-label="Target"
          className="flex-1 border border-edge rounded px-2 py-1"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <span className="w-32">Deadline</span>
        <input
          type="date"
          value={section.deadline ? section.deadline.slice(0, 10) : ''}
          onChange={e =>
            onChange({
              deadline: e.target.value ? new Date(e.target.value).toISOString() : undefined,
            })
          }
          aria-label="Deadline"
          className="flex-1 border border-edge rounded px-2 py-1"
        />
      </label>
    </section>
  );
}
```

Mount in form (after `<ProblemStatementSection />`):

```tsx
<GoalSection
  section={project.sections.goal}
  hubOutcomes={hubContext?.outcomes ?? []}
  onChange={patch =>
    onPatch({ sections: { ...project.sections, goal: { ...project.sections.goal, ...patch } } })
  }
/>
```

Update `hubContext` shape to include `outcomes?: OutcomeSpec[]`.

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @variscout/ui test GoalSection
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/ImprovementProject/sections/GoalSection.tsx packages/ui/src/components/ImprovementProject/sections/__tests__/GoalSection.test.tsx packages/ui/src/components/ImprovementProject/ImprovementProjectForm.tsx
git commit -m "feat(ui): Goal section (OutcomeSpec picker + structured fields + free-text fallback)"
```

---

### Task 12: Sections 5 (Cause Analysis) + 6 (Countermeasures) — FK-multi-select + narrative

**Files:**

- Create: `packages/ui/src/components/ImprovementProject/sections/CauseAnalysisSection.tsx`
- Create: `packages/ui/src/components/ImprovementProject/sections/CountermeasuresSection.tsx`
- Create: `packages/ui/src/components/ImprovementProject/sections/__tests__/CauseAnalysisSection.test.tsx`
- Modify: form

- [ ] **Step 1: Write failing tests**

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CauseAnalysisSection } from '../CauseAnalysisSection';
import type { SuspectedCause } from '@variscout/core/findings';

const CAUSES: SuspectedCause[] = [
  {
    id: 'sc-1',
    name: 'Worn tooling',
    synthesis: '',
    questionIds: [],
    findingIds: [],
    status: 'active',
    createdAt: 0,
    deletedAt: null,
  },
];

describe('CauseAnalysisSection', () => {
  it('renders the SuspectedCause picker', () => {
    render(<CauseAnalysisSection section={{}} hubSuspectedCauses={CAUSES} onChange={() => {}} />);
    expect(screen.getByRole('combobox', { name: /suspected cause/i })).toBeInTheDocument();
  });

  it('emits patch with selected cause id', () => {
    const onChange = vi.fn();
    render(<CauseAnalysisSection section={{}} hubSuspectedCauses={CAUSES} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/suspected cause/i), { target: { value: 'sc-1' } });
    expect(onChange).toHaveBeenCalledWith({ suspectedCauseId: 'sc-1' });
  });

  it('emits patch with narrative text', () => {
    const onChange = vi.fn();
    render(<CauseAnalysisSection section={{}} hubSuspectedCauses={[]} onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox', { name: /narrative/i }), {
      target: { value: '5-whys: ...' },
    });
    expect(onChange).toHaveBeenCalledWith({ narrative: '5-whys: ...' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test CauseAnalysisSection
```

Expected: FAIL.

- [ ] **Step 3: Implement**

Create `packages/ui/src/components/ImprovementProject/sections/CauseAnalysisSection.tsx`:

```tsx
import type { ImprovementProjectCauseAnalysisSection } from '@variscout/core/improvementProject';
import type { SuspectedCause } from '@variscout/core/findings';

interface CauseAnalysisSectionProps {
  section: ImprovementProjectCauseAnalysisSection;
  hubSuspectedCauses: SuspectedCause[];
  onChange: (patch: Partial<ImprovementProjectCauseAnalysisSection>) => void;
}

export function CauseAnalysisSection({
  section,
  hubSuspectedCauses,
  onChange,
}: CauseAnalysisSectionProps) {
  return (
    <section className="flex flex-col gap-2 border-t border-edge pt-4">
      <h2 className="text-sm font-semibold">Cause Analysis</h2>
      <p className="text-xs text-content-secondary">
        Link a SuspectedCause from this Hub or describe your root cause analysis below (5-whys,
        fishbone, etc.).
      </p>
      <label className="flex items-center gap-2 text-sm">
        <span className="w-32">Suspected cause</span>
        <select
          value={section.suspectedCauseId ?? ''}
          onChange={e => onChange({ suspectedCauseId: e.target.value || undefined })}
          aria-label="Suspected cause"
          className="flex-1 border border-edge rounded px-2 py-1"
        >
          <option value="">— None linked —</option>
          {hubSuspectedCauses.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <textarea
        value={section.narrative ?? ''}
        onChange={e => onChange({ narrative: e.target.value })}
        placeholder="5-whys, fishbone, RCA narrative"
        aria-label="Cause Analysis narrative"
        rows={4}
        className="border border-edge rounded px-2 py-1 text-sm"
      />
    </section>
  );
}
```

Create `packages/ui/src/components/ImprovementProject/sections/CountermeasuresSection.tsx`:

```tsx
import type { ImprovementProjectCountermeasuresSection } from '@variscout/core/improvementProject';
import type { ImprovementIdea } from '@variscout/core/findings';

interface CountermeasuresSectionProps {
  section: ImprovementProjectCountermeasuresSection;
  hubImprovementIdeas: ImprovementIdea[];
  onChange: (patch: Partial<ImprovementProjectCountermeasuresSection>) => void;
}

export function CountermeasuresSection({
  section,
  hubImprovementIdeas,
  onChange,
}: CountermeasuresSectionProps) {
  const selectedIds = section.improvementIdeaIds ?? [];
  const toggle = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter(x => x !== id)
      : [...selectedIds, id];
    onChange({ improvementIdeaIds: next });
  };
  return (
    <section className="flex flex-col gap-2 border-t border-edge pt-4">
      <h2 className="text-sm font-semibold">Countermeasures</h2>
      <p className="text-xs text-content-secondary">
        Link Improvement Ideas from this Hub (selected ideas appear here) or describe the approach.
      </p>
      {hubImprovementIdeas.length > 0 && (
        <ul className="flex flex-col gap-1">
          {hubImprovementIdeas.map(i => (
            <li key={i.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedIds.includes(i.id)}
                onChange={() => toggle(i.id)}
                aria-label={i.text}
              />
              <span>{i.text}</span>
            </li>
          ))}
        </ul>
      )}
      <textarea
        value={section.narrative ?? ''}
        onChange={e => onChange({ narrative: e.target.value })}
        placeholder="Approach narrative — describe what you're doing"
        aria-label="Countermeasures narrative"
        rows={4}
        className="border border-edge rounded px-2 py-1 text-sm"
      />
    </section>
  );
}
```

Mount in form. Update `hubContext` to include `suspectedCauses?: SuspectedCause[]` and `improvementIdeas?: ImprovementIdea[]`.

- [ ] **Step 4: Run tests**

```bash
pnpm --filter @variscout/ui test CauseAnalysisSection CountermeasuresSection
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/ImprovementProject/sections/CauseAnalysisSection.tsx packages/ui/src/components/ImprovementProject/sections/CountermeasuresSection.tsx packages/ui/src/components/ImprovementProject/sections/__tests__/CauseAnalysisSection.test.tsx packages/ui/src/components/ImprovementProject/ImprovementProjectForm.tsx
git commit -m "feat(ui): Cause Analysis + Countermeasures sections (FK + narrative)"
```

---

### Task 13: Sections 7 (Effect Confirmation auto-only) + 8 (Standardization)

**Files:**

- Create: `packages/ui/src/components/ImprovementProject/sections/EffectConfirmationSection.tsx`
- Create: `packages/ui/src/components/ImprovementProject/sections/StandardizationSection.tsx`
- Create: `packages/ui/src/components/ImprovementProject/sections/__tests__/EffectConfirmationSection.test.tsx`
- Modify: form

- [ ] **Step 1: Write failing tests**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EffectConfirmationSection } from '../EffectConfirmationSection';

describe('EffectConfirmationSection', () => {
  it('shows the empty placeholder when no verification data exists', () => {
    render(<EffectConfirmationSection section={{}} verificationData={undefined} />);
    expect(
      screen.getByText(/will populate once an improvement is recorded and verified/i)
    ).toBeInTheDocument();
  });

  it('shows the auto-pulled metrics when verification data exists', () => {
    render(
      <EffectConfirmationSection
        section={{ confirmedAt: '2026-08-01T00:00:00Z' }}
        verificationData={{ summary: 'Cpk improved to 1.45' }}
      />
    );
    expect(screen.getByText(/cpk improved to 1\.45/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test EffectConfirmationSection
```

Expected: FAIL.

- [ ] **Step 3: Implement**

Create `packages/ui/src/components/ImprovementProject/sections/EffectConfirmationSection.tsx`:

```tsx
import type { ImprovementProjectEffectConfirmationSection } from '@variscout/core/improvementProject';

interface EffectConfirmationSectionProps {
  section: ImprovementProjectEffectConfirmationSection;
  /** Auto-pulled summary; undefined when no verification data exists yet. */
  verificationData: { summary: string } | undefined;
}

/**
 * Section 7 — auto-only. No manual editable fields. Always renders; shifts
 * between empty placeholder and populated state based on verification data.
 */
export function EffectConfirmationSection({
  section,
  verificationData,
}: EffectConfirmationSectionProps) {
  return (
    <section className="flex flex-col gap-2 border-t border-edge pt-4">
      <h2 className="text-sm font-semibold">Effect Confirmation</h2>
      {verificationData ? (
        <div className="border border-edge rounded p-3 text-sm bg-surface-secondary">
          <p>{verificationData.summary}</p>
          {section.confirmedAt && (
            <p className="text-xs opacity-70 mt-1">
              Confirmed {new Date(section.confirmedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-content-secondary italic">
          Will populate once an improvement is recorded and verified.
        </p>
      )}
    </section>
  );
}
```

Create `packages/ui/src/components/ImprovementProject/sections/StandardizationSection.tsx`:

```tsx
import type { ImprovementProjectStandardizationSection } from '@variscout/core/improvementProject';

interface StandardizationSectionProps {
  section: ImprovementProjectStandardizationSection;
  /** From hub-domain — link affordances when available. */
  sustainmentSummary?: { id: string; label: string };
  handoffSummary?: { id: string; label: string };
  onChange: (patch: Partial<ImprovementProjectStandardizationSection>) => void;
}

export function StandardizationSection({
  section,
  sustainmentSummary,
  handoffSummary,
  onChange,
}: StandardizationSectionProps) {
  return (
    <section className="flex flex-col gap-2 border-t border-edge pt-4">
      <h2 className="text-sm font-semibold">Standardization &amp; Reflection</h2>
      <p className="text-xs text-content-secondary">
        Sustainment plan, control handoff, and lessons learned.
      </p>
      {sustainmentSummary && (
        <p className="text-sm">
          Linked Sustainment: <code>{sustainmentSummary.label}</code>
        </p>
      )}
      {handoffSummary && (
        <p className="text-sm">
          Linked Handoff: <code>{handoffSummary.label}</code>
        </p>
      )}
      <textarea
        value={section.reflectionNarrative ?? ''}
        onChange={e => onChange({ reflectionNarrative: e.target.value })}
        placeholder="Reflection — what worked, what didn't, what's next."
        aria-label="Reflection"
        rows={4}
        className="border border-edge rounded px-2 py-1 text-sm"
      />
    </section>
  );
}
```

Mount both in form.

- [ ] **Step 4: Run tests**

```bash
pnpm --filter @variscout/ui test EffectConfirmationSection
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/ImprovementProject/sections/EffectConfirmationSection.tsx packages/ui/src/components/ImprovementProject/sections/StandardizationSection.tsx packages/ui/src/components/ImprovementProject/sections/__tests__/EffectConfirmationSection.test.tsx packages/ui/src/components/ImprovementProject/ImprovementProjectForm.tsx
git commit -m "feat(ui): Effect Confirmation (auto-only) + Standardization sections"
```

---

### Task 14: `TeamSignoffSection` — V1 paid feature with visible-with-lock affordance

**Files:**

- Create: `packages/ui/src/components/ImprovementProject/TeamSignoffSection.tsx`
- Create: `packages/ui/src/components/ImprovementProject/__tests__/TeamSignoffSection.test.tsx`
- Modify: form

- [ ] **Step 1: Write failing tests**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TeamSignoffSection } from '../TeamSignoffSection';

describe('TeamSignoffSection', () => {
  it('renders an active signoff button for paid tier', () => {
    render(
      <TeamSignoffSection
        signoff={undefined}
        isPaid={true}
        onRequestSignoff={() => {}}
        onApprove={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: /request team approval/i })).toBeEnabled();
  });

  it('renders a locked signoff affordance for free tier', () => {
    render(
      <TeamSignoffSection
        signoff={undefined}
        isPaid={false}
        onRequestSignoff={() => {}}
        onApprove={() => {}}
      />
    );
    const button = screen.getByRole('button', { name: /request team approval/i });
    expect(button).toBeDisabled();
    expect(screen.getByLabelText(/locked/i)).toBeInTheDocument();
    expect(screen.getByText(/available with azure/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter @variscout/ui test TeamSignoffSection
```

Expected: FAIL.

- [ ] **Step 3: Implement**

Create `packages/ui/src/components/ImprovementProject/TeamSignoffSection.tsx`:

```tsx
import type { ImprovementProjectSignoff } from '@variscout/core/improvementProject';

interface TeamSignoffSectionProps {
  signoff: ImprovementProjectSignoff | undefined;
  isPaid: boolean;
  onRequestSignoff: () => void;
  onApprove: () => void;
}

/**
 * V1 paid-tier team signoff. Free tier renders the button visible-with-lock
 * per industry freemium UX (Stripe / Demogo / RevenueCat).
 */
export function TeamSignoffSection({
  signoff,
  isPaid,
  onRequestSignoff,
  onApprove,
}: TeamSignoffSectionProps) {
  return (
    <section className="flex flex-col gap-2 border-t border-edge pt-4">
      <h2 className="text-sm font-semibold">Team approval</h2>
      <p className="text-xs text-content-secondary">
        Request sponsor / Champion sign-off on this project.
      </p>
      {!isPaid && (
        <p className="text-xs text-amber-700">Available with Azure (team signoff workflow).</p>
      )}
      {signoff?.approvedAt ? (
        <p className="text-sm text-green-700">
          ✓ Approved {new Date(signoff.approvedAt).toLocaleDateString()}
          {signoff.approvedBy && ` by ${signoff.approvedBy.displayName}`}
        </p>
      ) : signoff?.requestedAt ? (
        <div className="flex flex-col gap-1">
          <p className="text-sm text-amber-700">
            Requested {new Date(signoff.requestedAt).toLocaleDateString()}
          </p>
          {isPaid && (
            <button
              type="button"
              onClick={onApprove}
              className="self-start text-sm border border-edge rounded px-3 py-1"
            >
              Approve
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={onRequestSignoff}
          disabled={!isPaid}
          aria-label={
            !isPaid ? 'Request team approval (locked — paid tier)' : 'Request team approval'
          }
          className="self-start text-sm border border-edge rounded px-3 py-1 flex items-center gap-2 disabled:opacity-50"
        >
          Request team approval
          {!isPaid && <span aria-label="locked">🔒</span>}
        </button>
      )}
    </section>
  );
}
```

Mount in form. Add `isPaid` to form props (inject from per-app shell via `useTier()` in Slice 3).

- [ ] **Step 4: Run tests**

```bash
pnpm --filter @variscout/ui test TeamSignoffSection
```

Expected: PASS.

- [ ] **Step 5: Commit + push Slice 2**

```bash
git add packages/ui/src/components/ImprovementProject/TeamSignoffSection.tsx packages/ui/src/components/ImprovementProject/__tests__/TeamSignoffSection.test.tsx packages/ui/src/components/ImprovementProject/ImprovementProjectForm.tsx
git commit -m "feat(ui): TeamSignoffSection — V1 paid signoff + visible-with-lock for free tier"
git push
```

**Open PR-IP2 (Slice 2 — UI primitives).** Run `bash scripts/pr-ready-check.sh`. Subagent code-reviewer pass on Opus before squash-merge.

---

## Slice 3 — App integration + vision amendment (Tasks 15–19, PR-IP3)

> **PR-IP3 prerequisite:** PR-IP1 + PR-IP2 merged. Pull main into `improvement-project-v1` before starting Slice 3.

### Task 15: PWA — replace `CharterPanel.tsx` with `ImprovementProjectPanel.tsx`

**Files:**

- Modify: `apps/pwa/src/components/CharterPanel.tsx` → rename to `ImprovementProjectPanel.tsx`
- Modify: callers of `CharterPanel` (find via grep) — update imports + label
- Create: `apps/pwa/src/components/__tests__/ImprovementProjectPanel.test.tsx`
- Modify: `packages/core/src/i18n/messages/en.ts` (and other locales) — add `improvementProject.*` keys (full set per spec §8)

- [ ] **Step 1: Find current CharterPanel callers**

```bash
grep -rn "CharterPanel" apps/pwa/src/
```

- [ ] **Step 2: Write failing test**

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ImprovementProjectPanel from '../ImprovementProjectPanel';

describe('ImprovementProjectPanel (PWA)', () => {
  it('renders the form with hub context', () => {
    const onBack = vi.fn();
    render(<ImprovementProjectPanel hubId="hub-1" onBack={onBack} />);
    expect(screen.getByTestId('improvement-project-form')).toBeInTheDocument();
  });

  it('returns to canvas on Back', () => {
    const onBack = vi.fn();
    render(<ImprovementProjectPanel hubId="hub-1" onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(onBack).toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Implement**

Rename + rewrite `apps/pwa/src/components/CharterPanel.tsx` → `apps/pwa/src/components/ImprovementProjectPanel.tsx`:

```tsx
import { useEffect, useMemo, useState } from 'react';
import { ImprovementProjectForm } from '@variscout/ui';
import { useImprovementProjectStore, useProjectStore } from '@variscout/stores';
import { pwaHubRepository } from '../persistence';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import { generateDeterministicId } from '@variscout/core/identity';

interface ImprovementProjectPanelProps {
  hubId: string;
  /** Optional — when provided, opens an existing project; otherwise creates draft. */
  projectId?: string;
  onBack: () => void;
}

export default function ImprovementProjectPanel({
  hubId,
  projectId,
  onBack,
}: ImprovementProjectPanelProps) {
  const hub = useProjectStore(s => s.hub);
  const allProjects = useImprovementProjectStore(s => s.getProjectsForHub(hubId));
  const [activeId, setActiveId] = useState<string | null>(projectId ?? null);

  // Auto-create on mount if no projectId AND no projects exist for this hub
  useEffect(() => {
    if (activeId) return;
    if (allProjects.length === 1) {
      setActiveId(allProjects[0].id);
      return;
    }
    if (allProjects.length === 0) {
      const newProject: ImprovementProject = {
        id: generateDeterministicId('ip', `${hubId}-${Date.now()}`),
        hubId,
        createdAt: Date.now(),
        deletedAt: null,
        status: 'draft',
        metadata: { title: 'Untitled' },
        sections: {
          issue: {},
          currentSituation: {},
          problemStatement: {},
          goal: {},
          causeAnalysis: {},
          countermeasures: {},
          effectConfirmation: {},
          standardization: {},
        },
        updatedAt: Date.now(),
      };
      void pwaHubRepository.dispatch({
        kind: 'IMPROVEMENT_PROJECT_CREATE',
        hubId,
        project: newProject,
      });
      useImprovementProjectStore.getState().upsertProject(newProject);
      setActiveId(newProject.id);
    }
    // 2+ projects: parent component should pass projectId; if not, fall through to picker UX
  }, [activeId, allProjects, hubId]);

  const active = useMemo(() => allProjects.find(p => p.id === activeId), [activeId, allProjects]);

  if (allProjects.length > 1 && !active) {
    return (
      <ProjectPicker
        projects={allProjects}
        onPick={id => setActiveId(id)}
        onCreate={() => setActiveId(null)} // triggers auto-create branch
        onBack={onBack}
      />
    );
  }
  if (!active) return <p className="p-4 text-sm">Loading…</p>;

  return (
    <ImprovementProjectForm
      project={active}
      onPatch={patch => {
        useImprovementProjectStore
          .getState()
          .upsertProject({ ...active, ...patch, updatedAt: Date.now() });
        void pwaHubRepository.dispatch({
          kind: 'IMPROVEMENT_PROJECT_UPDATE',
          projectId: active.id,
          patch,
        });
      }}
      onBack={onBack}
      hubContext={{
        outcomes: hub?.outcomes ?? [],
        // issueStatementLive / problemConditionLive / suspectedCauses / improvementIdeas
        // wired in subsequent tasks if not yet plumbed
      }}
    />
  );
}

interface ProjectPickerProps {
  projects: ImprovementProject[];
  onPick: (id: string) => void;
  onCreate: () => void;
  onBack: () => void;
}

function ProjectPicker({ projects, onPick, onCreate, onBack }: ProjectPickerProps) {
  return (
    <div data-testid="improvement-project-picker" className="flex flex-col gap-2 p-4">
      <h2 className="text-lg font-semibold">Improvement Projects</h2>
      <ul className="flex flex-col gap-1">
        {projects.map(p => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onPick(p.id)}
              className="w-full text-left border border-edge rounded px-3 py-2"
            >
              {p.metadata.title} <span className="text-xs opacity-70">({p.status})</span>
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onCreate}
        className="self-start text-sm border border-edge rounded px-3 py-1"
      >
        + Create new
      </button>
      <button onClick={onBack} className="self-start text-sm underline text-content-secondary">
        Back
      </button>
    </div>
  );
}
```

Update grep'd callers (likely `apps/pwa/src/components/Canvas/CanvasStepOverlay.tsx` or whichever wires Charter response-path) to import + use `ImprovementProjectPanel` instead. Update i18n keys for the response-path button label.

Add full i18n key set to `packages/core/src/i18n/messages/en.ts` and re-run other locale stubs (use English fallback initially).

- [ ] **Step 4: Run test**

```bash
pnpm --filter @variscout/pwa test ImprovementProjectPanel
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git rm apps/pwa/src/components/CharterPanel.tsx
git add apps/pwa/src/components/ImprovementProjectPanel.tsx apps/pwa/src/components/__tests__/ImprovementProjectPanel.test.tsx packages/core/src/i18n/messages/en.ts
git commit -m "feat(pwa): replace CharterPanel stub with ImprovementProjectPanel + form"
```

---

### Task 16: Azure — replace `charter/CharterPanel.tsx` with `improvementProject/ImprovementProjectPanel.tsx`

Implementation is structurally identical to Task 15's PWA panel (same `ImprovementProjectForm` shared component, same `ImprovementProjectStore` upserts, same picker overlay pattern). The deltas:

| Concern           | PWA (Task 15)                                         | Azure (Task 16)                                                                                                                   |
| ----------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Repository import | `import { pwaHubRepository } from '../persistence'`   | `import { azureHubRepository } from '../persistence'`                                                                             |
| Hub source        | `useProjectStore(s => s.hub)`                         | feature-store / hub-domain store per `apps/azure/src/features/` (grep `processHub` in apps/azure/src to confirm current location) |
| Tier wiring       | `isPaid={false}` (free tier always)                   | `isPaid={useTier().isPaid}` from `@variscout/hooks/useTier`                                                                       |
| File location     | `apps/pwa/src/components/ImprovementProjectPanel.tsx` | `apps/azure/src/components/improvementProject/ImprovementProjectPanel.tsx` (FSD: under `components/`)                             |
| Pop-out wiring    | Not yet                                               | Not yet (deferred V2 per spec §11)                                                                                                |

**Files:**

- Delete: `apps/azure/src/components/charter/CharterPanel.tsx`
- Create: `apps/azure/src/components/improvementProject/ImprovementProjectPanel.tsx` (copy Task 15's body, substitute deltas above)
- Create: `apps/azure/src/components/improvementProject/__tests__/ImprovementProjectPanel.test.tsx` (mirror Task 15's test, substituting Azure imports)
- Modify: callers — find via `grep -rn "CharterPanel" apps/azure/src/`

Same 5-step TDD structure as Task 15. Run:

```bash
pnpm --filter @variscout/azure-app test ImprovementProjectPanel
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git rm apps/azure/src/components/charter/CharterPanel.tsx
git rmdir apps/azure/src/components/charter # if now empty
git add apps/azure/src/components/improvementProject/
git commit -m "feat(azure): replace charter/CharterPanel stub with ImprovementProjectPanel + form"
```

---

### Task 17: Hub-overview "+ New Improvement Project" entry point + flat list

**Files:**

- Create: `packages/ui/src/components/ImprovementProject/HubProjectsList.tsx`
- Create: `packages/ui/src/components/ImprovementProject/__tests__/HubProjectsList.test.tsx`
- Modify: `apps/pwa/src/components/Dashboard.tsx` (mount HubProjectsList below investigations list)
- Modify: `apps/azure/src/components/HubComposer.tsx` (or wherever Azure renders the Hub overview — grep)

- [ ] **Step 1: Write failing test**

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HubProjectsList } from '../HubProjectsList';
import type { ImprovementProject } from '@variscout/core/improvementProject';

const PROJECTS: ImprovementProject[] = [
  // 1 draft, 1 active, 1 closed
  {
    id: 'p1',
    hubId: 'h',
    createdAt: 1,
    deletedAt: null,
    status: 'draft',
    metadata: { title: 'Draft Project' },
    sections: {
      issue: {},
      currentSituation: {},
      problemStatement: {},
      goal: {},
      causeAnalysis: {},
      countermeasures: {},
      effectConfirmation: {},
      standardization: {},
    },
    updatedAt: 100,
  },
  {
    id: 'p2',
    hubId: 'h',
    createdAt: 1,
    deletedAt: null,
    status: 'active',
    metadata: { title: 'Active Project' },
    sections: {
      issue: {},
      currentSituation: {},
      problemStatement: {},
      goal: {},
      causeAnalysis: {},
      countermeasures: {},
      effectConfirmation: {},
      standardization: {},
    },
    updatedAt: 200,
  },
  {
    id: 'p3',
    hubId: 'h',
    createdAt: 1,
    deletedAt: null,
    status: 'closed',
    metadata: { title: 'Closed Project' },
    sections: {
      issue: {},
      currentSituation: {},
      problemStatement: {},
      goal: {},
      causeAnalysis: {},
      countermeasures: {},
      effectConfirmation: {},
      standardization: {},
    },
    updatedAt: 50,
  },
];

describe('HubProjectsList', () => {
  it('renders all projects sorted by updatedAt desc', () => {
    render(<HubProjectsList projects={PROJECTS} onOpen={() => {}} onCreateNew={() => {}} />);
    const items = screen.getAllByRole('button', { name: /project/i });
    // First item is highest updatedAt = 'Active Project'
    expect(items[0]).toHaveTextContent(/active project/i);
  });

  it('filters by status when chip is clicked', () => {
    render(<HubProjectsList projects={PROJECTS} onOpen={() => {}} onCreateNew={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /^drafts$/i }));
    expect(screen.queryByText(/closed project/i)).not.toBeInTheDocument();
    expect(screen.getByText(/draft project/i)).toBeInTheDocument();
  });

  it('calls onCreateNew when "+ New" clicked', () => {
    const onCreate = vi.fn();
    render(<HubProjectsList projects={[]} onOpen={() => {}} onCreateNew={onCreate} />);
    fireEvent.click(screen.getByRole('button', { name: /\+ new improvement project/i }));
    expect(onCreate).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/ui test HubProjectsList
```

Expected: FAIL.

- [ ] **Step 3: Implement**

Create `packages/ui/src/components/ImprovementProject/HubProjectsList.tsx`:

```tsx
import { useState } from 'react';
import type { ImprovementProject } from '@variscout/core/improvementProject';

type StatusFilter = 'all' | 'draft' | 'active' | 'closed';

interface HubProjectsListProps {
  projects: ImprovementProject[];
  onOpen: (projectId: string) => void;
  onCreateNew: () => void;
}

export function HubProjectsList({ projects, onOpen, onCreateNew }: HubProjectsListProps) {
  const [filter, setFilter] = useState<StatusFilter>('all');
  const filtered = projects
    .filter(p => p.deletedAt === null)
    .filter(p => filter === 'all' || p.status === filter)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <section className="flex flex-col gap-2">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Improvement Projects</h2>
        <button
          type="button"
          onClick={onCreateNew}
          className="text-sm border border-edge rounded px-3 py-1"
        >
          + New Improvement Project
        </button>
      </header>
      <div className="flex gap-1 text-xs">
        {(['all', 'draft', 'active', 'closed'] as StatusFilter[]).map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`border border-edge rounded px-2 py-0.5 capitalize ${filter === f ? 'bg-accent text-white' : ''}`}
          >
            {f === 'all' ? 'All' : f === 'draft' ? 'Drafts' : f === 'active' ? 'Active' : 'Closed'}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-content-secondary italic">No projects to show.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {filtered.map(p => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onOpen(p.id)}
                aria-label={`Project: ${p.metadata.title}`}
                className="w-full text-left border border-edge rounded px-3 py-2 flex items-baseline gap-2"
              >
                <span className="flex-1">{p.metadata.title}</span>
                <span className="text-xs opacity-70 capitalize">{p.status}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

Mount in PWA Dashboard. Find the existing investigations list to anchor against:

```bash
grep -rn "investigations" apps/pwa/src/components/Dashboard.tsx
grep -rn "Investigations\|investigationList\|hubInvestigations" apps/pwa/src/components/
```

Locate the investigations list rendering site; mount `<HubProjectsList />` immediately below. The wiring depends on Dashboard's existing overlay/panel state pattern — find via:

```bash
grep -rn "type: '\|setOverlayState\|panel:\s*'" apps/pwa/src/components/Dashboard.tsx
```

The integration uses Dashboard's existing overlay state. The exact prop shape (likely a setter that takes `{ type, hubId, projectId? }`) must match the existing pattern; adopt Dashboard's existing convention. Example shape:

```tsx
import { HubProjectsList } from '@variscout/ui';
import { useImprovementProjectStore } from '@variscout/stores';
// ...
const projects = useImprovementProjectStore(s => s.getProjectsForHub(hub.id));
// In JSX, beneath the existing investigations list:
<HubProjectsList
  projects={projects}
  onOpen={id => setActivePanel({ panel: 'improvementProject', hubId: hub.id, projectId: id })}
  onCreateNew={() => setActivePanel({ panel: 'improvementProject', hubId: hub.id })}
/>;
```

Same pattern for Azure HubComposer (or whichever Azure component owns the Hub overview — find via `grep -rn "HubComposer\|hub-overview" apps/azure/src/`).

- [ ] **Step 4: Run test**

```bash
pnpm --filter @variscout/ui test HubProjectsList
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/ImprovementProject/HubProjectsList.tsx packages/ui/src/components/ImprovementProject/__tests__/HubProjectsList.test.tsx apps/pwa/src/components/Dashboard.tsx apps/azure/src/components/HubComposer.tsx
git commit -m "feat: HubProjectsList + Hub-overview '+ New Improvement Project' entry"
```

---

### Task 18: Vision §2.4 + §5.3 amendment + decision-log entry

**Files:**

- Modify: `docs/superpowers/specs/2026-05-03-variscout-vision-design.md` (apply amendments)
- Modify: `docs/decision-log.md` (add Replayed Decisions entry)

- [ ] **Step 1 (no test — docs change)**

- [ ] **Step 2: Apply amendments per spec §10**

In `docs/superpowers/specs/2026-05-03-variscout-vision-design.md`:

1. Replace §2.4 response-path-3 bullet (currently "Charter — formal improvement project (DMAIC or similar)...") with the spec §10 amendment text.
2. Replace §5.3 references to "Charter" with "Improvement Project" + add the V1 in-panel deferral note.
3. Append `## Amendment — 2026-05-08 — Charter → Improvement Project rename + V1 in-panel rendering` block at the bottom.

In `docs/decision-log.md`, append under "Replayed Decisions":

```markdown
**2026-05-08 — Canvas response path 3 renamed "Charter" → "Improvement Project"**
Per Improvement Project V1 design (`docs/superpowers/specs/2026-05-08-improvement-project-v1-design.md`).
Vision §2.4 + §5.3 amended. Surface label, code shape (`hub.improvementProjects`), and HubAction kinds all aligned. Methodology lineage (QC Story / Toyota TBP) acknowledged in design spec, not surfaced in UI copy.
```

- [ ] **Step 3: Verify doc-health passes**

```bash
bash scripts/check-doc-health.sh
```

Expected: PASS — no orphaned, broken cross-refs, frontmatter OK.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-05-03-variscout-vision-design.md docs/decision-log.md
git commit -m "docs: vision §2.4 + §5.3 amendment — Charter → Improvement Project"
```

---

### Task 19: Final E2E — full clean-slate authoring + reload persistence

**Files:**

- Create: `apps/pwa/playwright/improvement-project.spec.ts`
- Create: `apps/azure/playwright/improvement-project.spec.ts`

- [ ] **Step 1: Write the E2E test (PWA)**

```ts
import { test, expect } from '@playwright/test';

test.describe('Improvement Project E2E — clean slate authoring', () => {
  test('user creates, edits, saves, reloads, and state persists', async ({ page }) => {
    await page.goto('/');
    // Ingest seed data (or use the demo Hub)
    // ...steps to land on a Hub with at least one canvas card

    // Click a canvas card → drill-down → "Improvement Project"
    await page.getByTestId('canvas-card').first().click();
    await page.getByRole('button', { name: /improvement project/i }).click();

    // Form opens
    await expect(page.getByTestId('improvement-project-form')).toBeVisible();

    // Edit title
    await page.getByLabel('Project title').fill('My E2E Improvement');

    // Edit Issue narrative
    await page.getByLabel('Issue').fill('Variation high on Heads 5–8.');

    // Reload
    await page.reload();

    // State persists
    await page.getByTestId('canvas-card').first().click();
    await page.getByRole('button', { name: /improvement project/i }).click();
    await expect(page.getByLabel('Project title')).toHaveValue('My E2E Improvement');
    await expect(page.getByLabel('Issue')).toHaveValue('Variation high on Heads 5–8.');
  });
});
```

- [ ] **Step 2: Run E2E**

```bash
pnpm --filter @variscout/pwa test:e2e improvement-project
```

Expected: PASS.

- [ ] **Step 3: Mirror for Azure**

```bash
pnpm --filter @variscout/azure-app test:e2e improvement-project
```

Expected: PASS.

- [ ] **Step 4: Run final pr-ready-check**

```bash
bash scripts/pr-ready-check.sh
```

Expected: PASS — tests + lint + docs:check all green.

- [ ] **Step 5: Commit + push Slice 3**

```bash
git add apps/pwa/playwright/improvement-project.spec.ts apps/azure/playwright/improvement-project.spec.ts
git commit -m "test(e2e): Improvement Project clean-slate authoring + reload persistence"
git push
```

**Open PR-IP3 (Slice 3 — App integration + vision amendment).** Final code-reviewer pass on **Opus** before squash-merge per `feedback_subagent_driven_default`.

---

## Verification checklist (run before each PR merge)

- [ ] `bash scripts/pr-ready-check.sh` green (tests + lint + docs:check)
- [ ] `pnpm --filter @variscout/ui build` green (catches cross-package type-export gaps per `feedback_ui_build_before_merge`)
- [ ] PWA `--chrome` walkthrough on the affected slice (per `feedback_verify_before_push`):
  - PR-IP1: not user-visible — skip walkthrough
  - PR-IP2: component-level testing in dev
  - PR-IP3: full clean-slate authoring + canvas-card drill-down + Hub-overview entry + reload
- [ ] No `Math.random()` in any new code (use deterministic PRNG per `editing-statistics`)
- [ ] No hex literals in chart code (none expected in this plan, but verify)
- [ ] All section labels in plain English (no QC Story / Toyota / DMAIC jargon in UI per spec D1)
- [ ] `improvementProject.title` is the only required field on save (per spec D2 required-fields rule)
- [ ] Free-tier signoff button shows lock icon + tooltip per visible-with-lock pattern (spec D10)
- [ ] V1 paid signoff is the only paid feature inside the form (audit trail / comments / RACI / notifications stay deferred)

---

## Notes

- **Subagent-driven workflow:** dispatch a fresh implementer per task, spec + quality reviewer per task, final code-reviewer at the end of each PR. Implementer + reviewers default to **Sonnet**; final per-PR code-reviewer is **Opus** per `feedback_subagent_driven_default`.
- **Required reading before starting:** spec at `docs/superpowers/specs/2026-05-08-improvement-project-v1-design.md` (especially §3 Architecture, §4 Data Model, §6 Tier matrix).
- **i18n locale stubs:** Task 15 adds the full key set to `en.ts`; other locale files get English fallback initially. A separate i18n translation pass is out of V1 scope.
- **No docs site update** in V1 — documentation site updates roll up at Sustainment / Handoff V1 timeframe per the roadmap.
