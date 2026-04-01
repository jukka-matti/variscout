---
title: Improvement Prioritization Design
audience: [engineer, analyst]
category: workflow
status: delivered
related: [improve, prioritization, risk, timeframe, cost, matrix, ideas, actions, adr-035]
---

# Improvement Prioritization Design

Multi-dimensional evaluation model for improvement ideas, replacing the single effort dimension with timeframe, cost, and risk — plus a visual prioritization matrix for comparing ideas across dimensions.

## Data Model

### IdeaTimeframe (replaces IdeaEffort)

```typescript
type IdeaTimeframe = 'just-do' | 'days' | 'weeks' | 'months';
```

| Level   | Color | Tailwind         | Definition                                        |
| ------- | ----- | ---------------- | ------------------------------------------------- |
| Just do | Green | `text-green-500` | Right now, existing resources, no approval needed |
| Days    | Cyan  | `text-cyan-500`  | Minor coordination, can be done within days       |
| Weeks   | Amber | `text-amber-500` | Requires planning, moderate resources             |
| Months  | Red   | `text-red-400`   | Investment, cross-team, significant planning      |

### IdeaCost (new)

```typescript
type IdeaCostCategory = 'none' | 'low' | 'medium' | 'high';
interface IdeaCost {
  category: IdeaCostCategory;
  amount?: number; // Optional precise euro amount
  currency?: string; // Default: 'EUR'
}
```

Dual-mode: categorical quick estimate (default) or precise euro amount (enables budget fitting).

### IdeaRiskAssessment (new)

```typescript
type RiskLevel = 1 | 2 | 3;
type ComputedRiskLevel = 'low' | 'medium' | 'high' | 'very-high';
interface IdeaRiskAssessment {
  axis1: RiskLevel;
  axis2: RiskLevel;
  computed: ComputedRiskLevel;
}
```

Two configurable sub-axes produce a computed risk level via the 3x3 RDMAIC matrix:

```
            axis2=1(None)  axis2=2(Possible)  axis2=3(Immediate)
axis1=3(Severe):       High         High            Very High
axis1=2(Significant):  Medium       Medium          High
axis1=1(Small):        Low          Medium          High
```

### Risk Axis Configuration

```typescript
type RiskAxisPreset = 'process' | 'safety' | 'environmental' | 'quality' | 'regulatory' | 'brand';
interface RiskAxisConfig {
  axis1: RiskAxisPreset; // default: 'process'
  axis2: RiskAxisPreset; // default: 'safety'
}
```

Stored in `AnalysisState.riskAxisConfig`. Configured in Settings panel.

### Budget Configuration

```typescript
interface BudgetConfig {
  totalBudget?: number;
  currency?: string;
}
```

Stored in `AnalysisState.budgetConfig`. Summary bar shows spend vs budget when precise costs are entered.

### Updated ImprovementIdea

```typescript
interface ImprovementIdea {
  id: string;
  text: string;
  direction?: IdeaDirection;
  timeframe?: IdeaTimeframe; // was: effort?: IdeaEffort
  cost?: IdeaCost; // new
  risk?: IdeaRiskAssessment; // new
  impactOverride?: IdeaImpact;
  projection?: FindingProjection;
  selected?: boolean;
  notes?: string;
  createdAt: string;
}
```

## UI Components

### Idea Row Layout

```
☑ text [Just do ▾] [€ Low ▾] ● Cpk 1.35 ⋯
```

| Element            | Component         | Description                                    |
| ------------------ | ----------------- | ---------------------------------------------- |
| Checkbox           | Native            | Select/deselect for conversion to actions      |
| Idea text          | Editable inline   | Click to edit                                  |
| Timeframe dropdown | `<select>`        | Just Do / Days / Weeks / Months, color-coded   |
| Cost badge         | Dropdown or input | None / Low / Med / High, or precise € amount   |
| Risk dot           | Colored circle    | Shows computed risk level, click → RiskPopover |
| Projection badge   | Read-only         | "Cpk X.XX" when What-If projection attached    |
| Overflow menu (⋯)  | Dropdown          | Direction, What-If, CoScout, delete            |

