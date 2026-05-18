---
title: 'project-eight-purpose-taxonomy'
description: 'ADR-083 — 8-purpose × 4-tier doc taxonomy with topic tags. Replaces 22 STATUS / 18 CATEGORY / 14 AUDIENCE enums. Schema-side shipped in PR'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: 6b6ea222-9daf-42ab-b211-7ad309428640
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_eight_purpose_taxonomy.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

# Eight-Purpose Doc Taxonomy (ADR-083)

Every VariScout doc serves exactly one of 8 purposes at one of 4 tiers. Topic tags discriminate within purposes (UX / AX / coscout / canvas / stats / etc.) rather than splitting into more purposes.

## The 8 purposes

| # | Purpose | Reader does this with it | Examples |
|---|---|---|---|
| A | **orient** | "What is VariScout? Why? For whom? At what price?" | positioning, business-bible, methodology, glossary, roadmap, tier-philosophy |
| B | **decide** | "What did we conclude?" (incl. open questions) | 74 ADRs, decision-log, investigations |
| C | **design** | "What is/should the product be?" (UX *and* AX) | specs, USER-JOURNEYS + 5 variants, design system, features, use cases, tutorials |
| D | **build** | "How do I implement this here?" (procedure) | `.claude/skills/`, plans, package CLAUDE.md procedure sections, `10-development/` |
| F | **system** | "How is it architected?" | DATA-FLOW, `05-technical/`, architecture-generated.md (Play 7), dep maps |
| G | **constrain** | "What must I never do?" (invariants) | `.claude/invariants/` (renamed from rules), `.claude/INVARIANTS.md`, ADR-073, constitution |
| H | **agent-context** | "I'm an agent — what do I need to know right now?" (AX-dev runtime) | root + 9 nested CLAUDE.md, AGENTS.md, llms.txt, MEMORY.md, agent-context skills |
| I | **remember** | "How did we get here?" (provenance) | decision-log Replayed Decisions, archived specs, baseline snapshots, transcripts |

## The 4 tiers (velocity)

- **stable** — years-stable (vision, methodology, glossary). Quarterly human review.
- **living** — months-stable, amend-not-rewrite (ADRs, specs, journeys). Steward-loop drift checks weekly (Play 2e).
- **ephemeral** — days-to-weeks, until-merged (active plans, open investigations). Auto-archive on close.
- **card** — atomic, append-only (decision/memory/investigation cards from Play 2a).

## Schema (frontmatter)

```yaml
purpose: <8-enum>
tier:    <4-enum>
topic:   [<kebab-tags>]                # ux, ax, coscout, canvas, stats, etc. — discriminate within purpose
status:  draft | active | superseded | archived
audience: human | agent | both
# operational
last-verified: YYYY-MM-DD
verified-against-commit: <sha>
supersedes: [<id>]
related: [<id>]
```

## What collapsed (from old schema)

- **STATUS** 22 → 4. Old values (`accepted`, `delivered`, `in-progress`, `deferred`, `design`, `living`, etc.) map via alias map → new 4 (`draft`/`active`/`superseded`/`archived`). Warns but doesn't fail during one transition cycle; hard-fail after Play 4.
- **CATEGORY** 18 → free-form `topic` tags. Enums lock into 2024 ontology; tags evolve naturally. Plan §7.1 lists 17 emergent topics from audit Agent 1.
- **AUDIENCE** 14 → 3. The 14 was over-engineering for hypothetical readers; VariScout has one external audience: solo dev + subagents.

## Topic vocabulary (audit-confirmed dominant)

`adr` (74) · `stats` (20) · `charts` (18) · `ux` (18) · `projects` (15) · `investigation` (15) · `canvas` (12) · `ax` (12) · `coscout` (10) · `methodology` (8) · `azure` (8) · `capability` (8) · `response-paths` (6) · `stores` (6) · `marketplace` (4) · `i18n` (4) · `tier-gating` (3)

Three dominant clusters: stats+charts (technical-analysis), canvas+investigation+projects (UX work), coscout+response-paths (AI integration) — 45% of living docs.

## Why 8 purposes (not Diátaxis or Google's 4)

Industry frameworks (Diátaxis: tutorial / how-to / reference / explanation; Google: design / ADR / runbook / postmortem / README) are human-reader-centric and pre-LLM-era. VariScout's 8-purpose taxonomy explicitly covers the **AX-dev surface** (subagents + CoScout) that's now half its doc system.

The 8th (`agent-context`) was the audit's confirmed under-engineered cohort at 4% of living docs — addressed by Play 3a (Tier 1 skills) + Play 6 (INVARIANTS.md synthesis loaded on session start).

## Canonical references

- ADR: `docs/07-decisions/adr-083-eight-purpose-doc-taxonomy.md`
- Spec: `docs/superpowers/specs/2026-05-16-docs-strategy-design.md`
- Memo: `docs/superpowers/specs/2026-05-16-docs-strategy-memo.md`
- Schema source-of-truth: `scripts/docs-frontmatter-schema.mjs`

Related: [[project_docs_strategy_2026]]
