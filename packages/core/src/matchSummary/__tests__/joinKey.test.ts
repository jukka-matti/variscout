import { describe, it, expect } from 'vitest';
import { rankJoinKeyCandidates } from '../joinKey';

describe('rankJoinKeyCandidates', () => {
  it('ranks lot_id highest when both columns share the name and overlap fully', () => {
    const hubColumns = ['ts', 'weight_g', 'lot_id'];
    const hubRows = [{ lot_id: 'L1' }, { lot_id: 'L2' }, { lot_id: 'L3' }];
    const newColumns = ['defect_type', 'lot_id', 'count'];
    const newRows = [{ lot_id: 'L1' }, { lot_id: 'L2' }, { lot_id: 'L3' }];

    const ranked = rankJoinKeyCandidates(hubColumns, hubRows, newColumns, newRows);
    expect(ranked[0].hubColumn).toBe('lot_id');
    expect(ranked[0].newColumn).toBe('lot_id');
    expect(ranked[0].valueOverlapPct).toBe(1);
  });

  it('returns empty when no shared key candidates', () => {
    const ranked = rankJoinKeyCandidates(
      ['weight_g', 'machine_id'],
      [{ machine_id: 'm1' }],
      ['defect_type'],
      [{ defect_type: 'crack' }]
    );
    expect(ranked).toHaveLength(0);
  });

  it('uses *_id heuristic when name match is partial', () => {
    const ranked = rankJoinKeyCandidates(
      ['lot_id'],
      [{ lot_id: 'L1' }, { lot_id: 'L2' }],
      ['lot'],
      [{ lot: 'L1' }, { lot: 'L2' }]
    );
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked[0].nameMatchScore).toBeGreaterThan(0.3);
  });

  it('value overlap of 0 + low name match → not a candidate', () => {
    const ranked = rankJoinKeyCandidates(
      ['lot_id'],
      [{ lot_id: 'X1' }],
      ['supplier_name'],
      [{ supplier_name: 'Y1' }]
    );
    expect(ranked).toHaveLength(0);
  });

  it('totalScore weights value overlap more than name match', () => {
    // Two candidates: one with high name match, low value overlap; one inverse.
    // High overlap should win.
    const ranked = rankJoinKeyCandidates(
      ['lot_id', 'batch_id'],
      [
        { lot_id: 'L1', batch_id: 'B1' },
        { lot_id: 'L2', batch_id: 'B2' },
      ],
      ['lot_id', 'batch'],
      [
        { lot_id: 'X1', batch: 'B1' },
        { lot_id: 'X2', batch: 'B2' },
      ]
    );
    // lot_id ↔ lot_id: name 1.0, value 0
    // batch_id ↔ batch: name partial (heuristic), value 1.0
    // batch_id ↔ batch should win because totalScore weights value 0.6.
    expect(ranked[0].hubColumn).toBe('batch_id');
    expect(ranked[0].newColumn).toBe('batch');
  });
});
