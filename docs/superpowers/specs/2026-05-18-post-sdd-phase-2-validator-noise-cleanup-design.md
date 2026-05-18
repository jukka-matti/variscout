---
title: 'Post-SDD Phase 2 — Validator noise cleanup'
purpose: design
tier: living
status: draft
audience: human
layer: spec
implements:
  - docs/agent-context/doc-discipline.md
  - scripts/docs-frontmatter-schema.mjs
  - scripts/docs-frontmatter-fix.mjs
  - docs/cards/investigations/inv-20260518-sdd-migration-inventory.md
last-reviewed: 2026-05-18
---

# Post-SDD Phase 2 — Validator noise cleanup

## Context

Phase 1 (post-SDD quick wins) shipped. Validator state is green for HARD-FAILs but still surfaces **65 transitional alias warnings** (old STATUS values like `stable` aliased to `active`; old AUDIENCE values like `developer`/`analyst` aliased to `human`) and **36 intent-diagram WARNs** (legitimate next-edit work, NOT noise).

The plan's original Phase 2 hypothesis was that `docs/archive/specs/**` would need allowlist exemption for missing `implements:`. **That premise was wrong**: the validator's `errorSpecMissingImplements` check is already scoped to `docs/superpowers/specs/` (active specs only) — archive specs are exempt by location, no allowlist needed.

What IS noise: the 65 transitional aliases. `scripts/docs-frontmatter-fix.mjs` exists as a one-shot codemod to resolve them (ADR-083). After 2026-05-15, the validator's transitional-alias period was supposed to end but the cleanup never ran. Phase 2 runs it.

## Deltas

### Delta 1 — Run `scripts/docs-frontmatter-fix.mjs --apply`

The codemod normalizes:

- **Lowercase STATUS values** (`Accepted` → `accepted`)
- **STATUS alias map** (`stable`/`living`/`deferred`/etc. → canonical `active`/`superseded`)
- **AUDIENCE alias map** (`developer`/`engineer`/`analyst`/etc. → `human`)
- **Resolve adr-024's "Superseded by ADR-037" anomaly**
- **Add minimal frontmatter** to 3 bare plan files
- **Backfill `purpose:` + `tier:`** based on path heuristics (ADR-083)
- **Add `archived-on` + `archived-reason`** to docs in `docs/archive/`

Dry-run output (2026-05-18) shows ~50 file touches across `docs/archive/`, `docs/superpowers/plans/`, `docs/superpowers/specs/` (touching 4 spec files that need purpose/tier backfill).

### Delta 2 — Update M0 inventory card with Phase 2 result

Append Phase 2 entry to the Execution log section. Document that the original "allowlist for archive specs" premise was wrong, and the actual work was the long-deferred alias codemod.

### Delta 3 — No changes to validator or doc-discipline

Validated: existing rules are correctly scoped. The 36 intent-diagram WARNs are all legitimate next-edit work (Phase 3 closes them). The `errorSpecMissingImplements` HARD-FAIL is already scoped to active specs only.

`scripts/docs-frontmatter-schema.mjs` and `docs/agent-context/doc-discipline.md` are listed in `implements:` for the documentation cross-link only — no edits needed.

## Out of scope

- Intent-diagram fills for the 24 stubs (Phase 3 work).
- Structural cleanup of legacy dirs (Phase 4 work).
- Pruning the `STATUS_ALIAS_MAP` / `AUDIENCE_ALIAS_MAP` from `docs-frontmatter-schema.mjs` (low priority — keeps backward-compat for any unknown edge cases).

## Acceptance signals

- `pnpm docs:check` reports **0 aliased status warnings** (was 5)
- `pnpm docs:check` reports **0 aliased audience warnings** (was 60)
- Only the 36 intent-diagram WARNs remain (Phase 3 scope)
- No `errorBrokenImplementsPath` violations introduced by the codemod

## Dogfood note

Phase 2 is small (~50 mechanical edits via codemod + 2 doc updates). The SDD lifecycle still applies: spec lands with implements:, codemod runs (= Apply), validate, commit, archive spec.
