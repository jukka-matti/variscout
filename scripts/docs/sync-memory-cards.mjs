#!/usr/bin/env node
// sync-memory-cards.mjs — user-memory atom mirror.
//
// Phase 3 task A3 of docs-strategy-2026 substrate decomposition.
//
// Mirrors ~/.claude/projects/-Users-jukka-mattiturtiainen-Projects-VariScout-lite/memory/*.md
// atoms into docs/cards/memory/ with canonical Phase 2 frontmatter
// (purpose: remember, tier: card, topic: [memory, <type>]).
//
// Source atoms use the user-level memory schema; this script translates
// them into the repo-canonical schema. MEMORY.md index is intentionally
// excluded — it is a different shape and readers use the user-level copy.
//
// Sync semantics:
//   - Each source atom → docs/cards/memory/<basename>.md
//   - Orphan cleanup: OUT_DIR files not present in source are deleted.
//   - Idempotent: re-running with the same source produces identical output
//     (modulo last-verified date on the same day).
//
// Handles two source frontmatter layouts:
//   FLAT:   name / description / type / originSessionId at top level
//   NESTED: name / description at top level; type + originSessionId under metadata.*
//
// Atoms with malformed/missing frontmatter are skipped with a stderr warning.
//
// Run:    node scripts/docs/sync-memory-cards.mjs
// Output: docs/cards/memory/<basename>.md  (~181 files)
// Orphan cleanup: any OUT_DIR/*.md not in current source set is removed.

import { readdirSync, readFileSync, writeFileSync, mkdirSync, unlinkSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

import { readDoc } from '../docs-toolbox/lib/frontmatter.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SRC_DIR =
  '/Users/jukka-mattiturtiainen/.claude/projects/-Users-jukka-mattiturtiainen-Projects-VariScout-lite/memory';
const OUT_DIR = join(ROOT, 'docs', 'cards', 'memory');

const today = new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// Git HEAD SHA (short) for verified-against-commit.
// ---------------------------------------------------------------------------

function gitShortSha() {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim();
  } catch {
    return 'unknown';
  }
}

const SHA = gitShortSha();

// ---------------------------------------------------------------------------
// YAML single-quote escaping for the description field.
// Single-quoted YAML scalars escape internal single-quotes by doubling them.
// ---------------------------------------------------------------------------

function yamlSingleQuote(str) {
  return `'${String(str).replace(/'/g, "''")}'`;
}

// ---------------------------------------------------------------------------
// Fallback raw frontmatter extractor.
//
// readDoc delegates to the `yaml` package which rejects some frontmatter
// that uses unquoted special chars (e.g., `§`, em-dash, bare colons in
// descriptions) — returning {} on parse error. This fallback extracts the
// small set of fields we need via a simple line-by-line scan over fmRaw so
// we never lose atoms due to YAML strictness.
//
// Only used when readDoc returns an empty frontmatter object AND fmRaw is
// non-empty (i.e., the file does have frontmatter but the yaml lib choked).
// ---------------------------------------------------------------------------

const SIMPLE_KEY_RE = /^([a-zA-Z_-]+):\s*(.*)/;

