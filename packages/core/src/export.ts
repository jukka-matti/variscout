/**
 * CSV Export utility for VariScout Lite
 * Generates Excel-compatible CSV files from analysis data
 */

import type { SpecLimits } from './types';
import type { Finding, Hypothesis } from './findings';
import type { ProcessContext } from './ai/types';
import { FINDING_STATUS_LABELS, FINDING_TAG_LABELS } from './findings';

export interface ExportOptions {
  includeRowNumbers?: boolean;
  includeSpecStatus?: boolean;
  filename?: string;
}

/**
 * Determines if a value passes specification limits
 */
export function getSpecStatus(
  value: number,
  specs: Pick<SpecLimits, 'usl' | 'lsl'>
): 'PASS' | 'FAIL_USL' | 'FAIL_LSL' | 'N/A' {
  if (specs.usl === undefined && specs.lsl === undefined) {
    return 'N/A';
  }
  if (specs.usl !== undefined && value > specs.usl) {
    return 'FAIL_USL';
  }
  if (specs.lsl !== undefined && value < specs.lsl) {
    return 'FAIL_LSL';
  }
  return 'PASS';
}

/**
 * Escapes a value for CSV format
 * Handles commas, quotes, and newlines
 */
function escapeCSVValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);

  // If contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Generates CSV content from data array
 */
export function generateCSV(
  data: Record<string, unknown>[],
  outcome: string | null,
  specs: Pick<SpecLimits, 'usl' | 'lsl'>,
  options: ExportOptions = {}
): string {
  if (data.length === 0) {
    return '';
  }

  const { includeRowNumbers = true, includeSpecStatus = true } = options;

  // Get all column names from data
  const dataColumns = Object.keys(data[0]);

  // Build header row
  const headers: string[] = [];
  if (includeRowNumbers) {
    headers.push('row_number');
  }
  headers.push(...dataColumns);
  if (includeSpecStatus && outcome) {
    headers.push('spec_status');
  }

  // Build data rows
  const rows: string[] = [headers.map(escapeCSVValue).join(',')];

  data.forEach((row, index) => {
    const values: string[] = [];

    if (includeRowNumbers) {
      values.push(String(index + 1));
    }

    dataColumns.forEach(col => {
      values.push(escapeCSVValue(row[col]));
    });

    if (includeSpecStatus && outcome) {
      const outcomeValue = Number(row[outcome]);
      if (!isNaN(outcomeValue)) {
        values.push(getSpecStatus(outcomeValue, specs));
      } else {
        values.push('N/A');
      }
    }

    rows.push(values.join(','));
  });

  return rows.join('\n');
}

/**
 * Triggers download of CSV file
 */
export function downloadCSV(
  data: Record<string, unknown>[],
  outcome: string | null,
  specs: Pick<SpecLimits, 'usl' | 'lsl'>,
  options: ExportOptions = {}
): void {
  const csv = generateCSV(data, outcome, specs, options);

  if (!csv) {
    console.warn('No data to export');
    return;
  }

  // Create blob with BOM for Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });

  // Generate filename
  const filename =
    options.filename || `variscout-data-${new Date().toISOString().split('T')[0]}.csv`;

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();

  // Cleanup
  URL.revokeObjectURL(url);
}

// ============================================================================
// Findings Export
// ============================================================================

/**
 * Generate CSV content from findings array.
 * One row per finding with key investigation data.
 */
export function generateFindingsCSV(findings: Finding[], hypotheses?: Hypothesis[]): string {
  if (findings.length === 0) return '';

  const hypothesisMap = new Map(hypotheses?.map(h => [h.id, h]) ?? []);

  const headers = [
    'id',
    'text',
    'status',
    'tag',
    'factor',
    'eta_squared',
    'cpk_before',
    'cpk_after',
    'hypothesis',
    'actions',
    'outcome',
    'created_at',
  ];

  const rows: string[] = [headers.join(',')];

  for (const f of findings) {
    const hypothesis = f.hypothesisId ? hypothesisMap.get(f.hypothesisId) : undefined;
    const factor = hypothesis?.factor ?? getFirstFilterFactor(f);
    const etaSquared =
      f.context.cumulativeScope !== null ? (f.context.cumulativeScope / 100).toFixed(3) : '';
    const cpkBefore = f.context.stats?.cpk?.toFixed(2) ?? '';
    const cpkAfter = f.outcome?.cpkAfter?.toFixed(2) ?? '';
    const actionsStr = f.actions?.map(a => a.text).join('; ') ?? '';
    const outcomeStr = f.outcome
      ? `${f.outcome.effective}${f.outcome.notes ? ': ' + f.outcome.notes : ''}`
      : '';

    rows.push(
      [
        escapeCSVValue(f.id),
        escapeCSVValue(f.text),
        escapeCSVValue(FINDING_STATUS_LABELS[f.status]),
        escapeCSVValue(f.tag ? FINDING_TAG_LABELS[f.tag] : ''),
        escapeCSVValue(factor),
        etaSquared,
        cpkBefore,
        cpkAfter,
        escapeCSVValue(hypothesis?.text ?? ''),
        escapeCSVValue(actionsStr),
        escapeCSVValue(outcomeStr),
        new Date(f.createdAt).toISOString(),
      ].join(',')
    );
  }

  return rows.join('\n');
}

/** Get the first filter factor from a finding's context */
function getFirstFilterFactor(f: Finding): string {
  const keys = Object.keys(f.context.activeFilters);
  return keys.length > 0 ? keys[0] : '';
}

/**
 * Generate structured JSON export of findings.
 */
export function generateFindingsJSON(
  findings: Finding[],
  hypotheses?: Hypothesis[],
  processContext?: ProcessContext
): string {
  const summary = {
    total: findings.length,
    byStatus: {} as Record<string, number>,
    keyDrivers: findings.filter(f => f.tag === 'key-driver').length,
    resolved: findings.filter(f => f.status === 'resolved').length,
  };

  for (const f of findings) {
    summary.byStatus[f.status] = (summary.byStatus[f.status] || 0) + 1;
  }

  const output = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    process: processContext ?? null,
    findings,
    hypotheses: hypotheses ?? [],
    summary,
  };

  return JSON.stringify(output, null, 2);
}

/**
 * Trigger download of findings as CSV file.
 */
export function downloadFindingsCSV(findings: Finding[], hypotheses?: Hypothesis[]): void {
  const csv = generateFindingsCSV(findings, hypotheses);
  if (!csv) return;

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const filename = `variscout-findings-${new Date().toISOString().split('T')[0]}.csv`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Trigger download of findings as JSON file.
 */
export function downloadFindingsJSON(
  findings: Finding[],
  hypotheses?: Hypothesis[],
  processContext?: ProcessContext
): void {
  const json = generateFindingsJSON(findings, hypotheses, processContext);

  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const filename = `variscout-findings-${new Date().toISOString().split('T')[0]}.json`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
