---
title: '8f canvas viewport architecture brainstorm + spec + ADR-081 locked'
purpose: decide
tier: card
status: active
date: 2026-05-13
topic: ['decisions', 'canvas', 'wall', 'azure']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---

> **Decision card** — extracted from `docs/decision-log.md` §1 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# 8f canvas viewport architecture brainstorm + spec + ADR-081 locked

Vision §5.4's "levels-as-pan/zoom" commitment (the last unmet vision-spec commitment after PR8 sub-PRs 8a–8e) entered design phase. 13 decisions locked in the brainstorm session, captured in spec [`docs/archive/specs/2026-05-13-canvas-viewport-architecture-design.md`](archive/specs/2026-05-13-canvas-viewport-architecture-design.md) (`status: accepted`). [ADR-081](07-decisions/adr-081-canvas-viewport-architecture.md) codifies the five irreversible architectural commitments: (1) d3-zoom (3 KB gz) as the only viewport dependency; (2) unified state + pluggable renderers (generalize `wallLayoutStore` → `useCanvasViewportStore`, Wall stays SVG, Canvas stays DOM, new L1/L3 DOM-native); (3) Canvas is the viewport surface that embeds owner-surface components — ADR-074 amended via co-issued [Amendment 2026-05-13 block](07-decisions/adr-074-scout-level-spanning-surface-boundary-policy.md#amendment--2026-05-13-canvas-as-viewport-surface-8f); (4) L1 is ADR-073-compliant (outcome series against outcome spec — no cross-step rollup); (5) within-Hub scope (multi-Hub portfolio explicitly out, Azure-tier named-future). Industry-validated pattern (Figma, Google Maps, VS Code, Notion, Visx). Next: implementation plan via `superpowers:writing-plans`; ~6 PRs of 6–8 tasks each on branch `canvas-viewport-8f`. Phase 0 friction-validation skipped per user direction. Roadmap §2 In-flight slot now occupied; §3 row 12 struck. _Pinned 2026-05-13._
