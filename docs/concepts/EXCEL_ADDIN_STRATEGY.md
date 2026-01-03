# Excel Add-in Strategy: PWA vs Native Charts

**Status:** Decision Made
**Date:** December 2024
**Decision:** Hybrid Approach - Native Excel slicers + Visx charts in Content Add-in

---

## Executive Summary

This document captures the strategic analysis comparing VariScout's PWA implementation against a native Excel Add-in approach. After researching Office.js capabilities and comparing trade-offs, we've decided on a **Hybrid Approach** that combines:

- **Native Excel Slicers** for filtering (automatic linked filtering when sharing same Table)
- **Visx Charts in Content Add-in** for high-quality, interactive visualizations
- **Shared @variscout/core** for consistent statistical calculations

This approach maximizes code reuse while providing enterprise Excel users with a familiar filtering experience.

---

## Office.js Capabilities Research

### What's Actually Possible in Excel 365

Research into Microsoft's Excel JavaScript API revealed several capabilities that correct initial assumptions:

| Feature                      | Support    | API Requirement | Notes                          |
| ---------------------------- | ---------- | --------------- | ------------------------------ |
| **Box-whisker charts**       | Yes        | ExcelApi 1.9    | `Excel.ChartType.Boxwhisker`   |
| **Histogram charts**         | Yes        | ExcelApi 1.9    | Native support                 |
| **Pareto charts**            | Yes        | ExcelApi 1.9    | Native support                 |
| **Line charts with markers** | Yes        | ExcelApi 1.1    | Full marker customization      |
| **Marker styling**           | Yes        | ExcelApi 1.7    | Circle, size, colors           |
| **Control limit lines**      | Workaround | ExcelApi 1.1    | Hidden series approach         |
| **Slicers**                  | Yes        | ExcelApi 1.10   | Automatic linked filtering     |
| **Slicer-to-chart linking**  | Automatic  | -               | When sharing same Table source |
| **Gradient fills**           | No         | -               | GitHub issue #4149 open        |
| **Click-on-chart events**    | No         | -               | No selection events exposed    |

### Key Findings

1. **Box-whisker charts ARE supported** - Original spec assumed they weren't, but `Excel.ChartType.Boxwhisker` works in ExcelApi 1.9+

2. **Slicer linking is automatic** - When a Slicer and Chart share the same Excel Table, filtering is automatic. No manual event handling needed.

3. **Control limits need workaround** - No native horizontal reference lines. Must use hidden data series plotted as flat lines.

4. **No click events on charts** - Cannot detect when user clicks a specific bar or data point. Slicers are the filtering mechanism.

---

## Approach Comparison

### PWA Strengths

| Aspect             | PWA Advantage                               |
| ------------------ | ------------------------------------------- |
| **Chart Quality**  | Full Visx/D3 control, gradients, animations |
| **Interactivity**  | Click-to-filter on any chart element        |
| **Cross-platform** | Works identically on any device/browser     |
| **Offline**        | True offline-first with Service Worker      |
| **Data Privacy**   | 100% local, no external services            |
| **Cost**           | Free to deploy, no per-user licensing       |

### Excel Add-in Strengths

| Aspect                  | Excel Advantage                  |
| ----------------------- | -------------------------------- |
| **Data Context**        | Already in Excel, no import step |
| **Enterprise Fit**      | IT-approved, SSO integration     |
| **Familiar UX**         | Users know Excel slicers         |
| **Copilot Integration** | Future natural language queries  |
| **Report Integration**  | Charts stay in workbook          |
| **Scale**               | Handles 1M+ rows natively        |

### Neither is Universally Better

The choice depends on the use case:

| Use Case                        | Better Approach |
| ------------------------------- | --------------- |
| Field data collection (offline) | PWA             |
| Ad-hoc analysis from file       | PWA             |
| Enterprise reporting workflow   | Excel Add-in    |
| Copilot-enabled analysis        | Excel Add-in    |
| Training/demo scenarios         | PWA             |
| IT-managed deployment           | Excel Add-in    |

---

## Feature Comparison Tables

### Chart Rendering Quality

| Feature             | PWA (Visx)      | Excel Native             | Winner |
| ------------------- | --------------- | ------------------------ | ------ |
| Control limit lines | Native support  | Hidden series workaround | PWA    |
| Gradient fills      | Full support    | Not supported            | PWA    |
| Animations          | Full control    | Limited                  | PWA    |
| Box-whisker         | Custom styled   | Native (basic)           | PWA    |
| Pareto              | Custom styled   | Native                   | Tie    |
| Responsive sizing   | Container-aware | Fixed aspect             | PWA    |

### Filtering Experience

| Feature                   | PWA          | Excel Add-in        | Winner |
| ------------------------- | ------------ | ------------------- | ------ |
| Click-on-chart filtering  | Yes          | No (use Slicers)    | PWA    |
| Multiple slicer selection | Custom UI    | Native Excel        | Excel  |
| Filter persistence        | localStorage | Workbook state      | Excel  |
| Cross-workbook filtering  | N/A          | SharePoint/Power BI | Excel  |

### User Experience

| Aspect                    | PWA       | Excel Add-in         | Winner |
| ------------------------- | --------- | -------------------- | ------ |
| Learning curve            | New tool  | Familiar environment | Excel  |
| Data import               | Required  | Already there        | Excel  |
| Mobile experience         | Excellent | Limited              | PWA    |
| Large screen presentation | Good      | Excellent            | Excel  |

### Enterprise Considerations

