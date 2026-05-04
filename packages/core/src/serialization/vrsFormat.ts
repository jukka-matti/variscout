// packages/core/src/serialization/vrsFormat.ts
import type { ProcessHub } from '../processHub';

export const VRS_VERSION = '1.0' as const;

export interface VrsFile {
  version: typeof VRS_VERSION;
  exportedAt: string; // ISO timestamp
  hub: ProcessHub;
  rawData?: Array<Record<string, unknown>>;
  metadata?: { exportSource: 'pwa' | 'azure'; appVersion: string };
}
