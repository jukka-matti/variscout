---
title: Display Density — Global UI Scaling
audience: [developer, designer]
category: architecture
status: draft
related: [accessibility, typography, settings, density]
---

# Display Density — Global UI Scaling

## Problem

The current "Chart Text Size" setting (compact/normal/large) only scales chart fonts via a `data-chart-scale` attribute. All UI text — stats panels, data tables, filter chips, tooltips, navigation — uses hardcoded Tailwind classes unaffected by this setting. Users with reduced vision or those presenting on projectors need consistent scaling across the entire UI.

**User feedback:** "bigger fonts... my current setting is just chart text size but it should be everything"

## Decision

Replace the chart-only text scale with a holistic **display density** system that scales all text, spacing, and padding through 4 named presets applied via the root font-size (`<html>`). Everything using `rem` units scales automatically.

## Presets

| Preset | Root font-size | Scale factor | Line height | Use case                                  |
| ------ | -------------- | ------------ | ----------- | ----------------------------------------- |
| **S**  | 14px           | 0.875×       | 1.35        | Data-dense views, large monitors          |
| **M**  | 16px           | 1.0×         | 1.5         | Default — balanced readability            |
| **L**  | 18px           | 1.125×       | 1.5         | Comfortable reading                       |
| **XL** | 21px           | 1.3125×      | 1.6         | Reduced vision, presentations, projectors |

## What Scales

**Automatically via rem cascade:**

- All Tailwind text utilities (`text-sm`, `text-base`, `text-lg`, etc.)
- All Tailwind spacing utilities (`p-4`, `gap-2`, `m-3`, etc.)
- Chart fonts (wired through `getScaledFonts()`)

**Via CSS custom property (non-linear):**

- `--density-line-height` — per-preset values from the table above

**Fixed (does not scale):**

- Chart geometry (dot radii, line widths, box widths) — already container-responsive
- Layout positioning (sidebar widths, toolbar heights) — structural
- Export dimensions — fixed presentation-ready sizes
- Mobile-specific breakpoints — mobile responsiveness is independent

## Mechanism

### Root font-size scaling

Set `document.documentElement.style.fontSize` to the preset's px value. All `rem`-based CSS (Tailwind defaults) scales proportionally. This composes correctly with browser zoom (WCAG 1.4.4).

### CSS custom properties on `:root`

```css
:root {
  --density-line-height: 1.5; /* overridden per preset */
  --density-min-target: 44px; /* touch target floor */
}
```

### State management

`useThemeState` stores `density: DensityPreset` in localStorage (key: `variscout_theme`). On mount and change:

1. Sets `document.documentElement.style.fontSize` to the root px value
2. Sets `--density-line-height` CSS custom property on `:root`

No backward compatibility migration. Old `chartFontScale` is simply removed. If a user had a stored preference, it resets to M on next load.

## Types

```typescript
export type DensityPreset = 'S' | 'M' | 'L' | 'XL';

export const DENSITY_CONFIG: Record<
  DensityPreset,
  {
    rootFontSize: number; // px
    scale: number; // multiplier
    lineHeight: number;
  }
> = {
  S: { rootFontSize: 14, scale: 0.875, lineHeight: 1.35 },
  M: { rootFontSize: 16, scale: 1.0, lineHeight: 1.5 },
  L: { rootFontSize: 18, scale: 1.125, lineHeight: 1.5 },
  XL: { rootFontSize: 21, scale: 1.3125, lineHeight: 1.6 },
};
```

### Removed types

- `ChartFontScale` type
- `CHART_FONT_SCALES` map
- `chartFontScale` from theme state
- `data-chart-scale` attribute on `<html>`
- `fontScale` return value from `useChartTheme`

## Settings UI

**Label:** "Display density"

**Control:** Four segmented buttons — `S` `M` `L` `XL` — in the same position where "Chart Text Size" currently lives in `SettingsPanelBase`.

**Props change:**