| Factor              | PWA             | Excel Add-in           | Winner |
| ------------------- | --------------- | ---------------------- | ------ |
| IT approval process | Web URL         | AppSource/Admin deploy | Tie    |
| SSO/Identity        | Custom          | Microsoft 365          | Excel  |
| Audit trail         | Custom          | Microsoft 365          | Excel  |
| Data residency      | Browser storage | Workbook location      | Excel  |
| Licensing control   | License keys    | Microsoft 365          | Excel  |

---

## Strategic Options Evaluated

### Option A: Native Excel Charts Only

Use Excel's built-in chart types exclusively with Office.js for creation and styling.

**Pros:**

- Simplest architecture
- Charts native to workbook
- No iframe/Content Add-in complexity

**Cons:**

- Limited styling (no gradients)
- No click-on-chart interaction
- Control limits require workaround
- Less visual polish than PWA

**Code Reuse:** ~60% (core stats only)

---

### Option B: Hybrid Approach (Selected)

Combine native Excel Slicers for filtering with Visx charts rendered in a Content Add-in.

**Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│  Excel Workbook                                             │
│  ┌─────────────────┐  ┌───────────────────────────────────┐ │
│  │  Excel Table    │  │  Content Add-in (iframe)          │ │
│  │  (raw data)     │  │  ┌─────────────────────────────┐  │ │
│  │                 │  │  │  Visx Charts                │  │ │
│  │  [Slicer: Farm] │  │  │  - I-Chart with limits     │  │ │
│  │  [Slicer: Date] │  │  │  - Boxplot (styled)        │  │ │
│  │                 │  │  │  - Pareto                  │  │ │
│  │  Slicers filter │──│──│  Charts read filtered     │  │ │
│  │  the Table      │  │  │  data via Office.js       │  │ │
│  └─────────────────┘  │  └─────────────────────────────┘  │ │
│                       └───────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Pros:**

- Best chart quality (Visx)
- Familiar filtering (Excel Slicers)
- High code reuse from PWA
- Future Copilot integration path

**Cons:**

- Content Add-in sizing complexity
- Two rendering contexts (Excel + iframe)
- More complex architecture

**Code Reuse:** ~85% (core + charts)

---

### Option C: PWA-First with Excel Integration

Keep PWA as primary, add Excel integration for data import/export only.

**Pros:**

- Minimal new development
- PWA already works well
- Clear separation

**Cons:**

- Users must switch contexts
- No Copilot path
- Doesn't serve Excel-centric workflows

**Code Reuse:** 100% (no Excel-specific code)

---

## Decision: Hybrid Approach (Option B)

The Hybrid approach provides the best balance:

1. **Enterprise users** get familiar Excel experience with Slicers
2. **Chart quality** matches PWA with full Visx capabilities
3. **Copilot integration** path via declarative agent + actions
4. **Code reuse** maximized (~85% of PWA code)

### Implementation Architecture

```
packages/
├── core/           # 100% shared - stats, parser, license
└── charts/         # 95% shared - Visx components (props-based)

apps/
├── pwa/            # Standalone PWA (current implementation)
└── excel-addin/
    ├── taskpane/   # Setup, config, settings UI
    └── content/    # Visx charts, reads from Excel Table
```

### Key Technical Decisions

1. **Slicers over custom filtering** - Let Excel handle filtering natively
2. **Content Add-in for charts** - Full React/Visx environment
3. **Table binding** - Charts read from named Table, auto-refresh on change
4. **Shared statistics** - @variscout/core for identical calculations
5. **Props-based charts** - @variscout/charts accepts data as props (no context dependency)

---

## Key Insights from Research

### Spec Corrections

| Original Assumption                      | Reality                                             |
| ---------------------------------------- | --------------------------------------------------- |
| Box-whisker not supported                | Supported via `ChartType.Boxwhisker` (ExcelApi 1.9) |
| Complex slicer-chart linking code needed | Automatic when sharing same Table                   |
| Need custom filtering UI                 | Excel Slicers work better for enterprise            |

### What PWA Does Better

- Offline field use
- Mobile experience
- Click-anywhere interactivity
- Presentation mode for training

### What Excel Does Better

- Enterprise IT compliance
- Large dataset handling
- Copilot natural language interface
- Workbook-based reporting

---

## Next Steps

1. **Complete scaffold** - Task pane with setup flow
2. **Implement Content Add-in** - Visx charts in iframe
3. **Add Table binding** - Office.js data reading
4. **Slicer integration** - Automatic via shared Table
5. **Copilot actions** - `analyzeControlChart`, `calculateCapability`, etc.

---

## Sources

### Microsoft Documentation

- [Excel.Chart API](https://learn.microsoft.com/en-us/javascript/api/excel/excel.chart)
- [Excel.ChartSeries API](https://learn.microsoft.com/en-us/javascript/api/excel/excel.chartseries)
- [Excel.Slicer API](https://learn.microsoft.com/en-us/javascript/api/excel/excel.slicer)
- [Content Add-ins](https://learn.microsoft.com/en-us/office/dev/add-ins/excel/excel-add-ins-overview)
- [Copilot Agents with Add-ins](https://learn.microsoft.com/en-us/office/dev/add-ins/design/agent-and-add-in-overview)

### GitHub Issues

- [No gradient fill support](https://github.com/OfficeDev/office-js/issues/4149)

### Related Documents

- [Excel Copilot Concept](./EXCEL_COPILOT_CONCEPT.md) - Vision and Copilot integration
- [Subscription Licensing](./SUBSCRIPTION_LICENSING.md) - Licensing and pricing strategy
- [Monorepo Architecture](../MONOREPO_ARCHITECTURE.md) - Package structure
