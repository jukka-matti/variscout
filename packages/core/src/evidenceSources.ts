import type { DataRow } from './types';

export type EvidenceCadence = 'manual' | 'hourly' | 'shiftly' | 'daily' | 'weekly';
export type DataProfileConfidence = 'high' | 'medium' | 'low';
export type EvidenceSignalSeverity = 'green' | 'amber' | 'red' | 'neutral';

export interface EvidenceSource {
  id: string;
  hubId: string;
  name: string;
  cadence: EvidenceCadence;
  profileId?: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface EvidenceValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export interface ProfileApplication {
  profileId: string;
  profileVersion: number;
  mapping: Record<string, string>;
  validation: EvidenceValidationResult;
  derivedColumns: string[];
  derivedRows: DataRow[];
}

export interface EvidenceLatestSignal {
  id: string;
  label: string;
  value: number;
  severity: EvidenceSignalSeverity;
  capturedAt: string;
  sourceId?: string;
  snapshotId?: string;
}

export interface EvidenceSnapshot {
  id: string;
  hubId: string;
  sourceId: string;
  capturedAt: string;
  rowCount: number;
  profileApplication?: ProfileApplication;
  latestSignals?: EvidenceLatestSignal[];
  /** Import-id of the paste / file / Evidence Source that produced this snapshot. */
  origin: string;
  /** Wall-clock ISO 8601 timestamp when VariScout ingested the data. */
  importedAt: string;
  /** Span of `row_timestamp` values when a time column is present in the dataset. */
  rowTimestampRange?: { startISO: string; endISO: string };
}

export interface DataProfileDetection {
  profileId: string;
  profileVersion: number;
  confidence: DataProfileConfidence;
  recommendedMapping: Record<string, string>;
  reasons: string[];
}

export interface DataProfileDefinition {
  id: string;
  version: number;
  label: string;
  detect(rows: DataRow[]): DataProfileDetection | null;
  validate(rows: DataRow[], mapping: Record<string, string>): EvidenceValidationResult;
  apply(rows: DataRow[], mapping: Record<string, string>): ProfileApplication;
}

function columns(rows: DataRow[]): string[] {
  return rows.length > 0 ? Object.keys(rows[0] ?? {}) : [];
}

function findColumn(cols: string[], candidates: string[]): string | undefined {
  const normalized = new Map(
    cols.map(column => [column.toLowerCase().replace(/[^a-z0-9]/g, ''), column])
  );
  for (const candidate of candidates) {
    const found = normalized.get(candidate.toLowerCase().replace(/[^a-z0-9]/g, ''));
    if (found) return found;
  }
  return undefined;
}

function isGreen(value: unknown): boolean {
  return (
    String(value ?? '')
      .trim()
      .toLowerCase() === 'green'
  );
}

function isIncorrectAudit(value: unknown): boolean {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();
  return ['incorrect', 'false', 'fail', 'failed', 'unsafe', 'bad'].includes(normalized);
}

function isCorrectAudit(value: unknown): boolean {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();
  return ['correct', 'true', 'pass', 'passed', 'safe', 'ok'].includes(normalized);
}

function confidenceBand(value: unknown): string | undefined {
  const numeric =
    typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isFinite(numeric)) return undefined;
  if (numeric >= 0.8) return 'high';
  if (numeric >= 0.5) return 'medium';
  return 'low';
}

function validation(
  ok: boolean,
  errors: string[] = [],
  warnings: string[] = []
): EvidenceValidationResult {
  return { ok, errors, warnings };
}

export const AGENT_REVIEW_LOG_PROFILE: DataProfileDefinition = {
  id: 'agent-review-log',
  version: 1,
  label: 'Agent Review Log',

  detect(rows: DataRow[]): DataProfileDetection | null {
    const cols = columns(rows);
    const flagColor = findColumn(cols, ['flagColor', 'flag_color', 'decision', 'reviewFlag']);
    if (!flagColor) return null;
    const confidenceScore = findColumn(cols, ['confidence', 'confidenceScore', 'score']);
    const greenAuditResult = findColumn(cols, ['auditResult', 'greenAuditResult', 'humanAudit']);
    const recommendedMapping: Record<string, string> = { flagColor };
    if (confidenceScore) recommendedMapping.confidenceScore = confidenceScore;
    if (greenAuditResult) recommendedMapping.greenAuditResult = greenAuditResult;
    return {
      profileId: this.id,
      profileVersion: this.version,
      confidence: greenAuditResult ? 'high' : 'medium',
      recommendedMapping,
      reasons: ['Detected flag-color decision column.'],
    };
  },

  validate(rows: DataRow[], mapping: Record<string, string>): EvidenceValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const cols = columns(rows);
    if (!mapping.flagColor || !cols.includes(mapping.flagColor)) {
      errors.push('Agent Review Log profile requires a flag color column.');
    }
    if (mapping.confidenceScore && !cols.includes(mapping.confidenceScore)) {
      errors.push('Mapped confidence score column does not exist.');
    }
    if (!mapping.greenAuditResult) {
      warnings.push('SafeGreen and FalseGreen need sampled green audit or downstream evidence.');
    }
    return validation(errors.length === 0, errors, warnings);
  },

  apply(rows: DataRow[], mapping: Record<string, string>): ProfileApplication {
    const result = this.validate(rows, mapping);
    const derivedRows = rows.map(row => {
      const green = isGreen(row[mapping.flagColor]);
      const auditValue = mapping.greenAuditResult ? row[mapping.greenAuditResult] : undefined;
      const auditedGreen =
        green && auditValue !== undefined && auditValue !== null && auditValue !== '';
      const falseGreen = auditedGreen ? (isIncorrectAudit(auditValue) ? 1 : 0) : undefined;
      const safeGreen = auditedGreen ? (isCorrectAudit(auditValue) ? 1 : 0) : undefined;
      return {
        ...row,
        GreenPassThrough: green ? 1 : 0,
        ReviewBurden: green ? 0 : 1,
        FalseGreen: falseGreen,
        SafeGreen: safeGreen,
        ConfidenceBand: mapping.confidenceScore
          ? confidenceBand(row[mapping.confidenceScore])
          : undefined,
      };
    });
    return {
      profileId: this.id,
      profileVersion: this.version,
      mapping,
      validation: result,
      derivedColumns: [
        'GreenPassThrough',
        'ReviewBurden',
        'FalseGreen',
        'SafeGreen',
        'ConfidenceBand',
      ],
      derivedRows,
    };
  },
};

