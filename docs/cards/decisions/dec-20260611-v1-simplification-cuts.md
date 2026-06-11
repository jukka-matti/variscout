---
title: 'V1 simplification cuts — collaboration, Azure persistence, mobile; three-channel model'
purpose: decide
tier: card
status: active
date: 2026-06-11
topic: ['local-first', 'deletion', 'pricing', 'paddle', 'byok', 'channels', 'desktop-only']
related:
  - docs/07-decisions/adr-093-v1-simplification-cuts.md
  - docs/07-decisions/adr-092-local-first-variscout-product-model.md
  - docs/superpowers/specs/2026-06-11-consultation-loop-design.md
supersedes: []
---

> **Decision card** — same-day hardening of the local-first reframe, accepted 2026-06-11. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# V1 simplification cuts — three deletion programs + three-channel model

The owner review hardened ADR-092's "optional capabilities" into deletions: live project membership (roles, invites, ACLs), the Azure persistence stack (Blob sync, EasyAuth document identity, PO-8b save-conflict machinery), and all mobile/touch surfaces are deleted from V1 via grounded deletion sweeps. Durability = `.vrs` + minimal local autosave. Desktop browsers only. Formalization is a solo act; "Sponsor" survives as a pack audience.

One app, three deployments after the sweeps: **Free** web (full in-session analysis; save/export excluded at build time), **Individual** €17+VAT/mo or €99+VAT/yr via Paddle (installable desktop PWA on the user's machine; artifact layer; BYOK CoScout — own key, direct browser→provider, never a vendor proxy), **Company** €120/mo via Azure Marketplace (customer-tenant deployment, IT-governed CoScout, security review pack). The boundary message: "analyze free; keep, share, and consult on your work = paid."

Canonical artifacts: [ADR-093](07-decisions/adr-093-v1-simplification-cuts.md); ADR-092 + the local-first vision spec amended in place same day.
