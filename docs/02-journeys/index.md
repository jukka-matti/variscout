---
tier: living
purpose: design
title: 'User Journeys'
audience: human
category: workflow
status: active
layer: L2
last-reviewed: 2026-05-18
---

# User Journeys

WHO does WHAT inside VariScout V1. Three in-project personas, one 7-tab navigation, supporting reference for flows + use-cases.

## V1 in-project personas

V1 ships 3 personas within each Project. Per-project ACLs; no cross-AD-tenant invites.

- [**Lead**](personas/lead.md) — drives Charter → Approach → Control; owns the Workspace's active Project
- [**Member**](personas/member.md) — contributes hypothesis evidence, measurement rows, action items
- [**Sponsor**](personas/sponsor.md) — approves Charter; reviews Control + signs off Report

## Information architecture

- [**IA Nav Model**](ia-nav-model.md) — the 7-tab navigation (`Home · Project · Process · Explore · Analyze · Improve · Report`) and the Workspace context / Analysis Scope rules.

## Supporting reference

- [Use cases](use-cases/index.md) — strategic problems VariScout addresses (Supplier PPAP, COPQ drill-down, Patient wait time, etc.)
- [Flows](flows/index.md) — entry, discovery, activation flows (Azure first analysis, daily use, team collaboration, Teams mobile)
- [UX Research](ux-research.md) — foundational user research informing journey design
- [Case-Based Learning](case-based-learning.md) — methodology pedagogy via real-world datasets
- [Traceability](traceability.md) — bidirectional mapping between journey steps and implementation

## Legacy personas (named-future or archived)

The 10 legacy persona files in [`personas/`](personas/) are V0 archetypes. They are retained as historical reference and partially graduate to **VariScout Process** (future enterprise tier). V1 design references Lead / Member / Sponsor only. See [`personas/index.md`](personas/index.md) for current status of each.

## Where the buyer / champion story lives

The market-facing **Improvement Specialist** (the buyer who chooses VariScout) lives in L1 vision: [`../01-vision/product-overview.md`](../01-vision/product-overview.md). Inside a Project the Specialist plays Lead / Member / Sponsor — usually Lead.
