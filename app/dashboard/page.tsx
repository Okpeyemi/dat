'use client';

import { useEffect, useState, useMemo } from 'react';
import {
    Header,
    Card,
    StatCard,
    LoadingSpinner,
    ErrorDisplay,
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
    VisualizationWidget,
    ActivityIcon,
    CryptoSelector,
} from '@/components';
import {
    getTickerHistory,
    getAlertHistory,
    getSentimentHistory,
    getCryptoConfigs,
    getVisualizationConfigs,
    SYMBOL_TO_PAIR,
} from '@/lib/api';
import type {
    TickerData,
    AlertData,
    SentimentData,
    CryptoConfiguration,
    VisualizationParameter,
    HistoryQueryParams,
} from '@/lib/types';

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCrypto, setSelectedCrypto] = useState<string>(''); // '' means all

    // Data states
    const [tickers, setTickers] = useState<TickerData[]>([]);
    const [alerts, setAlerts] = useState<AlertData[]>([]);
    const [sentiments, setSentiments] = useState<SentimentData[]>([]);
    const [cryptos, setCryptos] = useState<CryptoConfiguration[]>([]);
    const [visualizations, setVisualizations] = useState<VisualizationParameter[]>([]);

    async function loadData() {
        setLoading(true);
        setError(null);

        try {
            // Load configs first to know what to fetch
            const [cryptoRes, vizRes] = await Promise.all([
                getCryptoConfigs(),
                getVisualizationConfigs(),
            ]);

            setCryptos(cryptoRes.results);
            setVisualizations(vizRes.results);

            const activeCryptos = cryptoRes.results.filter((c) => c.is_active);

            // Parallel fetch for operational data
            // Note: In a real app with many cryptos, we might want to paginate or filter on backend.
            // For now, we fetch '1h' history for tickers to get latest prices.
            const [tickerRes, alertRes] = await Promise.all([
                getTickerHistory({ periode: '1h' }),
                getAlertHistory({ periode: '24h' }),
            ]);

            setTickers(tickerRes.data);
            setAlerts(alertRes.data);

            // Fetch sentiment for active cryptos
            const sentimentPromises = activeCryptos.map(async (crypto) => {
                const symbol = crypto.symbol.includes('/')
                    ? crypto.symbol.split('/')[0]
                    : crypto.symbol;
                try {
                    const res = await getSentimentHistory(symbol, { periode: '24h' });
                    return res.data[0]; // Latest sentiment
                } catch (e) {
                    return null;
                }
            });

            const sentimentResults = await Promise.all(sentimentPromises);
            setSentiments(sentimentResults.filter((s): s is SentimentData => s !== null && s !== undefined));

        } catch (err) {
            console.error('Dashboard load error:', err);
            // Don't block completely on error, but show something
            setError('Certaines données n\'ont pas pu être chargées. Veuillez rafraîchir la page.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    // --- Filtering Logic ---

    // 1. Latest Prices (per pair)
    const processedTickers = useMemo(() => {
        // Dedup by pair, keeping latest
        const latestByPair = tickers.reduce((acc, ticker) => {
            if (!acc[ticker.pair] || new Date(ticker.timestamp) > new Date(acc[ticker.pair].timestamp)) {
                acc[ticker.pair] = ticker;
            }
            return acc;
        }, {} as Record<string, TickerData>);

        let filtered = Object.values(latestByPair);

        if (selectedCrypto) {
            filtered = filtered.filter(t => t.pair.includes(selectedCrypto));
        }

        // Sort by volume desc
        return filtered.sort((a, b) => b.volume_24h - a.volume_24h).slice(0, 8);
    }, [tickers, selectedCrypto]);

    // 2. Alerts
    const processedAlerts = useMemo(() => {
        let filtered = alerts;
        if (selectedCrypto) {
            filtered = filtered.filter(a => a.pair.includes(selectedCrypto));
        }
        return filtered.slice(0, 5);
    }, [alerts, selectedCrypto]);

    // 3. Sentiments
    const processedSentiments = useMemo(() => {
        let filtered = sentiments;
        if (selectedCrypto) {
            filtered = filtered.filter(s => s.crypto_symbol === selectedCrypto);
        }
        return filtered;
    }, [sentiments, selectedCrypto]);

    // 4. Stats
    const avgSentiment = processedSentiments.length > 0
        ? processedSentiments.reduce((sum, s) => sum + s.sentiment_score, 0) / processedSentiments.length
        : 0;

    const sentimentLabel = avgSentiment > 0.6 ? 'Positif' : avgSentiment < 0.4 ? 'Négatif' : 'Neutre';
    const sentimentColor = avgSentiment > 0.6 ? 'text-[var(--accent-success)]' : avgSentiment < 0.4 ? 'text-[var(--accent-danger)]' : 'text-[var(--foreground-muted)]';
    const SentimentIcon = avgSentiment > 0.6 ? SmileIcon : avgSentiment < 0.4 ? FrownIcon : MehIcon;

    return (
        <div className="min-h-screen bg-[var(--background-primary)]">
            <Header
                title="Dashboard"
                subtitle="Vue d'ensemble du marché crypto"
            />

            <main className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto">
                {/* Control Bar */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[var(--card-bg)] p-4 rounded-xl border border-[var(--border-color)]">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-[var(--accent-primary)]/10 rounded-lg text-[var(--accent-primary)]">
                            <SettingsIcon size={20} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-sm">Filtres</h2>
                            <p className="text-xs text-[var(--foreground-muted)]">Personnalisez votre vue</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <CryptoSelector
                            value={selectedCrypto}
                            onChange={setSelectedCrypto}
                            showAll={true}
                        />
                        <button
                            onClick={loadData}
                            className="p-2 hover:bg-[var(--background-secondary)] rounded-lg transition-colors border border-[var(--border-color)]"
                            title="Actualiser"
                        >
                            <ActivityIcon size={20} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>

                {loading && !processedTickers.length ? (
                    <div className="flex justify-center py-20">
                        <LoadingSpinner size="lg" text="Chargement des données du marché..." />
                    </div>
                ) : error ? (
                    <ErrorDisplay message={error} retry={loadData} />
                ) : (
                    <>
                        {/* KPI Stats */}
                        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard
                                label="Cryptos suivies"
                                value={processedTickers.length > 0 ? processedTickers.length : cryptos.filter(c => c.is_active).length}
                                icon={<DiamondIcon size={24} />}
                                subValue={selectedCrypto ? `Filtre: ${selectedCrypto}` : "Global"}
                            />
                            <StatCard
                                label="Alertes (24h)"
                                value={processedAlerts.length}
                                icon={<BellIcon size={24} />}
                                subValue="Signaux détectés"
                            />
                            <StatCard
                                label="Sentiment Moyen"
                                value={`${(avgSentiment * 100).toFixed(0)}%`}
                                icon={<SentimentIcon size={24} />}
                                subValue={<span className={sentimentColor}>{sentimentLabel}</span>}
                            />
                            <StatCard
                                label="Visualisations"
                                value={visualizations.length}
                                icon={<ChartBarIcon size={24} />}
                                subValue="Graphiques actifs"
                            />
                        </section>

                        {/* Visualizations Section (Dynamic Grid) */}
                        {visualizations.length > 0 && (
                            <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h2 className="text-xl font-bold flex items-center gap-2 text-[var(--foreground-primary)]">
                                    <ChartBarIcon size={24} className="text-[var(--accent-primary)]" />
                                    Visualisations Personnalisées
                                </h2>
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {visualizations.map((viz) => (
                                        // Only show if it matches filter (if filter set)
                                        (!selectedCrypto || viz.crypto_symbol === selectedCrypto) && (
                                            <VisualizationWidget key={viz.id} config={viz} />
                                        )
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Market Data & Alerts Grid */}
                        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                            {/* Real-time Prices (2 cols wide on large screens) */}
                            <div className="xl:col-span-2">
                                <Card
                                    title="Prix en temps réel"
                                    icon={<WalletIcon size={20} />}
                                    subtitle="Données de marché en direct"
                                >
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-[var(--border-color)] text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">
                                                    <th className="px-4 py-3">Paire</th>
                                                    <th className="px-4 py-3 text-right">Prix</th>
                                                    <th className="px-4 py-3 text-right">Volume (24h)</th>
                                                    <th className="px-4 py-3 text-right">Spread</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[var(--border-color)]">
                                                {processedTickers.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={4} className="px-4 py-8 text-center text-[var(--foreground-muted)]">
                                                            Aucune donnée disponible pour les filtres actuels.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    processedTickers.map((ticker) => (
                                                        <tr key={ticker.pair} className="hover:bg-[var(--background-secondary)]/50 transition-colors">
                                                            <td className="px-4 py-4 whitespace-nowrap">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 rounded-full bg-[var(--background-secondary)] text-[var(--accent-primary)]">
                                                                        {ticker.pair.includes('BTC') || ticker.pair.includes('XBT') ? <BitcoinIcon size={18} /> :
                                                                            ticker.pair.includes('ETH') ? <EthereumIcon size={18} /> : <CoinIcon size={18} />}
                                                                    </div>
                                                                    <span className="font-medium text-sm">{ticker.pair}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap text-right font-bold font-mono">
                                                                ${ticker.last.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-[var(--foreground-muted)]">
                                                                {ticker.volume_24h.toLocaleString()}
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-mono text-[var(--accent-warning)]">
                                                                ${(ticker.ask - ticker.bid).toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            </div>

                            {/* Recent Alerts & Sentiment (Stacked in 3rd col) */}
                            <div className="space-y-6">
                                {/* Alerts */}
                                <Card
                                    title="Dernières Alertes"
                                    icon={<BellIcon size={20} />}
                                    subtitle="Mouvements significatifs détectés"
                                >
                                    <div className="space-y-4">
                                        {processedAlerts.length === 0 ? (
                                            <div className="text-center py-8 text-[var(--foreground-muted)] text-sm">
                                                <div className="mb-2 flex justify-center"><BellIcon size={24} className="opacity-20" /></div>
                                                Aucune alerte récente
                                            </div>
                                        ) : (
                                            processedAlerts.map((alert, idx) => (
                                                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--background-secondary)]/30 border border-[var(--border-color)] hover:border-[var(--accent-primary)]/30 transition-all">
                                                    <div className={`mt-1 min-w-[32px] h-8 rounded-full flex items-center justify-center ${alert.alert_type === 'PRICE_UP'
                                                            ? 'bg-[var(--accent-success)]/10 text-[var(--accent-success)]'
                                                            : 'bg-[var(--accent-danger)]/10 text-[var(--accent-danger)]'
                                                        }`}>
                                                        {alert.alert_type === 'PRICE_UP' ? <TrendingUpIcon size={16} /> : <TrendingDownIcon size={16} />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start">
                                                            <h4 className="font-medium text-sm">{alert.pair}</h4>
                                                            <span className={`text-xs font-bold ${alert.change_percent >= 0 ? 'text-[var(--accent-success)]' : 'text-[var(--accent-danger)]'
                                                                }`}>
                                                                {alert.change_percent > 0 ? '+' : ''}{alert.change_percent.toFixed(2)}%
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-[var(--foreground-muted)] mt-1">
                                                            {new Date(alert.timestamp).toLocaleTimeString()} • ${alert.last_price.toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </Card>

                                {/* Sentiment List */}
                                <Card
                                    title="Sentiment de Marché"
                                    icon={<MaskIcon size={20} />}
                                    subtitle="IA & Analyse sociale"
                                >
                                    <div className="space-y-3">
                                        {processedSentiments.length === 0 ? (
                                            <p className="text-[var(--foreground-muted)] text-center text-sm py-4">Aucune donnée</p>
                                        ) : (
                                            processedSentiments.slice(0, 4).map((s, idx) => (
                                                <div key={idx} className="flex items-center justify-between py-2 border-b border-[var(--border-color)] last:border-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-sm w-10">{s.crypto_symbol}</span>
                                                        <div className="h-1.5 w-16 bg-[var(--background-secondary)] rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${s.sentiment_label === 'positive' ? 'bg-[var(--accent-success)]' :
                                                                        s.sentiment_label === 'negative' ? 'bg-[var(--accent-danger)]' : 'bg-[var(--accent-warning)]'
                                                                    }`}
                                                                style={{ width: `${s.sentiment_score * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`text-xs font-bold ${s.sentiment_label === 'positive' ? 'text-[var(--accent-success)]' :
                                                                s.sentiment_label === 'negative' ? 'text-[var(--accent-danger)]' : 'text-[var(--foreground-muted)]'
                                                            }`}>
                                                            {(s.sentiment_score * 100).toFixed(0)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </Card>
                            </div>
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}
