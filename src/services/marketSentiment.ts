import axios from 'axios';
import { API_CONFIG } from '../config/api';

interface NewsItem {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  related: string;
  source: string;
  summary: string;
  url: string;
}

interface SentimentResult {
  overallSentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  relevantNews: {
    headline: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    impact: number;
  }[];
}

// Cache para las noticias y el sentimiento
let newsCache: NewsItem[] = [];
let lastNewsUpdate = 0;
const NEWS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const analyzeMarketSentiment = async (symbol: string): Promise<SentimentResult> => {
  try {
    const now = Date.now();
    
    // Actualizar caché de noticias si es necesario
    if (newsCache.length === 0 || (now - lastNewsUpdate) > NEWS_CACHE_DURATION) {
      const response = await axios.get(`${API_CONFIG.FINNHUB.BASE_URL}/crypto/news`, {
        params: {
          token: API_CONFIG.FINNHUB.API_KEY
        }
      });
      newsCache = response.data;
      lastNewsUpdate = now;
    }

    // Filtrar noticias relevantes para el símbolo
    const relevantNews = newsCache.filter(news => 
      news.related.toLowerCase().includes(symbol.toLowerCase()) ||
      news.category.toLowerCase().includes('crypto') ||
      news.headline.toLowerCase().includes(symbol.toLowerCase())
    );

    // Análisis de sentimiento basado en palabras clave
    const newsAnalysis = relevantNews.map(news => {
      const sentiment = analyzeSentiment(news.headline + ' ' + news.summary);
      const impact = calculateNewsImpact(news);
      
      return {
        headline: news.headline,
        sentiment,
        impact
      };
    });

    // Calcular sentimiento general
    let positiveScore = 0;
    let negativeScore = 0;
    let totalImpact = 0;

    newsAnalysis.forEach(analysis => {
      if (analysis.sentiment === 'positive') {
        positiveScore += analysis.impact;
      } else if (analysis.sentiment === 'negative') {
        negativeScore += analysis.impact;
      }
      totalImpact += analysis.impact;
    });

    const overallScore = totalImpact > 0 ? (positiveScore - negativeScore) / totalImpact : 0;
    const confidence = Math.min(Math.abs(overallScore) * 1.5, 1);

    return {
      overallSentiment: overallScore > 0.1 ? 'positive' : overallScore < -0.1 ? 'negative' : 'neutral',
      confidence,
      relevantNews: newsAnalysis.sort((a, b) => b.impact - a.impact).slice(0, 5)
    };
  } catch (error) {
    console.error('Error analyzing market sentiment:', error);
    return {
      overallSentiment: 'neutral',
      confidence: 0,
      relevantNews: []
    };
  }
};

// Análisis simple de sentimiento basado en palabras clave
const analyzeSentiment = (text: string): 'positive' | 'negative' | 'neutral' => {
  const positiveWords = [
    'bullish', 'surge', 'soar', 'gain', 'rally', 'jump', 'recover',
    'breakthrough', 'support', 'upgrade', 'adopt', 'partnership',
    'innovation', 'growth', 'success', 'positive', 'strong',
    'alcista', 'subida', 'mejora', 'éxito', 'adopción', 'crecimiento'
  ];

  const negativeWords = [
    'bearish', 'crash', 'plunge', 'drop', 'fall', 'decline', 'tumble',
    'resistance', 'downgrade', 'ban', 'hack', 'scam', 'fraud',
    'concern', 'risk', 'warning', 'negative', 'weak',
    'bajista', 'caída', 'riesgo', 'fraude', 'advertencia', 'prohibición'
  ];

  const text_lower = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = text_lower.match(regex);
    if (matches) positiveCount += matches.length;
  });

  negativeWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = text_lower.match(regex);
    if (matches) negativeCount += matches.length;
  });

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
};

// Calcula el impacto de una noticia basado en su fuente y tiempo
const calculateNewsImpact = (news: NewsItem): number => {
  const now = Date.now();
  const hoursSincePublished = (now - news.datetime * 1000) / (1000 * 60 * 60);
  
  // El impacto disminuye con el tiempo
  let impact = Math.max(0, 1 - (hoursSincePublished / 24));

  // Ajustar impacto según la fuente
  const majorSources = ['reuters', 'bloomberg', 'coindesk', 'cointelegraph'];
  if (majorSources.some(source => news.source.toLowerCase().includes(source))) {
    impact *= 1.5;
  }

  return Math.min(impact, 1);
}; 