@description('Azure region for deployment')
param location string

@description('Name for the OpenAI account')
param aiServicesName string

@description('Name for the App Insights resource')
param appInsightsName string

@description('VariScout plan identifier')
param variscoutPlan string

var tags = {
  product: 'VariScout'
  plan: variscoutPlan
}

var tagsWithManaged = union(tags, {
  managedBy: 'AzureMarketplace'
})

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  tags: tagsWithManaged
  kind: 'web'
  properties: {
    Application_Type: 'web'
    RetentionInDays: 90
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

resource aiServices 'Microsoft.CognitiveServices/accounts@2025-09-01' = {
  name: aiServicesName
  location: location
  tags: tags
  identity: {
    type: 'SystemAssigned'
  }
  kind: 'OpenAI'
  sku: {
    name: 'S0'
  }
  properties: {
    customSubDomainName: aiServicesName
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      defaultAction: 'Allow'
    }
  }
}

resource fastDeployment 'Microsoft.CognitiveServices/accounts/deployments@2025-09-01' = {
  parent: aiServices
  name: 'fast'
  sku: {
    name: 'Standard'
    capacity: 30
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: 'gpt-5.4-nano'
      version: '2026-03-17'
    }
    versionUpgradeOption: 'OnceCurrentVersionExpired'
    raiPolicyName: 'Microsoft.DefaultV2'
  }
}

resource reasoningDeployment 'Microsoft.CognitiveServices/accounts/deployments@2025-09-01' = {
  parent: aiServices
  name: 'reasoning'
  sku: {
    name: 'Standard'
    capacity: 60
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: 'gpt-5.4-mini'
      version: '2026-03-17'
    }
    versionUpgradeOption: 'OnceCurrentVersionExpired'
    raiPolicyName: 'Microsoft.DefaultV2'
  }
  dependsOn: [
    fastDeployment
  ]
}

resource embeddingDeployment 'Microsoft.CognitiveServices/accounts/deployments@2025-09-01' = if (variscoutPlan == 'team') {
  parent: aiServices
  name: 'embeddings'
  sku: {
    name: 'Standard'
    capacity: 20
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: 'text-embedding-3-small'
      version: '1'
    }
    raiPolicyName: 'Microsoft.DefaultV2'
  }
  dependsOn: [
    reasoningDeployment
  ]
}

@description('Resource ID of the OpenAI account')
output aiServicesId string = aiServices.id

@description('OpenAI endpoint URL')
output aiEndpoint string = aiServices.properties.endpoint

// WARNING: outputs-should-not-contain-secrets — accepted because this value flows
// directly into Key Vault (key-vault module). Not exposed as a top-level template output.
@description('API key for the OpenAI account')
output aiServicesApiKey string = aiServices.listKeys().key1

@description('App Insights connection string')
output appInsightsConnectionString string = appInsights.properties.ConnectionString
