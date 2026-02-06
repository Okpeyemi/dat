// API Configuration
export const API_BASE_URL = 'http://10.50.4.81:8000';

export const ENDPOINTS = {
    health: '/api/v1/health/',
    cryptoConfig: '/api/v1/config/crypto/',
    cryptoConfigDetail: (id: number) => `/api/v1/config/crypto/${id}/`,
    visualizationConfig: '/api/v1/config/visualization/',
    visualizationConfigDetail: (id: number) => `/api/v1/config/visualization/${id}/`,
    ticker: '/api/v1/ticker/historique/',
    trade: '/api/v1/trade/historique/',
    sentiment: (symbol: string) => `/api/v1/sentiment/${symbol}/historique/`,
    prediction: (symbol: string) => `/api/v1/prediction/${symbol}/historique/`,
    article: '/api/v1/article/historique/',
    alert: '/api/v1/alert/historique/',
} as const;

export const PERIODS = ['live', '1m', '5m', '30m', '1h', '24h', '7d', '30d'] as const;
export type Period = typeof PERIODS[number];

// Mapping between crypto symbols and trading pairs
export const SYMBOL_TO_PAIR: Record<string, string> = {
    BTC: 'BTC/USD',
    ETH: 'ETH/USD',
    SOL: 'SOL/USD',
    ADA: 'ADA/USD',
    MATIC: 'MATIC/USD',
    DOT: 'DOT/USD',
    LINK: 'LINK/USD',
    USDT: 'USDT/USD',
};

export const PAIR_TO_SYMBOL: Record<string, string> = Object.fromEntries(
    Object.entries(SYMBOL_TO_PAIR).map(([k, v]) => [v, k])
);
