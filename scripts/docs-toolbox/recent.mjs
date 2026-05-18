#!/usr/bin/env node
// recent.mjs — list new docs + decision-log entries since a cutoff date.
//
// Usage:
//   pnpm docs:recent --since=2026-05-10
//   pnpm docs:recent --since=2026-05-10 --amendments
//
// --amendments restricts decision-log output to entries with canonical edit-types.
//
// Phase 3 dual-source output groups (in order):
//   1. Decision cards added or last-verified since <since>   — from docs/cards/decisions/
//   2. Decision-log §4 backlog updates since <since>         — from aggregate §4 table rows
//   3. Other docs since <since>                              — docs/** excluding cards
//   4. Legacy decision-log entries since <since>            — bullet entries (§1/§2/§3, back-compat with cards)

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readDoc } from './lib/frontmatter.mjs';
import { parseEntry } from './lib/edit-types.mjs';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const DOCS = join(ROOT, 'docs');
const CARDS_DECISIONS = join(DOCS, 'cards', 'decisions');

const args = parseArgs(process.argv.slice(2));
function parseArgs(argv) {
  const out = { since: null, amendmentsOnly: false };
  for (const a of argv) {
    if (a.startsWith('--since=')) out.since = a.slice(8);
    else if (a === '--amendments') out.amendmentsOnly = true;
  }
  return out;
}

if (!args.since || !/^\d{4}-\d{2}-\d{2}$/.test(args.since)) {
  console.error('Usage: pnpm docs:recent --since=YYYY-MM-DD [--amendments]');
  process.exit(2);
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (entry.endsWith('.md')) out.push(full);
  }
  return out;
}

// ── Group 1: Decision cards ──────────────────────────────────────────────────
// Walk docs/cards/decisions/ for cards with frontmatter date or last-verified >= since.

const decisionCards = [];
try {
  for (const f of walk(CARDS_DECISIONS)) {
    const doc = readDoc(f);
    const date = String(doc.frontmatter.date ?? doc.frontmatter['last-verified'] ?? '');
    if (/^\d{4}-\d{2}-\d{2}$/.test(date) && date >= args.since) {
      decisionCards.push({
        path: relative(ROOT, f),
        title: doc.frontmatter.title ?? '(no title)',
        date,
      });
    }
  }
} catch {
  // cards dir may not exist on older branches — silently emit empty group
}
decisionCards.sort((a, b) => b.date.localeCompare(a.date));

// ── Group 2: Decision-log §4 backlog table rows ──────────────────────────────
// §4 Session Backlog is a markdown table. Parse table rows and extract
// Topic + Opened date from the pipe-delimited columns.
// Table column order: Topic | Type | State | Source | Opened | Closed

const BACKLOG_START_RE = /^##\s+4\.\s+Session Backlog/;
const NEXT_SECTION_RE = /^##\s+[0-9]+\./;
const TABLE_ROW_RE = /^\|(.+)\|$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const backlockEntries = [];
const logPath = join(DOCS, 'decision-log.md');
const logRaw = readFileSync(logPath, 'utf8');
const logLines = logRaw.split('\n');

let inBacklog = false;
let headerParsed = false; // skip the header + separator rows

for (const line of logLines) {
  if (!inBacklog) {
    if (BACKLOG_START_RE.test(line)) inBacklog = true;
    continue;
  }
  // Stop at next section header (but not the §4 header itself)
  if (NEXT_SECTION_RE.test(line) && !BACKLOG_START_RE.test(line)) break;

  const rowMatch = TABLE_ROW_RE.exec(line);
  if (!rowMatch) continue;

  const cells = rowMatch[1].split('|').map((c) => c.trim());
  // cells[0]=Topic, cells[1]=Type, cells[2]=State, cells[3]=Source, cells[4]=Opened, cells[5]=Closed
  if (cells.length < 5) continue;

  const topic = cells[0];
  const openedRaw = cells[4] ?? '';
  const opened = openedRaw.replace(/\*+/g, '').trim();

  // Skip header row and separator row (---|---|...)
  if (topic === 'Topic' || /^[-|: ]+$/.test(topic)) {
    headerParsed = true;
    continue;
  }
  if (!headerParsed) continue;

  if (DATE_RE.test(opened) && opened >= args.since) {
    backlockEntries.push({
      opened,
      topic,
      type: cells[1] ?? '',
      state: cells[2] ?? '',
    });
  }
}
backlockEntries.sort((a, b) => b.opened.localeCompare(a.opened));

// ── Group 3: Other docs (excluding docs/cards/) ──────────────────────────────
const otherDocs = [];
for (const f of walk(DOCS)) {
  const rel = relative(DOCS, f);
  // Exclude cards — they have their own group above
  if (rel.startsWith('cards/')) continue;
  const doc = readDoc(f);
  const date = String(doc.frontmatter.date ?? doc.frontmatter['last-verified'] ?? '');
  if (/^\d{4}-\d{2}-\d{2}$/.test(date) && date >= args.since) {
    otherDocs.push({
      path: relative(ROOT, f),
      title: doc.frontmatter.title ?? '(no title)',
      date,
    });
  }
}
otherDocs.sort((a, b) => b.date.localeCompare(a.date));

// ── Group 4: Legacy decision-log bullet entries (§1/§2/§3) ───────────────────
// These are now also captured as cards (Group 1). We keep this group for
// back-compat but restrict parsing to only lines BEFORE §4 to avoid
// double-counting any future bullet entries added in §4.
// In practice, §4 is a table so parseEntry won't match there anyway.

const legacyEntries = [];
for (const line of logLines) {
  if (BACKLOG_START_RE.test(line)) break;
  const e = parseEntry(line);
  if (e && e.date >= args.since) {
    if (args.amendmentsOnly && !e.editType) continue;
    legacyEntries.push(e);
  }
}

// ── Output ───────────────────────────────────────────────────────────────────

// Group 1: Decision cards
console.log(`# Decision cards added or last-verified since ${args.since} (${decisionCards.length})\n`);
for (const d of decisionCards.slice(0, 50)) {
  console.log(`- ${d.date} — ${d.path} — ${d.title}`);
}
if (decisionCards.length > 50) console.log(`(+ ${decisionCards.length - 50} more)`);

// Group 2: §4 backlog table rows
console.log(`\n# Decision-log §4 backlog updates since ${args.since} (${backlockEntries.length})\n`);
for (const e of backlockEntries) {
  console.log(`- ${e.opened} — ${e.topic} [${e.type} / ${e.state}]`);
}
if (backlockEntries.length === 0) {
  console.log(`(No §4 backlog rows opened since ${args.since}.)`);
}

// Group 3: Other docs
console.log(`\n# Other docs since ${args.since} (${otherDocs.length})\n`);
for (const d of otherDocs.slice(0, 30)) {
  console.log(`- ${d.date} — ${d.path} — ${d.title}`);
}
if (otherDocs.length > 30) console.log(`(+ ${otherDocs.length - 30} more)`);

// Group 4: Legacy entries (§1/§2/§3 bullet entries — now also in cards; kept for back-compat)
console.log(`\n# Legacy decision-log entries since ${args.since} (${legacyEntries.length})\n`);
for (const e of legacyEntries) {
  console.log(`- ${e.date} — ${e.title}${e.editType ? ` [${e.editType}]` : ''}`);
}

if (args.amendmentsOnly && legacyEntries.length === 0) {
  console.log(`(Tip: drop --amendments to see all decision-log entries.)`);
}
