import React from 'react';
import EditableChartTitle, { type EditableChartTitleProps } from './EditableChartTitle';

export interface ChartCardProps {
  /** Chart title (auto-generated default) */
  title: string;
  /** Optional icon component */
  icon?: React.ReactNode;

  /** Enable editable title functionality */
  editableTitle?: boolean;
  /** Custom title override (for editable mode) */
  customTitle?: string;
  /** Callback when title changes (for editable mode) */
  onTitleChange?: (title: string) => void;

  /** Controls to display on the right side */
  controls?: React.ReactNode;
  /** Action buttons (copy, maximize, etc.) */
  actions?: React.ReactNode;

  /** Chart content */
  children: React.ReactNode;

  /** Container className */
  className?: string;
  /** Card ID for copy/reference */
  id?: string;
  /** Click handler for embed mode */
  onClick?: () => void;
}

/**
 * Reusable chart card wrapper with consistent header layout.
 *
 * Layout:
 * ```
 * [Icon] [Title (editable?)] .......... [Controls] [Actions]
 * [Chart Content]
 * ```
 */
const ChartCard = ({
  title,
  icon,
  editableTitle = false,
  customTitle,
  onTitleChange,
  controls,
  actions,
  children,
  className = '',
  id,
  onClick,
}: ChartCardProps) => {
  const handleTitleChange = (newTitle: string) => {
    onTitleChange?.(newTitle);
  };

  return (
    <div
      id={id}
      onClick={onClick}
      className={`bg-surface-secondary border border-edge p-6 rounded-2xl shadow-xl shadow-black/20 flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4 gap-4">
        {/* Left: Icon + Title */}
        <div className="flex items-center gap-2">
          {icon && <span className="text-blue-400">{icon}</span>}
          {editableTitle && onTitleChange ? (
            <h2 className="text-xl font-bold text-white">
              <EditableChartTitle
                defaultTitle={title}
                value={customTitle || ''}
                onChange={handleTitleChange}
              />
            </h2>
          ) : (
            <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wider">
              {customTitle || title}
            </h3>
          )}
        </div>

        {/* Right: Controls + Actions */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {controls}
          {actions && (
            <div className="flex items-center gap-1 pl-2 border-l border-edge">{actions}</div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
};

export default ChartCard;
