'use client';

import { useMemo } from 'react';
import {
    ComposedChart,
    Line,
    Area,
    Bar,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
} from 'recharts';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartConfig
} from "@/components/ui/chart";

export interface ChartSeries {
    key: string;
    label: string;
    color: string;
    type: 'line' | 'area' | 'bar' | 'scatter';
}

interface GenericChartProps {
    data: any[];
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

    const chartConfig = useMemo(() => {
        const config: ChartConfig = {};
        series.forEach(s => {
            config[s.key] = {
                label: s.label,
                color: s.color,
            };
        });
        return config;
    }, [series]);

    // Ensure data is sorted (Recharts prefers sorted data for x-axis mostly, but good practice)
    const processedData = useMemo(() => {
        if (!data) return [];
        return [...data]
            .filter(item => item[xKey] !== null && item[xKey] !== undefined)
            .sort((a, b) => {
                const dateA = new Date(a[xKey] as string | number | Date).getTime();
                const dateB = new Date(b[xKey] as string | number | Date).getTime();
                return dateA - dateB;
            });
    }, [data, xKey]);

    if (!processedData || processedData.length === 0) {
        return (
            <div className="flex items-center justify-center text-muted-foreground w-full" style={{ height }}>
                Pas de données
            </div>
        );
    }

    return (
        <ChartContainer config={chartConfig} className="w-full" style={{ height }}>
            <ComposedChart
                data={processedData}
                margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
            >
                {showAxes && (
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/30" />
                )}
                {showAxes && (
                    <XAxis
                        dataKey={xKey}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        tickFormatter={formatX}
                        className="text-muted-foreground text-xs"
                    />
                )}
                {showAxes && (
                    <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        tickFormatter={formatY}
                        className="text-muted-foreground text-xs"
                    />
                )}
                <ChartTooltip
                    cursor={false}
                    content={
                        <ChartTooltipContent
                            labelFormatter={(label) => formatX(label)}
                        />
                    }
                />

                {series.map((s) => {
                    if (s.type === 'area') {
                        return (
                            <Area
                                key={s.key}
                                type="monotone"
                                dataKey={s.key}
                                stroke={`var(--color-${s.key})`}
                                fill={`var(--color-${s.key})`}
                                fillOpacity={0.2}
                                strokeWidth={2}
                            />
                        );
                    }
                    if (s.type === 'bar') {
                        return (
                            <Bar
                                key={s.key}
                                dataKey={s.key}
                                fill={`var(--color-${s.key})`}
                                radius={[4, 4, 0, 0]}
                            />
                        );
                    }
                    if (s.type === 'scatter') {
                        return (
                            <Scatter
                                key={s.key}
                                dataKey={s.key}
                                fill={`var(--color-${s.key})`}
                            />
                        );
                    }
                    // Default to line
                    return (
                        <Line
                            key={s.key}
                            type="monotone"
                            dataKey={s.key}
                            stroke={`var(--color-${s.key})`}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4 }}
                        />
                    );
                })}
            </ComposedChart>
        </ChartContainer>
    );
}
