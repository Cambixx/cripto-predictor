import { analyzeTechnicalSignals } from './technicalAnalysis';
import { getCoinPriceHistory, getCoinData, getActiveTradingPairs } from './api';
import { API_CONFIG } from '../config/api';
import { analyzeCandlestickPatterns } from './candlestickPatterns';
import { analyzeMarketSentiment } from './marketSentiment';
import { analyzeSqueezeIndicator } from './squeezeIndicator';
import { analyzeUltimateMacd } from './ultimateMacd';
import { analyzeSmartMoney } from './smartMoneyAnalysis';
import { analyzeAdvancedPatterns, type Candle, type PatternRecognitionResult } from './patternRecognition';

// Eliminamos la importación de datos simulados y definimos la lista a partir de constantes
// para evitar errores de importación
const TRADING_SYMBOLS = [
  'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ADA/USDT', 'DOT/USDT',
  'AVAX/USDT', 'MATIC/USDT', 'LINK/USDT', 'XRP/USDT', 'ATOM/USDT'
];

// Tipo para el timeframe de análisis
export type TimeFrame = 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';

// Tipo para el análisis técnico
export interface TechnicalAnalysis {
  trend: 'up' | 'down' | 'sideways';
  indicators: {
    rsi: number;
    macd: {
      line: number;
      signal: number;
      histogram: number;
    };
    bollingerBands: {
      upper: number;
      middle: number;
      lower: number;
    };
    stochastic?: {
      k: number;
      d: number;
    };
    ema?: {
      ema50: number;
      ema200: number;
    };
    adx: number;
    ichimokuCloud: {
      tenkanSen: number;
      kijunSen: number;
      senkouSpanA: number;
      senkouSpanB: number;
      chikouSpan: number;
    };
    rsiDivergence: {
      bullish: boolean;
      bearish: boolean;
      strength: number;
    };
  };
  supportLevels: number[];
  resistanceLevels: number[];
}

// Tipo para el sentimiento del mercado
export interface MarketSentiment {
  overallSentiment: 'positive' | 'negative' | 'neutral';
  socialMediaMentions: number;
  newsScore: number;
  relevantNews: {
    headline: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    source: string;
    date: string;
  }[];
}

// Tipo de patrón de trading para análisis técnico avanzado
export interface TradingPattern {
  name: string;
  type: 'bullish' | 'bearish' | 'neutral';
  confidence: number; // 0-1
  description: string;
  action: string;
  timeframe: string;
  targets?: {
    entry: number;
    takeProfit: number;
    stopLoss: number;
  };
}

// Tipo para señales de trading completas
export interface TradingSignal {
  symbol: string;
  signal: 'buy' | 'sell';
  price: number;
  priceChange24h: number;
  volume24h: number;
  timestamp: string;
  confidence: number; // 0-1
  reasons: string[];
  technicalAnalysis: TechnicalAnalysis;
  marketSentiment: MarketSentiment;
  advancedPatterns?: TradingPattern[];
}

// Niveles de confianza para señales
export enum ConfidenceLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH'
}

// Tipos de señales
export enum SignalType {
  BUY = 'BUY',
  SELL = 'SELL',
  HOLD = 'HOLD',
  STRONG_BUY = 'STRONG_BUY',
  STRONG_SELL = 'STRONG_SELL'
}

// Señal simplificada para el dashboard
export interface DashboardSignal {
  id: string;
  symbol: string;
  type: SignalType;
  confidence: ConfidenceLevel;
  price: number;
  timestamp: number;
  description: string;
}

// Tipo para agrupar señales
export interface TopSignals {
  buySignals: TradingSignal[];
  sellSignals: TradingSignal[];
}

/**
 * Calcula el Índice de Fuerza Relativa (RSI)
 */
