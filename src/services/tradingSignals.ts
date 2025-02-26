import { analyzeTechnicalSignals } from './technicalAnalysis';
import { getCoinPriceHistory, getCoinData, type CoinData, getActiveTradingPairs } from './api';
import { API_CONFIG } from '../config/api';
import { analyzeCandlestickPatterns } from './candlestickPatterns';
import { analyzeMarketSentiment } from './marketSentiment';
import { analyzeSqueezeIndicator } from './squeezeIndicator';
import { analyzeUltimateMacd } from './ultimateMacd';
import { analyzeSmartMoney } from './smartMoneyAnalysis';

export interface TradingSignal {
  symbol: string;
  signal: 'buy' | 'sell' | 'neutral';
  confidence: number;
  timestamp: number;
  price: number;
  priceChange24h: number;
  volume24h: number;
  technicalAnalysis: {
    signal: 'buy' | 'sell' | 'neutral';
    strength: number;
    indicators: {
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
    };
  };
  candlePatterns: {
    pattern: string;
    type: 'bullish' | 'bearish';
    strength: number;
  }[];
  marketSentiment: {
    overallSentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    relevantNews: {
      headline: string;
      sentiment: 'positive' | 'negative' | 'neutral';
      impact: number;
    }[];
  };
  smartMoney: {
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
  };
  reasons: string[];
}

export interface TopSignals {
  buySignals: TradingSignal[];
  sellSignals: TradingSignal[];
}

