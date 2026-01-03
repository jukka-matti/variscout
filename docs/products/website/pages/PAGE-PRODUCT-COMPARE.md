# Page Specification: Product - Compare

## Overview

| Property       | Value                             |
| -------------- | --------------------------------- |
| URL            | `/product/compare`                |
| Template       | Comparison page                   |
| Content Source | `content/COPY-PRODUCT-COMPARE.md` |
| Priority       | High                              |

---

## Wireframe

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER                                                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  BREADCRUMB: Home > Product > Compare                              │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                    HERO                                             │
│                                                                     │
│         Which VaRiScout is right for you?                          │
│                                                                     │
│         Same analysis engine. Different ways to access it.         │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                    QUICK SELECTOR                                   │
│                                                                     │
│  I want to...                                                      │
│                                                                     │
│  ○ Try it right now              → Web App                         │
│  ○ Analyze in Excel              → Excel Add-in                    │
│  ○ Add to Power BI dashboards    → Power BI                        │
│  ○ Deploy for my organization    → Azure                           │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                    COMPARISON TABLE                                 │
│                                                                     │
│  ┌───────────────────┬────────┬────────┬──────────┬────────┐       │
│  │                   │ Web    │ Excel  │ Power BI │ Azure  │       │
│  ├───────────────────┼────────┼────────┼──────────┼────────┤       │
│  │ Try instantly     │   ✓    │   –    │    –     │   –    │       │
│  │ No install        │   ✓    │   –    │    –     │   ✓*   │       │
│  │ Works offline     │   ✓    │   ✓    │    –     │   ✓    │       │
│  │ Excel native      │   –    │   ✓    │    –     │   –    │       │
│  │ Dashboard embed   │   –    │   –    │    ✓     │   –    │       │
│  │ Auto refresh      │   –    │   –    │    ✓     │   –    │       │
│  │ Custom domain     │   –    │   –    │    –     │   ✓    │       │
│  │ Custom branding   │   –    │   –    │    –     │   ✓    │       │
│  │ MS certified      │  N/A   │   ✓    │    ✓     │   ✓    │       │
│  │ Data stays local  │   ✓    │   ✓    │    ✓     │   ✓    │       │
│  ├───────────────────┼────────┼────────┼──────────┼────────┤       │
│  │ Free tier         │   ✓    │   ✓    │    –     │   –    │       │
│  │ Individual €49    │   ✓    │   ✓    │    –     │   –    │       │
│  │ Team €399         │   –    │   –    │    ✓     │   –    │       │
│  │ Dept/Azure €999   │   –    │   –    │    ✓     │   ✓    │       │
│  │ Enterprise €1,999 │   –    │   –    │    ✓     │   –    │       │
│  └───────────────────┴────────┴────────┴──────────┴────────┘       │
│                                                                     │
│  * For end users. IT deploys once.                                 │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                    BEST FOR                                         │
│                                                                     │
│  ┌─────────────────┐ ┌─────────────────┐                           │
│  │ Web App         │ │ Excel           │                           │
│  │                 │ │                 │                           │
│  │ Best for:       │ │ Best for:       │                           │
│  │ • Individuals   │ │ • Excel users   │                           │
│  │ • Training      │ │ • Data in Excel │                           │
│  │ • Quick analysis│ │ • Share workbook│                           │
│  │                 │ │                 │                           │
│  │ [Try Web App]   │ │ [Get Excel]     │                           │
│  └─────────────────┘ └─────────────────┘                           │
│                                                                     │
│  ┌─────────────────┐ ┌─────────────────┐                           │
│  │ Power BI        │ │ Azure           │                           │
│  │                 │ │                 │                           │
│  │ Best for:       │ │ Best for:       │                           │
│  │ • BI teams      │ │ • Regulated ind.│                           │
│  │ • Dashboards    │ │ • Data sovereign│                           │
│  │ • Auto refresh  │ │ • Custom brand  │                           │
│  │                 │ │                 │                           │
│  │ [View Power BI] │ │ [Learn Azure]   │                           │
│  └─────────────────┘ └─────────────────┘                           │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                    DECISION HELPER (interactive)                    │
│                                                                     │
│  How will you access VaRiScout?                                    │
│  ○ Browser  ○ Excel  ○ Power BI  ○ Internal URL                   │
│                                                                     │
│  How many people?                                                  │
│  ○ Just me  ○ 2-10  ○ 10-50  ○ 50+                                │
│                                                                     │
│  → Based on your answers: Power BI Department (€999)               │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                    FINAL CTA                                        │
│                                                                     │
│  Still not sure?                                                   │
│  Try the Web App free — no signup required.                        │
│                                                                     │
│  [Open VaRiScout]    [Contact Us]                                  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                    FOOTER                                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Section Components

### Quick Selector

| Property  | Value                                   |
| --------- | --------------------------------------- |
| Component | `QuickSelector`                         |
| Behavior  | Radio buttons, selection highlights row |
| Action    | Click shows recommendation + CTA        |

### Comparison Table

| Property  | Value                        |
| --------- | ---------------------------- |
| Component | `ComparisonTable`            |
| Mobile    | Horizontal scroll or tabs    |
| Sticky    | First column (feature names) |
| Highlight | Check marks in green         |

### Best For Cards

| Property  | Value                            |
| --------- | -------------------------------- |
| Component | `ProductCards`                   |
| Layout    | 2x2 grid                         |
| Content   | Product name, best for list, CTA |

### Decision Helper

| Property  | Value                  |
| --------- | ---------------------- |
| Component | `ProductQuiz`          |
| Questions | 2-3 multiple choice    |
| Result    | Dynamic recommendation |
| Style     | Interactive, inline    |

---

## SEO

| Element  | Content                                               |
| -------- | ----------------------------------------------------- |
| Title    | Compare VaRiScout Products \| Which Is Right for You? |
| H1       | Which VaRiScout is right for you?                     |
| Keywords | VaRiScout comparison, SPC software comparison         |

---

## Analytics Events

| Event            | Trigger                            |
| ---------------- | ---------------------------------- |
| `compare_view`   | Page load                          |
| `quick_select`   | Quick selector option clicked      |
| `table_interact` | Table sorted or scrolled           |
| `quiz_complete`  | Decision helper completed          |
| `product_click`  | Product CTA clicked (with product) |
