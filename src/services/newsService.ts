import axios from 'axios';
import { API_CONFIG } from '../config/api';

interface NewsItem {
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

// Noticias simuladas para desarrollo
const mockNews: NewsItem[] = [
  {
    id: 1,
    headline: 'Bitcoin alcanza nuevos máximos en volumen de trading',
    summary: 'El volumen de trading de Bitcoin ha alcanzado nuevos máximos históricos, indicando un creciente interés institucional.',
    url: 'https://example.com/btc-news-1',
    source: 'Crypto News',
    datetime: Date.now(),
    image: '',
    category: 'crypto',
    sentiment: 'positive'
  },
  {
    id: 2,
    headline: 'Ethereum 2.0 muestra avances significativos en desarrollo',
    summary: 'Los desarrolladores de Ethereum reportan avances importantes en la actualización a ETH 2.0.',
    url: 'https://example.com/eth-news-1',
    source: 'Crypto Daily',
    datetime: Date.now(),
    image: '',
    category: 'crypto',
    sentiment: 'positive'
  },
  {
    id: 3,
    headline: 'Binance expande servicios en América Latina',
    summary: 'Binance anuncia expansión de servicios y nuevas integraciones en la región latinoamericana.',
    url: 'https://example.com/bnb-news-1',
    source: 'Crypto Market',
    datetime: Date.now(),
    image: '',
    category: 'crypto',
    sentiment: 'positive'
  },
  {
    id: 4,
    headline: 'Solana mejora rendimiento de la red',
    summary: 'Actualizaciones recientes en la red Solana muestran mejoras significativas en velocidad y estabilidad.',
    url: 'https://example.com/sol-news-1',
    source: 'Crypto Tech',
    datetime: Date.now(),
    image: '',
    category: 'crypto',
    sentiment: 'positive'
  },
  {
    id: 5,
    headline: 'Ripple gana terreno en pagos internacionales',
    summary: 'Nuevas asociaciones de Ripple con instituciones financieras impulsan adopción de XRP.',
    url: 'https://example.com/xrp-news-1',
    source: 'Crypto Finance',
    datetime: Date.now(),
    image: '',
    category: 'crypto',
    sentiment: 'positive'
  }
];

export const getLatestNews = async (limit: number = 10): Promise<NewsItem[]> => {
  try {
    // Por ahora, usamos noticias simuladas
    console.log('Usando noticias simuladas mientras se resuelve el problema con Finnhub');
    return mockNews.slice(0, limit);

    /* Código original comentado hasta resolver el problema con Finnhub
    const response = await axios.get(`${API_CONFIG.FINNHUB.BASE_URL}${API_CONFIG.FINNHUB.ENDPOINTS.CRYPTO_NEWS}`, {
      params: {
        token: API_CONFIG.FINNHUB.API_KEY,
        category: 'crypto',
      },
    });

    console.log('Respuesta de Finnhub:', response.data);

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
      console.warn('No se encontraron noticias válidas');
      return [];
    }

    return processedNews;
    */
  } catch (error) {
    console.error('Error detallado al obtener noticias:', error);
    // En caso de error, devolvemos las noticias simuladas
    return mockNews.slice(0, limit);
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