#!/usr/bin/env node
// Stamp '(archived 2026-04-17 → archive/...)' on index rows for the
// 48 archived docs. Preserves the row (don't delete history).

import { readFileSync, writeFileSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

// Paths from the archive script, in the same order.
const ARCHIVED_ADR_BASENAMES = [
  'adr-006-edition-system.md',
  'adr-016-teams-integration.md',
  'adr-018-channel-mention-workflow.md',
  'adr-022-knowledge-layer-architecture.md',
  'adr-024-scouting-report.md',
  'adr-026-knowledge-base-sharepoint-first.md',
];

const ARCHIVED_SPEC_BASENAMES = [
  '2026-03-17-teams-compliance-audit.md',
  '2026-03-23-event-driven-architecture-design.md',
  '2026-03-28-process-intelligence-panel-design.md',
  '2026-04-01-header-redesign-design.md',
  '2026-04-02-improvement-workspace-pdca-design.md',
  '2026-03-16-ai-integration-evaluation.md',
  '2026-03-16-code-review-design.md',
  '2026-03-17-navigation-audit.md',
  '2026-03-19-knowledge-base-folder-search-design.md',
  '2026-03-20-improvement-prioritization-design.md',
  '2026-03-20-reporting-workspaces-design.md',
  '2026-03-20-yamazumi-analysis-mode-design.md',
  '2026-03-22-mode-aware-reports-design.md',
  '2026-03-23-architecture-design-exploration.md',
  '2026-03-28-dashboard-chrome-redesign.md',
  '2026-03-28-process-health-projection-toolbar-design.md',
  '2026-03-29-adaptive-boxplot-categories-design.md',
  '2026-03-29-capability-mode-coherence-design.md',
  '2026-03-29-wide-form-stack-columns-design.md',
  '2026-03-30-question-driven-eda-design.md',
  '2026-04-01-app-insights-telemetry-design.md',
  '2026-04-01-data-view-consolidation-design.md',
  '2026-04-01-process-intelligence-panel-redesign.md',
  '2026-04-02-improvement-hub-design.md',
  '2026-04-02-unified-header-design.md',
  '2026-04-02-web-first-implementation-design.md',
  '2026-04-03-hmw-brainstorm-modal-design.md',
  '2026-04-05-continuous-regression-design.md',
  '2026-04-05-coscout-cognitive-redesign-design.md',
  '2026-04-07-interaction-effects-design.md',
  '2026-04-07-unified-whatif-explorer-design.md',
  '2026-03-17-documentation-methodology-upgrade-design.md',
  '2026-03-17-navigation-architecture-design.md',
  '2026-03-21-analysis-flow-design.md',
  '2026-03-21-capability-time-subgrouping.md',
  '2026-03-21-yamazumi-reporting-design.md',
  '2026-03-22-mobile-ux-improvements-design.md',
  '2026-03-22-sharing-continuity-design.md',
  '2026-03-24-coscout-knowledge-catalyst-design.md',
  '2026-03-29-display-density-design.md',
  '2026-03-29-probability-plot-enhancement-design.md',
  '2026-04-02-web-first-deployment-architecture-design.md',
];

function stampIndex(indexPath, basenames, archiveSubdir) {
  const fullPath = join(ROOT, indexPath);
  let content = readFileSync(fullPath, 'utf8');
  let stamped = 0;

  for (const bn of basenames) {
    const archiveRef = `archive/${archiveSubdir}/${bn}`;
    // Per-line guard prevents double-stamping; don't global-guard
    // (global guard skips later rows once any row has been stamped).
    const lines = content.split('\n');
    let matched = false;
    const updated = lines.map((line) => {
      // Only touch table rows for this basename.
      if (!line.startsWith('|')) return line;
      if (!line.includes(bn)) return line;
      if (line.includes('(archived 2026-04-17')) return line;

      // Rewrite live-path link to archive path if present.
      let next = line;
      if (line.includes('07-decisions/')) {
        next = next.split(`07-decisions/${bn}`).join(archiveRef);
      }
      if (line.includes('superpowers/specs/')) {
        next = next.split(`superpowers/specs/${bn}`).join(archiveRef);
      }
      // For bare same-dir links in the specs index (e.g. [foo](foo.md)):
      next = next.replace(new RegExp(`\\]\\((?:\\./)?${bn.replace(/\./g, '\\.')}\\)`, 'g'),
        `](../${archiveRef})`);
      // Bare filename form (no link brackets): leave the text but suffix.
      // The suffix itself signals archive.

      // Append suffix to whatever sits in the last cell of the row.
      //   "| ... | Status |" → "| ... | Status (archived 2026-04-17 → archive/.../foo.md) |"
      const suffix = ` (archived 2026-04-17 → ${archiveRef})`;
      next = next.replace(/\s*\|\s*$/, `${suffix} |`);

      stamped++;
      matched = true;
      return next;
    });
    if (matched) content = updated.join('\n');
    else console.warn(`  ⚠ index row not found for ${bn}`);
  }

  writeFileSync(fullPath, content);
  console.error(`${indexPath}: stamped ${stamped} rows.`);
}

stampIndex('docs/07-decisions/index.md', ARCHIVED_ADR_BASENAMES, 'adrs');
stampIndex('docs/superpowers/specs/index.md', ARCHIVED_SPEC_BASENAMES, 'specs');
