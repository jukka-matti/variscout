# ARM Template Documentation

Azure Resource Manager (ARM) template for VariScout deployment.

---

## Overview

The ARM template deploys VariScout to a customer's Azure subscription with:

- Azure Static Web App (hosting)
- App Registration (authentication)
- Configuration settings (tier, branding)

**No backend resources** - the app runs entirely in the browser.

---

## Template Structure

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "metadata": {
    "description": "Deploys VariScout Azure App to customer subscription"
  },
  "parameters": {
    /* ... */
  },
  "variables": {
    /* ... */
  },
  "resources": [
    /* ... */
  ],
  "outputs": {
    /* ... */
  }
}
```

---

## Parameters

### Required Parameters

| Parameter | Type   | Description                               |
| --------- | ------ | ----------------------------------------- |
| `tier`    | string | License tier (individual/team/enterprise) |

### Optional Parameters

| Parameter  | Type   | Default                 | Description                 |
| ---------- | ------ | ----------------------- | --------------------------- |
| `location` | string | Resource group location | Azure region for deployment |
| `appName`  | string | `variscout-{unique}`    | Name for Static Web App     |
| `sku`      | string | `Standard`              | Static Web App SKU          |

### Parameter Definitions

```json
{
  "parameters": {
    "tier": {
      "type": "string",
      "allowedValues": ["individual", "team", "enterprise"],
      "metadata": {
        "description": "VariScout license tier"
      }
    },
    "location": {
      "type": "string",
      "defaultValue": "[resourceGroup().location]",
      "metadata": {
        "description": "Azure region for deployment"
      }
    },
    "appName": {
      "type": "string",
      "defaultValue": "[concat('variscout-', uniqueString(resourceGroup().id))]",
      "metadata": {
        "description": "Name for the Static Web App"
      }
    },
    "sku": {
      "type": "string",
      "defaultValue": "Standard",
      "allowedValues": ["Free", "Standard"],
      "metadata": {
        "description": "Static Web App pricing tier"
      }
    }
  }
}
```

---

## Variables

```json
{
  "variables": {
    "staticWebAppName": "[parameters('appName')]",
    "appRegistrationName": "[concat(parameters('appName'), '-app')]",
    "tierConfig": {
      "individual": {
        "maxUsers": 1,
        "maxChannels": 200,
        "features": ["core", "performance"]
      },
      "team": {
        "maxUsers": 10,
        "maxChannels": 500,
        "features": ["core", "performance", "sharing"]
      },
      "enterprise": {
        "maxUsers": -1,
        "maxChannels": -1,
        "features": ["core", "performance", "sharing", "priority-support"]
      }
    }
  }
}
```

---

## Resources

### 1. Static Web App

```json
{
  "type": "Microsoft.Web/staticSites",
  "apiVersion": "2022-09-01",
  "name": "[variables('staticWebAppName')]",
  "location": "[parameters('location')]",
  "sku": {
    "name": "[parameters('sku')]",
    "tier": "[parameters('sku')]"
  },
  "properties": {
    "repositoryUrl": "",
    "branch": "",
    "buildProperties": {
      "appLocation": "/",
      "outputLocation": "dist"
    }
  }
}
```

### 2. Static Web App Configuration

```json
{
  "type": "Microsoft.Web/staticSites/config",
  "apiVersion": "2022-09-01",
  "name": "[concat(variables('staticWebAppName'), '/appsettings')]",
  "dependsOn": ["[resourceId('Microsoft.Web/staticSites', variables('staticWebAppName'))]"],
  "properties": {
    "VITE_LICENSE_TIER": "[parameters('tier')]",
    "VITE_MAX_USERS": "[string(variables('tierConfig')[parameters('tier')].maxUsers)]",
    "VITE_MAX_CHANNELS": "[string(variables('tierConfig')[parameters('tier')].maxChannels)]",
    "VITE_AZURE_CLIENT_ID": "[reference(resourceId('Microsoft.Graph/applications', variables('appRegistrationName'))).appId]"
  }
}
```

### 3. App Registration (via Deployment Script)

App Registration requires Microsoft Graph API, deployed via deployment script:

```json
{
  "type": "Microsoft.Resources/deploymentScripts",
  "apiVersion": "2020-10-01",
  "name": "createAppRegistration",
  "location": "[parameters('location')]",
  "kind": "AzurePowerShell",
  "properties": {
    "azPowerShellVersion": "9.0",
    "timeout": "PT30M",
    "arguments": "[format('-appName \"{0}\" -redirectUri \"{1}\"', variables('appRegistrationName'), reference(resourceId('Microsoft.Web/staticSites', variables('staticWebAppName'))).defaultHostname)]",
    "scriptContent": "
      param($appName, $redirectUri)

      $app = New-AzADApplication `
        -DisplayName $appName `
        -SignInAudience 'AzureADMyOrg' `
        -Web @{
          RedirectUris = @(\"https://$redirectUri\")
          ImplicitGrantSettings = @{
            EnableIdTokenIssuance = $true
          }
        }

      # Add required API permissions (User.Read, Files.ReadWrite)
      Add-AzADAppPermission -ObjectId $app.Id `
        -ApiId '00000003-0000-0000-c000-000000000000' `
        -PermissionId 'e1fe6dd8-ba31-4d61-89e7-88639da4683d' `
        -Type 'Scope'

      $DeploymentScriptOutputs = @{
        appId = $app.AppId
        objectId = $app.Id
      }
    ",
    "cleanupPreference": "OnSuccess",
    "retentionInterval": "P1D"
  },
  "dependsOn": [
    "[resourceId('Microsoft.Web/staticSites', variables('staticWebAppName'))]"
  ]
}
```

---

## Outputs

```json
{
  "outputs": {
    "staticWebAppUrl": {
      "type": "string",
      "value": "[concat('https://', reference(resourceId('Microsoft.Web/staticSites', variables('staticWebAppName'))).defaultHostname)]"
    },
    "appRegistrationId": {
      "type": "string",
      "value": "[reference('createAppRegistration').outputs.appId]"
    },
    "tier": {
      "type": "string",
      "value": "[parameters('tier')]"
    },
    "maxUsers": {
      "type": "int",
      "value": "[variables('tierConfig')[parameters('tier')].maxUsers]"
    }
  }
}
```

---

## Deployment Methods

### Azure Marketplace (Recommended)

1. Customer finds VariScout on Azure Marketplace
2. Selects pricing tier
3. Clicks "Create"
4. ARM template deploys automatically

### Azure CLI

```bash
# Create resource group
az group create --name rg-variscout --location westeurope

