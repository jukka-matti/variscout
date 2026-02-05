# VariScout Excel Add-in

Excel Add-in for VariScout quality analysis, using the Hybrid Approach: Native Excel slicers combined with Visx charts in a Content Add-in.

**Status:** Scaffold / Early Development

---

## Architecture

This add-in follows the **Hybrid Approach** documented in [EXCEL_ADDIN_STRATEGY.md](../../docs/08-products/excel/strategy.md):

```
┌─────────────────────────────────────────────────────────────┐
│  Excel Workbook                                             │
│  ┌─────────────────┐  ┌───────────────────────────────────┐ │
│  │  Excel Table    │  │  Content Add-in (iframe)          │ │
│  │  (raw data)     │  │  ┌─────────────────────────────┐  │ │
│  │                 │  │  │  Visx Charts                │  │ │
│  │  [Slicer: Farm] │  │  │  - I-Chart with limits     │  │ │
│  │  [Slicer: Date] │  │  │  - Boxplot (styled)        │  │ │
│  │                 │  │  │  - Pareto                  │  │ │
│  │  Slicers filter │──│──│  Charts read filtered     │  │ │
│  │  the Table      │  │  │  data via Office.js       │  │ │
│  └─────────────────┘  │  └─────────────────────────────┘  │ │
│                       └───────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Current Scaffold Contents

```
apps/excel-addin/
├── src/
│   ├── main.tsx           # Entry point, Office.js initialization
│   ├── taskpane/          # Task pane React components
│   ├── commands/          # Ribbon command handlers
│   └── lib/
│       └── excelData.ts   # Office.js data utilities
├── assets/                # Add-in icons (16, 32, 80px)
├── manifest.xml           # Office Add-in manifest
├── vite.config.ts         # Vite build configuration
└── package.json           # Dependencies
```

---

## Development

### Prerequisites

- Node.js v18+
- pnpm v8+
- Microsoft Excel (desktop or web)
- HTTPS certificates for local development

### Setup

```bash
# From repository root
pnpm install

# Generate dev certificates (first time only)
cd apps/excel-addin
npx office-addin-dev-certs install
```

### Run Development Server

```bash
# Start dev server with HTTPS on port 3000
pnpm --filter @variscout/excel-addin dev
```

### Sideload in Excel

**Excel Desktop (Windows/Mac):**

```bash
pnpm --filter @variscout/excel-addin start
```

**Excel Web:**

1. Open Excel Online
2. Insert > Office Add-ins > Upload My Add-in
3. Upload `manifest.xml`

### Build

```bash
pnpm --filter @variscout/excel-addin build
```

Output: `apps/excel-addin/dist/`

---

## Dependencies

| Package                      | Purpose                                     |
| ---------------------------- | ------------------------------------------- |
| `@variscout/core`            | Shared statistics (calculateStats, Cp, Cpk) |
| `@variscout/charts`          | Visx chart components                       |
| `@fluentui/react-components` | Microsoft Fluent UI                         |
| `office-js`                  | Excel JavaScript API                        |

---

## Manifest Configuration

The `manifest.xml` defines:

- **Task Pane:** Setup, configuration, settings
- **Content Add-in:** Charts display (planned)
- **Ribbon Commands:** Quick actions

Required API sets:

- `ExcelApi 1.9+` for Box-whisker charts
- `ExcelApi 1.10+` for Slicers

---

## Next Steps

See [EXCEL_ADDIN_STRATEGY.md](../../docs/08-products/excel/strategy.md) for full implementation plan.

1. **Task Pane Setup Flow** - Table detection, column mapping
2. **Content Add-in** - Visx chart rendering
3. **Table Binding** - Live data refresh
4. **Slicer Integration** - Automatic via shared Table

---

## Related Documentation

- [Excel Add-in Strategy](../../docs/08-products/excel/strategy.md) - Strategic analysis and decision
- [PWA Licensing](../../docs/08-products/pwa/licensing.md) - Licensing details
- [Monorepo Architecture](../../docs/05-technical/architecture/monorepo.md) - Package structure
