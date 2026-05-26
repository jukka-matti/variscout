---
tier: living
purpose: design
title: Personas
audience: human
category: workflow
status: active
layer: L2
last-reviewed: 2026-05-18
---

# Personas

## V1 in-project personas (canonical)

V1 ships 3 personas inside each Project. Per-project ACLs; no cross-AD-tenant invites.

- [**Lead**](lead.md) — drives Charter → Approach → Sustainment; owns active-IP cascade
- [**Member**](member.md) — contributes evidence, measurement rows, action items
- [**Sponsor**](sponsor.md) — approves Charter; reviews Sustainment + signs off Report

The market-facing buyer / champion (**Improvement Specialist**) lives in L1: [`../../01-vision/product-overview.md`](../../01-vision/product-overview.md). Inside a Project the Specialist plays one of the three roles above (most often Lead).

**App scope.** These three roles and per-project ACLs apply to the **Azure tenant SKU**. The **PWA** (free tier) is single-user open-access by design — `canAccess()` is not invoked in PWA and any user can edit any artefact. Trainers importing `.vrs` scenarios into PWA, and users moving between the two apps, should expect role gating only on Azure. See [`../../08-products/feature-parity.md`](../../08-products/feature-parity.md).

## Legacy V0 personas — named-future (VariScout Process)

Five legacy archetypes retained here; they graduate to **VariScout Process** (future enterprise tier — multi-persona collaboration). V1 surface decisions reference Lead / Member / Sponsor only.

- [Analyst Alex](analyst-alex.md) — data analyst variant
- [Engineer Eeva](engineer-eeva.md) — process engineer
- [Evaluator Erik](evaluator-erik.md) — Six Sigma MBB evaluator
- [OpEx Olivia](opex-olivia.md) — OpEx director
- [Trainer Tina](trainer-tina.md) — enterprise trainer

Five additional V0 personas (Admin Aino, Curious Carlos, Field Fiona, Green Belt Gary, Student Sara) were archived 2026-05-18 to [`docs/archive/journeys/personas/`](../../archive/journeys/personas/) — V0 noise that doesn't apply to V1 or named-future scope.
