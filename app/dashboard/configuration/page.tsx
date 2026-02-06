'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Card from '@/components/Card';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorDisplay from '@/components/ErrorDisplay';
import { VisualizationManager } from '@/components/VisualizationManager';
import { PlusIcon, DiamondIcon, CheckIcon, XIcon } from '@/components/Icons';
import { getCryptoConfigs, createCryptoConfig, updateCryptoConfig, deleteCryptoConfig } from '@/lib/api';
import type { CryptoConfiguration, CryptoConfigurationRequest } from '@/lib/types';

export default function ConfigurationPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cryptos, setCryptos] = useState<CryptoConfiguration[]>([]);
    const [formData, setFormData] = useState<CryptoConfigurationRequest>({
        symbol: '',
        name: '',
        is_active: true,
    });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);

    const [editingId, setEditingId] = useState<number | null>(null);

    async function loadData() {
        setLoading(true);
        setError(null);

        try {
            const res = await getCryptoConfigs();
            setCryptos(res.results);
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
        if (!formData.symbol || !formData.name) return;

        setSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            if (editingId) {
                await updateCryptoConfig(editingId, formData);
                setSuccess(`${formData.symbol} mis à jour avec succès!`);
            } else {
                await createCryptoConfig(formData);
                setSuccess(`${formData.symbol} ajouté avec succès!`);
            }
            setFormData({ symbol: '', name: '', is_active: true });
            setEditingId(null);
            loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : editingId ? 'Erreur lors de la mise à jour' : 'Erreur lors de l\'ajout');
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(id: number, symbol: string) {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer ${symbol} ?`)) return;

        try {
            await deleteCryptoConfig(id);
            setSuccess(`${symbol} supprimé avec succès!`);
            loadData();
            if (editingId === id) {
                setEditingId(null);
                setFormData({ symbol: '', name: '', is_active: true });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
        }
    }

    function handleEdit(crypto: CryptoConfiguration) {
        setFormData({
            symbol: crypto.symbol,
            name: crypto.name,
            is_active: crypto.is_active,
        });
        setEditingId(crypto.id);
        setError(null);
        setSuccess(null);
        // Scroll to top to see form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function handleCancelEdit() {
        setEditingId(null);
        setFormData({ symbol: '', name: '', is_active: true });
        setError(null);
        setSuccess(null);
    }

    const activeCount = cryptos.filter((c) => c.is_active).length;

    return (
        <>
            <Header
                title="Configuration"
                subtitle="Gérer les crypto-monnaies suivies"
            />

            <main className="p-8 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[var(--background-card)] border border-[var(--border-color)] rounded-xl p-5">
                        <p className="text-sm text-[var(--foreground-muted)]">Total configurées</p>
                        <p className="text-2xl font-bold mt-1">{cryptos.length}</p>
                    </div>
                    <div className="bg-[var(--background-card)] border border-[var(--accent-success)]/30 rounded-xl p-5">
                        <p className="text-sm text-[var(--foreground-muted)]">Actives</p>
                        <p className="text-2xl font-bold mt-1 text-[var(--accent-success)]">{activeCount}</p>
                    </div>
                    <div className="bg-[var(--background-card)] border border-[var(--border-color)] rounded-xl p-5">
                        <p className="text-sm text-[var(--foreground-muted)]">Inactives</p>
                        <p className="text-2xl font-bold mt-1 text-[var(--foreground-muted)]">
                            {cryptos.length - activeCount}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Add/Edit Form */}
                    <Card
                        title={editingId ? "Modifier une crypto" : "Ajouter une crypto"}
                        icon={<PlusIcon size={24} />}
                        subtitle={editingId ? `Modification de l'ID: ${editingId}` : "Ajouter une nouvelle crypto à suivre"}
                    >
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-2">
                                    Symbole
                                </label>
                                <input
                                    type="text"
                                    value={formData.symbol}
                                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                                    placeholder="ex: BTC, ETH, SOL"
                                    className="w-full"
                                    required
                                    maxLength={50}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-2">
                                    Nom complet
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="ex: Bitcoin, Ethereum, Solana"
                                    className="w-full"
                                    required
                                    maxLength={100}
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="is_active" className="text-sm text-[var(--foreground)]">
                                    Activer le suivi immédiatement
                                </label>
                            </div>

                            {error && (
                                <div className="p-3 bg-[var(--accent-danger)]/10 border border-[var(--accent-danger)]/30 rounded-lg">
                                    <p className="text-sm text-[var(--accent-danger)] flex items-center gap-2"><XIcon size={16} /> {error}</p>
                                </div>
                            )}

                            {success && (
                                <div className="p-3 bg-[var(--accent-success)]/10 border border-[var(--accent-success)]/30 rounded-lg">
                                    <p className="text-sm text-[var(--accent-success)] flex items-center gap-2"><CheckIcon size={16} /> {success}</p>
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
                                    disabled={submitting || !formData.symbol || !formData.name}
                                    className={`btn btn-primary ${editingId ? 'w-2/3' : 'w-full'}`}
                                >
                                    {submitting ? (
                                        <>
                                            <span className="animate-spin">⏳</span>
                                            {editingId ? 'Mise à jour...' : 'Ajout en cours...'}
                                        </>
                                    ) : (
                                        <>
                                            {editingId ? <CheckIcon size={16} className="mr-2" /> : <PlusIcon size={16} className="mr-2" />}
                                            {editingId ? 'Mettre à jour' : 'Ajouter la crypto'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </Card>

                    {/* Crypto List */}
                    <Card title="Cryptos configurées" icon={<DiamondIcon size={24} />} subtitle={`${cryptos.length} crypto-monnaies`}>
                        {loading ? (
                            <LoadingSpinner size="md" text="Chargement..." />
                        ) : (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                {cryptos.length === 0 ? (
                                    <p className="text-[var(--foreground-muted)] text-center py-8">
                                        Aucune crypto configurée
                                    </p>
                                ) : (
                                    cryptos.map((crypto) => (
                                        <div
                                            key={crypto.id}
                                            className={`flex items-center justify-between p-4 rounded-xl border ${crypto.is_active
                                                ? 'bg-[var(--accent-success)]/5 border-[var(--accent-success)]/30'
                                                : 'bg-[var(--background-secondary)] border-[var(--border-color)]'
                                                } ${editingId === crypto.id ? 'ring-2 ring-[var(--accent-primary)]' : ''}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${crypto.is_active
                                                        ? 'bg-[var(--accent-success)]/20 text-[var(--accent-success)]'
                                                        : 'bg-[var(--border-color)] text-[var(--foreground-muted)]'
                                                        }`}
                                                >
                                                    {crypto.symbol.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{crypto.symbol}</p>
                                                    <p className="text-sm text-[var(--foreground-muted)]">{crypto.name}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span
                                                    className={`badge ${crypto.is_active ? 'badge-success' : 'badge-neutral'
                                                        }`}
                                                >
                                                    {crypto.is_active ? '✓ Active' : 'Inactive'}
                                                </span>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEdit(crypto)}
                                                        className="text-xs text-[var(--accent-primary)] hover:underline"
                                                    >
                                                        Modifier
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(crypto.id, crypto.symbol)}
                                                        className="text-xs text-[var(--accent-danger)] hover:underline"
                                                    >
                                                        Supprimer
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </Card>
                </div>

                {/* Visualization Manager */}
                <VisualizationManager />
            </main>
        </>
    );
}
