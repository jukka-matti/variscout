---
tier: living
purpose: design
title: Project Persistence
audience: human
category: data
status: active
related: [indexeddb, blob-storage, browser-cache, analysis-state]
layer: L3
kind: infrastructure
serves:
  - docs/02-journeys/ia-nav-model.md
last-reviewed: 2026-05-18
---

# Project Persistence

How VariScout saves and restores analyst workflow state — instantly to IndexedDB, and asynchronously to customer-tenant Blob Storage for Team sharing. The PWA is session-only (training tool); the Azure App persists.

## Problem

An analyst's `AnalysisState` is the working position of a Six Sigma project: selected factors, filters, display toggles, axis settings, custom column names, process context, and where in the workspace they were last looking. Losing that on a refresh is unacceptable for paid work. Sharing it across a team requires a portable serialization. Persisting it across schema changes requires a backward-compatibility contract that doesn't slow down weekly schema iterations.

## Capability claim

Every Azure session writes `AnalysisState` to IndexedDB on each change (instant) and syncs to customer-tenant Blob Storage for Team membership (background). The `.vrs` file format is plain JSON — portable across browsers and machines. Old `.vrs` files load without error: every new field is optional with a safe default. Data evolution (add rows, add columns, remove factors, edit cells) follows documented staleness rules: additive changes never invalidate; subtractive changes clean dependent state; mutations preserve Findings but flag for review.

## Intent diagram

This is **infrastructure** — no analyst-facing surface. The persistence engine sits beneath every workspace.

```
no surface — see L4 design doc
```

Rationale: the persistence engine has no UI of its own. It serializes and rehydrates state on behalf of every workspace; users only experience it indirectly (save indicator, project list, .vrs export). The L4 doc holds the schema, save/load flow, and data-evolution rules.

## Capability surfaces by product

| Product   | Persistence Model                          | File Format |
| --------- | ------------------------------------------ | ----------- |
| PWA       | Session-only (React state, no storage)     | N/A         |
| Azure App | IndexedDB + Blob sync for Team (.vrs JSON) | `.vrs`      |

The PWA is a free training tool — data lives in memory and is lost on page refresh. The Azure App persists full project state to IndexedDB (instant) and syncs Team work to Blob Storage (background).

## Privacy invariants

- **All data stays local** — never sent to VariScout servers.
- **No telemetry** — no usage tracking.
- **Blob sync** — Team data syncs to customer-tenant Blob Storage only (Azure App only).
- **Clear = Gone** — clearing browser data deletes local projects.

## Acceptance signals

- A new Azure session round-trips: save → reload → identical workspace position.
- An older `.vrs` file (pre-`processContext`, pre-`filterStack`, pre-`viewState`) loads without error and defaults safely.
- Adding rows / columns / factors never invalidates an existing filter or view state.
- Removing a factor cleans dependent filterStack entries and resets viewState factor references.

## Export / import

| Format | Contains                         | Use Case             |
| ------ | -------------------------------- | -------------------- |
| `.vrs` | Full AnalysisState (JSON)        | Project backup/share |
| `.csv` | Raw data only                    | Data portability     |
| `.png` | Chart screenshot (2x resolution) | Reports              |
| `.svg` | Chart vector export              | Print/presentations  |

## Out of scope

- PWA persistence (intentional — training tool boundary).
- Sending data to VariScout-operated servers (browser-only invariant from ADR-059).
- Per-field migration helpers in V1 (default-on-missing is enough until users exist; strict-assert is the future direction).

## Engineering detail

See [`05-technical/persistence-engine.md`](../../05-technical/persistence-engine.md) for the `AnalysisState` schema table, save/load sequence, backward-compatibility contract, data-evolution rules, and testing strategy.

## See Also

- [Blob Storage Sync](../../08-products/azure/blob-storage-sync.md) — Azure-specific sync mechanism
- [ADR-072: Process Hub Storage and CoScout Context](../../07-decisions/adr-072-process-hub-storage-and-coscout-context.md) — Current storage/context stance
- [PWA Session Model](../../08-products/pwa/index.md#session-model) — Why the PWA doesn't persist
