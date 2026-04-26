---
title: 'ARM Template Documentation'
audience: [admin, architect]
category: reference
status: stable
---

# ARM Template Documentation

Azure Resource Manager (ARM) template for VariScout Managed Application deployment.

> **Note**: The infrastructure is authored in Bicep (`infra/main.bicep` + `infra/modules/*.bicep`). The `mainTemplate.json` is auto-generated via `az bicep build --file main.bicep --outfile mainTemplate.json`. See [ADR-040](../../07-decisions/adr-040-bicep-migration.md).

---

## Overview

The ARM template (compiled from Bicep) deploys VariScout to a customer's Azure subscription as a Managed Application with:

- Azure App Service (hosting via `WEBSITE_RUN_FROM_PACKAGE`)
- App Service Authentication (EasyAuth) with Azure AD
- Configuration settings (all features enabled)

The customer provides their own App Registration (created before deployment) so that VariScout can authenticate users via EasyAuth (Standard: `User.Read`; Team: `User.Read` + `People.Read`). No Graph API scopes are needed — the Function App and OBO token exchange were removed in ADR-059.

**Minimal backend resources** — Standard and Team plans run entirely in the browser. Both plans include Azure AI Services (model hosting), Key Vault (secure secret storage), and App Insights (telemetry). The Team plan additionally provisions Azure Blob Storage (project sync + Foundry IQ knowledge index) and `text-embedding-3-small` deployment for Foundry IQ (ADR-060). The App Service uses a system-assigned managed identity for RBAC-based access to Key Vault and Blob Storage.

**Conditional variables:**

| Variable          | Expression                                           | True for        |
| ----------------- | ---------------------------------------------------- | --------------- |
| `hasAI`           | `[not(equals(parameters('variscoutPlan'), 'free'))]` | Standard + Team |
| `hasTeamFeatures` | `[equals(parameters('variscoutPlan'), 'team')]`      | Team only       |

### Managed Application Package

The template is packaged as a `.zip` file for Partner Center:

```
variscout-managed-app.zip
├── mainTemplate.json         # Compiled ARM template (auto-generated from main.bicep)
└── createUiDefinition.json   # Azure portal deployment wizard
```

---

## Pre-Deployment: Create App Registration

Before deploying VariScout, the customer must create an App Registration in Azure AD. This is required because Managed Applications cannot create App Registrations in the customer's tenant.

### Step-by-Step

1. Go to **Azure Portal > Azure Active Directory > App registrations > New registration**
2. Set **Name** to something like `VariScout`
3. Set **Supported account types** to "Accounts in this organizational directory only" (single tenant)
4. Set **Redirect URI** (Web platform) to:
   ```
   https://<your-app-name>.azurewebsites.net/.auth/login/aad/callback
   ```
   Replace `<your-app-name>` with the App Service name you'll use during deployment.
5. Click **Register**
6. Go to **Authentication** > **Implicit grant and hybrid flows** and check **ID tokens**. This is required for EasyAuth's hybrid authentication flow.
7. Copy the **Application (client) ID** from the Overview page — you'll need this during deployment

### Add API Permissions

1. Go to **API permissions > Add a permission > Microsoft Graph > Delegated permissions**
2. Add permissions based on your plan:

   **Standard plan (€79/month):**
   - `User.Read` — sign-in and read user profile

   **Team plan (€199/month) — add all of the above, plus:**
   - `People.Read` — people picker for action assignment

3. Click **Grant admin consent** (optional — user consent is sufficient for both plans per ADR-059)

### Create Client Secret

1. Go to **Certificates & secrets > Client secrets > New client secret**
2. Set a description (e.g., "VariScout EasyAuth") and expiration (recommended: 24 months)
3. Click **Add**
4. **Copy the secret value immediately** — it won't be shown again. You'll need this during deployment.

---

## Parameters

### Required Parameters

| Parameter      | Type         | Description                                       |
| -------------- | ------------ | ------------------------------------------------- |
| `clientId`     | string       | Application (client) ID from the App Registration |
| `clientSecret` | secureString | Client secret value from the App Registration     |

### Optional Parameters

| Parameter       | Type   | Default                 | Description                                                                               |
| --------------- | ------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `location`      | string | Resource group location | Azure region for deployment                                                               |
| `appName`       | string | `variscout-{unique}`    | Name for App Service (3-24)                                                               |
| `variscoutPlan` | string | `standard`              | Plan: `standard` (local files) or `team` (+ Blob Storage sync, Foundry IQ Knowledge Base) |

