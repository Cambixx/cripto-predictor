import { TradingSignal } from './tradingSignals';

// Las claves y configuraciones para servicios externos se cargarían desde variables de entorno
const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

const EMAIL_API_KEY = import.meta.env.VITE_EMAIL_API_KEY || '';
const EMAIL_API_URL = import.meta.env.VITE_EMAIL_API_URL || '';

export interface AlertConfig {
  symbol: string;
  priceTarget?: number;
  priceTargetType?: 'above' | 'below';
  notificationType: 'push' | 'email' | 'both';
  signalType?: 'buy' | 'sell' | 'both';
  confidenceThreshold?: number;
  enabled: boolean;
  userId: string;
  id: string;
  createdAt: number;
}

export interface UserAlert extends AlertConfig {
  lastTriggered?: number;
  triggerCount: number;
}

// Clave para almacenamiento en localStorage
const ALERTS_STORAGE_KEY = 'trading_user_alerts';
const USER_TOKENS_STORAGE_KEY = 'trading_user_tokens';
const USER_EMAILS_STORAGE_KEY = 'trading_user_emails';

// En producción, esta información también estaría en la base de datos
// Para la aplicación de demostración, usamos almacenamiento local
const userTokens: Map<string, string> = new Map(); // userId -> token de notificación
const userEmails: Map<string, string> = new Map(); // userId -> dirección de correo

/**
 * Guardar una alerta en localStorage
 */
export const persistAlertsToStorage = (alerts: UserAlert[]): void => {
  try {
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
  } catch (error) {
    console.error('Error guardando alertas en localStorage:', error);
  }
};

/**
 * Guardar token de notificación push en localStorage
 */
export const saveUserToken = (userId: string, token: string): void => {
  userTokens.set(userId, token);
  try {
    const tokens = JSON.parse(localStorage.getItem(USER_TOKENS_STORAGE_KEY) || '{}');
    tokens[userId] = token;
    localStorage.setItem(USER_TOKENS_STORAGE_KEY, JSON.stringify(tokens));
  } catch (error) {
    console.error('Error guardando token en localStorage:', error);
  }
};

/**
 * Guardar email de usuario en localStorage
 */
export const saveUserEmail = (userId: string, email: string): void => {
  userEmails.set(userId, email);
  try {
    const emails = JSON.parse(localStorage.getItem(USER_EMAILS_STORAGE_KEY) || '{}');
    emails[userId] = email;
    localStorage.setItem(USER_EMAILS_STORAGE_KEY, JSON.stringify(emails));
  } catch (error) {
    console.error('Error guardando email en localStorage:', error);
  }
};

/**
 * Cargar información de usuario desde localStorage
 */
export const loadUserInfo = (): void => {
  try {
    // Cargar tokens
    const tokensString = localStorage.getItem(USER_TOKENS_STORAGE_KEY);
    if (tokensString) {
      const tokens = JSON.parse(tokensString);
      Object.entries(tokens).forEach(([userId, token]) => {
        userTokens.set(userId, token as string);
      });
    }
    
    // Cargar emails
    const emailsString = localStorage.getItem(USER_EMAILS_STORAGE_KEY);
    if (emailsString) {
      const emails = JSON.parse(emailsString);
      Object.entries(emails).forEach(([userId, email]) => {
        userEmails.set(userId, email as string);
      });
    }
  } catch (error) {
    console.error('Error cargando información de usuario desde localStorage:', error);
  }
};

// Cargar la información de usuario al inicializar
loadUserInfo();

/**
 * Cargar alertas desde localStorage
 */
export const loadAlertsFromStorage = (): UserAlert[] => {
  try {
    const savedAlerts = localStorage.getItem(ALERTS_STORAGE_KEY);
    if (savedAlerts) {
      return JSON.parse(savedAlerts, (key, value) => {
        // Convertir fechas guardadas como strings a objetos Date
        if (key === 'createdAt' || key === 'lastTriggered') {
          return value ? new Date(value).getTime() : null;
        }
        return value;
      });
    }
  } catch (error) {
    console.error('Error cargando alertas desde localStorage:', error);
  }
  return [];
};

