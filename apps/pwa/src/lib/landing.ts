import type { DataRow, StepTimingBinding } from '@variscout/core';
import type { SampleDataset } from '@variscout/data';
import type { SampleImprovementProjectState } from '@variscout/data';
import type { ProcessHub } from '@variscout/core/processHub';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import {
  hydrateDocumentSnapshot,
  reconstructProcessHubFromDocumentSnapshot,
  type DocumentSnapshotVrsFile,
} from '@variscout/stores';
import { ensureSessionProject } from './ensureSessionProject';

/**
 * Shared deps for the ensure + route core (sample + .vrs + manual).
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

function applySampleImprovementProjectSeed(
  project: ImprovementProject,
  seed?: SampleImprovementProjectState
): ImprovementProject {
  if (!seed) return project;

  return {
    ...project,
    issueStatement: seed.issueStatement ?? project.issueStatement,
    metadata: {
      ...project.metadata,
      ...(seed.metadata ?? {}),
      actions: seed.actions
        ? seed.actions.map(action => ({
            ...action,
            parentImprovementProjectId: project.id,
            deletedAt: action.deletedAt ?? null,
          }))
        : project.metadata.actions,
    },
    goal: {
      ...project.goal,
      ...(seed.goal ?? {}),
    },
    sections: {
      background: {
        ...project.sections.background,
        ...(seed.sections?.background ?? {}),
      },
      approach: {
        ...project.sections.approach,
        ...(seed.sections?.approach ?? {}),
      },
      outcomeReference: {
        ...project.sections.outcomeReference,
        ...(seed.sections?.outcomeReference ?? {}),
      },
    },
  };
}

/**
 * Ensure core (spec §3): the routing-free heart shared by every
 * landing path AND by the wizard-path paste provisioning (FSJ-2 addendum). Steps
 * 1-2 of landHubOnProcess, verbatim — extracted so the Untitled-project guarantee
 * can hold for entries that must NOT route (the wizard keeps today's landing).
 *
 * @param hubBase - Hub to ensure (null = create new, non-null = existing). If it
 *   already carries a live IP, ensureSessionProject is a referential no-op (spec
 *   §3, reconstruct-not-create).
 * @param title - Fallback project title when the hub has no live IP.
 * @param setSessionHub - Update the session hub in app state.
 */
export function ensureAndActivateProject(
  hubBase: ProcessHub | null,
  title: string,
  setSessionHub: (hub: ProcessHub) => void,
  initialStepTimings?: StepTimingBinding[],
  initialImprovementProject?: SampleImprovementProjectState
): void {
  // 1. Ensure the hub carries a live ImprovementProject.
  //    Pure + referential no-op when one already exists (spec §3, reconstruct-
  //    not-create for .vrs imports whose hub already has an IP).
  const hasLiveProject = hubBase?.improvementProject?.deletedAt === null;
  let hub = ensureSessionProject(hubBase, title);
  if (!hasLiveProject && initialStepTimings?.length) {
    hub = {
      ...hub,
      improvementProject: {
        ...hub.improvementProject,
        stepTimings: initialStepTimings,
      },
    };
  }
  if (hub.improvementProject && initialImprovementProject) {
    hub = {
      ...hub,
      improvementProject: applySampleImprovementProjectSeed(
        hub.improvementProject,
        initialImprovementProject
      ),
    };
  }
  setSessionHub(hub);
}

/**
 * Core ensure + route logic shared by all landing paths (spec §1,
 * §3). Called after any data loading / reconstruction is already done.
 * Composes ensureAndActivateProject (steps 1-2) + the embed-guarded showFrame.
 *
 * Embed mode (spec §1 applicability): course-page iframes want the chart
 * surface, never the journey spine. When isEmbedMode is true the Project
 * auto-create still runs (so state is consistent) but we do
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
  deps: LandHubOnProcessDeps,
  initialStepTimings?: StepTimingBinding[],
  initialImprovementProject?: SampleImprovementProjectState
): void {
  const { setSessionHub, showFrame, isEmbedMode } = deps;

  // 1-2. Ensure the hub carries a live Workspace Project (shared core).
  ensureAndActivateProject(
    hubBase,
    title,
    setSessionHub,
    initialStepTimings,
    initialImprovementProject
  );

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
 * the Process tab with an attached Untitled project.
 *
 * Extracted from AppMain so it can be integration-tested without full-App
 * mounting. App.tsx wires this as a thin 3-liner in handleLoadSample.
 */
export function landOnProcess(sample: SampleDataset, deps: LandOnProcessDeps): void {
  const { loadSample, ...coreDeps } = deps;

  // 1. Load data into the project store first (no ordering dependency on hub).
  loadSample(sample);

  // 2. Ensure + route (shared core). sessionHub null → new hub+IP
  //    created; non-null with live IP → same reference (spec §3).
  landHubOnProcess(
    coreDeps.sessionHub,
    sample.name,
    coreDeps,
    sample.config.stepTimings,
    sample.config.improvementProject
  );
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
 * v1 envelope only (wedge no-back-compat). Embed mode still ensures the
 * Workspace Project but skips showFrame (spec §1 applicability).
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

  // 4. Ensure + route (shared core). Pass reconstructed as hubBase
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
 * ensure + route only.
 */
export function landPasteOnProcess(deps: LandPasteOnProcessDeps): void {
  const { sessionHub, ...coreDeps } = deps;
  landHubOnProcess(sessionHub, 'Untitled project', coreDeps);
}

/**
 * Deps for the wizard-path paste provisioning (FSJ-2 addendum). A subset of
 * LandPasteOnProcessDeps — no showFrame/isEmbedMode, because this path does NOT
 * route. The wizard (defect/wide-shaped or low-confidence paste) keeps today's
 * landing until P2; we only need to provision the Untitled project so its no-Y
 * floor (and the rest of the Process tab) is reachable once the user navigates.
 */
export interface ProvisionPasteProjectDeps {
  /** Current session hub — passed as hubBase to the shared ensure core */
  sessionHub: ProcessHub | null;
  /** Update the session hub in app state */
  setSessionHub: (hub: ProcessHub) => void;
}

/**
 * Wizard-path paste provisioning (FSJ-2 spec §3): the Untitled-project guarantee
 * must hold for EVERY fresh data entry — including pastes routed to the mapping
 * wizard. Invoked by usePasteImportFlow's onFreshPasteAnalyzed AFTER the pipeline
 * has written rawData/outcome/factors and dispatched into the wizard.
 *
 * Ensure ONLY. Crucially it does NOT route (no showFrame) — the wizard
 * path keeps today's in-vestibule landing until the P2 re-framing banners ship.
 * Without this, cancelling out of the auto-surfaced wizard for all-categorical
 * data left activeIP == null, so the PWA Process tab fell back to
 * NoActiveProjectGuidance and the b0 no-Y OutcomeNoMatchBanner floor (spec §4.1)
 * was unreachable on its primary live trigger.
 *
 * Referential no-op when sessionHub already carries a live IP (spec §3).
 */
export function provisionPasteProject(deps: ProvisionPasteProjectDeps): void {
  ensureAndActivateProject(deps.sessionHub, 'Untitled project', deps.setSessionHub);
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
 * store), then lands on the Process tab with an attached 'Untitled
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

  // 2. Ensure + route (shared core). sessionHub null → new hub+IP
  //    created; non-null with live IP → same reference (spec §3).
  landHubOnProcess(sessionHub, 'Untitled project', coreDeps);
}
