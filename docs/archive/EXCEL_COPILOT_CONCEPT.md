# Concept: VariScout as Excel Copilot Skill

**Status:** Concept / Exploration
**Date:** December 2024
**Author:** Product Team

> **Related:** [Excel Add-in Strategy](./EXCEL_ADDIN_STRATEGY.md) - Strategic analysis comparing PWA vs Excel Add-in approaches. Decision: **Hybrid Approach** (Native slicers + Visx Content Add-in).

---

## The Opportunity

Microsoft 365 Copilot is now integrated into Excel. Users can ask Copilot questions about their data in natural language. As of 2025, **Excel add-ins can become Copilot skills** - meaning users can ask Copilot to perform quality analysis, and Copilot invokes VariScout to do the work.

This creates a unique market position: **"The quality analysis tool that works with Copilot."**

---

## Vision

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Excel + Copilot + VariScout                                            │
│                                                                         │
│  ┌─────────────────────────────────────┬───────────────────────────────┐│
│  │                                     │  Copilot Chat                 ││
│  │  A         B          C             │                               ││
│  │  Weight    Supplier   Date          │  You: "Is this process       ││
│  │  12.5      Farm A     2024-01-15    │        in control?"           ││
│  │  13.2      Farm B     2024-01-15    │                               ││
│  │  11.8      Farm A     2024-01-16    │  Copilot: I'll analyze this   ││
│  │  14.1      Farm C     2024-01-16    │  using VariScout...           ││
│  │  12.9      Farm A     2024-01-17    │                               ││
│  │  ...       ...        ...           │  ┌─────────────────────────┐  ││
│  │                                     │  │  I-Chart Analysis       │  ││
│  │  [Data selected by user]            │  │  ●  ●  ●                │  ││
│  │                                     │  │  ── UCL ──              │  ││
│  │                                     │  │  ●  ●     ●             │  ││
│  │                                     │  │  ── Mean ──             │  ││
│  │                                     │  │  ●     ●                │  ││
│  │                                     │  │  ── LCL ──              │  ││
│  │                                     │  └─────────────────────────┘  ││
│  │                                     │                               ││
│  │                                     │  ✅ Process is in control     ││
│  │                                     │  Mean: 12.7 | Cpk: 1.42       ││
│  │                                     │  No special causes detected   ││
│  └─────────────────────────────────────┴───────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

**User never leaves Excel. User never learns VariScout UI. User just asks questions.**

---

## Example Conversations

### Basic Analysis

```
User: "Analyze column B for quality issues"

Copilot: I'll use VariScout to analyze the Weight data in column B.

[VariScout generates I-Chart]

Based on the analysis:
- Mean: 12.7g, Std Dev: 0.8g
- Process is IN CONTROL (no points outside control limits)
- 2 values are close to UCL - worth monitoring

Would you like me to:
- Compare by Supplier?
- Check capability against your specs?
- Highlight problem values?
```

### Capability Analysis

```
User: "What's the Cpk if my spec is 10-15?"

Copilot: I'll calculate process capability for Weight with LSL=10 and USL=15.

[VariScout calculates]

📊 Capability Analysis:
- Cp: 1.04 (process spread vs spec spread)
- Cpk: 0.91 ⚠️ (accounts for centering)

The Cpk of 0.91 is below 1.0, indicating the process may produce
some out-of-spec items. The process is shifted slightly high
(mean 12.7 vs target 12.5).

Recommendation: Investigate why values trend toward upper limit.
```

### Comparative Analysis

```
User: "Which supplier has the most variation?"

Copilot: I'll compare suppliers using VariScout.

[VariScout generates Boxplot by Supplier]

Supplier Comparison:
┌──────────┬──────┬─────────┬────────────┐
│ Supplier │ Mean │ Std Dev │ η² Impact  │
├──────────┼──────┼─────────┼────────────┤
│ Farm A   │ 12.3 │ 0.4     │ Low        │
│ Farm B   │ 12.8 │ 0.5     │ Low        │
│ Farm C   │ 13.1 │ 1.2     │ HIGH (34%) │
└──────────┴──────┴─────────┴────────────┘

⚠️ Farm C has 3x the variation of other suppliers and accounts
for 34% of total variation in your data.
```

### Defect Analysis

```
User: "Show me a Pareto of defects in column D"

Copilot: I'll create a Pareto analysis of defect types.

[VariScout generates Pareto chart]

Defect Breakdown:
████████████████████  Cosmetic (45%)
██████████████        Weight (31%)
████████              Dimension (18%)
███                   Other (6%)

The top 2 defect types (Cosmetic + Weight) account for 76%
of all defects. Focusing here would have the highest impact.
```

### Natural Language Spec Setting

