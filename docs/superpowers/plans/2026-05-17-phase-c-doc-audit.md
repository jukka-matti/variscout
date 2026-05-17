---
title: 'Phase C — Holistic Doc Audit → Triage → Apply'
status: draft
last-reviewed: 2026-05-17
parent: docs/superpowers/specs/2026-05-17-wedge-phase-a-doc-completion-design.md
related:
  - docs/superpowers/specs/2026-05-16-wedge-architecture-design.md
  - docs/07-decisions/adr-082-wedge-architecture.md
  - docs/superpowers/plans/2026-05-17-pr-1-wedge-phase-a-doc-completion.md
---

# Phase C — Holistic Doc Audit → Triage → Apply

> **Status:** draft — sequenced after V1 customer validation per wedge spec §8
> precondition #3. Phase A (PR 1) closed the canonical-anchor commitment;
> Phase B (in-PR amendments) is the per-engineering-PR pattern; this is the
> Phase C ~500-doc holistic sweep.

## Why this plan exists

The V1 architecture spec ([wedge spec §13](../specs/2026-05-16-wedge-architecture-design.md))
committed to a three-phase doc cleanup pattern:

- **Phase A** (pre-engineering): rewrite the 7 canonical anchor docs so every
  downstream artifact inherits current V1 vocabulary. Closed by PR 1.
- **Phase B** (per-engineering-PR): each engineering PR amends the nearest
  affected docs in-PR. Closes drift as it surfaces.
- **Phase C** (post-validation): holistic ~500-doc audit + triage + apply
  sweep. This plan.

Phase C is sequenced **after V1 customer validation** because before that
checkpoint, the canonical anchor docs are still load-bearing for engineering
decisions, and the cost of bulk amend-archive-delete operations is higher
than the cost of carrying minor drift in non-anchor docs. Once V1 validates
(real revenue at €120 × N customers), the strategic direction is locked
enough that holistic cleanup buys long-term clarity without risking
mid-flight reversal.

## Triage buckets

Every doc in scope falls into exactly one bucket. Bucket determines which PR
handles it.

| Bucket      | Definition                                                                                                                                    | Handled by |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **KEEP**    | Doc is current-truth, accurate, no drift. No action needed.                                                                                   | No PR      |
| **AMEND**   | Doc is structurally sound but has stale references (price, nav, persona model, retired symbols). Surgical find-and-replace fixes it.          | PR 2       |
| **ARCHIVE** | Doc captured a pre-wedge or superseded design well, but is no longer current-truth. Move to `docs/archive/<topic>/` with supersession header. | PR 3       |
| **DELETE**  | Doc is duplicate, dead, or otherwise unrecoverable. `git rm` with reference cleanup.                                                          | PR 4       |

**Default bias toward ARCHIVE over DELETE** per
`feedback_consolidation_replace_not_umbrella` + `feedback_close_threads_to_done`.
Institutional knowledge is preserved in `docs/archive/`; users grep it when
they need to understand why a decision was made. Only DELETE for documented
duplicates or pure-noise files.

## Stale-pattern detection vectors

Each pattern category gets one parallel Explore agent in PR 2's audit phase.
The 8 categories capture every V1 drift vector identified so far. The audit
output is a single triage table embedded in this doc, replacing the TBD
section below.

| #   | Pattern                              | Detection grep                                                                                                              |
| --- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| 1   | Multi-tier pricing strings           | `€79\|€199\|Standard plan\|Team tier\|Team plan\|paid tier\|free tier\|2-tier\|two-tier\|three-tier\|tier ladder`           |
| 2   | Retired tier-gating symbols          | `isPaidTier\|hasTeamFeatures\|useTier\|LicenseTier\|MarketplacePlan\|BRANDING_COLORS\|configureTier\|configurePlan`         |
| 3   | SharePoint / OneDrive references     | `SharePoint\|usePublishReport\|useShareReport\|Sites\.Read\.All\|OneDrive` + ADRs 026 + 030                                 |
| 4   | Teams SDK references                 | `useTeamsCamera\|"Teams app"\|"Teams entry"\|Microsoft Teams`                                                               |
| 5   | 4-persona model                      | `personaRole\|"4 personas"\|"four personas"\|Process Owner.*persona\|Frontline.*persona`                                    |
| 6   | 6-tab nav (pre-2026-05-16 amendment) | `6 tabs\|six tabs\|"Frame" as tab\|"Analysis" as tab\|Projects (plural) as tab label`                                       |
| 7   | Handoff stage                        | `\bHandoff\b stage\|showHandoff\|"4 stages"\|"Charter . Approach . Improve . Sustainment" (OLD order: with Handoff at end)` |
| 8   | "Wedge" in customer-facing docs      | `\bwedge\b` filtered to non-dev-facing locations (per Phase A vocabulary decision)                                          |

