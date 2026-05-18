---
title: 'VariScout Docs Strategy 2026 — Memo'
status: active
date: 2026-05-16
last-verified: 2026-05-17
purpose: orient
tier: stable
audience: both
topic: [docs-strategy, meta]
related: [2026-05-16-docs-strategy-design, adr-083-eight-purpose-doc-taxonomy]
layer: spec
---

# VariScout Docs Strategy 2026 — Memo

_CTO summary. Full design: [2026-05-16-docs-strategy-design.md](2026-05-16-docs-strategy-design.md). Schema change: [ADR-083](../../07-decisions/adr-083-eight-purpose-doc-taxonomy.md)._

---

## What we're changing

VariScout's docs scale-friction problem is **over-discipline at the metadata layer, under-discipline at the lifecycle layer**. We're flipping that: collapse the metadata schema, decompose the actual bloat sources, expose retrieval as a skill, replace batch audits with a steward loop, expand the AX-dev surface (skills) to 2026 conventions, and **codify single-source-of-truth discipline by doc type** (full design §2.7) — design specs edit-in-place, ADRs amendment-block-at-bottom, decision-log append-only — mechanically enforced via validator (no `*-amendment-*.md` orphan files).

## Diagnosis (from the brainstorm audit)

- 487 active docs across 521 files (94% utilization)
- Distribution: **Design 51%**, Decide 25%, Build 14%, System 6%, **Agent-context 4% — the critical gap**
- 17 emergent topic tags (close to my proposed vocabulary; codified in the new schema)
- 6 USER-JOURNEYS variants confirmed as **legitimate mode-specific splits** (not stale drift) — keep all
- Wedge content (2026-05-16) is the highest-impact consolidation target: decision-log replicates 90% of ADR-082 verbatim (~2000 redundant words)
- Methodology coverage is fragmented but recoverable: vision spec §2.1 (spine) + methodology.md (narrative) should be paired companions, not competing canonicals
- `.claude/rules/` should rename to `.claude/invariants/` — confirmed all 6 current files are constraint-purpose
- Specific fossils confirmed: `09-baseline/`, `10-development/project-status-audit-2026-04-16.md`, `03-features/learning/glossary.md`, `08-products/tier-philosophy.md`

## The foundation

Every doc serves exactly one of **8 purposes** (orient, decide, design, build, system, constrain, agent-context, remember) at one of **4 tiers** (stable, living, ephemeral, card). Topic tags (`ux`, `ax`, `coscout`, `canvas`, …) discriminate within purposes.

Industry frameworks (Diátaxis, Google's engineering-practices model) are human-reader-centric and pre-LLM-era. VariScout's 8-purpose taxonomy explicitly covers both human readers AND the AX-dev surface (subagents + CoScout) that's now half its doc system.

## The 8 plays + Phase A warm-up (~5.5 weeks elapsed)

- **Phase A** (~3h) — Quick wins: 4 of Agent 2's 8 consolidation moves (wedge content collapse, OVERVIEW compression, methodology clarification, business-bible cross-links). Zero-infra warm-up before structural moves.

1. **Velocity-tier restructure** (3d) — `git mv` to tier folders + schema collapse (22→5 STATUS including named-future, 18→tags, 14→3 AUDIENCE); fossil archive batch
2. **Cards & Discipline** (2w total; split shipped) — Play **2b (SSoT discipline by doc type)** can ship now safe-parallel (validator forbidding `*-amendment-*.md`; `doc-discipline.md` convention; lifecycle state enforcement). Plays **2a + 2c + 2d + 2e** (atomic decomposition + `pnpm docs:*` toolbox + `docs-toolbox` skill + `/docs-steward` loop) blocked on Play 1b substrate.
3. **Skills inventory build-out** (3d + ongoing) — expand from 2 to **18+** task-typed skills, **with Tier 1 agent-context essentials first** (`agent-context-quickstart`, `package-router`, `store-state-glossary`) to close the 4% gap immediately
4. **One canonical per concept** (1w) — execute remaining 4 of Agent 2's 8 moves; tier-philosophy archive; USER-JOURNEYS variant `inherits-from:` lineage; mis-housed folder refactors (08-products split, 06-design-system split)
5. **Telemetry + 90-day archive cohort** (2d) — toolbox skill logs queries; auto-prune unread cohort
6. **Constrain consolidation + invariants rename** (2d) — `.claude/rules/` → `.claude/invariants/` + `.claude/INVARIANTS.md` synthesis; collapse 4–5-place duplication
7. **System auto-generation** (3d) — `pnpm docs:gen-arch` from package.json + tsconfig
8. **CoScout AX-design consolidation** (2d) — gather ADR-060/068/069 + prompt rule into single canonical `coscout-ax-design.md` with `topic: [ax, coscout]`

## The 2026 differentiator

**The Steward Loop** (`/docs-steward`) — periodic Claude session that diffs `verified-against-commit` against current HEAD, proposes amendments for stale cards, outputs a review-ready report. The pending **Phase C audit (~500 docs)** becomes a continuous background process, not a 500-doc cliff.

## What we kill

- 22 STATUS enums → 4
- 18 CATEGORY enums → free-form topic tags
- 14 AUDIENCE enums → 3
- 11 numbered folders → 3 velocity tiers + cards/
- `.claude/rules/` (rename to `.claude/invariants/` for purpose clarity)
- ~2000 words of decision-log Wedge entry duplication (collapses to cite ADR-082)
- ~300 words of OVERVIEW.md methodology recap (compresses to 2 sentences + cross-link)
- Orphan `*-amendment-design.md` side-spec files → edit canonical in place + decision-log entry (validator HARD-FAILs filename anti-pattern)
- "⚠️ PARTIALLY SUPERSEDED" prefixes on canonical specs → spec body edited in place + supersession captured in decision-log + frontmatter
- `llms.txt` as static catalog → routing skill (Play 2d)
- Phase C audit as future project → Steward as weekly habit
- Specific fossils: `09-baseline/`, `tier-philosophy.md`, `10-development/project-status-audit-2026-04-16.md`, `03-features/learning/glossary.md`

## What we preserve (audit-confirmed)

- ADR discipline (74 of them is healthy; convention works)
- All 6 USER-JOURNEYS variants (legitimate mode-specific splits)
- Memory atomic-notes pattern (promoted up to docs)
- Validation tooling (extended, not replaced)
- Frontmatter SSOT in `scripts/` (pattern is right; schema simplifies)
- Subagent-driven-development workflow (materially improved by Cards & Threads + Skills inventory)
- Nested CLAUDE.md per package (progressive disclosure is correct)
- decision-log as the re-litigation gate (decompose storage, keep function)
- methodology.md + vision spec §2.1 dual-source partnership (clarified, not collapsed)

## CTO verdict

Current strategy is sound but is **scaling its own friction**: the more docs, the more enums to maintain, the more aggregates to keep current, the more "partially superseded" scar tissue. The fix is to invert that — make adding-a-doc _cheaper_ (smaller schema, atomic cards) and make doc-rot _self-detecting_ (Steward + telemetry). The agent-context cohort is the highest-leverage cohort to expand (4% of living docs, read every dispatch). Investment ~5.5 weeks (Phase A + 8 plays); recurring authoring tax drops materially; Phase C cliff is dissolved into a continuous loop; ~3 hours of Phase A warm-up removes the most visible noise immediately.
