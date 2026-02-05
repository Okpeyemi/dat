'use client';

import { useEffect, useState } from 'react';
import { Card, LoadingSpinner, PlusIcon, CheckIcon, XIcon, ListIcon, ChartBarIcon } from '@/components';
import {
    getVisualizationConfigs,
    createVisualizationConfig,
    updateVisualizationConfig,
    deleteVisualizationConfig
} from '@/lib/api';
import type { VisualizationParameter, VisualizationParameterRequest } from '@/lib/types';

export function VisualizationManager() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [configs, setConfigs] = useState<VisualizationParameter[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<VisualizationParameterRequest>({
        name: '',
        crypto_symbol: '',
        time_range: '24h',
        chart_type: 'candlestick',
        indicators: []
    });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);

    async function loadData() {
        setLoading(true);
        setError(null);
        try {
            const res = await getVisualizationConfigs();
            setConfigs(res.results);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            if (editingId) {
                await updateVisualizationConfig(editingId, formData);
                setSuccess('Configuration mise à jour avec succès!');
            } else {
                await createVisualizationConfig(formData);
                setSuccess('Configuration ajoutée avec succès!');
            }
            setFormData({
                name: '',
                crypto_symbol: '',
                time_range: '24h',
                chart_type: 'candlestick',
                indicators: []
            });
            setEditingId(null);
            loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(id: number) {
        if (!confirm('Voulez-vous vraiment supprimer cette configuration ?')) return;
        try {
            await deleteVisualizationConfig(id);
            setSuccess('Configuration supprimée.');
            loadData();
            if (editingId === id) {
                setEditingId(null);
                setFormData({
                    name: '',
                    crypto_symbol: '',
                    time_range: '24h',
                    chart_type: 'candlestick',
                    indicators: []
                });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
        }
    }

    function handleEdit(config: VisualizationParameter) {
        setFormData({
            name: config.name,
            crypto_symbol: config.crypto_symbol,
            time_range: config.time_range,
            chart_type: config.chart_type,
            indicators: config.indicators
        });
        setEditingId(config.id);
        setError(null);
        setSuccess(null);
    }

    function handleCancelEdit() {
        setEditingId(null);
        setFormData({
            name: '',
            crypto_symbol: '',
            time_range: '24h',
            chart_type: 'candlestick',
            indicators: []
        });
        setError(null);
        setSuccess(null);
    }

    const availableIndicators = ['SMA_20', 'SMA_50', 'RSI', 'MACD', 'BOLLINGER'];

    function toggleIndicator(indicator: string) {
        const current = formData.indicators || [];
        if (current.includes(indicator)) {
            setFormData({ ...formData, indicators: current.filter(i => i !== indicator) });
        } else {
            setFormData({ ...formData, indicators: [...current, indicator] });
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <Card
                title={editingId ? "Modifier visualisation" : "Nouvelle visualisation"}
                icon={<ChartBarIcon size={24} />}
                subtitle="Configurer vos préférences de graphiques"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-2">Nom de la configuration</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full"
                            placeholder="ex: Dashboard BTC Trading"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-2">Crypto</label>
                            <input
                                type="text"
                                value={formData.crypto_symbol}
                                onChange={(e) => setFormData({ ...formData, crypto_symbol: e.target.value.toUpperCase() })}
                                className="w-full"
                                placeholder="ex: BTC"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-2">Période</label>
                            <select
                                value={formData.time_range}
                                onChange={(e) => setFormData({ ...formData, time_range: e.target.value })}
                                className="w-full p-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border-color)]"
                            >
                                <option value="1h">1 heure</option>
                                <option value="24h">24 heures</option>
                                <option value="7d">7 jours</option>
                                <option value="30d">30 jours</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-2">Type de graphique</label>
                        <select
                            value={formData.chart_type}
                            onChange={(e) => setFormData({ ...formData, chart_type: e.target.value as any })}
                            className="w-full p-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border-color)]"
                        >
                            <option value="candlestick">Chandeliers</option>
                            <option value="line">Ligne</option>
                            <option value="area">Aire</option>
                            <option value="bar">Barres</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-2">Indicateurs</label>
                        <div className="flex flex-wrap gap-2">
                            {availableIndicators.map(ind => (
                                <button
                                    key={ind}
                                    type="button"
                                    onClick={() => toggleIndicator(ind)}
                                    className={`px-3 py-1 rounded-full text-xs transition-colors ${formData.indicators?.includes(ind)
                                            ? 'bg-[var(--accent-primary)] text-white'
                                            : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] border border-[var(--border-color)]'
                                        }`}
                                >
                                    {ind}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-[var(--accent-danger)]/10 text-[var(--accent-danger)] rounded-lg text-sm flex items-center gap-2">
                            <XIcon size={16} /> {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-3 bg-[var(--accent-success)]/10 text-[var(--accent-success)] rounded-lg text-sm flex items-center gap-2">
                            <CheckIcon size={16} /> {success}
                        </div>
                    )}

                    <div className="flex gap-2">
                        {editingId && (
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="btn btn-neutral w-1/3"
                            >
                                Annuler
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={submitting || !formData.name || !formData.crypto_symbol}
                            className={`btn btn-primary ${editingId ? 'w-2/3' : 'w-full'}`}
                        >
                            {submitting ? <span className="animate-spin mr-2">⏳</span> : <PlusIcon size={16} className="mr-2" />}
                            {editingId ? 'Mettre à jour' : 'Sauvegarder'}
                        </button>
                    </div>
                </form>
            </Card>

            <Card
                title="Configurations sauvegardées"
                icon={<ListIcon size={24} />}
                subtitle={`${configs.length} visualisations`}
            >
                {loading ? (
                    <LoadingSpinner size="md" />
                ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {configs.length === 0 ? (
                            <p className="text-center text-[var(--foreground-muted)] py-8">Aucune visualisation sauvegardée</p>
                        ) : (
                            configs.map(config => (
                                <div
                                    key={config.id}
                                    className={`p-4 rounded-xl border flex justify-between items-center ${editingId === config.id
                                            ? 'border-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]'
                                            : 'border-[var(--border-color)] bg-[var(--background-secondary)]'
                                        }`}
                                >
                                    <div>
                                        <p className="font-medium">{config.name}</p>
                                        <div className="flex gap-2 mt-1 text-xs text-[var(--foreground-muted)]">
                                            <span className="bg-[var(--background-card)] px-2 py-0.5 rounded">{config.crypto_symbol}</span>
                                            <span className="bg-[var(--background-card)] px-2 py-0.5 rounded">{config.chart_type}</span>
                                            <span className="bg-[var(--background-card)] px-2 py-0.5 rounded">{config.time_range}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(config)}
                                            className="text-xs text-[var(--accent-primary)] hover:underline"
                                        >
                                            Modifier
                                        </button>
                                        <button
                                            onClick={() => handleDelete(config.id)}
                                            className="text-xs text-[var(--accent-danger)] hover:underline"
                                        >
                                            Supprimer
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
}