## Audit method (PR 2 entry)

1. **Dispatch 8 parallel Explore agents**, one per stale-pattern category.
2. Each agent produces a triage table fragment:
   `file:line | matched pattern | bucket | proposed action | rationale`
3. **Aggregate** the 8 fragments into a single markdown table embedded in
   this plan doc (replacing the TBD placeholder in §"Triage table").
4. **User review** of the consolidated table — bucket overrides + escalations
   happen here. The user is the final triage authority because some calls
   ("ARCHIVE the design spec that captures the old vision" vs "AMEND it with
   a supersession header") have judgment density beyond pattern-matching.
5. **Lock the table** as the authoritative work list for PRs 3-5.

## Apply method (PRs 3-5)

- **PR 3 (AMEND)**: Sonnet implementer dispatches the surgical edits batch.
  Estimated ~100-200 files. Mostly find-and-replace at known line numbers
  from the triage table. Per-category commits inside one dispatch.
- **PR 4 (ARCHIVE)**: Sonnet implementer moves superseded docs to
  `docs/archive/<topic>/` with supersession headers pointing to current
  truth. Estimated ~50-100 files. Update inbound links to either remove or
  redirect to archive.
- **PR 5 (DELETE)**: Sonnet implementer `git rm`s flagged-for-deletion docs.
  Estimated ~10-30 files. Update inbound links (orphan check + cleanup).

KEEP-bucket docs need no PR — they pass the audit by being current.

## Doc directories in scope

- `docs/01-vision/`
- `docs/02-journeys/`
- `docs/03-features/`
- `docs/04-philosophy/`
- `docs/05-technical/`
- `docs/06-process/`
- `docs/07-decisions/` (live ADRs)
- `docs/08-products/`
- `docs/09-baseline/`
- `docs/superpowers/specs/` (pre-wedge specs may need supersession markers)
- `docs/superpowers/plans/` (delivered plans — keep; in-flight plans — review)
- `docs/archive/` (pre-existing archive; verify supersession markers accurate)
- Per-package `CLAUDE.md` files (`packages/*/CLAUDE.md`)
- Per-app `CLAUDE.md` files (`apps/*/CLAUDE.md`)
- Root `CLAUDE.md`, `AGENTS.md`, `README.md`
- `docs/llms.txt`

## Out of Phase C scope

- `node_modules/`, build outputs, generated docs
- `.git/`, `.worktrees/`
- Code (only docs + comments touched in Phase C — `.ts` / `.tsx` symbol renames
  belong to a separate engineering PR)
- `apps/pwa/.env.example` / `apps/azure/.env.example` (handled in PR-WV1-6)
- `docs/decision-log.md` historical entries (pre-2026-05-16 entries preserve
  vocabulary as written; only the 2026-05-16+ entries get amendments)

## Estimated effort

- **PR 2 (Audit + triage)**: ~1 day controller time (8 parallel Explore
  agents + user review of consolidated table).
- **PR 3 (AMEND ~100-200 files)**: ~1-2 days Sonnet implementer + Sonnet
  reviewer + Opus final-branch review.
- **PR 4 (ARCHIVE ~50-100 files)**: ~1 day Sonnet + final review.
- **PR 5 (DELETE ~10-30 files)**: ~½ day Sonnet + final review.

Total: ~3-5 days from audit kick-off to PR 5 merge.

## Triage table

**Audit completed 2026-05-17** via 8 parallel Explore agents. Raw aggregate: ~1800 hits across ~200 files (with overlap; many files have hits across multiple stale-pattern categories).

### Per-vector aggregate

| #   | Vector                                        | Raw hits | Files | KEEP | AMEND                                       | ARCHIVE                             | DELETE                                     |
| --- | --------------------------------------------- | -------- | ----- | ---- | ------------------------------------------- | ----------------------------------- | ------------------------------------------ |
| 1   | Multi-tier pricing (€79/€199/Standard/Team)   | 522      | 161   | 87   | ~186 in ~170 files                          | ~200 hits across ~22 files          | 0                                          |
| 2   | Retired tier-gating symbols (isPaidTier etc.) | 154      | 35    | ~110 | ~40 across ~12 files                        | 2 (already archived; no action)     | 0                                          |
| 3   | SharePoint / OneDrive / ADRs 026+030          | ~420     | ~90   | ~18  | ~200-250 across 30-40 files                 | 0 new (all 16 already in /archive/) | 0                                          |
| 4   | Teams SDK references                          | 75       | 34    | 27   | 7                                           | 0                                   | 1 section (architecture.md §12, ~77 lines) |
| 5   | 4-persona model                               | 105      | 20    | 85   | 4                                           | 1 (coherence design)                | 3 lines (legacy "10 personas")             |
| 6   | 6-tab nav + 4-stage Project                   | 20       | 10    | 13   | 5                                           | 0                                   | 0                                          |
| 7   | Handoff stage                                 | 438      | 45    | ~100 | ~30                                         | ~145 lines across ~13 files         | 0                                          |
| 8   | "Wedge" word in customer-facing docs          | 82       | 20    | 11   | 71 (mostly link-display + frontmatter tags) | 0                                   | 0                                          |

### ARCHIVE candidates (whole-file — needs explicit user approval)

These ~25-30 files should move to `docs/archive/<subfolder>/` with supersession headers pointing to current truth. Per `feedback_consolidation_replace_not_umbrella`: archive over delete.

**Pre-wedge specs (~20 files):**

- `docs/superpowers/specs/2026-05-14-variscout-coherence-design.md` (Sessions A/B/C — already marked SUPERSEDED in header; physical move)
- `docs/superpowers/specs/2026-05-09-response-path-system-v1-design.md` (5-path RPS; reduced to 3 by wedge)
- `docs/superpowers/plans/2026-05-09-response-path-system-v1.md` (5-path implementation)
- `docs/superpowers/plans/2026-05-14-projects-tab-foundation.md` (4-stage IP detail; amended by wedge to 3)
- `docs/superpowers/plans/2026-05-07-canvas-pr8-8a-mode-aware-ctas.md` (5-path CTA wiring)
- `docs/superpowers/specs/2026-05-08-improvement-project-v1-design.md` (already marked SUPERSEDED)
- `docs/superpowers/plans/2026-05-08-improvement-project-v1.md` (impl of superseded spec)
- `docs/superpowers/specs/2026-05-03-variscout-vision-design.md` (pre-wedge full vision)
- `docs/superpowers/specs/2026-04-29-consolidated-method-and-surface-overview-design.md`
- `docs/superpowers/specs/2026-05-04-canvas-migration-design.md`
- `docs/superpowers/plans/2026-05-06-data-flow-foundation-f1-f2.md`
- `docs/superpowers/plans/2026-05-06-data-flow-foundation-f1-f2-audit.md`
- `docs/superpowers/plans/2026-05-06-canvas-pr4c-pr6-followup.md`
- `docs/superpowers/plans/2026-04-27-actionable-current-process-state-panel-plan.md`
- `docs/superpowers/specs/2026-04-02-knowledge-tab-design.md` (KB deferred to Process)
- `docs/superpowers/specs/2026-03-30-holistic-evaluation-vqi.md`
- `docs/superpowers/specs/2026-03-24-adr049-evaluation-report.md`
- `docs/superpowers/specs/2026-03-17-documentation-methodology-upgrade-design.md`
- `docs/superpowers/specs/2026-03-24-coscout-knowledge-catalyst-design.md`
- `docs/superpowers/specs/2026-03-22-mobile-ux-improvements-design.md`
- `docs/superpowers/specs/2026-03-19-knowledge-base-folder-search-design.md`
- `docs/superpowers/specs/2026-03-17-teams-compliance-audit.md`
- `docs/superpowers/specs/2026-03-16-ai-integration-evaluation.md`
- `docs/superpowers/specs/2026-04-02-web-first-implementation-design.md`
- `docs/superpowers/specs/2026-04-02-web-first-deployment-architecture-design.md`
- `docs/superpowers/specs/2026-04-03-hmw-brainstorm-modal-design.md`
- `docs/superpowers/specs/2026-03-22-sharing-continuity-design.md`
- `docs/superpowers/specs/2026-03-22-teams-entry-experience-design.md`

**Pre-wedge ADRs (1 file, decision-history candidate):**

- `docs/07-decisions/adr-033-pricing-simplification.md` — superseded by ADR-082; move to `docs/archive/adrs/`

**Pre-wedge product docs (1 file):**

- `docs/08-products/azure/pricing-tiers.md` — entire two-tier pricing doc

**Pre-wedge technical architecture (1 file):**

- `docs/05-technical/architecture/tier-gating.md` — entire tier-gating API reference; obsolete post-wedge

### DELETE candidates (rare — section/line-level only)

- `docs/05-technical/architecture.md` lines 640–716 (Section 12 "Teams SDK Integration") — orphaned ~77-line spec describing OBO token exchange + Teams context detection, all removed by ADR-059
- `docs/superpowers/plans/2026-04-17-agent-docs-architecture-phase1-foundation.md` lines 1004, 1024, 1382 — legacy "10 personas" (education funnel artifact, not product UX)
- `docs/superpowers/specs/2026-04-17-agent-docs-architecture-design.md` lines 37, 100 — same "10 personas" legacy

### AMEND batches (PR 3 work) — organized by stale-pattern category

PR 3 implementer dispatches surgical edits across these 8 categories. Detailed file:line targets per category come from the 8 audit reports (preserved in session memory; implementer re-runs targeted greps to confirm).

| Batch                                                                                                        | Approx files | Stale pattern → current truth replacement |
| ------------------------------------------------------------------------------------------------------------ | ------------ | ----------------------------------------- |
| A — pricing strings (€79/€199 → €120, "Standard plan" → "single SKU")                                        | ~80-100      | Per audit 1                               |
| B — retired symbol refs (isPaidTier → canAccess / projectMembership)                                         | ~12-15       | Per audit 2                               |
| C — SharePoint refs (add "Deferred per ADR-060" markers for KB; ADR-004/ADR-023 citations for OneDrive sync) | ~30-40       | Per audit 3                               |
| D — Teams SDK refs (add retirement markers per ADR-059)                                                      | ~7           | Per audit 4                               |
| E — 4-persona model link adds (cite wedge spec §3.5; "Process only" disambiguators)                          | ~4           | Per audit 5                               |
| F — 6-tab nav → 7-tab + 3-stage Project clarifications                                                       | ~5           | Per audit 6                               |
| G — Handoff stage scope headers (Process docs clarification + wedge supersession notes on shipped specs)     | ~10          | Per audit 7                               |
| H — "Wedge" word → "V1" / "V1 pivot" + frontmatter tag removal                                               | ~20          | Per audit 8                               |

## Followups from this plan's audit findings

(TBD — to be populated as the audit completes. Likely candidates: code-level
tier-gating cleanup if PR 2 audit finds residual `tier: 'team'` consumers in
`packages/core/src/ai/prompts/coScout/tools/registry.ts`; ADR archival if
audit surfaces ADRs that should move from `docs/07-decisions/` to
`docs/archive/adrs/`.)

## Cross-reference

- [V1 architecture spec §13](../specs/2026-05-16-wedge-architecture-design.md)
  — The three-phase cleanup commitment.
- [ADR-082](../../07-decisions/adr-082-wedge-architecture.md) — Strategic
  decision driving the cleanup.
- [PR 1 plan (Phase A)](2026-05-17-pr-1-wedge-phase-a-doc-completion.md) —
  Predecessor plan; Phase A closed pre-Phase-C.
- [PR 1 spec (Phase A + C combined design)](../specs/2026-05-17-wedge-phase-a-doc-completion-design.md)
  — Spec that scoped both Phase A and Phase C as a coordinated sweep.
- `feedback_consolidation_replace_not_umbrella` — Bias toward replace/archive,
  not umbrella docs.
- `feedback_close_threads_to_done` — End-of-initiative: close
  `docs/investigations.md` entries via ship or decision, not deferral.