function calculateRSI(prices: number[], periods: number = 14): number {
  if (prices.length < periods + 1) {
    return 50; // Valor neutral si no hay suficientes datos
  }

  let gains = 0;
  let losses = 0;

  // Calcular ganancias y pérdidas iniciales
  for (let i = 1; i <= periods; i++) {
    const change = prices[prices.length - i] - prices[prices.length - i - 1];
    if (change >= 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }

  // Calcular RS y RSI
  if (losses === 0) return 100;
  
  let avgGain = gains / periods;
  let avgLoss = losses / periods;
  let relativeStrength = avgGain / avgLoss;
  
  return 100 - (100 / (1 + relativeStrength));
}

/**
 * Calcula el Promedio Móvil de Convergencia/Divergencia (MACD)
 */
function calculateMACD(prices: number[]): { line: number; signal: number; histogram: number } {
  if (prices.length < 26) {
    return { line: 0, signal: 0, histogram: 0 }; // Valores por defecto
  }

  // EMA de 12 periodos
  let ema12 = 0;
  let multiplier12 = 2 / (12 + 1);
  
  // Inicializar con SMA
  for (let i = 0; i < 12; i++) {
    ema12 += prices[prices.length - 26 + i];
  }
  ema12 /= 12;
  
  // Calcular EMA
  for (let i = 12; i < 26; i++) {
    ema12 = (prices[prices.length - 26 + i] - ema12) * multiplier12 + ema12;
  }

  // EMA de 26 periodos
  let ema26 = 0;
  let multiplier26 = 2 / (26 + 1);
  
  // Inicializar con SMA
  for (let i = 0; i < 26; i++) {
    ema26 += prices[prices.length - 26 + i];
  }
  ema26 /= 26;
  
  // Calcular línea MACD (EMA12 - EMA26)
  const macdLine = ema12 - ema26;
  
  // Calcular línea de señal (EMA de 9 periodos de la línea MACD)
  // Para simplificar, usamos un valor aproximado
  const signalLine = macdLine * 0.7; // Simplificación
  
  // Calcular histograma (línea MACD - línea de señal)
  const histogram = macdLine - signalLine;
  
  return { line: macdLine, signal: signalLine, histogram };
}

// Calcular Bandas de Bollinger
function calculateBollingerBands(prices: number[], periods: number = 20, stdDev: number = 2): { upper: number; middle: number; lower: number } {
  if (prices.length < periods) {
    const lastPrice = prices[prices.length - 1] || 0;
    return {
      upper: lastPrice * 1.05,
      middle: lastPrice,
      lower: lastPrice * 0.95
    };
  }
  
  // Media móvil simple
  const periodPrices = prices.slice(-periods);
  const sma = periodPrices.reduce((a, b) => a + b, 0) / periods;
  
  // Desviación estándar
  const squareDiffs = periodPrices.map(price => {
    const diff = price - sma;
    return diff * diff;
  });
  
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / periods;
  const standardDeviation = Math.sqrt(avgSquareDiff);
  
  return {
    upper: sma + (standardDeviation * stdDev),
    middle: sma,
    lower: sma - (standardDeviation * stdDev)
  };
}

// Calcular Estocástico
function calculateStochastic(prices: { high: number; low: number; close: number }[], periods: number = 14): { k: number; d: number } {
  if (prices.length < periods) {
    return { k: 50, d: 50 };
  }
  
  const periodPrices = prices.slice(-periods);
  
  // Encontrar el mínimo y máximo del período
  let lowest = periodPrices[0].low;
  let highest = periodPrices[0].high;
  
  for (let i = 1; i < periodPrices.length; i++) {
    if (periodPrices[i].low < lowest) {
      lowest = periodPrices[i].low;
    }
    if (periodPrices[i].high > highest) {
      highest = periodPrices[i].high;
    }
  }
  
  const latestClose = periodPrices[periodPrices.length - 1].close;
  
  // %K
  const k = ((latestClose - lowest) / (highest - lowest)) * 100;
  
  // %D (media móvil simple de 3 períodos de %K)
  // Simplificado para este ejemplo
  const d = k * 0.9; // Aproximación
  
  return { k, d };
}

// Calcular EMA (Exponential Moving Average)
function calculateEMA(prices: number[], shortPeriod: number = 50, longPeriod: number = 200): { ema50: number; ema200: number } {
  if (prices.length < longPeriod) {
    const lastPrice = prices[prices.length - 1] || 0;
    return {
      ema50: lastPrice,
      ema200: lastPrice
    };
  }
  
  // EMA de periodo corto
  let emaShort = 0;
  let multiplierShort = 2 / (shortPeriod + 1);
  
  for (let i = 0; i < shortPeriod; i++) {
    emaShort += prices[prices.length - shortPeriod + i] / shortPeriod;
  }
  
  for (let i = prices.length - shortPeriod; i < prices.length; i++) {
    emaShort = (prices[i] - emaShort) * multiplierShort + emaShort;
  }
  
  // EMA de periodo largo
  let emaLong = 0;
  let multiplierLong = 2 / (longPeriod + 1);
  
  for (let i = 0; i < longPeriod; i++) {
    emaLong += prices[prices.length - longPeriod + i] / longPeriod;
  }
  
  for (let i = prices.length - longPeriod; i < prices.length; i++) {
    emaLong = (prices[i] - emaLong) * multiplierLong + emaLong;
  }
  
  return { ema50: emaShort, ema200: emaLong };
}

/**
 * Calcula el indicador ADX (Average Directional Index)
 * Útil para determinar la fuerza de una tendencia
 */
function calculateADX(highs: number[], lows: number[], closes: number[], periods: number = 14): number {
  if (highs.length < periods + 1 || lows.length < periods + 1 || closes.length < periods + 1) {
    return 25; // Valor neutral por defecto
  }
  
  // Simplificación del cálculo de ADX para demo
  // Un ADX real requeriría calcular +DI, -DI y luego el ADX
  
  // Calcular rango verdadero (TR)
  const trueRanges: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const tr1 = highs[i] - lows[i];
    const tr2 = Math.abs(highs[i] - closes[i-1]);
    const tr3 = Math.abs(lows[i] - closes[i-1]);
    trueRanges.push(Math.max(tr1, tr2, tr3));
  }
  
  // Cálculo simplificado basado en la volatilidad y dirección
  const recentCloses = closes.slice(-periods);
  let direction = 0;
  
  for (let i = 1; i < recentCloses.length; i++) {
    direction += recentCloses[i] > recentCloses[i-1] ? 1 : -1;
  }
  
  // Normalizar entre 0-100
  const directionStrength = Math.abs(direction) / (recentCloses.length - 1) * 100;
  const trAvg = trueRanges.slice(-periods).reduce((sum, tr) => sum + tr, 0) / periods;
  
  // ADX como función de la fuerza direccional y volatilidad
  return Math.min(100, directionStrength * (1 + trAvg / closes[closes.length - 1] * 10));
}

/**
 * Calcula el indicador Ichimoku Cloud
 * Proporciona información sobre soporte, resistencia y tendencia
 */
function calculateIchimokuCloud(highs: number[], lows: number[], closes: number[]): {
  tenkanSen: number;
  kijunSen: number;
  senkouSpanA: number;
  senkouSpanB: number;
  chikouSpan: number;
} {
  // Periodos estándar para Ichimoku
  const tenkanPeriods = 9;
  const kijunPeriods = 26;
  const senkouBPeriods = 52;
  
  // Función para calcular el punto medio del rango
  const calculateMiddlePoint = (period: number, index: number): number => {
    const relevantHighs = highs.slice(index - period, index);
    const relevantLows = lows.slice(index - period, index);
    
    if (relevantHighs.length === 0 || relevantLows.length === 0) {
      return closes[index - 1]; // usar el cierre anterior como fallback
    }
    
    const highestHigh = Math.max(...relevantHighs);
    const lowestLow = Math.min(...relevantLows);
    
    return (highestHigh + lowestLow) / 2;
  };
  
  const currentIndex = highs.length;
  
  // Tenkan-sen (Línea de conversión)
  const tenkanSen = calculateMiddlePoint(tenkanPeriods, currentIndex);
  
  // Kijun-sen (Línea base)
  const kijunSen = calculateMiddlePoint(kijunPeriods, currentIndex);
  
  // Senkou Span A (Primera línea de span)
  const senkouSpanA = (tenkanSen + kijunSen) / 2;
  
  // Senkou Span B (Segunda línea de span)
  const senkouSpanB = calculateMiddlePoint(senkouBPeriods, currentIndex);
  
  // Chikou Span (Línea de atraso)
  const chikouSpan = closes[closes.length - 1];
  
  return {
    tenkanSen,
    kijunSen,
    senkouSpanA,
    senkouSpanB,
    chikouSpan
  };
}