# Deploy template
az deployment group create \
  --resource-group rg-variscout \
  --template-uri https://raw.githubusercontent.com/variscout/azure-deploy/main/azuredeploy.json \
  --parameters tier=team

# Get outputs
az deployment group show \
  --resource-group rg-variscout \
  --name azuredeploy \
  --query properties.outputs
```

### Azure Portal

1. Navigate to "Deploy a custom template"
2. Paste template JSON or provide URI
3. Fill in parameters
4. Review and create

### PowerShell

```powershell
# Deploy template
New-AzResourceGroupDeployment `
  -ResourceGroupName "rg-variscout" `
  -TemplateUri "https://raw.githubusercontent.com/variscout/azure-deploy/main/azuredeploy.json" `
  -tier "enterprise"
```

---

## Post-Deployment Configuration

### 1. Admin Consent (Required for Team/Enterprise)

For multi-user deployments, an admin must grant consent:

```
https://login.microsoftonline.com/{tenant-id}/adminconsent
  ?client_id={app-registration-id}
  &redirect_uri={static-web-app-url}
```

### 2. User Assignment (Optional)

For Enterprise tier, assign users via Azure AD:

1. Navigate to Enterprise Applications
2. Find VariScout app registration
3. Users and groups > Add assignment

### 3. Custom Domain (Optional)

Add custom domain to Static Web App:

```bash
az staticwebapp hostname set \
  --name variscout-xyz123 \
  --hostname variscout.contoso.com
```

---

## Troubleshooting

### Deployment Fails

| Error                   | Cause                            | Fix                                    |
| ----------------------- | -------------------------------- | -------------------------------------- |
| `ResourceNotFound`      | Invalid location                 | Use supported region                   |
| `AuthorizationFailed`   | Insufficient permissions         | Requires Contributor + AD Admin        |
| `DeploymentScriptError` | App Registration creation failed | Check Graph API permissions            |
| `QuotaExceeded`         | Static Web App limit             | Delete unused apps or request increase |

### App Registration Issues

```bash
# Check if app was created
az ad app list --display-name "variscout-*" --query "[].{name:displayName, id:appId}"

# Manually create if needed
az ad app create \
  --display-name "variscout-manual" \
  --sign-in-audience AzureADMyOrg \
  --web-redirect-uris "https://variscout-xyz123.azurestaticapps.net"
```

### MSAL Authentication Errors

If users can't sign in:

1. Verify redirect URI matches Static Web App URL
2. Check admin consent was granted
3. Verify user is in the correct tenant

---

## Security Considerations

### Principle of Least Privilege

The template requests only necessary permissions:

| Permission        | Scope     | Purpose               |
| ----------------- | --------- | --------------------- |
| `User.Read`       | Delegated | Get user profile      |
| `Files.ReadWrite` | Delegated | OneDrive project sync |

### No Secrets in Template

The template:

- Does not contain secrets
- Does not create service principals with passwords
- Uses managed identities where possible

### Customer Data Isolation

- Each deployment is isolated to customer's tenant
- No cross-tenant data access
- No outbound connections to publisher systems

---

## Template Versioning

| Version | Date       | Changes                             |
| ------- | ---------- | ----------------------------------- |
| 1.0.0   | 2026-02-01 | Initial release                     |
| 1.1.0   | TBD        | Add custom domain support           |
| 1.2.0   | TBD        | Add Application Insights (optional) |

---

## See Also

- [Azure Marketplace Guide](marketplace.md)
- [Pricing Tiers](pricing-tiers.md)
- [MSAL Authentication](msal-auth.md)
- [Azure ARM Template Reference](https://docs.microsoft.com/azure/azure-resource-manager/templates/)