function fallbackExtract(fmRaw) {
  if (!fmRaw) return {};
  const result = {};
  let inMetadata = false;
  for (const line of fmRaw.split('\n')) {
    const m = line.match(SIMPLE_KEY_RE);
    if (!m) continue;
    const key = m[1].trim();
    const val = m[2].trim().replace(/^["']|["']$/g, ''); // strip surrounding quotes

    if (key === 'metadata') {
      inMetadata = true;
      continue;
    }
    if (inMetadata) {
      // Nested metadata keys (indented lines don't match SIMPLE_KEY_RE at col 0
      // but the raw regex matches any col-0 key; metadata sub-keys are indented
      // so they won't match at col 0 — handle via a separate check).
      continue;
    }
    result[key] = val;
  }

  // For the nested metadata layout, re-scan for indented sub-keys.
  let inMeta2 = false;
  for (const line of fmRaw.split('\n')) {
    if (/^metadata:/.test(line)) {
      inMeta2 = true;
      continue;
    }
    if (inMeta2 && /^\s+/.test(line)) {
      const m2 = line.trim().match(SIMPLE_KEY_RE);
      if (m2) {
        const key = m2[1].trim();
        const val = m2[2].trim().replace(/^["']|["']$/g, '');
        // Store nested metadata keys under their plain names
        // so extractFields can find them under frontmatter.metadata.*
        if (!result._meta) result._meta = {};
        result._meta[key] = val;
      }
    } else if (inMeta2 && !/^\s/.test(line)) {
      inMeta2 = false;
    }
  }

  // Expose _meta as frontmatter.metadata for extractFields compatibility.
  if (result._meta) {
    result.metadata = result._meta;
    delete result._meta;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Source frontmatter extraction (handles flat + nested layouts).
// ---------------------------------------------------------------------------

function extractFields(frontmatter) {
  const name = frontmatter.name ?? '';
  const description = frontmatter.description ?? '';

  // type: top-level first, then metadata.type
  const type =
    frontmatter.type ??
    (frontmatter.metadata && typeof frontmatter.metadata === 'object'
      ? frontmatter.metadata.type
      : undefined) ??
    null;

  // originSessionId: top-level first, then metadata.originSessionId
  const originSessionId =
    frontmatter.originSessionId ??
    (frontmatter.metadata && typeof frontmatter.metadata === 'object'
      ? frontmatter.metadata.originSessionId
      : undefined) ??
    null;

  return { name, description, type, originSessionId };
}

// ---------------------------------------------------------------------------
// Card content builder.
// ---------------------------------------------------------------------------

function sourceHash(srcPath) {
  // 16-char hex prefix of sha256 over raw source bytes. Stable signal for
  // "did the source atom change?" — used to skip rewriting mirror cards
  // whose source is identical to the last sync (prevents Steward false-
  // positive flood from rebuild re-stamps).
  return createHash('sha256').update(readFileSync(srcPath)).digest('hex').slice(0, 16);
}

function readExistingSourceHash(outPath) {
  // Returns the `source-hash:` value from an existing mirror card's
  // frontmatter, or null if the file is missing / unparseable / lacks the
  // field. Used to short-circuit rewrites when source content matches.
  if (!existsSync(outPath)) return null;
  try {
    const raw = readFileSync(outPath, 'utf8');
    const m = raw.match(/^source-hash:\s*([a-f0-9]+)\s*$/m);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function buildCard(basename, frontmatter, body, srcHash) {
  const { name, description, type, originSessionId } = extractFields(frontmatter);

  const title = name || basename.replace(/\.md$/, '');
  const descEscaped = yamlSingleQuote(description || '');

  // topic array: always starts with 'memory', plus type if present.
  const topicTags = type ? `[memory, ${type}]` : '[memory]';

  // origin-session-id line (only if present in source).
  const hasOrigin =
    originSessionId != null && String(originSessionId).trim() !== '';
  const originLine = hasOrigin
    ? `origin-session-id: ${String(originSessionId).trim()}`
    : null;

  const banner = `> 🤖 **Generated mirror** of \`~/.claude/memory/${basename}\`. Edit there, not here. Card synced by \`scripts/docs/sync-memory-cards.mjs\`; re-run via \`pnpm docs:rebuild\` (Phase 3 A4).`;

  // Body sanitization for the mirrored card:
  // 1. Strip leading newline (readDoc usually strips this, defensive).
  // 2. Strip backticks from inside markdown link URLs — user-memory atoms
  //    written before Phase 3 used `[`text`](`url`)` with backticks INSIDE the
  //    URL portion, which trips dead-link validators. Standard markdown puts
  //    backticks only in the link TEXT, never the URL.
  // Note: relative-path rewrites (e.g., `docs/foo` → `../../foo`) are NOT
  // applied here. `docs/cards/**` is excluded from dead-link source-scan by
  // `scripts/check-dead-links.sh` (cards are a queryable substrate, not a
  // navigational surface).
  const bodyContent = body
    .replace(/^\r?\n/, '')
    .replace(/\]\(`([^)`\s]+)`\)/g, ']($1)');

  // Build frontmatter lines, conditionally including origin-session-id.
  const fmLines = [
    '---',
    `title: ${yamlSingleQuote(title)}`,
    `description: ${descEscaped}`,
    `purpose: remember`,
    `tier: card`,
    `status: active`,
    `date: ${today}`,
    `topic: ${topicTags}`,
    `related: []`,
    `verified-against-commit: ${SHA}`,
    `last-verified: ${today}`,
    `source-hash: ${srcHash}`,
  ];
  if (originLine !== null) {
    fmLines.push(originLine);
  }
  fmLines.push('---');

  return fmLines.join('\n') + '\n\n' + banner + '\n\n' + bodyContent;
}

// ---------------------------------------------------------------------------
// Main sync loop.
// ---------------------------------------------------------------------------

function run() {
  // Ensure output directory exists.
  mkdirSync(OUT_DIR, { recursive: true });

  // List source atoms (*.md, exclude MEMORY.md).
  const srcFiles = readdirSync(SRC_DIR)
    .filter((f) => f.endsWith('.md') && f !== 'MEMORY.md')
    .sort();

  const srcSet = new Set(srcFiles);
  let synced = 0;
  let unchanged = 0;
  let skipped = 0;

  for (const basename of srcFiles) {
    const srcPath = join(SRC_DIR, basename);
    const outPath = join(OUT_DIR, basename);

    // Hash-guard short-circuit: if mirror exists and its `source-hash`
    // matches the current source content hash, the atom hasn't changed
    // since the last sync — skip rewrite entirely. Preserves the existing
    // `verified-against-commit` + `last-verified` stamps, preventing
    // spurious Steward "stale" flags after rebuild commits that don't
    // touch the source atom.
    const srcHash = sourceHash(srcPath);
    const existingHash = readExistingSourceHash(outPath);
    if (existingHash === srcHash) {
      unchanged += 1;
      continue;
    }

    let parsed;
    try {
      parsed = readDoc(srcPath);
    } catch (err) {
      process.stderr.write(`WARN: skipping ${basename} — read error: ${err.message}\n`);
      skipped += 1;
      continue;
    }

    // readDoc silently swallows YAML parse errors (returns {} frontmatter).
    // Fall back to the line-level extractor when the yaml lib choked.
    const frontmatter =
      parsed.frontmatter && Object.keys(parsed.frontmatter).length > 0
        ? parsed.frontmatter
        : fallbackExtract(parsed.fmRaw ?? '');
    const { body } = parsed;

    // Guard: must have at least a name to produce a meaningful card.
    // Check top-level first, then nested metadata (both flat + nested layouts).
    const name =
      (frontmatter.name && String(frontmatter.name).trim()) ||
      (frontmatter.metadata &&
        typeof frontmatter.metadata === 'object' &&
        frontmatter.metadata.name &&
        String(frontmatter.metadata.name).trim()) ||
      null;

    if (!name) {
      process.stderr.write(
        `WARN: skipping ${basename} — no 'name' field in frontmatter\n`,
      );
      skipped += 1;
      continue;
    }

    let content;
    try {
      content = buildCard(basename, frontmatter, body, srcHash);
    } catch (err) {
      process.stderr.write(`WARN: skipping ${basename} — build error: ${err.message}\n`);
      skipped += 1;
      continue;
    }

    writeFileSync(outPath, content, 'utf8');
    synced += 1;
  }

  // Orphan cleanup: remove OUT_DIR files not present in current source set.
  let cleaned = 0;
  if (existsSync(OUT_DIR)) {
    const outFiles = readdirSync(OUT_DIR).filter((f) => f.endsWith('.md'));
    for (const f of outFiles) {
      if (!srcSet.has(f)) {
        unlinkSync(join(OUT_DIR, f));
        cleaned += 1;
      }
    }
  }

  const skipNote = skipped > 0 ? ` (${skipped} skipped with warnings)` : '';
  const unchangedNote = unchanged > 0 ? `, ${unchanged} unchanged (hash match)` : '';
  process.stdout.write(
    `Synced ${synced} memory atoms${unchangedNote} → docs/cards/memory/ (cleaned ${cleaned} orphans)${skipNote}.\n`,
  );
}

run();
