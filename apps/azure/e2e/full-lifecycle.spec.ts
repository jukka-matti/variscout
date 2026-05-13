import { test, expect, type Page } from '@playwright/test';

const DB_NAME = 'VaRiScoutAzure';
const NOW = 1_777_161_600_000; // 2026-04-26T00:00:00.000Z

async function waitForAppReady(page: Page) {
  await page.goto('/');
  await expect(
    page
      .locator('text=Start Your Analysis')
      .or(page.locator('[data-testid="project-dashboard"]'))
      .or(page.locator('text=Process Hubs').first())
  ).toBeVisible({ timeout: 15000 });
}

async function seedLifecycleHub(page: Page) {
  await waitForAppReady(page);

  await page.evaluate(
    ({ dbName, now }) =>
      new Promise<void>((resolve, reject) => {
        const openReq = indexedDB.open(dbName);
        openReq.onerror = () => reject(new Error(`IDB open failed: ${openReq.error?.message}`));
        openReq.onsuccess = () => {
          const db = openReq.result;
          const hubId = 'lifecycle-hub';
          const investigationId = 'lifecycle-investigation';
          const projectId = 'lifecycle-ip';
          const sustainmentId = 'lifecycle-sustainment';

          try {
            const tx = db.transaction(
              [
                'projects',
                'processHubs',
                'improvementProjects',
                'actionItems',
                'sustainmentRecords',
              ],
              'readwrite'
            );

            tx.objectStore('projects').put({
              name: 'Lifecycle Demo Hub',
              location: 'personal',
              modified: new Date('2026-05-01T00:00:00.000Z'),
              synced: false,
              data: {},
            });

            tx.objectStore('processHubs').put({
              id: hubId,
              name: 'Lifecycle Demo Hub',
              processGoal: 'Demonstrate the full response path lifecycle.',
              outcomes: [
                {
                  id: 'outcome-1',
                  hubId,
                  columnName: 'fill_weight',
                  characteristicType: 'nominalIsBest',
                  createdAt: now,
                  deletedAt: null,
                },
              ],
              investigations: [
                {
                  id: investigationId,
                  name: 'Fill weight lifecycle',
                  createdAt: now,
                  updatedAt: now,
                  deletedAt: null,
                  metadata: {
                    processHubId: hubId,
                    investigationStatus: 'controlled',
                    findingCounts: {},
                    questionCounts: {},
                    actionCounts: { total: 1, completed: 1, overdue: 0 },
                  },
                },
              ],
              createdAt: now,
              updatedAt: now,
              deletedAt: null,
            });

            tx.objectStore('improvementProjects').put({
              id: projectId,
              hubId,
              status: 'closed',
              metadata: { title: 'Reduce fill-weight drift', investigationId },
              goal: {
                outcomeGoal: { outcomeSpecId: 'outcome-1', target: 1.33 },
                freeText: 'Hold Cpk above 1.33.',
              },
              sections: {
                background: {},
                investigationLineage: {},
                approach: { actionItemIds: ['action-1'] },
                outcomeReference: { sustainmentRecordId: sustainmentId },
              },
              createdAt: now,
              updatedAt: now,
              deletedAt: null,
            });

            tx.objectStore('actionItems').put({
              id: 'action-1',
              hubId,
              text: 'Lock revised fill-weight standard work',
              stepId: 'step-1',
              status: 'done',
              completedAt: '2026-04-20T00:00:00.000Z',
              parentImprovementProjectId: projectId,
              parentImprovementIdeaId: null,
              createdAt: now,
              deletedAt: null,
            });

            tx.objectStore('sustainmentRecords').put({
              id: sustainmentId,
              investigationId,
              hubId,
              status: 'confirmed-sustained',
              title: 'Hold fill-weight gain',
              improvementProjectId: projectId,
              targetSummary: 'Cpk stays above 1.33.',
              consecutiveOnTargetTicks: 4,
              hasOverride: false,
              lastEvaluatedSnapshotId: 'snapshot-1',
              cadence: 'weekly',
              latestVerdict: 'holding',
              latestReviewAt: '2026-03-01T00:00:00.000Z',
              createdAt: now - 70 * 24 * 60 * 60 * 1000,
              updatedAt: now - 60 * 24 * 60 * 60 * 1000,
              deletedAt: null,
            });

            tx.oncomplete = () => {
              db.close();
              resolve();
            };
            tx.onerror = () => {
              db.close();
              reject(new Error(`IDB write failed: ${tx.error?.message}`));
            };
          } catch (error) {
            db.close();
            reject(error);
          }
        };
      }),
    { dbName: DB_NAME, now: NOW }
  );

  await page.reload();
  await expect(page.locator('text=Process Hubs').first()).toBeVisible({ timeout: 15000 });
}

test.describe('Azure full response-path lifecycle', () => {
  test('opens a confirmed sustainment handoff prompt and advances handoff controls', async ({
    page,
  }) => {
    await seedLifecycleHub(page);

    await page.getByRole('button', { name: 'Open Lifecycle Demo Hub' }).click();

    await expect(page.getByText(/Hold fill-weight gain confirmed sustained/i)).toBeVisible({
      timeout: 10000,
    });
    await page.getByRole('button', { name: 'Record control handoff' }).click();

    await expect(page.getByRole('heading', { name: 'Handoff' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Hold fill-weight gain')).toBeVisible();

    await page.getByLabel('System name').fill('QMS-42');
    await page.getByLabel('Process owner').fill('Process owner');
    await page.getByLabel('Escalation path').fill('Escalate drift to production manager');
    await page
      .getByRole('textbox', { name: 'Reaction plan' })
      .fill('Restore standard work before next shift');
    await page.getByRole('button', { name: 'Acknowledge handoff' }).click();
    await page.getByRole('button', { name: 'Mark operational' }).click();

    await expect(page.getByText('Status operational')).toBeVisible({ timeout: 5000 });
    await expect(
      page
        .getByRole('button', { name: 'Run sponsor signoff' })
        .or(page.getByRole('button', { name: 'Sponsor signoff locked' }))
    ).toBeVisible();
  });
});
