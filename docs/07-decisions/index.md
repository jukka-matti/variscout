---
title: 'Architecture Decision Records'
---

# Architecture Decision Records

**Open decisions and named-future items live in [`../decision-log.md`](../decision-log.md).** This index lists _closed_ architectural decisions (ADRs); the decision log carries open and named-future ones.

This section captures key architectural decisions made during VariScout development. Each decision includes context, the decision made, and consequences.

---

## Decision Log

| ID                                                                 | Title                                                                                                                    | Status     | Date                                                                                       |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------ |
| [001](adr-001-monorepo.md)                                         | Monorepo with pnpm                                                                                                       | Accepted   | 2024-01-15                                                                                 |
| [002](adr-002-visx-charts.md)                                      | Visx for Charts                                                                                                          | Accepted   | 2024-01-20                                                                                 |
| [003](adr-003-indexeddb.md)                                        | IndexedDB for Storage                                                                                                    | Accepted   | 2024-02-01                                                                                 |
| [004](adr-004-offline-first.md)                                    | Offline-First                                                                                                            | Amended    | 2024-02-05 (amended by ADR-059 and ADR-072)                                                |
| [005](adr-005-props-based-charts.md)                               | Props-Based Charts                                                                                                       | Accepted   | 2024-02-15                                                                                 |
| [006](../archive/adrs/adr-006-edition-system.md)                   | Edition System                                                                                                           | Superseded | 2024-03-01 (archived 2026-04-17 → archive/adrs/adr-006-edition-system.md)                  |
| [007](adr-007-azure-marketplace-distribution.md)                   | Azure Marketplace Distribution                                                                                           | Accepted   | 2026-02-05                                                                                 |
| [008](adr-008-website-content-architecture.md)                     | Website Content Architecture                                                                                             | Accepted   | 2026-02-13                                                                                 |
| [009](adr-009-boxplot-violin-mode.md)                              | Boxplot Violin Mode                                                                                                      | Accepted   | 2026-02-16                                                                                 |
| [010](adr-010-gagerr-deferral.md)                                  | Gage R&R Deferral                                                                                                        | Superseded | 2026-02-16                                                                                 |
| [011](adr-011-ai-development-tooling.md)                           | AI Development Tooling                                                                                                   | Accepted   | 2026-02-18                                                                                 |
| [012](adr-012-pwa-browser-only.md)                                 | PWA Browser-Only, Zero Data                                                                                              | Accepted   | 2026-02-18                                                                                 |
| [013](adr-013-architecture-evaluation-ddd-swarms.md)               | Architecture Evaluation (DDD/Swarms)                                                                                     | Accepted   | 2026-02-18                                                                                 |
| [014](adr-014-regression-deferral.md)                              | Defer Regression to Phase 2                                                                                              | Superseded | 2026-02-25                                                                                 |
| [015](adr-015-investigation-board.md)                              | Investigation Board                                                                                                      | Accepted   | 2026-02-26                                                                                 |
| [016](../archive/adrs/adr-016-teams-integration.md)                | Microsoft Teams Integration                                                                                              | Superseded | 2026-02-27 (archived 2026-04-17 → archive/adrs/adr-016-teams-integration.md)               |
| [017](adr-017-fluent-design-alignment.md)                          | Fluent 2 Design Principle Alignment                                                                                      | Accepted   | 2026-03-02                                                                                 |
| [018](../archive/adrs/adr-018-channel-mention-workflow.md)         | Channel @Mention Workflow                                                                                                | Superseded | 2026-03-05 (archived 2026-04-17 → archive/adrs/adr-018-channel-mention-workflow.md)        |
| [019](adr-019-ai-integration.md)                                   | AI Integration (Azure App)                                                                                               | Accepted   | 2026-03-14                                                                                 |
| [020](adr-020-investigation-workflow.md)                           | Investigation Workflow                                                                                                   | Accepted   | 2026-03-15                                                                                 |
| [021](../archive/adrs/adr-021-security-evaluation.md)              | Security Evaluation (Teams)                                                                                              | Superseded | 2026-02-27 (archived 2026-04-26 → archive/adrs/adr-021-security-evaluation.md)             |
| [022](../archive/adrs/adr-022-knowledge-layer-architecture.md)     | Knowledge Layer Architecture                                                                                             | Superseded | 2026-03-16 (archived 2026-04-17 → archive/adrs/adr-022-knowledge-layer-architecture.md)    |
| [023](adr-023-data-lifecycle.md)                                   | Verification Experience & Data Lifecycle                                                                                 | Accepted   | 2026-03-16                                                                                 |
| [024](../archive/adrs/adr-024-scouting-report.md)                  | Scouting Report — Dynamic Report View                                                                                    | Superseded | 2026-03-16 (archived 2026-04-17 → archive/adrs/adr-024-scouting-report.md)                 |
| [025](adr-025-internationalization.md)                             | Internationalization Architecture                                                                                        | Accepted   | 2026-03-17                                                                                 |
| [026](../archive/adrs/adr-026-knowledge-base-sharepoint-first.md)  | Knowledge Base — SharePoint-First                                                                                        | Superseded | 2026-03-17 (archived 2026-04-17 → archive/adrs/adr-026-knowledge-base-sharepoint-first.md) |
| [027](adr-027-ai-collaborator-evolution.md)                        | AI Collaborator Evolution                                                                                                | Accepted   | 2026-03-19                                                                                 |
| [028](adr-028-responses-api-migration.md)                          | Responses API Migration                                                                                                  | Accepted   | 2026-03-19                                                                                 |
| [029](adr-029-ai-action-tools.md)                                  | AI Action Tools for CoScout                                                                                              | Accepted   | 2026-03-19                                                                                 |
| [030](../archive/adrs/adr-030-unified-file-picker.md)              | Unified File Picker (OneDrive v8)                                                                                        | Superseded | 2026-03-19 (archived 2026-04-26 → archive/adrs/adr-030-unified-file-picker.md)             |
| [031](adr-031-report-export.md)                                    | Report Export — Print/PDF for All Azure                                                                                  | Accepted   | 2026-03-19                                                                                 |
| [032](adr-032-evidence-communication.md)                           | Evidence-Based Statistical Communication                                                                                 | Accepted   | 2026-03-19                                                                                 |
| [033](adr-033-pricing-simplification.md)                           | Pricing Simplification — 3 to 2 Tiers                                                                                    | Accepted   | 2026-03-19                                                                                 |
| [034](adr-034-yamazumi-analysis-mode.md)                           | Yamazumi Analysis Mode                                                                                                   | Accepted   | 2026-03-20                                                                                 |
| [035](adr-035-improvement-prioritization.md)                       | Improvement Prioritization Model                                                                                         | Accepted   | 2026-03-20                                                                                 |
| [036](adr-036-no-russian-language.md)                              | No Russian Language                                                                                                      | Accepted   | 2026-03-20                                                                                 |
| [037](adr-037-reporting-workspaces.md)                             | Reporting Workspaces                                                                                                     | Accepted   | 2026-03-20                                                                                 |
| [038](adr-038-subgroup-capability.md)                              | Subgroup Capability Analysis                                                                                             | Accepted   | 2026-03-21                                                                                 |
| [039](adr-039-mobile-performance-architecture.md)                  | Mobile Performance & Async Stats                                                                                         | Accepted   | 2026-03-21                                                                                 |
| [040](adr-040-bicep-migration.md)                                  | Migrate Infrastructure to Bicep                                                                                          | Accepted   | 2026-03-22                                                                                 |
| [041](adr-041-zustand-feature-stores.md)                           | Zustand Feature Stores                                                                                                   | Accepted   | 2026-03-22                                                                                 |
| [042](adr-042-project-dashboard.md)                                | Project Dashboard                                                                                                        | Accepted   | 2026-03-22                                                                                 |
| [043](../archive/adrs/adr-043-teams-entry-experience.md)           | Teams Entry Experience                                                                                                   | Superseded | 2026-03-22 (archived 2026-04-26 → archive/adrs/adr-043-teams-entry-experience.md)          |
| [044](adr-044-architectural-review.md)                             | Architectural Review (Mar 2026)                                                                                          | Accepted   | 2026-03-23                                                                                 |
| [045](adr-045-modular-architecture.md)                             | Modular Architecture (DDD-Lite + FSD)                                                                                    | Accepted   | 2026-03-23                                                                                 |
| [046](adr-046-event-driven-architecture.md)                        | Event-Driven Architecture (mitt bus)                                                                                     | Superseded | 2026-03-23                                                                                 |
| [047](adr-047-analysis-mode-strategy.md)                           | Analysis Mode Strategy Pattern                                                                                           | Accepted   | 2026-03-23                                                                                 |
| [048](adr-048-eslint-boundaries.md)                                | ESLint Boundary Enforcement                                                                                              | Accepted   | 2026-03-23                                                                                 |
| [049](adr-049-coscout-context-and-memory.md)                       | CoScout Knowledge Catalyst                                                                                               | Accepted   | 2026-03-24                                                                                 |
| [050](adr-050-wide-form-stack-columns.md)                          | Wide-Form Data Support — Stack Columns                                                                                   | Accepted   | 2026-03-29                                                                                 |
| [051](adr-051-chart-many-categories.md)                            | Chart Handling for Many Categories                                                                                       | Accepted   | 2026-03-29                                                                                 |
| [052](adr-052-factor-intelligence.md)                              | Factor Intelligence — Progressive Factor Analysis                                                                        | Accepted   | 2026-03-29                                                                                 |
| [053](adr-053-question-driven-investigation.md)                    | Question-Driven Investigation                                                                                            | Accepted   | 2026-03-30                                                                                 |
| [054](adr-054-mode-aware-question-strategy.md)                     | Mode-Aware Question Strategy                                                                                             | Accepted   | 2026-03-31                                                                                 |
| [055](adr-055-workspace-navigation.md)                             | Workspace-Based Navigation                                                                                               | Accepted   | 2026-04-01                                                                                 |
| [056](adr-056-pi-panel-redesign.md)                                | Process Intelligence Panel Redesign                                                                                      | Accepted   | 2026-04-01                                                                                 |
| [057](adr-057-coscout-visual-grounding.md)                         | CoScout Visual Grounding                                                                                                 | Accepted   | 2026-04-01                                                                                 |
| [058](adr-058-deployment-lifecycle.md)                             | Deployment Lifecycle & Self-Service Updates                                                                              | Accepted   | 2026-04-02                                                                                 |
| [059](adr-059-web-first-deployment-architecture.md)                | Web-First Deployment Architecture                                                                                        | Accepted   | 2026-04-02                                                                                 |
| [060](adr-060-coscout-intelligence-architecture.md)                | CoScout Intelligence Architecture                                                                                        | Accepted   | 2026-04-02                                                                                 |
| [061](adr-061-hmw-brainstorm-ideation.md)                          | HMW Brainstorm & Collaborative Ideation                                                                                  | Accepted   | 2026-04-03                                                                                 |
| [062](adr-062-standard-anova-metrics.md)                           | Standard ANOVA Metrics & Category Total SS Removal                                                                       | Accepted   | 2026-04-03                                                                                 |
| [063](adr-063-trust-compliance-roadmap.md)                         | Trust & Compliance Roadmap                                                                                               | Accepted   | 2026-04-03                                                                                 |
| [064](adr-064-suspected-cause-hub-model.md)                        | SuspectedCause Hub Model & Investigation Reframing                                                                       | Accepted   | 2026-04-03                                                                                 |
| [065](adr-065-evidence-map-causal-graph.md)                        | Evidence Map & Causal Graph Visualization                                                                                | Accepted   | 2026-04-05                                                                                 |
| [066](adr-066-evidence-map-investigation-center.md)                | Evidence Map as Investigation Workspace Center                                                                           | Accepted   | 2026-04-05                                                                                 |
| [067](adr-067-unified-glm-regression.md)                           | Unified GLM Regression Engine                                                                                            | Accepted   | 2026-04-05                                                                                 |
| [068](adr-068-coscout-cognitive-redesign.md)                       | CoScout Cognitive Redesign                                                                                               | Accepted   | 2026-04-05                                                                                 |
| [069](adr-069-three-boundary-numeric-safety.md)                    | Three-Boundary Numeric Safety                                                                                            | Accepted   | 2026-04-06                                                                                 |
| [070](adr-070-frame-workspace.md)                                  | FRAME Workspace, Visual Process Map & Mode Inference                                                                     | Accepted   | 2026-04-18                                                                                 |
| [071](adr-071-coscout-voice-input.md)                              | CoScout Voice Input                                                                                                      | Accepted   | 2026-04-24                                                                                 |
| [072](adr-072-process-hub-storage-and-coscout-context.md)          | Process Hub Storage and CoScout Context Boundary                                                                         | Accepted   | 2026-04-26                                                                                 |
| [073](adr-073-no-statistical-rollup-across-heterogeneous-units.md) | No statistical roll-up across heterogeneous units (Watson locality enforced by design absence, not permission predicate) | Accepted   | 2026-04-29                                                                                 |
| [074](adr-074-scout-level-spanning-surface-boundary-policy.md)     | SCOUT level-spanning surface — boundary policy                                                                           | Accepted   | 2026-04-29                                                                                 |
| [075](adr-075-pwa-atomic-deploy-and-update-policy.md)              | PWA atomic deploy + update policy                                                                                        | Accepted   | 2026-05-02                                                                                 |
| [076](adr-076-frame-b0-lightweight-render.md)                      | FRAME b0 lightweight render — investigator vs author archetypes                                                          | Accepted   | 2026-05-02                                                                                 |
| [077](adr-077-snapshot-provenance-and-match-summary-wedge.md)      | Snapshot-level provenance + match-summary wedge for paste-into-existing-Hub                                              | Accepted   | 2026-05-04                                                                                 |

