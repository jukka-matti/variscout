# VariScout Lite: Design System

## 1. Design Philosophy
**"Engineer's Dashboard"**: Dark, data-dense, but uncluttered. The design prioritizes legibility of charts and statistics over decorative elements.

## 2. Color Palette (Slate Dark Mode)

We utilize the Tailwind `slate` scale for maximum contrast without the harshness of pure black (`#000000`).

| Usage | Color Token | Hex Code |
| :--- | :--- | :--- |
| **Background** | `bg-slate-900` | `#0f172a` |
| **Surface/Card** | `bg-slate-800/50` | `#1e293b` (50% opacity) |
| **Borders** | `border-slate-700` | `#334155` |
| **Text (Primary)** | `text-slate-200` | `#e2e8f0` |
| **Text (Muted)** | `text-slate-400` | `#94a3b8` |
| **Accent (Primary)** | `text-blue-400` | `#60a5fa` |
| **Success** | `text-green-500` | `#22c55e` |
| **Danger/Alert** | `text-red-400` | `#f87171` |

## 3. Typography
-   **Font Family**: `Inter`, system-ui (Standard, clean sans-serif).
-   **Numbers**: `font-mono` is used for all tabular data, specs, and statistical results (Mean, UCL, Cpk) to ensure alignment.

## 4. Responsive Strategy
The application is **mobile-first**, optimized for factory floor tablets and phones (minimum 320px) while scaling up beautifully to desktop.

### 4.1 Breakpoints
| Breakpoint | Width | Use Case |
|------------|-------|----------|
| `xs` | 375px | Large phones (iPhone X+) |
| `sm` | 640px | Small tablets / phones landscape |
| `md` | 768px | Tablets portrait |
| `lg` | 1024px | Tablets landscape / small laptops |
| `xl` | 1280px | Desktops |

### 4.2 Layout Strategy
-   **Mobile (<640px)**: Tab-based chart navigation via `MobileDashboard`. Single chart visible at a time with swipe gestures. Stats as a fourth "tab".
-   **Tablet (640-1024px)**: Charts stack vertically with comfortable touch targets.
-   **Desktop (>1024px)**: Fixed 2-row layout. I-Chart on top (flex-1), Boxplot + Pareto + Stats on bottom row.

### 4.3 Responsive Charts
All charts use dynamic margins based on container width via `useResponsiveChartMargins` hook:

| Screen Width | Left Margin | Right Margin | Font Size |
|--------------|-------------|--------------|-----------|
| <400px | 35px | 15px | 9px |
| 400-768px | 56px | 42px | 10px |
| ≥768px | 70px | 60px | 11px |

Charts also scale:
- Tick counts based on available axis length
- Y-axis label positioning
- Legend and annotation sizes

### 4.4 Touch Interactions
-   **Minimum touch targets**: 44x44px (Apple HIG standard)
-   **Touch feedback**: Visual scale + highlight on `:active` state via `.touch-feedback` class
-   **Swipe navigation**: MobileDashboard supports left/right swipe between charts
-   **Safe areas**: Bottom sheet modals respect `env(safe-area-inset-bottom)` for notched phones

### 4.5 Mobile Components
| Component | Purpose |
|-----------|---------|
| `MobileDashboard` | Tab-based chart switching with swipe support |
| `MobileStatsPanel` | Full-screen stats view with Summary/Histogram/Prob Plot tabs |
| `MobileMenu` | Dropdown menu for overflow actions (triggered by ⋮ button) |

### 4.6 Modal Behavior
-   **Desktop**: Positioned popover near trigger element
-   **Mobile**: Bottom sheet style with drag handle, slides up from bottom with `animate-slide-up`

## 5. Components

### 5.1 Card Container
Every major section (Chart, Panel) is wrapped in a standard card container:
```jsx
<div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
  {/* Content */}
</div>
```

### 5.2 Stats Panel
Designed for "glanceability". Key metrics (Pass Rate, Cpk) are large and bolded. Secondary info (USL/LSL) is muted and pushed to the bottom.
