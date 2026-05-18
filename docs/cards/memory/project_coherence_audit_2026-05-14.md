---
title: 'project-coherence-audit-2026-05-14'
description: 'Coherence audit (5 agents, 30+ docs) found foundation is locked but UI lags; Process Owner persona missing; RACI spec unmapped; 3 "spines" need reconciliation; Process Flow mode designed-not-built. Brainstorm series queued.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: 8a0d548d-3c45-481b-9b1b-61670c23b480
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_coherence_audit_2026-05-14.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

# VariScout Coherence Audit — 2026-05-14

**Trigger:** User reflection "we have nice pieces, but they are not holistically yet here." Triggered 5-agent audit (vision intent / shipped reality / open tensions / persona reality / doc inventory + archaeology) over `~/.claude/plans/lets-reflect-on-what-calm-music.md`.

**Status 2026-05-14:** Sessions A (persona model) + B (surface model + vocabulary) brainstormed and locked. Coherence spec **draft** written at `docs/superpowers/specs/2026-05-14-variscout-coherence-design.md` (status: draft). Session C (pedagogy + first 60s + visual identity + persona-name finalization) pending — when complete, spec moves to `status: accepted`.

## Headline finding

**Foundation is locked + coherent; UI layer drifts.** Constitution + Methodology + EDA Mental Model + Glossary form a coherent whole. `feedback_drop_methodology_bridges` is explicitly applied at foundation level. 30 canonical terms locked, 10-15 retired terms documented, 2 ESLint rules enforce critical ones. **The coherence problem is entirely in the propagation layer — UI vocabulary, persona awareness, and journey wiring lag behind the locked foundation.**

## Positioning (Constitution-locked, easy to mis-summarize)

