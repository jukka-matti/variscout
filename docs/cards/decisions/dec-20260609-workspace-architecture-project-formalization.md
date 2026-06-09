---
title: 'Workspace architecture: optional Project formalization and Analysis Scope lens'
purpose: decide
tier: card
status: active
date: 2026-06-09
topic: ['decisions', 'workspace', 'project', 'analysis-scope', 'active-ip', 'architecture']
last-verified: 2026-06-09
supersedes: []
---

> **Decision card** - captures the 2026-06-09 Workspace architecture decision. Canonical spec: [`2026-06-09-workspace-architecture-and-project-formalization-design.md`](../../superpowers/specs/2026-06-09-workspace-architecture-and-project-formalization-design.md). Roadmap: [`2026-06-09-workspace-architecture-roadmap.md`](../../superpowers/plans/2026-06-09-workspace-architecture-roadmap.md). Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# Workspace architecture: optional Project formalization and Analysis Scope lens

VariScout V1 now treats **Workspace** as the user-facing product object. The analyst starts a Workspace when they have data, a process question, or a performance problem to analyze. The Workspace owns the analysis context and is currently backed by `ProcessHub` storage.

**Project** becomes optional formalization of a Workspace, not a separate child inside a Hub portfolio. V1 supports zero or one Project per Workspace. Once present, the Project is always attached and supplies role/ACL context, charter/status, actions, membership, and report formalization.

**Analysis Scope** is the only active analytical lens: outcome or measure, factor, process step, and categorical filters. Users broaden or narrow analysis through Analysis Scope, not by entering or exiting Project focus.

This decision retires Active IP / Project Focus as user-facing architecture. Current `useActiveIPContext` and `useActiveIPStore` behavior remains a migration target until ACL, Wall, Analyze, Report, Control, mobile navigation, and quick-analysis behavior are proven through dedicated implementation slices.

The multi-project process portfolio model moves to the named-future VariScout Process product. V1 does not support many Projects inside one Hub or Workspace; another effort means another Workspace.

_Pinned 2026-06-09._
