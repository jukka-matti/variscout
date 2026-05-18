#!/usr/bin/env node
// check-doc-frontmatter.mjs — validate docs/** frontmatter against the schema.
// ADR-083 (2026-05-16): transitional alias maps for STATUS + AUDIENCE.
// Old STATUS/AUDIENCE values warn; unknown PURPOSE/TIER hard-fail when present.
// --report mode includes count of docs missing purpose + tier fields.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { parse as parseYaml } from 'yaml';
import {
  schema,
  classify,
  STATUS_ALIAS_MAP,
  AUDIENCE_ALIAS_MAP,
  PURPOSE,
  TIER,
  ANTI_PATTERN_FILENAME_RE,
  ANTI_PATTERN_SCOPE_PREFIX,
  SUPERSEDED_BANNER_RE,
  ARCHIVED_BANNER_RE,
  DELIVERED_BANNER_RE,
  BANNER_BODY_LINES,
} from './docs-frontmatter-schema.mjs';
import { parseEntry, isEntryHeaderLine } from './docs-toolbox/lib/edit-types.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DOCS = join(ROOT, 'docs');
const CUTOFF_DATE = process.env.CUTOFF_DATE ?? '2026-05-15';
const TODAY = new Date().toISOString().slice(0, 10);
const REPORT_MODE = process.argv.includes('--report');
const DIFF_MODE = process.argv.includes('--diff');
const DIFF_BASE = process.env.DIFF_BASE ?? 'origin/main';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// === Allowlist loader ===
// .docs-discipline-allowlist at repo root. One path per line; # comments skipped.
// Listed paths are exempt from the filename + banner checks.

function loadAllowlist() {
  const file = join(ROOT, '.docs-discipline-allowlist');
  try {
    const src = readFileSync(file, 'utf8');
    const set = new Set();
    for (const raw of src.split('\n')) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      set.add(line);
    }
    return set;
  } catch {
    return new Set();
  }
}

const ALLOWLIST = loadAllowlist();

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

function extractBodyHead(src, lineCount) {
  // Skip frontmatter block; return first lineCount lines of body, joined.
  let body = src;
  if (src.startsWith('---\n') || src.startsWith('---\r\n')) {
    const end = src.indexOf('\n---', 4);
    if (end >= 0) body = src.slice(end + 4); // past trailing '\n'
  }
  return body.split('\n').slice(0, lineCount).join('\n');
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
  antiPatternFilename: [],
  missingStatusBanner: [],
  missingSupersedesBanner: [],
  // Warnings (old-value aliases) — don't fail the build
  aliasedStatus: [],
  aliasedAudience: [],
  // SDD HARD-FAILs (flipped from WARN in M5, 2026-05-18) — block the build
  errorL3MissingKind: [],
  errorSpecMissingImplements: [],
  errorBrokenImplementsPath: [],
  errorBrokenServesPath: [],
  // SDD WARNs (heuristic; HARD-FAIL once L3 bodies are filled in M3+ next-edit)
  warnL3MissingIntentDiagram: [],
  // Diff-mode WARNs (--diff only) — don't fail the build
  diffWarnDecisionLogOldLine: [],
  diffWarnSpecAmendmentHeading: [],
  diffWarnNonCanonicalEditType: [],
  diffWarnDeliveredNoBanner: [],
  // Report-only stats
  missingPurpose: [],
  missingTier: [],
};

