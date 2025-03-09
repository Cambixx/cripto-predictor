import axios from 'axios';
import { API_CONFIG } from '../config/api';

export interface CorrelationMatrix {
  symbols: string[];
  matrix: number[][];
  timestamp: number;
}

export interface CorrelationPair {
  pair: [string, string];
  correlation: number;
  type: 'positive' | 'negative' | 'neutral';
  strength: 'strong' | 'moderate' | 'weak';
}

/**
 * Calcula la matriz de correlación entre varios activos
 * @param symbols Lista de símbolos a analizar
 * @param timeframe Período de tiempo (1d, 1h, etc.)
 * @param days Número de días para el análisis
 * @returns Matriz de correlación
 */
export const calculateCorrelationMatrix = async (
  symbols: string[],
  timeframe: string = '1d',
  days: number = 30
): Promise<CorrelationMatrix> => {
  try {
    // Obtener datos históricos para cada símbolo
    const priceData: Record<string, number[]> = {};
    
    for (const symbol of symbols) {
      const cleanSymbol = symbol.replace('/', '');
      
      const response = await axios.get(`${API_CONFIG.BINANCE.BASE_URL}${API_CONFIG.BINANCE.ENDPOINTS.KLINES}`, {
        params: {
          symbol: cleanSymbol.toUpperCase(),
          interval: timeframe,
          limit: days
        }
      });
      
      if (!Array.isArray(response.data)) {
        throw new Error(`Respuesta inválida para ${symbol}`);
      }
      
      // Extraer precios de cierre
      priceData[symbol] = response.data.map(candle => parseFloat(candle[4]));
    }
    
    // Calcular retornos diarios para cada activo
    const returns: Record<string, number[]> = {};
    
    for (const symbol in priceData) {
      const prices = priceData[symbol];
      returns[symbol] = [];
      
      for (let i = 1; i < prices.length; i++) {
        returns[symbol].push((prices[i] - prices[i-1]) / prices[i-1]);
      }
    }
    
    // Calcular matriz de correlación
    const matrix: number[][] = [];
    
    for (let i = 0; i < symbols.length; i++) {
      matrix[i] = [];
      
      for (let j = 0; j < symbols.length; j++) {
        if (i === j) {
          matrix[i][j] = 1; // Autocorrelación siempre es 1
        } else {
          matrix[i][j] = calculateCorrelation(returns[symbols[i]], returns[symbols[j]]);
        }
      }
    }
    
    return {
      symbols,
      matrix,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Error calculando matriz de correlación:', error);
    throw error;
  }
};

/**
 * Identifica pares de activos con correlaciones significativas
 * @param matrix Matriz de correlación
 * @param threshold Umbral para considerar correlación significativa
 * @returns Lista de pares con correlaciones significativas
 */
export const findSignificantCorrelations = (
  matrix: CorrelationMatrix,
  threshold: number = 0.7
): CorrelationPair[] => {
  const result: CorrelationPair[] = [];
  
  for (let i = 0; i < matrix.symbols.length; i++) {
    for (let j = i + 1; j < matrix.symbols.length; j++) {
      const correlation = matrix.matrix[i][j];
      const absCorrelation = Math.abs(correlation);
      
      if (absCorrelation >= threshold) {
        result.push({
          pair: [matrix.symbols[i], matrix.symbols[j]],
          correlation,
          type: correlation > 0 ? 'positive' : 'negative',
          strength: absCorrelation > 0.8 ? 'strong' : absCorrelation > 0.5 ? 'moderate' : 'weak'
        });
      }
    }
  }
  
  // Ordenar por fuerza de correlación (absoluta)
  return result.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
};

/**
 * Encuentra pares potenciales para trading de pares
 * @param matrix Matriz de correlación
 * @returns Lista de pares potenciales para trading
 */
export const findPairTradingOpportunities = (
  matrix: CorrelationMatrix
): CorrelationPair[] => {
  // Buscar pares con alta correlación positiva (>0.8)
  const highPositiveCorrelations = findSignificantCorrelations(matrix, 0.8)
    .filter(pair => pair.type === 'positive');
  
  // Ordenar por fuerza de correlación
  return highPositiveCorrelations;
};

/**
 * Encuentra activos para diversificación de portfolio
 * @param matrix Matriz de correlación
 * @returns Lista de pares con baja correlación
 */
export const findDiversificationOpportunities = (
  matrix: CorrelationMatrix
): CorrelationPair[] => {
  const result: CorrelationPair[] = [];
  
  for (let i = 0; i < matrix.symbols.length; i++) {
    for (let j = i + 1; j < matrix.symbols.length; j++) {
      const correlation = matrix.matrix[i][j];
      const absCorrelation = Math.abs(correlation);
      
      // Buscar correlaciones bajas (positivas o negativas)
      if (absCorrelation < 0.3) {
        result.push({
          pair: [matrix.symbols[i], matrix.symbols[j]],
          correlation,
          type: correlation > 0 ? 'positive' : correlation < 0 ? 'negative' : 'neutral',
          strength: 'weak'
        });
      }
    }
  }
  
  // Ordenar por menor correlación absoluta
  return result.sort((a, b) => Math.abs(a.correlation) - Math.abs(b.correlation));
};

/**
 * Calcula la correlación entre dos series
 * @param x Primera serie de datos
 * @param y Segunda serie de datos
 * @returns Coeficiente de correlación de Pearson
 */
function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length) {
    throw new Error('Las series deben tener la misma longitud');
  }
  
  const n = x.length;
  
  // Calcular medias
  const xMean = x.reduce((sum, val) => sum + val, 0) / n;
  const yMean = y.reduce((sum, val) => sum + val, 0) / n;
  
  // Calcular desviaciones y productos
  let numerator = 0;
  let xDev = 0;
  let yDev = 0;
  
  for (let i = 0; i < n; i++) {
    const xDiff = x[i] - xMean;
    const yDiff = y[i] - yMean;
    
    numerator += xDiff * yDiff;
    xDev += xDiff * xDiff;
    yDev += yDiff * yDiff;
  }
  
  // Si no hay variabilidad, la correlación es 0
  if (xDev === 0 || yDev === 0) return 0;
  
  return numerator / (Math.sqrt(xDev) * Math.sqrt(yDev));
}

