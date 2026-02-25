# Deployment Guide

This document covers build commands, deployment workflows, and environment configurations for VariScout applications.

---

## Distribution Channels

| Product   | Distribution      | Target               |
| --------- | ----------------- | -------------------- |
| Azure App | Azure Marketplace | Enterprise customers |
| PWA       | Public URL        | Training & education |
| Website   | Vercel            | Marketing            |

See [ADR-007: Azure Marketplace Distribution](../../07-decisions/adr-007-azure-marketplace-distribution.md) for the distribution strategy.

---

## Build Commands

### Development

```bash
# PWA development server (localhost:5173)
pnpm dev

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

| Variable                                   | Description                        | Required | Set By       |
| ------------------------------------------ | ---------------------------------- | -------- | ------------ |
| `VITE_LICENSE_TIER`                        | License tier (always `enterprise`) | Yes      | ARM template |
| `WEBSITE_RUN_FROM_PACKAGE`                 | Package deployment URL             | Yes      | ARM template |
| `MICROSOFT_PROVIDER_AUTHENTICATION_SECRET` | EasyAuth client secret             | Yes      | ARM template |

> **Note**: MSAL-era variables (`VITE_AZURE_CLIENT_ID`, `VITE_AZURE_TENANT_ID`, `VITE_AZURE_REDIRECT_URI`, `VITE_MAX_USERS`, `VITE_MAX_CHANNELS`) are no longer used. Authentication is handled by EasyAuth (App Service Authentication), not MSAL.

### PWA Environment Variables

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
  --template-uri https://raw.githubusercontent.com/variscout/azure-deploy/main/azuredeploy.json
```

See [ARM Template Documentation](../../08-products/azure/arm-template.md) for template details.

---

## Deployment Targets

### Azure App (App Service)

Deployed via ARM template to customer's Azure subscription:

```yaml
# App Service configuration (in ARM template)
resource:
  type: Microsoft.Web/sites # App Service, not Static Web Apps
  apiVersion: 2025-01-01
  name: variscout-{unique}
  kind: linux
  plan: B1 Basic (Linux, Node 22)
  deployment: WEBSITE_RUN_FROM_PACKAGE
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

See `apps/website/README.md` for the development guide.

### PWA (Internal Hosting)

For demos and development only:

```yaml
# Static hosting (internal)
{ 'buildCommand': 'pnpm build', 'outputDirectory': 'apps/pwa/dist' }
```

---

## Azure App Registration Requirements

### Required for Azure App

The customer creates an App Registration before deployment (the ARM template references it via `clientId` and `clientSecret` parameters):

| Permission        | Type      | Purpose               |
| ----------------- | --------- | --------------------- |
| `User.Read`       | Delegated | Get user profile      |
| `Files.ReadWrite` | Delegated | OneDrive project sync |

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

### Azure App Deployment (Per-Customer)

- [ ] Customer has Azure subscription
- [ ] ARM template deploys successfully
- [ ] EasyAuth authentication works

---

## Rollback Procedures

### Azure App Service

Rollback by changing the `WEBSITE_RUN_FROM_PACKAGE` URL to a previous release:

```bash
# Point to a previous release package
az webapp config appsettings set \
  --name variscout-xyz \
  --resource-group rg-variscout \
  --settings WEBSITE_RUN_FROM_PACKAGE="https://variscout.blob.core.windows.net/releases/variscout-azure-v1.2.0.zip"

# Restart to pick up the change
az webapp restart --name variscout-xyz --resource-group rg-variscout
```

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

### Partner Center Analytics

- Azure Marketplace: Sales, deployments, usage

---

## Next Steps

1. Complete Azure Marketplace Partner Center setup
2. Submit Azure App offer for certification
3. Configure production telemetry

---

## See Also

- [Azure Marketplace Guide](../../08-products/azure/marketplace.md)
- [ARM Template](../../08-products/azure/arm-template.md)
- [ADR-007: Distribution Strategy](../../07-decisions/adr-007-azure-marketplace-distribution.md)
