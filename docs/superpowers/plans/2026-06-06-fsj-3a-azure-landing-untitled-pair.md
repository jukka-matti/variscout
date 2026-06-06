---
tier: ephemeral
purpose: build
title: 'FSJ-3a — Azure landing router + Untitled hub+project pair (in-memory until save)'
status: active
layer: spec
audience: human
related:
  - docs/superpowers/plans/2026-06-06-first-session-journey-master-plan.md
  - docs/superpowers/specs/2026-06-06-first-session-journey-design.md
---

# FSJ-3a: Azure Landing Router + Untitled Pair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fresh data entry in Azure (sample / manual / wizard-path paste) lands on the Process tab with an auto-created, auto-activated **Untitled hub+project pair held in-memory until the first explicit save** (Word-style, spec §3) — the FSJ-1 mirror plus the Azure-only durability rework. Paste→b0 + wizard demotion is **FSJ-3b** (next PR).

**Architecture:** A small `unsavedHubsStore` feature store holds in-memory hubs; Editor and Dashboard resolve `processHubs = catalog ∪ unsaved`. A new `lib/landing.ts` provides the pure `ensureHubProject` (Azure mirror of PWA `ensureSessionProject`, built on `createNewIP` + the EasyAuth email identity) plus `activateHubProject` (upsert + `setActiveIP` under the email scope key Editor:530 reads). `useNewHubProvision` stops eagerly persisting and mints the IP pair at creation; the two surviving `saveProcessHub` writers (Stage-3 outcomes fold, Dashboard hub edits) branch through a Word-style `commitHubChange` helper; the first explicit save (`saveAndRecordBaseline`) flushes the unsaved hub to the catalog. `CreateProjectModal` becomes idempotent (IM-0a 1:1) and finally embeds its IP onto the hub row.

**Tech Stack:** React + Zustand (Azure app shell), `@variscout/core` factories, `@variscout/stores` (`useActiveIPStore`, `useImprovementProjectStore`), Vitest + RTL (happy-dom patterns per `writing-tests` skill).

**Branch:** `feat/fsj-3a-azure-landing-untitled-pair` in own worktree `.worktrees/feat-fsj-3a-azure-landing-untitled-pair/`.

**Prerequisite:** PR 0 (b0 ProcessStepsExpander mount-loop fix, shared CanvasWorkspace — owner call 2026-06-06) merged first. FSJ-3a routes Azure fresh entries to the surface where that bug lives.

**Read first:** spec §1 (landing rule + applicability), §3 (Untitled model + Word-style durability), §9 P1; `apps/azure/CLAUDE.md` (persistence boundary, ETag rules); FSJ-1 sub-plan (`2026-06-06-fsj-1-landing-router-untitled-project.md`) for the PWA pattern being mirrored.

---

## Grounded design decisions (code-verified 2026-06-06 — do not re-litigate in tasks)

