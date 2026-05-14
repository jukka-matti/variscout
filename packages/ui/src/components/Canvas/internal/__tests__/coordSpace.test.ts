import { describe, expect, it } from 'vitest';
import { clientToWorld, worldToCanvasDom } from '../coordSpace';

describe('coordSpace', () => {
  const viewport = {
    zoom: 2,
    pan: { x: 100, y: 50 },
    currentLevel: 'l2' as const,
    nodePositions: {},
    groupByTributary: false,
  };

  it('clientToWorld inverts the viewport transform', () => {
    expect(clientToWorld({ x: 300, y: 200 }, viewport)).toEqual({ x: 100, y: 75 });
  });

  it('worldToCanvasDom applies the viewport transform forward', () => {
    expect(worldToCanvasDom({ x: 100, y: 75 }, viewport)).toEqual({ x: 300, y: 200 });
  });

  it('round-trips world and Canvas DOM coordinates', () => {
    const world = { x: 42, y: 17 };
    const dom = worldToCanvasDom(world, viewport);
    const back = clientToWorld(dom, viewport);

    expect(back.x).toBeCloseTo(world.x);
    expect(back.y).toBeCloseTo(world.y);
  });
});
