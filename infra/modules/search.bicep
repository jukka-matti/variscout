@description('Azure region for deployment')
param location string

@description('Name for the AI Search service')
param searchServiceName string

@description('VariScout plan identifier')
param variscoutPlan string

var tags = {
  product: 'VariScout'
  plan: variscoutPlan
}

resource searchService 'Microsoft.Search/searchServices@2025-05-01' = {
  name: searchServiceName
  location: location
  tags: tags
  identity: {
    type: 'SystemAssigned'
  }
  sku: {
    name: 'basic'
  }
  properties: {
    replicaCount: 1
    partitionCount: 1
    hostingMode: 'Default'
    semanticSearch: 'standard'
    publicNetworkAccess: 'Enabled'
    authOptions: {
      aadOrApiKey: {
        aadAuthFailureMode: 'http401WithBearerChallenge'
      }
    }
    networkRuleSet: {
      bypass: 'AzureServices'
    }
  }
}

@description('Resource ID of the Search service')
output searchServiceId string = searchService.id

// WARNING: outputs-should-not-contain-secrets — accepted because this value flows
// directly into Key Vault (key-vault module). Not exposed as a top-level template output.
@description('Admin key for the Search service')
output searchAdminKey string = searchService.listAdminKeys().primaryKey
