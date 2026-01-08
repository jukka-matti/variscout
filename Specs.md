# VaRiScout Lite — Product Spec

**Version:** 1.0  
**Date:** December 2024  
**Status:** Draft

---

## What Is It?

A lightweight, offline variation analysis tool for quality professionals. No AI, no subscriptions, no API keys — just fast, linked charts that reveal hidden variation.

**Tagline:** _"Cut through your watermelons — without the cloud."_

---

## Target Users

| User                     | Context                                | Why Lite works                                |
| ------------------------ | -------------------------------------- | --------------------------------------------- |
| **Quality Champions**    | SMEs in developing countries (via ITC) | Know statistics, need better tools than Excel |
| **Experienced analysts** | Already know what to look for          | Don't need AI guidance                        |
| **Trainers / educators** | Teaching variation analysis            | Clean demo tool, no AI unpredictability       |
| **LSS Trainers**         | Green Belt / Black Belt courses        | Minitab replacement with zero installation    |
| **Offline environments** | Factory floor, limited connectivity    | 100% local, no internet needed                |

---

## Core Features

### 1. Data Import

- CSV and Excel (.xlsx)
- **Data Mapping Stage**: Interstitial screen to confirm/select Outcome (Y) and Factors (X) before analysis
- **Smart Auto-Mapping**: Keyword-based column detection (e.g., "weight" → outcome, "shift" → factor)
- **Data Validation**: Informational validation showing excluded rows (missing/non-numeric values)
  - DataQualityBanner shows valid/excluded row counts
  - "View Excluded Rows" opens Data Table filtered to issues
  - Analysis proceeds with valid rows only
- **Separate Pareto**: Optional upload of pre-aggregated count data (not linked to filters)
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

**Staged I-Chart (optional):**

- Select a categorical column as "Stage Column" to divide chart into phases
- Each stage calculates its own control limits (UCL, Mean, LCL)
- Data automatically sorted by stage (all Stage A points, then Stage B, etc.)
- Stage order modes: Auto-detect, First occurrence, Alphabetical
- Vertical dividers mark stage boundaries
- Points colored based on their stage's control limits
- Use cases: before/after process improvements, comparing batches, equipment changes

### 3. Interactive Analysis (Multi-Vari)

- **Outcome Selection**: Switch primary metric (Y) directly from I-Chart header
- **Factor Selection**: Segmented pill-button control for factor selection
  - Blue highlight shows selected factor
  - Amber dot indicator when filter active on that factor
  - Clicking chart element syncs both Boxplot and Pareto to same factor
- **Click-to-Edit Axes**: Click Y-axis to manually set Min/Max or reset to Auto
- **Linked Filtering with Drill-Down**:
  - Click Boxplot category → filters to that factor level
  - Click Pareto bar → filters to that category
  - I-Chart point click → highlights row (no filter)
  - **Breadcrumb Trail**: Shows current filter path with navigation
    - `[🏠 All Data] > [Machine: A, B ✕] > [Shift: Day ✕]  [✕ Clear All]`
  - Click breadcrumb item → navigates back to that state
  - Click × on breadcrumb segment → removes that specific filter
  - Clear All button → resets to unfiltered view
- **Filter Chips**: Active filters shown as removable chips
  - Displays below breadcrumb in sticky navigation
  - Each chip shows factor:values with × remove button
  - "Clear all" button when multiple filters active
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
- Configurable Cpk target threshold (default: 1.33)
  - Values below target shown in warning color (yellow/amber)
  - Values at or above target shown in success color (green)
  - Currently available in Excel Add-in; PWA uses fixed 1.33 threshold

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

**Validation Features:**

- "Show Excluded Only" toggle to filter to problem rows
- Amber background highlighting for excluded rows
- Warning icon with tooltip showing exclusion reason per row
- Accessible from DataQualityBanner via "View Excluded Rows"

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
  "data": {
    /* embedded CSV data */
  },
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

**Implemented:**

- PNG (individual charts or dashboard)
- CSV (with spec status column)
- .vrs project files (JSON format)

### 8. Branding (Implemented)

**Chart Footer Source Bar:**

```
┌─────────────────────────────────────┐
│  [chart content]                    │
├─────────────────────────────────────┤
│ ▌VariScout Lite          n=50      │
└─────────────────────────────────────┘
```

- Blue accent bar (3px) + branding text on left
- Sample size (n=count) on right
- Semi-transparent slate background
- Visible in Community & ITC editions
- Hidden when Pro edition or valid license key activated

**License Key System:**

- Format: `VSL-XXXX-XXXX-XXXX` (16 chars with checksum)
- Offline validation (no server required)
- Stored in localStorage
- UI: Settings → License section

