interface UltimateMacdResult {
  macd: number;
  signal: number;
  histogram: number;
  histogramColor: 'aqua' | 'blue' | 'red' | 'maroon' | 'yellow' | 'gray';
  macdColor: 'lime' | 'red';
  signalColor: 'yellow' | 'lime';
  isCrossing: boolean;
  crossType: 'bullish' | 'bearish' | null;
}

interface UltimateMacdOptions {
  fastLength: number;
  slowLength: number;
  signalLength: number;
  useHistogramColorChange: boolean;
  useMacdColorChange: boolean;
}

const calculateEMA = (values: number[], length: number): number[] => {
  const k = 2 / (length + 1);
  const ema = [values[0]];
  
  for (let i = 1; i < values.length; i++) {
    ema[i] = values[i] * k + ema[i-1] * (1-k);
  }
  
  return ema;
};

const calculateSMA = (values: number[], length: number): number[] => {
  const sma: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < length - 1) {
      sma[i] = values[i];
      continue;
    }
    const sum = values.slice(i - length + 1, i + 1).reduce((a, b) => a + b, 0);
    sma[i] = sum / length;
  }
  return sma;
};

export const analyzeUltimateMacd = (
  prices: number[],
  options: UltimateMacdOptions = {
    fastLength: 12,
    slowLength: 26,
    signalLength: 9,
    useHistogramColorChange: true,
    useMacdColorChange: true
  }
): UltimateMacdResult => {
  const { 
    fastLength, 
    slowLength, 
    signalLength,
    useHistogramColorChange,
    useMacdColorChange
  } = options;

  // Calcular EMAs
  const fastEMA = calculateEMA(prices, fastLength);
  const slowEMA = calculateEMA(prices, slowLength);

  // Calcular MACD
  const macdLine = fastEMA.map((fast, i) => fast - slowEMA[i]);
  
  // Calcular Línea de Señal (Signal Line)
  const signalLine = calculateSMA(macdLine, signalLength);
  
  // Calcular Histograma
  const histogram = macdLine.map((macd, i) => macd - signalLine[i]);

  // Obtener valores actuales
  const currentMacd = macdLine[macdLine.length - 1];
  const currentSignal = signalLine[signalLine.length - 1];
  const currentHist = histogram[histogram.length - 1];
  const prevHist = histogram[histogram.length - 2];

  // Determinar colores del histograma
  let histogramColor: 'aqua' | 'blue' | 'red' | 'maroon' | 'yellow' | 'gray' = 'gray';
  
  if (useHistogramColorChange) {
    const histA_IsUp = currentHist > prevHist && currentHist > 0;
    const histA_IsDown = currentHist < prevHist && currentHist > 0;
    const histB_IsDown = currentHist < prevHist && currentHist <= 0;
    const histB_IsUp = currentHist > prevHist && currentHist <= 0;

    if (histA_IsUp) histogramColor = 'aqua';
    else if (histA_IsDown) histogramColor = 'blue';
    else if (histB_IsDown) histogramColor = 'red';
    else if (histB_IsUp) histogramColor = 'maroon';
  }

  // Determinar colores del MACD y Signal
  const macd_IsAbove = currentMacd >= currentSignal;
  
  const macdColor = useMacdColorChange ? (macd_IsAbove ? 'lime' : 'red') : 'red';
  const signalColor = useMacdColorChange ? 'yellow' : 'lime';

  // Detectar cruce
  const prevMacd = macdLine[macdLine.length - 2];
  const prevSignal = signalLine[signalLine.length - 2];
  const isCrossing = (currentMacd > currentSignal && prevMacd <= prevSignal) ||
                    (currentMacd < currentSignal && prevMacd >= prevSignal);
  
  let crossType: 'bullish' | 'bearish' | null = null;
  if (isCrossing) {
    crossType = currentMacd > currentSignal ? 'bullish' : 'bearish';
  }

  return {
    macd: currentMacd,
    signal: currentSignal,
    histogram: currentHist,
    histogramColor,
    macdColor,
    signalColor,
    isCrossing,
    crossType
  };
}; 