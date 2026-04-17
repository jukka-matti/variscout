---
name: maintaining-documentation
description: Use when creating or updating ADRs, design specs, diagrams, or the spec index. ADR template + sequential numbering + immediate index update in docs/07-decisions/index.md, spec frontmatter requirements (title, audience, category, status, related), Starlight frontmatter for docs/ content, spec-anchored policy (living docs, status progression draft→delivered), diagram health check via scripts/check-diagram-health.sh, spec index sync requirement.
---

## When to Use This Skill

- **ADR creation:** Creating a new Architecture Decision Record with sequential numbering
- **Design spec creation/update:** Writing or modifying design specs in `docs/superpowers/specs/`
- **Index maintenance:** Adding entries to `docs/07-decisions/index.md` or `docs/superpowers/specs/index.md`
- **Documentation deprecation:** Moving docs to `docs/archive/` or marking as superseded
- **Diagram health:** Updating docs that reference component counts, type values, or architecture diagrams
- **Feature delivery:** Post-feature-delivery doc audit (CLAUDE.md updates, feature-parity matrix, ADR implementation status)

## Architecture Decision Records (ADRs)

### File Naming & Numbering

1. Check `docs/07-decisions/index.md` for the next available sequential ID (e.g., if the last ADR is 069, create 070)
2. **Never reuse a number.** Append-only numbering — use "Superseded by ADR-XXX" instead
3. File format: `adr-NNN-kebab-case-title.md` (e.g., `adr-070-example-decision.md`)
4. Update `docs/07-decisions/index.md` in the same commit

### Required Sections

Every ADR must include (in order):

1. **Status** — `accepted`, `superseded`, `deferred`, or `stable` (lowercase; schema-enforced)
2. **Date** — ISO 8601 format (YYYY-MM-DD)
3. **Context** — The problem or trigger for this decision
4. **Decision** — What was decided (clear, declarative)
5. **Consequences** — Trade-offs, implications, downstream effects
6. **Implementation** (if applicable) — Where the decision was implemented in code + link to related ADR entries in CLAUDE.md

### Index Entry Template

```markdown
| [NNN](adr-NNN-kebab-title.md) | Decision Title | Status | 2026-04-17 |
```

## Design Specs (Living Documents)

### Spec Archive Policy (revised 2026-04-17)

Design specs (`docs/superpowers/specs/`) are **design-time artifacts**, not living references. Once a feature ships, the ADR + code become ground truth and the spec stops earning its keep in the main tree.

- **Status progression:** `draft` → `active` → `delivered` → **archive** (move to `docs/archive/specs/`).
- **Archive on delivery** unless one of these exceptions applies:
  - No ADR exists yet (spec is still the only persistent record of the decision).
  - Spec is still actively informing follow-on work (phases in progress).
  - Spec is the only source of truth for something (e.g. design-only modes like Process Flow).
- **Abandoned drafts** (>14 days old, no downstream activity) are archived the same way.
- **Superseded** specs or ADRs are archived immediately; the successor takes over canonical reference duty.
- **Resurrection**: if an archived spec becomes load-bearing again, `git mv` it back and update the index entry. See `docs/archive/README.md`.

Historical context: the prior policy ("living delivered specs") was reversed in the Phase 5 doc-prune audit (see `docs/09-baseline/2026-04-17-doc-audit.md`) because at 64 specs the living-spec default produced more rot than insight.

### Required Frontmatter

Every major doc must include YAML frontmatter. **Schema SSOT:** `scripts/docs-frontmatter-schema.mjs`. Enforced by `node scripts/check-doc-frontmatter.mjs` (wired into `pnpm docs:check`; warn mode until **2026-05-15**, then fails commits).

```yaml
---
title: Document Title
audience: [analyst, engineer]  # enum: see AUDIENCE in schema
category: analysis             # enum: see CATEGORY in schema
status: draft                  # enum: see STATUS in schema (lowercase)
related: [term-1, term-2]      # freeform semantic tags
last-reviewed: 2026-04-17      # ISO 8601 — bump when substantially edited
---
```

**Doc-type rules** (in the schema):

| Type                         | Path                            | Required                           |
| ---------------------------- | ------------------------------- | ---------------------------------- |
| `general`                    | `docs/**` (default)             | title, audience, category, status  |
| `adr`                        | `docs/07-decisions/adr-*.md`    | title (status lowercase if set)    |
| `spec` (specs, plans, etc.)  | `docs/superpowers/**`           | title, status                      |

