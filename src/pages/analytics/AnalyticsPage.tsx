import React, { useState, useEffect } from 'react'
import {
  VStack,
  SimpleGrid,
  Card,
  CardBody,
  Text,
  Box,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useColorModeValue,
  Progress,
  HStack,
  Icon,
  Select,
  Spinner,
  Center,
  useToast
} from '@chakra-ui/react'
import { CheckCircleIcon, WarningIcon, TimeIcon } from '@chakra-ui/icons'
import { analyzeSignals, type PerformanceMetrics } from '../../services/analyticsService'

export const AnalyticsPage = () => {
  const bgColor = useColorModeValue('dark.200', 'dark.300')
  const textColor = useColorModeValue('gray.300', 'gray.200')
  const toast = useToast()

  const [timeframe, setTimeframe] = useState('30d')
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true)
      try {
        const data = await analyzeSignals(timeframe)
        setMetrics(data)
      } catch (error) {
        toast({
          title: "Error al cargar métricas",
          description: "No se pudieron cargar las estadísticas de trading",
          status: "error",
          duration: 3000,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetrics()
  }, [timeframe, toast])

  if (isLoading || !metrics) {
    return (
      <Center h="200px">
        <Spinner size="xl" />
      </Center>
    )
  }

  return (
    <VStack spacing={8} align="stretch">
      <Flex justify="space-between" align="center">
        <Text fontSize="2xl" fontWeight="bold">Análisis de Trading</Text>
        <Select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          width="auto"
          ml={4}
        >
          <option value="7d">Última semana</option>
          <option value="30d">Último mes</option>
          <option value="90d">Últimos 3 meses</option>
          <option value="180d">Últimos 6 meses</option>
          <option value="365d">Último año</option>
        </Select>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
        <Card bg={bgColor}>
          <CardBody>
            <Stat>
              <StatLabel>Operaciones Totales</StatLabel>
              <StatNumber>{metrics.totalOperations}</StatNumber>
              <StatHelpText>
                {timeframe === '30d' ? 'Último mes' : 
                 timeframe === '7d' ? 'Última semana' :
                 timeframe === '90d' ? 'Últimos 3 meses' :
                 timeframe === '180d' ? 'Últimos 6 meses' : 'Último año'}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={bgColor}>
          <CardBody>
            <Stat>
              <StatLabel>Tasa de Éxito</StatLabel>
              <StatNumber>{metrics.successRate.toFixed(1)}%</StatNumber>
              <StatHelpText>
                {metrics.successfulOperations} operaciones exitosas
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={bgColor}>
          <CardBody>
            <Stat>
              <StatLabel>Beneficio Promedio</StatLabel>
              <StatNumber>+{metrics.averageProfit.toFixed(2)}%</StatNumber>
              <StatHelpText>
                Por operación exitosa
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={bgColor}>
          <CardBody>
            <Stat>
              <StatLabel>Pérdida Promedio</StatLabel>
              <StatNumber>-{metrics.averageLoss.toFixed(2)}%</StatNumber>
              <StatHelpText>
                Por operación fallida
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        <Card bg={bgColor}>
          <CardBody>
            <Text fontSize="lg" fontWeight="bold" mb={4}>Rendimiento por Activo</Text>
            <VStack spacing={4} align="stretch">
              {metrics.performanceByAsset.map((asset) => (
                <Box key={asset.symbol}>
                  <Flex justify="space-between" mb={2}>
                    <Text>{asset.symbol}</Text>
                    <Text color={asset.totalReturn >= 0 ? "green.400" : "red.400"}>
                      {asset.totalReturn >= 0 ? "+" : ""}{asset.totalReturn.toFixed(2)}%
                    </Text>
                  </Flex>
                  <Progress 
                    value={Math.abs(asset.successRate)} 
                    colorScheme={asset.totalReturn >= 0 ? "green" : "red"} 
                    borderRadius="full"
                  />
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Tasa de éxito: {asset.successRate.toFixed(1)}% ({asset.totalOperations} ops)
                  </Text>
                </Box>
              ))}
            </VStack>
          </CardBody>
        </Card>

        <Card bg={bgColor}>
          <CardBody>
            <Text fontSize="lg" fontWeight="bold" mb={4}>Señales Recientes</Text>
            <VStack spacing={4} align="stretch">
              {metrics.recentSignals.map((signal, index) => (
                <HStack key={index} justify="space-between" p={3} bg="dark.300" borderRadius="md">
                  <HStack>
                    <Icon 
                      as={signal.confidence > 0.7 ? CheckCircleIcon : signal.confidence > 0.5 ? TimeIcon : WarningIcon}
                      color={signal.confidence > 0.7 ? "green.400" : signal.confidence > 0.5 ? "yellow.400" : "red.400"}
                    />
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold">{signal.symbol}</Text>
                      <Text fontSize="sm" color={textColor}>
                        {signal.type === 'buy' ? 'Compra' : 'Venta'} ({(signal.confidence * 100).toFixed(0)}%)
                      </Text>
                    </VStack>
                  </HStack>
                  <VStack align="end" spacing={0}>
                    <Text>${signal.price.toFixed(2)}</Text>
                    <Text fontSize="sm" color={textColor}>
                      Hace {Math.floor((Date.now() - signal.timestamp) / 3600000)}h
                    </Text>
                  </VStack>
                </HStack>
              ))}
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Card bg={bgColor}>
        <CardBody>
          <Text fontSize="lg" fontWeight="bold" mb={4}>Mejores y Peores Operaciones</Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            <Box>
              <Text fontSize="md" fontWeight="semibold" mb={2} color="green.400">Mejor Operación</Text>
              <VStack align="start" spacing={1}>
                <Text>{metrics.bestOperation.symbol}</Text>
                <Text>+{metrics.bestOperation.profit.toFixed(2)}%</Text>
                <Text fontSize="sm" color="gray.500">{metrics.bestOperation.date}</Text>
              </VStack>
            </Box>
            <Box>
              <Text fontSize="md" fontWeight="semibold" mb={2} color="red.400">Peor Operación</Text>
              <VStack align="start" spacing={1}>
                <Text>{metrics.worstOperation.symbol}</Text>
                <Text>-{metrics.worstOperation.loss.toFixed(2)}%</Text>
                <Text fontSize="sm" color="gray.500">{metrics.worstOperation.date}</Text>
              </VStack>
            </Box>
          </SimpleGrid>
        </CardBody>
      </Card>
    </VStack>
  )
} 