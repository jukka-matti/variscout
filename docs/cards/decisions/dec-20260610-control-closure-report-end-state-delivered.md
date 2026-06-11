---
title: 'Control closure and Report end-state delivered'
purpose: decide
tier: card
status: active
date: 2026-06-10
topic: ['decisions', 'control', 'report', 'baseline', 'verification']
last-verified: 2026-06-10
supersedes:
  - docs/07-decisions/adr-080-control-auto-fire-pattern.md
---

> **Decision card** — captures the delivered state of the 2026-06-10 Control closure + Report end-state initiative. Canonical spec: [`2026-06-10-control-closure-and-report-endstate-design.md`](../../superpowers/specs/2026-06-10-control-closure-and-report-endstate-design.md). Master plan: [`2026-06-10-control-closure-master-plan.md`](../../superpowers/plans/2026-06-10-control-closure-master-plan.md). Aggregate view: [`decision-log.md`](../../decision-log.md).

# Control closure and Report end-state delivered

The Control stage now verifies sustainment through the existing re-ingest loop: analyst-set improvement date, frozen baseline, storyboard verification band, analyst-logged re-checks, and a widening suggested ladder. The tool computes comparison evidence; the analyst owns every verdict and final sustained/drifted status.

The old auto-fire / cadence / signoff-gated lifecycle pattern from ADR-080 is superseded for Control. It remains historical context for RPS V1, but the shipped model has no automatic verdict/status writes, no consecutive ticks, and no due/overdue color semantics.

Report now always renders the single-project report. The former Hub portfolio fallback, workspace overview aliases, and null-session defensive branch are deleted. The overview narrative can cite the frozen baseline anchor, re-check sequence, latest comparison summary, and simplified handoff.

Delivery was intentionally split across independent PRs: RPT-1, CC-1, CC-2, CC-3, CC-4, CC-5, CC-6, CC-7, and CC-DOC. The named-view verification-band wireframe lives at [`control-verification-band`](02-journeys/wireframes/control-verification-band.md).

_Pinned 2026-06-10._
