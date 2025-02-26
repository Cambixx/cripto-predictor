interface OHLCV {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TechnicalIndicators {
  rsi: number;
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
  };
  ema: {
    ema9: number;
    ema21: number;
    ema50: number;
  };
  stochastic: {
    k: number;
    d: number;
  };
  adx: {
    adx: number;
    plusDI: number;
    minusDI: number;
  };
  atr: number;
}

// Calcula el RSI (Relative Strength Index)
export const calculateRSI = (prices: number[], period: number = 14): number => {
  if (prices.length < period + 1) {
    return 50;
  }

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const difference = prices[i] - prices[i - 1];
    if (difference >= 0) {
      gains += difference;
    } else {
      losses -= difference;
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < prices.length; i++) {
    const difference = prices[i] - prices[i - 1];
    if (difference >= 0) {
      avgGain = (avgGain * (period - 1) + difference) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - difference) / period;
    }
  }

  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

// Calcula las bandas de Bollinger
export const calculateBollingerBands = (prices: number[], period: number = 20, stdDev: number = 2) => {
  if (prices.length < period) {
    return { upper: prices[prices.length - 1], middle: prices[prices.length - 1], lower: prices[prices.length - 1] };
  }

  const sma = prices.slice(-period).reduce((a, b) => a + b) / period;
  const squaredDifferences = prices.slice(-period).map(price => Math.pow(price - sma, 2));
  const standardDeviation = Math.sqrt(squaredDifferences.reduce((a, b) => a + b) / period);

  return {
    upper: sma + (standardDeviation * stdDev),
    middle: sma,
    lower: sma - (standardDeviation * stdDev)
  };
};

// Calcula el MACD (Moving Average Convergence Divergence)
export const calculateMACD = (prices: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) => {
  const calculateEMA = (prices: number[], period: number): number[] => {
    const k = 2 / (period + 1);
    const ema = [prices[0]];
    
    for (let i = 1; i < prices.length; i++) {
      ema.push(prices[i] * k + ema[i - 1] * (1 - k));
    }
    
    return ema;
  };

  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);
  const macdLine = fastEMA.map((fast, i) => fast - slowEMA[i]);
  const signalLine = calculateEMA(macdLine, signalPeriod);
  const histogram = macdLine.map((macd, i) => macd - signalLine[i]);

  return {
    macdLine: macdLine[macdLine.length - 1],
    signalLine: signalLine[signalLine.length - 1],
    histogram: histogram[histogram.length - 1]
  };
};

// Calcula EMA (Exponential Moving Average)
const calculateEMA = (prices: number[]) => {
  const calculateSingleEMA = (prices: number[], period: number): number => {
    const k = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }
    
    return ema;
  };

  return {
    ema9: calculateSingleEMA(prices, 9),
    ema21: calculateSingleEMA(prices, 21),
    ema50: calculateSingleEMA(prices, 50)
  };
};

// Calcula el Stochastic Oscillator
const calculateStochastic = (prices: number[], period: number = 14, smoothK: number = 3, smoothD: number = 3) => {
  const getLowestLow = (prices: number[], start: number, length: number) => 
    Math.min(...prices.slice(start - length + 1, start + 1));
  
  const getHighestHigh = (prices: number[], start: number, length: number) => 
    Math.max(...prices.slice(start - length + 1, start + 1));

  if (prices.length < period) {
    return { k: 50, d: 50 };
  }

  const kValues: number[] = [];
  
  for (let i = period - 1; i < prices.length; i++) {
    const currentPrice = prices[i];
    const lowestLow = getLowestLow(prices, i, period);
    const highestHigh = getHighestHigh(prices, i, period);
    const k = ((currentPrice - lowestLow) / (highestHigh - lowestLow)) * 100;
    kValues.push(k);
  }

  const k = kValues.slice(-smoothK).reduce((a, b) => a + b) / smoothK;
  const d = kValues.slice(-smoothD).reduce((a, b) => a + b) / smoothD;

  return { k, d };
};

