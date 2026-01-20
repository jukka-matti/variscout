# VaRiScout Excel Add-in — Overview

VaRiScout Excel brings variation analysis directly into Excel. Users select data in their spreadsheet, and VaRiScout appears in a task pane with linked charts.

```
PRODUCT SUMMARY
─────────────────────────────────────────────────────────────────

Platform:       Excel (Windows, Mac, Web)
Distribution:   Microsoft AppSource
Architecture:   Office Add-in (Task Pane + Content Add-in)
Analysis:       Same @variscout/core as PWA and Power BI

Pricing:
• Free: Full analysis, settings lost on close
• Individual: €49/year, save settings in workbook
```

---

## User Experience

### Workflow

```
1. User selects data range in Excel (e.g., A1:D500)
2. Clicks "VaRiScout" button in ribbon
3. Task pane opens with column mapping
4. All 4 charts appear, linked filtering works
5. User clicks to filter, copies charts to Excel/PowerPoint
```

### Features

- **I-Chart**: Time-based control chart with UCL/LCL
- **Boxplot**: Factor comparison with ANOVA
- **Pareto**: Defect categorization
- **Capability**: Histogram with Cp/Cpk
- **Performance Mode**: Multi-measure analysis with Cpk by channel
- **FilterBar**: Breadcrumb trail for drill-down navigation

---

## Freemium Model

Same philosophy as PWA: **Save is the upgrade gate.**

| Feature                       | Free | Individual (€49/yr) |
| ----------------------------- | ---- | ------------------- |
| All 4 charts + ANOVA          | ✅   | ✅                  |
| Native Excel slicer filtering | ✅   | ✅                  |
| Control limit calculations    | ✅   | ✅                  |
| Capability analysis (Cp/Cpk)  | ✅   | ✅                  |
| Copy charts to clipboard      | ✅   | ✅                  |
| Performance Mode              | ✅   | ✅                  |
| **Save settings in workbook** | ❌   | ✅                  |
| **Save spec limits**          | ❌   | ✅                  |

---

## User Flows

- [Setup Wizard](../../flows/excel/SETUP-WIZARD.md) - 6-step setup wizard from worksheet data
- [Core Analysis Journey](../../flows/CORE-ANALYSIS-JOURNEY.md) - Dashboard, drill-down, focus mode
- [Performance Mode](../../flows/PERFORMANCE-MODE.md) - Multi-measure analysis

## Related Documentation

- [Architecture](./ARCHITECTURE.md) - Hybrid Task Pane + Content Add-in architecture
- [Office.js API](./OFFICE-JS-API.md) - Office.js integration details
- [Manifest](./MANIFEST.md) - Add-in manifest configuration
- [Licensing](./LICENSING.md) - AppSource licensing
- [Settings Storage](./SETTINGS-STORAGE.md) - Custom Document Properties
- [Features](./FEATURES.md) - Analysis features
- [Development](./DEVELOPMENT.md) - Development setup
- [Design System](./design-system/OVERVIEW.md) - UI design system
