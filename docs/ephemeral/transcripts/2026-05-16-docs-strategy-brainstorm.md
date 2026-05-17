---
title: 'Docs Strategy 2026 — Brainstorm Transcript'
purpose: remember
tier: ephemeral
status: archived
audience: human
topic: [docs-strategy, transcript, brainstorm]
last-verified: 2026-05-17
related:
  [
    2026-05-16-docs-strategy-design,
    2026-05-16-docs-strategy-memo,
    adr-083-eight-purpose-doc-taxonomy,
  ]
---

# VariScout Documentation Strategy 2026 — Brainstorm Transcript

> 🗄 **Archived 2026-05-17. Historical reference only.** This file is the preserved brainstorm transcript that produced the docs-strategy-2026 design. The CANONICAL strategy lives at:
>
> - **Design spec**: [`docs/superpowers/specs/2026-05-16-docs-strategy-design.md`](../../superpowers/specs/2026-05-16-docs-strategy-design.md) (edit there when intent changes — per [`docs/agent-context/doc-discipline.md`](../../agent-context/doc-discipline.md))
> - **Memo**: [`docs/superpowers/specs/2026-05-16-docs-strategy-memo.md`](../../superpowers/specs/2026-05-16-docs-strategy-memo.md)
> - **Schema ADR**: [`docs/07-decisions/adr-083-eight-purpose-doc-taxonomy.md`](../../07-decisions/adr-083-eight-purpose-doc-taxonomy.md)
>
> This transcript captures the full design journey including audit findings (Agent 1 + Agent 2), mid-session recalibration after the wedge-amendment incident, banner principle addition, and the §11 post-PR-184 recalibration done 2026-05-17. Future strategy changes happen in the canonical design spec (edit in place); this transcript stays frozen as the historical record.

---

## 0. Execution Setup (worktree)

Per `[[feedback_one_worktree_per_agent]]` + `[[feedback_subagent_worktree_discipline]]` + `superpowers:using-git-worktrees` skill: **all writes for this initiative happen inside a dedicated worktree**, not in the main checkout.

**Step 0a — Create worktree** (first action after plan approval):

