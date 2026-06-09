---
title: 'Lead Persona Journey'
purpose: design
tier: living
status: active
audience: both
layer: L2
last-verified: 2026-06-02
verified-against-commit: c289d920
---

# Lead Persona Journey

> **V1 in-project persona** — one of three persona roles a teammate plays inside a single Project (Lead / Member / Sponsor). The Lead drives the Project end-to-end. The market-facing buyer persona (Improvement Specialist) lives in L1 ([`docs/01-vision/product-overview.md`](../../01-vision/product-overview.md)); this file is the in-product journey.

> **App scope** — Lead/Member/Sponsor role gating applies to the **Azure tenant SKU**. The **PWA** (free tier) is single-user open-access by design and does not enforce roles. See [`../../08-products/feature-parity.md`](../../08-products/feature-parity.md).

## Persona statement

The **Lead** opens the Project, runs the methodology, and signs off each stage. They own the canvas, the Analyze Wall, the Improvement Plan, and the **Control** cadence. Real-world counterparts: Black Belt, project lead, CI engineer, quality manager driving a specific improvement. The Lead invites Members for SME content + analytical contribution, and surfaces the work to a Sponsor for accountability.

The Lead is the only role that can advance lifecycle stages (Charter → Approach → **Control**), approve hypothesis closure, and finalize the Report.

## JTBD

> **When I** open a Project as Lead, **I want to** drive it through Charter → Approach → **Control** with confidence the analysis is sound, **so I can** present findings + improvement actions to my org.

Supporting jobs:

- When I onboard, I want to frame the problem clearly so my team and Sponsor align on scope.
- When I investigate, I want every hypothesis backed by evidence so my conclusions hold up under scrutiny.
- When I commit to actions, I want a measurable **Control** loop so I know whether the fix worked.

## Sequence across the 7-tab nav

```mermaid
sequenceDiagram
    actor Lead
    participant Home as Home
    participant Project as Project
    participant Process as Process
    participant Explore as Explore
    participant Analyze as Analyze
    participant Improve as Improve
    participant Report as Report

    Lead->>Home: Open VariScout (project list)
    Lead->>Project: Create / select Project (Charter)
    Note over Project: Lead writes problem statement,<br/>invites Members, names Sponsor
    Lead->>Process: Sketch process map, set scope
    Lead->>Explore: Paste / connect data, explore the always-on charts
    Note over Explore: Lead notices a pattern → creates Finding
    Lead->>Analyze: Group Findings into Hypotheses on the Wall
    Note over Analyze: Lead defines Measurement Plans,<br/>tags suspected contributions
    Analyze->>Analyze: Members contribute evidence
    Lead->>Improve: Open Project action tracker
    Note over Improve: Active Project context keeps<br/>Project / Process / Explore / Analyze<br/>focused on the selected Project
    Lead->>Improve: Define improvement actions, owners, dates
    Lead->>Improve: Advance to Control (cadence + drift watch)
    Lead->>Report: Compile findings, actions, Control status
    Report->>Lead: Sponsor reviews (out-of-band sign-off; Lead records)
```

The active Project context is Lead-owned for creation and lifecycle advancement: when the Lead selects a Project as their working focus, workflow tabs scope to that Project until the Lead changes it. Members and Sponsors can open Projects they belong to, but cannot advance lifecycle state.

## Feature touch-points

- [Project Dashboard](../../03-features/workflows/project-dashboard.md) — Charter authoring, member roster, stage advance
- [Analysis Flow](../../03-features/workflows/analysis-flow.md) — Four Lenses, canvas-based EDA
- [Analyze Wall](../../03-features/workflows/analyze-wall.md) — Findings + Hypotheses + Measurement Plans
- [Improvement Workspace](../../03-features/workflows/improvement-workspace.md) — Project action tracker
- [**Control**](../../03-features/workflows/control.md) — Cadence, drift detection, close-out
- [Hub Creation](../../03-features/workflows/hub-creation.md) — Process Hub setup (internal substrate)

Supporting reference: [`flows/azure-first-analysis.md`](../flows/azure-first-analysis.md), [`flows/azure-daily-use.md`](../flows/azure-daily-use.md), [`flows/azure-team-collaboration.md`](../flows/azure-team-collaboration.md).

## Outcomes / success signals

A Lead has succeeded when:

- **Charter is signed off.** Problem statement, scope, members, and Sponsor are agreed.
- **Hypotheses are validated.** Each closed hypothesis has supporting evidence + a documented mechanism (contribution language per ADR-073, never "root cause").
- **Improvement actions are committed.** Each action has an owner, target date, and acceptance signal on the Improve tab.
- **Control cadence is live.** Recurring measurement + drift watch is in place; the Lead receives surfaced signals when readings drift.
- **Report is presentable.** Sponsor can sign off; findings can be shared org-wide via export.

Failure modes the journey is designed to prevent:

- Hypotheses closed without evidence (Analyze Wall enforces gate)
- Cpk roll-ups across heterogeneous specs (ADR-073 enforcement)
- Improvement actions without **Control** loop (Improve → Control hand-off built in)
