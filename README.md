# VariScout Lite

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](CHANGELOG.md)
[![PWA](https://img.shields.io/badge/PWA-ready-purple.svg)](#install-as-app)

A lightweight, offline-first variation analysis tool for quality professionals. No AI, no subscriptions, no API keys — just fast, linked charts that reveal hidden variation.

> _"Cut through your watermelons — without the cloud."_

<!-- Screenshot placeholder - replace with actual screenshot -->
<!-- ![VariScout Lite Dashboard](docs/screenshot.png) -->

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Features

### Core Dashboard

- **I-Chart**: Time series tracking with auto-calculated control limits (UCL/LCL)
- **Boxplot**: Factor comparison (e.g., Shift A vs Shift B)
- **Pareto**: Defect categorization and frequency analysis
- **Linked Filtering**: Click any chart element to filter all others instantly
- **Interactive Labels**: Click axis titles or categories to rename them (Aliasing)

### Data Input

- **File Import**: Drag-and-drop CSV and Excel (.xlsx) support
- **Manual Entry**: Direct data entry with running statistics and spec compliance feedback
- **Paste Support**: Tab-separated data from Excel

### Analysis

- **Conformance**: Pass/Fail statistics against specification limits
- **Capability**: Cp and Cpk indices (configurable in Settings)
- **Capability Histogram**: Visual distribution with spec limit overlays
- **Data Table**: Excel-like view with inline editing

### Export & Save

- **PNG Export**: Save charts as images for reports
- **CSV Export**: Excel-compatible data with spec status column
- **Project Files**: Save/load as `.vrs` files for sharing
- **Browser Storage**: Auto-save and named projects

### Display

- **Large Mode**: 30% larger fonts for presentations and training
- **Mobile Optimized**: Full support for phones (320px+) and tablets with:
  - Tab-based chart navigation with swipe gestures
  - 44px touch targets throughout
  - Bottom sheet modals
  - Responsive chart margins that scale with screen size
- **Offline First**: Works without internet after first visit

### Editions

| Edition       | Price | Features                                           |
| ------------- | ----- | -------------------------------------------------- |
| **Community** | Free  | Full features, "VariScout Lite" branding on charts |
| **ITC**       | Free  | Full features, ITC branding (for ITC network)      |
| **Licensed**  | €39   | Full features, no branding                         |

Activate Licensed edition by entering a license key in Settings → License.

## Getting Started

### Prerequisites

- Node.js v18 or higher
- pnpm v8 or higher (`npm install -g pnpm`)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/variscout-lite.git
cd variscout-lite

# Install dependencies
pnpm install
```

### Development

```bash
pnpm dev
```

Open http://localhost:5173 in your browser.

### Build

```bash
pnpm build           # Build all packages
pnpm build:pwa       # Build PWA only
pnpm preview         # Preview production build
```

### Edition-Specific Builds

```bash
pnpm build:pwa:community    # Free with branding
pnpm build:pwa:itc          # ITC-branded
pnpm build:pwa:licensed     # No branding
```

### Test

```bash
pnpm test
```

## Usage

### Quick Start

1. **Upload data**: Drag a CSV or Excel file onto the upload area
2. **Select outcome**: Choose the numeric column to analyze (e.g., "Weight")
3. **Set specs**: Click "Add Specs" in the Stats Panel to define limits
4. **Explore**: Click chart elements to filter and investigate

### Example Workflow: Root Cause Analysis

1. Load your process data (CSV with measurements and factor columns)
2. Notice outliers in the I-Chart
3. Click a Pareto bar to filter by defect type
4. Observe the Boxplot to see which factor (machine, shift, operator) correlates
5. Export findings as PNG for your report

### Keyboard Shortcuts

| Key     | Action                              |
| ------- | ----------------------------------- |
| `Esc`   | Clear all filters                   |
| `Tab`   | Navigate between cells (Data Table) |
| `Enter` | Move to next row (Manual Entry)     |

## Deployment

### Vercel (Recommended)

```bash
npx vercel
```

Or connect your GitHub repository for automatic deployments.

### Manual Deployment

```bash
pnpm build:pwa
# Deploy the `apps/pwa/dist/` folder to any static hosting service
```

### Install as App

After visiting the deployed URL:

- **Mobile**: Tap "Add to Home Screen" in your browser menu
- **Desktop**: Click the install icon in the browser address bar

## Tech Stack

| Layer           | Technology                           |
| --------------- | ------------------------------------ |
| Runtime         | Progressive Web App (Service Worker) |
| Frontend        | React + TypeScript + Vite            |
| Styling         | Tailwind CSS                         |
| Charts          | Visx (D3 primitives)                 |
| Storage         | IndexedDB + localStorage             |
| Testing         | Vitest                               |
| Package Manager | pnpm with workspaces                 |

### Repository Structure

This is a **pnpm workspaces monorepo** supporting multiple applications:

```
variscout-lite/
├── packages/core/     # @variscout/core - Shared logic
├── apps/pwa/          # PWA website (mobile + desktop)
└── apps/excel-addin/  # Excel Add-in (planned)
```

See [ARCHITECTURE.md](ARCHITECTURE.md) and [docs/MONOREPO_ARCHITECTURE.md](docs/MONOREPO_ARCHITECTURE.md) for details.

## Roadmap

- [x] Core 3-chart dashboard with linked filtering
- [x] Cp/Cpk capability analysis
- [x] Editable data table
- [x] Capability histogram
- [x] Multi-tier grade specifications
- [x] Mobile-first responsive design
- [x] pnpm monorepo architecture
- [ ] Excel Add-in with Copilot integration
- [ ] PDF report generation
- [ ] Batch file processing

See [Specs.md](Specs.md) for detailed feature specifications.

## Data Privacy

- **100% browser-based** — no data leaves your device
- **No server** — all processing happens locally
- **No tracking** — we don't collect any usage data
- **Your data, your control** — stored only in your browser

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Quick links:**

- [Product Overview](PRODUCT_OVERVIEW.md) — Philosophy and what we built
- [Specifications](Specs.md) — Detailed functional requirements
- [Architecture](ARCHITECTURE.md) — Technical details
- [UX Research](UX_RESEARCH.md) — User personas and use cases

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <sub>Built for quality professionals who need answers, not dashboards.</sub>
</p>
