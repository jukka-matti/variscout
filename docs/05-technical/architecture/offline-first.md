# Offline-First Architecture

VariScout is designed to work without internet access after the initial load.

---

## Principles

1. **No backend required** — All statistical processing in browser
2. **Service Worker** — Cache app shell and assets
3. **Local-first data** — All data stays in IndexedDB
4. **Optional sync** — Azure Team plan can sync to OneDrive when online (Standard plan uses local-only storage)

---

## Why Offline-First?

Quality professionals often work in:

- Manufacturing floors with limited connectivity
- Remote facilities without reliable internet
- Secure environments where cloud access is restricted

The tool must work reliably in these conditions.

---

## Implementation

### PWA Service Worker

```javascript
// Service worker caches:
// 1. App shell (HTML, CSS, JS)
// 2. Static assets (fonts, icons)
// 3. Fonts and images

// Does NOT cache:
// - User data (stays in IndexedDB)
// - External API calls (none required)
```

### Data Storage

| Data Type           | Storage               | Retention             |
| ------------------- | --------------------- | --------------------- |
| Uploaded datasets   | IndexedDB             | Until deleted         |
| Computed statistics | IndexedDB (cached)    | Until dataset deleted |
| User settings       | IndexedDB             | Persistent            |
| License key         | IndexedDB (encrypted) | Persistent            |
| Theme preference    | localStorage          | Persistent            |

### No Cloud Dependencies

The core application has zero runtime dependencies on external services:

- Statistics calculated locally using `@variscout/core`
- Charts rendered using local Visx components
- No telemetry or analytics (privacy-first)
- No authentication required for core features

---

## Update Mechanism

Since there's no backend, updates happen via:

1. Service worker detects new version
2. New assets cached in background
3. User prompted to refresh
4. Old cache cleared after successful update

```
USER                    SERVICE WORKER              CACHE
  │                           │                        │
  │───── Visit app ──────────▶│                        │
  │                           │───── Check version ───▶│
  │                           │◀──── v1.2.3 cached ────│
  │◀──── Serve from cache ────│                        │
  │                           │                        │
  │                           │═══ Background check ═══│
  │                           │───── Fetch v1.2.4 ────▶│
  │                           │◀───── New version ─────│
  │                           │───── Cache new ───────▶│
  │                           │                        │
  │◀──── "Update available" ──│                        │
  │───── Refresh ────────────▶│                        │
  │◀──── Serve v1.2.4 ────────│                        │
```

---

## Azure App: Storage by Plan

Both Azure plans store data locally in IndexedDB. The Team plan additionally syncs to OneDrive.

**Standard plan (€99/month)** — IndexedDB only, no cloud sync:

```
┌─────────────────────────────────────────────────────┐
│               AZURE STANDARD APP                     │
│                                                     │
│  ┌─────────────┐                                    │
│  │  IndexedDB  │                                    │
│  │  (local)    │                                    │
│  └─────────────┘                                    │
│        │                                            │
│        │ always available                           │
│        ▼                                            │
│   ┌───────────────────────────────────────────┐    │
│   │              Application                   │    │
│   └───────────────────────────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Team plan (€299/month)** — IndexedDB + OneDrive sync:

```
┌─────────────────────────────────────────────────────┐
│                 AZURE TEAM APP                       │
│                                                     │
│  ┌─────────────┐         ┌─────────────┐           │
│  │  IndexedDB  │◄───────▶│  OneDrive   │           │
│  │  (local)    │  sync   │  (cloud)    │           │
│  └─────────────┘         └─────────────┘           │
│        │                        │                   │
│        │ always                 │ when online       │
│        │ available              │ available         │
│        ▼                        ▼                   │
│   ┌───────────────────────────────────────────┐    │
│   │              Application                   │    │
│   │         (works with either)               │    │
│   └───────────────────────────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Benefits

| Benefit         | Description                  |
| --------------- | ---------------------------- |
| **Reliability** | Works in low/no connectivity |
| **Privacy**     | Data never leaves device     |
| **Speed**       | No network latency           |
| **Cost**        | No server infrastructure     |
| **Simplicity**  | No sync conflicts to resolve |

---

## Trade-offs

| Trade-off                    | Mitigation                            |
| ---------------------------- | ------------------------------------- |
| No cross-device sync (PWA)   | Azure Team plan adds OneDrive sync    |
| Limited by browser resources | Target datasets are typically small   |
| Update requires refresh      | Clear messaging when update available |

---

## See Also

- [ADR-004: Offline-First Decision](../../07-decisions/adr-004-offline-first.md)
- [PWA Storage](../../08-products/pwa/storage.md)