/**
 * Detección de pares divergentes (oportunidades de mean-reversion)
 * @param matrix Matriz de correlación
 * @param symbols Lista de símbolos
 * @param days Número de días para análisis
 */
export const findDivergentPairs = async (
  matrix: CorrelationMatrix,
  days: number = 30
): Promise<{
  pair: [string, string];
  correlation: number;
  zscore: number;
  spreadMean: number;
  spreadStd: number;
  currentSpread: number;
  signal: 'buy' | 'sell' | 'neutral';
}[]> => {
  // Obtener pares con alta correlación positiva
  const correlatedPairs = findPairTradingOpportunities(matrix);
  const result: {
    pair: [string, string];
    correlation: number;
    zscore: number;
    spreadMean: number;
    spreadStd: number;
    currentSpread: number;
    signal: 'buy' | 'sell' | 'neutral';
  }[] = [];
  
  for (const pairInfo of correlatedPairs) {
    const [symbol1, symbol2] = pairInfo.pair;
    
    try {
      // Obtener datos históricos para ambos símbolos
      const data1 = await fetchHistoricalData(symbol1, '1d', days);
      const data2 = await fetchHistoricalData(symbol2, '1d', days);
      
      // Asegurar que ambos tengan la misma cantidad de datos
      const minLength = Math.min(data1.length, data2.length);
      const prices1 = data1.slice(0, minLength).map(candle => parseFloat(candle[4]));
      const prices2 = data2.slice(0, minLength).map(candle => parseFloat(candle[4]));
      
      // Normalizar precios
      const normPrices1 = normalizeArray(prices1);
      const normPrices2 = normalizeArray(prices2);
      
      // Calcular spread
      const spread = normPrices1.map((p, i) => p - normPrices2[i]);
      
      // Calcular estadísticas del spread
      const spreadMean = calculateMean(spread);
      const spreadStd = calculateStandardDeviation(spread, spreadMean);
      
      // Calcular Z-score actual
      const currentSpread = spread[spread.length - 1];
      const zscore = (currentSpread - spreadMean) / spreadStd;
      
      // Determinar señal (comprar o vender)
      let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
      
      if (zscore > 2) {
        // Spread es anormalmente alto: vender symbol1, comprar symbol2
        signal = 'sell';
      } else if (zscore < -2) {
        // Spread es anormalmente bajo: comprar symbol1, vender symbol2
        signal = 'buy';
      }
      
      // Añadir a resultados si hay una señal
      if (signal !== 'neutral' || Math.abs(zscore) > 1.5) {
        result.push({
          pair: [symbol1, symbol2] as [string, string],
          correlation: pairInfo.correlation,
          zscore,
          spreadMean,
          spreadStd,
          currentSpread,
          signal
        });
      }
    } catch (error) {
      console.error(`Error analizando par ${symbol1}-${symbol2}:`, error);
    }
  }
  
  // Ordenar por magnitud del z-score
  return result.sort((a, b) => Math.abs(b.zscore) - Math.abs(a.zscore));
};

// Funciones auxiliares

async function fetchHistoricalData(
  symbol: string,
  timeframe: string,
  limit: number
): Promise<any[]> {
  const cleanSymbol = symbol.replace('/', '');
  
  const response = await axios.get(`${API_CONFIG.BINANCE.BASE_URL}${API_CONFIG.BINANCE.ENDPOINTS.KLINES}`, {
    params: {
      symbol: cleanSymbol.toUpperCase(),
      interval: timeframe,
      limit
    }
  });
  
  return response.data;
}

function normalizeArray(array: number[]): number[] {
  const min = Math.min(...array);
  const max = Math.max(...array);
  const range = max - min;
  
  if (range === 0) return array.map(() => 0);
  
  return array.map(value => (value - min) / range);
}

function calculateMean(array: number[]): number {
  return array.reduce((sum, value) => sum + value, 0) / array.length;
}

function calculateStandardDeviation(array: number[], mean?: number): number {
  const m = mean !== undefined ? mean : calculateMean(array);
  
  const squaredDiffs = array.map(value => Math.pow(value - m, 2));
  const variance = calculateMean(squaredDiffs);
  
  return Math.sqrt(variance);
} 