function check(file) {
  const rel = relative(ROOT, file);
  const src = readFileSync(file, 'utf8');

  // Anti-pattern filename HARD-FAIL (skip if allowlisted). Runs first because
  // it doesn't depend on frontmatter being present.
  if (
    rel.startsWith(ANTI_PATTERN_SCOPE_PREFIX) &&
    ANTI_PATTERN_FILENAME_RE.test(rel) &&
    !ALLOWLIST.has(rel)
  ) {
    violations.antiPatternFilename.push(
      `${rel}: anti-pattern filename. Edit the canonical spec in place + add a decision-log entry. See docs/agent-context/doc-discipline.md §Anti-patterns. If genuinely intentional (rare), add the path to .docs-discipline-allowlist with rationale.`,
    );
    // Don't return — still validate the rest so the implementer sees all issues at once.
  }

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

  // Banner checks (skip if allowlisted).
  if (!ALLOWLIST.has(rel)) {
    const bodyHead = extractBodyHead(src, BANNER_BODY_LINES);
    if (fm.status === 'superseded' && !SUPERSEDED_BANNER_RE.test(bodyHead)) {
      violations.missingStatusBanner.push(
        `${rel}: status=superseded but no '> SUPERSEDED ...' banner in first ${BANNER_BODY_LINES} body lines. See docs/agent-context/doc-discipline.md §Reader-first banners.`,
      );
    }
    if (fm.status === 'archived' && !ARCHIVED_BANNER_RE.test(bodyHead)) {
      violations.missingStatusBanner.push(
        `${rel}: status=archived but no '> ARCHIVED ...' banner in first ${BANNER_BODY_LINES} body lines. See docs/agent-context/doc-discipline.md §Reader-first banners.`,
      );
    }
    const supersedesList = asArray(fm.supersedes).filter(Boolean);
    if (supersedesList.length > 0) {
      const head = bodyHead.toLowerCase();
      // Match supersede, supersedes, superseded — no trailing \b so partial word forms match.
      const mentionsSupersedeWord = /\bsupersede|\breplaces\b|\bsuccessor of\b/.test(head);
      const mentionsPredecessor = supersedesList.some((id) =>
        head.includes(String(id).toLowerCase()),
      );
      if (!mentionsSupersedeWord && !mentionsPredecessor) {
        violations.missingSupersedesBanner.push(
          `${rel}: supersedes:[${supersedesList.join(', ')}] set but banner doesn't mention what's superseded. See docs/agent-context/doc-discipline.md §Reader-first banners.`,
        );
      }
    }

    // Design-spec WARN: delivered-by frontmatter set but no ✅ Delivered banner.
    // This is a per-file check (not diff-mode) so it fires on every run.
    const isDesignSpec =
      rel.startsWith('docs/superpowers/specs/') ||
      rel === 'docs/01-vision/coscout-ax-design.md';
    if (isDesignSpec && fm['delivered-by']) {
      if (!DELIVERED_BANNER_RE.test(bodyHead)) {
        violations.diffWarnDeliveredNoBanner.push(
          `${rel}: delivered-by=${fm['delivered-by']} set but no '> ... Delivered ...' banner in first ${BANNER_BODY_LINES} body lines. See docs/agent-context/doc-discipline.md §Banner templates.`,
        );
      }
    }
  }

  // === SDD HARD-FAIL rules (flipped from WARN in M5, 2026-05-18) ===
  // 1. L3 docs without `kind:` — design says kind is mandatory at L3.
  // 2. Active design specs without `implements:` — propose-apply-archive contract.
  // 3. implements: paths that don't exist on disk — broken cross-refs.
  // Plus 1 heuristic WARN: L3 (ui|workflow|engine) without intent diagram.

  if (fm.layer === 'L3' && (fm.kind == null || fm.kind === '')) {
    violations.errorL3MissingKind.push(
      `${rel}: layer=L3 but no kind: (ui|workflow|engine|infrastructure). See docs/superpowers/specs/2026-05-18-spec-driven-development-design.md §L3 Features.`,
    );
  }

  const isActiveDesignSpec =
    rel.startsWith('docs/superpowers/specs/') && !rel.endsWith('/index.md');
  const implementsList = asArray(fm.implements).filter(Boolean);
  if (isActiveDesignSpec) {
    if (implementsList.length === 0) {
      violations.errorSpecMissingImplements.push(
        `${rel}: design spec missing implements: (non-empty array of L1/L2/L3 paths). See docs/superpowers/specs/2026-05-18-spec-driven-development-design.md §Design-Spec Lifecycle.`,
      );
    }
  }

  // implements: path-exists check (applies to ANY doc with implements:, not just specs).
  for (const target of implementsList) {
    const targetPath = join(ROOT, String(target));
    if (!existsSync(targetPath)) {
      violations.errorBrokenImplementsPath.push(
        `${rel}: implements: '${target}' does not exist on disk.`,
      );
    }
  }

  // serves: path-exists check (mirrors implements; applies to L3 + L4 + design specs).
  const servesList = asArray(fm.serves).filter(Boolean);
  for (const target of servesList) {
    const targetPath = join(ROOT, String(target));
    if (!existsSync(targetPath)) {
      violations.errorBrokenServesPath.push(
        `${rel}: serves: '${target}' does not exist on disk.`,
      );
    }
  }

  // L3 intent-diagram heuristic (WARN — many stubs lack diagrams pending next-edit work).
  // Skip kind: infrastructure (those carry "no surface" disclosure per the spec).
  const intentBearingKinds = new Set(['ui', 'workflow', 'engine']);
  if (
    fm.layer === 'L3' &&
    intentBearingKinds.has(fm.kind) &&
    fm.status !== 'archived' &&
    fm.status !== 'named-future'
  ) {
    // Heuristic: at least one ```mermaid block OR an ASCII-art block with │ or ─.
    const hasMermaid = /```mermaid\b/.test(src);
    const hasAsciiArt = /```[a-z]*\n[\s\S]*?[│─][\s\S]*?```/m.test(src);
    if (!hasMermaid && !hasAsciiArt) {
      violations.warnL3MissingIntentDiagram.push(
        `${rel}: L3 (kind=${fm.kind}) missing intent diagram (no \`\`\`mermaid block, no ASCII-art block). See spec §L3 Features.`,
      );
    }
  }
}

