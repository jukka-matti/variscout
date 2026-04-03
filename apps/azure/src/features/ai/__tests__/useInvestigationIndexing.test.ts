import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock calls must come before importing the module under test
vi.mock('../../../services/investigationSerializer');
vi.mock('../../../services/blobClient');

import { useInvestigationIndexing } from '../useInvestigationIndexing';
import { createInvestigationSerializer } from '../../../services/investigationSerializer';
import type { Finding, Question } from '@variscout/core';

const mockOnFindingsChange = vi.fn();
const mockOnQuestionsChange = vi.fn();
const mockDispose = vi.fn();

const mockOnSuspectedCausesChange = vi.fn();

const mockSerializerInstance = {
  onFindingsChange: mockOnFindingsChange,
  onQuestionsChange: mockOnQuestionsChange,
  onSuspectedCausesChange: mockOnSuspectedCausesChange,
  dispose: mockDispose,
};

const mockCreateInvestigationSerializer = vi.mocked(createInvestigationSerializer);

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateInvestigationSerializer.mockReturnValue(mockSerializerInstance);
});

describe('useInvestigationIndexing', () => {
  describe('serializer lifecycle', () => {
    it('creates serializer when enabled and projectId are present', () => {
      renderHook(() => useInvestigationIndexing({ projectId: 'proj-123', enabled: true }));

      expect(mockCreateInvestigationSerializer).toHaveBeenCalledOnce();
      expect(mockCreateInvestigationSerializer).toHaveBeenCalledWith(
        expect.objectContaining({ projectId: 'proj-123' })
      );
    });

    it('does not create serializer when disabled', () => {
      renderHook(() => useInvestigationIndexing({ projectId: 'proj-123', enabled: false }));

      expect(mockCreateInvestigationSerializer).not.toHaveBeenCalled();
    });

    it('does not create serializer when projectId is undefined', () => {
      renderHook(() => useInvestigationIndexing({ projectId: undefined, enabled: true }));

      expect(mockCreateInvestigationSerializer).not.toHaveBeenCalled();
    });

    it('disposes serializer when enabled changes to false', () => {
      const { rerender } = renderHook(
        ({ enabled }: { enabled: boolean }) =>
          useInvestigationIndexing({ projectId: 'proj-123', enabled }),
        { initialProps: { enabled: true } }
      );

      expect(mockCreateInvestigationSerializer).toHaveBeenCalledOnce();

      rerender({ enabled: false });

      expect(mockDispose).toHaveBeenCalled();
    });

    it('disposes and recreates serializer when projectId changes', () => {
      const { rerender } = renderHook(
        ({ projectId }: { projectId: string }) =>
          useInvestigationIndexing({ projectId, enabled: true }),
        { initialProps: { projectId: 'proj-aaa' } }
      );

      expect(mockCreateInvestigationSerializer).toHaveBeenCalledTimes(1);

      rerender({ projectId: 'proj-bbb' });

      // Previous serializer must be disposed before new one is created
      expect(mockDispose).toHaveBeenCalled();
      expect(mockCreateInvestigationSerializer).toHaveBeenCalledTimes(2);
      expect(mockCreateInvestigationSerializer).toHaveBeenLastCalledWith(
        expect.objectContaining({ projectId: 'proj-bbb' })
      );
    });

    it('disposes serializer on unmount', () => {
      const { unmount } = renderHook(() =>
        useInvestigationIndexing({ projectId: 'proj-123', enabled: true })
      );

      unmount();

      expect(mockDispose).toHaveBeenCalled();
    });
  });

  describe('callback forwarding', () => {
    it('onFindingsChange forwards to the serializer instance', () => {
      const { result } = renderHook(() =>
        useInvestigationIndexing({ projectId: 'proj-123', enabled: true })
      );

      const findings: Finding[] = [];

      act(() => {
        result.current.onFindingsChange(findings);
      });

      expect(mockOnFindingsChange).toHaveBeenCalledOnce();
      expect(mockOnFindingsChange).toHaveBeenCalledWith(findings);
    });

    it('onQuestionsChange forwards to the serializer instance', () => {
      const { result } = renderHook(() =>
        useInvestigationIndexing({ projectId: 'proj-123', enabled: true })
      );

      const questions: Question[] = [];

      act(() => {
        result.current.onQuestionsChange(questions);
      });

      expect(mockOnQuestionsChange).toHaveBeenCalledOnce();
      expect(mockOnQuestionsChange).toHaveBeenCalledWith(questions);
    });

    it('onFindingsChange is a no-op when serializer is not active (disabled)', () => {
      const { result } = renderHook(() =>
        useInvestigationIndexing({ projectId: 'proj-123', enabled: false })
      );

      act(() => {
        result.current.onFindingsChange([]);
      });

      expect(mockOnFindingsChange).not.toHaveBeenCalled();
    });

    it('onQuestionsChange is a no-op when serializer is not active (no projectId)', () => {
      const { result } = renderHook(() =>
        useInvestigationIndexing({ projectId: undefined, enabled: true })
      );

      act(() => {
        result.current.onQuestionsChange([]);
      });

      expect(mockOnQuestionsChange).not.toHaveBeenCalled();
    });
  });
});
