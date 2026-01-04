# VariScout Lite: User Flows

This document maps the main user journeys through the application.

---

## Primary User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                        ENTRY POINTS                              │
├─────────────┬─────────────┬─────────────┬──────────────────────┤
│ Upload CSV  │ Load Sample │ Open Saved  │ Import .vrs          │
│ or Excel    │ Data        │ Project     │ File                 │
└──────┬──────┴──────┬──────┴──────┬──────┴──────────┬───────────┘
       │             │             │                  │
       ▼             │             │                  │
┌──────────────┐     │             │                  │
│ Column       │     │             │                  │
│ Mapping      │◄────┘             │                  │
│ (select Y,X) │                   │                  │
└──────┬───────┘                   │                  │
       │                           │                  │
       ▼                           ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DASHBOARD                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ I-CHART (time series with control limits)               │   │
│  │  • UCL/Mean/LCL auto-calculated                         │   │
│  │  • Spec limits shown if defined (USL/LSL)               │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌────────────────────┐  ┌────────────────────┐  ┌─────────┐   │
│  │ BOXPLOT            │  │ PARETO             │  │ STATS   │   │
│  │ (by factor)        │  │ (frequency)        │  │ PANEL   │   │
│  │                    │  │                    │  │         │   │
│  │ Click to filter ───┼──┼─► All charts link  │  │ Cp/Cpk  │   │
│  └────────────────────┘  └────────────────────┘  │ Grades  │   │
│                                                   └─────────┘   │
└─────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│                        EXIT POINTS                               │
├─────────────┬─────────────┬─────────────┬──────────────────────┤
│ Save to     │ Export      │ Export      │ Export               │
│ Browser     │ .vrs File   │ CSV         │ PNG Image            │
└─────────────┴─────────────┴─────────────┴──────────────────────┘
```

---

## Entry Point Flows

### 1. File Upload Flow

```
User drops CSV/Excel file
         │
         ▼
┌────────────────────────────┐
│ useDataIngestion           │
│ handleFileUpload()         │
│  • Parse file              │
│  • Check row limits        │
│  • Auto-detect columns     │
└────────────┬───────────────┘
             │
             ▼
┌────────────────────────────┐
│ ColumnMapping              │
│  • Select Outcome (Y)      │
│  • Select Factors (X)      │
│  • Max 3 factors           │
└────────────┬───────────────┘
             │
             ▼
         Dashboard
```

**State Changes:**

- `rawData` ← parsed file data
- `outcome` ← user selection
- `factors` ← user selection (0-3)

### 2. Load Sample Data Flow

```
User clicks sample button (Mango/Textile/Coffee)
         │
         ▼
┌────────────────────────────┐
│ loadSample()               │
│  • Set rawData             │
│  • Set outcome/factors     │
│  • Set specs/grades        │
│  • Skip ColumnMapping      │
└────────────┬───────────────┘
             │
             ▼
      Dashboard (direct)
```

**Note:** Sample data includes pre-configured specs, so ColumnMapping is skipped.

### 3. Import .vrs Project Flow

```
User selects .vrs file
         │
         ▼
┌────────────────────────────┐
│ importFromFile()           │
│  • Parse JSON              │
│  • Validate schema         │
│  • Restore full state      │
└────────────┬───────────────┘
             │
             ▼
      Dashboard with all
      settings restored
```

### 4. Open Saved Project Flow

```
User clicks "Open Saved Projects"
         │
         ▼
┌────────────────────────────┐
│ SavedProjectsModal         │
│  • List from IndexedDB     │
│  • Show name, date, rows   │
└────────────┬───────────────┘
             │ User selects project
             ▼
┌────────────────────────────┐
│ loadProject(id)            │
│  • Query IndexedDB         │
│  • Restore state           │
│  • Set project name        │
└────────────┬───────────────┘
             │
             ▼
         Dashboard
```

---

## Linked Filtering (Core Interaction)

All charts share the same filter state. Clicking any chart element filters all others.

```
User clicks "Farm A" in Boxplot
         │
         ▼
┌────────────────────────────┐
│ useDrillDown.drillDown({   │
│   source: 'boxplot',       │
│   factor: 'Farm',          │
│   values: ['Farm A']       │
│ })                         │
└────────────┬───────────────┘
             │
             ▼
┌────────────────────────────┐
│ drillStack updated         │
│ → syncs to DataContext     │
│ → filteredData recalculates│
└────────────┬───────────────┘
             │
    ┌────────┼────────┬───────────────┐
    ▼        ▼        ▼               ▼
