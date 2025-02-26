import React, { useState, useEffect } from 'react'
import { Box, Text, Flex, useColorModeValue, Button, VStack, CircularProgress, CircularProgressLabel, Spinner, Alert, AlertIcon } from '@chakra-ui/react'
import { getMarketData } from '../services/api'

interface MarketSummary {
  totalValue: number;
  monthlyChange: number;
  yearlyChange: number;
}

export const TradingReport = () => {
  const [marketSummary, setMarketSummary] = useState<MarketSummary>({
    totalValue: 0,
    monthlyChange: 0,
    yearlyChange: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const bgColor = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.600', 'gray.200')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getMarketData(5) // Obtener los 5 principales pares
        
        // Calculamos el valor total del mercado basado en precio * volumen
        const totalMarketValue = data.reduce((acc, coin) => acc + (coin.price * coin.volume), 0)
        
        // Calculamos el cambio promedio
        const avgChange = data.reduce((acc, coin) => acc + coin.priceChangePercent, 0) / data.length
        
        setMarketSummary({
          totalValue: totalMarketValue / 1000000, // Convertir a millones
          monthlyChange: avgChange * 30, // Estimación mensual
          yearlyChange: avgChange * 365 // Estimación anual
        })
      } catch (error) {
        console.error('Error fetching market summary:', error)
        setError('No se pudieron obtener los datos del mercado')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 60000) // Actualizar cada minuto
    return () => clearInterval(interval)
  }, [])

  if (error) {
    return (
      <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="sm">
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    )
  }

  if (loading) {
    return (
      <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="sm" height="400px">
        <Flex justify="center" align="center" height="100%">
          <Spinner size="xl" />
        </Flex>
      </Box>
    )
  }

  return (
    <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="sm">
      <Flex justify="space-between" align="center" mb={6}>
        <Text fontSize="xl" fontWeight="bold">Reporte de Mercado</Text>
        <Button size="sm" colorScheme="green">Descargar Reporte</Button>
      </Flex>

      <Box position="relative" mb={8}>
        <CircularProgress
          value={Math.min(Math.abs(marketSummary.monthlyChange), 100)}
          size="200px"
          thickness="4px"
          color={marketSummary.monthlyChange >= 0 ? "green.400" : "red.400"}
        >
          <CircularProgressLabel>
            <VStack spacing={0}>
              <Text fontSize="3xl" fontWeight="bold">
                ${marketSummary.totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}M
              </Text>
              <Text fontSize="sm" color={textColor}>Vol. Total</Text>
            </VStack>
          </CircularProgressLabel>
        </CircularProgress>
      </Box>

      <Flex justify="space-between" mb={4}>
        <Box>
          <Text color={textColor}>Cambio Mensual (est.)</Text>
          <Text fontSize="xl" fontWeight="bold" color={marketSummary.monthlyChange >= 0 ? "green.400" : "red.400"}>
            {marketSummary.monthlyChange >= 0 ? "↑" : "↓"} 
            {Math.abs(marketSummary.monthlyChange).toFixed(2)}%
          </Text>
        </Box>
        <Box textAlign="right">
          <Text color={textColor}>Cambio Anual (est.)</Text>
          <Text fontSize="xl" fontWeight="bold" color={marketSummary.yearlyChange >= 0 ? "green.400" : "red.400"}>
            {marketSummary.yearlyChange >= 0 ? "↑" : "↓"} 
            {Math.abs(marketSummary.yearlyChange).toFixed(2)}%
          </Text>
        </Box>
      </Flex>
    </Box>
  )
} 