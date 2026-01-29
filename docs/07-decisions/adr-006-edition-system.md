# ADR-006: Edition System (Community/Licensed)

**Status**: Accepted

**Date**: 2024-03-01 (Updated: 2025-01)

---

## Context

We need to support multiple editions of the app:

- **Community**: Free, full features, VariScout branding
- **Licensed**: Paid (€99), no branding, theme customization (requires PWA installation)

---

## Decision

Implement edition detection via build-time environment variables:

```typescript
// packages/core/src/edition.ts
export function getEdition(): Edition {
  return import.meta.env.VITE_EDITION || 'community';
}

export function isThemingEnabled(): boolean {
  return getEdition() === 'licensed';
}
```

Feature gates check edition at runtime:

```typescript
if (isThemingEnabled()) {
  // Show theme picker
}
```

---

## Consequences

### Benefits

- Single codebase for all editions
- Features can be edition-gated granularly
- Build commands produce different bundles
- License validation for paid edition

### Trade-offs

- Build complexity (multiple build targets)
- Must be careful not to leak licensed features
- License validation adds code complexity

---

## Related Build Commands

```bash
pnpm build:pwa:community  # Community edition
pnpm build:pwa:licensed   # Licensed edition
```

## PWA-Only Theming

Theme customization (light/dark/system modes and accent colors) is only available when:

1. The user has a valid license key
2. The app is installed as a PWA (Add to Home Screen)

This ensures that theming is a PWA-exclusive feature that encourages installation.

---

## See Also

- [PWA Licensing](../08-products/pwa/licensing.md)
