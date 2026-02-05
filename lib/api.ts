import { API_BASE_URL, ENDPOINTS } from './config';
import type {
    HealthCheckResponse,
    PaginatedCryptoConfigurationList,
    CryptoConfiguration,
    CryptoConfigurationRequest,
    VisualizationParameter,
    VisualizationParameterRequest,
    PaginatedVisualizationParameterList,
    TickerHistoryResponse,
    TradeHistoryResponse,
    SentimentHistoryResponse,
    PredictionHistoryResponse,
    ArticleHistoryResponse,
    AlertHistoryResponse,
    HistoryQueryParams,
} from './types';

// ============================================
// API Client for CRYPTO VIZ
// ============================================

class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`[API] Fetching: ${url}`);

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new ApiError(response.status, error.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log(`[API] Response from ${endpoint}:`, data);
        return data;
    } catch (error) {
        console.error(`[API] Error fetching ${url}:`, error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(0, 'Network error - API unreachable');
    }
}

function buildQueryString(params: HistoryQueryParams): string {
    const searchParams = new URLSearchParams();

    if (params.periode) searchParams.append('periode', params.periode);
    if (params.date_debut) searchParams.append('date_debut', params.date_debut);
    if (params.date_fin) searchParams.append('date_fin', params.date_fin);
    if (params.pair) searchParams.append('pair', params.pair);
    if (params.crypto_symbol) searchParams.append('crypto_symbol', params.crypto_symbol);

    const query = searchParams.toString();
    return query ? `?${query}` : '';
}

// ============================================
// API Functions
// ============================================

// Health Check
export async function getHealthCheck(): Promise<HealthCheckResponse> {
    return fetchApi<HealthCheckResponse>(ENDPOINTS.health);
}

// Crypto Configuration
export async function getCryptoConfigs(): Promise<PaginatedCryptoConfigurationList> {
    return fetchApi<PaginatedCryptoConfigurationList>(ENDPOINTS.cryptoConfig);
}

export async function createCryptoConfig(
    data: CryptoConfigurationRequest
): Promise<CryptoConfiguration> {
    return fetchApi<CryptoConfiguration>(ENDPOINTS.cryptoConfig, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function getCryptoConfig(id: number): Promise<CryptoConfiguration> {
    return fetchApi<CryptoConfiguration>(ENDPOINTS.cryptoConfigDetail(id));
}

export async function updateCryptoConfig(
    id: number,
    data: CryptoConfigurationRequest
): Promise<CryptoConfiguration> {
    return fetchApi<CryptoConfiguration>(ENDPOINTS.cryptoConfigDetail(id), {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function patchCryptoConfig(
    id: number,
    data: Partial<CryptoConfigurationRequest>
): Promise<CryptoConfiguration> {
    return fetchApi<CryptoConfiguration>(ENDPOINTS.cryptoConfigDetail(id), {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}

export async function deleteCryptoConfig(id: number): Promise<void> {
    return fetchApi<void>(ENDPOINTS.cryptoConfigDetail(id), {
        method: 'DELETE',
    });
}

// Visualization Configuration
export async function getVisualizationConfigs(
    page?: number
): Promise<PaginatedVisualizationParameterList> {
    const query = page ? `?page=${page}` : '';
    return fetchApi<PaginatedVisualizationParameterList>(`${ENDPOINTS.visualizationConfig}${query}`);
}

export async function createVisualizationConfig(
    data: VisualizationParameterRequest
): Promise<VisualizationParameter> {
    return fetchApi<VisualizationParameter>(ENDPOINTS.visualizationConfig, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function getVisualizationConfig(id: number): Promise<VisualizationParameter> {
    return fetchApi<VisualizationParameter>(ENDPOINTS.visualizationConfigDetail(id));
}

export async function updateVisualizationConfig(
    id: number,
    data: VisualizationParameterRequest
): Promise<VisualizationParameter> {
    return fetchApi<VisualizationParameter>(ENDPOINTS.visualizationConfigDetail(id), {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function patchVisualizationConfig(
    id: number,
    data: Partial<VisualizationParameterRequest>
): Promise<VisualizationParameter> {
    return fetchApi<VisualizationParameter>(ENDPOINTS.visualizationConfigDetail(id), {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}

export async function deleteVisualizationConfig(id: number): Promise<void> {
    return fetchApi<void>(ENDPOINTS.visualizationConfigDetail(id), {
        method: 'DELETE',
    });
}

// Ticker History
export async function getTickerHistory(
    params: HistoryQueryParams = {}
): Promise<TickerHistoryResponse> {
    const query = buildQueryString(params);
    return fetchApi<TickerHistoryResponse>(`${ENDPOINTS.ticker}${query}`);
}

// Trade History
export async function getTradeHistory(
    params: HistoryQueryParams = {}
): Promise<TradeHistoryResponse> {
    const query = buildQueryString(params);
    return fetchApi<TradeHistoryResponse>(`${ENDPOINTS.trade}${query}`);
}

// Sentiment History
export async function getSentimentHistory(
    cryptoSymbol: string,
    params: Omit<HistoryQueryParams, 'crypto_symbol' | 'pair'> = {}
): Promise<SentimentHistoryResponse> {
    const query = buildQueryString(params);
    return fetchApi<SentimentHistoryResponse>(`${ENDPOINTS.sentiment(cryptoSymbol)}${query}`);
}

// Prediction History
export async function getPredictionHistory(
    cryptoSymbol: string,
    params: Omit<HistoryQueryParams, 'crypto_symbol' | 'pair'> = {}
): Promise<PredictionHistoryResponse> {
    const query = buildQueryString(params);
    return fetchApi<PredictionHistoryResponse>(`${ENDPOINTS.prediction(cryptoSymbol)}${query}`);
}

// Article History
export async function getArticleHistory(
    params: HistoryQueryParams = {}
): Promise<ArticleHistoryResponse> {
    const query = buildQueryString(params);
    return fetchApi<ArticleHistoryResponse>(`${ENDPOINTS.article}${query}`);
}

// Alert History
export async function getAlertHistory(
    params: HistoryQueryParams = {}
): Promise<AlertHistoryResponse> {
    const query = buildQueryString(params);
    return fetchApi<AlertHistoryResponse>(`${ENDPOINTS.alert}${query}`);
}

// Helper Mappings
export const SYMBOL_TO_PAIR: Record<string, string> = {
    'BTC': 'XXBTZEUR',
    'ETH': 'XETHZEUR',
    'SOL': 'SOLEUR',
    'DOGE': 'XDGEZEUR',
    'ADA': 'ADAEUR',
    'XRP': 'XXRPZEUR',
    'DOT': 'DOTEUR',
    'LTC': 'XLTCZEUR',
    'LINK': 'LINKEUR'
};

export { ApiError };
