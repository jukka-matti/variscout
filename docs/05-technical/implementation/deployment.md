---
title: 'Deployment Guide'
---

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

### AI Resources (all plans)

| Variable             | Description                   | Required  | Set By       |
| -------------------- | ----------------------------- | --------- | ------------ |
| `AI_ENDPOINT`        | Azure AI Foundry endpoint URL | All plans | ARM template |
| `AI_SEARCH_ENDPOINT` | Azure AI Search endpoint URL  | Team only | ARM template |
| `AI_SEARCH_INDEX`    | Search index name             | Team only | ARM template |
| `FUNCTION_URL`       | Function App URL              | All plans | ARM template |

> **Note**: These variables are NOT prefixed with `VITE_` because they are served at runtime via the `/config` endpoint (see `apps/azure/src/lib/runtimeConfig.ts`), not baked into the Vite build.

#### Knowledge Base Setup

The Knowledge Base uses a Remote SharePoint knowledge source (ADR-026). Setup steps:

1. Create a Remote SharePoint knowledge source in the Azure AI Search service (requires at least 1 M365 Copilot license in tenant). See [Microsoft documentation](https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-how-to-sharepoint-remote).
2. In the app, navigate to **Admin > Knowledge Base** (`AdminKnowledgeSetup`) to verify connectivity and toggle the preview feature on/off
3. Click **Test Search Connectivity** to verify the knowledge source is accessible

#### Azure Functions

| Function         | Purpose                                              | Plan |
| ---------------- | ---------------------------------------------------- | ---- |
| `token-exchange` | OBO token exchange for Teams SSO + SharePoint access | Team |

Both functions are deployed via the CI/CD pipeline when `AZURE_FUNCTION_APP_NAME` is configured as a GitHub Actions variable. The pipeline uses `azure/functions-action@v2` to deploy the `infra/functions/` directory.

### PWA Environment Variables

| Variable           | Description             | Default      |
| ------------------ | ----------------------- | ------------ |
| `VITE_APP_VERSION` | App version for display | package.json |

> **Note**: The `VITE_LICENSE_API_URL` and `VITE_EDITION` variables are deprecated and no longer used.

---

## Infrastructure as Code

### Bicep Modules

Infrastructure is defined in Bicep (`infra/main.bicep`) with modular resource definitions:

| Module                      | Resources                                       |
| --------------------------- | ----------------------------------------------- |
| `modules/app-service.bicep` | App Service Plan + Web App + EasyAuth           |
| `modules/ai-services.bicep` | Azure AI Foundry (OpenAI) + model deployments   |
| `modules/key-vault.bicep`   | Key Vault + RBAC authorization                  |
| `modules/search.bicep`      | Azure AI Search (Team plan only)                |
| `modules/functions.bicep`   | Function App for OBO token exchange (Team plan) |

The compiled `mainTemplate.json` is auto-generated for Azure Marketplace packaging:

```bash
az bicep build --file main.bicep --outfile mainTemplate.json
```

> **Do not edit `mainTemplate.json` directly** — always edit the `.bicep` source files and recompile.

### Infrastructure vs App Deployment

- **CI/CD deploys app code only** — the staging pipeline builds the Vite app and deploys to App Service
- **Infrastructure deployment is manual** — customers deploy via Azure Marketplace (which uses the compiled ARM template) or via CLI (`az deployment group create -f main.bicep`)
- Infrastructure changes require recompiling `mainTemplate.json` and resubmitting the Marketplace package

See [ADR-040: Bicep Migration](../../07-decisions/adr-040-bicep-migration.md) for the migration decision.

---

## Azure Marketplace Publication

### Overview

The Azure App is published to Azure Marketplace as a **Managed Application**:

```
Azure Marketplace
└── VariScout (Managed Application)
    ├── Standard Plan (€79/month, full analysis, local files)
    └── Team Plan (€199/month, + Teams, OneDrive, SharePoint, Knowledge Base)
```

### Publication Process

