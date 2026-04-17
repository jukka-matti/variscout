# Documentation Rules

## Review Cadence

- **Monthly**: Audit CLAUDE.md Key Files table — verify paths still exist
- **Monthly**: Run broken link check: `grep -r '\[.*\](.*\.md)' docs/ | grep -v archive` and verify targets
- **After major feature delivery**: Update CLAUDE.md task-to-documentation mapping and Key Files table
- **After ADR creation**: Add entry to `docs/07-decisions/index.md`

## Feature Delivery Checklist

When a feature is delivered end-to-end (not just building blocks):

1. Run `bash scripts/check-doc-health.sh` to verify consistency
2. Update hook/component counts in monorepo.md if new shared modules were added
3. Update `docs/08-products/feature-parity.md` if the feature affects PWA/Azure availability
4. Update ADR Implementation Status table if applicable
5. **Update `docs/superpowers/specs/index.md`** — add new specs, flip status to `delivered`. The pre-commit `docs:check` gate will fail if the index is stale.
6. Keep design spec as living reference (`status: delivered`), don't archive
7. Store key architectural decisions in ruflo memory (`mcp__ruflo__memory_store`)
8. Verify end-to-end: building blocks are called from apps, not just exported

## Spec-Anchored Policy

Design specs (`docs/superpowers/specs/`) are **living documents**, not one-time artifacts:

- Frontmatter status progression: `draft` → `delivered` (stays in specs/)
- Only archive when **superseded** by a fundamentally new design
- Specs capture the "why" and user flows that ADRs don't — they're valuable for future iterations
- When iterating on a delivered feature, update the spec first, then implement

## Deprecation Strategy

- Move deprecated docs to `docs/archive/` with "HISTORICAL ONLY" header
- Update all inbound links to point to archive path with "(Phase N, deferred)" annotation
- Never delete ADRs — mark status as "Superseded by ADR-XXX" instead
- Keep archive/ clearly separated from active docs
- Design specs: use `status: delivered` (not archive) unless superseded

## Frontmatter

Major docs should include YAML frontmatter for AI-friendly metadata:

```yaml
---
title: Document Title
audience: [analyst, engineer]  # or [developer]
category: analysis             # analysis | architecture | workflow | reference
status: stable                 # stable | draft | deferred | deprecated
related: [term-1, term-2]     # semantic tags for search/filtering
---
```

## ADR Template Checklist

When creating a new ADR:
1. Use sequential numbering (check `docs/07-decisions/index.md` for next ID)
2. Include Status, Date, Context, Decision, Consequences sections
3. Add Implementation section if the decision has been implemented
4. Add entry to `docs/07-decisions/index.md` immediately
5. Update CLAUDE.md task-to-documentation mapping if the ADR covers a new domain

## CLAUDE.md vs docs/index.md

- **CLAUDE.md** — AI-optimized routing table (task-to-doc mapping, key files, conventions)
- **docs/index.md** — Human-readable documentation navigation
- Both are authoritative in their domain; keep both current after changes
