---
title: 'project-docs-strategy-2026'
description: 'Docs strategy 2026 — Phases 1-3 SHIPPED. Phase 4 + spec-driven-dev brainstorm parked.'
purpose: remember
tier: card
status: active
date: 2026-06-01
topic: [memory, project]
related: []
verified-against-commit: fe1b0755
last-verified: 2026-06-01
source-hash: e640d8905a387fe8
origin-session-id: 6b6ea222-9daf-42ab-b211-7ad309428640
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_docs_strategy_2026.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

# VariScout Docs Strategy 2026

**Status 2026-05-18**: Phases 1-3 shipped on main. PRs #199 + #200 + #201 + #202.

**Foundation**: docs serve one of 8 purposes (orient / decide / design / build / system / constrain / agent-context / remember) at one of 4 tiers (stable / living / ephemeral / card). Schema: **5 STATUS** (`draft, active, named-future, superseded, archived`), `topic:` free-form tags, **3 AUDIENCE**. ADR-083 is the canonical schema doc.

## Phase 1 (PR #199, merged) — Infrastructure
8-purpose × 4-tier schema + ADR-083 + Tier-1 agent-context skills (`agent-context-quickstart`, `package-router`, `store-state-glossary`, `writing-tests`) + `.claude/INVARIANTS.md` synthesis + `pnpm docs:gen-arch` + `docs/01-vision/coscout-ax-design.md` (CoScout AX canonical) + doc-discipline foundation.

## Phase 2 (PR #200, merged) — Discipline + retrieval surface
- `scripts/check-doc-frontmatter.mjs` extended: HARD-FAILs anti-pattern filenames (`*-amendment-*.md` etc.) under `docs/superpowers/specs/`; banner enforcement; `--diff` mode for decision-log + design-spec amendment WARNs.
- 6-command toolbox: `pnpm docs:find / docs:get / docs:related / docs:recent / docs:verify / docs:amend`.
- `.claude/skills/docs-toolbox/SKILL.md` auto-discovery skill; `docs/llms.txt` rewritten from catalog → router.
- `EDIT_TYPES` canonical vocabulary in `scripts/docs-toolbox/lib/edit-types.mjs`.

## Phase 3 (PRs #201 + #202, merged) — Substrate + Steward
- **264 atomic cards** under `docs/cards/{decisions,investigations,memory}/` (68 + 15 + 181). See [[project_phase3_cards_substrate]].
- `docs/decision-log.md` is now a **generated aggregate** from cards (`.prettierignore`d). §1/§2/§3 emitted from cards; §4/§5 preserved verbatim in HTML markers.
- `docs/investigations.md` is a 19-line stub; open queue at `docs/ephemeral/investigations.md`; closed entries are cards.
- 4 new scripts under `scripts/docs/`: `decompose-decision-log.mjs`, `decompose-investigations.mjs`, `sync-memory-cards.mjs`, `rebuild-views.mjs` (`pnpm docs:rebuild`).
- Toolbox card-awareness: `recent.mjs` dual-source (cards + §4 backlog); `amend.mjs` HARD-FAILs on `tier: card`; `EDIT_TYPES` extended.
- Steward loop: `pnpm docs:steward` (read-only drift detection) + `/docs-steward` slash command + weekly GH Action (Mondays 09:00 UTC, posts Issue labeled `docs-steward` + `automated`).
- Validator scoping: `check-dead-links.sh` + `check-diagram-health.sh` exclude `docs/cards/**` as link source (cards are queryable, not navigated — see [[feedback_cards_queryable_not_navigated]]).
- Memory mirror hash-guard: `sync-memory-cards.mjs` adds `source-hash` frontmatter; skip-rewrite when source content unchanged. Prevents Steward false-positive flood (see [[feedback_generator_source_hash_guard]]).
- Discipline doc `docs/agent-context/doc-discipline.md` has §Cards section with append-only lifecycle + supersession-via-new-card pattern.

## Remaining work (parked for future sessions)

- **Post-Phase-3 brainstorm**: spec-driven development architecture — the SSoT collision between `docs/superpowers/specs/` and product docs. Anchoring questions documented in [[project_spec_driven_dev_brainstorm]].
- **MEMORY.md index shrinking**: ~200 entries to ≤100 chars each. Judgment-heavy content rewriting; not script-able.
- **Phase 4 plays**: Play 4 (one-canonical-consolidation across multi-canonical overlaps) + Play 5 (telemetry: `docs/.telemetry/queries.jsonl` + `pnpm docs:cohort-report`). Depends on Play 5 telemetry to drive Play 4 data-driven choices.
- **Steward first-real-run tuning**: wait for first Monday cron, see what surfaces, tune thresholds if floody. Currently: stale >30 commits OR >90 days + doc touched; untouched-but-referenced >=10 inbound + >60 days; citation cap 5/doc.

## Working files

- Plan files: `~/.claude/plans/lets-plan-phase-3-fancy-wombat.md` (Phase 3 plan, executed across 2 PRs).
- Design spec: `docs/superpowers/specs/2026-05-16-docs-strategy-design.md` (canonical).
- Schema: `scripts/docs-frontmatter-schema.mjs` exports `PURPOSE / TIER / STATUS / AUDIENCE / EDIT_TYPES / ANTI_PATTERN_*` constants.

Related: [[project_phase3_cards_substrate]], [[project_spec_driven_dev_brainstorm]], [[project_eight_purpose_taxonomy]], [[project_wedge_v1]], [[feedback_cards_queryable_not_navigated]], [[feedback_generator_source_hash_guard]], [[feedback_validator_inclusion_list_over_blocklist]], [[feedback_autogen_doc_prettierignore]], [[feedback_bundle_followups_pre_merge]]
