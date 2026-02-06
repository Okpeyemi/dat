'use client';

import { PERIODS, type Period } from '@/lib/config';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface PeriodSelectorProps {
    value: Period;
    onChange: (period: Period) => void;
}

const periodLabels: Record<Period, string> = {
    'live': 'Live',
    '1m': '1 minute',
    '5m': '5 minutes',
    '30m': '30 minutes',
    '1h': '1 heure',
    '24h': '24 heures',
    '7d': '7 jours',
    '30d': '30 jours',
};

export default function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
    return (
        <Select value={value} onValueChange={(val) => onChange(val as Period)}>
            <SelectTrigger className="w-[140px] bg-background">
                <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
                {PERIODS.map((period) => (
                    <SelectItem key={period} value={period}>
                        {periodLabels[period]}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
