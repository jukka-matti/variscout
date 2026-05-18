---
title: 'Web-First Deployment Architecture'
description: 'ADR-059 — FULLY IMPLEMENTED Apr 2 2026. Teams removed, Blob Storage sync live, EasyAuth-only auth.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_web_first_architecture.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Strategic architecture decision: shift VariScout from "Teams app" to "web app deployed via Azure Marketplace."

**Status:** FULLY IMPLEMENTED and merged to main (Apr 2 2026). All branches cleaned up.

**Why:** Enterprise manufacturing CTOs resist `Files.ReadWrite.All` and 4 other admin-consent Graph API scopes. Customer-hosted webapp with EasyAuth (`User.Read` only) eliminates friction.

**What was done (11 commits):**
- Phase 1: Removed Teams SDK, OBO flow, Graph API, @microsoft/teams-js (-6,700 lines)
- Phase 2: Implemented Blob Storage sync (SAS token endpoint, blobClient.ts, storage wiring)
- Infra: New storage.bicep (Storage Account + RBAC), removed functions.bicep, recompiled ARM template
- Review fixes: UUID project IDs (C-1), SAS dedup (C-3), URL redaction (C-5), index race (C-2), LOCAL_DEV guard (I-2), dead code cleanup

**Current Architecture:**
- Auth: EasyAuth only, `User.Read` + `People.Read` (zero admin consent)
- Standard plan: IndexedDB + .vrs file export (unchanged)
- Team plan: IndexedDB + Azure Blob Storage sync via SAS tokens
- Photo capture: Browser `<input type="file" accept="image/*" capture="environment">`
- Assignee picker: Simple text input (AssigneeInput.tsx, replaces Graph-powered PeoplePicker)
- Knowledge Base: Gated behind `KNOWLEDGE_BASE_ENABLED = false` in searchService.ts (deferred)
- Server: `/api/storage-token` POST endpoint generates 1hr container-scoped SAS tokens
- Infra: Storage Account + variscout-projects container + RBAC (Team plan only)

**Key files:**
- `apps/azure/server.js` — /api/storage-token endpoint
- `apps/azure/src/services/blobClient.ts` — client-side Blob operations (raw fetch + SAS)
- `apps/azure/src/services/cloudSync.ts` — wires blobClient to storage.ts interface
- `infra/modules/storage.bicep` — Storage Account + container + RBAC

**How to apply:**
- Design specs: `docs/superpowers/specs/2026-04-02-web-first-*-design.md`
- ADR-059 supersedes ADR-016; ADR-026 approach deferred (KB needs reimplementation)
- Next: Unified KB system (embeddings in Blob Storage) when KNOWLEDGE_BASE_ENABLED is turned on
