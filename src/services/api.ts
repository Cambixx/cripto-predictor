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
let activePairsCache: string[] | null = null;
let lastActivePairsUpdate = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export interface CoinData {
  symbol: string;
  name: string;
  price: number;
  priceChangePercent: number;
  volume24h: number;
  marketCap: number;
  supply: {
    circulating: number;
    max?: number;
  };
  change24h: number;
  high24h: number;
  low24h: number;
}

export interface PriceHistoryPoint {
  time: number;
  price: number;
  volume?: number;
}

export interface PriceHistory {
  symbol: string;
  timeframe: string;
  prices: PriceHistoryPoint[];
}

// Obtener datos de un activo usando la API real de Binance
export const getCoinData = async (symbol: string): Promise<CoinData> => {
  // Convertir 'BTC' a 'BTCUSDT' para la API de Binance
  const pair = symbol.includes('/') 
    ? symbol.replace('/', '') 
    : `${symbol}${API_CONFIG.BINANCE.DEFAULT_CURRENCY}`;
  
  try {
    // Obtener datos del ticker de 24h
    const response = await api.get(API_CONFIG.BINANCE.ENDPOINTS.TICKER_24H, {
      params: {
        symbol: pair
      }
    });
    
    const data = response.data;
    
    // Obtener información adicional sobre el activo si está disponible
    let supply = {
      circulating: 0,
      max: undefined
    };
    
    try {
      // Esta parte es opcional ya que Binance no proporciona información de supply
      // En una aplicación real, podríamos obtener esta info de otra API como CoinGecko
      const coinName = symbol.split('/')[0];
    } catch (error) {
      console.warn(`No se pudo obtener información de supply para ${symbol}`);
    }
    
    return {
      symbol: symbol.includes('/') ? symbol : `${symbol}/${API_CONFIG.BINANCE.DEFAULT_CURRENCY}`,
      name: getCoinName(symbol.split('/')[0] || symbol),
      price: parseFloat(data.lastPrice),
      priceChangePercent: parseFloat(data.priceChangePercent),
      volume24h: parseFloat(data.volume),
      marketCap: 0, // Binance no proporciona esta información directamente
      supply,
      change24h: parseFloat(data.priceChangePercent),
      high24h: parseFloat(data.highPrice),
      low24h: parseFloat(data.lowPrice),
    };
  } catch (error) {
    console.error(`Error al obtener datos para ${symbol}:`, error);
    throw new Error(`No se pudieron obtener datos para ${symbol}`);
  }
};

// Obtener historial de precios de un activo usando la API real de Binance
export const getCoinPriceHistory = async (
  symbol: string,
  timeframe: string
): Promise<PriceHistory> => {
  // Convertir 'BTC' a 'BTCUSDT' para la API de Binance
  const pair = symbol.includes('/') 
    ? symbol.replace('/', '') 
    : `${symbol}${API_CONFIG.BINANCE.DEFAULT_CURRENCY}`;
  
  let interval, limit;
  
  // Mapear el timeframe a la configuración de Binance
  switch(timeframe) {
    case 'DAY':
      interval = API_CONFIG.BINANCE.TIMEFRAMES.DAY.interval;
      limit = API_CONFIG.BINANCE.TIMEFRAMES.DAY.limit;
      break;
    case 'WEEK':
      interval = API_CONFIG.BINANCE.TIMEFRAMES.WEEK.interval;
      limit = API_CONFIG.BINANCE.TIMEFRAMES.WEEK.limit;
      break;
    case 'MONTH':
      interval = API_CONFIG.BINANCE.TIMEFRAMES.MONTH.interval;
      limit = API_CONFIG.BINANCE.TIMEFRAMES.MONTH.limit;
      break;
    default:
      interval = '1h';
      limit = 24;
  }
  
  try {
    // Obtener datos de klines (velas)
    const response = await api.get(API_CONFIG.BINANCE.ENDPOINTS.KLINES, {
      params: {
        symbol: pair,
        interval: interval,
        limit: limit
      }
    });
    
    // Transformar datos a nuestro formato
    const prices: PriceHistoryPoint[] = response.data.map((candle: any) => {
      return {
        time: candle[0], // timestamp de apertura
        price: parseFloat(candle[4]), // precio de cierre
        volume: parseFloat(candle[5]) // volumen
      };
    });
    
    return {
      symbol: symbol.includes('/') ? symbol : `${symbol}/${API_CONFIG.BINANCE.DEFAULT_CURRENCY}`,
      timeframe,
      prices
    };
  } catch (error) {
    console.error(`Error al obtener historial de precios para ${symbol}:`, error);
    throw new Error(`No se pudo obtener el historial de precios para ${symbol}`);
  }
};

// Obtener los pares de trading activos desde Binance
export const getActiveTradingPairs = async (): Promise<string[]> => {
  // Usar caché si está disponible y no ha expirado
  if (activePairsCache && Date.now() - lastActivePairsUpdate < CACHE_TTL) {
    return activePairsCache;
  }
  
  try {
    // Obtener información de todos los pares disponibles
    const response = await api.get(API_CONFIG.BINANCE.ENDPOINTS.EXCHANGE_INFO);
    
    // Filtrar por pares USDT con volumen significativo
    const allPairs = response.data.symbols
      .filter((symbol: any) => 
        symbol.status === 'TRADING' && 
        symbol.quoteAsset === API_CONFIG.BINANCE.DEFAULT_CURRENCY
      )
      .map((symbol: any) => `${symbol.baseAsset}/${symbol.quoteAsset}`);
    
    // Actualizar caché
    activePairsCache = allPairs;
    lastActivePairsUpdate = Date.now();
    
    return allPairs;
  } catch (error) {
    console.error('Error al obtener pares de trading activos:', error);
    
    if (activePairsCache) {
      console.warn('Usando datos en caché debido al error');
      return activePairsCache;
    }
    
    // Si no hay caché, lanzamos el error
    throw new Error('No se pudieron obtener los pares de trading activos');
  }
};

// Obtener datos del mercado para mostrar en la página principal
export const getMarketData = async (limit: number = 5): Promise<CoinData[]> => {
  try {
    // Obtener los pares de trading activos
    const activePairs = await getActiveTradingPairs();
    
    // Filtrar solo los top N pares
    const topPairs = activePairs.slice(0, limit);
    
    // Obtener datos completos para cada par
    const marketData = await Promise.all(
      topPairs.map(symbol => getCoinData(symbol))
    );
    
    return marketData;
  } catch (error) {
    console.error('Error al obtener datos del mercado:', error);
    throw new Error('No se pudieron obtener los datos del mercado');
  }
};

// Función auxiliar para obtener el nombre completo de una criptomoneda
function getCoinName(symbol: string): string {
  const coinNames: Record<string, string> = {
    'BTC': 'Bitcoin',
    'ETH': 'Ethereum',
    'SOL': 'Solana',
    'ADA': 'Cardano',
    'DOT': 'Polkadot',
    'AVAX': 'Avalanche',
    'MATIC': 'Polygon',
    'LINK': 'Chainlink',
    'XRP': 'Ripple',
    'ATOM': 'Cosmos',
    'DOGE': 'Dogecoin',
    'LTC': 'Litecoin',
    'NEAR': 'NEAR Protocol',
    'UNI': 'Uniswap',
    'USDT': 'Tether',
  };
  
  return coinNames[symbol] || symbol;
} 