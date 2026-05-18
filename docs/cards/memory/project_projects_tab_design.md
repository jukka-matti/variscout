---
title: 'project-projects-tab-design'
description: 'Projects tab + IP detail (Lifecycle) page + Home active-IP launchpad locked 2026-05-14. 7-tab nav split (Improve verb + Projects noun); IP-context cascade; SuspectedCause-anchored Approach; Report Overview/Technical with QC-Story arc; reflection field addition. All 4 plans SHIPPED 2026-05-14/15 via PRs'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 1e0d99adfc4576f1
origin-session-id: 48ffadda-ce5c-4326-b6c8-8a9535b18cbb
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_projects_tab_design.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

# Projects tab + IP Detail design — 2026-05-14

**Spec:** `docs/superpowers/specs/2026-05-14-projects-tab-design.md` (status: draft, committed `2f4cff53`).
**Parent:** [[project_coherence_audit_2026-05-14]] — resolves §15 carry-forward "IP detail page details".

## Six locked decisions

1. **7-tab nav split** — `[Home] [Process] [Analyze] [Investigation] [Improve] [Projects] [Report]`. Coherence's original 6-tab Path A amended: split the single "Improvement" tab into legacy **Improve** (verb, PDCA workbench, current `ImprovementView`, zero migration) and new **Projects** (noun, IP lifecycle). Verb/noun split is deliberate; both serve different jobs.

2. **Home is the active-IP launchpad** — Project Lead picks the active IP at Home; choice cascades scope via IP-context chip (Coherence §11 pattern #5) to Process/Analyze/Investigation/Improve/Report tabs. Persona-specific: Process Owner doesn't pick (hub-level cadence); SME auto-scopes via accepted consult; Frontline lives in action cards. State per-Hub-per-user, `localStorage`-backed via new `useActiveIPStore` (Annotation-layer Zustand).

3. **IP detail (Lifecycle) page anatomy** — page header (back-link / status pill / IP title / goal summary / team avatars + Invite) + stage tabs (`Charter / Approach / Sustainment / Handoff`) + Overview/Sections segmented toggle (Coherence §11 pattern #2) + 280px right team rail.

4. **Approach stage is SuspectedCause-anchored** — per-cause hierarchy (`Hypothesis → ImprovementIdea → ActionItem`) as the visual unit. Sections mode = read-mode summary with per-cause "Open in Improve workbench" jump-out; actual PDCA authoring stays in legacy Improve tab to avoid duplication.

5. **Report tab IP-scoped with Overview/Technical audience toggle** — fractal pattern with IP detail's mode toggle (segmented control reused). Overview = 7-section QC-Story narrative arc, plain-English UI ("Where we started" / "What we aimed for" / "What we found + what we did" / "Did it work?" / "What we standardized + learned" / "What's next" + Executive summary); methodology lineage internal-only per RPS V1 D2 + `feedback_drop_methodology_bridges`. Technical = full analytical chart suite (capability before+after, I-Chart with intervention, factor R²adj Pareto, regression scatter, per-cause control charts). Free-roaming Report = Hub portfolio.

6. **Single data-model addition** — optional `ImprovementProject.reflection?: string` (top-level, sibling of `signoff`) for analyst lessons-learned narrative surfacing in Report Overview "What we standardized + learned". Backward-compatible, no `.vrs` format version bump, no new action kind needed (existing `IMPROVEMENT_PROJECT_UPDATE.patch` already accepts new optional fields).

## V1 vs V2 collaboration scope

**V1 (ships with this spec):** team roster with RACI chips + read-only activity feed (synthesized from existing audit fields) + signoff status card.

**V2 deferred (tier-gated when shipped):** threaded comments per section, @-mentions routing via 🔔 bell, signoff queue UI with multi-tier workflow, RACI per-section approval, change notifications via webhook. Render as visible-with-lock on free per `feedback_hidden_vs_disabled_cta`.

## Implementation plans — all SHIPPED 2026-05-14/15

All 4 sequential plans landed via PRs #172–#181:
1. **Plan 1: Projects tab + IP detail page** (foundation) — PRs #172–#176 (2026-05-14).
2. **Plan 2: Home active-IP launchpad + IP-context cascade** (spec §4 + §5) — PRs #177 + #178 (2026-05-15). Introduced `useActiveIPStore` (Annotation-layer Zustand) + IP-context chip in shared `@variscout/ui` header.
3. **Plan 3: Team workspace right rail V1** (spec §6.1 + §6.3) — PR #179 (2026-05-15).
4. **Plan 4: Report tab IP-scoped + QC-Story arc + charts** (spec §7) — PR #181 (2026-05-15).

Plan files live under `docs/superpowers/plans/2026-05-14-projects-tab-*.md`. For commit-level detail always check `gh pr list --search "projects-tab-pt"` / `git log` rather than this memory.

## What carries forward unresolved (this spec out-of-V1)

- Mobile responsive variants (Frontline mobile-first) — deferred
- Persona-specific Home variants for Pat/Dr. Chen/Fred (only Mira detailed here)
- V2 collaboration features (listed above)
- Improve tab redesign (kept as legacy)
- USER-JOURNEYS-*.md refresh

## Tab-naming collision (accepted)

"Projects" alone collides with `.vrs` "project file" semantics + `useProjectStore`. Considered "Improvement Projects" (unambiguous, longer) and "Initiatives" (clean but new vocabulary). Locked **"Projects"** for brevity + Linear-shape; collision handled in docs + support copy.

## Coherence amendments applied 2026-05-14

- §4 nav: 6 → 7 tabs (table updated with Improve + Projects rows)
- §4 amendment block notes the verb/noun split
- §15: "IP detail page details" marked resolved (strike-through + link)
- §16: new row in spec contributions matrix

## Related memories

- [[project_coherence_audit_2026-05-14]] — parent / resolves §15 carry-forward
- [[project_response_path_system_v1]] — RPS V1 shipped (IP entity definition, 6 sections, multi-level Goal)
- [[project_canvas_replaces_tabs]] — superseded by 7-tab Path A coherence lock
- [[feedback_drop_methodology_bridges]] — QC-Story heritage internal-only
- [[feedback_world_class_critique]] — verb/noun split defended on its merits after user pivoted
- [[feedback_check_shipped_patterns_first]] — confirmed RPS V1 supersession of 2026-05-08 spec
- [[feedback_no_backcompat_clean_architecture]] — `reflection` field added cleanly (optional, no shims)
