#!/usr/bin/env node
// decompose-investigations.mjs — one-shot migration parser.
//
// Phase 3 task A2 of docs-strategy-2026 substrate decomposition.
//
// Parses docs/investigations.md ### <title> blocks and routes each entry:
//
//   Closed (RESOLVED / PROMOTED / WEDGE SCOPE NOTE / LOGGED marker in title)
//     → docs/cards/investigations/inv-<YYYYMMDD>-<slug>.md
//       (purpose: remember, tier: card, status: archived)
//
//   Open (no marker, or unrecognized bracket content)
//     → docs/ephemeral/investigations.md  (live queue, new file)
//
// Root docs/investigations.md is replaced with a stub linking to both surfaces.
//
// Run:    node scripts/docs/decompose-investigations.mjs
// Output:
//   docs/cards/investigations/inv-YYYYMMDD-<slug>.md  (closed entries)
//   docs/ephemeral/investigations.md                  (open entries)
//   docs/investigations.md                            (stub, ~15 lines)
//
// Idempotent: re-running produces stable output (modulo last-verified date).

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process'; // safe: uses execFileSync (argv array), not exec/execSync

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'docs', 'investigations.md');
const OUT_DIR = join(ROOT, 'docs', 'cards', 'investigations');
const EPHEMERAL_OUT = join(ROOT, 'docs', 'ephemeral', 'investigations.md');
const STUB_OUT = join(ROOT, 'docs', 'investigations.md');

const today = new Date().toISOString().slice(0, 10);

// Fallback date used when a status marker has no parseable YYYY-MM-DD.
// Fixed so output is stable (not dependent on current date) for markers like
// plain [WEDGE SCOPE NOTE] that genuinely lack a date.
const DATELESS_FALLBACK = '2026-05-17';

// ---------------------------------------------------------------------------
// Git HEAD SHA (short) for verified-against-commit.
// Uses execFileSync with an argv array (shell-safe; no template strings).
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
// Slug + filename helpers.
// ---------------------------------------------------------------------------

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[`*_[\]]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
}

/**
 * Produces a collision-safe filename stem like inv-<YYYYMMDD>-<slug>.
 * usedIds is a Set<string> that is mutated in place.
 */
function makeId(date, slug, usedIds) {
  const dateNoHyphens = date.replace(/-/g, '');
  const base = `inv-${dateNoHyphens}-${slug}`;
  if (!usedIds.has(base)) {
    usedIds.add(base);
    return base;
  }
  let n = 2;
  while (usedIds.has(`${base}-${n}`)) n += 1;
  const id = `${base}-${n}`;
  usedIds.add(id);
  return id;
}

// ---------------------------------------------------------------------------
// Status marker detection.
//
// Recognizes the following as "closed" (entry → card):
//   [RESOLVED YYYY-MM-DD]                   closureType = 'resolved'
//   [RESOLVED YYYY-MM-DD — see ...]         closureType = 'resolved'
//   [PROMOTED YYYY-MM-DD]                   closureType = 'promoted'
//   [WEDGE SCOPE NOTE ...]                  closureType = 'wedge-scope-note'
//   [LOGGED YYYY-MM-DD]                     closureType = 'logged'
//
// Anything else (no marker, unknown bracket) → open entry.
// ---------------------------------------------------------------------------

const CLOSED_PATTERN = /\[(RESOLVED|PROMOTED|WEDGE SCOPE NOTE|LOGGED)([^\]]*)\]/i;

/**
 * @returns {{ isClosed: boolean, closureType: string, closureDate: string, cleanTitle: string }}
 */
function parseStatusMarker(rawTitle) {
  const m = CLOSED_PATTERN.exec(rawTitle);
  if (!m) {
    return { isClosed: false, closureType: '', closureDate: '', cleanTitle: rawTitle.trim() };
  }

  const keyword = m[1].toUpperCase();
  const rest = m[2]; // everything after the keyword inside the brackets

  let closureType;
  if (keyword === 'RESOLVED') closureType = 'resolved';
  else if (keyword === 'PROMOTED') closureType = 'promoted';
  else if (keyword === 'WEDGE SCOPE NOTE') closureType = 'wedge-scope-note';
  else if (keyword === 'LOGGED') closureType = 'logged';
  else closureType = keyword.toLowerCase();

  // Extract YYYY-MM-DD from rest, if present.
  const dateMatch = /(\d{4}-\d{2}-\d{2})/.exec(rest);
  const closureDate = dateMatch ? dateMatch[1] : DATELESS_FALLBACK;

  // Strip the entire [...] marker from the title to get the clean title.
  const cleanTitle = rawTitle
    .replace(CLOSED_PATTERN, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return { isClosed: true, closureType, closureDate, cleanTitle };
}

// ---------------------------------------------------------------------------
// Surfaced-by field parser — lifts PR number and date from the body.
// ---------------------------------------------------------------------------

/**
 * Scans entry body lines for a **Surfaced by:** line and extracts:
 *   surfacedByPr  — PR number string if cited (e.g. '166'), else null
 *   surfacedDate  — YYYY-MM-DD string if a date is cited, else null
 */
function parseSurfacedBy(bodyLines) {
  for (const line of bodyLines) {
    if (/\*\*Surfaced by:\*\*/i.test(line) || /^Surfaced by:/i.test(line)) {
      const prMatch = /PR #?(\d+)/i.exec(line);
      const dateMatch = /(\d{4}-\d{2}-\d{2})/.exec(line);
      return {
        surfacedByPr: prMatch ? prMatch[1] : null,
        surfacedDate: dateMatch ? dateMatch[1] : null,
      };
    }
  }
  return { surfacedByPr: null, surfacedDate: null };
}

// ---------------------------------------------------------------------------
// YAML helpers.
// ---------------------------------------------------------------------------

function yamlString(s) {
  return `'${String(s).replace(/'/g, "''")}'`;
}

