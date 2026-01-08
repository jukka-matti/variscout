# Case Study Pages Specification

## Overview

Interactive case study pages that embed the VaRiScout PWA with pre-loaded sample data. Each case combines:

- Problem context and learning objectives
- Embedded interactive app (iframe)
- Guided prompts for hands-on exploration

These pages are the primary conversion tool - visitors explore cases and then try VaRiScout with their own data.

## URL Structure

```
/cases/                   - Case study hub (lists all cases)
/cases/bottleneck         - Week 1: Process step analysis
/cases/hospital-ward      - Week 5: Aggregation trap
/cases/coffee             - Week 9: Drying bed comparison
/cases/packaging          - Week 9: Defect analysis
/cases/avocado            - Week 12: Regression analysis
```

## Embed URL Format

```
https://app.variscout.com?sample=bottleneck&embed=true
```

**Parameters:**

- `sample=<urlKey>` - Auto-loads the specified sample dataset
- `embed=true` - Hides header/footer for clean iframe display

**Available sample keys:**

| URL Key         | Case Name         | Focus                            | Week |
| --------------- | ----------------- | -------------------------------- | ---- |
| `bottleneck`    | The Bottleneck    | Process step variation, Boxplot  | 1    |
| `hospital-ward` | Hospital Ward     | Aggregation trap, Time patterns  | 5    |
| `coffee`        | Coffee Moisture   | Drying bed comparison, Specs     | 9    |
| `packaging`     | Packaging Defects | Product line analysis, Pareto    | 9    |
| `avocado`       | Avocado Coating   | Regression, coating optimization | 12   |

## Three-Act Page Structure

Each case study page follows a three-act structure:

### Act 1: The Problem

- Problem statement card with context
- Learning objectives
- Sets up the mystery

### Act 2: Your Turn (Interactive)

- Embedded PWA with sample data
- Prompts to explore
- Interactive discovery

### Act 3: The Solution

- Guided solution steps
- Key insight reveal
- CTA to try with own data

## Page Layout

### Desktop (>768px)

```
┌─────────────────────────────────────────────────────────────────┐
│                        Page Header                              │
├─────────────────────────────────────────────────────────────────┤
│  Act 1: The Problem                                             │
│  - Phase & Week badge                                           │
│  - Title & Subtitle                                             │
│  - Problem Statement Card                                       │
│  - Learning Objectives                                          │
├─────────────────────────────────────────────────────────────────┤
│  Act 2: Your Turn                                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │              Embedded PWA (full width)                    │  │
│  │              iframe: src="?sample=xxx&embed=true"         │  │
│  │              min-height: 650px                            │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│  "Your Turn: Explore the Data - Click the charts to filter"    │
├─────────────────────────────────────────────────────────────────┤
│  Act 3: The Solution Journey                                    │
│  - Numbered step cards                                          │
│  - Interactive step highlighted                                 │
│  - Key insight card (dark background)                           │
├─────────────────────────────────────────────────────────────────┤
│  CTA Section                                                    │
│  - "What's hiding in YOUR data?"                                │
│  - [Try Free] [Next Case →]                                     │
├─────────────────────────────────────────────────────────────────┤
│                        Footer                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile (<768px)

Same sections, stacked vertically with full-width components.

## Page Components

### 1. Problem Statement Card

```html
<div class="problem-card">
  <h2 class="section-label">The Problem</h2>
  <p class="lead">Which step is actually the bottleneck?</p>
  <p class="context">
    A manufacturing process had 5 sequential steps. Whenever delays occurred, Step 3 was blamed. The
    manager wanted to invest in new equipment for Step 3. But nobody had actually looked at the
    data...
  </p>
</div>
```

### 2. Learning Objectives

```html
<div class="objectives">
  <h3>What You'll Learn</h3>
  <ul>
    <li>Use I-Chart to see variation over time</li>
    <li>Compare process steps with Boxplot</li>
    <li>Identify the step with the most variation</li>
  </ul>
</div>
```

### 3. Embedded App (iframe)

```html
<div class="app-embed">
  <iframe
    src="https://app.variscout.com?sample=bottleneck&embed=true"
    title="VaRiScout Interactive Analysis"
    width="100%"
    height="650"
    frameborder="0"
    allow="clipboard-write"
  ></iframe>