const files = walk(DOCS);
for (const f of files) check(f);

// === Diff-mode checks ===
// Runs only when --diff is passed. Uses execFileSync (not shell-based execution)
// to avoid injection. DIFF_BASE is passed as a single argv element.

function runDiffChecks() {
  let raw;
  try {
    raw = execFileSync('git', ['diff', '-U0', DIFF_BASE], { encoding: 'utf8' });
  } catch (err) {
    console.error(
      `⚠ --diff mode: could not diff against ${DIFF_BASE} (${err.message}). Skipping diff checks.`,
    );
    return;
  }
  parseDiff(raw);
}

function parseDiff(diffText) {
  const today = new Date();
  let currentFile = null;
  for (const line of diffText.split('\n')) {
    const fileMatch = /^diff --git a\/(.+) b\/.+$/.exec(line);
    if (fileMatch) {
      currentFile = fileMatch[1];
      continue;
    }
    if (!currentFile) continue;

    // Decision-log: WARN on removed (-) lines whose entry date is >7 days old.
    if (currentFile === 'docs/decision-log.md' && line.startsWith('-') && !line.startsWith('---')) {
      const removed = line.slice(1);
      const parsed = parseEntry(removed);
      if (parsed) {
        const entryDate = new Date(parsed.date + 'T00:00:00Z');
        if (today - entryDate > SEVEN_DAYS_MS) {
          violations.diffWarnDecisionLogOldLine.push(
            `${currentFile}: editing decision-log entry from ${parsed.date} ("${parsed.title}") — entries >7 days old are append-only by convention. New supersession entry preferred. See docs/agent-context/doc-discipline.md §Decision-log as temporal index.`,
          );
        }
      }
    }

    // Decision-log: WARN on added (+) entries missing canonical edit-type.
    if (
      currentFile === 'docs/decision-log.md' &&
      line.startsWith('+') &&
      !line.startsWith('+++')
    ) {
      const added = line.slice(1);
      if (isEntryHeaderLine(added)) {
        const parsed = parseEntry(added);
        if (parsed && parsed.editType === null) {
          violations.diffWarnNonCanonicalEditType.push(
            `${currentFile}: new entry "${parsed.title}" missing canonical edit-type vocabulary. Use one of: spec edit | ADR amendment | new ADR | supersession | archived | new spec.`,
          );
        }
      }
    }

    // Design specs: WARN on added "## Amendment" headings (allowed for ADRs only).
    if (
      line.startsWith('+## Amendment') &&
      (currentFile.startsWith('docs/superpowers/specs/') ||
        currentFile === 'docs/01-vision/coscout-ax-design.md')
    ) {
      violations.diffWarnSpecAmendmentHeading.push(
        `${currentFile}: added '## Amendment' heading in a design spec. Design specs edit in place; amendment blocks are ADR-only. See docs/agent-context/doc-discipline.md §Edit-in-place mechanics.`,
      );
    }
  }
}