/**
 * Guardar una nueva configuración de alerta para un usuario
 */
export const saveAlert = (userId: string, alertConfig: Omit<AlertConfig, 'id' | 'createdAt' | 'userId'>): UserAlert => {
  // Obtener las alertas actuales desde localStorage
  const userAlertsList = loadAlertsFromStorage();
  
  const newAlert: UserAlert = {
    ...alertConfig,
    userId,
    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    triggerCount: 0,
    enabled: alertConfig.enabled ?? true
  };
  
  // Añadir la nueva alerta a la lista
  userAlertsList.push(newAlert);
  
  // Guardar la lista actualizada
  persistAlertsToStorage(userAlertsList);
  
  return newAlert;
};

/**
 * Obtener todas las alertas de un usuario
 */
export const getUserAlerts = (userId: string): UserAlert[] => {
  const allAlerts = loadAlertsFromStorage();
  return allAlerts.filter(alert => alert.userId === userId);
};

/**
 * Eliminar una alerta de un usuario
 */
export const deleteAlert = (userId: string, alertId: string): boolean => {
  const allAlerts = loadAlertsFromStorage();
  const initialLength = allAlerts.length;
  
  const filteredAlerts = allAlerts.filter(alert => !(alert.userId === userId && alert.id === alertId));
  
  if (filteredAlerts.length !== initialLength) {
    persistAlertsToStorage(filteredAlerts);
    return true;
  }
  
  return false;
};

/**
 * Actualizar una alerta existente
 */
export const updateAlert = (userId: string, alertId: string, updates: Partial<AlertConfig>): UserAlert | null => {
  const allAlerts = loadAlertsFromStorage();
  const alertIndex = allAlerts.findIndex(alert => alert.userId === userId && alert.id === alertId);
  
  if (alertIndex === -1) {
    return null;
  }
  
  const updatedAlert = {
    ...allAlerts[alertIndex],
    ...updates,
  };
  
  allAlerts[alertIndex] = updatedAlert;
  persistAlertsToStorage(allAlerts);
  
  return updatedAlert;
};

/**
 * Procesar señales de trading para las alertas configuradas de un usuario
 */
export const processSignalAlerts = (signal: TradingSignal, userId: string): UserAlert[] => {
  const triggeredAlerts: UserAlert[] = [];
  const userAlertsList = getUserAlerts(userId);
  
  for (const alert of userAlertsList) {
    if (!alert.enabled) continue;
    
    // Comprobamos que sea para el mismo símbolo
    if (alert.symbol !== signal.symbol) continue;
    
    // Comprobamos el tipo de señal (compra/venta)
    if (alert.signalType && alert.signalType !== 'both' && alert.signalType !== signal.signal) {
      continue;
    }
    
    // Comprobamos el umbral de confianza
    if (alert.confidenceThreshold && signal.confidence < alert.confidenceThreshold) {
      continue;
    }
    
    // Comprobamos condiciones de precio
    if (
      alert.priceTarget && 
      alert.priceTargetType && 
      (
        (alert.priceTargetType === 'above' && signal.price < alert.priceTarget) ||
        (alert.priceTargetType === 'below' && signal.price > alert.priceTarget)
      )
    ) {
      continue;
    }
    
    // Esta alerta debe activarse
    const updatedAlert = {
      ...alert,
      lastTriggered: Date.now(),
      triggerCount: (alert.triggerCount || 0) + 1
    };
    
    // Actualizamos la alerta en el almacén
    const alertIndex = userAlertsList.findIndex(a => a.id === alert.id);
    userAlertsList[alertIndex] = updatedAlert;
    
    // Enviamos la notificación
    sendNotification(updatedAlert, signal);
    
    triggeredAlerts.push(updatedAlert);
  }
  
  // Guardamos las alertas actualizadas
  if (triggeredAlerts.length > 0) {
    persistAlertsToStorage(userAlertsList);
  }
  
  return triggeredAlerts;
};

