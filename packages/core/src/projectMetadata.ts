/**
 * Project Metadata Builder
 *
 * Lightweight metadata structure that summarizes project health
 * (phase, finding counts, question counts, action progress)
 * for the Portfolio view. Pure function — no React, no storage.
 */

import type { Finding, FindingStatus } from './findings';
import type { ProcessContext } from './ai/types';
import {
  type AnalyzeNodeMapping,
  normalizeProcessHubId,
  type ProcessParticipantRef,
} from './processHub';
import type { ControlMetadataProjection } from './control';

/** High-level dashboard journey phase (dashboard metadata only; not a CoScout axis). */
export type JourneyPhase = 'frame' | 'scout' | 'analyze' | 'improve';

export interface ProjectMetadata {
  /** High-level analysis journey phase */
  phase: JourneyPhase;
  /** Finding counts keyed by FindingStatus values */
  findingCounts: Partial<Record<FindingStatus, number>>;
  /**
   * Question counts — retained as an always-empty map after ADR-085 dropped the
   * `Question` entity. Kept for persisted-metadata shape stability; consumers
   * should migrate to scope/hypothesis counts.
   */
  questionCounts: Record<string, number>;
  /**
   * Last-viewed timestamps keyed by userId (or 'local' for anonymous/PWA users).
   * Preserved from existing metadata — not modified by buildProjectMetadata.
   */
  lastViewedAt: Record<string, number>;
  /** Primary Process Hub for this analyze. Legacy projects default to General / Unassigned. */
  processHubId?: string;
  /** Investigation-to-process-map bindings for hub capability rollups. */
  nodeMappings?: AnalyzeNodeMapping[];
  /** Timestamp marker for dismissed B0 migration prompts. */
  migrationDeclinedAt?: string;
  /** Person accountable for the process/work-system health. */
  processOwner?: ProcessParticipantRef;
  /** Person driving the analyze day to day. */
  investigationOwner?: ProcessParticipantRef;
  /** Sponsor/accountable stakeholder for larger work. */
  sponsor?: ProcessParticipantRef;
  /** People contributing process knowledge, observations, checks, or actions. */
  contributors?: ProcessParticipantRef[];
  /** Lightweight projection of the active ControlRecord for this project.
   *  Field name `sustainment` preserved — matches persisted ProjectMetadata schema. */
  sustainment?: ControlMetadataProjection;
}

/**
 * Detect the high-level journey phase from project state.
 * Mirrors useJourneyPhase logic without React.
 *
 * - frame: no data loaded yet
 * - scout: data loaded, exploring patterns (no findings yet)
 * - improve: at least one finding has corrective actions
 * - investigate: findings exist but no actions yet
 */
function detectPhase(hasData: boolean, findings: Finding[]): JourneyPhase {
  if (!hasData) return 'frame';
  const hasActions = findings.some(f => f.actions && f.actions.length > 0);
  if (hasActions) return 'improve';
  if (findings.length > 0) return 'analyze';
  return 'scout';
}

/**
 * Build a ProjectMetadata snapshot from current project state.
 *
 * @param findings - All findings for the project
 * @param _questions - Retired Question list (ADR-085); accepted + ignored for
 *   call-site stability across the existing consumers.
 * @param hasData - Whether the project has data loaded
 * @param _userId - The requesting user's ID (UPN or 'local'); retained for
 *   call-site stability across the existing consumers (assigned-task counting
 *   shed in PO-4).
 * @param existingLastViewedAt - Existing lastViewedAt map to preserve
 */
export function buildProjectMetadata(
  findings: Finding[],
  _questions: readonly unknown[],
  hasData: boolean,
  _userId: string,
  existingLastViewedAt?: Record<string, number>,
  processContext?: ProcessContext | null
): ProjectMetadata {
  // --- Phase detection ---
  const phase = detectPhase(hasData, findings);

  // --- Finding counts by status ---
  const findingCounts: Partial<Record<FindingStatus, number>> = {};
  for (const finding of findings) {
    findingCounts[finding.status] = (findingCounts[finding.status] ?? 0) + 1;
  }

  // --- Question counts retired (ADR-085) — always empty ---
  const questionCounts: Record<string, number> = {};

  return {
    phase,
    findingCounts,
    questionCounts,
    lastViewedAt: existingLastViewedAt ?? {},
    processHubId: normalizeProcessHubId(processContext?.processHubId),
    nodeMappings: processContext?.nodeMappings,
    migrationDeclinedAt: processContext?.migrationDeclinedAt,
    processOwner: processContext?.processOwner,
    investigationOwner: processContext?.investigationOwner,
    sponsor: processContext?.sponsor,
    contributors: processContext?.contributors,
  };
}
