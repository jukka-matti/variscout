---
title: 'VariScout product vision consolidated'
purpose: decide
tier: card
status: active
date: 2026-05-03
topic: ['decisions', 'canvas', 'capability', 'chart']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---
> **Decision card** — extracted from `docs/decision-log.md` §1 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# VariScout product vision consolidated

One canonical vision spec at [`docs/archive/specs/2026-05-03-variscout-vision-design.md`](archive/specs/2026-05-03-variscout-vision-design.md) supersedes the 2026-04-27 `process-learning-operating-model-design.md` and `product-method-roadmap-design.md` (both moved to `docs/archive/specs/` with `status: superseded` + forward pointer). `docs/01-vision/methodology.md` retained as longer-form companion with a forward-pointer banner; reconciliation is a follow-up edit. **Core thesis:** "the map is the product" — a Process Hub IS its logic map; one continuous canvas (DAG with branch + join + two-level nesting + context propagation) replaces today's FRAME workspace components (`ProcessMapBase` river-SIPOC, `LayeredProcessView`, `LayeredProcessViewWithCapability`); cards-with-mini-charts per step + drill-down panel + mode lenses replace the separate Analysis tab; "tributary" / "CTS" jargon retired. **10 canvas commitments** in spec §3.3 are load-bearing. **11 open questions in §8** carry brainstorm defaults that need explicit confirmation before implementation plans are written. Engine + data model survive (production-line-glance C2's per-(node × context-tuple) capability is the math under the canvas). Brainstorm transcript at `~/.claude/plans/i-would-like-to-composed-rose.md`. _Pinned 2026-05-03._
