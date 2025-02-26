import React, { useState, useEffect } from 'react'
import {
  VStack,
  HStack,
  Text,
  Box,
  SimpleGrid,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Progress,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Icon,
  useColorModeValue,
  Flex,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  useDisclosure,
  IconButton,
  useToast,
  Spinner,
  Center
} from '@chakra-ui/react'
import { AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons'
import { getTop20Cryptos, getCryptoPrice } from '../../services/cryptoService'

interface Asset {
  id: string;
  symbol: string;
  name: string;
  amount: number;
  purchasePrice: number;
  currentPrice: number;
}

interface CryptoOption {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  total_volume: number;
}

export const PortfolioPage = () => {
  const bgColor = useColorModeValue('dark.200', 'dark.300')
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()
  
  // Estado para el portfolio y criptomonedas disponibles
  const [assets, setAssets] = useState<Asset[]>([])
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [availableCryptos, setAvailableCryptos] = useState<CryptoOption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Cargar las principales criptomonedas al iniciar
  useEffect(() => {
    const fetchCryptos = async () => {
      try {
        const cryptos = await getTop20Cryptos()
        setAvailableCryptos(cryptos)
      } catch (error) {
        toast({
          title: "Error al cargar criptomonedas",
          status: "error",
          duration: 3000,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchCryptos()
  }, [toast])

  // Actualizar precios cada 60 segundos
  useEffect(() => {
    const updatePrices = async () => {
      if (assets.length === 0) return

      try {
        const updatedAssets = await Promise.all(
          assets.map(async (asset) => {
            const crypto = availableCryptos.find(c => c.symbol.toLowerCase() === asset.symbol.toLowerCase())
            if (!crypto) return asset

            const currentPrice = crypto.current_price
            return { ...asset, currentPrice }
          })
        )

        setAssets(updatedAssets)
      } catch (error) {
        console.error('Error updating prices:', error)
      }
    }

    const interval = setInterval(updatePrices, 60000)
    return () => clearInterval(interval)
  }, [assets, availableCryptos])

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    
    const selectedCrypto = availableCryptos.find(
      c => c.id === formData.get('cryptoId')
    )

    if (!selectedCrypto) {
      toast({
        title: "Error",
        description: "Criptomoneda no encontrada",
        status: "error",
        duration: 3000,
      })
      return
    }

    const newAsset: Asset = {
      id: Date.now().toString(),
      symbol: selectedCrypto.symbol.toUpperCase(),
      name: selectedCrypto.name,
      amount: Number(formData.get('amount')),
      purchasePrice: Number(formData.get('purchasePrice')),
      currentPrice: selectedCrypto.current_price
    }

    if (editingAsset) {
      setAssets(assets.map(asset => 
        asset.id === editingAsset.id ? { ...newAsset, id: asset.id } : asset
      ))
      toast({
        title: "Activo actualizado",
        status: "success",
        duration: 3000,
      })
    } else {
      setAssets([...assets, newAsset])
      toast({
        title: "Activo agregado",
        status: "success",
        duration: 3000,
      })
    }
    
    onClose()
    setEditingAsset(null)
    form.reset()
  }

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset)
    onOpen()
  }

  const handleDelete = (id: string) => {
    setAssets(assets.filter(asset => asset.id !== id))
    toast({
      title: "Activo eliminado",
      status: "info",
      duration: 3000,
    })
  }

  const calculateTotalBalance = () => {
    return assets.reduce((total, asset) => total + (asset.amount * asset.currentPrice), 0)
  }

  const calculateTotalProfit = () => {
    return assets.reduce((total, asset) => 
      total + (asset.amount * (asset.currentPrice - asset.purchasePrice)), 0
    )
  }

  const calculateDistribution = () => {
    const total = calculateTotalBalance()
    return assets.map(asset => ({
      ...asset,
      percentage: (asset.amount * asset.currentPrice / total) * 100
    }))
  }

  if (isLoading) {
    return (
      <Center h="200px">
        <Spinner size="xl" />
      </Center>
    )
  }

  return (
    <VStack spacing={8} align="stretch">
      <Flex justify="space-between" align="center">
        <Text fontSize="2xl" fontWeight="bold">Mi Portfolio</Text>
        <Button leftIcon={<AddIcon />} colorScheme="green" onClick={() => {
          setEditingAsset(null)
          onOpen()
        }}>
          Agregar Activo
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        <Card bg={bgColor}>
          <CardBody>
            <Stat>
              <StatLabel>Balance Total</StatLabel>
              <StatNumber>${calculateTotalBalance().toFixed(2)}</StatNumber>
              <StatHelpText>
                <StatArrow type={calculateTotalProfit() >= 0 ? "increase" : "decrease"} />
                {calculateTotalProfit() >= 0 ? "+" : ""}{calculateTotalProfit().toFixed(2)} USD
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={bgColor}>
          <CardBody>
            <Stat>
              <StatLabel>Activos Totales</StatLabel>
              <StatNumber>{assets.length}</StatNumber>
              <StatHelpText>
                Criptomonedas diferentes
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={bgColor}>
          <CardBody>
            <Stat>
              <StatLabel>ROI Total</StatLabel>
              <StatNumber>
                {calculateTotalBalance() > 0 
                  ? ((calculateTotalProfit() / (calculateTotalBalance() - calculateTotalProfit())) * 100).toFixed(2)
                  : "0"}%
              </StatNumber>
              <StatHelpText>
                Retorno de inversión
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {assets.length > 0 && (
        <Card bg={bgColor}>
          <CardBody>
            <Text fontSize="lg" fontWeight="bold" mb={4}>Distribución de Activos</Text>
            <VStack spacing={4} align="stretch">
              {calculateDistribution().map((asset) => (
                <Box key={asset.id}>
                  <Flex justify="space-between" mb={2}>
                    <Text>{asset.name} ({asset.symbol})</Text>
                    <Text>{asset.percentage.toFixed(2)}%</Text>
                  </Flex>
                  <Progress value={asset.percentage} colorScheme="blue" borderRadius="full" />
                </Box>
              ))}
            </VStack>
          </CardBody>
        </Card>
      )}

      <Card bg={bgColor}>
        <CardBody>
          <Text fontSize="lg" fontWeight="bold" mb={4}>Mis Activos</Text>
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Activo</Th>
                  <Th>Cantidad</Th>
                  <Th>Precio Compra</Th>
                  <Th>Precio Actual</Th>
                  <Th>Valor Total</Th>
                  <Th>Ganancia/Pérdida</Th>
                  <Th>Acciones</Th>
                </Tr>
              </Thead>
              <Tbody>
                {assets.map((asset) => (
                  <Tr key={asset.id}>
                    <Td>{asset.name} ({asset.symbol})</Td>
                    <Td>{asset.amount}</Td>
                    <Td>${asset.purchasePrice}</Td>
                    <Td>${asset.currentPrice}</Td>
                    <Td>${(asset.amount * asset.currentPrice).toFixed(2)}</Td>
                    <Td color={(asset.currentPrice - asset.purchasePrice) >= 0 ? "green.400" : "red.400"}>
                      {((asset.currentPrice - asset.purchasePrice) / asset.purchasePrice * 100).toFixed(2)}%
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <IconButton
                          aria-label="Editar activo"
                          icon={<EditIcon />}
                          size="sm"
                          onClick={() => handleEdit(asset)}
                        />
                        <IconButton
                          aria-label="Eliminar activo"
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          onClick={() => handleDelete(asset.id)}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </CardBody>
      </Card>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleAddAsset}>
            <ModalHeader>
              {editingAsset ? 'Editar Activo' : 'Agregar Nuevo Activo'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Criptomoneda</FormLabel>
                  <Select 
                    name="cryptoId"
                    defaultValue={editingAsset?.symbol}
                    placeholder="Selecciona una criptomoneda"
                  >
                    {availableCryptos.map(crypto => (
                      <option key={crypto.id} value={crypto.id}>
                        {crypto.name} ({crypto.symbol.toUpperCase()}) - Vol: ${(crypto.total_volume / 1000000).toFixed(2)}M
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Cantidad</FormLabel>
                  <Input 
                    name="amount"
                    type="number"
                    step="any"
                    defaultValue={editingAsset?.amount}
                    placeholder="0.00"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Precio de Compra (USD)</FormLabel>
                  <Input 
                    name="purchasePrice"
                    type="number"
                    step="any"
                    defaultValue={editingAsset?.purchasePrice}
                    placeholder="0.00"
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancelar
              </Button>
              <Button colorScheme="blue" type="submit">
                {editingAsset ? 'Actualizar' : 'Agregar'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </VStack>
  )
} 