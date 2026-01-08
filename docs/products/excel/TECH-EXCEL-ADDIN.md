# VaRiScout Excel Add-in — Technical Specification

## Overview

VaRiScout Excel brings variation analysis directly into Excel. Users select data in their spreadsheet, and VaRiScout appears in a task pane with linked charts.

```
PRODUCT SUMMARY
─────────────────────────────────────────────────────────────────

Platform:       Excel (Windows, Mac, Web)
Distribution:   Microsoft AppSource
Architecture:   Office Add-in (Task Pane)
Analysis:       Same @variscout/core as PWA and Power BI

Pricing:
• Free: Full analysis, settings lost on close
• Individual: €49/year, save settings in workbook
```

---

## Freemium Model

Same philosophy as PWA: **Save is the upgrade gate.**

```
FEATURE COMPARISON (IMPLEMENTED)
─────────────────────────────────────────────────────────────────

Feature                          Free        Individual (€49/yr)
─────────────────────────────────────────────────────────────────
All 4 charts + ANOVA             ✅          ✅
Native Excel slicer filtering    ✅          ✅
Control limit calculations       ✅          ✅
Capability analysis (Cp/Cpk)     ✅          ✅
ANOVA (F-stat, p-value, insight) ✅          ✅
Histogram / Probability Plot     ✅          ✅
Copy charts to clipboard         ✅          ✅
Insert charts into Excel         ✅          ✅
Write stats to cells             ✅          ✅
FilterBar (breadcrumb display)   ✅          ✅
─────────────────────────────────────────────────────────────────
Save settings in workbook        ❌          ✅
Save spec limits                 ❌          ✅
Save column mappings             ❌          ✅
─────────────────────────────────────────────────────────────────
```

### Free Tier Behavior

```
FREE USER EXPERIENCE
─────────────────────────────────────────────────────────────────

1. Select data → Open VaRiScout → Full analysis works ✓
2. Set spec limits, configure charts → All works ✓
3. Close task pane or workbook
4. Reopen later → Settings GONE, must reconfigure

Upgrade trigger:
- Close task pane → "Save your settings? [Upgrade to save]"
- Click Save button → "Upgrade to save settings in workbook"
```

### Paid Tier Behavior

```
PAID USER EXPERIENCE
─────────────────────────────────────────────────────────────────

1. Select data → Open VaRiScout → Full analysis works ✓
2. Set spec limits, configure charts → All works ✓
3. Click Save → Settings embedded in workbook
4. Close and reopen → Settings restored automatically
5. Share Excel file → Colleague opens with same settings
```

---

## User Experience

### Workflow

```
1. User selects data range in Excel (e.g., A1:D500)
2. Clicks "VaRiScout" button in ribbon
3. Task pane opens with column mapping
4. All 4 charts appear, linked filtering works
5. User clicks to filter, copies charts to Excel/PowerPoint
```

### Visual Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Excel Workbook                                                              │
├──────────────────────────────────────────────────────┬──────────────────────┤
│                                                      │                      │
│     A        B        C        D                     │  VaRiScout      [×]  │
│  ┌───────┬────────┬────────┬────────┐               │                      │
│  │ Date  │Diameter│ Machine│ Shift  │               │  Data: A1:D500       │
│  ├───────┼────────┼────────┼────────┤               │  Value: Diameter     │
│  │ Jan 1 │ 10.02  │   A    │   1    │               │  Factors: Machine,   │
│  │ Jan 1 │  9.98  │   A    │   1    │               │           Shift      │
│  │ Jan 1 │ 10.05  │   B    │   1    │               │                      │
│  │ Jan 1 │  9.97  │   B    │   2    │               │  ┌────────────────┐  │
│  │ ...   │  ...   │  ...   │  ...   │               │  │    I-Chart     │  │
│  │       │        │        │        │               │  │  ●  ───UCL     │  │
│  │       │        │        │        │               │  │ ●●●●───CL      │  │
│  │       │        │        │        │               │  │  ●  ───LCL     │  │
│  │       │        │        │        │               │  └────────────────┘  │
│  │       │        │        │        │               │  ┌────────────────┐  │
│  │       │        │        │        │               │  │    Boxplot     │  │
│  │       │        │        │        │               │  │  ┬─┬  ┬─┬      │  │
│  │       │        │        │        │               │  │  │ │  │ │      │  │
│  │       │        │        │        │               │  │  A    B        │  │
│  │       │        │        │        │               │  └────────────────┘  │
│  │       │        │        │        │               │  ┌────────────────┐  │
│  │       │        │        │        │               │  │    Pareto      │  │
│  │       │        │        │        │               │  │  ██ ██ █       │  │
│  │       │        │        │        │               │  └────────────────┘  │
│  │       │        │        │        │               │  ┌────────────────┐  │
│  │       │        │        │        │               │  │   Capability   │  │
│  │       │        │        │        │               │  │   Cpk: 1.33    │  │
│  │       │        │        │        │               │  └────────────────┘  │
│  │       │        │        │        │               │                      │
│  │       │        │        │        │               │  [Machine A] [Clear] │
│  │       │        │        │        │               │                      │
│  └───────┴────────┴────────┴────────┘               │  [Copy All] [Export] │
│                                                      │                      │
└──────────────────────────────────────────────────────┴──────────────────────┘
```

---

## Architecture

### Add-in Type: Hybrid (Task Pane + Content Add-in)

```
OFFICE ADD-IN ARCHITECTURE (IMPLEMENTED)
─────────────────────────────────────────────────────────────────

