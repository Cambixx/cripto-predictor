import axios from 'axios';
import { API_CONFIG } from '../config/api';
import { calculateRSI, calculateMACD } from './tradingSignals';

export interface BacktestResult {
  symbol: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalCapital: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  trades: TradeResult[];
  returns: number[];
  equity: number[];
  performance: number;
}

export interface TradeResult {
  id: number;
  type: 'buy' | 'sell';
  entryDate: string;
  entryPrice: number;
  exitDate: string;
  exitPrice: number;
  profit: number;
  profitPercent: number;
  duration: number;
  reason: string;
}

export interface BacktestStrategy {
  name: string;
  description: string;
  params: Record<string, number>;
  entryCondition: (data: any[], index: number, params: Record<string, number>) => boolean;
  exitCondition: (data: any[], index: number, entryIndex: number, params: Record<string, number>) => boolean;
  stopLoss?: number; // En porcentaje
  takeProfit?: number; // En porcentaje
  timeLimit?: number; // En días
}

// Estrategias predefinidas
export const predefinedStrategies: Record<string, BacktestStrategy> = {
  "cruce_medias_moviles": {
    name: "Cruce de Medias Móviles",
    description: "Compra cuando la media rápida cruza por encima de la media lenta. Vende cuando cruza por debajo.",
    params: {
      fastPeriod: 10,
      slowPeriod: 30,
    },
    entryCondition: (data, index, params) => {
      if (index < params.slowPeriod) return false;
      
      // Calcular medias móviles
      const fastMA = calculateMA(data, index, params.fastPeriod);
      const slowMA = calculateMA(data, index, params.slowPeriod);
      const prevFastMA = calculateMA(data, index - 1, params.fastPeriod);
      const prevSlowMA = calculateMA(data, index - 1, params.slowPeriod);
      
      // Comprobar cruce alcista
      return prevFastMA <= prevSlowMA && fastMA > slowMA;
    },
    exitCondition: (data, index, entryIndex, params) => {
      // Calcular medias móviles
      const fastMA = calculateMA(data, index, params.fastPeriod);
      const slowMA = calculateMA(data, index, params.slowPeriod);
      const prevFastMA = calculateMA(data, index - 1, params.fastPeriod);
      const prevSlowMA = calculateMA(data, index - 1, params.slowPeriod);
      
      // Comprobar cruce bajista
      return prevFastMA >= prevSlowMA && fastMA < slowMA;
    },
    stopLoss: 5,
    takeProfit: 15
  },
  "rsi_sobrecompra_sobreventa": {
    name: "RSI Sobrecompra/Sobreventa",
    description: "Compra cuando el RSI está sobrevendido. Vende cuando está sobrecomprado.",
    params: {
      rsiPeriod: 14,
      oversold: 30,
      overbought: 70
    },
    entryCondition: (data, index, params) => {
      if (index < params.rsiPeriod) return false;
      
      // Extraer precios de cierre
      const prices = data.map(candle => parseFloat(candle[4])); // Cierre
      
      // Calcular RSI actual y anterior
      const rsi = calculateRSI(prices.slice(0, index + 1), params.rsiPeriod);
      const prevRsi = calculateRSI(prices.slice(0, index), params.rsiPeriod);
      
      // Comprobar si el RSI sale de zona de sobreventa
      return prevRsi < params.oversold && rsi >= params.oversold;
    },
    exitCondition: (data, index, entryIndex, params) => {
      // Extraer precios de cierre
      const prices = data.map(candle => parseFloat(candle[4])); // Cierre
      
      // Calcular RSI
      const rsi = calculateRSI(prices.slice(0, index + 1), params.rsiPeriod);
      
      // Vender cuando el RSI entra en zona de sobrecompra
      return rsi >= params.overbought;
    },
    stopLoss: 5,
    timeLimit: 30
  },
  "macd_histograma": {
    name: "MACD Histograma",
    description: "Compra cuando el histograma MACD cruza por encima de cero. Vende cuando cruza por debajo.",
    params: {
      fastEMA: 12,
      slowEMA: 26,
      signalPeriod: 9
    },
    entryCondition: (data, index, params) => {
      if (index < params.slowEMA + params.signalPeriod) return false;
      
      // Extraer precios de cierre
      const prices = data.map(candle => parseFloat(candle[4])); // Cierre
      
      // Calcular MACD actual y anterior
      const macd = calculateMACD(prices.slice(0, index + 1));
      const prevMacd = calculateMACD(prices.slice(0, index));
      
      // Comprobar si el histograma cruza por encima de cero
      return prevMacd.histogram <= 0 && macd.histogram > 0;
    },
    exitCondition: (data, index, entryIndex, params) => {
      // Extraer precios de cierre
      const prices = data.map(candle => parseFloat(candle[4])); // Cierre
      
      // Calcular MACD
      const macd = calculateMACD(prices.slice(0, index + 1));
      const prevMacd = calculateMACD(prices.slice(0, index));
      
      // Vender cuando el histograma cruza por debajo de cero
      return prevMacd.histogram >= 0 && macd.histogram < 0;
    },
    stopLoss: 7,
    takeProfit: 20
  },
  "soporte_resistencia": {
    name: "Soporte y Resistencia",
    description: "Compra cuando el precio rebota desde un nivel de soporte. Vende cuando alcanza una resistencia.",
    params: {
      lookbackPeriod: 50,
      threshold: 2, // En porcentaje
      confirmationPeriod: 3
    },
    entryCondition: (data, index, params) => {
      if (index < params.lookbackPeriod) return false;
      
      // Encontrar mínimos recientes para determinar soportes
      const lookback = data.slice(index - params.lookbackPeriod, index);
      const lows = lookback.map(candle => parseFloat(candle[3])); // Low
      const currentPrice = parseFloat(data[index][4]); // Cierre actual
      const prevPrice = parseFloat(data[index - 1][4]); // Cierre anterior
      
      // Encontrar el soporte más cercano
      const sortedLows = [...new Set(lows)].sort((a, b) => a - b);
      const potentialSupports = sortedLows.filter(low => low < currentPrice);
      
      if (potentialSupports.length === 0) return false;
      
      const closestSupport = Math.max(...potentialSupports);
      
      // Comprobar si el precio rebota desde el soporte
      const distanceToSupport = (Math.abs(prevPrice - closestSupport) / closestSupport) * 100;
      const priceIncrease = ((currentPrice - prevPrice) / prevPrice) * 100;
      
      return distanceToSupport < params.threshold && priceIncrease > 0.5;
    },
    exitCondition: (data, index, entryIndex, params) => {
      // Encontrar máximos recientes para determinar resistencias
      const lookback = data.slice(Math.max(0, index - params.lookbackPeriod), index);
      const highs = lookback.map(candle => parseFloat(candle[2])); // High
      const currentPrice = parseFloat(data[index][4]); // Cierre actual
      
      // Encontrar la resistencia más cercana
      const sortedHighs = [...new Set(highs)].sort((a, b) => a - b);
      const potentialResistances = sortedHighs.filter(high => high > currentPrice);
      
      if (potentialResistances.length === 0) return false;
      
      const closestResistance = Math.min(...potentialResistances);
      
      // Comprobar si el precio se acerca a la resistencia
      const distanceToResistance = (Math.abs(currentPrice - closestResistance) / currentPrice) * 100;
      return distanceToResistance < params.threshold;
    },
    stopLoss: 5,
    timeLimit: 20
  }
};

