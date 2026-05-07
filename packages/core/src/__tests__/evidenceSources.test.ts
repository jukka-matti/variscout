import { describe, expect, it } from 'vitest';
import {
  AGENT_REVIEW_LOG_PROFILE,
  buildProcessHubCadence,
  buildProcessHubRollups,
  detectDataProfiles,
  processHubEvidenceBlobPath,
  validateEvidenceSourceSnapshot,
  type EvidenceSnapshot,
  type EvidenceSource,
} from '../index';
import type { SnapshotProvenance, RowProvenanceTag } from '../evidenceSources';
import type { DataRow } from '../types';

const rows: DataRow[] = [
  {
    flagColor: 'green',
    confidence: 0.91,
    auditResult: 'correct',
    caseType: 'Export',
    promptVersion: 'p2',
  },
  {
    flagColor: 'green',
    confidence: 0.42,
    auditResult: 'incorrect',
    caseType: 'Export',
    promptVersion: 'p2',
  },
  {
    flagColor: 'yellow',
    confidence: 0.62,
    auditResult: 'needs review',
    caseType: 'Standard',
    promptVersion: 'p2',
  },
];

const source: EvidenceSource = {
  id: 'source-1',
  hubId: 'hub-1',
  name: 'Agent review log',
  cadence: 'weekly',
  profileId: AGENT_REVIEW_LOG_PROFILE.id,
  createdAt: 1745625600000,
  deletedAt: null,
  updatedAt: 1745625600000,
};

describe('Evidence Sources and Data Profiles', () => {
  it('detects the Agent Review Log profile and recommends mappings', () => {
    const [detected] = detectDataProfiles(rows);

    expect(detected).toMatchObject({
      profileId: AGENT_REVIEW_LOG_PROFILE.id,
      confidence: 'high',
      recommendedMapping: {
        flagColor: 'flagColor',
        confidenceScore: 'confidence',
        greenAuditResult: 'auditResult',
      },
    });
  });

  it('validates and applies the Agent Review Log profile deterministically', () => {
    const application = AGENT_REVIEW_LOG_PROFILE.apply(rows, {
      flagColor: 'flagColor',
      confidenceScore: 'confidence',
      greenAuditResult: 'auditResult',
    });

    expect(application.validation.ok).toBe(true);
    expect(application.derivedRows).toMatchObject([
      {
        GreenPassThrough: 1,
        ReviewBurden: 0,
        FalseGreen: 0,
        SafeGreen: 1,
        ConfidenceBand: 'high',
      },
      {
        GreenPassThrough: 1,
        ReviewBurden: 0,
        FalseGreen: 1,
        SafeGreen: 0,
        ConfidenceBand: 'low',
      },
      {
        GreenPassThrough: 0,
        ReviewBurden: 1,
        FalseGreen: undefined,
        SafeGreen: undefined,
        ConfidenceBand: 'medium',
      },
    ]);
  });

  it('validates Evidence Snapshot metadata against its source and profile application', () => {
    const application = AGENT_REVIEW_LOG_PROFILE.apply(rows, {
      flagColor: 'flagColor',
      confidenceScore: 'confidence',
      greenAuditResult: 'auditResult',
    });
    const snapshot: EvidenceSnapshot = {
      id: 'snapshot-1',
      hubId: 'hub-1',
      sourceId: source.id,
      capturedAt: '2026-04-26T12:00:00.000Z',
      rowCount: rows.length,
      profileApplication: application,
      origin: 'fixture:validates-snapshot-metadata',
      importedAt: 1745668800000,
      createdAt: 1745668800000,
      deletedAt: null,
    };

    expect(validateEvidenceSourceSnapshot(source, snapshot)).toEqual({
      ok: true,
      errors: [],
      warnings: [],
    });
  });

  it('builds the reserved Team Blob path for evidence snapshots', () => {
    expect(processHubEvidenceBlobPath('hub-1', 'source-1', 'snapshot-1', 'application.json')).toBe(
      'process-hubs/hub-1/evidence-sources/source-1/snapshots/snapshot-1/application.json'
    );
  });

  it('allows Process Hub cadence to include latest evidence snapshots as first-class signals', () => {
    const application = AGENT_REVIEW_LOG_PROFILE.apply(rows, {
      flagColor: 'flagColor',
      confidenceScore: 'confidence',
      greenAuditResult: 'auditResult',
    });
    const snapshot: EvidenceSnapshot = {
      id: 'snapshot-1',
      hubId: 'hub-1',
      sourceId: source.id,
      capturedAt: '2026-04-26T12:00:00.000Z',
      rowCount: rows.length,
      profileApplication: application,
      origin: 'fixture:latest-evidence-signals',
      importedAt: 1745668800000,
      createdAt: 1745668800000,
      deletedAt: null,
      latestSignals: [
        {
          id: 'false-green',
          label: 'False green',
          value: 1,
          severity: 'red',
          capturedAt: '2026-04-26T12:00:00.000Z',
        },
      ],
    };

    const [rollup] = buildProcessHubRollups(
      [{ id: 'hub-1', name: 'Claims hub', createdAt: 1777161600000, deletedAt: null }],
      [],
      { evidenceSnapshots: [snapshot] }
    );
    const cadence = buildProcessHubCadence(rollup);

    expect(cadence.snapshot.latestEvidenceSignals).toBe(1);
    expect(cadence.latestEvidenceSignals.items).toEqual([snapshot.latestSignals![0]]);
  });
});

