import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Progress,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Table,
  Tbody,
  Tr,
  Th,
  Td,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup,
  Grid,
  GridItem,
  Divider,
  useBreakpointValue,
  SimpleGrid,
} from '@chakra-ui/react';
import { generateTradingSignals, type TradingSignal, type TopSignals, generateDashboardSignals, type DashboardSignal, SignalType } from '../services/tradingSignals';

const SignalBadge: React.FC<{ signal: 'buy' | 'sell' | 'neutral' | SignalType }> = ({ signal }) => {
  const getSignalColor = () => {
    switch (signal) {
      case 'buy':
      case SignalType.BUY:
      case SignalType.STRONG_BUY:
        return 'green';
      case 'sell':
      case SignalType.SELL:
      case SignalType.STRONG_SELL:
        return 'red';
      case SignalType.HOLD:
      default:
        return 'gray';
    }
  };

  const getSignalText = () => {
    switch (signal) {
      case 'buy':
      case SignalType.BUY:
        return 'COMPRAR';
      case SignalType.STRONG_BUY:
        return 'COMPRAR FUERTE';
      case 'sell':
      case SignalType.SELL:
        return 'VENDER';
      case SignalType.STRONG_SELL:
        return 'VENDER FUERTE';
      case SignalType.HOLD:
      default:
        return 'MANTENER';
    }
  };

  return (
    <Badge
      colorScheme={getSignalColor()}
      variant="solid"
      px={3}
      py={1}
      borderRadius="md"
      fontSize="xs"
      fontWeight="bold"
    >
      {getSignalText()}
    </Badge>
  );
};

const IndicatorValue: React.FC<{ value: number; type: 'positive' | 'negative' | 'neutral' }> = ({ value, type }) => {
  const color = type === 'positive' ? 'green.400' : type === 'negative' ? 'red.400' : 'gray.400';
  return (
    <Text color={color} fontWeight="semibold">
      {value.toFixed(2)}
    </Text>
  );
};

const SignalCard: React.FC<{ signal: TradingSignal }> = ({ signal }) => {
  const bgColor = useColorModeValue('gray.800', 'gray.900');
  const borderColor = useColorModeValue('gray.700', 'gray.600');
  const textColor = useColorModeValue('gray.300', 'gray.200');
  const cardHoverBg = useColorModeValue('gray.700', 'gray.800');
  
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Asegurarnos de que todos los objetos y propiedades existen
  const indicators = signal?.technicalAnalysis?.indicators || {};
  const stochastic = indicators.stochastic || { k: 0, d: 0 };
  
  // Definir valores por defecto para los EMAs
  const ema50 = indicators.ema?.ema50 || 0;
  const ema200 = indicators.ema?.ema200 || 0;
  
  // Para EMAs personalizados que no están en la interfaz, usar valores predeterminados
  const ema9 = 0;
  const ema21 = 0;
  
  return (
    <Box 
      p={isMobile ? 4 : 6} 
      bg={bgColor} 
      borderRadius="xl" 
      borderWidth={1} 
      borderColor={borderColor}
      transition="all 0.3s"
      _hover={{ bg: cardHoverBg, transform: 'translateY(-2px)', boxShadow: 'xl' }}
      width="100%"
    >
      <VStack spacing={isMobile ? 4 : 6} align="stretch">
        <VStack spacing={2} align="stretch">
          <HStack justify="space-between" wrap={isMobile ? "wrap" : "nowrap"}>
            <VStack align="start" spacing={1} flex={1}>
              <Text fontSize={isMobile ? "xl" : "2xl"} fontWeight="bold" color="white">
                {signal.symbol}
              </Text>
              <StatGroup>
                <Stat>
                  <StatNumber fontSize={isMobile ? "lg" : "xl"} color="white">
                    ${signal.price.toLocaleString()}
                  </StatNumber>
                  <StatHelpText>
                    <StatArrow type={signal.priceChange24h >= 0 ? "increase" : "decrease"} />
                    {Math.abs(signal.priceChange24h).toFixed(2)}%
                  </StatHelpText>
                </Stat>
              </StatGroup>
            </VStack>
            <SignalBadge signal={signal.signal} />
          </HStack>
        </VStack>

        <Box>
          <Text fontSize="sm" mb={2} color={textColor}>
            Nivel de confianza
          </Text>
          <Progress
            value={signal.confidence * 100}
            colorScheme={signal.signal === 'buy' ? 'green' : 'red'}
            height="8px"
            borderRadius="full"
            bg="gray.700"
          />
          <Text fontSize="xs" color={textColor} mt={1} textAlign="right">
            {(signal.confidence * 100).toFixed(1)}%
          </Text>
        </Box>

        <Accordion allowMultiple>
          <AccordionItem border="none">
            <AccordionButton px={0} py={2}>
              <Box flex="1" textAlign="left">
                <Text fontSize="sm" fontWeight="medium" color={textColor}>
                  Razones ({signal.reasons.length})
                </Text>
              </Box>
              <AccordionIcon color={textColor} />
            </AccordionButton>
            <AccordionPanel pb={4} px={2}>
              <VStack align="start" spacing={2}>
                {signal.reasons.map((reason, index) => (
                  <Text key={index} fontSize="sm" color={textColor}>• {reason}</Text>
                ))}
              </VStack>
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem border="none">
            <AccordionButton px={0} py={2}>
              <Box flex="1" textAlign="left">
                <Text fontSize="sm" fontWeight="medium" color={textColor}>
                  Análisis Técnico
                </Text>
              </Box>
              <AccordionIcon color={textColor} />
            </AccordionButton>
            <AccordionPanel pb={4} px={2}>
              <SimpleGrid columns={isMobile ? 1 : 2} spacing={4}>
                <VStack align="start" spacing={3}>
                  <Box width="100%">
                    <Text color={textColor} fontSize="sm">RSI</Text>
                    <IndicatorValue 
                      value={indicators.rsi} 
                      type={indicators.rsi > 70 ? 'negative' : indicators.rsi < 30 ? 'positive' : 'neutral'} 
                    />
                  </Box>
                  <Box width="100%">
                    <Text color={textColor} fontSize="sm">Stochastic K/D</Text>
                    <HStack>
                      <IndicatorValue 
                        value={stochastic.k} 
                        type={stochastic.k > 80 ? 'negative' : stochastic.k < 20 ? 'positive' : 'neutral'} 
                      />
                      <Text color={textColor}>/</Text>
                      <IndicatorValue 
                        value={stochastic.d} 
                        type={stochastic.d > 80 ? 'negative' : stochastic.d < 20 ? 'positive' : 'neutral'} 
                      />
                    </HStack>
                  </Box>
                </VStack>
                <VStack align="start" spacing={3}>
                  <Box width="100%">
                    <Text color={textColor} fontSize="sm">EMAs</Text>
                    <VStack align="start" spacing={1}>
                      <HStack justify="space-between" width="100%">
                        <Text color={textColor} fontSize="xs">EMA9:</Text>
                        <IndicatorValue 
                          value={ema9} 
                          type={ema9 > signal.price ? 'negative' : 'positive'} 
                        />
                      </HStack>
                      <HStack justify="space-between" width="100%">
                        <Text color={textColor} fontSize="xs">EMA21:</Text>
                        <IndicatorValue 
                          value={ema21} 
                          type={ema21 > signal.price ? 'negative' : 'positive'} 
                        />
                      </HStack>
                      <HStack justify="space-between" width="100%">
                        <Text color={textColor} fontSize="xs">EMA50:</Text>
                        <IndicatorValue 
                          value={ema50} 
                          type={ema50 > signal.price ? 'negative' : 'positive'} 
                        />
                      </HStack>
                      <HStack justify="space-between" width="100%">
                        <Text color={textColor} fontSize="xs">EMA200:</Text>
                        <IndicatorValue 
                          value={ema200} 
                          type={ema200 > signal.price ? 'negative' : 'positive'} 
                        />
                      </HStack>
                    </VStack>
                  </Box>
                </VStack>
              </SimpleGrid>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </VStack>
    </Box>
  );
};

