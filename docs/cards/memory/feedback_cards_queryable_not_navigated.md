---
title: 'atomic-cards-queryable-substrate-not-a-navigation-surface'
description: 'Cards under docs/cards/ inherit prose-link refs from source bulk files; don''t path-rewrite. Validators skip cards as link source. Discover via toolbox (find/get/related), not by clicking prose links.'
purpose: remember
tier: card
status: active
date: 2026-05-28
topic: [memory, feedback]
related: []
verified-against-commit: ca45f469
last-verified: 2026-05-28
source-hash: f1c57fe6cc72ec50
origin-session-id: 13c73b5c-5fab-4479-8057-97ef01761732
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_cards_queryable_not_navigated.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

# Atomic cards: queryable substrate, not a navigation surface

**Rule**: when decomposing a monolithic bulk file (`decision-log.md`, `investigations.md`, memory atoms) into atomic cards, **do NOT rewrite prose-link paths** in the card bodies. Cards inherit whatever path-shapes the source had. The dead-link validator must skip cards as a link source.

**Why**: cards are discovered via:
- `pnpm docs:find` (frontmatter filter),
- `pnpm docs:get <id>` (basename id resolution),
- `pnpm docs:related <id>` (forward + backward graph via frontmatter `related:` + body `[[wikilinks]]`).

NOT by clicking prose links inside a card body. The prose links inherited from the source decision-log/investigations are CONTEXT, not navigation primitives. Validating them file-relative from each card location would require path-rewriting in every decompose script — expensive + error-prone + provides zero user value.

**Where it shipped (Phase 3, 2026-05-18)**:
- `scripts/check-dead-links.sh` line ~22: `*/docs/cards/*) continue ;;` (mirrors the `*/docs/archive/*` exclusion pattern).
- `scripts/check-diagram-health.sh`: same exclusion in both incremental + full mode (orphan check + broken cross-ref check).
- Cards ARE still frontmatter-validated by `check-doc-frontmatter.mjs` — only the prose-link checks skip them.

**Trade-off acknowledged**: opening a card and clicking a relative link inside it can dead-end (the link was resolvable from the source's location, not from `docs/cards/<type>/<file>.md`). This is OK because cards are an atomic substrate — users land on them via the toolbox, not by clicking through.

**When to apply**:
- Any atomic-decomposition / mirror script that pulls content from a parent doc with different file-relative path semantics.
- Any "queryable hash-map" doc layer where frontmatter + wikilinks are the discovery vehicle.

**When NOT to apply**:
- Hand-authored docs meant to be read top-to-bottom (specs, ADRs, guides). Path integrity matters there.
- Aggregate views generated FROM cards (e.g., `decision-log.md` post-rebuild — that ONE file's links should resolve because it's the navigable surface that 61+ inbound refs point at).

**Counter-pattern flagged in Phase 3 A5**: `decompose-investigations.mjs` emits `docs/ephemeral/investigations.md` (the OPEN queue) which IS a navigated surface — there, path-rewriting (`superpowers/X` → `../superpowers/X`) is required because the file moved one directory deeper. Distinguish: cards = no rewrite; ephemeral nav-surface = rewrite.

Related: [[project_phase3_cards_substrate]], [[project_docs_strategy_2026]], [[feedback_validator_inclusion_list_over_blocklist]]
