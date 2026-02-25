# State-of-the-Product Audit — February 2026

**Date**: 2026-02-13
**Scope**: Full codebase, all docs, all packages and apps
**Method**: Automated exhaustive exploration (not sampling)

---

## Context

After the pricing/licensing overhaul (Azure Managed Application), dead-code cleanup (-983 lines), and website UX pass, this audit examines the entire product from three leadership perspectives to identify gaps, risks, and priorities before the next development cycle.

---

## 1. Product Owner Perspective

### Pricing & Positioning — CLEAN

| Signal                                                       | Status                       |
| ------------------------------------------------------------ | ---------------------------- |
| Website pricing page (€0 / €0 / €150)                        | Correct                      |
| Schema.org structured data                                   | Correct                      |
| Product comparison page                                      | Correct                      |
| Feature parity matrix (`docs/08-products/feature-parity.md`) | Correct                      |
| README.md                                                    | Correct                      |
| ADR-007 (distribution strategy)                              | Current (revised 2026-02-13) |
| PWA install prompt copy                                      | Current                      |

No stale €99/yr or license-key references remain in user-facing surfaces.

### Documentation — STRONG

All 8 doc sections exist with indexes: vision (13 files), journeys (13), features (31), cases (8 dirs), technical (13), design system (28), decisions (8), products (16). Total: ~130 docs.

### Case Studies — 5 of 7 READY

| Case                | Status | Data Files                                             | Week |
| ------------------- | ------ | ------------------------------------------------------ | ---- |
| Bottleneck          | Ready  | `data.csv`                                             | 1    |
| Hospital Ward       | Ready  | `data.csv`                                             | 5    |
| Coffee              | Ready  | `washing-station.csv`, `moisture-grr.csv`              | 9    |
| Packaging           | Ready  | `defects.csv`, `fillweights.csv`, `fillweight-grr.csv` | 9    |
| Avocado             | Ready  | `coating-regression.csv`, `coating-grr.csv`            | 12   |
| Machine Utilization | Stub   | —                                                      | —    |
| Oven Zones          | Stub   | —                                                      | —    |

### Product Gaps

| #   | Gap                                                                              | Severity    |
| --- | -------------------------------------------------------------------------------- | ----------- |
| P1  | Azure Marketplace listing not live (upgrade URL is placeholder in `tier.ts:168`) | **BLOCKER** |
| P2  | AppSource submission status unclear                                              | HIGH        |
| P3  | 2 case studies are stubs (machine-utilization, oven-zones)                       | LOW         |
| P4  | Power BI product spec marked "Planned — Not yet in development"                  | LOW         |
| P5  | No analytics/telemetry for PWA usage or conversion                               | MEDIUM      |

---

## 2. CTO Perspective

### Architecture — SOLID

- Clean monorepo layering: `core` → `charts`/`hooks`/`ui` → apps
- No circular dependencies
- Shared hooks (`useDataState`) eliminate ~460 lines of duplication
- Props-based chart architecture (no context coupling)
- TypeScript strict mode everywhere

### Dependency Health — FIXED 2026-02-13

| #   | Issue                                                          | Resolution                                                      |
| --- | -------------------------------------------------------------- | --------------------------------------------------------------- |
| D1  | @visx version mismatch (Azure 3.3–3.5, others 3.12)            | Aligned to ^3.12.0                                              |
| D2  | lucide-react version spread (ui=0.330, azure=0.344, pwa=0.400) | Aligned to ^0.400.0, moved to peerDependencies in @variscout/ui |
| D3  | Vitest version (Excel add-in 1.6 vs others 4.0)                | Aligned to ^4.0.16                                              |
| D4  | React version (Website 19.0, others 18.3)                      | Accepted — Astro islands handle this correctly                  |
| D5  | d3 minor version (Azure 7.8.5 vs others 7.9.0)                 | Aligned to ^7.9.0                                               |

### Test Coverage

| Area                | Test Files                 | Assessment      |
| ------------------- | -------------------------- | --------------- |
| `@variscout/core`   | 23 files (703 tests)       | **Very Strong** |
| `@variscout/charts` | 3 files (44 tests)         | Moderate        |
| `@variscout/hooks`  | 15 files (157 tests)       | **Strong**      |
| `@variscout/ui`     | 5 files (57 tests)         | Moderate        |
| PWA app             | 11 files (110 tests)       | **Strong**      |
| Azure app           | 13 files (130 tests)       | **Strong**      |
| Website             | 0                          | None            |
| **Total**           | **70 files (1,201 tests)** |                 |

### Technical Debt

