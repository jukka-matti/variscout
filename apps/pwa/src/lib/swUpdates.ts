import { registerSW } from 'virtual:pwa-register';

export interface RegisterPwaUpdatesOptions {
  onNeedRefresh: () => void;
  onOfflineReady?: () => void;
}

export interface PwaUpdateController {
  updateSW: (reloadPage?: boolean) => Promise<void>;
}

export function registerPwaUpdates(opts: RegisterPwaUpdatesOptions): PwaUpdateController {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh: () => opts.onNeedRefresh(),
    onOfflineReady: () => opts.onOfflineReady?.(),
  });
  return { updateSW };
}
