/**
 * Utilidades puras de la caja y el POS: patrones de validacion alineados con
 * checkout.validator.js del backend, armado de payloads sin claves vacias,
 * formateo de tarjeta y archivos, y traduccion de errores de la API a textos.
 */

/** Codigo de cupon: 3 a 30 caracteres seguros. */
export const COUPON_PATTERN = /^[A-Za-z0-9_-]{3,30}$/;

/** NIT guatemalteco o CF (igual que NIT_PATTERN del backend). */
export const NIT_PATTERN = /^(\d{1,12}-?[\dKk]|CF)$/;

/** Cuenta bancaria de origen (senderAccountNumber). */
export const ACCOUNT_PATTERN = /^[0-9-]{4,34}$/;

/** Numero de autorizacion de la transferencia. */
export const AUTHORIZATION_PATTERN = /^[A-Za-z0-9-]{3,64}$/;

/** Codigo de pais ISO 3166-1 alfa-2. */
export const COUNTRY_PATTERN = /^[A-Za-z]{2}$/;

/** Monto con hasta 2 decimales. */
const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

/** Tamano maximo del comprobante: 5 MB. */
export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

/** Tipos MIME aceptados para el comprobante. */
export const RECEIPT_PICKER_TYPES = ['image/*', 'application/pdf'];

/** Textos claros para los motivos de rechazo de cupon. */
const COUPON_MESSAGES = {
  COUPON_EXPIRED: 'El cupon ha expirado.',
  COUPON_NOT_FOUND: 'El cupon no existe. Revisa el codigo.',
  COUPON_INACTIVE: 'El cupon no esta activo.',
  COUPON_NOT_STARTED: 'El cupon aun no esta vigente.',
  COUPON_USAGE_LIMIT_REACHED: 'El cupon alcanzo su limite de usos.',
  COUPON_USER_LIMIT_REACHED: 'Ya usaste este cupon el maximo de veces permitido.',
  COUPON_MIN_ORDER_NOT_MET: 'Tu compra no alcanza el monto minimo para este cupon.',
  COUPON_NOT_APPLICABLE: 'El cupon no aplica a los productos de tu carrito.',
  CART_EMPTY: 'Tu carrito esta vacio.',
};

/**
 * Mensaje legible para un error al aplicar un cupon.
 * @param {{ code?: string, message?: string }} error
 * @returns {string}
 */
export function couponErrorMessage(error) {
  const mapped = error && COUPON_MESSAGES[error.code];
  if (mapped) return mapped;
  return (error && error.message) || 'No se pudo validar el cupon.';
}

/**
 * Unidades disponibles informadas por un error INSUFFICIENT_STOCK.
 * @param {{ details?: object, body?: object }} error
 * @returns {number | null}
 */
export function availableStockOf(error) {
  const fromDetails = error && error.details && error.details.availableStock;
  if (typeof fromDetails === 'number') return fromDetails;
  const fromBody = error && error.body && error.body.availableStock;
  return typeof fromBody === 'number' ? fromBody : null;
}

/**
 * Texto estandar para falta de inventario.
 * @param {object} error
 * @returns {string}
 */
export function stockMessage(error) {
  const available = availableStockOf(error);
  if (available === null) return 'No hay suficientes unidades en inventario.';
  return `Solo hay disponibles ${available} unidades en inventario`;
}

/**
 * Lista de errores de campo de un VALIDATION_ERROR (array de { field, message }).
 * @param {object} error
 * @returns {Array<{ field: string, message: string }>}
 */
export function validationDetails(error) {
  const details = error && error.details;
  if (!Array.isArray(details)) return [];
  return details.filter((item) => item && typeof item.message === 'string');
}

/**
 * Traduce un error del checkout a una accion de la pantalla.
 * kind: 'stock' (modal con volver al carrito), 'coupon' (alerta + refrescar carrito),
 * 'idempotency' (regenerar clave) o 'alert' (alerta simple).
 * @param {object} error ApiError
 * @returns {{ kind: string, message: string, details: Array<{ field: string, message: string }> }}
 */
export function checkoutErrorFeedback(error) {
  const code = error && error.code;
  const status = error && error.status;
  if (code === 'INSUFFICIENT_STOCK') return { kind: 'stock', message: stockMessage(error), details: [] };
  if (code === 'COUPON_NO_LONGER_VALID') {
    return {
      kind: 'coupon',
      message: 'El cupon de tu carrito ya no es valido. Actualizamos el total; revisalo antes de pagar.',
      details: [],
    };
  }
  if (code === 'PAYMENT_DECLINED' || status === 402) {
    return { kind: 'alert', message: 'El pago fue rechazado. Verifica los datos o usa otro metodo de pago.', details: [] };
  }
  if (code === 'MAINTENANCE_MODE' || status === 503) {
    return { kind: 'alert', message: 'La tienda esta en mantenimiento. Intenta de nuevo mas tarde.', details: [] };
  }
  if (code === 'VALIDATION_ERROR') {
    return { kind: 'alert', message: 'Revisa los datos del formulario:', details: validationDetails(error) };
  }
  if (code === 'IDEMPOTENCY_KEY_CONFLICT') {
    return { kind: 'idempotency', message: 'Se detecto un pedido previo con otro metodo de pago. Intenta de nuevo.', details: [] };
  }
  if (code === 'PCI_DATA_FORBIDDEN') {
    return { kind: 'alert', message: 'La solicitud fue bloqueada por contener datos de tarjeta. No se envio ningun pago.', details: [] };
  }
  if (code === 'NETWORK_ERROR') {
    return { kind: 'alert', message: 'No hay conexion con el servidor. Puedes reintentar sin duplicar el pedido.', details: [] };
  }
  return { kind: 'alert', message: (error && error.message) || 'No se pudo completar el pedido.', details: [] };
}

