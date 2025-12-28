# VaRiScout Lite — Product Spec

**Version:** 1.0  
**Date:** December 2024  
**Status:** Draft

---

## What Is It?

A lightweight, offline variation analysis tool for quality professionals. No AI, no subscriptions, no API keys — just fast, linked charts that reveal hidden variation.

**Tagline:** *"Cut through your watermelons — without the cloud."*

---

## Target Users

| User | Context | Why Lite works |
|------|---------|----------------|
| **Quality Champions** | SMEs in developing countries (via ITC) | Know statistics, need better tools than Excel |
| **Experienced analysts** | Already know what to look for | Don't need AI guidance |
| **Trainers / educators** | Teaching variation analysis | Clean demo tool, no AI unpredictability |
| **Offline environments** | Factory floor, limited connectivity | 100% local, no internet needed |

---

## Core Features

### 1. Data Import
- CSV and Excel (.xlsx)
- Auto-detect: numeric columns → outcomes, categorical → factors
- Date/time column detection for time series
- Manual override if needed

### 2. Three-Chart Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  I-CHART (time series)                                      │
│  ────────────────────────────────────────────────────────── │
│  USL ═══════════════════════════════════════════════════ 🔴 │
│       ●   ●                     ●                           │
│  UCL - - - - - - - - - - - - - - - - - - - - - - - - - - -  │
│     ●   ●   ●   ●   ●   ●   ●   ●   ●   ●   ●   ●   ●      │
│  CL  ───────────────────────────────────────────────────    │
│         ●       ●   ●       ●       ●   ●                   │
│  LCL - - - - - - - - - - - - - - - - - - - - - - - - - - -  │
│                         ●                                   │
│  LSL ═══════════════════════════════════════════════════ 🔴 │
├─────────────────────────────┬───────────────────────────────┤
│  BOXPLOT (factor compare)   │  PARETO (categories)          │
│                             │                               │
│    ┌─┐                      │  ████████████  Station 3      │
│  ──┼─┼──   ┌─┐              │  ████████      Operator B     │
│    └─┘   ──┼─┼──    ┌─┐     │  █████         Material X     │
│           └─┘     ──┼─┼──   │  ███           Other          │
│                     └─┘     │                               │
│  Shift 1  Shift 2  Shift 3  │                               │
└─────────────────────────────┴───────────────────────────────┘

Legend:
  ═══ Specification limits (USL/LSL) — user-defined, red
  - - Control limits (UCL/LCL) — calculated from data, gray
  ─── Center line (CL) — mean, solid
```

**Multi-tier grades view (e.g., coffee defects):**
```
┌─────────────────────────────────────────────────────────────┐
│  DEFECTS per 300g (by shipment)                             │
│  ────────────────────────────────────────────────────────── │
│  Off Grade   ══════════════════════════════════════════ 86  │
│  Below Std   ══════════════════════════════════════════ 24  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  Exchange    ══════════════════════════════════════════ 9   │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  Premium     ══════════════════════════════════════════ 5   │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  Specialty   ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ target│
│              🟢  🟢  🟢  🟡  🟢  🟢  🟡  🟢  🟢               │
│               2   3   2   7   4   3   8   2   3             │
└─────────────────────────────────────────────────────────────┘

