'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/Header';
import Card from '@/components/Card';
import PeriodSelector from '@/components/PeriodSelector';
import CryptoSelector from '@/components/CryptoSelector';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorDisplay from '@/components/ErrorDisplay';
import { GenericChart } from '@/components/GenericChart';
import { CrystalBallIcon, ListIcon, RefreshCwIcon } from '@/components/Icons';
import { getPredictionHistory, getCryptoConfigs } from '@/lib/api';
import type { PredictionData } from '@/lib/types';
import type { Period } from '@/lib/config';

export default function PredictionsPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [predictions, setPredictions] = useState<PredictionData[]>([]);
    const [period, setPeriod] = useState<Period>('24h');
    const [symbol, setSymbol] = useState<string>('');
    const [initialized, setInitialized] = useState(false);

    // Initialize with the first available crypto symbol
    useEffect(() => {
        async function init() {
            try {
                const data = await getCryptoConfigs();
                const firstActive = data.results.find((c) => c.is_active);
                if (firstActive) {
                    // Extract symbol from pair format (e.g., "ETH/USD" -> "ETH")
                    const sym = firstActive.symbol.includes('/')
                        ? firstActive.symbol.split('/')[0]
                        : firstActive.symbol;
                    setSymbol(sym);
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
        if (!symbol) return; // Don't fetch without a valid symbol

        setLoading(true);
        setError(null);

        try {
            const res = await getPredictionHistory(symbol, { periode: period });
            setPredictions(res.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    }, [period, symbol]);

    useEffect(() => {
        if (initialized && symbol) {
            loadData();
        }
    }, [loadData, initialized, symbol]);

    // Calculate stats
    const latestPrediction = predictions[0];
    const predictionsWithActual = predictions.filter((p) => p.actual_price !== null);
    const avgError = predictionsWithActual.length > 0
        ? predictionsWithActual.reduce((sum, p) => {
            const error = Math.abs((p.predicted_price - (p.actual_price || 0)) / (p.actual_price || 1)) * 100;
            return sum + error;
        }, 0) / predictionsWithActual.length
        : 0;

    return (
        <>
            <Header
                title="Prédictions de Prix"
                subtitle="Prédictions ML avec intervalles de confiance"
            />

            <main className="p-8 space-y-6">
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-[var(--foreground-muted)]">Crypto:</span>
                        <CryptoSelector value={symbol} onChange={setSymbol} mode="symbol" />
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
                    <LoadingSpinner size="lg" text="Chargement des prédictions..." />
                ) : error ? (
                    <ErrorDisplay message={error} retry={loadData} />
                ) : (
                    <>
                        {/* Latest Prediction */}
                        {latestPrediction && (
                            <Card title="Dernière prédiction" icon={<CrystalBallIcon size={24} />} subtitle={`Modèle: ${latestPrediction.model_name}`}>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="text-center p-6 bg-[var(--background-secondary)] rounded-xl">
                                        <p className="text-sm text-[var(--foreground-muted)] mb-2">Prix prédit</p>
                                        <p className="text-3xl font-bold text-[var(--accent-primary)]">
                                            ${latestPrediction.predicted_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div className="text-center p-6 bg-[var(--background-secondary)] rounded-xl">
                                        <p className="text-sm text-[var(--foreground-muted)] mb-2">Intervalle bas</p>
                                        <p className="text-2xl font-bold text-[var(--accent-danger)]">
                                            {latestPrediction.confidence_interval_low !== null
                                                ? `$${latestPrediction.confidence_interval_low.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                                : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="text-center p-6 bg-[var(--background-secondary)] rounded-xl">
                                        <p className="text-sm text-[var(--foreground-muted)] mb-2">Intervalle haut</p>
                                        <p className="text-2xl font-bold text-[var(--accent-success)]">
                                            {latestPrediction.confidence_interval_high !== null
                                                ? `$${latestPrediction.confidence_interval_high.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                                : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Prediction vs Actual Chart */}
                        {predictions.length > 0 && (
                            <Card title="Prédiction vs Réalité" icon={<CrystalBallIcon size={24} />}>
                                <div className="mt-4">
                                    <GenericChart
                                        data={predictions}
                                        xKey="timestamp"
                                        series={[
                                            { key: 'predicted_price', label: 'Prix Prédit', color: 'var(--accent-primary)', type: 'line' },
                                            { key: 'actual_price', label: 'Prix Réel', color: 'var(--accent-success)', type: 'line' },
                                            // { key: 'confidence_interval_high', label: 'Int. Haut', color: 'var(--accent-danger)', type: 'area' }
                                        ]}
                                        formatY={(v) => `$${v.toLocaleString()}`}
                                        height={350}
                                    />
                                </div>
                            </Card>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-[var(--background-card)] border border-[var(--border-color)] rounded-xl p-5">
                                <p className="text-sm text-[var(--foreground-muted)]">Total prédictions</p>
                                <p className="text-2xl font-bold mt-1">{predictions.length}</p>
                            </div>
                            <div className="bg-[var(--background-card)] border border-[var(--border-color)] rounded-xl p-5">
                                <p className="text-sm text-[var(--foreground-muted)]">Avec prix réel</p>
                                <p className="text-2xl font-bold mt-1">{predictionsWithActual.length}</p>
                            </div>
                            <div className="bg-[var(--background-card)] border border-[var(--border-color)] rounded-xl p-5">
                                <p className="text-sm text-[var(--foreground-muted)]">Erreur moyenne</p>
                                <p className="text-2xl font-bold mt-1">{avgError.toFixed(2)}%</p>
                            </div>
                        </div>

                        {/* Predictions Table */}
                        <Card title="Historique des prédictions" icon={<ListIcon size={24} />} subtitle={`${predictions.length} prédictions`}>
                            <div className="overflow-x-auto">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Horodatage</th>
                                            <th>Crypto</th>
                                            <th>Prix prédit</th>
                                            <th>Prix réel</th>
                                            <th>Intervalle</th>
                                            <th>Erreur</th>
                                            <th>Modèle</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {predictions.slice(0, 50).map((p, idx) => {
                                            const error = p.actual_price
                                                ? Math.abs((p.predicted_price - p.actual_price) / p.actual_price) * 100
                                                : null;

                                            const inRange = (p.actual_price && p.confidence_interval_low !== null && p.confidence_interval_high !== null)
                                                ? p.actual_price >= p.confidence_interval_low &&
                                                p.actual_price <= p.confidence_interval_high
                                                : null;

                                            return (
                                                <tr key={idx}>
                                                    <td className="text-sm">
                                                        {new Date(p.timestamp).toLocaleString('fr-FR')}
                                                    </td>
                                                    <td className="font-medium">{p.crypto_symbol}</td>
                                                    <td className="font-mono text-[var(--accent-primary)]">
                                                        ${p.predicted_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="font-mono">
                                                        {p.actual_price
                                                            ? `$${p.actual_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                                            : <span className="text-[var(--foreground-muted)]">--</span>
                                                        }
                                                    </td>
                                                    <td className="font-mono text-sm text-[var(--foreground-muted)]">
                                                        {p.confidence_interval_low !== null && p.confidence_interval_high !== null
                                                            ? `$${p.confidence_interval_low.toLocaleString()} - $${p.confidence_interval_high.toLocaleString()}`
                                                            : <span className="text-[var(--foreground-muted)]">--</span>
                                                        }
                                                    </td>
                                                    <td>
                                                        {error !== null ? (
                                                            <span
                                                                className={`badge ${inRange ? 'badge-success' : 'badge-danger'
                                                                    }`}
                                                            >
                                                                {inRange ? '✓' : '✗'} {error.toFixed(2)}%
                                                            </span>
                                                        ) : (
                                                            <span className="text-[var(--foreground-muted)]">--</span>
                                                        )}
                                                    </td>
                                                    <td className="text-sm text-[var(--foreground-muted)]">
                                                        {p.model_name}
                                                    </td>
                                                </tr>
                                            );
                                        })}
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
