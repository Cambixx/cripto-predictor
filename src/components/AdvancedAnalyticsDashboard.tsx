import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Select,
  Button,
  Input,
  FormControl,
  FormLabel,
  Divider,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useColorModeValue,
  Alert,
  AlertIcon,
  Spinner,
  Progress,
  Stack,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  VStack,
  HStack,
  Tooltip,
  IconButton,
  Tag,
  TagLabel,
} from '@chakra-ui/react';
import { 
  FiBarChart2, 
  FiTrendingUp, 
  FiTrendingDown, 
  FiInfo, 
  FiCheckCircle, 
  FiXCircle, 
  FiDollarSign, 
  FiPercent,
  FiActivity,
  FiClock,
  FiArrowUp,
  FiArrowDown
} from 'react-icons/fi';

// Importar los servicios que hemos creado
import { BacktestResult, BacktestStrategy, runBacktest, optimizeStrategy, predefinedStrategies } from '../services/backtestingService';
import { 
  CorrelationMatrix, 
  calculateCorrelationMatrix, 
  findSignificantCorrelations, 
  findPairTradingOpportunities, 
  findDiversificationOpportunities,
  findDivergentPairs
} from '../services/correlationService';
import { 
  PortfolioSummary, 
  PortfolioPosition, 
  getPortfolioSummary, 
  getPortfolioPerformance,
  addPosition,
  closePosition,
  getTrades,
  depositCash,
  withdrawCash,
  initializePortfolio,
  loadPortfolio
} from '../services/portfolioService';
import { getActiveTradingPairs } from '../services/api';

