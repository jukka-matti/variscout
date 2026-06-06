import type { DataRow } from '@variscout/core';
import type { SampleDataset } from '@variscout/data';
import type { ProcessHub } from '@variscout/core/processHub';
import {
  useActiveIPStore,
  hydrateDocumentSnapshot,
  reconstructProcessHubFromDocumentSnapshot,
  type DocumentSnapshotVrsFile,
} from '@variscout/stores';
import { DEFAULT_ACTIVE_IP_USER_ID } from '@variscout/hooks';
import { ensureSessionProject } from './ensureSessionProject';
// NOTE: PWA_USER_ID ('analyst@local') is the Lead member identity used inside
// ensureSessionProject. DEFAULT_ACTIVE_IP_USER_ID ('local') is the annotation
// scope key that useActiveIPContext reads. These are different concerns — do NOT
// unify them.

/**
 * Shared deps for the ensure + activate + route core (sample + .vrs + manual).
 * ISP note: sessionHub is intentionally absent here — the core takes hubBase as
 * an explicit arg. Only the sample path extends this with sessionHub.
 */
export interface LandHubOnProcessDeps {
  /** Update the session hub in app state */
  setSessionHub: (hub: ProcessHub) => void;
  /** Route to the Process tab (panels.showFrame) */
  showFrame: () => void;
  /** Whether the app is in embed/iframe mode */
  isEmbedMode: boolean;
}

/**
 * Core ensure + activate + route logic shared by all landing paths (spec §1,
 * §3). Called after any data loading / reconstruction is already done.
 *
 * Ordering note: `setActiveIP` from `useActiveIPContext` is scoped to the
 * current (OLD) sessionHub.id at closure time. When `ensureSessionProject`
 * creates a NEW hub (no prior session hub), the hook's scope is null and its
 * setter is a no-op. We bypass this by calling `useActiveIPStore.getState()`
 * directly with the NEW hub's explicit scope — the store is always available
 * outside React render, and the call is idempotent if the IP is already active.
 *
 * Embed mode (spec §1 applicability): course-page iframes want the chart
 * surface, never the journey spine. When isEmbedMode is true the Project
 * auto-create + IP activation still run (so state is consistent) but we do
 * NOT call showFrame().
 *
 * @param hubBase - Hub to land on (null = sessionHub, non-null = reconstructed
 *   or existing hub). If it already carries a live IP, ensureSessionProject is
 *   a no-op — reconstruct-not-create (spec §1).
 * @param title - Fallback project title when the hub has no live IP.
 * @param deps - App context: setSessionHub, showFrame, embed flag.
 */
export function landHubOnProcess(
  hubBase: ProcessHub | null,
  title: string,
  deps: LandHubOnProcessDeps
): void {
  const { setSessionHub, showFrame, isEmbedMode } = deps;

  // 1. Ensure the hub carries a live ImprovementProject.
  //    Pure + referential no-op when one already exists (spec §3, reconstruct-
  //    not-create for .vrs imports whose hub already has an IP).
  const hub = ensureSessionProject(hubBase, title);
  setSessionHub(hub);

  // 2. Activate the IP in the annotation store using the hub's explicit scope
  //    so the call is not stale even when a new hub was just created.
  const scope = { hubId: hub.id, userId: DEFAULT_ACTIVE_IP_USER_ID };
  useActiveIPStore.getState().setActiveIP(scope, hub.improvementProject.id);

  // 3. Route to Process tab — exempt in embed mode (spec §1 applicability).
  if (!isEmbedMode) {
    showFrame();
  }
}

/**
 * Deps for the fresh-sample landing path. Extends LandHubOnProcessDeps with
 * the session hub (needed to pass as hubBase to the core) and the data-loading
 * step.
 */
export interface LandOnProcessDeps extends LandHubOnProcessDeps {
  /** Current session hub — passed as hubBase to the shared core */
  sessionHub: ProcessHub | null;
  /** Load data into the project store (ingestion.loadSample) */
  loadSample: (sample: SampleDataset) => void;
}

/**
 * First-session landing handler (spec §1, §3): fresh sample entry lands on
 * the Process tab with an auto-activated Untitled project.
 *
 * Extracted from AppMain so it can be integration-tested without full-App
 * mounting. App.tsx wires this as a thin 3-liner in handleLoadSample.
 */
export function landOnProcess(sample: SampleDataset, deps: LandOnProcessDeps): void {
  const { loadSample, ...coreDeps } = deps;

  // 1. Load data into the project store first (no ordering dependency on hub).
  loadSample(sample);

  // 2. Ensure + activate + route (shared core). sessionHub null → new hub+IP
  //    created; non-null with live IP → same reference (spec §3).
  landHubOnProcess(coreDeps.sessionHub, sample.name, coreDeps);
}

