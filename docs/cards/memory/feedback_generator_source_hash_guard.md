---
title: 'generator-scripts-source-hash-guard-prevents-re-stamp-churn'
description: 'When a generator stamps verified-against-commit / last-verified on output, also stamp a content-hash field; skip rewrite when source unchanged. Prevents downstream drift detectors flagging machine churn.'
purpose: remember
tier: card
status: active
date: 2026-05-28
topic: [memory, feedback]
related: []
verified-against-commit: ca45f469
last-verified: 2026-05-28
source-hash: f7bd199a8ee4bee4
origin-session-id: 13c73b5c-5fab-4479-8057-97ef01761732
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_generator_source_hash_guard.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

# Generator scripts: source-hash guard prevents re-stamp churn

**Rule**: when a generator script writes output files that include `verified-against-commit: <HEAD-sha>` or `last-verified: <today>` frontmatter, ALSO stamp a `source-hash: <sha256-prefix>` field. On subsequent runs, read the existing output's `source-hash`, compute the current source hash, and SHORT-CIRCUIT the rewrite if they match.

**Why**: Without the guard, every generator run produces "new" output (because the auto-stamped fields update), so drift detectors (Steward, `--diff` mode, git status) flag the output as changed even when the source content is identical. After 30+ commits behind a stale stamp, the doc starts appearing in stale-card reports as a false positive. This pollutes the report and undermines trust in the drift signal.

**Where it shipped**: `scripts/docs/sync-memory-cards.mjs` (Phase 3 F1 followup, 2026-05-18). 16-char sha256 prefix of raw source bytes. After the migration commit that introduced the field, second consecutive `pnpm docs:rebuild` reports `"Synced 0 memory atoms, 181 unchanged (hash match)"`.

**How to apply**:

```js
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';

function sourceHash(srcPath) {
  return createHash('sha256').update(readFileSync(srcPath)).digest('hex').slice(0, 16);
}

function readExistingSourceHash(outPath) {
  if (!existsSync(outPath)) return null;
  try {
    const raw = readFileSync(outPath, 'utf8');
    const m = raw.match(/^source-hash:\s*([a-f0-9]+)\s*$/m);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

// In the per-file loop:
const srcHash = sourceHash(srcPath);
const existingHash = readExistingSourceHash(outPath);
if (existingHash === srcHash) {
  unchanged += 1;
  continue;
}
// ...write fresh output with `source-hash: ${srcHash}` in frontmatter...
```

**When to use**:
- Any mirror/sync script that stamps `verified-against-commit` or `last-verified` on output.
- Any generator whose output is consumed by a drift detector (Steward, freshness checks, `--diff` validators).
- When prettier or other formatters would otherwise see machine-stamped fields as edits.

**When NOT needed**:
- One-shot migration scripts that run once + are then retired.
- Generators whose output doesn't carry any auto-stamped fields (e.g., gen-arch produces fresh markdown each time but no `verified-against-commit`).

**Related concerns**: the `verified-against-commit` field is the Steward's drift sensor. Without the hash-guard, the field churns on every rebuild and Steward false-positives every doc whose generator re-stamp commit is now >30 commits old.

Related: [[project_phase3_cards_substrate]], [[project_docs_strategy_2026]], [[feedback_autogen_doc_prettierignore]]
