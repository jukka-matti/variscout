import React, { useMemo, useState } from 'react';
import { Group } from '@visx/group';
import { scaleBand, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { withParentSize } from '@visx/responsive';
import * as d3 from 'd3';
import { useData } from '../../context/DataContext';
import { useChartScale } from '../../hooks/useChartScale';
import AxisEditor from '../AxisEditor';
import ChartSourceBar, { getSourceBarHeight } from './ChartSourceBar';
import ChartSignature from './ChartSignature';
import { Edit2 } from 'lucide-react';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';

interface BoxplotProps {
    factor: string;
    parentWidth: number;
    parentHeight: number;
}

const BASE_MARGIN = { top: 20, right: 20, bottom: 60, left: 70 };

const Boxplot = ({ factor, parentWidth, parentHeight }: BoxplotProps) => {
    const sourceBarHeight = getSourceBarHeight();
    const margin = useMemo(() => ({
        ...BASE_MARGIN,
        bottom: BASE_MARGIN.bottom + sourceBarHeight
    }), [sourceBarHeight]);
    const {
        filteredData,
        outcome,
        filters,
        setFilters,
        columnAliases,
        setColumnAliases,
        valueLabels,
        setValueLabels,
        specs,
        displayOptions
    } = useData();
    const [isEditingLabel, setIsEditingLabel] = useState(false);
    const {
        tooltipData,
        tooltipLeft,
        tooltipTop,
        tooltipOpen,
        showTooltip,
        hideTooltip,
    } = useTooltip<any>();

    const data = useMemo(() => {
        if (!outcome) return [];
        const groups = d3.group(filteredData, (d: any) => d[factor]);
        return Array.from(groups, ([key, values]) => {
            const v = values.map((d: any) => Number(d[outcome])).filter(val => !isNaN(val)).sort(d3.ascending);
            if (v.length === 0) return null;
            const q1 = d3.quantile(v, 0.25) || 0;
            const median = d3.quantile(v, 0.5) || 0;
            const q3 = d3.quantile(v, 0.75) || 0;
            const iqr = q3 - q1;
            const min = Math.max(v[0], q1 - 1.5 * iqr);
            const max = Math.min(v[v.length - 1], q3 + 1.5 * iqr);
            return { key, q1, median, q3, min, max, outliers: v.filter(x => x < min || x > max) };
        }).filter(d => d !== null) as any[];
    }, [filteredData, factor, outcome]);

    const width = Math.max(0, parentWidth - margin.left - margin.right);
    const height = Math.max(0, parentHeight - margin.top - margin.bottom);

    const xScale = useMemo(() => scaleBand({
        range: [0, width],
        domain: data.map(d => d.key),
        padding: 0.4
    }), [data, width]);

    const { min, max } = useChartScale();

    const yScale = useMemo(() => {
        return scaleLinear({
            range: [height, 0],
            domain: [min, max],
            nice: true
        });
    }, [height, min, max]);

    const handleBoxClick = (key: string) => {
        const currentFilters = filters[factor] || [];
        const newFilters = currentFilters.includes(key)
            ? currentFilters.filter(v => v !== key)
            : [...currentFilters, key];

        setFilters({ ...filters, [factor]: newFilters });
    };

    const handleSaveAlias = (newAlias: string, newValueLabels?: Record<string, string>) => {
        setColumnAliases({
            ...columnAliases,
            [factor]: newAlias
        });
        if (newValueLabels) {
            setValueLabels({
                ...valueLabels,
                [factor]: newValueLabels
            });
        }
    };

    if (!outcome || data.length === 0) return null;

    const alias = columnAliases[factor] || factor;
    const factorLabels = valueLabels[factor] || {};

    const xParams = {
        label: alias,
        x: width / 2,
        y: height + 50
    };

    return (
        <div className="relative w-full h-full">
            <svg width={parentWidth} height={parentHeight}>
                <Group left={margin.left} top={margin.top}>
                    {/* Spec Lines */}
                    {(displayOptions.showSpecs !== false) && specs && (
                        <>
                            {specs.usl !== undefined && (
                                <line
                                    x1={0} x2={width}
                                    y1={yScale(specs.usl)} y2={yScale(specs.usl)}
                                    stroke="#ef4444" strokeWidth={2} strokeDasharray="4,4"
                                />
                            )}
                            {specs.lsl !== undefined && (
                                <line
                                    x1={0} x2={width}
                                    y1={yScale(specs.lsl)} y2={yScale(specs.lsl)}
                                    stroke="#ef4444" strokeWidth={2} strokeDasharray="4,4"
                                />
                            )}
                            {specs.target !== undefined && (
                                <line
                                    x1={0} x2={width}
                                    y1={yScale(specs.target)} y2={yScale(specs.target)}
                                    stroke="#22c55e" strokeWidth={1} strokeDasharray="4,4"
                                />
                            )}
                        </>
                    )}
                    {data.map((d: any, i: number) => {
                        const x = xScale(d.key) || 0;
                        const barWidth = xScale.bandwidth();
                        const isSelected = (filters[factor] || []).includes(d.key);
                        const opacity = filters[factor] && filters[factor].length > 0 && !isSelected ? 0.3 : 1;

                        return (
                            <Group
                                key={i}
                                onClick={() => handleBoxClick(d.key)}
                                onMouseOver={(event) => {
                                    const coords = { x: event.clientX, y: event.clientY }; // localPoint might be better but let's try client first
                                    showTooltip({
                                        tooltipLeft: x + barWidth,
                                        tooltipTop: yScale(d.median),
                                        tooltipData: d
                                    });
                                }}
                                onMouseLeave={hideTooltip}
                                className="cursor-pointer"
                                opacity={opacity}
                            >
                                {/* Transparent capture rect for better clickability */}
                                <rect
                                    x={x - 5}
                                    y={0}
                                    width={barWidth + 10}
                                    height={height}
                                    fill="transparent"
                                />

                                {/* Whisker Line */}
                                <line
                                    x1={x + barWidth / 2}
                                    x2={x + barWidth / 2}
                                    y1={yScale(d.min)}
                                    y2={yScale(d.max)}
                                    stroke="#94a3b8"
                                    strokeWidth={1}
                                />

                                {/* Box */}
                                <rect
                                    x={x}
                                    y={yScale(d.q3)}
                                    width={barWidth}
                                    height={Math.abs(yScale(d.q1) - yScale(d.q3))}
                                    fill="#007FBD"
                                    stroke="#005a8c"
                                    rx={2}
                                />

                                {/* Median Line */}
                                <line
                                    x1={x}
                                    x2={x + barWidth}
                                    y1={yScale(d.median)}
                                    y2={yScale(d.median)}
                                    stroke="#FF8213"
                                    strokeWidth={2}
                                />

                                {/* Outliers */}
                                {d.outliers.map((o: number, j: number) => (
                                    <circle
                                        key={j}
                                        cx={x + barWidth / 2}
                                        cy={yScale(o)}
                                        r={3}
                                        fill="#ef4444"
                                        opacity={0.6}
                                    />
                                ))}
                            </Group>
                        );
                    })}
                    <AxisLeft
                        scale={yScale}
                        stroke="#94a3b8"
                        tickStroke="#94a3b8"
                        label=""
                        tickLabelProps={() => ({
                            fill: '#cbd5e1', fontSize: 11, textAnchor: 'end', dx: -4, dy: 3, fontFamily: 'monospace'
                        })}
                    />

                    {/* Interactive Y-Axis Label */}
                    <Group
                        onClick={() => setIsEditingLabel(true)}
                        className="cursor-pointer group/label"
                    >
                        <text
                            x={-50}
                            y={height / 2}
                            transform={`rotate(-90 -50 ${height / 2})`}
                            textAnchor="middle"
                            fill="#cbd5e1"
                            fontSize={13}
                            fontWeight={500}
                            className="group-hover/label:fill-blue-400 transition-colors"
                        >
                            {columnAliases[outcome] || outcome}
                        </text>
                        {/* Edit Icon */}
                        <foreignObject
                            x={-58}
                            y={height / 2 + 10}
                            width={16}
                            height={16}
                            transform={`rotate(-90 -50 ${height / 2})`}
                            className="opacity-0 group-hover/label:opacity-100 transition-opacity"
                        >
                            <div className="flex items-center justify-center text-blue-400">
                                <Edit2 size={14} />
                            </div>
                        </foreignObject>
                    </Group>

                    <AxisBottom
                        top={height}
                        scale={xScale}
                        stroke="#94a3b8"
                        tickStroke="#94a3b8"
                        label={''} // Custom Label below
                        tickFormat={val => factorLabels[val] || val}
                        tickLabelProps={() => ({
                            fill: '#94a3b8',
                            fontSize: 11,
                            textAnchor: 'middle',
                            dy: 2,
                        })}
                    />

                    {/* Custom Clickable Axis Label */}
                    <Group
                        onClick={() => setIsEditingLabel(true)}
                        className="cursor-pointer group/label2"
                    >
                        <text
                            x={xParams.x}
                            y={xParams.y}
                            textAnchor="middle"
                            fill="#94a3b8"
                            fontSize={13}
                            fontWeight={500}
                            className="group-hover/label2:fill-blue-400 transition-colors"
                        >
                            {xParams.label}
                        </text>
                        <foreignObject
                            x={xParams.x + 8}
                            y={xParams.y - 12}
                            width={16}
                            height={16}
                            className="opacity-0 group-hover/label2:opacity-100 transition-opacity"
                        >
                            <div className="flex items-center justify-center text-blue-400">
                                <Edit2 size={14} />
                            </div>
                        </foreignObject>
                    </Group>

                    {/* Signature (painter-style branding) */}
                    <ChartSignature
                        x={width - 10}
                        y={height + BASE_MARGIN.bottom - 40}
                    />

                    {/* Source Bar (branding) */}
                    <ChartSourceBar
                        width={width}
                        top={height + BASE_MARGIN.bottom - 22}
                        n={filteredData.length}
                    />
                </Group>
            </svg>

            {/* In-Place Label Editor Popover */}
            {isEditingLabel && (
                <AxisEditor
                    title="Edit Axis & Categorles"
                    originalName={factor}
                    alias={alias}
                    values={data.map(d => d.key)}
                    valueLabels={factorLabels}
                    onSave={handleSaveAlias}
                    onClose={() => setIsEditingLabel(false)}
                    style={{ bottom: 10, left: margin.left + width / 2 - 120 }}
                />
            )}
        </div>
    );
};

export default withParentSize(Boxplot);