---

## Resources

All resources are tagged with `product: VariScout`, `plan: <selected>`, and `managedBy: AzureMarketplace` for cost tracking and governance.

### 1. App Service Plan

Linux B1 plan for hosting the App Service:

```json
{
  "type": "Microsoft.Web/serverfarms",
  "apiVersion": "2024-04-01",
  "name": "[variables('appServicePlanName')]",
  "location": "[parameters('location')]",
  "kind": "linux",
  "sku": {
    "name": "B1",
    "tier": "Basic"
  },
  "properties": {
    "reserved": true
  }
}
```

### 2. App Service

Serves the VariScout build via `WEBSITE_RUN_FROM_PACKAGE`. Uses system-assigned managed identity for Key Vault access (Team plan). The client secret is stored as an app setting for EasyAuth to use:

```json
{
  "type": "Microsoft.Web/sites",
  "apiVersion": "2024-04-01",
  "name": "[variables('webAppName')]",
  "location": "[parameters('location')]",
  "properties": {
    "serverFarmId": "[resourceId('Microsoft.Web/serverfarms', variables('appServicePlanName'))]",
    "httpsOnly": true,
    "siteConfig": {
      "linuxFxVersion": "NODE|22-lts",
      "appSettings": [
        { "name": "WEBSITE_RUN_FROM_PACKAGE", "value": "[variables('packageUrl')]" },
        { "name": "VITE_LICENSE_TIER", "value": "enterprise" },
        {
          "name": "MICROSOFT_PROVIDER_AUTHENTICATION_SECRET",
          "value": "[parameters('clientSecret')]"
        }
      ],
      "minTlsVersion": "1.2",
      "ftpsState": "Disabled"
    }
  }
}
```

### 3. EasyAuth Configuration (authsettingsV2)

App Service Authentication configured for Azure AD, referencing the customer-provided App Registration:

```json
{
  "type": "Microsoft.Web/sites/config",
  "apiVersion": "2024-04-01",
  "name": "[concat(variables('webAppName'), '/authsettingsV2')]",
  "properties": {
    "platform": { "enabled": true },
    "globalValidation": {
      "requireAuthentication": true,
      "unauthenticatedClientAction": "RedirectToLoginPage",
      "redirectToProvider": "azureactivedirectory",
      "excludedPaths": ["/health"]
    },
    "identityProviders": {
      "azureActiveDirectory": {
        "enabled": true,
        "registration": {
          "openIdIssuer": "[concat('https://login.microsoftonline.com/', subscription().tenantId, '/v2.0')]",
          "clientId": "[parameters('clientId')]",
          "clientSecretSettingName": "MICROSOFT_PROVIDER_AUTHENTICATION_SECRET"
        },
        "login": {
          "loginParameters": ["scope=openid profile email User.Read"]
          // Actual template uses conditional: Standard = "User.Read" only,
          // Team = "User.Read People.Read"
        }
      }
    },
    "login": {
      "tokenStore": { "enabled": true }
    }
  }
}
```

Key configuration:

- **Token store enabled**: tokens available at `/.auth/me` for app session needs
- **Login parameters**: `User.Read` for sign-in/profile
- **Redirect to login**: unauthenticated users are automatically redirected to Azure AD sign-in

### 4. AI Services (all plans)

| Resource                 | SKU   | Purpose                                                    | Monthly Cost | Plan                  |
| ------------------------ | ----- | ---------------------------------------------------------- | ------------ | --------------------- |
| Azure AI Services        | S0    | Model hosting (gpt-5.4-nano + gpt-5.4-mini)                | ~€15-25      | All plans             |
| `text-embedding-3-small` | —     | Foundry IQ knowledge index embeddings (1536 dims, ADR-060) | ~€0-1        | Team only             |
| Azure AI Search Basic    | Basic | Reserved for future cross-project search (not used in v1)  | ~€50-60      | Not provisioned in v1 |

AI resources (Azure AI Services, Key Vault, App Insights) are provisioned for both Standard and Team plans via the `hasAI` variable. `text-embedding-3-small` is deployed as part of the Azure AI Services resource for the Team plan via the `hasTeamFeatures` variable. Azure AI Search Basic is listed for reference — Foundry IQ v1 uses embeddings in Blob Storage (brute-force cosine) and does not require Azure AI Search.

#### AI Deployment Guardrails

Both model deployments include explicit content filter and version management policies:

