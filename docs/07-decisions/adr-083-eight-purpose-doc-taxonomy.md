---
title: 'ADR-083: Eight-purpose doc taxonomy + four-tier velocity'
status: active
date: 2026-05-16
purpose: decide
tier: living
audience: both
topic: [docs-strategy, schema, meta]
related: [2026-05-16-docs-strategy-design, 2026-05-16-docs-strategy-memo]
layer: L5
---

# ADR-083: Eight-purpose doc taxonomy + four-tier velocity

**Status:** Accepted
**Date:** 2026-05-16
**Related:** [Docs Strategy Design](../superpowers/specs/2026-05-16-docs-strategy-design.md), [Docs Strategy Memo](../superpowers/specs/2026-05-16-docs-strategy-memo.md)

## Context

VariScout's frontmatter schema has accumulated 22 STATUS values, 18 CATEGORY values, and 14 AUDIENCE values across ~521 markdown files. The schema was built incrementally and now exhibits two failure modes simultaneously:

1. **Over-discipline at the metadata layer** — 22 STATUS enums create aspirational distinctions (`review`, `living`, `raw`, `template`) that are never consistently applied and require constant maintenance. Most docs cycle between `draft → active → superseded` in practice.

2. **Under-discipline at the lifecycle layer** — no freshness signal (`last-verified`), no implementation-drift sensor (`verified-against-commit`), no velocity-tier to drive maintenance cadence, no purpose field to route retrieval by function.

The result: expensive enum schemas that don't prevent drift, while the fields that would detect drift are absent.

An audit of 487 active docs (521 files total, 34 supporting README/index hubs) revealed:

- Design + Decide dominate living-tier docs (51% + 25% = 76%)
- **Agent-context is critically under-engineered at 4% of living docs** — the AX-dev surface that reads on every subagent dispatch
- 17 emergent topic tags emerge naturally; formal CATEGORY enum enforces a 2024 ontology instead

