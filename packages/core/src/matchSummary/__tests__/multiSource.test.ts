import { describe, it, expect } from 'vitest';
import { createSnapshotProvenance } from '../provenance';

describe('per-source independent timelines (spec §8.2)', () => {
  it('two joined sources retain separate snapshot ranges', () => {
    const prodTelemetry = createSnapshotProvenance(
      'telemetry-import-1',
      [{ ts: '2026-05-01T00:00:00Z' }, { ts: '2026-05-04T00:00:00Z' }],
      'ts'
    );
    const qcInspection = createSnapshotProvenance(
      'qc-inspection-import-1',
      [{ inspection_ts: '2026-05-15T00:00:00Z' }],
      'inspection_ts'
    );

    expect(prodTelemetry.rowTimestampRange?.endISO).toBe('2026-05-04T00:00:00.000Z');
    expect(qcInspection.rowTimestampRange?.endISO).toBe('2026-05-15T00:00:00.000Z');
    // The two are stored separately — no combined range computed at this layer.
  });

  it('preserves origin distinguishability across joined sources', () => {
    const prov1 = createSnapshotProvenance('telemetry-import-1', []);
    const prov2 = createSnapshotProvenance('qc-inspection-import-1', []);
    expect(prov1.origin).not.toBe(prov2.origin);
  });
});