**Allowed status values:** `draft`, `active`, `accepted`, `in-progress`, `design`, `delivered`, `stable`, `deferred`, `superseded`, `archived`, `reference`, `template`, `raw`. Extend the schema rather than widening the lint rule to absorb drift.

### Starlight Frontmatter (docs/ site)

Files in `apps/docs/src/content/` (Astro + Starlight) use their own conventions. Title is the primary field:

```yaml
---
title: Document Title
---
```

## Diagram Health & Index Sync

### Spec Index Gate (Pre-Commit)

`docs/superpowers/specs/index.md` is a **hard pre-commit gate** — stale index fails `pnpm docs:check`:

- **Must update the spec index in the same commit** as adding/changing a spec
- **Status matrix:** Spec title → feature → ADR link → status
- Check format: run `bash scripts/check-diagram-health.sh` locally before pushing

### Diagram Health Checks

`bash scripts/check-diagram-health.sh` (invoked via `pnpm docs:check`) verifies:

1. **Export counts** — `@variscout/ui`, `@variscout/hooks`, `@variscout/charts` exports match `component-map.md`
2. **Type drift** — `FindingStatus` values appear in `investigation-lifecycle-map.md`
3. **Orphan files** — Every doc under `docs/` must be referenced from another doc (grep by basename)
4. **Broken cross-references** — Links to ADRs, specs, and internal paths are valid
5. **Frontmatter presence** — Required metadata is present in major docs

**Gotcha: Orphan detection is a basename grep** — if you add a new doc, ensure at least one inbound link exists from an ADR, spec, or CLAUDE.md task-to-documentation mapping.

## Deprecation Strategy

### Moving Docs to Archive

1. Move file to `docs/archive/` with a "HISTORICAL ONLY — Phase N" header
2. Update **all inbound links** to point to the archive path with annotation: `(Phase N, deferred)`
3. Example: `[Methodology Coach](../../archive/2026-03-18-methodology-coach-design.md) (Phase 1, deferred)`

### Superseding ADRs

1. **Never delete an ADR.** Mark the old one:
   ```
   Status: Superseded by ADR-NNN
   ```
2. Create a **new ADR** with the next sequential number for the replacement decision
3. Update both `docs/07-decisions/index.md` entries in the same commit

### Design Specs

- Use `status: delivered` when feature is shipped — do **not** move to archive
- Use `status: archived` only when spec is **superseded by a fundamentally different design**
- Keep delivered specs as living references for future iterations

## Feature Delivery Checklist

After delivering a feature end-to-end (not just building blocks):

1. Run `bash scripts/check-doc-health.sh` — verify hook/component/test counts sync with docs
2. Update `docs/08-products/feature-parity.md` if feature affects PWA/Azure availability
3. Update CLAUDE.md task-to-documentation mapping if new domain area
4. Update ADR Implementation Status table (in relevant ADRs)
5. **Update `docs/superpowers/specs/index.md`** — flip status to `delivered`, ensure index entry exists
6. Store key architectural decisions in ruflo memory via `mcp__ruflo__memory_store`
7. Verify end-to-end: shared modules (hooks, UI, charts) are called from apps, not just exported

## Monthly Review Cadence

- **CLAUDE.md Key Files audit:** Verify paths exist, links are current
- **Broken link scan:** `grep -r '\[.*\](.*\.md)' docs/ | grep -v archive` and verify targets
- **Spec status check:** Ensure delivered specs have `status: delivered` and active specs are in sync with code
- **ADR index consistency:** No duplicate IDs, all entries link-valid

## Gotchas

1. **Orphan files block pre-commit:** Every new doc must be referenced by another doc (grep by filename)
   - Fix: Add a sentence/link from the owning spec or ADR
2. **Stale spec index blocks pre-commit:** Update `docs/superpowers/specs/index.md` in same commit as spec changes
3. **Reusing ADR numbers:** Don't. Mark old as "Superseded by ADR-XXX" and create new sequential entry
4. **Delivered specs in archive:** Don't archive delivered specs unless superseded — they're living references
5. **Starlight frontmatter differs:** `apps/docs/` uses different metadata format — don't copy `docs/` YAML blindly
6. **`last-reviewed` drift:** Update when substantially editing content. 90-day old dates signal review-cadence backlog
