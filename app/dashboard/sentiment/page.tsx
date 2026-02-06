'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header, Card, PeriodSelector, CryptoSelector, LoadingSpinner, ErrorDisplay, ChartBarIcon, ListIcon, GenericChart, RefreshCwIcon } from '@/components';
import { getSentimentHistory, getCryptoConfigs } from '@/lib/api';
import type { SentimentData } from '@/lib/types';
import type { Period } from '@/lib/config';

export default function SentimentPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sentiments, setSentiments] = useState<SentimentData[]>([]);
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
        if (!symbol) return;

        setLoading(true);
        setError(null);

        try {
            const res = await getSentimentHistory(symbol, { periode: period });
            setSentiments(res.data);
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
    const avgScore = sentiments.length > 0
        ? sentiments.reduce((sum, s) => sum + s.sentiment_score, 0) / sentiments.length
        : 0;
    const avgConfidence = sentiments.length > 0
        ? sentiments.reduce((sum, s) => sum + s.confidence, 0) / sentiments.length
        : 0;
    const positive = sentiments.filter((s) => s.sentiment_label === 'positive').length;
    const negative = sentiments.filter((s) => s.sentiment_label === 'negative').length;
    const neutral = sentiments.filter((s) => s.sentiment_label === 'neutral').length;

    const getSentimentEmoji = (label: string) => {
        switch (label) {
            case 'positive': return '😊';
            case 'negative': return '😟';
            default: return '😐';
        }
    };

    const getSentimentColor = (score: number) => {
        if (score >= 0.6) return 'var(--accent-success)';
        if (score <= 0.4) return 'var(--accent-danger)';
        return 'var(--foreground-muted)';
    };

    return (
        <>
            <Header
                title="Analyse de Sentiment"
                subtitle="Sentiment basé sur l'analyse NLP des articles crypto"
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
                    <LoadingSpinner size="lg" text="Chargement du sentiment..." />
                ) : error ? (
                    <ErrorDisplay message={error} retry={loadData} />
                ) : (
                    <>
                        {/* Sentiment Trend Chart */}
                        {sentiments.length > 0 && (
                            <Card title="Tendance du Sentiment" icon={<ChartBarIcon size={24} />}>
                                <div className="mt-4">
                                    <GenericChart
                                        data={sentiments}
                                        xKey="timestamp"
                                        series={[
                                            { key: 'sentiment_score', label: 'Score (-1 à 1)', color: 'var(--accent-primary)', type: 'line' },
                                            { key: 'confidence', label: 'Confiance', color: 'var(--foreground-muted)', type: 'area' }
                                        ]}
                                        formatY={(v) => `${(v * 100).toFixed(0)}%`}
                                        height={300}
                                    />
                                </div>
                            </Card>
                        )}

                        {/* Sentiment Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-[var(--background-card)] border border-[var(--border-color)] rounded-xl p-5">
                                <p className="text-sm text-[var(--foreground-muted)]">Score moyen</p>
                                <p
                                    className="text-2xl font-bold mt-1"
                                    style={{ color: getSentimentColor(avgScore) }}
                                >
                                    {(avgScore * 100).toFixed(0)}%
                                </p>
                            </div>
                            <div className="bg-[var(--background-card)] border border-[var(--accent-success)]/30 rounded-xl p-5">
                                <p className="text-sm text-[var(--foreground-muted)]">Positif 😊</p>
                                <p className="text-2xl font-bold mt-1 text-[var(--accent-success)]">
                                    {positive}
                                </p>
                            </div>
                            <div className="bg-[var(--background-card)] border border-[var(--accent-danger)]/30 rounded-xl p-5">
                                <p className="text-sm text-[var(--foreground-muted)]">Négatif 😟</p>
                                <p className="text-2xl font-bold mt-1 text-[var(--accent-danger)]">
                                    {negative}
                                </p>
                            </div>
                            <div className="bg-[var(--background-card)] border border-[var(--border-color)] rounded-xl p-5">
                                <p className="text-sm text-[var(--foreground-muted)]">Confiance moyenne</p>
                                <p className="text-2xl font-bold mt-1">{(avgConfidence * 100).toFixed(0)}%</p>
                            </div>
                        </div>

                        {/* Sentiment Distribution */}
                        <Card title="Distribution du sentiment" icon={<ChartBarIcon size={24} />}>
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex h-8 rounded-lg overflow-hidden">
                                        {positive > 0 && (
                                            <div
                                                className="bg-[var(--accent-success)] flex items-center justify-center"
                                                style={{ width: `${(positive / sentiments.length) * 100}%` }}
                                            >
                                                <span className="text-xs font-medium text-white">
                                                    {positive}
                                                </span>
                                            </div>
                                        )}
                                        {neutral > 0 && (
                                            <div
                                                className="bg-[var(--foreground-muted)] flex items-center justify-center"
                                                style={{ width: `${(neutral / sentiments.length) * 100}%` }}
                                            >
                                                <span className="text-xs font-medium text-white">
                                                    {neutral}
                                                </span>
                                            </div>
                                        )}
                                        {negative > 0 && (
                                            <div
                                                className="bg-[var(--accent-danger)] flex items-center justify-center"
                                                style={{ width: `${(negative / sentiments.length) * 100}%` }}
                                            >
                                                <span className="text-xs font-medium text-white">
                                                    {negative}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-between mt-2 text-xs text-[var(--foreground-muted)]">
                                        <span className="text-[var(--accent-success)]">Positif</span>
                                        <span>Neutre</span>
                                        <span className="text-[var(--accent-danger)]">Négatif</span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Sentiment History */}
                        <Card title="Historique du sentiment" icon={<ListIcon size={24} />} subtitle={`${sentiments.length} mesures`}>
                            <div className="overflow-x-auto">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Horodatage</th>
                                            <th>Crypto</th>
                                            <th>Sentiment</th>
                                            <th>Score</th>
                                            <th>Confiance</th>
                                            <th>Source</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sentiments.slice(0, 50).map((s, idx) => (
                                            <tr key={idx}>
                                                <td className="text-sm">
                                                    {new Date(s.timestamp).toLocaleString('fr-FR')}
                                                </td>
                                                <td className="font-medium">{s.crypto_symbol}</td>
                                                <td>
                                                    <span
                                                        className={`badge ${s.sentiment_label === 'positive'
                                                            ? 'badge-success'
                                                            : s.sentiment_label === 'negative'
                                                                ? 'badge-danger'
                                                                : 'badge-neutral'
                                                            }`}
                                                    >
                                                        {getSentimentEmoji(s.sentiment_label)} {s.sentiment_label}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 h-2 bg-[var(--background-secondary)] rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full"
                                                                style={{
                                                                    width: `${s.sentiment_score * 100}%`,
                                                                    backgroundColor: getSentimentColor(s.sentiment_score),
                                                                }}
                                                            ></div>
                                                        </div>
                                                        <span className="font-mono text-sm">
                                                            {(s.sentiment_score * 100).toFixed(0)}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="font-mono">{(s.confidence * 100).toFixed(0)}%</td>
                                                <td className="text-sm text-[var(--foreground-muted)]">{s.source}</td>
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
