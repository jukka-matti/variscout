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
| **Scatter/Regression**       |     ✓     |     ✓      |    -     |
| **Violin Mode**              |     ✓     |     ✓      |    -     |
| **Boxplot category sorting** |     ✓     |     ✓      |    -     |
| **Performance Mode**         |     ✓     |     -      |    -     |

> PWA includes core SPC plus Green Belt tools for training. Performance Mode requires the Azure App.

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
| R², Adjusted R²       |   ✓   |  ✓  | Regression          |
| VIF                   |   ✓   |  ✓  | Multicollinearity   |
| Nelson Rule 2         |   ✓   |  ✓  | 9-point run         |

---

## Navigation & Interaction

| Feature                           | Azure App | PWA (Free) | Notes                                                       |
| --------------------------------- | :-------: | :--------: | ----------------------------------------------------------- |
| **Drill-down**                    |     ✓     |     ✓      |                                                             |
| **Linked filtering**              |     ✓     |     ✓      |                                                             |
| **Breadcrumb navigation**         |     ✓     |     ✓      |                                                             |
| **Multi-select filters**          |     ✓     |     ✓      |                                                             |
| **Investigation Mindmap**         |     ✓     |     ✓      |                                                             |
| **What-If Simulator**             |     ✓     |     ✓      |                                                             |
| **Keyboard navigation**           |     ✓     |     ✓      |                                                             |
| **Copy chart to clipboard**       |     ✓     |     ✓      | Includes filter context bar when active                     |
| **Filter context on charts**      |     ✓     |     ✓      | Shows active filters inside chart cards; toggle in Settings |
| **Editable chart titles**         |     ✓     |     ✓      |                                                             |
| **Selection panel**               |     ✓     |     ✓      | Minitab-style point brushing                                |
| **Create Factor**                 |     ✓     |     ✓      | From point selection                                        |
| **Focus mode (fullscreen chart)** |     ✓     |     ✓      |                                                             |
| **Median in Stats Panel**         |     ✓     |     ✓      | Always shown alongside Mean                                 |
| **Inline spec inputs (Stats)**    |     ✓     |     ✓      | `onSaveSpecs` prop; Target-first progressive disclosure     |
| **Chart annotations**             |     ✓     |     ✓      | Right-click context menu: highlight colors + text notes     |

---

## Data Handling

| Feature                           | Azure App | PWA (Free) | Notes                                              |
| --------------------------------- | :-------: | :--------: | -------------------------------------------------- |
| **CSV upload**                    |     ✓     |     -      | Azure App only                                     |
| **Excel upload**                  |     ✓     |     -      | Azure App only                                     |
| **Paste data**                    |     ✓     |     ✓      |                                                    |
| **Sample datasets**               |     ✓     |     ✓      | PWA pre-loaded with cases                          |
| **Column mapping**                |     ✓     |     ✓      |                                                    |
| **Spec entry at column mapping**  |     -     |     ✓      | PWA ColumnMapping only; Azure sets specs post-load |
| **Manual entry**                  |     ✓     |     ✓      |                                                    |
| **Data validation**               |     ✓     |     ✓      |                                                    |
| **Row limit**                     |  100,000  |   50,000   | Configurable via `DataIngestionConfig`             |
| **Max factors**                   |     6     |     3      | Configurable via `maxFactors` prop                 |
| **Factor management in analysis** |     ✓     |     -      | Azure: FactorManagerPopover in Dashboard           |

---

## Persistence & Storage

| Feature                | Azure App | PWA (Free) | Notes                    |
| ---------------------- | :-------: | :--------: | ------------------------ |
| **Local storage**      | IndexedDB |     -      | PWA is session-only      |
| **Cloud sync**         | OneDrive  |     -      |                          |
| **Offline support**    |  Cached   |     ✓      | Azure caches for offline |
| **Analysis save/load** |     ✓     |     -      | PWA is session-only      |
| **Export CSV**         |     ✓     |     ✓      |                          |
| **Export JSON**        |     ✓     |     -      | Azure App only           |
| **Screenshot export**  |     ✓     |     ✓      |                          |

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

| Aspect           | Azure App         | PWA (Free)                                           |
| ---------------- | ----------------- | ---------------------------------------------------- |
| **Distribution** | Azure Marketplace | Direct URL                                           |
| **Pricing**      | €150/month        | FREE (forever)                                       |
| **Features**     | All (full)        | Core SPC + Green Belt (no Performance Mode, no save) |
| **Auth**         | EasyAuth / Entra  | None                                                 |

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