### 9. Statistical Tooltips

Comprehensive hover tooltips explain statistical terms throughout the app. Hover over any metric label or the help icon (?) to see a plain-language explanation.

**Coverage:**

| Component        | Terms Explained                             |
| ---------------- | ------------------------------------------- |
| Stats Panel      | Pass Rate, Rejected %, Cp, Cpk              |
| ANOVA Results    | p-value, F-statistic, η² (eta-squared)      |
| Dashboard        | UCL, LCL, Mean (control limits)             |
| Regression Panel | R², p-value, slope                          |
| Gage R&R Panel   | %GRR, variance components, interaction plot |

**Example Tooltips:**

```
Cpk: "Process Capability Index. Measures how centered your process
      is within spec limits. ≥1.33 is typically required."

p-value: "Probability the observed difference happened by chance.
          p < 0.05 means the groups are statistically different."

UCL: "Upper Control Limit. Points above this indicate special cause
      variation (something changed in the process)."

%GRR: "Total measurement system variation as a percentage of study
       variation. <10% excellent, 10-30% marginal, >30% needs work."
```

**Design:** Tooltips appear on hover/tap with minimal delay. Uses HelpCircle icon next to terms. No clutter when not engaged.

### 10. Embed Mode & Deep Linking

The PWA supports URL parameters for embedding in website case studies or sharing specific analyses.

**URL Parameters:**

| Parameter      | Purpose                       | Example                           |
| -------------- | ----------------------------- | --------------------------------- |
| `sample=<key>` | Auto-load a sample dataset    | `?sample=mango-export`            |
| `embed=true`   | Hide header/footer for iframe | `?sample=mango-export&embed=true` |

**Available Sample Keys:**

| Key                 | Dataset                   | Learning Focus               |
| ------------------- | ------------------------- | ---------------------------- |
| `mango-export`      | Agri-Food: Mango Export   | Factor identification, ANOVA |
| `textiles-strength` | Textiles: Fabric Strength | Process capability, Cpk      |
| `coffee-defects`    | Coffee: Defect Analysis   | Pareto, grade breakdown      |

**Embed Example:**

```html
<iframe
  src="https://app.variscout.com?sample=mango-export&embed=true"
  title="VariScout Interactive Analysis"
  width="100%"
  height="600"
  frameborder="0"
></iframe>
```

**Use Cases:**

- Website case study pages with guided exploration
- Embedding in training materials or documentation
- Sharing pre-configured analyses via link

---

## UI Design Principles

### Scrollable Dashboard Layout

The dashboard uses a scrollable layout with minimum chart heights for comfortable analysis:

| Chart   | Minimum Height | Purpose                                 |
| ------- | -------------- | --------------------------------------- |
| I-Chart | 400px          | Primary chart needs good vertical space |
| Boxplot | 280px          | Enough for readable axes                |
| Pareto  | 280px          | Enough for readable axes                |

**Sticky Navigation**: Breadcrumb trail and tab bar remain visible at top while scrolling.

### Dashboard Structure

```
┌─────────────────────────────────────────────────────────────┐
│  🏠 All Data > Machine: A  [Clear All]    (sticky header)   │
│  [Analysis] [Gage R&R]                                      │
├─────────────────────────────────────────────────────────────┤
│  I-Chart                                    [Outcome ▼]     │
│                                                             │
│  (scrollable content)                                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Boxplot      │  Pareto       │  Summary                    │
│  [Factor ▼]   │  [Category ▼] │  [Prob] [Cap]               │
│               │               │                             │
└───────────────┴───────────────┴─────────────────────────────┘
```

### Independent Panel Selections

Each panel has its own data selector and operates independently:

| Panel   | Selection                     | Required  |
| ------- | ----------------------------- | --------- |
| I-Chart | Outcome (numeric column)      | Yes       |
| Boxplot | Factor (categorical column)   | No        |
| Pareto  | Category (categorical column) | No        |
| Summary | Uses Outcome                  | Automatic |

### Empty State Behavior

When no data is selected for a panel, it displays a dropdown prompt rather than hiding or rearranging the layout. This keeps the interface consistent and learnable.

