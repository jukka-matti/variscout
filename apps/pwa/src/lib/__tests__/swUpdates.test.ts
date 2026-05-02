import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface RegisterSWArgs {
  immediate?: boolean;
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
}

const mockState = {
  capturedOptions: undefined as RegisterSWArgs | undefined,
  updateSW: vi.fn<(reloadPage?: boolean) => Promise<void>>(),
  registerSW: vi.fn<(options: RegisterSWArgs) => void>(),
};

vi.mock('virtual:pwa-register', () => ({
  registerSW: (options: RegisterSWArgs) => {
    mockState.capturedOptions = options;
    mockState.registerSW(options);
    return mockState.updateSW;
  },
}));

import { registerPwaUpdates } from '../swUpdates';

beforeEach(() => {
  mockState.capturedOptions = undefined;
  mockState.updateSW = vi.fn<(reloadPage?: boolean) => Promise<void>>();
  mockState.registerSW = vi.fn<(options: RegisterSWArgs) => void>();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('registerPwaUpdates', () => {
  it('calls registerSW exactly once with immediate:true', () => {
    registerPwaUpdates({ onNeedRefresh: () => undefined });

    expect(mockState.registerSW).toHaveBeenCalledTimes(1);
    expect(mockState.capturedOptions?.immediate).toBe(true);
  });

  it('forwards onNeedRefresh callback to the caller', () => {
    const onNeedRefresh = vi.fn();
    registerPwaUpdates({ onNeedRefresh });

    mockState.capturedOptions?.onNeedRefresh?.();

    expect(onNeedRefresh).toHaveBeenCalledTimes(1);
  });

  it('forwards onOfflineReady callback when provided', () => {
    const onOfflineReady = vi.fn();
    registerPwaUpdates({
      onNeedRefresh: () => undefined,
      onOfflineReady,
    });

    mockState.capturedOptions?.onOfflineReady?.();

    expect(onOfflineReady).toHaveBeenCalledTimes(1);
  });

  it('tolerates missing onOfflineReady when registerSW invokes it', () => {
    registerPwaUpdates({ onNeedRefresh: () => undefined });

    expect(() => mockState.capturedOptions?.onOfflineReady?.()).not.toThrow();
  });

  it('returns a controller whose updateSW proxies to registerSW return value', async () => {
    const controller = registerPwaUpdates({ onNeedRefresh: () => undefined });

    await controller.updateSW(true);

    expect(mockState.updateSW).toHaveBeenCalledTimes(1);
    expect(mockState.updateSW).toHaveBeenCalledWith(true);
  });
});
