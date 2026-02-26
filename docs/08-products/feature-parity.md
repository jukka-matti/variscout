# Feature Parity Matrix

Complete feature availability across VariScout platforms.

---

## Platform Overview

| Platform      | Primary Use                | Status      | Distribution      |
| ------------- | -------------------------- | ----------- | ----------------- |
| **Azure App** | Production (full features) | **PRIMARY** | Azure Marketplace |
| **PWA**       | Training & education       | Production  | Direct URL (FREE) |

> Per [ADR-007](../07-decisions/adr-007-azure-marketplace-distribution.md), Azure App is the only paid product (€150/month as Managed Application). PWA is free forever.

---

## Core Analysis Features

| Feature                      | Azure App | PWA (Free) | Power BI |
| ---------------------------- | :-------: | :--------: | :------: |
| **I-Chart**                  |     ✓     |     ✓      | Planned  |
| **Boxplot**                  |     ✓     |     ✓      | Planned  |
| **Pareto**                   |     ✓     |     ✓      | Planned  |
| **Capability Histogram**     |     ✓     |     ✓      | Planned  |
| **Probability Plot**         |     ✓     |     ✓      |    -     |
| **Violin Mode**              |     ✓     |     ✓      |    -     |
| **Boxplot category sorting** |     ✓     |     ✓      |    -     |
| **Performance Mode**         |     ✓     |     -      |    -     |

> PWA includes core analysis charts plus Green Belt tools for training. Performance Mode requires the Azure App.

---

## Statistical Calculations

All platforms share `@variscout/core` and produce **identical results** for the features they support.

| Calculation           | Azure | PWA | Formula Reference   |
| --------------------- | :---: | :-: | ------------------- |
| Mean, Median, Std Dev |   ✓   |  ✓  | Standard            |
| UCL/LCL (3σ)          |   ✓   |  ✓  | x̄ ± 3σ              |
| Cp, Cpk               |   ✓   |  ✓  | (USL-LSL)/6σ        |
| η² (Eta-squared)      |   ✓   |  ✓  | SS_between/SS_total |
| F-statistic, p-value  |   ✓   |  ✓  | ANOVA               |
| Nelson Rule 2         |   ✓   |  ✓  | 9-point run         |

---

## Navigation & Interaction

| Feature                           | Azure App | PWA (Free) | Notes                                                                                                         |
| --------------------------------- | :-------: | :--------: | ------------------------------------------------------------------------------------------------------------- |
| **Drill-down**                    |     ✓     |     ✓      |                                                                                                               |
| **Linked filtering**              |     ✓     |     ✓      |                                                                                                               |
| **Breadcrumb navigation**         |     ✓     |     ✓      |                                                                                                               |
| **Multi-select filters**          |     ✓     |     ✓      |                                                                                                               |
| **Investigation Mindmap**         |     ✓     |     ✓      | Azure adds: SVG export, annotation persistence                                                                |
| **What-If Simulator**             |     ✓     |     ✓      |                                                                                                               |
| **Keyboard navigation**           |     ✓     |     ✓      |                                                                                                               |
| **Copy chart to clipboard**       |     ✓     |     ✓      | Includes filter context bar when active                                                                       |
| **Filter context on charts**      |     ✓     |     ✓      | Shows active filters inside chart cards; toggle in Settings                                                   |
| **Editable chart titles**         |     ✓     |     ✓      |                                                                                                               |
| **Selection panel**               |     ✓     |     ✓      | Minitab-style point brushing                                                                                  |
| **Create Factor**                 |     ✓     |     ✓      | From point selection                                                                                          |
| **Focus mode (fullscreen chart)** |     ✓     |     ✓      |                                                                                                               |
| **Presentation Mode**             |     ✓     |     -      | Full-screen grid overview + focused chart view                                                                |
| **Median in Stats Panel**         |     ✓     |     ✓      | Always shown alongside Mean                                                                                   |
| **Inline spec inputs (Stats)**    |     ✓     |     ✓      | `onSaveSpecs` prop; Target-first progressive disclosure                                                       |
| **Chart annotations**             |     ✓     |     ✓      | Boxplot/Pareto: right-click context menu (highlight + note); I-Chart: right-click to place free-floating note |

---

## Data Handling

