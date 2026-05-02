#!/usr/bin/env node
// check-dist-integrity.mjs — verify every asset reference in a built
// index.html actually exists on disk. Catches the stale-chunk-hash class
// of regression (e.g. dist/index.html referencing a /assets/X.js that
// vanished because the build wasn't fully synced before deploy).
//
// Usage:
//   node scripts/check-dist-integrity.mjs                  # defaults to apps/pwa/dist
//   node scripts/check-dist-integrity.mjs apps/pwa/dist    # explicit
//
// Exit codes:
//   0  all referenced assets exist
//   1  one or more referenced assets missing on disk
//   2  index.html itself is missing (build not run)

import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const distDir = process.argv[2] || 'apps/pwa/dist';
const indexPath = resolve(distDir, 'index.html');

if (!existsSync(indexPath)) {
  console.error(`✗ check-dist-integrity: ${indexPath} not found — did you run the PWA build?`);
  process.exit(2);
}

const html = readFileSync(indexPath, 'utf8');

// Match src="/..." and href="/..." attributes. We only care about absolute
// root-relative refs (the only kind Vite emits for built assets).
const refPattern = /(?:src|href)="(\/[^"]+)"/g;
const refs = [...html.matchAll(refPattern)]
  .map((m) => m[1])
  .filter(
    (p) =>
      p.startsWith('/assets/') ||
      p === '/registerSW.js' ||
      p === '/manifest.webmanifest' ||
      p === '/sw.js',
  );

const missing = refs.filter((r) => !existsSync(join(distDir, r.replace(/^\//, ''))));

if (missing.length === 0) {
  console.log(
    `✓ check-dist-integrity: all ${refs.length} asset refs in ${indexPath} exist on disk`,
  );
  process.exit(0);
}

console.error(
  `✗ check-dist-integrity: ${missing.length} missing asset(s) referenced from ${indexPath}:`,
);
for (const m of missing) console.error(`    ${m}`);
process.exit(1);
