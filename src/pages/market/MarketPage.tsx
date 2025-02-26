import React from 'react'
import { 
  Box, 
  Text, 
  VStack, 
  SimpleGrid, 
  Card, 
  CardBody, 
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
  Icon,
  useColorModeValue
} from '@chakra-ui/react'
import { TriangleUpIcon, TriangleDownIcon } from '@chakra-ui/icons'

export const MarketPage = () => {
  const bgColor = useColorModeValue('dark.200', 'dark.300')
  const textColor = useColorModeValue('gray.300', 'gray.200')

  return (
    <VStack spacing={8} align="stretch">
      <Text fontSize="2xl" fontWeight="bold">Mercado de Criptomonedas</Text>
      
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        <Card bg={bgColor}>
          <CardBody>
            <Stat>
              <StatLabel>Capitalización Total</StatLabel>
              <StatNumber>$2.1T</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                2.5%
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={bgColor}>
          <CardBody>
            <Stat>
              <StatLabel>Volumen 24h</StatLabel>
              <StatNumber>$85.4B</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                1.8%
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={bgColor}>
          <CardBody>
            <Stat>
              <StatLabel>Dominancia BTC</StatLabel>
              <StatNumber>42.3%</StatNumber>
              <StatHelpText>
                <StatArrow type="decrease" />
                0.5%
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Box overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Criptomoneda</Th>
              <Th>Precio</Th>
              <Th>Cambio 24h</Th>
              <Th>Cap. Mercado</Th>
              <Th>Volumen 24h</Th>
            </Tr>
          </Thead>
          <Tbody>
            {/* Aquí irán los datos reales de las criptomonedas */}
            <Tr>
              <Td>Bitcoin (BTC)</Td>
              <Td>$45,632.00</Td>
              <Td>
                <Text color="green.400" display="flex" alignItems="center">
                  <Icon as={TriangleUpIcon} mr={1} />
                  2.5%
                </Text>
              </Td>
              <Td>$865.4B</Td>
              <Td>$25.6B</Td>
            </Tr>
            {/* Más filas aquí */}
          </Tbody>
        </Table>
      </Box>
    </VStack>
  )
} 