// Ejecutar backtest para una estrategia específica
export const runBacktest = async (
  symbol: string,
  strategy: BacktestStrategy,
  startDate: string,
  endDate: string,
  initialCapital: number = 10000,
  interval: string = '1d'
): Promise<BacktestResult> => {
  try {
    // Convertir fechas a timestamp para Binance
    const startTimestamp = new Date(startDate).getTime();
    const endTimestamp = new Date(endDate).getTime();
    
    // Obtener datos históricos de la API
    const response = await axios.get(`${API_CONFIG.BINANCE.BASE_URL}${API_CONFIG.BINANCE.ENDPOINTS.KLINES}`, {
      params: {
        symbol: symbol.replace('/', '').toUpperCase(),
        interval,
        startTime: startTimestamp,
        endTime: endTimestamp,
        limit: 1000 // Máximo permitido por Binance
      }
    });
    
    if (!Array.isArray(response.data)) {
      throw new Error('Formato de respuesta inválido');
    }
    
    // Datos históricos en formato OHLCV
    const historicalData = response.data;
    
    // Inicializar variables para el backtest
    let capital = initialCapital;
    let position = null;
    let entryPrice = 0;
    let entryIndex = 0;
    let trades: TradeResult[] = [];
    let equity = [initialCapital];
    let returns: number[] = [];
    
    // Ejecutar la estrategia
    for (let i = 0; i < historicalData.length; i++) {
      const currentPrice = parseFloat(historicalData[i][4]); // Precio de cierre
      
      // Si no hay posición abierta, comprobar condición de entrada
      if (position === null) {
        if (strategy.entryCondition(historicalData, i, strategy.params)) {
          position = 'buy';
          entryPrice = currentPrice;
          entryIndex = i;
        }
      } 
      // Si hay posición abierta, comprobar condiciones de salida
      else {
        let shouldExit = false;
        let exitReason = '';
        
        // Comprobar condición de salida de la estrategia
        if (strategy.exitCondition(historicalData, i, entryIndex, strategy.params)) {
          shouldExit = true;
          exitReason = 'Señal de salida';
        }
        
        // Comprobar stop loss
        if (strategy.stopLoss) {
          const currentLoss = ((currentPrice - entryPrice) / entryPrice) * 100 * (position === 'buy' ? 1 : -1);
          if (currentLoss <= -strategy.stopLoss) {
            shouldExit = true;
            exitReason = 'Stop Loss';
          }
        }
        
        // Comprobar take profit
        if (strategy.takeProfit) {
          const currentProfit = ((currentPrice - entryPrice) / entryPrice) * 100 * (position === 'buy' ? 1 : -1);
          if (currentProfit >= strategy.takeProfit) {
            shouldExit = true;
            exitReason = 'Take Profit';
          }
        }
        
        // Comprobar límite de tiempo
        if (strategy.timeLimit) {
          const tradeDuration = i - entryIndex;
          if (tradeDuration >= strategy.timeLimit) {
            shouldExit = true;
            exitReason = 'Límite de tiempo';
          }
        }
        
        // Si se cumple alguna condición de salida, cerrar la posición
        if (shouldExit) {
          const profit = (currentPrice - entryPrice) / entryPrice * (position === 'buy' ? 1 : -1);
          const profitAmount = capital * profit;
          capital += profitAmount;
          
          // Registrar operación
          trades.push({
            id: trades.length + 1,
            type: position as 'buy' | 'sell',
            entryDate: new Date(parseInt(historicalData[entryIndex][0])).toISOString(),
            entryPrice,
            exitDate: new Date(parseInt(historicalData[i][0])).toISOString(),
            exitPrice: currentPrice,
            profit: profitAmount,
            profitPercent: profit * 100,
            duration: i - entryIndex,
            reason: exitReason
          });
          
          // Resetear posición
          position = null;
          returns.push(profit);
        }
      }
      
      // Actualizar valor del portfolio
      if (position) {
        const currentValue = capital * (1 + (currentPrice - entryPrice) / entryPrice * (position === 'buy' ? 1 : -1));
        equity.push(currentValue);
      } else {
        equity.push(capital);
      }
    }
    
    // Cerrar posiciones abiertas al final del período
    if (position) {
      const finalPrice = parseFloat(historicalData[historicalData.length - 1][4]);
      const profit = (finalPrice - entryPrice) / entryPrice * (position === 'buy' ? 1 : -1);
      const profitAmount = capital * profit;
      capital += profitAmount;
      
      trades.push({
        id: trades.length + 1,
        type: position as 'buy' | 'sell',
        entryDate: new Date(parseInt(historicalData[entryIndex][0])).toISOString(),
        entryPrice,
        exitDate: new Date(parseInt(historicalData[historicalData.length - 1][0])).toISOString(),
        exitPrice: finalPrice,
        profit: profitAmount,
        profitPercent: profit * 100,
        duration: historicalData.length - 1 - entryIndex,
        reason: 'Fin del período'
      });
      
      returns.push(profit);
    }
    
    // Calcular métricas de rendimiento
    const winningTrades = trades.filter(t => t.profit > 0);
    const losingTrades = trades.filter(t => t.profit <= 0);
    
    // Calcular drawdown
    let maxDrawdown = 0;
    let peak = equity[0];
    
    for (const value of equity) {
      if (value > peak) {
        peak = value;
      }
      
      const drawdown = (peak - value) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    
    // Calcular factor de beneficio
    const grossProfit = winningTrades.reduce((sum, trade) => sum + trade.profit, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.profit, 0));
    const profitFactor = grossLoss === 0 ? grossProfit : grossProfit / grossLoss;
    
    // Calcular rendimiento total
    const performance = ((capital - initialCapital) / initialCapital) * 100;
    
    return {
      symbol,
      startDate,
      endDate,
      initialCapital,
      finalCapital: capital,
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0,
      profitFactor,
      maxDrawdown: maxDrawdown * 100,
      trades,
      returns,
      equity,
      performance
    };
  } catch (error) {
    console.error('Error ejecutando backtest:', error);
    throw error;
  }
};

