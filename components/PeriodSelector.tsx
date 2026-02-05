'use client';

import { PERIODS, type Period } from '@/lib/config';

interface PeriodSelectorProps {
    value: Period;
    onChange: (period: Period) => void;
}

const periodLabels: Record<Period, string> = {
    '1h': '1 heure',
    '24h': '24 heures',
    '7d': '7 jours',
    '30d': '30 jours',
};

export default function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
    return (
        <div className="flex items-center gap-1 bg-[var(--background-secondary)] p-1 rounded-lg">
            {PERIODS.map((period) => (
                <button
                    key={period}
                    onClick={() => onChange(period)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${value === period
                        ? 'bg-[var(--accent-primary)] text-white'
                        : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-card)]'
                        }`}
                >
                    {periodLabels[period]}
                </button>
            ))}
        </div>
    );
}
