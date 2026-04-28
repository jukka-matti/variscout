import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Forbidden identifier patterns: any name suggesting cross-investigation or
 * cross-hub Cp/Cpk aggregation. The production-line-glance design preserves
 * Watson's "Cpks are not additive across heterogeneous local processes"
 * rule by *structural absence* of such primitives.
 *
 * Names mirror the spec's verification command at
 * `docs/superpowers/specs/2026-04-28-production-line-glance-design.md:355`
 * (`meanCapability|aggregateCpk|sumCpk|portfolioCpk`) plus the explicit
 * cross-hub / cross-investigation variants the design forbids.
 *
 * NOTE: `meanCpk` is intentionally NOT in this list. It is a legitimate
 * field name on `PerformanceSummary.overall` and `capabilityStability` —
 * a within-investigation summary across the channels of a single analysis,
 * which the spec permits. Forbidding it would collide with legitimate
 * within-investigation aggregation. The cross-investigation hazard the
 * spec targets is captured by the explicit cross/portfolio/global variants.
 */
const FORBIDDEN_NAMES = [
  'aggregateCpkAcrossInvestigations',
  'aggregateCapabilityAcrossInvestigations',
  'meanCapability',
  'sumCpk',
  'portfolioCpk',
  'crossHubCpk',
  'globalCpk',
];

// Use import.meta.dirname (Node 20.11+) instead of __dirname so the file
// satisfies the repo's browser-globals ESLint config for *.test.ts files
// without requiring the *.integration.test.ts naming convention.
const CORE_SRC = path.resolve(import.meta.dirname, '..');

function listTypeScriptFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip test directories (the test's own forbidden-list mention is OK)
      if (entry.name === '__tests__') continue;
      out.push(...listTypeScriptFiles(full));
      continue;
    }
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.ts') && !entry.name.endsWith('.tsx')) continue;
    if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.test.tsx')) continue;
    out.push(full);
  }
  return out;
}

function findHits(name: string, files: readonly string[]): string[] {
  // Whole-word match: name preceded by non-word char (or start of file) and
  // followed by non-word char (or end of file). Avoids false positives on
  // longer names that happen to contain a forbidden substring.
  const pattern = new RegExp(`(^|\\W)${name}(?=\\W|$)`);
  const hits: string[] = [];
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    if (pattern.test(text)) hits.push(file);
  }
  return hits;
}

describe('Architecture — no cross-investigation Cp/Cpk aggregation primitive', () => {
  const files = listTypeScriptFiles(CORE_SRC);

  for (const name of FORBIDDEN_NAMES) {
    it(`does not declare or reference "${name}" anywhere in @variscout/core (excluding tests)`, () => {
      const hits = findHits(name, files);
      expect(hits, `Forbidden name "${name}" appears in:\n  ${hits.join('\n  ')}`).toEqual([]);
    });
  }
});