if (DIFF_MODE) runDiffChecks();


const hardViolationTotal =
  violations.missingFrontmatter.length +
  violations.missingRequired.length +
  violations.unknownEnum.length +
  violations.casingDrift.length +
  violations.malformedYaml.length +
  violations.antiPatternFilename.length +
  violations.missingStatusBanner.length +
  violations.missingSupersedesBanner.length +
  violations.errorL3MissingKind.length +
  violations.errorSpecMissingImplements.length +
  violations.errorBrokenImplementsPath.length +
  violations.errorBrokenServesPath.length;

const warningTotal =
  violations.aliasedStatus.length +
  violations.aliasedAudience.length +
  violations.diffWarnDecisionLogOldLine.length +
  violations.diffWarnSpecAmendmentHeading.length +
  violations.diffWarnNonCanonicalEditType.length +
  violations.diffWarnDeliveredNoBanner.length +
  violations.warnL3MissingIntentDiagram.length;

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
    show('Anti-pattern filename (edit canonical spec in place)', violations.antiPatternFilename);
    show('Missing superseded/archived banner', violations.missingStatusBanner);
    show('Missing supersedes banner', violations.missingSupersedesBanner);
  }

  show('Aliased status (transitional — run docs-frontmatter-fix.mjs)', violations.aliasedStatus, 5, true);
  show('Aliased audience (transitional — run docs-frontmatter-fix.mjs)', violations.aliasedAudience, 5, true);
  show('SDD — L3 missing kind: (HARD-FAIL)', violations.errorL3MissingKind, 10, false);
  show('SDD — design spec missing implements: (HARD-FAIL)', violations.errorSpecMissingImplements, 10, false);
  show('SDD — implements: path does not exist (HARD-FAIL)', violations.errorBrokenImplementsPath, 10, false);
  show('SDD — serves: path does not exist (HARD-FAIL)', violations.errorBrokenServesPath, 10, false);
  show('SDD — L3 (ui/workflow/engine) missing intent diagram (WARN — next-edit work)', violations.warnL3MissingIntentDiagram, 5, true);
  show('Decision-log: edit on entry >7 days old (use new supersession entry)', violations.diffWarnDecisionLogOldLine, 5, true);
  show('Decision-log: non-canonical edit-type vocabulary', violations.diffWarnNonCanonicalEditType, 5, true);
  show('Design spec: ## Amendment heading added (ADR-only pattern)', violations.diffWarnSpecAmendmentHeading, 5, true);
  show('Design spec: delivered-by set without Delivered banner', violations.diffWarnDeliveredNoBanner, 5, true);

  if (hardViolationTotal > 0) {
    console.error(
      `\nSchema: scripts/docs-frontmatter-schema.mjs. ` +
        `After ${CUTOFF_DATE}, this check fails the commit.`,
    );
  }

  if (warningTotal > 0 && hardViolationTotal === 0) {
    const aliasCount = violations.aliasedStatus.length + violations.aliasedAudience.length;
    const diffWarnCount = warningTotal - aliasCount;
    const parts = [];
    if (aliasCount > 0) parts.push(`${aliasCount} transitional alias warning(s)`);
    if (diffWarnCount > 0) parts.push(`${diffWarnCount} diff warning(s)`);
    console.log(`✓ Frontmatter check: ${files.length} docs validated, ${parts.join(', ')}. Run docs-frontmatter-fix.mjs to resolve aliases.`);
  }
}

report();

if (TODAY >= CUTOFF_DATE && hardViolationTotal > 0) process.exit(1);
process.exit(0);
