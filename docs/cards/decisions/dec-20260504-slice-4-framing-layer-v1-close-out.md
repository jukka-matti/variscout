---
title: 'Slice 4: framing-layer V1 close-out'
purpose: decide
tier: card
status: archived
date: 2026-05-04
topic: ['decisions', 'archived', 'wedge', 'canvas']
verified-against-commit: 6f51f080
last-verified: 2026-05-26
supersedes: []
---

> **Decision card** — extracted from `docs/decision-log.md` §1 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).
>
> **Archived 2026-05-26** under wedge V1 (ADR-082). The deferred "Canvas-filter app-level integration + E2E" + "P2.5 per-step mini-Pareto" follow-ups were retired — Pareto-bar-click → StageFiveModal scaffolding deleted in commit `748fa382`; per-step mini-Pareto mounting was a slice-4 idea that doesn't map to wedge V1's canvas L2→L3 response-path model. Framing-layer spec frontmatter flipped `status: active` → `status: archived` in the same commit cluster. See decision-log §1 entry "Framing Layer slice 4 archive" 2026-05-26.

# Slice 4: framing-layer V1 close-out

Slice 4 (branch `framing-layer-v1-slice-4`) ships §9 (defect anchoring + canvas Pareto + two pickers + Y-adapts-to-mode) and §10 (three composable canvas filter chips) surface, plus the two pinned slice-4-bound follow-ups: `existingRange` is now wired through both paste wedges (D10), and the framing-layer spec is promoted to `status: delivered` and archived (D14). App-level integration of canvas-filter writers (Pareto bar-click → scopeFilter, ParetoMakeScopeButton → StageFiveModal opener) is partial — full integration + E2E captured in `docs/investigations.md` "Canvas-filter app-level integration + E2E" entry. P2.5 per-step mini-Pareto chips on step cards similarly partial — engine + primitive shipped, mounting deferred per `docs/investigations.md` "P2.5 deferral" entry. The framing-layer spec V1 is feature-complete; remaining work is the documented mounting follow-ups, not new design. _Pinned 2026-05-04. Archived 2026-05-26 under wedge V1._
