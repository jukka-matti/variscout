# Blob Storage Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the stubbed cloudSync with Azure Blob Storage, enabling Team plan cloud collaboration without Graph API.

**Architecture:** SAS token flow — browser POSTs to `/api/storage-token` on App Service, receives a 1-hour container-scoped SAS URL, then reads/writes blobs directly. Server.js uses `@azure/storage-blob` SDK with managed identity (prod) or connection string (dev) to generate SAS tokens.

**Tech Stack:** `@azure/storage-blob` (server-side SAS generation), raw `fetch` with SAS URL (client-side), Bicep (infra), Vitest (tests)

---

## File Structure

| File                                                   | Responsibility                                                                |
| ------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `apps/azure/server.js`                                 | `/api/storage-token` endpoint — SAS generation                                |
| `apps/azure/src/services/blobClient.ts`                | **New.** Client-side Blob Storage operations (save, load, list, upload photo) |
| `apps/azure/src/services/cloudSync.ts`                 | Replace stubs with calls to `blobClient.ts`                                   |
| `apps/azure/src/services/storage.ts`                   | Remove `getGraphToken` calls, use `getSasToken()` instead                     |
| `apps/azure/src/services/__tests__/blobClient.test.ts` | **New.** Unit tests for Blob client                                           |
| `apps/azure/src/services/__tests__/storage.test.ts`    | Update cloud sync tests for Blob Storage                                      |
| `apps/azure/src/hooks/usePhotoComments.ts`             | Wire photo upload to Blob Storage                                             |
| `infra/modules/storage.bicep`                          | **New.** Storage Account + container + RBAC                                   |
| `infra/main.bicep`                                     | Add storage module reference                                                  |

---

### Task 1: Server-Side SAS Token Endpoint

**Files:**

- Modify: `apps/azure/server.js`
- Modify: `apps/azure/package.json` (add `@azure/storage-blob` + `@azure/identity`)

- [ ] **Step 1: Add dependencies**

```bash
cd apps/azure
pnpm add @azure/storage-blob @azure/identity
```

- [ ] **Step 2: Add `/api/storage-token` endpoint to server.js**

After the `/config` endpoint (line 111), add the SAS token generation endpoint. The endpoint:

1. Validates the request is authenticated via EasyAuth (checks `X-MS-CLIENT-PRINCIPAL` header, present on all EasyAuth-authenticated requests)
2. Uses `DefaultAzureCredential` (managed identity in prod, `az login` in dev) to get a `UserDelegationKey`
3. Generates a container-scoped SAS token (read + write + list, 1hr expiry)
4. Returns `{ sasUrl, expiresOn }`

For local dev: uses `AZURE_STORAGE_CONNECTION_STRING` env var with `StorageSharedKeyCredential` as fallback.

