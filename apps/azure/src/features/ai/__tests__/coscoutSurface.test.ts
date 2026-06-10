import { describe, expect, it } from 'vitest';
import { getCoScoutSurfaceForView } from '../coscoutSurface';

describe('getCoScoutSurfaceForView', () => {
  it.each([
    ['frame', 'process'],
    ['explore', 'explore'],
    ['analyze', 'analyze'],
    ['report', 'report'],
  ] as const)('maps %s to %s', (activeView, surface) => {
    expect(getCoScoutSurfaceForView(activeView)).toBe(surface);
  });

  it.each(['home', 'projects', 'improvement', 'charter', 'sustainment'] as const)(
    'does not expose CoScout on %s',
    activeView => {
      expect(getCoScoutSurfaceForView(activeView)).toBeNull();
    }
  );
});
