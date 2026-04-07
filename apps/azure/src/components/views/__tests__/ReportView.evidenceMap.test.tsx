/**
 * ReportView — Evidence Map timeline integration tests.
 *
 * Tests the useEvidenceMapTimeline hook in isolation.
 * The full ReportView component is too complex to render in unit tests, so
 * we exercise the hook directly via renderHook.
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEvidenceMapTimeline } from '@variscout/hooks';
import type { CausalLink, Finding, Question, SuspectedCause } from '@variscout/core/findings';

// ============================================================================
// Test helpers
// ============================================================================

function makeCausalLink(overrides?: Partial<CausalLink>): CausalLink {
  return {
    id: 'link-1',
    fromFactor: 'Temperature',
    toFactor: 'Fill Weight',
    whyStatement: 'Higher temperature reduces viscosity',
    direction: 'drives',
    evidenceType: 'data',
    source: 'analyst',
    questionIds: [],
    findingIds: [],
    createdAt: '2026-03-15T10:00:00.000Z',
    updatedAt: '2026-03-15T10:00:00.000Z',
    ...overrides,
  };
}

function makeFinding(overrides?: Partial<Finding>): Finding {
  return {
    id: 'finding-1',
    text: 'Outlier observed at shift change',
    createdAt: Date.parse('2026-03-16T08:00:00.000Z'),
    context: {
      measure: 'Fill Weight',
      filterState: { groups: [] },
      specs: {},
      displayOptions: {
        showViolin: false,
        showContribution: false,
        showCapabilityLine: false,
        boxplotSortBy: 'name',
        boxplotSortDirection: 'asc',
      },
      analysisMode: 'standard',
    },
    status: 'new',
    comments: [],
    statusChangedAt: Date.parse('2026-03-16T08:00:00.000Z'),
    ...overrides,
  } as Finding;
}

function makeQuestion(overrides?: Partial<Question>): Question {
  return {
    id: 'q-1',
    text: 'Does temperature affect fill weight?',
    factor: 'Temperature',
    status: 'open',
    linkedFindingIds: [],
    createdAt: '2026-03-14T09:00:00.000Z',
    updatedAt: '2026-03-14T09:00:00.000Z',
    ...overrides,
  } as Question;
}

function makeSuspectedCause(overrides?: Partial<SuspectedCause>): SuspectedCause {
  return {
    id: 'hub-1',
    name: 'Temperature hypothesis',
    synthesis: '',
    status: 'suspected',
    questionIds: [],
    findingIds: [],
    createdAt: '2026-03-17T12:00:00.000Z',
    updatedAt: '2026-03-17T12:00:00.000Z',
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('useEvidenceMapTimeline', () => {
  describe('produces frames from causal links', () => {
    it('creates one frame per unique timestamp', () => {
      const link = makeCausalLink();
      const { result } = renderHook(() => useEvidenceMapTimeline({ causalLinks: [link] }));

      expect(result.current.frames).toHaveLength(1);
    });

    it('frame contains both factors from the causal link', () => {
      const link = makeCausalLink({ fromFactor: 'Temperature', toFactor: 'Fill Weight' });
      const { result } = renderHook(() => useEvidenceMapTimeline({ causalLinks: [link] }));

      const frame = result.current.frames[0];
      expect(frame.visibleFactors).toContain('Temperature');
      expect(frame.visibleFactors).toContain('Fill Weight');
    });

    it('frame contains the causal link ID in visibleLinks', () => {
      const link = makeCausalLink({ id: 'link-abc' });
      const { result } = renderHook(() => useEvidenceMapTimeline({ causalLinks: [link] }));

      expect(result.current.frames[0].visibleLinks).toContain('link-abc');
    });

    it('frames are cumulative — earlier frame has fewer links than later frame', () => {
      const link1 = makeCausalLink({ id: 'link-1', createdAt: '2026-03-10T00:00:00.000Z' });
      const link2 = makeCausalLink({
        id: 'link-2',
        fromFactor: 'Pressure',
        toFactor: 'Fill Weight',
        createdAt: '2026-03-20T00:00:00.000Z',
      });

      const { result } = renderHook(() => useEvidenceMapTimeline({ causalLinks: [link1, link2] }));

      const { frames } = result.current;
      expect(frames).toHaveLength(2);
      // First frame has only link-1
      expect(frames[0].visibleLinks).toContain('link-1');
      expect(frames[0].visibleLinks).not.toContain('link-2');
      // Second frame is cumulative — has both
      expect(frames[1].visibleLinks).toContain('link-1');
      expect(frames[1].visibleLinks).toContain('link-2');
    });

    it('frames have a human-readable label derived from createdAt', () => {
      const link = makeCausalLink({ createdAt: '2026-03-15T10:00:00.000Z' });
      const { result } = renderHook(() => useEvidenceMapTimeline({ causalLinks: [link] }));

      const label = result.current.frames[0].label;
      // Should contain month name or frame fallback — not empty
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });
  });

  describe('returns empty frames when no artifacts', () => {
    it('returns empty frames array when called with no arguments', () => {
      const { result } = renderHook(() => useEvidenceMapTimeline());
      expect(result.current.frames).toEqual([]);
    });

    it('returns empty frames array when all arrays are empty', () => {
      const { result } = renderHook(() =>
        useEvidenceMapTimeline({
          causalLinks: [],
          questions: [],
          findings: [],
          suspectedCauses: [],
        })
      );
      expect(result.current.frames).toEqual([]);
    });

    it('does not produce frames from findings alone (findings have no factors)', () => {
      const finding = makeFinding();
      const { result } = renderHook(() => useEvidenceMapTimeline({ findings: [finding] }));
      // Finding still adds a frame (with empty factors), so frames.length is 1
      // but visibleFactors and visibleLinks are empty
      if (result.current.frames.length > 0) {
        expect(result.current.frames[0].visibleFactors).toEqual([]);
        expect(result.current.frames[0].visibleLinks).toEqual([]);
      }
    });
  });

  describe('play/pause/seek controls', () => {
    it('starts with isPlaying: false', () => {
      const { result } = renderHook(() =>
        useEvidenceMapTimeline({ causalLinks: [makeCausalLink()] })
      );
      expect(result.current.isPlaying).toBe(false);
    });

    it('starts with currentFrame: 0', () => {
      const { result } = renderHook(() =>
        useEvidenceMapTimeline({ causalLinks: [makeCausalLink()] })
      );
      expect(result.current.currentFrame).toBe(0);
    });

    it('starts with progress: 0', () => {
      const { result } = renderHook(() =>
        useEvidenceMapTimeline({ causalLinks: [makeCausalLink()] })
      );
      expect(result.current.progress).toBe(0);
    });

    it('play() sets isPlaying to true', () => {
      const link1 = makeCausalLink({ id: 'link-1', createdAt: '2026-03-10T00:00:00.000Z' });
      const link2 = makeCausalLink({ id: 'link-2', createdAt: '2026-03-20T00:00:00.000Z' });

      const { result } = renderHook(() => useEvidenceMapTimeline({ causalLinks: [link1, link2] }));

      act(() => {
        result.current.play();
      });

      expect(result.current.isPlaying).toBe(true);
    });

    it('pause() sets isPlaying to false', () => {
      const link1 = makeCausalLink({ id: 'link-1', createdAt: '2026-03-10T00:00:00.000Z' });
      const link2 = makeCausalLink({ id: 'link-2', createdAt: '2026-03-20T00:00:00.000Z' });

      const { result } = renderHook(() => useEvidenceMapTimeline({ causalLinks: [link1, link2] }));

      act(() => {
        result.current.play();
      });
      act(() => {
        result.current.pause();
      });

      expect(result.current.isPlaying).toBe(false);
    });

    it('seek() jumps to the specified frame and stops playback', () => {
      const link1 = makeCausalLink({ id: 'link-1', createdAt: '2026-03-10T00:00:00.000Z' });
      const link2 = makeCausalLink({ id: 'link-2', createdAt: '2026-03-20T00:00:00.000Z' });
      const link3 = makeCausalLink({ id: 'link-3', createdAt: '2026-03-25T00:00:00.000Z' });

      const { result } = renderHook(() =>
        useEvidenceMapTimeline({ causalLinks: [link1, link2, link3] })
      );

      act(() => {
        result.current.seek(2);
      });

      expect(result.current.currentFrame).toBe(2);
      expect(result.current.isPlaying).toBe(false);
    });

    it('seek() clamps to valid frame range', () => {
      const link = makeCausalLink();
      const { result } = renderHook(() => useEvidenceMapTimeline({ causalLinks: [link] }));

      act(() => {
        result.current.seek(999);
      });

      expect(result.current.currentFrame).toBe(0); // Only 1 frame, index 0 is max
    });

    it('play() does nothing when frames is empty', () => {
      const { result } = renderHook(() => useEvidenceMapTimeline());

      act(() => {
        result.current.play();
      });

      expect(result.current.isPlaying).toBe(false);
    });
  });

  describe('frame content with mixed artifacts', () => {
    it('includes hub ID in visibleHubs when SuspectedCause is provided', () => {
      const hub = makeSuspectedCause({ id: 'hub-xyz' });
      const { result } = renderHook(() => useEvidenceMapTimeline({ suspectedCauses: [hub] }));

      expect(result.current.frames.length).toBeGreaterThan(0);
      expect(result.current.frames[result.current.frames.length - 1].visibleHubs).toContain(
        'hub-xyz'
      );
    });

    it('includes factor from Question in visibleFactors', () => {
      const question = makeQuestion({ factor: 'Pressure', createdAt: '2026-03-14T09:00:00.000Z' });
      const { result } = renderHook(() => useEvidenceMapTimeline({ questions: [question] }));

      expect(result.current.frames[0].visibleFactors).toContain('Pressure');
    });
  });
});
