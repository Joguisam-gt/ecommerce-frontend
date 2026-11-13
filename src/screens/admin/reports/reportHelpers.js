/**
 * Utilidades compartidas por el dashboard y los reportes: rangos de fechas,
 * limpieza de queries segun el validator del backend, etiquetas y mensajes de error.
 */
import { PAYMENT_METHOD_LABELS } from '../../../config/constants';

/** Campos que acepta generalReportQuerySchema (el backend rechaza campos extra como page/limit). */
export const GENERAL_REPORT_KEYS = ['startDate', 'endDate', 'category', 'productName', 'lowStockThreshold', 'topLimit'];

/** Campos que acepta supplierPerformanceQuerySchema. */
export const SUPPLIER_PERFORMANCE_KEYS = ['startDate', 'endDate'];

/** Patron de fecha corta AAAA-MM-DD. */
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Rellena con cero a la izquierda. */
const pad = (n) => String(n).padStart(2, '0');

/**
 * Convierte una fecha local a AAAA-MM-DD.
 * @param {Date} date
 * @returns {string}
 */
export function toDayString(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Muestra una fecha AAAA-MM-DD como DD/MM/AAAA sin pasar por Date (evita desfases de zona horaria).
 * @param {string} day
 * @returns {string}
 */
export function dayLabel(day) {
  if (typeof day !== 'string' || !DAY_PATTERN.test(day)) return day || '';
  const [y, m, d] = day.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Rango por defecto: ultimos `days` dias hasta hoy (fechas locales AAAA-MM-DD).
 * @param {number} [days=30]
 * @returns {{ startDate: string, endDate: string }}
 */
export function lastDaysRange(days = 30) {
  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - days);
  return { startDate: toDayString(start), endDate: toDayString(end) };
}

/**
 * Deja solo las claves admitidas por el backend y descarta valores vacios.
 * @param {object} query Query de useQueryFilters (incluye page y limit).
 * @param {string[]} allowedKeys
 * @returns {object}
 */
export function pickQuery(query, allowedKeys) {
  const result = {};
  allowedKeys.forEach((key) => {
    const value = query ? query[key] : undefined;
    if (value === undefined || value === null || value === '' || value === 'all') return;
    result[key] = typeof value === 'string' ? value.trim() : value;
  });
  return result;
}

/**
 * Valida localmente un rango de fechas (mismo criterio que dateRangeRefine del backend).
 * @param {{ startDate?: string, endDate?: string }} range
 * @returns {string | null} Mensaje de error o null.
 */
export function validateDateRange({ startDate, endDate } = {}) {
  if (startDate && !DAY_PATTERN.test(startDate)) return 'La fecha "desde" debe tener formato AAAA-MM-DD.';
  if (endDate && !DAY_PATTERN.test(endDate)) return 'La fecha "hasta" debe tener formato AAAA-MM-DD.';
  if (startDate && endDate && endDate < startDate) return 'La fecha "hasta" debe ser igual o posterior a "desde".';
  return null;
}

/** Etiqueta legible de un metodo de pago. */
export function paymentMethodLabel(method) {
  return PAYMENT_METHOD_LABELS[method] || method || 'Sin metodo';
}

/** Etiquetas de los motivos de merma (LOSS_REASONS del backend). */
export const LOSS_REASON_LABELS = { expired: 'Vencidos', damaged: 'Danados' };

/** Etiqueta legible de un motivo de merma. */
export function lossReasonLabel(reason) {
  return LOSS_REASON_LABELS[reason] || reason || 'Otro';
}

/**
 * Mensaje legible de un error (ApiError o Error generico).
 * @param {any} error
 * @returns {string}
 */
export function errorMessage(error) {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (error.status === 0) return 'No se pudo conectar con el servidor. Revisa tu conexion.';
  return error.message || 'Ocurrio un error inesperado.';
}

/**
 * Convierte los detalles de un VALIDATION_ERROR ([{ field, message }]) en un mapa por campo.
 * @param {any} details
 * @returns {Record<string, string>}
 */
export function fieldErrorsFromDetails(details) {
  if (!Array.isArray(details)) return {};
  return details.reduce((acc, item) => {
    if (item && item.field && !acc[item.field]) acc[item.field] = item.message;
    return acc;
  }, {});
}

/**
 * Suma un campo numerico de una lista.
 * @param {object[]} rows
 * @param {string} key
 */
export function sumBy(rows, key) {
  return (rows || []).reduce((acc, row) => acc + (Number(row[key]) || 0), 0);
}
