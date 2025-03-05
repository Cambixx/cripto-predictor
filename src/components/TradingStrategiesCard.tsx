import React from 'react';
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
  Divider
} from '@chakra-ui/react';
import { InfoOutlineIcon, ChevronRightIcon, StarIcon } from '@chakra-ui/icons';
import { FiArrowUpRight, FiArrowDownRight, FiActivity, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

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

export const TradingStrategiesCard: React.FC<TradingStrategiesCardProps> = ({ patterns, symbol }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  
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
    <Box p={6} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
      <VStack spacing={6} align="stretch">
        <Flex justify="space-between" align="center">
          <Heading size="md">Estrategias de Trading: {symbol}</Heading>
          <Badge
            variant="solid"
            colorScheme={
              patterns.length > 2 ? "green" : 
              patterns.length > 0 ? "blue" : "gray"
            }
          >
            {patterns.length} {patterns.length === 1 ? 'patrón' : 'patrones'} detectado{patterns.length === 1 ? '' : 's'}
          </Badge>
        </Flex>
        
        <SimpleGrid columns={{ base: 1, md: patterns.length > 1 ? 2 : 1 }} spacing={4}>
          {patterns.map((pattern, index) => (
            <Box 
              key={index}
              p={4}
              borderRadius="md"
              borderWidth="1px"
              borderColor={borderColor}
              bg={useColorModeValue('gray.50', 'gray.700')}
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
                    <Heading size="sm">{pattern.name}</Heading>
                  </HStack>
                  <Badge
                    colorScheme={
                      pattern.type === 'bullish' ? 'green' : 
                      pattern.type === 'bearish' ? 'red' : 'orange'
                    }
                  >
                    {pattern.type === 'bullish' ? 'Alcista' : 
                     pattern.type === 'bearish' ? 'Bajista' : 'Neutral'}
                  </Badge>
                </Flex>
                
                <Text fontSize="sm" color={textColor}>{pattern.description}</Text>
                
                <Divider />
                
                <HStack justify="space-between">
                  <Tooltip label="Nivel de confianza basado en análisis histórico">
                    <HStack>
                      <InfoOutlineIcon boxSize={3} color={textColor} />
                      <Text fontSize="sm">Confianza:</Text>
                      <Text fontSize="sm" fontWeight="bold">
                        {Math.round(pattern.confidence * 100)}%
                      </Text>
                    </HStack>
                  </Tooltip>
                  <Text fontSize="sm">{pattern.timeframe}</Text>
                </HStack>
                
                {pattern.targets && (
                  <SimpleGrid columns={3} spacing={2}>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="xs" color={textColor}>Entrada</Text>
                      <Text fontSize="sm" fontWeight="bold">${pattern.targets.entry.toLocaleString()}</Text>
                    </VStack>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="xs" color="green.500">Objetivo</Text>
                      <Text fontSize="sm" fontWeight="bold">${pattern.targets.takeProfit.toLocaleString()}</Text>
                    </VStack>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="xs" color="red.500">Stop Loss</Text>
                      <Text fontSize="sm" fontWeight="bold">${pattern.targets.stopLoss.toLocaleString()}</Text>
                    </VStack>
                  </SimpleGrid>
                )}
                
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
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
      </VStack>
    </Box>
  );
}; 