VariScout is **Exploratory Data Analysis (EDA) for process improvement** — different category from statistical verification tools (Minitab, JMP). Asks "where should I focus?" not "is this significant?". Methodology lineage: Shewhart → Tukey → Juran → Watson → **Turtiainen 2019** (founder's LUT thesis) → VariScout. NOT "Watson 2019" — Watson is upstream within Turtiainen 2019.

## Visual identity locks (Session C)

- **Light-mode only.** Dark mode retired (Session C 2026-05-14). Audience reality: quality professionals heavily light-mode; reports + exports universally light; simplification benefits design + maintenance. Migration: 1-2 small cleanup PRs.
- **Two color systems coexist, never confused:** chart canvas uses `chartColors` Minitab-familiar semantics (red=out-of-spec, cyan=control limits, orange=spec lines, green=in-spec, blue=mean); UI chrome uses indigo accent + warm-off-white surface (chart-palette-neutral).
- **Energy:** "calm confidence" — clarity / trust / focus. Reference aesthetic: Linear / Stripe Dashboard / iA Writer / Cron Calendar. NOT Tableau (frenetic), Minitab (intimidating), Slack (playful).
- **Foundation locked (don't reopen):** Fluent 2 alignment (ADR-017); typography scale + system fonts (`docs/06-design-system/foundations/typography.md`); shadcn semantic color tokens; tw-animate-css.
- **7 new UI patterns** defined in coherence spec §11: primary-attention card (thin indigo accent strip, soft elevation), Linear-style segmented control, pill-toggle chips, filter chip with dismiss, IP-context indicator chip, floating inline banner, lifecycle-aware sections, refined header utility row. Plus mode toggle pattern (State/Edit on Process tab; Overview/Sections on IP detail).

## Path A surface model (Session C revision, spec §4)

**6-tab top nav (not 5):** `[Home] [Process] [Analyze] [Investigation] [Improvement] [Report]`. Each tab does ONE job (Linear test passes).

- **Home**: Linear-style ONE primary item + "Also waiting · N" collapsed (persona-adaptive)
- **Process**: state monitoring + structure editing (State / Edit mode toggle); decisions queue primary attention; reference badges to IPs/actions (no card duplication)
- **Analyze**: EDA workspace; filter chips replace breadcrumb; Factor Intelligence first-class; chart interactions (click/brush/right-click/⌘-click)
- **Investigation**: 2 view projections (Hypotheses + Factors) + Questions as cross-cutting filter
- **Improvement**: IPs lifecycle (single home for IP cards + detail)
- **Report**: exports

**Two distinct entry actions** (header): `+ Add data` (process-scoped append; triggers match-summary + drift detection) vs `+ New analysis` (fresh investigation from paste). Distinct intents, not merged.

**Survey** = cross-cutting layer (methodology + data-lifecycle coaching) surfacing as inline hints across all tabs. 6 rule categories. Deterministic; all tiers including Free.

**CoScout** = separate layer (Azure paid AI coaching). Header invocation button + slide-in panel + inline "Ask CoScout" chips on artifacts. Survey ≠ CoScout — Survey is methodology rules (free); CoScout is conversational AI (paid).

**Post-paste drift-detection loop:** after `+ Add data`, drift runs automatically; hints surface on Home + Process + affected Hypotheses.

**Section numbering in spec:** §1-10 (foundation through plans) → §11 visual identity → §12 motion → §13 accessibility → §14 verification → §15 session C pending → §16 upstream spec integration matrix.

## Five fault lines (post-archaeology revision)

1. **Terminology drift in UI** — Frame tab vs Canvas (vision lock); SuspectedCause → Hypothesis incomplete; Mode vs Lens fuzzy; L2 overlay chips read as near-synonyms.
2. **ADR-074 boundary violations shipped** — AuthorL3View parallel-implements Frame; Wall overlay is badge-projection not "same data two views" dual-home.
3. **Journey discoverability gaps** — 9-item canvas clarity list in `docs/investigations.md`; 3 question entry points scope-carriage incomplete; B2 chrome-walk queued since 2026-04-29.
4. **Methodology narrative absent from UI** — foundation locked, copy missing.
5. **Persona × surface × tier matrix unmapped** — biggest gap surfaced by archaeology.

## Three persona-archaeology gaps (NEW dimension)

1. **Process Owner has no persona card.** RACI spec (`2026-04-25-engagement-profile-raci-design.md`, draft) names them as 5th engagement role with Control Plan responsibility. No `process-owner-*.md` file in `docs/02-journeys/personas/`. Field Fiona is closest but defined as viewer, not owner. **The Hub exists for this persona; the persona is undefined.**
2. **Tier mapping inconsistent.** 10 persona files don't state PWA/Pro/Team expectations explicitly.
3. **Hub-context absent in all 10 persona files.** They predate Process Hub specs (April 25+).

## Two journey-archaeology findings

4. **5 mode-specific USER-JOURNEYS docs carry load-bearing design patterns** to preserve: mode-transform pre-aggregation (Defect/Yamazumi/planned Process Flow), worst-first ranking, activity-type color consistency, three-level drill-down.
5. **Process Flow mode** designed 2026-04-07, *not yet coded*. Phase 1 planned. Theory of Constraints framing. Either ship or archive — currently half-shipped commitment.

## The "three spines" question

Investigation Spine (Apr 4) + Evidence Map Spine (Apr 5) + Canvas Viewport Architecture (May 13) all use "spine" framing. **ADR-074** says Evidence Map owns L3 factor network, Canvas owns the viewport — current canonical answer. Older "Evidence Map as analysis spine" language predates ADR-074. Supersession needs to be made explicit or framing reconciled. Tracked as Session B Q14b in the plan.

## Doc inventory (real scope)

- **56 active specs** (18 delivered / 8 active / 18 draft / 7 in-progress / 2 superseded / 3 other)
- **46 archived specs** (pre-Process-Hub era)
- **74 ADRs** (17 accepted / 13 stable / 1 superseded — no drafts; ADR-071 pending)
- **10 persona files** (`docs/02-journeys/personas/`)
- **6 user-journey docs** (`docs/USER-JOURNEYS*.md`)
- **8 industry use-case flows** + **14 scenario flows**
- **Four-Lenses + Two-Voices sub-vision clusters**

## Drift signals confirmed

1. `USER-JOURNEYS.md` last-reviewed 2026-04-24, predates Process Hub canonical moment.
2. 5 mode journey docs last-reviewed 2026-04-17, predate vision spec acceptance (May 3).
3. Persona files have no `last-reviewed` dates; predate Hub specs.
4. Retired terminology still surfaces in older docs (glossary is authoritative).
5. Canvas/data-flow specs (May 5-14) are anchor, not entrant.

## Next move

Brainstorm series via `superpowers:brainstorming`. Three sessions:
- **Session A — Persona × Surface × Tier matrix** (recommended starting point; includes Process Owner persona decision)
- **Session B — Vocabulary + IA + Journey spine** (Frame→Canvas rename, three-spines reconciliation, Mode/Lens lock)
- **Session C — Methodology narrative + pedagogy + empty states**

Output: `docs/superpowers/specs/2026-05-14-variscout-coherence-design.md`. Drives 10 downstream plans (P1-P10).

## Critical references

- **Coherence spec (this work's primary deliverable):** `docs/superpowers/specs/2026-05-14-variscout-coherence-design.md` (status: draft; Sessions A+B captured; Session C pending)
- Plan file: `~/.claude/plans/lets-reflect-on-what-calm-music.md` (approved 2026-05-14)
- RACI spec: `docs/superpowers/specs/2026-04-25-engagement-profile-raci-design.md` (draft, defines 5 roles + 6 identity anchors)
- Vision: `docs/superpowers/specs/2026-05-03-variscout-vision-design.md` (accepted)
- ADR-074: surface boundary policy (Evidence Map vs Canvas reconciliation)
- ADR-071: pending; supersedes ADR-015's "no PM features" stance

## Related memories

- [[feedback_step_back_for_system_design]] — this moment
- [[feedback_full_vision_spec]] — spec the whole thing
- [[feedback_drop_methodology_bridges]] — already applied at foundation; needs UI propagation
- [[feedback_process_owner_reality_chain]] — Olivia/Process Owner cadence is real
- [[project_variscout_vision]] — locked vision
- [[project_response_path_system_v1]] — RPS V1 shipped
- [[project_canvas_viewport_8f]] — 8f shipped + followups complete