Additionally, industry documentation frameworks (Diátaxis, Google's engineering-practices) are human-reader-centric and pre-LLM-era. VariScout needs a taxonomy covering both human readers AND the AX-dev surface (subagents) that now constitutes half its documentation system.

## Decision

Replace the existing three-enum metadata schema with a two-axis schema: **8 purposes × 4 tiers**, with free-form topic tags and collapsed enums.

### The new schema

```yaml
# Core two-axis classification
purpose: orient | decide | design | build | system | constrain | agent-context | remember
tier: stable | living | ephemeral | card

# Collapsed enums
status: draft | active | superseded | archived # was 22 values
audience: human | agent | both # was 14 values
topic: [<kebab-tags>] # replaces CATEGORY enum; free-form

# New operational fields
last-verified: YYYY-MM-DD # drift sensor
verified-against-commit: <sha> # drift sensor
supersedes: [<id>] # supersession chain
related: [<id>] # cross-reference graph
```

### The 8 purposes

| Purpose           | Reader intent                              | Failure mode                            |
| ----------------- | ------------------------------------------ | --------------------------------------- |
| **orient**        | "What is VariScout? Why? For whom?"        | Stale narrative misleads                |
| **decide**        | "What did we conclude?"                    | Re-litigation; lost provenance          |
| **design**        | "What is/should the product be?"           | Spec ↔ implementation drift             |
| **build**         | "How do I implement this _here_?"          | Agent uses outdated procedure           |
| **system**        | "How is the system architected?"           | Diagrams describe old architecture      |
| **constrain**     | "What must I never do?"                    | Constraint ignored; not enforced        |
| **agent-context** | "I'm an agent — what do I need right now?" | Context bloat; wrong information loaded |
| **remember**      | "How did we get here? Why was X decided?"  | Lost institutional knowledge            |

### The 4 tiers

| Tier          | Volatility                              | Maintenance                      |
| ------------- | --------------------------------------- | -------------------------------- |
| **stable**    | Years-stable                            | Quarterly human review           |
| **living**    | Months-stable, amend-not-rewrite        | Steward-loop drift checks weekly |
| **ephemeral** | Days-to-weeks, lifecycle = until-merged | Auto-archive on close            |
| **card**      | Atomic, append-only                     | Continuous (Steward + telemetry) |

### STATUS alias map (transitional)

Old values that no longer exist in the canonical enum, mapped to their replacements:

| Old value     | → New value  | Rationale                                          |
| ------------- | ------------ | -------------------------------------------------- |
| `accepted`    | `active`     | ADR language; active is the general term           |
| `in-progress` | `active`     | Work-in-progress is still active                   |
| `delivered`   | `active`     | Delivered spec is still the active reference       |
| `reference`   | `active`     | Reference docs are active by definition            |
| `template`    | `active`     | Templates are active infrastructure                |
| `review`      | `draft`      | Under review = still a draft                       |
| `design`      | `draft`      | Design phase = draft                               |
| `raw`         | `draft`      | Raw = draft                                        |
| `stable`      | `active`     | Stable was a STATUS; now tier=stable captures this |
| `living`      | `active`     | Living was a STATUS; now tier=living captures this |
| `deferred`    | `superseded` | Deferred work is effectively superseded            |

### AUDIENCE alias map (transitional)

| Old value         | → New value |
| ----------------- | ----------- |
| `developer`       | `human`     |
| `engineer`        | `human`     |
| `analyst`         | `human`     |
| `business`        | `human`     |
| `architect`       | `human`     |
| `admin`           | `human`     |
| `designer`        | `human`     |
| `product`         | `human`     |
| `manager`         | `human`     |
| `compliance`      | `human`     |
| `procurement`     | `human`     |
| `infosec`         | `human`     |
| `quality-manager` | `human`     |
| `auditor`         | `human`     |

All current AUDIENCE values map to `human`; `agent` and `both` are new explicit values for the AX-dev surface.

### CATEGORY replacement

CATEGORY enum is removed entirely. Free-form `topic` tags replace it. Dominant tags from the audit:

```
adr, stats, charts, ux, projects, investigation, canvas, ax, coscout,
methodology, azure, capability, response-paths, stores, marketplace, i18n, tier-gating
```

Any kebab-case value is valid. The enumeration emerges from usage rather than being prescribed upfront.

## Migration

**Play 1 transition cycle** (this PR):

1. `scripts/docs-frontmatter-schema.mjs` — add `PURPOSE` + `TIER` enums, collapse STATUS to 4 + add alias map, add AUDIENCE alias map, remove CATEGORY enum, add new optional fields.
2. `scripts/check-doc-frontmatter.mjs` — warn (not fail) when old STATUS/CATEGORY/AUDIENCE values appear via alias map; hard-fail on unknown PURPOSE/TIER when present; report missing `purpose`+`tier` counts.
3. `scripts/docs-frontmatter-fix.mjs` — backfill `purpose`+`tier` via path heuristics; map old STATUS/AUDIENCE via alias maps.
4. All docs `git mv`'d to new tier-based folder hierarchy.

**Back-compatibility**: Old STATUS/AUDIENCE values warn but pass during the transition cycle (one release). After Play 2 completes, warnings become failures.

**Folder restructure**: `docs/` moves from 11 numbered folders to `stable/`, `living/<purpose>/`, `ephemeral/`, `cards/`, `archive/`. Git history preserved via `git mv`.

## Consequences

**Positive**:

- Adding a doc is cheaper: 2 required fields (`title`, `purpose`) instead of 4 (`title`, `audience`, `category`, `status`).
- Drift is now detectable: `last-verified` + `verified-against-commit` enable the Steward loop (Play 2e).
- Topic tags evolve with the product; enum doesn't lock 2024 ontology.
- Agent-context gap becomes measurable (cohort report, Play 5).
- AX-dev surface explicitly represented via `purpose: agent-context`.

**Negative**:

- Short-term migration friction on 521 files (mitigated by `docs-frontmatter-fix.mjs` automation).
- Free-form topic tags require human discipline; no enum enforcement (mitigated by 17-tag vocabulary guidance).
- `classify()` function in schema needs updating for new folder paths.

**Neutral**:

- ADR shape is preserved; ADRs just gain optional `purpose: decide` + `tier: living` fields.
- Validation tooling (`scripts/check-doc-frontmatter.mjs`) is extended, not replaced.

## Related artifacts

- [2026-05-16-docs-strategy-design.md](../superpowers/specs/2026-05-16-docs-strategy-design.md) — full strategy spec
- [2026-05-16-docs-strategy-memo.md](../superpowers/specs/2026-05-16-docs-strategy-memo.md) — CTO memo
- `scripts/docs-frontmatter-schema.mjs` — schema SSOT (updated in Play 1)
- `scripts/check-doc-frontmatter.mjs` — validation (updated in Play 1)
- `scripts/docs-frontmatter-fix.mjs` — backfill automation (updated in Play 1)
