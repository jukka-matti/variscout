#!/usr/bin/env node
// execute-archive-phase5.mjs — one-shot archival execution for the Phase 5 audit.
//
// Steps:
//   1. `git mv` each ARCHIVE-approved doc into docs/archive/{adrs,specs}/.
//   2. Substring-replace inbound path references in all non-archived .md files
//      (docs/**, .claude/skills/**, root + nested CLAUDE.mds, AGENT CLAUDE.mds).
//      Handles `../07-decisions/adr-024-foo.md`-style cross-dir links naturally.
//      Same-directory links (case a) caught by the dead-link hook after.
//   3. Caller commits. No pre-commit modifications to index files here — those
//      are done in a separate step so the diff is auditable.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, statSync, readdirSync } from 'node:fs';
import { join, relative, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

// 48 final ARCHIVE paths, derived from the audit doc minus the 5 sanity-pass promotes.
const ARCHIVE = [
  // Superseded/archived (11)
  'docs/07-decisions/adr-006-edition-system.md',
  'docs/07-decisions/adr-016-teams-integration.md',
  'docs/07-decisions/adr-018-channel-mention-workflow.md',
  'docs/07-decisions/adr-022-knowledge-layer-architecture.md',
  'docs/07-decisions/adr-024-scouting-report.md',
  'docs/07-decisions/adr-026-knowledge-base-sharepoint-first.md',
  'docs/superpowers/specs/2026-03-17-teams-compliance-audit.md',
  'docs/superpowers/specs/2026-03-23-event-driven-architecture-design.md',
  'docs/superpowers/specs/2026-03-28-process-intelligence-panel-design.md',
  'docs/superpowers/specs/2026-04-01-header-redesign-design.md',
  'docs/superpowers/specs/2026-04-02-improvement-workspace-pdca-design.md',

  // Delivered specs (26, excludes today's agent-docs-architecture spec)
  'docs/superpowers/specs/2026-03-16-ai-integration-evaluation.md',
  'docs/superpowers/specs/2026-03-16-code-review-design.md',
  'docs/superpowers/specs/2026-03-17-navigation-audit.md',
  'docs/superpowers/specs/2026-03-19-knowledge-base-folder-search-design.md',
  'docs/superpowers/specs/2026-03-20-improvement-prioritization-design.md',
  'docs/superpowers/specs/2026-03-20-reporting-workspaces-design.md',
  'docs/superpowers/specs/2026-03-20-yamazumi-analysis-mode-design.md',
  'docs/superpowers/specs/2026-03-22-mode-aware-reports-design.md',
  'docs/superpowers/specs/2026-03-23-architecture-design-exploration.md',
  'docs/superpowers/specs/2026-03-28-dashboard-chrome-redesign.md',
  'docs/superpowers/specs/2026-03-28-process-health-projection-toolbar-design.md',
  'docs/superpowers/specs/2026-03-29-adaptive-boxplot-categories-design.md',
  'docs/superpowers/specs/2026-03-29-capability-mode-coherence-design.md',
  'docs/superpowers/specs/2026-03-29-wide-form-stack-columns-design.md',
  'docs/superpowers/specs/2026-03-30-question-driven-eda-design.md',
  'docs/superpowers/specs/2026-04-01-app-insights-telemetry-design.md',
  'docs/superpowers/specs/2026-04-01-data-view-consolidation-design.md',
  'docs/superpowers/specs/2026-04-01-process-intelligence-panel-redesign.md',
  'docs/superpowers/specs/2026-04-02-improvement-hub-design.md',
  'docs/superpowers/specs/2026-04-02-unified-header-design.md',
  'docs/superpowers/specs/2026-04-02-web-first-implementation-design.md',
  'docs/superpowers/specs/2026-04-03-hmw-brainstorm-modal-design.md',
  'docs/superpowers/specs/2026-04-05-continuous-regression-design.md',
  'docs/superpowers/specs/2026-04-05-coscout-cognitive-redesign-design.md',
  'docs/superpowers/specs/2026-04-07-interaction-effects-design.md',
  'docs/superpowers/specs/2026-04-07-unified-whatif-explorer-design.md',

  // Stale drafts (11)
  'docs/superpowers/specs/2026-03-17-documentation-methodology-upgrade-design.md',
  'docs/superpowers/specs/2026-03-17-navigation-architecture-design.md',
  'docs/superpowers/specs/2026-03-21-analysis-flow-design.md',
  'docs/superpowers/specs/2026-03-21-capability-time-subgrouping.md',
  'docs/superpowers/specs/2026-03-21-yamazumi-reporting-design.md',
  'docs/superpowers/specs/2026-03-22-mobile-ux-improvements-design.md',
  'docs/superpowers/specs/2026-03-22-sharing-continuity-design.md',
  'docs/superpowers/specs/2026-03-24-coscout-knowledge-catalyst-design.md',
  'docs/superpowers/specs/2026-03-29-display-density-design.md',
  'docs/superpowers/specs/2026-03-29-probability-plot-enhancement-design.md',
  'docs/superpowers/specs/2026-04-02-web-first-deployment-architecture-design.md',
];

console.error(`Will archive ${ARCHIVE.length} files.`);

// ---------------------------------------------------------------------------
// 1. Move files via git mv
// ---------------------------------------------------------------------------

function destinationOf(oldPath) {
  if (oldPath.startsWith('docs/07-decisions/')) {
    return oldPath.replace('docs/07-decisions/', 'docs/archive/adrs/');
  }
  if (oldPath.startsWith('docs/superpowers/specs/')) {
    return oldPath.replace('docs/superpowers/specs/', 'docs/archive/specs/');
  }
  throw new Error(`Unhandled source prefix: ${oldPath}`);
}

const moves = ARCHIVE.map((oldPath) => ({ oldPath, newPath: destinationOf(oldPath) }));

// Ensure destination dirs exist
execFileSync('mkdir', ['-p', 'docs/archive/adrs', 'docs/archive/specs'], { cwd: ROOT });

let moved = 0;
let skipped = 0;
for (const { oldPath, newPath } of moves) {
  try {
    statSync(join(ROOT, oldPath));
  } catch {
    skipped++;
    continue; // already moved in a prior run
  }
  execFileSync('git', ['mv', oldPath, newPath], { cwd: ROOT });
  moved++;
}
console.error(`git mv: ${moved} files moved, ${skipped} already in place.`);

// ---------------------------------------------------------------------------
// 2. Rewrite inbound path references
// ---------------------------------------------------------------------------

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (full.includes('/node_modules/') || full.includes('/.astro/')) continue;
      walk(full, out);
    } else out.push(full);
  }
  return out;
}

