'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header, Card, PeriodSelector, CryptoSelector, LoadingSpinner, ErrorDisplay, ChartBarIcon, BellIcon, TrendingUpIcon, TrendingDownIcon } from '@/components';
import { getAlertHistory } from '@/lib/api';
import type { AlertData } from '@/lib/types';
import type { Period } from '@/lib/config';

export default function AlertesPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [alerts, setAlerts] = useState<AlertData[]>([]);
    const [period, setPeriod] = useState<Period>('24h');
    const [pair, setPair] = useState('');

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const params: { periode: Period; pair?: string } = { periode: period };
            if (pair) params.pair = pair;
            const res = await getAlertHistory(params);
            setAlerts(res.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    }, [period, pair]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Calculate stats
    const priceUp = alerts.filter((a) => a.alert_type === 'PRICE_UP').length;
    const priceDown = alerts.filter((a) => a.alert_type === 'PRICE_DOWN').length;
    const avgChange = alerts.length > 0
        ? alerts.reduce((sum, a) => sum + Math.abs(a.change_percent), 0) / alerts.length
        : 0;
    const maxChange = alerts.length > 0
        ? Math.max(...alerts.map((a) => Math.abs(a.change_percent)))
        : 0;

    return (
        <>
            <Header
                title="Historique des Alertes"
                subtitle="Alertes de variation de prix significatives"
            />

            <main className="p-8 space-y-6">
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-[var(--foreground-muted)]">Paire:</span>
                        <CryptoSelector value={pair} onChange={setPair} mode="pair" showAll />
                    </div>
                    <PeriodSelector value={period} onChange={setPeriod} />
                </div>

                {loading ? (
                    <LoadingSpinner size="lg" text="Chargement des alertes..." />
                ) : error ? (
                    <ErrorDisplay message={error} retry={loadData} />
                ) : (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-[var(--background-card)] border border-[var(--border-color)] rounded-xl p-5">
                                <p className="text-sm text-[var(--foreground-muted)]">Total alertes</p>
                                <p className="text-2xl font-bold mt-1">{alerts.length}</p>
                            </div>
                            <div className="bg-[var(--background-card)] border border-[var(--accent-success)]/30 rounded-xl p-5">
                                <p className="text-sm text-[var(--foreground-muted)] flex items-center gap-2">Hausses <TrendingUpIcon size={16} /></p>
                                <p className="text-2xl font-bold mt-1 text-[var(--accent-success)]">{priceUp}</p>
                            </div>
                            <div className="bg-[var(--background-card)] border border-[var(--accent-danger)]/30 rounded-xl p-5">
                                <p className="text-sm text-[var(--foreground-muted)] flex items-center gap-2">Baisses <TrendingDownIcon size={16} /></p>
                                <p className="text-2xl font-bold mt-1 text-[var(--accent-danger)]">{priceDown}</p>
                            </div>
                            <div className="bg-[var(--background-card)] border border-[var(--border-color)] rounded-xl p-5">
                                <p className="text-sm text-[var(--foreground-muted)]">Variation max</p>
                                <p className="text-2xl font-bold mt-1 text-[var(--accent-warning)]">
                                    {maxChange.toFixed(2)}%
                                </p>
                            </div>
                        </div>

                        {/* Alert Distribution */}
                        <Card title="Distribution des alertes" icon={<ChartBarIcon size={24} />}>
                            <div className="flex items-center gap-6">
                                <div className="flex-1">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-[var(--accent-success)]">Hausses ({priceUp})</span>
                                        <span className="text-[var(--accent-danger)]">Baisses ({priceDown})</span>
                                    </div>
                                    <div className="h-6 bg-[var(--background-secondary)] rounded-full overflow-hidden flex">
                                        {priceUp > 0 && (
                                            <div
                                                className="h-full bg-[var(--accent-success)] flex items-center justify-center"
                                                style={{ width: `${(priceUp / alerts.length) * 100}%` }}
                                            >
                                                {priceUp}
                                            </div>
                                        )}
                                        {priceDown > 0 && (
                                            <div
                                                className="h-full bg-[var(--accent-danger)] flex items-center justify-center"
                                                style={{ width: `${(priceDown / alerts.length) * 100}%` }}
                                            >
                                                {priceDown}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-[var(--foreground-muted)]">Variation moyenne</p>
                                    <p className="text-xl font-bold">{avgChange.toFixed(2)}%</p>
                                </div>
                            </div>
                        </Card>

                        {/* Alerts Table */}
                        <Card title="Historique des alertes" icon={<BellIcon size={24} />} subtitle={`${alerts.length} alertes`}>
                            <div className="overflow-x-auto">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Horodatage</th>
                                            <th>Paire</th>
                                            <th>Type</th>
                                            <th>Variation</th>
                                            <th>Prix</th>
                                            <th>Seuil</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {alerts.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="text-center text-[var(--foreground-muted)] py-8">
                                                    Aucune alerte pour cette période
                                                </td>
                                            </tr>
                                        ) : (
                                            alerts.slice(0, 100).map((alert, idx) => (
                                                <tr key={idx}>
                                                    <td className="text-sm">
                                                        {new Date(alert.timestamp).toLocaleString('fr-FR')}
                                                    </td>
                                                    <td className="font-medium">{alert.pair}</td>
                                                    <td>
                                                        <span
                                                            className={`badge ${alert.alert_type === 'PRICE_UP' ? 'badge-success' : 'badge-danger'
                                                                }`}
                                                        >
                                                            {alert.alert_type === 'PRICE_UP' ? '📈 Hausse' : '📉 Baisse'}
                                                        </span>
                                                    </td>
                                                    <td
                                                        className={`font-bold ${alert.change_percent >= 0
                                                            ? 'text-[var(--accent-success)]'
                                                            : 'text-[var(--accent-danger)]'
                                                            }`}
                                                    >
                                                        {alert.change_percent >= 0 ? '+' : ''}
                                                        {alert.change_percent.toFixed(2)}%
                                                    </td>
                                                    <td className="font-mono">
                                                        ${alert.last_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="text-sm text-[var(--foreground-muted)]">
                                                        {alert.threshold}%
                                                    </td>
                                                </tr>
                                            ))
                                        )}
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
