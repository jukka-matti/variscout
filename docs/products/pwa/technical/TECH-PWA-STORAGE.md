# PWA Storage Architecture

## Overview

VaRiScout Lite is a fully offline-capable PWA. All user data stays on the user's device using IndexedDB. No server-side storage of user data.

```
STORAGE PHILOSOPHY
─────────────────────────────────────────────────────────────────

✓ 100% client-side: Data never leaves user's browser
✓ Offline-first: Works without internet after first load
✓ GDPR simple: "We don't have your data"
✓ No sync complexity: Each device is independent
```

---

## Storage Technologies

### Comparison

| Technology     | Use Case                    | Persistence  | Limit  |
| -------------- | --------------------------- | ------------ | ------ |
| IndexedDB      | Projects, settings, license | Permanent    | ~50MB+ |
| localStorage   | Quick preferences           | Permanent    | ~5MB   |
| sessionStorage | Temp state                  | Session only | ~5MB   |
| Cache API      | App files (PWA)             | Permanent    | Varies |

### Our Choice: IndexedDB (via Dexie.js)

- **Why**: Handles complex data (projects with multiple datasets), async, large storage
- **Library**: Dexie.js (simpler API than raw IndexedDB)

---

## Database Schema

```javascript
// src/db/database.js

import Dexie from 'dexie';

export const db = new Dexie('VaRiScoutDB');

// Schema definition
db.version(1).stores({
  // User settings and preferences
  settings: 'key',

  // Saved analysis projects
  projects: '++id, name, created, updated, [updated+id]',

  // Quick access to recent work
  recentFiles: '++id, name, type, lastOpened',
});

// Future versions can add tables/indexes
db.version(2).stores({
  // ... existing tables ...
  // templates: '++id, name, type'  // Example future addition
});
```

---

## Data Models

### Settings

```javascript
// Key-value store for app settings

// License settings
{ key: 'license', value: 'VSL-XXXX-XXXX-XXXX-XXXX' }
{ key: 'licenseValidated', value: 1704288000000 }
{ key: 'licenseEmail', value: 'user@example.com' }
{ key: 'licenseExpires', value: '2027-01-03T12:00:00Z' }

// UI preferences
{ key: 'theme', value: 'dark' }
{ key: 'chartColorScheme', value: 'default' }
{ key: 'defaultSpecLimits', value: { usl: null, lsl: null, target: null } }
{ key: 'showWelcome', value: false }

// Upgrade prompt preferences (Free tier only)
{ key: 'hideUpgradePrompts', value: false }     // Hide save/export upgrade prompts
{ key: 'hideCloseWarning', value: false }        // Hide browser close warning
{ key: 'promptsDismissedAt', value: null }       // Timestamp when user dismissed

// Recent activity
{ key: 'lastProjectId', value: 42 }
{ key: 'onboardingComplete', value: true }
```

### Prompt Preferences Logic

```javascript
// src/utils/promptPreferences.js

import { db } from '../db/database';

export async function shouldShowUpgradePrompt() {
  const license = await db.settings.get('license');
  if (license?.value) return false; // Licensed users never see prompts

  const hidden = await db.settings.get('hideUpgradePrompts');
  return !hidden?.value;
}

export async function shouldShowCloseWarning() {
  const license = await db.settings.get('license');
  if (license?.value) return false; // Licensed users never see warning

  const hidden = await db.settings.get('hideCloseWarning');
  return !hidden?.value;
}

export async function hideUpgradePrompts(hide = true) {
  await db.settings.put({
    key: 'hideUpgradePrompts',
    value: hide,
  });
  if (hide) {
    await db.settings.put({
      key: 'promptsDismissedAt',
      value: new Date().toISOString(),
    });
  }
}

export async function hideCloseWarning(hide = true) {
  await db.settings.put({
    key: 'hideCloseWarning',
    value: hide,
  });
}

export async function resetPromptPreferences() {
  await db.settings.put({ key: 'hideUpgradePrompts', value: false });
  await db.settings.put({ key: 'hideCloseWarning', value: false });
  await db.settings.put({ key: 'promptsDismissedAt', value: null });
}
```

