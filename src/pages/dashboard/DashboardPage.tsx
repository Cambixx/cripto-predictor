import React, { useState, useEffect, useCallback, useMemo } from 'react'
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
  useToast,
  ModalFooter,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Portal,
  Divider,
  Tooltip
} from '@chakra-ui/react'
import { BellIcon, InfoOutlineIcon, StarIcon, AddIcon, ExternalLinkIcon, SearchIcon, ChevronDownIcon, RepeatIcon, SmallAddIcon } from '@chakra-ui/icons'
import { Link as RouterLink } from 'react-router-dom'
import { CryptoChart } from '../../components/CryptoChart'
import { TradingSignals } from '../../components/TradingSignals'
import { TransactionsOverview } from '../../components/TransactionsOverview'
import { TradingStrategiesCard } from '../../components/TradingStrategiesCard'
import { AlertsManager } from '../../components/AlertsManager'
import { 
  generateTradingSignals, 
  type TradingSignal, 
  generateDashboardSignals, 
  type DashboardSignal, 
  type TopSignals, 
  SignalType, 
  ConfidenceLevel, 
  getDefaultTechnicalAnalysis,
  generateExampleSignal,
  type TradingPattern,
  generateTradingStrategy
} from '../../services/tradingSignals'
import { getActiveTradingPairs, getCoinData } from '../../services/api'
import { registerForPushNotifications, getUserAlerts, UserAlert } from '../../services/notificationService'
import { HotOpportunitiesPanel } from '../../components/HotOpportunitiesPanel'

// ID de usuario simulado
const MOCK_USER_ID = 'user123';

