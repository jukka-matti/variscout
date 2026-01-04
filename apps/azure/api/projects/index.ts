import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';

// Graph Client Factory using On-Behalf-Of flow (mocked for now as we need token)
const getGraphClient = (accessToken: string) => {
  return Client.init({
    authProvider: done => {
      done(null, accessToken);
    },
  });
};

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    context.res = { status: 401, body: 'Unauthorized: Missing Access Token' };
    return;
  }

  const token = authHeader.split(' ')[1];
  const graphClient = getGraphClient(token);

  try {
    if (req.method === 'GET') {
      // List Projects
      const response = await graphClient
        .api('/me/drive/root:/VaRiScout/Projects:/children')
        .filter('file ne null')
        .select('id,name,lastModifiedDateTime,lastModifiedBy,size')
        .orderby('lastModifiedDateTime desc')
        .get();

      const projects = response.value.map((file: any) => ({
        id: file.id,
        name: file.name.replace('.vrs', ''),
        modified: file.lastModifiedDateTime,
        modifiedBy: file.lastModifiedBy?.user?.displayName,
      }));

      context.res = { body: projects };
    } else if (req.method === 'POST') {
      // Save Project
      const { name, content, location } = req.body;
      const basePath =
        location === 'team'
          ? '/sites/VaRiScout/Shared Documents/Projects'
          : '/me/drive/root:/VaRiScout/Projects';

      const response = await graphClient
        .api(`${basePath}/${name}.vrs:/content`)
        .put(JSON.stringify(content));

      context.res = { body: { id: response.id, status: 'saved' } };
    }
  } catch (error: any) {
    context.log.error('API Error', error);
    context.res = {
      status: 500,
      body: { error: error.message || 'Internal Server Error' },
    };
  }
};

export default httpTrigger;