### Header & Workspace Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  📂 Project Name          data.csv (1,247 rows)    [Copy ▼] [⚙]│
├─────────────────────────────────────────────────────────────────┤
│  I-Chart ...                                                    │
```

| Element      | Description                     |
| ------------ | ------------------------------- |
| Project name | Editable, user-defined          |
| Data file    | Shows source file and row count |
| Copy menu    | Copy All, Copy Chart options    |
| Settings     | Gear icon for preferences       |

### Presentation Mode

Fullscreen distraction-free view for stakeholder presentations:

- Access via **View → Presentation Mode**
- Displays all charts in optimized layout:
  - I-Chart on top (~60% height)
  - Boxplot, Pareto, Stats Panel in bottom row
- Hides header, footer, tabs, and breadcrumbs
- Press **Escape** to exit
- Subtle "Press Escape to exit" hint in bottom right

### Filter State Display

Always show current filter state so users know what subset of data they're viewing:

**No filters (default):**

```
│  📂 Cycle Time Reduction                    n = 1,247 rows │
```

**Filters active:**

```
│  📂 Cycle Time Reduction                                   │
│  Shift = Night ✕ → Machine = Oven B ✕   [Clear] n = 47    │
```

| Action                 | Result                 |
| ---------------------- | ---------------------- |
| Click boxplot category | Adds filter            |
| Click pareto bar       | Adds filter            |
| Click ✕ on filter chip | Removes that filter    |
| Click "Clear All"      | Resets to full dataset |

### Copy & Export Workflow

| Option     | Description                                             |
| ---------- | ------------------------------------------------------- |
| Copy All   | Entire dashboard view as single image                   |
| Copy Chart | Individual chart (I-Chart, Boxplot, Pareto, or Summary) |
| Copy Stats | Summary statistics as formatted text                    |

Charts are copied to clipboard as PNG — paste directly into PowerPoint, Word, Google Slides, or email.

### Design Principles Summary

| Principle              | Implementation                               |
| ---------------------- | -------------------------------------------- |
| Scrollable layout      | Charts have comfortable min-heights          |
| Sticky navigation      | Breadcrumb and tabs visible while scrolling  |
| Consistent layout      | Same structure regardless of data selections |
| Independent selections | Each panel has its own data selector         |
| Empty state = prompt   | Shows dropdown when no data selected         |
| Presentation mode      | Fullscreen view for stakeholder meetings     |

---

## What's NOT Included

| Feature                                   | Why excluded                 |
| ----------------------------------------- | ---------------------------- |
| AI recommendations                        | Requires LLM, ongoing costs  |
| Natural language insights                 | AI-dependent                 |
| Intent modes (Explore/Hypothesis/Monitor) | Adds complexity              |
| Investigation lifecycle                   | Overkill for simple analysis |
| Playbooks / guided workflows              | AI-dependent                 |
| Cloud sync                                | Offline-first design         |
| Multi-user / collaboration                | Single-user tool             |

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

## Editions & Freemium Model

### Editions

| Edition       | Footer Bar                        | Distribution           | Price    |
| ------------- | --------------------------------- | ---------------------- | -------- |
| **Community** | "VariScout Lite" + n=             | Public web             | Free     |
| **ITC**       | "International Trade Centre" + n= | ITC network            | Free     |
| **Licensed**  | None (hidden)                     | License key activation | €49/year |

### Freemium Model: Free vs Licensed

| Feature                      | Free            | Licensed (€49/year) |
| ---------------------------- | --------------- | ------------------- |
| All chart types              | ✓               | ✓                   |
| Full analysis features       | ✓               | ✓                   |
| Copy to clipboard            | ✓ (watermark)   | ✓                   |
| Export PNG/CSV               | ✓ (watermark)   | ✓                   |
| **Save projects**            | ❌ Session only | ✓                   |
| **Export/import .vrs files** | ❌              | ✓                   |
| **Save templates**           | ❌              | ✓                   |
| **Watermark-free exports**   | ❌              | ✓                   |
| Priority support             | ❌              | ✓                   |

**Key insight:** Save is the upgrade gate, not just watermark removal.

- **Free = Try everything**, do quick one-off analyses
- **Licensed = Save your work**, share with colleagues

### Upgrade Triggers

| Trigger                         | Action                                     |
| ------------------------------- | ------------------------------------------ |
| Click "Save Project"            | Show upgrade prompt with features list     |
| Browser close with unsaved data | Show warning (optional, can disable)       |
| Export chart                    | Show watermark, mention upgrade removes it |

**"Don't show again" option:** Users can opt out of upgrade prompts in Settings. The upgrade option remains visible in Settings → License.

**Build Commands:**

```bash
pnpm build:pwa:community  # Default public release
pnpm build:pwa:itc        # ITC-branded build
pnpm build:pwa:licensed   # Pre-licensed builds (no branding)
pnpm build:excel          # Excel Add-in build
```

**Runtime Upgrade:**
Community users can upgrade to Pro by entering a valid license key in Settings.

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

| Component             | Effort | Notes                                         |
| --------------------- | ------ | --------------------------------------------- |
| Chart components      | Done   | Already built                                 |
| Linked filtering      | Done   | Already built                                 |
| Statistics engine     | Done   | Cp/Cpk, grade counts, conformance             |
| Data import           | Done   | CSV + Excel parsing                           |
| Save/Load (.vrs)      | Done   | JSON serialization + file handling            |
| Export (PNG/CSV)      | Done   | DOM-based capture, CSV generation             |
| Edition config        | Done   | Watermark + branding                          |
| Manual Entry          | Done   | Touch-optimized data entry                    |
| Data Table            | Done   | Inline editing                                |
| Shared charts package | Done   | @variscout/charts with props-based components |
| Excel Add-in          | Done   | Task Pane wizard + Content Add-in charts      |
| **Completed**         | ✓      | Core features + Excel Add-in implemented      |

---

## Success Metrics

| Metric              | Target                                   |
| ------------------- | ---------------------------------------- |
| Downloads (via ITC) | 500 in first year                        |
| Active users        | 100 monthly                              |
| Conversion to Pro   | 5% of active users                       |
| Support tickets     | < 10/month (simple tool = few questions) |

---

## Planned Features (Green Belt Training)

For complete Green Belt training coverage, three features are planned. See [LSS Trainer Strategy](docs/concepts/LSS_TRAINER_STRATEGY.md) for detailed specifications.

### Feature Summary

| Feature             | Type        | Effort | Purpose                                            |
| ------------------- | ----------- | ------ | -------------------------------------------------- |
| ANOVA under Boxplot | Enhancement | Small  | Statistical confirmation of group differences      |
| Regression Tab      | New Tab     | Medium | Multi-factor comparison with auto-fit intelligence |
| Gage R&R Tab        | New Tab     | Medium | Measurement system analysis                        |

### ANOVA Integration

Add ANOVA calculations below the existing boxplot visualization:

- Group means, sample sizes, and standard deviations
- F-ratio and p-value
- Plain-language interpretation: "Different? YES (p = 0.003)"
- No separate t-test needed (2-group ANOVA is mathematically equivalent)

### Regression Tab

A new tab with 2×2 grid of scatter plots:

- Each plot shows one X-Y relationship with regression line
- R² value with star rating (★★★★★ for > 0.9)
- Auto-fit intelligence (recommends quadratic when appropriate)
- Summary ranking: "Temperature → Speed → Pressure" by R² strength

### Gage R&R Tab

Measurement System Analysis (MSA) tab:

- Input: Part ID, Operator ID, Measurement columns
- Variance breakdown chart (Part-to-Part vs Repeatability vs Reproducibility)
- %GRR result with verdict (< 10% Excellent, 10-30% Marginal, > 30% Unacceptable)
- Operator × Part interaction plot

---

## Competitive Positioning

### vs Minitab

| Aspect         | Minitab          | VaRiScout            |
| -------------- | ---------------- | -------------------- |
| Price          | $1,000+/year     | €49/year or free     |
| Installation   | Desktop software | Browser (no install) |
| Learning curve | Steep            | Minimal              |
| Feature depth  | Deep (30 years)  | Focused (essentials) |
| Target         | Statisticians    | Everyone             |

### vs Excel

| Aspect           | Excel              | VaRiScout    |
| ---------------- | ------------------ | ------------ |
| Setup            | Build from scratch | Ready to use |
| Control limits   | Manual calculation | Automatic    |
| Linked filtering | Complex            | One click    |
| Export quality   | Varies             | Consistent   |

### Positioning Statement

> "VaRiScout is for practitioners who need answers, not statisticians who need tools. Simple enough for anyone. Rigorous enough for experts."

---

## Success Metrics

### Product Metrics

| Metric                      | Target        |
| --------------------------- | ------------- |
| Time to first chart         | < 2 minutes   |
| Free → Paid conversion      | 5-10%         |
| Monthly active users (free) | 1,000+        |
| Paid subscribers            | 100+ (Year 1) |

### Business Metrics

| Metric               | Year 1 Target |
| -------------------- | ------------- |
| ARR (PWA + Excel)    | €25,000       |
| Support tickets/user | < 0.1         |
| Churn rate           | < 20%         |

---

## Summary

> **VaRiScout Lite** is a fast, offline variation analysis tool for people who know what they're doing but need better tools than Excel. No AI, no subscriptions, no complexity — just linked charts that reveal hidden variation.
>
> Perfect for quality professionals, LSS trainers, and ITC's quality champion network: distribute freely, zero ongoing costs, clean licensing.
