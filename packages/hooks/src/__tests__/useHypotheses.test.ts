import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHypotheses, MAX_CHILDREN_PER_PARENT, MAX_TOTAL_HYPOTHESES } from '../useHypotheses';
import { createHypothesis } from '@variscout/core';
import type { AnovaResult, FindingProjection, GeneratedQuestion } from '@variscout/core';

const makeAnova = (etaSquared: number): AnovaResult => ({
  groups: [],
  ssb: 0,
  ssw: 0,
  dfBetween: 0,
  dfWithin: 0,
  msb: 0,
  msw: 0,
  fStatistic: 0,
  pValue: 0.05,
  isSignificant: etaSquared > 0.05,
  etaSquared,
  insight: '',
});

describe('useHypotheses', () => {
  it('starts with empty hypotheses', () => {
    const { result } = renderHook(() => useHypotheses());
    expect(result.current.hypotheses).toEqual([]);
  });

  it('starts with initial hypotheses', () => {
    const initial = [createHypothesis('Test', 'Machine')];
    const { result } = renderHook(() => useHypotheses({ initialHypotheses: initial }));
    expect(result.current.hypotheses).toHaveLength(1);
    expect(result.current.hypotheses[0].text).toBe('Test');
  });

  describe('addHypothesis', () => {
    it('adds a hypothesis', () => {
      const { result } = renderHook(() => useHypotheses());
      act(() => {
        result.current.addHypothesis('Night shift training gap');
      });
      expect(result.current.hypotheses).toHaveLength(1);
      expect(result.current.hypotheses[0].text).toBe('Night shift training gap');
    });

    it('adds with factor and level', () => {
      const { result } = renderHook(() => useHypotheses());
      act(() => {
        result.current.addHypothesis('Shift effect', 'Shift', 'Night');
      });
      expect(result.current.hypotheses[0].factor).toBe('Shift');
      expect(result.current.hypotheses[0].level).toBe('Night');
    });

    it('calls onHypothesesChange', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useHypotheses({ onHypothesesChange: onChange }));
      act(() => {
        result.current.addHypothesis('Test');
      });
      expect(onChange).toHaveBeenCalledWith(expect.any(Array));
    });
  });

  describe('editHypothesis', () => {
    it('updates hypothesis text', () => {
      const initial = [createHypothesis('Original')];
      const { result } = renderHook(() => useHypotheses({ initialHypotheses: initial }));
      act(() => {
        result.current.editHypothesis(initial[0].id, { text: 'Updated' });
      });
      expect(result.current.hypotheses[0].text).toBe('Updated');
    });

    it('updates factor and level', () => {
      const initial = [createHypothesis('Test')];
      const { result } = renderHook(() => useHypotheses({ initialHypotheses: initial }));
      act(() => {
        result.current.editHypothesis(initial[0].id, { factor: 'Machine', level: 'A' });
      });
      expect(result.current.hypotheses[0].factor).toBe('Machine');
      expect(result.current.hypotheses[0].level).toBe('A');
    });
  });

  describe('deleteHypothesis', () => {
    it('removes hypothesis and returns linked finding IDs', () => {
      const h = createHypothesis('Test');
      h.linkedFindingIds = ['f-1', 'f-2'];
      const { result } = renderHook(() => useHypotheses({ initialHypotheses: [h] }));

      let unlinked: string[] = [];
      act(() => {
        unlinked = result.current.deleteHypothesis(h.id);
      });
      expect(result.current.hypotheses).toHaveLength(0);
      expect(unlinked).toEqual(['f-1', 'f-2']);
    });
  });

  describe('linkFinding / unlinkFinding', () => {
    it('links a finding to a hypothesis', () => {
      const h = createHypothesis('Test');
      const { result } = renderHook(() => useHypotheses({ initialHypotheses: [h] }));
      act(() => {
        result.current.linkFinding(h.id, 'f-1');
      });
      expect(result.current.hypotheses[0].linkedFindingIds).toContain('f-1');
    });

    it('does not duplicate finding links', () => {
      const h = createHypothesis('Test');
      const { result } = renderHook(() => useHypotheses({ initialHypotheses: [h] }));
      act(() => {
        result.current.linkFinding(h.id, 'f-1');
        result.current.linkFinding(h.id, 'f-1');
      });
      expect(result.current.hypotheses[0].linkedFindingIds).toEqual(['f-1']);
    });

    it('unlinks a finding from a hypothesis', () => {
      const h = createHypothesis('Test');
      h.linkedFindingIds = ['f-1', 'f-2'];
      const { result } = renderHook(() => useHypotheses({ initialHypotheses: [h] }));
      act(() => {
        result.current.unlinkFinding(h.id, 'f-1');
      });
      expect(result.current.hypotheses[0].linkedFindingIds).toEqual(['f-2']);
    });
  });

  describe('getHypothesis / getByFactor', () => {
    it('gets a hypothesis by ID', () => {
      const h = createHypothesis('Test');
      const { result } = renderHook(() => useHypotheses({ initialHypotheses: [h] }));
      expect(result.current.getHypothesis(h.id)?.text).toBe('Test');
    });

    it('returns undefined for unknown ID', () => {
      const { result } = renderHook(() => useHypotheses());
      expect(result.current.getHypothesis('nope')).toBeUndefined();
    });

    it('filters by factor', () => {
      const h1 = createHypothesis('Machine issue', 'Machine');
      const h2 = createHypothesis('Shift issue', 'Shift');
      const { result } = renderHook(() => useHypotheses({ initialHypotheses: [h1, h2] }));
      expect(result.current.getByFactor('Machine')).toHaveLength(1);
      expect(result.current.getByFactor('Machine')[0].text).toBe('Machine issue');
    });
  });

  describe('auto-validation', () => {
    it('sets supported when eta² >= 15%', () => {
      const h = createHypothesis('Machine issue', 'Machine');
      const anova = { Machine: makeAnova(0.2) };
      const { result } = renderHook(() =>
        useHypotheses({ initialHypotheses: [h], anovaByFactor: anova })
      );
      expect(result.current.hypotheses[0].status).toBe('supported');
    });

    it('sets contradicted when eta² < 5%', () => {
      const h = createHypothesis('Weak factor', 'Shift');
      const anova = { Shift: makeAnova(0.03) };
      const { result } = renderHook(() =>
        useHypotheses({ initialHypotheses: [h], anovaByFactor: anova })
      );
      expect(result.current.hypotheses[0].status).toBe('contradicted');
    });

    it('sets partial when 5% <= eta² < 15%', () => {
      const h = createHypothesis('Moderate factor', 'Operator');
      const anova = { Operator: makeAnova(0.1) };
      const { result } = renderHook(() =>
        useHypotheses({ initialHypotheses: [h], anovaByFactor: anova })
      );
      expect(result.current.hypotheses[0].status).toBe('partial');
    });

    it('stays untested when no factor linked', () => {
      const h = createHypothesis('Unknown cause');
      const anova = { Machine: makeAnova(0.3) };
      const { result } = renderHook(() =>
        useHypotheses({ initialHypotheses: [h], anovaByFactor: anova })
      );
      expect(result.current.hypotheses[0].status).toBe('untested');
    });

    it('stays untested when factor has no ANOVA', () => {
      const h = createHypothesis('Missing ANOVA', 'Batch');
      const anova = { Machine: makeAnova(0.3) };
      const { result } = renderHook(() =>
        useHypotheses({ initialHypotheses: [h], anovaByFactor: anova })
      );
      expect(result.current.hypotheses[0].status).toBe('untested');
    });

    it('skips auto-validation for gemba hypotheses', () => {
      const h = createHypothesis('Gemba check', 'Machine', undefined, undefined, 'gemba');
      const anova = { Machine: makeAnova(0.3) };
      const { result } = renderHook(() =>
        useHypotheses({ initialHypotheses: [h], anovaByFactor: anova })
      );
      expect(result.current.hypotheses[0].status).toBe('untested');
    });

    it('skips auto-validation for expert hypotheses', () => {
      const h = createHypothesis('Expert opinion', 'Machine', undefined, undefined, 'expert');
      h.status = 'supported'; // manually set
      const anova = { Machine: makeAnova(0.02) }; // would be contradicted if data-type
      const { result } = renderHook(() =>
        useHypotheses({ initialHypotheses: [h], anovaByFactor: anova })
      );
      expect(result.current.hypotheses[0].status).toBe('supported');
    });
  });

  describe('sub-hypotheses', () => {
    it('adds a sub-hypothesis under a parent', () => {
      const parent = createHypothesis('Root cause');
      const { result } = renderHook(() => useHypotheses({ initialHypotheses: [parent] }));
      act(() => {
        result.current.addSubHypothesis(parent.id, 'Sub cause', 'Machine', 'A', 'data');
      });
      expect(result.current.hypotheses).toHaveLength(2);
      expect(result.current.hypotheses[1].parentId).toBe(parent.id);
      expect(result.current.hypotheses[1].validationType).toBe('data');
    });

    it('returns null for non-existent parent', () => {
      const { result } = renderHook(() => useHypotheses());
      let sub: ReturnType<typeof result.current.addSubHypothesis> = null;
      act(() => {
        sub = result.current.addSubHypothesis('nonexistent', 'Sub');
      });
      expect(sub).toBeNull();
      expect(result.current.hypotheses).toHaveLength(0);
    });

    it('enforces max depth constraint', () => {
      // Build a chain of max depth
      const root = createHypothesis('L0');
      const l1 = createHypothesis('L1', undefined, undefined, root.id);
      const l2 = createHypothesis('L2', undefined, undefined, l1.id);
      const { result } = renderHook(() => useHypotheses({ initialHypotheses: [root, l1, l2] }));
      // L2 is at depth 2, adding child would be depth 3 which is >= MAX_HYPOTHESIS_DEPTH - 1
      let sub: ReturnType<typeof result.current.addSubHypothesis> = null;
      act(() => {
        sub = result.current.addSubHypothesis(l2.id, 'Too deep');
      });
      expect(sub).toBeNull();
    });

    it('enforces max children constraint', () => {
      const parent = createHypothesis('Root');
      const children = Array.from({ length: MAX_CHILDREN_PER_PARENT }, (_, i) =>
        createHypothesis(`Child ${i}`, undefined, undefined, parent.id)
      );
      const { result } = renderHook(() =>
        useHypotheses({ initialHypotheses: [parent, ...children] })
      );
      let sub: ReturnType<typeof result.current.addSubHypothesis> = null;
      act(() => {
        sub = result.current.addSubHypothesis(parent.id, 'One too many');
      });
      expect(sub).toBeNull();
    });
  });

  describe('tree navigation', () => {
    const root = createHypothesis('Root');
    const child1 = createHypothesis('Child 1', undefined, undefined, root.id);
    const child2 = createHypothesis('Child 2', undefined, undefined, root.id);
    const grandchild = createHypothesis('Grandchild', undefined, undefined, child1.id);
    const allHypotheses = [root, child1, child2, grandchild];

    it('getChildren returns direct children', () => {
      const { result } = renderHook(() => useHypotheses({ initialHypotheses: allHypotheses }));
      expect(result.current.getChildren(root.id)).toHaveLength(2);
      expect(result.current.getChildren(child1.id)).toHaveLength(1);
      expect(result.current.getChildren(child2.id)).toHaveLength(0);
    });

    it('getRoots returns only root hypotheses', () => {
      const { result } = renderHook(() => useHypotheses({ initialHypotheses: allHypotheses }));
      const roots = result.current.getRoots();
      expect(roots).toHaveLength(1);
      expect(roots[0].text).toBe('Root');
    });

    it('getAncestors returns chain from root to parent', () => {
      const { result } = renderHook(() => useHypotheses({ initialHypotheses: allHypotheses }));
      const ancestors = result.current.getAncestors(grandchild.id);
      expect(ancestors).toHaveLength(2);
      expect(ancestors[0].text).toBe('Root');
      expect(ancestors[1].text).toBe('Child 1');
    });

    it('getDepth returns correct depth', () => {
      const { result } = renderHook(() => useHypotheses({ initialHypotheses: allHypotheses }));
      expect(result.current.getDepth(root.id)).toBe(0);
      expect(result.current.getDepth(child1.id)).toBe(1);
      expect(result.current.getDepth(grandchild.id)).toBe(2);
    });
  });

  describe('cascade delete', () => {
    it('deletes hypothesis and all descendants', () => {
      const root = createHypothesis('Root');
      root.linkedFindingIds = ['f-root'];
      const child = createHypothesis('Child', undefined, undefined, root.id);
      child.linkedFindingIds = ['f-child'];
      const grandchild = createHypothesis('GC', undefined, undefined, child.id);
      grandchild.linkedFindingIds = ['f-gc'];
      const { result } = renderHook(() =>
        useHypotheses({ initialHypotheses: [root, child, grandchild] })
      );

      let unlinked: string[] = [];
      act(() => {
        unlinked = result.current.deleteHypothesis(root.id);
      });
      expect(result.current.hypotheses).toHaveLength(0);
      expect(unlinked).toEqual(expect.arrayContaining(['f-root', 'f-child', 'f-gc']));
    });

    it('deletes only subtree, leaves siblings', () => {
      const root = createHypothesis('Root');
      const child1 = createHypothesis('Keep', undefined, undefined, root.id);
      const child2 = createHypothesis('Delete', undefined, undefined, root.id);
      const gc = createHypothesis('GC of Delete', undefined, undefined, child2.id);
      const { result } = renderHook(() =>
        useHypotheses({ initialHypotheses: [root, child1, child2, gc] })
      );

      act(() => {
        result.current.deleteHypothesis(child2.id);
      });
      expect(result.current.hypotheses).toHaveLength(2); // root + child1
      expect(result.current.hypotheses.map(h => h.text)).toEqual(['Root', 'Keep']);
    });
  });

  describe('gemba/expert validation', () => {
    it('setValidationTask updates task text', () => {
      const h = createHypothesis('Gemba check', 'Machine', undefined, undefined, 'gemba');
      const { result } = renderHook(() => useHypotheses({ initialHypotheses: [h] }));
      act(() => {
        result.current.setValidationTask(h.id, 'Go check Machine 5 nozzle');
      });
      expect(result.current.hypotheses[0].validationTask).toBe('Go check Machine 5 nozzle');
    });

    it('completeTask marks task as completed', () => {
      const h = createHypothesis('Gemba check', 'Machine', undefined, undefined, 'gemba');
      const { result } = renderHook(() => useHypotheses({ initialHypotheses: [h] }));
      act(() => {
        result.current.completeTask(h.id);
      });
      expect(result.current.hypotheses[0].taskCompleted).toBe(true);
    });

    it('setManualStatus updates status and note', () => {
      const h = createHypothesis('Expert opinion', undefined, undefined, undefined, 'expert');
      const { result } = renderHook(() => useHypotheses({ initialHypotheses: [h] }));
      act(() => {
        result.current.setManualStatus(h.id, 'supported', 'Expert confirmed nozzle wear pattern');
      });
      expect(result.current.hypotheses[0].status).toBe('supported');
      expect(result.current.hypotheses[0].manualNote).toBe('Expert confirmed nozzle wear pattern');
    });
  });

  describe('getChildrenSummary', () => {
    it('returns correct counts', () => {
      const parent = createHypothesis('Root');
      const c1 = createHypothesis('Supported', 'Machine', undefined, parent.id);
      const c2 = createHypothesis('Contradicted', 'Shift', undefined, parent.id);
      const c3 = createHypothesis('Untested', undefined, undefined, parent.id);
      const anova = {
        Machine: makeAnova(0.2), // supported
        Shift: makeAnova(0.03), // contradicted
      };
      const { result } = renderHook(() =>
        useHypotheses({ initialHypotheses: [parent, c1, c2, c3], anovaByFactor: anova })
      );
      const summary = result.current.getChildrenSummary(parent.id);
      expect(summary.supported).toBe(1);
      expect(summary.contradicted).toBe(1);
      expect(summary.untested).toBe(1);
      expect(summary.partial).toBe(0);
      expect(summary.total).toBe(3);
    });
  });

  describe('isAtCapacity', () => {
    it('returns false when under limit', () => {
      const { result } = renderHook(() => useHypotheses());
      expect(result.current.isAtCapacity).toBe(false);
    });

    it('returns true at capacity', () => {
      const many = Array.from({ length: MAX_TOTAL_HYPOTHESES }, (_, i) =>
        createHypothesis(`H${i}`)
      );
      const { result } = renderHook(() => useHypotheses({ initialHypotheses: many }));
      expect(result.current.isAtCapacity).toBe(true);
    });
  });

  describe('status propagation from children', () => {
    it('parent with all children contradicted → parent contradicted', () => {
      const parent = createHypothesis('Root');
      const c1 = createHypothesis('C1', 'A', undefined, parent.id);
      const c2 = createHypothesis('C2', 'B', undefined, parent.id);
      const anova = {
        A: makeAnova(0.02), // contradicted
        B: makeAnova(0.03), // contradicted
      };
      const { result } = renderHook(() =>
        useHypotheses({ initialHypotheses: [parent, c1, c2], anovaByFactor: anova })
      );
      expect(result.current.hypotheses.find(h => h.id === parent.id)!.status).toBe('contradicted');
    });

    it('parent with one supported child → parent supported', () => {
      const parent = createHypothesis('Root');
      const c1 = createHypothesis('C1', 'A', undefined, parent.id);
      const c2 = createHypothesis('C2', 'B', undefined, parent.id);
      const anova = {
        A: makeAnova(0.2), // supported
        B: makeAnova(0.03), // contradicted
      };
      const { result } = renderHook(() =>
        useHypotheses({ initialHypotheses: [parent, c1, c2], anovaByFactor: anova })
      );
      expect(result.current.hypotheses.find(h => h.id === parent.id)!.status).toBe('supported');
    });

    it('parent with mix of partial and contradicted → partial', () => {
      const parent = createHypothesis('Root');
      const c1 = createHypothesis('C1', 'A', undefined, parent.id);
      const c2 = createHypothesis('C2', 'B', undefined, parent.id);
      const anova = {
        A: makeAnova(0.1), // partial
        B: makeAnova(0.03), // contradicted
      };
      const { result } = renderHook(() =>
        useHypotheses({ initialHypotheses: [parent, c1, c2], anovaByFactor: anova })
      );
      expect(result.current.hypotheses.find(h => h.id === parent.id)!.status).toBe('partial');
    });

    it('parent with any untested child → keeps own status', () => {
      const parent = createHypothesis('Root', 'Machine');
      const c1 = createHypothesis('C1', 'A', undefined, parent.id);
      const c2 = createHypothesis('C2', undefined, undefined, parent.id); // no factor → untested
      const anova = {
        Machine: makeAnova(0.2), // parent's own factor → supported
        A: makeAnova(0.2), // child supported
      };
      const { result } = renderHook(() =>
        useHypotheses({ initialHypotheses: [parent, c1, c2], anovaByFactor: anova })
      );
      // Parent keeps its own data-derived status because one child is untested
      expect(result.current.hypotheses.find(h => h.id === parent.id)!.status).toBe('supported');
    });

    it('multi-level propagation (grandchild → child → root)', () => {
      const root = createHypothesis('Root');
      const child = createHypothesis('Child', undefined, undefined, root.id);
      const gc1 = createHypothesis('GC1', 'A', undefined, child.id);
      const gc2 = createHypothesis('GC2', 'B', undefined, child.id);
      const anova = {
        A: makeAnova(0.2), // supported
        B: makeAnova(0.1), // partial
      };
      const { result } = renderHook(() =>
        useHypotheses({ initialHypotheses: [root, child, gc1, gc2], anovaByFactor: anova })
      );
      // Grandchildren: supported + partial → child becomes supported (has at least one supported)
      expect(result.current.hypotheses.find(h => h.id === child.id)!.status).toBe('supported');
      // Child is only child of root, and is supported → root becomes supported
      expect(result.current.hypotheses.find(h => h.id === root.id)!.status).toBe('supported');
    });
  });

  describe('improvement ideas', () => {
    const makeProjection = (): FindingProjection => ({
      baselineMean: 18.3,
      baselineSigma: 4.2,
      projectedMean: 15.1,
      projectedSigma: 1.7,
      meanDelta: -3.2,
      sigmaDelta: -2.5,
      simulationParams: { meanAdjustment: -3.2, variationReduction: 60 },
      createdAt: new Date().toISOString(),
    });

    it('addIdea adds idea to hypothesis and returns it', () => {
      const h = createHypothesis('Root cause');
      const { result } = renderHook(() => useHypotheses({ initialHypotheses: [h] }));

      let idea: ReturnType<typeof result.current.addIdea> = null;
      act(() => {
        idea = result.current.addIdea(h.id, 'Simplify setup with visual guides');
      });

      expect(idea).not.toBeNull();
      expect(idea!.id).toBeDefined();
      expect(idea!.text).toBe('Simplify setup with visual guides');
      expect(result.current.hypotheses[0].ideas).toHaveLength(1);
      expect(result.current.hypotheses[0].ideas![0].text).toBe('Simplify setup with visual guides');
    });

    it('addIdea returns null for non-existent hypothesis', () => {
      const { result } = renderHook(() => useHypotheses());

      let idea: ReturnType<typeof result.current.addIdea> = null;
      act(() => {
        idea = result.current.addIdea('nonexistent', 'Some idea');
      });

      expect(idea).toBeNull();
    });

    it('updateIdea updates idea text, timeframe, and notes', () => {
      const h = createHypothesis('Root cause');
      const { result } = renderHook(() => useHypotheses({ initialHypotheses: [h] }));

      let ideaId: string;
      act(() => {
        const idea = result.current.addIdea(h.id, 'Original text');
        ideaId = idea!.id;
      });

      act(() => {
        result.current.updateIdea(h.id, ideaId!, {
          text: 'Updated text',
          timeframe: 'weeks',
          notes: 'Worth trying first',
        });
      });

      const updated = result.current.hypotheses[0].ideas![0];
      expect(updated.text).toBe('Updated text');
      expect(updated.timeframe).toBe('weeks');
      expect(updated.notes).toBe('Worth trying first');
    });

    it('removeIdea removes idea from hypothesis', () => {
      const h = createHypothesis('Root cause');
      const { result } = renderHook(() => useHypotheses({ initialHypotheses: [h] }));

      let ideaId: string;
      act(() => {
        const idea = result.current.addIdea(h.id, 'Idea to remove');
        ideaId = idea!.id;
      });

      expect(result.current.hypotheses[0].ideas).toHaveLength(1);

      act(() => {
        result.current.removeIdea(h.id, ideaId!);
      });

      expect(result.current.hypotheses[0].ideas).toHaveLength(0);
    });

    it('setIdeaProjection attaches projection to idea', () => {
      const h = createHypothesis('Root cause');
      const { result } = renderHook(() => useHypotheses({ initialHypotheses: [h] }));

      let ideaId: string;
      act(() => {
        const idea = result.current.addIdea(h.id, 'Reduce variation');
        ideaId = idea!.id;
      });

      const projection = makeProjection();
      act(() => {
        result.current.setIdeaProjection(h.id, ideaId!, projection);
      });

      const idea = result.current.hypotheses[0].ideas![0];
      expect(idea.projection).toBeDefined();
      expect(idea.projection!.baselineMean).toBe(18.3);
      expect(idea.projection!.projectedSigma).toBe(1.7);
      expect(idea.projection!.simulationParams.variationReduction).toBe(60);
    });

    it('selectIdea toggles selected flag', () => {
      const h = createHypothesis('Root cause');
      const { result } = renderHook(() => useHypotheses({ initialHypotheses: [h] }));

      let ideaId: string;
      act(() => {
        const idea = result.current.addIdea(h.id, 'Best idea');
        ideaId = idea!.id;
      });

      act(() => {
        result.current.selectIdea(h.id, ideaId!, true);
      });
      expect(result.current.hypotheses[0].ideas![0].selected).toBe(true);

      act(() => {
        result.current.selectIdea(h.id, ideaId!, false);
      });
      expect(result.current.hypotheses[0].ideas![0].selected).toBe(false);
    });

    it('onHypothesesChange callback fires on idea operations', () => {
      const onChange = vi.fn();
      const h = createHypothesis('Root cause');
      const { result } = renderHook(() =>
        useHypotheses({ initialHypotheses: [h], onHypothesesChange: onChange })
      );

      onChange.mockClear();

      act(() => {
        result.current.addIdea(h.id, 'New idea');
      });
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(expect.any(Array));

      const ideaId = result.current.hypotheses[0].ideas![0].id;
      onChange.mockClear();

      act(() => {
        result.current.updateIdea(h.id, ideaId, { text: 'Changed' });
      });
      expect(onChange).toHaveBeenCalledTimes(1);

      onChange.mockClear();

      act(() => {
        result.current.selectIdea(h.id, ideaId, true);
      });
      expect(onChange).toHaveBeenCalledTimes(1);

      onChange.mockClear();

      act(() => {
        result.current.removeIdea(h.id, ideaId);
      });
      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('question lifecycle', () => {
    const makeQuestion = (overrides: Partial<GeneratedQuestion> = {}): GeneratedQuestion => ({
      text: 'Does Shift explain variation?',
      factors: ['Shift'],
      rSquaredAdj: 0.25,
      autoAnswered: false,
      source: 'factor-intel',
      type: 'single-factor',
      ...overrides,
    });

    describe('generateInitialQuestions', () => {
      it('creates hypotheses from 3 generated questions with correct fields', () => {
        const questions: GeneratedQuestion[] = [
          makeQuestion({
            text: 'Does Shift explain variation?',
            factors: ['Shift'],
            rSquaredAdj: 0.25,
          }),
          makeQuestion({
            text: 'Does Machine explain variation?',
            factors: ['Machine'],
            rSquaredAdj: 0.15,
          }),
          makeQuestion({
            text: 'Does Operator explain variation?',
            factors: ['Operator'],
            rSquaredAdj: 0.08,
          }),
        ];
        const { result } = renderHook(() => useHypotheses());

        let created: ReturnType<typeof result.current.generateInitialQuestions> = [];
        act(() => {
          created = result.current.generateInitialQuestions(questions);
        });

        expect(created).toHaveLength(3);
        expect(result.current.hypotheses).toHaveLength(3);

        // Check questionSource and evidence on each
        for (let i = 0; i < 3; i++) {
          expect(created[i].questionSource).toBe('factor-intel');
          expect(created[i].evidence).toEqual({ rSquaredAdj: questions[i].rSquaredAdj });
        }

        // Check factor mapping for single-factor questions
        expect(created[0].factor).toBe('Shift');
        expect(created[1].factor).toBe('Machine');
        expect(created[2].factor).toBe('Operator');
      });

      it('sets status to contradicted for auto-ruled-out questions', () => {
        const questions: GeneratedQuestion[] = [
          makeQuestion({ rSquaredAdj: 0.03, autoAnswered: true, autoStatus: 'ruled-out' }),
        ];
        const { result } = renderHook(() => useHypotheses());

        let created: ReturnType<typeof result.current.generateInitialQuestions> = [];
        act(() => {
          created = result.current.generateInitialQuestions(questions);
        });

        expect(created[0].status).toBe('contradicted');
        expect(result.current.hypotheses[0].status).toBe('contradicted');
      });

      it('sets status to untested for non-auto questions', () => {
        const questions: GeneratedQuestion[] = [
          makeQuestion({ rSquaredAdj: 0.2, autoAnswered: false }),
        ];
        const { result } = renderHook(() => useHypotheses());

        let created: ReturnType<typeof result.current.generateInitialQuestions> = [];
        act(() => {
          created = result.current.generateInitialQuestions(questions);
        });

        expect(created[0].status).toBe('untested');
        expect(result.current.hypotheses[0].status).toBe('untested');
      });

      it('leaves factor undefined for multi-factor combination questions', () => {
        const questions: GeneratedQuestion[] = [
          makeQuestion({
            text: 'Does Shift + Machine combination explain variation?',
            factors: ['Shift', 'Machine'],
            rSquaredAdj: 0.35,
            type: 'combination',
          }),
        ];
        const { result } = renderHook(() => useHypotheses());

        let created: ReturnType<typeof result.current.generateInitialQuestions> = [];
        act(() => {
          created = result.current.generateInitialQuestions(questions);
        });

        expect(created[0].factor).toBeUndefined();
      });

      it('returns empty array and does not update state for empty input', () => {
        const onChange = vi.fn();
        const { result } = renderHook(() => useHypotheses({ onHypothesesChange: onChange }));

        let created: ReturnType<typeof result.current.generateInitialQuestions> = [];
        act(() => {
          created = result.current.generateInitialQuestions([]);
        });

        expect(created).toHaveLength(0);
        expect(result.current.hypotheses).toHaveLength(0);
        expect(onChange).not.toHaveBeenCalled();
      });
    });

    describe('answerQuestion', () => {
      it('transitions status and links finding', () => {
        const { result } = renderHook(() => useHypotheses());

        let questionId: string;
        act(() => {
          const created = result.current.generateInitialQuestions([makeQuestion()]);
          questionId = created[0].id;
        });

        act(() => {
          result.current.answerQuestion(questionId!, 'finding-1', 'supported');
        });

        const answered = result.current.hypotheses[0];
        expect(answered.status).toBe('supported');
        expect(answered.linkedFindingIds).toContain('finding-1');
      });

      it('does not duplicate finding in linkedFindingIds', () => {
        const { result } = renderHook(() => useHypotheses());

        let questionId: string;
        act(() => {
          const created = result.current.generateInitialQuestions([makeQuestion()]);
          questionId = created[0].id;
        });

        act(() => {
          result.current.answerQuestion(questionId!, 'finding-1', 'supported');
        });
        act(() => {
          result.current.answerQuestion(questionId!, 'finding-1', 'partial');
        });

        const answered = result.current.hypotheses[0];
        expect(answered.status).toBe('partial');
        expect(answered.linkedFindingIds).toEqual(['finding-1']);
      });

      it('does nothing for non-existent question ID (no crash)', () => {
        const { result } = renderHook(() => useHypotheses());

        // Should not throw
        act(() => {
          result.current.answerQuestion('nonexistent-id', 'finding-1', 'contradicted');
        });

        expect(result.current.hypotheses).toHaveLength(0);
      });
    });

    describe('focusedQuestionId', () => {
      it('starts as null', () => {
        const { result } = renderHook(() => useHypotheses());
        expect(result.current.focusedQuestionId).toBeNull();
      });

      it('can be set to a question ID', () => {
        const { result } = renderHook(() => useHypotheses());

        let questionId: string;
        act(() => {
          const created = result.current.generateInitialQuestions([makeQuestion()]);
          questionId = created[0].id;
        });

        act(() => {
          result.current.setFocusedQuestion(questionId!);
        });

        expect(result.current.focusedQuestionId).toBe(questionId!);
      });

      it('can be cleared by setting to null', () => {
        const { result } = renderHook(() => useHypotheses());

        act(() => {
          result.current.setFocusedQuestion('some-question-id');
        });
        expect(result.current.focusedQuestionId).toBe('some-question-id');

        act(() => {
          result.current.setFocusedQuestion(null);
        });
        expect(result.current.focusedQuestionId).toBeNull();
      });
    });
  });
});
