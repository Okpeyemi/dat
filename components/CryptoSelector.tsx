'use client';

import { useEffect, useState } from 'react';
import { getCryptoConfigs } from '@/lib/api';
import type { CryptoConfiguration } from '@/lib/types';
import { SYMBOL_TO_PAIR } from '@/lib/config';

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

    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={loading}
            className="min-w-[150px]"
        >
            {showAll && <option value="">Toutes les cryptos</option>}
            {loading ? (
                <option>Chargement...</option>
            ) : (
                cryptos.map((crypto) => (
                    <option key={crypto.id} value={getValue(crypto.symbol)}>
                        {crypto.symbol} - {crypto.name}
                    </option>
                ))
            )}
        </select>
    );
}
