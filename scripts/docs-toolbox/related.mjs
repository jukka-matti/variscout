#!/usr/bin/env node
// related.mjs — list docs related to a given id.
//
// Usage:
//   pnpm docs:related adr-082-wedge-architecture
//
// Sources:
//   1. Target's frontmatter `related:` array → forward links.
//   2. Target's body [[wikilinks]] → forward links.
//   3. Any other doc that lists target.id in its `related:` → backward links.
//   4. Any other doc whose body contains [[target-id]] → backward links.

import { readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readDoc, getDocId, getWikilinks } from './lib/frontmatter.mjs';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const DOCS = join(ROOT, 'docs');

const id = (process.argv[2] ?? '').replace(/\.md$/, '');
if (!id) {
  console.error('Usage: pnpm docs:related <id>');
  process.exit(2);
}

function asArray(v) {
  return Array.isArray(v) ? v : v == null ? [] : [v];
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

const files = walk(DOCS);
let target = null;
const docs = [];
for (const f of files) {
  const doc = readDoc(f);
  const docId = getDocId(f);
  const entry = { path: relative(ROOT, f), id: docId, doc };
  docs.push(entry);
  if (docId === id) target = entry;
}

if (!target) {
  console.error(`Not found: ${id}`);
  process.exit(1);
}

const forwardFM = new Set();
for (const r of asArray(target.doc.frontmatter.related)) forwardFM.add(String(r));
const forwardBody = new Set(getWikilinks(target.doc.body));

const backwardFM = [];
const backwardBody = [];
for (const d of docs) {
  if (d.id === id) continue;
  const relList = asArray(d.doc.frontmatter.related).map(String);
  if (relList.includes(id)) backwardFM.push(d);
  if (getWikilinks(d.doc.body).includes(id)) backwardBody.push(d);
}

function printGroup(label, items) {
  if (items.length === 0) return;
  console.log(`\n${label} (${items.length}):`);
  for (const it of items) console.log(`  ${typeof it === 'string' ? it : it.path}`);
}

console.log(`Related to: ${target.path}`);
printGroup('→ Forward (frontmatter `related:`)', [...forwardFM]);
printGroup('→ Forward (body [[wikilinks]])', [...forwardBody]);
printGroup('← Backward (other docs cite this in `related:`)', backwardFM);
printGroup('← Backward (other docs [[wikilink]] this)', backwardBody);