---

## ADR Template

When adding new decisions, use this template:

```markdown
# ADR-XXX: Title

**Status**: Proposed | Accepted | Deprecated | Superseded by ADR-XXX

**Date**: YYYY-MM-DD

## Context

What is the issue we're addressing?

## Decision

What is the change we're proposing?

## Consequences

What becomes easier or harder as a result?
```

---

## Related Design Specs

| Spec                                                                                         | Description                                                                                                                                                                     |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Investigation Spine](../superpowers/specs/2026-04-04-investigation-spine-design.md)         | Three Threads, Five Sentences, One Story — equation display, hub creation, EDA heartbeat, lean what-if, CoScout integration                                                     |
| [FRAME Workspace & Process Map](../superpowers/specs/2026-04-18-frame-process-map-design.md) | FRAME promoted to first-class tab · river-styled SIPOC visual map · data-seeded entry · deterministic mode inference · capability-view storytelling leg · CoScout optional      |
| [CoScout Voice Input v1](../superpowers/specs/2026-04-24-coscout-voice-input-design.md)      | Azure-only transcript-first voice input for CoScout and finding capture, with no durable audio retention                                                                        |
| [Multi-level SCOUT](../superpowers/specs/2026-04-29-multi-level-scout-design.md)             | Level-spanning surface architecture (L1/L2/L3 lensing across SCOUT, FRAME, Hub Capability, Investigation Wall, Evidence Map) + timeline window primitive · companion to ADR-074 |

---

## Other Documents

| Document                                                               | Description                          |
| ---------------------------------------------------------------------- | ------------------------------------ |
| [State of Product Audit (Feb 2026)](audit-2026-02-state-of-product.md) | Comprehensive product audit snapshot |