┌───────┐ ┌───────┐ ┌───────┐ ┌─────────────────┐
│I-Chart│ │Boxplot│ │Pareto │ │ DrillBreadcrumb │
│updates│ │updates│ │updates│ │ shows filter    │
└───────┘ └───────┘ └───────┘ │ path: All Data  │
                              │ > Farm: Farm A  │
                              └─────────────────┘
             │
             ▼
    Navigation options:
    • ESC key → clears all filters
    • Click breadcrumb → navigates to that point
    • Click same element → toggles filter off
```

**Filter Behavior:**

- Filters are additive (AND logic)
- Click Farm A + Shift 1 → shows only (Farm A AND Shift 1)
- ESC key clears all filters
- Clicking same element toggles filter off
- Breadcrumb provides visual navigation trail

---

## Specification Flows

### Set Standard Specs (USL/LSL)

```
User clicks gear icon in Stats Panel
         │
         ▼
┌────────────────────────────┐
│ SpecEditor                 │
│  • USL input               │
│  • Target input            │
│  • LSL input               │
└────────────┬───────────────┘
             │ User saves
             ▼
┌────────────────────────────┐
│ setSpecs({ usl, lsl })     │
└────────────┬───────────────┘
             │
             ▼
    ┌────────┴────────┐
    ▼                 ▼
┌─────────┐    ┌─────────────┐
│ Charts  │    │ Stats Panel │
│ show    │    │ calculates  │
│ spec    │    │ Cp/Cpk      │
│ lines   │    │ pass rate   │
└─────────┘    └─────────────┘
```

### Set Multi-Tier Grades (Coffee/Textiles)

```
User adds grade tiers
         │
         ▼
┌────────────────────────────┐
│ Grades Configuration       │
│  • Specialty: max=5        │
│  • Premium: max=8          │
│  • Exchange: max=23        │
│  • Off-Grade: max=86       │
└────────────┬───────────────┘
             │
             ▼
┌────────────────────────────┐
│ setGrades([...])           │
└────────────┬───────────────┘
             │
             ▼
    ┌────────┴────────┐
    ▼                 ▼
┌─────────┐    ┌─────────────┐
│ I-Chart │    │ Stats Panel │
│ points  │    │ shows Grade │
│ colored │    │ Summary     │
│ by grade│    │ (not Cp/Cpk)│
└─────────┘    └─────────────┘
```

---

## Data Persistence Flows

### Auto-Save (Session Recovery)

```
Any state change
         │
         ▼
┌────────────────────────────┐
│ Debounce 1 second          │
└────────────┬───────────────┘
             │
             ▼
┌────────────────────────────┐
│ localStorage.setItem(      │
│   'variscout_autosave',    │
│   JSON.stringify(state)    │
│ )                          │
└────────────────────────────┘

On page reload:
┌────────────────────────────┐
│ loadAutoSave()             │
│  • Check localStorage      │
│  • Restore if present      │
└────────────────────────────┘
```

### Save Named Project

```
User clicks save icon
         │
    ┌────┴────┐
    │         │
    ▼         ▼
Has name?   No name
    │         │
    ▼         ▼
Quick     Show name
save      input dialog
    │         │
    └────┬────┘
         ▼
┌────────────────────────────┐
│ IndexedDB.put('projects',  │
│   { id, name, state })     │
└────────────────────────────┘
```

### Export Options

| Action              | Output     | Contains                  |
| ------------------- | ---------- | ------------------------- |
| **Save to Browser** | IndexedDB  | Full state                |
| **Download .vrs**   | JSON file  | Full state (portable)     |
| **Export CSV**      | CSV file   | Data + spec status column |
| **Export PNG**      | Image file | Dashboard screenshot      |

---

## Settings Flow

```
User clicks Settings gear
         │
         ▼
┌─────────────────────────────────────┐
│ SettingsModal                       │
├─────────────────────────────────────┤
│ Section 1: Data Mapping             │
│  • Change outcome column            │
│  • Change factor columns            │
├─────────────────────────────────────┤
│ Section 2: Visualization            │
│  • Show Cp checkbox                 │
│  • Show Cpk checkbox                │
│  • Y-axis min/max                   │
├─────────────────────────────────────┤
│ Section 3: License                  │
│  • Enter license key                │
│  • View current edition             │
└─────────────────────────────────────┘
         │
         ▼ Apply Settings
