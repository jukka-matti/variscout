import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Dashboard from '../Dashboard';
import { DataProvider } from '../../context/DataContext';
import * as DataContextModule from '../../context/DataContext'; // Import entire module

// Mock the Visual Charts
vi.mock('../charts/IChart', () => ({ default: () => <div data-testid="i-chart">I-Chart Mock</div> }));
vi.mock('../charts/Boxplot', () => ({ default: () => <div data-testid="boxplot">Boxplot Mock</div> }));
vi.mock('../charts/ParetoChart', () => ({ default: () => <div data-testid="pareto-chart">Pareto Mock</div> }));

describe('Dashboard Component - Empty State', () => {
    it('should render nothing when no outcome is selected', () => {
        render(
            <DataProvider>
                <Dashboard />
            </DataProvider>
        );
        expect(screen.queryByText('Analysis Summary')).toBeNull();
    });
});

describe('Dashboard Component - With Data', () => {
    it('should render analysis summary and charts', () => {
        // Spy on useData to return mocked data
        vi.spyOn(DataContextModule, 'useData').mockReturnValue({
            outcome: 'Diameter',
            factors: ['Machine'],
            timeColumn: null,
            stats: {
                mean: 10, stdDev: 1, ucl: 13, lcl: 7,
                cp: 1.0, cpk: 1.0, outOfSpecPercentage: 5.5
            },
            specs: { usl: 13, lsl: 7 },
            filteredData: [
                { Diameter: 10, Machine: 'Machine A' }, { Diameter: 11, Machine: 'Machine A' }, { Diameter: 10.5, Machine: 'Machine A' },
                { Diameter: 9, Machine: 'Machine B' }, { Diameter: 9.5, Machine: 'Machine B' },
                { Diameter: 12, Machine: 'Machine C' }
            ],
            filters: {},
            grades: [],
            rawData: [],
            setRawData: vi.fn(),
            setOutcome: vi.fn(),
            setFactors: vi.fn(),
            setSpecs: vi.fn(),
            setGrades: vi.fn(),
            axisSettings: {},
            setAxisSettings: vi.fn(),
            setFilters: vi.fn(),
            displayOptions: { showCp: false, showCpk: true },
            setDisplayOptions: vi.fn(),
            // Persistence properties
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
        });

        render(<Dashboard />);

        expect(screen.getByText('I-Chart: Diameter')).toBeInTheDocument();
        expect(screen.getByText('Summary')).toBeInTheDocument(); // Tab button
        expect(screen.getByText('Histogram')).toBeInTheDocument(); // Tab button
        expect(screen.getByText('5.5%')).toBeInTheDocument();
        expect(screen.getByTestId('i-chart')).toBeInTheDocument();
        expect(screen.getByTestId('boxplot')).toBeInTheDocument();
        expect(screen.getByTestId('pareto-chart')).toBeInTheDocument();

        vi.restoreAllMocks();
    });
});
