@description('Azure region for deployment')
param location string

@description('Name for the App Service Plan')
param appServicePlanName string

@description('Name for the Web App')
param webAppName string

@description('Client ID of the Azure AD App Registration')
param clientId string

@description('Client secret of the Azure AD App Registration')
@secure()
param clientSecret string

@description('URL to the VariScout application deployment package')
param packageUrl string

@description('AI endpoint URL')
param aiEndpoint string

@description('App Insights connection string')
param appInsightsConnectionString string

@description('Search service name (for URL construction)')
param searchServiceName string

@description('AI Search index name')
param aiSearchIndex string

@description('Storage Account name for Blob Storage')
param storageAccountName string = ''

@description('Storage container name')
param storageContainerName string = 'variscout-projects'

var tags = {
  product: 'VariScout'
  managedBy: 'AzureMarketplace'
}

resource appServicePlan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: appServicePlanName
  location: location
  tags: tags
  kind: 'linux'
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
  properties: {
    reserved: true
  }
}

resource webApp 'Microsoft.Web/sites@2024-04-01' = {
  name: webAppName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  tags: tags
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|22-lts'
      appSettings: [
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: packageUrl
        }
        {
          name: 'VITE_LICENSE_TIER'
          value: 'enterprise'
        }
        {
          name: 'MICROSOFT_PROVIDER_AUTHENTICATION_SECRET'
          value: clientSecret
        }
        {
          name: 'AI_ENDPOINT'
          value: aiEndpoint
        }
        {
          name: 'AI_SEARCH_ENDPOINT'
          value: 'https://${searchServiceName}.search.windows.net'
        }
        {
          name: 'AI_SEARCH_INDEX'
          value: aiSearchIndex
        }
        {
          name: 'AI_SEARCH_KB_INDEX'
          value: 'knowledge-base'
        }
        {
          name: 'AI_EMBEDDING_DEPLOYMENT'
          value: 'embeddings'
        }
        {
          name: 'STORAGE_ACCOUNT_NAME'
          value: storageAccountName
        }
        {
          name: 'STORAGE_CONTAINER_NAME'
          value: storageContainerName
        }
        {
          name: 'VITE_APPINSIGHTS_CONNECTION_STRING'
          value: appInsightsConnectionString
        }
      ]
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
    }
  }
}

resource authSettings 'Microsoft.Web/sites/config@2024-04-01' = {
  parent: webApp
  name: 'authsettingsV2'
  properties: {
    platform: {
      enabled: true
    }
    globalValidation: {
      requireAuthentication: true
      unauthenticatedClientAction: 'RedirectToLoginPage'
      redirectToProvider: 'azureactivedirectory'
      excludedPaths: [
        '/health'
        '/config'
      ]
    }
    identityProviders: {
      azureActiveDirectory: {
        enabled: true
        registration: {
          openIdIssuer: '${environment().authentication.loginEndpoint}${subscription().tenantId}/v2.0'
          clientId: clientId
          clientSecretSettingName: 'MICROSOFT_PROVIDER_AUTHENTICATION_SECRET'
        }
        login: {
          loginParameters: [
            'scope=openid profile email User.Read People.Read'
          ]
        }
      }
    }
    login: {
      tokenStore: {
        enabled: true
      }
    }
  }
}

@description('Resource ID of the Web App')
output webAppId string = webApp.id

@description('Default hostname of the Web App')
output defaultHostName string = webApp.properties.defaultHostName

@description('Principal ID of the Web App managed identity')
output principalId string = webApp.identity.principalId
