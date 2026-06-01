---
title: 'sdd-5-layer-stack-delivered'
description: 'Spec-driven-development 5-layer authoring stack — DELIVERED 2026-05-18 via PRs SDD-0..4. The durable knowledge agents need.'
purpose: remember
tier: card
status: active
date: 2026-05-28
topic: [memory, project]
related: []
verified-against-commit: ca45f469
last-verified: 2026-05-28
source-hash: d46b7ba349455d44
origin-session-id: d5bc876c-0411-4916-8f0e-6f6a3357eac6
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_sdd_5_layer_stack.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

# Spec-Driven Development — 5-Layer Authoring Stack (DELIVERED 2026-05-18)

**5 PRs landed clean on main**: `d9c880dc` (M0) · `1d649a21` (M1+M2) · `6205383d` (M3) · `6f67d964` (M4) · `9b7440ff` (M5).

**Canonical spec**: `docs/superpowers/specs/2026-05-18-spec-driven-development-design.md`.
**M0 inventory** (audit trail): `docs/cards/investigations/inv-20260518-sdd-migration-inventory.md`.

## The 5-layer stack

```
L1 Vision      docs/01-vision/        WHY VariScout exists       Stable; edit-in-place
L2 Journeys    docs/02-journeys/      WHO does WHAT              Living; 3 V1 personas
L3 Features    docs/03-features/      WHAT system has            Living; intent diagram MANDATORY
L4 Engineering docs/05-technical/     HOW it's built (complex)   Stable once built; optional
L5 ADRs        docs/07-decisions/     WHY decision survived      Append-only; immutable

Design specs   docs/superpowers/specs/   Propose deltas to L1-L3; archive after delivery
Cards          docs/cards/               Atomic memory across layers
```

**The cascade**: Vision constrains Journeys; Journeys constrain Features; Features constrain Code. No journey → orphan code. No feature → drift.

## Frontmatter contract

```yaml
layer: L1 | L2 | L3 | L4 | L5 | spec     # universal; enables validator + Steward routing
kind:  ui | workflow | engine |           # L3 only; gates intent-diagram type
       infrastructure
serves: [docs/02-journeys/X.md, ...]      # L3 references upstream L2; L4 references L3
implements: [docs/0X-.../Y.md, ...]       # design specs only; required, non-empty
```

## Propose → Apply → Archive lifecycle

1. **Propose** — spec lands at `docs/superpowers/specs/<date>-<slug>-design.md` with required `implements:` frontmatter. Body has explicit "Deltas" section listing what changes in each `implements:` target. `status: draft`.
2. **Apply** — BEFORE code, edit the `implements:` target docs to reflect new state. Spec `status: active`. Discipline: *L1-L3 update lands no later than code in the same merge group.*
3. **Archive** — after delivery, `git mv` spec to `docs/archive/specs/` with `status: archived` + Delivered banner + `delivered-by: YYYY-MM-DD`. ADR captured if a decision survives.

## Enforcement (mechanical)

**Validator HARD-FAIL rules** (in `scripts/check-doc-frontmatter.mjs`):
- `errorL3MissingKind` — L3 docs without `kind:`
- `errorSpecMissingImplements` — design specs without `implements:`
- `errorBrokenImplementsPath` — `implements:` paths that don't exist
- `errorBrokenServesPath` — `serves:` paths that don't exist

**Validator WARN**: L3 (ui/workflow/engine) without ` ```mermaid ` block OR ASCII art (next-edit work).

**Steward Category 5**: active specs >30 days without commits to any `implements:` target → proposed Archive (read-only weekly Issue).

## UI integration policy (lighter than industry consensus)

- **Mermaid/ASCII intent diagrams** mandatory per L3 spec (per `kind:`). Diff cleanly, parseable by AI agents, age well.
- **No Figma adoption.** The running app at `:5173` + `claude --chrome` is the canonical hi-fi reference.
- **No Storybook adoption.** Defer until `@variscout/ui` exceeds ~30 primitives or a designer joins.
- **Never embed raster screenshots in specs** (go stale within a sprint).
- **Light-colors-only invariant**: Tailwind 50-300 surfaces / 400-700 text. No dark mode V1. Lives in `.claude/INVARIANTS.md` + `docs/01-vision/constitution.md` + `packages/ui/CLAUDE.md`.

## Brainstorm → code flow (skill local overrides at `.claude/skills/superpowers/`)

| Skill | What it now requires |
|---|---|
| `superpowers:brainstorming` | Spec output requires `implements:` frontmatter + Deltas body section |
| `superpowers:writing-plans` | Plans gain mandatory Apply task as first task |
| `superpowers:subagent-driven-development` | Dispatches Apply before any code task; archives spec after delivery |

These are VariScout-local overrides; upstream skills unchanged.

## What's in each layer today

- **L1**: `01-vision/constitution.md` (canonical principles, extended with V1 Wedge Principles + light-colors invariant), `philosophy.md`, `methodology.md`, `product-overview.md`, `business-bible.md`, `positioning.md`, etc.
- **L2**: 3 V1 in-product persona journeys (`personas/lead.md`, `member.md`, `sponsor.md`) + `ia-nav-model.md` + journey index. 10 legacy personas reclassified (5 named-future → VariScout Process, 5 archived).
- **L3**: 48 active feature docs (39 capability-description + 5 indexes + 24 new stubs); all carry `kind:` + `serves:`. 4 implementation-notes files graduated to L4.
- **L4**: 4 engineering design docs (`scout-level-spanning`, `hub-capability-tab`, `regression-glm-engine`, `persistence-engine`).
- **L5**: 74 ADRs, all carry `layer: L5`.
- **Archive specs**: 17 newly archived + 64 pre-existing (latter lack `implements:`; allowlisted for now).

Related: [[wedge-v1]], [[docs-strategy-2026]], [[sdd-architectural-findings]], [[feedback_subagent_grounding_catches_drift]]
