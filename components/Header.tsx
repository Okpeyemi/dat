'use client';

import { useEffect, useState } from 'react';
import { getHealthCheck } from '@/lib/api';
import type { HealthCheckResponse } from '@/lib/types';

interface HeaderProps {
    title: string;
    subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
    const [health, setHealth] = useState<HealthCheckResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function checkHealth() {
            try {
                const data = await getHealthCheck();
                setHealth(data);
                setError(false);
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        }

        checkHealth();
        // Refresh every 30 seconds
        const interval = setInterval(checkHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <header className="sticky top-0 z-40 bg-[var(--background)]/80 backdrop-blur-lg border-b border-[var(--border-color)] px-8 py-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-[var(--foreground)]">{title}</h1>
                </div>

                <div className="flex items-center gap-4">
                    {/* API Status */}
                    <div className="flex items-center gap-2">
                        {loading ? (
                            <span className="badge badge-neutral">
                                <span className="animate-spin">⏳</span>
                                Connexion...
                            </span>
                        ) : error ? (
                            <span className="badge badge-danger">
                                <span>❌</span>
                                API Hors ligne
                            </span>
                        ) : health?.status === 'healthy' ? (
                            <span className="badge badge-success">
                                <span className="w-2 h-2 rounded-full bg-[var(--accent-success)] animate-pulse"></span>
                                API Active
                            </span>
                        ) : (
                            <span className="badge badge-warning">
                                <span>⚠️</span>
                                API Dégradée
                            </span>
                        )}
                    </div>

                    {/* Current time */}
                    <div className="text-sm text-[var(--foreground-muted)]">
                        {new Date().toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </div>
                </div>
            </div>
        </header>
    );
}