| Feature                           | Azure App | PWA (Free) | Notes                                                         |
| --------------------------------- | :-------: | :--------: | ------------------------------------------------------------- |
| **CSV upload**                    |     ✓     |     -      | Azure App only                                                |
| **Excel upload**                  |     ✓     |     -      | Azure App only                                                |
| **Paste data**                    |     ✓     |     ✓      |                                                               |
| **Sample datasets**               |     ✓     |     ✓      | PWA pre-loaded with cases                                     |
| **Column mapping**                |     ✓     |     ✓      | Data-rich cards with type badges, sample values, data preview |
| **Spec entry at column mapping**  |     ✓     |     ✓      | Collapsible SpecsSection in ColumnMapping                     |
| **Column data preview**           |     ✓     |     ✓      | Collapsible mini-table showing first 5 rows                   |
| **Column renaming at setup**      |     ✓     |     ✓      | Pencil icon on column cards → `columnAliases`                 |
| **Inline data editing**           |     ✓     |     ✓      | Edit cells, add/delete rows, batch apply                      |
| **Add data during analysis**      |     ✓     |     -      | Paste/upload/manual append with auto-detection                |
| **Manual entry**                  |     ✓     |     ✓      |                                                               |
| **Data validation**               |     ✓     |     ✓      |                                                               |
| **Row limit**                     |  100,000  |   50,000   | Configurable via `DataIngestionConfig`                        |
| **Max factors**                   |     6     |     3      | Configurable via `maxFactors` prop                            |
| **Factor management in analysis** |     ✓     |     ✓      | Both: ColumnMapping re-edit via "Factors" button in nav bar   |

---

## Persistence & Storage

| Feature                | Azure App | PWA (Free) | Notes                                                |
| ---------------------- | :-------: | :--------: | ---------------------------------------------------- |
| **Local storage**      | IndexedDB |     -      | PWA is session-only                                  |
| **Cloud sync**         | OneDrive  |     -      |                                                      |
| **Offline support**    |  Cached   |     ✓      | Azure caches for offline                             |
| **Analysis save/load** |     ✓     |     -      | PWA is session-only                                  |
| **Export CSV**         |     ✓     |     ✓      |                                                      |
| **Export JSON**        |     ✓     |     -      | Azure App only                                       |
| **Screenshot export**  |     ✓     |     ✓      |                                                      |
| **Sync notifications** |     ✓     |     -      | Toast feedback for sync status, errors, auth prompts |

---

## Authentication & Security

| Feature                     | Azure App | PWA (Free) | Notes             |
| --------------------------- | :-------: | :--------: | ----------------- |
| **Microsoft SSO**           |     ✓     |     -      |                   |
| **Azure AD / Entra ID**     |     ✓     |     -      |                   |
| **Data in customer tenant** |     ✓     |    N/A     | PWA is local only |
| **No data transmission**    |     ✓     |     ✓      | All client-side   |

---

## Theming & Customization

| Feature                  | Azure App | PWA (Free) | Notes                                                                            |
| ------------------------ | :-------: | :--------: | -------------------------------------------------------------------------------- |
| **Dark/Light theme**     |     ✓     |     ✓      |                                                                                  |
| **System theme follow**  |     ✓     |     ✓      |                                                                                  |
| **Company accent color** |     ✓     |     -      | Azure App only                                                                   |
| **Chart font scale**     |     ✓     |     ✓      | Compact / Normal / Large presets in both apps                                    |
| **Settings panel**       |     ✓     |     ✓      | PWA: display toggles + chart text size; Azure: full (theme, accent, all toggles) |
| **Branding removal**     |     ✓     |     -      | Azure App only                                                                   |

---

## Learning & Help

| Feature                  | Azure App | PWA (Demo) | Notes           |
| ------------------------ | :-------: | :--------: | --------------- |
| **Help tooltips**        |     ✓     |     ✓      |                 |
| **Glossary integration** |     ✓     |     ✓      |                 |
| **"Learn more" links**   |     ✓     |     ✓      | Link to website |
| **Sample case studies**  |     ✓     |     ✓      | PWA pre-loaded  |

---

## Licensing & Pricing

| Aspect           | Azure App         | PWA (Free)                                                |
| ---------------- | ----------------- | --------------------------------------------------------- |
| **Distribution** | Azure Marketplace | Direct URL                                                |
| **Pricing**      | €150/month        | FREE (forever)                                            |
| **Features**     | All (full)        | Core analysis + Green Belt (no Performance Mode, no save) |
| **Auth**         | EasyAuth / Entra  | None                                                      |

---

## Platform-Specific Features

### Azure App Only

- Performance Mode (multi-channel Cpk analysis)
- File upload (CSV/Excel)
- Save/persistence (OneDrive sync)
- OneDrive analysis sync
- Team collaboration
- EasyAuth authentication flow
- Company accent color / branding removal
- ARM template deployment (Managed Application)
- Factor management during analysis (add/remove factors without restarting)
- Add data during analysis (paste/upload append with row/column auto-detection)
- Presentation mode (full-screen chart overview with focused navigation)
- Sync notifications (toast feedback for cloud operations)

### PWA Only

- Free forever (training & education)
- Pre-loaded case study datasets
- Service Worker offline caching

---

## Planned Features (Roadmap)

| Feature          | Target Platform | Status  |
| ---------------- | --------------- | ------- |
| Power BI visuals | Power BI        | Planned |

---

## See Also

- [Products Overview](index.md)
- [Azure App](azure/index.md)
- [PWA (Free Training Tool)](pwa/index.md)
- [ADR-007: Distribution Strategy](../07-decisions/adr-007-azure-marketplace-distribution.md)
