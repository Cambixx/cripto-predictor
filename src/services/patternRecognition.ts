// Definición del tipo Candle que necesitamos
export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PatternRecognitionResult {
  pattern: string;
  patternType: 'bullish' | 'bearish' | 'continuation';
  strength: number; // 0-1
  description: string;
  strategy?: {
    entry: string;
    stopLoss: string;
    takeProfit: string;
  }
}

/**
 * Detecta patrones de Fibonacci importantes en el gráfico
 */
export const analyzeFibonacciPatterns = (candles: Candle[]): PatternRecognitionResult[] => {
  if (candles.length < 50) return [];
  
  const results: PatternRecognitionResult[] = [];
  const recentCandles = candles.slice(-50);
  
  // Detectar un swing alto y bajo para el rango de Fibonacci
  const highPoint = Math.max(...recentCandles.map(c => c.high));
  const lowPoint = Math.min(...recentCandles.map(c => c.low));
  
  const range = highPoint - lowPoint;
  const fib382 = highPoint - (range * 0.382);
  const fib618 = highPoint - (range * 0.618);
  const fib786 = highPoint - (range * 0.786);
  
  const currentPrice = recentCandles[recentCandles.length - 1].close;
  
  // Detección de rebote en nivel de Fibonacci
  const fibLevels = [
    { level: 0.382, price: fib382, name: '38.2%' },
    { level: 0.618, price: fib618, name: '61.8%' },
    { level: 0.786, price: fib786, name: '78.6%' }
  ];
  
  for (const fib of fibLevels) {
    // Verificar si el precio actual está cerca del nivel de Fibonacci
    if (Math.abs(currentPrice - fib.price) / fib.price < 0.01) {
      // Determinar si es un rebote alcista o una resistencia bajista
      const prevCandle = recentCandles[recentCandles.length - 2];
      
      if (currentPrice > prevCandle.close) {
        results.push({
          pattern: `Rebote Fibonacci ${fib.name}`,
          patternType: 'bullish',
          strength: 0.7 + (fib.level * 0.3), // Niveles más profundos tienen mayor fuerza
          description: `Rebote alcista en retroceso de Fibonacci ${fib.name}`,
          strategy: {
            entry: `Confirmación por encima de ${fib.price.toFixed(2)}`,
            stopLoss: `Por debajo del mínimo reciente (${lowPoint.toFixed(2)})`,
            takeProfit: `Proyección 1:2 o próximo nivel de resistencia`
          }
        });
      } else {
        results.push({
          pattern: `Resistencia Fibonacci ${fib.name}`,
          patternType: 'bearish',
          strength: 0.7 + (fib.level * 0.3),
          description: `Rechazo bajista en retroceso de Fibonacci ${fib.name}`,
          strategy: {
            entry: `Confirmación por debajo de ${fib.price.toFixed(2)}`,
            stopLoss: `Por encima del máximo reciente (${highPoint.toFixed(2)})`,
            takeProfit: `Próximo nivel de soporte o proyección 1:2`
          }
        });
      }
    }
  }
  
  return results;
};

/**
 * Analiza patrones harmónicos en el gráfico
 */
export const analyzeHarmonicPatterns = (candles: Candle[]): PatternRecognitionResult[] => {
  if (candles.length < 30) return [];
  
  const results: PatternRecognitionResult[] = [];
  const recentCandles = candles.slice(-30);
  
  // Simplificado: Detectar patrones de Bat y Gartley
  // En una implementación real se necesitaría un algoritmo más sofisticado para detectar puntos de giro XABC
  
  // Detectar posible patrón Bullish Bat
  const hasPotentialBullishBat = detectBullishBat(recentCandles);
  if (hasPotentialBullishBat) {
    results.push({
      pattern: 'Bullish Bat',
      patternType: 'bullish',
      strength: 0.85,
      description: 'Patrón armónico Bat alcista detectado',
      strategy: {
        entry: 'En el punto D con confirmación de vela',
        stopLoss: 'Por debajo del punto D (Max 1% del precio)',
        takeProfit: 'Proyección al punto C o retroceso de 0.382 de AD'
      }
    });
  }
  
  // Detectar posible patrón Bearish Gartley
  const hasPotentialBearishGartley = detectBearishGartley(recentCandles);
  if (hasPotentialBearishGartley) {
    results.push({
      pattern: 'Bearish Gartley',
      patternType: 'bearish',
      strength: 0.8,
      description: 'Patrón armónico Gartley bajista detectado',
      strategy: {
        entry: 'En el punto D con confirmación de vela',
        stopLoss: 'Por encima del punto D (Max 1% del precio)',
        takeProfit: 'Proyección al punto C o retroceso de 0.382 de AD'
      }
    });
  }
  
  return results;
};

