---
title: 'Slice 4: framing-layer V1 close-out'
purpose: decide
tier: card
status: active
date: 2026-05-04
topic: ['decisions', 'archived', 'wedge', 'canvas']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---
> **Decision card** — extracted from `docs/decision-log.md` §1 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# Slice 4: framing-layer V1 close-out

Slice 4 (branch `framing-layer-v1-slice-4`) ships §9 (defect anchoring + canvas Pareto + two pickers + Y-adapts-to-mode) and §10 (three composable canvas filter chips) surface, plus the two pinned slice-4-bound follow-ups: `existingRange` is now wired through both paste wedges (D10), and the framing-layer spec is promoted to `status: delivered` and archived (D14). App-level integration of canvas-filter writers (Pareto bar-click → scopeFilter, ParetoMakeScopeButton → StageFiveModal opener) is partial — full integration + E2E captured in `docs/investigations.md` "Canvas-filter app-level integration + E2E" entry. P2.5 per-step mini-Pareto chips on step cards similarly partial — engine + primitive shipped, mounting deferred per `docs/investigations.md` "P2.5 deferral" entry. The framing-layer spec V1 is feature-complete; remaining work is the documented mounting follow-ups, not new design. _Pinned 2026-05-04._
