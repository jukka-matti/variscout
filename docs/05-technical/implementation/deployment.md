# Deployment Guide

This document covers build commands, deployment workflows, and environment configurations for VariScout applications.

---

## Distribution Channels

| Product      | Distribution      | Target               |
| ------------ | ----------------- | -------------------- |
| Azure App    | Azure Marketplace | Enterprise customers |
| Excel Add-in | AppSource (FREE)  | Excel users          |
| PWA          | Internal only     | Demos & development  |
| Website      | Vercel            | Marketing            |

See [ADR-007: Azure Marketplace Distribution](../../07-decisions/adr-007-azure-marketplace-distribution.md) for the distribution strategy.

---

## Build Commands

### Development

```bash
# PWA development server (localhost:5173)
pnpm dev

# Excel Add-in development server (localhost:3000)
pnpm dev:excel

# Azure app development server
pnpm --filter @variscout/azure-app dev

# Marketing website development server
pnpm --filter @variscout/website dev
```

### Production Builds

```bash
# Build all packages and apps
pnpm build

# Build specific packages
pnpm --filter @variscout/core build
pnpm --filter @variscout/charts build
pnpm --filter @variscout/azure-app build
pnpm --filter @variscout/excel-addin build
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test -- --coverage

# Package-specific tests
pnpm --filter @variscout/core test
pnpm --filter @variscout/pwa test
pnpm --filter @variscout/azure-app test
```

---

## Environment Configuration

### Azure App Environment Variables

| Variable                  | Description                | Required | Set By       |
| ------------------------- | -------------------------- | -------- | ------------ |
| `VITE_AZURE_CLIENT_ID`    | MSAL application client ID | Yes      | ARM template |
| `VITE_AZURE_TENANT_ID`    | Azure AD tenant ID         | Yes      | ARM template |
| `VITE_AZURE_REDIRECT_URI` | OAuth redirect URI         | Yes      | ARM template |
| `VITE_LICENSE_TIER`       | License tier               | Yes      | ARM template |
| `VITE_MAX_CHANNELS`       | Channel limit              | Yes      | ARM template |

> **Note**: `VITE_MAX_USERS` is no longer used. The single Managed Application plan provides unlimited users.

### Excel Add-in Environment Variables

| Variable            | Description           | Default   |
| ------------------- | --------------------- | --------- |
| `VITE_ADDIN_ID`     | Office Add-in ID      | Dev ID    |
| `VITE_MANIFEST_URL` | Manifest XML location | localhost |

> **Note**: `VITE_AZURE_CLIENT_ID` was previously used for Graph API license detection but is no longer needed. The Excel Add-in is always free with no license detection.

### PWA Environment Variables (Demo Only)

| Variable           | Description             | Default      |
| ------------------ | ----------------------- | ------------ |
| `VITE_APP_VERSION` | App version for display | package.json |

> **Note**: The `VITE_LICENSE_API_URL` and `VITE_EDITION` variables are deprecated and no longer used.

---

## Azure Marketplace Publication

### Overview

The Azure App is published to Azure Marketplace as a **Managed Application**:

```
Azure Marketplace
└── VariScout (Managed Application)
    └── Full Plan (€150/month, all features, unlimited users)
```

### Publication Process

