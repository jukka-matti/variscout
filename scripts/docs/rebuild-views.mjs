#!/usr/bin/env node
// rebuild-views.mjs - aggregate-view generator.
//
// Phase 3 task A4 of docs-strategy-2026 substrate decomposition.
//
// Regenerates docs/decision-log.md from the decision-card substrate in
// docs/cards/decisions/, preserving the existing header block, the
// 1/2/3 section intros, and the hand-authored 4 Session Backlog +
// 5 User Journey Map blocks verbatim. After writing the aggregate,
// invokes sync-memory-cards.mjs to refresh the memory mirror under
// docs/cards/memory/.
//
// Cards are produced by:
//   - scripts/docs/decompose-decision-log.mjs  (one-shot; A1)
//
// This script is byte-stable idempotent: running it twice with the same
// card set + same source decision-log.md produces identical output.
//
// Preservation strategy for 4 / 5:
//   1. Look for HTML comment markers BACKLOG / JOURNEY-MAP - extract
//      content between open/close pairs.
//   2. Fall back to section-header parsing on the first run when markers
//      don't exist yet.
//   3. Always wrap the preserved content with markers in the output so
//      the next run uses the cheap path.
//
// Run:    node scripts/docs/rebuild-views.mjs  (or: pnpm docs:rebuild)
// Output: docs/decision-log.md (overwritten) + docs/cards/memory/ refreshed.

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

import { readDoc } from '../docs-toolbox/lib/frontmatter.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

const DECISION_LOG = join(ROOT, 'docs', 'decision-log.md');
const CARDS_DIR = join(ROOT, 'docs', 'cards', 'decisions');
const SYNC_SCRIPT = join(__dirname, 'sync-memory-cards.mjs');

// ---------------------------------------------------------------------------
// Section intro defaults - used when first-run parsing can't find an intro.
// ---------------------------------------------------------------------------

const DEFAULT_SECTION_1_INTRO =
  'Decisions we keep relitigating. Each entry: short statement, rationale, closing artifact, date pinned.';
const DEFAULT_SECTION_2_INTRO =
  'Things we know we need to decide. Each leaves the table by becoming a spec / ADR or being dropped.';
const DEFAULT_SECTION_3_INTRO =
  'Features deferred with intent to remember. Each leaves by getting a spec or being dropped.';

// ---------------------------------------------------------------------------
// Card body unwrap - strips the banner line + H1 title + leading blanks.
// ---------------------------------------------------------------------------

function unwrapCardBody(rawBody) {
  const lines = rawBody.split('\n');
  let i = 0;

  while (i < lines.length && lines[i].trim() === '') i += 1;

  if (i < lines.length && /^>\s*\*\*Decision card\*\*/.test(lines[i])) {
    i += 1;
  }

  while (i < lines.length && lines[i].trim() === '') i += 1;

  if (i < lines.length && /^# /.test(lines[i])) {
    i += 1;
  }

  while (i < lines.length && lines[i].trim() === '') i += 1;

  let end = lines.length;
  while (end > i && lines[end - 1].trim() === '') end -= 1;

  return lines.slice(i, end).join('\n');
}

// ---------------------------------------------------------------------------
// Card loader - reads all dec-*.md files under docs/cards/decisions/ and
// returns three arrays sorted into section buckets.
//
// Bucketing:
//   - status: 'named-future'                                    -> 3
//   - status: 'active' + topic includes 'open-question'         -> 2
//   - status: 'active' (everything else)                        -> 1
//
// Sorting:
//   1: newest-first by date DESC; tiebreak lex on sha.
//   2: alphabetical by title (case-insensitive); tiebreak by date.
//   3: alphabetical by title (case-insensitive); tiebreak by date.
// ---------------------------------------------------------------------------

function loadCards() {
  if (!existsSync(CARDS_DIR)) {
    return { sec1: [], sec2: [], sec3: [] };
  }

  const files = readdirSync(CARDS_DIR)
    .filter((f) => f.startsWith('dec-') && f.endsWith('.md'))
    .sort(); // stable input order for deterministic tiebreaks

  const sec1 = [];
  const sec2 = [];
  const sec3 = [];

  for (const f of files) {
    const parsed = readDoc(join(CARDS_DIR, f));
    const fm = parsed.frontmatter ?? {};
    const title = String(fm.title ?? '').trim();
    const status = String(fm.status ?? 'active').trim();
    const date = String(fm.date ?? '').trim();
    const sha = String(fm['verified-against-commit'] ?? '').trim();
    const topics = Array.isArray(fm.topic) ? fm.topic.map(String) : [];
    const content = unwrapCardBody(parsed.body ?? '');

    const entry = { id: f.replace(/\.md$/, ''), title, status, date, sha, topics, content };

    if (status === 'named-future') {
      sec3.push(entry);
    } else if (topics.includes('open-question')) {
      sec2.push(entry);
    } else {
      sec1.push(entry);
    }
  }

  sec1.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return a.sha.localeCompare(b.sha);
  });

  sec2.sort((a, b) => {
    const cmp = a.title.toLowerCase().localeCompare(b.title.toLowerCase());
    if (cmp !== 0) return cmp;
    return a.date.localeCompare(b.date);
  });

  sec3.sort((a, b) => {
    const cmp = a.title.toLowerCase().localeCompare(b.title.toLowerCase());
    if (cmp !== 0) return cmp;
    return a.date.localeCompare(b.date);
  });

  return { sec1, sec2, sec3 };
}

