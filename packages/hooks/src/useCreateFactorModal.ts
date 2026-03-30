import { useState, useCallback } from 'react';
import { createFactorFromSelection, type DataRow } from '@variscout/core';

export interface UseCreateFactorModalOptions {
  rawData: DataRow[];
  selectedPoints: Set<number>;
  filters: Record<string, (string | number)[]>;
  setRawData: (data: DataRow[]) => void;
  setFilters: (filters: Record<string, (string | number)[]>) => void;
  clearSelection: () => void;
  /** Called after factor is created — use to auto-switch boxplot/pareto factor */
  onFactorCreated?: (factorName: string) => void;
}

export interface UseCreateFactorModalReturn {
  showCreateFactorModal: boolean;
  handleOpenCreateFactorModal: () => void;
  handleCloseCreateFactorModal: () => void;
  handleCreateFactor: (factorName: string) => void;
}

/**
 * Shared Create Factor modal state and handler logic for Dashboard components.
 * Manages modal visibility and factor creation from point selection.
 */
export function useCreateFactorModal({
  rawData,
  selectedPoints,
  filters,
  setRawData,
  setFilters,
  clearSelection,
  onFactorCreated,
}: UseCreateFactorModalOptions): UseCreateFactorModalReturn {
  const [showCreateFactorModal, setShowCreateFactorModal] = useState(false);

  const handleOpenCreateFactorModal = useCallback(() => {
    setShowCreateFactorModal(true);
  }, []);

  const handleCloseCreateFactorModal = useCallback(() => {
    setShowCreateFactorModal(false);
  }, []);

  const handleCreateFactor = useCallback(
    (factorName: string) => {
      const updatedData = createFactorFromSelection(rawData, selectedPoints, factorName);
      setRawData(updatedData);
      setFilters({ ...filters, [factorName]: [factorName] });
      onFactorCreated?.(factorName);
      clearSelection();
      setShowCreateFactorModal(false);
    },
    [rawData, selectedPoints, filters, setRawData, setFilters, clearSelection, onFactorCreated]
  );

  return {
    showCreateFactorModal,
    handleOpenCreateFactorModal,
    handleCloseCreateFactorModal,
    handleCreateFactor,
  };
}