```js
// After the /config endpoint block:

// SAS token generation for Blob Storage (Team plan cloud sync)
if (pathname === '/api/storage-token' && req.method === 'POST') {
  // EasyAuth injects this header for authenticated requests
  const principal = req.headers['x-ms-client-principal'];
  if (!principal && !process.env.LOCAL_DEV) {
    writeResponse(res, 401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not authenticated' }));
    return;
  }

  try {
    const storageAccount = process.env.STORAGE_ACCOUNT_NAME;
    const containerName = process.env.STORAGE_CONTAINER_NAME || 'variscout-projects';

    if (!storageAccount) {
      writeResponse(res, 503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Blob Storage not configured' }));
      return;
    }

    const {
      BlobServiceClient,
      generateBlobSASQueryParameters,
      ContainerSASPermissions,
      StorageSharedKeyCredential,
      SASProtocol,
    } = await import('@azure/storage-blob');
    const { DefaultAzureCredential } = await import('@azure/identity');

    const blobServiceUrl = `https://${storageAccount}.blob.core.windows.net`;
    const expiresOn = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const startsOn = new Date(Date.now() - 5 * 60 * 1000); // 5 min ago (clock skew)

    let sasUrl;

    // Local dev: use connection string
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (connectionString) {
      const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
      const accountName = blobServiceClient.accountName;
      // Extract account key from connection string
      const keyMatch = connectionString.match(/AccountKey=([^;]+)/);
      if (!keyMatch) throw new Error('AccountKey not found in connection string');
      const sharedKeyCredential = new StorageSharedKeyCredential(accountName, keyMatch[1]);

      const sasToken = generateBlobSASQueryParameters(
        {
          containerName,
          permissions: ContainerSASPermissions.parse('rwl'), // read, write, list
          startsOn,
          expiresOn,
          protocol: SASProtocol.Https,
        },
        sharedKeyCredential
      ).toString();

      sasUrl = `${blobServiceUrl}/${containerName}?${sasToken}`;
    } else {
      // Production: use managed identity + user delegation key
      const credential = new DefaultAzureCredential();
      const blobServiceClient = new BlobServiceClient(blobServiceUrl, credential);
      const delegationKey = await blobServiceClient.getUserDelegationKey(startsOn, expiresOn);

      const sasToken = generateBlobSASQueryParameters(
        {
          containerName,
          permissions: ContainerSASPermissions.parse('rwl'),
          startsOn,
          expiresOn,
          protocol: SASProtocol.Https,
        },
        delegationKey,
        storageAccount
      ).toString();

      sasUrl = `${blobServiceUrl}/${containerName}?${sasToken}`;
    }

    writeResponse(res, 200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    });
    res.end(JSON.stringify({ sasUrl, expiresOn: expiresOn.toISOString() }));
  } catch (err) {
    console.error('[storage-token]', err.message || err);
    writeResponse(res, 500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to generate storage token' }));
  }
  return;
}
```

- [ ] **Step 3: Add storage account to CSP connect-src**

In the `connectSrc` builder section (around line 16), add:

```js
const storageAccount = process.env.STORAGE_ACCOUNT_NAME || '';
if (storageAccount) {
  connectSrc += ` https://${storageAccount}.blob.core.windows.net`;
}
```

- [ ] **Step 4: Add storage env vars to /config endpoint**

Add `storageAccountName` to the config object:

```js
storageAccountName: process.env.STORAGE_ACCOUNT_NAME || '',
storageContainerName: process.env.STORAGE_CONTAINER_NAME || 'variscout-projects',
```

- [ ] **Step 5: Commit**

```bash
git add apps/azure/server.js apps/azure/package.json pnpm-lock.yaml
git commit -m "feat: add /api/storage-token endpoint for Blob Storage SAS generation"
```

---

### Task 2: Client-Side Blob Client

**Files:**

- Create: `apps/azure/src/services/blobClient.ts`
- Create: `apps/azure/src/services/__tests__/blobClient.test.ts`

- [ ] **Step 1: Write failing tests for SAS token fetching and caching**

```typescript
// apps/azure/src/services/__tests__/blobClient.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getSasToken,
  _resetSasCache,
  saveBlobProject,
  loadBlobProject,
  listBlobProjects,
} from '../blobClient';

describe('blobClient', () => {
  beforeEach(() => {
    _resetSasCache();
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => vi.restoreAllMocks());

  describe('getSasToken', () => {
    it('fetches SAS token from /api/storage-token', async () => {
      const mockResponse = {
        sasUrl: 'https://storage.blob.core.windows.net/c?sig=abc',
        expiresOn: new Date(Date.now() + 3600000).toISOString(),
      };
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await getSasToken();
      expect(result.sasUrl).toContain('sig=abc');
      expect(fetch).toHaveBeenCalledWith('/api/storage-token', { method: 'POST' });
    });

    it('returns cached token on second call', async () => {
      const mockResponse = {
        sasUrl: 'https://x.blob.core.windows.net/c?sig=abc',
        expiresOn: new Date(Date.now() + 3600000).toISOString(),
      };
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await getSasToken();
      await getSasToken();
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('re-fetches when token is about to expire (< 5 min)', async () => {
      const nearExpiry = {
        sasUrl: 'https://x.blob.core.windows.net/c?sig=old',
        expiresOn: new Date(Date.now() + 2 * 60000).toISOString(),
      };
      const fresh = {
        sasUrl: 'https://x.blob.core.windows.net/c?sig=new',
        expiresOn: new Date(Date.now() + 3600000).toISOString(),
      };
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(nearExpiry),
      });
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(fresh),
      });

      await getSasToken();
      const result = await getSasToken();
      expect(result.sasUrl).toContain('sig=new');
    });

    it('throws on 401', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false, status: 401 });
      await expect(getSasToken()).rejects.toThrow('Not authenticated');
    });

    it('throws on 503 (storage not configured)', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false, status: 503 });
      await expect(getSasToken()).rejects.toThrow();
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter @variscout/azure-app test -- --run src/services/__tests__/blobClient.test.ts
```

Expected: FAIL — `blobClient` module doesn't exist yet.

- [ ] **Step 3: Implement blobClient.ts**

```typescript
// apps/azure/src/services/blobClient.ts
// Client-side Azure Blob Storage operations using SAS URLs.
// No SDK on the client — raw fetch against Blob REST API with SAS token.

