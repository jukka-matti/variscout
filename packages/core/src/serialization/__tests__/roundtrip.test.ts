import { describe, expect, it } from 'vitest';
import { vrsExport } from '../vrsExport';
import { vrsImport } from '../vrsImport';
import { VRS_DOCUMENT_KIND, VRS_VERSION } from '../vrsFormat';

describe('snapshot .vrs roundtrip', () => {
  const documentSnapshot = {
    schemaVersion: 1,
    hubId: 'hub-1',
    hub: { id: 'hub-1', name: 'Line 1', createdAt: 1, deletedAt: null },
    project: { projectId: 'project-1', rawData: [{ weight_g: 4.5 }], outcome: 'weight_g' },
    analyze: { findings: [], categories: [], hypotheses: [], causalLinks: [], scopes: [] },
    canvas: { canonicalMap: null, outcomes: [], primaryScopeDimensions: [] },
    improvementProject: null,
  };

  it('exports snapshot-only VrsFile JSON', () => {
    const json = vrsExport(documentSnapshot, { exportSource: 'pwa', appVersion: 'test' });
    const parsed = JSON.parse(json);

    expect(parsed).toEqual({
      kind: VRS_DOCUMENT_KIND,
      version: VRS_VERSION,
      exportedAt: expect.any(String),
      metadata: { exportSource: 'pwa', appVersion: 'test' },
      documentSnapshot,
    });
    expect(parsed).not.toHaveProperty('hub');
    expect(parsed).not.toHaveProperty('rawData');
  });

  it('round-trips documentSnapshot with deep equality', () => {
    const imported = vrsImport(vrsExport(documentSnapshot));

    expect(imported.documentSnapshot).toEqual(documentSnapshot);
  });

  it('rejects hub/rawData files through the generic invalid-file path', () => {
    const legacy = JSON.stringify({
      version: '1.0',
      hub: { id: 'legacy-hub' },
      rawData: [{ x: 1 }],
    });

    expect(() => vrsImport(legacy)).toThrow(/invalid \.vrs/i);
  });

  it('rejects malformed snapshot files', () => {
    const malformed = JSON.stringify({
      kind: VRS_DOCUMENT_KIND,
      version: VRS_VERSION,
      exportedAt: '2026-06-01T00:00:00.000Z',
    });

    expect(() => vrsImport(malformed)).toThrow(/documentSnapshot/i);
  });
});