🟢 Specialty (≤5)  🟡 Premium (6-8)  🟠 Exchange (9-23)  🔴 Below
```

**Specification Limits (optional):**
- User inputs USL, LSL, and/or Target
- OR configures multi-tier grades
- Shown as distinct colored bands/lines
- Points colored by grade achieved
- Enables grade summary calculations

### 3. Linked Filtering
- Click any boxplot → filters I-Chart and Pareto
- Click Pareto bar → filters other charts
- Brush I-Chart range → filters others
- **"What's selected accounts for X% of total variation"**

### 4. Statistics Panel

**Two Analysis Modes (user selects):**

```
┌─────────────────────────────────────┐
│  ANALYSIS MODE                      │
│  ○ Conformance (batch pass/fail)    │
│  ● Capability (process performance) │
└─────────────────────────────────────┘
```

**Conformance Mode** — "Does each batch pass?"
| Metric | Description |
|--------|-------------|
| Pass count | Batches within spec |
| Fail count | Batches outside spec |
| Pass rate % | Overall success rate |
| Grade breakdown | Count per grade tier |
| Failures by factor | Which supplier/station has problems |

Best for: Incoming inspection, export certification, lot acceptance

**Simple (single spec):**
```
┌─────────────────────────────────────┐
│  CONFORMANCE SUMMARY                │
│                                     │
│  ✅ Passed:    47/50 (94%)          │
│  🔴 Rejected:   3/50 (6%)           │
│                                     │
│  Spec: 9% - 13% moisture            │
│                                     │
│  Failures by Supplier:              │
│  • Supplier B: 2 (67% of failures)  │
│  • Supplier A: 1 (33% of failures)  │
└─────────────────────────────────────┘
```

**Multi-tier grades (e.g., coffee defects):**
```
┌─────────────────────────────────────┐
│  GRADE SUMMARY (50 shipments)       │
│                                     │
│  🟢 Specialty (≤5):   42 (84%)      │
│  🟡 Premium (6-8):     5 (10%)      │
│  🟠 Exchange (9-23):   2 (4%)       │
│  🔴 Below/Off (>23):   1 (2%)       │
│                                     │
│  Target: 90% Specialty              │
│  Actual: 84% ⚠️                     │
│                                     │
│  Below target by Supplier:          │
│  • Supplier B: 3 of 4 downgrades    │
└─────────────────────────────────────┘
```

**Grade configuration:**
```
┌─────────────────────────────────────┐
│  GRADING TIERS                      │
│                                     │
│  Grade        Max Value    Color    │
│  ─────────────────────────────────  │
│  Specialty    5            🟢       │
│  Premium      8            🟡       │
│  Exchange     23           🟠       │
│  Below Std    86           🔴       │
│  [+ Add tier]                       │
│                                     │
│  Target grade: [Specialty ▼]        │
└─────────────────────────────────────┘
```

Works for any multi-tier classification:
- Coffee: Specialty → Off Grade
- Textiles: Grade A → Reject  
- Food safety: Premium → Unacceptable

**Capability Mode** — "Can our process reliably meet specs?"
| Metric | Description |
|--------|-------------|
| Mean, Std Dev | Central tendency and spread |
| Cp | Process capability (potential) — requires both USL and LSL |
| Cpk | Process capability (actual, considers centering) |
| % out of spec | Actual failure rate |
| η² (eta-squared) | Variation explained by factor |

Best for: Process improvement, ongoing monitoring, supplier qualification

**Display Options (Settings → Visualization):**
- Toggle Cp display (only available when both USL and LSL are defined)
- Toggle Cpk display

**Capability Histogram (Stats Panel → Histogram tab):**
```
┌─────────────────────────────────────┐
│  HISTOGRAM                          │
│       LSL         Mean        USL   │
│        │    ████   │           │    │
│        │   ██████  │           │    │
│        │  █████████│███        │    │
│        │ ███████████████       │    │
│  ──────┼───────────┼───────────┼──  │
│   🔴    │    🟢     │     🟢    │ 🔴 │
│ out of │  within   │   within  │out │
│  spec  │   spec    │    spec   │    │
└─────────────────────────────────────┘
```

- Distribution histogram of outcome values
- Vertical lines for USL (red dashed), LSL (red dashed), Target (green dashed), Mean (blue solid)
- Bars colored green (within spec) or red (outside spec)
- Visual complement to numeric Cp/Cpk values

```
┌─────────────────────────────────────┐
│  CAPABILITY SUMMARY                 │
│                                     │
│  Cp:  1.42    Cpk: 0.91 ⚠️          │
│  % out of spec: 6%                  │
│                                     │
│  Process is off-center (shift up)   │
│                                     │
│  Variation by Factor:               │
│  • Supplier: 34% of variation       │
│  • Day: 12% of variation            │
└─────────────────────────────────────┘
```

**Specs Input (choose one):**

Option A: Simple limits (continuous data)
```
┌─────────────────────────────────────┐
│  Specification Limits               │
│                                     │
│  USL: [________]  (upper spec)      │
│  Target: [________]  (optional)     │
│  LSL: [________]  (lower spec)      │
│                                     │
│  ☑ Show on I-Chart                  │
│  ☑ Highlight out-of-spec points     │
└─────────────────────────────────────┘
```

Option B: Multi-tier grades (count/quality data)
```
┌─────────────────────────────────────┐
│  Grade Tiers (lower is better)      │
│                                     │
│  Grade        Max Value    Color    │
│  ─────────────────────────────────  │
│  Specialty    5            🟢       │
│  Premium      8            🟡       │
│  Exchange     23           🟠       │
│  Below Std    86           🔴       │
│  [+ Add tier]                       │
│                                     │
│  Target grade: [Specialty ▼]        │
│  ☑ Color points by grade            │
└─────────────────────────────────────┘
```

When configured:
- I-Chart shows spec lines OR grade bands
- Points colored by pass/fail OR grade achieved
- Summary shows pass rate OR grade breakdown
- Boxplot/Pareto filter shows impact on grades

### 5. Data Table (View/Edit Data)

**Access**: Click table icon in header toolbar

**Features:**
- View all imported data in Excel-like table format
- Click any cell to edit inline
- Keyboard navigation (Tab/Enter between cells)
- Spec status column with color coding (PASS/USL/LSL)
- Add new rows
- Delete rows
- Apply changes to update analysis

```
┌─────────────────────────────────────────────────────────────────┐
│  Data Table                                              [X]    │
├─────────────────────────────────────────────────────────────────┤
│  50 rows                                       [+ Add Row]      │
├─────────────────────────────────────────────────────────────────┤
│  #  │ Farm    │ Batch  │ Weight │ Status │ Actions             │
│─────┼─────────┼────────┼────────┼────────┼─────────             │
│  1  │ Farm A  │ B001   │ 12.5   │ ✓ PASS │ [Delete]            │
│  2  │ Farm A  │ B002   │ 14.2   │ ✗ USL  │ [Delete]            │
│  3  │ Farm B  │ B003   │ 11.8   │ ✓ PASS │ [Delete]            │
│  ... (scrollable, click to edit)                                │
├─────────────────────────────────────────────────────────────────┤
│                                      [Cancel]  [Apply Changes]  │
└─────────────────────────────────────────────────────────────────┘
```

### 6. Save & Load Analysis

**Save Analysis (.vrs file):**
```
┌─────────────────────────────────────┐
│  Save Analysis                      │
│                                     │
│  Name: [Shift 2 Investigation    ]  │
│  Location: [Documents/VaRiScout ▼]  │
│                                     │
│  Includes:                          │
│  ☑ Data (embedded)                  │
│  ☑ Column configuration             │
│  ☑ Specifications (USL/LSL/Target)  │
│  ☑ Current filters                  │
│  ☑ Chart settings                   │
│                                     │
│  [Cancel]              [Save]       │
└─────────────────────────────────────┘
```

**File contains:**
```json
{
  "version": "1.0",
  "name": "Shift 2 Investigation",
  "created": "2024-12-28T10:30:00Z",
  "modified": "2024-12-28T14:45:00Z",
  "data": { /* embedded CSV data */ },
  "config": {
    "outcome": "CycleTime",
    "factors": ["Shift", "Station", "Operator"],
    "timeColumn": "Timestamp",
    "specs": { "usl": 50, "lsl": 40, "target": 45 }
  },
  "state": {
    "filters": [{ "column": "Shift", "values": ["2"] }],
    "boxplotFactor": "Station",
    "paretoColumn": "DefectType"
  }
}
```

**Load Analysis:**
- File → Open (or drag-drop .vrs file)
- Recent files list on home screen
- Double-click .vrs file opens in VaRiScout

**Home Screen:**
```
┌─────────────────────────────────────────────────────────────┐
│  VaRiScout Lite                                    ITC logo │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [  Import New Data (CSV/Excel)  ]                          │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Recent Analyses:                                           │
│                                                             │
│  📊 Shift 2 Investigation          Modified: Today 14:45   │
│  📊 Q4 Capability Study            Modified: Yesterday     │
│  📊 Station 3 Baseline             Modified: Dec 20        │
│                                                             │
│  [Open Other...]                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7. Export
- PNG (individual charts or dashboard)
- PDF (one-page summary)
- Simple PowerPoint (3 slides: charts + stats)

