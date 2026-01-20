# Platform Adaptations

> How each VariScout app adapts the [Core Analysis Journey](./CORE-ANALYSIS-JOURNEY.md).

## Quick Comparison

| Aspect               | PWA                        | Azure                      | Excel               |
| -------------------- | -------------------------- | -------------------------- | ------------------- |
| **Target User**      | Individual analyst         | Team/enterprise            | Excel power user    |
| **Data Source**      | File upload                | File upload + cloud        | Worksheet table     |
| **Persistence**      | IndexedDB                  | OneDrive/SharePoint        | Document Properties |
| **Authentication**   | License key                | Azure AD (SSO)             | License key         |
| **Offline**          | Full PWA                   | Offline-first + sync       | Native Excel        |
| **Mobile**           | Responsive                 | Desktop-optimized          | N/A                 |
| **Theme**            | Light/Dark/System          | Dark only                  | Dark only           |
| **Performance Mode** | Auto-detect + Manual entry | Auto-detect + Manual entry | Manual setup        |
| **Pricing**          | €49/year                   | €999/year/tenant           | €49/year            |

---

## PWA (Progressive Web App)

### Unique Features

- **Mobile-responsive** design (MobileDashboard component)
- **Theme switching** (light/dark/system + company accent)
- **Manual data entry** (Standard or Performance Mode)
- **Sample data** loading for demos
- **Presentation mode** for training/meetings
- **Import/Export** (.vrs project files)
- **Pareto file upload** (separate defect data)
- **Auto-detect wide format** → Performance Mode modal
- **Data validation banner** showing quality issues

### Entry Flow

```
Open app → HomeScreen
         ├── Upload CSV/Excel file
         ├── Enter data manually (Standard or Performance Mode)
         ├── Load sample data
         ├── Import .vrs file
         └── Open saved project
```

### Persistence

- **localStorage**: Settings, recent projects list
- **IndexedDB**: Full project data, raw data storage
- **Auto-save**: 1-second debounce on changes

### See Also

- [PWA Data Onboarding](./pwa/DATA-ONBOARDING.md)
- [Performance Mode](./PERFORMANCE-MODE.md) - Multi-measure analysis flow

---

## Azure Team App

### Unique Features

- **Project browser** (team vs. personal folders)
- **OneDrive/SharePoint sync** for team sharing
- **Azure AD SSO** (no license key needed)
- **Conflict resolution** for concurrent edits
- **Tab-based navigation** (Analysis/Regression/GageRR/Performance)
- **Filter chips** at dashboard top (vs. breadcrumbs)

### Entry Flow

```
Open app → Project Browser (Dashboard page)
         ├── Team Storage tab (shared projects)
         ├── Personal tab (OneDrive)
         └── New Project button

New Project → Editor page (empty state)
           ├── Upload CSV/Excel file
           └── Enter data manually (Standard or Performance Mode)

Select project → Editor page
              ├── Analysis tab
              ├── Regression tab
              ├── GageRR tab
              └── Performance tab
```

### Persistence

- **OneDrive**: Project files (.vrs equivalent)
- **SharePoint**: Team-shared projects
- **Local cache**: Offline-first with sync queue

### Differences from PWA

| Feature                | PWA            | Azure      |
| ---------------------- | -------------- | ---------- |
| Manual data entry      | Yes            | Yes        |
| Sample data loading    | Yes            | No         |
| Separate Pareto upload | Yes            | No         |
| Validation banner      | Yes            | Simplified |
| Mobile responsive      | Yes            | No         |
| Theme switching        | Yes            | Dark only  |
| Navigation             | Settings-based | Tab-based  |

### See Also

- [Azure Project Management](./azure/PROJECT-MANAGEMENT.md)

---

## Excel Add-in

### Unique Features

- **Native Excel slicers** for filtering (not custom UI)
- **Worksheet embedding** (Content Add-in)
- **6-step Setup Wizard** (vs. single modal)
- **Live data connection** (reads from table)
- **Copy to clipboard** (insert charts into worksheet)
- **Staged I-Chart** analysis
- **Fluent UI** design system (matches Office)

### Entry Flow

```
Excel worksheet with data table
         ↓
Click VaRiScout ribbon button
         ↓
Task Pane opens → SetupWizard
         ├── Step 1: Select table
         ├── Step 2: Choose outcome column
         ├── Step 3: Choose factor columns
         ├── Step 4: Set specifications
         ├── Step 5: Create slicers (optional)
         └── Step 6: Launch analysis
         ↓
Content Add-in embeds in worksheet
         └── Charts refresh when slicers change
```

### Persistence

- **Custom Document Properties**: Settings saved in workbook
- **No separate file**: Analysis travels with Excel file

### Differences from PWA/Azure

| Feature                 | PWA/Azure    | Excel               |
| ----------------------- | ------------ | ------------------- |
| Data input              | File upload  | Table selection     |
| Manual data entry       | Yes          | No                  |
| Filtering UI            | Click charts | Native slicers      |
| Chart container         | Web div      | Content Add-in      |
| Responsive sizing       | Yes          | Fixed dimensions    |
| Auto-detect wide format | Yes          | No (manual setup)   |
| Pareto separate file    | Yes          | No                  |
| Navigation              | Breadcrumbs  | None (slicer-based) |

### See Also

- [Excel Setup Wizard](./excel/SETUP-WIZARD.md)

---

## Shared Code Summary

| Package             | What It Provides                                          | Used By    |
| ------------------- | --------------------------------------------------------- | ---------- |
| `@variscout/core`   | Stats, parser, types, license                             | All        |
| `@variscout/charts` | Chart components (IChart, Boxplot, etc.)                  | All        |
| `@variscout/hooks`  | useDrillDown, useVariationTracking, useKeyboardNavigation | All        |
| `@variscout/ui`     | HelpTooltip, useGlossary, colors                          | PWA, Azure |
| `@variscout/data`   | Sample datasets                                           | PWA only   |

### Percentage Overlap

| App Pair      | Overall Overlap |
| ------------- | --------------- |
| PWA ↔ Azure   | ~55%            |
| PWA ↔ Excel   | ~46%            |
| Azure ↔ Excel | ~50%            |

**Highest overlap** (85-100%): Drill-down mechanics, Performance Mode, chart components

**Lowest overlap** (10-20%): Entry points, persistence, settings

---

## See Also

- [Core Analysis Journey](./CORE-ANALYSIS-JOURNEY.md) - Shared analysis experience
- [Performance Mode](./PERFORMANCE-MODE.md) - Multi-measure analysis flow
