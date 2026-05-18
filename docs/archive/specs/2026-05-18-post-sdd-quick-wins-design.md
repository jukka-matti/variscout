---
title: 'Post-SDD Phase 1 — Quick Wins'
purpose: design
tier: living
status: archived
audience: human
layer: spec
implements:
  - docs/07-decisions/adr-078-pwa-azure-architecture-alignment.md
  - docs/03-features/analysis/capability-gap-trend-chart.md
  - docs/03-features/analysis/index.md
  - docs/03-features/index.md
  - docs/archive/journeys/personas/admin-aino.md
  - docs/archive/journeys/personas/curious-carlos.md
  - docs/archive/journeys/personas/field-fiona.md
  - docs/archive/journeys/personas/green-belt-gary.md
  - docs/archive/journeys/personas/student-sara.md
  - docs/02-journeys/personas/index.md
  - packages/core/CLAUDE.md
last-reviewed: 2026-05-18
delivered-by: 2026-05-18
---

> **🗄 Archived 2026-05-18 — Delivered via PR-PSDD-1 (commit `4eab4aae`).** All 5 deltas applied; implements: targets reflect delivered state. Spec retained for traceability; current state is in the implements: paths above.

# Post-SDD Phase 1 — Quick Wins

## Context

The SDD migration (2026-05-18, 5 PRs) delivered the 5-layer authoring stack + Propose → Apply → Archive lifecycle. M0 subagent grounding surfaced **5 architectural drifts** that the migration intentionally did NOT fix. This spec bundles the 5 mechanical fixes as a single PR.

Also serves as **the first dogfood of the SDD lifecycle**: a real design spec with `implements:`, Apply edits before commit, then Archive after delivery. If anything breaks here, fix the discipline mechanism before further work.

## Deltas

### Delta 1 — Amend ADR-078 with stores reality (2026-05-18)

`docs/07-decisions/adr-078-pwa-azure-architecture-alignment.md` D1 stores table lists 5 stores + 1 "future" (useCanvasStore). Reality is **9 stores** across the F4 three-layer model + wedge V1 additions.

Append a `## Amendment (2026-05-18)` section near the end of the ADR documenting:

- **Stores reality**: `useProjectStore` (Document), `useInvestigationStore` (Document), `useImprovementProjectStore` (Document — replaces ADR-078's `useImprovementStore` post-wedge V1), `useCanvasStore` (Document), `useCanvasViewportStore` (Document — viewport split), `useActiveIPStore` (Annotation-per-hub — wedge V1), `useProjectMembershipStore` (Annotation-per-user — wedge V1), `usePreferencesStore` (Annotation-per-user — replaces ADR-078's `useSessionStore` per F4 split), `useViewStore` (View — replaces ADR-078's `useWallLayoutStore`; transient).
- **Renames vs original ADR-078**: `useImprovementStore → useImprovementProjectStore`; `useSessionStore → usePreferencesStore` (durable half) + `useViewStore` (transient half); `useWallLayoutStore → useViewStore` (folded).
- **Net additions**: `useActiveIPStore`, `useProjectMembershipStore` (both wedge V1).
- **Three-layer framing**: per F4 design (2026-05-07): Document (×4), Annotation (×3 — 1 per-hub + 2 per-user), View (×1 — transient, no persist). 9 total. Companion: `docs/superpowers/specs/2026-05-07-data-flow-foundation-f4-three-layer-state-design.md`.

### Delta 2 — Rename L3 doc to match code

`git mv docs/03-features/analysis/gap-trend-chart.md docs/03-features/analysis/capability-gap-trend-chart.md`.
Update frontmatter `title:` to "Capability Gap Trend Chart" (matches component `CapabilityGapTrendChart.tsx`).
Update inbound ref in `docs/03-features/analysis/index.md` line 22: `gap-trend-chart.md` → `capability-gap-trend-chart.md`.

### Delta 3 — Remove obsolete Phase C.3 warning

`docs/03-features/index.md` carries `> **⚠️ Queued for V1 rewrite (Phase C.3)**` block at top. Wedge V1 + SDD migration have landed; this warning is now obsolete and misleading. Remove the block.

### Delta 4 — Archive 5 legacy V0 personas

Move 5 personas with `status: archived` to `docs/archive/journeys/personas/` (create the dir). Personas to move:

- `admin-aino.md` (Azure admin — now an ACL feature, not a persona)
- `curious-carlos.md` (free-tier explorer — V1 is single SKU)
- `field-fiona.md` (mobile field UX — V2 scope)
- `green-belt-gary.md` (training-tier user — collapses into Improvement Specialist buyer)
- `student-sara.md` (VariScout Education named-future)

Use `git mv` for each (preserves history). Update `docs/02-journeys/personas/index.md` to drop entries for the moved 5; the 5 `status: named-future` personas stay (analyst-alex, engineer-eeva, evaluator-erik, opex-olivia, trainer-tina).

### Delta 5 — Add Core sub-domains signpost

`packages/core/CLAUDE.md` is 68 lines (budget 80 — warn threshold). Add a compact `## Core sub-domains` section (~6-8 lines) listing:

- `core/src/ai/` — CoScout prompts + 5 V1 response paths (ADR-080)
- `core/src/projectMembership/` — pure-TS ACL (`canAccess()`, `ROLE_PERMISSIONS`); pairs with `useProjectMembershipStore` per wedge V1 (ADR-082)

Cross-link `[[sdd-architectural-findings]]` precedent for the drift discovery.

## Out of scope

- Phase 2-4 of the post-SDD refactor (allowlist cleanup, doc depth, structural).
- ADR amendment text ergonomics (could renumber, but minimal change is the rule for ADR amendments).
- Renaming the actual `CapabilityGapTrendChart` component (doc rename is sufficient; component rename has consumer blast radius).

## Acceptance signals

- `pnpm docs:check` green (HARD-FAIL on implements: paths means all 11 must exist post-Apply)
- ADR-078 carries new amendment section; renders correctly
- `capability-gap-trend-chart.md` resolves from `analysis/index.md`
- No inbound refs to moved persona files under `docs/`
- `packages/core/CLAUDE.md` ≤ 80 lines; contains "## Core sub-domains" section

## Dogfood note

This spec IS the first feature post-SDD migration. It validates the new lifecycle end-to-end:

1. Spec lands with `implements:` ✓ (this file)
2. Apply phase: 5 deltas + spec all in one commit (the L1-L3 docs update lands no later than the spec itself — discipline satisfied)
3. Archive: `git mv` this spec to `docs/archive/specs/` with Delivered banner immediately after commit
4. Update `docs/cards/investigations/inv-20260518-sdd-migration-inventory.md` with the dogfood result

If anything breaks (validator complaints, broken refs, hook failures), fix the discipline mechanism BEFORE Phase 2 work.
