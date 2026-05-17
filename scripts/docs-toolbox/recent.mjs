#!/usr/bin/env node
// recent.mjs — list new docs + decision-log entries since a cutoff date.
//
// Usage:
//   pnpm docs:recent --since=2026-05-10
//   pnpm docs:recent --since=2026-05-10 --amendments
//
// --amendments restricts decision-log output to entries with canonical edit-types.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readDoc } from './lib/frontmatter.mjs';
import { parseEntry } from './lib/edit-types.mjs';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const DOCS = join(ROOT, 'docs');

const args = parseArgs(process.argv.slice(2));
function parseArgs(argv) {
  const out = { since: null, amendmentsOnly: false };
  for (const a of argv) {
    if (a.startsWith('--since=')) out.since = a.slice(8);
    else if (a === '--amendments') out.amendmentsOnly = true;
  }
  return out;
}

if (!args.since || !/^\d{4}-\d{2}-\d{2}$/.test(args.since)) {
  console.error('Usage: pnpm docs:recent --since=YYYY-MM-DD [--amendments]');
  process.exit(2);
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

const newDocs = [];
for (const f of walk(DOCS)) {
  const doc = readDoc(f);
  const date = String(doc.frontmatter.date ?? doc.frontmatter['last-verified'] ?? '');
  if (/^\d{4}-\d{2}-\d{2}$/.test(date) && date >= args.since) {
    newDocs.push({
      path: relative(ROOT, f),
      title: doc.frontmatter.title ?? '(no title)',
      date,
    });
  }
}
newDocs.sort((a, b) => b.date.localeCompare(a.date));

console.log(`# Docs added or last-verified since ${args.since} (${newDocs.length})\n`);
for (const d of newDocs.slice(0, 30)) {
  console.log(`- ${d.date} — ${d.path} — ${d.title}`);
}
if (newDocs.length > 30) console.log(`(+ ${newDocs.length - 30} more)`);

const logRaw = readFileSync(join(DOCS, 'decision-log.md'), 'utf8');
const entries = [];
for (const line of logRaw.split('\n')) {
  const e = parseEntry(line);
  if (e && e.date >= args.since) {
    if (args.amendmentsOnly && !e.editType) continue;
    entries.push(e);
  }
}

console.log(`\n# Decision-log entries since ${args.since} (${entries.length})\n`);
for (const e of entries) {
  console.log(`- ${e.date} — ${e.title}${e.editType ? ` [${e.editType}]` : ''}`);
}

if (args.amendmentsOnly && entries.length === 0) {
  console.log(`(Tip: drop --amendments to see all decision-log entries.)`);
}
