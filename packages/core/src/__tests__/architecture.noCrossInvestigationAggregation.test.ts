import { describe, it, expect, beforeAll } from 'vitest';
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
 *
 * ## This is a tripwire, not a wall.
 *
 * Architecture tests catch the obvious case (a contributor — human or
 * LLM-assisted — reaches for `aggregateCpk` or `sumCpk`) and force
 * intentional renaming OR a design rethink. They do NOT enforce
 * semantic correctness: a function named `unifiedQualityIndex()` doing
 * exactly the forbidden aggregation would pass this test. And the scope
 * is narrow — this guard scans only `@variscout/core`; cross-package
 * aggregations introduced in `packages/charts`, `packages/ui`, or apps
 * would not be caught.
 *
 * The durable answer for any rule that earns full enforcement is
 * type-level (branded types, ADR-074-style policy types). See
 * `docs/investigations.md` "Branded Cpk type as durable replacement"
 * for the proposed follow-up.
 */
const FORBIDDEN_NAMES = [
  // Spec's own verification command names
  'aggregateCpk',
  'aggregateCapability',
  'meanCapability',
  'sumCpk',
  'portfolioCpk',
  // Explicit cross-investigation / cross-hub variants
  'aggregateCpkAcrossInvestigations',
  'aggregateCapabilityAcrossInvestigations',
  'crossHubCpk',
  'crossInvestigationCpk',
  'crossInvestigationCapability',
  'globalCpk',
  'hubLevelCpk',
  // Common synonyms a developer might reach for
  'rollupCpk',
  'rollupCapability',
  'combineCpk',
  'combineCapability',
];

// Cross-package enforcement is out of scope for this guard — it scans only
// @variscout/core. Display-layer aggregations introduced in packages/charts,
// packages/ui, or apps would not be caught here. A follow-up plan should
// extend this guard (or add equivalents per package) once those layers exist.

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

// Read-once cache: all ~190 source files are read into memory once in
// beforeAll. Each it() block scans the cached strings, not the disk.
// This reduces ~3040 synchronous readFileSync calls (16 names × ~190 files)
// to ~190 reads total, eliminating the IO-induced timeout flake under
// turbo concurrent load (see docs/investigations.md
// "Pre-existing tsc errors deferred from PR #168", vitest worker-timeout
// sub-item, and feedback_pr_ready_check_retry_on_grep_test).
type CachedFile = { path: string; text: string };

describe('Architecture — no cross-investigation Cp/Cpk aggregation primitive', () => {
  let cache: CachedFile[];

  beforeAll(() => {
    const paths = listTypeScriptFiles(CORE_SRC);
    cache = paths.map(p => ({ path: p, text: fs.readFileSync(p, 'utf8') }));
  });

  for (const name of FORBIDDEN_NAMES) {
    it(`does not declare or reference "${name}" anywhere in @variscout/core (excluding tests)`, () => {
      // Whole-word match: name preceded by non-word char (or start of file)
      // and followed by non-word char (or end of file). Avoids false positives
      // on longer names that happen to contain a forbidden substring.
      const pattern = new RegExp(`(^|\\W)${name}(?=\\W|$)`);
      const hits = cache.filter(f => pattern.test(f.text)).map(f => f.path);
      expect(hits, `Forbidden name "${name}" appears in:\n  ${hits.join('\n  ')}`).toEqual([]);
    });
  }
});
