import { generateDashboardSignals, DashboardSignal, SignalType } from './tradingSignals';
import axios from 'axios';
import { API_CONFIG } from '../config/api';

export interface SignalAnalysis {
  symbol: string;
  timestamp: number;
  type: 'buy' | 'sell';
  confidence: number;
  price: number;
  result?: {
    exitPrice: number;
    profit: number;
    profitPercentage: number;
  };
}

export interface PerformanceMetrics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  successRate: number;
  averageProfit: number;
  averageLoss: number;
  bestOperation: {
    symbol: string;
    profit: number;
    date: string;
  };
  worstOperation: {
    symbol: string;
    loss: number;
    date: string;
  };
  performanceByAsset: {
    symbol: string;
    totalOperations: number;
    successRate: number;
    averageReturn: number;
    totalReturn: number;
  }[];
  recentSignals: {
    symbol: string;
    type: 'buy' | 'sell';
    confidence: number;
    timestamp: number;
    price: number;
  }[];
}

export const analyzeSignals = async (timeframe: string = '30d'): Promise<PerformanceMetrics> => {
  try {
    // Obtener señales históricas (simulado por ahora)
    const signals: SignalAnalysis[] = await getHistoricalSignals(timeframe);
    
    // Calcular métricas
    const successfulOps = signals.filter(s => s.result && s.result.profitPercentage > 0);
    const failedOps = signals.filter(s => s.result && s.result.profitPercentage <= 0);
    
    // Agrupar por activo
    const assetPerformance = signals.reduce((acc, signal) => {
      if (!acc[signal.symbol]) {
        acc[signal.symbol] = {
          symbol: signal.symbol,
          totalOperations: 0,
          successfulOps: 0,
          totalReturn: 0
        };
      }
      
      const asset = acc[signal.symbol];
      asset.totalOperations++;
      if (signal.result) {
        if (signal.result.profitPercentage > 0) {
          asset.successfulOps++;
        }
        asset.totalReturn += signal.result.profitPercentage;
      }
      
      return acc;
    }, {} as Record<string, any>);

    // Convertir a array y calcular métricas por activo
    const performanceByAsset = Object.values(assetPerformance)
      .map(asset => ({
        symbol: asset.symbol,
        totalOperations: asset.totalOperations,
        successRate: (asset.successfulOps / asset.totalOperations) * 100,
        averageReturn: asset.totalReturn / asset.totalOperations,
        totalReturn: asset.totalReturn
      }))
      .sort((a, b) => b.totalReturn - a.totalReturn);

    // Obtener las señales más recientes
    const recentSignals = await getRecentSignals();

    return {
      totalOperations: signals.length,
      successfulOperations: successfulOps.length,
      failedOperations: failedOps.length,
      successRate: (successfulOps.length / signals.length) * 100,
      averageProfit: successfulOps.reduce((acc, op) => acc + op.result!.profitPercentage, 0) / successfulOps.length,
      averageLoss: Math.abs(failedOps.reduce((acc, op) => acc + op.result!.profitPercentage, 0) / failedOps.length),
      bestOperation: {
        symbol: successfulOps[0]?.symbol || '',
        profit: successfulOps[0]?.result?.profitPercentage || 0,
        date: new Date(successfulOps[0]?.timestamp || 0).toLocaleDateString()
      },
      worstOperation: {
        symbol: failedOps[0]?.symbol || '',
        loss: Math.abs(failedOps[0]?.result?.profitPercentage || 0),
        date: new Date(failedOps[0]?.timestamp || 0).toLocaleDateString()
      },
      performanceByAsset,
      recentSignals
    };
  } catch (error) {
    console.error('Error analyzing signals:', error);
    throw error;
  }
};

// Función auxiliar para obtener señales históricas
const getHistoricalSignals = async (timeframe: string): Promise<SignalAnalysis[]> => {
  try {
    // Obtener datos desde la API de Binance
    const api = axios.create({
      baseURL: API_CONFIG.BINANCE.BASE_URL,
      headers: {
        'Accept': 'application/json',
      }
    });
    
    // Determinar el intervalo y límite según el timeframe
    let interval = '1d';
    let limit = 30;
    
    if (timeframe === '7d') {
      interval = '4h';
      limit = 42;
    } else if (timeframe === '30d') {
      interval = '1d';
      limit = 30;
    } else if (timeframe === '90d') {
      interval = '3d';
      limit = 30;
    }
    
    // Lista de símbolos a analizar
    const symbols = Object.values(API_CONFIG.BINANCE.TRADING_PAIRS);
    const signals: SignalAnalysis[] = [];
    
    // Para cada símbolo, obtener datos históricos y generar señales
    for (const symbol of symbols) {
      const response = await api.get(API_CONFIG.BINANCE.ENDPOINTS.KLINES, {
        params: {
          symbol,
          interval,
          limit
        }
      });
      
      if (response.data && Array.isArray(response.data)) {
        // Binance devuelve datos en formato OHLCV
        // [timestamp, open, high, low, close, volume, ...]
        const klines = response.data;
        
        // Detectar patrones y generar señales
        let lastSignalType: 'buy' | 'sell' | null = null;
        
        for (let i = 5; i < klines.length; i++) {
          const currentClose = parseFloat(klines[i][4]);
          const prevClose = parseFloat(klines[i-1][4]);
          const ma5 = calculateMA(klines, i, 5);
          const ma20 = calculateMA(klines, i, 20);
          
          // Estrategia simple de cruce de medias móviles
          const prevMA5 = calculateMA(klines, i-1, 5);
          const prevMA20 = calculateMA(klines, i-1, 20);
          
          let type: 'buy' | 'sell' | null = null;
          let confidence = 0;
          
          if (prevMA5 <= prevMA20 && ma5 > ma20) {
            type = 'buy';
            confidence = 0.7 + (ma5 - ma20) / ma20 * 0.3;
          } else if (prevMA5 >= prevMA20 && ma5 < ma20) {
            type = 'sell';
            confidence = 0.7 + (ma20 - ma5) / ma5 * 0.3;
          }
          
          if (type && type !== lastSignalType) {
            // Si encontramos una señal válida
            const price = currentClose;
            const timestamp = klines[i][0];
            
            // Calcular el resultado si hay suficientes datos posteriores
            let result = undefined;
            if (i < klines.length - 3) {
              const exitPrice = parseFloat(klines[i+3][4]);
              const profit = exitPrice - price;
              const profitPercentage = (exitPrice - price) / price * 100 * (type === 'buy' ? 1 : -1);
              
              result = {
                exitPrice,
                profit,
                profitPercentage
              };
            }
            
            signals.push({
              symbol: symbol.replace('USDT', '/USDT'),
              timestamp: parseInt(timestamp),
              type,
              confidence: Math.min(0.99, confidence),
              price,
              result
            });
            
            lastSignalType = type;
          }
        }
      }
    }
    
    return signals.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error fetching historical signals:', error);
    return [];
  }
};

