import React from 'react';
import { Palette, Lock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// Preset accent colors
const ACCENT_PRESETS = [
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Purple', hex: '#8b5cf6' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Teal', hex: '#14b8a6' },
  { name: 'Pink', hex: '#ec4899' },
] as const;

/**
 * Company color picker component
 * Allows licensed users to customize the accent/brand color
 */
export default function CompanyColorPicker() {
  const { theme, isThemingEnabled, setTheme } = useTheme();

  // Get current accent or default to blue
  const currentAccent = theme.companyAccent || '#3b82f6';

  // Show locked state for community users
  if (!isThemingEnabled) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-secondary/50 border border-edge/50">
        <Palette size={14} className="text-content-muted" />
        <span className="text-xs text-content-muted">Brand colors</span>
        <Lock size={12} className="text-content-muted ml-auto" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-content-secondary">Brand Color</span>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Preset colors */}
        {ACCENT_PRESETS.map(preset => (
          <button
            key={preset.name}
            onClick={() => setTheme({ companyAccent: preset.hex })}
            className={`w-7 h-7 rounded-full transition-all ${
              currentAccent.toLowerCase() === preset.hex.toLowerCase()
                ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-secondary'
                : 'hover:scale-110'
            }`}
            style={{ backgroundColor: preset.hex }}
            title={preset.name}
          />
        ))}

        {/* Custom color picker */}
        <label
          className={`relative w-7 h-7 rounded-full cursor-pointer overflow-hidden transition-all ${
            !ACCENT_PRESETS.some(p => p.hex.toLowerCase() === currentAccent.toLowerCase())
              ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-secondary'
              : 'hover:scale-110'
          }`}
          style={{ backgroundColor: currentAccent }}
          title="Custom color"
        >
          <input
            type="color"
            value={currentAccent}
            onChange={e => setTheme({ companyAccent: e.target.value })}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </label>

        {/* Reset button */}
        {theme.companyAccent && (
          <button
            onClick={() => setTheme({ companyAccent: undefined })}
            className="text-xs text-content-muted hover:text-content transition-colors ml-2"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
