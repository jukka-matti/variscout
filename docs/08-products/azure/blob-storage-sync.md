---
tier: stable
purpose: orient
title: 'Blob Storage Sync'
audience: human
category: reference
status: active
layer: L5
---

# Blob Storage Sync

Analysis synchronization with Azure Blob Storage for team collaboration.

> **Azure App.** Blob Storage sync is included in the single €120/month SKU. PWA uses local storage only (IndexedDB + `.vrs` file export).

---

## Overview

Azure App projects are stored in an Azure Blob Storage container provisioned in the customer's own resource group. This replaces the previous OneDrive/SharePoint sync (ADR-016, superseded by ADR-059) and provides:

- **Zero Graph API permissions** — uses Azure RBAC instead
- **No admin consent** — access managed via standard Azure role assignments
- **Customer data sovereignty** — storage account is in the customer's Azure subscription
- **Simple conflict detection** — ETag-based optimistic concurrency

---

## Storage Structure

```
Storage Account: variscout{uniquestring}
└── Container: variscout-projects
    ├── {projectId}/
    │   ├── analysis.json        (project data + stats)
    │   ├── metadata.json        (name, owner, updated, phase)
    │   ├── knowledge-index.json (Knowledge Catalyst index — Phase 2+, ADR-060)
    │   ├── photos/
    │   │   └── {findingId}/
    │   │       └── {photoId}.jpg
    │   ├── documents/           (uploaded reference documents: SOPs, specs, FMEAs)
    │   └── investigation/       (serialized findings, questions, ideas, conclusions — JSONL for Knowledge Catalyst indexing, Phase 2+)
    └── _index.json              (project listing cache)
```

### File Formats

| File                    | Content                                                                                     | Size (typical) |
| ----------------------- | ------------------------------------------------------------------------------------------- | -------------- |
| `analysis.json`         | Full project data (parsed rows, stats, findings, questions, improvement state)              | 100KB – 5MB    |
| `metadata.json`         | Lightweight project metadata (name, owner, updated, phase, finding counts)                  | <1KB           |
| `knowledge-index.json`  | Knowledge Catalyst index (chunks + embeddings, Phase 2+, ADR-060)                           | 1MB – 20MB     |
| `_index.json`           | Array of project metadata for fast listing                                                  | <10KB          |
| `{photoId}.jpg`         | EXIF/GPS-stripped photo evidence                                                            | 100KB – 2MB    |
| `documents/{file}`      | Uploaded reference documents (SOPs, specs, FMEAs) for Knowledge Catalyst (Phase 2+)         | Varies         |
| `investigation/*.jsonl` | Serialized findings, questions, ideas, conclusions (JSONL for Knowledge Catalyst, Phase 2+) | <500KB         |

---

## Access Pattern

### R6e Server-Enforced Storage Flow

Browser code calls same-origin APIs on the App Service. The server validates the EasyAuth session, applies the R6c document access model, then accesses Blob Storage with the App Service managed identity:

```
Browser → same-origin storage API
    → App Service validates Entra ID session (EasyAuth middleware)
    → App Service checks document access (Lead / Member / Sponsor roster, or private quick analysis owner)
    → App Service managed identity reads/writes Azure Blob Storage
    → Returns only the authorized document payload or metadata
```

The browser must not receive a broad container-scoped SAS for project data. Any narrowly scoped signed URL used for a non-project artifact must be short-lived, path-specific, and issued only after the same access check.

### Server Storage Controls

| Control        | Value                                                    |
| -------------- | -------------------------------------------------------- |
| Access unit    | R6 `DocumentSnapshot` document identity                  |
| Authorization  | Server-side R6c access model before list/read/write      |
| Storage auth   | App Service managed identity + Azure RBAC in production  |
| Browser tokens | No broad project-data container SAS                      |
| Local dev/test | `AZURE_STORAGE_CONNECTION_STRING` / Shared Key path only |

### Access Control

Access to the Blob Storage container is managed via Azure RBAC:

| Role                            | Who                          | Access                                     |
| ------------------------------- | ---------------------------- | ------------------------------------------ |
| `Storage Blob Data Contributor` | App Service managed identity | Server-side document list/read/write       |
| Reader/Contributor roles        | Customer IT / operators      | Optional portal operations outside the app |

