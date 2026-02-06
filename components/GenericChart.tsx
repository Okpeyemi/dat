'use client';

import { useMemo, useState } from 'react';

export interface ChartSeries {
    key: string;
    label: string;
    color: string;
    type: 'line' | 'area' | 'bar' | 'scatter';
}

interface GenericChartProps {
    data: Record<string, any>[];
    xKey: string;
    series: ChartSeries[];
    height?: number;
    showAxes?: boolean;
    formatY?: (value: number) => string;
    formatX?: (value: string | number | Date) => string;
}

export function GenericChart({
    data,
    xKey,
    series,
    height = 300,
    showAxes = true,
    formatY = (v) => v.toLocaleString(),
    formatX = (v) => new Date(v).toLocaleDateString(),
}: GenericChartProps) {
    const width = 800; // SVG coordinate space
    const chartHeight = 400;

    const [activePoint, setActivePoint] = useState<any | null>(null);
    const [tooltipX, setTooltipX] = useState<number | null>(null);

    const processedData = useMemo(() => {
        if (!data || data.length === 0) return { points: [], minX: 0, maxX: 0, minY: 0, maxY: 0 };

        // Sort by X
        const sorted = [...data].sort((a, b) => new Date(a[xKey]).getTime() - new Date(b[xKey]).getTime());

        // Calculate min/max for X (time)
        const minX = new Date(sorted[0][xKey]).getTime();
        const maxX = new Date(sorted[sorted.length - 1][xKey]).getTime();

        // Calculate min/max for Y (all series)
        let allValues: number[] = [];
        series.forEach(s => {
            const seriesValues = sorted.map(d => d[s.key]).filter(v => v !== null && v !== undefined) as number[];
            allValues = allValues.concat(seriesValues);
        });

        if (allValues.length === 0) allValues = [0, 100];

        const minY = Math.min(...allValues);
        const maxY = Math.max(...allValues);

        return {
            points: sorted,
            minX,
            maxX,
            minY,
            maxY
        };
    }, [data, xKey, series]);

    if (processedData.points.length === 0) {
        return <div className="flex items-center justify-center text-[var(--foreground-muted)] w-full" style={{ height }}>Pas de données</div>;
    }

    // Scales
    const rangeX = processedData.maxX - processedData.minX || 1;

    // Add 10% padding to Y axis
    const paddingY = (processedData.maxY - processedData.minY) * 0.1 || 1;
    const effectiveMinY = processedData.minY - paddingY;
    const effectiveMaxY = processedData.maxY + paddingY;
    const rangeY = effectiveMaxY - effectiveMinY || 1;

    const getX = (val: string | number | Date) => {
        const timestamp = new Date(val).getTime();
        return ((timestamp - processedData.minX) / rangeX) * width;
    };

    const getY = (val: number) => {
        if (val === null || val === undefined) return null;
        return chartHeight - ((val - effectiveMinY) / rangeY) * chartHeight;
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!processedData.points.length) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;

        // Find closest point
        const totalWidth = rect.width;
        const xRatio = x / totalWidth;
        const targetXValue = processedData.minX + xRatio * rangeX;

        // Binary search or simple find for closest point
        // Given sorted data, we can just look for the closest timestamp
        let closest = processedData.points[0];
        let minDiff = Math.abs(new Date(closest[xKey]).getTime() - targetXValue);

        for (const p of processedData.points) {
            const diff = Math.abs(new Date(p[xKey]).getTime() - targetXValue);
            if (diff < minDiff) {
                minDiff = diff;
                closest = p;
            }
        }

        setActivePoint(closest);
        setTooltipX(getX(closest[xKey]));
    };

    const handleMouseLeave = () => {
        setActivePoint(null);
        setTooltipX(null);
    };

    return (
        <div
            className="w-full relative select-none"
            style={{ height }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <svg
                viewBox={`0 0 ${width} ${chartHeight}`}
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
            >
                {/* Grid & Axes */}
                {showAxes && (
                    <g className="grid-lines opacity-20">
                        {[0, 0.25, 0.5, 0.75, 1].map(pct => (
                            <line
                                key={pct}
                                x1="0"
                                y1={chartHeight * pct}
                                x2={width}
                                y2={chartHeight * pct}
                                stroke="var(--foreground-default)"
                                strokeWidth="1"
                                strokeDasharray="4 4"
                            />
                        ))}
                    </g>
                )}

                {/* Series */}
                {series.map((s) => {
                    if (s.type === 'line' || s.type === 'area') {
                        const pathData = processedData.points
                            .map(d => {
                                const x = getX(d[xKey]);
                                const y = getY(d[s.key]);
                                return y !== null ? `${x},${y}` : null;
                            })
                            .filter(p => p !== null)
                            .join(' ');

                        if (!pathData) return null;

                        return (
                            <g key={s.key}>
                                {s.type === 'area' && (
                                    <>
                                        <defs>
                                            <linearGradient id={`grad-${s.key}`} x1="0" x2="0" y1="0" y2="1">
                                                <stop offset="0%" stopColor={s.color} stopOpacity="0.4" />
                                                <stop offset="100%" stopColor={s.color} stopOpacity="0.0" />
                                            </linearGradient>
                                        </defs>
                                        <path
                                            d={`M ${pathData} L ${width},${chartHeight} L 0,${chartHeight} Z`}
                                            fill={`url(#grad-${s.key})`}
                                            stroke="none"
                                        />
                                    </>
                                )}
                                <polyline
                                    points={pathData}
                                    fill="none"
                                    stroke={s.color}
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </g>
                        );
                    } else if (s.type === 'bar') {
                        const barWidth = (width / processedData.points.length) * 0.8;
                        return (
                            <g key={s.key}>
                                {processedData.points.map((d, i) => {
                                    const val = d[s.key];
                                    if (val === null || val === undefined) return null;
                                    const x = getX(d[xKey]);
                                    const y = getY(val) as number;
                                    const h = chartHeight - y;
                                    return (
                                        <rect
                                            key={i}
                                            x={x - barWidth / 2}
                                            y={y}
                                            width={barWidth}
                                            height={h}
                                            fill={s.color}
                                            opacity={activePoint === d ? 1 : 0.8}
                                            rx="2"
                                        />
                                    );
                                })}
                            </g>
                        )
                    } else if (s.type === 'scatter') {
                        return (
                            <g key={s.key}>
                                {processedData.points.map((d, i) => {
                                    const val = d[s.key];
                                    if (val === null || val === undefined) return null;
                                    const x = getX(d[xKey]);
                                    const y = getY(val) as number;
                                    return (
                                        <circle
                                            key={i}
                                            cx={x}
                                            cy={y}
                                            r={activePoint === d ? 5 : 3}
                                            fill={s.color}
                                            stroke={activePoint === d ? 'var(--background-card)' : 'none'}
                                            strokeWidth={activePoint === d ? 2 : 0}
                                        />
                                    );
                                })}
                            </g>
                        )
                    }
                    return null;
                })}

                {/* Interactive Elements Overlay */}
                {activePoint && tooltipX !== null && (
                    <g className="interactions pointer-events-none">
                        {/* Crosshair Line */}
                        <line
                            x1={tooltipX}
                            y1={0}
                            x2={tooltipX}
                            y2={chartHeight}
                            stroke="var(--foreground-muted)"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                            opacity="0.5"
                        />

                        {/* Active Points for Line/Area series */}
                        {series.map(s => {
                            if (s.type === 'line' || s.type === 'area') {
                                const val = activePoint[s.key];
                                if (val === null || val === undefined) return null;
                                const y = getY(val);
                                return (
                                    <circle
                                        key={s.key}
                                        cx={tooltipX}
                                        cy={y!}
                                        r="4"
                                        fill={s.color}
                                        stroke="var(--background-card)"
                                        strokeWidth="2"
                                    />
                                );
                            }
                            return null;
                        })}
                    </g>
                )}
            </svg>

            {/* Labels Overlay */}
            {showAxes && (
                <div className="absolute top-0 right-0 h-full flex flex-col justify-between text-xs text-[var(--foreground-muted)] pointer-events-none py-1 pl-2 bg-[var(--background-primary)]/50 backdrop-blur-[1px]">
                    <span>{formatY(effectiveMaxY)}</span>
                    <span className="opacity-50">{formatY((effectiveMaxY + effectiveMinY) / 2)}</span>
                    <span>{formatY(effectiveMinY)}</span>
                </div>
            )}

            {/* Legend */}
            <div className="absolute top-2 left-2 flex gap-3 pointer-events-none">
                {series.map(s => (
                    <div key={s.key} className="flex items-center gap-1.5 text-xs bg-[var(--background-secondary)] px-2 py-1 rounded-md shadow-sm border border-[var(--border-color)]">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}></span>
                        <span className="font-medium text-[var(--foreground-default)]">{s.label}</span>
                    </div>
                ))}
            </div>

            {/* Tooltip */}
            {activePoint && tooltipX !== null && (
                <div
                    className="absolute z-10 bg-[var(--background-card)] border border-[var(--border-color)] shadow-xl rounded-lg p-3 text-sm pointer-events-none transition-all duration-75"
                    style={{
                        left: `${(tooltipX / width) * 100}%`,
                        top: 0,
                        transform: `translateX(${(tooltipX / width) > 0.5 ? '-100%' : '0'}) translateY(10px)`,
                        marginLeft: (tooltipX / width) > 0.5 ? '-10px' : '10px'
                    }}
                >
                    <p className="font-bold text-[var(--foreground-default)] mb-2 border-b border-[var(--border-color)] pb-1">
                        {formatX(activePoint[xKey])}
                    </p>
                    <div className="space-y-1">
                        {series.map(s => {
                            const val = activePoint[s.key];
                            if (val === null || val === undefined) return null;
                            return (
                                <div key={s.key} className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}></span>
                                    <span className="text-[var(--foreground-muted)]">{s.label}:</span>
                                    <span className="font-mono font-medium">
                                        {formatY(val)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
