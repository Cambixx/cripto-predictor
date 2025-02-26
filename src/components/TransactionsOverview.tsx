import React, { useState, useEffect } from 'react'
import { 
  Box, 
  Text, 
  Flex, 
  useColorModeValue, 
  Button, 
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td, 
  HStack, 
  Icon, 
  Spinner, 
  Alert, 
  AlertIcon,
  useBreakpointValue,
  VStack,
  Grid,
  GridItem,
  Card,
  CardBody
} from '@chakra-ui/react'
import { TriangleUpIcon, TriangleDownIcon } from '@chakra-ui/icons'
import { getMarketData, type CoinData } from '../services/api'

// Función auxiliar para obtener el nombre amigable de la criptomoneda
const getCryptoName = (symbol: string): string => {
  const commonNames: { [key: string]: string } = {
    'BTC': 'Bitcoin',
    'ETH': 'Ethereum',
    'BNB': 'Binance Coin',
    'SOL': 'Solana',
    'XRP': 'Ripple',
    'ADA': 'Cardano',
    'DOT': 'Polkadot',
    'AVAX': 'Avalanche',
    'MATIC': 'Polygon',
    'LINK': 'Chainlink',
    'UNI': 'Uniswap',
    'ATOM': 'Cosmos',
    'DOGE': 'Dogecoin',
    'LTC': 'Litecoin',
    'NEAR': 'NEAR Protocol',
  };

  const baseSymbol = symbol.replace('USDT', '');
  return commonNames[baseSymbol] || baseSymbol;
};

export const TransactionsOverview = () => {
  const [marketData, setMarketData] = useState<CoinData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const bgColor = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.600', 'gray.200')
  const isMobile = useBreakpointValue({ base: true, md: false })

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getMarketData(15) // Aumentamos el límite a 15 pares
        if (!isMounted) return;
        setMarketData(data)
      } catch (error) {
        if (!isMounted) return;
        console.error('Error fetching market data:', error)
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
  }, [])

  if (error) {
    return (
      <Box bg={bgColor} p={isMobile ? 3 : 6} borderRadius="lg" boxShadow="sm">
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    )
  }

  if (loading) {
    return (
      <Box bg={bgColor} p={isMobile ? 3 : 6} borderRadius="lg" boxShadow="sm" height={isMobile ? "300px" : "400px"}>
        <Flex justify="center" align="center" height="100%">
          <Spinner size="xl" />
        </Flex>
      </Box>
    )
  }

  const MobileView = () => (
    <VStack spacing={4} width="100%">
      {marketData.map((coin) => (
        <Card key={coin.symbol} width="100%" bg={bgColor} variant="filled">
          <CardBody>
            <VStack align="stretch" spacing={2}>
              <Flex justify="space-between" align="center">
                <Flex align="center" gap={2}>
                  <Text fontWeight="medium">{getCryptoName(coin.symbol)}</Text>
                  <Text color={textColor} fontSize="sm">({coin.symbol.replace('USDT', '')})</Text>
                </Flex>
                <Flex align="center" color={coin.priceChangePercent >= 0 ? "green.500" : "red.500"}>
                  <Icon as={coin.priceChangePercent >= 0 ? TriangleUpIcon : TriangleDownIcon} mr={1} />
                  {Math.abs(coin.priceChangePercent).toFixed(2)}%
                </Flex>
              </Flex>
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <GridItem>
                  <Text fontSize="sm" color={textColor}>Precio</Text>
                  <Text fontWeight="medium">${coin.price.toLocaleString()}</Text>
                </GridItem>
                <GridItem>
                  <Text fontSize="sm" color={textColor}>Volumen 24h</Text>
                  <Text fontWeight="medium">${(coin.quoteVolume / 1000000).toFixed(2)}M</Text>
                </GridItem>
              </Grid>
            </VStack>
          </CardBody>
        </Card>
      ))}
    </VStack>
  )

  const DesktopView = () => (
    <Table variant="simple">
      <Thead>
        <Tr>
          <Th>Criptomoneda</Th>
          <Th>Precio</Th>
          <Th>Cambio 24h</Th>
          <Th>Volumen 24h</Th>
        </Tr>
      </Thead>
      <Tbody>
        {marketData.map((coin) => (
          <Tr key={coin.symbol}>
            <Td>
              <Flex align="center" gap={2}>
                <Text fontWeight="medium">{getCryptoName(coin.symbol)}</Text>
                <Text color={textColor}>({coin.symbol.replace('USDT', '')})</Text>
              </Flex>
            </Td>
            <Td>${coin.price.toLocaleString()}</Td>
            <Td>
              <Flex align="center" color={coin.priceChangePercent >= 0 ? "green.500" : "red.500"}>
                <Icon as={coin.priceChangePercent >= 0 ? TriangleUpIcon : TriangleDownIcon} mr={1} />
                {Math.abs(coin.priceChangePercent).toFixed(2)}%
              </Flex>
            </Td>
            <Td>${(coin.quoteVolume / 1000000).toFixed(2)}M</Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  )

  return (
    <Box bg={bgColor} p={isMobile ? 3 : 6} borderRadius="lg" boxShadow="sm">
      <Flex 
        justify="space-between" 
        align={isMobile ? "start" : "center"} 
        mb={6}
        direction={isMobile ? "column" : "row"}
        gap={isMobile ? 2 : 0}
      >
        <Text fontSize={isMobile ? "lg" : "xl"} fontWeight="bold">Resumen del Mercado</Text>
        <Text fontSize="sm" color={textColor}>
          Top {marketData.length} por Volumen (24h)
        </Text>
      </Flex>

      {isMobile ? <MobileView /> : <DesktopView />}
    </Box>
  )
} 