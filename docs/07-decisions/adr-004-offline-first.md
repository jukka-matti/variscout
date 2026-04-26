---
title: 'ADR-004: Offline-First Architecture'
---

# ADR-004: Offline-First Architecture

**Status**: Accepted for PWA and local-cache behavior. Amended by [ADR-059](adr-059-web-first-deployment-architecture.md) and [ADR-072](adr-072-process-hub-storage-and-coscout-context.md) for Azure Team storage and Process Hub context.

**Date**: 2024-02-05

---

## Context

Quality professionals often work in manufacturing environments with unreliable network connectivity. The tool must work without internet access after initial installation.

---

## Decision

Implement offline-capable browser architecture:

1. **No backend required**: All statistical processing in browser
2. **Service Worker**: Cache app shell and assets
3. **Local persistence/cache**: PWA remains session-only; Azure Standard uses IndexedDB persistence; Azure Team uses IndexedDB as the browser cache/resilience layer
4. **Shared sync path**: Azure Team shared work uses customer-tenant Blob Storage under ADR-059/ADR-072, not OneDrive

---

## Consequences

### Benefits

- Works in low/no connectivity environments
- No server costs or maintenance
- Data privacy (browser processing, customer-owned storage)
- Instant load after first visit

### Trade-offs

- Cross-device/team sync requires a customer-tenant shared store
- Limited to browser's computational capabilities
- Updates require service worker refresh cycle

---

## See Also

- [Offline-First Architecture](../05-technical/architecture/offline-first.md)
- [PWA Session Model](../08-products/pwa/index.md#session-model)
