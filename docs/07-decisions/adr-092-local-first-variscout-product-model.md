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
  - docs/07-decisions/adr-082-wedge-architecture.md
  - docs/07-decisions/adr-091-two-tier-persistence-model.md
  - docs/07-decisions/adr-059-web-first-deployment-architecture.md
---

# ADR-092: Local-first VariScout product model

**Status:** Accepted
**Date:** 2026-06-11

## Context

ADR-082 narrowed VariScout V1 to a specialist project tool and deferred the enterprise process platform. Subsequent product evaluation surfaced a sharper trust and market position: many buyers do not need a live multi-user project platform first. They need a private, practical alternative to the Minitab + Excel + PowerPoint workflow that runs in their company environment, keeps sensitive process data local by default, and produces credible evidence for decisions.

The security review discussion on 2026-06-11 also showed that customer-tenant Azure deployment helps procurement but does not remove vendor security review. Live project membership, Blob sync, and ACLs add valuable capabilities, but they also add questions about access, offboarding, audit logs, and shared data exposure. For V1 validation, the lower-friction path is a local-first product whose collaboration model starts with controlled share artifacts.

At the same time, local and company-approved AI tooling is becoming a plausible future path. VariScout should preserve a provider boundary for no-AI, customer Azure AI, future local LLM, and optional local MCP agent access without moving statistical authority away from the deterministic engine.

## Decision

VariScout V1 is reframed as **local-first process improvement software for specialists**:

- The primary product object is a private Workspace that can run locally in the browser.
- The competitive target is practical Minitab replacement for common process-improvement work, not a full statistical-suite clone.
- The differentiator is the full loop: Process -> Explore -> Analyze -> Improve -> Control -> Report.
- Azure is primarily a trusted distribution/licensing and optional customer-tenant service path, not the product center.
- Collaboration defaults to share artifacts: Analysis Packs, `.vrs` snapshots, and future Agent Workspace Bundles.
- Live project membership, Blob persistence, customer Azure AI, and shared saved work remain optional capabilities for customers that need them.
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

Durability is file-based by default through `.vrs` and share/export artifacts. Azure durability is optional.

### Artifact-first collaboration

The default sharing model is not "invite people into a project." It is "export the right artifact for the right audience." Analysis Packs can be executive, technical, reproducible, or redacted. This gives the analyst control over sensitive data exposure while still enabling comments, review, and decision-making.

### Optional services

Azure services remain valuable for:

- company-approved distribution and licensing;
- EasyAuth and customer-tenant storage for customers that want managed persistence;
- customer Azure AI for CoScout;
- future managed sharing or project membership.

These services should be framed as optional expansions from the local-first core.

### Agent boundary

Future agent access should use controlled local bundles or a local MCP server. Tools may expose read-only summaries and proposal operations, but no agent may silently mutate the canonical workspace. Raw rows should be excluded from agent context unless the user deliberately chooses a full export mode.

## Consequences

### Positive

- Stronger trust story: sensitive process data can stay on the analyst's machine by default.
- Clearer Minitab displacement: VariScout replaces the practical analysis-to-report workflow, not every advanced statistical procedure.
- Lower V1 complexity: live collaboration and ACL-heavy surfaces become optional rather than the first proof of value.
- Stronger future posture: local LLM and Claude Code/MCP integrations can use the same deterministic analysis boundary.
- Better sharing wedge: polished HTML Analysis Packs can replace manual PowerPoint/PDF reporting.

### Harder

- Azure app docs and shipped Azure work need careful language: preserve capability without making it the default product center.
- Artifact-first collaboration requires excellent export/redaction design before it can replace live shared projects in buyer perception.
- File-based workflows put more responsibility on users for where they save and share packs.
- MCP/local LLM support must stay named-future until there is real implementation and security review.

## Relationship To Prior Decisions

ADR-082 still stands: V1 remains the specialist product, and VariScout Process remains the future enterprise platform. This ADR changes the V1 center of gravity from "project tool with invited team" to "local-first process improvement workspace with optional formalization and services."

ADR-091 still stands: `.vrs` remains the portable analysis aggregate. This ADR raises `.vrs` and Analysis Packs from implementation detail to product strategy.

ADR-059 still stands: no VariScout-operated customer-data cloud. This ADR makes the browser/local path the default posture and keeps customer-tenant Azure as optional service infrastructure.

## Links

- [Local-first product vision spec](../superpowers/specs/2026-06-11-local-first-variscout-product-vision-design.md)
- [ADR-082: Wedge architecture](adr-082-wedge-architecture.md)
- [ADR-091: Two-tier persistence model](adr-091-two-tier-persistence-model.md)
- [ADR-059: Web-first deployment architecture](adr-059-web-first-deployment-architecture.md)