1. **Azure has ONE user-id convention** — the EasyAuth email (`getCurrentUser()`, `dev@localhost` in local dev), used for both ACL membership and the active-IP scope key (`useActiveIPContext(activeHub, { userId: currentUser?.email })`, Editor.tsx:530). Do NOT import PWA's `PWA_USER_ID`/`DEFAULT_ACTIVE_IP_USER_ID` split. `getCurrentUser()` can return `null` (EasyAuth edge) — landing paths skip IP minting then (pre-FSJ behavior), never mint with an empty creator id.
2. **`useActiveIPContext` derives `activeIP` from `hub.improvementProject`** (`liveProjects`, useActiveIPContext.ts:24-27), NOT from `useImprovementProjectStore` — and **auto-activates a lone live IP** (:90-96, fresh hub ids can't carry a stale user-cleared marker). Consequence A: every IP write must ALSO be embedded on the hub row. Consequence B: the shipped `CreateProjectModal` (Editor.tsx:2374-2386) only does `upsertProject` + `setActiveIP` — a **pre-existing embed gap** this PR fixes (chrome-verify it live before claiming).
3. **The deferred-persist document seam already exists**: a fresh doc has `savedDocumentName=null` → `hasActiveSavedAzureDocument=false` → autosave disabled (Editor.tsx:481-488, 1686-1690). FSJ-3a must NOT write `projectId`/`projectName` into `projectStore` at provision time, or autosave starts persisting the "in-memory" session within 2s.
4. **`saveProject` snapshots Editor's own `activeHub` closure** (`buildDocumentSnapshot({ activeHub })`, Editor.tsx:507 + `getActiveHub` :496) — so once `processHubs` merges unsaved hubs, document saves carry the in-memory hub with zero extra plumbing. The hub **catalog** write (`saveProcessHub`) is the separate surface the first-save flush owns: it is NOT lock/ETag-protected (fire-and-forget cloud tier, storage.ts:716-736) and is outside PO-8b conflict handling — do not wrap it in `withDocumentSaveLock`.
5. **Two eager hub writes retire together**: `useNewHubProvision.ts:49` (creation) and the Stage-3 outcomes fold (Editor.tsx:1541) — the latter branches through `commitHubChange` (unsaved → in-memory; persisted → today's `saveProcessHub`). Dashboard's two writers (`handleHubCpkTargetCommit` :221, `handleHubGoalChange` :242) get the same branch. Fixing :1541 through `commitHubChange` also repairs a latent staleness (today it persists without updating Editor's `processHubs` state, so `FrameView outcomeSpecs` reads stale).
6. **`unsavedHubsStore` semantics = "current state not persisted"**, not "never persisted": a pre-FSJ persisted hub that gains its IP via `ensureHubProject` enters the store (merge prefers the unsaved copy); the first-save flush is an update, not a create. Same `saveProcessHub` either way.
7. **Azure has NO embed mode** (zero `?embed` handling in apps/azure — grounding 2026-06-06) — the spec §1 exemption is vacuously satisfied; the landing lib carries no embed guard (comment the divergence from PWA's `isEmbedMode` dep).
8. **`.vrs` import is dead in the Azure UI** (Dashboard's `FileBrowseButton` gates on an `onLoadProjectFile` prop App.tsx never passes) — no entry point exists to route. Out of scope; logged in investigations.md at delivery (Task 8).
9. **Routing lever** = `usePanelsStore.getState().showFrame()` (panelsStore.ts:136, `activeView:'frame'` = Process tab). The canvas self-routes b0 (no map) vs L2 (seeded map) via `detectScopeFromMap` inside shared CanvasWorkspace — route to the TAB only, never to a sub-state (FSJ-1 lesson).
10. **Fenced as untouched:** the existing-project landing (`else if (projectId)`, Editor.tsx:1109-1117 — re-anchor by the comment "Project loaded with data, no deep link"); the match-summary second-paste cascade (`acceptMatchSummary`, ~470 LOC); the paste wizard path itself (FSJ-3b demotes it — in 3a, paste still walks `HubCreationFlow`, whose Stage-1 now provisions the in-memory pair via the reworked hook); file upload (stays on the wizard, mirroring PWA where FSJ-2 never routed it); manual **append** mode (re-ingestion is not first-session).
11. **Out of scope, named:** save/export nudge + `beforeunload` guard (FSJ-9); name-before-invite gate (FSJ-9); paste→b0 + "Fix data…" hatch + cancel-wipe fix + GoalBanner relocation (FSJ-3b); brief relocation = minimal per owner call 2026-06-06 (goal→GoalBanner in 3b; brief keeps Analyze BriefHeader + Stage-5 homes; IPDetailPage `charterFormProps` wiring → Project-tab design session).
12. **Line numbers are anchors, not gospel** — re-locate each by symbol/quote before editing (Editor.tsx is 2415 lines and moves).

---

### Task 1: `unsavedHubsStore` — the in-memory hub registry — Sonnet implementer

**Files:**

- Create: `apps/azure/src/features/hubs/unsavedHubsStore.ts`
- Test: `apps/azure/src/features/hubs/__tests__/unsavedHubsStore.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// apps/azure/src/features/hubs/__tests__/unsavedHubsStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useUnsavedHubsStore } from '../unsavedHubsStore';
import type { ProcessHub } from '@variscout/core/processHub';

const hub = (id: string, name = 'Untitled hub'): ProcessHub =>
  ({ id, name, createdAt: 1, deletedAt: null, updatedAt: 1 }) as ProcessHub;

describe('unsavedHubsStore', () => {
  beforeEach(() => {
    useUnsavedHubsStore.setState({ hubs: [] });
  });

  it('upsertHub adds a new hub and isUnsaved reports it', () => {
    useUnsavedHubsStore.getState().upsertHub(hub('h1'));
    expect(useUnsavedHubsStore.getState().hubs).toHaveLength(1);
    expect(useUnsavedHubsStore.getState().isUnsaved('h1')).toBe(true);
    expect(useUnsavedHubsStore.getState().isUnsaved('h2')).toBe(false);
  });

  it('upsertHub replaces an existing entry by id (no duplicates)', () => {
    useUnsavedHubsStore.getState().upsertHub(hub('h1', 'A'));
    useUnsavedHubsStore.getState().upsertHub(hub('h1', 'B'));
    const hubs = useUnsavedHubsStore.getState().hubs;
    expect(hubs).toHaveLength(1);
    expect(hubs[0].name).toBe('B');
  });

  it('removeHub deletes only the flushed hub', () => {
    useUnsavedHubsStore.getState().upsertHub(hub('h1'));
    useUnsavedHubsStore.getState().upsertHub(hub('h2'));
    useUnsavedHubsStore.getState().removeHub('h1');
    expect(useUnsavedHubsStore.getState().isUnsaved('h1')).toBe(false);
    expect(useUnsavedHubsStore.getState().isUnsaved('h2')).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @variscout/azure-app test -- --run src/features/hubs`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// apps/azure/src/features/hubs/unsavedHubsStore.ts
import { create } from 'zustand';
import type { ProcessHub } from '@variscout/core/processHub';

/**
 * Word-style hub durability (first-session spec §3, FSJ-3a): hubs created in
 * this session live here — in-memory only — until the first explicit save
 * flushes them to the catalog (saveProcessHub). "Unsaved" means "current
 * state not persisted": a pre-existing persisted hub that gains its Untitled
 * ImprovementProject in-session also parks here until flush (the flush is
 * then an update, not a create). Editor and Dashboard resolve their hub
 * lists as catalog ∪ unsaved, preferring the unsaved copy on id collision.
 */
interface UnsavedHubsState {
  hubs: ProcessHub[];
  upsertHub: (hub: ProcessHub) => void;
  removeHub: (hubId: string) => void;
  isUnsaved: (hubId: string) => boolean;
}

export const useUnsavedHubsStore = create<UnsavedHubsState>((set, get) => ({
  hubs: [],
  upsertHub: hub =>
    set(state => ({
      hubs: [...state.hubs.filter(h => h.id !== hub.id), hub],
    })),
  removeHub: hubId => set(state => ({ hubs: state.hubs.filter(h => h.id !== hubId) })),
  isUnsaved: hubId => get().hubs.some(h => h.id === hubId),
}));
```

(Feature-store placement per azure CLAUDE.md FSD: app-local session state belongs in `src/features/*`. New `hubs/` feature directory is consistent with `panels/`, `findings/`, `hubCreation/`.)

- [ ] **Step 4: Run tests to verify pass**

Run: `pnpm --filter @variscout/azure-app test -- --run src/features/hubs`
Expected: 3 PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/features/hubs
git commit -m "feat(azure): unsavedHubsStore — in-memory hub registry for Word-style durability (FSJ-3a, spec §3)"
```

---

### Task 2: Azure landing lib — `ensureHubProject` + `activateHubProject` + `landFreshEntryOnProcess` — Sonnet implementer

**Files:**

- Create: `apps/azure/src/lib/landing.ts`
- Test: `apps/azure/src/lib/__tests__/landing.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// apps/azure/src/lib/__tests__/landing.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ensureHubProject, activateHubProject, landFreshEntryOnProcess } from '../landing';
import { useActiveIPStore, useImprovementProjectStore } from '@variscout/stores';
import type { ProcessHub } from '@variscout/core/processHub';

const USER = { email: 'analyst@contoso.com', name: 'Analyst' };
const NOW = () => 1_750_000_000_000;

describe('ensureHubProject (Untitled-pair guarantee, spec §3)', () => {
  it('creates a hub + project when no hub exists', () => {
    const hub = ensureHubProject(null, 'Case: The Bottleneck', USER, NOW);
    expect(hub.id).toBeTruthy();
    expect(hub.name).toBe('Untitled hub');
    expect(hub.improvementProject).toBeTruthy();
    expect(hub.improvementProject!.metadata.title).toBe('Case: The Bottleneck');
    expect(hub.improvementProject!.hubId).toBe(hub.id);
    expect(hub.improvementProject!.deletedAt).toBeNull();
    expect(hub.improvementProject!.metadata.members[0]).toMatchObject({
      role: 'lead',
      userId: 'analyst@contoso.com',
    });
  });

  it('adds a project to an existing hub without touching other fields', () => {
    const existing = {
      id: 'hub-1',
      name: 'My hub',
      createdAt: 1,
      deletedAt: null,
      updatedAt: 1,
      processGoal: 'reduce cycle time',
    } as ProcessHub;
    const hub = ensureHubProject(existing, 'Untitled project', USER, NOW);
    expect(hub.id).toBe('hub-1');
    expect(hub.name).toBe('My hub');
    expect(hub.processGoal).toBe('reduce cycle time');
    expect(hub.improvementProject!.hubId).toBe('hub-1');
  });

  it('is a referential no-op when a live project already exists (reconstruct-not-create, spec §1)', () => {
    const withIP = ensureHubProject(null, 'Existing', USER, NOW);
    const again = ensureHubProject(withIP, 'SHOULD NOT APPLY', USER, NOW);
    expect(again).toBe(withIP);
    expect(again.improvementProject!.metadata.title).toBe('Existing');
  });

  it('replaces a soft-deleted project with a fresh one', () => {
    const withIP = ensureHubProject(null, 'Old', USER, NOW);
    const softDeleted = {
      ...withIP,
      improvementProject: { ...withIP.improvementProject!, deletedAt: 123 },
    } as ProcessHub;
    const hub = ensureHubProject(softDeleted, 'Fresh', USER, NOW);
    expect(hub.improvementProject!.deletedAt).toBeNull();
    expect(hub.improvementProject!.metadata.title).toBe('Fresh');
  });
});

describe('activateHubProject + landFreshEntryOnProcess', () => {
  beforeEach(() => {
    // Store reset per writing-tests skill — verify the actual reset shape against
    // each store's state interface before finalizing.
    useActiveIPStore.setState({ activeIPs: {} });
  });

  it('activates under the caller-supplied (email) scope key — the key Editor reads', () => {
    const hub = ensureHubProject(null, 'Untitled project', USER, NOW);
    activateHubProject(hub, USER.email);
    const scope = { hubId: hub.id, userId: USER.email };
    expect(useActiveIPStore.getState().getActiveIP(scope)?.ipId).toBe(hub.improvementProject!.id);
    expect(useImprovementProjectStore.getState().getProjectForHub(hub.id)?.id).toBe(
      hub.improvementProject!.id
    );
  });

  it('landFreshEntryOnProcess registers a NEW hub, sets processHubId, routes to frame', () => {
    const registerHub = vi.fn();
    const setProcessHubId = vi.fn();
    const showFrame = vi.fn();
    const hub = landFreshEntryOnProcess('Untitled project', {
      activeHub: null,
      registerHub,
      setProcessHubId,
      showFrame,
      user: USER,
    });
    expect(registerHub).toHaveBeenCalledWith(hub);
    expect(setProcessHubId).toHaveBeenCalledWith(hub.id);
    expect(showFrame).toHaveBeenCalledTimes(1);
  });

  it('reuses a live hub+project without re-registering (negative control)', () => {
    const existing = ensureHubProject(null, 'Existing', USER, NOW);
    const registerHub = vi.fn();
    const setProcessHubId = vi.fn();
    const showFrame = vi.fn();
    const hub = landFreshEntryOnProcess('IGNORED', {
      activeHub: existing,
      registerHub,
      setProcessHubId,
      showFrame,
      user: USER,
    });
    expect(hub).toBe(existing);
    expect(registerHub).not.toHaveBeenCalled();
    expect(setProcessHubId).not.toHaveBeenCalled();
    expect(showFrame).toHaveBeenCalledTimes(1); // still routes
  });
});
```

- [ ] **Step 2: Run to verify failure** — `pnpm --filter @variscout/azure-app test -- --run src/lib/__tests__/landing` → FAIL (module not found).

- [ ] **Step 3: Implement**

```ts
// apps/azure/src/lib/landing.ts
import { createNewIP } from '@variscout/core/improvementProject';
import type { ProcessHub } from '@variscout/core/processHub';
import { useActiveIPStore, useImprovementProjectStore } from '@variscout/stores';

/** EasyAuth identity (getCurrentUser) — Azure's single user-id convention. */
export interface AzureUserIdentity {
  email: string;
  name?: string;
}

/**
 * The Untitled-pair guarantee (first-session spec §3, Azure mirror of PWA
 * ensureSessionProject): every fresh data entry yields a hub carrying a live
 * ImprovementProject. Pure: returns the input hub unchanged (same reference)
 * when a live project already exists — imports/reopens reconstruct, never
 * re-wrap (spec §1). Nothing here persists (Word-style: in-memory until the
 * first explicit save flushes via saveProcessHub).
 */
export function ensureHubProject(
  hub: ProcessHub | null,
  title: string,
  user: AzureUserIdentity,
  now: () => number = Date.now
): ProcessHub {
  if (hub?.improvementProject && hub.improvementProject.deletedAt === null) {
    return hub;
  }
  const base: ProcessHub = hub ?? {
    id: crypto.randomUUID(),
    name: 'Untitled hub',
    createdAt: now(),
    deletedAt: null,
    updatedAt: now(),
  };
  const ip = createNewIP({
    hubId: base.id,
    title,
    currentUserId: user.email,
    currentUserDisplayName: user.name,
  });
  return { ...base, improvementProject: ip, updatedAt: now() };
}

/**
 * Activate the hub's project under the caller-supplied scope key — Azure
 * production reads { hubId, userId: currentUser.email } (Editor.tsx:530), so
 * the write MUST use the same key (PWA scope-key lesson, FSJ-1). Writes via
 * getState() because the hook's scope for a just-created hub is stale at
 * closure time. Also mirrors the project into useImprovementProjectStore —
 * FrameView's liveProject/canvas-persistence reads come from there.
 * useActiveIPContext's lone-live-IP auto-activation is the pre-auth fallback.
 */
export function activateHubProject(hub: ProcessHub, userId: string): void {
  const ip = hub.improvementProject;
  if (!ip || ip.deletedAt !== null) return;
  useImprovementProjectStore.getState().upsertProject(ip);
  useActiveIPStore.getState().setActiveIP({ hubId: hub.id, userId }, ip.id);
}

/** Deps are injected so this lib stays free of feature-store imports (FSD). */
export interface LandFreshEntryDeps {
  activeHub: ProcessHub | null;
  /** Registers a NEW/mutated in-memory hub — wire to unsavedHubsStore.upsertHub. */
  registerHub: (hub: ProcessHub) => void;
  /** Wire to a processContext.processHubId write. */
  setProcessHubId: (hubId: string) => void;
  /** Wire to usePanelsStore showFrame. (Azure has no embed mode — no exemption
   *  guard, unlike PWA's isEmbedMode dep; grounding 2026-06-06.) */
  showFrame: () => void;
  user: AzureUserIdentity;
}

/**
 * The fresh-entry landing (spec §1): ensure the Untitled pair, activate it,
 * land on the Process tab. The canvas self-routes b0 (no map) vs L2 (seeded
 * map) via detectScopeFromMap — we route to the TAB only.
 */
export function landFreshEntryOnProcess(title: string, deps: LandFreshEntryDeps): ProcessHub {
  const hub = ensureHubProject(deps.activeHub, title, deps.user);
  if (hub !== deps.activeHub) {
    deps.registerHub(hub);
    deps.setProcessHubId(hub.id);
  }
  activateHubProject(hub, deps.user.email);
  deps.showFrame();
  return hub;
}
```

NOTE for the implementer: verify `createNewIP`'s input type (`packages/core/src/improvementProject/factories.ts` — the modal call at Editor.tsx:2375 is the canonical usage; match it, including whether a `now` param exists). Verify `useActiveIPStore`'s state/reset shape (`activeIPs` record + `getActiveIP(scope)` returning `{ ipId, setAt }`) against `packages/stores/src/activeIPStore.ts` and adjust the test's reset + assertion accordingly. Verify `useImprovementProjectStore.getProjectForHub` exists (FrameView.tsx:125-127 uses it).

- [ ] **Step 4: Run tests to verify pass**

Run: `pnpm --filter @variscout/azure-app test -- --run src/lib/__tests__/landing`
Expected: 7 PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/lib/landing.ts apps/azure/src/lib/__tests__/landing.test.ts
git commit -m "feat(azure): landing lib — ensureHubProject + activation under the email scope key (FSJ-3a, spec §1/§3)"
```

---

### Task 3: `useNewHubProvision` — in-memory Untitled pair, eager persist retired — Sonnet implementer

**Files:**

- Modify: `apps/azure/src/features/hubCreation/useNewHubProvision.ts`
- Test: `apps/azure/src/features/hubCreation/__tests__/useNewHubProvision.test.ts` (rewrite — current tests encode the eager persist)

- [ ] **Step 1: Rewrite the tests to the new contract first**

Keep the existing harness/mocks shape (read the current test file first), replacing assertions:

```ts
// Mock getCurrentUser at module level (BEFORE imports, per writing-tests):
vi.mock('../../../auth/getCurrentUser', () => ({
  getCurrentUser: vi.fn(async () => ({ name: 'Analyst', email: 'analyst@contoso.com' })),
}));

it('creates the hub + Untitled project pair in-memory — saveProcessHub is NEVER called', async () => {
  const onCreated = vi.fn();
  const { result } = renderHook(() => useNewHubProvision({ onCreated }));
  const hub = await result.current.createHubFromGoal('');
  expect(mockSaveProcessHub).not.toHaveBeenCalled(); // the retired eager persist — negative control
  expect(hub.name).toBe('Untitled hub');
  expect(hub.improvementProject).toBeTruthy();
  expect(hub.improvementProject!.metadata.title).toBe('Untitled project');
  expect(hub.improvementProject!.metadata.members[0]).toMatchObject({
    role: 'lead',
    userId: 'analyst@contoso.com',
  });
  expect(useUnsavedHubsStore.getState().isUnsaved(hub.id)).toBe(true);
  expect(onCreated).toHaveBeenCalledWith(hub);
});

it('derives hub + project name from the goal narrative', async () => {
  const hub = await result.current.createHubFromGoal(
    'Reduce order-to-ship cycle time. Customers wait too long.'
  );
  expect(hub.name).not.toBe('Untitled hub'); // extractHubName derived
  expect(hub.improvementProject!.metadata.title).toBe(hub.name);
  expect(hub.processGoal).toContain('Reduce order-to-ship');
});

it('pre-auth (getCurrentUser → null): hub is created WITHOUT a project (no empty-creator IP)', async () => {
  vi.mocked(getCurrentUser).mockResolvedValueOnce(null);
  const hub = await result.current.createHubFromGoal('');
  expect(hub.improvementProject).toBeUndefined();
  expect(useUnsavedHubsStore.getState().isUnsaved(hub.id)).toBe(true);
});
```

Add `useUnsavedHubsStore.setState({ hubs: [] })` to `beforeEach`.

- [ ] **Step 2: Run to verify failure** — `pnpm --filter @variscout/azure-app test -- --run src/features/hubCreation` → FAIL (eager persist still fires; no IP on hub).

- [ ] **Step 3: Implement**

Replace the hook body (keep `UseNewHubProvisionOptions`/`Result` shapes — both callers depend on `createHubFromGoal(goal): Promise<ProcessHub>` + `onCreated(hub)`):

```ts
import { useCallback } from 'react';
import { extractHubName } from '@variscout/core';
import type { ProcessHub } from '@variscout/core/processHub';
import { getCurrentUser } from '../../auth/getCurrentUser';
import { useUnsavedHubsStore } from '../hubs/unsavedHubsStore';
import { ensureHubProject } from '../../lib/landing';

export function useNewHubProvision({
  onCreated,
}: UseNewHubProvisionOptions): UseNewHubProvisionResult {
  const createHubFromGoal = useCallback(
    async (goalNarrative: string): Promise<ProcessHub> => {
      const trimmed = goalNarrative.trim();
      const name = extractHubName(trimmed) || 'Untitled hub';
      const now = Date.now();
      const base: ProcessHub = {
        id: crypto.randomUUID(),
        name,
        processGoal: trimmed || undefined,
        createdAt: now,
        deletedAt: null,
        updatedAt: now,
      };
      // FSJ-3a (spec §3): the Untitled pair — hub + ImprovementProject — is
      // born together, in-memory. The eager saveProcessHub is retired; the
      // first explicit save flushes (Word-style). Pre-auth edge: no identity
      // to own the project — create the hub bare (pre-FSJ behavior); the next
      // authenticated entry's ensureHubProject completes the pair.
      const user = await getCurrentUser();
      const hub = user
        ? ensureHubProject(base, name === 'Untitled hub' ? 'Untitled project' : name, user)
        : base;
      useUnsavedHubsStore.getState().upsertHub(hub);
      onCreated(hub);
      return hub;
    },
    [onCreated]
  );

  return { createHubFromGoal, isPending: false };
}
```

Remove the `useStorage` import + the file-header doc comment's "persists" language (rewrite it to the Word-style story). Update the option's doc: `/** Called with the new in-memory hub. */`

- [ ] **Step 4: Run the feature suite + both callers' suites**

Run: `pnpm --filter @variscout/azure-app test -- --run src/features/hubCreation src/pages/__tests__/Dashboard.processHub`
Expected: hubCreation PASS; **Dashboard.processHub FAILS** on its "saveProcessHub called once" assertion (~:242) — that is Task 7's contract change. Do NOT fix it here; note it in the commit message.

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/features/hubCreation
git commit -m "feat(azure): useNewHubProvision mints the in-memory Untitled pair — eager saveProcessHub retired (FSJ-3a, spec §3); Dashboard test updated in the Dashboard task"
```

---

### Task 4: Editor durability seam — catalog∪unsaved merge + `commitHubChange` + first-save flush — Opus implementer

**Files:**

- Modify: `apps/azure/src/pages/Editor.tsx` (hub state ~:361-375, Stage-3 confirm ~:1535-1550, `saveAndRecordBaseline` ~:1585-1610, `handleHubCreated` ~:979-985)

This is glue in a 2415-line component — no new unit test file; the lib/store tests (Tasks 1-3) carry the logic, the full app suite is the net, the chrome walk verifies integration (Task 8). Re-anchor every edit by symbol.

- [ ] **Step 1: Merge unsaved hubs into `processHubs`**

Rename the state (`:361`) and derive the merged list:

```tsx
const [catalogHubs, setCatalogHubs] = useState<ProcessHub[]>([]);
const unsavedHubs = useUnsavedHubsStore(s => s.hubs);
// Word-style durability (FSJ-3a, spec §3): in-memory hubs join the storage
// catalog for resolution (activeHub, document snapshots, hub pickers). An id
// collision prefers the unsaved copy — it carries the session's edits.
const processHubs = useMemo(() => {
  const unsavedIds = new Set(unsavedHubs.map(h => h.id));
  return [...catalogHubs.filter(h => !unsavedIds.has(h.id)), ...unsavedHubs];
}, [catalogHubs, unsavedHubs]);
```

Update the `listProcessHubs` effect (`:371-375`) to `setCatalogHubs`. Every other `processHubs` READ stays untouched (it's the same name). Imports: `useUnsavedHubsStore` from `../features/hubs/unsavedHubsStore`.

- [ ] **Step 2: `handleHubCreated` — drop the local append (the hook now registers in the store), keep the context write**

```tsx
const handleHubCreated = useCallback(
  (hub: ProcessHub) => {
    // FSJ-3a: the reworked useNewHubProvision registers the hub in
    // unsavedHubsStore (it reaches processHubs via the merge); here we bind
    // the session to it and activate the pair under the scope key production
    // reads (currentUser.email — see the useActiveIPContext call above).
    setProcessContext({ ...(processContext ?? {}), processHubId: hub.id });
    if (currentUser?.email) activateHubProject(hub, currentUser.email);
  },
  [processContext, setProcessContext, currentUser?.email]
);
```

Import `activateHubProject` from `../lib/landing`.

- [ ] **Step 3: Add `commitHubChange` (place near `saveAndRecordBaseline`)**

```tsx
/**
 * Word-style hub writes (FSJ-3a, spec §3): an unsaved hub's mutations stay
 * in-memory (the first explicit save flushes them); a persisted hub keeps
 * today's immediate saveProcessHub — and the catalog state is updated so
 * downstream readers (FrameView outcomeSpecs) never go stale.
 */
const commitHubChange = useCallback(
  async (hub: ProcessHub) => {
    const unsaved = useUnsavedHubsStore.getState();
    if (unsaved.isUnsaved(hub.id)) {
      unsaved.upsertHub(hub);
      return;
    }
    setCatalogHubs(prev => prev.map(h => (h.id === hub.id ? hub : h)));
    await saveProcessHub(hub);
  },
  [saveProcessHub]
);
```

- [ ] **Step 4: Route the Stage-3 outcomes fold through it**

In `handleMappingConfirmWithCategories` (anchor: the comment "Persist outcomes + primaryScopeDimensions to the active Hub", ~:1532-1550), replace the `saveProcessHub({...})` call with:

```tsx
void commitHubChange({
  ...currentHub,
  outcomes,
  primaryScopeDimensions,
  updatedAt: Date.now(),
}).catch(() => {
  // Non-blocking — storage failure is logged by the storage service
});
```

Swap `saveProcessHub` → `commitHubChange` in the callback's deps array.

- [ ] **Step 5: First-explicit-save flush in `saveAndRecordBaseline`**

After the success bookkeeping (`setSavedFingerprint(...)`, ~:1601) and INSIDE the existing `try`, add:

```tsx
// FSJ-3a (spec §3): the first explicit save flushes the in-memory hub to
// the catalog so activeHub survives reload (the document snapshot already
// carried it — buildDocumentSnapshot reads the activeHub closure). The hub
// catalog write is NOT under withDocumentSaveLock/ETag by design (it is a
// separate, fire-and-forget-cloud surface — azure CLAUDE.md); do not wrap.
const unsaved = useUnsavedHubsStore.getState();
if (activeHub && unsaved.isUnsaved(activeHub.id)) {
  await saveProcessHub(activeHub);
  unsaved.removeHub(activeHub.id);
  setCatalogHubs(prev => [...prev.filter(h => h.id !== activeHub.id), activeHub]);
}
```

Add `activeHub` + `saveProcessHub` to the deps array. The conflict early-return (`result?.status === 'conflict'`) stays ABOVE this — a conflicted document save must NOT flush the hub.

- [ ] **Step 6: Run the app suite**

Run: `pnpm --filter @variscout/azure-app test -- --run`
Expected: PASS except the known Dashboard.processHub failure (Task 7 owns it). If other suites mock `setProcessHubs`/hub state, re-anchor them to `setCatalogHubs` honestly.

- [ ] **Step 7: Commit**

```bash
git add apps/azure/src/pages/Editor.tsx
git commit -m "feat(azure): Editor resolves catalog∪unsaved hubs; Stage-3 fold + first explicit save go Word-style (FSJ-3a, spec §3)"
```

---

### Task 5: `CreateProjectModal` — idempotent (IM-0a 1:1) + embed-onto-hub — Sonnet implementer

**Files:**

- Modify: `apps/azure/src/pages/Editor.tsx` (the modal mount, anchor: "Create-Project modal — lightweight Home CTA path", ~:2366-2389)

Grounding (decision 2): the shipped modal upserts the IP to the store but never embeds it on the hub row, while `useActiveIPContext` derives `activeIP` from `hub.improvementProject` — a pre-existing gap. With FSJ-3a auto-pairing, the modal must also never double-create.

- [ ] **Step 1: Replace the `onSave` body**

```tsx
onSave={({ title, issueStatement }) => {
  const existing = activeHub.improvementProject;
  if (existing && existing.deletedAt === null) {
    // IM-0a 1:1 guard (FSJ-3a): the Untitled pair already exists — this
    // ceremony names/frames it; it never mints a second project per hub.
    const updated = {
      ...existing,
      metadata: { ...existing.metadata, title },
      ...(issueStatement ? { issueStatement } : {}),
    };
    upsertProject(updated);
    void commitHubChange({ ...activeHub, improvementProject: updated, updatedAt: Date.now() });
    activeIPContext.setActiveIP(updated.id);
  } else {
    const newIP = createNewIP({
      hubId: activeHub.id,
      title,
      issueStatement,
      currentUserId: currentUser.email,
      currentUserDisplayName: currentUser.name,
    });
    upsertProject(newIP);
    // FSJ-3a: embed on the hub row — useActiveIPContext derives activeIP
    // from hub.improvementProject, so a store-only upsert leaves the
    // Process tab gated (pre-existing gap, fixed here).
    void commitHubChange({ ...activeHub, improvementProject: newIP, updatedAt: Date.now() });
    activeIPContext.setActiveIP(newIP.id);
  }
  setIsCreateProjectModalOpen(false);
  usePanelsStore.getState().showFrame();
}}
```

Verify `ImprovementProject.issueStatement` is a top-level field (types.ts ~:157) and `metadata.title` the title home — match the existing `createNewIP` output shape.

- [ ] **Step 2: Run the app suite** — `pnpm --filter @variscout/azure-app test -- --run` → no new failures.

- [ ] **Step 3: Commit**

```bash
git add apps/azure/src/pages/Editor.tsx
git commit -m "fix(azure): CreateProjectModal embeds the project on the hub row + never double-creates (FSJ-3a, IM-0a 1:1)"
```

---

### Task 6: Sample + manual entry land on the Process tab — Sonnet implementer

**Files:**

- Modify: `apps/azure/src/features/data-flow/useEditorDataFlow.ts` (`handleLoadSample` ~:842-856)
- Modify: `apps/azure/src/pages/Editor.tsx` (sample wiring: `EditorEmptyState` mount ~:1922, `initialSample` effect ~:1190-1201; manual wiring: `ManualEntry` mount ~:1725-1734)
- Test: `apps/azure/src/features/data-flow/__tests__/useEditorDataFlow.loadSample.test.ts` (create — model the harness on `useEditorDataFlow.matchSummary.test.ts`; read it FIRST)

- [ ] **Step 1: `handleLoadSample` returns whether it loaded** (the landing wrapper must not fire when the replace-confirm is declined):

```ts
const handleLoadSample = useCallback(
  (sample: SampleDataset): boolean => {
    if (rawData.length > 0 && outcome) {
      if (!window.confirm('Replace current data? This will start a new analysis.')) return false;
    }
    loadSample(sample);
    // Pre-configured samples already have outcome/factors — skip ColumnMapping
    const hasPreconfigured =
      sample.config?.outcome && sample.config.factors && sample.config.factors.length > 0;
    if (!hasPreconfigured) {
      dispatch({ type: 'OPEN_MAPPING' });
    }
    return true;
  },
  [rawData.length, outcome, loadSample]
);
```

Update the return-type member in `UseEditorDataFlowReturn` (and remember the `hooks/useEditorDataFlow.ts` re-export barrel re-exports the TYPE — no edit needed there unless the type name changes).

- [ ] **Step 2: Hook test** (new file; verify with a declined-confirm spy):

```ts
it('returns true and loads on a fresh session', ...);
it('returns false and loads nothing when the replace-confirm is declined (negative control)', () => {
  vi.spyOn(window, 'confirm').mockReturnValue(false);
  // pre-seed rawData + outcome via makeOptions, call handleLoadSample
  expect(result.current.handleLoadSample(sample)).toBe(false);
  expect(loadSample).not.toHaveBeenCalled();
});
```

- [ ] **Step 3: Editor sample wrapper** (place near `handleHubCreated`):

```tsx
// FSJ-3a landing (spec §1/§3): fresh sample entry lands on the Process tab
// with an ensured + activated Untitled pair, named for the sample. The canvas
// self-routes b0 (no map) vs L2 (seeded map — The Bottleneck) downstream.
const handleLoadSampleWithLanding = useCallback(
  async (sample: SampleDataset) => {
    if (!dataFlow.handleLoadSample(sample)) return;
    const user = currentUser ?? (await getCurrentUser());
    if (!user) return; // pre-auth edge: keep today's no-project behavior
    landFreshEntryOnProcess(sample.name, {
      activeHub: activeHub ?? null,
      registerHub: useUnsavedHubsStore.getState().upsertHub,
      setProcessHubId: hubId =>
        setProcessContext({ ...(processContext ?? {}), processHubId: hubId }),
      showFrame: usePanelsStore.getState().showFrame,
      user,
    });
  },
  [dataFlow, currentUser, activeHub, processContext, setProcessContext]
);
```

Import `landFreshEntryOnProcess` from `../lib/landing`, `getCurrentUser` is already imported. Wire it at BOTH sample entry points: (a) the `EditorEmptyState` mount — it receives the whole `dataFlow` object (`:1923`), so pass the wrapper as a new explicit prop (`onLoadSample={handleLoadSampleWithLanding}`) and change `EditorEmptyState` to prefer it over `dataFlow.handleLoadSample` for the sample tiles (read `EditorEmptyState.tsx` first; keep its other `dataFlow` uses untouched); (b) the `initialSample` effect (`:1190-1201`) — it runs once on mount via `dataFlowRef`; mirror that pattern with a `handleLoadSampleWithLandingRef` kept current each render, and call `handleLoadSampleWithLandingRef.current(initialSample)`.

- [ ] **Step 4: Manual entry wrapper** (manual analyze writes outcome/factors directly — the existence proof, spec §7):

```tsx
const handleManualAnalyzeWithLanding = useCallback(
  (...args: Parameters<typeof handleManualDataAnalyze>) => {
    handleManualDataAnalyze(...args);
    if (dataFlow.appendMode) return; // append = re-ingestion, not first-session (spec §7)
    void (async () => {
      const user = currentUser ?? (await getCurrentUser());
      if (!user) return;
      landFreshEntryOnProcess('Untitled project', {
        activeHub: activeHub ?? null,
        registerHub: useUnsavedHubsStore.getState().upsertHub,
        setProcessHubId: hubId =>
          setProcessContext({ ...(processContext ?? {}), processHubId: hubId }),
        showFrame: usePanelsStore.getState().showFrame,
        user,
      });
    })();
  },
  [
    handleManualDataAnalyze,
    dataFlow.appendMode,
    currentUser,
    activeHub,
    processContext,
    setProcessContext,
  ]
);
```

Wire at the `ManualEntry` mount (`:1728`): `onAnalyze={handleManualAnalyzeWithLanding}`. (Read `handleManualDataAnalyze`'s signature from `useDataMerge` (~:887) and keep `Parameters<>` honest.)

- [ ] **Step 5: Run the touched suites**

Run: `pnpm --filter @variscout/azure-app test -- --run src/features/data-flow src/components/editor`
Expected: PASS (incl. the pre-existing data-flow suites — `handleLoadSample`'s boolean return is additive).

- [ ] **Step 6: Commit**

```bash
git add apps/azure/src/features/data-flow apps/azure/src/pages/Editor.tsx apps/azure/src/components/editor/EditorEmptyState.tsx
git commit -m "feat(azure): sample + manual entry land on the Process tab with the Untitled pair (FSJ-3a, spec §1/§3)"
```

---

### Task 7: Dashboard — unsaved-aware hub list + writers — Sonnet implementer

**Files:**

- Modify: `apps/azure/src/pages/Dashboard.tsx` (hub list state, `handleHubCpkTargetCommit` ~:215-225, `handleHubGoalChange` ~:230-247, `useNewHubProvision` wiring ~:40-45)
- Test: `apps/azure/src/pages/__tests__/Dashboard.processHub.test.tsx` (update the eager-persist assertions)

- [ ] **Step 1: Merge unsaved hubs** — mirror Task 4's pattern: rename local state to `catalogHubs`, derive `processHubs = catalog ∪ unsaved` (same memo + comment, cross-reference Editor). The `useNewHubProvision.onCreated` callback drops its `setProcessHubs(prev => [...prev, hub])` append (the store registration covers it; keep `setSelectedHubId(hub.id)`).

- [ ] **Step 2: Word-style writers** — in BOTH `handleHubCpkTargetCommit` and `handleHubGoalChange`, replace the optimistic-update + `void saveProcessHub(updated)` tail with the same branch Editor uses (a local `commitHubChange` helper at Dashboard scope — same shape as Editor's, comment cross-references it):

```ts
const commitHubChange = useCallback(
  (updated: ProcessHub) => {
    const unsaved = useUnsavedHubsStore.getState();
    if (unsaved.isUnsaved(updated.id)) {
      unsaved.upsertHub(updated);
      return;
    }
    setCatalogHubs(prev => prev.map(h => (h.id === updated.id ? updated : h)));
    void saveProcessHub(updated).catch(err => {
      console.error('[Dashboard] hub commit failed:', err);
    });
  },
  [saveProcessHub]
);
```

- [ ] **Step 3: Update `Dashboard.processHub.test.tsx`** — the "New Hub" block (~:229-251): `mockSaveProcessHub` is now NOT called; assert instead that the created hub appears in the rendered list (via the unsaved merge) with name 'Untitled hub', and that `useUnsavedHubsStore.getState().isUnsaved(...)` is true. Reset the unsaved store in `beforeEach`. These are honest contract-change edits, not weakening — the assertions move from "persisted on click" to "in-memory until save," which IS FSJ-3a's contract.

- [ ] **Step 4: Run** — `pnpm --filter @variscout/azure-app test -- --run src/pages` → PASS (the Task-3 known failure closes here).

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/pages/Dashboard.tsx apps/azure/src/pages/__tests__/Dashboard.processHub.test.tsx
git commit -m "feat(azure): Dashboard goes Word-style — unsaved hubs listed + edited in-memory (FSJ-3a, spec §3)"
```

---

### Task 8: Full verification + chrome walk + PR (controller-level)

- [ ] **Step 1: Targeted sweeps** — `pnpm --filter @variscout/azure-app test -- --run` + `pnpm --filter @variscout/azure-app build`. Expected: green. (Implementer scope ends at targeted runs per `feedback_implementer_long_bash_pitfall` — this sweep is controller-level.)
- [ ] **Step 2 (controller): `bash scripts/pr-ready-check.sh`** — green before PR. PWA must be untouched: `git diff --stat origin/main -- apps/pwa packages` should show NOTHING outside this plan's files (no shared-package edits expected at all in 3a).
- [ ] **Step 3 (controller): `--chrome` walk** (drive via `element.click()` in javascript_tool — CDP synthetic clicks fail silently, FSJ-2 method note):
  - (a) fresh Azure session → load The Bottleneck sample → **lands on Process tab at L2** (seeded map visible), Untitled pair active (ActiveIPScopeRibbon shows the sample-named project), **no eager persist** (reload before save → hub gone, Word-style);
  - (b) load a map-less sample → lands at b0 (and the PR-0-fixed expander opens cleanly);
  - (c) manual entry → analyze → Process tab + Untitled pair;
  - (d) paste → wizard path **unchanged** (Stage-1 → ColumnMapping → confirm → Explore + Stage-5 modal) BUT the pair now exists in-memory after Stage-1, and Stage-3's outcomes fold no longer hits storage for the unsaved hub (devtools: no `saveProcessHub` network/IDB write until Save As);
  - (e) Save As → document saved AND hub flushed (reload → hub + project + outcomes survive; autosave only active after this point);
  - (f) Dashboard New Hub → hub appears in list unsaved; rename/goal edit stays in-memory; CreateProjectModal on a paired hub renames instead of double-creating, and the Process tab is NOT gated after modal-save (the embed fix);
  - (g) regression: open an existing saved project → **landing unchanged** (persisted view / dashboard, Editor.tsx:1109-1117); second paste into a complete hub → match-summary card still fires.
- [ ] **Step 4: PR** — `gh pr create` (title `feat(fsj-3a): Azure landing router + Untitled pair, in-memory until save`); spec+quality reviewer pair verifies against wireframes `altitude-model` + `b0-landing` (landing rows only — b0 chrome rows are FSJ-3b) and the §3 durability story; then `gh pr merge --merge --delete-branch`.
- [ ] **Step 5 (controller, post-merge, direct to main): Apply-at-delivery docs** — master-plan FSJ-3 row → 3a ✅ + 3b next; investigations.md entries: (i) `.vrs` import dead in Azure UI (no `onLoadProjectFile` wire — decision 8), (ii) the CreateProjectModal embed gap was live pre-FSJ (fixed in this PR — close the loop if an entry exists), (iii) reload-before-first-save loses the in-memory session by design until FSJ-9's nudge+guard land.

---

## Self-review notes (done at plan-write)

- **Master-plan FSJ-3 row coverage (3a slice):** Editor routing to the landing (T6 sample/manual; paste routing = 3b by design) ✓ · `useNewHubProvision` eager-persist rework (T3 + T4 flush + T7 Dashboard) ✓ · hub+project one durability story (T1/T3/T4 — pair born together in-memory, flushed together on first save) ✓ · existing-project landing untouched (decision 10; chrome step g) ✓. Brief+goal relocation = 3b (minimal scope per owner call 2026-06-06).
- **Spec §3 coverage:** auto-create+activate every fresh entry (T3 wizard-path, T6 sample/manual) ✓ · IM-0a 1:1 total (T5 idempotence) ✓ · Word-style in-memory until explicit save (T1/T4/T7) ✓ · E1-T6-style gate dissolves by construction (no gate edits — `NoActiveProjectGuidance` in FrameView becomes unreachable on the main flow) ✓.
- **Known unknowns flagged inline** (verification steps, not placeholders): `createNewIP` input shape (T2); `useActiveIPStore` reset/assert shape (T2); `EditorEmptyState` sample-tile prop shape (T6); `handleManualDataAnalyze` signature (T6); Dashboard test harness shape (T7).
- **Type consistency:** `ensureHubProject(hub, title, user, now?)` (T2) used by T3/T6; `AzureUserIdentity {email, name?}` = `CurrentUser` shape; `LandFreshEntryDeps` (T2) used identically in T6's two wrappers; `commitHubChange(hub)` same contract in T4 (Editor) and T7 (Dashboard); `useUnsavedHubsStore` API (T1) consumed in T3/T4/T6/T7.
- **Adversarial self-check:** autosave premature-persist guarded by decision 3 (nothing writes projectStore.projectId at provision) · conflict-path no-flush (T4 step 5 ordering) · pre-auth null user never mints an empty-creator IP (T3 test) · declined replace-confirm never lands (T6 negative control) · unsaved-copy-shadows-catalog collision handled in the merge (T4/T7) · hub catalog write deliberately outside withDocumentSaveLock (decision 4 comment).
