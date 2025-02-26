interface SmartMoneyResult {
  internalStructure: {
    bullishBOS: boolean;
    bearishBOS: boolean;
    bullishCHoCH: boolean;
    bearishCHoCH: boolean;
    trend: 'bullish' | 'bearish' | 'neutral';
  };
  swingStructure: {
    bullishBOS: boolean;
    bearishBOS: boolean;
    bullishCHoCH: boolean;
    bearishCHoCH: boolean;
    trend: 'bullish' | 'bearish' | 'neutral';
  };
  orderBlocks: {
    internal: Array<{
      high: number;
      low: number;
      time: number;
      type: 'bullish' | 'bearish';
    }>;
    swing: Array<{
      high: number;
      low: number;
      time: number;
      type: 'bullish' | 'bearish';
    }>;
  };
  fairValueGaps: Array<{
    top: number;
    bottom: number;
    type: 'bullish' | 'bearish';
    time: number;
  }>;
  premiumZone: {
    top: number;
    bottom: number;
  };
  discountZone: {
    top: number;
    bottom: number;
  };
  equilibriumZone: {
    top: number;
    bottom: number;
  };
}

const calculateSwingPoints = (prices: number[], length: number = 5): Array<{price: number, type: 'high' | 'low', time: number}> => {
  const swings: Array<{price: number, type: 'high' | 'low', time: number}> = [];
  
  for (let i = length; i < prices.length - length; i++) {
    const leftPrices = prices.slice(i - length, i);
    const rightPrices = prices.slice(i + 1, i + length + 1);
    const currentPrice = prices[i];

    const isHigh = Math.max(...leftPrices) <= currentPrice && Math.max(...rightPrices) < currentPrice;
    const isLow = Math.min(...leftPrices) >= currentPrice && Math.min(...rightPrices) > currentPrice;

    if (isHigh || isLow) {
      swings.push({
        price: currentPrice,
        type: isHigh ? 'high' : 'low',
        time: i
      });
    }
  }

  return swings;
};

const detectStructureBreaks = (
  swings: Array<{price: number, type: 'high' | 'low', time: number}>,
  currentPrice: number,
  previousTrend: 'bullish' | 'bearish' | 'neutral'
): {
  bullishBOS: boolean;
  bearishBOS: boolean;
  bullishCHoCH: boolean;
  bearishCHoCH: boolean;
  trend: 'bullish' | 'bearish' | 'neutral';
} => {
  let bullishBOS = false;
  let bearishBOS = false;
  let bullishCHoCH = false;
  let bearishCHoCH = false;
  let trend = previousTrend;

  const lastSwings = swings.slice(-4);
  
  if (lastSwings.length >= 2) {
    const lastHigh = lastSwings.find(s => s.type === 'high')?.price || 0;
    const lastLow = lastSwings.find(s => s.type === 'low')?.price || 0;
    
    // Detectar Break of Structure (BOS)
    if (currentPrice > lastHigh && previousTrend === 'bearish') {
      bullishBOS = true;
      trend = 'bullish';
    } else if (currentPrice < lastLow && previousTrend === 'bullish') {
      bearishBOS = true;
      trend = 'bearish';
    }

    // Detectar Change of Character (CHoCH)
    if (lastSwings.length >= 4) {
      const [swing1, swing2, swing3, swing4] = lastSwings;
      
      if (swing1.type === 'low' && swing3.type === 'low' && 
          swing2.type === 'high' && swing4.type === 'high') {
        if (swing3.price > swing1.price && swing4.price > swing2.price) {
          bullishCHoCH = true;
          trend = 'bullish';
        }
      }
      
      if (swing1.type === 'high' && swing3.type === 'high' && 
          swing2.type === 'low' && swing4.type === 'low') {
        if (swing3.price < swing1.price && swing4.price < swing2.price) {
          bearishCHoCH = true;
          trend = 'bearish';
        }
      }
    }
  }

  return {
    bullishBOS,
    bearishBOS,
    bullishCHoCH,
    bearishCHoCH,
    trend
  };
};