// Función para calcular la media móvil
const calculateMA = (klines: any[], currentIndex: number, period: number): number => {
  let sum = 0;
  const startIndex = Math.max(0, currentIndex - period + 1);
  
  for (let i = startIndex; i <= currentIndex; i++) {
    sum += parseFloat(klines[i][4]); // Precio de cierre
  }
  
  return sum / Math.min(period, currentIndex + 1);
};

// Función auxiliar para obtener señales recientes
const getRecentSignals = async (): Promise<SignalAnalysis[]> => {
  try {
    // Obtener datos actuales desde la API
    const api = axios.create({
      baseURL: API_CONFIG.BINANCE.BASE_URL,
      headers: {
        'Accept': 'application/json',
      }
    });
    
    // Lista de símbolos a analizar
    const symbols = Object.values(API_CONFIG.BINANCE.TRADING_PAIRS);
    const signals: SignalAnalysis[] = [];
    
    for (const symbol of symbols) {
      // Obtener datos de las últimas 24 horas con intervalos de 1 hora
      const response = await api.get(API_CONFIG.BINANCE.ENDPOINTS.KLINES, {
        params: {
          symbol,
          interval: '1h',
          limit: 24
        }
      });
      
      if (response.data && Array.isArray(response.data)) {
        const klines = response.data;
        
        // Analizar los últimos 6 períodos para detectar señales recientes
        const lastIndex = klines.length - 1;
        
        // Calcular indicadores
        const lastClose = parseFloat(klines[lastIndex][4]);
        const ma7 = calculateMA(klines, lastIndex, 7);
        const ma25 = calculateMA(klines, lastIndex, 25);
        const prevMA7 = calculateMA(klines, lastIndex - 1, 7);
        const prevMA25 = calculateMA(klines, lastIndex - 1, 25);
        
        // Evaluar posibles señales
        if (Math.abs(ma7 - ma25) / ma25 < 0.005) {
          // Las medias móviles están muy cerca, posible señal de cambio inminente
          const rsi = calculateRSI(klines, lastIndex, 14);
          
          if (rsi < 30) {
            // Sobreventa - Posible señal de compra
            signals.push({
              symbol: symbol.replace('USDT', '/USDT'),
              timestamp: parseInt(klines[lastIndex][0]),
              type: 'buy',
              confidence: 0.6 + (30 - rsi) / 30 * 0.3,
              price: lastClose
            });
          } else if (rsi > 70) {
            // Sobrecompra - Posible señal de venta
            signals.push({
              symbol: symbol.replace('USDT', '/USDT'),
              timestamp: parseInt(klines[lastIndex][0]),
              type: 'sell',
              confidence: 0.6 + (rsi - 70) / 30 * 0.3,
              price: lastClose
            });
          }
        } else if (prevMA7 <= prevMA25 && ma7 > ma25) {
          // Cruce alcista - Señal de compra
          signals.push({
            symbol: symbol.replace('USDT', '/USDT'),
            timestamp: parseInt(klines[lastIndex][0]),
            type: 'buy',
            confidence: 0.7 + (ma7 - ma25) / ma25 * 0.3,
            price: lastClose
          });
        } else if (prevMA7 >= prevMA25 && ma7 < ma25) {
          // Cruce bajista - Señal de venta
          signals.push({
            symbol: symbol.replace('USDT', '/USDT'),
            timestamp: parseInt(klines[lastIndex][0]),
            type: 'sell',
            confidence: 0.7 + (ma25 - ma7) / ma7 * 0.3,
            price: lastClose
          });
        }
      }
    }
    
    return signals.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error fetching recent signals:', error);
    return [];
  }
};

// Función para calcular el RSI
const calculateRSI = (klines: any[], currentIndex: number, period: number): number => {
  let gains = 0;
  let losses = 0;
  
  for (let i = Math.max(0, currentIndex - period); i < currentIndex; i++) {
    const currentClose = parseFloat(klines[i][4]);
    const prevClose = parseFloat(klines[i-1][4]);
    const change = currentClose - prevClose;
    
    if (change >= 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }
  
  if (losses === 0) return 100;
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  const rs = avgGain / avgLoss;
  
  return 100 - (100 / (1 + rs));
}; 