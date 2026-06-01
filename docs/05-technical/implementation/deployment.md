---
tier: living
purpose: system
title: 'Deployment Guide'
audience: human
category: implementation
status: active
layer: L4
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

#### Knowledge Catalyst Setup (Phase 2+)

> **V1 note:** Knowledge Catalyst is not active in V1. SharePoint/Remote SharePoint knowledge source (ADR-026) is deferred per ADR-059. The setup steps below apply to the Phase 2+ Azure AI Search integration.

1. Configure an Azure AI Search index in the Azure AI Search service provisioned by the ARM template.
2. In the app, navigate to **Admin > Knowledge Catalyst** (`AdminKnowledgeSetup`) to verify connectivity and toggle the preview feature on/off.
3. Click **Test Search Connectivity** to verify the search index is accessible.

#### Azure Functions

> **V1 note:** The `token-exchange` function (OBO token exchange for Teams SSO + SharePoint access) is retired per ADR-059. It is no longer required.

Functions are deployed via the CI/CD pipeline when `AZURE_FUNCTION_APP_NAME` is configured as a GitHub Actions variable. The pipeline uses `azure/functions-action@v2` to deploy the `infra/functions/` directory.

### PWA Environment Variables

| Variable           | Description             | Default      |
| ------------------ | ----------------------- | ------------ |
| `VITE_APP_VERSION` | App version for display | package.json |

> **Note**: The `VITE_LICENSE_API_URL` and `VITE_EDITION` variables are deprecated and no longer used.

---

## Infrastructure as Code

### Bicep Modules

Infrastructure is defined in Bicep (`infra/main.bicep`) with modular resource definitions:

| Module                      | Resources                                      |
| --------------------------- | ---------------------------------------------- |
| `modules/app-service.bicep` | App Service Plan + Web App + EasyAuth          |
| `modules/ai-services.bicep` | Azure AI Foundry (OpenAI) + model deployments  |
| `modules/key-vault.bicep`   | Key Vault + RBAC authorization                 |
| `modules/search.bicep`      | Azure AI Search (Azure App, Phase 2+ optional) |
| `modules/functions.bicep`   | [Removed per ADR-059 — OBO flow retired]       |

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
    └── VariScout (€120/month per tenant, single SKU — full analysis + CoScout AI + Blob Storage + project membership)
```

### Publication Process

1. **Partner Center Setup**
   - Register at [Partner Center](https://partner.microsoft.com/)
   - Complete publisher profile
   - Enable Azure Marketplace program

2. **Create Azure Application Offer**
   - Offer type: Managed Application
   - Single plan: VariScout (€120/month per tenant)
   - Upload deployment package (.zip with mainTemplate.json + createUiDefinition.json)
   - Publisher management: Disabled (zero access)
   - Customer access: Enabled (full control)

3. **Configure Pricing**
   - Set monthly price: €120/month per tenant
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
  --parameters appName=variscout clientId=<id> clientSecret=<secret>
```

The Marketplace deployment package contains the compiled `mainTemplate.json` (auto-generated from `main.bicep`) and `createUiDefinition.json`. See [ARM Template Documentation](../../08-products/azure/arm-template.md) for template details.

---

## Deployment Targets

### Azure App — Staging (CI/CD)

The staging environment is deployed via GitHub Actions with OIDC authentication (no long-lived secrets). **Auto-deploy on push is currently disabled** during active development — use manual trigger when ready to deploy.

**URL**: `https://variscout-staging.azurewebsites.net`

**Architecture**: The Vite build output (`apps/azure/dist/`) is served by an Express server (`apps/azure/server.js`) running on App Service Linux (Node 22). The server provides:

- SPA fallback routing (all non-file paths → `index.html`)
- Cache headers (hashed `/assets/*` get 1-year immutable, rest `no-cache`)
- Security headers on every response: CSP, HSTS (1 year, includeSubDomains), X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- Dynamic `connect-src` in CSP: includes AI endpoint and AI Search endpoint
- Runtime config endpoint (`GET /config`): serves plan, AI endpoints, App Insights connection string
- Same-origin storage APIs: authorized Blob Storage list/load/save for the Azure App, enforced on the server and backed by App Service managed identity
- KB endpoints (`POST /api/kb-upload`, `POST /api/kb-search`, `GET /api/kb-list`, `DELETE /api/kb-delete`, `GET /api/kb-download`): Knowledge Catalyst management (Azure App, Phase 2+, ADR-060)
- Health endpoint (`GET /health` → 200)
- SIGTERM graceful shutdown (closes server, exits cleanly)
- Listens on `process.env.PORT` (set by App Service)

