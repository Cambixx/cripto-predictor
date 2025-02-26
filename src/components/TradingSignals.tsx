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
import { generateTradingSignals, type TradingSignal, type TopSignals } from '../services/tradingSignals';

const SignalBadge: React.FC<{ signal: 'buy' | 'sell' | 'neutral' }> = ({ signal }) => {
  const getSignalColor = () => {
    switch (signal) {
      case 'buy':
        return 'green';
      case 'sell':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getSignalText = () => {
    switch (signal) {
      case 'buy':
        return 'COMPRAR';
      case 'sell':
        return 'VENDER';
      default:
        return 'NEUTRAL';
    }
  };

  return (
    <Badge 
      colorScheme={getSignalColor()} 
      fontSize="lg" 
      padding={2}
      borderRadius="md"
      boxShadow="md"
      textTransform="uppercase"
      letterSpacing="wider"
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
                  <StatHelpText color={signal.priceChange24h >= 0 ? "green.400" : "red.400"}>
                    <StatArrow type={signal.priceChange24h >= 0 ? 'increase' : 'decrease'} />
                    {Math.abs(signal.priceChange24h).toFixed(2)}%
                  </StatHelpText>
                </Stat>
              </StatGroup>
            </VStack>
            <Box mt={isMobile ? 2 : 0}>
              <SignalBadge signal={signal.signal} />
            </Box>
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
                      value={signal.technicalAnalysis.indicators.rsi} 
                      type={signal.technicalAnalysis.indicators.rsi > 70 ? 'negative' : signal.technicalAnalysis.indicators.rsi < 30 ? 'positive' : 'neutral'} 
                    />
                  </Box>
                  <Box width="100%">
                    <Text color={textColor} fontSize="sm">Stochastic K/D</Text>
                    <HStack>
                      <IndicatorValue 
                        value={signal.technicalAnalysis.indicators.stochastic.k} 
                        type={signal.technicalAnalysis.indicators.stochastic.k > 80 ? 'negative' : signal.technicalAnalysis.indicators.stochastic.k < 20 ? 'positive' : 'neutral'} 
                      />
                      <Text color={textColor}>/</Text>
                      <IndicatorValue 
                        value={signal.technicalAnalysis.indicators.stochastic.d} 
                        type={signal.technicalAnalysis.indicators.stochastic.d > 80 ? 'negative' : signal.technicalAnalysis.indicators.stochastic.d < 20 ? 'positive' : 'neutral'} 
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
                          value={signal.technicalAnalysis.indicators.ema.ema9} 
                          type={signal.technicalAnalysis.indicators.ema.ema9 > signal.price ? 'negative' : 'positive'} 
                        />
                      </HStack>
                      <HStack justify="space-between" width="100%">
                        <Text color={textColor} fontSize="xs">EMA21:</Text>
                        <IndicatorValue 
                          value={signal.technicalAnalysis.indicators.ema.ema21} 
                          type={signal.technicalAnalysis.indicators.ema.ema21 > signal.price ? 'negative' : 'positive'} 
                        />
                      </HStack>
                      <HStack justify="space-between" width="100%">
                        <Text color={textColor} fontSize="xs">EMA50:</Text>
                        <IndicatorValue 
                          value={signal.technicalAnalysis.indicators.ema.ema50} 
                          type={signal.technicalAnalysis.indicators.ema.ema50 > signal.price ? 'negative' : 'positive'} 
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

  if (loading || !signals) {
    return (
      <Box p={6} bg={bgColor} borderRadius="xl" boxShadow="xl">
        <VStack spacing={4} align="stretch">
          <Text fontSize="xl" fontWeight="bold" color="white">
            Analizando mercado...
          </Text>
          <Spinner size="xl" alignSelf="center" color="blue.400" thickness="4px" />
        </VStack>
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
                  signals.buySignals.map((signal) => (
                    <SignalCard key={signal.symbol} signal={signal} />
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
                  signals.sellSignals.map((signal) => (
                    <SignalCard key={signal.symbol} signal={signal} />
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