/**
 * Detecta patrones de divergencia entre precio e indicadores
 */
export const analyzeDivergencePatterns = (
  candles: Candle[],
  rsiValues: number[]
): PatternRecognitionResult[] => {
  if (candles.length < 20 || rsiValues.length < 20) return [];
  
  const results: PatternRecognitionResult[] = [];
  
  // Extraer precios de cierre y RSI para los últimos 20 periodos
  const closes = candles.slice(-20).map(c => c.close);
  const rsi = rsiValues.slice(-20);
  
  // Buscar máximos y mínimos locales para el precio y RSI
  const priceHighs: {index: number, value: number}[] = [];
  const priceLows: {index: number, value: number}[] = [];
  const rsiHighs: {index: number, value: number}[] = [];
  const rsiLows: {index: number, value: number}[] = [];
  
  // Identificar picos y valles en el precio (simplificado)
  for (let i = 1; i < closes.length - 1; i++) {
    if (closes[i] > closes[i-1] && closes[i] > closes[i+1]) {
      priceHighs.push({index: i, value: closes[i]});
    }
    if (closes[i] < closes[i-1] && closes[i] < closes[i+1]) {
      priceLows.push({index: i, value: closes[i]});
    }
  }
  
  // Identificar picos y valles en el RSI
  for (let i = 1; i < rsi.length - 1; i++) {
    if (rsi[i] > rsi[i-1] && rsi[i] > rsi[i+1]) {
      rsiHighs.push({index: i, value: rsi[i]});
    }
    if (rsi[i] < rsi[i-1] && rsi[i] < rsi[i+1]) {
      rsiLows.push({index: i, value: rsi[i]});
    }
  }
  
  // Buscar divergencias regulares bajistas (precio sube, RSI baja)
  if (priceHighs.length >= 2 && rsiHighs.length >= 2) {
    const lastPriceHigh = priceHighs[priceHighs.length - 1];
    const prevPriceHigh = priceHighs[priceHighs.length - 2];
    
    const lastRsiHigh = rsiHighs[rsiHighs.length - 1];
    const prevRsiHigh = rsiHighs[rsiHighs.length - 2];
    
    // Divergencia bajista: precio hace un máximo más alto pero RSI hace un máximo más bajo
    if (lastPriceHigh.value > prevPriceHigh.value && lastRsiHigh.value < prevRsiHigh.value) {
      results.push({
        pattern: 'Divergencia Bajista',
        patternType: 'bearish',
        strength: 0.85,
        description: 'Divergencia regular bajista entre precio y RSI',
        strategy: {
          entry: 'En ruptura de estructura después de la divergencia',
          stopLoss: `Por encima del máximo reciente (${lastPriceHigh.value.toFixed(2)})`,
          takeProfit: 'Proyección 1:2 o siguiente soporte'
        }
      });
    }
  }
  
  // Buscar divergencias regulares alcistas (precio baja, RSI sube)
  if (priceLows.length >= 2 && rsiLows.length >= 2) {
    const lastPriceLow = priceLows[priceLows.length - 1];
    const prevPriceLow = priceLows[priceLows.length - 2];
    
    const lastRsiLow = rsiLows[rsiLows.length - 1];
    const prevRsiLow = rsiLows[rsiLows.length - 2];
    
    // Divergencia alcista: precio hace un mínimo más bajo pero RSI hace un mínimo más alto
    if (lastPriceLow.value < prevPriceLow.value && lastRsiLow.value > prevRsiLow.value) {
      results.push({
        pattern: 'Divergencia Alcista',
        patternType: 'bullish',
        strength: 0.85,
        description: 'Divergencia regular alcista entre precio y RSI',
        strategy: {
          entry: 'En ruptura de estructura después de la divergencia',
          stopLoss: `Por debajo del mínimo reciente (${lastPriceLow.value.toFixed(2)})`,
          takeProfit: 'Proyección 1:2 o siguiente resistencia'
        }
      });
    }
  }
  
  return results;
};

/**
 * Detecta formaciones de velas de triple tap tanto alcistas como bajistas
 */
