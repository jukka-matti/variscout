---
title: 'Layered Process View design'
description: 'Three-band visual (Outcome / Process Flow / Operations) wrapping the river-styled SIPOC FRAME workspace. V1 DELIVERED via production-line-glance C2 (Apr 29). Plan flipped to delivered 2026-05-03 (commit da46cc41).'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: 86a56343-170c-4e74-b36c-f6ef64738dc3
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_layered_process_view.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Three-band Makigami-style visual layered around the existing river-styled SIPOC FRAME workspace. Spec at `docs/superpowers/specs/2026-04-27-layered-process-view-design.md`. V1 plan at `docs/superpowers/plans/2026-04-27-layered-process-view-v1.md` (status: delivered).

**Delivery state (2026-05-03) — but SUPERSEDED IN VISION SAME DAY:**
- `LayeredProcessView` lives at `packages/ui/src/components/LayeredProcessView/LayeredProcessView.tsx` — three bands, Outcome wired to target/USL/LSL/cpkTarget, ProcessMapBase embedded in Process Flow, tributary chips in Operations.
- `LayeredProcessViewWithCapability` superset at the same path adds `operationsBandContent`/`filterStripContent` slots from C2 (capability boxplot + step Pareto + Δ(Cp-Cpk) trend).
- Both PWA `apps/pwa/src/components/views/FrameView.tsx` and Azure `apps/azure/src/components/editor/FrameView.tsx` consume `LayeredProcessViewWithCapability` (lines ~249/284 each).
- Doc updates already landed: ADR-070 `Update — 2026-04-27 (Layered Process View V1)`, methodology.md "visible by default" paragraph, mental-model-hierarchy.md band note, llms.txt entry. Don't re-do.

**Superseded by vision spec same day (2026-05-03):** `docs/superpowers/specs/2026-05-03-variscout-vision-design.md` §3.3 commitment #1 retires this stack in favour of one continuous canvas. Component remains in code until the new Canvas ships. ADR-070 to be amended ("river metaphor retired"). The "tributary" terminology + "CTS" acronym retire as user-facing labels. Engine + data model survive; surface gets rebuilt.

**The plan was never executed as a standalone branch.** Production-line-glance C2 (merged ~2026-04-29) absorbed the V1 deliverables into its own scope. The 2026-04-27 V1 plan (11 tasks) maps 1:1 to what C2 shipped, plus the WithCapability slots. Plan frontmatter sat at `deferred` until 2026-05-03 catch-up flip.

**Why:** ADR-070 introduced river-SIPOC FRAME but the underlying motivation ("methodology was invisible at the moments users most need it") wasn't fully delivered. Watson's three-level Gamba thinking needs a visible shape. The three-band wrapper adds that shape *around* the existing river without replacing it.

**How to apply:**
- Bands are Outcome / Process Flow / Operations (NOT outcome / flow / local mechanism).
- CTS lives at the **Process Flow band's ocean** (customer experience as designed). CTQ lives at **Operations** (actively controlled parameters).
- Specs (USL/LSL/target) are **operational** — they belong in Operations band conceptually. (Current code shows them in Outcome band as "outcome target"; if a future change consolidates this, push the operational specs to Operations band per the spec.)
- Tributaries → **Factor** in user-facing language. Code stays `tributary` in V1+C2; rename is a deferred cleanup PR before V3.
- Existing 5-lens `ProcessStateLens` (`outcome | flow | conversion | measurement | sustainment`) is NOT renamed. The 3-band visual is a render-time projection: outcome→Outcome, flow→Process Flow, conversion+measurement→Operations, sustainment→Outcome (long-term hold).

**Remaining phases (NOT delivered):**
- V2: read-only Process Hub current-state overlay using existing CurrentProcessState items
- V3: minimal data model for factor specs (`tributary.targetRange?`, `node.designedRate?`, `node.ctqs?`)
- V4: snapshot-backed actuals + Cp/Cpk-over-batches mini-i-charts (100-data-point batches → one Cp/Cpk point on i-chart over time)
- V5: multi-hub aggregate rendering (no false Cp/Cpk aggregation per ADR-073)
- Cross-band SVG connector lines (V2+, requires position coordination with ProcessMapBase)

**Mode × level integration:** Way 1 chosen for V1 (existing modes drive band content; bands always visible). Way 3 (band × lens grid that subsumes modes) is a future direction requiring proper end-to-end design exploration.

**Cross-investigation evidence flow:** chosen UI is side-sheet preview + nav-replace. Findings at status ≥ `analyzed` graduate from investigation-scope to process-scope. Hypotheses + gates stay investigation-scope only.

**Component placement:** primitives in `@variscout/charts`; composed `<LayeredProcessView>` in `@variscout/ui`; app wrappers in `apps/*/src/`.

**Codex feedback incorporated:** spec reframed as visual-language/design (not implementation), V1 phasing narrowed to extending existing FRAME (not replacing), "live data" → "snapshot/cadence-state" everywhere, ProcessStateLens reconciliation added explicitly, Operations band content phased per data-model availability.
