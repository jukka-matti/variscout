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

### 2. Tab Navigation

Switching modes within a view (no data change).

| Product         | Location          | Tabs                             |
| --------------- | ----------------- | -------------------------------- |
| PWA Dashboard   | Top               | Analysis, Regression, Gage R&R   |
| PWA Mobile      | Bottom            | Summary, I-Chart, Boxplot, Stats |
| Excel Task Pane | Below header      | Data, Charts, Settings           |
| Azure           | (Not implemented) | -                                |

**PWA Tab Implementation**:

```tsx
const [activeTab, setActiveTab] = useState<DashboardTab>('analysis');

<TabBar active={activeTab} onChange={setActiveTab}>
  <Tab value="analysis">Analysis</Tab>
  <Tab value="regression">Regression</Tab>
  <Tab value="gagerr">Gage R&R</Tab>
</TabBar>;
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

The PWA header toolbar is contextual, showing different actions based on state.

#### No Data State

```
[Logo] VariScout Lite            [Open Project ⌘O] [⚙️]
```

#### Data Loaded State

```
[Logo] Project Name*     [Save ⌘S] [Export ▾] [View ▾] [⚙️]
```

**Toolbar Buttons:**

| Button       | Contents                                           | Notes                                   |
| ------------ | -------------------------------------------------- | --------------------------------------- |
| **Save**     | Save to browser                                    | Shows ⌘S shortcut, checkmark on success |
| **Export ▾** | Download .vrs, CSV, PNG                            | Grouped dropdown                        |
| **View ▾**   | Data Table, Large Mode, Open Project, New Analysis | Grouped dropdown                        |
| **Settings** | Icon only                                          | Opens settings modal                    |

**Mobile Toolbar:**

```
[Logo] Project*    [Save] [⋯ Menu]
```

Mobile menu contains all Export, View, and Project actions in grouped sections.

#### Component Structure

- `AppHeader.tsx` - Main header with contextual toolbar
- `ToolbarDropdown.tsx` - Reusable dropdown for Export/View menus
- `MobileMenu.tsx` - Mobile-optimized menu with sections

### 4. Drill-Down Navigation (Chart Filtering)

Clicking chart elements to filter data with breadcrumb trail.

See [patterns/navigation.md](./patterns/navigation.md) for complete details.

**Summary**:
| Chart | Action | Result |
|-------|--------|--------|
| I-Chart | Point click | Highlight only (no filter) |
| Boxplot | Box click | Filter to factor level |
| Pareto | Bar click | Filter to category |

**Breadcrumb Display**:

```
[🏠 All Data] > [Machine: A, B] > [Shift: Day]  [✕ Clear All]
```

### 4. Mobile Navigation

Responsive patterns for small screens.

**PWA Mobile** (`<640px`):

- Vertical scrolling layout (no resizable panels)
- Bottom tab bar for chart switching
- Swipe gestures (future enhancement)
- Focus mode carousel for chart details

**Excel Task Pane** (350px fixed width):

- Scrollable content area
- Compact wizard steps
- Modal dialogs for complex selections

---

## By Product

| Feature          | PWA         | Excel             | Azure                 |
| ---------------- | ----------- | ----------------- | --------------------- |
| **Page nav**     | State-based | Wizard steps      | State-based           |
| **Tab nav**      | Top tabs    | Fluent TabList    | (None yet)            |
| **Drill-down**   | Full        | Read-only display | Planned               |
| **Breadcrumbs**  | Interactive | Display only      | Interactive (planned) |
| **Mobile**       | Responsive  | Fixed 350px       | Responsive            |
| **URL routing**  | None        | N/A               | None                  |
| **Deep linking** | Future      | N/A               | Future                |

### Product-Specific Details

#### PWA (`apps/pwa`)

- **State**: `DataContext` manages filters, `activeTab` for mode switching
- **Mobile detection**: `window.innerWidth < 640`
- **Persistence**: Filters saved to IndexedDB with project

#### Excel Add-in (`apps/excel-addin`)

- **Task Pane**: Setup wizard, configuration, settings
- **Content Add-in**: Charts with FilterBar breadcrumb display
- **Limitation**: Cannot programmatically control Excel slicers
- **Persistence**: Custom Document Properties via `stateBridge.ts`

#### Azure Team App (`apps/azure`)

- **Authentication**: MSAL popup login required
- **Views**: Dashboard (project list) ↔ Editor (analysis)
- **State**: Simple `currentView` and `currentProject` state
- **Future**: Add drill-down when @variscout/charts integrated

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

| File                                          | Purpose                   |
| --------------------------------------------- | ------------------------- |
| `packages/core/src/navigation.ts`             | Types and utilities       |
| `apps/pwa/src/hooks/useDrillDown.ts`          | React hook for drill-down |
| `apps/pwa/src/components/AppHeader.tsx`       | Contextual toolbar        |
| `apps/pwa/src/components/ToolbarDropdown.tsx` | Reusable dropdown         |
| `apps/pwa/src/components/MobileMenu.tsx`      | Mobile navigation menu    |
| `apps/pwa/src/components/DrillBreadcrumb.tsx` | Breadcrumb UI             |
| `apps/pwa/src/components/Dashboard.tsx`       | PWA main view + tab nav   |
| `apps/excel-addin/src/content/FilterBar.tsx`  | Excel breadcrumb display  |
| `apps/azure/src/App.tsx`                      | Azure page navigation     |