### RiskPopover

```typescript
interface RiskPopoverProps {
  axis1?: RiskLevel;
  axis2?: RiskLevel;
  axisConfig: RiskAxisConfig;
  onRiskChange: (risk: IdeaRiskAssessment) => void;
  onAxisConfigChange?: (config: RiskAxisConfig) => void;
}
```

- 3x3 clickable grid with color-coded cells
- Blue highlight on current selection
- Clickable axis labels for preset switching
- Result bar showing computed risk level

### PrioritizationMatrix

```typescript
interface PrioritizationMatrixProps {
  ideas: Array<{
    id: string;
    text: string;
    timeframe?: IdeaTimeframe;
    cost?: IdeaCost;
    risk?: IdeaRiskAssessment;
    impactOverride?: IdeaImpact;
    projection?: FindingProjection;
    direction?: IdeaDirection;
    selected?: boolean;
  }>;
  xAxis: MatrixDimension;
  yAxis: MatrixDimension;
  colorBy: MatrixDimension;
  onToggleSelect: (ideaId: string) => void;
  onAxisChange: (axis: 'x' | 'y' | 'color', value: MatrixDimension) => void;
}
type MatrixDimension = 'benefit' | 'timeframe' | 'cost' | 'risk';
```

SVG-based scatter plot with:

- Axis selector dropdowns at top
- 4 preset buttons (Bang for Buck, Quick Impact, Risk-Reward, Budget View)
- Categorical dimensions snap to grid positions; continuous values (Cpk delta, € amount) use proportional positioning
- Click dot to toggle selection
- Hover tooltip showing all dimensions
- "Quick Wins" label in top-left quadrant

### ImprovementSummaryBar (updated)

```typescript
interface ImprovementSummaryBarProps {
  selectedCount: number;
  timeframeBreakdown: { 'just-do': number; days: number; weeks: number; months: number };
  maxRisk?: ComputedRiskLevel;
  totalCost?: number;
  costBreakdown?: { none: number; low: number; medium: number; high: number };
  budget?: number;
  projectedCpk?: number;
  targetCpk?: number;
  onConvertToActions?: () => void;
  convertDisabled?: boolean;
}
```

### ImprovementWorkspaceBase (updated)

Gains List/Matrix toggle tabs. In matrix mode, renders PrioritizationMatrix instead of IdeaGroupCards.

## CoScout AI Integration

The `suggest_improvement_idea` tool schema includes:

```json
{
  "timeframe": { "enum": ["just-do", "days", "weeks", "months"] },
  "cost": { "enum": ["none", "low", "medium", "high"] },
  "risk_axis1": { "type": "integer", "minimum": 1, "maximum": 3 },
  "risk_axis2": { "type": "integer", "minimum": 1, "maximum": 3 }
}
```

ActionProposalCard renders previews with timeframe and cost labels.

## Settings Panel

"Improvement Evaluation" section in SettingsPanelBase:

- Risk Axis 1 dropdown (6 presets)
- Risk Axis 2 dropdown (6 presets)
- Improvement Budget input (optional €)

## Migration

- `IdeaEffort` type removed, `effort` field replaced by `timeframe`
- Existing saved projects with `effort` values lose that data (clean break, no migration)
- All i18n `effort.*` keys replaced with `timeframe.*`, `cost.*`, `risk.*`, `matrix.*`
- CoScout tool schema updated (effort → timeframe + cost)

## Related

- [ADR-035: Improvement Prioritization](../../07-decisions/adr-035-improvement-prioritization.md) — decision record
- [Improvement Prioritization Workflow](../../03-features/workflows/improvement-prioritization.md) — user-facing methodology
- [IMPROVE Phase UX Design](../../archive/specs/2026-03-19-improve-phase-ux-design.md) — workspace design (archived)
- [Investigation to Action](../../03-features/workflows/investigation-to-action.md) — full improvement methodology