┌──────────────────────────────────────────────────────────────┐
│                         Excel                                 │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                   Workbook                              │  │
│  │   ┌──────────────┐  ┌────────────────────────────────┐ │  │
│  │   │ Excel Table  │  │ Content Add-in (charts)        │ │  │
│  │   │ + Slicers    │  │ ┌─────────────────────────────┐│ │  │
│  │   │              │  │ │ I-Chart │ Stats │ [Export]  ││ │  │
│  │   │  [Slicer A]  │  │ ├─────────┼───────┼───────────┤│ │  │
│  │   │  [Slicer B]  │  │ │ Boxplot │Pareto │ Histogram ││ │  │
│  │   │              │  │ ├─────────┴───────┴───────────┤│ │  │
│  │   │              │  │ │ ANOVA Results               ││ │  │
│  │   └──────────────┘  │ └─────────────────────────────┘│ │  │
│  │                     └────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────┘  │
│                            ▲                                  │
│            Custom Document Properties (state sync)            │
│                            ▼                                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Task Pane (configuration)                  │  │
│  │   - SetupWizard: Data, columns, specs, slicers         │  │
│  │   - Stats display with highlight in Excel              │  │
│  │   - License management                                  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘

Data flow:
1. User runs SetupWizard → Creates Excel Table + optional slicers
2. State saved to Custom Document Properties (bridge)
3. Content Add-in polls for state + reads filtered table data
4. Charts update when slicers filter the data
5. Export: Copy to clipboard, Insert into sheet, Write stats to cells
```

### Project Structure (Actual)

```
apps/excel-addin/
├── src/
│   ├── taskpane/
│   │   ├── App.tsx                 # Main: 4 modes (select/wizard/simple/configured)
│   │   └── components/
│   │       ├── SetupWizard.tsx     # 5-step wizard: data, columns, slicers, specs
│   │       ├── DataSelector.tsx    # Range selection UI
│   │       ├── ChartPanel.tsx      # Task pane charts (simple mode)
│   │       └── StatsDisplay.tsx    # Stats + highlight in Excel
│   │
│   ├── content/
│   │   ├── App.tsx                 # Content Add-in root (polls for state)
│   │   ├── ContentDashboard.tsx    # Main chart dashboard
│   │   ├── FilterBar.tsx           # Breadcrumb display (read-only)
│   │   └── AnovaResults.tsx        # ANOVA statistics below charts
│   │
│   ├── lib/
│   │   ├── stateBridge.ts          # Custom Document Properties sync
│   │   ├── excelData.ts            # Range/data extraction
│   │   ├── dataFilter.ts           # Table filtering (respects slicers)
│   │   ├── tableManager.ts         # Table creation & column detection
│   │   ├── slicerManager.ts        # Slicer creation & reading
│   │   ├── chartExport.ts          # Copy/Insert/WriteStats utilities
│   │   └── darkTheme.ts            # Dark theme tokens
│   │
│   └── commands/
│       └── commands.ts             # Ribbon button handlers
│
├── manifest.xml                    # Task Pane manifest
├── manifest-content.xml            # Content Add-in manifest
├── package.json
└── vite.config.ts
```

### Content Add-in Features (Implemented)

```
CONTENT ADD-IN LAYOUT
─────────────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────────────┐
│ Header: n | Mean | StdDev | Cpk    [Copy] [Insert] [Stats]      │
├─────────────────────────────────────────────────────────────────┤
│ FilterBar: [Machine: A, B] [Shift: 1]              [Clear All]  │
├─────────────────────────────────────────────────────────────────┤
│                        I-Chart (full width)                      │
├───────────────────┬───────────────────┬─────────────────────────┤
│     Boxplot       │   Pareto Chart    │  Histogram/ProbPlot     │
├───────────────────┴───────────────────┴─────────────────────────┤
│ ANOVA: Machine | Significant | A: 10.2 (n=45) | B: 9.8 (n=38)   │
│ Different? YES (F=4.32, p=0.018) η²=0.12 (medium effect)        │
└─────────────────────────────────────────────────────────────────┘

