/**
 * RoleBadge — Dismissable pill showing an inferred factor role on ColumnCards.
 */

import React from 'react';
import { X } from 'lucide-react';
import type { FactorRole } from '@variscout/core';

export interface RoleBadgeProps {
  role: FactorRole;
  /** The keyword that triggered inference (for tooltip) */
  matchedKeyword: string;
  onDismiss: () => void;
}

const ROLE_BADGE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  equipment: { bg: 'bg-blue-900/30', text: 'text-blue-300', label: 'Equipment' },
  temporal: { bg: 'bg-purple-900/30', text: 'text-purple-300', label: 'Temporal' },
  operator: { bg: 'bg-green-900/30', text: 'text-green-300', label: 'Operator' },
  material: { bg: 'bg-amber-900/30', text: 'text-amber-300', label: 'Material' },
  location: { bg: 'bg-cyan-900/30', text: 'text-cyan-300', label: 'Location' },
  unknown: { bg: 'bg-slate-900/30', text: 'text-slate-300', label: 'Unknown' },
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, matchedKeyword, onDismiss }) => {
  const style = ROLE_BADGE_STYLES[role] || ROLE_BADGE_STYLES.unknown;

  return (
    <span
      className={`inline-flex items-center gap-1 h-6 px-2 rounded-full text-[10px] font-medium ${style.bg} ${style.text}`}
      data-testid={`role-badge-${role}`}
      title={matchedKeyword ? `Detected '${matchedKeyword}' in column name` : undefined}
    >
      {style.label}
      <button
        onClick={e => {
          e.stopPropagation();
          onDismiss();
        }}
        className="hover:opacity-70 transition-opacity"
        aria-label={`Dismiss ${style.label} role`}
        type="button"
      >
        <X size={10} />
      </button>
    </span>
  );
};

export default RoleBadge;
