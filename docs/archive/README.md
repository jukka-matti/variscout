---
title: 'Archive'
audience: [engineer, architect]
category: reference
status: reference
related: [doc-prune-audit, agent-docs-architecture]
last-reviewed: 2026-04-17
---

# Archive — historical ADRs and specs

This folder holds ADRs and design specs that are **no longer load-bearing** but are preserved for historical context, audit trails, and "why did we decide X" traceability.

## Why this folder exists (v2)

The previous `docs/archive/` was deleted in Phase 3 of the agent-docs architecture migration because it had grown into a graveyard with no curation — entries were added but never reviewed, and the folder itself had no stated purpose. That cleanup was correct at the time.

This v2 archive is different:

- **Every file here has a reason**. Each was archived on a specific date through an audited process (see `docs/09-baseline/2026-04-17-doc-audit.md`).
- **Supersedes chains are preserved**. If ADR-024 is here because ADR-037 replaced it, the `(archived)` suffix in `docs/07-decisions/index.md` points to both the archive path and the successor.
- **No silent re-homing**. Anything moved here gets an index entry update in the same commit; nothing lands here implicitly.

## Layout

- `adrs/` — archived Architecture Decision Records (superseded decisions, reference-only).
- `specs/` — archived design specs (delivered specs whose decisions are now owned by ADRs + code, plus abandoned drafts).

## When to archive

Per the updated `maintaining-documentation` skill (2026-04-17):

- **ADR**: archive when `status: superseded` and the superseding ADR fully absorbs the constraints.
- **Spec**: archive when `status: delivered` and an ADR + code are the ground truth (the former "living spec" default was reversed in Phase 5).
- **Draft spec**: archive if >14 days old with no active downstream work.

## When NOT to archive

- Spec is the only source of truth for something (e.g. design-only modes like Process Flow).
- Spec is still actively informing work (phases in progress, awaiting ADR).
- ADR encodes a current invariant — keep in `docs/07-decisions/`, mark `status: stable`.

## How to resurrect

If an archived doc becomes load-bearing again (e.g. design resurfaces for a new feature):

1. `git mv` back to the canonical location.
2. Update the index entry: remove the `(archived)` suffix, restore status.
3. Note the resurrection in the frontmatter `last-reviewed:` and in the commit message.

Archived docs stay in git history regardless; a `git revert` of the archival commit is always a valid rollback.
