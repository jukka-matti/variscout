---
title: 'Local-first VariScout product model'
purpose: decide
tier: card
status: active
date: 2026-06-11
topic: ['local-first', 'product', 'pwa', 'azure', 'analysis-pack', 'mcp']
related:
  - docs/07-decisions/adr-092-local-first-variscout-product-model.md
  - docs/superpowers/specs/2026-06-11-local-first-variscout-product-vision-design.md
supersedes: []
---

> **Decision card** — local-first product reframing accepted 2026-06-11. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# Local-first VariScout product model

VariScout V1 is reframed as local-first process improvement software for specialists. The product center is a private Workspace that can run in the browser, not an Azure collaboration platform. Azure remains useful for distribution/licensing and optional customer-tenant services, but the default value is local: Process -> Explore -> Analyze -> Improve -> Control -> Report, with `.vrs` snapshots and polished Analysis Packs as the primary sharing path.

The competitive target becomes practical Minitab displacement: replace the common Minitab + Excel + PowerPoint workflow for variation investigation, action planning, Control verification, and reporting rather than cloning every statistical procedure. The Process tab becomes a strategic differentiator because VariScout analyzes the work system behind the data, not only the dataset.

Collaboration is artifact-first. Analysts should be able to export executive, technical, reproducible, and redacted HTML Analysis Packs before they need live project invites. Future Agent Workspace Bundles and a local VariScout MCP surface can let Claude Code, local LLMs, or company-approved agents review evidence, draft reports, critique logic, and propose actions while VariScout remains the deterministic authority and no agent silently mutates canonical workspace state.

Canonical artifacts: [ADR-092](07-decisions/adr-092-local-first-variscout-product-model.md) and [local-first product vision spec](superpowers/specs/2026-06-11-local-first-variscout-product-vision-design.md).
