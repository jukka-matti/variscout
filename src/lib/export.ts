/**
 * CSV Export utility for VariScout Lite
 * Generates Excel-compatible CSV files from analysis data
 */

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
  specs: { usl?: number; lsl?: number }
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
  specs: { usl?: number; lsl?: number },
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
  specs: { usl?: number; lsl?: number },
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
  const filename = options.filename || `variscout-data-${new Date().toISOString().split('T')[0]}.csv`;

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();

  // Cleanup
  URL.revokeObjectURL(url);
}
