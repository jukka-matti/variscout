import React from 'react';

interface SustainmentPanelProps {
  onBack: () => void;
}

const SustainmentPanel: React.FC<SustainmentPanelProps> = ({ onBack }) => {
  return (
    <div
      data-testid="sustainment-panel"
      className="bg-surface-primary text-content border border-edge rounded-md px-4 py-3 flex flex-col gap-4"
    >
      <h2 className="text-lg font-semibold">Sustainment</h2>
      <p className="text-content-secondary">
        Sustainment monitors a process change after implementation to verify the gain holds. The
        full monitoring surface ships in a future release.
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

export default SustainmentPanel;
