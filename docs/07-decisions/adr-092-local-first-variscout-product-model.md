---
tier: living
purpose: decide
title: 'ADR-092: Local-first VariScout product model'
audience: both
category: product
status: active
date: 2026-06-11
layer: L5
related:
  - docs/superpowers/specs/2026-06-11-local-first-variscout-product-vision-design.md
  - docs/superpowers/specs/2026-06-11-consultation-loop-design.md
  - docs/07-decisions/adr-093-v1-simplification-cuts.md
  - docs/07-decisions/adr-082-wedge-architecture.md
  - docs/07-decisions/adr-091-two-tier-persistence-model.md
  - docs/07-decisions/adr-059-web-first-deployment-architecture.md
---

# ADR-092: Local-first VariScout product model

**Status:** Accepted
**Date:** 2026-06-11

> **Amended 2026-06-11 (same-day owner review).** The original draft kept live
> membership, Blob persistence, and ACLs as "optional capabilities." The
> accepted decision hardens these into deletions and adds three calls:
> desktop-only hard cut, a build-time free/paid gate, and one-app/two-deployments
> convergence — see [ADR-093](adr-093-v1-simplification-cuts.md). Collaboration
> is the closed **consultation loop** — see the
> [consultation-loop spec](../superpowers/specs/2026-06-11-consultation-loop-design.md).
> The text below reflects the accepted scope.

## Context

ADR-082 narrowed VariScout V1 to a specialist project tool and deferred the enterprise process platform. Subsequent product evaluation surfaced a sharper trust and market position: many buyers do not need a live multi-user project platform first. They need a private, practical alternative to the Minitab + Excel + PowerPoint workflow that runs in their company environment, keeps sensitive process data local by default, and produces credible evidence for decisions.

The security review discussion on 2026-06-11 also showed that customer-tenant Azure deployment helps procurement but does not remove vendor security review. Live project membership, Blob sync, and ACLs add valuable capabilities, but they also add questions about access, offboarding, audit logs, and shared data exposure. For V1 validation, the lower-friction path is a local-first product whose collaboration model starts with controlled share artifacts.

At the same time, local and company-approved AI tooling is becoming a plausible future path. VariScout should preserve a provider boundary for no-AI, customer Azure AI, future local LLM, and optional local MCP agent access without moving statistical authority away from the deterministic engine.

## Decision

VariScout V1 is reframed as **local-first process improvement software for specialists**:

- The primary product object is a private Workspace that can run locally in the browser.
- The competitive target is practical Minitab replacement for common process-improvement work, not a full statistical-suite clone.
- The differentiator is the full loop: Process -> Explore -> Analyze -> Improve -> Control -> Report.
- Azure's role is **distribution/licensing + CoScout** on the customer's Azure OpenAI endpoint — not a data home (ADR-093 D2).
- Collaboration **is** artifact-based: the consultation loop (Ask → Share → Respond → Distill → Accept) plus Analysis Packs and `.vrs` snapshots; future Agent Workspace Bundles. Live project membership, Blob persistence, and shared saved work are **deleted from V1** (ADR-093 D1/D2); multi-user collaboration remains named-future in VariScout Process.
- The product targets **desktop browsers only**; mobile surfaces are deleted (ADR-093 D3).
- One app, three deployments (ADR-093 D4/D5): **free** web (full in-session analysis, **no save/export code** in the bundle — build-time gate); **individual** via Paddle (€17+VAT/mo or €99+VAT/yr — personal artifact layer + BYOK CoScout, hosted behind login); **company** via Azure Marketplace (€120/mo — tenant-wide, tenant-governed CoScout, security review pack).
- AI remains behind a provider boundary. VariScout computes; AI and agents review, draft, critique, and propose.

## Product Model

### Local-first default

The PWA/local browser workflow is the clearest expression of the product:

1. Bring data into the browser.
2. Map the process and define measures/specs.
3. Explore and analyze variation.
4. Convert evidence into actions.
5. Verify Control evidence.
6. Export a credible Analysis Pack.

Durability is file-based: `.vrs` snapshots plus a minimal local autosave cache (so a crash does not eat a session). Azure document durability is removed (ADR-093 D2). On the free deployment, save/export is excluded at build time — analysis is in-session only.

### Artifact-first collaboration