```
User: "Highlight any weights outside 11-14"

Copilot: I'll have VariScout check values against those limits.

[VariScout applies conditional formatting]

Found 3 out-of-spec values:
- Row 7: 10.2 (below LSL of 11) ❌
- Row 15: 14.3 (above USL of 14) ❌
- Row 23: 14.1 (above USL of 14) ❌

Pass rate: 94% (47/50 within spec)

I've highlighted these cells in red. Would you like to:
- See which suppliers these came from?
- Export a report of failures?
```

---

## Technical Architecture

### Add-in Actions (Copilot Skills)

```json
{
  "actions": [
    {
      "id": "analyzeControlChart",
      "displayName": "Analyze Control Chart",
      "description": "Generate I-Chart and detect special causes",
      "parameters": {
        "dataRange": { "type": "string", "description": "Excel range to analyze" },
        "usl": { "type": "number", "description": "Upper spec limit (optional)" },
        "lsl": { "type": "number", "description": "Lower spec limit (optional)" }
      }
    },
    {
      "id": "calculateCapability",
      "displayName": "Calculate Process Capability",
      "description": "Calculate Cp and Cpk for selected data",
      "parameters": {
        "dataRange": { "type": "string" },
        "usl": { "type": "number", "required": true },
        "lsl": { "type": "number", "required": true }
      }
    },
    {
      "id": "compareByFactor",
      "displayName": "Compare by Factor",
      "description": "Generate boxplot comparing groups",
      "parameters": {
        "outcomeRange": { "type": "string" },
        "factorRange": { "type": "string" }
      }
    },
    {
      "id": "paretoAnalysis",
      "displayName": "Pareto Analysis",
      "description": "Show frequency breakdown of categories",
      "parameters": {
        "categoryRange": { "type": "string" }
      }
    },
    {
      "id": "highlightOutOfSpec",
      "displayName": "Highlight Out of Spec",
      "description": "Color cells based on spec limits",
      "parameters": {
        "dataRange": { "type": "string" },
        "usl": { "type": "number" },
        "lsl": { "type": "number" }
      }
    }
  ]
}
```

### JavaScript Implementation

```typescript
// Register actions with Copilot
Office.actions.associate('analyzeControlChart', async args => {
  const { dataRange, usl, lsl } = args;

  await Excel.run(async context => {
    // Get data from specified range
    const range = context.workbook.worksheets.getActiveWorksheet().getRange(dataRange);
    range.load('values');
    await context.sync();

    // Use existing VariScout stats engine
    const values = range.values.flat().filter(v => typeof v === 'number');
    const stats = calculateStats(values, usl, lsl);

    // Return result to Copilot for natural language response
    return {
      mean: stats.mean,
      stdDev: stats.stdDev,
      ucl: stats.ucl,
      lcl: stats.lcl,
      cpk: stats.cpk,
      outOfSpec: stats.outOfSpecPercentage,
      inControl: detectSpecialCauses(values, stats).length === 0,
    };
  });
});
```

