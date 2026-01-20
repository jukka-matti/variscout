# Navigation Architecture

Comprehensive navigation design across all VariScout products.

## Philosophy

### State-Based Navigation (No Router)

VariScout uses state-based navigation rather than URL routing for several reasons:

1. **Offline-first design** - PWA works without network; URLs would fail when offline
2. **Embedded contexts** - Excel Add-in and Azure embeds can't control browser URL
3. **Simplicity** - Single-page analysis workflow doesn't need deep linking
4. **Cross-product consistency** - Same navigation model works everywhere

Future URL routing may be added for sharing/bookmarking, but isn't required for core functionality.

### Consistency Goals

| Principle              | Description                                 |
| ---------------------- | ------------------------------------------- |
| Familiar patterns      | Users recognize navigation across products  |
| Progressive disclosure | Start simple, reveal complexity when needed |
| Predictable            | Same action = same result                   |
| Reversible             | Easy to go back/undo navigation             |

---

## Navigation Types

### 1. Page-Level Navigation

Moving between major views in the application.

| Product | Implementation        | Trigger                  |
| ------- | --------------------- | ------------------------ |
| PWA     | State (`currentView`) | Header logo, buttons     |
| Excel   | Wizard steps (`mode`) | Step buttons, Complete   |
| Azure   | State (`currentView`) | Header logo, back button |

**PWA**: Currently single-page (Dashboard only). Future views may include:

- Landing/Import → Dashboard
- Dashboard → Data Table
- Dashboard → Settings

**Excel**: Wizard flow

```
Setup Mode → [Configure] → [Validate] → [Complete] → Analysis Mode
                                                        ↓
                                              Return to Setup
```

**Azure**:

```
Dashboard ↔ Editor (state toggle via navigateToEditor/navigateToDashboard)
```

### 2. Analysis View Switching

Switching between analysis modes (Dashboard, Regression, Gage R&R).

| Product         | Location               | Modes                           |
| --------------- | ---------------------- | ------------------------------- |
| PWA             | Settings Panel         | Dashboard, Regression, Gage R&R |
| PWA Mobile      | Bottom tabs (carousel) | I-Chart, Boxplot, Pareto, Stats |
| Excel Task Pane | Below header           | Data, Charts, Settings          |
| Azure           | (Not implemented)      | -                               |

**PWA Implementation** (moved to Settings Panel):

Analysis view selection is now in the Settings Panel slide-in, not top tabs:

```tsx
// In SettingsPanel.tsx
<div className="space-y-2">
  <label className="text-xs font-medium text-slate-400 uppercase">Analysis View</label>
  {['dashboard', 'regression', 'gagerr'].map(view => (
    <button
      key={view}
      onClick={() => setActiveTab(view)}
      className={activeTab === view ? 'bg-slate-700' : ''}
    >
      {view === 'dashboard' ? 'Dashboard' : view === 'regression' ? 'Regression' : 'Gage R&R'}
    </button>
  ))}
</div>
```

**Excel Tab Implementation** (Fluent UI):

```tsx
<TabList selectedValue={selectedTab} onTabSelect={handleTabSelect}>
  <Tab value="data">Data</Tab>
  <Tab value="charts">Charts</Tab>
  <Tab value="settings">Settings</Tab>
</TabList>
```

### 3. Toolbar Navigation (PWA)

The PWA header uses an icon-based toolbar for a cleaner, more focused interface.

#### Desktop Layout (≥640px)

```
[Logo] Project Name ●              [📊] [⛶] [↗] [⚙]
```

| Element  | Action         | Behavior                                         |
| -------- | -------------- | ------------------------------------------------ |
| **Logo** | New Analysis   | Click → Reset confirmation → Home Screen         |
| **●**    | Save indicator | Blue when saved, pulses when unsaved changes     |
| **📊**   | Data Table     | Toggle right panel on/off                        |
| **⛶**    | Fullscreen     | Enter presentation mode (Escape to exit)         |
| **↗**    | Share          | Popover: Export Image, Export CSV, Download .vrs |
| **⚙**    | Settings       | Opens Settings Panel (slide-in from right)       |

#### Mobile Layout (<640px)

```
[Logo] Project ●    [📊] [⛶] [⚙]
```

Mobile shares most icons with desktop. The Share icon is accessible via Settings.

#### Save Behavior

- No auto-save: users must explicitly save projects
- App always starts on HomeScreen
- "Save" action in toolbar saves to IndexedDB

#### Component Structure