describe('SnapshotProvenance + RowProvenanceTag types', () => {
  it('SnapshotProvenance carries origin + importedAt (number) + range', () => {
    const prov: SnapshotProvenance = {
      origin: 'paste:abc123',
      importedAt: 1746352800000,
      rowTimestampRange: { startISO: '2026-05-01T00:00:00Z', endISO: '2026-05-04T00:00:00Z' },
    };
    expect(prov.origin).toBe('paste:abc123');
    expect(typeof prov.importedAt).toBe('number');
  });

  it('RowProvenanceTag carries EntityBase fields + snapshotId + rowKey + source + joinKey', () => {
    const tag: RowProvenanceTag = {
      id: 'tag-001',
      createdAt: 1746352800000,
      deletedAt: null,
      snapshotId: 'snapshot-001',
      rowKey: 'row-0',
      source: 'qc-inspection',
      joinKey: 'lot_id',
    };
    expect(tag.source).toBe('qc-inspection');
    expect(tag.joinKey).toBe('lot_id');
    expect(tag.snapshotId).toBe('snapshot-001');
    expect(tag.rowKey).toBe('row-0');
    expect(tag.deletedAt).toBeNull();
  });
});

describe('EvidenceSnapshot provenance fields', () => {
  it('accepts origin, importedAt (number), createdAt, deletedAt, and optional rowTimestampRange', () => {
    const snap: EvidenceSnapshot = {
      id: 'snap-1',
      hubId: 'hub-1',
      sourceId: 'src-1',
      capturedAt: '2026-05-04T10:00:00.000Z',
      rowCount: 100,
      origin: 'paste:abc123',
      importedAt: 1746352800500,
      createdAt: 1746352800500,
      deletedAt: null,
      rowTimestampRange: { startISO: '2026-05-01T00:00:00Z', endISO: '2026-05-04T00:00:00Z' },
    };
    expect(snap.origin).toBe('paste:abc123');
    expect(typeof snap.importedAt).toBe('number');
    expect(snap.importedAt).toBe(snap.createdAt);
    expect(snap.rowTimestampRange?.startISO).toBe('2026-05-01T00:00:00Z');
  });

  it('treats rowTimestampRange as optional', () => {
    const snap: EvidenceSnapshot = {
      id: 'snap-2',
      hubId: 'hub-2',
      sourceId: 'src-2',
      capturedAt: '2026-05-04T10:00:00.000Z',
      rowCount: 0,
      origin: 'evidence-source:auto-001',
      importedAt: 1746352800500,
      createdAt: 1746352800500,
      deletedAt: null,
    };
    expect(snap.rowTimestampRange).toBeUndefined();
  });
});