1. **Partner Center Setup**
   - Register at [Partner Center](https://partner.microsoft.com/)
   - Complete publisher profile
   - Enable Azure Marketplace program

2. **Create Azure Application Offer**
   - Offer type: Managed Application
   - Single plan at €150/month
   - Upload deployment package (.zip with mainTemplate.json + createUiDefinition.json)
   - Publisher management: Disabled (zero access)
   - Customer access: Enabled (full control)

3. **Configure Pricing**
   - Set monthly price (€150/month)
   - Configure regional pricing (EUR, USD, GBP)
   - Microsoft handles VAT and billing (3% fee)

4. **Submit for Certification**
   - Microsoft reviews listing content
   - Automated ARM template validation
   - Security assessment
   - Timeline: 5-10 business days

See [Azure Marketplace Guide](../../08-products/azure/marketplace.md) for detailed instructions.

### ARM Template Deployment

Customers deploy via ARM template:

```bash
az deployment group create \
  --resource-group rg-variscout \
  --template-uri https://raw.githubusercontent.com/variscout/azure-deploy/main/azuredeploy.json \
  --parameters tier=team
```

See [ARM Template Documentation](../../08-products/azure/arm-template.md) for template details.

---

## AppSource Publication (Excel Add-in)

### Overview

The Excel Add-in is published FREE on Microsoft AppSource:

```
AppSource
└── VariScout - SPC Charts for Excel
    ├── Free Tier: Basic features
    └── Full Tier: Unlocks with Azure deployment
```

### Publication Process

1. **Partner Center Setup**
   - Same account as Azure Marketplace
   - Enable Office Store program

2. **Prepare Submission**
   - Validate manifest.xml
   - Prepare screenshots (1280x720 min)
   - Write listing content

3. **Microsoft 365 Certification**
   - Security review
   - Functionality testing
   - Accessibility audit
   - Timeline: 2-4 weeks

4. **Listing Configuration**
   - Price: FREE
   - Categories: Productivity > Data Analysis
   - Supported products: Excel (all platforms)

See [AppSource Guide](../../08-products/excel/appsource.md) for detailed instructions.

---

## Deployment Targets

### Azure App (Azure Static Web Apps)

Deployed via ARM template to customer's Azure subscription:

```yaml
# Azure Static Web Apps configuration (in ARM template)
resource:
  type: Microsoft.Web/staticSites
  apiVersion: 2022-09-01
  name: variscout-{unique}
  sku: Standard
```

### Excel Add-in (Azure Static Web Apps)

Hosted centrally, deployed via AppSource:

```yaml
# Hosting configuration
host: https://excel.variscout.com
├── taskpane.html
├── content.html
├── assets/
└── manifest.xml
```

### Marketing Website (Vercel)

Static Astro 5 site deployed to Vercel:

| Setting               | Value                                    |
| --------------------- | ---------------------------------------- |
| Framework             | Astro 5 (static output)                  |
| Build command         | `pnpm --filter @variscout/website build` |
| Output directory      | `apps/website/dist`                      |
| Deploy trigger        | Push to `main` branch                    |
| Environment variables | None required                            |
| Pages generated       | 379 (5 languages × dynamic routes)       |

The website is fully static — no server-side code, no database, no runtime environment variables. Workspace packages (`@variscout/core`, `@variscout/charts`, `@variscout/data`) are resolved at build time for chart demos.

See [Website README](../../../apps/website/README.md) for development guide.

### PWA (Internal Hosting)

For demos and development only:

```yaml
# Static hosting (internal)
{ 'buildCommand': 'pnpm build', 'outputDirectory': 'apps/pwa/dist' }
```

---

## Azure App Registration Requirements

### Required for Azure App

The ARM template creates an App Registration with:

| Permission        | Type      | Purpose               |
| ----------------- | --------- | --------------------- |
| `User.Read`       | Delegated | Get user profile      |
| `Files.ReadWrite` | Delegated | OneDrive project sync |

### Required for Excel Add-in

The Excel Add-in App Registration needs:

| Permission             | Type      | Admin Consent | Purpose                         |
| ---------------------- | --------- | ------------- | ------------------------------- |
| `Application.Read.All` | Delegated | Yes           | License detection via Graph API |

---

## Pre-Deployment Checklist

### Before Any Deployment

- [ ] All tests passing (`pnpm test`)
- [ ] Build completes without errors (`pnpm build`)
- [ ] No TypeScript errors (`pnpm tsc`)
- [ ] Version numbers updated if releasing
- [ ] Security scan (`npx claude-flow@v3alpha security scan`)

### Azure Marketplace Submission

- [ ] ARM template validates (`az deployment group validate`)
- [ ] Partner Center account verified
- [ ] Privacy policy URL accessible
- [ ] Terms of service URL accessible
- [ ] All screenshots meet requirements
- [ ] Pricing configured for all regions

### AppSource Submission

- [ ] Manifest.xml validates
- [ ] HTTPS hosting configured
- [ ] Graph API permissions documented
- [ ] Screenshots prepared (1280x720 min)
- [ ] Accessibility requirements met (WCAG AA)

### Azure App Deployment (Per-Customer)

- [ ] Customer has Azure subscription
- [ ] Customer selects pricing tier
- [ ] ARM template deploys successfully
- [ ] Admin consent granted for Graph API
- [ ] MSAL authentication works

---

## Rollback Procedures

### Azure Static Web Apps

Azure maintains deployment history:

```bash
# List deployments
az staticwebapp deployment list --name variscout-xyz

# Rollback to previous deployment
az staticwebapp deployment revert --name variscout-xyz --deployment-id {id}
```

### AppSource Updates

AppSource updates are atomic - previous versions remain available until new version is certified.

### ARM Template Updates

For template updates:

1. Update template in repository
2. Submit new version to Partner Center
3. Existing deployments unaffected
4. New deployments use new template

---

## Monitoring

### Azure App (Customer-Owned)

Customers can add Application Insights:

```json
// Optional in ARM template
{
  "type": "Microsoft.Insights/components",
  "apiVersion": "2020-02-02",
  "name": "variscout-insights",
  "properties": {
    "Application_Type": "web"
  }
}
```

### Excel Add-in

Central telemetry via Application Insights:

- Feature usage (anonymous)
- Error rates
- Performance metrics

### Partner Center Analytics

- Azure Marketplace: Sales, deployments, usage
- AppSource: Installs, active users

---

## Next Steps

1. Complete Azure Marketplace Partner Center setup
2. Submit Azure App offer for certification
3. Complete AppSource Partner Center setup
4. Submit Excel Add-in for certification
5. Configure production telemetry

---

## See Also

- [Azure Marketplace Guide](../../08-products/azure/marketplace.md)
- [ARM Template](../../08-products/azure/arm-template.md)
- [AppSource Guide](../../08-products/excel/appsource.md)
- [ADR-007: Distribution Strategy](../../07-decisions/adr-007-azure-marketplace-distribution.md)
