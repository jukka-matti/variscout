#!/usr/bin/env node
// amend.mjs — append a "## Amendment — YYYY-MM-DD" block to an ADR.
//
// Usage:
//   pnpm docs:amend <adr-id> "<one-line summary>"
//
// HARD-FAILS if the target is a design spec (those edit in place, not via
// amendment blocks). See docs/agent-context/doc-discipline.md.

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readDoc } from './lib/frontmatter.mjs';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const DOCS = join(ROOT, 'docs');

const id = process.argv[2];
const summary = process.argv.slice(3).join(' ');
if (!id || !summary) {
  console.error('Usage: pnpm docs:amend <adr-id> "<one-line summary>"');
  process.exit(2);
}

function findById(dir, id, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) findById(full, id, out);
    else if (entry === `${id}.md`) out.push(full);
  }
  return out;
}

// Allow direct relative-path argument (e.g. docs/cards/decisions/foo.md) so the
// caller can bypass id-walk and still hit the rejection guards below.
let target;
const directPath = join(ROOT, id.endsWith('.md') ? id : `${id}.md`);
if (existsSync(directPath)) {
  target = directPath;
} else {
  const matches = findById(DOCS, id.replace(/\.md$/, ''));
  if (matches.length !== 1) {
    console.error(`Not found or ambiguous: ${id} (${matches.length} matches)`);
    process.exit(1);
  }
  target = matches[0];
}
const rel = relative(ROOT, target);

// Card rejection — path check (primary guard).
if (rel.startsWith('docs/cards/')) {
  console.error(
    `${rel}: cards are append-only by definition. Supersede via a new card with \`supersedes: [<prior-id>]\` frontmatter. See docs/agent-context/doc-discipline.md §Cards.`,
  );
  process.exit(1);
}

// Card rejection — frontmatter check (defense in depth for cards stored outside docs/cards/).
const targetDoc = readDoc(target);
if (targetDoc.frontmatter.tier === 'card') {
  console.error(
    `${rel}: cards are append-only by definition. Supersede via a new card with \`supersedes: [<prior-id>]\` frontmatter. See docs/agent-context/doc-discipline.md §Cards.`,
  );
  process.exit(1);
}

const isAdr =
  rel.startsWith('docs/07-decisions/') ||
  rel.startsWith('docs/archive/adrs/') ||
  rel.startsWith('docs/living/decide/');
if (!isAdr) {
  console.error(`${rel}: amend.mjs is ADR-only. Design specs edit in place; see docs/agent-context/doc-discipline.md §Edit-in-place mechanics.`);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const src = readFileSync(target, 'utf8');
const sep = src.endsWith('\n') ? '' : '\n';
const block = `${sep}\n## Amendment — ${today}\n\n${summary}\n`;
writeFileSync(target, src + block);
console.log(`${rel}: appended ## Amendment — ${today}`);