// ---------------------------------------------------------------------------
// Section 1 bullet emitter - converts a card back to its original bullet.
// First body line gets concatenated to the title line; remaining lines keep
// their original indentation (so indented Amendment paragraphs render
// correctly under the bullet).
// ---------------------------------------------------------------------------

function emitSection1Bullet(entry) {
  const body = entry.content;
  if (!body) {
    return `- **${entry.date} - ${entry.title}.**`;
  }
  const lines = body.split('\n');
  const firstLine = lines[0] ?? '';
  const rest = lines.slice(1).join('\n');

  const head = `- **${entry.date} — ${entry.title}.** ${firstLine}`;
  return rest.length > 0 ? `${head}\n${rest}` : head;
}

// ---------------------------------------------------------------------------
// Section 2 / 3 table-row helpers.
// ---------------------------------------------------------------------------

function extractLabelledField(body, label) {
  const re = new RegExp(`\\*\\*${label}:\\*\\*\\s*(.*?)(?=\\n\\s*\\n|$)`, 's');
  const m = body.match(re);
  if (!m) return '—'; // em dash fallback
  const val = m[1].replace(/\s+/g, ' ').trim();
  return val.length === 0 ? '—' : val;
}

function emitSection2Row(entry) {
  const question = entry.title;
  const options = extractLabelledField(entry.content, 'Current options');
  const blockedBy = extractLabelledField(entry.content, 'Blocked by');
  const notes = extractLabelledField(entry.content, 'Notes');
  return `| ${question} | ${options} | ${blockedBy} | ${notes} |`;
}

function emitSection3Row(entry) {
  const item = entry.title;
  const source = extractLabelledField(entry.content, 'Source');
  const deferDate = extractLabelledField(entry.content, 'Defer date');
  const rationale = extractLabelledField(entry.content, 'Rationale');
  const where = extractLabelledField(entry.content, "Where it'd live if built");
  return `| ${item} | ${source} | ${deferDate} | ${rationale} | ${where} |`;
}

// ---------------------------------------------------------------------------
// Existing decision-log parser - captures header, intros, and 4/5/trailing
// blocks for verbatim preservation.
// ---------------------------------------------------------------------------

function parseExisting(srcText) {
  const lines = srcText.split('\n');

  let firstHeadingIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^## /.test(lines[i])) {
      firstHeadingIdx = i;
      break;
    }
  }
  const header =
    firstHeadingIdx === -1
      ? ''
      : lines
          .slice(0, firstHeadingIdx)
          .join('\n')
          .replace(/\n+$/, '');

  const bounds = {};
  for (let i = 0; i < lines.length; i++) {
    const m = /^## (\d+)\. /.exec(lines[i]);
    if (m) bounds[m[1]] = i;
    if (/^## Open in spec/.test(lines[i])) bounds.openInSpec = i;
  }

  function captureSectionIntro(startIdx, endIdx, contentMarkerRe) {
    if (startIdx == null) return '';
    const intro = [];
    for (let i = startIdx + 1; i < endIdx; i++) {
      if (contentMarkerRe.test(lines[i])) break;
      intro.push(lines[i]);
    }
    while (intro.length && intro[0].trim() === '') intro.shift();
    while (intro.length && intro[intro.length - 1].trim() === '') intro.pop();
    return intro.join('\n');
  }

  const sec1End = bounds['2'] ?? lines.length;
  const sec2End = bounds['3'] ?? lines.length;
  const sec3End = bounds['4'] ?? bounds.openInSpec ?? lines.length;

  const intro1 = captureSectionIntro(bounds['1'], sec1End, /^- \*\*\d{4}-\d{2}-\d{2}/);
  const intro2 = captureSectionIntro(bounds['2'], sec2End, /^\s*\|/);
  const intro3 = captureSectionIntro(bounds['3'], sec3End, /^\s*\|/);

  const backlog = extractMarkedOrSection(
    srcText,
    'BACKLOG',
    bounds['4'],
    lines,
    bounds['5'] ?? bounds.openInSpec ?? lines.length,
  );
  const journey = extractMarkedOrSection(
    srcText,
    'JOURNEY-MAP',
    bounds['5'],
    lines,
    bounds.openInSpec ?? lines.length,
  );

  const trailing =
    bounds.openInSpec != null
      ? lines.slice(bounds.openInSpec).join('\n').replace(/\n+$/, '')
      : null;

  return {
    header,
    intro1: intro1 || DEFAULT_SECTION_1_INTRO,
    intro2: intro2 || DEFAULT_SECTION_2_INTRO,
    intro3: intro3 || DEFAULT_SECTION_3_INTRO,
    backlog,
    journey,
    trailing,
  };
}

