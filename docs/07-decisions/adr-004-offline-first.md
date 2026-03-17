# ADR-004: Offline-First Architecture

**Status**: Accepted

**Date**: 2024-02-05

---

## Context

Quality professionals often work in manufacturing environments with unreliable network connectivity. The tool must work without internet access after initial installation.

---

## Decision

Implement offline-first architecture:

1. **No backend required**: All statistical processing in browser
2. **Service Worker**: Cache app shell and assets
3. **Local-first data**: All data stays in IndexedDB
4. **Optional sync**: Azure app can sync to OneDrive when online

---

## Consequences

### Benefits

- Works in low/no connectivity environments
- No server costs or maintenance
- Data privacy (stays on user's device)
- Instant load after first visit

### Trade-offs

- Can't do cross-device sync without explicit cloud integration
- Limited to browser's computational capabilities
- Updates require service worker refresh cycle

---

## See Also

- [Offline-First Architecture](../05-technical/architecture/offline-first.md)
- [PWA Session Model](../08-products/pwa/index.md#session-model)
