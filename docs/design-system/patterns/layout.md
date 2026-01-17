# Layout Patterns

Page and component layout patterns.

## PWA App Layout

### Without Data Panel

```
┌─────────────────────────────────────────┐
│ Header (h-14)                           │
├─────────────────────────────────────────┤
│ DrillBreadcrumb (when filters active)   │
├─────────────────────────────────────────┤
│                                         │
│ Main Content (flex-1)                   │
│                                         │
├─────────────────────────────────────────┤
│ Footer                                  │
└─────────────────────────────────────────┘
```

### With Data Panel (toggled via 📊 button)

```
┌─────────────────────────────────────────────────────────┐
│ Header (h-14)                                           │
├─────────────────────────────────────────────────────────┤
│ DrillBreadcrumb (when filters active)                   │
├─────────────────────────────────┬───────────────────────┤
│                                 │                       │
│ Main Content (flex-1)           ║ Data Panel            │
│                                 ║ (resizable width)     │
│                                 ║                       │
├─────────────────────────────────┴───────────────────────┤
│ Footer                                                  │
└─────────────────────────────────────────────────────────┘
```

```jsx
<div className="flex flex-col h-screen bg-slate-900">
  <AppHeader />
  <DrillBreadcrumb items={breadcrumbs} onNavigate={handleNav} />
  <div className="flex flex-1 overflow-hidden">
    <main className="flex-1 overflow-hidden">{content}</main>
    {showDataPanel && <DataPanel width={dataPanelWidth} onWidthChange={setDataPanelWidth} />}
  </div>
  <AppFooter />
</div>
```

See [Navigation Patterns](./navigation.md) for drill-down behavior.

## Dashboard Layout (Desktop)

### Charts Only

```
┌─────────────────────────────────────────┐
│ I-Chart (40%)                           │
│                                         │
├─────────────────────────────────────────┤
│ ═══════════ Resize Handle ═══════════   │
├────────────┬────────────┬───────────────┤
│ Boxplot    │ Pareto     │ Stats Panel   │
│            │            │               │
└────────────┴────────────┴───────────────┘
```

### With Data Panel

```
┌─────────────────────────────────────────┬─────────────────┐
│ I-Chart (40%)                           │ Data Table      │
│                                         │                 │
├─────────────────────────────────────────┤ [sticky header] │
│ ═══════════ Resize Handle ═══════════   │                 │
├────────────┬────────────┬───────────────┤ [scrollable     │
│ Boxplot    │ Pareto     │ Stats Panel   │  content]       │
│            │            │               │                 │
└────────────┴────────────┴───────────────┴─────────────────┘
                                          ↔ draggable divider
```

```jsx
<PanelGroup orientation="vertical">
  <Panel defaultSize={40} minSize={20}>
    <IChartCard />
  </Panel>
  <PanelResizeHandle />
  <Panel defaultSize={60} minSize={20}>
    <div className="flex gap-4">
      <BoxplotCard />
      <ParetoCard />
      <StatsPanel />
    </div>
  </Panel>
</PanelGroup>
```

**Data Panel** (`DataPanel.tsx`):

- Toggle visibility via 📊 button in header
- Draggable divider persists width to localStorage
- Bi-directional sync: click chart → highlight row, click row → highlight chart point

## Dashboard Layout (Mobile)

```
┌─────────────────┐
│ Header          │
├─────────────────┤
│                 │
│ Chart Carousel  │
│ ◀ I-Chart ▶     │
│                 │
├─────────────────┤
│ Stats Summary   │
├─────────────────┤
│ Data Panel      │
│ (bottom sheet)  │
│ ═══════════════ │ ← drag handle
└─────────────────┘
```

Mobile uses vertical scrolling with carousel-based chart selection.

**Data Panel (Bottom Sheet)**:

- Collapsed: Shows row count + "Swipe up"
- Partial: ~40% screen height
- Full: ~90% screen height
- Drag handle for resizing

## Grid Layouts

### 2-Column Grid

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <Card>Left</Card>
  <Card>Right</Card>
</div>
```

### 2×2 Grid (Regression)

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
  {charts.map(chart => (
    <div key={chart.id} className="min-h-[280px]">
      <ScatterPlot />
    </div>
  ))}
</div>
```

### Auto-fit Grid

```jsx
<div
  className="grid gap-4"
  style={{
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  }}
>
  {items.map(item => (
    <Card key={item.id} />
  ))}
</div>
```

## Flex Patterns

### Row with Space Between

```jsx
<div className="flex items-center justify-between">
  <span>Label</span>
  <span>Value</span>
</div>
```

### Centered Content

```jsx
<div className="flex items-center justify-center h-full">
  <EmptyState />
</div>
```

### Sticky Header with Scrollable Content

```jsx
<div className="flex flex-col h-full">
  <div className="flex-none px-4 py-3 border-b border-slate-700">Header</div>
  <div className="flex-1 overflow-y-auto p-4">Scrollable content</div>
</div>
```

## Chart Container Sizing

Charts need explicit height to render:

```jsx
// Fixed height
<div className="h-[400px]">
  <IChart />
</div>

// Flex sizing (parent must have height)
<div className="flex-1 min-h-0">
  <IChart />
</div>

// Grid cell
<div className="min-h-[280px]">
  <ScatterPlot />
</div>
```

## Responsive Breakpoints

| Breakpoint | Width    | Layout Changes             |
| ---------- | -------- | -------------------------- |
| Default    | < 640px  | Single column, mobile menu |
| sm         | ≥ 640px  | Desktop header buttons     |
| md         | ≥ 768px  | 2-column grids             |
| lg         | ≥ 1024px | Full 3-panel dashboard     |

## Excel Add-in Task Pane

```
┌─────────────────┐
│ Header          │
├─────────────────┤
│ Tab List        │
├─────────────────┤
│                 │
│ Tab Content     │
│ (scrollable)    │
│                 │
├─────────────────┤
│ Footer/Actions  │
└─────────────────┘
```

Width: Fixed at 350px (Office Add-in standard)

## Excel Content Add-in

```
┌─────────────────────────────────────┐
│ Stats Header                        │
├──────────────────┬──────────────────┤
│                  │                  │
│ I-Chart          │ Boxplot          │
│                  │                  │
└──────────────────┴──────────────────┘
```

Uses CSS Grid with `flex: 1` for chart containers.
