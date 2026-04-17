---
title: 'Doc Prune — Load-Bearing Audit Design'
audience: [engineer, architect]
category: architecture
status: draft
related: [agent-docs-architecture, docs-governance, frontmatter-enforcement]
last-reviewed: 2026-04-17
---

# Doc Prune — Load-Bearing Audit (Phase 5)

## Context

Phases 1-4 of the agent-docs architecture overhaul are merged to `main` (PR #62, commit `29a4a6d0`). Always-loaded agent context is down from 905 → 57 lines, frontmatter enforcement lands 2026-05-15, and the customer-owned data principle is encoded across the stack.

The CTO-lens critique of the current corpus stands: **71 ADRs + 64 specs for a ~50k-LOC product is over-indexed**. Most shops land at ~20 ADRs; VariScout has running commentary in the set. Specs have 35 delivered + 18 draft + 5 superseded with no consistent retire policy. Docs have a maintenance cost — every ADR/spec that isn't load-bearing adds to rot risk, search noise, and agent context overload.

**Goal:** Prune the ADR + spec corpus by archiving (not deleting) anything that isn't load-bearing. Load-bearing = referenced from code, CLAUDE.md, skills, another ADR/spec, or encoding an invariant you'd forget. Process-flow mode docs are a hard-coded exception because they're the only source of truth for a design-only mode.

**Non-goals this round:** broader `docs/01-09` sections, link dedup, Starlight sidebar rework.

## Approach

Four-step load-bearing audit, mirrored on Phase 3/4's pattern (script → subagent sanity pass → user review → execute with safety net).

### 1. Reference-map script (new, one-shot)

`scripts/audit-doc-references.mjs`:

- Input: all `docs/07-decisions/adr-*.md` + `docs/superpowers/specs/*.md`.
- For each, count inbound refs in these source classes:
  - **code**: `packages/**`, `apps/**`, `tools/**` (grep filename stem + "ADR-NNN" pattern).
  - **agent-context**: root `CLAUDE.md`, `packages/*/CLAUDE.md`, `apps/*/CLAUDE.md`.
  - **skills**: `.claude/skills/**/*.md`.
  - **peers**: other ADRs + other specs.
  - **docs-tree**: broader `docs/**` (excluding the audited doc itself).
- Classify each row:
  - `≥2 inbound from code/agent-context/skills` → **KEEP**.
  - `0 inbound AND status ∈ {superseded, archived}` → **ARCHIVE**.
  - `0 inbound AND status=delivered AND last-modified > 60d ago` → **ARCHIVE**.
  - Process-flow mode docs (hard-coded path list) → **KEEP** (exception).
  - Else → **REVIEW**.
- Output: `docs/09-baseline/2026-04-17-doc-audit.md` with one markdown table, sorted by recommendation then inbound-count ascending.
- Hard-coded exception list (minimum):
  - `docs/superpowers/specs/2026-04-07-process-flow-analysis-mode-design.md`
  - `docs/USER-JOURNEYS-PROCESS-FLOW.md` (not in audit scope but noted).

### 2. Subagent sanity pass

Single Explore agent, scoped to the ARCHIVE-recommended set (~25-40 docs expected). Prompt: read each flagged doc briefly, find any that encode non-obvious invariants, still-relevant constraints, or justification for current code shape. Output a "promote back to REVIEW" list with reason per row.

### 3. User review gate

Present the finalized audit doc. User redlines each row: **KEEP / ARCHIVE / CONSOLIDATE-WITH-<path>**.

### 4. Execute

1. **Safety net first:** branch `archive-preserved-2026-04-17-phase2` + tag `archive-snapshot-phase2-2026-04-17`, pushed before any mutation.
2. **Recreate `docs/archive/` with intent:** write `docs/archive/README.md` explaining why the folder exists (what was archived, on what date, under what criterion) so future-you doesn't mistake it for abandoned junk like the last one.
3. **`git mv`** approved docs into `docs/archive/adrs/` and `docs/archive/specs/`.
4. **Update the two index files** (`docs/07-decisions/index.md`, `docs/superpowers/specs/index.md`): each archived row keeps its entry but gains `(archived 2026-04-17 → archive/adrs/foo.md)` suffix. Don't delete the row — the point is traceability.
5. **Rewrite inbound links** to archived paths. Dead-link hook catches misses; frontmatter hook stays green because archived docs inherit their classification.
6. **Commit** as `chore(docs): archive N ADRs + M specs (load-bearing audit)`.

## Files

**New:**

- `scripts/audit-doc-references.mjs` — one-shot audit script.
- `docs/09-baseline/2026-04-17-doc-audit.md` — audit output + review log.
- `docs/archive/README.md` — why this folder exists (v2).

**Modified:**

- `docs/07-decisions/index.md` — archived-row suffixes.
- `docs/superpowers/specs/index.md` — archived-row suffixes.
- Any doc with inbound links pointing to archived paths.

**Moved (git mv):**

- ~25-40 files from `docs/07-decisions/` and `docs/superpowers/specs/` into `docs/archive/{adrs,specs}/`.

## Verification

1. **Dry-run audit:** `node scripts/audit-doc-references.mjs --dry-run` produces the audit doc without any file moves. Spot-check: ADR-069 (Three-Boundary Numeric Safety, heavily referenced) must score KEEP; ADR-024 (superseded by ADR-037) must score ARCHIVE.
2. **Exception preserved:** grep the audit output for `process-flow` — must appear in KEEP.
3. **Subagent output reviewed:** promote-back list applied to the doc before user review.
4. **Pre-execute gate:** `pnpm docs:check` green on the pre-move tree.
5. **Post-execute gate:** `pnpm docs:check` green after moves + link rewrites. Specifically the dead-link hook and the frontmatter validator (archived docs still classify correctly).
6. **Starlight build:** `pnpm --filter @variscout/docs build` produces the expected page count (403 minus archived count). Archive either excluded from sidebar or surfaced as its own top-level section (decision at execute time).
7. **Branch + tag pushed:** `git ls-remote origin archive-preserved-2026-04-17-phase2` and the tag ref both exist on origin before any `git mv`.
8. **Rollback:** single `git revert <commit>` on the archival commit restores everything; safety branch provides a deeper anchor.
