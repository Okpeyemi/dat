// ============================================
// API Response Types for CRYPTO VIZ
// ============================================

// Health Check
export interface HealthCheckResponse {
    status: 'healthy' | 'unhealthy';
    service: string;
    version: string;
}

// Error Response
export interface ErrorResponse {
    error: string;
}

// Crypto Configuration
export interface CryptoConfiguration {
    id: number;
    symbol: string;
    name: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CryptoConfigurationRequest {
    symbol: string;
    name: string;
    is_active?: boolean;
}

export interface PatchedCryptoConfigurationRequest {
    symbol?: string;
    name?: string;
    is_active?: boolean;
}

export interface PaginatedCryptoConfigurationList {
    count: number;
    next: string | null;
    previous: string | null;
    results: CryptoConfiguration[];
}

// Visualization Configuration
export interface VisualizationParameter {
    id: number;
    name: string;
    crypto_symbol: string;
    time_range: string;
    chart_type: 'candlestick' | 'line' | 'area' | 'bar';
    indicators: string[];
    created_at: string;
    updated_at: string;
}

export interface VisualizationParameterRequest {
    name: string;
    crypto_symbol: string;
    time_range: string;
    chart_type: 'candlestick' | 'line' | 'area' | 'bar';
    indicators?: string[];
}

export interface PatchedVisualizationParameterRequest {
    name?: string;
    crypto_symbol?: string;
    time_range?: string;
    chart_type?: 'candlestick' | 'line' | 'area' | 'bar';
    indicators?: string[];
}

export interface PaginatedVisualizationParameterList {
    count: number;
    next: string | null;
    previous: string | null;
    results: VisualizationParameter[];
}

// Ticker Data
export interface TickerData {
    timestamp: string;
    pair: string;
    last: number;
    bid: number;
    ask: number;
    volume_24h: number;
}

export interface TickerHistoryResponse {
    pair: string;
    count: number;
    data: TickerData[];
}

// Trade Data
export interface TradeData {
    timestamp: string;
    pair: string;
    price: number;
    volume: number;
    side: 'b' | 's';
}

export interface TradeHistoryResponse {
    pair: string;
    count: number;
    data: TradeData[];
}

// Sentiment Data
export interface SentimentData {
    timestamp: string;
    crypto_symbol: string;
    sentiment_score: number;
    sentiment_label: 'positive' | 'negative' | 'neutral';
    source: string;
    confidence: number;
}

export interface SentimentHistoryResponse {
    crypto_symbol: string;
    count: number;
    data: SentimentData[];
}

// Prediction Data
export interface PredictionData {
    timestamp: string;
    crypto_symbol: string;
    predicted_price: number;
    actual_price: number | null;
    model_name: string;
    confidence_interval_low: number | null;
    confidence_interval_high: number | null;
}

export interface PredictionHistoryResponse {
    crypto_symbol: string;
    count: number;
    data: PredictionData[];
}

// Article Data
export interface ArticleData {
    timestamp: string;
    article_id: string;
    title: string;
    url: string;
    website: string;
    summary: string;
    cryptocurrencies_mentioned: string[];
    sentiment_score: number;
    sentiment_label: 'positive' | 'negative' | 'neutral';
}

export interface ArticleHistoryResponse {
    crypto_symbol: string;
    count: number;
    data: ArticleData[];
}

// Alert Data
export interface AlertData {
    timestamp: string;
    pair: string;
    last_price: number;
    change_percent: number;
    threshold: number;
    alert_type: 'PRICE_UP' | 'PRICE_DOWN';
}

export interface AlertHistoryResponse {
    pair: string;
    count: number;
    data: AlertData[];
}

// Query Parameters
export interface HistoryQueryParams {
    periode?: '1m' | '5m' | '30m' | '1h' | '24h' | '7d' | '30d';
    date_debut?: string;
    date_fin?: string;
    pair?: string;
    crypto_symbol?: string;
}
