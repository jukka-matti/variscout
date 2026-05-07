import React from 'react';

interface HandoffPanelProps {
  onBack: () => void;
}

const HandoffPanel: React.FC<HandoffPanelProps> = ({ onBack }) => {
  return (
    <div
      data-testid="handoff-panel"
      className="bg-surface-primary text-content border border-edge rounded-md px-4 py-3 flex flex-col gap-4"
    >
      <h2 className="text-lg font-semibold">Handoff</h2>
      <p className="text-content-secondary">
        Handoff transfers ownership of a confirmed-sustained improvement to the process owner with a
        control plan. The full handoff surface ships in a future release.
      </p>
      <p className="text-content-secondary text-sm italic">Available in a future release.</p>
      <button
        type="button"
        onClick={onBack}
        className="self-start text-sm underline text-content-secondary"
      >
        Back to FRAME
      </button>
    </div>
  );
};

export default HandoffPanel;
