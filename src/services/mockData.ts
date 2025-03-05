/**
 * Datos simulados para la aplicación de trading
 */

export interface CoinPriceData {
  price: number;
  volume: number;
  change24h: number;
}

// Datos de precio simulados para diferentes pares de trading
export const coinPriceData: Record<string, CoinPriceData> = {
  'BTC/USDT': {
    price: 62584.25,
    volume: 12457892345,
    change24h: 2.34
  },
  'ETH/USDT': {
    price: 3457.89,
    volume: 6789123456,
    change24h: -1.15
  },
  'SOL/USDT': {
    price: 169.74,
    volume: 3456789123,
    change24h: 5.67
  },
  'ADA/USDT': {
    price: 0.45,
    volume: 2345678912,
    change24h: -2.24
  },
  'DOT/USDT': {
    price: 6.93,
    volume: 1234567891,
    change24h: 0.45
  },
  'AVAX/USDT': {
    price: 35.82,
    volume: 987654321,
    change24h: 3.78
  },
  'MATIC/USDT': {
    price: 0.87,
    volume: 876543219,
    change24h: -0.89
  },
  'LINK/USDT': {
    price: 17.32,
    volume: 765432198,
    change24h: 1.56
  },
  'XRP/USDT': {
    price: 0.58,
    volume: 654321987,
    change24h: -1.23
  },
  'ATOM/USDT': {
    price: 8.94,
    volume: 543219876,
    change24h: 2.91
  }
};

// Datos de transacciones simuladas para el historial del usuario
export interface Transaction {
  id: string;
  type: 'buy' | 'sell';
  symbol: string;
  amount: number;
  price: number;
  timestamp: number;
  status: 'completed' | 'pending' | 'failed';
}

// Generar un historial de transacciones aleatorio
export const generateTransactionHistory = (count: number = 10): Transaction[] => {
  const transactions: Transaction[] = [];
  const symbols = Object.keys(coinPriceData);
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const type = Math.random() > 0.5 ? 'buy' : 'sell';
    const price = coinPriceData[symbol].price * (1 + (Math.random() - 0.5) * 0.1);
    const amount = Math.random() * 5 + 0.1;
    
    transactions.push({
      id: `tx-${Math.random().toString(36).substr(2, 9)}`,
      type,
      symbol,
      amount,
      price,
      timestamp: now - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000), // Hasta 30 días atrás
      status: Math.random() > 0.1 ? 'completed' : (Math.random() > 0.5 ? 'pending' : 'failed')
    });
  }
  
  // Ordenar por timestamp de más reciente a más antiguo
  return transactions.sort((a, b) => b.timestamp - a.timestamp);
};

// Datos de portafolio simulados
export interface PortfolioAsset {
  symbol: string;
  name: string;
  amount: number;
  currentPrice: number;
  averagePrice: number;
  profitLoss: number;
  profitLossPercentage: number;
}

// Generar un portafolio simulado
export const generatePortfolioData = (assetCount: number = 5): PortfolioAsset[] => {
  const portfolio: PortfolioAsset[] = [];
  const symbols = Object.keys(coinPriceData);
  const usedSymbols = new Set<string>();
  
  for (let i = 0; i < assetCount; i++) {
    let symbol;
    do {
      symbol = symbols[Math.floor(Math.random() * symbols.length)];
    } while (usedSymbols.has(symbol));
    
    usedSymbols.add(symbol);
    
    const coinName = symbol.split('/')[0];
    const coinData = coinPriceData[symbol];
    const amount = Math.random() * 10 + 0.1;
    const averagePrice = coinData.price * (1 + (Math.random() - 0.5) * 0.2);
    const profitLoss = (coinData.price - averagePrice) * amount;
    const profitLossPercentage = ((coinData.price / averagePrice) - 1) * 100;
    
    portfolio.push({
      symbol,
      name: coinName,
      amount,
      currentPrice: coinData.price,
      averagePrice,
      profitLoss,
      profitLossPercentage
    });
  }
  
  // Ordenar por valor (precio * cantidad) de mayor a menor
  return portfolio.sort((a, b) => (b.currentPrice * b.amount) - (a.currentPrice * a.amount));
}; 