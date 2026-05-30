import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock calls must come before importing the module under test
vi.mock('../../../services/analyzeSerializer');
vi.mock('../../../services/blobClient');

import { useAnalyzeIndexing } from '../useAnalyzeIndexing';
import { createInvestigationSerializer } from '../../../services/analyzeSerializer';
import type { Finding, ProblemStatementScope } from '@variscout/core';

const mockOnFindingsChange = vi.fn();
const mockOnScopesChange = vi.fn();
const mockDispose = vi.fn();

const mockOnHypothesesChange = vi.fn();

const mockSerializerInstance = {
  onFindingsChange: mockOnFindingsChange,
  onScopesChange: mockOnScopesChange,
  onHypothesesChange: mockOnHypothesesChange,
  dispose: mockDispose,
};

const mockCreateInvestigationSerializer = vi.mocked(createInvestigationSerializer);

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateInvestigationSerializer.mockReturnValue(mockSerializerInstance);
});

describe('useAnalyzeIndexing', () => {
  describe('serializer lifecycle', () => {
    it('creates serializer when enabled and projectId are present', () => {
      renderHook(() => useAnalyzeIndexing({ projectId: 'proj-123', enabled: true }));

      expect(mockCreateInvestigationSerializer).toHaveBeenCalledOnce();
      expect(mockCreateInvestigationSerializer).toHaveBeenCalledWith(
        expect.objectContaining({ projectId: 'proj-123' })
      );
    });

    it('does not create serializer when disabled', () => {
      renderHook(() => useAnalyzeIndexing({ projectId: 'proj-123', enabled: false }));

      expect(mockCreateInvestigationSerializer).not.toHaveBeenCalled();
    });

    it('does not create serializer when projectId is undefined', () => {
      renderHook(() => useAnalyzeIndexing({ projectId: undefined, enabled: true }));

      expect(mockCreateInvestigationSerializer).not.toHaveBeenCalled();
    });

    it('disposes serializer when enabled changes to false', () => {
      const { rerender } = renderHook(
        ({ enabled }: { enabled: boolean }) =>
          useAnalyzeIndexing({ projectId: 'proj-123', enabled }),
        { initialProps: { enabled: true } }
      );

      expect(mockCreateInvestigationSerializer).toHaveBeenCalledOnce();

      rerender({ enabled: false });

      expect(mockDispose).toHaveBeenCalled();
    });

    it('disposes and recreates serializer when projectId changes', () => {
      const { rerender } = renderHook(
        ({ projectId }: { projectId: string }) => useAnalyzeIndexing({ projectId, enabled: true }),
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
        useAnalyzeIndexing({ projectId: 'proj-123', enabled: true })
      );

      unmount();

      expect(mockDispose).toHaveBeenCalled();
    });
  });

  describe('callback forwarding', () => {
    it('onFindingsChange forwards to the serializer instance', () => {
      const { result } = renderHook(() =>
        useAnalyzeIndexing({ projectId: 'proj-123', enabled: true })
      );

      const findings: Finding[] = [];

      act(() => {
        result.current.onFindingsChange(findings);
      });

      expect(mockOnFindingsChange).toHaveBeenCalledOnce();
      expect(mockOnFindingsChange).toHaveBeenCalledWith(findings);
    });

    it('onScopesChange forwards to the serializer instance', () => {
      const { result } = renderHook(() =>
        useAnalyzeIndexing({ projectId: 'proj-123', enabled: true })
      );

      const scopes: ProblemStatementScope[] = [];

      act(() => {
        result.current.onScopesChange(scopes);
      });

      expect(mockOnScopesChange).toHaveBeenCalledOnce();
      expect(mockOnScopesChange).toHaveBeenCalledWith(scopes);
    });

    it('onFindingsChange is a no-op when serializer is not active (disabled)', () => {
      const { result } = renderHook(() =>
        useAnalyzeIndexing({ projectId: 'proj-123', enabled: false })
      );

      act(() => {
        result.current.onFindingsChange([]);
      });

      expect(mockOnFindingsChange).not.toHaveBeenCalled();
    });

    it('onScopesChange is a no-op when serializer is not active (no projectId)', () => {
      const { result } = renderHook(() =>
        useAnalyzeIndexing({ projectId: undefined, enabled: true })
      );

      act(() => {
        result.current.onScopesChange([]);
      });

      expect(mockOnScopesChange).not.toHaveBeenCalled();
    });
  });
});
