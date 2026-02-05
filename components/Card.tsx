import { ReactNode } from 'react';

interface CardProps {
    title?: string;
    subtitle?: string;
    icon?: ReactNode;
    children: ReactNode;
    className?: string;
    headerAction?: ReactNode;
}

export default function Card({
    title,
    subtitle,
    icon,
    children,
    className = '',
    headerAction,
}: CardProps) {
    return (
        <div
            className={`bg-[var(--background-card)] border border-[var(--border-color)] rounded-xl overflow-hidden card-hover animate-fade-in ${className}`}
        >
            {(title || headerAction) && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
                    <div className="flex items-center gap-3">
                        {icon && <span className="text-[var(--accent-primary)]">{icon}</span>}
                        <div>
                            {title && (
                                <h3 className="font-semibold text-[var(--foreground)]">{title}</h3>
                            )}
                            {subtitle && (
                                <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                    {headerAction}
                </div>
            )}
            <div className="p-6">{children}</div>
        </div>
    );
}

// Stat Card variant
interface StatCardProps {
    label: string;
    value: string | number;
    change?: number;
    icon?: ReactNode;
    subValue?: ReactNode; // New prop for extra context
    loading?: boolean;
}

export function StatCard({ label, value, change, icon, subValue, loading }: StatCardProps) {
    return (
        <div className="bg-[var(--background-card)] border border-[var(--border-color)] rounded-xl p-6 card-hover animate-fade-in">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-[var(--foreground-muted)]">{label}</p>
                    {loading ? (
                        <div className="h-8 w-24 bg-[var(--border-color)] rounded animate-pulse mt-2"></div>
                    ) : (
                        <p className="text-2xl font-bold text-[var(--foreground)] mt-1">{value}</p>
                    )}
                    {change !== undefined && !loading && (
                        <p
                            className={`text-sm mt-2 flex items-center gap-1 ${change >= 0 ? 'text-[var(--accent-success)]' : 'text-[var(--accent-danger)]'
                                }`}
                        >
                            <span>{change >= 0 ? '↑' : '↓'}</span>
                            <span>{Math.abs(change).toFixed(2)}%</span>
                        </p>
                    )}
                    {subValue && !loading && (
                        <div className="mt-2 text-xs text-[var(--foreground-muted)] opacity-80">
                            {subValue}
                        </div>
                    )}
                </div>
                {icon && <span className="text-[var(--accent-primary)] opacity-60">{icon}</span>}
            </div>
        </div>
    );
}
