import axios from 'axios';

interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  total_volume: number;
}

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export const getTop20Cryptos = async (): Promise<CryptoData[]> => {
  try {
    const response = await axios.get(`${COINGECKO_API}/coins/markets`, {
      params: {
        vs_currency: 'usd',
        order: 'volume_desc',
        per_page: 20,
        page: 1,
        sparkline: false
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching crypto data:', error);
    return [];
  }
};

export const getCryptoPrice = async (id: string): Promise<number | null> => {
  try {
    const response = await axios.get(`${COINGECKO_API}/simple/price`, {
      params: {
        ids: id,
        vs_currencies: 'usd'
      }
    });
    return response.data[id]?.usd || null;
  } catch (error) {
    console.error('Error fetching crypto price:', error);
    return null;
  }
}; 