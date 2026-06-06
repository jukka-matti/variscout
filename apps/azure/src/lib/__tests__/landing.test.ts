import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ensureHubProject, activateHubProject, landFreshEntryOnProcess } from '../landing';
import {
  useActiveIPStore,
  useImprovementProjectStore,
  getActiveIPInitialState,
  getImprovementProjectInitialState,
} from '@variscout/stores';
import type { ProcessHub } from '@variscout/core/processHub';

const USER = { email: 'analyst@contoso.com', name: 'Analyst' };
const NOW = () => 1_750_000_000_000;

describe('ensureHubProject (Untitled-pair guarantee, spec §3)', () => {
  it('creates a hub + project when no hub exists', () => {
    const hub = ensureHubProject(null, 'Case: The Bottleneck', USER, NOW);
    expect(hub.id).toBeTruthy();
    expect(hub.name).toBe('Untitled hub');
    expect(hub.improvementProject).toBeTruthy();
    expect(hub.improvementProject.metadata.title).toBe('Case: The Bottleneck');
    expect(hub.improvementProject.hubId).toBe(hub.id);
    expect(hub.improvementProject.deletedAt).toBeNull();
    expect(hub.improvementProject.metadata.members?.[0]).toMatchObject({
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
    } as unknown as ProcessHub;
    const hub = ensureHubProject(existing, 'Untitled project', USER, NOW);
    expect(hub.id).toBe('hub-1');
    expect(hub.name).toBe('My hub');
    expect(hub.processGoal).toBe('reduce cycle time');
    expect(hub.improvementProject.hubId).toBe('hub-1');
  });

  it('is a referential no-op when a live project already exists (reconstruct-not-create, spec §1)', () => {
    const withIP = ensureHubProject(null, 'Existing', USER, NOW);
    const again = ensureHubProject(withIP, 'SHOULD NOT APPLY', USER, NOW);
    expect(again).toBe(withIP);
    expect(again.improvementProject.metadata.title).toBe('Existing');
  });

  it('replaces a soft-deleted project with a fresh one', () => {
    const withIP = ensureHubProject(null, 'Old', USER, NOW);
    const softDeleted = {
      ...withIP,
      improvementProject: { ...withIP.improvementProject, deletedAt: 123 },
    } as unknown as ProcessHub;
    const hub = ensureHubProject(softDeleted, 'Fresh', USER, NOW);
    expect(hub.improvementProject.deletedAt).toBeNull();
    expect(hub.improvementProject.metadata.title).toBe('Fresh');
  });
});

describe('activateHubProject + landFreshEntryOnProcess', () => {
  beforeEach(() => {
    // Canonical reset: merge (no second arg / no `true`) so store actions are
    // preserved. activeIPStore + improvementProjectStore do not patch
    // getInitialState onto the store instance — use the dedicated factory
    // functions exported from @variscout/stores.
    useActiveIPStore.setState(getActiveIPInitialState());
    useImprovementProjectStore.setState(getImprovementProjectInitialState());
  });

  it('activates under the caller-supplied (email) scope key — the key Editor reads', () => {
    const hub = ensureHubProject(null, 'Untitled project', USER, NOW);
    activateHubProject(hub, USER.email);
    const scope = { hubId: hub.id, userId: USER.email };
    // getActiveIP returns ActiveIPState { ipId, setAt } | null
    expect(useActiveIPStore.getState().getActiveIP(scope)?.ipId).toBe(hub.improvementProject.id);
    expect(useImprovementProjectStore.getState().getProjectForHub(hub.id)?.id).toBe(
      hub.improvementProject.id
    );
  });

  it('activateHubProject with a soft-deleted IP is a silent no-op — neither store written', () => {
    const hub = ensureHubProject(null, 'To be deleted', USER, NOW);
    const hubWithDeletedIP = {
      ...hub,
      improvementProject: { ...hub.improvementProject, deletedAt: 999 },
    } as unknown as ProcessHub;
    activateHubProject(hubWithDeletedIP, USER.email);
    const scope = { hubId: hubWithDeletedIP.id, userId: USER.email };
    expect(useActiveIPStore.getState().getActiveIP(scope)).toBeNull();
    expect(
      useImprovementProjectStore.getState().getProjectForHub(hubWithDeletedIP.id)
    ).toBeUndefined();
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
