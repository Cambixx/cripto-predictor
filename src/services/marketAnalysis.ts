import axios from 'axios';

interface MarketData {
  symbol: string;
  price: number;
  volume: number;
  change24h: number;
  high24h: number;
  low24h: number;
  candlesticks: {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
}

export interface TechnicalIndicators {
  rsi: number;
  macd: {
    value: number;
    signal: number;
    histogram: number;
  };
  volumeProfile: 'high' | 'medium' | 'low';
  breakoutPotential: number;
  trendStrength: number;
  supportLevel: number;
  resistanceLevel: number;
}

// Función para calcular el RSI
const calculateRSI = (closePrices: number[], periods: number = 14): number => {
  let gains = 0;
  let losses = 0;

  for (let i = 1; i < periods + 1; i++) {
    const difference = closePrices[i] - closePrices[i - 1];
    if (difference >= 0) {
      gains += difference;
    } else {
      losses -= difference;
    }
  }

  const avgGain = gains / periods;
  const avgLoss = losses / periods;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

// Función para calcular el MACD
const calculateMACD = (closePrices: number[]): { value: number; signal: number; histogram: number } => {
  // EMA 12
  const ema12 = closePrices.slice(-12).reduce((acc, price, i, arr) => {
    return price * (2 / (12 + 1)) + acc * (1 - (2 / (12 + 1)));
  }, closePrices[0]);

  // EMA 26
  const ema26 = closePrices.slice(-26).reduce((acc, price, i, arr) => {
    return price * (2 / (26 + 1)) + acc * (1 - (2 / (26 + 1)));
  }, closePrices[0]);

  const macdValue = ema12 - ema26;
  const signal = macdValue * (2 / (9 + 1));
  const histogram = macdValue - signal;

  return { value: macdValue, signal, histogram };
};

// Función para analizar el perfil de volumen
const analyzeVolumeProfile = (volume24h: number, avgVolume: number): 'high' | 'medium' | 'low' => {
  const ratio = volume24h / avgVolume;
  if (ratio >= 1.5) return 'high';
  if (ratio >= 0.75) return 'medium';
  return 'low';
};

// Función para detectar niveles de soporte y resistencia
const findSupportResistanceLevels = (candlesticks: MarketData['candlesticks']) => {
  const prices = candlesticks.map(c => c.close);
  const sortedPrices = [...prices].sort((a, b) => a - b);
  
  // Encontrar clusters de precios
  const clusters: number[][] = [];
  let currentCluster: number[] = [sortedPrices[0]];
  
  for (let i = 1; i < sortedPrices.length; i++) {
    const priceDiff = Math.abs(sortedPrices[i] - currentCluster[0]);
    if (priceDiff <= currentCluster[0] * 0.01) { // 1% de tolerancia
      currentCluster.push(sortedPrices[i]);
    } else {
      if (currentCluster.length > 3) { // Mínimo 3 toques para considerar un nivel
        clusters.push(currentCluster);
      }
      currentCluster = [sortedPrices[i]];
    }
  }
  
  // Obtener niveles significativos
  const levels = clusters.map(cluster => 
    cluster.reduce((sum, price) => sum + price, 0) / cluster.length
  );
  
  const currentPrice = prices[prices.length - 1];
  const support = Math.max(...levels.filter(l => l < currentPrice));
  const resistance = Math.min(...levels.filter(l => l > currentPrice));
  
  return { support, resistance };
};

// Función para calcular el potencial de ruptura
const calculateBreakoutPotential = (
  candlesticks: MarketData['candlesticks'],
  resistance: number,
  currentPrice: number
): number => {
  const volatility = Math.std(candlesticks.map(c => c.high - c.low));
  const distanceToResistance = Math.abs(resistance - currentPrice);
  const volumeTrend = candlesticks.slice(-5).every((c, i, arr) => 
    i === 0 || c.volume >= arr[i-1].volume
  );
  
  let potential = 0;
  
  // Factores que aumentan el potencial de ruptura
  if (distanceToResistance < volatility * 2) potential += 30;
  if (volumeTrend) potential += 30;
  if (candlesticks.slice(-3).every(c => c.close > c.open)) potential += 20;
  if (currentPrice > candlesticks.slice(-10).reduce((sum, c) => sum + c.close, 0) / 10) potential += 20;
  
  return Math.min(potential, 100);
};

// Función para calcular la fuerza de la tendencia
const calculateTrendStrength = (candlesticks: MarketData['candlesticks']): number => {
  const prices = candlesticks.map(c => c.close);
  const sma20 = prices.slice(-20).reduce((sum, price) => sum + price, 0) / 20;
  const sma50 = prices.slice(-50).reduce((sum, price) => sum + price, 0) / 50;
  
  let strength = 0;
  
  // Factores que indican una tendencia fuerte
  if (prices[prices.length - 1] > sma20) strength += 30;
  if (sma20 > sma50) strength += 30;
  if (prices.slice(-5).every((price, i) => i === 0 || price >= prices[i-1])) strength += 20;
  if (candlesticks.slice(-5).every(c => c.volume >= candlesticks[0].volume)) strength += 20;
  
  return Math.min(strength, 100);
};

export const analyzeMarket = async (symbols: string[]): Promise<Map<string, TechnicalIndicators>> => {
  const results = new Map<string, TechnicalIndicators>();
  
  try {
    // Obtener datos del mercado para cada símbolo
    const marketDataPromises = symbols.map(async symbol => {
      const response = await axios.get(`https://api.binance.com/api/v3/klines`, {
        params: {
          symbol: symbol.replace('/', ''),
          interval: '1h',
          limit: 100
        }
      });
      
      // Transformar datos de la API
      const candlesticks = response.data.map(d => ({
        timestamp: d[0],
        open: parseFloat(d[1]),
        high: parseFloat(d[2]),
        low: parseFloat(d[3]),
        close: parseFloat(d[4]),
        volume: parseFloat(d[5])
      }));
      
      const closePrices = candlesticks.map(c => c.close);
      const currentPrice = closePrices[closePrices.length - 1];
      
      // Calcular indicadores técnicos
      const rsi = calculateRSI(closePrices);
      const macd = calculateMACD(closePrices);
      const avgVolume = candlesticks.reduce((sum, c) => sum + c.volume, 0) / candlesticks.length;
      const volumeProfile = analyzeVolumeProfile(candlesticks[candlesticks.length - 1].volume, avgVolume);
      const { support, resistance } = findSupportResistanceLevels(candlesticks);
      const breakoutPotential = calculateBreakoutPotential(candlesticks, resistance, currentPrice);
      const trendStrength = calculateTrendStrength(candlesticks);
      
      results.set(symbol, {
        rsi,
        macd: {
          value: macd.value,
          signal: macd.signal,
          histogram: macd.histogram
        },
        volumeProfile,
        breakoutPotential,
        trendStrength,
        supportLevel: support,
        resistanceLevel: resistance
      });
    });
    
    await Promise.all(marketDataPromises);
    return results;
    
  } catch (error) {
    console.error('Error analyzing market:', error);
    throw error;
  }
};

// Función para identificar las mejores oportunidades
export const findBestOpportunities = (
  technicalData: Map<string, TechnicalIndicators>,
  marketData: Map<string, MarketData>,
  limit: number = 10
) => {
  const opportunities = Array.from(technicalData.entries())
    .map(([symbol, indicators]) => {
      const market = marketData.get(symbol)!;
      const score = calculateOpportunityScore(indicators, market);
      
      return {
        symbol,
        score,
        ...indicators,
        price: market.price,
        change24h: market.change24h,
        volume24h: market.volume,
        potentialReturn: ((indicators.resistanceLevel - market.price) / market.price) * 100
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  
  return opportunities;
};

// Función para calcular el score de oportunidad
const calculateOpportunityScore = (
  indicators: TechnicalIndicators,
  marketData: MarketData
): number => {
  let score = 0;
  
  // RSI
  if (indicators.rsi <= 30) score += 20; // Sobreventa
  else if (indicators.rsi <= 45) score += 15;
  else if (indicators.rsi >= 70) score -= 10; // Sobrecompra
  
  // MACD
  if (indicators.macd.histogram > 0 && indicators.macd.value > indicators.macd.signal) {
    score += 15;
  }
  
  // Volumen
  if (indicators.volumeProfile === 'high') score += 20;
  else if (indicators.volumeProfile === 'medium') score += 10;
  
  // Potencial de ruptura
  score += indicators.breakoutPotential * 0.2;
  
  // Fuerza de la tendencia
  score += indicators.trendStrength * 0.2;
  
  // Retorno potencial
  const potentialReturn = ((indicators.resistanceLevel - marketData.price) / marketData.price) * 100;
  if (potentialReturn > 10) score += 15;
  else if (potentialReturn > 5) score += 10;
  else if (potentialReturn > 2) score += 5;
  
  return Math.min(score, 100);
}; 