/**
 * Copia un objeto omitiendo claves con undefined, null o texto vacio.
 * El backend rechaza campos no declarados y valida tipos, por eso no se envian vacios.
 * @param {object} source
 * @returns {object}
 */
export function omitEmpty(source) {
  const result = {};
  Object.keys(source).forEach((key) => {
    const value = source[key];
    if (value === undefined || value === null) return;
    if (typeof value === 'string' && value.trim() === '') return;
    result[key] = typeof value === 'string' ? value.trim() : value;
  });
  return result;
}

/**
 * Nombre completo del usuario (firstName + lastName del backend, o name).
 * @param {{ firstName?: string, lastName?: string, name?: string } | null} user
 */
export function fullNameOf(user) {
  if (!user) return '';
  const parts = [user.firstName, user.lastName].filter((part) => typeof part === 'string' && part.trim() !== '');
  return parts.length > 0 ? parts.join(' ').trim() : String(user.name || '').trim();
}

/**
 * Estado inicial del contacto y la direccion de envio.
 * @param {{ firstName?: string, lastName?: string, email?: string, phone?: string } | null} user
 */
export function initialContact(user) {
  return {
    customerName: fullNameOf(user),
    email: (user && user.email) || '',
    phone: (user && user.phone) || '',
    line1: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'GT',
  };
}

/**
 * Indica si el usuario empezo a llenar la direccion (para metodos donde es opcional).
 * @param {object} contact
 */
export function hasAddress(contact) {
  return contact.line1.trim() !== '' || contact.city.trim() !== '';
}

/**
 * Direccion de envio con las claves exactas del addressSchema del backend.
 * @param {object} contact
 */
export function buildShippingAddress(contact) {
  return omitEmpty({
    line1: contact.line1,
    city: contact.city,
    state: contact.state,
    postalCode: contact.postalCode,
    country: contact.country.trim().toUpperCase(),
  });
}

/**
 * Solo digitos de un texto.
 * @param {string} text
 */
export const digitsOnly = (text) => String(text || '').replace(/\D/g, '');

/**
 * Longitud del numero segun la marca (Amex 15, resto 16).
 * @param {string} brand
 */
export const cardLengthFor = (brand) => (brand === 'Amex' ? 15 : 16);

/**
 * Longitud del CVV segun la marca (Amex 4, resto 3).
 * @param {string} brand
 */
export const cvvLengthFor = (brand) => (brand === 'Amex' ? 4 : 3);

/**
 * Formatea digitos de tarjeta en grupos (Amex 4-6-5, resto 4-4-4-4).
 * @param {string} digits
 * @param {string} brand
 */
export function formatCardNumber(digits, brand) {
  const groups = brand === 'Amex' ? [4, 6, 5] : [4, 4, 4, 4];
  const parts = [];
  let index = 0;
  groups.forEach((size) => {
    if (index < digits.length) parts.push(digits.slice(index, index + size));
    index += size;
  });
  return parts.join(' ');
}

/**
 * Formatea la expiracion como MM/AA mientras se escribe.
 * @param {string} text
 */
export function formatExpiryInput(text) {
  const digits = digitsOnly(text).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

/**
 * Convierte el texto del monto a numero valido (>0, max 2 decimales) o null.
 * @param {string} text
 * @returns {number | null}
 */
export function parseAmount(text) {
  const normalized = String(text || '').trim().replace(',', '.');
  if (!AMOUNT_PATTERN.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * Indica si un archivo es imagen o PDF.
 * @param {{ mimeType?: string, name?: string }} file
 */
export function isAcceptedReceiptType(file) {
  const mime = (file && file.mimeType) || '';
  if (mime.startsWith('image/') || mime === 'application/pdf') return true;
  const name = ((file && file.name) || '').toLowerCase();
  return /\.(png|jpe?g|gif|webp|heic|pdf)$/.test(name);
}

/**
 * Valida tipo y tamano del comprobante; devuelve mensaje de error o null.
 * @param {{ mimeType?: string, name?: string, size?: number }} file
 */
export function receiptFileError(file) {
  if (!isAcceptedReceiptType(file)) return 'Solo se aceptan imagenes o archivos PDF.';
  if (typeof file.size === 'number' && file.size > MAX_RECEIPT_BYTES) return 'El archivo supera el limite de 5 MB.';
  return null;
}

/**
 * Tamano legible de un archivo.
 * @param {number | undefined} bytes
 */
export function formatFileSize(bytes) {
  if (typeof bytes !== 'number') return 'tamano desconocido';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Convierte defaultTaxRate (fraccion, p. ej. 0.12) a porcentaje (12).
 * Si ya viene como porcentaje (> 1) se respeta.
 * @param {unknown} rate
 * @returns {number | null}
 */
export function taxRateToPercent(rate) {
  const value = Number(rate);
  if (rate === null || rate === undefined || !Number.isFinite(value)) return null;
  return value <= 1 ? Math.round(value * 10000) / 100 : value;
}

/** Textos legibles de los estados del pedido. */
const ORDER_STATUS_LABELS = {
  pending_verification: 'Pendiente de verificacion',
  pending: 'Pendiente',
  paid: 'Pagado',
  confirmed: 'Confirmado',
  processing: 'En proceso',
};

/**
 * Etiqueta del estado del pedido (con fallback al valor crudo).
 * @param {string} status
 */
export const orderStatusLabel = (status) => ORDER_STATUS_LABELS[status] || status || 'Sin estado';