EasyAuth intercepts `/.auth/*` at the platform level before the Express server — no conflict.

**Production storage boundary after R6e:** Customer project data is accessed through same-origin server APIs, not broad browser container SAS. Production App Service instances should use the system-assigned managed identity plus `Storage Blob Data Contributor` on the storage account/container. Storage account connection strings and Shared Key credentials are local-dev/test-only. For production storage accounts, disable Shared Key access where supported; if immediate disablement is not feasible, apply Azure Policy or an audit control that detects Shared Key-enabled accounts and tracks remediation toward disabling it.

**Pipeline** (`.github/workflows/deploy-azure-staging.yml`):

**Trigger**: Manual only (`workflow_dispatch`). Auto-deploy on push disabled during active development.

```bash
# Deploy manually when ready:
gh workflow run deploy-azure-staging.yml
```

**Steps**:

1. pnpm install (with Turborepo cache restore via `actions/cache`)
2. `pnpm audit --audit-level=high` — fail on high/critical vulnerabilities (see [security-scanning.md](security-scanning.md) for override documentation)
3. Validate lockfile integrity
4. `pnpm test` — all packages
5. Build Azure app
6. Generate CycloneDX SBOM (`sbom.json`) and upload as build artifact
7. Assemble zip: `dist/` + `server.js` + minimal `package.json`
8. OIDC login → direct deploy to App Service (`azure/webapps-deploy@v3`, no slot)
9. Health check on production URL

> **Note**: The staging environment runs on B1 (Basic) tier without deployment slots. Brief downtime (~10-30s) during deploy is acceptable for dev/test. Customer deployments will use S1 with slot swap (see [ADR-058](../../07-decisions/adr-058-deployment-lifecycle.md)).
>
> **Re-enabling auto-deploy**: When ready for continuous integration testing, uncomment the `push` trigger in `deploy-azure-staging.yml`.

### Azure App — Release Pipeline (ADR-058)

Versioned releases are published via a tag-triggered workflow (`.github/workflows/release.yml`):

1. Push a semver tag: `git tag v1.0.0 && git push --tags`
2. Same build + test steps as staging (install, audit, test, build, SBOM)
3. Assemble deployment ZIP + compute SHA-256 checksum
4. Generate release notes from commits since last tag
5. OIDC login → upload ZIP to Azure Blob Storage (`releases/v{version}/variscout-azure.zip`)
6. Generate read-only SAS token (2-year expiry) for the ZIP
7. Update `releases/manifest.json` with version, SAS URL, checksum, release notes URL
8. Create GitHub Release with ZIP asset + SBOM + release notes

**Manifest format** (`releases/manifest.json`):

```json
{
  "latest": "1.3.0",
  "released": "2026-04-15T10:00:00Z",
  "url": "https://<storage>.blob.core.windows.net/releases/v1.3.0/variscout-azure.zip?<sas>",
  "checksum": "sha256:a1b2c3...",
  "releaseNotesUrl": "https://github.com/<repo>/releases/tag/v1.3.0",
  "minVersion": "1.0.0",
  "security": false
}
```

**Required setup:**

