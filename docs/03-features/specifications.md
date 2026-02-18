# VariScout — Product Spec

**Version:** 1.0  
**Date:** December 2024  
**Status:** Draft

---

## What Is It?

A lightweight, offline variation analysis tool for quality professionals. No AI, no API keys — just fast, linked charts that reveal hidden variation.

**Tagline:** _"Cut through your watermelons — without the cloud."_

---

## Target Users

| User                     | Context                             | Why Lite works                                |
| ------------------------ | ----------------------------------- | --------------------------------------------- |
| **Quality Champions**    | SMEs in developing countries        | Know statistics, need better tools than Excel |
| **Experienced analysts** | Already know what to look for       | Don't need AI guidance                        |
| **Trainers / educators** | Teaching variation analysis         | Clean demo tool, no AI unpredictability       |
| **LSS Trainers**         | Green Belt / Black Belt courses     | Minitab replacement with zero installation    |
| **Offline environments** | Factory floor, limited connectivity | 100% local, no internet needed                |

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
│  [Violin Mode: density]     │                               │
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

**Specification Limits (optional):**

- User inputs USL, LSL, and/or Target
- Shown as distinct colored lines
- Points colored by pass/fail status
- Enables conformance summary calculations

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
  - **Scale Mode**: Auto (fit to data), Start at Zero, or Manual
  - **Control Limits Visibility**: Toggle UCL/Mean/LCL display in Settings
- **Boxplot Display Options** (via SlidersHorizontal icon in card header):
  - Violin mode (KDE density overlay)
  - Contribution labels (category impact %)
  - Category sorting: by Name (alphabetical), Mean, or Spread (IQR); ascending/descending
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

**Capability Mode** — "Can our process reliably meet specs?"
| Metric | Description |
|--------|-------------|
| Mean | Central tendency |
| Median | Midpoint value (always shown alongside Mean) |
| Std Dev | Spread of the distribution |
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
  - Configurable threshold available in Azure App; PWA uses fixed 1.33 threshold

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

When configured:

- I-Chart shows spec lines
- Points colored by pass/fail
- Summary shows pass rate and conformance
- Boxplot/Pareto filter shows impact on out-of-spec rates

### Spec Discovery Flow (Progressive Disclosure)

Users can set specification limits at two points in the workflow:

**1. During column mapping (optional)**

The ColumnMapping component includes a collapsible "Set Specification Limits" section at the bottom. It is collapsed by default — users who already know their specs can expand it and enter Target, LSL, and USL before proceeding to analysis. Values are applied automatically; no Apply button is required.

```
┌─────────────────────────────────────┐
│  Column Mapping                     │
│  ...                                │
│  ▶ Set Specification Limits         │  ← collapsed by default
└─────────────────────────────────────┘

Expanded:
┌─────────────────────────────────────┐
│  ▼ Set Specification Limits         │
│                                     │
│  Target: [________]   (optional)    │
│  LSL:    [________]   (optional)    │
│  USL:    [________]   (optional)    │
└─────────────────────────────────────┘
```

**2. Inline in the Stats Panel (when no specs are set)**

When the user reaches the dashboard without having set specs, the Stats Panel shows inline spec inputs in place of the silent omission of Cp/Cpk/Pass Rate. The entry is Target-first (lowest commitment), with LSL and USL accessible via an expand toggle.

```
┌─────────────────────────────────────┐
│  STATS                              │
│  Mean: 12.4    Median: 12.2         │
│  Std Dev: 0.8  Samples: 50          │
│                                     │
│  Set a target to enable Cp/Cpk:     │
│  Target: [________]  [▼ + LSL/USL]  │
└─────────────────────────────────────┘
```

Once specs are entered and the field loses focus (on blur), the inline area transforms into the normal Cp/Cpk/Pass Rate cards — no button press required:

```
┌─────────────────────────────────────┐
│  STATS                              │
│  Mean: 12.4    Median: 12.2         │
│  Std Dev: 0.8  Samples: 50          │
│                                     │
│  Cp:  1.42    Cpk: 0.91 ⚠️          │
│  Pass Rate: 94%                     │
└─────────────────────────────────────┘
```

**Design rationale:** Target is shown first because it requires the least commitment — a user who only knows their ideal value can still unlock partial capability feedback. LSL and USL expand progressively when needed.

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

