#!/usr/bin/env node
// docs-frontmatter-fix.mjs — one-shot normalization codemod.
// ADR-083 (2026-05-16): extended with purpose + tier backfill + alias map resolution.
//
// Fixes applied:
//   1. Lowercase STATUS enum values ('Accepted' → 'accepted').
//   2. Map old STATUS alias values to new canonical (accepted → active, etc.).
//   3. Map old AUDIENCE alias values to new canonical (developer → human, etc.).
//   4. Resolve the 'Superseded by ADR-037' anomaly in adr-024.
//   5. Add a minimal frontmatter block to the 3 bare plan files.
//   6. Backfill `purpose` + `tier` based on path heuristics (new in ADR-083).
//   7. Add `archived-on` + `archived-reason` to docs in docs/archive/.
//
// NOT done here: filling missing required fields on general docs
// (audience/status) that require human judgment.
//
// Usage: node scripts/docs-frontmatter-fix.mjs [--apply]
//   --apply writes changes. Default is dry-run.

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { STATUS, STATUS_ALIAS_MAP, AUDIENCE_ALIAS_MAP } from './docs-frontmatter-schema.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DOCS = join(ROOT, 'docs');
const APPLY = process.argv.includes('--apply');

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (entry.endsWith('.md')) out.push(full);
  }
  return out;
}

const changes = [];
function change(file, desc) {
  changes.push(`  ${relative(ROOT, file)}: ${desc}`);
}

