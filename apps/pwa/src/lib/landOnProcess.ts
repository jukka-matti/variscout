import type { SampleDataset } from '@variscout/data';
import type { ProcessHub } from '@variscout/core/processHub';
import { useActiveIPStore } from '@variscout/stores';
import { ensureSessionProject } from './ensureSessionProject';
import { PWA_USER_ID } from './pwaUser';

/**
 * First-session landing handler (spec §1, §3): fresh sample entry lands on
 * the Process tab with an auto-activated Untitled project.
 *
 * Extracted from AppMain so it can be integration-tested without full-App
 * mounting. App.tsx wires this as a thin 3-liner in handleLoadSample.
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
 */
export interface LandOnProcessDeps {
  /** Load data into the project store (ingestion.loadSample) */
  loadSample: (sample: SampleDataset) => void;
  /** Current session hub (may be null on first use) */
  sessionHub: ProcessHub | null;
  /** Update the session hub in app state */
  setSessionHub: (hub: ProcessHub) => void;
  /** Route to the Process tab (panels.showFrame) */
  showFrame: () => void;
  /** Whether the app is in embed/iframe mode */
  isEmbedMode: boolean;
}

export function landOnProcess(sample: SampleDataset, deps: LandOnProcessDeps): void {
  const { loadSample, sessionHub, setSessionHub, showFrame, isEmbedMode } = deps;

  // 1. Load data into the project store first (no ordering dependency on hub).
  loadSample(sample);

  // 2. Ensure the session hub carries a live ImprovementProject named after the
  //    sample. Pure + referential no-op when one already exists (spec §3).
  const hub = ensureSessionProject(sessionHub, sample.name);
  setSessionHub(hub);

  // 3. Activate the IP in the annotation store using the NEW hub's scope so the
  //    call is not stale even when a new hub was just created (see ordering note).
  const scope = { hubId: hub.id, userId: PWA_USER_ID };
  useActiveIPStore.getState().setActiveIP(scope, hub.improvementProject!.id);

  // 4. Route to Process tab — exempt in embed mode (spec §1 applicability).
  if (!isEmbedMode) {
    showFrame();
  }
}
