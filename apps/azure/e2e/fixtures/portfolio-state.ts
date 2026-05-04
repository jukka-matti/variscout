// apps/azure/e2e/fixtures/portfolio-state.ts
//
// Seed helpers that inject IndexedDB state and reload the page so the app sees
// a populated portfolio on load.
//
// Verified against apps/azure/src/db/schema.ts (2026-05-04):
//   DB name  : 'VaRiScoutAzure'  (VariScoutDatabase constructor: super('VaRiScoutAzure'))
//   projects  table : primary key 'name', fields: name, location, modified, synced, data, meta?
//   processHubs table : primary key 'id', fields: id, name, updatedAt, + optional framing fields
//
// canNavigateBack in Editor.tsx is driven by overviewProjects.length > 0.
// overviewProjects comes from listFromIndexedDB() which reads the `projects` table.
// listFromIndexedDB calls r.modified.toISOString() — so `modified` MUST be stored as
// a real Date object in IDB, not a string.
//
// Key constraint: page.evaluate args are serialized via JSON, so Date objects passed
// from Node.js become plain objects in the browser. Instead, we pass the date as an
// ISO string and construct the Date() inside the evaluate callback (browser context).
//
// Strategy: page.goto('/') to let Dexie migrate the schema, then page.evaluate()
// to write data into the fully-migrated stores (with Date constructed in-browser),
// then page.reload() so the app re-reads the now-populated DB on mount.
//
// After seedPortfolioHub/seedIncompleteHub returns, the app has redirected to the
// portfolio dashboard (App.tsx auto-redirects when projects.length > 0). Callers
// should wait for 'text=Process Hubs' rather than 'Start Your Analysis'.

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export interface SeedHubOptions {
  hubId?: string;
  hubName?: string;
  processGoal?: string;
  outcomes?: Array<{
    columnName: string;
    characteristicType: 'nominalIsBest' | 'smallerIsBetter' | 'largerIsBetter';
  }>;
  /** Project name (key in `projects` table). Defaults to hubName. */
  projectName?: string;
}

const DB_NAME = 'VaRiScoutAzure';

/**
 * Wait for the Azure app's initial landing state (any stable anchor).
 */
async function waitForAppReady(page: Page) {
  await page.goto('/');
  await expect(
    page
      .locator('text=Start Your Analysis')
      .or(page.locator('[data-testid="chart-ichart"]'))
      .or(page.locator('[data-testid="project-dashboard"]'))
  ).toBeVisible({ timeout: 15000 });
}

/**
 * Seeds a persisted hub fixture into IndexedDB.
 *
 * Writes to two tables:
 *   - `projects`     — so App.tsx auto-redirects to portfolio (canNavigateBack flow)
 *   - `processHubs`  — so the hub card appears in the portfolio with processGoal set
 *
 * Flow:
 *  1. page.goto('/') — lets Dexie run its full schema migration (v1→v8)
 *  2. page.evaluate() — writes fixture data into the migrated stores
 *     NOTE: Date is constructed inside evaluate (browser context) because JSON
 *     serialization of page.evaluate args does not preserve Date objects.
 *  3. page.reload()  — app re-reads DB on mount, auto-redirects to portfolio
 *  4. Waits for 'text=Process Hubs' to confirm the portfolio is visible.
 *
 * After this returns, the app is on the Portfolio/Dashboard view.
 * Tests that open a hub card should NOT call page.goto('/') again.
 */
