/**
 * Tests for useFindings hook
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFindings } from '../useFindings';
import type {
  Finding,
  FindingContext,
  FindingSource,
  FindingStatus,
  FindingOutcome,
} from '@variscout/core';
import { DEFAULT_TIME_LENS } from '@variscout/core';

const makeContext = (overrides?: Partial<FindingContext>): FindingContext => ({
  activeFilters: { Machine: ['A'] },
  cumulativeScope: 45,
  stats: { mean: 10.5, samples: 100 },
  ...overrides,
});

/** Create a full Finding with required fields */
const makeFinding = (
  overrides: Partial<Finding> & { id: string; text: string; context: FindingContext }
): Finding => ({
  createdAt: 1000,
  deletedAt: null,
  investigationId: 'inv-test-001',
  status: 'observed',
  comments: [],
  statusChangedAt: 1000,
  ...overrides,
});

describe('useFindings', () => {
  it('starts with empty findings by default', () => {
    const { result } = renderHook(() => useFindings());
    expect(result.current.findings).toEqual([]);
  });

  it('starts with initialFindings when provided', () => {
    const initial = [
      makeFinding({ id: 'f-1', text: 'Note 1', context: makeContext() }),
      makeFinding({ id: 'f-2', text: 'Note 2', createdAt: 2000, context: makeContext() }),
    ];
    const { result } = renderHook(() => useFindings({ initialFindings: initial }));
    expect(result.current.findings).toHaveLength(2);
    expect(result.current.findings[0].text).toBe('Note 1');
  });

  it('addFinding creates a finding with correct text and context', () => {
    const { result } = renderHook(() => useFindings());
    const ctx = makeContext({ cumulativeScope: 72 });

    let finding: ReturnType<typeof result.current.addFinding>;
    act(() => {
      finding = result.current.addFinding('Shift B is off-center', ctx);
    });

    expect(result.current.findings).toHaveLength(1);
    expect(result.current.findings[0].text).toBe('Shift B is off-center');
    expect(result.current.findings[0].context.cumulativeScope).toBe(72);
    expect(result.current.findings[0].id).toBeTruthy();
    expect(finding!.id).toBe(result.current.findings[0].id);
  });

  it('addFinding prepends (newest first)', () => {
    const { result } = renderHook(() => useFindings());
    const ctx = makeContext();

    act(() => {
      result.current.addFinding('First', ctx);
    });
    act(() => {
      result.current.addFinding('Second', ctx);
    });

    expect(result.current.findings[0].text).toBe('Second');
    expect(result.current.findings[1].text).toBe('First');
  });

  it('editFinding updates text and preserves context', () => {
    const ctx = makeContext({ activeFilters: { Shift: ['Night'] } });
    const initial = [makeFinding({ id: 'f-1', text: 'Original', context: ctx })];
    const { result } = renderHook(() => useFindings({ initialFindings: initial }));

    act(() => {
      result.current.editFinding('f-1', 'Updated note');
    });

    expect(result.current.findings[0].text).toBe('Updated note');
    expect(result.current.findings[0].context.activeFilters).toEqual({ Shift: ['Night'] });
    expect(result.current.findings[0].id).toBe('f-1');
  });

  it('deleteFinding removes by id', () => {
    const initial = [
      makeFinding({ id: 'f-1', text: 'Keep', context: makeContext() }),
      makeFinding({ id: 'f-2', text: 'Delete', createdAt: 2000, context: makeContext() }),
    ];
    const { result } = renderHook(() => useFindings({ initialFindings: initial }));

    act(() => {
      result.current.deleteFinding('f-2');
    });

    expect(result.current.findings).toHaveLength(1);
    expect(result.current.findings[0].id).toBe('f-1');
  });

  it('getFindingContext returns context for existing finding', () => {
    const ctx = makeContext({ cumulativeScope: 55 });
    const initial = [makeFinding({ id: 'f-1', text: 'Test', context: ctx })];
    const { result } = renderHook(() => useFindings({ initialFindings: initial }));

    const found = result.current.getFindingContext('f-1');
    expect(found).toEqual(ctx);
  });

  it('getFindingContext returns undefined for missing finding', () => {
    const { result } = renderHook(() => useFindings());

    const found = result.current.getFindingContext('nonexistent');
    expect(found).toBeUndefined();
  });

  it('onFindingsChange callback fires on add', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useFindings({ onFindingsChange: onChange }));

    act(() => {
      result.current.addFinding('New note', makeContext());
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ text: 'New note' })])
    );
  });

  it('onFindingsChange callback fires on edit', () => {
    const onChange = vi.fn();
    const initial = [makeFinding({ id: 'f-1', text: 'Old', context: makeContext() })];
    const { result } = renderHook(() =>
      useFindings({ initialFindings: initial, onFindingsChange: onChange })
    );

    act(() => {
      result.current.editFinding('f-1', 'New text');
    });

    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 'f-1', text: 'New text' })])
    );
  });

  it('findDuplicate returns finding when filters match', () => {
    const ctx1 = makeContext({ activeFilters: { Machine: ['A'] } });
    const ctx2 = makeContext({ activeFilters: { Machine: ['B'], Shift: ['Night'] } });
    const initial = [
      makeFinding({ id: 'f-1', text: 'First', context: ctx1 }),
      makeFinding({ id: 'f-2', text: 'Second', createdAt: 2000, context: ctx2 }),
    ];
    const { result } = renderHook(() => useFindings({ initialFindings: initial }));

    const dup = result.current.findDuplicate({ Shift: ['Night'], Machine: ['B'] });
    expect(dup).toBeDefined();
    expect(dup!.id).toBe('f-2');
  });

  it('findDuplicate returns undefined when no match', () => {
    const ctx = makeContext({ activeFilters: { Machine: ['A'] } });
    const initial = [makeFinding({ id: 'f-1', text: 'Only', context: ctx })];
    const { result } = renderHook(() => useFindings({ initialFindings: initial }));

    const dup = result.current.findDuplicate({ Machine: ['Z'] });
    expect(dup).toBeUndefined();
  });

  it('onFindingsChange callback fires on delete', () => {
    const onChange = vi.fn();
    const initial = [
      makeFinding({ id: 'f-1', text: 'Stay', context: makeContext() }),
      makeFinding({ id: 'f-2', text: 'Go', createdAt: 2000, context: makeContext() }),
    ];
    const { result } = renderHook(() =>
      useFindings({ initialFindings: initial, onFindingsChange: onChange })
    );

    act(() => {
      result.current.deleteFinding('f-2');
    });

    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ id: 'f-1' })]);
  });

  // --- Investigation status & comments ---

  it('setFindingStatus changes status and updates statusChangedAt', () => {
    const initial = [makeFinding({ id: 'f-1', text: 'Test', context: makeContext() })];
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useFindings({ initialFindings: initial, onFindingsChange: onChange })
    );

    act(() => {
      result.current.setFindingStatus('f-1', 'investigating');
    });

    expect(result.current.findings[0].status).toBe('investigating');
    expect(result.current.findings[0].statusChangedAt).toBeGreaterThan(0);
    expect(onChange).toHaveBeenCalled();
  });

  it('addFindingComment appends a comment with id and timestamp', () => {
    const initial = [makeFinding({ id: 'f-1', text: 'Test', context: makeContext() })];
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useFindings({ initialFindings: initial, onFindingsChange: onChange })
    );

    act(() => {
      result.current.addFindingComment('f-1', 'Checked operator logs');
    });

    const comments = result.current.findings[0].comments;
    expect(comments).toHaveLength(1);
    expect(comments[0].text).toBe('Checked operator logs');
    expect(comments[0].id).toBeTruthy();
    expect(comments[0].createdAt).toBeGreaterThan(0);
    expect(onChange).toHaveBeenCalled();
  });

  it('editFindingComment updates comment text', () => {
    const initial = [
      makeFinding({
        id: 'f-1',
        text: 'Test',
        context: makeContext(),
        comments: [
          {
            id: 'c-1',
            text: 'Original',
            createdAt: 500,
            deletedAt: null,
            parentId: 'f-1',
            parentKind: 'finding' as const,
          },
        ],
      }),
    ];
    const { result } = renderHook(() => useFindings({ initialFindings: initial }));

    act(() => {
      result.current.editFindingComment('f-1', 'c-1', 'Updated comment');
    });

    expect(result.current.findings[0].comments[0].text).toBe('Updated comment');
    expect(result.current.findings[0].comments[0].id).toBe('c-1');
  });

  it('deleteFindingComment removes by id', () => {
    const initial = [
      makeFinding({
        id: 'f-1',
        text: 'Test',
        context: makeContext(),
        comments: [
          {
            id: 'c-1',
            text: 'Keep',
            createdAt: 500,
            deletedAt: null,
            parentId: 'f-1',
            parentKind: 'finding' as const,
          },
          {
            id: 'c-2',
            text: 'Remove',
            createdAt: 600,
            deletedAt: null,
            parentId: 'f-1',
            parentKind: 'finding' as const,
          },
        ],
      }),
    ];
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useFindings({ initialFindings: initial, onFindingsChange: onChange })
    );

    act(() => {
      result.current.deleteFindingComment('f-1', 'c-2');
    });

    expect(result.current.findings[0].comments).toHaveLength(1);
    expect(result.current.findings[0].comments[0].id).toBe('c-1');
    expect(onChange).toHaveBeenCalled();
  });

  // --- Tags ---

  it('setFindingTag sets a tag on a finding', () => {
    const initial = [
      makeFinding({ id: 'f-1', text: 'Test', status: 'analyzed', context: makeContext() }),
    ];
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useFindings({ initialFindings: initial, onFindingsChange: onChange })
    );

    act(() => {
      result.current.setFindingTag('f-1', 'key-driver');
    });

    expect(result.current.findings[0].tag).toBe('key-driver');
    expect(onChange).toHaveBeenCalled();
  });

  it('setFindingTag clears a tag when null', () => {
    const initial = [
      makeFinding({
        id: 'f-1',
        text: 'Test',
        status: 'analyzed',
        tag: 'key-driver',
        context: makeContext(),
      }),
    ];
    const { result } = renderHook(() => useFindings({ initialFindings: initial }));

    act(() => {
      result.current.setFindingTag('f-1', null);
    });

    expect(result.current.findings[0].tag).toBeUndefined();
  });

  // --- Author on comments ---

  it('addFindingComment with author sets author field', () => {
    const initial = [makeFinding({ id: 'f-1', text: 'Test', context: makeContext() })];
    const { result } = renderHook(() => useFindings({ initialFindings: initial }));

    act(() => {
      result.current.addFindingComment('f-1', 'Checked by me', 'Jane Doe');
    });

    const comments = result.current.findings[0].comments;
    expect(comments).toHaveLength(1);
    expect(comments[0].text).toBe('Checked by me');
    expect(comments[0].author).toBe('Jane Doe');
  });

  it('addFindingComment without author leaves author undefined', () => {
    const initial = [makeFinding({ id: 'f-1', text: 'Test', context: makeContext() })];
    const { result } = renderHook(() => useFindings({ initialFindings: initial }));

    act(() => {
      result.current.addFindingComment('f-1', 'No author');
    });

    expect(result.current.findings[0].comments[0].author).toBeUndefined();
  });

  // --- Photo operations ---

  it('addPhotoToComment appends a photo to a comment', () => {
    const initial = [
      makeFinding({
        id: 'f-1',
        text: 'Test',
        context: makeContext(),
        comments: [
          {
            id: 'c-1',
            text: 'Look at this',
            createdAt: 500,
            deletedAt: null,
            parentId: 'f-1',
            parentKind: 'finding' as const,
          },
        ],
      }),
    ];
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useFindings({ initialFindings: initial, onFindingsChange: onChange })
    );

    act(() => {
      result.current.addPhotoToComment('f-1', 'c-1', {
        id: 'p-1',
        filename: 'photo.jpg',
        uploadStatus: 'pending',
        capturedAt: 1000,
        createdAt: 1000,
        deletedAt: null,
      });
    });

    const photos = result.current.findings[0].comments[0].photos;
    expect(photos).toHaveLength(1);
    expect(photos![0].id).toBe('p-1');
    expect(photos![0].uploadStatus).toBe('pending');
    expect(onChange).toHaveBeenCalled();
  });

  it('addPhotoToComment creates photos array if undefined', () => {
    const initial = [
      makeFinding({
        id: 'f-1',
        text: 'Test',
        context: makeContext(),
        comments: [
          {
            id: 'c-1',
            text: 'No photos yet',
            createdAt: 500,
            deletedAt: null,
            parentId: 'f-1',
            parentKind: 'finding' as const,
          },
        ],
      }),
    ];
    const { result } = renderHook(() => useFindings({ initialFindings: initial }));

    act(() => {
      result.current.addPhotoToComment('f-1', 'c-1', {
        id: 'p-1',
        filename: 'test.jpg',
        uploadStatus: 'pending',
        capturedAt: 1000,
        createdAt: 1000,
        deletedAt: null,
      });
    });

    expect(result.current.findings[0].comments[0].photos).toHaveLength(1);
  });

  it('updatePhotoStatus changes status from pending to uploaded', () => {
    const initial = [
      makeFinding({
        id: 'f-1',
        text: 'Test',
        context: makeContext(),
        comments: [
          {
            id: 'c-1',
            text: 'Photo here',
            createdAt: 500,
            deletedAt: null,
            parentId: 'f-1',
            parentKind: 'finding' as const,
            photos: [
              {
                id: 'p-1',
                filename: 'test.jpg',
                uploadStatus: 'pending' as const,
                capturedAt: 1000,
                createdAt: 1000,
                deletedAt: null,
              },
            ],
          },
        ],
      }),
    ];
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useFindings({ initialFindings: initial, onFindingsChange: onChange })
    );

    act(() => {
      result.current.updatePhotoStatus('f-1', 'c-1', 'p-1', 'uploaded', 'drive-123');
    });

    const photo = result.current.findings[0].comments[0].photos![0];
    expect(photo.uploadStatus).toBe('uploaded');
    expect(photo.driveItemId).toBe('drive-123');
    expect(onChange).toHaveBeenCalled();
  });

  it('updatePhotoStatus sets failed status without driveItemId', () => {
    const initial = [
      makeFinding({
        id: 'f-1',
        text: 'Test',
        context: makeContext(),
        comments: [
          {
            id: 'c-1',
            text: 'Photo here',
            createdAt: 500,
            deletedAt: null,
            parentId: 'f-1',
            parentKind: 'finding' as const,
            photos: [
              {
                id: 'p-1',
                filename: 'test.jpg',
                uploadStatus: 'pending' as const,
                capturedAt: 1000,
                createdAt: 1000,
                deletedAt: null,
              },
            ],
          },
        ],
      }),
    ];
    const { result } = renderHook(() => useFindings({ initialFindings: initial }));

    act(() => {
      result.current.updatePhotoStatus('f-1', 'c-1', 'p-1', 'failed');
    });

    const photo = result.current.findings[0].comments[0].photos![0];
    expect(photo.uploadStatus).toBe('failed');
    expect(photo.driveItemId).toBeUndefined();
  });

  // --- Migration ---

  it('auto-migrates old confirmed/dismissed statuses on initialization', () => {
    const initial = [
      makeFinding({
        id: 'f-1',
        text: 'A',
        status: 'confirmed' as FindingStatus,
        context: makeContext(),
      }),
      makeFinding({
        id: 'f-2',
        text: 'B',
        status: 'dismissed' as FindingStatus,
        context: makeContext(),
      }),
      makeFinding({ id: 'f-3', text: 'C', status: 'observed', context: makeContext() }),
    ];
    const { result } = renderHook(() => useFindings({ initialFindings: initial }));

    expect(result.current.findings[0].status).toBe('analyzed');
    expect(result.current.findings[0].tag).toBe('key-driver');
    expect(result.current.findings[1].status).toBe('analyzed');
    expect(result.current.findings[1].tag).toBe('low-impact');
    expect(result.current.findings[2].status).toBe('observed');
  });

  // --- FindingSource features ---

  describe('FindingSource', () => {
    it('addFinding with source creates a finding with source metadata', () => {
      const { result } = renderHook(() => useFindings());
      const ctx = makeContext();
      const source: FindingSource = {
        chart: 'boxplot',
        category: 'Machine A',
        timeLens: DEFAULT_TIME_LENS,
      };

      let finding: Finding;
      act(() => {
        finding = result.current.addFinding('Box spread too wide', ctx, source);
      });

      expect(result.current.findings).toHaveLength(1);
      expect(result.current.findings[0].source).toEqual(source);
      expect(result.current.findings[0].source!.chart).toBe('boxplot');
      expect(
        (result.current.findings[0].source as { chart: 'boxplot'; category: string }).category
      ).toBe('Machine A');
      expect(finding!.source).toEqual(source);
    });

    it('findDuplicateSource returns the existing finding when source matches', () => {
      const source: FindingSource = {
        chart: 'pareto',
        category: 'Nozzle 3',
        timeLens: DEFAULT_TIME_LENS,
      };
      const initial = [
        makeFinding({
          id: 'f-1',
          text: 'Top contributor',
          context: makeContext(),
          source,
        }),
        makeFinding({
          id: 'f-2',
          text: 'No source',
          createdAt: 2000,
          context: makeContext(),
        }),
      ];
      const { result } = renderHook(() => useFindings({ initialFindings: initial }));

      const dup = result.current.findDuplicateSource({
        chart: 'pareto',
        category: 'Nozzle 3',
        timeLens: DEFAULT_TIME_LENS,
      });
      expect(dup).toBeDefined();
      expect(dup!.id).toBe('f-1');
    });

    it('findDuplicateSource returns undefined when no match', () => {
      const initial = [
        makeFinding({
          id: 'f-1',
          text: 'Boxplot note',
          context: makeContext(),
          source: { chart: 'boxplot', category: 'Shift A', timeLens: DEFAULT_TIME_LENS },
        }),
      ];
      const { result } = renderHook(() => useFindings({ initialFindings: initial }));

      const dup = result.current.findDuplicateSource({
        chart: 'pareto',
        category: 'Shift A',
        timeLens: DEFAULT_TIME_LENS,
      });
      expect(dup).toBeUndefined();
    });

    it('getChartFindings("boxplot") returns only boxplot-sourced findings', () => {
      const initial = [
        makeFinding({
          id: 'f-1',
          text: 'Boxplot observation',
          context: makeContext(),
          source: { chart: 'boxplot', category: 'Line 1', timeLens: DEFAULT_TIME_LENS },
        }),
        makeFinding({
          id: 'f-2',
          text: 'Pareto observation',
          createdAt: 2000,
          context: makeContext(),
          source: { chart: 'pareto', category: 'Line 2', timeLens: DEFAULT_TIME_LENS },
        }),
        makeFinding({
          id: 'f-3',
          text: 'No source finding',
          createdAt: 3000,
          context: makeContext(),
        }),
      ];
      const { result } = renderHook(() => useFindings({ initialFindings: initial }));

      const boxplotFindings = result.current.getChartFindings('boxplot');
      expect(boxplotFindings).toHaveLength(1);
      expect(boxplotFindings[0].id).toBe('f-1');
      expect(boxplotFindings[0].source!.chart).toBe('boxplot');
    });

    it('getChartFindings("ichart") returns only ichart-sourced findings', () => {
      const initial = [
        makeFinding({
          id: 'f-1',
          text: 'I-Chart note',
          context: makeContext(),
          source: { chart: 'ichart', anchorX: 0.5, anchorY: 0.3, timeLens: DEFAULT_TIME_LENS },
        }),
        makeFinding({
          id: 'f-2',
          text: 'Boxplot note',
          createdAt: 2000,
          context: makeContext(),
          source: { chart: 'boxplot', category: 'Head 1', timeLens: DEFAULT_TIME_LENS },
        }),
        makeFinding({
          id: 'f-3',
          text: 'Another I-Chart note',
          createdAt: 3000,
          context: makeContext(),
          source: { chart: 'ichart', anchorX: 0.8, anchorY: 0.6, timeLens: DEFAULT_TIME_LENS },
        }),
      ];
      const { result } = renderHook(() => useFindings({ initialFindings: initial }));

      const ichartFindings = result.current.getChartFindings('ichart');
      expect(ichartFindings).toHaveLength(2);
      expect(ichartFindings[0].id).toBe('f-1');
      expect(ichartFindings[1].id).toBe('f-3');
    });

    it('getChartFindings returns empty array when no findings for that chart type', () => {
      const initial = [
        makeFinding({
          id: 'f-1',
          text: 'Boxplot note',
          context: makeContext(),
          source: { chart: 'boxplot', category: 'Zone A', timeLens: DEFAULT_TIME_LENS },
        }),
        makeFinding({
          id: 'f-2',
          text: 'No source',
          createdAt: 2000,
          context: makeContext(),
        }),
      ];
      const { result } = renderHook(() => useFindings({ initialFindings: initial }));

      const paretoFindings = result.current.getChartFindings('pareto');
      expect(paretoFindings).toEqual([]);
    });
  });

  // --- Assignee ---

  describe('setFindingAssignee', () => {
    it('sets an assignee on a finding', () => {
      const initial = [makeFinding({ id: 'f-1', text: 'Test', context: makeContext() })];
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useFindings({ initialFindings: initial, onFindingsChange: onChange })
      );

      act(() => {
        result.current.setFindingAssignee('f-1', {
          upn: 'jane@contoso.com',
          displayName: 'Jane Smith',
          userId: 'user-123',
        });
      });

      expect(result.current.findings[0].assignee).toEqual({
        upn: 'jane@contoso.com',
        displayName: 'Jane Smith',
        userId: 'user-123',
      });
      expect(onChange).toHaveBeenCalled();
    });

    it('clears assignee when null is passed', () => {
      const initial = [
        makeFinding({
          id: 'f-1',
          text: 'Test',
          context: makeContext(),
          assignee: { upn: 'jane@contoso.com', displayName: 'Jane Smith' },
        }),
      ];
      const { result } = renderHook(() => useFindings({ initialFindings: initial }));

      act(() => {
        result.current.setFindingAssignee('f-1', null);
      });

      expect(result.current.findings[0].assignee).toBeUndefined();
    });
  });

  // --- Question linking ---

  describe('linkQuestion', () => {
    it('sets questionId on a finding', () => {
      const initial = [makeFinding({ id: 'f-1', text: 'Test', context: makeContext() })];
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useFindings({ initialFindings: initial, onFindingsChange: onChange })
      );

      act(() => {
        result.current.linkQuestion('f-1', 'hyp-42');
      });

      expect(result.current.findings[0].questionId).toBe('hyp-42');
      expect(onChange).toHaveBeenCalled();
    });

    it('sets questionId and validationStatus together', () => {
      const initial = [makeFinding({ id: 'f-1', text: 'Test', context: makeContext() })];
      const { result } = renderHook(() => useFindings({ initialFindings: initial }));

      act(() => {
        result.current.linkQuestion('f-1', 'hyp-99', 'supports');
      });

      expect(result.current.findings[0].questionId).toBe('hyp-99');
      expect(result.current.findings[0].validationStatus).toBe('supports');
    });

    it('accepts all valid validationStatus values', () => {
      const initial = [
        makeFinding({ id: 'f-1', text: 'Test', context: makeContext() }),
        makeFinding({ id: 'f-2', text: 'Test 2', createdAt: 2000, context: makeContext() }),
        makeFinding({ id: 'f-3', text: 'Test 3', createdAt: 3000, context: makeContext() }),
      ];
      const { result } = renderHook(() => useFindings({ initialFindings: initial }));

      act(() => {
        result.current.linkQuestion('f-1', 'h-1', 'supports');
      });
      act(() => {
        result.current.linkQuestion('f-2', 'h-1', 'contradicts');
      });
      act(() => {
        result.current.linkQuestion('f-3', 'h-1', 'inconclusive');
      });

      expect(result.current.findings[0].validationStatus).toBe('supports');
      expect(result.current.findings[1].validationStatus).toBe('contradicts');
      expect(result.current.findings[2].validationStatus).toBe('inconclusive');
    });
  });

  describe('unlinkQuestion', () => {
    it('clears questionId and validationStatus from a finding', () => {
      const initial = [
        makeFinding({
          id: 'f-1',
          text: 'Test',
          context: makeContext(),
          questionId: 'hyp-10',
          validationStatus: 'supports',
        } as Finding & { questionId: string; validationStatus: 'supports' }),
      ];
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useFindings({ initialFindings: initial, onFindingsChange: onChange })
      );

      act(() => {
        result.current.unlinkQuestion('f-1');
      });

      expect(result.current.findings[0].questionId).toBeUndefined();
      expect(result.current.findings[0].validationStatus).toBeUndefined();
      expect(onChange).toHaveBeenCalled();
    });

    it('is a no-op for finding without a question link', () => {
      const initial = [makeFinding({ id: 'f-1', text: 'No link', context: makeContext() })];
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useFindings({ initialFindings: initial, onFindingsChange: onChange })
      );

      act(() => {
        result.current.unlinkQuestion('f-1');
      });

      expect(result.current.findings[0].questionId).toBeUndefined();
      expect(onChange).toHaveBeenCalled();
    });
  });

  // --- Projection ---

  describe('setProjection', () => {
    it('attaches a projection to a finding', () => {
      const initial = [makeFinding({ id: 'f-1', text: 'Test', context: makeContext() })];
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useFindings({ initialFindings: initial, onFindingsChange: onChange })
      );

      const projection = {
        baselineMean: 10.0,
        baselineSigma: 0.5,
        projectedMean: 10.2,
        projectedSigma: 0.3,
        meanDelta: 0.2,
        sigmaDelta: -0.2,
        simulationParams: { meanAdjustment: 0.2, variationReduction: 40 },
        createdAt: new Date().toISOString(),
      };

      act(() => {
        result.current.setProjection('f-1', projection);
      });

      expect(result.current.findings[0].projection).toEqual(projection);
      expect(onChange).toHaveBeenCalled();
    });

    it('overwrites an existing projection', () => {
      const existingProjection = {
        baselineMean: 5.0,
        baselineSigma: 0.2,
        projectedMean: 5.5,
        projectedSigma: 0.2,
        meanDelta: 0.5,
        sigmaDelta: 0,
        simulationParams: { meanAdjustment: 0.5, variationReduction: 0 },
        createdAt: '2026-01-01T00:00:00.000Z',
      };
      const initial = [
        makeFinding({
          id: 'f-1',
          text: 'Test',
          context: makeContext(),
          projection: existingProjection,
        } as Finding & { projection: typeof existingProjection }),
      ];
      const { result } = renderHook(() => useFindings({ initialFindings: initial }));

      const newProjection = {
        ...existingProjection,
        projectedMean: 6.0,
        meanDelta: 1.0,
        simulationParams: { meanAdjustment: 1.0, variationReduction: 0 },
        createdAt: new Date().toISOString(),
      };

      act(() => {
        result.current.setProjection('f-1', newProjection);
      });

      expect(result.current.findings[0].projection!.projectedMean).toBe(6.0);
      expect(result.current.findings[0].projection!.meanDelta).toBe(1.0);
    });
  });

  describe('clearProjection', () => {
    it('removes projection from a finding', () => {
      const projection = {
        baselineMean: 10.0,
        baselineSigma: 0.5,
        projectedMean: 10.2,
        projectedSigma: 0.3,
        meanDelta: 0.2,
        sigmaDelta: -0.2,
        simulationParams: { meanAdjustment: 0.2, variationReduction: 40 },
        createdAt: '2026-03-01T00:00:00.000Z',
      };
      const initial = [
        makeFinding({
          id: 'f-1',
          text: 'Test',
          context: makeContext(),
          projection,
        } as Finding & { projection: typeof projection }),
      ];
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useFindings({ initialFindings: initial, onFindingsChange: onChange })
      );

      act(() => {
        result.current.clearProjection('f-1');
      });

      expect(result.current.findings[0].projection).toBeUndefined();
      expect(onChange).toHaveBeenCalled();
    });

    it('is a no-op for finding without a projection', () => {
      const initial = [makeFinding({ id: 'f-1', text: 'No projection', context: makeContext() })];
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useFindings({ initialFindings: initial, onFindingsChange: onChange })
      );

      act(() => {
        result.current.clearProjection('f-1');
      });

      expect(result.current.findings[0].projection).toBeUndefined();
      expect(onChange).toHaveBeenCalled();
    });
  });

  // --- 5-Status: Action Items ---

  describe('addAction', () => {
    it('adds an action item to a finding', () => {
      const initial = [makeFinding({ id: 'f-1', text: 'Test', context: makeContext() })];
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useFindings({ initialFindings: initial, onFindingsChange: onChange })
      );

      act(() => {
        result.current.addAction(
          'f-1',
          'Replace gasket',
          { upn: 'bob@co.com', displayName: 'Bob' },
          '2026-04-01'
        );
      });

      const actions = result.current.findings[0].actions;
      expect(actions).toHaveLength(1);
      expect(actions![0].text).toBe('Replace gasket');
      expect(actions![0].assignee).toEqual({ upn: 'bob@co.com', displayName: 'Bob' });
      expect(actions![0].dueDate).toBe('2026-04-01');
      expect(actions![0].id).toBeTruthy();
      expect(onChange).toHaveBeenCalled();
    });

    it('auto-transitions from analyzed to improving on first action', () => {
      const initial = [
        makeFinding({ id: 'f-1', text: 'Test', status: 'analyzed', context: makeContext() }),
      ];
      const { result } = renderHook(() => useFindings({ initialFindings: initial }));

      act(() => {
        result.current.addAction('f-1', 'Fix it');
      });

      expect(result.current.findings[0].status).toBe('improving');
      expect(result.current.findings[0].actions).toHaveLength(1);
    });

    it('does not auto-transition if already has actions', () => {
      const initial = [
        makeFinding({
          id: 'f-1',
          text: 'Test',
          status: 'analyzed',
          context: makeContext(),
          actions: [{ id: 'a-1', text: 'Existing', createdAt: 1000, deletedAt: null }],
        }),
      ];
      const { result } = renderHook(() => useFindings({ initialFindings: initial }));

      act(() => {
        result.current.addAction('f-1', 'Another action');
      });

      // Status stays analyzed because there were already actions
      expect(result.current.findings[0].status).toBe('analyzed');
      expect(result.current.findings[0].actions).toHaveLength(2);
    });

    it('does not auto-transition if status is not analyzed', () => {
      const initial = [
        makeFinding({ id: 'f-1', text: 'Test', status: 'investigating', context: makeContext() }),
      ];
      const { result } = renderHook(() => useFindings({ initialFindings: initial }));

      act(() => {
        result.current.addAction('f-1', 'Some action');
      });

      expect(result.current.findings[0].status).toBe('investigating');
    });
  });

  describe('updateAction', () => {
    it('updates action text and assignee', () => {
      const initial = [
        makeFinding({
          id: 'f-1',
          text: 'Test',
          context: makeContext(),
          actions: [
            {
              id: 'a-1',
              text: 'Old text',
              assignee: { upn: 'alice@co.com', displayName: 'Alice' },
              createdAt: 1000,
              deletedAt: null,
            },
          ],
        }),
      ];
      const { result } = renderHook(() => useFindings({ initialFindings: initial }));

      act(() => {
        result.current.updateAction('f-1', 'a-1', {
          text: 'New text',
          assignee: { upn: 'bob@co.com', displayName: 'Bob' },
        });
      });

      const action = result.current.findings[0].actions![0];
      expect(action.text).toBe('New text');
      expect(action.assignee).toEqual({ upn: 'bob@co.com', displayName: 'Bob' });
    });
  });

  describe('completeAction', () => {
    it('sets completedAt timestamp on action', () => {
      const initial = [
        makeFinding({
          id: 'f-1',
          text: 'Test',
          context: makeContext(),
          actions: [{ id: 'a-1', text: 'Do it', createdAt: 1000, deletedAt: null }],
        }),
      ];
      const { result } = renderHook(() => useFindings({ initialFindings: initial }));

      act(() => {
        result.current.completeAction('f-1', 'a-1');
      });

      expect(result.current.findings[0].actions![0].completedAt).toBeGreaterThan(0);
    });
  });

  describe('toggleActionComplete', () => {
    it('sets completedAt when action is not completed', () => {
      const initial = [
        makeFinding({
          id: 'f-1',
          text: 'Test',
          context: makeContext(),
          actions: [{ id: 'a-1', text: 'Do it', createdAt: 1000, deletedAt: null }],
        }),
      ];
      const { result } = renderHook(() => useFindings({ initialFindings: initial }));

      act(() => {
        result.current.toggleActionComplete('f-1', 'a-1');
      });

      expect(result.current.findings[0].actions![0].completedAt).toBeGreaterThan(0);
    });

    it('clears completedAt when action is already completed', () => {
      const initial = [
        makeFinding({
          id: 'f-1',
          text: 'Test',
          context: makeContext(),
          actions: [
            { id: 'a-1', text: 'Do it', createdAt: 1000, completedAt: 5000, deletedAt: null },
          ],
        }),
      ];
      const { result } = renderHook(() => useFindings({ initialFindings: initial }));

      act(() => {
        result.current.toggleActionComplete('f-1', 'a-1');
      });

      expect(result.current.findings[0].actions![0].completedAt).toBeUndefined();
    });

    it('calls onFindingsChange after toggle', () => {
      const onChange = vi.fn();
      const initial = [
        makeFinding({
          id: 'f-1',
          text: 'Test',
          context: makeContext(),
          actions: [{ id: 'a-1', text: 'Do it', createdAt: 1000, deletedAt: null }],
        }),
      ];
      const { result } = renderHook(() =>
        useFindings({ initialFindings: initial, onFindingsChange: onChange })
      );

      act(() => {
        result.current.toggleActionComplete('f-1', 'a-1');
      });

      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteAction', () => {
    it('removes an action by id', () => {
      const initial = [
        makeFinding({
          id: 'f-1',
          text: 'Test',
          context: makeContext(),
          actions: [
            { id: 'a-1', text: 'Keep', createdAt: 1000, deletedAt: null },
            { id: 'a-2', text: 'Remove', createdAt: 2000, deletedAt: null },
          ],
        }),
      ];
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useFindings({ initialFindings: initial, onFindingsChange: onChange })
      );

      act(() => {
        result.current.deleteAction('f-1', 'a-2');
      });

      expect(result.current.findings[0].actions).toHaveLength(1);
      expect(result.current.findings[0].actions![0].id).toBe('a-1');
      expect(onChange).toHaveBeenCalled();
    });
  });

  // --- 5-Status: Outcome ---

  describe('setOutcome', () => {
    it('sets outcome on a finding', () => {
      const initial = [
        makeFinding({ id: 'f-1', text: 'Test', status: 'improving', context: makeContext() }),
      ];
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useFindings({ initialFindings: initial, onFindingsChange: onChange })
      );

      const outcome: FindingOutcome = {
        effective: 'yes',
        cpkAfter: 1.5,
        notes: 'Fixed',
        verifiedAt: Date.now(),
      };

      act(() => {
        result.current.setOutcome('f-1', outcome);
      });

      expect(result.current.findings[0].outcome).toEqual(outcome);
      expect(onChange).toHaveBeenCalled();
    });

    it('auto-transitions to resolved when all actions complete + outcome set', () => {
      const initial = [
        makeFinding({
          id: 'f-1',
          text: 'Test',
          status: 'improving',
          context: makeContext(),
          actions: [
            { id: 'a-1', text: 'Done', createdAt: 1000, completedAt: 2000, deletedAt: null },
          ],
        }),
      ];
      const { result } = renderHook(() => useFindings({ initialFindings: initial }));

      act(() => {
        result.current.setOutcome('f-1', {
          effective: 'yes',
          verifiedAt: Date.now(),
        });
      });

      expect(result.current.findings[0].status).toBe('resolved');
    });

    it('does not auto-transition when actions are incomplete', () => {
      const initial = [
        makeFinding({
          id: 'f-1',
          text: 'Test',
          status: 'improving',
          context: makeContext(),
          actions: [{ id: 'a-1', text: 'Not done', createdAt: 1000, deletedAt: null }],
        }),
      ];
      const { result } = renderHook(() => useFindings({ initialFindings: initial }));

      act(() => {
        result.current.setOutcome('f-1', {
          effective: 'partial',
          verifiedAt: Date.now(),
        });
      });

      expect(result.current.findings[0].status).toBe('improving');
    });

    it('does not auto-transition when status is not improving', () => {
      const initial = [
        makeFinding({
          id: 'f-1',
          text: 'Test',
          status: 'analyzed',
          context: makeContext(),
          actions: [
            { id: 'a-1', text: 'Done', createdAt: 1000, completedAt: 2000, deletedAt: null },
          ],
        }),
      ];
      const { result } = renderHook(() => useFindings({ initialFindings: initial }));

      act(() => {
        result.current.setOutcome('f-1', {
          effective: 'yes',
          verifiedAt: Date.now(),
        });
      });

      expect(result.current.findings[0].status).toBe('analyzed');
    });
  });

  // --- onStatusChange callback ---

  describe('onStatusChange callback', () => {
    it('fires when setFindingStatus is called', () => {
      const initial = [makeFinding({ id: 'f-1', text: 'Test', context: makeContext() })];
      const onStatusChange = vi.fn();
      const { result } = renderHook(() =>
        useFindings({ initialFindings: initial, onStatusChange })
      );

      act(() => {
        result.current.setFindingStatus('f-1', 'analyzed');
      });

      expect(onStatusChange).toHaveBeenCalledTimes(1);
      expect(onStatusChange).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'f-1', status: 'analyzed' }),
        'analyzed'
      );
    });

    it('fires when setOutcome auto-transitions to resolved', () => {
      const initial = [
        makeFinding({
          id: 'f-1',
          text: 'Test',
          status: 'improving',
          context: makeContext(),
          actions: [
            { id: 'a-1', text: 'Done', createdAt: 1000, completedAt: 2000, deletedAt: null },
          ],
        }),
      ];
      const onStatusChange = vi.fn();
      const { result } = renderHook(() =>
        useFindings({ initialFindings: initial, onStatusChange })
      );

      act(() => {
        result.current.setOutcome('f-1', { effective: 'yes', verifiedAt: Date.now() });
      });

      expect(onStatusChange).toHaveBeenCalledTimes(1);
      expect(onStatusChange).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'f-1', status: 'resolved' }),
        'resolved'
      );
    });

    it('does NOT fire for addAction auto-transition to improving', () => {
      const initial = [
        makeFinding({ id: 'f-1', text: 'Test', status: 'analyzed', context: makeContext() }),
      ];
      const onStatusChange = vi.fn();
      const { result } = renderHook(() =>
        useFindings({ initialFindings: initial, onStatusChange })
      );

      act(() => {
        result.current.addAction('f-1', 'Fix it');
      });

      // Status changed to improving but onStatusChange should NOT fire
      expect(result.current.findings[0].status).toBe('improving');
      expect(onStatusChange).not.toHaveBeenCalled();
    });
  });

  describe('questionId linking', () => {
    it('addFinding with questionId sets questionId on the created finding', () => {
      const { result } = renderHook(() => useFindings());
      const ctx = makeContext();

      let finding: Finding;
      act(() => {
        finding = result.current.addFinding('Answer to question', ctx, undefined, 'q-42');
      });

      expect(finding!.questionId).toBe('q-42');
      expect(result.current.findings[0].questionId).toBe('q-42');
    });

    it('addFinding without questionId leaves questionId undefined', () => {
      const { result } = renderHook(() => useFindings());
      const ctx = makeContext();

      let finding: Finding;
      act(() => {
        finding = result.current.addFinding('Regular observation', ctx);
      });

      expect(finding!.questionId).toBeUndefined();
      expect(result.current.findings[0].questionId).toBeUndefined();
    });
  });
});
