import { useState, useMemo } from 'react';

export interface UseDataTablePaginationReturn<T> {
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  needsPagination: boolean;
  pageData: T[];
}

/**
 * Manages pagination state for data tables.
 *
 * @param data - The full dataset to paginate
 * @param rowsPerPage - Number of rows to show per page
 */
export function useDataTablePagination<T>(
  data: T[],
  rowsPerPage: number
): UseDataTablePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = Math.ceil(data.length / rowsPerPage);
  const needsPagination = data.length > rowsPerPage;

  const pageData = useMemo(() => {
    if (!needsPagination) return data;
    const start = currentPage * rowsPerPage;
    return data.slice(start, start + rowsPerPage);
  }, [data, currentPage, rowsPerPage, needsPagination]);

  return { currentPage, setCurrentPage, totalPages, needsPagination, pageData };
}
