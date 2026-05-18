---
title: 'VariScout Docs Strategy 2026 — Full Design'
status: active
date: 2026-05-16
purpose: design
tier: living
audience: both
topic: [docs-strategy, meta, schema]
related: [2026-05-16-docs-strategy-memo, adr-083-eight-purpose-doc-taxonomy]
layer: spec
---

# VariScout Docs Strategy 2026 — Full Design

> 🟡 **Active build via [`PR #184`](https://github.com/jukka-matti/variscout/pull/184)** | 🔄 **Last material edits 2026-05-17** — §2.7 expanded with: "Core principles (in priority order)" affirmative list (4 principles); "Reader-first banners at the top" (template matrix + Play 2b validator extensions); "Standard entry format" for decision-log; agent-manifests + investigations + memory added to doc types. Per the principle this spec defines: frontmatter alone is insufficient — this banner signals reader-relevant changes since the spec was first shipped.

_1-page CTO memo: [2026-05-16-docs-strategy-memo.md](2026-05-16-docs-strategy-memo.md). Schema change ADR: [ADR-083](../../07-decisions/adr-083-eight-purpose-doc-taxonomy.md). Brainstorm transcript (full design journey + audit findings): [`docs/ephemeral/transcripts/2026-05-16-docs-strategy-brainstorm.md`](../../ephemeral/transcripts/2026-05-16-docs-strategy-brainstorm.md). Phase 2 implementation plan: [`../plans/2026-05-17-docs-strategy-2026-phase-2-discipline.md`](../plans/2026-05-17-docs-strategy-2026-phase-2-discipline.md)._

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

The fix is not "more documentation infrastructure" — it's **less, but living**: simpler metadata, atomic decomposition of bloat sources, **single-source-of-truth discipline by doc type** (§2.7), agent-queryable retrieval, continuous freshness, expanded skill inventory.

**Why doc-type discipline specifically**: a real failure mode surfaced during execution — a mid-flight design change to the wedge spec was captured as a _separate_ `*-amendment-design.md` spec file instead of editing the canonical spec in place. A new session reading only the wedge spec saw stale content and went down a wrong path. The amendment file was discoverable in principle (it was in `docs/superpowers/specs/`) but invisible in practice (no link from the canonical it amended). Convention alone doesn't prevent this — it has to be mechanically enforced (§2.7 + revised Play 2b).

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
status: draft | active | named-future | superseded | archived
audience: human | agent | both
# operational
last-verified: YYYY-MM-DD
verified-against-commit: <sha>
supersedes: [<id>]
related: [<id>]
```

**Collapse from current schema**:

- 22 STATUS enums → **5** (`draft, active, named-future, superseded, archived`). Most of the 22 were aspirational distinctions never used; `named-future` earned its keep — used by VariScout Process docs (aspirational future product line contingent on V1 customer validation).
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

| Purpose           | Shape                                                                                               | Tooling                                                                                                                                | Lifecycle treatment                                                                        |
| ----------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **orient**        | ≤6 canonical narrative docs                                                                         | Addendum threads; pinned amendments                                                                                                    | Stable; manually reviewed quarterly                                                        |
| **decide**        | Atomic cards                                                                                        | `pnpm docs:find/get/related`; supersession chains                                                                                      | Card-tier; continuous via Steward                                                          |
| **design**        | Living specs with `implements:` ADR back-link; **edit in place** (no `*-amendment-*.md` side files) | Spec ↔ impl drift sensor (cited symbols → AST check, Playwright selector check for UX-Design); `delivered-by:` frontmatter links to PR | `draft → active → delivered → superseded → archived` (body always reflects current intent) |
| **build**         | Skills (procedures) + ephemeral plans + package CLAUDE.md procedure sections                        | `.claude/skills/`; subagent-driven-development                                                                                         | Skills: living; Plans: ephemeral; patterns in nested CLAUDE.md                             |
| **system**        | Auto-generated where possible (deps, exports), narrated where not                                   | `pnpm docs:gen-arch` from package.json + tsconfig                                                                                      | Living; auto-regenerate on push                                                            |
| **constrain**     | Rules + linting + tests (NOT prose)                                                                 | ESLint + pre-commit + denylist scripts                                                                                                 | Stable; rules removed only via ADR                                                         |
| **agent-context** | Progressive disclosure: root → nested → skills → cards                                              | Skill auto-load by description; CLAUDE.md size budget; routing skill replaces static catalog                                           | Living; weekly size check; skill inventory growth                                          |
| **remember**      | Chronological cards + selected transcript promotions; **append-only**, never edit prior entries     | `docs/cards/` for B+I; `docs/ephemeral/transcripts/` for selected plans                                                                | Append-only; new entry supersedes old when reality changes                                 |

### 2.7 Doc discipline: SSoT by doc type

The 8-purpose × 4-tier foundation defines WHERE docs live. This section defines HOW they update — which is just as important for keeping the corpus coherent. **Without this discipline, the metadata gains are erased by amendment-of-amendment drift.**

#### Core principles (in priority order)

1. **Doc-type discipline.** Different doc types serve different jobs and update differently. Design specs edit-in-place; ADRs append amendment blocks; decision-log appends; generated docs auto-rebuild; plan files stay ephemeral. (Detail in the doc-types table below.)

2. **One canonical home per concept.** Every concept has exactly ONE authoritative doc that owns it. Other docs link rather than restate. When the canonical changes, all linkers point to the same updated truth — no fork in interpretation. Play 4 enforces operationally: audit the corpus for multi-canonical claimants, consolidate, mark losers `superseded` with redirect banners.

3. **Reader-first banners.** Frontmatter is machine-readable; banners are human/agent-readable. When a doc's state diverges from "body is current truth" — superseded, materially edited recently, delivered, ADR with amendments below — say so in a banner at the top. First thing the reader sees.

4. **Decision-log as temporal index.** Every canonical edit produces a decision-log entry in a standard format (see below). Canonical docs are "as of now"; the log is "what changed when and why" over the canonical set.

Conflating these or treating any one as optional creates the kind of drift the 2026-05-17 wedge-amendment incident surfaced — a side-amendment spec violated principles 1, 2, and 3 simultaneously.

#### Doc types at a glance

Different doc types are NOT updated the same way:

- **Design specs are current-state SoT.** The body at any moment IS the truth. Edit in place when intent changes.
- **ADRs are point-in-time decisions.** Preserve original reasoning. Append `## Amendment — YYYY-MM-DD` blocks for clarifications. New ADR for fundamental reframings.
- **Decision-log is chronological.** Append-only. Never edit prior entries. New entry supersedes old.
- **Generated docs are mechanical projections of source.** Auto-rebuilt by scripts. Never hand-edited. `.prettierignore` excludes.
- **Plan files are ephemeral session transcripts.** Live in `~/.claude/plans/`, not in repo. Selective promotion to `docs/ephemeral/transcripts/` for landmark sessions.
- **Investigations are pre-decision observations.** Open entries editable while open. `[RESOLVED]` entries immutable. Closed investigations graduate to cards (Play 2a).
- **Memory holds cross-session durable facts for Claude.** Topic files in `~/.claude/projects/.../memory/` edit in place. Index `MEMORY.md` is one-line entries ≤200 chars (over-budget triggers truncated load).
- **Agent manifests are agent-loaded context** (root `CLAUDE.md`, `AGENTS.md`, `docs/llms.txt`, nested package `CLAUDE.md`). Edit in place. Per-file CLAUDE.md size budget enforced (`scripts/check-claude-md-size.sh`). These are the "first read" surface for every agent dispatch — keep them tight.

#### Anti-patterns (mechanically forbidden)

| Anti-pattern                                                                     | Why wrong                                                                            | Right pattern                                                                                     | Enforcement                                                            |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `*-amendment-design.md`, `*-revision-design.md`, `*-update-design.md` side files | Orphan amendments drift from canonical; readers must mentally merge body + side file | Edit canonical spec in place + decision-log entry                                                 | Validator HARD-FAILs on filenames matching these patterns              |
| Editing ADR body after `status: accepted`                                        | Loses original decision context                                                      | `## Amendment — YYYY-MM-DD` block at bottom OR new ADR                                            | Validator WARNs on diff to ADR body without amendment-block syntax     |
| Editing prior decision-log entries                                               | Breaks chronological record                                                          | New entry that supersedes old (with `[supersedes <prior-entry-date>]` marker)                     | Validator WARNs on git diff to lines older than 7 days in decision-log |
| Hand-editing `*-generated.md` files                                              | Out-of-sync with source; next regen wipes edits                                      | Update the generator; regenerate                                                                  | `.prettierignore` + pre-push staleness check                           |
| Putting active-decision content only in plan files                               | Plan files live in `~/.claude/plans/`, not in repo; future sessions don't see them   | Land decisions in canonical home (ADR / spec / decision-log) before merging the PR they came from | Reviewer convention; investigations.md tracks gaps                     |
| Renaming or moving canonical docs without a `supersedes:` chain                  | Breaks inbound links + obscures lineage                                              | `git mv` + add `supersedes:` to the new path's frontmatter + `redirect-to:` banner at old         | Validator checks `supersedes:` chain integrity                         |

#### Decision-log as temporal index

Every change to a canonical doc (spec body edit, ADR amendment, supersession) gets a decision-log entry that says:

- **What** changed (which canonical doc + section)
- **Why** (link to brainstorm transcript, plan, or PR)
- **Supersession** (what's now stale vs what's still valid)
- **Commit reference** (so future readers can git archaeology)

This makes the decision-log the chronological backbone over the canonical doc set. The canonical docs themselves are always "as of now"; the log tells you "what changed when and why".

**Standard entry format** (Play 2c's `pnpm docs:recent --amendments` parses this shape):

```
- YYYY-MM-DD — <short title ≤80 chars>. <Edit type>: <doc>#<section> [supersedes <prior>].
  Why: <one-sentence rationale>.
  Commit: <sha-short>. PR: #N. Related: [[<id>], [<id>]].
```

**Required fields**: date, title, edit-type (`spec edit` / `ADR amendment` / `new ADR` / `supersession` / `archived` / etc.), `[supersedes <doc>#<section>]` marker if applicable, Why, Commit.
**Optional**: PR number, Related links (wikilinks to ADRs / specs / other entries).

**Why this format**: the `[supersedes <doc>#<section>]` marker is greppable + machine-parseable (enables `pnpm docs:recent --supersedes <doc>` queries). The 80-char title cap keeps chronological scan readable. The mandatory Why field prevents "the change is the change" entries with no rationale (a real problem in long-lived logs).

**What NOT to put in decision-log entries**: full rationale paragraphs (those live in the brainstorm transcript or PR description that Why links to); restated spec content (the canonical spec is the SoT — log just notes the edit); duplicated information across entries (one decision = one entry, with future entries citing it via `[supersedes …]`).

#### Edit-in-place mechanics (for design specs)

When editing a canonical spec mid-flight:

1. Make the edit.
2. Update `last-verified: <today>` frontmatter; bump `verified-against-commit: <sha>` after commit.
3. If the edit is material (changes intent or supersedes a section), **add a status banner at the top** of the body (after the H1) — see below.
4. Add decision-log entry citing the section change with a `[supersedes <doc>#<section>]` marker.
5. Commit with message capturing both the spec edit + the log entry.
6. (If during active build) flag the change in the build PR description so reviewers see it.

This makes mid-flight changes auditable without polluting the spec body with amendment scar tissue.

#### Reader-first banners at the top

**Frontmatter alone is not enough** — frontmatter is for tooling; readers (humans + agents) need a human-readable banner at the TOP of the body, right after the H1. This is the active signal a fresh-session reader sees first.

Required when: `status: superseded`, `status: archived`, `supersedes:` set, material in-place edit in the last 30 days, ADR with amendments below. Recommended for: `status: delivered` (link the shipping PR + code paths).

The wedge-amendment incident proved why: the wedge spec was amended on 2026-05-16 but never got a banner. A fresh session reading only the wedge spec saw no signal → went down the wrong path. A `🔄 Last material edit 2026-05-16 — §3.1 rewritten (Improve tab retained)` banner at the top would have made the divergence immediately visible.

**Pattern**: status banner at TOP for "you must know this before reading the body"; amendment blocks at BOTTOM (ADRs only) for "history accumulates here". Wikilinks (`[[name]]`) are **passive** at read time and don't substitute for banners — they preserve graph structure, not reading priority.

Concrete banner templates + the full required/recommended matrix live in [`docs/agent-context/doc-discipline.md` §Reader-first banners](../../agent-context/doc-discipline.md). Loaded by `agent-context-quickstart` skill on session start so every subagent gets the templates cold.

**Enforcement (Play 2b validator extensions)**:

- HARD-FAIL: `status: superseded` without `> SUPERSEDED` banner in first 10 lines of body
- HARD-FAIL: `supersedes: [<id>]` set without banner mentioning what's being superseded
- WARN: `status: delivered` without delivery banner OR `delivered-by:` frontmatter
- WARN: `status: active` design spec with `last-verified` >30 days behind HEAD (suggests freshness banner or transition to `delivered`)

#### Spec lifecycle states (explicit)

`status:` transitions for design specs:

| Status       | Meaning                                                                   | Body update pattern                                                             |
| ------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `draft`      | Designing; not yet building                                               | Edit freely; no `last-verified` discipline yet                                  |
| `active`     | Designed; build underway                                                  | Edit in place when intent changes; bump `last-verified`                         |
| `delivered`  | Shipped; `delivered-by: PR #N` set; `code-locations: [...]` if applicable | Body describes current state of shipped feature; edit only when feature evolves |
| `superseded` | Replaced by another spec via `supersedes:` chain                          | Frozen; redirect banner at top pointing to successor                            |
| `archived`   | Historical reference only                                                 | Frozen; moved to `docs/archive/`; no longer cited from canonical surfaces       |

Transitions are explicit + auditable (frontmatter diff is the signal).

#### Why this prevents "specs over specs"

The user's concern: superpowers methodology creates plan files + design specs + implementation; over time, artifacts accumulate. The fix isn't fewer artifacts — it's clearer ownership:

- **Plan files**: ephemeral; never become canonical
- **Design specs**: ONE per concept; edit in place during build; supersede only for material reframings
- **ADRs**: point-in-time decisions; capture reasoning at time T; rarely rewritten
- **Decision-log**: chronological index over the canonical set; the temporal "what changed when"

At any moment, the question "what is the current intended state of X?" has exactly ONE answer: the canonical spec for X. No mental merging. No side-spec hunting. No "what supersedes what" archaeology in plain reading.

This is the discipline. Without it, the 8-purpose × 4-tier foundation is just metadata gymnastics. With it, the corpus stays coherent as it scales.

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

**2b — SSoT discipline by doc type (~2 days)** [**SAFE-PARALLEL — can ship now, no folder-mv dependency**]

Codifies §2.7 into mechanical enforcement. Differentiates by doc type instead of applying one universal "addendum thread" pattern (the original 2b proposal that the wedge-amendment incident revealed as wrong-shape — see §1 Context).

**Deliverables**:

- New convention doc `docs/agent-context/doc-discipline.md` (TEMP location; Play 1b moves to `docs/living/agent-context/`). Distills §2.7: doc-type table + anti-pattern table + edit-in-place mechanics + spec lifecycle states. Loaded by `agent-context-quickstart` skill as session-start read.

- `scripts/check-doc-frontmatter.mjs` extension:
  - **HARD-FAIL** on filenames matching `*-amendment-*.md`, `*-revision-*.md`, `*-update-*.md`, `*-followup-*.md` under `docs/superpowers/specs/`. Error: "Anti-pattern: edit the canonical spec in place. See `docs/agent-context/doc-discipline.md` §Anti-patterns. If genuinely intentional (rare), document rationale in decision-log + add filename to `.docs-discipline-allowlist`."
  - **WARN** on design-spec body diffs that add a `## Amendment` heading (allowed for ADRs only; design specs are edit-in-place).
  - **WARN** on design-spec `status: delivered` without `delivered-by:` frontmatter (proves spec-to-PR linkage).
  - **WARN** on `## Amendment` heading in ADR body that lacks date-prefix `YYYY-MM-DD` (format check).
  - **WARN** on `git diff` to lines older than 7 days in `docs/decision-log.md` (append-only convention).

- `agent-context-quickstart` skill (already shipped Play 3a): add step 4 "Read `docs/agent-context/doc-discipline.md`" — subagents dispatched to edit any canonical doc get discipline rules on session start.

- Decision-log entry convention: add `[supersedes <doc>#<section>]` marker pattern (machine-readable; greppable). Documented in doc-discipline.md.

- Migration of existing scar tissue: one-shot grep for existing "PARTIALLY SUPERSEDED" / "AMENDED" prefixes in canonical specs → for each, replace prefix with proper edit-in-place + decision-log entry. (Not for ADRs — those use the existing amendment-block convention.)

**Why this prevents the failure mode**: anyone (human or agent) attempting `2026-05-16-improve-tab-amendment-design.md` hits CI fail. They must edit the canonical spec in place. Convention + validator together encode the principle mechanically. New session reading the canonical spec sees current truth; no mental merging; no orphan-side-spec hunting.

**Exit criteria**:

- Validator extension shipped + tested against current corpus (zero false positives on existing files)
- `doc-discipline.md` exists; `agent-context-quickstart` skill loads it
- Manual spot-check: try creating `*-amendment-*.md` in a feature branch — CI fails as expected
- One representative existing canonical spec gets `delivered-by:` field added (proves the convention against `status: delivered` warning)

**Why now (safe-parallel)**: this is convention + validator only. No file moves, no decompositions, no shared-aggregate edits. Zero conflict risk with active wedge engineering. Ship before Plays 2a/c/d/e (which are blocked on Play 1b folder restructure).

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

> **Status as of 2026-05-17**: Phase A + Plays 1a, 3a, 6, 7, 8 SHIPPED via [PR #184](https://github.com/jukka-matti/variscout/pull/184) (13 commits, all safe-parallel with active wedge V1 engineering). Play 1 was split into 1a (foundation + schema collapse, shipped) + 1b (521-doc folder restructure, deferred). Play 2 was split into 2b (SSoT discipline, **now safe-parallel — ship next**) + 2a/2c/2d/2e (cards + toolbox + steward, deferred). Plays 1b, 2a/c/d/e, 4 await post-wedge-V1 quiet window. The revised 2b is the lesson from the wedge-amendment incident baked back into the strategy — see §1 Context.

### Ideal sequence (with current split + deferrals annotated)

| Week  | Phase / Plays                                         | Effort     | Status                      | Output                                                                                                               |
| ----- | ----------------------------------------------------- | ---------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **0** | **Phase A quick wins**                                | ~3 hours   | ✅ SHIPPED                  | Wedge content consolidated; zero-infra warm-up                                                                       |
| 1     | Play 1a (foundation artifacts + schema collapse)      | 1 day      | ✅ SHIPPED                  | Memo + spec + ADR-083; 22→5 STATUS; alias maps; frontmatter backfill                                                 |
| 1     | Play 1b (521-doc folder restructure)                  | 2 days     | ⏸ DEFERRED                  | `git mv` to `docs/stable/` + `docs/living/<purpose>/` + `docs/cards/`. Wait for quiet wedge window.                  |
| 1     | **Play 2b (SSoT discipline by doc type)**             | ~2 days    | 🟡 **NEXT (safe-parallel)** | Validator forbidding `*-amendment-*.md`; `doc-discipline.md` convention; lifecycle state enforcement. **Ship now.**  |
| 1–3   | Play 2 (2a + 2c + 2d + 2e: cards + toolbox + steward) | ~1.5 weeks | ⏸ DEFERRED                  | Blocked on Play 1b substrate + quiet repo (decomposing decision-log while wedge amends it = constant rework).        |
| 3     | Play 3a (Tier 1 agent-context skills)                 | 1 day      | ✅ SHIPPED                  | `agent-context-quickstart`, `package-router`, `store-state-glossary` — closes 4% agent-context gap                   |
| 3     | Play 3b (Tier 2 procedure skills, ~15 skills)         | 3 days+    | ⏸ later session             | `ship-ui-primitive`, `add-chart`, `migrate-store`, etc. Build as dispatch logs justify (data-driven prioritization). |
| 3     | Play 6 (invariants rename + INVARIANTS.md)            | 1 day      | ✅ SHIPPED                  | `.claude/rules/` → `.claude/invariants/`; 15 hard + 10 soft + 6 topic-scoped synthesized                             |
| 4     | Play 4 (one-canonical consolidation)                  | 1 week     | ⏸ DEFERRED                  | Agent 2's remaining 4 of 8 moves. Blocked on Play 1b + Play 2.                                                       |
| 5     | Play 5 (telemetry + 90-day cohort report)             | 2 days     | ⏸ blocked on 2c             | Toolbox query logging → cohort report. Useful after 2c lands.                                                        |
| 5     | Play 7 (`pnpm docs:gen-arch`)                         | 1 day      | ✅ SHIPPED                  | Dep graph + sub-path export map + Tailwind @source coverage; pre-push staleness check                                |
| 5     | Play 8 (CoScout AX-design consolidation)              | 1 day      | ✅ SHIPPED                  | Canonical `coscout-ax-design.md`; cross-links from ADR-060/068/069 + prompt invariant                                |

### Lessons baked back into the strategy (2026-05-17)

- **Original Play 2b ("addendum threads on living docs") was wrong-shape** — discovered when a wedge-spec amendment was captured as a separate `*-amendment-design.md` file, invisible to a new session reading only the canonical wedge spec. Revised 2b differentiates by doc type (§2.7).
- **Mid-session TaskStop pivot worked cleanly** — when wedge-conflict surfaced, killed in-flight Play 1 subagent + `git reset --hard` to safe commit; split into safe (1a) + deferred (1b). See `feedback_taskstop_subagent_pivot`.
- **Auto-generated docs need `.prettierignore`** — pre-push staleness check vs lint-staged prettier conflict during Play 7. See `feedback_autogen_doc_prettierignore`.
- **Doc-strategy work itself was the testbed** — Play 1 subagent dispatched without checking active parallel writers (wedge V1 engineering); user surfaced; corrected. See `feedback_parallel_workstream_conflict_check`.

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

| Risk                                                                             | Mitigation                                                                                                                                                                                               |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mass `git mv` breaks link resolution across 521 docs                             | `scripts/check-dead-links.sh` runs as gate; staged batches per purpose; fix broken links per batch                                                                                                       |
| Frontmatter migration loses metadata                                             | `docs-frontmatter-fix.mjs` runs dry-first; diff inspected; backup branch before merge                                                                                                                    |
| Atomic decomposition of `decision-log.md` loses context                          | Generated view preserves narrative; manual review of 5 sample decisions post-decomposition                                                                                                               |
| Steward loop produces noisy false-positives                                      | Conservative first cut (only flag cards where cited symbols are gone); tune threshold post-Play-5                                                                                                        |
| 15 skills is too many to maintain                                                | Start with 8 highest-frequency tasks; add others as dispatch logs justify; `pnpm docs:cohort-report` tracks unused skills                                                                                |
| AX-design doc for CoScout duplicates ADR content                                 | Strict citation discipline: AX-design doc states current state + tradeoffs; ADRs remain decision provenance                                                                                              |
| Schema collapse breaks downstream tooling assuming 22 STATUS values              | `docs-frontmatter-fix.mjs` maps old → new; transitional alias period (old values warn but pass) for 1 cycle                                                                                              |
| Doc-discipline drift if not mechanically enforced (the wedge-amendment incident) | Play 2b validator HARD-FAILs `*-amendment-*.md` filenames; WARNs on body-diff anti-patterns; `agent-context-quickstart` loads `doc-discipline.md` on session start so every subagent gets the rules cold |
| Validator false positives block legitimate work                                  | `.docs-discipline-allowlist` escape hatch for rare intentional exceptions; documented in `doc-discipline.md`; allowlist additions require decision-log entry citing the rationale                        |
| Spec body becomes stale during long active-status periods                        | `last-verified` frontmatter + Play 5 cohort report flags `living`-tier specs unverified >90 days; Steward loop (Play 2e) proposes amendment thread or `delivered` transition                             |