### Settings Page: Prompt Preferences UI

```jsx
// In Settings component

function PromptPreferences() {
  const [hideUpgrade, setHideUpgrade] = useState(false);
  const [hideClose, setHideClose] = useState(false);

  // Load current preferences
  useEffect(() => {
    (async () => {
      const upgrade = await db.settings.get('hideUpgradePrompts');
      const close = await db.settings.get('hideCloseWarning');
      setHideUpgrade(upgrade?.value || false);
      setHideClose(close?.value || false);
    })();
  }, []);

  return (
    <section>
      <h3>Prompt Preferences</h3>
      <label>
        <input
          type="checkbox"
          checked={!hideUpgrade}
          onChange={e => {
            setHideUpgrade(!e.target.checked);
            hideUpgradePrompts(!e.target.checked);
          }}
        />
        Show upgrade prompts when saving
      </label>
      <label>
        <input
          type="checkbox"
          checked={!hideClose}
          onChange={e => {
            setHideClose(!e.target.checked);
            hideCloseWarning(!e.target.checked);
          }}
        />
        Warn me when closing with unsaved work
      </label>
    </section>
  );
}
```

### Projects

```javascript
// Full analysis project with all data

{
  id: 1,                              // Auto-incremented
  name: "Diameter Analysis Q1",       // User-provided name
  created: "2026-01-03T10:00:00Z",    // ISO timestamp
  updated: "2026-01-03T14:30:00Z",    // ISO timestamp

  // Data configuration
  config: {
    valueColumn: "diameter",          // Which column has values
    timestampColumn: "date",          // Optional: time ordering
    factorColumns: ["shift", "machine", "operator"],
    specLimits: {
      usl: 10.05,
      lsl: 9.95,
      target: 10.00
    }
  },

  // Raw data (stored as-is from import)
  data: [
    { diameter: 10.02, shift: "A", machine: "M1", operator: "John", date: "2026-01-01" },
    { diameter: 9.98, shift: "A", machine: "M1", operator: "John", date: "2026-01-01" },
    // ... potentially thousands of rows
  ],

  // Calculated results (cached for performance)
  results: {
    stats: {
      mean: 10.001,
      stdDev: 0.015,
      cp: 1.11,
      cpk: 1.08,
      n: 500
    },
    controlLimits: {
      ucl: 10.046,
      cl: 10.001,
      lcl: 9.956
    },
    signals: [
      { index: 47, type: 'above_ucl', value: 10.052 },
      { index: 123, type: 'run_above', startIndex: 118, length: 8 }
    ]
  },

  // User annotations
  annotations: [
    {
      index: 47,
      text: "New batch of material",
      created: "2026-01-03T11:00:00Z"
    }
  ],

  // Export history (optional tracking)
  exports: [
    { type: 'png', timestamp: "2026-01-03T14:00:00Z" }
  ],

  // Metadata
  meta: {
    version: 1,                       // Schema version for migrations
    importSource: "csv",              // How data was imported
    originalFilename: "diameter_data.csv"
  }
}
```

### Recent Files

```javascript
// Quick access list (separate from full projects)

{
  id: 1,
  name: "diameter_data.csv",
  type: "import",                     // import | project | export
  lastOpened: "2026-01-03T14:30:00Z",
  projectId: 1,                       // Link to project if applicable
  preview: {                          // Quick stats for display
    rows: 500,
    columns: 5
  }
}
```

---

## Storage Operations

### Project CRUD

