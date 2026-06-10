import { describe, it, expect } from 'vitest';
import { ensureSessionProject } from '../ensureSessionProject';
import type { ProcessHub } from '@variscout/core/processHub';

const NOW = () => 1_750_000_000_000;

describe('ensureSessionProject', () => {
  it('creates a hub + Untitled project when no hub exists', () => {
    const hub = ensureSessionProject(null, 'Case: The Bottleneck', NOW);
    expect(hub.id).toBeTruthy();
    expect(hub.improvementProject).toBeTruthy();
    expect(hub.improvementProject!.metadata.title).toBe('Case: The Bottleneck');
    expect(hub.improvementProject!.hubId).toBe(hub.id);
    expect(hub.improvementProject!.deletedAt).toBeNull();
    const members = hub.improvementProject?.metadata.members ?? [];
    expect(members).toHaveLength(1);
    expect(members[0]).toMatchObject({
      role: 'lead',
      userId: 'analyst@local',
    });
  });

  it('adds an IP to an existing hub without touching other hub fields', () => {
    const existing = {
      id: 'hub-1',
      name: 'My hub',
      createdAt: 1,
      deletedAt: null,
      processGoal: 'reduce cycle time',
    } as unknown as ProcessHub;
    const hub = ensureSessionProject(existing, 'Untitled project', NOW);
    expect(hub.id).toBe('hub-1');
    expect(hub.name).toBe('My hub');
    expect(hub.processGoal).toBe('reduce cycle time');
    expect(hub.improvementProject!.hubId).toBe('hub-1');
  });

  it('is a no-op when a live Workspace Project already exists (reconstruct-not-create, spec §1)', () => {
    const withIP = ensureSessionProject(null, 'Imported scenario', NOW);
    const again = ensureSessionProject(withIP, 'SHOULD NOT APPLY', NOW);
    expect(again).toBe(withIP); // referential no-op
    expect(again.improvementProject!.metadata.title).toBe('Imported scenario');
  });

  it('replaces a soft-deleted IP with a fresh one', () => {
    const withIP = ensureSessionProject(null, 'Old', NOW);
    const softDeleted = {
      ...withIP,
      improvementProject: { ...withIP.improvementProject!, deletedAt: 123 },
    } as ProcessHub;
    const hub = ensureSessionProject(softDeleted, 'Fresh', NOW);
    expect(hub.improvementProject!.deletedAt).toBeNull();
    expect(hub.improvementProject!.metadata.title).toBe('Fresh');
  });
});