/**
 * Enviar notificación según la configuración de la alerta
 */
const sendNotification = async (alert: UserAlert, signal: TradingSignal) => {
  const title = `Alerta de Trading: ${signal.symbol}`;
  const body = `Señal de ${signal.signal === 'buy' ? 'compra' : 'venta'} detectada a $${signal.price.toFixed(2)} con confianza ${(signal.confidence * 100).toFixed(0)}%`;
  
  try {
    if (alert.notificationType === 'push' || alert.notificationType === 'both') {
      await sendPushNotification(
        alert.userId, 
        title, 
        body, 
        { 
          signalId: `${signal.symbol}_${signal.timestamp}`,
          alertId: alert.id,
          type: signal.signal,
          price: signal.price,
          confidence: signal.confidence
        }
      );
    }
    
    if (alert.notificationType === 'email' || alert.notificationType === 'both') {
      const email = userEmails.get(alert.userId);
      if (email) {
        await sendEmailNotification(
          email,
          title,
          `
          <h2>Alerta de Trading Activada</h2>
          <p><strong>Símbolo:</strong> ${signal.symbol}</p>
          <p><strong>Tipo:</strong> Señal de ${signal.signal === 'buy' ? 'compra' : 'venta'}</p>
          <p><strong>Precio:</strong> $${signal.price.toFixed(2)}</p>
          <p><strong>Confianza:</strong> ${(signal.confidence * 100).toFixed(0)}%</p>
          <p><strong>Timestamp:</strong> ${new Date(signal.timestamp).toLocaleString()}</p>
          <p><strong>Razones:</strong> ${signal.reasons.join(', ')}</p>
          <hr>
          <p>Para más detalles, abra la aplicación.</p>
          `
        );
      }
    }
  } catch (error) {
    console.error('Error al enviar notificación:', error);
  }
};

type NotificationType = 'push' | 'email' | 'both';
type AlertResult = { success: boolean; message?: string; };

/**
 * Registrar al usuario para recibir notificaciones push
 * En una implementación real, aquí se integraría con Firebase Cloud Messaging (FCM)
 */
export const registerForPushNotifications = async (userId: string, token?: string): Promise<AlertResult> => {
  try {
    // En producción, esto inicializaría Firebase y solicitaría permisos al usuario
    // Requeriría instalar la biblioteca firebase/messaging
    
    // Ejemplo de código para una implementación real:
    /*
    // Inicializar Firebase
    import { initializeApp } from 'firebase/app';
    import { getMessaging, getToken } from 'firebase/messaging';
    
    const app = initializeApp(FIREBASE_CONFIG);
    const messaging = getMessaging(app);
    
    // Solicitar permiso y obtener token
    const currentToken = token || await getToken(messaging, { 
      vapidKey: FIREBASE_VAPID_KEY 
    });
    
    // Guardar el token en la base de datos
    */
    
    // Para esta versión, simplemente almacenamos un token simulado
    const deviceToken = token || `device_token_${Math.random().toString(36).substr(2, 9)}`;
    userTokens.set(userId, deviceToken);
    
    console.log(`[PRODUCCIÓN] Registrado token de notificaciones para usuario ${userId}: ${deviceToken}`);
    
    return {
      success: true,
      message: 'Notificaciones push activadas correctamente'
    };
  } catch (error) {
    console.error('Error al registrar notificaciones push:', error);
    return {
      success: false,
      message: 'No se pudieron activar las notificaciones push'
    };
  }
};

/**
 * Enviar una notificación push al usuario
 * En una implementación real, se enviaría a través de Firebase Cloud Messaging
 */
