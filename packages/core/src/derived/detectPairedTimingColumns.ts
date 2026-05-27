import type { ColumnParsingProfile } from '../parser/types';

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

  // 2. Group by normalised base name (lowercase), stripping _start / _end suffix.
  //    Keys are lowercase base names; values track the original column name per role.
  const startByBase = new Map<string, string>(); // lowercase prefix → original column name
  const endByBase = new Map<string, string>();

  for (const profile of dateProfiles) {
    const lower = profile.columnName.toLowerCase();
    if (lower.endsWith('_start')) {
      const base = lower.slice(0, -'_start'.length);
      if (base.length > 0) {
        startByBase.set(base, profile.columnName);
      }
    } else if (lower.endsWith('_end')) {
      const base = lower.slice(0, -'_end'.length);
      if (base.length > 0) {
        endByBase.set(base, profile.columnName);
      }
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

    // Reconstruct display prefix from the start column (strips _start suffix, preserves original casing).
    const prefix = startColumn.slice(0, startColumn.length - '_start'.length);

    const matchedStepId = stepByLowerName.get(lowerBase) ?? null;

    pairs.push({ prefix, startColumn, endColumn, matchedStepId });
  }

  // 5. Return in deterministic alphabetical order by prefix (case-insensitive).
  pairs.sort((a, b) => a.prefix.toLowerCase().localeCompare(b.prefix.toLowerCase()));

  return pairs;
}
