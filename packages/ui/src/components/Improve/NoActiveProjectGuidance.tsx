export interface NoActiveProjectGuidanceProps {
  onGoHome: () => void;
}

export function NoActiveProjectGuidance({ onGoHome }: NoActiveProjectGuidanceProps) {
  return (
    <section role="alert" className="p-8 text-content max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-2">No active project</h2>
      <p className="text-content-secondary mb-4">
        Improvement work happens inside a chartered project. Pick a project from Home, or create a
        new one to start tracking actions and ideating with the PDCA workbench.
      </p>
      <button
        type="button"
        onClick={onGoHome}
        className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
      >
        Go to Home
      </button>
    </section>
  );
}