### 8. Branding
- Configurable watermark (logo or text)
- Edition name in title bar
- "Powered by VaRiScout" footer (optional)

---

## What's NOT Included

| Feature | Why excluded |
|---------|--------------|
| AI recommendations | Requires LLM, ongoing costs |
| Natural language insights | AI-dependent |
| Intent modes (Explore/Hypothesis/Monitor) | Adds complexity |
| Investigation lifecycle | Overkill for simple analysis |
| Playbooks / guided workflows | AI-dependent |
| Cloud sync | Offline-first design |
| Multi-user / collaboration | Single-user tool |

**Philosophy:** Lite users know what they're doing. They need visualization, not guidance.

---

## Technical Architecture

```
┌─────────────────────────────────────────┐
│     Progressive Web App (PWA)           │
├─────────────────────────────────────────┤
│  React Frontend                         │
│  ├── Visx charts (I-Chart, Box, Pareto) │
│  ├── Filter state management            │
│  └── Export handlers                    │
├─────────────────────────────────────────┤
│  Local Processing                       │
│  ├── CSV/Excel parser                   │
│  ├── Statistics engine (JS)             │
│  └── Control limit calculations         │
├─────────────────────────────────────────┤
│  Browser APIs                           │
│  ├── IndexedDB (project storage)        │
│  ├── localStorage (auto-save)           │
│  ├── Service Worker (offline)           │
│  └── File API (import/export)           │
└─────────────────────────────────────────┘

NO backend. NO API calls. Works offline after first visit.
```

