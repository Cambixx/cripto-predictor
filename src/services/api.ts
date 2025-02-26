import axios from 'axios';
import { API_CONFIG } from '../config/api';

const api = axios.create({
  baseURL: API_CONFIG.BINANCE.BASE_URL,
  headers: {
    'Accept': 'application/json',
  }
});

// Interceptor para manejar errores y rate limiting
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 429) {
      console.warn('Rate limit alcanzado, esperando antes de reintentar...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      return api.request(error.config);
    }
    console.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      config: error.config
    });
    return Promise.reject(error);
  }
);

// Cache para los pares de trading activos
let activeTradingPairs: string[] = [];
let lastPairsUpdate = 0;
const PAIRS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const getActiveTradingPairs = async (): Promise<string[]> => {
  const now = Date.now();
  
  // Usar caché si está disponible y no ha expirado
  if (activeTradingPairs.length > 0 && (now - lastPairsUpdate) < PAIRS_CACHE_DURATION) {
    return activeTradingPairs;
  }

  try {
    // Obtener todos los pares de trading con USDT
    const [exchangeInfo, tickers] = await Promise.all([
      api.get('/exchangeInfo'),
      api.get('/ticker/24hr')
    ]);

    // Filtrar símbolos que terminan en USDT y están activos para trading
    const validSymbols = new Set(
      exchangeInfo.data.symbols
        .filter((symbol: any) => 
          symbol.symbol.endsWith('USDT') && 
          symbol.status === 'TRADING' &&
          symbol.isSpotTradingAllowed
        )
        .map((symbol: any) => symbol.symbol)
    );

    // Filtrar y ordenar por volumen en USD
    const volumeData = tickers.data
      .filter((ticker: any) => 
        validSymbols.has(ticker.symbol) &&
        parseFloat(ticker.quoteVolume) >= API_CONFIG.BINANCE.MIN_VOLUME_USD
      )
      .sort((a: any, b: any) => 
        parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume)
      )
      .slice(0, API_CONFIG.BINANCE.MAX_PAIRS)
      .map((ticker: any) => ticker.symbol.replace('USDT', ''));

    // Actualizar caché
    activeTradingPairs = volumeData;
    lastPairsUpdate = now;

    return activeTradingPairs;
  } catch (error) {
    console.error('Error obteniendo pares de trading activos:', error);
    // Si hay error, devolver la caché aunque haya expirado
    return activeTradingPairs;
  }
};

export interface CoinData {
  symbol: string;
  price: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  quoteVolume: number;
}

export const getCoinData = async (symbol: string): Promise<CoinData> => {
  try {
    const pair = `${symbol}USDT`;
    const response = await api.get('/ticker/24hr', {
      params: {
        symbol: pair,
      },
    });

    return {
      symbol: response.data.symbol,
      price: parseFloat(response.data.lastPrice),
      priceChange: parseFloat(response.data.priceChange),
      priceChangePercent: parseFloat(response.data.priceChangePercent),
      volume: parseFloat(response.data.volume),
      quoteVolume: parseFloat(response.data.quoteVolume),
    };
  } catch (error) {
    console.error('Error fetching coin data:', error);
    throw new Error('No se pudo obtener la información de la moneda');
  }
};

export const getMarketData = async (limit: number = 5): Promise<CoinData[]> => {
  try {
    const activePairs = await getActiveTradingPairs();
    const selectedPairs = activePairs.slice(0, limit);
    
    const responses = await Promise.all(
      selectedPairs.map(symbol => 
        api.get('/ticker/24hr', {
          params: { symbol: `${symbol}USDT` },
        })
      )
    );

    return responses.map(response => ({
      symbol: response.data.symbol,
      price: parseFloat(response.data.lastPrice),
      priceChange: parseFloat(response.data.priceChange),
      priceChangePercent: parseFloat(response.data.priceChangePercent),
      volume: parseFloat(response.data.volume),
      quoteVolume: parseFloat(response.data.quoteVolume),
    }));
  } catch (error) {
    console.error('Error fetching market data:', error);
    throw new Error('No se pudieron obtener los datos del mercado');
  }
};

export const getCoinPriceHistory = async (
  symbol: string,
  timeframe: string,
): Promise<{prices: Array<{time: number, price: number}>}> => {
  try {
    const pair = `${symbol}USDT`;
    const timeframeConfig = API_CONFIG.BINANCE.TIMEFRAMES[timeframe as keyof typeof API_CONFIG.BINANCE.TIMEFRAMES];
    if (!timeframeConfig) {
      throw new Error(`Timeframe no soportado: ${timeframe}`);
    }

    const response = await api.get('/klines', {
      params: {
        symbol: pair,
        interval: timeframeConfig.interval,
        limit: timeframeConfig.limit,
      },
    });

    const prices = response.data.map((kline: any[]) => ({
      time: kline[0], // Tiempo de apertura
      price: parseFloat(kline[4]), // Precio de cierre
    }));

    return { prices };
  } catch (error) {
    console.error('Error fetching price history:', error);
    throw new Error('No se pudo obtener el historial de precios');
  }
}; 