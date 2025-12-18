import { API_CONFIG } from '../index';

const CACHE_PREFIX = 'macro_dashboard_cache_';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const AlphaVantageService = {
  async fetchWithCache<T>(
    key: string,
    statusMsg: string,
    onStatus: (msg: string) => void,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      const { data, timestamp } = JSON.parse(cached) as CacheItem<T>;
      if (Date.now() - timestamp < CACHE_TTL) {
        console.log(`[Cache Hit] ${key}`);
        onStatus(`Using cached ${statusMsg}...`);
        return data;
      }
    }

    console.log(`[Cache Miss] ${key}`);
    onStatus(`Fetching ${statusMsg}...`);

    // Add 1.5s delay to avoid rate limits on free tier
    await delay(1500);

    const data = await fetcher();
    localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
    return data;
  },

  async getDailySeries(symbol: string, apiKey: string, onStatus: (msg: string) => void) {
    return this.fetchWithCache(`daily_${symbol}`, `${symbol} stock data`, onStatus, async () => {
      const response = await fetch(
        `${API_CONFIG.alphaVantage}?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`
      );
      const data = await response.json();
      if (!data['Time Series (Daily)']) throw new Error(data['Note'] || 'No stock data');
      return data['Time Series (Daily)'];
    });
  },

  async getTreasuryYield(maturity: '10year' | '2year', apiKey: string, onStatus: (msg: string) => void) {
    return this.fetchWithCache(`yield_${maturity}`, `${maturity} treasury yield`, onStatus, async () => {
      const response = await fetch(
        `${API_CONFIG.alphaVantage}?function=TREASURY_YIELD&interval=daily&maturity=${maturity}&apikey=${apiKey}`
      );
      const data = await response.json();
      if (!data.data) throw new Error(data['Note'] || 'No yield data');
      return data.data;
    });
  },

  async getEconomicIndicator(indicator: 'UNEMPLOYMENT' | 'CPI', apiKey: string, onStatus: (msg: string) => void) {
    return this.fetchWithCache(`econ_${indicator}`, `${indicator.toLowerCase()} data`, onStatus, async () => {
      const response = await fetch(
        `${API_CONFIG.alphaVantage}?function=${indicator}&apikey=${apiKey}`
      );
      const data = await response.json();
      if (!data.data) throw new Error(data['Note'] || 'No econ data');
      return data.data;
    });
  }
};
