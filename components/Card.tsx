import { ReactNode } from 'react';

interface CardProps {
    title?: string;
    subtitle?: string;
    icon?: ReactNode;
    children: ReactNode;
    className?: string;
    headerAction?: ReactNode;
}

import {
    Card as ShadcnCard,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardAction
} from "@/components/ui/card";

export default function Card({
    title,
    subtitle,
    icon,
    children,
    className = '',
    headerAction,
}: CardProps) {
    return (
        <ShadcnCard className={`overflow-hidden py-8 card-hover animate-fade-in ${className}`}>
            {(title || headerAction) && (
                <CardHeader>
                    {headerAction && <CardAction>{headerAction}</CardAction>}
                    <div className="flex items-center gap-3">
                        {icon && <span className="text-[var(--accent-primary)]">{icon}</span>}
                        <div>
                            {title && <CardTitle className="text-[var(--foreground)]">{title}</CardTitle>}
                            {subtitle && <CardDescription className="text-xs text-[var(--foreground-muted)]">{subtitle}</CardDescription>}
                        </div>
                    </div>
                </CardHeader>
            )}
            <CardContent>{children}</CardContent>
        </ShadcnCard>
    );
}

// Stat Card variant
interface StatCardProps {
    label: string;
    value: string | number;
    change?: number;
    icon?: ReactNode;
    loading?: boolean;
}

export function StatCard({ label, value, change, icon, loading }: StatCardProps) {
    return (
        <ShadcnCard className="card-hover animate-fade-in">
            <CardContent className="p-6">
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
                    </div>
                    {icon && <span className="text-[var(--accent-primary)] opacity-60">{icon}</span>}
                </div>
            </CardContent>
        </ShadcnCard>
    );
}
