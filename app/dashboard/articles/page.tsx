'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header, Card, PeriodSelector, CryptoSelector, LoadingSpinner, ErrorDisplay, NewspaperIcon, SmileIcon, FrownIcon, MehIcon, RefreshCwIcon } from '@/components';
import { getArticleHistory } from '@/lib/api';
import type { ArticleData } from '@/lib/types';
import type { Period } from '@/lib/config';

export default function ArticlesPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [articles, setArticles] = useState<ArticleData[]>([]);
    const [period, setPeriod] = useState<Period>('24h');
    const [symbol, setSymbol] = useState('');

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const params: { periode: Period; crypto_symbol?: string } = { periode: period };
            if (symbol) params.crypto_symbol = symbol;
            const res = await getArticleHistory(params);
            setArticles(res.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    }, [period, symbol]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Calculate stats
    const positive = articles.filter((a) => a.sentiment_label === 'positive').length;
    const negative = articles.filter((a) => a.sentiment_label === 'negative').length;
    const neutral = articles.filter((a) => a.sentiment_label === 'neutral').length;
    const sources = [...new Set(articles.map((a) => a.website))];

    const getSentimentIcon = (label: string) => {
        switch (label) {
            case 'positive': return <SmileIcon size={16} className="inline" />;
            case 'negative': return <FrownIcon size={16} className="inline" />;
            default: return <MehIcon size={16} className="inline" />;
        }
    };

    return (
        <>
            <Header
                title="Articles Crypto"
                subtitle="Actualités avec analyse de sentiment"
            />

            <main className="p-8 space-y-6">
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-[var(--foreground-muted)]">Crypto:</span>
                        <CryptoSelector value={symbol} onChange={setSymbol} mode="symbol" showAll />
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
                    <LoadingSpinner size="lg" text="Chargement des articles..." />
                ) : error ? (
                    <ErrorDisplay message={error} retry={loadData} />
                ) : (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-[var(--background-card)] border border-[var(--border-color)] rounded-xl p-5">
                                <p className="text-sm text-[var(--foreground-muted)]">Total articles</p>
                                <p className="text-2xl font-bold mt-1">{articles.length}</p>
                            </div>
                            <div className="bg-[var(--background-card)] border border-[var(--accent-success)]/30 rounded-xl p-5">
                                <p className="text-sm text-[var(--foreground-muted)] flex items-center gap-2">Positifs <SmileIcon size={16} /></p>
                                <p className="text-2xl font-bold mt-1 text-[var(--accent-success)]">{positive}</p>
                            </div>
                            <div className="bg-[var(--background-card)] border border-[var(--accent-danger)]/30 rounded-xl p-5">
                                <p className="text-sm text-[var(--foreground-muted)] flex items-center gap-2">Négatifs <FrownIcon size={16} /></p>
                                <p className="text-2xl font-bold mt-1 text-[var(--accent-danger)]">{negative}</p>
                            </div>
                            <div className="bg-[var(--background-card)] border border-[var(--border-color)] rounded-xl p-5">
                                <p className="text-sm text-[var(--foreground-muted)]">Sources</p>
                                <p className="text-2xl font-bold mt-1">{sources.length}</p>
                            </div>
                        </div>

                        {/* Articles List */}
                        <Card title="Articles récents" icon={<NewspaperIcon size={24} />} subtitle={`${articles.length} articles`}>
                            <div className="space-y-4">
                                {articles.length === 0 ? (
                                    <p className="text-[var(--foreground-muted)] text-center py-8">
                                        Aucun article trouvé pour cette période
                                    </p>
                                ) : (
                                    articles.slice(0, 30).map((article, idx) => (
                                        <div
                                            key={idx}
                                            className="p-4 bg-[var(--background-secondary)] rounded-xl border border-[var(--border-color)] hover:border-[var(--accent-primary)] transition-colors"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span
                                                            className={`badge ${article.sentiment_label === 'positive'
                                                                ? 'badge-success'
                                                                : article.sentiment_label === 'negative'
                                                                    ? 'badge-danger'
                                                                    : 'badge-neutral'
                                                                }`}
                                                        >
                                                            <span className="mr-1">{getSentimentIcon(article.sentiment_label)}</span>
                                                            {(article.sentiment_score * 100).toFixed(0)}%
                                                        </span>
                                                        <span className="text-xs text-[var(--foreground-muted)]">
                                                            {article.website}
                                                        </span>
                                                        <span className="text-xs text-[var(--foreground-muted)]">
                                                            {new Date(article.timestamp).toLocaleDateString('fr-FR')}
                                                        </span>
                                                    </div>
                                                    <h4 className="font-medium text-[var(--foreground)] mb-2 leading-tight">
                                                        <a
                                                            href={article.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="hover:text-[var(--accent-primary)] transition-colors"
                                                        >
                                                            {article.title}
                                                        </a>
                                                    </h4>
                                                    <p className="text-sm text-[var(--foreground-muted)] line-clamp-2">
                                                        {article.summary}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2 mt-3">
                                                        {article.cryptocurrencies_mentioned.map((crypto) => (
                                                            <span
                                                                key={crypto}
                                                                className="px-2 py-1 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-xs rounded-md"
                                                            >
                                                                {crypto}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>
                    </>
                )}
            </main>
        </>
    );
}
