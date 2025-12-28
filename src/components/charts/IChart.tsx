import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Group } from '@visx/group';
import { LinePath, Circle } from '@visx/shape';
import { scaleLinear, scaleTime } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows, GridColumns } from '@visx/grid';
import { withParentSize } from '@visx/responsive';
import { useData } from '../../context/DataContext';
import { useChartScale } from '../../hooks/useChartScale';
import { Edit2, RotateCcw, Check, X } from 'lucide-react';
import AxisEditor from '../AxisEditor';
import ChartSourceBar, { getSourceBarHeight } from './ChartSourceBar';
import ChartSignature from './ChartSignature';

interface IChartProps {
    parentWidth: number;
    parentHeight: number;
}

const BASE_MARGIN = { top: 40, right: 60, bottom: 60, left: 70 };

const IChart = ({ parentWidth, parentHeight }: IChartProps) => {
    const sourceBarHeight = getSourceBarHeight();
    const margin = useMemo(() => ({
        ...BASE_MARGIN,
        bottom: BASE_MARGIN.bottom + sourceBarHeight
    }), [sourceBarHeight]);
    const {
        filteredData,
        outcome,
        timeColumn,
        stats,
        specs,
        grades,
        axisSettings,
        setAxisSettings,
        columnAliases,
        setColumnAliases,
        displayOptions
    } = useData();
    const [isEditingScale, setIsEditingScale] = useState(false);
    const [isEditingLabel, setIsEditingLabel] = useState(false);
    const [tempMin, setTempMin] = useState<string>('');
    const [tempMax, setTempMax] = useState<string>('');

    const width = Math.max(0, parentWidth - margin.left - margin.right);
    const height = Math.max(0, parentHeight - margin.top - margin.bottom);

    const data = useMemo(() => {
        if (!outcome) return [];
        return filteredData.map((d: any, i: number) => ({
            x: timeColumn ? new Date(d[timeColumn]) : i,
            y: Number(d[outcome])
        })).filter((d: any) => !isNaN(d.y));
    }, [filteredData, outcome, timeColumn]);

    const xScale = useMemo(() => {
        if (timeColumn) {
            return scaleTime({
                range: [0, width],
                domain: [
                    Math.min(...data.map((d: any) => (d.x as Date).getTime())),
                    Math.max(...data.map((d: any) => (d.x as Date).getTime()))
                ]
            });
        }
        return scaleLinear({
            range: [0, width],
            domain: [0, data.length - 1]
        });
    }, [data, width, timeColumn]);

    // Use existing hook for scale limits
    const { min, max } = useChartScale();

    const yScale = useMemo(() => {
        return scaleLinear({
            range: [height, 0],
            domain: [min, max],
            nice: true
        });
    }, [height, min, max]);

    // Initialize temp values when entering edit mode
    useEffect(() => {
        if (isEditingScale) {
            setTempMin(axisSettings.min !== undefined ? axisSettings.min.toString() : min.toFixed(2));
            setTempMax(axisSettings.max !== undefined ? axisSettings.max.toString() : max.toFixed(2));
        }
    }, [isEditingScale, axisSettings, min, max]);

    const handleSaveAxis = () => {
        setAxisSettings({
            min: tempMin ? parseFloat(tempMin) : undefined,
            max: tempMax ? parseFloat(tempMax) : undefined
        });
        setIsEditingScale(false);
    };

    const handleResetAxis = () => {
        setAxisSettings({});
        setIsEditingScale(false);
    };

    const handleSaveAlias = (newAlias: string) => {
        if (outcome) {
            setColumnAliases({
                ...columnAliases,
                [outcome]: newAlias
            });
        }
    };

    if (!outcome || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-slate-500 italic">
                No data available for I-Chart
            </div>
        );
    }

    // Helper to get color for a value
    const getPointColor = (val: number) => {
        if (grades && grades.length > 0) {
            const grade = grades.find(g => val <= g.max);
            if (!grade) return grades[grades.length - 1].color;
            return grade.color;
        }
        if ((specs.usl !== undefined && val > specs.usl) ||
            (specs.lsl !== undefined && val < specs.lsl)) {
            return "#ef4444";
        }
        return "#007FBD";
    };

    const yParams = {
        label: columnAliases[outcome] || outcome,
        x: -50, // Increased margin
        y: height / 2,
        rotation: -90
    };

    return (
        <div className="relative w-full h-full group">
            <svg width={parentWidth} height={parentHeight}>
                <Group left={margin.left} top={margin.top}>

                    {/* Grade Bands (Background) */}
                    {grades && grades.length > 0 && grades.map((grade, i) => {
                        const prevMax = i === 0 ? 0 : grades[i - 1].max;
                        if (grade.max > yScale.domain()[1] && prevMax > yScale.domain()[1]) return null;

                        const yTop = yScale(Math.min(grade.max, yScale.domain()[1]));
                        const yBottom = yScale(Math.max(prevMax, yScale.domain()[0]));
                        const bandHeight = Math.abs(yBottom - yTop);

                        if (bandHeight <= 0) return null;

                        return (
                            <rect
                                key={i}
                                x={0}
                                y={yTop}
                                width={width}
                                height={bandHeight}
                                fill={grade.color}
                                opacity={0.1}
                            />
                        );
                    })}

                    <GridRows scale={yScale} width={width} stroke="#1e293b" />
                    <GridColumns scale={xScale} height={height} stroke="#1e293b" />

                    {/* Spec Lines */}
                    {(displayOptions.showSpecs !== false) && (!grades || grades.length === 0) && specs.usl !== undefined && (
                        <line
                            x1={0} x2={width}
                            y1={yScale(specs.usl)} y2={yScale(specs.usl)}
                            stroke="#ef4444" strokeWidth={2} strokeDasharray="4,4"
                        />
                    )}
                    {(displayOptions.showSpecs !== false) && (!grades || grades.length === 0) && specs.lsl !== undefined && (
                        <line
                            x1={0} x2={width}
                            y1={yScale(specs.lsl)} y2={yScale(specs.lsl)}
                            stroke="#ef4444" strokeWidth={2} strokeDasharray="4,4"
                        />
                    )}
                    {(displayOptions.showSpecs !== false) && (!grades || grades.length === 0) && specs.target !== undefined && (
                        <line
                            x1={0} x2={width}
                            y1={yScale(specs.target)} y2={yScale(specs.target)}
                            stroke="#22c55e" strokeWidth={1} strokeDasharray="4,4"
                        />
                    )}

                    {/* Control Limits */}
                    {stats && (
                        <>
                            <line
                                x1={0} x2={width}
                                y1={yScale(stats.ucl)} y2={yScale(stats.ucl)}
                                stroke="#64748b" strokeWidth={1} strokeDasharray="4,4"
                            />
                            <line
                                x1={0} x2={width}
                                y1={yScale(stats.lcl)} y2={yScale(stats.lcl)}
                                stroke="#64748b" strokeWidth={1} strokeDasharray="4,4"
                            />
                            <line
                                x1={0} x2={width}
                                y1={yScale(stats.mean)} y2={yScale(stats.mean)}
                                stroke="#64748b" strokeWidth={1}
                            />
                        </>
                    )}

                    <LinePath
                        data={data}
                        x={d => xScale(d.x as any)}
                        y={d => yScale(d.y)}
                        stroke="#94a3b8"
                        strokeWidth={2}
                    />

                    {data.map((d: any, i: number) => (
                        <Circle
                            key={i}
                            cx={xScale(d.x as any)}
                            cy={yScale(d.y)}
                            r={4}
                            fill={getPointColor(d.y)}
                            stroke="#0f172a"
                            strokeWidth={1}
                        />
                    ))}

                    <AxisLeft
                        scale={yScale}
                        stroke="#94a3b8"
                        tickStroke="#94a3b8"
                        // Custom Label Handling
                        label={''}
                        tickLabelProps={() => ({
                            fill: '#cbd5e1',
                            fontSize: 11, // Increased from 10
                            textAnchor: 'end',
                            dx: -4,
                            dy: 4,
                            fontFamily: 'monospace'
                        })}
                    />

                    {/* Custom Clickable Axis Label Group */}
                    <Group
                        onClick={() => setIsEditingLabel(true)}
                        className="cursor-pointer group/label"
                    >
                        <text
                            x={yParams.x}
                            y={yParams.y}
                            transform={`rotate(${yParams.rotation} ${yParams.x} ${yParams.y})`}
                            textAnchor="middle"
                            fill="#cbd5e1"
                            fontSize={13} // Increased
                            fontWeight={500}
                            className="group-hover/label:fill-blue-400 transition-colors"
                        >
                            {yParams.label}
                        </text>
                        {/* Edit Icon (rotated to match text) */}
                        <foreignObject
                            x={yParams.x - 8}
                            y={yParams.y + 10} // Adjusted for rotation
                            width={16}
                            height={16}
                            transform={`rotate(${yParams.rotation} ${yParams.x} ${yParams.y})`}
                            className="opacity-0 group-hover/label:opacity-100 transition-opacity"
                        >
                            <div className="flex items-center justify-center text-blue-400">
                                <Edit2 size={14} />
                            </div>
                        </foreignObject>
                    </Group>

                    {/* Interactive Scale Overlay (ticks area) */}
                    <rect
                        x={-margin.left + 20}
                        y={0}
                        width={30}
                        height={height}
                        fill="transparent"
                        className="cursor-pointer hover:fill-blue-500/10 transition-colors"
                        onClick={() => setIsEditingScale(true)}
                    >
                        <title>Click to edit scale</title>
                    </rect>

                    <AxisBottom
                        top={height}
                        scale={xScale}
                        stroke="#94a3b8"
                        tickStroke="#94a3b8"
                        numTicks={width > 500 ? 10 : 5}
                        label={timeColumn ? "Time" : "Sequence"}
                        labelProps={{
                            fill: '#cbd5e1',
                            fontSize: 12,
                            textAnchor: 'middle',
                        }}
                        tickLabelProps={() => ({
                            fill: '#cbd5e1',
                            fontSize: 10,
                            textAnchor: 'middle',
                            dy: 2,
                        })}
                    />

                    {/* Signature (painter-style branding) */}
                    <ChartSignature
                        x={width - 10}
                        y={height + BASE_MARGIN.bottom - 40}
                    />

                    {/* Source Bar (branding) */}
                    <ChartSourceBar
                        width={width}
                        top={height + BASE_MARGIN.bottom - 22}
                        n={data.length}
                    />
                </Group>
            </svg>

            {/* In-Place Scale Editor Popover */}
            {isEditingScale && (
                <div
                    className="absolute z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-xl p-3 flex flex-col gap-3 w-40"
                    style={{ top: margin.top, left: 10 }}
                >
                    <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                        <span className="text-xs font-bold text-white flex items-center gap-1">
                            <Edit2 size={12} /> Edit Scale
                        </span>
                        <button onClick={() => setIsEditingScale(false)} className="text-slate-400 hover:text-white">
                            <X size={14} />
                        </button>
                    </div>
                    <div className="space-y-2">
                        <div>
                            <label className="text-[10px] text-slate-400 uppercase">Max</label>
                            <input
                                type="number"
                                value={tempMax}
                                onChange={(e) => setTempMax(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-400 uppercase">Min</label>
                            <input
                                type="number"
                                value={tempMin}
                                onChange={(e) => setTempMin(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                        <button
                            onClick={handleResetAxis}
                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs py-1 rounded flex justify-center items-center gap-1"
                            title="Reset to Auto"
                        >
                            <RotateCcw size={10} /> Auto
                        </button>
                        <button
                            onClick={handleSaveAxis}
                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-1 rounded flex justify-center items-center gap-1"
                        >
                            <Check size={10} /> Set
                        </button>
                    </div>
                </div>
            )}

            {/* In-Place Label Editor Popover */}
            {isEditingLabel && (
                <AxisEditor
                    title="Edit Axis Label"
                    originalName={outcome}
                    alias={columnAliases[outcome] || ''}
                    onSave={handleSaveAlias}
                    onClose={() => setIsEditingLabel(false)}
                    style={{ top: margin.top + height / 2 - 50, left: 10 }}
                />
            )}
        </div>
    );
};

export default withParentSize(IChart);