// Calcula el ADX (Average Directional Index)
const calculateADX = (prices: number[], period: number = 14) => {
  if (prices.length < period + 1) {
    return { adx: 50, plusDI: 50, minusDI: 50 };
  }

  const tr: number[] = [0];
  const plusDM: number[] = [0];
  const minusDM: number[] = [0];

  for (let i = 1; i < prices.length; i++) {
    const high = prices[i];
    const low = prices[i - 1];
    const prevHigh = prices[i - 1];
    const prevLow = prices[i - 1];

    const plusMove = high - prevHigh;
    const minusMove = prevLow - low;

    plusDM.push(plusMove > minusMove && plusMove > 0 ? plusMove : 0);
    minusDM.push(minusMove > plusMove && minusMove > 0 ? minusMove : 0);
    tr.push(Math.max(high - low, Math.abs(high - prevLow), Math.abs(low - prevHigh)));
  }

  const smoothTR = tr.slice(-period).reduce((a, b) => a + b) / period;
  const smoothPlusDM = plusDM.slice(-period).reduce((a, b) => a + b) / period;
  const smoothMinusDM = minusDM.slice(-period).reduce((a, b) => a + b) / period;

  const plusDI = (smoothPlusDM / smoothTR) * 100;
  const minusDI = (smoothMinusDM / smoothTR) * 100;
  const dx = Math.abs((plusDI - minusDI) / (plusDI + minusDI)) * 100;
  const adx = dx; // Normalmente se suavizaría más, pero para simplicidad usamos DX directamente

  return { adx, plusDI, minusDI };
};

// Calcular ATR
const calculateATR = (prices: number[]): number => {
  const tr = prices.map((price, i) => {
    if (i === 0) return 0;
    const high = Math.max(price, prices[i-1]);
    const low = Math.min(price, prices[i-1]);
    return high - low;
  });

  return tr.reduce((sum, value) => sum + value, 0) / tr.length;
};

// Analiza las señales técnicas
export const analyzeTechnicalSignals = (prices: number[]): { signal: 'buy' | 'sell' | 'neutral'; strength: number; indicators: TechnicalIndicators } => {
  const rsi = calculateRSI(prices);
  const bollingerBands = calculateBollingerBands(prices);
  const macd = calculateMACD(prices);
  const ema = calculateEMA(prices);
  const stochastic = calculateStochastic(prices);
  const adx = calculateADX(prices);

  let buySignals = 0;
  let sellSignals = 0;
  let totalSignals = 0;

  // RSI
  if (rsi < 30) buySignals++;
  else if (rsi > 70) sellSignals++;
  totalSignals++;

  // Bollinger Bands
  const currentPrice = prices[prices.length - 1];
  if (currentPrice < bollingerBands.lower) buySignals++;
  else if (currentPrice > bollingerBands.upper) sellSignals++;
  totalSignals++;

  // MACD
  if (macd.histogram > 0 && macd.macdLine > macd.signalLine) buySignals++;
  else if (macd.histogram < 0 && macd.macdLine < macd.signalLine) sellSignals++;
  totalSignals++;

  // EMA Crossovers
  if (ema.ema9 > ema.ema21 && ema.ema21 > ema.ema50) buySignals++;
  else if (ema.ema9 < ema.ema21 && ema.ema21 < ema.ema50) sellSignals++;
  totalSignals++;

  // Stochastic
  if (stochastic.k < 20 && stochastic.d < 20) buySignals++;
  else if (stochastic.k > 80 && stochastic.d > 80) sellSignals++;
  totalSignals++;

  // ADX
  if (adx.adx > 25) {
    if (adx.plusDI > adx.minusDI) buySignals++;
    else if (adx.minusDI > adx.plusDI) sellSignals++;
  }
  totalSignals++;

  const signal = 
    buySignals > sellSignals ? 'buy' :
    sellSignals > buySignals ? 'sell' :
    'neutral';

  const strength = Math.max(buySignals, sellSignals) / totalSignals;

  // Calcular ATR
  const atr = calculateATR(prices);

  return {
    signal,
    strength,
    indicators: {
      rsi,
      bollingerBands,
      macd,
      ema,
      stochastic,
      adx,
      atr
    }
  };
}; 