function extractMarkedOrSection(srcText, markerName, sectionStart, lines, sectionEnd) {
  const openTag = `<!-- ${markerName}: preserved -->`;
  const closeTag = `<!-- /${markerName} -->`;
  const openIdx = srcText.indexOf(openTag);
  const closeIdx = srcText.indexOf(closeTag);
  if (openIdx !== -1 && closeIdx !== -1 && closeIdx > openIdx) {
    return srcText
      .slice(openIdx + openTag.length, closeIdx)
      .replace(/^\n+/, '')
      .replace(/\n+$/, '');
  }
  if (sectionStart == null) return '';
  const captured = lines.slice(sectionStart + 1, sectionEnd);
  while (captured.length && captured[0].trim() === '') captured.shift();
  while (captured.length && captured[captured.length - 1].trim() === '') captured.pop();
  if (captured.length && /^---\s*$/.test(captured[captured.length - 1])) {
    captured.pop();
    while (captured.length && captured[captured.length - 1].trim() === '') captured.pop();
  }
  return captured.join('\n');
}

// ---------------------------------------------------------------------------
// Section 2 / 3 table builders.
// ---------------------------------------------------------------------------

function buildSection2Table(entries) {
  if (entries.length === 0) {
    return '_No open questions._';
  }
  const header = '| Question | Current options | Blocked by | Notes |';
  const align = '| -------- | --------------- | ---------- | ----- |';
  const rows = entries.map(emitSection2Row);
  return [header, align, ...rows].join('\n');
}

function buildSection3Table(entries) {
  if (entries.length === 0) {
    return '_No deferred features._';
  }
  const header = "| Item | Source | Defer date | Rationale | Where it'd live if built |";
  const align = '| ---- | ------ | ---------- | --------- | ------------------------ |';
  const rows = entries.map(emitSection3Row);
  return [header, align, ...rows].join('\n');
}

// ---------------------------------------------------------------------------
// Aggregate assembler.
// ---------------------------------------------------------------------------

function buildAggregate({ existing, cards }) {
  const sec1Bullets = cards.sec1.map(emitSection1Bullet).join('\n\n');
  const sec2Table = buildSection2Table(cards.sec2);
  const sec3Table = buildSection3Table(cards.sec3);

  const backlogBlock = [
    '<!-- BACKLOG: preserved -->',
    existing.backlog,
    '<!-- /BACKLOG -->',
  ].join('\n');

  const journeyBlock = [
    '<!-- JOURNEY-MAP: preserved -->',
    existing.journey,
    '<!-- /JOURNEY-MAP -->',
  ].join('\n');

  const parts = [
    existing.header,
    '',
    '## 1. Replayed Decisions',
    '',
    existing.intro1,
    '',
    sec1Bullets,
    '',
    '---',
    '',
    '## 2. Open Questions',
    '',
    existing.intro2,
    '',
    sec2Table,
    '',
    '---',
    '',
    '## 3. Named-Future',
    '',
    existing.intro3,
    '',
    sec3Table,
    '',
    '---',
    '',
    '## 4. Session Backlog',
    '',
    backlogBlock,
    '',
    '---',
    '',
    '## 5. User Journey Map',
    '',
    journeyBlock,
  ];

  if (existing.trailing) {
    parts.push('', '---', '', existing.trailing);
  }

  return parts.join('\n').replace(/\n+$/, '') + '\n';
}

// ---------------------------------------------------------------------------
// Memory mirror invocation - subprocess so sync-memory-cards' top-level
// run() call doesn't fire at import time. Uses execFileSync with an argv
// array (shell-safe; matches the pattern used in sibling scripts).
// ---------------------------------------------------------------------------

function runMemorySync() {
  try {
    const out = execFileSync(process.execPath, [SYNC_SCRIPT], {
      cwd: ROOT,
      encoding: 'utf8',
    });
    return out.trim();
  } catch (err) {
    process.stderr.write(
      `rebuild-views: sync-memory-cards.mjs failed: ${err.message}\n`,
    );
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main.
// ---------------------------------------------------------------------------

function main() {
  if (!existsSync(DECISION_LOG)) {
    process.stderr.write(`rebuild-views: missing ${DECISION_LOG}\n`);
    process.exit(1);
  }

  const srcText = readFileSync(DECISION_LOG, 'utf8');
  const existing = parseExisting(srcText);
  const cards = loadCards();

  const aggregate = buildAggregate({ existing, cards });
  writeFileSync(DECISION_LOG, aggregate, 'utf8');

  const syncOut = runMemorySync();

  let mirrorNote = 'Memory mirror: synced';
  if (syncOut) {
    const m = syncOut.match(/Synced (\d+) memory atoms/);
    if (m) mirrorNote = `Memory mirror: synced ${m[1]} atoms`;
  } else {
    mirrorNote = 'Memory mirror: sync failed (see stderr)';
  }

  const total = cards.sec1.length + cards.sec2.length + cards.sec3.length;
  process.stdout.write(
    `Rebuilt docs/decision-log.md from ${total} cards ` +
      `(§1: ${cards.sec1.length}, §2: ${cards.sec2.length}, §3: ${cards.sec3.length}). ` +
      `${mirrorNote}.\n`,
  );
}

main();
