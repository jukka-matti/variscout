import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';
import { DataProvider } from '../context/DataContext';

// Mock data for testing
export const mockData = [
  { id: 1, value: 10.5, farm: 'Farm A', grade: 'A' },
  { id: 2, value: 11.2, farm: 'Farm A', grade: 'A' },
  { id: 3, value: 9.8, farm: 'Farm B', grade: 'B' },
  { id: 4, value: 12.1, farm: 'Farm B', grade: 'A' },
  { id: 5, value: 10.0, farm: 'Farm C', grade: 'B' },
  { id: 6, value: 8.5, farm: 'Farm C', grade: 'C' },
  { id: 7, value: 11.5, farm: 'Farm A', grade: 'A' },
  { id: 8, value: 10.8, farm: 'Farm B', grade: 'A' },
];

export const mockSpecs = {
  usl: 13,
  lsl: 8,
};

export const mockStats = {
  mean: 10.55,
  stdDev: 1.1,
  ucl: 13.85,
  lcl: 7.25,
  cp: 1.5,
  cpk: 1.2,
  outOfSpecPercentage: 12.5,
};

// Default mock context values
export const defaultMockContext = {
  outcome: 'value',
  factors: ['farm'],
  timeColumn: null,
  stats: mockStats,
  specs: mockSpecs,
  filteredData: mockData,
  filters: {},
  grades: [],
  rawData: mockData,
  setRawData: vi.fn(),
  setOutcome: vi.fn(),
  setFactors: vi.fn(),
  setSpecs: vi.fn(),
  setGrades: vi.fn(),
  axisSettings: {},
  setAxisSettings: vi.fn(),
  setFilters: vi.fn(),
  displayOptions: { showCp: true, showCpk: true },
  setDisplayOptions: vi.fn(),
  currentProjectId: null,
  currentProjectName: null,
  hasUnsavedChanges: false,
  saveProject: vi.fn(),
  loadProject: vi.fn(),
  listProjects: vi.fn(),
  deleteProject: vi.fn(),
  renameProject: vi.fn(),
  exportProject: vi.fn(),
  importProject: vi.fn(),
  newProject: vi.fn(),
};

// Empty context for testing empty states
export const emptyMockContext = {
  ...defaultMockContext,
  outcome: '',
  factors: [],
  filteredData: [],
  rawData: [],
  stats: null,
};

// Render with DataProvider wrapper
export function renderWithContext(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, {
    wrapper: ({ children }) => <DataProvider>{children}</DataProvider>,
    ...options,
  });
}

// Create a mock useData function
export function createMockUseData(overrides = {}) {
  return {
    ...defaultMockContext,
    ...overrides,
  };
}

// Generate large mock data for performance testing
export function generateLargeDataset(rowCount: number) {
  const farms = ['Farm A', 'Farm B', 'Farm C', 'Farm D'];
  const grades = ['A', 'B', 'C'];

  return Array.from({ length: rowCount }, (_, i) => ({
    id: i + 1,
    value: 10 + Math.random() * 4 - 2, // 8-14 range
    farm: farms[i % farms.length],
    grade: grades[Math.floor(Math.random() * grades.length)],
  }));
}
