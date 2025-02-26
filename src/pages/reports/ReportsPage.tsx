import React from 'react'
import {
  VStack,
  SimpleGrid,
  Card,
  CardBody,
  Text,
  Box,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useColorModeValue,
  Icon,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Flex
} from '@chakra-ui/react'
import { 
  DownloadIcon, 
  ChevronDownIcon, 
  CalendarIcon, 
  RepeatIcon, 
  CheckCircleIcon, 
  WarningIcon 
} from '@chakra-ui/icons'

export const ReportsPage = () => {
  const bgColor = useColorModeValue('dark.200', 'dark.300')
  const textColor = useColorModeValue('gray.300', 'gray.200')

  return (
    <VStack spacing={8} align="stretch">
      <Flex 
        justify="space-between" 
        align={{ base: "stretch", md: "center" }}
        direction={{ base: "column", md: "row" }}
        gap={4}
      >
        <Text fontSize="2xl" fontWeight="bold">Reportes de Trading</Text>
        <HStack spacing={4} wrap="wrap">
          <Menu>
            <MenuButton as={Button} rightIcon={<ChevronDownIcon />} size={{ base: "sm", md: "md" }}>
              Periodo
            </MenuButton>
            <MenuList>
              <MenuItem>Último mes</MenuItem>
              <MenuItem>Últimos 3 meses</MenuItem>
              <MenuItem>Último año</MenuItem>
              <MenuItem>Personalizado</MenuItem>
            </MenuList>
          </Menu>
          <Button 
            leftIcon={<DownloadIcon />} 
            colorScheme="green"
            size={{ base: "sm", md: "md" }}
          >
            Exportar Reporte
          </Button>
        </HStack>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        <Card bg={bgColor}>
          <CardBody>
            <VStack align="stretch" spacing={4}>
              <HStack justify="space-between">
                <Text fontSize="lg" fontWeight="bold">Reporte Mensual</Text>
                <Icon as={CalendarIcon} />
              </HStack>
              <Table variant="simple" size="sm">
                <Tbody>
                  <Tr>
                    <Td>Operaciones Totales</Td>
                    <Td isNumeric>156</Td>
                  </Tr>
                  <Tr>
                    <Td>Operaciones Exitosas</Td>
                    <Td isNumeric color="green.400">107</Td>
                  </Tr>
                  <Tr>
                    <Td>Tasa de Éxito</Td>
                    <Td isNumeric>68.5%</Td>
                  </Tr>
                  <Tr>
                    <Td>Beneficio Total</Td>
                    <Td isNumeric color="green.400">$26,245.32</Td>
                  </Tr>
                </Tbody>
              </Table>
            </VStack>
          </CardBody>
        </Card>

        <Card bg={bgColor}>
          <CardBody>
            <VStack align="stretch" spacing={4}>
              <HStack justify="space-between">
                <Text fontSize="lg" fontWeight="bold">Reporte de Rendimiento</Text>
                <Icon as={RepeatIcon} />
              </HStack>
              <Table variant="simple" size="sm">
                <Tbody>
                  <Tr>
                    <Td>ROI Total</Td>
                    <Td isNumeric color="green.400">12.5%</Td>
                  </Tr>
                  <Tr>
                    <Td>Mejor Operación</Td>
                    <Td isNumeric color="green.400">+15.3%</Td>
                  </Tr>
                  <Tr>
                    <Td>Peor Operación</Td>
                    <Td isNumeric color="red.400">-5.2%</Td>
                  </Tr>
                  <Tr>
                    <Td>Promedio por Operación</Td>
                    <Td isNumeric color="green.400">+3.8%</Td>
                  </Tr>
                </Tbody>
              </Table>
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Card bg={bgColor}>
        <CardBody>
          <Text fontSize="lg" fontWeight="bold" mb={4}>Historial de Reportes</Text>
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Fecha</Th>
                  <Th>Tipo</Th>
                  <Th>Estado</Th>
                  <Th>Operaciones</Th>
                  <Th>Rendimiento</Th>
                  <Th>Acciones</Th>
                </Tr>
              </Thead>
              <Tbody>
                <Tr>
                  <Td>Feb 2024</Td>
                  <Td>Mensual</Td>
                  <Td>
                    <HStack>
                      <Icon as={CheckCircleIcon} color="green.400" />
                      <Text>Completado</Text>
                    </HStack>
                  </Td>
                  <Td>156</Td>
                  <Td color="green.400">+12.5%</Td>
                  <Td>
                    <Button size="sm" leftIcon={<DownloadIcon />}>
                      Descargar
                    </Button>
                  </Td>
                </Tr>
                <Tr>
                  <Td>Ene 2024</Td>
                  <Td>Mensual</Td>
                  <Td>
                    <HStack>
                      <Icon as={CheckCircleIcon} color="green.400" />
                      <Text>Completado</Text>
                    </HStack>
                  </Td>
                  <Td>142</Td>
                  <Td color="green.400">+8.3%</Td>
                  <Td>
                    <Button size="sm" leftIcon={<DownloadIcon />}>
                      Descargar
                    </Button>
                  </Td>
                </Tr>
              </Tbody>
            </Table>
          </Box>
        </CardBody>
      </Card>
    </VStack>
  )
} 