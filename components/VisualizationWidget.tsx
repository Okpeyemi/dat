'use client';

import { useEffect, useState } from 'react';
import { Card, LoadingSpinner, SimpleChart, ErrorDisplay, PlusIcon } from '@/components';
import { getTickerHistory, SYMBOL_TO_PAIR } from '@/lib/api';
import type { VisualizationParameter, TickerData, HistoryQueryParams } from '@/lib/types';

interface WidgetProps {
    config: VisualizationParameter;
}

export function VisualizationWidget({ config }: WidgetProps) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<TickerData[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            setLoading(true); // Don't reset data to keep prev view while loading if refreshing
            try {
                const pair = SYMBOL_TO_PAIR[config.crypto_symbol];
                if (!pair) throw new Error(`Paire introuvable pour ${config.crypto_symbol}`);

                const params: HistoryQueryParams = {
                    pair: pair,
                    periode: config.time_range as any
                };

                const res = await getTickerHistory(params);
                setData(res.data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erreur de chargement');
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [config]);

    // Determine color based on indicator or random logic (optional, keeping it simple mainly blue/purple)
    const chartColor = config.crypto_symbol === 'BTC' ? '#f59e0b' : // orange
        config.crypto_symbol === 'ETH' ? '#6366f1' : // indigo
            config.crypto_symbol === 'SOL' ? '#14f195' : // green
                '#3b82f6'; // blue default

    return (
        <Card title={config.name} subtitle={`${config.crypto_symbol} - ${config.time_range}`}>
            <div className="h-64 mt-2">
                {loading && data.length === 0 ? (
                    <LoadingSpinner size="md" />
                ) : error ? (
                    <ErrorDisplay message={error} />
                ) : (
                    <SimpleChart
                        data={data}
                        type={config.chart_type}
                        color={chartColor}
                        height={256} // h-64
                    />
                )}
            </div>

            {/* Indicators Flags */}
            {/* Indicators Flags */}
            {(() => {
                let indicators: string[] = [];
                if (Array.isArray(config.indicators)) {
                    indicators = config.indicators;
                } else if (typeof config.indicators === 'string') {
                    const str = (config.indicators as string).trim();
                    try {
                        // Try parsing if it looks like JSON array
                        if (str.startsWith('[') && str.endsWith(']')) {
                            // Replace single quotes with double quotes just in case, though risky if content has quotes
                            // Better to just try parse
                            indicators = JSON.parse(str);
                        } else {
                            // Or split by comma if simple string
                            indicators = str.split(',').map(s => s.trim()).filter(Boolean);
                        }
                    } catch (e) {
                        // Fallback: split by comma if JSON parse failed but it might be just a comma list
                        indicators = str.split(',').map(s => s.trim()).filter(Boolean);
                        // If that results in just the original string and it wasn't valid, maybe just show it
                        if (indicators.length === 1 && indicators[0] === str && (str.startsWith('[') || str.includes('{'))) {
                            // Probably failed JSON, show empty or raw? Show raw as single tag to be safe
                        }
                    }
                }

                if (indicators.length === 0) return null;

                return (
                    <div className="flex gap-2 mt-4 flex-wrap">
                        {indicators.map(ind => (
                            <span key={ind} className="px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--background-secondary)] border border-[var(--border-color)] text-[var(--foreground-muted)]">
                                {ind}
                            </span>
                        ))}
                    </div>
                );
            })()}
        </Card>
    );
}
