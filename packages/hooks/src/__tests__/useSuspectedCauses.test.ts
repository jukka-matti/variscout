import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSuspectedCauses } from '../useSuspectedCauses';
import { createSuspectedCause } from '@variscout/core/findings';
import type { SuspectedCause } from '@variscout/core';

describe('useSuspectedCauses', () => {
  it('starts with empty hubs when no initialHubs provided', () => {
    const { result } = renderHook(() => useSuspectedCauses({ initialHubs: [] }));
    expect(result.current.hubs).toEqual([]);
  });

  it('starts with provided initialHubs', () => {
    const initial: SuspectedCause[] = [
      createSuspectedCause('Nozzle wear', 'High vibration at night'),
    ];
    const { result } = renderHook(() => useSuspectedCauses({ initialHubs: initial }));
    expect(result.current.hubs).toHaveLength(1);
    expect(result.current.hubs[0].name).toBe('Nozzle wear');
  });

  describe('createHub', () => {
    it('adds a hub and returns it', () => {
      const { result } = renderHook(() => useSuspectedCauses({ initialHubs: [] }));
      let created: SuspectedCause;
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
        useSuspectedCauses({ initialHubs: [], onHubsChange: onChange })
      );
      act(() => {
        result.current.createHub('Wear', '');
      });
      expect(onChange).toHaveBeenCalledWith(expect.any(Array));
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('new hub has status suspected and empty connections', () => {
      const { result } = renderHook(() => useSuspectedCauses({ initialHubs: [] }));
      act(() => {
        result.current.createHub('Test hub', '');
      });
      const hub = result.current.hubs[0];
      expect(hub.status).toBe('suspected');
      expect(hub.questionIds).toEqual([]);
      expect(hub.findingIds).toEqual([]);
    });
  });

  describe('resetHubs', () => {
    it('replaces all hubs with the provided list', () => {
      const initial = [createSuspectedCause('Old hub', '')];
      const { result } = renderHook(() => useSuspectedCauses({ initialHubs: initial }));
      const replacement = [
        createSuspectedCause('New hub A', 'synthesis A'),
        createSuspectedCause('New hub B', 'synthesis B'),
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
        useSuspectedCauses({ initialHubs: [], onHubsChange: onChange })
      );
      const newHubs = [createSuspectedCause('Migrated hub', 'from legacy causeRole')];
      act(() => {
        result.current.resetHubs(newHubs);
      });
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(newHubs);
    });

    it('replaces existing hubs with an empty list', () => {
      const initial = [createSuspectedCause('Hub', '')];
      const { result } = renderHook(() => useSuspectedCauses({ initialHubs: initial }));
      act(() => {
        result.current.resetHubs([]);
      });
      expect(result.current.hubs).toEqual([]);
    });
  });

  describe('updateHub', () => {
    it('updates name and synthesis', () => {
      const initial = [createSuspectedCause('Old name', 'Old synthesis')];
      const { result } = renderHook(() => useSuspectedCauses({ initialHubs: initial }));
      const hubId = initial[0].id;
      act(() => {
        result.current.updateHub(hubId, { name: 'New name', synthesis: 'New synthesis' });
      });
      const hub = result.current.hubs[0];
      expect(hub.name).toBe('New name');
      expect(hub.synthesis).toBe('New synthesis');
    });

    it('updates branch nextMove without changing linked evidence', () => {
      const initial = [createSuspectedCause('Hub', '', ['q-001'], ['f-001'])];
      const { result } = renderHook(() => useSuspectedCauses({ initialHubs: initial }));
      act(() => {
        result.current.updateHub(initial[0].id, {
          nextMove: 'Run a late-shift temperature check.',
        });
      });
      const hub = result.current.hubs[0];
      expect(hub.nextMove).toBe('Run a late-shift temperature check.');
      expect(hub.questionIds).toEqual(['q-001']);
      expect(hub.findingIds).toEqual(['f-001']);
    });

    it('updates updatedAt to a valid ISO timestamp', () => {
      const initial = [createSuspectedCause('Hub', '')];
      const { result } = renderHook(() => useSuspectedCauses({ initialHubs: initial }));
      act(() => {
        result.current.updateHub(initial[0].id, { name: 'Updated' });
      });
      expect(typeof result.current.hubs[0].updatedAt).toBe('number');
      expect(result.current.hubs[0].updatedAt).toBeGreaterThan(0);
    });

    it('calls onHubsChange', () => {
      const onChange = vi.fn();
      const initial = [createSuspectedCause('Hub', '')];
      const { result } = renderHook(() =>
        useSuspectedCauses({ initialHubs: initial, onHubsChange: onChange })
      );
      act(() => {
        result.current.updateHub(initial[0].id, { name: 'Updated' });
      });
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('does nothing for unknown hubId', () => {
      const initial = [createSuspectedCause('Hub', '')];
      const { result } = renderHook(() => useSuspectedCauses({ initialHubs: initial }));
      act(() => {
        result.current.updateHub('nonexistent-id', { name: 'Ghost' });
      });
      expect(result.current.hubs[0].name).toBe('Hub');
    });
  });

  describe('deleteHub', () => {
    it('removes the hub by id', () => {
      const initial = [createSuspectedCause('Hub A', ''), createSuspectedCause('Hub B', '')];
      const { result } = renderHook(() => useSuspectedCauses({ initialHubs: initial }));
      act(() => {
        result.current.deleteHub(initial[0].id);
      });
      expect(result.current.hubs).toHaveLength(1);
      expect(result.current.hubs[0].name).toBe('Hub B');
    });

    it('calls onHubsChange', () => {
      const onChange = vi.fn();
      const initial = [createSuspectedCause('Hub', '')];
      const { result } = renderHook(() =>
        useSuspectedCauses({ initialHubs: initial, onHubsChange: onChange })
      );
      act(() => {
        result.current.deleteHub(initial[0].id);
      });
      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('connectQuestion', () => {
    it('adds a questionId to the hub', () => {
      const initial = [createSuspectedCause('Hub', '')];
      const { result } = renderHook(() => useSuspectedCauses({ initialHubs: initial }));
      act(() => {
        result.current.connectQuestion(initial[0].id, 'q-001');
      });
      expect(result.current.hubs[0].questionIds).toContain('q-001');
    });

    it('does not add duplicate question connections', () => {
      const initial = [createSuspectedCause('Hub', '', ['q-001'])];
      const { result } = renderHook(() => useSuspectedCauses({ initialHubs: initial }));
      act(() => {
        result.current.connectQuestion(initial[0].id, 'q-001');
      });
      expect(result.current.hubs[0].questionIds).toHaveLength(1);
    });

    it('updates updatedAt and calls onHubsChange', () => {
      const onChange = vi.fn();
      const initial = [createSuspectedCause('Hub', '')];
      const { result } = renderHook(() =>
        useSuspectedCauses({ initialHubs: initial, onHubsChange: onChange })
      );
      act(() => {
        result.current.connectQuestion(initial[0].id, 'q-001');
      });
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(typeof result.current.hubs[0].updatedAt).toBe('number');
      expect(result.current.hubs[0].updatedAt).toBeGreaterThan(0);
    });
  });

  describe('disconnectQuestion', () => {
    it('removes a questionId from the hub', () => {
      const initial = [createSuspectedCause('Hub', '', ['q-001', 'q-002'])];
      const { result } = renderHook(() => useSuspectedCauses({ initialHubs: initial }));
      act(() => {
        result.current.disconnectQuestion(initial[0].id, 'q-001');
      });
      expect(result.current.hubs[0].questionIds).not.toContain('q-001');
      expect(result.current.hubs[0].questionIds).toContain('q-002');
    });

    it('calls onHubsChange', () => {
      const onChange = vi.fn();
      const initial = [createSuspectedCause('Hub', '', ['q-001'])];
      const { result } = renderHook(() =>
        useSuspectedCauses({ initialHubs: initial, onHubsChange: onChange })
      );
      act(() => {
        result.current.disconnectQuestion(initial[0].id, 'q-001');
      });
      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('connectFinding', () => {
    it('adds a findingId to the hub', () => {
      const initial = [createSuspectedCause('Hub', '')];
      const { result } = renderHook(() => useSuspectedCauses({ initialHubs: initial }));
      act(() => {
        result.current.connectFinding(initial[0].id, 'f-001');
      });
      expect(result.current.hubs[0].findingIds).toContain('f-001');
    });

    it('does not add duplicate finding connections', () => {
      const initial = [createSuspectedCause('Hub', '', [], ['f-001'])];
      const { result } = renderHook(() => useSuspectedCauses({ initialHubs: initial }));
      act(() => {
        result.current.connectFinding(initial[0].id, 'f-001');
      });
      expect(result.current.hubs[0].findingIds).toHaveLength(1);
    });

    it('updates updatedAt and calls onHubsChange', () => {
      const onChange = vi.fn();
      const initial = [createSuspectedCause('Hub', '')];
      const { result } = renderHook(() =>
        useSuspectedCauses({ initialHubs: initial, onHubsChange: onChange })
      );
      act(() => {
        result.current.connectFinding(initial[0].id, 'f-001');
      });
      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('disconnectFinding', () => {
    it('removes a findingId from the hub', () => {
      const initial = [createSuspectedCause('Hub', '', [], ['f-001', 'f-002'])];
      const { result } = renderHook(() => useSuspectedCauses({ initialHubs: initial }));
      act(() => {
        result.current.disconnectFinding(initial[0].id, 'f-001');
      });
      expect(result.current.hubs[0].findingIds).not.toContain('f-001');
      expect(result.current.hubs[0].findingIds).toContain('f-002');
    });

    it('calls onHubsChange', () => {
      const onChange = vi.fn();
      const initial = [createSuspectedCause('Hub', '', [], ['f-001'])];
      const { result } = renderHook(() =>
        useSuspectedCauses({ initialHubs: initial, onHubsChange: onChange })
      );
      act(() => {
        result.current.disconnectFinding(initial[0].id, 'f-001');
      });
      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('setHubStatus', () => {
    it('updates status to confirmed', () => {
      const initial = [createSuspectedCause('Hub', '')];
      const { result } = renderHook(() => useSuspectedCauses({ initialHubs: initial }));
      act(() => {
        result.current.setHubStatus(initial[0].id, 'confirmed');
      });
      expect(result.current.hubs[0].status).toBe('confirmed');
    });

    it('updates status to not-confirmed', () => {
      const initial = [createSuspectedCause('Hub', '')];
      const { result } = renderHook(() => useSuspectedCauses({ initialHubs: initial }));
      act(() => {
        result.current.setHubStatus(initial[0].id, 'not-confirmed');
      });
      expect(result.current.hubs[0].status).toBe('not-confirmed');
    });

    it('updates updatedAt and calls onHubsChange', () => {
      const onChange = vi.fn();
      const initial = [createSuspectedCause('Hub', '')];
      const { result } = renderHook(() =>
        useSuspectedCauses({ initialHubs: initial, onHubsChange: onChange })
      );
      act(() => {
        result.current.setHubStatus(initial[0].id, 'confirmed');
      });
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(typeof result.current.hubs[0].updatedAt).toBe('number');
      expect(result.current.hubs[0].updatedAt).toBeGreaterThan(0);
    });
  });

  describe('getHubForQuestion', () => {
    it('returns the hub containing the given questionId', () => {
      const initial = [
        createSuspectedCause('Hub A', '', ['q-001']),
        createSuspectedCause('Hub B', '', ['q-002']),
      ];
      const { result } = renderHook(() => useSuspectedCauses({ initialHubs: initial }));
      expect(result.current.getHubForQuestion('q-001')?.name).toBe('Hub A');
      expect(result.current.getHubForQuestion('q-002')?.name).toBe('Hub B');
    });

    it('returns undefined when no hub contains the questionId', () => {
      const initial = [createSuspectedCause('Hub', '', ['q-001'])];
      const { result } = renderHook(() => useSuspectedCauses({ initialHubs: initial }));
      expect(result.current.getHubForQuestion('q-999')).toBeUndefined();
    });

    it('returns undefined when hubs list is empty', () => {
      const { result } = renderHook(() => useSuspectedCauses({ initialHubs: [] }));
      expect(result.current.getHubForQuestion('q-001')).toBeUndefined();
    });
  });

  describe('getHubForFinding', () => {
    it('returns the hub containing the given findingId', () => {
      const initial = [
        createSuspectedCause('Hub A', '', [], ['f-001']),
        createSuspectedCause('Hub B', '', [], ['f-002']),
      ];
      const { result } = renderHook(() => useSuspectedCauses({ initialHubs: initial }));
      expect(result.current.getHubForFinding('f-001')?.name).toBe('Hub A');
      expect(result.current.getHubForFinding('f-002')?.name).toBe('Hub B');
    });

    it('returns undefined when no hub contains the findingId', () => {
      const initial = [createSuspectedCause('Hub', '', [], ['f-001'])];
      const { result } = renderHook(() => useSuspectedCauses({ initialHubs: initial }));
      expect(result.current.getHubForFinding('f-999')).toBeUndefined();
    });
  });
});
