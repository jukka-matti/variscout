import type { ControlHandoff, ControlRecord } from './control';
import type { ImprovementProject } from './improvementProject';

/**
 * Control-readiness predicates — facts, not labels (PR-PO-2).
 *
 * Control eligibility used to gate on a free-text `analyzeStatus` dropdown
 * (`'resolved' | 'controlled'`) which the analyst maintained by hand and which
 * could lie (a project saying "controlled" with zero control artifacts). These
 * predicates instead read FACTS:
 *
 *   - the project's lifecycle status (`ImprovementProjectStatus`), and
 *   - the existence of the project's Control artifacts (records / handoffs).
 *
 * Join conventions (verified against control.ts + the live app joins in
 * Editor.tsx ~:867 and PWA App.tsx ~:1091):
 *   - ControlRecord → project: `record.improvementProjectId === project.id`
 *     (direct FK). Tombstoned records (`deletedAt !== null`) are archived but
 *     readable — they do NOT count as live control artifacts.
 *   - ControlHandoff → project: handoffs carry NO `improvementProjectId`. They
 *     bridge to a project through a ControlRecord that shares the handoff's
 *     `investigationId` (the live app bridge). A live (non-tombstoned) handoff
 *     bridging through any record (live or tombstoned) for the project still
 *     signals that control was handed off.
 */

/** A non-tombstoned ControlRecord whose FK points at this project. */
function liveRecordForProject(project: ImprovementProject, records: ControlRecord[]): boolean {
  return records.some(
    record => record.improvementProjectId === project.id && record.deletedAt === null
  );
}

/**
 * Set of `investigationId`s of records (live OR tombstoned) belonging to this
 * project — the bridge keys a handoff can join through.
 */
function bridgeInvestigationIds(
  project: ImprovementProject,
  records: ControlRecord[]
): Set<ControlRecord['investigationId']> {
  const ids = new Set<ControlRecord['investigationId']>();
  for (const record of records) {
    if (record.improvementProjectId === project.id) ids.add(record.investigationId);
  }
  return ids;
}

/** A live handoff that bridges to this project via a shared-`investigationId` record. */
function liveHandoffForProject(
  project: ImprovementProject,
  records: ControlRecord[],
  handoffs: ControlHandoff[]
): boolean {
  if (handoffs.length === 0) return false;
  const bridge = bridgeInvestigationIds(project, records);
  if (bridge.size === 0) return false;
  return handoffs.some(
    handoff => handoff.deletedAt === null && bridge.has(handoff.investigationId)
  );
}

/**
 * True when a project is genuinely in (or past) the Control stage by FACT:
 *   - its lifecycle status is `'closed'` (Control stage is derived from
 *     status === 'closed' per deriveStageState; no control artifact required
 *     once the project is closed), OR
 *   - it has a live ControlRecord, OR
 *   - it has a live ControlHandoff (handed off to operations).
 *
 * An `'active'` (or `'draft'`) project with zero live records/handoffs is NOT
 * control-eligible — the label can no longer lie.
 */
export function isControlEligible(
  ip: ImprovementProject,
  records: ControlRecord[],
  handoffs: ControlHandoff[]
): boolean {
  if (ip.status === 'closed') return true;
  if (liveRecordForProject(ip, records)) return true;
  if (liveHandoffForProject(ip, records, handoffs)) return true;
  return false;
}

/**
 * True only when the project has at least one live (non-tombstoned,
 * non-archived) ControlRecord. Distinct from `isControlEligible`: a closed
 * project with no record is eligible-but-not-controlled, and a handoff alone
 * does not establish an active control record.
 */
export function isControlled(ip: ImprovementProject, records: ControlRecord[]): boolean {
  return liveRecordForProject(ip, records);
}
