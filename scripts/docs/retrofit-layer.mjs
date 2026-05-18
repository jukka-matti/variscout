#!/usr/bin/env node
// retrofit-layer.mjs — auto-populates SDD `layer:` frontmatter from file path.
// Idempotent. Skips files that already declare layer:. Reports counts.
//
// SDD M1 (2026-05-18 spec-driven-development-design.md). Run once per migration;
// safe to re-run.
//
// Mapping (path prefix → layer):
//   docs/01-vision/         → L1
//   docs/02-journeys/       → L2
//   docs/03-features/       → L3
//   docs/05-technical/      → L4
//   docs/07-decisions/      → L5
//   docs/superpowers/specs/ → spec
//   docs/superpowers/plans/ → spec
//   docs/archive/specs/     → spec
//   docs/archive/plans/     → spec
//   docs/archive/adrs/      → L5  (these are old ADRs)
//
// Everything else (docs/cards/, docs/agent-context/, docs/ephemeral/, root *.md):
// skipped — they don't belong to the 5-layer stack.

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const DOCS = join(ROOT, 'docs');
const DRY_RUN = process.argv.includes('--dry-run');

function layerForPath(relPath) {
  if (relPath.startsWith('docs/01-vision/')) return 'L1';
  if (relPath.startsWith('docs/02-journeys/')) return 'L2';
  if (relPath.startsWith('docs/03-features/')) return 'L3';
  if (relPath.startsWith('docs/05-technical/')) return 'L4';
  if (relPath.startsWith('docs/07-decisions/')) return 'L5';
  if (relPath.startsWith('docs/archive/adrs/')) return 'L5';
  if (relPath.startsWith('docs/superpowers/specs/')) return 'spec';
  if (relPath.startsWith('docs/superpowers/plans/')) return 'spec';
  if (relPath.startsWith('docs/archive/specs/')) return 'spec';
  if (relPath.startsWith('docs/archive/plans/')) return 'spec';
  // Phase 4 additions (SDD post-migration structural cleanup, 2026-05-18):
  if (relPath.startsWith('docs/04-cases/')) return 'L1'; // teaching content; vision-adjacent
  if (relPath.startsWith('docs/06-design-system/')) return 'L5'; // long-lived foundation
  if (relPath.startsWith('docs/08-products/')) return 'L5'; // ops/GTM (pricing, ISO-9001, marketplace)
  if (relPath.startsWith('docs/10-development/')) return 'L5'; // development reference
  return null;
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (entry.endsWith('.md')) out.push(full);
  }
  return out;
}

let updated = 0;
let already = 0;
let skipped = 0;
let noFrontmatter = 0;
const updatedFiles = [];

for (const file of walk(DOCS)) {
  const rel = relative(ROOT, file);
  const layer = layerForPath(rel);
  if (!layer) {
    skipped++;
    continue;
  }

  const src = readFileSync(file, 'utf8');

  if (!src.startsWith('---\n') && !src.startsWith('---\r\n')) {
    noFrontmatter++;
    continue;
  }

  const end = src.indexOf('\n---', 4);
  if (end < 0) {
    noFrontmatter++;
    continue;
  }

  const rawFm = src.slice(4, end);

  // Idempotency check: line-prefix match on `layer:` (avoids YAML parse cost
  // and avoids re-emitting frontmatter formatting).
  if (/^layer:/m.test(rawFm)) {
    already++;
    continue;
  }

  // Insert `layer: <value>` as the final frontmatter key, before trailing newlines.
  // Preserves all other formatting (key order, comments, indentation).
  const lines = rawFm.split('\n');
  let insertIdx = lines.length;
  while (insertIdx > 0 && lines[insertIdx - 1].trim() === '') insertIdx--;
  lines.splice(insertIdx, 0, `layer: ${layer}`);
  const newRawFm = lines.join('\n');

  const newSrc = `---\n${newRawFm}\n---${src.slice(end + 4)}`;

  if (!DRY_RUN) {
    writeFileSync(file, newSrc);
  }
  updated++;
  updatedFiles.push(`${rel} → layer: ${layer}`);
}

const mode = DRY_RUN ? '[DRY-RUN] ' : '';
console.log(
  `${mode}Retrofit complete: ${updated} updated · ${already} already had layer: · ${noFrontmatter} no frontmatter · ${skipped} out-of-scope (cards/agent-context/etc.)`,
);

if (DRY_RUN && updatedFiles.length > 0) {
  console.log(`\nWould update:`);
  for (const f of updatedFiles.slice(0, 20)) console.log(`  ${f}`);
  if (updatedFiles.length > 20) console.log(`  ... ${updatedFiles.length - 20} more`);
}
