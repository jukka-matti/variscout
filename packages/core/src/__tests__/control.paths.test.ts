import { describe, it, expect } from 'vitest';
import {
  controlRecordBlobPath,
  controlReviewBlobPath,
  controlHandoffBlobPath,
  controlCatalogPath,
} from '../control';

describe('sustainment path helpers', () => {
  it('builds record paths under process-hubs/{hubId}/sustainment/records/', () => {
    expect(controlRecordBlobPath('hub-1', 'rec-abc')).toBe(
      'process-hubs/hub-1/sustainment/records/rec-abc.json'
    );
  });

  it('builds review paths under sustainment/reviews/{recordId}/{reviewId}.json', () => {
    expect(controlReviewBlobPath('hub-1', 'rec-abc', 'rev-xyz')).toBe(
      'process-hubs/hub-1/sustainment/reviews/rec-abc/rev-xyz.json'
    );
  });

  it('builds handoff paths under sustainment/handoffs/', () => {
    expect(controlHandoffBlobPath('hub-1', 'hoff-001')).toBe(
      'process-hubs/hub-1/sustainment/handoffs/hoff-001.json'
    );
  });

  it('builds the catalog path', () => {
    expect(controlCatalogPath('hub-1')).toBe('process-hubs/hub-1/sustainment/_index.json');
  });

  it('encodes unsafe characters in path segments', () => {
    // safePathSegment strips leading/trailing slashes and .. sequences.
    // Leading slashes on hubId are stripped; trailing slashes on recordId are stripped.
    expect(controlRecordBlobPath('/hub-1/', '..rec-abc..')).toBe(
      'process-hubs/hub-1/sustainment/records/rec-abc.json'
    );
  });
});
