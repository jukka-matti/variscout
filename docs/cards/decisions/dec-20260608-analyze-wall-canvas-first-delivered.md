---
title: 'Analyze Wall canvas-first delivery: Wall default, Causes lens, drawers, and Explore WHERE handoff'
purpose: decide
tier: card
status: active
date: 2026-06-08
topic: ['decisions', 'analyze', 'wall', 'canvas-first', 'evidence-map', 'scope', 'coscout']
last-verified: 2026-06-08
verified-against-commit: 027927efe
supersedes: []
---

> **Decision card** — captures the AW-1 through AW-9 delivery and AW-DOC canonical propagation. Master plan: [`2026-06-08-analyze-wall-redesign-master-plan.md`](../../superpowers/plans/2026-06-08-analyze-wall-redesign-master-plan.md). Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# Analyze Wall canvas-first delivery

The Analyze Wall redesign shipped as a sequence of merge-commit PRs (#338 through #348). The delivered Analyze tab now defaults to a canvas-first Investigation Wall rather than the Evidence Map. The central Analyze lenses are Wall and Causes; Findings remains available as the finding list/board; Evidence Map is demoted to an advanced/read-only graph projection, especially for Report narrative and timeline use.

ADR-066 is amended rather than rewritten. Its original Evidence Map center/default decision remains preserved as historical context, but the current product truth is the AW-delivered Wall + Causes model. `CausalLink` remains a valid persisted graph edge, but analyst-authored CausalLink work is not the default Analyze path.

The Wall composition is now operationally scope-first: a thin Overall Problem Header, readable default scale, legible HOLDS gates, a current-scope + flat sibling switcher instead of a broad-to-narrow lineage trail, scoped findings, a left deterministic object-detail drawer, and an Azure-only right CoScout drawer shell with `[REF]` hook. The acceptance metric for the redesign is the share of the Analyze viewport owned by the canvas, targeting roughly 85%+.

The Analyze-to-Explore handoff is additive to the shared chip-navigation handler. Wall factor jumps carry categorical `ConditionLeaf[]` WHERE predicates into Explore as both the visible scope chip and `projectStore.filters` chart filters. Numeric range predicates remain valid scope predicates but are deferred for chart filtering because the current chart filter model is membership-based.

CS-15 coordination is closed for this initiative: the shared Process chip handler remains additive, and Process gestures are not redefined by the Wall handoff. The lineage-trail display from the earlier prototype is demoted; flat scopes and no recursion remain canonical. Full CoScout drawer content remains a separate follow-up beyond the AW shell.

_Pinned 2026-06-08._
