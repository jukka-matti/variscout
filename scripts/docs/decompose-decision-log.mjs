#!/usr/bin/env node
// decompose-decision-log.mjs — one-shot migration parser.
//
// Phase 3 task A1 of docs-strategy-2026 substrate decomposition.
//
// State-machine parses docs/decision-log.md and emits atomic decision cards
// under docs/cards/decisions/dec-<YYYYMMDD>-<slug>.md for §1 (Replayed
// Decisions), §2 (Open Questions), and §3 (Named-Future) entries.
//
// §4 Session Backlog + §5 User Journey Map + the trailing "Open in spec"
// section are NOT decomposed — they are hand-authored blocks preserved by
// the A4 rebuild-views.mjs generator (markers
// <!-- BACKLOG: preserved --> / <!-- JOURNEY-MAP: preserved -->).
//
// This script is read-only against decision-log.md; it does NOT touch the
// aggregate view, investigations.md, memory cards, or run any commits.
//
// Run:    node scripts/docs/decompose-decision-log.mjs
// Output: docs/cards/decisions/dec-YYYYMMDD-<slug>.md  (~25-30 files)
// Idempotent: re-running produces identical output modulo `last-verified`.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

import { EDIT_TYPES } from '../docs-frontmatter-schema.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'docs', 'decision-log.md');
const OUT_DIR = join(ROOT, 'docs', 'cards', 'decisions');

const today = new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// Git HEAD SHA (short) for verified-against-commit. Uses execFileSync with
// an argv array (shell-safe; no template strings, no spawned shell).
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
// Slug + ID helpers.
// ---------------------------------------------------------------------------

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[`*_]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
}

function makeId(date, slug, usedIds) {
  const dateNoHyphens = date.replace(/-/g, '');
  const base = `dec-${dateNoHyphens}-${slug}`;
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
// Topic-tag derivation. Scans body for edit-type vocab + VariScout keywords.
// Keeps the tag list tight (2-4 tags per card per spec guidance).
// ---------------------------------------------------------------------------

const VARISCOUT_KEYWORDS = [
  'wedge',
  'coscout',
  'canvas',
  'capability',
  'investigation',
  'wall',
  'chart',
  'projects',
  'improve',
  'methodology',
  'stats',
  'azure',
  'i18n',
  'frame',
  'sustainment',
  'response-paths',
  'stores',
  'tier-gating',
  'adr',
  'spec',
  'pwa',
  'msa',
  'doc-discipline',
];

function deriveTopicsFromBody(body, sectionTag) {
  const tags = new Set([sectionTag]);

  // Edit-type vocabulary scan (case-sensitive matches against canonical list).
  for (const editType of EDIT_TYPES) {
    if (body.includes(editType)) {
      // 'spec edit' -> 'spec-edit'; 'ADR amendment' -> 'adr-amendment'.
      tags.add(editType.toLowerCase().replace(/\s+/g, '-'));
    }
  }

  // VariScout keyword scan (case-insensitive substring match).
  const lower = body.toLowerCase();
  for (const kw of VARISCOUT_KEYWORDS) {
    if (lower.includes(kw)) tags.add(kw);
  }

  // Trim to ~4 tags: always keep the section tag; prefer edit-type tags
  // (more specific) over keyword tags.
  const arr = Array.from(tags);
  if (arr.length <= 4) return arr;
  const priority = [
    sectionTag,
    ...arr.filter((t) => t.includes('-')), // edit-type tags have hyphens
    ...arr.filter((t) => !t.includes('-') && t !== sectionTag),
  ];
  // De-dupe while preserving order.
  const seen = new Set();
  const result = [];
  for (const t of priority) {
    if (seen.has(t)) continue;
    seen.add(t);
    result.push(t);
    if (result.length >= 4) break;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Frontmatter serializer (minimal — no quoting heuristics for simple values).
// ---------------------------------------------------------------------------

function yamlString(s) {
  // Single-quote and escape any embedded single quotes by doubling them.
  return `'${String(s).replace(/'/g, "''")}'`;
}

