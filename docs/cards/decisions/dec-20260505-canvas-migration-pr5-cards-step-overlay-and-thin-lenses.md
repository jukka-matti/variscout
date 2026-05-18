---
title: 'Canvas Migration PR5 cards, step overlay, and thin lenses'
purpose: decide
tier: card
status: active
date: 2026-05-05
topic: ['decisions', 'spec-edit', 'canvas', 'capability']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---
> **Decision card** — extracted from `docs/decision-log.md` §1 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# Canvas Migration PR5 cards, step overlay, and thin lenses

PR5 implements the Spec 3 placeholder in [`docs/archive/specs/2026-05-04-canvas-migration-design.md`](archive/specs/2026-05-04-canvas-migration-design.md): Canvas now derives per-step card models from `ProcessMap`, raw data, measure specs, assigned columns, and production-line-glance projections; card metric precedence is `node.ctqColumn` -> first numeric assigned column -> first assigned column -> empty state. The shared lens registry defines `default`, `capability`, `defect`, `performance`, and `yamazumi`; only default/capability/defect are enabled complete renderers in PR5, while performance/yamazumi stay fallback entries. Active lens remains session-scoped View state via `useSessionCanvasFilters`, initialized from `analysisMode` where available and not written to hub/document state. The dedicated Canvas Operations band is absorbed into card/lens rendering; `ProductionLineGlanceDashboard` remains intact outside Canvas and its data contracts/projections feed the cards. Step-card click opens an anchored desktop overlay or mobile bottom sheet; spec edit stays a separate affordance; Quick action routes to Improvement and Focused investigation routes to Investigation in both PWA and Azure. Analysis routes are intentionally left in place for later cleanup. PR5a landed the broad cards/overlay/lenses slice; PR5b is the continuity follow-up for stricter overlay anchoring, mobile sheet behavior, and no-spec card fallback fidelity. _Pinned 2026-05-05._
