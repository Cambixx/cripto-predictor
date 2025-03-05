import React from 'react';
import { 
  Container, 
  Box, 
  Heading, 
  Text,
  VStack,
  SimpleGrid,
  useColorModeValue
} from '@chakra-ui/react';
import { AlertsManager } from '../../components/AlertsManager';
import { TradingSignals } from '../../components/TradingSignals';

export const AlertsPage = () => {
  const bgColor = useColorModeValue('gray.900', 'gray.900');
  const textColor = useColorModeValue('gray.100', 'gray.100');

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="xl" color={textColor}>Centro de Alertas</Heading>
          <Text mt={2} color="gray.400">
            Configura y gestiona tus alertas personalizadas para no perderte oportunidades de trading.
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={8}>
          <Box>
            <AlertsManager />
          </Box>
          <Box>
            <TradingSignals />
          </Box>
        </SimpleGrid>
      </VStack>
    </Container>
  );
}; 