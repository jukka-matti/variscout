import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChevronDown, Settings2 } from 'lucide-react';
import { useTranslation } from '@variscout/hooks';
import type { SpecsPopoverColorScheme, SpecsPopoverProps } from './types';

interface SpecRowProps {
  label: string;
  field: 'usl' | 'lsl' | 'target';
  value: string;
  checked: boolean;
  placeholder: string;
  onVisibilityChange: (field: 'usl' | 'lsl' | 'target', checked: boolean) => void;
  onInputChange: (field: 'usl' | 'lsl' | 'target', value: string) => void;
  cs: SpecsPopoverColorScheme;
}

const SpecRow = ({
  label,
  field,
  value,
  checked,
  placeholder,
  onVisibilityChange,
  onInputChange,
  cs,
}: SpecRowProps) => (
  <div className="flex items-center gap-2">
    <label htmlFor={`specpop-${field}`} className="flex items-center gap-2 flex-1 cursor-pointer">
      <input
        id={`specpop-${field}`}
        name={`specpop-${field}`}
        type="checkbox"
        checked={checked}
        onChange={e => onVisibilityChange(field, e.target.checked)}
        className={cs.checkbox}
      />
      <span className={cs.checkboxLabel}>{label}</span>
    </label>
    <input
      id={`specpop-${field}-value`}
      name={`specpop-${field}-value`}
      type="number"
      step="any"
      value={value}
      onChange={e => onInputChange(field, e.target.value)}
      disabled={!checked}
      placeholder={placeholder}
      className={`${cs.input} ${!checked ? cs.inputDisabled : ''}`}
    />
  </div>
);

export const specsPopoverDefaultColorScheme: SpecsPopoverColorScheme = {
  triggerActive: 'text-blue-400 hover:text-blue-300 hover:bg-surface-tertiary/50',
  triggerInactive: 'text-content-secondary hover:text-content hover:bg-surface-tertiary/50',
  popoverContainer:
    'fixed w-64 bg-surface-secondary border border-edge rounded-lg shadow-2xl z-50 animate-fade-in',
  headerBorder: 'flex items-center justify-between px-3 py-2 border-b border-edge',
  headerText: 'text-xs font-semibold text-content-secondary uppercase tracking-wider',
  advancedButton: 'p-1 text-content-muted hover:text-content rounded transition-colors',
  checkbox:
    'w-4 h-4 rounded border-edge-secondary bg-surface text-blue-500 focus:ring-blue-500 focus:ring-offset-surface-secondary',
  checkboxLabel: 'text-sm text-content w-14',
  input:
    'w-24 bg-surface-tertiary border border-edge-secondary rounded px-2 py-1.5 text-sm text-content text-right outline-none focus:border-blue-500 transition-colors',
  inputDisabled: 'opacity-50 cursor-not-allowed',
  applyActive: 'bg-blue-600 hover:bg-blue-500 text-white',
  applyDisabled: 'bg-surface-tertiary text-content-muted cursor-not-allowed',
};

interface SpecVisibility {
  usl: boolean;
  lsl: boolean;
  target: boolean;
}

