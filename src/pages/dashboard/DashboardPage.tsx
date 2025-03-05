import React, { useState, useEffect, useCallback } from 'react'
import { 
  VStack, 
  HStack, 
  Grid, 
  GridItem, 
  Box, 
  Text, 
  Heading, 
  Tabs, 
  TabList, 
  Tab, 
  TabPanels, 
  TabPanel,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Icon,
  Badge,
  Button,
  Flex,
  Skeleton,
  useColorModeValue,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Select,
  useToast
} from '@chakra-ui/react'
import { BellIcon, InfoOutlineIcon, StarIcon, AddIcon, ExternalLinkIcon } from '@chakra-ui/icons'
import { Link as RouterLink } from 'react-router-dom'
import { CryptoChart } from '../../components/CryptoChart'
import { TradingSignals } from '../../components/TradingSignals'
import { TransactionsOverview } from '../../components/TransactionsOverview'
import { TradingStrategiesCard } from '../../components/TradingStrategiesCard'
import { AlertsManager } from '../../components/AlertsManager'
import { generateTradingSignals, type TradingSignal, generateDashboardSignals, type DashboardSignal, type TopSignals, SignalType, ConfidenceLevel } from '../../services/tradingSignals'
import { getActiveTradingPairs, getCoinData } from '../../services/api'
import { registerForPushNotifications } from '../../services/notificationService'

// ID de usuario simulado
const MOCK_USER_ID = 'user123';

