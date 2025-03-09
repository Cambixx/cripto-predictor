import axios from 'axios';
import { API_CONFIG } from '../config/api';

export interface NewsItem {
  id: number;
  headline: string;
  summary: string;
  url: string;
  source: string;
  datetime: number;
  image: string;
  category: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

// Función para obtener noticias reales
export const getLatestNews = async (limit: number = 10): Promise<NewsItem[]> => {
  try {
    // Intentar obtener noticias de Finnhub
    const response = await axios.get(`${API_CONFIG.FINNHUB.BASE_URL}${API_CONFIG.FINNHUB.ENDPOINTS.CRYPTO_NEWS}`, {
      params: {
        token: API_CONFIG.FINNHUB.API_KEY,
        category: 'crypto',
      },
    });

    if (!Array.isArray(response.data)) {
      console.error('Respuesta inesperada de Finnhub:', response.data);
      throw new Error('Formato de respuesta inválido');
    }

    const processedNews = response.data
      .slice(0, limit)
      .map((news: any) => {
        if (!news.headline || !news.summary || !news.url) {
          console.warn('Noticia con campos faltantes:', news);
          return null;
        }

        return {
          id: news.id || Date.now(),
          headline: news.headline,
          summary: news.summary,
          url: news.url,
          source: news.source || 'Desconocido',
          datetime: (news.datetime || Date.now() / 1000) * 1000,
          image: news.image || '',
          category: news.category || 'crypto',
          sentiment: analyzeSentiment(news.headline + ' ' + news.summary),
        };
      })
      .filter((news): news is NewsItem => news !== null);

    if (processedNews.length === 0) {
      console.warn('No se encontraron noticias válidas en Finnhub');
      // Intentar con fuente alternativa
      return await getNewsFromAlternativeSource(limit);
    }

    return processedNews;
  } catch (error) {
    console.error('Error al obtener noticias de Finnhub:', error);
    // En caso de error, intentar con fuente alternativa
    return await getNewsFromAlternativeSource(limit);
  }
};

// Función para obtener noticias de una fuente alternativa
const getNewsFromAlternativeSource = async (limit: number): Promise<NewsItem[]> => {
  try {
    // Intentar con CryptoCompare como fuente alternativa
    const response = await axios.get('https://min-api.cryptocompare.com/data/v2/news/', {
      params: {
        lang: 'ES'
      }
    });

    if (!response.data || !response.data.Data || !Array.isArray(response.data.Data)) {
      throw new Error('Formato de respuesta inválido de CryptoCompare');
    }

    return response.data.Data.slice(0, limit).map((news: any) => ({
      id: news.id || Date.now(),
      headline: news.title,
      summary: news.body.length > 200 ? news.body.substring(0, 200) + '...' : news.body,
      url: news.url,
      source: news.source || 'CryptoCompare',
      datetime: news.published_on * 1000,
      image: news.imageurl || '',
      category: 'crypto',
      sentiment: analyzeSentiment(news.title + ' ' + news.body)
    }));
  } catch (alternativeError) {
    console.error('Error al obtener noticias de fuente alternativa:', alternativeError);
    
    // Como último recurso, obtener datos de la API de noticias públicas
    try {
      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: 'cryptocurrency OR bitcoin OR blockchain',
          language: 'es',
          sortBy: 'publishedAt',
          apiKey: process.env.VITE_NEWS_API_KEY || 'fallback_key'
        }
      });
      
      if (!response.data || !response.data.articles || !Array.isArray(response.data.articles)) {
        throw new Error('Formato de respuesta inválido de NewsAPI');
      }
      
