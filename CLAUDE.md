# VariScout Lite

Lightweight, offline-first variation analysis tool for quality professionals.

## Quick Reference

```bash
npm run dev      # Start development server (http://localhost:5173)
npm run build    # Production build to dist/
npm run preview  # Preview production build
npm test         # Run Vitest tests
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
