---
title: 'Export'
purpose: design
tier: living
status: draft
audience: human
layer: L3
kind: workflow
serves:
  - docs/02-journeys/index.md
last-reviewed: 2026-05-18
---

> **L3 feature stub** — created 2026-05-18 as part of M0 SDD migration inventory (Option A). Body to be expanded in M3 audit or on next feature edit.

# Export

## Problem

Analysts and process owners need to take findings out of the browser session for sharing, archiving, and import into other tools — without losing the spec-status, provenance, or hub-level context that VariScout has reconstructed.

## Capability claim

VariScout serializes outbound state across three channels: CSV via `@variscout/core/export` (`escapeCSVValue` neutralizes formula injection; `getSpecStatus` stamps PASS/FAIL_USL/FAIL_LSL per row), chart-region PDF/PNG via the Azure app's chart-export plumbing, and the portable `.vrs` JSON file via `packages/core/src/serialization/vrsFormat.ts` (`VRS_VERSION = '1.0'`, full `ProcessHub` blob + optional `rawData`).

## Intent diagram

TBD — Mermaid data-flow to be added in M3 audit or on next edit.

## Acceptance signals

TBD — testable conditions to be added on next edit. See related tests at `packages/core/src/serialization/__tests__/roundtrip.test.ts` for current `.vrs` round-trip verification.

## Out of scope / non-goals

TBD.

## Links

- **Code**: `packages/core/src/export.ts`, `packages/core/src/serialization/vrsFormat.ts`, `packages/core/src/serialization/vrsExport.ts`, `packages/core/src/serialization/vrsImport.ts`
- **Tests**: `packages/core/src/serialization/__tests__/roundtrip.test.ts`
- **Related**: `docs/03-features/data/storage.md`, `docs/03-features/data/validation.md`