```javascript
// src/db/projects.js

import { db } from './database';

// Create new project
export async function createProject(data) {
  const now = new Date().toISOString();

  const project = {
    name: data.name || 'Untitled Project',
    created: now,
    updated: now,
    config: data.config || {},
    data: data.data || [],
    results: null,
    annotations: [],
    exports: [],
    meta: {
      version: 1,
      importSource: data.importSource || 'manual',
    },
  };

  const id = await db.projects.add(project);

  // Update recent files
  await addToRecent({
    name: project.name,
    type: 'project',
    projectId: id,
    preview: { rows: project.data.length },
  });

  return { ...project, id };
}

// Get project by ID
export async function getProject(id) {
  return db.projects.get(id);
}

// Update project
export async function updateProject(id, updates) {
  const updated = new Date().toISOString();
  await db.projects.update(id, { ...updates, updated });
}

// Delete project
export async function deleteProject(id) {
  await db.projects.delete(id);
  // Clean up recent files
  await db.recentFiles.where('projectId').equals(id).delete();
}

// List all projects (sorted by updated)
export async function listProjects({ limit = 50, offset = 0 } = {}) {
  return db.projects.orderBy('updated').reverse().offset(offset).limit(limit).toArray();
}

// Search projects by name
export async function searchProjects(query) {
  const lowerQuery = query.toLowerCase();
  return db.projects.filter(p => p.name.toLowerCase().includes(lowerQuery)).toArray();
}
```

### Auto-save

```javascript
// src/db/autosave.js

import { db } from './database';
import { debounce } from 'lodash-es';

// Debounced auto-save (saves 500ms after last change)
export const autoSave = debounce(async (projectId, updates) => {
  if (!projectId) return;

  const updated = new Date().toISOString();
  await db.projects.update(projectId, { ...updates, updated });

  console.log(`Auto-saved project ${projectId}`);
}, 500);

// Usage in React component
function useAutoSave(projectId, data, config, results) {
  useEffect(() => {
    if (projectId) {
      autoSave(projectId, { data, config, results });
    }
  }, [projectId, data, config, results]);
}
```

### Import/Export (.vrs files)

```javascript
// src/db/fileIO.js

// Export project to .vrs file (JSON)
export async function exportProjectFile(projectId) {
  const project = await db.projects.get(projectId);

  if (!project) {
    throw new Error('Project not found');
  }

  // Remove internal fields
  const exportData = {
    name: project.name,
    config: project.config,
    data: project.data,
    annotations: project.annotations,
    meta: {
      ...project.meta,
      exportedAt: new Date().toISOString(),
      exportedFrom: 'VaRiScout Lite',
    },
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });

  // Trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name.replace(/[^a-z0-9]/gi, '_')}.vrs`;
  a.click();
  URL.revokeObjectURL(url);

  // Track export
  await db.projects.update(projectId, {
    exports: [
      ...(project.exports || []),
      {
        type: 'vrs',
        timestamp: new Date().toISOString(),
      },
    ],
  });
}

// Import project from .vrs file
export async function importProjectFile(file) {
  const text = await file.text();
  const data = JSON.parse(text);

  // Validate structure
  if (!data.data || !Array.isArray(data.data)) {
    throw new Error('Invalid .vrs file: missing data array');
  }

  // Create new project from import
  return createProject({
    name: data.name || file.name.replace('.vrs', ''),
    config: data.config || {},
    data: data.data,
    importSource: 'vrs',
  });
}
```

---

## Settings Management

```javascript
// src/db/settings.js

import { db } from './database';

// Get setting
export async function getSetting(key, defaultValue = null) {
  const setting = await db.settings.get(key);
  return setting?.value ?? defaultValue;
}

// Set setting
export async function setSetting(key, value) {
  await db.settings.put({ key, value });
}

// Get multiple settings
export async function getSettings(keys) {
  const settings = await db.settings.bulkGet(keys);
  return Object.fromEntries(settings.map((s, i) => [keys[i], s?.value ?? null]));
}

// Set multiple settings
export async function setSettings(settingsObj) {
  const entries = Object.entries(settingsObj).map(([key, value]) => ({ key, value }));
  await db.settings.bulkPut(entries);
}

// Clear all settings (factory reset)
export async function clearAllSettings() {
  await db.settings.clear();
}
```

---

## Storage Limits & Management

### Checking Storage

```javascript
// src/db/storage.js

