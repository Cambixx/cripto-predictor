interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  time: number;
}

interface PatternResult {
  pattern: string;
  type: 'bullish' | 'bearish';
  strength: number;
}

// Función auxiliar para calcular el tamaño del cuerpo de la vela
const getBodySize = (candle: Candle): number => Math.abs(candle.close - candle.open);
const getShadowSize = (candle: Candle): number => candle.high - candle.low;
const isGreen = (candle: Candle): boolean => candle.close > candle.open;

// Detecta patrones de velas japonesas
export const analyzeCandlestickPatterns = (candles: Candle[]): PatternResult[] => {
  if (candles.length < 3) return [];
  const patterns: PatternResult[] = [];

  // Obtener las últimas tres velas para el análisis
  const current = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const prevPrev = candles[candles.length - 3];

  // 1. Patrón de Martillo/Martillo Invertido
  const hammerAnalysis = analyzeHammer(current);
  if (hammerAnalysis) patterns.push(hammerAnalysis);

  // 2. Patrón de Envolvente (Engulfing)
  const engulfingAnalysis = analyzeEngulfing(current, prev);
  if (engulfingAnalysis) patterns.push(engulfingAnalysis);

  // 3. Patrón de Estrella de la Mañana/Noche
  const starAnalysis = analyzeMorningStar(current, prev, prevPrev);
  if (starAnalysis) patterns.push(starAnalysis);

  // 4. Patrón de Doji
  const dojiAnalysis = analyzeDoji(current);
  if (dojiAnalysis) patterns.push(dojiAnalysis);

  // 5. Tres Soldados Blancos/Tres Cuervos Negros
  const threePatternAnalysis = analyzeThreePattern(current, prev, prevPrev);
  if (threePatternAnalysis) patterns.push(threePatternAnalysis);

  return patterns;
};

// Análisis de Martillo/Martillo Invertido
const analyzeHammer = (candle: Candle): PatternResult | null => {
  const bodySize = getBodySize(candle);
  const shadowSize = getShadowSize(candle);
  const upperShadow = candle.high - Math.max(candle.open, candle.close);
  const lowerShadow = Math.min(candle.open, candle.close) - candle.low;

  // El cuerpo debe ser pequeño comparado con la sombra
  if (bodySize > shadowSize * 0.3) return null;

  if (lowerShadow > bodySize * 2 && upperShadow < bodySize) {
    return {
      pattern: 'Martillo',
      type: 'bullish',
      strength: 0.7
    };
  }

  if (upperShadow > bodySize * 2 && lowerShadow < bodySize) {
    return {
      pattern: 'Martillo Invertido',
      type: 'bearish',
      strength: 0.7
    };
  }

  return null;
};

// Análisis de Envolvente (Engulfing)
const analyzeEngulfing = (current: Candle, prev: Candle): PatternResult | null => {
  const currentBody = getBodySize(current);
  const prevBody = getBodySize(prev);

  if (currentBody <= prevBody) return null;

  if (isGreen(current) && !isGreen(prev) && current.close > prev.open && current.open < prev.close) {
    return {
      pattern: 'Envolvente Alcista',
      type: 'bullish',
      strength: 0.85
    };
  }

  if (!isGreen(current) && isGreen(prev) && current.close < prev.open && current.open > prev.close) {
    return {
      pattern: 'Envolvente Bajista',
      type: 'bearish',
      strength: 0.85
    };
  }

  return null;
};

// Análisis de Estrella de la Mañana/Noche
const analyzeMorningStar = (current: Candle, prev: Candle, prevPrev: Candle): PatternResult | null => {
  const isMiddleSmall = getBodySize(prev) < getBodySize(prevPrev) * 0.3;
  
  if (!isMiddleSmall) return null;

  if (isGreen(current) && !isGreen(prevPrev) && 
      current.close > (prevPrev.open + prevPrev.close) / 2) {
    return {
      pattern: 'Estrella de la Mañana',
      type: 'bullish',
      strength: 0.9
    };
  }

  if (!isGreen(current) && isGreen(prevPrev) && 
      current.close < (prevPrev.open + prevPrev.close) / 2) {
    return {
      pattern: 'Estrella de la Noche',
      type: 'bearish',
      strength: 0.9
    };
  }

  return null;
};

// Análisis de Doji
const analyzeDoji = (candle: Candle): PatternResult | null => {
  const bodySize = getBodySize(candle);
  const shadowSize = getShadowSize(candle);

  if (bodySize < shadowSize * 0.1) {
    return {
      pattern: 'Doji',
      type: Math.abs(candle.high - candle.open) > Math.abs(candle.low - candle.open) ? 'bearish' : 'bullish',
      strength: 0.6
    };
  }

  return null;
};

// Análisis de Tres Soldados/Cuervos
const analyzeThreePattern = (current: Candle, prev: Candle, prevPrev: Candle): PatternResult | null => {
  const allGreen = isGreen(current) && isGreen(prev) && isGreen(prevPrev);
  const allRed = !isGreen(current) && !isGreen(prev) && !isGreen(prevPrev);

  if (allGreen && 
      current.close > prev.close && prev.close > prevPrev.close &&
      current.open > prev.open && prev.open > prevPrev.open) {
    return {
      pattern: 'Tres Soldados Blancos',
      type: 'bullish',
      strength: 0.95
    };
  }

  if (allRed && 
      current.close < prev.close && prev.close < prevPrev.close &&
      current.open < prev.open && prev.open < prevPrev.open) {
    return {
      pattern: 'Tres Cuervos Negros',
      type: 'bearish',
      strength: 0.95
    };
  }

  return null;
}; 