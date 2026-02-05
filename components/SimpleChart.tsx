'use client';

import { useMemo } from 'react';
import { TickerData } from '@/lib/types';

interface ChartProps {
    data: TickerData[];
    type: 'candlestick' | 'line' | 'area' | 'bar';
    height?: number;
    color?: string;
    showAxes?: boolean;
}

interface Candle {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
}

export function SimpleChart({
    data,
    type,
    height = 300,
    color = '#3b82f6', // blue-500
    showAxes = true
}: ChartProps) {

    // 1. Process Data & Generate Candles if needed
    const processedData = useMemo(() => {
        if (!data || data.length === 0) return { points: [], candles: [] };

        // Sort by timestamp
        const sorted = [...data].sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        // Standardize points for Line/Area/Bar
        const points = sorted.map(d => ({
            timestamp: new Date(d.timestamp).getTime(),
            value: d.last
        }));

        // Generate Candles (Resample into max 50 buckets)
        const bucketCount = 50;
        const timeStart = points[0].timestamp;
        const timeEnd = points[points.length - 1].timestamp;
        const interval = (timeEnd - timeStart) / bucketCount;

        const candles: Candle[] = [];
        if (interval > 0) {
            for (let i = 0; i < bucketCount; i++) {
                const start = timeStart + (i * interval);
                const end = start + interval;
                const bucketData = points.filter(p => p.timestamp >= start && p.timestamp < end);

                if (bucketData.length > 0) {
                    const values = bucketData.map(d => d.value);
                    candles.push({
                        timestamp: start + (interval / 2), // Center timestamp
                        open: values[0],
                        close: values[values.length - 1],
                        high: Math.max(...values),
                        low: Math.min(...values)
                    });
                }
            }
        }

        return { points, candles };
    }, [data]);

    if (processedData.points.length === 0) {
        return <div className="flex items-center justify-center text-[var(--foreground-muted)] h-full">Pas de données</div>;
    }

    // 2. Calculate Scales
    const allValues = type === 'candlestick'
        ? processedData.candles.flatMap(c => [c.high, c.low])
        : processedData.points.map(p => p.value);

    const minVal = Math.min(...allValues);
    const maxVal = Math.max(...allValues);
    const range = maxVal - minVal || 1;
    const padding = range * 0.1; // 10% vertical padding

    const effectiveMin = minVal - padding;
    const effectiveMax = maxVal + padding;
    const effectiveRange = effectiveMax - effectiveMin;

    const width = 800; // API SVG coordinate space
    const chartHeight = 400;

    const getX = (timestamp: number) => {
        const start = processedData.points[0].timestamp;
        const end = processedData.points[processedData.points.length - 1].timestamp;
        const timeRange = end - start || 1;
        return ((timestamp - start) / timeRange) * width;
    };

    const getY = (val: number) => {
        return chartHeight - ((val - effectiveMin) / effectiveRange) * chartHeight;
    };

    // 3. Render Paths
    let svgContent;

    if (type === 'candlestick') {
        const candleWidth = (width / 50) * 0.7; // 70% of bucket width
        svgContent = processedData.candles.map((candle, i) => {
            const x = getX(candle.timestamp);
            const yHigh = getY(candle.high);
            const yLow = getY(candle.low);
            const yOpen = getY(candle.open);
            const yClose = getY(candle.close);
            const isGreen = candle.close >= candle.open;
            const candleColor = isGreen ? '#10b981' : '#ef4444'; // emerald-500 : red-500

            return (
                <g key={i}>
                    {/* Wick */}
                    <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={candleColor} strokeWidth="1" />
                    {/* Body */}
                    <rect
                        x={x - candleWidth / 2}
                        y={Math.min(yOpen, yClose)}
                        width={candleWidth}
                        height={Math.abs(yClose - yOpen) || 1}
                        fill={candleColor}
                    />
                </g>
            );
        });
    } else if (type === 'bar') {
        const barWidth = (width / processedData.points.length) * 0.8;
        svgContent = processedData.points.map((p, i) => {
            const x = getX(p.timestamp);
            const y = getY(p.value);
            const h = chartHeight - y;
            return (
                <rect key={i} x={x - barWidth / 2} y={y} width={barWidth} height={h} fill={color} opacity="0.7" />
            );
        });
    } else if (type === 'area') {
        const pointsStr = processedData.points.map(p => `${getX(p.timestamp)},${getY(p.value)}`).join(' ');
        const fillPath = `${pointsStr} ${width},${chartHeight} 0,${chartHeight}`;
        svgContent = (
            <>
                <defs>
                    <linearGradient id={`grad-${color}`} x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.5" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.0" />
                    </linearGradient>
                </defs>
                <path d={`M ${fillPath} Z`} fill={`url(#grad-${color})`} stroke="none" />
                <polyline points={pointsStr} fill="none" stroke={color} strokeWidth="2" />
            </>
        );
    } else { // Line
        const pointsStr = processedData.points.map(p => `${getX(p.timestamp)},${getY(p.value)}`).join(' ');
        svgContent = <polyline points={pointsStr} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />;
    }

    return (
        <div className="w-full relative" style={{ height }}>
            {/* Main Chart */}
            <svg
                viewBox={`0 0 ${width} ${chartHeight}`}
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
            >
                {/* Horizontal Grid */}
                {showAxes && [0, 0.25, 0.5, 0.75, 1].map(pct => (
                    <line
                        key={pct}
                        x1="0"
                        y1={chartHeight * pct}
                        x2={width}
                        y2={chartHeight * pct}
                        stroke="var(--border-color)"
                        strokeDasharray="4 4"
                    />
                ))}

                {svgContent}
            </svg>

            {/* Labels Overlay */}
            {showAxes && (
                <div className="absolute top-0 right-0 h-full flex flex-col justify-between text-xs text-[var(--foreground-muted)] pointer-events-none py-1">
                    <span>{effectiveMax.toLocaleString()}</span>
                    <span>{effectiveMin.toLocaleString()}</span>
                </div>
            )}
        </div>
    );
}
