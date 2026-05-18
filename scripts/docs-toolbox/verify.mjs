#!/usr/bin/env node
// verify.mjs — update last-verified + verified-against-commit on a doc.
//
// Usage:
//   pnpm docs:verify <id-or-path>
//
// Sets last-verified = today (UTC date) and verified-against-commit =
// `git rev-parse HEAD` (short sha). Uses execFileSync — no shell.

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const DOCS = join(ROOT, 'docs');

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: pnpm docs:verify <id-or-path>');
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

let target = arg;
if (!existsSync(target)) {
  const matches = findById(DOCS, arg.replace(/\.md$/, ''));
  if (matches.length !== 1) {
    console.error(`Not found or ambiguous: ${arg} (${matches.length} matches)`);
    process.exit(1);
  }
  target = matches[0];
}

const src = readFileSync(target, 'utf8');
if (!src.startsWith('---\n') && !src.startsWith('---\r\n')) {
  console.error(`${target}: no frontmatter block.`);
  process.exit(1);
}
const openLen = src.startsWith('---\r\n') ? 5 : 4;
const end = src.indexOf('\n---', openLen);
if (end < 0) {
  console.error(`${target}: malformed frontmatter.`);
  process.exit(1);
}
const fm = src.slice(openLen, end);
const body = src.slice(end + 4);

const today = new Date().toISOString().slice(0, 10);
const sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim().slice(0, 12);

function upsertField(text, key, value) {
  const re = new RegExp(`^${key}:.*$`, 'm');
  if (re.test(text)) return text.replace(re, `${key}: ${value}`);
  return text.replace(/\n*$/, '\n') + `${key}: ${value}\n`;
}

let updated = fm;
updated = upsertField(updated, 'last-verified', today);
updated = upsertField(updated, 'verified-against-commit', sha);

writeFileSync(target, `---\n${updated}\n---${body}`);
console.log(`${relative(ROOT, target)}: last-verified=${today}, verified-against-commit=${sha}`);
