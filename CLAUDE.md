# VariScout Lite

Lightweight, offline-first variation analysis tool for quality professionals.

## Quick Reference

```bash
npm run dev      # Start development server (http://localhost:5173)
npm run build    # Production build to dist/
npm run preview  # Preview production build
npm test         # Run Vitest tests

# Edition-specific builds
npm run build:community  # Free with "VariScout Lite" branding
npm run build:itc        # ITC branding (separate distribution)
npm run build:pro        # No branding (for pre-licensed builds)
```

## Key Files

| File | Purpose |
|------|---------|
| @src/context/DataContext.tsx | Central state management (rawData, filters, specs) |
| @src/components/Dashboard.tsx | Main 3-chart layout |
| @src/components/StatsPanel.tsx | Statistics display with Summary/Histogram tabs |
| @src/logic/stats.ts | Statistics calculations (mean, std, Cp, Cpk) |
| @src/lib/persistence.ts | IndexedDB + localStorage operations |
| @src/lib/export.ts | CSV generation and spec status |
| @src/lib/edition.ts | Edition detection (community/itc/pro) |
| @src/lib/license.ts | License key validation and storage |
| @src/components/charts/ChartSourceBar.tsx | Chart footer branding component |

## Architecture

**PWA with "No Backend" philosophy:**
- All data processing happens in browser (TypeScript)
- No database server - data loaded from user files
- Persistence: localStorage (auto-save) + IndexedDB (named projects)
- `.vrs` files are JSON exports for sharing/backup

**Data Flow:**
```
User File (CSV/XLSX) → Parser → RawData → FilterEngine → FilteredData → Charts
                                   ↓                          ↓
                              Auto-Save              Stats Calculation
```

## Code Style

- **Components**: React functional components with hooks
- **State**: Context API (DataContext.tsx) - no Redux
- **Styling**: Tailwind CSS utility classes
- **Charts**: Visx low-level primitives (not high-level abstractions)
- **TypeScript**: Strict mode enabled

**Naming:**
- Components: PascalCase (`StatsPanel.tsx`)
- Hooks: `use` prefix (`useDataIngestion.ts`)
- Utils: camelCase (`persistence.ts`)

**Color Conventions:**
- Green (`text-green-500`): Pass/in-spec
- Red (`text-red-400`): Fail USL
- Amber (`text-amber-500`): Fail LSL
- Slate palette: UI chrome

## Core Concepts

### Outcome vs Factor
- **Outcome**: Continuous measurement variable (Y-axis of I-Chart, Boxplot)
- **Factor**: Categorical grouping variable (Boxplot groups, Pareto bars)

### Linked Filtering
All charts react to all filters:
- I-Chart brush → `timeRange` filter
- Boxplot click → `factorValue` filter
- Pareto click → `category` filter

### Statistics
- **Conformance**: Pass/Fail counts against USL/LSL specs
- **Capability**: Cp (potential), Cpk (actual) - requires both USL and LSL

## Editions & Licensing

### Three Editions

| Edition | Price | Branding | Distribution |
|---------|-------|----------|--------------|
| **Community** | Free | Footer bar: "VariScout Lite" + n= | Public web |
| **ITC** | Free | Footer bar: "International Trade Centre" | ITC network |
| **Pro** | €39-49 | No branding | License key activation |

### Chart Footer Source Bar
All charts display a footer bar (in Community/ITC editions):
```
┌─────────────────────────────────────┐
│  [chart content]                    │
├─────────────────────────────────────┤
│ ▌VariScout Lite          n=50      │
└─────────────────────────────────────┘
```
- Blue accent bar + branding text on left
- Sample size (n=) on right
- Hidden when Pro edition or valid license key

### License Key System
- **Format**: `VSL-XXXX-XXXX-XXXX` (alphanumeric with checksum)
- **Storage**: localStorage (`variscout_license`)
- **Validation**: Offline checksum verification (no server needed)
- **UI**: Settings modal → Section 4: License

### Build-time vs Runtime
- **Build-time**: `VITE_EDITION` env var sets default edition
- **Runtime**: License key can upgrade Community → Pro
- Community users can activate Pro by entering valid license key

### Generate Test License Key
```javascript
// In browser console:
import('./lib/license.js').then(m => console.log(m.generateLicenseKey()))
```

## Testing

```bash
npm test              # Run all tests
npm test -- --watch   # Watch mode
```

Tests use Vitest + React Testing Library. Test files in `__tests__/` directories.

## Documentation

- @README.md - Quick start and installation
- @PRODUCT_OVERVIEW.md - Product philosophy and features
- @ARCHITECTURE.md - Technical architecture details
- @Specs.md - Detailed functional specifications
- @UX_RESEARCH.md - User personas and use cases
