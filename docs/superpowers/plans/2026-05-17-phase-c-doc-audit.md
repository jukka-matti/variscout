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

TBD — populated by PR 2 audit dispatch. Format:

```
| file | line | pattern | bucket | proposed action | rationale |
| ---- | ---- | ------- | ------ | --------------- | --------- |
```

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
