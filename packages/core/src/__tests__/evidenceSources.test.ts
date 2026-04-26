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
  createdAt: '2026-04-26T00:00:00.000Z',
  updatedAt: '2026-04-26T00:00:00.000Z',
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
      [{ id: 'hub-1', name: 'Claims hub', createdAt: '2026-04-26T00:00:00.000Z' }],
      [],
      { evidenceSnapshots: [snapshot] }
    );
    const cadence = buildProcessHubCadence(rollup);

    expect(cadence.snapshot.latestEvidenceSignals).toBe(1);
    expect(cadence.latestEvidenceSignals.items).toEqual([snapshot.latestSignals![0]]);
  });
});
