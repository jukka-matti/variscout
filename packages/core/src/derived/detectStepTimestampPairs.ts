import type { ColumnAnalysis } from '../parser/types';

export interface StepTimestampPair {
  stepName: string;
  startColumn: string;
  endColumn: string;
}

export type StepTimestampRole = 'start' | 'end';

export interface ParsedStepTimestampColumn {
  stepName: string;
  baseKey: string;
  role: StepTimestampRole;
}

const START_SUFFIXES = ['_start', '_st'] as const;
const END_SUFFIXES = ['_end', '_e'] as const;

export function parseStepTimestampColumnName(columnName: string): ParsedStepTimestampColumn | null {
  const lower = columnName.toLowerCase();

  for (const suffix of START_SUFFIXES) {
    if (!lower.endsWith(suffix)) continue;
    const stepName = columnName.slice(0, columnName.length - suffix.length);
    if (stepName.length === 0) return null;
    return { stepName, baseKey: stepName.toLowerCase(), role: 'start' };
  }

  for (const suffix of END_SUFFIXES) {
    if (!lower.endsWith(suffix)) continue;
    const stepName = columnName.slice(0, columnName.length - suffix.length);
    if (stepName.length === 0) return null;
    return { stepName, baseKey: stepName.toLowerCase(), role: 'end' };
  }

  return null;
}

export function detectStepTimestampPairs(columns: readonly ColumnAnalysis[]): StepTimestampPair[] {
  const starts = new Map<string, { stepName: string; columnName: string }>();
  const ends = new Map<string, string>();

  for (const column of columns) {
    if (column.type !== 'date') continue;
    const parsed = parseStepTimestampColumnName(column.name);
    if (parsed === null) continue;

    if (parsed.role === 'start') {
      if (!starts.has(parsed.baseKey)) {
        starts.set(parsed.baseKey, { stepName: parsed.stepName, columnName: column.name });
      }
    } else if (!ends.has(parsed.baseKey)) {
      ends.set(parsed.baseKey, column.name);
    }
  }

  const pairs: StepTimestampPair[] = [];
  for (const [baseKey, start] of starts) {
    const endColumn = ends.get(baseKey);
    if (endColumn === undefined) continue;
    pairs.push({ stepName: start.stepName, startColumn: start.columnName, endColumn });
  }

  pairs.sort((a, b) => a.stepName.toLowerCase().localeCompare(b.stepName.toLowerCase()));
  return pairs;
}
