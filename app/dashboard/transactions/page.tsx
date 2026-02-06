'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/Header';
import Card from '@/components/Card';
import PeriodSelector from '@/components/PeriodSelector';
import CryptoSelector from '@/components/CryptoSelector';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorDisplay from '@/components/ErrorDisplay';
import { GenericChart } from '@/components/GenericChart';
import { ScaleIcon, ListIcon, RefreshCwIcon } from '@/components/Icons';
import { getTradeHistory, getCryptoConfigs } from '@/lib/api';
import type { TradeData } from '@/lib/types';
import type { Period } from '@/lib/config';

export default function TransactionsPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [trades, setTrades] = useState<TradeData[]>([]);
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
            const res = await getTradeHistory({ periode: period, pair });
            setTrades(res.data);
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
    const buys = trades.filter((t) => t.side === 'b');
    const sells = trades.filter((t) => t.side === 's');
    const totalVolume = trades.reduce((sum, t) => sum + t.volume, 0);
    const buyRatio = trades.length > 0 ? (buys.length / trades.length) * 100 : 0;

    return (
        <>
            <Header
                title="Historique des Transactions"
                subtitle="Transactions individuelles depuis Kraken"
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
                    <LoadingSpinner size="lg" text="Chargement des transactions..." />
                ) : error ? (
                    <ErrorDisplay message={error} retry={loadData} />
                ) : (
                    <>
                        {/* Trade History Chart */}
                        {trades.length > 0 && (
                            <Card title="Historique des Prix" icon={<ScaleIcon size={24} />}>
                                <div className="mt-4">
                                    <GenericChart
                                        data={trades}
                                        xKey="timestamp"
                                        series={[
                                            { key: 'price', label: 'Prix Exécuté', color: 'var(--accent-success)', type: 'line' },
                                            // { key: 'volume', label: 'Volume', color: 'var(--foreground-muted)', type: 'bar' }
                                        ]}
                                        formatY={(v) => `$${v.toLocaleString()}`}
                                        height={300}
                                    />
                                </div>
                            </Card>
                        )}

                        {/* Trade Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-[var(--background-card)] border border-[var(--border-color)] rounded-xl p-5">
                                <p className="text-sm text-[var(--foreground-muted)]">Total transactions</p>
                                <p className="text-2xl font-bold mt-1">{trades.length}</p>
                            </div>
                            <div className="bg-[var(--background-card)] border border-[var(--accent-success)]/30 rounded-xl p-5">
                                <p className="text-sm text-[var(--foreground-muted)]">Achats (Buy)</p>
                                <p className="text-2xl font-bold mt-1 text-[var(--accent-success)]">
                                    {buys.length}
                                </p>
                            </div>
                            <div className="bg-[var(--background-card)] border border-[var(--accent-danger)]/30 rounded-xl p-5">
                                <p className="text-sm text-[var(--foreground-muted)]">Ventes (Sell)</p>
                                <p className="text-2xl font-bold mt-1 text-[var(--accent-danger)]">
                                    {sells.length}
                                </p>
                            </div>
                            <div className="bg-[var(--background-card)] border border-[var(--border-color)] rounded-xl p-5">
                                <p className="text-sm text-[var(--foreground-muted)]">Volume total</p>
                                <p className="text-2xl font-bold mt-1">{totalVolume.toFixed(4)}</p>
                            </div>
                        </div>

                        {/* Buy/Sell Ratio */}
                        <Card title="Ratio Achat/Vente" icon={<ScaleIcon size={24} />}>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--accent-success)]">Achats ({buys.length})</span>
                                    <span className="text-[var(--accent-danger)]">Ventes ({sells.length})</span>
                                </div>
                                <div className="h-4 bg-[var(--background-secondary)] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-[var(--accent-success)] to-[var(--accent-success)]"
                                        style={{ width: `${buyRatio}%` }}
                                    ></div>
                                </div>
                                <p className="text-center text-sm text-[var(--foreground-muted)]">
                                    Ratio: {buyRatio.toFixed(1)}% achats / {(100 - buyRatio).toFixed(1)}% ventes
                                </p>
                            </div>
                        </Card>

                        {/* Trades Table */}
                        <Card title="Transactions" icon={<ListIcon size={24} />} subtitle={`${trades.length} transactions`}>
                            <div className="overflow-x-auto">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Horodatage</th>
                                            <th>Paire</th>
                                            <th>Type</th>
                                            <th>Prix</th>
                                            <th>Volume</th>
                                            <th>Valeur USD</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {trades.slice(0, 100).map((trade, idx) => (
                                            <tr key={idx}>
                                                <td className="text-sm">
                                                    {new Date(trade.timestamp).toLocaleString('fr-FR')}
                                                </td>
                                                <td className="font-medium">{trade.pair}</td>
                                                <td>
                                                    <span
                                                        className={`badge ${trade.side === 'b' ? 'badge-success' : 'badge-danger'
                                                            }`}
                                                    >
                                                        {trade.side === 'b' ? '↑ Buy' : '↓ Sell'}
                                                    </span>
                                                </td>
                                                <td className="font-mono">
                                                    ${trade.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="font-mono">{trade.volume.toFixed(6)}</td>
                                                <td className="font-mono text-[var(--foreground-muted)]">
                                                    ${(trade.price * trade.volume).toFixed(2)}
                                                </td>
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
