#!/usr/bin/env node
// docs-steward.mjs — drift detection for canonical docs.
//
// Walks "checkable" docs (cards + ADRs + active design specs), reads each
// doc's `verified-against-commit` frontmatter, and emits a markdown report
// flagging drift candidates across three categories + a fourth section for
// docs that are missing the freshness sensor entirely.
//
// Categories (all conservative on first run to avoid false-positive flood):
//
//   1. Stale cards
//      - >30 commits behind verification SHA AND the doc itself was touched
//        in that window, OR
//      - >90 days since `last-verified`.
//      Both signals require the doc to have been touched since verification
//      (an untouched doc is still considered fresh under category 1; it may
//      surface under category 2 if it's also a high-traffic anchor).
//
//   2. Untouched-but-referenced
//      - `git log <sha>..HEAD -- <doc>` is empty (still fresh by category 1).
//      - Inbound references (other docs citing this one via `related:`
//        frontmatter or [[wikilink]]) ≥ 10.
//      - `last-verified` is >60 days old.
//      Catches high-traffic anchors that nobody has re-verified in a while.
//
//   3. Citation-drift suggestions
//      - Body cites `<path>:<line>` patterns (with optional `-<endLine>`).
//      - For each citation where `<path>` exists in the working tree,
//        runs `git log -L <line>,<endLine>:<path> <sha>..HEAD`.
//      - Non-empty output means the cited line range moved since verification.
//      - Capped at the first 5 citations per doc to control perf.
//
//   4. Missing sensor
//      - Docs in scope that have NO `verified-against-commit` frontmatter.
//      - Actionable: run `pnpm docs:verify <id>` once after a fresh read.
//
// Usage:
//   node scripts/docs-steward.mjs                  # full report → stdout
//   STEWARD_SKIP_CITATION_DRIFT=1 node scripts/docs-steward.mjs
//   STEWARD_SKIP_INBOUND=1 node scripts/docs-steward.mjs
//
// Shell safety: every git call uses execFileSync with array args (no shell).

import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { readDoc, getDocId, getWikilinks } from './docs-toolbox/lib/frontmatter.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DOCS = join(ROOT, 'docs');

// ---------- Configuration --------------------------------------------------

const THRESHOLDS = {
  STALE_COMMITS: 30, // >N commits behind verification SHA AND doc touched
  STALE_DAYS: 90, // >N days since last-verified AND doc touched
  INBOUND_MIN_REFS: 10, // >=N inbound references to flag as high-traffic
  INBOUND_MIN_DAYS: 60, // AND last-verified is >N days old
  CITATION_CAP: 5, // process at most N file:line citations per doc
};

const SKIP_CITATION_DRIFT = process.env.STEWARD_SKIP_CITATION_DRIFT === '1';
const SKIP_INBOUND = process.env.STEWARD_SKIP_INBOUND === '1';

// Directories to walk for "checkable" docs.
const SCAN_DIRS = [
  'docs/cards/decisions',
  'docs/cards/investigations',
  'docs/cards/memory',
  'docs/07-decisions',
  'docs/superpowers/specs',
];

// Filenames to skip even within scanned dirs.
const SKIP_FILES = new Set([
  'MEMORY.md', // memory index, not a card
]);

// ---------- Helpers --------------------------------------------------------

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', cwd: ROOT });
}

function gitSafe(args) {
  try {
    return git(args);
  } catch {
    return '';
  }
}

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, out);
    } else if (entry.endsWith('.md') && !SKIP_FILES.has(entry)) {
      out.push(full);
    }
  }
  return out;
}

function asArray(v) {
  return Array.isArray(v) ? v : v == null ? [] : [v];
}

function daysBetween(isoDate, today) {
  const d1 = Date.parse(isoDate);
  const d2 = Date.parse(today);
  if (Number.isNaN(d1) || Number.isNaN(d2)) return null;
  return Math.floor((d2 - d1) / 86400000);
}

