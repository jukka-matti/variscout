// api/projects/index.ts

import { Client } from '@microsoft/microsoft-graph-client';

// NOTE: This usually needs to be wrapped in an Azure Function handler
export async function listProjects(context: any, graphClient: Client) {
  // List files in VaRiScout folder on OneDrive
  const response = await graphClient
    .api('/me/drive/root:/VaRiScout/Projects:/children')
    .filter('file ne null')
    .select('id,name,lastModifiedDateTime,lastModifiedBy,size')
    .orderby('lastModifiedDateTime desc')
    .get();

  return response.value.map((file: any) => ({
    id: file.id,
    name: file.name.replace('.vrs', ''),
    modified: file.lastModifiedDateTime,
    modifiedBy: file.lastModifiedBy?.user?.displayName,
  }));
}

export async function saveProject(
  graphClient: Client,
  name: string,
  content: object,
  location: string
) {
  const basePath =
    location === 'team'
      ? '/sites/VaRiScout/Shared Documents/Projects'
      : '/me/drive/root:/VaRiScout/Projects';

  return await graphClient.api(`${basePath}/${name}.vrs:/content`).put(JSON.stringify(content));
}
