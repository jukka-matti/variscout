---
title: 'Canvas Migration PR8 Vision Alignment master plan written; 8f deferred to its own design spec'
purpose: decide
tier: card
status: active
date: 2026-05-07
topic: ['decisions', 'canvas', 'investigation', 'wall']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---
> **Decision card** — extracted from `docs/decision-log.md` §1 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# Canvas Migration PR8 Vision Alignment master plan written; 8f deferred to its own design spec

Master plan at [`docs/superpowers/plans/2026-05-07-canvas-pr8-vision-alignment-master.md`](superpowers/plans/2026-05-07-canvas-pr8-vision-alignment-master.md). Sequences four PR8 sub-PRs (8a mode-aware CTAs, 8b drift indicator + time-series mini-chart, 8d hypothesis-arrow drawing, 8e Wall mirror) with locked dependencies. **6 locked decisions:** D1 F4 lands first (now SHIPPED via PR #136 — see entry above; 8d/8e benefit from F4's three-layer state codification when assigning new state fields); D2 8f canvas viewport architecture (vision §5.4 levels-as-pan/zoom) is REMOVED from PR8 and gets its own design spec + ADR-080 — the architecture choice (react-flow-style transform vs hand-rolled SVG/CSS) warrants its own brainstorm, not a sub-PR; D3 8a + 8b parallel-able (zero shared files); D4 8d + 8e sequential (both touch overlay rendering surface); D5 each sub-PR closes its corresponding `docs/investigations.md` entry pinned 2026-05-06; D6 subagent-driven flow per `feedback_subagent_driven_default` (Sonnet workhorse + Opus final review per sub-PR). 8a + 8b are scope-bounded (~5–6 tasks each, straight to plan, retroactive Spec 3 covers design intent). 8d + 8e need Spec 4 brainstorm extensions (5 open design questions for 8d: drag mechanics, source/target granularity, promoted-vs-draft visual, inline form placement, undo behavior; 3 forks for 8e: embedded Wall, hybrid expand-to-wall, status-quo + spec amendment). **Master plan does NOT dispatch implementation** — each sub-PR opens its own fresh session for brainstorm and/or plan. Sequencing diagram + per-sub-PR session opener templates included. Closure: PR8 master closes when all four sub-PRs merged + investigations entries marked `[RESOLVED]` + canvas migration spec §6 updated + decision-log entry. _Pinned 2026-05-07._
