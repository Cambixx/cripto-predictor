interface SqueezeResult {
  isSqueezeOn: boolean;
  isSqueezeOff: boolean;
  momentum: number;
  momentumColor: 'lime' | 'green' | 'red' | 'maroon';
  squeezeColor: 'blue' | 'black' | 'gray';
}

const calculateStdev = (values: number[], length: number): number => {
  const mean = values.slice(-length).reduce((a, b) => a + b, 0) / length;
  const variance = values.slice(-length).reduce((a, b) => a + Math.pow(b - mean, 2), 0) / length;
  return Math.sqrt(variance);
};

const calculateSMA = (values: number[], length: number): number => {
  return values.slice(-length).reduce((a, b) => a + b, 0) / length;
};

const calculateTR = (high: number, low: number, prevClose: number): number => {
  const hl = high - low;
  const hc = Math.abs(high - prevClose);
  const lc = Math.abs(low - prevClose);
  return Math.max(hl, hc, lc);
};

const calculateLinReg = (values: number[], length: number): number => {
  const x = Array.from({length}, (_, i) => i);
  const y = values.slice(-length);
  
  const n = length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
  const sumXX = x.reduce((a, b) => a + b * b, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return slope * (length - 1) + intercept;
};

export const analyzeSqueezeIndicator = (
  prices: { high: number; low: number; close: number }[],
  options = {
    bbLength: 20,
    bbMultFactor: 2.0,
    kcLength: 20,
    kcMultFactor: 1.5,
    useTrueRange: true
  }
): SqueezeResult => {
  const { bbLength, bbMultFactor, kcLength, kcMultFactor, useTrueRange } = options;
  const closes = prices.map(p => p.close);
  const highs = prices.map(p => p.high);
  const lows = prices.map(p => p.low);

  // Calcular Bandas de Bollinger
  const basisBB = calculateSMA(closes, bbLength);
  const devBB = bbMultFactor * calculateStdev(closes, bbLength);
  const upperBB = basisBB + devBB;
  const lowerBB = basisBB - devBB;

  // Calcular Canal de Keltner
  const maKC = calculateSMA(closes, kcLength);
  const ranges = prices.map((p, i) => 
    useTrueRange && i > 0 
      ? calculateTR(p.high, p.low, prices[i-1].close)
      : p.high - p.low
  );
  const rangeMA = calculateSMA(ranges, kcLength);
  const upperKC = maKC + rangeMA * kcMultFactor;
  const lowerKC = maKC - rangeMA * kcMultFactor;

  // Determinar estado del squeeze
  const sqzOn = lowerBB > lowerKC && upperBB < upperKC;
  const sqzOff = lowerBB < lowerKC && upperBB > upperKC;

  // Calcular momentum
  const highest = Math.max(...highs.slice(-kcLength));
  const lowest = Math.min(...lows.slice(-kcLength));
  const avg1 = (highest + lowest) / 2;
  const avg2 = calculateSMA(closes, kcLength);
  const avg = (avg1 + avg2) / 2;
  
  const source = closes[closes.length - 1];
  const momentum = calculateLinReg(
    prices.slice(-kcLength).map(p => p.close - avg),
    kcLength
  );

  // Determinar colores
  const prevMomentum = calculateLinReg(
    prices.slice(-kcLength-1, -1).map(p => p.close - avg),
    kcLength
  );

  let momentumColor: 'lime' | 'green' | 'red' | 'maroon';
  if (momentum > 0) {
    momentumColor = momentum > prevMomentum ? 'lime' : 'green';
  } else {
    momentumColor = momentum < prevMomentum ? 'red' : 'maroon';
  }

  let squeezeColor: 'blue' | 'black' | 'gray';
  if (!sqzOn && !sqzOff) {
    squeezeColor = 'blue';
  } else if (sqzOn) {
    squeezeColor = 'black';
  } else {
    squeezeColor = 'gray';
  }

  return {
    isSqueezeOn: sqzOn,
    isSqueezeOff: sqzOff,
    momentum,
    momentumColor,
    squeezeColor
  };
}; 