// Componente para mostrar el resultado de backtesting
const BacktestResultView: React.FC<{ result: BacktestResult | null }> = ({ result }) => {
  const boxBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  if (!result) {
    return (
      <Alert status="info">
        <AlertIcon />
        Ejecuta un backtest para ver los resultados
      </Alert>
    );
  }
  
  // Calcular métricas adicionales
  const annualizedReturn = result.performance / (
    (new Date(result.endDate).getTime() - new Date(result.startDate).getTime()) / 
    (365 * 24 * 60 * 60 * 1000)
  );
  
  const averageTradeReturn = result.trades.reduce((sum, trade) => sum + trade.profitPercent, 0) / result.trades.length;
  
  return (
    <Box>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={6}>
        <Stat
          bg={boxBg}
          p={3}
          borderRadius="md"
          boxShadow="sm"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <StatLabel fontWeight="semibold">Rendimiento</StatLabel>
          <StatNumber fontSize="2xl" color={result.performance >= 0 ? 'green.500' : 'red.500'}>
            {result.performance.toFixed(2)}%
          </StatNumber>
          <StatHelpText>
            <StatArrow type={result.performance >= 0 ? 'increase' : 'decrease'} />
            Rentabilidad total
          </StatHelpText>
        </Stat>
        
        <Stat
          bg={boxBg}
          p={3}
          borderRadius="md"
          boxShadow="sm"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <StatLabel fontWeight="semibold">Operaciones</StatLabel>
          <StatNumber fontSize="2xl">{result.totalTrades}</StatNumber>
          <StatHelpText>
            WinRate: {result.winRate.toFixed(2)}%
          </StatHelpText>
        </Stat>
        
        <Stat
          bg={boxBg}
          p={3}
          borderRadius="md"
          boxShadow="sm"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <StatLabel fontWeight="semibold">Factor de Beneficio</StatLabel>
          <StatNumber fontSize="2xl" color={result.profitFactor >= 1.5 ? 'green.500' : result.profitFactor >= 1 ? 'yellow.500' : 'red.500'}>
            {result.profitFactor.toFixed(2)}
          </StatNumber>
          <StatHelpText>
            Ratio ganancia/pérdida
          </StatHelpText>
        </Stat>
        
        <Stat
          bg={boxBg}
          p={3}
          borderRadius="md"
          boxShadow="sm"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <StatLabel fontWeight="semibold">Drawdown Máximo</StatLabel>
          <StatNumber fontSize="2xl" color={result.maxDrawdown < 15 ? 'green.500' : result.maxDrawdown < 25 ? 'yellow.500' : 'red.500'}>
            {result.maxDrawdown.toFixed(2)}%
          </StatNumber>
          <StatHelpText>
            Caída máxima
          </StatHelpText>
        </Stat>
      </SimpleGrid>
      
      <Heading size="md" mb={4}>Detalles de Operaciones</Heading>
      
      <Box
        overflowX="auto"
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="md"
        boxShadow="sm"
        mb={6}
      >
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>ID</Th>
              <Th>Tipo</Th>
              <Th>Entrada</Th>
              <Th>Precio Entrada</Th>
              <Th>Salida</Th>
              <Th>Precio Salida</Th>
              <Th>Duración</Th>
              <Th>Resultado</Th>
              <Th>Razón</Th>
            </Tr>
          </Thead>
          <Tbody>
            {result.trades.slice(0, 10).map(trade => (
              <Tr key={`trade-${trade.id}`}>
                <Td>{trade.id}</Td>
                <Td>
                  <Badge colorScheme={trade.type === 'buy' ? 'green' : 'red'}>
                    {trade.type === 'buy' ? 'Compra' : 'Venta'}
                  </Badge>
                </Td>
                <Td>{new Date(trade.entryDate).toLocaleDateString()}</Td>
                <Td>{trade.entryPrice.toFixed(2)}</Td>
                <Td>{new Date(trade.exitDate).toLocaleDateString()}</Td>
                <Td>{trade.exitPrice.toFixed(2)}</Td>
                <Td>{trade.duration} días</Td>
                <Td color={trade.profitPercent >= 0 ? 'green.500' : 'red.500'}>
                  {trade.profitPercent >= 0 ? '+' : ''}{trade.profitPercent.toFixed(2)}%
                </Td>
                <Td>{trade.reason}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
      
      <Flex justifyContent="space-between" flexWrap="wrap" gap={4}>
        <Box width={{ base: "100%", md: "48%" }} p={4} borderWidth="1px" borderRadius="md" borderColor={borderColor}>
          <Heading size="sm" mb={2}>Distribución de Resultados</Heading>
          <Text>Ganancia Media: {result.trades.filter(t => t.profitPercent > 0).reduce((sum, t) => sum + t.profitPercent, 0) / result.winningTrades}%</Text>
          <Text>Pérdida Media: {result.trades.filter(t => t.profitPercent <= 0).reduce((sum, t) => sum + t.profitPercent, 0) / result.losingTrades}%</Text>
          <Text>Operación Más Rentable: {Math.max(...result.trades.map(t => t.profitPercent)).toFixed(2)}%</Text>
          <Text>Operación Menos Rentable: {Math.min(...result.trades.map(t => t.profitPercent)).toFixed(2)}%</Text>
        </Box>
        
        <Box width={{ base: "100%", md: "48%" }} p={4} borderWidth="1px" borderRadius="md" borderColor={borderColor}>
          <Heading size="sm" mb={2}>Estadísticas Avanzadas</Heading>
          <Text>Rendimiento Anualizado: {annualizedReturn.toFixed(2)}%</Text>
          <Text>Duración Media de Operaciones: {(result.trades.reduce((sum, t) => sum + t.duration, 0) / result.trades.length).toFixed(1)} días</Text>
          <Text>Retorno Medio por Operación: {averageTradeReturn.toFixed(2)}%</Text>
          <Text>Capital Máximo: ${Math.max(...result.equity).toFixed(2)}</Text>
        </Box>
      </Flex>
    </Box>
  );
};

// Componente para mostrar la matriz de correlación
const CorrelationMatrixView: React.FC<{ matrix: CorrelationMatrix | null }> = ({ matrix }) => {
  const boxBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  if (!matrix) {
    return (
      <Alert status="info">
        <AlertIcon />
        Calcula una matriz de correlación para ver los resultados
      </Alert>
    );
  }
  
  const getCorrelationColor = (value: number) => {
    if (value >= 0.8) return 'red.500';
    if (value >= 0.5) return 'orange.500';
    if (value >= 0.2) return 'yellow.500';
    if (value >= -0.2) return 'gray.500';
    if (value >= -0.5) return 'teal.500';
    if (value >= -0.8) return 'blue.500';
    return 'purple.500';
  };
  
  return (
    <Box>
      <Box
        overflowX="auto"
        borderWidth="1px"
        borderRadius="md"
        borderColor={borderColor}
        boxShadow="sm"
        mb={6}
      >
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th></Th>
              {matrix.symbols.map(symbol => (
                <Th key={symbol}>{symbol.replace('/USDT', '')}</Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {matrix.matrix.map((row, i) => (
              <Tr key={`row-${i}`}>
                <Th>{matrix.symbols[i].replace('/USDT', '')}</Th>
                {row.map((value, j) => (
                  <Td key={`cell-${i}-${j}`} textAlign="center" bg={i === j ? 'gray.100' : undefined}>
                    <Text color={getCorrelationColor(value)} fontWeight={Math.abs(value) > 0.7 ? "bold" : "normal"}>
                      {value.toFixed(2)}
                    </Text>
                  </Td>
                ))}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        <Box>
          <Heading size="md" mb={4}>Oportunidades de Trading de Pares</Heading>
          <Box
            borderWidth="1px"
            borderRadius="md"
            borderColor={borderColor}
            boxShadow="sm"
            p={4}
            bg={boxBg}
            maxHeight="300px"
            overflowY="auto"
          >
            {findPairTradingOpportunities(matrix).length > 0 ? (
              <VStack align="stretch" spacing={3}>
                {findPairTradingOpportunities(matrix).map((pair, idx) => (
                  <HStack key={`pair-${idx}`} justify="space-between" p={2} borderWidth="1px" borderRadius="md">
                    <HStack>
                      <Text fontWeight="bold">{pair.pair[0].replace('/USDT', '')} / {pair.pair[1].replace('/USDT', '')}</Text>
                      <Badge colorScheme={pair.strength === 'strong' ? 'green' : pair.strength === 'moderate' ? 'yellow' : 'gray'}>
                        {pair.strength}
                      </Badge>
                    </HStack>
                    <Text color={getCorrelationColor(pair.correlation)}>{pair.correlation.toFixed(2)}</Text>
                  </HStack>
                ))}
              </VStack>
            ) : (
              <Text>No se encontraron pares con alta correlación</Text>
            )}
          </Box>
        </Box>
        
        <Box>
          <Heading size="md" mb={4}>Oportunidades de Diversificación</Heading>
          <Box
            borderWidth="1px"
            borderRadius="md"
            borderColor={borderColor}
            boxShadow="sm"
            p={4}
            bg={boxBg}
            maxHeight="300px"
            overflowY="auto"
          >
            {findDiversificationOpportunities(matrix).length > 0 ? (
              <VStack align="stretch" spacing={3}>
                {findDiversificationOpportunities(matrix).slice(0, 10).map((pair, idx) => (
                  <HStack key={`div-${idx}`} justify="space-between" p={2} borderWidth="1px" borderRadius="md">
                    <HStack>
                      <Text fontWeight="bold">{pair.pair[0].replace('/USDT', '')} / {pair.pair[1].replace('/USDT', '')}</Text>
                      <Badge colorScheme={'blue'}>Diversificación</Badge>
                    </HStack>
                    <Text color={getCorrelationColor(pair.correlation)}>{pair.correlation.toFixed(2)}</Text>
                  </HStack>
                ))}
              </VStack>
            ) : (
              <Text>No se encontraron pares con baja correlación</Text>
            )}
          </Box>
        </Box>
      </SimpleGrid>
    </Box>
  );
};

// Componente principal
export const AdvancedAnalyticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'backtest' | 'correlation' | 'portfolio'>('backtest');
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [selectedStrategy, setSelectedStrategy] = useState<string>(Object.keys(predefinedStrategies)[0]);
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 6);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  });
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [correlationSymbols, setCorrelationSymbols] = useState<string[]>([]);
  const [correlationMatrix, setCorrelationMatrix] = useState<CorrelationMatrix | null>(null);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cargar símbolos disponibles
  useEffect(() => {
    const fetchSymbols = async () => {
      try {
        setLoading(true);
        const symbols = await getActiveTradingPairs();
        setAvailableSymbols(symbols);
        if (symbols.length > 0) {
          setSelectedSymbol(symbols[0]);
        }
      } catch (error) {
        console.error('Error fetching symbols:', error);
        setError('Error cargando símbolos disponibles');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSymbols();
  }, []);
  
  // Cargar datos del portfolio
  useEffect(() => {
    const loadPortfolioData = async () => {
      try {
        // Intentar cargar portfolio existente
        const portfolioLoaded = loadPortfolio();
        
        if (!portfolioLoaded) {
          // Si no hay portfolio, inicializar uno con 10,000 unidades
          initializePortfolio(10000);
        }
        
        // Obtener resumen actualizado
        const summary = await getPortfolioSummary();
        setPortfolioSummary(summary);
      } catch (error) {
        console.error('Error loading portfolio:', error);
      }
    };
    
    loadPortfolioData();
  }, []);
  
  // Ejecutar backtest
  const handleRunBacktest = async () => {
    if (!selectedSymbol || !selectedStrategy) {
      setError('Selecciona un símbolo y una estrategia');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const strategy = predefinedStrategies[selectedStrategy];
      const result = await runBacktest(
        selectedSymbol,
        strategy,
        startDate,
        endDate
      );
      
      setBacktestResult(result);
    } catch (error) {
      console.error('Error running backtest:', error);
      setError('Error ejecutando backtest');
    } finally {
      setLoading(false);
    }
  };
  
  // Optimizar estrategia
  const handleOptimizeStrategy = async () => {
    if (!selectedSymbol || !selectedStrategy) {
      setError('Selecciona un símbolo y una estrategia');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const strategy = predefinedStrategies[selectedStrategy];
      
      // Definir rangos de parámetros para optimización
      const paramRanges: Record<string, { min: number; max: number; step: number }> = {};
      
      // Configurar rangos según el tipo de estrategia
      if (selectedStrategy === 'cruce_medias_moviles') {
        paramRanges.fastPeriod = { min: 5, max: 20, step: 5 };
        paramRanges.slowPeriod = { min: 20, max: 50, step: 10 };
      } else if (selectedStrategy === 'rsi_sobrecompra_sobreventa') {
        paramRanges.rsiPeriod = { min: 7, max: 21, step: 7 };
        paramRanges.oversold = { min: 20, max: 40, step: 5 };
        paramRanges.overbought = { min: 60, max: 80, step: 5 };
      }
      
      const optimizationResult = await optimizeStrategy(
        selectedSymbol,
        strategy,
        startDate,
        endDate,
        paramRanges
      );
      
      // Actualizar con los resultados optimizados
      setBacktestResult(optimizationResult.result);
      
    } catch (error) {
      console.error('Error optimizing strategy:', error);
      setError('Error optimizando estrategia');
    } finally {
      setLoading(false);
    }
  };
  
  // Calcular matriz de correlación
  const handleCalculateCorrelation = async () => {
    if (correlationSymbols.length < 2) {
      setError('Selecciona al menos 2 símbolos para calcular correlación');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const matrix = await calculateCorrelationMatrix(correlationSymbols);
      setCorrelationMatrix(matrix);
      
    } catch (error) {
      console.error('Error calculating correlation:', error);
      setError('Error calculando la matriz de correlación');
    } finally {
      setLoading(false);
    }
  };
  
  // Manejar la selección de símbolos para correlación
  const handleToggleCorrelationSymbol = (symbol: string) => {
    setCorrelationSymbols(prev => {
      if (prev.includes(symbol)) {
        return prev.filter(s => s !== symbol);
      } else {
        return [...prev, symbol];
      }
    });
  };
  
  // Actualizar portfolio
  const refreshPortfolio = async () => {
    try {
      setLoading(true);
      const summary = await getPortfolioSummary();
      setPortfolioSummary(summary);
    } catch (error) {
      console.error('Error refreshing portfolio:', error);
      setError('Error actualizando el portfolio');
    } finally {
      setLoading(false);
    }
  };
  
  const boxBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <Box p={4}>
      <Heading mb={6}>Dashboard de Análisis Avanzado</Heading>
      
      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}
      
      <Tabs isFitted variant="enclosed" onChange={(index) => {
        setActiveTab(['backtest', 'correlation', 'portfolio'][index] as 'backtest' | 'correlation' | 'portfolio');
      }}>
        <TabList mb={4}>
          <Tab>Backtesting</Tab>
          <Tab>Correlación de Activos</Tab>
          <Tab>Portfolio</Tab>
        </TabList>
        
        <TabPanels>
          {/* Panel de Backtesting */}
          <TabPanel>
            <Box mb={6} p={4} borderWidth="1px" borderRadius="md" bg={boxBg} borderColor={borderColor}>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
                <FormControl>
                  <FormLabel>Símbolo</FormLabel>
                  <Select
                    value={selectedSymbol}
                    onChange={(e) => setSelectedSymbol(e.target.value)}
                    placeholder="Selecciona un símbolo"
                    isDisabled={loading}
                  >
                    {availableSymbols.map(symbol => (
                      <option key={symbol} value={symbol}>{symbol}</option>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Estrategia</FormLabel>
                  <Select
                    value={selectedStrategy}
                    onChange={(e) => setSelectedStrategy(e.target.value)}
                    placeholder="Selecciona una estrategia"
                    isDisabled={loading}
                  >
                    {Object.entries(predefinedStrategies).map(([key, strategy]) => (
                      <option key={key} value={key}>{strategy.name}</option>
                    ))}
                  </Select>
                </FormControl>
                
                <Box>
                  <FormControl>
                    <FormLabel>Período</FormLabel>
                    <Flex gap={2}>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        isDisabled={loading}
                      />
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        isDisabled={loading}
                      />
                    </Flex>
                  </FormControl>
                </Box>
              </SimpleGrid>
              
              <Flex gap={4} justify="flex-end">
                <Button
                  colorScheme="blue"
                  onClick={handleRunBacktest}
                  isLoading={loading}
                  leftIcon={<FiBarChart2 />}
                >
                  Ejecutar Backtest
                </Button>
                
                <Button
                  colorScheme="teal"
                  onClick={handleOptimizeStrategy}
                  isLoading={loading}
                  leftIcon={<FiActivity />}
                >
                  Optimizar Estrategia
                </Button>
              </Flex>
            </Box>
            
            {loading ? (
              <Flex justify="center" align="center" direction="column" my={10}>
                <Spinner size="xl" mb={4} />
                <Text>Procesando datos...</Text>
              </Flex>
            ) : (
              <BacktestResultView result={backtestResult} />
            )}
          </TabPanel>
          
          {/* Panel de Correlación */}
          <TabPanel>
            <Box mb={6} p={4} borderWidth="1px" borderRadius="md" bg={boxBg} borderColor={borderColor}>
              <Heading size="md" mb={4}>Selecciona Activos para Analizar</Heading>
              
              <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 6 }} spacing={3} mb={4}>
                {availableSymbols.slice(0, 30).map(symbol => (
                  <Button
                    key={symbol}
                    size="sm"
                    variant={correlationSymbols.includes(symbol) ? "solid" : "outline"}
                    colorScheme={correlationSymbols.includes(symbol) ? "blue" : "gray"}
                    onClick={() => handleToggleCorrelationSymbol(symbol)}
                    isDisabled={loading}
                  >
                    {symbol.replace('/USDT', '')}
                  </Button>
                ))}
              </SimpleGrid>
              
              <Flex gap={4} justify="flex-end">
                <Button
                  colorScheme="blue"
                  onClick={handleCalculateCorrelation}
                  isLoading={loading}
                  isDisabled={correlationSymbols.length < 2}
                  leftIcon={<FiActivity />}
                >
                  Calcular Correlación
                </Button>
              </Flex>
            </Box>
            
            {loading ? (
              <Flex justify="center" align="center" direction="column" my={10}>
                <Spinner size="xl" mb={4} />
                <Text>Procesando datos...</Text>
              </Flex>
            ) : (
              <CorrelationMatrixView matrix={correlationMatrix} />
            )}
          </TabPanel>
          
          {/* Panel de Portfolio */}
          <TabPanel>
            <Flex justify="flex-end" mb={4}>
              <Button
                colorScheme="blue"
                onClick={refreshPortfolio}
                isLoading={loading}
                leftIcon={<FiActivity />}
              >
                Actualizar Portfolio
              </Button>
            </Flex>
            
            {loading ? (
              <Flex justify="center" align="center" direction="column" my={10}>
                <Spinner size="xl" mb={4} />
                <Text>Procesando datos...</Text>
              </Flex>
            ) : portfolioSummary ? (
              <Box>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={6}>
                  <Stat
                    bg={boxBg}
                    p={3}
                    borderRadius="md"
                    boxShadow="sm"
                    borderWidth="1px"
                    borderColor={borderColor}
                  >
                    <StatLabel fontWeight="semibold">Valor Total</StatLabel>
                    <StatNumber fontSize="2xl">${portfolioSummary.totalValue.toFixed(2)}</StatNumber>
                    <StatHelpText>
                      <StatArrow type={portfolioSummary.pnl >= 0 ? 'increase' : 'decrease'} />
                      {portfolioSummary.pnlPercentage.toFixed(2)}%
                    </StatHelpText>
                  </Stat>
                  
                  <Stat
                    bg={boxBg}
                    p={3}
                    borderRadius="md"
                    boxShadow="sm"
                    borderWidth="1px"
                    borderColor={borderColor}
                  >
                    <StatLabel fontWeight="semibold">Mejor Activo</StatLabel>
                    <StatNumber fontSize="2xl">{portfolioSummary.bestPerformer.symbol || '-'}</StatNumber>
                    <StatHelpText>
                      <StatArrow type="increase" />
                      {portfolioSummary.bestPerformer.profitPercentage.toFixed(2)}%
                    </StatHelpText>
                  </Stat>
                  
                  <Stat
                    bg={boxBg}
                    p={3}
                    borderRadius="md"
                    boxShadow="sm"
                    borderWidth="1px"
                    borderColor={borderColor}
                  >
                    <StatLabel fontWeight="semibold">Volatilidad</StatLabel>
                    <StatNumber fontSize="2xl">{portfolioSummary.riskMetrics.volatility.toFixed(2)}%</StatNumber>
                    <StatHelpText>
                      Anualizada
                    </StatHelpText>
                  </Stat>
                  
                  <Stat
                    bg={boxBg}
                    p={3}
                    borderRadius="md"
                    boxShadow="sm"
                    borderWidth="1px"
                    borderColor={borderColor}
                  >
                    <StatLabel fontWeight="semibold">Sharpe Ratio</StatLabel>
                    <StatNumber fontSize="2xl" color={portfolioSummary.riskMetrics.sharpeRatio >= 1 ? 'green.500' : 'yellow.500'}>
                      {portfolioSummary.riskMetrics.sharpeRatio.toFixed(2)}
                    </StatNumber>
                    <StatHelpText>
                      Rendimiento ajustado al riesgo
                    </StatHelpText>
                  </Stat>
                </SimpleGrid>
                
                <Heading size="md" mb={4}>Posiciones</Heading>
                
                <Box
                  overflowX="auto"
                  borderWidth="1px"
                  borderRadius="md"
                  borderColor={borderColor}
                  boxShadow="sm"
                  mb={6}
                >
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Símbolo</Th>
                        <Th>Cantidad</Th>
                        <Th>Precio de Entrada</Th>
                        <Th>Precio Actual</Th>
                        <Th>Valor</Th>
                        <Th>Peso</Th>
                        <Th>P&L</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {portfolioSummary.positions.map((position) => (
                        <Tr key={position.symbol}>
                          <Td fontWeight="bold">{position.symbol}</Td>
                          <Td>{position.amount.toFixed(6)}</Td>
                          <Td>${position.entryPrice.toFixed(2)}</Td>
                          <Td>${position.currentPrice?.toFixed(2) || '-'}</Td>
                          <Td>${position.currentValue?.toFixed(2) || '-'}</Td>
                          <Td>{position.weight?.toFixed(2)}%</Td>
                          <Td color={(position.profitPercentage || 0) >= 0 ? 'green.500' : 'red.500'}>
                            {position.profitPercentage ? (
                              <>
                                {position.profitPercentage >= 0 ? '+' : ''}
                                {position.profitPercentage.toFixed(2)}%
                              </>
                            ) : '-'}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <Box>
                    <Heading size="md" mb={4}>Métricas de Riesgo</Heading>
                    <Box
                      borderWidth="1px"
                      borderRadius="md"
                      borderColor={borderColor}
                      boxShadow="sm"
                      p={4}
                      bg={boxBg}
                    >
                      <VStack align="stretch" spacing={3}>
                        <HStack justify="space-between">
                          <Text>Volatilidad:</Text>
                          <Text fontWeight="bold">{portfolioSummary.riskMetrics.volatility.toFixed(2)}%</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text>Sharpe Ratio:</Text>
                          <Text fontWeight="bold">{portfolioSummary.riskMetrics.sharpeRatio.toFixed(2)}</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text>Drawdown Máximo:</Text>
                          <Text fontWeight="bold">{portfolioSummary.riskMetrics.maxDrawdown.toFixed(2)}%</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text>Beta (vs BTC):</Text>
                          <Text fontWeight="bold">{portfolioSummary.riskMetrics.beta.toFixed(2)}</Text>
                        </HStack>
                      </VStack>
                    </Box>
                  </Box>
                  
                  <Box>
                    <Heading size="md" mb={4}>Rendimiento Relativo</Heading>
                    <Box
                      borderWidth="1px"
                      borderRadius="md"
                      borderColor={borderColor}
                      boxShadow="sm"
                      p={4}
                      bg={boxBg}
                      height="200px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text fontStyle="italic">Gráfico de rendimiento relativo vs. BTC</Text>
                    </Box>
                  </Box>
                </SimpleGrid>
              </Box>
            ) : (
              <Alert status="info">
                <AlertIcon />
                No hay datos de portfolio disponibles
              </Alert>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}; 