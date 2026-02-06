'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Card, { StatCard } from '@/components/Card';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorDisplay from '@/components/ErrorDisplay';
import { VisualizationManager } from '@/components/VisualizationManager';
import { VisualizationWidget } from '@/components/VisualizationWidget';
import { GenericChart } from '@/components/GenericChart';
import {
    DiamondIcon,
    BellIcon,
    MaskIcon,
    ChartBarIcon,
    WalletIcon,
    SettingsIcon,
    TrendingUpIcon,
    TrendingDownIcon,
    BitcoinIcon,
    EthereumIcon,
    CoinIcon,
    SmileIcon,
    FrownIcon,
    MehIcon,
    ActivityIcon,
} from '@/components/Icons';
import {
    getTickerHistory,
    getAlertHistory,
    getSentimentHistory,
    getCryptoConfigs,
    getVisualizationConfigs,
    getPredictionHistory,
    getTradeHistory,
} from '@/lib/api';
import type {
    TickerData,
    AlertData,
    SentimentData,
    CryptoConfiguration,
    VisualizationParameter,
    PredictionData,
    TradeData,
} from '@/lib/types';

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tickers, setTickers] = useState<TickerData[]>([]);
    const [alerts, setAlerts] = useState<AlertData[]>([]);
    const [sentiments, setSentiments] = useState<SentimentData[]>([]);
    const [cryptos, setCryptos] = useState<CryptoConfiguration[]>([]);
    const [visualizations, setVisualizations] = useState<VisualizationParameter[]>([]);
    const [predictions, setPredictions] = useState<PredictionData[]>([]);
    const [trades, setTrades] = useState<TradeData[]>([]);

    async function loadData() {
        setLoading(true);
        setError(null);

        try {
            const [tickerRes, alertRes, cryptoRes, vizRes, tradeRes] = await Promise.all([
                getTickerHistory({ periode: '1h' }),
                getAlertHistory({ periode: '24h' }),
                getCryptoConfigs(),
                getVisualizationConfigs(),
                getTradeHistory({ periode: '24h' }),
            ]);

            setTickers(tickerRes.data.slice(0, 8));
            setAlerts(alertRes.data.slice(0, 5));
            setCryptos(cryptoRes.results);
            setVisualizations(vizRes.results);
            setTrades(tradeRes.data);

            // Get sentiment for all active cryptos
            const activeCryptos = cryptoRes.results.filter((c) => c.is_active);

            // Fetch predictions for the first active crypto (e.g., BTC)
            if (activeCryptos.length > 0) {
                const primaryCrypto = activeCryptos[0];
                const symbol = primaryCrypto.symbol.includes('/')
                    ? primaryCrypto.symbol.split('/')[0]
                    : primaryCrypto.symbol;

                try {
                    const predRes = await getPredictionHistory(symbol, { periode: '24h' });
                    setPredictions(predRes.data);
                } catch (e) {
                    console.error('Failed to load predictions', e);
                }
            }

            const sentimentPromises = activeCryptos.map(async (crypto) => {
                const symbol = crypto.symbol.includes('/')
                    ? crypto.symbol.split('/')[0]
                    : crypto.symbol;
                try {
                    const res = await getSentimentHistory(symbol, { periode: '24h' });
                    // Return the latest sentiment data point if available
                    return res.data[0];
                } catch (e) {
                    return null;
                }
            });

            const sentimentResults = await Promise.all(sentimentPromises);
            setSentiments(sentimentResults.filter((s): s is SentimentData => s !== null && s !== undefined));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    // Calculate latest prices
    const latestPrices = tickers.reduce((acc, ticker) => {
        if (!acc[ticker.pair] || new Date(ticker.timestamp) > new Date(acc[ticker.pair].timestamp)) {
            acc[ticker.pair] = ticker;
        }
        return acc;
    }, {} as Record<string, TickerData>);

    // Calculate average sentiment
    const avgSentiment = sentiments.length > 0
        ? sentiments.reduce((sum, s) => sum + s.sentiment_score, 0) / sentiments.length
        : 0;

    return (
        <>
            <Header
                title="Dashboard"
                subtitle="Vue d'ensemble du marché crypto"
            />

            <main className="p-8 space-y-8">
                {loading ? (
                    <LoadingSpinner size="lg" text="Chargement des données..." />
                ) : error ? (
                    <ErrorDisplay message={error} retry={loadData} />
                ) : (
                    <>
                        {/* Stats Overview */}
                        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard
                                label="Cryptos suivies"
                                value={cryptos.filter((c) => c.is_active).length}
                                icon={<DiamondIcon size={32} />}
                            />
                            <StatCard
                                label="Alertes (24h)"
                                value={alerts.length}
                                icon={<BellIcon size={32} />}
                            />
                            <StatCard
                                label="Sentiment moyen"
                                value={`${(avgSentiment * 100).toFixed(0)}%`}
                                icon={<MaskIcon size={32} />}
                            />
                            <StatCard
                                label="Transactions (24h)"
                                value={trades.length}
                                icon={<ActivityIcon size={32} />}
                            />
                        </section>

                        {/* Custom Visualizations Grid */}
                        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Predictions Chart */}
                            <Card title="Prédictions (BTC)" icon={<TrendingUpIcon size={24} />}>
                                <div className="mt-4">
                                    {predictions.length > 0 ? (
                                        <GenericChart
                                            data={predictions}
                                            xKey="timestamp"
                                            series={[
                                                { key: 'predicted_price', label: 'Prédit', color: 'var(--accent-primary)', type: 'line' },
                                                { key: 'actual_price', label: 'Réel', color: 'var(--accent-success)', type: 'line' },
                                            ]}
                                            formatY={(v) => `$${v.toLocaleString()}`}
                                            height={250}
                                        />
                                    ) : (
                                        <div className="h-[250px] flex items-center justify-center text-[var(--foreground-muted)]">
                                            Pas de données de prédiction
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* Transactions Chart */}
                            <Card title="Transactions" icon={<ActivityIcon size={24} />}>
                                <div className="mt-4">
                                    {trades.length > 0 ? (
                                        <GenericChart
                                            data={trades}
                                            xKey="timestamp"
                                            series={[
                                                { key: 'price', label: 'Prix d\'exécution', color: 'var(--accent-success)', type: 'line' },
                                            ]}
                                            formatY={(v) => `$${v.toLocaleString()}`}
                                            height={250}
                                        />
                                    ) : (
                                        <div className="h-[250px] flex items-center justify-center text-[var(--foreground-muted)]">
                                            Pas de transactions récentes
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </section>

                        {/* Main Content Grid */}
                        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Latest Prices */}
                            <Card title="Prix en temps réel" icon={<WalletIcon size={24} />} subtitle="Derniers prix enregistrés">
                                <div className="space-y-3">
                                    {Object.entries(latestPrices).length === 0 ? (
                                        <p className="text-[var(--foreground-muted)] text-sm">Aucune donnée disponible</p>
                                    ) : (
                                        Object.entries(latestPrices).map(([pair, ticker]) => (
                                            <div
                                                key={pair}
                                                className="flex items-center justify-between p-3 bg-[var(--background-secondary)] rounded-lg"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[var(--accent-primary)]">
                                                        {pair.includes('BTC') || pair.includes('XBT') ? <BitcoinIcon size={20} /> : pair.includes('ETH') ? <EthereumIcon size={20} /> : <CoinIcon size={20} />}
                                                    </span>
                                                    <div>
                                                        <p className="font-medium">{pair}</p>
                                                        <p className="text-xs text-[var(--foreground-muted)]">
                                                            Vol: {ticker.volume_24h.toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-lg">
                                                        ${ticker.last.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </p>
                                                    <p className="text-xs text-[var(--foreground-muted)]">
                                                        Spread: ${(ticker.ask - ticker.bid).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Card>

                            {/* Recent Alerts */}
                            <Card title="Alertes récentes" icon={<BellIcon size={24} />} subtitle="Variations significatives">
                                <div className="space-y-3">
                                    {alerts.length === 0 ? (
                                        <p className="text-[var(--foreground-muted)] text-sm">Aucune alerte récente</p>
                                    ) : (
                                        alerts.map((alert, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between p-3 bg-[var(--background-secondary)] rounded-lg"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className={`w-10 h-10 rounded-full flex items-center justify-center ${alert.alert_type === 'PRICE_UP'
                                                            ? 'bg-[var(--accent-success)]/20 text-[var(--accent-success)]'
                                                            : 'bg-[var(--accent-danger)]/20 text-[var(--accent-danger)]'
                                                            }`}
                                                    >
                                                        {alert.alert_type === 'PRICE_UP' ? <TrendingUpIcon size={20} /> : <TrendingDownIcon size={20} />}
                                                    </span>
                                                    <div>
                                                        <p className="font-medium">{alert.pair}</p>
                                                        <p className="text-xs text-[var(--foreground-muted)]">
                                                            {new Date(alert.timestamp).toLocaleTimeString('fr-FR')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p
                                                        className={`font-bold ${alert.change_percent >= 0
                                                            ? 'text-[var(--accent-success)]'
                                                            : 'text-[var(--accent-danger)]'
                                                            }`}
                                                    >
                                                        {alert.change_percent >= 0 ? '+' : ''}
                                                        {alert.change_percent.toFixed(2)}%
                                                    </p>
                                                    <p className="text-xs text-[var(--foreground-muted)]">
                                                        ${alert.last_price.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Card>
                        </section>

                        {/* Sentiment & Cryptos */}
                        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Sentiment Overview */}
                            <Card title="Analyse de sentiment" icon={<MaskIcon size={24} />} subtitle="Sentiment récent du marché">
                                <div className="space-y-3">
                                    {sentiments.length === 0 ? (
                                        <p className="text-[var(--foreground-muted)] text-sm">Aucune donnée de sentiment</p>
                                    ) : (
                                        sentiments.map((s, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between p-3 bg-[var(--background-secondary)] rounded-lg"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className={`badge ${s.sentiment_label === 'positive'
                                                            ? 'badge-success'
                                                            : s.sentiment_label === 'negative'
                                                                ? 'badge-danger'
                                                                : 'badge-neutral'
                                                            }`}
                                                    >
                                                        <span className="mr-1">
                                                            {s.sentiment_label === 'positive'
                                                                ? <SmileIcon size={16} className="inline" />
                                                                : s.sentiment_label === 'negative'
                                                                    ? <FrownIcon size={16} className="inline" />
                                                                    : <MehIcon size={16} className="inline" />}
                                                        </span>
                                                        {s.sentiment_label}
                                                    </span>
                                                    <span className="text-sm text-[var(--foreground-muted)]">
                                                        {s.crypto_symbol}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium">{(s.sentiment_score * 100).toFixed(0)}%</p>
                                                    <p className="text-xs text-[var(--foreground-muted)]">
                                                        Confiance: {(s.confidence * 100).toFixed(0)}%
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Card>

                            {/* Configured Cryptos */}
                            <Card title="Cryptos configurées" icon={<SettingsIcon size={24} />} subtitle="Liste des cryptos suivies">
                                <div className="grid grid-cols-2 gap-3">
                                    {cryptos.map((crypto) => (
                                        <div
                                            key={crypto.id}
                                            className={`p-3 rounded-lg border ${crypto.is_active
                                                ? 'border-[var(--accent-success)]/30 bg-[var(--accent-success)]/5'
                                                : 'border-[var(--border-color)] bg-[var(--background-secondary)]'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium">{crypto.symbol}</p>
                                                <span
                                                    className={`w-2 h-2 rounded-full ${crypto.is_active ? 'bg-[var(--accent-success)]' : 'bg-[var(--foreground-muted)]'
                                                        }`}
                                                ></span>
                                            </div>
                                            <p className="text-xs text-[var(--foreground-muted)] mt-1">{crypto.name}</p>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </section>
                    </>
                )}
            </main>
        </>
    );
}
