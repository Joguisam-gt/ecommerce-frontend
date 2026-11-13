/**
 * Traduccion de errores del modulo de superusuario (ApiError del apiClient) a textos claros en espanol
 * y extraccion de los errores por campo de VALIDATION_ERROR. Modulo puro: sin dependencias de React.
 */

/** Mensajes por codigo de error del backend (Fase 4 y comunes). */
const MESSAGES_BY_CODE = {
  NETWORK_ERROR: 'No se pudo conectar con el servidor. Revisa tu conexion e intenta de nuevo.',
  UNAUTHORIZED: 'Tu sesion expiro. Inicia sesion de nuevo.',
  AUTH_REQUIRED: 'Tu sesion expiro. Inicia sesion de nuevo.',
  SESSION_REVOKED: 'Tu sesion fue revocada. Inicia sesion de nuevo.',
  FORBIDDEN: 'No tienes permiso para esta operacion (solo superusuario).',
  VALIDATION_ERROR: 'Hay datos invalidos. Revisa los campos marcados.',
  LAST_SUPERUSER: 'No se puede aplicar: debe quedar al menos otro superusuario activo en el sistema.',
  SELF_LOCKOUT: 'No puedes degradar ni desactivar tu propia cuenta de superusuario.',
  SELF_MODIFICATION_FORBIDDEN: 'No puedes modificar el rol ni el estado de tu propia cuenta.',
  USER_NOT_FOUND: 'La cuenta ya no existe. Recarga el listado.',
  EMAIL_IN_USE: 'Ese correo ya esta registrado en otra cuenta.',
  ROLE_NOT_STAFF: 'Solo se puede crear personal con rol Administrador o Superusuario.',
  INVALID_ROLE: 'Rol invalido.',
  INVALID_STATUS: 'Estado invalido.',
  EMPTY_UPDATE: 'No hay cambios validos para guardar.',
  DUPLICATE_BANK_ACCOUNT: 'Hay cuentas bancarias repetidas (mismo banco y numero).',
  RECORD_NOT_FOUND: 'No se encontro ningun registro con ese id en la coleccion elegida.',
  NOT_FOUND: 'No se encontro el recurso solicitado.',
  NOT_SOFT_DELETED:
    'El registro sigue activo. Desactivalo primero (borrado logico) y luego vuelve a intentar la purga.',
  FISCAL_INTEGRITY_LOCK:
    'Bloqueo de integridad fiscal: el registro esta referenciado por pedidos, facturas o compras y no puede purgarse.',
  SUPPLIER_HAS_PRODUCTS: 'El proveedor aun tiene productos asociados. Reasignalos o purgalos antes.',
  SELF_PURGE: 'No puedes purgar tu propia cuenta.',
  PURGE_CONFLICT: 'El registro cambio durante la purga. Vuelve a intentarlo.',
  COLLECTION_NOT_PURGEABLE: 'La coleccion elegida no admite purga.',
};

/** Mensajes por estado HTTP cuando el codigo no es conocido. */
const MESSAGES_BY_STATUS = {
  400: 'La solicitud no es valida.',
  401: 'Tu sesion expiro. Inicia sesion de nuevo.',
  403: 'No tienes permiso para esta operacion (solo superusuario).',
  404: 'No se encontro el recurso solicitado.',
  409: 'La operacion entra en conflicto con el estado actual de los datos.',
  500: 'Error interno del servidor. Intenta mas tarde.',
};

/**
 * Convierte un error en un texto claro. `overrides` permite personalizar mensajes por codigo.
 * @param {any} error ApiError u otro Error.
 * @param {Record<string, string>} [overrides]
 * @returns {string}
 */
export function describeApiError(error, overrides = {}) {
  if (!error) return '';
  const code = error.code;
  // Prioridad: mensaje especifico de la pantalla, catalogo por codigo, catalogo por estado, mensaje crudo.
  if (code && overrides[code]) return overrides[code];
  if (code && MESSAGES_BY_CODE[code]) return MESSAGES_BY_CODE[code];
  if (error.status && MESSAGES_BY_STATUS[error.status] && !error.message) return MESSAGES_BY_STATUS[error.status];
  return error.message || MESSAGES_BY_STATUS[error.status] || 'Ocurrio un error inesperado.';
}

/**
 * Extrae los errores por campo de un VALIDATION_ERROR (`details: [{ field, message }]`).
 * @param {any} error
 * @returns {Record<string, string>} Mapa campo -> mensaje (el primero de cada campo).
 */
export function fieldErrorsFromApi(error) {
  const map = {};
  if (!error || !Array.isArray(error.details)) return map;
  error.details.forEach((item) => {
    // Solo se aceptan elementos con la forma { field, message }.
    if (item && typeof item.field === 'string' && !map[item.field]) {
      map[item.field] = String(item.message || 'Valor invalido');
    }
  });
  return map;
}

/**
 * Resume `details.references` de FISCAL_INTEGRITY_LOCK / SUPPLIER_HAS_PRODUCTS ("orders: 3, invoices: 1").
 * @param {any} error
 * @returns {string}
 */
export function describeReferences(error) {
  const references = error && error.details && error.details.references;
  if (!references || typeof references !== 'object') return '';
  return Object.entries(references)
    .filter(([, count]) => Number(count) > 0)
    .map(([key, count]) => `${key}: ${count}`)
    .join(', ');
}