export async function seedPortfolioHub(page: Page, opts: SeedHubOptions = {}) {
  const hubId = opts.hubId ?? 'fixture-hub-1';
  const hubName = opts.hubName ?? 'Fixture Syringe Barrel Line';
  const projectName = opts.projectName ?? hubName;
  const processGoal =
    opts.processGoal ??
    'We mold syringe barrels for medical customers. Weight in grams matters most.';
  const outcomes = opts.outcomes ?? [
    { columnName: 'weight_g', characteristicType: 'nominalIsBest' as const },
  ];

  // Step 1: let Dexie migrate the schema to the current version
  await waitForAppReady(page);

  // Step 2: write fixture data
  // IMPORTANT: `modified` must be a Date object in IDB (listFromIndexedDB calls
  // r.modified.toISOString()). page.evaluate args use JSON serialization which
  // doesn't preserve Date objects — create the Date inside the callback instead.
  await page.evaluate(
    ({ hub, projectName: projName, projectLocation, dbName }) => {
      return new Promise<void>((resolve, reject) => {
        const openReq = indexedDB.open(dbName);
        openReq.onerror = () => reject(new Error('IDB open failed: ' + openReq.error?.message));
        openReq.onsuccess = () => {
          const db = openReq.result;
          try {
            const projectRecord = {
              name: projName,
              location: projectLocation,
              modified: new Date('2026-05-01T00:00:00.000Z'), // constructed in browser
              synced: false,
              data: {},
            };
            const tx = db.transaction(['processHubs', 'projects'], 'readwrite');
            tx.objectStore('processHubs').put(hub);
            tx.objectStore('projects').put(projectRecord);
            tx.oncomplete = () => {
              db.close();
              resolve();
            };
            tx.onerror = () => {
              db.close();
              reject(new Error('IDB write failed: ' + tx.error?.message));
            };
          } catch (e) {
            db.close();
            reject(e);
          }
        };
      });
    },
    {
      hub: {
        id: hubId,
        name: hubName,
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-01T00:00:00.000Z',
        processGoal,
        outcomes,
      },
      projectName,
      projectLocation: 'personal',
      dbName: DB_NAME,
    }
  );

  // Step 3: reload so App.tsx sees the seeded project and auto-redirects to portfolio
  await page.reload();

  // Step 4: wait for the portfolio to appear (App.tsx redirects when projects.length > 0).
  // Use .first() — the Dashboard renders both an h2 "Process Hubs" and an h3
  // section header with the same text; either being visible confirms portfolio is shown.
  await expect(page.locator('text=Process Hubs').first()).toBeVisible({ timeout: 15000 });
}

/**
 * Seeds an INCOMPLETE hub (no processGoal, no outcomes) into IndexedDB.
 *
 * Also writes a `projects` entry so App.tsx auto-redirects to the portfolio.
 * Uses the same goto→evaluate→reload pattern as seedPortfolioHub.
 *
 * After this returns, the app is on the Portfolio/Dashboard view.
 */
export async function seedIncompleteHub(page: Page, hubId = 'fixture-hub-incomplete') {
  const hubName = 'Incomplete Hub Fixture';

  // Step 1: let Dexie migrate the schema
  await waitForAppReady(page);

  // Step 2: write fixture data (Date constructed in browser context)
  await page.evaluate(
    ({ hub, projectName, projectLocation, dbName }) => {
      return new Promise<void>((resolve, reject) => {
        const openReq = indexedDB.open(dbName);
        openReq.onerror = () => reject(new Error('IDB open failed: ' + openReq.error?.message));
        openReq.onsuccess = () => {
          const db = openReq.result;
          try {
            const projectRecord = {
              name: projectName,
              location: projectLocation,
              modified: new Date('2026-05-01T00:00:00.000Z'), // constructed in browser
              synced: false,
              data: {},
            };
            const tx = db.transaction(['processHubs', 'projects'], 'readwrite');
            tx.objectStore('processHubs').put(hub);
            tx.objectStore('projects').put(projectRecord);
            tx.oncomplete = () => {
              db.close();
              resolve();
            };
            tx.onerror = () => {
              db.close();
              reject(new Error('IDB write failed: ' + tx.error?.message));
            };
          } catch (e) {
            db.close();
            reject(e);
          }
        };
      });
    },
    {
      hub: {
        id: hubId,
        name: hubName,
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-01T00:00:00.000Z',
        // Intentionally no processGoal or outcomes — this is the incomplete hub state.
      },
      projectName: hubName,
      projectLocation: 'personal',
      dbName: DB_NAME,
    }
  );

  // Step 3: reload — App.tsx auto-redirects to portfolio
  await page.reload();

  // Step 4: wait for the portfolio.
  // Use .first() — the Dashboard renders both an h2 "Process Hubs" and an h3
  // section header with the same text; either being visible confirms portfolio is shown.
  await expect(page.locator('text=Process Hubs').first()).toBeVisible({ timeout: 15000 });
}
