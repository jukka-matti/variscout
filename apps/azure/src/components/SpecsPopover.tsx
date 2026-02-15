import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, Settings2 } from 'lucide-react';

interface SpecsPopoverProps {
  specs: { usl?: number; lsl?: number; target?: number };
  onSave: (specs: { usl?: number; lsl?: number; target?: number }) => void;
  onOpenAdvanced?: () => void;
  className?: string;
}

interface SpecVisibility {
  usl: boolean;
  lsl: boolean;
  target: boolean;
}

const SpecsPopover: React.FC<SpecsPopoverProps> = ({
  specs,
  onSave,
  onOpenAdvanced,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localSpecs, setLocalSpecs] = useState({
    usl: specs.usl?.toString() || '',
    lsl: specs.lsl?.toString() || '',
    target: specs.target?.toString() || '',
  });
  const [visibility, setVisibility] = useState<SpecVisibility>({
    usl: specs.usl !== undefined,
    lsl: specs.lsl !== undefined,
    target: specs.target !== undefined,
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Sync local state when specs change from outside
  useEffect(() => {
    setLocalSpecs({
      usl: specs.usl?.toString() || '',
      lsl: specs.lsl?.toString() || '',
      target: specs.target?.toString() || '',
    });
    setVisibility({
      usl: specs.usl !== undefined,
      lsl: specs.lsl !== undefined,
      target: specs.target !== undefined,
    });
    setHasChanges(false);
  }, [specs]);

  // Track changes
  useEffect(() => {
    const newSpecs = {
      usl: visibility.usl && localSpecs.usl ? parseFloat(localSpecs.usl) : undefined,
      lsl: visibility.lsl && localSpecs.lsl ? parseFloat(localSpecs.lsl) : undefined,
      target: visibility.target && localSpecs.target ? parseFloat(localSpecs.target) : undefined,
    };
    const changed =
      newSpecs.usl !== specs.usl || newSpecs.lsl !== specs.lsl || newSpecs.target !== specs.target;
    setHasChanges(changed);
  }, [localSpecs, visibility, specs]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (
        popoverRef.current &&
        target &&
        !popoverRef.current.contains(target) &&
        !buttonRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Calculate position based on button
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
  }, [isOpen]);

  const handleApply = useCallback(() => {
    const newSpecs = {
      usl: visibility.usl && localSpecs.usl ? parseFloat(localSpecs.usl) : undefined,
      lsl: visibility.lsl && localSpecs.lsl ? parseFloat(localSpecs.lsl) : undefined,
      target: visibility.target && localSpecs.target ? parseFloat(localSpecs.target) : undefined,
    };
    onSave(newSpecs);
    setIsOpen(false);
  }, [localSpecs, visibility, onSave]);

  const handleInputChange = (field: 'usl' | 'lsl' | 'target', value: string) => {
    setLocalSpecs(prev => ({ ...prev, [field]: value }));
  };

  const handleVisibilityChange = (field: 'usl' | 'lsl' | 'target', checked: boolean) => {
    setVisibility(prev => ({ ...prev, [field]: checked }));
  };

  // Determine button label
  const hasAnySpec =
    specs.usl !== undefined || specs.lsl !== undefined || specs.target !== undefined;
  const buttonLabel = hasAnySpec ? 'Specs' : '+ Specs';

  // Spec input row component
  const SpecRow = ({
    label,
    field,
    value,
    checked,
    placeholder,
  }: {
    label: string;
    field: 'usl' | 'lsl' | 'target';
    value: string;
    checked: boolean;
    placeholder: string;
  }) => (
    <div className="flex items-center gap-2">
      <label className="flex items-center gap-2 flex-1 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => handleVisibilityChange(field, e.target.checked)}
          className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900"
        />
        <span className="text-sm text-slate-300 w-14">{label}</span>
      </label>
      <input
        type="number"
        step="any"
        value={value}
        onChange={e => handleInputChange(field, e.target.value)}
        disabled={!checked}
        placeholder={placeholder}
        className={`w-24 bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white text-right outline-none focus:border-blue-500 transition-colors ${
          !checked ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      />
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
          hasAnySpec
            ? 'text-blue-400 hover:text-blue-300 hover:bg-slate-700/50'
            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
        }`}
      >
        {buttonLabel}
        <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="fixed w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50"
          style={{
            top: position.top,
            left: position.left,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Specification Limits
            </h4>
            {onOpenAdvanced && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenAdvanced();
                }}
                className="p-1 text-slate-500 hover:text-white rounded transition-colors"
                title="Advanced settings (Grades)"
              >
                <Settings2 size={14} />
              </button>
            )}
          </div>

          {/* Spec Inputs */}
          <div className="p-3 space-y-3">
            <SpecRow
              label="USL"
              field="usl"
              value={localSpecs.usl}
              checked={visibility.usl}
              placeholder="Max"
            />
            <SpecRow
              label="Target"
              field="target"
              value={localSpecs.target}
              checked={visibility.target}
              placeholder="Ideal"
            />
            <SpecRow
              label="LSL"
              field="lsl"
              value={localSpecs.lsl}
              checked={visibility.lsl}
              placeholder="Min"
            />
          </div>

          {/* Apply Button */}
          <div className="px-3 pb-3">
            <button
              onClick={handleApply}
              disabled={!hasChanges}
              className={`w-full py-2 rounded text-sm font-medium transition-colors ${
                hasChanges
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {hasChanges ? 'Apply Changes' : 'No Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecsPopover;
