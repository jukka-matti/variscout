---
title: 'linked-views-phase-1'
description: 'Linked Views Phase 1 — the architecture spec replacing State/Edit binary in wedge V1 Process tab + introducing analysisScopeStore as the bridge between Process and Explore tabs. Spec `docs/superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md` (combined Tasks'
purpose: remember
tier: card
status: active
date: 2026-06-01
topic: [memory, project]
related: []
verified-against-commit: fe1b0755
last-verified: 2026-06-01
source-hash: 7c18afcae07623af
origin-session-id: 99006d69-683b-44e8-a807-7a81fd9d2a53
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_linked_views_phase_1.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Combined output of the 2026-05-28 brainstorm for Tasks #44 (cross-tab IP-scoped presentation) + #45 (State/Edit mode rethink). Brainstorm used the superpowers visual companion (artifacts at `.superpowers/brainstorm/47782-1779997739/` — gitignored).

## Canonical artifacts

- **Spec:** `docs/superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md` — D1-D10 + Phase 1 surface + supersedes wedge §3.3, ADR-034, master plan §H2
- **Master plan:** `docs/superpowers/plans/2026-05-28-linked-views-phase-1-master-plan.md` — 9-PR sequencer
- **LV1-0 sub-plan:** `docs/superpowers/plans/2026-05-28-pr-lv1-0-remove-yamazumi-mode.md` — shipped 2026-05-29
- **LV1-A sub-plan:** `docs/superpowers/plans/2026-05-28-pr-lv1-a-analysis-scope-store.md` — shipped 2026-05-29
- **LV1-B sub-plan:** `docs/superpowers/plans/2026-05-28-pr-lv1-b-pending-explore-intent-migration.md` — shipped 2026-05-29
- **LV1-H sub-plan:** `docs/superpowers/plans/2026-05-28-pr-lv1-h-outcome-summary-pill.md` — shipped 2026-05-29
- **LV1-C sub-plan:** `docs/superpowers/plans/2026-05-28-pr-lv1-c-retire-authoring-mode.md` — shipped 2026-05-29 (atomic-sweep, 4 commits, −1113 LOC)
- **LV1-D sub-plan:** `docs/superpowers/plans/2026-05-28-pr-lv1-d-canvas-explore-jump.md` — shipped 2026-05-29 (7 bite-sized TDD tasks, Sonnet implementer)
- **LV1-E sub-plan:** `docs/superpowers/plans/2026-05-28-pr-lv1-e-explore-scope-chrome.md` — shipped 2026-05-29 (7 bite-sized TDD tasks + 1 review-polish bundle; Sonnet implementer; `createTestFilterChipData` promoted to `buildFilterChipData` in filterTypes.ts during review polish per `feedback_bundle_followups_pre_merge`)
- **LV1-F sub-plan:** `docs/superpowers/plans/2026-05-29-pr-lv1-f-chart-click-categorical-accumulate.md` — shipped 2026-05-29 (4 bite-sized TDD tasks + 1 fixup commit; Sonnet implementer; 3-hop pass-through `chart → *WrapperBase → Azure thin wrapper` via new `onScopeAccumulate?: (factor, key) => void` prop; PWA dispatch deferred per §PWA-Mount-Deferral)
- **LV1-G sub-plan:** `docs/superpowers/plans/2026-05-29-pr-lv1-g-canvas-scope-visualization.md` — shipped 2026-05-29 (4 bite-sized TDD tasks + 1 fixup commit; Sonnet implementer; pure additive subscription work — chips subscribe to `useAnalysisScopeStore` + new shared `useScopeIsEmpty()` hook; V1-compliant 600/500-30/50 color tokens; `MapPin` lucide icon substitutes spec's 📍 emoji per no-emoji rule)
- **Brainstorm decision-log:** `~/.claude/plans/with-the-latest-discovery-groovy-hedgehog.md` (plan-file scratch with D1-D10 rationale; will be overwritten by next plan)

## The 10 locked decisions (D1-D10)

1. **D1** Kill State/Edit binary — canvas direct-manipulation; `canEditCanvas` permission handles access; modern (Figma/Notion/Linear) pattern.
2. **D2** Drop most §3.3 panels (decisions queue + cross-IP refs die — anti-wedge); keep small outcome summary pill in Process tab header.
3. **D3** Done button retires.
4. **D4** Click-to-Explore as canvas's affirmative purpose — outcome/factor/step chips have "Open in Explore →" hover affordance.
5. **D5** H2 row 6 reframes — drill from canvas L2 step click; no separate Explore-tab switcher.
6. **D6** **5-verb activity-frame model: Frame → Explore → Analyze → Improve → Control** (supersedes #39's 4-verb proposal). Project=IP inherited from #40.
7. **D7** Naming: "Explore from canvas" / "Open in Explore →" (matches F1 precedent; preserves "Drill" for in-chart sub-action).
8. **D8** Mode-orthogonal — clicks set within-mode selectors only; modes stay in `projectStore.analysisMode` (mode-rethink is T-NEW-3).
9. **D8.1** Drop `focusedChart` from per-chip intent — default = full 4-chart dashboard (F1 exit button keeps its own focusedChart).
10. **D9** H2 folded into single-row scope chrome with click-to-edit chips (NOT separate Y-strip + step-strip rows — refinement after the 3-row mockup felt heavy).
11. **D10** `analysisScopeStore` Zustand store as the linked-views bridge primitive.

## The 9-PR sequence

| #   | PR           | Scope                                                                  | Model           | Status                                |
| --- | ------------ | ---------------------------------------------------------------------- | --------------- | ------------------------------------- |
| 0   | **PR-LV1-0** | Yamazumi mode removal (atomic deletion sweep)                          | Opus            | **✓ MERGED 2026-05-29 (PR #232, `1b7c5b87`)** |
| 1   | **PR-LV1-A** | `analysisScopeStore` Zustand store + tests                             | Opus            | **✓ MERGED 2026-05-29 (PR #233, `02a30aa7`)** |
| 2   | **PR-LV1-B** | Migrate F1 `pendingExploreIntent` → scope store                        | Sonnet          | **✓ MERGED 2026-05-29 (PR #234, `baa33d91`)** |
| 3   | **PR-LV1-C** | Retire `authoringMode` + `EditModeShell` + `CanvasModeToggle` + Done   | Opus (atomic)   | **✓ MERGED 2026-05-29 (PR #236, `31a1cc2d`)** |
| 4   | **PR-LV1-D** | `navigateToExploreForChip()` + canvas chip hover affordances           | Sonnet          | **✓ MERGED 2026-05-29 (PR #237, `93e6dbf3`)** |
| 5   | **PR-LV1-E** | Explore scope chrome — SingleSelectPopover + FilterChipDropdown reuse  | Sonnet          | **✓ MERGED 2026-05-29 (PR #238, `8af7a8a2`)** |
| 6   | **PR-LV1-F** | Pareto + Boxplot click → `addCategoricalValue()` accumulation          | Sonnet          | **✓ MERGED 2026-05-29 (PR #239, `7a1f2730`)** |
| 7   | **PR-LV1-G** | Process tab canvas live scope visualization                            | Sonnet          | **✓ MERGED 2026-05-29 (PR #240, `a6ea4428`)** |
| 8   | **PR-LV1-H** | Outcome summary pill in Process tab header                             | Sonnet/Haiku    | **✓ MERGED 2026-05-29 (PR #235, `4be19dfe`)** |

For current PR delivery state see `gh pr list`.

## PR-LV1-0 surprises (kept as durable lessons)

- **Scope was ~4x master-plan estimate** (1,700 LOC estimated → ~8,278 LOC actual deletions). Atomic sweeps are bigger than they look; budget accordingly.
- **"Lean*" types were transitively coupled** (LeanProjectionFields, LeanProjectionResult, LeanHealthStats, LeanHealthProjection) — named "Lean*" not "Yamazumi*"; Architect phase caught this. Heuristic: when removing a mode, grep for its methodology vocabulary too (lean / six-sigma / kaizen / takt / VA-NVA), not just the mode name.
- **Two yamazumi-coupled UI surfaces** beyond sub-plan: WhatIfExplorer/ActivityReducer + WhatIfSimulator/LeanDistributionPreview + ReportView/{ReportActivityBreakdown, ReportYamazumiKPIGrid}. Sub-plan should have scouted these.
- **Absorbed-violations fixed at seam** per `feedback_fix_absorbed_violations_at_seam`: P5 "root cause" → "contribution" in `phases/frame.ts`; `Math.random` → `mulberry32(seed=42)` PRNG in `useQuestionGeneration.test.ts`.

## Follow-ups captured

- **T-NEW-1** (Task #49) — Methodology + JTBD vocabulary alignment doc PR (5-verb spine: Frame/Explore/Analyze/Improve/Control). Supersedes #39.
- **T-NEW-3** (Task #50) — Explore tab mode/lens system rethink under wedge V1 3-canvas-level framing. Companion to #11. Now 5 modes remain (standard/capability/performance/defect/process-flow); T-NEW-3 considers whether the specialty modes should consolidate as lenses.
- **T-NEW-4** (Task #51) — Linked views Phase 2: bidirectional cross-filtering (I-Chart point / Histogram bucket / Capability annotation click → scope mutation) + pop-out window for Process+Explore side-by-side.

## Related

- Spec supersedes ADR-034 (yamazumi mode) + ADR-047 amended (mode union narrowed) + wedge spec §3.3 (State/Edit + State-mode panels) + master plan §H2.
- CCJ memory: [[canvas-connection-journey]] (parent initiative, now complete).
- Wedge V1: [[wedge-v1]] (5-verb model + Project=IP vocabulary inherited from D6).
