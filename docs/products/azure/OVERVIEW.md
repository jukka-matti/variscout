# VaRiScout Azure Deployment — Overview

VaRiScout Azure allows organizations to deploy VaRiScout to their own Azure tenant with **team collaboration via SharePoint/OneDrive**.

```
PRODUCT SUMMARY
─────────────────────────────────────────────────────────────────

What it is:     Self-hosted VaRiScout with team collaboration
Storage:        SharePoint / OneDrive (team file sharing)
Auth:           Azure AD (SSO with existing accounts)
Users:          Unlimited
Branding:       Custom logo, colors, domain
Price:          €1799/year per tenant + ~€10-20/month Azure hosting
Distribution:   Azure Marketplace
```

---

## Why Azure Deployment?

| PWA Individual (€49/year)     | Azure Deployment (€1799/year per tenant) |
| ----------------------------- | ---------------------------------------- |
| Storage: Browser only         | Storage: SharePoint/OneDrive             |
| Sharing: Export .vrs manually | Sharing: Click "Share with team"         |
| Auth: License key             | Auth: Azure AD (SSO)                     |
| Users: 1 person               | Users: Unlimited                         |
| Best for: Individual analysts | Best for: Teams & organizations          |

---

## Analysis Features

All PWA analysis features included:

- I-Chart with Staged Analysis
- Boxplot with ANOVA
- Pareto Chart
- Capability Analysis (Cp/Cpk)
- Performance Mode (multi-measure analysis)

### Azure-Specific Features

- **Data Panel** - Interactive table with bi-directional chart sync (click chart → highlight row, click row → highlight chart point)
- **What-If Simulator** - Explore process improvement scenarios through mean adjustment and variation reduction
- **Append Mode** - Add new data incrementally via Manual Entry without replacing existing data
- **OneDrive Sync** - Automatic project sync across team members

---

## User Flows

- [Project Management](../../flows/azure/PROJECT-MANAGEMENT.md) - Project browser, cloud sync, team sharing
- [Core Analysis Journey](../../flows/CORE-ANALYSIS-JOURNEY.md) - Dashboard, drill-down, focus mode
- [Performance Mode](../../flows/PERFORMANCE-MODE.md) - Multi-measure analysis

## Related Documentation

- [Data Panel](./DATA-PANEL.md) - Interactive data table with chart sync
- [OneDrive Sync](./ONEDRIVE-SYNC.md) - File storage and sharing
- [SharePoint](./SHAREPOINT.md) - Team collaboration
- [MSAL Auth](./MSAL-AUTH.md) - Azure AD authentication
- [Deployment](./DEPLOYMENT.md) - Azure resource setup
