import { generateSignalForSymbol } from './tradingSignals';

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
  // Aquí deberías implementar la lógica para obtener las señales históricas
  // desde tu base de datos o sistema de almacenamiento
  
  // Por ahora, retornamos datos simulados
  const now = Date.now();
  const signals: SignalAnalysis[] = [];
  const symbols = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT'];
  
  for (let i = 0; i < 100; i++) {
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const type = Math.random() > 0.5 ? 'buy' : 'sell';
    const price = 1000 + Math.random() * 9000;
    const exitPrice = price * (1 + (Math.random() * 0.2 - 0.1));
    const profitPercentage = ((exitPrice - price) / price) * 100 * (type === 'buy' ? 1 : -1);
    
    signals.push({
      symbol,
      timestamp: now - (i * 86400000), // Restamos días
      type,
      confidence: 0.5 + Math.random() * 0.5,
      price,
      result: {
        exitPrice,
        profit: exitPrice - price,
        profitPercentage
      }
    });
  }
  
  return signals.sort((a, b) => b.timestamp - a.timestamp);
};

// Función auxiliar para obtener señales recientes
const getRecentSignals = async (): Promise<SignalAnalysis[]> => {
  // Aquí deberías implementar la lógica para obtener las señales más recientes
  // desde tu sistema de generación de señales
  
  // Por ahora, retornamos algunas señales simuladas
  const now = Date.now();
  return [
    {
      symbol: 'BTC/USDT',
      timestamp: now - 7200000, // 2 horas atrás
      type: 'buy',
      confidence: 0.85,
      price: 45000
    },
    {
      symbol: 'ETH/USDT',
      timestamp: now - 14400000, // 4 horas atrás
      type: 'sell',
      confidence: 0.75,
      price: 2800
    },
    {
      symbol: 'BNB/USDT',
      timestamp: now - 21600000, // 6 horas atrás
      type: 'buy',
      confidence: 0.65,
      price: 350
    }
  ] as SignalAnalysis[];
}; 