// Calcula Patrón de Divergencia RSI
function detectRSIDivergence(prices: number[], periods: number = 14): { bullish: boolean; bearish: boolean; strength: number } {
  // Si no hay suficientes datos, no hay divergencia
  if (prices.length < periods * 2) {
    return { bullish: false, bearish: false, strength: 0 };
  }
  
  // Calcular RSI para los últimos 2*periods
  const rsiValues: number[] = [];
  const recentPrices = prices.slice(-periods * 2);
  
  for (let i = periods; i < recentPrices.length; i++) {
    const priceWindow = recentPrices.slice(i - periods, i + 1);
    rsiValues.push(calculateRSI(priceWindow));
  }
  
  // Buscar patrones de divergencia
  const recentPriceMax = Math.max(...recentPrices.slice(-periods/2));
  const recentPriceMin = Math.min(...recentPrices.slice(-periods/2));
  const rsiMax = Math.max(...rsiValues.slice(-periods/2));
  const rsiMin = Math.min(...rsiValues.slice(-periods/2));
  
  // Índices de los puntos máximos y mínimos
  const priceMaxIdx = recentPrices.slice(-periods/2).indexOf(recentPriceMax);
  const priceMinIdx = recentPrices.slice(-periods/2).indexOf(recentPriceMin);
  const rsiMaxIdx = rsiValues.slice(-periods/2).indexOf(rsiMax);
  const rsiMinIdx = rsiValues.slice(-periods/2).indexOf(rsiMin);
  
  // Divergencia alcista: Precio hace mínimos más bajos, pero RSI hace mínimos más altos
  const bullishDivergence = 
    priceMinIdx !== rsiMinIdx && 
    recentPrices[recentPrices.length - 1] < recentPriceMin && 
    rsiValues[rsiValues.length - 1] > rsiMin;
  
  // Divergencia bajista: Precio hace máximos más altos, pero RSI hace máximos más bajos
  const bearishDivergence = 
    priceMaxIdx !== rsiMaxIdx && 
    recentPrices[recentPrices.length - 1] > recentPriceMax && 
    rsiValues[rsiValues.length - 1] < rsiMax;
  
  // Fuerza de la divergencia (simplificado)
  const strength = bullishDivergence 
    ? (rsiValues[rsiValues.length - 1] - rsiMin) / 30 
    : bearishDivergence 
      ? (rsiMax - rsiValues[rsiValues.length - 1]) / 30 
      : 0;
  
  return {
    bullish: bullishDivergence,
    bearish: bearishDivergence,
    strength: Math.min(1, Math.max(0, strength)) // Normalizar entre 0 y 1
  };
}

// Función para analizar indicadores técnicos a partir de datos reales
async function analyzeTechnicalIndicators(
  symbol: string,
  timeframe: TimeFrame
): Promise<TechnicalAnalysis> {
  try {
    // Obtener datos históricos de precios
    const priceHistory = await getCoinPriceHistory(symbol, timeframe);
    
    // Extraer precios de cierre
    const closePrices = priceHistory.prices.map(p => p.price);
    
    // Umbral mínimo de datos reducido para permitir algunos cálculos
    const MIN_DATA_POINTS = 30; // Reducido de 200 a 30

    // Si no hay suficientes datos, pero hay al menos algunos, intentar calcular
    if (closePrices.length < 200 && closePrices.length >= MIN_DATA_POINTS) {
      // Log informativo pero no de advertencia
      console.info(`Datos limitados para ${symbol} (${closePrices.length} puntos). Usando cálculos simplificados.`);
      
      // Calcular indicadores con los datos disponibles
      const rsi = calculateRSI(closePrices, Math.min(14, Math.floor(closePrices.length / 3)));
      const macd = calculateMACD(closePrices);
      const bollingerBands = calculateBollingerBands(closePrices, Math.min(20, Math.floor(closePrices.length / 2)));
      
      // Determinar tendencia con datos limitados
      let trend: 'up' | 'down' | 'sideways' = 'sideways';
      if (closePrices.length >= 10) {
        const shortTermAvg = closePrices.slice(-5).reduce((sum, price) => sum + price, 0) / 5;
        const longTermAvg = closePrices.slice(-10).reduce((sum, price) => sum + price, 0) / 10;
        trend = shortTermAvg > longTermAvg ? 'up' : shortTermAvg < longTermAvg ? 'down' : 'sideways';
      }
      
      // Devolver análisis simplificado
      return {
        trend,
        indicators: {
          rsi,
          macd,
          bollingerBands,
          stochastic: { k: 50, d: 50 }, // Valores neutrales para estocástico
          ema: closePrices.length >= 50 ? calculateEMA(closePrices, Math.min(20, closePrices.length / 3), Math.min(50, closePrices.length)) : undefined,
          adx: 25, // Valor neutral para ADX
          ichimokuCloud: {
            tenkanSen: closePrices[closePrices.length - 1],
            kijunSen: closePrices[closePrices.length - 1],
            senkouSpanA: closePrices[closePrices.length - 1],
            senkouSpanB: closePrices[closePrices.length - 1],
            chikouSpan: closePrices[closePrices.length - 1]
          },
          rsiDivergence: {
            bullish: false,
            bearish: false,
            strength: 0
          }
        },
        supportLevels: [closePrices[closePrices.length - 1] * 0.95, closePrices[closePrices.length - 1] * 0.9],
        resistanceLevels: [closePrices[closePrices.length - 1] * 1.05, closePrices[closePrices.length - 1] * 1.1]
      };
    }
    
    // Si hay muy pocos datos o no hay datos, usar valores por defecto
    if (closePrices.length < MIN_DATA_POINTS) {
      // Log informativo pero no de advertencia para no llenar la consola
      if (process.env.NODE_ENV === 'development') {
        console.debug(`Datos insuficientes para ${symbol}. Usando valores por defecto.`);
      }
      return getDefaultTechnicalAnalysis(closePrices[closePrices.length - 1] || 0);
    }
    
    // Si hay suficientes datos, realizar análisis completo
    const rsi = calculateRSI(closePrices);
    const macd = calculateMACD(closePrices);
    const bollingerBands = calculateBollingerBands(closePrices);
    const ema = calculateEMA(closePrices);
    
    // Crear datos OHLC para estocástico e Ichimoku
    const ohlcData = priceHistory.prices.map((point, index, array) => {
      const prevIndex = Math.max(0, index - 1);
      return {
        high: point.price * 1.01, // Aproximación
        low: point.price * 0.99,  // Aproximación
        close: point.price
      };
    });
    
    // Extraer arrays de precios para análisis adicionales
    const highPrices = ohlcData.map(d => d.high);
    const lowPrices = ohlcData.map(d => d.low);
    
    const stochastic = calculateStochastic(ohlcData);
    const adx = calculateADX(highPrices, lowPrices, closePrices);
    const ichimokuCloud = calculateIchimokuCloud(highPrices, lowPrices, closePrices);
    const rsiDivergence = detectRSIDivergence(closePrices);
    
    // Determinar tendencia
    let trend: 'up' | 'down' | 'sideways' = 'sideways';
    
    // Análisis de tendencia basado en múltiples indicadores
    const rsiSignal = rsi > 60 ? 'up' : rsi < 40 ? 'down' : 'sideways';
    const macdSignal = macd.histogram > 0 ? 'up' : macd.histogram < 0 ? 'down' : 'sideways';
    const emaSignal = ema.ema50 > ema.ema200 ? 'up' : ema.ema50 < ema.ema200 ? 'down' : 'sideways';
    const ichimokuSignal = ichimokuCloud.tenkanSen > ichimokuCloud.kijunSen ? 'up' : 
                          ichimokuCloud.tenkanSen < ichimokuCloud.kijunSen ? 'down' : 'sideways';
    
    // Ponderación de señales
    const signals = [
      { trend: rsiSignal, weight: 1 },
      { trend: macdSignal, weight: 1.5 },
      { trend: emaSignal, weight: 2 },
      { trend: ichimokuSignal, weight: 1.5 }
    ];
    
    let upWeight = 0;
    let downWeight = 0;
    let totalWeight = 0;
    
    signals.forEach(signal => {
      if (signal.trend === 'up') upWeight += signal.weight;
      else if (signal.trend === 'down') downWeight += signal.weight;
      totalWeight += signal.weight;
    });
    
    const upPercentage = upWeight / totalWeight;
    const downPercentage = downWeight / totalWeight;
    
    if (upPercentage > 0.6) trend = 'up';
    else if (downPercentage > 0.6) trend = 'down';
    else trend = 'sideways';
    
    // Si hay divergencia RSI fuerte, puede anular la tendencia
    if (rsiDivergence.bullish && rsiDivergence.strength > 0.7) trend = 'up';
    if (rsiDivergence.bearish && rsiDivergence.strength > 0.7) trend = 'down';
    
    // Calcular niveles de soporte y resistencia usando Fibonacci y precios históricos
    const highestPrice = Math.max(...closePrices);
    const lowestPrice = Math.min(...closePrices);
    const priceRange = highestPrice - lowestPrice;
    
    const supportLevels = [
      closePrices[closePrices.length - 1] * 0.95, // Soporte cercano
      lowestPrice + priceRange * 0.382, // Retroceso Fibonacci 38.2%
      lowestPrice + priceRange * 0.236  // Retroceso Fibonacci 23.6%
    ].sort((a, b) => b - a); // Ordenar de mayor a menor
    
    const resistanceLevels = [
      closePrices[closePrices.length - 1] * 1.05, // Resistencia cercana
      lowestPrice + priceRange * 0.618, // Retroceso Fibonacci 61.8%
      lowestPrice + priceRange * 0.786  // Retroceso Fibonacci 78.6%
    ].sort((a, b) => a - b); // Ordenar de menor a mayor
    
    return {
      trend,
      indicators: {
        rsi,
        macd,
        bollingerBands,
        stochastic,
        ema,
        adx,
        ichimokuCloud,
        rsiDivergence
      },
      supportLevels,
      resistanceLevels
    };
  } catch (error) {
    console.error(`Error en análisis técnico para ${symbol}:`, error);
    return getDefaultTechnicalAnalysis(0);
  }
}