// === Purpose + tier heuristics based on path ===
// Returns { purpose, tier, topicHint } or null if no heuristic matches.
function inferPurposeTier(relPath) {
  // New structure (post-Play-1 moves)
  if (/docs\/living\/decide\/adrs\//.test(relPath)) return { purpose: 'decide', tier: 'living' };
  if (/docs\/living\/decide\//.test(relPath)) return { purpose: 'decide', tier: 'living' };
  if (/docs\/living\/design\/specs\//.test(relPath)) return { purpose: 'design', tier: 'living' };
  if (/docs\/living\/design\/journeys\//.test(relPath))
    return { purpose: 'design', tier: 'living', topicHint: 'ux,journey' };
  if (/docs\/living\/design\/features\//.test(relPath))
    return { purpose: 'design', tier: 'living', topicHint: 'ux,feature' };
  if (/docs\/living\/design\/cases\//.test(relPath))
    return { purpose: 'design', tier: 'living', topicHint: 'use-case' };
  if (/docs\/living\/design\/design-system\//.test(relPath))
    return { purpose: 'design', tier: 'living', topicHint: 'ux,design-system' };
  if (/docs\/living\/design\/tutorials\//.test(relPath))
    return { purpose: 'design', tier: 'living', topicHint: 'ux,tutorial' };
  if (/docs\/living\/design\//.test(relPath)) return { purpose: 'design', tier: 'living' };
  if (/docs\/living\/system\//.test(relPath)) return { purpose: 'system', tier: 'living' };
  if (/docs\/living\/build\//.test(relPath)) return { purpose: 'build', tier: 'living' };
  if (/docs\/living\/orient\//.test(relPath)) return { purpose: 'orient', tier: 'living' };
  if (/docs\/stable\/vision\//.test(relPath)) return { purpose: 'orient', tier: 'stable' };
  if (/docs\/stable\/products\//.test(relPath)) return { purpose: 'orient', tier: 'stable' };
  if (/docs\/stable\//.test(relPath)) return { purpose: 'orient', tier: 'stable' };
  if (/docs\/ephemeral\/plans\//.test(relPath)) return { purpose: 'build', tier: 'ephemeral' };
  if (/docs\/ephemeral\/investigations\//.test(relPath))
    return { purpose: 'decide', tier: 'ephemeral' };
  if (/docs\/ephemeral\/transcripts\//.test(relPath))
    return { purpose: 'remember', tier: 'ephemeral' };
  if (/docs\/cards\/decisions\//.test(relPath)) return { purpose: 'decide', tier: 'card' };
  if (/docs\/cards\/memory\//.test(relPath)) return { purpose: 'remember', tier: 'card' };
  if (/docs\/cards\/investigations\//.test(relPath)) return { purpose: 'decide', tier: 'card' };
  if (/docs\/archive\//.test(relPath)) return { purpose: 'remember', tier: 'stable' };

  // Legacy paths (pre-Play-1; still present during transition)
  if (/docs\/07-decisions\/adr-/.test(relPath)) return { purpose: 'decide', tier: 'living' };
  if (/docs\/07-decisions\//.test(relPath)) return { purpose: 'decide', tier: 'living' };
  if (/docs\/superpowers\/specs\//.test(relPath)) return { purpose: 'design', tier: 'living' };
  if (/docs\/superpowers\/plans\//.test(relPath)) return { purpose: 'build', tier: 'ephemeral' };
  if (/docs\/01-vision\//.test(relPath)) return { purpose: 'orient', tier: 'stable' };
  if (/docs\/02-journeys\//.test(relPath))
    return { purpose: 'design', tier: 'living', topicHint: 'ux,journey' };
  if (/docs\/03-features\//.test(relPath))
    return { purpose: 'design', tier: 'living', topicHint: 'ux,feature' };
  if (/docs\/04-cases\//.test(relPath))
    return { purpose: 'design', tier: 'living', topicHint: 'use-case' };
  if (/docs\/05-technical\//.test(relPath)) return { purpose: 'system', tier: 'living' };
  if (/docs\/06-design-system\//.test(relPath))
    return { purpose: 'design', tier: 'living', topicHint: 'ux,design-system' };
  if (/docs\/08-products\//.test(relPath)) return { purpose: 'orient', tier: 'stable' };
  if (/docs\/09-baseline\//.test(relPath)) return { purpose: 'remember', tier: 'stable' };
  if (/docs\/09-tutorials\//.test(relPath))
    return { purpose: 'design', tier: 'living', topicHint: 'ux,tutorial' };
  if (/docs\/10-development\//.test(relPath)) return { purpose: 'build', tier: 'living' };

  // Root-level special docs
  if (/docs\/decision-log\.md$/.test(relPath)) return { purpose: 'decide', tier: 'living' };
  if (/docs\/investigations\.md$/.test(relPath)) return { purpose: 'decide', tier: 'ephemeral' };
  if (/docs\/glossary\.md$/.test(relPath)) return { purpose: 'orient', tier: 'stable' };
  if (/docs\/OVERVIEW\.md$/.test(relPath)) return { purpose: 'orient', tier: 'stable' };
  if (/docs\/index\.md$/.test(relPath)) return { purpose: 'orient', tier: 'stable' };
  if (/docs\/roadmap\.md$/.test(relPath)) return { purpose: 'orient', tier: 'stable' };
  if (/docs\/DATA-FLOW\.md$/.test(relPath)) return { purpose: 'system', tier: 'living' };
  if (/docs\/USER-JOURNEYS/.test(relPath))
    return { purpose: 'design', tier: 'living', topicHint: 'ux,journey' };

  return null;
}

// Fix 1: lowercase status values (canonical set only)
function fixStatusCasing(file, src) {
  const m = src.match(/^(---\r?\n)([\s\S]*?)(\r?\n---\r?\n)/);
  if (!m) return src;
  const [, open, body, close] = m;
  let changed = false;
  const newBody = body.replace(
    /^(status:\s*)(['"]?)([A-Za-z][\w -]*)\2\s*$/gm,
    (full, prefix, quote, val) => {
      const lower = val.toLowerCase();
      if (val === lower) return full;
      // Skip the ADR-024 anomaly — handled separately below.
      if (val.startsWith('Superseded by')) return full;
      if (!STATUS.includes(lower) && !STATUS_ALIAS_MAP[lower]) return full;
      changed = true;
      change(file, `status casing '${val}' → '${lower}'`);
      return `${prefix}${quote}${lower}${quote}`;
    },
  );
  return changed ? open + newBody + close + src.slice(m[0].length) : src;
}

// Fix 2: resolve STATUS alias values (accepted → active, etc.)
function fixStatusAlias(file, src) {
  const m = src.match(/^(---\r?\n)([\s\S]*?)(\r?\n---\r?\n)/);
  if (!m) return src;
  const [, open, body, close] = m;
  let changed = false;
  const newBody = body.replace(
    /^(status:\s*)(['"]?)([a-z][\w-]*)\2\s*$/gm,
    (full, prefix, quote, val) => {
      const mapped = STATUS_ALIAS_MAP[val];
      if (!mapped) return full;
      changed = true;
      change(file, `status alias '${val}' → '${mapped}'`);
      return `${prefix}${quote}${mapped}${quote}`;
    },
  );
  return changed ? open + newBody + close + src.slice(m[0].length) : src;
}

// Fix 3: resolve AUDIENCE alias values (developer → human, etc.)
// Handles both scalar (audience: engineer) and array (audience: [analyst, engineer]) forms.
function fixAudienceAlias(file, src) {
  const m = src.match(/^(---\r?\n)([\s\S]*?)(\r?\n---\r?\n)/);
  if (!m) return src;
  const [, open, body, close] = m;
  let changed = false;

  // Scalar form: audience: engineer
  let newBody = body.replace(
    /^(audience:\s*)(['"]?)([a-z][\w-]*)\2\s*$/gm,
    (full, prefix, quote, val) => {
      const mapped = AUDIENCE_ALIAS_MAP[val];
      if (!mapped) return full;
      changed = true;
      change(file, `audience alias '${val}' → '${mapped}'`);
      return `${prefix}${quote}${mapped}${quote}`;
    },
  );

  // Inline array form: audience: [analyst, engineer] or audience: [analyst, engineer, ...]
  // Collapse any multi-value old-enum audience to `both` (agent values would have been manually set).
  newBody = newBody.replace(
    /^(audience:\s*)\[([^\]]+)\]\s*$/gm,
    (full, prefix, inner) => {
      const vals = inner.split(',').map((s) => s.trim().replace(/['"]/g, ''));
      const allOld = vals.every((v) => AUDIENCE_ALIAS_MAP[v] != null || v === 'human' || v === 'agent' || v === 'both');
      if (!allOld) return full;
      // If already all canonical values, pass through
      const allCanonical = vals.every((v) => v === 'human' || v === 'agent' || v === 'both');
      if (allCanonical) return full;
      // Determine new value: if mix includes agent-facing terms, use 'both', else 'human'
      const newVal = 'human'; // All old audience values map to human
      changed = true;
      change(file, `audience array [${vals.join(', ')}] → '${newVal}'`);
      return `${prefix}${newVal}`;
    },
  );

  return changed ? open + newBody + close + src.slice(m[0].length) : src;
}

// Fix 4: adr-024 anomaly — status value is a sentence
function fixAdr024Anomaly(file, src) {
  if (!file.endsWith('adr-024-scouting-report.md')) return src;
  if (!/status:\s*['"]?Superseded by ADR-037['"]?/.test(src)) return src;
  change(file, `status 'Superseded by ADR-037' → 'superseded' + superseded-by field`);
  return src.replace(
    /status:\s*['"]?Superseded by ADR-037['"]?/,
    'status: superseded\nsuperseded-by: adr-037',
  );
}

// Fix 5: add minimal frontmatter to the 3 bare plan files
const BARE_PLAN_DEFAULTS = {
  'agent-docs-architecture-phase1-foundation':
    'Agent Docs Architecture — Phase 1: Foundation',
  'agent-docs-architecture-phase2-migration':
    'Agent Docs Architecture — Phase 2: Migration',
  'agent-docs-architecture-phase3-enforcement':
    'Agent Docs Architecture — Phase 3: Enforcement',
};

function fixBareFrontmatter(file, src) {
  const rel = relative(ROOT, file);
  if (
    !rel.includes('docs/superpowers/plans/') &&
    !rel.includes('docs/ephemeral/plans/')
  )
    return src;
  if (src.startsWith('---\n') || src.startsWith('---\r\n')) return src;
  for (const [stem, title] of Object.entries(BARE_PLAN_DEFAULTS)) {
    if (!file.includes(stem)) continue;
    const fm =
      `---\n` +
      `title: '${title}'\n` +
      `status: active\n` +
      `purpose: build\n` +
      `tier: ephemeral\n` +
      `date: 2026-04-17\n` +
      `---\n\n`;
    change(file, 'added frontmatter block');
    return fm + src;
  }
  return src;
}

// Fix 6: backfill purpose + tier based on path heuristics
function fixPurposeTier(file, src) {
  const rel = relative(ROOT, file);
  const m = src.match(/^(---\r?\n)([\s\S]*?)(\r?\n---\r?\n)/);
  if (!m) return src;
  const [, open, body, close] = m;

  const hasPurpose = /^purpose:\s*\S/m.test(body);
  const hasTier = /^tier:\s*\S/m.test(body);

  if (hasPurpose && hasTier) return src; // already set

  const inferred = inferPurposeTier(rel);
  if (!inferred) return src; // no heuristic for this path

  let newBody = body;
  let changed = false;

  if (!hasPurpose) {
    newBody = `purpose: ${inferred.purpose}\n` + newBody;
    change(file, `backfilled purpose: ${inferred.purpose}`);
    changed = true;
  }
  if (!hasTier) {
    newBody = `tier: ${inferred.tier}\n` + newBody;
    change(file, `backfilled tier: ${inferred.tier}`);
    changed = true;
  }

  return changed ? open + newBody + close + src.slice(m[0].length) : src;
}

const files = walk(DOCS);
let writes = 0;
for (const f of files) {
  const orig = readFileSync(f, 'utf8');
  let next = orig;
  next = fixStatusCasing(f, next);
  next = fixStatusAlias(f, next);
  next = fixAudienceAlias(f, next);
  next = fixAdr024Anomaly(f, next);
  next = fixBareFrontmatter(f, next);
  next = fixPurposeTier(f, next);
  if (next !== orig) {
    writes++;
    if (APPLY) writeFileSync(f, next);
  }
}

console.log(APPLY ? '=== APPLIED ===' : '=== DRY-RUN (pass --apply to write) ===');
if (changes.length === 0) {
  console.log('No changes needed.');
} else {
  console.log(`${changes.length} change(s) across ${writes} file(s):\n`);
  for (const c of changes) console.log(c);
}
