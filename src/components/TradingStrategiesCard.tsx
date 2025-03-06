import React, { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  HStack,
  Flex,
  Badge,
  Icon,
  useColorModeValue,
  Tooltip,
  Divider,
  Button,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  IconButton,
  Collapse,
  Tag,
  TagLabel,
  TagLeftIcon,
  Grid,
  GridItem
} from '@chakra-ui/react';
import { 
  InfoOutlineIcon, 
  ChevronRightIcon, 
  StarIcon, 
  ChevronDownIcon, 
  ChevronUpIcon, 
  CheckIcon, 
  WarningIcon,
  TimeIcon
} from '@chakra-ui/icons';
import { 
  FiArrowUpRight, 
  FiArrowDownRight, 
  FiActivity, 
  FiTrendingUp, 
  FiTrendingDown, 
  FiTarget, 
  FiAlertCircle,
  FiBarChart2,
  FiPieChart,
  FiDollarSign,
  FiShield,
  FiClock,
  FiPercent
} from 'react-icons/fi';

// Tipos para los patrones
interface TradingPattern {
  name: string;
  type: 'bullish' | 'bearish' | 'neutral';
  confidence: number; // 0-1
  description: string;
  action: string;
  timeframe: string;
  targets?: {
    entry: number;
    takeProfit: number;
    stopLoss: number;
  };
}

interface TradingStrategiesCardProps {
  patterns: TradingPattern[];
  symbol: string;
}

// Función auxiliar para calcular el ratio riesgo/beneficio
const calculateRiskRewardRatio = (entry: number, takeProfit: number, stopLoss: number): { ratio: number, riskPercent: number, rewardPercent: number } => {
  const risk = Math.abs(entry - stopLoss);
  const reward = Math.abs(takeProfit - entry);
  const ratio = reward / risk;
  const riskPercent = (Math.abs(entry - stopLoss) / entry) * 100;
  const rewardPercent = (Math.abs(takeProfit - entry) / entry) * 100;
  
  return { ratio, riskPercent, rewardPercent };
};

// Función para calcular la probabilidad de éxito basada en la confianza y tipo de patrón
const calculateSuccessProbability = (pattern: TradingPattern, marketTrend: string): number => {
  let baseProbability = pattern.confidence;
  
  // Ajustar por alineación con tendencia de mercado (factor adicional)
  if ((pattern.type === 'bullish' && marketTrend === 'up') || 
      (pattern.type === 'bearish' && marketTrend === 'down')) {
    // Si el patrón está alineado con la tendencia del mercado
    baseProbability = Math.min(baseProbability * 1.15, 0.95);
  } else if ((pattern.type === 'bullish' && marketTrend === 'down') || 
             (pattern.type === 'bearish' && marketTrend === 'up')) {
    // Si el patrón va contra la tendencia del mercado
    baseProbability = baseProbability * 0.85;
  }
  
  return baseProbability;
};

