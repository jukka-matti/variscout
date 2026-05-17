---
title: 'Wedge V1 Phase A Doc Completion + Phase C Audit Plan Artifact'
status: draft
last-reviewed: 2026-05-17
related:
  - docs/superpowers/specs/2026-05-16-wedge-architecture-design.md
  - docs/superpowers/specs/2026-05-16-improve-tab-amendment-design.md
  - docs/07-decisions/adr-082-wedge-architecture.md
---

# Wedge V1 Phase A Doc Completion + Phase C Audit Plan Artifact

## Why this design

The wedge architecture spec ([§13 Implementation sequencing](2026-05-16-wedge-architecture-design.md)) framed the doc cleanup as a 3-phase holistic effort, with the 2026-05-16 decision-log entry (item #11) memorializing the commitment:

> "Holistic doc cleanup (~500 docs) sequenced as Audit → Triage → Apply (Phase C), with canonical anchor docs (OVERVIEW, USER-JOURNEYS, DATA-FLOW, positioning, business-bible, tier-philosophy, roadmap, decision-log, root CLAUDE.md, llms.txt) **updated as Phase A before engineering**; per-surface amendments as Phase B during engineering."

A 2026-05-17 audit of PRs WV1-1..WV1-7 (now all merged on `main`) reveals partial follow-through:

| Phase                                        | Promised                        | Shipped                                                       | Gap                                                                   |
| -------------------------------------------- | ------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------- |
| **A** (anchors BEFORE engineering)           | 10 anchors rewritten/amended    | 2 done (OVERVIEW + USER-JOURNEYS, both now stale on price)    | 7 anchors untouched + 2 stale                                         |
| **B** (per-PR amendments)                    | Each WV1 PR amends nearest docs | ✅ Shipped (i18n keys, marketplace.md, spec amendments, etc.) | Few drift items in `apps/azure/CLAUDE.md` + `packages/core/CLAUDE.md` |
| **C** (post-engineering ~500-doc bulk audit) | Audit → Triage → Apply          | ❌ Not started                                                | Separate workstream                                                   |

This design closes **Phase A** and **scopes Phase C** as a planning artifact (does not execute Phase C).

## Decisions locked in brainstorm

### Vocabulary

Drop the word "wedge" from customer-facing docs. It was internal strategy framing from the brainstorm session that produced the architecture spec.

- **VariScout** = the current product (today, V1, single €120/month SKU, improvement specialist tool)
- **VariScout Process** = the named-future enterprise platform (Hub portfolios, 4 personas, auto pipelines, multi-source ingestion)

"Wedge" **stays** in historical artifacts only:

- ADR-082 title + body (historical decision name)
- decision-log.md 2026-05-16 entry (historical record)
- Plan files in `.claude/plans/`
- Commit messages (immutable history)
- Internal sub-plans `docs/superpowers/plans/2026-05-1*-pr-wv1-*.md` (delivered work record)
- Root `CLAUDE.md` workflow / feedback sections (developer-facing OK)

"Wedge" **must not** appear in:

- `docs/01-vision/positioning.md`
- `docs/01-vision/business-bible.md`
- `docs/roadmap.md`
- `README.md`
- `docs/OVERVIEW.md` (verify; the WV1-1 rewrite may have introduced it)
- `docs/USER-JOURNEYS.md` (same check)
- `docs/llms.txt`
- The membership-philosophy doc (post-rename)

### Positioning narrative

Two-product framing holistically — VariScout (today) + VariScout Process (named-future) — not V1-only, not "wedge"-laden. Per `feedback_honor_vision_commitments`: honor the wedge decision-log's commitment to the holistic two-product roadmap; don't hedge into V1-only framing.

### Scope: 4 sequenced PRs (Phase A + Phase C execution)

Execute as four PRs from this brainstorm, in order:

1. **PR 1 — Phase A**: 7 anchor rewrites + audit-caught drift fixes + Phase C plan artifact (~12-14 files). Smallest, focused, customer-anchor-coherence delivered immediately.
2. **PR 2 — Phase C AMEND**: surgical edits across docs flagged by the audit's stale-pattern detection. Estimated ~100-200 files. Mostly find-and-replace at known line numbers.
3. **PR 3 — Phase C ARCHIVE**: move superseded docs to `docs/archive/` with supersession headers. Estimated ~50-100 files. Per `feedback_consolidation_replace_not_umbrella`: archive over delete.
4. **PR 4 — Phase C DELETE**: remove dead docs with no institutional value (stale scratch notes, broken plan files). Estimated ~10-30 files.

KEEP-bucket docs need no PR. Each PR is reviewable + revertable. Total estimated effort: ~5-7 days across all four PRs.

Phase C audit (parallel Explore agents per stale-pattern) runs between PR 1 merge and PR 2 implementer dispatch — produces the triage table that drives PRs 2-4.

## Architecture

This is a documentation refactor, not a feature build. The "architecture" is the relationship between canonical anchor docs + the doc-graph.

### Canonical anchor relationship

```
                 ┌──── docs/OVERVIEW.md ────────────────────┐
                 │  "What VariScout is" — agent + customer  │
                 └────────────────┬─────────────────────────┘
                                  │
       ┌──────────────────────────┼──────────────────────────┐
       ↓                          ↓                          ↓
docs/01-vision/             docs/USER-JOURNEYS.md       docs/DATA-FLOW.md
  positioning.md            (golden + edge flows)       (single-SKU data
  business-bible.md                                      isolation, ACL)
       │
       ↓
docs/08-products/
  membership-philosophy.md      docs/roadmap.md          docs/llms.txt
  (was tier-philosophy.md)      (V1 SHIPPED +            (agent manifest
                                 Process named-future)    for V1 anatomy)
                                                              │
                                                              ↓
                                                       CLAUDE.md (root)
                                                       packages/*/CLAUDE.md
                                                       apps/*/CLAUDE.md
```

The doc-graph is shallow on purpose. Anchors don't depend on each other for definitions; they each provide a complete view at their abstraction layer (vision, journey, data, philosophy, schedule, agent-entry).

### Single source of truth for pricing

After this design ships, the **single source of truth for current pricing is** `docs/07-decisions/adr-082-wedge-architecture.md` (post-amendment). All other docs reference rather than restate. The wedge architecture spec keeps an amendment marker pointing to the ADR.

### Phase C plan artifact structure

Phase C is itself a designed workstream:

```
Phase C
├── C.1 Audit (parallel Explore agents per stale-pattern)
│     ↓ produces triage table
├── C.2 Triage (KEEP / AMEND / ARCHIVE / DELETE buckets)
│     ↓ aggregated into single markdown table
└── C.3 Apply (3 sequenced PRs by bucket: AMEND → ARCHIVE → DELETE)
```

This shape is captured in the new planning artifact `docs/superpowers/plans/2026-05-17-phase-c-doc-audit.md`.

## Components — what gets written

### Anchor rewrites

| Doc                                                                             | What it should say after this PR                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `docs/DATA-FLOW.md`                                                             | Single-SKU data flow. Project-membership ACL is the data-isolation layer (Hub-level data is tenant-wide; Project-formal data is membership-scoped). PWA-free vs Azure-paid distinction is **capability**, not tier. No "Team tier" language.                                                     |
| `docs/01-vision/positioning.md`                                                 | "VariScout = structured investigation for process improvement." One product for improvement specialists at €120/month, Azure tenant-wide, project-membership ACLs. Two-product roadmap framed as **VariScout today + VariScout Process future** (named-future, not announced). No "wedge" word.  |
| `docs/01-vision/business-bible.md`                                              | Single-SKU strategy. Today: VariScout at €120/month per Azure tenant. Future: VariScout Process (Hub portfolios, 4 personas, auto pipelines, multi-source ingestion) when product-market fit is validated for the specialist wedge first. Drop multi-tier funnel content. No "wedge" word.       |
| `docs/08-products/membership-philosophy.md` (renamed from `tier-philosophy.md`) | Preserve the philosophical framing — "one product, role-based access inside" — but new substance. Lead / Member / Sponsor ACL is the access model (replaces `isPaidTier()` / `hasTeamFeatures()` tier-gating). Cross-references ADR-082 §4 + `packages/core/src/projectMembership/canAccess.ts`. |
| `docs/roadmap.md`                                                               | Mark V1 (PR-WV1-1..7) as SHIPPED. Keep F-series + canvas migration tracking (developer-facing). Add **VariScout Process** as a named-future horizon (no commitment dates; gated on V1 customer validation). Customer-facing sections drop "wedge"; internal F-series tracking can stay as-is.    |
| `CLAUDE.md` (root)                                                              | Audit pass — confirm wedge V1 framing is current: 7-tab nav (Home·Project·Process·Analyze·Investigation·Improve·Report), 3-stage Project (Charter→Approach→Sustainment), project-membership ACLs, single SKU. Keep "wedge" in workflow/feedback sections (developer-facing).                     |
| `docs/llms.txt`                                                                 | Agent entry-point map reflects V1 anatomy: 3-stage Project, 7-tab nav, project-membership ACLs, single SKU. Preserve existing structure; surgically update.                                                                                                                                      |

### Drift fixes

- `docs/OVERVIEW.md:73,75` — `€99` → `€120`. Scrub "wedge" if customer-facing.
- `docs/USER-JOURNEYS.md` — verify "wedge" usage; scrub if customer-facing.
- `docs/07-decisions/adr-082-wedge-architecture.md` — body `€99` → `€120` (lines 9, 37, 67, 69, 70, 71, 117, 136). Preserve §5.4 migration math as historical context (existing-customer transitions: €79 → €120 / €199 → €120). ADR title stays.
- `docs/superpowers/specs/2026-05-16-wedge-architecture-design.md` — rewrite body `€99` → `€120` below the existing amendment marker; tighten the marker into a footer date-stamp.
- `apps/azure/CLAUDE.md:16,18,37` — drop "Team tier", retired `isPaidTier()` reference, verify ADR-043 supersession status.
- `packages/core/CLAUDE.md:42` — clarify that `tier: 'team'` in tool registry is internal prompt-cache phasing, NOT customer-facing tier.

### Phase C plan artifact

New file: `docs/superpowers/plans/2026-05-17-phase-c-doc-audit.md`

Contents:

- Triage buckets (KEEP / AMEND / ARCHIVE / DELETE) with `feedback_consolidation_replace_not_umbrella` "archive over delete" preference
- 8 stale-pattern detection vectors:
  - Multi-tier pricing strings (`€79`, `€199`, "Standard plan", "Team tier", "paid tier", "free tier")
  - Retired symbols (`isPaidTier`, `hasTeamFeatures`, `useTier`, `LicenseTier`, `MarketplacePlan`, `BRANDING_COLORS`, `configureTier`, `configurePlan`)
  - SharePoint references (`SharePoint`, `usePublishReport`, `useShareReport`, `Sites.Read.All`, ADR-026, ADR-030)
  - Teams SDK references (`useTeamsCamera`, "Teams app", "Teams entry")
  - 4-persona model (`personaRole`, "4 personas", "four personas")
  - 6-tab nav (pre-amendment label names "Frame", "Analysis", "Projects" plural)
  - Handoff stage (`Handoff` as stage, `showHandoff`, "4 stages")
  - "Wedge" in customer-facing docs (per Section 1 vocabulary decision)
- Audit method: parallel Explore agents per pattern (8 dispatches)
- Apply method: 3 sequenced PRs by bucket (AMEND → ARCHIVE → DELETE; no PR needed for KEEP)
- Doc directories in scope + out-of-scope
- Timing: execute after V1 customer validation per wedge spec §8 precondition #3
- Estimated effort: ~5 days total across all three apply PRs

## Anti-scope

- Code changes (this is docs-only)
- AdminKnowledgeSetup.tsx SharePoint docstrings — post-V1 feature code (KB UI is named-future)
- Code-comment ADR drift (`useEditorDataFlow.ts`, `useAIOrchestration.ts`) — folds into Phase C
- Restructuring `docs/` hierarchy — none needed
- Renaming the wedge spec file itself or ADR-082 — historical artifacts
- Survey-rule `'handoff'` alias cleanup (separate investigation entry)
- Canvas.test.tsx worker hang (pre-existing test infra)
- Marketplace Partner Center publish action (V1 launch operations)

## Data flow / cross-references

After this PR:

- Pricing claims flow: ADR-082 (source of truth) → all other docs reference rather than restate
- Architecture invariants flow: wedge architecture spec (current, with amendment marker) + ADR-082 → OVERVIEW + DATA-FLOW reference both
- Vocabulary flow: positioning.md + business-bible.md establish "VariScout / VariScout Process" naming; all other anchors use those terms
- Doc-graph integrity: every customer-facing anchor's cross-refs point to live docs (Phase A includes a `pnpm docs:check` pass)

## Error handling / edge cases

- **What if "wedge" usage exists in `docs/OVERVIEW.md` after the WV1-1 rewrite?** Scrub during the OVERVIEW drift fix. The brainstorm Section 1 listed OVERVIEW + USER-JOURNEYS as "verify" — implementer reads both first.
- **What if `tier: 'team'` field in `packages/core/src/ai/prompts/coScout/tools/registry.ts` is actually dead code?** Phase A scope is doc clarification only. If the field is dead, log as a Phase C finding (a code cleanup) and update the CLAUDE.md comment to reflect current behavior, not future behavior.
- **What if ADR-043 is genuinely superseded?** Remove the line from `apps/azure/CLAUDE.md`. If unclear, leave the line and log a Phase C investigation.
- **What if anchor rewrites need strategic content beyond the wedge spec's substance?** Implementer escalates to Opus for that anchor; brainstorming the missing strategy is out of scope for THIS PR (separate session).

## Testing / verification

```bash
# In the worktree
cd /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-phase-a-doc-cleanup

# 1. Zero "wedge" word in customer-facing anchors
grep -in "\bwedge\b" docs/OVERVIEW.md docs/USER-JOURNEYS.md docs/01-vision/positioning.md docs/01-vision/business-bible.md docs/08-products/membership-philosophy.md docs/roadmap.md docs/llms.txt README.md 2>/dev/null
# Expect: zero hits

# 2. Zero €99/€79/€199 as current-truth claims
grep -rn "€99\|€79\|€199" docs/ README.md apps/azure/.env.example 2>/dev/null | grep -v "superseded\|migration\|historical\|§5.4\|§8.1\|§9\."
# Expect: zero hits

# 3. Zero retired-symbol references in CLAUDE.md files
grep -rn "isPaidTier\|hasTeamFeatures\|Team tier\|Standard tier\|tier-gating" packages/*/CLAUDE.md apps/*/CLAUDE.md CLAUDE.md 2>/dev/null
# Expect: zero hits (or only explicitly-historical retired references)

# 4. Phase A anchors mention V1 vocabulary
grep -l "VariScout\|single SKU\|€120\|7-tab\|three stages\|project-membership" docs/DATA-FLOW.md docs/01-vision/positioning.md docs/01-vision/business-bible.md docs/08-products/membership-philosophy.md docs/roadmap.md docs/llms.txt 2>/dev/null

# 5. tier-philosophy.md renamed
ls docs/08-products/membership-philosophy.md 2>/dev/null && ls docs/08-products/tier-philosophy.md 2>&1 | head -1

# 6. Phase C plan artifact exists
ls docs/superpowers/plans/2026-05-17-phase-c-doc-audit.md 2>/dev/null

# 7. Docs health checks
pnpm docs:check 2>&1 | tail -5
# Expect: docs validated, no broken refs, frontmatter clean

# 8. Diff stat
git log --oneline main..HEAD
git diff main..HEAD --stat | tail -3
# Expect: ~12-14 files
```

## Success criteria

After PR 1 (Phase A) merges:

1. Every Phase A anchor doc is rewritten or audited per the table above
2. No `€99` / `€79` / `€199` claims as current truth anywhere in customer-facing docs
3. No "wedge" word in customer-facing anchors (OVERVIEW, USER-JOURNEYS, positioning, business-bible, membership-philosophy, roadmap, llms.txt, README)
4. `tier-philosophy.md` renamed to `membership-philosophy.md` with rewritten content
5. Phase C plan artifact exists at `docs/superpowers/plans/2026-05-17-phase-c-doc-audit.md`
6. `pnpm docs:check` green

After PRs 2-4 (Phase C AMEND → ARCHIVE → DELETE) merge:

7. The triage table in the Phase C plan is fully applied: every flagged doc is amended, archived, or deleted
8. `grep`-based zero-reference sweeps for all 8 stale-pattern categories return only acceptable hits (historical context in superseded sections)
9. `docs/archive/` contains all superseded docs with supersession headers pointing to current truth
10. The wedge spec §13 commitment is fully closed (both Phase A "anchor docs updated" and Phase C "holistic ~500-doc cleanup")

## Implementation handoff

This design produces **four PRs**, each promoted via `superpowers:writing-plans` and executed via `superpowers:subagent-driven-development`.

- **PR 1 (Phase A)**: see [`2026-05-17-pr-1-wedge-phase-a-doc-completion.md`](../plans/2026-05-17-pr-1-wedge-phase-a-doc-completion.md) — one Sonnet implementer dispatch with internal Architect → Migration → Validator phases + per-anchor commits. Escalate to Opus for any single anchor stalling on content (e.g., business-bible needing strategic framing). Opus final-branch review.
- **PR 2 (Phase C AMEND)**: parallel Explore audit produces the triage table; one Sonnet implementer dispatch executes the AMEND-bucket surgical edits. Mostly find-and-replace; small judgment density. Opus final-branch review.
- **PR 3 (Phase C ARCHIVE)**: Sonnet implementer moves superseded docs to `docs/archive/` with supersession headers. Mechanical work. Sonnet final-branch review acceptable (low complexity).
- **PR 4 (Phase C DELETE)**: Sonnet implementer `git rm`s flagged-for-deletion docs. Smallest PR. Sonnet final-branch review acceptable.

Each PR follows wedge convention: subagent-driven-development with two-stage review per task, then final-branch review before squash-merge.
