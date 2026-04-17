#!/usr/bin/env node
// audit-doc-references.mjs — one-shot load-bearing audit for ADRs + specs.
// Produces docs/09-baseline/2026-04-17-doc-audit.md. Pure read; no file moves.
//
// Usage: node scripts/audit-doc-references.mjs [--write] [--out <path>]
//   Without --write the report is printed to stdout (preview mode).
//   With --write the report is written to the out path (default
//   docs/09-baseline/2026-04-17-doc-audit.md).

import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { parse as parseYaml } from 'yaml';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT_DEFAULT = 'docs/09-baseline/2026-04-17-doc-audit.md';

const args = process.argv.slice(2);
const WRITE = args.includes('--write');
const OUT = (() => {
  const i = args.indexOf('--out');
  return i >= 0 ? args[i + 1] : OUT_DEFAULT;
})();

const TODAY = new Date();
const SIXTY_DAYS_MS = 60 * 24 * 3600 * 1000;

// Hard-coded exceptions: documents that are the only source of truth for
// something that exists only in design. Preserved regardless of inbound score.
const EXCEPTIONS = new Set([
  'docs/superpowers/specs/2026-04-07-process-flow-analysis-mode-design.md',
]);

// ---------------------------------------------------------------------------
// Target discovery
// ---------------------------------------------------------------------------

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function listMd(dir) {
  return walk(join(ROOT, dir))
    .filter((p) => p.endsWith('.md'))
    .map((p) => relative(ROOT, p));
}

const adrs = listMd('docs/07-decisions').filter((p) => /\/adr-\d+/.test(p));
const specs = listMd('docs/superpowers/specs').filter((p) => !p.endsWith('/index.md'));

const targets = [...adrs, ...specs].map((path) => {
  const stem = basename(path, '.md');
  const patterns = [stem];
  const adrMatch = stem.match(/^adr-(\d+)/i);
  if (adrMatch) {
    patterns.push(`ADR-${adrMatch[1]}`);
    patterns.push(`adr-${adrMatch[1]}`);
  }
  return {
    path,
    stem,
    type: path.startsWith('docs/07-decisions/') ? 'adr' : 'spec',
    patterns: [...new Set(patterns)],
    inbound: { code: 0, agent: 0, skills: 0, peers: 0, docs: 0 },
  };
});

const targetByPath = new Map(targets.map((t) => [t.path, t]));

// ---------------------------------------------------------------------------
// Source roots
// ---------------------------------------------------------------------------

const SOURCE_ROOTS = ['packages', 'apps', 'tools', '.claude/skills', 'docs'];
const AGENT_FILES = [
  'CLAUDE.md',
  ...listMd('packages').filter((p) => p.endsWith('/CLAUDE.md')),
  ...listMd('apps').filter((p) => p.endsWith('/CLAUDE.md')),
];

// Index files are bookkeeping, not load-bearing references. Excluding
// them prevents every indexed ADR/spec from getting +1 docs-bucket
// inbound just for existing.
const INDEX_FILES = new Set([
  'docs/07-decisions/index.md',
  'docs/superpowers/specs/index.md',
]);

function classifySource(srcPath) {
  if (INDEX_FILES.has(srcPath)) return null;
  if (AGENT_FILES.includes(srcPath)) return 'agent';
  if (srcPath.startsWith('.claude/skills/')) return 'skills';
  if (srcPath.startsWith('docs/07-decisions/') && /\/adr-\d+/.test(srcPath)) return 'peers';
  if (srcPath.startsWith('docs/superpowers/specs/')) return 'peers';
  if (srcPath.startsWith('docs/')) return 'docs';
  if (
    srcPath.startsWith('packages/') ||
    srcPath.startsWith('apps/') ||
    srcPath.startsWith('tools/')
  ) {
    return srcPath.endsWith('.md') ? 'docs' : 'code';
  }
  return null;
}

function shouldScan(srcPath) {
  // only scan text-like files
  return /\.(ts|tsx|js|mjs|cjs|jsx|md|mdx|json|sh|yml|yaml)$/.test(srcPath);
}

// ---------------------------------------------------------------------------
// Build source file list + scan
// ---------------------------------------------------------------------------

const sourceFiles = [];
for (const root of SOURCE_ROOTS) {
  try {
    const full = join(ROOT, root);
    if (!statSync(full).isDirectory()) continue;
    for (const p of walk(full)) {
      const rel = relative(ROOT, p);
      if (rel.includes('/node_modules/')) continue;
      if (rel.includes('/.astro/')) continue;
      if (rel.includes('/dist/') || rel.includes('/build/')) continue;
      if (shouldScan(rel)) sourceFiles.push(rel);
    }
  } catch {
    // root doesn't exist, skip
  }
}
sourceFiles.push('CLAUDE.md');

