# Changelog

All notable changes to VariScout Lite will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Staged I-Chart**: Divide I-Chart into distinct phases with separate control limits per stage
  - Available in PWA, Azure Team App, and Excel Add-in
  - Column-based stage definition (select any categorical column with 2-10 unique values)
  - Auto-detect stage ordering (numeric patterns sorted numerically, else data order)
  - Manual override: Sort stages by "Auto" or "Data order"
  - Visual: Vertical dividers, per-stage UCL/Mean/LCL lines, stage labels
  - Points colored based on their stage's control limits
  - Excel Add-in: New "Stage Analysis" step in Setup Wizard for stage configuration
  - Points colored based on their stage's control limits
  - Excel Add-in: New "Stage Analysis" step in Setup Wizard for stage configuration

- **Y-Axis Scale Options**: New scale mode selector in Settings modal
  - Auto: Fit scale to data + specs (default behavior)
  - Start at Zero: Force Y-axis minimum to 0
  - Manual: Set explicit min/max values
  - Settings persist with saved projects

- **Control Limits Toggle**: Option to show/hide UCL/Mean/LCL lines on I-Chart
  - Toggle in Settings → Display Options → "Show Control Limits"
  - Affects both regular and staged I-Chart modes
  - Labels also hidden when disabled

- **Case Study UX Overhaul**: Complete redesign of interactive case study pages
  - PostMessage communication between marketing website and embedded PWA
  - Chart highlighting when corresponding step scrolls into view
  - Skeleton loader during iframe load with smooth fade-in
  - Scroll animations with `prefers-reduced-motion` support
  - Progress indicator showing case position (desktop only)
  - Sticky mobile CTA button with safe-area-inset support
  - Difficulty badges and time estimates for each case
  - Related tools section linking to tool documentation
  - "What's Next" navigation with related cases

- **Holistic Journey Integration**: Complete journey threading across all website pages
  - **Phase 1 (Homepage)**: AVERAGES hook, MiniJourney, FourPillars sections
  - **Phase 2 (Tool Pages)**: JourneyToolBadge showing journey position, JourneyToolNav for prev/next navigation
  - **Phase 3 (Case Studies)**: JourneyCaseBadge with AVERAGES→EXPLORE→REVEAL flow, act labels
  - **Phase 4 (Product Pages)**: JourneyProductBadge tagline, JourneyFeatures organized by FIND IT/FIX IT/CHECK IT/CONTINUE

- **Journey Page Interactive Embeds**: Real PWA charts embedded in scrollytelling sections
  - `chart` URL parameter for single-chart focus mode (`ichart`, `boxplot`, `pareto`, `stats`)
  - `tab` URL parameter for auto-selecting StatsPanel tab (`summary`, `histogram`, `normality`)
  - Sample datasets: `journey`, `journey-before` (Cpk ~0.8), `journey-after` (Cpk ~1.5)
  - PWAEmbed component supports `chart` and `tab` props

### Changed

- **Journey Page Visualizations**: Fixed static bar charts in AVERAGES and FAILURE sections
  - Replaced percentage-based heights with pixel values for proper rendering
  - Pareto section now displays real interactive Pareto chart via PWAEmbed

### Documentation

- **Embed Messaging Protocol**: Technical spec for iframe↔PWA communication (`docs/technical/EMBED_MESSAGING.md`)
- **PWA Embed Mode**: Configuration guide for embedded PWA (`docs/products/pwa/EMBED-MODE.md`)
- **Case Study Components**: Component API reference (`docs/products/website/components/CASE-COMPONENTS.md`)
- **Animation System**: Design system tokens and keyframes (`docs/design-system/ANIMATIONS.md`)

### Fixed

- **I-Chart UI Cleanup**: Removed redundant header stats bar (UCL/Mean/LCL was shown twice)
  - Now displayed only as chart-side labels with hover tooltips
  - Tooltips explain each metric (UCL, LCL, Mean, USL, LSL, Target)
- **I-Chart Data Point Visibility**: First and last data points no longer clipped by axes
  - Added X-axis padding `[-0.5, +0.5]` to domain
- **I-Chart Label Overlap**: Adjacent labels (e.g., Mean/USL) now auto-spaced to avoid collision
- **Website Italic Styling**: Fixed broken italic classes in PricingCard and FourPillars
- **Embed Mode Logic**: Fixed focus chart rendering on small/mobile screens

## [1.6.0] - 2026-01-05

### Added

- **Statistical Tooltips**: Comprehensive hover tooltips explaining statistical terms throughout the app:
  - Stats Panel: Pass Rate, Rejected %, Cp, Cpk
  - ANOVA Results: p-value, F-statistic, η² (eta-squared)
  - Dashboard: UCL, LCL, Mean (control limits)
  - Regression Panel: R², p-value, slope
  - Gage R&R Panel: %GRR, variance components, interaction plot
- **Embed Mode**: PWA can be embedded in iframes for website case studies
  - `?sample=xxx` URL parameter auto-loads sample datasets
  - `?embed=true` hides header/footer for clean iframe display
  - Available sample keys: `mango-export`, `textiles-strength`, `coffee-defects`
- **Case Study Content**: Three interactive case study tutorials for the website:
  - Mango Export: Factor identification using Boxplot and ANOVA
  - Textiles Strength: Process capability analysis with Cpk
  - Coffee Defects: Defect prioritization with Pareto and grades

### Changed

- Sample datasets now include `urlKey` for deep linking

## [1.5.0] - 2026-01-04

### Added

- **Presentation Mode**: Fullscreen distraction-free view showing all charts optimized for presentations. Access via View → Presentation Mode. Press Escape to exit.
- **Segmented Factor Selector**: Modern pill-button UI replacing dropdown for factor selection in Boxplot/Pareto charts. Shows amber indicator when filter is active on selected factor.
- **Filter Chips**: Active filters displayed as removable chips below breadcrumb. Click × to remove individual filters, "Clear all" to reset.
- **Cross-Chart Sync**: Clicking a Boxplot or Pareto element now syncs both charts to the same factor for cohesive analysis.
- **Breadcrumb Remove Buttons**: Individual × buttons on each breadcrumb segment for quick filter removal.

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

[1.0.0]: https://github.com/your-org/variscout-lite/releases/tag/v1.0.0
[Unreleased]: https://github.com/your-org/variscout-lite/compare/v1.0.0...HEAD
