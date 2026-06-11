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
  - docs/07-decisions/adr-093-v1-simplification-cuts.md
  - docs/superpowers/specs/2026-06-11-consultation-loop-design.md
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

> **Accepted design - 2026-06-11, amended same day by the owner review.** This spec reframes VariScout V1 as a local-first process improvement workspace. The original draft kept Azure persistence and project membership as optional capabilities; the accepted scope **deletes** them ([ADR-093](../../07-decisions/adr-093-v1-simplification-cuts.md)): Azure = distribution + CoScout only, desktop-only hard cut, one app / two deployments, build-time free/paid gate, and collaboration = the [consultation loop](2026-06-11-consultation-loop-design.md). Durable decisions: [ADR-092](../../07-decisions/adr-092-local-first-variscout-product-model.md) + [ADR-093](../../07-decisions/adr-093-v1-simplification-cuts.md).

## Summary

VariScout's V1 center moves from "Azure project collaboration tool" to:

> **Private local-first process improvement workspace for specialists who need a practical Minitab alternative.**

The product still carries the full improvement loop:

```text
Process -> Explore -> Analyze -> Improve -> Control -> Report
```

The shift is about the product's default posture. A user should be able to run the valuable work locally in a browser: bring data, map the process, find variation, record findings, decide actions, verify Control evidence, and export a beautiful evidence pack. Azure's role is company-approved distribution/licensing plus CoScout on the customer's AI endpoint. Azure document storage, project membership, and live collaboration are **deleted from V1** (ADR-093) — collaboration happens through the consultation loop and Analysis Packs. The product targets desktop browsers only.

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

- the browser is the primary runtime (desktop browsers only — mobile is unsupported per ADR-093 D3);
- raw data processing happens locally;
- `.vrs` is the workspace snapshot; durability is file-based plus a minimal local autosave cache — there is no cloud document store;
- Azure approves, licenses, and distributes the paid deployment and hosts the customer's CoScout AI endpoint; it is not a data home.

The free deployment is the product promise made tangible: full in-session analysis with **no save/export in the bundle** (build-time gate, ADR-093 D5). The paid channels (individual via Paddle; company via Marketplace) add the artifact layer (`.vrs`, packs, the consultation loop) and CoScout — BYOK for individuals, tenant-governed for companies.

### Process context is the Minitab gap

The Process tab is central to the new positioning. Minitab analyzes a dataset; VariScout analyzes the process behind the dataset. Process maps, step context, measures, specs, factors, findings, actions, and Control evidence belong in one workspace so the analyst can tell the full improvement story.

## Distribution Model

V1 is **one desktop web app with three deployments** (ADR-093 D4/D5):

| Deployment                                    | Role                                                        | Data location                                 | What's in the bundle                                                                                                                                                                                                             |
| --------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Free web deployment                           | Try, train, evaluate — full in-session analysis             | Browser session only                          | Upload/paste in; **no save/export code** (build-time gate); no AI; no account.                                                                                                                                                   |
| Individual (Paddle, €17+VAT/mo or €99+VAT/yr) | Personal real work — consultants, freelance belts, trainees | Browser/local files (`.vrs` + local autosave) | Installable desktop PWA from a Paddle-authenticated app origin (offline-capable, license grace period); artifact layer (`.vrs`, packs, consultation loop); **BYOK CoScout** (own key, direct browser→provider, no vendor proxy). |
| Company (Marketplace, €120/mo target)         | Company-approved real work, tenant-wide                     | Browser/local files (`.vrs` + local autosave) | Runs in the customer's tenant; Marketplace licensing; artifact layer; CoScout on the tenant's IT-governed Azure AI endpoint; security review pack.                                                                               |

The boundary message: **"analyze free; keep, share, and consult on your work = paid."** The paid product runs on the user's machine or in the customer's tenant — the public website carries only the free demo. A named, deliberate regression: the free deployment is weaker than the 2026-06 shipped PWA (which has `.vrs` export today). `apps/azure` and `apps/pwa` converge into the single app after the ADR-093 deletion sweeps; a true downloadable desktop build (Tauri) is named-future.

## Collaboration Model

V1 collaboration **is** the closed consultation loop — **Ask → Share → Respond → Distill → Accept** (full design: [consultation-loop spec](2026-06-11-consultation-loop-design.md)):

- Analysts export question-carrying Consultation Packs; recipients read, click through, and respond — typed answers in the pack or a recorded Teams walk-through — without a VariScout account.
- Returning knowledge imports as proposed insights the analyst explicitly accepts into the investigation with provenance (typed responses deterministically; transcripts via CoScout distillation).
- Live project membership is **deleted from V1** (ADR-093 D1); multi-user workspaces remain named-future in VariScout Process. "Sponsor" survives as a pack audience, not a role.
- A named future stage: gate reviews as routing events — each Consulted/Informed person gets the audience-appropriate pack.

This lowers security review burden because both directions of the share surface are controlled artifacts riding the customer's existing rails (Teams/email/SharePoint), not a multi-user data application.

## Analysis Pack

An **Analysis Pack** is a self-contained export family for sharing process improvement work.

| Pack                | Audience                             | Contents                                                                                                                            |
| ------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Executive HTML pack | Sponsor, manager, customer, supplier | Polished summary, selected charts, findings, actions, Control outcome; no raw rows.                                                 |
| Technical HTML pack | Engineer, Black Belt, auditor        | Full chart set, methods, assumptions, computed tables, evidence trace.                                                              |
| Reproducible pack   | Analyst or internal reviewer         | Technical pack plus embedded or linked `.vrs` snapshot for re-opening the workspace.                                                |
| Redacted pack       | External sharing                     | Sensitive labels/raw rows removed or generalized before export.                                                                     |
| Consultation pack   | SME / domain expert                  | Selected views + anchored questions with inline answer boxes + "Download my responses"; the outbound half of the consultation loop. |

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
- `customer-azure`: customer Azure OpenAI / Foundry endpoint (company tier; IT-governed).
- `byok`: the individual user's own AI key — direct browser→provider calls against a supported-provider list; never a VariScout-operated proxy (ADR-059).
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

- ~~Do not delete Azure app docs or current implementation.~~ **Superseded same day by ADR-093:** the collaboration, Azure-persistence, and mobile layers ARE deleted — via grounded deletion sweeps, not doc-time rewrites. L3/L4 docs describing shipped behavior keep documenting the code until each sweep lands, carrying a "scheduled for deletion (ADR-093)" marker.
- ~~Do not remove Project membership from code or docs that describe shipped behavior.~~ **Superseded same day by ADR-093 D1** (same discipline as above).
- Do not promise local LLM support as shipped V1 behavior.
- Do not make MCP a launch blocker.
- Do not broaden statistical scope into a full Minitab clone.
- Do not build the Graph API transcript auto-fetch or gate-review routing in V1 (consultation-loop spec non-goals).