- `AppHeader.tsx` - Main header with icon toolbar
- `SharePopover.tsx` - Export options popover (Image, CSV, .vrs)
- `SettingsPanel.tsx` - Slide-in settings panel
- `DataPanel.tsx` - Resizable right panel for data table

### 4. Drill-Down Navigation (Chart Filtering)

Clicking chart elements to filter data with breadcrumb trail.

See [patterns/navigation.md](./patterns/navigation.md) for complete details.

**Summary**:
| Chart | Action | Result |
|-------|--------|--------|
| I-Chart | Point click | Highlight only (no filter) |
| Boxplot | Box click | Filter to factor level + auto-switch |
| Pareto | Bar click | Filter to category + auto-switch |

**Auto-Switch Behavior**:

When drilling down, charts automatically switch to show the factor with highest remaining variation (η²):

```
Step 1: Viewing by Machine → Click "Machine A"
        → Data filters to Machine A
        → System calculates η² for remaining factors
        → Both Boxplot and Pareto switch to factor with highest η² (e.g., Shift)

Step 2: Viewing by Shift → Click "Night"
        → Data filters to Machine A + Night Shift
        → Both charts switch to next highest η² factor (e.g., Operator)
```

This creates a "variation funnel" that guides users through their analysis, always showing the most impactful factor to investigate next.

**Minimum Threshold**: Factors must have ≥5% η² to be suggested. If no factor meets this threshold, the current factor is retained.

**Breadcrumb Display**:

```
[🏠 All Data] > [Machine: A, B] > [Shift: Day]  [✕ Clear All]
```

**Pareto Comparison View**:

When filters are active, Pareto can show "ghost bars" comparing filtered distribution to the full population:

- Toggle via eye icon button (appears when filters are active)
- Ghost bars show full population % as transparent dashed bars behind solid filtered bars
- Reveals whether a problem is specific to the filtered context or a general pattern
- Tooltip shows comparison: "Filtered: 60% vs Overall: 30% ↑30%"

### 5. Mobile Navigation

Responsive patterns for small screens.

**PWA Mobile** (`<640px`):

- Vertical scrolling layout (no resizable panels)
- Carousel for chart switching (swipe or buttons)
- Data Panel as bottom sheet (swipe up to expand)
- Settings Panel uses modal instead of slide-in

**Excel Task Pane** (350px fixed width):

- Scrollable content area
- Compact wizard steps
- Modal dialogs for complex selections

---

## PWA Panel Components

### Settings Panel

Slide-in panel from the right (modal on mobile) for configuration options.

```
┌─────────────────────────────────────┐
│ Settings                        ✕   │
├─────────────────────────────────────┤
│                                     │
│ ANALYSIS VIEW                       │
│ ○ Dashboard (default)               │
│ ○ Regression                        │
│ ○ Gage R&R                          │
│                                     │
│ ─────────────────────────────────── │
│                                     │
│ DISPLAY OPTIONS                     │
│ ☑ Lock Y-axis when drilling         │
│ ☐ Show data labels                  │
│ ☐ Large mode (30% larger UI)        │
│                                     │
│ ─────────────────────────────────── │
│                                     │
│ PROJECT                             │
│ [Open Project...]  [New Analysis]   │
│                                     │
│ ─────────────────────────────────── │
│                                     │
│ [Save Project]                      │
│                                     │
└─────────────────────────────────────┘
```

**Key File**: `apps/pwa/src/components/SettingsPanel.tsx`

### Data Panel

Resizable right panel showing the data table alongside charts.

**Features**:

- Toggle visibility via 📊 button in header
- Draggable divider for custom width (persisted to localStorage)
- Bi-directional sync with charts:
  - Click chart point → scrolls table to that row, highlights it
  - Click table row → highlights corresponding point in chart
- Drill-aware: Table shows filtered data matching current drill state
- Sticky header with sortable columns

**Desktop**:

```
┌───────────────────────────────┬─────────────────┐
│ Charts Area                   ║ Data Table      │
│                               ║                 │
│   I-Chart     Boxplot         ║ [sticky header] │
│   Pareto      Stats           ║ [scrollable]    │
│                               ║                 │
└───────────────────────────────┴─────────────────┘
                                ↕ draggable
```

**Mobile**: Bottom sheet with drag handle

- Collapsed: Shows row count + "Swipe up"
- Partial: ~40% screen height
- Full: ~90% screen height

**Key File**: `apps/pwa/src/components/DataPanel.tsx`

### Share Popover

Dropdown popover for export options.

