---
title: 'ADR-013: Architecture Evaluation — DDD and AI Swarms'
---

# ADR-013: Architecture Evaluation — DDD and AI Swarms

**Status:** Accepted
**Date:** 2026-02-18
**Deciders:** Product team

## Context

After updating ruflo (formerly claude-flow) to v3alpha (ADR-011), we evaluated whether two architectural approaches could benefit VariScout:

1. **Domain-Driven Design (DDD)** — tactical patterns (aggregates, repositories, domain events, value objects) applied to the existing package structure.
2. **AI swarm orchestration** — multi-agent coordination as an architectural layer for the application itself, or as a development workflow tool.

The evaluation was prompted by ruflo's expanded swarm capabilities and its DDD-oriented internal architecture.

## Decision

**Keep the current package-per-layer architecture. Do not adopt DDD tactical patterns. Use AI swarms for three specific development workflows only.**

### Why the current architecture already embodies DDD's valuable principles

VariScout's monorepo structure already implements the most impactful DDD concepts:

- **Pure domain layer** — `@variscout/core` contains statistics, parsing, tier logic, and glossary with zero React or UI dependencies. This is equivalent to a DDD domain layer.
- **Ubiquitous language** — Domain terms (Cpk, eta-squared, control limits, specification limits) are used consistently from types through to UI labels. The glossary system (`packages/core/src/glossary/`) formalizes this.
- **Bounded contexts via packages** — Each package (`core`, `charts`, `hooks`, `ui`, `data`) has clear responsibilities and one-way dependency flow. `core` never imports from `charts`; apps never leak into packages.
- **Single Responsibility** — `stats.ts` was split into 13 domain modules (`packages/core/src/stats/`) for maintainability, mirroring DDD's module pattern.

### Why tactical DDD would be over-engineering

- **No concurrent writes** — VariScout is a single-user, offline-first browser application. There are no competing transactions, eventual consistency concerns, or distributed state conflicts that DDD aggregates are designed to manage.
- **Algorithmic complexity, not domain-invariant complexity** — The hard problems in VariScout are statistical (KDE, ANOVA, regression) not domain-invariant (business rule enforcement across entity clusters). Aggregates and domain events add ceremony without solving real problems.
- **No persistence abstraction needed** — Data flows one-way: file/paste → parse → context → charts. There is no ORM, no database schema evolution, no repository pattern benefit over the current `useDataState` hook.
- **5-package monorepo** — The codebase is small enough that package boundaries provide sufficient modularity. Adding DDD layers inside packages would create indirection without reducing coupling.

### Swarm workflows adopted (development tooling only)

Three swarm patterns have practical value as **development workflows**, not as application architecture:

1. **Parallel test execution** — Run vitest across all 5 packages concurrently using Task agents. Faster feedback than sequential `pnpm test`.
2. **Security scanning** — Targeted OWASP scans on Azure auth (`easyAuth.ts`) and storage (`storage.ts`) modules using ruflo security tools.
3. **Read-only code review** — Multi-agent review of cross-package changes (e.g., a new shared hook touching `core`, `hooks`, and both apps) without modifying code.

These workflows use existing ruflo capabilities and Claude Code Task agents. No new configuration files or runtime dependencies are added.

## Consequences

### Positive

- **Documented rationale** — Future contributors can understand why DDD was evaluated and rejected, avoiding repeated discussions.
- **Practical swarm value** — Three concrete workflows that reduce development friction without architectural overhead.
- **Architecture validated** — The evaluation confirms the current structure is appropriate for the problem domain and team size.

### Negative

- **Swarm cost** — Multi-agent workflows consume more API tokens than single-agent equivalents. Use judiciously for tasks that genuinely benefit from parallelism.

### Neutral

- **No code changes** — This is a documentation-only decision. No application code, build pipeline, or deployment is affected.
- **Reversible** — If VariScout evolves to require multi-user collaboration or server-side processing, DDD tactical patterns can be reconsidered at that point.

## See Also

- [ADR-011: AI Development Tooling](adr-011-ai-development-tooling.md)
- [ADR-001: Monorepo with pnpm](adr-001-monorepo.md)
- [Architecture Overview](../05-technical/architecture.md)