/**
 * .vrs import landing handler (spec §1 applicability): hydrates the snapshot,
 * reconstructs the envelope's own project (reconstruct-not-create), then lands
 * on Process by the altitude rule.
 *
 * Title fallback for project-less snapshots (spec §3 Untitled-project guarantee).
 * Fallback order follows documentSnapshot.ts (hub.name → project.projectName),
 * but the terminal literal here is 'Untitled project' (spec-correct lowercase) vs
 * 'Untitled Project' in the snapshot module — intentional divergence, do not unify.
 *
 * When the reconstructed hub already carries a live IP, ensureSessionProject
 * is a no-op — the envelope's project is never re-wrapped.
 *
 * v1 envelope only (wedge no-back-compat). Embed mode: IP activation still
 * runs but showFrame is skipped (spec §1 applicability).
 */
export function landVrsOnProcess(
  imported: DocumentSnapshotVrsFile,
  deps: LandHubOnProcessDeps
): void {
  // 1. Hydrate document stores from the snapshot.
  hydrateDocumentSnapshot(imported.documentSnapshot);

  // 2. Reconstruct the hub (may already carry improvementProject — upserted by
  //    hydrateDocumentSnapshot). The envelope's own project is the wrapper:
  //    reconstruct-not-create (spec §1).
  const reconstructed = reconstructProcessHubFromDocumentSnapshot(imported.documentSnapshot);

  // 3. Title fallback: mirrors documentSnapshot module's own fallback chain.
  const snapshot = imported.documentSnapshot;
  const title = snapshot.hub?.name ?? snapshot.project.projectName ?? 'Untitled project';

  // 4. Ensure + activate + route (shared core). Pass reconstructed as hubBase
  //    so its live IP is preserved unchanged (ensureSessionProject is a no-op
  //    when improvementProject is already live). The ambient sessionHub is not
  //    part of LandHubOnProcessDeps — the reconstructed hub IS the authoritative
  //    source here.
  landHubOnProcess(reconstructed, title, deps);
}

/**
 * Deps for the fresh-paste landing path (FSJ-2). Pastes have no name source,
 * so the title is always the spec-correct 'Untitled project' literal (§3).
 */
export interface LandPasteOnProcessDeps extends LandHubOnProcessDeps {
  /** Current session hub — passed as hubBase to the shared core */
  sessionHub: ProcessHub | null;
}

/**
 * Fresh-paste landing handler (spec §1, §3): invoked by usePasteImportFlow's
 * onFreshPasteLanded AFTER the pipeline has written rawData/outcome/factors —
 * data loading is not this function's concern (unlike landOnProcess). Ensure +
 * activate + route only.
 */
export function landPasteOnProcess(deps: LandPasteOnProcessDeps): void {
  const { sessionHub, ...coreDeps } = deps;
  landHubOnProcess(sessionHub, 'Untitled project', coreDeps);
}

/**
 * Manual-entry analyze callback signature — mirrors usePasteImportFlow's
 * handleManualDataAnalyze exactly so the wrapper in App.tsx can spread params
 * through without an intermediate type.
 */
export type ManualAnalyzeFn = (
  data: DataRow[],
  config: {
    outcome: string;
    factors: string[];
    specs?: { usl?: number; lsl?: number };
  }
) => void;

/**
 * Deps for the manual-entry landing path. Extends LandHubOnProcessDeps with
 * the injected manualAnalyze function and the current session hub.
 */
export interface LandManualOnProcessDeps extends LandHubOnProcessDeps {
  /** Current session hub — passed as hubBase to the shared core */
  sessionHub: ProcessHub | null;
  /**
   * The usePasteImportFlow manualAnalyze callback. Injected so the pure
   * function can be tested without the hook's internal state.
   */
  manualAnalyze: ManualAnalyzeFn;
}

/**
 * Manual-entry landing handler (spec §1, §3): invokes the injected
 * manualAnalyze (which writes data/outcome/factors/specs into the project
 * store), then lands on the Process tab with an auto-activated 'Untitled
 * project'. Manual entries have no name source, so the title is always the
 * spec-correct literal.
 *
 * Embed-mode consistency: manual entry is unreachable inside iframes, but the
 * embed guard in the shared core fires anyway — no special case needed here.
 */
export function landManualOnProcess(
  data: DataRow[],
  config: { outcome: string; factors: string[]; specs?: { usl?: number; lsl?: number } },
  deps: LandManualOnProcessDeps
): void {
  const { manualAnalyze, sessionHub, ...coreDeps } = deps;

  // 1. Write data/outcome/factors/specs into the project store (same as the
  //    raw handleManualDataAnalyze path — logic lives in the injected fn).
  manualAnalyze(data, config);

  // 2. Ensure + activate + route (shared core). sessionHub null → new hub+IP
  //    created; non-null with live IP → same reference (spec §3).
  landHubOnProcess(sessionHub, 'Untitled project', coreDeps);
}
