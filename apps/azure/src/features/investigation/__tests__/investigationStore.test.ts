import { describe, it, expect, beforeEach } from 'vitest';
import { useInvestigationStore } from '../investigationStore';

/** Reset store to defaults before each test. */
beforeEach(() => {
  useInvestigationStore.setState({
    hypotheses: [],
    hypothesesMap: {},
    ideaImpacts: {},
    projectionTarget: null,
    expandedHypothesisId: null,
  });
});

describe('investigationStore', () => {
  describe('initial state', () => {
    it('has correct defaults for all 5 fields', () => {
      const s = useInvestigationStore.getState();
      expect(s.hypotheses).toEqual([]);
      expect(s.hypothesesMap).toEqual({});
      expect(s.ideaImpacts).toEqual({});
      expect(s.projectionTarget).toBeNull();
      expect(s.expandedHypothesisId).toBeNull();
    });
  });

  describe('syncHypotheses', () => {
    it('sets hypotheses array', () => {
      const hypotheses = [
        { id: 'h1', text: 'Head 3 causes variation', status: 'testing' },
        { id: 'h2', text: 'Temperature drift', status: 'confirmed' },
      ];
      useInvestigationStore.getState().syncHypotheses(hypotheses as never[]);
      expect(useInvestigationStore.getState().hypotheses).toHaveLength(2);
      expect(useInvestigationStore.getState().hypotheses[0]).toEqual(hypotheses[0]);
    });

    it('clears with empty array', () => {
      useInvestigationStore.getState().syncHypotheses([{ id: 'h1' }] as never[]);
      useInvestigationStore.getState().syncHypotheses([]);
      expect(useInvestigationStore.getState().hypotheses).toEqual([]);
    });

    it('overwrites previous hypotheses', () => {
      useInvestigationStore.getState().syncHypotheses([{ id: 'h1' }] as never[]);
      useInvestigationStore.getState().syncHypotheses([{ id: 'h2' }, { id: 'h3' }] as never[]);
      expect(useInvestigationStore.getState().hypotheses).toHaveLength(2);
    });
  });

  describe('syncHypothesesMap', () => {
    it('sets map of hypothesis display data', () => {
      const map = {
        h1: { text: 'Head 3 causes variation', status: 'testing', factor: 'Head', level: '3' },
        h2: { text: 'Temperature drift', status: 'confirmed', causeRole: 'primary' as const },
      };
      useInvestigationStore.getState().syncHypothesesMap(map as never);
      const result = useInvestigationStore.getState().hypothesesMap;
      expect(result).toHaveProperty('h1');
      expect(result).toHaveProperty('h2');
    });

    it('clears with empty object', () => {
      useInvestigationStore
        .getState()
        .syncHypothesesMap({ h1: { text: 't', status: 's' } } as never);
      useInvestigationStore.getState().syncHypothesesMap({});
      expect(useInvestigationStore.getState().hypothesesMap).toEqual({});
    });
  });

  describe('syncIdeaImpacts', () => {
    it('sets idea impacts record', () => {
      const impacts = { idea1: 'high' as const, idea2: 'medium' as const };
      useInvestigationStore.getState().syncIdeaImpacts(impacts);
      expect(useInvestigationStore.getState().ideaImpacts).toEqual(impacts);
    });

    it('handles undefined values', () => {
      const impacts: Record<string, 'low' | 'medium' | 'high' | undefined> = {
        idea1: undefined,
        idea2: 'low',
      };
      useInvestigationStore.getState().syncIdeaImpacts(impacts);
      expect(useInvestigationStore.getState().ideaImpacts.idea1).toBeUndefined();
      expect(useInvestigationStore.getState().ideaImpacts.idea2).toBe('low');
    });

    it('clears with empty object', () => {
      useInvestigationStore.getState().syncIdeaImpacts({ idea1: 'high' });
      useInvestigationStore.getState().syncIdeaImpacts({});
      expect(useInvestigationStore.getState().ideaImpacts).toEqual({});
    });
  });

  describe('setProjectionTarget', () => {
    it('sets projection target object', () => {
      const target = {
        hypothesisId: 'h1',
        ideaId: 'idea1',
        ideaText: 'Calibrate head 3',
        hypothesisText: 'Head 3 causes variation',
      };
      useInvestigationStore.getState().setProjectionTarget(target);
      expect(useInvestigationStore.getState().projectionTarget).toEqual(target);
    });

    it('clears with null', () => {
      useInvestigationStore.getState().setProjectionTarget({
        hypothesisId: 'h1',
        ideaId: 'i1',
        ideaText: 'Fix',
        hypothesisText: 'Root cause',
      });
      useInvestigationStore.getState().setProjectionTarget(null);
      expect(useInvestigationStore.getState().projectionTarget).toBeNull();
    });

    it('overwrites previous target', () => {
      useInvestigationStore.getState().setProjectionTarget({
        hypothesisId: 'h1',
        ideaId: 'i1',
        ideaText: 'First',
        hypothesisText: 'First hypothesis',
      });
      const newTarget = {
        hypothesisId: 'h2',
        ideaId: 'i2',
        ideaText: 'Second',
        hypothesisText: 'Second hypothesis',
      };
      useInvestigationStore.getState().setProjectionTarget(newTarget);
      expect(useInvestigationStore.getState().projectionTarget).toEqual(newTarget);
    });
  });

  describe('expandToHypothesis', () => {
    it('sets expanded hypothesis id', () => {
      useInvestigationStore.getState().expandToHypothesis('h1');
      expect(useInvestigationStore.getState().expandedHypothesisId).toBe('h1');
    });

    it('clears with null', () => {
      useInvestigationStore.getState().expandToHypothesis('h1');
      useInvestigationStore.getState().expandToHypothesis(null);
      expect(useInvestigationStore.getState().expandedHypothesisId).toBeNull();
    });

    it('changes to different hypothesis', () => {
      useInvestigationStore.getState().expandToHypothesis('h1');
      useInvestigationStore.getState().expandToHypothesis('h2');
      expect(useInvestigationStore.getState().expandedHypothesisId).toBe('h2');
    });
  });
});