┌────────────────────────────┐
│ Update DataContext         │
│  • setOutcome()            │
│  • setFactors()            │
│  • setDisplayOptions()     │
│  • setAxisSettings()       │
└────────────────────────────┘
```

---

## Component Hierarchy

```
App.tsx
├── AppHeader
│   ├── Logo + project name
│   ├── Toolbar (desktop, contextual based on hasData)
│   │   ├── Save button (⌘S shortcut, success feedback)
│   │   ├── ToolbarDropdown (Export: .vrs, CSV, PNG)
│   │   ├── ToolbarDropdown (View: Data Table, Large Mode, Projects)
│   │   └── Settings button
│   └── MobileMenu (mobile)
│       ├── Export section
│       ├── View section
│       └── Project section
├── AppFooter
│   └── Row count + version
├── HomeScreen (when rawData.length === 0)
│   ├── Upload area
│   ├── Import .vrs button
│   ├── Open Projects button
│   └── Sample data buttons
├── ColumnMapping (when isMapping === true)
│   ├── Outcome selector
│   └── Factor checkboxes
├── Dashboard (when data loaded)
│   ├── DrillBreadcrumb (when filters active)
│   │   ├── Home icon + "All Data"
│   │   ├── Filter items with chevrons
│   │   └── Clear All button
│   ├── IChart
│   │   └── ErrorBoundary wrapper
│   ├── Boxplot
│   │   └── ErrorBoundary wrapper
│   ├── ParetoChart
│   │   └── ErrorBoundary wrapper
│   └── StatsPanel
│       ├── Summary tab (Cp/Cpk or Grades)
│       ├── Histogram tab
│       ├── Prob Plot tab (normality assessment)
│       └── SpecEditor (popover)
├── SettingsModal
├── SavedProjectsModal
└── DataTableModal
```

---

## State Management

### DataContext State

| State                | Type                    | Purpose                     |
| -------------------- | ----------------------- | --------------------------- |
| `rawData`            | `any[]`                 | All imported data           |
| `filteredData`       | `any[]`                 | Derived: rawData + filters  |
| `outcome`            | `string`                | Y-axis column               |
| `factors`            | `string[]`              | Grouping columns (max 3)    |
| `specs`              | `{usl?, lsl?, target?}` | Specification limits        |
| `grades`             | `{max, label, color}[]` | Multi-tier grades           |
| `filters`            | `Record<string, any[]>` | Active filters              |
| `stats`              | `StatsResult`           | Derived: calculated metrics |
| `displayOptions`     | `{showCp, showCpk}`     | UI toggles                  |
| `axisSettings`       | `{min?, max?}`          | Y-axis overrides            |
| `currentProjectId`   | `string?`               | Loaded project ID           |
| `currentProjectName` | `string?`               | Project display name        |
| `hasUnsavedChanges`  | `boolean`               | Dirty flag                  |

### Derived Values (Auto-Calculated)

```
rawData + filters → filteredData (useMemo)
filteredData + specs + grades → stats (useMemo)
```

---

## Keyboard Shortcuts

| Key             | Context      | Action                     |
| --------------- | ------------ | -------------------------- |
| `⌘S` / `Ctrl+S` | Dashboard    | Save to browser            |
| `⌘O` / `Ctrl+O` | Any          | Open saved projects        |
| `ESC`           | Dashboard    | Clear all filters          |
| `Tab`           | Data Table   | Move to next cell          |
| `Shift+Tab`     | Data Table   | Move to previous cell      |
| `Enter`         | Data Table   | Move to next row           |
| `Enter`         | Manual Entry | Add new row (if last cell) |

---

## Data Limits

| Threshold             | Behavior          |
| --------------------- | ----------------- |
| < 5,000 rows          | Loads immediately |
| 5,000 - 50,000 rows   | Warning prompt    |
| > 50,000 rows         | Rejected          |
| Data Table pagination | 500 rows per page |

---

## Example User Journeys

### Journey 1: Quick Analysis (2 minutes)

1. Drop CSV file on upload area
2. Confirm auto-detected outcome/factors
3. Dashboard loads with charts
4. Click outlier in Boxplot to investigate
5. Export PNG for report

### Journey 2: Capability Study (5 minutes)

1. Upload production data
2. Set spec limits (USL=350, LSL=300)
3. Review Cpk in Stats Panel
4. Filter by shift to compare performance
5. Save project for future reference

### Journey 3: Grade-Based Analysis (Coffee)

1. Load "Coffee: Defect Analysis" sample
2. Pre-configured grades load automatically
3. Stats Panel shows grade distribution
4. Click cooperative in Pareto to filter
5. Compare grade percentages across suppliers