import type { ProjectMetadata } from '@variscout/core';
import type { Project } from './localDb';

// ── SAS Token Management ──────────────────────────────────────────────

interface SasTokenResponse {
  sasUrl: string;
  expiresOn: string;
}

let cachedSas: SasTokenResponse | null = null;

const SAS_REFRESH_MARGIN_MS = 5 * 60 * 1000; // Refresh 5 min before expiry

export function _resetSasCache(): void {
  cachedSas = null;
}

export async function getSasToken(): Promise<SasTokenResponse> {
  if (cachedSas) {
    const expiresAt = new Date(cachedSas.expiresOn).getTime();
    if (expiresAt - Date.now() > SAS_REFRESH_MARGIN_MS) {
      return cachedSas;
    }
  }

  const res = await fetch('/api/storage-token', { method: 'POST' });
  if (!res.ok) {
    if (res.status === 401) throw new Error('Not authenticated');
    if (res.status === 503) throw new Error('Blob Storage not configured');
    throw new Error(`SAS token request failed: ${res.status}`);
  }

  cachedSas = await res.json();
  return cachedSas!;
}

// ── Blob URL Helpers ──────────────────────────────────────────────────

function blobUrl(sasUrl: string, blobPath: string): string {
  // sasUrl is "https://account.blob.core.windows.net/container?sig=..."
  const [baseWithContainer, queryString] = sasUrl.split('?');
  return `${baseWithContainer}/${blobPath}?${queryString}`;
}

// ── Project Operations ────────────────────────────────────────────────

export interface BlobProjectMetadata {
  id: string;
  name: string;
  owner: string;
  updated: string;
  phase: string;
  findingCounts?: Record<string, number>;
  questionCounts?: Record<string, number>;
  actionCounts?: { total: number; completed: number; overdue: number };
}

export async function saveBlobProject(
  project: Project,
  projectId: string,
  metadata: BlobProjectMetadata
): Promise<{ etag: string }> {
  const { sasUrl } = await getSasToken();

  // Write analysis.json
  const analysisUrl = blobUrl(sasUrl, `${projectId}/analysis.json`);
  const analysisRes = await fetch(analysisUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-ms-blob-type': 'BlockBlob',
    },
    body: JSON.stringify(project),
  });
  if (!analysisRes.ok) throw new Error(`Blob save failed: ${analysisRes.status}`);

  // Write metadata.json with ETag for conflict detection
  const metaUrl = blobUrl(sasUrl, `${projectId}/metadata.json`);
  const metaRes = await fetch(metaUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-ms-blob-type': 'BlockBlob',
    },
    body: JSON.stringify(metadata),
  });
  if (!metaRes.ok) throw new Error(`Blob metadata save failed: ${metaRes.status}`);

  const etag = metaRes.headers.get('etag') || '';
  return { etag };
}

export async function loadBlobProject(projectId: string): Promise<Project | null> {
  const { sasUrl } = await getSasToken();
  const url = blobUrl(sasUrl, `${projectId}/analysis.json`);

  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Blob load failed: ${res.status}`);

  return res.json();
}

export async function loadBlobMetadata(projectId: string): Promise<BlobProjectMetadata | null> {
  const { sasUrl } = await getSasToken();
  const url = blobUrl(sasUrl, `${projectId}/metadata.json`);

  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Blob metadata load failed: ${res.status}`);

  return res.json();
}

export async function listBlobProjects(): Promise<BlobProjectMetadata[]> {
  const { sasUrl } = await getSasToken();
  const indexUrl = blobUrl(sasUrl, '_index.json');

  const res = await fetch(indexUrl);
  if (res.status === 404) return []; // No projects yet
  if (!res.ok) throw new Error(`Blob list failed: ${res.status}`);

  return res.json();
}

export async function updateBlobIndex(projects: BlobProjectMetadata[]): Promise<void> {
  const { sasUrl } = await getSasToken();
  const url = blobUrl(sasUrl, '_index.json');

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-ms-blob-type': 'BlockBlob',
    },
    body: JSON.stringify(projects),
  });
  if (!res.ok) throw new Error(`Blob index update failed: ${res.status}`);
}

export async function saveBlobPhoto(
  projectId: string,
  findingId: string,
  photoId: string,
  blob: Blob
): Promise<string> {
  const { sasUrl } = await getSasToken();
  const path = `${projectId}/photos/${findingId}/${photoId}.jpg`;
  const url = blobUrl(sasUrl, path);

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'image/jpeg',
      'x-ms-blob-type': 'BlockBlob',
    },
    body: blob,
  });
  if (!res.ok) throw new Error(`Blob photo upload failed: ${res.status}`);

  // Return the URL without SAS for storage reference
  const [baseWithContainer] = sasUrl.split('?');
  return `${baseWithContainer}/${path}`;
}

