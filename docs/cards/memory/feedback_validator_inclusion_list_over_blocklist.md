---
title: 'validator-scoping-inclusion-list-beats-blocklist-regex'
description: 'When scoping a check to "some docs but not others," prefer an explicit inclusion list (SCAN_DIRS = [path, path, ...]) over fragile blocklist regexes. Naturally excludes new paths without manual updates.'
purpose: remember
tier: card
status: active
date: 2026-05-28
topic: [memory, feedback]
related: []
verified-against-commit: ca45f469
last-verified: 2026-05-28
source-hash: 3a2255f5f1a36d78
origin-session-id: 13c73b5c-5fab-4479-8057-97ef01761732
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_validator_inclusion_list_over_blocklist.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

# Validator scoping: inclusion list beats blocklist regex

**Rule**: when writing a script that walks a corpus selectively (validators, drift detectors, generators), define scope as an **explicit inclusion list of paths**, not as "walk everything and exclude these via regex."

**Why**: blocklist regexes are fragile + grow over time:
- Every new doc-type folder needs a new exclusion entry, or it gets accidentally scanned.
- Negative-match regex is harder to reason about than "what's in scope."
- Exclusions accumulate as the corpus evolves; the original rationale gets lost in regex string growth.

Inclusion lists naturally exclude paths the script wasn't designed for. New folders (`docs/experiments/`, `docs/cards/<new-type>/`, etc.) don't accidentally get scanned. Adding to scope is a deliberate one-line addition.

**Where it shipped (Phase 3 PR B, 2026-05-18)**: `scripts/docs-steward.mjs`:

```js
const SCAN_DIRS = [
  'docs/cards/decisions',
  'docs/cards/investigations',
  'docs/cards/memory',
  'docs/07-decisions',
  'docs/superpowers/specs',
];
```

`docs/decision-log.md` (generated aggregate), `docs/archive/**` (frozen historical), `docs/ephemeral/**` (active work-in-progress, not stewarded) are all naturally excluded. Zero blocklist regex.

Opus reviewer's praise (Phase 3 PR B final review): "Substrate exclusions correct by construction. Scope is an inclusion list. `docs/decision-log.md`, `docs/archive/**`, `docs/ephemeral/**` all naturally excluded — no fragile blocklist regexes."

**Counter-example**: `scripts/check-dead-links.sh` + `scripts/check-diagram-health.sh` use blocklist exclusions (`[[ "$file" == */archive/* ]] && continue`; `[[ "$file" == */cards/* ]] && continue`). That's because they walk the full corpus and exclude select sources. The cards exclusion had to be added in Phase 3 PR A's followup commit — exactly the "every new folder needs a new exclusion" pain. The Steward avoided that by design.

**When to apply**:
- New validators / drift detectors / corpus walkers.
- Any script where "what's in scope" is a smaller set than "what's in the tree."

**When NOT to apply**:
- Existing scripts that already use blocklist patterns — refactoring isn't worth it unless the blocklist is growing painfully.
- Scripts that genuinely want to walk everything except a few well-known exclusions (e.g., `node_modules/`, `.git/`) — blocklist is fine there.

Related: [[project_phase3_cards_substrate]], [[feedback_cards_queryable_not_navigated]]
