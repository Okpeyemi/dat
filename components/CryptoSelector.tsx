'use client';

import { useEffect, useState } from 'react';
import { getCryptoConfigs } from '@/lib/api';
import type { CryptoConfiguration } from '@/lib/types';
import { SYMBOL_TO_PAIR } from '@/lib/config';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface CryptoSelectorProps {
    value: string;
    onChange: (symbol: string) => void;
    mode?: 'symbol' | 'pair';
    showAll?: boolean;
}

export default function CryptoSelector({
    value,
    onChange,
    mode = 'symbol',
    showAll = false,
}: CryptoSelectorProps) {
    const [cryptos, setCryptos] = useState<CryptoConfiguration[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadCryptos() {
            try {
                const data = await getCryptoConfigs();
                setCryptos(data.results.filter((c) => c.is_active));
            } catch (error) {
                console.error('Failed to load cryptos:', error);
            } finally {
                setLoading(false);
            }
        }
        loadCryptos();
    }, []);

    const getValue = (symbol: string) => {
        if (mode === 'pair') {
            // For ticker/trade API: return as-is (already pair format like "ETH/USD")
            return SYMBOL_TO_PAIR[symbol] || symbol;
        }
        // For prediction/sentiment API: extract just the symbol (before "/")
        // e.g., "ETH/USD" -> "ETH"
        return symbol.includes('/') ? symbol.split('/')[0] : symbol;
    };

    if (loading) {
        return <Skeleton className="h-10 w-[180px]" />;
    }

    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sélectionner actif" />
            </SelectTrigger>
            <SelectContent>
                {showAll && <SelectItem value="all">Toutes les cryptos</SelectItem>}
                {cryptos.map((crypto) => {
                    const val = getValue(crypto.symbol);
                    return (
                        <SelectItem key={crypto.id} value={val}>
                            {crypto.symbol} - {crypto.name}
                        </SelectItem>
                    );
                })}
            </SelectContent>
        </Select>
    );
}
