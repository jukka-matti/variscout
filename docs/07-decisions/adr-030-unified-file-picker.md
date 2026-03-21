---
title: 'ADR-030: Unified File Picker (OneDrive v8)'
status: Accepted
date: 2026-03-19
---

# ADR-030: Unified File Picker (OneDrive File Picker v8)

## Status

Accepted

## Context

VariScout's Azure app needs file and folder browsing in four use cases:

1. **KB folder selection** — Settings panel: pick a SharePoint folder to scope Knowledge Base searches
2. **Data import** — Editor empty state: import .csv/.xlsx from SharePoint or local device
3. **Open .vrs project** — Dashboard: open a saved project from SharePoint
4. **Save As** — EditorToolbar: save project to a custom SharePoint location

Previously, KB folder selection used a plain text input for SharePoint URLs. Data import was local-only (`<input type="file">`). SharePoint browsing didn't exist.

### Alternatives Evaluated

| Option                                    | Status                           | Verdict                                                            |
| ----------------------------------------- | -------------------------------- | ------------------------------------------------------------------ |
| `@microsoft/file-browser`                 | Preview (1.0.0-preview.0)        | **Rejected** — unstable API, minimal docs, no production guarantee |
| Microsoft Graph Toolkit `<mgt-file-list>` | Deprecated (retirement Aug 2026) | **Rejected** — approaching EOL                                     |
| OneDrive File Picker v8                   | Official, production-ready       | **Selected**                                                       |

## Decision

Use **OneDrive File Picker v8** as the unified file/folder browsing experience across all four use cases, wrapped in a reusable `useFilePicker` hook.

### How File Picker v8 Works

SharePoint-hosted page at `/_layouts/15/FilePicker.aspx`. Opens as a popup window. Host communicates via `postMessage` + `MessagePort` using a structured command/acknowledge/result protocol.

```
1. Host → popup:  POST form with config JSON + access_token
2. Picker → host: { type: "initialize", channelId }          (via window.postMessage)
3. Host → picker: { type: "activate" }                        (via MessagePort transfer)
4. Picker → host: { type: "command", id, data: { command: "authenticate", resource, type } }
5. Host → picker: { type: "acknowledge", id }
6. Host → picker: { type: "result", id, data: { result: "token", token } }
7. ... (repeat authenticate for different resources)
8. Picker → host: { type: "command", id, data: { command: "pick", items: [...] } }
9. Host → picker: { type: "acknowledge", id }
10. Host → picker: { type: "result", id, data: { result: "success" } }
```

Key capabilities used:

- `typesAndSources.mode: "folders"` — folder-only picking
- `typesAndSources.mode: "files"` + extension filters — file picking
- `entry.sharePoint.byPath` — start at a specific SharePoint site/folder
- `commands.browseThisDevice: { enabled: true }` — local file selection within the picker
- `tray.prompt: "save-as"` — native filename input for Save As
- `theme: "dark"` — matches VariScout dark mode
- `authentication: {}` — required for the picker to request auth tokens from host

### Plan Gating

| Use Case                  | Available On    | Gate                                                               |
| ------------------------- | --------------- | ------------------------------------------------------------------ |
| KB folder selection       | Team only       | `hasKnowledgeBase()` (existing gate)                               |
| Import from SharePoint    | Team            | `hasTeamFeatures()`                                                |
| Open .vrs from SharePoint | Team            | `hasTeamFeatures()`                                                |
| Save As to SharePoint     | Team            | `hasTeamFeatures()`                                                |
| Browse local files (all)  | All Azure plans | Always (native `<input type="file">` or picker's browseThisDevice) |

Standard plan users see only local file browsing options (no SharePoint).

### Token Handling

The picker sends `authenticate` commands with `{ resource, type }`:

- **type: "SharePoint"**: `resource` is a SharePoint site URL. Host calls OBO exchange with scope `{resource}/.default` via `getTokenForResource()`.
- **type: "Graph"** (or undefined): Host calls `getGraphToken()` (existing SSO/OBO/EasyAuth chain).

Both paths reuse the existing `graphToken.ts` infrastructure. A new `getTokenForResource(resource)` function extends the OBO exchange to support dynamic resource-scoped tokens.

### Architecture

```
apps/azure/src/
  hooks/useFilePicker.ts          — Core hook (postMessage protocol, popup lifecycle)
  components/FileBrowseButton.tsx — Reusable button (cloud or local, plan-gated)
  auth/graphToken.ts              — getTokenForResource() added
  services/storage.ts             — downloadFileFromGraph(), saveToCustomLocation()
```

**`useFilePicker`** is a React hook that:

1. Builds picker config JSON from options
2. Opens popup, POSTs config + token via form
3. Handles the postMessage handshake (initialize → activate)
4. Responds to commands via MessagePort (authenticate, pick, close)
5. Returns picked items via `onPick` callback
6. Cleans up on unmount, popup close, or cancel

**`FileBrowseButton`** is a thin UI wrapper that renders:

- A "Browse SharePoint" button (Team plan) calling `useFilePicker().open()`
- An optional "Browse this device" button with native `<input type="file">`

**`handleFile(file: File)`** on `useEditorDataFlow` provides a clean API for programmatic file loading without synthetic event hacks.

### Teams-Specific Considerations

- **Popup support**: Teams tab apps support `window.open()` for popups. The File Picker v8 requires popup or iframe — we use popup for better UX.
- **Auth flow**: Teams SSO token → OBO exchange → resource-scoped token. The picker requests tokens per-resource, and our OBO function handles dynamic scope resolution.
- **Theme sync**: The picker's `theme` option is set from VariScout's `data-theme` attribute.
- **No `microsoftTeams.dialog`**: File Picker v8 is not a Teams dialog — it's a SharePoint-hosted page that uses its own postMessage protocol, independent of the Teams SDK dialog API.

## Consequences

### Positive

- Native SharePoint browsing UX for all file operations — familiar to Microsoft 365 users
- Single integration point (one hook) for four use cases
- Eliminates manual URL entry for KB folder selection (with manual fallback)
- Standard plan users unaffected — only see local file options
- Theme-aware — matches dark/light mode automatically
- Built-in local file browsing via `browseThisDevice` command

### Negative

- Popup-based UX may be blocked by aggressive browser popup blockers
- Depends on SharePoint-hosted page availability (`/_layouts/15/FilePicker.aspx`)
- Token exchange requires OBO function deployment (already deployed for Teams integration)

### Risks

- File Picker v8 is Microsoft's current official solution, but future versions may change the protocol
- The `tray.prompt: "save-as"` mode has limited documentation — may behave differently across SharePoint versions

## References

- [OneDrive File Picker overview](https://learn.microsoft.com/en-us/onedrive/developer/controls/file-pickers/)
- [File Picker v8 configuration schema](https://learn.microsoft.com/en-us/onedrive/developer/controls/file-pickers/v8-schema)
- [Official samples](https://github.com/OneDrive/samples/tree/master/samples/file-picking)
- ADR-026: Knowledge Base SharePoint-First Strategy (updated: folder picker resolved question)
