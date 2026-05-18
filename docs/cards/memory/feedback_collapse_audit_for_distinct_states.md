---
title: 'feedback-collapse-audit-for-distinct-states'
description: 'When collapsing schema enums (status, category, type), audit the corpus first for values that don''t have a clean canonical-target. Those values often earn their keep as distinct states — aliasing them to a near-fit overstates/understates the actual semantics.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: f02211886eea91f5
origin-session-id: 6b6ea222-9daf-42ab-b211-7ad309428640
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_collapse_audit_for_distinct_states.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

# Audit before collapsing enums — preserve distinct states

When collapsing a schema enum (e.g., 22 STATUS values → 4 canonical), the temptation is to map every legacy value to one of the new values via alias map. But sometimes a value represents a GENUINELY DISTINCT lifecycle state that doesn't fit any of the new canonical targets. Aliasing those forces a semantic mis-label.

**The right move**: AUDIT the corpus before collapsing. For each legacy enum value, ask:
1. Does it have a clean semantic equivalent in the new canonical set?
2. If yes → alias map entry
3. If no → either ADD it to the canonical set (if widely used) or REVIEW its usage and reclassify per-doc (if rare)

**Why**: 2026-05-17 session — collapsed STATUS from 22 → 4 (`draft, active, superseded, archived`) via alias map. 8 docs at `docs/01-vision/variscout-process/` used `status: 'named-future'` (legacy value for aspirational/conditional commitments). My alias map mapped `named-future → active` since "they're being maintained". User pushed back: "those are not active, they are for future, if VariScout has +500 customers!" — the alias OVERSTATED commitment. `named-future` is genuinely distinct: not actively designed, not superseded, not archived, not draft. Promoted to a 5th canonical STATUS value. 22 → 5 reduction is still substantial; the extra value earns its keep because the corpus has docs that GENUINELY need that distinction.

**How to apply**:
- Before any enum collapse PR, run a quick `grep -r "status:" docs/ | sort | uniq -c` (or equivalent) to enumerate ACTUAL legacy values + counts
- For each legacy value, check the docs USING it: does the new alias target accurately describe their state?
- If "almost but not quite" → DON'T alias; either add to canonical or audit each doc individually
- Document the rationale per alias map entry in the schema file (helps future maintainers)
- After the collapse ships, run validator + check for transitional warnings; resolve any that surface unexpected legacy values

**Examples of legitimate add-to-canonical**:
- `named-future` (aspirational/conditional, not in active design)
- `experimental` (active but explicitly unstable)
- `deprecated` (still works but flagged for removal — different from `superseded` which implies replacement)
- `draft-rfc` (proposal stage, distinct from `draft` which implies in-progress design)

**Counter-signal (alias is fine)**:
- The legacy value is just a naming variant: `accepted` → `active`, `delivered` → `active`, `living` → `active` — all describe "in use"
- The legacy value is genuinely unused or close to it (1-2 docs out of 500)
- The new canonical value captures the semantic intent fully (just different word)

Related: [[project_eight_purpose_taxonomy]] (the STATUS collapse documented), [[project_docs_strategy_2026]] (where the named-future correction landed).