console.error(`Scanning ${sourceFiles.length} source files for references to ${targets.length} docs…`);

for (const src of sourceFiles) {
  const bucket = classifySource(src);
  if (bucket == null) continue;
  let content;
  try {
    content = readFileSync(join(ROOT, src), 'utf8');
  } catch {
    continue;
  }
  for (const t of targets) {
    if (t.path === src) continue; // don't count self-reference
    let hit = false;
    for (const pattern of t.patterns) {
      if (content.includes(pattern)) {
        hit = true;
        break;
      }
    }
    if (hit) t.inbound[bucket]++;
  }
}

// ---------------------------------------------------------------------------
// Status + last-modified per target
// ---------------------------------------------------------------------------

function extractFrontmatter(src) {
  if (!src.startsWith('---\n') && !src.startsWith('---\r\n')) return null;
  const end = src.indexOf('\n---', 4);
  if (end < 0) return null;
  return src.slice(4, end);
}

function parseStatus(path) {
  const src = readFileSync(join(ROOT, path), 'utf8');
  const rawFm = extractFrontmatter(src);
  if (rawFm) {
    try {
      const fm = parseYaml(rawFm) ?? {};
      if (fm.status) return String(fm.status).toLowerCase();
    } catch {
      // fall through to body parse
    }
  }
  // Body parse. Handles several real-world formats seen in ADRs:
  //   "**Status:** Accepted"
  //   "**Status**: Accepted"
  //   "Status: Accepted"
  //   "## Status\nAccepted"
  //   "**Status:** Superseded by ADR-037"
  // After capture: lowercase + collapse "superseded by X" → "superseded".
  const pats = [
    /^\s*\*{0,2}Status\*{0,2}\s*[:：]\s*([A-Za-z][A-Za-z -]*)/m,
    /^##\s*Status\s*\n\s*([A-Za-z][A-Za-z -]*)/m,
  ];
  for (const p of pats) {
    const m = src.match(p);
    if (m) {
      let val = m[1].trim().toLowerCase();
      if (/^superseded\b/.test(val)) val = 'superseded';
      if (/^accepted\b/.test(val)) val = 'accepted';
      return val;
    }
  }
  return 'unknown';
}

// Age in days since *file creation* (first commit adding the file) —
// more stable than last-modified, which gets reset by every codemod
// or frontmatter touch.
function creationAgeDays(path) {
  try {
    const ct = execFileSync(
      'git',
      ['log', '--diff-filter=A', '--follow', '--format=%ct', '--', path],
      { cwd: ROOT, encoding: 'utf8' },
    )
      .trim()
      .split('\n')
      .pop();
    if (!ct) return null;
    const age = TODAY.getTime() - Number(ct) * 1000;
    return Math.floor(age / (24 * 3600 * 1000));
  } catch {
    return null;
  }
}

for (const t of targets) {
  t.status = parseStatus(t.path);
  t.ageDays = creationAgeDays(t.path);
}

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

function classify(t) {
  if (EXCEPTIONS.has(t.path))
    return { rec: 'KEEP', reason: 'exception (process-flow only-source-of-truth)' };
  const strong = t.inbound.code + t.inbound.agent + t.inbound.skills;

  // Status-based archival trumps inbound count. Superseded/archived docs
  // stay in git history + the index row, but don't need to live in the
  // main tree.
  if (['superseded', 'archived'].includes(t.status)) {
    return { rec: 'ARCHIVE', reason: `status=${t.status}` };
  }

  if (strong >= 2) return { rec: 'KEEP', reason: `${strong} strong inbound (code/agent/skills)` };

  // Delivered specs with no load-bearing refs: the feature shipped, the
  // ADR + code are ground truth, the spec is historical design context.
  // Archive regardless of cross-refs — those get rewritten at execution.
  if (strong === 0 && t.status === 'delivered') {
    return { rec: 'ARCHIVE', reason: `delivered, no strong refs` };
  }

  // Abandoned drafts: if a draft is >14d old with no load-bearing refs,
  // it's either stale intent or was absorbed into another spec. Safe to
  // archive; subagent pass catches exceptions.
  if (
    strong === 0 &&
    t.status === 'draft' &&
    t.ageDays != null &&
    t.ageDays > 14
  ) {
    return { rec: 'ARCHIVE', reason: `stale draft, ${t.ageDays}d old, no strong refs` };
  }

  return {
    rec: 'REVIEW',
    reason: `${strong} strong / ${t.inbound.peers + t.inbound.docs} weak inbound, status=${t.status}`,
  };
}

