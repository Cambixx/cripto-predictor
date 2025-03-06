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
import { registerForPushNotifications, saveAlert, getUserAlerts, deleteAlert, updateAlert, saveUserEmail, UserAlert } from '../services/notificationService';
import { SignalType, ConfidenceLevel } from '../services/tradingSignals';

// ID de usuario simulado - en una aplicación real, vendría del sistema de autenticación
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
  
  // Estado para las alertas
  const [alerts, setAlerts] = useState<UserAlert[]>([]);
  const [tradingPairs, setTradingPairs] = useState<string[]>([]);
  const [isCreatingAlert, setIsCreatingAlert] = useState(false);
  const [newAlert, setNewAlert] = useState<Partial<UserAlert>>({
    symbol: '',
    signalType: 'buy',
    enabled: true,
    confidenceThreshold: 0.7,
    notificationType: 'push',
  });
  const [loading, setLoading] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Obtener pares de trading disponibles
        const pairs = await getActiveTradingPairs();
        setTradingPairs(pairs);
        
        // Obtener alertas del usuario
        const userAlerts = getUserAlerts(MOCK_USER_ID);
        setAlerts(userAlerts);
        
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
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);
  
  // Comprobar si las notificaciones están habilitadas
  const checkNotificationStatus = () => {
    // En una aplicación real, verificaría el estado de los permisos
    // y si el usuario tiene un token guardado
    setPushEnabled(false);
  };
  
  // Manejar cambios en el formulario de nueva alerta
  const handleNewAlertChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewAlert(prev => ({
      ...prev,
      [name]: name === 'confidenceThreshold' ? parseFloat(value) : value,
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

    // Convertir valores de la nueva alerta al formato correcto
    const alertToSave: Omit<UserAlert, 'id' | 'createdAt' | 'userId' | 'triggerCount'> = {
      symbol: newAlert.symbol || '',
      signalType: newAlert.signalType || 'buy',
      enabled: newAlert.enabled !== undefined ? newAlert.enabled : true,
      confidenceThreshold: newAlert.confidenceThreshold || 0.7,
      notificationType: newAlert.notificationType || 'push',
      priceTarget: newAlert.priceTarget,
      priceTargetType: newAlert.priceTargetType as 'above' | 'below' | undefined,
    };
    
    // Guardar la alerta
    const savedAlert = saveAlert(MOCK_USER_ID, alertToSave);
    
    // Actualizar el estado local
    setAlerts(prev => [...prev, savedAlert]);
    
    toast({
      title: 'Alerta creada',
      description: `Se ha creado una alerta para ${savedAlert.symbol}`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    
    // Resetear el formulario
    setNewAlert({
      symbol: '',
      signalType: 'buy',
      enabled: true,
      confidenceThreshold: 0.7,
      notificationType: 'push',
    });
    
    onClose();
  };
  
  // Activar/desactivar alerta
  const toggleAlertStatus = (id: string) => {
    const alertToUpdate = alerts.find(alert => alert.id === id);
    if (!alertToUpdate) return;
    
    // Actualizar la alerta
    const updatedAlert = updateAlert(MOCK_USER_ID, id, { 
      enabled: !alertToUpdate.enabled 
    });
    
    if (updatedAlert) {
      // Actualizar el estado local
      setAlerts(prev => 
        prev.map(alert => 
          alert.id === id ? updatedAlert : alert
        )
      );
      
      toast({
        title: 'Estado actualizado',
        description: `La alerta para ${updatedAlert.symbol} está ahora ${updatedAlert.enabled ? 'activada' : 'desactivada'}`,
        status: 'success',
        duration: 2000,
      });
    }
  };
  
  // Eliminar alerta
  const handleDeleteAlert = () => {
    if (!isEditing) return;
    
    // Encontrar el símbolo de la alerta a eliminar para mostrar en la confirmación
    const alertToDelete = alerts.find(alert => alert.id === isEditing);
    if (!alertToDelete) {
      onDeleteClose();
      setIsEditing(null);
      return;
    }
    
    // Eliminar la alerta
    const success = deleteAlert(MOCK_USER_ID, isEditing);
    
    if (success) {
      // Actualizar el estado local
      setAlerts(prev => prev.filter(alert => alert.id !== isEditing));
      
      toast({
        title: 'Alerta eliminada',
        description: `La alerta para ${alertToDelete.symbol} ha sido eliminada`,
        status: 'info',
        duration: 3000,
      });
    } else {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la alerta',
        status: 'error',
        duration: 3000,
      });
    }
    
    onDeleteClose();
    setIsEditing(null);
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
  
  // Guardar correo electrónico del usuario
  const handleSaveEmail = () => {
    if (!userEmail || !userEmail.includes('@')) {
      toast({
        title: 'Email inválido',
        description: 'Por favor introduce un email válido',
        status: 'error',
        duration: 3000,
      });
      return;
    }
    
    saveUserEmail(MOCK_USER_ID, userEmail);
    
    toast({
      title: 'Email guardado',
      description: 'Tu email ha sido guardado para recibir notificaciones',
      status: 'success',
      duration: 3000,
    });
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
                      colorScheme={alert.enabled ? 'green' : 'gray'}
                      variant="solid"
                      fontSize="xs"
                      px={2}
                      py={1}
                      borderRadius="full"
                    >
                      {alert.enabled ? 'Activa' : 'Inactiva'}
                    </Badge>
                    <Heading size="sm">{alert.symbol}</Heading>
                  </HStack>
                  <HStack spacing={2}>
                    <IconButton
                      aria-label={alert.enabled ? 'Desactivar alerta' : 'Activar alerta'}
                      icon={alert.enabled ? <CloseIcon /> : <CheckIcon />}
                      size="sm"
                      colorScheme={alert.enabled ? 'red' : 'green'}
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
                    <Badge colorScheme={alert.signalType === 'buy' ? 'blue' : 'red'}>
                      {alert.signalType === 'buy' ? 'Compra' : 'Venta'}
                    </Badge>
                    <Text fontSize="sm">
                      Confianza &gt; {(alert.confidenceThreshold ? alert.confidenceThreshold * 100 : 0).toFixed(0)}%
                    </Text>
                  </HStack>
                  
                  {alert.priceTarget && alert.priceTargetType && (
                    <HStack>
                      <Text fontSize="sm">
                        Precio {alert.priceTargetType === 'above' ? '>' : '<'} ${alert.priceTarget.toLocaleString()}
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
                <Select name="signalType" value={newAlert.signalType} onChange={handleNewAlertChange}>
                  <option value="buy">Compra</option>
                  <option value="sell">Venta</option>
                  <option value="both">Ambos</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Umbral de Confianza (%)</FormLabel>
                <Input
                  name="confidenceThreshold"
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={newAlert.confidenceThreshold}
                  onChange={handleNewAlertChange}
                />
                <FormHelperText>Porcentaje mínimo de confianza (0-1)</FormHelperText>
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
                    name="priceTargetType"
                    value={newAlert.priceTargetType || ''}
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
                {(newAlert.notificationType === 'email' || newAlert.notificationType === 'both') && (
                  <HStack mt={2}>
                    <Input 
                      placeholder="Tu email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                    />
                    <Button size="sm" onClick={handleSaveEmail}>Guardar</Button>
                  </HStack>
                )}
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="enabled" mb="0">
                  Activar Alerta
                </FormLabel>
                <Switch
                  id="enabled"
                  name="enabled"
                  isChecked={newAlert.enabled}
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
            {isEditing ? (
              <Text>
                ¿Estás seguro de que quieres eliminar esta alerta?
              </Text>
            ) : (
              <Text>Selecciona una alerta para eliminar</Text>
            )}
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteClose}>
              Cancelar
            </Button>
            <Button 
              colorScheme="red" 
              onClick={handleDeleteAlert} 
              isDisabled={!isEditing}
            >
              Eliminar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}; 