### Unified Manifest Structure

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/teams/vDevPreview/MicrosoftTeams.schema.json",
  "manifestVersion": "devPreview",
  "version": "1.0.0",
  "id": "variscout-excel-copilot",
  "name": { "short": "VariScout", "full": "VariScout Quality Analysis" },
  "description": {
    "short": "Quality analysis powered by Copilot",
    "full": "Analyze variation, calculate capability, compare factors - all through natural language."
  },
  "developer": { "name": "VariScout" },
  "extensions": {
    "excel": {
      "runtimes": [{ "id": "runtime", "type": "general", "code": { "page": "taskpane.html" } }],
      "actions": [
        {
          "id": "analyzeControlChart",
          "displayName": "Analyze Control Chart",
          "type": "executeDataFunction"
        },
        {
          "id": "calculateCapability",
          "displayName": "Calculate Capability",
          "type": "executeDataFunction"
        },
        {
          "id": "compareByFactor",
          "displayName": "Compare by Factor",
          "type": "executeDataFunction"
        },
        { "id": "paretoAnalysis", "displayName": "Pareto Analysis", "type": "executeDataFunction" },
        {
          "id": "highlightOutOfSpec",
          "displayName": "Highlight Out of Spec",
          "type": "executeDataFunction"
        }
      ]
    }
  },
  "copilotAgents": {
    "declarativeAgents": [
      {
        "$schema": "https://developer.microsoft.com/json-schemas/copilot/declarative-agent/v1.0/schema.json",
        "name": "VariScout",
        "description": "Quality and variation analysis assistant",
        "instructions": "You help users analyze data quality. When users ask about variation, control charts, capability (Cp/Cpk), or comparing groups, use the VariScout actions to analyze their Excel data and explain results clearly."
      }
    ]
  }
}
```

---

## Code Reuse from PWA

The Excel add-in can reuse most of the existing VariScout codebase:

| Component                | Reuse      | Notes                                  |
| ------------------------ | ---------- | -------------------------------------- |
| `packages/core/stats.ts` | ✅ 100%    | Core statistics engine                 |
| `packages/charts/*`      | ✅ 95%     | Visx charts work in Content Add-in     |
| `DataContext.tsx`        | ⚠️ Adapt   | Replace with Excel Table binding       |
| `lib/persistence.ts`     | ❌ Replace | Use Excel workbook storage             |
| `lib/export.ts`          | ⚠️ Adapt   | Export to Excel cells instead of files |

**Estimated new code:** ~15% (Excel bindings, Copilot actions, manifest)

> **Note:** Research confirmed that Box-whisker charts ARE natively supported in Excel via `Excel.ChartType.Boxwhisker` (ExcelApi 1.9). However, the Hybrid Approach uses Visx charts in a Content Add-in for consistent styling and better interactivity. See [Excel Add-in Strategy](./EXCEL_ADDIN_STRATEGY.md) for details.

---

## User Experience Comparison

| Scenario       | Traditional Add-in          | Copilot-Enabled       |
| -------------- | --------------------------- | --------------------- |
| Learn the tool | Open task pane, learn UI    | Just ask questions    |
| Select data    | Click buttons, configure    | "Analyze column B"    |
| Set specs      | Find settings, enter values | "My spec is 10-15"    |
| Compare groups | Find boxplot, select factor | "Compare by supplier" |
| Get insight    | Interpret charts yourself   | Copilot explains      |
| Take action    | Manual highlighting         | "Highlight problems"  |

**Key insight:** Copilot removes the learning curve entirely.

---

## Market Positioning

### Target Users

1. **Copilot subscribers** - Already paying for M365 Copilot, want more value
2. **Casual quality analysts** - Don't want to learn SPC software
3. **Excel power users** - Want quality analysis without leaving Excel
4. **Enterprises** - "Works with Copilot" is increasingly a requirement

### Competitive Advantage

| Competitor     | Copilot Integration         |
| -------------- | --------------------------- |
| Minitab        | ❌ Standalone desktop app   |
| JMP            | ❌ Standalone desktop app   |
| Excel built-in | ⚠️ Basic (no SPC expertise) |
| **VariScout**  | ✅ Native Copilot skill     |

### Messaging

> **"Ask Copilot. Get Quality Insights."**
>
> VariScout brings statistical process control to Microsoft 365 Copilot.
> No training required. Just ask questions about your data.

---

## Technical Requirements

| Requirement      | Status     | Notes                     |
| ---------------- | ---------- | ------------------------- |
| Unified Manifest | Required   | New manifest format       |
| Office.js        | Required   | Excel APIs                |
| Copilot license  | User needs | M365 Copilot subscription |
| Mac support      | ❌ Not yet | Windows/Web only          |
| Mobile support   | ❌ Not yet | Desktop Excel only        |

---

## Effort Estimate

| Phase                  | Work                    | Duration    |
| ---------------------- | ----------------------- | ----------- |
| 1. Basic Excel add-in  | Task pane with charts   | 2 weeks     |
| 2. Copilot actions     | Register 5 core actions | 1 week      |
| 3. Agent configuration | Instructions, prompts   | 1 week      |
| 4. Polish & testing    | Edge cases, UX          | 1 week      |
| **Total**              |                         | **5 weeks** |

Assumes significant code reuse from existing PWA.

---

## Risks & Mitigations

| Risk                           | Impact           | Mitigation                       |
| ------------------------------ | ---------------- | -------------------------------- |
| Copilot adoption still growing | Limited market   | Also offer as standalone add-in  |
| Mac not supported              | Lost users       | PWA continues to work everywhere |
| Microsoft changes APIs         | Rework           | Stay close to official samples   |
| Complex queries fail           | User frustration | Good fallback to task pane UI    |

---

## Decision Points

1. **Primary or parallel track?**
   - Should Excel+Copilot replace Teams focus?
   - Or run as parallel product?

2. **Standalone add-in first?**
   - Build traditional Excel add-in, then add Copilot?
   - Or go Copilot-first?

3. **Pricing model?**
   - Free with branding (like PWA Community)?
   - Licensed removes branding?
   - Enterprise self-hosted option?

---

## Next Steps

1. **Prototype** basic Excel add-in with one chart (I-Chart)
2. **Test** Copilot action registration
3. **Validate** user experience with real queries
4. **Decide** on product strategy based on prototype learnings

---

## References

- [Combine Copilot Agents with Office Add-ins](https://learn.microsoft.com/en-us/office/dev/add-ins/design/agent-and-add-in-overview)
- [Office Add-ins at Build 2025](https://devblogs.microsoft.com/microsoft365dev/office-addins-at-build-2025/)
- [Copilot Extensibility Ecosystem](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/ecosystem)
- [Build API plugins with Office.js](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/build-api-plugins-local-office-api)
