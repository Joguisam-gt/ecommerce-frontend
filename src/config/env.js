/**
 * Configuracion de entorno del frontend.
 *
 * Las variables EXPO_PUBLIC_* se incrustan en el bundle durante la compilacion,
 * por eso se leen con acceso literal a process.env.
 */
import { Platform } from 'react-native';

/** Host por defecto: el emulador de Android llega al equipo anfitrion por 10.0.2.2. */
const DEFAULT_HOST = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

/** Normaliza una URL base quitando las barras finales. */
function trimTrailingSlash(url) {
  return String(url).replace(/\/+$/, '');
}

/** URL base de la API (incluye /api/v1; la cookie de refresh viaja solo a /api/v1/auth). */
export const API_BASE_URL = trimTrailingSlash(
  process.env.EXPO_PUBLIC_API_BASE_URL || `${DEFAULT_HOST}/api/v1`,
);

/** Endpoint opcional para subir comprobantes de transferencia; null si no esta configurado. */
export const RECEIPT_UPLOAD_URL = process.env.EXPO_PUBLIC_RECEIPT_UPLOAD_URL || null;

/** Moneda de la tienda (quetzales). */
export const CURRENCY = 'GTQ';
