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

resource knowledgeIndex 'Microsoft.Search/searchServices/indexes@2025-05-01' = {
  parent: searchService
  name: 'knowledge-base'
  properties: {
    fields: [
      { name: 'id', type: 'Edm.String', key: true, filterable: true, retrievable: true, searchable: false, sortable: false, facetable: false }
      { name: 'content', type: 'Edm.String', searchable: true, analyzerName: 'standard.lucene', filterable: false, retrievable: true, sortable: false, facetable: false, key: false }
      { name: 'title', type: 'Edm.String', searchable: true, filterable: true, retrievable: true, sortable: false, facetable: false, key: false }
      { name: 'sourceType', type: 'Edm.String', searchable: false, filterable: true, facetable: true, retrievable: true, sortable: false, key: false }
      { name: 'sourceId', type: 'Edm.String', searchable: false, filterable: true, retrievable: true, sortable: false, facetable: false, key: false }
      { name: 'projectId', type: 'Edm.String', searchable: false, filterable: true, retrievable: true, sortable: false, facetable: false, key: false }
      { name: 'fileName', type: 'Edm.String', searchable: false, filterable: true, retrievable: true, sortable: false, facetable: false, key: false }
      { name: 'uploadedBy', type: 'Edm.String', searchable: false, filterable: true, retrievable: true, sortable: false, facetable: false, key: false }
      { name: 'uploadedAt', type: 'Edm.DateTimeOffset', filterable: true, sortable: true, retrievable: true, searchable: false, facetable: false, key: false }
      {
        name: 'embedding'
        type: 'Collection(Edm.Single)'
        searchable: true
        retrievable: false
        filterable: false
        sortable: false
        facetable: false
        key: false
        dimensions: 1536
        vectorSearchProfile: 'default-profile'
      }
    ]
    vectorSearch: {
      algorithms: [
        {
          name: 'hnsw-algorithm'
          kind: 'hnsw'
          hnswParameters: {
            metric: 'cosine'
            m: 4
            efConstruction: 400
            efSearch: 500
          }
        }
      ]
      profiles: [
        {
          name: 'default-profile'
          algorithm: 'hnsw-algorithm'
        }
      ]
    }
    semantic: {
      defaultConfiguration: 'default-semantic'
      configurations: [
        {
          name: 'default-semantic'
          prioritizedFields: {
            titleField: { fieldName: 'title' }
            contentFields: [
              { fieldName: 'content' }
            ]
          }
        }
      ]
    }
  }
}

@description('Resource ID of the Search service')
output searchServiceId string = searchService.id

// WARNING: outputs-should-not-contain-secrets — accepted because this value flows
// directly into Key Vault (key-vault module). Not exposed as a top-level template output.
@description('Admin key for the Search service')
output searchAdminKey string = searchService.listAdminKeys().primaryKey
