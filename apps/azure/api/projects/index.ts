import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';

// Types
interface ProjectListItem {
  id: string;
  name: string;
  modified: string;
  modifiedBy?: string;
  size?: number;
  location: 'team' | 'personal';
}

interface SaveProjectRequest {
  name: string;
  content: any;
  location: 'team' | 'personal';
  etag?: string; // For conflict detection
}

// Graph Client Factory using On-Behalf-Of flow
const getGraphClient = (accessToken: string) => {
  return Client.init({
    authProvider: done => {
      done(null, accessToken);
    },
  });
};

// Get the base path for the storage location
function getBasePath(location: 'team' | 'personal'): string {
  if (location === 'team') {
    // SharePoint site - in production, this would come from env config
    return '/sites/root/drive/root:/VaRiScout/Projects';
  }
  return '/me/drive/root:/VaRiScout/Projects';
}

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  // Validate authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    context.res = {
      status: 401,
      body: { error: 'Unauthorized: Missing or invalid access token' },
    };
    return;
  }

  const token = authHeader.split(' ')[1];
  const graphClient = getGraphClient(token);

  try {
    switch (req.method) {
      case 'GET': {
        // List Projects
        const location = (req.query.location as 'team' | 'personal') || 'personal';
        const basePath = getBasePath(location);

        const response = await graphClient
          .api(`${basePath}:/children`)
          .select('id,name,lastModifiedDateTime,lastModifiedBy,size,eTag')
          .filter("endswith(name, '.vrs')")
          .orderby('lastModifiedDateTime desc')
          .get();

        const projects: ProjectListItem[] = response.value.map((file: any) => ({
          id: file.id,
          name: file.name.replace('.vrs', ''),
          modified: file.lastModifiedDateTime,
          modifiedBy: file.lastModifiedBy?.user?.displayName,
          size: file.size,
          location,
          etag: file.eTag,
        }));

        context.res = {
          status: 200,
          body: projects,
          headers: { 'Content-Type': 'application/json' },
        };
        break;
      }

      case 'POST': {
        // Save Project
        const { name, content, location, etag } = req.body as SaveProjectRequest;

        if (!name || !content) {
          context.res = {
            status: 400,
            body: { error: 'Missing required fields: name, content' },
          };
          return;
        }

        const basePath = getBasePath(location || 'personal');
        const filename = name.endsWith('.vrs') ? name : `${name}.vrs`;

        // Build request with optional conflict detection
        let request = graphClient.api(`${basePath}/${filename}:/content`);

        if (etag) {
          // If etag provided, use If-Match for optimistic concurrency
          request = request.header('If-Match', etag);
        }

        try {
          const response = await request.put(JSON.stringify(content));

          context.res = {
            status: 200,
            body: {
              id: response.id,
              name: response.name.replace('.vrs', ''),
              etag: response.eTag,
              status: 'saved',
            },
            headers: { 'Content-Type': 'application/json' },
          };
        } catch (error: any) {
          // Check for 412 Precondition Failed (conflict)
          if (error.statusCode === 412) {
            context.res = {
              status: 409,
              body: {
                error: 'Conflict: File has been modified',
                code: 'CONFLICT',
              },
            };
            return;
          }
          throw error;
        }
        break;
      }

      case 'DELETE': {
        // Delete Project
        const projectId = req.query.id;
        const location = (req.query.location as 'team' | 'personal') || 'personal';

        if (!projectId) {
          context.res = {
            status: 400,
            body: { error: 'Missing required query parameter: id' },
          };
          return;
        }

        const basePath = getBasePath(location);
        const filename = `${projectId}.vrs`;

        await graphClient.api(`${basePath}/${filename}`).delete();

        context.res = {
          status: 200,
          body: { status: 'deleted' },
          headers: { 'Content-Type': 'application/json' },
        };
        break;
      }

      default:
        context.res = {
          status: 405,
          body: { error: 'Method not allowed' },
        };
    }
  } catch (error: any) {
    context.log.error('API Error:', error);

    // Handle specific Graph API errors
    if (error.statusCode === 404) {
      context.res = {
        status: 404,
        body: { error: 'Project not found' },
      };
      return;
    }

    if (error.statusCode === 403) {
      context.res = {
        status: 403,
        body: { error: 'Access denied to this resource' },
      };
      return;
    }

    context.res = {
      status: error.statusCode || 500,
      body: {
        error: error.message || 'Internal Server Error',
        code: error.code,
      },
    };
  }
};

export default httpTrigger;