export const sendPushNotification = async (
  userId: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<AlertResult> => {
  try {
    const token = userTokens.get(userId);
    
    if (!token) {
      return {
        success: false,
        message: 'El usuario no tiene un token de notificación registrado'
      };
    }
    
    // En producción, aquí enviaríamos la notificación a través de Firebase
    // Ejemplo de código para una implementación real:
    /*
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${FIREBASE_SERVER_KEY}`
      },
      body: JSON.stringify({
        to: token,
        notification: {
          title,
          body
        },
        data
      })
    });
    
    const responseData = await response.json();
    */
    
    console.log(`[PRODUCCIÓN] Enviando notificación push a ${userId} (token: ${token})`);
    console.log(`Título: ${title}`);
    console.log(`Cuerpo: ${body}`);
    if (data) console.log(`Datos: ${JSON.stringify(data)}`);
    
    return {
      success: true,
      message: 'Notificación enviada correctamente'
    };
  } catch (error) {
    console.error('Error al enviar notificación push:', error);
    return {
      success: false,
      message: 'No se pudo enviar la notificación push'
    };
  }
};

/**
 * Enviar una notificación por email
 * En una implementación real, esto usaría un servicio como SendGrid, Mailgun, etc.
 */
export const sendEmailNotification = async (
  email: string,
  subject: string,
  content: string
): Promise<AlertResult> => {
  try {
    if (!email || !email.includes('@')) {
      return {
        success: false,
        message: 'Dirección de email inválida'
      };
    }
    
    // En producción, aquí enviaríamos el email a través de un servicio
    // Ejemplo de código para una implementación real usando una API RESTful:
    /*
    const response = await fetch(EMAIL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${EMAIL_API_KEY}`
      },
      body: JSON.stringify({
        to: email,
        subject,
        html: content
      })
    });
    
    const responseData = await response.json();
    */
    
    console.log(`[PRODUCCIÓN] Enviando email a ${email}`);
    console.log(`Asunto: ${subject}`);
    console.log(`Contenido: ${content.substring(0, 100)}...`);
    
    return {
      success: true,
      message: 'Email enviado correctamente'
    };
  } catch (error) {
    console.error('Error al enviar email:', error);
    return {
      success: false,
      message: 'No se pudo enviar el email'
    };
  }
};

/**
 * Registrar el correo electrónico de un usuario para notificaciones
 */
export const registerUserEmail = (userId: string, email: string): boolean => {
  if (!email || !email.includes('@')) {
    return false;
  }
  
  userEmails.set(userId, email);
  return true;
};

/**
 * Verificar condiciones de una alerta
 */
export const checkAlertConditions = (
  alert: UserAlert,
  currentPrice: number,
  signalConfidence: number,
  signalType: 'buy' | 'sell' | null
): boolean => {
  if (!alert.enabled) return false;
  
  // Verificar tipo de señal
  if (alert.signalType && alert.signalType !== 'both' && signalType && alert.signalType !== signalType) {
    return false;
  }
  
  // Verificar umbral de confianza
  if (alert.confidenceThreshold && signalConfidence < alert.confidenceThreshold) {
    return false;
  }
  
  // Verificar condiciones de precio
  if (
    alert.priceTarget && 
    alert.priceTargetType && 
    (
      (alert.priceTargetType === 'above' && currentPrice < alert.priceTarget) ||
      (alert.priceTargetType === 'below' && currentPrice > alert.priceTarget)
    )
  ) {
    return false;
  }
  
  return true;
};

/**
 * Formatear mensaje de alerta
 */
export const formatAlertMessage = (
  symbol: string,
  type: 'price' | 'signal',
  value: number | string
): string => {
  if (type === 'price') {
    return `El precio de ${symbol} ha alcanzado $${Number(value).toFixed(2)}`;
  } else {
    return `Nueva señal de ${value} detectada para ${symbol}`;
  }
}; 