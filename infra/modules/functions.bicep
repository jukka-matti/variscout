@description('Azure region for deployment')
param location string

@description('Name for the Function App')
param functionAppName string

@description('Name for the Function App plan')
param functionPlanName string

@description('Name for the Function storage account')
param functionStorageName string

@description('VariScout plan identifier')
param variscoutPlan string

@description('Whether AI features are enabled')
param hasAI bool

@description('Client ID of the Azure AD App Registration')
param clientId string

@description('Key Vault name for secret references')
param keyVaultName string

@description('AI endpoint URL')
param aiEndpoint string

@description('Default hostname of the Web App (for CORS)')
param webAppDefaultHostName string

var tags = {
  product: 'VariScout'
  plan: variscoutPlan
  managedBy: 'AzureMarketplace'
}

resource functionStorage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: functionStorageName
  location: location
  tags: tags
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
  }
}

resource functionPlan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: functionPlanName
  location: location
  tags: tags
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  properties: {}
}

resource functionApp 'Microsoft.Web/sites@2024-04-01' = {
  name: functionAppName
  location: location
  tags: tags
  kind: 'functionapp'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: functionPlan.id
    httpsOnly: true
    siteConfig: {
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${functionStorageName};EndpointSuffix=${environment().suffixes.storage};AccountKey=${functionStorage.listKeys().keys[0].value}'
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~22'
        }
        {
          name: 'CLIENT_ID'
          value: clientId
        }
        {
          name: 'CLIENT_SECRET'
          value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=client-secret)'
        }
        {
          name: 'TENANT_ID'
          value: subscription().tenantId
        }
        {
          name: 'AI_ENDPOINT'
          value: hasAI ? aiEndpoint : ''
        }
        {
          name: 'AI_SERVICES_API_KEY'
          value: hasAI ? '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=ai-services-api-key)' : ''
        }
        {
          name: 'ALLOWED_ORIGIN'
          value: 'https://${webAppDefaultHostName}'
        }
        {
          name: 'FUNCTION_KEY'
          value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=function-key)'
        }
        {
          name: 'MSAL_CACHE_LOCATION'
          value: hasAI ? '/home/data/msal-cache' : ''
        }
      ]
      cors: {
        allowedOrigins: [
          'https://${webAppDefaultHostName}'
        ]
      }
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
    }
  }
}

@description('Resource ID of the Function App')
output functionAppId string = functionApp.id

@description('Principal ID of the Function App managed identity')
output principalId string = functionApp.identity.principalId

// WARNING: outputs-should-not-contain-secrets — accepted because this value flows
// directly into Key Vault (key-vault module). Not exposed as a top-level template output.
@description('Default function key')
output defaultFunctionKey string = functionApp.listKeys().functionKeys.default
