---
title: CSS Height Chain Pattern
audience: [developer]
category: reference
status: stable
related: [layout, flexbox, css-grid, dashboard]
---

# CSS Height Chain Pattern

How to make a container fill the viewport and distribute space to its children without any child expanding beyond its allocation.

## The Problem

CSS flex and grid children default to `min-height: auto`, meaning they expand to fit their content. When a chart uses `withParentSize` (ResizeObserver) to measure its container, this creates circular expansion:

1. Container has `min-height: auto` (content-based)
2. `withParentSize` measures container height
3. SVG renders at measured height
4. SVG content is large, pushing container larger
5. `withParentSize` re-measures → larger → re-renders → infinite growth

## The Pattern

Every container from root to chart must have a **definite height** and allow shrinking:

```tsx
{
  /* 1. Root: explicit viewport height */
}
<div className="h-dvh flex flex-col">
  {' '}
  {/* dvh adapts to mobile browser chrome */}
  {/* 2. Fixed elements: flex-shrink-0 */}
  <header className="h-14 flex-shrink-0" />
  {/* 3. Content area: flex-1 + overflow-hidden */}
  <main className="flex-1 overflow-hidden flex flex-col">
    {/* 4. Scrollable/constrained container: h-full */}
    <div className="h-full flex flex-col lg:overflow-hidden">
      {/* 5. Fixed nav: flex-shrink-0 */}
      <nav className="flex-shrink-0" />

      {/* 6. Flexible content: flex-1 min-h-0 */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* 7. Grid with definite height: h-full + grid rows */}
        <div className="lg:h-full lg:grid lg:grid-rows-[55fr_45fr]">
          {/* 8. Grid items: min-h-0 overflow-hidden */}
          <div className="min-h-0 overflow-hidden">
            {/* 9. Card: h-full flex-col */}
            <div className="h-full flex flex-col min-h-0">
              {/* 10. Chart area: absolute fill (defense-in-depth) */}
              <div className="flex-1 min-h-0 relative">
                <div className="absolute inset-0">
                  <ChartWithParentSize /> {/* Cannot influence parent size */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</div>;
```

## Rules

### 1. Root must have explicit height

```tsx
{/* Correct */}
<div className="h-screen flex flex-col">

{/* Wrong — height is auto, children unconstrained */}
<div className="flex flex-col">
```

### 2. Every flex child in the chain needs `flex-1 min-h-0`

```tsx
{/* Correct — min-h-0 allows shrinking below content size */}
<div className="flex-1 min-h-0">

{/* Wrong — min-height: auto prevents shrinking */}
<div className="flex-1">
```

`min-h-0` overrides the flex default `min-height: auto`. Without it, a flex child cannot be smaller than its content, defeating the height constraint.

### 3. Grid containers need explicit `h-full` for `fr` units

```tsx
{/* Correct — h-full gives grid a definite height for fr computation */}
<div className="h-full grid grid-rows-[55fr_45fr]">

{/* Wrong — grid has auto height, fr units have no base to divide */}
<div className="grid grid-rows-[55fr_45fr]">
```

CSS Grid `fr` units distribute **free space**. If the grid container's height is `auto`, there is no free space — rows expand to content size.

### 4. Grid items need `min-h-0 overflow-hidden`

```tsx
{/* Correct — item can shrink and clips overflow */}
<div className="min-h-0 overflow-hidden">

{/* Wrong — item's min-height: auto prevents shrinking below content */}
<div>
```

### 5. `withParentSize` charts must be inside a constrained parent

```tsx
{
  /* Correct — flex-1 min-h-0 gives definite height from flex algorithm */
}
<div className="flex-1 min-h-0">
  <IChart /> {/* withParentSize measures this div */}
</div>;

{
  /* Wrong — div has auto height, withParentSize measures content */
}
<div>
  <IChart /> {/* Circular expansion */}
</div>;
```

### 6. Fixed-height elements need `flex-shrink-0`

```tsx
{
  /* Correct — header won't be compressed by flex */
}
<header className="h-14 flex-shrink-0" />;

{
  /* Wrong — flex algorithm may shrink header to make room */
}
<header className="h-14" />;
```

## Diagnosing Height Chain Breaks

**Symptom**: Chart keeps growing, pushes siblings off-screen.

**Diagnosis steps**:

1. Open DevTools, inspect the chart's parent chain
2. For each container, check computed `height`:
   - If it shows a pixel value → definite (good)
   - If it shows `auto` or grows with content → **broken link**
3. Check `min-height`: if `auto` on a flex child → add `min-h-0`
4. Check `overflow`: if `visible` on a grid item → add `overflow-hidden`
5. Check the grid container's `height`: if `auto` → add `h-full`

**Quick test**: Add `outline: 2px solid red` to the grid container. If it grows beyond the viewport, the height chain is broken above it.

## Related

- [Dashboard Layout Architecture](../../05-technical/architecture/dashboard-layout.md) — full height chain for the VariScout dashboard
- [Chart Sizing Guide](../charts/chart-sizing-guide.md) — how `withParentSize` and responsive utilities work
