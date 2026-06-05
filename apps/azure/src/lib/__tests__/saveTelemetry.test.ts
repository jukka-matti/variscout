import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockSafeTrackEvent } = vi.hoisted(() => ({ mockSafeTrackEvent: vi.fn() }));
vi.mock('../appInsights', () => ({ safeTrackEvent: mockSafeTrackEvent }));

import {
  LONG_TASK_TRIGGER_MS,
  OVERSIZE_TRIGGER_BYTES,
  trackDocumentSaveSerialize,
} from '../saveTelemetry';

beforeEach(() => {
  mockSafeTrackEvent.mockClear();
});

describe('trackDocumentSaveSerialize (PO-8b — research-grounded dual trigger)', () => {
  it('emits a structural-only event (bytes + ms, never names/content)', () => {
    trackDocumentSaveSerialize({ sizeBytes: 1_500_000, serializeMs: 12.345 });

    expect(mockSafeTrackEvent).toHaveBeenCalledTimes(1);
    const [name, props] = mockSafeTrackEvent.mock.calls[0];
    expect(name).toBe('Document.Save.Serialize');
    expect(props).toEqual({
      sizeBytes: 1_500_000,
      serializeMs: 12.35,
      oversize: false,
      longTask: false,
    });
    // PII guard: the payload carries ONLY these structural keys
    expect(Object.keys(props).sort()).toEqual(['longTask', 'oversize', 'serializeMs', 'sizeBytes']);
  });

  it('fires the re-architect trigger on size (>50MB)', () => {
    trackDocumentSaveSerialize({ sizeBytes: OVERSIZE_TRIGGER_BYTES + 1, serializeMs: 5 });
    expect(mockSafeTrackEvent).toHaveBeenCalledWith(
      'Document.Save.ReArchitectTrigger',
      expect.objectContaining({ trigger: 'size' })
    );
  });

  it('fires the re-architect trigger on duration (>50ms long-task)', () => {
    trackDocumentSaveSerialize({ sizeBytes: 1000, serializeMs: LONG_TASK_TRIGGER_MS + 1 });
    expect(mockSafeTrackEvent).toHaveBeenCalledWith(
      'Document.Save.ReArchitectTrigger',
      expect.objectContaining({ trigger: 'duration' })
    );
  });

  it('negative control: a small fast save fires NO trigger event', () => {
    trackDocumentSaveSerialize({ sizeBytes: 1000, serializeMs: 3 });
    expect(mockSafeTrackEvent).toHaveBeenCalledTimes(1); // only the Serialize event
    expect(mockSafeTrackEvent.mock.calls[0][0]).toBe('Document.Save.Serialize');
  });
});