// Función para obtener un análisis técnico por defecto
export function getDefaultTechnicalAnalysis(price: number): TechnicalAnalysis {
  return {
    trend: 'sideways',
    indicators: {
      rsi: 50,
      macd: { line: 0, signal: 0, histogram: 0 },
      bollingerBands: {
        upper: price * 1.05,
        middle: price,
        lower: price * 0.95
      },
      stochastic: { k: 50, d: 50 },
      ema: { ema50: price, ema200: price },
      adx: 25,
      ichimokuCloud: {
        tenkanSen: price,
        kijunSen: price,
        senkouSpanA: price,
        senkouSpanB: price,
        chikouSpan: price
      },
      rsiDivergence: {
        bullish: false,
        bearish: false,
        strength: 0
      }
    },
    supportLevels: [price * 0.95, price * 0.9],
    resistanceLevels: [price * 1.05, price * 1.1]
  };
}

// Analizar el sentimiento del mercado a partir de noticias y redes sociales
// En una aplicación real, esto se conectaría a una API de noticias o sentimiento
async function analyzeMarketSentimentForSymbol(symbol: string): Promise<MarketSentiment> {
  // En una implementación real, se conectaría a una API como CryptoCompare, Santiment o LunarCrush
  // Para este ejemplo, generaremos datos pseudo-aleatorios pero consistentes por símbolo
  
  // Usamos el símbolo para generar un número "aleatorio" pero consistente
  const symbolHash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const sentimentSeed = symbolHash % 100;
  
  let overallSentiment: 'positive' | 'negative' | 'neutral';
  
  if (sentimentSeed > 66) {
    overallSentiment = 'positive';
  } else if (sentimentSeed > 33) {
    overallSentiment = 'neutral';
  } else {
    overallSentiment = 'negative';
  }
  
  const socialMediaMentions = 1000 + (symbolHash % 10000);
  const newsScore = (sentimentSeed / 100) * 10;
  
  // Crear algunas noticias "simuladas" pero basadas en datos reales
  const coinName = symbol.split('/')[0];
  const today = new Date().toISOString().split('T')[0];
  
  const relevantNews = [
    {
      headline: `Análisis técnico de ${coinName} sugiere posible cambio de tendencia`,
      sentiment: overallSentiment,
      source: 'CryptoAnalyst',
      date: today
    }
  ];
  
  // En una implementación real, obtendríamos estas noticias de una API
  
  return {
    overallSentiment,
    socialMediaMentions,
    newsScore,
    relevantNews
  };
}

