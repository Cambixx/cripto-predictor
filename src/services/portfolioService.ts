import axios from 'axios';
import { API_CONFIG } from '../config/api';

export interface PortfolioPosition {
  symbol: string;
  amount: number;
  entryPrice: number;
  entryDate: string;
  currentPrice?: number;
  currentValue?: number;
  profit?: number;
  profitPercentage?: number;
  weight?: number;
  stopLoss?: number;
  takeProfit?: number;
  notes?: string;
}

export interface Trade {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  price: number;
  amount: number;
  date: string;
  fees?: number;
  total?: number;
  notes?: string;
}

export interface PortfolioSummary {
  totalValue: number;
  initialInvestment: number;
  pnl: number;
  pnlPercentage: number;
  positions: PortfolioPosition[];
  lastUpdated: string;
  bestPerformer: {
    symbol: string;
    profit: number;
    profitPercentage: number;
  };
  worstPerformer: {
    symbol: string;
    profit: number;
    profitPercentage: number;
  };
  riskMetrics: {
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    beta: number;
  };
}

export interface PerformanceData {
  dates: string[];
  values: number[];
  returns: number[];
  benchmarkValues?: number[];
  benchmarkReturns?: number[];
}

// Portfolio en almacenamiento local
let portfolioData: {
  positions: PortfolioPosition[];
  trades: Trade[];
  cashBalance: number;
} = {
  positions: [],
  trades: [],
  cashBalance: 0
};

