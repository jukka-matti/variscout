---
title: 'project_analyze_wall_redesign'
description: 'Analyze Wall redesign — canvas-first investigation wall; spec §7 converged + master plan (9 PRs). Build state = gh pr list + the plan.'
purpose: remember
tier: card
status: active
date: 2026-06-08
topic: [memory, project]
related: []
verified-against-commit: 027927efe
last-verified: 2026-06-08
source-hash: 3252a5cd29cbafdd
origin-session-id: 4a29abda-db2c-4634-800b-6b00d8fa49fc
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_analyze_wall_redesign.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

# Analyze Wall redesign — SPEC §7 CONVERGED + MASTER PLAN 2026-06-08

Convergence session (visual-companion brainstorm, grounded against code + the founding **"Investigation on the River"** deck `~/Downloads/process_thinking.pptx`). Spec §7 rewritten as the chosen direction + master plan committed to main: `docs/superpowers/specs/2026-06-08-analyze-wall-redesign-design.md` (§7) + `docs/superpowers/plans/2026-06-08-analyze-wall-redesign-master-plan.md` (AW-1…AW-9 + AW-DOC, 5 phases). Builds on the shipped legibility surface ([[project_doc_followups]] context; L-1…L-5 PRs #328–#333). **Delivery state = `gh pr list` + the master plan, NOT memory.**

**The keystone reconciliation:** the founding deck says **"Not a Miro board"**; the owner now wants it to **"feel like Miro."** Resolved: **Miro's _feel_** (the canvas owns the screen — canvas-first real-estate, NOT aesthetics) + **VariScout's _rigor_** (typed nodes, semantic checkable connections, gates, CoScout-suggests-never-authors). Owner's own definition of "Miro-like" = **measured real-estate**: today the Wall is ~30–40% effective (box ~60–68% × content-fill ~55%); target ~85%+. New acceptance metric: **"% of viewport that is canvas."**

**Locked design decisions (the durable calls):**
- **Concept A via B** — one canvas, Focus/Frames later; the **Wall is the single Analyze home**. **Story Frames CUT** → Sponsor narrative is the **Report tab's** job (read-mostly, Summary mode, export — `report.md:25,56`); don't duplicate on the Wall.
- **The job:** turn suspected causes into disconfirmable claims → triangulate for/against → settle → hand a Supported cause + What-If to Improve. Explore (diverge) ⟷ Analyze (converge) + crossing-back.
- **Finding = connective tissue** (factor↔cause is Finding-mediated, canonical). **1 scope : N findings** (a pool); **loose findings first-class** (orphan lane) with next-moves (become a cause / support-counter / seed a drill / stay context). Supports-left / counter-right (counter loud). **Wire `Finding.scopeId` as a reader** (today write-only — the build gap).
- **Current scope + switcher, NOT a lineage trail** (owner call). Flat scopes / no-recursion **holds** (only the lineage _display_ demoted). Narrowing-narrative → Report.
- **Two-drawer model (IDE/Codex pattern):** **left = object detail/context** (Evidence/Comments/Activity — deterministic, no-AI home; absorbs the conclusions rail) · **right = CoScout** (Coach/Evidence/Actions — optional, Azure). Both collapse to slim handles (canvas-first). CoScout `[REF]` highlights the node; **content = CS-14** (this session only reserves the slot). Reconciles the river spec's "single narrator pane": team-presence→top-bar+left-drawer comments, coaching→right drawer.
- **3-state status** (Suspected/Supported/Ruled out) over stored-5 — compose `hypothesisStatusDisplay`, never "Verified".
- **Lenses = Wall + Causes; demote the Evidence Map** (default `viewMode 'map'→'wall'`; keep `EvidenceMapBase` for Report read-only + PWA mobile — don't delete). **CausalLink authoring → not-now/advanced** (already demoted "optional richer layer"). **Supersede ADR-066** (stale: "Map owns the center/default").
- **Gates (AND/OR/NOT, HOLDS N/M) are SHIPPED** (`GateNode`, `runAndCheck`, drag-compose) — render as a cryptic tiny diamond today → **make legible** (AW-3). VariScout-native; Miro can't.
- **L-4 readable-scale = verified real gap** (in-browser: ~0.55× + Fit no-op; two decoupled scaling layers + sparse bbox spans full canvas height). Fix = one scaling authority + tighten sparse bbox (AW-1).

**Build conventions:** per-PR grounding→sub-plan→subagent build→adversarial gate→`--merge`; one worktree per PR; PWA+Azure parity; **compose-don't-rebuild** the legibility surface; **CS-15 coordination** — `navigateToExploreForChip.ts` is a **shared handler** (Wall + Process-Canvas chips), edit **additively only + rebase after CS-15**; numeric-range predicate→filter handoff **deferred** (needs a `projectStore.filters` model change). Don't touch process-tab code (parallel Codex chain CS-P5→CS-15→CS-P3).

**PR #336 disposition:** cherry-pick `OverallProblemHeader` (AW-2) + categorical Explore handoff (AW-9); reframe `ScopeRail` lineage→switcher (AW-6); lineage metadata = optional (only `explore-drill` has a live writer). **Close #336** once header + handoff land.

**Demo-minimum = Phase 1 (AW-1 readable scale · AW-2 canvas-first chrome · AW-3 legible gates) + AW-4 (demote Map).** Method note: grounding repeatedly corrected priors (gates more-built than expected; `Finding.scopeId` write-only; Map's daily value redundant with the Wall band) — see [[feedback_subagent_grounding_catches_drift]].
