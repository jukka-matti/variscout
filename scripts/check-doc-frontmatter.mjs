#!/usr/bin/env node
// check-doc-frontmatter.mjs — validate docs/** frontmatter against the schema.
// Warn mode until CUTOFF_DATE; after that, exit 1 on violations.
// Mirrors the pattern in scripts/check-dead-links.sh.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { schema, classify } from './docs-frontmatter-schema.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DOCS = join(ROOT, 'docs');
const CUTOFF_DATE = process.env.CUTOFF_DATE ?? '2026-05-15';
const TODAY = new Date().toISOString().slice(0, 10);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (entry.endsWith('.md')) out.push(full);
  }
  return out;
}

function extractFrontmatter(src) {
  if (!src.startsWith('---\n') && !src.startsWith('---\r\n')) return null;
  const end = src.indexOf('\n---', 4);
  if (end < 0) return null;
  return src.slice(4, end);
}

function asArray(v) {
  return Array.isArray(v) ? v : v == null ? [] : [v];
}

const violations = {
  missingFrontmatter: [],
  missingRequired: [],
  unknownEnum: [],
  casingDrift: [],
  malformedYaml: [],
};

function check(file) {
  const rel = relative(ROOT, file);
  const src = readFileSync(file, 'utf8');
  const rawFm = extractFrontmatter(src);
  const kind = classify(rel);
  const rules = schema[kind];

  if (rawFm == null) {
    violations.missingFrontmatter.push(rel);
    return;
  }

  let fm;
  try {
    fm = parseYaml(rawFm) ?? {};
  } catch (err) {
    violations.malformedYaml.push(`${rel}: ${err.message}`);
    return;
  }

  for (const key of rules.required) {
    if (fm[key] == null || fm[key] === '') {
      violations.missingRequired.push(`${rel}: missing '${key}' [${kind}]`);
    }
  }

  for (const [field, allowed] of Object.entries(rules.enums ?? {})) {
    const values = asArray(fm[field]);
    for (const v of values) {
      if (v == null || v === '') continue;
      const str = String(v);
      if (allowed.includes(str)) continue;
      const lower = str.toLowerCase();
      if (allowed.includes(lower)) {
        violations.casingDrift.push(`${rel}: ${field}='${str}' should be '${lower}'`);
      } else {
        violations.unknownEnum.push(`${rel}: ${field}='${str}' not in allowed set`);
      }
    }
  }
}

const files = walk(DOCS);
for (const f of files) check(f);

const total =
  violations.missingFrontmatter.length +
  violations.missingRequired.length +
  violations.unknownEnum.length +
  violations.casingDrift.length +
  violations.malformedYaml.length;

function report() {
  if (total === 0) {
    console.log(`✓ Frontmatter check: ${files.length} docs validated, no issues.`);
    return;
  }

  const show = (label, list, limit = 10) => {
    if (list.length === 0) return;
    console.error(`\n${label} (${list.length}):`);
    for (const item of list.slice(0, limit)) console.error(`  ${item}`);
    if (list.length > limit) console.error(`  … ${list.length - limit} more`);
  };

  console.error(`⚠ Frontmatter check: ${total} issue(s) across ${files.length} docs.`);
  show('✗ Missing frontmatter', violations.missingFrontmatter);
  show('✗ Missing required field', violations.missingRequired);
  show('✗ Unknown enum value', violations.unknownEnum);
  show('✗ Casing drift (auto-fixable)', violations.casingDrift);
  show('✗ Malformed YAML', violations.malformedYaml);
  console.error(
    `\nSchema: scripts/docs-frontmatter-schema.mjs. ` +
      `After ${CUTOFF_DATE}, this check fails the commit.`,
  );
}

report();

if (TODAY >= CUTOFF_DATE && total > 0) process.exit(1);
process.exit(0);
