/**
 * Utilidades compartidas por las pantallas de inventario, compras, proveedores,
 * clientes y facturacion del panel: mensajes de error, etiquetas en espanol,
 * opciones de filtros y conversion de textos de formulario a numeros.
 */

/** Etiquetas de metodos de pago (valores exactos del backend). */
export const PAYMENT_LABELS = {
  cash_on_delivery: 'Contra entrega',
  card: 'Tarjeta',
  bank_transfer: 'Transferencia',
};

/** Opciones de metodo de pago para filtros y formularios. */
export const PAYMENT_OPTIONS = Object.keys(PAYMENT_LABELS).map((value) => ({ value, label: PAYMENT_LABELS[value] }));

/** Motivos de merma admitidos por recordLossSchema. */
export const LOSS_REASON_LABELS = { expired: 'Vencido', damaged: 'Danado' };

/** Opciones de motivo de merma. */
export const LOSS_REASON_OPTIONS = Object.keys(LOSS_REASON_LABELS).map((value) => ({
  value,
  label: LOSS_REASON_LABELS[value],
}));

/** Tipos de entidad de factura (INVOICE_ENTITY_TYPES del backend). */
export const ENTITY_TYPE_LABELS = { cliente: 'Cliente', proveedor: 'Proveedor' };

/** Opciones de tipo de entidad de factura. */
export const ENTITY_TYPE_OPTIONS = Object.keys(ENTITY_TYPE_LABELS).map((value) => ({
  value,
  label: ENTITY_TYPE_LABELS[value],
}));

/** Estados de factura (INVOICE_STATUSES del backend). */
export const INVOICE_STATUS_OPTIONS = [
  { value: 'paid', label: 'Pagada' },
  { value: 'pending_payment', label: 'Pendiente de pago' },
  { value: 'voided', label: 'Anulada' },
];

/** Categorias del catalogo para el filtro de inventario (texto libre en el backend). */
export const CATEGORY_OPTIONS = ['Tecnologia', 'Comida', 'Hogar', 'Ropa', 'Deportes'].map((value) => ({
  value,
  label: value,
}));

/** Etiqueta legible de un valor de un mapa; si no existe devuelve el valor o un guion. */
export function labelOf(map, value) {
  if (value === null || value === undefined || value === '') return '-';
  return map[value] || String(value);
}

/** Texto de presentacion: null, undefined o vacio se muestran como guion. */
export function textOr(value, fallback = '-') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

/** Estado de cuenta/registro para StatusBadge a partir de isActive. */
export function activeStatus(isActive) {
  return isActive ? 'active' : 'inactive';
}

/**
 * Mensaje legible de un ApiError: permiso (403), validacion con detalle por
 * campo, o el mensaje del backend.
 * @param {unknown} error
 * @param {string} [fallback]
 * @returns {string | null}
 */
export function describeError(error, fallback = 'Ocurrio un error inesperado.') {
  if (!error) return null;
  // 403: el rol o el permiso fino no alcanza para la accion.
  if (error.status === 403) {
    return 'No tienes permisos para realizar esta accion. Solicita acceso a un superusuario.';
  }
  // 400 de validacion: lista de { field, message } del backend.
  if (Array.isArray(error.details) && error.details.length > 0 && error.details[0] && error.details[0].field) {
    const fields = error.details.map((item) => `${item.field}: ${item.message}`).join('; ');
    return `${error.message || 'Datos invalidos'} (${fields})`;
  }
  return error.message || fallback;
}

/**
 * Convierte un texto de formulario en numero (acepta coma decimal).
 * @param {string} text
 * @returns {number} NaN si no es numerico o esta vacio.
 */
export function parseDecimal(text) {
  const raw = String(text === undefined || text === null ? '' : text).trim().replace(',', '.');
  if (raw === '' || !/^-?\d+(\.\d+)?$/.test(raw)) return NaN;
  return Number(raw);
}

/** Indica si un numero tiene como maximo dos decimales. */
export function hasMaxTwoDecimals(value) {
  return Number.isFinite(value) && Math.abs(Math.round(value * 100) - value * 100) < 1e-6;
}

/** Redondea a centavos para evitar errores de coma flotante. */
export function roundMoney(value) {
  return Math.round(Number(value) * 100) / 100;
}

/** Fecha de hoy en formato AAAA-MM-DD (hora local). */
export function todayIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}
