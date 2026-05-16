---
title: 'VariScout Docs Strategy 2026 — Full Design'
status: active
date: 2026-05-16
purpose: design
tier: living
audience: both
topic: [docs-strategy, meta, schema]
related: [2026-05-16-docs-strategy-memo, adr-083-eight-purpose-doc-taxonomy]
---

# VariScout Docs Strategy 2026 — Full Design

_1-page CTO memo: [2026-05-16-docs-strategy-memo.md](2026-05-16-docs-strategy-memo.md). Schema change ADR: [ADR-083](../../07-decisions/adr-083-eight-purpose-doc-taxonomy.md)._

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

| Purpose           | Shape                                                                        | Tooling                                                                                       | Lifecycle treatment                                            |
| ----------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **orient**        | ≤6 canonical narrative docs                                                  | Addendum threads; pinned amendments                                                           | Stable; manually reviewed quarterly                            |
| **decide**        | Atomic cards                                                                 | `pnpm docs:find/get/related`; supersession chains                                             | Card-tier; continuous via Steward                              |
| **design**        | Living specs with `implements:` ADR back-link                                | Spec ↔ impl drift sensor (cited symbols → AST check, Playwright selector check for UX-Design) | Living → archive on ship; `draft → active → superseded`        |
| **build**         | Skills (procedures) + ephemeral plans + package CLAUDE.md procedure sections | `.claude/skills/`; subagent-driven-development                                                | Skills: living; Plans: ephemeral; patterns in nested CLAUDE.md |
| **system**        | Auto-generated where possible (deps, exports), narrated where not            | `pnpm docs:gen-arch` from package.json + tsconfig                                             | Living; auto-regenerate on push                                |
| **constrain**     | Rules + linting + tests (NOT prose)                                          | ESLint + pre-commit + denylist scripts                                                        | Stable; rules removed only via ADR                             |
| **agent-context** | Progressive disclosure: root → nested → skills → cards                       | Skill auto-load by description; CLAUDE.md size budget; routing skill replaces static catalog  | Living; weekly size check; skill inventory growth              |
| **remember**      | Chronological cards + selected transcript promotions                         | `docs/cards/` for B+I; `docs/ephemeral/transcripts/` for selected plans                       | Append-only; never edited (amendments via thread)              |

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
- One-shot script: convert existing "PARTIALLY SUPERSEDED" prefixes in MEMORY.md + scattered docs → dated amendment entries with sources from `git log` / decision-log.

**2c — Toolbox scripts (3 days)**:

- `scripts/docs-toolbox/find.mjs` — ripgrep + frontmatter filter, returns top-5 cards with excerpts.
- `scripts/docs-toolbox/get.mjs` — full card by id.
- `scripts/docs-toolbox/related.mjs` — graph traversal via `related:` + body `[[name]]`.
- `scripts/docs-toolbox/recent.mjs` — new cards + amendment entries since date.
- `scripts/docs-toolbox/verify.mjs` — bump `last-verified` + `verified-against-commit`.
- `scripts/docs-toolbox/amend.mjs` — append to `## Amendments` section.
- Wired to `pnpm docs:find/get/related/recent/verify/amend` (root `package.json`).

**2d — Docs toolbox skill (1 day)**:

- `.claude/skills/docs-toolbox/SKILL.md` with `description` triggering on doc-retrieval tasks.
- Body: when-to-use, tool surface (`pnpm docs:*`), task kits, examples.
- `docs/llms.txt` converts from static catalog → router pointing to this skill.

**2e — Steward loop (2 days)**:

- `scripts/docs-steward.mjs` — Node CLI diffs `verified-against-commit` vs current HEAD; outputs markdown report.
- `.claude/commands/docs-steward.md` slash command + Claude triage session.

### Play 3 — Skills inventory build-out (3 days + ongoing)

**Objective**: Expand from 2 skills to ~18 task-typed skills covering common subagent dispatches. Closes the **4%-of-living agent-context gap**.

**Tier 1 — Agent-context essentials** (close the 4% gap first):

- `agent-context-quickstart` — 5-minute onboard surface
- `package-router` — which CLAUDE.md to load for a given work area
- `store-state-glossary` — what's in each Zustand store

**Tier 2 — Task-typed procedure skills** (15 skills):
ship-ui-primitive, add-chart, migrate-store, add-stats-test, add-i18n-string, write-spec, amend-adr, run-coscout-eval, debug-canvas-issue, add-investigation-card, add-decision-card, verify-spec-against-impl, promote-plan-to-transcript, run-docs-steward, architecture-test-write.

### Play 4 — One canonical artifact per concept (1 week)

**Objective**: Execute the 8 consolidation moves from Agent 2 + archive fossils + lock canonical homes.

Agent 2's 8 prioritized consolidation moves:

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

**USER-JOURNEYS variants**: Keep all 6 (audit-confirmed: mode-specific splits, not drift). Add `inherits-from: USER-JOURNEYS.md` to the 5 mode-specific variants.

### Play 5 — Telemetry + 90-day archive cohort (2 days)

Toolbox scripts log every query → `docs/.telemetry/queries.jsonl` (gitignored). `pnpm docs:cohort-report` surfaces untouched-in-90-days cards, top-queried, never-returned.