function isNumericValueLoose(value: unknown): boolean {
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'string' && value.trim() !== '') {
    return Number.isFinite(Number(value));
  }
  return false;
}

function classifyColumnNumeric(rows: DataRow[], col: string): boolean {
  // A column is "numeric" if at least 70% of non-empty values parse as finite numbers.
  let total = 0;
  let numeric = 0;
  for (const row of rows) {
    const value = row[col];
    if (value === undefined || value === null || value === '') continue;
    total += 1;
    if (isNumericValueLoose(value)) numeric += 1;
  }
  if (total === 0) return false;
  return numeric / total >= 0.7;
}

function genericTabularConfidence(numericRatio: number): DataProfileConfidence {
  if (numericRatio >= 0.6) return 'high';
  if (numericRatio >= 0.3) return 'medium';
  return 'low';
}

export const GENERIC_TABULAR_PROFILE: DataProfileDefinition = {
  id: 'generic-tabular',
  version: 1,
  label: 'Generic tabular',

  detect(rows: DataRow[]): DataProfileDetection | null {
    if (rows.length === 0) return null;
    const cols = columns(rows);
    if (cols.length === 0) return null;

    const numericCols = cols.filter(col => classifyColumnNumeric(rows, col));
    if (numericCols.length === 0) return null;

    const ratio = numericCols.length / cols.length;
    const confidence = genericTabularConfidence(ratio);

    // Recommended mapping: pick the first numeric column as the outcome candidate.
    // The user is expected to confirm/correct in the mapping form (PR #3 UI).
    const recommendedMapping: Record<string, string> = {
      outcome: numericCols[0],
    };

    return {
      profileId: 'generic-tabular',
      profileVersion: 1,
      confidence,
      recommendedMapping,
      reasons: [
        `Detected ${numericCols.length} numeric column${numericCols.length === 1 ? '' : 's'} of ${cols.length} total.`,
      ],
    };
  },

  validate(rows: DataRow[], _mapping: Record<string, string>): EvidenceValidationResult {
    if (rows.length === 0) {
      return validation(false, ['Snapshot has zero rows.']);
    }
    return validation(true);
  },

  apply(rows: DataRow[], mapping: Record<string, string>): ProfileApplication {
    // Identity transform — no derived signals for generic tabular.
    return {
      profileId: 'generic-tabular',
      profileVersion: 1,
      mapping,
      validation: validation(true),
      derivedColumns: [],
      derivedRows: rows,
    };
  },
};

export const DATA_PROFILE_REGISTRY: DataProfileDefinition[] = [
  AGENT_REVIEW_LOG_PROFILE,
  GENERIC_TABULAR_PROFILE,
];

export function detectDataProfiles(rows: DataRow[]): DataProfileDetection[] {
  return DATA_PROFILE_REGISTRY.map(profile => profile.detect(rows)).filter(
    (detection): detection is DataProfileDetection => detection !== null
  );
}

export function validateEvidenceSourceSnapshot(
  source: EvidenceSource,
  snapshot: EvidenceSnapshot
): EvidenceValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (source.hubId !== snapshot.hubId) errors.push('Snapshot hub does not match Evidence Source.');
  if (source.id !== snapshot.sourceId)
    errors.push('Snapshot source does not match Evidence Source.');
  if (source.profileId && snapshot.profileApplication?.profileId !== source.profileId) {
    errors.push('Snapshot profile application does not match Evidence Source profile.');
  }
  if (!snapshot.profileApplication) warnings.push('Snapshot has no profile application.');
  return validation(errors.length === 0, errors, warnings);
}

function safePathSegment(value: string): string {
  return value.replace(/^\/+|\/+$/g, '').replace(/\.\./g, '');
}

export function processHubEvidenceBlobPath(
  hubId: string,
  sourceId: string,
  snapshotId: string,
  filename: string
): string {
  return [
    'process-hubs',
    safePathSegment(hubId),
    'evidence-sources',
    safePathSegment(sourceId),
    'snapshots',
    safePathSegment(snapshotId),
    safePathSegment(filename),
  ].join('/');
}

export function processHubEvidenceSourceBlobPath(hubId: string, sourceId: string): string {
  return [
    'process-hubs',
    safePathSegment(hubId),
    'evidence-sources',
    safePathSegment(sourceId),
    'source.json',
  ].join('/');
}

export function processHubEvidenceSourcesCatalogPath(hubId: string): string {
  return ['process-hubs', safePathSegment(hubId), 'evidence-sources', '_sources.json'].join('/');
}

export function processHubEvidenceSnapshotsCatalogPath(hubId: string, sourceId: string): string {
  return [
    'process-hubs',
    safePathSegment(hubId),
    'evidence-sources',
    safePathSegment(sourceId),
    'snapshots',
    '_snapshots.json',
  ].join('/');
}
