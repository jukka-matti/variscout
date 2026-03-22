@description('Azure region for deployment')
param location string

@description('Name for the Key Vault')
param keyVaultName string

@description('VariScout plan identifier')
param variscoutPlan string

@description('Whether Team plan features are enabled')
param hasTeamFeatures bool

@description('Client secret value to store')
@secure()
param clientSecret string

@description('AI Services API key to store')
@secure()
param aiServicesApiKey string

@description('Search admin key to store (empty if not Team plan)')
@secure()
param searchApiKey string

@description('Function App default key to store (empty if not Team plan)')
@secure()
param functionKey string

@description('Principal ID of the Web App managed identity')
param webAppPrincipalId string

@description('Principal ID of the Function App managed identity')
param functionAppPrincipalId string

var tags = {
  product: 'VariScout'
  plan: variscoutPlan
  managedBy: 'AzureMarketplace'
}

var keyVaultSecretsUserRole = '4633458b-17de-408a-b874-0445c86b69e6'

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    enableRbacAuthorization: true
    tenantId: subscription().tenantId
    sku: {
      family: 'A'
      name: 'standard'
    }
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
  }
}

resource webAppRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: keyVault
  name: guid(keyVault.id, keyVaultSecretsUserRole, webAppPrincipalId)
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', keyVaultSecretsUserRole)
    principalId: webAppPrincipalId
    principalType: 'ServicePrincipal'
  }
}

resource functionAppRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: keyVault
  name: guid(keyVault.id, keyVaultSecretsUserRole, functionAppPrincipalId)
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', keyVaultSecretsUserRole)
    principalId: functionAppPrincipalId
    principalType: 'ServicePrincipal'
  }
}

resource aiServicesApiKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'ai-services-api-key'
  properties: {
    value: aiServicesApiKey
  }
}

resource clientSecretSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'client-secret'
  properties: {
    value: clientSecret
  }
}

resource searchApiKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (hasTeamFeatures) {
  parent: keyVault
  name: 'search-api-key'
  properties: {
    value: searchApiKey
  }
}

resource functionKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (hasTeamFeatures) {
  parent: keyVault
  name: 'function-key'
  properties: {
    value: functionKey
  }
}

@description('Name of the Key Vault')
output keyVaultName string = keyVault.name
