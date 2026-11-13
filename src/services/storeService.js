/**
 * Servicio del catalogo publico (GET /store/products).
 */
import { apiClient } from './apiClient';

/**
 * Lista productos con filtros y paginacion.
 * La categoria 'Todas' se trata como sin filtro.
 * @param {{ page?, limit?, category?, featured?, onSale?, newArrivals?, topRated?, search?, sort? }} [params]
 * @returns {Promise<{ items: object[], meta: object }>}
 */
export async function listProducts(params = {}) {
  const query = { ...params };
  if (query.category === 'Todas') delete query.category;
  const response = await apiClient.get('/store/products', { query });
  return { items: response?.data ?? [], meta: response?.meta ?? {} };
}

/**
 * Obtiene el detalle de un producto activo.
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function getProduct(id) {
  const response = await apiClient.get(`/store/products/${encodeURIComponent(id)}`);
  return response?.data ?? null;
}

export default { listProducts, getProduct };
