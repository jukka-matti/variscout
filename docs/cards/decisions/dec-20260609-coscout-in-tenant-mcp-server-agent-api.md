---
title: 'CoScout in-tenant MCP server over the investigation agent API'
purpose: decide
tier: card
status: named-future
date: 2026-06-09
topic: ['named-future', 'coscout', 'agent-api', 'mcp']
verified-against-commit: 2a564e3bd
last-verified: 2026-06-09
supersedes: []
---

> **Decision card** — named-future added by the CoScout surface + intent redesign implementation. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# CoScout in-tenant MCP server over the investigation agent API

**Source:** `docs/superpowers/specs/2026-06-09-coscout-surface-intent-redesign-design.md`

**Defer date:** 2026-06-09

**Rationale:** The CoScout tool layer is now transport-agnostic so the embedded Azure panel and a future in-tenant MCP server can share the same deterministic investigation API. The MCP server is not V1 scope; it needs customer signal plus headless engine, in-tenant deployment, Entra/OAuth 2.1 delegated auth, and live-UI coordination decisions.

**Where it'd live if built:** Azure in-tenant service boundary exposing the investigation agent API; external agents operate under tenant auth while humans work the visual Wall.