export async function getEtagForProject(projectId: string): Promise<string | null> {
  const { sasUrl } = await getSasToken();
  const url = blobUrl(sasUrl, `${projectId}/metadata.json`);

  const res = await fetch(url, { method: 'HEAD' });
  if (res.status === 404) return null;
  if (!res.ok) return null;

  return res.headers.get('etag');
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm --filter @variscout/azure-app test -- --run src/services/__tests__/blobClient.test.ts
```

Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/services/blobClient.ts apps/azure/src/services/__tests__/blobClient.test.ts
git commit -m "feat: add blobClient for client-side Blob Storage operations"
```

---

### Task 3: Wire cloudSync to Blob Client

**Files:**

- Modify: `apps/azure/src/services/cloudSync.ts`
- Modify: `apps/azure/src/services/storage.ts`
- Modify: `apps/azure/src/services/__tests__/storage.test.ts`

- [ ] **Step 1: Replace cloudSync stubs with blobClient calls**

Replace the stub functions in `cloudSync.ts`. Keep types and error classes. The key changes:

- `saveToCloud` → calls `saveBlobProject()` + `updateBlobIndex()`
- `loadFromCloud` → calls `loadBlobProject()`
- `listFromCloud` → calls `listBlobProjects()`
- `getCloudModifiedDate` → calls `loadBlobMetadata()` → return `.updated`
- `saveSidecarToCloud` → no-op (metadata is now written atomically with save)
- Remove `CloudSyncUnavailableError` throws — functions now work
- First param changes from `_token: string` to no token (SAS managed internally)

Note: The `token` parameter stays in the function signature for backward compatibility with `storage.ts` callers — it's just ignored internally.

- [ ] **Step 2: Update storage.ts — replace getGraphToken with getSasToken validation**

In `storage.ts`:

- Remove `import { getGraphToken } from '../auth/graphToken'`
- The `saveProject` cloud path currently calls `const token = await getGraphToken()` — replace with `const token = 'sas'` (a dummy value since cloudSync now manages SAS internally)
- Same for `loadProject` and `listProjects` — remove `getGraphToken` calls, pass dummy token
- Remove the merge/conflict logic that used `baseStateJson` (Blob Storage uses simpler ETag-based conflict detection)
- Keep the `CloudSyncUnavailableError` catch paths (they serve as fallback if storage is not configured)

- [ ] **Step 3: Update storage tests for Blob Storage behavior**

Update `storage.test.ts` — the ADR-059 degradation tests should now test real Blob sync behavior. Mock `blobClient` functions instead of `cloudSync` stubs.

- [ ] **Step 4: Run all tests**

```bash
pnpm --filter @variscout/azure-app test -- --run
```

Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/services/cloudSync.ts apps/azure/src/services/storage.ts apps/azure/src/services/__tests__/storage.test.ts
git commit -m "feat: wire cloudSync to Blob Storage client (replaces Graph API stubs)"
```

---

### Task 4: Photo Upload to Blob Storage

**Files:**

- Modify: `apps/azure/src/hooks/usePhotoComments.ts`
- Modify: `apps/azure/src/hooks/__tests__/usePhotoComments.test.ts`

- [ ] **Step 1: Wire photo upload to blobClient**

In `usePhotoComments.ts`, after the photo processing step (EXIF strip + thumbnail), call `saveBlobPhoto()` if Team plan:

```typescript
import { saveBlobPhoto } from '../services/blobClient';
import { hasTeamFeatures } from '@variscout/core';

// In handleAddPhoto, after processPhoto():
if (hasTeamFeatures() && navigator.onLine) {
  try {
    const photoBlob = await fetch(processed.thumbnailDataUrl).then(r => r.blob());
    const remoteUrl = await saveBlobPhoto(analysisId, findingId, photo.id, photoBlob);
    findingsState.updatePhotoStatus(findingId, commentId, photo.id, 'uploaded', remoteUrl);
  } catch {
    // Keep local-only status if upload fails
    findingsState.updatePhotoStatus(
      findingId,
      commentId,
      photo.id,
      'uploaded',
      `local-${Date.now()}`
    );
  }
} else {
  findingsState.updatePhotoStatus(
    findingId,
    commentId,
    photo.id,
    'uploaded',
    `local-${Date.now()}`
  );
}
```

- [ ] **Step 2: Update test**

Add test case for Blob upload path. Mock `saveBlobPhoto`.

- [ ] **Step 3: Run tests**

```bash
pnpm --filter @variscout/azure-app test -- --run src/hooks/__tests__/usePhotoComments.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add apps/azure/src/hooks/usePhotoComments.ts apps/azure/src/hooks/__tests__/usePhotoComments.test.ts
git commit -m "feat: wire photo upload to Blob Storage for Team plan"
```

---

### Task 5: Infrastructure — Bicep Storage Module

**Files:**

- Create: `infra/modules/storage.bicep`
- Modify: `infra/main.bicep`

- [ ] **Step 1: Create storage.bicep module**

```bicep
// infra/modules/storage.bicep
metadata description = 'Storage Account + Blob container for Team plan project sync'

@description('Azure region')
param location string = resourceGroup().location

@description('App Service principal ID for RBAC assignment')
param appServicePrincipalId string

var storageAccountName = 'variscout${uniqueString(resourceGroup().id)}'
var containerName = 'variscout-projects'

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageAccountName
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    supportsHttpsTrafficOnly: true
    accessTier: 'Hot'
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: storageAccount
  name: 'default'
}

