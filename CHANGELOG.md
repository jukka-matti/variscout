# Changelog

All notable changes to VariScout Lite will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