### 6. Save & Load Analysis (Azure App)

> Save/load and .vrs files are **Azure App only**. The PWA is session-only — data is cleared on refresh.

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

**Load Analysis (Azure App):**

- File → Open (or drag-drop .vrs file)
- Recent analyses list on home screen
- Double-click .vrs file opens in VariScout

**Home Screen (PWA):**

```
┌─────────────────────────────────────────────────────────────┐
│  VariScout                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Try a Sample Dataset:                                      │
│                                                             │
│  [☕ Coffee]  [🏭 Bottleneck]  [🏥 Hospital]  [📦 Packaging] │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  [  Paste from Excel  ]  (primary action)                   │
│                                                             │
│  Or enter data manually                                     │
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
- Visible in free tier
- Hidden for paid tiers (`isPaidTier()` from `@variscout/core/tier`)

### 9. Statistical Tooltips

Comprehensive hover tooltips explain statistical terms throughout the app. Hover over any metric label or the help icon (?) to see a plain-language explanation.

**Coverage:**

| Component        | Terms Explained                        |
| ---------------- | -------------------------------------- |
| Stats Panel      | Pass Rate, Rejected %, Cp, Cpk         |
| ANOVA Results    | p-value, F-statistic, η² (eta-squared) |
| Dashboard        | UCL, LCL, Mean (control limits)        |
| Regression Panel | R², p-value, slope                     |

**Example Tooltips:**

```
Cpk: "Process Capability Index. Measures how centered your process
      is within spec limits. ≥1.33 is typically required."

p-value: "Probability the observed difference happened by chance.
          p < 0.05 means the groups are statistically different."

UCL: "Upper Control Limit. Points above this indicate special cause
      variation (something changed in the process)."
```

**Design:** Tooltips appear on hover/tap with minimal delay. Uses HelpCircle icon next to terms. No clutter when not engaged.

### 10. Control Violation Explanations & Special Cause Education

**Purpose:** Help users understand why points are flagged red (special cause variation) in control charts, supporting the core SPC learning journey from common vs. special cause distinction.

**Implementation:**

#### Enhanced I-Chart Tooltips

Hover tooltips on I-Chart data points now explain violation types:

```
#42                           ← Point number
Value: 45.2                  ← Measurement value
⚠️ Special Cause: Above UCL   ← Color-coded status (red for control, factual signal)
```

**Violation Types:**

- **Special Cause (Red)**: Control limit violations (Above/Below UCL/LCL) + Nelson Rule 2
- **Out-of-Spec (Orange)**: Specification limit violations (Above/Below USL/LSL)
- **In-Control (Blue)**: Normal random variation - no action needed

#### Data Window Row Annotations

The Data Panel (side table) shows violation icons next to row numbers:

- 🟡 **AlertTriangle** (amber) = Data quality issues (missing/non-numeric values)
- 🔴 **AlertCircle** (red) = Control violations (special cause)

**Hover tooltip shows specific reasons:**

- "Special Cause: Above UCL"
- "Special Cause: Below LCL"
- "Special Cause: Nelson Rule 2 (9 consecutive points on same side of mean)"
- "Above USL" (spec violation)
- "Below LSL" (spec violation)

Multiple violations can appear for a single point (e.g., both control and spec limits).

#### Educational Glossary Terms

New glossary terms support deeper learning (accessed via HelpTooltip icons):

| Term          | Definition                                              | Category    | Learn More Path   |
| ------------- | ------------------------------------------------------- | ----------- | ----------------- |
| Special Cause | Variation due to unusual events requiring investigation | Methodology | /learn/two-voices |
| Common Cause  | Random variation inherent to stable processes           | Methodology | /learn/two-voices |
| Nelson Rule 2 | 9+ consecutive points on same side of mean (shift)      | Methodology | /tools/i-chart    |
| In-Control    | Stable process with only common cause variation         | Methodology | /learn/two-voices |

**Pedagogical Goal:** Users learn the core SPC concept of **Special Cause vs Common Cause** variation:

- **Blue dots** = Common cause (random, inherent) → No action, process is predictable
- **Red dots** = Special cause (assignable, unusual) → Investigate and correct
- This prevents both **tampering** (fixing common cause) and **under-reaction** (ignoring special cause)

**Design Philosophy:**

- Use "Special Cause" terminology consistently (industry standard)
- Contrast with "Common Cause" to reinforce the distinction
- **Factual language**: State the signal clearly without prescriptive action (VariScout finds WHERE to focus; user applies domain knowledge to determine WHY)
- Progressive disclosure: Quick tooltip → Glossary definition → Website learning content
- Aligns with philosophy doc: "VariScout identifies factors driving variation, not 'root causes'"

**Industry Benchmark Alignment:**
Matches Minitab, QI Macros, and Six Sigma tool patterns:

- Visual indicators (red dots)
- Hover tooltips with rule explanations
- Data table annotations
- Pattern highlighting for Nelson rules

### 11. Embed Mode & Deep Linking

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
| `coffee-defects`    | Coffee: Defect Analysis   | Pareto, defect analysis      |

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
│  [Analysis] [Regression]                                     │
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
│  ├── Service Worker (offline)           │
│  └── File API (import/export)           │
└─────────────────────────────────────────┘

NO backend. NO API calls. Works offline after first visit.
```

