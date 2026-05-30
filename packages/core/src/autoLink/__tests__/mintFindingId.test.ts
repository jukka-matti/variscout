import { describe, it, expect } from 'vitest';
import { mintAutoLinkFindingId } from '../mintFindingId';

describe('mintAutoLinkFindingId', () => {
  it('is deterministic — same (planId, column) → same id', () => {
    expect(mintAutoLinkFindingId('mp-1', 'Shift')).toBe(mintAutoLinkFindingId('mp-1', 'Shift'));
  });

  it('differs across columns', () => {
    expect(mintAutoLinkFindingId('mp-1', 'Shift')).not.toBe(mintAutoLinkFindingId('mp-1', 'Line'));
  });

  it('differs across plans', () => {
    expect(mintAutoLinkFindingId('mp-1', 'Shift')).not.toBe(mintAutoLinkFindingId('mp-2', 'Shift'));
  });

  it('is order-sensitive (plan/column not symmetric)', () => {
    expect(mintAutoLinkFindingId('A', 'B')).not.toBe(mintAutoLinkFindingId('B', 'A'));
  });

  it('produces a stable, prefixed, hyphen-segmented shape', () => {
    expect(mintAutoLinkFindingId('mp-1', 'Shift')).toMatch(
      /^autolink-[0-9a-f]{8}-[0-9a-f]{8}-[0-9a-f]{8}$/
    );
  });
});
