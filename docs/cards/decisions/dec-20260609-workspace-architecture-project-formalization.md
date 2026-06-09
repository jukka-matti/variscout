---
title: 'Workspace architecture: soft-formalized Project and Analysis Scope lens'
purpose: decide
tier: card
status: active
date: 2026-06-09
topic: ['decisions', 'workspace', 'project', 'analysis-scope', 'active-ip', 'architecture']
last-verified: 2026-06-09
supersedes: []
---

> **Decision card** — captures the 2026-06-09 Workspace architecture decision (owner brainstorm; resolves the same-day Open Question). Canonical spec: [`2026-06-09-workspace-architecture-and-project-formalization-design.md`](../../superpowers/specs/2026-06-09-workspace-architecture-and-project-formalization-design.md). Roadmap: [`2026-06-09-workspace-architecture-roadmap.md`](../../superpowers/plans/2026-06-09-workspace-architecture-roadmap.md). Aggregate view: [`decision-log.md`](../../decision-log.md).

# Workspace architecture: soft-formalized Project and Analysis Scope lens

VariScout V1's user-facing object is the **Workspace** (architecture term: _Analysis Workspace_). The analyst starts a Workspace when they have data, a process question, or a performance problem to analyze. It is backed by `ProcessHub` storage, which stays internal vocabulary (a rename is an optional later plan).

Every Workspace is backed by exactly one `active` **Project** — the First-Session-Journey auto-project — that stays **informal** (no Project chrome) until a **deliberate** formalization act: opening/filling the charter, inviting a member, or explicitly choosing "Make this a Project." The FSJ auto-title (sample / `.vrs` name) does _not_ formalize, and there is no draft state (E1 "no draft gating" preserved). There is no "zero Project" state. Once formalized, the Project supplies role/ACL context, charter/status, actions, membership, and report/signoff.

**Analysis Scope** (outcome/measure + factor + step + filters) is the only active analytical lens. Users broaden or narrow analysis through Analysis Scope — never by entering, exiting, or switching a project focus.

This retires the portfolio-era focus ceremony — **Active IP / Project Focus / Exit IP / "Free roaming" / "Switch IP"** (`ActiveIPLaunchpadCard`) — which was vestigial under the Hub↔Project 1:1 collapse IM-0a already shipped (PR #243). It **finishes that migration in the product surface** rather than re-deciding it. The multi-project process portfolio model stays named-future (VariScout Process); another effort means another Workspace.

Delivered as one holistic initiative, ordered for safety (model lock → Workspace view-model adapter → behavior swap off Active IP → fossil deletion → render split), with the first-session / b0 walk as the acceptance gate. CoScout autonomy design runs independently.

_Pinned 2026-06-09._