The sharing model is not "invite people into a project." It is "export the right artifact for the right audience" — Analysis Packs can be executive, technical, reproducible, or redacted — **and close the loop**: the [consultation loop](../superpowers/specs/2026-06-11-consultation-loop-design.md) sends a question-carrying pack out over existing enterprise rails (Teams/email/SharePoint) and brings expert knowledge back as structured, analyst-accepted evidence (typed responses deterministically; recorded-call transcripts via CoScout distillation). This gives the analyst control over sensitive data exposure while enabling genuine two-way collaboration with zero recipient accounts.

### Paid channels

Both paid channels carry the artifact layer (`.vrs` save, Analysis Pack /
Consultation Pack export, the consultation loop); they differ on AI governance
and distribution:

- **Individual (Paddle, €17+VAT/mo or €99+VAT/yr):** personal-use license,
  delivered as an **installable desktop PWA** from a dedicated
  Paddle-authenticated app origin — installed to the user's machine,
  offline-capable with a license grace period; the public website carries
  only the free demo. **BYOK CoScout** — the user's own AI key, direct
  browser→provider calls against a supported-provider list, never a
  VariScout-operated proxy (ADR-059). Trainer/launch discount codes are the
  land-motion lever. A true downloadable desktop build (Tauri) is
  named-future.
- **Company (Azure Marketplace, €120/month):** company-approved distribution
  and licensing, tenant-wide use, CoScout on the customer's tenant AI
  endpoint (the IT-sanctioned alternative to shadow-AI personal keys),
  security review pack.

EasyAuth-backed document persistence, managed sharing, and project membership
are **not** part of either list — deleted per ADR-093. The company server
component shrinks to a licensing/auth gate + CoScout proxy.

### Agent boundary

Future agent access should use controlled local bundles or a local MCP server. Tools may expose read-only summaries and proposal operations, but no agent may silently mutate the canonical workspace. Raw rows should be excluded from agent context unless the user deliberately chooses a full export mode.

## Consequences

### Positive

- Stronger trust story: sensitive process data can stay on the analyst's machine by default.
- Clearer Minitab displacement: VariScout replaces the practical analysis-to-report workflow, not every advanced statistical procedure.
- Dramatically lower V1 complexity: live collaboration, ACL, and cloud-persistence surfaces are deleted rather than maintained as options (ADR-093).
- Stronger future posture: local LLM and Claude Code/MCP integrations can use the same deterministic analysis boundary.
- Better sharing wedge: polished HTML Analysis Packs can replace manual PowerPoint/PDF reporting.

### Harder

- Shipped Azure collaboration/persistence work is deleted, including fresh code (PO-8b conflict machinery, R6e ACL enforcement) — recorded eyes-open in ADR-093.
- Artifact-first collaboration requires excellent export/redaction design before it can replace live shared projects in buyer perception.
- File-based workflows put more responsibility on users for where they save and share packs.
- MCP/local LLM support must stay named-future until there is real implementation and security review.

## Relationship To Prior Decisions

ADR-082 still stands: V1 remains the specialist product, and VariScout Process remains the future enterprise platform. This ADR changes the V1 center of gravity from "project tool with invited team" to "local-first process improvement workspace with optional formalization and services."

ADR-091 is amended in effect: `.vrs` remains the portable analysis aggregate and rises to product strategy, but tier 2 (durable Azure documents) is deleted per ADR-093 D2.

ADR-059 still stands: no VariScout-operated customer-data cloud. This ADR makes the browser/local path the default posture.

ADR-093 (same day) records the engineering consequences: the collaboration, Azure-persistence, and mobile deletion programs, the one-app convergence, and the build-time free/paid gate.

## Links

- [Local-first product vision spec](../superpowers/specs/2026-06-11-local-first-variscout-product-vision-design.md)
- [ADR-093: V1 simplification cuts](adr-093-v1-simplification-cuts.md)
- [Consultation-loop design spec](../superpowers/specs/2026-06-11-consultation-loop-design.md)
- [ADR-082: Wedge architecture](adr-082-wedge-architecture.md)
- [ADR-091: Two-tier persistence model](adr-091-two-tier-persistence-model.md)
- [ADR-059: Web-first deployment architecture](adr-059-web-first-deployment-architecture.md)
