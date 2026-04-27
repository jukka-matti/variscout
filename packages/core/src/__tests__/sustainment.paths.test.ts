import { describe, it, expect } from 'vitest';
import {
  sustainmentRecordBlobPath,
  sustainmentReviewBlobPath,
  controlHandoffBlobPath,
  sustainmentCatalogPath,
} from '../sustainment';

describe('sustainment path helpers', () => {
  it('builds record paths under process-hubs/{hubId}/sustainment/records/', () => {
    expect(sustainmentRecordBlobPath('hub-1', 'rec-abc')).toBe(
      'process-hubs/hub-1/sustainment/records/rec-abc.json'
    );
  });

  it('builds review paths under sustainment/reviews/{recordId}/{reviewId}.json', () => {
    expect(sustainmentReviewBlobPath('hub-1', 'rec-abc', 'rev-xyz')).toBe(
      'process-hubs/hub-1/sustainment/reviews/rec-abc/rev-xyz.json'
    );
  });

  it('builds handoff paths under sustainment/handoffs/', () => {
    expect(controlHandoffBlobPath('hub-1', 'hoff-001')).toBe(
      'process-hubs/hub-1/sustainment/handoffs/hoff-001.json'
    );
  });

  it('builds the catalog path', () => {
    expect(sustainmentCatalogPath('hub-1')).toBe('process-hubs/hub-1/sustainment/_index.json');
  });

  it('encodes unsafe characters in path segments', () => {
    // safePathSegment strips leading/trailing slashes and .. sequences.
    // Leading slashes on hubId are stripped; trailing slashes on recordId are stripped.
    expect(sustainmentRecordBlobPath('/hub-1/', '..rec-abc..')).toBe(
      'process-hubs/hub-1/sustainment/records/rec-abc.json'
    );
  });
});