// Función auxiliar para calcular medias móviles
const calculateMA = (data: any[], index: number, period: number): number => {
  if (index < period - 1) return 0;
  
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += parseFloat(data[index - i][4]); // Precio de cierre
  }
  
  return sum / period;
};

// Optimizar parámetros de una estrategia
export const optimizeStrategy = async (
  symbol: string,
  strategy: BacktestStrategy,
  startDate: string,
  endDate: string,
  paramRanges: Record<string, { min: number; max: number; step: number }>
): Promise<{
  bestParams: Record<string, number>;
  performance: number;
  result: BacktestResult;
}> => {
  let bestParams = { ...strategy.params };
  let bestPerformance = -Infinity;
  let bestResult: BacktestResult | null = null;
  
  // Generar todas las combinaciones de parámetros
  const paramKeys = Object.keys(paramRanges);
  const paramCombinations: Record<string, number>[] = [{}];
  
  for (const key of paramKeys) {
    const { min, max, step } = paramRanges[key];
    const newCombinations: Record<string, number>[] = [];
    
    for (let value = min; value <= max; value += step) {
      for (const combo of paramCombinations) {
        newCombinations.push({ ...combo, [key]: value });
      }
    }
    
    paramCombinations.length = 0;
    paramCombinations.push(...newCombinations);
  }
  
  console.log(`Evaluando ${paramCombinations.length} combinaciones de parámetros...`);
  
  // Evaluar cada combinación de parámetros
  for (const params of paramCombinations) {
    const modifiedStrategy: BacktestStrategy = {
      ...strategy,
      params: { ...strategy.params, ...params }
    };
    
    try {
      const result = await runBacktest(symbol, modifiedStrategy, startDate, endDate);
      
      // Actualizar mejores parámetros si el rendimiento es mejor
      if (result.performance > bestPerformance) {
        bestPerformance = result.performance;
        bestParams = { ...modifiedStrategy.params };
        bestResult = result;
      }
    } catch (error) {
      console.error('Error optimizando estrategia:', error);
    }
  }
  
  if (!bestResult) {
    throw new Error('No se pudo optimizar la estrategia');
  }
  
  return {
    bestParams,
    performance: bestPerformance,
    result: bestResult
  };
}; 