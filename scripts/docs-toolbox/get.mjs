#!/usr/bin/env node
// get.mjs — print a full doc by id (basename without .md) or path.
//
// Usage:
//   pnpm docs:get adr-082-wedge-architecture
//   pnpm docs:get docs/superpowers/specs/2026-05-16-docs-strategy-design.md

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const DOCS = join(ROOT, 'docs');

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: pnpm docs:get <id-or-path>');
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
  if (matches.length === 0) {
    console.error(`Not found: ${arg}`);
    process.exit(1);
  }
  if (matches.length > 1) {
    console.error(`Ambiguous id '${arg}' — matches:`);
    for (const m of matches) console.error(`  ${relative(ROOT, m)}`);
    process.exit(1);
  }
  target = matches[0];
}

process.stdout.write(readFileSync(target, 'utf8'));
