# PWA Session Model

The PWA is a free training and education tool — data persistence is intentionally not provided.

---

## How It Works

- Data entered via paste lives in React state only
- No IndexedDB, no localStorage (except theme preference), no `.vrs` files
- Page refresh = data lost (by design)
- No save/load functionality

---

## Why Session-Only?

The PWA is **free forever** — it exists to teach SPC concepts and let users try VariScout with their own data. Persistence features (save, load, team sharing, OneDrive sync) are part of the [Azure App](../azure/) value proposition at €150/month.

This is documented in [ADR-007](../../07-decisions/adr-007-azure-marketplace-distribution.md).

---

## What IS Preserved

| Data             | Storage      | Notes                                                   |
| ---------------- | ------------ | ------------------------------------------------------- |
| Theme preference | localStorage | Light/dark/system (Azure only, PWA has no theme toggle) |

---

## See Also

- [Project Persistence](../../03-features/data/storage.md) — Full persistence model (Azure App)
- [Offline-First Architecture](../../05-technical/architecture/offline-first.md)
