---
title: VariScout — Roadmap (lightweight, post-canvas-migration)
audience: [product, engineer, designer]
category: living-index
status: living
last-reviewed: 2026-05-13
related:
  - docs/decision-log.md
  - docs/investigations.md
  - docs/superpowers/specs/2026-05-03-variscout-vision-design.md
  - docs/superpowers/specs/2026-05-06-data-flow-foundation-design.md
  - docs/superpowers/specs/2026-05-09-response-path-system-v1-design.md
  - docs/superpowers/plans/2026-05-09-response-path-system-v1.md
---

# VariScout — Roadmap

> **Lightweight working roadmap.** Updated post-merge; revised when sequencing changes. Decision-log captures the _why_ of prioritization decisions; this doc captures the _current sequence_. Heavyweight horizon planning (H0/H1/H2/H3) lives in vision spec §6+; this doc is the operational view.

## 1. Just shipped (the closed chapter)

**Canvas migration: COMPLETE 2026-05-08.** PR1–PR9 + Polish v1 sequence merged over ~3 weeks (PRs #119–#143). Strangler facade fully replaced legacy `LayeredProcessView` / `ProcessMapBase` / `FrameView`; Canvas is the only canvas-shaped surface in the codebase.

**Data-Flow Foundation F-series: 6 of 7 SHIPPED 2026-05-06/07** (PRs #130–#136). F1+F2+F3+F3.5+F3.6-β+F4 land the entire foundation: type-level normalization, repository pattern, normalized PWA persistence, ingestion action layer, Azure provenance parity with cross-device fidelity (envelope facet + ETag concurrency), three-layer state codification (Document / Annotation / View). F5 + F6 named-future. \_(F5 work — `SUSTAINMENT\__`/`CONTROL*HANDOFF*_` HubAction kinds — is now subsumed into RPS V1 PR-RPS-9 + PR-RPS-10.)\_

**PR8 Vision Alignment SHIPPED 2026-05-08** (PRs #137/#138/#140/#141). 5 of 6 unmet vision-spec commitments closed: response-path CTAs (8a), drift indicator + time-series mini-chart (8b), hypothesis-arrow drawing (8d), Wall mirror in canvas overlay (8e). 6th commitment (vision §5.4 levels-as-pan/zoom) tracked separately as 8f.

**Canvas Polish v1 SHIPPED 2026-05-08** (PR #143). Drift producer-side stamping + histogram binning + z-stack docs + selection audit; closed 4 `investigations.md` entries.

**RPS V1 PR-RPS-1 SHIPPED 2026-05-09** (PR #144, squash `2a6e3114`). Naming reconciliation (`SuspectedCause` → `Hypothesis` with 5-state `HypothesisStatus` + `themeTags?: string[]`) + Wall package re-home (`packages/charts/src/InvestigationWall/` → `packages/ui/src/components/InvestigationWall/`) + `TagChip` component + ADR-053/064 amendments + strict-assert pattern (no silent migration of legacy stored values per RPS V1 D15).

**RPS V1 PR-RPS-2 SHIPPED 2026-05-09** (PR #147, squash `45e25c9e`). Wall Detective-pack: 5th status `needs-disconfirmation` + confirm-gate Survey rule. Plan-grounding gap closed (added `Finding.evidenceType` + `Finding.refutes`); Survey module dual-API surface preserved (`evaluateSurvey` coexists with new `surveyWallRules`); `OneStepAwayBadge` UI replaces `openChecksLabel` text slot when needs-disconfirmation.

**RPS V1 PR-RPS-3 SHIPPED 2026-05-09** (PR #148, squash `d0ad3d48`). Wall Detective-pack: mini-charts inside HypothesisCard. 4 plan-vs-code reconciliations done in plan-mode (CARD_H grow 228→288, drop MiniScatter from V1, outcome via WallCanvas prop, theme color names). MiniIChart + MiniBoxplot rendered in `<ChartSlot>` at full LOD; deterministic dots fallback (n<7) via mulberry32+FNV-1a.

**RPS V1 PR-RPS-4 SHIPPED 2026-05-09** (PR #149, squash `f2d42fee`). Wall Detective-pack: brush-to-pin gesture + missing-evidence panel. 3 architectural refinements vs master plan (polymorphic gesture pattern: `useIChartBrush` + `useBoxplotSelect` unified by `ChartSelection` discriminated union; store-direct `addFinding` over FINDING_ADD HubAction; `MissingEvidencePanel` rule-driven supersedes empty `MissingEvidenceDigest`). E2E deferred via documented `test.skip` until investigation persistence lands.

**RPS V1 PR-RPS-5 SHIPPED 2026-05-10** (PR #150, squash `29ff5a87`). IP V1 engine: types (`@variscout/core/improvementProject`) + 3 HubAction kinds (CREATE/UPDATE/ARCHIVE) + PWA/Azure persistence (Azure Dexie v9→v10 clean break) + Document-layer `useImprovementProjectStore` + `.vrs` round-trip + D18 primitives (`useLiveProjection`, `computeSourceHash`, `shouldShowDrift`). Deep-merge contract locked in JSDoc; `HUB_PERSIST_SNAPSHOT` decomposes IP from hub blob within single Dexie transaction.

**RPS V1 PR-RPS-6 + PR-RPS-7 SHIPPED 2026-05-10** (PR #152, squash `bec29c78`, bundled). IP V1: 6-section UI + multi-level Goal + CollapsibleSection + per-app shells + canvas-card pickers + cross-surface badges. Stacking sub-PR #151 (`codex/pr-rps-6 → response-path-system-v1`, internal commit `94625cdc`) rolled into #152's `response-path-system-v1 → main` squash. PR-RPS-6 + PR-RPS-7 effectively shipped together.

**RPS V1 PR-RPS-8 SHIPPED 2026-05-10** (PR #153, squash `8234c757`). Quick Action surface (`LogActionModal` + `RecentActivityPanel`) + canvas-card "Quick Action" CTA wiring. Path 1 of 5 per spec D14 — orphan ActionItem (no new entity); dual flavor "Done now" / "Assign to" + due date.

**RPS V1 PR-RPS-9 SHIPPED 2026-05-13** (PR #154, squash `5f95e6fd`). Sustainment V1: `SUSTAINMENT_*` HubAction kinds + auto-fire on Improvement Project transition to Sustain + drift-detection survey rules + Inbox digest surface. Path 4 of 5 per spec D14; absorbs F5 sustainment work. ADR-080 (Sustainment auto-fire pattern reference) authored as named-future hook for downstream lifecycles.

**RPS V1 PR-RPS-10 SHIPPED 2026-05-13** (PR #155, squash `12e1257b`). Handoff V1: `CONTROL_HANDOFF_*` HubAction kinds + `HandoffForm` + per-app `HandoffPanel` + sponsor signoff (visible-with-lock for free; active for paid per D9) + full 8-station lifecycle E2E (`apps/azure/e2e/full-lifecycle.spec.ts`). Path 5 of 5 — **RPS V1 COMPLETE**.

**8f Canvas viewport architecture SHIPPED 2026-05-13** (PRs #156/#158/#160/#162/#164/#165). Vision §5.4 levels-as-pan/zoom is live: hub-keyed viewport state, d3 input, LOD switching, L1/L2/L3 renderers, mobile sequential picker, measured fit-to-content, URL deep links, L1 outcome panel, lens × level matrix, and ADR-074 boundary enforcement. Spec + plan promoted to `delivered`; see decision-log entry "8f canvas viewport SHIPPED".

## 2. In flight

**Coherence audit + design** (started 2026-05-14). Draft design spec at [`docs/superpowers/specs/2026-05-14-variscout-coherence-design.md`](superpowers/specs/2026-05-14-variscout-coherence-design.md) — Sessions A+B + partial C locked: 4 personas (Process Owner / Project Lead / SME / Frontline), Home-tab persona-adaptive shell, Map/Analyze toggle, Level×View×Focus model, L3 Investigation surface (Wall+EvidenceMap merged), IP Lifecycle page, IP-as-context navigation, Frame→Process rename, lens-picker retirement. Session C remaining: first-60s pedagogy + visual identity + Inbox hierarchy + accessibility. Promotes to a plan once Session C closes.

**8f canvas viewport — followup workstream** (2026-05-13 → 2026-05-14, complete). PR #166 (`cd936915`) closed 19/20 retro findings; PR #168 (`7c7dfd68`) bundled cleanup cluster closed all three carry-forward items (setState-in-render bug, LOW #19 brand `ProcessHubId`, LOW #16 Canvas 1135→845 partial decomposition) plus 16 pre-existing tsc errors. Workstream plan at [`docs/superpowers/plans/2026-05-13-canvas-viewport-8f-followups.md`](superpowers/plans/2026-05-13-canvas-viewport-8f-followups.md); deferred items logged in [`docs/investigations.md`](investigations.md) with pickup criteria. Decision-log entry "8f canvas viewport SHIPPED" amended with the 2026-05-14 closure block.

## 3. Next workstreams (sequenced)

**RPS V1 sequence: 10 of 10 SHIPPED 2026-05-09 → 2026-05-13.** Spec + plan promoted to `delivered` 2026-05-13. Subsumed F5 + IP V1 + Detective-pack tracks. Closing artifact: PRs #144 / #147 / #148 / #149 / #150 / #151 / #152 / #153 / #154 / #155 plus decision-log entry "RPS V1 SHIPPED — full lifecycle live 2026-05-13".

### Other workstreams (post-RPS-V1)

| #   | Workstream                                                                                                                                                                         | Size                              | Pull                                                                  | Depends on                       |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | --------------------------------------------------------------------- | -------------------------------- |
| 10  | **Canvas-filter writers + E2E** (slice 4 P3.6 / P4.2 / P4.3)                                                                                                                       | S (1 session)                     | Closes slice-4 partial integration; small mechanical PR               | None                             |
| 11  | **Small canvas-UX polish bundle** (Stats-bar specs link, Cpk badge in Measurements I-Chart, parallel spec sources audit, per-app feature-store overlap with `usePreferencesStore`) | S (1 session)                     | Closes 4-5 small `investigations.md` entries                          | None                             |
| 12  | ~~**8f — canvas viewport architecture (levels-as-pan/zoom)**~~                                                                                                                     | ~~L~~                             | Shipped 2026-05-13 via PRs #156/#158/#160/#162/#164/#165              | —                                |
| 13  | **Security hardening implementation** (concept doc landed 2026-05-06 at `19e2e5a4`)                                                                                                | L (multi-PR rollout)              | Paid-tier customer trust; auth + access control + SAS scope reduction | Concept → spec brainstorm        |
| 14  | **F6 — multi-investigation lifecycle** (named-future)                                                                                                                              | L+ (own brainstorm + design spec) | Foundation when multi-investigation usage emerges in Azure            | Investigation-loading brainstorm |

## 4. Carry-forward backlog

Items not in §3 above; promoted when their pull strengthens or their dependencies clear.

**Open `docs/investigations.md` entries** (active, post-Polish-v1):

- `'general-unassigned'` sentinel as `investigationId` placeholder in test fixtures (small audit; bundle into #11)
- `wallLayoutStore.selection` Set/JSON Dexie round-trip — flagged by PR8-8e (status: clarified by Polish v1 selection audit; verify resolution)
- P2.5 deferral: per-step mini-Pareto chips on Operations band — partially met by `useStepDefectPareto` + `StepDefectIndicator` shipping; Operations-band slot wiring is the natural next step (bundle with #10)
- Producer-side `EvidenceSnapshot.stepCapabilities` stamping — RESOLVED 2026-05-08 via Polish v1
- CanvasStepMiniChart histogram binning — RESOLVED 2026-05-08 via Polish v1
- Canvas hypothesis-arrows obscured under Wall overlay — Spec 4 ext §6 amended via Polish v1; verify documentation lock

**Carry-forwards from 8a (DMAIC vocabulary completion)** — covered by RPS V1 sequence (#1–#9) plus:

- Team-collaboration features inside IP / Sustainment / Handoff surfaces (signoff, audit trail, alerts, RACI, change notifications) — tier-gated layer; signoff lands in PR-RPS-7 (visible-with-lock for free; active for paid) per RPS V1 D9; audit trail / comments / RACI / notifications stay V2 named-future per spec §14.

## 5. Open architectural questions (need design conversations before plan-writing)

These are NOT blockers for the next-9 but want explicit time at the right moment:

- **Security hardening (#13)** — concept doc at `docs/superpowers/specs/2026-05-07-security-hardening-design.md` (`status: draft`); needs spec brainstorm + ADR. Defers to "after F-series wraps" per its own commit message; F1-F4 closes the foundational track.
- **Audit-trail / GxP compliance** — explicitly parked per F3.6-β decision + RPS V1 D9 (Azure tenant logging handles compliance audit at platform level; in-product audit-trail deferred). Re-opens only when a regulated-industry customer ask materializes.

_(Resolved by RPS V1 brainstorm 2026-05-09: the prior "F5 timing — pre-Charter or post-Charter" question is moot since F5's HubAction work is now subsumed into PR-RPS-9 + PR-RPS-10.)_

## 6. Heuristics for next-up selection

When the §3 sequence becomes ambiguous, pick by:

1. **User-visible value beats foundation** by default. Foundation that nobody can use is invisible value (`feedback_full_vision_spec` + canvas-migration-vs-F-series interleaving precedent).
2. **Honor vision commitments verbatim** for world-class UX (`feedback_honor_vision_commitments`). When forks emerge, default to honoring; hedge only if implementation is genuinely infeasible at world-class quality.
3. **Step back when piecewise design surfaces structural debt** (`feedback_step_back_for_system_design`). If brainstorming feature N reveals structural debt that N would compound, promote to a system-level redesign (per RPS V1 brainstorm: IP V1 promoted to RPS V1 covering all 5 response paths).
4. **Drop methodology bridges when product has its own opinionated journey** (`feedback_drop_methodology_bridges`). VariScout-native vocabulary (Constitution P1 + question-driven EDA + Survey + own primitives) over external bridges (DMAIC / QC Story / TBP / A3).
5. **Verify methodology before gating** when a domain term enters the design (`feedback_verify_methodology_before_gating`). Web search the canonical sequence; cite sources in the spec.
6. **Tier-gate inside surfaces, not at entry CTAs** (`feedback_tier_gate_inside_surface`). Document authoring + structured workflows serve free-tier pedagogy + `.vrs` export; team workflow = paid-tier inside the surface.
7. **Slice cap ~6-8 tasks per PR** (`feedback_slice_size_cap`). Larger workstreams split into multiple sequenced PRs off one branch.
8. **Brainstorm-first for design-heavy slices** (`superpowers:brainstorming`); straight-to-plan for mechanical slices covered by existing specs.
9. **Subagent-driven default** for execution (`feedback_subagent_driven_default`); Sonnet workhorse + per-task spec/quality reviewers; Opus for final-PR review.
10. **Code-review subagents must check out the PR branch** before assessing — assessing against `main` produces false negatives. Per RPS V1 PR-RPS-1 review (2026-05-09), the first reviewer reported "0 of 6 tasks implemented" because they reviewed against `main`; re-review against the PR branch found all 6 tasks correctly done.
11. **Customer asks accelerate items**, foundation work fills momentum gaps. The §3 order is a default; concrete asks override.

## 7. How this doc is maintained

- **Updated post-merge** when an item ships (move from §3 to §1; advance §2 if next-up changes).
- **Revised weekly** during active sprints; **revisited monthly** during quieter cadence.
- **Decision-log captures the _why_** of prioritization changes. This doc captures the _what + when_.
- **Memory files** carry the current state across fresh sessions: `project_variscout_roadmap` + `project_response_path_system_v1`.
- **Heavyweight horizon planning** lives in vision spec §6+ (H0/H1/H2/H3); this doc is the operational layer.

## 8. References

- Decision log: [`docs/decision-log.md`](decision-log.md)
- Investigations: [`docs/investigations.md`](investigations.md)
- Vision spec: [`docs/superpowers/specs/2026-05-03-variscout-vision-design.md`](superpowers/specs/2026-05-03-variscout-vision-design.md) (status: accepted)
- Data-Flow Foundation spec: [`docs/superpowers/specs/2026-05-06-data-flow-foundation-design.md`](superpowers/specs/2026-05-06-data-flow-foundation-design.md) (status: delivered for F1-F4; F5 subsumed by RPS V1)
- Canvas Migration spec: [`docs/superpowers/specs/2026-05-04-canvas-migration-design.md`](superpowers/specs/2026-05-04-canvas-migration-design.md) (PR1-PR9 SHIPPED)
- **RPS V1 spec: [`docs/superpowers/specs/2026-05-09-response-path-system-v1-design.md`](superpowers/specs/2026-05-09-response-path-system-v1-design.md)** (status: delivered; 10 of 10 PRs shipped 2026-05-13)
- **RPS V1 plan: [`docs/superpowers/plans/2026-05-09-response-path-system-v1.md`](superpowers/plans/2026-05-09-response-path-system-v1.md)** (status: delivered; 10 of 10 PRs shipped 2026-05-13)
- PR8 master plan: [`docs/superpowers/plans/2026-05-07-canvas-pr8-vision-alignment-master.md`](superpowers/plans/2026-05-07-canvas-pr8-vision-alignment-master.md) (CLOSED)
- Workflow rules: `feedback_full_vision_spec`, `feedback_honor_vision_commitments`, `feedback_step_back_for_system_design`, `feedback_drop_methodology_bridges`, `feedback_process_owner_reality_chain`, `feedback_survey_cross_phase_layer`, `feedback_verify_methodology_before_gating`, `feedback_tier_gate_inside_surface`, `feedback_slice_size_cap`, `feedback_subagent_driven_default`, `feedback_pwa_philosophy`
