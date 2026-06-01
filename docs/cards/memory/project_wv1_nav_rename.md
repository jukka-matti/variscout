---
title: 'wv1-nav-rename'
description: '2026-05-27 Wedge V1 vocabulary rename — Investigation→Analyze, Analyze→Explore, Sustainment→Control — shipped via PR'
purpose: remember
tier: card
status: active
date: 2026-05-28
topic: [memory, project]
related: []
verified-against-commit: ca45f469
last-verified: 2026-05-28
source-hash: 54a27b5d24c18faa
origin-session-id: 99006d69-683b-44e8-a807-7a81fd9d2a53
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_wv1_nav_rename.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

PR #218 (`feat/wedge-v1-nav-vocabulary-rename`) merged via `--merge --delete-branch` on 2026-05-27. 24 commits on main as individual ancestors; merge commit is `5ec06448`.

## Canonical mapping

| Old (pre-2026-05-27) | New (canonical now) | Surface |
| --- | --- | --- |
| `Investigation` (tab) | `Analyze` | The deep statistical work tab (was the Wall + Hypothesis Map) |
| `Analyze` (EDA tab) | `Explore` | The exploratory data analysis tab (chart dashboards, lens picker) |
| `Sustainment` (stage) | `Control` | Third stage of the IP detail flow |

**New 7-tab nav:** `Home · Project · Process · Explore · Analyze · Improve · Report`
**New 3-stage flow:** `Charter → Approach → Control`

## Why this is non-trivial to read in the codebase

The "Analyze" name went TWO directions: old Investigation tab BECAME the new Analyze; old Analyze tab BECAME Explore. Any code/doc/grep that says `Analyze` post-rename refers to the NEW Analyze (formerly Investigation), NOT the EDA tab — that's `Explore` now. Reading old design docs in `docs/archive/` requires translating both directions.

## Implementation shape

3 implementer dispatches across the PR per `feedback_atomic_sweep_one_dispatch` + cleanup loops:

1. **Initial atomic sweep** (13 commits, `f547bfb6`..`dec4a99f`) — per-package per-category commits: core types → stores → hooks → ui → azure → pwa → e2e+data → Analyze (EDA)→Explore inline → Sustainment core+IDB → Sustainment UI/apps → docs+ADRs → architecture-generated regen → exhaustive cleanup.
2. **Cleanup sweep** (9 commits, `94da8a95`..`baa66430`) — addressing spec/code-quality reviewer findings: i18n keys/values across 32 locales, glossary terms, AGENTS.md mirror, AppHeader comments, ProcessHub field cascade (`investigations`/`investigation` → `analyzes`/`analyze`), interface name cleanup (`SustainmentMetadataProjection`→`ControlMetadataProjection`, `InvestigationStoreState`→`AnalyzeStoreState`, hooks barrel renames), Spec 2 prose + nested CLAUDE.md + e2e comments, CoScout deferral, final user-visible Sustainment string sweep.
3. **Closing sweep** (1 commit, `e66f0078`) — addressing final reviewer findings: 9 user-visible "Investigation" strings (button labels "+ New investigation", "Escalated investigation ID", aria-labels, helper text) + matching test assertions; full sweep of canonical doc prose (`ia-nav-model.md` Mermaid + tab descriptions + persona ACL table; OVERVIEW/USER-JOURNEYS/DATA-FLOW stage names; persona docs lead/sponsor/member full rewrites; 02-journeys/index + 03-features/index workflow table titles); localStorage keys `variscout-investigation-left-width`→`variscout-analyze-left-width`; investigations.md tracking entry for `investigationId` FK deferral.

## IndexedDB schema bumps (no migration callbacks)

- Azure schema v12 → v13: tables `sustainmentRecords`/`sustainmentReviews`/`controlHandoffs` use new names; earlier version() statements rewritten in-place. Existing local v12 rows orphan on next open — accepted per `feedback_wedge_v1_no_migration_no_backcompat`.
- PWA schema v5 → v6: same pattern.

