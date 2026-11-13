/**
 * Servicio de reportes (/admin/reports). Estos endpoints no paginan y el backend
 * rechaza parametros desconocidos, por eso se retiran `page` y `limit` del query.
 */
import { apiClient } from '../apiClient';
import { seg, toData } from '../pagedResponse';

/** Quita los parametros de paginacion que agrega useQueryFilters. */
function withoutPaging(query) {
  if (!query) return undefined;
  const { page, limit, ...rest } = query;
  return rest;
}

/**
 * GET /admin/reports/general
 * @param {{ startDate?: string, endDate?: string, category?: string, productName?: string,
 *   lowStockThreshold?: number, topLimit?: number }} [query]
 */
export async function getGeneralReport(query) {
  return toData(await apiClient.get('/admin/reports/general', { query: withoutPaging(query) }));
}

/**
 * GET /admin/reports/products/:id/supplier-performance
 * @param {string} productId
 * @param {{ startDate?: string, endDate?: string }} [query] (AAAA-MM-DD)
 */
export async function getSupplierPerformance(productId, query) {
  return toData(
    await apiClient.get(`/admin/reports/products/${seg(productId)}/supplier-performance`, {
      query: withoutPaging(query),
    }),
  );
}

export default { getGeneralReport, getSupplierPerformance };