function shortSha(sha) {
  return String(sha).slice(0, 12);
}

// Categorize a path for report stats: 'card' | 'spec' | 'adr' | 'other'.
function categorize(absPath) {
  const rel = relative(ROOT, absPath);
  if (rel.startsWith('docs/cards/')) return 'card';
  if (rel.startsWith('docs/07-decisions/')) return 'adr';
  if (rel.startsWith('docs/superpowers/specs/')) return 'spec';
  return 'other';
}

// Extract `<path>:<startLine>[-<endLine>]` citations from doc body.
// Conservative: only match patterns that look like real source paths
// (contain a known code extension). The caller filters further by
// existsSync().
const CITATION_RE = /([A-Za-z0-9_\-./]+\.(?:ts|tsx|js|jsx|mjs|cjs|md)):(\d+)(?:-(\d+))?/g;
function extractCitations(body) {
  const out = [];
  const seen = new Set();
  let m;
  // Reset lastIndex defensively — RE has /g flag.
  CITATION_RE.lastIndex = 0;
  while ((m = CITATION_RE.exec(body)) != null) {
    const path = m[1];
    const start = Number(m[2]);
    const end = m[3] ? Number(m[3]) : start;
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 1 || end < start) continue;
    const key = `${path}:${start}-${end}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ path, start, end });
    if (out.length >= THRESHOLDS.CITATION_CAP) break;
  }
  return out;
}

// ---------- Main -----------------------------------------------------------

const t0 = Date.now();
const today = new Date().toISOString().slice(0, 10);
const headSha = git(['rev-parse', 'HEAD']).trim();
const headShort = shortSha(headSha);

// 1. Walk all in-scope docs.
const files = [];
for (const d of SCAN_DIRS) files.push(...walk(join(ROOT, d)));

// 2. Read frontmatter + body for each.
const docs = files.map((path) => {
  const doc = readDoc(path);
  return {
    path,
    rel: relative(ROOT, path),
    id: getDocId(path),
    category: categorize(path),
    fm: doc.frontmatter,
    body: doc.body,
  };
});

// 3. Build inbound-reference index (id -> count) — single pass across the
//    corpus, NOT the entire docs/ tree (only "checkable" scope ensures the
//    counts reflect canonical-doc traffic). Sources: `related:` frontmatter
//    + [[wikilink]] body refs.
const inboundRefs = new Map();
function bump(id) {
  inboundRefs.set(id, (inboundRefs.get(id) ?? 0) + 1);
}
if (!SKIP_INBOUND) {
  for (const d of docs) {
    for (const r of asArray(d.fm.related)) {
      const id = String(r).replace(/^.*\//, '').replace(/\.md$/, '');
      bump(id);
    }
    for (const link of getWikilinks(d.body)) bump(link);
  }
}

// 4. Per-doc drift analysis.
const stale = [];
const untouchedReferenced = [];
const citationDrift = [];
const missingSensor = [];

for (const d of docs) {
  const sha = d.fm['verified-against-commit'];
  const lastVerified = d.fm['last-verified'];

  if (!sha) {
    missingSensor.push(d);
    continue;
  }

  // Did the doc itself get touched since verification?
  const docCommitsRaw = gitSafe(['log', '--oneline', `${sha}..HEAD`, '--', d.rel]);
  const docCommits = docCommitsRaw.trim() ? docCommitsRaw.trim().split('\n') : [];
  const docTouched = docCommits.length > 0;

  // Total commit count on HEAD since verification (whole repo).
  // Used for the >30-commit threshold. `rev-list --count` is cheap.
  const totalCountRaw = gitSafe(['rev-list', '--count', `${sha}..HEAD`]);
  const totalCount = Number(totalCountRaw.trim()) || 0;

  const daysOld = lastVerified ? daysBetween(String(lastVerified), today) : null;

  // -------- Category 1: stale ------------------------------------------
  const staleByCommits = totalCount > THRESHOLDS.STALE_COMMITS && docTouched;
  const staleByDays =
    daysOld != null && daysOld > THRESHOLDS.STALE_DAYS && docTouched;
  if (staleByCommits || staleByDays) {
    stale.push({
      doc: d,
      sha: shortSha(sha),
      commitsBehind: totalCount,
      docCommits: docCommits.length,
      daysOld,
      reasons: [
        staleByCommits ? `${totalCount} commits behind (>${THRESHOLDS.STALE_COMMITS})` : null,
        staleByDays ? `${daysOld} days since last-verified (>${THRESHOLDS.STALE_DAYS})` : null,
      ].filter(Boolean),
    });
    // Stale docs can still surface citation-drift; continue below.
  }

  // -------- Category 2: untouched-but-referenced -----------------------
  if (!docTouched && !SKIP_INBOUND) {
    const inbound = inboundRefs.get(d.id) ?? 0;
    if (
      inbound >= THRESHOLDS.INBOUND_MIN_REFS &&
      daysOld != null &&
      daysOld > THRESHOLDS.INBOUND_MIN_DAYS
    ) {
      untouchedReferenced.push({
        doc: d,
        sha: shortSha(sha),
        inbound,
        daysOld,
      });
    }
  }

  // -------- Category 3: citation-drift ---------------------------------
  if (!SKIP_CITATION_DRIFT) {
    const citations = extractCitations(d.body);
    const drifted = [];
    for (const c of citations) {
      const absCited = join(ROOT, c.path);
      if (!existsSync(absCited)) continue; // skip URL fragments, prose mentions
      const range = `${c.start},${c.end}:${c.path}`;
      const out = gitSafe(['log', '-L', range, '--no-patch', `${sha}..HEAD`]);
      if (out.trim()) {
        drifted.push(c);
      }
    }
    if (drifted.length > 0) {
      citationDrift.push({ doc: d, sha: shortSha(sha), drifted });
    }
  }
}

// ---------- Report ---------------------------------------------------------

const lines = [];
const push = (s = '') => lines.push(s);

const withSensor = docs.length - missingSensor.length;
const byCat = { card: 0, spec: 0, adr: 0, other: 0 };
for (const d of docs) if (d.fm['verified-against-commit']) byCat[d.category]++;

const totalFlagged =
  stale.length + untouchedReferenced.length + citationDrift.length;

const allEmpty = totalFlagged === 0;

push(`# Docs Steward Report — ${today}`);
push();

if (allEmpty) {
  push(
    `Scanned ${docs.length} docs (${byCat.card} cards, ${byCat.spec} specs, ${byCat.adr} ADRs with \`verified-against-commit\`). HEAD: \`${headShort}\`.`,
  );
  push();
  push('**All canonical docs are fresh.** ✨');
  push();
} else {
  push(
    `Scanned ${docs.length} docs (cards: ${byCat.card}, specs: ${byCat.spec}, ADRs: ${byCat.adr}) with \`verified-against-commit\` frontmatter. HEAD: \`${headShort}\`.`,
  );
  push();

  // ---- Stale ------------------------------------------------------------
  push(`## Stale cards (${stale.length})`);
  push();
  if (stale.length === 0) {
    push('_None._');
  } else {
    // Sort: commits-behind desc, then days-old desc.
    stale.sort((a, b) => {
      if (b.commitsBehind !== a.commitsBehind) return b.commitsBehind - a.commitsBehind;
      return (b.daysOld ?? 0) - (a.daysOld ?? 0);
    });
    for (const s of stale) {
      const dStr = s.daysOld == null ? 'unknown days' : `${s.daysOld} days ago`;
      push(
        `- **${s.doc.id}** — ${s.reasons.join('; ')}; last-verified ${dStr}; doc touched in ${s.docCommits} commit(s) since \`${s.sha}\`. Suggested action: \`pnpm docs:get ${s.doc.id}\` then re-verify or supersede.`,
      );
    }
  }
  push();

  // ---- Untouched-but-referenced ----------------------------------------
  push(`## Untouched-but-referenced (${untouchedReferenced.length})`);
  push();
  if (untouchedReferenced.length === 0) {
    push('_None._');
  } else {
    untouchedReferenced.sort((a, b) => b.inbound - a.inbound);
    for (const u of untouchedReferenced) {
      push(
        `- **${u.doc.id}** — fresh by content (no commits touched it since \`${u.sha}\`); ${u.inbound} inbound refs; last-verified ${u.daysOld} days ago. Suggested action: re-read for staleness on a high-traffic anchor; \`pnpm docs:verify ${u.doc.id}\` if still current.`,
      );
    }
  }
  push();

  // ---- Citation-drift ---------------------------------------------------
  push(`## Citation-drift suggestions (${citationDrift.length})`);
  push();
  if (citationDrift.length === 0) {
    push('_None._');
  } else {
    citationDrift.sort((a, b) => b.drifted.length - a.drifted.length);
    for (const c of citationDrift) {
      const cites = c.drifted
        .map((d) => `\`${d.path}:${d.start}${d.end !== d.start ? `-${d.end}` : ''}\``)
        .join(', ');
      push(
        `- **${c.doc.id}** — body cites ${cites}; those lines moved since verification at \`${c.sha}\`. Suggested action: re-verify the cited line range OR update the citation to current location.`,
      );
    }
  }
  push();
}

// ---- Missing sensor (always shown if any) -------------------------------
if (missingSensor.length > 0) {
  push(`## Missing sensor (${missingSensor.length})`);
  push();
  push(
    'Docs in canonical scope without `verified-against-commit` frontmatter — `pnpm docs:verify <id>` after a fresh read.',
  );
  push();
  // Group by category for readability.
  const byCategory = new Map();
  for (const d of missingSensor) {
    if (!byCategory.has(d.category)) byCategory.set(d.category, []);
    byCategory.get(d.category).push(d);
  }
  const order = ['adr', 'spec', 'card', 'other'];
  for (const cat of order) {
    const list = byCategory.get(cat);
    if (!list || list.length === 0) continue;
    const label = { adr: 'ADRs', spec: 'Specs', card: 'Cards', other: 'Other' }[cat];
    push(`**${label} (${list.length}):**`);
    push();
    // Cap each subgroup at 20 lines to keep report readable on first run.
    const shown = list.slice(0, 20);
    for (const d of shown) push(`- ${d.id}`);
    if (list.length > shown.length) {
      push(`- _...and ${list.length - shown.length} more._`);
    }
    push();
  }
}

// ---- Scan stats -----------------------------------------------------------
const elapsedS = ((Date.now() - t0) / 1000).toFixed(1);
push('## Scan stats');
push();
push(`- Total docs scanned: ${docs.length}`);
push(`- Docs with \`verified-against-commit\`: ${withSensor}`);
push(`- Docs flagged (stale + untouched-referenced + citation-drift): ${totalFlagged}`);
push(`- Docs missing sensor: ${missingSensor.length}`);
push(`- Scan duration: ${elapsedS}s`);
push(
  `- Thresholds: stale >${THRESHOLDS.STALE_COMMITS} commits | >${THRESHOLDS.STALE_DAYS} days; untouched-referenced >=${THRESHOLDS.INBOUND_MIN_REFS} refs + >${THRESHOLDS.INBOUND_MIN_DAYS} days; citation cap ${THRESHOLDS.CITATION_CAP}/doc.`,
);
if (SKIP_CITATION_DRIFT) push('- (Citation-drift check skipped via `STEWARD_SKIP_CITATION_DRIFT=1`.)');
if (SKIP_INBOUND) push('- (Inbound-ref check skipped via `STEWARD_SKIP_INBOUND=1`.)');

process.stdout.write(lines.join('\n') + '\n');