**Deployment:**
- Vercel, Netlify, or any static host
- Users access via URL
- "Add to Home Screen" for app-like experience

---

## Editions

| Edition | Watermark | Distribution | Cost |
|---------|-----------|--------------|------|
| **ITC** | ITC logo | ITC distributes to SMEs | Free (ITC agreement) |
| **Association** | Configurable | Quality associations (ASQ, etc.) | Partnership |
| **Community** | "VaRiScout Lite" | Open download | Free |
| **Pro** | None | variscout.com | Upgrade path to full |

---

## ITC Distribution Model

```
You (deploy)                   ITC (promote)
    │                               │
    │  Host PWA on Vercel           │
    │  (variscout.itc.org or        │
    │   custom subdomain)           │
    ├──────────────────────────────►│
    │                               ▼
    │                    ITC training programs
    │                    SME support networks
    │                    Quality champion workshops
    │                               │
    │                               ▼
    │                      End users (SMEs)
    │                      - Any device with browser
    │                      - Works offline
    │                      - "Add to Home Screen"
    │                               │
    │   Some want more...           │
    │◄──────────────────────────────┤
    │                               │
    ▼
VaRiScout Pro (paid)
"Now with AI guidance"
```

**No app stores. No installers. No usage tracking. No API costs.**

---

## Build Estimate

| Component | Effort | Notes |
|-----------|--------|-------|
| Chart components | Done | Already built |
| Linked filtering | Done | Already built |
| Statistics engine | 2 days | Port/simplify existing |
| Data import | 2 days | CSV + Excel parsing |
| Save/Load (.vrs) | 2 days | JSON serialization + file handling |
| Export (PNG/PDF) | 2 days | DOM-based capture |
| Electron wrapper | 2 days | Package existing React |
| Edition config | 1 day | Watermark + branding |
| Testing + polish | 3 days | |
| **Total** | **~2.5 weeks** | |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Downloads (via ITC) | 500 in first year |
| Active users | 100 monthly |
| Conversion to Pro | 5% of active users |
| Support tickets | < 10/month (simple tool = few questions) |

---

## Next Steps

1. **Confirm with ITC** — Do they want this simpler version?
2. **Finalize feature scope** — Any must-haves missing?
3. **Build Electron shell** — Package existing React components
4. **Create ITC branded build** — Logo, colors, watermark
5. **Handoff** — ITC takes distribution from there

---

## Summary

> **VaRiScout Lite** is a fast, offline variation analysis tool for people who know what they're doing but need better tools than Excel. No AI, no subscriptions, no complexity — just linked charts that reveal hidden variation.
>
> Perfect for ITC's quality champion network: distribute freely, zero ongoing costs, clean licensing.