- `chartFontScale` + `onChartFontScaleChange` → `density` + `onDensityChange`
- Both app SettingsPanel wrappers update accordingly

## Migration: Hardcoded px → rem

### Scope

~193 `text-[Npx]` instances across ~50 component files in `packages/ui/src/`. These bypass the rem cascade and must be converted.

### Conversion table

| Current       | Replacement        | Notes                                       |
| ------------- | ------------------ | ------------------------------------------- |
| `text-[8px]`  | `text-[0.5rem]`    | Minimal text                                |
| `text-[9px]`  | `text-[0.5625rem]` | Small secondary                             |
| `text-[10px]` | `text-[0.625rem]`  | ~120 instances — caps, badges, small labels |
| `text-[11px]` | `text-[0.6875rem]` | ~30 instances — captions                    |
| `text-[12px]` | `text-xs`          | Tailwind native (0.75rem)                   |
| `text-[13px]` | `text-[0.8125rem]` | Between xs and sm                           |

**Strategy:** Bulk find-and-replace per size tier. Two replacements (`text-[10px]` and `text-[11px]`) cover ~78% of instances.

### Chart font wiring

- `getScaledFonts(width, scale)` in `responsive.ts` remains a pure function (no DOM access). The `scale` parameter is still passed in by callers.
- `useChartTheme` drops `fontScale` property. `getDocumentFontScale()` reads `document.documentElement.style.fontSize` and derives scale as `parsedSize / 16`.
- `useChartLayout` calls `getScaledFonts(width, scale)` with the scale from the new `getDocumentFontScale()`
- `ChartLegend.tsx` hardcoded `11` replaced with `fonts.tickLabel`
- `getDocumentFontScale()` in `useChartTheme.ts` reads root font-size instead of `data-chart-scale`
- `MutationObserver` in `useChartTheme` watches for `style` attribute changes (covers font-size) instead of `data-chart-scale`

## Affected Files

### Core changes (small, high-impact)

- `packages/hooks/src/useThemeState.ts` — new `DensityPreset` type, `DENSITY_CONFIG`, root font-size application
- `packages/charts/src/useChartTheme.ts` — remove `fontScale`, read root font-size
- `packages/charts/src/hooks/useChartLayout.ts` — derive scale from root font-size
- `packages/core/src/responsive.ts` — no changes needed (`getScaledFonts` stays pure)
- `packages/ui/src/components/SettingsPanel/SettingsPanelBase.tsx` — new density picker UI
- `apps/pwa/src/components/settings/SettingsPanel.tsx` — wire `density` prop
- `apps/azure/src/components/settings/SettingsPanel.tsx` — wire `density` prop

### Chart fix (1 file)

- `packages/charts/src/ChartLegend.tsx` — remove hardcoded `11`

### Bulk px→rem migration (~50 files)

- `packages/ui/src/components/**/*.tsx` — `text-[Npx]` → `text-[Nrem]`

## Out of Scope

- Per-area granular controls (one preset controls everything)
- Free slider (named presets only)
- Backward compatibility migration for old `chartFontScale`
- Chart geometry changes (dot radii, line widths)
- Layout structural changes (sidebar widths, toolbar heights)
- Export dimension changes
- Mobile-specific density overrides

## Verification

1. **Visual check all 4 presets in PWA and Azure** — stats panel, data table, filter chips, tooltips, chart text, navigation all scale proportionally
2. **Run `pnpm test`** — all existing tests pass (no visual assertions affected)
3. **Check edge cases:**
   - S preset: verify no text is unreadably small (especially 8px-equivalent elements)
   - XL preset: verify no layout overflow or text clipping
   - Browser zoom at 150% + XL preset: verify content remains usable (WCAG 1.4.4)
4. **Chart export at all presets** — exports should produce identical output (fixed sizes)
5. **Mobile (PWA)** — verify density applies and doesn't conflict with responsive breakpoints
6. **Settings persistence** — change density, reload, verify it persists
7. **Fresh install** — no old `chartFontScale` in localStorage, defaults to M
