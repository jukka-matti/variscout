# Azure Project Management Flow

> Azure-specific project browsing, cloud sync, and team collaboration.
> For the shared analysis journey, see [Core Analysis Journey](../CORE-ANALYSIS-JOURNEY.md).

## Overview

The Azure Team App uses a two-page architecture:

1. **Dashboard (Project Browser)** - List, search, and manage projects
2. **Editor** - Analysis workspace (similar to PWA Dashboard)

## Entry Flow

```
User opens Azure Team App
        ↓
    Azure AD SSO (automatic)
        ↓
    Dashboard page loads
        └── Lists projects from:
            ├── Team Storage (SharePoint)
            └── Personal Storage (OneDrive)
        ↓
    User selects existing project OR clicks "New Project"
        ↓
    Editor page opens
        └── Tab-based navigation (Analysis/Regression/GageRR/Performance)
```

---

## 1. Project Browser (Dashboard Page)

### Layout

```
┌────────────────────────────────────────────────────┐
│  Projects                    [🌐 Connected] [+ New]│
│  Manage your analysis projects across team...      │
├────────────────────────────────────────────────────┤
│  🔍 Search projects...    [All] [Team] [Personal]  │
├────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────┐  │
│  │ 📁 Coffee Fill Analysis                      │  │
│  │    Team • Modified 2 hours ago by Jane       │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │ 📁 Packaging Line Study                      │  │
│  │    Personal • Modified yesterday             │  │
│  └──────────────────────────────────────────────┘  │
│  ...                                               │
└────────────────────────────────────────────────────┘
```

### Features

| Feature             | Description                             |
| ------------------- | --------------------------------------- |
| **Search**          | Filter projects by name                 |
| **Location filter** | All / Team / Personal toggle            |
| **Sync status**     | Connected / Offline / Syncing indicator |
| **Modified info**   | Relative time + modifier name (team)    |

### Project Card Actions

- **Click** → Open in Editor
- **Context menu** → Rename, Delete, Move to Team/Personal

---

## 2. Storage Locations

### Team Storage (SharePoint)

- Stored in: `/sites/root:/VaRiScout/Projects`
- Accessible by all team members
- Shows "Modified by" attribution
- Requires SharePoint site configuration

### Personal Storage (OneDrive)

- Stored in: `/me/drive/root:/VaRiScout/Projects`
- Private to user
- Synced across user's devices
- No attribution needed

### Project File Format

Projects are stored as `.vrs` files (JSON):

```json
{
  "version": "1.0",
  "rawData": [...],
  "config": {
    "outcome": "Weight",
    "factors": ["Machine", "Shift"],
    "specs": { "usl": 10.5, "lsl": 9.5 }
  }
}
```

---

## 3. Offline-First Architecture

### Sync Strategy

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  IndexedDB  │────→│  Sync Queue │────→│  OneDrive/  │
│  (local)    │     │  (pending)  │     │  SharePoint │
└─────────────┘     └─────────────┘     └─────────────┘
       ↑                                       │
       └───────────────────────────────────────┘
                    (on reconnect)
```

### Sync States

| State      | UI Indicator  | Meaning                  |
| ---------- | ------------- | ------------------------ |
| `saved`    | Checkmark     | Saved locally            |
| `syncing`  | Spinner       | Uploading to cloud       |
| `synced`   | Cloud icon    | Local = cloud            |
| `offline`  | Cloud-off     | Working offline          |
| `conflict` | Warning       | Concurrent edit detected |
| `error`    | Red indicator | Sync failed              |

### Pending Changes

When offline:

1. Changes saved to IndexedDB immediately
2. Added to sync queue
3. "X pending" badge shows count
4. Auto-sync when connection restored

---

## 4. Create New Project

### Flow

```
Click "New Project"
        ↓
    Editor page opens (blank)
        ↓
    User uploads data file
        ↓
    Column mapping (same as PWA)
        ↓
    Save project:
        └── Name prompt
            └── Location choice (Team/Personal)
        ↓
    Saved locally + synced to cloud