export const TradingSignals = () => {
  const [signals, setSignals] = useState<TopSignals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bgColor = useColorModeValue('gray.800', 'gray.900');
  const isMobile = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        setLoading(true);
        setError(null);
        const newSignals = await generateTradingSignals('DAY');
        
        // Verificar que newSignals tiene la estructura esperada
        if (!newSignals || !newSignals.buySignals || !newSignals.sellSignals) {
          console.error('Estructura de señales incorrecta:', newSignals);
          setError('Formato de datos incorrecto en las señales de trading');
          return;
        }
        
        setSignals(newSignals);
      } catch (error) {
        console.error('Error fetching signals:', error);
        setError('Error al obtener las señales de trading');
      } finally {
        setLoading(false);
      }
    };

    fetchSignals();
    const interval = setInterval(fetchSignals, 60000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <Alert status="error" variant="solid">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color="blue.500" />
        <Text mt={4} color="gray.400">Cargando señales de trading...</Text>
      </Box>
    );
  }

  if (!signals || (!signals.buySignals.length && !signals.sellSignals.length)) {
    return (
      <Box 
        p={6} 
        bg={bgColor} 
        borderRadius="xl" 
        textAlign="center"
      >
        <Text color="gray.400">No se encontraron señales de trading activas.</Text>
      </Box>
    );
  }

  return (
    <Box p={6} bg={bgColor} borderRadius="xl" boxShadow="xl">
      <VStack spacing={6} align="stretch">
        <Text fontSize="2xl" fontWeight="bold" color="white">
          Señales de Trading
        </Text>

        <Tabs variant="soft-rounded" colorScheme="blue">
          <TabList>
            <Tab color="white" _selected={{ color: 'white', bg: 'green.500' }}>
              Señales de Compra ({signals.buySignals.length})
            </Tab>
            <Tab color="white" _selected={{ color: 'white', bg: 'red.500' }}>
              Señales de Venta ({signals.sellSignals.length})
            </Tab>
          </TabList>

          <TabPanels mt={4}>
            <TabPanel px={0}>
              <VStack spacing={4} align="stretch">
                {signals.buySignals.length > 0 ? (
                  signals.buySignals.map((signal, index) => (
                    <SignalCard key={`buy-${signal.symbol}-${index}`} signal={signal} />
                  ))
                ) : (
                  <Alert status="info" variant="solid">
                    <AlertIcon />
                    No hay señales de compra en este momento
                  </Alert>
                )}
              </VStack>
            </TabPanel>
            <TabPanel px={0}>
              <VStack spacing={4} align="stretch">
                {signals.sellSignals.length > 0 ? (
                  signals.sellSignals.map((signal, index) => (
                    <SignalCard key={`sell-${signal.symbol}-${index}`} signal={signal} />
                  ))
                ) : (
                  <Alert status="info" variant="solid">
                    <AlertIcon />
                    No hay señales de venta en este momento
                  </Alert>
                )}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  );
}; 