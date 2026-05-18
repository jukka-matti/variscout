---
title: 'RPS V1 SHIPPED — full lifecycle live'
purpose: decide
tier: card
status: active
date: 2026-05-13
topic: ['decisions', 'wall', 'chart', 'improve']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---
> **Decision card** — extracted from `docs/decision-log.md` §1 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# RPS V1 SHIPPED — full lifecycle live

All 10 PRs of the Response Path System V1 spec ([`docs/archive/specs/2026-05-09-response-path-system-v1-design.md`](archive/specs/2026-05-09-response-path-system-v1-design.md), promoted `draft → delivered`) merged on `main` across 2026-05-09 → 2026-05-13: PR-RPS-1 #144 / PR-RPS-2 #147 / PR-RPS-3 #148 / PR-RPS-4 #149 / PR-RPS-5 #150 / PR-RPS-6+7 #151+#152 / PR-RPS-8 #153 / **PR-RPS-9 #154 (`5f95e6fd`, Sustainment V1 + Inbox digest + drift-detection survey rules) / PR-RPS-10 #155 (`12e1257b`, Handoff V1 + sponsor signoff + 8-station `apps/azure/e2e/full-lifecycle.spec.ts`)**. All 5 response paths now live: Quick Action / Wall Detective-pack / Improvement Project (Charter) / Sustainment / Handoff. F5's `SUSTAINMENT_*` + `CONTROL_HANDOFF_*` HubAction work absorbed into PR-RPS-9/10 (no separate F5 PR needed). [`ADR-080`](07-decisions/adr-080-sustainment-auto-fire-pattern.md) authored as the named-future pattern reference for response-path lifecycles (auto-fire + Inbox prompt + signoff-gated finalize, tier-gated). Plan ([`docs/archive/plans/2026-05-09-response-path-system-v1.md`](archive/plans/2026-05-09-response-path-system-v1.md)) promoted `active → delivered`. Roadmap §1 + §3 updated. _Pinned 2026-05-13._