function buildFrontmatter({ title, status, date, topics }) {
  const lines = [
    '---',
    `title: ${yamlString(title)}`,
    'purpose: decide',
    'tier: card',
    `status: ${status}`,
    `date: ${date}`,
    `topic: [${topics.map((t) => yamlString(t)).join(', ')}]`,
    `verified-against-commit: ${SHA}`,
    `last-verified: ${today}`,
    'supersedes: []',
    '---',
    '',
  ];
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Card body wrapper.
// ---------------------------------------------------------------------------

function buildBody({ sectionNumber, title, content }) {
  return [
    `> Decision card — extracted from \`docs/decision-log.md\` §${sectionNumber} on ${today}. Aggregate view: [\`decision-log.md\`](../../decision-log.md) (generated).`,
    '',
    `# ${title}`,
    '',
    content.trimEnd(),
    '',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Section finder.
// ---------------------------------------------------------------------------

function findSectionBounds(lines) {
  const bounds = {};
  lines.forEach((line, i) => {
    const m = /^## (\d+)\. /.exec(line);
    if (m) bounds[m[1]] = i;
  });
  // The trailing "Open in spec" section also starts with ## — capture it
  // so §5 doesn't bleed into it.
  lines.forEach((line, i) => {
    if (/^## Open in spec/.test(line)) bounds.openInSpec = i;
  });
  return bounds;
}

// ---------------------------------------------------------------------------
// §1 parser — top-level dated bullets with multi-line bodies + indented
// Amendment paragraphs.
//
// Top-level bullet shape: `- **YYYY-MM-DD — <title>.**` at column 0.
// Body continues until the next top-level dated bullet OR a `## ` section
// header OR a `---` horizontal rule. Indented paragraphs (Amendment blocks,
// nested bullets) belong to the current entry — they start with whitespace.
// ---------------------------------------------------------------------------

// Matches `- **YYYY-MM-DD — <title>.**` AND `- **YYYY-MM-DD — <title>**`
// (trailing period inside the bold is optional — both shapes occur in §1).
const TOP_LEVEL_BULLET_RE = /^- \*\*(\d{4}-\d{2}-\d{2}) — (.+?)\.?\*\*(.*)$/;

function parseReplayedDecisions(lines, start, end) {
  const entries = [];
  let current = null;

  for (let i = start; i < end; i++) {
    const line = lines[i];

    if (/^## /.test(line)) break;
    if (/^---\s*$/.test(line)) {
      // Horizontal rule between sections — flush + stop scanning this section.
      if (current) entries.push(current);
      current = null;
      break;
    }

    const m = TOP_LEVEL_BULLET_RE.exec(line);
    if (m) {
      if (current) entries.push(current);
      const [, date, title, restOfLine] = m;
      // restOfLine begins the body (everything after "- **YYYY-MM-DD — title.**")
      current = {
        date,
        title,
        bodyLines: [restOfLine.replace(/^\s+/, '')],
      };
    } else if (current) {
      current.bodyLines.push(line);
    }
    // Lines before the first bullet (intro paragraph) are skipped.
  }
  if (current) entries.push(current);
  return entries;
}

// ---------------------------------------------------------------------------
// §2 / §3 parser — markdown table rows.
//
// Both sections are tables. We skip the header row + the alignment row, then
// each remaining `|...|` line is one entry. §2 has no date column — we seed
// 2026-04-29 (the canonical seed date per §4). §3 has an explicit "Defer
// date" column.
//
// §2 columns: | Question | Current options | Blocked by | Notes |
// §3 columns: | Item | Source | Defer date | Rationale | Where it'd live |
// ---------------------------------------------------------------------------

function splitTableRow(line) {
  // Strip leading + trailing pipe + split. Inner pipes inside markdown
  // links (`[text](url)`) don't occur in our §2/§3 content; safe to split.
  return line
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((c) => c.trim());
}

function isTableRow(line) {
  return /^\s*\|/.test(line);
}

function isTableAlignmentRow(line) {
  return /^\s*\|\s*-+/.test(line);
}

function parseTableSection(lines, start, end) {
  const rows = [];
  let sawHeader = false;
  let sawAlignment = false;

  for (let i = start; i < end; i++) {
    const line = lines[i];
    if (/^## /.test(line)) break;
    if (/^---\s*$/.test(line)) break;

    if (!isTableRow(line)) continue;

    if (!sawHeader) {
      sawHeader = true;
      continue;
    }
    if (!sawAlignment && isTableAlignmentRow(line)) {
      sawAlignment = true;
      continue;
    }
    if (!sawAlignment) continue;

    const cells = splitTableRow(line);
    rows.push(cells);
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Entry-to-card converters.
// ---------------------------------------------------------------------------

function entryToCardReplayed(entry, usedIds) {
  const slug = slugify(entry.title);
  const id = makeId(entry.date, slug, usedIds);
  const body = entry.bodyLines.join('\n').trim();
  const topics = deriveTopicsFromBody(`${entry.title}\n${body}`, 'decisions');
  const frontmatter = buildFrontmatter({
    title: entry.title,
    status: 'active',
    date: entry.date,
    topics,
  });
  const cardBody = buildBody({
    sectionNumber: 1,
    title: entry.title,
    content: body,
  });
  return { id, content: frontmatter + cardBody };
}

function rowToCardOpenQuestion(cells, usedIds) {
  // §2 columns: Question | Current options | Blocked by | Notes
  const [question, options, blockedBy, notes] = cells;
  if (!question) return null;
  const date = '2026-04-29'; // §2 entries were seeded on this date per §4.
  const slug = slugify(question);
  const id = makeId(date, slug, usedIds);
  const bodyContent = [
    `**Current options:** ${options || '—'}`,
    '',
    `**Blocked by:** ${blockedBy || '—'}`,
    '',
    `**Notes:** ${notes || '—'}`,
  ].join('\n');
  const topics = deriveTopicsFromBody(
    `${question}\n${options}\n${notes}`,
    'open-question',
  );
  const frontmatter = buildFrontmatter({
    title: question,
    status: 'active',
    date,
    topics,
  });
  const cardBody = buildBody({
    sectionNumber: 2,
    title: question,
    content: bodyContent,
  });
  return { id, content: frontmatter + cardBody };
}

function rowToCardNamedFuture(cells, usedIds) {
  // §3 columns: Item | Source | Defer date | Rationale | Where it'd live
  const [item, source, deferDate, rationale, where] = cells;
  if (!item) return null;
  const dateMatch = /(\d{4}-\d{2}-\d{2})/.exec(deferDate || '');
  const date = dateMatch ? dateMatch[1] : '2026-04-29';
  const slug = slugify(item);
  const id = makeId(date, slug, usedIds);
  const bodyContent = [
    `**Source:** ${source || '—'}`,
    '',
    `**Defer date:** ${deferDate || '—'}`,
    '',
    `**Rationale:** ${rationale || '—'}`,
    '',
    `**Where it'd live if built:** ${where || '—'}`,
  ].join('\n');
  const topics = deriveTopicsFromBody(
    `${item}\n${rationale}\n${where}`,
    'named-future',
  );
  const frontmatter = buildFrontmatter({
    title: item,
    status: 'named-future',
    date,
    topics,
  });
  const cardBody = buildBody({
    sectionNumber: 3,
    title: item,
    content: bodyContent,
  });
  return { id, content: frontmatter + cardBody };
}

// ---------------------------------------------------------------------------
// Main.
// ---------------------------------------------------------------------------

function main() {
  if (!existsSync(SRC)) {
    console.error(`decompose-decision-log: missing ${SRC}`);
    process.exit(1);
  }

  const raw = readFileSync(SRC, 'utf8');
  const lines = raw.split('\n');
  const bounds = findSectionBounds(lines);

  if (bounds['1'] === undefined || bounds['2'] === undefined || bounds['3'] === undefined) {
    console.error('decompose-decision-log: could not locate §1/§2/§3 in source');
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });

  const usedIds = new Set();

  // §1: ends at start of §2.
  const replayedEntries = parseReplayedDecisions(lines, bounds['1'] + 1, bounds['2']);

  // §2: ends at start of §3.
  const openQuestionRows = parseTableSection(lines, bounds['2'] + 1, bounds['3']);

  // §3: ends at start of §4 (the only legitimate next-section marker).
  const namedFutureEnd = bounds['4'] ?? bounds.openInSpec ?? lines.length;
  const namedFutureRows = parseTableSection(lines, bounds['3'] + 1, namedFutureEnd);

  const counts = { sec1: 0, sec2: 0, sec3: 0 };

  for (const entry of replayedEntries) {
    const card = entryToCardReplayed(entry, usedIds);
    writeFileSync(join(OUT_DIR, `${card.id}.md`), card.content, 'utf8');
    counts.sec1 += 1;
  }
  for (const row of openQuestionRows) {
    const card = rowToCardOpenQuestion(row, usedIds);
    if (!card) continue;
    writeFileSync(join(OUT_DIR, `${card.id}.md`), card.content, 'utf8');
    counts.sec2 += 1;
  }
  for (const row of namedFutureRows) {
    const card = rowToCardNamedFuture(row, usedIds);
    if (!card) continue;
    writeFileSync(join(OUT_DIR, `${card.id}.md`), card.content, 'utf8');
    counts.sec3 += 1;
  }

  // §4 Session Backlog + §5 User Journey Map + the trailing "Open in spec"
  // section are intentionally NOT decomposed. A4 rebuild-views.mjs preserves
  // them verbatim via <!-- BACKLOG: preserved --> / <!-- JOURNEY-MAP: preserved -->
  // markers in the aggregate template.
  //
  // (The "Open in spec — ambiguities flagged during seeding" trailing section
  // is metadata about the original seeding pass, not durable decisions; we
  // skip it on purpose.)

  console.log(
    `Decomposed ${counts.sec1} entries from §1, ${counts.sec2} from §2, ${counts.sec3} from §3 → ${OUT_DIR.replace(ROOT + '/', '')}`,
  );
}

main();
