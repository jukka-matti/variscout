# ARM Template Documentation

Azure Resource Manager (ARM) template for VariScout Managed Application deployment.

---

## Overview

The ARM template deploys VariScout to a customer's Azure subscription as a Managed Application with:

- Azure App Service (hosting via `WEBSITE_RUN_FROM_PACKAGE`)
- App Service Authentication (EasyAuth) with Azure AD
- Configuration settings (all features enabled)

The customer provides their own App Registration (created before deployment) so that VariScout can authenticate users and access OneDrive via Graph API.

**No backend resources** - the app runs entirely in the browser. The App Service serves the static build as a zip package.

### Managed Application Package

The template is packaged as a `.zip` file for Partner Center:

```
variscout-managed-app.zip
├── mainTemplate.json         # ARM template (this document)
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
2. Add:
   - `User.Read` — sign-in and read user profile
   - `Files.ReadWrite` — read and write user's OneDrive files (for project sync)
3. Click **Grant admin consent** (optional, otherwise users consent on first login)

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

| Parameter  | Type   | Default                 | Description                 |
| ---------- | ------ | ----------------------- | --------------------------- |
| `location` | string | Resource group location | Azure region for deployment |
| `appName`  | string | `variscout-{unique}`    | Name for App Service (3-24) |

All Managed Application deployments get full features — no tier parameter needed.

---

## Resources

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

Serves the VariScout build via `WEBSITE_RUN_FROM_PACKAGE`. The client secret is stored as an app setting for EasyAuth to use:

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
          "loginParameters": ["scope=openid profile email User.Read Files.ReadWrite"]
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

- **Token store enabled**: tokens available at `/.auth/me` for Graph API calls
- **Login parameters**: requests `User.Read` and `Files.ReadWrite` scopes for OneDrive access
- **Redirect to login**: unauthenticated users are automatically redirected to Azure AD sign-in

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
- Consent for `User.Read` and `Files.ReadWrite` is requested on first login
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

| Permission        | Scope     | Purpose               |
| ----------------- | --------- | --------------------- |
| `User.Read`       | Delegated | Get user profile      |
| `Files.ReadWrite` | Delegated | OneDrive project sync |

### Secret Handling

- The client secret is passed as a `secureString` parameter — ARM never logs it
- The secret is stored as an App Service app setting (server-side, not in client code)
- The secret is not included in template outputs
- EasyAuth uses the token store (server-side) for access tokens

### Customer Data Isolation

- Each deployment is isolated to customer's tenant
- No cross-tenant data access
- No outbound connections to publisher systems
- Publisher management is disabled (zero publisher access)

---

## Template Versioning

| Version | Date       | Changes                                                                                        |
| ------- | ---------- | ---------------------------------------------------------------------------------------------- |
| 1.0.0   | 2026-02-01 | Initial release (Solution Template)                                                            |
| 2.0.0   | 2026-02-13 | Managed Application format, single plan                                                        |
| 3.0.0   | 2026-02-16 | App Service + EasyAuth (replaces Static Web App + MSAL)                                        |
| 4.0.0   | 2026-02-16 | Customer-provided App Registration (removes deployment script)                                 |
| 5.0.0   | 2026-02-25 | API version → 2024-04-01, /health excluded from EasyAuth                                       |
| 5.1.0   | 2026-02-26 | Fix OpenID issuer (sts.windows.net → login.microsoftonline.com), document ID token requirement |

---

## See Also

- [How It Works](how-it-works.md) — end-to-end architecture guide
- [Azure Marketplace Guide](marketplace.md)
- [Pricing](pricing-tiers.md)
- [Authentication](authentication.md)
- [Azure ARM Template Reference](https://docs.microsoft.com/azure/azure-resource-manager/templates/)
