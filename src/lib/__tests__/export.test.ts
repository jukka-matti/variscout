import { describe, it, expect } from 'vitest';
import { getSpecStatus, generateCSV } from '../export';

describe('getSpecStatus', () => {
    it('returns PASS when value is within limits', () => {
        expect(getSpecStatus(10, { usl: 15, lsl: 5 })).toBe('PASS');
        expect(getSpecStatus(5, { usl: 15, lsl: 5 })).toBe('PASS');
        expect(getSpecStatus(15, { usl: 15, lsl: 5 })).toBe('PASS');
    });

    it('returns FAIL_USL when value exceeds upper limit', () => {
        expect(getSpecStatus(16, { usl: 15, lsl: 5 })).toBe('FAIL_USL');
        expect(getSpecStatus(100, { usl: 15, lsl: 5 })).toBe('FAIL_USL');
    });

    it('returns FAIL_LSL when value is below lower limit', () => {
        expect(getSpecStatus(4, { usl: 15, lsl: 5 })).toBe('FAIL_LSL');
        expect(getSpecStatus(-10, { usl: 15, lsl: 5 })).toBe('FAIL_LSL');
    });

    it('returns N/A when no specs are defined', () => {
        expect(getSpecStatus(10, {})).toBe('N/A');
        expect(getSpecStatus(10, { usl: undefined, lsl: undefined })).toBe('N/A');
    });

    it('handles one-sided specs correctly', () => {
        // Only USL
        expect(getSpecStatus(10, { usl: 15 })).toBe('PASS');
        expect(getSpecStatus(16, { usl: 15 })).toBe('FAIL_USL');

        // Only LSL
        expect(getSpecStatus(10, { lsl: 5 })).toBe('PASS');
        expect(getSpecStatus(4, { lsl: 5 })).toBe('FAIL_LSL');
    });
});

describe('generateCSV', () => {
    const testData = [
        { name: 'Item A', value: 10, category: 'Type 1' },
        { name: 'Item B', value: 20, category: 'Type 2' },
        { name: 'Item C', value: 15, category: 'Type 1' },
    ];

    it('generates valid CSV with headers', () => {
        const csv = generateCSV(testData, null, {});
        const lines = csv.split('\n');

        expect(lines[0]).toBe('row_number,name,value,category');
        expect(lines.length).toBe(4); // header + 3 data rows
    });

    it('includes row numbers when option is set', () => {
        const csv = generateCSV(testData, null, {}, { includeRowNumbers: true });
        const lines = csv.split('\n');

        expect(lines[0]).toContain('row_number');
        expect(lines[1].startsWith('1,')).toBe(true);
        expect(lines[2].startsWith('2,')).toBe(true);
        expect(lines[3].startsWith('3,')).toBe(true);
    });

    it('excludes row numbers when option is false', () => {
        const csv = generateCSV(testData, null, {}, { includeRowNumbers: false });
        const lines = csv.split('\n');

        expect(lines[0]).toBe('name,value,category');
        expect(lines[1]).toBe('Item A,10,Type 1');
    });

    it('includes spec status column when outcome is set', () => {
        const csv = generateCSV(testData, 'value', { usl: 18, lsl: 8 }, { includeSpecStatus: true });
        const lines = csv.split('\n');

        expect(lines[0]).toContain('spec_status');
        expect(lines[1]).toContain('PASS'); // value=10, within 8-18
        expect(lines[2]).toContain('FAIL_USL'); // value=20, above 18
        expect(lines[3]).toContain('PASS'); // value=15, within 8-18
    });

    it('escapes special characters correctly', () => {
        const dataWithSpecialChars = [
            { name: 'Item, with comma', value: 10, note: 'Has "quotes"' },
            { name: 'Normal item', value: 20, note: 'Line\nbreak' },
        ];

        const csv = generateCSV(dataWithSpecialChars, null, {}, { includeRowNumbers: false });
        const lines = csv.split('\n');

        // Comma should be quoted
        expect(lines[1]).toContain('"Item, with comma"');
        // Quotes should be escaped
        expect(lines[1]).toContain('"Has ""quotes"""');
    });

    it('handles empty data array', () => {
        const csv = generateCSV([], null, {});
        expect(csv).toBe('');
    });

    it('handles null and undefined values', () => {
        const dataWithNulls = [
            { name: 'Item A', value: null, category: undefined },
        ];

        const csv = generateCSV(dataWithNulls, null, {}, { includeRowNumbers: false });
        const lines = csv.split('\n');

        // Null/undefined should be empty string
        expect(lines[1]).toBe('Item A,,');
    });
});
