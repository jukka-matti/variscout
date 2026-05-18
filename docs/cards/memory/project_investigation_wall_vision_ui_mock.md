---
title: 'Investigation Wall vision — UI Mock (slide 3/5 "Investigation on the River")'
description: 'Canonical UI mockup of the Investigation Wall — Problem condition + AND-gate + 3 hypothesis cards with mini-charts + tributaries + missing-evidence panel + team presence + mobile fallback'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 2a49a9ce887d8b58
origin-session-id: 4dc98d7b-6a43-414c-8387-61555905cfc7
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_investigation_wall_vision_ui_mock.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

The Investigation Wall canonical UI vision (slide 3 of 5 from the "Investigation on the River" deck shared 2026-05-08). Stored verbatim because the visible features lock multiple V1 design decisions.

**Header:** River status line (e.g., "RIVER / CTS — Fill weight · Cpk 0.78 · target 12.50 g") + Problem condition card ("Fill < LSL on night shift · Cpk 0.78"). 5 tabs above (FRAME / SCOUT / INVESTIGATE / IMPROVE / REPORT) + actions (✻ Snap to river / + New hypothesis / ⌐ Run AND-check / ⊙ Fit map). Right pill: "CTS · 42 events/wk".

**Center — composition tree:** AND-gate diamond labeled "HOLDS 38/42" connects Problem condition to 3 hypothesis cards:
- **H1 confirmed** (solid purple border): "Nozzle runs hot on night shift" + inline I-Chart of NOZZLE.TEMP with a brushed 9-pt region + footer "▶ 3 findings · 1 gemba photo · p<0.001"
- **H2 evidenced** (purple border): "Low-viscosity lots from Supplier B" + inline Boxplot CTS by Supplier (η²=0.42) + footer "▶ 2 findings · ANOVA p=0.004 · no gemba yet"
- **H3 proposed** (gray dashed border): "New operators during ramp" + empty card "No evidence pinned yet · + BRUSH OPERATOR.ID ↓" + amber warning "⚠ Needs at least one data finding to evidence"

**Linked artifacts under H1:** Finding chip ("night-shift spike · brushed 9 pts · mean +3.2σ · 2026-04-15") + Gemba photo chip (IMG · "Eero · line 2 · 23:14 · photo + note").

**Best-subsets suggestion (dashed amber pill, free-floating):** "+ add AMBIENT.TEMP ? R²adj gains 0.11" — DEFERRED to V2 per RPS V1 D12 Detective-pack scope.

**Tributaries band (live from process map, dot-prefixed):** NOZZLE.TEMP→H1 · SHIFT→H1 · LOT.VISCOSITY→H2 · SUPPLIER→H2 · OPERATOR.ID→H3 (proposed) · TRAINING (unused). Dot color matches hypothesis status; gray for unused.

**Missing evidence panel (dashed yellow box, "⚠ MISSING EVIDENCE · THE DETECTIVE MOVE NOBODY SHIPS"):**
- "H1 has no disconfirmation attempted. Try brushing day-shift with hot nozzle."
- "H2 has data but no gemba — walk the receiving dock for Supplier B lots."

**Right rail panels (3 stacked cards):**
- **A. What the analyst does** — "Brush, pin, propose, connect. Brush an I-Chart region → pin as finding. Right-click a finding → propose hypothesis. Drag two hypotheses into an AND-gate → the tool checks the data and reports how often the gate holds."
- **B. Team presence** — Real-time multi-user: Jukka-Matti ("H1 looks tight. Can we walk line 2 Tue night?") · Eero ("Photo added at 23:14 — nozzle was dripping.") · CoScout ("H3 has no evidence. Suggest brushing OPERATOR.ID for shifts 2026-W14.")
- **C. Mobile / touch** — "Same graph, list rendering. On phone the Wall renders as a collapsible card list with 'connects to →' sections. The graph is data; the view adapts. Brushing on tablet uses two-finger lasso."

**How to apply** — this mock IS the canonical Wall vision. Wall V1 Detective-pack scope (RPS V1 D12) closes 3 of 4 visible gaps from this mock: mini-charts inside HypothesisCard (the I-Chart + Boxplot panels embedded in H1/H2), brush-to-pin gesture (the "+ BRUSH OPERATOR.ID ↓" affordance + the brushed 9-pt region under H1), 5th status "Needs Disconfirmation" + confirm-gate rule (rendered as the dashed-amber missing-evidence panel + "1 step away" badges on confirmed-gate-pending cards). Best-subsets inline suggestion (4th gap) deferred to V2. Survey is the cross-phase methodology layer rendering the missing-evidence panel + status-derivation engine. Image source: `~/.claude/image-cache/4dc98d7b-6a43-414c-8387-61555905cfc7/3.png`.
