import type { ProcessHub } from '@variscout/core/processHub';
import { buildDocumentSnapshot, type DocumentSnapshot } from '@variscout/stores';
import { db } from '../db/schema';

const CURRENT_DOCUMENT_KEY = 'current' as const;

export async function saveCurrentDocumentSnapshot(
  activeHub: ProcessHub
): Promise<DocumentSnapshot> {
  const snapshot = buildDocumentSnapshot({ activeHub });
  await db.documentSnapshots.put({
    key: CURRENT_DOCUMENT_KEY,
    snapshot,
    savedAt: new Date().toISOString(),
  });
  return snapshot;
}

export async function loadSavedDocumentSnapshot(): Promise<DocumentSnapshot | null> {
  const row = await db.documentSnapshots.get(CURRENT_DOCUMENT_KEY);
  return row?.snapshot ?? null;
}
