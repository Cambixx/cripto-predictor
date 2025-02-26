export const API_CONFIG = {
  BINANCE: {
    BASE_URL: 'https://api.binance.com/api/v3',
    DEFAULT_CURRENCY: 'USDT',
    UPDATE_INTERVAL: 60000, // 1 minuto en milisegundos
    ENDPOINTS: {
      TICKER_24H: '/ticker/24hr',
      KLINES: '/klines',
      EXCHANGE_INFO: '/exchangeInfo',
    },
    TIMEFRAMES: {
      DAY: {
        interval: '1h',
        limit: 24,
      },
      WEEK: {
        interval: '4h',
        limit: 42,
      },
      MONTH: {
        interval: '1d',
        limit: 30,
      },
    },
    MIN_VOLUME_USD: 1000000, // Volumen mínimo en USD para considerar un par
    MAX_PAIRS: 15, // Máximo número de pares a monitorear
    TRADING_PAIRS: {
      BTC: 'BTCUSDT',
      ETH: 'ETHUSDT',
      BNB: 'BNBUSDT',
      SOL: 'SOLUSDT',
      XRP: 'XRPUSDT',
      ADA: 'ADAUSDT',
      DOT: 'DOTUSDT',
      AVAX: 'AVAXUSDT',
      MATIC: 'MATICUSDT',
      LINK: 'LINKUSDT',
      UNI: 'UNIUSDT',
      ATOM: 'ATOMUSDT',
      DOGE: 'DOGEUSDT',
      LTC: 'LTCUSDT',
      NEAR: 'NEARUSDT',
    }
  },
  FINNHUB: {
    BASE_URL: 'https://finnhub.io/api/v1',
    API_KEY: import.meta.env.VITE_FINNHUB_API_KEY || '', // La API key se debe configurar en el archivo .env
    ENDPOINTS: {
      CRYPTO_NEWS: '/crypto/news',
      CRYPTO_SENTIMENT: '/crypto/sentiment',
    },
    UPDATE_INTERVAL: 300000, // 5 minutos en milisegundos
    DEFAULT_CURRENCY: 'USDT',
  }
} 