| #   | Item                                                             | Severity |
| --- | ---------------------------------------------------------------- | -------- |
| T1  | ~~`edition.ts` deprecated but still used for branding logic~~    | RESOLVED |
| T2  | Excel add-in has stub `licenseDetection.ts` and `useLicense.ts`  | LOW      |
| T3  | TODO: Integrate funnel filters with FilterNavigation breadcrumbs | LOW      |
| T4  | TODO: Replace upgrade URL placeholder (`tier.ts:168`)            | **HIGH** |

### Security

- pnpm overrides for known CVEs (qs, esbuild, lodash, tmp) (removed Feb 2026 — dependencies no longer in tree)
- No `.env` files or secrets in codebase
- Offline-first architecture reduces attack surface

---

## 3. Head of Design Perspective

### Design System Documentation — COMPREHENSIVE

28 files covering foundations, components, charts, and patterns.

### Color System — 4 SOURCES (coordinated but not unified)

| Location                             | What                       | Used By       |
| ------------------------------------ | -------------------------- | ------------- |
| `packages/charts/src/colors.ts`      | Chart data + chrome colors | Charts        |
| `packages/ui/src/colors.ts`          | Status + grade colors      | UI components |
| `apps/pwa/src/index.css`             | CSS custom properties      | PWA           |
| `apps/website/src/styles/global.css` | Tailwind v4 theme tokens   | Website       |

Values are coordinated (status colors match) but no single source of truth.

### Accessibility — SIGNIFICANT GAPS

| Area          | Status                                           |
| ------------- | ------------------------------------------------ |
| Documentation | Excellent (WCAG 2.1 AA targets)                  |
| Website       | Good (aria-labels, focus traps)                  |
| UI components | Partial (11 aria instances)                      |
| PWA app       | Weak (7 aria instances across 72 components)     |
| Charts        | Missing (no `role="img"`, no descriptive labels) |
| Landmarks     | Missing (no `role="main"`, `role="navigation"`)  |
| Live regions  | Missing (no `aria-live` for dynamic updates)     |

### Branding

| Signal      | Finding                                                                                |
| ----------- | -------------------------------------------------------------------------------------- |
| Name casing | Website uses "VaRiScout" (71 instances, intentional stylization); PWA uses "VariScout" |
| Taglines    | Consistent across all surfaces                                                         |
| Brand color | Consistent: `#2563eb` (blue-600)                                                       |

### Design Gaps

| #   | Gap                                                                               | Severity |
| --- | --------------------------------------------------------------------------------- | -------- |
| UX1 | Accessibility implementation far behind documentation                             | **HIGH** |
| UX2 | Color system split across 4 files                                                 | MEDIUM   |
| UX3 | Brand name casing: "VaRiScout" (website) vs "VariScout" (PWA/docs) — intentional? | MEDIUM   |
| UX4 | PWA underuses responsive utilities                                                | LOW      |

---

## Combined Priority Matrix

### Blockers

| Issue                                         | Owner        |
| --------------------------------------------- | ------------ |
| P1: Azure Marketplace listing not live        | PO           |
| D1+D2: Dependency mismatches → build failures | CTO ✅ Fixed |

### High Priority

| Issue                                    | Owner  |
| ---------------------------------------- | ------ |
| UX1: Accessibility implementation gaps   | Design |
| P2: AppSource submission status          | PO     |
| T4: Upgrade URL placeholder in `tier.ts` | CTO    |

### Medium Priority

| Issue                                    | Owner  |
| ---------------------------------------- | ------ |
| UX2: Color system consolidation          | Design |
| UX3: Brand name standardization decision | Design |
| P5: Usage analytics/telemetry            | PO     |
| Test coverage expansion                  | CTO    |

### Low Priority

| Issue                         | Owner  |
| ----------------------------- | ------ |
| ~~T1: `edition.ts` cleanup~~  | DONE   |
| T2: Excel stub files          | CTO    |
| T3: Funnel/breadcrumb TODO    | CTO    |
| P3: 2 stub case studies       | PO     |
| P4: Power BI spec visibility  | PO     |
| D4: React version consistency | CTO    |
| UX4: PWA responsive usage     | Design |

---

## What's Working Well

- **Documentation**: 130+ docs, all current, no stale pricing
- **Architecture**: Clean monorepo layering, shared hooks, props-based charts
- **Core package**: 484 tests, strict TypeScript, solid statistics engine
- **Pricing alignment**: Consistent across all surfaces
- **Case studies**: 5 ready with data, mapped to content calendar
- **Design system docs**: Comprehensive 28-file system
- **Offline-first**: No backend dependency, data stays local
- **Recent cleanup**: 983 lines of dead code removed