**Deployment:**

- Vercel, Netlify, or any static host
- Users access via URL
- Service Worker enables offline use after first visit

---

## Products & Pricing

| Product   | Distribution      | Pricing                                        | Status      |
| --------- | ----------------- | ---------------------------------------------- | ----------- |
| Azure App | Azure Marketplace | €150/month (Managed Application, all features) | **PRIMARY** |
| PWA       | Public URL        | FREE (forever, training & education)           | Production  |

### Free (PWA)

- All core chart types (I-Chart, Boxplot, Pareto, Capability, Regression, ANOVA)
- Copy-paste data input + sample datasets
- VariScout branding on charts
- Session-only storage (no save)

### Enterprise (Azure App — €150/month)

- All features, unlimited users
- EasyAuth (Microsoft SSO) + OneDrive sync
- File upload (CSV/Excel), save/persistence, .vrs export
- Performance Mode (multi-channel analysis)
- Watermark-free exports, custom theming
- Managed Application deployment via Azure Marketplace

**Build Commands:**

```bash
pnpm build              # Build all packages and apps
```

---

## Build Estimate

| Component             | Effort | Notes                                         |
| --------------------- | ------ | --------------------------------------------- |
| Chart components      | Done   | Already built                                 |
| Linked filtering      | Done   | Already built                                 |
| Statistics engine     | Done   | Cp/Cpk, conformance                           |
| Data import           | Done   | CSV + Excel parsing                           |
| Save/Load (.vrs)      | Done   | JSON serialization + file handling            |
| Export (PNG/CSV)      | Done   | DOM-based capture, CSV generation             |
| Edition config        | Done   | Watermark + branding                          |
| Manual Entry          | Done   | Touch-optimized data entry                    |
| Data Table            | Done   | Inline editing                                |
| Shared charts package | Done   | @variscout/charts with props-based components |
| **Completed**         | ✓      | Core features implemented                     |

---

## Success Metrics

| Metric                 | Target                                   |
| ---------------------- | ---------------------------------------- |
| Downloads              | 500 in first year                        |
| Active users           | 100 monthly                              |
| Conversion to Licensed | 5% of active users                       |
| Support tickets        | < 10/month (simple tool = few questions) |

---

## Planned Features (Green Belt Training)

For complete Green Belt training coverage, two features are planned.

### Feature Summary

| Feature             | Type        | Effort | Purpose                                            |
| ------------------- | ----------- | ------ | -------------------------------------------------- |
| ANOVA under Boxplot | Enhancement | Small  | Statistical confirmation of group differences      |
| Regression Tab      | New Tab     | Medium | Multi-factor comparison with auto-fit intelligence |

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

---

## Competitive Positioning

### vs Minitab

| Aspect         | Minitab          | VaRiScout            |
| -------------- | ---------------- | -------------------- |
| Price          | $1,000+/year     | €150/month or free   |
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

> **VariScout** is a fast, offline variation analysis tool for people who know what they're doing but need better tools than Excel. No AI, no subscriptions, no complexity — just linked charts that reveal hidden variation.
>
> Perfect for quality professionals and LSS trainers: distribute freely, zero ongoing costs, clean licensing.
