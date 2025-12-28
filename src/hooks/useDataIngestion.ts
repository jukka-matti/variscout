import { useCallback } from 'react';
import { useData } from '../context/DataContext';
import { parseCSV, parseExcel, detectColumns } from '../logic/parser';
import { SampleDataset } from '../data/sampleData';

// Performance thresholds
const ROW_WARNING_THRESHOLD = 5000;
const ROW_HARD_LIMIT = 50000;

export const useDataIngestion = () => {
    const { setRawData, setOutcome, setFactors, setSpecs, setGrades, setFilters } = useData();

    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>): Promise<boolean> => {
        const file = e.target.files?.[0];
        if (!file) return false;

        let data: any[] = [];
        try {
            if (file.name.endsWith('.csv')) {
                data = await parseCSV(file);
            } else if (file.name.endsWith('.xlsx')) {
                data = await parseExcel(file);
            }

            if (data.length > 0) {
                // Check row limits for performance
                if (data.length > ROW_HARD_LIMIT) {
                    alert(`File too large (${data.length.toLocaleString()} rows). Maximum is ${ROW_HARD_LIMIT.toLocaleString()} rows.`);
                    return false;
                }
                if (data.length > ROW_WARNING_THRESHOLD) {
                    const proceed = window.confirm(
                        `Large dataset (${data.length.toLocaleString()} rows) may slow performance. Continue?`
                    );
                    if (!proceed) return false;
                }

                setRawData(data);
                const detected = detectColumns(data);
                if (detected.outcome) setOutcome(detected.outcome);
                if (detected.factors.length > 0) setFactors(detected.factors);
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error parsing file:", error);
            alert("Error parsing file. Please check format.");
            return false;
        }
    }, [setRawData, setOutcome, setFactors]);

    const loadSample = useCallback((sample: SampleDataset) => {
        setRawData(sample.data);
        setOutcome(sample.config.outcome);
        setFactors(sample.config.factors);
        setSpecs(sample.config.specs);
        setGrades(sample.config.grades || []);
    }, [setRawData, setOutcome, setFactors, setSpecs, setGrades]);

    const clearData = useCallback(() => {
        setRawData([]);
        setOutcome('');
        setFactors([]);
        setSpecs({});
        setGrades([]);
        setFilters({});
    }, [setRawData, setOutcome, setFactors, setSpecs, setGrades, setFilters]);

    return {
        handleFileUpload,
        loadSample,
        clearData
    };
};