```

### First Save Dialog

```
┌─────────────────────────────────┐
│ Save Project                     │
├─────────────────────────────────┤
│ Name: [Coffee Analysis______]   │
│                                  │
│ Location:                        │
│   ○ Team (SharePoint)           │
│   ● Personal (OneDrive)         │
│                                  │
│ [Cancel]              [Save]    │
└─────────────────────────────────┘
```

---

## 5. Open Existing Project

### Flow

```
Click project card in browser
        ↓
    Check local cache (IndexedDB)
        ├── Cache hit + online → Check for updates
        ├── Cache hit + offline → Use local
        └── Cache miss → Fetch from cloud
        ↓
    Load project into Editor
        ↓
    Editor opens with data + config
```

### Cache Invalidation

- ETag comparison on open
- If cloud version newer → Prompt to refresh
- If local changes pending → Merge or overwrite option

---

## 6. Editor Page (Analysis)

### Tab Navigation

```
┌─────────────────────────────────────────────────────┐
│ 📁 Coffee Analysis    [Analysis][Regression][Gage] │
├─────────────────────────────────────────────────────┤
│                                                     │
│   ┌───────────────────┐  ┌───────────────────┐     │
│   │    I-Chart        │  │     Boxplot       │     │
│   └───────────────────┘  └───────────────────┘     │
│   ┌───────────────────┐  ┌───────────────────┐     │
│   │    Pareto         │  │    Capability     │     │
│   └───────────────────┘  └───────────────────┘     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Tabs

| Tab             | Content                    |
| --------------- | -------------------------- |
| **Analysis**    | Standard 4-chart dashboard |
| **Regression**  | Regression analysis panel  |
| **GageRR**      | Gage R&R study panel       |
| **Performance** | Multi-measure dashboard    |

### Differences from PWA

| Feature        | PWA                            | Azure              |
| -------------- | ------------------------------ | ------------------ |
| Navigation     | Settings-driven view switching | Explicit tabs      |
| Filter display | Breadcrumb trail               | Filter chips       |
| Mobile layout  | MobileDashboard component      | Not implemented    |
| Data reload    | From file/sample               | From cloud project |

---

## 7. Auto-Save

### Behavior

- **Debounce**: 1 second after last change
- **Local save**: Immediate to IndexedDB
- **Cloud sync**: When online, after local save

### What Triggers Save

- Data changes (filters, drill state)
- Configuration changes (specs, grades)
- Column mapping changes

### Save Indicator

```
┌────────────────────────────────────────┐
│ 📁 Coffee Analysis  ● Saving...        │
│                     ✓ Saved            │
│                     ☁ Synced           │
└────────────────────────────────────────┘
```

---

## 8. Team Collaboration

### Concurrent Access

- Multiple users can view same project
- Last-write-wins for saves (no locking)
- Conflict detection via ETag comparison

### Conflict Resolution

When conflict detected:

```
┌─────────────────────────────────┐
│ ⚠️ Conflict Detected            │
├─────────────────────────────────┤
│ This project was modified by    │
│ Jane Smith while you were       │
│ editing.                        │
│                                  │
│ [Keep Mine] [Use Theirs] [View] │
└─────────────────────────────────┘
```

### Attribution

Team projects show:

- "Modified by [Name]" in project list
- Last modifier tracked via Graph API

---

## 9. Migration from PWA

### Import .vrs File

Users can import existing PWA projects:

1. Open project in PWA
2. Export as .vrs file
3. In Azure app, upload .vrs to Editor
4. Save to Team or Personal storage

### Data Compatibility

- Same project format (.vrs JSON)
- Same data validation
- Same column mapping

---

## Related Documentation

- [Core Analysis Journey](../CORE-ANALYSIS-JOURNEY.md) - Shared analysis experience
- [Platform Adaptations](../PLATFORM-ADAPTATIONS.md) - How Azure differs from other apps
- [Azure Technical Deployment](../../products/azure/TECH-AZURE-DEPLOYMENT.md) - Azure AD, SharePoint setup
