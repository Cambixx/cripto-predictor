import React, { useState, useEffect } from 'react'
import { Box, Flex, Text, useColorModeValue, HStack, Select, Spinner, Alert, AlertIcon } from '@chakra-ui/react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getCoinPriceHistory, getCoinData, type CoinData } from '../services/api'

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const CryptoChart = () => {
  const [timeframe, setTimeframe] = useState('DAY')
  const [priceData, setPriceData] = useState<{time: string, price: number}[]>([])
  const [coinInfo, setCoinInfo] = useState<CoinData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const bgColor = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.600', 'gray.200')

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Primero intentamos obtener la información de la moneda
        const coin = await getCoinData('BTC')
        if (!isMounted) return;
        setCoinInfo(coin)

        // Luego obtenemos el historial de precios
        const priceHistory = await getCoinPriceHistory('BTC', timeframe)
        if (!isMounted) return;

        if (!priceHistory.prices || priceHistory.prices.length === 0) {
          throw new Error('No hay datos de precios disponibles')
        }

        const formattedData = priceHistory.prices.map(point => ({
          time: formatDate(point.time),
          price: point.price
        }))

        if (formattedData.length === 0) {
          throw new Error('No se pudieron procesar los datos de precios')
        }

        setPriceData(formattedData)
      } catch (error) {
        if (!isMounted) return;
        console.error('Error en CryptoChart:', error)
        setError(error instanceof Error ? error.message : 'Error al cargar los datos')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 60000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [timeframe])

  const renderChart = () => {
    if (priceData.length === 0) {
      return (
        <Alert status="warning">
          <AlertIcon />
          No hay datos disponibles para mostrar
        </Alert>
      )
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={priceData}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4299E1" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#4299E1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="time"
            tickFormatter={(value) => value}
            interval="preserveStartEnd"
          />
          <YAxis 
            domain={['auto', 'auto']}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip
            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Precio']}
            labelFormatter={(label) => `Tiempo: ${label}`}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#4299E1"
            fillOpacity={1}
            fill="url(#colorPrice)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  if (error) {
    return (
      <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="sm" mb={6}>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    )
  }

  if (loading || !coinInfo) {
    return (
      <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="sm" mb={6} height="400px">
        <Flex justify="center" align="center" height="100%">
          <Spinner size="xl" />
        </Flex>
      </Box>
    )
  }

  return (
    <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="sm" mb={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Flex align="center" gap={4}>
            <Text fontSize="2xl" fontWeight="bold">Bitcoin (BTC)</Text>
            <Text color={coinInfo.priceChangePercent >= 0 ? "green.500" : "red.500"}>
              {coinInfo.priceChangePercent.toFixed(2)}%
            </Text>
          </Flex>
          <Text fontSize="3xl" fontWeight="bold">${coinInfo.price.toLocaleString()}</Text>
          <Text color={textColor}>Última actualización: {new Date().toLocaleString()}</Text>
        </Box>
        <HStack spacing={4}>
          <Select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
            <option value="DAY">24 horas</option>
            <option value="WEEK">7 días</option>
            <option value="MONTH">30 días</option>
          </Select>
        </HStack>
      </Flex>

      <Box h="300px">
        {renderChart()}
      </Box>
    </Box>
  )
} 