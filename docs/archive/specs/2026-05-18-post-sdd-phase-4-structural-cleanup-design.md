---
title: 'Post-SDD Phase 4 — Structural cleanup'
purpose: design
tier: living
status: archived
audience: human
layer: spec
delivered-by: 2026-05-18
implements:
  - docs/archive/baselines/2026-04-17-doc-audit.md
  - docs/archive/baselines/2026-04-17-agent-docs-baseline.md
  - docs/archive/transcripts/index.md
  - docs/archive/audits/project-status-audit-2026-04-16.md
  - docs/archive/discussions/2026-03-29-probability-plot-analysis.md
  - docs/archive/discussions/2026-03-29-factor-intelligence-design.md
  - docs/10-development/index.md
  - docs/04-cases/index.md
  - docs/08-products/index.md
  - docs/06-design-system/index.md
  - scripts/docs/retrofit-layer.mjs
last-reviewed: 2026-05-18
---

# Post-SDD Phase 4 — Structural cleanup

> **🗄 Archived 2026-05-18 — Delivered via PR-PSDD-4 (commit `07926382`).** 4 archive subdirs created; 73 docs gained layer:; 4 broken refs caught + fixed; 9 ZERO warnings/errors after final validate. Post-SDD refactor complete.

## Context

Phase 4 is the final phase of the post-SDD refactor. It addresses per-dir decisions surfaced by the M0 Explore pass: which top-level `docs/` dirs are legacy (archive), which are real ongoing content (keep + classify), and how the 5-layer stack treats content that doesn't fit cleanly into L1-L5.

## Deltas

### Archive moves

- `docs/09-baseline/` (2 audit-snapshot files dated 2026-04-17) → `git mv` to `docs/archive/baselines/`. Pre-wedge audit point-in-time records; historical reference only.
- `docs/10-development/transcripts/` (5 user-testing transcripts + index, dated 2026-03/04) → `git mv` to `docs/archive/transcripts/`. Point-in-time interview captures, not living documentation.
- `docs/10-development/discussions/` (2 design discussion notes, 2026-03-29) → `git mv` to `docs/archive/discussions/`. Findings have been folded into shipped specs/ADRs; keep originals as historical reference.
- `docs/10-development/project-status-audit-2026-04-16.md` → `git mv` to `docs/archive/audits/`. Point-in-time audit; historical.

### Keep + retrofit `layer:` frontmatter

Extend `scripts/docs/retrofit-layer.mjs` with new path → layer mappings:

- `docs/04-cases/` → `L1` (teaching content; case studies that orient users to the methodology — vision-adjacent)
- `docs/06-design-system/` → `L5` (foundation; component patterns, charts specs, design tokens — long-lived reference)
- `docs/08-products/` → `L5` (ops/GTM content; pricing, ISO-9001 alignment, Azure marketplace — long-lived)
- `docs/10-development/` → `L5` (remaining `feature-backlog.md` + `index.md`; development reference)
- `docs/archive/baselines/`, `docs/archive/transcripts/`, `docs/archive/discussions/`, `docs/archive/audits/` → skip (archives don't need layer: by convention)

Then `node scripts/docs/retrofit-layer.mjs` (idempotent — only touches docs lacking `layer:`).

### Update 10-development/index.md

Strip references to moved subdirs; keep entries for `feature-backlog.md` (which stays).

### Deferred

- **`kind: index` enum addition** — defer. Index files use `kind: infrastructure` today which works fine (intent-diagram check exempts infrastructure). Adding a dedicated enum value is cosmetic.
- **`docs/agent-context/` vs `docs/01-vision/` overlap** — defer to its own brainstorm (per plan). Not in Phase 4 scope.

## Out of scope

- Filling content in `04-cases/`, `08-products/`, `06-design-system/` beyond `layer:` retrofit (those dirs have their own content authors)
- Adding `kind:` to L5 docs (validator doesn't require it; spec doesn't either)
- Component refactors surfaced by SDD M0 findings (CoScout extraction, packages/sync/, etc. — those are V2+ work per the plan's "Don't refactor" list)

## Acceptance signals

- `pnpm docs:check` green; 0 broken cross-refs after the moves
- All non-archived docs/ have `layer:` frontmatter (retrofit cleanup catches any path the new mappings missed)
- `docs/09-baseline/`, `docs/10-development/transcripts/`, `docs/10-development/discussions/` are empty / removed
- Archive structure: `docs/archive/{baselines,transcripts,discussions,audits}/` populated

## Dogfood note

Final Phase. Follows the SDD lifecycle: spec lands, archives execute, validate, commit, archive spec.
