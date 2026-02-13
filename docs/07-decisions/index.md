# Architecture Decision Records

This section captures key architectural decisions made during VariScout development. Each decision includes context, the decision made, and consequences.

---

## Decision Log

| ID                                               | Title                          | Status     | Date       |
| ------------------------------------------------ | ------------------------------ | ---------- | ---------- |
| [001](adr-001-monorepo.md)                       | Monorepo with pnpm             | Accepted   | 2024-01-15 |
| [002](adr-002-visx-charts.md)                    | Visx for Charts                | Accepted   | 2024-01-20 |
| [003](adr-003-indexeddb.md)                      | IndexedDB for Storage          | Accepted   | 2024-02-01 |
| [004](adr-004-offline-first.md)                  | Offline-First                  | Accepted   | 2024-02-05 |
| [005](adr-005-props-based-charts.md)             | Props-Based Charts             | Accepted   | 2024-02-15 |
| [006](adr-006-edition-system.md)                 | Edition System                 | Superseded | 2024-03-01 |
| [007](adr-007-azure-marketplace-distribution.md) | Azure Marketplace Distribution | Accepted   | 2026-02-05 |
| [008](adr-008-website-content-architecture.md)   | Website Content Architecture   | Accepted   | 2026-02-13 |

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

## Pending Decisions

### ADR-009: Testing Strategy (Proposed)

See `05-technical/implementation/testing.md` for current approach. May formalize as ADR.

### ADR-010: State Management Pattern (Proposed)

Currently using React Context. May evaluate alternatives if complexity grows.