const generateSignalForSymbol = async (symbol: string, timeframe: string): Promise<TradingSignal> => {
  try {
    // Obtener datos históricos y precio actual
    const [priceHistory, currentCoinData, marketSentiment] = await Promise.all([
      getCoinPriceHistory(symbol, timeframe),
      getCoinData(symbol),
      analyzeMarketSentiment(symbol)
    ]);

    const prices = priceHistory.prices.map(p => p.price);
    const currentPrice = currentCoinData.price;

    // Análisis técnico
    const technicalAnalysis = analyzeTechnicalSignals(prices);

    // Análisis de patrones de velas
    const candles = priceHistory.prices.map((p, i, arr) => {
      const prevPrice = i > 0 ? arr[i - 1].price : p.price;
      return {
        time: p.time,
        open: prevPrice,
        close: p.price,
        high: Math.max(prevPrice, p.price),
        low: Math.min(prevPrice, p.price),
        volume: currentCoinData.volume / arr.length // Distribuir el volumen uniformemente por simplicidad
      };
    });
    const candlePatterns = analyzeCandlestickPatterns(candles);

    // Calcular señal y confianza basada en múltiples factores
    let signalConfidence = technicalAnalysis.strength;
    let finalSignal: 'buy' | 'sell' | 'neutral' = technicalAnalysis.signal;
    const reasons: string[] = [];

    // 1. Análisis RSI
    if (technicalAnalysis.indicators.rsi < 30) {
      reasons.push(`RSI en zona de sobreventa (${technicalAnalysis.indicators.rsi.toFixed(2)})`);
      signalConfidence *= 1.1;
      finalSignal = 'buy';
    } else if (technicalAnalysis.indicators.rsi > 70) {
      reasons.push(`RSI en zona de sobrecompra (${technicalAnalysis.indicators.rsi.toFixed(2)})`);
      signalConfidence *= 1.1;
      finalSignal = 'sell';
    }

    // 2. Análisis de Bandas de Bollinger
    const bbDeviation = (currentPrice - technicalAnalysis.indicators.bollingerBands.middle) /
      (technicalAnalysis.indicators.bollingerBands.upper - technicalAnalysis.indicators.bollingerBands.middle);

    if (currentPrice < technicalAnalysis.indicators.bollingerBands.lower) {
      reasons.push('Precio por debajo de la banda inferior de Bollinger');
      signalConfidence *= 1.15;
      finalSignal = 'buy';
    } else if (currentPrice > technicalAnalysis.indicators.bollingerBands.upper) {
      reasons.push('Precio por encima de la banda superior de Bollinger');
      signalConfidence *= 1.15;
      finalSignal = 'sell';
    }

    // 3. Análisis MACD Ultimate
    const ultimateMacd = analyzeUltimateMacd(prices);
    
    if (ultimateMacd.isCrossing) {
      const crossDirection = ultimateMacd.crossType === 'bullish' ? 'alcista' : 'bajista';
      reasons.push(`Cruce ${crossDirection} del MACD Ultimate`);
      signalConfidence *= 1.2;
      finalSignal = ultimateMacd.crossType === 'bullish' ? 'buy' : 'sell';
    }

    const histogramStrength = Math.abs(ultimateMacd.histogram);
    if (histogramStrength > 0) {
      const histogramTrend = ultimateMacd.histogram > 0 ? 'alcista' : 'bajista';
      reasons.push(`MACD Ultimate muestra tendencia ${histogramTrend} (Fuerza: ${histogramStrength.toFixed(4)})`);

      if (ultimateMacd.histogramColor === 'aqua' && finalSignal === 'buy') {
        reasons.push('Momentum alcista acelerando (histograma aqua)');
        signalConfidence *= 1.25;
      } else if (ultimateMacd.histogramColor === 'red' && finalSignal === 'sell') {
        reasons.push('Momentum bajista acelerando (histograma rojo)');
        signalConfidence *= 1.25;
      }
    }

    // Si el MACD y el precio muestran divergencia
    const priceChange = (currentPrice - prices[prices.length - 5]) / prices[prices.length - 5];
    const macdChange = (ultimateMacd.macd - ultimateMacd.signal) / Math.abs(ultimateMacd.signal);
    
    if (Math.sign(priceChange) !== Math.sign(macdChange) && Math.abs(priceChange) > 0.01) {
      reasons.push('Divergencia detectada entre precio y MACD Ultimate');
      if (macdChange > 0 && finalSignal === 'buy') {
        reasons.push('Divergencia alcista: precio bajando pero MACD subiendo');
        signalConfidence *= 1.3;
      } else if (macdChange < 0 && finalSignal === 'sell') {
        reasons.push('Divergencia bajista: precio subiendo pero MACD bajando');
        signalConfidence *= 1.3;
      }
    }

    // 4. Análisis de Volumen y Precio
    const volumeChange = currentCoinData.volume / prices.length;
    const avgVolume = prices.length > 0 ? currentCoinData.volume / prices.length : 0;
    const volumeRatio = currentCoinData.volume / avgVolume;

    // 4.1 Análisis de Volumen Relativo
    if (volumeRatio > 2) {
      reasons.push(`Volumen significativamente alto (${volumeRatio.toFixed(2)}x sobre el promedio)`);
      signalConfidence *= 1.2;
    }

    // 4.2 Análisis de Divergencia Volumen-Precio
    if (currentCoinData.priceChangePercent > 0 && volumeChange > 1.5) {
      reasons.push(`Aumento de precio (${currentCoinData.priceChangePercent.toFixed(2)}%) con volumen creciente (${volumeChange.toFixed(2)}x)`);
      if (finalSignal === 'buy') signalConfidence *= 1.25;
    } else if (currentCoinData.priceChangePercent < 0 && volumeChange > 1.5) {
      reasons.push(`Caída de precio (${Math.abs(currentCoinData.priceChangePercent).toFixed(2)}%) con volumen creciente (${volumeChange.toFixed(2)}x)`);
      if (finalSignal === 'sell') signalConfidence *= 1.25;
    }

    // 4.3 Análisis de Acumulación/Distribución
    const accumulationSignal = currentCoinData.priceChangePercent < 0 && volumeRatio < 0.7;
    const distributionSignal = currentCoinData.priceChangePercent > 0 && volumeRatio < 0.7;

    if (accumulationSignal) {
      reasons.push('Posible acumulación: caída de precio con volumen bajo');
      if (finalSignal === 'buy') signalConfidence *= 1.15;
    } else if (distributionSignal) {
      reasons.push('Posible distribución: subida de precio con volumen bajo');
      if (finalSignal === 'sell') signalConfidence *= 1.15;
    }

    // 5. Análisis de patrones de velas
    candlePatterns.forEach(pattern => {
      reasons.push(`Patrón de velas: ${pattern.pattern} (${pattern.type})`);
      if (pattern.type === 'bullish' && finalSignal === 'buy') {
        signalConfidence *= (1 + pattern.strength * 0.2);
      } else if (pattern.type === 'bearish' && finalSignal === 'sell') {
        signalConfidence *= (1 + pattern.strength * 0.2);
      }
    });

    // 6. Análisis de sentimiento del mercado
    if (marketSentiment.confidence > 0.3) {
      reasons.push(`Sentimiento del mercado: ${marketSentiment.overallSentiment.toUpperCase()} (Confianza: ${(marketSentiment.confidence * 100).toFixed(1)}%)`);
      if (marketSentiment.relevantNews.length > 0) {
        reasons.push(`Noticia relevante: ${marketSentiment.relevantNews[0].headline}`);
      }

      if (marketSentiment.overallSentiment === 'positive' && finalSignal === 'buy') {
        signalConfidence *= (1 + marketSentiment.confidence * 0.3);
      } else if (marketSentiment.overallSentiment === 'negative' && finalSignal === 'sell') {
        signalConfidence *= (1 + marketSentiment.confidence * 0.3);
      }
    }

    // 7. Tendencia de Precio
    const priceMA = prices.reduce((a, b) => a + b, 0) / prices.length;
    if (currentPrice > priceMA * 1.05) {
      reasons.push('Precio significativamente por encima de la media móvil');
      if (finalSignal === 'sell') signalConfidence *= 1.1;
    } else if (currentPrice < priceMA * 0.95) {
      reasons.push('Precio significativamente por debajo de la media móvil');
      if (finalSignal === 'buy') signalConfidence *= 1.1;
    }

    // 8. Análisis de Momentum con Volumen
    const momentumScore = (currentPrice / prices[0] - 1) * volumeRatio;
    if (Math.abs(momentumScore) > 0.1) {
      const momentumType = momentumScore > 0 ? 'alcista' : 'bajista';
      reasons.push(`Fuerte momentum ${momentumType} con soporte de volumen`);
      signalConfidence *= 1.15;
      finalSignal = momentumScore > 0 ? 'buy' : 'sell';
    }

    // Análisis del Squeeze Momentum
    const squeezeAnalysis = analyzeSqueezeIndicator(priceHistory.prices.map(p => ({
      high: p.price * 1.001, // Aproximación para high
      low: p.price * 0.999,  // Aproximación para low
      close: p.price
    })));

    // Ajustar la señal y confianza basada en el Squeeze Momentum
    if (squeezeAnalysis.isSqueezeOn) {
      reasons.push('Mercado en compresión (squeeze) - Posible movimiento fuerte próximo');
      signalConfidence *= 0.8; // Reducir confianza durante la compresión
    } else if (squeezeAnalysis.isSqueezeOff) {
      const momentumDirection = squeezeAnalysis.momentum > 0 ? 'alcista' : 'bajista';
      reasons.push(`Liberación de compresión con momentum ${momentumDirection}`);
      
      if (squeezeAnalysis.momentum > 0 && finalSignal === 'buy') {
        signalConfidence *= 1.3;
      } else if (squeezeAnalysis.momentum < 0 && finalSignal === 'sell') {
        signalConfidence *= 1.3;
      }
    }

    if (Math.abs(squeezeAnalysis.momentum) > 0.5) {
      const momentumStrength = Math.abs(squeezeAnalysis.momentum);
      reasons.push(`Fuerte momentum ${squeezeAnalysis.momentum > 0 ? 'alcista' : 'bajista'} (${momentumStrength.toFixed(2)})`);
      
      if (squeezeAnalysis.momentumColor === 'lime' && finalSignal === 'buy') {
        signalConfidence *= 1.25;
      } else if (squeezeAnalysis.momentumColor === 'red' && finalSignal === 'sell') {
        signalConfidence *= 1.25;
      }
    }

    // Análisis de Smart Money
    const smartMoneyAnalysis = analyzeSmartMoney(candles, {
      swingLength: 5,
      internalLength: 3,
      atr: technicalAnalysis.indicators.atr || 0,
      fvgThreshold: 0.1
    });

    // Ajustar señal y confianza basada en análisis de Smart Money
    if (smartMoneyAnalysis.swingStructure.bullishBOS || smartMoneyAnalysis.internalStructure.bullishBOS) {
      reasons.push('Break of Structure (BOS) alcista detectado');
      if (finalSignal === 'buy') signalConfidence *= 1.3;
    }

    if (smartMoneyAnalysis.swingStructure.bearishBOS || smartMoneyAnalysis.internalStructure.bearishBOS) {
      reasons.push('Break of Structure (BOS) bajista detectado');
      if (finalSignal === 'sell') signalConfidence *= 1.3;
    }

    if (smartMoneyAnalysis.swingStructure.bullishCHoCH || smartMoneyAnalysis.internalStructure.bullishCHoCH) {
      reasons.push('Change of Character (CHoCH) alcista detectado');
      if (finalSignal === 'buy') signalConfidence *= 1.25;
    }

    if (smartMoneyAnalysis.swingStructure.bearishCHoCH || smartMoneyAnalysis.internalStructure.bearishCHoCH) {
      reasons.push('Change of Character (CHoCH) bajista detectado');
      if (finalSignal === 'sell') signalConfidence *= 1.25;
    }

    // Analizar Order Blocks
    const recentBullishOB = [...smartMoneyAnalysis.orderBlocks.internal, ...smartMoneyAnalysis.orderBlocks.swing]
      .filter(ob => ob.type === 'bullish')
      .sort((a, b) => b.time - a.time)[0];

    const recentBearishOB = [...smartMoneyAnalysis.orderBlocks.internal, ...smartMoneyAnalysis.orderBlocks.swing]
      .filter(ob => ob.type === 'bearish')
      .sort((a, b) => b.time - a.time)[0];

    if (recentBullishOB && currentPrice <= recentBullishOB.high && currentPrice >= recentBullishOB.low) {
      reasons.push('Precio en zona de Order Block alcista');
      if (finalSignal === 'buy') signalConfidence *= 1.2;
    }

    if (recentBearishOB && currentPrice <= recentBearishOB.high && currentPrice >= recentBearishOB.low) {
      reasons.push('Precio en zona de Order Block bajista');
      if (finalSignal === 'sell') signalConfidence *= 1.2;
    }

    // Analizar Fair Value Gaps
    const recentFVGs = smartMoneyAnalysis.fairValueGaps
      .sort((a, b) => b.time - a.time)
      .slice(0, 3);

    for (const fvg of recentFVGs) {
      if (currentPrice >= fvg.bottom && currentPrice <= fvg.top) {
        reasons.push(`Precio en zona de Fair Value Gap ${fvg.type === 'bullish' ? 'alcista' : 'bajista'}`);
        if ((fvg.type === 'bullish' && finalSignal === 'buy') || 
            (fvg.type === 'bearish' && finalSignal === 'sell')) {
          signalConfidence *= 1.15;
        }
      }
    }

    // Analizar Zonas Premium/Discount
    if (currentPrice >= smartMoneyAnalysis.premiumZone.bottom) {
      reasons.push('Precio en zona Premium - posible oportunidad de venta');
      if (finalSignal === 'sell') signalConfidence *= 1.1;
    } else if (currentPrice <= smartMoneyAnalysis.discountZone.top) {
      reasons.push('Precio en zona Discount - posible oportunidad de compra');
      if (finalSignal === 'buy') signalConfidence *= 1.1;
    }

    return {
      symbol,
      signal: finalSignal,
      confidence: Math.min(signalConfidence, 1),
      timestamp: Date.now(),
      price: currentPrice,
      priceChange24h: currentCoinData.priceChangePercent,
      volume24h: currentCoinData.volume,
      technicalAnalysis,
      candlePatterns,
      marketSentiment,
      smartMoney: smartMoneyAnalysis,
      reasons
    };
  } catch (error) {
    console.error(`Error generating trading signals for ${symbol}:`, error);
    throw new Error(`No se pudieron generar las señales de trading para ${symbol}`);
  }
};