resource container 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobService
  name: containerName
  properties: {
    publicAccess: 'None'
  }
}

// RBAC: Storage Blob Data Contributor for App Service managed identity
resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccount.id, appServicePrincipalId, 'ba92f5b4-2d11-453d-a403-e96b0029c9fe')
  scope: storageAccount
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'ba92f5b4-2d11-453d-a403-e96b0029c9fe') // Storage Blob Data Contributor
    principalId: appServicePrincipalId
    principalType: 'ServicePrincipal'
  }
}

output storageAccountName string = storageAccount.name
output containerName string = containerName
```

- [ ] **Step 2: Add storage module to main.bicep**

Add after the existing module references (around line 90), conditional on `hasTeamFeatures`:

```bicep
var hasTeamFeatures = variscoutPlan == 'team'

module storage 'modules/storage.bicep' = if (hasTeamFeatures) {
  name: 'storage'
  params: {
    location: location
    appServicePrincipalId: appService.outputs.principalId
  }
}
```

Add `STORAGE_ACCOUNT_NAME` and `STORAGE_CONTAINER_NAME` to the App Service app settings (in `modules/app-service.bicep` or inline in `main.bicep`):

```bicep
// In app settings:
STORAGE_ACCOUNT_NAME: hasTeamFeatures ? storage.outputs.storageAccountName : ''
STORAGE_CONTAINER_NAME: hasTeamFeatures ? storage.outputs.containerName : ''
```

Also ensure the App Service has `identity: { type: 'SystemAssigned' }` and export `principalId` from the app-service module.

- [ ] **Step 3: Commit**

```bash
git add infra/modules/storage.bicep infra/main.bicep infra/modules/app-service.bicep
git commit -m "infra: add Storage Account + RBAC for Team plan Blob Storage (ADR-059)"
```

---

### Task 6: Dev Experience — Local Storage Emulator

**Files:**

- Modify: `apps/azure/.env.example` (or create if needed)

- [ ] **Step 1: Document local dev setup**

For local development, developers use Azurite (Azure Storage Emulator) or a real storage account with connection string:

Add to `.env.example`:

```
# Blob Storage (Team plan cloud sync)
# Option A: Azurite local emulator (run `npx azurite-blob` in another terminal)
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1
# Option B: Real Azure Storage Account
# STORAGE_ACCOUNT_NAME=your-storage-account
# AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net
```

- [ ] **Step 2: Commit**

```bash
git add apps/azure/.env.example
git commit -m "docs: add local dev setup for Blob Storage (Azurite)"
```

---

### Task 7: Build + Full Test Verification

- [ ] **Step 1: TypeScript compilation**

```bash
npx tsc --noEmit -p apps/azure/tsconfig.json
```

Expected: 0 errors.

- [ ] **Step 2: Full build**

```bash
pnpm build
```

Expected: All 5 packages build successfully.

- [ ] **Step 3: Full test suite**

```bash
pnpm test
```

Expected: All tests pass across all 7 packages.

- [ ] **Step 4: Verify no remaining stubs**

```bash
grep -r "CloudSyncUnavailableError" apps/azure/src/services/cloudSync.ts
```

Expected: Only the class definition (not thrown in any stub).

```bash
grep -r "Blob Storage migration pending" apps/azure/src/
```

Expected: No matches (all migration-pending messages removed).

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: final cleanup for Blob Storage integration"
```