```
┌─────────────────────────┐
│ Export Image (PNG)      │ → Copies chart to clipboard
│ Export Data (CSV)       │ → Downloads filtered data
│ Download Project (.vrs) │ → Saves complete project
└─────────────────────────┘
```

**Key File**: `apps/pwa/src/components/SharePopover.tsx`

### Specs Popover

I-Chart header dropdown for specification limits (replaces SpecEditor modal for basic limits).

```
I-Chart Header:
[I-Chart: Value]  [Stages▾]  [Specs▾]  [📋 Copy]  [⛶ Focus]

Specs popover:
┌─────────────────────────┐
│ SPECIFICATION LIMITS    │
├─────────────────────────┤
│ ☑ USL    [50.0    ]    │
│ ☑ LSL    [30.0    ]    │
│ ☑ Target [40.0    ]    │
├─────────────────────────┤
│ [Apply Changes]         │
└─────────────────────────┘
```

- Checkbox = toggle visibility of that limit on chart
- Input = editable value
- Advanced features (Grades) accessible via gear icon → SpecEditor modal

**Key File**: `apps/pwa/src/components/SpecsPopover.tsx`

---

## By Product

| Feature                | PWA                | Excel             | Azure       |
| ---------------------- | ------------------ | ----------------- | ----------- |
| **Page nav**           | State-based        | Wizard steps      | State-based |
| **Analysis switching** | Settings Panel     | Fluent TabList    | (None yet)  |
| **Data table**         | Right panel/bottom | N/A               | Right panel |
| **Drill-down**         | Full               | Read-only display | Full        |
| **Breadcrumbs**        | Interactive        | Display only      | Interactive |
| **Mobile**             | Responsive         | Fixed 350px       | Responsive  |
| **Auto-save**          | No (explicit save) | N/A               | No          |
| **URL routing**        | None               | N/A               | None        |
| **Deep linking**       | Future             | N/A               | Future      |

### Product-Specific Details

#### PWA (`apps/pwa`)

- **State**: `DataContext` manages filters, `activeTab` for analysis switching
- **Settings**: `SettingsPanel` for configuration, opens via ⚙ icon
- **Data table**: `DataPanel` - resizable right panel (desktop) or bottom sheet (mobile)
- **Mobile detection**: `window.innerWidth < 640`
- **Persistence**: Explicit save/load via IndexedDB; filters and panel width saved with project

#### Excel Add-in (`apps/excel-addin`)

- **Task Pane**: Setup wizard, configuration, settings
- **Content Add-in**: Charts with FilterBar breadcrumb display
- **Limitation**: Cannot programmatically control Excel slicers
- **Persistence**: Custom Document Properties via `stateBridge.ts`

#### Azure Team App (`apps/azure`)

- **Authentication**: MSAL popup login required
- **Views**: Dashboard (project list) ↔ Editor (analysis)
- **State**: `DataContext` manages filters, drill-down state, and data
- **Data table**: `DataPanel` - resizable right panel with bi-directional chart sync
- **Drill-down**: Full drill-down with auto-switch to highest variation factor
- **Breadcrumbs**: Interactive `DrillBreadcrumb` with filter chips

---

## State Management

### Navigation State Flow

```
User Action → State Update → UI Re-render → Component Display
     ↓
Persistence (if applicable)
```

### Filter Sync with DataContext

Drill-down navigation syncs with the central filter state:

```tsx
// In useDrillDown hook
const { filters, setFilters } = useData();

const drillDown = (action: DrillAction) => {
  // Update drill stack
  setDrillStack(prev => pushDrillStack(prev, action));

  // Sync to DataContext filters
  const newFilters = drillStackToFilters([...drillStack, action]);
  setFilters(newFilters);
};
```

### Persistence Per Product

| Product | Storage                    | Scope            |
| ------- | -------------------------- | ---------------- |
| PWA     | IndexedDB + localStorage   | Per project      |
| Excel   | Custom Document Properties | Per workbook     |
| Azure   | Cloud save (future)        | Per team project |

---

## Implementation Patterns

### Back Navigation

**PWA Breadcrumb Click**:

```tsx
const handleNavigate = (id: string) => {
  if (id === 'root') {
    setFilters({});
  } else {
    // Navigate to that point in drill stack
    drillTo(id);
  }
};
```

**Azure Back Button**:

```tsx
<button onClick={navigateToDashboard}>← Back</button>
```

**Excel**: Users use native Excel slicers to modify filters.

### Focus Mode (PWA)

Full-screen chart view with carousel navigation:

