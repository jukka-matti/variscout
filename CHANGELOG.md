# Changelog

All notable changes to VariScout Lite will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.0] - 2026-01-04

### Added

- **Presentation Mode**: Fullscreen distraction-free view showing all charts optimized for presentations. Access via View → Presentation Mode. Press Escape to exit.

### Changed

- **Scrollable Dashboard**: Replaced viewport-fit resizable panels with natural scrolling layout. Charts now have comfortable minimum heights (I-Chart 400px, Boxplot/Pareto 280px).
- **Sticky Navigation**: Breadcrumb trail and tab bar remain visible while scrolling through charts.
- **View Menu**: Reorganized to include Presentation Mode; removed Large Mode.

### Removed

- **Large Mode**: Removed 30% text scaling feature. Presentation Mode provides a better solution for visibility during presentations.
- **Resizable Panels**: Removed draggable panel splitter in favor of scrollable layout with fixed proportions.

## [1.4.0] - 2026-01-04

### Added

- **Drill-Down Navigation**: Click Boxplot/Pareto elements to filter data with breadcrumb trail showing current filter path.
- **Breadcrumb Component**: Visual navigation bar (`DrillBreadcrumb.tsx`) with home icon, chevron separators, and Clear All button.
- **useDrillDown Hook**: React hook for managing drill-down state, history tracking, and filter sync.
- **Navigation Types**: New types in `@variscout/core` (`DrillAction`, `DrillSource`, `BreadcrumbItem`) for cross-product consistency.
- **Excel FilterBar Update**: Breadcrumb-style display for active slicer selections (read-only).

### Changed

- **Toolbar Redesign**: Contextual navigation with labeled buttons and grouped dropdowns.
  - Single "Save" button with keyboard shortcut display (⌘S) and success feedback.
  - "Export" dropdown grouping Download .vrs, CSV, and PNG exports.
  - "View" dropdown for Data Table, Large Mode, Open Project, New Analysis.
  - Mobile menu reorganized with section headers (Export, View, Project).
  - Minimal toolbar (Open Project + Settings only) when no data loaded.
  - New `ToolbarDropdown` reusable component for dropdown menus.

### Documentation

- **Navigation Architecture**: New comprehensive doc (`docs/design-system/NAVIGATION_ARCHITECTURE.md`) covering all navigation patterns.
- **Drill-Down Patterns**: Added `docs/design-system/patterns/navigation.md` with chart-specific drill behavior.

## [1.3.0] - 2026-01-04

### Added

- **Focus Mode**: Maximize any chart to full screen. Added **Carousel Navigation** (Next/Prev) to cycle through charts in detailed view.
- **Layout Optimization**: I-Chart (Monitor) is now larger by default (60% screen height) for better visibility.
- **Simplified Analysis**: Removed automated interpretation text.

## [1.2.0] - 2026-01-04

### Added

- **Azure Team App**: New enterprise-focused application (`apps/azure`).
  - Microsoft Entra ID (MSAL) Authentication.
  - SharePoint/OneDrive integration for cloud storage.
  - Offline-capabilities with automatic cloud sync.
- **Infrastructure as Code**: Bicep templates for provisioning Azure Static Web App and Functions (`infra/`).

### Documentation

- **Agentic Testing Strategy**: Updated `docs/technical/TESTING_STRATEGY.md` to include Agent-driven QA protocols (Visual & E2E Verification).

## [1.1.0] - 2024-12-29

### Added

- **Interactive Axis Editing**: Click any chart axis label to rename it (create alias).
- **Category Renaming**: Rename boxplot categories (e.g., "M1" -> "Machine 1") directly on the chart.
- **Contextual Spec Editor**: Moved spec editing to the Stats Panel for faster access.
- **Spec Visibility Toggle**: Option to hide/show USL/LSL lines in Settings.
- **Multi-Tier Grading Editor**: define complex grading rules (e.g. for Coffee) directly in the UI.

## [1.0.0] - 2024-12-28

### Added

#### Core Dashboard

- I-Chart with auto-calculated control limits (UCL/LCL)
- Boxplot for factor comparison
- Pareto chart for frequency analysis
- Linked filtering across all charts

#### Data Input

- CSV file import (drag-and-drop)
- Excel (.xlsx) file import
- Manual data entry with running statistics
- Paste support for tab-separated data
- Sample datasets for demo

#### Statistics

- Conformance analysis (Pass/Fail counts)
- Cp and Cpk capability indices (configurable in Settings)
- Capability histogram with spec limit overlays
- Summary statistics (mean, std dev, min, max, count)

#### Data Management

- Editable data table with inline editing
- Keyboard navigation (Tab/Enter) in data entry
- Spec status column with color-coded badges
- Add/delete rows in data table

#### Persistence

- Auto-save to localStorage (crash recovery)
- Named projects in IndexedDB
- Export/import as .vrs files
- Project rename and delete

#### Export

- PNG export for charts
- CSV export with spec status column
- Row numbers in exports

#### Display

- Large mode (30% larger fonts)
- Dark theme throughout
- Responsive design for mobile/tablet
- PWA support (installable, offline-capable)

### Technical

- React 18 + TypeScript + Vite
- Visx for D3-based charts
- Tailwind CSS for styling
- Service Worker for offline support
- IndexedDB via idb library

---

## [Unreleased]

### Planned

- Multi-tier grade specifications
- Custom branding/watermarks
- Batch file processing

---

[1.0.0]: https://github.com/your-org/variscout-lite/releases/tag/v1.0.0
[Unreleased]: https://github.com/your-org/variscout-lite/compare/v1.0.0...HEAD