// ---------------------------------------------------------------------------
// Card file builder.
// ---------------------------------------------------------------------------

function buildCardContent({ cleanTitle, closureType, closureDate, surfacedByPr, surfacedDate, body }) {
  const topicArr = ['investigation', closureType];
  const topicYaml = `[${topicArr.map(yamlString).join(', ')}]`;

  const frontmatterLines = [
    '---',
    `title: ${yamlString(cleanTitle)}`,
    'purpose: remember',
    'tier: card',
    'status: archived',
    `date: ${closureDate}`,
    `topic: ${topicYaml}`,
  ];

  if (surfacedByPr) {
    frontmatterLines.push(`surfaced-by-pr: ${surfacedByPr}`);
  }
  if (surfacedDate) {
    frontmatterLines.push(`surfaced-date: ${surfacedDate}`);
  }

  frontmatterLines.push(
    `verified-against-commit: ${SHA}`,
    `last-verified: ${today}`,
    '---',
    '',
  );

  const banner = `> **Investigation card** — extracted from \`docs/investigations.md\` on ${today} (closed: ${closureType} ${closureDate}). Live queue: [\`ephemeral/investigations.md\`](../../ephemeral/investigations.md). Card index: [\`cards/investigations/\`](../investigations/).`;

  return [
    frontmatterLines.join('\n'),
    banner,
    '',
    `# ${cleanTitle}`,
    '',
    body.trimEnd(),
    '',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Ephemeral file builder.
// ---------------------------------------------------------------------------

function buildEphemeralContent(openEntries) {
  const header = [
    '---',
    'tier: ephemeral',
    'purpose: decide',
    "title: 'VariScout — Active Investigations (open)'",
    'audience: human',
    'status: active',
    `last-reviewed: ${today}`,
    'related:',
    '  - 2026-05-16-docs-strategy-design',
    '---',
    '',
    '# VariScout — Active Investigations (open)',
    '',
    'Code-level smells, UX follow-ups, and architectural questions surfaced during work that are **not yet decisions**. Closed investigations are archived as cards under [`docs/cards/investigations/`](../cards/investigations/).',
    '',
    "**When to add an entry:** while shipping fix A you notice problem B that's adjacent / related / surfaced by the same change. B isn't blocking A and you don't want to inflate scope, but it's worth not losing.",
    '',
    '**When to remove an entry:**',
    '',
    "- It became a decision → move to `decision-log.md` (Open Questions or Replayed Decisions) OR card under `docs/cards/decisions/`.",
    "- It became a spec → link to `docs/superpowers/specs/...` and add `[PROMOTED YYYY-MM-DD]` marker.",
    "- It was fixed → add `[RESOLVED YYYY-MM-DD]` marker (next docs:rebuild moves it to cards).",
    "- It was tried and rejected → move to `decision-log.md` Replayed Decisions with rationale.",
    '',
    '---',
    '',
    '## Active investigations',
    '',
  ].join('\n');

  const entriesText = openEntries
    .map((e) => `### ${e.rawTitle}\n\n${e.body.trimEnd()}\n`)
    .join('\n---\n\n');

  return header + entriesText + '\n';
}

// ---------------------------------------------------------------------------
// Root stub builder.
// ---------------------------------------------------------------------------

function buildStubContent() {
  return [
    '---',
    'tier: ephemeral',
    'purpose: agent-context',
    "title: 'VariScout Investigations — Index Stub'",
    'audience: both',
    'status: active',
    `last-reviewed: ${today}`,
    '---',
    '',
    '# VariScout Investigations',
    '',
    '**This file is a stub.** Investigations split into two surfaces in Phase 3 of docs-strategy-2026:',
    '',
    '- **Open / active**: [`docs/ephemeral/investigations.md`](ephemeral/investigations.md) — the live queue.',
    '- **Closed / archived**: [`docs/cards/investigations/`](cards/investigations/) — atomic cards, one per closed investigation.',
    '',
    'Edit the open list directly in `ephemeral/investigations.md`. When an entry closes, add a `[RESOLVED YYYY-MM-DD]` (or `[PROMOTED ...]` / `[WEDGE SCOPE NOTE ...]`) marker to its `###` title — next `pnpm docs:rebuild` (Phase 3 A4) moves it to a card.',
    '',
    'For background: [docs-strategy-2026 design](superpowers/specs/2026-05-16-docs-strategy-design.md).',
    '',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Parser — reads the raw source and splits into ### entries.
//
// Strategy:
//   1. Skip the YAML frontmatter block (first --- ... --- delimiters).
//   2. Locate the "## Active investigations" section header.
//   3. From there, each "### " line starts a new entry; body continues
//      until the next "### " or end of file.
//   4. Separator "---" lines between entries are preserved in bodyLines
//      but stripped at edges by cleanBody().
// ---------------------------------------------------------------------------

function parseEntries(raw) {
  const lines = raw.split('\n');
  const entries = [];

  // 1. Skip frontmatter.
  let i = 0;
  if (lines[0] === '---') {
    i = 1;
    while (i < lines.length && lines[i] !== '---') i += 1;
    i += 1; // step past closing ---
  }

  // 2. Find "## Active investigations".
  let activeStart = -1;
  while (i < lines.length) {
    if (/^## Active investigations/.test(lines[i])) {
      activeStart = i;
      break;
    }
    i += 1;
  }

  if (activeStart === -1) {
    return entries;
  }

  i = activeStart + 1;

  // 3. Collect ### entries.
  let current = null;

  while (i < lines.length) {
    const line = lines[i];

    if (/^### /.test(line)) {
      if (current) entries.push(current);
      const rawTitle = line.slice(4).trim(); // strip "### " prefix
      current = { rawTitle, bodyLines: [] };
    } else if (current) {
      current.bodyLines.push(line);
    }
    i += 1;
  }

  if (current) entries.push(current);

  return entries;
}

/**
 * Converts bodyLines[] to a clean body string.
 * Strips leading and trailing blank/separator lines (--- dividers between
 * entries in the original file don't belong inside card bodies).
 */
function cleanBody(bodyLines) {
  let start = 0;
  while (start < bodyLines.length && /^(\s*|---)$/.test(bodyLines[start])) start += 1;

  let end = bodyLines.length - 1;
  while (end >= start && /^(\s*|---)$/.test(bodyLines[end])) end -= 1;

  return bodyLines.slice(start, end + 1).join('\n');
}

// ---------------------------------------------------------------------------
// Main.
// ---------------------------------------------------------------------------

function main() {
  if (!existsSync(SRC)) {
    console.error(`decompose-investigations: missing ${SRC}`);
    process.exit(1);
  }

  const raw = readFileSync(SRC, 'utf8');
  const entries = parseEntries(raw);

  if (entries.length === 0) {
    console.error('decompose-investigations: no ### entries found in source');
    process.exit(1);
  }

  // Ensure output directories exist.
  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(join(ROOT, 'docs', 'ephemeral'), { recursive: true }); // should already exist (Phase 1)

  const usedIds = new Set();
  const openEntries = [];
  let closedCount = 0;

  for (const entry of entries) {
    const { isClosed, closureType, closureDate, cleanTitle } = parseStatusMarker(entry.rawTitle);
    const body = cleanBody(entry.bodyLines);

    if (isClosed) {
      const { surfacedByPr, surfacedDate } = parseSurfacedBy(entry.bodyLines);
      const slug = slugify(cleanTitle);
      const id = makeId(closureDate, slug, usedIds);
      const content = buildCardContent({
        cleanTitle,
        closureType,
        closureDate,
        surfacedByPr,
        surfacedDate,
        body,
      });
      writeFileSync(join(OUT_DIR, `${id}.md`), content, 'utf8');
      closedCount += 1;
    } else {
      openEntries.push({ rawTitle: entry.rawTitle, body });
    }
  }

  // Write ephemeral file (open entries).
  writeFileSync(EPHEMERAL_OUT, buildEphemeralContent(openEntries), 'utf8');

  // Replace root docs/investigations.md with a stub.
  writeFileSync(STUB_OUT, buildStubContent(), 'utf8');

  console.log(
    `Investigations: ${closedCount} closed → cards, ${openEntries.length} open → ephemeral/investigations.md, root stub written.`,
  );
}

main();