export const analyzeTripleTap = (candles: Candle[]): PatternRecognitionResult[] => {
  if (candles.length < 30) return [];
  
  const results: PatternRecognitionResult[] = [];
  const recentCandles = candles.slice(-30);

  // Buscar triples toques de soporte (triple tap)
  const hasBullishTripleTap = detectBullishTripleTap(recentCandles);
  if (hasBullishTripleTap) {
    results.push({
      pattern: 'Triple Tap Alcista',
      patternType: 'bullish',
      strength: 0.9,
      description: 'Triple toque en nivel de soporte con reacción alcista',
      strategy: {
        entry: 'Confirmación de ruptura por encima del nivel de consolidación',
        stopLoss: 'Por debajo del último mínimo',
        takeProfit: 'Distancia desde el soporte hasta el nivel de consolidación, proyectada hacia arriba'
      }
    });
  }

  // Buscar triples toques de resistencia
  const hasBearishTripleTap = detectBearishTripleTap(recentCandles);
  if (hasBearishTripleTap) {
    results.push({
      pattern: 'Triple Tap Bajista',
      patternType: 'bearish',
      strength: 0.9,
      description: 'Triple toque en nivel de resistencia con reacción bajista',
      strategy: {
        entry: 'Confirmación de ruptura por debajo del nivel de consolidación',
        stopLoss: 'Por encima del último máximo',
        takeProfit: 'Distancia desde la resistencia hasta el nivel de consolidación, proyectada hacia abajo'
      }
    });
  }
  
  return results;
};

/**
 * Análisis completo de patrones avanzados
 */
export const analyzeAdvancedPatterns = (
  candles: Candle[],
  rsiValues: number[]
): PatternRecognitionResult[] => {
  if (candles.length < 50) return [];
  
  // Combinar todos los análisis de patrones
  const results: PatternRecognitionResult[] = [
    ...analyzeFibonacciPatterns(candles),
    ...analyzeHarmonicPatterns(candles),
    ...analyzeDivergencePatterns(candles, rsiValues),
    ...analyzeTripleTap(candles)
  ];
  
  // Ordenar por fuerza del patrón (de mayor a menor)
  return results.sort((a, b) => b.strength - a.strength);
};

// Funciones auxiliares para detección de patrones (implementaciones simplificadas)

/**
 * Detección simplificada de patrón Bullish Bat
 */
const detectBullishBat = (candles: Candle[]): boolean => {
  // Implementación simplificada para propósitos de demostración
  // Una implementación real requeriría análisis de puntos XABC con ratios Fibonacci específicos
  return false;
};

/**
 * Detección simplificada de patrón Bearish Gartley
 */
const detectBearishGartley = (candles: Candle[]): boolean => {
  // Implementación simplificada para propósitos de demostración
  // Una implementación real requeriría análisis de puntos XABC con ratios Fibonacci específicos
  return false;
};

/**
 * Detección simplificada de Triple Tap Alcista
 */
const detectBullishTripleTap = (candles: Candle[]): boolean => {
  // Implementación simplificada para propósitos de demostración
  if (candles.length < 15) return false;
  
  // Buscar tres mínimos similares
  let potentialSupport = 0;
  let supportTouches = 0;
  
  // Determinar un posible nivel de soporte
  const minLow = Math.min(...candles.map(c => c.low));
  potentialSupport = minLow;
  
  // Contar toques dentro de un 0.5% del nivel de soporte
  for (const candle of candles) {
    if (Math.abs(candle.low - potentialSupport) / potentialSupport < 0.005) {
      supportTouches++;
    }
  }
  
  // Si hay al menos 3 toques, y el último candle es alcista desde ese nivel
  const lastCandle = candles[candles.length - 1];
  return supportTouches >= 3 && Math.abs(lastCandle.low - potentialSupport) / potentialSupport < 0.005 && lastCandle.close > lastCandle.open;
};

/**
 * Detección simplificada de Triple Tap Bajista
 */
const detectBearishTripleTap = (candles: Candle[]): boolean => {
  // Implementación simplificada para propósitos de demostración
  if (candles.length < 15) return false;
  
  // Buscar tres máximos similares
  let potentialResistance = 0;
  let resistanceTouches = 0;
  
  // Determinar un posible nivel de resistencia
  const maxHigh = Math.max(...candles.map(c => c.high));
  potentialResistance = maxHigh;
  
  // Contar toques dentro de un 0.5% del nivel de resistencia
  for (const candle of candles) {
    if (Math.abs(candle.high - potentialResistance) / potentialResistance < 0.005) {
      resistanceTouches++;
    }
  }
  
  // Si hay al menos 3 toques, y el último candle es bajista desde ese nivel
  const lastCandle = candles[candles.length - 1];
  return resistanceTouches >= 3 && Math.abs(lastCandle.high - potentialResistance) / potentialResistance < 0.005 && lastCandle.close < lastCandle.open;
}; 