// Modal de detalles de señal
const SignalDetailsModal = ({ 
  isOpen, 
  onClose, 
  signal 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  signal: TradingSignal | null;
}) => {
  const bgColor = useColorModeValue('gray.800', 'gray.900');
  const borderColor = useColorModeValue('gray.700', 'gray.600');
  const toast = useToast();
  
  if (!signal) return null;
  
  // Formatear porcentaje con signo
  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };
  
  // Determinar el estado del indicador (positivo, neutral, negativo)
  const getIndicatorStatus = (name: string, value: number): 'positive' | 'negative' | 'neutral' => {
    switch (name) {
      case 'rsi':
        return value > 70 ? 'negative' : value < 30 ? 'positive' : 'neutral';
      case 'macd':
        return value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral';
      case 'adx':
        return value > 25 ? 'positive' : 'neutral';
      default:
        return 'neutral';
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent bg={bgColor} color="white">
        <ModalHeader>
          Análisis Detallado {signal.symbol}
          <Badge 
            ml={2} 
            colorScheme={signal.signal === 'buy' ? 'green' : 'red'}
          >
            {signal.signal === 'buy' ? 'COMPRA' : 'VENTA'}
          </Badge>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Resumen de precio */}
            <Box 
              p={4} 
              borderRadius="md" 
              bg="gray.700" 
              boxShadow="md"
            >
              <SimpleGrid columns={2} spacing={4}>
                <VStack align="flex-start">
                  <Text fontSize="sm" color="gray.400">Precio Actual</Text>
                  <Heading size="lg">${signal.price.toLocaleString()}</Heading>
                  <HStack>
                    <StatArrow 
                      type={signal.priceChange24h >= 0 ? 'increase' : 'decrease'} 
                    />
                    <Text 
                      fontWeight="bold" 
                      color={signal.priceChange24h >= 0 ? 'green.400' : 'red.400'}
                    >
                      {formatPercent(signal.priceChange24h)}
                    </Text>
                    <Text fontSize="sm" color="gray.400">24h</Text>
                  </HStack>
                </VStack>
                
                <VStack align="flex-start">
                  <Text fontSize="sm" color="gray.400">Confianza de la Señal</Text>
                  <Heading size="lg">{Math.round(signal.confidence * 100)}%</Heading>
                  <Text 
                    fontSize="sm" 
                    color={
                      signal.confidence > 0.8 ? 'green.400' : 
                      signal.confidence > 0.6 ? 'yellow.400' : 'red.400'
                    }
                  >
                    {signal.confidence > 0.8 ? 'ALTA' : 
                     signal.confidence > 0.6 ? 'MEDIA' : 'BAJA'}
                  </Text>
                </VStack>
              </SimpleGrid>
            </Box>
            
            {/* Indicadores Técnicos */}
            <Box>
              <Heading size="md" mb={4}>Indicadores Técnicos</Heading>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                {/* RSI */}
                <Box 
                  p={4} 
                  borderRadius="md" 
                  bg="gray.700"
                  borderLeftWidth="4px"
                  borderLeftColor={
                    signal.technicalAnalysis.indicators.rsi > 70 ? 'red.500' :
                    signal.technicalAnalysis.indicators.rsi < 30 ? 'green.500' : 'blue.500'
                  }
                >
                  <VStack align="stretch" spacing={1}>
                    <Flex justify="space-between">
                      <Text fontWeight="bold">RSI</Text>
                      <Text>{signal.technicalAnalysis.indicators.rsi.toFixed(2)}</Text>
                    </Flex>
                    <Text fontSize="xs" color="gray.400">
                      {signal.technicalAnalysis.indicators.rsi > 70 ? 'Sobrecomprado' :
                       signal.technicalAnalysis.indicators.rsi < 30 ? 'Sobrevendido' : 'Neutral'}
                    </Text>
                    {signal.technicalAnalysis.indicators.rsiDivergence.bullish && (
                      <Badge colorScheme="green" mt={1}>Divergencia Alcista</Badge>
                    )}
                    {signal.technicalAnalysis.indicators.rsiDivergence.bearish && (
                      <Badge colorScheme="red" mt={1}>Divergencia Bajista</Badge>
                    )}
                  </VStack>
                </Box>
                
                {/* MACD */}
                <Box 
                  p={4} 
                  borderRadius="md" 
                  bg="gray.700"
                  borderLeftWidth="4px"
                  borderLeftColor={
                    signal.technicalAnalysis.indicators.macd.histogram > 0 ? 'green.500' :
                    signal.technicalAnalysis.indicators.macd.histogram < 0 ? 'red.500' : 'blue.500'
                  }
                >
                  <VStack align="stretch" spacing={1}>
                    <Flex justify="space-between">
                      <Text fontWeight="bold">MACD</Text>
                      <Text>{signal.technicalAnalysis.indicators.macd.histogram.toFixed(2)}</Text>
                    </Flex>
                    <Text fontSize="xs" color="gray.400">
                      {signal.technicalAnalysis.indicators.macd.histogram > 0 ? 'Tendencia Alcista' :
                       signal.technicalAnalysis.indicators.macd.histogram < 0 ? 'Tendencia Bajista' : 'Neutral'}
                    </Text>
                  </VStack>
                </Box>
                
                {/* ADX */}
                <Box 
                  p={4} 
                  borderRadius="md" 
                  bg="gray.700"
                  borderLeftWidth="4px"
                  borderLeftColor={
                    signal.technicalAnalysis.indicators.adx > 25 ? 'green.500' : 'gray.500'
                  }
                >
                  <VStack align="stretch" spacing={1}>
                    <Flex justify="space-between">
                      <Text fontWeight="bold">ADX</Text>
                      <Text>{signal.technicalAnalysis.indicators.adx.toFixed(2)}</Text>
                    </Flex>
                    <Text fontSize="xs" color="gray.400">
                      {signal.technicalAnalysis.indicators.adx > 25 ? 'Tendencia Fuerte' : 'Tendencia Débil'}
                    </Text>
                  </VStack>
                </Box>
                
                {/* Bandas de Bollinger */}
                <Box 
                  p={4} 
                  borderRadius="md" 
                  bg="gray.700"
                >
                  <VStack align="stretch" spacing={1}>
                    <Text fontWeight="bold">Bandas Bollinger</Text>
                    <HStack justify="space-between">
                      <Text fontSize="xs" color="gray.400">Superior:</Text>
                      <Text fontSize="xs">${signal.technicalAnalysis.indicators.bollingerBands.upper.toFixed(2)}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="xs" color="gray.400">Media:</Text>
                      <Text fontSize="xs">${signal.technicalAnalysis.indicators.bollingerBands.middle.toFixed(2)}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="xs" color="gray.400">Inferior:</Text>
                      <Text fontSize="xs">${signal.technicalAnalysis.indicators.bollingerBands.lower.toFixed(2)}</Text>
                    </HStack>
                    <Text fontSize="xs" color="gray.400" mt={1}>
                      {signal.price > signal.technicalAnalysis.indicators.bollingerBands.upper ? 'Precio por encima de banda superior' :
                       signal.price < signal.technicalAnalysis.indicators.bollingerBands.lower ? 'Precio por debajo de banda inferior' : 'Precio dentro de las bandas'}
                    </Text>
                  </VStack>
                </Box>
                
                {/* EMAs */}
                <Box 
                  p={4} 
                  borderRadius="md" 
                  bg="gray.700"
                  borderLeftWidth="4px"
                  borderLeftColor={
                    signal.technicalAnalysis.indicators.ema && 
                    signal.technicalAnalysis.indicators.ema.ema50 !== undefined && 
                    signal.technicalAnalysis.indicators.ema.ema200 !== undefined ?
                      (signal.technicalAnalysis.indicators.ema.ema50 > signal.technicalAnalysis.indicators.ema.ema200 ? 'green.500' :
                       signal.technicalAnalysis.indicators.ema.ema50 < signal.technicalAnalysis.indicators.ema.ema200 ? 'red.500' : 'blue.500')
                    : 'blue.500'
                  }
                >
                  <VStack align="stretch" spacing={1}>
                    <Text fontWeight="bold">Medias Móviles</Text>
                    <HStack justify="space-between">
                      <Text fontSize="xs" color="gray.400">EMA 50:</Text>
                      <Text fontSize="xs">${signal.technicalAnalysis.indicators.ema?.ema50?.toFixed(2) || 'N/A'}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="xs" color="gray.400">EMA 200:</Text>
                      <Text fontSize="xs">${signal.technicalAnalysis.indicators.ema?.ema200?.toFixed(2) || 'N/A'}</Text>
                    </HStack>
                    {signal.technicalAnalysis.indicators.ema && 
                     signal.technicalAnalysis.indicators.ema.ema50 !== undefined && 
                     signal.technicalAnalysis.indicators.ema.ema200 !== undefined && (
                      <Text fontSize="xs" color="gray.400" mt={1}>
                        {signal.technicalAnalysis.indicators.ema.ema50 > signal.technicalAnalysis.indicators.ema.ema200 ? 'Tendencia alcista (Golden Cross)' :
                         signal.technicalAnalysis.indicators.ema.ema50 < signal.technicalAnalysis.indicators.ema.ema200 ? 'Tendencia bajista (Death Cross)' : 'Tendencia neutral'}
                      </Text>
                    )}
                  </VStack>
                </Box>
                
                {/* Ichimoku */}
                <Box 
                  p={4} 
                  borderRadius="md" 
                  bg="gray.700"
                >
                  <VStack align="stretch" spacing={1}>
                    <Text fontWeight="bold">Ichimoku Cloud</Text>
                    <HStack justify="space-between">
                      <Text fontSize="xs" color="gray.400">Tenkan-sen:</Text>
                      <Text fontSize="xs">${signal.technicalAnalysis.indicators.ichimokuCloud.tenkanSen.toFixed(2)}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="xs" color="gray.400">Kijun-sen:</Text>
                      <Text fontSize="xs">${signal.technicalAnalysis.indicators.ichimokuCloud.kijunSen.toFixed(2)}</Text>
                    </HStack>
                    <Text fontSize="xs" color="gray.400" mt={1}>
                      {signal.price > signal.technicalAnalysis.indicators.ichimokuCloud.senkouSpanA && 
                       signal.price > signal.technicalAnalysis.indicators.ichimokuCloud.senkouSpanB ? 'Tendencia alcista fuerte' :
                       signal.price < signal.technicalAnalysis.indicators.ichimokuCloud.senkouSpanA && 
                       signal.price < signal.technicalAnalysis.indicators.ichimokuCloud.senkouSpanB ? 'Tendencia bajista fuerte' : 'Tendencia mixta'}
                    </Text>
                  </VStack>
                </Box>
              </SimpleGrid>
            </Box>
            
            {/* Niveles de Soporte y Resistencia */}
            <Box>
              <Heading size="md" mb={4}>Niveles Clave</Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <Box p={4} borderRadius="md" bg="gray.700">
                  <VStack align="stretch" spacing={2}>
                    <Text fontWeight="bold" color="green.400">Niveles de Soporte</Text>
                    {signal.technicalAnalysis.supportLevels.map((level, index) => (
                      <Flex key={`support-${index}`} justify="space-between">
                        <Text fontSize="sm">S{index + 1}:</Text>
                        <Text fontSize="sm">${level.toFixed(2)}</Text>
                      </Flex>
                    ))}
                  </VStack>
                </Box>
                
                <Box p={4} borderRadius="md" bg="gray.700">
                  <VStack align="stretch" spacing={2}>
                    <Text fontWeight="bold" color="red.400">Niveles de Resistencia</Text>
                    {signal.technicalAnalysis.resistanceLevels.map((level, index) => (
                      <Flex key={`resistance-${index}`} justify="space-between">
                        <Text fontSize="sm">R{index + 1}:</Text>
                        <Text fontSize="sm">${level.toFixed(2)}</Text>
                      </Flex>
                    ))}
                  </VStack>
                </Box>
              </SimpleGrid>
            </Box>
            
            {/* Razones para la señal */}
            <Box>
              <Heading size="md" mb={4}>Razones</Heading>
              <Box p={4} borderRadius="md" bg="gray.700">
                <VStack align="stretch" spacing={2}>
                  {signal.reasons.map((reason, index) => (
                    <HStack key={`reason-${index}`} spacing={2}>
                      <Icon as={InfoOutlineIcon} color="blue.400" />
                      <Text>{reason}</Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            </Box>
            
            {/* Sentimiento del Mercado */}
            <Box>
              <Heading size="md" mb={4}>Sentimiento del Mercado</Heading>
              <Box p={4} borderRadius="md" bg="gray.700">
                <VStack align="stretch" spacing={4}>
                  <Flex justify="space-between">
                    <Text>Sentimiento General:</Text>
                    <Badge
                      colorScheme={
                        signal.marketSentiment.overallSentiment === 'positive' ? 'green' :
                        signal.marketSentiment.overallSentiment === 'negative' ? 'red' : 'gray'
                      }
                    >
                      {signal.marketSentiment.overallSentiment === 'positive' ? 'POSITIVO' :
                       signal.marketSentiment.overallSentiment === 'negative' ? 'NEGATIVO' : 'NEUTRAL'}
                    </Badge>
                  </Flex>
                  
                  <Flex justify="space-between">
                    <Text>Menciones en Redes Sociales:</Text>
                    <Text>{signal.marketSentiment.socialMediaMentions.toLocaleString()}</Text>
                  </Flex>
                  
                  <Flex justify="space-between">
                    <Text>Puntuación en Noticias:</Text>
                    <Text>{signal.marketSentiment.newsScore.toFixed(1)}/10</Text>
                  </Flex>
                  
                  {signal.marketSentiment.relevantNews.length > 0 && (
                    <VStack align="stretch" spacing={2} mt={2}>
                      <Text fontWeight="bold">Noticias Recientes:</Text>
                      {signal.marketSentiment.relevantNews.slice(0, 3).map((news, index) => (
                        <Box key={`news-${index}`} p={2} borderRadius="md" bg="gray.800">
                          <HStack justify="space-between">
                            <Text fontSize="sm">{news.headline}</Text>
                            <Badge
                              size="sm"
                              colorScheme={
                                news.sentiment === 'positive' ? 'green' :
                                news.sentiment === 'negative' ? 'red' : 'gray'
                              }
                            >
                              {news.sentiment.toUpperCase()}
                            </Badge>
                          </HStack>
                          <HStack mt={1} spacing={2}>
                            <Text fontSize="xs" color="gray.400">{news.source}</Text>
                            <Text fontSize="xs" color="gray.400">{news.date}</Text>
                          </HStack>
                        </Box>
                      ))}
                    </VStack>
                  )}
                </VStack>
              </Box>
            </Box>
          </VStack>
        </ModalBody>
        
        <ModalFooter>
          <Button 
            colorScheme={signal.signal === 'buy' ? 'green' : 'red'} 
            mr={3}
            onClick={() => {
              const alertConfig = {
                symbol: signal.symbol,
                signalType: signal.signal,
                confidenceThreshold: 0.7,
                enabled: true,
                notificationType: 'push',
              };
              
              // Aquí podrías implementar la lógica para guardar la alerta
              toast({
                title: 'Alerta Creada',
                description: `Se creará una alerta para ${signal.symbol}`,
                status: 'success',
                duration: 3000,
              });
              
              onClose();
            }}
          >
            Crear Alerta
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// Componente para selección de símbolo con búsqueda
const SymbolSelector = ({ 
  symbols, 
  activeSymbol, 
  onChange 
}: { 
  symbols: string[]; 
  activeSymbol: string; 
  onChange: (symbol: string) => void 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const bgColor = useColorModeValue('gray.800', 'gray.900');
  const hoverBgColor = useColorModeValue('gray.700', 'gray.800');
  const borderColor = useColorModeValue('gray.700', 'gray.600');
  
  // Filtrar los símbolos según el texto de búsqueda
  const filteredSymbols = useMemo(() => {
    if (!searchQuery.trim()) return symbols;
    
    const query = searchQuery.toLowerCase();
    return symbols.filter(symbol => 
      symbol.toLowerCase().includes(query)
    );
  }, [symbols, searchQuery]);
  
  // Función para seleccionar un símbolo
  const handleSelect = (symbol: string) => {
    onChange(symbol);
    setIsMenuOpen(false);
    setSearchQuery('');
  };
  
  return (
    <Box position="relative" width={{ base: "100%", sm: "200px" }}>
      <Menu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        closeOnSelect={false}
        placement="bottom-end"
      >
        <MenuButton
          as={Button}
          rightIcon={<ChevronDownIcon />}
          onClick={() => setIsMenuOpen(true)}
          width="100%"
          bg={bgColor}
          borderColor={borderColor}
          textAlign="left"
          fontSize="sm"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
        >
          {activeSymbol}
        </MenuButton>
        
        <Portal>
          <MenuList 
            maxH="300px" 
            overflowY="auto"
            bg={bgColor}
            borderColor={borderColor}
            width={{ base: "calc(100vw - 32px)", sm: "200px" }}
            maxWidth="300px"
            position="relative"
            zIndex={1000}
            sx={{
              '&::-webkit-scrollbar': {
                width: '4px',
              },
              '&::-webkit-scrollbar-track': {
                width: '6px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'gray',
                borderRadius: '24px',
              },
            }}
          >
            <Box px={3} pt={2} pb={3}>
              <InputGroup size="sm">
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Buscar símbolo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  variant="filled"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  bg="gray.700"
                  _focus={{ bg: "gray.600" }}
                  _hover={{ bg: "gray.600" }}
                />
              </InputGroup>
            </Box>
            
            <Divider />
            
            {filteredSymbols.length > 0 ? (
              filteredSymbols.map((symbol) => (
                <MenuItem 
                  key={symbol} 
                  onClick={() => handleSelect(symbol)}
                  bg={symbol === activeSymbol ? hoverBgColor : 'transparent'}
                  fontWeight={symbol === activeSymbol ? 'bold' : 'normal'}
                  _hover={{ bg: hoverBgColor }}
                >
                  {symbol}
                </MenuItem>
              ))
            ) : (
              <Box py={3} px={4} textAlign="center">
                <Text fontSize="sm" color="gray.400">No se encontraron resultados</Text>
              </Box>
            )}
          </MenuList>
        </Portal>
      </Menu>
    </Box>
  );
};

export const DashboardPage = () => {
  const bgColor = useColorModeValue('gray.800', 'gray.900');
  const borderColor = useColorModeValue('gray.700', 'gray.600');
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
  
  // Estado para las alertas del usuario
  const [userAlerts, setUserAlerts] = useState<UserAlert[]>([]);
  
  // Estado para el perfil de riesgo del usuario
  const [riskProfile, setRiskProfile] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');
  
  // Estado para patrones de trading recomendados
  const [tradingPatterns, setTradingPatterns] = useState<TradingPattern[]>([]);
  
  // Modal de detalles
  const {
    isOpen: isDetailsOpen,
    onOpen: onDetailsOpen,
    onClose: onDetailsClose
  } = useDisclosure();

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

  // Función para cargar las alertas del usuario
  const loadUserAlerts = useCallback(() => {
    try {
      const alerts = getUserAlerts(MOCK_USER_ID);
      setUserAlerts(alerts);
    } catch (error) {
      console.error("Error cargando alertas del usuario:", error);
      setUserAlerts([]);
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
        
        // Cargar las alertas del usuario
        loadUserAlerts();
        
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
  }, [toast, loadDashboardSignals, loadUserAlerts]);

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
      
      // Actualizar las alertas del usuario
      loadUserAlerts();
      
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

  // Cambiar activo seleccionado (versión actualizada para el nuevo selector)
  const handleSymbolChange = (symbol: string) => {
    setActiveSymbol(symbol);
    
    // Buscar señal correspondiente si existe
    const allSignals = [...(signals?.buySignals || []), ...(signals?.sellSignals || [])];
    const matchingSignal = allSignals.find(signal => signal.symbol === symbol);
    
    if (matchingSignal) {
      setSelectedSignal(matchingSignal);
    } else {
      setSelectedSignal(null);
    }
  };

  // Manejar visualización de detalles de señal
  const handleViewSignalDetails = (signal: TradingSignal) => {
    setSelectedSignal(signal);
    onDetailsOpen();
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

  // Filtrar señales según el perfil de riesgo
  const filteredBuySignals = useMemo(() => {
    // Mostrar estadísticas de debugging
    if (signals?.buySignals) {
      console.log(`Total señales de compra disponibles: ${signals.buySignals.length}`);
    }
    
    if (!signals?.buySignals || signals.buySignals.length === 0) {
      console.log("No hay señales de compra base disponibles");
      return [];
    }
    
    let filtered = [];
    
    switch (riskProfile) {
      case 'conservative':
        // Para perfil conservador, solo señales con alta confianza
        filtered = signals.buySignals.filter(
          signal => signal.confidence > 0.7 // Reducido de 0.8
          // Eliminada la condición restrictiva de bandas de Bollinger
        );
        break;
      case 'aggressive':
        // Para perfil agresivo, criterios más amplios
        filtered = signals.buySignals.filter(
          signal => signal.confidence > 0.5 || // Reducido de 0.6
          signal.technicalAnalysis.trend === 'up' || 
          signal.marketSentiment.overallSentiment === 'positive'
        );
        break;
      case 'moderate':
      default:
        // Para perfil moderado
        filtered = signals.buySignals.filter(
          signal => signal.confidence > 0.6 // Reducido de 0.7
        );
        break;
    }
    
    console.log(`Señales de compra filtradas (${riskProfile}): ${filtered.length}`);
    
    return filtered;
  }, [signals, riskProfile]);
  
  const filteredSellSignals = useMemo(() => {
    // Mostrar estadísticas de debugging
    if (signals?.sellSignals) {
      console.log(`Total señales de venta disponibles: ${signals.sellSignals.length}`);
    }
    
    if (!signals?.sellSignals || signals.sellSignals.length === 0) {
      console.log("No hay señales de venta base disponibles");
      return [];
    }
    
    let filtered = [];
    
    switch (riskProfile) {
      case 'conservative':
        // Para perfil conservador, vender ante primeras señales de caída
        filtered = signals.sellSignals.filter(
          signal => signal.confidence > 0.6 || // Reducido de 0.7
          signal.priceChange24h < -2 || // Menos restrictivo, era -3
          signal.technicalAnalysis.trend === 'down'
        );
        break;
      case 'aggressive':
        // Para perfil agresivo, mantener posiciones más tiempo
        filtered = signals.sellSignals.filter(
          signal => signal.confidence > 0.75 || // Reducido de 0.85
          (signal.confidence > 0.6 && signal.technicalAnalysis.trend === 'down') ||
          signal.marketSentiment.overallSentiment === 'negative'
        );
        break;
      case 'moderate':
      default:
        // Para perfil moderado
        filtered = signals.sellSignals.filter(
          signal => signal.confidence > 0.65 // Reducido de 0.75
        );
        break;
    }
    
    console.log(`Señales de venta filtradas (${riskProfile}): ${filtered.length}`);
    
    return filtered;
  }, [signals, riskProfile]);

  // Señales de respaldo para cuando no hay señales disponibles
  const defaultSignals = useMemo(() => {
    // Solo crear señales de respaldo si no hay señales filtradas
    if ((filteredBuySignals.length === 0 && filteredSellSignals.length === 0) && 
        availableSymbols.length > 0) {
      
      // Crear 3 señales de compra y 2 de venta por defecto
      console.log("Generando señales de respaldo para el dashboard");
      
      const defaultSymbols = availableSymbols.slice(0, 5);
      
      // Generar señales de compra
      const buySignals: TradingSignal[] = defaultSymbols.slice(0, 3).map((symbol, idx) => {
        // Crear señales de compra con diferentes niveles de confianza
        const confidence = 0.65 + (idx * 0.1); // 0.65, 0.75, 0.85
        const price = 1000 + (idx * 500);
        return generateExampleSignal(symbol, 'buy', price, confidence);
      });
      
      // Generar señales de venta
      const sellSignals: TradingSignal[] = defaultSymbols.slice(3, 5).map((symbol, idx) => {
        // Crear señales de venta con diferentes niveles de confianza
        const confidence = 0.7 + (idx * 0.1); // 0.7, 0.8
        const price = 2000 + (idx * 300);
        return generateExampleSignal(symbol, 'sell', price, confidence);
      });
      
      return { buySignals, sellSignals };
    }
    
    return null;
  }, [filteredBuySignals, filteredSellSignals, availableSymbols]);
  
  // Señales finales a mostrar (filtradas o respaldo)
  const displayBuySignals = useMemo(() => {
    return filteredBuySignals.length > 0 ? filteredBuySignals : defaultSignals?.buySignals || [];
  }, [filteredBuySignals, defaultSignals]);
  
  const displaySellSignals = useMemo(() => {
    return filteredSellSignals.length > 0 ? filteredSellSignals : defaultSignals?.sellSignals || [];
  }, [filteredSellSignals, defaultSignals]);
  
  // Manejar cambio de perfil de riesgo
  const handleRiskProfileChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const profile = event.target.value as 'conservative' | 'moderate' | 'aggressive';
    setRiskProfile(profile);
    
    // Guardar preferencia en localStorage
    localStorage.setItem('user_risk_profile', profile);
    
    toast({
      title: 'Perfil de riesgo actualizado',
      description: `Tus señales ahora están optimizadas para un perfil ${
        profile === 'conservative' ? 'conservador' :
        profile === 'aggressive' ? 'agresivo' : 'moderado'
      }`,
      status: 'success',
      duration: 3000,
    });
  };
  
  // Cargar perfil de riesgo guardado
  useEffect(() => {
    const savedProfile = localStorage.getItem('user_risk_profile') as 'conservative' | 'moderate' | 'aggressive' | null;
    if (savedProfile) {
      setRiskProfile(savedProfile);
    }
  }, []);

  // Generar estrategias de trading de ejemplo basadas en la señal seleccionada y perfil de riesgo
  const defaultTradingPatterns = useMemo(() => {
    if (!selectedSignal && !activeSymbol) return [];
    
    const symbol = selectedSignal?.symbol || activeSymbol;
    const price = selectedSignal?.price || 1000; // Precio por defecto si no hay señal
    
    console.log(`Generando patrones de trading de ejemplo para ${symbol}`);
    
    // Determinar tendencia de mercado basada en datos disponibles
    let marketCondition: { trend: 'up' | 'down' | 'sideways', volatility: 'high' | 'medium' | 'low' } = {
      trend: 'sideways',
      volatility: 'medium'
    };
    
    // Si hay una señal seleccionada, usar su análisis técnico para determinar tendencia
    if (selectedSignal?.technicalAnalysis) {
      marketCondition.trend = selectedSignal.technicalAnalysis.trend;
      
      // Calcular volatilidad basada en bandas de Bollinger
      const { upper, lower } = selectedSignal.technicalAnalysis.indicators.bollingerBands;
      const volatilityRatio = upper / lower;
      
      if (volatilityRatio > 1.15) {
        marketCondition.volatility = 'high';
      } else if (volatilityRatio > 1.05) {
        marketCondition.volatility = 'medium';
      } else {
        marketCondition.volatility = 'low';
      }
    }
    // Si no hay señal, intentar estimar tendencia por el perfil de riesgo
    else if (signals) {
      // Buscar señales del mismo símbolo
      const symbolSignals = [
        ...(signals.buySignals || []), 
        ...(signals.sellSignals || [])
      ].filter(s => s.symbol === symbol);
      
      if (symbolSignals.length > 0) {
        // Si hay señales, usar su análisis técnico
        const signal = symbolSignals[0];
        marketCondition.trend = signal.technicalAnalysis.trend;
        
        // Calcular volatilidad
        const { upper, lower } = signal.technicalAnalysis.indicators.bollingerBands;
        const volatilityRatio = upper / lower;
        
        if (volatilityRatio > 1.15) {
          marketCondition.volatility = 'high';
        } else if (volatilityRatio > 1.05) {
          marketCondition.volatility = 'medium';
        } else {
          marketCondition.volatility = 'low';
        }
      }
    }
    
    console.log(`Condición de mercado para ${symbol}: Tendencia ${marketCondition.trend}, Volatilidad ${marketCondition.volatility}`);
    
    // Tipo de patrón principal basado en señal, tendencia y perfil de riesgo
    let primaryPatternType: 'bullish' | 'bearish' | 'neutral';
    
    // Si hay una señal seleccionada, ajustar patrones según su tendencia y tipo
    if (selectedSignal) {
      if (selectedSignal.signal === 'buy') {
        // Para señales de compra
        primaryPatternType = 'bullish';
      } else {
        // Para señales de venta
        primaryPatternType = 'bearish';
      }
    } 
    // Si no hay señal, usar tendencia detectada y perfil de riesgo
    else {
      switch (riskProfile) {
        case 'conservative':
          // Perfil conservador - Preferir estrategias a favor de la tendencia o neutrales
          if (marketCondition.trend === 'up') {
            primaryPatternType = Math.random() > 0.3 ? 'bullish' : 'neutral';
          } else if (marketCondition.trend === 'down') {
            primaryPatternType = Math.random() > 0.3 ? 'bearish' : 'neutral';
          } else {
            primaryPatternType = 'neutral';
          }
          break;
          
        case 'aggressive':
          // Perfil agresivo - Más inclinado a patrones direccionales, incluso contra tendencia
          if (marketCondition.trend === 'up') {
            // En tendencia alcista, mayoría bullish pero también oportunidades bajistas
            primaryPatternType = Math.random() > 0.25 ? 'bullish' : 'bearish';
          } else if (marketCondition.trend === 'down') {
            // En tendencia bajista, mayoría bearish pero también oportunidades bullish
            primaryPatternType = Math.random() > 0.25 ? 'bearish' : 'bullish';
          } else {
            // En mercado lateral, preferir rupturas direccionales
            primaryPatternType = Math.random() > 0.5 ? 'bullish' : 'bearish';
          }
          break;
          
        default: // Perfil moderado
          // Moderado - Equilibrio, mayormente a favor de tendencia
          if (marketCondition.trend === 'up') {
            primaryPatternType = Math.random() > 0.2 ? 'bullish' : (Math.random() > 0.5 ? 'bearish' : 'neutral');
          } else if (marketCondition.trend === 'down') {
            primaryPatternType = Math.random() > 0.2 ? 'bearish' : (Math.random() > 0.5 ? 'bullish' : 'neutral');
          } else {
            // En mercado lateral, equilibrio
            const rand = Math.random();
            primaryPatternType = rand > 0.6 ? 'bullish' : rand > 0.3 ? 'bearish' : 'neutral';
          }
      }
    }
    
    // Generar patrones coherentes con la tendencia y el perfil de riesgo
    const patterns: TradingPattern[] = [];
    
    // Siempre añadir al menos un patrón del tipo primario, utilizando la información de mercado
    patterns.push(
      generateTradingStrategy(
        symbol, 
        primaryPatternType, 
        price,
        marketCondition
      )
    );
    
    // Posibilidad de añadir un segundo patrón complementario
    if (Math.random() > 0.4) {
      let secondaryType: 'bullish' | 'bearish' | 'neutral';
      
      // En perfil conservador, el segundo patrón suele ser neutral o confirmar el primario
      if (riskProfile === 'conservative') {
        secondaryType = Math.random() > 0.7 ? 'neutral' : primaryPatternType;
      } 
      // En perfil agresivo, el segundo patrón puede ser complementario o contrario
      else if (riskProfile === 'aggressive') {
        const oppositeType = primaryPatternType === 'bullish' ? 'bearish' : 
                         primaryPatternType === 'bearish' ? 'bullish' : 
                         Math.random() > 0.5 ? 'bullish' : 'bearish';
        
        secondaryType = Math.random() > 0.6 ? oppositeType : 'neutral';
      }
      // En perfil moderado, equilibrado
      else {
        const options: ('bullish' | 'bearish' | 'neutral')[] = ['bullish', 'bearish', 'neutral'];
        // Evitar repetir exactamente el mismo tipo
        const filteredOptions = options.filter(t => t !== primaryPatternType);
        secondaryType = filteredOptions[Math.floor(Math.random() * filteredOptions.length)];
      }
      
      // Generar patrón secundario con la misma información de mercado para coherencia
      patterns.push(
        generateTradingStrategy(
          symbol, 
          secondaryType, 
          price,
          marketCondition
        )
      );
    }
    
    // En perfil agresivo, mayor probabilidad de tercer patrón
    const thirdPatternProb = riskProfile === 'aggressive' ? 0.3 : 0.2;
    
    // Posibilidad de añadir un tercer patrón (menor probabilidad)
    if (Math.random() > (1 - thirdPatternProb)) {
      // El tercer patrón generalmente ofrece contexto adicional o alternativo
      const tertiaryOptions: ('bullish' | 'bearish' | 'neutral')[] = ['bullish', 'bearish', 'neutral'];
      // Filtrar para no duplicar el patrón primario
      const filteredOptions = tertiaryOptions.filter(t => t !== primaryPatternType);
      const tertiaryType = filteredOptions[Math.floor(Math.random() * filteredOptions.length)];
      
      patterns.push(
        generateTradingStrategy(
          symbol, 
          tertiaryType, 
          price,
          marketCondition
        )
      );
    }
    
    return patterns;
  }, [selectedSignal, activeSymbol, riskProfile, signals]);
  
  // Usar patrones reales o los de ejemplo
  const displayTradingPatterns = useMemo(() => {
    // Si hay patrones generados para la señal seleccionada, usarlos
    if (selectedSignal?.advancedPatterns && selectedSignal.advancedPatterns.length > 0) {
      return selectedSignal.advancedPatterns;
    }
    
    // Si no hay patrones reales pero tenemos patrones de ejemplo, usarlos
    if (defaultTradingPatterns.length > 0) {
      return defaultTradingPatterns;
    }
    
    // Caso improbable: no hay patrones de ningún tipo
    return [];
  }, [selectedSignal, defaultTradingPatterns]);

  return (
    <Box>
      <Grid
        templateColumns={{ base: '1fr', lg: 'repeat(3, 1fr)' }}
        templateRows={{ base: 'auto', lg: 'auto auto auto' }}
        gap={4}
        p={{ base: 2, md: 4 }}
      >
        {/* Header - Información general y controles */}
        <GridItem colSpan={{ base: 1, lg: 3 }}>
          <VStack spacing={4} align="stretch" width="100%">
            <Flex 
              direction={{ base: "column", md: "row" }}
              justify="space-between"
              align={{ base: "stretch", md: "center" }}
              gap={4}
              wrap="wrap"
            >
              <Heading size={{ base: "md", lg: "lg" }} color="white">Dashboard de Trading</Heading>
              
              <Flex 
                gap={3} 
                direction={{ base: "column", sm: "row" }}
                align={{ base: "stretch", sm: "center" }}
                justify="flex-end"
                width={{ base: "100%", md: "auto" }}
              >
                <HStack 
                  spacing={2} 
                  width={{ base: "100%", sm: "auto" }}
                  justify={{ base: "space-between", sm: "flex-end" }}
                >
                  <Text color="gray.400" fontSize="sm" whiteSpace="nowrap">Perfil de Riesgo:</Text>
                  <Select 
                    size="sm" 
                    width={{ base: "auto", sm: "140px" }}
                    value={riskProfile}
                    onChange={handleRiskProfileChange}
                  >
                    <option value="conservative">Conservador</option>
                    <option value="moderate">Moderado</option>
                    <option value="aggressive">Agresivo</option>
                  </Select>
                </HStack>
                
                <Tooltip label="Recargar datos">
                  <Button 
                    size="sm"
                    colorScheme="blue"
                    isLoading={refreshing}
                    onClick={handleRefresh}
                    leftIcon={<RepeatIcon />}
                    width={{ base: "100%", sm: "auto" }}
                  >
                    Actualizar
                  </Button>
                </Tooltip>
              </Flex>
            </Flex>
          </VStack>
        </GridItem>

        {/* Panel de Oportunidades en Tiempo Real */}
        <GridItem colSpan={{ base: 1, lg: 3 }} rowSpan={1}>
          <HotOpportunitiesPanel />
        </GridItem>

        {/* Panel izquierdo - Gráfico y estadísticas de mercado */}
        <GridItem colSpan={{ base: 1, md: 2, lg: 2 }} rowSpan={{ base: 1, lg: 2 }}>
          <VStack spacing={{ base: 3, md: 4, lg: 6 }} align="stretch">
            {/* Gráfico principal */}
            <Box 
              p={{ base: 3, md: 4, lg: 6 }}
              bg={bgColor} 
              borderRadius="xl" 
              borderWidth="1px" 
              borderColor={borderColor}
              boxShadow="xl"
              overflow="hidden"
            >
              <VStack spacing={3} align="stretch">
                <Flex 
                  justify="space-between" 
                  align="center" 
                  wrap="wrap"
                  gap={2}
                >
                  <Heading size="md" color="white">
                    {activeSymbol}
                  </Heading>
                  <SymbolSelector 
                    symbols={availableSymbols} 
                    activeSymbol={activeSymbol} 
                    onChange={handleSymbolChange}
                  />
                </Flex>
                
                <Skeleton isLoaded={!loading} height={loading ? "400px" : "auto"} minH="300px">
                  <CryptoChart symbol={activeSymbol} />
                </Skeleton>
              </VStack>
            </Box>
            
            {/* Estrategias de trading */}
            <Box>
              <Skeleton isLoaded={!loading} height={loading ? "200px" : "auto"}>
                {displayTradingPatterns.length > 0 ? (
                  <TradingStrategiesCard 
                    patterns={displayTradingPatterns} 
                    symbol={selectedSignal?.symbol || activeSymbol} 
                  />
                ) : (
                  <Box 
                    p={{ base: 3, md: 4, lg: 6 }}
                    bg={bgColor} 
                    borderRadius="xl" 
                    borderWidth="1px" 
                    borderColor={borderColor}
                    boxShadow="xl"
                  >
                    <VStack spacing={4} align="stretch">
                      <Heading size="md" color="white">Estrategias de Trading</Heading>
                      <Text color="gray.400">
                        Cargando estrategias para {activeSymbol}...
                        Por favor, espera un momento o selecciona otro activo.
                      </Text>
                    </VStack>
                  </Box>
                )}
              </Skeleton>
            </Box>
          </VStack>
        </GridItem>

        {/* Panel derecho - Señales y alertas */}
        <GridItem colSpan={{ base: 1, md: 1, lg: 1 }} rowSpan={{ base: 1, md: 2, lg: 2 }}>
          <VStack spacing={{ base: 3, md: 4, lg: 6 }} align="stretch" height="100%">
            {/* Resumen de señales */}
            <Box 
              p={{ base: 2, md: 4, lg: 6 }}
              bg={bgColor} 
              borderRadius="xl" 
              borderWidth="1px" 
              borderColor={borderColor}
              boxShadow="xl"
              height="100%"
              overflowX="hidden"
            >
              <Skeleton isLoaded={!loading} height={loading ? "400px" : "auto"}>
                <VStack spacing={4} align="stretch">
                  <Flex 
                    justify="space-between" 
                    align="center" 
                    direction={{ base: "column", sm: "row" }}
                    gap={2}
                  >
                    <Heading size="md" color="white">Señales</Heading>
                    <HStack justify={{ base: "center", sm: "flex-end" }} width={{ base: "100%", sm: "auto" }}>
                      <Button
                        size="xs"
                        variant="outline"
                        colorScheme="blue"
                        leftIcon={<SmallAddIcon />}
                        onClick={() => {
                          toast({
                            title: "Próximamente",
                            description: "La creación de señales personalizadas estará disponible próximamente",
                            status: "info",
                            duration: 7000,
                            isClosable: true,
                          });
                        }}
                      >
                        Crear
                      </Button>
                    </HStack>
                  </Flex>

                  <Box overflowX="auto" pb={2}>
                    <Tabs variant="soft-rounded" colorScheme="blue" size="sm" isLazy>
                      <TabList 
                        overflowX="auto" 
                        width="100%" 
                        flexWrap="nowrap"
                        sx={{
                          scrollbarWidth: 'none',
                          '::-webkit-scrollbar': {
                            display: 'none',
                          },
                          '& button': {
                            minWidth: 'auto',
                            px: 3,
                            whiteSpace: 'nowrap',
                          }
                        }}
                      >
                        <Tab>Compra ({filteredBuySignals.length})</Tab>
                        <Tab>Venta ({filteredSellSignals.length})</Tab>
                        <Tab>Destacados</Tab>
                      </TabList>
                      
                      <TabPanels mt={4}>
                        <TabPanel p={0}>
                          <VStack spacing={2} align="stretch" maxH={{ base: "250px", md: "300px" }} overflowY="auto">
                            {displayBuySignals && displayBuySignals.length > 0 ? (
                              displayBuySignals.map((signal: TradingSignal) => (
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
                                      colorScheme={signal.confidence > 0.8 ? "green" : "yellow"}
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
                          <VStack spacing={2} align="stretch" maxH={{ base: "250px", md: "300px" }} overflowY="auto">
                            {displaySellSignals && displaySellSignals.length > 0 ? (
                              displaySellSignals.map((signal: TradingSignal) => (
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
                          <VStack spacing={2} align="stretch" maxH={{ base: "250px", md: "300px" }} overflowY="auto">
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
                  </Box>
    </VStack>
              </Skeleton>
            </Box>
            
            {/* Resumen de alertas */}
            <Box 
              p={{ base: 2, md: 4, lg: 6 }}
              bg={bgColor} 
              borderRadius="xl" 
              borderWidth="1px" 
              borderColor={borderColor}
              boxShadow="xl"
              overflowX="hidden"
            >
              <VStack spacing={4} align="stretch">
                <Flex 
                  justify="space-between" 
                  align="center"
                  direction={{ base: "column", sm: "row" }}
                  gap={2}
                >
                  <Heading size="md" color="white">Mis Alertas</Heading>
                  <Button 
                    as={RouterLink} 
                    to="/alerts" 
                    size="xs" 
                    colorScheme="blue"
                    leftIcon={<AddIcon />}
                    width={{ base: "100%", sm: "auto" }}
                  >
                    Configurar
                  </Button>
                </Flex>
                
                <Box maxH="300px" overflowY="auto">
                  {userAlerts.length > 0 ? (
                    <SimpleGrid columns={1} spacing={3}>
                      {/* Mostrar solo alertas activas */}
                      {userAlerts
                        .filter(alert => alert.enabled)
                        .slice(0, 3) // Mostrar máximo 3 alertas en el dashboard
                        .map(alert => (
                          <Box key={alert.id} p={4} bg="gray.700" borderRadius="md">
                            <HStack justify="space-between">
                              <HStack>
                                <Badge colorScheme="green">Activa</Badge>
                                <Text fontWeight="bold">{alert.symbol}</Text>
                              </HStack>
                              <Badge colorScheme={alert.signalType === 'buy' ? 'blue' : alert.signalType === 'sell' ? 'red' : 'purple'}>
                                {alert.signalType === 'buy' ? 'Compra' : alert.signalType === 'sell' ? 'Venta' : 'Ambos'}
                              </Badge>
                            </HStack>
                            <Text fontSize="sm" color="gray.300" mt={1}>
                              {alert.priceTarget && alert.priceTargetType 
                                ? `Alerta cuando precio ${alert.priceTargetType === 'above' ? '>' : '<'} $${alert.priceTarget.toLocaleString()}`
                                : `Alerta cuando confianza > ${alert.confidenceThreshold ? (alert.confidenceThreshold * 100).toFixed(0) : '70'}%`
                              }
                            </Text>
                          </Box>
                        ))
                      }
                      
                      {userAlerts.length > 3 && (
                        <Text fontSize="sm" color="gray.400" textAlign="center">
                          + {userAlerts.length - 3} alertas más
                        </Text>
                      )}
                      
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
                  ) : (
                    <VStack spacing={4} py={6} align="center">
                      <Text color="gray.400">No has creado ninguna alerta todavía</Text>
                      <Button 
                        as={RouterLink}
                        to="/alerts"
                        leftIcon={<AddIcon />}
                        colorScheme="blue"
                        size="sm"
                      >
                        Crear primera alerta
                      </Button>
                    </VStack>
                  )}
                </Box>
              </VStack>
            </Box>
          </VStack>
        </GridItem>

        {/* Panel inferior - Transacciones y estadísticas */}
        <GridItem colSpan={{ base: 1, md: 2, lg: 3 }}>
          <Box 
            p={{ base: 3, md: 4, lg: 6 }}
            bg={bgColor} 
            borderRadius="xl" 
            borderWidth="1px" 
            borderColor={borderColor}
            boxShadow="xl"
          >
            <Skeleton isLoaded={!loading} height={loading ? "200px" : "auto"}>
              <VStack spacing={4} align="stretch">
                <Heading size="md" color="white">Resumen del Mercado</Heading>
                <SimpleGrid columns={{ base: 1, sm: 2, md: 2, lg: 4 }} spacing={4}>
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
                      <HStack spacing={1} flexWrap="wrap">
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
        <SignalDetailsModal 
          isOpen={isDetailsOpen} 
          onClose={onDetailsClose} 
          signal={selectedSignal}
        />
      </Grid>
    </Box>
  );
}; 