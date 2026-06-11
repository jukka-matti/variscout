---
tier: ephemeral
purpose: design
title: 'Local-first VariScout product vision'
audience: human
category: design-spec
status: active
date: 2026-06-11
last-verified: 2026-06-11
related:
  - docs/07-decisions/adr-092-local-first-variscout-product-model.md
  - docs/07-decisions/adr-082-wedge-architecture.md
  - docs/07-decisions/adr-091-two-tier-persistence-model.md
layer: spec
implements:
  - docs/01-vision/product-overview.md
  - docs/01-vision/business-bible.md
  - docs/01-vision/positioning.md
  - docs/DATA-FLOW.md
  - docs/03-features/data/export.md
  - docs/03-features/workflows/report.md
---

# Local-first VariScout product vision

> **Accepted design - 2026-06-11.** This spec reframes VariScout V1 as a local-first process improvement workspace: private analysis first, Azure as optional distribution/licensing and customer-tenant services, collaboration by share artifacts before live multi-user projects. The durable decision is recorded in [ADR-092](../../07-decisions/adr-092-local-first-variscout-product-model.md).

## Summary

VariScout's V1 center moves from "Azure project collaboration tool" to:

> **Private local-first process improvement workspace for specialists who need a practical Minitab alternative.**

The product still carries the full improvement loop:

```text
Process -> Explore -> Analyze -> Improve -> Control -> Report
```

The shift is about the product's default posture. A user should be able to run the valuable work locally in a browser: bring data, map the process, find variation, record findings, decide actions, verify Control evidence, and export a beautiful evidence pack. Azure remains useful for company-approved distribution/licensing and optional customer-tenant services, but Azure storage, project membership, and live collaboration are no longer the center of the V1 pitch.

## Product Thesis

### Practical Minitab replacement, not statistical-suite clone

The competitive target is the daily improvement workflow that often spans Minitab, Excel, PowerPoint, and email:

1. Import process data.
2. Understand variation.
3. Compare factors and process steps.
4. Check capability, stability, and evidence strength.
5. Decide what to change.
6. Verify whether the change held.
7. Share a credible report.

VariScout does not need to match every Minitab test. It wins by making the common variation-investigation loop faster, more guided, more connected to the process, and more report-ready.

### Local-first by default

Local-first means:

- the browser is the primary runtime;
- raw data processing happens locally;
- `.vrs` remains the portable workspace snapshot;
- durable cloud services are optional, not required for the product to make sense;
- Azure can approve, license, distribute, and optionally host customer-tenant services without becoming the default data center of gravity.

The free PWA is therefore not only a funnel. It is the clearest expression of the product promise.

### Process context is the Minitab gap

The Process tab is central to the new positioning. Minitab analyzes a dataset; VariScout analyzes the process behind the dataset. Process maps, step context, measures, specs, factors, findings, actions, and Control evidence belong in one workspace so the analyst can tell the full improvement story.

## Distribution Model

V1 should support three product postures:

| Posture | Role | Data location | Notes |
| --- | --- | --- | --- |
| Public PWA | Try, train, and perform local analysis | Browser session + `.vrs` files | No account, no backend, no AI requirement. |
| Company-approved local app | Approved use inside a company environment | Browser/local files by default | May be distributed/licensed through Azure or an equivalent IT-approved route. |
| Optional customer-tenant services | Persistence, customer AI, governance, shared saved work | Customer Azure tenant | Azure Blob, EasyAuth, CoScout, and membership remain optional capabilities. |

This preserves the current Azure work but changes the story: Azure is an optional company-controlled service layer, not the default reason to buy.

## Collaboration Model

V1 collaboration should be artifact-first:

- Analysts share Analysis Packs instead of inviting people into a live project by default.
- Recipients can read, comment, print, and return feedback without needing a VariScout account.
- Formal project membership remains available or future-facing for customers that need managed shared workspaces.

This lowers security review burden because the default share surface is a controlled export, not a multi-user data application.

## Analysis Pack

An **Analysis Pack** is a self-contained export family for sharing process improvement work.

| Pack | Audience | Contents |
| --- | --- | --- |
| Executive HTML pack | Sponsor, manager, customer, supplier | Polished summary, selected charts, findings, actions, Control outcome; no raw rows. |
| Technical HTML pack | Engineer, Black Belt, auditor | Full chart set, methods, assumptions, computed tables, evidence trace. |
| Reproducible pack | Analyst or internal reviewer | Technical pack plus embedded or linked `.vrs` snapshot for re-opening the workspace. |
| Redacted pack | External sharing | Sensitive labels/raw rows removed or generalized before export. |

The quality bar is a polished standalone interactive HTML artifact: responsive, printable, navigable, and beautiful enough to replace a hand-built PowerPoint deck. The Kesko HTML file from the 2026-06-11 design conversation is a reference for quality and structure, not a template to copy.

## Agent Workspace Bundle

The **Agent Workspace Bundle** is a future-facing share format for companies already using Claude Code, local LLM tools, or approved internal agents.

```text
workspace/
  workspace.vrs
  report-draft.html
  findings.md
  actions.md
  control-plan.md
  charts/
  comments.json
  AGENT_GUIDE.md
```

The bundle lets an agent review evidence, draft narrative, check consistency, propose actions, or create redacted packs without giving the agent direct write access to the live workspace.

## AI And MCP Boundary

AI remains a collaborator, never the authority.

Provider boundary:

- `none`: deterministic stats only.
- `customer-azure`: customer Azure OpenAI / Foundry endpoint.
- `local-llm`: future on-device or local-network model.
- `mcp-agent`: local MCP surface for Claude Code or company-approved agents.

Rules:

- VariScout computes statistics, control limits, capability, factor comparisons, and report data.
- Agents read computed results and propose narrative, critique, actions, Control plans, and share-pack variants.
- No agent silently mutates canonical workspace state.
- Raw rows are excluded from agent context unless the user chooses a full bundle/export mode.

## Deltas

### `docs/01-vision/product-overview.md`

Reposition V1 from "project tool with invited team" to "local-first private Workspace for process improvement." Keep Project as a formalization layer, not the default product center.

### `docs/01-vision/business-bible.md`

Update the strategic bet, privacy hypothesis, free-PWA hypothesis, and pricing/distribution hypothesis around local-first adoption and Azure as optional distribution/services.

### `docs/01-vision/positioning.md`

Sharpen public language around practical Minitab replacement, process context, and artifact-first sharing.

### `docs/DATA-FLOW.md`

Clarify that local browser processing and `.vrs` are the default; Azure Blob and AI calls are optional customer-tenant services.

### `docs/03-features/data/export.md`

Expand export from the current stub into Analysis Pack export design.

### `docs/03-features/workflows/report.md`

Align Report with self-contained HTML evidence packs and explain that print/PDF remains a derived share mode.

## Non-Goals

- Do not delete Azure app docs or current implementation.
- Do not remove Project membership from code or docs that describe shipped behavior.
- Do not promise local LLM support as shipped V1 behavior.
- Do not make MCP a launch blocker.
- Do not broaden statistical scope into a full Minitab clone.