| Property               | Value                       | Purpose                                                                                                                                                   |
| ---------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `raiPolicyName`        | `Microsoft.DefaultV2`       | Content filter policy (hate, sexual, violence, self-harm, jailbreak, protected material) — same as Azure default, but explicitly declared for audit trail |
| `versionUpgradeOption` | `OnceCurrentVersionExpired` | Model version pinning — prevents unplanned capability changes                                                                                             |
| TPM (fast/nano)        | 30                          | Rate limit for narration + chart insights                                                                                                                 |
| TPM (reasoning/mini)   | 60                          | Rate limit for CoScout conversation                                                                                                                       |

The `raiPolicyName` is declared in infrastructure-as-code so that content filter configuration is version-controlled and auditable. Azure OpenAI applies DefaultV2 by default; the explicit declaration ensures this is visible in ARM template reviews and compliance audits.

See [Responsible AI Policy](../../05-technical/architecture/responsible-ai-policy.md) for the full guardrail framework.

### 5. Runtime Configuration

The Node.js server (`server.js`) serves a `/config` endpoint that returns runtime settings from environment variables. This allows Marketplace deployments to configure AI endpoints without rebuilding.

| Variable             | Description                                                 | Plan      |
| -------------------- | ----------------------------------------------------------- | --------- |
| `AI_ENDPOINT`        | Azure AI Foundry endpoint                                   | All plans |
| `AI_EMBEDDING_MODEL` | Embedding deployment name (text-embedding-3-small, ADR-060) | Team      |
| `STORAGE_ACCOUNT`    | Blob Storage account name for Foundry IQ knowledge index    | Team      |

The client fetches `/config` on startup via `runtimeConfig.ts` and uses the returned values to configure AI service clients. Environment variables without the `VITE_` prefix are invisible to the Vite build — the `/config` endpoint is the only way they reach the client.

---

## Outputs

```json
{
  "outputs": {
    "appUrl": {
      "type": "string",
      "value": "[concat('https://', reference(resourceId('Microsoft.Web/sites', variables('webAppName'))).defaultHostName)]"
    }
  }
}
```

---

## createUiDefinition.json

The `createUiDefinition.json` defines the Azure portal wizard shown to customers during deployment:

### Basics Step

The customer provides an app name and selects a region.

### Plan Selection Step

The customer selects their VariScout plan:

- **Standard (€79/month)** — Full analysis, local file storage
- **Team (€199/month)** — + Blob Storage sync, Foundry IQ Knowledge Base, photo evidence, people picker

The selected `variscoutPlan` parameter is passed to the ARM template, which conditionally provisions Team plan resources (Blob Storage, `text-embedding-3-small` deployment) and adjusts EasyAuth login scopes.

### Authentication Step

The customer provides their App Registration credentials:

- **InfoBox** with step-by-step instructions for creating an App Registration
- **Client ID** text box with GUID validation
- **Client Secret** password box (hidden input, no confirmation)

The wizard outputs `clientId` and `clientSecret` to the ARM template parameters.

---

## Deployment Methods

### Azure Marketplace (Primary)

