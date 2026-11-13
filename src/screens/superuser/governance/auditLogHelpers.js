/**
 * Reglas puras del visor de audit_logs (GET /superuser/audit-logs, superuserAuditLogsQuerySchema):
 * opciones de filtros, validacion local de la consulta y serializacion JSON legible.
 */

/** Colecciones conocidas (COLLECTIONS del backend) para el filtro targetCollection. */
export const AUDIT_COLLECTIONS = [
  'users',
  'products',
  'coupons',
  'orders',
  'invoices',
  'suppliers',
  'audit_logs',
  'carts',
  'counters',
  'purchases',
  'inventory_losses',
  'system_settings',
];

/** Tamanos de pagina ofrecidos (limit maximo del backend: 100). */
export const AUDIT_PAGE_SIZES = [20, 50, 100];

/** Patrones de validacion iguales al backend. */
const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;
const ACTION_PATTERN = /^[a-z_]+\.[a-z_]+$/;
const ISO_8601_PATTERN = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?)?$/;

/** Comprueba que una fecha AAAA-MM-DD exista en el calendario. */
function isRealDate(value) {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/**
 * Valida los filtros antes de aplicarlos.
 * @param {{ actorId?: string, action?: string, startDate?: string, endDate?: string }} values
 * @returns {string | null} Mensaje de error o null.
 */
export function validateAuditFilters(values) {
  const actorId = String(values.actorId || '').trim();
  if (actorId && !OBJECT_ID_PATTERN.test(actorId)) return 'El id del actor debe tener 24 caracteres hexadecimales.';
  const action = String(values.action || '').trim();
  if (action && (action.length > 80 || !ACTION_PATTERN.test(action))) {
    return 'La accion debe tener el formato entidad.accion, por ejemplo record.purged.';
  }
  // Fechas ISO 8601 reales y con inicio <= fin.
  const start = String(values.startDate || '').trim();
  const end = String(values.endDate || '').trim();
  for (const [label, value] of [['inicial', start], ['final', end]]) {
    if (value && (!ISO_8601_PATTERN.test(value) || !isRealDate(value))) {
      return `La fecha ${label} no es valida (usa AAAA-MM-DD).`;
    }
  }
  if (start && end && start.slice(0, 10) > end.slice(0, 10)) {
    return 'La fecha inicial debe ser anterior o igual a la final.';
  }
  return null;
}

/**
 * Texto JSON con sangria para el panel de detalle.
 * @param {unknown} value
 * @returns {string}
 */
export function toPrettyJson(value) {
  if (value === null || value === undefined) return 'null';
  try {
    return JSON.stringify(value, null, 2);
  } catch (unserializable) {
    return String(value);
  }
}
