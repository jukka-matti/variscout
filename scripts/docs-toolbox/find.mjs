#!/usr/bin/env node
// find.mjs — search docs/** by frontmatter filters + optional keyword query.
//
// Usage:
//   pnpm docs:find --purpose=design --topic=ax
//   pnpm docs:find --tier=living --status=active --keyword=canvas
//   pnpm docs:find --keyword="response path"
//
// Filters AND together; --keyword does case-insensitive substring match on
// title + body. Output: top-N matches (default 10), each with path + title +
// 1-line excerpt.

import { readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readDoc } from './lib/frontmatter.mjs';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const DOCS = join(ROOT, 'docs');

const args = parseArgs(process.argv.slice(2));

function parseArgs(argv) {
  const out = { filters: {}, keyword: null, limit: 10 };
  for (const a of argv) {
    if (a.startsWith('--keyword=')) out.keyword = a.slice(10).toLowerCase();
    else if (a.startsWith('--limit=')) out.limit = Number(a.slice(8));
    else if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq > 2) out.filters[a.slice(2, eq)] = a.slice(eq + 1);
    }
  }
  return out;
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

function matchesFilters(fm, filters) {
  for (const [key, want] of Object.entries(filters)) {
    const have = fm[key];
    if (have == null) return false;
    if (Array.isArray(have)) {
      if (!have.map(String).includes(want)) return false;
    } else if (String(have) !== want) {
      return false;
    }
  }
  return true;
}

function matchesKeyword(doc, keyword) {
  if (!keyword) return true;
  const haystack = (doc.frontmatter.title ?? '') + ' ' + doc.body;
  return haystack.toLowerCase().includes(keyword);
}

function excerpt(body, keyword) {
  if (!keyword) {
    for (const line of body.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('>')) continue;
      return trimmed.slice(0, 120);
    }
    return '';
  }
  const idx = body.toLowerCase().indexOf(keyword);
  if (idx < 0) return '';
  const start = Math.max(0, idx - 40);
  return body.slice(start, idx + keyword.length + 80).replace(/\s+/g, ' ').slice(0, 140);
}

const files = walk(DOCS);
const hits = [];
for (const f of files) {
  const doc = readDoc(f);
  if (!matchesFilters(doc.frontmatter, args.filters)) continue;
  if (!matchesKeyword(doc, args.keyword)) continue;
  hits.push({
    path: relative(ROOT, f),
    title: doc.frontmatter.title ?? '(no title)',
    excerpt: excerpt(doc.body, args.keyword),
  });
}

const out = hits.slice(0, args.limit);
if (out.length === 0) {
  console.log('No matches.');
  process.exit(0);
}
for (const hit of out) {
  console.log(`${hit.path}`);
  console.log(`  ${hit.title}`);
  if (hit.excerpt) console.log(`  …${hit.excerpt}…`);
  console.log('');
}
if (hits.length > out.length) console.log(`(+ ${hits.length - out.length} more — increase --limit to see all)`);
