import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHypotheses } from '../useHypotheses';
import { createHypothesis } from '@variscout/core/findings';
import { deriveHypothesisStatus } from '@variscout/core/survey';
import type { Hypothesis, Finding, DisconfirmationAttempt } from '@variscout/core';

describe('useHypotheses', () => {
  it('starts with empty hubs when no initialHubs provided', () => {
    const { result } = renderHook(() => useHypotheses({ initialHubs: [] }));
    expect(result.current.hubs).toEqual([]);
  });

  it('starts with provided initialHubs', () => {
    const initial: Hypothesis[] = [createHypothesis('Nozzle wear', 'High vibration at night')];
    const { result } = renderHook(() => useHypotheses({ initialHubs: initial }));
    expect(result.current.hubs).toHaveLength(1);
    expect(result.current.hubs[0].name).toBe('Nozzle wear');
  });

  describe('createHub', () => {
    it('adds a hub and returns it', () => {
      const { result } = renderHook(() => useHypotheses({ initialHubs: [] }));
      let created: Hypothesis;
      act(() => {
        created = result.current.createHub('Shift effect', 'Night shift runs hotter');
      });
      expect(result.current.hubs).toHaveLength(1);
      expect(result.current.hubs[0].name).toBe('Shift effect');
      expect(result.current.hubs[0].synthesis).toBe('Night shift runs hotter');
      expect(created!.id).toBe(result.current.hubs[0].id);
    });

    it('calls onHubsChange after creation', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useHypotheses({ initialHubs: [], onHubsChange: onChange })
      );
      act(() => {
        result.current.createHub('Wear', '');
      });
      expect(onChange).toHaveBeenCalledWith(expect.any(Array));
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('new hub has status proposed and empty connections', () => {
      const { result } = renderHook(() => useHypotheses({ initialHubs: [] }));
      act(() => {
        result.current.createHub('Test hub', '');
      });
      const hub = result.current.hubs[0];
      expect(hub.status).toBe('proposed');
      expect(hub.findingIds).toEqual([]);
    });
  });

  describe('resetHubs', () => {
    it('replaces all hubs with the provided list', () => {
      const initial = [createHypothesis('Old hub', '')];
      const { result } = renderHook(() => useHypotheses({ initialHubs: initial }));
      const replacement = [
        createHypothesis('New hub A', 'synthesis A'),
        createHypothesis('New hub B', 'synthesis B'),
      ];
      act(() => {
        result.current.resetHubs(replacement);
      });
      expect(result.current.hubs).toHaveLength(2);
      expect(result.current.hubs[0].name).toBe('New hub A');
      expect(result.current.hubs[1].name).toBe('New hub B');
    });

    it('calls onHubsChange with the new hubs', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useHypotheses({ initialHubs: [], onHubsChange: onChange })
      );
      const newHubs = [createHypothesis('Migrated hub', 'from legacy causeRole')];
      act(() => {
        result.current.resetHubs(newHubs);
      });
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(newHubs);
    });

    it('replaces existing hubs with an empty list', () => {
      const initial = [createHypothesis('Hub', '')];
      const { result } = renderHook(() => useHypotheses({ initialHubs: initial }));
      act(() => {
        result.current.resetHubs([]);
      });
      expect(result.current.hubs).toEqual([]);
    });
  });

  describe('updateHub', () => {
    it('updates name and synthesis', () => {
      const initial = [createHypothesis('Old name', 'Old synthesis')];
      const { result } = renderHook(() => useHypotheses({ initialHubs: initial }));
      const hubId = initial[0].id;
      act(() => {
        result.current.updateHub(hubId, { name: 'New name', synthesis: 'New synthesis' });
      });
      const hub = result.current.hubs[0];
      expect(hub.name).toBe('New name');
      expect(hub.synthesis).toBe('New synthesis');
    });

    it('updates branch nextMove without changing linked evidence', () => {
      const initial = [createHypothesis('Hub', '', ['f-001'])];
      const { result } = renderHook(() => useHypotheses({ initialHubs: initial }));
      act(() => {
        result.current.updateHub(initial[0].id, {
          nextMove: 'Run a late-shift temperature check.',
        });
      });
      const hub = result.current.hubs[0];
      expect(hub.nextMove).toBe('Run a late-shift temperature check.');
      expect(hub.findingIds).toEqual(['f-001']);
    });

    it('updates updatedAt to a valid ISO timestamp', () => {
      const initial = [createHypothesis('Hub', '')];
      const { result } = renderHook(() => useHypotheses({ initialHubs: initial }));
      act(() => {
        result.current.updateHub(initial[0].id, { name: 'Updated' });
      });
      expect(typeof result.current.hubs[0].updatedAt).toBe('number');
      expect(result.current.hubs[0].updatedAt).toBeGreaterThan(0);
    });

    it('calls onHubsChange', () => {
      const onChange = vi.fn();
      const initial = [createHypothesis('Hub', '')];
      const { result } = renderHook(() =>
        useHypotheses({ initialHubs: initial, onHubsChange: onChange })
      );
      act(() => {
        result.current.updateHub(initial[0].id, { name: 'Updated' });
      });
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('does nothing for unknown hubId', () => {
      const initial = [createHypothesis('Hub', '')];
      const { result } = renderHook(() => useHypotheses({ initialHubs: initial }));
      act(() => {
        result.current.updateHub('nonexistent-id', { name: 'Ghost' });
      });
      expect(result.current.hubs[0].name).toBe('Hub');
    });
  });

  describe('deleteHub', () => {
    it('removes the hub by id', () => {
      const initial = [createHypothesis('Hub A', ''), createHypothesis('Hub B', '')];
      const { result } = renderHook(() => useHypotheses({ initialHubs: initial }));
      act(() => {
        result.current.deleteHub(initial[0].id);
      });
      expect(result.current.hubs).toHaveLength(1);
      expect(result.current.hubs[0].name).toBe('Hub B');
    });

    it('calls onHubsChange', () => {
      const onChange = vi.fn();
      const initial = [createHypothesis('Hub', '')];
      const { result } = renderHook(() =>
        useHypotheses({ initialHubs: initial, onHubsChange: onChange })
      );
      act(() => {
        result.current.deleteHub(initial[0].id);
      });
      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('connectFinding', () => {
    it('adds a findingId to the hub', () => {
      const initial = [createHypothesis('Hub', '')];
      const { result } = renderHook(() => useHypotheses({ initialHubs: initial }));
      act(() => {
        result.current.connectFinding(initial[0].id, 'f-001');
      });
      expect(result.current.hubs[0].findingIds).toContain('f-001');
    });

    it('does not add duplicate finding connections', () => {
      const initial = [createHypothesis('Hub', '', ['f-001'])];
      const { result } = renderHook(() => useHypotheses({ initialHubs: initial }));
      act(() => {
        result.current.connectFinding(initial[0].id, 'f-001');
      });
      expect(result.current.hubs[0].findingIds).toHaveLength(1);
    });

    it('updates updatedAt and calls onHubsChange', () => {
      const onChange = vi.fn();
      const initial = [createHypothesis('Hub', '')];
      const { result } = renderHook(() =>
        useHypotheses({ initialHubs: initial, onHubsChange: onChange })
      );
      act(() => {
        result.current.connectFinding(initial[0].id, 'f-001');
      });
      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('disconnectFinding', () => {
    it('removes a findingId from the hub', () => {
      const initial = [createHypothesis('Hub', '', ['f-001', 'f-002'])];
      const { result } = renderHook(() => useHypotheses({ initialHubs: initial }));
      act(() => {
        result.current.disconnectFinding(initial[0].id, 'f-001');
      });
      expect(result.current.hubs[0].findingIds).not.toContain('f-001');
      expect(result.current.hubs[0].findingIds).toContain('f-002');
    });

    it('calls onHubsChange', () => {
      const onChange = vi.fn();
      const initial = [createHypothesis('Hub', '', ['f-001'])];
      const { result } = renderHook(() =>
        useHypotheses({ initialHubs: initial, onHubsChange: onChange })
      );
      act(() => {
        result.current.disconnectFinding(initial[0].id, 'f-001');
      });
      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('getHubForFinding', () => {
    it('returns the hub containing the given findingId', () => {
      const initial = [
        createHypothesis('Hub A', '', ['f-001']),
        createHypothesis('Hub B', '', ['f-002']),
      ];
      const { result } = renderHook(() => useHypotheses({ initialHubs: initial }));
      expect(result.current.getHubForFinding('f-001')?.name).toBe('Hub A');
      expect(result.current.getHubForFinding('f-002')?.name).toBe('Hub B');
    });

    it('returns undefined when no hub contains the findingId', () => {
      const initial = [createHypothesis('Hub', '', ['f-001'])];
      const { result } = renderHook(() => useHypotheses({ initialHubs: initial }));
      expect(result.current.getHubForFinding('f-999')).toBeUndefined();
    });

    it('returns undefined when hubs list is empty', () => {
      const { result } = renderHook(() => useHypotheses({ initialHubs: [] }));
      expect(result.current.getHubForFinding('f-001')).toBeUndefined();
    });
  });

  describe('recordDisconfirmation', () => {
    it('appends an attempt to the hub disconfirmationAttempts', () => {
      const initial = [createHypothesis('Hub', '')];
      const { result } = renderHook(() => useHypotheses({ initialHubs: initial }));
      const attempt: DisconfirmationAttempt = {
        id: 'da-001',
        attemptedAt: '2026-05-30T00:00:00Z',
        attemptedBy: { displayName: 'Analyst', upn: 'analyst@example.com' },
        description: 'Ran a gemba check on night shift',
        verdict: 'survived',
        linkedFindingIds: [],
      };
      act(() => {
        result.current.recordDisconfirmation(initial[0].id, attempt);
      });
      expect(result.current.hubs[0].disconfirmationAttempts).toHaveLength(1);
      expect(result.current.hubs[0].disconfirmationAttempts![0].id).toBe('da-001');
    });

    it('appends to existing attempts without overwriting', () => {
      const hub = createHypothesis('Hub', '');
      hub.disconfirmationAttempts = [
        {
          id: 'da-000',
          attemptedAt: '2026-05-29T00:00:00Z',
          attemptedBy: { displayName: 'A', upn: 'a@b.com' },
          description: 'First attempt',
          verdict: 'pending',
          linkedFindingIds: [],
        },
      ];
      const { result } = renderHook(() => useHypotheses({ initialHubs: [hub] }));
      act(() => {
        result.current.recordDisconfirmation(hub.id, {
          id: 'da-001',
          attemptedAt: '2026-05-30T00:00:00Z',
          attemptedBy: { displayName: 'B', upn: 'b@c.com' },
          description: 'Second attempt',
          verdict: 'survived',
          linkedFindingIds: [],
        });
      });
      expect(result.current.hubs[0].disconfirmationAttempts).toHaveLength(2);
    });

    it('updates updatedAt', () => {
      const initial = [createHypothesis('Hub', '')];
      const before = initial[0].updatedAt;
      const { result } = renderHook(() => useHypotheses({ initialHubs: initial }));
      act(() => {
        result.current.recordDisconfirmation(initial[0].id, {
          id: 'da-001',
          attemptedAt: '2026-05-30T00:00:00Z',
          attemptedBy: { displayName: 'X', upn: 'x@y.com' },
          description: 'Check',
          verdict: 'survived',
          linkedFindingIds: [],
        });
      });
      expect(result.current.hubs[0].updatedAt).toBeGreaterThanOrEqual(before);
    });

    it('calls onHubsChange', () => {
      const onChange = vi.fn();
      const initial = [createHypothesis('Hub', '')];
      const { result } = renderHook(() =>
        useHypotheses({ initialHubs: initial, onHubsChange: onChange })
      );
      act(() => {
        result.current.recordDisconfirmation(initial[0].id, {
          id: 'da-001',
          attemptedAt: '2026-05-30T00:00:00Z',
          attemptedBy: { displayName: 'X', upn: 'x@y.com' },
          description: 'Check',
          verdict: 'survived',
          linkedFindingIds: [],
        });
      });
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('is a no-op for an unknown hubId', () => {
      const initial = [createHypothesis('Hub', '')];
      const { result } = renderHook(() => useHypotheses({ initialHubs: initial }));
      act(() => {
        result.current.recordDisconfirmation('nonexistent-id', {
          id: 'da-001',
          attemptedAt: '2026-05-30T00:00:00Z',
          attemptedBy: { displayName: 'X', upn: 'x@y.com' },
          description: 'Check',
          verdict: 'survived',
          linkedFindingIds: [],
        });
      });
      expect(result.current.hubs[0].disconfirmationAttempts ?? []).toHaveLength(0);
    });
  });

  describe('integration: disconfirmation gate advances derived status live', () => {
    /**
     * Integration test for the BLOCKER from the IM-4a adversarial review:
     * recording a disconfirmation via the HOOK must advance the derived
     * hypothesis status from `needs-disconfirmation` to `confirmed` without
     * a store reload.
     *
     * The gate in `deriveHypothesisStatus` (core/survey/wall.ts) requires:
     *   - ≥2 distinct evidence types on linked findings, AND
     *   - ≥1 `survived` disconfirmation attempt.
     *
     * This test proves that calling `recordDisconfirmation` through the hook
     * updates the local hub state that `deriveHypothesisStatus` reads — i.e.,
     * the Wall's `needs-disconfirmation → confirmed` gate fires live.
     */
    it('derives confirmed after survived attempt — gate fires without reload', () => {
      // Set up a hub with ≥2 distinct evidence types (data + gemba) → needs-disconfirmation
      const hub = createHypothesis('Spindle wear', 'Vibration on night shift');
      const findings: Finding[] = [
        {
          id: 'f-data',
          text: 'Vibration rises after midnight',
          createdAt: 1,
          updatedAt: 1,
          deletedAt: null,
          context: { activeFilters: {}, cumulativeScope: null },
          evidenceType: 'data',
          status: 'analyzed',
          comments: [],
          statusChangedAt: 1,
          validationStatus: 'supports',
          refutes: false,
        } as unknown as Finding,
        {
          id: 'f-gemba',
          text: 'Operator confirms no coolant top-up at night',
          createdAt: 2,
          updatedAt: 2,
          deletedAt: null,
          context: { activeFilters: {}, cumulativeScope: null },
          evidenceType: 'gemba',
          status: 'analyzed',
          comments: [],
          statusChangedAt: 2,
          validationStatus: 'supports',
          refutes: false,
        } as unknown as Finding,
      ];
      hub.findingIds = ['f-data', 'f-gemba'];

      // Confirm gate is `needs-disconfirmation` before the attempt
      expect(deriveHypothesisStatus(hub, findings)).toBe('needs-disconfirmation');

      const { result } = renderHook(() => useHypotheses({ initialHubs: [hub] }));

      // Gate still `needs-disconfirmation` in hook state (no attempts yet)
      expect(deriveHypothesisStatus(result.current.hubs[0], findings)).toBe(
        'needs-disconfirmation'
      );

      // Record a survived attempt through the hook
      act(() => {
        result.current.recordDisconfirmation(hub.id, {
          id: 'da-survived',
          attemptedAt: '2026-05-30T00:00:00Z',
          attemptedBy: { displayName: 'Analyst', upn: 'analyst@example.com' },
          description: 'Ran coolant alternative — vibration persisted',
          verdict: 'survived',
          linkedFindingIds: [],
        });
      });

      // The hook's local hub state now carries the attempt — gate advances
      expect(deriveHypothesisStatus(result.current.hubs[0], findings)).toBe(
        'evidence-survived-test'
      );
    });

    it('derives needs-disconfirmation when attempt is pending (not yet survived)', () => {
      const hub = createHypothesis('Spindle wear', '');
      const findings: Finding[] = [
        {
          id: 'f-data',
          text: 'Data finding',
          createdAt: 1,
          updatedAt: 1,
          deletedAt: null,
          context: { activeFilters: {}, cumulativeScope: null },
          evidenceType: 'data',
          status: 'analyzed',
          comments: [],
          statusChangedAt: 1,
          validationStatus: 'supports',
          refutes: false,
        } as unknown as Finding,
        {
          id: 'f-gemba',
          text: 'Gemba finding',
          createdAt: 2,
          updatedAt: 2,
          deletedAt: null,
          context: { activeFilters: {}, cumulativeScope: null },
          evidenceType: 'gemba',
          status: 'analyzed',
          comments: [],
          statusChangedAt: 2,
          validationStatus: 'supports',
          refutes: false,
        } as unknown as Finding,
      ];
      hub.findingIds = ['f-data', 'f-gemba'];

      const { result } = renderHook(() => useHypotheses({ initialHubs: [hub] }));

      act(() => {
        result.current.recordDisconfirmation(hub.id, {
          id: 'da-pending',
          attemptedAt: '2026-05-30T00:00:00Z',
          attemptedBy: { displayName: 'Analyst', upn: 'analyst@example.com' },
          description: 'Still checking',
          verdict: 'pending',
          linkedFindingIds: [],
        });
      });

      // pending does NOT advance the gate
      expect(deriveHypothesisStatus(result.current.hubs[0], findings)).toBe(
        'needs-disconfirmation'
      );
    });
  });

  describe('setHubStatus', () => {
    it('setHubStatus updates local state and fires onHubsChange (analyst-owned)', () => {
      const onHubsChange = vi.fn();
      const { result } = renderHook(() =>
        useHypotheses({ initialHubs: [createHypothesis('H', 'S')], onHubsChange })
      );
      const id = result.current.hubs[0].id;
      act(() => result.current.setHubStatus(id, 'evidence-survived-test'));
      expect(result.current.hubs[0].status).toBe('evidence-survived-test');
      expect(onHubsChange).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id, status: 'evidence-survived-test' })])
      );
    });
  });
});
