#!/usr/bin/env node
// check-doc-frontmatter.mjs — validate docs/** frontmatter against the schema.
// ADR-083 (2026-05-16): transitional alias maps for STATUS + AUDIENCE.
// Old STATUS/AUDIENCE values warn; unknown PURPOSE/TIER hard-fail when present.
// --report mode includes count of docs missing purpose + tier fields.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { parse as parseYaml } from 'yaml';
import {
  schema,
  classify,
  STATUS_ALIAS_MAP,
  AUDIENCE_ALIAS_MAP,
  PURPOSE,
  TIER,
} from './docs-frontmatter-schema.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DOCS = join(ROOT, 'docs');
const CUTOFF_DATE = process.env.CUTOFF_DATE ?? '2026-05-15';
const TODAY = new Date().toISOString().slice(0, 10);
const REPORT_MODE = process.argv.includes('--report');

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
  // Warnings (old-value aliases) — don't fail the build
  aliasedStatus: [],
  aliasedAudience: [],
  // Report-only stats
  missingPurpose: [],
  missingTier: [],
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

  // Required fields
  for (const key of rules.required) {
    if (fm[key] == null || fm[key] === '') {
      violations.missingRequired.push(`${rel}: missing '${key}' [${kind}]`);
    }
  }

  // Enum validation with alias-map awareness
  for (const [field, allowed] of Object.entries(rules.enums ?? {})) {
    const values = asArray(fm[field]);
    for (const v of values) {
      if (v == null || v === '') continue;
      const str = String(v);

      if (allowed.includes(str)) continue;

      const lower = str.toLowerCase();

      // Check casing drift against canonical values
      if (allowed.includes(lower)) {
        violations.casingDrift.push(`${rel}: ${field}='${str}' should be '${lower}'`);
        continue;
      }

      // Check alias maps for STATUS and AUDIENCE (warn, not fail)
      if (field === 'status' && STATUS_ALIAS_MAP[lower] != null) {
        violations.aliasedStatus.push(
          `${rel}: status='${str}' → aliased to '${STATUS_ALIAS_MAP[lower]}' (transitional)`,
        );
        continue;
      }
      if (field === 'audience' && AUDIENCE_ALIAS_MAP[lower] != null) {
        violations.aliasedAudience.push(
          `${rel}: audience='${str}' → aliased to '${AUDIENCE_ALIAS_MAP[lower]}' (transitional)`,
        );
        continue;
      }

      // PURPOSE and TIER hard-fail when present but unknown
      if (field === 'purpose' && !PURPOSE.includes(str)) {
        violations.unknownEnum.push(`${rel}: purpose='${str}' not in allowed set ${PURPOSE.join('|')}`);
        continue;
      }
      if (field === 'tier' && !TIER.includes(str)) {
        violations.unknownEnum.push(`${rel}: tier='${str}' not in allowed set ${TIER.join('|')}`);
        continue;
      }

      // CATEGORY is no longer in the schema; skip silently (old docs may have it)
      if (field === 'category') continue;

      violations.unknownEnum.push(`${rel}: ${field}='${str}' not in allowed set`);
    }
  }

  // Report-only: track missing purpose + tier
  if (fm['purpose'] == null || fm['purpose'] === '') {
    violations.missingPurpose.push(rel);
  }
  if (fm['tier'] == null || fm['tier'] === '') {
    violations.missingTier.push(rel);
  }
}

const files = walk(DOCS);
for (const f of files) check(f);

const hardViolationTotal =
  violations.missingFrontmatter.length +
  violations.missingRequired.length +
  violations.unknownEnum.length +
  violations.casingDrift.length +
  violations.malformedYaml.length;

const warningTotal = violations.aliasedStatus.length + violations.aliasedAudience.length;

function report() {
  if (REPORT_MODE) {
    console.log(`\n=== Frontmatter Report: ${files.length} docs ===`);
    console.log(`  Missing purpose: ${violations.missingPurpose.length} docs`);
    console.log(`  Missing tier:    ${violations.missingTier.length} docs`);
    console.log(`  Aliased status:  ${violations.aliasedStatus.length} (transitional; run docs-frontmatter-fix to resolve)`);
    console.log(`  Aliased audience:${violations.aliasedAudience.length} (transitional; run docs-frontmatter-fix to resolve)`);
    console.log(`  Hard violations: ${hardViolationTotal}`);
    console.log('');
  }

  if (hardViolationTotal === 0 && warningTotal === 0) {
    console.log(`✓ Frontmatter check: ${files.length} docs validated, no issues.`);
    return;
  }

  const show = (label, list, limit = 10, isWarn = false) => {
    if (list.length === 0) return;
    const prefix = isWarn ? '⚠' : '✗';
    console.error(`\n${prefix} ${label} (${list.length}):`);
    for (const item of list.slice(0, limit)) console.error(`  ${item}`);
    if (list.length > limit) console.error(`  … ${list.length - limit} more`);
  };

  if (hardViolationTotal > 0) {
    console.error(`⚠ Frontmatter check: ${hardViolationTotal} hard issue(s) + ${warningTotal} alias warning(s) across ${files.length} docs.`);
    show('Missing frontmatter', violations.missingFrontmatter);
    show('Missing required field', violations.missingRequired);
    show('Unknown enum value (hard-fail)', violations.unknownEnum);
    show('Casing drift (auto-fixable)', violations.casingDrift);
    show('Malformed YAML', violations.malformedYaml);
  }

  show('Aliased status (transitional — run docs-frontmatter-fix.mjs)', violations.aliasedStatus, 5, true);
  show('Aliased audience (transitional — run docs-frontmatter-fix.mjs)', violations.aliasedAudience, 5, true);

  if (hardViolationTotal > 0) {
    console.error(
      `\nSchema: scripts/docs-frontmatter-schema.mjs. ` +
        `After ${CUTOFF_DATE}, this check fails the commit.`,
    );
  }

  if (warningTotal > 0 && hardViolationTotal === 0) {
    console.log(`✓ Frontmatter check: ${files.length} docs validated, ${warningTotal} transitional alias warning(s). Run docs-frontmatter-fix.mjs to resolve.`);
  }
}

report();

if (TODAY >= CUTOFF_DATE && hardViolationTotal > 0) process.exit(1);
process.exit(0);