Customer IT manages access through standard Azure Portal → IAM → Role assignments — the same mechanism used for all Azure resources.

---

## Sync Behavior

### Save Flow

1. User clicks Save (or auto-save triggers after 2s debounce)
2. Write to IndexedDB (local cache, immediate)
3. Call same-origin save API with the active document identity and snapshot payload
4. Server authorizes the caller, reads the current Blob ETag, and writes `analysis.json` with `If-Match: <etag>` condition
5. If 412 (Precondition Failed) → save a conflict copy or show the existing conflict path
6. Update authorized listing metadata

### Load Flow

1. Call same-origin list API; server returns only documents the caller may access
2. User selects project → same-origin load API validates access and fetches `analysis.json`
3. Cache in IndexedDB for fast subsequent loads
4. Display project data

### Conflict Resolution

No silent last-write-wins:

- Each save includes `If-Match: <etag>` on the document blob
- If another user saved since last load → HTTP 412 (Precondition Failed)
- The app saves a conflict copy or surfaces the existing conflict path before the user decides what to keep
- Force overwrite must be an explicit user action, not the default write behavior

---

## Photo Evidence

### Capture

Photos are captured via standard browser APIs:

```html
<input type="file" accept="image/*" capture="environment" />
```

- Opens native camera on mobile (iOS/Android)
- Falls back to file picker on desktop
- No SDK dependency

### Processing (Client-Side)

1. Canvas re-encode (strips most metadata)
2. Byte-level EXIF/GPS removal (23 unit tests)
3. Resize if > 2048px on longest side
4. Upload to Blob Storage at `{projectId}/photos/{findingId}/{photoId}.jpg`

### Storage

Photos are stored alongside project data in the same container. No separate SharePoint library needed.

---

## Infrastructure

### ARM Template Resources (Team Plan)

| Resource        | Configuration                                                        |
| --------------- | -------------------------------------------------------------------- |
| Storage Account | `variscout{uniquestring(resourceGroup().id)}`, Standard_LRS, TLS 1.2 |
| Blob Container  | `variscout-projects`, private access level                           |
| RBAC Assignment | `Storage Blob Data Contributor` → App Service managed identity       |

After R6e, production storage should disable Shared Key access where supported (`allowSharedKeyAccess: false`). If an existing deployment cannot disable it immediately, enforce an Azure Policy / audit path that detects Shared Key-enabled storage accounts and tracks remediation toward disabling it. Storage account connection strings are local-dev/test-only and must not be required by production App Service configuration.

### App Service Endpoint

| Route family             | Method   | Purpose                                                       |
| ------------------------ | -------- | ------------------------------------------------------------- |
| Same-origin storage APIs | GET/POST | Authorized document list/load/save backed by managed identity |

Implemented in `apps/azure/server.js`.

---

## Migration from OneDrive Sync

ADR-059 replaces the previous OneDrive/SharePoint sync architecture (ADR-016). Key differences:

| Aspect              | Previous (OneDrive/SP)                | Current (Blob Storage)                                                               |
| ------------------- | ------------------------------------- | ------------------------------------------------------------------------------------ |
| API                 | Microsoft Graph API                   | Same-origin App Service APIs backed by Azure Blob Storage                            |
| Permissions         | `Files.ReadWrite.All` (admin consent) | Azure RBAC (no Graph API)                                                            |
| Admin consent       | Required                              | Not required                                                                         |
| Conflict resolution | Optimistic merge + eTag               | ETag/`If-Match` conflict path                                                        |
| Photo storage       | SharePoint document library           | Blob container subdirectory                                                          |
| Access control      | Graph API delegated permissions       | EasyAuth identity + R6c document access model + Azure RBAC for server storage access |

No existing customers to migrate — this is a pre-launch architecture change.

---

## See Also

- [Authentication](authentication.md)
- [ADR-059: Web-First Deployment Architecture](../../07-decisions/adr-059-web-first-deployment-architecture.md)
- [ARM Template](arm-template.md)
