import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  HStack,
  Badge,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Select,
  FormHelperText,
  Switch,
  useToast,
  Divider,
  IconButton,
  SimpleGrid,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Tooltip,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, BellIcon, CheckIcon, CloseIcon, InfoOutlineIcon } from '@chakra-ui/icons';
import { getActiveTradingPairs } from '../services/api';
import { registerForPushNotifications } from '../services/notificationService';
import { SignalType, ConfidenceLevel } from '../services/tradingSignals';

// Tipos para las alertas
interface Alert {
  id: string;
  symbol: string;
  type: SignalType;
  active: boolean;
  confidenceThreshold: ConfidenceLevel;
  priceTarget?: number;
  priceCondition?: 'above' | 'below';
  notificationType: 'push' | 'email' | 'both';
  createdAt: Date;
  lastTriggered?: Date;
}

// Datos de ejemplo de alertas
const sampleAlerts: Alert[] = [
  {
    id: '1',
    symbol: 'BTC/USDT',
    type: SignalType.BUY,
    active: true,
    confidenceThreshold: ConfidenceLevel.HIGH,
    notificationType: 'push',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    lastTriggered: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    symbol: 'ETH/USDT',
    type: SignalType.BUY,
    active: false,
    confidenceThreshold: ConfidenceLevel.MEDIUM,
    priceTarget: 2800,
    priceCondition: 'below',
    notificationType: 'both',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    symbol: 'SOL/USDT',
    type: SignalType.SELL,
    active: true,
    confidenceThreshold: ConfidenceLevel.VERY_HIGH,
    priceTarget: 140,
    priceCondition: 'above',
    notificationType: 'email',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    lastTriggered: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: '4',
    symbol: 'ADA/USDT',
    type: SignalType.BUY,
    active: true,
    confidenceThreshold: ConfidenceLevel.HIGH,
    notificationType: 'push',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
];

// ID de usuario simulado
const MOCK_USER_ID = 'user123';

// Componente de gestor de alertas
export const AlertsManager: React.FC = () => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  
  const [alerts, setAlerts] = useState<Alert[]>(sampleAlerts);
  const [tradingPairs, setTradingPairs] = useState<string[]>([]);
  const [isCreatingAlert, setIsCreatingAlert] = useState(false);
  const [newAlert, setNewAlert] = useState<Partial<Alert>>({
    symbol: '',
    type: SignalType.BUY,
    active: true,
    confidenceThreshold: ConfidenceLevel.MEDIUM,
    notificationType: 'push',
  });
  const [loading, setLoading] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener pares de trading disponibles
        const pairs = await getActiveTradingPairs();
        setTradingPairs(pairs);
        
        // Comprobar si las notificaciones están habilitadas
        checkNotificationStatus();
      } catch (error) {
        console.error('Error cargando datos iniciales:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los datos iniciales',
          status: 'error',
          duration: 3000,
        });
      }
    };
    
    fetchData();
  }, [toast]);
  
  // Comprobar si las notificaciones están habilitadas
  const checkNotificationStatus = () => {
    // En una aplicación real, esto verificaría el estado de los permisos
    // Aquí simulamos que no están habilitadas inicialmente
    setPushEnabled(false);
  };
  
  // Manejar cambios en el formulario de nueva alerta
  const handleNewAlertChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewAlert(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  // Manejar cambio en el switch
  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setNewAlert(prev => ({
      ...prev,
      [name]: checked,
    }));
  };
  
  // Crear nueva alerta
  const handleCreateAlert = () => {
    // Validar campos
    if (!newAlert.symbol) {
      toast({
        title: 'Campo requerido',
        description: 'Por favor selecciona un activo',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Crear nueva alerta
    const alert: Alert = {
      ...newAlert,
      id: `alert_${Date.now()}`,
      createdAt: new Date(),
      // Asegurar que los campos requeridos estén presentes
      symbol: newAlert.symbol || '',
      type: newAlert.type || SignalType.BUY,
      active: newAlert.active !== undefined ? newAlert.active : true,
      confidenceThreshold: newAlert.confidenceThreshold || ConfidenceLevel.MEDIUM,
      notificationType: newAlert.notificationType || 'push',
    };
    
    setAlerts(prev => [...prev, alert]);
    
    toast({
      title: 'Alerta creada',
      description: `Se ha creado una alerta para ${alert.symbol}`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    
    // Resetear el formulario
    setNewAlert({
      symbol: '',
      type: SignalType.BUY,
      active: true,
      confidenceThreshold: ConfidenceLevel.MEDIUM,
      notificationType: 'push',
    });
    
    onClose();
  };
  
  // Activar/desactivar alerta
  const toggleAlertStatus = (id: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === id ? { ...alert, active: !alert.active } : alert
      )
    );
    
    toast({
      title: 'Estado actualizado',
      description: 'Se ha actualizado el estado de la alerta',
      status: 'success',
      duration: 2000,
    });
  };
  
  // Eliminar alerta
  const deleteAlert = () => {
    if (!isEditing) return;
    
    setAlerts(prev => prev.filter(alert => alert.id !== isEditing));
    
    toast({
      title: 'Alerta eliminada',
      description: `La alerta para ${isEditing} ha sido eliminada`,
      status: 'info',
      duration: 3000,
    });
    
    onDeleteClose();
  };
  
  // Activar notificaciones
  const enableNotifications = async () => {
    setLoading(true);
    
    try {
      const result = await registerForPushNotifications(MOCK_USER_ID);
      
      if (result.success) {
        setPushEnabled(true);
        toast({
          title: 'Notificaciones activadas',
          description: 'Recibirás alertas cuando se cumplan tus condiciones',
          status: 'success',
          duration: 3000,
        });
      } else {
        throw new Error('No se pudo activar las notificaciones');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron activar las notificaciones',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box>
      <VStack spacing={6} align="stretch">
        <Flex justify="space-between" align="center">
          <Heading size="md">Mis Alertas</Heading>
          <HStack>
            <Tooltip label={pushEnabled ? 'Notificaciones activas' : 'Activar notificaciones'}>
              <Button
                leftIcon={<BellIcon />}
                colorScheme={pushEnabled ? 'green' : 'blue'}
                variant={pushEnabled ? 'solid' : 'outline'}
                size="sm"
                onClick={enableNotifications}
                isLoading={loading}
              >
                {pushEnabled ? 'Notificaciones activas' : 'Activar notificaciones'}
              </Button>
            </Tooltip>
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              onClick={onOpen}
              size="sm"
            >
              Nueva Alerta
            </Button>
          </HStack>
        </Flex>
        
        {alerts.length === 0 ? (
          <Box p={6} textAlign="center" bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
            <VStack spacing={4}>
              <Text>Aún no has creado ninguna alerta.</Text>
              <Button
                leftIcon={<AddIcon />}
                colorScheme="blue"
                onClick={onOpen}
              >
                Crear Primera Alerta
              </Button>
            </VStack>
          </Box>
        ) : (
          <VStack spacing={3} align="stretch">
            {alerts.map(alert => (
              <Box
                key={alert.id}
                p={4}
                bg={bgColor}
                borderRadius="lg"
                borderWidth="1px"
                borderColor={borderColor}
                boxShadow="sm"
              >
                <Flex justify="space-between" align="center" mb={2}>
                  <HStack spacing={3}>
                    <Badge
                      colorScheme={alert.active ? 'green' : 'gray'}
                      variant="solid"
                      fontSize="xs"
                      px={2}
                      py={1}
                      borderRadius="full"
                    >
                      {alert.active ? 'Activa' : 'Inactiva'}
                    </Badge>
                    <Heading size="sm">{alert.symbol}</Heading>
                  </HStack>
                  <HStack spacing={2}>
                    <IconButton
                      aria-label={alert.active ? 'Desactivar alerta' : 'Activar alerta'}
                      icon={alert.active ? <CloseIcon /> : <CheckIcon />}
                      size="sm"
                      colorScheme={alert.active ? 'red' : 'green'}
                      variant="ghost"
                      onClick={() => toggleAlertStatus(alert.id)}
                    />
                    <IconButton
                      aria-label="Eliminar alerta"
                      icon={<DeleteIcon />}
                      size="sm"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => {
                        setIsEditing(alert.id);
                        onDeleteOpen();
                      }}
                    />
                  </HStack>
                </Flex>
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                  <HStack>
                    <Badge colorScheme={alert.type === SignalType.BUY ? 'blue' : 'red'}>
                      {alert.type === SignalType.BUY ? 'Compra' : 'Venta'}
                    </Badge>
                    <Text fontSize="sm">
                      Confianza &gt; {alert.confidenceThreshold}%
                    </Text>
                  </HStack>
                  
                  {alert.priceTarget && alert.priceCondition && (
                    <HStack>
                      <Text fontSize="sm">
                        Precio {alert.priceCondition === 'above' ? '>' : '<'} ${alert.priceTarget.toLocaleString()}
                      </Text>
                    </HStack>
                  )}
                  
                  <HStack>
                    <Text fontSize="sm" color="gray.500">
                      Notificación: {
                        alert.notificationType === 'push' ? 'Push' :
                        alert.notificationType === 'email' ? 'Email' : 'Push y Email'
                      }
                    </Text>
                  </HStack>
                  
                  {alert.lastTriggered && (
                    <HStack>
                      <Text fontSize="sm" color="gray.500">
                        Última activación: {new Date(alert.lastTriggered).toLocaleDateString()}
                      </Text>
                    </HStack>
                  )}
                </SimpleGrid>
              </Box>
            ))}
          </VStack>
        )}
      </VStack>
      
      {/* Modal para crear nueva alerta */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent bg={bgColor}>
          <ModalHeader>Crear Nueva Alerta</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Símbolo</FormLabel>
                <Select 
                  name="symbol"
                  value={newAlert.symbol} 
                  onChange={handleNewAlertChange}
                  placeholder="Selecciona un activo"
                >
                  {tradingPairs.map(symbol => (
                    <option key={symbol} value={symbol}>{symbol}</option>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Tipo de Señal</FormLabel>
                <Select name="type" value={newAlert.type} onChange={handleNewAlertChange}>
                  <option value={SignalType.BUY}>Compra</option>
                  <option value={SignalType.SELL}>Venta</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Umbral de Confianza</FormLabel>
                <Input
                  name="confidenceThreshold"
                  type="number"
                  min={0}
                  max={100}
                  value={newAlert.confidenceThreshold}
                  onChange={handleNewAlertChange}
                />
                <FormHelperText>Porcentaje mínimo de confianza (0-100)</FormHelperText>
              </FormControl>
              
              <HStack align="flex-start" spacing={4}>
                <FormControl>
                  <FormLabel>Precio Objetivo</FormLabel>
                  <Input
                    name="priceTarget"
                    type="number"
                    min={0}
                    step="0.01"
                    value={newAlert.priceTarget || ''}
                    onChange={handleNewAlertChange}
                    placeholder="Opcional"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Condición</FormLabel>
                  <Select
                    name="priceCondition"
                    value={newAlert.priceCondition || ''}
                    onChange={handleNewAlertChange}
                    placeholder="Seleccionar"
                    isDisabled={!newAlert.priceTarget}
                  >
                    <option value="above">Por encima</option>
                    <option value="below">Por debajo</option>
                  </Select>
                </FormControl>
              </HStack>
              
              <FormControl>
                <FormLabel>Tipo de Notificación</FormLabel>
                <Select name="notificationType" value={newAlert.notificationType} onChange={handleNewAlertChange}>
                  <option value="push">Push</option>
                  <option value="email">Email</option>
                  <option value="both">Ambos</option>
                </Select>
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="active" mb="0">
                  Activar Alerta
                </FormLabel>
                <Switch
                  id="active"
                  name="active"
                  isChecked={newAlert.active}
                  onChange={handleSwitchChange}
                  colorScheme="green"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancelar
            </Button>
            <Button colorScheme="blue" onClick={handleCreateAlert}>
              Guardar Alerta
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Modal de confirmación para eliminar alerta */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} size="sm">
        <ModalOverlay />
        <ModalContent bg={bgColor}>
          <ModalHeader>Confirmar Eliminación</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            ¿Estás seguro de que quieres eliminar esta alerta para {isEditing}?
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteClose}>
              Cancelar
            </Button>
            <Button colorScheme="red" onClick={deleteAlert}>
              Eliminar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}; 