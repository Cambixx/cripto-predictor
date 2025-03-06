import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
  useColorModeValue,
  Flex,
  Tooltip,
  Progress,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Spinner,
  Tag,
  TagLabel,
  TagLeftIcon,
} from '@chakra-ui/react';
import {
  FiTrendingUp,
  FiActivity,
  FiDollarSign,
  FiBarChart2,
  FiVolume2,
  FiPercent,
} from 'react-icons/fi';

interface CryptoOpportunity {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  rsi: number;
  macdSignal: 'buy' | 'sell' | 'neutral';
  volumeProfile: 'high' | 'medium' | 'low';
  breakoutPotential: number; // 0-100
  trendStrength: number; // 0-100
  supportLevel: number;
  resistanceLevel: number;
  potentialReturn: number;
}

const calculateOpportunityScore = (opportunity: CryptoOpportunity): number => {
  // Ponderación de factores para el score final
  const weights = {
    rsi: 0.2,
    macd: 0.15,
    volume: 0.15,
    breakout: 0.2,
    trend: 0.3
  };

  let macdScore = opportunity.macdSignal === 'buy' ? 100 : 
                  opportunity.macdSignal === 'neutral' ? 50 : 0;
  
  let volumeScore = opportunity.volumeProfile === 'high' ? 100 :
                    opportunity.volumeProfile === 'medium' ? 60 : 30;

  return (
    (opportunity.rsi * weights.rsi) +
    (macdScore * weights.macd) +
    (volumeScore * weights.volume) +
    (opportunity.breakoutPotential * weights.breakout) +
    (opportunity.trendStrength * weights.trend)
  ) / 100;
};

const OpportunityCard: React.FC<{ opportunity: CryptoOpportunity }> = ({ opportunity }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');

  const score = calculateOpportunityScore(opportunity);

  return (
    <Box
      p={4}
      bg={bgColor}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={borderColor}
      _hover={{ boxShadow: 'lg' }}
      transition="all 0.2s"
    >
      <VStack spacing={3} align="stretch">
        <Flex justify="space-between" align="center">
          <HStack>
            <Icon
              as={opportunity.change24h >= 0 ? FiTrendingUp : FiActivity}
              color={opportunity.change24h >= 0 ? 'green.500' : 'red.500'}
              boxSize={5}
            />
            <VStack align="start" spacing={0}>
              <Heading size="md">{opportunity.symbol}</Heading>
              <Text fontSize="sm" color={textColor}>
                ${opportunity.price.toLocaleString()}
              </Text>
            </VStack>
          </HStack>
          <Badge
            colorScheme={score >= 70 ? 'green' : score >= 50 ? 'yellow' : 'red'}
            fontSize="sm"
            px={2}
            py={1}
          >
            Score: {Math.round(score)}
          </Badge>
        </Flex>

        <SimpleGrid columns={2} spacing={4}>
          <Stat size="sm">
            <StatLabel>Cambio 24h</StatLabel>
            <StatNumber color={opportunity.change24h >= 0 ? 'green.500' : 'red.500'}>
              {opportunity.change24h > 0 ? '+' : ''}{opportunity.change24h}%
            </StatNumber>
            <StatHelpText>
              <StatArrow type={opportunity.change24h >= 0 ? 'increase' : 'decrease'} />
              Últimas 24h
            </StatHelpText>
          </Stat>

          <Stat size="sm">
            <StatLabel>Retorno Potencial</StatLabel>
            <StatNumber color="green.500">
              +{opportunity.potentialReturn}%
            </StatNumber>
            <StatHelpText>
              Objetivo: ${opportunity.resistanceLevel.toLocaleString()}
            </StatHelpText>
          </Stat>
        </SimpleGrid>

        <Box>
          <HStack justify="space-between" mb={1}>
            <Text fontSize="xs">Fuerza de la Tendencia</Text>
            <Text fontSize="xs" fontWeight="bold">{opportunity.trendStrength}%</Text>
          </HStack>
          <Progress
            value={opportunity.trendStrength}
            size="xs"
            colorScheme={opportunity.trendStrength >= 70 ? 'green' : 'yellow'}
            borderRadius="full"
          />
        </Box>

        <HStack spacing={2} wrap="wrap">
          <Tag size="sm" colorScheme={opportunity.rsi <= 30 ? 'green' : opportunity.rsi >= 70 ? 'red' : 'gray'}>
            <TagLeftIcon as={FiBarChart2} />
            <TagLabel>RSI: {opportunity.rsi}</TagLabel>
          </Tag>

          <Tag size="sm" colorScheme={opportunity.macdSignal === 'buy' ? 'green' : opportunity.macdSignal === 'sell' ? 'red' : 'gray'}>
            <TagLeftIcon as={FiActivity} />
            <TagLabel>MACD: {opportunity.macdSignal}</TagLabel>
          </Tag>

          <Tag size="sm" colorScheme={opportunity.volumeProfile === 'high' ? 'green' : 'gray'}>
            <TagLeftIcon as={FiVolume2} />
            <TagLabel>Vol: {opportunity.volumeProfile}</TagLabel>
          </Tag>
        </HStack>

        <Box
          p={3}
          bg={useColorModeValue('blue.50', 'blue.900')}
          color={useColorModeValue('blue.700', 'blue.200')}
          borderRadius="md"
          fontSize="sm"
        >
          <HStack>
            <Icon as={FiDollarSign} />
            <Text>
              Soporte: ${opportunity.supportLevel.toLocaleString()} | 
              Resistencia: ${opportunity.resistanceLevel.toLocaleString()}
            </Text>
          </HStack>
        </Box>
      </VStack>
    </Box>
  );
};

export const HotOpportunitiesPanel: React.FC = () => {
  const [opportunities, setOpportunities] = useState<CryptoOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Aquí implementaremos la lógica para obtener y actualizar las oportunidades
    const fetchOpportunities = async () => {
      try {
        // TODO: Implementar la llamada a la API para obtener datos en tiempo real
        // Por ahora usamos datos de ejemplo
        const mockData: CryptoOpportunity[] = [
          {
            symbol: 'BTC/USDT',
            price: 65000,
            change24h: 2.5,
            volume24h: 1500000000,
            rsi: 58,
            macdSignal: 'buy',
            volumeProfile: 'high',
            breakoutPotential: 85,
            trendStrength: 75,
            supportLevel: 64000,
            resistanceLevel: 68000,
            potentialReturn: 4.6
          },
          // Agregar más ejemplos aquí
        ];

        setOpportunities(mockData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching opportunities:', error);
        setIsLoading(false);
      }
    };

    fetchOpportunities();
    const interval = setInterval(fetchOpportunities, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
  }, []);

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <Flex justify="space-between" align="center">
          <Heading size="md">Oportunidades en Tiempo Real</Heading>
          {isLoading && <Spinner size="sm" />}
        </Flex>

        {!isLoading && opportunities.length === 0 ? (
          <Text color="gray.500">No se encontraron oportunidades destacadas en este momento.</Text>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {opportunities.map((opportunity, index) => (
              <OpportunityCard key={index} opportunity={opportunity} />
            ))}
          </SimpleGrid>
        )}
      </VStack>
    </Box>
  );
}; 