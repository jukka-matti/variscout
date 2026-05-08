---
title: VariScout — Roadmap (lightweight, post-canvas-migration)
audience: [product, engineer, designer]
category: living-index
status: living
last-reviewed: 2026-05-08
related:
  - docs/decision-log.md
  - docs/investigations.md
  - docs/superpowers/specs/2026-05-03-variscout-vision-design.md
  - docs/superpowers/specs/2026-05-06-data-flow-foundation-design.md
  - docs/superpowers/plans/2026-05-07-canvas-pr8-vision-alignment-master.md
---

# VariScout — Roadmap

> **Lightweight working roadmap.** Updated post-merge; revised when sequencing changes. Decision-log captures the _why_ of prioritization decisions; this doc captures the _current sequence_. Heavyweight horizon planning (H0/H1/H2/H3) lives in vision spec §6+; this doc is the operational view.

## 1. Just shipped (the closed chapter)

**Canvas migration: COMPLETE 2026-05-08.** PR1–PR9 + Polish v1 sequence merged over ~3 weeks (PRs #119–#143). Strangler facade fully replaced legacy `LayeredProcessView` / `ProcessMapBase` / `FrameView`; Canvas is the only canvas-shaped surface in the codebase.

**Data-Flow Foundation F-series: 6 of 7 SHIPPED 2026-05-06/07** (PRs #130–#136). F1+F2+F3+F3.5+F3.6-β+F4 land the entire foundation: type-level normalization, repository pattern, normalized PWA persistence, ingestion action layer, Azure provenance parity with cross-device fidelity (envelope facet + ETag concurrency), three-layer state codification (Document / Annotation / View). F5 + F6 named-future.

**PR8 Vision Alignment SHIPPED 2026-05-08** (PRs #137/#138/#140/#141). 5 of 6 unmet vision-spec commitments closed: response-path CTAs (8a), drift indicator + time-series mini-chart (8b), hypothesis-arrow drawing (8d), Wall mirror in canvas overlay (8e). 6th commitment (vision §5.4 levels-as-pan/zoom) tracked separately as 8f.

**Canvas Polish v1 SHIPPED 2026-05-08** (PR #143). Drift producer-side stamping + histogram binning + z-stack docs + selection audit; closed 4 `investigations.md` entries.

## 2. In flight

(none currently — the working tree is clean; pick from §3 below for the next session)

## 3. Next workstreams (sequenced)

The recommended sequence; each item is a separate fresh-session brainstorm + plan + implementation cycle per `feedback_subagent_driven_default`.

| #   | Workstream                                                                                                                                                                         | Size                                        | Pull                                                                                                      | Depends on                            |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| 1   | **Charter authoring V1** — DMAIC Define-phase Charter as free-tier-active hub-domain feature                                                                                       | M (2-3 sessions)                            | Highest user-visible; LSSGB pedagogy + trainer scenario distribution + consultant pre-engagement drafting | None                                  |
| 2   | **F5 — `SUSTAINMENT_*` / `HANDOFF_*` HubAction kinds + sustainment editor migration**                                                                                              | S-M (1-2 sessions)                          | Foundation; unblocks Sustainment V1 + Handoff V1; closes ADR-078 D2 dispatch boundary                     | None                                  |
| 3   | **Sustainment workflow V1**                                                                                                                                                        | M (2 sessions)                              | Closes 8a carry-forward; needs `hasIntervention` signal definition                                        | F5 + signal-definition brainstorm     |
| 4   | **Handoff workflow V1**                                                                                                                                                            | M (1-2 sessions)                            | Closes 8a carry-forward; needs `sustainmentConfirmed` signal definition                                   | Sustainment V1 + signal brainstorm    |
| 5   | **Canvas-filter writers + E2E** (slice 4 P3.6 / P4.2 / P4.3)                                                                                                                       | S (1 session)                               | Closes slice-4 partial integration; small mechanical PR                                                   | None                                  |
| 6   | **Small canvas-UX polish bundle** (Stats-bar specs link, Cpk badge in Measurements I-Chart, parallel spec sources audit, per-app feature-store overlap with `usePreferencesStore`) | S (1 session)                               | Closes 4-5 small `investigations.md` entries                                                              | None                                  |
| 7   | **8f — canvas viewport architecture spec + ADR-080 (levels-as-pan/zoom)**                                                                                                          | L (multi-session brainstorm; multi-PR impl) | Vision §5.4 commitment; competitive moat for canvas products (Figma/Miro/tldraw all chose deliberately)   | Architectural design conversation     |
| 8   | **Security hardening implementation** (concept doc landed 2026-05-06 at `19e2e5a4`)                                                                                                | L (multi-PR rollout)                        | Paid-tier customer trust; auth + access control + SAS scope reduction                                     | Concept → spec brainstorm             |
| 9   | **F6 — multi-investigation lifecycle** (named-future)                                                                                                                              | L+ (own brainstorm + design spec)           | Foundation when multi-investigation usage emerges in Azure                                                | F5 + investigation-loading brainstorm |

## 4. Carry-forward backlog

Items not yet in the next-9 above; promoted when their pull strengthens or their dependencies clear.

**Open `docs/investigations.md` entries** (active, post-Polish-v1):

- `'general-unassigned'` sentinel as `investigationId` placeholder in test fixtures (small audit; bundle into #6)
- `wallLayoutStore.selection` Set/JSON Dexie round-trip — flagged by PR8-8e (status: clarified by Polish v1 selection audit; verify resolution)
- P2.5 deferral: per-step mini-Pareto chips on Operations band — partially met by `useStepDefectPareto` + `StepDefectIndicator` shipping; Operations-band slot wiring is the natural next step (bundle with #5)
- Producer-side `EvidenceSnapshot.stepCapabilities` stamping — RESOLVED 2026-05-08 via Polish v1
- CanvasStepMiniChart histogram binning — RESOLVED 2026-05-08 via Polish v1
- Canvas hypothesis-arrows obscured under Wall overlay — Spec 4 ext §6 amended via Polish v1; verify documentation lock

**Carry-forwards from 8a (DMAIC vocabulary completion)** — covered by #1 + #3 + #4 above plus:

- Team-collaboration features inside Charter / Sustainment / Handoff surfaces (signoff, audit trail, alerts, RACI, change notifications) — tier-gated layer; lands inside each surface's component, NOT at entry CTA per `feedback_tier_gate_inside_surface`. Promotes when paid-tier customer asks accelerate OR when each V1 surface lands and the team-features tier-upgrade story becomes the conversion flow.

## 5. Open architectural questions (need design conversations before plan-writing)

These are NOT blockers for the next-9 but want explicit time at the right moment:

- **8f canvas viewport architecture (#7)** — `react-flow`-style transform vs hand-rolled SVG/CSS. Needs brainstorm + design spec + ADR-080. Cheap to defer until canvas pan/zoom friction is felt; expensive to wedge in mid-implementation. Reassess in 2-3 weeks based on actual canvas usage.
- **Security hardening (#8)** — concept doc at `docs/superpowers/specs/2026-05-07-security-hardening-design.md` (`status: draft`); needs spec brainstorm + ADR. Defers to "after F-series wraps" per its own commit message; F5/F6 wrap incomplete but F1-F4 closes the foundational track.
- **F5 timing — pre-Charter or post-Charter (#1 vs #2 ordering)** — Charter V1 doesn't depend on F5, so the user-visible-value heuristic favors Charter first. F5-first heuristic favors completing the foundation track before adding new feature surfaces. Pick based on `feedback_full_vision_spec` + `feedback_subagent_driven_default` momentum.
- **Audit-trail / GxP compliance** — explicitly parked per F3.6-β decision. Separate from `rowProvenance` (paste-time merge metadata, already shipped) and from security hardening (access control). Re-opens only when a regulated-industry customer ask materializes.

## 6. Heuristics for next-up selection

When the next-9 sequence becomes ambiguous (e.g., F5 vs Charter; #5 vs #6 polish bundles), pick by:

1. **User-visible value beats foundation** by default. Foundation that nobody can use is invisible value; foundation + completed feature is what users see (`feedback_full_vision_spec` + canvas-migration-vs-F-series interleaving precedent).
2. **Honor vision commitments verbatim** for world-class UX (`feedback_honor_vision_commitments`). When forks emerge, default to honoring; hedge only if implementation is genuinely infeasible at world-class quality.
3. **Verify methodology before gating** when a domain term enters the design (`feedback_verify_methodology_before_gating`). Web search the canonical sequence; cite sources in the spec.
4. **Tier-gate inside surfaces, not at entry CTAs** (`feedback_tier_gate_inside_surface`). Document authoring + structured workflows serve free-tier pedagogy + `.vrs` export use cases; team workflow = paid-tier inside the surface.
5. **Slice cap ~6-8 tasks per PR** (`feedback_slice_size_cap`). Larger workstreams split into multiple sequenced PRs off one branch.
6. **Brainstorm-first for design-heavy slices** (`superpowers:brainstorming`); straight-to-plan for mechanical slices covered by existing specs (e.g., F5 patterns derived from F-series).
7. **Subagent-driven default** for execution (`feedback_subagent_driven_default`); Sonnet workhorse + per-task spec/quality reviewers; Opus for final-branch review of larger sub-PRs.
8. **Customer asks accelerate items**, foundation work fills momentum gaps. The next-9 order is a default; concrete asks override.

## 7. How this doc is maintained

- **Updated post-merge** when an item ships (move from §3 to §1; advance §2 if next-up changes).
- **Revised weekly** during active sprints; **revisited monthly** during quieter cadence.
- **Decision-log captures the _why_** of prioritization changes (e.g., "Charter V1 jumped to #1 because LSSGB pilot starts 2026-06-15"). This doc captures the _what + when_.
- **Memory file `project_variscout_roadmap.md`** carries the current §3 + §4 state across fresh sessions.
- **Heavyweight horizon planning** lives in vision spec §6+ (H0/H1/H2/H3); this doc is the operational layer.

## 8. References

- Decision log: [`docs/decision-log.md`](decision-log.md)
- Investigations: [`docs/investigations.md`](investigations.md)
- Vision spec: [`docs/superpowers/specs/2026-05-03-variscout-vision-design.md`](superpowers/specs/2026-05-03-variscout-vision-design.md) (status: accepted)
- Data-Flow Foundation spec: [`docs/superpowers/specs/2026-05-06-data-flow-foundation-design.md`](superpowers/specs/2026-05-06-data-flow-foundation-design.md) (status: delivered for F1-F4; F5+F6 named-future)
- Canvas Migration spec: [`docs/superpowers/specs/2026-05-04-canvas-migration-design.md`](superpowers/specs/2026-05-04-canvas-migration-design.md) (PR1-PR9 SHIPPED)
- PR8 master plan: [`docs/superpowers/plans/2026-05-07-canvas-pr8-vision-alignment-master.md`](superpowers/plans/2026-05-07-canvas-pr8-vision-alignment-master.md) (CLOSED)
- Workflow rules: `feedback_full_vision_spec`, `feedback_honor_vision_commitments`, `feedback_verify_methodology_before_gating`, `feedback_tier_gate_inside_surface`, `feedback_slice_size_cap`, `feedback_subagent_driven_default`, `feedback_pwa_philosophy`
