# Products

VariScout is available across multiple platforms, each optimized for different use cases.

---

## Product Matrix

| Product                          | Platform         | Status     | Primary Use Case          |
| -------------------------------- | ---------------- | ---------- | ------------------------- |
| [PWA](pwa/index.md)              | Web Browser      | Production | Individual practitioners  |
| [Excel Add-in](excel/index.md)   | Microsoft Excel  | Production | Excel-native workflows    |
| [Azure Team App](azure/index.md) | Microsoft Teams  | Beta       | Team collaboration        |
| [Power BI](powerbi/index.md)     | Power BI Service | Planned    | Dashboard integration     |
| [Website](website/index.md)      | Web              | Production | Marketing & documentation |

---

## Feature Comparison

| Feature          | PWA | Excel       | Azure     | Power BI         |
| ---------------- | --- | ----------- | --------- | ---------------- |
| I-Chart          | ✓   | ✓           | ✓         | Planned          |
| Boxplot          | ✓   | ✓           | ✓         | Planned          |
| Pareto           | ✓   | ✓           | ✓         | Planned          |
| Capability       | ✓   | ✓           | ✓         | Planned          |
| Regression       | ✓   | ✓           | ✓         | -                |
| Gage R&R         | ✓   | ✓           | ✓         | -                |
| Performance Mode | ✓   | ✓           | ✓         | -                |
| Drill-Down       | ✓   | Via slicers | ✓         | Native           |
| Linked Filtering | ✓   | Via slicers | ✓         | Native           |
| Offline          | ✓   | ✓           | Cached    | -                |
| Cloud Sync       | -   | OneDrive    | OneDrive  | Power BI Service |
| SSO              | -   | Microsoft   | Microsoft | Microsoft        |

---

## Editions (PWA)

| Edition       | Branding       | Theming                                | Price    |
| ------------- | -------------- | -------------------------------------- | -------- |
| **Community** | VariScout logo | Dark only                              | Free     |
| **Licensed**  | No branding    | Light/Dark/System + Accents (PWA only) | €99/year |

---

## Architecture

All products share the same core packages:

```
@variscout/core     → Statistics, parsing, types
@variscout/charts   → Visx chart components
@variscout/hooks    → Shared React hooks
@variscout/ui       → UI utilities
```

This ensures:

- Identical statistical calculations across platforms
- Consistent chart appearance
- Shared methodology (Four Pillars)

---

## Deployment Models

| Product  | Deployment                      | Data Location               |
| -------- | ------------------------------- | --------------------------- |
| PWA      | Static hosting (Vercel)         | Browser (IndexedDB)         |
| Excel    | AppSource or sideload           | Excel workbook              |
| Azure    | ARM template to customer tenant | Customer's Azure + OneDrive |
| Power BI | AppSource                       | Power BI Service            |

---

## Support Model

| Tier       | Included In      | Support Channel               |
| ---------- | ---------------- | ----------------------------- |
| Community  | Free editions    | GitHub Issues                 |
| Standard   | Licensed PWA     | Email (48h response)          |
| Enterprise | Azure deployment | Email + deployment assistance |
