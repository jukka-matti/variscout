---
title: 'Framing-layer spec `status: active` promotion to `delivered` deferred to slice 4'
purpose: decide
tier: card
status: active
date: 2026-05-04
topic: ['decisions', 'canvas', 'spec']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---
> **Decision card** — extracted from `docs/decision-log.md` §1 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# Framing-layer spec `status: active` promotion to `delivered` deferred to slice 4

`docs/superpowers/specs/2026-05-03-framing-layer-design.md` has `status: active` in its frontmatter. Per spec §17, V1 ships in four slices (1, 2, 3, 4); slices 1–3 are merged on main as of 2026-05-04. Slice 4 (defect anchoring + Pareto on canvas + composable filter states UI) is the final V1 deliverable. Premature `status: delivered` promotion is a documented anti-pattern (see `feedback_plan_status_drift_audit.md`). **Decision: keep `status: active` until slice 4 lands. At that point, promote to `status: delivered` and archive the spec to `docs/archive/specs/` per the spec lifecycle convention.** _Pinned 2026-05-04._ **[RESOLVED 2026-05-04 — see 2026-05-04 close-out entry above]**
