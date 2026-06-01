// packages/core/src/serialization/vrsExport.ts
import type { ProcessHub } from '../processHub';
import { VRS_VERSION, type VrsFile } from './vrsFormat';

export function vrsExport(
  hub: ProcessHub,
  rawData?: Array<Record<string, unknown>>,
  metadata?: VrsFile['metadata'],
  documentSnapshot?: unknown,
  exportedAt = new Date().toISOString()
): string {
  const file: VrsFile = {
    version: VRS_VERSION,
    exportedAt,
    hub,
    rawData,
    metadata,
    ...(documentSnapshot !== undefined ? { documentSnapshot } : {}),
  };
  return JSON.stringify(file, null, 2);
}