1. **Partner Center Setup**
   - Register at [Partner Center](https://partner.microsoft.com/)
   - Complete publisher profile
   - Enable Azure Marketplace program

2. **Create Azure Application Offer**
   - Offer type: Managed Application
   - Two plans: Standard (€79/month) and Team (€199/month)
   - Upload deployment package (.zip with mainTemplate.json + createUiDefinition.json)
   - Publisher management: Disabled (zero access)
   - Customer access: Enabled (full control)

3. **Configure Pricing**
   - Set monthly prices (Standard €79, Team €199)
   - Configure regional pricing (EUR, USD, GBP)
   - Microsoft handles VAT and billing (3% fee)

4. **Submit for Certification**
   - Microsoft reviews listing content
   - Automated ARM template validation (compiled from Bicep)
   - Security assessment
   - Timeline: 5-10 business days

See [Azure Marketplace Guide](../../08-products/azure/marketplace.md) for detailed instructions.

### Infrastructure Deployment

Customers deploy via Azure Marketplace (which uses the compiled ARM template) or directly via Bicep:

```bash
az deployment group create \
  --resource-group rg-variscout \
  --template-file main.bicep \
  --parameters appName=variscout clientId=<id> clientSecret=<secret> variscoutPlan=standard
```

The Marketplace deployment package contains the compiled `mainTemplate.json` (auto-generated from `main.bicep`) and `createUiDefinition.json`. See [ARM Template Documentation](../../08-products/azure/arm-template.md) for template details.

---

## Deployment Targets

### Azure App — Staging (CI/CD)

The staging environment deploys automatically on push to `main` via GitHub Actions with OIDC authentication (no long-lived secrets).

**URL**: `https://variscout-staging.azurewebsites.net`

**Architecture**: The Vite build output (`apps/azure/dist/`) is served by a zero-dependency Node.js static server (`apps/azure/server.js`) running on App Service Linux (Node 22). The server provides:

- SPA fallback routing (all non-file paths → `index.html`)
- Cache headers (hashed `/assets/*` get 1-year immutable, rest `no-cache`)
- Security headers on every response: CSP, HSTS (1 year, includeSubDomains), X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- Dynamic `connect-src` in CSP: includes `graph.microsoft.com` and OBO function URL (from `FUNCTION_URL` env var)
- Health endpoint (`GET /health` → 200)
- SIGTERM graceful shutdown (closes server, exits cleanly)
- Listens on `process.env.PORT` (set by App Service)

EasyAuth intercepts `/.auth/*` at the platform level before the Node server — no conflict.

**Pipeline** (`.github/workflows/deploy-azure-staging.yml`):

1. pnpm install + build Azure app
2. `pnpm audit --audit-level=high` — fail on high/critical vulnerabilities
3. Generate CycloneDX SBOM (`sbom.json`) and upload as build artifact
4. Assemble zip: `dist/` + `server.js` + minimal `package.json`
5. OIDC login → `azure/webapps-deploy@v3`
6. Health check (`GET /health`) — verifies deployment stability
7. (Conditional, separate job) Deploy OBO token-exchange Azure Function — runs only when `AZURE_FUNCTION_APP_NAME` variable is set; deploys `infra/functions/` via `azure/functions-action@v2`

### Supply Chain Security

- **Dependabot** (`.github/dependabot.yml`): weekly updates for both npm and GitHub Actions ecosystems
- **SHA-pinned actions**: all 6 GitHub Actions use commit SHA (not version tags) to prevent supply chain attacks via tag mutation
- **SBOM**: CycloneDX JSON generated per build, uploaded as artifact for audit trail

**GitHub secrets** (3, all OIDC — no credentials stored):

- `AZURE_CLIENT_ID` — Service principal for CI/CD deployment
- `AZURE_TENANT_ID` — AAD tenant
- `AZURE_SUBSCRIPTION_ID` — Target subscription

**Azure resources** (in `rg-variscout-staging`):

- App Service Plan (B1 Linux)
- App Service (`variscout-staging`) with EasyAuth (AAD)
- App Registration ("VariScout Staging") with `User.Read` + `Files.ReadWrite` permissions (Files.ReadWrite only needed for Team plan)
- Separate App Registration ("VariScout CI/CD") with federated credential for GitHub Actions OIDC

**One-time setup**: See [Azure Staging Setup](#azure-staging-setup) below.

### Azure App — Marketplace (Production)

Deployed via Bicep/ARM template to customer's Azure subscription:

```yaml
# App Service configuration (defined in Bicep, compiled to ARM template)
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

Security headers (CSP, Permissions-Policy, X-Content-Type-Options) configured in `apps/website/vercel.json`. Vulnerability disclosure via `/.well-known/security.txt`.

See `apps/website/README.md` for the development guide.

### PWA (Internal Hosting)

For demos and development only:

```yaml
# Static hosting (internal)
{ 'buildCommand': 'pnpm build', 'outputDirectory': 'apps/pwa/dist' }
```

Security headers (CSP, Permissions-Policy) configured in `apps/pwa/vercel.json`. Service worker (`sw.js`) served with `no-cache` to ensure prompt updates.

---

## Azure App Registration Requirements

### Required for Azure App

The customer creates an App Registration before deployment (the ARM template references it via `clientId` and `clientSecret` parameters):

| Permission        | Type      | Purpose               | Plan      |
| ----------------- | --------- | --------------------- | --------- |
| `User.Read`       | Delegated | Get user profile      | All       |
| `Files.ReadWrite` | Delegated | OneDrive project sync | Team only |

> **Note**: Standard plan deployments only require `User.Read`. The `Files.ReadWrite` permission is needed only for Team plan OneDrive sync. Standard plan stores data locally in IndexedDB.

---

## Pre-Deployment Checklist

### Before Any Deployment

- [ ] All tests passing (`pnpm test`)
- [ ] Build completes without errors (`pnpm build`)
- [ ] No TypeScript errors (`pnpm tsc`)
- [ ] Version numbers updated if releasing
- [ ] Security scan (`npx ruflo@latest security scan`)

### Azure Marketplace Submission

- [ ] Bicep compiles (`az bicep build --file main.bicep --outfile mainTemplate.json`)
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

### Infrastructure Template Updates

For Bicep/ARM template updates:

1. Edit `.bicep` source files in `infra/`
2. Recompile: `az bicep build --file main.bicep --outfile mainTemplate.json`
3. Submit new version to Partner Center
4. Existing deployments unaffected
5. New deployments use new template

---

## Monitoring

### Azure App (Customer-Owned)

Customers can add Application Insights:

```json
// Optional — can be added to Bicep modules
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

## Azure Staging Setup

One-time setup commands for the rdmaic staging environment. Run these with `az cli` authenticated to the Perus-RDMAIC subscription.

### 1. Create App Registration (EasyAuth — user login)

```bash
az ad app create --display-name "VariScout Staging" --sign-in-audience AzureADMyOrg
# → note appId as CLIENT_ID

az ad app update --id $CLIENT_ID \
  --web-redirect-uris "https://variscout-staging.azurewebsites.net/.auth/login/aad/callback"

# Graph API permissions: User.Read (all plans) + Files.ReadWrite (Team plan OneDrive sync)
az ad app permission add --id $CLIENT_ID \
  --api 00000003-0000-0000-c000-000000000000 \
  --api-permissions "e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope" \
                    "5c28c081-612b-4536-8c00-47d2f7f0de0a=Scope"
# Note: Files.ReadWrite is only used by Team plan. Standard plan stores data locally in IndexedDB.

az ad app credential reset --id $CLIENT_ID --display-name "EasyAuth-Staging" --years 2
# → note password as CLIENT_SECRET (shown once)
```

### 2. Create Service Principal (GitHub Actions OIDC — CI/CD)

```bash
az ad app create --display-name "VariScout CI/CD"
# → note appId as CICD_CLIENT_ID

az ad sp create --id $CICD_CLIENT_ID

az role assignment create \
  --role "Website Contributor" \
  --assignee $CICD_CLIENT_ID \
  --scope /subscriptions/f6766ade-aab2-4f13-845a-30eda447e379/resourceGroups/rg-variscout-staging

az ad app federated-credential create --id $CICD_CLIENT_ID \
  --parameters '{
    "name": "github-actions-main",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:jukka-matti/variscout:ref:refs/heads/main",
    "audiences": ["api://AzureADTokenExchange"]
  }'
```

### 3. Deploy infrastructure

```bash
az group create --name rg-variscout-staging --location northeurope

az deployment group create \
  --resource-group rg-variscout-staging \
  --template-file infra/main.bicep \
  --parameters \
    appName=variscout-staging \
    clientId=$CLIENT_ID \
    clientSecret=$CLIENT_SECRET \
    packageUrl="1"
```

### 4. Configure App Service

```bash
# Startup command (Node 14+ does not auto-start with PM2)
az webapp config set \
  --name variscout-staging \
  --resource-group rg-variscout-staging \
  --startup-file "node server.js"

# Health check
az webapp config set \
  --name variscout-staging \
  --resource-group rg-variscout-staging \
  --generic-configurations '{"healthCheckPath": "/health"}'
```

### 5. Configure GitHub secrets

```bash
gh secret set AZURE_CLIENT_ID --repo jukka-matti/variscout --body "$CICD_CLIENT_ID"
gh secret set AZURE_TENANT_ID --repo jukka-matti/variscout --body "<tenant-id>"
gh secret set AZURE_SUBSCRIPTION_ID --repo jukka-matti/variscout --body "f6766ade-aab2-4f13-845a-30eda447e379"
```

### 6. First deploy

Trigger via `workflow_dispatch` or push a change to `main`.

### Verification

- `https://variscout-staging.azurewebsites.net` → AAD login redirect
- `https://variscout-staging.azurewebsites.net/health` → 200
- Deep URL refresh → SPA serves `index.html` (not 404)

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
- [ADR-040: Bicep Migration](../../07-decisions/adr-040-bicep-migration.md)