1. Customer creates an App Registration (see [Pre-Deployment](#pre-deployment-create-app-registration))
2. Customer finds VariScout on Azure Marketplace
3. Clicks "Create"
4. Enters app name, selects region
5. Enters App Registration Client ID and Client Secret
6. ARM template deploys automatically to managed resource group

### Azure CLI (Development/Testing)

```bash
# Create resource group
az group create --name rg-variscout --location westeurope

# Deploy template (will prompt for clientId and clientSecret)
az deployment group create \
  --resource-group rg-variscout \
  --template-file infra/mainTemplate.json \
  --parameters clientId=<your-client-id> clientSecret=<your-client-secret>

# Get outputs
az deployment group show \
  --resource-group rg-variscout \
  --name mainTemplate \
  --query properties.outputs
```

---

## Post-Deployment

After deployment, EasyAuth is fully configured:

- Users visit the app URL and are redirected to Azure AD sign-in
- Consent for `User.Read` (Standard) or `User.Read` + `People.Read` (Team) is requested on first login
- Tokens are stored in the EasyAuth token store and accessible via `/.auth/me`

### Verify Redirect URI

After deployment, confirm the App Registration redirect URI matches the deployed App Service URL:

```
https://<deployed-app-name>.azurewebsites.net/.auth/login/aad/callback
```

If the app name was auto-generated (e.g., `variscout-abc123`), update the App Registration redirect URI to match.

### Custom Domain (Optional)

Add a custom domain to the App Service:

```bash
az webapp config hostname add \
  --webapp-name variscout-xyz123 \
  --resource-group rg-variscout \
  --hostname variscout.contoso.com
```

When adding a custom domain, also add the new redirect URI to the App Registration.

A custom domain also enables seamless Teams SSO (without it, users get a one-time login redirect because Microsoft blocks SSO on `*.azurewebsites.net`).

### Teams Integration (Optional)

The app includes an Admin page (Admin > Teams Setup) that generates a Teams app package. See the in-app instructions for uploading to your Teams admin center.

---

## Troubleshooting

### Deployment Fails

| Error                 | Cause                    | Fix                                     |
| --------------------- | ------------------------ | --------------------------------------- |
| `ResourceNotFound`    | Invalid location         | Use supported region                    |
| `AuthorizationFailed` | Insufficient permissions | Requires Contributor role               |
| `QuotaExceeded`       | App Service Plan limit   | Delete unused plans or request increase |

### Authentication Issues

If users can't sign in:

1. Verify the App Registration redirect URI matches the App Service URL + `/.auth/login/aad/callback`
2. Check the client secret hasn't expired
3. Verify **ID tokens** is enabled under App Registration > Authentication > Implicit grant and hybrid flows
4. Confirm the OpenID issuer uses `login.microsoftonline.com` (not `sts.windows.net`)
5. Check the EasyAuth configuration in Azure Portal > App Service > Authentication
6. Verify user is in the correct tenant
7. Check `/.auth/me` returns a valid response (should return JSON array)

---

## Security Considerations

### Principle of Least Privilege

The template requests only necessary permissions:

**Standard plan:**

| Permission  | Scope     | Purpose          |
| ----------- | --------- | ---------------- |
| `User.Read` | Delegated | Get user profile |

**Team plan adds:**

| Permission    | Scope     | Purpose                             |
| ------------- | --------- | ----------------------------------- |
| `People.Read` | Delegated | People picker for action assignment |

### Secret Handling

- The client secret is passed as a `secureString` parameter — ARM never logs it
- The secret is stored as an App Service app setting (server-side, not in client code)
- The secret is not included in template outputs
- EasyAuth uses the token store (server-side) for access tokens
- **Key Vault (all plans):** API keys stored in Azure Key Vault with RBAC authorization. App Service accesses secrets via managed identity (Key Vault Secrets User role).
- **AI observability:** `tracing.ts` module records latency, token usage, and error rates for cost monitoring.

### Customer Data Isolation

- Each deployment is isolated to customer's tenant
- No cross-tenant data access
- No outbound connections to publisher systems
- Publisher management is disabled (zero publisher access)

---

## Template Versioning

| Version | Date       | Changes                                                                                           |
| ------- | ---------- | ------------------------------------------------------------------------------------------------- |
| 1.0.0   | 2026-02-01 | Initial release (Solution Template)                                                               |
| 2.0.0   | 2026-02-13 | Managed Application format, single plan                                                           |
| 3.0.0   | 2026-02-16 | App Service + EasyAuth (replaces Static Web App + MSAL)                                           |
| 4.0.0   | 2026-02-16 | Customer-provided App Registration (removes deployment script)                                    |
| 5.0.0   | 2026-02-25 | API version → 2024-04-01, /health excluded from EasyAuth                                          |
| 5.1.0   | 2026-02-26 | Fix OpenID issuer (sts.windows.net → login.microsoftonline.com), document ID token requirement    |
| 6.0.0   | 2026-03-14 | Plan selector (Standard/Team), resource tags, conditional Function App + Storage for Team plan    |
| 7.0.0   | 2026-03-16 | AI resources (Azure AI Services, AI Search), runtime config endpoint, OBO token exchange Function |
| 8.0.0   | 2026-03-17 | Key Vault + RBAC, App Service managed identity, AI tracing module, Responses API client           |

---

## See Also

- [How It Works](how-it-works.md) — end-to-end architecture guide
- [Azure Marketplace Guide](marketplace.md)
- [Pricing](pricing-tiers.md)
- [Authentication](authentication.md)
- [Admin Aino](../../02-journeys/personas/admin-aino.md) — IT Admin persona (deployment + troubleshooting)
- [Azure ARM Template Reference](https://docs.microsoft.com/azure/azure-resource-manager/templates/)
