import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Tailwind v4 token-guard for @variscout/ui.
 *
 * Tailwind v4 silently skips unknown utility candidates — if a `--color-*`
 * token is missing from the `@theme` block, no CSS rule is generated and the
 * element renders with no fill/background/text color (often defaulting to
 * black for SVG fills or transparent for backgrounds).
 *
 * This test is a tripwire that catches the class of bug where:
 *   - A component uses `bg-surface-foo` / `fill-surface-foo` / etc.
 *   - `--color-surface-foo` is missing from packages/ui/src/styles/theme.css
 *   - The utility silently does nothing at runtime
 *
 * Read-once pattern: source files + theme.css are read into memory in
 * beforeAll; each it() block scans the cached strings. Mirrors the approach
 * in packages/core/src/__tests__/architecture.noCrossInvestigationAggregation.test.ts
 * and packages/charts/src/__tests__/architecture.noVisxDeepImports.test.ts.
 *
 * ## Known debt (allowlisted)
 *
 * The guard found additional missing tokens beyond the `surface-primary`
 * family targeted by this fix. These are REAL bugs — the utilities appear in
 * component className strings but have no `--color-*` declaration in
 * theme.css. They are left here as a documented allowlist so:
 *  1. The suite remains green (no false-blocking of unrelated work)
 *  2. The debt is visible in code + test output, not hidden
 *
 * TODO: Fix these missing tokens in a follow-up (add --color-* aliases to
 * theme.css or rename the classes to use existing tokens):
 *   - surface-background   (bg-surface-background)
 *   - surface-tooltip      (bg-surface-tooltip)
 *   - surface-hover        (hover:bg-surface-hover)
 *   - content-subtle       (fill-content-subtle, text-content-subtle)
 *   - content-tertiary     (text-content-tertiary, disabled:text-content-tertiary)
 *   - edge-hover           (hover:border-edge-hover)
 *   - edge-strong          (hover:border-edge-strong)
 */

const UI_SRC = path.resolve(import.meta.dirname, '..');
const THEME_CSS = path.resolve(import.meta.dirname, '../styles/theme.css');

// Tokens with missing --color-* declarations that are deferred to a follow-up
// fix. They are real bugs but are NOT in scope for this task.
// See the module doc-comment above for details.
const KNOWN_MISSING_TOKEN_ALLOWLIST = new Set([
  'surface-background',
  'surface-tooltip',
  'surface-hover',
  'content-subtle',
  'content-tertiary',
  'edge-hover',
  'edge-strong',
]);

type CachedFile = { filePath: string; text: string };

function listTypeScriptFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip test directories — the test's own token mentions are OK
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

/**
 * Parse the @theme block from theme.css and return the set of defined
 * --color-* token names (the part after "--color-").
 */
function parseThemeColorTokens(css: string): Set<string> {
  const tokens = new Set<string>();
  // Extract just the @theme { ... } block
  const themeMatch = css.match(/@theme\s*\{([^}]+)\}/s);
  if (!themeMatch) return tokens;
  const themeBlock = themeMatch[1];
  // Match every --color-<name>: declaration
  const re = /--color-([\w-]+)\s*:/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(themeBlock)) !== null) {
    tokens.add(m[1]);
  }
  return tokens;
}

/**
 * Extract Tailwind color-utility candidate tokens from a source text.
 * Returns the set of color parts (e.g., "surface-primary", "content-muted").
 *
 * Pattern: optional variant prefix(es), then
 *   (bg|fill|stroke|text|border)-(surface|content|edge|status)<suffix>
 *
 * Variant prefixes like hover:, focus:, dark:, disabled:, active: are stripped.
 * Opacity suffixes like /30 are stripped.
 *
 * Note: `text-*` also matches font-size utilities like `text-xs`. The
 * (surface|content|edge|status) families in this guard are all color
 * families — they don't overlap with Tailwind's built-in font-size names.
 */
function extractCandidateTokens(text: string): Set<string> {
  const candidates = new Set<string>();
  // Match optional variant chains (hover:, focus:dark:, etc.) then the utility
  const re =
    /(?:[\w-]+:)*(bg|fill|stroke|text|border)-((?:surface|content|edge|status)[\w-]*?)(?:\/\d+)?(?=[\s"'`\])}]|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    candidates.add(m[2]);
  }
  return candidates;
}

describe('Architecture — Tailwind v4 color token completeness', () => {
  let sourceCache: CachedFile[];
  let themeTokens: Set<string>;
  let allCandidates: Set<string>;

  beforeAll(() => {
    // Read-once: load all source files + theme.css into memory
    const paths = listTypeScriptFiles(UI_SRC);
    sourceCache = paths.map(p => ({ filePath: p, text: fs.readFileSync(p, 'utf8') }));
    themeTokens = parseThemeColorTokens(fs.readFileSync(THEME_CSS, 'utf8'));

    // Collect all candidate tokens across the entire source tree
    allCandidates = new Set<string>();
    for (const file of sourceCache) {
      for (const token of extractCandidateTokens(file.text)) {
        allCandidates.add(token);
      }
    }
  });

  it('scans more than 50 source files (sanity guard against empty-scan)', () => {
    expect(sourceCache.length).toBeGreaterThan(50);
  });

  it('finds at least one candidate token (sanity guard against silent-empty regex)', () => {
    expect(allCandidates.size).toBeGreaterThan(0);
  });

  it('defines at least 10 --color-* tokens in theme.css (sanity guard against parse failure)', () => {
    expect(themeTokens.size).toBeGreaterThan(10);
  });

  it('all candidate color tokens have a matching --color-* declaration in theme.css (excluding known debt)', () => {
    const missing: string[] = [];
    for (const token of allCandidates) {
      if (themeTokens.has(token)) continue;
      if (KNOWN_MISSING_TOKEN_ALLOWLIST.has(token)) continue;
      missing.push(token);
    }
    expect(
      missing.sort(),
      `Tailwind color-utility candidates with NO --color-* declaration in theme.css.\n` +
        `These utilities are silently no-ops in Tailwind v4.\n` +
        `Fix: add --color-<token>: var(--<css-var>) to the @theme block in packages/ui/src/styles/theme.css,\n` +
        `OR rename the class to use an existing token,\n` +
        `OR add to KNOWN_MISSING_TOKEN_ALLOWLIST with a TODO if deferring.\n\n` +
        `Missing tokens:\n  ${missing.sort().join('\n  ')}`
    ).toEqual([]);
  });
});
