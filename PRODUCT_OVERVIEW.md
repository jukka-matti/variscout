# VariScout Lite: Product Overview

## Philosophy

**Stay Lite.** VariScout Lite is a focused analysis tool, not a platform.

We deliberately chose simplicity over feature richness. Instead of building a complex multi-mode system with separate UIs for different use cases, we enhanced the core tool to handle the most important workflows.

---

## What We Built

### Core Analysis Dashboard
- **I-Chart**: Time series with auto-calculated control limits (UCL/LCL)
- **Boxplot**: Factor comparison (e.g., Farm A vs Farm B)
- **Pareto**: Frequency analysis for categorical data
- **Linked Filtering**: Click any chart element to filter all others instantly
- **Interactive Labels**: Rename axes and categories directly on the chart

### Data Input
- **File Import**: Drag-and-drop CSV and Excel (.xlsx)
- **Manual Entry**: Direct data entry with running statistics, keyboard navigation, and spec compliance feedback (56px touch targets for tablets)
- **Paste from Excel**: Tab-separated data supported

### Export Options
- **PNG Export**: Save charts as images for reports
- **CSV Export**: Excel-compatible data export with row numbers and spec status
- **Project Files**: Save/load as .vrs files for sharing

### Display Modes
- **Large Mode**: Toggle 30% larger fonts for presentations and training sessions
- **Normal Mode**: Dense information display for analysis work

### Capability Analysis
- **Cp/Cpk Metrics**: Configurable process capability indices (toggle in Stats Panel)
- **Capability Histogram**: Visual distribution analysis with spec limits overlay (tab in Stats Panel)
- **Spec Editor**: Contextual editing of USL/LSL and Multi-Tier Grades directly in the analysis view

### Data Table
- **View Data**: Excel-like table view of all imported data
- **Inline Editing**: Click any cell to edit values
- **Keyboard Navigation**: Tab/Enter to move between cells
- **Spec Status**: Color-coded pass/fail indicators per row
- **Row Operations**: Add and delete rows

### Persistence
- **Auto-save**: Crash recovery via localStorage
- **Named Projects**: Save multiple analyses to browser storage (IndexedDB)
- **File Backup**: Download .vrs files for external backup

---

## What We Chose NOT to Build

Based on UX research, we considered a complex 4-mode architecture with:
- Field Mode (touch-optimized data entry)
- Analysis Mode (command palette, templates)
- Presentation Mode (annotations, insight cards)
- Certification Mode (audit trails, compliance packages)

**We rejected this approach** because:
1. It added complexity without proportional value
2. The core tool already serves the main use cases
3. Simple enhancements (Large Mode, Manual Entry improvements) addressed the key needs
4. Maintaining 4 separate UIs would slow future development

The exploratory design is archived in `docs/archive/PRODUCT_CONCEPTS_v1_abandoned.md` for reference.

---

## Target Users

Based on UX research with quality professionals in developing countries:

| Persona | Role | Key Need |
|---------|------|----------|
| **Grace** | QA Manager (Kenya) | Reduce 4-hour Excel work to 1 hour |
| **Raj** | Quality Engineer (India) | Real-time variation monitoring |
| **Carlos** | Training Coordinator (Guatemala) | Explain quality data to farmer groups |

See `UX_RESEARCH.md` for detailed personas, JTBD, and use cases.

---

## Design Principles

1. **Offline by default** - Works without internet after first visit
2. **Data stays local** - Zero external data transmission
3. **Transparent math** - Show formulas, explain metrics
4. **CSV exportable** - All data can be opened in Excel
5. **Linked exploration** - Charts talk to each other through filtering
6. **Fast to first insight** - Under 30 seconds from upload
7. **Export-ready outputs** - Professional charts for reports
8. **Simple over complete** - Do fewer things, do them well

---

## Technical Highlights

| Aspect | Implementation |
|--------|----------------|
| Runtime | PWA with Service Worker |
| Framework | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| Charts | Visx (D3 primitives) |
| Storage | IndexedDB + localStorage |
| Bundle | ~700KB gzipped |

---

## File Structure (Key Files)

```
src/
├── App.tsx                    # Main app with header controls
├── components/
│   ├── Dashboard.tsx          # 3-chart layout
│   ├── ManualEntry.tsx        # Data entry with running stats
│   ├── StatsPanel.tsx         # Stats display with histogram tab
│   └── charts/                # I-Chart, Boxplot, Pareto, CapabilityHistogram
├── context/
│   └── DataContext.tsx        # Central state management
├── lib/
│   ├── export.ts              # CSV generation
│   └── persistence.ts         # IndexedDB + localStorage
└── index.css                  # Large mode CSS
```

---

*See also:*
- `README.md` - Quick start and installation
- `ARCHITECTURE.md` - Technical architecture details
- `UX_RESEARCH.md` - User research, personas, JTBD
- `Specs.md` - Detailed functional specifications