const detectOrderBlocks = (
  candles: Array<{high: number, low: number, time: number}>,
  swings: Array<{price: number, type: 'high' | 'low', time: number}>,
  atr: number
): Array<{high: number, low: number, time: number, type: 'bullish' | 'bearish'}> => {
  const orderBlocks: Array<{high: number, low: number, time: number, type: 'bullish' | 'bearish'}> = [];

  for (let i = 1; i < swings.length; i++) {
    const currentSwing = swings[i];
    const previousSwing = swings[i-1];
    
    if (currentSwing.type !== previousSwing.type) {
      const candlesBetween = candles.slice(
        previousSwing.time,
        currentSwing.time
      );

      if (currentSwing.type === 'high') {
        // Buscar bloque de orden bajista
        const potentialOB = candlesBetween.reduce((acc, candle) => {
          const range = candle.high - candle.low;
          if (range <= 2 * atr) {
            return !acc || candle.high > acc.high ? candle : acc;
          }
          return acc;
        }, null as any);

        if (potentialOB) {
          orderBlocks.push({
            ...potentialOB,
            type: 'bearish'
          });
        }
      } else {
        // Buscar bloque de orden alcista
        const potentialOB = candlesBetween.reduce((acc, candle) => {
          const range = candle.high - candle.low;
          if (range <= 2 * atr) {
            return !acc || candle.low < acc.low ? candle : acc;
          }
          return acc;
        }, null as any);

        if (potentialOB) {
          orderBlocks.push({
            ...potentialOB,
            type: 'bullish'
          });
        }
      }
    }
  }

  return orderBlocks;
};

const detectFairValueGaps = (
  candles: Array<{high: number, low: number, time: number}>,
  threshold: number = 0.1
): Array<{top: number, bottom: number, type: 'bullish' | 'bearish', time: number}> => {
  const gaps: Array<{top: number, bottom: number, type: 'bullish' | 'bearish', time: number}> = [];

  for (let i = 2; i < candles.length; i++) {
    const current = candles[i];
    const previous = candles[i-1];
    const previous2 = candles[i-2];

    // Bullish FVG
    if (current.low > previous2.high) {
      const gapSize = (current.low - previous2.high) / previous2.high;
      if (gapSize > threshold) {
        gaps.push({
          top: current.low,
          bottom: previous2.high,
          type: 'bullish',
          time: current.time
        });
      }
    }

    // Bearish FVG
    if (current.high < previous2.low) {
      const gapSize = (previous2.low - current.high) / previous2.low;
      if (gapSize > threshold) {
        gaps.push({
          top: previous2.low,
          bottom: current.high,
          type: 'bearish',
          time: current.time
        });
      }
    }
  }

  return gaps;
};

const calculateZones = (
  swings: Array<{price: number, type: 'high' | 'low', time: number}>
): {
  premiumZone: {top: number, bottom: number},
  discountZone: {top: number, bottom: number},
  equilibriumZone: {top: number, bottom: number}
} => {
  const highestSwing = Math.max(...swings.filter(s => s.type === 'high').map(s => s.price));
  const lowestSwing = Math.min(...swings.filter(s => s.type === 'low').map(s => s.price));
  const range = highestSwing - lowestSwing;

  return {
    premiumZone: {
      top: highestSwing,
      bottom: highestSwing - range * 0.05
    },
    discountZone: {
      top: lowestSwing + range * 0.05,
      bottom: lowestSwing
    },
    equilibriumZone: {
      top: lowestSwing + range * 0.525,
      bottom: lowestSwing + range * 0.475
    }
  };
};

export const analyzeSmartMoney = (
  candles: Array<{high: number, low: number, close: number, time: number}>,
  options = {
    swingLength: 5,
    internalLength: 3,
    atr: 0,
    fvgThreshold: 0.1
  }
): SmartMoneyResult => {
  const prices = candles.map(c => c.close);
  const swings = calculateSwingPoints(prices, options.swingLength);
  const internalSwings = calculateSwingPoints(prices, options.internalLength);

  const currentPrice = prices[prices.length - 1];
  
  const swingStructure = detectStructureBreaks(swings, currentPrice, 'neutral');
  const internalStructure = detectStructureBreaks(internalSwings, currentPrice, 'neutral');

  const orderBlocks = {
    swing: detectOrderBlocks(candles, swings, options.atr),
    internal: detectOrderBlocks(candles, internalSwings, options.atr)
  };

  const fairValueGaps = detectFairValueGaps(candles, options.fvgThreshold);
  const zones = calculateZones(swings);

  return {
    swingStructure,
    internalStructure,
    orderBlocks,
    fairValueGaps,
    ...zones
  };
}; 