export const generateTradingSignals = async (timeframe: string): Promise<TopSignals> => {
  try {
    // Obtener los pares activos con mayor volumen
    const activePairs = await getActiveTradingPairs();

    // Obtener señales para los pares más activos
    const allSignals = await Promise.all(
      activePairs.map((symbol: string) => generateSignalForSymbol(symbol, timeframe).catch(error => {
        console.error(`Error con ${symbol}:`, error);
        return null;
      }))
    );

    // Filtrar señales válidas y separarlas por tipo
    const validSignals = allSignals.filter((signal): signal is TradingSignal => signal !== null);
    
    // Ordenar señales por confianza y volumen
    const sortSignals = (signals: TradingSignal[]) => 
      signals.sort((a, b) => {
        // Combinar confianza y volumen para el ranking
        const rankA = a.confidence * (a.volume24h * a.price);
        const rankB = b.confidence * (b.volume24h * b.price);
        return rankB - rankA;
      }).slice(0, 5);

    const buySignals = sortSignals(validSignals.filter(signal => signal.signal === 'buy'));
    const sellSignals = sortSignals(validSignals.filter(signal => signal.signal === 'sell'));

    return {
      buySignals,
      sellSignals
    };
  } catch (error) {
    console.error('Error generating all trading signals:', error);
    throw new Error('No se pudieron generar las señales de trading');
  }
}; 