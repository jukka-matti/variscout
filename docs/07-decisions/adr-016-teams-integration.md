# ADR-016: Microsoft Teams Integration

**Status**: Accepted

**Date**: 2026-02-27

**Related**: ADR-007 (marketplace distribution), ADR-015 (investigation board)

---

## Context

VariScout is a Managed Application deployed to the customer's Azure tenant. Quality teams need mobile access for gemba investigations — photo evidence, chart sharing, commenting on findings. Microsoft Teams is the natural collaboration layer for M365 organizations.

Desktop-only tools (Minitab, JMP) cannot offer mobile collaboration. Teams is where M365 orgs already collaborate, and VariScout's web app naturally works in Teams WebView. The Managed Application model preserves data sovereignty — all data stays in the customer's tenant.

The current findings system (ADR-015) is text-only with no photos and no author tracking. Field engineers investigating variation on the shop floor need to capture visual evidence and share it with the team — but switching between a camera app, a file share, and the analysis tool breaks the investigation flow.

Without Teams integration:

- Engineers use separate apps for photos, notes, and analysis — context is fragmented
- Sharing a finding requires screenshots + manual copy-paste into Teams chat
- Mobile access means opening the browser, navigating to the URL, and losing the Teams collaboration context
- No author tracking on findings or comments — unclear who observed what

---

## Decision

**Adopt Microsoft Teams SDK with a progressive enhancement model.**

The same codebase detects its runtime context and adapts behavior accordingly:

```
Teams SDK initialized?
├── Yes → Channel tab? → shared channel SharePoint storage
│       → Personal tab? → personal OneDrive
└── No  → Browser mode → local files (File System Access API)
```

### Two Deployment Profiles

| Capability    | Standard (Browser)                   | Team (Teams-Integrated)                                               |
| ------------- | ------------------------------------ | --------------------------------------------------------------------- |
| Auth          | EasyAuth redirect                    | Teams SSO (On-Behalf-Of)                                              |
| Storage       | Local files (File System Access API) | + OneDrive personal + Channel SharePoint                              |
| Sharing       | Copy URL                             | URL sharing (Teams native dialog) + deep links                        |
| Mobile        | Mobile browser                       | Teams mobile (sidebar icon)                                           |
| Photos        | N/A                                  | Camera capture + channel storage                                      |
| Permissions   | `User.Read` only                     | + `Files.ReadWrite` + `Files.ReadWrite.All` + `Channel.ReadBasic.All` |
| Admin consent | None                                 | Required (one-time, tenant-wide)                                      |

### Admin Consent Model

`Files.ReadWrite.All` is a delegated permission requiring one-time, tenant-wide admin approval. It does NOT grant new file access — it allows the app to access files the signed-in user already has access to. Per-channel scoping is enforced by Teams membership (natural access control).

> Note: Microsoft Graph does not offer a "write without delete" scope. `Files.ReadWrite.All` includes delete capability, but VariScout never exercises it — the app's storage model is strictly additive (see Security Considerations).

IT admin flow: Azure AD → Enterprise Apps → VariScout → Grant admin consent.

Conditional Access recommendations for IT admins:

- Require managed devices for channel file access (BYOD policy)
- Enforce MFA for VariScout app registration
- Restrict to specific security groups if needed

### Data Model Extensions

`FindingComment` in `packages/core/src/findings.ts` gains optional fields:

```typescript
// FindingComment additions
author?: string;              // EasyAuth/Teams user display name
photos?: PhotoAttachment[];   // Attached evidence

// New type
interface PhotoAttachment {
  id: string;
  filename: string;
  driveItemId?: string;       // SharePoint/OneDrive item ID
  thumbnailDataUrl?: string;  // ~50KB base64 embedded for cross-user visibility
  uploadStatus: 'pending' | 'uploaded' | 'failed';
  capturedAt: number;
}
```

The `author` field enables audit trails. The `thumbnailDataUrl` is embedded in the `.vrs` file so other team members see photo previews without needing to fetch from SharePoint — full-resolution images are fetched on demand.

### Channel File Storage Layout

```
Channel Files/VariScout/
  ├── Projects/
  │   └── Feb-Fill-Line.vrs           ← shared analysis (JSON)
  └── Photos/
      └── {analysisId}/{findingId}/
          ├── photo-001.jpg           ← full-res (Engineer A)
          └── photo-002.jpg           ← full-res (Engineer B)
```

Projects are stored as `.vrs` files (JSON) in the channel's SharePoint document library. Photos are stored alongside in a structured folder hierarchy. This keeps all data within the channel's existing access control.

### Concurrent Access Strategy

Optimistic merge for additive operations:

- New finding, new comment, status change, photo upload — all merge cleanly
- Before saving: fetch latest version, compare with local base, auto-merge non-conflicting changes
- Conflict detection via `eTag` / `lastModifiedDateTime` (already used in `storage.ts`)

Unresolvable conflicts (both users edited the same finding text simultaneously):

- Save as `"{name} (conflict copy).vrs"` alongside the original
- Zero data loss guarantee — worst case is a duplicate file the team resolves manually
- Notification toast: "Another team member modified this project. A conflict copy was saved."