- Prefer native `EnterWorktree` tool if available (Claude Code platform native; skill's Step 1a preference).
- Fallback: `git worktree add .worktrees/docs-strategy-2026 -b docs-strategy-2026` (skill's Step 1b).
- Verify `.worktrees/` is in `.gitignore` before creating project-local worktree.
- `cd` into worktree, run `pnpm install`, run `pnpm docs:health` to verify clean baseline.

**Branch name**: `docs-strategy-2026` (or `docs-strategy-2026-05-16` if dating preferred per repo convention).

**Per-play merge pattern** (per repo CLAUDE.md "Tooling / docs / config: direct commit to main is fine"):

- Phase A + Plays 1, 5, 6, 7, 8 are docs/scripts/.claude-only → can land via direct push from worktree to main when complete.
- Plays 2, 3, 4 touch enough surface area (cards decomposition, skill inventory, consolidation moves) to warrant PR-per-play with `bash scripts/pr-ready-check.sh` + code-reviewer subagent gate.

**Subagent worktree discipline** (per `[[feedback_one_worktree_per_agent]]`):

- Any subagent dispatched during execution that will WRITE owns its own `.worktrees/<sub-branch>/` checkout.
- Main session stays in `docs-strategy-2026` worktree; never share checkouts.

**Session scoping**: This plan covers ~5.5 weeks. Execute **Phase A (3-hour warm-up) only in this first session** to validate the addendum-thread pattern at human scale + the worktree setup. Confirm with user before launching Play 1 (folder restructure) in a subsequent session.

---

## 1. Context

VariScout's documentation system reflects two years of disciplined authoring — 521 markdown files, 74 ADRs, 50 active specs, validation tooling, frontmatter SSOT, atomic-notes memory, nested CLAUDE.md hierarchy. The investment pays off: the recent wedge pivot was managed entirely through doc artifacts.

But the system is **scaling its own friction**:

- `MEMORY.md` is **over its 24.4KB size limit** (36KB; Claude loads partially — agent doesn't know what it doesn't know).
- `decision-log.md` is **170KB** and growing as the re-litigation gate; queryable only by reading the whole thing.
- **Phase C audit (~500 docs)** is pending after the wedge pivot — drift fix is scheduled as a project, not as a continuous loop.
- **Multi-canonical claimants**: vision lives in 5+ places (positioning, business-bible, OVERVIEW, USER-JOURNEYS, root CLAUDE.md, methodology); decisions live in 3 places (ADRs, decision-log, MEMORY).
- **Metadata over-engineered**: 22 STATUS × 18 CATEGORY × 14 AUDIENCE × 11 numbered folders.
- **Lifecycle under-engineered**: no freshness signal, no read telemetry, no spec ↔ implementation drift sensor.
- **Agent Context (AX-dev surface) under-engineered**: 2 skills + 6 globally-loaded rules (path-scoping broken upstream). By 2026 conventions, a project this size has 15+ task-typed skills.

The fix is not "more documentation infrastructure" — it's **less, but living**: simpler metadata, atomic decomposition of bloat sources, addendum threads instead of rewrites, agent-queryable retrieval, continuous freshness, expanded skill inventory.

This plan delivers:

1. A **2026-shaped doc strategy** built on a two-axis foundation (8 purposes × 4 tiers).
2. **8 engineering plays** sequenced as ~5-week incremental rollout.
3. A **1-page CTO memo** for durable executive summary + a **full design spec** for implementation reference.

The underlying frame: docs serve _purposes_, not categories. Industry-standard frameworks (Diátaxis, Google's engineering-practices) are human-reader-centric and pre-LLM-era. VariScout needs a taxonomy that covers both human readers AND the AX-dev surface (subagents) that's now half its doc system.

---

## 2. The Foundation: 8 Purposes × 4 Tiers

### 2.1 The 8 purposes

Every doc serves exactly one purpose. Purpose drives **shape and tooling**.

| #     | Purpose           | Reader does this with it                                                        | Failure mode                                 | Example artifacts                                                                      |
| ----- | ----------------- | ------------------------------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------- |
| **A** | **orient**        | "What is VariScout? Why? For whom? At what price?"                              | Stale narrative misleads about current state | positioning, business-bible, methodology, glossary, roadmap, tier-philosophy, OVERVIEW |
| **B** | **decide**        | "What did we conclude?" (incl. open questions awaiting decision)                | Re-litigation; lost provenance               | 74 ADRs, decision-log, investigations                                                  |
| **C** | **design**        | "What is/should the product be?" (any scope — UX _and_ AX design)               | Spec ↔ implementation drift                  | journeys, 50 specs, design system, features, use cases, tutorials                      |
| **D** | **build**         | "How do I implement this _here_?" (procedure)                                   | Agent uses outdated procedure                | `.claude/skills/`, plans, procedure sections in package CLAUDE.mds, `10-development/`  |
| **F** | **system**        | "How is the system architected?"                                                | Diagrams describe old architecture           | DATA-FLOW, `05-technical/`, dependency maps                                            |
| **G** | **constrain**     | "What must I never do?" (invariants)                                            | Constraint ignored; not enforced             | `.claude/rules/`, constitution, ADR-073, P5/P7-style principles                        |
| **H** | **agent-context** | "I'm an agent — what do I need to know right now?" (the AX-dev runtime surface) | Context bloat; wrong information loaded      | root + 9 nested CLAUDE.md, AGENTS.md, llms.txt, MEMORY.md, skills (router half)        |
| **I** | **remember**      | "How did we get here? Why was X decided?" (provenance)                          | Lost institutional knowledge                 | decision-log Replayed Decisions, archived specs, baseline snapshots, transcripts       |

### 2.2 The 4 tiers (velocity)

Tier drives **lifecycle and maintenance cadence**.

| Tier          | Volatility                              | Examples                                          | Maintenance                      |
| ------------- | --------------------------------------- | ------------------------------------------------- | -------------------------------- |
| **stable**    | Years-stable                            | vision, positioning, methodology, glossary        | Quarterly human review           |
| **living**    | Months-stable, amend-not-rewrite        | ADRs, specs, journeys, design system, features    | Steward-loop drift checks weekly |
| **ephemeral** | Days-to-weeks, lifecycle = until-merged | active plans, open investigations                 | Auto-archive on close            |
| **card**      | Atomic, append-only                     | decision cards, memory cards, investigation cards | Continuous (Steward + telemetry) |

### 2.3 Two-axis schema

```yaml
purpose: orient | decide | design | build | system | constrain | agent-context | remember
tier: stable | living | ephemeral | card
topic: [<kebab-tags>] # ux, ax, coscout, canvas, stats, etc. — free-form
status: draft | active | superseded | archived
audience: human | agent | both
# operational
last-verified: YYYY-MM-DD
verified-against-commit: <sha>
supersedes: [<id>]
related: [<id>]
```

**Collapse from current schema**:

- 22 STATUS enums → **4** (`draft, active, superseded, archived`). Most of the 22 are aspirational distinctions never used.
- 18 CATEGORY enums → **free-form `topic` tags**. Enums lock you into a 2024 ontology; tags evolve.
- 14 AUDIENCE enums → **3** (`human, agent, both`). You have one external audience: you + your subagents.
- 11 numbered folders → **3 velocity-tier folders + cards/** (see §2.5).
- **New fields**: `purpose` (the foundation), `tier` (velocity), `last-verified`, `verified-against-commit` (drift sensors).

### 2.4 UX, AX, CoScout — handled as topic tags

Rather than splitting these into new purposes, they ride on `topic`:

- UX-flavored Design: `topic: [ux, journey]`, `topic: [ux, design-system]`, `topic: [ux, feature]`
- AX-flavored Design: `topic: [ax, agent-dispatch]`, `topic: [ax, coscout]`, `topic: [ax, subagent-workflow]`
- CoScout-specific (cross-purpose): `topic: [coscout, prompts]`, `topic: [coscout, knowledge]`, `topic: [coscout, safety]`

Query: `pnpm docs:find --purpose=design --topic=ax` returns AX-design docs only. Or `--topic=coscout` returns everything CoScout-related across all purposes.

### 2.5 Folder restructure

```
docs/
  stable/                       # purpose-mixed, all tier=stable: vision, methodology, glossary, baseline
  living/                       # purpose-mixed, all tier=living
    orient/                    # roadmap, tier-philosophy
    decide/                    # ADRs (formerly 07-decisions/)
    design/                    # specs, journeys, design system, features
    build/                     # 10-development, plans (until merged)
    system/                    # 05-technical, DATA-FLOW
    agent-context/             # AGENTS.md, llms.txt, root CLAUDE.md (link only — root stays at repo root)
  ephemeral/                    # active plans, open investigations
    plans/                     # active plans only; closed → cards/
    investigations/            # open observations only; closed → cards/
    transcripts/               # selected plan promotions (Play 5)
  cards/                        # atomic units, queryable
    decisions/                 # one card per decision (from decision-log + ADRs after maturation)
    memory/                    # atomic feedback/user/project memories (mirrored from ~/.claude/memory)
    investigations/            # closed-but-not-decided observations
  archive/                      # superseded, retained for git history readers
```

Nested package `CLAUDE.md` files stay in `packages/*/` and `apps/*/` (progressive disclosure is correct; don't move).

### 2.6 Per-purpose treatment

| Purpose           | Shape                                                                        | Tooling                                                                                       | Lifecycle treatment                                                 |
| ----------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **orient**        | ≤6 canonical narrative docs                                                  | Addendum threads; pinned amendments                                                           | Stable; manually reviewed quarterly                                 |
| **decide**        | Atomic cards                                                                 | `pnpm docs:find/get/related`; supersession chains                                             | Card-tier; continuous via Steward                                   |
| **design**        | Living specs with `implements:` ADR back-link                                | Spec ↔ impl drift sensor (cited symbols → AST check, Playwright selector check for UX-Design) | Living → archive on ship; `draft → active → delivered → superseded` |
| **build**         | Skills (procedures) + ephemeral plans + package CLAUDE.md procedure sections | `.claude/skills/`; subagent-driven-development                                                | Skills: living; Plans: ephemeral; patterns in nested CLAUDE.md      |
| **system**        | Auto-generated where possible (deps, exports), narrated where not            | `pnpm docs:gen-arch` from package.json + tsconfig                                             | Living; auto-regenerate on push                                     |
| **constrain**     | Rules + linting + tests (NOT prose)                                          | ESLint + pre-commit + denylist scripts                                                        | Stable; rules removed only via ADR                                  |
| **agent-context** | Progressive disclosure: root → nested → skills → cards                       | Skill auto-load by description; CLAUDE.md size budget; routing skill replaces static catalog  | Living; weekly size check; skill inventory growth                   |
| **remember**      | Chronological cards + selected transcript promotions                         | `docs/cards/` for B+I; `docs/ephemeral/transcripts/` for selected plans                       | Append-only; never edited (amendments via thread)                   |

---

## 3. The 8 Engineering Plays

Each play is independently shippable. Sequence is deliberate (P1 unlocks P2; P3 best after P2 for skills-citing-toolbox; P4 best after P2 so consolidation cites cards).

### Play 1 — Velocity-tier restructure + schema simplification (3 days)

**Objective**: Move docs into purpose × tier folders + collapse frontmatter schema.

**Deliverables**:

- New folder hierarchy under `docs/stable/`, `docs/living/<purpose>/`, `docs/ephemeral/`, `docs/cards/`
- `scripts/docs-frontmatter-schema.mjs` updated: 4 STATUS, free-form topic, 3 AUDIENCE, new `purpose` + `tier` + drift fields
- `scripts/docs-frontmatter-fix.mjs` extended to backfill `purpose` + `tier` based on inferred mapping
- All 521 docs `git mv`'d into new locations (history preserved)
- `docs/llms.txt` updated to reflect new tree
- Root `CLAUDE.md` "Where to look" section updated

**Exit criteria**: `pnpm docs:health` green; all internal links resolve; `bash scripts/pr-ready-check.sh` green.

### Play 2 — Cards & Threads engineering kernel (2 weeks)

**Objective**: Atomic decomposition of bloat sources + addendum-thread convention + toolbox scripts + retrieval skill + Steward loop.

**Sub-deliverables**:

**2a — Atomic decomposition (3 days)**:

- `decision-log.md` (170KB) → `docs/cards/decisions/dec-<YYYYMMDD>-<slug>.md`, one card per decision. Generated view back to `docs/living/decide/decision-log.md` via `pnpm docs:rebuild`.
- `MEMORY.md` index lines (over 24.4KB limit) → shrink each to ≤100 chars (currently 200–400). Existing topic files in `~/.claude/memory` already atomic; mirror or symlink into `docs/cards/memory/` for cross-context discoverability.
- `investigations.md` (61KB) → closed investigations → `docs/cards/investigations/inv-<YYYYMMDD>-<slug>.md`. Open investigations stay in `docs/ephemeral/investigations/`.

**2b — Addendum threads (2 days)**:

- Convention: living-tier docs (specs, ADRs, design docs, cards) get a `## Amendments` section at the bottom. Dated, sourced entries:
  ```
  ## Amendments
  - 2026-05-16 — Wedge pivot (PR #182): supersedes §4 (multi-Hub portfolio).
    Single product for improvement specialists; §4.1 retained, §4.2–§4.5 archived.
  ```
- `scripts/check-doc-frontmatter.mjs` extended to validate amendment section format (date format, source link, body present).
- One-shot script: convert existing "⚠️ PARTIALLY SUPERSEDED" prefixes in MEMORY.md + scattered docs → dated amendment entries with sources from `git log` / decision-log.

**2c — Toolbox scripts (3 days)**:

- `scripts/docs-toolbox/find.mjs` — ripgrep + frontmatter filter, returns top-5 cards with excerpts. BM25 optional later.
- `scripts/docs-toolbox/get.mjs` — full card by id.
- `scripts/docs-toolbox/related.mjs` — graph traversal via `related:` + body `[[name]]`.
- `scripts/docs-toolbox/recent.mjs` — new cards + amendment entries since date.
- `scripts/docs-toolbox/verify.mjs` — bump `last-verified` + `verified-against-commit`.
- `scripts/docs-toolbox/amend.mjs` — append to `## Amendments` section.
- Wired to `pnpm docs:find/get/related/recent/verify/amend` (root `package.json`).

**2d — Docs toolbox skill (1 day)**:

- `.claude/skills/docs-toolbox/SKILL.md` with frontmatter:
  ```yaml
  ---
  name: docs-toolbox
  description: Use when you need to find, read, or amend VariScout docs (decisions, ADRs, specs, investigations, memory cards). Exposes pnpm docs:* commands.
  ---
  ```
- Body: when-to-use, tool surface (`pnpm docs:*`), task kits ("for X task type, load these cards: …"), examples.
- `docs/llms.txt` converts from static catalog → router pointing to this skill ("for retrieval, use the docs-toolbox skill").

**2e — Steward loop (2 days)**:

- `scripts/docs-steward.mjs` — Node CLI that:
  1. `git log --since="$LAST_RUN"` for changed source files
  2. For each touched file, queries cards via `docs:find` against referenced symbols/paths
  3. Outputs a markdown report: stale cards, suggested amendments, untouched-but-referenced
- `.claude/commands/docs-steward.md` slash command that runs the script + spawns Claude to triage the report + propose amendments via `docs:amend`
- Manual trigger initially; cron later

**Exit criteria**:

- `pnpm docs:find "wedge"` returns ranked cards with excerpts
- `pnpm docs:get adr-082` returns full ADR
- `pnpm docs:amend adr-082 --reason "..."` appends to amendments + bumps `last-verified`
- `/docs-steward` produces a review-ready markdown report
- `MEMORY.md` index <24.4KB
- `decision-log.md` either deleted or a generated view <50KB

### Play 3 — Skills inventory build-out (3 days + ongoing) — **THE AX-DEV INVESTMENT**

**Objective**: Expand from 2 skills to ~18 task-typed skills covering common subagent dispatches. Closes the **4%-of-living agent-context gap** that audit Agent 1 surfaced. Skills are the highest-leverage doc surface because they're read on every dispatch.

**Skills to add — Tier 1: Agent-context essentials** (close the 4% gap):

- `agent-context-quickstart` — 5-minute "I'm an agent, what do I need to know" surface. Loads new `docs/living/agent-context/onboarding-quick-start.md` (to create as part of this play).
- `package-router` — "which package CLAUDE.md / nested context to load for this work". Loads new `docs/living/agent-context/package-router.md` (mapping: work area → relevant CLAUDE.md + ADRs + rules + skills).
- `store-state-glossary` — what's in projectStore / investigationStore / viewStore / preferencesStore / etc. Loads new `docs/living/agent-context/store-state-glossary.md` (sources from `packages/stores/CLAUDE.md`).

**Tier 2: Task-typed procedure skills**:

- `ship-ui-primitive` — implement a new UI component end-to-end (design tokens + Tailwind + test)
- `add-chart` — add a chart per `.claude/invariants/charts.md` patterns
- `migrate-store` — Zustand store changes per ADR-078 + F4 architecture
- `add-stats-test` — statistical test per `.claude/invariants/stats.md`
- `add-i18n-string` — localization addition per `.claude/invariants/i18n.md`
- `write-spec` — author a new design spec following the brainstorming → writing-plans flow
- `amend-adr` — append to an ADR's amendments section + update related cards
- `run-coscout-eval` — execute + interpret a CoScout eval suite
- `debug-canvas-issue` — canvas debugging procedure per packages/ui canvas docs
- `add-investigation-card` — create a new investigation card with proper frontmatter
- `add-decision-card` — create a new decision card (graduates an investigation or supersedes an ADR)
- `verify-spec-against-impl` — drift check: spec-cited symbols vs current code
- `promote-plan-to-transcript` — promote a `~/.claude/plans/` file to `docs/ephemeral/transcripts/`
- `run-docs-steward` — manual steward loop invocation
- `architecture-test-write` — author a new structural-absence guard test per the `[[feedback_structural_absence_guard_pattern]]` memory

Each skill: ~50–200 line markdown with frontmatter description (for auto-trigger), when-to-use, context paths to load, procedure, exit criteria, common pitfalls.

**Exit criteria**: 18+ skills with valid frontmatter; sampled subagent dispatch loads correct skill (especially agent-context-quickstart on first dispatch in a fresh session); `.claude/invariants/` (renamed from rules) reduced to pure constraints; agent-context cohort grows from 15 docs (4%) to ~25 docs (~7%) measurable in the cohort report.

### Play 4 — One canonical artifact per concept (1 week)

**Objective**: Execute the 8 consolidation moves from Agent 2 + archive fossils + lock canonical homes per overlap matrix.

**Inputs**: Audit Agent 2 overlap matrix + 8-move consolidation list (Section 7.2).

**Deliverables**:

**4a — Wedge content consolidation** (~3 hours; the highest-impact single move):

- `decision-log.md` "Wedge pivot" entry collapses from ~2000 words → 5-sentence summary + cite ADR-082.
- OVERVIEW.md compresses §The journey model from 300 words → 2 sentences + cross-link USER-JOURNEYS.md.
- methodology.md frontmatter rewritten to clarify dual-source partnership with vision spec §2.1 ("paired companions").
- positioning.md + CLAUDE.md add cross-links to business-bible.md §Strategic Hypotheses H1–H6.
- Product anatomy (6 tabs, 4 stages, pricing) — all references lock to ADR-082 table; OVERVIEW + positioning + CLAUDE.md cite the table rather than restate.

**4b — USER-JOURNEYS variants — KEEP ALL SIX** (audit-confirmed: legitimate mode-specific splits, not stale drift):

- Add `inherits-from: USER-JOURNEYS.md` to the 5 mode-specific variants (CAPABILITY, YAMAZUMI, PERFORMANCE, DEFECT, PROCESS-FLOW) for explicit lineage.
- NO merging. Each variant has unique chart suite + CoScout coaching + Specialist workflow that earns its keep.
- Update base `USER-JOURNEYS.md` lines 92–101 to formalize the variants-listing convention.

**4c — Tier-philosophy archive**:

- `git mv docs/08-products/tier-philosophy.md docs/archive/`
- Add redirect banner at top of `docs/08-products/index.md` (or wherever consolidated): "V1 pricing (€99 single SKU) supersedes the €79/€199 tiered model. See ADR-082 §Pricing rationale."

**4d — Decision-log scope tightening**:

- Move "Projects tab" amendments (A–E, PRs #177–#181) from decision-log → `docs/ephemeral/investigations/` as `[RESOLVED]` ship-log entries.
- Move "8f canvas" amendments from decision-log → same.
- Decision-log §Open Questions becomes the cross-spec re-litigation gate only (not catch-all).
- Closed investigations decompose to `docs/cards/investigations/` per Play 2a.

**4e — Orient cluster collapse**:

- Target ≤6 canonical Orient docs: positioning, business-bible (with H1–H6), methodology, glossary, roadmap, vision spec.
- Tier-philosophy archived (Play 4c).
- OVERVIEW.md remains as landing page but compressed (no re-derivation).
- 12 → 6 Orient docs.

**4f — Mis-housed folder refactors** (per Agent 1):

- `08-products/` split: tier-philosophy + iso-alignment → `docs/stable/orient/` (or archive per 4c); azure + pwa + feature-parity → `docs/living/system/product-deployments/`; presentations folder → retire.
- `06-design-system/` split: `spec/` (patterns, charts, foundations) + `implementation/` (CSS chains, interaction procedures).

**4g — Fossil archive batch**:

- `09-baseline/` (both files) → `docs/archive/baselines/`. Create new v1 wedge baseline.
- `10-development/project-status-audit-2026-04-16.md` → `docs/archive/audits/`.
- `03-features/learning/glossary.md` → delete after merging unique content into root `glossary.md`.
- `.claude/agents/flow-nexus/` → `.claude/agents/experimental/` or archive (verify v1 vs named-future first).
- Pre-2026-05-07 specs in `docs/superpowers/specs/` — frontmatter date scan + roadmap verification; archive those not on current roadmap.

**4h — llms.txt canonical-artifacts section**:

- Add section: "Canonical artifacts: positioning.md (positioning + audience), business-bible.md (strategic hypotheses), ADR-082 (V1 architecture), wedge spec, vision spec, methodology.md (pedagogical companion)."
- AI agents working on major features start here, not through decision-log search.

**Exit criteria**:

- `pnpm docs:find "vision"` returns one canonical (positioning.md)
- `pnpm docs:find "wedge"` returns ADR-082 as top result
- Re-run agent 2's overlap check; no `HIGH` or `VERY HIGH` overlap pairs remain
- Orient cohort ≤6 docs
- All 8 of agent 2's consolidation moves executed
- All 6 USER-JOURNEYS variants present with `inherits-from:` lineage

### Play 5 — Telemetry + 90-day archive cohort (2 days)

**Objective**: Read-feedback loop + auto-pruning of unread docs.

**Deliverables**:

- `scripts/docs-toolbox/find.mjs` (and friends) log every query to `docs/.telemetry/queries.jsonl`: timestamp, query, results returned, results opened (best-effort).
- `scripts/docs-toolbox/cohort-report.mjs` outputs:
  - Untouched-in-90-days cards
  - Top-queried cards (validate they're up-to-date)
  - Never-returned cards (orphans)
- `docs/.telemetry/` in `.gitignore` (session-local, would bloat repo).
- Manual trigger: `pnpm docs:cohort-report`.

**Exit criteria**: telemetry file accumulates; cohort report runs without error and produces actionable list.

### Play 6 — Constrain consolidation + invariants rename (2 days)

**Objective**: Collapse 4–5-place constraint duplication into rules + lint + structural-absence guards; rename for clarity per Agent 1.

**Approach**:

**6a — Rename + synthesize** (~2 hours):

- `git mv .claude/rules/ .claude/invariants/` — clarifies purpose (these are policy-level invariants, not procedure routers). Confirmed all 6 current rules (stats, testing, charts, coscout-prompts, i18n, azure-storage) are constraint-purpose.
- Create `.claude/INVARIANTS.md` — synthesizing index that lists all invariants with one-line summary + link to detail file. Single entry point.
- Update `.claude/settings.json` (or wherever the path-scope config lives) for the rename.
- Skill `agent-context-quickstart` (Play 3) loads `.claude/INVARIANTS.md` on session start.

**6b — Invariant consolidation** (~6 hours):

- Inventory all invariants across: `.claude/invariants/` (6 files), constitution doc (P0–P10), P5/P7 amended principles, ADR-073 (never-root-cause + interaction terminology + distribution-vs-aggregates), root CLAUDE.md "Invariants" section, ESLint configs (eslint.config.mjs), structural-absence guards (`architecture.noCrossInvestigationAggregation.test.ts`, `scripts/check-level-boundaries.sh`).
- Each invariant → one canonical home + one enforcement mechanism (lint rule, denylist substring test, structural-absence guard, or — if not mechanizable — clear constraint doc with citation discipline).
- Prose mentions in other places replaced with `[[invariant-name]]` link to canonical home.
- Where invariant lacks enforcement mechanism: log as gap in `docs/ephemeral/investigations/` with proposed mechanism.

**Exit criteria**:

- `.claude/invariants/` exists (rules folder gone); `.claude/INVARIANTS.md` synthesizes
- Each invariant cited in exactly one canonical place (manual audit pass)
- Enforcement mechanism exists or is logged as gap in investigations
- `agent-context-quickstart` skill auto-loads invariants summary

### Play 7 — System auto-generation (3 days)

**Objective**: Generate System-purpose docs from code where possible.

**Deliverables**:

- `scripts/docs/gen-arch.mjs`:
  - Reads `package.json` + workspace deps → emits dependency graph (mermaid)
  - Reads `tsconfig.json#paths` + `package.json#exports` → emits sub-path export map
  - Reads `apps/*/src/index.css` `@source` directives → emits Tailwind v4 source map
  - Output: `docs/living/system/architecture-generated.md` (clearly marked auto-generated; don't edit)
- Hand-narrated System docs (DATA-FLOW.md, key technical narratives) keep + link to generated views.
- Pre-push hook regenerates on each push (cheap; ~1s).

**Exit criteria**: `pnpm docs:gen-arch` produces current dependency/export/source maps; pre-push hook wires it.

### Play 8 — CoScout AX-design consolidation (2 days)

**Objective**: Address the CoScout-specific gap surfaced by user's UX/AX/CoScout question — gather scattered AI-design artifacts into a single canonical AX-design doc.

**Deliverables**:

- New canonical: `docs/living/design/coscout-ax-design.md` with `topic: [ax, coscout]`, covering:
  - Persona / voice
  - Tier-gated behaviors (per ADR-068)
  - Knowledge architecture (per ADR-060)
  - Safety boundaries (per ADR-069 three-boundary)
  - Prompt engineering rules (currently `.claude/rules/coscout-prompts.md`)
  - Eval discipline
- Existing ADRs (060, 068, 069) + the prompt rule add `related: [coscout-ax-design]` + brief "see canonical AX design at …" note.
- Cross-reference from `docs/llms.txt` (routing skill).

**Exit criteria**: single canonical CoScout AX-design doc exists; all constituent decisions cite back to it; future CoScout changes amend this doc + addendum-thread the constituent decisions.

---

## 4. Migration Sequence (~5.5-week timeline, with Phase A warm-up)

| Week  | Phase / Plays                                       | Effort         | Output                                                                                                                                                  |
| ----- | --------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0** | **Phase A quick wins** (Agent 2's 8 moves, partial) | ~3 hours       | Wedge content consolidated (decision-log + OVERVIEW + methodology + cross-links); zero-infra warm-up                                                    |
| 1     | Play 1                                              | 3 days         | Folder restructure + schema collapse; fossil archive (09-baseline, project-status-audit); `.claude/rules` → `.claude/invariants/` rename                |
| 1–3   | Play 2 (2a–2e)                                      | 2 weeks        | Cards & Threads kernel; atomic decomposition of decision-log + MEMORY + investigations; toolbox; Steward loop                                           |
| 3     | Play 3 + Play 6                                     | 3 + 2 days     | Skills inventory (Tier 1 agent-context essentials FIRST, then Tier 2 procedures); INVARIANTS.md synthesis                                               |
| 4     | Play 4                                              | 1 week         | Execute remaining of Agent 2's 8 moves (Phase A handled the top 4); tier-philosophy archive; USER-JOURNEYS variant lineage; mis-housed folder refactors |
| 5     | Play 5 + Play 7 + Play 8                            | 2 + 3 + 2 days | Telemetry + System auto-gen + CoScout AX consolidation                                                                                                  |

**Total**: ~5.5 weeks elapsed. Phase A warm-up is optional but high-ROI: ~3 hours removes the most visible noise (wedge content scar tissue) before larger structural moves. Bulk is automation + scripts + `git mv`, not authoring. Each play independently shippable so can pause/reorder.

**Sequencing rationale**:

- **Phase A first** (optional warm-up): zero-infra consolidation of the wedge content removes the most visible noise immediately; validates the addendum-thread pattern at human scale before mechanizing.
- **P1 next**: substrate for everything else; absorbs fossil-archive moves Agent 1 surfaced.
- **P2 then**: kernel that other plays depend on (skills cite toolbox; consolidation cites cards).
- **P3 + P6 together**: AX-dev investment + invariant cleanup, both rely on P1 schema. P3's Tier 1 (agent-context essentials) is highest priority — closes the 4% gap immediately.
- **P4 last among consolidations**: needs P2 cards to consolidate INTO; needs P3 skills to dispatch consolidation work to subagents; Phase A already cleared the top 4 of Agent 2's moves.
- **P5 + P7 + P8 last**: optimizations + niche cleanups that benefit from everything above.

---

## 5. Critical Files

### To create

- `docs/superpowers/specs/2026-05-16-docs-strategy-memo.md` (extract from §8 below)
- `docs/superpowers/specs/2026-05-16-docs-strategy-design.md` (extract from §§2–4 above)
- `docs/07-decisions/adr-083-eight-purpose-doc-taxonomy.md` (the schema change as ADR)
- `scripts/docs-toolbox/{find,get,related,recent,verify,amend}.mjs` (Play 2c)
- `scripts/docs-steward.mjs` (Play 2e)
- `scripts/docs/gen-arch.mjs` (Play 7)
- `.claude/skills/docs-toolbox/SKILL.md` (Play 2d)
- `.claude/skills/{ship-ui-primitive,add-chart,migrate-store,…}/SKILL.md` (Play 3 — 15 skills)
- `.claude/commands/docs-steward.md` (Play 2e)
- `docs/cards/decisions/`, `docs/cards/memory/`, `docs/cards/investigations/` (Play 2a)
- `docs/ephemeral/transcripts/` (Pillar 5)
- `docs/stable/`, `docs/living/<purpose>/`, `docs/ephemeral/` (Play 1)
- `docs/living/design/coscout-ax-design.md` (Play 8)

### To modify

- `scripts/docs-frontmatter-schema.mjs` — collapse schema (Play 1)
- `scripts/check-doc-frontmatter.mjs` — enforce new fields + amendment section (Plays 1, 2b)
- `scripts/docs-frontmatter-fix.mjs` — backfill `purpose` + `tier` (Play 1)
- `scripts/audit-doc-references.mjs` — extend with `last-verified` drift checks (Play 5)
- `scripts/check-doc-health.sh` — wire new checks (Play 1, Play 2)
- `docs/llms.txt` — convert from catalog to router (Play 2d)
- Root `CLAUDE.md` — reference new docs strategy + new "Where to look" tree (Play 1)
- Root `package.json` — `docs:*` script wiring (Play 2c, Play 5, Play 7)
- `.husky/pre-push` — wire `pnpm docs:gen-arch` regeneration (Play 7)
- ADR-060, ADR-068, ADR-069, `.claude/rules/coscout-prompts.md` — add `related: [coscout-ax-design]` (Play 8)
- All 521 docs — frontmatter migration (Play 1, automated via `docs-frontmatter-fix.mjs`)

### To `git mv`

- 521 docs into new velocity-tier folders (Play 1)
- Closed investigations from `docs/investigations.md` → `docs/cards/investigations/` (Play 2a)
- Closed-but-not-archived plans from `~/.claude/plans/` → `docs/cards/decisions/` or `docs/ephemeral/transcripts/` (Play 2a, Play 5)

### To archive (move to `docs/archive/`)

**Confirmed by Agent 1 audit**:

- `docs/09-baseline/` (both files) → `docs/archive/baselines/` — pre-wedge audit snapshots (Play 1 or Play 4g)
- `docs/10-development/project-status-audit-2026-04-16.md` → `docs/archive/audits/` — frozen point-in-time (Play 1 or Play 4g)
- `docs/08-products/tier-philosophy.md` → `docs/archive/` — superseded by ADR-082 wedge pricing (Play 4c)
- `.claude/agents/flow-nexus/` (10 docs, no inbound refs) → `.claude/agents/experimental/` or archive (Play 4g, verify first)
- Pre-2026-05-07 specs in `docs/superpowers/specs/` — frontmatter date scan + roadmap verification before archive (Play 4g)
- `docs/01-vision/trainer-network.md` — IF named-future (verify in decision-log first; Play 4g)

**Add `archived-on: YYYY-MM-DD` + `archived-reason: <text>` frontmatter to each archived doc.**

### To delete

- `docs/03-features/learning/glossary.md` — duplicate of root `glossary.md` (Play 4g; merge unique content first)
- "⚠️ PARTIALLY SUPERSEDED" prefixes throughout MEMORY.md → replaced by amendment threads (Play 2b, automated via one-shot script)
- Redundant CATEGORY/STATUS/AUDIENCE enums in schema (Play 1)
- `docs/llms.txt` static catalog content → router skeleton (Play 2d)
- decision-log §Replayed Decisions "Wedge pivot" entry body (~2000 words) → replaced by 5-sentence summary + ADR-082 cite (Play 4a / Phase A)

### KEEP (audit-confirmed, despite earlier suspicion)

- All 6 USER-JOURNEYS variants (base + CAPABILITY + YAMAZUMI + PERFORMANCE + DEFECT + PROCESS-FLOW). Legitimate mode-specific splits, all updated 2026-05-16 with wedge amendments, each with unique chart suite + CoScout coaching + Specialist workflow. Add `inherits-from: USER-JOURNEYS.md` to the 5 mode variants (Play 4b).
- All 74 ADRs (decide-purpose; no audit-flagged redundancy beyond decision-log replication, which is fixed in 4a not by archiving ADRs).
- `docs/investigations.md` — keeps identity with OPEN (decide) vs [RESOLVED] (remember) split (Section 7.3 resolution).

---

## 6. Verification

End-to-end tests per play:

**Play 1**:

- `pnpm docs:health` green with new schema
- All inter-doc links resolve (no broken refs)
- `bash scripts/pr-ready-check.sh` green
- `git log --follow` works on moved files

**Play 2**:

- `pnpm docs:find "wedge"` returns ranked cards
- `pnpm docs:get adr-082` returns full ADR
- `pnpm docs:related adr-082` returns graph neighbors
- `pnpm docs:amend adr-082 --reason "test"` appends to amendments + bumps `last-verified`
- `/docs-steward` runs end-to-end and produces a markdown report
- `MEMORY.md` index <24.4KB
- `decision-log.md` is a generated view, not authored

**Play 3**:

- 15+ skills in `.claude/skills/` each with valid frontmatter passing schema check
- Dispatch a representative subagent task; verify correct skill auto-loads
- `.claude/rules/` reduced to constraints only (no procedures)

**Play 4**:

- Orient cluster collapsed to ≤6 docs
- `pnpm docs:find "positioning"` returns one canonical
- USER-JOURNEYS variants resolved per agent 2 verdict
- Re-run agent 2's overlap check; no high-overlap pairs remain

**Play 5**:

- Telemetry file accumulates after a sample query session
- `pnpm docs:cohort-report` outputs untouched-in-90-days list
- `docs/.telemetry/` in `.gitignore`

**Play 6**:

- Each invariant cited in exactly one canonical place (manual audit)
- Lint check enforces (where mechanizable)
- Remaining gaps logged in `docs/investigations.md`

**Play 7**:

- `pnpm docs:gen-arch` generates current dependency graph
- Output matches a hand-curated reference for a sample subset
- Pre-push hook wires regeneration

**Play 8**:

- Single canonical `coscout-ax-design.md` exists with `topic: [ax, coscout]`
- ADR-060, ADR-068, ADR-069 + prompt rule cite back to it
- `pnpm docs:related coscout-ax-design` returns all constituents

**Overall**:

- 30 days post-Play-5: cohort report shows non-zero queries logged; ≥1 Steward run has been done; `last-verified` rate on `living` tier is >50%.

---

## 7. Audit Findings

Both Explore agents dispatched at brainstorm time; findings synthesized below.

### 7.1 Agent 1 — Purpose-mapping (487 active docs across 521 files; 34 are supporting README/index hubs)

**Distribution (purpose × tier)**:

| Purpose       | Stable  | Living  | Ephemeral | Total   | % of living |
| ------------- | ------- | ------- | --------- | ------- | ----------- |
| orient        | 12      | 0       | 0         | 12      | —           |
| decide        | 0       | 90      | 0         | 90      | **25%**     |
| design        | 0       | 180     | 5         | 185     | **51%**     |
| build         | 0       | 50      | 2         | 52      | 14%         |
| system        | 0       | 20      | 5         | 25      | 6%          |
| constrain     | 8       | 0       | 0         | 8       | —           |
| agent-context | 0       | 15      | 0         | 15      | **4%** ⚠️   |
| remember      | 100     | 0       | 0         | 100     | —           |
| **Total**     | **120** | **355** | **12**    | **487** |             |

**Headline**: Design + Decide dominate (76% of living). **Agent-context is dramatically under-engineered at 4% of living** — confirms my prior. Missing specifically: execution quickstart (5-min onboard), package-context router (which CLAUDE.md to read first), store-state glossary.

**Emergent topic tags** (17 dominant; matches my proposed Topic vocabulary closely):

| Topic            | Count | Dominant purpose | Cluster            |
| ---------------- | ----- | ---------------- | ------------------ |
| `adr`            | 74    | decide           | (decisions)        |
| `stats`          | 20    | design + build   | technical-analysis |
| `charts`         | 18    | design + build   | technical-analysis |
| `ux`             | 18    | design           | UX-design          |
| `projects`       | 15    | design           | core-product       |
| `investigation`  | 15    | design           | core-product       |
| `canvas`         | 12    | design           | core-product       |
| `ax`             | 12    | design           | AX-design          |
| `coscout`        | 10    | design           | AI                 |
| `methodology`    | 8     | orient           | foundation         |
| `azure`          | 8     | build + system   | deployment         |
| `capability`     | 8     | design           | stats-mode         |
| `response-paths` | 6     | design           | core-product       |
| `stores`         | 6     | build + system   | architecture       |
| `marketplace`    | 4     | build            | deployment         |
| `i18n`           | 4     | build            | infra              |
| `tier-gating`    | 3     | orient           | business           |

Three dominant clusters: **stats+charts** (38 docs, technical-analysis), **canvas+investigation+projects** (40 docs, UX work), **coscout+response-paths** (16 docs, AI integration) — 45% of living docs concentrated in these three.

**Mis-housed / multi-purpose docs**:

- `decision-log.md` — mixed decide + remember + orient (H-series hypotheses). **Split**: §Replayed Decisions → cards/decisions or archive/ (remember); §Open Questions stays (decide); H0–H6 hypothesis statements → `docs/stable/orient/hypotheses.md`.
- `docs/08-products/` — mixed orient (tier-philosophy, iso-alignment) + design (feature-parity) + system (azure/pwa/presentations) + build (marketplace checklist). **Refactor**: tier-philosophy + iso → `docs/stable/orient/`; azure/pwa/feature-parity → `docs/living/system/product-deployments/`; presentations folder → retire or external.
- `06-design-system/` — mix of design (patterns, charts, foundations) + build (CSS chains, interaction procedures). **Split**: `06-design-system/spec/` + `06-design-system/implementation/`.
- `.claude/rules/` vs `.claude/skills/` — boundary blurry. **Rename**: `.claude/rules/` → `.claude/invariants/`; add synthesizing `.claude/INVARIANTS.md` root doc. Confirmed all 6 current rules are policy-level (constrain-purpose).
- `docs/investigations.md` vs `decision-log.md §Open Questions` — competing structures for same purpose. **Merge**: investigations.md content folds into decision-log §Open Questions, OR rename investigations.md → `code-smells.md` (remember, not decide).
- `docs/10-development/feature-backlog.md` — hand-curated work list, antipattern. **Migrate**: GitHub Projects or memory cards.

**Confirmed fossils / archive candidates**:

- `docs/09-baseline/` (both files, last touch 2026-04-17) — pre-wedge audit snapshots, invalidated. → `docs/archive/baselines/`. Create new v1 wedge baseline.
- `docs/09-tutorials/index.md` — placeholder header only. → keep with deprecation notice; full content in Phase C.3.
- `docs/10-development/project-status-audit-2026-04-16.md` — frozen point-in-time. → `docs/archive/audits/`.
- `docs/03-features/learning/glossary.md` — duplicate of root `glossary.md`. → delete; merge any unique content into root.
- `docs/01-vision/trainer-network.md` — unclear v1 status, no inbound links from decision-log. → verify v1 vs named-future; link from decision-log §Named-Future or archive.
- `.claude/agents/flow-nexus/` (10 docs) — no references in current CLAUDE.md/AGENTS.md. → migrate to `.claude/agents/experimental/` or archive.
- Pre-2026-05-07 specs in `docs/superpowers/specs/` — predate wedge pivot finalization; need frontmatter date scan + roadmap verification.

### 7.2 Agent 2 — Multi-canonical overlap

**Vision/Orient overlap matrix** (verdict per topic):

| Topic                                                   | Docs covering it                                                                                        | Overlap                                                                                              | Canonical                                                 | Action                                                                                 |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Wedge pivot (2026-05-16)**                            | CLAUDE.md, positioning, business-bible, OVERVIEW, decision-log, methodology, ADR-082                    | **VERY HIGH** — decision-log replicates 90% of ADR-082's rationale verbatim (~2000 words duplicated) | **ADR-082 + wedge spec**                                  | All other docs cite + 3-sentence summary; decision-log entry collapses                 |
| **Product anatomy** (6 tabs, 4 stages, pricing)         | OVERVIEW, positioning, CLAUDE.md, ADR-082 (table), decision-log                                         | **HIGH** — exact verbatim tables in 3+ places                                                        | **ADR-082 table**                                         | Others lock to ADR-082's table reference                                               |
| **Positioning statement** ("structured investigation…") | positioning §2, business-bible, OVERVIEW (verbatim line 11–12), CLAUDE.md (line 3), constitution        | **MEDIUM**                                                                                           | **positioning.md §2**                                     | OVERVIEW abstracts to one sentence + link                                              |
| **Methodology** (EDA, three levels, spine)              | methodology.md, positioning §3, OVERVIEW §The journey model, USER-JOURNEYS, CLAUDE.md, vision spec §2.1 | **MEDIUM** — fragmented but recoverable                                                              | **vision spec §2.1 (spine) + methodology.md (narrative)** | Clarify partnership in methodology.md frontmatter; OVERVIEW compresses 300→2 sentences |
| **Strategic hypotheses (H1–H6)**                        | business-bible, positioning (implicit), MEMORY.md                                                       | **LOW**                                                                                              | **business-bible.md**                                     | Add inbound cross-links from positioning + CLAUDE.md                                   |
| **Pricing philosophy** (€99 single SKU)                 | business-bible H6, tier-philosophy (superseded), ADR-082 §Pricing, decision-log                         | **HIGH**                                                                                             | **ADR-082 §Pricing rationale**                            | Archive tier-philosophy.md with redirect banner                                        |
| **Audience / personas**                                 | positioning, business-bible (Grace), USER-JOURNEYS §The one persona, OVERVIEW, MEMORY                   | **LOW** (post-wedge consolidation worked)                                                            | **USER-JOURNEYS.md §The one persona**                     | No action                                                                              |

**USER-JOURNEYS variants verdict: KEEP ALL SIX** (overturns my earlier suspicion of stale drift).

All six variants were updated 2026-05-16 with identical wedge amendment blocks. Each has a unique chart suite + CoScout coaching + Specialist workflow:

1. `USER-JOURNEYS.md` (base, continuous measurement)
2. `USER-JOURNEYS-CAPABILITY.md` (Cp/Cpk mode)
3. `USER-JOURNEYS-YAMAZUMI.md` (Lean cycle-time mode)
4. `USER-JOURNEYS-PERFORMANCE.md` (multi-channel mode)
5. `USER-JOURNEYS-DEFECT.md` (events-to-rates mode)
6. `USER-JOURNEYS-PROCESS-FLOW.md` (bottleneck analysis mode)

The split is **mode-specific methodology**, not persona — outlives the wedge pivot. Base USER-JOURNEYS.md lines 92–101 explicitly lists all six and recommends reading the mode-specific doc. Each cites code ground truth (`packages/core/src/yamazumi/`, ADR-034, etc.).

**Action**: Keep all six. Add `inherits-from: USER-JOURNEYS.md` to the five mode-specific variants for clarity. No merging.

**Decision-log vs ADRs vs MEMORY overlap**:

| Case                                                                                     | Verdict         | Action                                                                                   |
| ---------------------------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------- |
| decision-log "Wedge pivot" entry (~2000 words) vs ADR-082                                | HIGH redundancy | Collapse to 5-sentence summary + cite ADR-082                                            |
| decision-log "Projects tab" (5 amendments A–E) vs Spec 2026-05-14 + PRs #177–#181        | MEDIUM          | Move amendments → `investigations.md` as `[RESOLVED]` ship-log entries; spec owns design |
| decision-log "8f canvas" (3 amendments) vs ADR-081 + Spec 2026-05-13 + investigations.md | MEDIUM          | Same as above; investigations.md has implementation detail, ADR-081 locks architecture   |
| decision-log "RPS V1" (10 PR summary) vs Spec 2026-05-09 + ADR-080                       | APPROPRIATE     | No change; log is ship record, ADR is decision                                           |
| decision-log "Canvas hypothesis-arrow" (Q1–Q7 verbatim) vs Spec 2026-05-07               | BORDERLINE HIGH | Collapse to summary + cite spec                                                          |
| MEMORY.md entries vs ADRs/specs                                                          | APPROPRIATE     | MEMORY index is correctly scoped; only the index-line length is the issue (Play 2a)      |

**Methodology fragmentation**: methodology.md frontmatter says "canonical product vision lives at vision spec §2.1" but then re-derives the entire spine (lines 17–100). Confusing. **Fix** (30 min): rewrite methodology.md lines 10–12 to clarify "paired companions — vision spec §2.1 is the concise spine; this doc is the longer pedagogical narrative; when they diverge, vision spec wins for product decisions, methodology.md wins for teaching context."

**Eight prioritized consolidation moves** (Agent 2's effort estimates):

| #   | Move                                                                                                       | Effort | Risk   |
| --- | ---------------------------------------------------------------------------------------------------------- | ------ | ------ |
| 1   | Collapse decision-log Wedge entry to 5-sentence + cite ADR-082                                             | 1h     | Low    |
| 2   | Compress OVERVIEW.md §The journey model 300→2 sentences + cross-link USER-JOURNEYS                         | 30m    | Low    |
| 3   | Clarify methodology.md frontmatter on dual-source partnership                                              | 30m    | Low    |
| 4   | Archive tier-philosophy.md + redirect banner                                                               | 1h     | Low    |
| 5   | (negative finding) DO NOT move positioning §2.2 ("What VariScout Is Not") — keep there, link from OVERVIEW | —      | —      |
| 6   | Add cross-links positioning.md/CLAUDE.md → business-bible H1–H6                                            | 30m    | Low    |
| 7   | Move decision-log "Projects tab" + "8f canvas" amendments → investigations.md `[RESOLVED]`                 | 2h     | Medium |
| 8   | Add "Canonical artifacts" section to llms.txt                                                              | 30m    | Low    |

Total Phase A (immediate quick wins): ~3 hours of edits, ~1500 lines of redundant prose removed.

### 7.3 Implications for the plays

The audit findings refine specific plays:

- **Play 1 (Restructure)**: Add to mv list: `09-baseline/` → `archive/baselines/`; `10-development/project-status-audit-2026-04-16.md` → `archive/audits/`; `03-features/learning/glossary.md` → delete after merging unique content; `08-products/` → split per agent 1's recommendation. Also rename `.claude/rules/` → `.claude/invariants/`. Topic-tag vocabulary now confirmed (17 tags).

- **Play 3 (Skills inventory)**: Add 3 explicit agent-context targets to the inventory:
  - `agent-context-quickstart` skill — the 5-minute "I'm an agent, what do I need to know" surface (new `docs/living/agent-context/onboarding-quick-start.md` + skill that loads it)
  - `package-router` skill — "which package CLAUDE.md / nested context to load for this work" (new `docs/living/agent-context/package-router.md` + skill)
  - `store-state-glossary` skill — what's in projectStore vs investigationStore vs viewStore vs preferencesStore (new doc + skill, sources from `packages/stores/CLAUDE.md`)

  These three explicitly address the 4%-of-living agent-context gap.

- **Play 4 (One canonical)**: Now precisely scoped from agent 2's matrix. The Orient cluster collapses by executing the 8 prioritized moves. **USER-JOURNEYS variants stay (all 6)** with `inherits-from:` convention. tier-philosophy.md archives. The wedge content has ONE canonical home (ADR-082) with everything else citing.

- **Play 6 (Constrain consolidation)**: Add `.claude/rules/` → `.claude/invariants/` rename + create `.claude/INVARIANTS.md` synthesis doc.

- **Play 8 (CoScout AX-design consolidation)**: Confirmed in scope by topic-tag count (10 coscout docs). No major refinements.

- **New micro-play (Phase A immediate quick wins, ~3 hours)**: Execute the 8 prioritized consolidation moves from agent 2 BEFORE Play 1's restructure. Cheap, low-risk, immediately reduces noise. Probably worth doing in week 0 as warm-up. Added to migration sequence below.

- **Investigations.md disposition**: Agent 1 + 2 disagree subtly. Agent 1: merge into decision-log §Open Questions. Agent 2: investigations.md stays as ship-log home (so decision-log "Projects tab"/"8f canvas" amendments move INTO investigations.md as `[RESOLVED]`). **Resolution**: investigations.md keeps its identity but gains a clearer purpose split: `OPEN` (decide-purpose) and `[RESOLVED]` (remember-purpose, ship-log). Decompose closed investigations to `docs/cards/investigations/` per Play 2a; open ones stay in `docs/ephemeral/investigations/`. Decision-log §Open Questions becomes the cross-spec re-litigation gate only (not catch-all).

---

## 8. Memo — VariScout Docs Strategy 2026

_(To extract on approval to `docs/superpowers/specs/2026-05-16-docs-strategy-memo.md`)_

### What we're changing

VariScout's docs scale-friction problem is **over-discipline at the metadata layer, under-discipline at the lifecycle layer**. We're flipping that: collapse the metadata schema, decompose the actual bloat sources, expose retrieval as a skill, replace batch audits with a steward loop, expand the AX-dev surface (skills) to 2026 conventions.

### Diagnosis (from the brainstorm audit)

- 487 active docs across 521 files (94% utilization)
- Distribution: **Design 51%**, Decide 25%, Build 14%, System 6%, **Agent-context 4% — the critical gap**
- 17 emergent topic tags (close to my proposed vocabulary; codified in the new schema)
- 6 USER-JOURNEYS variants confirmed as **legitimate mode-specific splits** (not stale drift) — keep all
- Wedge content (2026-05-16) is the highest-impact consolidation target: decision-log replicates 90% of ADR-082 verbatim (~2000 redundant words)
- Methodology coverage is fragmented but recoverable: vision spec §2.1 (spine) + methodology.md (narrative) should be paired companions, not competing canonicals
- `.claude/rules/` should rename to `.claude/invariants/` — confirmed all 6 current files are constraint-purpose
- Specific fossils confirmed: `09-baseline/`, `10-development/project-status-audit-2026-04-16.md`, `03-features/learning/glossary.md`, `08-products/tier-philosophy.md`

### The foundation

Every doc serves exactly one of **8 purposes** (orient, decide, design, build, system, constrain, agent-context, remember) at one of **4 tiers** (stable, living, ephemeral, card). Topic tags (`ux`, `ax`, `coscout`, `canvas`, …) discriminate within purposes.

Industry frameworks (Diátaxis, Google's engineering-practices model) are human-reader-centric and pre-LLM-era. VariScout's 8-purpose taxonomy explicitly covers both human readers AND the AX-dev surface (subagents + CoScout) that's now half its doc system.

### The 8 plays + Phase A warm-up (~5.5 weeks elapsed)

- **Phase A** (~3h) — Quick wins: 4 of Agent 2's 8 consolidation moves (wedge content collapse, OVERVIEW compression, methodology clarification, business-bible cross-links). Zero-infra warm-up before structural moves.

1. **Velocity-tier restructure** (3d) — `git mv` to tier folders + schema collapse (22→4 STATUS, 18→tags, 14→3 AUDIENCE); fossil archive batch
2. **Cards & Threads** (2w) — atomic decomposition of decision-log/MEMORY/investigations; addendum threads on living docs; `pnpm docs:*` toolbox; `docs-toolbox` skill; `/docs-steward` loop
3. **Skills inventory build-out** (3d + ongoing) — expand from 2 to **18+** task-typed skills, **with Tier 1 agent-context essentials first** (`agent-context-quickstart`, `package-router`, `store-state-glossary`) to close the 4% gap immediately
4. **One canonical per concept** (1w) — execute remaining 4 of Agent 2's 8 moves; tier-philosophy archive; USER-JOURNEYS variant `inherits-from:` lineage; mis-housed folder refactors (08-products split, 06-design-system split)
5. **Telemetry + 90-day archive cohort** (2d) — toolbox skill logs queries; auto-prune unread cohort
6. **Constrain consolidation + invariants rename** (2d) — `.claude/rules/` → `.claude/invariants/` + `.claude/INVARIANTS.md` synthesis; collapse 4–5-place duplication
7. **System auto-generation** (3d) — `pnpm docs:gen-arch` from package.json + tsconfig
8. **CoScout AX-design consolidation** (2d) — gather ADR-060/068/069 + prompt rule into single canonical `coscout-ax-design.md` with `topic: [ax, coscout]`

### The 2026 differentiator

**The Steward Loop** (`/docs-steward`) — periodic Claude session that diffs `verified-against-commit` against current HEAD, proposes amendments for stale cards, outputs a review-ready report. The pending **Phase C audit (~500 docs)** becomes a continuous background process, not a 500-doc cliff.

### What we kill

- 22 STATUS enums → 4
- 18 CATEGORY enums → free-form topic tags
- 14 AUDIENCE enums → 3
- 11 numbered folders → 3 velocity tiers + cards/
- `.claude/rules/` (rename to `.claude/invariants/` for purpose clarity)
- ~2000 words of decision-log Wedge entry duplication (collapses to cite ADR-082)
- ~300 words of OVERVIEW.md methodology recap (compresses to 2 sentences + cross-link)
- "⚠️ PARTIALLY SUPERSEDED" prefixes → dated amendment threads
- `llms.txt` as static catalog → routing skill
- Phase C audit as future project → Steward as weekly habit
- Specific fossils: `09-baseline/`, `tier-philosophy.md`, `10-development/project-status-audit-2026-04-16.md`, `03-features/learning/glossary.md`

### What we preserve (audit-confirmed)

- ADR discipline (74 of them is healthy; convention works)
- All 6 USER-JOURNEYS variants (legitimate mode-specific splits)
- Memory atomic-notes pattern (promoted up to docs)
- Validation tooling (extended, not replaced)
- Frontmatter SSOT in `scripts/` (pattern is right; schema simplifies)
- Subagent-driven-development workflow (materially improved by Cards & Threads + Skills inventory)
- Nested CLAUDE.md per package (progressive disclosure is correct)
- decision-log as the re-litigation gate (decompose storage, keep function)
- methodology.md + vision spec §2.1 dual-source partnership (clarified, not collapsed)

### CTO verdict

Current strategy is sound but is **scaling its own friction**: the more docs, the more enums to maintain, the more aggregates to keep current, the more "partially superseded" scar tissue. The fix is to invert that — make adding-a-doc _cheaper_ (smaller schema, atomic cards) and make doc-rot _self-detecting_ (Steward + telemetry). The agent-context cohort is the highest-leverage cohort to expand (4% of living docs, read every dispatch). Investment ~5.5 weeks (Phase A + 8 plays); recurring authoring tax drops materially; Phase C cliff is dissolved into a continuous loop; ~3 hours of Phase A warm-up removes the most visible noise immediately.

---

## 9. Open Questions

**Resolved by audit**:

- ~~USER-JOURNEYS variants stale vs legitimate?~~ → **LEGITIMATE** (mode-specific splits, all 6 kept; Play 4b)
- ~~Methodology canonical source?~~ → **DUAL** (vision spec §2.1 = spine, methodology.md = pedagogical narrative; Play 4a clarifies)
- ~~Wedge content canonical home?~~ → **ADR-082** (everything else cites; Phase A + Play 4a)
- ~~`.claude/rules/` purpose ambiguity?~~ → **RENAME** to `.claude/invariants/` + add INVARIANTS.md synthesis (Play 6a)

**Still open**:

1. **Card ID scheme**: `adr-082` is durable; proposal for cards: `dec-<YYYYMMDD>-<slug>`, `mem-<slug>`, `inv-<YYYYMMDD>-<slug>`. Confirm at Play 2a.
2. **`.claude/invariants/` glob-scoping** (broken upstream per `[[feedback_skills_for_capabilities_not_conventions]]`): rules currently load globally; rename doesn't fix the upstream bug. Watch upstream fix; if still broken at end of Play 2, propose alternative (e.g., skill-loaded-by-glob pattern via `agent-context-quickstart`).
3. **Plan-file promotion criteria**: which plan files in `~/.claude/plans/` warrant promotion to `docs/ephemeral/transcripts/`? Proposal: manual decision per plan, signaled by `promote-to-transcripts: true` frontmatter.
4. **Telemetry storage rotation**: `docs/.telemetry/queries.jsonl` gets large over time. Proposal: daily rotation, 90-day retention; `docs/.gitignore` to keep out of repo.
5. **Steward cadence**: weekly or daily? Proposal: weekly for v1; tune based on Play 5 telemetry of drift rate.
6. **MEMORY.md mirror vs symlink**: should `docs/cards/memory/` mirror or symlink `~/.claude/projects/.../memory/`? Mirror = git-tracked, drift-prone. Symlink = single source, harder to publish. Proposal: mirror via `pnpm docs:rebuild`, treat `~/.claude/memory` as authoring source, `docs/cards/memory/` as generated view.
7. **Existing `pnpm docs:health` baseline**: does it pass cleanly today, or are there pre-existing failures to address as part of Play 1? Verify before starting.
8. **ADR-083 vs amendment**: should the schema change be a new ADR or amendments to existing schema-touching ADRs? Proposal: new ADR (ADR-083) given the breadth; existing schema-touching ADRs add `related: [adr-083]`.
9. **Investigations.md disposition** (audit surfaced subtle disagreement): Agent 1 said merge into decision-log §Open Questions; Agent 2 said keep as ship-log home. **Proposed resolution** (Section 7.3): investigations.md keeps its identity with explicit OPEN (decide) vs [RESOLVED] (remember, ship-log) split; closed → cards via Play 2a. Confirm.
10. **Pre-2026-05-07 specs in `docs/superpowers/specs/`**: Agent 1 flagged these as possibly pre-wedge. Need date scan + roadmap verification before Play 4g archive batch. Don't archive if still on current roadmap.
11. **`08-products/` refactor scope**: Agent 1 recommended splitting orient/design/system/build. Play 4f executes; verify the marketplace-checklist + presentations subfolders are truly retirable before deleting (could be operational artifacts).

---

## 10. Risks & Mitigations

| Risk                                                                | Mitigation                                                                                                                |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Mass `git mv` breaks link resolution across 521 docs                | `scripts/check-dead-links.sh` runs as gate; staged batches per purpose; fix broken links per batch                        |
| Frontmatter migration loses metadata                                | `docs-frontmatter-fix.mjs` runs dry-first; diff inspected; backup branch before merge                                     |
| Atomic decomposition of `decision-log.md` loses context             | Generated view preserves narrative; manual review of 5 sample decisions post-decomposition                                |
| Steward loop produces noisy false-positives                         | Conservative first cut (only flag cards where cited symbols are gone); tune threshold post-Play-5                         |
| 15 skills is too many to maintain                                   | Start with 8 highest-frequency tasks; add others as dispatch logs justify; `pnpm docs:cohort-report` tracks unused skills |
| AX-design doc for CoScout duplicates ADR content                    | Strict citation discipline: AX-design doc states current state + tradeoffs; ADRs remain decision provenance               |
| Schema collapse breaks downstream tooling assuming 22 STATUS values | `docs-frontmatter-fix.mjs` maps old → new; transitional alias period (old values warn but pass) for 1 cycle               |

---

## 11. Post-PR-184 Recalibration (2026-05-17 — late session)

> This section captures the recalibration after main shipped massive Phase C + wedge V1 work TODAY, faster than the original plan assumed. The strategy itself stays valid; the SEQUENCING + DEFERRAL reasoning needed updating.
>
> This is itself an instance of the discipline §2.7 describes: edit the canonical (this plan) in place to reflect current reality; don't create an `*-amendment-design.md` side file.

### 11.1 Reality check — what shipped on main today

| Cluster                           | PRs                                | What                                                                                                                                                                                                                                                  |
| --------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wedge V1 engineering SHIPPED      | #183, #185–#190, #197              | All WV1-1 through WV1-7 + post-launch cleanup. The "deferred to post-wedge-V1" blocker is GONE.                                                                                                                                                       |
| Phase C audit + execution SHIPPED | #191, #192, #193, #194, #195, #196 | The wedge spec's "~500-doc holistic cleanup" already shipped via traditional ARCHIVE/AMEND/DELETE pattern: 19 archived + 90 amended + 2 superseded + VariScout Process named-future captured as `docs/01-vision/variscout-process/` with 7 sub-files. |
| Math.random ESLint guard          | #198                               | Pre-existing invariant now mechanically enforced. INVARIANTS.md needs update (was "log gap").                                                                                                                                                         |
| Workflow refinements              | `bb296898`, `df3e9d81`             | Right-sized model-per-task (dropped "Sonnet for ≥70%" default); atomic-deletion dispatch shape researched.                                                                                                                                            |

**Total churn**: 862 files changed, +14k/-22k lines on main since PR #184 branched.

### 11.2 Factual changes my PR #184 docs are now stale against

| What's stale in PR #184    | Was                                                                                                     | Now (per main)                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Nav                        | "6-tab `Home · Projects · Process · Analyze · Investigation · Report`; Improve = stage inside Projects" | **7-tab — Improve restored as top-level verb tab** (per improve-tab-amendment + WV1-5 nav reorder #188) |
| Pricing                    | "€99/month single SKU"                                                                                  | **€120/month** (per WV1-6 #189)                                                                         |
| Tier-gating                | "Mostly retires; replaced by project-membership checks"                                                 | **Fully retired** (`isPaidTier()` etc. deleted per WV1-5 #188)                                          |
| Workflow model-rightsizing | "Sonnet for ≥70% of dispatches"                                                                         | **Dropped** — right-size per task (Haiku/Sonnet/Opus by judgment density) per `bb296898`                |
| Math.random invariant      | "Log gap (no ESLint rule)" in INVARIANTS.md                                                             | **Mechanically enforced via ESLint** per PR #198                                                        |
| VariScout Process          | Mentioned briefly as "named-future"                                                                     | **Has dedicated `docs/01-vision/variscout-process/` folder with 7 sub-files** per PR #193               |
| Atomic-deletion dispatch   | Not mentioned                                                                                           | **Researched + adopted pattern** per `df3e9d81`                                                         |

### 11.3 PR #184 recovery plan (Option B from the analysis)

Roughly half of PR #184 is OBSOLETED by user's Phase A on main; the other half is STILL NOVEL infrastructure with zero conflict.

**Cherry-pick clean onto fresh branch** (`docs-strategy-2026-infra` off latest `origin/main`):

| Keep | Commit     | What                                                                                                                       |
| ---- | ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| ✅   | `c8c8b997` | Foundation: memo + spec + ADR-083                                                                                          |
| ✅   | `2dbb6a1f` | Schema collapse (scripts + 500-doc frontmatter backfill — ⚠️ likely conflicts on Phase-C-amended docs)                     |
| ✅   | `92c96564` | Tier 1 supporting docs at `docs/agent-context/`                                                                            |
| ✅   | `3c579ff2` | Tier 1 skills (3 SKILL.mds)                                                                                                |
| ✅   | `db4f6dd7` | `.claude/rules/` → `.claude/invariants/` rename (⚠️ may conflict with user's `.claude/rules/testing.md` edit from PR #198) |
| ✅   | `f8a60ae0` | `.claude/INVARIANTS.md` synthesis                                                                                          |
| ✅   | `385acc71` | Replace prose invariant duplication with `[[invariant]]` links                                                             |
| ✅   | `272b446c` | `pnpm docs:gen-arch` script                                                                                                |
| ✅   | `1376ded2` | Initial generated arch doc + cross-link                                                                                    |
| ✅   | `ff0a369d` | CoScout AX-design canonical doc                                                                                            |
| ✅   | `a7f3b80d` | CoScout AX cross-links on constituent ADRs                                                                                 |
| ✅   | `6e776d9d` | `.prettierignore` for arch doc + regen                                                                                     |
| ✅   | `5208f508` | doc-discipline.md + Play 2b SSoT revision + skill wire-in                                                                  |
| ✅   | `7afde65b` | Chore: arch regen                                                                                                          |
| ✅   | `8e84bfbc` | Banner principle (reader-first banners at the top)                                                                         |
| ✅   | `0ab26125` | 4 affirmative principles + decision-log format + agent manifests                                                           |
| ❌   | `c0d431e8` | Phase A wedge content — **DROP** (obsoleted by user's PR #191/#192)                                                        |

**Conflict-resolution heuristic**: prefer KEEPING user's content edits (they did Phase C); apply MY structural additions on top. If something doesn't resolve cleanly, log + ask.

### 11.4 Stale-reference fix-during-cherry-pick (~30 min)

Before final push, fix the high-impact stale references in the cherry-picked docs:

**Persona framing (per user decision 2026-05-17)**: use **"3 personas — Lead, Member, Sponsor"** consistently across all agent-context docs. The "Specialist" term is the ICP description (positioning level), not a 4th persona. Operational personas = Lead/Member/Sponsor.

**Files to update**:

- `docs/agent-context/onboarding-quick-start.md`:
  - nav 6→7 tabs; pricing €99→€120; tier-gating "fully retired"; Improve restored as top-level
  - **Replace "one persona (improvement specialist)"** with **"3 personas: Lead (full edit + manages membership) / Member (full edit) / Sponsor (Report-only at V1; signoff out-of-band)"**. Every subagent loading quickstart should see all 3 on first read — shapes virtually every UI/data decision (PR-WV1-1, WV1-3, WV1-7 Sponsor ACL wiring).
- `.claude/skills/agent-context-quickstart/SKILL.md`: same updates (nav, pricing, tier-gating, 3 personas)
- `docs/agent-context/package-router.md`:
  - already has "Lead/Member/Sponsor roles" in Projects-tab row — change "roles" → "personas" for terminology consistency with onboarding
  - review other rows for tier-gating references (drop where retired)
  - add `variscout-process/` row if useful for AX-design routing
- `docs/01-vision/coscout-ax-design.md`:
  - §Persona + Voice currently treats "persona" as CoScout's own voice (assistant not oracle, etc.). Add a sub-section about **CoScout adaptation per user persona** — Lead/Member/Sponsor have different CoScout exposure (e.g., Sponsor sees only Reports; CoScout coaching may differ).
- Root `CLAUDE.md`:
  - Strategic-direction line currently says "project-membership ACLs (no cross-AD-tenant invites)". Add: "3 personas (Lead / Member / Sponsor) within each Project."
  - Pricing line: €99 → €120 if mentioned
  - Nav line: 6-tab → 7-tab
- `.claude/INVARIANTS.md`: Math.random row from "gap" → "enforced via ESLint per PR #198"
- `docs/superpowers/specs/2026-05-16-docs-strategy-memo.md`: drop "Sonnet for ≥70%" framing; update €99→€120 if referenced
- `docs/superpowers/specs/2026-05-16-docs-strategy-design.md`: same; update §4 migration sequence to reflect SHIPPED status of wedge V1 + Phase C; note Plays 1b/2/4 priorities have shifted

**Open question logged for future session** (NOT in cherry-pick scope — wedge spec is the user's call):

- Wedge spec on main currently says: "Persona model: One — Specialist (with member-roles within projects). Project-membership roles: Lead / Member / Sponsor." This uses "persona = Specialist" + "roles = Lead/Member/Sponsor" — DIFFERENT from the simpler "3 personas" framing we're adopting in agent-context docs. Worth a follow-up session to unify terminology in the wedge spec itself (`docs/superpowers/specs/2026-05-16-wedge-architecture-design.md`) so the canonical reads consistently with the agent quickstart. Until then, our docs use the simpler framing; the wedge spec retains its precise language. Document as `docs/decision-log.md` entry when the unification ships.

Defer to Session 2 alignment pass (out of cherry-pick scope):

- Atomic-deletion dispatch pattern adoption in workflow docs
- Wedge-spec terminology unification (if user chooses to ship it)
- Any other operational refinements surfaced between now and Session 2

### 11.5 Plan-file promotion to transcript

Per §2.7 doc-discipline (plan files are ephemeral, SELECTIVE promotion to `docs/ephemeral/transcripts/` for landmark sessions), this brainstorm qualifies — it produced the foundational strategy + discipline.

**Add to cherry-pick batch**:

- `cp ~/.claude/plans/i-was-wondering-that-effervescent-boole.md docs/ephemeral/transcripts/2026-05-16-docs-strategy-brainstorm.md`
- Add frontmatter: `purpose: remember, tier: ephemeral, status: archived, topic: [docs-strategy, transcript], audience: human, title: 'Docs Strategy 2026 — Brainstorm Transcript'`
- Strip the top banner (the file's own preamble noting "this is a transcript" — redundant once it lives at the transcript path)
- Reference from strategy spec §0 or §1: "Brainstorm transcript: [`docs/ephemeral/transcripts/2026-05-16-docs-strategy-brainstorm.md`]"

### 11.6 Revised session sequence (REORDERED — 1b before steward/telemetry)

The original sequence had Session 4 = Play 1b (folder restructure) AFTER Session 3 = steward+telemetry. User flagged this should be reordered: **1b is the substrate; steward + telemetry should operate on the FINAL structure**.

**Session 2: "Discipline becomes mechanical + alignment pass"** (~2-3hr subagent)

- **Play 2b (SSoT validator)**: extend `scripts/check-doc-frontmatter.mjs` per the spec — HARD-FAILs `*-amendment-*.md` filenames; banner enforcement (HARD-FAIL on `status: superseded` without banner; WARN on `status: delivered` without `delivered-by:`); design-spec body change adding `## Amendment` heading warning; decision-log append-only check.
- **Play 2c (toolbox scripts)**: `pnpm docs:{find,get,related,recent,verify,amend}` — operates on CURRENT FLAT corpus; works without Play 2a cards. Uses ripgrep + frontmatter filter + body `[[name]]` graph.
- **Play 2d (toolbox skill)**: `.claude/skills/docs-toolbox/SKILL.md` wires it together. `docs/llms.txt` converts from static catalog → router skill.
- **Alignment pass**: audit shipped docs against current main reality; fix any stale refs that didn't get caught in the cherry-pick fix list (§11.4); review INVARIANTS for any tier-gating-related entries that should drop.
- **Ship as one PR** — cohesive theme: "discipline + retrieval surface".

**Session 3 (REORDERED — was Session 4): "Substrate is the substrate" — Plays 1b + 2a combined** (~2hr subagent — but DISCUSS 1b FIRST)

- **Discussion gate on 1b**: is the 521-doc restructure still worth doing given Phase C is done? Trade-offs:
  - PRO: schema fields (purpose/tier) already added in PR #184 cherry-pick; folders should match the schema; future authoring is clearer; sets precedent matching `docs/01-vision/variscout-process/` sub-folder pattern.
  - CON: 521-doc mv is mechanically big; risk of broken inbound links; Phase C just touched 90 docs (user fatigue); current flat structure works.
- If 1b GO: `git mv` to `docs/stable/`, `docs/living/<purpose>/`, `docs/ephemeral/`, `docs/cards/` per §2.5. Includes slotting `docs/01-vision/variscout-process/` into the new structure. Session 2's validator + toolbox catch broken refs.
- **Play 2a (atomic decomposition) — ADDITIVE, no discussion gate needed**:
  - `docs/decision-log.md` → `docs/cards/decisions/dec-<YYYYMMDD>-<slug>.md` per pinned decision. The aggregate file STAYS as a generated view (`pnpm docs:rebuild`); cards are a parallel queryable layer. User's Phase C curation stays intact.
  - `MEMORY.md` index + `~/.claude/projects/.../memory/` topic files → `docs/cards/memory/<topic>.md`. Mirrors the existing atomic structure into repo for cross-context discoverability + finally resolves the 24.4KB MEMORY.md size limit (still over today; user manages manually).
  - `docs/investigations.md` `[RESOLVED]` entries → `docs/cards/investigations/inv-<YYYYMMDD>-<slug>.md`. Open entries stay in `docs/ephemeral/investigations/`.
  - Generator script `scripts/docs/rebuild-views.mjs` regenerates the aggregate views from cards (so backward compatibility for any tool/reader expecting the aggregate path).
- **Why combine 1b + 2a**: cohesive theme — both are substrate moves on the corpus. 2a's cards land at `docs/cards/` which is part of the 1b folder structure. Steward loop (Session 4) benefits from operating on the FULL structural end-state.
- **Ship as one PR** — cohesive theme: "substrate is the substrate".

**Session 4 (was Session 3): "Continuous freshness + cleanup"** — Plays 2e + 5 + Play 4 audit (~2-3hr subagent)

- **Play 2e (steward loop)**: `/docs-steward` slash command + `scripts/docs-steward.mjs`. Drift sensor compares `verified-against-commit` to current HEAD. Now operates on FINAL folder structure (from Session 3).
- **Play 5 (telemetry)**: toolbox logs queries to `docs/.telemetry/queries.jsonl`; `pnpm docs:cohort-report` outputs untouched-in-90-days + top-queried + never-returned.
- **Play 4 audit (much smaller post-Phase-C)**: scan for remaining multi-canonical claimants user's Phase C didn't catch; small consolidation moves; likely 1-2hr scope not a week.
- **Ship as one PR** — cohesive theme: "the corpus maintains itself".

**Ongoing: Play 3b (Tier 2 procedure skills)** — build skills as Play 5 telemetry shows high-frequency dispatch patterns. Data-driven inventory, not pre-specified 15-skill list. Continuous, not a single push.

### 11.7 Plays NOT in scope going forward

| Play                                                                    | Status                                    | Reason                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ~~**2a — atomic decomposition of decision-log/MEMORY/investigations**~~ | **MOVED to Session 3** (combined with 1b) | Originally deferred citing "quiet repo + Play 1b substrate" blockers — both stale now (wedge V1 + Phase C shipped; cards only need top-level `docs/cards/` folder). MEMORY.md still over 24.4KB limit, decision-log will grow again; cards architecture provides real value. Naturally cohesive with 1b. |
| **Big Tier 2 skills push (15 skills as one batch)**                     | **REPLACED**                              | By ongoing data-driven build-out as patterns emerge.                                                                                                                                                                                                                                                     |
| **"Phase C audit" as a project**                                        | **SUPERSEDED**                            | By user's PRs #191-196. Steward loop (Play 2e) takes the continuous-freshness baton.                                                                                                                                                                                                                     |
| **Original Play 2b "addendum threads on all living docs"**              | **REPLACED**                              | By revised 2b "SSoT discipline by doc type" (already in PR #184 cherry-pick batch).                                                                                                                                                                                                                      |

### 11.8 The bigger lesson (for the transcript)

The original docs-strategy-2026 was designed assuming wedge V1 would be in-flight for 3-4 weeks during the doc-strategy build. **Reality: wedge V1 + Phase C both shipped TODAY (2026-05-17)**, much faster than the plan assumed.

What this validates:

- **The discipline itself**: doc-type-by-doc-type SSoT, edit-in-place for design specs, reader-first banners, decision-log as temporal index — all still right, all in PR #184 cherry-pick batch.
- **The infrastructure**: schema collapse, Tier 1 skills, INVARIANTS, gen-arch, AX-design consolidation — all durable, all in cherry-pick batch.
- **The audit findings**: 8-purpose × 4-tier foundation, 17 emergent topic tags, agent-context as 4% gap — still describe the structural reality of the corpus.

What this changes:

- **Sequencing**: the "post-wedge-V1 quiet window" arrived TODAY, not in 3-4 weeks. Sessions 2-4 can run much sooner than planned.
- **Priorities**: Play 2b (SSoT validator) becomes highest leverage because the wedge-amendment incident PROVED convention alone isn't enough. Play 1b becomes lower priority because Phase C cleaned up most of what the restructure would have helped with.
- **Scope reduction**: Play 4 (one-canonical) is mostly done; Play 2a (cards) can defer; Big Tier 2 skills push becomes ongoing.

What this is itself an example of:

- **Per the discipline §2.7**: the strategy is a `status: active` design spec; reality diverged from intent; the right pattern is **edit this plan/spec in place** (§11 added today) **+ decision-log entry** (when transcript lands in repo, link from decision-log). NOT a `*-amendment-design.md` side file.
- **The §2.7 reader-first banner pattern** would apply to the strategy spec post-cherry-pick: add a banner noting "Significant recalibration 2026-05-17 — see §11 for current execution state vs original 5.5-week plan."

This recalibration IS the discipline being applied to its own strategy. Recursive but appropriate.