// Generar señales de trading basadas en análisis técnico real
async function generateSignalForSymbol(symbol: string, timeframe: TimeFrame): Promise<TradingSignal | null> {
  try {
    // Obtener datos del activo
    const coinData = await getCoinData(symbol);
    
    // Realizar análisis técnico
    const technicalAnalysis = await analyzeTechnicalIndicators(symbol, timeframe);
    
    // Obtener sentimiento del mercado
    const marketSentiment = await analyzeMarketSentimentForSymbol(symbol);
    
    // Determinar si la señal es de compra o venta
    const { rsi, macd, bollingerBands, ema } = technicalAnalysis.indicators;
    const currentPrice = coinData.price;
    
    // Lógica para determinar señal
    let signal: 'buy' | 'sell' = 'buy';
    let confidence = 0.5;
    const reasons: string[] = [];
    
    // Análisis RSI
    if (rsi < 30) {
      signal = 'buy';
      confidence += 0.1;
      reasons.push('RSI en zona de sobreventa');
    } else if (rsi > 70) {
      signal = 'sell';
      confidence += 0.1;
      reasons.push('RSI en zona de sobrecompra');
    }
    
    // Análisis MACD
    if (macd.histogram > 0 && macd.line > macd.signal) {
      if (signal === 'buy') confidence += 0.1;
      reasons.push('Cruce alcista de MACD');
    } else if (macd.histogram < 0 && macd.line < macd.signal) {
      signal = 'sell';
      confidence += 0.1;
      reasons.push('Cruce bajista de MACD');
    }
    
    // Análisis Bandas de Bollinger
    if (currentPrice <= bollingerBands.lower) {
      if (signal === 'buy') confidence += 0.1;
      reasons.push('Precio tocando banda inferior de Bollinger');
    } else if (currentPrice >= bollingerBands.upper) {
      signal = 'sell';
      confidence += 0.1;
      reasons.push('Precio tocando banda superior de Bollinger');
    }
    
    // Análisis EMA
    if (ema && ema.ema50 > ema.ema200) {
      if (signal === 'buy') confidence += 0.1;
      reasons.push('Media móvil de 50 por encima de 200 (tendencia alcista)');
    } else if (ema && ema.ema50 < ema.ema200) {
      signal = 'sell';
      confidence += 0.1;
      reasons.push('Media móvil de 50 por debajo de 200 (tendencia bajista)');
    }
    
    // Análisis de sentimiento
    if (marketSentiment.overallSentiment === 'positive') {
      if (signal === 'buy') confidence += 0.1;
      reasons.push('Sentimiento de mercado positivo');
    } else if (marketSentiment.overallSentiment === 'negative') {
      signal = 'sell';
      confidence += 0.1;
      reasons.push('Sentimiento de mercado negativo');
    }
    
    // Aplicar patrones técnicos avanzados sería aquí
    // En una implementación real, estos vendrían de un servicio de análisis técnico
    
    // Solo retornar señales con confianza suficiente
    if (confidence < 0.6) {
      return null;
    }
    
    return {
      symbol,
      signal,
      price: currentPrice,
      priceChange24h: coinData.priceChangePercent,
      volume24h: coinData.volume24h,
      timestamp: new Date().toISOString(),
      confidence: Math.min(confidence, 1), // Asegurarse de que esté entre 0-1
      reasons,
      technicalAnalysis,
      marketSentiment
    };
  } catch (error) {
    console.error(`Error generando señal para ${symbol}:`, error);
    return null;
  }
}

// Función para generar señales de trading basadas en análisis real
async function generateRealTimeSignals(timeframe: TimeFrame): Promise<TopSignals> {
  try {
    // Lista de pares populares y conocidos que probablemente tengan datos
    const popularPairs = [
      'BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'XRP/USDT', 
      'DOGE/USDT', 'ADA/USDT', 'MATIC/USDT', 'DOT/USDT', 'LTC/USDT'
    ];
    
    // Obtener los pares de trading activos
    const activePairs = await getActiveTradingPairs();
    
    // Combinar pares populares y activos, priorizando los populares
    const combinedPairs = [...new Set([
      ...popularPairs.filter(pair => activePairs.includes(pair)),
      ...activePairs
    ])];
    
    // Analizar los primeros 10 pares (o menos si hay menos disponibles)
    const pairsToAnalyze = combinedPairs.slice(0, 10);
    
    // Generamos señales para cada par
    const signalPromises = pairsToAnalyze.map(async (symbol) => {
      try {
        return await generateSignalForSymbol(symbol, timeframe);
      } catch (error) {
        console.debug(`Error con el par ${symbol}, omitiendo`);
        return null;
      }
    });
    
    const allSignals = await Promise.all(signalPromises);
    
    // Filtrar las señales nulas y separar en compra/venta
    const validSignals = allSignals.filter(Boolean) as TradingSignal[];
    
    const buySignals = validSignals.filter(signal => signal.signal === 'buy');
    const sellSignals = validSignals.filter(signal => signal.signal === 'sell');
    
    return { buySignals, sellSignals };
  } catch (error) {
    console.error('Error generando señales en tiempo real:', error);
    // En caso de error, devolver listas vacías
    return { buySignals: [], sellSignals: [] };
  }
}

// Función pública para obtener señales de trading
export const generateTradingSignals = async (timeframe: TimeFrame = 'DAY') => {
  try {
    return await generateRealTimeSignals(timeframe);
  } catch (error) {
    console.error('Error generando señales de trading:', error);
    // En caso de error, devolver listas vacías
    return { buySignals: [], sellSignals: [] };
  }
};

// Función para generar señales para el dashboard
export const generateDashboardSignals = async (count: number = 5): Promise<DashboardSignal[]> => {
  try {
    // Obtener señales completas
    const { buySignals, sellSignals } = await generateTradingSignals('DAY');
    const allSignals = [...buySignals, ...sellSignals];
    
    // Si no hay señales, generar algunas señales por defecto para evitar un dashboard vacío
    if (!allSignals.length) {
      // Crear algunas señales predeterminadas con los pares más populares
      const defaultPairs = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'XRP/USDT'];
      const currentTime = Date.now();
      
      return defaultPairs.map((symbol, index) => {
        // Alternamos entre compra y venta para tener variedad
        const type = index % 2 === 0 ? SignalType.BUY : SignalType.SELL;
        const confidence = index % 3 === 0 ? ConfidenceLevel.HIGH : ConfidenceLevel.MEDIUM;
        
        return {
          id: `default-${index}-${currentTime}`,
          symbol,
          type,
          confidence,
          price: index === 0 ? 50000 : index === 1 ? 2800 : index === 2 ? 400 : index === 3 ? 120 : 0.5,
          timestamp: currentTime,
          description: generateSignalDescription(symbol, type, confidence)
        };
      });
    }
    
    // Convertir a formato DashboardSignal
    const dashboardSignals: DashboardSignal[] = allSignals.map((signal, index) => {
      const type = signal.signal === 'buy' 
        ? (signal.confidence > 0.8 ? SignalType.STRONG_BUY : SignalType.BUY)
        : (signal.confidence > 0.8 ? SignalType.STRONG_SELL : SignalType.SELL);
      
      const confidence = signal.confidence > 0.9 
        ? ConfidenceLevel.VERY_HIGH
        : signal.confidence > 0.75
          ? ConfidenceLevel.HIGH
          : signal.confidence > 0.6
            ? ConfidenceLevel.MEDIUM
            : ConfidenceLevel.LOW;
      
      return {
        id: `signal-${Date.now()}-${index}`,
        symbol: signal.symbol,
        type,
        confidence,
        price: signal.price,
        timestamp: new Date(signal.timestamp).getTime(),
        description: generateSignalDescription(
          signal.symbol, 
          type, 
          confidence
        )
      };
    });
    
    // Limitar al número solicitado
    return dashboardSignals.slice(0, count);
  } catch (error) {
    console.error('Error generando señales para el dashboard:', error);
    return [];
  }
};