Schema files at `apps/azure/src/db/schema.ts` + `apps/pwa/src/db/schema.ts` have inline rationale comments documenting the no-`.upgrade()` decision.

## Preserved identifiers (intentionally NOT renamed)

Documented in commit bodies + investigations.md. Future sessions should NOT "fix" these as if they're stale:

- **Statistical domain types**: `AnalysisMode`, `AnalysisBrief`, `AnalysisStats`, `AnalysisModeStrategy`, `AnalysisLensTab` — these refer to statistical analysis, not the Analyze tab name
- **Chart-mode discriminator**: `DashboardTab = 'analysis' | 'performance' | 'yamazumi'`
- **Report section identifier**: `ReportView workspace = 'analysis' | 'findings' | 'improvement'`
- **ADR-074 timing concepts**: `EntityKind | 'investigation'`, `RouterPhase | 'investigation'`, `CpkTargetSource | 'investigation'`, `investigation-time` / `investigationTime` — these refer to investigation-time as a TEMPORAL concept (when the user is in the investigation phase), distinct from the renamed tab
- **Lens key**: `ProcessStateLens | 'sustainment'`
- **AI context bag**: `AIContext.investigation` (transient field)
- **Surface brand**: "Investigation Wall" — preserved as a methodology brand name (a Wall used FOR investigation, semantically distinct from the Analyze tab)
- **ReportType union**: `'investigation-report'`
- **Directory**: `docs/03-features/analysis/` — refers to statistical analysis methodology
- **Filename**: `Dashboard.tsx` — not just the EDA-tab body; refers to the dashboard view chrome
- **Persisted blob fields**: `ProjectMetadata.sustainment`, `ProcessHubAnalyzeMetadata.sustainment` — persisted blob shape stability
- **Workspace key**: `'sustainment'` in `panelsStore.activeView` + matching emitters — pre-existing convention

## Deferred (tracked in `docs/ephemeral/investigations.md`)

1. **CoScout AI prompt vocabulary alignment** — ~150 occurrences across `packages/core/src/ai/prompts/coScout/legacy.ts`, `analyze.ts`, `buildAIContext.ts`. The semantic distinction (tab name vs "investigation" as a methodology process) needs a design call. Each file has a top-comment annotation referencing the investigations.md entry. PR-deferral, not a bug.
2. **`investigationId` foreign-key field rename** — `ControlRecord.investigationId`, `ControlHandoff.investigationId`, `ImprovementProjectMetadata.investigationId` preserved as field names. Renaming cascades 130+ files (~50 components + ~30 tests + persistence + serializers) with NO observable behavior change — fields are stable IDs. Design debt: either accept indefinitely (entity-name evolves but FK token stays stable), or ship a separate atomic-sweep PR. Pre-V2/Process-tier design call.

## What this affects in earlier memory entries

Many memory files reference the old names. They are NOT proactively edited; future sessions can re-grep current state to find the new vocabulary. If a memory entry says "Investigation tab" / "Sustainment stage" / "Analyze (EDA)" in a section pre-dating 2026-05-27, translate via the table above. The two most-load-bearing memory entries — [[wedge-v1]] and [[canvas-connection-journey]] — have been amended explicitly.

## Reading old docs

`docs/archive/`, `docs/cards/`, `docs/decision-log.md`, and `docs/ephemeral/` carry historical references using OLD names. These are append-only / historical surfaces; no in-place rename. When citing them, the old name is fine for archaeology but should be re-stated in NEW vocabulary for forward references.

Related: [[wedge-v1]] (canonical anatomy), [[canvas-connection-journey]] (Spec 2 implementation), [[feedback_atomic_sweep_one_dispatch]], [[feedback_atomic_sweep_cleanup_loops]] (this rename was the canonical example), [[feedback_wedge_v1_no_migration_no_backcompat]] (why no Dexie .upgrade() callbacks).
