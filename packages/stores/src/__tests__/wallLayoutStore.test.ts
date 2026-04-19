import { describe, it, expect, beforeEach } from 'vitest';
import { useWallLayoutStore } from '../wallLayoutStore';

describe('wallLayoutStore', () => {
  beforeEach(() => {
    useWallLayoutStore.setState(useWallLayoutStore.getInitialState());
  });

  it('defaults viewMode to map (preserves ADR-066 default)', () => {
    expect(useWallLayoutStore.getState().viewMode).toBe('map');
  });

  it('toggles viewMode to wall and back', () => {
    useWallLayoutStore.getState().setViewMode('wall');
    expect(useWallLayoutStore.getState().viewMode).toBe('wall');
    useWallLayoutStore.getState().setViewMode('map');
    expect(useWallLayoutStore.getState().viewMode).toBe('map');
  });

  it('starts with zoom 1.0 and pan 0,0', () => {
    expect(useWallLayoutStore.getState().zoom).toBe(1);
    expect(useWallLayoutStore.getState().pan).toEqual({ x: 0, y: 0 });
  });

  it('updates pan', () => {
    useWallLayoutStore.getState().setPan({ x: 100, y: -50 });
    expect(useWallLayoutStore.getState().pan).toEqual({ x: 100, y: -50 });
  });

  it('updates zoom', () => {
    useWallLayoutStore.getState().setZoom(2);
    expect(useWallLayoutStore.getState().zoom).toBe(2);
  });

  it('rail is open by default', () => {
    expect(useWallLayoutStore.getState().railOpen).toBe(true);
  });

  it('toggles rail', () => {
    useWallLayoutStore.getState().toggleRail();
    expect(useWallLayoutStore.getState().railOpen).toBe(false);
    useWallLayoutStore.getState().toggleRail();
    expect(useWallLayoutStore.getState().railOpen).toBe(true);
  });
});
