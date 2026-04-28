/**
 * ProductionLineGlanceMigrationBanner — pure presentational banner.
 *
 * Surfaces unmapped (B0) investigations that won't appear in capability
 * views until mapped. Primary action opens the mapping modal. State
 * (count, dismissals) is owned by the consumer.
 *
 * See spec docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md
 * section "B0 migration UX".
 */
import React from 'react';

export interface ProductionLineGlanceMigrationBannerProps {
  /** Number of unmapped, non-dismissed investigations in this hub. */
  count: number;
  /** Click handler — opens the mapping modal. */
  onMapClick: () => void;
}

export const ProductionLineGlanceMigrationBanner: React.FC<
  ProductionLineGlanceMigrationBannerProps
> = ({ count, onMapClick }) => {
  if (count <= 0) return null;
  const isPlural = count !== 1;
  const message = isPlural
    ? `${count} investigations are not yet mapped to canonical map nodes. They won't appear in capability views until mapped.`
    : `1 investigation is not yet mapped to canonical map nodes. It won't appear in capability views until mapped.`;
  return (
    <div
      role="status"
      data-testid="production-line-glance-migration-banner"
      className="flex flex-wrap items-center justify-between gap-3 border-b border-edge bg-surface-secondary px-4 py-3"
    >
      <p className="text-sm text-content">{message}</p>
      <button
        type="button"
        onClick={onMapClick}
        className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
      >
        Map columns
      </button>
    </div>
  );
};

export default ProductionLineGlanceMigrationBanner;