export const DashboardPage = () => {
  const bgColor = useColorModeValue('gray.800', 'gray.900');
  const borderColor = useColorModeValue('gray.700', 'gray.600');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  
  // Estados para el dashboard
  const [signals, setSignals] = useState<TopSignals | null>(null);
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([]);
  const [activeSymbol, setActiveSymbol] = useState<string>('BTC/USDT');
  const [selectedSignal, setSelectedSignal] = useState<TradingSignal | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estado para las señales del dashboard
  const [dashboardSignals, setDashboardSignals] = useState<DashboardSignal[]>([]);

  // Función auxiliar para cargar señales del dashboard
  const loadDashboardSignals = useCallback(async (count: number = 5) => {
    try {
      // Obtenemos las señales 
      const result = await generateDashboardSignals(count);
      // Actualizamos el estado con los resultados
      setDashboardSignals(result);
    } catch (error) {
      console.error("Error cargando señales del dashboard:", error);
      // En caso de error, establecemos un array vacío
      setDashboardSignals([]);
    }
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Obtener pares activos y señales de trading
        const [pairsResult, tradingSignalsResult] = await Promise.allSettled([
          getActiveTradingPairs(),
          generateTradingSignals('DAY')
        ]);
        
        // Manejar los resultados de los pares
        if (pairsResult.status === 'fulfilled' && pairsResult.value.length > 0) {
          setAvailableSymbols(pairsResult.value);
        } else {
          // En caso de error, usar algunos pares populares por defecto
          const defaultPairs = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'XRP/USDT'];
          setAvailableSymbols(defaultPairs);
          console.info('Usando pares de trading predeterminados');
        }
        
        // Manejar los resultados de las señales de trading
        if (tradingSignalsResult.status === 'fulfilled') {
          setSignals(tradingSignalsResult.value);
          
          // Seleccionar la primera señal de compra por defecto si existe
          if (tradingSignalsResult.value.buySignals.length > 0) {
            setSelectedSignal(tradingSignalsResult.value.buySignals[0]);
            setActiveSymbol(tradingSignalsResult.value.buySignals[0].symbol);
          } else if (pairsResult.status === 'fulfilled' && pairsResult.value.length > 0) {
            // Si no hay señales pero tenemos pares, seleccionar el primer par
            setActiveSymbol(pairsResult.value[0]);
          } else {
            // En caso extremo, seleccionar BTC/USDT
            setActiveSymbol('BTC/USDT');
          }
        } else {
          console.info('No se pudieron cargar las señales de trading');
          
          // Si no tenemos señales, al menos intentar seleccionar un símbolo activo
          if (pairsResult.status === 'fulfilled' && pairsResult.value.length > 0) {
            setActiveSymbol(pairsResult.value[0]);
          } else {
            setActiveSymbol('BTC/USDT');
          }
        }
        
        // Cargar las señales del dashboard usando nuestra función auxiliar
        await loadDashboardSignals(5);
        
      } catch (error) {
        console.error('Error cargando datos iniciales:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar algunos datos iniciales',
          status: 'warning',
          duration: 3000,
        });
        // Asegurar que al menos tenemos valores por defecto
        setAvailableSymbols(['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'XRP/USDT']);
        setActiveSymbol('BTC/USDT');
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, [toast, loadDashboardSignals]);

  // Refrescar datos
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      
      // Obtener nuevos pares activos y señales
      const [pairs, tradingSignals] = await Promise.all([
        getActiveTradingPairs(),
        generateTradingSignals('DAY')
      ]);
      
      // Actualizar estados
      setAvailableSymbols(pairs);
      setSignals(tradingSignals);
      
      // Refrescar también las señales del dashboard
      await loadDashboardSignals(5);
      
      toast({
        title: 'Datos actualizados',
        description: 'Los datos del dashboard han sido actualizados',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error refrescando datos:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron actualizar los datos',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Cambiar activo seleccionado
  const handleSymbolChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setActiveSymbol(event.target.value);
    
    // Buscar señal correspondiente si existe
    const allSignals = [...(signals?.buySignals || []), ...(signals?.sellSignals || [])];
    const matchingSignal = allSignals.find(signal => signal.symbol === event.target.value);
    
    if (matchingSignal) {
      setSelectedSignal(matchingSignal);
    } else {
      setSelectedSignal(null);
    }
  };

  // Mostrar detalles de una señal
  const handleViewSignalDetails = (signal: TradingSignal) => {
    setSelectedSignal(signal);
    setActiveSymbol(signal.symbol);
    onOpen();
  };

  // Activar notificaciones
  const handleEnableNotifications = async () => {
    try {
      const result = await registerForPushNotifications(MOCK_USER_ID);
      if (result.success) {
        toast({
          title: 'Notificaciones activadas',
          description: 'Recibirás alertas cuando se generen nuevas señales',
          status: 'success',
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron activar las notificaciones',
        status: 'error',
        duration: 3000,
      });
    }
  };

  return (
    <Grid
      templateColumns={{ base: '1fr', lg: 'repeat(3, 1fr)' }}
      templateRows={{ base: 'auto', lg: 'auto auto auto' }}
      gap={6}
    >
      {/* Header - Información general y controles */}
      <GridItem colSpan={{ base: 1, lg: 3 }}>
        <Flex 
          justify="space-between" 
          align={{ base: "stretch", md: "center" }}
          direction={{ base: "column", md: "row" }}
          gap={4}
          mb={4}
        >
          <Box>
            <Heading size="lg" color="white">Trading Dashboard</Heading>
            <Text color="gray.400" fontSize="sm">Mercado en tiempo real con señales avanzadas y alertas</Text>
          </Box>
          
          <HStack spacing={4}>
            <Select 
              value={activeSymbol} 
              onChange={handleSymbolChange} 
              width="auto" 
              size="sm"
              bg={bgColor}
              borderColor={borderColor}
            >
              {availableSymbols.map(symbol => (
                <option key={symbol} value={symbol}>{symbol}</option>
              ))}
            </Select>
            
            <Button 
              leftIcon={<BellIcon />} 
              size="sm" 
              colorScheme="blue" 
              variant="outline"
              onClick={handleEnableNotifications}
            >
              Activar Alertas
            </Button>
            
            <Button 
              colorScheme="green" 
              size="sm"
              isLoading={refreshing}
              onClick={handleRefresh}
            >
              Actualizar
            </Button>
          </HStack>
        </Flex>
      </GridItem>

      {/* Panel izquierdo - Gráfico y estadísticas de mercado */}
      <GridItem colSpan={{ base: 1, lg: 2 }} rowSpan={{ base: 1, lg: 2 }}>
        <VStack spacing={6} align="stretch">
          {/* Gráfico principal */}
          <Box 
            p={6} 
            bg={bgColor} 
            borderRadius="xl" 
            borderWidth="1px" 
            borderColor={borderColor}
            boxShadow="xl"
          >
            <Skeleton isLoaded={!loading} height={loading ? "400px" : "auto"}>
              <CryptoChart symbol={activeSymbol} />
            </Skeleton>
          </Box>
          
          {/* Estrategias de trading */}
          <Box>
            <Skeleton isLoaded={!loading} height={loading ? "200px" : "auto"}>
              {selectedSignal && selectedSignal.advancedPatterns && (
                <TradingStrategiesCard 
                  patterns={selectedSignal.advancedPatterns} 
                  symbol={selectedSignal.symbol} 
                />
              )}
              {(!selectedSignal || !selectedSignal.advancedPatterns || selectedSignal.advancedPatterns.length === 0) && (
                <Box 
                  p={6} 
                  bg={bgColor} 
                  borderRadius="xl" 
                  borderWidth="1px" 
                  borderColor={borderColor}
                  boxShadow="xl"
                >
                  <VStack spacing={4} align="stretch">
                    <Heading size="md" color="white">Estrategias de Trading</Heading>
                    <Text color="gray.400">
                      No se han detectado patrones avanzados para {activeSymbol} en este momento.
                      Selecciona otro activo o actualiza para ver nuevas estrategias.
                    </Text>
                  </VStack>
                </Box>
              )}
            </Skeleton>
          </Box>
        </VStack>
      </GridItem>

      {/* Panel derecho - Señales y alertas */}
      <GridItem colSpan={1} rowSpan={{ base: 1, lg: 2 }}>
        <VStack spacing={6} align="stretch">
          {/* Resumen de señales */}
          <Box 
            p={6} 
            bg={bgColor} 
            borderRadius="xl" 
            borderWidth="1px" 
            borderColor={borderColor}
            boxShadow="xl"
          >
            <Skeleton isLoaded={!loading} height={loading ? "200px" : "auto"}>
              <VStack spacing={4} align="stretch">
                <Flex justify="space-between" align="center">
                  <Heading size="md" color="white">Señales de Trading</Heading>
                  <Button 
                    as={RouterLink} 
                    to="/alerts" 
                    size="xs" 
                    rightIcon={<ExternalLinkIcon />}
                    variant="ghost"
                  >
                    Ver todas
                  </Button>
                </Flex>
                
                <Text color="gray.300" fontSize="sm" mb={4}>
                  Últimas señales generadas por nuestro algoritmo
                </Text>
                
                <Tabs variant="soft-rounded" colorScheme="blue" size="sm">
                  <TabList>
                    <Tab>Compra</Tab>
                    <Tab>Venta</Tab>
                    <Tab>Destacadas</Tab>
                  </TabList>
                  
                  <TabPanels mt={4}>
                    <TabPanel p={0}>
                      <VStack spacing={2} align="stretch" maxH="300px" overflowY="auto">
                        {signals?.buySignals && signals.buySignals.length > 0 ? (
                          signals.buySignals.map((signal: TradingSignal) => (
                            <Flex 
                              key={signal.symbol} 
                              p={3} 
                              bg="gray.700" 
                              borderRadius="md" 
                              justify="space-between" 
                              align="center"
                              onClick={() => handleViewSignalDetails(signal)}
                              cursor="pointer"
                              _hover={{ bg: 'gray.600' }}
                            >
                              <HStack>
                                <Badge colorScheme="green">Compra</Badge>
                                <Text fontWeight="bold">{signal.symbol}</Text>
                              </HStack>
                              <HStack>
                                <Text fontSize="sm" color="gray.300">${signal.price.toFixed(2)}</Text>
                                <Badge 
                                  colorScheme={signal.confidence > 0.7 ? "green" : "yellow"}
                                  variant="outline"
                                >
                                  {Math.round(signal.confidence * 100)}%
                                </Badge>
                              </HStack>
                            </Flex>
                          ))
                        ) : (
                          <Text color="gray.400" fontSize="sm" p={2}>
                            No hay señales de compra disponibles
                          </Text>
                        )}
                      </VStack>
                    </TabPanel>
                    
                    <TabPanel p={0}>
                      <VStack spacing={2} align="stretch" maxH="300px" overflowY="auto">
                        {signals?.sellSignals && signals.sellSignals.length > 0 ? (
                          signals.sellSignals.map((signal: TradingSignal) => (
                            <Flex 
                              key={signal.symbol} 
                              p={3} 
                              bg="gray.700" 
                              borderRadius="md" 
                              justify="space-between" 
                              align="center"
                              onClick={() => handleViewSignalDetails(signal)}
                              cursor="pointer"
                              _hover={{ bg: 'gray.600' }}
                            >
                              <HStack>
                                <Badge colorScheme="red">Venta</Badge>
                                <Text fontWeight="bold">{signal.symbol}</Text>
                              </HStack>
                              <HStack>
                                <Text fontSize="sm" color="gray.300">${signal.price.toFixed(2)}</Text>
                                <Badge 
                                  colorScheme={signal.confidence > 0.7 ? "green" : "yellow"}
                                  variant="outline"
                                >
                                  {Math.round(signal.confidence * 100)}%
                                </Badge>
                              </HStack>
                            </Flex>
                          ))
                        ) : (
                          <Text color="gray.400" fontSize="sm" p={2}>
                            No hay señales de venta disponibles
                          </Text>
                        )}
                      </VStack>
                    </TabPanel>
                    
                    <TabPanel p={0}>
                      <VStack spacing={2} align="stretch" maxH="300px" overflowY="auto">
                        {dashboardSignals && dashboardSignals.length > 0 ? (
                          dashboardSignals
                            .filter(signal => signal.confidence === ConfidenceLevel.HIGH || signal.confidence === ConfidenceLevel.VERY_HIGH)
                            .map((signal: DashboardSignal) => (
                              <Flex 
                                key={signal.id} 
                                p={3} 
                                bg="gray.700" 
                                borderRadius="md" 
                                justify="space-between" 
                                align="center"
                                cursor="pointer"
                                _hover={{ bg: 'gray.600' }}
                              >
                                <HStack>
                                  <Badge 
                                    colorScheme={
                                      signal.type === SignalType.BUY || signal.type === SignalType.STRONG_BUY 
                                        ? "green" 
                                        : signal.type === SignalType.SELL || signal.type === SignalType.STRONG_SELL 
                                          ? "red" 
                                          : "gray"
                                    }
                                  >
                                    {signal.type === SignalType.BUY ? "Compra" : 
                                     signal.type === SignalType.STRONG_BUY ? "Compra Fuerte" :
                                     signal.type === SignalType.SELL ? "Venta" :
                                     signal.type === SignalType.STRONG_SELL ? "Venta Fuerte" : "Mantener"}
                                  </Badge>
                                  <Text fontWeight="bold">{signal.symbol}</Text>
                                </HStack>
                                <HStack>
                                  <Text fontSize="sm" color="gray.300">${signal.price.toFixed(2)}</Text>
                                  <Badge 
                                    colorScheme={
                                      signal.confidence === ConfidenceLevel.VERY_HIGH 
                                        ? "purple" 
                                        : signal.confidence === ConfidenceLevel.HIGH 
                                          ? "green" 
                                          : signal.confidence === ConfidenceLevel.MEDIUM 
                                            ? "yellow" 
                                            : "gray"
                                    }
                                    variant="outline"
                                  >
                                    {signal.confidence === ConfidenceLevel.VERY_HIGH ? "Muy Alta" :
                                     signal.confidence === ConfidenceLevel.HIGH ? "Alta" :
                                     signal.confidence === ConfidenceLevel.MEDIUM ? "Media" : "Baja"}
                                  </Badge>
                                </HStack>
                              </Flex>
                            ))
                        ) : (
                          <Text color="gray.400" fontSize="sm" p={2}>
                            No hay señales destacadas disponibles
                          </Text>
                        )}
                      </VStack>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </VStack>
            </Skeleton>
          </Box>
          
          {/* Resumen de alertas */}
          <Box 
            p={6} 
            bg={bgColor} 
            borderRadius="xl" 
            borderWidth="1px" 
            borderColor={borderColor}
            boxShadow="xl"
          >
            <VStack spacing={4} align="stretch">
              <Flex justify="space-between" align="center">
                <Heading size="md" color="white">Mis Alertas</Heading>
                <Button 
                  as={RouterLink} 
                  to="/alerts" 
                  size="xs" 
                  colorScheme="blue"
                  leftIcon={<AddIcon />}
                >
                  Configurar
                </Button>
              </Flex>
              
              <Box maxH="300px" overflowY="auto">
                <SimpleGrid columns={1} spacing={3}>
                  {/* Aquí mostraremos un resumen de las alertas activas del usuario */}
                  <Box p={4} bg="gray.700" borderRadius="md">
                    <HStack justify="space-between">
                      <HStack>
                        <Badge colorScheme="green">Activa</Badge>
                        <Text fontWeight="bold">BTC/USDT</Text>
                      </HStack>
                      <Badge colorScheme="blue">Compra</Badge>
                    </HStack>
                    <Text fontSize="sm" color="gray.300" mt={1}>
                      Alerta cuando confianza &gt; 75%
                    </Text>
                  </Box>
                  
                  <Box p={4} bg="gray.700" borderRadius="md">
                    <HStack justify="space-between">
                      <HStack>
                        <Badge colorScheme="green">Activa</Badge>
                        <Text fontWeight="bold">ETH/USDT</Text>
                      </HStack>
                      <Badge colorScheme="red">Venta</Badge>
                    </HStack>
                    <Text fontSize="sm" color="gray.300" mt={1}>
                      Alerta cuando precio &gt; $2,200
                    </Text>
                  </Box>
                  
                  <Button 
                    as={RouterLink} 
                    to="/alerts" 
                    variant="outline" 
                    size="sm" 
                    width="100%"
                  >
                    Ver todas las alertas
                  </Button>
                </SimpleGrid>
              </Box>
            </VStack>
          </Box>
        </VStack>
      </GridItem>

      {/* Panel inferior - Transacciones y estadísticas */}
      <GridItem colSpan={{ base: 1, lg: 3 }}>
        <Box 
          p={6} 
          bg={bgColor} 
          borderRadius="xl" 
          borderWidth="1px" 
          borderColor={borderColor}
          boxShadow="xl"
        >
          <Skeleton isLoaded={!loading} height={loading ? "200px" : "auto"}>
            <VStack spacing={4} align="stretch">
              <Heading size="md" color="white">Resumen del Mercado</Heading>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                <Stat>
                  <StatLabel color="gray.400">Operaciones</StatLabel>
                  <StatNumber color="white">24</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    12 ganancias / 12 pérdidas
                  </StatHelpText>
                </Stat>
                
                <Stat>
                  <StatLabel color="gray.400">Rendimiento</StatLabel>
                  <StatNumber color="green.400">+5.8%</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    Últimos 30 días
                  </StatHelpText>
                </Stat>
                
                <Stat>
                  <StatLabel color="gray.400">Mejor Activo</StatLabel>
                  <StatNumber color="white">BTC/USDT</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    8.2% de retorno
                  </StatHelpText>
                </Stat>
                
                <Stat>
                  <StatLabel color="gray.400">Señales Activas</StatLabel>
                  <StatNumber color="white">
                    {((signals?.buySignals.length || 0) + (signals?.sellSignals.length || 0))}
                  </StatNumber>
                  <StatHelpText>
                    <HStack>
                      <Badge colorScheme="green" variant="outline">{signals?.buySignals.length || 0} compra</Badge>
                      <Badge colorScheme="red" variant="outline">{signals?.sellSignals.length || 0} venta</Badge>
                    </HStack>
                  </StatHelpText>
                </Stat>
              </SimpleGrid>
            </VStack>
          </Skeleton>
        </Box>
      </GridItem>

      {/* Modal de detalles de señal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent bg={bgColor} color="white">
          <ModalHeader>
            Detalles de Señal: {selectedSignal?.symbol}
            <Badge 
              ml={2} 
              colorScheme={selectedSignal?.signal === 'buy' ? 'green' : 'red'}
            >
              {selectedSignal?.signal === 'buy' ? 'Compra' : 'Venta'}
            </Badge>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedSignal && (
              <VStack spacing={4} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Stat>
                    <StatLabel>Precio</StatLabel>
                    <StatNumber>${selectedSignal.price.toFixed(2)}</StatNumber>
                    <StatHelpText>
                      <StatArrow 
                        type={selectedSignal.priceChange24h >= 0 ? 'increase' : 'decrease'} 
                      />
                      {Math.abs(selectedSignal.priceChange24h).toFixed(2)}% (24h)
                    </StatHelpText>
                  </Stat>
                  
                  <Stat>
                    <StatLabel>Confianza</StatLabel>
                    <StatNumber>
                      {(selectedSignal.confidence * 100).toFixed(1)}%
                    </StatNumber>
                    <StatHelpText>
                      <Badge 
                        colorScheme={selectedSignal.confidence > 0.7 ? 'green' : 'yellow'}
                      >
                        {selectedSignal.confidence > 0.7 ? 'Alta' : 'Media'}
                      </Badge>
                    </StatHelpText>
                  </Stat>
                </SimpleGrid>
                
                <Box>
                  <Text fontWeight="bold" mb={2}>Razones:</Text>
                  <VStack align="start" spacing={1}>
                    {selectedSignal.reasons.map((reason, index) => (
                      <Text key={index} fontSize="sm">• {reason}</Text>
                    ))}
                  </VStack>
                </Box>
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Box>
                    <Text fontWeight="bold" mb={2}>Análisis Técnico:</Text>
                    <SimpleGrid columns={2} spacing={2}>
                      <Text fontSize="sm">RSI:</Text>
                      <Text fontSize="sm">
                        {selectedSignal.technicalAnalysis.indicators.rsi.toFixed(2)}
                      </Text>
                      
                      <Text fontSize="sm">MACD:</Text>
                      <Text fontSize="sm">
                        {selectedSignal.technicalAnalysis.indicators.macd.histogram.toFixed(4)}
                      </Text>
                      
                      <Text fontSize="sm">BB Superior:</Text>
                      <Text fontSize="sm">
                        {selectedSignal.technicalAnalysis.indicators.bollingerBands.upper.toFixed(2)}
                      </Text>
                      
                      <Text fontSize="sm">BB Inferior:</Text>
                      <Text fontSize="sm">
                        {selectedSignal.technicalAnalysis.indicators.bollingerBands.lower.toFixed(2)}
                      </Text>
                    </SimpleGrid>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold" mb={2}>Sentimiento:</Text>
                    <Badge colorScheme={
                      selectedSignal.marketSentiment.overallSentiment === 'positive' ? 'green' :
                      selectedSignal.marketSentiment.overallSentiment === 'negative' ? 'red' : 'gray'
                    }>
                      {selectedSignal.marketSentiment.overallSentiment === 'positive' ? 'Positivo' :
                       selectedSignal.marketSentiment.overallSentiment === 'negative' ? 'Negativo' : 'Neutral'}
                    </Badge>
                    
                    {selectedSignal.marketSentiment.relevantNews.length > 0 && (
                      <Box mt={2}>
                        <Text fontSize="sm" fontWeight="bold">Noticias Relevantes:</Text>
                        <Text fontSize="sm">{selectedSignal.marketSentiment.relevantNews[0].headline}</Text>
                      </Box>
                    )}
                  </Box>
                </SimpleGrid>
                
                <Button 
                  as={RouterLink} 
                  to="/alerts" 
                  colorScheme="blue" 
                  leftIcon={<BellIcon />}
                  size="sm"
                  width="100%"
                >
                  Crear alerta para {selectedSignal.symbol}
                </Button>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Grid>
  );
}; 