for (const t of targets) {
  const c = classify(t);
  t.rec = c.rec;
  t.reason = c.reason;
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const byRec = { KEEP: [], ARCHIVE: [], REVIEW: [] };
for (const t of targets) byRec[t.rec].push(t);

function fmtRow(t) {
  const total = t.inbound.code + t.inbound.agent + t.inbound.skills + t.inbound.peers + t.inbound.docs;
  return (
    `| ${t.path} | ${t.type} | ${t.status} | ${t.ageDays ?? '-'}d | ` +
    `${t.inbound.code} | ${t.inbound.agent} | ${t.inbound.skills} | ${t.inbound.peers} | ${t.inbound.docs} | ` +
    `${total} | **${t.rec}** | ${t.reason} |`
  );
}

const lines = [];
lines.push('---');
lines.push("title: 'Doc Prune — Load-Bearing Audit Output'");
lines.push('audience: [engineer, architect]');
lines.push('category: architecture');
lines.push('status: draft');
lines.push('related: [doc-prune-audit, agent-docs-architecture]');
lines.push('last-reviewed: 2026-04-17');
lines.push('---');
lines.push('');
lines.push('# Doc Prune — Load-Bearing Audit Output');
lines.push('');
lines.push('Generated by `scripts/audit-doc-references.mjs` on 2026-04-17.');
lines.push('');
lines.push(
  `Scanned **${targets.length}** docs (${adrs.length} ADRs + ${specs.length} specs) against ` +
    `**${sourceFiles.length}** source files.`,
);
lines.push('');
lines.push('## Summary');
lines.push('');
lines.push(`- **KEEP:** ${byRec.KEEP.length}`);
lines.push(`- **REVIEW:** ${byRec.REVIEW.length} — needs human judgment`);
lines.push(`- **ARCHIVE:** ${byRec.ARCHIVE.length} — candidate for move into \`docs/archive/\``);
lines.push('');
lines.push('## Rules applied');
lines.push('');
lines.push('Priority order — first matching rule wins:');
lines.push('');
lines.push('1. Process-flow exception → **KEEP** (only-source-of-truth).');
lines.push('2. `status ∈ {superseded, archived}` → **ARCHIVE** (status alone; inbound refs get rewritten at execution).');
lines.push('3. `strong inbound ≥ 2` (code/agent/skills) → **KEEP**.');
lines.push('4. `delivered AND strong = 0` → **ARCHIVE** (feature shipped; ADR + code are ground truth).');
lines.push('5. `draft AND strong = 0 AND age > 14d` → **ARCHIVE** (abandoned draft).');
lines.push('6. Everything else → **REVIEW**.');
lines.push('');
lines.push('Index files (`docs/07-decisions/index.md`, `docs/superpowers/specs/index.md`) are excluded as sources — they are bookkeeping, not load-bearing.');
lines.push('');
lines.push('Columns: Code, Agent, Skills = strong buckets. Peers = other ADRs/specs. Docs = broader `docs/` tree.');
lines.push('');

for (const rec of ['ARCHIVE', 'REVIEW', 'KEEP']) {
  const rows = byRec[rec];
  if (rows.length === 0) continue;
  lines.push(`## ${rec} (${rows.length})`);
  lines.push('');
  lines.push('| Path | Type | Status | Age | Code | Agent | Skills | Peers | Docs | Total | Rec | Reason |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  rows
    .sort((a, b) => {
      const aStrong = a.inbound.code + a.inbound.agent + a.inbound.skills;
      const bStrong = b.inbound.code + b.inbound.agent + b.inbound.skills;
      if (aStrong !== bStrong) return aStrong - bStrong;
      return a.path.localeCompare(b.path);
    })
    .forEach((t) => lines.push(fmtRow(t)));
  lines.push('');
}

const output = lines.join('\n') + '\n';

if (WRITE) {
  const outFull = join(ROOT, OUT);
  mkdirSync(dirname(outFull), { recursive: true });
  writeFileSync(outFull, output);
  console.error(`Wrote ${OUT}`);
  console.error(
    `Summary: KEEP=${byRec.KEEP.length} REVIEW=${byRec.REVIEW.length} ARCHIVE=${byRec.ARCHIVE.length}`,
  );
} else {
  process.stdout.write(output);
}
