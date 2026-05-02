import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface RegisterSWArgs {
  immediate?: boolean;
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
}

const { mockState } = vi.hoisted(() => ({
  mockState: {
    capturedOptions: undefined as RegisterSWArgs | undefined,
    updateSW: vi.fn<(reloadPage?: boolean) => Promise<void>>(),
  },
}));

vi.mock('virtual:pwa-register', () => ({
  registerSW: (options: RegisterSWArgs) => {
    mockState.capturedOptions = options;
    return mockState.updateSW;
  },
}));

import { act, render, screen } from '@testing-library/react';
import UpdatePrompt from '../UpdatePrompt';

beforeEach(() => {
  mockState.capturedOptions = undefined;
  mockState.updateSW = vi.fn<(reloadPage?: boolean) => Promise<void>>();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('UpdatePrompt', () => {
  it('renders nothing by default', () => {
    render(<UpdatePrompt />);

    expect(screen.queryByTestId('update-prompt')).toBeNull();
  });

  it('shows banner with Reload + Later buttons when onNeedRefresh fires', () => {
    render(<UpdatePrompt />);

    act(() => {
      mockState.capturedOptions?.onNeedRefresh?.();
    });

    expect(screen.getByTestId('update-prompt')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /later/i })).toBeInTheDocument();
  });

  it('clicking Reload calls updateSW(true)', () => {
    render(<UpdatePrompt />);

    act(() => {
      mockState.capturedOptions?.onNeedRefresh?.();
    });

    act(() => {
      screen.getByRole('button', { name: /reload/i }).click();
    });

    expect(mockState.updateSW).toHaveBeenCalledTimes(1);
    expect(mockState.updateSW).toHaveBeenCalledWith(true);
  });

  it('clicking Later hides the banner', () => {
    render(<UpdatePrompt />);

    act(() => {
      mockState.capturedOptions?.onNeedRefresh?.();
    });

    expect(screen.getByTestId('update-prompt')).toBeInTheDocument();

    act(() => {
      screen.getByRole('button', { name: /later/i }).click();
    });

    expect(screen.queryByTestId('update-prompt')).toBeNull();
  });

  it('registers exactly once across re-renders', () => {
    const { rerender } = render(<UpdatePrompt />);
    rerender(<UpdatePrompt />);
    rerender(<UpdatePrompt />);

    expect(mockState.capturedOptions?.immediate).toBe(true);
  });
});
