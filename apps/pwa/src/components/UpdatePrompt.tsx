import { useEffect, useRef, useState, type FC } from 'react';
import { registerPwaUpdates, type PwaUpdateController } from '../lib/swUpdates';

const UpdatePrompt: FC = () => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const updaterRef = useRef<PwaUpdateController | null>(null);

  useEffect(() => {
    updaterRef.current = registerPwaUpdates({
      onNeedRefresh: () => setNeedRefresh(true),
    });
  }, []);

  if (!needRefresh || dismissed) return null;

  const handleReload = () => {
    void updaterRef.current?.updateSW(true);
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="update-prompt"
      className="fixed bottom-4 right-4 z-40 max-w-sm rounded-lg border border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950 shadow-lg p-3 flex items-start gap-3"
    >
      <div className="flex-1">
        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Update available</p>
        <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
          A new version of VariScout is ready. Reload to apply it.
        </p>
      </div>
      <div className="flex flex-col gap-1.5 flex-shrink-0">
        <button
          type="button"
          onClick={handleReload}
          className="px-3 py-1 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors"
        >
          Reload
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="px-3 py-1 text-xs font-medium rounded-md text-blue-700 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
        >
          Later
        </button>
      </div>
    </div>
  );
};

export default UpdatePrompt;
