import type { ColumnParsingProfile } from '../parser/types';
import { parseStepTimestampColumnName } from './detectStepTimestampPairs';

export interface PairedTimingColumns {
  prefix: string;
  startColumn: string;
  endColumn: string;
  matchedStepId: string | null;
}

/**
 * Finds paired date-kind columns by name convention (e.g. `Prep_start` / `Prep_end`)
 * and matches each prefix to a process step by case-insensitive name equality.
 *
 * @param profiles - Column parsing profiles from the canvas palette.
 * @param steps    - Process steps with `id` and `name` fields.
 * @returns Deterministically ordered (alphabetical by prefix) list of complete pairs.
 *          Unpaired columns and non-date columns are silently ignored.
 */
export function detectPairedTimingColumns(
  profiles: ColumnParsingProfile[],
  steps: { id: string; name: string }[]
): PairedTimingColumns[] {
  // 1. Filter to date-kind columns only.
  const dateProfiles = profiles.filter(p => p.primary?.kind === 'date');

  // 2. Group by normalised base name (lowercase), stripping start/end suffixes.
  //    Keys are lowercase base names; values track the original column name per role.
  const startByBase = new Map<string, string>(); // lowercase prefix → original column name
  const endByBase = new Map<string, string>();

  for (const profile of dateProfiles) {
    const parsed = parseStepTimestampColumnName(profile.columnName);
    if (parsed === null) continue;
    if (parsed.role === 'start') {
      startByBase.set(parsed.baseKey, profile.columnName);
    } else {
      endByBase.set(parsed.baseKey, profile.columnName);
    }
  }

  // 3. Build a lookup map for steps: lowercase name → step id.
  const stepByLowerName = new Map<string, string>();
  for (const step of steps) {
    stepByLowerName.set(step.name.toLowerCase(), step.id);
  }

  // 4. Pair bases where both _start and _end exist, matching prefix to step.
  const pairs: PairedTimingColumns[] = [];

  for (const [lowerBase, startColumn] of startByBase) {
    const endColumn = endByBase.get(lowerBase);
    if (endColumn === undefined) continue;

    const prefix = parseStepTimestampColumnName(startColumn)?.stepName ?? startColumn;

    const matchedStepId = stepByLowerName.get(lowerBase) ?? null;

    pairs.push({ prefix, startColumn, endColumn, matchedStepId });
  }

  // 5. Return in deterministic alphabetical order by prefix (case-insensitive).
  pairs.sort((a, b) => a.prefix.toLowerCase().localeCompare(b.prefix.toLowerCase()));

  return pairs;
}
