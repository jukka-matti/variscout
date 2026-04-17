#!/usr/bin/env node
// docs-frontmatter-fix.mjs — one-shot normalization codemod.
// Safe, narrow fixes only:
//   1. Lowercase STATUS enum values ('Accepted' → 'accepted').
//   2. Resolve the 'Superseded by ADR-037' anomaly in adr-024.
//   3. Add a minimal frontmatter block to the 3 bare plan files.
//
// NOT done here: filling missing required fields on general docs
// (audience/category/status). Those require human judgment — run
// the validator and address the `missing-required` list manually.
//
// Usage: node scripts/docs-frontmatter-fix.mjs [--apply]
//   --apply writes changes. Default is dry-run.

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { STATUS } from './docs-frontmatter-schema.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DOCS = join(ROOT, 'docs');
const APPLY = process.argv.includes('--apply');

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (entry.endsWith('.md')) out.push(full);
  }
  return out;
}

const changes = [];
function change(file, desc) {
  changes.push(`  ${relative(ROOT, file)}: ${desc}`);
}

// Fix 1: lowercase status values
function fixStatusCasing(file, src) {
  const m = src.match(/^(---\r?\n)([\s\S]*?)(\r?\n---\r?\n)/);
  if (!m) return src;
  const [, open, body, close] = m;
  let changed = false;
  const newBody = body.replace(
    /^(status:\s*)(['"]?)([A-Za-z][\w -]*)\2\s*$/gm,
    (full, prefix, quote, val) => {
      const lower = val.toLowerCase();
      if (val === lower) return full;
      // Skip the ADR-024 anomaly — handled separately below.
      if (val.startsWith('Superseded by')) return full;
      if (!STATUS.includes(lower)) return full;
      changed = true;
      change(file, `status '${val}' → '${lower}'`);
      return `${prefix}${quote}${lower}${quote}`;
    },
  );
  return changed ? open + newBody + close + src.slice(m[0].length) : src;
}

// Fix 2: adr-024 anomaly — status value is a sentence
function fixAdr024Anomaly(file, src) {
  if (!file.endsWith('adr-024-scouting-report.md')) return src;
  if (!/status:\s*['"]?Superseded by ADR-037['"]?/.test(src)) return src;
  change(file, `status 'Superseded by ADR-037' → 'superseded' + superseded-by field`);
  return src.replace(
    /status:\s*['"]?Superseded by ADR-037['"]?/,
    'status: superseded\nsuperseded-by: adr-037',
  );
}

// Fix 3: add minimal frontmatter to the 3 bare plan files
const BARE_PLAN_DEFAULTS = {
  'agent-docs-architecture-phase1-foundation':
    'Agent Docs Architecture — Phase 1: Foundation',
  'agent-docs-architecture-phase2-migration':
    'Agent Docs Architecture — Phase 2: Migration',
  'agent-docs-architecture-phase3-enforcement':
    'Agent Docs Architecture — Phase 3: Enforcement',
};

function fixBareFrontmatter(file, src) {
  if (!file.includes('docs/superpowers/plans/')) return src;
  if (src.startsWith('---\n') || src.startsWith('---\r\n')) return src;
  for (const [stem, title] of Object.entries(BARE_PLAN_DEFAULTS)) {
    if (!file.includes(stem)) continue;
    const fm =
      `---\n` +
      `title: '${title}'\n` +
      `status: delivered\n` +
      `date: 2026-04-17\n` +
      `---\n\n`;
    change(file, 'added frontmatter block');
    return fm + src;
  }
  return src;
}

const files = walk(DOCS);
let writes = 0;
for (const f of files) {
  const orig = readFileSync(f, 'utf8');
  let next = orig;
  next = fixStatusCasing(f, next);
  next = fixAdr024Anomaly(f, next);
  next = fixBareFrontmatter(f, next);
  if (next !== orig) {
    writes++;
    if (APPLY) writeFileSync(f, next);
  }
}

console.log(APPLY ? '=== APPLIED ===' : '=== DRY-RUN (pass --apply to write) ===');
if (changes.length === 0) {
  console.log('No changes needed.');
} else {
  console.log(`${changes.length} change(s) across ${writes} file(s):\n`);
  for (const c of changes) console.log(c);
}
