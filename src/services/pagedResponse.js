/**
 * Utilidades compartidas por los servicios de admin y superusuario para
 * normalizar las respuestas del backend ({ data, meta }).
 */

/**
 * Convierte la respuesta de un listado en { items, meta }.
 * @param {{ data?: any[], meta?: object } | null} response
 * @returns {{ items: any[], meta: { total: number, page: number, limit: number, totalPages: number } }}
 */
export function toPage(response) {
  const items = Array.isArray(response?.data) ? response.data : [];
  const meta = response?.meta || {};
  // Valores por defecto coherentes cuando el backend no envia meta completa.
  return {
    items,
    meta: {
      ...meta,
      total: Number.isFinite(meta.total) ? meta.total : items.length,
      page: Number.isFinite(meta.page) ? meta.page : 1,
      limit: Number.isFinite(meta.limit) ? meta.limit : items.length,
      totalPages: Number.isFinite(meta.totalPages) ? meta.totalPages : 1,
    },
  };
}

/**
 * Extrae `data` de una respuesta de detalle o mutacion (null en 204).
 * @param {{ data?: any } | null} response
 * @returns {any}
 */
export function toData(response) {
  return response?.data ?? null;
}

/** Codifica un id para usarlo como segmento de ruta. */
export function seg(id) {
  return encodeURIComponent(String(id));
}