Features:
• Export toolbar: Copy All (clipboard), Insert (into sheet), Stats (to cells)
• FilterBar: Breadcrumb display of slicer filters (read-only, users control via Excel slicers)
• Charts: I-Chart, Boxplot, Pareto, Histogram/Probability Plot toggle
• ANOVA: F-statistic, p-value, group means, effect size, plain-language insight
• Live updates: Polls table data every 1s, slicer state every 2s
```

### Shared Core

Same analysis engine as PWA and Power BI:

```typescript
// Uses exact same analysis code
import { calculateStats, calculateAnova, groupDataByFactor } from '@variscout/core';

// Uses same chart components
import {
  IChartBase,
  BoxplotBase,
  ParetoChartBase,
  CapabilityHistogramBase,
  ProbabilityPlotBase,
} from '@variscout/charts';
```

---

## Office.js Integration

### Reading Data from Excel

```typescript
// src/taskpane/hooks/useExcelData.ts

import { useState, useEffect, useCallback } from 'react';

interface ExcelData {
  headers: string[];
  rows: any[][];
  range: string;
}

export function useExcelData() {
  const [data, setData] = useState<ExcelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSelectedRange = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Excel.run(async context => {
        const range = context.workbook.getSelectedRange();
        range.load(['values', 'address', 'rowCount', 'columnCount']);

        await context.sync();

        if (range.rowCount < 2) {
          throw new Error('Please select at least 2 rows (header + data)');
        }

        const values = range.values;
        const headers = values[0] as string[];
        const rows = values.slice(1);

        setData({
          headers,
          rows,
          range: range.address,
        });
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Listen for selection changes
  useEffect(() => {
    let handler: OfficeExtension.EventHandlerResult<Excel.WorksheetSelectionChangedEventArgs>;

    Excel.run(async context => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      handler = sheet.onSelectionChanged.add(async () => {
        // Optional: Auto-load on selection change
        // await loadSelectedRange();
      });
      await context.sync();
    });

    return () => {
      if (handler) {
        Excel.run(async context => {
          handler.remove();
          await context.sync();
        });
      }
    };
  }, []);

  return { data, loading, error, loadSelectedRange };
}
```

### Writing Charts Back to Excel

```typescript
// src/taskpane/utils/exportToExcel.ts

export async function insertChartAsImage(chartCanvas: HTMLCanvasElement) {
  const base64 = chartCanvas.toDataURL('image/png').split(',')[1];

  await Excel.run(async context => {
    const sheet = context.workbook.worksheets.getActiveWorksheet();

    // Insert image at cell F1
    const image = sheet.shapes.addImage(base64);
    image.left = 400; // Position to the right of data
    image.top = 10;
    image.width = 400;
    image.height = 300;

    await context.sync();
  });
}

export async function insertAllCharts(charts: {
  ichart: HTMLCanvasElement;
  boxplot: HTMLCanvasElement;
  pareto: HTMLCanvasElement;
  capability: HTMLCanvasElement;
}) {
  const positions = [
    { left: 400, top: 10 },
    { left: 820, top: 10 },
    { left: 400, top: 330 },
    { left: 820, top: 330 },
  ];

  await Excel.run(async context => {
    const sheet = context.workbook.worksheets.getActiveWorksheet();

    const chartEntries = Object.values(charts);

    for (let i = 0; i < chartEntries.length; i++) {
      const base64 = chartEntries[i].toDataURL('image/png').split(',')[1];
      const image = sheet.shapes.addImage(base64);
      image.left = positions[i].left;
      image.top = positions[i].top;
      image.width = 400;
      image.height = 300;
    }

    await context.sync();
  });
}
```

### Writing Results to Cells

```typescript
// Write capability results to cells
export async function writeResultsToSheet(results: AnalysisResults) {
  await Excel.run(async context => {
    const sheet = context.workbook.worksheets.getActiveWorksheet();

    // Write to a results area (e.g., starting at H1)
    const resultsRange = sheet.getRange('H1:I10');
    resultsRange.values = [
      ['Metric', 'Value'],
      ['Mean', results.mean],
      ['Std Dev', results.stdDev],
      ['UCL', results.ucl],
      ['LCL', results.lcl],
      ['Cp', results.cp],
      ['Cpk', results.cpk],
      ['n', results.n],
      ['Out of Control', results.outOfControl],
      ['', ''],
    ];

    // Format as table
    resultsRange.format.autofitColumns();

    await context.sync();
  });
}
```

---

## Manifest Configuration

### manifest.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<OfficeApp xmlns="http://schemas.microsoft.com/office/appforoffice/1.1"
           xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
           xsi:type="TaskPaneApp">

  <Id>12345678-1234-1234-1234-123456789abc</Id>
  <Version>1.0.0.0</Version>
  <ProviderName>RDMAIC Oy</ProviderName>
  <DefaultLocale>en-US</DefaultLocale>
  <DisplayName DefaultValue="VaRiScout"/>
  <Description DefaultValue="Variation analysis for Lean Six Sigma"/>

  <IconUrl DefaultValue="https://variscout.com/excel/assets/icon-32.png"/>
  <HighResolutionIconUrl DefaultValue="https://variscout.com/excel/assets/icon-128.png"/>

  <SupportUrl DefaultValue="https://variscout.com/support"/>

  <Hosts>
    <Host Name="Workbook"/>
  </Hosts>

  <Requirements>
    <Sets>
      <Set Name="ExcelApi" MinVersion="1.1"/>
    </Sets>
  </Requirements>

  <DefaultSettings>
    <SourceLocation DefaultValue="https://variscout.com/excel/taskpane.html"/>
  </DefaultSettings>

  <Permissions>ReadWriteDocument</Permissions>

  <VersionOverrides xmlns="http://schemas.microsoft.com/office/taskpaneappversionoverrides" xsi:type="VersionOverridesV1_0">
    <Hosts>
      <Host xsi:type="Workbook">
        <DesktopFormFactor>

          <!-- Ribbon button -->
          <ExtensionPoint xsi:type="PrimaryCommandSurface">
            <CustomTab id="VaRiScoutTab">
              <Group id="VaRiScoutGroup">
                <Label resid="GroupLabel"/>

                <Control xsi:type="Button" id="OpenTaskPaneButton">
                  <Label resid="OpenButtonLabel"/>
                  <Supertip>
                    <Title resid="OpenButtonLabel"/>
                    <Description resid="OpenButtonDesc"/>
                  </Supertip>
                  <Icon>
                    <bt:Image size="16" resid="Icon.16x16"/>
                    <bt:Image size="32" resid="Icon.32x32"/>
                    <bt:Image size="80" resid="Icon.80x80"/>
                  </Icon>
                  <Action xsi:type="ShowTaskpane">
                    <TaskpaneId>VaRiScoutPane</TaskpaneId>
                    <SourceLocation resid="TaskpaneUrl"/>
                  </Action>
                </Control>

              </Group>
              <Label resid="TabLabel"/>
            </CustomTab>
          </ExtensionPoint>

          <!-- Task pane -->
          <ExtensionPoint xsi:type="TaskPaneCommandSurface">
            <TaskPane>
              <TaskPaneId>VaRiScoutPane</TaskPaneId>
              <SourceLocation resid="TaskpaneUrl"/>
              <Title resid="TaskpaneTitle"/>
            </TaskPane>
          </ExtensionPoint>

        </DesktopFormFactor>
      </Host>
    </Hosts>

    <Resources>
      <bt:Urls>
        <bt:Url id="TaskpaneUrl" DefaultValue="https://variscout.com/excel/taskpane.html"/>
      </bt:Urls>
      <bt:ShortStrings>
        <bt:String id="TabLabel" DefaultValue="VaRiScout"/>
        <bt:String id="GroupLabel" DefaultValue="Variation Analysis"/>
        <bt:String id="OpenButtonLabel" DefaultValue="Analyze"/>
        <bt:String id="TaskpaneTitle" DefaultValue="VaRiScout"/>
      </bt:ShortStrings>
      <bt:LongStrings>
        <bt:String id="OpenButtonDesc" DefaultValue="Open VaRiScout to analyze variation in your data"/>
      </bt:LongStrings>
      <bt:Images>
        <bt:Image id="Icon.16x16" DefaultValue="https://variscout.com/excel/assets/icon-16.png"/>
        <bt:Image id="Icon.32x32" DefaultValue="https://variscout.com/excel/assets/icon-32.png"/>
        <bt:Image id="Icon.80x80" DefaultValue="https://variscout.com/excel/assets/icon-80.png"/>
      </bt:Images>
    </Resources>
  </VersionOverrides>

</OfficeApp>
```

---

## Licensing

### Same System as PWA

Uses the same license keys and validation:

```typescript
// src/shared/license.ts

import { validateLicense } from '@variscout/core/license';

const LICENSE_STORAGE_KEY = 'variscout_license';

export async function checkLicense(): Promise<LicenseStatus> {
  // Try to get from Office settings (persists per user)
  const license = await getStoredLicense();

  if (!license) {
    return { active: false, reason: 'no_license' };
  }

  // Validate offline (same as PWA)
  return validateLicense(license);
}

async function getStoredLicense(): Promise<string | null> {
  return new Promise(resolve => {
    Office.context.roamingSettings.get(LICENSE_STORAGE_KEY, result => {
      resolve(result.value || null);
    });
  });
}

export async function storeLicense(licenseKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    Office.context.roamingSettings.set(LICENSE_STORAGE_KEY, licenseKey);
    Office.context.roamingSettings.saveAsync(result => {
      if (result.status === Office.AsyncResultStatus.Succeeded) {
        resolve();
      } else {
        reject(new Error('Failed to save license'));
      }
    });
  });
}
```

### Upgrade Triggers

```
UPGRADE TRIGGER POINTS
─────────────────────────────────────────────────────────────────

PRIMARY: Save attempt
┌─────────────────────────────────────────────────────────────┐
│  Save Settings                                        [×]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  💾 Save your analysis settings?                            │
│                                                             │
│  Saving embeds your configuration in this workbook:         │
│  • Spec limits (LSL: 9.95, USL: 10.05)                     │
│  • Column mappings (Value: B, Factors: C, D)               │
│  • Control limit method (Average)                          │
│                                                             │
│  This requires VaRiScout Individual (€49/year)             │
│                                                             │
│  [Maybe Later]                    [Upgrade Now - €49/year]  │
│                                                             │
│  ☐ Don't show this again                                   │
└─────────────────────────────────────────────────────────────┘

SECONDARY: Close task pane (with unsaved changes)
┌─────────────────────────────────────────────────────────────┐
│  Unsaved Settings                                     [×]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Your settings will be lost when you close.                 │
│                                                             │
│  Upgrade to save settings in this workbook so they're       │
│  still here next time you open it.                          │
│                                                             │
│  [Close Anyway]                   [Upgrade Now - €49/year]  │
│                                                             │
│  ☐ Don't show this again                                   │
└─────────────────────────────────────────────────────────────┘
```

### Upgrade Flow

```
User in Excel (Free tier)
         │
         ▼
Clicks "Save" or "Upgrade" in task pane
         │
         ▼
Opens Paddle checkout (popup window)
         │
         ▼
Payment complete → calls /license/activate
         │
         ▼
License key returned → stored in Office.roamingSettings
         │
         ▼
Save enabled → settings saved to workbook
```

### Watermark Behavior (Secondary Gate)

Charts still show watermark in free tier (for copied/exported charts):

```typescript
function ChartWithWatermark({ chart, licenseStatus }) {
  return (
    <div className="chart-container">
      {chart}
      {!licenseStatus.active && (
        <div className="watermark">VaRiScout Lite</div>
      )}
    </div>
  );
}
```

---

## Workbook Settings Storage

Settings are embedded in the Excel workbook using `Office.context.document.settings`. This means settings travel with the file — share the workbook, share the config.

### What Gets Saved

```typescript
// Settings stored in workbook (paid users only)
interface VaRiScoutSettings {
  // Data mapping
  dataRange: string; // "A1:D500"
  valueColumn: string; // "B" or "Diameter"
  factorColumns: string[]; // ["C", "D"] or ["Machine", "Shift"]
  timestampColumn?: string; // "A" or "Date"

  // Spec limits
  specLimits: {
    lsl?: number; // 9.95
    usl?: number; // 10.05
    target?: number; // 10.00
  };

  // Control chart settings
  controlLimits: {
    method: 'average' | 'median' | 'custom';
    sigmaMultiple: number; // 3
    customUCL?: number;
    customLCL?: number;
  };

  // UI state
  activeFilters: {
    factor: string;
    value: string;
  }[];

  // Metadata
  savedAt: string; // ISO timestamp
  savedBy: string; // User name
  version: string; // "1.0.0"
}
```

### Storage Implementation

```typescript
// src/services/workbookSettings.ts

const SETTINGS_KEY = 'VaRiScout_Settings';

export async function saveSettingsToWorkbook(settings: VaRiScoutSettings): Promise<void> {
  return new Promise((resolve, reject) => {
    // Store in document settings (persists with workbook)
    Office.context.document.settings.set(SETTINGS_KEY, JSON.stringify(settings));

    // Must call saveAsync to persist
    Office.context.document.settings.saveAsync(result => {
      if (result.status === Office.AsyncResultStatus.Succeeded) {
        resolve();
      } else {
        reject(new Error('Failed to save settings to workbook'));
      }
    });
  });
}

export async function loadSettingsFromWorkbook(): Promise<VaRiScoutSettings | null> {
  const raw = Office.context.document.settings.get(SETTINGS_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw) as VaRiScoutSettings;
  } catch {
    return null;
  }
}

export async function clearSettingsFromWorkbook(): Promise<void> {
  Office.context.document.settings.remove(SETTINGS_KEY);

  return new Promise(resolve => {
    Office.context.document.settings.saveAsync(() => resolve());
  });
}
```

### Auto-Load on Open

```typescript
// src/taskpane/App.tsx

function App() {
  const [settings, setSettings] = useState<VaRiScoutSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSavedSettings() {
      const saved = await loadSettingsFromWorkbook();

      if (saved) {
        // Restore UI state from saved settings
        setSettings(saved);

        // Re-bind to the saved data range
        await loadDataFromRange(saved.dataRange);

        // Apply spec limits
        setSpecLimits(saved.specLimits);

        // Apply filters
        setActiveFilters(saved.activeFilters);
      }

      setLoading(false);
    }

    loadSavedSettings();
  }, []);

  // ...
}
```

### Save Button Behavior

```typescript
function SaveButton({ settings, licenseStatus }) {
  const handleSave = async () => {
    if (!licenseStatus.active) {
      // Show upgrade prompt
      showUpgradeDialog('save');
      return;
    }

    // Save to workbook
    await saveSettingsToWorkbook({
      ...settings,
      savedAt: new Date().toISOString(),
      savedBy: Office.context.mailbox?.userProfile?.displayName || 'Unknown',
      version: APP_VERSION
    });

    showToast('Settings saved to workbook');
  };

  return (
    <button onClick={handleSave}>
      💾 Save Settings
    </button>
  );
}
```

### What Happens When Sharing

```
SHARING WORKFLOW
─────────────────────────────────────────────────────────────────

You (paid user):
1. Analyze data in Excel
2. Set spec limits, configure charts
3. Save settings → embedded in workbook
4. Send Excel file to colleague

Colleague (with VaRiScout, any tier):
1. Opens Excel file
2. Opens VaRiScout task pane
3. Settings auto-load from workbook ✓
4. Same analysis, same config

Colleague (without VaRiScout):
1. Opens Excel file → Data is there
2. No task pane → Settings ignored (just metadata)
3. Can install VaRiScout from AppSource
```

---

## Features

### Data Binding Options

```typescript
// Option 1: Manual selection
// User selects range, clicks "Load Data"

// Option 2: Named range binding
// User creates named range "VaRiScoutData", auto-updates

// Option 3: Table binding
// User creates Excel Table, VaRiScout binds to it

export async function bindToTable(tableName: string) {
  await Excel.run(async context => {
    const table = context.workbook.tables.getItem(tableName);
    const dataRange = table.getDataBodyRange();
    const headerRange = table.getHeaderRowRange();

    dataRange.load('values');
    headerRange.load('values');

    await context.sync();

    // Now we have live binding - can listen for changes
    table.onChanged.add(async () => {
      // Reload and re-analyze
      await refreshAnalysis();
    });

    await context.sync();
  });
}
```

### Live Updates (Optional)

```typescript
// Watch for data changes and auto-update charts
export function enableLiveUpdates(tableName: string) {
  Excel.run(async context => {
    const table = context.workbook.tables.getItem(tableName);

    table.onChanged.add(async event => {
      console.log('Table changed:', event.changeType);

      // Debounce to avoid too many updates
      debouncedRefresh();
    });

    await context.sync();
  });
}

const debouncedRefresh = debounce(() => {
  refreshAnalysis();
}, 500);
```

### Export Options

```typescript
interface ExportOptions {
  // Insert charts as images into Excel
  insertIntoExcel: boolean;

  // Copy to clipboard for PowerPoint
  copyToClipboard: boolean;

  // Download as PNG file
  downloadPng: boolean;

  // Write results to cells
  writeResultsToCells: boolean;
}
```

### Staged I-Chart Analysis

The Excel Add-in supports staged I-Chart analysis for comparing process phases:

**Setup Wizard Configuration**

- **Step 3 (Stage Analysis)**: Select a categorical column to divide the I-Chart into stages
- Stage columns must have 2-10 unique values
- Choose stage order mode: Auto-detect, First occurrence, or Alphabetical

**How It Works**

1. During setup, select a stage column (e.g., "Phase", "Batch", "Shift")
2. The I-Chart will display separate control limits (UCL, Mean, LCL) per stage
3. Vertical dividers mark stage boundaries
4. Stage labels appear at the top of each section

**Use Cases**

- Before/after process improvement comparisons
- Batch-to-batch analysis
- Shift or time period comparisons

See [Staged Analysis User Guide](../pwa/STAGED_ANALYSIS.md) for detailed usage patterns.

---

## Development Setup

### Prerequisites

```bash
# Node.js 18+
node --version

# Install Yeoman and Office generator
npm install -g yo generator-office

# Or start from our template
git clone https://github.com/variscout/excel-addin.git
cd excel-addin
npm install
```

### Development Commands

```bash
# Start dev server with sideloading
npm start

# This will:
# 1. Start webpack dev server on https://localhost:3000
# 2. Open Excel with add-in sideloaded
# 3. Hot reload on code changes

# Build for production
npm run build

# Validate manifest
npm run validate

# Package for submission
npm run package
```

### Testing in Different Excel Versions

```
LOCAL TESTING
─────────────────────────────────────────────────────────────────

Excel Desktop (Windows)
  npm start
  → Sideloads automatically

Excel Desktop (Mac)
  npm start
  → Manual sideload: Insert → Add-ins → My Add-ins

Excel Online
  1. Upload manifest to SharePoint or localhost
  2. Insert → Office Add-ins → Upload My Add-in
  3. Select manifest.xml

Excel on iPad
  1. Publish to AppSource (or internal catalog)
  2. Insert → Add-ins → Find in store
```

---

## Platform Compatibility

### Supported Platforms

| Platform                | Support Level      | Notes             |
| ----------------------- | ------------------ | ----------------- |
| Excel Desktop (Windows) | ✅ Full            | Best experience   |
| Excel Desktop (Mac)     | ✅ Full            |                   |
| Excel Online            | ✅ Full            |                   |
| Excel on iPad           | ⚠️ Limited         | Task pane smaller |
| Excel on iPhone         | ❌ Not recommended | Screen too small  |
| Excel on Android        | ⚠️ Limited         | Task pane smaller |

### API Requirements

```json
{
  "requirements": {
    "sets": [{ "name": "ExcelApi", "minVersion": "1.1" }],
    "methods": ["Workbook.getSelectedRange", "Range.values", "Worksheet.shapes.addImage"]
  }
}
```

### Feature Detection

```typescript
// Check if a feature is available
if (Office.context.requirements.isSetSupported('ExcelApi', '1.9')) {
  // Use newer API features
} else {
  // Fallback for older Excel versions
}
```

---

## AppSource Submission

### Certification Requirements

```
CERTIFICATION CHECKLIST
─────────────────────────────────────────────────────────────────

Manifest
☐ Valid XML schema
☐ HTTPS URLs only
☐ Correct permissions
☐ Icons at all required sizes

Security
☐ HTTPS for all resources
☐ No external scripts from untrusted sources
☐ Content Security Policy headers
☐ No sensitive data in logs

UX
☐ First-run experience
☐ Clear error messages
☐ Works when Excel has no data
☐ Responsive task pane (300px - 500px width)

Performance
☐ Task pane loads < 3 seconds
☐ Analysis completes < 2 seconds for 10k rows
☐ No memory leaks

Accessibility
☐ Keyboard navigation
☐ Screen reader support
☐ High contrast support
```

### Listing Details

```
APPSOURCE LISTING
─────────────────────────────────────────────────────────────────

VaRiScout for Excel
by RDMAIC Oy

"Variation analysis for Lean Six Sigma in Excel"

Description:
Select your data, click Analyze. Get I-Charts, Boxplots,
Pareto charts, and Capability analysis instantly. Click any
chart to filter all charts. Copy to PowerPoint with one click.

Features:
✓ I-Chart with control limits
✓ Boxplot with statistical comparison
✓ Pareto chart with 80/20 line
✓ Capability analysis (Cp, Cpk)
✓ Linked filtering across all charts
✓ One-click copy to PowerPoint
✓ Works offline

Pricing:
• Free: Full analysis, settings lost on close
• Individual: €49/year, save settings in workbook

Free trial: Unlimited (settings not saved)
```

---

## Phased Development

### Phase 1: MVP (6-8 weeks)

```
Week 1-2: Setup & Data Binding
├── Project scaffolding (Yeoman)
├── Manifest configuration
├── Basic task pane UI
├── Excel data reading (Office.js)
└── Column mapping UI

Week 3-4: Charts
├── Integrate @variscout/core
├── Render all 4 charts
├── Internal linked filtering
└── Basic styling

Week 5-6: Save & Export
├── Workbook settings storage (document.settings)
├── Auto-load settings on open
├── Copy to clipboard (with watermark)
├── Insert into Excel as image
└── Error handling

Week 7-8: Licensing & Submission
├── License validation (reuse from PWA)
├── Upgrade prompts (save as gate)
├── Instant activation (Paddle)
├── AppSource submission
└── Documentation
```

**Deliverable:** VaRiScout Excel on AppSource

### Phase 2: Enhanced Features

```
Based on user feedback:
├── Live data binding (Excel Table auto-update)
├── Write statistical results to cells
├── Named range support
├── Multiple data sets per workbook
├── Template library (load preset configs)
└── Azure integration (SharePoint storage)
```

---

## Notes

### Differences from PWA

| Aspect           | PWA                 | Excel Add-in                 |
| ---------------- | ------------------- | ---------------------------- |
| Data source      | File upload / paste | Excel selection              |
| Settings storage | IndexedDB           | Workbook (document.settings) |
| Sharing          | Export .vrs file    | Share Excel file             |
| Export charts    | Download PNG        | Insert into Excel sheet      |
| Offline          | Service Worker      | Excel handles                |
| License storage  | IndexedDB           | Office.roamingSettings       |
| Upgrade gate     | Save project        | Save settings in workbook    |

### Freemium Model Alignment

Both PWA and Excel follow the same philosophy:

```
FREE:  Full analysis power, but work is lost on close
PAID:  Save your work (PWA: projects, Excel: settings in workbook)
```

### Why Task Pane (Not Custom Functions)

- Task Pane: Visual analysis, charts, interaction
- Custom Functions: Cell-level calculations only

We need the visual experience, so Task Pane is correct.

### Shared Code Benefits

```
@variscout/core
├── Used by PWA          → same analysis
├── Used by Excel        → same analysis
├── Used by Power BI     → same analysis

One bug fix → all products fixed
One improvement → all products improved
```