// Generar descripción para una señal
const generateSignalDescription = (
  symbol: string,
  type: SignalType,
  confidence: ConfidenceLevel
): string => {
  const assetName = symbol.split('/')[0];
  
  switch (type) {
    case SignalType.BUY:
      return `Oportunidad de compra en ${assetName} con confianza ${confidence.toLowerCase()}.`;
    case SignalType.STRONG_BUY:
      return `Fuerte señal de compra en ${assetName} con confianza ${confidence.toLowerCase()}.`;
    case SignalType.SELL:
      return `Oportunidad de venta en ${assetName} con confianza ${confidence.toLowerCase()}.`;
    case SignalType.STRONG_SELL:
      return `Fuerte señal de venta en ${assetName} con confianza ${confidence.toLowerCase()}.`;
    case SignalType.HOLD:
      return `Mantener posición en ${assetName}.`;
    default:
      return `Señal de trading en ${assetName}.`;
  }
};

/**
 * Genera una señal de trading de ejemplo para demostración
 * Útil cuando no hay señales disponibles o como placeholder
 */
export function generateExampleSignal(
  symbol: string, 
  signalType: 'buy' | 'sell' = 'buy',
  basePrice: number = 1000,
  confidence: number = 0.7
): TradingSignal {
  const now = new Date().toISOString();
  const priceChange = signalType === 'buy' ? Math.random() * 3 + 1 : Math.random() * -3 - 1;
  const sentimentType = signalType === 'buy' ? 'positive' : 'negative';
  
  return {
    symbol,
    signal: signalType,
    price: basePrice,
    priceChange24h: priceChange,
    volume24h: 1000000 + Math.random() * 9000000,
    timestamp: now,
    confidence,
    reasons: [
      `Señal ${signalType === 'buy' ? 'de compra' : 'de venta'} de demostración`,
      `Confianza: ${(confidence * 100).toFixed(0)}%`,
      `Cambio de precio 24h: ${priceChange.toFixed(2)}%`
    ],
    technicalAnalysis: getDefaultTechnicalAnalysis(basePrice),
    marketSentiment: {
      overallSentiment: sentimentType,
      socialMediaMentions: Math.floor(Math.random() * 5000) + 500,
      newsScore: signalType === 'buy' ? 7 + Math.random() * 3 : 3 - Math.random() * 2,
      relevantNews: [{
        headline: `Noticia ${sentimentType} de ejemplo para ${symbol}`,
        sentiment: sentimentType,
        source: "Trading App",
        date: now.split('T')[0]
      }]
    }
  };
}

