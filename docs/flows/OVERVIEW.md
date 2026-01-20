# User Flows

User experience documentation for VariScout. These documents describe how users interact with the application across different platforms.

---

## Quick Navigation

### Core Flows (Shared Across Platforms)

| Flow                      | Path                                                   | Description                                   |
| ------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| **Core Analysis Journey** | [CORE-ANALYSIS-JOURNEY.md](./CORE-ANALYSIS-JOURNEY.md) | Dashboard, drill-down, and chart interactions |
| **Performance Mode**      | [PERFORMANCE-MODE.md](./PERFORMANCE-MODE.md)           | Multi-measure analysis for parallel channels  |
| **Platform Adaptations**  | [PLATFORM-ADAPTATIONS.md](./PLATFORM-ADAPTATIONS.md)   | How each app adapts the core experience       |

### Platform-Specific Flows

| Platform  | Path                                                         | Description                               |
| --------- | ------------------------------------------------------------ | ----------------------------------------- |
| **PWA**   | [pwa/DATA-ONBOARDING.md](./pwa/DATA-ONBOARDING.md)           | File upload, sample data, manual entry    |
| **Azure** | [azure/PROJECT-MANAGEMENT.md](./azure/PROJECT-MANAGEMENT.md) | Project browser, cloud sync, team sharing |
| **Excel** | [excel/SETUP-WIZARD.md](./excel/SETUP-WIZARD.md)             | 6-step setup wizard from worksheet data   |

---

## Architecture

```
User Flows
├── CORE-ANALYSIS-JOURNEY.md      # Shared analysis experience
│   └── Dashboard, drill-down, focus mode
├── PERFORMANCE-MODE.md           # Multi-channel analysis
│   └── Cpk comparison, channel selection
├── PLATFORM-ADAPTATIONS.md       # Platform differences summary
│
└── Platform-specific/
    ├── pwa/DATA-ONBOARDING.md    # PWA entry experience
    ├── azure/PROJECT-MANAGEMENT.md # Azure project browser
    └── excel/SETUP-WIZARD.md     # Excel setup wizard
```

---

## Flow Principles

### 1. Shared Core, Platform Adaptations

The **Core Analysis Journey** is identical across all platforms:

- Same four-chart dashboard layout
- Same drill-down navigation with breadcrumbs
- Same Performance Mode for multi-channel analysis
- Same Focus Mode for detailed single-chart view

Each platform adapts the **entry experience** to fit its context:

- **PWA**: Drag-drop upload, sample data, manual entry
- **Azure**: Project browser with cloud sync
- **Excel**: Setup wizard reading from worksheet

### 2. Progressive Disclosure

Users start with simple actions and discover complexity as needed:

```
Load Data → See Charts → Drill into details → Configure specs → Advanced analysis
```

### 3. Offline-First

All flows work without internet connection:

- **PWA**: Service worker caches app, IndexedDB stores data
- **Azure**: Offline-first with background sync
- **Excel**: Native app, workbook storage

---

## Related Documentation

- **Products**: [PWA](../products/pwa/README.md) | [Azure](../products/azure/OVERVIEW.md) | [Excel](../products/excel/OVERVIEW.md)
- **Design System**: [Charts](../design-system/charts/README.md) | [Components](../design-system/components/)
- **Technical**: [Testing Strategy](../technical/TESTING_STRATEGY.md) | [Data Input](../technical/DATA_INPUT.md)
