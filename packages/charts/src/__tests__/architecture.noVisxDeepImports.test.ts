import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Deep-import guard for @visx packages in @variscout/charts.
 *
 * Importing from `@visx/<pkg>/lib/...` resolves to the package's CJS build.
 * Under Vite 8 / Rolldown, default-import interop ignores `__esModule`, so
 * `ViolinPlot` ends up as `{ __esModule: true, default: ƒ }` at runtime,
 * causing React to throw "Element type is invalid … check the render method
 * of `BoxplotBase`" on every violin render.
 *
 * The fix is to use named root imports (`import { ViolinPlot } from '@visx/stats'`)
 * which resolve to the package's `module: esm/index.js` (pure ESM with named
 * exports) and are free of interop issues.
 *
 * This test is a tripwire: it enforces the import pattern structurally (file
 * content scan) because vitest's interopDefault honors `__esModule` and does
 * NOT reproduce the Vite 8 runtime crash.
 *
 * Read-once pattern: all source files are read into memory in beforeAll; each
 * it() block scans the cached strings. Mirrors the approach used in
 * `packages/core/src/__tests__/architecture.noCrossInvestigationAggregation.test.ts`.
 */

const CHARTS_SRC = path.resolve(import.meta.dirname, '..');

type CachedFile = { path: string; text: string };

function listTypeScriptFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip test directories — the test's own pattern mention is OK
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

describe('Architecture — no @visx deep-path (lib/...) imports in @variscout/charts', () => {
  let cache: CachedFile[];

  beforeAll(() => {
    const paths = listTypeScriptFiles(CHARTS_SRC);
    cache = paths.map(p => ({ path: p, text: fs.readFileSync(p, 'utf8') }));
  });

  it('scans at least 10 source files (sanity check against empty directory)', () => {
    expect(cache.length).toBeGreaterThan(10);
  });

  it('does not import from @visx/<pkg>/lib/... anywhere in packages/charts/src (excluding tests)', () => {
    // Match any import referencing @visx/<something>/lib/
    const pattern = /from\s+['"]@visx\/[^'"]+\/lib\//;
    const hits = cache.filter(f => pattern.test(f.text)).map(f => f.path);
    expect(
      hits,
      `Deep @visx/lib imports found (use named root imports instead — e.g. import { ViolinPlot } from '@visx/stats'):\n  ${hits.join('\n  ')}`
    ).toEqual([]);
  });
});
