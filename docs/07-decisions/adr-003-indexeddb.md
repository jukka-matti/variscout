# ADR-003: IndexedDB for PWA Storage

**Status**: Accepted

**Date**: 2024-02-01

---

## Context

PWA needs to store user data (uploaded files, analysis results, settings) persistently in the browser. Options:

1. **localStorage**: Simple but 5MB limit, synchronous, string-only
2. **IndexedDB**: Complex API but large storage, async, structured data
3. **Cache API**: Designed for HTTP responses, not app data

---

## Decision

Use IndexedDB with a wrapper utility for:

- Uploaded datasets (can be multi-MB)
- Computed statistics cache
- User preferences and settings

Use localStorage only for:

- Small, simple values (theme preference, last-used settings)

---

## Consequences

### Benefits

- Virtually unlimited storage (browser-managed quotas)
- Structured data with indexes for queries
- Async API won't block UI thread
- Survives browser restarts

### Trade-offs

- Complex API requiring wrapper abstraction
- Debugging is harder than localStorage
- Storage can be evicted under pressure

---

## See Also

- [PWA Session Model](../08-products/pwa/index.md#session-model)