</div>
```

### 4. Guided Steps

```html
<div class="guided-steps">
  <div class="step">
    <span class="step-number">1</span>
    <div class="step-content">
      <h4>Look at the Boxplot</h4>
      <p>
        Notice how the boxes have different sizes. A wider box means more variation. Which step has
        the widest spread?
      </p>
    </div>
  </div>

  <div class="step interactive">
    <span class="step-number">3</span>
    <div class="step-content">
      <h4>Click on Step 2</h4>
      <p>
        Click the Step 2 box in the Boxplot. Watch how the I-Chart updates to show only Step 2's
        data. Now you can see the time pattern.
      </p>
      <span class="try-badge">↑ Try this in the interactive demo above</span>
    </div>
  </div>
</div>
```

### 5. Key Insight Card

```html
<div class="insight-card">
  <span class="section-label">The Key Insight</span>
  <p class="insight-text">What's hiding in YOUR process?</p>
</div>
```

### 6. CTA Section

```html
<div class="cta-section">
  <h2>What's hiding in YOUR data?</h2>
  <p>Try VaRiScout with your own data. Free, no signup required.</p>
  <div class="cta-buttons">
    <a href="/app" class="btn-primary">Try Free</a>
    <a href="/cases/hospital-ward" class="btn-secondary">Next Case →</a>
  </div>
</div>
```

## Case Data Reference

| Case          | sampleKey       | outcome         | factors                          | specs                        |
| ------------- | --------------- | --------------- | -------------------------------- | ---------------------------- |
| Bottleneck    | `bottleneck`    | Cycle_Time_sec  | Step, Shift                      | target: 40                   |
| Hospital Ward | `hospital-ward` | Utilization_pct | Time_Period, Day_of_Week         | target: 75, usl: 90          |
| Coffee        | `coffee`        | Moisture_pct    | Drying_Bed                       | lsl: 10, usl: 12, target: 11 |
| Packaging     | `packaging`     | Defect_Count    | Product, Defect_Type             | target: 50, usl: 100         |
| Avocado       | `avocado`       | Shelf_Life_Days | Coating_ml_kg, Process, Material | lsl: 10, target: 15          |

## Styling Guidelines

### Colors (from design system)

```css
--bg-page: #ffffff; /* white for light theme */
--bg-card: #f8fafc; /* slate-50 */
--bg-dark: #0f172a; /* slate-900 for insight card */
--text-primary: #0f172a; /* slate-900 */
--text-secondary: #64748b; /* slate-500 */
--brand-primary: #3b82f6; /* blue-500 */
--success: #22c55e; /* green-500 */
```

### Interactive Steps

Highlight "try it" steps with a distinct border:

```css
.step.interactive {
  border-left: 3px solid var(--brand-primary);
  background: rgba(59, 130, 246, 0.05);
}
```

## SEO Metadata

```html
<title>The Bottleneck - VaRiScout Case Study</title>
<meta
  name="description"
  content="A process with 5 steps. Step 3 was blamed.
      But what did the data show? Interactive case study with VaRiScout."
/>
<meta property="og:image" content="/images/case-bottleneck-preview.png" />
```

## Implementation Notes

1. **iframe Security**: Same-origin policy allows clipboard-write
2. **Responsive iframe**: Use CSS aspect-ratio or min-height
3. **Loading State**: Show spinner while iframe loads
4. **Error Handling**: Graceful fallback if app fails to load
5. **i18n**: Case pages available in all 5 languages (en, de, es, fr, pt)

## File Structure (Astro)

```
apps/website/src/pages/[lang]/cases/
├── index.astro           # Case hub (lists all cases by phase)
└── [slug].astro          # Individual case page (5 slugs)
```

## Cross-Links

| From                 | Links To                                |
| -------------------- | --------------------------------------- |
| /cases/bottleneck    | /cases/hospital-ward (next), /app (CTA) |
| /cases/hospital-ward | /cases/coffee (next), /app (CTA)        |
| /cases/coffee        | /cases/packaging (next), /app (CTA)     |
| /cases/packaging     | /cases/avocado (next), /app (CTA)       |
| /cases/avocado       | /cases (hub), /app (CTA)                |
