---
title: 'Sponsor Persona Journey'
purpose: design
tier: living
status: active
audience: both
layer: L2
last-reviewed: 2026-05-27
---

# Sponsor Persona Journey

> **V1 in-project persona** — one of three persona roles a teammate plays inside a single Project (Lead / Member / Sponsor). The Sponsor approves and reviews; they do not edit content. The market-facing buyer persona (Improvement Specialist) lives in L1 ([`docs/01-vision/product-overview.md`](../../01-vision/product-overview.md)).

> **App scope** — Lead/Member/Sponsor role gating applies to the **Azure tenant SKU**. The **PWA** (free tier) is single-user open-access by design and does not enforce roles. See [`../../08-products/feature-parity.md`](../../08-products/feature-parity.md).

## Persona statement

The **Sponsor** is the executive accountable for the Project's outcome. They authorize the Charter, hold the team accountable through **Control**, and accept the final Report. They do not run the analysis, propose hypotheses, or own action items — those are Lead and Member work. The Sponsor's interaction is read-mostly + approval gates.

Real-world counterparts: VP of Operations, Plant Manager, Quality Director, executive Champion. The Sponsor often has many Projects in flight; their VariScout time is bounded.

A Sponsor is invited to specific Projects. They see only those on Home. They never edit canvas, hypotheses, or measurement plans. Their gestures are: open, read, approve, sign off.

## JTBD

> **When I** sponsor a Project, **I want to** approve the Charter + review **Control** cadence, **so I can** hold the team accountable for the improvement outcome.

Supporting jobs:

- When the Lead opens a Project, I want to confirm the problem is worth solving and the scope is right.
- When the team commits to improvement actions, I want to know what success looks like + when to expect results.
- When **Control** surfaces a drift signal, I want to see it without digging through the Wall.
- When the Project is done, I want a Report I can share upward and to my peers.

## Sequence across the 7-tab nav

```mermaid
sequenceDiagram
    actor Sponsor
    participant Home as Home
    participant Project as Project
    participant Process as Process
    participant Explore as Explore
    participant Analyze as Analyze
    participant Improve as Improve
    participant Report as Report

    Sponsor->>Home: Open VariScout, see Projects I sponsor
    Sponsor->>Project: Open Project (read Charter)
    Note over Project: Sponsor signs off Charter scope<br/>(approval gate)
    Sponsor->>Explore: Read (optional engagement)
    Sponsor->>Analyze: Read — see Wall, evidence, Measurement Plans
    Sponsor->>Improve: Review proposed actions + owners
    Note over Improve: Sponsor sees active-IP cascade<br/>(read-only), approves IP scope
    Sponsor->>Report: Read interim status during Control
    Note over Report: Control drift signal<br/>surfaces to Sponsor
    Sponsor->>Report: Sign off final Report (approval gate)
```

The Sponsor reads Explore + Analyze when they want to engage with the analysis directly. Their active gestures are bounded to approval gates which happen out-of-band per wedge V1 (Lead records the signoff as a note). The Sponsor's primary touch-points are **Home** (project list), **Project** (Charter sign-off), **Improve** (action review), and **Report** (interim + final review).

## Feature touch-points

- [Project Dashboard](../../03-features/workflows/project-dashboard.md) — Charter sign-off, view roster + stage progression
- [Improvement Workspace](../../03-features/workflows/improvement-workspace.md) — Read action items + active-IP scope (no edit)
- [**Control**](../../03-features/workflows/control.md) — Drift signals surface to Sponsor when they need attention

Supporting reference: [`flows/enterprise.md`](../flows/enterprise.md), [`flows/azure-team-collaboration.md`](../flows/azure-team-collaboration.md).

## Outcomes / success signals

A Sponsor has succeeded when:

- **Charter is approved.** Sponsor agreed the problem is worth solving and the scope is correct.
- **Action plan is sanctioned.** Sponsor saw the proposed improvement actions and accepted them.
- **Drift is visible.** During **Control**, the Sponsor sees signals without digging — surfaced to Home or via the Report.
- **Final Report is signed off.** Sponsor accepts the outcome and can share it upward.

Failure modes the journey is designed to prevent:

- Sponsor making structural edits they shouldn't (ACL gates: Sponsor cannot author canvas, close hypotheses, compile Report, or advance stages — Lead-only per 2-tier ACL §4.1; Sponsor may contribute Findings, evidence, comments)
- Sponsor missing drift signals (**Control** surfaces them to the Sponsor explicitly, not buried in the Wall)
- Sign-off untracked (sign-off is out-of-band per wedge V1; Lead records the result as a note in the relevant stage)
