import { describe, it, expect, beforeEach } from 'vitest';
import { useImprovementStore } from '../improvementStore';
import type { ImprovementQuestion } from '../improvementStore';

/** Reset store to defaults before each test. */
beforeEach(() => {
  useImprovementStore.setState({
    improvementQuestions: [],
    improvementLinkedFindings: [],
    selectedIdeaIds: new Set<string>(),
    projectedCpkMap: {},
    convertedIdeaIds: new Set<string>(),
  });
});

describe('improvementStore', () => {
  describe('initial state', () => {
    it('has empty arrays, empty Sets, and empty map', () => {
      const s = useImprovementStore.getState();
      expect(s.improvementQuestions).toEqual([]);
      expect(s.improvementLinkedFindings).toEqual([]);
      expect(s.selectedIdeaIds).toEqual(new Set());
      expect(s.projectedCpkMap).toEqual({});
      expect(s.convertedIdeaIds).toEqual(new Set());
    });

    it('has Sets that are instanceof Set', () => {
      const s = useImprovementStore.getState();
      expect(s.selectedIdeaIds).toBeInstanceOf(Set);
      expect(s.convertedIdeaIds).toBeInstanceOf(Set);
    });
  });

  describe('syncState', () => {
    it('updates all fields with a full state sync', () => {
      const questions: ImprovementQuestion[] = [
        { id: 'h1', text: 'Root cause A', ideas: [] },
        { id: 'h2', text: 'Root cause B', ideas: [] },
      ];
      const linkedFindings = [{ id: 'f1', text: 'Finding 1' }];
      const selectedIdeaIds = new Set(['idea-1', 'idea-2']);
      const projectedCpkMap = { f1: 1.45 };
      const convertedIdeaIds = new Set(['idea-1']);

      useImprovementStore.getState().syncState({
        improvementQuestions: questions,
        improvementLinkedFindings: linkedFindings,
        selectedIdeaIds,
        projectedCpkMap,
        convertedIdeaIds,
      });

      const s = useImprovementStore.getState();
      expect(s.improvementQuestions).toBe(questions);
      expect(s.improvementQuestions).toHaveLength(2);
      expect(s.improvementLinkedFindings).toBe(linkedFindings);
      expect(s.selectedIdeaIds).toBe(selectedIdeaIds);
      expect(s.selectedIdeaIds.size).toBe(2);
      expect(s.projectedCpkMap).toBe(projectedCpkMap);
      expect(s.convertedIdeaIds).toBe(convertedIdeaIds);
      expect(s.convertedIdeaIds.size).toBe(1);
    });

    it('preserves Set instances through sync', () => {
      const selectedIdeaIds = new Set(['idea-a']);
      const convertedIdeaIds = new Set(['idea-b']);

      useImprovementStore.getState().syncState({
        improvementQuestions: [],
        improvementLinkedFindings: [],
        selectedIdeaIds,
        projectedCpkMap: {},
        convertedIdeaIds,
      });

      const s = useImprovementStore.getState();
      expect(s.selectedIdeaIds).toBeInstanceOf(Set);
      expect(s.convertedIdeaIds).toBeInstanceOf(Set);
      expect(s.selectedIdeaIds.has('idea-a')).toBe(true);
      expect(s.convertedIdeaIds.has('idea-b')).toBe(true);
    });

    it('overwrites previous state on subsequent sync', () => {
      useImprovementStore.getState().syncState({
        improvementQuestions: [{ id: 'h1', text: 'First', ideas: [] }],
        improvementLinkedFindings: [{ id: 'f1', text: 'Finding 1' }],
        selectedIdeaIds: new Set(['old-idea']),
        projectedCpkMap: { f1: 1.0 },
        convertedIdeaIds: new Set(['old-converted']),
      });

      const newHypotheses: ImprovementQuestion[] = [{ id: 'h2', text: 'Second', ideas: [] }];

      useImprovementStore.getState().syncState({
        improvementQuestions: newHypotheses,
        improvementLinkedFindings: [],
        selectedIdeaIds: new Set(['new-idea']),
        projectedCpkMap: { f2: 2.0 },
        convertedIdeaIds: new Set(),
      });

      const s = useImprovementStore.getState();
      expect(s.improvementQuestions).toBe(newHypotheses);
      expect(s.improvementQuestions).toHaveLength(1);
      expect(s.improvementQuestions[0].id).toBe('h2');
      expect(s.improvementLinkedFindings).toEqual([]);
      expect(s.selectedIdeaIds.has('old-idea')).toBe(false);
      expect(s.selectedIdeaIds.has('new-idea')).toBe(true);
      expect(s.projectedCpkMap).toEqual({ f2: 2.0 });
      expect(s.convertedIdeaIds.size).toBe(0);
    });

    it('handles empty collections', () => {
      // First set some data
      useImprovementStore.getState().syncState({
        improvementQuestions: [{ id: 'h1', text: 'test', ideas: [] }],
        improvementLinkedFindings: [{ id: 'f1', text: 'test' }],
        selectedIdeaIds: new Set(['idea-1']),
        projectedCpkMap: { f1: 1.5 },
        convertedIdeaIds: new Set(['idea-1']),
      });

      // Then sync empty state
      useImprovementStore.getState().syncState({
        improvementQuestions: [],
        improvementLinkedFindings: [],
        selectedIdeaIds: new Set(),
        projectedCpkMap: {},
        convertedIdeaIds: new Set(),
      });

      const s = useImprovementStore.getState();
      expect(s.improvementQuestions).toEqual([]);
      expect(s.improvementLinkedFindings).toEqual([]);
      expect(s.selectedIdeaIds.size).toBe(0);
      expect(s.projectedCpkMap).toEqual({});
      expect(s.convertedIdeaIds.size).toBe(0);
    });
  });
});