// Cargar portfolio desde localStorage
export const loadPortfolio = (): boolean => {
  try {
    const savedData = localStorage.getItem('portfolioData');
    if (savedData) {
      portfolioData = JSON.parse(savedData);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error cargando portfolio:', error);
    return false;
  }
};

// Guardar portfolio en localStorage
const savePortfolio = (): void => {
  try {
    localStorage.setItem('portfolioData', JSON.stringify(portfolioData));
  } catch (error) {
    console.error('Error guardando portfolio:', error);
  }
};

// Inicializar portfolio
export const initializePortfolio = (initialCash: number): void => {
  portfolioData = {
    positions: [],
    trades: [],
    cashBalance: initialCash
  };
  savePortfolio();
};

// Añadir una posición
export const addPosition = async (position: Omit<PortfolioPosition, 'currentPrice' | 'currentValue' | 'profit' | 'profitPercentage' | 'weight'>): Promise<PortfolioPosition> => {
  // Comprobar si ya existe la posición
  const existingIndex = portfolioData.positions.findIndex(p => p.symbol === position.symbol);
  
  if (existingIndex >= 0) {
    // Actualizar posición existente (ajustar precio promedio)
    const existing = portfolioData.positions[existingIndex];
    const totalAmount = existing.amount + position.amount;
    const totalCost = existing.amount * existing.entryPrice + position.amount * position.entryPrice;
    const newAvgPrice = totalCost / totalAmount;
    
    // Actualizar posición
    const updatedPosition: PortfolioPosition = {
      ...existing,
      amount: totalAmount,
      entryPrice: newAvgPrice,
      notes: position.notes || existing.notes
    };
    
    if (position.stopLoss) updatedPosition.stopLoss = position.stopLoss;
    if (position.takeProfit) updatedPosition.takeProfit = position.takeProfit;
    
    portfolioData.positions[existingIndex] = updatedPosition;
  } else {
    // Añadir nueva posición
    portfolioData.positions.push({
      ...position,
      currentPrice: undefined,
      currentValue: undefined,
      profit: undefined,
      profitPercentage: undefined,
      weight: undefined
    });
  }
  
  // Registrar trade
  portfolioData.trades.push({
    id: `trade-${Date.now()}`,
    symbol: position.symbol,
    type: 'buy',
    price: position.entryPrice,
    amount: position.amount,
    date: position.entryDate || new Date().toISOString(),
    notes: position.notes
  });
  
  // Actualizar balance en efectivo
  portfolioData.cashBalance -= position.amount * position.entryPrice;
  
  // Guardar cambios
  savePortfolio();
  
  // Devolver posición actualizada con datos de mercado
  const updatedPosition = await updatePositionWithMarketData(
    portfolioData.positions.find(p => p.symbol === position.symbol)!
  );
  return updatedPosition;
};

// Cerrar posición (completa o parcial)
export const closePosition = (
  symbol: string,
  amount: number,
  exitPrice: number,
  exitDate: string = new Date().toISOString(),
  notes?: string
): { success: boolean; trade?: Trade; profit?: number } => {
  // Buscar posición
  const position = portfolioData.positions.find(p => p.symbol === symbol);
  
  if (!position) {
    return { success: false };
  }
  
  // Asegurar que la cantidad no sea mayor que la posición
  const closeAmount = Math.min(amount, position.amount);
  
  // Calcular ganancias/pérdidas
  const profit = closeAmount * (exitPrice - position.entryPrice);
  
  // Crear trade
  const trade: Trade = {
    id: `trade-${Date.now()}`,
    symbol,
    type: 'sell',
    price: exitPrice,
    amount: closeAmount,
    date: exitDate,
    total: closeAmount * exitPrice,
    notes
  };
  
  // Añadir trade al historial
  portfolioData.trades.push(trade);
  
  // Actualizar balance en efectivo
  portfolioData.cashBalance += closeAmount * exitPrice;
  
  // Actualizar o eliminar posición
  if (closeAmount >= position.amount) {
    // Eliminar posición
    portfolioData.positions = portfolioData.positions.filter(p => p.symbol !== symbol);
  } else {
    // Actualizar cantidad
    position.amount -= closeAmount;
  }
  
  // Guardar cambios
  savePortfolio();
  
  return { 
    success: true,
    trade,
    profit
  };
};

// Obtener resumen del portfolio
export const getPortfolioSummary = async (): Promise<PortfolioSummary> => {
  try {
    // Cargar datos actuales de precios
    const updatedPositions = await Promise.all(
      portfolioData.positions.map(position => updatePositionWithMarketData(position))
    );
    
    // Reemplazar posiciones con datos actualizados
    portfolioData.positions = updatedPositions;
    savePortfolio();
    
    // Calcular valor total y métricas
    const totalValue = updatedPositions.reduce((sum, pos) => sum + (pos.currentValue || 0), 0) + portfolioData.cashBalance;
    
    // Calcular inversión inicial (costo de posiciones actuales + balance)
    const initialInvestment = updatedPositions.reduce((sum, pos) => sum + pos.entryPrice * pos.amount, 0) + portfolioData.cashBalance;
    
    // Calcular P&L
    const pnl = totalValue - initialInvestment;
    const pnlPercentage = (pnl / initialInvestment) * 100;
    
    // Encontrar mejor y peor performer
    const performingPositions = updatedPositions.filter(p => p.profitPercentage !== undefined);
    
    let bestPerformer = {
      symbol: '',
      profit: 0,
      profitPercentage: 0
    };
    
    let worstPerformer = {
      symbol: '',
      profit: 0,
      profitPercentage: 0
    };
    
    if (performingPositions.length > 0) {
      const best = performingPositions.reduce((prev, current) => 
        (current.profitPercentage || 0) > (prev.profitPercentage || 0) ? current : prev
      );
      
      const worst = performingPositions.reduce((prev, current) => 
        (current.profitPercentage || 0) < (prev.profitPercentage || 0) ? current : prev
      );
      
      bestPerformer = {
        symbol: best.symbol,
        profit: best.profit || 0,
        profitPercentage: best.profitPercentage || 0
      };
      
      worstPerformer = {
        symbol: worst.symbol,
        profit: worst.profit || 0,
        profitPercentage: worst.profitPercentage || 0
      };
    }
    
    // Calcular pesos del portfolio
    for (const position of updatedPositions) {
      if (position.currentValue !== undefined) {
        position.weight = (position.currentValue / totalValue) * 100;
      }
    }
    
    // Calcular métricas de riesgo
    const riskMetrics = await calculateRiskMetrics(updatedPositions);
    
    return {
      totalValue,
      initialInvestment,
      pnl,
      pnlPercentage,
      positions: updatedPositions,
      lastUpdated: new Date().toISOString(),
      bestPerformer,
      worstPerformer,
      riskMetrics
    };
  } catch (error) {
    console.error('Error obteniendo resumen del portfolio:', error);
    throw error;
  }
};

// Calcular métricas de riesgo
const calculateRiskMetrics = async (positions: PortfolioPosition[]): Promise<{
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  beta: number;
}> => {
  try {
    // Si no hay posiciones, devolver valores predeterminados
    if (positions.length === 0) {
      return {
        volatility: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        beta: 1
      };
    }
    
    // Obtener datos históricos (90 días) para las posiciones
    const historicalData: Record<string, number[]> = {};
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
    
    for (const position of positions) {
      try {
        const response = await axios.get(`${API_CONFIG.BINANCE.BASE_URL}${API_CONFIG.BINANCE.ENDPOINTS.KLINES}`, {
          params: {
            symbol: position.symbol.replace('/', '').toUpperCase(),
            interval: '1d',
            startTime: startDate.getTime(),
            limit: 90
          }
        });
        
        if (Array.isArray(response.data)) {
          // Extraer precios de cierre
          historicalData[position.symbol] = response.data.map(candle => parseFloat(candle[4]));
        }
      } catch (error) {
        console.error(`Error obteniendo datos históricos para ${position.symbol}:`, error);
      }
    }
    
    // Obtener índice de referencia (Bitcoin)
    let benchmarkData: number[] = [];
    try {
      const response = await axios.get(`${API_CONFIG.BINANCE.BASE_URL}${API_CONFIG.BINANCE.ENDPOINTS.KLINES}`, {
        params: {
          symbol: 'BTCUSDT',
          interval: '1d',
          startTime: startDate.getTime(),
          limit: 90
        }
      });
      
      if (Array.isArray(response.data)) {
        benchmarkData = response.data.map(candle => parseFloat(candle[4]));
      }
    } catch (error) {
      console.error('Error obteniendo datos del benchmark:', error);
    }
    
    // Cálculo de volatilidad del portfolio
    const portfolioReturns: number[] = [];
    const benchmarkReturns: number[] = [];
    
    // Cálculo de retornos diarios para cada activo
    const positionReturns: Record<string, number[]> = {};
    
    // Calcular retornos para cada activo
    for (const symbol in historicalData) {
      const prices = historicalData[symbol];
      positionReturns[symbol] = [];
      
      for (let i = 1; i < prices.length; i++) {
        positionReturns[symbol].push((prices[i] - prices[i-1]) / prices[i-1]);
      }
    }
    
    // Calcular retornos del benchmark
    for (let i = 1; i < benchmarkData.length; i++) {
      benchmarkReturns.push((benchmarkData[i] - benchmarkData[i-1]) / benchmarkData[i-1]);
    }
    
    // Calcular retornos diarios ponderados del portfolio
    const days = Math.min(...Object.values(positionReturns).map(returns => returns.length));
    
    for (let day = 0; day < days; day++) {
      let dailyReturn = 0;
      let totalWeight = 0;
      
      for (const position of positions) {
        if (positionReturns[position.symbol]?.[day] !== undefined && position.weight !== undefined) {
          dailyReturn += positionReturns[position.symbol][day] * (position.weight / 100);
          totalWeight += position.weight / 100;
        }
      }
      
      // Normalizar por el peso total
      if (totalWeight > 0) {
        dailyReturn /= totalWeight;
      }
      
      portfolioReturns.push(dailyReturn);
    }
    
    // Calcular volatilidad (desviación estándar anualizada de los retornos diarios)
    const volatility = calculateStandardDeviation(portfolioReturns) * Math.sqrt(252); // Anualizar
    
    // Calcular Sharpe Ratio (asumiendo tasa libre de riesgo de 2%)
    const riskFreeRate = 0.02 / 252; // Diaria
    const meanDailyReturn = portfolioReturns.reduce((sum, r) => sum + r, 0) / portfolioReturns.length;
    const sharpeRatio = (meanDailyReturn - riskFreeRate) / (volatility / Math.sqrt(252));
    
    // Calcular máximo drawdown
    let maxDrawdown = 0;
    let peak = 1;
    let value = 1;
    
    for (const dailyReturn of portfolioReturns) {
      value *= (1 + dailyReturn);
      if (value > peak) {
        peak = value;
      }
      
      const drawdown = (peak - value) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    
    // Calcular beta (con respecto a Bitcoin)
    let beta = 1; // Valor predeterminado
    
    if (benchmarkReturns.length === portfolioReturns.length && benchmarkReturns.length > 0) {
      const covariance = calculateCovariance(portfolioReturns, benchmarkReturns);
      const benchmarkVariance = calculateVariance(benchmarkReturns);
      
      if (benchmarkVariance > 0) {
        beta = covariance / benchmarkVariance;
      }
    }
    
    return {
      volatility: parseFloat(volatility.toFixed(4)),
      sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
      maxDrawdown: parseFloat((maxDrawdown * 100).toFixed(2)),
      beta: parseFloat(beta.toFixed(2))
    };
  } catch (error) {
    console.error('Error calculando métricas de riesgo:', error);
    
    // Devolver valores predeterminados en caso de error
    return {
      volatility: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      beta: 1
    };
  }
};

// Obtener desempeño histórico del portfolio
export const getPortfolioPerformance = async (days: number = 30): Promise<PerformanceData> => {
  try {
    const result: PerformanceData = {
      dates: [],
      values: [],
      returns: []
    };
    
    // Sin posiciones, devolver datos vacíos
    if (portfolioData.positions.length === 0) {
      return result;
    }
    
    // Obtener datos históricos para cada posición
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const historicalPrices: Record<string, Record<string, number>> = {};
    const symbolResponses: Promise<void>[] = [];
    
    for (const position of portfolioData.positions) {
      historicalPrices[position.symbol] = {};
      
      const symbolPromise = axios.get(`${API_CONFIG.BINANCE.BASE_URL}${API_CONFIG.BINANCE.ENDPOINTS.KLINES}`, {
        params: {
          symbol: position.symbol.replace('/', '').toUpperCase(),
          interval: '1d',
          startTime: startDate.getTime(),
          limit: days
        }
      })
      .then(response => {
        if (Array.isArray(response.data)) {
          for (const candle of response.data) {
            const date = new Date(candle[0]).toISOString().split('T')[0];
            historicalPrices[position.symbol][date] = parseFloat(candle[4]); // Precio de cierre
          }
        }
      })
      .catch(error => {
        console.error(`Error obteniendo histórico para ${position.symbol}:`, error);
      });
      
      symbolResponses.push(symbolPromise);
    }
    
    // Esperar a que se resuelvan todas las peticiones
    await Promise.all(symbolResponses);
    
    // Obtener todas las fechas únicas
    const allDates = new Set<string>();
    
    for (const symbol in historicalPrices) {
      for (const date in historicalPrices[symbol]) {
        allDates.add(date);
      }
    }
    
    // Ordenar fechas
    const sortedDates = Array.from(allDates).sort();
    
    // Calcular valor del portfolio para cada fecha
    for (const date of sortedDates) {
      let portfolioValue = portfolioData.cashBalance;
      
      for (const position of portfolioData.positions) {
        const price = historicalPrices[position.symbol][date];
        if (price) {
          portfolioValue += position.amount * price;
        }
      }
      
      // Agregar a los resultados
      result.dates.push(date);
      result.values.push(portfolioValue);
    }
    
    // Calcular retornos diarios
    for (let i = 1; i < result.values.length; i++) {
      result.returns.push((result.values[i] - result.values[i-1]) / result.values[i-1]);
    }
    
    // Obtener datos del benchmark (Bitcoin)
    try {
      const benchmarkResponse = await axios.get(`${API_CONFIG.BINANCE.BASE_URL}${API_CONFIG.BINANCE.ENDPOINTS.KLINES}`, {
        params: {
          symbol: 'BTCUSDT',
          interval: '1d',
          startTime: startDate.getTime(),
          limit: days
        }
      });
      
      if (Array.isArray(benchmarkResponse.data)) {
        const benchmarkPrices: Record<string, number> = {};
        
        for (const candle of benchmarkResponse.data) {
          const date = new Date(candle[0]).toISOString().split('T')[0];
          benchmarkPrices[date] = parseFloat(candle[4]);
        }
        
        // Calcular valores del benchmark para las mismas fechas
        result.benchmarkValues = [];
        for (const date of result.dates) {
          if (benchmarkPrices[date]) {
            result.benchmarkValues.push(benchmarkPrices[date]);
          }
        }
        
        // Normalizar valores del benchmark al mismo valor inicial que el portfolio
        if (result.benchmarkValues.length > 0 && result.values.length > 0) {
          const scaleFactor = result.values[0] / result.benchmarkValues[0];
          result.benchmarkValues = result.benchmarkValues.map(v => v * scaleFactor);
          
          // Calcular retornos del benchmark
          result.benchmarkReturns = [];
          for (let i = 1; i < result.benchmarkValues.length; i++) {
            result.benchmarkReturns.push(
              (result.benchmarkValues[i] - result.benchmarkValues[i-1]) / result.benchmarkValues[i-1]
            );
          }
        }
      }
    } catch (error) {
      console.error('Error obteniendo datos del benchmark:', error);
    }
    
    return result;
  } catch (error) {
    console.error('Error calculando rendimiento del portfolio:', error);
    return {
      dates: [],
      values: [],
      returns: []
    };
  }
};

// Actualizar posición con datos de mercado actuales
const updatePositionWithMarketData = async (position: PortfolioPosition): Promise<PortfolioPosition> => {
  try {
    // Obtener precio actual
    const response = await axios.get(`${API_CONFIG.BINANCE.BASE_URL}/ticker/price`, {
      params: {
        symbol: position.symbol.replace('/', '').toUpperCase()
      }
    });
    
    if (response.data && response.data.price) {
      const currentPrice = parseFloat(response.data.price);
      
      // Actualizar posición con datos actuales
      const updatedPosition: PortfolioPosition = {
        ...position,
        currentPrice,
        currentValue: position.amount * currentPrice,
        profit: position.amount * (currentPrice - position.entryPrice),
        profitPercentage: ((currentPrice - position.entryPrice) / position.entryPrice) * 100
      };
      
      return updatedPosition;
    }
    
    return position;
  } catch (error) {
    console.error(`Error actualizando posición ${position.symbol}:`, error);
    return position;
  }
};

// Obtener historial de trades
export const getTrades = (): Trade[] => {
  return [...portfolioData.trades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Funciones auxiliares
function calculateStandardDeviation(values: number[]): number {
  const n = values.length;
  if (n === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / n;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / n;
  
  return Math.sqrt(variance);
}

function calculateCovariance(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;
  
  const n = x.length;
  const xMean = x.reduce((sum, val) => sum + val, 0) / n;
  const yMean = y.reduce((sum, val) => sum + val, 0) / n;
  
  let covariance = 0;
  for (let i = 0; i < n; i++) {
    covariance += (x[i] - xMean) * (y[i] - yMean);
  }
  
  return covariance / n;
}

function calculateVariance(values: number[]): number {
  const n = values.length;
  if (n === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / n;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / n;
}

// Depositar efectivo
export const depositCash = (amount: number): number => {
  portfolioData.cashBalance += amount;
  savePortfolio();
  return portfolioData.cashBalance;
};

// Retirar efectivo
export const withdrawCash = (amount: number): number => {
  if (amount > portfolioData.cashBalance) {
    throw new Error('Fondos insuficientes para retirar');
  }
  
  portfolioData.cashBalance -= amount;
  savePortfolio();
  return portfolioData.cashBalance;
};

// Obtener balance actual
export const getCashBalance = (): number => {
  return portfolioData.cashBalance;
}; 