### Mobile Layout

The Azure app uses a responsive phone layout (< 640px) within the existing Editor — not a separate route:

- `MobileChartCarousel` — swipeable carousel (4 views: I-Chart, Boxplot, Pareto, Stats) replacing `DashboardGrid` on phones
- Findings panel renders as full-screen overlay on phone, inline sidebar on desktop
- Phone toolbar: Back + project name (truncated) + Save + overflow menu (`EllipsisVertical`)
- Touch-optimized: 44px minimum touch targets, safe area insets for notched phones
- Comment thread with photo capture — Teams SDK `media.selectMedia()` inside Teams (native camera experience), HTML5 file input fallback outside Teams
- Annotations disabled on phone (no right-click context menu on touch devices)

Reuses PWA responsive patterns adapted for Teams mobile WebView. Desktop layout is completely unchanged (all gated by `useIsMobile(640)`).

### Sharing and Adaptive Cards (Implemented)

**URL sharing**: URL sharing via Teams native dialog (`sharing.shareWebContent`) and deep links (`pages.shareDeepLink`). Share payloads built by `shareContent.ts` for findings and charts.

**Adaptive Cards (Implemented)**: When a finding reaches `analyzed` or `resolved` status in a channel tab, an Adaptive Card is automatically posted to the channel via Graph API (`POST /teams/{teamId}/channels/{channelId}/messages`):

- Finding summary card: status badge, Cpk delta, suspected cause or outcome, @mention assignees
- Deep link "View" button: navigates directly into the app to the specific finding
- Uses the same `ChannelMessage.Send` permission and OBO token infrastructure as the @mention workflow (ADR-018)

**Channel @mention**: See [ADR-018](adr-018-channel-mention-workflow.md) for the channel
mention workflow that extends URL sharing with true @mention notifications in channel tabs.

### On-Behalf-Of SSO Flow

An Azure Function (~50 lines) exchanges the Teams SSO token for a Graph API access token:

- Deployed via ARM template alongside the App Service
- Scopes: `User.Read` + `Files.ReadWrite.All`
- Fallback: EasyAuth redirect if OBO exchange fails
- Minimal attack surface — single-purpose token exchange, no stored state

### Security Considerations

- **EXIF/GPS stripping**: Two-layer metadata removal before upload. First, canvas re-encode strips most EXIF data as a side effect. Second, explicit byte-level `stripExifFromBlob` parses the JPEG binary and removes all EXIF/GPS APP1 markers, guaranteeing no location or device metadata survives. Both layers run client-side. Unit tests (23 cases) verify GPS coordinates, camera model, and orientation are stripped from real-world JPEG samples.
- **Tighter personal storage**: `Files.ReadWrite.AppFolder` for personal OneDrive (narrower than `Files.ReadWrite`). Channel storage requires `Files.ReadWrite.All`.
- **Photo immutability**: Photos are immutable once uploaded — no edit or delete of photo files. Prevents evidence tampering in quality investigations.
- **No-delete principle**: `Files.ReadWrite.All` technically includes delete capability, but VariScout never calls Graph API delete endpoints. The storage model is strictly additive — `.vrs` projects are created/updated (conflicts save as copies), photos are immutable once uploaded. IT admins can audit this: the app contains no `DELETE /drive/items/{id}` calls.
- **Audit trail**: Author + timestamp on all findings and comments. Combined with photo immutability, creates a reliable investigation record.
- **`devicePermissions: ["media"]`**: Declaring camera access in the Teams manifest makes usage auditable in the Teams Admin Center. IT admins can see which apps request device access during the app permission review. The HTML5 `capture` attribute, by contrast, works silently with no admin visibility.
- **Font self-hosting**: Recommend self-hosting Google Fonts for strict CSP environments (no external CDN calls).

### IT Compliance Hardening (February 2026)

Four gaps identified during Microsoft best practices audit and fixed:

1. **Reactive Teams theme sync** — `useTeamsContext` hook now re-renders on Teams theme changes via a subscriber pattern. Teams theme (default/dark/contrast) is mapped into `ThemeContext` on initial load and on every change. High-contrast mode maps to `light` (closest safe match).

2. **Dynamic CSP `connect-src`** — `server.js` reads the `FUNCTION_URL` environment variable at startup and includes its origin in the Content Security Policy `connect-src` directive. Without this, OBO token exchange to a separate Azure Function origin was silently blocked by CSP.

3. **`app.notifyFailure()` on crash** — The top-level `ErrorBoundary` in `App.tsx` calls `notifyTeamsFailure()` when a render error is caught. This tells the Teams host that the app has crashed, rather than leaving Teams in a "healthy" state while the user sees a fallback error screen.

4. **`registerBeforeUnloadHandler` for data loss prevention** — During Teams SDK initialization, a lifecycle handler is registered. The Editor registers a callback that auto-saves the project (via `saveProject()`) if `hasUnsavedChanges` is true when the user navigates away from the tab.

### Design Principles

