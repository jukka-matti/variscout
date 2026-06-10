import { createNewIP } from '@variscout/core/improvementProject';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import type { ProcessHub } from '@variscout/core/processHub';
import type { StepTimingBinding } from '@variscout/core';
import { useImprovementProjectStore, useProjectStore } from '@variscout/stores';

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
 *
 * Azure divergence from PWA ensureSessionProject:
 * - The Lead member's userId is the EasyAuth email (not PWA_USER_ID 'analyst@local').
 * - The caller still passes the EasyAuth email through the landing dependency shape,
 *   though Workspace Project activation is retired.
 */
export function ensureHubProject(
  hub: ProcessHub | null,
  title: string,
  user: AzureUserIdentity,
  now: () => number = Date.now
): ProcessHub & { improvementProject: ImprovementProject } {
  const existingIP = hub?.improvementProject;
  if (existingIP && existingIP.deletedAt === null) {
    return hub as ProcessHub & { improvementProject: ImprovementProject };
  }
  const at = now();
  const base: ProcessHub = hub ?? {
    id: crypto.randomUUID(),
    name: 'Untitled hub',
    createdAt: at,
    deletedAt: null,
    updatedAt: at,
  };
  const ip = createNewIP({
    hubId: base.id,
    title,
    currentUserId: user.email,
    currentUserDisplayName: user.name,
    now,
  });
  return { ...base, improvementProject: ip, updatedAt: at };
}

/**
 * Mirror the hub's project into useImprovementProjectStore so FrameView's
 * liveProject/canvas-persistence reads have the Workspace Project available.
 */
export function activateHubProject(hub: ProcessHub, _userId: string): void {
  const ip = hub.improvementProject;
  if (!ip || ip.deletedAt !== null) return;
  useImprovementProjectStore.getState().upsertProject(ip);
}

/**
 * Merge the landing's processHubId into the LIVE processContext, read at call
 * time. A render-closure spread here clobbered the processMap that loadSample
 * had just seeded into the store within the same invocation — The Bottleneck
 * landed at b0 instead of L2 (chrome walk 2026-06-06).
 */
export function bindProcessHubId(hubId: string): void {
  const store = useProjectStore.getState();
  store.setProcessContext({ ...(store.processContext ?? {}), processHubId: hubId });
}

/** Deps are injected so this lib stays free of feature-store imports (FSD). */
export interface LandFreshEntryDeps {
  activeHub: ProcessHub | null;
  /**
   * Registers a NEW/mutated in-memory hub — wire to unsavedHubsStore.upsertHub.
   * Not called when activeHub already carries a live project (no-op path).
   */
  registerHub: (hub: ProcessHub) => void;
  /** Wire to a processContext.processHubId write. */
  setProcessHubId: (hubId: string) => void;
  /**
   * Wire to usePanelsStore showFrame. Azure has no embed mode — no exemption
   * guard unlike the PWA's isEmbedMode check in landHubOnProcess. Always called.
   * (Azure divergence 2026-06-06.)
   */
  showFrame: () => void;
  initialStepTimings?: StepTimingBinding[];
  user: AzureUserIdentity;
}

/**
 * The fresh-entry landing (spec §1): ensure the Untitled pair, mirror it,
 * land on the Process tab. The canvas self-routes b0 (no map) vs L2 (seeded
 * map) via detectScopeFromMap — we route to the TAB only.
 *
 * Referential no-op contract: when activeHub already carries a live Workspace Project,
 * ensureHubProject returns the same reference → registerHub + setProcessHubId
 * are not called (idempotent re-entry). showFrame is always called so every
 * fresh data entry lands on Process regardless of current nav state.
 */
export function landFreshEntryOnProcess(title: string, deps: LandFreshEntryDeps): ProcessHub {
  let hub = ensureHubProject(deps.activeHub, title, deps.user);
  if (hub !== deps.activeHub && deps.initialStepTimings?.length) {
    hub = {
      ...hub,
      improvementProject: {
        ...hub.improvementProject,
        stepTimings: deps.initialStepTimings,
      },
    };
  }
  if (hub !== deps.activeHub) {
    deps.registerHub(hub);
    deps.setProcessHubId(hub.id);
  }
  activateHubProject(hub, deps.user.email);
  deps.showFrame();
  return hub;
}