      return response.data.articles.slice(0, limit).map((article: any, index: number) => ({
        id: index,
        headline: article.title,
        summary: article.description || 'Sin descripción disponible',
        url: article.url,
        source: article.source?.name || 'Desconocido',
        datetime: new Date(article.publishedAt).getTime(),
        image: article.urlToImage || '',
        category: 'crypto',
        sentiment: analyzeSentiment(article.title + ' ' + (article.description || ''))
      }));
    } catch (finalError) {
      console.error('Error al obtener noticias de todas las fuentes:', finalError);
      
      // Generar noticias basadas en datos de mercado actuales como último recurso
      return generateNewsFromMarketData(limit);
    }
  }
};

// Función para generar noticias basadas en datos de mercado actuales
const generateNewsFromMarketData = async (limit: number): Promise<NewsItem[]> => {
  try {
    // Obtener datos de mercado actuales
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 10,
        page: 1,
        sparkline: false
      }
    });
    
    if (!Array.isArray(response.data)) {
      throw new Error('Formato de respuesta inválido de CoinGecko');
    }
    
    // Generar noticias basadas en los datos de mercado
    return response.data.slice(0, limit).map((coin: any) => {
      const priceChange = coin.price_change_percentage_24h || 0;
      const isPositive = priceChange > 0;
      const sentiment: 'positive' | 'negative' | 'neutral' = 
        priceChange > 2 ? 'positive' : 
        priceChange < -2 ? 'negative' : 
        'neutral';
      
      const headline = isPositive 
        ? `${coin.name} sube un ${Math.abs(priceChange).toFixed(2)}% en las últimas 24 horas`
        : `${coin.name} cae un ${Math.abs(priceChange).toFixed(2)}% en las últimas 24 horas`;
      
      const summary = isPositive
        ? `El precio de ${coin.name} (${coin.symbol.toUpperCase()}) ha aumentado a $${coin.current_price.toFixed(2)}, con un volumen de trading de $${(coin.total_volume / 1000000).toFixed(2)} millones en las últimas 24 horas.`
        : `El precio de ${coin.name} (${coin.symbol.toUpperCase()}) ha disminuido a $${coin.current_price.toFixed(2)}, con un volumen de trading de $${(coin.total_volume / 1000000).toFixed(2)} millones en las últimas 24 horas.`;
      
      return {
        id: Date.now() + Math.floor(Math.random() * 1000),
        headline,
        summary,
        url: `https://www.coingecko.com/en/coins/${coin.id}`,
        source: 'Market Data',
        datetime: Date.now(),
        image: coin.image || '',
        category: 'crypto',
        sentiment
      };
    });
  } catch (error) {
    console.error('Error al generar noticias desde datos de mercado:', error);
    
    // Si todo falla, devolver un array vacío
    return [];
  }
};

// Análisis simple de sentimiento basado en palabras clave
const analyzeSentiment = (text: string): 'positive' | 'negative' | 'neutral' => {
  const positiveWords = [
    'subida', 'alcista', 'ganancias', 'crecimiento', 'adopción',
    'bullish', 'optimista', 'éxito', 'positivo', 'mejora',
    'aumento', 'beneficios', 'innovación', 'desarrollo', 'avance',
    'rally', 'soporte', 'recuperación', 'oportunidad', 'potencial',
    'up', 'gain', 'growth', 'adoption', 'success',
    'positive', 'improvement', 'innovation', 'development', 'advance'
  ];

  const negativeWords = [
    'bajada', 'bajista', 'pérdidas', 'caída', 'riesgo',
    'bearish', 'pesimista', 'fracaso', 'negativo', 'problema',
    'disminución', 'restricción', 'prohibición', 'hack', 'fraude',
    'colapso', 'resistencia', 'corrección', 'volatilidad', 'manipulación',
    'down', 'loss', 'fall', 'risk', 'failure',
    'negative', 'problem', 'restriction', 'ban', 'fraud'
  ];

  const lowercaseText = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = lowercaseText.match(regex);
    if (matches) positiveCount += matches.length;
  });

  negativeWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = lowercaseText.match(regex);
    if (matches) negativeCount += matches.length;
  });

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}; 