### Play 6 — Constrain consolidation + invariants rename (2 days)

- `git mv .claude/rules/ .claude/invariants/` — clarifies purpose
- Create `.claude/INVARIANTS.md` synthesizing index
- Per-invariant canonical home + enforcement mechanism inventory

### Play 7 — System auto-generation (3 days)

`pnpm docs:gen-arch` emits dependency graph (mermaid) + sub-path export map + Tailwind v4 source map from live package.json + tsconfig. Pre-push hook regenerates on each push.

### Play 8 — CoScout AX-design consolidation (2 days)

New canonical `docs/living/design/coscout-ax-design.md` with `topic: [ax, coscout]` gathering ADR-060/068/069 + coscout-prompts rule + eval discipline. All constituents cite back to it.

---

## 4. Migration Sequence

| Week  | Phase / Plays            | Effort         | Output                                                                          |
| ----- | ------------------------ | -------------- | ------------------------------------------------------------------------------- |
| **0** | **Phase A quick wins**   | ~3 hours       | Wedge content consolidated; zero-infra warm-up                                  |
| 1     | Play 1                   | 3 days         | Folder restructure + schema collapse; fossil archive                            |
| 1–3   | Play 2 (2a–2e)           | 2 weeks        | Cards & Threads kernel; atomic decomposition; toolbox; Steward loop             |
| 3     | Play 3 + Play 6          | 3 + 2 days     | Skills inventory (Tier 1 first); INVARIANTS.md synthesis                        |
| 4     | Play 4                   | 1 week         | Remaining Agent 2 moves; tier-philosophy archive; USER-JOURNEYS variant lineage |
| 5     | Play 5 + Play 7 + Play 8 | 2 + 3 + 2 days | Telemetry + System auto-gen + CoScout AX consolidation                          |

---

## 5. Critical Files

### To create (Play 1)

- `docs/stable/`, `docs/living/<purpose>/`, `docs/ephemeral/`, `docs/cards/` hierarchy
- This spec (`2026-05-16-docs-strategy-design.md`)
- `docs/superpowers/specs/2026-05-16-docs-strategy-memo.md`
- `docs/07-decisions/adr-083-eight-purpose-doc-taxonomy.md`

### To modify (Play 1)

- `scripts/docs-frontmatter-schema.mjs` — collapse schema
- `scripts/check-doc-frontmatter.mjs` — enforce new fields + alias maps
- `scripts/docs-frontmatter-fix.mjs` — backfill `purpose` + `tier`
- `docs/llms.txt` — update paths
- Root `CLAUDE.md` — "Where to look" section

### To archive (confirmed by Agent 1 audit)

- `docs/09-baseline/` → `docs/archive/baselines/` — pre-wedge audit snapshots
- `docs/10-development/project-status-audit-2026-04-16.md` → `docs/archive/audits/`
- `docs/08-products/tier-philosophy.md` → `docs/archive/` (Play 4c)
- `.claude/agents/flow-nexus/` → `.claude/agents/experimental/` (verify inbound refs first)

### To delete (Play 4g)

- `docs/03-features/learning/glossary.md` — merge unique content into root `glossary.md`, then `git rm`

---

## 6. Verification

**Play 1 exit criteria**:

- `pnpm docs:health` green with new schema
- All inter-doc links resolve (no broken refs)
- `bash scripts/pr-ready-check.sh` green
- `git log --follow` works on moved files

**Overall health indicator** (30 days post-Play-5):

- Cohort report shows non-zero queries logged
- ≥1 Steward run completed
- `last-verified` rate on `living` tier >50%

---

## 7. Audit Findings Summary

### 7.1 Purpose distribution (Agent 1 findings)

| Purpose       | Stable | Living | Ephemeral | Total                      |
| ------------- | ------ | ------ | --------- | -------------------------- |
| orient        | 12     | 0      | 0         | 12                         |
| decide        | 0      | 90     | 0         | 90                         |
| design        | 0      | 180    | 5         | 185                        |
| build         | 0      | 50     | 2         | 52                         |
| system        | 0      | 20     | 5         | 25                         |
| constrain     | 8      | 0      | 0         | 8                          |
| agent-context | 0      | **15** | 0         | **15** (4% — critical gap) |
| remember      | 100    | 0      | 0         | 100                        |

### 7.2 Multi-canonical overlap matrix (Agent 2 findings)

Highest-overlap pair: decision-log "Wedge pivot" entry (~2000 words) vs ADR-082 — 90% verbatim duplication. Canonical home: **ADR-082**.

**USER-JOURNEYS variants verdict: KEEP ALL SIX** — mode-specific methodology, not stale drift.

### 7.3 Implications resolved

- Investigations.md disposition: keeps identity with OPEN (decide) vs [RESOLVED] (remember) split. Closed → cards via Play 2a.
- Methodology canonical: dual (vision spec §2.1 = spine, methodology.md = pedagogical narrative).
- Fossils: `09-baseline/`, `project-status-audit-2026-04-16.md`, `03-features/learning/glossary.md`, `tier-philosophy.md` confirmed.

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