describe('EvidenceSnapshot.provenance envelope facet (F3.6-β P1.1)', () => {
  // Deterministic RowProvenanceTag fixtures — no Date.now() / Math.random() in value positions
  const tagA: RowProvenanceTag = {
    id: 'prov-tag-001',
    createdAt: 1746435600000,
    deletedAt: null,
    snapshotId: 'snap-prov-1',
    rowKey: 'row-0',
    source: 'telemetry',
    joinKey: 'lot_id',
  };
  const tagB: RowProvenanceTag = {
    id: 'prov-tag-002',
    createdAt: 1746435600000,
    deletedAt: null,
    snapshotId: 'snap-prov-1',
    rowKey: 'row-1',
    source: 'qc-inspection',
    joinKey: 'lot_id',
  };

  it('accepts provenance as an array of RowProvenanceTag (present case)', () => {
    const snap: EvidenceSnapshot = {
      id: 'snap-prov-1',
      hubId: 'hub-prov',
      sourceId: 'src-prov',
      capturedAt: '2026-05-05T08:00:00.000Z',
      rowCount: 2,
      origin: 'paste:multi-source-join',
      importedAt: 1746435600000,
      createdAt: 1746435600000,
      deletedAt: null,
      provenance: [tagA, tagB],
    };

    expect(snap.provenance).toHaveLength(2);
    expect(snap.provenance![0]!.source).toBe('telemetry');
    expect(snap.provenance![1]!.joinKey).toBe('lot_id');
  });

  it('accepts provenance as an empty array (empty case)', () => {
    const snap: EvidenceSnapshot = {
      id: 'snap-prov-2',
      hubId: 'hub-prov',
      sourceId: 'src-prov',
      capturedAt: '2026-05-05T08:00:00.000Z',
      rowCount: 0,
      origin: 'paste:empty-join',
      importedAt: 1746435600000,
      createdAt: 1746435600000,
      deletedAt: null,
      provenance: [],
    };

    expect(snap.provenance).toBeDefined();
    expect(snap.provenance).toHaveLength(0);
  });

  it('treats provenance as optional — absent when not a multi-source join (absent case)', () => {
    const snap: EvidenceSnapshot = {
      id: 'snap-prov-3',
      hubId: 'hub-single',
      sourceId: 'src-single',
      capturedAt: '2026-05-05T08:00:00.000Z',
      rowCount: 50,
      origin: 'paste:single-csv',
      importedAt: 1746435600000,
      createdAt: 1746435600000,
      deletedAt: null,
    };

    expect(snap.provenance).toBeUndefined();
  });

  it('round-trips through JSON.stringify / JSON.parse without data loss', () => {
    const snap: EvidenceSnapshot = {
      id: 'snap-prov-rt',
      hubId: 'hub-rt',
      sourceId: 'src-rt',
      capturedAt: '2026-05-05T08:00:00.000Z',
      rowCount: 1,
      origin: 'paste:round-trip',
      importedAt: 1746435600000,
      createdAt: 1746435600000,
      deletedAt: null,
      provenance: [tagA],
    };

    const serialized = JSON.stringify(snap);
    const restored = JSON.parse(serialized) as EvidenceSnapshot;

    expect(restored.provenance).toHaveLength(1);
    expect(restored.provenance![0]!.id).toBe('prov-tag-001');
    expect(restored.provenance![0]!.source).toBe('telemetry');
    expect(restored.provenance![0]!.joinKey).toBe('lot_id');
    expect(restored.provenance![0]!.rowKey).toBe('row-0');
    expect(restored.provenance![0]!.snapshotId).toBe('snap-prov-1');
    expect(restored.provenance![0]!.createdAt).toBe(1746435600000);
    expect(restored.provenance![0]!.deletedAt).toBeNull();
  });

  it('round-trips through JSON when provenance is absent — field stays absent', () => {
    const snap: EvidenceSnapshot = {
      id: 'snap-prov-rt2',
      hubId: 'hub-rt2',
      sourceId: 'src-rt2',
      capturedAt: '2026-05-05T08:00:00.000Z',
      rowCount: 10,
      origin: 'evidence-source:auto',
      importedAt: 1746435600000,
      createdAt: 1746435600000,
      deletedAt: null,
    };

    const restored = JSON.parse(JSON.stringify(snap)) as EvidenceSnapshot;
    expect(restored.provenance).toBeUndefined();
  });
});
