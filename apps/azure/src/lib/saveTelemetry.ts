/**
 * PO-8b save-serialize telemetry (spec §9.4 as amended by §17).
 *
 * The worker-marshal serialization was CUT on research grounds (2026-06-05):
 * postMessage structured-clone is synchronous on the sending thread and, for
 * plain-object graphs, slower than the stringify it would offload — so the
 * deliverable is MEASUREMENT, not a worker. This module is the dual
 * re-architect trigger:
 *   - size:     > 50 MB document (the spec's split-raw-rows line)
 *   - duration: > 50 ms serialize (the web.dev long-task threshold)
 * Revive path when a trigger fires on real customer data: columnar
 * transferable SoA (zero-copy postMessage) or OPFS worker-owned persistence —
 * never marshal-then-stringify. See decision-log 2026-06-05 + spec §17.
 *
 * PII hard rule (azure CLAUDE.md): structural numbers only — bytes, ms,
 * booleans. Never project names, labels, or row contents.
 */
import { safeTrackEvent } from './appInsights';

export const OVERSIZE_TRIGGER_BYTES = 50 * 1024 * 1024;
export const LONG_TASK_TRIGGER_MS = 50;

export interface DocumentSaveMeasurement {
  sizeBytes: number;
  serializeMs: number;
}

export function trackDocumentSaveSerialize({
  sizeBytes,
  serializeMs,
}: DocumentSaveMeasurement): void {
  const oversize = sizeBytes > OVERSIZE_TRIGGER_BYTES;
  const longTask = serializeMs > LONG_TASK_TRIGGER_MS;

  safeTrackEvent('Document.Save.Serialize', {
    sizeBytes,
    serializeMs: Math.round(serializeMs * 100) / 100,
    oversize,
    longTask,
  });

  if (oversize || longTask) {
    safeTrackEvent('Document.Save.ReArchitectTrigger', {
      sizeBytes,
      serializeMs: Math.round(serializeMs),
      trigger: oversize ? 'size' : 'duration',
    });
  }
}
