import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuestions, MAX_CHILDREN_PER_PARENT, MAX_TOTAL_QUESTIONS } from '../useQuestions';
import { createQuestion } from '@variscout/core';
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

describe('useQuestions', () => {
  it('starts with empty questions', () => {
    const { result } = renderHook(() => useQuestions());
    expect(result.current.questions).toEqual([]);
  });

  it('starts with initial questions', () => {
    const initial = [createQuestion('Test', 'Machine')];
    const { result } = renderHook(() => useQuestions({ initialQuestions: initial }));
    expect(result.current.questions).toHaveLength(1);
    expect(result.current.questions[0].text).toBe('Test');
  });

  describe('addQuestion', () => {
    it('adds a question', () => {
      const { result } = renderHook(() => useQuestions());
      act(() => {
        result.current.addQuestion('Night shift training gap');
      });
      expect(result.current.questions).toHaveLength(1);
      expect(result.current.questions[0].text).toBe('Night shift training gap');
    });

    it('adds with factor and level', () => {
      const { result } = renderHook(() => useQuestions());
      act(() => {
        result.current.addQuestion('Shift effect', 'Shift', 'Night');
      });
      expect(result.current.questions[0].factor).toBe('Shift');
      expect(result.current.questions[0].level).toBe('Night');
    });

    it('calls onQuestionsChange', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useQuestions({ onQuestionsChange: onChange }));
      act(() => {
        result.current.addQuestion('Test');
      });
      expect(onChange).toHaveBeenCalledWith(expect.any(Array));
    });
  });

  describe('editQuestion', () => {
    it('updates question text', () => {
      const initial = [createQuestion('Original')];
      const { result } = renderHook(() => useQuestions({ initialQuestions: initial }));
      act(() => {
        result.current.editQuestion(initial[0].id, { text: 'Updated' });
      });
      expect(result.current.questions[0].text).toBe('Updated');
    });

    it('updates factor and level', () => {
      const initial = [createQuestion('Test')];
      const { result } = renderHook(() => useQuestions({ initialQuestions: initial }));
      act(() => {
        result.current.editQuestion(initial[0].id, { factor: 'Machine', level: 'A' });
      });
      expect(result.current.questions[0].factor).toBe('Machine');
      expect(result.current.questions[0].level).toBe('A');
    });
  });

  describe('deleteQuestion', () => {
    it('removes question and returns linked finding IDs', () => {
      const q = createQuestion('Test');
      q.linkedFindingIds = ['f-1', 'f-2'];
      const { result } = renderHook(() => useQuestions({ initialQuestions: [q] }));

      let unlinked: string[] = [];
      act(() => {
        unlinked = result.current.deleteQuestion(q.id);
      });
      expect(result.current.questions).toHaveLength(0);
      expect(unlinked).toEqual(['f-1', 'f-2']);
    });
  });

  describe('linkFinding / unlinkFinding', () => {
    it('links a finding to a question', () => {
      const q = createQuestion('Test');
      const { result } = renderHook(() => useQuestions({ initialQuestions: [q] }));
      act(() => {
        result.current.linkFinding(q.id, 'f-1');
      });
      expect(result.current.questions[0].linkedFindingIds).toContain('f-1');
    });

    it('does not duplicate finding links', () => {
      const q = createQuestion('Test');
      const { result } = renderHook(() => useQuestions({ initialQuestions: [q] }));
      act(() => {
        result.current.linkFinding(q.id, 'f-1');
        result.current.linkFinding(q.id, 'f-1');
      });
      expect(result.current.questions[0].linkedFindingIds).toEqual(['f-1']);
    });

    it('unlinks a finding from a question', () => {
      const q = createQuestion('Test');
      q.linkedFindingIds = ['f-1', 'f-2'];
      const { result } = renderHook(() => useQuestions({ initialQuestions: [q] }));
      act(() => {
        result.current.unlinkFinding(q.id, 'f-1');
      });
      expect(result.current.questions[0].linkedFindingIds).toEqual(['f-2']);
    });
  });

  describe('getQuestion / getByFactor', () => {
    it('gets a question by ID', () => {
      const q = createQuestion('Test');
      const { result } = renderHook(() => useQuestions({ initialQuestions: [q] }));
      expect(result.current.getQuestion(q.id)?.text).toBe('Test');
    });

    it('returns undefined for unknown ID', () => {
      const { result } = renderHook(() => useQuestions());
      expect(result.current.getQuestion('nope')).toBeUndefined();
    });

    it('filters by factor', () => {
      const q1 = createQuestion('Machine issue', 'Machine');
      const q2 = createQuestion('Shift issue', 'Shift');
      const { result } = renderHook(() => useQuestions({ initialQuestions: [q1, q2] }));
      expect(result.current.getByFactor('Machine')).toHaveLength(1);
      expect(result.current.getByFactor('Machine')[0].text).toBe('Machine issue');
    });
  });

  describe('auto-validation', () => {
    it('sets answered when eta² >= 15%', () => {
      const q = createQuestion('Machine issue', 'Machine');
      const anova = { Machine: makeAnova(0.2) };
      const { result } = renderHook(() =>
        useQuestions({ initialQuestions: [q], anovaByFactor: anova })
      );
      expect(result.current.questions[0].status).toBe('answered');
    });

    it('sets ruled-out when eta² < 5%', () => {
      const q = createQuestion('Weak factor', 'Shift');
      const anova = { Shift: makeAnova(0.03) };
      const { result } = renderHook(() =>
        useQuestions({ initialQuestions: [q], anovaByFactor: anova })
      );
      expect(result.current.questions[0].status).toBe('ruled-out');
    });

    it('sets investigating when 5% <= eta² < 15%', () => {
      const q = createQuestion('Moderate factor', 'Operator');
      const anova = { Operator: makeAnova(0.1) };
      const { result } = renderHook(() =>
        useQuestions({ initialQuestions: [q], anovaByFactor: anova })
      );
      expect(result.current.questions[0].status).toBe('investigating');
    });

    it('stays open when no factor linked', () => {
      const q = createQuestion('Unknown cause');
      const anova = { Machine: makeAnova(0.3) };
      const { result } = renderHook(() =>
        useQuestions({ initialQuestions: [q], anovaByFactor: anova })
      );
      expect(result.current.questions[0].status).toBe('open');
    });

    it('stays open when factor has no ANOVA', () => {
      const q = createQuestion('Missing ANOVA', 'Batch');
      const anova = { Machine: makeAnova(0.3) };
      const { result } = renderHook(() =>
        useQuestions({ initialQuestions: [q], anovaByFactor: anova })
      );
      expect(result.current.questions[0].status).toBe('open');
    });

    it('skips auto-validation for gemba questions', () => {
      const q = createQuestion('Gemba check', 'Machine', undefined, undefined, 'gemba');
      const anova = { Machine: makeAnova(0.3) };
      const { result } = renderHook(() =>
        useQuestions({ initialQuestions: [q], anovaByFactor: anova })
      );
      expect(result.current.questions[0].status).toBe('open');
    });

    it('skips auto-validation for expert questions', () => {
      const q = createQuestion('Expert opinion', 'Machine', undefined, undefined, 'expert');
      q.status = 'answered'; // manually set
      const anova = { Machine: makeAnova(0.02) }; // would be ruled-out if data-type
      const { result } = renderHook(() =>
        useQuestions({ initialQuestions: [q], anovaByFactor: anova })
      );
      expect(result.current.questions[0].status).toBe('answered');
    });
  });

  describe('sub-questions', () => {
    it('adds a sub-question under a parent', () => {
      const parent = createQuestion('Root cause');
      const { result } = renderHook(() => useQuestions({ initialQuestions: [parent] }));
      act(() => {
        result.current.addSubQuestion(parent.id, 'Sub cause', 'Machine', 'A', 'data');
      });
      expect(result.current.questions).toHaveLength(2);
      expect(result.current.questions[1].parentId).toBe(parent.id);
      expect(result.current.questions[1].validationType).toBe('data');
    });

    it('returns null for non-existent parent', () => {
      const { result } = renderHook(() => useQuestions());
      let sub: ReturnType<typeof result.current.addSubQuestion> = null;
      act(() => {
        sub = result.current.addSubQuestion('nonexistent', 'Sub');
      });
      expect(sub).toBeNull();
      expect(result.current.questions).toHaveLength(0);
    });

    it('enforces max depth constraint', () => {
      // Build a chain of max depth
      const root = createQuestion('L0');
      const l1 = createQuestion('L1', undefined, undefined, root.id);
      const l2 = createQuestion('L2', undefined, undefined, l1.id);
      const { result } = renderHook(() => useQuestions({ initialQuestions: [root, l1, l2] }));
      // L2 is at depth 2, adding child would be depth 3 which is >= MAX_QUESTION_DEPTH - 1
      let sub: ReturnType<typeof result.current.addSubQuestion> = null;
      act(() => {
        sub = result.current.addSubQuestion(l2.id, 'Too deep');
      });
      expect(sub).toBeNull();
    });

    it('enforces max children constraint', () => {
      const parent = createQuestion('Root');
      const children = Array.from({ length: MAX_CHILDREN_PER_PARENT }, (_, i) =>
        createQuestion(`Child ${i}`, undefined, undefined, parent.id)
      );
      const { result } = renderHook(() =>
        useQuestions({ initialQuestions: [parent, ...children] })
      );
      let sub: ReturnType<typeof result.current.addSubQuestion> = null;
      act(() => {
        sub = result.current.addSubQuestion(parent.id, 'One too many');
      });
      expect(sub).toBeNull();
    });
  });

  describe('tree navigation', () => {
    const root = createQuestion('Root');
    const child1 = createQuestion('Child 1', undefined, undefined, root.id);
    const child2 = createQuestion('Child 2', undefined, undefined, root.id);
    const grandchild = createQuestion('Grandchild', undefined, undefined, child1.id);
    const allQuestions = [root, child1, child2, grandchild];

    it('getChildren returns direct children', () => {
      const { result } = renderHook(() => useQuestions({ initialQuestions: allQuestions }));
      expect(result.current.getChildren(root.id)).toHaveLength(2);
      expect(result.current.getChildren(child1.id)).toHaveLength(1);
      expect(result.current.getChildren(child2.id)).toHaveLength(0);
    });

    it('getRoots returns only root questions', () => {
      const { result } = renderHook(() => useQuestions({ initialQuestions: allQuestions }));
      const roots = result.current.getRoots();
      expect(roots).toHaveLength(1);
      expect(roots[0].text).toBe('Root');
    });

    it('getAncestors returns chain from root to parent', () => {
      const { result } = renderHook(() => useQuestions({ initialQuestions: allQuestions }));
      const ancestors = result.current.getAncestors(grandchild.id);
      expect(ancestors).toHaveLength(2);
      expect(ancestors[0].text).toBe('Root');
      expect(ancestors[1].text).toBe('Child 1');
    });

    it('getDepth returns correct depth', () => {
      const { result } = renderHook(() => useQuestions({ initialQuestions: allQuestions }));
      expect(result.current.getDepth(root.id)).toBe(0);
      expect(result.current.getDepth(child1.id)).toBe(1);
      expect(result.current.getDepth(grandchild.id)).toBe(2);
    });
  });

  describe('cascade delete', () => {
    it('deletes question and all descendants', () => {
      const root = createQuestion('Root');
      root.linkedFindingIds = ['f-root'];
      const child = createQuestion('Child', undefined, undefined, root.id);
      child.linkedFindingIds = ['f-child'];
      const grandchild = createQuestion('GC', undefined, undefined, child.id);
      grandchild.linkedFindingIds = ['f-gc'];
      const { result } = renderHook(() =>
        useQuestions({ initialQuestions: [root, child, grandchild] })
      );

      let unlinked: string[] = [];
      act(() => {
        unlinked = result.current.deleteQuestion(root.id);
      });
      expect(result.current.questions).toHaveLength(0);
      expect(unlinked).toEqual(expect.arrayContaining(['f-root', 'f-child', 'f-gc']));
    });

    it('deletes only subtree, leaves siblings', () => {
      const root = createQuestion('Root');
      const child1 = createQuestion('Keep', undefined, undefined, root.id);
      const child2 = createQuestion('Delete', undefined, undefined, root.id);
      const gc = createQuestion('GC of Delete', undefined, undefined, child2.id);
      const { result } = renderHook(() =>
        useQuestions({ initialQuestions: [root, child1, child2, gc] })
      );

      act(() => {
        result.current.deleteQuestion(child2.id);
      });
      expect(result.current.questions).toHaveLength(2); // root + child1
      expect(result.current.questions.map(q => q.text)).toEqual(['Root', 'Keep']);
    });
  });

  describe('gemba/expert validation', () => {
    it('setValidationTask updates task text', () => {
      const q = createQuestion('Gemba check', 'Machine', undefined, undefined, 'gemba');
      const { result } = renderHook(() => useQuestions({ initialQuestions: [q] }));
      act(() => {
        result.current.setValidationTask(q.id, 'Go check Machine 5 nozzle');
      });
      expect(result.current.questions[0].validationTask).toBe('Go check Machine 5 nozzle');
    });

    it('completeTask marks task as completed', () => {
      const q = createQuestion('Gemba check', 'Machine', undefined, undefined, 'gemba');
      const { result } = renderHook(() => useQuestions({ initialQuestions: [q] }));
      act(() => {
        result.current.completeTask(q.id);
      });
      expect(result.current.questions[0].taskCompleted).toBe(true);
    });

    it('setManualStatus updates status and note', () => {
      const q = createQuestion('Expert opinion', undefined, undefined, undefined, 'expert');
      const { result } = renderHook(() => useQuestions({ initialQuestions: [q] }));
      act(() => {
        result.current.setManualStatus(q.id, 'answered', 'Expert confirmed nozzle wear pattern');
      });
      expect(result.current.questions[0].status).toBe('answered');
      expect(result.current.questions[0].manualNote).toBe('Expert confirmed nozzle wear pattern');
    });
  });

  describe('getChildrenSummary', () => {
    it('returns correct counts', () => {
      const parent = createQuestion('Root');
      const c1 = createQuestion('Answered', 'Machine', undefined, parent.id);
      const c2 = createQuestion('Ruled out', 'Shift', undefined, parent.id);
      const c3 = createQuestion('Open', undefined, undefined, parent.id);
      const anova = {
        Machine: makeAnova(0.2), // answered
        Shift: makeAnova(0.03), // ruled-out
      };
      const { result } = renderHook(() =>
        useQuestions({ initialQuestions: [parent, c1, c2, c3], anovaByFactor: anova })
      );
      const summary = result.current.getChildrenSummary(parent.id);
      expect(summary.answered).toBe(1);
      expect(summary['ruled-out']).toBe(1);
      expect(summary.open).toBe(1);
      expect(summary.investigating).toBe(0);
      expect(summary.total).toBe(3);
    });
  });

  describe('isAtCapacity', () => {
    it('returns false when under limit', () => {
      const { result } = renderHook(() => useQuestions());
      expect(result.current.isAtCapacity).toBe(false);
    });

    it('returns true at capacity', () => {
      const many = Array.from({ length: MAX_TOTAL_QUESTIONS }, (_, i) => createQuestion(`Q${i}`));
      const { result } = renderHook(() => useQuestions({ initialQuestions: many }));
      expect(result.current.isAtCapacity).toBe(true);
    });
  });

  describe('status propagation from children', () => {
    it('parent with all children ruled-out → parent ruled-out', () => {
      const parent = createQuestion('Root');
      const c1 = createQuestion('C1', 'A', undefined, parent.id);
      const c2 = createQuestion('C2', 'B', undefined, parent.id);
      const anova = {
        A: makeAnova(0.02), // ruled-out
        B: makeAnova(0.03), // ruled-out
      };
      const { result } = renderHook(() =>
        useQuestions({ initialQuestions: [parent, c1, c2], anovaByFactor: anova })
      );
      expect(result.current.questions.find(q => q.id === parent.id)!.status).toBe('ruled-out');
    });

    it('parent with one answered child → parent answered', () => {
      const parent = createQuestion('Root');
      const c1 = createQuestion('C1', 'A', undefined, parent.id);
      const c2 = createQuestion('C2', 'B', undefined, parent.id);
      const anova = {
        A: makeAnova(0.2), // answered
        B: makeAnova(0.03), // ruled-out
      };
      const { result } = renderHook(() =>
        useQuestions({ initialQuestions: [parent, c1, c2], anovaByFactor: anova })
      );
      expect(result.current.questions.find(q => q.id === parent.id)!.status).toBe('answered');
    });

    it('parent with mix of investigating and ruled-out → investigating', () => {
      const parent = createQuestion('Root');
      const c1 = createQuestion('C1', 'A', undefined, parent.id);
      const c2 = createQuestion('C2', 'B', undefined, parent.id);
      const anova = {
        A: makeAnova(0.1), // investigating
        B: makeAnova(0.03), // ruled-out
      };
      const { result } = renderHook(() =>
        useQuestions({ initialQuestions: [parent, c1, c2], anovaByFactor: anova })
      );
      expect(result.current.questions.find(q => q.id === parent.id)!.status).toBe('investigating');
    });

    it('parent with any open child → keeps own status', () => {
      const parent = createQuestion('Root', 'Machine');
      const c1 = createQuestion('C1', 'A', undefined, parent.id);
      const c2 = createQuestion('C2', undefined, undefined, parent.id); // no factor → open
      const anova = {
        Machine: makeAnova(0.2), // parent's own factor → answered
        A: makeAnova(0.2), // child answered
      };
      const { result } = renderHook(() =>
        useQuestions({ initialQuestions: [parent, c1, c2], anovaByFactor: anova })
      );
      // Parent keeps its own data-derived status because one child is open
      expect(result.current.questions.find(q => q.id === parent.id)!.status).toBe('answered');
    });

    it('multi-level propagation (grandchild → child → root)', () => {
      const root = createQuestion('Root');
      const child = createQuestion('Child', undefined, undefined, root.id);
      const gc1 = createQuestion('GC1', 'A', undefined, child.id);
      const gc2 = createQuestion('GC2', 'B', undefined, child.id);
      const anova = {
        A: makeAnova(0.2), // answered
        B: makeAnova(0.1), // investigating
      };
      const { result } = renderHook(() =>
        useQuestions({ initialQuestions: [root, child, gc1, gc2], anovaByFactor: anova })
      );
      // Grandchildren: answered + investigating → child becomes answered (has at least one answered)
      expect(result.current.questions.find(q => q.id === child.id)!.status).toBe('answered');
      // Child is only child of root, and is answered → root becomes answered
      expect(result.current.questions.find(q => q.id === root.id)!.status).toBe('answered');
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

    it('addIdea adds idea to question and returns it', () => {
      const q = createQuestion('Root cause');
      const { result } = renderHook(() => useQuestions({ initialQuestions: [q] }));

      let idea: ReturnType<typeof result.current.addIdea> = null;
      act(() => {
        idea = result.current.addIdea(q.id, 'Simplify setup with visual guides');
      });

      expect(idea).not.toBeNull();
      expect(idea!.id).toBeDefined();
      expect(idea!.text).toBe('Simplify setup with visual guides');
      expect(result.current.questions[0].ideas).toHaveLength(1);
      expect(result.current.questions[0].ideas![0].text).toBe('Simplify setup with visual guides');
    });

    it('addIdea returns null for non-existent question', () => {
      const { result } = renderHook(() => useQuestions());

      let idea: ReturnType<typeof result.current.addIdea> = null;
      act(() => {
        idea = result.current.addIdea('nonexistent', 'Some idea');
      });

      expect(idea).toBeNull();
    });

    it('updateIdea updates idea text, timeframe, and notes', () => {
      const q = createQuestion('Root cause');
      const { result } = renderHook(() => useQuestions({ initialQuestions: [q] }));

      let ideaId: string;
      act(() => {
        const idea = result.current.addIdea(q.id, 'Original text');
        ideaId = idea!.id;
      });

      act(() => {
        result.current.updateIdea(q.id, ideaId!, {
          text: 'Updated text',
          timeframe: 'weeks',
          notes: 'Worth trying first',
        });
      });

      const updated = result.current.questions[0].ideas![0];
      expect(updated.text).toBe('Updated text');
      expect(updated.timeframe).toBe('weeks');
      expect(updated.notes).toBe('Worth trying first');
    });

    it('removeIdea removes idea from question', () => {
      const q = createQuestion('Root cause');
      const { result } = renderHook(() => useQuestions({ initialQuestions: [q] }));

      let ideaId: string;
      act(() => {
        const idea = result.current.addIdea(q.id, 'Idea to remove');
        ideaId = idea!.id;
      });

      expect(result.current.questions[0].ideas).toHaveLength(1);

      act(() => {
        result.current.removeIdea(q.id, ideaId!);
      });

      expect(result.current.questions[0].ideas).toHaveLength(0);
    });

    it('setIdeaProjection attaches projection to idea', () => {
      const q = createQuestion('Root cause');
      const { result } = renderHook(() => useQuestions({ initialQuestions: [q] }));

      let ideaId: string;
      act(() => {
        const idea = result.current.addIdea(q.id, 'Reduce variation');
        ideaId = idea!.id;
      });

      const projection = makeProjection();
      act(() => {
        result.current.setIdeaProjection(q.id, ideaId!, projection);
      });

      const idea = result.current.questions[0].ideas![0];
      expect(idea.projection).toBeDefined();
      expect(idea.projection!.baselineMean).toBe(18.3);
      expect(idea.projection!.projectedSigma).toBe(1.7);
      expect(idea.projection!.simulationParams.variationReduction).toBe(60);
    });

    it('selectIdea toggles selected flag', () => {
      const q = createQuestion('Root cause');
      const { result } = renderHook(() => useQuestions({ initialQuestions: [q] }));

      let ideaId: string;
      act(() => {
        const idea = result.current.addIdea(q.id, 'Best idea');
        ideaId = idea!.id;
      });

      act(() => {
        result.current.selectIdea(q.id, ideaId!, true);
      });
      expect(result.current.questions[0].ideas![0].selected).toBe(true);

      act(() => {
        result.current.selectIdea(q.id, ideaId!, false);
      });
      expect(result.current.questions[0].ideas![0].selected).toBe(false);
    });

    it('onQuestionsChange callback fires on idea operations', () => {
      const onChange = vi.fn();
      const q = createQuestion('Root cause');
      const { result } = renderHook(() =>
        useQuestions({ initialQuestions: [q], onQuestionsChange: onChange })
      );

      onChange.mockClear();

      act(() => {
        result.current.addIdea(q.id, 'New idea');
      });
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(expect.any(Array));

      const ideaId = result.current.questions[0].ideas![0].id;
      onChange.mockClear();

      act(() => {
        result.current.updateIdea(q.id, ideaId, { text: 'Changed' });
      });
      expect(onChange).toHaveBeenCalledTimes(1);

      onChange.mockClear();

      act(() => {
        result.current.selectIdea(q.id, ideaId, true);
      });
      expect(onChange).toHaveBeenCalledTimes(1);

      onChange.mockClear();

      act(() => {
        result.current.removeIdea(q.id, ideaId);
      });
      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('question lifecycle', () => {
    const makeGeneratedQuestion = (
      overrides: Partial<GeneratedQuestion> = {}
    ): GeneratedQuestion => ({
      text: 'Does Shift explain variation?',
      factors: ['Shift'],
      rSquaredAdj: 0.25,
      autoAnswered: false,
      source: 'factor-intel',
      type: 'single-factor',
      ...overrides,
    });

    describe('generateInitialQuestions', () => {
      it('creates questions from 3 generated questions with correct fields', () => {
        const generatedQuestions: GeneratedQuestion[] = [
          makeGeneratedQuestion({
            text: 'Does Shift explain variation?',
            factors: ['Shift'],
            rSquaredAdj: 0.25,
          }),
          makeGeneratedQuestion({
            text: 'Does Machine explain variation?',
            factors: ['Machine'],
            rSquaredAdj: 0.15,
          }),
          makeGeneratedQuestion({
            text: 'Does Operator explain variation?',
            factors: ['Operator'],
            rSquaredAdj: 0.08,
          }),
        ];
        const { result } = renderHook(() => useQuestions());

        let created: ReturnType<typeof result.current.generateInitialQuestions> = [];
        act(() => {
          created = result.current.generateInitialQuestions(generatedQuestions);
        });

        expect(created).toHaveLength(3);
        expect(result.current.questions).toHaveLength(3);

        // Check questionSource and evidence on each
        for (let i = 0; i < 3; i++) {
          expect(created[i].questionSource).toBe('factor-intel');
          expect(created[i].evidence).toEqual({ rSquaredAdj: generatedQuestions[i].rSquaredAdj });
        }

        // Check factor mapping for single-factor questions
        expect(created[0].factor).toBe('Shift');
        expect(created[1].factor).toBe('Machine');
        expect(created[2].factor).toBe('Operator');
      });

      it('sets status to ruled-out for auto-ruled-out questions', () => {
        const generatedQuestions: GeneratedQuestion[] = [
          makeGeneratedQuestion({ rSquaredAdj: 0.03, autoAnswered: true, autoStatus: 'ruled-out' }),
        ];
        const { result } = renderHook(() => useQuestions());

        let created: ReturnType<typeof result.current.generateInitialQuestions> = [];
        act(() => {
          created = result.current.generateInitialQuestions(generatedQuestions);
        });

        expect(created[0].status).toBe('ruled-out');
        expect(result.current.questions[0].status).toBe('ruled-out');
      });

      it('sets status to open for non-auto questions', () => {
        const generatedQuestions: GeneratedQuestion[] = [
          makeGeneratedQuestion({ rSquaredAdj: 0.2, autoAnswered: false }),
        ];
        const { result } = renderHook(() => useQuestions());

        let created: ReturnType<typeof result.current.generateInitialQuestions> = [];
        act(() => {
          created = result.current.generateInitialQuestions(generatedQuestions);
        });

        expect(created[0].status).toBe('open');
        expect(result.current.questions[0].status).toBe('open');
      });

      it('leaves factor undefined for multi-factor combination questions', () => {
        const generatedQuestions: GeneratedQuestion[] = [
          makeGeneratedQuestion({
            text: 'Does Shift + Machine combination explain variation?',
            factors: ['Shift', 'Machine'],
            rSquaredAdj: 0.35,
            type: 'combination',
          }),
        ];
        const { result } = renderHook(() => useQuestions());

        let created: ReturnType<typeof result.current.generateInitialQuestions> = [];
        act(() => {
          created = result.current.generateInitialQuestions(generatedQuestions);
        });

        expect(created[0].factor).toBeUndefined();
      });

      it('returns empty array and does not update state for empty input', () => {
        const onChange = vi.fn();
        const { result } = renderHook(() => useQuestions({ onQuestionsChange: onChange }));

        let created: ReturnType<typeof result.current.generateInitialQuestions> = [];
        act(() => {
          created = result.current.generateInitialQuestions([]);
        });

        expect(created).toHaveLength(0);
        expect(result.current.questions).toHaveLength(0);
        expect(onChange).not.toHaveBeenCalled();
      });
    });

    describe('answerQuestion', () => {
      it('transitions status and links finding', () => {
        const { result } = renderHook(() => useQuestions());

        let questionId: string;
        act(() => {
          const created = result.current.generateInitialQuestions([makeGeneratedQuestion()]);
          questionId = created[0].id;
        });

        act(() => {
          result.current.answerQuestion(questionId!, 'finding-1', 'answered');
        });

        const answered = result.current.questions[0];
        expect(answered.status).toBe('answered');
        expect(answered.linkedFindingIds).toContain('finding-1');
      });

      it('does not duplicate finding in linkedFindingIds', () => {
        const { result } = renderHook(() => useQuestions());

        let questionId: string;
        act(() => {
          const created = result.current.generateInitialQuestions([makeGeneratedQuestion()]);
          questionId = created[0].id;
        });

        act(() => {
          result.current.answerQuestion(questionId!, 'finding-1', 'answered');
        });
        act(() => {
          result.current.answerQuestion(questionId!, 'finding-1', 'investigating');
        });

        const answered = result.current.questions[0];
        expect(answered.status).toBe('investigating');
        expect(answered.linkedFindingIds).toEqual(['finding-1']);
      });

      it('does nothing for non-existent question ID (no crash)', () => {
        const { result } = renderHook(() => useQuestions());

        // Should not throw
        act(() => {
          result.current.answerQuestion('nonexistent-id', 'finding-1', 'ruled-out');
        });

        expect(result.current.questions).toHaveLength(0);
      });
    });

    describe('focusedQuestionId', () => {
      it('starts as null', () => {
        const { result } = renderHook(() => useQuestions());
        expect(result.current.focusedQuestionId).toBeNull();
      });

      it('can be set to a question ID', () => {
        const { result } = renderHook(() => useQuestions());

        let questionId: string;
        act(() => {
          const created = result.current.generateInitialQuestions([makeGeneratedQuestion()]);
          questionId = created[0].id;
        });

        act(() => {
          result.current.setFocusedQuestion(questionId!);
        });

        expect(result.current.focusedQuestionId).toBe(questionId!);
      });

      it('can be cleared by setting to null', () => {
        const { result } = renderHook(() => useQuestions());

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