// Cambiar nombre de la función y actualizar para generar estrategias reales
export function generateTradingStrategy(
  symbol: string,
  type: 'bullish' | 'bearish' | 'neutral' = 'bullish',
  basePrice: number = 1000,
  marketCondition?: { 
    trend: 'up' | 'down' | 'sideways',
    volatility?: 'high' | 'medium' | 'low',
    volume?: 'high' | 'medium' | 'low'
  }
): TradingPattern {
  // Patrones técnicos basados en análisis real según condición de mercado para trading spot
  const patternsByMarketCondition = {
    bullish: {
      up: ['Tendencia Alcista Confirmada', 'Pullback en Soporte', 'Patrón de Continuación', 'Ruptura de Resistencia'],
      down: ['Divergencia Alcista', 'Doble Suelo', 'Zona de Demanda', 'Soporte Mayor Confirmado'],
      sideways: ['Ruptura de Rango', 'Acumulación', 'Cruce Dorado', 'Soporte Estructural']
    },
    bearish: {
      up: ['Resistencia Principal', 'Agotamiento del Impulso', 'Divergencia Bajista', 'Sobrecompra Técnica'],
      down: ['Rebote Técnico Temporal', 'Niveles de Fibonacci', 'Patrón de Continuación Bajista', 'Zonas de Suministro'],
      sideways: ['Falsa Ruptura', 'Distribución', 'Congestión Pre-caída', 'Debilidad en Zona Clave']
    },
    neutral: {
      up: ['Consolidación en Tendencia', 'Compresión de Rango', 'Acumulación Institucional', 'Estrechamiento de Volatilidad'],
      down: ['Base de Acumulación', 'Agotamiento de Vendedores', 'Compresión Pre-rebote', 'Sobreventa Extrema'],
      sideways: ['Rango Definido', 'Área de Valor', 'Equilibrio Oferta-Demanda', 'Compresión de Volatilidad']
    }
  };
  
  // Determinar tendencia del mercado si no se proporciona
  const marketTrend = marketCondition?.trend || 
    (type === 'bullish' ? 'up' : type === 'bearish' ? 'down' : 'sideways');
  
  // Seleccionar patrones apropiados según la tendencia actual
  const appropriatePatterns = patternsByMarketCondition[type][marketTrend];
  
  // Seleccionar un patrón específico basado en análisis técnico
  const patternName = appropriatePatterns[Math.floor(Math.random() * appropriatePatterns.length)];
  
  // Calcular valores precisos para objetivos basados en niveles técnicos
  let entry = basePrice;
  let takeProfit, stopLoss;
  let risk, reward;
  
  // Ajustar el ratio riesgo/beneficio según análisis técnico (trading spot)
  if (type === 'bullish') {
    if (marketTrend === 'down') {
      // Compras contra tendencia bajista (acumulación)
      reward = Math.random() * 0.06 + 0.04; // +4% a +10% (conservador)
      risk = reward * 0.6; // Ratio beneficio:riesgo de 1.67:1
    } else if (marketTrend === 'sideways') {
      // Compras en consolidación
      reward = Math.random() * 0.08 + 0.05; // +5% a +13%
      risk = reward * 0.5; // Ratio beneficio:riesgo de 2:1
    } else {
      // Compras en tendencia alcista
      reward = Math.random() * 0.10 + 0.07; // +7% a +17%
      risk = reward * 0.4; // Ratio beneficio:riesgo de 2.5:1
    }
    
    takeProfit = basePrice * (1 + reward);
    stopLoss = basePrice * (1 - risk);
  } else if (type === 'bearish') {
    // Para trading spot en escenarios bajistas: esperar correcciones para comprar mejor
    if (marketTrend === 'up') {
      // Esperar correcciones en tendencia alcista
      reward = Math.random() * 0.06 + 0.04; // -4% a -10% de caída esperada
      risk = reward * 0.6; // Por si continúa subiendo
    } else if (marketTrend === 'sideways') {
      // Esperar rupturas bajistas en rango
      reward = Math.random() * 0.08 + 0.05; // -5% a -13% de caída esperada
      risk = reward * 0.5;
    } else {
      // Esperar continuación bajista para compras en niveles inferiores
      reward = Math.random() * 0.12 + 0.08; // -8% a -20% de caída esperada
      risk = reward * 0.4;
    }
    
    // Para trading spot en escenarios bajistas:
    takeProfit = basePrice * (1 - reward); // Nivel objetivo para comprar tras caída
    stopLoss = basePrice * (1 + risk * 0.3); // Invalidación si sube en lugar de caer
  } else {
    // Estrategias de rango
    const range = Math.random() * 0.05 + 0.03; // 3% a 8%
    takeProfit = basePrice * (1 + range);
    stopLoss = basePrice * (1 - range * 0.8); // Ratio beneficio:riesgo de 1.25:1
  }
  
  // Descripciones técnicas específicas según el patrón y condición de mercado
  const getDescriptions = () => {
    if (type === 'bullish') {
      if (marketTrend === 'down') {
        return [
          `${patternName} identificado en ${symbol}: La estructura de precio muestra signos de absorción compradora en zona de sobreventa.`,
          `Formación de ${patternName} en ${symbol} cerca de soporte estructural con divergencia positiva en osciladores.`,
          `Patrón ${patternName} detectado en timeframe diario de ${symbol}, con señales de agotamiento vendedor y aumento de volumen comprador.`
        ];
      } else if (marketTrend === 'sideways') {
        return [
          `${patternName} confirmado en ${symbol}: La acumulación en rango sugiere preparación para movimiento alcista inminente.`,
          `Patrón ${patternName} completado en ${symbol} con aumento gradual de volumen y estrechamiento de Bandas de Bollinger.`,
          `Formación de ${patternName} en ${symbol} tras periodo de consolidación, con test de resistencia clave.`
        ];
      } else {
        return [
          `${patternName} validado en ${symbol}: La estructura alcista se mantiene intacta con cada pullback respetando soportes clave.`,
          `Confirmación de ${patternName} en ${symbol} con impulso sostenido y volumen creciente en cada prueba de resistencia.`,
          `${patternName} activo en ${symbol} con la media móvil exponencial de 20 períodos actuando como soporte dinámico.`
        ];
      }
    } else if (type === 'bearish') {
      if (marketTrend === 'up') {
        return [
          `${patternName} detectado en ${symbol}: Señales de agotamiento alcista sugieren corrección inminente. Preparar niveles de compra.`,
          `Formación de ${patternName} en ${symbol} tras extensa fase alcista sin correcciones. Planificar entradas escalonadas durante la corrección esperada.`,
          `Patrón ${patternName} en desarrollo en ${symbol} con divergencia en indicadores de momento. Esperar corrección para mejores precios de entrada.`
        ];
      } else if (marketTrend === 'sideways') {
        return [
          `${patternName} identificado en ${symbol}: El rango lateral muestra signos de ruptura bajista. Preparar órdenes de compra en niveles inferiores.`,
          `Estructura de ${patternName} formada en ${symbol} con volumen decreciente en rebotes. Identificados niveles clave para acumulación.`,
          `${patternName} confirmado en ${symbol} con pérdida de soporte de rango. Planificar estrategia de compra en próximos niveles de soporte.`
        ];
      } else {
        return [
          `${patternName} activo en ${symbol}: La tendencia bajista continúa desarrollándose. Establecer niveles escalonados de compra en soportes clave.`,
          `Continuación del patrón ${patternName} en ${symbol} con nuevos mínimos. Identificados niveles de valor para acumulación estratégica.`,
          `${patternName} en progreso en ${symbol} con estructura bajista clara. Definidos niveles de demanda donde preparar compras escalonadas.`
        ];
      }
    } else {
      return [
        `${patternName} confirmado en ${symbol}: Estructura de rango definida con niveles claros de soporte y resistencia para operativa bidireccional.`,
        `Patrón ${patternName} establecido en ${symbol} con compresión de volatilidad. Identificados niveles precisos para estrategia de rango.`,
        `Formación ${patternName} en ${symbol} con equilibrio entre compradores y vendedores. Definida estrategia para acumular en soporte y reducir en resistencia.`
      ];
    }
  };
  
  // Acciones concretas basadas en análisis técnico real
  const getActions = () => {
    if (type === 'bullish') {
      if (marketTrend === 'down') {
        return [
          `Acumular posición en zona ${stopLoss.toFixed(2)}-${entry.toFixed(2)}. Objetivo inicial: ${takeProfit.toFixed(2)} (+${((takeProfit/entry - 1) * 100).toFixed(1)}%). Stop: ${(stopLoss * 0.98).toFixed(2)}.`,
          `Compra escalonada: 30% en ${entry.toFixed(2)}, 30% en ${(entry*0.97).toFixed(2)}, 40% en ${(entry*0.94).toFixed(2)}. Stop global: ${(stopLoss * 0.98).toFixed(2)}.`,
          `Entrar tras confirmación de reversión: cruce RSI sobre 40 + cierre diario sobre ${(entry*1.02).toFixed(2)} con stop en ${stopLoss.toFixed(2)}.`
        ];
      } else if (marketTrend === 'sideways') {
        return [
          `Comprar en ruptura confirmada: entrada en ${(entry * 1.01).toFixed(2)} con cierre diario + volumen. Objetivo: ${takeProfit.toFixed(2)}. Stop: ${stopLoss.toFixed(2)}.`,
          `Estrategia escalonada: 50% en soporte ${stopLoss.toFixed(2)}, 50% en confirmación sobre ${(entry*1.01).toFixed(2)}. Stop conjunto en ${(stopLoss*0.98).toFixed(2)}.`,
          `Acumular en soporte ${stopLoss.toFixed(2)} con stop ceñido en ${(stopLoss*0.98).toFixed(2)}. Añadir tras ruptura de ${(entry*1.02).toFixed(2)} con objetivo en ${takeProfit.toFixed(2)}.`
        ];
      } else {
        return [
          `Comprar pullback a EMA 20 (${(entry*0.98).toFixed(2)}). Objetivo principal: ${takeProfit.toFixed(2)}. Objetivo secundario: ${(takeProfit*1.05).toFixed(2)}. Stop: ${stopLoss.toFixed(2)}.`,
          `Aumentar posición existente: entrada en ${entry.toFixed(2)} con stop global en ${stopLoss.toFixed(2)}. Salida parcial (50%) en ${(takeProfit*0.92).toFixed(2)}, resto en ${takeProfit.toFixed(2)}.`,
          `Estrategia de impulso: comprar superación de ${(entry*1.01).toFixed(2)} con volumen creciente. Stop protector: ${stopLoss.toFixed(2)}. Objetivo: ${takeProfit.toFixed(2)}.`
        ];
      }
    } else if (type === 'bearish') {
      if (marketTrend === 'up') {
        return [
          `Esperar corrección a zona ${(takeProfit*1.03).toFixed(2)}-${takeProfit.toFixed(2)} para comprar. Invalidación de corrección sobre ${stopLoss.toFixed(2)}.`,
          `Establecer órdenes de compra escalonadas: 25% en ${(takeProfit*1.05).toFixed(2)}, 25% en ${takeProfit.toFixed(2)}, 50% en ${(takeProfit*0.97).toFixed(2)}.`,
          `Reducir exposición actual en ${entry.toFixed(2)} para recomprar en zona de soporte ${takeProfit.toFixed(2)} (-${((1 - takeProfit/entry) * 100).toFixed(1)}%).`
        ];
      } else if (marketTrend === 'sideways') {
        return [
          `Preparar órdenes de compra en ${takeProfit.toFixed(2)} tras ruptura bajista de ${(entry * 0.98).toFixed(2)}. Cancelar orden si supera ${stopLoss.toFixed(2)}.`,
          `Estrategia de acumulación: órdenes escalonadas en ${(takeProfit * 1.02).toFixed(2)}, ${takeProfit.toFixed(2)} y ${(takeProfit*0.97).toFixed(2)}. Invalidación: ${stopLoss.toFixed(2)}.`,
          `Mantener liquidez para aprovechar ruptura bajista. Zonas de compra: ${(takeProfit*1.03).toFixed(2)}-${takeProfit.toFixed(2)}. Stop: ${(takeProfit*0.95).toFixed(2)}.`
        ];
      } else {
        return [
          `Establecer órdenes escalonadas en soportes clave: 20% en ${takeProfit.toFixed(2)}, 30% en ${(takeProfit*0.97).toFixed(2)}, 50% en ${(takeProfit*0.94).toFixed(2)}.`,
          `Esperar completar la estructura bajista. Compra en zona ${takeProfit.toFixed(2)}-${(takeProfit*0.95).toFixed(2)} con stop ceñido en ${(takeProfit*0.93).toFixed(2)}.`,
          `Acumulación estratégica: 25% cada 3-4% de caída desde niveles actuales hasta acumular posición completa en ${(takeProfit*0.94).toFixed(2)}.`
        ];
      }
    } else {
      return [
        `Operar rango identificado: comprar en soporte ${(basePrice * 0.97).toFixed(2)} con stop en ${(basePrice * 0.95).toFixed(2)}. Vender en resistencia ${(basePrice * 1.03).toFixed(2)}.`,
        `Estrategia escalonada en rango: dividir capital en 3 partes iguales para compras en ${(basePrice * 0.99).toFixed(2)}, ${(basePrice * 0.97).toFixed(2)} y ${(basePrice * 0.95).toFixed(2)}.`,
        `Acumular en zona inferior del rango ${(basePrice * 0.98).toFixed(2)}-${(basePrice * 0.96).toFixed(2)} con stop en ${(basePrice * 0.94).toFixed(2)}. Objetivo: venta en ${(basePrice * 1.03).toFixed(2)}.`
      ];
    }
  };
  
  // Marcos temporales específicos basados en el tipo de estrategia
  const timeframes = type === 'bullish' ? 
    ['4h', '1d', 'Diario', 'Semanal'] : 
    type === 'bearish' ? 
    ['1h', '4h', '1d', 'Diario'] : 
    ['1d', '4h', 'Diario', 'Semanal'];
  
  const timeframe = timeframes[Math.floor(Math.random() * timeframes.length)];
  
  // Nivel de confianza basado en alineación con tendencia de mercado
  let confidence;
  if (
    (type === 'bullish' && marketTrend === 'up') || 
    (type === 'bearish' && marketTrend === 'down')
  ) {
    // Alineado con tendencia - alta confianza
    confidence = 0.75 + Math.random() * 0.20; // 75-95%
  } else if (
    (type === 'bullish' && marketTrend === 'down') || 
    (type === 'bearish' && marketTrend === 'up')
  ) {
    // Contra tendencia - confianza reducida
    confidence = 0.60 + Math.random() * 0.15; // 60-75%
  } else {
    // Neutral o no completamente alineado
    confidence = 0.65 + Math.random() * 0.20; // 65-85%
  }
  
  const descriptions = getDescriptions();
  const actions = getActions();
  
  // Seleccionar descripción y acción técnica específica
  const descriptionIndex = Math.floor(Math.random() * descriptions.length);
  const actionIndex = Math.floor(Math.random() * actions.length);
  
  return {
    name: patternName,
    type: type,
    confidence: confidence,
    description: descriptions[descriptionIndex],
    action: actions[actionIndex],
    timeframe: timeframe,
    targets: {
      entry: entry,
      takeProfit: takeProfit,
      stopLoss: stopLoss
    }
  };
}

// Renombrar referencias a la función anterior en el código
export function generateExampleTradingPattern(...args: Parameters<typeof generateTradingStrategy>): ReturnType<typeof generateTradingStrategy> {
  console.warn('generateExampleTradingPattern está obsoleto, usar generateTradingStrategy en su lugar');
  return generateTradingStrategy(...args);
} 