---
tier: living
purpose: design
title: 'VariScout User Journeys — V1 Index'
audience: human
category: reference
status: active
layer: L2
last-reviewed: 2026-05-18
---

# VariScout User Journeys — V1 Index

V1 ships **3 personas within each Project — Lead / Member / Sponsor — per-project ACLs, no cross-AD-tenant invites** (per [V1 architecture spec](superpowers/specs/2026-05-16-wedge-architecture-design.md) + [ADR-082](07-decisions/adr-082-wedge-architecture.md)). This page links the canonical journey set; per-persona detail and the IA model live in [`02-journeys/`](02-journeys/index.md).

## Canonical V1 in-project personas

| Persona     | Role inside a Project                            | Journey file                                                       |
| ----------- | ------------------------------------------------ | ------------------------------------------------------------------ |
| **Lead**    | Drives Charter → Approach → Sustainment; owns IP | [02-journeys/personas/lead.md](02-journeys/personas/lead.md)       |
| **Member**  | Contributes evidence, measurement rows, actions  | [02-journeys/personas/member.md](02-journeys/personas/member.md)   |
| **Sponsor** | Approves Charter; reviews Sustainment + Report   | [02-journeys/personas/sponsor.md](02-journeys/personas/sponsor.md) |

The 7-tab navigation (`Home · Project · Process · Analyze · Investigation · Improve · Report`) and active-IP cascade are documented in [02-journeys/ia-nav-model.md](02-journeys/ia-nav-model.md).

## Where the buyer / champion story lives

The market-facing **Improvement Specialist** persona — the buyer / champion who chooses VariScout — lives in L1 ([`docs/01-vision/product-overview.md`](01-vision/product-overview.md)). That's the positioning + market story, not an in-product journey. Inside a Project the Specialist plays one of the three roles above (most often Lead).

## Supporting reference

- [Use cases](02-journeys/use-cases/index.md) — strategic problem framings VariScout addresses (Supplier PPAP, COPQ drill-down, Patient wait time, etc.)
- [Flows](02-journeys/flows/index.md) — entry / discovery / activation flows (Azure first analysis, Azure daily use, Team collaboration, Teams mobile)
- [Mode-specific journeys](02-journeys/index.md) — analysis mode documentation (Standard, Capability, Yamazumi, Performance, Defect, Process Flow)

## Legacy V0 personas

The 10 legacy persona files under [`02-journeys/personas/`](02-journeys/personas/) (Green Belt Gary, OpEx Olivia, Trainer Tina, etc.) are now `status: named-future` (graduating to **VariScout Process**, the future enterprise tier) or `status: archived` (V0 noise that doesn't apply to either V1 or named-future). They are retained as historical reference; V1 surface decisions reference Lead / Member / Sponsor only.

## Where to go next

- **V1 architecture (canonical)**: [superpowers/specs/2026-05-16-wedge-architecture-design.md](superpowers/specs/2026-05-16-wedge-architecture-design.md)
- **Product overview (vision + buyer story)**: [01-vision/product-overview.md](01-vision/product-overview.md)
- **Data lifecycle**: [DATA-FLOW.md](DATA-FLOW.md)
- **Glossary**: [glossary.md](glossary.md)