- Azure Storage Account with `releases` container (see [Release Storage Setup](#release-storage-setup) below)
- GitHub Actions variable: `STORAGE_ACCOUNT_NAME`
- OIDC service principal needs `Storage Blob Data Contributor` role on the storage account

### Customer Update Flow (Phase 2)

Customer deployments will include an Update Handler Function that enables self-service updates from within the app. See [ADR-058](../../07-decisions/adr-058-deployment-lifecycle.md) and the [design spec](../../../docs/superpowers/specs/2026-04-02-deployment-lifecycle-design.md) for the full Phase 2 design.

### Supply Chain Security

- **Dependabot** (`.github/dependabot.yml`): weekly updates for both npm and GitHub Actions ecosystems
- **SHA-pinned actions**: all GitHub Actions use commit SHA (not version tags) to prevent supply chain attacks via tag mutation
- **SBOM**: CycloneDX JSON generated per build, uploaded as artifact for audit trail
- **lockfile-lint**: enforces HTTPS-only registry in `pnpm-lock.yaml`

**GitHub secrets** (3, all OIDC — no credentials stored):

- `AZURE_CLIENT_ID` — Service principal for CI/CD deployment
- `AZURE_TENANT_ID` — AAD tenant
- `AZURE_SUBSCRIPTION_ID` — Target subscription

**Azure resources** (in `rg-variscout-staging`):

- App Service Plan (B1 Linux)
- App Service (`variscout-staging`) with EasyAuth (AAD)
- App Registration ("VariScout Staging") with `User.Read` + `People.Read` permissions (both user-consent, zero admin consent required per ADR-059)
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

| Permission    | Type      | Purpose                           |
| ------------- | --------- | --------------------------------- |
| `User.Read`   | Delegated | Get user profile (display name)   |
| `People.Read` | Delegated | People picker for team assignment |

> **Note**: Zero admin consent required. `Files.ReadWrite.All` and `Channel.ReadBasic.All` are removed — Blob Storage replaces OneDrive/SharePoint sync per [ADR-059](../../07-decisions/adr-059-web-first-deployment-architecture.md).

---

## Pre-Deployment Checklist

### Before Any Deployment

- [ ] All tests passing (`pnpm test`)
- [ ] Build completes without errors (`pnpm build`)
- [ ] No TypeScript errors (`pnpm tsc`)
- [ ] Version numbers updated if releasing
- [ ] Security scan (`pnpm audit` plus Codex Ruflo audit worker when preparing the release locally)

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

# Graph API permissions: User.Read + People.Read (both user-consent, zero admin consent — ADR-059)
az ad app permission add --id $CLIENT_ID \
  --api 00000003-0000-0000-c000-000000000000 \
  --api-permissions "e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope" \
                    "ba47897c-39ec-4d83-8086-ee8256182833=Scope"
# Note: Files.ReadWrite.All removed — Blob Storage replaces OneDrive sync per ADR-059.

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

## Release Storage Setup

One-time setup for the release artifact storage account. Run with `az cli` authenticated to the Perus-RDMAIC subscription.

### 1. Create Storage Account

```bash
az storage account create \
  --name variscoutrelease \
  --resource-group rg-variscout-staging \
  --location northeurope \
  --sku Standard_LRS \
  --kind StorageV2 \
  --min-tls-version TLS1_2 \
  --https-only true

az storage container create \
  --account-name variscoutrelease \
  --name releases \
  --public-access blob  # manifest.json needs public read
```

### 2. Grant CI/CD access

The OIDC service principal (same one used for staging deploy) needs blob upload permissions:

```bash
az role assignment create \
  --role "Storage Blob Data Contributor" \
  --assignee $CICD_CLIENT_ID \
  --scope /subscriptions/f6766ade-aab2-4f13-845a-30eda447e379/resourceGroups/rg-variscout-staging/providers/Microsoft.Storage/storageAccounts/variscoutrelease
```

### 3. Add federated credential for tags

The existing OIDC federated credential only covers `refs/heads/main`. Add one for tag pushes:

```bash
az ad app federated-credential create --id $CICD_CLIENT_ID \
  --parameters '{
    "name": "github-actions-tags",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:jukka-matti/variscout:ref:refs/tags/*",
    "audiences": ["api://AzureADTokenExchange"]
  }'
```

### 4. Configure GitHub variable

```bash
gh variable set STORAGE_ACCOUNT_NAME --repo jukka-matti/variscout --body "variscoutrelease"
```

### 5. Test release

```bash
git tag v0.0.1-test && git push --tags
# Verify: release.yml triggers, ZIP uploaded, manifest.json updated, GitHub Release created
# Clean up: git tag -d v0.0.1-test && git push --delete origin v0.0.1-test
```

### Retention

Configure lifecycle management to delete old release blobs:

```bash
az storage account management-policy create \
  --account-name variscoutrelease \
  --resource-group rg-variscout-staging \
  --policy '{
    "rules": [{
      "name": "cleanup-old-releases",
      "enabled": true,
      "type": "Lifecycle",
      "definition": {
        "filters": { "blobTypes": ["blockBlob"], "prefixMatch": ["releases/v"] },
        "actions": { "baseBlob": { "delete": { "daysAfterModificationGreaterThan": 365 } } }
      }
    }]
  }'
```

---

## Next Steps

1. Complete Azure Marketplace Partner Center setup
2. Submit Azure App offer for certification
3. Configure production telemetry
4. Implement Phase 2: customer self-service updates ([ADR-058](../../07-decisions/adr-058-deployment-lifecycle.md))

---

## See Also

- [Azure Marketplace Guide](../../08-products/azure/marketplace.md)
- [ARM Template](../../08-products/azure/arm-template.md)
- [ADR-007: Distribution Strategy](../../07-decisions/adr-007-azure-marketplace-distribution.md)
- [ADR-040: Bicep Migration](../../07-decisions/adr-040-bicep-migration.md)
- [ADR-058: Deployment Lifecycle](../../07-decisions/adr-058-deployment-lifecycle.md)
- [Deployment Lifecycle Design Spec](../../superpowers/specs/2026-04-02-deployment-lifecycle-design.md)