// Collect .md files in scanning scope
const scanTargets = [];
for (const root of ['docs', '.claude', 'packages', 'apps']) {
  const full = join(ROOT, root);
  try {
    if (!statSync(full).isDirectory()) continue;
    for (const p of walk(full)) {
      const rel = relative(ROOT, p);
      if (!rel.endsWith('.md')) continue;
      if (rel.includes('/node_modules/')) continue;
      // Don't rewrite inside archived files themselves; their internal
      // sibling-links still work (same basenames, same new dir).
      if (rel.startsWith('docs/archive/')) continue;
      scanTargets.push(rel);
    }
  } catch {
    /* dir may not exist */
  }
}
scanTargets.push('CLAUDE.md');

// Build replacement pairs: we only rewrite the path prefix + filename,
// which catches ../07-decisions/foo.md, docs/07-decisions/foo.md, and
// superpowers/specs/foo.md forms uniformly. Same-directory bare-filename
// links (e.g. [foo](adr-024-scouting-report.md) from another ADR) are
// handled by a second pass against known ADR peers only.

const replacements = [];
for (const { oldPath, newPath } of moves) {
  // Path-prefix form: includes at least one parent segment.
  // Old: "07-decisions/adr-024-scouting-report.md"
  // New: "archive/adrs/adr-024-scouting-report.md"
  if (oldPath.startsWith('docs/07-decisions/')) {
    replacements.push({
      find: `07-decisions/${basename(oldPath)}`,
      replace: `archive/adrs/${basename(oldPath)}`,
    });
  } else if (oldPath.startsWith('docs/superpowers/specs/')) {
    replacements.push({
      find: `superpowers/specs/${basename(oldPath)}`,
      replace: `archive/specs/${basename(oldPath)}`,
    });
  }
}

let rewriteCount = 0;
let filesTouched = 0;
for (const src of scanTargets) {
  const fullSrc = join(ROOT, src);
  let content;
  try {
    content = readFileSync(fullSrc, 'utf8');
  } catch {
    continue;
  }
  let next = content;
  for (const { find, replace } of replacements) {
    if (next.includes(find)) {
      const before = next;
      next = next.split(find).join(replace);
      rewriteCount += (before.match(new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || [])
        .length;
    }
  }
  if (next !== content) {
    writeFileSync(fullSrc, next);
    filesTouched++;
  }
}

console.error(`Link rewrites: ${rewriteCount} path occurrences in ${filesTouched} files.`);

// ---------------------------------------------------------------------------
// 3. Pass 2: same-directory ADR→ADR bare-filename links
// Only matters between ADRs still in docs/07-decisions/ and archived ADRs.
// ---------------------------------------------------------------------------

const archivedAdrBasenames = moves
  .filter((m) => m.oldPath.startsWith('docs/07-decisions/'))
  .map((m) => basename(m.oldPath));

if (archivedAdrBasenames.length > 0) {
  const remainingAdrs = walk(join(ROOT, 'docs/07-decisions'))
    .map((p) => relative(ROOT, p))
    .filter((p) => p.endsWith('.md'));
  let sameDirRewrites = 0;
  for (const src of remainingAdrs) {
    const fullSrc = join(ROOT, src);
    let content = readFileSync(fullSrc, 'utf8');
    let changed = false;
    for (const bn of archivedAdrBasenames) {
      // Match markdown link with bare filename: `](adr-024-...md)` or `](./adr-024-...md)`
      const re = new RegExp(`\\]\\((?:\\./)?${bn.replace(/\./g, '\\.')}(#[^)]*)?\\)`, 'g');
      content = content.replace(re, (_, anchor = '') => {
        changed = true;
        sameDirRewrites++;
        return `](../archive/adrs/${bn}${anchor})`;
      });
    }
    if (changed) writeFileSync(fullSrc, content);
  }
  console.error(`Same-dir ADR link rewrites: ${sameDirRewrites}.`);
}

// Same-dir handling for archived specs → remaining specs directory is symmetric,
// but most spec→spec links already include the "superpowers/specs/" prefix (they
// come through the index). Skipping unless dead-link check surfaces issues.

console.error('Done. Review `git status` and run `pnpm docs:check` before committing.');