export async function getStorageEstimate() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage,
      available: estimate.quota,
      percentUsed: (estimate.usage / estimate.quota) * 100,
    };
  }
  return null;
}

export async function getProjectsSize() {
  const projects = await db.projects.toArray();
  const totalSize = projects.reduce((sum, p) => {
    return sum + JSON.stringify(p).length;
  }, 0);
  return totalSize;
}
```

### Storage Warning UI

```jsx
// StorageWarning.jsx

function StorageWarning() {
  const [storage, setStorage] = useState(null);

  useEffect(() => {
    getStorageEstimate().then(setStorage);
  }, []);

  if (!storage || storage.percentUsed < 80) {
    return null;
  }

  return (
    <div className="warning-banner">
      ⚠️ Storage is {storage.percentUsed.toFixed(0)}% full. Consider exporting and deleting old
      projects.
    </div>
  );
}
```

### Cleanup Utilities

```javascript
// Delete old projects
export async function deleteOldProjects(olderThanDays = 90) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);

  const oldProjects = await db.projects.where('updated').below(cutoff.toISOString()).toArray();

  const ids = oldProjects.map(p => p.id);
  await db.projects.bulkDelete(ids);

  return ids.length;
}

// Export all projects before clearing
export async function exportAllProjects() {
  const projects = await db.projects.toArray();

  const exportData = {
    exportedAt: new Date().toISOString(),
    projects: projects.map(p => ({
      name: p.name,
      config: p.config,
      data: p.data,
      annotations: p.annotations,
    })),
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `variscout_backup_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
```

---

## PWA Service Worker

### Cache Strategy

```javascript
// service-worker.js

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';

// Precache app shell
precacheAndRoute(self.__WB_MANIFEST);

// Cache static assets
registerRoute(
  ({ request }) =>
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'style',
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      { maxAgeSeconds: 30 * 24 * 60 * 60 }, // 30 days
    ],
  })
);

// App is fully offline after first load
// IndexedDB handles all user data
```

### Manifest

```json
// manifest.json

{
  "name": "VaRiScout Lite",
  "short_name": "VaRiScout",
  "description": "Find what's driving variation. In minutes.",
  "start_url": "/app",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563EB",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## Data Migration

### Version Upgrades

```javascript
// Handle schema changes gracefully

db.version(1).stores({
  settings: 'key',
  projects: '++id, name, created, updated',
});

db.version(2).stores({
  settings: 'key',
  projects: '++id, name, created, updated, [updated+id]',
  recentFiles: '++id, name, type, lastOpened', // New table
});

// Migration hook
db.version(2).upgrade(tx => {
  // Migrate existing data if needed
  return tx.projects.toCollection().modify(project => {
    // Add new required fields
    if (!project.meta) {
      project.meta = { version: 1 };
    }
  });
});
```

---

## React Hooks

```javascript
// src/hooks/useProject.js

import { useState, useEffect, useCallback } from 'react';
import { getProject, updateProject, autoSave } from '../db/projects';

export function useProject(projectId) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load project
  useEffect(() => {
    if (!projectId) {
      setProject(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    getProject(projectId)
      .then(setProject)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [projectId]);

  // Update with auto-save
  const update = useCallback(
    updates => {
      setProject(prev => ({ ...prev, ...updates }));
      autoSave(projectId, updates);
    },
    [projectId]
  );

  return { project, loading, error, update };
}

// src/hooks/useProjects.js

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const list = await listProjects();
    setProjects(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { projects, loading, refresh };
}
```

---

## Summary

| Feature         | Implementation                    |
| --------------- | --------------------------------- |
| Project storage | IndexedDB via Dexie.js            |
| Auto-save       | Debounced writes on change        |
| File export     | .vrs (JSON) download              |
| File import     | .vrs file parsing                 |
| Settings        | IndexedDB key-value store         |
| License         | IndexedDB (see TECH-LICENSING.md) |
| Offline         | Service Worker + IndexedDB        |
| PWA install     | manifest.json + service worker    |

All data stays on user's device. No server sync. No user database. Simple and private.
