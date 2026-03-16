# Architecture Decision Records

This section captures key architectural decisions made during VariScout development. Each decision includes context, the decision made, and consequences.

---

## Decision Log

| ID                                                   | Title                                    | Status     | Date       |
| ---------------------------------------------------- | ---------------------------------------- | ---------- | ---------- |
| [001](adr-001-monorepo.md)                           | Monorepo with pnpm                       | Accepted   | 2024-01-15 |
| [002](adr-002-visx-charts.md)                        | Visx for Charts                          | Accepted   | 2024-01-20 |
| [003](adr-003-indexeddb.md)                          | IndexedDB for Storage                    | Accepted   | 2024-02-01 |
| [004](adr-004-offline-first.md)                      | Offline-First                            | Accepted   | 2024-02-05 |
| [005](adr-005-props-based-charts.md)                 | Props-Based Charts                       | Accepted   | 2024-02-15 |
| [006](adr-006-edition-system.md)                     | Edition System                           | Superseded | 2024-03-01 |
| [007](adr-007-azure-marketplace-distribution.md)     | Azure Marketplace Distribution           | Accepted   | 2026-02-05 |
| [008](adr-008-website-content-architecture.md)       | Website Content Architecture             | Accepted   | 2026-02-13 |
| [009](adr-009-boxplot-violin-mode.md)                | Boxplot Violin Mode                      | Accepted   | 2026-02-16 |
| [010](adr-010-gagerr-deferral.md)                    | Gage R&R Deferral                        | Superseded | 2026-02-16 |
| [011](adr-011-ai-development-tooling.md)             | AI Development Tooling                   | Accepted   | 2026-02-18 |
| [012](adr-012-pwa-browser-only.md)                   | PWA Browser-Only, Zero Data              | Accepted   | 2026-02-18 |
| [013](adr-013-architecture-evaluation-ddd-swarms.md) | Architecture Evaluation (DDD/Swarms)     | Accepted   | 2026-02-18 |
| [014](adr-014-regression-deferral.md)                | Defer Regression to Phase 2              | Accepted   | 2026-02-25 |
| [015](adr-015-investigation-board.md)                | Investigation Board                      | Accepted   | 2026-02-26 |
| [016](adr-016-teams-integration.md)                  | Teams Integration                        | Accepted   | 2026-02-27 |
| [017](adr-017-fluent-design-alignment.md)            | Fluent 2 Design Principle Alignment      | Accepted   | 2026-03-02 |
| [018](adr-018-channel-mention-workflow.md)           | Channel @Mention Workflow                | Accepted   | 2026-03-05 |
| [019](adr-019-ai-integration.md)                     | AI Integration (Azure App)               | Accepted   | 2026-03-14 |
| [020](adr-020-investigation-workflow.md)             | Investigation Workflow                   | Accepted   | 2026-03-15 |
| [021](adr-021-security-evaluation.md)                | Security Evaluation (Teams)              | Accepted   | 2026-02-27 |
| [022](adr-022-knowledge-layer-architecture.md)       | Knowledge Layer Architecture             | Accepted   | 2026-03-16 |
| [023](adr-023-data-lifecycle.md)                     | Verification Experience & Data Lifecycle | Accepted   | 2026-03-16 |

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

## Other Documents

| Document                                                               | Description                          |
| ---------------------------------------------------------------------- | ------------------------------------ |
| [State of Product Audit (Feb 2026)](audit-2026-02-state-of-product.md) | Comprehensive product audit snapshot |
