---
title: 'project-docs-strategy-2026'
description: '2026-05-16 PR'
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

> 🤖 **Generated mirror** of `~/.claude/memory/project_docs_strategy_2026.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

# VariScout Docs Strategy 2026

**Current PR**: #199 — https://github.com/jukka-matti/variscout/pull/199 (21 commits, cherry-picked from #184 onto latest main).
**Closed**: #184 (superseded by #199 after main shipped 21 PRs of wedge V1 + Phase C while #184 was open).

**Foundation**: docs serve one of 8 purposes (orient / decide / design / build / system / constrain / agent-context / remember) at one of 4 tiers (stable / living / ephemeral / card). Schema collapse: **22→5 STATUS** (`draft, active, named-future, superseded, archived`), 18 CATEGORY → free-form `topic` tags, 14→3 AUDIENCE. Alias maps preserve back-compat for one transition cycle. Captured as ADR-083 (see [[project_eight_purpose_taxonomy]]). `named-future` was added 2026-05-17 after user pushed back on aliasing aspirational VariScout Process docs to `active` (see [[feedback_collapse_audit_for_distinct_states]]).

**Shipped (safe-parallel with active wedge V1)**:
- **Phase A**: wedge content consolidation (decision-log 2500→280 words; OVERVIEW journey 200→70 words; methodology dual-source clarification; positioning + root CLAUDE.md → business-bible cross-links).
- **Play 1a**: foundation artifacts (`docs/superpowers/specs/2026-05-16-docs-strategy-{memo,design}.md` + `docs/07-decisions/adr-083-eight-purpose-doc-taxonomy.md`) + schema collapse + frontmatter backfill across corpus.
- **Play 3a**: Tier 1 agent-context skills (`agent-context-quickstart`, `package-router`, `store-state-glossary`) + 3 supporting docs at `docs/agent-context/` (TEMP location; Play 1b moves to `docs/living/agent-context/`).
- **Play 6**: `.claude/rules/` → `.claude/invariants/` rename + `.claude/INVARIANTS.md` synthesis (15 hard + 10 soft + 6 topic-scoped). Path-scoping still broken upstream; loads globally.
- **Play 7**: `pnpm docs:gen-arch` script (dep graph mermaid + sub-path export map + Tailwind @source coverage) + initial generated arch doc + pre-push staleness check + `.prettierignore` exclusion.
- **Play 8**: canonical `docs/01-vision/coscout-ax-design.md` (172 lines) consolidating ADR-060/068/069 + coscout-prompts invariant; cross-links from constituents.

**Also shipped in PR #199** (added post-wedge-amendment-incident on 2026-05-17):
- **Doc discipline (Play 2b spec)**: 4 affirmative principles (doc-type / one-canonical / reader-first banners / decision-log temporal index); `docs/agent-context/doc-discipline.md` canonical reference; banner templates + spec lifecycle states + decision-log entry format with edit-type vocabulary; validator extension scoped for Play 2b execution. See [[feedback_design_specs_edit_in_place]] for origin story.
- **`named-future` as 5th canonical STATUS**: corrected from initial alias-to-`active` framing after user feedback that aspirational future docs shouldn't be labeled active.

**Remaining Phases (per plan §11.6 — was "Sessions", reframed as Phases 2026-05-17)**:
- **Phase 2**: SSoT validator + toolbox scripts + toolbox skill + alignment pass. ~14 subagents (6 implementer + 12 reviewer + 1 final). Branch: `docs-strategy-2026-discipline`. Ship as 1 PR.
- **Phase 3**: Plays 1b (521-doc folder restructure) + 2a (atomic decomposition) combined ("Substrate is the substrate"). DISCUSS 1b first — wedge V1 + Phase C done, so blocker gone; but is the mv still worth doing given Phase C cleanup? ~18 subagents. Branch: `docs-strategy-2026-substrate`.
- **Phase 4**: Plays 2e (steward) + 5 (telemetry) + Play 4 audit (leftover consolidation). ~14 subagents. Branch: `docs-strategy-2026-steward`. Operates on FINAL folder structure from Phase 3.
- **Ongoing**: Play 3b (Tier 2 procedure skills) data-driven from Play 5 telemetry.

Total budget across Phases 2-4: ~46 subagents. Safe pattern: 1 phase per session.

**Working files**:
- Plan: `~/.claude/plans/i-was-wondering-that-effervescent-boole.md` (full strategy + audit findings + 8 plays + verification + risks + open questions)
- Worktree: `.claude/worktrees/docs-strategy-2026/` on branch `worktree-docs-strategy-2026` (preserved for PR iteration)
- Audit reports embedded in plan §7: purpose-mapping of 487 active docs (Agent 1) + multi-canonical overlap detection across Orient + Decide clusters (Agent 2)

**Key audit findings affecting future plays**:
- USER-JOURNEYS variants (all 6): confirmed **legitimate mode-specific splits** (not stale drift) — keep all with `inherits-from:` lineage in Play 4b.
- Agent-context cohort: 4% of living docs — confirmed under-engineered; Play 3a closed the gap with Tier 1 skills.
- Wedge content: 90% redundancy between decision-log + ADR-082; Phase A collapsed.
- methodology.md + vision spec §2: dual canonical companions (clarified in Phase A); not consolidating.

Related: [[project_wedge_v1]], [[project_eight_purpose_taxonomy]], [[feedback_parallel_workstream_conflict_check]], [[feedback_taskstop_subagent_pivot]], [[feedback_autogen_doc_prettierignore]]
