'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header, Card, PeriodSelector, CryptoSelector, LoadingSpinner, ErrorDisplay, TrendingUpIcon, ListIcon, ChartBarIcon, SimpleChart, RefreshCwIcon } from '@/components';
import { getTickerHistory, getCryptoConfigs } from '@/lib/api';
import type { TickerData } from '@/lib/types';
import type { Period } from '@/lib/config';

export default function PrixPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tickers, setTickers] = useState<TickerData[]>([]);
    const [period, setPeriod] = useState<Period>('24h');
    const [pair, setPair] = useState<string>('');
    const [initialized, setInitialized] = useState(false);

    // Initialize with the first available crypto pair
    useEffect(() => {
        async function init() {
            try {
                const data = await getCryptoConfigs();
                const firstActive = data.results.find((c) => c.is_active);
                if (firstActive) {
                    // Use pair format directly
                    setPair(firstActive.symbol);
                }
            } catch (err) {
                console.error('Failed to load initial crypto:', err);
            } finally {
                setInitialized(true);
            }
        }
        init();
    }, []);

    const loadData = useCallback(async () => {
        if (!pair) return;

        setLoading(true);
        setError(null);

        try {
            const res = await getTickerHistory({ periode: period, pair });
            setTickers(res.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    }, [period, pair]);

    useEffect(() => {
        if (initialized && pair) {
            loadData();
        }
    }, [loadData, initialized, pair]);

    // Calculate stats
    const latestPrice = tickers[0]?.last ?? 0;
    const prices = tickers.map((t) => t.last);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

    return (
        <>
            <Header
                title="Historique des Prix"
                subtitle="Suivi des prix en temps réel depuis Kraken"
            />

            <main className="p-8 space-y-6">
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-[var(--foreground-muted)]">Paire:</span>
                        <CryptoSelector value={pair} onChange={setPair} mode="pair" />
                    </div>
                    <PeriodSelector value={period} onChange={setPeriod} />
                    <button
                        onClick={loadData}
                        className="p-2 bg-[var(--background-secondary)] rounded-lg hover:bg-[var(--background-card)] transition-colors text-[var(--foreground)]"
                        title="Rafraîchir les données"
                    >
                        <RefreshCwIcon size={20} />
                    </button>
                </div>

                {loading ? (
                    <LoadingSpinner size="lg" text="Chargement des prix..." />
                ) : error ? (
                    <ErrorDisplay message={error} retry={loadData} />
                ) : (
                    <>
                        {/* Price Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-[var(--background-card)] border border-[var(--border-color)] rounded-xl p-5">
                                <p className="text-sm text-[var(--foreground-muted)]">Prix actuel</p>
                                <p className="text-2xl font-bold mt-1">
                                    ${latestPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div className="bg-[var(--background-card)] border border-[var(--border-color)] rounded-xl p-5">
                                <p className="text-sm text-[var(--foreground-muted)]">Prix minimum</p>
                                <p className="text-2xl font-bold mt-1 text-[var(--accent-danger)]">
                                    ${minPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div className="bg-[var(--background-card)] border border-[var(--border-color)] rounded-xl p-5">
                                <p className="text-sm text-[var(--foreground-muted)]">Prix maximum</p>
                                <p className="text-2xl font-bold mt-1 text-[var(--accent-success)]">
                                    ${maxPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div className="bg-[var(--background-card)] border border-[var(--border-color)] rounded-xl p-5">
                                <p className="text-sm text-[var(--foreground-muted)]">Prix moyen</p>
                                <p className="text-2xl font-bold mt-1 text-[var(--accent-secondary)]">
                                    ${avgPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>

                        {/* Price Chart Placeholder */}
                        <Card title="Évolution du prix" icon={<TrendingUpIcon size={24} />} subtitle={`${pair} - ${period}`}>
                            <div className="h-64 flex items-center justify-center p-4">
                                {tickers.length > 0 ? (
                                    <SimpleChart
                                        data={tickers}
                                        type="candlestick"
                                        height={250}
                                        showAxes={true}
                                    />
                                ) : (
                                    <div className="text-center text-[var(--foreground-muted)]">
                                        <p>Aucune donnée pour ce graphique</p>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Ticker Table */}
                        <Card title="Données ticker" icon={<ListIcon size={24} />} subtitle={`${tickers.length} enregistrements`}>
                            <div className="overflow-x-auto">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Horodatage</th>
                                            <th>Paire</th>
                                            <th>Dernier prix</th>
                                            <th>Bid</th>
                                            <th>Ask</th>
                                            <th>Spread</th>
                                            <th>Volume 24h</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tickers.slice(0, 50).map((ticker, idx) => (
                                            <tr key={idx}>
                                                <td className="text-sm">
                                                    {new Date(ticker.timestamp).toLocaleString('fr-FR')}
                                                </td>
                                                <td className="font-medium">{ticker.pair}</td>
                                                <td className="font-mono">
                                                    ${ticker.last.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="font-mono text-[var(--accent-success)]">
                                                    ${ticker.bid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="font-mono text-[var(--accent-danger)]">
                                                    ${ticker.ask.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="font-mono text-[var(--foreground-muted)]">
                                                    ${(ticker.ask - ticker.bid).toFixed(2)}
                                                </td>
                                                <td className="font-mono">{ticker.volume_24h.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </>
                )}
            </main>
        </>
    );
}