1. **Progressive enhancement, not hard dependency** — Teams SDK features enhance the experience but the app must always work without them. Every Teams API call has a non-Teams fallback. `isTeamsMediaAvailable()` / `isInTeams()` gate all SDK calls.

2. **IT admin visibility over silent access** — Prefer Teams SDK APIs that declare permissions in the manifest (`devicePermissions`, Graph scopes) over HTML5 APIs that work silently. This gives tenant admins an audit trail and consent control.

3. **No creative filters on quality evidence** — Photo capture disables Instagram-style filters (`enableFilter: false`), drawing tools (`ink: false`), and text overlays (`textSticker: false`). Quality evidence must be unaltered.

4. **EXIF stripping is non-negotiable** — Every photo path (Teams SDK, HTML5 file input, gallery pick) feeds into the same `processPhoto()` → `stripExifFromBlob()` pipeline. No photo reaches OneDrive with GPS or device metadata.

5. **Additive-only storage** — No delete calls to Graph API. Photos are immutable once uploaded. Conflicts create copies. This is auditable — the app contains no `DELETE /drive/items/{id}` calls.

### Phased Delivery

| Phase | Scope                                                                              | Dependencies |
| ----- | ---------------------------------------------------------------------------------- | ------------ |
| 1     | Teams SDK foundation — detect context, manifest with personal + channel tabs       | None         |
| 2     | Mobile layout — responsive phone carousel in Editor, touch navigation              | Phase 1      |
| 3     | Photo comments — data model, Teams SDK media API + HTML5 fallback, OneDrive upload | Phase 1      |
| 4     | Channel file storage — shared `.vrs` + photos, optimistic merge                    | Phases 1 + 3 |
| 5     | Deep links + URL sharing — Teams native dialog, chart/finding links                | Phases 1 + 4 |
| 6     | Azure Function for On-Behalf-Of — true silent SSO                                  | Phase 1      |

Phases 2 and 3 can proceed in parallel after Phase 1. Phase 6 can be done at any point after Phase 1 but is lowest priority (EasyAuth fallback works).

---

## Consequences

### Easier

- **Gemba investigations**: Engineers capture photo evidence directly in the analysis tool — no app switching
- **Team collaboration**: Shared channel storage means the team works on the same analysis, not emailed copies
- **Mobile access**: Teams sidebar icon puts VariScout one tap away on any phone
- **Rich sharing**: Adaptive Cards in Teams chat replace screenshot-and-paste workflows
- **Author tracking**: Clear audit trail of who observed what, with timestamps
- **Competitive differentiation**: "Take VariScout to the gemba" — unique vs desktop-only tools

### Harder

- **New dependency**: `@microsoft/teams-js` (~40KB gzipped) added to the Azure app bundle
- **New infrastructure**: Azure Function in ARM template (Phase 6) for OBO token exchange
- **Storage complexity**: `storage.ts` evolves with channel drive branch + optimistic merge logic
- **Auth complexity**: `easyAuth.ts` evolves with Teams SSO detection + OBO token exchange
- **Admin consent**: Team plan requires IT admin approval for `Files.ReadWrite.All` — adds friction to onboarding
- **Concurrent access**: Optimistic merge logic must handle edge cases gracefully (network failures, partial saves)
- **More UI surface**: Mobile Field View, photo capture, Adaptive Card templates — additional components to maintain
- **Testing**: Teams WebView testing requires Teams Developer Portal + sideloading; cannot test locally without Teams context mock

---

## Related Decisions

- [ADR-007: Azure Marketplace Distribution](adr-007-azure-marketplace-distribution.md) — Three-plan model (Standard / Team / Team AI)
- [ADR-015: Investigation Board](adr-015-investigation-board.md) — Finding statuses, tags, and comments (extended here with author + photos)
- [ADR-004: Offline-First](adr-004-offline-first.md) — Offline capability preserved; photo upload queued when offline

---

## See Also

- [Teams SDK Documentation](https://learn.microsoft.com/en-us/microsoftteams/platform/)
- [On-Behalf-Of Flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-on-behalf-of-flow)
- [Adaptive Cards](https://adaptivecards.io/)
- [Investigation Workflow](../03-features/workflows/investigation-to-action.md)

---

## Implementation History

All 6 increments implemented in February 2026:

| Increment | Scope                                               | Status      |
| --------- | --------------------------------------------------- | ----------- |
| 1         | Teams SDK foundation — context detection, manifest  | Implemented |
| 2         | Mobile layout — responsive phone carousel           | Implemented |
| 3         | Photo comments — camera capture, EXIF strip, upload | Implemented |
| 4         | Channel SharePoint storage — shared .vrs + photos   | Implemented |
| 5         | Deep links + URL sharing — Teams native dialog      | Implemented |
| 6         | OBO silent SSO — Azure Function token exchange      | Implemented |

Adaptive Cards implemented alongside ADR-018 @mention workflow, using the same Graph endpoint and `ChannelMessage.Send` permission scope. Cards are auto-posted when findings reach `analyzed` or `resolved` status in channel tabs.