// Componente para trading pattern individual
const PatternCard = ({ pattern, symbol, marketTrend }: { pattern: TradingPattern, symbol: string, marketTrend: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const expandBgColor = useColorModeValue('gray.100', 'gray.600');
  
  // Calcular ratio riesgo/beneficio si hay targets
  const riskReward = pattern.targets ? 
    calculateRiskRewardRatio(
      pattern.targets.entry, 
      pattern.targets.takeProfit, 
      pattern.targets.stopLoss
    ) : null;
  
  // Calcular probabilidad de éxito (ajustada por tendencia de mercado)
  const successProbability = calculateSuccessProbability(pattern, marketTrend);
  
  // Calcular expectativa (expected return)
  const expectedReturn = riskReward ? 
    (successProbability * riskReward.rewardPercent) - ((1 - successProbability) * riskReward.riskPercent) : 
    null;
  
  // Determinar si la estrategia tiene una expectativa positiva
  const isPositiveExpectation = expectedReturn !== null && expectedReturn > 0;
  
  return (
    <Box 
      p={4}
      borderRadius="md"
      borderWidth="1px"
      borderColor={borderColor}
      bg={bgColor}
      _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
      transition="all 0.2s"
    >
      <VStack spacing={3} align="stretch">
        <Flex justify="space-between" align="center">
          <HStack>
            <Icon 
              as={
                pattern.type === 'bullish' ? FiTrendingUp : 
                pattern.type === 'bearish' ? FiTrendingDown : FiActivity
              } 
              color={
                pattern.type === 'bullish' ? 'green.500' : 
                pattern.type === 'bearish' ? 'red.500' : 'orange.500'
              }
              fontSize="xl"
            />
            <VStack align="start" spacing={0}>
              <Heading size="sm">{pattern.name}</Heading>
              <Text fontSize="xs" color={textColor}>{pattern.timeframe}</Text>
            </VStack>
          </HStack>
          <Badge
            colorScheme={
              pattern.type === 'bullish' ? 'green' : 
              pattern.type === 'bearish' ? 'red' : 'orange'
            }
            display="flex"
            alignItems="center"
          >
            {pattern.type === 'bullish' ? 'Alcista' : 
             pattern.type === 'bearish' ? 'Bajista' : 'Neutral'}
          </Badge>
        </Flex>
        
        <Text fontSize="sm" color={textColor}>{pattern.description}</Text>
        
        {pattern.targets && (
          <Grid templateColumns="repeat(3, 1fr)" gap={2} mt={1}>
            <GridItem>
              <VStack align="start" spacing={0}>
                <HStack>
                  <Icon as={FiBarChart2} color="gray.500" boxSize="3" />
                  <Text fontSize="xs" color={textColor}>Entrada</Text>
                </HStack>
                <Text fontSize="sm" fontWeight="bold">${pattern.targets.entry.toLocaleString()}</Text>
              </VStack>
            </GridItem>
            <GridItem>
              <VStack align="start" spacing={0}>
                <HStack>
                  <Icon as={FiTarget} color="green.500" boxSize="3" />
                  <Text fontSize="xs" color="green.500">Objetivo</Text>
                </HStack>
                <Text fontSize="sm" fontWeight="bold" color="green.500">${pattern.targets.takeProfit.toLocaleString()}</Text>
              </VStack>
            </GridItem>
            <GridItem>
              <VStack align="start" spacing={0}>
                <HStack>
                  <Icon as={FiAlertCircle} color="red.500" boxSize="3" />
                  <Text fontSize="xs" color="red.500">Stop Loss</Text>
                </HStack>
                <Text fontSize="sm" fontWeight="bold" color="red.500">${pattern.targets.stopLoss.toLocaleString()}</Text>
              </VStack>
            </GridItem>
          </Grid>
        )}
        
        {/* Indicador visual de confianza */}
        <Box>
          <HStack justify="space-between" mb={1}>
            <Text fontSize="xs" color={textColor}>Confianza</Text>
            <Text fontSize="xs" fontWeight="bold">{Math.round(pattern.confidence * 100)}%</Text>
          </HStack>
          <Progress 
            value={pattern.confidence * 100} 
            size="xs" 
            colorScheme={
              pattern.confidence > 0.8 ? "green" : 
              pattern.confidence > 0.6 ? "blue" : 
              pattern.confidence > 0.4 ? "yellow" : "red"
            }
            borderRadius="full"
          />
        </Box>
        
        {/* Etiquetas de análisis */}
        {riskReward && (
          <HStack wrap="wrap" spacing={2} mt={1}>
            <Tag size="sm" colorScheme={riskReward.ratio >= 2 ? "green" : riskReward.ratio >= 1 ? "yellow" : "red"}>
              <TagLeftIcon as={FiPieChart} />
              <TagLabel>R/R {riskReward.ratio.toFixed(1)}</TagLabel>
            </Tag>
            <Tag size="sm" colorScheme={isPositiveExpectation ? "green" : "red"}>
              <TagLeftIcon as={FiDollarSign} />
              <TagLabel>Exp. {expectedReturn !== null ? expectedReturn.toFixed(1) + "%" : "N/A"}</TagLabel>
            </Tag>
            <Tag size="sm" colorScheme={
              (pattern.type === 'bullish' && marketTrend === 'up') || 
              (pattern.type === 'bearish' && marketTrend === 'down') ? 
              "green" : 
              marketTrend === 'sideways' ? "yellow" : "red"
            }>
              <TagLeftIcon as={TimeIcon} />
              <TagLabel>{pattern.timeframe}</TagLabel>
            </Tag>
          </HStack>
        )}
        
        {/* Panel de acción recomendada */}
        <Box
          p={3}
          bg={
            pattern.type === 'bullish' ? 'green.50' : 
            pattern.type === 'bearish' ? 'red.50' : 'orange.50'
          }
          color={
            pattern.type === 'bullish' ? 'green.700' : 
            pattern.type === 'bearish' ? 'red.700' : 'orange.700'
          }
          borderRadius="md"
          display="flex"
          alignItems="center"
          fontSize="sm"
          fontWeight="medium"
        >
          <Icon
            as={
              pattern.type === 'bullish' ? FiArrowUpRight : 
              pattern.type === 'bearish' ? FiArrowDownRight : InfoOutlineIcon
            }
            mr={2}
          />
          {pattern.action}
        </Box>
        
        {/* Botón para expandir detalles adicionales */}
        <Button 
          size="xs" 
          variant="ghost" 
          rightIcon={isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
          onClick={() => setIsExpanded(!isExpanded)}
          alignSelf="center"
          mt={1}
        >
          {isExpanded ? "Menos detalles" : "Más detalles"}
        </Button>
        
        {/* Contenido expandido */}
        <Collapse in={isExpanded} animateOpacity>
          <VStack 
            spacing={3} 
            align="stretch" 
            mt={2} 
            p={3} 
            bg={expandBgColor} 
            borderRadius="md"
          >
            {/* Análisis de probabilidad */}
            <Box>
              <Heading size="xs" mb={2}>Análisis de Probabilidad</Heading>
              <SimpleGrid columns={2} spacing={4}>
                <Stat size="sm">
                  <StatLabel fontSize="xs">Prob. de Éxito</StatLabel>
                  <StatNumber fontSize="md">{Math.round(successProbability * 100)}%</StatNumber>
                  <StatHelpText fontSize="xs">
                    Basado en confianza y contexto
                  </StatHelpText>
                </Stat>
                
                {expectedReturn !== null && (
                  <Stat size="sm">
                    <StatLabel fontSize="xs">Expectativa</StatLabel>
                    <StatNumber fontSize="md" color={expectedReturn > 0 ? "green.500" : "red.500"}>
                      {expectedReturn > 0 ? "+" : ""}{expectedReturn.toFixed(1)}%
                    </StatNumber>
                    <StatHelpText fontSize="xs">
                      <StatArrow type={expectedReturn > 0 ? "increase" : "decrease"} />
                      Retorno esperado
                    </StatHelpText>
                  </Stat>
                )}
              </SimpleGrid>
            </Box>
            
            {riskReward && (
              <Box>
                <Heading size="xs" mb={2}>Análisis de Riesgo</Heading>
                <SimpleGrid columns={2} spacing={4}>
                  <VStack align="start" spacing={1}>
                    <HStack>
                      <Icon as={FiShield} color="red.500" />
                      <Text fontSize="xs">Riesgo</Text>
                    </HStack>
                    <Text fontWeight="bold" fontSize="md">{riskReward.riskPercent.toFixed(1)}%</Text>
                  </VStack>
                  <VStack align="start" spacing={1}>
                    <HStack>
                      <Icon as={FiTarget} color="green.500" />
                      <Text fontSize="xs">Potencial</Text>
                    </HStack>
                    <Text fontWeight="bold" fontSize="md">{riskReward.rewardPercent.toFixed(1)}%</Text>
                  </VStack>
                </SimpleGrid>
              </Box>
            )}
            
            {/* Escenarios alternativos */}
            <Box>
              <Heading size="xs" mb={2}>Escenarios Alternativos</Heading>
              <VStack align="start" spacing={2}>
                <HStack>
                  <Icon as={CheckIcon} color="green.500" />
                  <Text fontSize="xs">
                    <strong>Mejor escenario:</strong> {pattern.type === 'bullish' ? 
                      `Ruptura fuerte con volumen hacia ${pattern.targets?.takeProfit.toLocaleString() || 'objetivo'}` : 
                      `Corrección a ${pattern.targets?.takeProfit.toLocaleString() || 'soporte'} para compras óptimas`}
                  </Text>
                </HStack>
                <HStack>
                  <Icon as={WarningIcon} color="orange.500" />
                  <Text fontSize="xs">
                    <strong>Escenario neutral:</strong> {pattern.type === 'neutral' ? 
                      `Continuación de rango entre ${pattern.targets?.stopLoss.toLocaleString()} y ${pattern.targets?.takeProfit.toLocaleString()}` : 
                      `Movimiento lateral seguido de continuación`}
                  </Text>
                </HStack>
                <HStack>
                  <Icon as={FiAlertCircle} color="red.500" />
                  <Text fontSize="xs">
                    <strong>Invalidación:</strong> {pattern.type === 'bullish' ? 
                      `Cierre por debajo de ${pattern.targets?.stopLoss.toLocaleString() || 'soporte'}` : 
                      pattern.type === 'bearish' ? 
                      `Ruptura por encima de ${pattern.targets?.stopLoss.toLocaleString() || 'resistencia'}` :
                      `Ruptura de rango con volumen`}
                  </Text>
                </HStack>
              </VStack>
            </Box>
          </VStack>
        </Collapse>
      </VStack>
    </Box>
  );
};

// Componente principal de estrategias
export const TradingStrategiesCard: React.FC<TradingStrategiesCardProps> = ({ patterns, symbol }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  
  // Determinar tendencia de mercado predominante para calcular consistencia
  const determineTrendFromPatterns = (): string => {
    const bullishCount = patterns.filter(p => p.type === 'bullish').length;
    const bearishCount = patterns.filter(p => p.type === 'bearish').length;
    
    if (bullishCount > bearishCount) return 'up';
    if (bearishCount > bullishCount) return 'down';
    return 'sideways';
  };
  
  const marketTrend = determineTrendFromPatterns();
  
  // Determinar el patrón principal (el de mayor confianza)
  const primaryPattern = [...patterns].sort((a, b) => b.confidence - a.confidence)[0];
  
  // Calcular el consenso de la estrategia
  const calculateConsensus = (): { 
    direction: 'bullish' | 'bearish' | 'neutral' | 'mixed', 
    strength: number, 
    description: string
  } => {
    const bullishWeight = patterns
      .filter(p => p.type === 'bullish')
      .reduce((sum, p) => sum + p.confidence, 0);
    
    const bearishWeight = patterns
      .filter(p => p.type === 'bearish')
      .reduce((sum, p) => sum + p.confidence, 0);
    
    const neutralWeight = patterns
      .filter(p => p.type === 'neutral')
      .reduce((sum, p) => sum + p.confidence, 0);
    
    const totalWeight = bullishWeight + bearishWeight + neutralWeight;
    
    // Determinar la dirección predominante
    let direction: 'bullish' | 'bearish' | 'neutral' | 'mixed';
    let strength = 0;
    let description = '';
    
    if (bullishWeight > bearishWeight && bullishWeight > neutralWeight) {
      direction = 'bullish';
      strength = bullishWeight / totalWeight;
      description = `Consenso alcista (${Math.round(strength * 100)}%)`;
    } else if (bearishWeight > bullishWeight && bearishWeight > neutralWeight) {
      direction = 'bearish';
      strength = bearishWeight / totalWeight;
      description = `Consenso bajista (${Math.round(strength * 100)}%)`;
    } else if (neutralWeight > bullishWeight && neutralWeight > bearishWeight) {
      direction = 'neutral';
      strength = neutralWeight / totalWeight;
      description = `Consenso neutral (${Math.round(strength * 100)}%)`;
    } else {
      direction = 'mixed';
      strength = Math.max(bullishWeight, bearishWeight, neutralWeight) / totalWeight;
      description = `Sin consenso claro`;
    }
    
    return { direction, strength, description };
  };
  
  const consensus = calculateConsensus();
  
  // Si no hay patrones, mostrar mensaje
  if (!patterns || patterns.length === 0) {
    return (
      <Box p={6} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
        <VStack spacing={4} align="stretch">
          <Heading size="md">Estrategias de Trading</Heading>
          <Text color={textColor}>
            No se han detectado patrones avanzados para {symbol} en este momento.
          </Text>
        </VStack>
      </Box>
    );
  }
  
  return (
    <Box p={4} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between" align="center" wrap="wrap">
          <Heading size="md">Estrategias: {symbol}</Heading>
          
          <HStack spacing={2}>
            <Badge
              variant="solid"
              colorScheme={
                consensus.direction === 'bullish' ? "green" : 
                consensus.direction === 'bearish' ? "red" : 
                consensus.direction === 'neutral' ? "orange" : "gray"
              }
            >
              {consensus.description}
            </Badge>
            <Badge
              variant="outline"
              colorScheme={
                patterns.length > 2 ? "green" : 
                patterns.length > 0 ? "blue" : "gray"
              }
            >
              {patterns.length} {patterns.length === 1 ? 'patrón' : 'patrones'}
            </Badge>
          </HStack>
        </HStack>
        
        {/* Resumen de las estrategias */}
        <Box 
          p={3} 
          borderRadius="md" 
          bg={useColorModeValue('blue.50', 'blue.900')} 
          color={useColorModeValue('blue.700', 'blue.200')}
        >
          <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
            <HStack>
              <Icon as={FiBarChart2} />
              <Text fontWeight="medium">Recomendación Principal:</Text>
            </HStack>
            <Text fontSize="sm">
              {primaryPattern.type === 'bullish' 
                ? `Comprar ${symbol} con objetivo en $${primaryPattern.targets?.takeProfit.toLocaleString()}`
                : primaryPattern.type === 'bearish'
                ? `Esperar corrección en ${symbol} para comprar en $${primaryPattern.targets?.takeProfit.toLocaleString()}`
                : `Operar ${symbol} en rango entre $${primaryPattern.targets?.stopLoss.toLocaleString()} y $${primaryPattern.targets?.takeProfit.toLocaleString()}`
              }
            </Text>
          </Flex>
        </Box>
        
        <Tabs variant="soft-rounded" colorScheme="blue" size="sm" isLazy>
          <TabList>
            <Tab>Estrategias Detalladas</Tab>
            <Tab>Comparativa</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel px={0} pt={4}>
              <SimpleGrid columns={{ base: 1, md: patterns.length > 1 ? 2 : 1 }} spacing={4}>
                {patterns.map((pattern, index) => (
                  <PatternCard 
                    key={index} 
                    pattern={pattern} 
                    symbol={symbol} 
                    marketTrend={marketTrend} 
                  />
                ))}
              </SimpleGrid>
            </TabPanel>
            
            <TabPanel px={0} pt={4}>
              <VStack spacing={4} align="stretch">
                {/* Tabla comparativa de estrategias */}
                <Box overflowX="auto">
                  <Box borderWidth="1px" borderRadius="md" borderColor={borderColor}>
                    <Grid 
                      templateColumns="1fr repeat(4, minmax(100px, 1fr))" 
                      bg={useColorModeValue('gray.50', 'gray.700')}
                    >
                      <GridItem p={2} fontWeight="bold" borderBottomWidth="1px" borderRightWidth="1px">
                        Estrategia
                      </GridItem>
                      <GridItem p={2} fontWeight="bold" borderBottomWidth="1px" borderRightWidth="1px">
                        Tipo
                      </GridItem>
                      <GridItem p={2} fontWeight="bold" borderBottomWidth="1px" borderRightWidth="1px">
                        Confianza
                      </GridItem>
                      <GridItem p={2} fontWeight="bold" borderBottomWidth="1px" borderRightWidth="1px">
                        Riesgo/Beneficio
                      </GridItem>
                      <GridItem p={2} fontWeight="bold" borderBottomWidth="1px">
                        Expectativa
                      </GridItem>
                      
                      {patterns.map((pattern, index) => {
                        const riskReward = pattern.targets ? 
                          calculateRiskRewardRatio(
                            pattern.targets.entry, 
                            pattern.targets.takeProfit, 
                            pattern.targets.stopLoss
                          ) : null;
                        
                        const successProbability = calculateSuccessProbability(pattern, marketTrend);
                        
                        const expectedReturn = riskReward ? 
                          (successProbability * riskReward.rewardPercent) - ((1 - successProbability) * riskReward.riskPercent) : 
                          null;
                        
                        return (
                          <React.Fragment key={index}>
                            <GridItem p={2} borderBottomWidth={index < patterns.length - 1 ? "1px" : "0"} borderRightWidth="1px">
                              {pattern.name}
                            </GridItem>
                            <GridItem p={2} borderBottomWidth={index < patterns.length - 1 ? "1px" : "0"} borderRightWidth="1px">
                              <Badge
                                colorScheme={
                                  pattern.type === 'bullish' ? 'green' : 
                                  pattern.type === 'bearish' ? 'red' : 'orange'
                                }
                              >
                                {pattern.type === 'bullish' ? 'Alcista' : 
                                pattern.type === 'bearish' ? 'Bajista' : 'Neutral'}
                              </Badge>
                            </GridItem>
                            <GridItem p={2} borderBottomWidth={index < patterns.length - 1 ? "1px" : "0"} borderRightWidth="1px">
                              <Text fontWeight="bold">
                                {Math.round(pattern.confidence * 100)}%
                              </Text>
                            </GridItem>
                            <GridItem p={2} borderBottomWidth={index < patterns.length - 1 ? "1px" : "0"} borderRightWidth="1px">
                              {riskReward ? (
                                <Badge colorScheme={riskReward.ratio >= 2 ? "green" : riskReward.ratio >= 1 ? "yellow" : "red"}>
                                  {riskReward.ratio.toFixed(1)}
                                </Badge>
                              ) : (
                                <Text>N/A</Text>
                              )}
                            </GridItem>
                            <GridItem p={2} borderBottomWidth={index < patterns.length - 1 ? "1px" : "0"}>
                              {expectedReturn !== null ? (
                                <Text 
                                  fontWeight="bold" 
                                  color={expectedReturn > 0 ? "green.500" : "red.500"}
                                >
                                  {expectedReturn > 0 ? "+" : ""}{expectedReturn.toFixed(1)}%
                                </Text>
                              ) : (
                                <Text>N/A</Text>
                              )}
                            </GridItem>
                          </React.Fragment>
                        );
                      })}
                    </Grid>
                  </Box>
                </Box>
                
                {/* Resumen de consenso y recomendación */}
                <Box p={4} borderWidth="1px" borderRadius="md" borderColor={borderColor}>
                  <Heading size="sm" mb={3}>Evaluación de Consenso</Heading>
                  
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <VStack align="start" spacing={2}>
                      <Text fontWeight="medium">Resumen</Text>
                      <Text fontSize="sm">
                        Las estrategias para {symbol} muestran un consenso 
                        {consensus.direction === 'bullish' ? ' alcista' : 
                         consensus.direction === 'bearish' ? ' bajista' : 
                         consensus.direction === 'neutral' ? ' neutral' : ' mixto'} 
                        {consensus.strength > 0.8 ? ' fuerte' : consensus.strength > 0.6 ? ' moderado' : ' débil'}.
                      </Text>
                      
                      <Text fontWeight="medium" mt={2}>Recomendación General</Text>
                      <Text fontSize="sm">
                        {consensus.direction === 'bullish' 
                          ? `Acumular ${symbol} en niveles actuales o en pullbacks, con stop loss definido. Potencial alcista identificado.`
                          : consensus.direction === 'bearish'
                          ? `Esperar correcciones para comprar ${symbol} a mejores precios. Establecer órdenes escalonadas en soportes clave.`
                          : consensus.direction === 'neutral'
                          ? `Operar ${symbol} en rango, comprando soportes y vendiendo resistencias hasta confirmación de ruptura.`
                          : `Dividir capital para entrada parcial en ${symbol} ahora y reservar resto para confirmación clara de dirección.`
                        }
                      </Text>
                    </VStack>
                    
                    <VStack align="start" spacing={3}>
                      <Text fontWeight="medium">Niveles Clave</Text>
                      
                      {/* Identificar niveles clave de todas las estrategias */}
                      <VStack align="start" spacing={1} w="100%">
                        <HStack>
                          <Icon as={FiTarget} color="green.500" boxSize="3" />
                          <Text fontSize="sm" fontWeight="medium">Objetivos:</Text>
                        </HStack>
                        <HStack pl={6} wrap="wrap" spacing={2}>
                          {patterns.filter(p => p.targets).map((pattern, index) => (
                            <Badge key={index} colorScheme={pattern.type === 'bullish' ? 'green' : pattern.type === 'bearish' ? 'red' : 'blue'}>
                              ${pattern.targets!.takeProfit.toLocaleString()}
                            </Badge>
                          ))}
                        </HStack>
                      </VStack>
                      
                      <VStack align="start" spacing={1} w="100%">
                        <HStack>
                          <Icon as={FiAlertCircle} color="red.500" boxSize="3" />
                          <Text fontSize="sm" fontWeight="medium">Soportes/Stops:</Text>
                        </HStack>
                        <HStack pl={6} wrap="wrap" spacing={2}>
                          {patterns.filter(p => p.targets).map((pattern, index) => (
                            <Badge key={index} colorScheme="red" variant="outline">
                              ${pattern.targets!.stopLoss.toLocaleString()}
                            </Badge>
                          ))}
                        </HStack>
                      </VStack>
                    </VStack>
                  </SimpleGrid>
                </Box>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  );
}; 