const SpecsPopover: React.FC<SpecsPopoverProps> = ({
  specs,
  onSave,
  onOpenAdvanced,
  cpkTarget,
  onCpkTargetChange,
  className = '',
  colorScheme = specsPopoverDefaultColorScheme,
}) => {
  const { t } = useTranslation();
  const cs = colorScheme;
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
  const [localCpkTarget, setLocalCpkTarget] = useState(cpkTarget?.toString() || '1.33');
  const [cpkTargetEnabled, setCpkTargetEnabled] = useState(cpkTarget !== undefined);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Sync local state when specs change from outside
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing local form state from external spec prop changes
    setLocalSpecs({
      usl: specs.usl?.toString() || '',
      lsl: specs.lsl?.toString() || '',
      target: specs.target?.toString() || '',
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing local form state from external spec prop changes
    setVisibility({
      usl: specs.usl !== undefined,
      lsl: specs.lsl !== undefined,
      target: specs.target !== undefined,
    });
  }, [specs]);

  // Sync cpkTarget local state when prop changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing local form state from external cpkTarget prop changes
    setLocalCpkTarget(cpkTarget?.toString() || '1.33');
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing local form state from external cpkTarget prop changes
    setCpkTargetEnabled(cpkTarget !== undefined);
  }, [cpkTarget]);

  // Derived: track whether local form differs from props
  const hasChanges = useMemo(() => {
    const newSpecs = {
      usl: visibility.usl && localSpecs.usl ? parseFloat(localSpecs.usl) : undefined,
      lsl: visibility.lsl && localSpecs.lsl ? parseFloat(localSpecs.lsl) : undefined,
      target: visibility.target && localSpecs.target ? parseFloat(localSpecs.target) : undefined,
    };
    const specsChanged =
      newSpecs.usl !== specs.usl || newSpecs.lsl !== specs.lsl || newSpecs.target !== specs.target;
    const newCpkValue = cpkTargetEnabled && localCpkTarget ? parseFloat(localCpkTarget) : undefined;
    const cpkChanged = newCpkValue !== cpkTarget;
    return specsChanged || cpkChanged;
  }, [localSpecs, visibility, specs, localCpkTarget, cpkTargetEnabled, cpkTarget]);

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
      const popoverWidth = 256; // w-64
      const padding = 8;
      const maxLeft = window.innerWidth - popoverWidth - padding;
      setPosition({
        top: rect.bottom + 8,
        left: Math.min(rect.left, maxLeft),
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
    if (onCpkTargetChange) {
      const newCpkValue =
        cpkTargetEnabled && localCpkTarget ? parseFloat(localCpkTarget) : undefined;
      onCpkTargetChange(newCpkValue !== undefined && !isNaN(newCpkValue) ? newCpkValue : undefined);
    }
    setIsOpen(false);
  }, [localSpecs, visibility, onSave, onCpkTargetChange, cpkTargetEnabled, localCpkTarget]);

  const handleInputChange = (field: 'usl' | 'lsl' | 'target', value: string) => {
    setLocalSpecs(prev => ({ ...prev, [field]: value }));
  };

  const handleVisibilityChange = (field: 'usl' | 'lsl' | 'target', checked: boolean) => {
    setVisibility(prev => ({ ...prev, [field]: checked }));
  };

  // Determine button label
  const hasAnySpec =
    specs.usl !== undefined ||
    specs.lsl !== undefined ||
    specs.target !== undefined ||
    cpkTarget !== undefined;
  const buttonLabel = hasAnySpec ? 'Specs' : '+ Specs';

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Edit specifications"
        className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
          hasAnySpec ? cs.triggerActive : cs.triggerInactive
        }`}
      >
        {buttonLabel}
        <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          className={cs.popoverContainer}
          style={{
            top: position.top,
            left: position.left,
          }}
        >
          {/* Header */}
          <div className={cs.headerBorder}>
            <h4 className={cs.headerText}>{t('specs.title')}</h4>
            {onOpenAdvanced && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenAdvanced();
                }}
                className={cs.advancedButton}
                title={t('specs.advancedSettings')}
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
              onVisibilityChange={handleVisibilityChange}
              onInputChange={handleInputChange}
              cs={cs}
            />
            <SpecRow
              label="Target"
              field="target"
              value={localSpecs.target}
              checked={visibility.target}
              placeholder="Ideal"
              onVisibilityChange={handleVisibilityChange}
              onInputChange={handleInputChange}
              cs={cs}
            />
            <SpecRow
              label="LSL"
              field="lsl"
              value={localSpecs.lsl}
              checked={visibility.lsl}
              placeholder="Min"
              onVisibilityChange={handleVisibilityChange}
              onInputChange={handleInputChange}
              cs={cs}
            />

            {/* Cpk Target — process capability threshold (separate from product specs) */}
            {onCpkTargetChange && (
              <>
                <div className="border-t border-edge-secondary" />
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="specpop-cpktarget"
                    className="flex items-center gap-2 flex-1 cursor-pointer"
                  >
                    <input
                      id="specpop-cpktarget"
                      name="specpop-cpktarget"
                      type="checkbox"
                      checked={cpkTargetEnabled}
                      onChange={e => setCpkTargetEnabled(e.target.checked)}
                      className={cs.checkbox}
                    />
                    <span className={cs.checkboxLabel}>Cpk</span>
                  </label>
                  <input
                    id="specpop-cpktarget-value"
                    name="specpop-cpktarget-value"
                    type="number"
                    min="0.5"
                    max="3.0"
                    step="0.01"
                    value={localCpkTarget}
                    onChange={e => setLocalCpkTarget(e.target.value)}
                    disabled={!cpkTargetEnabled}
                    placeholder="1.33"
                    title="Industry standard: 1.33 (4σ), 1.67 (5σ), 2.00 (6σ)"
                    className={`${cs.input} ${!cpkTargetEnabled ? cs.inputDisabled : ''}`}
                  />
                </div>
              </>
            )}
          </div>

          {/* Apply Button */}
          <div className="px-3 pb-3">
            <button
              onClick={handleApply}
              disabled={!hasChanges}
              className={`w-full py-2 rounded text-sm font-medium transition-colors ${
                hasChanges ? cs.applyActive : cs.applyDisabled
              }`}
            >
              {hasChanges ? t('specs.apply') : t('specs.noChanges')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecsPopover;
