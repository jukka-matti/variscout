import type { ProjectMetadata } from '@variscout/core';

export type StorageLocation = 'personal' | 'team';

export interface CloudProject {
  id: string;
  name: string;
  modified: string;
  modifiedBy?: string;
  location: StorageLocation;
  metadata?: ProjectMetadata;
}

export interface SyncStatus {
  status: 'saved' | 'syncing' | 'synced' | 'offline' | 'error' | 'conflict';
  message: string;
  lastSynced?: Date;
  pendingChanges?: number;
}

export interface SyncNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  action?: { label: string; onClick: () => void };
  dismissAfter?: number;
}