```tsx
const [focusChart, setFocusChart] = useState<string | null>(null);

// Carousel cycles: ichart → boxplot → pareto → stats → ichart
const handleNext = () => {
  const order = ['ichart', 'boxplot', 'pareto', 'stats'];
  const current = order.indexOf(focusChart);
  setFocusChart(order[(current + 1) % order.length]);
};
```

---

## Future: URL Routing

### When to Add

Consider URL routing when:

- Users request shareable analysis links
- Deep linking to specific data subsets needed
- SEO matters (marketing pages)

### Implementation Approach

```tsx
// Future: react-router integration
const routes = {
  '/': Dashboard,
  '/project/:id': ProjectEditor,
  '/project/:id/analysis': AnalysisView,
  '/project/:id/analysis?filters=...': FilteredAnalysisView,
};
```

### URL Structure (Proposed)

```
/                           # Landing/Dashboard
/project/abc123             # Project editor
/project/abc123/analysis    # Analysis view
/project/abc123/analysis?factor=Machine&values=A,B
                            # Filtered analysis
```

### Browser History

Future enhancement: Use History API to enable back button for drill-down:

```tsx
// Push state on drill-down
window.history.pushState({ drillStack }, '', '');

// Handle popstate for back button
window.addEventListener('popstate', e => {
  if (e.state?.drillStack) {
    setDrillStack(e.state.drillStack);
  }
});
```

---

## Accessibility

All navigation patterns follow accessibility guidelines:

| Pattern       | Implementation                             |
| ------------- | ------------------------------------------ |
| Breadcrumb    | `<nav aria-label="Drill-down navigation">` |
| Current page  | `aria-current="page"`                      |
| Tabs          | Fluent UI TabList (built-in a11y)          |
| Focus visible | `:focus-visible` styling                   |
| Keyboard nav  | Tab through items, Enter to activate       |
| Skip links    | (Future) Skip to main content              |

---

## Related Documentation

| Document                                                                       | Purpose                         |
| ------------------------------------------------------------------------------ | ------------------------------- |
| [patterns/navigation.md](./patterns/navigation.md)                             | Drill-down & breadcrumb details |
| [patterns/layout.md](./patterns/layout.md)                                     | Layout integration              |
| [../products/pwa/README.md](../products/pwa/README.md)                         | PWA product spec                |
| [../products/excel/TECH-EXCEL-ADDIN.md](../products/excel/TECH-EXCEL-ADDIN.md) | Excel add-in tech spec          |
| [../products/azure/README.md](../products/azure/README.md)                     | Azure team app spec             |

## Key Files

| File                                             | Purpose                        |
| ------------------------------------------------ | ------------------------------ |
| `packages/core/src/navigation.ts`                | Types and utilities            |
| `packages/core/src/variation.ts`                 | Auto-switch logic, η² helpers  |
| `packages/hooks/src/useDrillDown.ts`             | Shared drill-down hook         |
| `apps/pwa/src/lib/persistence.ts`                | IndexedDB project storage      |
| `apps/pwa/src/components/AppHeader.tsx`          | Icon-based toolbar             |
| `apps/pwa/src/components/SettingsPanel.tsx`      | Slide-in settings panel        |
| `apps/pwa/src/components/DataPanel.tsx`          | Resizable data table panel     |
| `apps/pwa/src/components/SharePopover.tsx`       | Export options popover         |
| `apps/pwa/src/components/SpecsPopover.tsx`       | Spec limits popover (I-Chart)  |
| `apps/pwa/src/components/DrillBreadcrumb.tsx`    | Breadcrumb UI                  |
| `apps/pwa/src/components/MobileMenu.tsx`         | Mobile navigation menu         |
| `apps/pwa/src/components/FunnelPanel.tsx`        | Variation funnel visualization |
| `apps/pwa/src/components/VariationFunnel.tsx`    | Funnel chart component         |
| `apps/pwa/src/components/Dashboard.tsx`          | PWA main view                  |
| `apps/pwa/src/components/charts/ParetoChart.tsx` | Pareto with ghost bars         |
| `apps/excel-addin/src/content/FilterBar.tsx`     | Excel breadcrumb display       |
| `apps/azure/src/App.tsx`                         | Azure page navigation          |
| `apps/azure/src/components/Dashboard.tsx`        | Azure main dashboard           |
| `apps/azure/src/components/DataPanel.tsx`        | Azure data table panel         |
| `apps/azure/src/components/DrillBreadcrumb.tsx`  | Azure breadcrumb UI            |
| `apps/azure/src/components/FilterChips.tsx`      | Azure active filter chips      |
